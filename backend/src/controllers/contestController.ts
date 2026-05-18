import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  getUserContestHistory,
  getContestProblems,
} from "../services/leetcodeService";

/**
 * GET /api/users/:username/contests
 * Returns full contest ranking history for a user.
 */
export const getContests = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.params;

    if (!username || typeof username !== "string" || !username.trim()) {
      res.status(400).json({ success: false, error: "username is required" });
      return;
    }

    const data = await getUserContestHistory(username.trim());

    res.json({
      success: true,
      data: {
        ranking: data.userContestRanking,
        // Only return contests the user actually attended
        contests: data.userContestRankingHistory.filter((c) => c.attended),
      },
    });
  }
);

/**
 * GET /api/contests/:contestSlug/problems
 * Returns the list of problems in a given contest.
 */
export const getContestProblemsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { contestSlug } = req.params;

    if (!contestSlug || typeof contestSlug !== "string" || !contestSlug.trim()) {
      res.status(400).json({ success: false, error: "contestSlug is required" });
      return;
    }

    const data = await getContestProblems(contestSlug.trim());

    res.json({ success: true, data });
  }
);