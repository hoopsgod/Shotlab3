import fs from "node:fs";

function replaceExact(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 occurrence, found ${count}`);
  return source.replace(from, to);
}

const path = "src/App.jsx";
let source = fs.readFileSync(path, "utf8");

source = replaceExact(source,
`const onLoadDemoData=async()=>{
if(demoSettingsBusy)return;`,
`const onLoadDemoData=async()=>{
const resetPermission=requireAccountCapability(accountCapabilities,"canResetSandbox");
if(!resetPermission.ok)return resetPermission;
if(demoSettingsBusy)return;`,
"load demo guard");

source = replaceExact(source,
`const onClearDemoData=async()=>{
if(demoSettingsBusy)return;`,
`const onClearDemoData=async()=>{
const resetPermission=requireAccountCapability(accountCapabilities,"canResetSandbox");
if(!resetPermission.ok)return resetPermission;
if(demoSettingsBusy)return;`,
"clear demo guard");

source = replaceExact(source,
`coachTextSize={coachTextSize} demoSettingsBusy={demoSettingsBusy} onLoadDemoData={onLoadDemoData}`,
`coachTextSize={coachTextSize} accountCapabilities={accountCapabilities} demoSettingsBusy={demoSettingsBusy} onLoadDemoData={onLoadDemoData}`,
"coach capability prop");

source = replaceExact(source,
`coachTextSize="standard",demoSettingsBusy=false,onLoadDemoData,onClearDemoData,homeShotsLeaderboard,refreshHomeShotsLeaderboard}){`,
`coachTextSize="standard",accountCapabilities, demoSettingsBusy=false,onLoadDemoData,onClearDemoData,homeShotsLeaderboard,refreshHomeShotsLeaderboard}){`,
"coach capability signature");

source = replaceExact(source,
`        <article className="coachAdministrationCard">
          <span>Demo workspace</span><h3>DEMO SETTINGS</h3><p>Load or clear demo data using the shared demo tools.</p>
          <div className="coachAdministrationActions">
            <button onClick={onLoadDemoData} disabled={demoSettingsBusy} className="btn-v cta-secondary">LOAD DEMO DATA</button>
            <button onClick={onClearDemoData} disabled={demoSettingsBusy} className="btn-v cta-danger">CLEAR DEMO DATA</button>
          </div>
        </article>`,
`        {accountCapabilities?.canResetSandbox&&<article className="coachAdministrationCard">
          <span>Demo workspace</span><h3>DEMO SETTINGS</h3><p>Load or clear demo data using the shared demo tools.</p>
          <div className="coachAdministrationActions">
            <button onClick={onLoadDemoData} disabled={demoSettingsBusy} className="btn-v cta-secondary">LOAD DEMO DATA</button>
            <button onClick={onClearDemoData} disabled={demoSettingsBusy} className="btn-v cta-danger">CLEAR DEMO DATA</button>
          </div>
        </article>}`,
"demo settings visibility");

if ((source.match(/requireAccountCapability\(accountCapabilities,"canResetSandbox"\)/g) || []).length !== 2) throw new Error("sandbox reset actions are not both capability guarded");
if (!source.includes("accountCapabilities?.canResetSandbox&&<article")) throw new Error("demo settings UI is not capability gated");
fs.writeFileSync(path, source);
console.log("Protected demo reset controls from registered tenants.");
