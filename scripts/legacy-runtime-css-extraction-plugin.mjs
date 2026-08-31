import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { transform as transformCss } from 'lightningcss'

const APP_SUFFIX = '/src/App.jsx'
const LEGACY_STYLE_SOURCE = path.resolve(process.cwd(), 'src/styles/appLegacyStyles.js')
const LEGACY_STYLE_EXPORTS = ['_STYLES_CSS', '_PLAYER_COMPACT_DASHBOARD_CSS', '_PAGE_SIGNATURE_CSS', '_DESKTOP_SHELL_CSS']
const LEGACY_STYLE_ASSET = 'assets/legacy-runtime.css'
const LEGACY_STYLE_IMPORT = /import\s*\{\s*_DESKTOP_SHELL_CSS\s*,\s*_PAGE_SIGNATURE_CSS\s*,\s*_PLAYER_COMPACT_DASHBOARD_CSS\s*,\s*_STYLES_CSS\s*\}\s*from\s*["']\.\/styles\/appLegacyStyles\.js["'];?/
const LEGACY_STYLE_COMPONENT = /const Styles=\(\)=>\s*<>\s*<style>\{_STYLES_CSS\}<\/style>\s*<style>\{_PLAYER_COMPACT_DASHBOARD_CSS\}<\/style>\s*<style>\{_PAGE_SIGNATURE_CSS\}<\/style>\s*<style>\{_DESKTOP_SHELL_CSS\}<\/style>\s*<\/>\s*;/

// These are the same default-theme values used by appLegacyStylesRuntime.js.
// The legacy payload has always been hydrated from default app tokens rather
// than per-team runtime branding; moving it to CSS must preserve that contract.
const LEGACY_STYLE_TOKENS = Object.freeze({
  BG: '#F3F1EA',
  BORDER_CLR: 'rgba(17, 26, 33, 0.10)',
  CYAN: '#176B87',
  FB: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
  FD: "'Bebas Neue','Impact','Arial Black',sans-serif",
  ORANGE: '#A85F0C',
  VOLT: '#C8FF1A',
})

function normalizeModuleId(id = '') {
  return String(id).replaceAll('\\', '/')
}

function extractStyleTemplate(source, exportName) {
  const openingMarker = `export const ${exportName}=\``
  const openingIndex = source.indexOf(openingMarker)
  if (openingIndex === -1) throw new Error(`Legacy style export ${exportName} was not found during CSS extraction.`)
  const valueStart = openingIndex + openingMarker.length
  const valueEnd = source.indexOf('`;', valueStart)
  if (valueEnd === -1) throw new Error(`Legacy style export ${exportName} is not terminated during CSS extraction.`)
  return source.slice(valueStart, valueEnd)
}

function hydrateLegacyStyle(template, exportName) {
  let css = template
  for (const [tokenName, tokenValue] of Object.entries(LEGACY_STYLE_TOKENS)) {
    css = css.replaceAll(`\${${tokenName}}`, tokenValue)
  }
  const unresolved = css.match(/\$\{[A-Z_]+\}/g)
  if (unresolved?.length) {
    throw new Error(`Legacy style export ${exportName} has unresolved build tokens: ${[...new Set(unresolved)].join(', ')}`)
  }
  return css
}

async function buildLegacyStyleAsset() {
  const source = await readFile(LEGACY_STYLE_SOURCE, 'utf8')
  const hydrated = LEGACY_STYLE_EXPORTS
    .map((exportName) => hydrateLegacyStyle(extractStyleTemplate(source, exportName), exportName))
    .join('\n')
  const transformed = transformCss({
    filename: path.basename(LEGACY_STYLE_ASSET),
    code: Buffer.from(hydrated),
    minify: true,
    sourceMap: false,
  })
  return transformed.code.toString('utf8')
}

export function createLegacyRuntimeCssExtractionPlugin() {
  let assetEmitted = false
  return {
    name: 'shotlab-extract-legacy-runtime-css',
    apply: 'build',
    enforce: 'pre',
    async buildStart() {
      const css = await buildLegacyStyleAsset()
      this.emitFile({ type: 'asset', fileName: LEGACY_STYLE_ASSET, source: css })
      assetEmitted = true
    },
    transform(source, id) {
      if (!normalizeModuleId(id).endsWith(APP_SUFFIX)) return null
      if (!assetEmitted) throw new Error('Legacy runtime stylesheet asset was not emitted before App transformation.')
      if (!LEGACY_STYLE_IMPORT.test(source)) throw new Error('Expected App legacy style import is missing during production extraction.')
      if (!LEGACY_STYLE_COMPONENT.test(source)) throw new Error('Expected App legacy Styles component is missing during production extraction.')

      const next = source
        .replace(LEGACY_STYLE_IMPORT, '')
        .replace(
          LEGACY_STYLE_COMPONENT,
          `const Styles=()=> <link rel="stylesheet" href="./${LEGACY_STYLE_ASSET}" data-shotlab-legacy-runtime="1"/>;`,
        )
      return { code: next, map: null }
    },
  }
}
