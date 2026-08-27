const MOBILE_VIEWPORT_QUERY = '(max-width: 760px)';
const HORIZONTAL_INTENT_THRESHOLD_PX = 6;
const VISUAL_VIEWPORT_ZOOM_EPSILON = 0.01;
const COACH_MOBILE_RAIL = 'var(--shotlab-mobile-content-rail, 20px)';
const COACH_ROUTE_GEOMETRY_PROPERTIES = [
  'width',
  'min-width',
  'max-width',
  'box-sizing',
  'overflow-x',
  'margin-left',
  'margin-right',
  'padding-left',
  'padding-right',
];

const LOCKED_VERTICAL_OWNER_SELECTORS = [
  '.app-shell.is-mobile',
  '.app-shell.is-mobile > .shell-main',
  '.app-shell.is-mobile > .shell-main > .content-wrap',
  '.app-shell.is-mobile .performance-workspace',
  '.app-shell.is-mobile .player-scroll-container',
  '.performance-shell--coach.is-mobile > .shell-main > .content-wrap',
  '.app-shell.is-mobile .coach-route-scroll-container',
  '.app-shell.is-mobile .coach-home-dashboard',
  '.app-shell.is-mobile [data-testid="coach-command-center-full"]',
  '.app-shell.is-mobile [data-testid="player-daily-command-center"]',
];

const LOCKED_VERTICAL_OWNER_SELECTOR = LOCKED_VERTICAL_OWNER_SELECTORS.join(',');
const INTENTIONAL_HORIZONTAL_GESTURE_SELECTOR = [
  '.h-scroll',
  '[data-horizontal-scroll]',
  '[data-scroll-axis="x"]',
  '[role="slider"]',
  'input[type="range"]',
].join(',');

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.(MOBILE_VIEWPORT_QUERY).matches ?? window.innerWidth <= 760;
}

export function isVisualViewportZoomed() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const visual = window.visualViewport;
  if (!visual) return false;
  const layoutWidth = document.documentElement?.clientWidth || window.innerWidth || 0;
  return Number(visual.scale || 1) > 1 + VISUAL_VIEWPORT_ZOOM_EPSILON
    || (layoutWidth > 0 && Number(visual.width || layoutWidth) < layoutWidth - 1);
}

function findCoachRouteOwner() {
  if (typeof document === 'undefined') return null;
  const workspace = document.querySelector('.performance-shell--coach.is-mobile .performance-workspace--coach');
  if (!workspace) return null;

  return Array.from(workspace.children).find((node) => {
    if (!(node instanceof Element)) return false;
    return Boolean(
      node.querySelector('[data-testid="coach-command-center-full"]')
      || node.querySelector('.secondaryPageShell')
      || node.querySelector('.page.pageShell')
    );
  }) || null;
}

export function clearRegisteredCoachRouteGeometry() {
  if (typeof document === 'undefined') return false;
  let cleared = false;

  document.querySelectorAll('.coach-route-scroll-container').forEach((routeOwner) => {
    routeOwner.classList.remove('coach-route-scroll-container');
    COACH_ROUTE_GEOMETRY_PROPERTIES.forEach((property) => routeOwner.style.removeProperty(property));
    cleared = true;
  });

  return cleared;
}

export function normalizeRegisteredCoachRouteGeometry() {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !isMobileViewport()) return false;
  const routeOwner = findCoachRouteOwner();
  if (!routeOwner) return false;

  const isHome = Boolean(routeOwner.querySelector('[data-testid="coach-command-center-full"]'));
  routeOwner.classList.add('coach-route-scroll-container');

  routeOwner.style.setProperty('width', '100%');
  routeOwner.style.setProperty('min-width', '0');
  routeOwner.style.setProperty('max-width', '100%');
  routeOwner.style.setProperty('box-sizing', 'border-box');
  routeOwner.style.setProperty('overflow-x', 'clip');
  routeOwner.style.setProperty('margin-left', '0');
  routeOwner.style.setProperty('margin-right', '0');
  routeOwner.style.setProperty('padding-left', isHome ? '0px' : COACH_MOBILE_RAIL);
  routeOwner.style.setProperty('padding-right', isHome ? '0px' : COACH_MOBILE_RAIL);

  return true;
}

function resetNodeHorizontalOffset(node) {
  if (!node || typeof node.scrollLeft !== 'number') return false;
  if (Math.abs(node.scrollLeft) <= 0.5) return false;
  node.scrollLeft = 0;
  return true;
}

function isIntentionalHorizontalGestureOwner(target) {
  let node = target instanceof Element ? target : target?.parentElement;
  while (node && node !== document.documentElement) {
    if (node.matches?.(INTENTIONAL_HORIZONTAL_GESTURE_SELECTOR)) return true;

    const style = window.getComputedStyle?.(node);
    const ownsHorizontalScroll = node.scrollWidth > node.clientWidth + 1
      && (style?.overflowX === 'auto' || style?.overflowX === 'scroll');
    if (ownsHorizontalScroll) return true;

    const touchAction = String(style?.touchAction || '').toLowerCase();
    if (touchAction.includes('pan-x')) return true;
    node = node.parentElement;
  }
  return false;
}

export function shouldContainRegisteredHorizontalGesture({
  deltaX,
  deltaY,
  targetIsHorizontalOwner = false,
  minimumHorizontalIntent = HORIZONTAL_INTENT_THRESHOLD_PX,
} = {}) {
  const absX = Math.abs(Number(deltaX) || 0);
  const absY = Math.abs(Number(deltaY) || 0);
  return !targetIsHorizontalOwner
    && absX >= minimumHorizontalIntent
    && absX > absY;
}

export function resetMobileHorizontalViewport() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  if (!isMobileViewport()) return clearRegisteredCoachRouteGeometry();

  let corrected = normalizeRegisteredCoachRouteGeometry();

  // When Safari is pinched or page-zoomed, the visual viewport is intentionally
  // narrower than the layout viewport. Do not snap its horizontal position back
  // to zero: that traps the user on the left edge and makes a valid zoomed page
  // look like a right-clipped layout. Keep the structural Coach normalization,
  // but let WebKit own zoom/pan geometry natively for accessibility.
  if (isVisualViewportZoomed()) return corrected;

  const scrollingElement = document.scrollingElement || document.documentElement;
  corrected = resetNodeHorizontalOffset(scrollingElement) || corrected;
  corrected = resetNodeHorizontalOffset(document.documentElement) || corrected;
  corrected = resetNodeHorizontalOffset(document.body) || corrected;

  document.querySelectorAll(LOCKED_VERTICAL_OWNER_SELECTOR).forEach((node) => {
    corrected = resetNodeHorizontalOffset(node) || corrected;
  });

  if (Math.abs(window.scrollX) > 0.5) {
    window.scrollTo(0, window.scrollY);
    corrected = true;
  }

  return corrected;
}

export function installMobileHorizontalViewportLock() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};

  let rafId = null;
  let touchStart = null;
  let routeKey = '';
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const resetRouteTop = () => {
    const shell = document.querySelector('.performance-shell.is-mobile[data-workspace-tab]');
    const nextRoute = shell?.dataset.workspaceTab;
    if (!nextRoute || nextRoute === routeKey) return;
    routeKey = nextRoute;
    window.scrollTo(0, 0);
    shell.querySelector('.player-scroll-container, :scope > .shell-main > .content-wrap')?.scrollTo(0, 0);
  };

  const scheduleCorrection = () => {
    if (rafId != null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      resetMobileHorizontalViewport();
      resetRouteTop();
    });
  };
  const forceRouteTop = () => { routeKey = ''; scheduleCorrection(); };

  const handleCapturedScroll = (event) => {
    if (!isMobileViewport()) return;
    const target = event.target === document ? (document.scrollingElement || document.documentElement) : event.target;
    if (
      target === document.documentElement ||
      target === document.body ||
      target === document.scrollingElement ||
      target?.matches?.(LOCKED_VERTICAL_OWNER_SELECTOR)
    ) {
      scheduleCorrection();
    }
  };

  const handleTouchStart = (event) => {
    if (!isMobileViewport() || event.touches?.length !== 1) {
      touchStart = null;
      return;
    }
    const touch = event.touches[0];
    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      target: event.target,
      targetIsHorizontalOwner: isIntentionalHorizontalGestureOwner(event.target),
    };
  };

  const handleTouchMove = (event) => {
    if (!isMobileViewport() || !touchStart || event.touches?.length !== 1) return;
    if (isVisualViewportZoomed()) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (!shouldContainRegisteredHorizontalGesture({
      deltaX,
      deltaY,
      targetIsHorizontalOwner: touchStart.targetIsHorizontalOwner,
    })) return;

    // At the normal 1x visual viewport, contain accidental outer-page horizontal
    // drift while vertical scroll and intentional horizontal controls remain native.
    if (event.cancelable) event.preventDefault();
    resetMobileHorizontalViewport();
  };

  const finishTouch = () => {
    touchStart = null;
    scheduleCorrection();
  };

  const observer = new MutationObserver(scheduleCorrection);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('scroll', handleCapturedScroll, true);
  document.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
  document.addEventListener('touchend', finishTouch, { passive: true, capture: true });
  document.addEventListener('touchcancel', finishTouch, { passive: true, capture: true });
  window.addEventListener('pointerup', scheduleCorrection, { passive: true });
  window.addEventListener('resize', scheduleCorrection, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleCorrection, { passive: true });
  window.addEventListener('pageshow', forceRouteTop);
  window.addEventListener('shotlab:app-ready', forceRouteTop);

  scheduleCorrection();

  return () => {
    observer.disconnect();
    document.removeEventListener('scroll', handleCapturedScroll, true);
    document.removeEventListener('touchstart', handleTouchStart, true);
    document.removeEventListener('touchmove', handleTouchMove, true);
    document.removeEventListener('touchend', finishTouch, true);
    document.removeEventListener('touchcancel', finishTouch, true);
    window.removeEventListener('pointerup', scheduleCorrection);
    window.removeEventListener('resize', scheduleCorrection);
    window.visualViewport?.removeEventListener('resize', scheduleCorrection);
    window.removeEventListener('pageshow', forceRouteTop);
    window.removeEventListener('shotlab:app-ready', forceRouteTop);
    if (rafId != null) window.cancelAnimationFrame(rafId);
    clearRegisteredCoachRouteGeometry();
  };
}
