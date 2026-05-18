import { config } from "../config";
import type {
  UserContestData,
  ContestDetail,
  ReplayEvent,
} from "../types/leetcode";

// ── Core fetcher ──────────────────────────────────────────────
async function gqlFetch<T>(
  operationName: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch(config.leetcode.graphqlUrl, {
    method: "POST",
    headers: config.leetcode.headers,
    body: JSON.stringify({ operationName, query, variables }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  if (!json.data) {
    throw new Error("Empty data from LeetCode API");
  }

  return json.data;
}

// ── 1. User contest history ───────────────────────────────────
export async function getUserContestHistory(
  username: string
): Promise<UserContestData> {
  return gqlFetch<UserContestData>(
    "userContestRankingInfo",
    `query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        totalParticipants
        topPercentage
        badge { name }
      }
      userContestRankingHistory(username: $username) {
        attended
        trendDirection
        problemsSolved
        totalProblems
        finishTimeInSeconds
        rating
        ranking
        contest {
          title
          startTime
        }
      }
    }`,
    { username }
  );
}

// ── 2. Contest problems (questions list for a contest) ────────
export async function getContestProblems(
  contestSlug: string
): Promise<ContestDetail> {
  const data = await gqlFetch<{ contest: ContestDetail }>(
    "contestDetail",
    `query contestDetail($titleSlug: String!) {
      contest(titleSlug: $titleSlug) {
        title
        titleSlug
        startTime
        duration
        questions {
          title
          titleSlug
          credit
        }
      }
    }`,
    { titleSlug: contestSlug }
  );
  return data.contest;
}

// ── 3. Code replay events ─────────────────────────────────────
export interface ReplayEvent {
  eventType: string;
  eventData: string;
  timestamp: string;
}

export async function getReplayEvents(
  contestSlug: string,
  questionSlug: string,
  username: string
): Promise<ReplayEvent[]> {
  const data = await gqlFetch<{
    userContestReplayEvents: ReplayEvent[] | null;
  }>(
    "UserContestReplayEvents",
    `query UserContestReplayEvents(
        $contestSlug: String!,
        $questionSlug: String!,
        $username: String
      ) {
        userContestReplayEvents(
          contestSlug: $contestSlug
          questionSlug: $questionSlug
          username: $username
        ) {
          eventType
          eventData
          timestamp
        }
      }`,
    { contestSlug, questionSlug, username }
  );
  // LeetCode returns null when no replay data exists for this user/contest/problem
  return data.userContestReplayEvents ?? [];
}

// ── Replay reconstructor (utility) ───────────────────────────
// isFlush = full document reset. LeetCode sends these in pairs —
// the 2nd has no `to`, so without isFlush guard it would double the code.
export function reconstructCodeFromEvents(events: ReplayEvent[] | null | undefined): string {
  if (!events || events.length === 0) return "";
  let code = "";
  let lastFlushCode = "\x00";

  for (const e of events) {
    if (e.eventType !== "7") continue;

    let parsed: {
      change?: { changes?: Array<{ from: number; to?: number; insert?: string }> };
      isFlush?: boolean;
    };
    try {
      parsed = JSON.parse(e.eventData) as typeof parsed;
    } catch {
      continue;
    }

    const changes = parsed.change?.changes;
    if (!Array.isArray(changes) || changes.length === 0) continue;
    const isFlush = parsed.isFlush === true;

    let next: string;
    if (isFlush) {
      next = changes.map(c => c.insert ?? "").join("");
      if (next === lastFlushCode) continue; // skip duplicate flush
      lastFlushCode = next;
    } else {
      // Normal: apply sequentially left-to-right
      next = code;
      for (const ch of changes) {
        if (typeof ch.from !== "number") continue;
        const from = Math.min(Math.max(0, ch.from), next.length);
        const to = typeof ch.to === "number" ? Math.min(Math.max(from, ch.to), next.length) : from;
        next = next.slice(0, from) + (ch.insert ?? "") + next.slice(to);
      }
    }
    code = next;
  }

  return code;
}