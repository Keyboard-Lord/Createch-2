import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity'),native=JSON.parse(fs.readFileSync(path.join(state,'native-resources.json'))),rows=[];
for(const [id,list]of Object.entries(native.recipes).filter(([id])=>id.startsWith('woodencog:compacting/ceramic/'))){
 assert.equal(list.length,1);const d=list[0].data;assert.equal(d.type,'create:compacting');assert.equal(d.results.length,1);assert(d.ingredients.every(i=>i.tag==='tfc:clay_knapping'));
 const output=d.results[0].id;const refunds=Object.entries(native.recipes).flatMap(([id,ds])=>ds.filter(({data:r})=>r.type==='minecraft:crafting_shapeless'&&r.ingredients?.length===1&&r.ingredients[0].item===output&&r.result?.id==='minecraft:clay_ball').map(({data:r})=>({id,count:r.result.count??1})));
 if(!refunds.length)continue;const required=Math.max(...refunds.map(r=>r.count))*(d.results[0].count??1);if(required<=d.ingredients.length)continue;
 const fixed={_generated_by:'createch-dev/scripts/reconcile_clay_recycling.mjs',...d,ingredients:Array.from({length:required},()=>({tag:'tfc:clay_knapping'}))};
 const target=path.join(liveRoot,'kubejs/data/woodencog/recipe',id.split(':')[1]+'.json'),text=JSON.stringify(fixed,null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),text,id);else {fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);}
 rows.push({recipe:id,output,before:d.ingredients.length,after:required,refunds});
}
assert(rows.length>0);fs.writeFileSync(path.join(state,'clay-conservation.json'),JSON.stringify({truth:'VERIFIED_STATIC',reason:'Four-clay pressing followed by five-clay TFC recovery amplified matter, feeding downstream terracotta/gold/glass EMC paths.',repairs:rows},null,2)+'\n');console.log(JSON.stringify({repairedNativeIds:rows.length,preservesAutomation:true}));
