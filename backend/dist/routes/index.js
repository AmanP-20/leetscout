import { Router } from "express";
import contestRoutes from "./contestRoutes";
import replayRoutes from "./replayRoutes";
const apiRouter = Router();
// Mount all route groups here — add new ones as the project grows
apiRouter.use(contestRoutes);
apiRouter.use(replayRoutes);
// Health check
apiRouter.get("/health", (_req, res) => {
    res.json({ success: true, message: "leetscout API is alive 🚀" });
});
export { apiRouter };
