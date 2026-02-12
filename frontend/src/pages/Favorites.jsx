// src/pages/Favorites.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Spinner from "../components/Spinner.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import placeholderImg from "../assets/placeholder-news.png";
import { listFavorites, removeFavorite } from "../services/favoritesApi.js";
import { useDebounce } from "../utils/hooks.js";

const auth = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

// --- Toggle this to true if your API DOES NOT support filters yet.
// When true, we fetch all favorites once and filter/paginate locally.
const LOCAL_FILTERING_FALLBACK = true;

function onImgError(e) {
  if (e.currentTarget.dataset.fallbackApplied) return;
  e.currentTarget.dataset.fallbackApplied = "1";
  e.currentTarget.src = placeholderImg;
}

function makeIdFromUrl(url) {
  try {
    return (
      "art_" +
      btoa(unescape(encodeURIComponent(url)))
        .replace(/=+$/, "")
        .slice(-16)
    );
  } catch {
    return "art_" + encodeURIComponent(url).slice(-16);
  }
}

function cacheArticleForView(article, url) {
  if (!url) return;
  try {
    const id = makeIdFromUrl(url);
    sessionStorage.setItem(`newsapp_article_${id}`, JSON.stringify(article));
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[Favorites] cacheArticleForView failed:", e?.message || e);
    }
  }
}

// --- Helpers for local filtering mode ---
function parseTs(v) {
  const t = v ? Date.parse(v) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function applyFilters(list, { sortBy, fromISO, toISO, searchQuery }) {
  const fromTs = fromISO ? Date.parse(fromISO) : null;
  const toTs = toISO ? Date.parse(toISO) : null;

  let arr = Array.isArray(list) ? [...list] : [];

  // Search query filter
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    arr = arr.filter((x) => {
      const title = (x.title || "").toLowerCase();
      const desc = (x.description || "").toLowerCase();
      const source = (x.source || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || source.includes(q);
    });
  }

  if (fromTs && toTs) {
    arr = arr.filter((x) => {
      const ts = parseTs(x.publishedAt);
      return ts && ts >= fromTs && ts <= toTs;
    });
  }

  // Sorting
  arr.sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return parseTs(a.publishedAt) - parseTs(b.publishedAt);
      case "title":
        return (a.title || "").localeCompare(b.title || "");
      case "publishedAt":
      default:
        return parseTs(b.publishedAt) - parseTs(a.publishedAt); // newest first
    }
  });

  return arr;
}

export default function Favorites() {
  const navigate = useNavigate();

  // Guard + UI state
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  // Data
  const [items, setItems] = useState([]); // currently displayed page (server or local slice)
  const [total, setTotal] = useState(0);

  // For local filtering fallback (cache full list once)
  const [fullList, setFullList] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // --- Filters (matching Search UX) ---
  const [sortBy, setSortBy] = useState("publishedAt"); // publishedAt | oldest | title
  const [dateFilter, setDateFilter] = useState("all"); // all | day | week | month
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const isSearchPending = searchQuery !== debouncedSearchQuery;

  // Derived date range (same as Search.jsx)
  const dateRange = useMemo(() => {
    if (dateFilter === "all") return {};
    const now = new Date();
    const from = new Date();
    switch (dateFilter) {
      case "day":
        from.setDate(now.getDate() - 1);
        break;
      case "week":
        from.setDate(now.getDate() - 7);
        break;
      case "month":
        from.setMonth(now.getMonth() - 1);
        break;
      default:
        return {};
    }
    return { from: from.toISOString(), to: now.toISOString() };
  }, [dateFilter]);

  // 1) Route guard: ensure logged in
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        await auth.get("/me");
        if (!ignore) {
          setAllowed(true);
          setChecking(false);
        }
      } catch {
        if (!ignore) {
          setAllowed(false);
          setChecking(false);
          navigate(`/login?next=/favorites`, { replace: true });
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [navigate]);

  // Helper: fetch ALL favorites (paged) once for local filtering fallback
  const fetchAllFavorites = useCallback(async () => {
    let p = 1;
    const size = 100; // reasonable batch size
    const acc = [];
    // loop until we've fetched total
    // first call to get total
    const first = await listFavorites({ page: p, pageSize: size });
    const grandTotal = first.total || 0;
    acc.push(...(first.items || []));
    while (acc.length < grandTotal) {
      p += 1;
      const res = await listFavorites({ page: p, pageSize: size });
      acc.push(...(res.items || []));
      if (!res.items || res.items.length === 0) break; // safety
    }
    return acc;
  }, []);

  // 2) Loader with server-first, local fallback
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      if (!LOCAL_FILTERING_FALLBACK) {
        // Server-side filtering — pass filters directly
        const data = await listFavorites({
          page,
          pageSize,
          sortBy, // (publishedAt|oldest|title) — validate server-side
          from: dateRange.from,
          to: dateRange.to,
        });
        setItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        // Local fallback — fetch all once, then filter + paginate
        const base = fullList ?? (await fetchAllFavorites());
        if (!fullList) setFullList(base);

        const filtered = applyFilters(base, {
          sortBy,
          fromISO: dateRange.from,
          toISO: dateRange.to,
          searchQuery: debouncedSearchQuery,
        });

        setTotal(filtered.length);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        setItems(filtered.slice(start, end));
      }
    } catch (e) {
      setErr("Failed to load favorites. Please try again.");
      if (import.meta.env.DEV) console.error(e);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    sortBy,
    dateRange.from,
    dateRange.to,
    debouncedSearchQuery,
    fetchAllFavorites,
    fullList,
  ]);

  // Initial & subsequent loads
  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed, load]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [sortBy, dateFilter, debouncedSearchQuery]);

  // 3) Remove action
  async function onRemove(id) {
    try {
      await removeFavorite(id);
      // If using local fallback, also prune from fullList cache
      if (LOCAL_FILTERING_FALLBACK && fullList) {
        const next = fullList.filter((x) => (x.id || x._id) !== id);
        setFullList(next);
      }
      // Refresh current page; if page becomes empty after deletion, go back one page
      const remaining = items.length - 1;
      if (remaining === 0 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await load();
      }
    } catch (e) {
      setErr("Failed to remove favorite. Please try again.");
      if (import.meta.env.DEV) console.error(e);
    }
  }

  if (checking) {
    return (
      <div className="my-5">
        <Spinner label="Checking your session…" size="lg" />
      </div>
    );
  }

  if (!allowed) return null; // redirected already

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Favorites</h2>
      </div>

      {/* Filter Bar */}
      <div className="card card-surface mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <label htmlFor="searchQuery" className="form-label small">
                Search Saved Articles
              </label>
              <input
                id="searchQuery"
                type="text"
                className="form-control"
                placeholder="Search by title, description, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearchPending && (
                <small className="text-muted">
                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                  Searching...
                </small>
              )}
            </div>

            <div className="col-md-4">
              <label htmlFor="dateFilter" className="form-label small">
                Date Range
              </label>
              <select
                id="dateFilter"
                className="form-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="my-5">
          <Spinner label="Loading favorites…" size="lg" />
        </div>
      )}

      {err && <div className="alert alert-danger">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="alert alert-info">
          No favorites match your filters. Try clearing filters or add new items from articles
          (use <b>Add to Favorites</b>).
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
            {items.map((fav) => {
              const detailPath = fav.url
                ? `/article/${encodeURIComponent(fav.url)}`
                : "#";

              // Prepare article object for caching
              const articleForCache = {
                url: fav.url,
                title: fav.title,
                source: { name: fav.source },
                urlToImage: fav.urlToImage,
                publishedAt: fav.publishedAt,
                description: fav.description,
                content: fav.content,
              };

              return (
                <div key={fav.id || fav._id || fav.url} className="col">
                  <div className="card-surface h-100">
                    <div className="ratio ratio-16x9">
                      <img
                        src={fav.urlToImage || placeholderImg}
                        alt={fav.title || "Article image"}
                        onError={onImgError}
                        className="w-100"
                        style={{
                          objectFit: "cover",
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                        }}
                      />
                    </div>

                    {/* Match NewsCard padding and layout */}
                    <div className="card-body d-flex flex-column p-3 p-sm-4">
                      <div className="small text-muted mb-2">
                        {fav.source || "Unknown source"} •{" "}
                        {fav.publishedAt
                          ? new Date(fav.publishedAt).toLocaleString()
                          : "—"}
                      </div>

                      <h5 className="card-title">
                        {fav.title || "Untitled article"}
                      </h5>

                      {fav.description && (
                        <p className="card-text text-muted mb-0">
                          {fav.description}
                        </p>
                      )}

                      {/* Centered actions with comfy spacing (same as NewsCard) */}
                      <div className="mt-auto pt-3">
                        <div className="d-flex justify-content-center flex-wrap gap-2">
                          {fav.url && (
                            <Link
                              className="btn btn-accent px-3 py-2"
                              to={detailPath}
                              state={{ article: articleForCache }}
                              onClick={() =>
                                cacheArticleForView(articleForCache, fav.url)
                              }
                            >
                              Read
                            </Link>
                          )}
                          {fav.url && (
                            <a
                              className="btn btn-outline-light px-3 py-2"
                              href={fav.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Source
                            </a>
                          )}
                          <button
                            className="btn btn-outline-danger px-3 py-2"
                            onClick={() => onRemove(fav.id || fav._id)}
                            title="Remove from favorites"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationBar
            page={page}
            total={total}
            pageSize={pageSize}
            onChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pageSizeOptions={[12, 24, 50, 100]}
            window={2}
            showFirstLast={true}
            compact={false}
          />
        </>
      )}
    </>
  );
}
