import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router";
import {
  LayoutDashboard,
  Globe,
  TrendingUp,
  User as UserIcon,
  LogOut,
  Mic,
  Flame,
  ChevronRight,
} from "lucide-react";
import { getUser, signOut, type User } from "../lib/auth";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logo from "../../imports/905ec848-acf3-4d5a-8933-c18c0010c52a-removebg-preview.png";

const navItems = [
  { path: "/home", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/find-partner", icon: Globe, label: "Voice Rooms" },
  { path: "/progress", icon: TrendingUp, label: "My Progress" },
  { path: "/profile", icon: UserIcon, label: "Profile" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      navigate("/auth");
    } else {
      setUser(u);
    }
  }, [navigate]);

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-border bg-card/60">
        {/* Logo */}
        <div className="flex items-center px-5 h-16 border-b border-border">
          <ImageWithFallback src={logo} alt="Learner2Learner" className="h-9 w-auto" />
        </div>

        {/* Streak badge */}
        {user.streak > 0 && (
          <div className="mx-4 mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <Flame size={14} className="text-amber-400" />
            <div>
              <div className="text-xs font-bold text-amber-400">{user.streak} day streak!</div>
              <div className="text-[10px] text-muted-foreground">Keep it up</div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <item.icon size={17} />
                {item.label}
                {active && <ChevronRight size={13} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Find Partner CTA */}
        <div className="px-4 pb-4">
          <Link
            to="/find-partner"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Globe size={14} />
            Browse Rooms
          </Link>
        </div>

        {/* User + sign out */}
        <div className="border-t border-border px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{user.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">
              Band {user.currentBand}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center">
          <ImageWithFallback src={logo} alt="Learner2Learner" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-2 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon size={18} />
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  );
}
