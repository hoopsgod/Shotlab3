import { validateProgramDrillScore } from "./programDrillScoring.js";

const clean=(value)=>String(value??"").trim(),email=(player={})=>clean(player?.email||player?.player_email||player?.invitedEmail).toLowerCase(),name=(player={})=>clean(player?.name||player?.displayName||[player?.firstName,player?.lastName].filter(Boolean).join(" ")),drillId=(drill={})=>clean(drill?.id||drill?.drill_id||drill?.key||drill?.slug||drill?.name),drillName=(drill={})=>clean(drill?.name||drill?.drillName);

export function coachProgramScorePlayerOptions(players=[]){return(Array.isArray(players)?players:[]).map((player)=>({player,id:clean(player?.id||player?.playerId||player?.player_id||player?.profileId||player?.email),email:email(player),name:name(player)})).filter((option)=>option.id&&option.email).sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email))}

export function coachProgramScoreDrillOptions(drills=[]){return(Array.isArray(drills)?drills:[]).map((drill)=>({drill,id:drillId(drill),name:drillName(drill)})).filter((option)=>option.id&&option.name).sort((a,b)=>a.name.localeCompare(b.name))}

export function validateCoachProgramScoreEntry({player,drill,score,date}={}){if(!email(player))return{ok:false,error:"Choose an active roster player."};if(!drillId(drill))return{ok:false,error:"Choose a Program drill."};if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(date)))return{ok:false,error:"Choose a valid session date."};return validateProgramDrillScore(score,drill)}

export function buildCoachVerifiedProgramScoreRow({id,player={},drill={},score,date,teamId,now=Date.now()}={}){const validation=validateCoachProgramScoreEntry({player,drill,score,date});if(!validation.ok)return null;const playerEmail=email(player),programDrillId=drillId(drill),normalizedTeamId=clean(teamId||player?.teamId||player?.team_id);if(!normalizedTeamId)return null;return{id:clean(id)||`coach_program_score_${now}`,email:playerEmail,playerId:playerEmail,teamId:normalizedTeamId,name:name(player)||playerEmail,drillId:programDrillId,drillName:drillName(drill),score:validation.score,date:clean(date),ts:now,src:"program"}}
