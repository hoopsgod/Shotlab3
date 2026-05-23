import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const leaderboardSource = fs.readFileSync(new URL("../src/components/HomeShotsLeaderboardCard.jsx", import.meta.url), "utf8");

test("empty-state polish copy appears across coach/player event and activity surfaces", () => {
  assert.match(source, /No events yet — add your first event to get the team moving\./);
  assert.match(source, /No RSVPs yet — players can RSVP from their Events page\./);
  assert.match(source, /No activity yet — invite players or have them log their first workout\./);
});

test("home shots leaderboard empty-state copy guides first-time teams", () => {
  assert.match(leaderboardSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(leaderboardSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
});
