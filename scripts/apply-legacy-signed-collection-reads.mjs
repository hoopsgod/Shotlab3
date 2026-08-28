import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const rawSource = fs.readFileSync(appPath, 'utf8')
const lineEnding = rawSource.includes('\r\n') ? '\r\n' : '\n'
let source = rawSource.replace(/\r\n/g, '\n')

const importNeedle = 'import { buildAppRows, buildRemoteRows, formatRemotePersistErrorForDebug, mergeHydratedRows, normalizeShotLogRowForApp } from "./lib/remotePersistence.js";'
const importLine = 'import { requestLegacySignedCollection } from "./lib/legacySignedCollectionPersistence.js";'
const combinedImport = 'import { hydrateAuthenticatedCollectionsToStorage, requestLegacySignedCollection } from "./lib/legacySignedCollectionPersistence.js";'

if (!source.includes(importLine) && !source.includes(combinedImport)) {
  if (!source.includes(importNeedle)) throw new Error('Could not find remote persistence import boundary in src/App.jsx.')
  source = source.replace(importNeedle, `${importNeedle}\n${importLine}`)
}

const marker = 'const signedRead=await requestLegacySignedCollection({table,fetchImpl:(...args)=>globalThis.fetch(...args),storage:globalThis?.localStorage,supabaseAuthEnabled:SUPABASE_AUTH_ENABLED});'
const needle = 'const table = TABLE_MAP[k];\n    if (table) {\n      try {\n        const { data } = await supabase.from(table).select("*");'
const replacement = `const table = TABLE_MAP[k];
    if (table) {
      try {
        const signedRead=await requestLegacySignedCollection({table,fetchImpl:(...args)=>globalThis.fetch(...args),storage:globalThis?.localStorage,supabaseAuthEnabled:SUPABASE_AUTH_ENABLED});
        let data=null;
        if(signedRead){
          if(signedRead.error){
            const signedError=new Error(signedRead.error.message||"signed_collection_load_failed");
            signedError.code=signedRead.error.code||"signed_collection_load_failed";
            signedError.status=signedRead.error.status||0;
            throw signedError;
          }
          data=signedRead.data;
        }else{
          const remoteResult=await supabase.from(table).select("*");
          data=remoteResult.data;
        }`

if (!source.includes(marker)) {
  if (!source.includes(needle)) throw new Error('Could not find DB.get remote collection read boundary in src/App.jsx.')
  source = source.replace(needle, replacement)
}

fs.writeFileSync(appPath, source.replace(/\n/g, lineEnding))
console.log('Applied legacy signed collection reads to registered persistence hydration.')
