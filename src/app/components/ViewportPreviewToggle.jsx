const PREVIEW_OPTIONS = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
  { value: "mobile-small", label: "Mobile S" },
  { value: "mobile-large", label: "Mobile L" },
];

export default function ViewportPreviewToggle({ mode = "desktop", onChange }) {
  return (
    <div className="viewport-preview-toggle" role="group" aria-label="Viewport preview mode">
      <span className="viewport-preview-toggle__label">Preview</span>
      {PREVIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`viewport-preview-toggle__button ${mode === option.value ? "is-active" : ""}`}
          onClick={() => onChange?.(option.value)}
          aria-pressed={mode === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
