import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const servicePath = path.resolve(process.cwd(), 'src/lib/scorePersistenceService.js')
const app = fs.readFileSync(appPath, 'utf8')
const service = fs.readFileSync(servicePath, 'utf8')

const legacyAppScoreGuard = 'k==="sl:scores"'
if (app.includes('hasPendingScoreRows') || app.includes('reconcilePendingScoreRows')) {
  throw new Error(`Phase 3E score ownership leaked back into App.jsx near ${legacyAppScoreGuard}.`)
}
for (const token of ['hasPendingScoreRows', 'reconcilePendingScoreRows']) {
  if (!service.includes(token)) throw new Error(`Phase 3E score service ownership missing: ${token}`)
}

console.log('Verified Phase 3E score state ownership in the score persistence service; App.jsx remains uninjected.')
