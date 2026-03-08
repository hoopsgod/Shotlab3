const VARIANT_CLASS_MAP = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  ghostIcon: "btn--ghostIcon",
  ghost: "btn--ghost",
  tertiary: "btn--ghost",
  destructive: "btn--destructive",
  icon: "btn--icon",
};

const SIZE_CLASS_MAP = {
  medium: "btn--md",
  large: "btn--lg",
};

export default function Button({
  variant = "primary",
  size = "medium",
  iconOnly = false,
  className = "",
  type = "button",
  children,
  ...props
}) {
  const variantClass = VARIANT_CLASS_MAP[variant] || VARIANT_CLASS_MAP.primary;
  const sizeClass = SIZE_CLASS_MAP[size] || SIZE_CLASS_MAP.medium;
  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${iconOnly ? "btn--iconOnly" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
