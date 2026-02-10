import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI,
  session: {
    name: process.env.SESSION_NAME || "sid",
    secret: process.env.SESSION_SECRET,
    ttlDays: Number(process.env.SESSION_TTL_DAYS || 7),
  },
};

if (!env.mongoUri) throw new Error("MONGODB_URI is required");
if (!env.session.secret) throw new Error("SESSION_SECRET is required");
