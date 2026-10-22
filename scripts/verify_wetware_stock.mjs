import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity');
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const bytecode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',
  'com.gregtechceu.gtceu.data.recipe.misc.MachineRecipeLoader',
  'com.gregtechceu.gtceu.data.recipe.serialized.chemistry.BrewingRecipes',
  'com.gregtechceu.gtceu.data.recipe.serialized.chemistry.DistillationRecipes',
  'com.gregtechceu.gtceu.data.recipe.serialized.chemistry.MixerRecipes',
  'com.gregtechceu.gtceu.integration.kjs.recipe.GTRecipeSchema$GTKubeRecipe'],{encoding:'utf8',maxBuffer:24*1024*1024});
assert(bytecode.includes('circuit(int)'));
const block=name=>{const start=bytecode.indexOf('// String '+name+'\n');assert(start>=0,name);return bytecode.slice(start,bytecode.indexOf('GTRecipeBuilder.save:',start));};
const integer='(?:iconst_(\\d)|(?:sipush|bipush)\\s+(\\d+))';
const scalar=(b,method)=>{const m=b.match(new RegExp(integer+'\\n[^\\n]+GTRecipeBuilder\\.'+method+':'));assert(m,'Native scalar '+method);return Number(m[1]??m[2]);};
const volts=[8,30,120,480,1920,7680,30720];
const eu=b=>{const direct=b.match(/long (\d+)l\n[^\n]+GTRecipeBuilder.EUt:/);if(direct)return Number(direct[1]);const tier=b.match(new RegExp('GTValues.VA[^\\n]+\\n\\s+\\d+: '+integer));assert(tier);return volts[Number(tier[1]??tier[2])];};
const fluidAmount=(b,material,method)=>{const m=b.match(new RegExp('GTMaterials\\.'+material+':[^\\n]+\\n\\s+\\d+: '+integer+'\\n[^\\n]+Material.getFluid[^\\n]+\\n[^\\n]+GTRecipeBuilder\\.'+method));assert(m,material+'/'+method);return Number(m[1]??m[2]);};
const recipes=[
  ['plant_ball','plant_ball_from_sapling',{type:'modern_industrialization:compressor',item_inputs:[{tag:'minecraft:saplings',amount:1}],item_outputs:[{item:'gtceu:plant_ball',amount:1}]}],
  ['biomass','biomass_from_sapling',{type:'modern_industrialization:mixer',item_inputs:[{tag:'minecraft:saplings',amount:1}],fluid_inputs:[{fluid:'minecraft:water',amount:100}],fluid_outputs:[{fluid:'gtceu:biomass',amount:100}]}],
  ['distilled_water','distill_water_large',{type:'modern_industrialization:distillation_tower',fluid_inputs:[{fluid:'minecraft:water',amount:576}],fluid_outputs:[{fluid:'gtceu:distilled_water',amount:520}]}],
  ['meat','macerate_steak',{type:'modern_industrialization:macerator',item_inputs:[{item:'tfc:food/beef',amount:1}],item_outputs:[{item:'gtceu:meat_dust',amount:1},{item:'gtceu:meat_dust',amount:1,probability:0.5},{item:'gtceu:tiny_bone_dust',amount:1}]}],
  ['calcite','macerate_calcite',{type:'modern_industrialization:macerator',item_inputs:[{item:'tfc:rock/raw/chalk',amount:1}],item_outputs:[{item:'gtceu:calcite_dust',amount:1},{item:'gtceu:stone_dust',amount:1,probability:0.0025}]}]
];
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const native=read(path.join(state,'native-resources.json'));
const tfc=path.join(liveRoot,'mods/TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar');
const resource=name=>JSON.parse(execFileSync('/usr/bin/unzip',['-p',tfc,name],{encoding:'utf8'}));
const saplings=resource('data/minecraft/tags/item/saplings.json');
assert(saplings.values.includes('tfc:wood/sapling/oak'));
const cow=resource('data/tfc/loot_table/entities/cow.json');
assert(JSON.stringify(cow).includes('tfc:food/beef')&&JSON.stringify(cow).includes('minecraft:bone'));
assert.equal(resource('data/tfc/tfc/worldgen/rock_settings/chalk.json').raw,'tfc:rock/raw/chalk');
const authored=recipes.map(([name,nativeName,expected])=>{
  const id='createch2:greate/suppliers/biology_'+name,b=block(nativeName);
  assert(!b.includes('CleanroomType.'),'Unported native room condition '+nativeName);
  const actual=read(path.join(liveRoot,'kubejs/data/createch2/recipe/greate/suppliers/biology_'+name+'.json'));delete actual._generated_by;
  assert.deepEqual(actual,{...expected,eu:eu(b),duration:scalar(b,'duration')},id);
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);
  return{id,nativeName,data:actual};
});
for(const name of ['plant_ball_from_sapling','biomass_from_sapling'])assert(block(name).includes('ItemTags.SAPLINGS'));
assert(block('plant_ball_from_sapling').includes('GTItems.PLANT_BALL'));
assert(block('macerate_steak').includes('Items.BEEF'));
assert(block('macerate_steak').includes('TagPrefix.dustTiny')&&block('macerate_steak').includes('GTMaterials.Bone'));
assert.match(block('macerate_steak'),/sipush\s+5000\n[^\n]+iconst_0\n[^\n]+GTRecipeBuilder.chancedOutput/);
assert(block('macerate_calcite').includes('Blocks.CALCITE'));
assert.match(block('macerate_calcite'),/bipush\s+25\n[^\n]+iconst_0\n[^\n]+GTRecipeBuilder.chancedOutput/);
assert.equal(fluidAmount(block('biomass_from_sapling'),'Water','inputFluids'),100);
assert.equal(fluidAmount(block('biomass_from_sapling'),'Biomass','outputFluids'),100);
assert.equal(fluidAmount(block('distill_water_large'),'Water','inputFluids'),576);
assert.equal(fluidAmount(block('distill_water_large'),'DistilledWater','outputFluids'),520);
const maximumOutputs=Math.max(...Object.values(native.recipes).flat().filter(r=>r.data.type==='modern_industrialization:macerator').map(r=>[r.data.item_outputs??[]].flat().length));
assert(authored.filter(r=>r.data.type==='modern_industrialization:macerator').every(r=>r.data.item_outputs.length<=maximumOutputs));
const osm=block('osmiridium');assert.equal(eu(osm),30720);assert.equal(scalar(osm,'duration'),300);
assert(osm.includes('GTMaterials.Osmium')&&osm.includes('TagPrefix.dust'));
assert.match(osm,/GTMaterials.Iridium:[^\n]+\n[^\n]+iconst_3\n[^\n]+GTRecipeBuilder.inputItems/);
assert.match(osm,/GTMaterials.Osmiridium:[^\n]+\n[^\n]+iconst_4\n[^\n]+GTRecipeBuilder.outputItems/);
assert.match(osm,/iconst_1\n[^\n]+GTRecipeBuilder.circuitMeta/);
const nativeId='createch2:mixer/greate_precision/osmiridium_stock';
const modes=[];
for(const optional of [false,true]){
  const policy=captureRecipePolicy(liveRoot,optional);
  for(const r of authored)assert(!policy.removals.some(f=>matchesRecipeFilter(f.filter,r.id,r.data)===true),'Removed biology supply '+r.id);
  const mixer=policy.additions.find(r=>r.id===nativeId);assert(mixer);
  const expected={itemInputs:['#c:dusts/osmium','3x #c:dusts/iridium'],itemOutputs:['4x gtceu:osmiridium_dust'],circuit:[1],duration:[300],EUt:[30720]};
  for(const [method,args]of Object.entries(expected))assert.deepEqual(JSON.parse(JSON.stringify(mixer.nativeCalls.find(c=>c.method===method)?.args)),args,nativeId+'/'+method);
  assert.equal(mixer.nativeType,'gtceu:mixer');
  assert(policy.removals.some(r=>r.filter.id==='gtceu:mixer/osmiridium'));
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(nativeId)).map(n=>n.code),['FRN-06']);
  const facilities=read(path.join(state,'wetware-facility-validation.json')).modes.find(m=>m.optionalProvider===optional);
  assert(facilities.firstBuildRoots.includes('gtceu:luv_mixer'));
  const witnesses={};
  for(const tag of ['c:dusts/osmium','c:dusts/iridium']){
    const items=new Set((native.itemTags[tag]??[]).flatMap(r=>r.data.values).filter(v=>typeof v==='string'&&!v.startsWith('tfc_metallurgy:')));
    const records=[];
    for(const [id,rs]of Object.entries(native.recipes))for(const r of rs)if(recipeOutputRefs(r.data).map(refLabel).some(out=>items.has(out))&&!policy.removals.some(f=>matchesRecipeFilter(f.filter,id,r.data)===true))records.push({id,source:'native_static'});
    for(const r of policy.additions)if(r.custom&&recipeOutputRefs(r.custom).map(refLabel).some(out=>items.has(out)))records.push({id:r.id,source:'runtime_addition'});
    assert(records.length,'No recorded earlier ordinary dust supplier '+tag);witnesses[tag]=records;
  }
  modes.push({optionalProvider:optional,earlierPgmWitnesses:witnesses});
}
const presentation=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json')).internalPresentation;
for(const id of ['gtceu:plant_ball','gtceu:meat_dust','gtceu:calcite_dust'])assert(presentation.items.includes(id));
for(const id of ['gtceu:biomass','gtceu:distilled_water'])assert(presentation.fluids.includes(id));
assert(presentation.canonicalItems.includes('gtceu:osmiridium_dust'));
const report={truth:'STATIC_BIOLOGICAL_RAW_STOCK',rawStockRoutes:6,modes,
  sourceRoots:['TFC saplings','TFC cow loot supplies beef and bones','TFC native chalk rock settings','existing water and PGM works','independently supplied LuV mixer'],
  adaptations:['Minecraft raw beef -> TFC beef; native output/byproduct quantities retained.','Minecraft calcite -> TFC chalk as calcium-carbonate geological feed; native material density equivalence is not claimed.','Shared MI factory codecs retain declared native duration, voltage and output probability; native overclock semantics are not claimed.'],
  water:{nativeInput:576,nativeOutput:520},osmiridium:{iridiumUnits:300,osmiumUnits:100,outputUnits:400,circuit:1,eu:30720},
  limits:['Biome generation, animal harvesting, food NBT/perishability, actual probability/overclock behavior and loaded GT retirement require runtime qualification.','Recorded PGM suppliers and preceding facility proof are a bounded earlier-factory frontier, not a complete Stone-to-Infinity reachability proof.','Boards, wetware circuits and 96 CWU/t installation remain unfinished; reagents and cultures are verified separately.']};
fs.writeFileSync(path.join(state,'wetware-stock-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,rawStockRoutes:6,providerModes:2,water:report.water}));
