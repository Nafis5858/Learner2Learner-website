import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  TrendingUp, BarChart3, Globe, Trophy, Flame, Target,
  MessageSquare, Clock, ArrowRight, ChevronRight, CheckCircle, Users, Brain, Sparkles,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { getSessionHistory, getUser, refreshUser, type User } from "../lib/auth";

const bandHistory = [
  { date: "Feb 1", band: 5.0, sessions: 2 },
  { date: "Feb 10", band: 5.0, sessions: 3 },
  { date: "Feb 20", band: 5.5, sessions: 4 },
  { date: "Mar 2", band: 5.5, sessions: 3 },
  { date: "Mar 15", band: 5.5, sessions: 5 },
  { date: "Mar 28", band: 6.0, sessions: 4 },
  { date: "Apr 10", band: 6.0, sessions: 6 },
  { date: "Apr 22", band: 6.0, sessions: 5 },
  { date: "May 3", band: 6.5, sessions: 7 },
  { date: "May 18", band: 6.5, sessions: 5 },
];

const weeklyData = [
  { week: "Apr 14", sessions: 3, minutes: 55 },
  { week: "Apr 21", sessions: 5, minutes: 95 },
  { week: "Apr 28", sessions: 2, minutes: 40 },
  { week: "May 5", sessions: 6, minutes: 120 },
  { week: "May 12", sessions: 7, minutes: 140 },
  { week: "May 19", sessions: 4, minutes: 80 },
];

const errorBreakdown = [
  { type: "Tense Errors", count: 34, pct: 42 },
  { type: "Article Usage", count: 19, pct: 23 },
  { type: "Prepositions", count: 14, pct: 17 },
  { type: "Word Choice", count: 10, pct: 12 },
  { type: "Comparatives", count: 5, pct: 6 },
];

const allSessions = [
  { id: 1, partner: "Ana", flag: "🇧🇷", topic: "Food & Travel", duration: "18 min", band: 6.5, date: "May 18, 2026", errors: 3 },
  { id: 2, partner: "Emily", flag: "🇬🇧", topic: "Work & Career", duration: "22 min", band: 6.5, date: "May 17, 2026", errors: 5 },
  { id: 3, partner: "Kenji", flag: "🇯🇵", topic: "Technology", duration: "15 min", band: 6.0, date: "May 15, 2026", errors: 7 },
  { id: 4, partner: "Maria", flag: "🇪🇸", topic: "Culture & Arts", duration: "25 min", band: 6.5, date: "May 13, 2026", errors: 4 },
  { id: 5, partner: "Fatima", flag: "🇸🇦", topic: "Daily Life", duration: "20 min", band: 6.0, date: "May 11, 2026", errors: 6 },
  { id: 6, partner: "Lucas", flag: "🇫🇷", topic: "Travel Stories", duration: "30 min", band: 6.5, date: "May 9, 2026", errors: 3 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs space-y-1">
      <div className="font-semibold text-muted-foreground">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="text-foreground font-bold">{p.name === "band" ? `Band ${p.value}` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

type View = "overview" | "sessions";

export default function Progress() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("overview");
  const [savedSessions, setSavedSessions] = useState<any[]>([]);

  useEffect(() => {
    const u = getUser();
    if (!u) navigate("/auth");
    else {
      setUser(u);
      refreshUser().then(setUser).catch(() => undefined);
      getSessionHistory().then((sessions) => setSavedSessions(Array.isArray(sessions) ? sessions : [])).catch(() => undefined);
    }
  }, [navigate]);

  if (!user) return null;

  const hours = Math.round((user.totalMinutes / 60) * 10) / 10;
  const bandGain = (user.currentBand - 5.0).toFixed(1);
  const visibleSessions = savedSessions.length > 0
    ? savedSessions.map((session) => ({
      id: session.id,
      partner: session.roomName,
      flag: "",
      topic: session.topic,
      duration: `${Math.max(1, Math.round(session.duration / 60))} min`,
      band: session.overallBand || session.feedback?.overallBand || "N/A",
      date: new Date(session.createdAt).toLocaleDateString(),
      errors: session.feedback?.corrections?.length || 0,
    }))
    : allSessions;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>My Progress</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your English improvement over time</p>
        </div>
        <div className="flex bg-secondary rounded-xl p-1 gap-1">
          {(["overview", "sessions"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "overview" && (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: TrendingUp, color: "text-accent", bg: "bg-accent/10", label: "Band Progress", value: `+${bandGain}`, sub: `${user.currentBand} current band` },
              { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10", label: "Total Sessions", value: user.totalSessions.toString(), sub: "conversations" },
              { icon: Clock, color: "text-violet-400", bg: "bg-violet-500/10", label: "Hours Practiced", value: `${hours}h`, sub: `${user.totalMinutes} minutes total` },
              { icon: Globe, color: "text-amber-400", bg: "bg-amber-500/10", label: "Countries", value: user.countriesConnected.length.toString(), sub: "partners worldwide" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon size={17} className={s.color} /></div>
                <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                <div className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* IELTS trend */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold">IELTS Band History</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Estimated band score across all sessions</p>
              </div>
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-xl">
                <TrendingUp size={13} className="text-accent" />
                <span className="text-xs font-bold text-accent">+{bandGain} since start</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bandHistory} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#6B80A8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[4.5, 7.5]} tick={{ fill: "#6B80A8", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="band" stroke="#00D8A6" strokeWidth={2.5} dot={{ fill: "#00D8A6", strokeWidth: 0, r: 4 }} activeDot={{ fill: "#00D8A6", r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Weekly sessions */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-1">Sessions per Week</h2>
              <p className="text-xs text-muted-foreground mb-5">Consistency is the key to improvement</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData} margin={{ top: 0, right: 5, bottom: 0, left: -25 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#6B80A8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B80A8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill={i === weeklyData.length - 1 ? "#4B7EFA" : "#4B7EFA40"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Error breakdown */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-1">Common Mistake Types</h2>
              <p className="text-xs text-muted-foreground mb-5">Based on all your sessions</p>
              <div className="space-y-4">
                {errorBreakdown.map((e) => (
                  <div key={e.type}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-muted-foreground">{e.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground font-medium">{e.count}</span>
                        <span className="text-[10px] text-muted-foreground/60">{e.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${e.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/15">
                <p className="text-xs text-muted-foreground"><span className="text-foreground font-semibold">Focus area:</span> Tense errors account for 42% of your mistakes. Practise past vs. present tense in your next 3 sessions.</p>
              </div>
            </div>
          </div>

          {/* Countries map */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Global Connections</h2>
              <span className="text-xs text-muted-foreground">{user.countriesConnected.length} countries</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {user.countriesConnected.map((c) => (
                <div key={c} className="flex items-center gap-2 bg-secondary border border-border px-3 py-2 rounded-xl">
                  <span className="text-base">{c.split(" ").pop()}</span>
                  <span className="text-xs font-medium">{c.split(" ").slice(0, -1).join(" ")}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 bg-secondary/50 border border-dashed border-border px-3 py-2 rounded-xl text-muted-foreground">
                <Globe size={14} />
                <span className="text-xs">+{Math.max(0, user.totalSessions - user.countriesConnected.length)} more</span>
              </div>
            </div>
          </div>

          {/* Target progress */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center"><Target size={22} className="text-primary" /></div>
              <div>
                <h3 className="font-semibold text-sm">Target: Band {user.targetBand}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You're {user.currentBand >= user.targetBand ? "there! 🎉" : `${(user.targetBand - user.currentBand).toFixed(1)} bands away from your goal`}
                </p>
              </div>
            </div>
            <Link to="/find-partner" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Practice Now
              <ArrowRight size={15} />
            </Link>
          </div>
        </>
      )}

      {view === "sessions" && (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold">All Sessions ({allSessions.length})</h2>
              <span className="text-xs text-muted-foreground">Sorted by most recent</span>
            </div>
            <div>
              {visibleSessions.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-secondary/40 transition-colors cursor-pointer ${i < visibleSessions.length - 1 ? "border-b border-border" : ""}`} onClick={() => navigate("/feedback")}>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">{s.flag}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{s.partner}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{s.topic} · {s.duration}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-accent mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Band {s.band}</div>
                    <div className="text-[11px] text-muted-foreground">{s.date}</div>
                  </div>
                  <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">{s.errors} errors</div>
                  <ChevronRight size={14} className="text-muted-foreground/50" />
                </div>
              ))}
            </div>
          </div>

          {/* Value Prop Reminder */}
          <div className="mt-6 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-2 border-primary/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                  This progress is ONLY possible with Learner2Learner
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">AI-only apps (ChatGPT, Gemini)</strong> never helped you overcome fear of real people.
                  <strong className="text-foreground"> Random chat apps</strong> gave you no feedback on mistakes.
                  Learner2Learner gives you <strong className="text-accent">both</strong> — real human practice to build confidence + AI analysis to track improvement.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-accent shrink-0" />
                    <span className="text-xs font-semibold">Real people overcome fear</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-accent shrink-0" />
                    <span className="text-xs font-semibold">AI feedback fixes mistakes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-accent shrink-0" />
                    <span className="text-xs font-semibold">Track IELTS improvement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
