import spacing from "../spacing";

const CARD_VARIANT_STYLES = {
  default: { className: "shared-card--default", padding: `${spacing.md}px`, gap: spacing.sm },
  elevated: { className: "shared-card--elevated", padding: `${spacing.md}px`, gap: spacing.sm },
  interactive: { className: "shared-card--interactive", padding: `${spacing.md}px`, gap: spacing.sm },
  compact: { className: "shared-card--compact", padding: `${spacing.sm}px`, gap: spacing.xs },
};

const LEGACY_VARIANT_MAP = {
  primary: "elevated",
  secondary: "default",
  subtle: "compact",
  metric: "default",
  list: "compact",
  empty: "compact",
};

function Card({ as: Component = "div", variant = "default", className = "", style, accent, children, ...props }) {
  const normalizedVariant = CARD_VARIANT_STYLES[variant] ? variant : LEGACY_VARIANT_MAP[variant] || "default";
  const variantStyle = CARD_VARIANT_STYLES[normalizedVariant];

  return (
    <Component
      {...props}
      className={`shared-card ${variantStyle.className} ${className}`.trim()}
      data-card-accent={accent || undefined}
      style={{
        padding: variantStyle.padding,
        gap: variantStyle.gap,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

export default Card;
