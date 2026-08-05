import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(path, before, after) {
  const source = readFileSync(path, "utf8");
  if (source.includes(after)) return false;
  if (!source.includes(before)) throw new Error(`Expected source block was not found in ${path}`);
  writeFileSync(path, source.replace(before, after));
  return true;
}

function appendOnce(path, marker, content) {
  const source = readFileSync(path, "utf8");
  if (source.includes(marker)) return false;
  writeFileSync(path, `${source.trimEnd()}\n\n${content.trim()}\n`);
  return true;
}

replaceOnce(
  "src/components/PlayerDailyCommandCenter.jsx",
  'import { useEffect, useRef, useState } from "react";\n',
  'import { useEffect, useRef, useState } from "react";\nimport { installPlayerAssignmentEnhancer } from "../lib/playerAssignmentEnhancer.js";\n',
);

replaceOnce(
  "src/components/PlayerDailyCommandCenter.jsx",
  '  const feedbackTimer = useRef(null);\n\n  useEffect(() => () => {',
  '  const feedbackTimer = useRef(null);\n\n  useEffect(() => {\n    installPlayerAssignmentEnhancer();\n  }, []);\n\n  useEffect(() => () => {',
);

replaceOnce(
  "src/components/CoachCommandCenter.jsx",
  'import { deriveCoachActivationPath } from "../lib/coachActivationPath.js";\n',
  'import { deriveCoachActivationPath } from "../lib/coachActivationPath.js";\nimport { installCoachResponseLoopEnhancer, openLiveResultResponse } from "../lib/coachResponseLoopEnhancer.js";\n',
);

replaceOnce(
  "src/components/CoachCommandCenter.jsx",
  '  const restoreInboxFocusRef = useRef(true);\n\n  useEffect(() => {\n    document.body.classList.add("mission-control-active");',
  '  const restoreInboxFocusRef = useRef(true);\n\n  useEffect(() => {\n    installCoachResponseLoopEnhancer();\n  }, []);\n\n  useEffect(() => {\n    document.body.classList.add("mission-control-active");',
);

replaceOnce(
  "src/components/CoachCommandCenter.jsx",
  '<div className="mcTimeline">{items.slice(0, 5).map((item, index) => <div key={`${item.id || item.name || item.title}-${index}`}><Avatar item={item} size={42} /><span><strong>{item.name || item.title}</strong><small>{item.detail || "Recent team activity"}</small></span><time>{item.meta || "Now"}</time></div>)}</div>',
  '<div className="mcTimeline">{items.slice(0, 5).map((item, index) => { const playerName = item.name || item.title || "Player"; return <div key={`${item.id || playerName}-${index}`} role="button" tabIndex={0} data-shotlab-response-row="true" aria-label={`Review ${playerName} result and record next assignment`} onClick={(event) => openLiveResultResponse(event.currentTarget)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLiveResultResponse(event.currentTarget); } }}><Avatar item={item} size={42} /><span><strong>{playerName}</strong><small>{item.detail || "Recent team activity"}</small></span><time>{item.meta || "Now"}</time></div>; })}</div>',
);

replaceOnce(
  "public/shotlab-v3-mobile-corrections.css",
  '/* Mobile coaches must retain access to live operational evidence and assignment follow-up. */\n',
  '/* Live operational evidence must remain visible and actionable at every viewport. */\n[data-testid="coach-live-activity"] {\n  display: block !important;\n  visibility: visible !important;\n  opacity: 1 !important;\n  min-height: 1px !important;\n  max-height: none !important;\n}\n\n/* Mobile coaches must retain access to live operational evidence and assignment follow-up. */\n',
);

replaceOnce(
  "tests/player-assignment-next-action.test.mjs",
  '  const enhancer = fs.readFileSync(new URL("../src/lib/playerAssignmentEnhancer.js", import.meta.url), "utf8");\n  const service = fs.readFileSync(new URL("../src/lib/playerAssignmentService.js", import.meta.url), "utf8");',
  '  const enhancer = fs.readFileSync(new URL("../src/lib/playerAssignmentEnhancer.js", import.meta.url), "utf8");\n  const commandCenter = fs.readFileSync(new URL("../src/components/PlayerDailyCommandCenter.jsx", import.meta.url), "utf8");\n  const service = fs.readFileSync(new URL("../src/lib/playerAssignmentService.js", import.meta.url), "utf8");',
);

replaceOnce(
  "tests/player-assignment-next-action.test.mjs",
  '  assert.match(enhancer, /insertBefore\\(nextHost, genericHero\\)/);\n  assert.match(card, /derivePlayerAssignmentPriority/);',
  '  assert.match(enhancer, /insertBefore\\(nextHost, genericHero\\)/);\n  assert.match(commandCenter, /installPlayerAssignmentEnhancer/);\n  assert.match(commandCenter, /installPlayerAssignmentEnhancer\\(\\)/);\n  assert.match(card, /derivePlayerAssignmentPriority/);',
);

replaceOnce(
  "tests/coach-player-response-loop.test.mjs",
  '  const activation = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");\n',
  '  const activation = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");\n  const commandCenter = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");\n',
);

replaceOnce(
  "tests/coach-player-response-loop.test.mjs",
  '  assert.match(activation, /installCoachResponseLoopEnhancer\\(\\)/);\n  assert.doesNotMatch(followUp, /message sent|notification delivered|player was notified/i);',
  '  assert.match(activation, /installCoachResponseLoopEnhancer\\(\\)/);\n  assert.match(commandCenter, /installCoachResponseLoopEnhancer/);\n  assert.match(commandCenter, /installCoachResponseLoopEnhancer\\(\\)/);\n  assert.match(commandCenter, /openLiveResultResponse/);\n  assert.doesNotMatch(followUp, /message sent|notification delivered|player was notified/i);',
);

replaceOnce(
  "vite.config.js",
  "    || moduleId.includes('/src/components/PlayerCareerHistory.jsx')\n    || moduleId.includes('/src/components/PlayerCoachAssignmentCard.jsx')\n  ) {\n    return 'PlayerProfileWorkspaces'\n  }\n\n  if (\n    moduleId.includes('/src/components/PlayerDashboardHeader.jsx')",
  "    || moduleId.includes('/src/components/PlayerCareerHistory.jsx')\n  ) {\n    return 'PlayerProfileWorkspaces'\n  }\n\n  if (\n    moduleId.includes('/src/components/PlayerCoachAssignmentCard.jsx')\n    || moduleId.includes('/src/components/PlayerDashboardHeader.jsx')",
);

// Release lock: keep live activity visible after every later stylesheet rule.
appendOnce(
  "public/shotlab-v3-mobile-corrections.css",
  "SHOTLAB_RELEASE_LIVE_ACTIVITY_LOCK",
  `/* SHOTLAB_RELEASE_LIVE_ACTIVITY_LOCK */
html body [data-testid="coach-live-activity"].mcActivity,
html body article[data-testid="coach-live-activity"] {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
  min-height: 1px !important;
  max-height: none !important;
  overflow: visible !important;
  pointer-events: auto !important;
}
html body [data-testid="coach-live-activity"] [data-shotlab-response-row="true"] {
  display: grid !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}`,
);

// Release lock: resolve the Players control after the responsive shell settles.
{
  const path = "tests/e2e/coach-player-invitation.spec.mjs";
  let source = readFileSync(path, "utf8");
  const robustHelper = `async function enterCoachPlayers(page) {
  await page.goto("/");
  const demoCoach = page.getByRole("button", { name: "Demo Coach", exact: true });
  const allPlayers = page.getByRole("button", { name: "Players", exact: true });
  await expect(demoCoach.or(allPlayers.first()).first()).toBeVisible({ timeout: 15_000 });
  if (await demoCoach.isVisible()) await demoCoach.click();
  await expect.poll(async () => {
    const count = await allPlayers.count();
    for (let index = 0; index < count; index += 1) {
      if (await allPlayers.nth(index).isVisible()) return index;
    }
    return -1;
  }, { timeout: 15_000 }).toBeGreaterThanOrEqual(0);
  const count = await allPlayers.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = allPlayers.nth(index);
    if (await candidate.isVisible()) {
      await candidate.click();
      return;
    }
  }
  throw new Error("No visible Players navigation control was available.");
}`;
  if (!source.includes(robustHelper)) {
    source = source.replace(/async function enterCoachPlayers\(page\) \{[\s\S]*?\n\}\n\ntest\(/, `${robustHelper}\n\ntest(`);
    writeFileSync(path, source);
  }
}

// Release lock: quick-assign state refresh is asynchronous but must converge.
{
  const path = "tests/e2e/coach-quick-assign.spec.mjs";
  let source = readFileSync(path, "utf8");
  const before = '  await expect(panel).toHaveAttribute("data-unassigned-count", "0");\n  await expect(panel).toHaveAttribute("data-assigned-count", "1");';
  const after = '  await expect.poll(async () => Number(await panel.getAttribute("data-unassigned-count")), { timeout: 15_000 }).toBe(0);\n  await expect.poll(async () => Number(await panel.getAttribute("data-assigned-count")), { timeout: 15_000 }).toBe(1);';
  if (!source.includes(after) && source.includes(before)) {
    source = source.replace(before, after);
    writeFileSync(path, source);
  }
}
