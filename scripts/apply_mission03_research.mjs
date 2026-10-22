import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot} from './lib/live_paths.mjs';
import {applyDisciplineResearch, disciplineResearchOwners} from './sources/mission03_disciplines.mjs';
import {setRuntimeResearchRecipeIds} from './lib/research_runtime_aliases.mjs';

const check=process.argv.includes('--check');
const file='kubejs/config/createch2_research_tree.json';
const ledger=JSON.parse(fs.readFileSync(path.join(liveRoot,file),'utf8'));
applyDisciplineResearch(ledger);
const write=(name,value)=>{
  const p=path.join(liveRoot,name),next=JSON.stringify(value,null,2)+'\n';
  if(check)assert.equal(fs.readFileSync(p,'utf8'),next,'Discipline research drift: '+name);
  else if(fs.readFileSync(p,'utf8')!==next)fs.writeFileSync(p,next);
};
for(const node of ledger.nodes.filter(n=>Object.values(disciplineResearchOwners).includes(n.code))){
  const name='kubejs/data/createch2/researchd/research/'+node.id.split(':')[1]+'.json';
  const data=JSON.parse(fs.readFileSync(path.join(liveRoot,name),'utf8'));
  data.effect=setRuntimeResearchRecipeIds(node,data.effect);
  write(name,data);
}
write(file,ledger);
console.log(JSON.stringify({mode:check?'check':'write',exactDisciplineOwners:Object.keys(disciplineResearchOwners).length}));
