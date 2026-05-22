import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, BarChart3, BookOpen, Brain, Clock, Globe, MessageSquare, Target, TrendingUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { getLastSession, type FeedbackResult } from "../lib/sessionStore";

type Tab = "corrections" | "vocabulary" | "ielts" | "transcript";

const EMPTY_FEEDBACK: FeedbackResult = {
  overallBand: 0,
  fluencyScore: 0,
  grammarScore: 0,
  vocabularyScore: 0,
  coherenceScore: 0,
  pronunciationScore: 0,
  corrections: [],
  vocabularySuggestions: [],
  summary: "No real session feedback is available yet. Join a voice room, speak, then leave the room to generate AI feedback.",
  nextSteps: ["Join a real room.", "Speak long enough for transcript capture.", "Set OPENAI_API_KEY for real AI analysis."],
};

export default function FeedbackReview() {
  const navigate = useNavigate();
  const session = getLastSession();
  const feedback = normalizeFeedback(session?.feedback || EMPTY_FEEDBACK);
  const [activeTab, setActiveTab] = useState<Tab>("corrections");

  const duration = session?.duration || 0;
  const durationLabel = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`;
  const transcript = session?.transcript || [];

  const radarData = useMemo(() => [
    { subject: "Fluency", score: feedback.fluencyScore || 0 },
    { subject: "Grammar", score: feedback.grammarScore || 0 },
    { subject: "Vocabulary", score: feedback.vocabularyScore || 0 },
    { subject: "Coherence", score: feedback.coherenceScore || 0 },
    { subject: "Pronunciation", score: feedback.pronunciationScore || 0 },
  ], [feedback]);

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "corrections", label: "Corrections", icon: Zap },
    { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
    { id: "ielts", label: "IELTS Score", icon: Target },
    { id: "transcript", label: "Transcript", icon: MessageSquare },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-bold mb-3">
            <Brain size={12} />
            Real AI Feedback
          </div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{session?.roomName || "No Session Yet"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{session?.topic || "Create or join a real call to generate feedback."}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/find-partner")} className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90">
            New Real Session
          </button>
          <Link to="/home" className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat icon={Clock} color="text-primary" bg="bg-primary/10" label="Duration" value={durationLabel} />
        <Stat icon={MessageSquare} color="text-accent" bg="bg-accent/10" label="Transcript Lines" value={transcript.length.toString()} />
        <Stat icon={Zap} color="text-amber-400" bg="bg-amber-500/10" label="Corrections" value={feedback.corrections.length.toString()} />
        <Stat icon={TrendingUp} color="text-violet-400" bg="bg-violet-500/10" label="Estimated Band" value={feedback.overallBand ? feedback.overallBand.toString() : "N/A"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-muted-foreground" />
              <span className="text-sm font-semibold">Captured Conversation</span>
            </div>
            <span className="text-[11px] text-muted-foreground">{transcript.length} lines</span>
          </div>
          <div className="p-5 max-h-[480px] overflow-y-auto space-y-4">
            {transcript.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                No transcript has been captured. Browser speech recognition works best in Chrome or Edge and requires microphone permission.
              </p>
            ) : transcript.map((line, index) => (
              <div key={line.id || index} className={`flex ${line.isYou ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${line.isYou ? "bg-primary text-white rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
                  <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1">{line.speakerName}</p>
                  <p className="text-sm leading-relaxed">{line.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`min-w-28 flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-colors ${activeTab === tab.id ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 overflow-y-auto max-h-[444px]">
            {activeTab === "corrections" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{feedback.summary}</p>
                {feedback.corrections.length === 0 ? (
                  <Empty text="No specific corrections returned yet." />
                ) : feedback.corrections.map((correction, index) => (
                  <div key={index} className="bg-secondary rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-sm text-amber-400 line-through opacity-80">{correction.bad}</span>
                      <ArrowRight size={13} className="text-muted-foreground" />
                      <span className="text-sm text-accent font-bold">{correction.good}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{correction.note}</p>
                  </div>
                ))}
                {feedback.nextSteps?.length ? (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
                    <p className="text-xs font-semibold text-primary mb-2">Next steps</p>
                    <ul className="space-y-1">
                      {feedback.nextSteps.map((step, index) => <li key={index} className="text-xs text-muted-foreground">{step}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === "vocabulary" && (
              <div className="space-y-3">
                {feedback.vocabularySuggestions.length === 0 ? (
                  <Empty text="No vocabulary suggestions returned yet." />
                ) : feedback.vocabularySuggestions.map((item, index) => (
                  <div key={index} className="bg-secondary rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground line-through">{item.original}</span>
                      <ArrowRight size={11} className="text-muted-foreground" />
                      <span className="text-sm font-bold text-accent">{item.better}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">{item.context}</p>
                    <p className="text-[11px] text-primary/80 italic" style={{ fontFamily: "'Fraunces', serif" }}>e.g. &ldquo;{item.example}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "ielts" && (
              <div>
                <div className="text-center mb-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Estimated Overall Band</p>
                  <div className="text-7xl font-semibold leading-none" style={{ fontFamily: "'Fraunces', serif" }}>{feedback.overallBand || "N/A"}</div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData} margin={{ top: 8, right: 18, bottom: 8, left: 18 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B80A8", fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 9]} tick={false} axisLine={false} />
                    <Radar dataKey="score" stroke="#4B7EFA" fill="#4B7EFA" fillOpacity={0.18} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 mt-3">
                  {radarData.map((item) => (
                    <div key={item.subject}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{item.subject}</span>
                        <span className="text-xs font-bold text-primary">{item.score || "N/A"}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((item.score || 0) / 9) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "transcript" && (
              <div className="space-y-3">
                {transcript.length === 0 ? <Empty text="No transcript lines were captured." /> : transcript.map((line, index) => (
                  <div key={line.id || index} className="bg-secondary rounded-xl p-3 border border-border">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{line.speakerName}</p>
                    <p className="text-xs text-foreground leading-relaxed">{line.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><BarChart3 size={18} className="text-accent" /></div>
          <div>
            <div className="text-sm font-semibold">Real session data is saved to Supabase</div>
            <div className="text-xs text-muted-foreground">The latest feedback is also kept in this browser for quick review.</div>
          </div>
        </div>
        <button onClick={() => navigate("/find-partner")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90">
          <Globe size={15} />
          Start Another Real Session
        </button>
      </div>
    </div>
  );
}

function normalizeFeedback(feedback: Partial<FeedbackResult> | null): FeedbackResult {
  const nextSteps = Array.isArray(feedback?.nextSteps)
    ? feedback.nextSteps
    : typeof feedback?.nextSteps === "string"
      ? feedback.nextSteps.split(/\n+/).map((line) => line.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean)
      : [];

  return {
    ...EMPTY_FEEDBACK,
    ...feedback,
    corrections: Array.isArray(feedback?.corrections) ? feedback.corrections : [],
    vocabularySuggestions: Array.isArray(feedback?.vocabularySuggestions) ? feedback.vocabularySuggestions : [],
    nextSteps,
  };
}

function Stat({ icon: Icon, color, bg, label, value }: { icon: LucideIcon; color: string; bg: string; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}><Icon size={17} className={color} /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-bold mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">{text}</div>;
}
