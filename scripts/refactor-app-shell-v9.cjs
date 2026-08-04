const fs = require('node:fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const appPath = 'src/App.jsx';
const original = fs.readFileSync(appPath, 'utf8');

if (original.includes('import Auth from "./components/AuthWorkspace.jsx";')) {
  console.log('App shell v9 extraction is already applied.');
  process.exit(0);
}

let appSource = original;
const ast = parser.parse(original, {
  sourceType: 'module',
  plugins: ['jsx'],
});

const styleNames = [
  '_STYLES_CSS',
  '_PAGE_SIGNATURE_CSS',
  '_DESKTOP_SHELL_CSS',
  '_PLAYER_COMPACT_DASHBOARD_CSS',
];
const styleNameSet = new Set(styleNames);
const styleNodes = [];
const functionNodes = new Map();

traverse(ast, {
  VariableDeclaration(path) {
    if (path.node.declarations.some((declaration) => styleNameSet.has(declaration.id?.name))) {
      styleNodes.push(path.node);
    }
  },
  FunctionDeclaration(path) {
    const name = path.node.id?.name;
    if (['Auth', 'SLLogo', 'BrandWordmark', 'BrandBackdrop'].includes(name)) {
      functionNodes.set(name, path.node);
    }
  },
});

if (styleNodes.length !== 4 || functionNodes.size !== 4) {
  throw new Error(`Unexpected App shell structure: styles=${styleNodes.length}, functions=${functionNodes.size}`);
}

const legacyStyleSource = `${styleNodes
  .slice()
  .sort((a, b) => a.start - b.start)
  .map((node) => original.slice(node.start, node.end).replace(/^const /, 'export const '))
  .join('\n\n')}\n`;

const brandSource = `import { useTeamBranding } from "../context/TeamBrandingContext";\nimport TOKENS from "../theme/appTokens";\n\nconst LIGHT = TOKENS.TEXT_PRIMARY;\nconst FD = "'Bebas Neue','Impact','Arial Black',sans-serif";\n\n${[
  'SLLogo',
  'BrandWordmark',
  'BrandBackdrop',
]
  .map((name) => original
    .slice(functionNodes.get(name).start, functionNodes.get(name).end)
    .replace(/^function /, 'export function '))
  .join('\n\n')}\n`;

let authSource = original.slice(functionNodes.get('Auth').start, functionNodes.get('Auth').end);
authSource = authSource.replace(
  /^function Auth\(\{onLogin,onRegister,onDemo,onCreateJoinContext,accountNotice="",onClearAccountNotice=\(\)=>\{\}\}\)\{/,
  'export default function Auth({runtime,onLogin,onRegister,onDemo,onCreateJoinContext,accountNotice="",onClearAccountNotice=()=>{}}){\nconst {BG,BORDER_CLR,CARD_BG,CourtBG,DEMO_COACH,DEMO_PLAYER,DrillIcon,FB,FD,GlowOrb,LIGHT,LegalSupportLinks,MUTED,ORANGE,SLLogo,TOKENS,VOLT}=runtime;',
);

if (!authSource.startsWith('export default function Auth')) {
  throw new Error('Auth workspace signature was not extracted.');
}

const removals = [...styleNodes, ...functionNodes.values()].sort((a, b) => b.start - a.start);
for (const node of removals) {
  appSource = appSource.slice(0, node.start) + appSource.slice(node.end);
}

const importAnchor = 'import PlayersScreen from "./screens/PlayersScreen";';
const extractedImports = `import Auth from "./components/AuthWorkspace.jsx";\nimport { BrandBackdrop, BrandWordmark, SLLogo } from "./components/ShotLabBrand.jsx";\nimport { _DESKTOP_SHELL_CSS, _PAGE_SIGNATURE_CSS, _PLAYER_COMPACT_DASHBOARD_CSS, _STYLES_CSS } from "./styles/appLegacyStyles.js";\n\n${importAnchor}`;

if (!appSource.includes(importAnchor)) {
  throw new Error('App import anchor is missing.');
}
appSource = appSource.replace(importAnchor, extractedImports);
appSource = appSource.replace(
  'import { TeamBrandingProvider, useTeamBranding } from "./context/TeamBrandingContext";',
  'import { TeamBrandingProvider } from "./context/TeamBrandingContext";',
);

const authRuntime = `const AUTH_WORKSPACE_RUNTIME=Object.freeze({\n  BG,\n  BORDER_CLR,\n  CARD_BG,\n  CourtBG,\n  DEMO_COACH,\n  DEMO_PLAYER,\n  DrillIcon,\n  FB,\n  FD,\n  GlowOrb,\n  LIGHT,\n  LegalSupportLinks,\n  MUTED,\n  ORANGE,\n  SLLogo,\n  TOKENS,\n  VOLT,\n});\n\n`;
const appAnchor = 'export default function App(){';
if (!appSource.includes(appAnchor)) {
  throw new Error('App component anchor is missing.');
}
appSource = appSource.replace(appAnchor, `${authRuntime}${appAnchor}`);

const authRender = '<Auth onLogin={login}';
if (!appSource.includes(authRender)) {
  throw new Error('Auth route render anchor is missing.');
}
appSource = appSource.replace(
  authRender,
  '<Auth runtime={AUTH_WORKSPACE_RUNTIME} onLogin={login}',
);

fs.writeFileSync(appPath, appSource);
fs.writeFileSync('src/styles/appLegacyStyles.js', legacyStyleSource);
fs.writeFileSync('src/components/ShotLabBrand.jsx', brandSource);
fs.writeFileSync(
  'src/components/AuthWorkspace.jsx',
  `import { useState } from "react";\n\n${authSource}\n`,
);

const appBytes = Buffer.byteLength(appSource);
if (appBytes >= 500000) {
  throw new Error(`App.jsx remains above the 500 KB threshold: ${appBytes} bytes.`);
}

console.log(`App shell extraction complete: ${appBytes} bytes.`);
