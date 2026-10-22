import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const all=ids=>({all:ids.map(id=>({id}))});

// Existing material suppliers and one repaired bootstrap. This does not seed a
// noncanonical metal item or assume that all native overlays have the same bill.
export function nativeQuantumMaterials({root,developmentRoot,native,policy,removals,tags,ledger,recipes,sharedPower}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_quantum_materials.json'))),code={},hashes={};
 for(const[j,h]of Object.entries(f.nativeJars))assert.equal(sha(fs.readFileSync(path.join(root,'mods',j))),h);
 for(const[k,v]of Object.entries(f.classes)){
  code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[...(v.verbose?['-v']:[]),'-c','-p','-classpath',path.join(root,'mods',v.jar),v.class],{encoding:'utf8',maxBuffer:16*1024*1024});
  hashes[k]=sha(code[k]);assert.equal(hashes[k],v.sha256,k);
 }
 function review(c){
  for(const[k,terms]of Object.entries({mi:['String item_inputs','UnificationHelper.unifyInputs:'],plugin:['AlmostUnifiedNeoPlugin','String modern_industrialization','MIRecipeUnifier','RecipeUnifierRegistry.registerForModId:'],registry:['RecipeData.getType:','ResourceLocation.getNamespace:','Field recipeUnifiersByModId:'],helper:['unifyInputArray(','Method unifyInputItem:','UnificationLookup.getRelevantItemTag:','JsonObject.remove:','String tag'],common:['onRecipeManagerReload(','AlmostUnifiedRuntimeImpl.run:'],runtime:['PluginManager.registerRecipeUnifiers:','public void run('],kjsEvent:['public void post(','Method postEvent:','Method applyChanges:'],kjsManager:['priority=1100','value="HEAD"','RecipesKubeEvent.post:'],auManager:['priority=1099','value="HEAD"','AlmostUnifiedCommon.onRecipeManagerReload:']}))for(const term of terms)assert(c[k].includes(term),k+'/'+term);
 }
 review(code);
 assert.equal(sharedPower.truth,'STATIC_NATIVE_FINITE_CUBE_TO_GT_IV_POWER');assert.equal(sharedPower.source.fePerEu,10);
 const boot=f.bootstrap,currentBoot=policy.additions.find(r=>r.id===boot.after.id);assert.deepEqual(structuredClone(currentBoot),boot.after);
 assert.equal(boot.before.id,boot.after.id);const before=boot.before.custom,after=boot.after.custom;
 assert.equal(before.type,'oritech:assembler');assert.equal(after.type,'modern_industrialization:assembler');
 assert.deepEqual(after.item_inputs,before.ingredients.map(v=>({...v,amount:1})));assert.deepEqual(after.item_outputs,[{item:before.results[0].id,amount:before.results[0].count}]);
 assert.equal(before.time,240);assert.equal(after.eu,12);assert.equal(after.duration,256);assert.equal(after.eu*after.duration*sharedPower.source.fePerEu,boot.nominalFePerTick*before.time);
 const section=fs.readFileSync(path.join(root,'config/oritech-common.toml'),'utf8').split('[machineSettings.processingMachines.assemblerData]')[1].split(/\n\s*\[/)[0];assert.match(section,/energyPerTick = 128\b/);assert.equal(boot.nominalFePerTick,128);
 for(const[k,terms]of Object.entries({oritechAssembler:['ProcessingMachines.assemblerData:','BasicMachineConfig.energyPerTick:'],oritechBase:['protected void useEnergy();','Method calculateEnergyUsage:','Field energyPerTick:','OritechRecipe.getTime:','Field progress:']}))for(const t of terms)assert(code[k].includes(t),k+'/'+t);
 const core=policy.additions.find(r=>r.id===boot.core.id),assembler=policy.additions.find(r=>r.id===boot.assembler.id);assert.deepEqual(structuredClone(core),boot.core);assert.deepEqual(JSON.parse(JSON.stringify(assembler)),boot.assembler);
 assert(core.custom.sequence.some(s=>s.ingredients?.some(v=>v.item==='oritech:processing_unit')));assert(Object.values(assembler.args[2]).includes('oritech:machine_core_1'));
 assert(!after.item_inputs.some(v=>/oritech:(machine_core_|assembler_block)/.test(v.item)));assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(boot.after.id)).map(n=>n.id),boot.researchOwners);
 const cfgPath='config/almostunified/unification/materials.json',cfg=JSON.parse(fs.readFileSync(path.join(root,cfgPath))),ph=JSON.parse(fs.readFileSync(path.join(root,'config/almostunified/placeholders.json')));
 assert.equal(sha(fs.readFileSync(path.join(root,cfgPath))),f.unificationConfigSha256);
 const managed=[...new Set(cfg.tags.flatMap(t=>t.includes('{material}')?ph.material.map(m=>t.replaceAll('{material}',m)):[t]))];
 const ignored=(rows,id)=>rows.some(p=>new RegExp('^(?:'+p+')$').test(id));
 function steelTag(config){
  for(const[rows,id]of [[config.ignored_items,f.steelItem],[config.ignored_tags,f.steelTag],[config.ignored_recipe_ids,f.ferricore.id],[config.ignored_recipe_types,f.ferricore.custom.type]])assert(!ignored(rows,id));
  assert.deepEqual(managed.filter(t=>tags.hasTag(t,f.steelItem)),[f.steelTag]);assert(tags.hasTag(f.steelTag,'tfmg:steel_ingot'));return '#'+f.steelTag;
 }
 const selectedSteel=steelTag(cfg),ferricore=policy.additions.find(r=>r.id===f.ferricore.id);assert.deepEqual(structuredClone(ferricore),f.ferricore);
 assert(!managed.some(t=>tags.hasTag(t,'justdirethings:ferricore_ingot')),'Ferricore output now needs separate unification review');
 const original=recipes.find(r=>r.id===f.ferricore.id);assert(original&&original.kind==='captured');
 const project=e=>e.id?{id:e.id===f.steelItem?selectedSteel:e.id}:e.all?{all:e.all.map(project)}:{any:e.any.map(project)};
 const rules=[{id:'native:chronological_mi_ferricore_steel_unification',outputs:['justdirethings:ferricore_ingot'],requirements:project(original.requirements)}];
 const id=f.ultimate.id,rows=native.recipes[id];assert.deepEqual(rows,f.ultimate.providers);
 const effective=rows.map(r=>{
  const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',r.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(raw,r.data);
  const replay=replayRecipeEventEntry(id,raw,'native',policy.modifications,removals);assert(!replay.removed);return replay.data;
 });
 assert.deepEqual(effective,f.ultimate.effective);
 assert.deepEqual(effective[1].key.B,{tag:'c:ingots/bronze'});assert.equal(effective[1].pattern.join('').split('B').length-1,4);
 assert(!tags.hasTag('c:ingots/bronze','mekanism:ingot_bronze'));
 for(const id of f.retiredBronzeProducers){const rows=native.recipes[id];assert(rows?.length);for(const r of rows)assert(replayRecipeEventEntry(id,r.data,'native',policy.modifications,removals).removed,id);}
 const gates=ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>'research:'+n.id);
 // The larger compatibility bill supplies either resource overlay. No mod
 // ordering is selected and no cheaper base recipe is silently substituted.
 assert.deepEqual(effective.map(r=>r.result.id),['mekanism:ultimate_control_circuit','mekanism:ultimate_control_circuit']);
 assert(effective.every(r=>r.type==='minecraft:crafting_shaped'&&(r.result.count??1)===1));
 assert(!recipes.some(r=>r.id===id),'A native overlay was already admitted');
 rules.push({id:'native:chronological_mek_ultimate_conservative_overlay',outputs:['mekanism:ultimate_control_circuit'],requirements:all(['capability:crafting','#mekanism:alloys/atomic','#c:circuits/elite','mekanism:hdpe_sheet','#c:ingots/bronze',...gates])});
 const negatives=[];
 for(const[key,term]of [['mi','String item_inputs'],['plugin','RecipeUnifierRegistry.registerForModId:'],['helper','UnificationLookup.getRelevantItemTag:'],['kjsManager','priority=1100'],['auManager','priority=1099']]){const c={...code,[key]:code[key].replaceAll(term,'MISSING')};assert.throws(()=>review(c));negatives.push({name:'missing_'+key,rejected:true});}
 for(const[key,value]of [['ignored_items',f.steelItem],['ignored_tags',f.steelTag],['ignored_recipe_ids',f.ferricore.id]]){const c=structuredClone(cfg);c[key].push(value);assert.throws(()=>steelTag(c));negatives.push({name:key+'_exclusion',rejected:true});}
 return {truth:'STATIC_NATIVE_CANONICAL_QUANTUM_MATERIAL_SUPPLIERS',nativeCodeSha256:hashes,rules,negativeCases:negatives,
  ferricore:{id:f.ferricore.id,original:f.ferricore.custom,onlyInputProjection:{item:f.steelItem,tag:f.steelTag},nativeOrder:'KubeJS HEAD1100 posts and applies additions before AlmostUnified HEAD1099;MI type namespace selects native MIRecipeUnifier,item_inputs traverses into item->relevant tag.',newRecipe:false},
  ultimate:{id,providers:rows.map(r=>r.provider),effective,requiredFreshBill:{'#mekanism:alloys/atomic':2,'#c:circuits/elite':1,'mekanism:hdpe_sheet':4,'#c:ingots/bronze':4},gates,repair:'Only the compatibility variant bronze input becomes the canonical tag;all five native Mekbronze producer IDs remain retired.',providerOrderAssumed:false},
  bootstrap:{id:boot.after.id,before,after,researchOwners:boot.researchOwners,nominalOldBatchFe:30720,newBatchEu:3072,fePerEu:10,coreCommissioningPreserved:core.id,assemblerManufacturePreserved:assembler.id,cycle:'Old processing unit required Oritech assembler,whose manufacture consumes Core1,whose commissioning consumes processing unit.',repair:'Only the existing first processing-unit host changes to supplied MI;four inputs and one output retained.12EU*256ticks preserves the configured nominal128FE*240tick batch. Original research ownership is unchanged.'},
  capstoneBoundary:f.capstoneBoundary,
  limits:['Only the exact existing Ferricore declaration,two current Ultimate Circuit resource overlays,and first Oritech Processing Unit bootstrap. MI unification changes the steel ingredient to its managed tag,not an inventory conversion or a new recipe. All other inputs,power and original research remain recursive obligations.','The larger fresh compatibility bill covers both native provider possibilities without selecting load order. Existing pack bronze/HDPE/circuit manufacture is required;no native bronze route or cheaper bill is enabled.','Processing-unit energy parity uses the unmodified nominal Oritech128FE/t and declared240ticks,without core/addon speed or efficiency discounts. The new MI job consumes3072EU in256ticks on the separately supplied LV service;the existing Core1 commissioning line and later Oritech hardware remain required.','Installed bytecode,configured transforms and declarations establish static feasibility. Actual mixin order,plugin loading,unification,recipe registration,crafting,research and inventories remain runtime qualification.']};
}
