import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  User, Globe, Target, BookOpen, Flame, CheckCircle, Edit3, Save, X,
  Shield, Bell, Languages, Trophy,
} from "lucide-react";
import { getUser, refreshUser, saveUser, type User as UserType } from "../lib/auth";

const ALL_TOPICS = [
  { id: "food", label: "Food & Travel", icon: "🍜" },
  { id: "work", label: "Work & Career", icon: "💼" },
  { id: "tech", label: "Technology", icon: "💻" },
  { id: "events", label: "Current Events", icon: "📰" },
  { id: "culture", label: "Culture & Arts", icon: "🎨" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "science", label: "Science", icon: "🔬" },
  { id: "movies", label: "Movies & TV", icon: "🎬" },
];

const BADGES = [
  { icon: "🎯", label: "First Conversation", earned: true },
  { icon: "🔥", label: "7-Day Streak", earned: true },
  { icon: "🌍", label: "Globe Trotter", earned: true, sub: "5 countries" },
  { icon: "📈", label: "Band Climber", earned: true, sub: "+1.5 bands" },
  { icon: "💬", label: "Chatterbox", earned: true, sub: "50 sessions" },
  { icon: "🏆", label: "Century Club", earned: false, sub: "100 sessions" },
  { icon: "⭐", label: "Band 7 Achiever", earned: false, sub: "Reach band 7.0" },
  { icon: "🌟", label: "Elite Learner", earned: false, sub: "Band 8.0" },
];

const BANDS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState(7.5);
  const [editTopics, setEditTopics] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) navigate("/auth");
    else {
      setUser(u);
      setEditName(u.name);
      setEditTarget(u.targetBand);
      setEditTopics(u.topics);
      refreshUser().then((fresh) => {
        setUser(fresh);
        setEditName(fresh.name);
        setEditTarget(fresh.targetBand);
        setEditTopics(fresh.topics);
      }).catch(() => undefined);
    }
  }, [navigate]);

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const hours = Math.round((user.totalMinutes / 60) * 10) / 10;
  const daysAgo = Math.floor((Date.now() - new Date(user.joinedDate).getTime()) / 86400000);

  const handleSave = () => {
    const updated = { ...user, name: editName, targetBand: editTarget, topics: editTopics };
    saveUser(updated);
    setUser(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleTopic = (id: string) => {
    setEditTopics((t) => t.includes(id) ? t.filter((x) => x !== id) : [...t, id]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>My Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and learning preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-2 rounded-xl">
            <CheckCircle size={13} />
            Changes saved!
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — User card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar + info */}
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
              {initials}
            </div>
            {editing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-center text-lg font-semibold bg-secondary border border-primary/30 rounded-xl px-3 py-1.5 mb-1 focus:outline-none"
              />
            ) : (
              <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>{user.name}</h2>
            )}
            <p className="text-sm text-muted-foreground">{user.country}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Native: {user.nativeLanguage}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Member for {daysAgo} days</p>

            <div className="flex justify-center gap-4 mt-5 pt-5 border-t border-border text-center">
              <div>
                <div className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{user.totalSessions}</div>
                <div className="text-[11px] text-muted-foreground">Sessions</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{hours}h</div>
                <div className="text-[11px] text-muted-foreground">Practiced</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{user.currentBand}</div>
                <div className="text-[11px] text-muted-foreground">IELTS Band</div>
              </div>
            </div>

            {user.streak > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                <Flame size={14} className="text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">{user.streak}-day streak</span>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <X size={14} />Cancel
                  </button>
                  <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90">
                    <Save size={14} />Save
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Edit3 size={14} />Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Countries */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={15} className="text-primary" />
              <h3 className="text-sm font-semibold">Countries Connected</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.countriesConnected.map((c) => (
                <span key={c} className="text-xs bg-secondary border border-border px-2.5 py-1 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Learning Goals */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target size={16} className="text-accent" />
              <h3 className="text-sm font-semibold">Learning Goals</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Target IELTS Band</label>
                <div className="flex flex-wrap gap-2">
                  {BANDS.map((b) => (
                    <button
                      key={b}
                      onClick={() => editing && setEditTarget(b)}
                      disabled={!editing}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        (editing ? editTarget : user.targetBand) === b
                          ? "bg-accent text-[#070C1A]"
                          : "bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:cursor-default"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Current Level</label>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <Languages size={16} className="text-primary" />
                  <div>
                    <div className="text-sm font-semibold">{user.level}</div>
                    <div className="text-xs text-muted-foreground">Estimated IELTS Band {user.currentBand}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic preferences */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen size={16} className="text-violet-400" />
              <h3 className="text-sm font-semibold">Preferred Topics</h3>
              {!editing && <span className="text-xs text-muted-foreground ml-1">(edit profile to change)</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_TOPICS.map((t) => {
                const active = editing ? editTopics.includes(t.label) : user.topics.includes(t.label);
                return (
                  <button
                    key={t.id}
                    onClick={() => editing && toggleTopic(t.label)}
                    disabled={!editing}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all border disabled:cursor-default ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {active && <CheckCircle size={11} className="text-primary ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Trophy size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold">Achievements</h3>
              <span className="text-xs text-muted-foreground ml-1">{BADGES.filter((b) => b.earned).length}/{BADGES.length} earned</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BADGES.map((b) => (
                <div key={b.label} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${b.earned ? "border-amber-500/25 bg-amber-500/5" : "border-border bg-secondary opacity-40"}`}>
                  <span className={`text-2xl ${!b.earned ? "grayscale" : ""}`}>{b.icon}</span>
                  <span className="text-[11px] font-semibold leading-tight">{b.label}</span>
                  {b.sub && <span className="text-[10px] text-muted-foreground">{b.sub}</span>}
                  {b.earned && <CheckCircle size={11} className="text-amber-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Account settings */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4">Account Settings</h3>
            <div className="space-y-2">
              {[
                { icon: Bell, label: "Email notifications", sub: "Session reminders and feedback reports", enabled: true },
                { icon: Shield, label: "Profile privacy", sub: "Your profile is visible to practice partners", enabled: true },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <setting.icon size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{setting.label}</div>
                      <div className="text-xs text-muted-foreground">{setting.sub}</div>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${setting.enabled ? "bg-primary" : "bg-secondary border border-border"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${setting.enabled ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
