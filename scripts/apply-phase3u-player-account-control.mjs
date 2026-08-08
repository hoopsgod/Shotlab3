import fs from "node:fs";

const appPath = "src/App.jsx";
const navPath = "src/components/MobileNavigation.jsx";
const navCssPath = "src/components/MobileNavigation.module.css";

function replaceOrVerify(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Phase 3U patch target missing: ${label}`);
  return source.replace(before, after);
}

let app = fs.readFileSync(appPath, "utf8");
app = replaceOrVerify(
  app,
  `<div className="player-quick-actions" aria-label="Player quick actions" style={{display:"flex",gap:12,justifyContent:"flex-end",alignItems:"center",padding:"5px 20px 0",position:"relative",zIndex:2}}>
  {isDesktop&&<button type="button" aria-label="Profile" onClick={()=>switchTab("profile")} style={{minHeight:34,padding:"0 2px",border:0,background:"transparent",color:T.SUB,fontFamily:FB,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Profile</button>}
  <button type="button" aria-label="Logout" onClick={logout} style={{minHeight:34,padding:"0 2px",border:0,background:"transparent",color:T.MUT,fontFamily:FB,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Logout</button>
</div>`,
  `{isDesktop&&<div className="player-quick-actions" aria-label="Player quick actions" style={{display:"flex",gap:12,justifyContent:"flex-end",alignItems:"center",padding:"5px 20px 0",position:"relative",zIndex:2}}>
  <button type="button" aria-label="Profile" onClick={()=>switchTab("profile")} style={{minHeight:34,padding:"0 2px",border:0,background:"transparent",color:T.SUB,fontFamily:FB,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Profile</button>
  <button type="button" aria-label="Logout" onClick={logout} style={{minHeight:34,padding:"0 2px",border:0,background:"transparent",color:T.MUT,fontFamily:FB,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Logout</button>
</div>}`,
  "mobile player quick actions"
);
app = replaceOrVerify(
  app,
  `padding:isDesktop?"14px 20px 36px":"16px 20px var(--player-scroll-bottom-padding)"`,
  `padding:isDesktop?"14px 20px 36px":"8px 20px var(--player-scroll-bottom-padding)"`,
  "player mobile top rhythm"
);
app = replaceOrVerify(
  app,
  `{!isDesktop&&<MobileNavigation primaryItems={playerMobilePrimaryItems} secondaryItems={playerMobileSecondaryItems} activeKey={tab} onChange={switchTab} ariaLabel="Player navigation"/>}`,
  `{!isDesktop&&<MobileNavigation primaryItems={playerMobilePrimaryItems} secondaryItems={playerMobileSecondaryItems} activeKey={tab} onChange={switchTab} onLogout={logout} ariaLabel="Player navigation"/>}`,
  "player navigation logout handoff"
);
fs.writeFileSync(appPath, app);

let nav = fs.readFileSync(navPath, "utf8");
nav = replaceOrVerify(
  nav,
  `export default function MobileNavigation({ primaryItems = [], secondaryItems = [], activeKey, onChange, ariaLabel = "Mobile navigation" }) {`,
  `export default function MobileNavigation({ primaryItems = [], secondaryItems = [], activeKey, onChange, onLogout, ariaLabel = "Mobile navigation" }) {`,
  "MobileNavigation logout prop"
);
nav = replaceOrVerify(
  nav,
  `  const handleSelect = (key) => { setOpen(false); onChange?.(key); };
  const activeMore = secondaryActive || open;`,
  `  const handleSelect = (key) => { setOpen(false); onChange?.(key); };
  const handleLogout = async () => { setOpen(false); await onLogout?.(); };
  const activeMore = secondaryActive || open;`,
  "MobileNavigation logout handler"
);
nav = replaceOrVerify(
  nav,
  `          <div className={styles.sheetGroups} data-testid="mobile-navigation-groups">
            {groupedSecondaryItems.map((group) => <section className={styles.sheetGroup} key={group.id} data-navigation-group={group.id} aria-labelledby={\`mobile-navigation-\${group.id}\`}>
              <header className={styles.groupHeader}><h3 id={\`mobile-navigation-\${group.id}\`}>{group.title}</h3><p>{group.description}</p></header>
              <div className={styles.sheetGrid}>{group.items.map((item) => <NavigationItem key={item.k} item={item} active={item.k === activeKey} onSelect={handleSelect} />)}</div>
            </section>)}
          </div>
        </section>`,
  `          <div className={styles.sheetGroups} data-testid="mobile-navigation-groups">
            {groupedSecondaryItems.map((group) => <section className={styles.sheetGroup} key={group.id} data-navigation-group={group.id} aria-labelledby={\`mobile-navigation-\${group.id}\`}>
              <header className={styles.groupHeader}><h3 id={\`mobile-navigation-\${group.id}\`}>{group.title}</h3><p>{group.description}</p></header>
              <div className={styles.sheetGrid}>{group.items.map((item) => <NavigationItem key={item.k} item={item} active={item.k === activeKey} onSelect={handleSelect} />)}</div>
            </section>)}
          </div>
          {role === "player" && onLogout && <div className={styles.sheetUtility} data-testid="mobile-navigation-account-actions">
            <button type="button" className={styles.signOutButton} data-testid="mobile-navigation-sign-out" onClick={handleLogout}>
              <span className={styles.utilityIcon} aria-hidden="true"><ShotLabIcon name="logout" size={19} /></span>
              <span><strong>Sign out</strong><small>Leave this ShotLab session</small></span>
            </button>
          </div>}
        </section>`,
  "player More sheet account action"
);
fs.writeFileSync(navPath, nav);

let css = fs.readFileSync(navCssPath, "utf8");
const utilityCss = `
.sheetUtility {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(17, 26, 33, .08);
}

.signOutButton {
  width: 100%;
  min-height: 58px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  border: 1px solid rgba(17, 26, 33, .08);
  border-radius: 16px;
  background: rgba(255, 255, 255, .58);
  color: var(--text-2, #44515b);
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 110ms ease, background 150ms ease, border-color 150ms ease;
}

.signOutButton:active {
  transform: scale(.988);
  background: rgba(255, 255, 255, .9);
}

.signOutButton:focus-visible {
  outline: 3px solid rgba(126, 158, 30, .18);
  outline-offset: 2px;
}

.utilityIcon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f1efe9;
  color: var(--text-2, #44515b);
}

.signOutButton > span:last-child {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.signOutButton strong,
.signOutButton small {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
}

.signOutButton strong {
  color: var(--text-1, #111a21);
  font-size: 14px;
  font-weight: 680;
  letter-spacing: -.014em;
}

.signOutButton small {
  color: var(--text-3, #65717a);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
}
`;
if (!css.includes(".sheetUtility {")) {
  const marker = "\n@keyframes navOverlayIn";
  if (!css.includes(marker)) throw new Error("Phase 3U CSS marker missing");
  css = css.replace(marker, `${utilityCss}${marker}`);
}
fs.writeFileSync(navCssPath, css);

console.log("Applied Phase 3U player account control consolidation.");
