import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Favorite } from "../models/Favorite.js";

const router = Router();

// All /api/favorites routes require auth
router.use(requireAuth);

// Validation
const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

const addSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  source: z.string().optional(),
  urlToImage: z.string().url().optional(),
  publishedAt: z.coerce.date().optional(),
});

// GET /api/favorites
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize } = listSchema.parse(req.query);
    const userId = req.user.id;

    const [items, total] = await Promise.all([
      Favorite.find({ userId })
        .sort({ addedAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Favorite.countDocuments({ userId }),
    ]);

    res.json({ total, items, page, pageSize });
  }),
);

// POST /api/favorites
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { url, title, source, urlToImage, publishedAt } = addSchema.parse(
      req.body,
    );
    const userId = req.user.id;

    try {
      const fav = await Favorite.create({
        userId,
        url,
        title,
        source,
        urlToImage,
        publishedAt,
      });
      return res
        .status(201)
        .json({ id: String(fav._id), addedAt: fav.addedAt });
    } catch (err) {
      if (err?.code === 11000) {
        // already exists -> idempotent result
        const existing = await Favorite.findOne({ userId, url }).lean();
        return res
          .status(409)
          .json({
            error: {
              code: "ALREADY_FAVORITED",
              message: "Article already in favorites",
              id: String(existing?._id),
            },
          });
      }
      throw err;
    }
  }),
);

// DELETE /api/favorites/:id
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
  }),
);

export default router;
