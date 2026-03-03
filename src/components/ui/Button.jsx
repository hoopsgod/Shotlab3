export default function Button({ variant = "primary", className = "", type = "button", children, ...props }) {
  const variantClass =
    variant === "secondary"
      ? "sl-btn--secondary"
      : variant === "tertiaryLink"
        ? "sl-btn--tertiary-link"
        : variant === "tertiary"
          ? "sl-btn--tertiary"
          : "sl-btn--primary";

  return (
    <button type={type} className={`sl-btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
