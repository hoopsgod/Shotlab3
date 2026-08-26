import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_ASSETS = path.resolve(process.cwd(), 'dist', 'assets')
const AUTHORITATIVE_STAGE = /\[data-team-identity-stage=(?:["'])?coach-mission-control(?:["'])?\]/
const AUTHORITATIVE_HEADER = /\[data-testid=(?:["'])?mission-control-team-header(?:["'])?\]/

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

function reconcileRule(selector, body) {
  const normalized = selector.replace(/\s+/g, ' ').trim()
  const isAuthoritativeStage = AUTHORITATIVE_STAGE.test(normalized)
  const isAuthoritativeHeader = AUTHORITATIVE_HEADER.test(normalized)
  if (isAuthoritativeStage || isAuthoritativeHeader) return body

  if (normalized.includes('.mcHeroTeamMark')) return stripDeclarations(body, GEOMETRY)
  if (normalized.includes('[data-testid="coach-primary-objective"]')) {
    if (/\bh1\b/.test(normalized)) return stripDeclarations(body, new Set([...GEOMETRY, ...IDENTITY_COPY]))
    return stripDeclarations(body, GEOMETRY)
  }
  if (normalized.includes('.mcProgramIdentity') || normalized.includes('.mcEyebrow')) return stripDeclarations(body, IDENTITY_COPY)
  if (normalized.includes('.mcHeader') && !normalized.includes('.mcHeaderActions')) return stripDeclarations(body, HEADER_SURFACE)
  if (normalized.includes('.mcMobileMenu') || normalized.includes('.mcBell') || normalized.includes('.mcTeamSelect')) return stripDeclarations(body, HEADER_CONTROL)
  if (normalized.includes('.mcBrandLockup') || normalized.includes('.mcBrandCopy') || normalized.includes('.mcHeaderTeamMark')) return stripDeclarations(body, new Set(['display', ...IDENTITY_COPY]))
  return body
}

export function enforceCoachMobileIdentityAuthority(css) {
  let changed = 0
  const output = css.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, body) => {
    const next = reconcileRule(selector, body)
    if (next !== body) changed += 1
    return `${selector}{${next}}`
  })
  return { css: output, changed }
}

async function main() {
  const entries = await readdir(DIST_ASSETS, { withFileTypes: true })
  let violatingFiles = 0
  let violatingRules = 0
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.css')) continue
    const file = path.join(DIST_ASSETS, entry.name)
    const source = await readFile(file, 'utf8')
    const result = enforceCoachMobileIdentityAuthority(source)
    if (result.css === source) continue
    violatingFiles += 1
    violatingRules += result.changed
  }

  if (violatingRules) {
    throw new Error(`Coach mobile identity authority verification failed: ${violatingRules} competing declaration set(s) remain across ${violatingFiles} production CSS asset(s). Fix the source authority instead of rewriting dist.`)
  }
  console.log('Coach mobile identity authority verified: production CSS requires no post-build Coach rewrite.')
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error); process.exit(1) })
