const VARIANT_CLASS_MAP = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  tertiary: "btn--tertiary",
  ghost: "btn--tertiary",
  destructive: "btn--destructive",
  icon: "btn--icon",
};

const SIZE_CLASS_MAP = {
  md: "btn--md",
  lg: "btn--lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  iconOnly = false,
  className = "",
  type = "button",
  children,
  ...props
}) {
  const variantClass = VARIANT_CLASS_MAP[variant] || VARIANT_CLASS_MAP.primary;
  const sizeClass = SIZE_CLASS_MAP[size] || SIZE_CLASS_MAP.md;

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
