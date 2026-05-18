import { Router } from "express";
import { getReplay } from "../controllers/replayController";
const router = Router();
// GET /api/replay/:contestSlug/:questionSlug/:username
router.get("/replay/:contestSlug/:questionSlug/:username", getReplay);
export default router;
