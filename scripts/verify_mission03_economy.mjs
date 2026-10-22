import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/mission03');
const native=JSON.parse(fs.readFileSync(path.join(state,'native-resources.json'))),cap=captureRecipePolicy(liveRoot);
const magic=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission03_magic.json')));
const read=p=>JSON.parse(fs.readFileSync(path.join(liveRoot,p),'utf8'));
const ledger=read('kubejs/config/createch2_research_tree.json');
const graded=[];
for(const metal of magic.metals){
  const tagFile='data/c/tags/item/ores/'+metal+'.json';
  const tag=JSON.parse(execFileSync('unzip',['-p',path.join(liveRoot,magic.gradedTagProvider.file),tagFile],{encoding:'utf8'}));
  for(const grade of ['poor','normal','rich'])assert(tag.values.some(v=>typeof v==='string'&&v.includes('/'+grade+'_')),metal+' '+grade);
  for(const form of ['ore','raw']){
    const id='occultism:crushing/'+metal+'_dust_from_'+form,d=native.recipes[id].data;
    assert.equal(d.result.count,2);assert.equal(d.result.tag,'c:dusts/'+metal);
    assert(cap.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),id);graded.push(id);
  }
  const id='occultism:crushing/'+metal+'_dust_from_ingot',d=native.recipes[id]?.data;
  if(d){assert.equal(d.result.count,1);assert.equal(d.ignore_crushing_multiplier,true);
    assert(!cap.removals.some(r=>matchesRecipeFilter(r.filter,id,{...d,result:{id:'modern_industrialization:'+metal+'_dust',count:1}})===true),'Native 1:1 processing lost '+id);}
}
for(const id of ['occultism:crafting/chalk_white_impure','occultism:crafting/chalk_white_impure2'])
  assert(ledger.nodes.find(n=>n.code==='ESO-03').recipes_unlocked.includes(id));
const miners=cap.additions.filter(r=>r.custom?.type==='occultism:miner');assert.equal(miners.length,11);
assert(miners.every(r=>/^minecraft:(?:cobblestone|sand|clay_ball|gravel|tuff|deepslate|blackstone|calcite|obsidian|end_stone|purpur_block)$/.test(r.custom.result.stack.id)));
for(const[id,{data:d}]of Object.entries(native.recipes).filter(([,r])=>r.data.type==='occultism:miner'))
  assert(cap.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Unbounded miner survived '+id);
const miJar=path.join(liveRoot,'mods/Modern-Industrialization-2.5.10.jar');
const miBlacklist=JSON.parse(execFileSync('unzip',['-p',miJar,'data/modern_industrialization/tags/item/replicator_blacklist.json'],{encoding:'utf8'}));
const miCode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-p','-c','-classpath',miJar,
  'aztech.modern_industrialization.machines.blockentities.ReplicatorMachineBlockEntity'],{encoding:'utf8'});
for(const text of ['canReplicate(net.minecraft.world.item.ItemStack)','ItemStack.is:','ItemVariant.toStack:',
  'MIItemStorage.insertAllSlot:','long 100l'])assert(miCode.includes(text),text);
const bulk=staticBulkReplicationPolicy(liveRoot,{itemTags:{'modern_industrialization:replicator_blacklist':[{data:miBlacklist}]},itemModels:{}},{includeAuthored:true});
const blocked=['minecraft:knowledge_book','researchd:research_pack','hostilenetworks:data_model','hostilenetworks:blank_data_model',
  'hostilenetworks:deep_learner','hostilenetworks:prediction_matrix','hostilenetworks:sim_chamber','hostilenetworks:loot_fabricator',
  'productivebees:spawn_egg_configurable_bee','productivebees:bee_cage','productivebees:sturdy_bee_cage',
  'productivebees:advanced_oak_beehive','productivebees:advanced_spruce_beehive_clear',
  'minecraft:beehive','minecraft:bee_nest','hostile_neural_industrialization:electric_simulation_chamber',
  'modern_industrialization:uu_matter_bucket','modern_industrialization:replicator','eternal_starlight:starcore'];
for(const id of blocked)assert(bulk.blocked(id),'Replicatable evidence or progression device '+id);
const allowed=['minecraft:cobblestone','tfc:metal/ingot/copper','productivebees:wax','minecraft:honey_bottle'];
for(const id of allowed)assert(!bulk.blocked(id),'Ordinary bulk replication lost '+id);
for(const code of ['MTR-03','MTR-04','RSR-01','COM-04'])assert(ledger.nodes.some(n=>n.code===code));
const hnn=read('kubejs/data/createch2/recipe/hnn/sim_chamber.json');
assert(ledger.nodes.find(n=>n.code==='COM-04').recipes_unlocked.includes('createch2:hnn/sim_chamber'));
assert(JSON.stringify(hnn).includes('hostilenetworks:prediction_matrix'));
assert(ledger.nodes.find(n=>n.code==='RSR-01').recipes_unlocked.includes('createch2:hni/electric_simulation_chamber'));
assert(ledger.nodes.find(n=>n.code==='MTR-04').recipes_unlocked.includes('createch2:quantum/matter/replicator'));
const report={truth:'STATIC_MAGIC_AND_MATTER_ECONOMY_CONVERGENCE_PASS',gradedMetalClosures:graded,
  retainedMinerRoutes:miners.length,replicationNegativeCases:blocked,ordinaryBulkPositiveCases:allowed,
  miArtifactSha256:crypto.createHash('sha256').update(fs.readFileSync(miJar)).digest('hex'),
  preserved:['Native Enchanted preparations and TFC sapling byproducts','Malum Spirit Altar discoveries and existing late convergence','Occultism name binding, rituals, storage and 1:1 ingot processing','HNN learned-model loop, prediction consumption and native power','HNI researched acceleration and Quantum paid UU replication'],
  runtimeObserved:false,limits:'Static tags, bytecode contracts, research and recipe declarations. Native probability, team state, processing, component copying and live EMC values remain runtime qualification.'};
fs.writeFileSync(path.join(state,'economy-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,gradedMetalClosures:graded.length,retainedMiners:miners.length,replicationNegativeCases:blocked.length,bulkPositiveCases:allowed.length}));
