import { config } from "../config";
// ── Core fetcher ──────────────────────────────────────────────
async function gqlFetch(operationName, query, variables) {
    const res = await fetch(config.leetcode.graphqlUrl, {
        method: "POST",
        headers: config.leetcode.headers,
        body: JSON.stringify({ operationName, query, variables }),
    });
    if (!res.ok) {
        throw new Error(`LeetCode API error: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json());
    if (json.errors?.length) {
        throw new Error(json.errors.map((e) => e.message).join(", "));
    }
    if (!json.data) {
        throw new Error("Empty data from LeetCode API");
    }
    return json.data;
}
// ── 1. User contest history ───────────────────────────────────
export async function getUserContestHistory(username) {
    return gqlFetch("userContestRankingInfo", `query userContestRankingInfo($username: String!) {
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
    }`, { username });
}
// ── 2. Contest problems (questions list for a contest) ────────
export async function getContestProblems(contestSlug) {
    const data = await gqlFetch("contestDetail", `query contestDetail($titleSlug: String!) {
      contest(titleSlug: $titleSlug) {
        title
        titleSlug
        startTime
        duration
        questions {
          title
          titleSlug
          difficulty
          credit
        }
      }
    }`, { titleSlug: contestSlug });
    return data.contest;
}
// ── 3. Code replay events ─────────────────────────────────────
export async function getReplayEvents(contestSlug, questionSlug, username) {
    const data = await gqlFetch("UserContestReplayEvents", `query UserContestReplayEvents(
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
      }`, { contestSlug, questionSlug, username });
    return data.userContestReplayEvents;
}
// ── Replay reconstructor (utility) ───────────────────────────
export function reconstructCodeFromEvents(events) {
    let code = "";
    for (const e of events) {
        if (e.eventType !== "7")
            continue;
        let parsed;
        try {
            parsed = JSON.parse(e.eventData);
        }
        catch {
            continue;
        }
        const ch = parsed.change?.changes?.[0];
        if (!ch || typeof ch.from !== "number")
            continue;
        if (typeof ch.to === "number") {
            code = code.slice(0, ch.from) + code.slice(ch.to);
        }
        if (typeof ch.insert === "string") {
            code = code.slice(0, ch.from) + ch.insert + code.slice(ch.from);
        }
    }
    return code;
}
