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

export function centerMobileRouteStage(source) {
  let next = source

  next = replaceOnce(
    next,
    `    grid-template-columns: 46px minmax(0, 1fr);\n    align-items: start;\n    column-gap: 10px;\n    row-gap: 8px;`,
    `    grid-template-columns: minmax(0, 1fr);\n    align-items: start;\n    justify-items: center;\n    row-gap: 8px;\n    text-align: center;`,
    'mobile masthead grid',
  )

  next = replaceOnce(
    next,
    `  .secondaryPageIntro__copy { min-width: 0; max-width: none; }`,
    `  .secondaryPageIntro__copy {\n    width: 100%;\n    min-width: 0;\n    max-width: 360px;\n    margin-inline: auto;\n    text-align: center;\n  }`,
    'mobile masthead copy',
  )

  next = replaceOnce(
    next,
    `    margin-top: 1px;\n    border: 1px solid rgba(7, 26, 34, .1);`,
    `    margin: 1px auto 0;\n    border: 1px solid rgba(7, 26, 34, .1);`,
    'mobile masthead mark centering',
  )

  next = replaceOnce(
    next,
    `    max-width: 9.8ch;\n    font-size: clamp(36px, 10vw, 42px) !important;`,
    `    max-width: 10.5ch;\n    margin-inline: auto;\n    font-size: clamp(36px, 10vw, 42px) !important;\n    text-align: center;`,
    'mobile masthead title centering',
  )

  next = replaceOnce(
    next,
    `    grid-column: 1 / -1;\n    width: 100%;\n    min-width: 0;\n    margin-top: 1px;\n    display: grid;\n    grid-template-columns: minmax(0, 1fr);\n    gap: 6px;`,
    `    grid-column: 1 / -1;\n    width: 100%;\n    max-width: 360px;\n    min-width: 0;\n    margin: 1px auto 0;\n    display: grid;\n    grid-template-columns: minmax(0, 1fr);\n    justify-items: center;\n    gap: 6px;`,
    'mobile masthead action rail centering',
  )

  next = replaceOnce(
    next,
    `    line-height: 1.25;\n    text-align: left;\n    text-overflow: ellipsis;`,
    `    line-height: 1.25;\n    text-align: center;\n    text-overflow: ellipsis;`,
    'mobile masthead status centering',
  )

  next = replaceOnce(
    next,
    `  .secondaryPageIntro { grid-template-columns: 44px minmax(0, 1fr); column-gap: 9px; }`,
    `  .secondaryPageIntro { grid-template-columns: minmax(0, 1fr); column-gap: 0; }`,
    'narrow masthead centering',
  )

  return next
}

export function applyMobileCenteredRouteStage({ cwd = process.cwd() } = {}) {
  const target = path.resolve(cwd, 'src/components/SecondaryPageSystem.css')
  const source = readFileSync(target, 'utf8')
  const next = centerMobileRouteStage(source)
  if (next !== source) writeFileSync(target, next)
  console.log('Centered ShotLab mobile secondary-route mastheads.')
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedFile === currentFile) applyMobileCenteredRouteStage()
