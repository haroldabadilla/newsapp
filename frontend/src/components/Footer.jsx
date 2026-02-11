// src/components/Footer.jsx
export default function Footer() {
  const year = new Date().getFullYear();
  const poweredBy = import.meta.env.VITE_POWERED_BY || "News API";

  return (
    <footer className="footer mt-auto py-4" aria-label="Site footer">
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        {/* Left: brand */}
        <div className="d-flex flex-column">
          <span className="fw-semibold">© {year} NewsApp</span>
          <small className="muted">All rights reserved.</small>
        </div>

        {/* Right: powered by */}
        <small className="muted">Powered by {poweredBy}</small>
      </div>
    </footer>
  );
}