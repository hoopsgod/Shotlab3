import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./MobileNavigation.module.css";

const MoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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

function NavigationItem({ item, active, onSelect, compact = false }) {
  const label = item.mobileLabel || item.l || item.label || item.k;
  return (
    <button
      type="button"
      className={`${compact ? styles.dockItem : styles.sheetItem} ${active ? styles.active : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      data-active={active ? "true" : "false"}
      data-nav-key={item.k}
      onClick={() => onSelect(item.k)}
    >
      <span className={compact ? styles.dockIcon : styles.sheetIcon} aria-hidden="true">
        {item.svg}
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

export default function MobileNavigation({
  primaryItems = [],
  secondaryItems = [],
  activeKey,
  onChange,
  ariaLabel = "Mobile navigation",
}) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const moreButtonRef = useRef(null);
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const visiblePrimaryItems = useMemo(() => primaryItems.filter(Boolean).slice(0, 3), [primaryItems]);
  const visibleSecondaryItems = useMemo(() => secondaryItems.filter(Boolean), [secondaryItems]);
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
            ref={moreButtonRef}
            type="button"
            className={`${styles.dockItem} ${secondaryActive || open ? styles.active : ""}`}
            aria-expanded={open}
            aria-controls="mobile-navigation-more-sheet"
            aria-label="More"
            data-testid="mobile-navigation-more"
            data-active={secondaryActive || open ? "true" : "false"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={styles.dockIcon} aria-hidden="true">
              <MoreIcon />
              {(secondaryActive || open) && <span className={styles.activeIndicator} />}
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
                <div className={styles.sheetEyebrow}>Navigate</div>
                <h2 className={styles.sheetTitle}>More areas</h2>
                <p className={styles.sheetSummary}>Your current tab stays in place when you return.</p>
              </div>
              <button ref={closeButtonRef} type="button" className={styles.closeButton} aria-label="Close more navigation" onClick={() => setOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className={styles.sheetGrid}>
              {visibleSecondaryItems.map((item) => (
                <NavigationItem key={item.k} item={item} active={item.k === activeKey} onSelect={handleSelect} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
