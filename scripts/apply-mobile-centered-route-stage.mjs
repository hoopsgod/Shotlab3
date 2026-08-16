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
    `    grid-template-columns: minmax(0, 1fr);\n    align-items: start;\n    justify-items: center;\n    row-gap: 5px;\n    text-align: center;`,
    'mobile masthead grid',
  )

  next = replaceOnce(
    next,
    `    padding: 7px 0 12px;`,
    `    padding: 4px 0 8px;`,
    'mobile masthead vertical runway',
  )

  next = replaceOnce(
    next,
    `  .secondaryPageIntro__copy { min-width: 0; max-width: none; }`,
    `  .secondaryPageIntro__copy {\n    width: 100%;\n    min-width: 0;\n    max-width: 360px;\n    margin-inline: auto;\n    text-align: center;\n  }`,
    'mobile masthead copy',
  )

  next = replaceOnce(
    next,
    `    width: 46px;\n    height: 54px;`,
    `    width: 42px;\n    height: 42px;`,
    'mobile masthead mark geometry',
  )

  next = replaceOnce(
    next,
    `    margin-top: 1px;\n    border: 1px solid rgba(7, 26, 34, .1);`,
    `    margin: 0 auto;\n    border: 1px solid rgba(7, 26, 34, .1);`,
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
    `    grid-column: 1 / -1;\n    width: 100%;\n    max-width: 360px;\n    min-width: 0;\n    margin: 0 auto;\n    display: grid;\n    grid-template-columns: minmax(0, 1fr);\n    justify-items: center;\n    gap: 5px;`,
    'mobile masthead action rail centering',
  )

  next = replaceOnce(
    next,
    `    line-height: 1.25;\n    text-align: left;\n    text-overflow: ellipsis;`,
    `    line-height: 1.25;\n    text-align: center;\n    text-overflow: ellipsis;`,
    'mobile masthead status centering',
  )

  const detailRule = `  .coachPlayerDetailWorkspace .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle {\n    max-width: 16ch !important;\n    white-space: normal;\n  }\n`
  if (!next.includes(detailRule)) {
    const narrowAnchor = `}\n\n@media (max-width: 430px) {\n  .secondaryPageIntro { grid-template-columns: 44px minmax(0, 1fr); column-gap: 9px; }`
    const narrowReplacement = `${detailRule}}\n\n@media (max-width: 430px) {\n  .secondaryPageIntro { grid-template-columns: 44px minmax(0, 1fr); column-gap: 9px; }`
    next = replaceOnce(next, narrowAnchor, narrowReplacement, 'Coach player-detail title measure')
  }

  next = replaceOnce(
    next,
    `  .secondaryPageIntro { grid-template-columns: 44px minmax(0, 1fr); column-gap: 9px; }`,
    `  .secondaryPageIntro { grid-template-columns: minmax(0, 1fr); column-gap: 0; }`,
    'narrow masthead centering',
  )

  next = replaceOnce(
    next,
    `  .secondaryPageIntro__icon { width: 44px; height: 50px; border-radius: 0; }`,
    `  .secondaryPageIntro__icon { width: 40px; height: 40px; border-radius: 0; }`,
    'narrow masthead mark geometry',
  )

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
