import assert from "node:assert/strict";

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function closingBraceIndex(source, openBraceIndex, label) {
  assert.ok(openBraceIndex >= 0, `Missing opening brace for ${label}`);
  let depth = 1;
  let quote = null;
  let escaped = false;

  for (let index = openBraceIndex + 1; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  assert.fail(`Unclosed CSS block for ${label}`);
}

function blockBody(source, openBraceIndex, label) {
  const closeBraceIndex = closingBraceIndex(source, openBraceIndex, label);
  return {
    body: source.slice(openBraceIndex + 1, closeBraceIndex),
    closeBraceIndex,
  };
}

function headerMatches(header, selectorFragment) {
  const fragment = String(selectorFragment).trim();
  if (/^\.[A-Za-z0-9_-]+$/.test(fragment)) {
    return new RegExp(`${escapeRegExp(fragment)}(?![A-Za-z0-9_-])`).test(header);
  }
  return header.includes(fragment);
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
    const { body, closeBraceIndex } = blockBody(source, openBraceIndex, `@media ${header.trim()}`);
    if (normalize(header) === wanted) return body;
    cursor = closeBraceIndex + 1;
  }

  assert.fail(`Missing @media ${condition}`);
}

export function ruleBlock(source, selectorFragment, occurrence = 0) {
  let cursor = 0;
  let seen = 0;

  while (cursor < source.length) {
    const openBraceIndex = source.indexOf("{", cursor);
    if (openBraceIndex < 0) break;
    const header = source.slice(cursor, openBraceIndex).trim();
    const { body, closeBraceIndex } = blockBody(source, openBraceIndex, header || selectorFragment);

    if (!header.startsWith("@") && headerMatches(header, selectorFragment)) {
      if (seen === occurrence) return body;
      seen += 1;
    }

    cursor = closeBraceIndex + 1;
  }

  assert.fail(`Missing CSS rule containing ${selectorFragment}`);
}

export function declaration(block, property) {
  const escaped = escapeRegExp(property);
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
