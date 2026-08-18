import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TARGET = "src/components/CoachCommandCenter.jsx";
const HIDDEN_RULE = 'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroTeamMark{display:none!important}';
const VISIBLE_RULE = 'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroTeamMark{display:grid!important;z-index:4!important;top:24px!important;right:14px!important;width:clamp(112px,30vw,128px)!important;height:clamp(112px,30vw,128px)!important;place-items:center!important}';
const IMAGE_RULE = 'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroTeamMark img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important}';
const FALLBACK_RULE = 'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroTeamMark .mcTeamFallback{display:grid!important;width:100%!important;height:100%!important;place-items:center!important;border:1px solid color-mix(in srgb,var(--mc,#c8ff1a) 42%,transparent)!important;border-radius:28px!important;background:rgba(3,17,24,.58)!important;color:#f8fbfc!important;font-size:30px!important;font-weight:900!important;letter-spacing:-.05em!important}';
const COPY_RULE = 'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroContent :is(.mcProgramIdentity,.mcEyebrow){max-width:calc(100% - 126px)!important}';

export function keepCoachHeroMarkVisible(source) {
  if ([VISIBLE_RULE, IMAGE_RULE, FALLBACK_RULE, COPY_RULE].every((rule) => source.includes(rule))) return source;
  const count = source.split(HIDDEN_RULE).length - 1;
  if (count !== 1) {
    throw new Error(`[team-identity-coach-hero-mark] expected one hidden Coach hero mark rule, found ${count}`);
  }
  return source.replace(HIDDEN_RULE, `${VISIBLE_RULE}\n  ${IMAGE_RULE}\n  ${FALLBACK_RULE}\n  ${COPY_RULE}`);
}

export function applyTeamIdentityCoachHeroMark({ cwd = process.cwd() } = {}) {
  const targetPath = path.resolve(cwd, TARGET);
  const source = readFileSync(targetPath, "utf8");
  const next = keepCoachHeroMarkVisible(source);
  if (next !== source) writeFileSync(targetPath, next);
  console.log("Restored the Coach mobile hero crest after the legacy signature-stage mutation.");
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyTeamIdentityCoachHeroMark();
