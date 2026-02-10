// src/services/favoritesApi.js
import axios from "axios";

const fav = axios.create({
  baseURL: "/api/favorites",
  withCredentials: true, // carry session cookie
});

function sanitizeFavoritePayload(article) {
  const raw = {
    url: article?.url,
    title: article?.title,
    source: article?.source?.name || article?.source || undefined,
    urlToImage: article?.urlToImage || undefined,
    publishedAt: article?.publishedAt || undefined, // ISO string or Date or undefined
  };

  // Remove undefined/null/empty string fields
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  // If publishedAt is present but invalid string -> drop it
  if (typeof cleaned.publishedAt === "string" && isNaN(Date.parse(cleaned.publishedAt))) {
    delete cleaned.publishedAt;
  }

  return cleaned;
}

export async function listFavorites({ page = 1, pageSize = 12 } = {}) {
  const { data } = await fav.get("/", { params: { page, pageSize } });
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