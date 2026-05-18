"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import CodeHighlighter from "./code-highlighter";

interface ReplayEvent {
  eventType: string;
  eventData: string;
  timestamp: string;
}

interface ReplayPayload {
  events: ReplayEvent[];
  finalCode: string;
  totalEvents: number;
}

const SPEEDS = [0.5, 1, 2, 5, 10, 20] as const;
type Speed = (typeof SPEEDS)[number];

type Change = { from: number; to?: number; insert?: string };
type Frame = { code: string; cursor: number; timestamp:number };

// ── Apply ONE atomic change to a string ──────────────────────────
function applyChange(code: string, ch: Change): string {
  const len = code.length;
  const from = Math.min(Math.max(0, ch.from), len);
  // When `to` is absent it's a pure insertion (no deletion)
  const to =
    typeof ch.to === "number"
      ? Math.min(Math.max(from, ch.to), len)
      : from;
  return code.slice(0, from) + (ch.insert ?? "") + code.slice(to);
}

// ── Apply all changes from one CM6 transaction ────────────────────
// CM6 encodes ALL changes relative to the ORIGINAL document, so we must
// apply them right-to-left to avoid position drift.
function applyTransaction(code: string, changes: Change[]): string {
  const sorted = [...changes].sort((a, b) => b.from - a.from);
  let result = code;
  for (const ch of sorted) result = applyChange(result, ch);
  return result;
}

function normalizeCR(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

// ── Extract session language from event type "0" ─────────────────
function extractLang(events: ReplayEvent[]): string {
  for (const e of events) {
    if (e.eventType !== "0") continue;
    try {
      const parsed = JSON.parse(e.eventData) as { lang?: string };
      if (parsed.lang) return parsed.lang; // e.g. "cpp", "python3", "java"
    } catch { /* ignore */ }
  }
  return "plaintext";
}

// ── ReplayPlayer ─────────────────────────────────────────────────
export default function ReplayPlayer({
  username,
  contestSlug,
  questionSlug,
  replay,
}: {
  username: string;
  contestSlug: string;
  questionSlug: string;
  replay: ReplayPayload;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const codeAreaRef = useRef<HTMLPreElement>(null);

  // ── Detect language from session-init event ─────────────────────
  const lang = useMemo(() => extractLang(replay.events), [replay.events]);

  // ── Build code frames ────────────────────────────────────────────
  const codeFrames = useMemo<Frame[]>(() => {
    const frames: Frame[] = [];
    let current = "";

    for (const e of replay.events) {
      if (e.eventType !== "7") continue;

      let parsed: {
        change?: {
          changes?: Change[];
          selection?: { ranges?: { head: number; anchor: number }[] };
        };
        // NOTE: LeetCode does NOT send isFlush. We detect resets ourselves.
      };

      try {
        parsed = JSON.parse(e.eventData) as typeof parsed;
      } catch {
        continue; // skip malformed event
      }

      const changes = parsed.change?.changes;
      if (!Array.isArray(changes) || changes.length === 0) continue;

      // ── Document-reset detection (replaces the old isFlush logic) ──
      //
      // LeetCode does NOT include an `isFlush` flag. Instead, a template
      // load looks like a single change: { from: 0, to: 0, insert: "<template>" }
      // on an EMPTY document. Detect it by:
      //   1. Current state is empty (first event ever), OR
      //   2. Single change that fully replaces the document
      //      (from=0, to=entire doc length, insert=new content)
      //
      // In either case: treat the inserts as the new document verbatim.
      const isFullReset =
        (current === "" && changes.every((c) => c.from === 0)) ||
        (changes.length === 1 &&
          changes[0].from === 0 &&
          changes[0].to === current.length &&
          typeof changes[0].insert === "string");

      let next: string;
      if (isFullReset) {
        // Concatenate all inserts — the result IS the new document
        next = changes.map((c) => c.insert ?? "").join("");
      } else {
        // Normal incremental edit — apply right-to-left
        next = applyTransaction(current, changes);
      }

      // Skip no-op frames (e.g. cursor-only moves with no code change)
      if (next === current) continue;

      current = next;
      const cursor =
        parsed.change?.selection?.ranges?.[0]?.head ?? current.length;
      const timestamp = new Date(e.timestamp).getTime();
      frames.push({ code: current, cursor, timestamp });
    }

    return frames;
  }, [replay.events]);

  const totalFrames = codeFrames.length;

  const currentFrame = codeFrames[currentIndex];
  const displayCode = normalizeCR(currentFrame?.code ?? replay.finalCode ?? "");

  const progress = totalFrames > 1 ? currentIndex / (totalFrames - 1) : 0;
  const progressPct = Math.round(progress * 100);

  const startTs = codeFrames[0]?.timestamp ?? 0;
  const endTs = codeFrames[totalFrames - 1]?.timestamp ?? 0;
  const currentTs = currentFrame?.timestamp ?? startTs;
  const totalMs = Math.max(0, endTs - startTs);
  const currentMs = Math.max(0, currentTs - startTs);

  const lineCount = (displayCode.match(/\n/g) ?? []).length + 1;

  // ── Playback via requestAnimationFrame (unchanged) ───────────────
  useEffect(() => {
    if (!isPlaying || totalFrames === 0) return;

    let rafId: number;
    let lastTime = performance.now();
    let virtualMs = currentFrame?.timestamp ?? startTs;

    const tick = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      if (deltaMs > 100) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      virtualMs += deltaMs * speed;

      setCurrentIndex((prev) => {
        if (prev >= totalFrames - 1) {
          setIsPlaying(false);
          return prev;
        }

        let next = prev;

        // Smart idle skip: if next frame is > 2s away, jump virtual time
        const gap = codeFrames[next + 1].timestamp - virtualMs;
        if (gap > 2000) virtualMs += gap - 2000;

        // Catch up: skip frames that fall behind virtual time in one render
        while (
          next < totalFrames - 1 &&
          codeFrames[next + 1].timestamp <= virtualMs
        ) {
          next++;
        }

        if (next >= totalFrames - 1) setIsPlaying(false);
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speed, totalFrames, codeFrames, startTs]);

  // ── IDE-style auto-scroll ────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !codeAreaRef.current || !currentFrame) return;
    const cursorLine = (
      displayCode.slice(0, currentFrame.cursor).match(/\n/g) ?? []
    ).length;
    const lineHeight = 13 * 1.6;
    const cursorY = cursorLine * lineHeight;
    const el = codeAreaRef.current;
    if (cursorY < el.scrollTop + lineHeight * 2) {
      el.scrollTop = Math.max(0, cursorY - lineHeight * 2);
    } else if (cursorY > el.scrollTop + el.clientHeight - lineHeight * 3) {
      el.scrollTop = cursorY - el.clientHeight + lineHeight * 3;
    }
  }, [displayCode, isPlaying, currentFrame]);

  // Reset when question changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
  }, [questionSlug]);

  // ── Empty state ──────────────────────────────────────────────────
  if (totalFrames === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="h-12 w-12 rounded-xl border border-amber-500/30 bg-amber-500/10 grid place-items-center">
          <span className="text-amber-400 text-xl">∅</span>
        </div>
        <div>
          <p className="font-semibold text-sm">No replay events found</p>
          <p className="text-xs text-muted-foreground mt-1">
            LeetCode may not have recorded keystrokes for this submission.
          </p>
        </div>
        {replay.finalCode && (
          <div className="mt-4 w-full max-w-lg text-left">
            <p className="text-xs text-muted-foreground mb-2 font-mono">
              Final submission ({lang}):
            </p>
            <pre
              className="rounded-xl bg-[#0d1117] border border-white/8 p-4 text-xs font-mono overflow-auto max-h-64 leading-relaxed"
              style={{ tabSize: 4 }}
            >
              <CodeHighlighter code={replay.finalCode} lang={lang} />
            </pre>
          </div>
        )}
      </div>
    );
  }

  // ── Main player ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header breadcrumb */}
      <div className="flex-shrink-0 border-b border-white/8 bg-[#0d1117] px-4 py-2.5 flex items-center justify-between gap-4">
        <p className="text-xs font-mono text-[#8b949e] truncate">
          <span className="text-[#7ee787]">{username}</span>
          <span className="mx-1 opacity-40">/</span>
          <span className="text-[#79c0ff]">{contestSlug}</span>
          <span className="mx-1 opacity-40">/</span>
          <span className="text-[#e3b341]">{questionSlug}</span>
        </p>
        <div className="flex items-center gap-2">
          {/* Language badge — driven by event type "0" */}
          <span className="text-[10px] font-mono text-[#7ee787] bg-[#7ee787]/10 border border-[#7ee787]/20 rounded px-2 py-0.5">
            {lang}
          </span>
          <div className="text-[10px] font-mono text-[#8b949e] bg-white/5 rounded-lg px-2.5 py-1 border border-white/8 whitespace-nowrap">
            {progressPct}% · {totalFrames.toLocaleString()} frames
          </div>
        </div>
      </div>

      {/* Mac window frame */}
      <div className="flex-1 flex flex-col overflow-hidden mx-3 my-2.5 mac-frame min-h-0">
        {/* Title bar */}
        <div className="mac-titlebar flex-shrink-0">
          <div className="mac-dot" style={{ background: "#ff5f57" }} />
          <div className="mac-dot" style={{ background: "#febc2e" }} />
          <div className="mac-dot" style={{ background: "#28c840" }} />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs font-mono text-[#8b949e] bg-black/20 rounded-md px-3 py-0.5 truncate max-w-xs">
              solution.{langToExt(lang)} — {questionSlug}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#484f58] whitespace-nowrap">
            {totalMs > 0
              ? `${formatTime(currentMs)} / ${formatTime(totalMs)}`
              : `${progressPct}%`}
          </div>
        </div>

        {/* Code body */}
        <div className="flex flex-1 overflow-hidden bg-[#0d1117] min-h-0">
          {/* Line numbers */}
          <div
            className="flex-shrink-0 select-none border-r border-white/5 bg-[#161b22] text-right overflow-hidden"
            style={{ minWidth: "3rem", paddingTop: "1rem", paddingBottom: "1rem" }}
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                className="font-mono text-[#484f58] leading-relaxed"
                style={{
                  fontSize: "12px",
                  lineHeight: "1.6em",
                  paddingRight: "12px",
                  paddingLeft: "8px",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code area */}
          <pre
            ref={codeAreaRef}
            className="flex-1 overflow-auto font-mono text-[#e6edf3] leading-relaxed"
            style={{
              fontSize: "13px",
              lineHeight: "1.6em",
              padding: "1rem 1.25rem",
              margin: 0,
              tabSize: 4,
              whiteSpace: "pre",
              overflowWrap: "normal",
              wordBreak: "normal",
            }}
          >
            <CodeHighlighter code={displayCode} lang={lang} />
          </pre>
        </div>

        {/* Progress bar */}
        <div className="flex-shrink-0 bg-[#161b22] border-t border-white/5">
          <div className="progress-bar rounded-none">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 border-t border-white/6 bg-[#0d1117] px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Playback buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
              className="h-7 w-7 rounded-md border border-white/10 bg-white/5 grid place-items-center text-[#8b949e] hover:text-white hover:border-white/20 transition-all"
              title="Reset"
            >
              <SkipBack className="h-3 w-3" />
            </button>
            <button
              onClick={() =>
                setCurrentIndex((p) =>
                  Math.max(0, p - Math.max(1, Math.floor(totalFrames / 20)))
                )
              }
              className="h-7 w-7 rounded-md border border-white/10 bg-white/5 grid place-items-center text-[#8b949e] hover:text-white hover:border-white/20 transition-all"
              title="Back 5%"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`h-8 w-8 rounded-lg grid place-items-center transition-all ${isPlaying
                  ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                  : "bg-primary glow-sm text-primary-foreground hover:opacity-90"
                }`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() =>
                setCurrentIndex((p) =>
                  Math.min(
                    totalFrames - 1,
                    p + Math.max(1, Math.floor(totalFrames / 20))
                  )
                )
              }
              className="h-7 w-7 rounded-md border border-white/10 bg-white/5 grid place-items-center text-[#8b949e] hover:text-white hover:border-white/20 transition-all"
              title="Skip 5%"
            >
              <SkipForward className="h-3 w-3" />
            </button>
          </div>

          {/* Scrubber */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono text-[#484f58] tabular-nums w-6 text-right flex-shrink-0">
              {progressPct}%
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, totalFrames - 1)}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(Number(e.target.value));
              }}
              className="flex-1 h-1 cursor-pointer accent-violet-500"
            />
          </div>

          {/* Speed presets */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded px-1.5 py-1 text-[10px] font-mono font-semibold transition-all ${speed === s
                    ? "bg-primary text-primary-foreground"
                    : "text-[#8b949e] hover:text-white hover:bg-white/8"
                  }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Map LeetCode lang → file extension for the title bar ─────────
function langToExt(lang: string): string {
  const map: Record<string, string> = {
    cpp: "cpp",
    c: "c",
    java: "java",
    python: "py",
    python3: "py",
    javascript: "js",
    typescript: "ts",
    csharp: "cs",
    go: "go",
    rust: "rs",
    kotlin: "kt",
    swift: "swift",
    ruby: "rb",
    scala: "scala",
    php: "php",
  };
  return map[lang] ?? lang;
}