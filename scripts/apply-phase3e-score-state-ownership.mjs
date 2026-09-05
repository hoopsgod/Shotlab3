import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
let source = fs.readFileSync(appPath, 'utf8')

const importAnchor = 'import { supabase } from "./lib/supabase.js";\n'
const scoreImport = 'import { hasPendingScoreRows, reconcilePendingScoreRows } from "./lib/scorePersistenceService.js";\n'
if (!source.includes(scoreImport)) {
  if (!source.includes(importAnchor)) throw new Error('Phase 3E score persistence import anchor missing.')
  source = source.replace(importAnchor, `${importAnchor}${scoreImport}`)
}

const remoteRowsAnchor = '        const remoteRows = hasData(data) ? buildAppRows(k, data, { source: "remote" }) : [];\n'
const scoreRead = '        if(k==="sl:scores"&&Array.isArray(data)&&hasPendingScoreRows(globalThis?.localStorage))return reconcilePendingScoreRows({storage:globalThis?.localStorage,localRows,remoteRows});\n'
if (!source.includes(scoreRead)) {
  if (!source.includes(remoteRowsAnchor)) throw new Error('Phase 3E score read reconciliation anchor missing.')
  source = source.replace(remoteRowsAnchor, `${remoteRowsAnchor}${scoreRead}`)
}

if (!source.includes(scoreImport) || !source.includes(scoreRead)) {
  throw new Error('Phase 3E score state ownership did not converge.')
}

fs.writeFileSync(appPath, source)
console.log('Applied Phase 3E pending score ownership to startup reads.')
