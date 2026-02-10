// src/components/NewsCard.jsx
import { Link } from "react-router-dom";
import placeholderImg from "../assets/placeholder-news.png";

function safeImg(src) {
  return src || placeholderImg;
}

function onImgError(e) {
  if (e.currentTarget.dataset.fallbackApplied) return;
  e.currentTarget.dataset.fallbackApplied = "1";
  e.currentTarget.src = placeholderImg;
}

function makeIdFromUrl(url) {
  // stable, URL-based id; keep simple & deterministic
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

export default function NewsCard({ article, index }) {
  const { title, description, urlToImage, source, publishedAt, url } = article;

  const id = url ? makeIdFromUrl(url) : `idx_${index}`;
  const detailPath = url ? `/article/${encodeURIComponent(url)}` : "#";

  function cacheForDetail() {
    // cache article payload for direct access on ArticleView
    if (url) {
      try {
        sessionStorage.setItem(
          `newsapp_article_${id}`,
          JSON.stringify(article),
        );
      } catch {}
    }
  }

  return (
    <div className="col">
      <div className="card h-100 shadow-sm">
        <img
          src={safeImg(urlToImage)}
          alt={title || "Article image"}
          className="card-img-top"
          onError={onImgError}
        />
        <div className="card-body d-flex flex-column">
          <div className="small text-muted mb-1">
            {source?.name || "Unknown source"} •{" "}
            {publishedAt ? new Date(publishedAt).toLocaleString() : "—"}
          </div>
          <h5 className="card-title">{title || "Untitled article"}</h5>
          {description && <p className="card-text">{description}</p>}

          <div className="mt-auto d-flex gap-2">
            {url && (
              <Link
                className="btn btn-primary btn-sm"
                to={detailPath}
                state={{ article, id }}
                onClick={cacheForDetail}
              >
                Read
              </Link>
            )}
            {url && (
              <a
                className="btn btn-outline-secondary btn-sm"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                Open Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
