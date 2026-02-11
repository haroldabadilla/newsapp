import { useEffect, useMemo, useRef, useState } from "react";

/**
 * PaginationBar - Modern, UX-friendly pagination component
 *
 * Props:
 * - page: number (1-based current page)
 * - total: number (total items)
 * - pageSize: number (items per page)
 * - onChange: (nextPage: number) => void
 * - onPageSizeChange?: (size: number) => void
 * - pageSizeOptions?: number[]
 * - window?: number (numbered buttons around current, default: 2)
 * - showFirstLast?: boolean (default: true)
 * - compact?: boolean (default: false)
 * - loading?: boolean (shows loading state)
 * - showJumpTo?: boolean (shows jump to page input, default: true)
 * - showSummary?: boolean (shows results summary, default: true)
 */
export default function PaginationBar({
  page,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 50, 100],
  window: windowSize = 2,
  showFirstLast = true,
  compact = false,
  loading = false,
  showJumpTo = true,
  showSummary = true,
}) {
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize))),
    [total, pageSize],
  );

  const [inputPage, setInputPage] = useState(String(page));
  const inputRef = useRef(null);

  // Calculate result range
  const startResult = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endResult = Math.min(page * pageSize, total);

  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  function clamp(n) {
    if (!Number.isFinite(n)) return 1;
    return Math.min(Math.max(1, n), totalPages);
  }

  function goTo(n) {
    const next = clamp(n);
    if (next !== page && !loading) onChange(next);
  }

  function onInputKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const targetPage = parseInt(inputPage, 10);
      if (targetPage >= 1 && targetPage <= totalPages) {
        goTo(targetPage);
        inputRef.current?.blur();
      }
    }
    if (e.key === "Escape") {
      setInputPage(String(page));
      inputRef.current?.blur();
    }
  }

  function onInputBlur() {
    setInputPage(String(page));
  }

  function buildPageList() {
    const pages = [];
    const start = Math.max(1, page - windowSize);
    const end = Math.min(totalPages, page + windowSize);

    if (start > 1) {
      pages.push(1);
    }
    if (start > 2) {
      pages.push("left-ellipsis");
    }
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    if (end < totalPages - 1) {
      pages.push("right-ellipsis");
    }
    if (end < totalPages) {
      pages.push(totalPages);
    }
    return pages;
  }

  const pages = buildPageList();
  const btnSize = compact ? "btn-sm" : "";
  const selectSize = compact ? "form-select-sm" : "";
  const inputSizeClass = compact ? "form-control-sm" : "";

  const disablePrev = page <= 1 || loading;
  const disableNext = page >= totalPages || loading;

  if (total === 0) {
    return null; // Don't show pagination if no results
  }

  return (
    <div className="pagination-container">
      {/* Results Summary */}
      {showSummary && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="text-muted small">
            Showing <strong>{startResult}</strong> to{" "}
            <strong>{endResult}</strong> of <strong>{total}</strong>{" "}
            {total === 1 ? "result" : "results"}
          </div>

          {/* Page size selector */}
          {onPageSizeChange && (
            <div className="d-flex align-items-center gap-2">
              <label
                className="form-label m-0 small text-muted text-nowrap"
                htmlFor="page-size-select"
              >
                Show:
              </label>
              <select
                id="page-size-select"
                className={`form-select ${selectSize}`}
                style={{ width: "auto", minWidth: "70px" }}
                value={pageSize}
                onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
                disabled={loading}
                aria-label="Items per page"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main Pagination Controls */}
      <nav
        className="d-flex flex-wrap align-items-center justify-content-center gap-2"
        aria-label="Pagination navigation"
      >
        {/* First & Previous */}
        <div className="d-flex gap-1">
          {showFirstLast && (
            <button
              type="button"
              className={`btn btn-outline-primary ${btnSize}`}
              onClick={() => goTo(1)}
              disabled={disablePrev}
              aria-label="Go to first page"
              title="First page"
            >
              <span aria-hidden="true">«</span>
              <span className="d-none d-sm-inline ms-1">First</span>
            </button>
          )}

          <button
            type="button"
            className={`btn btn-outline-primary ${btnSize}`}
            onClick={() => goTo(page - 1)}
            disabled={disablePrev}
            aria-label="Go to previous page"
            title="Previous page"
          >
            <span aria-hidden="true">‹</span>
            <span className="d-none d-sm-inline ms-1">Prev</span>
          </button>
        </div>

        {/* Numbered pages */}
        <ul
          className="pagination m-0"
          role="navigation"
          aria-label="Page numbers"
        >
          {pages.map((p, idx) =>
            typeof p === "number" ? (
              <li key={p} className="page-item">
                <button
                  type="button"
                  className={`page-link ${p === page ? "active" : ""}`}
                  style={{
                    minWidth: compact ? "32px" : "40px",
                    transition: "all 0.2s ease",
                  }}
                  aria-current={p === page ? "page" : undefined}
                  aria-label={`${p === page ? "Current page, " : "Go to "}page ${p}`}
                  onClick={() => goTo(p)}
                  disabled={loading}
                >
                  {p}
                </button>
              </li>
            ) : (
              <li key={`${p}-${idx}`} className="page-item disabled">
                <span className="page-link" aria-hidden="true">
                  …
                </span>
              </li>
            ),
          )}
        </ul>

        {/* Next & Last */}
        <div className="d-flex gap-1">
          <button
            type="button"
            className={`btn btn-outline-primary ${btnSize}`}
            onClick={() => goTo(page + 1)}
            disabled={disableNext}
            aria-label="Go to next page"
            title="Next page"
          >
            <span className="d-none d-sm-inline me-1">Next</span>
            <span aria-hidden="true">›</span>
          </button>

          {showFirstLast && (
            <button
              type="button"
              className={`btn btn-outline-primary ${btnSize}`}
              onClick={() => goTo(totalPages)}
              disabled={disableNext}
              aria-label="Go to last page"
              title="Last page"
            >
              <span className="d-none d-sm-inline me-1">Last</span>
              <span aria-hidden="true">»</span>
            </button>
          )}
        </div>

        {/* Jump to page input */}
        {showJumpTo && totalPages > 5 && (
          <div className="d-flex align-items-center gap-2 ms-2">
            <span className="text-muted small d-none d-md-inline">Go to:</span>
            <input
              ref={inputRef}
              type="number"
              className={`form-control text-center ${inputSizeClass}`}
              style={{ width: compact ? "55px" : "65px" }}
              min="1"
              max={totalPages}
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              onKeyDown={onInputKeyDown}
              onBlur={onInputBlur}
              disabled={loading}
              aria-label="Jump to page number"
              title={`Enter page number (1-${totalPages})`}
            />
          </div>
        )}
      </nav>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center mt-2">
          <small className="text-muted">
            <span
              className="spinner-border spinner-border-sm me-1"
              role="status"
            />
            Loading...
          </small>
        </div>
      )}

      <style jsx>{`
        .pagination-container {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #dee2e6;
        }

        .page-link {
          cursor: pointer;
          user-select: none;
        }

        .page-link:hover:not(.active):not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .page-link.active {
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.25);
        }

        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* Responsive adjustments */
        @media (max-width: 576px) {
          .pagination-container {
            font-size: 0.875rem;
          }

          .page-link {
            padding: 0.375rem 0.5rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}
