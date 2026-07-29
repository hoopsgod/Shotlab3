import { test, expect } from "@playwright/test";

const routes = [
  { path: "/privacy", heading: "Privacy Policy", proof: /account identifiers|workout scores|shot logs/i },
  { path: "/terms", heading: "Terms of Use", proof: /acceptable use|training content/i },
  { path: "/support", heading: "Support", proof: /account|team|privacy/i },
  { path: "/delete-account", heading: "Delete Account", proof: /delete account|personal training data/i },
  { path: "/data-request", heading: "Account Data Request", proof: /access|export|correction|deletion/i },
];

for (const route of routes) {
  test(`${route.path} opens directly without authentication`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(new RegExp(`${route.path.replaceAll("/", "\\/")}$`));
    await expect(page.getByTestId("static-legal-page")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: route.heading, exact: true })).toBeVisible();
    await expect(page.locator("body")).toContainText(route.proof);
    await expect(page.getByRole("link", { name: /SHOTLAB/i }).first()).toHaveAttribute("href", "/");
    await expect(page.getByTestId("mobile-navigation-dock")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Demo Player", exact: true })).toHaveCount(0);
  });
}
