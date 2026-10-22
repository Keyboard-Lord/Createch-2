import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot, developmentRoot} from './lib/live_paths.mjs';

const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_tfc_alpha.json')));
for(const[p,data]of Object.entries(f.resources)){
 assert(/^kubejs\/data\/createch2\/(tags\/worldgen\/biome\/tfc_alpha_werewolf_habitat|neoforge\/biome_modifier\/tfc_alpha_werewolf)\.json$/.test(p));
 const file=path.join(liveRoot,p),text=JSON.stringify(data,null,2)+'\n';
 if(process.argv.includes('--check')) assert.equal(fs.readFileSync(file,'utf8'),text,p);
 else {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}
}
console.log(JSON.stringify({truth:f.truth,resources:Object.keys(f.resources).length,mode:process.argv.includes('--check')?'CHECK':'APPLY'}));
