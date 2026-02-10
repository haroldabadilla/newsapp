import axios from "axios";

const api = axios.create({
  baseURL: "/api/news", // our backend proxy
  withCredentials: true, // fine to leave true
});

// No API key here — backend injects it

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
  const { data } = await api.get("/top-headlines", { params }); // ← no /v2
  return data;
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
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k],
  );
  const { data } = await api.get("/everything", { params }); // ← no /v2
  return data;
}

export async function listSources({ category, language, country } = {}) {
  const params = { category, language, country };
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k],
  );
  const { data } = await api.get("/sources", { params }); // ← no /v2
  return data;
}
