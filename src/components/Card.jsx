import spacing from "../spacing";

const VARIANT_STYLES = {
  default: {
    padding: `${spacing.md}px`,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(12, 17, 22, 0.94)",
    display: "flex",
    flexDirection: "column",
    gap: `${spacing.md}px`,
  },
  metric: {
    padding: `${spacing.lg}px ${spacing.md}px`,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15, 22, 32, 0.92)",
    display: "flex",
    flexDirection: "column",
    gap: `${spacing.sm}px`,
  },
  list: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(10, 15, 20, 0.9)",
    display: "flex",
    flexDirection: "column",
    gap: `${spacing.sm}px`,
  },
  empty: {
    padding: `${spacing.lg}px ${spacing.md}px`,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(12, 17, 22, 0.72)",
    display: "flex",
    flexDirection: "column",
    gap: `${spacing.md}px`,
  },
};

function Card({ as: Component = "div", variant = "default", style, children, ...props }) {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  return (
    <Component
      {...props}
      style={{
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

export default Card;
