export default function Spinner({
  label = "Loading…",
  size = "md",
  fullscreen = false,
}) {
  const sizeClass =
    size === "sm"
      ? "spinner-border-sm"
      : size === "lg"
        ? "spinner-border-lg" // custom if you want bigger via CSS
        : "";
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center gap-2">
      <div
        className={`spinner-border ${sizeClass}`}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <span className="visually-hidden">{label}</span>
      </div>
      <div className="text-muted">{label}</div>
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75"
        style={{ zIndex: 1050 }}
      >
        {content}
      </div>
    );
  }
  return content;
}
