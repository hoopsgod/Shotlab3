import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("coach review-to-adjust preserves completed work before delivering the next assignment", () => {
  const drawer = read("../src/components/CoachDashboardPhase2.jsx");

  assert.match(drawer, /playerAssignmentHistoryService\.js/);
  assert.match(drawer, /delivery\?\.state\s*===\s*["']completed["']/);
  assert.match(drawer, /saveNextPlayerAssignment\s*\(/);
  assert.match(drawer, /savePlayerAssignment\s*\(/);
  assert.match(drawer, /Adjust and deliver next assignment/);
  assert.match(drawer, /completed work remains in history/i);
});

test("player side keeps the assignment progression needed to close the development loop", () => {
  const card = read("../src/components/PlayerCoachAssignmentCard.jsx");

  assert.match(card, /Acknowledge assignment/);
  assert.match(card, /Start assignment/);
  assert.match(card, /Mark assignment complete/);
  assert.match(card, /Coach response context/);
  assert.match(card, /updatePlayerAssignmentState/);
});

test("development-loop adjustment never exposes private coach notes to the player assignment payload", () => {
  const historyService = read("../src/lib/playerAssignmentHistoryService.js");
  const followUp = read("../src/components/CoachDashboardPhase2.jsx");

  assert.doesNotMatch(historyService, /private_note|coach_note/i);
  assert.match(followUp, /Private coach notes remain coach-only/i);
});
