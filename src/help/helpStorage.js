const PREFIX = "shotlab.coachmark.dismissed.";

export function isCoachmarkDismissed(id) {
  if (!id || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(`${PREFIX}${id}`) === "1";
  } catch {
    return false;
  }
}

export function dismissCoachmark(id) {
  if (!id || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${PREFIX}${id}`, "1");
  } catch {
    // no-op (storage unavailable)
  }
}
