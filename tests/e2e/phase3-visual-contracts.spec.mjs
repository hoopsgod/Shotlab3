import { test, expect } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };

async function assertNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.innerWidth + 1);
}

async function assertReadableSurfaceContracts(page) {
  const violations = await page.evaluate(() => {
    const luminance = (rgb) => {
      const values = rgb.match(/[\d.]+/g)?.slice(0, 3).map(Number) || [0, 0, 0];
      const srgb = values.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    };
    const ratio = (a, b) => {
      const l1 = luminance(a);
      const l2 = luminance(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    return [...document.querySelectorAll('[data-surface="light"] h1,[data-surface="light"] h2,[data-surface="light"] h3,[data-surface="dark"] h1,[data-surface="dark"] h2,[data-surface="dark"] h3')]
      .filter((el) => {
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((el) => {
        const style = getComputedStyle(el);
        let ancestor = el;
        let background = 'rgba(0, 0, 0, 0)';
        while (ancestor && background.includes('0)')) {
          background = getComputedStyle(ancestor).backgroundColor;
          ancestor = ancestor.parentElement;
        }
        if (background.includes('0)')) background = 'rgb(246, 244, 236)';
        return { text: el.textContent?.trim(), contrast: ratio(style.color, background) };
      })
      .filter((entry) => entry.contrast < 3);
  });
  expect(violations).toEqual([]);
}

test.describe('Phase 3 visual contracts', () => {
  test.use({ viewport: MOBILE });

  test('shared secondary-page system has no mobile horizontal overflow', async ({ page }) => {
    await page.setContent(`
      <main class="secondaryPageShell" style="width:100%;box-sizing:border-box">
        <section data-layout-role="section">
          <header data-layout-role="section-header">
            <span data-visual-role="eyebrow">Program intelligence</span>
            <h2>Extremely Long Secondary Page Heading That Must Stay Inside The Viewport</h2>
            <p>Supporting copy remains subordinate and readable.</p>
          </header>
        </section>
      </main>
    `);
    await assertNoHorizontalOverflow(page);
  });

  test('explicit surface contracts keep headings readable', async ({ page }) => {
    await page.setContent(`
      <main>
        <section data-surface="light" style="background:rgb(255,255,255);padding:20px"><h2>Light surface title</h2></section>
        <section data-surface="dark" style="background:rgb(23,27,24);padding:20px"><h2>Dark surface title</h2></section>
      </main>
    `);
    await assertReadableSurfaceContracts(page);
  });

  test('semantic actions preserve minimum touch target', async ({ page }) => {
    await page.setContent(`<button data-action-role="primary">Primary action</button>`);
    const height = await page.locator('[data-action-role="primary"]').evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(44);
  });
});
