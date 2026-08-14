import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const productionCss = fs.readFileSync(new URL("../scripts/restructure-production-css.mjs", import.meta.url), "utf8");

test("production CSS enumerates files after deleting unreferenced authority copies", () => {
  const cleanup = productionCss.indexOf("const removedAuthorityCopies = await removeBundledAuthorityDuplicates()");
  const enumeration = productionCss.lastIndexOf("listCssFiles(DIST_DIR)");

  assert.notEqual(cleanup, -1);
  assert.notEqual(enumeration, -1);
  assert.ok(cleanup < enumeration);
});
