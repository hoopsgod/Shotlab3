import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const deploymentDocs = fs.readFileSync(new URL('../docs/cloudflare-production-deployment.md', import.meta.url), 'utf8');

test('production Cloudflare deploy path is Pages, not a standalone Worker', () => {
  const deployScript = packageJson.scripts?.['deploy:cloudflare'] || '';

  assert.match(deployScript, /npm run build/);
  assert.match(deployScript, /wrangler pages deploy dist --project-name shotlab3/);
  assert.doesNotMatch(deployScript, /wrangler deploy(\s|$)/);
  assert.equal(fs.existsSync(new URL('../wrangler.toml', import.meta.url)), false);
});

test('Cloudflare runtime routes are Pages Functions deployed with Pages', () => {
  assert.equal(fs.existsSync(new URL('../functions/v1/leaderboards/home-shots.js', import.meta.url)), true);
  assert.equal(fs.existsSync(new URL('../functions/v1/home-shots/log.js', import.meta.url)), true);
});


test('deployment docs tell reviewers to disable stale standalone Workers checks', () => {
  assert.match(deploymentDocs, /Cloudflare Pages/);
  assert.match(deploymentDocs, /wrangler pages deploy dist --project-name shotlab3/);
  assert.match(deploymentDocs, /standalone Workers deployment\/status check is therefore stale PR noise/);
  assert.match(deploymentDocs, /disconnect or disable the stale standalone Workers deployment integration/);
  assert.match(deploymentDocs, /remove the stale Workers status check from required checks/);
});
