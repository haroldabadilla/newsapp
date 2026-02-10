import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

import { env } from "./config/env.js";
import { buildSession } from "./config/session.js";
import authRoutes from "./routes/auth.js";
import newsRoutes from "./routes/news.js";
import favoritesRoutes from "./routes/favorites.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function buildApp() {
  const app = express();

  // Security & logs
  app.use(helmet());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  // CORS (allow SPA origin and credentials for session cookie)
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );

  // Body parsers
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // Sessions
  app.use(buildSession(env.mongoUri));

  // Routes
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", time: new Date().toISOString() }),
  );
  app.use("/api/auth", authRoutes);
  app.use("/api/news", newsRoutes);
  app.use("/api/favorites", favoritesRoutes);

  app.use(errorHandler);

  return app;
}
