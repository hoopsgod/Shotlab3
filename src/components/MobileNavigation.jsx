import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./MobileNavigation.module.css";
import "./MobileNavigationArchitecture.css";

const ICON_STYLE = { width: 20, height: 20, strokeWidth: 1.75 };
const ACTIVE_COLOR = "color-mix(in srgb, var(--team-brand-nav-active, var(--accent, #c8ff1a)) 82%, #78951f 18%)";
const ACTIVE_HALO = "color-mix(in srgb, var(--accent, #c8ff1a) 8%, transparent)";

const MoreIcon = () => (
  <svg style={ICON_STYLE} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const GROUP_DEFINITIONS = [
  {
    id: "program",
    title: "Program",
    description: "Schedule, training, and team operations",
    keys: new Set(["program", "events", "drills", "sc", "lifting", "attendance"]),
  },
  {
    id: "performance",
    title: "Performance",
    description: "Results, progress, and season intelligence",
    keys: new Set(["leaderboards", "analytics", "progress", "history", "archives"]),
  },
  {
    id: "team",
    title: "Team & account",
    description: "Identity, store, profile, and settings",
    keys: new Set(["team-store", "branding", "profile", "settings", "account"]),
  },
];

const semanticNavigationIcon = (key) => {
  if (key === "log-drill") return "home";
  if (key === "duels") return "program";
  return "";
};

const normalizeNavigationIcon = (item) => {
  const semanticIcon = semanticNavigationIcon(item?.k);
  if (semanticIcon) return <ShotLabIcon name={semanticIcon} size={20} />;
  if (!isValidElement(item?.svg)) return item?.svg;
  return cloneElement(item.svg, {
    width: 20,
    height: 20,
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { ...(item.svg.props.style || {}), ...ICON_STYLE },
  });
};

function resolveNavigationGroup(item) {
  const explicit = String(item?.group || "").trim().toLowerCase();
  if (explicit) return explicit;
  const key = String(item?.k || "").trim().toLowerCase();
  return GROUP_DEFINITIONS.find((group) => group.keys.has(key))?.id || "other";
}

export function groupSecondaryNavigation(items = []) {
  const safeItems = items.filter(Boolean);
  const groups = GROUP_DEFINITIONS.map((definition) => ({
    ...definition,
    items: safeItems.filter((item) => resolveNavigationGroup(item) === definition.id),
  })).filter((group) => group.items.length > 0);
  const assigned = new Set(groups.flatMap((group) => group.items));
  const otherItems = safeItems.filter((item) => !assigned.has(item));
  if (otherItems.length) {
    groups.push({ id: "other", title: "More tools", description: "Additional ShotLab areas", items: otherItems });
  }
  return groups;
}

function NavigationItem({ item, active, onSelect, compact = false }) {
  const label = item.mobileLabel || item.l || item.label || item.k;
  const buttonStyle = compact
    ? active ? { color: ACTIVE_COLOR } : undefined
    : { minHeight: 62, gridTemplateColumns: "40px minmax(0, 1fr) 18px", color: active ? ACTIVE_COLOR : undefined };
  const iconStyle = compact
    ? { width: 32, height: 26, background: active ? ACTIVE_HALO : undefined }
    : { width: 40, height: 40, borderRadius: 12, background: active ? ACTIVE_HALO : undefined };
  return (
    <button
      type="button"
      className={`${compact ? styles.dockItem : styles.sheetItem} ${active ? styles.active : ""}`}
      style={buttonStyle}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      data-active={active ? "true" : "false"}
      data-nav-key={item.k}
      onClick={() => onSelect(item.k)}
    >
      <span className={compact ? styles.dockIcon : styles.sheetIcon} style={iconStyle} aria-hidden="true">
        {normalizeNavigationIcon(item)}
        {compact && active && <span className={styles.activeIndicator} style={{ width: 13, boxShadow: "0 0 9px color-mix(in srgb, currentColor 30%, transparent)" }} />}
        {item.dot && <span className={styles.notificationDot} />}
      </span>
      <span className={compact ? styles.dockLabel : styles.sheetText}>
        <span className={compact ? styles.dockLabelText : styles.sheetLabel}>{label}</span>
        {!compact && item.description && <span className={styles.sheetDescription}>{item.description}</span>}
      </span>
      {!compact && <span className={styles.sheetChevron} aria-hidden="true">›</span>}
    </button>
  );
}

export default function MobileNavigation({
  primaryItems = [],
  secondaryItems = [],
  activeKey,
  onChange,
  ariaLabel = "Mobile navigation",
}) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const visiblePrimaryItems = useMemo(() => primaryItems.filter(Boolean).slice(0, 3), [primaryItems]);
  const visibleSecondaryItems = useMemo(() => secondaryItems.filter(Boolean), [secondaryItems]);
  const groupedSecondaryItems = useMemo(() => groupSecondaryNavigation(visibleSecondaryItems), [visibleSecondaryItems]);
  const secondaryActive = visibleSecondaryItems.some((item) => item.k === activeKey);
  const secondaryHasNotification = visibleSecondaryItems.some((item) => Boolean(item.dot));

  useEffect(() => {
    setOpen(false);
  }, [activeKey]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = "hidden";
    document.body.dataset.navigationSheetOpen = "true";

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(sheetRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.navigationSheetOpen;
      window.removeEventListener("keydown", handleKeyDown);
      const restoreTarget = previousFocusRef.current;
      if (restoreTarget instanceof HTMLElement) restoreTarget.focus();
    };
  }, [open]);

  const handleSelect = (key) => {
    setOpen(false);
    onChange?.(key);
  };

  return (
    <>
      <nav className={styles.dock} aria-label={ariaLabel} data-testid="mobile-navigation-dock">
        <div className={styles.dockInner}>
          {visiblePrimaryItems.map((item) => (
            <NavigationItem key={item.k} item={item} active={item.k === activeKey} onSelect={handleSelect} compact />
          ))}
          <button
            type="button"
            className={`${styles.dockItem} ${secondaryActive || open ? styles.active : ""}`}
            style={secondaryActive || open ? { color: ACTIVE_COLOR } : undefined}
            aria-expanded={open}
            aria-controls="mobile-navigation-more-sheet"
            aria-label="More"
            data-testid="mobile-navigation-more"
            data-active={secondaryActive || open ? "true" : "false"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={styles.dockIcon} style={{ width: 32, height: 26, background: secondaryActive || open ? ACTIVE_HALO : undefined }} aria-hidden="true">
              <MoreIcon />
              {(secondaryActive || open) && <span className={styles.activeIndicator} style={{ width: 13, boxShadow: "0 0 9px color-mix(in srgb, currentColor 30%, transparent)" }} />}
              {secondaryHasNotification && <span className={styles.notificationDot} />}
            </span>
            <span className={styles.dockLabelText}>More</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className={styles.overlay} data-testid="mobile-navigation-overlay" onMouseDown={() => setOpen(false)}>
          <section
            ref={sheetRef}
            id="mobile-navigation-more-sheet"
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            data-testid="mobile-navigation-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetHandle} aria-hidden="true" />
            <div className={styles.sheetHeader}>
              <div>
                <div className={styles.sheetEyebrow}>ShotLab workspace</div>
                <h2 className={styles.sheetTitle}>Everything else, organized</h2>
                <p className={styles.sheetSummary}>Frequent actions stay in the dock. Related tools live together here.</p>
              </div>
              <button ref={closeButtonRef} type="button" className={styles.closeButton} aria-label="Close more navigation" onClick={() => setOpen(false)}>
                <svg style={{ width: 18, height: 18, strokeWidth: 1.75 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className={styles.sheetGroups} data-testid="mobile-navigation-groups">
              {groupedSecondaryItems.map((group) => (
                <section className={styles.sheetGroup} key={group.id} data-navigation-group={group.id} aria-labelledby={`mobile-navigation-${group.id}`}>
                  <header className={styles.groupHeader}>
                    <h3 id={`mobile-navigation-${group.id}`}>{group.title}</h3>
                    <p>{group.description}</p>
                  </header>
                  <div className={styles.sheetGrid}>
                    {group.items.map((item) => (
                      <NavigationItem key={item.k} item={item} active={item.k === activeKey} onSelect={handleSelect} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
