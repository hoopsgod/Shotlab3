import spacing from "../spacing";

const CARD_VARIANT_STYLES = {
  default: { padding: `${spacing.md}px`, gap: 0 },
  metric: { padding: `${spacing.sm}px ${spacing.md}px`, gap: spacing.xs },
  list: { padding: `${spacing.sm}px ${spacing.md}px`, gap: spacing.sm },
  empty: { padding: `${spacing.lg}px ${spacing.md}px`, gap: spacing.sm },
};

function Card({ as: Component = "div", variant = "default", className = "", style, children, ...props }) {
  const resolvedVariant = CARD_VARIANT_STYLES[variant] ? variant : "default";
  const variantStyle = CARD_VARIANT_STYLES[resolvedVariant];

  return (
    <Component
      {...props}
      className={`shared-card shared-card--${resolvedVariant} ${className}`.trim()}
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
