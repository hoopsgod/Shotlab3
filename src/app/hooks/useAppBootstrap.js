import { useEffect } from "react";
import { DB } from "../../services/storage/cloudStoreAdapter";
import migrateAppData from "../runtime/migrateAppData";

export default function useAppBootstrap({
  setDrills,
  setProgramDrills,
  setPlayers,
  setPlayerProfiles,
  setTeams,
  setScores,
  setEvents,
  setRsvps,
  setShotLogs,
  setChallenges,
  setScSessions,
  setScRsvps,
  setScLogs,
  setReady,
  syncUserView,
}) {
  useEffect(() => {
    (async () => {
      const [d, pd, s, p, pp, ev, rv, sl, ch, scs, scr, scl, tm, sess] = await Promise.all([
        DB.get("sl:drills"),
        DB.get("sl:program-drills"),
        DB.get("sl:scores"),
        DB.get("sl:players"),
        DB.get("sl:player-profiles"),
        DB.get("sl:events"),
        DB.get("sl:rsvps"),
        DB.get("sl:shotlogs"),
        DB.get("sl:challenges"),
        DB.get("sl:sc-sessions"),
        DB.get("sl:sc-rsvps"),
        DB.get("sl:sc-logs"),
        DB.get("sl:teams"),
        DB.get("sl:session"),
      ]);
      if (d) setDrills(d);
      if (pd) setProgramDrills(pd);

      const m = migrateAppData({
        players: p,
        playerProfiles: pp,
        scores: s,
        events: ev,
        rsvps: rv,
        shotLogs: sl,
        challenges: ch,
        scSessions: scs,
        scRsvps: scr,
        scLogs: scl,
        teams: tm,
      });

      setPlayers(m.playersMigrated);
      setPlayerProfiles(m.profilesMigrated);
      setTeams(m.teamsMigrated);
      setScores(m.scoresM);
      setEvents(m.eventsM);
      setRsvps(m.rsvpsM);
      setShotLogs(m.shotM);
      setChallenges(m.chM);
      setScSessions(m.scSM);
      setScRsvps(m.scRM);
      setScLogs(m.scLM);

      await Promise.all([
        DB.set("sl:players", m.playersMigrated),
        DB.set("sl:player-profiles", m.profilesMigrated),
        DB.set("sl:teams", m.teamsMigrated),
        DB.set("sl:scores", m.scoresM),
        DB.set("sl:events", m.eventsM),
        DB.set("sl:rsvps", m.rsvpsM),
        DB.set("sl:shotlogs", m.shotM),
        DB.set("sl:challenges", m.chM),
        DB.set("sl:sc-sessions", m.scSM),
        DB.set("sl:sc-rsvps", m.scRM),
        DB.set("sl:sc-logs", m.scLM),
      ]);

      if (sess && sess.email) {
        const found = m.playersMigrated.find((pl) => pl.email === sess.email);
        if (found) syncUserView(found);
      }
      setReady(true);
    })();
  }, []);
}
