import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fail = (message) => { throw new Error(`[mobile-auth-signature-stage] ${message}`); };
const replaceOnce = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`${label}: expected one source anchor, found ${count}`);
  return source.replace(from, to);
};

export function promoteAuthSignature(source) {
  let next = source;
  next = replaceOnce(next,
    'const inp={width:"100%",height:52,padding:"0 15px",background:"#F8F7F2",border:"1px solid rgba(17,26,33,.14)"',
    'const inp={width:"100%",height:52,padding:"0 15px",background:"#FFFFFF",border:"1px solid rgba(17,26,33,.14)"',
    'Auth input material',
  );
  next = replaceOnce(next,
    'fontSize:10,fontWeight:750,letterSpacing:".05em",textTransform:"uppercase"}}><span style={{width:6,height:6,borderRadius:999,background:"#8CAB12"}}/>Team ready',
    'fontSize:11,fontWeight:750,letterSpacing:".05em",textTransform:"uppercase"}}><span style={{width:6,height:6,borderRadius:999,background:"#8CAB12"}}/>Team ready',
    'Auth readiness label',
  );
  next = replaceOnce(next,
    '<div className="auth-card-enter" style={{background:"rgba(255,255,255,.92)",borderRadius:26,padding:"24px 22px",border:"1px solid rgba(17,26,33,.09)",boxShadow:"0 2px 4px rgba(17,26,33,.04),0 24px 70px rgba(17,26,33,.10)",WebkitBackdropFilter:"blur(20px)",backdropFilter:"blur(20px)"}}>',
    '<div className="auth-card-enter" style={{background:"transparent",borderRadius:0,padding:"22px 4px 0",border:"0",borderTop:"1px solid rgba(17,26,33,.14)",boxShadow:"none"}}>',
    'Auth editorial form field',
  );
  next = replaceOnce(next,
    'fontSize:25,fontWeight:780,lineHeight:1.05,letterSpacing:"-.035em",margin:0}}>Welcome back',
    'fontSize:27,fontWeight:780,lineHeight:1.02,letterSpacing:"-.04em",margin:0}}>Welcome back',
    'Auth login heading',
  );
  next = replaceOnce(next,
    'fontSize:10,fontWeight:750,letterSpacing:".08em",textTransform:"uppercase"}}>{activeTrack.label}',
    'fontSize:11,fontWeight:750,letterSpacing:".08em",textTransform:"uppercase"}}>{activeTrack.label}',
    'Auth setup label',
  );
  next = replaceOnce(next,
    'background:"rgba(126,158,30,.11)",color:"#617900",fontSize:10,fontWeight:800}}>{index+1}',
    'background:"rgba(126,158,30,.11)",color:"#617900",fontSize:11,fontWeight:800}}>{index+1}',
    'Auth setup step number',
  );
  return next;
}

export function applyMobileAuthSignatureStage({ cwd = process.cwd() } = {}) {
  const target = path.resolve(cwd, 'src/components/AuthWorkspace.jsx');
  const source = readFileSync(target, 'utf8');
  const next = promoteAuthSignature(source);
  if (next !== source) writeFileSync(target, next);
  console.log('Promoted authentication into the ShotLab editorial mobile signature stage.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobileAuthSignatureStage();
