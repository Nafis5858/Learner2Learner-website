import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Mic, Eye, EyeOff, ArrowLeft, Globe } from "lucide-react";
import { getUser, signIn, signUp } from "../lib/auth";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import logo from "../../imports/905ec848-acf3-4d5a-8933-c18c0010c52a-removebg-preview.png";

type Mode = "signup" | "login";

const COUNTRIES = [
  "Indonesia 🇮🇩", "Japan 🇯🇵", "South Korea 🇰🇷", "China 🇨🇳", "India 🇮🇳",
  "Brazil 🇧🇷", "Colombia 🇨🇴", "Mexico 🇲🇽", "Philippines 🇵🇭", "Vietnam 🇻🇳",
  "Thailand 🇹🇭", "Germany 🇩🇪", "France 🇫🇷", "Spain 🇪🇸", "Turkey 🇹🇷",
  "Nigeria 🇳🇬", "Ghana 🇬🇭", "Saudi Arabia 🇸🇦", "United States 🇺🇸",
  "United Kingdom 🇬🇧", "Other",
];

const LANGUAGES = [
  "Indonesian", "Japanese", "Korean", "Mandarin Chinese", "Hindi",
  "Portuguese", "Spanish", "Filipino", "Vietnamese", "Thai",
  "German", "French", "Arabic", "Turkish", "Other",
];

const LEVELS = [
  { value: "A1", label: "A1 — Beginner" },
  { value: "A2", label: "A2 — Elementary" },
  { value: "B1", label: "B1 — Intermediate" },
  { value: "B2", label: "B2 — Upper Intermediate" },
  { value: "C1", label: "C1 — Advanced" },
  { value: "C2", label: "C2 — Proficient" },
];

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    country: "",
    language: "",
    level: "B1",
  });

  useEffect(() => {
    if (getUser()) navigate("/home");
  }, [navigate]);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (mode === "signup" && (!form.name || !form.country || !form.language)) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      if (mode === "signup") {
        await signUp(form);
      } else {
        await signIn({ email: form.email, password: form.password });
      }
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <style>{`
        @keyframes blobDrift1{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(40px,-30px) scale(1.12);}}
        @keyframes blobDrift2{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-30px,35px) scale(0.88);}}
      `}</style>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl" style={{ animation: "blobDrift1 11s ease-in-out infinite" }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-accent/15 blur-3xl" style={{ animation: "blobDrift2 14s ease-in-out infinite" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to landing */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={15} />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-7">
            <ImageWithFallback src={logo} alt="Learner2Learner" className="h-10 w-auto" />
          </div>

          {/* Mode toggle */}
          <div className="flex bg-secondary rounded-xl p-1 mb-7">
            {(["signup", "login"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "signup" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sign up fields */}
            {mode === "signup" && (
              <>
                <Field label="Full Name" required>
                  <input
                    type="text"
                    placeholder="e.g. Yuki Tanaka"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Country" required>
                    <select value={form.country} onChange={(e) => set("country", e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors">
                      <option value="">Select…</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Native Language" required>
                    <select value={form.language} onChange={(e) => set("language", e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors">
                      <option value="">Select…</option>
                      {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Current English Level" required>
                  <select value={form.level} onChange={(e) => set("level", e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors">
                    {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </Field>
              </>
            )}

            <Field label="Email Address" required>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {mode === "signup" ? "Creating your account…" : "Signing in…"}
                </>
              ) : (
                mode === "signup" ? "Create My Account" : "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors flex items-center justify-center gap-2">
            <Globe size={15} />
            Continue with Google
          </button>

          <p className="text-xs text-muted-foreground text-center mt-5">
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} className="text-primary hover:underline font-medium">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">Terms</a> and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
