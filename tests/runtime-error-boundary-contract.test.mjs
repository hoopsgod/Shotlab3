import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const mainSource = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("the mounted app is protected by a recoverable runtime error boundary", () => {
  assert.match(mainSource, /import RuntimeErrorBoundary from ['"]\.\/components\/RuntimeErrorBoundary\.jsx['"]/);
  assert.match(
    mainSource,
    /<RuntimeErrorBoundary>\s*<ReleaseReadinessBoundary>\s*<App \/>\s*<\/ReleaseReadinessBoundary>\s*<\/RuntimeErrorBoundary>/s,
  );
});

test("the runtime fallback offers both an in-place retry and a full reload", () => {
  const boundarySource = fs.readFileSync(
    new URL("../src/components/RuntimeErrorBoundary.jsx", import.meta.url),
    "utf8",
  );

  assert.match(boundarySource, /role="alert"/);
  assert.match(boundarySource, /data-testid="runtime-error-retry"/);
  assert.match(boundarySource, /data-testid="runtime-error-reload"/);
  assert.match(boundarySource, /this\.setState\(\(state\) => \(\{ error: null, recoveryAttempt: state\.recoveryAttempt \+ 1 \}\)\)/);
  assert.match(boundarySource, /window\.location\.reload\(\)/);
});
