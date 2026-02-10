import { Router } from "express";
import axios from "axios";
import { z } from "zod";

const router = Router();

const NEWS_API_BASE = process.env.NEWS_API_BASE || "https://newsapi.org";
const NEWS_API_KEY = process.env.NEWS_API_KEY;

if (!NEWS_API_KEY) {
  console.warn(
    "WARNING: NEWS_API_KEY not set. /api/news/* will fail until you set it.",
  );
}

const api = axios.create({
  baseURL: NEWS_API_BASE,
  timeout: 10000,
  headers: { "X-Api-Key": NEWS_API_KEY }, // or { Authorization: NEWS_API_KEY }
});

// Short-circuit if key missing (nice to have)
router.use((req, res, next) => {
  if (!NEWS_API_KEY) {
    return res.status(503).json({
      error: { code: "CONFIG", message: "NEWS_API_KEY not configured" },
    });
  }
  next();
});

// --- tiny in-memory cache (optional) ---
const cache = new Map(); // key -> { data, expiresAt }
const TTL = {
  headlines: 30_000, // 30s
  everything: 30_000,
  sources: 60 * 60 * 1000, // 1h
};

function relayNewsApiResponse(res, data) {
  if (data?.status === "error") {
    const code = String(data.code || "upstream_error");
    const message = String(data.message || "Upstream error");
    const map = {
      apiKeyMissing: 401,
      apiKeyInvalid: 401,
      apiKeyDisabled: 401,
      rateLimited: 429,
      maximumResultsReached: 429,
      sourcesTooMany: 400,
      parametersMissing: 400,
      parametersIncompatible: 400,
      unexpectedError: 502,
    };
    return res.status(map[code] || 502).json({ error: { code, message } });
  }
  return res.json(data);
}

function makeCacheKey(path, params) {
  const p = { ...params };
  Object.keys(p).forEach((k) => p[k] === undefined && delete p[k]);
  return `${path}?${new URLSearchParams(Object.entries(p).sort()).toString()}`;
}

async function getWithCache(path, params, ttlMs) {
  const key = makeCacheKey(path, params);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.data;
  const { data } = await api.get(path, { params });
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

// --- Validation schemas ---
const paged = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
};

const topHeadlinesSchema = z.object({
  country: z.string().length(2).optional(),
  category: z
    .enum([
      "business",
      "entertainment",
      "general",
      "health",
      "science",
      "sports",
      "technology",
    ])
    .optional(),
  sources: z.string().optional(), // comma-separated IDs (exclusive with country/category)
  q: z.string().max(500).optional(),
  page: paged.page,
  pageSize: paged.pageSize,
});

const everythingSchema = z.object({
  q: z.string().max(500).optional(),
  searchIn: z.string().optional(),
  sources: z.string().optional(),
  domains: z.string().optional(),
  excludeDomains: z.string().optional(),
  from: z.string().optional(), // ISO 8601
  to: z.string().optional(),
  language: z.string().length(2).optional(),
  sortBy: z
    .enum(["relevancy", "popularity", "publishedAt"])
    .optional()
    .default("publishedAt"),
  page: paged.page,
  pageSize: paged.pageSize,
});

const sourcesSchema = z.object({
  category: z
    .enum([
      "business",
      "entertainment",
      "general",
      "health",
      "science",
      "sports",
      "technology",
    ])
    .optional(),
  language: z.string().length(2).optional(),
  country: z.string().length(2).optional(),
});

// Normalizers (optional but nice)
function normalizeTopHeadlinesParams(raw) {
  const p = { ...raw };
  if (p.country) p.country = String(p.country).toLowerCase();
  if (p.category) p.category = String(p.category).toLowerCase();
  if (p.q) p.q = String(p.q).trim();
  return p;
}
function normalizeEverythingParams(raw) {
  const p = { ...raw };
  if (p.language) p.language = String(p.language).toLowerCase();
  if (p.sortBy) p.sortBy = String(p.sortBy);
  if (p.q) p.q = String(p.q).trim();
  return p;
}

// --- Routes ---

// GET /api/news/top-headlines
router.get("/top-headlines", async (req, res, next) => {
  try {
    const params = topHeadlinesSchema.parse(req.query);
    if (params.sources && (params.country || params.category)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "You can't mix 'sources' with 'country' or 'category'.",
        },
      });
    }
    const norm = normalizeTopHeadlinesParams(params);

    const data = await getWithCache("/v2/top-headlines", params, 30_000);
    return relayNewsApiResponse(res, data);
  } catch (err) {
    return next(err);
  }
});

// GET /api/news/everything
router.get("/everything", async (req, res, next) => {
  try {
    const params = everythingSchema.parse(req.query);
    if (!params.q && !params.sources && !params.domains) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Provide 'q', 'sources', or 'domains'.",
        },
      });
    }
    const norm = normalizeEverythingParams(params);

    const data = await getWithCache("/v2/everything", params, 30_000);
    return relayNewsApiResponse(res, data);
  } catch (err) {
    return next(err);
  }
});

// GET /api/news/sources
router.get("/sources", async (req, res, next) => {
  try {
    const params = sourcesSchema.parse(req.query);

    const data = await getWithCache(
      "/v2/top-headlines/sources",
      params,
      60 * 60 * 1000,
    );
    return relayNewsApiResponse(res, data);
  } catch (err) {
    return next(err);
  }
});

export default router;
