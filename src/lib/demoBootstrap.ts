import { isDemoMode } from "./demoMode.js";

export function demoBootstrap() {
  if (!isDemoMode()) return;
  console.log("[demo] demoBootstrap ran");
}
