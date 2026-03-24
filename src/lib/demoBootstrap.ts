import { isDemoMode } from "./demoMode.js";

export function demoBootstrap() {
  if (!isDemoMode()) return;
  console.info("[demo] demoBootstrap ran");
}
