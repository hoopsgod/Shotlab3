import { getSquadLockerPartnerReadiness } from "../src/lib/teamStore.js";

const readiness = getSquadLockerPartnerReadiness({
  baseUrl: process.env.VITE_SQUADLOCKER_PARTNER_URL,
  source: "release_readiness",
});

if (!readiness.ready) {
  console.error(
    "SquadLocker partner attribution is not release-ready. Set VITE_SQUADLOCKER_PARTNER_URL to the official HTTPS destination issued to ShotLab.",
  );
  process.exitCode = 1;
} else {
  const destination = new URL(readiness.url);
  console.log(`SquadLocker partner attribution ready: ${destination.origin}${destination.pathname}`);
}
