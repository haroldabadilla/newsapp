// src/services/favoritesApi.js
import axios from "axios";

const fav = axios.create({
  baseURL: "/api/favorites",
  withCredentials: true, // carry session cookie
});

export async function listFavorites({ page = 1, pageSize = 12 } = {}) {
  const { data } = await fav.get("/", { params: { page, pageSize } });
  return data; // { total, items, page, pageSize }
}

export async function addFavorite(article) {
  // normalize payload shape the backend expects
  const payload = {
    url: article.url,
    title: article.title,
    source: article.source?.name || article.source || "Unknown",
    urlToImage: article.urlToImage,
    publishedAt: article.publishedAt,
  };
  const { data } = await fav.post("/", payload);
  return data; // { id, addedAt }
}

export async function removeFavorite(id) {
  await fav.delete(`/${id}`);
}