import fs from "node:fs";

const path = "src/App.jsx";
let source = fs.readFileSync(path, "utf8");

const replacements = [
  [
    'const visibleHomeDrills=useMemo(()=>filterAtHomeDrills({drills,todayScores:todayS,filter:homeDrillFilter}),[drills,todayS,homeDrillFilter]);',
    'const visiblePlayerHomeDrills=useMemo(()=>filterAtHomeDrills({drills,todayScores:todayS,filter:homeDrillFilter}),[drills,todayS,homeDrillFilter]);',
  ],
  [
    'const visibleProgramSessionBlocks=useMemo(()=>filterProgramSessionBlocks({blocks:programSessionBlocks.grouped,todayScores:todayProgramScores,filter:programDrillFilter}),[programSessionBlocks.grouped,todayProgramScores,programDrillFilter]);',
    'const visiblePlayerProgramSessionBlocks=useMemo(()=>filterProgramSessionBlocks({blocks:programSessionBlocks.grouped,todayScores:todayProgramScores,filter:programDrillFilter}),[programSessionBlocks.grouped,todayProgramScores,programDrillFilter]);',
  ],
  ['{visibleHomeDrills.length===0&&<PlayerWorkspaceEmptyState', '{visiblePlayerHomeDrills.length===0&&<PlayerWorkspaceEmptyState'],
  ['{visibleHomeDrills.map(d=>{const done=todayS.find(s=>s.drillId===d.id);', '{visiblePlayerHomeDrills.map(d=>{const done=todayS.find(s=>s.drillId===d.id);'],
  ['{visibleProgramSessionBlocks.length===0&&<PlayerWorkspaceEmptyState', '{visiblePlayerProgramSessionBlocks.length===0&&<PlayerWorkspaceEmptyState'],
  ['{visibleProgramSessionBlocks.map((block,blockIndex)=><div key={block.phase}', '{visiblePlayerProgramSessionBlocks.map((block,blockIndex)=><div key={block.phase}'],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`rename anchor missing: ${from.slice(0, 80)}`);
  source = source.replace(from, to);
}

fs.writeFileSync(path, source);
console.log("Player workspace state names scoped successfully.");
