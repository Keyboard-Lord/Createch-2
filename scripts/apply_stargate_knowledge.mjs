import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_stargate_knowledge.json')));
for(const[relative,data]of Object.entries(f.resources)){
 assert(/^kubejs\/data\/createch2\/(advancement|loot_table)\/offworld_archaeology\/[a-z_]+\.json$/.test(relative));
 const file=path.join(liveRoot,relative),text=JSON.stringify(data,null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),text,relative);
 else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}
}
console.log(JSON.stringify({resources:Object.keys(f.resources).length,newAdvancements:2,newItemIds:0,mode:process.argv.includes('--check')?'CHECK':'APPLY'}));
