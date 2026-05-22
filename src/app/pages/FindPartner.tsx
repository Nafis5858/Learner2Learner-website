import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Globe, Mic, Plus, Radio, Search, Sliders, Users, X } from "lucide-react";
import { createRoom, fetchRooms, getSocket, type RoomSummary } from "../lib/realtime";

const TOPICS = ["All", "Daily Life", "Technology", "Movies & TV", "Travel", "Grammar", "Sports", "Free Talk", "Pronunciation"];
const LEVELS = ["All", "A1-A2", "B1-B2", "B2-C1", "C1-C2"];
const CREATE_TOPICS = TOPICS.filter((t) => t !== "All");
const CREATE_LEVELS = LEVELS.filter((l) => l !== "All");
const MAX_OPTIONS = [2, 4, 6, 8, 10, 12];

export default function FindPartner() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [createTopic, setCreateTopic] = useState("Daily Life");
  const [createLevel, setCreateLevel] = useState("B1-B2");
  const [maxPax, setMaxPax] = useState(4);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    fetchRooms()
      .then((data) => mounted && setRooms(data))
      .catch((err) => mounted && setError(err instanceof Error ? err.message : "Could not load rooms."))
      .finally(() => mounted && setLoading(false));

    const socket = getSocket();
    socket.emit("rooms:list");
    socket.on("rooms:update", setRooms);

    return () => {
      mounted = false;
      socket.off("rooms:update", setRooms);
    };
  }, []);

  const filtered = useMemo(() => {
    return rooms.filter((room) => {
      const q = search.toLowerCase();
      const matchSearch = room.name.toLowerCase().includes(q) || room.topic.toLowerCase().includes(q);
      const matchTopic = topicFilter === "All" || room.topic === topicFilter;
      const matchLevel = levelFilter === "All" || room.level === levelFilter;
      return matchSearch && matchTopic && matchLevel;
    });
  }, [rooms, search, topicFilter, levelFilter]);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    const room = await createRoom({
      name: roomName.trim(),
      topic: createTopic,
      level: createLevel,
      maxParticipants: maxPax,
    });
    setShowCreate(false);
    navigate("/call", { state: { roomId: room.id } });
  };

  const totalPeople = rooms.reduce((sum, room) => sum + room.participants.length, 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.85);}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
      `}</style>

      <div className="relative rounded-2xl overflow-hidden mb-8 border border-border bg-card p-8" style={{ animation: "slideUp 0.5s ease-out" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-transparent to-accent/10" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-bold mb-4">
              <Radio size={12} />
              Real WebRTC voice rooms
            </div>
            <h1 className="text-4xl font-semibold mb-3" style={{ fontFamily: "'Fraunces', serif" }}>Find a Real Conversation</h1>
            <p className="text-muted-foreground max-w-2xl">
              Create or join a live room. Your browser microphone connects directly to other learners, while transcripts are captured for AI feedback.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90"
          >
            <Plus size={16} />
            Create Room
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search live rooms"
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Sliders size={14} className="text-muted-foreground shrink-0" />
          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none">
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none">
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ animation: "pulse 2s ease-in-out infinite" }} />
          {rooms.length} rooms live
        </span>
        <span className="text-xs text-muted-foreground">- {totalPeople} people connected now</span>
      </div>

      {error && <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">Loading live rooms...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Globe size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No live rooms match your filters.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-primary text-sm hover:underline font-medium">Create one now</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={() => navigate("/call", { state: { roomId: room.id } })} />
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Create a Voice Room</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <Field label="Room Name">
                <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Sunday evening IELTS practice" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Topic">
                  <select value={createTopic} onChange={(e) => setCreateTopic(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none">
                    {CREATE_TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Level">
                  <select value={createLevel} onChange={(e) => setCreateLevel(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none">
                    {CREATE_LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Max Participants">
                <div className="flex flex-wrap gap-2">
                  {MAX_OPTIONS.map((n) => (
                    <button key={n} onClick={() => setMaxPax(n)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${maxPax === n ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleCreate} disabled={!roomName.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-40">
                <Radio size={14} />
                Go Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomCard({ room, onJoin }: { room: RoomSummary; onJoin: () => void }) {
  const isFull = room.participants.length >= room.maxParticipants;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug truncate">{room.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{room.topic}</p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold border border-border px-2 py-0.5 rounded-full text-muted-foreground">{room.level}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users size={14} />
        <span><strong className="text-foreground">{room.participants.length}</strong>/{room.maxParticipants} connected</span>
      </div>

      <div className="flex flex-wrap gap-2 min-h-8">
        {room.participants.length === 0 ? (
          <span className="text-xs text-muted-foreground">No one is inside yet. Be first.</span>
        ) : (
          room.participants.slice(0, 4).map((p) => (
            <span key={p.id} className="text-xs bg-secondary border border-border px-2.5 py-1 rounded-full">{p.name}</span>
          ))
        )}
      </div>

      <button
        onClick={onJoin}
        disabled={isFull}
        className={`mt-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
          isFull ? "bg-secondary text-muted-foreground cursor-not-allowed" : "bg-primary text-white hover:opacity-90"
        }`}
      >
        {isFull ? "Full" : (<><Mic size={12} />Join Real Call<ChevronRight size={11} /></>)}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
