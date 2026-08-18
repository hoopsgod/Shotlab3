import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BRANDED_FUNCTION = 'function CourtArtwork({ logoUrl, teamName }) {';
const LEGACY_FUNCTION = 'function CourtArtwork({ logoUrl }) {';
const BRANDED_FLOOR = '<div className="mcCourtFloor"><span className="mcSideline" /><span className="mcCenterLine" /><span className="mcKey" /><span className="mcThreePoint" />{logoUrl ? <img src={logoUrl} alt="" /> : <span className="mcCourtFallback">{initials(teamName)}</span>}</div>';
const LEGACY_FLOOR = '<div className="mcCourtFloor"><span className="mcSideline" /><span className="mcCenterLine" /><span className="mcKey" /><span className="mcThreePoint" /><img src={logoUrl || FALLBACK_LOGO} alt="" /></div>';
const TACTICAL_MARKER = 'id="mcTacticalWash"';

const countOf = (source, value) => source.split(value).length - 1;

export function reconcileTeamIdentityMobileCoach(source) {
  if (source.includes(TACTICAL_MARKER)) return source;

  const brandedFunctionCount = countOf(source, BRANDED_FUNCTION);
  const brandedFloorCount = countOf(source, BRANDED_FLOOR);
  const legacyFunctionCount = countOf(source, LEGACY_FUNCTION);
  const legacyFloorCount = countOf(source, LEGACY_FLOOR);

  if (brandedFunctionCount === 1 && brandedFloorCount === 1) {
    return source
      .replace(BRANDED_FUNCTION, LEGACY_FUNCTION)
      .replace(BRANDED_FLOOR, LEGACY_FLOOR);
  }

  if (legacyFunctionCount === 1 && legacyFloorCount === 1) return source;

  throw new Error(
    `[team-identity-mobile-coach] unexpected Coach court contract: branded function=${brandedFunctionCount}, branded floor=${brandedFloorCount}, legacy function=${legacyFunctionCount}, legacy floor=${legacyFloorCount}`,
  );
}

export function applyTeamIdentityMobileCoachReconciliation({ cwd = process.cwd() } = {}) {
  const commandPath = path.resolve(cwd, 'src/components/CoachCommandCenter.jsx');
  const source = readFileSync(commandPath, 'utf8');
  const next = reconcileTeamIdentityMobileCoach(source);
  if (next !== source) writeFileSync(commandPath, next);
  console.log('Reconciled team-owned Coach court identity with the mobile signature enhancer contract.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyTeamIdentityMobileCoachReconciliation();
