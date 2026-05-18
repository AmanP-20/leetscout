import express from "express";
import next from "next";
import path from "path";
import { fileURLToPath } from "url";
import { apiRouter } from "../backend/src/routes";
import { errorHandler } from "../backend/src/middleware/errorHandler";
import { config } from "../backend/src/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = config.server.nodeEnv !== "production";
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // ── Middleware ──────────────────────────────────────────────
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // ── Backend API routes (served before Next.js) ──────────────
  server.use("/api", apiRouter);

  // ── Global error handler (must be last Express middleware) ──
  server.use(errorHandler);

  // ── Next.js handles everything else (pages, assets, etc.) ───
  server.all("/{*path}", (req, res) => {
    return handle(req, res);
  });

  server.listen(config.server.port, () => {
    console.log(
      `✅ leetscout running on http://localhost:${config.server.port}`
    );
    console.log(`   API: http://localhost:${config.server.port}/api/health`);
  });
});