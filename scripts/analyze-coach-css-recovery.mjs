import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import path from 'node:path'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist', 'assets')
const reportDir = path.join(rootDir, 'artifacts', 'performance')
const layerFiles = [
  'src/components/SecondaryPageSystem.css',
  'src/components/Phase2PremiumActionLayer.css',
  'src/components/Phase3CoachLeaderboardHierarchy.css',
  'src/styles/Phase2PremiumRosterLayer.css',
  'src/components/CoachProgramScoreDrawer.module.css',
  'src/screens/CoachTeamBrandingScreen.css',
  'src/components/CoachMissionControlV2.css',
  'src/components/CoachMissionControlShell.css',
  'src/components/CoachMissionControlHeader.css',
  'src/components/CoachMissionControlPolish.css',
  'src/components/CoachMissionControl2026.css',
  'src/components/CoachMissionControlFinal.css',
  'src/components/CoachActivationPath.css',
  'src/components/CoachPriorityOverlay.css',
  'src/components/ExperiencePrimitives.module.css',
  'src/components/CoachDashboardPhase2.module.css',
  'src/components/Phase2PremiumEmptyStateLanguage.css',
]

function parseDeclarations(body) {
  const declarations = []
  let start = 0
  let paren = 0
  let quote = ''
  for (let index = 0; index <= body.length; index += 1) {
    const char = body[index] || ';'
    if (quote) {
      if (char === '\\') index += 1
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") { quote = char; continue }
    if (char === '(') paren += 1
    else if (char === ')') paren = Math.max(0, paren - 1)
    else if (char === ';' && paren === 0) {
      const text = body.slice(start, index).trim()
      start = index + 1
      if (!text) continue
      const colon = text.indexOf(':')
      if (colon <= 0) continue
      declarations.push({ property: text.slice(0, colon).trim(), value: text.slice(colon + 1).trim(), text })
    }
  }
  return declarations
}

function analyzeRepeatedSelectors(css) {
  const occurrences = new Map()
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g
  for (const match of css.matchAll(rulePattern)) {
    const selector = match[1].trim()
    if (!selector || selector.startsWith('@') || selector.includes('from') || selector.includes('to')) continue
    const declarations = parseDeclarations(match[2])
    if (!declarations.length) continue
    const rows = occurrences.get(selector) || []
    rows.push({ index: match.index, declarations })
    occurrences.set(selector, rows)
  }

  const repeated = []
  let exactDuplicateDeclarationBytes = 0
  let overwrittenDeclarationBytes = 0
  for (const [selector, rows] of occurrences) {
    if (rows.length < 2) continue
    const seenLater = new Map()
    let exactBytes = 0
    let overwriteBytes = 0
    for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex -= 1) {
      const row = rows[rowIndex]
      for (let declIndex = row.declarations.length - 1; declIndex >= 0; declIndex -= 1) {
        const declaration = row.declarations[declIndex]
        const later = seenLater.get(declaration.property)
        if (later) {
          overwriteBytes += declaration.text.length + 1
          if (later.value === declaration.value) exactBytes += declaration.text.length + 1
        }
        if (!seenLater.has(declaration.property)) seenLater.set(declaration.property, declaration)
      }
    }
    if (exactBytes || overwriteBytes) {
      exactDuplicateDeclarationBytes += exactBytes
      overwrittenDeclarationBytes += overwriteBytes
      repeated.push({ selector, occurrences: rows.length, exactDuplicateDeclarationBytes: exactBytes, overwrittenDeclarationBytes: overwriteBytes })
    }
  }
  repeated.sort((a, b) => b.overwrittenDeclarationBytes - a.overwrittenDeclarationBytes)
  return { repeated, exactDuplicateDeclarationBytes, overwrittenDeclarationBytes }
}

const entries = await readdir(distDir, { withFileTypes: true })
const coachAssetName = entries.find((entry) => entry.isFile() && /^CoachWorkspaces-.*\.css$/.test(entry.name))?.name
if (!coachAssetName) throw new Error('CoachWorkspaces CSS asset not found after build.')
const coachAssetPath = path.join(distDir, coachAssetName)
const coachCss = await readFile(coachAssetPath, 'utf8')
const selectorAnalysis = analyzeRepeatedSelectors(coachCss)

const layers = []
for (const relativePath of layerFiles) {
  const absolutePath = path.join(rootDir, relativePath)
  const info = await stat(absolutePath).catch(() => null)
  if (!info?.isFile()) continue
  const source = await readFile(absolutePath)
  layers.push({
    file: relativePath,
    bytes: source.byteLength,
    gzipBytes: gzipSync(source, { level: 9 }).byteLength,
  })
}
layers.sort((a, b) => b.bytes - a.bytes)

const report = {
  generatedAt: new Date().toISOString(),
  coachAsset: {
    file: `assets/${coachAssetName}`,
    bytes: Buffer.byteLength(coachCss),
    gzipBytes: gzipSync(Buffer.from(coachCss), { level: 9 }).byteLength,
  },
  sourceLayers: layers,
  repeatedSelectorAnalysis: {
    selectorCount: selectorAnalysis.repeated.length,
    exactDuplicateDeclarationBytes: selectorAnalysis.exactDuplicateDeclarationBytes,
    overwrittenDeclarationBytes: selectorAnalysis.overwrittenDeclarationBytes,
    topSelectors: selectorAnalysis.repeated.slice(0, 40),
  },
}

await mkdir(reportDir, { recursive: true })
await writeFile(path.join(reportDir, 'coach-css-recovery-analysis.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(`Coach CSS analysis: ${report.coachAsset.bytes} raw / ${report.coachAsset.gzipBytes} gzip bytes.`)
console.log(`Repeated selector estimate: ${report.repeatedSelectorAnalysis.exactDuplicateDeclarationBytes} exact duplicate declaration bytes; ${report.repeatedSelectorAnalysis.overwrittenDeclarationBytes} same-property overwrite bytes.`)
console.table(layers.slice(0, 12))
