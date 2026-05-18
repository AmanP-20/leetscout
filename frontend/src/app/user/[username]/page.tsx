import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/server-url";
import { toContestSlug } from "@/lib/contest";
import { TrendingUp, TrendingDown, Minus, Trophy, Star, Target, BarChart2, Calendar } from "lucide-react";

interface ContestEntry {
  attended: boolean;
  trendDirection: "UP" | "DOWN" | "NONE";
  problemsSolved: number;
  totalProblems: number;
  finishTimeInSeconds: number;
  rating: number;
  ranking: number;
  contest: { title: string; startTime: number };
}

interface ContestHistoryResponse {
  success: boolean;
  data?: {
    ranking: {
      attendedContestsCount: number;
      rating: number;
      globalRanking: number;
      totalParticipants: number;
      topPercentage: number;
      badge?: { name: string } | null;
    } | null;
    contests: ContestEntry[];
  };
  error?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  return {
    title: `${decoded} — LeetScout`,
    description: `LeetScout profile for ${decoded}. Review contest history, ratings, and spot suspicious LeetCode contest trends.`,
    keywords: ["leetcode cheating", "leetcode cheater list", "leetcode scout", "contest history", decoded],
  };
}

function TrendIcon({ dir }: { dir: "UP" | "DOWN" | "NONE" }) {
  if (dir === "UP") return <TrendingUp className="h-3.5 w-3.5 trend-up" />;
  if (dir === "DOWN") return <TrendingDown className="h-3.5 w-3.5 trend-down" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground/50" />;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/users/${decodedUsername}/contests`, { cache: "no-store" });

  if (!res.ok) notFound();
  const payload = (await res.json()) as ContestHistoryResponse;
  if (!payload.success || !payload.data) notFound();

  const { ranking, contests } = payload.data;
  const history = contests
    .filter((e) => e.attended)
    .sort((a, b) => b.contest.startTime - a.contest.startTime);

  const stats = ranking
    ? [
        {
          label: "Rating",
          value: Math.round(ranking.rating).toLocaleString(),
          icon: Star,
          color: "text-violet-400",
          bg: "bg-violet-500/10",
          border: "border-violet-500/20",
          sub: ranking.badge?.name ?? "Competitor",
        },
        {
          label: "Global Rank",
          value: `#${ranking.globalRanking.toLocaleString()}`,
          icon: Trophy,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          sub: `Top ${ranking.topPercentage.toFixed(1)}%`,
        },
        {
          label: "Contests",
          value: ranking.attendedContestsCount.toString(),
          icon: Calendar,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          sub: `${history.length} loaded`,
        },
        {
          label: "Participants",
          value: (ranking.totalParticipants / 1000).toFixed(0) + "K",
          icon: BarChart2,
          color: "text-sky-400",
          bg: "bg-sky-500/10",
          border: "border-sky-500/20",
          sub: "in last contest",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-8 space-y-8">
      {/* ── Profile header ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 100% at 100% 50%, hsl(258 85% 68% / 0.08), transparent)",
          }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-2xl border border-primary/30 bg-primary/10 grid place-items-center text-2xl font-bold text-primary flex-shrink-0">
            {decodedUsername[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-mono">{decodedUsername}</h1>
              {ranking?.badge?.name && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {ranking.badge.name}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              LeetCode contest history · Click any contest to watch replay
            </p>
          </div>
          {/* Scout indicator */}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2 text-xs font-mono text-emerald-400">
            <Target className="h-3.5 w-3.5" />
            Scouted
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="stat-card card-hover rounded-2xl border border-border/70 bg-card p-5"
            >
              <div className={`inline-flex rounded-xl border p-2 mb-3 ${s.bg} ${s.border}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-bold font-mono">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Contest history ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Contest History</h2>
          <span className="text-xs text-muted-foreground font-mono">{history.length} contests</span>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">No attended contests found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => {
              const slug = toContestSlug(entry.contest.title);
              const allSolved = entry.totalProblems > 0 && entry.problemsSolved === entry.totalProblems;
              const date = new Date(entry.contest.startTime * 1000);
              const solvedRatio = entry.totalProblems > 0 ? entry.problemsSolved / entry.totalProblems : 0;

              return (
                <Link
                  key={entry.contest.startTime}
                  href={`/user/${decodedUsername}/contest/${slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card px-4 py-3.5 transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  {/* Trend icon */}
                  <TrendIcon dir={entry.trendDirection} />

                  {/* Contest info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate group-hover:text-primary transition-colors">
                      {entry.contest.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 text-right flex-shrink-0">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rank</p>
                      <p className="text-sm font-mono font-semibold">#{entry.ranking.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Solved</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${solvedRatio * 100}%`,
                              background: allSolved
                                ? "hsl(145 65% 52%)"
                                : solvedRatio > 0.5
                                ? "hsl(38 92% 60%)"
                                : "hsl(var(--primary))",
                            }}
                          />
                        </div>
                        <span className={`text-xs font-mono font-semibold ${allSolved ? "text-emerald-400" : ""}`}>
                          {entry.problemsSolved}/{entry.totalProblems}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rating</p>
                      <p className={`text-sm font-mono font-semibold ${
                        entry.trendDirection === "UP" ? "trend-up" : entry.trendDirection === "DOWN" ? "trend-down" : ""
                      }`}>
                        {Math.round(entry.rating)}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden sm:block text-muted-foreground/30 group-hover:text-primary/60 transition-colors text-sm">›</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
