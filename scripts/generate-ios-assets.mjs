import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const root = process.cwd();
const iconSource = path.join(root, "native", "assets", "app-icon-master.svg");
const launchSource = path.join(root, "native", "assets", "launch-master.svg");
const iconTarget = path.join(root, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png");
const splashDir = path.join(root, "ios", "App", "App", "Assets.xcassets", "Splash.imageset");

function render(sourcePath, width, targetPath) {
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing asset source: ${sourcePath}`);
  const svg = fs.readFileSync(sourcePath, "utf8");
  const rendered = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true },
  }).render().asPng();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, rendered);
  console.log(`Generated ${path.relative(root, targetPath)}`);
}

render(iconSource, 1024, iconTarget);
for (const filename of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  render(launchSource, 2732, path.join(splashDir, filename));
}
