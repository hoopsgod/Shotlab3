import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3m-player-team-store-retail] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};

const path = 'src/components/TeamStorePortal.jsx';
let source = readFileSync(path, 'utf8');
const marker = 'data-testid="player-team-store-retail"';

if (source.includes(marker)) {
  for (const preserved of [
    'data-testid="player-team-store-hero"',
    'data-testid="player-team-store-card"',
    'onOpen={() => openStore("player_portal")}',
    'AFFILIATE_DISCLOSURE',
    'isDemoPlayerPreview',
    'DEMO STOREFRONT',
    'A real team store will open only after the coach publishes a verified storefront link.',
    'Your team store is not open yet',
  ]) {
    if (!source.includes(preserved)) fail(`transformed Player Team Store source is missing ${preserved}`);
  }
  console.log('Phase 3M Player Team Store retail hierarchy already applied with safe demo parity.');
  process.exit(0);
}

const oldBlock = `        </div> : <div className="ts-player-content">
          {store ? <>
            <div className="ts-player-intro"><span>OFFICIAL TEAM GEAR</span><h3>Rep your program.</h3><p>Shop apparel and fan gear selected by your coach.</p></div>
            <PlayerStorePreview teamName={activeIdentity.teamName} storeName={store.storeName} providerLabel={getProviderLabel(store.provider)} onOpen={() => openStore("player_portal")} live />
            <p className="ts-disclosure">{AFFILIATE_DISCLOSURE}</p>
          </> : isDemoPlayerPreview ? <>
            <div className="ts-player-intro"><span>DEMO STOREFRONT</span><h3>See the player experience.</h3><p>This preview shows where official team gear will appear for players and families.</p></div>
            <PlayerStorePreview teamName={activeIdentity.teamName} storeName={\`${activeIdentity.teamName} Team Store\`} providerLabel="SquadLocker" />
            <p className="ts-disclosure">A real team store will open only after the coach publishes a verified storefront link.</p>
          </> : <div className="ts-empty-state"><div className="ts-empty-icon"><StoreIcon size={28} /></div><h3>Your team store is not open yet</h3><p>Your coach has not published a store link. Check back after your program announces it.</p><button type="button" onClick={closePortal} className="ts-button ts-button-secondary">GOT IT</button></div>}
        </div>}`;

requireOne(source, oldBlock, 'Player Team Store parity-safe experience');

const newBlock = `        </div> : <div className="ts-player-content" data-testid="player-team-store-retail">
          {store ? <>
            <section className="ts-player-retail-hero is-live" data-testid="player-team-store-hero" aria-label="Official team store">
              <div className="ts-player-retail-status"><span><i aria-hidden="true" /> Official program store</span><small>{getProviderLabel(store.provider)}</small></div>
              <div className="ts-player-retail-copy"><span>TEAM GEAR</span><h3>Rep your program.</h3><p>Coach-selected apparel and fan gear, one tap from your training home.</p></div>
              <div className="ts-player-retail-signals" aria-label="Store experience">
                <span><strong>Official</strong><small>Coach-selected</small></span>
                <span><strong>Secure</strong><small>Partner checkout</small></span>
                <span><strong>Direct</strong><small>One-tap access</small></span>
              </div>
            </section>
            <section className="ts-player-storefront-shell" data-testid="player-team-store-card" aria-label="Team storefront">
              <div className="ts-player-storefront-heading"><span>STORE ACCESS</span><strong>{store.storeName}</strong><small>Powered by {getProviderLabel(store.provider)}</small></div>
              <PlayerStorePreview teamName={activeIdentity.teamName} storeName={store.storeName} providerLabel={getProviderLabel(store.provider)} onOpen={() => openStore("player_portal")} live />
            </section>
            <div className="ts-player-store-trust"><CheckIcon /><p><strong>Checkout stays with {getProviderLabel(store.provider)}.</strong><span>Your apparel partner handles payment, fulfillment, returns, and support.</span></p></div>
            <p className="ts-disclosure">{AFFILIATE_DISCLOSURE}</p>
          </> : isDemoPlayerPreview ? <>
            <section className="ts-player-retail-hero is-demo" data-testid="player-team-store-hero" aria-label="Demo team store preview">
              <div className="ts-player-retail-status"><span><i aria-hidden="true" /> Demo storefront</span><small>Preview only</small></div>
              <div className="ts-player-retail-copy"><span>DEMO STOREFRONT</span><h3>See the player experience.</h3><p>This preview shows where official team gear will appear for players and families.</p></div>
              <div className="ts-player-retail-signals" aria-label="Demo store experience">
                <span><strong>Preview</strong><small>No checkout</small></span>
                <span><strong>Safe</strong><small>No fake link</small></span>
                <span><strong>Ready</strong><small>Coach publishes</small></span>
              </div>
            </section>
            <section className="ts-player-storefront-shell" data-testid="player-team-store-card" aria-label="Demo team storefront">
              <div className="ts-player-storefront-heading"><span>STORE PREVIEW</span><strong>{activeIdentity.teamName} Team Store</strong><small>Powered by SquadLocker</small></div>
              <PlayerStorePreview teamName={activeIdentity.teamName} storeName={\`${activeIdentity.teamName} Team Store\`} providerLabel="SquadLocker" />
            </section>
            <p className="ts-disclosure">A real team store will open only after the coach publishes a verified storefront link.</p>
          </> : <div className="ts-empty-state"><div className="ts-empty-icon"><StoreIcon size={28} /></div><h3>Your team store is not open yet</h3><p>Your coach has not published a store link. Check back after your program announces it.</p><button type="button" onClick={closePortal} className="ts-button ts-button-secondary">GOT IT</button></div>}
        </div>}`;

source = source.replace(oldBlock, newBlock);

for (const preserved of [
  'TEAM_STORE_OPEN_EVENT',
  'getSquadLockerPartnerReadiness',
  'buildTeamStoreReferralStart',
  'window.open(store.storeUrl, "_blank", "noopener,noreferrer")',
  'window.open(partnerUrl, "_blank", "noopener,noreferrer")',
  'PUBLISH STORE',
  'aria-label="Open team store"',
  'isDemoPlayerPreview',
  'DEMO STOREFRONT',
  'A real team store will open only after the coach publishes a verified storefront link.',
]) {
  if (!source.includes(preserved)) fail(`Team Store capability removed: ${preserved}`);
}

writeFileSync(path, source);
console.log('Applied Phase 3M Player Team Store retail hierarchy with safe demo parity.');
