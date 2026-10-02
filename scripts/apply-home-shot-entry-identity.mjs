import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const importSource = `  validateHomeShotLogInput,\n} from "./lib/homeShotLogging.js";`
const importReplacement = `  validateHomeShotLogInput,\n  isSameHomeShotLogEntry,\n} from "./lib/homeShotLogging.js";`
const legacyIdentitySource = 'const isSameHomeShotEntry=(a,b)=>String(a?.email||"").toLowerCase()===String(b?.email||"").toLowerCase()&&String(a?.teamId||a?.team_id||"")===String(b?.teamId||b?.team_id||"")&&String(a?.date||"")===String(b?.date||"")&&Number(a?.made||0)===Number(b?.made||0);'
const identityReplacement = 'const isSameHomeShotEntry=isSameHomeShotLogEntry;'

async function main() {
  let source = await readFile(appPath, 'utf8')
  let changed = false

  if (!source.includes('  isSameHomeShotLogEntry,\n} from "./lib/homeShotLogging.js";')) {
    if (!source.includes(importSource)) throw new Error('Could not find the home-shot logging import contract in src/App.jsx.')
    source = source.replace(importSource, importReplacement)
    changed = true
  }

  if (source.includes(legacyIdentitySource)) {
    source = source.replace(legacyIdentitySource, identityReplacement)
    changed = true
  } else if (!source.includes(identityReplacement)) {
    throw new Error('Could not find the home-shot entry identity contract in src/App.jsx.')
  }

  if (changed) {
    await writeFile(appPath, source)
    console.log('Applied stable home-shot entry identity; repeated same-count logs remain distinct.')
  } else {
    console.log('Stable home-shot entry identity already applied.')
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
