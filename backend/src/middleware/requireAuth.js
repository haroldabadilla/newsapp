import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res
      .status(401)
      .json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
  }
  // Optionally attach user to req for convenience
  const user = await User.findById(req.session.userId)
    .select("_id name email")
    .lean();
  if (!user) {
    // Session refers to missing user; clean up session
    req.session.destroy(() => {});
    return res
      .status(401)
      .json({ error: { code: "UNAUTHORIZED", message: "Invalid session" } });
  }
  req.user = user;
  next();
}
