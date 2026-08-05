import { readFileSync, writeFileSync } from "node:fs";

const path = "src/components/PlayerCareerHistory.module.css";
let source = readFileSync(path, "utf8");

const replacements = [
  [".milestoneCard{margin-top:14px;padding:18px;border-radius:20px;background:#1b211d;color:#fff}", ".milestoneCard{margin-top:14px;padding:18px;border-radius:20px;background:#1b211d}"],
  [".milestoneTopline h3{margin:5px 0 0;font:800 clamp(22px,4vw,30px)/1.05 system-ui,sans-serif;letter-spacing:-.045em}", ".milestoneTopline h3{margin:5px 0 0;font-size:26px}"],
  [".milestoneTopline .sectionLabel{color:#b8c2ba}", ""],
  [".milestoneTopline>strong{color:var(--accent,#c8ff1a);font:800 clamp(24px,5vw,34px)/1 system-ui,sans-serif}", ".milestoneTopline>strong{color:var(--accent,#c8ff1a);font-size:30px}"],
  [".milestoneFooter{align-items:center;margin-top:12px}", ".milestoneFooter{margin-top:12px}"],
  [".milestoneFooter p{max-width:620px;margin:0;color:#c9d1cb;font:550 12px/1.5 system-ui,sans-serif}", ".milestoneFooter p{margin:0;color:#c9d1cb;font-size:12px}"],
  [".milestoneFooter span{color:#fff;font:800 10px/1 system-ui,sans-serif;text-transform:uppercase}", ".milestoneFooter span{font-size:10px;font-weight:800}"],
  [".milestoneTrack span{display:block;height:100%;border-radius:inherit;background:var(--accent,#c8ff1a);transition:width .7s ease}", ".milestoneTrack span{display:block;height:100%;background:var(--accent,#c8ff1a);transition:width .7s}"],
  [".milestoneTopline,.milestoneFooter{display:flex;justify-content:space-between;gap:16px}", ".milestoneTopline,.milestoneFooter{display:flex;justify-content:space-between;gap:12px}"],
];

for (const [before, after] of replacements) source = source.replace(before, after);
writeFileSync(path, source);
