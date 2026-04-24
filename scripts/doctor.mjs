#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import net from 'node:net';

const root = process.cwd();
const envPath = path.join(root, '.env');

function log(status, message) {
  const prefix = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  console.log(`${prefix} ${message}`);
}

function parseEnvFile(content) {
  const values = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }
  return values;
}

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

const [major] = process.versions.node.split('.').map(Number);
if (major >= 18) {
  log('ok', `Node.js ${process.versions.node} detected (>= 18 required).`);
} else {
  log('bad', `Node.js ${process.versions.node} detected. Upgrade to Node 18+.`);
}

if (fs.existsSync(path.join(root, 'node_modules', 'vite'))) {
  log('ok', 'Dependencies are installed (node_modules/vite found).');
} else {
  log('bad', 'Dependencies missing. Run: npm install');
}

if (!fs.existsSync(envPath)) {
  log('warn', '.env file not found. The app still opens, but backend calls will fail until Supabase vars are set.');
} else {
  const envValues = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
  const url = envValues.VITE_SUPABASE_URL;
  const key = envValues.VITE_SUPABASE_ANON_KEY;

  if (url) {
    try {
      new URL(url);
      log('ok', 'VITE_SUPABASE_URL is set and valid URL format.');
    } catch {
      log('bad', 'VITE_SUPABASE_URL is set but not a valid URL.');
    }
  } else {
    log('warn', 'VITE_SUPABASE_URL is missing in .env.');
  }

  if (key) {
    log('ok', 'VITE_SUPABASE_ANON_KEY is set.');
  } else {
    log('warn', 'VITE_SUPABASE_ANON_KEY is missing in .env.');
  }
}

const port = 4173;
const available = await checkPortAvailable(port);
if (available) {
  log('ok', `Port ${port} is available.`);
} else {
  log('bad', `Port ${port} is already in use. Stop the other process or choose a different port.`);
}

console.log('\nRecommended startup command for container/remote environments:');
console.log('  npm run dev:agent');
console.log('Then open: http://localhost:4173/');
