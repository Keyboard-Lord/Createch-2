import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const minerals=['bauxite','bertrandite','cobaltite','galena','kernite','magnesite','monazite','native_iridium','native_osmium','native_platinum','pyrolusite','rutile','spodumene','stibnite','uraninite','wolframite','zircon'];
const members=tag=>read(path.join(liveRoot,'kubejs/data/'+tag.split(':')[0]+'/tags/item/'+tag.split(':')[1]+'.json')).values.map(v=>typeof v==='string'?v:v.id);
const rows=[];
const lootItems=data=>{
 const ids=[];
 function walk(v){if(!v||typeof v!=='object')return;if(v.type==='minecraft:item'&&typeof v.name==='string')ids.push(v.name);for(const value of Object.values(v))if(Array.isArray(value))value.forEach(walk);else walk(value);}
 walk(data);return ids;
};
function check(tag,item,block,jar,resource){
 assert(native.itemModels[item],'Missing loose ore model '+item);
 const ids=members(tag);assert(ids.includes(item),'Processing tag excludes mined ore '+item);assert(ids.includes(block),'Existing block compatibility changed '+block);
 const loot=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',jar),resource],{encoding:'utf8'}).replace(/^\uFEFF/,''));
 assert(lootItems(loot).includes(item),'Native block does not yield expected loose ore '+item);
 const accepts=values=>assert(values.includes(item),'Mined drop cannot enter processing');
 assert.throws(()=>accepts(ids.filter(id=>id!==item)));
 rows.push({tag,item,block,lootResource:resource});
}
for(const mineral of minerals)for(const grade of ['poor','normal','rich']){
 const base=grade+'_'+mineral;
 check('createch2:tfc_ores/'+mineral+'/'+grade,'tfc_metallurgy:ore/'+base,'tfc_metallurgy:ore/'+base+'/basalt','TFC Metallurgy 1.21.1-1.1.1.jar','data/tfc_metallurgy/loot_table/blocks/ore/'+base+'/basalt.json');
}
check('createch2:tfc_ores/certus_quartz/normal','tfc_metallurgy:ore/certus_quartz','tfc_metallurgy:ore/certus_quartz/basalt','TFC Metallurgy 1.21.1-1.1.1.jar','data/tfc_metallurgy/loot_table/blocks/ore/certus_quartz/basalt.json');
for(const grade of ['poor','normal','rich'])check('createch2:tfc_ores/chromite/'+grade,'firmalife:ore/'+grade+'_chromite','firmalife:ore/'+grade+'_chromite/basalt','Firmalife-NeoForge-1.21.1-3.0.15.jar','data/firmalife/loot_table/blocks/ore/'+grade+'_chromite/basalt.json');
const report={truth:'STATIC_MINED_ORE_PROCESSING_TAG_CONTINUITY',families:19,looseOreItems:rows.length,negativeMissingDropCases:rows.length,rows,limits:['Installed loot declarations and shipped item tags only; actual worldgen, mining and machine operation remain runtime qualification.','Existing rock-hosted compatibility and all processing recipe yields remain unchanged.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/ore-stock-tag-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,families:19,looseOreItems:rows.length,negativeCases:rows.length}));
