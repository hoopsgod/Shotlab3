import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { savePlayerAssignment } from "../src/lib/playerAssignmentService.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("failed assignment sync stays explicitly unconfirmed", async () => {
  const storage = memoryStorage({
    "sl:session": { email: "coach@example.com", role: "coach", teamId: "team-a" },
  });
  const result = await savePlayerAssignment({
    teamId: "team-a",
    playerIdentity: "player@example.com",
    playerName: "Player One",
    assignmentText: "Repeat the form shooting block.",
    storage,
    fetchImpl: async () => ({
      ok: false,
      json: async () => ({ error: "network_unavailable" }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.localSaved, true);
  assert.equal(result.storageMode, "local_fallback");
  assert.equal(result.assignment.state, "assigned");
  assert.match(result.message, /sync failed/i);
  assert.doesNotMatch(result.message, /delivered to the player/i);
});

test("coach follow-up presents only confirmed remote delivery as delivered", () => {
  const source = fs.readFileSync(new URL("../src/lib/coachFollowUpEnhancer.js", import.meta.url), "utf8");

  assert.match(source, /const confirmedDelivery = deliveryResult\.ok \? deliveryResult\.assignment \|\| null : null/);
  assert.match(source, /if \(deliveryResult\?\.ok && deliveryResult\.assignment\) setDelivery\(deliveryResult\.assignment\)/);
  assert.match(source, /Player delivery could not be confirmed/);
  assert.match(source, /team sync and player delivery could not be confirmed/);
  assert.doesNotMatch(source, /setDelivery\(deliveryResult\.assignment \|\| null\)/);
});

test("assignment mutations use synchronous single-flight guards", () => {
  const coach = fs.readFileSync(new URL("../src/lib/coachFollowUpEnhancer.js", import.meta.url), "utf8");
  const player = fs.readFileSync(new URL("../src/components/PlayerCoachAssignmentCard.jsx", import.meta.url), "utf8");

  assert.match(coach, /if \(saveInFlightRef\.current\) return/);
  assert.match(coach, /saveInFlightRef\.current = true/);
  assert.match(coach, /saveInFlightRef\.current = false/);
  assert.match(player, /if \(!next \|\| actionInFlightRef\.current\) return/);
  assert.match(player, /actionInFlightRef\.current = true/);
  assert.match(player, /actionInFlightRef\.current = false/);
});

test("assignment mutation controls expose busy state and recover in finally", () => {
  const coach = fs.readFileSync(new URL("../src/lib/coachFollowUpEnhancer.js", import.meta.url), "utf8");
  const player = fs.readFileSync(new URL("../src/components/PlayerCoachAssignmentCard.jsx", import.meta.url), "utf8");

  assert.match(coach, /"aria-busy": saving/);
  assert.match(coach, /finally \{[\s\S]*saveInFlightRef\.current = false;[\s\S]*setSaving\(false\)/);
  assert.match(player, /aria-busy=\{busy\}/);
  assert.match(player, /finally \{[\s\S]*actionInFlightRef\.current = false;[\s\S]*setBusy\(false\)/);
});

test("team branding form meets practical touch and duplicate-submit contracts", () => {
  const source = fs.readFileSync(new URL("../src/components/team/TeamBrandingForm.jsx", import.meta.url), "utf8");

  assert.match(source, /minHeight: 44/);
  assert.doesNotMatch(source, /minHeight: (?:40|42)/);
  assert.match(source, /if \(saving \|\| cleaning \|\| submitInFlightRef\.current\) return/);
  assert.match(source, /submitInFlightRef\.current = true/);
  assert.match(source, /submitInFlightRef\.current = false/);
  assert.match(source, /aria-busy=\{saving \|\| cleaning \|\| submitting\}/);
  assert.match(source, /role="alert"/);
});

test("team branding errors stay user-facing rather than dumping raw exception text", () => {
  const source = fs.readFileSync(new URL("../src/components/team/TeamBrandingForm.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /setUploadError\(error\.message/);
  assert.match(source, /This logo could not be prepared\. Try another image or use the logo URL field\./);
  assert.match(source, /Team branding could not be saved\. Your changes are still here; try again\./);
});

test("Add Player provisioning is synchronously single-flight", () => {
  const source = fs.readFileSync(new URL("../src/components/CoachPlayerInviteForm.jsx", import.meta.url), "utf8");

  assert.match(source, /const provisionInFlightRef = useRef\(false\)/);
  assert.match(source, /if \(provisionInFlightRef\.current\) return/);
  assert.match(source, /provisionInFlightRef\.current = true/);
  assert.match(source, /finally \{[\s\S]*provisionInFlightRef\.current = false;[\s\S]*setBusy\(false\)/);
  assert.match(source, /aria-busy=\{busy \|\| undefined\}/);
});

test("Program Score save is synchronously single-flight", () => {
  const source = fs.readFileSync(new URL("../src/components/CoachProgramScoreDrawer.jsx", import.meta.url), "utf8");

  assert.match(source, /const submitInFlightRef = useRef\(false\)/);
  assert.match(source, /if \(submitInFlightRef\.current\) return/);
  assert.match(source, /submitInFlightRef\.current = true/);
  assert.match(source, /finally \{[\s\S]*submitInFlightRef\.current = false;[\s\S]*setSaving\(false\)/);
  assert.match(source, /friendlyProgramScoreError/);
});
