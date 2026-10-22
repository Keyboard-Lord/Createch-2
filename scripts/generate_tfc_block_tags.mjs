import { toolFs as fs } from './lib/live_paths.mjs';

import path from 'node:path';
import assert from 'node:assert/strict';
import generate from './sources/tfc_block_tags.mjs';

const check=process.argv.includes('--check');
const contributions=new Map([
  ['minecraft:mineable/axe','createch2:compatibility/tfc_axe_mineable'],
  ['minecraft:mineable/pickaxe','createch2:compatibility/tfc_pickaxe_mineable'],
  ['tfc:logs_that_log','createch2:compatibility/tfc_logs_that_log']
]);
const fileFor=tag=>{const [ns,id]=tag.split(':');return `kubejs/data/${ns}/tags/block/${id}.json`;};
const tags=new Map();let additions=0;
generate({add(tag,value){
  assert(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(tag));
  assert(/^#?[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value));
  tag=contributions.get(tag)??tag;
  if(!tags.has(tag))tags.set(tag,new Set());
  tags.get(tag).add(value);additions++;
}});
// KubeJS skips absent registry IDs but retains required tag references.
const outputs=[];
for(const [tag,values] of [...tags].sort(([a],[b])=>a.localeCompare(b))) {
  const file=fileFor(tag),content=JSON.stringify({replace:false,values:[...values].map(id=>id.startsWith('#')?id:{id,required:false})},null,2)+'\n';
  if(check)assert.equal(fs.readFileSync(file,'utf8'),content,`Generated tag drift: ${file}`);
  else {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
  outputs.push(file);
}
// Shared tags keep their existing owner and unrelated values. Link a generated
// contribution rather than taking ownership of their whole file.
for(const [parent,child] of contributions) {
  const file=fileFor(parent),tag=JSON.parse(fs.readFileSync(file));
  if(check)assert(tag.values.includes(`#${child}`),`Missing TFC contribution: ${parent}`);
  else if(!tag.values.includes(`#${child}`)) {tag.values.push(`#${child}`);fs.writeFileSync(file,JSON.stringify(tag,null,2)+'\n');}
}
const inventory='createch-dev/runtime-state/tfc-block-tags-generated.json';
const report={source:'createch-dev/scripts/sources/tfc_block_tags.mjs',generator:'createch-dev/scripts/generate_tfc_block_tags.mjs',additions,contributions:Object.fromEntries(contributions),outputs};
if(check)assert.equal(fs.readFileSync(inventory,'utf8'),JSON.stringify(report,null,2)+'\n','Generated tag inventory drift');
else fs.writeFileSync(inventory,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({mode:check?'check':'write',tags:tags.size,runtimeAdditionsRemoved:additions}));
