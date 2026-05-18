"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap, Shield, Eye, TrendingUp, ArrowRight, ChevronRight } from "lucide-react";

const EXAMPLE_USERS = ["tourist", "awice", "lee215", "jiangly", "neal_wu"];

const FEATURES = [
  {
    icon: Eye,
    title: "Keystroke Replay",
    description: "Watch how code was typed character-by-character. Spot unnaturally fast solutions instantly.",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Shield,
    title: "Cheat Detection",
    description: "Analyze submission timing, rating spikes, and solve patterns to identify suspicious behavior.",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: TrendingUp,
    title: "Contest History",
    description: "Full ranking history with rating curves and performance trends for any LeetCode user.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Zap,
    title: "Live LeetCode Data",
    description: "Pulls directly from the LeetCode GraphQL API — always real, always fresh.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = username.trim();
    if (next) router.push(`/user/${encodeURIComponent(next)}`);
  };

  return (
    <div className="relative overflow-hidden">
      {/* ── Background ──────────────────────────────────────── */}
      <div className="hero-bg absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
          opacity: 0.35,
        }}
      />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-16 text-center">
        {/* Live badge */}
        <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
          Real-time LeetCode intelligence
          <ChevronRight className="h-3 w-3 opacity-60" />
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up animate-delay-100 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6">
          Scout any{" "}
          <span className="gradient-text">LeetCode</span>
          <br />
          user instantly
        </h1>

        <p className="animate-fade-in-up animate-delay-200 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
          Replay keystrokes frame-by-frame, analyze contest history, and detect
          suspicious submission patterns — all from a single search.
        </p>

        {/* Search form */}
        <div className="animate-fade-in-up animate-delay-300 max-w-lg mx-auto mb-8">
          <form onSubmit={handleSubmit}>
            <div
              className={`relative flex items-center rounded-2xl border transition-all duration-300 bg-card/80 backdrop-blur-sm overflow-hidden ${
                focused
                  ? "border-primary/70 glow-sm"
                  : "border-border/80"
              }`}
            >
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none flex-shrink-0" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Enter LeetCode username…"
                className="flex-1 bg-transparent py-4 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground/60 font-medium"
                data-testid="input-username"
              />
              <button
                type="submit"
                disabled={!username.trim()}
                className="m-1.5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Scout
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* Example users */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {EXAMPLE_USERS.map((user) => (
              <button
                key={user}
                type="button"
                onClick={() => router.push(`/user/${user}`)}
                className="rounded-full border border-border/70 bg-muted/50 px-3 py-1 font-mono text-xs text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/8 transition-all"
              >
                {user}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <section className="animate-fade-in-up animate-delay-400 relative border-y border-border/60 bg-muted/30 backdrop-blur-sm py-5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
            {[
              { value: "100K+", label: "Replays analyzed" },
              { value: "< 1s",  label: "Response time" },
              { value: "Live",  label: "LeetCode data" },
              { value: "Free",  label: "No sign-up needed" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-bold font-mono gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ───────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Everything you need to investigate
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Built on top of the official LeetCode GraphQL API for 100% accurate, real-time data.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`glass card-hover rounded-2xl border p-6 animate-fade-in-up`}
              style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
            >
              <div className={`inline-flex rounded-xl border p-2.5 mb-4 ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
