"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Clock, Trophy, ChevronRight } from "lucide-react";
import ReplayPlayer from "@/components/replay-player";

interface ContestProblem {
  title: string;
  titleSlug: string;
  credit: number;
}

interface ContestData {
  title: string;
  titleSlug: string;
  startTime: number;
  duration: number;
  questions: ContestProblem[];
}

interface ReplayState {
  loading: boolean;
  error: string | null;
  data: { events: { eventType: string; eventData: string; timestamp: string }[]; finalCode: string; totalEvents: number } | null;
  questionSlug: string | null;
}

function difficultyLabel(credit: number) {
  if (credit <= 3) return "Easy";
  if (credit <= 5) return "Medium";
  return "Hard";
}

function difficultyClass(credit: number) {
  if (credit <= 3) return "diff-easy";
  if (credit <= 5) return "diff-medium";
  return "diff-hard";
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ContestClient({
  username,
  contest,
}: {
  username: string;
  contest: ContestData;
}) {
  const [replay, setReplay] = useState<ReplayState>({
    loading: false,
    error: null,
    data: null,
    questionSlug: null,
  });
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  async function loadReplay(questionSlug: string) {
    if (activeSlug === questionSlug && replay.data) return; // already loaded
    setActiveSlug(questionSlug);
    setReplay({ loading: true, error: null, data: null, questionSlug });

    try {
      const res = await fetch(
        `/api/replay/${contest.titleSlug}/${questionSlug}/${username}`
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error ?? "No data");
      setReplay({ loading: false, error: null, data: json.data, questionSlug });
    } catch (err) {
      setReplay({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load replay",
        data: null,
        questionSlug,
      });
    }
  }

  const contestDate = new Date(contest.startTime * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="contest-split">
      {/* ── LEFT: Problem sidebar ─────────────────────────── */}
      <aside className="problem-sidebar flex flex-col">
        {/* Sidebar header */}
        <div className="flex-shrink-0 border-b border-border/70 p-4 space-y-3">
          <Link
            href={`/user/${username}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to profile
          </Link>
          <div>
            <h1 className="font-bold text-base leading-tight">{contest.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(contest.duration)}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {contest.questions.length} problems
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{contestDate}</p>
          </div>
        </div>

        {/* Username strip */}
        <div className="flex-shrink-0 border-b border-border/50 bg-muted/30 px-4 py-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary pulse-dot" />
          <span className="text-xs font-mono text-muted-foreground">
            Scouting <span className="text-foreground font-medium">{username}</span>
          </span>
        </div>

        {/* Problem list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {contest.questions.map((problem, idx) => {
            const isActive = activeSlug === problem.titleSlug;
            const diff = difficultyLabel(problem.credit);
            const diffClass = difficultyClass(problem.credit);

            return (
              <button
                key={problem.titleSlug}
                onClick={() => loadReplay(problem.titleSlug)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200 group ${
                  isActive
                    ? "border-primary/60 bg-primary/8 glow-sm"
                    : "border-border/70 bg-card hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-muted-foreground font-medium">
                        Q{idx + 1}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${diffClass}`}>
                        {diff}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                        {problem.credit} pts
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {problem.title}
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-all ${
                      isActive ? "text-primary rotate-90" : "text-muted-foreground/40 group-hover:text-primary/60"
                    }`}
                  />
                </div>

                {isActive && (
                  <div className="mt-2.5 pt-2.5 border-t border-primary/20">
                    <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium">
                      <Play className="h-3 w-3" />
                      {replay.loading ? "Loading replay…" : replay.error ? "Error loading" : "Replay active"}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── RIGHT: Replay panel ───────────────────────────── */}
      <div className="replay-panel">
        {!activeSlug ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="h-16 w-16 rounded-2xl border border-border/60 bg-muted/40 grid place-items-center float">
              <Play className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Select a problem to watch the replay</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Click any problem on the left to load the keystroke replay
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {contest.questions.map((_, i) => (
                <div key={i} className="h-1.5 w-6 rounded-full bg-muted/70" />
              ))}
            </div>
          </div>
        ) : replay.loading ? (
          /* Loading state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground font-mono">Loading replay events…</p>
          </div>
        ) : replay.error ? (
          /* Error state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="h-12 w-12 rounded-xl border border-rose-500/30 bg-rose-500/10 grid place-items-center">
              <span className="text-rose-400 text-xl">!</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-rose-400">Failed to load replay</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{replay.error}</p>
            </div>
            <button
              onClick={() => activeSlug && loadReplay(activeSlug)}
              className="text-xs border border-border rounded-lg px-3 py-1.5 hover:border-primary/40 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : replay.data ? (
          /* Replay player */
          <ReplayPlayer
            username={username}
            contestSlug={contest.titleSlug}
            questionSlug={replay.questionSlug!}
            replay={replay.data}
          />
        ) : null}
      </div>
    </div>
  );
}
