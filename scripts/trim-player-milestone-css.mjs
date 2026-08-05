import { readFileSync, writeFileSync } from "node:fs";

const path = "src/components/PlayerCareerHistory.module.css";
let source = readFileSync(path, "utf8");

const fullBlock = ".milestoneCard{margin-top:14px;padding:18px;border-radius:20px;background:#1b211d;color:#fff}.milestoneTopline,.milestoneFooter{display:flex;justify-content:space-between;gap:16px}.milestoneTopline h3{margin:5px 0 0;font:800 clamp(22px,4vw,30px)/1.05 system-ui,sans-serif;letter-spacing:-.045em}.milestoneTopline .sectionLabel{color:#b8c2ba}.milestoneTopline>strong{color:var(--accent,#c8ff1a);font:800 clamp(24px,5vw,34px)/1 system-ui,sans-serif}.milestoneTrack{height:10px;margin-top:16px;overflow:hidden;border-radius:999px;background:#3a423c}.milestoneTrack span{display:block;height:100%;border-radius:inherit;background:var(--accent,#c8ff1a);transition:width .7s ease}.milestoneFooter{align-items:center;margin-top:12px}.milestoneFooter p{max-width:620px;margin:0;color:#c9d1cb;font:550 12px/1.5 system-ui,sans-serif}.milestoneFooter span{color:#fff;font:800 10px/1 system-ui,sans-serif;text-transform:uppercase}";
const compactBlock = ".milestoneCard{margin-top:14px;padding:16px;border-radius:18px;background:#1b211d;color:#fff}.milestoneTopline{display:flex;justify-content:space-between;gap:12px}.milestoneTopline h3{margin:5px 0 0}.milestoneTopline>strong{color:var(--accent,#c8ff1a);font-size:30px}.milestoneTrack{height:8px;margin-top:14px;border-radius:9px;background:#3a423c}.milestoneTrack span{display:block;height:100%;background:var(--accent,#c8ff1a)}.milestoneFooter{margin-top:10px}.milestoneFooter p{margin:0}";

source = source.replace(fullBlock, compactBlock);
source = source.replace(".milestoneFooter{align-items:flex-start;flex-direction:column}", "");
source = source.replace("@media(prefers-reduced-motion:reduce){.archiveButton,.milestoneTrack span{transition:none}.archiveButton:hover{transform:none}}", "@media(prefers-reduced-motion:reduce){.archiveButton{transition:none}.archiveButton:hover{transform:none}}");

writeFileSync(path, source);
