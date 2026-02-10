import { useEffect, useMemo, useRef, useState } from "react";

/**
 * PaginationBar (UX-friendly)
 *
 * Props:
 * - page: number (1-based current page)
 * - total: number (total items)
 * - pageSize: number (items per page)
 * - onChange: (nextPage: number) => void
 * - onPageSizeChange?: (size: number) => void   // show page-size dropdown when provided
 * - pageSizeOptions?: number[]                   // default: [12, 24, 50, 100]
 * - window?: number                              // how many numbered buttons around current (default 2 -> shows up to 5 numbers)
 * - showFirstLast?: boolean                      // default: true
 * - compact?: boolean                            // default: false (smaller controls)
 *
 * Accessibility:
 * - Buttons have aria-labels and proper disabled states.
 * - The "current page" is indicated with aria-current="page".
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
}) {
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize))),
    [total, pageSize],
  );

  const [inputPage, setInputPage] = useState(String(page));
  const inputRef = useRef(null);

  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  function clamp(n) {
    if (!Number.isFinite(n)) return 1;
    return Math.min(Math.max(1, n), totalPages);
  }

  function goTo(n) {
    const next = clamp(n);
    if (next !== page) onChange(next);
  }

  function onInputKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      goTo(parseInt(inputPage, 10));
      inputRef.current?.blur();
    }
  }

  function buildPageList() {
    // Always show first & last; show window around current; collapse with ellipsis as needed
    const pages = [];
    const start = Math.max(1, page - windowSize);
    const end = Math.min(totalPages, page + windowSize);

    // First page
    if (start > 1) {
      pages.push(1);
    }
    // Left ellipsis
    if (start > 2) {
      pages.push("left-ellipsis");
    }
    // Middle range
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    // Right ellipsis
    if (end < totalPages - 1) {
      pages.push("right-ellipsis");
    }
    // Last page
    if (end < totalPages) {
      pages.push(totalPages);
    }
    return pages;
  }

  const pages = buildPageList();
  const btnSize = compact ? "btn-sm" : "";
  const selectSize = compact ? "form-select-sm" : "";
  const inputSize = compact ? "form-control-sm" : "";
  const inputWidth = compact ? 200 : 240;

  const disablePrev = page <= 1;
  const disableNext = page >= totalPages;

  return (
    <nav
      className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3"
      aria-label="Pagination"
    >
      {/* Left: Page size selector (optional) */}
      <div className="d-flex align-items-center gap-2">
        {onPageSizeChange && (
          <>
            <label
              className="form-label m-0 small text-muted"
              htmlFor="page-size-select"
            >
              Items per page
            </label>
            <select
              id="page-size-select"
              className={`form-select ${selectSize}`}
              style={{ width: 100 }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              aria-label="Items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Right: controls */}
      <div className="d-flex align-items-center gap-2 ms-auto">
        {showFirstLast && (
          <button
            type="button"
            className={`btn btn-outline-secondary ${btnSize}`}
            onClick={() => goTo(1)}
            disabled={disablePrev}
            aria-label="First page"
          >
            « First
          </button>
        )}

        <button
          type="button"
          className={`btn btn-outline-secondary ${btnSize}`}
          onClick={() => goTo(page - 1)}
          disabled={disablePrev}
          aria-label="Previous page"
        >
          ‹ Prev
        </button>

        {/* Numbered pages */}
        <ul className="pagination m-0">
          {pages.map((p, idx) =>
            typeof p === "number" ? (
              <li key={p} className="page-item">
                <button
                  type="button"
                  className={`page-link ${compact ? "py-1" : ""} ${p === page ? "active" : ""}`}
                  aria-current={p === page ? "page" : undefined}
                  onClick={() => goTo(p)}
                >
                  {p}
                </button>
              </li>
            ) : (
              <li key={`${p}-${idx}`} className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            ),
          )}
        </ul>

        <button
          type="button"
          className={`btn btn-outline-secondary ${btnSize}`}
          onClick={() => goTo(page + 1)}
          disabled={disableNext}
          aria-label="Next page"
        >
          Next ›
        </button>

        {showFirstLast && (
          <button
            type="button"
            className={`btn btn-outline-secondary ${btnSize}`}
            onClick={() => goTo(totalPages)}
            disabled={disableNext}
            aria-label="Last page"
          >
            Last »
          </button>
        )}
      </div>
    </nav>
  );
}
