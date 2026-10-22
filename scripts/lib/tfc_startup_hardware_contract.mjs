import fs from 'node:fs';import assert from 'node:assert/strict';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

export function tfcStartupHardwareContract({native,authored,policy,removals,tags,world,leather}){
 const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_tfc_startup_hardware_repair.json',import.meta.url),'utf8')),recipes={},events={};
 for(const[id,p]of Object.entries(f.repairs)){
  assert.deepEqual(native.recipes[id],p.nativeRows,'Original native hardware changed '+id);assert.deepEqual(authored.get(id),p.after,'Exact authored hardware repair drift '+id);
  const before=structuredClone(p.before),after=structuredClone(p.after);assert.deepEqual(after.key[p.changedKey],[before.key[p.changedKey],{tag:p.tag}]);delete before.key[p.changedKey];delete after.key[p.changedKey];assert.deepEqual(after,before,'Hardware repair changed more than selected ingredient '+id);
 }
 for(const[id,expected]of Object.entries(f.recipes)){
  const kind=f.kinds[id],actual=kind==='authored'?authored.get(id):native.recipes[id]?.[0]?.data;assert.deepEqual(actual,expected,'Hardware source changed '+id);assert(!policy.additions.some(r=>r.id===id),'Unexpected scripted hardware override '+id);
  const e=replayRecipeEventEntry(id,actual,kind,policy.modifications,removals);assert(!e.removed,id+' hardware supplier retired');assert(!(e.data['neoforge:conditions']??[]).some(c=>c.type==='neoforge:false'));recipes[id]=e.data;events[id]={kind,normalizations:e.applied};
 }
 assert(tags.hasTag('c:barrels/wooden','tfc:wood/barrel/oak'));assert(tags.hasTag('c:stones','tfc:rock/raw/quartzite'));
 assert.deepEqual(recipes[f.ids.barrel],leather.recipes[leather.ids.barrel]);assert(JSON.stringify(world.survivalSources.quartziteSource).includes('tfc:rock/raw/quartzite'));
 assert.deepEqual(recipes[f.ids.tank].result,{count:1,id:'tfmg:cast_iron_fluid_tank'});assert.deepEqual(recipes[f.ids.stonecutter].key.I,{item:'minecraft:iron_ingot'});assert.equal(recipes[f.ids.intake].result.count,3);assert.equal(recipes[f.ids.stove].result.count,2);
 const guards=[];for(const[id,p]of Object.entries(f.repairs))for(const kind of ['old_literal','changed_yield','changed_pattern','changed_metal']){const d=structuredClone(p.after);if(kind==='old_literal')d.key[p.changedKey]=p.before.key[p.changedKey];if(kind==='changed_yield')d.result.count++;if(kind==='changed_pattern')d.pattern[0]='XXX';if(kind==='changed_metal')d.key[id===f.ids.tank?'P':'I']={item:'minecraft:copper_ingot'};assert.notDeepEqual(d,p.after);guards.push({recipe:id,name:kind,rejected:true});}
 return {truth:'STATIC_TFC_FIRST_TFMG_INTAKE_AND_STOVE_HARDWARE',ids:f.ids,recipes,events,repairs:f.repairs,quantityPlan:f.plan,quartziteSource:world.survivalSources.quartziteSource,barrelSource:leather.ids.barrel,nativeGuardCases:guards,limits:['Two exact existing native IDs retain their patterns, iron/cast-iron inputs and yields. Only the wooden-barrel slot and three-stone slot add existing common tags alongside their original literal items, admitting the already reviewed TFC oak barrel and raw quartzite.','Selected intake and stove manufacturing only. Earlier non-steel foundry/workshop metals, fire-clay/brick materials, oak lumber and precision stocks remain explicit boundaries; finite aggregate procurement and actual inventory are not certified.','No operating air/hot-air/steel token, stress/throughput claim or furnace completion is introduced. The pending native furnace work-rate and gas-storage plan remains a separate cut.','All quest/task/reward/research identities and definitions, P0metal units/recovery/EMC and Core remain unchanged. Loaded crafting/tag acceptance, inventory/container contents, placement and operation remain runtime qualification. No Minecraft or packaging.']};
}
