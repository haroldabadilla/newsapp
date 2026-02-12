// src/components/SaveButton.jsx

/**
 * Reusable Save button with Bootstrap Icons (bookmark).
 *
 * Props:
 *  - saved: boolean
 *  - onToggle: () => void
 *  - size?: 'sm' | 'md' (default: 'sm')
 *  - variant?: 'outline-light' | 'outline-primary' (default: 'outline-light')
 */
export default function SaveButton({
  saved,
  onToggle,
  size = "sm",
  variant = "outline-light",
}) {
  const icon = saved ? "bi-bookmark-fill" : "bi-bookmark";
  const label = saved ? "Saved" : "Save";

  return (
    <button
      type="button"
      className={`btn btn-${size} btn-${variant}`}
      onClick={onToggle}
      aria-pressed={!!saved}
      aria-label={label}
    >
      <i className={`bi ${icon} me-1`} aria-hidden="true"></i>
      <span className="d-none d-sm-inline">{label}</span>
    </button>
  );
}