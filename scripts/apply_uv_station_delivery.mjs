import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_uv_controls.json')));
const check=process.argv.includes('--check'),id=f.station.id;
const source=path.join(liveRoot,f.station.file),old=fs.readFileSync(source,'utf8');
let next=old;
if(!old.includes(id)){
 assert.equal(sha(old),f.priorSourceSha256[f.station.file]);
 const at=old.lastIndexOf('\n})');assert(at>0);
 next=old.slice(0,at)+'\n\n  // GT 8.1.0 records the condition above but omits its station recipe.\n  // Reuse the installed native factory so the orb carries native research data.\n  var StationResearchRecipes = Java.loadClass(\'createch2.core.compat.GtStationResearchRecipes\')\n  var ResourceLocation = Java.loadClass(\'net.minecraft.resources.ResourceLocation\')\n  var stationId = \''+id+'\'\n  var stationRecipe = StationResearchRecipes.stationRecipe(\n    Item.of(\'gtceu:crystal_processor_computer\'), 16, ResourceLocation.parse(stationId)\n  )\n  if (stationRecipe) StationResearchRecipes.assignStationId(event.custom(stationRecipe), ResourceLocation.parse(stationId))'+old.slice(at);
}
if(check)assert.equal(next,old,'Missing UV station provider');else if(next!==old)fs.writeFileSync(source,next);
for(const relative of ['kubejs/config/createch2_research_tree.json',f.station.nativeResearchFile]){
 const p=path.join(liveRoot,relative),s=fs.readFileSync(p,'utf8'),d=JSON.parse(s),list=relative.includes('/config/')?d.nodes.find(n=>n.code==='FRN-05').recipes_unlocked:d.effect.recipes;
 assert.equal(list.filter(v=>v===id).length,check?1:list.includes(id)?1:0);
 if(!list.includes(id)){assert.equal(sha(s),f.priorSourceSha256[relative]);list.push(id);if(!check)fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');}
}
console.log(JSON.stringify({mode:check?'CHECK':'APPLY',station:id,researchOwner:'FRN-05',existingConsumerAndLogicIdsChanged:0,newItems:0}));
