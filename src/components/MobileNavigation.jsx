import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./MobileNavigation.module.css";
import "./MobileNavigationArchitecture.css";

const ICON_STYLE = { width: 20, height: 20, strokeWidth: 1.75 };
const ACTIVE_COLOR = "color-mix(in srgb, var(--team-brand-nav-active, var(--accent, #c8ff1a)) 82%, #78951f 18%)";
const ACTIVE_HALO = "color-mix(in srgb, var(--accent, #c8ff1a) 8%, transparent)";
const FOCUSABLE_SELECTOR = "button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";
const ROLE_PRIMARY_NAV = {
  player: [
    { key: "home", label: "Home", icon: "home" },
    { key: "log-drill", label: "Train", icon: "target" },
    { key: "profile", label: "Progress", icon: "momentum" },
  ],
  coach: [
    { key: "feed", label: "Home", icon: "home" },
    { key: "players", label: "Players", icon: "team" },
    { key: "events", label: "Schedule", icon: "calendar" },
  ],
};
const GROUP_DEFINITIONS = [
  { id: "program", title: "Program", description: "Schedule, training, and team operations", keys: new Set(["program", "events", "drills", "sc", "lifting", "attendance", "duels"]) },
  { id: "performance", title: "Performance", description: "Results, progress, and season intelligence", keys: new Set(["leaderboards", "analytics", "progress", "history", "archives"]) },
  { id: "team", title: "Team & account", description: "Identity, store, profile, and settings", keys: new Set(["team-store", "branding", "profile", "settings", "account"]) },
];
const PLAYER_GROUP_DEFINITIONS = [
  { id: "program", title: "Team program", description: "Program work, events, and lifting", keys: new Set(["program", "events", "drills", "sc", "lifting", "attendance", "duels"]) },
  { id: "performance", title: "Rankings", description: "Team standings and historical context", keys: new Set(["leaderboards", "analytics", "history", "archives"]) },
  { id: "team", title: "Team & account", description: "Store, identity, and account tools", keys: new Set(["team-store", "branding", "settings", "account"]) },
];

const MoreIcon = () => <svg style={ICON_STYLE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>;
const semanticNavigationIcon = (item) => item?.mobileIcon || (item?.k === "duels" ? "program" : "");
const normalizeNavigationIcon = (item) => {
  const semanticIcon = semanticNavigationIcon(item);
  if (semanticIcon) return <ShotLabIcon name={semanticIcon} size={20} />;
  if (!isValidElement(item?.svg)) return item?.svg;
  return cloneElement(item.svg, { width: 20, height: 20, strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", style: { ...(item.svg.props.style || {}), ...ICON_STYLE } });
};
const resolveNavigationGroup = (item, definitions = GROUP_DEFINITIONS) => {
  const explicit = String(item?.group || "").trim().toLowerCase();
  if (explicit) return explicit;
  const key = String(item?.k || "").trim().toLowerCase();
  return definitions.find((group) => group.keys.has(key))?.id || "other";
};

export function groupSecondaryNavigation(items = [], role = "default") {
  const safeItems = items.filter(Boolean);
  const definitions = role === "player" ? PLAYER_GROUP_DEFINITIONS : GROUP_DEFINITIONS;
  const groups = definitions.map((definition) => ({ ...definition, items: safeItems.filter((item) => resolveNavigationGroup(item, definitions) === definition.id) })).filter((group) => group.items.length);
  const assigned = new Set(groups.flatMap((group) => group.items));
  const otherItems = safeItems.filter((item) => !assigned.has(item));
  if (otherItems.length) groups.push({ id: "other", title: "More tools", description: "Additional ShotLab areas", items: otherItems });
  return groups;
}

function NavigationItem({ item, active, onSelect, compact = false }) {
  const label = item.mobileLabel || item.l || item.label || item.k;
  const iconName = semanticNavigationIcon(item) || "custom";
  return (
    <button
      type="button"
      className={`${compact ? styles.dockItem : styles.sheetItem} ${active ? styles.active : ""}`}
      style={compact ? active ? { color: ACTIVE_COLOR } : undefined : { minHeight: 62, gridTemplateColumns: "40px minmax(0, 1fr) 18px", color: active ? ACTIVE_COLOR : undefined }}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      aria-description={item.dot ? "Updates available" : undefined}
      data-active={active ? "true" : "false"}
      data-nav-key={item.k}
      data-icon-name={iconName}
      onClick={() => onSelect(item.k)}
    >
      <span className={compact ? styles.dockIcon : styles.sheetIcon} style={compact ? { width: 32, height: 26, background: active ? ACTIVE_HALO : undefined } : { width: 40, height: 40, borderRadius: 12, background: active ? ACTIVE_HALO : undefined }} aria-hidden="true">
        {normalizeNavigationIcon(item)}
        {compact && active && <span className={styles.activeIndicator} />}
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

export default function MobileNavigation({ primaryItems = [], secondaryItems = [], activeKey, onChange, ariaLabel = "Mobile navigation" }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const role = ariaLabel.toLowerCase().includes("player") ? "player" : ariaLabel.toLowerCase().includes("coach") ? "coach" : "default";
  const allItems = useMemo(() => [...primaryItems, ...secondaryItems].filter(Boolean), [primaryItems, secondaryItems]);
  const visiblePrimaryItems = useMemo(() => {
    const destinations = ROLE_PRIMARY_NAV[role] || [];
    if (!destinations.length) return primaryItems.filter(Boolean).slice(0, 3);
    return destinations.map(({ key, label, icon }) => {
      const item = allItems.find((candidate) => candidate.k === key);
      return item ? { ...item, mobileLabel: label, mobileIcon: icon } : null;
    }).filter(Boolean);
  }, [allItems, primaryItems, role]);
  const visibleSecondaryItems = useMemo(() => {
    const primaryKeys = new Set(visiblePrimaryItems.map((item) => item.k));
    return allItems.filter((item) => !primaryKeys.has(item.k)).map((item) => {
      if (role !== "player") return item;
      if (item.k === "leaderboards") return { ...item, mobileLabel: "Rankings", mobileIcon: "chart", description: "Team standings and all-time context", group: "performance" };
      if (item.k === "duels") return { ...item, mobileLabel: "Program", mobileIcon: "program", description: item.description || "Coach-assigned team work", group: "program" };
      if (item.k === "program") return { ...item, mobileLabel: "Events", mobileIcon: "calendar", description: item.description || "Team schedule and RSVPs", group: "program" };
      if (item.k === "team-store") return { ...item, mobileLabel: "Team Store", mobileIcon: "store", description: item.description || "Official team apparel and gear", group: "team" };
      if (item.k === "sc") return { ...item, mobileLabel: "Lifting", description: item.description || "Strength and conditioning", group: "program" };
      return item;
    });
  }, [allItems, visiblePrimaryItems, role]);
  const groupedSecondaryItems = useMemo(() => groupSecondaryNavigation(visibleSecondaryItems, role), [visibleSecondaryItems, role]);
  const secondaryActive = visibleSecondaryItems.some((item) => item.k === activeKey);
  const secondaryHasNotification = visibleSecondaryItems.some((item) => Boolean(item.dot));
  const sheetCopy = role === "player"
    ? { eyebrow: "Player workspace", title: "More", summary: "Program work, schedule, rankings, and team tools." }
    : { eyebrow: role === "default" ? "ShotLab" : `${role[0].toUpperCase()}${role.slice(1)} workspace`, title: "Everything else, organized", summary: "Frequent actions stay in the dock. Related tools live together here." };

  useEffect(() => setOpen(false), [activeKey]);
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = "hidden";
    document.body.dataset.navigationSheetOpen = "true";
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") return setOpen(false);
      if (event.key !== "Tab") return;
      const focusable = [...(sheetRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.navigationSheetOpen;
      removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current instanceof HTMLElement) previousFocusRef.current.focus();
    };
  }, [open]);

  const handleSelect = (key) => { setOpen(false); onChange?.(key); };
  const activeMore = secondaryActive || open;
  const shell = (
    <>
      <nav className={styles.dock} aria-label={ariaLabel} data-navigation-role={role} data-navigation-intent={role === "player" ? "development-first" : undefined} data-testid="mobile-navigation-dock">
        <div className={styles.dockInner}>
          {visiblePrimaryItems.map((item) => <NavigationItem key={item.k} item={item} active={item.k === activeKey} onSelect={handleSelect} compact />)}
          <button type="button" className={`${styles.dockItem} ${activeMore ? styles.active : ""}`} style={activeMore ? { color: ACTIVE_COLOR } : undefined} aria-expanded={open} aria-controls="mobile-navigation-more-sheet" aria-label="More" aria-description={secondaryHasNotification ? "Updates available" : undefined} data-testid="mobile-navigation-more" data-active={activeMore ? "true" : "false"} data-icon-name="more" onClick={() => setOpen((value) => !value)}>
            <span className={styles.dockIcon} style={{ width: 32, height: 26, background: activeMore ? ACTIVE_HALO : undefined }} aria-hidden="true"><MoreIcon />{activeMore && <span className={styles.activeIndicator} />}{secondaryHasNotification && <span className={styles.notificationDot} />}</span>
            <span className={styles.dockLabelText}>More</span>
          </button>
        </div>
      </nav>

      {open && <div className={styles.overlay} data-testid="mobile-navigation-overlay" onMouseDown={() => setOpen(false)}>
        <section ref={sheetRef} id="mobile-navigation-more-sheet" className={styles.sheet} role="dialog" aria-modal="true" aria-label="More navigation" data-testid="mobile-navigation-sheet" onMouseDown={(event) => event.stopPropagation()}>
          <div className={styles.sheetHandle} aria-hidden="true" />
          <div className={styles.sheetHeader}>
            <div><div className={styles.sheetEyebrow}>{sheetCopy.eyebrow}</div><h2 className={styles.sheetTitle}>{sheetCopy.title}</h2><p className={styles.sheetSummary}>{sheetCopy.summary}</p></div>
            <button ref={closeButtonRef} type="button" className={styles.closeButton} aria-label="Close more navigation" onClick={() => setOpen(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
          </div>
          <div className={styles.sheetGroups} data-testid="mobile-navigation-groups">
            {groupedSecondaryItems.map((group) => <section className={styles.sheetGroup} key={group.id} data-navigation-group={group.id} aria-labelledby={`mobile-navigation-${group.id}`}>
              <header className={styles.groupHeader}><h3 id={`mobile-navigation-${group.id}`}>{group.title}</h3><p>{group.description}</p></header>
              <div className={styles.sheetGrid}>{group.items.map((item) => <NavigationItem key={item.k} item={item} active={item.k === activeKey} onSelect={handleSelect} />)}</div>
            </section>)}
          </div>
        </section>
      </div>}
    </>
  );

  return typeof document === "undefined" ? shell : createPortal(shell, document.body);
}
