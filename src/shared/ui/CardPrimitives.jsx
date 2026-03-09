import UI_TOKENS from "../../styles/tokens";

const CARD_TOKENS = {
  radius: 16,
  padding: {
    compact: 12,
    comfortable: 16,
    hero: 20,
  },
  gap: 12,
  backgroundColor: UI_TOKENS.colors.bg.surface,
  borderColor: UI_TOKENS.colors.border.subtle,
};

function resolvePadding(mode = "comfortable") {
  return CARD_TOKENS.padding[mode] || CARD_TOKENS.padding.comfortable;
}

export function BaseCard({
  as: Component = "div",
  className = "",
  style,
  header,
  footer,
  paddingMode = "comfortable",
  children,
  ...props
}) {
  const padding = resolvePadding(paddingMode);

  return (
    <Component
      {...props}
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `${CARD_TOKENS.gap}px`,
        backgroundColor: CARD_TOKENS.backgroundColor,
        border: `1px solid ${CARD_TOKENS.borderColor}`,
        borderRadius: `${CARD_TOKENS.radius}px`,
        padding: `${padding}px`,
        ...style,
      }}
    >
      {header}
      {children}
      {footer}
    </Component>
  );
}

export function HeroCard(props) {
  return <BaseCard {...props} paddingMode={props.paddingMode || "hero"} />;
}

export function MetricCard(props) {
  return <BaseCard {...props} />;
}

export function ListItemCard(props) {
  return <BaseCard {...props} paddingMode={props.paddingMode || "compact"} />;
}

export function MediaCard(props) {
  return <BaseCard {...props} />;
}

export function InsightCard(props) {
  return <BaseCard {...props} />;
}

export function EmptyStateCard(props) {
  return <BaseCard {...props} />;
}
