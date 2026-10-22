import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

export function nativeFirstWroughtContract(root,native,tags,world,policy,removals){
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_first_wrought.json',import.meta.url),'utf8'));
 assert.equal(world.firstWroughtSources?.truth,'STATIC_NATIVE_TFC_HEMATITE_WASHING_AND_BLOOMERY');
 assert.deepEqual(world.firstWroughtSources.nativeCodeSha256,fixture.nativeCodeSha256);
 for(const[id,row]of Object.entries(fixture.recipes)){
  assert.deepEqual(native.recipes[id],[row],'First-wrought native recipe index changed '+id);
  const actual=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',row.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));
  assert.deepEqual(actual,row.data);
  const effective=replayRecipeEventEntry(id,actual,'native',policy.modifications,removals);
  assert(!effective.removed,'Selected first-wrought recipe retired '+id);
  assert.deepEqual(effective.data,actual,'Selected first-wrought recipe normalized '+id);
 }
 const r=id=>fixture.recipes[id].data;
 const ids={hammer:'tfcorewashing:ores/hematite/hematite_normal_hammer',quern:'tfcorewashing:chunks/quern/chunks_hematite_quern',pellet:'tfcorewashing:crafting/pellet/hematite',briquet:'tfcorewashing:crafting/briquet/hematite',bloomery:'tfc:crafting/bloomery',bloom:'tfc:bloomery/raw_iron_bloom',refine:'tfc:anvil/refined_iron_bloom',wrought:'tfc:anvil/metal/ingot/wrought_iron',anvil:'tfc:crafting/metal/anvil/bronze',doubleIngot:'tfc:welding/metal/double_ingot/bronze',sheet:'tfc:anvil/metal/sheet/bronze',doubleSheet:'tfc:welding/metal/double_sheet/bronze',sluice:'tfc:crafting/wood/sluice/oak'};
 assert.equal(r(ids.hammer).result.count,5);
 assert(tags.hasTag('c:tools/hammer','tfc:stone/hammer/igneous_intrusive'));
 assert(tags.hasTag('c:ores/clean_dusts/iron','tfc:powder/hematite'));
 for(const[tag,item]of [['c:ingots/bronze','tfc:metal/ingot/bronze'],['c:double_ingots/bronze','tfc:metal/double_ingot/bronze'],['c:sheets/bronze','tfc:metal/sheet/bronze'],['tfc:double_sheets/any_bronze','tfc:metal/double_sheet/bronze']])assert(tags.hasTag(tag,item));
 const stub=native.recipes['tfc:heating/ore/normal_hematite'].find(row=>row.provider===fixture.washingJar);
 assert.deepEqual(stub.data['neoforge:conditions'],[{type:'neoforge:false'}]);
 assert.deepEqual(r(ids.bloom).fluid,{amount:100,fluid:'tfc:metal/cast_iron'});
 assert.deepEqual(r(ids.bloom).catalyst,{count:2,item:'minecraft:charcoal'});
 assert.equal(r(ids.bloom).duration,14400);
 for(const id of[ids.sheet,ids.refine,ids.wrought]){assert.equal(r(id).tier,2);assert.deepEqual(r(id).rules,['hit_last','hit_second_last','hit_third_last']);}
 for(const id of[ids.doubleIngot,ids.doubleSheet])assert.equal(r(id).tier,1);
 const matches=(input,item)=>Array.isArray(input)?input.some(v=>matches(v,item)):!!input&&(input.item===item||input.tag&&tags.hasTag(input.tag,item));
 const solidPotentials=[];
 for(const[item,amount]of [['tfc:powder/hematite',5],['tfcorewashing:pellet_hematite',20],['tfcorewashing:briquet_hematite',80]]){
  const matching=[];
  for(const[id,rows]of Object.entries(native.recipes))for(const row of rows){
   if(row.data.type!=='tfc:heating'||!matches(row.data.ingredient,item)||(row.data['neoforge:conditions']??[]).some(c=>c.type==='neoforge:false'))continue;
   const effective=replayRecipeEventEntry(id,row.data,'native',policy.modifications,removals);if(effective.removed)continue;
   assert.deepEqual(effective.data.result_fluid,{id:'tfc:metal/cast_iron',amount},'Conflicting bloomery solid potential '+id);
   matching.push(id);
  }
  assert.equal(matching.length,1,'Unique reviewed native solid potential required for '+item);solidPotentials.push({item,metalUnits:amount,nativeRecipe:matching[0]});
 }
 const quantityPlan={normalHematite:4,hammerRuns:4,rockyChunks:20,firstSluiceRuns:20,chunks:20,quernRuns:20,dirtyDust:20,secondSluiceRuns:20,cleanPowder:20,powderMetalUnits:5,pelletsProduced:5,pelletsIntoBriquet:4,briquets:1,retainedPellets:1,bloomeryMetalUnits:100,charcoal:2,bloomeryInputItems:4,blooms:1,refinedBlooms:1,wroughtIngots:1,sluiceWorkTicks:4000,bloomeryCalendarTicks:14400,hardware:{bronzeAnvilDoubleIngots:7,bloomeryDoubleSheets:8,bloomerySheets:16,bloomeryDoubleIngots:16,bronzeIngots:46,weldingRuns:31,flux:31,insulationBlocks:11,sluices:1},scope:'One100-unit bloom; hardware bill covers the bronze anvil and bloomery, excluding mining/pickaxe, quern/handstone, sluice timber, prior Copper workshop, heat fuel and tool-wear procurement. Sluice work ticks are forty serial100-tick operations, excluding collection/transfer/pauses. Native calendar ticks are not wall time.'};
 assert.equal(quantityPlan.normalHematite*r(ids.hammer).result.count,quantityPlan.cleanPowder);
 assert.equal(quantityPlan.cleanPowder*5,quantityPlan.bloomeryMetalUnits);
 assert.equal(quantityPlan.pelletsIntoBriquet*20,80);assert.equal(quantityPlan.retainedPellets*20+80,100);
 assert.equal(quantityPlan.hardware.bronzeIngots,2*(7+16));assert.equal(quantityPlan.hardware.flux,7+16+8);
 return {truth:'STATIC_NATIVE_FIRST_WROUGHT_RECIPE_AND_BATCH_CONTRACT',ids,recipes:Object.fromEntries(Object.entries(fixture.recipes).map(([id,row])=>[id,row.data])),world:world.firstWroughtSources,solidPotentials,quantityPlan,limits:world.firstWroughtSources.limits};
}
