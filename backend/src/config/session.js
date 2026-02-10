import session from "express-session";
import MongoStore from "connect-mongo";
import { env } from "./env.js";

export function buildSession(mongoUri) {
  const isProd = env.nodeEnv === "production";
  const ttlSeconds = env.session.ttlDays * 24 * 60 * 60;

  return session({
    name: env.session.name,
    secret: env.session.secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      ttl: ttlSeconds,
      collectionName: "sessions",
      stringify: false,
      autoRemove: "native",
    }),
    cookie: {
      httpOnly: true,
      sameSite: isProd ? "lax" : "lax", // set to 'none' (and secure: true) if cross-site in prod
      secure: isProd, // true only over HTTPS (prod)
      maxAge: ttlSeconds * 1000,
    },
  });
}
