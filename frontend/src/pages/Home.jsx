import { useEffect, useState } from "react";
import { fetchTopHeadlines } from "../services/newsApi.js";
import NewsCard from "../components/NewsCard.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Home() {
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Data
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  // UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await fetchTopHeadlines({ country: "us", page, pageSize });
        if (!ignore) {
          setArticles(data.articles || []);
          setTotalResults(data.totalResults || 0);
        }
      } catch (e) {
        if (!ignore) setErr("Failed to load headlines. Please try again.");
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [page, pageSize]);
  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Top Headlines</h2>
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
