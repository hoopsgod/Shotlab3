import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ensurePlayerStatsDrawerOpens,
  findPlayerStatsRow,
} from "../src/lib/coachResponseLoopEnhancer.js";

const makeRow = (name) => ({
  textContent: `${name} Active this week`,
  querySelector(selector) {
    return selector === "strong" ? { textContent: name } : null;
  },
});

test("exact roster lookup does not open a similarly named player", () => {
  const ava = makeRow("Ava Brooks");
  const avaJunior = makeRow("Ava Brooks Jr.");
  const root = {
    querySelectorAll() {
      return [avaJunior, ava];
    },
  };

  assert.equal(findPlayerStatsRow(root, "Ava Brooks"), ava);
  assert.equal(findPlayerStatsRow(root, "Missing Player"), null);
});

test("delayed mobile handoff retries the exact roster row until the stats drawer appears", () => {
  let drawerOpen = false;
  let clicks = 0;
  const row = {
    ...makeRow("Ava Brooks"),
    click() {
      clicks += 1;
      drawerOpen = true;
    },
  };
  const root = {
    body: {},
    querySelector(selector) {
      return selector === '[data-testid="coach-player-intelligence-drawer"]' && drawerOpen ? {} : null;
    },
    querySelectorAll() {
      return [row];
    },
  };
  class FakeMutationObserver {
    observe() {}
    disconnect() {}
  }
  const target = {
    MutationObserver: FakeMutationObserver,
    setTimeout(callback) {
      callback();
      return clicks + 1;
    },
    clearTimeout() {},
  };

  assert.equal(ensurePlayerStatsDrawerOpens("Ava Brooks", target, root), true);
  assert.equal(clicks, 1);
  assert.ok(root.querySelector('[data-testid="coach-player-intelligence-drawer"]'));
});

test("dashboard detail drawers render through a document-body portal", () => {
  const source = fs.readFileSync(new URL("../src/components/CoachDashboardPrimitives.jsx", import.meta.url), "utf8");
  assert.match(source, /import \{ createPortal \} from "react-dom"/);
  assert.match(source, /createPortal\(drawer, document\.body\)/);
  assert.match(source, /typeof document !== "undefined" && document\.body/);
});

test("live-result response recovery remains tied to the exact player stats drawer", () => {
  const source = fs.readFileSync(new URL("../src/lib/coachResponseLoopEnhancer.js", import.meta.url), "utf8");
  assert.match(source, /PLAYER_DRAWER_SELECTOR/);
  assert.match(source, /PLAYER_STATS_ROW_SELECTOR/);
  assert.match(source, /ensurePlayerStatsDrawerOpens\(result\.playerName\)/);
  assert.match(source, /#coach-roster-operations \[role="button"\]/);
  assert.doesNotMatch(source, /querySelectorAll\("button"\).*\[0\]\.click/s);
});
