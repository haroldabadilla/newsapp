import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { pickUser } from "../utils/responses.js";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(8),
});

// POST /api/auth/register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);

    // Ensure email not taken
    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return res
        .status(409)
        .json({
          error: {
            code: "EMAIL_IN_USE",
            message: "A user with this email already exists",
          },
        });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    // For now, DO NOT auto-login (keeps parity with your current frontend flow).
    // If you prefer auto-login, set req.session.userId = user._id and return 200 instead.
    return res.status(201).json({ success: true, user: pickUser(user) });
  }),
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res
        .status(401)
        .json({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        });
    }

    // Create session
    req.session.userId = user._id;
    return res.json({ success: true, user: pickUser(user) });
  }),
);

// POST /api/auth/logout
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    req.session.destroy(() => {});
    // Clear cookie
    res.clearCookie(req.session?.name || "sid");
    return res.status(204).end();
  }),
);

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.json({ user: req.user });
  }),
);

export default router;
