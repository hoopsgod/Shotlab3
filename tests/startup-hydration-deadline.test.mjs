import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  STARTUP_HYDRATION_TIMEOUT_MS,
  settleStartupHydration,
} from "../src/lib/startupHydrationDeadline.js";

test("startup hydration fails open when persistence never settles", async () => {
  let timeoutObserved = false;
  const result = await settleStartupHydration(
    () => new Promise(() => {}),
    {
      timeoutMs: 5,
      onTimeout: () => {
        timeoutObserved = true;
      },
    },
  );

  assert.deepEqual(result, { status: "timeout" });
  assert.equal(timeoutObserved, true);
  assert.equal(STARTUP_HYDRATION_TIMEOUT_MS, 8_000);
});

test("startup hydration preserves successful and failed outcomes", async () => {
  await assert.doesNotReject(async () => {
    const result = await settleStartupHydration(async () => "restored", { timeoutMs: 25 });
    assert.deepEqual(result, { status: "completed", value: "restored" });
  });

  const expected = new Error("storage unavailable");
  const failed = await settleStartupHydration(async () => {
    throw expected;
  }, { timeoutMs: 25 });

  assert.equal(failed.status, "failed");
  assert.equal(failed.error, expected);
});

test("App releases the blocking startup screen through the bounded hydration seam", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /settleStartupHydration\(hydratePersistedData,/);
  assert.match(source, /timeoutMs:STARTUP_HYDRATION_TIMEOUT_MS/);
  assert.match(source, /result\.status==="timeout"|else\{\s*setAccountNotice/);
  assert.match(source, /setReady\(true\);/);
});
