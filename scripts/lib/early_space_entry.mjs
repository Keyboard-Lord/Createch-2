import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
import {readQuestSnbt} from './read_quest_snbt.mjs';

export function earlySpaceEntry({root,developmentRoot,native,authored,policy,removals,ledger}){
 const source=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/static_campaign_semantics.json'))),active={};
 for(const[id,expected]of Object.entries(source.nativeRecipeOverrides)){
  assert.deepEqual(native.recipes[id],source.nativeRecipeOverrideOrigins[id],id+' original provider changed');
  const actual=authored.get(id),clean=structuredClone(actual);delete clean._generated_by;assert.deepEqual(clean,expected);
  const event=replayRecipeEventEntry(id,actual,'authored',policy.modifications,removals);assert(!event.removed);assert.deepEqual(event.data,actual);active[id]=actual;
 }
 const crafting='modern_industrialization:electric_age/battery/lv_battery_asbl',assembly='modern_industrialization:assembler_generated/electric_age/battery/lv_battery';
 const a=active[crafting],b=active[assembly];
 assert.deepEqual(a.pattern,['cac','BrB','BrB']);assert.deepEqual(a.key.a,{tag:'c:plates/lead'});assert.deepEqual(a.key.B,{tag:'c:plates/lead'});assert.deepEqual(a.key.c,{item:'modern_industrialization:tin_cable'});assert.deepEqual(a.key.r,{item:'minecraft:redstone'});assert.equal(a.result.id,'modern_industrialization:redstone_battery');
 assert.deepEqual(b.item_inputs,[{amount:1,tag:'c:plates/lead'},{amount:2,item:'modern_industrialization:tin_cable'},{amount:4,tag:'c:plates/lead'},{amount:2,item:'minecraft:redstone'}]);assert.deepEqual(b.item_outputs,[{amount:1,item:'modern_industrialization:redstone_battery'}]);assert.equal(b.eu,8);assert.equal(b.duration,200);
 for(const id of [crafting,assembly])assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['ELE-02']);
 const blastCraft=active['modern_industrialization:vanilla_recipes/blast_furnace_asbl'],blastAssembly=active['modern_industrialization:assembler_generated/vanilla_recipes/blast_furnace'];
 assert.deepEqual(blastCraft.key.s,{item:'tfc:fire_bricks'});assert.equal(blastCraft.pattern.join('').split('s').length-1,3);assert.equal(blastCraft.result.count,2);
 assert.deepEqual(blastAssembly.item_inputs,[{amount:1,item:'minecraft:furnace'},{amount:5,tag:'c:plates/steel'},{amount:3,item:'tfc:fire_bricks'}]);assert.deepEqual(blastAssembly.item_outputs,[{amount:2,item:'minecraft:blast_furnace'}]);
 const selections={'tfmg:mixing/n_semiconductor':'mekanism_tfmg_compat-0.4-1.21.1.jar','tfmg:mixing/p_semiconductor':'tfmg-1.21.1-1.3.2a-community.jar'};
 for(const[id,provider]of Object.entries(selections)){const clean=structuredClone(active[id]);delete clean._generated_by;const expected=structuredClone(native.recipes[id].find(v=>v.provider===provider).data);if(id==='tfmg:mixing/n_semiconductor')expected.ingredients[0]={item:'tfc:powder/sulfur'};assert.deepEqual(clean,expected);}
 const chapter=readQuestSnbt(fs.readFileSync(path.join(root,'config/ftbquests/quests/chapters/createch2_09_age_08_advanced_electric.snbt'),'utf8'));
 const correctedTasks=[];for(const id of ['0764F8C5D0DAC768','5BEBDB186267F183','614EAE44EB28E3D1']){const q=chapter.quests.find(q=>q.id===id);assert(q);assert(!JSON.stringify(q.tasks).includes('modern_industrialization:aluminum_ingot'));const t=q.tasks.find(t=>t.item?.id==='tfmg:aluminum_ingot');assert(t);correctedTasks.push({quest:id,task:t.id,count:t.count??'1'});}
 return {truth:'STATIC_EARLY_SPACE_RECIPE_AND_QUEST_REPAIRS',activeRecipeIds:Object.keys(active),battery:{sameIds:true,leadPlates:5,ordinaryLeadUnits:500,tinCables:2,redstone:2,output:1,knowledge:'ELE-02',laterBatteryAlloysChanged:false},blastFoundation:{sameIds:true,fireBricks:3,steelPlates:5,furnaces:1,output:2},semiconductorPreviousInputs:source.nativeRecipeOverridePrevious,nativeSulfurInputRepair:{recipe:'tfmg:mixing/n_semiconductor',item:'tfc:powder/sulfur',commonDustTagsChanged:false,pureMaterialRecoveryAdded:false},semiconductorSelections:selections,correctedTasks,limits:['The existing pack semiconductor overrides required later antimony/iridium. The same IDs now use sulfur/aluminum chemistry, with the N dopant supplied directly by existing TFC sulfur powder. This does not grant finished transistor stock or qualify level2 heated polymer production.','Recipe/event/gate/quest alignment only. The chronological solver must separately obtain each input and processor from natural roots. No runtime or release proof.']};
}
