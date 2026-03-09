import { useCallback, useEffect, useState } from "react";
import { authSubscribe } from "../services/authService";
import { firebaseAuth, firebaseEnabled } from "../../../lib/firebase";

export default function useAuthSession(players) {
  const [view, setView] = useState("auth");
  const [user, setUser] = useState(null);

  const syncUserView = useCallback((person) => {
    const role = person.role || "player";
    const nextUser = {
      email: person.email,
      role,
      isCoach: role === "coach",
      name: person.name,
      teamId: person.teamId || null,
    };
    setUser(nextUser);
    if (role === "coach" && !person.teamId) setView("create-team");
    else if (role === "player" && !person.teamId) setView("join-team");
    else setView(role);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled || !firebaseAuth) return;
    const unsub = authSubscribe(firebaseAuth, async (current) => {
      if (!current?.email) return;
      const found = players.find((pl) => pl.email === current.email);
      if (found) {
        syncUserView(found);
      }
    });
    return () => unsub();
  }, [players, syncUserView]);

  return { view, setView, user, setUser, syncUserView };
}
