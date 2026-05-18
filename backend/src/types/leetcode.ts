export interface ContestInfo {
  title: string;
  startTime: number;
}

export interface ContestRankingHistory {
  attended: boolean;
  trendDirection: string;
  problemsSolved: number;
  totalProblems: number;
  finishTimeInSeconds: number;
  rating: number;
  ranking: number;
  contest: ContestInfo;
}

export interface Badge {
  name: string;
}

export interface UserContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  totalParticipants: number;
  topPercentage: number;
  badge: Badge | null;
}

export interface UserContestData {
  userContestRanking: UserContestRanking;
  userContestRankingHistory: ContestRankingHistory[];
}

// ── Contest Problems ──────────────────────────────────────────
export interface ContestQuestion {
  title: string;
  titleSlug: string;
  credit: number;
}

export interface ContestDetail {
  title: string;
  titleSlug: string;
  startTime: number;
  duration: number;
  questions: ContestQuestion[];
}

// ── Replay ────────────────────────────────────────────────────
export interface ReplayEvent {
  eventType: string;
  eventData: string;
<<<<<<< HEAD
  timestamp: string;
=======
  timestamp:string;
>>>>>>> bdb2af8 (gg)
}

// ── API Responses ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
