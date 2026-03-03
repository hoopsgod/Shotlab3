const DEMO_EMAIL_ALLOWLIST = ["demo@shotlab.app", "coach.demo@shotlab.app"];

const parseEnvBool = (v) => {
  if (typeof v === "undefined") return true;
  const normalized = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return true;
};

export function isDemoUser(user) {
  if (!user?.email) return false;
  const envEnabled = parseEnvBool(import.meta.env.VITE_DEMO_MODE);
  if (!envEnabled) return false;
  const email = user.email.toLowerCase();
  return DEMO_EMAIL_ALLOWLIST.some((demoEmail) => email === demoEmail || email.includes("demo@"));
}
