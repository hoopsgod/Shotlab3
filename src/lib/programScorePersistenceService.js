import {readSession} from "./apiFetchBridge.js";
import {createPendingScoreService,reconcilePendingIds} from "./scorePersistenceService.js";
const KEY="sl:pp",activeTeam=storage=>String(readSession(storage)?.teamId||readSession(storage)?.team_id||"").trim();
export function reconcilePendingProgramScoreRows(options={}){return reconcilePendingIds({...options,teamId:options.teamId||activeTeam(options.storage),key:KEY})}
export function createProgramScorePersistenceService(options={}){const s=createPendingScoreService({...options,path:"/v1/program-scores",field:"program_scores",key:KEY,name:"programScores",prefix:"program_score",pendingFallback:true,scopeTeam:activeTeam});return{loadProgramScores:s.load,upsertProgramScores:s.upsert,deletePlayerProgramScores:s.remove}}
