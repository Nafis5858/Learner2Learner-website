import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { Brain, Lightbulb, MessageSquare, Mic, MicOff, PhoneOff, Radio, Users } from "lucide-react";
import { analyzeFeedback, fetchRooms, getSocket, type ParticipantSummary, type RoomSummary, type TranscriptLine } from "../lib/realtime";
import { createSpeechCapture } from "../lib/speech";
import { getUser, refreshUser } from "../lib/auth";
import { saveLastSession } from "../lib/sessionStore";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const TOPICS = [
  "Describe a time you had to speak English under pressure.",
  "What is one tradition from your country that others should know?",
  "Which skill would help you most in your career this year?",
  "Do you prefer studying alone or with other people?",
  "What makes a conversation partner helpful?",
];

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export default function ActiveCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = (location.state as { roomId?: string } | null)?.roomId || "00000000-0000-0000-0000-000000000001";
  const user = getUser();
  const socket = useMemo(() => getSocket(), []);

  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [muted, setMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("Connecting to the room...");
  const [ending, setEnding] = useState(false);
  const [topicIndex, setTopicIndex] = useState(0);
  const [micReady, setMicReady] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<ReturnType<typeof createSpeechCapture> | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const currentUser = user || {
    id: `guest-${Date.now()}`,
    name: "Guest Learner",
    country: "Unknown",
    level: "B1",
  };

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const rooms = await fetchRooms();
        if (cancelled) return;
        const matched = rooms.find((r) => r.id === roomId) || rooms[0];
        setRoom(matched);
        setParticipants(matched?.participants || []);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setMicReady(true);
        setStatus("Microphone connected. Waiting for peers...");

        const speech = createSpeechCapture({
          speakerId: currentUser.id,
          speakerName: currentUser.name,
          onLine: (line) => socket.emit("transcript:add", line),
        });
        speechRef.current = speech;
        speech?.start();

        socket.emit("room:join", {
          roomId,
          user: {
            id: currentUser.id,
            name: currentUser.name,
            country: currentUser.country,
            level: currentUser.level,
          },
        });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not access microphone.");
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    const onPeers = async (peers: ParticipantSummary[]) => {
      setParticipants((prev) => mergeParticipants(prev, peers));
      for (const peer of peers) {
        await createPeer(peer.id, true);
      }
    };

    const onJoined = (participant: ParticipantSummary) => {
      setParticipants((prev) => mergeParticipants(prev, [participant]));
      setStatus(`${participant.name} joined the room.`);
    };

    const onLeft = ({ id }: { id: string }) => {
      closePeer(id);
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    };

    const onParticipants = (next: ParticipantSummary[]) => setParticipants(next);

    const onOffer = async ({ from, description }: { from: string; description: RTCSessionDescriptionInit }) => {
      const pc = await createPeer(from, false);
      await pc.setRemoteDescription(description);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("signal:answer", { to: from, description: answer });
    };

    const onAnswer = async ({ from, description }: { from: string; description: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current.get(from);
      if (pc) await pc.setRemoteDescription(description);
    };

    const onIce = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current.get(from);
      if (pc && candidate) await pc.addIceCandidate(candidate);
    };

    const onLine = (line: TranscriptLine) => {
      setTranscript((prev) => [...prev, { ...line, isYou: line.speakerId === currentUser.id }]);
    };

    socket.on("room:peers", onPeers);
    socket.on("room:participant-joined", onJoined);
    socket.on("room:participant-left", onLeft);
    socket.on("room:participants", onParticipants);
    socket.on("signal:offer", onOffer);
    socket.on("signal:answer", onAnswer);
    socket.on("signal:ice", onIce);
    socket.on("transcript:line", onLine);

    return () => {
      socket.off("room:peers", onPeers);
      socket.off("room:participant-joined", onJoined);
      socket.off("room:participant-left", onLeft);
      socket.off("room:participants", onParticipants);
      socket.off("signal:offer", onOffer);
      socket.off("signal:answer", onAnswer);
      socket.off("signal:ice", onIce);
      socket.off("transcript:line", onLine);
    };
  }, [socket]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  async function createPeer(peerId: string, initiator: boolean) {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(peerId, pc);

    localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit("signal:ice", { to: peerId, candidate: event.candidate });
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      attachRemoteAudio(peerId, stream);
      setStatus("Live audio connected.");
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
        closePeer(peerId);
      }
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("signal:offer", { to: peerId, description: offer });
    }

    return pc;
  }

  function attachRemoteAudio(peerId: string, stream: MediaStream) {
    const host = audioRef.current;
    if (!host) return;
    let audio = host.querySelector<HTMLAudioElement>(`audio[data-peer="${peerId}"]`);
    if (!audio) {
      audio = document.createElement("audio");
      audio.dataset.peer = peerId;
      audio.autoplay = true;
      audio.playsInline = true;
      host.appendChild(audio);
    }
    audio.srcObject = stream;
  }

  function closePeer(peerId: string) {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);
    audioRef.current?.querySelector(`audio[data-peer="${peerId}"]`)?.remove();
  }

  function cleanup() {
    speechRef.current?.stop();
    socket.emit("room:leave");
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    socket.emit("participant:mute", { muted: next });
  }

  async function leaveAndAnalyze() {
    setEnding(true);
    setStatus("Ending call and generating feedback...");
    cleanup();

    let feedback = null;
    try {
      feedback = await analyzeFeedback({
        userName: currentUser.name,
        roomId,
        roomName: room?.name || "Practice Room",
        topic: room?.topic || "Free Talk",
        duration: elapsed,
        transcript,
      });
    } catch (error) {
      feedback = {
        overallBand: 0,
        fluencyScore: 0,
        grammarScore: 0,
        vocabularyScore: 0,
        coherenceScore: 0,
        pronunciationScore: 0,
        corrections: [],
        vocabularySuggestions: [],
        summary: error instanceof Error ? error.message : "AI feedback failed.",
        nextSteps: ["Check that the backend is running and OPENAI_API_KEY is configured."],
      };
    }

    saveLastSession({
      roomName: room?.name || "Practice Room",
      topic: room?.topic || "Free Talk",
      duration: elapsed,
      transcript,
      feedback,
    });
    await refreshUser().catch(() => undefined);
    navigate("/feedback");
  }

  const peersConnected = participants.filter((p) => p.id !== currentUser.id).length;

  return (
    <div className="h-screen bg-[#040810] flex flex-col overflow-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes speakPing { 0%{transform:scale(1);opacity:.5;} 70%,100%{transform:scale(1.25);opacity:0;} }
      `}</style>
      <div ref={audioRef} className="hidden" />

      {ending && (
        <div className="absolute inset-0 z-50 bg-[#040810]/95 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-accent mb-4 animate-spin" />
          <p className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Generating AI feedback</p>
          <p className="text-sm text-white/40 mt-2">Using the transcript from this real call</p>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{room?.name || "Practice Room"}</p>
            <p className="text-xs text-white/40">{room?.topic || "Free Talk"} - {room?.level || "B1-B2"} - {participants.length}/{room?.maxParticipants || 8} in room</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/35">
            <Brain size={13} className="text-accent" />
            <span>{transcript.length} transcript lines</span>
          </div>
          <span className="text-sm text-white/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="mb-5 bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Lightbulb size={15} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider mb-1">Conversation prompt</p>
              <p className="text-sm text-white/85 leading-relaxed">{TOPICS[topicIndex]}</p>
            </div>
            <button onClick={() => setTopicIndex((value) => (value + 1) % TOPICS.length)} className="text-xs font-semibold text-primary hover:text-white">Next</button>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mb-6">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <StatusPill icon={<Radio size={14} />} label={socket.connected ? "Signaling online" : "Connecting"} active={socket.connected} />
              <StatusPill icon={<Mic size={14} />} label={micReady ? "Microphone ready" : "Microphone needed"} active={micReady} />
              <StatusPill icon={<Users size={14} />} label={`${peersConnected} peer${peersConnected === 1 ? "" : "s"} connected`} active={peersConnected > 0} />
            </div>
            <p className="text-xs text-white/35 mt-3">{status}</p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              <ParticipantTile name={currentUser.name} sub="You" muted={muted} active />
              {participants.filter((p) => p.id !== currentUser.id).map((p) => (
                <ParticipantTile key={p.id} name={p.name} sub={p.country || p.level || "Learner"} muted={p.isMuted} active />
              ))}
              {participants.length <= 1 && (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/35">
                  Open this site in another browser or send the URL to another person on the same running server to test a real call.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-8 flex-wrap">
            <ControlButton onClick={() => setShowTranscript((v) => !v)} label="Transcript" active={showTranscript}>
              <MessageSquare size={18} />
            </ControlButton>
            <ControlButton onClick={toggleMute} label={muted ? "Unmute" : "Mute"} active={!muted} primary>
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </ControlButton>
            <ControlButton onClick={leaveAndAnalyze} label="Leave" danger>
              <PhoneOff size={18} />
            </ControlButton>
          </div>
        </main>

        <aside className={`${showTranscript ? "flex" : "hidden"} flex-col w-80 shrink-0 border-l border-white/5 bg-[#060B15]`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-accent" />
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Live Transcript</span>
            </div>
            <span className="text-[10px] text-white/30">{transcript.length} lines</span>
          </div>
          <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcript.length === 0 ? (
              <p className="text-xs text-white/35 leading-relaxed">
                Speak in English. In Chrome/Edge, final speech-recognition lines will appear here and will be sent to AI feedback.
              </p>
            ) : (
              transcript.map((line, index) => (
                <div key={line.id || index}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: line.isYou ? "#4B7EFA" : "#00D8A6" }}>{line.speakerName}</p>
                  <p className="text-xs text-white/65 leading-relaxed mt-1">{line.text}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function mergeParticipants(current: ParticipantSummary[], incoming: ParticipantSummary[]) {
  const byId = new Map(current.map((p) => [p.id, p]));
  incoming.forEach((p) => byId.set(p.id, p));
  return [...byId.values()];
}

function StatusPill({ icon, label, active }: { icon: ReactNode; label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${active ? "border-accent/30 bg-accent/10 text-accent" : "border-white/10 bg-white/5 text-white/35"}`}>
      {icon}
      {label}
    </span>
  );
}

function ParticipantTile({ name, sub, muted, active }: { name: string; sub: string; muted: boolean; active: boolean }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {active && <div className="absolute inset-0 rounded-full border-2 border-accent/60" style={{ animation: "speakPing 1.4s ease-out infinite" }} />}
        <div className="relative w-20 h-20 rounded-full bg-[#0D1428] border border-white/10 flex items-center justify-center text-xl font-bold text-primary">
          {initials}
          {muted && <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#040810] border border-white/10 flex items-center justify-center"><MicOff size={12} className="text-red-400" /></span>}
        </div>
      </div>
      <span className="text-sm font-semibold text-white/80">{name}</span>
      <span className="text-xs text-white/35">{sub}</span>
    </div>
  );
}

function ControlButton({ children, label, onClick, active, primary, danger }: { children: ReactNode; label: string; onClick: () => void; active?: boolean; primary?: boolean; danger?: boolean }) {
  const color = danger ? "bg-red-500/15 text-red-400 border border-red-500/25" : primary ? "bg-primary text-white" : active ? "bg-primary/20 text-primary" : "bg-white/8 text-white/50";
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${color}`}>
        {children}
      </div>
      <span className="text-[10px] text-white/30">{label}</span>
    </button>
  );
}
