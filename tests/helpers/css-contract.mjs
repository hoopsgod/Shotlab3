import assert from "node:assert/strict";

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, "");
}

function matchingBlock(source, openBraceIndex, label) {
  assert.ok(openBraceIndex >= 0, `Missing opening brace for ${label}`);
  let depth = 1;
  for (let index = openBraceIndex + 1; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openBraceIndex + 1, index);
    }
  }
  assert.fail(`Unclosed CSS block for ${label}`);
}

export function mediaBlock(source, condition) {
  const wanted = normalize(condition);
  let cursor = 0;
  while (cursor < source.length) {
    const mediaIndex = source.indexOf("@media", cursor);
    if (mediaIndex < 0) break;
    const openBraceIndex = source.indexOf("{", mediaIndex);
    assert.ok(openBraceIndex >= 0, `Malformed @media block near ${condition}`);
    const header = source.slice(mediaIndex + "@media".length, openBraceIndex);
    if (normalize(header) === wanted) {
      return matchingBlock(source, openBraceIndex, `@media ${condition}`);
    }
    cursor = openBraceIndex + 1;
  }
  assert.fail(`Missing @media ${condition}`);
}

export function ruleBlock(source, selectorFragment, occurrence = 0) {
  let cursor = 0;
  let seen = 0;
  while (cursor < source.length) {
    const selectorIndex = source.indexOf(selectorFragment, cursor);
    if (selectorIndex < 0) break;
    const openBraceIndex = source.indexOf("{", selectorIndex);
    if (openBraceIndex < 0) break;
    const nextClose = source.indexOf("}", selectorIndex);
    if (nextClose >= 0 && nextClose < openBraceIndex) {
      cursor = selectorIndex + selectorFragment.length;
      continue;
    }
    if (seen === occurrence) {
      return matchingBlock(source, openBraceIndex, selectorFragment);
    }
    seen += 1;
    cursor = openBraceIndex + 1;
  }
  assert.fail(`Missing CSS rule containing ${selectorFragment}`);
}

export function declaration(block, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;}]+)`, "i"));
  return match?.[1]?.trim() ?? null;
}

export function assertDeclaration(block, property, expected) {
  const actual = declaration(block, property);
  assert.notEqual(actual, null, `Missing ${property}`);
  if (expected instanceof RegExp) assert.match(actual, expected, `${property}: ${actual}`);
  else assert.equal(normalize(actual), normalize(expected), `${property}: ${actual}`);
}

export function assertContainsAll(source, fragments, label = "CSS contract") {
  for (const fragment of fragments) {
    assert.ok(source.includes(fragment), `${label} missing ${fragment}`);
  }
}
