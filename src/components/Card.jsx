import spacing from "../spacing";

const CARD_VARIANT_STYLES = {
  hero: { className: "shared-card--hero", padding: spacing.lg, gap: spacing.md },
  primary: { className: "shared-card--primary", padding: spacing.lg, gap: spacing.md },
  secondary: { className: "shared-card--secondary", padding: spacing.lg, gap: spacing.smd },
  metric: { className: "shared-card--metric", padding: spacing.lg, gap: spacing.smd },
  list: { className: "shared-card--list", padding: spacing.md, gap: spacing.smd },
  media: { className: "shared-card--media", padding: spacing.md, gap: spacing.smd },
  chart: { className: "shared-card--chart", padding: spacing.md, gap: spacing.smd },
  empty: { className: "shared-card--empty", padding: spacing.lg, gap: spacing.md },
  subtle: { className: "shared-card--subtle", padding: spacing.md, gap: spacing.smd },
};

const LEGACY_VARIANT_MAP = {
  default: "secondary",
  metric: "metric",
  list: "list",
  empty: "empty",
};

function Card({ as: Component = "div", variant = "secondary", className = "", style, children, ...props }) {
  const normalizedVariant = CARD_VARIANT_STYLES[variant] ? variant : LEGACY_VARIANT_MAP[variant] || "secondary";
  const variantStyle = CARD_VARIANT_STYLES[normalizedVariant];

  return (
    <Component
      {...props}
      className={`shared-card ${variantStyle.className} ${className}`.trim()}
      style={{
        padding: `${variantStyle.padding}px`,
        gap: `${variantStyle.gap}px`,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

export default Card;
