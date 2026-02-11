import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { pickUser } from "../utils/responses.js";
import {
  validatePasswordStrength,
  validateEmail,
  validateName,
} from "../utils/validation.js";

const router = Router();

// Custom Zod refinements for enhanced validation
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(120)
  .refine(
    (val) => {
      const result = validateName(val);
      return result.valid;
    },
    (val) => {
      const result = validateName(val);
      return { message: result.errors[0] || "Invalid name" };
    },
  );

const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .refine(
    (val) => {
      const result = validateEmail(val);
      return result.valid;
    },
    (val) => {
      const result = validateEmail(val);
      return { message: result.errors[0] || "Invalid email" };
    },
  );

const passwordSchema = z.string().refine(
  (val) => {
    const result = validatePasswordStrength(val);
    return result.valid;
  },
  (val) => {
    const result = validatePasswordStrength(val);
    return {
      message: result.errors[0] || "Password does not meet requirements",
    };
  },
);

// Validation schemas
const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);

    // Ensure email not taken
    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return res.status(409).json({
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
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
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

// PUT /api/auth/profile - Update user profile
const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
});

router.put(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = updateProfileSchema.parse(req.body);
    const userId = req.session.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }

    // If updating email, check if it's already taken
    if (parsed.email && parsed.email !== user.email) {
      const existing = await User.findOne({ email: parsed.email })
        .select("_id")
        .lean();
      if (existing) {
        return res.status(409).json({
          error: {
            code: "EMAIL_IN_USE",
            message: "This email is already in use",
          },
        });
      }
      user.email = parsed.email;
    }

    // Update name if provided
    if (parsed.name) {
      user.name = parsed.name;
    }

    // Update password if provided
    if (parsed.newPassword) {
      if (!parsed.currentPassword) {
        return res.status(400).json({
          error: {
            code: "CURRENT_PASSWORD_REQUIRED",
            message: "Current password is required to set a new password",
          },
        });
      }

      // Verify current password
      const passwordValid = await bcrypt.compare(
        parsed.currentPassword,
        user.passwordHash,
      );
      if (!passwordValid) {
        return res.status(401).json({
          error: {
            code: "INVALID_PASSWORD",
            message: "Current password is incorrect",
          },
        });
      }

      // Hash and set new password
      user.passwordHash = await bcrypt.hash(parsed.newPassword, 12);
    }

    await user.save();

    return res.json({ success: true, user: pickUser(user) });
  }),
);

export default router;
