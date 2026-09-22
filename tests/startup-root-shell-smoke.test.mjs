import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('root app shell bootstrap is wired for startup render', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /<div id="root">[\s\S]*<\/div>/);
  assert.match(html, /<script type="module" src="\/src\/main\.jsx"><\/script>/);

  const main = fs.readFileSync('src/main.jsx', 'utf8');
  assert.match(main, /ReactDOM\.createRoot\(rootEl\)\.render\(/);
  assert.match(main, /<App \/>/);
  assert.match(main, /window\.addEventListener\('shotlab:app-ready', onAppReady, \{ once: true \}\)/);
});
