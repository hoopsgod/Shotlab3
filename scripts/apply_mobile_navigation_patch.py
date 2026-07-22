from pathlib import Path

path = Path("src/App.jsx")
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    if new in text:
        print(f"{label}: already applied")
        return
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    text = text.replace(old, new, 1)
    print(f"{label}: applied")


def insert_before_after(start_marker: str, before_marker: str, insertion: str, label: str) -> None:
    global text
    if insertion.strip() in text:
        print(f"{label}: already applied")
        return
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"{label}: start marker missing")
    before = text.find(before_marker, start)
    if before < 0:
        raise SystemExit(f"{label}: insertion marker missing")
    text = text[:before] + insertion + text[before:]
    print(f"{label}: applied")


replace_once(
    'import { DominantObjectiveCard, MetricStrip, ProgressiveDisclosure, QuietSection } from "./components/VisualHierarchy.jsx";\n',
    'import { DominantObjectiveCard, MetricStrip, ProgressiveDisclosure, QuietSection } from "./components/VisualHierarchy.jsx";\nimport MobileNavigation from "./components/MobileNavigation.jsx";\n',
    "mobile navigation import",
)

replace_once(
    'const PLAYER_TAB_PATHS={home:"/",duels:"/program-log","log-drill":"/quick-menu",sc:"/lifting",program:"/events",profile:"/profile",players:"/players"};',
    'const PLAYER_TAB_PATHS={home:"/",duels:"/program-log","log-drill":"/quick-menu",sc:"/lifting",program:"/events",leaderboards:"/leaderboards",profile:"/profile",players:"/players"};',
    "leaderboards outbound route",
)
replace_once(
    'const PLAYER_PATH_TABS={"/":"home","/duels":"duels","/program-log":"duels","/quick-menu":"log-drill","/lifting":"sc","/events":"program","/profile":"profile","/players":"players"};',
    'const PLAYER_PATH_TABS={"/":"home","/duels":"duels","/program-log":"duels","/quick-menu":"log-drill","/lifting":"sc","/events":"program","/leaderboards":"leaderboards","/profile":"profile","/players":"players"};',
    "leaderboards inbound route",
)

player_mobile_definitions = r'''
const getPlayerNavItem=(key,overrides={})=>{const item=playerNavItems.find(candidate=>candidate.k===key);return item?{...item,...overrides}:null;};
const playerMobilePrimaryItems=[
  getPlayerNavItem("home",{mobileLabel:"Home"}),
  getPlayerNavItem("log-drill",{mobileLabel:"At Home"}),
  getPlayerNavItem("duels",{mobileLabel:"Program"}),
].filter(Boolean);
const playerMobileSecondaryItems=[
  getPlayerNavItem("program",{mobileLabel:"Events",description:"Team schedule and RSVPs"}),
  getPlayerNavItem("sc",{mobileLabel:"Lifting",description:"Strength and conditioning"}),
  {k:"leaderboards",l:"Leaderboards",mobileLabel:"Rankings",description:"Current and all-time team rankings",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>},
  getPlayerNavItem("profile",{mobileLabel:"Profile",description:"Progress, settings, and account"}),
].filter(Boolean);
'''
insert_before_after(
    "const playerNavItems=[",
    '\n\nreturn <div className={`app-shell ${isDesktop?"is-desktop":"is-mobile"}`}>',
    player_mobile_definitions,
    "player mobile navigation model",
)

replace_once(
    '  <button type="button" aria-label="Profile" onClick={()=>switchTab("profile")} style={{minHeight:34,padding:"0 2px",border:0,background:"transparent",color:T.SUB,fontFamily:FB,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Profile</button>',
    '  {isDesktop&&<button type="button" aria-label="Profile" onClick={()=>switchTab("profile")} style={{minHeight:34,padding:"0 2px",border:0,background:"transparent",color:T.SUB,fontFamily:FB,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Profile</button>}',
    "quiet mobile profile shortcut",
)
replace_once(
    '{!isDesktop&&<NavBar items={playerNavItems} active={tab} onChange={switchTab}/>} ',
    '{!isDesktop&&<MobileNavigation primaryItems={playerMobilePrimaryItems} secondaryItems={playerMobileSecondaryItems} activeKey={tab} onChange={switchTab} ariaLabel="Player navigation"/>} ',
    "player mobile navigation render",
)

coach_mobile_definitions = r'''
const getCoachNavItem=(key,overrides={})=>{const item=navItems.find(candidate=>candidate.k===key);return item?{...item,...overrides}:null;};
const coachMobilePrimaryItems=[
  getCoachNavItem("feed",{mobileLabel:"Home"}),
  getCoachNavItem("players",{mobileLabel:"Players"}),
  getCoachNavItem("events",{mobileLabel:"Events"}),
].filter(Boolean);
const coachMobileSecondaryItems=[
  getCoachNavItem("drills",{mobileLabel:"Drills",description:"Drill library and assignments"}),
  getCoachNavItem("sc",{mobileLabel:"S&C",description:"Strength sessions and compliance"}),
  {k:"leaderboards",l:"Leaderboards",mobileLabel:"Rankings",description:"Current and all-time team rankings",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>},
  getCoachNavItem("branding",{mobileLabel:"Brand",description:"Team identity and visual settings"}),
].filter(Boolean);
'''
insert_before_after(
    "const navItems=[",
    "\nconst handleNavChange=(k)=>",
    coach_mobile_definitions,
    "coach mobile navigation model",
)

replace_once(
    '{!isDesktop&&<NavBar items={navItems} active={tab} onChange={handleNavChange}/>}\n',
    '{!isDesktop&&<MobileNavigation primaryItems={coachMobilePrimaryItems} secondaryItems={coachMobileSecondaryItems} activeKey={tab} onChange={handleNavChange} ariaLabel="Coach navigation"/>}\n',
    "coach mobile navigation render",
)

old_padding = 'paddingBottom:isDesktop?0:"var(--bottom-nav-content-padding, calc(132px + env(safe-area-inset-bottom, 0px)))"'
new_padding = 'paddingBottom:isDesktop?0:"calc(var(--bottom-nav-content-padding, 88px) + env(safe-area-inset-bottom, 0px))"'
count = text.count(old_padding)
if count == 0 and text.count(new_padding) == 2:
    print("mobile content padding: already applied")
elif count == 2:
    text = text.replace(old_padding, new_padding)
    print("mobile content padding: applied")
else:
    raise SystemExit(f"mobile content padding: expected two matches, found {count}")

replace_once(
    '.player-scroll-container{--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 132px) + 28px + env(safe-area-inset-bottom, 0px));',
    '.player-scroll-container{--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 88px) + 24px + env(safe-area-inset-bottom, 0px));',
    "player scroll padding",
)
replace_once(
    '.player-scroll-container{--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 156px) + 40px + env(safe-area-inset-bottom, 0px));}',
    '.player-scroll-container{--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 88px) + 24px + env(safe-area-inset-bottom, 0px));}',
    "narrow player scroll padding",
)

path.write_text(text)
print("mobile navigation patch complete")
