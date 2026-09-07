import test from 'node:test';
import assert from 'node:assert/strict';

import { supabase, __testUtils } from '../src/lib/supabase.js';

const makeStorage = (entries = []) => {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
};

const restoreGlobal = (key, value) => {
  if (value === undefined) delete globalThis[key];
  else globalThis[key] = value;
};

test('app-table writes stay local until a persistence identity exists', async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const storage = makeStorage();
  let fetchCalls = 0;

  globalThis.window = { localStorage: storage };
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('unexpected network call');
  };

  try {
    assert.equal(__testUtils.hasAuthenticatedPersistenceSession(), false);

    const result = await supabase.from('rsvps').upsert([{ id: 'rsvp-pre-auth' }]);

    assert.equal(result.error, null);
    assert.equal(result.skipped, 'unauthenticated_local_only');
    assert.equal(fetchCalls, 0);
  } finally {
    restoreGlobal('window', originalWindow);
    restoreGlobal('fetch', originalFetch);
  }
});

test('registered app or Supabase auth state unlocks the existing remote persistence path', () => {
  const originalWindow = globalThis.window;
  const storage = makeStorage();
  globalThis.window = { localStorage: storage };

  try {
    storage.setItem('sl:session', JSON.stringify({ email: 'coach@example.com' }));
    assert.equal(__testUtils.hasAuthenticatedPersistenceSession(), true);

    storage.removeItem('sl:session');
    storage.setItem('sl:supabase-session', JSON.stringify({ access_token: 'test-token' }));
    assert.equal(__testUtils.hasAuthenticatedPersistenceSession(), true);
  } finally {
    restoreGlobal('window', originalWindow);
  }
});

test('demo-local persistence keeps precedence over the pre-auth guard', async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const storage = makeStorage([
    ['sl:session', JSON.stringify({ email: 'coach.demo@shotlab.app' })],
  ]);
  let fetchCalls = 0;

  globalThis.window = { localStorage: storage };
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('unexpected network call');
  };

  try {
    const result = await supabase.from('rsvps').upsert([{ id: 'demo-rsvp' }]);

    assert.equal(result.error, null);
    assert.equal(result.skipped, 'demo_local_only');
    assert.equal(fetchCalls, 0);
  } finally {
    restoreGlobal('window', originalWindow);
    restoreGlobal('fetch', originalFetch);
  }
});
