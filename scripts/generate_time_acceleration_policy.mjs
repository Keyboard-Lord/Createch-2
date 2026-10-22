import { toolFs as fs } from './lib/live_paths.mjs';

import path from 'node:path';
import assert from 'node:assert/strict';
const policy=JSON.parse(fs.readFileSync('createch-dev/scripts/sources/time_acceleration_policy.json'));
const outputs={
  'kubejs/data/justdirethings/tags/block/tick_speed_deny.json':policy.targets.map(t=>t.block),
  'kubejs/data/projecte/tags/block_entity_type/blacklist/time_watch.json':policy.targets.map(t=>t.blockEntity)
};
for(const [file,values]of Object.entries(outputs)) {
  assert.equal(new Set(values).size,values.length);
  const data=JSON.stringify({replace:false,values},null,2)+'\n';
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),data,`Acceleration policy drift: ${file}`);
  else {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);}
}
console.log(`Time acceleration policy: ${policy.targets.length} existing exclusions shared by JDT and ProjectE.`);
