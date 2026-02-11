// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { fetchTopHeadlines } from "../services/newsApi.js";
import NewsCard from "../components/NewsCard.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import Spinner from "../components/Spinner.jsx";
import { useDebounce } from "../utils/hooks.js";

export default function Home() {
  const [country, setCountry] = useState("us");
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const isSearchPending = searchQuery !== debouncedSearchQuery;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const params = { country, page, pageSize };
        if (category) params.category = category;
        if (debouncedSearchQuery) params.q = debouncedSearchQuery;

        const data = await fetchTopHeadlines(params);
        if (!ignore) {
          setArticles(data.articles || []);
          setTotalResults(data.totalResults || 0);
        }
      } catch (e) {
        if (!ignore && e.name !== "AbortError") {
          setErr("Failed to load headlines. Please try again.");
          console.error(e);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; controller.abort(); };
  }, [page, pageSize, country, category, debouncedSearchQuery]);

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Top Headlines</h2>
      </div>

      {/* Filter Bar */}
      <div className="card card-surface mb-3">
        <div className="card-body">
          <h6 className="card-title mb-3">Filters</h6>
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="country" className="form-label small">Country</label>
              <select
                id="country"
                className="form-select"
                value={country}
                onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              >
                <option value="us">United States</option>
                <option value="gb">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
                <option value="de">Germany</option>
                <option value="fr">France</option>
                <option value="it">Italy</option>
                <option value="es">Spain</option>
                <option value="jp">Japan</option>
                <option value="in">India</option>
                <option value="cn">China</option>
                <option value="br">Brazil</option>
                <option value="mx">Mexico</option>
              </select>
            </div>

            <div className="col-md-4">
              <label htmlFor="category" className="form-label small">Category</label>
              <select
                id="category"
                className="form-select"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
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

            <div className="col-md-4">
              <label htmlFor="searchQuery" className="form-label small">Search in Headlines</label>
              <input
                id="searchQuery"
                type="text"
                className="form-control"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
              {isSearchPending && (
                <small className="text-muted">
                  <span className="spinner-border spinner-border-sm me-1" role="status" />
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
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
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