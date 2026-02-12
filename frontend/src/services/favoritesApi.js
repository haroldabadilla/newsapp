// src/services/favoritesApi.js
import axios from "axios";

const fav = axios.create({
  baseURL: "/api/favorites",
  withCredentials: true, // carry session cookie
});

/**
 * Normalize/sanitize what we send to POST /api/favorites
 * - Keep only meaningful fields
 * - Accept publishedAt as ISO or Date (backend zod handles both)
 * - Capture language if available so server-side language filtering can work
 */
function sanitizeFavoritePayload(article) {
  const raw = {
    url: article?.url,
    title: article?.title,
    source: article?.source?.name || article?.source || undefined,
    urlToImage: article?.urlToImage || undefined,
    description: article?.description || undefined,
    content: article?.content || undefined,
    publishedAt: article?.publishedAt || undefined, // ISO string or Date or undefined
    language:
      (article?.language || article?.lang || "").toString().trim().toLowerCase() ||
      undefined,
  };

  // Remove undefined/null/empty string fields
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

  // If publishedAt is present but invalid string -> drop it
  if (
    typeof cleaned.publishedAt === "string" &&
    isNaN(Date.parse(cleaned.publishedAt))
  ) {
    delete cleaned.publishedAt;
  }

  return cleaned;
}

/**
 * List favorites with optional filters & sorting.
 * @param {Object} opts
 * @param {number} [opts.page=1]
 * @param {number} [opts.pageSize=12]
 * @param {"publishedAt"|"oldest"|"title"|"addedAt"} [opts.sortBy="publishedAt"]
 * @param {string} [opts.language] - e.g. "en"; omit or "all" to disable language filtering
 * @param {string|Date} [opts.from] - ISO string or Date; filters publishedAt >= from
 * @param {string|Date} [opts.to]   - ISO string or Date; filters publishedAt <= to
 */
export async function listFavorites({
  page = 1,
  pageSize = 12,
  sortBy = "publishedAt",
  language,
  from,
  to,
} = {}) {
  const params = {
    page,
    pageSize,
    sortBy,
    // Send language only if not "all" and truthy
    language: language && language !== "all" ? language : undefined,
    from: from instanceof Date ? from.toISOString() : from,
    to: to instanceof Date ? to.toISOString() : to,
  };

  const { data } = await fav.get("/", { params });
  return data; // { total, items, page, pageSize }
}

export async function addFavorite(article) {
  const payload = sanitizeFavoritePayload(article);
  if (!payload.url) {
    // mimic backend message for consistency
    const err = new Error("A valid article URL is required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  const { data } = await fav.post("/", payload);
  return data; // { id, addedAt }
}

export async function removeFavorite(id) {
  await fav.delete(`/${id}`);
}