import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Compatibility exports only. Phase 4 moved the full Coach Home presentation into
// its canonical component styles, so the production build no longer runs this
// historical source transformer.
export function promoteCoachCommandCenter(source) { return source; }
export function promoteCoachFinalCss(source) { return source; }

export function applyMobileCoachSignatureStage() {
  console.log('Coach Home source transformation retired; canonical component styles are authoritative.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobileCoachSignatureStage();
