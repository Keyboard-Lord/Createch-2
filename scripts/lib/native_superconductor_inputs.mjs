import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

export function nativeSuperconductorInputs({root,native,authored,policy,removals,tags,world,locks,power}) {
  assert.equal(world.superconductorWorld?.truth,'STATIC_ACTIVE_VENUS_CORRONIUM_AND_MARS_SPODUMENE');
  const ids={spodumene:'createch2:tfc_geology/high_pressure/spodumene/normal',lithium:'createch2:greate/suppliers/lithium_crushed_stock',corronium:'createch2:high_pressure/stellaris/corronium_ingot',dust:'createch2:quantum/superconductor/quantum_alloy_dust',hot:'modern_industrialization:materials/blast_furnace/superconductor',cold:'createch2:quantum/superconductor/cryogenic_ingot',wire:'createch2:quantum/superconductor/wire',cable:'createch2:quantum/superconductor/cable',qubit:'modern_industrialization:electric_age/component/assembler/qubit'};
  const recipes={},events={};for(const id of Object.values(ids)){
    const own=authored.has(id),rows=native.recipes[id]??[];assert(own||rows.length===1,id);const raw=own?authored.get(id):rows[0].data;
    if(!own)assert.deepEqual(JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',rows[0].provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'})),raw);
    const event=replayRecipeEventEntry(id,raw,own?'authored':'native',policy.modifications,removals);assert(!event.removed,id+' retired');recipes[id]=event.data;events[id]=event.applied;
  }
  const lithium=JSON.parse(fs.readFileSync(path.join(root,'kubejs/data/createch2/material_contracts/authority.json'))).materials.lithium;
  const final={...recipes[ids.lithium]};delete final._generated_by;
  assert.deepEqual(final,{type:'modern_industrialization:macerator',eu:2,duration:200,item_inputs:[{item:'tfmg:crushed_raw_lithium',amount:1}],item_outputs:[{item:'mekanism:dust_lithium',amount:1}]});assert.deepEqual(final,lithium.acquisition.processingRecipe);
  assert.deepEqual(locks.get(ids.lithium),['research:createch2:geo_03_deep_extraction']);assert.equal(lithium.acquisition.gate,'GEO-03');
  assert(tags.hasTag('c:dusts/lithium','mekanism:dust_lithium'));
  const crusherRows=native.recipes['mekanism:crusher'];assert.equal(crusherRows.length,1);const oldCrusher=replayRecipeEventEntry('mekanism:crusher',crusherRows[0].data,'native',policy.modifications,removals);assert(oldCrusher.removed,'Retain the native Crusher retirement');
  assert.deepEqual(recipes[ids.spodumene].item_inputs,[{tag:'createch2:tfc_ores/spodumene/normal',amount:1},{item:'modern_industrialization:processing_unit',amount:1,probability:0}]);assert.deepEqual(recipes[ids.spodumene].item_outputs,[{item:'tfmg:crushed_raw_lithium',amount:2}]);
  assert.equal(recipes[ids.corronium].eu,128);assert.deepEqual(recipes[ids.corronium].item_inputs,[{item:'stellaris:raw_corronium',amount:1},{tag:'c:dusts/titanium',amount:1}]);
  assert.equal(recipes[ids.hot].eu,128);assert.deepEqual(recipes[ids.hot].item_inputs,{tag:'c:dusts/superconductor',amount:1});
  assert.deepEqual(recipes[ids.cold].item_inputs,[{item:'modern_industrialization:superconductor_hot_ingot',amount:1}]);assert.deepEqual(recipes[ids.cold].fluid_inputs,{fluid:'modern_industrialization:cryofluid',amount:500});
  assert.equal(recipes[ids.dust].eu,256);assert.deepEqual(recipes[ids.dust].item_outputs,[{item:'modern_industrialization:superconductor_dust',amount:6}]);
  const number=(name,key)=>{const text=fs.readFileSync(path.join(root,'config/Mekanism/'+name+'.toml'),'utf8'),match=text.match(new RegExp('^\\s*'+key+' = ([\\d.]+)$','m'));assert(match,key);return Number(match[1]);};
  const legacyUsage=number('machine-usage','crusher'),joulesPerFe=number('general','feConversionRate');assert.equal(legacyUsage,50);assert.equal(joulesPerFe,2.5);assert.equal(power.fePerEu,10);assert.equal(final.duration,200);assert.equal(final.eu*power.fePerEu*joulesPerFe,legacyUsage);assert(power.steamProcessors.macerator.some(p=>p.maxEu>=final.eu));
  const negatives=[];const review=d=>assert.deepEqual(d,final);for(const[name,change]of [['yield_inflation',d=>d.item_outputs[0].amount=2],['fine_powder_alias',d=>d.item_inputs[0].item='tfc_metallurgy:metal/dust/lithium'],['retired_machine',d=>d.type='mekanism:crushing'],['free_energy',d=>d.eu=0]]){const bad=structuredClone(final);change(bad);assert.throws(()=>review(bad));negatives.push({name,rejected:true});}
  return {truth:'STATIC_RETAINED_MI_LITHIUM_AND_SUPERCONDUCTOR_INPUTS',ids,recipes,events,researchOwners:Object.fromEntries(Object.values(ids).map(id=>[id,locks.get(id)??[]])),repair:{id:ids.lithium,oldType:'mekanism:crushing',newType:final.type,nativeCrusherRemainsRetired:true,yield:1,gate:'GEO-03',energyEuPerTick:2,duration:200,totalEu:400,energyBasis:{legacyUsageJPerTick:legacyUsage,legacyDuration:200,fePerEu:power.fePerEu,joulesPerFe},primitiveSmeltingRestored:false},negativeCases:negatives,world:world.superconductorWorld,stockCredited:0,observedOutputs:false,limits:['The unchanged recipe ID,1:1full-dust yield,GEO-03owner and graded concentration/reusable Processing Unit remain. Only finishing moves from the retired Mekanism Crusher to retained MI macerators. No machine recipe is restored and other Mekanism codecs remain unmodeled.','Existing active Venus/Mars deposits and retained supplier/manufacturing recipes under the declared factory frontier. Ordinary cargo collection, counts, steam/EU service, native matching and actual operation remain unobserved. Earlier paid stock banks are separate.','The native128EU hot-ingot route is retained alongside the existing authored higher-cost alternative. This contract does not invent nuclear-alloy stock or remove research owners; all actual locks and ingredient/power rules remain in the graph.']};
}
