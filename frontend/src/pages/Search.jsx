// src/pages/Search.jsx
import { useEffect, useMemo, useState } from "react";
import { searchEverything } from "../services/newsApi.js";
import NewsCard from "../components/NewsCard.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Search() {
  // Query
  const [q, setQ] = useState("technology");

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

    (async () => {
      if (!q) return;
      try {
        setLoading(true);
        setErr(null);
        const data = await searchEverything({
          q,
          page,
          pageSize,
          sortBy,
          language,
          ...dateRange,
          // signal: controller.signal, // if your service supports AbortController
        });

        if (!ignore) {
          setArticles(data.articles || []);
          setTotalResults(data.totalResults || 0);
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
    const nextQ = e.target.elements.q.value.trim();
    if (nextQ !== q) {
      setPage(1); // reset to first page when query changes
      setQ(nextQ);
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
          name="q"
          placeholder="Search articles..."
          defaultValue={q}
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
          <p className="text-muted mb-0">Try another keyword or adjust filters.</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
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