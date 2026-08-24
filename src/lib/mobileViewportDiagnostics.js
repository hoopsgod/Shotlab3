const DEBUG_QUERY_KEY = 'viewportDebug';
const PANEL_ID = 'shotlab-mobile-viewport-debug';

const TARGETS = [
  ['coachRail', '.performance-shell--coach.is-mobile > .shell-main > .content-wrap'],
  ['routeOwner', '.coach-route-scroll-container'],
  ['home', '[data-testid="coach-command-center-full"]'],
  ['homeFocus', '[data-testid="coach-command-center-full"] .mcFocusGrid'],
  ['players', '[data-testid="coach-players-interactive-dashboard"]'],
  ['playersDecision', '[data-testid="coach-players-interactive-dashboard"] [data-visual-role="primary-decision"]'],
  ['events', '[data-testid="coach-events-interactive-dashboard"]'],
  ['secondaryPage', '.secondaryPageShell'],
];

function round(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value) * 10) / 10 : null;
}

function enabled() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get(DEBUG_QUERY_KEY) === '1';
}

function geometryFor(node) {
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  const style = window.getComputedStyle(node);
  return {
    left: round(rect.left),
    right: round(rect.right),
    width: round(rect.width),
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    boxSizing: style.boxSizing,
    cssWidth: style.width,
    paddingLeft: style.paddingLeft,
    paddingRight: style.paddingRight,
    marginLeft: style.marginLeft,
    marginRight: style.marginRight,
    overflowX: style.overflowX,
    transform: style.transform === 'none' ? null : style.transform,
  };
}

function collectOffenders() {
  const visual = window.visualViewport;
  const leftBound = visual?.offsetLeft ?? 0;
  const rightBound = leftBound + (visual?.width ?? document.documentElement.clientWidth);
  return Array.from(document.querySelectorAll('body *'))
    .map((node) => {
      if (!(node instanceof Element) || node.id === PANEL_ID || node.closest?.(`#${PANEL_ID}`)) return null;
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) return null;
      const leftOverflow = leftBound - rect.left;
      const rightOverflow = rect.right - rightBound;
      if (leftOverflow <= 1 && rightOverflow <= 1) return null;
      return {
        tag: node.tagName.toLowerCase(),
        id: node.id || '',
        className: typeof node.className === 'string' ? node.className.slice(0, 90) : '',
        testid: node.getAttribute('data-testid') || '',
        left: round(rect.left),
        right: round(rect.right),
        width: round(rect.width),
        leftOverflow: round(Math.max(0, leftOverflow)),
        rightOverflow: round(Math.max(0, rightOverflow)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => Math.max(b.leftOverflow, b.rightOverflow) - Math.max(a.leftOverflow, a.rightOverflow))
    .slice(0, 8);
}

export function collectMobileViewportDiagnostics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const visual = window.visualViewport;
  const root = document.documentElement;
  const body = document.body;
  const targets = Object.fromEntries(TARGETS.map(([name, selector]) => [name, geometryFor(document.querySelector(selector))]));

  return {
    href: window.location.href,
    ua: navigator.userAgent,
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      clientHeight: root.clientHeight,
      bodyClientWidth: body?.clientWidth ?? null,
      bodyScrollWidth: body?.scrollWidth ?? null,
      rootScrollWidth: root.scrollWidth,
      scrollX: round(window.scrollX),
      scrollY: round(window.scrollY),
      dpr: window.devicePixelRatio,
      screenWidth: window.screen?.width ?? null,
      screenHeight: window.screen?.height ?? null,
      orientation: window.screen?.orientation?.type || null,
    },
    visualViewport: visual ? {
      width: round(visual.width),
      height: round(visual.height),
      scale: round(visual.scale),
      offsetLeft: round(visual.offsetLeft),
      offsetTop: round(visual.offsetTop),
      pageLeft: round(visual.pageLeft),
      pageTop: round(visual.pageTop),
    } : null,
    targets,
    offenders: collectOffenders(),
  };
}

function formatSnapshot(snapshot) {
  const v = snapshot.viewport;
  const vv = snapshot.visualViewport;
  const lines = [
    'SHOTLAB VIEWPORT DEBUG',
    `inner ${v.innerWidth}x${v.innerHeight}  client ${v.clientWidth}x${v.clientHeight}`,
    `screen ${v.screenWidth}x${v.screenHeight}  DPR ${v.dpr}`,
    vv ? `visual ${vv.width}x${vv.height}  scale ${vv.scale}  offsetX ${vv.offsetLeft}` : 'visualViewport unavailable',
    `scrollX ${v.scrollX}  rootSW ${v.rootScrollWidth}  bodySW ${v.bodyScrollWidth}`,
    '',
  ];

  for (const [name, value] of Object.entries(snapshot.targets)) {
    if (!value) continue;
    lines.push(`${name}: L${value.left} R${value.right} W${value.width}`);
    lines.push(`  css ${value.cssWidth} box ${value.boxSizing} pad ${value.paddingLeft}/${value.paddingRight}`);
  }

  if (snapshot.offenders.length) {
    lines.push('', 'VISIBLE OVERFLOW');
    snapshot.offenders.forEach((item) => {
      const label = item.testid || item.id || item.className || item.tag;
      lines.push(`${label}: L${item.left} R${item.right} +${Math.max(item.leftOverflow, item.rightOverflow)}px`);
    });
  }

  return lines.join('\n');
}

export function installMobileViewportDiagnostics() {
  if (!enabled() || typeof document === 'undefined' || typeof window === 'undefined') return () => {};
  window.__shotlabViewportSnapshot = collectMobileViewportDiagnostics;

  let panel = null;
  let output = null;
  let raf = null;

  const ensurePanel = () => {
    if (panel?.isConnected) return;
    panel = document.createElement('aside');
    panel.id = PANEL_ID;
    panel.setAttribute('aria-label', 'ShotLab viewport diagnostics');
    panel.style.cssText = [
      'position:fixed', 'left:8px', 'right:8px', 'top:calc(8px + env(safe-area-inset-top,0px))',
      'z-index:2147483647', 'max-height:46vh', 'overflow:auto', 'box-sizing:border-box',
      'padding:10px 12px', 'border:1px solid rgba(255,255,255,.22)', 'border-radius:12px',
      'background:rgba(4,8,10,.94)', 'color:#f5f7f8',
      'font:700 10px/1.35 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
      'white-space:pre-wrap', 'word-break:break-word', 'box-shadow:0 14px 38px rgba(0,0,0,.34)',
      'pointer-events:none'
    ].join(';');
    output = document.createElement('pre');
    output.style.cssText = 'margin:0;font:inherit;color:inherit;white-space:pre-wrap;';
    panel.appendChild(output);
    document.body.appendChild(panel);
  };

  const render = () => {
    raf = null;
    ensurePanel();
    const snapshot = collectMobileViewportDiagnostics();
    if (output && snapshot) output.textContent = formatSnapshot(snapshot);
  };

  const schedule = () => {
    if (raf != null) return;
    raf = window.requestAnimationFrame(render);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('shotlab:app-ready', schedule);
  schedule();

  return () => {
    observer.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('scroll', schedule, true);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
    window.removeEventListener('shotlab:app-ready', schedule);
    if (raf != null) window.cancelAnimationFrame(raf);
    panel?.remove();
    delete window.__shotlabViewportSnapshot;
  };
}
