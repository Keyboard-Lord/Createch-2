import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{pathToFileURL}from'node:url';
import {developmentRoot,liveRoot} from './lib/live_paths.mjs';
const b=developmentRoot,root=liveRoot,planned=new Map(),write=fs.writeFileSync.bind(fs),read=fs.readFileSync.bind(fs),canonical=read(root+'/kubejs/config/createch2_research_tree.json','utf8');
// Replay the real writer without persisting any of its proposed output.
fs.writeFileSync=(file,data)=>planned.set(path.resolve(file),Buffer.isBuffer(data)?data.toString():String(data));
fs.readFileSync=(file,opts)=>{const key=typeof file==='string'?path.resolve(file):null;if(key&&planned.has(key)){const data=planned.get(key);return opts?data:Buffer.from(data);}return read(file,opts);};
try{await import(pathToFileURL(b+'/createch-dev/scripts/align_campaign_research.mjs'));}finally{fs.writeFileSync=write;fs.readFileSync=read;}
const{runtimeResearchRecipeIds,researchAliasPolicy:f,loadedResearchAliasPolicy:loaded}=await import(b+'/createch-dev/scripts/lib/research_runtime_aliases.mjs'),ledger=JSON.parse(planned.get(root+'/kubejs/config/createch2_research_tree.json')),extract=v=>{if(!v||typeof v!=='object')return [];if(v.type==='researchd:unlock_recipe')return[v.recipes];return Object.values(v).flatMap(x=>Array.isArray(x)?x.flatMap(extract):extract(x));};
for(const node of ledger.nodes){const file=root+'/kubejs/data/createch2/researchd/research/'+node.id.split(':')[1]+'.json';assert(planned.has(file));if(node.recipes_unlocked.length)assert.deepEqual(extract(JSON.parse(planned.get(file)).effect),[runtimeResearchRecipeIds(node)]);}
// Native unlock effects represent recipe membership; generator grouping may reorder
// existing entries without changing a gate. Preserve all other node fields exactly.
const unlockSemantics=value=>{if(!value||typeof value!=='object')return value;if(Array.isArray(value))return value.map(unlockSemantics);const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,unlockSemantics(v)]));if(out.type==='researchd:unlock_recipe'){assert.equal(new Set(out.recipes).size,out.recipes.length,'Duplicate native unlock');out.recipes=[...out.recipes].sort();}return out;};
for(const id of Object.keys(f.researchBefore)){const file=root+'/kubejs/data/createch2/researchd/research/'+id.split(':')[1]+'.json';assert.deepEqual(unlockSemantics(JSON.parse(planned.get(file))),unlockSemantics(JSON.parse(read(file,'utf8'))),'Current changed research differs from real generator replay: '+id);}
assert.equal(read(root+'/kubejs/config/createch2_research_tree.json','utf8'),canonical);
const row=loaded.rows[0],original=structuredClone(row),owner=ledger.nodes.find(n=>n.id===row.node),loadedNegatives=[];
for(const [field,value] of [['source','createch2:unowned'],['conditionalAlias','greate:integration/unowned'],['registeredAlias','greate:integration/createch2/wrong']]){
 try{row[field]=value;assert.throws(()=>runtimeResearchRecipeIds(owner));loadedNegatives.push(field);}finally{Object.assign(row,original);}
}
try{loaded.rows.push(row);assert.throws(()=>runtimeResearchRecipeIds(owner));loadedNegatives.push('duplicate');}finally{loaded.rows.pop();}
const result={truth:'READ_ONLY_RESEARCH_GENERATOR_ALIAS_REPLAY_PASS',plannedWrites:planned.size,researchNodesChecked:ledger.nodes.length,aliasNodesChecked:Object.keys(f.researchBefore).length,exactAliasesPreserved:f.aliases.length,loadedAliasesPreserved:loaded.rows.length,loadedNegatives,liveOutputsWritten:0,canonicalLedgerUnchanged:true};write(b+'/createch-dev/runtime-state/mission02/research-alias-generator-validation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
