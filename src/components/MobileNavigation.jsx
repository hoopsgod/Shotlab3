import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./MobileNavigation.module.css";

const MoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

function NavigationItem({ item, active, onSelect, compact = false }) {
  const label = item.mobileLabel || item.l || item.label || item.k;
  return (
    <button
      type="button"
      className={`${compact ? styles.dockItem : styles.sheetItem} ${active ? styles.active : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      data-nav-key={item.k}
      onClick={() => onSelect(item.k)}
    >
      <span className={compact ? styles.dockIcon : styles.sheetIcon} aria-hidden="true">
        {item.svg}
        {item.dot && <span className={styles.notificationDot} />}
      </span>
      <span className={compact ? styles.dockLabel : styles.sheetText}>
        <span className={compact ? styles.dockLabelText : styles.sheetLabel}>{label}</span>
        {!compact && item.description && <span className={styles.sheetDescription}>{item.description}</span>}
      </span>
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
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
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
            aria-expanded={open}
            aria-controls="mobile-navigation-more-sheet"
            aria-label="More"
            data-testid="mobile-navigation-more"
            onClick={() => setOpen((value) => !value)}
          >
            <span className={styles.dockIcon} aria-hidden="true">
              <MoreIcon />
              {secondaryHasNotification && <span className={styles.notificationDot} />}
            </span>
            <span className={styles.dockLabelText}>More</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className={styles.overlay} data-testid="mobile-navigation-overlay" onMouseDown={() => setOpen(false)}>
          <section
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
                <div className={styles.sheetEyebrow}>More</div>
                <h2 className={styles.sheetTitle}>All areas</h2>
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
