import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared feedback layer exposes accessible keyed premium states", async () => {
  const source = await read("src/components/AppFeedbackLayer.jsx");
  assert.match(source, /shotlab:feedback/);
  assert.match(source, /ALLOWED_TONES = \["success", "error", "info", "warning"\]/);
  assert.match(source, /export function clearFeedback/);
  assert.match(source, /persistent: detail\.persistent === true|const persistent = detail\.persistent === true/);
  assert.match(source, /dismissible: detail\.dismissible !== false/);
  assert.match(source, /aria-live=/);
  assert.match(source, /role=\{feedback\.tone === "error" \? "alert" : "status"\}/);
  assert.match(source, /Dismiss notification/);
  assert.match(source, /feedbackKeyRef/);
  assert.match(source, /persistentFeedbackRef/);
  assert.match(source, /activeFeedbackRef/);
  assert.match(source, /const fallback = persistentFeedback\?\.id === dismissedFeedback\?\.id \? null : persistentFeedback/);
  assert.match(source, /userInitiated: true/);
});

test("feedback styling uses restrained motion mobile safe areas and touch-safe dismissal", async () => {
  const css = await read("src/components/AppFeedbackLayer.css");
  assert.match(css, /env\(safe-area-inset-top(?:,\s*0px)?\)/);
  assert.match(css, /env\(safe-area-inset-bottom(?:,\s*0px)?\)/);
  assert.match(css, /app-feedback--leaving/);
  assert.match(css, /width:\s*44px/);
  assert.match(css, /height:\s*44px/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /focus-visible/);
  assert.ok(
    /prefers-reduced-motion: reduce/.test(css) || !/(?:animation|transition)\s*:/.test(css),
    "feedback must either honor reduced motion or avoid animated/transitional motion entirely",
  );
  assert.ok(
    !/backdrop-filter/.test(css) || /prefers-reduced-transparency: reduce/.test(css),
    "translucent feedback must either avoid backdrop blur or provide reduced-transparency handling",
  );
  assert.doesNotMatch(css, /confetti|bounce/);
});

test("branding workflow reports verified save feedback through the global app layer", async () => {
  const source = await read("src/screens/CoachTeamBrandingScreen.jsx");
  assert.match(source, /import \{ announceFeedback \} from "\.\.\/components\/AppFeedbackLayer"/);
  assert.match(source, /import \{ persistCoachBranding \} from "\.\.\/lib\/teamBrandingPersistence\.js"/);
  assert.doesNotMatch(source, /<AppFeedbackLayer\s*\/>/);
  assert.match(source, /const result = await persistCoachBranding\(\{[\s\S]*nextBranding:\s*next,[\s\S]*appSave:\s*onSave,/);
  assert.match(source, /Team identity saved/);
  assert.match(source, /Saved to the team account[\s\S]*remain after sign-out/);
  assert.match(source, /Branding was not saved/);
  assert.match(source, /aria-busy=\{saving\}/);
  assert.match(source, /Saving changes…/);
  assert.match(source, /finally \{\s*setSaving\(false\)/s);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|supabase/);
});
