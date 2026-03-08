import Card from "../Card";

function BaseCard({
  as = "div",
  className = "",
  style,
  children,
  variant = "secondary",
  padding = 16,
  gap = 12,
  radius = 16,
  header,
  footer,
  ...props
}) {
  return (
    <Card
      as={as}
      variant={variant}
      className={`mobile-card ${className}`.trim()}
      style={{ padding, gap, borderRadius: radius, ...style }}
      {...props}
    >
      {header ? <div className="mobile-card__header">{header}</div> : null}
      {children}
      {footer ? <div className="mobile-card__footer">{footer}</div> : null}
    </Card>
  );
}

function HeroCard({ className = "", padding = 20, radius = 20, variant = "primary", ...props }) {
  return <BaseCard className={`mobile-card--hero ${className}`.trim()} padding={padding} radius={radius} variant={variant} {...props} />;
}

function MetricCard({ title, value, delta, helper, className = "", children, ...props }) {
  return (
    <BaseCard className={`mobile-card--metric ${className}`.trim()} {...props}>
      {title ? <div className="mobile-card__kicker">{title}</div> : null}
      {value !== undefined ? <div className="mobile-card__metric-value">{value}</div> : null}
      {delta ? <div className="mobile-card__metric-delta">{delta}</div> : null}
      {helper ? <div className="mobile-card__helper">{helper}</div> : null}
      {children}
    </BaseCard>
  );
}

function ListItemCard({ leading, title, subtitle, trailing, className = "", children, ...props }) {
  return (
    <BaseCard className={`mobile-card--listItem ${className}`.trim()} {...props}>
      <div className="mobile-card__list-row">
        {leading ? <div className="mobile-card__list-leading">{leading}</div> : null}
        <div className="mobile-card__list-main">
          {title ? <div className="mobile-card__list-title">{title}</div> : null}
          {subtitle ? <div className="mobile-card__list-subtitle">{subtitle}</div> : null}
          {children}
        </div>
        {trailing ? <div className="mobile-card__list-trailing">{trailing}</div> : null}
      </div>
    </BaseCard>
  );
}

function MediaCard({ media, title, subtitle, actions, className = "", children, ...props }) {
  return (
    <BaseCard
      className={`mobile-card--media ${className}`.trim()}
      header={title || subtitle || actions ? (
        <div className="mobile-card__header-row">
          <div>
            {title ? <div className="mobile-card__list-title">{title}</div> : null}
            {subtitle ? <div className="mobile-card__list-subtitle">{subtitle}</div> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      {...props}
    >
      {media ? <div className="mobile-card__media-frame">{media}</div> : null}
      {children}
    </BaseCard>
  );
}

function InsightCard({ title, subtitle, action, className = "", children, ...props }) {
  return (
    <BaseCard
      className={`mobile-card--insight ${className}`.trim()}
      header={title || subtitle || action ? (
        <div className="mobile-card__header-row">
          <div>
            {title ? <div className="mobile-card__list-title">{title}</div> : null}
            {subtitle ? <div className="mobile-card__list-subtitle">{subtitle}</div> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {...props}
    >
      {children}
    </BaseCard>
  );
}

function EmptyStateCard({ icon, title, description, actions, className = "", children, ...props }) {
  return (
    <BaseCard className={`mobile-card--emptyState ${className}`.trim()} {...props}>
      {icon ? <div className="mobile-card__empty-icon">{icon}</div> : null}
      {title ? <p className="mobile-card__empty-title">{title}</p> : null}
      {description ? <p className="mobile-card__empty-description">{description}</p> : null}
      {children}
      {actions ? <div className="mobile-card__empty-actions">{actions}</div> : null}
    </BaseCard>
  );
}

export { BaseCard, HeroCard, MetricCard, ListItemCard, MediaCard, InsightCard, EmptyStateCard };
