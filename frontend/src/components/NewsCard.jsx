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

export default function NewsCard({ article, index }) {
  const { title, description, urlToImage, source, publishedAt, url } = article;

  const id = url ? makeIdFromUrl(url) : `idx_${index}`;
  const detailPath = url ? `/article/${encodeURIComponent(url)}` : "#";

  function cacheForDetail() {
    if (!url) return;
    try {
      sessionStorage.setItem(
        `newsapp_article_${id}`,
        JSON.stringify(article),
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(
          "[NewsCard] Unable to cache article in sessionStorage:",
          err?.message || err,
        );
      }
    }
  }

  // Bento grid: randomly assign different sizes for variety
  const getBentoSize = () => {
    // Create a pseudo-random pattern based on index
    const patterns = [
      'bento-small',    // 1x1
      'bento-wide',     // 2x1
      'bento-tall',     // 1x2
      'bento-small',    // 1x1
      'bento-large',    // 2x2
      'bento-small',    // 1x1
      'bento-wide',     // 2x1
      'bento-small',    // 1x1
    ];
    return patterns[index % patterns.length];
  };

  return (
    <div className={`bento-item ${getBentoSize()}`}>
      <div className="bento-card">
        <img
          src={safeImg(urlToImage)}
          alt={title || "Article image"}
          className="bento-bg-image"
          onError={onImgError}
        />
        <div className="bento-overlay"></div>
        <div className="bento-content">
          <div className="bento-meta">
            <span className="bento-source">{source?.name || "Unknown source"}</span>
            <span className="bento-date">
              {publishedAt ? new Date(publishedAt).toLocaleDateString() : "—"}
            </span>
          </div>
          <h5 className="bento-title">{title || "Untitled article"}</h5>
          {description && <p className="bento-description">{cleanText(description)}</p>}
          <div className="bento-actions">
            {url && (
              <Link
                className="btn btn-accent btn-sm"
                to={detailPath}
                state={{ article, id }}
                onClick={cacheForDetail}
              >
                Read
              </Link>
            )}
            {url && (
              <a
                className="btn btn-outline-light btn-sm"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}