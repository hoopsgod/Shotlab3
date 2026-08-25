const VIEWPORT_DEBUG_PARAM = 'viewportDebug'
const DEBUG_PANEL_ID = 'shotlab-viewport-debug'
const MOBILE_QUERY = '(max-width: 760px)'

const TARGETS = [
  ['routeOwner', '.coach-route-scroll-container'],
  ['secondaryShell', '.secondaryPageShell'],
  ['playersDashboard', '[data-testid="coach-players-interactive-dashboard"]'],
  ['primaryDecision', '[data-visual-role="primary-decision"]'],
  ['eventsDashboard', '[data-testid="coach-events-interactive-dashboard"]'],
  ['homeFocusGrid', '[data-testid="coach-command-center-full"] .mcFocusGrid'],
]

function round(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : null
}

function isVisible(node) {
  if (!(node instanceof Element)) return false
  const rect = node.getBoundingClientRect()
  const style = window.getComputedStyle(node)
  return rect.width > 0
    && rect.height > 0
    && style.display !== 'none'
    && style.visibility !== 'hidden'
}

function describeNode(node) {
  if (!(node instanceof Element)) return 'unknown'
  const testId = node.getAttribute('data-testid')
  if (testId) return `[data-testid="${testId}"]`
  if (node.id) return `#${node.id}`
  const classes = Array.from(node.classList || []).slice(0, 3)
  return `${node.tagName.toLowerCase()}${classes.length ? `.${classes.join('.')}` : ''}`
}

function measureNode(node) {
  if (!(node instanceof Element)) return null
  const rect = node.getBoundingClientRect()
  const style = window.getComputedStyle(node)
  return {
    node: describeNode(node),
    left: round(rect.left),
    right: round(rect.right),
    width: round(rect.width),
    clientWidth: round(node.clientWidth),
    scrollWidth: round(node.scrollWidth),
    cssWidth: style.width,
    minWidth: style.minWidth,
    maxWidth: style.maxWidth,
    paddingLeft: style.paddingLeft,
    paddingRight: style.paddingRight,
    marginLeft: style.marginLeft,
    marginRight: style.marginRight,
    boxSizing: style.boxSizing,
    overflowX: style.overflowX,
    transform: style.transform,
    position: style.position,
  }
}

function findFirstVisible(selector) {
  return Array.from(document.querySelectorAll(selector)).find(isVisible) || null
}

function collectOverflowOffenders(layoutWidth) {
  const offenders = []
  document.body?.querySelectorAll('*').forEach((node) => {
    if (!(node instanceof Element) || node.id === DEBUG_PANEL_ID || node.closest?.(`#${DEBUG_PANEL_ID}`) || !isVisible(node)) return
    const rect = node.getBoundingClientRect()
    const overflowRight = rect.right - layoutWidth
    const overflowLeft = 0 - rect.left
    const overflow = Math.max(overflowRight, overflowLeft)
    if (overflow <= 1) return
    offenders.push({
      node: describeNode(node),
      left: round(rect.left),
      right: round(rect.right),
      width: round(rect.width),
      overflow: round(overflow),
    })
  })

  return offenders
    .sort((a, b) => (b.overflow || 0) - (a.overflow || 0))
    .slice(0, 6)
}

export function collectMobileViewportDebugSnapshot() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  const root = document.documentElement
  const body = document.body
  const visual = window.visualViewport
  const layoutWidth = root?.clientWidth || window.innerWidth || 0

  const targets = {}
  TARGETS.forEach(([label, selector]) => {
    const node = findFirstVisible(selector)
    targets[label] = node ? measureNode(node) : null
  })

  return {
    href: window.location.href,
    userAgent: navigator.userAgent,
    mobileQuery: window.matchMedia?.(MOBILE_QUERY).matches ?? null,
    window: {
      innerWidth: round(window.innerWidth),
      innerHeight: round(window.innerHeight),
      scrollX: round(window.scrollX),
      scrollY: round(window.scrollY),
      devicePixelRatio: round(window.devicePixelRatio),
    },
    documentElement: {
      clientWidth: round(root?.clientWidth),
      clientHeight: round(root?.clientHeight),
      scrollWidth: round(root?.scrollWidth),
      scrollHeight: round(root?.scrollHeight),
    },
    body: {
      clientWidth: round(body?.clientWidth),
      scrollWidth: round(body?.scrollWidth),
    },
    screen: {
      width: round(window.screen?.width),
      height: round(window.screen?.height),
      availWidth: round(window.screen?.availWidth),
      availHeight: round(window.screen?.availHeight),
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
    overflowOffenders: collectOverflowOffenders(layoutWidth),
  }
}

function formatMetric(label, value) {
  return `${label}: ${value == null ? 'n/a' : value}`
}

function formatTarget(label, target) {
  if (!target) return `${label}: not found`
  return [
    `${label}: ${target.node}`,
    `  rect L/R/W ${target.left} / ${target.right} / ${target.width}`,
    `  client/scroll ${target.clientWidth} / ${target.scrollWidth}`,
    `  css width ${target.cssWidth} min ${target.minWidth} max ${target.maxWidth}`,
    `  pad L/R ${target.paddingLeft} / ${target.paddingRight}`,
    `  margin L/R ${target.marginLeft} / ${target.marginRight}`,
    `  box ${target.boxSizing} overflowX ${target.overflowX}`,
    `  transform ${target.transform} position ${target.position}`,
  ].join('\n')
}

function formatSnapshot(snapshot) {
  const visual = snapshot.visualViewport
  const lines = [
    'VIEWPORT DEBUG (?viewportDebug=1)',
    `path: ${window.location.pathname}`,
    `UA: ${snapshot.userAgent}`,
    '',
    formatMetric('inner W×H', `${snapshot.window.innerWidth} × ${snapshot.window.innerHeight}`),
    formatMetric('doc client W×H', `${snapshot.documentElement.clientWidth} × ${snapshot.documentElement.clientHeight}`),
    formatMetric('doc scroll W', snapshot.documentElement.scrollWidth),
    formatMetric('body client/scroll W', `${snapshot.body.clientWidth} / ${snapshot.body.scrollWidth}`),
    formatMetric('screen W×H', `${snapshot.screen.width} × ${snapshot.screen.height}`),
    formatMetric('DPR', snapshot.window.devicePixelRatio),
    formatMetric('window scroll X', snapshot.window.scrollX),
    visual
      ? `visual W×H ${visual.width} × ${visual.height} | scale ${visual.scale} | offsetLeft ${visual.offsetLeft} | pageLeft ${visual.pageLeft}`
      : 'visualViewport: unavailable',
    '',
    ...Object.entries(snapshot.targets).map(([label, target]) => formatTarget(label, target)),
    '',
    'TOP LAYOUT OVERFLOW OFFENDERS',
    ...(snapshot.overflowOffenders.length
      ? snapshot.overflowOffenders.map((item) => `${item.node} L${item.left} R${item.right} W${item.width} overflow ${item.overflow}`)
      : ['none > 1px']),
  ]
  return lines.join('\n')
}

function viewportDebugEnabled() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get(VIEWPORT_DEBUG_PARAM) === '1'
}

export function installMobileViewportDebug() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !viewportDebugEnabled()) return () => {}

  let panel = null
  let rafId = null
  let observer = null

  const render = () => {
    rafId = null
    if (!document.body) return
    if (!panel) {
      panel = document.createElement('aside')
      panel.id = DEBUG_PANEL_ID
      panel.setAttribute('aria-label', 'ShotLab mobile viewport debug')
      panel.style.cssText = [
        'position:fixed',
        'left:8px',
        'right:8px',
        'top:8px',
        'z-index:2147483647',
        'max-height:48vh',
        'overflow:auto',
        'box-sizing:border-box',
        'padding:10px',
        'border:1px solid rgba(200,255,0,.8)',
        'border-radius:10px',
        'background:rgba(8,8,8,.94)',
        'color:#f5f5f5',
        'white-space:pre-wrap',
        'overflow-wrap:anywhere',
        'font:10px/1.35 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
        '-webkit-text-size-adjust:100%',
        'text-size-adjust:100%',
        'box-shadow:0 10px 30px rgba(0,0,0,.4)',
      ].join(';')
      document.body.appendChild(panel)
    }

    const snapshot = collectMobileViewportDebugSnapshot()
    window.__shotlabViewportDebugSnapshot = snapshot
    panel.textContent = formatSnapshot(snapshot)
  }

  const schedule = () => {
    if (rafId != null) return
    rafId = window.requestAnimationFrame(render)
  }

  const handleMutations = (mutations) => {
    const hasRelevantMutation = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target?.parentElement
      return !target?.closest?.(`#${DEBUG_PANEL_ID}`)
    })
    if (hasRelevantMutation) schedule()
  }

  observer = new MutationObserver(handleMutations)
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true })

  window.addEventListener('resize', schedule, { passive: true })
  window.addEventListener('scroll', schedule, { passive: true, capture: true })
  window.visualViewport?.addEventListener('resize', schedule, { passive: true })
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('shotlab:app-ready', schedule)
  window.setTimeout(schedule, 250)
  window.setTimeout(schedule, 1000)
  schedule()

  return () => {
    observer?.disconnect()
    window.removeEventListener('resize', schedule)
    window.removeEventListener('scroll', schedule, true)
    window.visualViewport?.removeEventListener('resize', schedule)
    window.visualViewport?.removeEventListener('scroll', schedule)
    window.removeEventListener('shotlab:app-ready', schedule)
    if (rafId != null) window.cancelAnimationFrame(rafId)
    panel?.remove()
    delete window.__shotlabViewportDebugSnapshot
  }
}
