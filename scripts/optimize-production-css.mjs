import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const INDEX_PATH = path.join(DIST_DIR, "index.html");
const AUTHORITY_TARGET_BYTES = 82_000;
const RECURSIVE_AT_RULE = /^@(media|supports|container|layer|scope|starting-style)\b/i;

function skipComment(source, index) {
  if (source[index] !== "/" || source[index + 1] !== "*") return index;
  const end = source.indexOf("*/", index + 2);
  return end === -1 ? source.length : end + 2;
}

function readPrelude(source, start) {
  let index = start;
  let quote = "";
  let parenDepth = 0;
  let bracketDepth = 0;
  while (index < source.length) {
    const char = source[index];
    if (!quote && char === "/" && source[index + 1] === "*") {
      index = skipComment(source, index);
      continue;
    }
    if (quote) {
      if (char === "\\") index += 2;
      else if (char === quote) { quote = ""; index += 1; }
      else index += 1;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; index += 1; continue; }
    if (char === "(") parenDepth += 1;
    else if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (char === "[") bracketDepth += 1;
    else if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    else if (parenDepth === 0 && bracketDepth === 0 && (char === "{" || char === ";")) {
      return { prelude: source.slice(start, index).trim(), terminator: char, index };
    }
    index += 1;
  }
  return { prelude: source.slice(start).trim(), terminator: "", index: source.length };
}

function readBlock(source, openIndex) {
  let index = openIndex + 1;
  let depth = 1;
  let quote = "";
  while (index < source.length) {
    const char = source[index];
    if (!quote && char === "/" && source[index + 1] === "*") {
      index = skipComment(source, index);
      continue;
    }
    if (quote) {
      if (char === "\\") index += 2;
      else if (char === quote) { quote = ""; index += 1; }
      else index += 1;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; index += 1; continue; }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return { content: source.slice(openIndex + 1, index), end: index + 1 };
    }
    index += 1;
  }
  return { content: source.slice(openIndex + 1), end: source.length };
}

function splitDeclarations(block) {
  if (block.includes("{")) return null;
  const parts = [];
  let start = 0;
  let index = 0;
  let quote = "";
  let parenDepth = 0;
  let bracketDepth = 0;
  while (index <= block.length) {
    const char = block[index] || ";";
    if (quote) {
      if (char === "\\") index += 2;
      else if (char === quote) { quote = ""; index += 1; }
      else index += 1;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; index += 1; continue; }
    if (char === "(") parenDepth += 1;
    else if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (char === "[") bracketDepth += 1;
    else if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    if (char === ";" && parenDepth === 0 && bracketDepth === 0) {
      const raw = block.slice(start, index).trim();
      if (raw) parts.push(raw);
      start = index + 1;
    }
    index += 1;
  }

  const declarations = [];
  for (const raw of parts) {
    let colon = -1;
    quote = "";
    parenDepth = 0;
    bracketDepth = 0;
    for (let cursor = 0; cursor < raw.length; cursor += 1) {
      const char = raw[cursor];
      if (quote) {
        if (char === "\\") cursor += 1;
        else if (char === quote) quote = "";
        continue;
      }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (char === "(") parenDepth += 1;
      else if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
      else if (char === "[") bracketDepth += 1;
      else if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
      else if (char === ":" && parenDepth === 0 && bracketDepth === 0) { colon = cursor; break; }
    }
    if (colon <= 0) return null;
    const property = raw.slice(0, colon).trim();
    const rawValue = raw.slice(colon + 1).trim();
    const important = /!important\s*$/i.test(rawValue);
    declarations.push({ property, value: rawValue, important, remove: false });
  }
  return declarations;
}

function parseNodes(source) {
  const nodes = [];
  let index = 0;
  while (index < source.length) {
    while (index < source.length && /\s/.test(source[index])) index += 1;
    if (source[index] === "/" && source[index + 1] === "*") { index = skipComment(source, index); continue; }
    if (index >= source.length) break;
    const { prelude, terminator, index: endPrelude } = readPrelude(source, index);
    if (!prelude) { index = Math.max(index + 1, endPrelude + 1); continue; }
    if (terminator === ";") {
      nodes.push({ type: "raw", text: `${prelude};` });
      index = endPrelude + 1;
      continue;
    }
    if (terminator !== "{") {
      nodes.push({ type: "raw", text: prelude });
      break;
    }
    const { content, end } = readBlock(source, endPrelude);
    if (prelude.startsWith("@")) {
      if (RECURSIVE_AT_RULE.test(prelude)) nodes.push({ type: "at", prelude, children: parseNodes(content) });
      else nodes.push({ type: "raw", text: `${prelude}{${content}}` });
    } else {
      const declarations = splitDeclarations(content);
      if (declarations) nodes.push({ type: "style", selector: prelude, declarations });
      else nodes.push({ type: "raw", text: `${prelude}{${content}}` });
    }
    index = end;
  }
  return nodes;
}

function normalizeSelector(selector) {
  return selector.replace(/\s+/g, " ").replace(/\s*([>,+~])\s*/g, "$1").trim();
}

function markSuperseded(nodes, context = [], state = new Map(), counters = { removed: 0 }) {
  for (const node of nodes) {
    if (node.type === "at") {
      markSuperseded(node.children, [...context, node.prelude.replace(/\s+/g, " ").trim()], state, counters);
      continue;
    }
    if (node.type !== "style") continue;
    const selector = normalizeSelector(node.selector);
    const contextKey = context.join("|");
    for (const declaration of node.declarations) {
      const property = declaration.property.toLowerCase();
      const key = `${contextKey}\u0000${selector}\u0000${property}`;
      const previous = state.get(key);
      if (!previous) {
        state.set(key, declaration);
        continue;
      }
      if (declaration.important) {
        if (!previous.remove) { previous.remove = true; counters.removed += 1; }
        state.set(key, declaration);
      } else if (previous.important) {
        declaration.remove = true;
        counters.removed += 1;
      } else {
        if (!previous.remove) { previous.remove = true; counters.removed += 1; }
        state.set(key, declaration);
      }
    }
  }
  return counters;
}

function serializeNodes(nodes) {
  let output = "";
  for (const node of nodes) {
    if (node.type === "raw") { output += node.text; continue; }
    if (node.type === "at") {
      const inner = serializeNodes(node.children);
      if (inner) output += `${node.prelude}{${inner}}`;
      continue;
    }
    const declarations = node.declarations.filter((item) => !item.remove);
    if (!declarations.length) continue;
    output += `${node.selector}{${declarations.map((item) => `${item.property}:${item.value}`).join(";")}}`;
  }
  return output;
}

function optimizeCss(source) {
  const nodes = parseNodes(source);
  const counters = markSuperseded(nodes);
  return { css: serializeNodes(nodes), removedDeclarations: counters.removed, nodes };
}

function splitNodesByBytes(nodes, targetBytes) {
  const chunks = [];
  let current = [];
  let bytes = 0;
  for (const node of nodes) {
    const text = serializeNodes([node]);
    if (!text) continue;
    const nextBytes = Buffer.byteLength(text);
    if (current.length && bytes + nextBytes > targetBytes) {
      chunks.push(serializeNodes(current));
      current = [];
      bytes = 0;
    }
    current.push(node);
    bytes += nextBytes;
  }
  if (current.length) chunks.push(serializeNodes(current));
  return chunks;
}

async function listCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listCssFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".css")) files.push(full);
  }
  return files;
}

async function optimizeAuthorityBundles() {
  let html = await readFile(INDEX_PATH, "utf8");
  const linkPattern = /<link\b[^>]*href=["'](?:\.\/|\/)?(shotlab-authority-(\d+)\.css)["'][^>]*data-shotlab-authority-bundle=["']\d+["'][^>]*>/gi;
  const matches = [...html.matchAll(linkPattern)].sort((a, b) => Number(a[2]) - Number(b[2]));
  if (matches.length < 2) return { removed: 0, bytesSaved: 0 };

  const originalFiles = matches.map((match) => match[1]);
  const original = (await Promise.all(originalFiles.map((name) => readFile(path.join(DIST_DIR, name), "utf8")))).join("\n");
  const optimized = optimizeCss(original);
  const chunks = splitNodesByBytes(optimized.nodes, AUTHORITY_TARGET_BYTES);
  const tags = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const name = `shotlab-authority-${index + 1}.css`;
    await writeFile(path.join(DIST_DIR, name), chunks[index]);
    tags.push(`<link rel="stylesheet" href="./${name}" data-shotlab-authority-bundle="${index + 1}" />`);
  }
  for (let index = chunks.length; index < originalFiles.length; index += 1) {
    await unlink(path.join(DIST_DIR, originalFiles[index])).catch(() => {});
  }
  let inserted = false;
  html = html.replace(linkPattern, () => {
    if (inserted) return "";
    inserted = true;
    return tags.join("\n  ");
  });
  await writeFile(INDEX_PATH, html);
  return {
    removed: optimized.removedDeclarations,
    bytesSaved: Buffer.byteLength(original) - chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk), 0),
  };
}

async function main() {
  await stat(DIST_DIR);
  const authority = await optimizeAuthorityBundles();
  const cssFiles = await listCssFiles(DIST_DIR);
  let removed = authority.removed;
  let bytesSaved = authority.bytesSaved;
  for (const file of cssFiles) {
    if (/shotlab-authority-\d+\.css$/.test(file)) continue;
    const source = await readFile(file, "utf8");
    const optimized = optimizeCss(source);
    if (optimized.css && optimized.css !== source) {
      await writeFile(file, optimized.css);
      removed += optimized.removedDeclarations;
      bytesSaved += Buffer.byteLength(source) - Buffer.byteLength(optimized.css);
    }
  }
  console.log(`Optimized production CSS cascade: removed ${removed} superseded declarations, saved ${(bytesSaved / 1024).toFixed(1)} KiB raw.`);
}

await main();
