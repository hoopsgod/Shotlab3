import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { routeEnhancersFor } from "../scripts/run-route-enhancers.mjs";

const priorAuthority = 'const scReplacement=k.startsWith("sl:sc-"),signedReplacementCollection=k==="sl:rsvps"||k==="sl:events"&&options?.replace===true||scReplacement&&options?.strictRemote===true;';
const explicitAuthority = 'const scReplacement=k.startsWith("sl:sc-"),signedReplacementCollection=(k==="sl:rsvps"||k==="sl:events")&&options?.replace===true||scReplacement&&options?.strictRemote===true;';
const priorPersistAction = 'const P=useCallback(async(k,v,set,options)=>{set(v);await DB.set(k,v,options)},[]);';
const explicitPersistAction = 'const P=useCallback(async(k,v,set,o)=>{set(v);await DB.set(k,v,k==="sl:rsvps"?{...o,replace:true}:o)},[]);';
const startupRewrite = 'await DB.set("sl:rsvps",m.rsvpsM);';

function runFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "shotlab-rsvp-boundary-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "src/App.jsx"), `${priorAuthority}\n${priorPersistAction}\n${startupRewrite}\n`);
  const enhancer = path.resolve("scripts/apply-rsvp-explicit-replacement-boundary.mjs");
  const first = spawnSync(process.execPath, [enhancer], { cwd: root, encoding: "utf8" });
  const source = readFileSync(path.join(root, "src/App.jsx"), "utf8");
  const second = spawnSync(process.execPath, [enhancer], { cwd: root, encoding: "utf8" });
  rmSync(root, { recursive: true, force: true });
  return { first, second, source };
}

test("RSVP startup cache rewrites are non-authoritative while explicit mutations retain empty replacement semantics", () => {
  const { first, second, source } = runFixture();
  assert.equal(first.status, 0, first.stderr || first.stdout);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.match(source, /signedReplacementCollection=\(k===\"sl:rsvps\"\|\|k===\"sl:events\"\)&&options\?\.replace===true/);
  assert.match(source, /k===\"sl:rsvps\"\?\{\.\.\.o,replace:true\}:o/);
  assert.ok(source.includes(startupRewrite), "startup hydration must remain a direct cache rewrite without replacement options");
  assert.ok(!source.includes(priorAuthority));
  assert.ok(!source.includes(priorPersistAction));
});

test("the RSVP closure enhancer runs after schedule ownership enhancers for dev and build", () => {
  for (const mode of ["dev", "build"]) {
    const enhancers = routeEnhancersFor(mode);
    const rsvpClosure = enhancers.indexOf("scripts/apply-rsvp-explicit-replacement-boundary.mjs");
    const events = enhancers.indexOf("scripts/apply-phase3-events-replacement-ownership.mjs");
    const strength = enhancers.indexOf("scripts/apply-phase3-strength-conditioning-state-ownership.mjs");
    assert.ok(rsvpClosure > events, `${mode}: closure must run after Events ownership`);
    assert.ok(rsvpClosure > strength, `${mode}: closure must run after S&C ownership`);
  }
});
