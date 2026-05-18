import type { UserContestData, ContestDetail, ReplayEvent } from "../types/leetcode";
export declare function getUserContestHistory(username: string): Promise<UserContestData>;
export declare function getContestProblems(contestSlug: string): Promise<ContestDetail>;
export declare function getReplayEvents(contestSlug: string, questionSlug: string, username: string): Promise<ReplayEvent[]>;
export declare function reconstructCodeFromEvents(events: ReplayEvent[]): string;
