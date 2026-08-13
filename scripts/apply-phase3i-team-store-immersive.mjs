import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3i-team-store-immersive] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};
const replaceOne = (source, before, after, label) => {
  requireOne(source, before, label);
  return source.replace(before, after);
};

const path = 'src/components/TeamStorePortal.jsx';
let source = readFileSync(path, 'utf8');

if (source.includes('data-testid="team-store-portal-overlay"')) {
  for (const marker of [
    'data-testid="team-store-portal-panel"',
    'team-store-portal-open',
    'shotlab-team-store-immersive-runtime',
    'document.documentElement.classList.add',
    'document.documentElement.classList.remove',
  ]) {
    if (!source.includes(marker)) fail(`transformed Team Store source is missing ${marker}`);
  }
  console.log('Phase 3I Team Store immersive shell already applied.');
  process.exit(0);
}

const openEffect = `  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setNavigationIdentity(null);
      setEditing(false);
      setError("");
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);`;

const immersiveEffect = `  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const portalClass = "team-store-portal-open";
    const runtimeStyleId = "shotlab-team-store-immersive-runtime";
    const runtimeStyle = document.getElementById(runtimeStyleId) || document.createElement("style");
    runtimeStyle.id = runtimeStyleId;
    runtimeStyle.textContent = [
      '@media (max-width:759px){',
      'html.team-store-portal-open body > #root{display:none!important;}',
      'html.team-store-portal-open [data-testid="mobile-navigation-dock"],html.team-store-portal-open [data-testid="mobile-navigation-overlay"]{display:none!important;visibility:hidden!important;pointer-events:none!important;}',
      'html.team-store-portal-open #team-store-root{position:fixed!important;inset:0!important;z-index:2147483000!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;overflow:hidden!important;background:#f6f7f3!important;}',
      'html.team-store-portal-open .ts-overlay{position:fixed!important;inset:0!important;z-index:1!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;margin:0!important;padding:0!important;display:block!important;background:#f6f7f3!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;overflow:hidden!important;}',
      'html.team-store-portal-open .ts-panel{position:fixed!important;inset:0!important;z-index:2!important;width:100vw!important;max-width:none!important;height:100dvh!important;min-height:100dvh!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;overflow-x:hidden!important;overflow-y:auto!important;background:#f6f7f3!important;}',
      '}',
    ].join("");
    if (!runtimeStyle.isConnected) document.head.appendChild(runtimeStyle);
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setNavigationIdentity(null);
      setEditing(false);
      setError("");
    };
    document.documentElement.classList.add(portalClass);
    document.body.classList.add(portalClass);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.documentElement.classList.remove(portalClass);
      document.body.classList.remove(portalClass);
      runtimeStyle.remove();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);`;

source = replaceOne(source, openEffect, immersiveEffect, 'Team Store open lifecycle');
source = replaceOne(
  source,
  '{open && <div role="dialog" aria-modal="true" aria-label="Team Store" className="ts-overlay"',
  '{open && <div role="dialog" aria-modal="true" aria-label="Team Store" data-testid="team-store-portal-overlay" className="ts-overlay"',
  'Team Store overlay',
);
source = replaceOne(
  source,
  '<section className="ts-panel">',
  '<section className="ts-panel" data-testid="team-store-portal-panel">',
  'Team Store panel',
);

for (const preserved of [
  'TEAM_STORE_OPEN_EVENT',
  'getSquadLockerPartnerReadiness',
  'buildTeamStoreReferralStart',
  'window.open(store.storeUrl, "_blank", "noopener,noreferrer")',
  'window.open(partnerUrl, "_blank", "noopener,noreferrer")',
  'aria-label="Open team store"',
  'role="dialog"',
  'aria-modal="true"',
]) {
  if (!source.includes(preserved)) fail(`Team Store capability removed: ${preserved}`);
}

writeFileSync(path, source);
console.log('Applied Phase 3I Team Store immersive shell.');
