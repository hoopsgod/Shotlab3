import fs from "node:fs";

const path = "tests/e2e/demo-paid-runtime-parity.spec.mjs";
let source = fs.readFileSync(path, "utf8");
const before = `      // Demo-data cleanup is intentionally state-dependent: the action is only\n      // available while managed sample data exists. It is not a paid/demo UI\n      // branch and therefore is outside the commercial surface comparison.\n      .filter((node) => !(node.tagName === "BUTTON" && normalizeText(node.textContent) === "CLEAR DEMO DATA"))`;
const after = `      // Sandbox reset controls are an intentional capability-only difference:\n      // registered tenants must never be able to load or clear demo seed data.\n      // Exclude only that tightly identified utility card from product parity.\n      .filter((node) => {\n        const sandboxCard = node.closest?.(".coachAdministrationCard");\n        if (!sandboxCard) return true;\n        const isSandboxUtility = [...sandboxCard.querySelectorAll("h3")].some((heading) => normalizeText(heading.textContent) === "DEMO SETTINGS");\n        return !isSandboxUtility;\n      })`;
const count = source.split(before).length - 1;
if (count !== 1) throw new Error(`runtime parity normalization: expected 1 occurrence, found ${count}`);
source = source.replace(before, after);
if (!source.includes('normalizeText(heading.textContent) === "DEMO SETTINGS"')) throw new Error("sandbox utility exclusion missing");
if (source.includes('normalizeText(node.textContent) === "CLEAR DEMO DATA"')) throw new Error("obsolete button-only exclusion remains");
fs.writeFileSync(path, source);
console.log("Runtime parity now excludes only the allowed sandbox-reset utility card.");
