import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  getReplayEvents,
  reconstructCodeFromEvents,
} from "../services/leetcodeService";

/**
 * GET /api/replay/:contestSlug/:questionSlug/:username
 * Returns raw replay events AND the reconstructed final code.
 */
export const getReplay = asyncHandler(
  async (req: Request, res: Response) => {
    const { contestSlug, questionSlug, username } = req.params;

    if (!contestSlug || !questionSlug || !username) {
      res.status(400).json({
        success: false,
        error: "contestSlug, questionSlug, and username are all required",
      });
      return;
    }

    const events = await getReplayEvents(
      String(contestSlug).trim(),
      String(questionSlug).trim(),
      String(username).trim()
    );

    const finalCode = reconstructCodeFromEvents(events);

    res.json({
      success: true,
      data: {
        events,          // raw events for step-by-step replay in the frontend
        finalCode,       // fully reconstructed final submission
        totalEvents: events.length,
      },
    });
  }
);