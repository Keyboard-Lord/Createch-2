import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {researchAliasPolicy as f,setRuntimeResearchRecipeIds} from './lib/research_runtime_aliases.mjs';
import {nativeResearchRuntimeAliases} from './lib/native_research_runtime_aliases.mjs';
import {captureRecipePolicy} from './lib/capture_recipe_policy.mjs';
const ledger=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'))),check=process.argv.includes('--check');
for(const[id,before]of Object.entries(f.researchBefore)){
  const node=ledger.nodes.find(n=>n.id===id);assert(node);
  const target=path.join(liveRoot,'kubejs/data/createch2/researchd/research',id.split(':')[1]+'.json'),after=structuredClone(before);after.effect=setRuntimeResearchRecipeIds(node,before.effect);
  const out=JSON.stringify(after,null,2)+'\n',current=fs.readFileSync(target,'utf8');
  if(check)assert.equal(current,out,'Research alias source/output drift: '+id);
  else{assert([JSON.stringify(before),JSON.stringify(after)].includes(JSON.stringify(JSON.parse(current))),'Unowned research edits: '+id);fs.writeFileSync(target,out);}
}
const native=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'))),authored=new Map();
for(const row of f.aliases){const [ns,rel]=row.source.split(':'),p=path.join(liveRoot,'kubejs/data',ns,'recipe',rel+'.json');if(fs.existsSync(p))authored.set(row.source,JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')));}
let result;for(const optional of [false,true])result=nativeResearchRuntimeAliases({root:liveRoot,native,authored,policy:captureRecipePolicy(liveRoot,optional)});
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission02/research-runtime-alias-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({truth:result.truth,mode:check?'check':'write',aliases:result.aliases.length,researchNodesChanged:result.changedResearch.length,nativeBindings:Object.keys(result.nativeCodeSha256).length,nativeNegatives:result.nativeNegativeCases.length,registrationAndTeamCases:result.registrationAndTeamCases.length,gateNegatives:result.negativeCases.length,providerModes:2}));
