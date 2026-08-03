import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared feedback layer exposes accessible success error and dismiss behavior", async () => {
  const source = await read("src/components/AppFeedbackLayer.jsx");
  assert.match(source, /shotlab:feedback/);
  assert.match(source, /aria-live=/);
  assert.match(source, /role=\{feedback\.tone === "error" \? "alert" : "status"\}/);
  assert.match(source, /Dismiss notification/);
  assert.match(source, /tone: \["success", "error", "info"\]/);
});

test("feedback styling uses restrained motion mobile safe areas and accessibility preferences", async () => {
  const css = await read("src/components/AppFeedbackLayer.css");
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-reduced-transparency: reduce/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(css, /confetti|bounce|infinite/);
});

test("branding workflow reports verified save success and recoverable failure without changing persistence authority", async () => {
  const source = await read("src/screens/CoachTeamBrandingScreen.jsx");
  assert.match(source, /await onSave\?\.\(next\)/);
  assert.match(source, /Team identity saved/);
  assert.match(source, /Branding was not saved/);
  assert.match(source, /aria-busy=\{saving\}/);
  assert.match(source, /Saving changes…/);
  assert.match(source, /finally \{\s*setSaving\(false\)/s);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|supabase/);
});
