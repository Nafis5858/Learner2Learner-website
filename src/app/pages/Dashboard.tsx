import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Mic, MessageSquare, TrendingUp, Clock, Flame, Globe, Brain,
  ArrowRight, ChevronRight, Star,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getUser, refreshUser, type User } from "../lib/auth";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import nafisImg from "../../imports/2024_05_17_11_01_IMG_0235.JPG";
import navilImg from "../../imports/image.png";
import basherImg from "../../imports/image-1.png";

const recentSessions = [
  { id: 1, partner: "Emma", flag: "🇬🇧", country: "United Kingdom", topic: "Food & Travel", duration: "18 min", band: 6.5, date: "Today, 2:30 PM", errors: 3, photo: "https://images.unsplash.com/photo-1573497491207-618cc224f243?w=80&h=80&fit=crop" },
  { id: 2, partner: "Marcus", flag: "🇺🇸", country: "United States", topic: "Work & Career", duration: "22 min", band: 6.5, date: "Yesterday", errors: 5, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" },
  { id: 3, partner: "Yuki", flag: "🇯🇵", country: "Japan", topic: "Technology", duration: "15 min", band: 6.0, date: "May 18", errors: 7, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" },
  { id: 4, partner: "Sofia", flag: "🇪🇸", country: "Spain", topic: "Culture & Arts", duration: "25 min", band: 6.5, date: "May 17", errors: 4, photo: "https://images.unsplash.com/photo-1609371497456-3a55a205d5eb?w=80&h=80&fit=crop" },
];

const bandHistory = [
  { label: "Feb 1", band: 5.0 },
  { label: "Feb 15", band: 5.5 },
  { label: "Mar 1", band: 5.5 },
  { label: "Mar 15", band: 6.0 },
  { label: "Apr 1", band: 6.0 },
  { label: "Apr 20", band: 6.5 },
  { label: "May 8", band: 6.5 },
  { label: "May 18", band: 6.5 },
];

const liveRooms = [
  { name: "Morning English Chat ☀️", topic: "Daily Life", icon: "🌅", participants: 4, max: 8, level: "B1–B2", host: "Emma 🇬🇧" },
  { name: "Tech Talk & Business English", topic: "Technology", icon: "💻", participants: 3, max: 6, level: "B2–C1", host: "Marcus 🇺🇸" },
  { name: "Travel Stories 🌍", topic: "Travel", icon: "✈️", participants: 6, max: 12, level: "B1–B2", host: "Amara 🇬🇭" },
  { name: "Chill Convo — No Pressure 😊", topic: "Free Talk", icon: "☕", participants: 3, max: 8, level: "A1–A2", host: "Mei 🇨🇳" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs">
      <span className="text-foreground font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Band {payload[0].value}</span>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) navigate("/auth");
    else {
      setUser(u);
      refreshUser().then(setUser).catch(() => undefined);
    }
  }, [navigate]);

  if (!user) return null;

  const firstName = user.name.split(" ")[0];
  const hours = Math.round(user.totalMinutes / 60 * 10) / 10;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:translateX(0);}}
        @keyframes float{0%,100%{transform:translateY(0px);}50%{transform:translateY(-8px);}}
        @keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
      `}</style>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 h-[200px] border border-border" style={{ animation: "slideUp 0.6s ease-out" }}>
        <img
          src="https://images.unsplash.com/photo-1573497019509-d715a631bbe5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
          alt="People in conversation"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040810]/95 via-[#040810]/80 to-[#040810]/60" />
        <div className="relative h-full flex items-center justify-between px-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              {getGreeting()}, {firstName}! 🌏
            </h1>
            <p className="text-muted-foreground">
              Ready to practice? {user.streak > 0 ? `You're on a ${user.streak}-day streak. 🔥` : "Start a conversation to build your streak."}
            </p>
          </div>
          <Link to="/find-partner" className="relative flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 hover:scale-105 transition-all duration-200 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: "shimmer 3s linear infinite", backgroundSize: "200% 100%" }} />
            <Mic size={16} className="relative z-10" />
            <span className="relative z-10">Start Talking Now</span>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10", label: "Total Sessions", value: user.totalSessions.toString(), sub: "conversations", delay: 0 },
          { icon: Clock, color: "text-accent", bg: "bg-accent/10", label: "Hours Practiced", value: `${hours}h`, sub: `${user.totalMinutes} minutes total`, delay: 0.1 },
          { icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10", label: "Current IELTS Band", value: user.currentBand.toString(), sub: `Target: ${user.targetBand}`, delay: 0.2 },
          { icon: Flame, color: "text-amber-400", bg: "bg-amber-500/10", label: "Current Streak", value: `${user.streak} days`, sub: user.streak >= 7 ? "Amazing! 🔥" : "Keep going!", delay: 0.3 },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ animation: `slideUp 0.5s ease-out ${s.delay}s both` }}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`} style={{ animation: "float 3s ease-in-out infinite" }}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* IELTS Progress Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300" style={{ animation: "slideUp 0.6s ease-out 0.4s both" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">IELTS Progress</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your estimated band over time</p>
            </div>
            <Link to="/progress" className="text-xs text-primary hover:underline flex items-center gap-1">
              View full stats <ChevronRight size={13} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bandHistory} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6B80A8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[4, 8]} tick={{ fill: "#6B80A8", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="band"
                stroke="#4B7EFA"
                strokeWidth={2.5}
                dot={{ fill: "#4B7EFA", strokeWidth: 0, r: 4 }}
                activeDot={{ fill: "#4B7EFA", r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats sidebar */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:border-accent/30 hover:shadow-lg transition-all duration-300" style={{ animation: "slideUp 0.6s ease-out 0.5s both" }}>
          <div>
            <h2 className="text-base font-semibold mb-1">Global Reach</h2>
            <p className="text-xs text-muted-foreground mb-4">Countries you've spoken with</p>
            <div className="flex flex-wrap gap-2">
              {user.countriesConnected.map((c) => (
                <span key={c} className="text-xs bg-secondary border border-border px-2.5 py-1 rounded-full">{c}</span>
              ))}
              <span className="text-xs bg-secondary border border-border px-2.5 py-1 rounded-full text-muted-foreground">+{Math.max(0, user.totalSessions - user.countriesConnected.length)} more</span>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Target Band</span>
              <span className="text-sm font-bold text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{user.targetBand}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${(user.currentBand / user.targetBand) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {user.currentBand >= user.targetBand ? "Goal reached! 🎉" : `${(user.targetBand - user.currentBand).toFixed(1)} bands to go`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300" style={{ animation: "slideUp 0.6s ease-out 0.6s both" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Recent Sessions</h2>
            <Link to="/progress" className="text-xs text-primary hover:underline flex items-center gap-1">All sessions <ChevronRight size={13} /></Link>
          </div>
          <div>
            {recentSessions.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-secondary/40 transition-colors cursor-pointer ${i < recentSessions.length - 1 ? "border-b border-border" : ""}`} onClick={() => navigate("/feedback")}>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg overflow-hidden">
                  {(s as any).photo ? (
                    <ImageWithFallback src={(s as any).photo} alt={s.partner} className="w-full h-full object-cover" />
                  ) : (
                    s.flag
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{s.partner}</span>
                    <span className="text-xs text-muted-foreground">· {s.country}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{s.topic} · {s.duration}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-accent mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Band {s.band}</div>
                  <div className="text-[11px] text-muted-foreground">{s.date}</div>
                </div>
                <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">
                  {s.errors} errors
                </div>
                <ChevronRight size={14} className="text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>

        {/* Live rooms */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-lg transition-all duration-300" style={{ animation: "slideUp 0.6s ease-out 0.7s both" }}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Live Rooms</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Join a room and start talking</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-red-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ animation: "pulse 2s ease-in-out infinite" }} />
              {liveRooms.length} live
            </span>
          </div>
          <div className="p-3 space-y-2">
            {liveRooms.map((r) => (
              <Link key={r.name} to="/find-partner" className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary hover:scale-[1.02] transition-all duration-200 group">
                <span className="text-xl shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.host} · {r.participants}/{r.max} people</div>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground border border-border px-1.5 py-0.5 rounded shrink-0">{r.level}</span>
                <ArrowRight size={13} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
          <div className="p-3 pt-0">
            <Link to="/find-partner" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              <Globe size={15} />
              See All Rooms
            </Link>
          </div>
        </div>
      </div>

      {/* Practice nudge */}
      <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10 border border-primary/20 p-6 flex items-center justify-between gap-4 relative overflow-hidden group hover:border-primary/40 transition-all duration-300" style={{ animation: "slideUp 0.6s ease-out 0.5s both" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Brain size={22} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Your AI Coach has tips for you</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Based on your last 4 sessions, focus on consistent tense usage this week.</p>
          </div>
        </div>
        <Link to="/progress" className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline relative z-10">
          View tips <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
