export default function Button({
  variant = "primary",
  size = "lg",
  className = "",
  type = "button",
  children,
  ...props
}) {
  const variantClass = variant === "secondary" ? "btn--secondary" : variant === "tertiary" ? "btn--tertiary" : "btn--primary";
  const sizeClass = size === "sm" ? "btn--sm" : size === "md" ? "btn--md" : "btn--lg";

  return (
    <button type={type} className={`btn ${variantClass} ${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
