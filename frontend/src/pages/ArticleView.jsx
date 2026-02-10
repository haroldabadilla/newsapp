// src/pages/ArticleView.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import placeholderImg from "../assets/placeholder-news.png";
import Spinner from "../components/Spinner.jsx";
import { addFavorite } from "../services/favoritesApi.js";

const auth = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

function onImgError(e) {
  if (e.currentTarget.dataset.fallbackApplied) return;
  e.currentTarget.dataset.fallbackApplied = "1";
  e.currentTarget.src = placeholderImg;
}

function makeIdFromUrl(url) {
  try {
    return "art_" + btoa(unescape(encodeURIComponent(url))).replace(/=+$/,"").slice(-16);
  } catch {
    return "art_" + encodeURIComponent(url).slice(-16);
  }
}

export default function ArticleView() {
  const { id: encodedUrl } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateArticle = location?.state?.article;
  const articleUrl = useMemo(() => {
    try { return decodeURIComponent(encodedUrl || ""); } catch { return ""; }
  }, [encodedUrl]);

  const storageKey = useMemo(() => {
    return articleUrl ? `newsapp_article_${makeIdFromUrl(articleUrl)}` : null;
  }, [articleUrl]);

  const [article, setArticle] = useState(stateArticle || null);
  const [loading, setLoading] = useState(!stateArticle);
  const [notFound, setNotFound] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [saveErr, setSaveErr] = useState(null);

  useEffect(() => {
    if (article) { setLoading(false); return; }
    if (!storageKey) { setLoading(false); setNotFound(true); return; }
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        setArticle(JSON.parse(raw));
      } else if (articleUrl) {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [article, storageKey, articleUrl]);

  async function ensureLoggedInOrRedirect() {
    try {
      await auth.get("/me");
      return true;
    } catch {
      const next = `/article/${encodeURIComponent(articleUrl)}`;
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
      return false;
    }
  }

  async function onAddFavorite() {
    setSaveErr(null);
    const ok = await ensureLoggedInOrRedirect();
    if (!ok) return;

    try {
      setSaving(true);
      const payload = {
        url: article?.url || articleUrl,
        title: article?.title || document.title || "Article",
        source: article?.source?.name || article?.source || "Unknown",
        urlToImage: article?.urlToImage,
        publishedAt: article?.publishedAt,
      };
      if (!payload.url) {
        setSaveErr("This article has no resolvable URL. Cannot save.");
        setSaving(false);
        return;
      }
      const res = await addFavorite(payload);
      setSavedId(res.id);
    } catch (e) {
      const msg = e?.response?.data?.error?.message || "Failed to add favorite";
      setSaveErr(msg);
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Spinner label="Loading article…" size="lg" />;
  }

  const title = article?.title || "Article";
  const sourceName = article?.source?.name || article?.source || "Unknown source";
  const publishedAt = article?.publishedAt ? new Date(article.publishedAt).toLocaleString() : "—";
  const img = article?.urlToImage || placeholderImg;
  const description = article?.description;
  const content = article?.content;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-10">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="mb-0">{title}</h2>
          <Link to="/" className="btn btn-link">&larr; Back</Link>
        </div>

        <div className="text-muted mb-3">{sourceName} • {publishedAt}</div>

        <div className="card shadow-sm mb-3">
          <img
            src={img}
            alt={title}
            className="card-img-top"
            onError={onImgError}
            style={{ objectFit: "cover", maxHeight: 420 }}
          />
          <div className="card-body">
            {description && <p className="lead">{description}</p>}
            {content && <p>{content}</p>}
            {!description && !content && (
              <p className="text-muted">
                Full content may be available at the original source.
              </p>
            )}

            <div className="d-flex flex-wrap gap-2 mt-3">
              {articleUrl && (
                <a className="btn btn-primary" href={articleUrl} target="_blank" rel="noreferrer">
                  Open Original Article
                </a>
              )}
              <button
                className={`btn ${savedId ? "btn-success" : "btn-outline-secondary"}`}
                onClick={onAddFavorite}
                disabled={saving || !!savedId}
                title={savedId ? "Already added" : "Add to favorites"}
              >
                {savedId ? "Added ✓" : saving ? "Saving…" : "Add to Favorites"}
              </button>
            </div>

            {saveErr && <div className="text-danger mt-2">{saveErr}</div>}
          </div>
        </div>

        {notFound && articleUrl && (
          <div className="alert alert-info">
            We couldn’t load in‑app details for this article, but you can open it directly:&nbsp;
            <a href={articleUrl} target="_blank" rel="noreferrer">{articleUrl}</a>
          </div>
        )}
      </div>
    </div>
  );
}