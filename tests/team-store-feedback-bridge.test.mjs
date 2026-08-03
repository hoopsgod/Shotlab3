import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Team Store mounts the shared feedback layer and verified persistence bridge", async () => {
  const entry = await read("src/teamStoreEntry.jsx");
  assert.match(entry, /<AppFeedbackLayer \/>/);
  assert.match(entry, /<TeamStoreFeedbackBridge \/>/);
  assert.match(entry, /<TeamStorePortal \/>/);
});

test("Team Store feedback is emitted only after storage success and preserves failure propagation", async () => {
  const source = await read("src/components/TeamStoreFeedbackBridge.jsx");
  assert.match(source, /await bridge\.originalWindowStorageSet\.call/);
  assert.match(source, /announcePersisted\(key\)/);
  assert.match(source, /announceFailure\(key, error\)/);
  assert.match(source, /throw error/);
  assert.match(source, /TEAM_STORE_STORAGE_KEY/);
  assert.match(source, /TEAM_STORE_REFERRALS_KEY/);
  assert.match(source, /Nothing has been confirmed/);
});

test("Team Store feedback bridge avoids duplicate managed writes and restores patched APIs", async () => {
  const source = await read("src/components/TeamStoreFeedbackBridge.jsx");
  assert.match(source, /managedWriteDepth/);
  assert.match(source, /references/);
  assert.match(source, /storageApi\.set = bridge\.wrappedWindowStorageSet/);
  assert.match(source, /storagePrototype\.setItem = bridge\.wrappedLocalSetItem/);
  assert.match(source, /window\.storage\.set = bridge\.originalWindowStorageSet/);
  assert.match(source, /window\.Storage\.prototype\.setItem = bridge\.originalLocalSetItem/);
  assert.doesNotMatch(source, /fetch\(|supabase|XMLHttpRequest/);
});
