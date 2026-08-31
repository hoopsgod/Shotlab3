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
  '.performance-workspace--coach',
  '.performance-shell--coach.is-mobile .coach-route-scroll-container',
  '.team-brand.coach-mode.page',
  '.player-scroll-container',
  '.coach-scroll-container',
  '[data-testid="coach-command-center-full"]',
  '[data-testid="player-daily-command-center"]',
];

export const STRICT_SCROLL_STATE_SELECTORS = new Set([
  'html',
  'body',
  '#root',
  '.app-shell.is-mobile',
  '.shell-main',
  '.content-wrap',
  '.player-scroll-container',
  '.coach-scroll-container',
]);

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
    const isStrictScrollOwner = STRICT_SCROLL_STATE_SELECTORS.has(target.selector);
    const overflowAllowsHorizontalScroll = ['auto', 'scroll'].includes(target.overflowX);
    const retainsHorizontalScrollState = Math.abs(target.persistedScrollLeft || 0) > 1;
    const ownsIntrinsicHorizontalOverflow = target.scrollWidth > target.clientWidth + 1;
    if (ownsIntrinsicHorizontalOverflow && (report.role === 'coach' || overflowAllowsHorizontalScroll || retainsHorizontalScrollState)) {
      failures.push(`${target.selector} owns intrinsic horizontal overflow (${target.clientWidth}/${target.scrollWidth})`);
    }
    if (isStrictScrollOwner && !overflowAllowsHorizontalScroll && retainsHorizontalScrollState) {
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

  if (report.role === 'coach' && report.label === 'home' && report.coachHome?.programPulse) {
    const pulse = report.coachHome.programPulse;
    if (!pulse.backgroundImage || pulse.backgroundImage === 'none') {
      failures.push(`Coach Home Program Pulse lost dark material (background=${pulse.backgroundColor}, image=${pulse.backgroundImage})`);
    }
    if (pulse.color && !/^rgb\((?:24[0-9]|25[0-5]),\s*(?:24[0-9]|25[0-5]),\s*(?:24[0-9]|25[0-5])\)$/.test(pulse.color)) {
      failures.push(`Coach Home Program Pulse lost light foreground (${pulse.color})`);
    }
    const ambient = report.coachHome.ambientGlow;
    if (!ambient) failures.push('Coach Home ambient glow is missing');
    else {
      if (ambient.left < -1) failures.push(`Coach Home ambient glow escapes left (${Math.round(ambient.left)}px)`);
      if (ambient.right > report.viewport.width + 1) failures.push(`Coach Home ambient glow escapes right (${Math.round(ambient.right)}px of ${report.viewport.width}px)`);
    }
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
  if (report.coachHome?.programPulse) {
    const pulse = report.coachHome.programPulse;
    lines.push(`  program-pulse: background=${pulse.backgroundColor} image=${pulse.backgroundImage} color=${pulse.color}`);
    const ambient = report.coachHome.ambientGlow;
    if (ambient) lines.push(`  coach-ambient-glow: x=${Math.round(ambient.left)}..${Math.round(ambient.right)} w=${Math.round(ambient.width)}`);
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
    const matchedRules = (node) => {
      const result = [];
      const walk = (rules, href, media = '') => {
        for (const rule of rules || []) {
          if (rule instanceof CSSMediaRule) {
            if (matchMedia(rule.conditionText).matches) walk(rule.cssRules, href, rule.conditionText);
            continue;
          }
          if (!(rule instanceof CSSStyleRule) || !rule.selectorText) continue;
          let matches = false;
          try { matches = node.matches(rule.selectorText); } catch { matches = false; }
          if (!matches) continue;
          const declarations = rule.style;
          if (!declarations.background && !declarations.backgroundColor && !declarations.backgroundImage && !declarations.color && !declarations.display && !declarations.gridColumn) continue;
          result.push({ href, media, selector: rule.selectorText, cssText: rule.cssText });
        }
      };
      for (const sheet of document.styleSheets) {
        try { walk(sheet.cssRules, sheet.href || 'inline'); } catch { /* same-origin preview should be readable; ignore browser-internal sheets */ }
      }
      return result.slice(-40);
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

    let coachHome = null;
    if (role === 'coach' && label === 'home') {
      const pulse = document.querySelector('[data-testid="coach-program-pulse"]');
      const shell = document.querySelector('[data-testid="coach-command-center-full"]');
      const mission = shell?.querySelector('.missionControl');
      const ambientRect = document.querySelector('[data-testid="coach-ambient-glow"]')?.getBoundingClientRect();
      if (pulse) {
        const style = getComputedStyle(pulse);
        const rect = pulse.getBoundingClientRect();
        coachHome = {
          shell: shell ? { display: getComputedStyle(shell).display, classes: shell.className } : null,
          mission: mission ? { display: getComputedStyle(mission).display, gridTemplateColumns: getComputedStyle(mission).gridTemplateColumns } : null,
          ambientGlow: ambientRect ? { left: ambientRect.left, right: ambientRect.right, width: ambientRect.width } : null,
          programPulse: {
            classes: pulse.className,
            background: style.background,
            backgroundColor: style.backgroundColor,
            backgroundImage: style.backgroundImage,
            color: style.color,
            display: style.display,
            width: rect.width,
            height: rect.height,
            matchedRules: matchedRules(pulse),
          },
          stylesheets: [...document.styleSheets].map((sheet) => sheet.href || 'inline'),
        };
      }
    }

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
      coachHome,
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
