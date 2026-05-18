import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import { Telescope } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-primary glow-sm transition-all group-hover:scale-105">
              <Telescope className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Leet<span className="text-primary">Scout</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/60 rounded-full px-3 py-1.5 border border-border/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
              Live API
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-5">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 sm:px-6 text-xs text-muted-foreground">
          <span className="font-mono">LeetScout — contest replay intelligence</span>
          <span className="font-mono opacity-60">v1.0</span>
        </div>
      </footer>
    </div>
  );
}
