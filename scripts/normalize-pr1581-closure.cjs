const fs = require("node:fs");

const path = "scripts/patch-pr1581-stabilization.cjs";
let source = fs.readFileSync(path, "utf8");

const importNeedle = `once('import MobileNavigation from "./components/MobileNavigation.jsx";','import MobileNavigation from "./components/MobileNavigation.jsx";\\nimport ShotLabIcon from "./components/ShotLabIcon.jsx";','shared icon import');`;
const importReplacement = `if(!app.includes('import ShotLabIcon from "./components/ShotLabIcon.jsx";')) once('import MobileNavigation from "./components/MobileNavigation.jsx";','import MobileNavigation from "./components/MobileNavigation.jsx";\\nimport ShotLabIcon from "./components/ShotLabIcon.jsx";','shared icon import');`;
if (!source.includes(importNeedle)) throw new Error("missing shared icon import patch");
source = source.replace(importNeedle, importReplacement);

const navStart = source.indexOf("const navStart=app.indexOf('const navItems=[')");
const navEnd = source.indexOf("once('data-accent=", navStart);
if (navStart < 0 || navEnd < 0) throw new Error("missing coach nav patch block");
const navReplacement = `if(!app.includes('const navItems=[[')){\n  const navStart=app.indexOf('const navItems=['),navEnd=app.indexOf('];\\nconst getCoachNavItem',navStart)+2;\n  if(navStart<0||navEnd<2)throw new Error('missing coach nav items');\n  const compactNav='const navItems=[["feed","Feed","home"],["drills","Drills","training"],["events","Events","calendar"],["sc","S&C","strength"],["players","Players","team"],["activity","Activity","activity"],["leaderboards","Leaderboards","chart"],["in-season","In Season","momentum"],["settings","Team & Account","settings"],["team-store","Team Store","store"],["branding","Brand","verified"]].map(([k,l,icon])=>({k,l,icon,mobileIcon:icon}));';\n  app=app.slice(0,navStart)+compactNav+app.slice(navEnd);\n}\nif(app.includes('{item.svg}<span>{item.l}</span>')) once('{item.svg}<span>{item.l}</span>','<ShotLabIcon name={item.icon} size={22}/><span>{item.l}</span>','sidebar shared icon render');\n`;
source = source.slice(0, navStart) + navReplacement + source.slice(navEnd);

fs.writeFileSync(path, source);
console.log("PR 1581 closure patch normalized for current icon-dedupe head");
