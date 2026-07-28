import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, "dist");
const artifactDir = path.join(root, "artifacts/app-store");
const profile = JSON.parse(fs.readFileSync(path.join(root, "native/app-store-public-urls.json"), "utf8"));

const fail = (message) => {
  throw new Error(`[public-submission-build] ${message}`);
};

const requiredFiles = ["index.html", "_redirects", "_headers"];
for (const file of requiredFiles) {
  const target = path.join(dist, file);
  if (!fs.existsSync(target)) fail(`Missing dist/${file}.`);
}

const redirects = fs.readFileSync(path.join(dist, "_redirects"), "utf8").trim();
if (redirects !== "/* /index.html 200") fail("Cloudflare Pages fallback rule is not exact.");

const headers = fs.readFileSync(path.join(dist, "_headers"), "utf8");
for (const header of ["X-Content-Type-Options", "Referrer-Policy", "X-Frame-Options", "Permissions-Policy", "Cross-Origin-Opener-Policy"]) {
  if (!headers.includes(header)) fail(`dist/_headers is missing ${header}.`);
}

const index = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (!/<div\s+id=["']root["']/i.test(index)) fail("Built index.html is missing the application root.");
if (!/<script[^>]+src=["'][^"']+\/assets\//i.test(index)) fail("Built index.html is missing a bundled application script.");

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  productionOrigin: profile.productionOrigin,
  status: profile.status,
  buildFiles: requiredFiles.map((file) => ({ file: `dist/${file}`, bytes: fs.statSync(path.join(dist, file)).size })),
  routes: profile.routes.map((route) => ({
    field: route.field,
    path: route.path,
    candidateUrl: route.candidateUrl,
    expectedHeading: route.expectedHeading,
    localBuildReady: true,
    liveHttpsVerified: false,
  })),
  ownerGates: {
    supportMailboxOwnershipVerified: profile.supportMailbox.ownershipVerified,
    supportMailboxDeliverabilityVerified: profile.supportMailbox.deliverabilityVerified,
  },
};

fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(path.join(artifactDir, "public-url-readiness.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`[public-submission-build] Validated ${profile.routes.length} candidate routes and Cloudflare Pages deployment files.`);
