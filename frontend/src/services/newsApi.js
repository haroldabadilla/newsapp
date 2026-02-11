import axios from "axios";

const api = axios.create({
  baseURL: "/api/news", // our backend proxy
  withCredentials: true, // fine to leave true
});

// No API key here — backend injects it

// ============ CLIENT-SIDE CACHE ============
const cache = new Map();
const CACHE_TTL = {
  headlines: 2 * 60 * 1000, // 2 minutes
  everything: 2 * 60 * 1000, // 2 minutes
  sources: 10 * 60 * 1000, // 10 minutes
};

function getCacheKey(endpoint, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `${endpoint}?${sortedParams}`;
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
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });

  // Limit cache size to prevent memory issues
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// ============ REQUEST DEDUPLICATION ============
const pendingRequests = new Map();

async function deduplicatedRequest(key, requestFn) {
  // If same request is already in flight, return that promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// ============ API FUNCTIONS ============

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

  // Check cache first
  const cached = getFromCache(cacheKey, CACHE_TTL.headlines);
  if (cached) {
    return cached;
  }

  // Deduplicate identical requests
  return deduplicatedRequest(cacheKey, async () => {
    const { data } = await api.get("/top-headlines", { params });
    setCache(cacheKey, data);
    return data;
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
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k],
  );

  const cacheKey = getCacheKey("everything", params);

  // Check cache first
  const cached = getFromCache(cacheKey, CACHE_TTL.everything);
  if (cached) {
    return cached;
  }

  // Deduplicate identical requests
  return deduplicatedRequest(cacheKey, async () => {
    const { data } = await api.get("/everything", { params });
    setCache(cacheKey, data);
    return data;
  });
}

export async function listSources({ category, language, country } = {}) {
  const params = { category, language, country };
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k],
  );

  const cacheKey = getCacheKey("sources", params);

  // Check cache first
  const cached = getFromCache(cacheKey, CACHE_TTL.sources);
  if (cached) {
    return cached;
  }

  // Deduplicate identical requests
  return deduplicatedRequest(cacheKey, async () => {
    const { data } = await api.get("/sources", { params });
    setCache(cacheKey, data);
    return data;
  });
}

// Clear cache manually if needed
export function clearNewsCache() {
  cache.clear();
  pendingRequests.clear();
}
