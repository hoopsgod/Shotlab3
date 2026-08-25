import fs from 'node:fs';
import path from 'node:path';

export const OUTER_VIEWPORT_SELECTORS = [
  'html',
  'body',
  '#root',
  '.app-shell.is-mobile',
  '.shell-main',
  '.content-wrap',
  '.performance-workspace',
  '.player-scroll-container',
  '.coach-scroll-container',
  '[data-testid="coach-command-center-full"]',
  '[data-testid="player-daily-command-center"]',
];

export function findViewportFailures(report) {
  const failures = [];
  const tolerance = 2;
  if (report.documentOverflow > tolerance) failures.push(`document overflows viewport by ${report.documentOverflow}px`);
  if (report.bodyOverflow > tolerance) failures.push(`body overflows viewport by ${report.bodyOverflow}px`);
  if (Math.abs(report.windowScrollX) > 1) failures.push(`window.scrollX=${report.windowScrollX}`);
  if (Math.abs(report.rootScrollLeft) > 1) failures.push(`document scrollLeft=${report.rootScrollLeft}`);
  if (Math.abs(report.visualViewportOffsetLeft) > 1) failures.push(`visualViewport.offsetLeft=${report.visualViewportOffsetLeft}`);

  for (const target of report.outerTargets || []) {
    if (target.left < -1 || target.right > report.viewport.width + 1) {
      failures.push(`${target.selector} escapes viewport (${Math.round(target.left)}..${Math.round(target.right)} of ${report.viewport.width})`);
    }
    const overflowAllowsHorizontalScroll = ['auto', 'scroll'].includes(target.overflowX);
    if (!overflowAllowsHorizontalScroll && Math.abs(target.persistedScrollLeft || 0) > 1) {
      failures.push(`${target.selector} retains horizontal scrollLeft=${Math.round(target.persistedScrollLeft)} (${target.clientWidth}/${target.scrollWidth}, overflow-x=${target.overflowX})`);
    }
  }

  for (const action of report.fixedActionOffenders || []) {
    failures.push(`fixed/sticky action outside viewport: ${action.label} (${Math.round(action.left)}..${Math.round(action.right)})`);
  }

  for (const action of report.criticalActions || []) {
    if (!action.visible) failures.push(`critical action is not visible: ${action.label}`);
    else if (!action.inViewport) failures.push(`critical action is outside viewport: ${action.label}`);
  }
  return failures;
}

export function formatViewportDiagnostics(report) {
  const failures = findViewportFailures(report);
  const lines = [
    `[viewport-debug] ${report.role} ${report.viewport.width}x${report.viewport.height} ${report.label}: ${failures.length ? 'FAIL' : 'PASS'}`,
    `  document ${report.viewport.width}/${report.documentScrollWidth} | body ${report.viewport.width}/${report.bodyScrollWidth} | scrollX ${report.windowScrollX}`,
  ];
  for (const target of report.outerTargets || []) {
    lines.push(`  ${target.selector}: client=${target.clientWidth} scroll=${target.scrollWidth} persisted=${Math.round(target.persistedScrollLeft || 0)} x=${Math.round(target.left)}..${Math.round(target.right)} overflow-x=${target.overflowX}`);
  }
  if (report.offenders?.length) {
    lines.push('  widest/off-axis elements:');
    for (const offender of report.offenders.slice(0, 6)) {
      lines.push(`    ${offender.label}: x=${Math.round(offender.left)}..${Math.round(offender.right)} w=${Math.round(offender.width)} position=${offender.position} overflow-x=${offender.overflowX}`);
    }
  }
  if (failures.length) {
    lines.push('  failures:');
    for (const failure of failures) lines.push(`    - ${failure}`);
    const chain = report.offenders?.[0]?.ancestorChain || [];
    if (chain.length) {
      lines.push('  first offender ancestor chain:');
      for (const ancestor of chain) lines.push(`    ${ancestor.label} overflow=${ancestor.overflow}/${ancestor.overflowX} position=${ancestor.position}`);
    }
  }
  return lines.join('\n');
}

export async function collectViewportDiagnostics(page, { role, label, extraSelectors = [], criticalActionLocators = [] }) {
  const selectors = [...new Set([...OUTER_VIEWPORT_SELECTORS, ...extraSelectors])];
  const report = await page.evaluate(async ({ selectors, role, label }) => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const isVisible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const nodeLabel = (node) => {
      if (!(node instanceof Element)) return 'unknown';
      const testId = node.getAttribute('data-testid');
      if (testId) return `[data-testid="${testId}"]`;
      const aria = node.getAttribute('aria-label');
      if (aria) return `${node.tagName.toLowerCase()}[aria-label="${aria}"]`;
      const id = node.id ? `#${node.id}` : '';
      const classes = [...node.classList].slice(0, 3).map((name) => `.${name}`).join('');
      return `${node.tagName.toLowerCase()}${id}${classes}`;
    };
    const describe = (node, selector = nodeLabel(node)) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        selector,
        label: nodeLabel(node),
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        scrollLeft: node.scrollLeft,
        overflow: style.overflow,
        overflowX: style.overflowX,
        overscrollBehaviorX: style.overscrollBehaviorX,
        position: style.position,
      };
    };
    const ancestorChain = (node) => {
      const chain = [];
      let current = node?.parentElement || null;
      while (current && chain.length < 8) {
        const style = getComputedStyle(current);
        chain.push({ label: nodeLabel(current), overflow: style.overflow, overflowX: style.overflowX, position: style.position });
        current = current.parentElement;
      }
      return chain;
    };

    const outerTargets = [];
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) continue;
      const entry = describe(node, selector);
      const originalScrollLeft = node.scrollLeft;
      node.scrollLeft = 240;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const persistedScrollLeft = node.scrollLeft;
      node.scrollLeft = originalScrollLeft;
      outerTargets.push({ ...entry, persistedScrollLeft });
    }

    const visibleNodes = [...document.querySelectorAll('body *')].filter((node) => isVisible(node));
    const offenders = visibleNodes
      .map((node) => ({ ...describe(node), ancestorChain: ancestorChain(node) }))
      .filter((entry) => entry.left < -2 || entry.right > viewport.width + 2)
      .sort((a, b) => (b.right - viewport.width) - (a.right - viewport.width))
      .slice(0, 12);

    const actionableSelector = 'button, a[href], input, select, textarea, [role="button"], [role="dialog"]';
    const fixedActionOffenders = [...document.querySelectorAll(actionableSelector)]
      .filter((node) => isVisible(node))
      .map((node) => describe(node))
      .filter((entry) => ['fixed', 'sticky'].includes(entry.position) && (entry.left < -1 || entry.right > viewport.width + 1 || entry.top < -1 || entry.bottom > viewport.height + 1))
      .slice(0, 12);

    return {
      role,
      label,
      viewport,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentOverflow: document.documentElement.scrollWidth - viewport.width,
      bodyOverflow: document.body.scrollWidth - viewport.width,
      windowScrollX: window.scrollX,
      rootScrollLeft: document.scrollingElement?.scrollLeft || 0,
      visualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
      bodyClasses: document.body.className,
      outerTargets,
      offenders,
      fixedActionOffenders,
    };
  }, { selectors, role, label });

  const criticalActions = [];
  for (const { locator, label: actionLabel } of criticalActionLocators) {
    const count = await locator.count();
    if (!count) {
      criticalActions.push({ label: actionLabel, visible: false, inViewport: false });
      continue;
    }
    const action = locator.first();
    const visible = await action.isVisible().catch(() => false);
    const geometry = visible ? await action.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    }) : null;
    criticalActions.push({
      label: actionLabel,
      visible,
      inViewport: Boolean(geometry && geometry.left >= -1 && geometry.right <= geometry.viewportWidth + 1 && geometry.top >= -1 && geometry.bottom <= geometry.viewportHeight + 1),
      ...(geometry || {}),
    });
  }
  report.criticalActions = criticalActions;
  return report;
}

export function writeViewportDiagnostics(report, outputDir = 'artifacts/viewport-debug') {
  fs.mkdirSync(outputDir, { recursive: true });
  const safeLabel = `${report.role}-${report.viewport.width}-${report.label}`.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  const outputPath = path.join(outputDir, `${safeLabel}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify({ ...report, failures: findViewportFailures(report) }, null, 2)}\n`);
  return outputPath;
}
