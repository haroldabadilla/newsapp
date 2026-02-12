// src/services/newsApi.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api/news", // our backend proxy
  withCredentials: true,
});

// =================== CLIENT-SIDE CACHE ===================
const CLIENT_CACHE_SCHEMA = "v2"; // bump to invalidate any old, non-normalized cache

const cache = new Map();
const CACHE_TTL = {
  headlines: 2 * 60 * 1000,   // 2 minutes
  everything: 2 * 60 * 1000,  // 2 minutes
  sources: 10 * 60 * 1000,    // 10 minutes
};

function getCacheKey(endpoint, params = {}) {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `${endpoint}?${sortedParams}|${CLIENT_CACHE_SCHEMA}`;
}

function getFromCache(key, ttl) {
  const cached = cache.get(key);
  if (!cached) return null;
  const age = Date.now() - cached.timestamp;
  if (age > ttl) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // soft cap
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// =================== REQUEST DEDUPLICATION ===================
const pendingRequests = new Map();

async function deduplicatedRequest(key, requestFn) {
  if (pendingRequests.has(key)) return pendingRequests.get(key);
  const p = requestFn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, p);
  return p;
}

// =================== NORMALIZATION HELPERS ===================

/**
 * Depth-limited scan to locate a probable article array:
 * an array of objects that has at least `title` or `url`.
 */
function findArrayOfObjectsWithKeys(obj, keys = ["title", "url"], depth = 0, maxDepth = 6) {
  if (!obj || typeof obj !== "object" || depth > maxDepth) return null;
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === "object") {
      const hasAnyKey = keys.some((k) => k in obj[0]);
      if (hasAnyKey) return obj;
    }
    return null;
  }
  for (const k of Object.keys(obj)) {
    const child = obj[k];
    const found = findArrayOfObjectsWithKeys(child, keys, depth + 1, maxDepth);
    if (found) return found;
  }
  return null;
}

/**
 * Normalize *any* reasonable response shape to:
 *   { articles: Article[], totalResults: number }
 *
 * Handles:
 *   - { articles, totalResults } (NewsAPI native)
 *   - { items, total } (common proxy)
 *   - axios nested envelopes (.data, .payload, .result, .response)
 *   - deep nested arrays (fallback)
 */
function normalizeNewsResponse(res) {
  const root = res?.data ?? res;

  const candidates = [
    root,
    root?.data,
    root?.payload,
    root?.result,
    root?.response,
  ];

  let articles = [];
  for (const obj of candidates) {
    if (!obj) continue;
    if (Array.isArray(obj.articles)) { articles = obj.articles; break; }
    if (Array.isArray(obj.items))    { articles = obj.items;    break; }
    if (Array.isArray(obj?.data?.articles)) { articles = obj.data.articles; break; }
    if (Array.isArray(obj?.data?.items))    { articles = obj.data.items;    break; }
  }

  if (!Array.isArray(articles) || articles.length === 0) {
    const hit = findArrayOfObjectsWithKeys(root);
    if (Array.isArray(hit)) articles = hit;
  }

  const totals = [
    root?.totalResults, root?.total,
    root?.data?.totalResults, root?.data?.total,
    root?.payload?.totalResults, root?.payload?.total,
    root?.result?.totalResults, root?.result?.total,
  ].filter((n) => Number.isFinite(n));
  const totalResults = totals[0] ?? (Array.isArray(articles) ? articles.length : 0);

  return {
    articles: Array.isArray(articles) ? articles.filter(Boolean) : [],
    totalResults,
  };
}

// =================== PUBLIC API ===================

export async function fetchTopHeadlines({
  country = "us",
  category,
  q,
  page = 1,
  pageSize = 12,
} = {}) {
  const params = { country, page, pageSize };
  if (category) params.category = category;
  if (q) params.q = q;

  const cacheKey = getCacheKey("top-headlines", params);

  // cache first
  const cached = getFromCache(cacheKey, CACHE_TTL.headlines);
  if (cached) return cached;

  // dedupe + normalize
  return deduplicatedRequest(cacheKey, async () => {
    const res = await api.get("/top-headlines", { params });
    const normalized = normalizeNewsResponse(res);
    setCache(cacheKey, normalized);
    return normalized;
  });
}

export async function searchEverything({
  q,
  searchIn,
  from,
  to,
  language = "en",
  sortBy = "publishedAt",
  page = 1,
  pageSize = 12,
  sources,
  domains,
  excludeDomains,
} = {}) {
  const params = {
    q,
    searchIn,
    from,
    to,
    language,
    sortBy,
    page,
    pageSize,
    sources,
    domains,
    excludeDomains,
  };
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

  const cacheKey = getCacheKey("everything", params);

  const cached = getFromCache(cacheKey, CACHE_TTL.everything);
  if (cached) return cached;

  return deduplicatedRequest(cacheKey, async () => {
    const res = await api.get("/everything", { params });
    const normalized = normalizeNewsResponse(res);
    setCache(cacheKey, normalized);
    return normalized;
  });
}

/**
 * Sources is usually already simple; we keep it raw to avoid breaking any caller
 * that expects `{ status, sources }` from NewsAPI or your proxy.
 */
export async function listSources({ category, language, country } = {}) {
  const params = { category, language, country };
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

  const cacheKey = getCacheKey("sources", params);

  const cached = getFromCache(cacheKey, CACHE_TTL.sources);
  if (cached) return cached;

  return deduplicatedRequest(cacheKey, async () => {
    const { data } = await api.get("/sources", { params });
    setCache(cacheKey, data);
    return data;
  });
}

export function clearNewsCache() {
  cache.clear();
  pendingRequests.clear();
}