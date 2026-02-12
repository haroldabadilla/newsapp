import { env } from "./config/env.js";
import { connectMongo } from "./db/mongo.js";
import { buildApp } from "./app.js";

let app;

(async () => {
  try {
    await connectMongo(env.mongoUri);
    app = buildApp();
    console.log("NEWS_API_KEY present?", !!process.env.NEWS_API_KEY); // should log: true
    // If behind a proxy/load balancer, trust it (cookie secure handling, IPs, etc.)
    app.set("trust proxy", 1);

    // Only start server if not in Vercel serverless environment
    if (process.env.VERCEL !== '1') {
      app.listen(env.port, () => {
        console.log(
          `API listening on http://localhost:${env.port} (env: ${env.nodeEnv})`,
        );
      });
    }
  } catch (e) {
    console.error("Failed to start server:", e);
    process.exit(1);
  }
})();

// Export for Vercel serverless
export default app;
