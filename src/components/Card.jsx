import spacing from "../spacing";

const CARD_VARIANT_STYLES = {
  primary: { className: "shared-card--primary", padding: `${spacing.standardCard}px`, gap: spacing.controlGapDefault },
  secondary: { className: "shared-card--secondary", padding: `${spacing.compactCard}px`, gap: spacing.controlGapTight },
  subtle: { className: "shared-card--subtle", padding: `${spacing.compactCard}px`, gap: spacing.controlGapTight },
};

const LEGACY_VARIANT_MAP = {
  default: "secondary",
  metric: "secondary",
  list: "subtle",
  empty: "subtle",
};

function Card({ as: Component = "div", variant = "secondary", className = "", style, children, ...props }) {
  const normalizedVariant = CARD_VARIANT_STYLES[variant] ? variant : LEGACY_VARIANT_MAP[variant] || "secondary";
  const variantStyle = CARD_VARIANT_STYLES[normalizedVariant];

  return (
    <Component
      {...props}
      className={`shared-card ${variantStyle.className} ${className}`.trim()}
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
