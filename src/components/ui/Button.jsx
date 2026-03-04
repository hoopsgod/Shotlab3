export default function Button({ variant = "primary", className = "", type = "button", children, ...props }) {
  const variantClass = variant === "secondary" ? "btn-secondary" : variant === "tertiary" ? "btn-link" : "btn-primary";
  return (
    <button type={type} className={`btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
