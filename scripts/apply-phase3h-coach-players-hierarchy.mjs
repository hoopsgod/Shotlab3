import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3h-coach-players] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};
const replaceOne = (source, before, after, label) => {
  requireOne(source, before, label);
  return source.replace(before, after);
};

const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');

if (source.includes('data-testid="coach-player-account-activation"')) {
  for (const marker of [
    'data-testid="coach-player-season-tools"',
    'data-testid="coach-player-roster-management"',
    'coach-player-management-disclosure',
    'setSelectedSeasonArchiveId(archiveId);setSelP(null);setTimeout',
  ]) {
    if (!source.includes(marker)) fail(`transformed Coach Players source is missing ${marker}`);
  }
  console.log('Phase 3H Coach Players hierarchy already applied.');
  process.exit(0);
}

source = replaceOne(
  source,
  'onAddPlayer={()=>document.getElementById("coach-add-player-form")?.scrollIntoView({behavior:"smooth",block:"start"})} onOpenArchives={()=>document.getElementById("coach-season-tools")?.scrollIntoView({behavior:"smooth",block:"start"})}',
  'onAddPlayer={()=>{const disclosure=document.getElementById("coach-player-account-activation");if(disclosure)disclosure.open=true;setTimeout(()=>document.getElementById("coach-add-player-form")?.scrollIntoView({behavior:"smooth",block:"start"}),0);}} onOpenArchives={()=>{const disclosure=document.getElementById("coach-player-season-tools");if(disclosure)disclosure.open=true;setTimeout(()=>document.getElementById("coach-season-tools")?.scrollIntoView({behavior:"smooth",block:"start"}),0);}}',
  'Players command actions',
);

const inviteStart = '<DashboardSection eyebrow="Account activation" title="Add a player" summary="Create the roster relationship and send a secure account setup invitation." action={{label:"View roster",onClick:()=>document.getElementById("coach-roster-operations")?.scrollIntoView({behavior:"smooth",block:"start"})}} testId="coach-player-invite-dashboard-section"><div id="coach-add-player-form">';
const inviteReplacement = `<details id="coach-player-account-activation" className="coach-player-management-disclosure" data-testid="coach-player-account-activation">
  <summary className="coach-player-management-summary">
    <span className="coach-player-management-summary-copy"><span className="coach-player-management-kicker">ACCOUNT ACTIVATION</span><strong>Add a player</strong><small>Create the roster relationship and send a secure setup invitation.</small></span>
    <span className="coach-player-management-chevron" aria-hidden="true">⌄</span>
  </summary>
  <div className="coach-player-management-body">
<DashboardSection eyebrow="Account activation" title="Add a player" summary="Create the roster relationship and send a secure account setup invitation." action={{label:"View roster",onClick:()=>{const disclosure=document.getElementById("coach-player-roster-management");if(disclosure)disclosure.open=true;setTimeout(()=>document.getElementById("coach-roster-operations")?.scrollIntoView({behavior:"smooth",block:"start"}),0);}}} testId="coach-player-invite-dashboard-section"><div id="coach-add-player-form">`;
source = replaceOne(source, inviteStart, inviteReplacement, 'account activation start');

source = replaceOne(
  source,
  '</div></DashboardSection>\n\n  <CoachSeasonComparisonPanel',
  `</div></DashboardSection>
  </div>
</details>

<details id="coach-player-season-tools" className="coach-player-management-disclosure" data-testid="coach-player-season-tools">
  <summary className="coach-player-management-summary">
    <span className="coach-player-management-summary-copy"><span className="coach-player-management-kicker">HISTORICAL OPERATIONS</span><strong>Season tools</strong><small>{seasonArchives.length} archived seasons · comparison, archive, and season setup.</small></span>
    <span className="coach-player-management-chevron" aria-hidden="true">⌄</span>
  </summary>
  <div className="coach-player-management-body">
  <CoachSeasonComparisonPanel`,
  'account activation to season tools boundary',
);

source = replaceOne(
  source,
  '      />\n    </div>\n    <div id="coach-roster-operations" className="coachDashboardOperationalContent">',
  `      />
    </div>
  </div>
</details>

<details id="coach-player-roster-management" className="coach-player-management-disclosure" data-testid="coach-player-roster-management">
  <summary className="coach-player-management-summary">
    <span className="coach-player-management-summary-copy"><span className="coach-player-management-kicker">ROSTER OPERATIONS</span><strong>Roster & player management</strong><small>{filteredCoachRosterPlayers.length} visible players · status, removal, archive, and profiles.</small></span>
    <span className="coach-player-management-chevron" aria-hidden="true">⌄</span>
  </summary>
  <div className="coach-player-management-body">
    <div id="coach-roster-operations" className="coachDashboardOperationalContent">`,
  'season tools to roster management boundary',
);

source = replaceOne(
  source,
  '        </div>})}\n    </div>\n    {/* Account management — required by App Store §5.1.1(v) */}',
  `        </div>})}
    </div>
  </div>
</details>
    {/* Account management — required by App Store §5.1.1(v) */}`,
  'roster management to account management boundary',
);

source = replaceOne(
  source,
  'viewerRole="coach" onOpenArchive={(archiveId)=>{setSelectedSeasonArchiveId(archiveId);setSelP(null);}}',
  'viewerRole="coach" onOpenArchive={(archiveId)=>{setSelectedSeasonArchiveId(archiveId);setSelP(null);setTimeout(()=>{const disclosure=document.getElementById("coach-player-season-tools");if(disclosure)disclosure.open=true;setTimeout(()=>document.getElementById("coach-season-tools")?.scrollIntoView({behavior:"smooth",block:"start"}),0);},0);}}',
  'career archive to Season Tools transition',
);

for (const preserved of [
  '<CoachPlayerInviteForm',
  '<CoachSeasonComparisonPanel',
  'data-testid="coach-season-archive"',
  '<NewSeasonWizard',
  '<CoachRoster',
  't="PLAYER DETAILS"',
  'onRemovePlayer={removeRosterPlayer}',
  'onSelectPlayer={openPlayerIntelligence}',
  'Account management — required by App Store §5.1.1(v)',
]) {
  if (!source.includes(preserved)) fail(`Coach Players capability removed: ${preserved}`);
}

for (const id of ['coach-player-account-activation', 'coach-player-season-tools', 'coach-player-roster-management']) {
  if ((source.match(new RegExp(`data-testid="${id}"`, 'g')) || []).length !== 1) fail(`${id} must render exactly once`);
}

writeFileSync(path, source);
console.log('Applied Phase 3H Coach Players management hierarchy.');
