import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';
// Static release policy is canonical. Never reconstruct it on a server reload.

import crypto from 'node:crypto';
import assert from 'node:assert/strict';


const policy={...JSON.parse(fs.readFileSync('createch-dev/runtime-state/chemica-policy.json')),...JSON.parse(fs.readFileSync('createch-dev/scripts/sources/mission03_provider_refresh.json')).chemicaPolicy};
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert(!fs.existsSync(policy.retiredRuntimeSource),'Redundant Chemica runtime authority restored');
assert.equal(digest(fs.readFileSync(`mods/${policy.shippedArtifact}`)),policy.artifactSha256,'Chemica changed; review its deny-by-default recipe policy before release');
const files=fs.readdirSync(policy.source,{recursive:true}).filter(p=>p.endsWith('.json')).sort();
assert.equal(digest(JSON.stringify(files.map(p=>[p,digest(fs.readFileSync(`${policy.source}/${p}`))]))),policy.staticSha256,'Static Chemica policy drifted from its reviewed release pin');
const covered=new Set(files.map(p=>`data/chemica/recipe/${p}`));
// Check all installed top-level providers, not just Chemica's own JAR: an addon
// must not silently introduce an unreviewed recipe in the denied namespace.
const providers=[];
for(const jar of fs.readdirSync('mods').filter(p=>p.endsWith('.jar')).sort()) {
  const recipes=execFileSync('/usr/bin/unzip',['-Z1',`mods/${jar}`],{encoding:'utf8',maxBuffer:16*1024*1024})
    .split('\n').filter(p=>/^data\/chemica\/recipe\/.+\.json$/.test(p));
  for(const p of recipes) assert(covered.has(p),`Unreviewed Chemica recipe: ${jar}!${p}`);
  if(recipes.length)providers.push({jar,recipes:recipes.length});
}
let approved=0,denied=0;
for(const p of files) {
  const r=JSON.parse(fs.readFileSync(`${policy.source}/${p}`));
  if(r['neoforge:conditions']?.some(c=>c.type==='neoforge:false'))denied++;
  else approved++;
}
assert.equal(approved,policy.approved);assert.equal(denied,policy.denied);
const report={truth:'VERIFIED_STATIC',approved,denied,providers,staticSha256:policy.staticSha256,
  runtimeRecipeReconstructionsRemoved:approved,namespaceRemovalPassesRemoved:1,
  runtime:'Not launched for this slice; reload timing and final recipe integration remain candidate convergence checks.'};
fs.writeFileSync('createch-dev/runtime-state/chemica-static-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
