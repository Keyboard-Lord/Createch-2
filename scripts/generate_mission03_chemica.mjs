import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
const source=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission03_chemica_containment.json')));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const jar=path.join(liveRoot,source.provider),check=process.argv.includes('--check');
assert.equal(sha(fs.readFileSync(jar)),source.sha256);
assert.equal(Object.keys(source.recipes).length,20);
for(const[resource,row]of Object.entries(source.recipes)){
  const native=execFileSync('unzip',['-p',jar,resource]);assert.equal(sha(native),row.nativeSha256);
  assert.deepEqual(JSON.parse(native),row.data);assert.equal(row.data.type,'tfmg:vat_machine_recipe');
  const data={...row.data,'neoforge:conditions':[{type:'neoforge:false'}]};
  const file=path.join(liveRoot,'kubejs',resource),bytes=JSON.stringify(data,null,2)+'\n';
  if(check)assert.equal(fs.readFileSync(file,'utf8'),bytes,'New leaching containment drift: '+resource);
  else{if(fs.existsSync(file))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Unreviewed existing override: '+resource);
    fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
}
console.log(JSON.stringify({mode:check?'check':'write',newNativeLeachingIdsContained:20,priorApprovedRoutes:205}));
