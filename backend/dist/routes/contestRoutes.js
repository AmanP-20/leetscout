import { Router } from "express";
import { getContests, getContestProblemsHandler, } from "../controllers/contestController";
const router = Router();
// GET /api/users/:username/contests
router.get("/users/:username/contests", getContests);
// GET /api/contests/:contestSlug/problems
router.get("/contests/:contestSlug/problems", getContestProblemsHandler);
export default router;
