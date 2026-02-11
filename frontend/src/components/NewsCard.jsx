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

  return (
    <div className="col">
      <div className="card-surface h-100">
        <div className="ratio ratio-16x9">
          <img
            src={safeImg(urlToImage)}
            alt={title || "Article image"}
            className="w-100"
            onError={onImgError}
            style={{ objectFit: "cover", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
          />
        </div>

        {/* ⬇️ Added padding here */}
        <div className="card-body d-flex flex-column p-3 p-sm-4">
          <div className="small text-muted mb-2">
            {source?.name || "Unknown source"} •{" "}
            {publishedAt ? new Date(publishedAt).toLocaleString() : "—"}
          </div>

          <h5 className="card-title">{title || "Untitled article"}</h5>
          {description && <p className="card-text text-muted mb-0">{description}</p>}

          {/* ⬇️ a bit of spacing before the buttons */}
          <div className="mt-auto pt-3">
            <div className="d-flex justify-content-center flex-wrap gap-2">
              {url && (
                <Link
                  className="btn btn-accent px-3 py-2"
                  to={detailPath}
                  state={{ article, id }}
                  onClick={cacheForDetail}
                >
                  Read
                </Link>
              )}
              {url && (
                <a
                  className="btn btn-outline-light px-3 py-2"
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
    </div>
  );
}