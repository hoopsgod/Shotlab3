import fs from "node:fs";

const file = "tests/e2e/app-store-screenshots.spec.mjs";
let source = fs.readFileSync(file, "utf8");

const replacements = [
  [
    '      .top{position:absolute;left:28px;right:28px;top:22px;z-index:2}',
    '      .top{position:absolute;left:7vw;right:7vw;top:2.4vh;z-index:2}',
  ],
  [
    '      .brand{display:flex;align-items:center;gap:9px;color:#C8FF1A;font-size:10px;font-weight:900;letter-spacing:.22em}',
    '      .brand{display:flex;align-items:center;gap:2vw;color:#C8FF1A;font-size:2.15vw;font-weight:900;letter-spacing:.22em}',
  ],
  [
    '      .mark{width:26px;height:26px;border:2px solid #C8FF1A;border-radius:8px;display:grid;place-items:center;font-size:9px;letter-spacing:0;box-shadow:0 0 22px #C8FF1A26}',
    '      .mark{width:6vw;height:6vw;border:.45vw solid #C8FF1A;border-radius:1.8vw;display:grid;place-items:center;font-size:2vw;letter-spacing:0;box-shadow:0 0 5vw #C8FF1A26}',
  ],
  [
    '      .role{margin-top:14px;color:${accent};font-size:9px;font-weight:900;letter-spacing:.16em}',
    '      .role{margin-top:1.2vh;color:${accent};font-size:1.9vw;font-weight:900;letter-spacing:.16em}',
  ],
  [
    '      h1{margin:6px 0 0;max-width:378px;font-family:Impact,"Arial Black",sans-serif;font-size:32px;line-height:.96;letter-spacing:.018em;text-transform:uppercase;font-weight:900}',
    '      h1{margin:.55vh 0 0;max-width:86vw;font-family:Impact,"Arial Black",sans-serif;font-size:7.4vw;line-height:.94;letter-spacing:.018em;text-transform:uppercase;font-weight:900}',
  ],
  [
    '      p{margin:8px 0 0;max-width:370px;color:rgba(255,255,255,.68);font-size:12px;font-weight:650;line-height:1.28}',
    '      p{margin:.65vh 0 0;max-width:86vw;color:rgba(255,255,255,.70);font-size:2.8vw;font-weight:650;line-height:1.26}',
  ],
  [
    '      .device{position:absolute;left:44px;top:184px;width:342px;height:742px;padding:6px;border-radius:36px;background:linear-gradient(145deg,rgba(255,255,255,.30),rgba(255,255,255,.05) 30%,rgba(200,255,26,.18));box-shadow:0 24px 60px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.12),0 0 42px ${accent}18;overflow:hidden}',
    '      .device{position:absolute;left:9vw;top:17.4vh;width:82vw;aspect-ratio:430/932;padding:1.1vw;border-radius:8.3vw;background:linear-gradient(145deg,rgba(255,255,255,.30),rgba(255,255,255,.05) 30%,rgba(200,255,26,.18));box-shadow:0 2.6vh 6.4vh rgba(0,0,0,.62),0 0 0 .15vw rgba(255,255,255,.12),0 0 9vw ${accent}18;overflow:hidden}',
  ],
  [
    '      .screen{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:30px;background:#080808}',
    '      .screen{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.2vw;background:#080808}',
  ],
  [
    '      .rule{position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,#C8FF1A,${accent},transparent)}',
    '      .rule{position:absolute;left:0;right:0;bottom:0;height:.35vh;background:linear-gradient(90deg,#C8FF1A,${accent},transparent)}',
  ],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`Screenshot composition anchor missing: ${from}`);
  source = source.replace(from, to);
}

fs.writeFileSync(file, source);
console.log("App Store screenshot composition expanded to proportional full-canvas framing.");
