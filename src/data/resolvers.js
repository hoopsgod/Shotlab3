import { demoData } from "../demo/demoData";
import { isDemoUser } from "../demo/isDemoUser";

export function getSummaryStats(user, realStats) {
  if (isDemoUser(user)) return demoData.summaryStats;
  return realStats;
}

export function getNextEvent(user, realNextEvent) {
  if (isDemoUser(user)) return demoData.nextEvent;
  return realNextEvent;
}

export function getDrillStats(user, realDrills) {
  if (isDemoUser(user)) return demoData.drills;
  return realDrills;
}

export function getAttendanceRank(user, realRank) {
  if (isDemoUser(user)) return demoData.attendanceRank;
  return realRank;
}

export function getLeaderboard(user, realLeaderboard) {
  if (isDemoUser(user)) return demoData.leaderboard;
  return realLeaderboard;
}
