// src/pages/ArticleView.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import placeholderImg from "../assets/placeholder-news.png";

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

export default function ArticleView() {
  const { id: encodedUrl } = useParams(); // encoded article URL
  const location = useLocation();

  // 1) Prefer article from router state (when navigating from NewsCard)
  const stateArticle = location?.state?.article;
  const stateId = location?.state?.id;

  // 2) Compute ID & URL for lookups
  const articleUrl = useMemo(() => {
    try {
      return decodeURIComponent(encodedUrl || "");
    } catch {
      return "";
    }
  }, [encodedUrl]);

  const storageKey = useMemo(() => {
    return articleUrl
      ? `newsapp_article_${makeIdFromUrl(articleUrl)}`
      : stateId
        ? `newsapp_article_${stateId}`
        : null;
  }, [articleUrl, stateId]);

  const [article, setArticle] = useState(stateArticle || null);
  const [notFound, setNotFound] = useState(false);

  // 3) If no state, try sessionStorage cache set by NewsCard
  useEffect(() => {
    if (article) return;
    if (!storageKey) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        setArticle(JSON.parse(raw));
      } else if (articleUrl) {
        // No cached article; we still can render a minimal view with the URL
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
  }, [article, storageKey, articleUrl]);

  const title = article?.title || "Article";
  const sourceName = article?.source?.name || "Unknown source";
  const publishedAt = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleString()
    : "—";
  const img = article?.urlToImage || placeholderImg;
  const description = article?.description;
  const content = article?.content; // Often truncated by News API

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-10">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="mb-0">{title}</h2>
          <Link to="/" className="btn btn-link">
            &larr; Back
          </Link>
        </div>

        <div className="text-muted mb-3">
          {sourceName} • {publishedAt}
        </div>

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

            {/* Fallback note when we don't have full article data */}
            {!description && !content && (
              <p className="text-muted">
                Full content isn’t available here. You can read the complete
                article at the source below.
              </p>
            )}

            <div className="d-flex flex-wrap gap-2 mt-3">
              {articleUrl && (
                <a
                  className="btn btn-primary"
                  href={articleUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Original Article
                </a>
              )}
              <button
                className="btn btn-outline-secondary"
                disabled
                title="Coming soon"
              >
                Add to Favorites
              </button>
            </div>
          </div>
        </div>

        {/* If we navigated directly and nothing was cached, show a minimal card */}
        {notFound && articleUrl && (
          <div className="alert alert-info">
            We couldn’t load details for this article in the app, but you can
            open it directly:&nbsp;
            <a href={articleUrl} target="_blank" rel="noreferrer">
              {articleUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
