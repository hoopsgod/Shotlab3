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
const rawSource = readFileSync(path, 'utf8');
const lineEnding = rawSource.includes('\r\n') ? '\r\n' : '\n';
let source = rawSource.replace(/\r\n/g, '\n');

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
      'html.team-store-portal-open,html.team-store-portal-open body{width:100%;height:100%;overflow:hidden!important;overscroll-behavior:none;background:#f6f7f3!important;}',
      'html.team-store-portal-open body > #root{display:none!important;}',
      'html.team-store-portal-open [data-testid="mobile-navigation-dock"],html.team-store-portal-open [data-testid="mobile-navigation-overlay"]{display:none!important;visibility:hidden!important;pointer-events:none!important;}',
      'html.team-store-portal-open #team-store-root{position:fixed!important;inset:0!important;z-index:2147483000!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;overflow:hidden!important;background:#f6f7f3!important;}',
      'html.team-store-portal-open .ts-launcher{display:none!important;}',
      'html.team-store-portal-open .ts-overlay{position:fixed!important;inset:0!important;z-index:1!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;margin:0!important;padding:0!important;display:block!important;background:#f6f7f3!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;overflow:hidden!important;}',
      'html.team-store-portal-open .ts-panel{position:fixed!important;inset:0!important;z-index:2!important;width:100vw!important;max-width:none!important;height:100dvh!important;min-height:100dvh!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scroll-padding-top:calc(76px + env(safe-area-inset-top,0px));background:#f6f7f3!important;color:#171a18!important;}',
      'html.team-store-portal-open .ts-header{position:sticky!important;top:0!important;z-index:20!important;padding-top:calc(14px + env(safe-area-inset-top,0px))!important;border-radius:0!important;background:rgba(246,247,243,.96)!important;color:#171a18!important;box-shadow:0 1px 0 rgba(23,28,23,.08)!important;backdrop-filter:blur(18px) saturate(1.08)!important;-webkit-backdrop-filter:blur(18px) saturate(1.08)!important;}',
      'html.team-store-portal-open .ts-header h2{color:#171a18!important;-webkit-text-fill-color:#171a18!important;}',
      'html.team-store-portal-open .ts-header p{color:#68706a!important;-webkit-text-fill-color:#68706a!important;}',
      'html.team-store-portal-open .ts-eyebrow{color:#5b7119!important;-webkit-text-fill-color:#5b7119!important;}',
      'html.team-store-portal-open .ts-close{min-width:44px!important;min-height:44px!important;border-color:rgba(23,26,24,.14)!important;background:#fff!important;color:#171a18!important;-webkit-text-fill-color:#171a18!important;touch-action:manipulation;}',
      'html.team-store-portal-open .ts-coach-content,html.team-store-portal-open .ts-player-content{min-height:calc(100dvh - 84px - env(safe-area-inset-top,0px));padding-bottom:calc(32px + env(safe-area-inset-bottom,0px))!important;box-sizing:border-box;}',
      'html.team-store-portal-open .ts-coach-content .ts-preview-column .ts-preview-panel h4{color:#171a18!important;-webkit-text-fill-color:#171a18!important;}',
      'html.team-store-portal-open .ts-coach-content .ts-preview-column .ts-preview-panel p{color:#5f6861!important;-webkit-text-fill-color:#5f6861!important;}',
      'html.team-store-portal-open .ts-empty-state{min-height:calc(100dvh - 160px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));align-content:center;padding:32px 18px calc(36px + env(safe-area-inset-bottom,0px))!important;color:#171a18!important;}',
      'html.team-store-portal-open .ts-empty-icon{border:1px solid rgba(91,113,25,.16)!important;background:rgba(91,113,25,.08)!important;color:#5b7119!important;}',
      'html.team-store-portal-open .ts-empty-state h3{color:#171a18!important;-webkit-text-fill-color:#171a18!important;}',
      'html.team-store-portal-open .ts-empty-state p{color:#5f6861!important;-webkit-text-fill-color:#5f6861!important;}',
      'html.team-store-portal-open .ts-empty-state .ts-button-secondary{min-width:132px;min-height:48px!important;border-color:rgba(23,26,24,.16)!important;background:#fff!important;color:#273129!important;-webkit-text-fill-color:#273129!important;box-shadow:0 8px 22px rgba(23,28,24,.06)!important;}',
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

writeFileSync(path, source.replace(/\n/g, lineEnding));
console.log('Applied Phase 3I Team Store immersive shell.');
