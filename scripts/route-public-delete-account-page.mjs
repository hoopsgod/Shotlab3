import fs from "node:fs";

// Branch-only deterministic integration. Removed before review readiness.
const path = "src/App.jsx";
let source = fs.readFileSync(path, "utf8");

const helperAnchor = 'const getLegalRouteKey=(path)=>LEGAL_ROUTES[String(path||"").replace(/\\\/$/,"")||"/"]||null;\n';
const helperReplacement = `${helperAnchor}const hasStoredShotLabSession=()=>{\nif(typeof window==="undefined")return false;\ntry{\nconst raw=window.localStorage?.getItem("sl:session");\nif(!raw)return false;\nconst session=JSON.parse(raw);\nreturn Boolean(session?.email&&session?.role);\n}catch(error){return false;}\n};\n`;
if (!source.includes(helperAnchor)) throw new Error("Legal route helper anchor missing.");
source = source.replace(helperAnchor, helperReplacement);

const routeAnchor = 'const legalRouteKey=typeof window!=="undefined"?getLegalRouteKey(window.location.pathname):null;\n';
const routeReplacement = `${routeAnchor}const shouldRenderPublicLegalPage=Boolean(legalRouteKey&&(legalRouteKey!=="delete-account"||!hasStoredShotLabSession()));\n`;
if (!source.includes(routeAnchor)) throw new Error("App legal route anchor missing.");
source = source.replace(routeAnchor, routeReplacement);

const returnAnchor = 'if(legalRouteKey&&legalRouteKey!=="delete-account")return <StaticLegalPage pageKey={legalRouteKey}/>;\n';
const returnReplacement = 'if(shouldRenderPublicLegalPage)return <StaticLegalPage pageKey={legalRouteKey}/>;\n';
if (!source.includes(returnAnchor)) throw new Error("Public legal page return anchor missing.");
source = source.replace(returnAnchor, returnReplacement);

fs.writeFileSync(path, source);
console.log("Signed-out delete-account route now renders the public legal page while stored sessions retain the in-app flow.");
