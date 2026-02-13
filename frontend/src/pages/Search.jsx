// src/pages/Search.jsx
import { useEffect, useMemo, useState } from "react";
import { searchEverything } from "../services/newsApi.js";
import NewsCard from "../components/NewsCard.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import Spinner from "../components/Spinner.jsx";
import { useRevealOnScroll } from "../utils/useReveal.js";

export default function Search() {
  // Query
  const [q, setQ] = useState(""); // The actual search query that triggers fetches
  const [inputValue, setInputValue] = useState(""); // The input field value

  // Filters
  const [sortBy, setSortBy] = useState("publishedAt");
  const [language, setLanguage] = useState("en");
  const [dateFilter, setDateFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // user‑adjustable

  // Data
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Memoize reveal options to prevent unnecessary observer recreation
  const revealOptions = useMemo(
    () => ({ threshold: 0.1, rootMargin: "0px 0px -10% 0px" }),
    [],
  );

  // Fade-in on scroll; re-scan when list or page changes
  useRevealOnScroll(".reveal", revealOptions, `${articles.length}-${page}`);

  // ✅ Memoize derived date range to satisfy React Hook rules
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

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    // ---- Helpers -----------------------------------------------------------

    // Deep-scan object graph to find an array of article-like objects
    function findArticlesDeep(obj, depth = 0) {
      if (!obj || typeof obj !== "object" || depth > 5) return null;
      if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === "object") {
          // Heuristic: looks like an article list if objects have a 'title' or 'url'
          if ("title" in obj[0] || "url" in obj[0]) return obj;
        }
        return null;
      }
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (Array.isArray(val)) {
          const hit = findArticlesDeep(val, depth + 1);
          if (hit) return hit;
        } else if (val && typeof val === "object") {
          const hit = findArticlesDeep(val, depth + 1);
          if (hit) return hit;
        }
      }
      return null;
    }

    // Accept {articles} or {items}, and also Axios .data.* or other nesting
    const pickArticles = (res) =>
      res?.articles ??
      res?.items ??
      res?.data?.articles ??
      res?.data?.items ??
      findArticlesDeep(res) ??
      [];

    const pickTotal = (res, list) =>
      res?.totalResults ??
      res?.total ??
      res?.data?.totalResults ??
      res?.data?.total ??
      (Array.isArray(list) ? list.length : 0);

    // Ensure we render exactly pageSize items when possible (page 2 top-up)
    async function topUpIfNeeded(baseItems = [], total = 0) {
      let items = (baseItems || []).filter(Boolean).slice(0, pageSize);
      if (items.length >= pageSize) return items;

      const remainingPossible = Math.max(0, total - (page - 1) * pageSize);
      if (remainingPossible <= items.length) return items; // last page for real

      try {
        const moreRes = await searchEverything({
          q: q || "news",
          page: page + 1,
          pageSize,
          sortBy,
          language,
          ...dateRange,
          // signal: controller.signal, // enable if your service supports it
        });
        const nextItems = pickArticles(moreRes).filter(Boolean);
        items = items.concat(nextItems).slice(0, pageSize);

        if (import.meta.env.DEV) {
          console.log("[Search] top-up fetched:", {
            nextPage: page + 1,
            nextItems: nextItems.length,
            combined: items.length,
          });
        }
      } catch {
        // ignore failure, return partial items
      }
      return items;
    }

    // ---- Fetch -------------------------------------------------------------

    (async () => {
      const searchQuery = q || "news"; // default term so the grid isn't empty
      try {
        setLoading(true);
        setErr(null);

        const res = await searchEverything({
          q: searchQuery,
          page,
          pageSize,
          sortBy,
          language,
          ...dateRange,
          // signal: controller.signal,
        });

        const baseItems = pickArticles(res);
        const total = pickTotal(res, baseItems);
        const filled = await topUpIfNeeded(baseItems, total);

        if (!ignore) {
          if (import.meta.env.DEV) {
            console.log("[Search] fetched:", {
              q: searchQuery,
              candidates: {
                "res.articles":
                  Array.isArray(res?.articles) && res.articles.length,
                "res.items": Array.isArray(res?.items) && res.items.length,
                "res.data.articles":
                  Array.isArray(res?.data?.articles) &&
                  res.data.articles.length,
                "res.data.items":
                  Array.isArray(res?.data?.items) && res.data.items.length,
                deepScan:
                  Array.isArray(findArticlesDeep(res)) &&
                  findArticlesDeep(res)?.length,
              },
              got: baseItems.length,
              filled: filled.length,
              total,
            });
          }

          setArticles(filled || []);
          setTotalResults(total || 0);
        }
      } catch (e) {
        if (!ignore && e.name !== "AbortError") {
          setErr("Failed to load search results. Please try again.");
          if (import.meta.env.DEV) console.error(e);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [q, page, pageSize, sortBy, language, dateRange]);

  function onSubmit(e) {
    e.preventDefault();
    const trimmedQuery = inputValue.trim();
    if (trimmedQuery && trimmedQuery !== q) {
      setPage(1); // reset to first page when query changes
      setQ(trimmedQuery);
    } else if (trimmedQuery === q) {
      // Same query, just reset page
      setPage(1);
    }
  }

  return (
    <>
      <h2>Search</h2>

      {/* Filter Bar */}
      <div className="card card-surface mb-3">
        <div className="card-body">
          <h6 className="card-title mb-3">Filters</h6>
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="sortBy" className="form-label small">
                Sort by
              </label>
              <select
                id="sortBy"
                className="form-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="publishedAt">Newest First</option>
                <option value="relevancy">Relevancy</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>

            <div className="col-md-4">
              <label htmlFor="dateFilter" className="form-label small">
                Date Range
              </label>
              <select
                id="dateFilter"
                className="form-select"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Time</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>

            <div className="col-md-4">
              <label htmlFor="language" className="form-label small">
                Language
              </label>
              <select
                id="language"
                className="form-select"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setPage(1);
                }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ar">Arabic</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <form className="d-flex gap-2 mb-3" onSubmit={onSubmit}>
        <input
          className="form-control"
          placeholder="Search articles..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button className="btn btn-accent" type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {loading && (
        <div className="my-5">
          <Spinner label="Searching articles…" size="lg" />
        </div>
      )}

      {err && <div className="alert alert-danger">{err}</div>}

      {!loading && articles.length === 0 && !err && (
        <div className="card card-surface p-4 text-center">
          <h6 className="mb-1">No results found for “{q}”.</h6>
          <p className="text-muted mb-0">
            Try another keyword or adjust filters.
          </p>
        </div>
      )}

      {!loading && (
        <>
          <div className="bento-grid">
            {articles.map((a, i) => (
              <NewsCard key={a.url || i} article={a} index={i} />
            ))}
          </div>

          <PaginationBar
            page={page}
            total={totalResults}
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
