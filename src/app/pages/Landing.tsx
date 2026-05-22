import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Mic,
  Brain,
  ArrowRight,
  Sparkles,
  Volume2,
  MessageSquare,
  BookOpen,
  Target,
  TrendingUp,
  Users,
  Zap,
  Globe,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import logo from "../../imports/905ec848-acf3-4d5a-8933-c18c0010c52a-removebg-preview.png";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";
import { getUser } from "../lib/auth";

type Segment = {
  text: string;
  isError?: boolean;
  correction?: string;
  note?: string;
};

const conversation: {
  role: "partner" | "user";
  name?: string;
  segments: Segment[];
}[] = [
  { role: "partner", name: "Ana · Brazil 🇧🇷", segments: [{ text: "Hey! What do you usually do on weekends?" }] },
  {
    role: "user",
    segments: [
      { text: "I usually go to the park. Last weekend " },
      { text: "we go", isError: true, correction: "we went", note: "Use simple past tense for completed actions" },
      { text: " to a new restaurant that opened near my house." },
    ],
  },
  { role: "partner", name: "Ana · Brazil 🇧🇷", segments: [{ text: "Oh that sounds fun! What kind of food did they serve?" }] },
  {
    role: "user",
    segments: [
      { text: "It was Italian. " },
      { text: "The foods was", isError: true, correction: "The food was", note: '"Food" is uncountable — never pluralise it' },
      { text: " very delicious and " },
      { text: "the price is", isError: true, correction: "the price was", note: "Stay consistent with past tense" },
      { text: " not too expensive." },
    ],
  },
  { role: "partner", name: "Ana · Brazil 🇧🇷", segments: [{ text: "Love Italian food! Did you try any pasta?" }] },
  {
    role: "user",
    segments: [
      { text: "Yes, I tried the carbonara. It was " },
      { text: "more better", isError: true, correction: "much better", note: '"Better" is already comparative — don\'t add "more"' },
      { text: " than what I eat at home!" },
    ],
  },
];

const vocabUpgrades = [
  { original: "very delicious", better: "exquisite", context: "More precise for fine food", example: "The carbonara was exquisite." },
  { original: "not too expensive", better: "reasonably priced", context: "Natural English collocation", example: "The restaurant is reasonably priced." },
  { original: "very good", better: "outstanding", context: "Stronger and more expressive", example: "The pasta was outstanding." },
  { original: "go to", better: "head to / pop over to", context: "More natural in spoken English", example: "We headed to a new restaurant." },
];

const radarData = [
  { subject: "Fluency", score: 6.5 },
  { subject: "Grammar", score: 5.5 },
  { subject: "Vocabulary", score: 6.0 },
  { subject: "Coherence", score: 7.0 },
  { subject: "Pronunciation", score: 6.5 },
];

const subScores = [
  { label: "Fluency & Coherence", score: 6.8, color: "#4B7EFA" },
  { label: "Lexical Resource", score: 6.0, color: "#00D8A6" },
  { label: "Grammatical Range & Accuracy", score: 5.5, color: "#A78BFA" },
  { label: "Pronunciation", score: 6.5, color: "#FB923C" },
];

const testimonials = [
  {
    name: "Yuki Tanaka",
    country: "Japan 🇯🇵",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    before: "5.0",
    after: "7.5",
    problem: "Used AI apps only",
    quote: "I was terrified of speaking with real people. ChatGPT felt safe but didn't help my fear. Learner2Learner forced me to talk to humans AND gave me feedback. My IELTS score jumped 2.5 bands in four months.",
    sessions: 84,
  },
  {
    name: "Sofia Herrera",
    country: "Colombia 🇨🇴",
    photo: "https://images.unsplash.com/photo-1609371497456-3a55a205d5eb?w=80&h=80&fit=crop",
    before: "5.5",
    after: "7.0",
    problem: "Used HelloTalk before",
    quote: "HelloTalk gave me real conversations but zero feedback. I had no idea which mistakes I was repeating. Learner2Learner shows me exactly what to improve after every call.",
    sessions: 67,
  },
  {
    name: "Amara Okafor",
    country: "Ghana 🇬🇭",
    photo: "https://images.unsplash.com/photo-1632612721400-0a337458b7ed?w=80&h=80&fit=crop",
    before: "6.0",
    after: "8.0",
    problem: "Tried both, got frustrated",
    quote: "Tried ChatGPT (too safe), tried Tandem (no feedback). Learner2Learner is the ONLY app that gives both. Band 6 to Band 8 in three months. The AI shows patterns I never noticed.",
    sessions: 142,
  },
];

function SoundWave({ color = "#4B7EFA" }: { color?: string }) {
  const heights = [3, 6, 10, 7, 4, 8, 12, 6, 4, 9, 5];
  return (
    <div className="flex items-center gap-[3px] h-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full origin-center"
          style={{
            height: `${h * 2.2}px`,
            backgroundColor: color,
            animation: `soundBar ${0.4 + (i % 5) * 0.09}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.055}s`,
          }}
        />
      ))}
    </div>
  );
}

function LiveSessionCard({ onCTA }: { onCTA: () => void }) {
  return (
    <div className="relative w-full max-w-[340px]">
      <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl scale-110 pointer-events-none" />
      <div className="relative bg-card border border-border rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-accent" style={{ animation: "pulse 2s ease-in-out infinite" }} />
            <span className="text-[11px] font-semibold text-accent tracking-[0.15em]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              LIVE SESSION
            </span>
          </div>
          <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>14:23</span>
        </div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl ring-2 ring-primary">🇮🇩</div>
            <span className="text-xs text-muted-foreground">You</span>
          </div>
          <SoundWave />
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl">🇬🇧</div>
            <span className="text-xs text-muted-foreground">Emily</span>
          </div>
        </div>
        <div className="bg-secondary rounded-xl p-3 mb-4">
          <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Live transcript</p>
          <p className="text-sm text-foreground leading-relaxed">
            "...the best place I ever{" "}
            <span className="text-amber-400 border-b border-dashed border-amber-400/50">visit</span>{" "}
            is Bali—"
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-amber-400 line-through">visit</span>
            <ArrowRight size={10} className="text-muted-foreground" />
            <span className="text-xs text-accent font-medium">visited</span>
            <span className="text-xs text-muted-foreground">(past tense)</span>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          {([Volume2, Mic, MessageSquare] as const).map((Icon, i) => (
            <button key={i} onClick={i === 1 ? onCTA : undefined} className={`w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${i === 1 ? "bg-primary hover:opacity-90" : "bg-secondary hover:opacity-80"}`}>
              <Icon size={15} className={i === 1 ? "text-white" : "text-muted-foreground"} />
            </button>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-3 right-4 flex items-center gap-1.5 bg-accent text-[#070C1A] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
        <Brain size={11} />
        AI feedback ready after call
      </div>
    </div>
  );
}

function ConversationMessage({ role, name, segments }: { role: "partner" | "user"; name?: string; segments: Segment[] }) {
  const errors = segments.filter((s) => s.isError);
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[85%] flex flex-col ${isUser ? "items-end" : "items-start"} gap-1.5`}>
        {name && <span className="text-[11px] text-muted-foreground px-1">{name}</span>}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser ? "bg-primary text-white rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
          {segments.map((seg, i) =>
            seg.isError ? (
              <span key={i} className="bg-amber-500/25 border-b border-dashed border-amber-400/70" title={seg.note}>{seg.text}</span>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </div>
        {errors.length > 0 && (
          <div className="flex flex-col gap-1 px-1">
            {errors.map((seg, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-amber-400 line-through opacity-80">{seg.text.trim()}</span>
                <ArrowRight size={9} className="text-muted-foreground" />
                <span className="text-accent font-semibold">{seg.correction}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IELTSBandScale({ score }: { score: number }) {
  const pct = ((score - 1) / 8) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Band 1</span>
        <span className="text-foreground font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
        <span>Band 9</span>
      </div>
      <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(to right, #ef4444, #f59e0b, #84cc16, #00D8A6)" }} />
      </div>
      <div className="flex justify-between mt-1.5">
        {["1","2","3","4","5","6","7","8","9"].map((b) => (
          <span key={b} className="text-[10px] text-muted-foreground/40">{b}</span>
        ))}
      </div>
    </div>
  );
}

type Tab = "corrections" | "vocabulary" | "ielts";

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("corrections");

  useEffect(() => {
    const u = getUser();
    if (u) navigate("/home");
  }, [navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToAuth = () => navigate("/auth");

  const errorCount = conversation.flatMap((m) => m.segments.filter((s) => s.isError)).length;
  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "corrections", label: "Corrections", icon: Zap },
    { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
    { id: "ielts", label: "IELTS Score", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <style>{`
        @keyframes soundBar { 0% { transform: scaleY(0.25); } 100% { transform: scaleY(1); } }
        @keyframes blobDrift1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(40px,-30px) scale(1.12);} }
        @keyframes blobDrift2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-30px,35px) scale(0.88);} }
        @keyframes blobDrift3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(20px,20px) scale(1.08);} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.85);} }
        @keyframes float { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-15px);} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px);} to{opacity:1;transform:translateY(0);} }
        @keyframes slideInLeft { from{opacity:0;transform:translateX(-30px);} to{opacity:1;transform:translateX(0);} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(30px);} to{opacity:1;transform:translateX(0);} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.9);} to{opacity:1;transform:scale(1);} }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
      `}</style>

      {/* Nav */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#070C1A]/95 backdrop-blur-lg border-b border-border" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageWithFallback src={logo} alt="Learner2Learner" className="h-10 w-auto" />
          </div>
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
            <Sparkles size={11} className="text-accent" />
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Real People + AI Feedback</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {["Features", "How It Works", "AI Feedback", "Pricing"].map((item) => (
              <a key={item} href="#" className="hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goToAuth} className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</button>
            <button onClick={goToAuth} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">Start for Free</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full bg-primary/25 blur-3xl" style={{ animation: "blobDrift1 11s ease-in-out infinite" }} />
          <div className="absolute top-1/2 right-1/6 w-80 h-80 rounded-full bg-accent/20 blur-3xl" style={{ animation: "blobDrift2 14s ease-in-out infinite" }} />
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl" style={{ animation: "blobDrift3 17s ease-in-out infinite" }} />
          <div className="absolute inset-0 opacity-[0.022]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center py-28">
          <div style={{ animation: "slideInLeft 0.8s ease-out" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/8 text-accent text-[11px] font-semibold mb-8 tracking-wider uppercase" style={{ animation: "scaleIn 0.5s ease-out" }}>
              <Sparkles size={11} />
              AI-Powered English Coaching
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-[4.25rem] font-semibold leading-[1.07] tracking-tight mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
              Talk to <em className="not-italic text-primary" style={{ animation: "float 3s ease-in-out infinite" }}>real people.</em>
              <br />
              Get <em className="not-italic text-accent">AI feedback.</em>
              <br />
              Improve faster.
            </h1>
            <div className="bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-l-4 border-accent rounded-xl p-4 mb-6 max-w-[560px]">
              <p className="text-foreground font-semibold text-base leading-relaxed">
                The ONLY platform where you practice with <strong className="text-primary">real humans</strong> <strong className="text-accent">AND</strong> get detailed <strong className="text-accent">AI analysis</strong> after every call.
              </p>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-[500px]">
              AI apps like ChatGPT can't help you overcome shyness. Random chat apps can't show you your mistakes. Learner2Learner gives you both.
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              <button onClick={goToAuth} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 hover:scale-105 transition-all duration-200">
                <Mic size={16} />
                Start a Conversation
              </button>
              <button onClick={goToAuth} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:border-primary/50 hover:scale-105 transition-all duration-200">
                See AI Feedback Demo
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="flex items-center gap-7 pt-8 border-t border-border">
              <div style={{ animation: "slideUp 0.6s ease-out 0.2s both" }}>
                <div className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>150+</div>
                <div className="text-xs text-muted-foreground mt-0.5">Countries</div>
              </div>
              <div className="w-px h-9 bg-border" />
              <div style={{ animation: "slideUp 0.6s ease-out 0.3s both" }}>
                <div className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>2.4M+</div>
                <div className="text-xs text-muted-foreground mt-0.5">Conversations</div>
              </div>
              <div className="w-px h-9 bg-border" />
              <div style={{ animation: "slideUp 0.6s ease-out 0.4s both" }}>
                <div className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>4.9 ★</div>
                <div className="text-xs text-muted-foreground mt-0.5">App Rating</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end" style={{ animation: "slideInRight 0.8s ease-out" }}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-60" style={{ animation: "pulse 4s ease-in-out infinite" }} />
              <div className="relative grid grid-cols-2 gap-3">
                <div className="col-span-2 aspect-[16/10] rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl" style={{ animation: "float 4s ease-in-out infinite" }}>
                  <img src="https://images.unsplash.com/photo-1573497019509-d715a631bbe5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="People in conversation" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040810]/90 via-[#040810]/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" style={{ animation: "pulse 2s ease-in-out infinite" }} />
                      <span className="text-xs font-semibold text-white">Live Session</span>
                    </div>
                    <SoundWave color="#00D8A6" />
                  </div>
                </div>
                <div className="aspect-square rounded-xl overflow-hidden border border-accent/30 shadow-xl" style={{ animation: "float 4.5s ease-in-out infinite 0.5s" }}>
                  <img src="https://images.unsplash.com/photo-1680204438561-81754a196285?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="Conversation partners" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-xl overflow-hidden border border-primary/30 shadow-xl" style={{ animation: "float 3.5s ease-in-out infinite 1s" }}>
                  <img src="https://images.unsplash.com/photo-1758525860449-fa3602fceb31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="Students learning" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-3 right-4 flex items-center gap-1.5 bg-accent text-[#070C1A] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg" style={{ animation: "scaleIn 0.5s ease-out 1s both" }}>
                <Brain size={11} />
                AI feedback ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[["127,440", "Active Learners"], ["154", "Countries Represented"], ["3.2M", "Conversations This Month"], ["+1.5 Bands", "Average IELTS Improvement"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{v}</div>
              <div className="text-xs text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">Why Learner2Learner</p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Everything you need to reach<br />
              <em className="not-italic text-primary">fluency, faster.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, color: "text-primary", bg: "bg-primary/10", tag: "Real humans", title: "Talk to Real People", desc: "Speak with actual humans from 150+ countries. Unlike ChatGPT or Gemini, these are REAL conversations that prepare you for real life.", img: "https://images.unsplash.com/photo-1714974528833-a10e19a8f951?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" },
              { icon: Mic, color: "text-accent", bg: "bg-accent/10", tag: "Face your fear", title: "Face Your Fear & Anxiety", desc: "Practice speaking with real humans, not safe AI bots. Feel the nervousness, push through it, and build REAL confidence. This is what AI apps can never teach you.", img: "https://images.unsplash.com/photo-1758520388328-881ea0019a93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" },
              { icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10", tag: "Powered by GPT-4o", title: "Get Detailed Feedback", desc: "After every call, AI reviews your full transcript with grammar corrections, vocabulary upgrades, and IELTS band score. Unlike HelloTalk or Tandem, you actually know what to fix.", img: "https://images.unsplash.com/photo-1664719474052-6d3347955d7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" },
            ].map((f, i) => (
              <div key={f.title} className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2" style={{ animation: `slideUp 0.6s ease-out ${i * 0.1}s both` }}>
                <div className="aspect-video relative overflow-hidden bg-secondary">
                  <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1428] via-[#0D1428]/60 to-transparent" />
                  <div className={`absolute bottom-3 left-3 w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center backdrop-blur-sm`}>
                    <f.icon size={20} className={f.color} />
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{f.tag}</span></div>
                  <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution - The CORE Value Prop */}
      <section className="py-32 relative overflow-hidden bg-gradient-to-br from-[#0A0F1E] via-background to-[#0D1428]">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(75, 126, 250, 0.4) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 border-2 border-red-500/30 mb-6" style={{ animation: "pulse 3s ease-in-out infinite" }}>
              <Sparkles size={14} className="text-red-400" />
              <span className="text-sm font-bold text-red-300 uppercase tracking-wider">The Problem With Other Platforms</span>
            </div>
            <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
              Why <em className="not-italic text-red-400">ChatGPT</em> and <em className="not-italic text-red-400">HelloTalk</em><br />
              <span className="text-muted-foreground">can't fully help you</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Every English learning platform today is broken. They either give you <strong className="text-foreground">safe AI practice</strong> that doesn't overcome your fear, or <strong className="text-foreground">real conversations</strong> with zero feedback. You need <strong className="text-accent">BOTH</strong>.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {/* AI-Only Problem */}
            <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border-2 border-red-500/30 rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-4xl">❌</span>
              </div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-full mb-4">
                  <Brain size={13} className="text-red-300" />
                  <span className="text-xs font-bold text-red-200 uppercase tracking-wider">AI Apps Only</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-red-100" style={{ fontFamily: "'Fraunces', serif" }}>ChatGPT, Gemini, Claude</h3>
                <p className="text-red-200/80 text-sm leading-relaxed mb-4">
                  Practicing with AI feels <strong className="text-red-100">safe and comfortable</strong> because you know it's not a real person judging you.
                </p>
                <div className="bg-red-950/60 border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-200 mb-2 uppercase tracking-wide">The Fatal Flaw:</p>
                  <p className="text-sm text-red-100/90 leading-relaxed">
                    You <strong>never overcome your fear and shyness</strong> of speaking with REAL people. When it's time for an actual interview or conversation, the anxiety is still there.
                  </p>
                </div>
              </div>
            </div>

            {/* Random Chat Problem */}
            <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border-2 border-red-500/30 rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-4xl">❌</span>
              </div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-full mb-4">
                  <Users size={13} className="text-red-300" />
                  <span className="text-xs font-bold text-red-200 uppercase tracking-wider">Random Chat Apps</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-red-100" style={{ fontFamily: "'Fraunces', serif" }}>HelloTalk, Tandem, Omegle</h3>
                <p className="text-red-200/80 text-sm leading-relaxed mb-4">
                  You talk to <strong className="text-red-100">actual real people</strong>, which helps you face your fear and build confidence with humans.
                </p>
                <div className="bg-red-950/60 border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-200 mb-2 uppercase tracking-wide">The Fatal Flaw:</p>
                  <p className="text-sm text-red-100/90 leading-relaxed">
                    You get <strong>ZERO AI feedback</strong>. Random people won't correct your grammar, suggest better vocabulary, or show you your patterns. You can't track improvement.
                  </p>
                </div>
              </div>
            </div>

            {/* Learner2Learner Solution */}
            <div className="bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 border-2 border-accent rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform duration-300 shadow-2xl shadow-accent/20">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center" style={{ animation: "pulse 2s ease-in-out infinite" }}>
                <span className="text-4xl">✅</span>
              </div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent px-3 py-1.5 rounded-full mb-4">
                  <Sparkles size={13} className="text-accent" />
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">The Complete Solution</span>
                </div>
                <h3 className="text-3xl font-bold mb-3 text-accent" style={{ fontFamily: "'Fraunces', serif" }}>Learner2Learner</h3>
                <p className="text-foreground/90 text-sm leading-relaxed mb-4 font-medium">
                  The <strong className="text-accent">ONLY platform</strong> that combines both benefits — eliminating both fatal flaws.
                </p>
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">✓</span></div>
                      <p className="text-sm text-foreground"><strong>Real people</strong> — Practice with actual humans from 150+ countries</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">✓</span></div>
                      <p className="text-sm text-foreground"><strong>AI feedback</strong> — Detailed corrections, vocabulary, IELTS scores</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">✓</span></div>
                      <p className="text-sm text-foreground"><strong>Track improvement</strong> — See your progress over time with data</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">✓</span></div>
                      <p className="text-sm text-foreground"><strong>Build confidence</strong> — Real conversations prepare you for real life</p>
                    </div>
                  </div>
                </div>
                <button onClick={goToAuth} className="w-full py-3 rounded-xl bg-accent hover:opacity-90 transition-opacity text-[#040810] font-bold text-sm flex items-center justify-center gap-2">
                  <Mic size={15} />
                  Start Now — Free Forever
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-accent/30">
              <Sparkles size={18} className="text-accent" />
              <p className="text-lg font-bold">
                <span className="text-accent">127,000+ learners</span> <span className="text-muted-foreground">already chose the complete solution.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(75, 126, 250, 0.15) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">The Process</p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>Three steps to better English</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {[
              { n: "01", icon: Users, title: "Find a Partner", desc: "Set your topic interests and current skill level. We match you with a compatible learner from another country in under 30 seconds.", img: "https://images.unsplash.com/photo-1590650046871-92c887180603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", delay: 0 },
              { n: "02", icon: Mic, title: "Have a Real Conversation", desc: "Talk freely for 10–30 minutes on any topic. Our system quietly transcribes everything in the background so the AI can review it later.", img: "https://images.unsplash.com/photo-1758525860449-fa3602fceb31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", delay: 0.2 },
              { n: "03", icon: Brain, title: "Get AI Feedback", desc: "After the call ends, the AI reviews your full transcript — grammar corrections, vocabulary upgrades, and your IELTS band estimate. All in under a minute.", img: "https://images.unsplash.com/photo-1616587896649-79b16d8b173d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", delay: 0.4 },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center group" style={{ animation: `scaleIn 0.6s ease-out ${s.delay}s both` }}>
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border group-hover:border-primary/50 transition-colors duration-300">
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#040810]/80 to-transparent" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                      <s.icon size={20} className="text-primary" />
                    </div>
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-bold text-white bg-primary px-2 py-1 rounded-lg shadow-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.n}</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Feedback Demo */}
      <section className="py-28 bg-card/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">The AI Feedback Feature</p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              Your personal English coach,<br />
              <em className="not-italic text-primary">built into every call.</em>
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Transcript */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2"><MessageSquare size={15} className="text-muted-foreground" /><span className="text-sm font-semibold">Conversation Transcript</span></div>
                <span className="text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{errorCount} errors found</span>
              </div>
              <div className="p-5 max-h-[380px] overflow-y-auto">
                {conversation.map((msg, i) => <ConversationMessage key={i} {...msg} />)}
              </div>
            </div>
            {/* Analysis */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-colors ${activeTab === tab.id ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {activeTab === "corrections" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-4">The AI found <span className="text-foreground font-semibold">{errorCount} mistakes</span> in this conversation:</p>
                    {conversation.flatMap((m) => m.segments.filter((s) => s.isError)).map((seg, i) => (
                      <div key={i} className="bg-secondary rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm text-amber-400 line-through opacity-80">{seg.text.trim()}</span>
                          <ArrowRight size={13} className="text-muted-foreground" />
                          <span className="text-sm text-accent font-semibold">{seg.correction}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{seg.note}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "vocabulary" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-4">Upgrade these words to sound more natural:</p>
                    {vocabUpgrades.map((v, i) => (
                      <div key={i} className="bg-secondary rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs text-muted-foreground line-through">{v.original}</span>
                          <ArrowRight size={11} className="text-muted-foreground" />
                          <span className="text-sm font-semibold text-accent">{v.better}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-1">{v.context}</p>
                        <p className="text-[11px] text-primary/80 italic" style={{ fontFamily: "'Fraunces', serif" }}>e.g. "{v.example}"</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "ielts" && (
                  <div>
                    <div className="text-center mb-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Estimated Overall Band</p>
                      <div className="text-7xl font-semibold leading-none my-3" style={{ fontFamily: "'Fraunces', serif" }}>6.5</div>
                    </div>
                    <div className="mb-5"><IELTSBandScale score={6.5} /></div>
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart data={radarData} margin={{ top: 8, right: 18, bottom: 8, left: 18 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.07)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B80A8", fontSize: 10, fontFamily: "'Figtree', sans-serif" }} />
                        <PolarRadiusAxis domain={[0, 9]} tick={false} axisLine={false} />
                        <Radar dataKey="score" stroke="#4B7EFA" fill="#4B7EFA" fillOpacity={0.18} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="space-y-2.5 mt-3">
                      {subScores.map((s) => (
                        <div key={s.label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <span className="text-xs font-bold" style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.score}</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(s.score / 9) * 100}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">Real Results</p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Learners who transformed<br />
              <em className="not-italic text-primary">their English.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-7 flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <img src={t.photo} alt={t.name} className="w-12 h-12 rounded-full object-cover bg-secondary" />
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.country}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-2.5 py-1.5 rounded-lg">
                    <TrendingUp size={11} className="text-accent" />
                    <span className="text-[11px] font-bold text-accent" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.before}→{t.after}</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg self-start">
                  <span className="text-xs text-red-300 font-semibold">Before: {t.problem}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-1.5 pt-4 border-t border-border">
                  <MessageSquare size={12} className="text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/60">{t.sessions} sessions completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/15" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/30 mb-6" style={{ animation: "pulse 3s ease-in-out infinite" }}>
            <Sparkles size={13} className="text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">The Complete English Learning Solution</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-semibold tracking-tight mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            Stop choosing between<br />
            <em className="not-italic text-primary">safe AI practice</em> and <em className="not-italic text-accent">real conversations.</em>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-lg mx-auto">
            Join 127,000 learners who stopped settling for incomplete solutions. Get BOTH real people AND AI feedback.
          </p>
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-accent/20 rounded-xl p-5 mb-10 max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs text-primary">✓</span></div>
                <div><p className="text-sm font-semibold text-foreground">Real people</p><p className="text-xs text-muted-foreground">150+ countries, real humans</p></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs text-accent">✓</span></div>
                <div><p className="text-sm font-semibold text-foreground">AI feedback</p><p className="text-xs text-muted-foreground">Every call, detailed analysis</p></div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={goToAuth} className="flex items-center gap-2 px-8 py-4 rounded-xl bg-accent hover:opacity-90 transition-opacity text-[#040810] font-bold text-base shadow-xl shadow-accent/20">
              <Mic size={18} />
              Start Your First Real Conversation
              <ArrowRight size={18} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">Free forever · No credit card · Available on web and mobile</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <ImageWithFallback src={logo} alt="Learner2Learner" className="h-10 w-auto" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">Real conversations. Real feedback. Real progress.</p>
              <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-2.5 py-1.5 rounded-lg">
                <Sparkles size={11} className="text-accent" />
                <span className="text-[10px] font-bold text-accent uppercase tracking-wide">Real People + AI</span>
              </div>
            </div>
            {Object.entries({ Product: ["Features", "How It Works", "AI Feedback", "Pricing", "Mobile App"], Company: ["About", "Blog", "Careers", "Press"], Support: ["Help Center", "Community", "Contact", "Status"], Legal: ["Privacy", "Terms", "Cookie Policy"] }).map(([cat, items]) => (
              <div key={cat}>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">{cat}</h4>
                <ul className="space-y-2.5">
                  {items.map((item) => <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Learner2Learner Inc. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Available in 154 countries · English Practice Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
