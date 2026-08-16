import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const fail = message => { throw new Error(`[mobile-centered-route-stage] ${message}`) }

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source
  const count = source.split(from).length - 1
  if (count !== 1) fail(`${label}: expected one source anchor, found ${count}`)
  return source.replace(from, to)
}

function replaceDeclarationsInBlock(source, blockStart, replacements, label) {
  const start = source.indexOf(blockStart)
  if (start < 0) fail(`${label}: owning block not found`)
  const end = source.indexOf('\n  }', start + blockStart.length)
  if (end < 0) fail(`${label}: owning block end not found`)
  let block = source.slice(start, end + 4)
  replacements.forEach(([from, to, declarationLabel]) => {
    if (block.includes(to)) return
    const count = block.split(from).length - 1
    if (count !== 1) fail(`${label} ${declarationLabel}: expected one declaration, found ${count}`)
    block = block.replace(from, to)
  })
  return `${source.slice(0, start)}${block}${source.slice(end + 4)}`
}

export function centerMobileRouteStage(source) {
  let next = source
  next = replaceOnce(next,
    `    grid-template-columns: 46px minmax(0, 1fr);\n    align-items: start;\n    column-gap: 10px;\n    row-gap: 8px;`,
    `    grid-template-columns: minmax(0, 1fr);\n    align-items: start;\n    justify-items: center;\n    row-gap: 3px;\n    text-align: center;`,
    'mobile masthead grid')
  next = replaceOnce(next, `    padding: 7px 0 12px;`, `    padding: 2px 0 7px;`, 'mobile masthead vertical runway')
  next = replaceOnce(next,
    `  .secondaryPageIntro__copy { min-width: 0; max-width: none; }`,
    `  .secondaryPageIntro__copy { width: 100%; max-width: 360px; text-align: center; }`,
    'mobile masthead copy')
  next = replaceOnce(next, `    width: 46px;\n    height: 54px;`, `    width: 56px;\n    height: 56px;`, 'mobile masthead team mark geometry')
  next = replaceDeclarationsInBlock(next,
    `  .secondaryPageIntro__icon {\n    position: static;\n    width: 56px;\n    height: 56px;`,
    [
      [`    margin-top: 1px;`, `    margin: 0 auto;`, 'margin'],
      [`    border: 1px solid rgba(7, 26, 34, .1);`, `    border: 0;`, 'border'],
      [`    background: #0b2028;`, `    background: transparent;`, 'background'],
    ],
    'mobile masthead team mark treatment')
  next = replaceOnce(next,
    `    max-width: 9.8ch;\n    font-size: clamp(36px, 10vw, 42px) !important;`,
    `    max-width: 10.5ch;\n    margin-inline: auto;\n    font-size: clamp(36px, 10vw, 42px) !important;`,
    'mobile masthead title centering')
  next = replaceOnce(next,
    `    grid-column: 1 / -1;\n    width: 100%;\n    min-width: 0;\n    margin-top: 1px;\n    display: grid;\n    grid-template-columns: minmax(0, 1fr);\n    gap: 6px;`,
    `    grid-column: 1 / -1;\n    width: 100%;\n    max-width: 360px;\n    min-width: 0;\n    display: grid;\n    grid-template-columns: minmax(0, 1fr);\n    gap: 5px;`,
    'mobile masthead action rail centering')
  next = replaceOnce(next,
    `    line-height: 1.25;\n    text-align: left;\n    text-overflow: ellipsis;`,
    `    line-height: 1.25;\n    text-align: center;\n    text-overflow: ellipsis;`,
    'mobile masthead status centering')
  next = replaceOnce(next,
    `  .secondaryPageIntro { grid-template-columns: 44px minmax(0, 1fr); column-gap: 9px; }`,
    `  .secondaryPageIntro { grid-template-columns: minmax(0, 1fr); column-gap: 0; }`,
    'narrow masthead centering')
  next = replaceOnce(next,
    `  .secondaryPageIntro__icon { width: 44px; height: 50px; border-radius: 0; }`,
    `  .secondaryPageIntro__icon { width: 54px; height: 54px; border-radius: 0; }`,
    'narrow masthead team mark geometry')
  return next
}

export function applyMobileCenteredRouteStage({ cwd = process.cwd() } = {}) {
  const target = path.resolve(cwd, 'src/components/SecondaryPageSystem.css')
  const source = readFileSync(target, 'utf8')
  const next = centerMobileRouteStage(source)
  if (next !== source) writeFileSync(target, next)
  console.log('Centered and compacted ShotLab mobile secondary-route mastheads.')
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedFile === currentFile) applyMobileCenteredRouteStage()
