import {nativeMercuryExpedition} from './lib/native_mercury_expedition.mjs';
// Physical first-grid bootstrap; knowledge-only reachability misses machine cycles.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';
import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
import {replayRecipeNormalizations} from './lib/replay_recipe_normalizations.mjs';
import {firstPowerContract} from './lib/first_power_contract.mjs';
import {firstPetroleumContract} from './lib/first_petroleum_contract.mjs';
import {nativeHotBlastFuelContract} from './lib/native_hot_blast_fuel_contract.mjs';
import {firstRocketFuelContract} from './lib/first_rocket_fuel_contract.mjs';
import {baseKineticAliases,kineticItem} from './sources/recipe_families/greate_progression.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const tags=staticBulkReplicationPolicy(liveRoot,native,{includeAuthored:true});
const powerContract=firstPowerContract(liveRoot),petroleumContract=firstPetroleumContract(liveRoot);
const petroleumWorld=read(path.join(developmentRoot,'createch-dev/runtime-state/mission02/world-validation.json'));assert.equal(petroleumWorld.petroleum?.length,2);assert(petroleumWorld.petroleum.every(p=>p.tfcBiomes.length&&p.attachmentsPerBiome===1));
const crudeDistillation=native.recipes['tfmg:distillation/crude_oil'][0].data;assert.equal(crudeDistillation.ingredients[0].amount,crudeDistillation.results.reduce((sum,r)=>sum+r.amount,0));
// Installed travel uses fuel-distance, not an inferred rocket-tier ladder.
const stellarJar=path.join(liveRoot,'mods/stellaris-1.21-neoforge-1.4.25.jar');
const stellarCode=name=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',stellarJar,'com.st0x0ef.stellaris.common.'+name],{encoding:'utf8'});
const tankCode=stellarCode('vehicle_upgrade.TankUpgrade'),fuelCode=stellarCode('vehicle_upgrade.FuelType'),rocketCode=stellarCode('entities.vehicles.RocketEntity');
assert(/getBasic\(\);[\s\S]*?sipush\s+3000/.test(tankCode));
assert(fuelCode.includes('float 19.22f')&&rocketCode.includes('FuelType.getMegametersTraveled:')&&rocketCode.includes('Planet.distanceFromEarth:'));
const moon=read(path.join(liveRoot,'kubejs/data/stellaris/planets/moon.json'));
const mars=JSON.parse(execFileSync('/usr/bin/unzip',['-p',stellarJar,'data/stellaris/planets/mars.json'],{encoding:'utf8'}));
const venus=JSON.parse(execFileSync('/usr/bin/unzip',['-p',stellarJar,'data/stellaris/planets/venus.json'],{encoding:'utf8'}));
const earth=JSON.parse(execFileSync('/usr/bin/unzip',['-p',stellarJar,'data/stellaris/planets/overworld.json'],{encoding:'utf8'}));
assert.equal(earth.level,'minecraft:overworld');assert.equal(earth.distanceFromEarth,0);
assert.equal(moon.level,'rocketnautics:moon');assert.equal(mars.level,'stellaris:mars');
assert.equal(venus.level,'stellaris:venus');assert.equal(venus.distanceFromEarth,41000);
const firstSpaceTravel={truth:'STATIC_NATIVE_FUEL_DISTANCE_ONLY',basicTank:3000,fuelMegametersPerMb:19.22,range:3000*19.22,destinations:[moon,mars,venus].map(d=>({dimension:d.level,nativeDistance:Math.trunc(d.distanceFromEarth),minimumFuelCeiling:Math.ceil(Math.trunc(d.distanceFromEarth)/19.22),outboundFitsBasicTank:Math.trunc(d.distanceFromEarth)<=3000*19.22})),witnessSha256:Object.fromEntries(Object.entries({tankCode,fuelCode,rocketCode}).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),limits:['Native range calculation only. Actual fuel loading/consumption, menu selection, launch, landing and safe return remain runtime qualification.','A basic full tank admits the outbound Mars distance; carry a separate refuelling supply for return. This does not prove life support or returned ore acquisition.']};
assert(firstSpaceTravel.destinations.every(d=>d.outboundFitsBasicTank));
// Native landing preserves the used rocket and its remaining-fuel component.
// Return supply is separate from a successful outbound range check.
const travelCode={utils:stellarCode('utils.Utils'),lander:stellarCode('entities.vehicles.LanderEntity'),rocketItem:stellarCode('items.RocketItem'),transferPacket:stellarCode('network.packets.TeleportEntityToPlanetPacket'),fluidRegistry:stellarCode('registry.FluidRegistry'),fuelItems:stellarCode('vehicle_upgrade.FuelType$Type')};
for(const [name,symbols]of Object.entries({
 utils:['FuelType.getFuelNeededToGoOnPlanet:','Math.round:','RocketEntity.FUEL:I','RocketEntity.syncRocketData:','createLanderFromRocket:','DataComponentsRegistry.ROCKET_COMPONENT','bipush        14'],
 lander:['bipush        15','Player.isCrouching:','openCustomInventoryScreen:'],
 rocketItem:['blocks/RocketLaunchPad','getRocket:','DataComponentsRegistry.ROCKET_COMPONENT'],
 transferPacket:['Utils.changeDimension:','PlanetSelectionServerEvents.LAUNCH_BUTTON'],
 fluidRegistry:['ItemsRegistry.FUEL_BUCKET','bucketItemSupplier:'],
 fuelItems:['TagRegistry.FUEL','Field FUEL:']
}))for(const symbol of symbols)assert(travelCode[name].includes(symbol),'Native return contract changed: '+name+'/'+symbol);
const spoutCode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(liveRoot,'mods/create-1.21.1-6.0.10.jar'),'com.simibubi.create.content.fluids.transfer.GenericItemFilling'],{encoding:'utf8'});
for(const symbol of ['Fluid.getBucket:','FluidBucketWrapper','sipush        1000','IFluidHandlerItem.fill:','IFluidHandlerItem.getContainer:'])assert(spoutCode.includes(symbol),'Native bucket filling contract changed: '+symbol);
assert(tags.members('c:fuels').includes('stellaris:fuel_bucket'));
firstSpaceTravel.fuelAdmission=firstRocketFuelContract(liveRoot,tags);
assert(/tryFillUpRocket[\s\S]*?sipush\s+1000/.test(rocketCode));
const rangePerMb=Math.fround(19.22);
function tripPlan(distance,buckets){
 let fuel=3000;const canGo=()=>distance<=Math.fround(Math.fround(fuel)*rangePerMb);
 const outward=canGo(),consumed=Math.round(Math.fround(Math.fround(distance)/rangePerMb));
 fuel-=consumed;const afterOutward=fuel;
 for(let i=0;i<buckets;i++)fuel=Math.min(3000,fuel+1000);
 return {outward,consumed,afterOutward,reserveBuckets:buckets,afterRefuelling:fuel,canReturn:outward&&canGo()};
}
const moonTrip=tripPlan(Math.trunc(moon.distanceFromEarth),0),marsTrip=tripPlan(Math.trunc(mars.distanceFromEarth),3),marsWithoutReserve=tripPlan(Math.trunc(mars.distanceFromEarth),0);
assert(moonTrip.canReturn&&marsTrip.canReturn&&!marsWithoutReserve.canReturn&&!tripPlan(Math.trunc(mars.distanceFromEarth),2).canReturn);
const venusTrip=tripPlan(Math.trunc(venus.distanceFromEarth),2),venusWithoutReserve=tripPlan(Math.trunc(venus.distanceFromEarth),0),venusOneReserve=tripPlan(Math.trunc(venus.distanceFromEarth),1);
assert(venusTrip.canReturn&&!venusWithoutReserve.canReturn&&!venusOneReserve.canReturn);
firstSpaceTravel.returnSuppliers={truth:'STATIC_NATIVE_ROCKET_RECOVERY_AND_RETURN_FUEL',moon:moonTrip,mars:marsTrip,venus:venusTrip,marsWithoutReserve,venusWithoutReserve,venusOneReserve,rocketRecovery:'Crouch-open the landed vehicle inventory. Slot14 holds the rocket with its remaining-fuel component; native cargo slots2 through13 are transferred.',fuelContainer:'Create spout fills a vanilla bucket with1000mB Stellaris fuel through its native fluid capability; the private rocket tag admits this fuel bucket while shared solid biomass remains industrial fuel.',hashes:Object.fromEntries(Object.entries({...travelCode,spout:spoutCode}).map(([name,code])=>[name,crypto.createHash('sha256').update(code).digest('hex')])),limits:['Native bytecode, declared tags and arithmetic only; actual menu selection, field landing/recovery, refuelling, carried inventory and survival remain runtime qualification.','A return launch still needs launch-pad equipment, suit/oxygen supplies and a mining tool. This does not grant access to arbitrary planetary loot.']};

const environmentProfile=read(path.join(liveRoot,'kubejs/data/createch2/environment_profiles/planetary.json'));
const basicPressureSuit=Object.fromEntries(['head','chest','legs','feet'].map((slot,i)=>[slot,'stellaris:space_suit_'+['helmet','chestplate','leggings','boots'][i]]));
assert(environmentProfile.pressure_suits.some(s=>JSON.stringify(s)===JSON.stringify(basicPressureSuit)));
assert.equal(environmentProfile.dimensions['stellaris:venus'].pressure_class,'dense');assert(environmentProfile.dimensions['stellaris:venus'].pressure_gameplay);
const coreEnvironment=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(liveRoot,'mods/createch2core.jar'),'createch2.core.environment.PlanetaryEnvironmentCompatibility'],{encoding:'utf8'});
for(const symbol of ['EnvironmentData.hasCompletePressureSuit:','GlobalOxygenManager.getInstance:','DimensionOxygenManager.hasOxygenAt:','PressureBand.DENSE'])assert(coreEnvironment.includes(symbol),'Native pressure protection changed: '+symbol);
firstSpaceTravel.venusEnvironment={truth:'STATIC_DECLARED_VENUS_PRESSURE_EQUIPMENT',nativePlanet:{oxygen:venus.oxygen,temperature:venus.temperature},profile:environmentProfile.dimensions['stellaris:venus'],pressureSuit:basicPressureSuit,declaredSuitShielding:Object.values(basicPressureSuit).reduce((sum,id)=>sum+environmentProfile.radiation_shielding[id],0),coreEnvironmentSha256:crypto.createHash('sha256').update(coreEnvironment).digest('hex'),limits:['The current Core handler accepts a declared complete pressure suit in dense atmospheres; the existing native oxygen-service contract remains required. This pins equipment class, not an oxygen-filled component or survival duration.','462C is native Venus metadata. Actual heat/lava/terrain hazards, dose, oxygen depletion, loaded pressure protection and safe field return remain runtime qualification. No environmental policy or suit value is changed.']};

firstSpaceTravel.mercuryExpedition=nativeMercuryExpedition({root:liveRoot,travel:firstSpaceTravel,travelCode,rocketCode,fuelCode,tankCode,environmentProfile});

const aliasPriority=read(path.join(liveRoot,'config/almostunified/unification/materials.json')).priority_overrides;
const kineticAliases=new Map(baseKineticAliases.map(a=>{assert.equal(aliasPriority[a.tag],'greate');return [a.values[0],a.values[1]];}));
const ceramic='tfc:ceramic/vessel';assert(native.itemModels[ceramic]);
const primitiveIds=['tfc:knapping/ceramic/unfired_vessel','tfc:heating/ceramic/vessel','tfc:knapping/ceramic/unfired_brick','tfc:heating/brick','tfc:crafting/powder/flux','tfc:barrel/limewater','tfc:barrel/mortar','tfc:crafting/bricks','tfc:crafting/wood/barrel/oak','tfc:welding/metal/double_ingot/copper','tfc:crafting/metal/anvil/copper','tfc:anvil/metal/sheet/copper','tfc:anvil/metal/rod/copper','tfc_items:crafting/plant_string_from_straw'];
const primitive=primitiveIds.map(id=>({id,d:native.recipes[id]?.find(v=>v.provider.startsWith(id.startsWith('tfc_items:')?'TFC-items-':'TerraFirmaCraft-'))?.data}));
for(const {id,d}of primitive)assert(d,'Missing native Copper laboratory supplier '+id);
const pitTemperature=Number(/pitKilnTemperature\s*=\s*([\d.]+)/.exec(fs.readFileSync(path.join(liveRoot,'config/tfc-server.toml'),'utf8'))?.[1]);
for(const {d}of primitive)if(d.type==='tfc:heating')assert(d.temperature<pitTemperature,'Copper ceramic supplier exceeds configured pit kiln');
const rawLabFrontier=['minecraft:clay_ball','tfc:wood/lumber/oak','tfc:rock/loose/limestone','tfc:metal/ingot/copper','tfc:stone/hammer/igneous_intrusive','tfc:sand/white','tfc:straw','fluid:minecraft:water'];
assert(tags.hasTag('c:straw','tfc:straw'));
function labProof(policy,lab){
 const have=new Set(rawLabFrontier),witness=[];
 const ing=v=>Array.isArray(v)?v.some(ing):typeof v==='string'?have.has(v):v.type==='neoforge:compound'?v.children.some(ing):v.tag?[...have].some(id=>tags.hasTag(v.tag,id)):have.has(v.item??v.id??('fluid:'+v.fluid));
 const rows=[...primitive,{id:lab.id,d:{type:'minecraft:crafting_shaped',key:lab.args[2],pattern:lab.args[1],result:{id:lab.args[0]}}}];
 for(const {id,d}of primitive)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Removed Copper lab supplier '+id);
 for(let i=0;i<30;i++){let changed=false;for(const {id,d}of rows){const output=(d.result?.id??d.result_item?.id??d.output_item?.id)??(d.output_fluid&&'fluid:'+d.output_fluid.id);if(have.has(output))continue;let ok=false;
  if(d.type==='tfc:knapping'){assert.equal(d.knapping_type,'tfc:clay');ok=ing('minecraft:clay_ball');}
  else if(d.type==='minecraft:crafting_shaped')ok=Object.values(d.key).every(ing);
  else if(d.type==='minecraft:crafting_shapeless')ok=d.ingredients.every(ing);
  else if(d.type==='tfc:advanced_shapeless_crafting')ok=d.ingredients.every(ing);
  else if(d.type==='tfc:heating')ok=ing(d.ingredient);
  else if(d.type==='tfc:welding')ok=ing(d.first_input)&&ing(d.second_input)&&ing('tfc:powder/flux');
  else if(d.type==='tfc:anvil')ok=ing(d.ingredient)&&ing('tfc:metal/anvil/copper');
  else if(d.type.startsWith('tfc:barrel_'))ok=ing(d.input_item)&&ing(d.input_fluid)&&ing('tfc:wood/barrel/oak');
  if(ok){have.add(output);witness.push(id);changed=true;}
 }if(!changed)break;}
 return {reached:have.has('researchd:research_lab'),witness,supplies:[...have].filter(id=>!rawLabFrontier.includes(id))};
}
const nodes=new Map(ledger.nodes.map(n=>[n.id,n]));
const grid=ledger.pack_routes.find(r=>r.id==='createch2:research/pack/grid_telemetry');
assert.equal(grid.recipe.type,'minecraft:crafting_shaped');
assert.equal(grid.unlock_node,'createch2:ele_01_practical_electrics');
assert.deepEqual(grid.reusable_test_articles,['electroenergetics:clamp_meter']);
assert.equal(grid.output_count,4);
assert.equal(grid.recipe.pattern.join('').split('P').length-1,2);
assert.deepEqual(grid.recipe.key,{P:'minecraft:paper',M:'electroenergetics:clamp_meter',I:'electroenergetics:inductor'});
const script=fs.readFileSync(path.join(liveRoot,'kubejs/server_scripts/research/researchd_tech_tree.js'),'utf8');
assert(script.includes('shaped.keepIngredient(item)'),'Bench recipe consumes its reusable measuring instrument');
const jar=path.join(liveRoot,'mods/kubejs-neoforge-2101.7.2-build.377.jar');
const api=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-p','-classpath',jar,'dev.latvian.mods.kubejs.recipe.KubeRecipe'],{encoding:'utf8'});
assert(api.includes('keepIngredient(dev.latvian.mods.kubejs.util.SlotFilter)'),'Installed crafting API does not preserve the instrument');
const selected=[
 ['modern_industrialization:analog_circuit','createch2:modern_industrialization/analog_circuit_tfmg_entry'],
 ['modern_industrialization:basic_machine_hull','createch2:modern_industrialization/basic_machine_hull_tfmg_entry'],
 ['modern_industrialization:pump','createch2:low_voltage/mi/basic_pump_prototype'],
 ['modern_industrialization:assembler','createch2:low_voltage/mi/assembler_prototype'],
 ['electroenergetics:clamp_meter','electroenergetics:crafting/clamp_meter'],
 ['electroenergetics:inductor','electroenergetics:crafting/inductor'],
 ['mekanism:geiger_counter','createch2:space_environment_phase2/radiation/geiger_counter_first_space'],
 ['mekanism:dosimeter','createch2:space_environment_phase2/radiation/dosimeter_first_space'],
 ['electroenergetics:white_electric_motor','createch2:electrical/conversion/electric_motor'],
 ['electroenergetics:converter','createch2:electrical/conversion/fe_boundary'],
 ['electroenergetics:capacitor','electroenergetics:crafting/capacitor'],
 ['electroenergetics:high_voltage_capacitor','electroenergetics:crafting/high_voltage_capacitor'],
 ['electroenergetics:heavily_insulated_wire','electroenergetics:crafting/heavily_insulated_wire'],
 ['electroenergetics:heavily_insulated_wire_spool','electroenergetics:crafting/heavily_insulated_wire_spool'],
 ['electroenergetics:transformer_core_lamination','electroenergetics:stonecutting/transformer_core_lamination'],
 ['electroenergetics:transformer_core','electroenergetics:sequenced_assembly/transformer_core'],
 ['tfc:food/dried_kelp','tfc:heating/food/dried_kelp'],
 ['minecraft:stonecutter','minecraft:stonecutter'],
 ['electroenergetics:commutator','createch2:electrical/alternator/commutator'],
 ['electroenergetics:alternator_rotor','createch2:electrical/alternator/rotor'],
 ['electroenergetics:stator','createch2:electrical/alternator/stator'],
 ['electroenergetics:alternator_brushes','createch2:electrical/alternator/brushes'],
 ['electroenergetics:magnet','electroenergetics:crafting/magnet_block'],
 ['modern_industrialization:steel_rod_magnetic','modern_industrialization:electric_age/component/craft/steel_rod_magnetic'],
 ['modern_industrialization:tin_wire','createch2:low_voltage/create/cutting/tin_wire_bootstrap'],
 ['modern_industrialization:tin_cable','modern_industrialization:materials/tin/packer/cable'],
 ['modern_industrialization:motor','createch2:low_voltage/mi/basic_motor_prototype'],
 ['modern_industrialization:lv_steam_turbine','modern_industrialization:electric_age/machine/lv_steam_turbine_asbl'],
 ['modern_industrialization:steel_packer','modern_industrialization:steam_age/steel/packer_asbl'],
 ['modern_industrialization:bronze_boiler','createch2:age_foundation/mi_bronze/boiler'],
 ['modern_industrialization:rubber_sheet','createch2:low_voltage/mi/industrial_rubber_sheet_from_natural_rubber'],
 ['railcraft:coke_oven_bricks','createch2:heavy_industry/railcraft/coke_oven_bricks'],
 ['fluid:railcraft:creosote','railcraft:coke_oven/charcoal'],
 ['fluid:modern_industrialization:lubricant','modern_industrialization:materials/mixer/lubricant'],
 ['fluid:tfmg:lubrication_oil','createch2:fluid_compat/mi_lubricant_to_tfmg_lubrication_oil'],
 ['tfmg:firebox','tfmg:crafting/materials/firebox'],
 ['tfmg:exhaust','tfmg:crafting/materials/exhaust'],
 ['tfmg:steel_fluid_tank','createch2:heavy_industry/tfmg/steel_fluid_tank'],
 ['tfmg:steel_distillation_output','createch2:heavy_industry/tfmg/distillation_output'],
 ['tfmg:steel_distillation_controller','createch2:heavy_industry/tfmg/distillation_controller'],
 [kineticItem(0,'mechanical_pump'),'createch2:greate/tier_0/mechanical_pump'],
 ['fluid:tfmg:naphtha','tfmg:distillation/crude_oil'],
 ['create:spout','createch2:age_foundation/create/spout'],
 ['create:copper_casing','create:item_application/copper_casing_from_log'],
 ['createbigcannons:basin_foundry_lid','createch2:age_foundation/foundry/basin_foundry_lid'],
 ['tfmg:hardened_planks','tfmg:filling/hardened_planks'],
 ['tfmg:steel_casing','createch2:steel_steam/tfmg/steel_casing'],
 [kineticItem(1,'mechanical_mixer'),'createch2:greate/tier_1/mechanical_mixer'],
 ['fluid:stellaris:fuel','createch2:first_space/fuel/tfmg_kerosene_to_stellaris_fuel'],
 ['stellaris:rocket_station','createch2:first_space/stellaris/rocket_station_lv'],
 ['stellaris:rocket_engine','createch2:first_space/stellaris/rocket_engine_lv'],
 ['stellaris:engine_fan','createch2:first_space/stellaris/engine_fan_lv'],
 ['stellaris:rocket_fin','createch2:first_space/stellaris/rocket_fin_lv'],
 ['stellaris:rocket_nose_cone','createch2:first_space/stellaris/rocket_nose_cone_lv'],
 ['stellaris:rocket_launch_pad','createch2:first_space/stellaris/rocket_launch_pad_lv'],
 ['stellaris:battery','createch2:first_space/stellaris/battery_lv'],
 ['stellaris:cable','createch2:first_space/stellaris/cable_lv'],
 ['stellaris:oxygen_tank','createch2:first_space/stellaris/oxygen_tank_lv'],
 ['stellaris:heavy_metal_casing','createch2:first_space/stellaris/rocket_airframe_lv'],
 ['stellaris:rocket','createch2:first_space/stellaris/rocket_final_assembly']];
const controlled=selected.map(([item])=>item);
const nativePlank=native.recipes['tfmg:filling/hardened_planks'][0].data;
const plank=read(path.join(liveRoot,'kubejs/data/tfmg/recipe/filling/hardened_planks.json'));
assert.deepEqual(plank,{...nativePlank,ingredients:[nativePlank.ingredients[0],{type:'neoforge:tag',amount:nativePlank.ingredients[1].amount,tag:'c:creosote'}]},'Hardened plank correction changed its native bill/yield');
assert.equal(plank.ingredients[1].amount,250);assert.equal(plank.results.length,1);

const firstTank=read(path.join(liveRoot,'kubejs/data/createch2/recipe/heavy_industry/tfmg/steel_fluid_tank.json'));
const oldTank=native.recipes['tfmg:crafting/materials/steel_fluid_tank'][0].data;
assert.equal(firstTank.result.count,oldTank.result.count);assert.equal(firstTank.pattern.join('').split('P').length-1,oldTank.pattern.join('').split('P').length-1);
assert.equal(firstTank.key.P.item,'tfmg:heavy_plate');assert.equal(firstTank.key.B.tag,'createch2:wooden_barrels');assert(tags.hasTag('createch2:wooden_barrels','tfc:wood/barrel/oak'));
assert(ledger.nodes.find(n=>n.code==='CHE-01').recipes_unlocked.includes('createch2:heavy_industry/tfmg/steel_fluid_tank'));

const nativeCable=native.recipes['modern_industrialization:materials/tin/packer/cable'][0].data;
const steamPacker=powerContract.steamProcessors.packer.find(p=>p.item==='modern_industrialization:steel_packer');
assert(steamPacker&&nativeCable.eu<=steamPacker.maxEu);
assert.deepEqual(nativeCable.item_inputs,[{amount:6,item:'modern_industrialization:rubber_sheet'},{amount:3,item:'modern_industrialization:tin_wire'}]);
assert.deepEqual(nativeCable.item_outputs,[{amount:3,item:'modern_industrialization:tin_cable'}]);
const formUnits=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const wireUnits=formUnits.reviewedWireUnits.find(w=>w.item==='modern_industrialization:tin_wire').units;
const cableUnits=formUnits.reviewedCableUnits.find(c=>c.item==='modern_industrialization:tin_cable').stockUnits;
const firstCableContract={recipe:'modern_industrialization:materials/tin/packer/cable',processor:steamPacker.item,recipeEu:nativeCable.eu,processorMaxEu:steamPacker.maxEu,energySource:'Native steam service',wireCount:3,rubberSheetCount:6,cableCount:3,paidTinUnits:3*wireUnits,outputTinUnits:3*cableUnits,newRecipes:0};
assert.equal(firstCableContract.paidTinUnits,firstCableContract.outputTinUnits);
function resolvedRef(ref){if(ref.kind==='fluid_tag'&&ref.id==='c:creosote'){assert(native.fluidTags['c:creosote'].some(r=>r.data.values.includes('railcraft:creosote')));return 'fluid:railcraft:creosote';}if(ref.id==='createch2:control/factory/analog')return 'modern_industrialization:analog_circuit';if(ref.id==='createch2:food/dried_kelp'){assert(tags.hasTag(ref.id,'tfc:food/dried_kelp'));return 'tfc:food/dried_kelp';}return ref.kind==='item'&&kineticAliases.has(ref.id)?kineticAliases.get(ref.id):refLabel(ref);}
function prove(graph,frontier,root,active=new Set(),done=new Set()){
 if(frontier.has(root)||done.has(root))return done;
 assert(!active.has(root),'Physical bootstrap cycle: '+[...active,root].join(' -> '));
 assert(graph.has(root),'Missing physical supplier: '+root);active.add(root);
 for(const dependency of graph.get(root))prove(graph,frontier,dependency,active,done);
 active.delete(root);done.add(root);return done;
}
const modes=[],laboratoryModes=[];let negatives=0;
assert.throws(()=>firstRocketFuelContract(liveRoot,tags,{allowedTag:{replace:false,values:['#c:fuels']}}),/private rocket tag/);negatives++;
assert.throws(()=>firstRocketFuelContract(liveRoot,tags,{config:{required:true,mixins:[]}}),/not configured/);negatives++;
const guardCode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(liveRoot,'mods/createch2core.jar'),'createch2.core.mixin.compat.StellarisRocketFuelMixin'],{encoding:'utf8'});
assert.throws(()=>firstRocketFuelContract(liveRoot,tags,{code:guardCode.replace('iconst_0','iconst_1')}),/Compiled admission branch/);negatives++;
firstSpaceTravel.fuelAdmission.negativeCases=3;
assert.throws(()=>firstPetroleumContract(liveRoot,{fuel:{replace:false,values:[]}}),/startup fuel/);negatives++;
assert.throws(()=>firstPetroleumContract(liveRoot,{fuel:{replace:true,values:['railcraft:creosote']}}),/startup fuel/);negatives++;
for(const extension of [{replace:false,values:[]},{replace:true,values:['railcraft:creosote']},{replace:false,values:['tfmg:lubrication_oil']}]){assert.throws(()=>nativeHotBlastFuelContract(liveRoot,{extension}),/startup fuel/);negatives++;}
assert.throws(()=>firstPowerContract(liveRoot,{startup:'bidirectionalEnergyCompat = false'}),/disabled/);negatives++;
assert.throws(()=>firstPowerContract(liveRoot,{server:'forgeEnergyPerEu = 0'}),/ratio/);negatives++;
for(const optional of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optional),graph=new Map(),frontier=new Set();
 const ee=policy.additions.filter(r=>r.file==='kubejs/server_scripts/power/electro_energetics_authority.js');
 for(const r of ee){const d=r.custom??{type:r.kind==='shaped'?'minecraft:crafting_shaped':'minecraft:crafting_shapeless',result:r.args[0]};assert(!policy.removals.some(m=>matchesRecipeFilter(m.filter,r.id,d)===true),'Owned electrical recipe removed '+r.id);}
 const motorFixture={result:{id:'electroenergetics:white_electric_motor'}};assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'example:unreviewed_motor',motorFixture)===true),'Electrical ownership exception reopened native motors');
 const lab=policy.additions.find(r=>r.id==='createch2:research/research_lab');assert(lab?.args?.[2]?.G.includes(ceramic),'Copper laboratory still requires later glass production');
 assert(!ledger.nodes.some(n=>n.recipes_unlocked.includes(lab.id)),'Laboratory is research-locked before its first research');
 const labResult=labProof(policy,lab);assert(labResult.reached,'Copper laboratory cannot be built from the stated terrestrial workshop frontier');
 const oldLab=structuredClone(lab);oldLab.args[2].G='minecraft:glass_pane';assert(!labProof(policy,oldLab).reached,'Old exact-pane regression unexpectedly passes Copper bootstrap');negatives++;
 laboratoryModes.push({optionalProvider:optional,...labResult,rawInputs:rawLabFrontier,pitKilnTemperature:pitTemperature,mechanics:['Clay knapping and pit firing','Stone-anvil welding with flux and hammer','Copper-anvil forging','Freshwater limewater and mortar in an oak barrel'],limits:['Raw clay, limestone, sand, water and the existing Copper workshop stock are explicit frontier supplies; geographical abundance is not inferred.','Native knapping, heating, barrel sealing and anvil interaction remain runtime qualification.']});
 for(const n of ledger.nodes){graph.set(n.id,[...n.parents,...(n.cost.item?[n.cost.item]:[]),...(n.cost.packs??[]).map(p=>p.includes(':')?p:'createch2:'+p)]);}
 for(const p of ['createch2:material_specimens','createch2:kinetic_data'])frontier.add(p);
 graph.set(grid.pack,[grid.unlock_node,...recipeInputRefs(grid.recipe).map(resolvedRef)]);
 for(const [item,id]of selected){
  const f=path.join(liveRoot,'kubejs/data',id.replace(':','/recipe/')+'.json');
  const captured=policy.additions.find(r=>r.id===id);
  const original=fs.existsSync(f)?read(f):native.recipes[id]?.[0]?.data??(captured?.kind==='shaped'?{type:'minecraft:crafting_shaped',key:captured.args[2],result:{id:captured.args[0]}}:null);
  assert(original,'Missing bootstrap manufacturer '+id);
  const {data:d,applied}=replayRecipeNormalizations(id,original,policy.modifications);
  if(item==='electroenergetics:heavily_insulated_wire')assert(applied.some(r=>r.source==='minecraft:dried_kelp'&&r.target==='#createch2:food/dried_kelp'),'Existing kelp normalization was not applied');
  assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Removed bootstrap manufacturer '+id);
  const apparatus=d.type==='stellaris:rocket_station'?['stellaris:rocket_station']:d.type==='create:filling'?['create:spout']:d.type==='tfmg:distillation'?['capability:first_refinery']:['create:mixing','greate:mixing'].includes(d.type)?[kineticItem(d.recipe_tier??0,'mechanical_mixer'),'create:basin','create:water_wheel',kineticItem(0,'shaft')]:d.type==='railcraft:coking'?['railcraft:coke_oven_bricks']:d.type==='modern_industrialization:mixer'?['modern_industrialization:bronze_mixer','capability:steam_service']:d.type==='create:sequenced_assembly'?[...new Set(d.sequence.flatMap(step=>step.type==='create:deploying'?['create:deployer']:step.type==='create:filling'?['create:spout']:step.type==='create:pressing'?[kineticItem(0,'mechanical_press')]:step.type==='greate:pressing'?[kineticItem(step.recipe_tier,'mechanical_press')]:[]))]:d.type==='minecraft:stonecutting'?['minecraft:stonecutter']:d.type==='greate:cutting'?[kineticItem(d.recipe_tier,'mechanical_saw')]:d.type==='greate:pressing'?[kineticItem(d.recipe_tier,'mechanical_press')]:d.type==='modern_industrialization:packer'?[steamPacker.item,'capability:steam_service']:[];
  graph.set(item,[...recipeInputRefs(d).map(resolvedRef),...apparatus,...ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.id)]);
 }
 // Every first-crude cut requires the same field source, complete tower and heat.
 for(const cut of crudeDistillation.results)if(cut.id!=='tfmg:naphtha')graph.set('fluid:'+cut.id,[...graph.get('fluid:tfmg:naphtha')]);
 graph.set('capability:industrial_power',['electroenergetics:alternator_rotor','electroenergetics:stator','electroenergetics:alternator_brushes','electroenergetics:wire_spool','electroenergetics:converter','create:water_wheel',kineticItem(0,'shaft')]);
 graph.set('capability:steam_service',['modern_industrialization:bronze_boiler','fluid:minecraft:water','minecraft:charcoal']);
 graph.set('capability:first_refinery_heat',['tfmg:firebox','tfmg:exhaust','fluid:railcraft:creosote','tfmg:cast_iron_pipe','tfmg:cast_iron_mechanical_pump','create:water_wheel',kineticItem(0,'shaft')]);
 graph.set('capability:first_refinery',['capability:first_refinery_heat','tfmg:steel_distillation_controller','tfmg:steel_distillation_output','tfmg:steel_fluid_tank']);
 graph.set('fluid:tfmg:crude_oil',['world:reviewed_tfc_petroleum_province',kineticItem(0,'mechanical_pump'),'create:fluid_pipe','create:water_wheel',kineticItem(0,'shaft')]);

 const physicalFrontier=new Set([...graph.values()].flat().filter(id=>!graph.has(id)));
 for(const id of physicalFrontier)frontier.add(id);
 // Only earlier terrestrial stock may be assumed; machinery, controls and
 // their research are always expanded, never accepted as frontier stock.
 for(const id of controlled)assert(!frontier.has(id));
 const reached=prove(graph,frontier,'modern_industrialization:assembler');
 assert(reached.has('createch2:com_01_analog_logic'));assert(reached.has(grid.pack));
 const radiation=prove(graph,frontier,'mekanism:dosimeter');assert(radiation.has('mekanism:geiger_counter'));assert(radiation.has('modern_industrialization:analog_circuit'));
 const propulsionMotor=prove(graph,frontier,'electroenergetics:white_electric_motor');
 const conversion=prove(graph,frontier,'electroenergetics:converter');assert(conversion.has('modern_industrialization:analog_circuit'));
 const firstPower=prove(graph,frontier,'capability:industrial_power');assert(firstPower.has('electroenergetics:transformer_core'));assert(!firstPower.has('modern_industrialization:tin_cable'));
 const turbine=prove(graph,frontier,'modern_industrialization:lv_steam_turbine');assert(turbine.has('modern_industrialization:tin_cable'));assert(turbine.has('modern_industrialization:tin_wire'));
 const nativeAirframe=native.recipes['stellaris:misc/heavy_metal_casing'][0].data;assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'stellaris:misc/heavy_metal_casing',nativeAirframe)===true),'Cheap native casing bypasses the reviewed airframe station');
 const firstRocket=prove(graph,frontier,'stellaris:rocket');assert(firstRocket.has('stellaris:rocket_station'));assert(firstRocket.has('stellaris:rocket_fin'));assert(graph.get('stellaris:rocket').includes(kineticItem(1,'mechanical_press')));const noSteelPress=new Set(frontier);noSteelPress.delete(kineticItem(1,'mechanical_press'));assert.throws(()=>prove(graph,noSteelPress,'stellaris:rocket'),/Missing physical supplier/);negatives++;
 const firstRocketFuel=prove(graph,frontier,'fluid:stellaris:fuel');assert(firstRocketFuel.has('tfmg:hardened_planks'));assert(firstRocketFuel.has('fluid:railcraft:creosote'));
 const oldPlanks=structuredClone(graph);oldPlanks.set('tfmg:hardened_planks',['fluid:tfmg:creosote']);assert.throws(()=>prove(oldPlanks,frontier,'fluid:stellaris:fuel'),/Missing physical supplier/);negatives++;
 const refinery=prove(graph,frontier,'fluid:tfmg:naphtha');assert(refinery.has('fluid:modern_industrialization:lubricant'));assert(refinery.has('railcraft:coke_oven_bricks'));
 const noExhaust=structuredClone(graph);noExhaust.delete('tfmg:exhaust');assert.throws(()=>prove(noExhaust,frontier,'capability:first_refinery'),/Missing physical supplier/);negatives++;
 const petroleumOnly=structuredClone(graph);petroleumOnly.set('fluid:railcraft:creosote',['fluid:tfmg:naphtha']);assert.throws(()=>prove(petroleumOnly,frontier,'capability:first_refinery'),/cycle/);negatives++;
 const cableCycle=structuredClone(graph);cableCycle.set('modern_industrialization:electric_packer',['modern_industrialization:tin_cable']);cableCycle.get('modern_industrialization:tin_cable').push('modern_industrialization:electric_packer');assert.throws(()=>prove(cableCycle,frontier,'modern_industrialization:motor'),/cycle/);negatives++;
 const missingCap=structuredClone(graph);missingCap.delete('electroenergetics:high_voltage_capacitor');assert.throws(()=>prove(missingCap,frontier,'capability:industrial_power'),/Missing physical supplier/);negatives++;
 const oldConverter=structuredClone(graph);oldConverter.get('electroenergetics:converter').push('modern_industrialization:electronic_circuit');assert.throws(()=>prove(oldConverter,frontier,'electroenergetics:converter'),/Missing physical supplier/);negatives++;
 const oldCounter=structuredClone(graph);oldCounter.get('mekanism:geiger_counter').push('modern_industrialization:electronic_circuit');assert.throws(()=>prove(oldCounter,frontier,'mekanism:dosimeter'),/Missing physical supplier/);negatives++;
 const old=structuredClone(graph);old.get(grid.pack).push('modern_industrialization:assembler');
 assert.throws(()=>prove(old,frontier,'modern_industrialization:assembler'),/cycle/);negatives++;
 const missing=structuredClone(graph);missing.delete('electroenergetics:clamp_meter');
 assert.throws(()=>prove(missing,frontier,'modern_industrialization:assembler'),/Missing physical supplier/);negatives++;
 modes.push({optionalProvider:optional,selectedManufacturers:selected.map(([item,id])=>({item,recipe:id})),proved:[...reached],firstSpaceInstruments:[...radiation],firstConversion:[...conversion],firstPower:[...firstPower],firstTurbine:[...turbine],propulsionMotor:[...propulsionMotor],firstRefinery:[...refinery],firstRocketFuel:[...firstRocketFuel],firstRocket:[...firstRocket],electricalOwners:ee.map(r=>r.id),earlierFactoryInputs:[...physicalFrontier].sort()});
}
const chapter=readQuestSnbt(fs.readFileSync(path.join(liveRoot,'config/ftbquests/quests/chapters/createch2_07_age_06_low_voltage.snbt'),'utf8'));
assert.equal(chapter.quests.find(q=>q.id==='79074CED9461BDA5').tasks.find(t=>t.id==='4C06C2532A33CE3E').item.id,'electroenergetics:alternator_rotor');
assert(chapter.quests.find(q=>q.id==='08ACD10B84F19375').dependencies.includes('781B84CA4BF0B0F6'),'Turbine quest precedes first electrical-service proof');
for(const q of chapter.quests)assert(!JSON.stringify(q.tasks).includes('modern_industrialization:electronic_circuit'),'Offworld electronic stock restored as LV objective '+q.id);
for(const id of ['material_specimens','process_samples','esoteric_records']){const route=ledger.pack_routes.find(r=>r.id==='createch2:research/pack/'+id);assert(route.recipe.key.G.includes(ceramic),'Early samples require later glass production '+id);}
for(const id of ['kinetic_data','logistics_reports','ordnance_reports'])assert.equal(ledger.pack_routes.find(r=>r.id==='createch2:research/pack/'+id).recipe.key.S,'#c:strings','Early records exclude TFC fibres '+id);
assert.equal(ledger.pack_routes.find(r=>r.id==='createch2:research/pack/logistics_reports').recipe.key.C,'#c:chests/wooden');
assert(tags.hasTag('c:strings','tfc:wool_yarn'));assert(tags.hasTag('c:chests/wooden','tfc:wood/chest/oak'));
const report={truth:'STATIC_FIRST_GRID_BOOTSTRAP',modes,laboratoryModes,powerContract,petroleumContract,firstSpaceTravel,petroleumWorld:petroleumWorld.petroleum,firstCableContract,negativeCases:negatives,lvQuestCount:chapter.quests.length,limits:[`The Copper laboratory/record proof expands ${primitive.length} installed TFC/TFC-items suppliers from the explicit terrestrial/Copper frontier.`,'The physical proof expands first motor, assembler, converter apparatus, alternator parts, magnetic rod, insulated tin conductors and LV turbine with their research; earlier terrestrial material/kinetic evidence suppliers are the explicit frontier.','The first refinery proof expands coke-oven creosote, native steam mixing/bridge lubricant and firebox/exhaust/tower hardware against explicit earlier foundry/TFC workshop stocks; it does not assume first refined fuel.','Base kinetic input aliases follow current Greate unification priorities; native Create processing compatibility with Greate entry machines follows the existing industrial contract.','Crafting remainders, loaded tags, electrical instrument operation and Researchd synchronization require runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission02/bootstrap-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({providerModes:2,physicalManufacturers:selected.length,copperLaboratorySuppliers:primitive.length,negativeCases:negatives,lvQuestCount:chapter.quests.length}));
