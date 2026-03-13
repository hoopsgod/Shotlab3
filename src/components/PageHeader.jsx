import AppHeader from "./AppHeader";

const ACCENT_MAP = {
  lime: "var(--team-brand-header-accent, var(--text-2))",
  cyan: "var(--team-brand-header-accent, var(--text-2))",
  amber: "var(--team-brand-header-accent, var(--text-2))",
  blue: "var(--team-brand-header-accent, var(--text-2))",
  purple: "var(--team-brand-header-accent, var(--text-2))",
};

export default function PageHeader({
  title,
  subtitle,
  icon,
  accent,
  actionLabel,
  onAction,
  rightSlot,
}) {
  const resolvedAccent = ACCENT_MAP[accent] || accent || ACCENT_MAP.lime;

  return (
    <div style={{ "--headerAccent": resolvedAccent }}>
      <AppHeader
        variant="standard"
        eyebrow="Coach workspace"
        title={title}
        subtitle={subtitle}
        leading={icon ? (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "1px solid color-mix(in srgb, var(--headerAccent) 20%, var(--stroke-1))",
              background: "color-mix(in srgb, var(--headerAccent) 7%, var(--surface-1))",
              color: "var(--headerAccent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
        ) : null}
        brandLockup={rightSlot || null}
        action={actionLabel ? { label: actionLabel, onClick: onAction } : null}
      />
    </div>
  );
}
