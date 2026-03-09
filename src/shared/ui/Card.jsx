import spacing from "../../spacing";

const CARD_VARIANT_STYLES = {
  primary: { className: "shared-card--primary", padding: spacing.mdlg, gap: spacing.md },
  secondary: { className: "shared-card--secondary", padding: spacing.md, gap: spacing.smd },
  subtle: { className: "shared-card--subtle", padding: spacing.md, gap: spacing.smd },
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
