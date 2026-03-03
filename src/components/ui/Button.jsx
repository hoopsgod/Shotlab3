export default function Button({ variant = "primary", className = "", type = "button", children, ...props }) {
  const variantClass =
    variant === "secondary"
      ? "sl-btn--secondary"
      : variant === "tertiary" || variant === "tertiaryLink"
        ? "sl-btn--tertiary-link"
        : "sl-btn--primary";
  return (
    <button type={type} className={`sl-btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
