import fs from "node:fs";

const path = "tests/e2e/production-acceptance.spec.mjs";
let source = fs.readFileSync(path, "utf8");

const before = `  await page.getByRole("button", { name: /^logout$/i }).click();`;
const after = `  await page.getByTestId("mobile-navigation-more").click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toBeVisible();
  await page.getByTestId("mobile-navigation-sign-out").click();`;

if (!source.includes(after)) {
  if (!source.includes(before)) throw new Error("Phase 3U production acceptance logout target missing");
  source = source.replace(before, after);
  fs.writeFileSync(path, source);
}

console.log("Applied Phase 3U production acceptance logout path.");
