const MOBILE_VIEWPORT_QUERY = '(max-width: 760px)';

const LOCKED_VERTICAL_OWNER_SELECTORS = [
  '.app-shell.is-mobile',
  '.app-shell.is-mobile > .shell-main',
  '.app-shell.is-mobile > .shell-main > .content-wrap',
  '.app-shell.is-mobile .performance-workspace',
  '.app-shell.is-mobile .player-scroll-container',
  '.app-shell.is-mobile .coach-scroll-container',
  '.app-shell.is-mobile .coach-route-scroll-container',
  '.app-shell.is-mobile .coach-home-dashboard',
  '.app-shell.is-mobile [data-testid="coach-command-center-full"]',
  '.app-shell.is-mobile [data-testid="player-daily-command-center"]',
];

const LOCKED_VERTICAL_OWNER_SELECTOR = LOCKED_VERTICAL_OWNER_SELECTORS.join(',');

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.(MOBILE_VIEWPORT_QUERY).matches ?? window.innerWidth <= 760;
}

function resetNodeHorizontalOffset(node) {
  if (!node || typeof node.scrollLeft !== 'number') return false;
  if (Math.abs(node.scrollLeft) <= 0.5) return false;
  node.scrollLeft = 0;
  return true;
}

export function resetMobileHorizontalViewport() {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !isMobileViewport()) return false;

  let corrected = false;
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
  const scheduleCorrection = () => {
    if (!isMobileViewport() || rafId != null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      resetMobileHorizontalViewport();
    });
  };

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

  const observer = new MutationObserver(scheduleCorrection);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('scroll', handleCapturedScroll, true);
  window.addEventListener('touchend', scheduleCorrection, { passive: true });
  window.addEventListener('pointerup', scheduleCorrection, { passive: true });
  window.addEventListener('resize', scheduleCorrection, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleCorrection, { passive: true });
  window.addEventListener('shotlab:app-ready', scheduleCorrection);

  scheduleCorrection();

  return () => {
    observer.disconnect();
    document.removeEventListener('scroll', handleCapturedScroll, true);
    window.removeEventListener('touchend', scheduleCorrection);
    window.removeEventListener('pointerup', scheduleCorrection);
    window.removeEventListener('resize', scheduleCorrection);
    window.visualViewport?.removeEventListener('resize', scheduleCorrection);
    window.removeEventListener('shotlab:app-ready', scheduleCorrection);
    if (rafId != null) window.cancelAnimationFrame(rafId);
  };
}
