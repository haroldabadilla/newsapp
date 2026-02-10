import { useEffect, useState } from "react";
import { searchEverything } from "../services/newsApi.js";
import NewsCard from "../components/NewsCard.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Search() {
  // Query
  const [q, setQ] = useState("technology");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // ← user-adjustable

  // Data
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!q) return;
      try {
        setLoading(true);
        setErr(null);
        const data = await searchEverything({
          q,
          page,
          pageSize, // ← honor selected page size
          sortBy: "publishedAt",
          language: "en",
        });
        if (!ignore) {
          setArticles(data.articles || []);
          setTotalResults(data.totalResults || 0);
        }
      } catch (e) {
        if (!ignore) setErr("Failed to load search results. Please try again.");
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [q, page, pageSize]); // ← refetch when pageSize changes too

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
      <form className="d-flex gap-2 mb-3" onSubmit={onSubmit}>
        <input
          className="form-control"
          name="q"
          placeholder="Search articles..."
          defaultValue={q}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
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
        <div className="alert alert-info">No results found for “{q}”.</div>
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
            pageSizeOptions={[12, 24, 50, 100]} // customize if you like
            window={2} // numbered pages on each side (2 -> up to 5 visible)
            showFirstLast={true} // « First / Last »
            compact={false} // set true for smaller controls
          />
        </>
      )}
    </>
  );
}
