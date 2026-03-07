const VARIANT_CLASS_MAP = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  ghost: "btn--ghost",
  tertiary: "btn--ghost",
  icon: "btn--icon",
};

export default function Button({ variant = "primary", className = "", type = "button", children, ...props }) {
  const variantClass = VARIANT_CLASS_MAP[variant] || VARIANT_CLASS_MAP.primary;
  return (
    <button type={type} className={`btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
