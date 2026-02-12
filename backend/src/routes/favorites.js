import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Favorite } from "../models/Favorite.js";

const router = Router();

// All /api/favorites routes require auth
router.use(requireAuth);

// ---------- Validation ----------

// GET list schema with filters & sorting
const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),

  // Sorting: publishedAt=newest first (default), oldest, title, addedAt
  sortBy: z
    .enum(["publishedAt", "oldest", "title", "addedAt"])
    .optional()
    .default("publishedAt"),

  // Optional language filter (accepts "", null, undefined -> treated as no filter)
  language: z
    .union([z.string().trim().toLowerCase(), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v ? String(v).trim().toLowerCase() : undefined))
    .optional(),

  // Optional date range on publishedAt
  from: z
    .union([
      z.string().datetime().transform((s) => new Date(s)),
      z.date(),
      z.literal("").transform(() => undefined),
      z.undefined(),
      z.null().transform(() => undefined),
    ])
    .optional(),
  to: z
    .union([
      z.string().datetime().transform((s) => new Date(s)),
      z.date(),
      z.literal("").transform(() => undefined),
      z.undefined(),
      z.null().transform(() => undefined),
    ])
    .optional(),
});

// Accept valid URL; accept Date OR ISO string for publishedAt;
// treat ''/null as undefined; we will also strip empty strings.
const addSchema = z.object({
  url: z.string().url("A valid article URL is required"),
  title: z.string().optional(),
  source: z.string().optional(),
  urlToImage: z.string().url().optional(),
  description: z.string().optional(),
  content: z.string().optional(),

  // NEW: allow language to be saved with the favorite (optional)
  language: z
    .union([z.string().trim().toLowerCase(), z.undefined(), z.null()])
    .transform((v) => (v ? String(v).trim().toLowerCase() : undefined))
    .optional(),

  publishedAt: z
    .union([
      z.string().datetime().transform((s) => new Date(s)), // ISO -> Date
      z.date(),
      z.literal("").transform(() => undefined),
      z.undefined(),
      z.null().transform(() => undefined),
    ])
    .optional(),
});

const isNonEmpty = (v) => v !== undefined && v !== null && v !== "";

// ---------- GET /api/favorites (with filters) ----------
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, sortBy, language, from, to } = listSchema.parse(req.query);
    const userId = req.user.id;

    // Build Mongo filter
    const filter = { userId };

    // Language filter (support either `language` or `lang` in stored docs)
    if (language) {
      filter.$or = [{ language }, { lang: language }];
    }

    // Date range filter on publishedAt
    if (from || to) {
      filter.publishedAt = {};
      if (from) filter.publishedAt.$gte = from;
      if (to) filter.publishedAt.$lte = to;
    }

    // Sort mapping
    const sortMap = {
      publishedAt: { publishedAt: -1, _id: -1 }, // newest first by publish date
      oldest: { publishedAt: 1, _id: 1 },        // oldest first
      title: { title: 1, _id: 1 },               // A->Z
      addedAt: { addedAt: -1, _id: -1 },         // newest saved first
    };
    const sort = sortMap[sortBy] || sortMap.publishedAt;

    const [items, total] = await Promise.all([
      Favorite.find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Favorite.countDocuments(filter),
    ]);

    res.json({ total, items, page, pageSize });
  })
);

// ---------- POST /api/favorites ----------
router.post(
  "/",
  asyncHandler(async (req, res) => {
    // DEV visibility (remove later if noisy)
    if (process.env.NODE_ENV !== "production") {
      console.log("POST /api/favorites body:", req.body);
      console.log("POST /api/favorites req.user:", req.user);
    }

    if (!req.user?.id) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const parsed = addSchema.parse(req.body);

    // Strip empty strings / undefined / null
    const payload = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => isNonEmpty(v))
    );

    const userId = req.user.id;

    try {
      const fav = await Favorite.create({ userId, ...payload });
      return res.status(201).json({ id: String(fav._id), addedAt: fav.addedAt });
    } catch (err) {
      if (err?.code === 11000) {
        const existing = await Favorite.findOne({
          userId,
          url: payload.url,
        }).lean();
        return res.status(409).json({
          error: {
            code: "ALREADY_FAVORITED",
            message: "Article already in favorites",
            id: String(existing?._id),
          },
        });
      }
      throw err;
    }
  })
);

// ---------- DELETE /api/favorites/:id ----------
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;

    const deleted = await Favorite.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Favorite not found" } });
    }
    return res.status(204).end();
  })
);

export default router;