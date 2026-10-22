import { toolFs as fs } from './lib/live_paths.mjs';

import path from 'node:path';
import assert from 'node:assert/strict';
import generate from './sources/tfc_ore_tags.mjs';

const check=process.argv.includes('--check');
const tags=new Map();let additions=0;
generate({add(tag,value){
  assert(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(tag));
  assert(/^#?[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value));
  if(!tags.has(tag))tags.set(tag,new Set());
  tags.get(tag).add(value);additions++;
}});
// KubeJS skips absent registry IDs but retains required tag references.
const outputs=[];
for(const [tag,values] of [...tags].sort(([a],[b])=>a.localeCompare(b))) {
  const [namespace,id]=tag.split(':');
  const file=`kubejs/data/${namespace}/tags/item/${id}.json`;
  const content=JSON.stringify({replace:false,values:[...values].map(id=>id.startsWith('#')?id:{id,required:false})},null,2)+'\n';
  if(check)assert.equal(fs.readFileSync(file,'utf8'),content,`Generated tag drift: ${file}`);
  else {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
  outputs.push(file);
}
const inventory='createch-dev/runtime-state/tfc-ore-tags-generated.json';
const report={source:'createch-dev/scripts/sources/tfc_ore_tags.mjs',generator:'createch-dev/scripts/generate_tfc_ore_tags.mjs',additions,outputs};
if(check)assert.equal(fs.readFileSync(inventory,'utf8'),JSON.stringify(report,null,2)+'\n','Generated tag inventory drift');
else fs.writeFileSync(inventory,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({mode:check?'check':'write',tags:tags.size,runtimeAdditionsRemoved:additions}));
