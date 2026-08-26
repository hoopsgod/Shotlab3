import test from 'node:test';
import assert from 'node:assert/strict';
import { assertDeclaration, mediaBlock, ruleBlock } from './helpers/css-contract.mjs';

const semanticCss = `
.baseMark,.siblingMark{object-fit:contain;display:block}
.shell .baseMark img{object-position:center;width:100%}
.adjacent{color:red}.next{color:blue}
@media(max-width:700px){
  .baseMark{width:96px}
  .shell .baseMark img{height:100%}
}
`;

const spacedMediaCss = `
@media (max-width: 700px) {
  .grouped,.sibling{min-height:44px}
  .compound .child{padding:12px}
}
`;

test('base-only visual declarations compose with mobile-only geometry', () => {
  const base = ruleBlock(semanticCss, '.baseMark');
  const mobile = mediaBlock(semanticCss, '(max-width:700px)');
  const mobileMark = ruleBlock(mobile, '.baseMark');
  assertDeclaration(base, 'object-fit', 'contain');
  assertDeclaration(mobileMark, 'width', '96px');
});

test('media blocks are located independent of formatting whitespace', () => {
  const compact = mediaBlock(semanticCss, '(max-width: 700px)');
  const spaced = mediaBlock(spacedMediaCss, '(max-width:700px)');
  assertDeclaration(ruleBlock(compact, '.baseMark'), 'width', '96px');
  assertDeclaration(ruleBlock(spaced, '.grouped'), 'min-height', '44px');
});

test('sibling, grouped and compound descendant selectors remain addressable', () => {
  assertDeclaration(ruleBlock(semanticCss, '.siblingMark'), 'object-fit', 'contain');
  const mobile = mediaBlock(spacedMediaCss, '(max-width:700px)');
  assertDeclaration(ruleBlock(mobile, '.sibling'), 'min-height', '44px');
  assertDeclaration(ruleBlock(mobile, '.compound .child'), 'padding', '12px');
});

test('compound descendants and adjacent minified selectors do not confuse block boundaries', () => {
  const compound = ruleBlock(semanticCss, '.shell .baseMark img');
  assertDeclaration(compound, 'object-position', 'center');
  assertDeclaration(ruleBlock(semanticCss, '.adjacent'), 'color', 'red');
  assertDeclaration(ruleBlock(semanticCss, '.next'), 'color', 'blue');
});

test('a responsive contract recognizes a base guarantee plus a media override on another property', () => {
  const base = ruleBlock(semanticCss, '.shell .baseMark img');
  const mobile = mediaBlock(semanticCss, '(max-width:700px)');
  const mobileDescendant = ruleBlock(mobile, '.shell .baseMark img');
  assertDeclaration(base, 'object-position', 'center');
  assertDeclaration(base, 'width', '100%');
  assertDeclaration(mobileDescendant, 'height', '100%');
  assert.equal(/height\s*:/.test(base), false);
});
