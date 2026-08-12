import { readFileSync, writeFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase4c-premium-interaction-material-motion] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected one anchor, found ${count}`);
};

const navPath = "src/components/MobileNavigation.jsx";
let nav = readFileSync(navPath, "utf8");

if (!nav.includes('data-navigation-role={role} data-testid="mobile-navigation-overlay"')) {
  const overlayAnchor = '<div className={styles.overlay} data-testid="mobile-navigation-overlay" onMouseDown={() => setOpen(false)}>';
  requireOne(nav, overlayAnchor, "player/coach navigation overlay");
  nav = nav.replace(
    overlayAnchor,
    '<div className={styles.overlay} data-navigation-role={role} data-testid="mobile-navigation-overlay" onMouseDown={() => setOpen(false)}>',
  );
}

if (!nav.includes('data-navigation-role={role} data-testid="mobile-navigation-sheet"')) {
  const sheetAnchor = '<section ref={sheetRef} id="mobile-navigation-more-sheet" className={styles.sheet} role="dialog" aria-modal="true" aria-label="More navigation" data-testid="mobile-navigation-sheet" onMouseDown={(event) => event.stopPropagation()}>';
  requireOne(nav, sheetAnchor, "mobile navigation sheet");
  nav = nav.replace(
    sheetAnchor,
    '<section ref={sheetRef} id="mobile-navigation-more-sheet" className={styles.sheet} role="dialog" aria-modal="true" aria-label="More navigation" data-navigation-role={role} data-testid="mobile-navigation-sheet" onMouseDown={(event) => event.stopPropagation()}>',
  );
}

for (const preserved of [
  'data-testid="mobile-navigation-dock"',
  'data-testid="mobile-navigation-more"',
  'onClick={() => setOpen((value) => !value)}',
  'onMouseDown={() => setOpen(false)}',
  'data-navigation-role={role} data-testid="mobile-navigation-overlay"',
  'data-navigation-role={role} data-testid="mobile-navigation-sheet"',
]) if (!nav.includes(preserved)) fail(`navigation capability removed: ${preserved}`);

writeFileSync(navPath, nav);

const indexPath = "index.html";
let index = readFileSync(indexPath, "utf8");
if (!index.includes('shotlab-phase4c-interaction-material-motion')) {
  const anchor = '  <link id="shotlab-phase4b-performance-marks" rel="stylesheet" href="/shotlab-phase4b-performance-marks.css" />';
  requireOne(index, anchor, "Phase 4B stylesheet link");
  index = index.replace(anchor, `${anchor}\n  <link id="shotlab-phase4c-interaction-material-motion" rel="stylesheet" href="/shotlab-phase4c-interaction-material-motion.css" />`);
  writeFileSync(indexPath, index);
}

console.log("Applied Phase 4C premium interaction material and motion.");
