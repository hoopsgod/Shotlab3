import Card from "./Card";

export function HeroActionCard({ className = "", children, ...props }) {
  return (
    <Card variant="hero" className={`premium-card premium-card--hero ${className}`.trim()} {...props}>
      {children}
    </Card>
  );
}

export function MetricCard({ className = "", children, ...props }) {
  return (
    <Card variant="metric" className={`premium-card premium-card--metric ${className}`.trim()} {...props}>
      {children}
    </Card>
  );
}

export function ListItemCard({ className = "", children, ...props }) {
  return (
    <Card variant="list" className={`premium-card premium-card--list interactive-card ${className}`.trim()} {...props}>
      {children}
    </Card>
  );
}

export function MediaTutorialCard({ className = "", children, ...props }) {
  return (
    <Card variant="media" className={`premium-card premium-card--media ${className}`.trim()} {...props}>
      {children}
    </Card>
  );
}

export function ChartInsightCard({ className = "", children, ...props }) {
  return (
    <Card variant="chart" className={`premium-card premium-card--chart ${className}`.trim()} {...props}>
      {children}
    </Card>
  );
}

export function EmptyStateCard({ className = "", children, ...props }) {
  return (
    <Card variant="empty" className={`premium-card premium-card--empty ${className}`.trim()} {...props}>
      {children}
    </Card>
  );
}
