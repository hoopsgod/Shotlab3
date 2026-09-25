import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_ASSETS = path.resolve(process.cwd(), 'dist', 'assets')
const AUTHORITATIVE_STAGE = /\[data-team-identity-stage=(?:["'])?coach-mission-control(?:["'])?\]/
const AUTHORITATIVE_HEADER = /\[data-testid=(?:["'])?mission-control-team-header(?:["'])?\]/
const COMPONENT_HEADER_AUTHORITY = /^\.mcShellV3\s+(?:\.mcHeader(?:\s|[.:])|\.mcBrandLockup(?:\s|[.:]|$)|\.mcBrandCopy(?:\s|[.:]|$)|\.mcHeaderActions(?:\s|[.:]|$)|\.mcTeamSelect(?:[.:]|$)|\.mcBell(?:[.:]|$)|\.mcMobileMenu(?:[.:]|$))/
const COMPONENT_FALLBACK_AUTHORITY = /^\.mcShellV3\s+\.mc(?:Hero|Header)TeamMark\s+\.mcTeamFallback\b/
const COMPONENT_RAIL_BRAND_AUTHORITY = /^\.mcShellV3\s+\.mcRailBrand(?:\s|[.:]|$)/

const GEOMETRY = new Set([
  'width','height','min-width','min-height','max-width','max-height',
  'position','inset','top','right','bottom','left','transform','overflow',
  'padding','padding-top','padding-right','padding-bottom','padding-left',
  'margin','margin-top','margin-right','margin-bottom','margin-left',
])
const IDENTITY_COPY = new Set(['color','-webkit-text-fill-color','font-size','line-height','letter-spacing','text-transform'])
const HEADER_SURFACE = new Set(['display','position','top','min-height','height','padding','border','border-bottom','border-radius','background','color','box-shadow','backdrop-filter','-webkit-backdrop-filter'])
const HEADER_CONTROL = new Set(['display','width','height','min-width','min-height','padding','border','border-radius','background','color','box-shadow'])

function stripDeclarations(body, blocked) {
  return body.replace(/(^|;)(\s*)([-a-z]+)\s*:\s*([^;}]*)/gi, (match, lead, space, property) => {
    if (!blocked.has(property.toLowerCase())) return match
    return lead
  })
}

function arms(selector) {
  return selector.split(',').map((arm) => arm.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

function everyArmIsCurrentComponentAuthority(selector) {
  const selectorArms = arms(selector)
  return selectorArms.length > 0 && selectorArms.every((arm) =>
    AUTHORITATIVE_STAGE.test(arm)
    || AUTHORITATIVE_HEADER.test(arm)
    || COMPONENT_HEADER_AUTHORITY.test(arm)
    || COMPONENT_FALLBACK_AUTHORITY.test(arm)
    || COMPONENT_RAIL_BRAND_AUTHORITY.test(arm),
  )
}

function directlyTargets(selector, className) {
  return arms(selector).some((arm) => new RegExp(`\\.${className}(?:[.:][\\w-]+)*$`).test(arm))
}

function reconcileRule(selector, body) {
  const normalized = selector.replace(/\s+/g, ' ').trim()
  if (everyArmIsCurrentComponentAuthority(normalized)) return body

  if (directlyTargets(normalized, 'mcHeroTeamMark')) return stripDeclarations(body, GEOMETRY)
  if (normalized.includes('[data-testid="coach-primary-objective"]')) {
    if (/\bh1\b/.test(normalized)) return stripDeclarations(body, new Set([...GEOMETRY, ...IDENTITY_COPY]))
    return stripDeclarations(body, GEOMETRY)
  }
  if (directlyTargets(normalized, 'mcProgramIdentity') || directlyTargets(normalized, 'mcEyebrow')) return stripDeclarations(body, IDENTITY_COPY)
  if (directlyTargets(normalized, 'mcHeader')) return stripDeclarations(body, HEADER_SURFACE)
  if (directlyTargets(normalized, 'mcMobileMenu') || directlyTargets(normalized, 'mcBell') || directlyTargets(normalized, 'mcTeamSelect')) return stripDeclarations(body, HEADER_CONTROL)
  if (directlyTargets(normalized, 'mcBrandLockup') || directlyTargets(normalized, 'mcBrandCopy') || directlyTargets(normalized, 'mcHeaderTeamMark')) return stripDeclarations(body, new Set(['display', ...IDENTITY_COPY]))
  return body
}

export function enforceCoachMobileIdentityAuthority(css) {
  let changed = 0
  const selectors = []
  const output = css.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, body) => {
    const next = reconcileRule(selector, body)
    if (next !== body) {
      changed += 1
      selectors.push(selector.replace(/\s+/g, ' ').trim())
    }
    return `${selector}{${next}}`
  })
  return { css: output, changed, selectors }
}

async function main() {
  const entries = await readdir(DIST_ASSETS, { withFileTypes: true })
  let violatingFiles = 0
  let violatingRules = 0
  const violations = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.css')) continue
    const file = path.join(DIST_ASSETS, entry.name)
    const source = await readFile(file, 'utf8')
    const result = enforceCoachMobileIdentityAuthority(source)
    if (result.css === source) continue
    violatingFiles += 1
    violatingRules += result.changed
    for (const selector of result.selectors) violations.push(`${entry.name}: ${selector}`)
  }

  if (violatingRules) {
    const detail = violations.slice(0, 24).map((item) => `\n - ${item}`).join('')
    throw new Error(`Coach mobile identity authority verification failed: ${violatingRules} competing declaration set(s) remain across ${violatingFiles} production CSS asset(s). Fix the source authority instead of rewriting dist.${detail}`)
  }

  // CSSO may factor a declaration away from its original selector while
  // preserving the same cascade. Source contracts own exact declaration
  // placement; this production guard checks the optimized Coach asset itself
  // so another stylesheet cannot make a stripped title-stage bundle look
  // superficially complete.
  const coachEntry = entries.find((entry) => entry.isFile() && /^CoachWorkspaces-.*\.css$/.test(entry.name))
  if (!coachEntry) throw new Error('Coach mobile identity authority verification failed: CoachWorkspaces production CSS asset is missing.')
  const coachProductionCss = await readFile(path.join(DIST_ASSETS, coachEntry.name), 'utf8')
  const requiredAuthority = [
    ['mobile utility header authority', /\.mcShellV3\.is-mobile-shell \.mcHeader\[data-testid=mission-control-team-header\]\{display:none\}/],
    ['mobile Coach hero geometry authority', /\.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage=coach-mission-control\]\{[^}]*min-height:334px[^}]*margin-inline:0/],
    ['mobile Coach crest authority', /\.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage=coach-mission-control\] \.mcHeroIdentity\{[^}]*--coach-hero-crest:clamp\(104px,29vw,120px\)/],
    ['mobile metric control authority', /\.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage=coach-mission-control\] \.mcRealityStrip button\{[^}]*min-height:48px[^}]*padding:6px 12px/],
    ['mobile metric value authority', /\.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage=coach-mission-control\] \.mcRealityStrip strong\{[^}]*font:800 20px\/.95 var\(--mc-native\)/],
    ['mobile primary CTA authority', /\.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage=coach-mission-control\] \.mcPrimary\{[^}]*min-height:50px[^}]*margin-top:11px/],
  ]
  const missing = requiredAuthority.filter(([, pattern]) => !pattern.test(coachProductionCss)).map(([label]) => label)
  if (missing.length) {
    throw new Error(`Coach mobile identity authority verification failed: optimized CoachWorkspaces CSS lost canonical authority (${missing.join(', ')}).`)
  }

  console.log('Coach mobile identity authority verified: canonical mobile authority remains in the optimized CoachWorkspaces asset; roster geometry is source-owned and media-independent; computed-style certification owns final association.')
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error); process.exit(1) })
