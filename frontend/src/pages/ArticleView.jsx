import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import placeholderImg from "../assets/placeholder-news.png";
import Spinner from "../components/Spinner.jsx";
import {
  addFavorite,
  removeFavorite,
  listFavorites,
} from "../services/favoritesApi.js";

const auth = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

function onImgError(e) {
  if (e.currentTarget.dataset.fallbackApplied) return;
  e.currentTarget.dataset.fallbackApplied = "1";
  e.currentTarget.src = placeholderImg;
}

function cleanText(text) {
  if (!text) return text;
  // Remove [+1234 chars] or similar patterns
  return text.replace(/\s*\[\+\d+\s*chars?\]\s*$/i, '').trim();
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

export default function ArticleView() {
  const { id: encodedUrl } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateArticle = location?.state?.article;
  const articleUrl = useMemo(() => {
    try {
      return decodeURIComponent(encodedUrl || "");
    } catch {
      return "";
    }
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
  const [checkingFavorite, setCheckingFavorite] = useState(true);

  // Check if article is already in favorites on mount
  useEffect(() => {
    let ignore = false;

    async function checkIfFavorited() {
      if (!articleUrl) {
        setCheckingFavorite(false);
        return;
      }

      try {
        // Check if user is logged in first
        await auth.get("/me");

        // Fetch all favorites and check if this article exists
        const data = await listFavorites({ page: 1, pageSize: 100 });
        const existing = data.items?.find((item) => item.url === articleUrl);

        if (!ignore && existing) {
          setSavedId(existing.id || existing._id);
        }
      } catch (e) {
        // User not logged in or error - that's okay, just not favorited
        if (!ignore) {
          setSavedId(null);
        }
      } finally {
        if (!ignore) {
          setCheckingFavorite(false);
        }
      }
    }

    checkIfFavorited();

    return () => {
      ignore = true;
    };
  }, [articleUrl]);

  useEffect(() => {
    if (article) {
      setLoading(false);
      return;
    }
    if (!storageKey) {
      setLoading(false);
      setNotFound(true);
      return;
    }
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
        description: article?.description,
        content: article?.content,
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
      // Handle 409 - article already favorited
      if (e?.response?.status === 409) {
        const existingId = e?.response?.data?.error?.id;
        if (existingId) {
          setSavedId(existingId);
        }
        // Don't show error for already favorited items
        return;
      }

      const msg = e?.response?.data?.error?.message || "Failed to add favorite";
      setSaveErr(msg);
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function onRemoveFavorite() {
    setSaveErr(null);

    if (!savedId) {
      setSaveErr("Cannot remove - article is not favorited");
      return;
    }

    try {
      setSaving(true);
      await removeFavorite(savedId);
      setSavedId(null);
    } catch (e) {
      const msg =
        e?.response?.data?.error?.message || "Failed to remove favorite";
      setSaveErr(msg);
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function onToggleFavorite() {
    if (savedId) {
      await onRemoveFavorite();
    } else {
      await onAddFavorite();
    }
  }

  if (loading) {
    return <Spinner label="Loading article…" size="lg" />;
  }

  const title = article?.title || "Article";
  const sourceName =
    article?.source?.name || article?.source || "Unknown source";
  const publishedAt = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleString()
    : "—";
  const img = article?.urlToImage || placeholderImg;
  const description = cleanText(article?.description);
  const content = cleanText(article?.content);

  return (
    <div className="article-view">
      {/* Hero Image Section */}
      <div className="article-hero mb-4">
        <img
          src={img}
          alt={title}
          className="article-hero-image"
          onError={onImgError}
        />
        <div className="article-hero-overlay"></div>
        <div className="article-hero-content">
          <Link to="/" className="btn btn-sm btn-outline-light mb-3">
            &larr; Back to Home
          </Link>
          <h1 className="article-hero-title">{title}</h1>
          <div className="article-hero-meta">
            <span className="text-accent">{sourceName}</span>
            <span className="mx-2">•</span>
            <span>{publishedAt}</span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-7">
          <div className="card card-surface mb-4">
            <div className="card-body p-4 p-md-5">
              {description && (
                <p className="article-lead">{description}</p>
              )}
              {content && (
                <div className="article-content">
                  <p>{content}</p>
                </div>
              )}
              {!description && !content && (
                <p className="text-muted text-center py-4">
                  Full content is available at the original source.
                </p>
              )}

              <hr className="my-4" />

              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {articleUrl && (
                  <a
                    className="btn btn-accent px-4"
                    href={articleUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read Full Article
                  </a>
                )}
                <button
                  className={`btn px-4 ${
                    savedId ? "btn-danger" : "btn-outline-light"
                  }`}
                  onClick={onToggleFavorite}
                  disabled={saving || checkingFavorite}
                  title={savedId ? "Remove from favorites" : "Add to favorites"}
                >
                  {checkingFavorite
                    ? "Checking..."
                    : savedId
                      ? saving
                        ? "Removing…"
                        : "❤️ Saved"
                      : saving
                        ? "Saving…"
                        : "🤍 Save"}
                </button>
              </div>

              {saveErr && (
                <div className="alert alert-danger mt-3 mb-0">{saveErr}</div>
              )}
              {savedId && !saving && !saveErr && (
                <div className="text-success mt-3 text-center small">
                  ✓ This article is in your favorites
                </div>
              )}
            </div>
          </div>

          {notFound && articleUrl && (
            <div className="alert alert-info mt-3">
              We couldn't load in‑app details for this article, but you can open
              it directly:&nbsp;
              <a href={articleUrl} target="_blank" rel="noreferrer">
                {articleUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
