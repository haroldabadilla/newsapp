// src/pages/Favorites.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Spinner from "../components/Spinner.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import placeholderImg from "../assets/placeholder-news.png";
import { listFavorites, removeFavorite } from "../services/favoritesApi.js";

const auth = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

function onImgError(e) {
  if (e.currentTarget.dataset.fallbackApplied) return;
  e.currentTarget.dataset.fallbackApplied = "1";
  e.currentTarget.src = placeholderImg;
}

export default function Favorites() {
  const navigate = useNavigate();

  // Guard + UI state
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  // Data & pagination
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

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
    return () => { ignore = true; };
  }, [navigate]);

  // 2) Loader to fetch favorites
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listFavorites({ page, pageSize });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr("Failed to load favorites. Please try again.");
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (!allowed) return;
    let ignore = false;
    (async () => {
      await load();
    })();
    return () => { ignore = true; };
  }, [allowed, load]);

  // 3) Remove action
  async function onRemove(id) {
    try {
      await removeFavorite(id);
      // Refresh current page; if page becomes empty after deletion, go back one page
      const remaining = items.length - 1;
      if (remaining === 0 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await load();
      }
    } catch (e) {
      setErr("Failed to remove favorite. Please try again.");
      console.error(e);
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

      {loading && (
        <div className="my-5">
          <Spinner label="Loading favorites…" size="lg" />
        </div>
      )}

      {err && <div className="alert alert-danger">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="alert alert-info">
          No favorites yet. Open an article and click <b>Add to Favorites</b>.
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
            {items.map((fav) => (
              <div key={fav.id || fav._id || fav.url} className="col">
                <div className="card h-100 shadow-sm">
                  <img
                    src={fav.urlToImage || placeholderImg}
                    alt={fav.title || "Article image"}
                    className="card-img-top"
                    onError={onImgError}
                  />
                  <div className="card-body d-flex flex-column">
                    <div className="small text-muted mb-1">
                      {fav.source || "Unknown source"} •{" "}
                      {fav.publishedAt ? new Date(fav.publishedAt).toLocaleString() : "—"}
                    </div>
                    <h5 className="card-title">{fav.title || "Untitled article"}</h5>
                    <div className="mt-auto d-flex gap-2">
                      {fav.url && (
                        <a className="btn btn-primary btn-sm" href={fav.url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      )}
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onRemove(fav.id || fav._id)}
                        title="Remove from favorites"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <PaginationBar
            page={page}
            total={total}
            pageSize={pageSize}
            onChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </>
      )}
    </>
  );
}