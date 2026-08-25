import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAYWRIGHT_PACKAGE = path.join(ROOT, 'node_modules', '@playwright', 'test', 'package.json');
const USAGE = `\nShotLab viewport debugger\n\nUsage:\n  npm run debug:viewport -- [options]\n\nOptions:\n  --role=all|coach|player       Roles to inspect (default: all)\n  --widths=320,375,390,430      Viewport widths (default: 320,375,390,430)\n  --scenario=smoke|priority     Diagnostic flow (default: smoke)\n  --base-url=https://...        Inspect an existing preview instead of local dev\n  --help                        Show this message\n\nExamples:\n  npm run debug:viewport\n  npm run debug:viewport -- --role=coach --widths=390\n  npm run debug:viewport -- --role=coach --widths=390 --scenario=priority\n  npm run debug:viewport -- --base-url=https://<exact-sha>.shotlab3.pages.dev\n`;

function readOption(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : fallback;
}

if (process.argv.includes('--help')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

if (!fs.existsSync(PLAYWRIGHT_PACKAGE)) {
  console.error('[viewport-debug] @playwright/test is not installed.');
  console.error('Run: npm install --no-save --package-lock=false @playwright/test@1.55.1');
  process.exit(2);
}

const role = readOption('role', process.env.SHOTLAB_VIEWPORT_ROLE || 'all');
const widths = readOption('widths', process.env.SHOTLAB_VIEWPORT_WIDTHS || '320,375,390,430');
const scenario = readOption('scenario', process.env.SHOTLAB_VIEWPORT_SCENARIO || 'smoke');
const baseUrl = readOption('base-url', process.env.SHOTLAB_VIEWPORT_BASE_URL || '');

if (!['all', 'coach', 'player'].includes(role)) {
  console.error(`[viewport-debug] Unsupported role: ${role}`);
  process.exit(2);
}
if (!['smoke', 'priority'].includes(scenario)) {
  console.error(`[viewport-debug] Unsupported scenario: ${scenario}`);
  process.exit(2);
}
if (scenario === 'priority' && role === 'player') {
  console.error('[viewport-debug] The priority scenario is Coach-only. Use --role=coach or --role=all.');
  process.exit(2);
}

const env = {
  ...process.env,
  SHOTLAB_VIEWPORT_ROLE: role,
  SHOTLAB_VIEWPORT_WIDTHS: widths,
  SHOTLAB_VIEWPORT_SCENARIO: scenario,
};
if (baseUrl) env.SHOTLAB_VIEWPORT_BASE_URL = baseUrl;

console.log(`[viewport-debug] role=${role} widths=${widths} scenario=${scenario}${baseUrl ? ` base=${baseUrl}` : ' base=local'}`);
const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(executable, [
  '--no-install',
  'playwright',
  'test',
  'tests/e2e/viewport-debug.spec.mjs',
  '--config=playwright.viewport-debug.config.mjs',
  '--reporter=line',
], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`[viewport-debug] Could not launch Playwright: ${result.error.message}`);
  process.exit(2);
}
process.exit(result.status ?? 1);
