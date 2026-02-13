// src/pages/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchTopHeadlines, searchEverything } from "../services/newsApi.js";
import NewsCard from "../components/NewsCard.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import Spinner from "../components/Spinner.jsx";
import { useDebounce } from "../utils/hooks.js";
import { useRevealOnScroll } from "../utils/useReveal.js";

export default function Home() {
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const isSearchPending = searchQuery !== debouncedSearchQuery;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isShowingRandom, setIsShowingRandom] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Memoize reveal options to prevent unnecessary observer recreation
  const revealOptions = useMemo(
    () => ({ threshold: 0.1, rootMargin: "0px 0px -10% 0px" }),
    [],
  );

  // Fade-in on scroll; re-scan when list/page changes
  useRevealOnScroll(".reveal", revealOptions, `${articles.length}-${page}`);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    // Ensure we render exactly pageSize items when possible
    async function topUpIfNeeded(baseItems = [], total = 0, fetchPageFn) {
      // sanitize and trim to pageSize
      let items = (baseItems || []).filter(Boolean).slice(0, pageSize);
      if (items.length >= pageSize) return items;

      // if this is truly the last page, or API total is small, return what we have
      const remainingPossible = Math.max(0, total - (page - 1) * pageSize);
      if (remainingPossible <= items.length) return items;

      try {
        const next = await fetchPageFn(page + 1);
        const more = (next?.articles || []).filter(Boolean);
        items = items.concat(more).slice(0, pageSize);
      } catch {
        // ignore failures; still return partial items
      }
      return items;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Try top headlines first
        const headlineParams = { page, pageSize };
        if (category) headlineParams.category = category;
        if (debouncedSearchQuery) headlineParams.q = debouncedSearchQuery;

        const headlineData = await fetchTopHeadlines(headlineParams);

        if (
          !ignore &&
          Array.isArray(headlineData?.articles) &&
          headlineData.articles.length > 0
        ) {
          // top up from the next headlines page if needed
          const filled = await topUpIfNeeded(
            headlineData.articles,
            headlineData.totalResults || 0,
            async (p) =>
              fetchTopHeadlines({
                page: p,
                pageSize,
                ...(category ? { category } : {}),
                ...(debouncedSearchQuery ? { q: debouncedSearchQuery } : {}),
              }),
          );

          setArticles(filled);
          setTotalResults(headlineData.totalResults || 0);
          setIsShowingRandom(false);
        } else if (!ignore) {
          // Fallback: use "everything" search (still topped-up)
          const q = debouncedSearchQuery || category || "news";
          const randomParams = {
            page,
            pageSize,
            sortBy: "publishedAt",
            language: "en",
            q,
          };
          const randomData = await searchEverything(randomParams);

          const filled = await topUpIfNeeded(
            randomData.articles,
            randomData.totalResults || 0,
            async (p) => searchEverything({ ...randomParams, page: p }),
          );

          setArticles(filled || []);
          setTotalResults(randomData.totalResults || 0);
          setIsShowingRandom(true);
        }
      } catch (e) {
        if (!ignore && e.name !== "AbortError") {
          setErr("Failed to load headlines. Please try again.");
          if (import.meta.env.DEV) console.error(e);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      controller.abort(); // keeps pattern consistent even if your services don't use signal yet
    };
  }, [page, pageSize, category, debouncedSearchQuery]);

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">
          {isShowingRandom ? "Latest News" : "Top Headlines"}
        </h2>
        {isShowingRandom && (
          <span className="badge bg-secondary">Random Headlines</span>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card card-surface mb-3">
        <div className="card-body">
          <h6 className="card-title mb-3">Filters</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="category" className="form-label small">
                Category
              </label>
              <select
                id="category"
                className="form-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                <option value="business">Business</option>
                <option value="entertainment">Entertainment</option>
                <option value="general">General</option>
                <option value="health">Health</option>
                <option value="science">Science</option>
                <option value="sports">Sports</option>
                <option value="technology">Technology</option>
              </select>
            </div>

            <div className="col-md-6">
              <label htmlFor="searchQuery" className="form-label small">
                Search in Headlines
              </label>
              <input
                id="searchQuery"
                type="text"
                className="form-control"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
              {isSearchPending && (
                <small className="text-muted">
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                  />
                  Typing...
                </small>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="my-5">
          <Spinner label="Fetching headlines…" size="lg" />
        </div>
      )}

      {err && <div className="alert alert-danger">{err}</div>}

      {!loading && articles.length === 0 && !err && (
        <div className="alert alert-info">No articles found.</div>
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
