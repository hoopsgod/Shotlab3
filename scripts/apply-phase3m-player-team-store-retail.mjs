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
    'Your team store is not open yet',
  ]) {
    if (!source.includes(preserved)) fail(`transformed Player Team Store source is missing ${preserved}`);
  }
  console.log('Phase 3M Player Team Store retail hierarchy already applied.');
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

requireOne(source, oldBlock, 'Player Team Store experience');

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
            <section className="ts-player-retail-hero is-demo" data-testid="player-team-store-hero" aria-label="Team store player preview">
              <div className="ts-player-retail-status"><span><i aria-hidden="true" /> Player experience preview</span><small>Demo mode</small></div>
              <div className="ts-player-retail-copy"><span>TEAM GEAR</span><h3>Your team. Your gear.</h3><p>See the player-facing store experience before a coach publishes the official destination.</p></div>
              <div className="ts-player-retail-signals" aria-label="Store experience preview">
                <span><strong>Official</strong><small>Program gear</small></span>
                <span><strong>Simple</strong><small>One destination</small></span>
                <span><strong>Secure</strong><small>Partner checkout</small></span>
              </div>
            </section>
            <section className="ts-player-storefront-shell is-demo" data-testid="player-team-store-card" aria-label="Demo team storefront">
              <div className="ts-player-storefront-heading"><span>STORE PREVIEW</span><strong>{activeIdentity.teamName} Team Store</strong><small>Shopping activates after coach publishing</small></div>
              <PlayerStorePreview teamName={activeIdentity.teamName} storeName={\`${activeIdentity.teamName} Team Store\`} providerLabel="SquadLocker" />
            </section>
            <div className="ts-player-store-trust is-demo"><CheckIcon /><p><strong>Preview only in demo mode.</strong><span>A real team store opens only after the coach publishes a verified storefront link.</span></p></div>
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
]) {
  if (!source.includes(preserved)) fail(`Team Store capability removed: ${preserved}`);
}

writeFileSync(path, source);
console.log('Applied Phase 3M Player Team Store retail hierarchy.');
