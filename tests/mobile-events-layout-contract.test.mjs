import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const start = appSource.indexOf('data-testid="coach-events-mobile-page"');
const end = appSource.indexOf('{showAdd&&<div', start);
const mobileEventsSource = start >= 0 && end > start ? appSource.slice(start, end) : "";

test("mobile events uses a purpose-led page rather than the old nested accent card", () => {
  assert.match(appSource, /coach-events-mobile-surface/);
  assert.match(appSource, /\{isDesktop&&<DashboardReturnButton/);
  assert.match(appSource, /visible=\{showMiniHeader\}/);
  assert.match(appSource, /padding:`\$\{showMiniHeader\?"74px":"12px"\}/);
  assert.match(mobileEventsSource, /data-testid="coach-events-mobile-header"/);
  assert.match(mobileEventsSource, /data-testid="coach-events-mobile-empty-state"/);
  assert.match(mobileEventsSource, /NO EVENTS SCHEDULED/);
  assert.match(mobileEventsSource, /CREATE FIRST EVENT/);
  assert.doesNotMatch(mobileEventsSource, /DashboardReturnButton/);
  assert.doesNotMatch(mobileEventsSource, /className="btn-v cta-primary" style=\{\{margin:"0 0 14px",width:"100%"/);
});

test("empty and populated mobile events states each expose one appropriately sized creation action", () => {
  assert.match(mobileEventsSource, /events\.length>0&&<button data-testid="coach-events-mobile-create-event"/);
  assert.match(mobileEventsSource, /events\.length===0\?<section/);
  assert.match(mobileEventsSource, /minWidth:190/);
  assert.match(mobileEventsSource, /MANAGE →/);
});
