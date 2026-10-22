import './lib/native_disassembly_cache.mjs';
import {nativeMekInfuserContract} from './lib/native_mek_infuser.mjs';
import {nativeSuperconductorInputs} from './lib/native_superconductor_inputs.mjs';
import {nativeStarlightSuppliers} from './lib/native_starlight_suppliers.mjs';
import {nativeProcessingUnitContract} from './lib/native_processing_unit.mjs';
import {firstBucketNickelStock} from './lib/first_bucket_nickel_stock.mjs';
import {firstBucketPrecisionStock} from './lib/first_bucket_precision_stock.mjs';
import {locomotiveBoilerStock} from './lib/locomotive_boiler_stock.mjs';
import {locomotiveCastIronPipeStock} from './lib/locomotive_cast_iron_pipe_stock.mjs';
import {locomotiveOilHandoff} from './lib/locomotive_oil_handoff.mjs';
import {locomotiveAssemblyStock} from './lib/locomotive_assembly_stock.mjs';
import {steelProviderAlignment} from './lib/steel_provider_alignment.mjs';
import {freightObjective} from './lib/freight_objective.mjs';
import {glassStock} from './lib/glass_stock.mjs';
import {nativeSawRecipeCycle as checkNativeSawRecipeCycle} from './lib/native_saw_recipe_cycle.mjs';
import {brassSheetStock} from './lib/brass_sheet_stock.mjs';
import {nativeClearGlass,firstNativeClearGlass} from './lib/native_clear_glass.mjs';
import {copperRingStock} from './lib/copper_ring_stock.mjs';
import {fireboxStock} from './lib/firebox_stock.mjs';
import {controlsStock} from './lib/controls_stock.mjs';
import {bulkWroughtConservation} from './lib/wrought_metal_bill.mjs';
import {miCasingStockPlan} from './lib/mi_casing_stock_plan.mjs';
import {locomotivePumpStock} from './lib/locomotive_pump_stock.mjs';
import {nativeLavaRigRecovery} from './lib/lava_rig_recovery.mjs';
import {lavaCaptureStock} from './lib/lava_capture_stock.mjs';
import {heatedObsidianStock} from './lib/heated_obsidian_stock.mjs';
import {nativeManualApplicationResearch as checkManualApplicationResearch} from './lib/native_manual_application_research.mjs';
import {nativeResearchRuntimeAliases as checkNativeResearchRuntimeAliases} from './lib/native_research_runtime_aliases.mjs';
import {tfcLeverStock} from './lib/tfc_lever_stock.mjs';
import {sturdySheetStock} from './lib/sturdy_sheet_stock.mjs';
import {steelMechanismStockPlan} from './lib/steel_mechanism_stock_plan.mjs';
import {precisionBatchStockPlan} from './lib/precision_batch_stock_plan.mjs';
import {steelPressStockPlan} from './lib/steel_press_stock_plan.mjs';
import {nativeFormingSetupContract,firstFormingSetupProof} from './lib/native_forming_setup.mjs';
import {primitiveGoldEntryContract,firstPrimitiveGoldEntry} from './lib/primitive_gold_entry.mjs';
import {mechanicalIronEntryContract,firstMechanicalIronEntry} from './lib/mechanical_iron_entry.mjs';
import {nativePrecisionAttemptContract} from './lib/native_precision_attempt_contract.mjs';
import {firstPrecisionAttemptProof} from './lib/first_precision_attempt_proof.mjs';
import {nativeMechanismOilStockContract} from './lib/native_mechanism_oil_stock_contract.mjs';
import {firstMechanismOilStockProof} from './lib/first_mechanism_oil_stock_proof.mjs';
import {nativeCharcoalForgeBindings} from './lib/native_charcoal_forge_contract.mjs';
import {nativeNickelStockContract} from './lib/native_nickel_stock_contract.mjs';
import {firstNickelStockProof} from './lib/first_nickel_stock_proof.mjs';
import {nativeLeadStockContract} from './lib/native_lead_stock_contract.mjs';
import {firstLeadStockProof} from './lib/first_lead_stock_proof.mjs';
// Mixed first-acquisition model. Unknown inputs are not free stock; a pack
// route requires its actual ingredients, research owner and laboratory machine.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,compileRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
import {baseKineticAliases,kineticItem,kineticParts} from './sources/recipe_families/greate_progression.mjs';
import {nativeVatContract,reviewVatRecipe,vatItems} from './lib/native_vat_contract.mjs';
import {nativeSteamContract} from './lib/native_steam_contract.mjs';
import {nativeColdworksContract} from './lib/native_coldworks_contract.mjs';
import {nativeGeneratedCatalystTags} from './lib/native_generated_catalyst_tags.mjs';
import {nativeGeneratedPlateContract} from './lib/native_generated_plate_contract.mjs';
import {nativeUpperPlateTags} from './lib/native_upper_plate_tags.mjs';
import {nativeEarlyCrushingContract,nativeLowTierCrushingResults} from './lib/native_early_crushing_contract.mjs';
import {nativeSiliconFurnaceContract,reviewNativeSiliconRecipe} from './lib/native_silicon_furnace_contract.mjs';
import {nativeHeatedMixingContract} from './lib/native_heated_mixing_contract.mjs';
import {nativeLvAssemblerContract} from './lib/native_lv_assembler_contract.mjs';
import {nativeInscriberContract,reviewNativeInscriberRecipe} from './lib/native_inscriber_contract.mjs';
import {nativeControllerLineContract} from './lib/native_controller_line_contract.mjs';
import {nativeRecipeEventContract,replayRecipeEventEntry} from './lib/native_recipe_event_contract.mjs';
import {nativeCopperHammerContract} from './lib/native_copper_hammer_contract.mjs';
import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
import {firstWitchHerbsProof} from './lib/first_witch_herbs_proof.mjs';
import {tfcIndustrialIronContract} from './lib/tfc_industrial_iron_contract.mjs';
import {firstIndustrialIronProof} from './lib/first_industrial_iron_proof.mjs';
import {nativeFirstWroughtContract} from './lib/native_first_wrought_contract.mjs';
import {firstWroughtProof} from './lib/first_wrought_proof.mjs';
import {nativeLubricationBucketContract} from './lib/native_lubrication_bucket_contract.mjs';
import {firstLubricationBucketProof} from './lib/first_lubrication_bucket_proof.mjs';
import {nativeTfcLeatherContract} from './lib/native_tfc_leather_contract.mjs';
import {firstTfcLeatherProof} from './lib/first_tfc_leather_proof.mjs';
import {nativeNaturalRubberContract} from './lib/native_natural_rubber_contract.mjs';
import {firstNaturalRubberProof} from './lib/first_natural_rubber_proof.mjs';
import {nativeStartupLubricantContract} from './lib/native_startup_lubricant_contract.mjs';
import {firstStartupLubricantProof} from './lib/first_startup_lubricant_proof.mjs';
import {tfcStartupHardwareContract} from './lib/tfc_startup_hardware_contract.mjs';
import {firstTfcStartupHardwareProof} from './lib/first_tfc_startup_hardware_proof.mjs';
import {nativeFirstAirContract} from './lib/native_first_air_contract.mjs';
import {firstAirProof} from './lib/first_air_proof.mjs';
import {nativeFirstHotAirContract,reviewNativeHotAirRecipe} from './lib/native_first_hot_air_contract.mjs';
import {firstHotAirProof} from './lib/first_hot_air_proof.mjs';
import {selectEarlyCokeSuppliers} from './lib/early_coke_supplier_selection.mjs';
import {nativeGeologicalCokeContract,reviewNativeGeologicalCoking} from './lib/native_geological_coke_contract.mjs';
import {firstGeologicalCokeProof} from './lib/first_geological_coke_proof.mjs';
import {nativeFirstSteelContract,reviewNativeFirstSteelRecipe} from './lib/native_first_steel_contract.mjs';
import {firstSteelProof} from './lib/first_steel_proof.mjs';
import {nativeFirstSteelShaftContract} from './lib/native_first_steel_shaft_contract.mjs';
import {firstSteelShaftProof,selectFirstSteelShaftSuppliers} from './lib/first_steel_shaft_proof.mjs';
import {replayMetalFluidUnitTags} from './lib/replay_metal_fluid_unit_tags.mjs';
import {nativeFoundryBronzeContract,reviewFoundryBronzeMelting} from './lib/native_foundry_bronze_contract.mjs';
import {nativeFirstIgnitionContract} from './lib/native_first_ignition_contract.mjs';
import {firstIgnitionProof} from './lib/first_ignition_proof.mjs';
import {selectGeologicalRubberSuppliers,firstGeologicalNaturalRubberProof} from './lib/first_geological_natural_rubber_proof.mjs';
import {nativeSteelSteamBucketContract} from './lib/native_steel_steam_bucket_contract.mjs';
import {firstSteelSteamBucketProof} from './lib/first_steel_steam_bucket_proof.mjs';
import {firstGeologicalLubricationBucketProof} from './lib/first_geological_lubrication_bucket_proof.mjs';
import {nativeManualRollingContract,reviewNativeRollingRecipe} from './lib/native_manual_rolling_contract.mjs';
import {firstManualRollingProof} from './lib/first_manual_rolling_proof.mjs';
import {nativeRailGradeSteelContract,reviewRailGradeSteelRecipe} from './lib/native_rail_grade_steel_contract.mjs';
import {firstRailGradeSteelProof} from './lib/first_rail_grade_steel_proof.mjs';
import {nativeRailCircuitContract} from './lib/native_rail_circuit_contract.mjs';
import {firstRailCircuitProof} from './lib/first_rail_circuit_proof.mjs';
import {nativeRailTerminalContract} from './lib/native_rail_terminal_contract.mjs';
import {firstRailTerminalProof} from './lib/first_rail_terminal_proof.mjs';
import {nativeMechanismLeadContract} from './lib/native_mechanism_lead_contract.mjs';
import {firstMechanismLeadCandidate} from './lib/first_mechanism_lead_candidate.mjs';
import {nativeMechanismSteelStockContract} from './lib/native_mechanism_steel_stock_contract.mjs';
import {firstMechanismSteelStockProof} from './lib/first_mechanism_steel_stock_proof.mjs';
import {nativeSteelMechanismContract} from './lib/native_steel_mechanism_contract.mjs';
import {firstSteelMechanismCandidate} from './lib/first_steel_mechanism_candidate.mjs';
import {nativeRailDetectorContract} from './lib/native_rail_detector_contract.mjs';
import {firstRailDetectorProof} from './lib/first_rail_detector_proof.mjs';
import {nativeRailGoldContract} from './lib/native_rail_gold_contract.mjs';
import {firstRailGoldProof} from './lib/first_rail_gold_proof.mjs';
import {nativeRailStockContract} from './lib/native_rail_stock_contract.mjs';
import {firstRailStockProof} from './lib/first_rail_stock_proof.mjs';
import {nativeRailFeedstockContract} from './lib/native_rail_feedstock_contract.mjs';
import {firstRailFeedstockProof} from './lib/first_rail_feedstock_proof.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/mission02');
execFileSync(process.execPath,[path.join(developmentRoot,'createch-dev/scripts/verify_campaign_bootstrap.mjs')],{stdio:'pipe'});
execFileSync(process.execPath,[path.join(developmentRoot,'createch-dev/scripts/verify_native_casting_batches.mjs')],{stdio:'pipe'});
execFileSync(process.execPath,[path.join(developmentRoot,'createch-dev/scripts/verify_steel_mechanism_held_inputs.mjs')],{stdio:'pipe'});
const trace=label=>{if(process.env.MISSION02_TRACE)console.error(new Date().toISOString(),label);};
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const bootstrap=read(path.join(state,'bootstrap-validation.json')),powerContract=bootstrap.powerContract;
assert.equal(powerContract.truth,'STATIC_NATIVE_FE_EU_BRIDGE');
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const nativeIndustrialIron=tfcIndustrialIronContract(liveRoot,developmentRoot,native);
const world=read(path.join(state,'world-validation.json'));
const witchHerbs=world.witchHerbSources;assert.equal(witchHerbs?.truth,'STATIC_NATIVE_TFC_GRASSES_TO_WITCH_SEEDS');
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const nativeGeneratedPlate=nativeGeneratedPlateContract(liveRoot);
const nativeGeneratedCatalyst=nativeGeneratedCatalystTags(liveRoot,nativeGeneratedPlate);
const nativeUpperPlates=nativeUpperPlateTags({root:liveRoot,developmentRoot,shared:nativeGeneratedPlate});
const tags=staticBulkReplicationPolicy(liveRoot,native,{includeAuthored:true,nativeGeneratedItemTags:{...nativeGeneratedPlate.itemTags,...nativeGeneratedCatalyst.itemTags,...nativeUpperPlates.itemTags}});
const nativeCopperHammer=nativeCopperHammerContract(liveRoot,native,tags);
assert(tags.members('c:plates/andesite_alloy').includes('greate:andesite_alloy_plate'),'Pack policy rejects the derived native plate membership');
const kineticAliases=new Map(baseKineticAliases.map(a=>[a.values[0],a.values[1]]));
const canonicalItem=id=>kineticAliases.get(id)??id;
trace('index and tags loaded');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const policy=captureRecipePolicy(liveRoot,true),recipes=[],unsupported=new Map(),producers=new Map();
const nativeRecipeEvent=nativeRecipeEventContract(liveRoot,policy,native),capturedOverrides=new Set(policy.additions.map(r=>r.id));
const removals=policy.removals.map(r=>compileRecipeFilter(r.filter));
const nativeFirstWrought=nativeFirstWroughtContract(liveRoot,native,tags,world,policy,removals);
trace('recipe policy captured');
const locks=new Map();for(const n of ledger.nodes)for(const id of n.recipes_unlocked){if(!locks.has(id))locks.set(id,[]);locks.get(id).push('research:'+n.id);}
const leaf=id=>({id:canonicalItem(id)}),all=children=>({all:children.filter(Boolean)}),any=children=>({any:children.filter(Boolean)});
const token=(kind,id)=>kind==='item'?canonicalItem(id):kind+':'+id;
const countFree=v=>typeof v==='string'?v.replace(/^\d+x?\s+/,''):v;
const freshFoodGuards=new Set();
function ingredient(v,kind='item'){
 if(v===undefined||v===null)throw new Error('missing ingredient');
 if(Array.isArray(v))return any(v.map(x=>ingredient(x,kind)));
 if(typeof v==='string')return leaf(token(kind,countFree(v)));
 if(v.type==='tfc:and'){
  const food=v.children?.find(c=>typeof c.item==='string'&&c.item.startsWith('tfc:food/'));
  assert(v.children?.length===2&&food&&v.children.some(c=>c.type==='tfc:not_rotten'),'unmodeled TFC ingredient conjunction');
  // Existential acquisition from fresh harvest/processing; retain the native
  // freshness precondition in evidence rather than minting a free food token.
  freshFoodGuards.add(food.item);return ingredient(food,kind);
 }
 if(v.type==='neoforge:intersection')return all(v.children.map(x=>ingredient(x,kind)));
 if(v.type==='neoforge:compound')return any(v.children.map(x=>ingredient(x,kind)));
 if(v.type==='neoforge:difference'||v.type==='neoforge:components')throw new Error('unmodeled ingredient constraint '+v.type);
 if(v.type==='neoforge:tag'&&v.tag)return ingredient({tag:v.tag},'fluid');
 if(v.fluid)return ingredient(v.fluid,'fluid');if(v.chemical)return ingredient(v.chemical,'chemical');
 if(v.tag)return leaf(token(kind,'#'+v.tag));if(v.item)return ingredient(v.item,'item');if(v.id)return ingredient(v.id,kind);
 if(v.ingredient)return ingredient(v.ingredient,kind);if(v.items)return ingredient(v.items,kind);
 throw new Error('unmodeled ingredient '+JSON.stringify(v).slice(0,90));
}
function itemStack(v){if(typeof v==='string')return token('item',countFree(v));return v?.id??v?.item;}
const fluidLayers=new Map(Object.entries(native.fluidTags??{}).map(([id,vs])=>[id,vs.map(v=>v.data)]));
for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/tags\/fluid\/.+\.json$/.test(f))){const m=/\/data\/([^/]+)\/tags\/fluid\/(.+)\.json$/.exec(f),id=m[1]+':'+m[2];fluidLayers.set(id,[...(fluidLayers.get(id)??[]),read(f)]);}
const metalFluidUnitTags=replayMetalFluidUnitTags(liveRoot,fluidLayers);
function fluidMembers(id,seen=new Set()){if(seen.has(id))return [];seen.add(id);let vs=[];for(const d of fluidLayers.get(id)??[]){if(d.replace)vs=[];vs.push(...d.values);}return [...new Set(vs.flatMap(v=>{v=typeof v==='string'?v:v.id;return v.startsWith('#')?fluidMembers(v.slice(1),new Set(seen)):[v];}))];}
const memberCache=new Map();
const tagMembers=id=>{if(!memberCache.has(id))memberCache.set(id,id.startsWith('fluid:#')?fluidMembers(id.slice(7)).map(x=>'fluid:'+x):id.startsWith('#')?tags.members(id.slice(1)):[]);return memberCache.get(id);};
const miMachines={assembler:'assembler',macerator:'electric_macerator',centrifuge:'centrifuge',chemical_reactor:'chemical_reactor',cutting_machine:'electric_cutting_machine',compressor:'electric_compressor',mixer:'electric_mixer',wiremill:'electric_wiremill',packer:'electric_packer',unpacker:'electric_unpacker',distillery:'distillery',distillation_tower:'distillation_tower',vacuum_freezer:'vacuum_freezer',blast_furnace:'electric_blast_furnace',electrolyzer:'electrolyzer',polarizer:'polarizer',heat_exchanger:'heat_exchanger'};
const createMachines={mixing:'create:mechanical_mixer',pressing:'create:mechanical_press',compacting:'create:mechanical_press',cutting:'create:mechanical_saw',milling:'create:millstone',crushing:'create:crushing_wheel',deploying:'create:deployer',filling:'create:spout',emptying:'create:item_drain',mechanical_crafting:'create:mechanical_crafter',splashing:'create:encased_fan',haunting:'create:encased_fan'};
const miUpgradeData=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods/Modern-Industrialization-2.5.10.jar'),'data/modern_industrialization/data_maps/item/machine_upgrades.json'],{encoding:'utf8'})).values;
const upgradeNeeds=new Map();
const nativeVat=nativeVatContract(liveRoot),vatAdmissions=[];
const nativeSteam=nativeSteamContract(liveRoot),castingAdmissions=[];
const nativeLvAssembler=nativeLvAssemblerContract(liveRoot,nativeSteam);
const nativeInscriber=nativeInscriberContract(liveRoot,nativeSteam,nativeLvAssembler),inscriberAdmissions=[];
for(const[id,data]of Object.entries(nativeInscriber.recipes))assert.deepEqual(native.recipes[id]?.[0]?.data,data,'Retain installed native inscriber source '+id);
const nativeColdworks=nativeColdworksContract(liveRoot);
const nativeEarlyCrushing=nativeEarlyCrushingContract(liveRoot,nativeVat.drive.rotarySource);
const nativeControllerLine=nativeControllerLineContract(liveRoot,nativeVat.drive.rotarySource,nativeEarlyCrushing,nativeInscriber,nativeSteam);
assert.deepEqual(native.recipes[nativeEarlyCrushing.conversion.sourceId]?.[0]?.data,nativeEarlyCrushing.conversion.sourceData);
assert(!removals.some(match=>match(nativeEarlyCrushing.conversion.runtimeId,nativeEarlyCrushing.conversion.runtimeData)===true),'Native converted coke recipe is retired by pack policy');
for(const selected of [nativeEarlyCrushing.quartzite,nativeEarlyCrushing.quartzMilling]){assert.deepEqual(native.recipes[selected.sourceId]?.[0]?.data,selected.before??selected.source);assert(!removals.some(match=>match(selected.runtimeId,selected.runtimeData)===true),'Selected native converted crushing recipe retired');}
const nativeHeatedMixing=nativeHeatedMixingContract(liveRoot,nativeVat.drive.rotarySource,world.nativeNetherSupplier);
assert.deepEqual(native.recipes[nativeHeatedMixing.sourceId]?.[0]?.data,nativeHeatedMixing.source);assert(!removals.some(match=>match(nativeHeatedMixing.runtimeId,nativeHeatedMixing.runtimeData)===true),'Native converted heated magnetic alloy retired');
const nativeSiliconFurnace=nativeSiliconFurnaceContract(liveRoot,world.blastFurnaceBlocks,tagMembers('#tfmg:blast_furnace_fuel'));
assert.deepEqual(native.recipes[nativeSiliconFurnace.sourceId]?.[0]?.data,nativeSiliconFurnace.sourceData);
const castingContract=read(path.join(state,'casting-batch-validation.json'));
assert.equal(castingContract.truth,'STATIC_NATIVE_CASTING_BATCH_COMPATIBILITY');
const castingByHash=new Map(castingContract.recipes.map(r=>[r.recipeSha256,r]));
const reviewCasting=d=>{const r=castingByHash.get(crypto.createHash('sha256').update(JSON.stringify(d)).digest('hex'));assert(r,'Unreviewed native casting payload');return r;};
// Installed native codecs/mechanics for the next mandatory petroleum cut.
const nativeText=(jar,name)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(liveRoot,'mods',jar),name],{encoding:'utf8'});
const tfcJar='TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar',railJar='railcraft-reborn-1.21.1-1.2.13.jar';
const glassOps=nativeText(tfcJar,'net.dries007.tfc.common.component.glass.GlassOperation');
for(const symbol of ['BLOWPIPE_WITH_GLASS','CERAMIC_BLOWPIPE_WITH_GLASS','WOOL_CLOTH','GEM_SAW','Heat.FAINT_RED','hasRequiredTemperature'])assert(glassOps.includes(symbol),'Glass operation contract changed: '+symbol);
const coking=nativeText(railJar,'mods.railcraft.world.item.crafting.CokeOvenRecipe');
assert(coking.includes('RailcraftFluids.CREOSOTE')&&coking.includes('FluidStack."<init>"'),'Native coking no longer emits Railcraft creosote');
const knappingTypes=Object.fromEntries(['clay','fire_clay'].map(name=>[name,JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',tfcJar),'data/tfc/tfc/knapping_type/'+name+'.json'],{encoding:'utf8'})).input]));
const stellarEnergy=nativeText('stellaris-1.21-neoforge-1.4.25.jar','com.st0x0ef.stellaris.common.blocks.entities.machines.BaseEnergyContainerBlockEntity');
const potentialEnergy=nativeText('potentials-neoforge-1.21-0.7.1.jar','com.fej1fun.potentials.neoforge.capabilities.holders.EnergyBlockHolder');
assert(stellarEnergy.includes('EnergyProvider$BLOCK')&&potentialEnergy.includes('Capabilities$EnergyStorage.BLOCK')&&potentialEnergy.includes('RegisterCapabilitiesEvent.registerBlockEntity:')&&potentialEnergy.includes('EnergyProvider$BLOCK.getEnergy:'));
const miGenerators=nativeText('Modern-Industrialization-2.5.10.jar','aztech.modern_industrialization.machines.init.SingleBlockSpecialMachines');
const lvSteamRating=/CableTier.LV:[^\n]*\n\s+\d+: bipush\s+(\d+)\n\s+\d+: sipush\s+16000\n\s+\d+: invokestatic[^\n]*registerSteamTurbine:/.exec(miGenerators);
assert(lvSteamRating,'Native LV steam turbine registration changed');
const lvSteamMaxEu=Number(lvSteamRating[1]);assert.equal(lvSteamMaxEu,32);
const nativeMechanics={miGeneratorsSha256:crypto.createHash('sha256').update(miGenerators).digest('hex'),lvSteamMaxEu,stellarEnergyProviderSha256:crypto.createHash('sha256').update(stellarEnergy).digest('hex'),potentialsFeBridgeSha256:crypto.createHash('sha256').update(potentialEnergy).digest('hex'),glassOperationsSha256:crypto.createHash('sha256').update(glassOps).digest('hex'),cokingRecipeSha256:crypto.createHash('sha256').update(coking).digest('hex'),knappingTypes,limits:'Static ingredient/tool/service model only. Actual knapping, heated blowpipe components, loom, quern, oven/tower structure and fluid extraction require runtime qualification.'};
for(const [name,symbols] of Object.entries({
 'recipes.ingredients.NotRottenIngredient':['FoodCapability.isRotten:'],
 'recipes.outputs.CopyFoodModifier':['FoodCapability.updateFoodFromPrevious:'],
 'blockentities.QuernBlockEntity':['QUERN_HANDSTONES'],
 'blocks.GlassBasinBlock':['GLASS_BASIN_BLOCKS','Direction.UP','isAir:'],
 'items.GlassBlowpipeItem':['BASIN_POUR','hasRequiredTemperature:','GlassBasinBlock.isValid:']
})){
 const code=nativeText(tfcJar,'net.dries007.tfc.common.'+name);for(const symbol of symbols)assert(code.includes(symbol),name+': '+symbol);
 nativeMechanics[name]=crypto.createHash('sha256').update(code).digest('hex');
}
const nativeLifeSupport={truth:'STATIC_NATIVE_OXYGEN_CONTAINER_TRANSFER',hashes:{},limits:'Native separator-to-container and crouch-use transfer contracts only; actual charging, oxygen consumption, worn armor protection and safe travel remain runtime qualification.'};
for(const [name,symbols]of Object.entries({
 'blocks.entities.machines.WaterSeparatorBlockEntity':['FluidUtil.moveFluidToItem:','resultTanks'],
 'items.OxygenTankItem':['Player.isShiftKeyDown:','EquipmentSlot.CHEST','FluidUtil.moveFluid:','DataComponentsRegistry.FLUID_LIST'],
 'items.OxygenTankItem$1':['FluidRegistry.OXYGEN_STILL','Fluid.isSame:'],
 'items.armors.SpaceSuit$1':['FluidRegistry.OXYGEN_STILL','Fluid.isSame:'],
 'utils.capabilities.fluid.FluidUtil':['moveFluidToItem(','UniversalFluidStorage.drain:','UniversalFluidStorage.fill:']
})){
 const code=nativeText('stellaris-1.21-neoforge-1.4.25.jar','com.st0x0ef.stellaris.common.'+name);for(const symbol of symbols)assert(code.includes(symbol),name+': '+symbol);
 nativeLifeSupport.hashes[name]=crypto.createHash('sha256').update(code).digest('hex');
}

function machine(type,d,recipeId=null){
 if(type==='createbigcannons:melting'){assert.equal(recipeId,nativeFoundryBronze.ids.melting,'Only the reviewed MAT-01 CBC melt is admitted');reviewFoundryBronzeMelting(d,nativeFoundryBronze);return leaf('capability:foundry_bronze_melting');}
 if(type==='tfc:bloomery'){assert.deepEqual(d,nativeFirstWrought.recipes[nativeFirstWrought.ids.bloom],'Only the reviewed native iron bloomery recipe is admitted');return leaf('capability:first_wrought_bloomery_service');}
 if(type.startsWith('modern_industrialization:')){const name=type.split(':')[1],item=miMachines[name];if(!item)throw new Error('unmodeled MI machine '+type);const ins=[leaf('modern_industrialization:'+item),leaf('capability:industrial_power')];
  if(name==='blast_furnace'){
   assert(d.eu<=128,'Unreviewed native EBF coil tier');ins.push(leaf('capability:mi_blast_structure'));
   if(d.eu>32)ins.push(leaf('modern_industrialization:kanthal_coil'));
   if(d.eu<=32&&d.eu*d.duration>nativeSteam.lvTurbine.steamTankCapacity+nativeSteam.lvTurbine.energyCapacity)ins.push(leaf('capability:mi_sustained_lv_service'));
  }
  if(name==='vacuum_freezer')ins.push(leaf('capability:mi_freezer_structure'));
  if(d.eu>32){const upgrade=d.eu<=128?'basic_upgrade':d.eu<=1024?'advanced_upgrade':'highly_advanced_upgrade',extra=miUpgradeData['modern_industrialization:'+upgrade].extraMaxEu,baseMaxEu=name==='assembler'?nativeLvAssembler.baseMaxEu:0,count=Math.ceil((d.eu-baseMaxEu)/extra);assert(count<=64,'Recipe needs more than one modeled upgrade stack '+type);ins.push(leaf('modern_industrialization:'+upgrade));upgradeNeeds.set(type+'/'+d.eu,{upgrade,count,extraMaxEu:extra,baseMaxEu,requiredEu:d.eu});}
  const steam=(powerContract.steamProcessors[name]??[]).filter(p=>d.eu<=p.maxEu).map(p=>all([leaf(p.item),leaf('capability:steam_service')]));
  return any([all(ins),...steam]);
 }
 if(type==='create:sequenced_assembly'||type==='greate:sequenced_assembly')return all(d.sequence.map(step=>machine(step.type,step)));
 if(type==='create:mixing'&&d.heat_requirement==='heated')return leaf('capability:andesite_heated_mixing');
 if(type==='create:mechanical_crafting'&&d.result?.id==='greate:andesite_alloy_crushing_wheel')return all(['create:mechanical_crafter','capability:kinetic_power','capability:early_crafter_grid'].map(leaf));
 if(type==='create:item_application')return leaf('capability:crafting');
 if(type.startsWith('create:')||type.startsWith('greate:')){const name=type.split(':')[1],item=createMachines[name];if(!item)throw new Error('unmodeled kinetic machine '+type);let selected=canonicalItem(item);
  if(type.startsWith('greate:')){const part=item.slice(7);if(!kineticParts.includes(part)||!Number.isInteger(d.recipe_tier))throw new Error('unmodeled Greate processor tier '+type);selected=kineticItem(d.recipe_tier,part);}
  const ins=[leaf(selected)];if(!['filling','emptying'].includes(name))ins.push(leaf('capability:kinetic_power'));
  if(name==='haunting')ins.push(leaf('capability:unreviewed_soul_fire_service'));
  if(['mixing','compacting'].includes(name))ins.push(leaf('create:basin'));
  if(d.heat_requirement&&d.heat_requirement!=='none')ins.push(leaf('capability:'+d.heat_requirement+'_burner'));
  return all(ins);
 }
 if(type==='stellaris:rocket_station')return leaf('stellaris:rocket_station');
 if(type==='ae2:inscriber'){reviewNativeInscriberRecipe(d);return all(['ae2:inscriber','capability:ae2_inscriber_service'].map(leaf));}
 if(type==='stellaris:water_seperator')return all(['stellaris:water_separator','capability:fe_power'].map(leaf));
 if(type==='railcraft:blasting'){assert.equal(recipeId,nativeRailGradeSteel.ids.steel);reviewRailGradeSteelRecipe(d,nativeRailGradeSteel);return all(['capability:rail_grade_furnace','capability:rail_grade_fresh_steel'].map(leaf));}
 if(type==='railcraft:rolling'){reviewNativeRollingRecipe(d);return leaf('capability:manual_rolling_service');}
 if(type==='railcraft:coking')return leaf('railcraft:coke_oven_bricks');
 if(type==='rubberworks:sapping')return leaf('capability:natural_rubber_sapping_service');
 if(type==='rubberworks:compressing')return leaf('capability:natural_rubber_warm_compression_service');
 if(type==='tfc:barrel_sealed')return leaf('capability:tfc_leather_calendar_service');
 if(type==='tfc:barrel_instant')return leaf('capability:tfc_leather_barrel_service');
 if(type==='tfc:scraping')return all([nativeTfcLeather.knife.item,nativeTfcLeather.world.oak.log].map(leaf));
 if(type==='tfc:loom')return leaf('tfc:wood/loom/oak');
 if(type==='tfc:quern')return all([leaf('tfc:quern'),leaf('#tfc:quern_handstones')]);
 if(type==='tfc:knapping'){if(d.knapping_type==='tfc:rock')assert([witchHerbs.knife.knap,nativeTfcLeather.recipes[nativeTfcLeather.ids.axeHead],nativeRailCircuits.recipes[nativeRailCircuits.ids.hammerHead]].some(x=>JSON.stringify(x)===JSON.stringify(d)),'Only the reviewed sedimentary knife/axe and intrusive hammer rock patterns are admitted');else assert(['tfc:clay','tfc:fire_clay'].includes(d.knapping_type),'unmodeled knapping material');return leaf('capability:crafting');}
 if(type==='tfc:glassworking'){
  if([nativePlainGlass.ids.glass,nativePlainGlass.ids.table].includes(recipeId)){
   assert.deepEqual(d,nativePlainGlass.recipes[recipeId]);
   return all([any(['tfc:blowpipe','tfc:ceramic_blowpipe'].map(leaf)),leaf('capability:primitive_heat'),leaf('tfc:metal/block/brass'),...(recipeId===nativePlainGlass.ids.table?[leaf('tfc:paddle')]:[])]);
  }
  // Reviewed lens and tinted-glass sequences retain their native tools,
  // powder, bowl and brass-basin requirements. Other operations stay excluded.
  const apparatus=[any(['tfc:blowpipe','tfc:ceramic_blowpipe'].map(leaf)),leaf('tfc:gem_saw'),leaf('capability:primitive_heat')];
  if(JSON.stringify(d.operations)===JSON.stringify(['tfc:blow','tfc:stretch','tfc:roll','tfc:saw']))return all([...apparatus,leaf('tfc:wool_cloth')]);
  assert.deepEqual(d.operations,['tfc:amethyst','tfc:basin_pour'],'unmodeled glass operation sequence');
  return all([...apparatus,leaf('tfc:powder/amethyst'),leaf('tfc:ceramic/bowl'),leaf('tfc:metal/block/brass')]);

 }
 if(type==='tfmg:distillation')return all(['tfmg:steel_distillation_controller','tfmg:steel_fluid_tank','tfmg:steel_distillation_output','capability:tfmg_tower_heat'].map(leaf));
 if(type==='tfmg:industrial_blasting'){if(recipeId===nativeFirstSteel.ids.reaction){reviewNativeFirstSteelRecipe(d,nativeFirstSteel);return leaf('capability:first_steel_furnace_service');}reviewNativeSiliconRecipe(d);return leaf('capability:tfmg_silicon_furnace');}
 if(type==='tfmg:hot_blast'){reviewNativeHotAirRecipe(d,nativeFirstHotAir);return leaf('capability:first_hot_air_service');}
 if(type==='tfmg:casting'){
  reviewCasting(d);if(recipeId===nativeFirstSteel.ids.casting)return leaf('capability:first_steel_casting_service');
  if(recipeId===nativeFoundryBronze.ids.casting){assert.deepEqual(d,nativeFoundryBronze.recipes[recipeId]);return leaf('capability:foundry_bronze_cold_casting');}
  return all(['tfmg:casting_basin','capability:tfmg_vat_fluid_handling','create:chute'].map(leaf));
 }
 if(type==='tfmg:vat_machine_recipe'){
  const v=reviewVatRecipe(d),ins=[any(v.vessels.map(leaf))];
  if(v.fluidInputs.length||v.fluidOutputs.length)ins.push(leaf('capability:tfmg_vat_fluid_handling'));
  if(v.itemInputs.length||v.itemOutputs.length)ins.push(leaf('create:chute'));
  if(v.heat)ins.push(leaf(v.heat===2?'capability:tfmg_native_heat2':'capability:tfmg_tower_heat'));
  if(v.mixing)ins.push(leaf('capability:tfmg_vat_mixing'));
  return all(ins);
 }
 if(type==='tfmg:coking'){
  if(recipeId===nativeGeologicalCoke.ids.coking){reviewNativeGeologicalCoking(d,nativeGeologicalCoke);return leaf('capability:first_geological_coking_service');}
  assert.equal(bootstrap.petroleumContract.processGasCoking.truth,'STATIC_CORE_OPTIONAL_SECOND_COKING_FLUID');
  const fluids=d.results.filter(r=>r.amount!==undefined);assert.equal(fluids.length,1,'Preserve the reviewed single process-gas stream');
  return all([...['tfmg:coke_oven','tfmg:cast_iron_pipe','tfmg:cast_iron_mechanical_pump','capability:kinetic_power'].map(leaf),any(['tfmg:cast_iron_fluid_tank','tfmg:steel_fluid_tank'].map(leaf))]);
 }
 if(type==='minecraft:smelting'||type==='minecraft:blasting'||type==='tfc:heating')return leaf('capability:primitive_heat');
 if(type==='tfc:advanced_shaped_crafting'||type==='tfc:advanced_shapeless_crafting'){
  assert(d.result?.id||d.result?.stack?.id,'unmodeled advanced crafting output');
  assert((d.result.modifiers??[]).every(m=>m.type==='tfc:copy_forging_bonus'||m.type==='tfc:copy_food'&&(d.result.id??d.result.stack.id).startsWith('tfc:food/')),'unmodeled advanced crafting output modifier');
  return leaf('capability:crafting');
 }
 if(type==='minecraft:crafting_shaped'||type==='minecraft:crafting_shapeless'||type==='minecraft:crafting_transmute')return leaf('capability:crafting');
 if(type==='minecraft:stonecutting'){if(recipeId===nativeFirstIgnition.ids.rebar){assert.deepEqual(d,nativeFirstIgnition.recipes[recipeId]);return all(['minecraft:stonecutter','capability:manual_rebar_stonecutter','capability:first_ignition_steel_allocation'].map(leaf));}return leaf('minecraft:stonecutter');}
 if(type==='tfc:casting')return leaf('capability:primitive_heat');
 if(type==='tfc:anvil'||type==='tfc:welding')return leaf('capability:tfc_anvil');
 throw new Error('unmodeled processor '+type);
}
function inputs(d){
 const type=d.type,ins=[];
 if(type==='createbigcannons:melting'){reviewFoundryBronzeMelting(d,nativeFoundryBronze);return all(d.ingredients.map(v=>ingredient(v)));}
 if(type==='rubberworks:sapping')return leaf('capability:natural_rubber_site');
 if(type==='rubberworks:compressing')return all(d.ingredients.map(v=>ingredient(v,'fluid')));
 if(type==='tfmg:hot_blast'){reviewNativeHotAirRecipe(d,nativeFirstHotAir);return all(d.ingredients.map(v=>ingredient(v,'fluid')));}
 if(type==='tfc:barrel_sealed'||type==='tfc:barrel_instant')return all([ingredient(d.input_item),ingredient(d.input_fluid,'fluid')]);
 if(type==='tfc:scraping')return ingredient(d.ingredient);
 if(type==='tfc:bloomery'){assert.deepEqual(d,nativeFirstWrought.recipes[nativeFirstWrought.ids.bloom]);return all(['tfcorewashing:briquet_hematite','tfcorewashing:pellet_hematite','minecraft:charcoal'].map(leaf));}
 if(type==='ae2:inscriber'){const r=reviewNativeInscriberRecipe(d);return all(Object.values(r.inputs).map(v=>ingredient(v)));}
 if(type==='create:sequenced_assembly'||type==='greate:sequenced_assembly'){
  const workpiece=d.transitional_item.id??d.transitional_item.item;
  const withoutWork=e=>e.id?e.id===workpiece?all([]):e:e.all?all(e.all.map(withoutWork)):any(e.any.map(withoutWork));
  return all([ingredient(d.ingredient),...d.sequence.map(step=>withoutWork(inputs(step)))]);
 }
 if(type==='tfc:advanced_shaped_crafting')return all(Object.values(d.key).map(v=>ingredient(v)));
 if(type==='tfc:advanced_shapeless_crafting')return all([...d.ingredients.map(v=>ingredient(v)),...(d.primary_ingredient?[ingredient(d.primary_ingredient)]:[])]);
 if(type==='railcraft:blasting'){reviewRailGradeSteelRecipe(d,nativeRailGradeSteel);return ingredient(d.ingredient);}
 if(type==='railcraft:rolling'){reviewNativeRollingRecipe(d);return all(Object.values(d.key).map(v=>ingredient(v)));}
 if(type==='minecraft:crafting_shaped'||type==='create:mechanical_crafting')return all(Object.values(d.key).map(v=>ingredient(v)));
 if(type==='minecraft:crafting_shapeless')return all(d.ingredients.map(v=>ingredient(v)));
 if(type==='minecraft:crafting_transmute')return all([ingredient(d.input),ingredient(d.material)]);
 if(type.startsWith('modern_industrialization:')){for(const v of [d.item_inputs??[]].flat())ins.push(ingredient(v));for(const v of [d.fluid_inputs??[]].flat())ins.push(ingredient(v,'fluid'));if(!ins.length)throw new Error('context-dependent MI extraction');return all(ins);}
 if(type.startsWith('create:')||type.startsWith('greate:'))return all((d.ingredients??[d.ingredient]).map(v=>ingredient(v)));
 if(type==='minecraft:smelting'||type==='minecraft:blasting'||type==='minecraft:stonecutting'||type==='tfc:heating'||type==='tfc:anvil')return ingredient(d.ingredient);
 if(type==='stellaris:rocket_station')return all(d.ingredients.map(v=>ingredient(v)));
 if(type==='stellaris:water_seperator')return ingredient(d.ingredient,'fluid');
 if(type==='railcraft:coking'||type==='tfc:loom'||type==='tfc:quern')return ingredient(d.ingredient);
 if(type==='tfc:knapping'){if(d.knapping_type==='tfc:rock'){assert([witchHerbs.knife.knap,nativeTfcLeather.recipes[nativeTfcLeather.ids.axeHead],nativeRailCircuits.recipes[nativeRailCircuits.ids.hammerHead]].some(x=>JSON.stringify(x)===JSON.stringify(d)));return all([ingredient(witchHerbs.knife.knappingType.input),ingredient(d.ingredient)]);}const input=knappingTypes[d.knapping_type?.slice(4)];if(!input)throw new Error('unmodeled knapping material');return ingredient(input);}
 if(type==='tfc:glassworking')return ingredient(d.batch);
 if(type==='tfmg:distillation')return all(d.ingredients.map(v=>ingredient(v,'fluid')));
 if(type==='tfmg:casting'){reviewCasting(d);return all(d.ingredients.map(v=>ingredient(v,'fluid')));}
 if(type==='tfmg:vat_machine_recipe'){const v=reviewVatRecipe(d);return all([...v.itemInputs.map(x=>ingredient(x)),...v.fluidInputs.map(x=>ingredient(x,'fluid'))]);}
 if(type==='tfmg:industrial_blasting'){if(JSON.stringify(d)===JSON.stringify(nativeFirstSteel.recipes[nativeFirstSteel.ids.reaction]))reviewNativeFirstSteelRecipe(d,nativeFirstSteel);else reviewNativeSiliconRecipe(d);return all(d.ingredients.map(v=>ingredient(v)));}
 if(type==='tfmg:coking')return all(d.ingredients.map(v=>ingredient(v)));
 if(type==='tfc:casting')return all([ingredient(d.mold),ingredient(d.fluid,'fluid')]);
 if(type==='tfc:welding')return all([ingredient(d.first_input),ingredient(d.second_input),leaf('tfc:powder/flux')]);
 throw new Error('unmodeled input '+type);
}
function addRule(id,outputs,requirements,meta={}){
 const r={id,outputs,requirements,...meta};recipes.push(r);for(const out of outputs){if(!producers.has(out))producers.set(out,[]);producers.get(out).push(r);}return r;
}
const normalizationWitnesses=[];
function add(id,original,kind){
 // Greate's configured HEAD hook removes this raw JSON ID before parsing.
 // The nativeFormingSetup contract below binds that exclusion to installed code.
 if(kind==='native'&&id==='create:crafting/kinetics/wrench')return;
 // Researchd's typed output is deliberately a captured inert builder; the
 // canonical ledger rules below model each pack identity independently.
 if(typeof original.result==='function'){assert(kind==='captured'&&id.startsWith('createch2:research/pack/'));return;}
 if(kind!=='captured'&&capturedOverrides.has(id))return;
 const normalized=replayRecipeEventEntry(id,original,kind,policy.modifications,removals);let d=normalized.data;
 if(id===nativeProcessingUnit.ids.emeraldPlate){assert.equal(kind,'native');assert.deepEqual(d,nativeProcessingUnit.emeraldProjection.original);d=nativeProcessingUnit.emeraldProjection.projected;}
 if(normalized.applied.length)normalizationWitnesses.push({id,applied:normalized.applied});
 if((d['neoforge:conditions']??[]).some(c=>c.type==='neoforge:false'))return;
 if(normalized.removed)return;
 // Narrow native Infuser admission: chemical conversion happens in its own
 // slot, and redstone energy is a distinct paid machine service.
 const mi=nativeMekInfuser.ids;
 if([mi.basic,mi.reinforced].includes(id)){
  assert.deepEqual(d,nativeMekInfuser.recipes[id][0]);
  const chemical=nativeMekInfuser.chemicalMembers[d.chemical_input.tag];assert.equal(chemical.length,1);
  addRule(id,[d.output.id],all([ingredient(d.item_input),leaf('chemical:'+chemical[0]),leaf('mekanism:metallurgic_infuser'),leaf(nativeMekInfuser.energyService),...(locks.get(id)??[]).map(leaf)]),{kind,type:d.type});return;
 }
 if([mi.redstone,mi.diamond,mi.energy].includes(id)){
  assert.deepEqual(d,nativeMekInfuser.recipes[id][0]);
  addRule(id,[id===mi.energy?nativeMekInfuser.energyService:'chemical:'+d.output.id],all([ingredient(d.input),leaf('mekanism:metallurgic_infuser'),...(locks.get(id)??[]).map(leaf)]),{kind:'reviewed_infuser_slot_conversion',type:d.type});return;
 }
 try{const effective=['create:crushing','greate:crushing'].includes(d.type)?{...d,results:nativeLowTierCrushingResults(d.results??[],d.recipe_tier??0)}:d;const outputs=recipeOutputRefs(effective).filter(r=>id!==nativeGeologicalCoke.ids.coking||refLabel(r)!=='fluid:tfmg:carbon_dioxide').map(r=>r.kind==='item'?canonicalItem(r.id):refLabel(r));if(d.type==='railcraft:coking'&&d.creosoteOutput>0)outputs.push('fluid:railcraft:creosote');if(id===nativeRailGradeSteel.ids.steel){reviewRailGradeSteelRecipe(d,nativeRailGradeSteel);outputs.push('railcraft:slag');}if(!outputs.length)return;
  if(id===nativePlainGlass.ids.table){assert.deepEqual(d,nativePlainGlass.recipes[id]);outputs.splice(0,outputs.length,'minecraft:glass_pane');}
  if(['rubberworks:sapping','rubberworks:compressing'].includes(d.type))assert([nativeNaturalRubber.ids.sapping,nativeNaturalRubber.ids.warm].includes(id)&&JSON.stringify(nativeNaturalRubber.recipes[id])===JSON.stringify(d),'Unreviewed Rubberworks processor');
  if(['tfc:barrel_sealed','tfc:barrel_instant','tfc:scraping'].includes(d.type))assert(Object.values(nativeTfcLeather.ids).includes(id)&&JSON.stringify(nativeTfcLeather.recipes[id])===JSON.stringify(d),'Unreviewed native leather processor');
  const req=all([inputs(d),machine(d.type,d,id),...([nativeEarlyCrushing.conversion.sourceId,nativeEarlyCrushing.quartzite.sourceId].includes(id)?[leaf('capability:early_crushing_service')]:[]),...(id===nativeEarlyCrushing.quartzMilling.sourceId?[leaf('capability:early_millstone_service')]:[]),...(id===nativeInscriber.siliconSupplierId?[leaf('capability:ae2_silicon_smelting')]:[]),...(id===nativeControllerLine.ids.aluminumShaft?[leaf('capability:steel_saw_service')]:[]),...(id===nativeControllerLine.ids.stainlessShaft?[leaf('capability:aluminum_saw_service')]:[]),...(id===nativeControllerLine.ids.assembly?[leaf('capability:controller_line_service')]:[]),...(id===nativeGeologicalCoke.ids.plate?[leaf('capability:first_coke_plate_press_service')]:[]),...(locks.get(id)??[]).map(leaf)]);
  if(id===nativeNaturalRubber.ids.steelShaft)req.all.push(leaf('capability:natural_rubber_direct_saw_service'),leaf('capability:first_steel_shaft_selection'));
  if(id===nativeFirstSteelShaft.ids.plate)req.all.push(leaf('capability:first_steel_plate_press_service'));
  if([nativeSteelMechanism.ids.mechanism,nativeSteelMechanism.ids.heavyPlate].includes(id))req.all.push(leaf('capability:steel_mechanism_line_service'));
  if(id===nativeSteelSteamBucket.ids.hardenedPlanks)req.all.push(leaf('capability:bucket_hardened_plank_service'));
  if(id===nativeSteelSteamBucket.ids.steelCasing)req.all.push(leaf('capability:bucket_manual_casing_recovery'));
  if(id===nativeNaturalRubber.ids.press)req.all.push(leaf('capability:natural_rubber_press_service'));
  for(const[key,service]of [['coking','oven'],['lubricant','steam_mixer'],['bridge','bridge_handling']])if(id===nativeStartupLubricant.ids[key])req.all.push(leaf('capability:startup_lubricant_'+service));
  if([nativeCopperHammer.ids.rod,nativeCopperHammer.ids.stamen,nativeCopperHammer.ids.rivet].includes(id))req.all.push(leaf('capability:copper_hammer_forging_service'));
  if([nativeFirstWrought.ids.sheet,nativeFirstWrought.ids.refine,nativeFirstWrought.ids.wrought].includes(id))req.all.push(leaf('capability:first_wrought_bronze_anvil_service'));
  if([nativeFirstWrought.ids.doubleIngot,nativeFirstWrought.ids.doubleSheet].includes(id))req.all.push(leaf('capability:copper_hammer_forging_service'));
  addRule(id,outputs,req,{kind,type:d.type});
  if(d.type==='tfmg:vat_machine_recipe')vatAdmissions.push({id,kind,...reviewVatRecipe(d)});
  if(d.type==='tfmg:casting')castingAdmissions.push({id,kind,...reviewCasting(d)});
  if(d.type==='ae2:inscriber')inscriberAdmissions.push({id,kind,...reviewNativeInscriberRecipe(d)});
 }catch(error){const key=d.type??'<missing>';if(!unsupported.has(key))unsupported.set(key,[]);unsupported.get(key).push({id,reason:error.message});}
}
const authored=new Map();for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);authored.set(m[1]+':'+m[2],read(f));}
const nativePlainGlass=nativeClearGlass({root:liveRoot,native,authored,policy,removals,tags,locks});
const nativeProcessingUnit=nativeProcessingUnitContract({root:liveRoot,native,authored,policy,removals,tags,world});
const nativeStarlight=nativeStarlightSuppliers({root:liveRoot,native,policy,removals,world});
const nativeSuperconductor=nativeSuperconductorInputs({root:liveRoot,native,authored,policy,removals,tags,world,locks,power:powerContract});
const nativeMekInfuser=nativeMekInfuserContract({root:liveRoot,native,authored,policy,removals,tags,locks});
const nativeLubricationBucket=nativeLubricationBucketContract({root:liveRoot,native,authored,policy,removals,tags,fluidMembers,controller:nativeControllerLine,bootstrap});
const nativeTfcLeather=nativeTfcLeatherContract({root:liveRoot,native,policy,removals,tags,world});
const nativeNaturalRubber=nativeNaturalRubberContract({root:liveRoot,native,authored,policy,removals,world,controller:nativeControllerLine,early:nativeEarlyCrushing,rotary:nativeVat.drive.rotarySource,leather:nativeTfcLeather,tags});
const nativeStartupLubricant=nativeStartupLubricantContract({root:liveRoot,native,authored,policy,removals,tags,fluidMembers,powerContract,heated:nativeHeatedMixing,early:nativeEarlyCrushing,rubber:nativeNaturalRubber});
const tfcStartupHardware=tfcStartupHardwareContract({native,authored,policy,removals,tags,world,leather:nativeTfcLeather});
const nativeFirstAir=nativeFirstAirContract({root:liveRoot,authored,policy,removals,hardware:tfcStartupHardware,rubber:nativeNaturalRubber,rotary:nativeVat.drive.rotarySource,fluidMembers});
const nativeFirstHotAir=nativeFirstHotAirContract({root:liveRoot,native,authored,policy,removals,air:nativeFirstAir,hardware:tfcStartupHardware,startup:nativeStartupLubricant,rubber:nativeNaturalRubber,controller:nativeControllerLine,fuel:bootstrap.petroleumContract.hotBlastFuel});
const nativeGeologicalCoke=nativeGeologicalCokeContract({root:liveRoot,native,authored,policy,removals,tags,fluidMembers,air:nativeFirstAir,hotAir:nativeFirstHotAir,early:nativeEarlyCrushing,hardware:tfcStartupHardware,startup:nativeStartupLubricant,petroleum:bootstrap.petroleumContract,rubber:nativeNaturalRubber,controller:nativeControllerLine});
const nativeFirstSteel=nativeFirstSteelContract({root:liveRoot,native,authored,policy,removals,tags,fluidMembers,silicon:nativeSiliconFurnace,hotAir:nativeFirstHotAir,coke:nativeGeologicalCoke,casting:castingContract});
const nativeFirstSteelShaft=nativeFirstSteelShaftContract({root:liveRoot,native,authored,policy,removals,tags,steel:nativeFirstSteel,coke:nativeGeologicalCoke,rubber:nativeNaturalRubber,early:nativeEarlyCrushing,controller:nativeControllerLine});
const nativeFoundryBronze=nativeFoundryBronzeContract({root:liveRoot,native,authored,policy,removals,tags,fluidMembers,casting:castingContract,steel:nativeFirstSteel,heated:nativeHeatedMixing});
const nativeFirstIgnition=nativeFirstIgnitionContract({root:liveRoot,native,authored,policy,removals,tags,steel:nativeFirstSteel,shaft:nativeFirstSteelShaft,hotAir:nativeFirstHotAir,coke:nativeGeologicalCoke,hardware:tfcStartupHardware});
const nativeSteelSteamBucket=nativeSteelSteamBucketContract({root:liveRoot,native,authored,policy,removals,tags,fluidMembers,ignition:nativeFirstIgnition,steel:nativeFirstSteel,shaft:nativeFirstSteelShaft,hotAir:nativeFirstHotAir,coke:nativeGeologicalCoke,startup:nativeStartupLubricant,bucket:nativeLubricationBucket,steam:nativeSteam,power:powerContract});
const nativeManualRolling=nativeManualRollingContract({root:liveRoot,native,authored,policy,removals});
const nativeRailGradeSteel=nativeRailGradeSteelContract({root:liveRoot,native,authored,policy,removals,startup:nativeStartupLubricant,steelSteam:nativeSteelSteamBucket,steel:nativeFirstSteel,nativeSteam});
const nativeRailStock=nativeRailStockContract({root:liveRoot,native,authored,policy,removals,tags,grade:nativeRailGradeSteel,steelSteam:nativeSteelSteamBucket,steel:nativeFirstSteel,ignition:nativeFirstIgnition,hotAir:nativeFirstHotAir,rubber:nativeNaturalRubber,shaft:nativeFirstSteelShaft,manual:nativeManualRolling,wrought:nativeFirstWrought});
const nativeRailFeedstocks=nativeRailFeedstockContract({root:liveRoot,native,authored,policy,removals,tags,world,stock:nativeRailStock,steelSteam:nativeSteelSteamBucket,power:powerContract,leather:nativeTfcLeather,steam:nativeSteam});
const nativeForgeBindings=nativeCharcoalForgeBindings({root:liveRoot});
const nativeRailGold=nativeRailGoldContract({root:liveRoot,native,policy,removals,tags,world,leather:nativeTfcLeather,feedstocks:nativeRailFeedstocks,stock:nativeRailStock,grade:nativeRailGradeSteel,forgeBindings:nativeForgeBindings});
const nativeRailDetectors=nativeRailDetectorContract({root:liveRoot,native,authored,policy,removals,tags,world,hammer:nativeCopperHammer,feedstocks:nativeRailFeedstocks});
const nativeRailCircuits=nativeRailCircuitContract({root:liveRoot,native,authored,policy,removals,tags,world,feedstocks:nativeRailFeedstocks,gold:nativeRailGold,detectors:nativeRailDetectors});
const nativeRailTerminals=nativeRailTerminalContract({root:liveRoot,native,authored,policy,removals,tags,stock:nativeRailStock,circuits:nativeRailCircuits,wrought:nativeFirstWrought,iron:nativeIndustrialIron,shaft:nativeFirstSteelShaft,steel:nativeFirstSteel});
const nativeSteelMechanism=nativeSteelMechanismContract({root:liveRoot,native,authored,policy,removals,tags,controller:nativeControllerLine,rotary:nativeVat.drive.rotarySource});
const nativeMechanismSteelStock=nativeMechanismSteelStockContract({root:liveRoot,native,authored,policy,removals,tags,terminal:nativeRailTerminals,shaft:nativeFirstSteelShaft,mechanism:nativeSteelMechanism,iron:nativeIndustrialIron,wrought:nativeFirstWrought,hotAir:nativeFirstHotAir,bucket:nativeSteelSteamBucket,circuits:nativeRailCircuits,stock:nativeRailStock});
const nativeMechanismLead=nativeMechanismLeadContract({root:liveRoot,native,authored,policy,removals,tags,world,early:nativeEarlyCrushing,rotary:nativeVat.drive.rotarySource,steelStock:nativeMechanismSteelStock,mechanism:nativeSteelMechanism,inscriber:nativeInscriber});
const quartzMilling=nativeEarlyCrushing.quartzMilling,expectedMilling=structuredClone(quartzMilling.before);expectedMilling.results=expectedMilling.results.map(v=>{const {item,...rest}=v;return {id:item,...rest};});expectedMilling.processing_time=expectedMilling.processingTime;delete expectedMilling.processingTime;assert.deepEqual(quartzMilling.source,expectedMilling);assert.deepEqual(authored.get(quartzMilling.sourceId),quartzMilling.source);
const vatCrackingId='createch2:heavy_industry/tfmg/naphtha_cast_iron_vat',vatCracking=authored.get(vatCrackingId);
assert(vatCracking);reviewVatRecipe(vatCracking);
const ambient=authored.get('chemica:vat_machine_recipe/vat_reaction/etched_pvc_circuit_board');
assert.equal(reviewVatRecipe(ambient).heat,0);assert.equal(reviewVatRecipe(ambient).mixing,false);
const codecDefaults={type:'tfmg:vat_machine_recipe',ingredients:[{item:'chemica:coated_pvc_circuit_board'}],results:[{id:'chemica:etched_pvc_circuit_board'}]};
assert.deepEqual(reviewVatRecipe(codecDefaults).vessels,Object.values(vatItems));
const vatSchemaChecks={truth:'STRICT_BOUNDED_VAT_ADMISSION',negativeCases:[]};
for(const [name,change]of [
 ['legacy_minSize',d=>{d.minSize=1;}],['legacy_heat_requirement',d=>{d.heat_requirement='heated';}],
 ['positive_pressure',d=>{d.pressure=1;}],['vacuum',d=>{d.pressure=-1;}],
 ['cooling',d=>{d.heat_level=-1;}],['higher_heat',d=>{d.heat_level=2;}],['larger_vat',d=>{d.min_size=2;}],
 ['electrode',d=>{d.machines=['tfmg:electrode'];}],['two_mixers',d=>{d.machines=['tfmg:mixing','tfmg:mixing'];}],
 ['unknown_vessel',d=>{d.allowed_vat_types=['tfmg:steel_vat'];}],
 ['conditional_recipe',d=>{d['neoforge:conditions']=[{type:'neoforge:mod_loaded',modid:'absent'}];}],
 ['component_input',d=>{d.ingredients.push({type:'neoforge:components',items:'chemica:coated_pvc_circuit_board',components:{}});}],
 ['zero_fluid',d=>{d.ingredients[0].amount=0;}],
 ['duplicate_fluid_overflow',d=>{d.ingredients=[{type:'neoforge:single',amount:2500,fluid:'tfmg:naphtha'},{type:'neoforge:single',amount:2500,fluid:'tfmg:naphtha'}];}],
 ['output_overflow',d=>{d.results[0].amount=4001;}],
 ['five_fluid_inputs',d=>{d.ingredients=Array.from({length:5},()=>({type:'neoforge:single',amount:100,fluid:'tfmg:naphtha'}));}],
 ['five_item_outputs',d=>{d.results=Array.from({length:5},()=>({id:'chemica:etched_pvc_circuit_board'}));}],
 ['output_components',d=>{d.results=[{id:'chemica:etched_pvc_circuit_board',components:{}}];}],
 ['zero_chance',d=>{d.results=[{id:'chemica:etched_pvc_circuit_board',chance:0}];}]
]){const d=structuredClone(vatCracking);change(d);assert.throws(()=>reviewVatRecipe(d),'Vat schema bypass: '+name);vatSchemaChecks.negativeCases.push({name,rejected:true});}
for(const [id,d]of authored)add(id,d,'authored');
const ambiguousNative=[],conservativeOverlays=[];
for(const [id,vs]of Object.entries(native.recipes))if(!authored.has(id)&&!capturedOverrides.has(id)){
 // Vanilla and its NeoForge base overrides precede ordinary mod resources.
 // A mod's false-condition stub replaces
 // that recipe; it is not an additional producer alongside the vanilla copy.
 const platform='neoforge-21.1.256-universal.jar',modRows=vs.filter(v=>!['1.21.1.jar',platform].includes(v.provider)),loaderRows=vs.filter(v=>v.provider===platform),rows=modRows.length?modRows:loaderRows.length?loaderRows:vs;
 const unique=[...new Map(rows.map(r=>[JSON.stringify(r.data),r])).values()];
 if(unique.length!==1){
  if(id===nativeMekInfuser.ids.infused){
   assert.deepEqual(rows.map(r=>r.provider),nativeMekInfuser.providers[id]);
   const ds=rows.map(r=>replayRecipeEventEntry(id,r.data,'native',policy.modifications,removals));assert(ds.every(d=>!d.removed));assert.deepEqual(ds.map(d=>d.data),nativeMekInfuser.recipes[id]);
   addRule(id,['mekanism:alloy_infused'],all([...ds.map(d=>ingredient(d.data.item_input)),leaf('chemical:mekanism:redstone'),leaf('mekanism:metallurgic_infuser'),leaf(nativeMekInfuser.energyService),...(locks.get(id)??[]).map(leaf)]),{kind:'conservative_native_overlay',providers:rows.map(r=>r.provider),type:'mekanism:metallurgic_infusing'});
   conservativeOverlays.push({id,providers:rows.map(r=>r.provider),rule:'All candidate input requirements; same exact output; selected native Infuser and separate chemical/energy services.'});continue;
  }
  // These reviewed tools have competing native resource overlays. Requiring
  // every candidate's inputs proves feasibility without guessing load order.
  if(['tfc:crafting/metal/chisel/copper','tfc:crafting/metal/pickaxe/copper','tfc:crafting/metal/pickaxe/bronze','tfc:crafting/metal/scythe/bronze',nativeCopperHammer.ids.craft].includes(id)){
   assert.deepEqual(new Set(rows.map(r=>r.provider)),new Set([tfcJar,'tfc_metal_tools-1.21.1-neoforge-1.0.7.jar']));
   assert(rows.every(r=>r.data.type==='tfc:advanced_shaped_crafting'&&!r.data['neoforge:conditions']));
   assert(rows.every(r=>!removals.some(match=>match(id,r.data)===true)),'Reviewed native tool overlay is retired: '+id);
   const outputs=recipeOutputRefs(rows[0].data).map(r=>r.id);
   for(const r of rows)assert.deepEqual(recipeOutputRefs(r.data).map(r=>r.id),outputs);
   addRule(id,outputs,all(rows.flatMap(r=>[inputs(r.data),machine(r.data.type,r.data,id),...(locks.get(id)??[]).map(leaf)])),{kind:'conservative_native_overlay',providers:rows.map(r=>r.provider)});
   conservativeOverlays.push({id,providers:rows.map(r=>r.provider),rule:'All candidate input requirements; same exact output.'});continue;
  }
  ambiguousNative.push({id,providers:rows.map(r=>r.provider)});continue;
 }
 add(id,unique[0].data,'native');
}
trace('native and authored recipes modeled');
for(const e of policy.additions){let d=e.custom;if(!d&&e.kind==='shaped')d={type:'minecraft:crafting_shaped',result:countFree(e.args[0]),pattern:e.args[1],key:e.args[2]};if(!d&&e.kind==='shapeless')d={type:'minecraft:crafting_shapeless',result:countFree(e.args[0]),ingredients:e.args[1]};if(d)add(e.id,d,'captured');}
for(const n of ledger.nodes)addRule('research:'+n.id,['research:'+n.id],all([...n.parents.map(id=>leaf('research:'+id)),...(n.cost.packs??[]).map(p=>leaf('pack:'+(p.includes(':')?p:'createch2:'+p))),...(n.cost.item?[leaf(n.cost.item)]:[]),leaf('researchd:research_lab')]),{kind:'research'});
for(const r of ledger.pack_routes){try{addRule(r.id,['pack:'+r.pack],all([inputs(r.recipe),machine(r.recipe.type,r.recipe),leaf('research:'+r.unlock_node)]),{kind:'pack',type:r.recipe.type});}catch(error){throw new Error(r.id+': '+error.message);}}
// The frontier is inherited explicitly from the reviewed terrestrial bootstrap.
// No absent producer, loot-table name, or research pack is promoted to free stock.
const packIds=new Set(ledger.packs.map(p=>p.id)),nodeIds=new Set(ledger.nodes.map(n=>n.id));
const frontier=new Map(read(path.join(state,'bootstrap-validation.json')).modes[0].earlierFactoryInputs.filter(id=>!packIds.has(id)&&!nodeIds.has(id)).map(id=>[id,{kind:'reviewed_earlier_factory_frontier',evidence:'bootstrap-validation.json'}]));
const labValidation=read(path.join(state,'bootstrap-validation.json')).laboratoryModes[0];
assert(labValidation.reached);
for(const id of [...labValidation.rawInputs,...labValidation.supplies])frontier.set(id,{kind:'composed_copper_laboratory_proof',evidence:'bootstrap-validation.json laboratoryModes',scope:'Installed native suppliers expanded from the explicit terrestrial/Copper workshop frontier.'});
const survival=world.survivalSources;assert.equal(survival?.truth,'STATIC_TFC_WOOL_AND_PANNING_SOURCES');
const leatherWorld=nativeTfcLeather.world;
addRule('native:first_air_drive',['capability:first_air_drive'],all(['create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:large_andesite_alloy_cogwheel','fluid:minecraft:water'].map(leaf)),{kind:'native_isolated_8_to_64rpm_intake_drive',evidence:nativeFirstAir.drive,limit:nativeFirstAir.limits[0]});
addRule('native:first_air',['fluid:tfmg:air'],all(['tfmg:air_intake','capability:first_air_drive'].map(leaf)),{kind:'native_selected_diameter1_air_intake',evidence:nativeFirstAir.quantityPlan,limit:nativeFirstAir.limits});
addRule('native:first_hot_air_service',['capability:first_hot_air_service'],all(['tfmg:blast_stove','modern_industrialization:fluid_pipe','create:fluid_tank'].map(leaf)),{kind:'native_four_block_stove_and_separate_output_banks',evidence:nativeFirstHotAir,limit:nativeFirstHotAir.limits});
addRule('native:first_hot_air_precharge',['capability:first_hot_air_precharge'],all(['capability:first_hot_air_service','capability:first_air_drive','fluid:tfmg:hot_air','fluid:tfmg:carbon_dioxide','fluid:railcraft:creosote'].map(leaf)),{kind:'native_conditional_55l_hot_air_and_co2_precharge',evidence:nativeFirstHotAir.quantityPlan,limit:nativeFirstHotAir.limits});
addRule('native:first_geological_coking_service',['capability:first_geological_coking_service'],all(['tfmg:coke_oven','tfmg:exhaust','create:chute','modern_industrialization:fluid_pipe','tfc:rock/raw/quartzite'].map(leaf)),{kind:'native_single_coke_oven_and_co2_exhaust',evidence:nativeGeologicalCoke,limit:nativeGeologicalCoke.limits});
addRule('native:first_coke_plate_press_service',['capability:first_coke_plate_press_service'],all(['create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_mechanical_press','create:depot','fluid:minecraft:water'].map(leaf)),{kind:'native_dedicated_8rpm_8su_andesite_plate_press',evidence:nativeGeologicalCoke.scene.plateStation,limit:nativeGeologicalCoke.limits[4]});
addRule('native:first_steel_furnace_service',['capability:first_steel_furnace_service'],all(['tfmg:blast_furnace_output','tfmg:blast_furnace_hatch','tfmg:fireproof_bricks','tfmg:fireproof_brick_reinforcement','modern_industrialization:fluid_pipe','create:fluid_tank','create:chute','tfmg:coal_coke_dust','fluid:tfmg:hot_air','capability:first_hot_air_precharge'].map(leaf)),{kind:'native_finite_first_steel_furnace',evidence:nativeFirstSteel,limit:nativeFirstSteel.limits});
addRule('native:first_steel_casting_service',['capability:first_steel_casting_service'],all(['tfmg:casting_basin','modern_industrialization:fluid_pipe','create:chute','capability:first_steel_furnace_service'].map(leaf)),{kind:'native_isolated_steel_casting_and_chute',evidence:nativeFirstSteel.castingPlan,limit:nativeFirstSteel.limits});
addRule('native:first_steel_plate_press_service',['capability:first_steel_plate_press_service'],all(['create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_mechanical_press','create:depot','fluid:minecraft:water'].map(leaf)),{kind:'native_first_steel_tier0_plate_press',evidence:nativeFirstSteelShaft,limit:nativeFirstSteelShaft.limits});
addRule('native:first_steel_shaft_selection',['capability:first_steel_shaft_selection'],all(['create:attribute_filter','greate:andesite_alloy_shaft'].map(leaf)),{kind:'native_added_by_greate_saw_output_filter',evidence:nativeFirstSteelShaft.outputFilter,limit:nativeFirstSteelShaft.limits});
addRule('native:foundry_bronze_melting',['capability:foundry_bronze_melting'],all(['createbigcannons:basin_foundry_lid','create:basin','capability:heated_burner'].map(leaf)),{kind:'native_cbc_lid_heated_basin',evidence:nativeFoundryBronze,limit:nativeFoundryBronze.limits});
addRule('native:foundry_bronze_cold_casting',['capability:foundry_bronze_cold_casting'],all(['capability:foundry_bronze_melting','tfmg:casting_basin','modern_industrialization:fluid_pipe','create:chute'].map(leaf)),{kind:'native_separate_cbc_bronze_90mb_casting',evidence:nativeFoundryBronze,limit:nativeFoundryBronze.limits});
addRule('native:rail_grade_furnace',['capability:rail_grade_furnace'],all(['railcraft:blast_furnace_bricks','minecraft:charcoal','capability:crafting','capability:primitive_heat'].map(leaf)),{kind:'native_34brick_air_core_rail_furnace_fuel_and_two_outputs',evidence:nativeRailGradeSteel,limit:nativeRailGradeSteel.limits});
addRule('native:rail_grade_fresh_steel',['capability:rail_grade_fresh_steel'],all(['capability:steam_bucket_steel_allocation','tfmg:steel_ingot','modern_industrialization:iron_dust','tfc:powder/flux','fluid:tfmg:hot_air','fluid:railcraft:creosote','tfmg:exhaust','capability:first_steel_furnace_service','capability:first_steel_casting_service'].map(leaf)),{kind:'native_eleven_steel_runs_separate_rail_ingot_allocation',evidence:nativeRailGradeSteel.steelAllocation,limit:nativeRailGradeSteel.limits});
addRule('native:manual_rolling_service',['capability:manual_rolling_service'],all(['railcraft:manual_rolling_machine','capability:crafting'].map(leaf)),{kind:'native_manual_rolling_pattern_preview_and_separate_output',evidence:nativeManualRolling,limit:nativeManualRolling.limits});
addRule('world:rail_controller_cinnabar',['tfc:ore/cinnabar'],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'native_tfc_gneiss_normal_cinnabar_mining',evidence:nativeRailCircuits.world.selectedVein,limit:nativeRailCircuits.limits});
addRule('world:rail_controller_isolated_granite',['tfc:rock/raw/granite'],leaf('capability:terrestrial_prospecting'),{kind:'native_six_empty_collision_faces_queued_isolated_raw_granite',evidence:nativeRailCircuits.world,limit:nativeRailCircuits.limits});
for(const row of nativeRailCircuits.world.washing){const key=row.deposit.includes('rocky_chunk')?'rocky_chunk':'dirty_dust';addRule('native:rail_circuit_sluice/'+key,[row.output],all([row.input,'capability:first_wrought_sluice_service'].map(leaf)),{kind:'native_guaranteed_cinnabar_deposit_primary',evidence:row,limit:nativeRailCircuits.limits});}
addRule('native:rail_circuit_stick_feature',['capability:rail_circuit_stick_feature'],leaf('capability:crafting'),{kind:'native_enabled_quark_utility_recipe_config_flag',evidence:nativeRailCircuits.world.quarkStickFlags,limit:nativeRailCircuits.limits});
addRule('native:rail_terminal_steel_allocation',['capability:rail_terminal_steel_allocation'],all(['capability:rail_stock_steel_allocation','capability:rail_stock_slag_storage','capability:rail_circuit_hammer_batch','capability:rail_circuit_handstone_batch','tfmg:steel_ingot','tfc:ore/normal_hematite','tfc:powder/flux','tfmg:coal_coke_dust','fluid:tfmg:hot_air','fluid:railcraft:creosote','fluid:modern_industrialization:steam','modern_industrialization:bronze_macerator','tfc:wood/log/oak'].map(leaf)),{kind:'native_five_additional_steel_batches_and_paid_terminal_stock',evidence:nativeRailTerminals.plan,limit:nativeRailTerminals.limits});
addRule('native:steel_mechanism_line_service',['capability:steel_mechanism_line_service'],all([...Object.keys(nativeSteelMechanism.hardware),'capability:crafting'].map(leaf)),{kind:'native_weighted_steel_mechanism_physical_forming_service',evidence:{power:nativeSteelMechanism.power,hardware:nativeSteelMechanism.hardware},limit:nativeSteelMechanism.limits});
addRule('world:rail_detector_granite',['tfc:rock/loose/granite'],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'native_ordinary_player_granite_loot_minimum_one',evidence:nativeRailDetectors.world,limit:nativeRailDetectors.limits});
addRule('native:rail_detector_full_wood',['tfc:wood/stripped_wood/oak'],all(['tfc:wood/wood/oak','tfc:stone/axe/sedimentary','capability:crafting'].map(leaf)),{kind:'native_placed_full_wood_axe_strip_and_nonhammer_recovery',evidence:nativeRailDetectors,limit:nativeRailDetectors.limits});
addRule('native:rail_detector_anvil_service',['capability:rail_detector_anvil_service'],all(['tfc:metal/anvil/copper',nativeRailDetectors.stoneHammer,'capability:primitive_heat','capability:crafting'].map(leaf)),{kind:'native_tier1_anvil_real_stone_hammer_and_workable_heat',evidence:nativeRailDetectors,limit:nativeRailDetectors.limits});
addRule('world:rail_controller_gold',['tfc:ore/normal_native_gold'],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'native_tfc_granite_normal_gold_mining',evidence:nativeRailGold.world.vein,limit:nativeRailGold.world.limits});
for(const row of nativeRailGold.world.washing){const key=row.deposit.includes('rocky_chunk')?'rocky_chunk':'dirty_dust';addRule('native:rail_gold_sluice/'+key,[row.output],all([row.input,'capability:first_wrought_sluice_service'].map(leaf)),{kind:'native_guaranteed_gold_deposit_primary',evidence:row,limit:nativeRailGold.limits});}
addRule('native:rail_gold_forge_construction',['capability:rail_gold_sheltered_forge'],all(['minecraft:charcoal','tfc:rock/raw/granite','railcraft:blast_furnace_bricks','tfc:firestarter','capability:rail_stock_slag_storage'].map(leaf)),{kind:'native_earlier_pile_forge_spare_brick_rain_roof',evidence:nativeRailGold.plan,limit:nativeRailGold.limits});
addRule('native:rail_gold_casting_service',['capability:rail_gold_casting_service'],all(['capability:rail_gold_sheltered_forge','tfc:ceramic/ingot_mold','minecraft:clay_ball','tfc:straw','tfc:wood/log/oak','tfc:firestarter','capability:primitive_heat'].map(leaf)),{kind:'native_sheltered_forge_direct_cold_molds',evidence:nativeRailGold,limit:nativeRailGold.limits});
addRule('native:rail_feedstock_textile_service',['capability:rail_feedstock_textile_service'],all(['tfc:wood/loom/oak','tfc:spindle','capability:crafting'].map(leaf)),{kind:'native_manual_loom_input_steps_and_real_output',evidence:nativeRailFeedstocks,limit:nativeRailFeedstocks.limits});
addRule('native:rail_feedstock_mixer_service',['capability:rail_feedstock_mixer_service'],all(['modern_industrialization:bronze_mixer','modern_industrialization:bronze_boiler','modern_industrialization:fluid_pipe','fluid:modern_industrialization:steam','fluid:minecraft:water','minecraft:charcoal','capability:steam_service','capability:rail_stock_minecart_service'].map(leaf)),{kind:'native_additional_2000mb_precharge_200mb_wool_mixing',evidence:nativeRailFeedstocks,limit:nativeRailFeedstocks.limits});
addRule('native:rail_stock_slag_storage',['capability:rail_stock_slag_storage'],all(['tfmg:blast_furnace_output','modern_industrialization:fluid_pipe','create:fluid_tank','capability:first_steel_casting_service'].map(leaf)),{kind:'native_isolated_typed_slag_extraction_to_additional_8l_tank',evidence:nativeRailStock.plan,limit:nativeRailStock.limits});
addRule('native:rail_stock_steel_allocation',['capability:rail_stock_steel_allocation'],all(['capability:rail_grade_fresh_steel','capability:rail_stock_slag_storage','tfmg:steel_ingot','tfmg:coal_coke_dust','modern_industrialization:iron_dust','tfc:powder/flux','fluid:tfmg:hot_air','fluid:railcraft:creosote','tfmg:exhaust'].map(leaf)),{kind:'native_forty_steel_staged_fuel_and_retained_slag_packet',evidence:nativeRailStock.quantityPlan,limit:nativeRailStock.limits});
addRule('native:rail_stock_minecart_service',['capability:rail_stock_minecart_service'],all(['capability:steam_bucket_processing','capability:rail_stock_steel_allocation','modern_industrialization:steel_packer','modern_industrialization:bronze_boiler','modern_industrialization:fluid_pipe','fluid:modern_industrialization:steam','capability:steam_service'].map(leaf)),{kind:'native_200mb_steam_minecart_packing_from_bucket_line_residue',evidence:nativeRailStock.packet,limit:nativeRailStock.limits});
addRule('native:manual_rebar_stonecutter',['capability:manual_rebar_stonecutter'],all(['minecraft:stonecutter','capability:crafting'].map(leaf)),{kind:'native_manually_selected_rebar_recipe',evidence:nativeFirstIgnition,limit:nativeFirstIgnition.limits});
addRule('native:first_ignition_steel_allocation',['capability:first_ignition_steel_allocation'],all(['tfmg:steel_ingot','capability:first_steel_furnace_service','capability:first_steel_casting_service','capability:first_hot_air_precharge','capability:first_geological_coking_service','modern_industrialization:iron_dust','tfc:powder/flux','tfmg:coal_coke_dust','fluid:tfmg:hot_air','fluid:tfmg:furnace_gas','fluid:tfmg:carbon_dioxide','modern_industrialization:fluid_pipe','create:fluid_tank'].map(leaf)),{kind:'native_two_staged_steel_batches_with_retained_gas_and_fuel_timer',evidence:nativeFirstIgnition,limit:nativeFirstIgnition.limits});
addRule('native:bucket_hardened_plank_service',['capability:bucket_hardened_plank_service'],all(['create:spout','create:depot','modern_industrialization:fluid_pipe','fluid:railcraft:creosote'].map(leaf)),{kind:'native_selected_250mb_creosote_spout',evidence:nativeSteelSteamBucket,limit:nativeSteelSteamBucket.limits});
addRule('native:bucket_manual_casing_recovery',['capability:bucket_manual_casing_recovery'],all(['capability:crafting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'native_manual_steel_casing_and_self_drop_recovery',evidence:nativeSteelSteamBucket.casingRecovery,limit:nativeSteelSteamBucket.limits});
addRule('native:steam_bucket_steel_allocation',['capability:steam_bucket_steel_allocation'],all(['capability:first_ignition_steel_allocation','capability:first_steel_furnace_service','capability:first_steel_casting_service','tfmg:steel_ingot','modern_industrialization:iron_dust','tfc:powder/flux','tfmg:coal_coke_dust','fluid:tfmg:hot_air','fluid:railcraft:creosote','tfmg:exhaust','modern_industrialization:fluid_pipe','create:fluid_tank'].map(leaf)),{kind:'native_eight_additional_steel_runs_with_explicit_gas_loss_and_co2_exhaust',evidence:nativeSteelSteamBucket.plan,limit:nativeSteelSteamBucket.limits});
addRule('native:steam_bucket_processing',['capability:steam_bucket_processing'],all(['modern_industrialization:bronze_compressor','modern_industrialization:steel_packer','modern_industrialization:bronze_boiler','modern_industrialization:fluid_pipe','fluid:modern_industrialization:steam','fluid:minecraft:water','minecraft:charcoal','capability:steam_service'].map(leaf)),{kind:'native_finite_1400mb_steam_compression_and_packing',evidence:nativeSteelSteamBucket,limit:nativeSteelSteamBucket.limits});
for(const[service,inputs]of Object.entries({oven:['railcraft:coke_oven_bricks','modern_industrialization:fluid_pipe'],steam_mixer:['modern_industrialization:bronze_mixer','capability:steam_service','modern_industrialization:fluid_pipe'],bridge_drive:['create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:andesite_alloy_gearbox','fluid:minecraft:water'],bridge_handling:['greate:andesite_alloy_mechanical_mixer','create:basin','capability:startup_lubricant_bridge_drive','modern_industrialization:fluid_pipe','create:fluid_tank']}))addRule('native:startup_lubricant_'+service,['capability:startup_lubricant_'+service],all(inputs.map(leaf)),{kind:'native_selected_startup_lubricant_'+service,evidence:nativeStartupLubricant.quantityPlan,limit:nativeStartupLubricant.limits});
addRule('world:natural_rubber_site',['capability:natural_rubber_site'],leaf('capability:terrestrial_prospecting'),{kind:'declared_standing_gtceu_rubber_tree_site',evidence:nativeNaturalRubber.world,limit:nativeNaturalRubber.limits[1]});
addRule('native:natural_rubber_direct_saw_service',['capability:natural_rubber_direct_saw_service'],all(['create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_mechanical_saw','fluid:minecraft:water'].map(leaf)),{kind:'native_isolated_8su_steel_shaft_saw',evidence:nativeNaturalRubber.drive.phase0,limit:nativeNaturalRubber.limits[2]});
addRule('native:natural_rubber_reduced_drive',['capability:natural_rubber_reduced_drive'],all(['create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:large_andesite_alloy_cogwheel','greate:andesite_alloy_gearbox','fluid:minecraft:water'].map(leaf)),{kind:'native_serial_8su_rubber_drive',evidence:nativeNaturalRubber.drive,limit:nativeNaturalRubber.limits[3]});
addRule('native:natural_rubber_sapping_service',['capability:natural_rubber_sapping_service'],all(['rubberworks:sapper','capability:natural_rubber_site','capability:natural_rubber_reduced_drive','create:fluid_tank','modern_industrialization:fluid_pipe'].map(leaf)),{kind:'native_selected_gt_sapping_service',evidence:nativeNaturalRubber.quantityPlan.sapping,limit:nativeNaturalRubber.limits[4]});
addRule('native:natural_rubber_passive_fire',['capability:natural_rubber_passive_fire'],all(['tfc:firestarter',leatherWorld.oak.log,'capability:terrestrial_prospecting'].map(leaf)),{kind:'native_tfc_ordinary_fire_for_smouldering_heat',limit:nativeNaturalRubber.limits[5]});
addRule('native:natural_rubber_warm_compression_service',['capability:natural_rubber_warm_compression_service'],all(['rubberworks:compressor','create:fluid_tank','capability:natural_rubber_reduced_drive','capability:natural_rubber_passive_fire','modern_industrialization:fluid_pipe','create:depot'].map(leaf)),{kind:'native_warm_rubber_compressor_and_collector',evidence:nativeNaturalRubber.drive.phase2,limit:nativeNaturalRubber.limits[6]});
addRule('native:natural_rubber_press_service',['capability:natural_rubber_press_service'],all(['greate:andesite_alloy_mechanical_press','capability:natural_rubber_reduced_drive','create:depot'].map(leaf)),{kind:'native_tier0_rubber_sheet_press',evidence:nativeNaturalRubber.pressConversion,limit:nativeNaturalRubber.limits[7]});
addRule('world:tfc_leather_oak_twigs',[leatherWorld.oak.twig],leaf('capability:terrestrial_prospecting'),{kind:'native_tfc_oak_groundcover',evidence:leatherWorld.oak});
addRule('world:tfc_leather_oak_logs',[leatherWorld.oak.log],all(['capability:terrestrial_prospecting',leatherWorld.oak.tool].map(leaf)),{kind:'native_tfc_selected_oak_mining',evidence:leatherWorld.oak});
addRule('world:tfc_leather_sheepskin',[leatherWorld.hide.output],all(['capability:terrestrial_prospecting',nativeTfcLeather.knife.item].map(leaf)),{kind:'native_tfc_player_sheep_slaughter',evidence:leatherWorld.hide});
addRule('native:tfc_leather_barrel_service',['capability:tfc_leather_barrel_service'],all(['tfc:wood/barrel/oak','tfc:wooden_bucket'].map(leaf)),{kind:'native_tfc_selected_barrel_transfer',limit:nativeTfcLeather.limits});
addRule('native:tfc_leather_calendar_service',['capability:tfc_leather_calendar_service'],leaf('capability:tfc_leather_barrel_service'),{kind:'native_tfc_selected_sealed_calendar',limit:'Only the selected7200-tick native recipes, sealed with elapsed calendar ticks strictly greater than duration. Actual scheduling and operation remain runtime qualification.'});
addRule('native:tfmg_lubrication_bucket',[nativeLubricationBucket.filled],all(['fluid:'+nativeLubricationBucket.fluid,nativeLubricationBucket.empty,'create:spout','create:depot','modern_industrialization:fluid_pipe'].map(leaf)),{kind:'native_exact_tfmgoil_container_filling',evidence:nativeLubricationBucket,limit:nativeLubricationBucket.limits[1]});
const wroughtWorld=nativeFirstWrought.world;
addRule('world:first_wrought_normal_hematite',[wroughtWorld.world.oreItem],all(['capability:terrestrial_prospecting',wroughtWorld.world.pickaxe].map(leaf)),{kind:'native_tfc_normal_hematite_mining',evidence:wroughtWorld.oreSource,limit:wroughtWorld.limits[0]});
addRule('native:first_wrought_sluice_channel',['capability:first_wrought_sluice_channel'],all(['capability:terrestrial_prospecting',wroughtWorld.world.pickaxe].map(leaf)),{kind:'native_surface_spring_channel',evidence:wroughtWorld.sluice,biomes:wroughtWorld.springBiomes,limit:wroughtWorld.limits[1]});
addRule('native:first_wrought_sluice_service',['capability:first_wrought_sluice_service'],all(['tfc:wood/sluice/oak','capability:first_wrought_sluice_channel'].map(leaf)),{kind:'native_tfc_sluice_geometry',evidence:wroughtWorld.sluice,limit:wroughtWorld.limits[1]});
for(const row of wroughtWorld.washing){const key=row.deposit.includes('rocky_chunk')?'rocky_chunk':'dirty_dust';addRule('native:first_wrought_sluice/'+key,[row.output],all([row.input,'capability:first_wrought_sluice_service'].map(leaf)),{kind:'native_tfc_selected_deposit_washing',evidence:row,limit:wroughtWorld.limits[2]});}
addRule('native:first_wrought_bronze_anvil_service',['capability:first_wrought_bronze_anvil_service'],all(['tfc:metal/anvil/bronze',nativeCopperHammer.stoneHammer,'capability:primitive_heat','capability:tfc_anvil'].map(leaf)),{kind:'native_tier2_bronze_forging',evidence:nativeFirstWrought,limit:wroughtWorld.limits[5]});
addRule('native:first_wrought_bloomery_service',['capability:first_wrought_bloomery_service'],all(['tfc:bloomery',wroughtWorld.chamber.insulation,'tfc:firestarter','capability:terrestrial_prospecting'].map(leaf)),{kind:'native_tfc_first_level_bloomery_chamber',evidence:wroughtWorld.chamber,limit:wroughtWorld.limits[4]});
addRule('native:copper_hammer_forging_service',['capability:copper_hammer_forging_service'],all([nativeCopperHammer.stoneHammer,'tfc:metal/anvil/copper','capability:primitive_heat','capability:tfc_anvil'].map(leaf)),{kind:'native_copper_anvil_stone_hammer_service',evidence:nativeCopperHammer,limit:'Existing Copper laboratory/anvil and earlier tagged stone hammer, with workable-temperature feed and native forging steps. No first copper hammer is required as its own predecessor; actual heat, interaction, durability and quantities remain qualification.'});
frontier.delete('minecraft:tinted_glass');
assert(survival.barley.biomes.length&&survival.sheep.biomes.length&&survival.panning.length);
addRule('world:tfc_wild_barley',[survival.barley.output],leaf('capability:terrestrial_prospecting'),{kind:'native_tfc_crop_harvest',evidence:'world-validation.json survivalSources.barley',guards:[survival.barley.harvestCondition],limit:'Locate suitable biome/climate and harvest a mature fresh wild crop; season/growth and abundance remain runtime qualification.'});
addRule('native:tfc_sheep_wool',[survival.sheep.output],all(['capability:terrestrial_prospecting','minecraft:shears','#'+survival.sheep.foodTag].map(leaf)),{kind:'native_tfc_animal_product',evidence:'world-validation.json survivalSources.sheep',guards:[survival.sheep.conditions],limit:'Adult/product availability, repeated feeding and native cooldown are conditions of the supplier, not claims about current animals or elapsed calendar.'});
addRule('world:tfc_sheep_bone',[survival.sheep.boneDrop],all(['capability:terrestrial_prospecting','#c:tools/knife'].map(leaf)),{kind:'native_tfc_slaughter',evidence:'world-validation.json survivalSources.sheep',guards:[survival.sheep.boneCondition],limit:'Specific native sheep spawn/loot and deliberate player slaughter; actual encounter and drops require runtime qualification.'});
for(const source of witchHerbs.sources)addRule('world:witch_herbs/'+source.grass,Object.keys(source.probabilitiesPerEligibleLootContext),all(['capability:terrestrial_prospecting',witchHerbs.knife.item,...(source.grass==='cordgrass'?['tfc:wood/boat/oak']:[])].map(leaf)),{kind:'native_tfc_grass_additional_loot',evidence:source,limit:'Specific attached native grass under its climate/survival conditions and existing conditional block-loot modifier. Manufacture a sharp knife; prepare coastal access/provisions for cordgrass. Actual discovery, harvest, loot rolls and collected quantities remain runtime qualification.'});
for(const p of survival.panning){assert(p.amethystChancePerHandPan>0);addRule('world:panning/'+p.depositDefinition,[p.output],all(['capability:terrestrial_prospecting','tfc:pan/empty','fluid:minecraft:water'].map(leaf)),{kind:'native_tfc_hand_panning',evidence:p,limit:'A specific attached deposit and its native positive conditional table branch; actual local rocks, deposit search and roll outcomes require runtime qualification.'});}
assert.equal(world.sapphirePanning?.length,4);
for(const p of world.sapphirePanning){assert(p.chancePerHandPan>0);addRule('world:panning_sapphire/'+p.depositDefinition,[p.output],all(['capability:terrestrial_prospecting','tfc:pan/empty','fluid:minecraft:water'].map(leaf)),{kind:'native_tfc_chalk_hand_panning',evidence:p,limit:'Exact attached chalk-region deposit and conditional hand-pan branch; actual region search, deposit yield and random outcomes remain runtime qualification. Native sandpaper polishing is a separate recipe requirement.'});}
for(const p of nativeProcessingUnit.world.emeraldPanning){assert(p.chancePerHandPan>0);addRule('world:panning_emerald/'+p.depositDefinition,[p.output],all(['capability:terrestrial_prospecting','tfc:pan/empty','fluid:minecraft:water'].map(leaf)),{kind:'native_tfc_diorite_hand_panning',evidence:p,limit:nativeProcessingUnit.world.limits});}
addRule('world:tfc_regional_sand',[survival.regionalSand.sand],leaf('capability:terrestrial_prospecting'),{kind:'native_tfc_surface_geology',evidence:survival.regionalSand,limit:'Declared primary TFC rock/sand relationship; field access and local abundance remain runtime qualification.'});
const netherSupplier=world.nativeNetherSupplier;assert.equal(netherSupplier.truth,'STATIC_NATIVE_BENEATH_RITUAL_AND_NETHER_BLAZE');
addRule('world:beneath_sacrifice_portal',['capability:beneath_portal_access'],all([netherSupplier.entry.weapon,netherSupplier.entry.offering,'capability:terrestrial_prospecting'].map(leaf)),{kind:'native_beneath_ritual_portal',evidence:netherSupplier.entry,conditions:'Locate one eligible native TFC sheep and place eight actual copper anvils in the recorded scan volume before the player final blow with the scythe. Native explosion/zoglins/lightning are retained; no ritual is executed here.'});
addRule('native:nether_alive_return_route',['capability:nether_alive_return_route'],all(['capability:beneath_portal_access','tfc:metal/pickaxe/bronze','burnt_additions:flint_bow','tfc:torch','#minecraft:planks'].map(leaf)),{kind:'native_nether_portal_expedition',evidence:netherSupplier,limit:'Generated portal and marked alive return; actual supplies, climate protection, safety, terrain/navigation and combat remain runtime qualification. No death/keepInventory or arbitrary gate is credited.'});
addRule('world:nether_isolated_netherrack',['minecraft:netherrack'],leaf('capability:nether_alive_return_route'),{kind:'native_nether_rock_isolation',evidence:netherSupplier.nether,limit:'Mine around native Nether netherrack; automatic TFC isolation context yields the whole block. Ordinary direct mining yields nether pebbles instead.'});
addRule('world:rail_controller_nether_slime',['beneath:raw_slime'],all(['capability:nether_alive_return_route','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'native_beneath_nether_slime_vein_mining',evidence:nativeRailFeedstocks.world.slime,limit:nativeRailFeedstocks.world.limits});
addRule('world:rail_controller_lapis',['tfc:ore/lapis_lazuli'],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'native_tfc_limestone_marble_lapis_mining',evidence:nativeRailFeedstocks.world.lapis,limit:nativeRailFeedstocks.world.limits});
addRule('world:nether_fortress_living_blaze',['capability:nether_fortress_living_blaze'],leaf('capability:nether_alive_return_route'),{kind:'native_fortress_population',evidence:netherSupplier.blaze,limit:netherSupplier.blaze.conditions});
addRule('native:create_capture_blaze',['create:blaze_burner'],all(['create:empty_blaze_burner','capability:nether_fortress_living_blaze','capability:nether_alive_return_route'].map(leaf)),{kind:'native_living_blaze_capture',evidence:nativeHeatedMixing,limit:'Specific vanilla blaze capture consumes one empty burner and returns one filled burner; return alive through the retained portal. No powder, replacement mob or free captured stock is credited.'});
addRule('native:create_regular_burner_heat',['capability:heated_burner'],all(['create:blaze_burner','minecraft:charcoal'].map(leaf)),{kind:'native_fueled_blaze_burner',evidence:nativeHeatedMixing.batch,limit:'Place captured burner and insert fresh native regular fuel; keep it heated for the whole selected batch. Smouldering and creative fuel are excluded.'});

addRule('world:tfc_isolated_raw_rock',[survival.regionalSand.rawRock],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/copper'].map(leaf)),{kind:'native_tfc_rock_isolation',evidence:survival.regionalSand,limit:'Excavate around native surface rock until isolated; native drops and copper pickaxe manufacture are retained. Terrain, stability and operation require runtime qualification.'});
assert.equal(survival.quartziteSource?.truth,'STATIC_NATIVE_TFC_ISOLATED_QUARTZITE');
addRule('world:tfc_isolated_quartzite',[survival.quartziteSource.rawRock],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze','tfc:torch'].map(leaf)),{kind:'native_tfc_rock_isolation',evidence:survival.quartziteSource,limit:survival.quartziteSource.limits});
assert.equal(world.preEndHunt?.truth,'STATIC_NATIVE_TFC_DESERT_DUNGEON_EYE_MATERIALS');
const dungeonHunt='capability:tfc_desert_skeleton_dungeon_hunt';
addRule('world:tfc_desert_skeleton_dungeon_hunt',[dungeonHunt],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze','#c:tools/knife'].map(leaf)),{kind:'native_tfc_desert_dungeon_hunt',evidence:world.preEndHunt,guards:['Locate a qualifying dry TFC biome dungeon, retain useful native spawners, bring light/provisions and perform player combat. Both selected variants and successful loot rolls are required.'],limit:'Specific native pool/processor/optional-mixin/config/loot contracts; no located dungeon, observed transformation, actual encounter, safety or fixed finite expedition yield is inferred.'});
for(const [mob,drop]of Object.entries(world.preEndHunt.drops))addRule('world:tfc_desert_dungeon/'+mob,[drop.item],leaf(dungeonHunt),{kind:'native_dungeon_variant_hunt',evidence:drop,limit:'Specific positive0–1 native entity drop after repeated eligible combat, with native spawner replacement. Not arbitrary loot or a guaranteed amount per kill.'});
assert.equal(world.endAccess?.truth,'STATIC_NATIVE_END_PORTAL_GATEWAY_AND_CARGO_RETURN');
const endContract=world.endAccess,endSuppliers='capability:end_return_expedition_suppliers',endOreSource='world:end_certus_ordinary_return';
assert(tagMembers('#minecraft:arrows').includes(endContract.combat.ammo),'Native flint bow must accept the selected arrow');
addRule('world:tfc_desert_dungeon/arrows',[endContract.combat.ammo],leaf(dungeonHunt),{kind:'native_dungeon_variant_arrow_hunt',evidence:endContract.combat.arrowSources,limit:'The same already qualified native skeleton hunt supplies ordinary0–2arrows per eligible kill. No fixed finite hunt or combat budget is certified.'});
addRule('native:end_return_expedition_suppliers',[endSuppliers],all(['minecraft:ender_eye',endContract.combat.bow,endContract.combat.ammo,'minecraft:ender_pearl','tfc:metal/pickaxe/bronze','tfc:torch','#minecraft:planks','#c:tools/knife','capability:terrestrial_prospecting'].map(leaf)),{kind:'native_end_portal_return_equipment',evidence:endContract,requiredActorConditions:['Set/check an Overworld respawn destination; locate the selected stronghold and fill up to12frames, retaining extra eyes for search.','Take sufficient bows/arrows, spare pearls, building/mining stock, light and provisions; defeat the dragon.','Use the new gateway to outer islands, mine the specific certus ore and use the linked gateway back; leave through the active fountain.'],limit:'Static native action/transport/return and manufacture of required hardware kinds. Neither collected quantities nor actual portal formation, dragon defeat, gateway use, inventory, return or safety are proven. Death/keepInventory is not credited as a return route.'});
addRule(endOreSource,[endContract.certus.output],leaf(endSuppliers),{kind:'reviewed_end_expedition_mining',evidence:endContract.certus,limit:'Specific outer-End vein and ordinary compatible-tool drop, conditional on the native portal/dragon/gateway/return sequence. Actual generated deposit, mining and returned ore remain runtime qualification.'});
assert.equal(world.cokingCoal?.truth,'STATIC_TFC_COKING_COAL_SOURCE');
addRule('world:tfc_bituminous_coal',[world.cokingCoal.output],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'active_tfc_underground_mining',evidence:world.cokingCoal,limit:'The active terrain-projected bituminous vein and ordinary mining drop require underground surveying and the manufactured mining tool. Actual location, abundance and excavation remain runtime qualification.'});
assert.equal(world.inkSource?.truth,'STATIC_NATIVE_TFC_SQUID_INK');
addRule('world:tfc_squid_ink',[world.inkSource.item],all(['capability:terrestrial_prospecting','tfc:wood/boat/oak','#c:tools/knife'].map(leaf)),{kind:'native_tfc_ocean_player_kill',evidence:world.inkSource,limit:'Specific native ocean squid,15-block spawn-depth and deliberate player-kill condition; boat/knife must be manufactured. Actual diving access, air/pressure management, encounter and combat remain runtime qualification.'});
assert.equal(world.bauxiteMining?.truth,'STATIC_TFC_BAUXITE_MINING_SOURCE');
addRule('world:tfc_bauxite_normal',[world.bauxiteMining.output],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'active_tfc_graded_mining',evidence:world.bauxiteMining,limit:'Specific existing TFC bauxite vein and normal-grade ordinary drop; surface indicator items are not usable process feedstock.'});
assert.equal(world.manganeseMining?.truth,'STATIC_TFC_PYROLUSITE_MINING_SOURCE');
addRule('world:tfc_pyrolusite_normal',[world.manganeseMining.output],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'active_tfc_pyrolusite_mining',evidence:world.manganeseMining,limit:world.manganeseMining.limits});

assert.equal(world.chemicalMinerals?.length,2);
for(const mineral of world.chemicalMinerals)addRule('world:chemical_mineral/'+mineral.feature,[mineral.output],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'active_tfc_chemical_mineral',evidence:mineral,limit:mineral.limits});
assert.equal(world.geologicalSalt?.truth,'STATIC_TFC_HALITE_SALT_SOURCE');
addRule('world:tfc_halite_salt',[world.geologicalSalt.output],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'active_tfc_halite_mining',evidence:world.geologicalSalt,limit:world.geologicalSalt.limits});
assert.equal(world.blueDyeMineral?.truth,'STATIC_TFC_GRAPHITE_BLUE_DYE_MINERAL');
addRule('world:tfc_graphite_for_blue_dye',[world.blueDyeMineral.output],all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze','tfc:torch'].map(leaf)),{kind:'active_tfc_graphite_mining',evidence:world.blueDyeMineral,limit:world.blueDyeMineral.limits});

assert.equal(world.errors.length,0);
assert.equal(world.petroleum?.length,2,'Refresh the current petroleum world witness first');
// Native features expose physical source fluid. Field handling still needs a
// kinetic pump/pipe; this does not give arbitrary global-loot items free stock.
addRule('world:physical_petroleum_source',['fluid:tfmg:crude_oil'],all(['capability:terrestrial_prospecting','create:mechanical_pump','create:fluid_pipe','capability:kinetic_power'].map(leaf)),{kind:'native_petroleum_feature',evidence:'world-validation.json petroleum',limits:'Declared source placement and field pumping apparatus; new-chunk generation, rarity and actual collection remain runtime qualification.'});

frontier.set('capability:terrestrial_prospecting',{kind:'native_tfc_surface_prospecting',scope:'Physical surface exploration of newly generated TFC terrain; abundance and actual feature operation require runtime qualification.'});
for(const f of world.terrestrialFeatures)if(f.indicators.length)addRule('world:indicator/'+f.feature,f.indicators,leaf('capability:terrestrial_prospecting'),{kind:'active_tfc_indicator',evidence:f.feature,limits:'Uses the active vein tag and configured surface indicator, not arbitrary global loot.'});
for(const id of ['capability:crafting','capability:primitive_heat','capability:tfc_anvil'])frontier.set(id,{kind:'native_tfc_primitive_mechanic',scope:'Primitive crafting/heat/anvil behavior is a stated boundary; native operation is runtime qualification.'});
// Earlier power hardware must still be manufactured in this mixed graph.
addRule('native:mi_steam_service',['capability:industrial_power'],all(['modern_industrialization:lv_steam_turbine','modern_industrialization:bronze_boiler','fluid:minecraft:water','minecraft:charcoal'].map(leaf)),{kind:'native_power_hardware',limit:'Power throughput/network operation is not inferred.'});
addRule('native:lv_assembler_64_service',['capability:lv_assembler_64_service'],all(['modern_industrialization:assembler','modern_industrialization:basic_upgrade','modern_industrialization:tin_cable','capability:industrial_power'].map(leaf)),{kind:'native_lv_assembler_finite_service',evidence:nativeLvAssembler,limit:'Sixteen installed basic upgrades and a dedicated matching native LV cable service; finite steam/refill/partial-energy ledger is static evidence, not live operation.'});
addRule('native:ae2_inscriber_service',['capability:ae2_inscriber_service'],all(['ae2:inscriber','modern_industrialization:tin_cable','modern_industrialization:lv_steam_turbine','modern_industrialization:bronze_boiler','fluid:minecraft:water','minecraft:charcoal'].map(leaf)),{kind:'native_mi_fe_inscriber_service',evidence:nativeInscriber,limit:'Dedicated native LV/FE path to a non-front face, initialized private node, stable slots/output and finite replenishment past1600AE. Native provider/grid/tick/transfer/operation remain runtime qualification.'});
addRule('native:ae2_silicon_smelting',['capability:ae2_silicon_smelting'],all(['minecraft:furnace','minecraft:charcoal'].map(leaf)),{kind:'native_furnace_processed_silicon',evidence:nativeInscriber.siliconSmelting,limit:'Existing earlier-factory furnace, native SMELTING recipe matching and finite three-dust/one-charcoal plan. Actual loaded heat/fuel hooks, input/output and operation remain qualification.'});
const formingDriveParts=['create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:large_andesite_alloy_cogwheel','create:wrench','fluid:minecraft:water'];
for(const [name,item]of [['steel_saw','greate:steel_mechanical_saw'],['aluminum_saw','greate:aluminium_mechanical_saw'],['stainless_press','greate:stainless_steel_mechanical_press']])addRule('native:'+name+'_service',['capability:'+name+'_service'],all([...formingDriveParts,item].map(leaf)),{kind:'native_fractional_forming_drive',evidence:nativeControllerLine,limit:'Selected5stage0.25RPMdrive, configured native machine tier/orientation and unchanged stress limits; physical counts/matching/operation remain qualification.'});
addRule('native:controller_line_service',['capability:controller_line_service'],all([...Object.keys(nativeControllerLine.hardware),'capability:aluminum_saw_service','capability:stainless_press_service','fluid:minecraft:water','fluid:modern_industrialization:soldering_alloy'].map(leaf)),{kind:'native_depot_controller_sequence_service',evidence:nativeControllerLine,limit:'One shared reduced drive with2.75SUload, three depots, downwardUSEdeployer and supplied spout; exact workpiece stage/components and sequence ledger still required. Actual flow, setup, loaded sequence/registration and operation remain qualification.'});
addRule('native:steam_service',['capability:steam_service'],all(['modern_industrialization:bronze_boiler','fluid:minecraft:water','minecraft:charcoal'].map(leaf)),{kind:'native_steam_hardware',evidence:'bootstrap-validation.json powerContract',limit:'Steam processors consume recipe EU through the native SteamHelper; flow and operation are runtime qualification.'});
addRule('native:mi_boiler_steam',['fluid:modern_industrialization:steam'],all(['modern_industrialization:bronze_boiler','fluid:minecraft:water','minecraft:charcoal'].map(leaf)),{kind:'native_mi_boiler_steam',evidence:nativeSteam,guards:['Heat the fueled boiler above100C and retain output space; enable native output extraction.'],limit:'Native consumed-water/solid-fuel steam supplier. No free steam stock, heat-up time, filled tank or sustained power is inferred.'});
assert(nativeSteam.longLvPlan.steelBoilers*nativeSteam.longLvPlan.nominalSteamPerBoilerAtPlannedTemperature>=32);
addRule('native:mi_sustained_lv_service',['capability:mi_sustained_lv_service'],all(['modern_industrialization:steel_boiler','modern_industrialization:lv_steam_turbine','modern_industrialization:tin_cable','fluid:minecraft:water','minecraft:charcoal'].map(leaf)),{kind:'native_nominal_lv_supply_plan',evidence:nativeSteam.longLvPlan,guards:['Three steel boilers kept above1300C, supplied with water/charcoal and extracting into the turbine. Reserve its32EU/t output for one long batch.'],limit:'Nominal native production39steam/t exceeds32EU/t demand; manufacture of each hardware kind only. Three actual boilers, inventories, auto-extraction/faces, flow and sustained throughput remain runtime qualification.'});
for(const [name,shape]of [['blast',nativeColdworks.blast],['freezer',nativeColdworks.freezer]])addRule('native:mi_'+name+'_structure',['capability:mi_'+name+'_structure'],all(Object.keys(shape.hardware).map(leaf)),{kind:'native_mi_multiblock_hardware',evidence:shape,limit:'Exact native shape/hatch kinds and constructive counts; hardware availability only. Actual stock quantities, shape formation, facing and operation remain runtime qualification.'});
addRule('native:kinetic_service',['capability:kinetic_power'],all(['create:water_wheel',kineticItem(0,'shaft')].map(leaf)),{kind:'native_kinetic_hardware',limit:'Rotation, water placement, stress and operation require runtime qualification.'});
addRule('native:first_refinery_heat',['capability:tfmg_tower_heat'],all(['tfmg:firebox','tfmg:exhaust','fluid:railcraft:creosote','tfmg:cast_iron_pipe','tfmg:cast_iron_mechanical_pump','capability:kinetic_power'].map(leaf)),{kind:'native_firebox_hardware',evidence:'bootstrap-validation.json petroleumContract',limit:'Native tag-driven firing, heat and exhaust requirement; actual operation remains runtime qualification.'});
assert.equal(nativeVat.nativePlasticHeat.truth,'STATIC_NATIVE_FIREBOX_LEVEL2_PLASTIC_HEAT');
addRule('native:tfmg_native_heat2',['capability:tfmg_native_heat2'],leaf('capability:tfmg_tower_heat'),{kind:'native_firebox_heat2',evidence:nativeVat.nativePlasticHeat});
addRule('native:tfmg_vat_fluid_handling',['capability:tfmg_vat_fluid_handling'],all(['tfmg:cast_iron_pipe','tfmg:cast_iron_mechanical_pump','tfmg:steel_fluid_tank','capability:kinetic_power'].map(leaf)),{kind:'native_vat_fluid_hardware',evidence:nativeVat,limit:'Separate input/output storage and pumping hardware; physical connections, fluid compatibility, flow and operation remain runtime qualification.'});
addRule('native:tfmg_vat_mixing',['capability:tfmg_vat_mixing'],all([...Object.keys(nativeVat.drive.hardware),'fluid:minecraft:water'].map(leaf)),{kind:'native_vat_mixing_hardware',evidence:nativeVat,limit:'Dedicated all-aluminum 8→16→32RPM drive and native blade at top center; hardware quantities, layout, actual water flow/RPM/stress and operation remain runtime qualification.'});
addRule('native:early_crafter_grid',['capability:early_crafter_grid'],all([...Object.keys(nativeEarlyCrushing.grid.hardware),'fluid:minecraft:water','capability:kinetic_power'].map(leaf)),{kind:'native_fractional_crafter_grid',evidence:nativeEarlyCrushing.grid,limit:'Nine same-facing crafters, five small-to-large reductions and the declared8SUwater source; actual quantities/layout/flow/matching are not observed.'});
addRule('native:early_crushing_service',['capability:early_crushing_service'],all([...Object.keys(nativeEarlyCrushing.pair.hardware),'capability:early_crafter_grid','fluid:minecraft:water','capability:kinetic_power'].map(leaf)),{kind:'native_separate_crushing_drives',evidence:nativeEarlyCrushing.pair,limit:'Two parallelZaxis wheels with inward/downward opposite8RPM, separate water sources,4SU per8SU network; actual formation and operation unverified.'});
addRule('native:early_millstone_service',['capability:early_millstone_service'],all([...Object.keys(nativeEarlyCrushing.millstone.hardware),'fluid:minecraft:water','capability:kinetic_power'].map(leaf)),{kind:'native_millstone_service',evidence:nativeEarlyCrushing.millstone,limit:'Native8RPM4SUdrive, top intake and empty-hand collection; actual geometry, quantities, insertion and operation unverified.'});
addRule('native:tfmg_silicon_furnace',['capability:tfmg_silicon_furnace'],all([...Object.keys(nativeSiliconFurnace.shape.hardware),nativeSiliconFurnace.selectedFuel,'create:chute','capability:tfmg_vat_fluid_handling'].map(leaf)),{kind:'native_finite_silicon_furnace_service',evidence:nativeSiliconFurnace,limit:'Specific3by3by3zero-air native reaction; actual formation, fuel/timer state, inventories and operation remain runtime qualification.'});
addRule('native:andesite_heated_mixing',['capability:andesite_heated_mixing'],all([...Object.keys(nativeHeatedMixing.drive.hardware),'capability:heated_burner','fluid:minecraft:water','capability:kinetic_power'].map(leaf)),{kind:'native_andesite_heated_basin_service',evidence:nativeHeatedMixing,limit:'Dedicated8SUandesite drive at8RPM, heated basin and finite magnetic-alloy fuel budget; actual counts/formation/matching/operation remain runtime qualification.'});
addRule('native:ee_fe_eu_service',['capability:industrial_power','capability:fe_power'],all(['electroenergetics:alternator_rotor','electroenergetics:stator','electroenergetics:alternator_brushes','electroenergetics:wire_spool','electroenergetics:converter','capability:kinetic_power'].map(leaf)),{kind:'native_power_hardware',fePerEu:powerContract.fePerEu,evidence:'bootstrap-validation.json powerContract',limit:'Declared first-power hardware and native FE-to-EU interface; delivered power is runtime qualification.'});
addRule('native:freshwater_bucket',['minecraft:water_bucket'],all(['minecraft:bucket','fluid:minecraft:water'].map(leaf)),{kind:'native_bucket_pickup',limit:'Collection of a freshwater source using the existing vanilla bucket; actual fluid/container behavior remains runtime qualification. Native bucket manufacture is modeled separately, not assumed.'});
addRule('native:stellaris_oxygen_container_service',['capability:stellaris_suit_oxygen_service'],all(['stellaris:water_separator','capability:fe_power','fluid:stellaris:oxygen','stellaris:oxygen_tank','stellaris:space_suit_chestplate'].map(leaf)),{kind:'native_oxygen_container_transfer',evidence:nativeLifeSupport,limit:'Separator oxygen output fills the native oxygen container; crouch-use transfers to the worn chestplate. This represents service availability, not an actually filled stack or protection duration.'});
const travel=bootstrap.firstSpaceTravel,returns=travel.returnSuppliers;
assert.equal(returns?.truth,'STATIC_NATIVE_ROCKET_RECOVERY_AND_RETURN_FUEL');
addRule('native:stellaris_fuel_bucket',['stellaris:fuel_bucket'],all(['minecraft:bucket','create:spout','fluid:stellaris:fuel'].map(leaf)),{kind:'native_spout_bucket_filling',amount:1000,evidence:returns,limit:'Native fluid bucket registration and Create fluid-capability filling; actual filled components and fluid transfer require runtime qualification.'});
const expeditionInputs=['stellaris:rocket','stellaris:rocket_launch_pad','stellaris:fuel_bucket','stellaris:oxygen_tank','capability:stellaris_suit_oxygen_service','tfc:metal/pickaxe/bronze','minecraft:compass','mekanism:geiger_counter','mekanism:dosimeter',...['helmet','chestplate','leggings','boots'].map(part=>'stellaris:space_suit_'+part)];
const expeditionByDimension=new Map();
for(const [name,dimension]of [['moon','rocketnautics:moon'],['mars','stellaris:mars'],['venus','stellaris:venus']]){
 assert(travel.destinations.some(d=>d.dimension===dimension&&d.outboundFitsBasicTank));assert(returns[name].canReturn);
 const output='capability:'+name+'_return_expedition_suppliers';expeditionByDimension.set(dimension,output);
 addRule('native:'+name+'_return_expedition_suppliers',[output],all(expeditionInputs.map(leaf)),{kind:'native_round_trip_supplier_contract',dimension,evidence:returns[name],fuelBuckets:{initial:3,carriedReserve:returns[name].reserveBuckets},guards:['Equip the complete native pressure suit and charge its chestplate; preserve independent oxygen, return-pad equipment and provisions.','Recover the rocket and its remaining-fuel component from the lander inventory before relaunch.'],limit:'Constructive native route/equipment supply under the declared workshop frontier. This is not an actual visit, successful landing, survival-duration, field collection or return-inventory claim.'});
}
assert.equal(world.firstSpaceCargo?.truth,'STATIC_FIRST_SPACE_ORDINARY_CARGO');
for(const source of world.firstSpaceCargo.routes){const expedition=expeditionByDimension.get(source.dimension);assert(expedition);addRule('world:'+source.feature+'/ordinary_return',[source.ordinaryOutput],leaf(expedition),{kind:'reviewed_expedition_mining',evidence:source,limit:'Specific attached ore and ordinary non-Silk-Touch loot with a compatible manufactured tool and round-trip suppliers. Actual field mining and returned cargo are runtime qualification.'});}
for(const source of nativeProcessingUnit.world.moonMinerals){assert.equal(source.dimension,'rocketnautics:moon');addRule('world:lunar_control/'+source.feature,[source.ordinaryOutput],leaf(expeditionByDimension.get(source.dimension)),{kind:'reviewed_lunar_control_mineral_cargo',evidence:source,limit:nativeProcessingUnit.world.limits});}
assert.equal(world.venusAntimony?.truth,'STATIC_VENUS_STIBNITE_MINING_SOURCE');
addRule('world:venus_normal_stibnite_return',[world.venusAntimony.output],leaf(expeditionByDimension.get(world.venusAntimony.dimension)),{kind:'reviewed_venus_antimony_mining',evidence:world.venusAntimony,limit:world.venusAntimony.limits});
addRule('world:active_moon_geological_sample',[world.lunarSamples.ordinarySample],leaf(expeditionByDimension.get(world.lunarSamples.dimension)),{kind:'reviewed_expedition_surface_sample',evidence:world.lunarSamples,limit:'Specific native Moon terrain and ordinary mining drop; actual sample collection and field access remain runtime qualification.'});
assert.equal(world.lunarArchaeology?.truth,'STATIC_ACTIVE_MOON_MONUMENT_RECOVERY');
const symbolRecipe='sgjourney:stone_symbol_from_stonecutting';
for(const row of native.recipes[symbolRecipe])assert(removals.some(f=>f(symbolRecipe,row.data)===true),'Native blank-symbol shortcut must stay retired');
addRule('world:lunar_anomaly_symbol',[world.lunarArchaeology.item],leaf(expeditionByDimension.get(world.lunarArchaeology.dimension)),{kind:'reviewed_expedition_monument_recovery',evidence:world.lunarArchaeology,limit:'One native nonconverted monument symbol with the manufactured correct mining tool and return suppliers. Actual structure search/generation, component preservation and returned inventory remain runtime qualification.'});
assert.equal(world.martianArchaeology?.truth,'STATIC_ACTIVE_MARS_RECORD_SOURCES');
const glyphRecipe='sgjourney:sandstone_hieroglyphs_from_stonecutting';
for(const row of native.recipes[glyphRecipe])assert(removals.some(f=>f(glyphRecipe,row.data)===true),'Native blank-glyph shortcut must stay retired');
for(const item of [world.martianArchaeology.item,world.martianArchaeology.stoneSample])addRule('world:martian_records/'+item,[item],leaf(expeditionByDimension.get(world.martianArchaeology.dimension)),{kind:'reviewed_expedition_martian_record_source',evidence:world.martianArchaeology,limit:'Specific root-template glyphs or ordinary active-terrain stone, compatible manufactured pickaxe and Mars round-trip suppliers; actual mining, structure access and returned inventory remain runtime qualification.'});
assert.equal(world.venusianArchaeology?.truth,'STATIC_ACTIVE_VENUS_FIELD_SOURCES');
const venusBlankSymbol='sgjourney:red_sandstone_symbol_from_stonecutting';
assert(native.recipes[venusBlankSymbol]?.length);
for(const row of native.recipes[venusBlankSymbol])assert(removals.some(f=>f(venusBlankSymbol,row.data)===true),'Native blank Venus-symbol shortcut must stay retired');
for(const item of [world.venusianArchaeology.item,world.venusianArchaeology.stoneSample])addRule('world:venusian_field/'+item,[item],leaf(expeditionByDimension.get(world.venusianArchaeology.dimension)),{kind:'reviewed_expedition_venusian_field_source',evidence:world.venusianArchaeology,limit:world.venusianArchaeology.limits});
const mercuryCargo=world.mercurianCargo,mercuryTrip=travel.mercuryExpedition,mercuryReturn='capability:mercury_return_expedition_suppliers';
assert.equal(mercuryCargo?.truth,'STATIC_ACTIVE_MERCURY_CARGO_SOURCES');
assert.equal(mercuryTrip?.truth,'STATIC_NATIVE_STAGED_MERCURY_RETURN_FUEL');
assert.equal(mercuryTrip.plan.totalNewFuelMb,10000);assert.equal(mercuryTrip.plan.reserveBuckets,7);
addRule('native:mercury_return_expedition_suppliers',[mercuryReturn],all([expeditionByDimension.get('stellaris:venus'),...expeditionInputs].map(leaf)),{kind:'native_staged_mercury_supplier_contract',dimension:mercuryCargo.dimension,evidence:mercuryTrip,guards:mercuryTrip.actorConditions,limit:mercuryTrip.limits});
expeditionByDimension.set(mercuryCargo.dimension,mercuryReturn);
assert(native.recipes['sgjourney:red_sandstone_cartouche']?.length);
for(const row of native.recipes['sgjourney:red_sandstone_cartouche'])assert(removals.some(f=>f('sgjourney:red_sandstone_cartouche',row.data)===true),'Native blank cartouche shortcut must stay retired');
for(const item of [mercuryCargo.item,mercuryCargo.additionalSymbol,mercuryCargo.stoneSample])addRule('world:mercurian_relay/'+item,[item],leaf(mercuryReturn),{kind:'reviewed_mercury_relay_or_terrain_cargo',evidence:mercuryCargo,limit:mercuryCargo.limits});
for(const source of mercuryCargo.minerals)addRule('world:mercury_mining/'+source.feature,[source.ordinaryOutput],leaf(mercuryReturn),{kind:'reviewed_mercury_ordinary_ore_cargo',evidence:source,limit:mercuryCargo.limits});
const starlightWorld=nativeStarlight.world,starlightSurvey='capability:starlight_ruins_trial_suppliers',starlightReturn='capability:starlight_return_expedition_suppliers';
addRule('world:starlight_ruins_trial_suppliers',[starlightSurvey],all(['capability:terrestrial_prospecting',endContract.combat.bow,endContract.combat.ammo,'tfc:metal/pickaxe/bronze','tfc:torch','#minecraft:planks','#c:tools/knife'].map(leaf)),{kind:'native_tfc_portal_ruins_trial_suppliers',evidence:starlightWorld,guards:['Locate a common Portal Ruins structure in its active TFC biome set. In non-Peaceful survival, speak to the native Gatekeeper and successfully complete the first trial.','Prepare sufficient weapons, ammunition, protection, light, provisions and inventory room. The selected route credits no dragon-dialogue skip, commanded permission or arbitrary chest.'],limit:starlightWorld.limits[0]});
addRule('native:gatekeeper_initial_orb',['eternal_starlight:orb_of_prophecy'],leaf(starlightSurvey),{kind:'native_first_trial_boss_reward',evidence:'world-validation.json:starlightWorld',guards:['Recover/open the initial native reward with its preserved boss loot-table and challenge-count components. The Orb pool applies only to challenge counts at most1.'],limit:starlightWorld.limits[0]});
addRule('native:starlight_return_expedition_suppliers',[starlightReturn],all([starlightSurvey,'eternal_starlight:orb_of_prophecy','tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'native_orb_frame_entry_and_marked_portal_return',evidence:starlightWorld,guards:['Use the reusable Orb on the existing eight-block radius2 diamond frame; preserve its five interior blocks and note both portal locations.','Keep the generated counterpart and original portal intact and return alive with collected materials; native travel hooks and terrain must permit both transitions.'],limit:starlightWorld.limits[0]});
for(const ore of starlightWorld.selected.ores)addRule('world:starlight_mining/'+ore.feature,[ore.ordinaryOutput],all([starlightReturn,ore.tool.startsWith('TFC bronze')?'tfc:metal/pickaxe/bronze':'UNREVIEWED_STARLIGHT_TOOL'].map(leaf)),{kind:'native_starlight_forest_ordinary_mining',evidence:ore,limit:starlightWorld.limits[1]});
addRule('world:starlight_natural_meteor',['eternal_starlight:raw_aethersent'],leaf(starlightReturn),{kind:'native_starlight_natural_meteor_drop',evidence:starlightWorld.selected,guards:['Wait for a native meteor shower, avoid a size10 natural meteor and recover its ordinary raw Aethersent item drops; retain a safe portal return. No command weather or player projectile is credited.'],limit:starlightWorld.limits[2]});
for(const mineral of nativeSuperconductor.world.minerals){const expedition=expeditionByDimension.get(mineral.dimension);assert(expedition,'Reviewed planet return suppliers required');addRule('world:superconductor_mining/'+mineral.feature,[mineral.ordinaryOutput],all([expedition,'tfc:metal/pickaxe/bronze'].map(leaf)),{kind:'native_returned_superconductor_mineral',evidence:mineral,limit:nativeSuperconductor.world.limits});}
function solve(rs,seed,options={}){
 const reached=new Set(seed.keys()),witness=new Map(),witnessInputs=new Map();
 const evaluate=e=>e.id?reached.has(e.id)||(e.id.startsWith('#')||e.id.startsWith('fluid:#'))&&tagMembers(e.id).some(id=>reached.has(id)):e.all?e.all.every(evaluate):e.any.some(evaluate);
 const inputsAtAdmission=e=>{if(e.id){if(reached.has(e.id))return [e.id];const member=tagMembers(e.id).find(id=>reached.has(id));assert(member,'No admitted tag member '+e.id);return [member];}if(e.all)return e.all.flatMap(inputsAtAdmission);const choice=e.any.find(evaluate);assert(choice,'No admitted OR branch');return inputsAtAdmission(choice);};
 let waves=0;for(;waves<300;waves++){let changes=0;for(const r of rs)if(evaluate(r.requirements)){const inputs=options.recordInputs?inputsAtAdmission(r.requirements):null;for(const out of r.outputs)if(!reached.has(out)){reached.add(out);witness.set(out,r.id);if(inputs)witnessInputs.set(out,inputs);changes++;}}trace('wave '+waves+': '+changes);if(!changes)break;}return {reached,witness,witnessInputs,waves,evaluate};
}

// Factory-free chronological acceptance uses this freshly assembled provider graph.
if(process.argv.includes('--campaign-closure')){
 assert(!process.env.MISSION02_DIAGNOSTIC_GRAPH,'Closure needs current providers, not a diagnostic export');
 const {writeChronologicalCampaignClosure}=await import('./lib/chronological_campaign_closure.mjs');
 const result=writeChronologicalCampaignClosure({root:liveRoot,developmentRoot,recipes,native,authored,policy,removals,tags,world,ledger,fluidMembers,lubricationBucket:nativeLubricationBucket,hotAir:nativeFirstHotAir,vat:nativeVat,generatedCatalystTags:nativeGeneratedCatalyst,generatedUpperPlates:nativeUpperPlates,forgeBindings:nativeForgeBindings});
 console.log(JSON.stringify({truth:result.truth,closedAges:result.closedAges,rows:result.rows.map(r=>({age:r.age,status:r.acceptance,missing:r.unresolvedSupplierTasks,objectives:r.unverifiedObjectives}))}));process.exit(0);
}

// Explicit diagnostic snapshots accelerate supplier edits. They execute no
// acceptance flags and never replace the fresh native/whole-model final run.
if(process.env.MISSION02_DIAGNOSTIC_GRAPH){
 assert(!process.argv.some(a=>a.startsWith('--require-')),'Diagnostic snapshots do not execute acceptance flags');
 const refs=new Set([...frontier.keys()].filter(id=>id.startsWith('#')||id.startsWith('fluid:#'))),collect=e=>{if(e.id){if(e.id.startsWith('#')||e.id.startsWith('fluid:#'))refs.add(e.id);}else(e.all??e.any).forEach(collect);};recipes.forEach(r=>collect(r.requirements));
 fs.writeFileSync(process.env.MISSION02_DIAGNOSTIC_GRAPH,JSON.stringify({truth:'DIAGNOSTIC_GRAPH_NOT_ACCEPTANCE',recipes,frontier:[...frontier],tags:Object.fromEntries([...refs].map(id=>[id,tagMembers(id)])),solver:solve.toString(),locks:[...locks],contract:nativeFirstHotAir,air:nativeFirstAir,hardware:tfcStartupHardware,leather:nativeTfcLeather,fuel:bootstrap.petroleumContract.hotBlastFuel,geologicalCoke:nativeGeologicalCoke,early:nativeEarlyCrushing,steel:nativeFirstSteel,industrialIron:nativeIndustrialIron,steelShaft:nativeFirstSteelShaft,rubber:nativeNaturalRubber,foundryBronze:nativeFoundryBronze,ignition:nativeFirstIgnition,metalFluidUnitTags}));trace('diagnostic graph written; acceptance not executed');process.exit(0);
}
const solved=solve(recipes,frontier),missingNodes=ledger.nodes.filter(n=>!solved.reached.has('research:'+n.id)).map(n=>n.code),missingPacks=ledger.packs.filter(p=>!solved.reached.has('pack:'+p.id)).map(p=>p.id);
function missingLeaves(e){if(solved.evaluate(e))return [];if(e.id)return [e.id];return [...new Set((e.all??e.any).flatMap(missingLeaves))];}
const pendingFirstRoutes=ledger.packs.map(p=>ledger.pack_routes.find(r=>r.pack===p.id)).filter(r=>!solved.reached.has('pack:'+r.pack)).map(r=>({id:r.id,owner:r.unlock_node,missing:missingLeaves(recipes.find(x=>x.id===r.id&&x.kind==='pack').requirements)}));
const cuts=new Map();function inspect(id,depth=0,seen=new Set()) {if(solved.reached.has(id)||seen.has(id)||depth>5)return;seen.add(id);const choices=producers.get(id)??[];if(!choices.length){cuts.set(id,(cuts.get(id)??0)+1);return;}const ranked=choices.map(r=>({r,missing:missingLeaves(r.requirements)})).sort((a,b)=>a.missing.length-b.missing.length);for(const child of ranked[0].missing)inspect(child,depth+1,seen);}
for(const r of pendingFirstRoutes)for(const id of r.missing)inspect(id);
const requested=process.argv.filter(v=>v.startsWith('--target=')).map(v=>v.slice(9));
const targetDetails=requested.map(id=>({id,reached:solved.evaluate(leaf(id)),members:tagMembers(id),producers:(producers.get(id)??[]).map(r=>({id:r.id,kind:r.kind,missing:missingLeaves(r.requirements)}))}));
const firstIndustrialIron=firstIndustrialIronProof({contract:nativeIndustrialIron,recipes,frontier,powerContract,nativeSteam,locks,solve,tagMembers});
const firstWrought=firstWroughtProof({contract:nativeFirstWrought,industrial:nativeIndustrialIron,recipes,frontier,solve,tagMembers});
const nativeMechanicalIronEntry=mechanicalIronEntryContract({root:liveRoot,authored,native,policy,removals,tags,locks,controller:nativeControllerLine,rubber:nativeNaturalRubber,early:nativeEarlyCrushing});
const firstMechanicalIron=firstMechanicalIronEntry({contract:nativeMechanicalIronEntry,wroughtArgs:{contract:nativeFirstWrought,industrial:nativeIndustrialIron,recipes,frontier,solve,tagMembers}});
trace('mechanical iron entry checked: '+firstMechanicalIron.truth);
const firstLubricationBucket=firstLubricationBucketProof({contract:nativeLubricationBucket,recipes,frontier,solve,nativeSteam,powerContract});
const firstTfcLeather=firstTfcLeatherProof({contract:nativeTfcLeather,recipes,frontier,solve,tagMembers});
const firstNaturalRubber=firstNaturalRubberProof({contract:nativeNaturalRubber,leather:nativeTfcLeather,recipes,frontier,solve,tagMembers,locks});
const firstStartupLubricant=firstStartupLubricantProof({contract:nativeStartupLubricant,bucket:nativeLubricationBucket,leather:nativeTfcLeather,recipes,frontier,solve,tagMembers,locks,nativeSteam,powerContract});
trace('first startup lubricant checked: '+firstStartupLubricant.truth);
const firstTfcStartupHardware=firstTfcStartupHardwareProof({contract:tfcStartupHardware,leather:nativeTfcLeather,recipes,frontier,solve,tagMembers,locks});
trace('first TFC startup hardware checked: '+firstTfcStartupHardware.truth);
const firstAir=firstAirProof({contract:nativeFirstAir,hardware:tfcStartupHardware,leather:nativeTfcLeather,recipes,frontier,solve,tagMembers,locks});
trace('first native air checked: '+firstAir.truth);
const firstHotAir=firstHotAirProof({contract:nativeFirstHotAir,air:nativeFirstAir,hardware:tfcStartupHardware,leather:nativeTfcLeather,fuel:bootstrap.petroleumContract.hotBlastFuel,recipes,frontier,solve,tagMembers,locks});
trace('first finite hot-air precharge checked: '+firstHotAir.truth);
// Optional diagnostic collection still executes every requested assertion.
// Ordinary individual flags retain their existing fail-fast behavior.
const collectedFirstRequirements=[];
function requireFirst(flag,check){
 if(!process.argv.includes(flag))return;
 if(!process.argv.includes('--collect-first-results')){check();return;}
 try{check();collectedFirstRequirements.push({flag,passed:true});}catch(error){collectedFirstRequirements.push({flag,passed:false,error:error.message});}
}
requireFirst('--require-first-startup-lubricant',()=>assert.equal(firstStartupLubricant.truth,'BOUNDED_NATIVE_LOG_TO_LUBRICATION_BUCKET'));
trace('first natural rubber checked: '+firstNaturalRubber.truth);
requireFirst('--require-first-natural-rubber',()=>assert.equal(firstNaturalRubber.truth,'BOUNDED_NATIVE_FIRST_NATURAL_RUBBER_SHEET'));
trace('first TFC leather checked: '+firstTfcLeather.truth);
requireFirst('--require-first-tfc-leather',()=>assert.equal(firstTfcLeather.truth,'BOUNDED_NATIVE_TFC_SHEEPSKIN_TO_LEATHER'));
trace('first lubrication bucket checked: '+firstLubricationBucket.truth);
requireFirst('--require-first-lubrication-bucket',()=>assert.equal(firstLubricationBucket.truth,'BOUNDED_NATIVE_LUBRICATION_OIL_CONTAINER_SUPPLIERS'));
trace('first wrought checked: '+firstWrought.truth);
requireFirst('--require-first-wrought',()=>assert.equal(firstWrought.truth,'BOUNDED_NATIVE_HEMATITE_TO_WROUGHT_AND_CANONICAL_IRON'));
trace('first industrial iron checked: '+firstIndustrialIron.truth);
requireFirst('--require-first-industrial-iron',()=>assert.equal(firstIndustrialIron.truth,'BOUNDED_TFC_WROUGHT_TO_CANONICAL_IRON_BATCHES'));
const firstWitchHerbs=firstWitchHerbsProof({world,ledger,policy,native,recipes,frontier,locks,solve,tagMembers});
trace('first witch herbs checked');
// Compose the reviewed TFC route independently of alternative mob/ore-washing
// and vanilla string recipes. Missing a physical prerequisite must stay missing.
const suitSources=new Map([
 ['tfc:wool',r=>r.id==='native:tfc_sheep_wool'],
 ['minecraft:white_wool',r=>r.id==='tfc:loom/white_wool'],
 ['tfc:ore/amethyst',r=>r.kind==='native_tfc_hand_panning'],
 ['tfc:powder/amethyst',r=>r.id==='tfc:quern/powder/amethyst'],
 ['minecraft:tinted_glass',r=>r.id==='tfc:glassworking/tinted_glass']
]);
const suitRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!suitSources.has(id)||suitSources.get(id)(r))}));
for(const id of suitSources.keys())assert(!frontier.has(id),'First suit stock must be manufactured: '+id);
const suitSolved=solve(suitRules,frontier);
const suitTargets=['tfc:wool','tfc:wool_yarn','tfc:wool_cloth','minecraft:white_wool','tfc:ore/amethyst','tfc:quern','tfc:handstone','tfc:powder/amethyst','tfc:gem_saw','tfc:metal/block/brass','minecraft:tinted_glass',...['helmet','chestplate','leggings','boots'].map(part=>'stellaris:space_suit_'+part),'capability:stellaris_suit_oxygen_service'];
const firstSuit={truth:suitTargets.every(id=>suitSolved.reached.has(id))?'BOUNDED_NATIVE_TFC_SUIT_SUPPLIERS':'INCOMPLETE_NATIVE_TFC_SUIT_SUPPLIERS',witnesses:Object.fromEntries(suitTargets.map(id=>[id,suitSolved.witness.get(id)??null])),negativeCases:[],limits:['Physical sheep feeding/product cycles, fresh-food handling, hand-panning luck, quern use, hot glass components and basin construction remain runtime qualification.','Suit item manufacture does not prove oxygen charging, worn protection, pressure or safe travel.']};
if(firstSuit.truth==='BOUNDED_NATIVE_TFC_SUIT_SUPPLIERS')for(const [name,blocked,target]of [
 ['shears',['minecraft:shears'],'tfc:wool'],
 ['sheep_grain',tagMembers('#'+survival.sheep.foodTag),'tfc:wool'],
 ['pan',['tfc:pan/empty'],'tfc:ore/amethyst'],
 ['handstone',tagMembers('#tfc:quern_handstones'),'tfc:powder/amethyst'],
 ['brass_basin',['tfc:metal/block/brass'],'minecraft:tinted_glass'],
 ['gem_saw',['tfc:gem_saw'],'minecraft:tinted_glass'],
 ['oxygen_fluid',['fluid:stellaris:oxygen'],'capability:stellaris_suit_oxygen_service'],
 ['oxygen_fe_power',['capability:fe_power'],'capability:stellaris_suit_oxygen_service']
]){
 const removed=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!removed.has(id)));
 const result=solve(suitRules.map(r=>({...r,outputs:r.outputs.filter(id=>!removed.has(id))})),seed);
 assert(!result.reached.has(target),'First-suit negative failed: '+name);
 firstSuit.negativeCases.push({name,blocked,target,rejected:true});
}
// The first aluminum batch must stand without an aluminum-based electronic
// circuit. Keep the real terrestrial bauxite + two-space-metal reduction path.
const aluminum='tfmg:aluminum_ingot',aluminumRoute='createch2:advanced_electric/mi/aluminum_from_bauxite_space_reduction';
const electronic='modern_industrialization:electronic_circuit',mat03='research:'+ledger.nodes.find(n=>n.code==='MAT-03').id;
const aluminumRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>id!==electronic&&(id!==aluminum||r.id===aluminumRoute))}));
const withoutElectronic=new Map([...frontier].filter(([id])=>id!==electronic));
const firstAluminumSolved=solve(aluminumRules,withoutElectronic);
const firstAluminum={truth:firstAluminumSolved.reached.has(aluminum)?'BOUNDED_FIRST_ALUMINUM_WITHOUT_ELECTRONIC_CIRCUIT':'INCOMPLETE_FIRST_ALUMINUM',route:aluminumRoute,witness:firstAluminumSolved.witness.get(aluminum)??null,electronicCircuitNotRequired:firstAluminumSolved.reached.has(aluminum),negativeCases:[],limits:['Uses specific reviewed world/return supplier contracts and the declared earlier-workshop frontier; actual mining, travel, batch quantities, power throughput and loaded unification remain runtime qualification.']};
if(firstAluminum.electronicCircuitNotRequired){
 const replaceControl=e=>e.id?e.id==='modern_industrialization:analog_circuit'?leaf(electronic):e:e.all?all(e.all.map(replaceControl)):any(e.any.map(replaceControl));
 const oldRules=aluminumRules.map(r=>r.id.startsWith('createch2:tfc_geology/advanced_electric/bauxite/')?{...r,requirements:replaceControl(r.requirements)}:r);
 assert(!solve(oldRules,withoutElectronic).reached.has(aluminum),'Old bauxite circuit prerequisite did not block the scoped bootstrap');
 firstAluminum.negativeCases.push({name:'old_electronic_catalyst',rejected:true});
 for(const blocked of [mat03,'stellaris:desh_ingot','stellaris:tharsite_ingot']){
  const seed=new Map([...withoutElectronic].filter(([id])=>id!==blocked));
  assert(!solve(aluminumRules.map(r=>({...r,outputs:r.outputs.filter(id=>id!==blocked)})),seed).reached.has(aluminum),'First aluminum bypasses '+blocked);
  firstAluminum.negativeCases.push({name:blocked,rejected:true});
 }
}
if(firstAluminum.electronicCircuitNotRequired){
 const repairs=read(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_space_bootstrap_repair.json'));
 const oldById=new Map(repairs.records.map(r=>[r.id,r.before]));
 const oldCoilRules=aluminumRules.map(r=>{const d=oldById.get(r.id);return d?{...r,requirements:all([inputs(d),machine(d.type,d),...(locks.get(r.id)??[]).map(leaf)])}:r;});
 assert(!solve(oldCoilRules,withoutElectronic).reached.has(aluminum),'Old64EU space reductions must fail the native first-coil bootstrap');
 firstAluminum.negativeCases.push({name:'old_64EU_coil_cycle',rejected:true});
 const withoutMachining=solve(aluminumRules.filter(r=>r.id!=='createch2:steel_steam/mi/invar_gear_from_heavy'),withoutElectronic);
 const canonicalGears=new Set(tagMembers('#c:gears/invar'));
 firstAluminum.alternativeGearSuppliers={reachesWithoutOwnedMachining:withoutMachining.reached.has(aluminum),witnesses:Object.fromEntries([...canonicalGears].filter(id=>withoutMachining.reached.has(id)).map(id=>[id,withoutMachining.witness.get(id)??'frontier'])),scope:'Canonical gear stock is required; no single manufacturer is claimed globally unique. The later scoped substrate plan still explicitly selects the conserved machining route.'};
 assert(!solve(aluminumRules.map(r=>({...r,outputs:r.outputs.filter(id=>!canonicalGears.has(id))})),new Map([...withoutElectronic].filter(([id])=>!canonicalGears.has(id)))).reached.has(aluminum),'First aluminum bypasses canonical invar gear stock');
 firstAluminum.negativeCases.push({name:'missing_canonical_invar_gear_stock',rejected:true});
 const noSteelBoiler=new Set(['modern_industrialization:steel_boiler']);
 assert(!solve(aluminumRules.map(r=>({...r,outputs:r.outputs.filter(id=>!noSteelBoiler.has(id))})),new Map([...withoutElectronic].filter(([id])=>!noSteelBoiler.has(id)))).reached.has(aluminum),'Long aluminum batch bypasses the nominal LV supply plan');
 firstAluminum.negativeCases.push({name:'missing_steel_boiler_supply',rejected:true});
 firstAluminum.longPowerPlan=nativeSteam.longLvPlan;
 firstAluminum.nativeColdworks=nativeColdworks;firstAluminum.energyPreservingRepair=repairs;
}
const notebook='sgjourney:archeologist_notebook',notebookId='createch2:offworld_archaeology/archeologist_notebook';
const lunarTargets=['pack:createch2:lunar_artifacts','research:'+ledger.nodes.find(n=>n.code==='FRN-04A').id,notebook];
const firstLunarStudy={truth:lunarTargets.every(id=>solved.reached.has(id))?'BOUNDED_LUNAR_MONUMENT_TO_NOTEBOOK':'INCOMPLETE_LUNAR_STUDY',witnesses:Object.fromEntries(lunarTargets.map(id=>[id,solved.witness.get(id)??null])),negativeCases:[],limits:['Specific native monument, deep-water squid and reviewed return suppliers under the declared earlier workshop frontier. Actual generation, ocean access/combat, quantities, symbol components and returned samples remain runtime qualification.']};
if(firstLunarStudy.truth==='BOUNDED_LUNAR_MONUMENT_TO_NOTEBOOK'){
 assert.deepEqual((producers.get(world.lunarArchaeology.item)??[]).map(r=>r.id),['world:lunar_anomaly_symbol']);
 for(const [name,blocked]of [
  ['no_monument_symbol',[world.lunarArchaeology.item]],
  ['no_moon_return_suppliers',[expeditionByDimension.get(world.lunarArchaeology.dimension)]],
  ['missing_SPC_05',['research:'+ledger.nodes.find(n=>n.code==='SPC-05').id]],
  ['no_ink',['minecraft:ink_sac']],
  ['no_lunar_sample',tagMembers('#createch2:geology/lunar_samples')]
 ]){
  const absent=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  const result=solve(recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed);
  assert(!result.reached.has(notebook),'Lunar study bypasses '+name);
  if(name==='no_ink')assert(result.reached.has('pack:createch2:lunar_artifacts'),'Ink is a notebook requirement, not a new dossier bill');
  firstLunarStudy.negativeCases.push({name,rejected:true});
 }
 let replaced=0;
 const oldSample=e=>e.id?e.id==='#createch2:geology/lunar_samples'?(replaced++,leaf('stellaris:moon_stone')):e:e.all?all(e.all.map(oldSample)):any(e.any.map(oldSample));
 const oldRecipes=recipes.map(r=>r.id===notebookId?{...r,requirements:oldSample(r.requirements)}:r);
 assert.equal(replaced,1);assert(!solve(oldRecipes,frontier).reached.has(notebook),'Old exact Moon-stone input unexpectedly passes the active-terrain model');
 firstLunarStudy.negativeCases.push({name:'old_exact_moon_stone',rejected:true});
}
const martianTargets=['pack:createch2:martian_records','research:'+ledger.nodes.find(n=>n.code==='FRN-04B').id];
const firstMartianStudy={truth:martianTargets.every(id=>solved.reached.has(id))?'BOUNDED_MARTIAN_RECORD_SUPPLIERS':'INCOMPLETE_MARTIAN_STUDY',witnesses:Object.fromEntries(martianTargets.map(id=>[id,solved.witness.get(id)??null])),negativeCases:[],limits:['Specific existing ruin-root glyphs and ordinary Mars stone composed with notebook/research and the reviewed Mars return supplier. Actual structure access, survival, quantities and returned inventory remain runtime qualification.']};
if(firstMartianStudy.truth==='BOUNDED_MARTIAN_RECORD_SUPPLIERS'){
 assert.deepEqual((producers.get(world.martianArchaeology.item)??[]).map(r=>r.id),['world:martian_records/'+world.martianArchaeology.item]);
 for(const [name,blocked]of [
  ['no_mars_return_suppliers',expeditionByDimension.get(world.martianArchaeology.dimension)],
  ['no_root_glyph',world.martianArchaeology.item],
  ['no_mars_stone',world.martianArchaeology.stoneSample],
  ['no_notebook',notebook],
  ['missing_FRN_04A','research:'+ledger.nodes.find(n=>n.code==='FRN-04A').id],
  ['no_moon_return_suppliers',expeditionByDimension.get(world.lunarArchaeology.dimension)]
 ]){
  const seed=new Map([...frontier].filter(([id])=>id!==blocked));
  const result=solve(recipes.map(r=>({...r,outputs:r.outputs.filter(id=>id!==blocked)})),seed);
  assert(!result.reached.has('pack:createch2:martian_records'),'Martian records bypass '+name);
  firstMartianStudy.negativeCases.push({name,rejected:true});
 }
}
const venusianTargets=['pack:createch2:venusian_field_data','research:'+ledger.nodes.find(n=>n.code==='FRN-04C').id];
const firstVenusianStudy={truth:venusianTargets.every(id=>solved.reached.has(id))?'BOUNDED_VENUSIAN_FIELD_SUPPLIERS':'INCOMPLETE_VENUSIAN_STUDY',witnesses:Object.fromEntries(venusianTargets.map(id=>[id,solved.witness.get(id)??null])),negativeCases:[],limits:[world.venusianArchaeology.limits,'The declared earlier factory and reviewed rocket, pressure-suit, oxygen and return-fuel suppliers remain conditions. Reachability supplies no actual inventory or completed research.']};
if(firstVenusianStudy.truth==='BOUNDED_VENUSIAN_FIELD_SUPPLIERS'){
 const route=ledger.pack_routes.find(r=>r.pack==='createch2:venusian_field_data');
 assert.equal(route.unlock_node,ledger.nodes.find(n=>n.code==='FRN-04B').id);
 assert.equal(route.output_count,5);assert.deepEqual(route.recipe.pattern,['PVP','SMS','PCP']);
 assert.equal(route.recipe.key.S,world.venusianArchaeology.item);assert.equal(route.recipe.key.V,world.venusianArchaeology.stoneSample);
 assert.equal(world.venusianArchaeology.rootSymbolCount,1);
 const method=read(path.join(liveRoot,'kubejs/data/createch2/researchd/research/frn_04c_dimensional_field_theory.json')).method;
 assert.equal(method.type,'researchd:consume_research_pack');assert.equal(method.count,5);assert(method.packs.includes(route.pack));
 firstVenusianStudy.dossierBatch={recipe:route.id,outputs:route.output_count,symbols:2,venusStone:1,paper:4,memoryCrystals:1,electronicCircuits:1,stationRootsRequired:2,frn04cPackCost:method.count,unconditionalStockCredited:0};
 // The Mercury relay supplies another native red symbol after the staged
 // Venus/Mercury trip. Keep that legitimate alternative in the global graph.
 assert.deepEqual((producers.get(world.venusianArchaeology.item)??[]).map(r=>r.id),['world:venusian_field/'+world.venusianArchaeology.item,'world:mercurian_relay/'+mercuryCargo.additionalSymbol]);
 for(const [name,blocked]of [
  ['no_venus_return_suppliers',expeditionByDimension.get(world.venusianArchaeology.dimension)],
  ['no_station_symbol',world.venusianArchaeology.item],['no_venus_stone',world.venusianArchaeology.stoneSample],
  ['no_memory_crystal','sgjourney:memory_crystal'],['no_electronic_circuit','modern_industrialization:electronic_circuit'],
  ['missing_FRN_04B','research:'+route.unlock_node],['no_martian_records','pack:createch2:martian_records'],
  ['no_lunar_artifacts','pack:createch2:lunar_artifacts']
 ]){
  const seed=new Map([...frontier].filter(([id])=>id!==blocked));
  const result=solve(recipes.map(r=>({...r,outputs:r.outputs.filter(id=>id!==blocked)})),seed);
  assert(!result.reached.has('pack:'+route.pack),'Venusian field data bypasses '+name);
  assert(!result.reached.has(venusianTargets[1]),'Dimensional field theory bypasses '+name);
  firstVenusianStudy.negativeCases.push({name,rejected:true});
 }
}
const mercuryTargets=[mercuryReturn,mercuryCargo.stoneSample,mercuryCargo.item,...mercuryCargo.minerals.map(r=>r.ordinaryOutput)];
const firstMercuryCargo={truth:mercuryTargets.every(id=>solved.reached.has(id))?'BOUNDED_NATIVE_STAGED_MERCURY_CARGO':'INCOMPLETE_MERCURY_CARGO',witnesses:Object.fromEntries(mercuryTargets.map(id=>[id,solved.witness.get(id)??null])),travel:mercuryTrip,world:mercuryCargo,negativeCases:[],additionalSymbol:{item:mercuryCargo.additionalSymbol,source:'world:mercurian_relay/'+mercuryCargo.additionalSymbol,alternativeToVenusStation:true},mercurianCoordinatesReached:solved.reached.has('pack:createch2:mercurian_coordinates'),stockCredited:0,observedOutputs:false,limits:[...mercuryTrip.limits,mercuryCargo.limits,'Physical cargo supplier kinds only under the existing factory frontier. The Mercurian Coordinates recipe and its quantum circuit/research prerequisites remain unchanged.']};
if(firstMercuryCargo.truth==='BOUNDED_NATIVE_STAGED_MERCURY_CARGO'){
 const route=ledger.pack_routes.find(r=>r.pack==='createch2:mercurian_coordinates');
 assert.equal(route.unlock_node,'createch2:frn_04c_dimensional_field_theory');
 assert.deepEqual(route.recipe.key,{P:'minecraft:paper',M:mercuryCargo.stoneSample,C:'minecraft:compass',E:mercuryCargo.item,Q:'modern_industrialization:quantum_circuit'});
 firstMercuryCargo.remainingDossierInputs=Object.values(route.recipe.key).filter(id=>!solved.reached.has(id));
 assert(solved.evaluate(recipes.find(r=>r.id===firstMercuryCargo.additionalSymbol.source).requirements));
 for(const[name,blocked]of [['no_venus_stop_suppliers',expeditionByDimension.get('stellaris:venus')],['no_mercury_trip',mercuryReturn],['no_fuel_buckets','stellaris:fuel_bucket'],['no_oxygen_service','capability:stellaris_suit_oxygen_service'],['no_pressure_suit_boots','stellaris:space_suit_boots'],['no_selected_mining_tool','tfc:metal/pickaxe/bronze']]){
  const seed=new Map([...frontier].filter(([id])=>id!==blocked)),test=solve(recipes.map(r=>({...r,outputs:r.outputs.filter(id=>id!==blocked)})),seed);
  assert(!test.reached.has(mercuryCargo.stoneSample),'Mercury terrain bypasses '+name);assert(!test.reached.has(mercuryCargo.item),'Mercury cartouche bypasses '+name);
  for(const source of mercuryCargo.minerals)assert(!test.reached.has(source.ordinaryOutput),'Mercury mineral bypasses '+name+': '+source.feature);
  firstMercuryCargo.negativeCases.push({name,rejected:true});
 }
 for(const[id,target]of [['world:mercurian_relay/'+mercuryCargo.item,mercuryCargo.item],['world:mercurian_relay/'+mercuryCargo.stoneSample,mercuryCargo.stoneSample],...mercuryCargo.minerals.map(r=>['world:mercury_mining/'+r.feature,r.ordinaryOutput])]){
  assert(!solve(recipes.filter(r=>r.id!==id),frontier).reached.has(target),'Mercury cargo bypasses the selected source '+id);
  firstMercuryCargo.negativeCases.push({name:'no_source:'+id,rejected:true});
 }
}
const processorTargets=['tfc_metallurgy:ore/normal_monazite','tfc_metallurgy:ore/normal_native_platinum','modern_industrialization:cadmium_dust','modern_industrialization:cadmium_battery','modern_industrialization:platinum_plate','modern_industrialization:platinum_fine_wire','tfc:ore/emerald','tfc:gem/emerald','modern_industrialization:emerald_plate','modern_industrialization:memory_management_unit','modern_industrialization:processing_unit_board','modern_industrialization:processing_unit'];
const firstProcessingUnit={truth:processorTargets.every(id=>solved.reached.has(id))?'BOUNDED_NATIVE_LUNAR_AND_TFC_PROCESSING_UNIT':'INCOMPLETE_PROCESSING_UNIT',targets:processorTargets,missing:processorTargets.filter(id=>!solved.reached.has(id)),witnesses:Object.fromEntries(processorTargets.map(id=>[id,solved.witness.get(id)??null])),emeraldProjection:nativeProcessingUnit.emeraldProjection,negativeCases:[],stockCredited:0,observedOutputs:false,limits:[...nativeProcessingUnit.limits,'Selected active-Moon and TFC-panning sources under the declared workshop frontier; global source uniqueness is not claimed. Other real planetary deposits remain outside this particular return contract.']};
if(firstProcessingUnit.truth==='BOUNDED_NATIVE_LUNAR_AND_TFC_PROCESSING_UNIT'){
 const final='modern_industrialization:processing_unit';
 for(const[name,blocked]of [['no_emerald_plate',tagMembers('#c:plates/emerald')],['no_cadmium',tagMembers('#c:dusts/cadmium')],['no_cadmium_battery',['modern_industrialization:cadmium_battery']],['no_platinum_plates',tagMembers('#c:plates/platinum')],['no_fine_wire',['modern_industrialization:platinum_fine_wire']],['no_memory_management',['modern_industrialization:memory_management_unit']],['no_processor_board',['modern_industrialization:processing_unit_board']],['no_pvc',['fluid:modern_industrialization:polyvinyl_chloride']]]){
  const absent=new Set(blocked);assert(absent.size,name);const seed=new Map([...frontier].filter(([id])=>!absent.has(id))),test=solve(recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed);
  assert(!test.reached.has(final),'First Processing Unit bypasses '+name);
  firstProcessingUnit.negativeCases.push({name,rejected:true});
 }
 const gem='tfc:gem/emerald',raw=nativeProcessingUnit.emeraldProjection.original,projected=nativeProcessingUnit.emeraldProjection.projected;
 assert.notEqual(raw.item_inputs[0].item,gem);assert(tags.hasTag(projected.item_inputs[0].tag,gem));
 firstProcessingUnit.rawLiteralDoesNotMatchSelectedGem=true;
}
const starlightTargets=['eternal_starlight:orb_of_prophecy',starlightReturn,'eternal_starlight:starcore','eternal_starlight:raw_deepsilver','eternal_starlight:deepsilver_ingot','eternal_starlight:raw_aethersent','eternal_starlight:aethersent_ingot','pack:createch2:frontier_observations'];
const firstStarlight={truth:starlightTargets.every(id=>solved.reached.has(id))?'BOUNDED_NATIVE_STARLIGHT_RETURN_FEEDSTOCKS':'INCOMPLETE_STARLIGHT_FEEDSTOCKS',targets:starlightTargets,missing:starlightTargets.filter(id=>!solved.reached.has(id)),witnesses:Object.fromEntries(starlightTargets.map(id=>[id,solved.witness.get(id)??null])),negativeCases:[],stockCredited:0,observedOutputs:false,limits:[...starlightWorld.limits,...nativeStarlight.limits,'Kind reachability under the declared earlier-factory frontier. This does not fund a whole expedition or establish a guaranteed finite meteor wait, completed trial, actual return, superconductor or whole17-age acceptance.']};
if(firstStarlight.truth==='BOUNDED_NATIVE_STARLIGHT_RETURN_FEEDSTOCKS'){
 for(const[name,blocked,target]of [['no_ruins_trial',starlightSurvey,'eternal_starlight:orb_of_prophecy'],['no_orb','eternal_starlight:orb_of_prophecy','eternal_starlight:starcore'],['no_return_route',starlightReturn,'eternal_starlight:starcore'],['no_raw_deepsilver','eternal_starlight:raw_deepsilver','eternal_starlight:deepsilver_ingot'],['no_raw_aethersent','eternal_starlight:raw_aethersent','eternal_starlight:aethersent_ingot'],['no_starcore','eternal_starlight:starcore','pack:createch2:frontier_observations'],['no_frontier_research','research:createch2:frn_03_frontier_observation','pack:createch2:frontier_observations']]){
  const seed=new Map([...frontier].filter(([id])=>id!==blocked)),test=solve(recipes.map(r=>({...r,outputs:r.outputs.filter(id=>id!==blocked)})),seed);
  assert(!test.reached.has(target),'Starlight supplier bypasses '+name);firstStarlight.negativeCases.push({name,rejected:true});
 }
}
const superconductorTargets=['stellaris:raw_corronium','stellaris:corronium_ingot','tfc_metallurgy:ore/normal_spodumene','tfmg:crushed_raw_lithium','mekanism:dust_lithium','modern_industrialization:superconductor_dust','modern_industrialization:superconductor_hot_ingot','modern_industrialization:superconductor_ingot','modern_industrialization:superconductor_wire','modern_industrialization:superconductor_cable','modern_industrialization:qubit'];
const firstSuperconductor={truth:superconductorTargets.every(id=>solved.reached.has(id))?'BOUNDED_NATIVE_RETURNED_SUPERCONDUCTOR_AND_QUBIT':'INCOMPLETE_SUPERCONDUCTOR',targets:superconductorTargets,missing:superconductorTargets.filter(id=>!solved.reached.has(id)),witnesses:Object.fromEntries(superconductorTargets.map(id=>[id,solved.witness.get(id)??null])),lithiumRepair:nativeSuperconductor.repair,negativeCases:[],stockCredited:0,observedOutputs:false,limits:[...nativeSuperconductor.limits,'Supplier kinds only. This does not supply the unresolved Plutonium Battery or a first Quantum Circuit, nor pay the entire17-age factory, fuel, tool and expedition bill.']};
if(firstSuperconductor.truth==='BOUNDED_NATIVE_RETURNED_SUPERCONDUCTOR_AND_QUBIT'){
 for(const[name,absent,target]of [['no_corronium',['stellaris:corronium_ingot'],'modern_industrialization:superconductor_dust'],['no_canonical_lithium',tagMembers('#c:dusts/lithium'),'modern_industrialization:superconductor_dust'],['no_starcore',['eternal_starlight:starcore'],'modern_industrialization:superconductor_dust'],['no_aethersent',['eternal_starlight:aethersent_ingot'],'modern_industrialization:superconductor_dust'],['no_deepsilver',['eternal_starlight:deepsilver_ingot'],'modern_industrialization:superconductor_dust'],['no_GEO03',['research:createch2:geo_03_deep_extraction'],'mekanism:dust_lithium'],['no_hot_ingot',['modern_industrialization:superconductor_hot_ingot'],'modern_industrialization:superconductor_ingot'],['no_wire',['modern_industrialization:superconductor_wire'],'modern_industrialization:qubit'],['no_cooling_cell',['modern_industrialization:cooling_cell'],'modern_industrialization:superconductor_cable']]){
  const blocked=new Set(absent);assert(blocked.size,name);const seed=new Map([...frontier].filter(([id])=>!blocked.has(id))),test=solve(recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!blocked.has(id))})),seed);assert(!test.reached.has(target),'Superconductor bypasses '+name);firstSuperconductor.negativeCases.push({name,rejected:true});
 }
}
const infuserTargets=['mekanism:metallurgic_infuser','chemical:mekanism:redstone','chemical:mekanism:diamond','mekanism:basic_control_circuit','mekanism:alloy_infused','mekanism:alloy_reinforced','mekanism:advanced_control_circuit'];
const infuserSelections=new Map([[infuserTargets[0],nativeMekInfuser.ids.machine],[infuserTargets[1],nativeMekInfuser.ids.redstone],[infuserTargets[2],nativeMekInfuser.ids.diamond],[infuserTargets[3],nativeMekInfuser.ids.basic],[infuserTargets[4],nativeMekInfuser.ids.infused],[infuserTargets[5],nativeMekInfuser.ids.reinforced],[infuserTargets[6],nativeMekInfuser.ids.advanced]]);
const infuserRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!infuserSelections.has(id)||infuserSelections.get(id)===r.id)})),infuserSolved=solve(infuserRules,frontier);
const firstMekInfuser={truth:infuserTargets.every(id=>infuserSolved.reached.has(id))?'BOUNDED_NATIVE_MEK_INFUSER_CONTROLS':'INCOMPLETE_MEK_INFUSER_CONTROLS',targets:infuserTargets,missing:infuserTargets.filter(id=>!infuserSolved.reached.has(id)),witnesses:Object.fromEntries(infuserTargets.map(id=>[id,infuserSolved.witness.get(id)??null])),finiteComposition:nativeMekInfuser.finiteComposition,negativeCases:[],stockCredited:0,observedOutputs:false,limits:nativeMekInfuser.limits};
if(firstMekInfuser.truth==='BOUNDED_NATIVE_MEK_INFUSER_CONTROLS'){
 for(const[name,absent,target]of [['no_infuser',['mekanism:metallurgic_infuser'],'mekanism:basic_control_circuit'],['no_redstone_energy',[nativeMekInfuser.energyService],'mekanism:basic_control_circuit'],['no_redstone_infusion',['chemical:mekanism:redstone'],'mekanism:basic_control_circuit'],['no_electronic_circuit',['modern_industrialization:electronic_circuit'],'mekanism:basic_control_circuit'],['no_diamond_infusion',['chemical:mekanism:diamond'],'mekanism:alloy_reinforced'],['no_infused_alloy',['mekanism:alloy_infused'],'mekanism:alloy_reinforced'],['no_basic_controls',['mekanism:basic_control_circuit'],'mekanism:advanced_control_circuit'],['no_reinforced_alloy',['mekanism:alloy_reinforced'],'mekanism:advanced_control_circuit']]){
  const blocked=new Set(absent),seed=new Map([...frontier].filter(([id])=>!blocked.has(id))),test=solve(infuserRules.map(r=>({...r,outputs:r.outputs.filter(id=>!blocked.has(id))})),seed);assert(!test.reached.has(target),'Infuser bypasses '+name);firstMekInfuser.negativeCases.push({name,rejected:true});
 }
}
// First electronic controls retain a specific TFC sapphire prototype path;
// later chemical or batch producers cannot stand in for its first acquisition.
const electronicId='createch2:modern_industrialization/electronic_circuit_gem_lattice';
const electronicTarget='modern_industrialization:electronic_circuit';
const electronicRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>
 id!==electronicTarget||r.id===electronicId).filter(id=>
 id!=='tfc:gem/sapphire'||r.id==='tfc:crafting/gem/sapphire').filter(id=>
 id!=='tfc:ore/sapphire'||r.kind==='native_tfc_chalk_hand_panning')}));
const electronicSolved=solve(electronicRules,frontier);
const firstElectronicCircuit={truth:electronicSolved.reached.has(electronicTarget)?'BOUNDED_NATIVE_SAPPHIRE_ELECTRONIC_PROTOTYPE':'INCOMPLETE_ELECTRONIC_PROTOTYPE',route:electronicId,witness:electronicSolved.witness.get(electronicTarget)??null,negativeCases:[],limits:['Specific native chalk deposits, hand-pan luck, TFC polishing and the authored prototype under the explicit workshop frontier. Actual deposit search, quantities, material processing and electronics operation remain runtime qualification.']};
if(firstElectronicCircuit.truth==='BOUNDED_NATIVE_SAPPHIRE_ELECTRONIC_PROTOTYPE'){
 assert.equal(firstElectronicCircuit.witness,electronicId);
 const later='research:'+ledger.nodes.find(n=>n.code==='PRE-03').id;
 const earlySeed=new Map([...frontier].filter(([id])=>id!==later));
 const earlyRules=electronicRules.map(r=>({...r,outputs:r.outputs.filter(id=>id!==later)}));
 assert(solve(earlyRules,earlySeed).reached.has(electronicTarget),'Age8 electronic prototype requires later electronic metrology');
 firstElectronicCircuit.laterElectronicMetrologyNotRequired=true;
 const previous='research:'+ledger.nodes.find(n=>n.code==='PRE-02').id;
 const lateGate=e=>e.id?e.id===previous?leaf(later):e:e.all?all(e.all.map(lateGate)):any(e.any.map(lateGate));
 assert(!solve(earlyRules.map(r=>r.id===electronicId?{...r,requirements:lateGate(r.requirements)}:r),earlySeed).reached.has(electronicTarget),'Late prototype-owner regression was not rejected');
 firstElectronicCircuit.negativeCases.push({name:'late_PRE_03_owner',rejected:true});
 for(const blocked of ['tfc:pan/empty','tfc:sandpaper','tfc:gem/sapphire','modern_industrialization:electronic_circuit_board','tfmg:transistor_item','research:'+ledger.nodes.find(n=>n.code==='PRE-02').id]){
  const seed=new Map([...frontier].filter(([id])=>id!==blocked));
  const result=solve(electronicRules.map(r=>({...r,outputs:r.outputs.filter(id=>id!==blocked)})),seed);
  assert(!result.reached.has(electronicTarget),'Electronic prototype bypasses '+blocked);
  firstElectronicCircuit.negativeCases.push({name:blocked,rejected:true});
 }
}
const steelVatItem='tfmg:steel_chemical_vat',steelVatRecipe='createch2:heavy_industry/tfmg/steel_chemical_vat';
const firstSteelVat={truth:solved.reached.has(steelVatItem)?'BOUNDED_STEEL_CHEMICAL_VAT_MANUFACTURE':'INCOMPLETE_STEEL_CHEMICAL_VAT',route:steelVatRecipe,witness:solved.witness.get(steelVatItem)??null,negativeCases:[],limits:['Unchanged native bill/yield and CHE-01 ownership composed with the existing mixed workshop suppliers. Native vat chemistry, arrangement, heat/pressure, fluid handling and operation are separate requirements.']};
if(firstSteelVat.truth==='BOUNDED_STEEL_CHEMICAL_VAT_MANUFACTURE'){
 assert.equal(firstSteelVat.witness,steelVatRecipe);
 assert.deepEqual((producers.get(steelVatItem)??[]).map(r=>r.id),[steelVatRecipe]);
 for(const [name,blocked]of [
  ['no_heavy_plate',['tfmg:heavy_plate']],
  ['no_nickel_plate',tagMembers('#c:plates/nickel')],
  ['no_steel_tank',['tfmg:steel_fluid_tank']],
  ['missing_CHE_01',['research:'+ledger.nodes.find(n=>n.code==='CHE-01').id]]
 ]){
  const absent=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  assert(!solve(recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed).reached.has(steelVatItem),'Steel vat bypasses '+name);
  firstSteelVat.negativeCases.push({name,rejected:true});
 }
 assert(!solve(recipes.filter(r=>r.id!==steelVatRecipe),frontier).reached.has(steelVatItem),'Pre-repair missing-producer case unexpectedly passes');
 firstSteelVat.negativeCases.push({name:'missing_owned_manufacturer',rejected:true});
}
const ethylene='fluid:tfmg:ethylene';
const crackingRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>id!==ethylene||r.id===vatCrackingId)}));
const crackingSeed=new Map([...frontier].filter(([id])=>id!==ethylene)),crackingSolved=solve(crackingRules,crackingSeed);
const firstVatProcessing={truth:crackingSolved.reached.has(ethylene)?'BOUNDED_NATIVE_NAPHTHA_VAT_CRACKING':'INCOMPLETE_NATIVE_NAPHTHA_VAT_CRACKING',route:vatCrackingId,witness:crackingSolved.witness.get(ethylene)??null,negativeCases:[],limits:['Only the existing 500mB naphtha→250mB ethylene+250mB propylene recipe is scoped here; alternate ethylene producers are removed for this test.','Actual quantities, gear arrangement, shaft stress/RPM, fluid transfer, machine mode, firebox operation and loaded chemical processing remain runtime qualification.']};
if(firstVatProcessing.truth==='BOUNDED_NATIVE_NAPHTHA_VAT_CRACKING'){
 assert.equal(firstVatProcessing.witness,vatCrackingId);
 for(const [name,blocked]of [
  ['no_allowed_vessel',Object.values(vatItems)],['no_heat',['capability:tfmg_tower_heat']],
  ['no_fluid_handling',['capability:tfmg_vat_fluid_handling']],['no_naphtha',['fluid:tfmg:naphtha']],
  ...Object.keys(nativeVat.drive.hardware).map(id=>[id,[id]])
 ]){
  const absent=new Set(blocked),seed=new Map([...crackingSeed].filter(([id])=>!absent.has(id)));
  assert(!solve(crackingRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed).reached.has(ethylene),'Naphtha vat bypasses '+name);
  firstVatProcessing.negativeCases.push({name,rejected:true});
 }
}
const geologicalAcidId='createch2:heavy_industry/tfmg/sulfuric_acid_tfc_minerals',acidTarget='fluid:tfmg:sulfuric_acid';
const acidSources=new Map([
 ['tfc:ore/sulfur',r=>r.kind==='active_tfc_chemical_mineral'],
 ['tfc:ore/saltpeter',r=>r.kind==='active_tfc_chemical_mineral'],
 ['tfc:powder/sulfur',r=>r.id==='tfc:quern/powder/sulfur'],
 ['tfc:powder/saltpeter',r=>r.id==='tfc:quern/powder/saltpeter'],
 [acidTarget,r=>r.id===geologicalAcidId]
]);
for(const id of acidSources.keys())assert(!frontier.has(id),'Acid supply must be manufactured: '+id);
const acidRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!acidSources.has(id)||acidSources.get(id)(r))})),acidSolved=solve(acidRules,frontier);
const firstGeologicalAcid={truth:acidSolved.reached.has(acidTarget)?'BOUNDED_TFC_MINERALS_TO_NATIVE_ACID':'INCOMPLETE_TFC_MINERAL_ACID',route:geologicalAcidId,witness:acidSolved.witness.get(acidTarget)??null,negativeCases:[],limits:['Specific native saltpeter/chalk and sulfur/granite veins, ordinary mining and quern/handstone powders under the existing workshop frontier. Other dust/acid producers are excluded only in this scoped test.','Native four-powder quern yields and three-sulfur/one-saltpeter/1000water→500acid batch are preserved. Actual mineral search, quantities, chemical operation, blade mode and power remain runtime qualification.']};
if(firstGeologicalAcid.truth==='BOUNDED_TFC_MINERALS_TO_NATIVE_ACID'){
 assert.equal(firstGeologicalAcid.witness,geologicalAcidId);
 for(const [name,blocked]of [
  ['no_sulfur_ore',['tfc:ore/sulfur']],['no_saltpeter_ore',['tfc:ore/saltpeter']],
  ['no_quern',['tfc:quern']],['no_handstone',tagMembers('#tfc:quern_handstones')],['no_water',['fluid:minecraft:water']],
  ['no_steel_or_fireproof',['tfmg:steel_chemical_vat','tfmg:fireproof_chemical_vat']],
  ['no_mixing_service',['capability:tfmg_vat_mixing']],['missing_CHE_01',['research:'+ledger.nodes.find(n=>n.code==='CHE-01').id]]
 ]){
  const absent=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  assert(!solve(acidRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed).reached.has(acidTarget),'Geological acid bypasses '+name);
  firstGeologicalAcid.negativeCases.push({name,rejected:true});
 }
 assert(!solve(acidRules.filter(r=>r.id!==geologicalAcidId),frontier).reached.has(acidTarget),'Missing geological acid producer unexpectedly passes');
 firstGeologicalAcid.negativeCases.push({name:'missing_owned_manufacturer',rejected:true});
}
const connector='tfmg:cable_connector',connectorId='tfmg:crafting/materials/cable_connector',fractionId='createch2:steel_steam/tfmg/steel_nuggets';
const steelFractions=new Set(tagMembers('#c:nuggets/steel'));
const connectorRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>(!steelFractions.has(id)||id==='tfmg:steel_nugget'&&r.id===fractionId)&&(id!==connector||r.id===connectorId))}));
assert(!frontier.has(connector)&&![...steelFractions].some(id=>frontier.has(id)),'Connector/steel fractions must be manufactured');
const connectorSolved=solve(connectorRules,frontier);
const firstCableConnector={truth:connectorSolved.reached.has(connector)?'BOUNDED_NATIVE_CABLE_CONNECTOR_MANUFACTURE':'INCOMPLETE_NATIVE_CABLE_CONNECTOR',route:connectorId,witness:connectorSolved.witness.get(connector)??null,steelFractionRoute:fractionId,negativeCases:[],limits:['Canonical native1ingot→9steel fractions and the unchanged native3nuggets/ceramic/copper connector bill under the declared workshop frontier. This is connector manufacture, not an FE source, wire spool components, live network, voltage/current or electrode-service proof.']};
if(firstCableConnector.truth==='BOUNDED_NATIVE_CABLE_CONNECTOR_MANUFACTURE'){
 assert.equal(firstCableConnector.witness,connectorId);
 assert.equal(connectorSolved.witness.get('tfmg:steel_nugget'),fractionId);
 for(const [name,blocked]of [
  ['no_steel_ingot',tagMembers('#c:ingots/steel')],['no_ceramic_insulator',['tfmg:unfinished_insulator']],
  ['no_copper_ingot',['minecraft:copper_ingot']],['no_steel_fractions',[...steelFractions]],
  ['missing_THM_02',['research:'+ledger.nodes.find(n=>n.code==='THM-02').id]]
 ]){
  const absent=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  assert(!solve(connectorRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed).reached.has(connector),'Connector manufacture bypasses '+name);
  firstCableConnector.negativeCases.push({name,rejected:true});
 }
 assert(!solve(connectorRules.filter(r=>r.id!==fractionId),frontier).reached.has(connector),'Pre-repair missing fraction manufacturer unexpectedly passes');
 firstCableConnector.negativeCases.push({name:'missing_owned_fraction_manufacturer',rejected:true});
}
const chlorineTarget='fluid:modern_industrialization:chlorine',chlorineId='createch2:chemical_age/mi/chlorine_from_geological_salt';
const saltMembers=new Set(tagMembers('#createch2:chemical_salt'));
assert(saltMembers.has('tfc:powder/salt'));
for(const id of [...saltMembers,chlorineTarget,'capability:industrial_power'])assert(!frontier.has(id),'Geological chlorine must not inherit '+id);
// Bound the first route to mined halite and native LV steam generation. Other
// salt/chlorine suppliers and the EE power alternative remain in the full model.
const chlorineRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>(!saltMembers.has(id)||id==='tfc:powder/salt'&&r.kind==='active_tfc_halite_mining')&&(id!==chlorineTarget||r.id===chlorineId)&&(id!=='capability:industrial_power'||r.id==='native:mi_steam_service'))}));
const chlorineSolved=solve(chlorineRules,frontier);
const firstGeologicalChlorine={truth:chlorineSolved.reached.has(chlorineTarget)?'BOUNDED_TFC_HALITE_TO_MI_CHLORINE':'INCOMPLETE_TFC_HALITE_CHLORINE',route:chlorineId,powerBudget:{requiredEu:8,nativeTurbineMaxEu:lvSteamMaxEu,fits:8<=lvSteamMaxEu},witness:chlorineSolved.witness.get(chlorineTarget)??null,negativeCases:[],limits:['Specific active halite vein, ordinary1–3salt-powder mining drop and native bronze mining tool under the declared workshop frontier. No free salt or arbitrary loot, and no quern requirement for this direct drop.','Native MI batch retains2salt→125mBchlorine+1sodium dust,8EU/t and400ticks. The native LV steam-turbine service is the only industrial-power producer in this scoped test;8EU/t fits its32EU/t rating. Quantities, generation/flow, wiring, output handling and actual operation remain runtime qualification.','The TFMG FE/electrode/brine path is separate and remains open.']};
if(firstGeologicalChlorine.truth==='BOUNDED_TFC_HALITE_TO_MI_CHLORINE'){
 assert.equal(firstGeologicalChlorine.witness,chlorineId);
 assert.equal(chlorineSolved.witness.get('tfc:powder/salt'),'world:tfc_halite_salt');
 assert.equal(chlorineSolved.witness.get('capability:industrial_power'),'native:mi_steam_service');
 for(const [name,blocked]of [
  ['no_geological_salt',[...saltMembers]],['no_prospecting',['capability:terrestrial_prospecting']],
  ['no_mining_tool',['tfc:metal/pickaxe/bronze']],['no_electrolyzer',['modern_industrialization:electrolyzer']],
  ['no_steam_turbine',['modern_industrialization:lv_steam_turbine']],['no_boiler',['modern_industrialization:bronze_boiler']],
  ['no_water',['fluid:minecraft:water']],['no_charcoal',['minecraft:charcoal']],
  ['missing_CHE_02',['research:'+ledger.nodes.find(n=>n.code==='CHE-02').id]]
 ]){
  const absent=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  assert(!solve(chlorineRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed).reached.has(chlorineTarget),'Geological chlorine bypasses '+name);
  firstGeologicalChlorine.negativeCases.push({name,rejected:true});
 }
 assert(!solve(chlorineRules.filter(r=>r.id!==chlorineId),frontier).reached.has(chlorineTarget),'Missing geological chlorine manufacturer unexpectedly passes');
 firstGeologicalChlorine.negativeCases.push({name:'missing_owned_manufacturer',rejected:true});
}
const pvcBoard='chemica:etched_pvc_circuit_board',pvcFluid='fluid:modern_industrialization:polyvinyl_chloride';
const pvcIds={steam:'native:mi_boiler_steam',cracking:'modern_industrialization:petrochem/steam_cracking/naphtha',acetylene:'modern_industrialization:petrochem/distillation/steam_cracked_naphtha_1',hydrogen:'modern_industrialization:materials/electrolyzer/water',acid:'modern_industrialization:materials/chemical_reactor/hydrochloric_acid',vinyl:'modern_industrialization:oil/chemical_reactor/vinyl_chloride',polymer:'modern_industrialization:petrochem/polymerization/vinyl_chloride_lead',lead:'modern_industrialization:materials/lead/macerator/nugget',sheet:'chemica:casting/polyvinyl_chloride',blank:'chemica:crafting/empty_pvc_circuit_board',coated:'chemica:deploying/coated_pvc_circuit_board',etched:'chemica:vat_machine_recipe/vat_reaction/etched_pvc_circuit_board'};
const pvcSelected=new Map([
 ['fluid:modern_industrialization:steam',pvcIds.steam],['fluid:modern_industrialization:steam_cracked_naphtha',pvcIds.cracking],
 ['fluid:modern_industrialization:acetylene',pvcIds.acetylene],['fluid:modern_industrialization:hydrogen',pvcIds.hydrogen],
 ['fluid:modern_industrialization:hydrochloric_acid',pvcIds.acid],['fluid:modern_industrialization:vinyl_chloride',pvcIds.vinyl],
 [pvcFluid,pvcIds.polymer],['fluid:chemica:polyvinyl_chloride',null],
 ['chemica:polyvinyl_chloride_sheet',pvcIds.sheet],['chemica:empty_pvc_circuit_board',pvcIds.blank],
 ['chemica:coated_pvc_circuit_board',pvcIds.coated],[pvcBoard,pvcIds.etched],[acidTarget,geologicalAcidId]
]);
const leadTiny=new Set(tagMembers('#c:tiny_dusts/lead'));
for(const id of [...pvcSelected.keys(),...leadTiny])assert(!frontier.has(id),'PVC board must not inherit '+id);
const pvcRules=chlorineRules.map(r=>({...r,outputs:r.outputs.filter(id=>(!pvcSelected.has(id)||r.id===pvcSelected.get(id))&&(!leadTiny.has(id)||id==='modern_industrialization:lead_tiny_dust'&&r.id===pvcIds.lead))}));
const pvcSolved=solve(pvcRules,frontier);
const batchIds=[chlorineId,...['cracking','acetylene','hydrogen','acid','vinyl','polymer','lead'].map(k=>pvcIds[k])];
const powerBatches=batchIds.map(id=>{const data=authored.get(id)??native.recipes[id]?.[0].data;assert(data&&recipes.some(r=>r.id===id),'Missing active PVC supplier '+id);assert(data.eu<=nativeSteam.lvTurbine.maxEuPerTick);assert(data.eu*data.duration<=nativeSteam.lvTurbine.steamTankCapacity*nativeSteam.lvTurbine.euPerSteam,'Precharged turbine cannot cover batch '+id);return {id,eu:data.eu,ticks:data.duration,batchEu:data.eu*data.duration};});
assert.deepEqual(new Set(castingAdmissions.map(r=>r.id)),new Set(castingContract.recipes.map(r=>r.id)),'Casting admission census drift');
const pvcCasting=castingAdmissions.find(r=>r.id===pvcIds.sheet);assert.equal(pvcCasting.amount,144);assert(tagMembers('fluid:#c:polyvinyl_chloride').includes(pvcFluid));
const batchData=id=>authored.get(id)??native.recipes[id]?.[0].data;
assert.deepEqual(batchData(pvcIds.cracking).fluid_inputs,[{amount:1000,fluid:'modern_industrialization:naphtha'},{amount:100,fluid:'modern_industrialization:steam'}]);
assert.deepEqual(batchData(pvcIds.acetylene).fluid_outputs,[{amount:50,fluid:'modern_industrialization:acetylene'}]);
assert.deepEqual(batchData(pvcIds.vinyl).fluid_inputs,[{fluid:'modern_industrialization:acetylene',amount:1000},{fluid:'modern_industrialization:hydrochloric_acid',amount:1000}]);
assert.deepEqual(batchData(pvcIds.polymer).item_inputs,[{amount:4,tag:'c:tiny_dusts/lead'}]);
assert.deepEqual(batchData(pvcIds.polymer).fluid_inputs,[{amount:500,fluid:'modern_industrialization:vinyl_chloride'}]);
assert.deepEqual(batchData(pvcIds.polymer).fluid_outputs,[{amount:300,fluid:'modern_industrialization:polyvinyl_chloride'}]);
assert.deepEqual(batchData(pvcIds.blank).pattern,[' a ','bbb']);assert.equal(batchData(pvcIds.blank).result.count,1);
const pvcQuantityPlan={runs:{[chlorineId]:8,[pvcIds.hydrogen]:1,[pvcIds.acid]:1,[pvcIds.cracking]:20,[pvcIds.acetylene]:20,[pvcIds.vinyl]:1,[pvcIds.polymer]:2,[pvcIds.lead]:8,[pvcIds.sheet]:3,[pvcIds.blank]:1,[pvcIds.coated]:1,[pvcIds.etched]:1,[geologicalAcidId]:1},selectedStock:{saltPowder:16,naphthaMb:20000,crackingSteamMb:2000,leadTinyDust:8,lightGrayDye:1,silverPlate:1,sulfurPowder:3,saltpeterPowder:1},pvcProducedMb:600,sheets:3,pvcPerSheetMb:pvcCasting.amount,pvcConsumedMb:3*pvcCasting.amount,pvcRemainingMb:600-3*pvcCasting.amount,etchedBoards:1,scope:'A constructive native-batch schedule; actual inventories, all preceding stock quantities and operation are not certified.'};
assert.equal(pvcQuantityPlan.pvcRemainingMb,168);
const firstPvcBoard={truth:pvcSolved.reached.has(pvcBoard)?'BOUNDED_NATIVE_MI_PVC_TO_ETCHED_BOARD':'INCOMPLETE_NATIVE_PVC_BOARD',target:pvcBoard,witness:pvcSolved.witness.get(pvcBoard)??null,routes:{chlorine:chlorineId,geologicalAcid:geologicalAcidId,...pvcIds},quantityPlan:pvcQuantityPlan,powerBatches,finitePowerPlan:{runSequentially:true,rechargeBetweenBatches:true,turbineSteamCapacity:nativeSteam.lvTurbine.steamTankCapacity,euPerSteam:nativeSteam.lvTurbine.euPerSteam,maximumBatchEu:Math.max(...powerBatches.map(b=>b.batchEu)),turbineEnergyCapacity:nativeSteam.lvTurbine.energyCapacity,sustainedBoilerThroughputClaimed:false},casting:pvcCasting,negativeCases:[],limits:['Existing native MI reaction chain and exact reviewed144mB casting payload under the declared earlier-workshop frontier; no molten polymer, steam, chlorine, sheets or boards are free stock. The alternative Chemica polymer-fluid producer is excluded only in this scoped proof.','The native turbine steam tank can hold more energy than any individual modeled MI batch. Precharge it between batches and use one consumer at a time; this is a finite stored-energy construction, not sustained throughput or actually charged storage.','Actual water/solid-fuel consumption, hot boiler, pipe/cable layout, machine inventories, native unification and casting/etching operation remain runtime qualification. Whole geology-to-campaign and digital-circuit/AE2 closure are separate.']};
if(firstPvcBoard.truth==='BOUNDED_NATIVE_MI_PVC_TO_ETCHED_BOARD'){
 assert.equal(firstPvcBoard.witness,pvcIds.etched);
 for(const [name,blocked]of [
  ['no_salt',[...saltMembers]],['no_naphtha',['fluid:modern_industrialization:naphtha']],
  ['no_steam',['fluid:modern_industrialization:steam']],['no_lead_tiny_dust',[...leadTiny]],
  ['no_hydrogen',['fluid:modern_industrialization:hydrogen']],['no_chlorine',[chlorineTarget]],
  ['no_chemical_reactor',['modern_industrialization:chemical_reactor']],['no_distillery',['modern_industrialization:distillery']],
  ['no_boiler',['modern_industrialization:bronze_boiler']],['no_turbine',['modern_industrialization:lv_steam_turbine']],
  ['no_casting_basin',['tfmg:casting_basin']],['no_fluid_handling',['capability:tfmg_vat_fluid_handling']],['no_chute',['create:chute']],
  ['no_dye',['minecraft:light_gray_dye']],['no_silver_plate',tagMembers('#c:plates/silver')],['no_sulfuric_acid',[acidTarget]],
  ['missing_CHE_02',['research:'+ledger.nodes.find(n=>n.code==='CHE-02').id]],['missing_CHE_03',['research:'+ledger.nodes.find(n=>n.code==='CHE-03').id]]
 ]){
  const absent=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  assert(!solve(pvcRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed).reached.has(pvcBoard),'PVC board bypasses '+name);
  firstPvcBoard.negativeCases.push({name,rejected:true});
 }
 for(const [name,id]of [['missing_polymerization',pvcIds.polymer],['missing_casting_recipe',pvcIds.sheet]]){
  assert(!solve(pvcRules.filter(r=>r.id!==id),frontier).reached.has(pvcBoard),'PVC board bypasses '+name);firstPvcBoard.negativeCases.push({name,rejected:true});
 }
}
const substrateIds={gear:'createch2:steel_steam/mi/invar_gear_from_heavy',manganeseOre:'world:tfc_pyrolusite_normal',manganeseCrushed:'createch2:tfc_geology/advanced_electric/pyrolusite/normal',manganeseSolution:'modern_industrialization:materials/chemical_reactor/manganese_sulfuric_solution',manganeseTiny:'modern_industrialization:materials/electrolyzer/manganese_tiny_dust',stibniteOre:'world:venus_normal_stibnite_return',antimony:'createch2:tfc_geology/advanced_electric/stibnite/normal',batteryAlloy:'modern_industrialization:alloy/mixer/battery_alloy/dust',battery:'modern_industrialization:assembler_generated/electric_age/battery/silicon_battery',stainlessDust:'modern_industrialization:alloy/mixer/stainless_steel/dust',stainlessHot:'modern_industrialization:materials/stainless_steel/blast_furnace/dust',stainlessCold:'modern_industrialization:materials/stainless_steel/vacuum_freezer/hot_ingot',stainlessPlate:'modern_industrialization:materials/stainless_steel/compressor/main',freezer:'modern_industrialization:assembler_generated/electric_age/machine/vacuum_freezer',board:'modern_industrialization:electric_age/circuit/assembler/digital_circuit_board'};
const substrateSelected=new Map([
 ['modern_industrialization:invar_gear',substrateIds.gear],['tfc_metallurgy:ore/normal_pyrolusite',substrateIds.manganeseOre],
 ['fluid:modern_industrialization:sulfuric_acid','createch2:fluid_compat/tfmg_sulfuric_acid_to_mi'],['modern_industrialization:manganese_dust','modern_industrialization:materials/manganese/craft/dust_from_tiny_dust'],['modern_industrialization:manganese_crushed_dust',substrateIds.manganeseCrushed],['fluid:modern_industrialization:manganese_sulfuric_solution',substrateIds.manganeseSolution],['modern_industrialization:manganese_tiny_dust',substrateIds.manganeseTiny],
 ['tfc_metallurgy:ore/normal_stibnite',substrateIds.stibniteOre],['modern_industrialization:antimony_dust',substrateIds.antimony],
 ['modern_industrialization:battery_alloy_ingot','modern_industrialization:materials/battery_alloy/smelting/dust_to_ingot_smelting'],['modern_industrialization:battery_alloy_dust',substrateIds.batteryAlloy],['modern_industrialization:silicon_battery',substrateIds.battery],
 ['modern_industrialization:stainless_steel_dust',substrateIds.stainlessDust],['modern_industrialization:stainless_steel_hot_ingot',substrateIds.stainlessHot],
 ['modern_industrialization:stainless_steel_ingot',substrateIds.stainlessCold],['firmalife:metal/ingot/stainless_steel',null],['modern_industrialization:stainless_steel_plate',substrateIds.stainlessPlate],
 ['modern_industrialization:vacuum_freezer',substrateIds.freezer],['modern_industrialization:digital_circuit_board',substrateIds.board]
]);
for(const id of substrateSelected.keys())assert(!frontier.has(id),'Digital substrate must not inherit '+id);
const substrateRules=pvcRules.map(r=>({...r,outputs:r.outputs.filter(id=>!substrateSelected.has(id)||r.id===substrateSelected.get(id))}));
const substrateSolved=solve(substrateRules,frontier),substrateTargets=['modern_industrialization:stainless_steel_plate','modern_industrialization:silicon_battery','modern_industrialization:digital_circuit_board'];
const firstDigitalSubstrates={truth:substrateTargets.every(id=>substrateSolved.reached.has(id))?'BOUNDED_NATIVE_STAINLESS_AND_DIGITAL_SUBSTRATES':'INCOMPLETE_NATIVE_DIGITAL_SUBSTRATES',routes:substrateIds,witnesses:Object.fromEntries(substrateTargets.map(id=>[id,substrateSolved.witness.get(id)??null])),venusReturn:returns.venus,venusEnvironment:travel.venusEnvironment,nativeColdworks,negativeCases:[],limits:['Specific normal pyrolusite/Earth and normal stibnite/Venus mining routes, retained graded processing and native MI refining, alloying, cold works and board bills under the declared earlier-workshop frontier. No Earth stibnite or free antimony/stainless/battery stock.','The scoped proof uses the exact native freezer assembler and32EU cupronickel route; the more expensive owned later freezer recipe and all global alternatives remain intact. Native machine controllers alone do not satisfy the modeled structure requirements.','Venus requires two extra1000mB fuel buckets plus the initial full basic tank, complete pressure suit/O2 service, mining tool and recovery equipment. Native distance/return arithmetic and current declared equipment class do not establish actual charged components, duration, thermal/radiation/terrain safety or successful return.','Native batch amounts, space cargo, casing/coil quantities, field piping/cables and actual furnace/chemical/processor operation remain runtime qualification. A digital circuit board is not the finished digital circuit or completed AE2 campaign.']};
if(firstDigitalSubstrates.truth==='BOUNDED_NATIVE_STAINLESS_AND_DIGITAL_SUBSTRATES'){
 for(const [name,blocked,target]of [
  ['no_pyrolusite',['tfc_metallurgy:ore/normal_pyrolusite'],substrateTargets[0]],
  ['no_manganese_electrolysis',['modern_industrialization:manganese_tiny_dust'],substrateTargets[0]],
  ['no_geological_acid',[acidTarget],substrateTargets[0]],
  ['no_venus_expedition',[expeditionByDimension.get('stellaris:venus')],substrateTargets[1]],
  ['no_stibnite',['tfc_metallurgy:ore/normal_stibnite'],substrateTargets[1]],
  ['no_antimony',['modern_industrialization:antimony_dust'],substrateTargets[1]],
  ['no_electronic_control',[electronic],substrateTargets[0]],
  ['no_power',['capability:industrial_power'],substrateTargets[0]],
  ['no_electrolyzer',['modern_industrialization:electrolyzer'],substrateTargets[0]],
  ['no_chemical_reactor',['modern_industrialization:chemical_reactor'],substrateTargets[0]],
  ['no_heatproof_casing',['modern_industrialization:heatproof_machine_casing'],substrateTargets[0]],
  ['no_cupronickel_coil',['modern_industrialization:cupronickel_coil'],substrateTargets[0]],
  ['no_frostproof_casing',['modern_industrialization:frostproof_machine_casing'],substrateTargets[0]],
  ['no_freezer',['modern_industrialization:vacuum_freezer'],substrateTargets[0]],
  ['no_item_input_hatch',['modern_industrialization:steel_item_input_hatch'],substrateTargets[0]],
  ['no_item_output_hatch',['modern_industrialization:steel_item_output_hatch'],substrateTargets[0]],
  ['no_energy_hatch',['modern_industrialization:lv_energy_input_hatch'],substrateTargets[0]],
  ['no_tin_cable',['modern_industrialization:tin_cable'],substrateTargets[0]],
  ['no_early_gear',['modern_industrialization:invar_gear'],substrateTargets[0]],
  ['no_heavy_gear',['railcraft:invar_gear'],substrateTargets[0]],
  ['no_saw',[kineticItem(0,'mechanical_saw')],substrateTargets[0]],
  ['missing_MEC_03',['research:'+ledger.nodes.find(n=>n.code==='MEC-03').id],substrateTargets[0]],
  ['no_lead_dust',tagMembers('#c:dusts/lead'),substrateTargets[1]],
  ['no_silicon_dust',tagMembers('#c:dusts/silicon'),substrateTargets[1]],
  ['no_polyethylene',['fluid:modern_industrialization:polyethylene'],substrateTargets[2]]
 ]){
  const absent=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  assert(!solve(substrateRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed).reached.has(target),'Digital substrates bypass '+name);
  firstDigitalSubstrates.negativeCases.push({name,target,rejected:true});
 }
}
// The first finished digital circuit uses native standard logic components.
// Force mined TFC coal and its owned dust handoff; vanilla coal is unavailable
// in this existence proof, while its native producer remains globally intact.
const coalDustRoute='createch2:chemical_age/mi/coal_dust_from_geological_coal';
const logicIds={coal:coalDustRoute,resistor:'modern_industrialization:electric_age/component/craft/resistor',transistor:'modern_industrialization:assembler_generated/electric_age/component/craft/transistor',diode:'modern_industrialization:assembler_generated/electric_age/component/craft/diode',opAmp:'modern_industrialization:assembler_generated/electric_age/component/craft/op_amp',or:'modern_industrialization:assembler_generated/electric_age/component/craft/or_gate',not:'modern_industrialization:assembler_generated/electric_age/component/craft/not_gate',and:'modern_industrialization:assembler_generated/electric_age/component/craft/and_gate',finish:'modern_industrialization:assembler_generated/electric_age/circuit/craft/digital_circuit'};
const digitalTarget='modern_industrialization:digital_circuit',coalDustMembers=tagMembers('#c:dusts/coal');
const logicSelected=new Map([...coalDustMembers.map(id=>[id,null]),['modern_industrialization:coal_dust',logicIds.coal],['minecraft:coal',null],['tfc:ore/bituminous_coal','world:tfc_bituminous_coal'],[electronicTarget,electronicId],...Object.entries({resistor:'resistor',transistor:'transistor',diode:'diode',opAmp:'op_amp',or:'or_gate',not:'not_gate',and:'and_gate',finish:'digital_circuit'}).map(([key,item])=>['modern_industrialization:'+item,logicIds[key]])]);
for(const id of logicSelected.keys())assert(!frontier.has(id),'Logic proof must not inherit '+id);
const logicRules=substrateRules.map(r=>({...r,outputs:r.outputs.filter(id=>(!logicSelected.has(id)||logicSelected.get(id)===r.id)&&(id!=='tfc:ore/sapphire'||r.kind==='native_tfc_chalk_hand_panning')&&(id!=='tfc:gem/sapphire'||r.id==='tfc:crafting/gem/sapphire'))}));
const logicSolved=solve(logicRules,frontier);
const logicRuns={coal:8,resistor:8,transistor:10,diode:6,opAmp:5,or:1,not:2,and:1,finish:1},logicBalance=new Map(),logicPower=[];
assert(coalDustMembers.includes('modern_industrialization:coal_dust'));
const balance=(id,count)=>{if(id==='#c:dusts/coal')id='modern_industrialization:coal_dust';logicBalance.set(id,(logicBalance.get(id)??0)+count);};
for(const [key,runs]of Object.entries(logicRuns)){
 const id=logicIds[key],d=batchData(id);
 if(d.type==='minecraft:crafting_shaped'){
  for(const ch of d.pattern.join(''))if(ch!==' '){const i=d.key[ch];balance(i.item??'#'+i.tag,-runs);}
  balance(d.result.id,runs*(d.result.count??1));
 }else{
  assert(['modern_industrialization:macerator','modern_industrialization:assembler'].includes(d.type));
  for(const i of d.item_inputs)balance(i.item??'#'+i.tag,-runs*i.amount);
  for(const o of d.item_outputs)balance(o.item,runs*o.amount);
  assert(!d.fluid_inputs&&!d.fluid_outputs);logicPower.push({id,eu:d.eu,ticks:d.duration,runs,batchEu:d.eu*d.duration});
 }
}
assert.equal(logicBalance.get(digitalTarget),1);
for(const item of ['coal_dust','resistor','transistor','diode','op_amp','or_gate','not_gate','and_gate'])assert.equal(logicBalance.get('modern_industrialization:'+item),0,'Unbalanced native logic intermediate '+item);
const logicStocks=Object.fromEntries([...logicBalance].filter(([,v])=>v<0).map(([id,v])=>[id,-v]));
assert.deepEqual(logicStocks,{'#createch2:geology/coking_coal':8,'minecraft:paper':16,'modern_industrialization:copper_fine_wire':16,'#c:plates/silicon':36,'modern_industrialization:electrum_fine_wire':28,'#c:plates/steel':42,'#c:glass_blocks':18,'modern_industrialization:aluminum_wire':8,[electronicTarget]:4,'modern_industrialization:digital_circuit_board':1});
const firstDigitalCircuit={truth:logicSolved.reached.has(digitalTarget)?'BOUNDED_NATIVE_FINISHED_DIGITAL_CIRCUIT':'INCOMPLETE_NATIVE_DIGITAL_CIRCUIT',target:digitalTarget,routes:logicIds,witness:logicSolved.witness.get(digitalTarget)??null,quantityPlan:{runs:Object.fromEntries(Object.entries(logicRuns).map(([key,n])=>[logicIds[key],n])),stocks:logicStocks,geologicalCoalSelection:'Eight ordinary TFC bituminous coal; vanilla coal and other common coal-dust suppliers excluded only in this scoped proof.',maximumComponentBatchEu:Math.max(...logicPower.map(b=>b.batchEu)),powerBatches:logicPower,scope:'Balanced selected coal/resistor/logic-component assembly schedule only; preceding stock manufacture, actual amounts, inventories, filled steam tanks and operation remain runtime qualification.'},negativeCases:[],limits:['Native standard undoped transistor/diode and OR/NOT/AND assembler bills, specific earlier sapphire electronic prototype and the already reviewed stainless/Venus battery/digital-board route under the stated workshop frontier. No free coal dust, resistor, logic gate or finished circuit.','Existing native vanilla-coal grinding and all global component alternatives are preserved. Common coal/fuel/dust tags and frozen P0 migration, recovery and EMC sources are unchanged.','Finite component batches fit the precharged native LV turbine; sustained network throughput and actually charged equipment are not inferred. This is not completed AE2 or whole17-age acquisition acceptance.']};
if(firstDigitalCircuit.truth==='BOUNDED_NATIVE_FINISHED_DIGITAL_CIRCUIT'){
 assert.equal(firstDigitalCircuit.witness,logicIds.finish);
 for(const [name,blocked]of [
  ['no_bituminous_coal',['tfc:ore/bituminous_coal']],['no_grinding',['modern_industrialization:electric_macerator',...(powerContract.steamProcessors.macerator??[]).map(p=>p.item)]],
  ['missing_CHE_01',['research:'+ledger.nodes.find(n=>n.code==='CHE-01').id]],['no_paper',['minecraft:paper']],['no_fine_copper_wire',['modern_industrialization:copper_fine_wire']],['no_resistors',['modern_industrialization:resistor']],
  ['no_silicon_plates',['#c:plates/silicon',...tagMembers('#c:plates/silicon')]],['no_steel_plates',['#c:plates/steel',...tagMembers('#c:plates/steel')]],['no_glass',['#c:glass_blocks',...tagMembers('#c:glass_blocks')]],['no_fine_electrum_wire',['modern_industrialization:electrum_fine_wire']],
  ['no_transistors',['modern_industrialization:transistor']],['no_diodes',['modern_industrialization:diode']],['no_op_amps',['modern_industrialization:op_amp']],['no_aluminum_wire',['modern_industrialization:aluminum_wire']],
  ['no_OR_gate',['modern_industrialization:or_gate']],['no_NOT_gate',['modern_industrialization:not_gate']],['no_AND_gate',['modern_industrialization:and_gate']],['no_digital_board',['modern_industrialization:digital_circuit_board']],
  ['no_electronic_prototype',[electronicTarget]],['no_assembler',['modern_industrialization:assembler']],['no_LV_service',['capability:industrial_power']]
 ]){
  const absent=new Set(blocked),seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  assert(!solve(logicRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),seed).reached.has(digitalTarget),'Finished digital circuit bypasses '+name);firstDigitalCircuit.negativeCases.push({name,rejected:true});
 }
 for(const [name,id]of [['no_geological_coal_mine','world:tfc_bituminous_coal'],['missing_owned_coal_manufacturer',coalDustRoute]]){
  assert(!solve(logicRules.filter(r=>r.id!==id),frontier).reached.has(digitalTarget),'Finished digital circuit bypasses '+name);firstDigitalCircuit.negativeCases.push({name,rejected:true});
 }
 const nativeCoal=batchData('modern_industrialization:materials/coal/macerator/gem');
 const originalFeedRules=logicRules.map(r=>r.id===coalDustRoute?{...r,requirements:all([inputs(nativeCoal),machine(nativeCoal.type,nativeCoal),...(locks.get(coalDustRoute)??[]).map(leaf)])}:r);
 assert(!solve(originalFeedRules,frontier).reached.has(digitalTarget),'Native vanilla-only coal feed unexpectedly supplies first digital logic');firstDigitalCircuit.negativeCases.push({name:'old_vanilla_only_feed',rejected:true});
}
const eyeTarget='minecraft:ender_eye',eyeId='minecraft:ender_eye';
const eyeSelected=new Map([['minecraft:blaze_powder','world:tfc_desert_dungeon/ember_skeleton'],['minecraft:ender_pearl','world:tfc_desert_dungeon/ender_skeleton'],[eyeTarget,eyeId]]);
for(const id of eyeSelected.keys())assert(!frontier.has(id),'Pre-End materials cannot inherit '+id);
const eyeRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!eyeSelected.has(id)||r.id===eyeSelected.get(id))})),eyeSolved=solve(eyeRules,frontier);
const eyeBatch=batchData(eyeId);assert.equal(eyeBatch.type,'minecraft:crafting_shapeless');assert.deepEqual(eyeBatch.ingredients,[{item:'minecraft:ender_pearl'},{item:'minecraft:blaze_powder'}]);assert.deepEqual(eyeBatch.result,{count:1,id:eyeTarget});
const firstEndMaterials={truth:eyeSolved.reached.has(eyeTarget)?'BOUNDED_NATIVE_DUNGEON_TO_ENDER_EYE':'INCOMPLETE_PRE_END_MATERIALS',target:eyeTarget,witness:eyeSolved.witness.get(eyeTarget)??null,sources:Object.fromEntries(eyeSelected),nativeContract:world.preEndHunt,offworldTravelNotRequired:false,negativeCases:[],limits:['Specific native YUNG skeleton dungeon in13TFC dry/desert-tag biomes, connected spawner stair templates, native skeleton processor and configured exact-target Unique Mobs callback; positive Ember/Ender Skeleton variant/drop paths supply the unchanged vanilla eye recipe.','The optional third-party mixin has a statically matching native callback/target. Actual transformation, generation, encounter, combat, loot quantities, provision/light stock and safety remain runtime qualification. No new structure, recipe, drop, spawn configuration or natural overworld mob seed is introduced.','Eye manufacture is separate from finding/filling an End portal, dragon defeat, return, End-hosted certus and AE2 processors. Whole17-age acceptance remains incomplete.']};
if(firstEndMaterials.truth==='BOUNDED_NATIVE_DUNGEON_TO_ENDER_EYE'){
 assert.equal(firstEndMaterials.witness,eyeId);
 const offworld=new Set(expeditionByDimension.values());
 assert(solve(eyeRules.map(r=>({...r,outputs:r.outputs.filter(id=>!offworld.has(id))})),new Map([...frontier].filter(([id])=>!offworld.has(id)))).reached.has(eyeTarget),'Pre-End eye hunt unexpectedly requires a planetary return supplier');firstEndMaterials.offworldTravelNotRequired=true;
 for(const [name,blocked]of [
  ['no_bronze_pickaxe',['tfc:metal/pickaxe/bronze']],['no_knife',['#c:tools/knife',...tagMembers('#c:tools/knife')]],['no_terrestrial_survey',['capability:terrestrial_prospecting']],['no_qualified_dungeon_hunt',[dungeonHunt]],['no_blaze_powder',['minecraft:blaze_powder']],['no_ender_pearl',['minecraft:ender_pearl']]
 ]){const absent=new Set(blocked);assert(!solve(eyeRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...frontier].filter(([id])=>!absent.has(id)))).reached.has(eyeTarget),'Pre-End materials bypass '+name);firstEndMaterials.negativeCases.push({name,rejected:true});}
 for(const [name,id]of [['no_ember_source','world:tfc_desert_dungeon/ember_skeleton'],['no_ender_source','world:tfc_desert_dungeon/ender_skeleton'],['no_native_eye_recipe',eyeId]]){assert(!solve(eyeRules.filter(r=>r.id!==id),frontier).reached.has(eyeTarget),'Pre-End materials bypass '+name);firstEndMaterials.negativeCases.push({name,rejected:true});}
}
const certusTarget='ae2:certus_quartz_crystal',certusRoute='createch2:tfc_geology/digital/certus_quartz/normal',rawCertus=endContract.certus.output;
const certusSelected=new Map([...tagMembers('#createch2:tfc_ores/certus_quartz/normal').map(id=>[id,null]),[rawCertus,endOreSource],[certusTarget,certusRoute],['minecraft:arrow','world:tfc_desert_dungeon/arrows'],['burnt_additions:flint_bow','burnt_additions:flint_bow'],...eyeSelected]);
for(const id of certusSelected.keys())assert(!frontier.has(id),'End certus route must not inherit '+id);
const certusRules=logicRules.map(r=>({...r,outputs:r.outputs.filter(id=>!certusSelected.has(id)||certusSelected.get(id)===r.id)})),certusSolved=solve(certusRules,frontier);
const certusBill=batchData(certusRoute);
assert.equal(certusBill.type,'modern_industrialization:macerator');assert.equal(certusBill.eu,32);assert.equal(certusBill.duration,300);
assert.deepEqual(certusBill.item_inputs,[{tag:'createch2:tfc_ores/certus_quartz/normal',amount:1},{item:'modern_industrialization:digital_circuit',amount:1,probability:0}]);
assert.deepEqual(certusBill.item_outputs,[{item:certusTarget,amount:2},{item:'ae2:certus_quartz_dust',amount:1,probability:0.25}]);
const certusBudget={eu:certusBill.eu,ticks:certusBill.duration,totalEu:certusBill.eu*certusBill.duration,nativeMaxEu:nativeSteam.lvTurbine.maxEuPerTick,prechargedSteamEu:nativeSteam.lvTurbine.steamTankCapacity*nativeSteam.lvTurbine.euPerSteam,continuousBoilerThroughputClaimed:false};
assert(certusBudget.eu<=certusBudget.nativeMaxEu&&certusBudget.totalEu<=certusBudget.prechargedSteamEu);
const endTargets=[endSuppliers,rawCertus,certusTarget];
const firstEndCertus={truth:endTargets.every(id=>certusSolved.reached.has(id))?'BOUNDED_NATIVE_END_RETURN_SUPPLIERS_AND_CERTUS':'INCOMPLETE_END_CERTUS',targets:endTargets,witnesses:Object.fromEntries(endTargets.map(id=>[id,certusSolved.witness.get(id)??null])),route:certusRoute,existingResearchOwners:(locks.get(certusRoute)??[]),nativeContract:endContract,powerBudget:certusBudget,offworldTravelNotRequiredForPortalSuppliers:false,negativeCases:[],limits:['Selected portal/dragon/outer-gateway/linked-return native contracts with the existing flint bow and specific dungeon arrows/eyes/pearls; manufacture of gear kinds is not a performed trip or proven fight.12frame eyes plus search reserves, enough arrows/bows/pearls/building blocks, light/provisions and an Overworld respawn remain actual preparation conditions.','The source supplies one ordinary raw certus item; the unchanged32EU/300tick owned separator retains the reusable digital catalyst and yields2crystals plus a25%chance of1dust. Optional dust is not a guaranteed supplier. Native digital manufacture still requires its separately qualified Moon/Mars/Venus stock path.','The scoped proof keeps vanilla/generic loot, later Lantea/gate access, replication, death/keepInventory and unreviewed source substitutes out. Global valid alternatives remain intact. Native finite precharged LV batches do not certify actual tanks, power wiring, materials, mining or loaded native matching.','Actual End entry, dragon/gateway state, combat, quantities, cargo retention, callback compatibility and return remain runtime qualification. This is not complete AE2 or whole17-age acceptance.']};
if(firstEndCertus.truth==='BOUNDED_NATIVE_END_RETURN_SUPPLIERS_AND_CERTUS'){
 assert.equal(firstEndCertus.witnesses[rawCertus],endOreSource);assert.equal(firstEndCertus.witnesses[certusTarget],certusRoute);
 const offworld=new Set(expeditionByDimension.values());assert(solve(certusRules.map(r=>({...r,outputs:r.outputs.filter(id=>!offworld.has(id))})),new Map([...frontier].filter(([id])=>!offworld.has(id)))).reached.has(endSuppliers),'Portal/return gear unexpectedly requires planetary return suppliers');firstEndCertus.offworldTravelNotRequiredForPortalSuppliers=true;
 for(const [name,blocked]of [
  ['no_eyes',['minecraft:ender_eye']],['no_qualified_hunt',[dungeonHunt]],['no_flint_bow',['burnt_additions:flint_bow']],['no_arrows',['minecraft:arrow']],['no_gateway_pearls',['minecraft:ender_pearl']],['no_bronze_pickaxe',['tfc:metal/pickaxe/bronze']],['no_light',['tfc:torch']],['no_building_stock',['#minecraft:planks',...tagMembers('#minecraft:planks')]],['no_return_supplier_plan',[endSuppliers]],['no_returned_ore',[rawCertus]],['no_digital_control',['modern_industrialization:digital_circuit']],['no_LV_service',['capability:industrial_power']],['no_electric_macerator',['modern_industrialization:electric_macerator']]
 ]){const absent=new Set(blocked);assert(!solve(certusRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...frontier].filter(([id])=>!absent.has(id)))).reached.has(certusTarget),'End certus bypasses '+name);firstEndCertus.negativeCases.push({name,rejected:true});}
 for(const [name,id]of [['no_native_end_ore_source',endOreSource],['no_owned_separator',certusRoute],['no_qualified_arrow_source','world:tfc_desert_dungeon/arrows']]){assert(!solve(certusRules.filter(r=>r.id!==id),frontier).reached.has(certusTarget),'End certus bypasses '+name);firstEndCertus.negativeCases.push({name,rejected:true});}
}
// First AE2 processors use the installed MI packer/assembler compatibility.
// Keep physical inscriber supply separate and forbid the optional geology dust
// from standing in for the guaranteed native macerator route in this proof.
const ae2Ids={siliconPress:'createch2:stainless_digital/ae2/silicon_press',logicPress:'createch2:stainless_digital/ae2/logic_processor_press',calculationPress:'createch2:stainless_digital/ae2/calculation_processor_press',engineeringPress:'createch2:stainless_digital/ae2/engineering_processor_press',printedSilicon:'modern_industrialization:compat/ae2/printed_silicon_from_ingot',printedLogic:'modern_industrialization:compat/ae2/printed_logic_processor',printedCalculation:'modern_industrialization:compat/ae2/printed_calculation_processor',printedEngineering:'modern_industrialization:compat/ae2/printed_engineering_processor',logic:'modern_industrialization:compat/ae2/logic_processor',calculation:'modern_industrialization:compat/ae2/calculation_processor',engineering:'modern_industrialization:compat/ae2/engineering_processor',charged:'modern_industrialization:compat/ae2/electrolyzer/ae2_certus_quartz_crystal_to_ae2_charged_certus_quartz_crystal',fluix:'modern_industrialization:compat/ae2/mixer/fluix',certusDust:'modern_industrialization:compat/ae2/macerator/_c_gems_certus_quartz_to_ae2_certus_quartz_dust',fluixDust:'modern_industrialization:compat/ae2/macerator/ae2_fluix_crystal_to_ae2_fluix_dust',moltenRedstone:'modern_industrialization:materials/blast_furnace/molten_redstone'};
const ae2Outputs={siliconPress:'ae2:silicon_press',logicPress:'ae2:logic_processor_press',calculationPress:'ae2:calculation_processor_press',engineeringPress:'ae2:engineering_processor_press',printedSilicon:'ae2:printed_silicon',printedLogic:'ae2:printed_logic_processor',printedCalculation:'ae2:printed_calculation_processor',printedEngineering:'ae2:printed_engineering_processor',logic:'ae2:logic_processor',calculation:'ae2:calculation_processor',engineering:'ae2:engineering_processor',charged:'ae2:charged_certus_quartz_crystal',fluix:'ae2:fluix_crystal',certusDust:'ae2:certus_quartz_dust',fluixDust:'ae2:fluix_dust',moltenRedstone:'fluid:modern_industrialization:molten_redstone'};
const ae2Selected=new Map([...Object.entries(ae2Outputs).map(([key,item])=>[item,ae2Ids[key]]),['minecraft:quartz',nativeEarlyCrushing.quartzMilling.sourceId],['tfc:rock/raw/quartzite','world:tfc_isolated_quartzite']]);
for(const id of ae2Selected.keys())assert(!frontier.has(id),'First AE2 must not inherit '+id);
const ae2Rules=certusRules.map(r=>({...r,outputs:r.outputs.filter(id=>!ae2Selected.has(id)||ae2Selected.get(id)===r.id)}));
const ae2Targets=['ae2:logic_processor','ae2:calculation_processor','ae2:engineering_processor','ae2:fluix_crystal','ae2:certus_quartz_dust','ae2:fluix_dust'],ae2Solved=solve(ae2Rules,frontier);
const stencil=batchData(ae2Ids.siliconPress);assert.deepEqual(stencil.pattern,['SSS','SWS','SDS']);assert.deepEqual(stencil.key,{S:{item:'modern_industrialization:stainless_steel_plate'},W:{item:'modern_industrialization:silicon_plate'},D:{item:digitalTarget}});assert.deepEqual(stencil.result,{id:'ae2:silicon_press',count:1});
const ae2Batches=[];
for(const [key,id]of Object.entries(ae2Ids)){
 if(key.endsWith('Press'))continue;const d=batchData(id);assert(d.type.startsWith('modern_industrialization:'));
 if(key.startsWith('printed')){assert.equal(d.type,'modern_industrialization:packer');assert.equal(d.item_inputs[1].probability,0);assert.equal(d.item_inputs[1].amount,1);assert.equal(d.item_inputs[1].item,ae2Outputs[key==='printedSilicon'?'siliconPress':key==='printedLogic'?'logicPress':key==='printedCalculation'?'calculationPress':'engineeringPress']);}
 if(['logic','calculation','engineering'].includes(key)){assert.deepEqual(d.fluid_inputs,[{amount:90,fluid:'modern_industrialization:molten_redstone'}]);assert.equal(d.type,'modern_industrialization:assembler');assert.equal(d.item_inputs[1].item,'ae2:printed_silicon');}
 if(key==='certusDust'||key==='fluixDust'){assert.equal(d.type,'modern_industrialization:macerator');assert.deepEqual(d.item_outputs,[{amount:1,item:ae2Outputs[key]}]);}
 const totalEu=d.eu*d.duration;assert(d.eu<=32&&totalEu<=nativeSteam.lvTurbine.steamTankCapacity*nativeSteam.lvTurbine.euPerSteam);
 ae2Batches.push({id,processor:d.type,eu:d.eu,ticks:d.duration,totalEu,payloadSha256:crypto.createHash('sha256').update(JSON.stringify(d)).digest('hex')});
}
const firstAe2Processors={quartzSupplier:{source:survival.quartziteSource,milling:nativeEarlyCrushing.quartzMilling,witness:ae2Solved.witness.get('minecraft:quartz')??null,chancePerRun:0.05,finiteYieldGuaranteed:false},truth:ae2Targets.every(id=>ae2Solved.reached.has(id))?'BOUNDED_NATIVE_MI_FIRST_AE2_PROCESSORS':'INCOMPLETE_FIRST_AE2_PROCESSORS',targets:ae2Targets,routes:ae2Ids,witnesses:Object.fromEntries(ae2Targets.map(id=>[id,ae2Solved.witness.get(id)??null])),siliconStencilRepair:{id:ae2Ids.siliconPress,previous:'modern_industrialization:silicon_wafer',current:'modern_industrialization:silicon_plate',otherIngredientsPatternOutputAndOwnersUnchanged:true,owners:locks.get(ae2Ids.siliconPress)??[],reason:'The native monocrystalline wafer precursor requires iridium; first AE2 stencil uses the already qualified earlier silicon plate. Mature wafer, circuit and processing-unit suppliers are unchanged.'},nativeBatches:ae2Batches,quantityPlan:{scope:'Selected stencil/processor/fluix/dust assembly schedule only, before general factory stock manufacture.',stencils:{runs:4,stainlessPlates:28,digitalCircuits:4,siliconPlates:1,goldIngots:1,certusCrystals:1,diamonds:1},printing:{siliconIngots:3,goldIngots:1,certusCrystals:1,diamonds:1,reusableStencils:4,printedSilicon:3,printedProcessorKinds:3},finishing:{runs:3,moltenRedstoneMb:270,processors:{logic:1,calculation:1,engineering:1}},certusAllocation:{separatorRuns:2,rawOre:2,guaranteedCrystals:4,calculationStencil:1,printedCalculation:1,charging:1,guaranteedDust:1,optionalDustCounted:0},fluix:{mixes:1,chargedCertus:1,quartz:1,redstone:1,waterMbPresent:1000,nativeWaterConsumptionProbability:0,crystalOutput:2,crystalsMacerated:1,fluixDust:1,crystalsRetained:1}},negativeCases:[],noIridiumOrWaferRequired:false,limits:['Installed native MI packer/assembler/electrolyzer/mixer/macerator and the specific End certus supplier compose under the earlier-workshop frontier. No printed stock, wafer, iridium, first processor or chance dust is free.','The native packer retains its zero-consumption stencil; native assembler consumes printed silicon and the selected printed processor plus90mB molten redstone. Native material/energy/time/yield contracts and all global alternatives remain intact.','These finite native LV batches fit the precharged turbine; quantities, inventories, steam replenishment, formation and loaded processing remain runtime qualification.','Physical AE2 inscriber/FE service, stainless Greate press, controller assembly and whole17-age acquisition remain separate unfinished suppliers.']};
if(firstAe2Processors.truth==='BOUNDED_NATIVE_MI_FIRST_AE2_PROCESSORS'){
 const noLate=new Set(['modern_industrialization:silicon_wafer','modern_industrialization:monocrystalline_silicon','#c:tiny_dusts/iridium',...tagMembers('#c:tiny_dusts/iridium')]);
 const withoutLate=rs=>rs.map(r=>({...r,outputs:r.outputs.filter(id=>!noLate.has(id))})),earlySeed=new Map([...frontier].filter(([id])=>!noLate.has(id)));
 const earlyAe2=solve(withoutLate(ae2Rules),earlySeed);assert(ae2Targets.every(id=>earlyAe2.reached.has(id)),'First AE2 requires later iridium wafer');firstAe2Processors.noIridiumOrWaferRequired=true;
 const substitute=e=>e.id?leaf(e.id==='modern_industrialization:silicon_plate'?'modern_industrialization:silicon_wafer':e.id):e.all?all(e.all.map(substitute)):any(e.any.map(substitute));
 assert(!solve(withoutLate(ae2Rules.map(r=>r.id===ae2Ids.siliconPress?{...r,requirements:substitute(r.requirements)}:r)),earlySeed).reached.has('ae2:logic_processor'),'Old wafer gate did not reject');firstAe2Processors.negativeCases.push({name:'old_wafer_gate',rejected:true});
 for(const [name,blocked,target]of [
 ['no_silicon_plate',['modern_industrialization:silicon_plate'],'ae2:logic_processor'],['no_silicon_ingot',['modern_industrialization:silicon_ingot'],'ae2:logic_processor'],['no_stainless_plate',['modern_industrialization:stainless_steel_plate'],'ae2:logic_processor'],['no_digital_control',[digitalTarget],'ae2:logic_processor'],['no_LV_service',['capability:industrial_power'],'ae2:logic_processor'],['no_packer',['modern_industrialization:electric_packer'],'ae2:logic_processor'],['no_assembler',['modern_industrialization:assembler'],'ae2:logic_processor'],['no_silicon_stencil',['ae2:silicon_press'],'ae2:logic_processor'],['no_printed_silicon',['ae2:printed_silicon'],'ae2:logic_processor'],['no_logic_stencil',['ae2:logic_processor_press'],'ae2:logic_processor'],['no_end_return',[endSuppliers],'ae2:calculation_processor'],['no_certus_crystal',[certusTarget],'ae2:calculation_processor'],['no_calculation_stencil',['ae2:calculation_processor_press'],'ae2:calculation_processor'],['no_engineering_stencil',['ae2:engineering_processor_press'],'ae2:engineering_processor'],['no_molten_redstone',['fluid:modern_industrialization:molten_redstone'],'ae2:logic_processor'],['no_charged_certus',['ae2:charged_certus_quartz_crystal'],'ae2:fluix_crystal'],['no_fluix',['ae2:fluix_crystal'],'ae2:fluix_dust'],['no_native_quartzite',['tfc:rock/raw/quartzite'],'ae2:fluix_crystal'],['no_quartz_milling_service',['capability:early_millstone_service'],'ae2:fluix_crystal']
 ]){const absent=new Set(blocked);assert(!solve(ae2Rules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...frontier].filter(([id])=>!absent.has(id)))).reached.has(target),'First AE2 bypasses '+name);firstAe2Processors.negativeCases.push({name,target,rejected:true});}
 for(const [name,id,target]of [['no_owned_silicon_stencil',ae2Ids.siliconPress,'ae2:logic_processor'],['no_native_silicon_print',ae2Ids.printedSilicon,'ae2:logic_processor'],['no_native_logic_finish',ae2Ids.logic,'ae2:logic_processor'],['no_guaranteed_certus_dust',ae2Ids.certusDust,'ae2:certus_quartz_dust'],['no_native_fluix',ae2Ids.fluix,'ae2:fluix_crystal'],['no_quartzite_source','world:tfc_isolated_quartzite','ae2:fluix_crystal'],['no_native_quartz_milling',nativeEarlyCrushing.quartzMilling.sourceId,'ae2:fluix_crystal']]){assert(!solve(ae2Rules.filter(r=>r.id!==id),frontier).reached.has(target),'First AE2 bypasses '+name);firstAe2Processors.negativeCases.push({name,target,rejected:true});}
}
// The existing native-ID override retains its one-crafter yield and all
// other fields while accepting the already registered TFC workbench tag.
const crafterFixture=read(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_crafter_workbench_repair.json'));
const {crafterId,crafterTarget,benchTarget,benchId,benchTag,benchMembers,crafterSelected,crafterAbsent,crafterRules,crafterSeed,firstPlate,plateRoute,firstWheels,wheelRoute,firstPlateTag,wheelSelected,wheelRules,cokeTarget,cokeStock,cokeSource,cokeDustSource,cokeSelected,cokeRules}=selectEarlyCokeSuppliers({recipes,frontier,tagMembers,early:nativeEarlyCrushing,offworldSuppliers:[...expeditionByDimension.values()]});
assert.equal(crafterId,crafterFixture.id);
const expectedCrafter=structuredClone(crafterFixture.before);expectedCrafter.key.R={tag:benchTag.slice(1)};assert.deepEqual(crafterFixture.after,expectedCrafter);assert.deepEqual(authored.get(crafterId),expectedCrafter);assert.equal(expectedCrafter.result.count,1);
assert(benchMembers.includes(benchTarget));assert(!frontier.has(benchTag)&&!frontier.has(benchTarget)&&!frontier.has(crafterTarget));
const crafterSolved=solve(crafterRules,crafterSeed);
const firstMechanicalCrafter={truth:crafterSolved.reached.has(crafterTarget)?'BOUNDED_TFC_WORKBENCH_TO_MECHANICAL_CRAFTER':'INCOMPLETE_FIRST_MECHANICAL_CRAFTER',target:crafterTarget,witness:crafterSolved.witness.get(crafterTarget)??null,benchWitness:crafterSolved.witness.get(benchTarget)??null,recipeRepair:crafterFixture,quantityPlan:{crafts:1,brassCasings:1,electronTubes:1,tfcWorkbenches:1,crafters:1},vanillaTableOrOffworldNotRequired:true,negativeCases:[],limits:['Manufacture of one mechanical crafter using the existing earlier-workshop frontier and native oak workbench producer; no vanilla-table resource-order assumption or free workbench.','The existing live override yields one crafter, rather than the native three. Pattern, casing, tube, identity and owners are preserved.','This manufacture proof is separate from the bounded native grid/crushing service below. Actual connected layout, quantities, stress and loaded matching remain runtime qualification.']};
if(firstMechanicalCrafter.truth==='BOUNDED_TFC_WORKBENCH_TO_MECHANICAL_CRAFTER'){
 for(const [name,blocked]of [['no_TFC_workbench',[benchTarget]],['no_workbench_stock',[benchTag,...benchMembers]],['no_electron_tube',['create:electron_tube']],['no_brass_casing',['create:brass_casing']]]){const absent=new Set(blocked);assert(!solve(crafterRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...crafterSeed].filter(([id])=>!absent.has(id)))).reached.has(crafterTarget),'Crafter bypasses '+name);firstMechanicalCrafter.negativeCases.push({name,rejected:true});}
 for(const [name,id]of [['no_native_workbench',benchId],['no_owned_crafter',crafterId]]){assert(!solve(crafterRules.filter(r=>r.id!==id),crafterSeed).reached.has(crafterTarget),'Crafter bypasses '+name);firstMechanicalCrafter.negativeCases.push({name,rejected:true});}
 const oldTable=e=>e.id?leaf(e.id===benchTag?'minecraft:crafting_table':e.id):e.all?all(e.all.map(oldTable)):any(e.any.map(oldTable));assert(!solve(crafterRules.map(r=>r.id===crafterId?{...r,requirements:oldTable(r.requirements)}:r),crafterSeed).reached.has(crafterTarget),'Old literal table bypass');firstMechanicalCrafter.negativeCases.push({name:'old_literal_vanilla_table',rejected:true});
}
// Pin only the existing first plate and wheel manufacturers. Quantities and
// the eventual powered grid/crushing operation remain separate contracts.
assert.deepEqual(nativeGeneratedPlate.itemTags,{'c:plates/andesite_alloy':[firstPlate]});assert(!frontier.has(firstPlate)&&!frontier.has(firstPlateTag)&&!frontier.has(firstWheels));
const wheelSolved=solve(wheelRules,crafterSeed);
assert.deepEqual(batchData(plateRoute).ingredients,[{item:'create:andesite_alloy'}]);assert.deepEqual(batchData(plateRoute).results,[{id:firstPlate}]);assert.equal(batchData(plateRoute).recipe_tier,0);
const wheelBill=batchData(wheelRoute);assert.deepEqual(wheelBill.pattern,['PCP','GSG','PHP']);assert.deepEqual(wheelBill.result,{id:firstWheels,count:2});assert.deepEqual(wheelBill.key.P,{tag:'c:plates/andesite_alloy'});
const firstCrushingHardware={truth:[firstPlate,crafterTarget,firstWheels].every(id=>wheelSolved.reached.has(id))?'BOUNDED_NATIVE_FIRST_CRUSHING_HARDWARE':'INCOMPLETE_FIRST_CRUSHING_HARDWARE',targets:[firstPlate,crafterTarget,firstWheels],witnesses:Object.fromEntries([firstPlate,crafterTarget,firstWheels].map(id=>[id,wheelSolved.witness.get(id)??null])),nativeGeneratedPlate,quantityPlan:{platePressRuns:4,andesiteAlloy:4,plates:4,wheelCraftRuns:1,cogwheels:1,shafts:1,andesiteCasings:3,wheels:2,crafterGrid:{rows:3,columns:3,crafters:9,oneOutputPerCrafterCraft:true}},negativeCases:[],limits:['Selected existing manufacturers under the earlier-workshop frontier and native derived tag membership; no plate or wheel is inherited stock. All recipe IDs, materials, counts and research ownership are unchanged.','The3by3 grid requires nine mechanical crafters. Graph checks hardware kinds; actual counts, grid connections, rotation, stress, recipe matching and successful manufacturing require runtime qualification.','A crushing-wheel item is not native crushing service or silicon/advanced-motor acceptance. Native conversion, wheel geometry and operating power still require their own contract.']};
if(firstCrushingHardware.truth==='BOUNDED_NATIVE_FIRST_CRUSHING_HARDWARE'){
 for(const [name,blocked]of [['no_plate',[firstPlate]],['no_crafter',[crafterTarget]],['no_cogwheel',['greate:andesite_alloy_cogwheel']],['no_shaft',['greate:andesite_alloy_shaft']],['no_casing',['create:andesite_casing']],['no_rotary_service',['capability:kinetic_power']]]){const absent=new Set(blocked);assert(!solve(wheelRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...crafterSeed].filter(([id])=>!absent.has(id)))).reached.has(firstWheels),'First wheel bypasses '+name);firstCrushingHardware.negativeCases.push({name,rejected:true});}
 for(const [name,id]of [['no_owned_plate',plateRoute],['no_owned_wheel',wheelRoute]]){assert(!solve(wheelRules.filter(r=>r.id!==id),crafterSeed).reached.has(firstWheels),'First wheel bypasses '+name);firstCrushingHardware.negativeCases.push({name,rejected:true});}
 const beforeMembers=memberCache.get(firstPlateTag);try{memberCache.set(firstPlateTag,[]);assert(!solve(wheelRules,crafterSeed).reached.has(firstWheels),'Wheel bypasses native generated plate tag');}finally{if(beforeMembers===undefined)memberCache.delete(firstPlateTag);else memberCache.set(firstPlateTag,beforeMembers);}firstCrushingHardware.negativeCases.push({name:'no_native_generated_tag',rejected:true});
}
for(const id of cokeSelected.keys())assert(!frontier.has(id),'First crushing stock must not be inherited '+id);
const cokeSolved=solve(cokeRules,crafterSeed),cokeOwners=locks.get(cokeSource)??[];assert.equal(cokeOwners.length,1,'Retain native coking research ownership');
const cokeTargets=['capability:early_crafter_grid',firstWheels,'capability:early_crushing_service',cokeTarget];
const firstCrushingService={truth:cokeTargets.every(id=>cokeSolved.reached.has(id))?'BOUNDED_NATIVE_FIRST_COKE_CRUSHING_SERVICE':'INCOMPLETE_FIRST_CRUSHING_SERVICE',targets:cokeTargets,witnesses:Object.fromEntries(cokeTargets.map(id=>[id,cokeSolved.witness.get(id)??null])),nativeContract:nativeEarlyCrushing,sourceCokeRecipe:cokeSource,sourceOwners:cokeOwners,quantityPlan:{sourceCoke:1,cokeDust:1,nativeResultChance:1,sourceRecipeDurationDefault:0,grid:nativeEarlyCrushing.grid,pair:nativeEarlyCrushing.pair},negativeCases:[],limits:['Selected first plate/wheel/workbench and ordinary mined TFC bituminous-coal coking path. No vanilla coal, arbitrary coke dust, late processor or offworld supplier is credited.','Native automatic Create-to-Greate conversion copies the exact coke input/output/default duration to the actual integrated recipe ID; pack filters admit that payload. Configured code and native YAML semantics are pinned, but loaded conversion/mixin matching is unverified.','Fractional grid and independent paired-wheel drive plans preserve native source capacities and tier limits. Counts, actual flow/shape/gearing/stress/inventories and successful operation remain runtime qualification.','Crushing capability is separate from the native silicon furnace and heated magnetic-alloy route. Whole17-age acquisition remains incomplete.']};
if(firstCrushingService.truth==='BOUNDED_NATIVE_FIRST_COKE_CRUSHING_SERVICE'){
 for(const [name,blocked]of [['no_crafter',[crafterTarget]],['no_large_reduction_cog',['greate:large_andesite_alloy_cogwheel']],['no_wrench',['create:wrench']],['no_water_wheel',['create:water_wheel']],['no_water',['fluid:minecraft:water']],['no_plate',[firstPlate]],['no_paired_wheels',[firstWheels]],['no_grid_service',['capability:early_crafter_grid']],['no_crushing_service',['capability:early_crushing_service']],['no_feed_chute',['create:chute']],['no_coke',[cokeStock]],['no_bituminous_coal',['tfc:ore/bituminous_coal']],['no_coking_owner',cokeOwners],['no_rotary_work',['capability:kinetic_power']]]){const absent=new Set(blocked);assert(!solve(cokeRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...crafterSeed].filter(([id])=>!absent.has(id)))).reached.has(cokeTarget),'First crushing bypasses '+name);firstCrushingService.negativeCases.push({name,rejected:true});}
 for(const [name,id]of [['no_owned_coking',cokeSource],['no_native_crushing',cokeDustSource],['no_native_grid_plan','native:early_crafter_grid']]){assert(!solve(cokeRules.filter(r=>r.id!==id),crafterSeed).reached.has(cokeTarget),'First crushing bypasses '+name);firstCrushingService.negativeCases.push({name,rejected:true});}
}
const firstGeologicalCoke=firstGeologicalCokeProof({contract:nativeGeologicalCoke,hardware:tfcStartupHardware,leather:nativeTfcLeather,hotAir:nativeFirstHotAir,recipes,frontier,solve,tagMembers,locks});
trace('first geological coke dust checked: '+firstGeologicalCoke.truth);
const firstManualRolling=firstManualRollingProof({contract:nativeManualRolling,cokeArgs:{contract:nativeGeologicalCoke,hardware:tfcStartupHardware,leather:nativeTfcLeather,hotAir:nativeFirstHotAir,recipes,frontier,solve,tagMembers,locks}});
trace('first manual rolling checked: '+firstManualRolling.truth);
const firstSteel=firstSteelProof({contract:nativeFirstSteel,coke:nativeGeologicalCoke,hotAir:nativeFirstHotAir,air:nativeFirstAir,hardware:tfcStartupHardware,leather:nativeTfcLeather,fuel:bootstrap.petroleumContract.hotBlastFuel,wrought:firstWrought,industrialIron:nativeIndustrialIron,recipes,frontier,solve,tagMembers,locks});
trace('first steel checked: '+firstSteel.truth);
const steelShaftArgs={contract:nativeFirstSteelShaft,steel:nativeFirstSteel,coke:nativeGeologicalCoke,hotAir:nativeFirstHotAir,air:nativeFirstAir,hardware:tfcStartupHardware,leather:nativeTfcLeather,fuel:bootstrap.petroleumContract.hotBlastFuel,wrought:firstWrought,industrialIron:nativeIndustrialIron,recipes,frontier,solve,tagMembers,locks};
const firstSteelShaft=firstSteelShaftProof(steelShaftArgs),ignitionArgs={contract:nativeFirstIgnition,shaftArgs:steelShaftArgs},firstIgnition=firstIgnitionProof(ignitionArgs),geologicalRubberSuppliers=selectGeologicalRubberSuppliers({ignitionArgs,foundry:nativeFoundryBronze}),firstGeologicalNaturalRubber=firstGeologicalNaturalRubberProof({contract:nativeNaturalRubber,leather:nativeTfcLeather,ignitionArgs,foundry:nativeFoundryBronze,firstIgnition,firstSteel,firstSteelShaft,suppliers:geologicalRubberSuppliers});
const firstSteelSteamBucket=firstSteelSteamBucketProof({contract:nativeSteelSteamBucket,ignitionArgs,foundry:nativeFoundryBronze});
const firstRailGradeSteel=firstRailGradeSteelProof({contract:nativeRailGradeSteel,steelSteam:nativeSteelSteamBucket,ignitionArgs,foundry:nativeFoundryBronze});
trace('first rail-grade steel checked: '+firstRailGradeSteel.truth);
const firstRailStock=firstRailStockProof({contract:nativeRailStock,grade:nativeRailGradeSteel,steelSteam:nativeSteelSteamBucket,ignitionArgs,foundry:nativeFoundryBronze});
trace('first rail stock checked: '+firstRailStock.truth);
const firstRailFeedstocks=firstRailFeedstockProof({contract:nativeRailFeedstocks,stockArgs:{contract:nativeRailStock,grade:nativeRailGradeSteel,steelSteam:nativeSteelSteamBucket,ignitionArgs,foundry:nativeFoundryBronze}});
trace('first rail feedstocks checked: '+firstRailFeedstocks.truth);
const firstRailGold=firstRailGoldProof({contract:nativeRailGold,feedstockArgs:{contract:nativeRailFeedstocks,stockArgs:{contract:nativeRailStock,grade:nativeRailGradeSteel,steelSteam:nativeSteelSteamBucket,ignitionArgs,foundry:nativeFoundryBronze}}});
trace('first rail gold checked: '+firstRailGold.truth);
const firstRailDetectors=firstRailDetectorProof({contract:nativeRailDetectors,goldArgs:{contract:nativeRailGold,feedstockArgs:{contract:nativeRailFeedstocks,stockArgs:{contract:nativeRailStock,grade:nativeRailGradeSteel,steelSteam:nativeSteelSteamBucket,ignitionArgs,foundry:nativeFoundryBronze}}}});
trace('first rail detectors checked: '+firstRailDetectors.truth);
const railCircuitArgs={contract:nativeRailCircuits,detectorArgs:{contract:nativeRailDetectors,goldArgs:{contract:nativeRailGold,feedstockArgs:{contract:nativeRailFeedstocks,stockArgs:{contract:nativeRailStock,grade:nativeRailGradeSteel,steelSteam:nativeSteelSteamBucket,ignitionArgs,foundry:nativeFoundryBronze}}}}};
const firstRailCircuits=firstRailCircuitProof(railCircuitArgs);
trace('first rail circuits checked: '+firstRailCircuits.truth);
const railTerminalArgs={contract:nativeRailTerminals,circuitArgs:railCircuitArgs};
const firstRailTerminals=firstRailTerminalProof(railTerminalArgs);
trace('first rail terminals checked: '+firstRailTerminals.truth);
const steelMechanismCandidate=firstSteelMechanismCandidate({contract:nativeSteelMechanism,terminalArgs:railTerminalArgs});
trace('steel mechanism candidate checked: '+steelMechanismCandidate.truth);
const firstMechanismSteelStock=firstMechanismSteelStockProof({contract:nativeMechanismSteelStock,terminalArgs:railTerminalArgs});
trace('mechanism steel stock checked: '+firstMechanismSteelStock.truth);
const mechanismLeadCandidate=firstMechanismLeadCandidate({contract:nativeMechanismLead,stockArgs:{contract:nativeMechanismSteelStock,terminalArgs:railTerminalArgs}});
trace('canonical mechanism lead candidate checked: '+mechanismLeadCandidate.truth);
const firstGeologicalLubricationBucket=firstGeologicalLubricationBucketProof({steelSteam:nativeSteelSteamBucket,startup:nativeStartupLubricant,bucket:nativeLubricationBucket,rubber:nativeNaturalRubber,leather:nativeTfcLeather,ignitionArgs,foundry:nativeFoundryBronze,nativeSteam,powerContract});
trace('geological lubrication bucket checked: '+firstGeologicalLubricationBucket.truth);
const nativeLeadStock=nativeLeadStockContract({root:liveRoot,native,authored,policy,removals,tags,lead:nativeMechanismLead,steelStock:nativeMechanismSteelStock,air:nativeFirstAir,shaft:nativeFirstSteelShaft,detectors:nativeRailDetectors,terminals:nativeRailTerminals,oilBuckets:firstGeologicalLubricationBucket,inscriber:nativeInscriber,buckets:nativeLubricationBucket});
const firstLeadStock=firstLeadStockProof({contract:nativeLeadStock,leadArgs:{contract:nativeMechanismLead,stockArgs:{contract:nativeMechanismSteelStock,terminalArgs:railTerminalArgs}},steelStock:firstMechanismSteelStock,detectors:firstRailDetectors,terminals:firstRailTerminals,oilBuckets:firstGeologicalLubricationBucket});
trace('canonical lead stock checked: '+firstLeadStock.truth);
const nativeNickelStock=nativeNickelStockContract({root:liveRoot,native,authored,policy,removals,tags,world,gold:nativeRailGold,lead:nativeLeadStock,steel:nativeMechanismSteelStock,forgeBindings:nativeForgeBindings});
const firstNickelStock=firstNickelStockProof({contract:nativeNickelStock,leadArgs:{contract:nativeLeadStock,leadArgs:{contract:nativeMechanismLead,stockArgs:{contract:nativeMechanismSteelStock,terminalArgs:railTerminalArgs}},steelStock:firstMechanismSteelStock,detectors:firstRailDetectors,terminals:firstRailTerminals,oilBuckets:firstGeologicalLubricationBucket},leadProof:firstLeadStock});
trace('garnierite nickel stock checked: '+firstNickelStock.truth);
const nativeMechanismOilStock=nativeMechanismOilStockContract({root:liveRoot,startup:nativeStartupLubricant,oilBuckets:firstGeologicalLubricationBucket,steam:nativeSteam,mechanism:nativeSteelMechanism,nickel:firstNickelStock,bucket:nativeLubricationBucket});
const firstMechanismOilStock=firstMechanismOilStockProof({contract:nativeMechanismOilStock,oilArgs:{steelSteam:nativeSteelSteamBucket,startup:nativeStartupLubricant,bucket:nativeLubricationBucket,rubber:nativeNaturalRubber,leather:nativeTfcLeather,ignitionArgs,foundry:nativeFoundryBronze,nativeSteam,powerContract},oilProof:firstGeologicalLubricationBucket,leadProof:firstLeadStock,nickelProof:firstNickelStock});
trace('additional mechanism oil stock checked: '+firstMechanismOilStock.truth);

const nativePrimitiveGold=primitiveGoldEntryContract({root:liveRoot,native,authored,policy,removals,tags,world,gold:nativeRailGold,inscriber:nativeInscriber});
const firstPrimitiveGold=firstPrimitiveGoldEntry({contract:nativePrimitiveGold,gold:nativeRailGold,wroughtArgs:{contract:nativeFirstWrought,industrial:nativeIndustrialIron,recipes,frontier,solve,tagMembers},locks});
trace('primitive gold entry checked: '+firstPrimitiveGold.truth);
const nativePrecisionAttempt=nativePrecisionAttemptContract({root:liveRoot,native,authored,policy,removals,tags,mechanism:nativeSteelMechanism,gold:nativeRailGold,mechanical:nativeMechanicalIronEntry,primitiveGold:nativePrimitiveGold,manual:nativeManualRolling});
const firstPrecisionAttempt=firstPrecisionAttemptProof({contract:nativePrecisionAttempt,wroughtArgs:{contract:nativeFirstWrought,industrial:nativeIndustrialIron,recipes,frontier,solve,tagMembers},locks,mechanical:nativeMechanicalIronEntry,primitiveGold:nativePrimitiveGold,gold:nativeRailGold});
trace('first precision attempt inputs checked: '+firstPrecisionAttempt.truth);
const nativeFormingSetup=nativeFormingSetupContract({root:liveRoot,native,authored,policy,removals,tags,controller:nativeControllerLine,precision:nativePrecisionAttempt,locks});
const firstFormingSetup=firstFormingSetupProof({contract:nativeFormingSetup,precisionArgs:{contract:nativePrecisionAttempt,wroughtArgs:{contract:nativeFirstWrought,industrial:nativeIndustrialIron,recipes,frontier,solve,tagMembers},locks,mechanical:nativeMechanicalIronEntry,primitiveGold:nativePrimitiveGold,gold:nativeRailGold}});
trace('early forming setup checked: '+firstFormingSetup.truth);
const firstSteelPressStock=steelPressStockPlan({precision:nativePrecisionAttempt,forming:nativeFormingSetup,mechanism:nativeSteelMechanism,steel:nativeMechanismSteelStock,proofs:{precision:firstPrecisionAttempt,forming:firstFormingSetup,steel:firstMechanismSteelStock,kinds:steelMechanismCandidate},tags,locks});
trace('conditional steel press and heavy-plate stock checked: '+firstSteelPressStock.truth);
const firstPrecisionBatchStock=precisionBatchStockPlan({root:liveRoot,precision:nativePrecisionAttempt,primitive:nativePrimitiveGold,gold:nativeRailGold,press:firstSteelPressStock,proofs:{precision:firstPrecisionAttempt,primitive:firstPrimitiveGold,forming:firstFormingSetup},tags});
trace('eight precision before press stock checked: '+firstPrecisionBatchStock.truth);
const firstSteelMechanismStock=steelMechanismStockPlan({root:liveRoot,mechanism:nativeSteelMechanism,precisionBatch:firstPrecisionBatchStock,forming:nativeFormingSetup,lead:firstLeadStock,nickel:firstNickelStock,oil:firstMechanismOilStock,spoutCapacity:nativeLubricationBucket.quantityPlan.spoutTankCapacity,tags});
trace('eight steel mechanism stock checked: '+firstSteelMechanismStock.truth);
const bulkWroughtLedger=bulkWroughtConservation({wrought:nativeFirstWrought,terminals:nativeRailTerminals,steel:nativeMechanismSteelStock,nickel:nativeNickelStock});
trace('bulk wrought metal conservation checked: '+bulkWroughtLedger.truth);
const additionalMiCasingStock=miCasingStockPlan({root:liveRoot,bucket:nativeSteelSteamBucket,steel:nativeMechanismSteelStock,wrought:nativeFirstWrought,nickel:nativeNickelStock,mechanism:nativeSteelMechanism,precisionBatch:firstPrecisionBatchStock,mechanismStock:firstSteelMechanismStock,forming:nativeFormingSetup,steelProof:firstMechanismSteelStock,nickelProof:firstNickelStock,tags,locks});
trace('additional MI casing stock checked: '+additionalMiCasingStock.truth);
const firstLocomotivePumpStock=locomotivePumpStock({root:liveRoot,native,authored,policy,removals,tags,locks,forming:nativeFormingSetup,precision:firstPrecisionBatchStock,casing:additionalMiCasingStock});
trace('locomotive pump stock checked: '+firstLocomotivePumpStock.truth);
const firstLavaRigRecovery=nativeLavaRigRecovery({root:liveRoot,forming:nativeFormingSetup,formingProof:firstFormingSetup,pumpProof:firstLocomotivePumpStock});
trace('portable lava rig recovery checked: '+firstLavaRigRecovery.truth);
const firstPoweredLavaCapture=lavaCaptureStock({root:liveRoot,native,authored,policy,removals,tags,locks,forming:nativeFormingSetup,controller:nativeControllerLine,steel:nativeMechanismSteelStock,pump:firstLocomotivePumpStock,recovery:firstLavaRigRecovery,world:world.nativeTerrestrialLava});
trace('paid two-site powered lava capture checked: '+firstPoweredLavaCapture.truth);


const foundrySolved=solve(geologicalRubberSuppliers.rules,geologicalRubberSuppliers.seed),foundryTargets=['createbigcannons:basin_foundry_lid','create:basin','create:blaze_burner','capability:heated_burner','capability:foundry_bronze_melting','fluid:createbigcannons:molten_bronze','capability:foundry_bronze_cold_casting','createbigcannons:bronze_ingot'],foundryMissing=foundryTargets.filter(id=>!foundrySolved.reached.has(id)),foundryLeaves=e=>foundrySolved.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(foundryLeaves))];
const foundryBronzeCandidate={truth:foundryMissing.length?'INCOMPLETE_NATIVE_FOUNDRY_BRONZE_SUPPLIER':'STATIC_REACHABLE_FOUNDRY_BRONZE_CANDIDATE',targets:foundryTargets,missing:foundryMissing,missingDetails:foundryMissing.map(out=>({output:out,producers:geologicalRubberSuppliers.rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:foundryLeaves(r.requirements)}))})),witnesses:Object.fromEntries(foundryTargets.map(id=>[id,foundrySolved.witness.get(id)??null])),researchOwners:Object.fromEntries(Object.values(nativeFoundryBronze.ids).map(id=>[id,locks.get(id)??[]])),noBronzeOrBurnerSeedInserted:true,quantityPlan:nativeFoundryBronze.quantityPlan,limits:['Diagnostic candidate under the strict first-steel/shaft frontier, not an added completed supplier flag. Native mechanics do not provide missing captured-burner or expedition supplies.',...nativeFoundryBronze.limits]};

trace('first steel shafts/geological rubber checked: '+firstSteelShaft.truth+'/'+firstGeologicalNaturalRubber.truth);
// Select the Earth quartzite and ordinary geological coking paths for the
// finite first native silicon batch; other silicon processors stay alternatives.
const siliconSelected=new Map([['minecraft:quartz',nativeEarlyCrushing.quartzMilling.sourceId],['tfc:rock/raw/quartzite','world:tfc_isolated_quartzite'],['fluid:tfmg:liquid_silicon',nativeSiliconFurnace.sourceId],['tfmg:silicon_ingot','tfmg:casting/silicon']]);
for(const id of siliconSelected.keys())assert(!crafterSeed.has(id),'First silicon must not inherit '+id);
const siliconRules=cokeRules.map(r=>({...r,outputs:r.outputs.filter(id=>!siliconSelected.has(id)||siliconSelected.get(id)===r.id)})),siliconSolved=solve(siliconRules,crafterSeed);
const siliconTargets=['minecraft:quartz',cokeTarget,'capability:tfmg_silicon_furnace','fluid:tfmg:liquid_silicon','tfmg:silicon_ingot'];
const firstNativeSilicon={truth:siliconTargets.every(id=>siliconSolved.reached.has(id))?'BOUNDED_NATIVE_EARTH_QUARTZ_TO_SILICON':'INCOMPLETE_FIRST_NATIVE_SILICON',targets:siliconTargets,witnesses:Object.fromEntries(siliconTargets.map(id=>[id,siliconSolved.witness.get(id)??null])),nativeContract:nativeSiliconFurnace,quartzSupplier:{geology:survival.quartziteSource,milling:nativeEarlyCrushing.quartzMilling},quantityPlan:nativeSiliconFurnace.quantityPlan,negativeCases:[],limits:['Earlier workshop frontier plus specific native Earth quartzite, repaired native milling, first powered coke crushing and geological coking suppliers. No free quartz/silicon/coke stock, soul-fire haunting, offworld expedition or heated burner is required.','The retained native reaction yields40mB per quartz. Three recovered quartz yield120mB; one native90mB casting produces oneTFMGsilicon ingot and retains30mB. Core casting batch compatibility and handling service remain explicit.','Raw quartzite isolation and milling have conditional field/roll requirements. Finite material, fuel and structure counts are plans, not actual inventories, successful formation/processing, throughput or whole17-age acceptance.']};
if(firstNativeSilicon.truth==='BOUNDED_NATIVE_EARTH_QUARTZ_TO_SILICON'){
 for(const [name,blocked]of [['no_native_quartz',['minecraft:quartz']],['no_quartzite',['tfc:rock/raw/quartzite']],['no_crushing_service',['capability:early_crushing_service']],['no_quartz_milling_service',['capability:early_millstone_service']],['no_millstone',['greate:andesite_alloy_millstone']],['no_millstone_gearbox',['greate:andesite_alloy_gearbox']],['no_coke_dust',[cokeTarget]],['no_native_furnace',['capability:tfmg_silicon_furnace']],['no_fireproof_walls',['tfmg:fireproof_bricks']],['no_corner_supports',['tfmg:fireproof_brick_reinforcement']],['no_furnace_output',['tfmg:blast_furnace_output']],['no_top_hatch',['tfmg:blast_furnace_hatch']],['no_fluid_handling',['capability:tfmg_vat_fluid_handling']],['no_casting_basin',['tfmg:casting_basin']],['no_chute',['create:chute']]]){const absent=new Set(blocked);assert(!solve(siliconRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...crafterSeed].filter(([id])=>!absent.has(id)))).reached.has('tfmg:silicon_ingot'),'First native silicon bypasses '+name);firstNativeSilicon.negativeCases.push({name,rejected:true});}
 for(const [name,id]of [['no_quartzite_source','world:tfc_isolated_quartzite'],['no_native_quartz_milling',nativeEarlyCrushing.quartzMilling.sourceId],['no_native_coke_crushing',cokeDustSource],['no_native_silicon_reaction',nativeSiliconFurnace.sourceId],['no_native_silicon_casting','tfmg:casting/silicon']]){assert(!solve(siliconRules.filter(r=>r.id!==id),crafterSeed).reached.has('tfmg:silicon_ingot'),'First native silicon bypasses '+name);firstNativeSilicon.negativeCases.push({name,rejected:true});}
}
// First heated magnetic-alloy batch composes only the reviewed terrestrial
// silicon, Beneath ritual/fortress capture and native andesite mixer services.
const scytheBlade='tfc:metal/scythe_blade/bronze',scytheMold='tfc:ceramic/scythe_blade_mold',scytheCasting='tfc:casting/bronze_scythe_blade',bronzeMelting='tfc:heating/metal/ingot/bronze';
const scytheCastingBill=batchData(scytheCasting);assert.equal(scytheCastingBill.type,'tfc:casting');assert.deepEqual(scytheCastingBill.fluid,{amount:100,fluid:'tfc:metal/bronze'});assert.deepEqual(scytheCastingBill.mold,{item:scytheMold});assert.deepEqual(scytheCastingBill.result,{count:1,id:scytheBlade});
const bronzeMeltingBill=batchData(bronzeMelting);assert.deepEqual(bronzeMeltingBill.result_fluid,{amount:100,id:'tfc:metal/bronze'});assert.equal(bronzeMeltingBill.temperature,950);
const heatedSelected=new Map([...siliconSelected,[scytheBlade,scytheCasting],['fluid:tfc:metal/bronze',bronzeMelting],['tfmg:magnetic_alloy_ingot',nativeHeatedMixing.sourceId],['create:blaze_burner','native:create_capture_blaze'],['minecraft:netherrack','world:nether_isolated_netherrack']]);
const heatedRules=siliconRules.map(r=>({...r,outputs:r.outputs.filter(id=>!heatedSelected.has(id)||heatedSelected.get(id)===r.id)}));
const heatedSolved=solve(heatedRules,crafterSeed),heatedTargets=[scytheMold,'fluid:tfc:metal/bronze',scytheBlade,netherSupplier.entry.weapon,'capability:beneath_portal_access','capability:nether_alive_return_route','minecraft:netherrack','create:empty_blaze_burner','create:blaze_burner','capability:heated_burner','capability:andesite_heated_mixing','tfmg:magnetic_alloy_ingot'];
const firstHeatedMagneticAlloy={truth:heatedTargets.every(id=>heatedSolved.reached.has(id))?'BOUNDED_NATIVE_BENEATH_BLAZE_TO_MAGNETIC_ALLOY':'INCOMPLETE_FIRST_HEATED_MAGNETIC_ALLOY',targets:heatedTargets,witnesses:Object.fromEntries(heatedTargets.map(id=>[id,heatedSolved.witness.get(id)??null])),nativeWorld:netherSupplier,nativeMixing:nativeHeatedMixing,quantityPlan:{scythe:1,scytheCasting:{route:scytheCasting,mold:scytheMold,bronzeMb:100,meltingRoute:bronzeMelting},placedCopperAnvils:8,eligibleSheep:1,emptyBurners:1,capturedBurners:1,selectedReturnTrips:2,mixing:nativeHeatedMixing.batch,drive:nativeHeatedMixing.drive},negativeCases:[],limits:['Explicit earlier workshop frontier plus manufactured bronze scythe (all native overlay inputs), existing copper anvil stock, native TFC sheep and unchanged enabled Beneath sacrifice. Eight placed offerings, main-hand final blow, native explosion/zoglins/lightning and portal existence are real conditions, not performed actions.','First return can bring isolated netherrack for the empty burner; a second portal expedition captures a living vanilla blaze from the declared native fortress population. No arbitrary loot, blaze powder, Ember/Soul Blaze or unreviewed Overworld source is used.','The exact native2nickel+2steel+1TFMGsilicon->2magnetic-alloy batch uses a tier0andesite mixer and actual regular burner heat. Dedicated8SUsource and tier capacity at8RPM, loading4SU; no capacity, recipe or research change is introduced.','Actual ritual/portal/mob encounter, thermal protection, combat, inventories, quantity/flow/wiring, native transformation/registration/matching and processing remain runtime qualification. This is not a safe-trip, advanced-motor, controller or whole17-age acceptance claim.']};
if(firstHeatedMagneticAlloy.truth==='BOUNDED_NATIVE_BENEATH_BLAZE_TO_MAGNETIC_ALLOY'){
 const noLateHeat=new Set(['modern_industrialization:advanced_motor','modern_industrialization:advanced_pump','greate:aluminium_mechanical_mixer','greate:stainless_steel_mechanical_mixer',...expeditionByDimension.values()]);
 assert(solve(heatedRules.map(r=>({...r,outputs:r.outputs.filter(id=>!noLateHeat.has(id))})),new Map([...crafterSeed].filter(([id])=>!noLateHeat.has(id)))).reached.has('tfmg:magnetic_alloy_ingot'),'First heated mixing requires a later motor/pump, mixer or planetary return');firstHeatedMagneticAlloy.noAdvancedMotorOrPlanetarySupplierRequired=true;

 for(const [name,blocked]of [['no_scythe_blade_mold',[scytheMold]],['no_casting_bronze',['fluid:tfc:metal/bronze']],['no_cast_scythe_blade',[scytheBlade]],['no_scythe',[netherSupplier.entry.weapon]],['no_offering_anvil',[netherSupplier.entry.offering]],['no_ritual_portal',['capability:beneath_portal_access']],['no_alive_return',['capability:nether_alive_return_route']],['no_qualified_fortress_blaze',['capability:nether_fortress_living_blaze']],['no_isolated_netherrack',['minecraft:netherrack']],['no_empty_burner',['create:empty_blaze_burner']],['no_captured_burner',['create:blaze_burner']],['no_charcoal',['minecraft:charcoal']],['no_heat',['capability:heated_burner']],['no_andesite_mixer',['greate:andesite_alloy_mechanical_mixer']],['no_andesite_transmission',['greate:andesite_alloy_shaft']],['no_meshing_cog',['greate:andesite_alloy_cogwheel']],['no_water_sources',['create:water_wheel']],['no_basin',['create:basin']],['no_mixing_service',['capability:andesite_heated_mixing']],['no_native_silicon',['tfmg:silicon_ingot']],['no_nickel',['#c:ingots/nickel',...tagMembers('#c:ingots/nickel')]],['no_steel',['#c:ingots/steel',...tagMembers('#c:ingots/steel')]]]){const absent=new Set(blocked);assert(!solve(heatedRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...crafterSeed].filter(([id])=>!absent.has(id)))).reached.has('tfmg:magnetic_alloy_ingot'),'First heated magnetic alloy bypasses '+name);firstHeatedMagneticAlloy.negativeCases.push({name,rejected:true});}
 for(const [name,id]of [['no_native_ritual','world:beneath_sacrifice_portal'],['no_native_capture','native:create_capture_blaze'],['no_native_mixing',nativeHeatedMixing.sourceId],['no_native_scythe_casting',scytheCasting],['no_native_scythe_manufacturer','tfc:crafting/metal/scythe/bronze']]){assert(!solve(heatedRules.filter(r=>r.id!==id),crafterSeed).reached.has('tfmg:magnetic_alloy_ingot'),'First heated magnetic alloy bypasses '+name);firstHeatedMagneticAlloy.negativeCases.push({name,rejected:true});}
}
const firstHeatedObsidianStock=heatedObsidianStock({root:liveRoot,native,authored,policy,removals,tags,locks,capture:firstPoweredLavaCapture,recovery:firstLavaRigRecovery,forming:nativeFormingSetup,rubber:nativeNaturalRubber,rubberProof:firstGeologicalNaturalRubber,heated:nativeHeatedMixing,heatedProof:firstHeatedMagneticAlloy,bucket:nativeSteelSteamBucket,casing:additionalMiCasingStock});
trace('heated obsidian and guaranteed powder checked: '+firstHeatedObsidianStock.truth);
const firstSturdySheetStock=sturdySheetStock({root:liveRoot,native,authored,policy,removals,tags,locks,obsidian:firstHeatedObsidianStock,oil:firstMechanismOilStock,forming:nativeFormingSetup,formingProof:firstFormingSetup,mechanism:nativeSteelMechanism,mechanismStock:firstSteelMechanismStock,recovery:firstLavaRigRecovery,capture:firstPoweredLavaCapture});
trace('one-loop sturdy sheet and recovered tank checked: '+firstSturdySheetStock.truth);
const firstTfcLeverStock=tfcLeverStock({root:liveRoot,native,authored,policy,removals,tags,locks});
trace('TFC lever ingredient repair and conditional stock checked: '+firstTfcLeverStock.truth);
const nativeResearchRuntimeAliases=checkNativeResearchRuntimeAliases({root:liveRoot,native,authored,policy});
trace('exact native Greate research aliases checked: '+nativeResearchRuntimeAliases.truth);
const nativeSawRecipeCycle=checkNativeSawRecipeCycle({root:liveRoot});
trace('deployed Greate saw recipe cycle checked: '+nativeSawRecipeCycle.truth);
const nativeManualApplicationResearch=checkManualApplicationResearch({root:liveRoot,aliasGate:nativeResearchRuntimeAliases,sawCycle:nativeSawRecipeCycle});
trace('manual application player research scope checked: '+nativeManualApplicationResearch.truth);

const firstControlsStock=controlsStock({root:liveRoot,native,authored,policy,removals,tags,locks,sheet:firstSturdySheetStock,lever:firstTfcLeverStock,heat:nativeHeatedMixing,heatProof:firstHeatedMagneticAlloy,obsidian:firstHeatedObsidianStock,detectors:nativeRailDetectors,wrench:firstFormingSetup,manualScope:nativeManualApplicationResearch,aliasGate:nativeResearchRuntimeAliases,eventContract:nativeRecipeEvent});
trace('conditional locomotive controls stock checked: '+firstControlsStock.truth);

const firstFireboxStock=fireboxStock({root:liveRoot,native,authored,policy,removals,tags,locks,world,controls:firstControlsStock,circuits:nativeRailCircuits,gold:nativePrimitiveGold,eventContract:nativeRecipeEvent,heatedProof:firstHeatedMagneticAlloy});
trace('conditional locomotive firebox stock checked: '+firstFireboxStock.truth);

const firstCopperRingStock=copperRingStock({root:liveRoot,native,authored,policy,removals,tags,locks,forming:nativeFormingSetup,sheet:firstSturdySheetStock,pump:firstLocomotivePumpStock,aliases:nativeResearchRuntimeAliases,mechanisms:firstSteelMechanismStock,firebox:firstFireboxStock});
trace('copper ring press repair and conditional stock checked: '+firstCopperRingStock.truth);
const firstPlainGlass=firstNativeClearGlass({contract:nativePlainGlass,recipes,frontier,solve,tagMembers});
trace('native clear glass and pane handoffs checked: '+firstPlainGlass.truth);
const firstBrassSheetStock=brassSheetStock({root:liveRoot,native,authored,policy,removals,tags,locks,world,forge:nativeForgeBindings,gold:nativeRailGold,controls:firstControlsStock,rings:firstCopperRingStock,leather:nativeTfcLeather,circuits:nativeRailCircuits,glass:firstPlainGlass});
trace('conditional four TFC brass sheets checked: '+firstBrassSheetStock.truth);
const firstGlassStock=glassStock({root:liveRoot,native,authored,policy,removals,tags,locks,world,forge:nativeForgeBindings,brass:firstBrassSheetStock,glass:firstPlainGlass,sawCycle:nativeSawRecipeCycle,detectors:nativeRailDetectors,mechanicalIron:nativeMechanicalIronEntry,precision:nativePrecisionAttempt});
trace('funded glass block and pane checked: '+firstGlassStock.truth);
const firstLocomotiveBoilerStock=locomotiveBoilerStock({root:liveRoot,native,authored,policy,removals,tags,locks,foundry:nativeFoundryBronze,rings:firstCopperRingStock,glass:firstGlassStock,sawCycle:nativeSawRecipeCycle,controls:firstControlsStock,firebox:firstFireboxStock,manualScope:nativeManualApplicationResearch});
trace('additional locomotive bronze boiler checked: '+firstLocomotiveBoilerStock.truth);
const firstLocomotiveCastIronPipeStock=locomotiveCastIronPipeStock({root:liveRoot,native,authored,policy,removals,tags,locks,boiler:firstLocomotiveBoilerStock,rings:firstCopperRingStock,forming:nativeFormingSetup});
trace('additional locomotive cast-iron pipe checked: '+firstLocomotiveCastIronPipeStock.truth);
const firstLocomotiveOilHandoff=locomotiveOilHandoff({root:liveRoot,native,authored,policy,removals,tags,startup:nativeStartupLubricant,oilStock:nativeMechanismOilStock,bucket:nativeLubricationBucket,mechanisms:firstSteelMechanismStock,pipes:firstLocomotiveCastIronPipeStock,forming:nativeFormingSetup,recovery:firstLavaRigRecovery});
trace('reused bucket locomotive oil handoff checked: '+firstLocomotiveOilHandoff.truth);
const firstLocomotiveAssemblyStock=locomotiveAssemblyStock({root:liveRoot,native,authored,policy,removals,tags,locks,oil:firstLocomotiveOilHandoff,terminals:firstRailTerminals,rail:nativeRailStock,mechanisms:firstSteelMechanismStock,forming:nativeFormingSetup,execution:nativeSteelMechanism,transport:firstSturdySheetStock,pump:firstLocomotivePumpStock,controls:firstControlsStock,boiler:firstLocomotiveBoilerStock,pipes:firstLocomotiveCastIronPipeStock});
const canonicalSteelProvider=steelProviderAlignment({root:liveRoot,native,authored,policy,removals,tags,forming:nativeFormingSetup,pump:firstLocomotivePumpStock,steel:nativeFirstSteel,rail:nativeRailGradeSteel,oil:firstLocomotiveOilHandoff,assembly:firstLocomotiveAssemblyStock});
const firstFreightObjective=freightObjective({root:liveRoot,native,authored,policy,removals,tags,canonical:canonicalSteelProvider,assembly:firstLocomotiveAssemblyStock,manual:nativeManualRolling,rail:nativeRailStock,railProof:firstRailStock,forming:nativeFormingSetup,oil:firstLocomotiveOilHandoff,casing:additionalMiCasingStock});
trace('complete conditional locomotive assembly checked: '+firstLocomotiveAssemblyStock.truth);

// Preserve the owned lubricated bills and native basic-card manufacturer.
// This scope restores planetary return suppliers needed by aluminum/tharsite,
// while retaining the selected earlier workbench, quartz, heat and coke paths.
const motionIds={motor:'createch2:advanced_electric/mi/advanced_motor_lubricated_assembly',pump:'createch2:advanced_electric/mi/advanced_pump_lubricated_assembly',upgrades:'modern_industrialization:electric_age/upgrades/basic',lubricant:'modern_industrialization:materials/mixer/lubricant',cable:'modern_industrialization:materials/tin/packer/cable',assembler:'createch2:low_voltage/mi/assembler_prototype',coalDust:'createch2:chemical_age/mi/coal_dust_from_geological_coal',coal:'modern_industrialization:materials/coal/compressor/coal',coalBlock:'modern_industrialization:materials/coal/packer/block',diamond:'modern_industrialization:vanilla_recipes/compressor/diamond_from_coal',compressor:'createch2:low_voltage/mi/electric_compressor_prototype',cutter:'modern_industrialization:steam_age/bronze/cutting_machine_asbl',bolts:'modern_industrialization:materials/aluminum/cutting_machine/rod',rotor:'modern_industrialization:materials/aluminum/craft/rotor',ring:'modern_industrialization:materials/aluminum/craft/ring',blade:'modern_industrialization:materials/aluminum/craft/blade'};
const motionOutputs={motor:'modern_industrialization:advanced_motor',pump:'modern_industrialization:advanced_pump',upgrades:'modern_industrialization:basic_upgrade',lubricant:'fluid:modern_industrialization:lubricant',cable:'modern_industrialization:tin_cable',assembler:'modern_industrialization:assembler',coalDust:'modern_industrialization:coal_dust',coal:'minecraft:coal',coalBlock:'minecraft:coal_block',diamond:'minecraft:diamond',compressor:'modern_industrialization:electric_compressor',cutter:'modern_industrialization:bronze_cutting_machine',bolts:'modern_industrialization:aluminum_bolt',rotor:'modern_industrialization:aluminum_rotor',ring:'modern_industrialization:aluminum_ring',blade:'modern_industrialization:aluminum_blade'};
for(const[id,data]of Object.entries(nativeLvAssembler.recipes))assert.deepEqual(batchData(id),data,'Retain exact native/owned motion bill '+id);
const motionSelected=new Map([...crafterSelected,...wheelSelected,...cokeSelected,...heatedSelected,...Object.entries(motionOutputs).map(([key,id])=>[id,motionIds[key]])]);
for(const id of Object.values(motionOutputs))assert(!frontier.has(id),'Do not inherit first advanced motion stock '+id);
const motionSeed=new Map([...frontier].filter(([id])=>id!=='minecraft:crafting_table'&&id!=='avaritia:compressed_crafting_table'));
const motionRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>(!motionSelected.has(id)||motionSelected.get(id)===r.id)&&(id!=='capability:industrial_power'||r.id==='native:mi_steam_service')&&id!=='minecraft:crafting_table'&&id!=='avaritia:compressed_crafting_table'),requirements:all([r.requirements,...([motionIds.motor,motionIds.pump].includes(r.id)?[leaf('capability:lv_assembler_64_service')]:[]),...(r.id===motionIds.diamond?[leaf(motionOutputs.compressor),leaf('capability:industrial_power')]:[]),...(r.id===motionIds.coal?[leaf(motionOutputs.coalDust)]:[]),...(r.id===motionIds.coalDust?[leaf('tfc:ore/bituminous_coal')]:[]),...(r.id===motionIds.bolts?[leaf(motionOutputs.cutter),leaf('capability:steam_service')]:[])])}));
const motionSolved=solve(motionRules,motionSeed),motionTargets=['capability:lv_assembler_64_service',...Object.values(motionOutputs)],motionOwners=locks.get(motionIds.motor)??[];assert.deepEqual(locks.get(motionIds.pump),motionOwners);assert.equal(motionOwners.length,1);
const motorBill=batchData(motionIds.motor),pumpBill=batchData(motionIds.pump),lubricantBill=batchData(motionIds.lubricant);
assert.deepEqual(motorBill.item_outputs,[{item:motionOutputs.motor,amount:1}]);assert.deepEqual(pumpBill.item_outputs,[{item:motionOutputs.pump,amount:1}]);
assert.deepEqual(motorBill.fluid_inputs,{fluid:'modern_industrialization:lubricant',amount:100});assert.deepEqual(pumpBill.fluid_inputs,{fluid:'modern_industrialization:lubricant',amount:250});
assert.deepEqual(pumpBill.item_inputs.find(v=>v.item===motionOutputs.motor),{item:motionOutputs.motor,amount:1});
assert.deepEqual(lubricantBill.fluid_outputs,{fluid:'modern_industrialization:lubricant',amount:500});
assert(tagMembers('#c:dusts/coal').includes(motionOutputs.coalDust));assert.deepEqual(batchData(motionIds.bolts).fluid_inputs,[{amount:1,fluid:'modern_industrialization:lubricant'}]);assert.deepEqual(batchData(motionIds.bolts).item_outputs,[{amount:2,item:motionOutputs.bolts}]);
const motionGrossInputs={};for(const[bill,runs]of [[motorBill,2],[pumpBill,1]])for(const v of bill.item_inputs){const key=v.item??'#'+v.tag;motionGrossInputs[key]=(motionGrossInputs[key]??0)+v.amount*runs;}
const firstAdvancedMotion={truth:motionTargets.every(id=>motionSolved.reached.has(id))?'BOUNDED_NATIVE_FIRST_ADVANCED_MOTOR_AND_PUMP':'INCOMPLETE_FIRST_ADVANCED_MOTION',targets:motionTargets,witnesses:Object.fromEntries(motionTargets.map(id=>[id,motionSolved.witness.get(id)??null])),researchOwners:motionOwners,selectedRecipes:motionIds,nativeAssembler:nativeLvAssembler,quantityPlan:{motorRuns:2,pumpRuns:1,grossItemInputs:motionGrossInputs,advancedMotorsProduced:2,advancedMotorsConsumed:1,advancedMotorsRetained:1,advancedPumpsRetained:1,lubricantRuns:1,lubricantInput:{creosoteMb:500,redstone:1},lubricantProducedMb:500,motionLubricantMb:450,boltCuttingLubricantMb:7,lubricantConsumedMb:457,lubricantRetainedMb:43,rotors:{crafts:2,blades:8,rings:2,bolts:8},rings:{crafts:1,output:2,bolts:4,rods:4},boltCutting:{runs:7,rods:7,boltsProduced:14,forRotors:8,forRings:4,forPump:2,eu:2800},cutterDiamond:{sourceBituminousCoal:144,coalDust:144,coal:144,coalBlocks:16,diamonds:1,geologicalDustEu:28800,coalCompressionEu:28800,blockPackingEu:3200,diamondCompressionEu:24000,totalPreparationEu:84800,diamondBatch:nativeLvAssembler.diamondBatch},basicUpgrades:nativeLvAssembler.basicPlan,motionBatchEu:2*nativeLvAssembler.motorBatch.requiredEu+nativeLvAssembler.pumpBatch.requiredEu,steamLoadsPerMotionBatch:2,fullSteamLoadMb:16000,oneConsumerAtATime:true},negativeCases:[],limits:['Scoped selected manufacturers compose existing earlier-workshop stocks with the reviewed native Earth quartz/coke/heat route and existing Moon/Mars return suppliers. No advanced motor, pump, lubricant, assembler, cable or upgrade is inherited as free stock.','The exact existing64EU/t400tick motor and64EU/t500tick pump bills, yields, IDs and SPC-06 ownership are retained. Two motor runs leave one motor after the pump consumes the other; one500mBlubricant batch covers450mB for motion plus7mB for fourteen bolts, retaining43mB. Native hand rotor/ring bills retain all fourteen bolt uses. The first bronze cutter diamond is compressed from sixteen blocks made from144geological coal dust, not free gemstone stock. Upstream material quantities are explicit procurement requirements, not measured inventory.','The16basic-card service uses the native assembler base32EU admission plus2EU per card. Native8EU card manufacture precedes card installation. Each selected motor/pump batch can accumulate actual32EU/t delivery and pause/refill between two16000mBsteam loads. This does not require anMVcasing, advanced upgrade or a64EU/tgenerator.','Graph checks item/fluid kinds and owners; the independent finite ledger checks the selected power/refill budget. Intermediate processing, actual quantities/transfer/faces/output space, native loaded registration/matching and successful operation remain runtime qualification. Whole17-age acceptance remains incomplete.']};
if(firstAdvancedMotion.truth==='BOUNDED_NATIVE_FIRST_ADVANCED_MOTOR_AND_PUMP'){
 for(const[name,blocked,target]of [['no_basic_upgrades',[motionOutputs.upgrades],motionOutputs.motor],['no_assembler',[motionOutputs.assembler],motionOutputs.motor],['no_native_cable',[motionOutputs.cable],motionOutputs.motor],['no_lv_turbine',['modern_industrialization:lv_steam_turbine'],motionOutputs.motor],['no_boiler',['modern_industrialization:bronze_boiler'],motionOutputs.motor],['no_qualified_assembler_service',['capability:lv_assembler_64_service'],motionOutputs.motor],['no_lubricant',[motionOutputs.lubricant],motionOutputs.motor],['no_magnetic_sheet',['tfmg:magnetic_alloy_sheet'],motionOutputs.motor],['no_electronic_control',['modern_industrialization:electronic_circuit'],motionOutputs.motor],['no_ordinary_motor',['modern_industrialization:motor'],motionOutputs.motor],['no_advanced_motor',[motionOutputs.motor],motionOutputs.pump],['no_ordinary_pump',['modern_industrialization:pump'],motionOutputs.pump],['no_rotors',['modern_industrialization:aluminum_rotor'],motionOutputs.pump],['no_bolts',[motionOutputs.bolts],motionOutputs.pump],['no_diamond',[motionOutputs.diamond],motionOutputs.pump],['no_cutter',[motionOutputs.cutter],motionOutputs.pump],['no_geological_coal_dust',[motionOutputs.coalDust],motionOutputs.pump],['no_diamond_compressor',[motionOutputs.compressor],motionOutputs.pump],['no_tharsite',['stellaris:tharsite_ingot'],motionOutputs.pump],['no_owned_unlock',motionOwners,motionOutputs.motor]]){const absent=new Set(blocked);assert(!solve(motionRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...motionSeed].filter(([id])=>!absent.has(id)))).reached.has(target),'First advanced motion bypasses '+name);firstAdvancedMotion.negativeCases.push({name,target,rejected:true});}
 for(const[name,key,target]of [['no_owned_motor','motor',motionOutputs.motor],['no_owned_pump','pump',motionOutputs.pump],['no_native_basic_cards','upgrades',motionOutputs.motor],['no_native_lubricant','lubricant',motionOutputs.motor],['no_prototype_assembler','assembler',motionOutputs.motor],['no_native_diamond_compression','diamond',motionOutputs.pump],['no_native_bolt_cutting','bolts',motionOutputs.pump]]){assert(!solve(motionRules.filter(r=>r.id!==motionIds[key]),motionSeed).reached.has(target),'First advanced motion bypasses '+name);firstAdvancedMotion.negativeCases.push({name,target,rejected:true});}
 const later=new Set(['ae2:inscriber','modern_industrialization:advanced_upgrade','greate:aluminium_mechanical_press','greate:stainless_steel_mechanical_press']);assert([motionOutputs.motor,motionOutputs.pump].every(id=>solve(motionRules.map(r=>({...r,outputs:r.outputs.filter(id=>!later.has(id))})),new Map([...motionSeed].filter(([id])=>!later.has(id)))).reached.has(id)),'First advanced motion requires its later consumer or MVupgrade');firstAdvancedMotion.noLaterPressInscriberOrAdvancedUpgradeRequired=true;firstAdvancedMotion.upstreamAdvancedHullRetainedForAnnealedCopper=true;
}
// Physical inscriber supplier and native FE service preserve the existing
// processed-AE2/industrial-silicon distinction and all owned recipe identities.
assert.deepEqual(authored.get(nativeInscriber.manufacturerId),nativeInscriber.manufacturer);
for(const[id,data]of Object.entries(nativeInscriber.authoredRecipes))assert.deepEqual(authored.get(id),data,'Retain owned inscriber recipe '+id);
assert.deepEqual(batchData(nativeInscriber.siliconSupplierId),nativeInscriber.siliconSupplier);
assert.deepEqual(tagMembers('#createch2:processed_ae2_silicon'),['ae2:silicon']);assert(!tagMembers('#c:silicon').includes('modern_industrialization:silicon_ingot')&&!tagMembers('#c:silicon').includes('ae2:silicon'));assert(tagMembers('#c:dusts/certus_quartz').includes('ae2:certus_quartz_dust'));
const inscriberIds={machine:nativeInscriber.manufacturerId,silicon:nativeInscriber.siliconSupplierId,dust:ae2Ids.certusDust,printedSilicon:'createch2:stainless_digital/ae2/inscriber/printed_silicon',printedLogic:'createch2:stainless_digital/ae2/inscriber/printed_logic_processor',printedCalculation:'createch2:stainless_digital/ae2/inscriber/printed_calculation_processor',printedEngineering:'createch2:stainless_digital/ae2/inscriber/printed_engineering_processor',logic:'createch2:stainless_digital/ae2/processor/logic',calculation:'createch2:stainless_digital/ae2/processor/calculation',engineering:'createch2:stainless_digital/ae2/processor/engineering'};
const inscriberOutputs={machine:'ae2:inscriber',silicon:'ae2:silicon',dust:'ae2:certus_quartz_dust',printedSilicon:ae2Outputs.printedSilicon,printedLogic:ae2Outputs.printedLogic,printedCalculation:ae2Outputs.printedCalculation,printedEngineering:ae2Outputs.printedEngineering,logic:ae2Outputs.logic,calculation:ae2Outputs.calculation,engineering:ae2Outputs.engineering};
const inscriberSelected=new Map([...motionSelected,...certusSelected,...['siliconPress','logicPress','calculationPress','engineeringPress'].map(key=>[ae2Outputs[key],ae2Ids[key]]),...Object.entries(inscriberOutputs).map(([key,id])=>[id,inscriberIds[key]])]);
for(const id of [...Object.values(inscriberOutputs),'capability:ae2_inscriber_service'])assert(!motionSeed.has(id),'Do not inherit physical inscriber supply '+id);
const inscriberRules=motionRules.map(r=>({...r,outputs:r.outputs.filter(id=>!inscriberSelected.has(id)||inscriberSelected.get(id)===r.id)})),inscriberSolved=solve(inscriberRules,motionSeed),inscriberTargets=['ae2:inscriber','capability:ae2_inscriber_service','capability:ae2_silicon_smelting',...Object.values(inscriberOutputs).filter(id=>id!=='ae2:inscriber')],inscriberOwners=locks.get(inscriberIds.machine)??[];assert.equal(inscriberOwners.length,1);
const inscriberQuantity={scope:'One inscriber, four stencils and one of each processor with other upstream parts prepared; selected motion/bolt and native printing batches only.',manufacturer:{runs:1,stainlessPlates:4,advancedPumps:3,advancedHulls:1,digitalCircuits:1},stencils:{runs:4,stainlessPlates:28,digitalCircuits:4,siliconPlates:1,goldIngots:1,certusCrystals:1,diamonds:1},motionPreparation:{advancedMotors:3,advancedPumps:3,motorsConsumedByPumps:3,rotors:6,rings:6,boltCuttingRuns:21,bolts:42,boltUses:{rotors:24,rings:12,pumps:6},lubricantBatchRuns:3,lubricantProducedMb:1500,motionLubricantMb:1050,boltCuttingLubricantMb:21,selectedLubricantRetainedMb:429,motionWorkEu:3*(nativeLvAssembler.motorBatch.requiredEu+nativeLvAssembler.pumpBatch.requiredEu)},certusAllocation:{separatorRuns:3,rawOre:3,guaranteedCrystals:6,calculationStencil:1,calculationPrint:1,guaranteedMaceratorDustForSilicon:3,retainedCrystals:1,optionalDustCounted:0},processedSilicon:{nativeSmeltingRuns:3,guaranteedCertusDust:3,processedAe2Silicon:3,bulkMiSiliconSubstituted:false},slotPlan:nativeInscriber.slotPlan,energy:nativeInscriber.energy};
const firstInscriber={truth:inscriberTargets.every(id=>inscriberSolved.reached.has(id))?'BOUNDED_NATIVE_PHYSICAL_INSCRIBER_AND_FE_SERVICE':'INCOMPLETE_FIRST_PHYSICAL_INSCRIBER',targets:inscriberTargets,witnesses:Object.fromEntries(inscriberTargets.map(id=>[id,inscriberSolved.witness.get(id)??null])),nativeContract:nativeInscriber,selectedRecipes:inscriberIds,researchOwners:inscriberOwners,quantityPlan:inscriberQuantity,negativeCases:[],limits:['Existing COM-04 inscriber and owned printing/finishing routes compose with the bounded advanced pump and earlier native silicon/digital/stainless/End suppliers. No physical inscriber, stencil, printed part, processor, cable, pump or power is inherited free stock.','The processed-AE2 silicon private tag retains only AE2silicon; MIbulk silicon is not substituted. Three guaranteed certus crystals are macerated and natively smelted for three feed items; optional separator dust remains excluded.','The manufacturer consumes three advanced pumps, four stainless plates, one advanced hull and one digital circuit. Four existing stencil bills and the selected nine native-code printing/finishing operations retain their IDs, modes, stock counts and owners.','A dedicated native LV turbine/tin cable FE path supplies a non-front face. The current10FE/EU,0.5AE/FE,1usage ratio gives404EU per unupgraded operation;1600AEbuffer alone fails. Nine printing/finishing runs need3636deliveredEU and continuing replenishment, with no free MEgrid energy.','Actual quantity procurement, trip/return, initialized node/capability/provider/mixin selection, faces/slots/transfer, native timing and successful operation remain runtime qualification. All17-age acceptance is still incomplete.']};
if(firstInscriber.truth==='BOUNDED_NATIVE_PHYSICAL_INSCRIBER_AND_FE_SERVICE'){
 for(const[name,blocked,target]of [['no_physical_device',['ae2:inscriber'],'capability:ae2_inscriber_service'],['no_advanced_pump',[motionOutputs.pump],'ae2:inscriber'],['no_stainless_plate',['modern_industrialization:stainless_steel_plate'],'ae2:inscriber'],['no_advanced_hull',['modern_industrialization:advanced_machine_hull'],'ae2:inscriber'],['no_digital_circuit',['modern_industrialization:digital_circuit'],'ae2:inscriber'],['no_native_cable',[motionOutputs.cable],'capability:ae2_inscriber_service'],['no_native_turbine',['modern_industrialization:lv_steam_turbine'],'capability:ae2_inscriber_service'],['no_boiler',['modern_industrialization:bronze_boiler'],'capability:ae2_inscriber_service'],['no_fe_service',['capability:ae2_inscriber_service'],ae2Outputs.logic],['no_processed_silicon',['ae2:silicon'],ae2Outputs.logic],['no_native_furnace',['minecraft:furnace'],ae2Outputs.logic],['no_silicon_stencil',[ae2Outputs.siliconPress],ae2Outputs.logic],['no_logic_stencil',[ae2Outputs.logicPress],ae2Outputs.logic],['no_guaranteed_certus_dust',['ae2:certus_quartz_dust'],ae2Outputs.logic],['no_certus_crystal',[certusTarget],ae2Outputs.calculation],['no_redstone',['minecraft:redstone'],ae2Outputs.logic],['no_gold',['#c:ingots/gold',...tagMembers('#c:ingots/gold')],ae2Outputs.logic],['no_diamond',['#c:gems/diamond',...tagMembers('#c:gems/diamond')],ae2Outputs.engineering],['no_COM04_owner',inscriberOwners,'ae2:inscriber']]){const absent=new Set(blocked);assert(!solve(inscriberRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...motionSeed].filter(([id])=>!absent.has(id)))).reached.has(target),'Physical inscriber bypasses '+name);firstInscriber.negativeCases.push({name,target,rejected:true});}
 for(const[name,id,target]of [['no_owned_machine',inscriberIds.machine,'ae2:inscriber'],['no_owned_silicon_print',inscriberIds.printedSilicon,ae2Outputs.logic],['no_owned_logic_finish',inscriberIds.logic,ae2Outputs.logic],['no_processed_silicon_smelting',inscriberIds.silicon,ae2Outputs.logic],['no_guaranteed_native_maceration',inscriberIds.dust,ae2Outputs.logic],['no_native_fe_bridge','native:ae2_inscriber_service',ae2Outputs.logic]]){assert(!solve(inscriberRules.filter(r=>r.id!==id),motionSeed).reached.has(target),'Physical inscriber bypasses '+name);firstInscriber.negativeCases.push({name,target,rejected:true});}
 const absent=new Set(['ae2:controller','ae2:energy_acceptor','ae2:fluix_glass_cable']),noMiPrinters=new Set(Object.values(ae2Ids).filter(id=>id.startsWith('modern_industrialization:compat/ae2/')&&!['charged','fluix','certusDust','fluixDust'].some(key=>ae2Ids[key]===id))),independent=solve(inscriberRules.filter(r=>!noMiPrinters.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...motionSeed].filter(([id])=>!absent.has(id))));assert([ae2Outputs.logic,ae2Outputs.calculation,ae2Outputs.engineering].every(id=>independent.reached.has(id)),'Physical inscriber depends on an external ME network or MI printing/finishing alternatives');firstInscriber.noExternalMeHardwareOrMiPrintersRequired=true;
}
// The exact existing controller line is supplied from the physical printer
// and native reduced forming services; completed sequence state is not stock.
for(const[id,data]of Object.entries(nativeControllerLine.recipes))assert.deepEqual(batchData(id),data,'Retain controller/forming bill '+id);
const controllerIds={...nativeControllerLine.ids,controller:nativeControllerLine.ids.assembly,acceptor:'createch2:stainless_digital/ae2/energy_acceptor',cable:'createch2:stainless_digital/ae2/fluix_glass_cable',fluix:ae2Ids.fluix,fluixDust:ae2Ids.fluixDust};
const controllerOutputs={aluminumShaft:'greate:aluminium_shaft',aluminumSaw:'greate:aluminium_mechanical_saw',stainlessShaft:'greate:stainless_steel_shaft',stainlessCog:'greate:stainless_steel_cogwheel',stainlessPress:'greate:stainless_steel_mechanical_press',workpiece:'create_connected:incomplete_control_chip',chip:'create_connected:control_chip',formation:'ae2:formation_core',annihilation:'ae2:annihilation_core',controller:'ae2:controller',acceptor:'ae2:energy_acceptor',cable:'ae2:fluix_glass_cable',fluix:'ae2:fluix_crystal',fluixDust:'ae2:fluix_dust',solder:'fluid:modern_industrialization:soldering_alloy'};
const controllerSelected=new Map([...inscriberSelected,...Object.entries(controllerOutputs).map(([key,id])=>[id,controllerIds[key]])]);for(const id of Object.values(controllerOutputs))assert(!motionSeed.has(id),'Do not inherit controller stock '+id);
const controllerRules=inscriberRules.map(r=>({...r,outputs:r.outputs.filter(id=>!controllerSelected.has(id)||controllerSelected.get(id)===r.id)})),controllerSolved=solve(controllerRules,motionSeed),controllerTargets=[...Object.values(controllerOutputs),'capability:steel_saw_service','capability:aluminum_saw_service','capability:stainless_press_service','capability:controller_line_service'],controllerOwners=locks.get(controllerIds.controller)??[];assert.equal(controllerOwners.length,1);
const matchesWorkpiece=v=>Array.isArray(v)?v.some(matchesWorkpiece):v?.item===controllerOutputs.workpiece||v?.tag&&tagMembers('#'+v.tag).includes(controllerOutputs.workpiece);
const sharedStarts=[...new Set(recipes.filter(r=>r.type==='create:sequenced_assembly'&&matchesWorkpiece(batchData(r.id)?.ingredient)).map(r=>r.id))];assert.deepEqual(sharedStarts,[controllerIds.controller],'The unmarked controller workpiece must identify one active parent sequence');
const firstController={truth:controllerTargets.every(id=>controllerSolved.reached.has(id))?'BOUNDED_NATIVE_FIRST_STAINLESS_PRESS_AND_CONTROLLER':'INCOMPLETE_FIRST_CONTROLLER_LINE',targets:controllerTargets,witnesses:Object.fromEntries(controllerTargets.map(id=>[id,controllerSolved.witness.get(id)??null])),nativeContract:nativeControllerLine,selectedRecipes:controllerIds,researchOwners:controllerOwners,uniqueUnmarkedParent:sharedStarts,quantityPlan:{scope:'Selected forming hardware, controller components, native printing and fluid batches with other upstream factory parts prepared.',hardware:nativeControllerLine.hardware,forming:nativeControllerLine.shaftPlan,drive:nativeControllerLine.power,sequence:nativeControllerLine.sequencePlan,fluid:nativeControllerLine.fluidPlan,processors:nativeControllerLine.processorPlan,cores:{formationCrafts:1,annihilationCrafts:1,logicProcessorsConsumed:2,formationProduced:2,annihilationProduced:2,oneEachConsumedByController:true,oneEachRetained:true},directProcessorDeployment:{logic:1,calculation:1,engineering:1}},negativeCases:[],limits:['Existing advanced motion, stainless/digital/End suppliers and physical inscriber compose the exact owned aluminum saw, stainless shaft/cog/press and controller line. No complete controller, workpiece, control chip, relevant part or fluid is inherited free stock.','One native small wheel and five reciprocal cog reductions supply the unchanged8SUandesite-limited network at0.25RPMmagnitude. The earlier steel saw uses0.5SU, then is consumed by the aluminum upgrade; the completed saw/press/deployer load2.75SU. Native nonzero progress floors permit this drive without raising capacity or bypassing machine/recipe tiers.','The parent has one loop, ten deployments,144mBfilling and one tier3press. Native sequence markers and unique unmarked-parent selection prevent a fresh incomplete item from satisfying later stages. Components are real supplier requirements; completed ItemStack progress is never seeded.','Fifteen owned physical-inscriber operations make3logic/1calculation/1engineering. Two logic feed the two core crafts; one of each core remains after assembly. Five native90mBsolder batches allocate270mBto the two assembler jobs and180mBto the spout, consuming360mBand retaining90mB. Workpiece16kEU, chip12.8kEU, solder6kEU and printing6.06kEU are separate sequential native LV budgets.','Stocks, exact inventories, dynamic recipe/codec/mixin/provider selection, water flow, gear alignment, processor poses, depot transfer, fluid endpoints, actual sequence matching/state and successful operation remain runtime qualification. Whole17-age acceptance is incomplete.']};
if(firstController.truth==='BOUNDED_NATIVE_FIRST_STAINLESS_PRESS_AND_CONTROLLER'){
 for(const[name,blocked,target]of [['no_small_source',['create:water_wheel'],controllerOutputs.controller],['no_reduction_large_cogs',['greate:large_andesite_alloy_cogwheel'],controllerOutputs.controller],['no_drive_shafts',['greate:andesite_alloy_shaft'],controllerOutputs.controller],['no_steel_predecessor',['greate:steel_mechanical_saw'],controllerOutputs.aluminumSaw],['no_advanced_motor',[motionOutputs.motor],controllerOutputs.aluminumSaw],['no_aluminum_saw',[controllerOutputs.aluminumSaw],controllerOutputs.stainlessShaft],['no_qualified_saw_service',['capability:aluminum_saw_service'],controllerOutputs.stainlessShaft],['no_stainless_shaft',[controllerOutputs.stainlessShaft],controllerOutputs.stainlessPress],['no_stainless_cogs',[controllerOutputs.stainlessCog],controllerOutputs.stainlessPress],['no_stainless_press',[controllerOutputs.stainlessPress],controllerOutputs.controller],['no_native_line',['capability:controller_line_service'],controllerOutputs.controller],['no_deployer',['create:deployer'],controllerOutputs.controller],['no_depots',['create:depot'],controllerOutputs.controller],['no_spout',['create:spout'],controllerOutputs.controller],['no_fluid_pipe',['modern_industrialization:fluid_pipe'],controllerOutputs.controller],['no_soldering_fluid',[controllerOutputs.solder],controllerOutputs.controller],['no_workpiece',[controllerOutputs.workpiece],controllerOutputs.controller],['no_control_chip',[controllerOutputs.chip],controllerOutputs.controller],['no_logic',['ae2:logic_processor'],controllerOutputs.controller],['no_calculation',['ae2:calculation_processor'],controllerOutputs.controller],['no_engineering',['ae2:engineering_processor'],controllerOutputs.controller],['no_formation_core',[controllerOutputs.formation],controllerOutputs.controller],['no_annihilation_core',[controllerOutputs.annihilation],controllerOutputs.controller],['no_acceptor',[controllerOutputs.acceptor],controllerOutputs.controller],['no_cable',[controllerOutputs.cable],controllerOutputs.controller],['no_converter',['electroenergetics:converter'],controllerOutputs.controller],['no_owned_unlock',controllerOwners,controllerOutputs.controller]]){const absent=new Set(blocked);assert(!solve(controllerRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...motionSeed].filter(([id])=>!absent.has(id)))).reached.has(target),'Controller line bypasses '+name);firstController.negativeCases.push({name,target,rejected:true});}
 for(const[name,key,target]of [['no_owned_aluminum_saw','aluminumSaw',controllerOutputs.aluminumSaw],['no_owned_stainless_shaft','stainlessShaft',controllerOutputs.stainlessShaft],['no_owned_stainless_press','stainlessPress',controllerOutputs.stainlessPress],['no_owned_workpiece','workpiece',controllerOutputs.controller],['no_owned_control_chip','chip',controllerOutputs.controller],['no_owned_final_sequence','controller',controllerOutputs.controller],['no_native_soldering','solder',controllerOutputs.controller]]){assert(!solve(controllerRules.filter(r=>r.id!==controllerIds[key]),motionSeed).reached.has(target),'Controller line bypasses '+name);firstController.negativeCases.push({name,target,rejected:true});}
 const absent=new Set(['greate:titanium_mechanical_saw','greate:titanium_mechanical_press','modern_industrialization:processing_unit','modern_industrialization:quantum_circuit','modern_industrialization:highly_advanced_machine_hull']);assert(solve(controllerRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...motionSeed].filter(([id])=>!absent.has(id)))).reached.has(controllerOutputs.controller),'First controller requires later titanium/quantum hardware');firstController.noLaterTitaniumOrQuantumRequired=true;
}
// Native geological dye closes the existing diagram's missing dye input.
const blueIds={ore:'world:tfc_graphite_for_blue_dye',powder:'tfc:quern/powder/graphite',dye:'tfc:crafting/blue_dye',diagram:'createch2:synaxis/control/circuit_diagram'},blueOutputs={ore:'tfc:ore/graphite',powder:'tfc:powder/graphite',dye:'minecraft:blue_dye',diagram:'synaxis:circuit_diagram'};
assert.deepEqual(batchData(blueIds.powder),{type:'tfc:quern',ingredient:{item:blueOutputs.ore},result:{count:4,id:blueOutputs.powder}});
assert.deepEqual(batchData(blueIds.dye),{type:'minecraft:crafting_shapeless',category:'misc',ingredients:[[{item:blueOutputs.powder},{item:'tfc:powder/lapis_lazuli'}]],result:{count:1,id:blueOutputs.dye}});
assert.deepEqual(structuredClone(policy.additions.find(r=>r.id===blueIds.diagram)),{file:'kubejs/server_scripts/compatibility/synaxis_authority.js',id:blueIds.diagram,custom:undefined,kind:'shapeless',args:[blueOutputs.diagram,['synaxis:circuit','minecraft:paper',blueOutputs.dye]]});
const blueSelected=new Map(Object.entries(blueOutputs).map(([key,id])=>[id,blueIds[key]]));for(const id of Object.values(blueOutputs))assert(!motionSeed.has(id),'Do not inherit dye/diagram stock '+id);
const blueRules=controllerRules.map(r=>({...r,outputs:r.outputs.filter(id=>id!=='tfc:powder/lapis_lazuli'&&(!blueSelected.has(id)||blueSelected.get(id)===r.id))})),blueSolved=solve(blueRules,motionSeed),blueTargets=Object.values(blueOutputs),blueOwners=locks.get(blueIds.diagram)??[];assert.equal(blueOwners.length,1);
const firstGeologicalBlueDye={truth:blueTargets.every(id=>blueSolved.reached.has(id))?'BOUNDED_TFC_GRAPHITE_TO_SYNAXIS_DIAGRAM':'INCOMPLETE_FIRST_GEOLOGICAL_BLUE_DYE',targets:blueTargets,witnesses:Object.fromEntries(blueTargets.map(id=>[id,blueSolved.witness.get(id)??null])),selectedRecipes:blueIds,researchOwners:blueOwners,world:world.blueDyeMineral,quernNativeSha256:nativeMechanics['blockentities.QuernBlockEntity'],quantityPlan:{graphiteOre:1,quernRuns:1,graphitePowder:4,blueDyeCrafts:4,blueDyeProduced:4,synaxisCircuits:1,paper:1,diagramCrafts:1,diagrams:1,blueDyeRetained:3},negativeCases:[],limits:['Only the exact active native graphite/quartzite ordinary mining source, existing four-powder quern bill, native dye craft and unchanged owned diagram recipe are selected. Neither ore, powder, dye nor diagram is inherited stock. The alternative lapis branch is excluded only in this scoped proof.','The existing native quern requires a usable handstone. TFC bronze mining, light and terrestrial surveying remain explicit supplier requirements. No powered crusher or optional copper-sulfate byproduct is credited for dye.','The existing Synaxis circuit, paper and research owner remain prerequisites. Upstream manufacture follows the stated earlier-factory frontier; this dye proof does not independently qualify every native precision-mechanism sequence or complete Synaxis machinery.','Declared world/recipe/tag and supplier-graph evidence only. Actual deposits, excavation, inventories, native processing/registration and successful diagram crafting remain runtime qualification. Whole17-age acceptance is incomplete.']};
if(firstGeologicalBlueDye.truth==='BOUNDED_TFC_GRAPHITE_TO_SYNAXIS_DIAGRAM'){
 for(const[name,blocked,target]of [['no_graphite_ore',[blueOutputs.ore],blueOutputs.dye],['no_graphite_powder',[blueOutputs.powder],blueOutputs.dye],['no_quern',['tfc:quern'],blueOutputs.dye],['no_handstone',tagMembers('#tfc:quern_handstones'),blueOutputs.dye],['no_survey',['capability:terrestrial_prospecting'],blueOutputs.dye],['no_bronze_pick',['tfc:metal/pickaxe/bronze'],blueOutputs.dye],['no_light',['tfc:torch'],blueOutputs.dye],['no_blue_dye',[blueOutputs.dye],blueOutputs.diagram],['no_circuit',['synaxis:circuit'],blueOutputs.diagram],['no_paper',['minecraft:paper'],blueOutputs.diagram],['no_owner',blueOwners,blueOutputs.diagram]]){const absent=new Set(blocked);assert(!solve(blueRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...motionSeed].filter(([id])=>!absent.has(id)))).reached.has(target),'Geological dye bypasses '+name);firstGeologicalBlueDye.negativeCases.push({name,target,rejected:true});}
 for(const[name,key,target]of [['no_native_mine','ore',blueOutputs.dye],['no_native_quern_recipe','powder',blueOutputs.dye],['no_native_dye_craft','dye',blueOutputs.dye],['no_owned_diagram','diagram',blueOutputs.diagram]]){assert(!solve(blueRules.filter(r=>r.id!==blueIds[key]),motionSeed).reached.has(target),'Geological dye bypasses '+name);firstGeologicalBlueDye.negativeCases.push({name,target,rejected:true});}
 const absent=new Set(['create:crushing_wheel','greate:stainless_steel_crushing_wheel','greate:stainless_steel_mechanical_press','ae2:inscriber','ae2:controller','tfc:ore/lapis_lazuli','tfc:powder/lapis_lazuli','minecraft:lapis_lazuli']);assert(solve(blueRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...motionSeed].filter(([id])=>!absent.has(id)))).reached.has(blueOutputs.dye),'Geological dye requires later hardware/alternate lapis');firstGeologicalBlueDye.noCrusherOrAe2OrLapisRequiredForDye=true;
}
const hammerIds=nativeCopperHammer.ids,hammerOutputs={craft:'tfc:metal/hammer/copper',mold:'tfc:ceramic/unfired_hammer_head_mold',firedMold:'tfc:ceramic/hammer_head_mold',head:'tfc:metal/hammer_head/copper',molten:'fluid:tfc:metal/copper',rod:'tfc:metal/rod/copper',stamen:'tfc_items:copper_stamen',rivet:'tfc_items:copper_rivet'},hammerSelected=new Map(Object.entries(hammerOutputs).map(([key,id])=>[id,hammerIds[key]]));
const hammerRodAlternatives=new Set(['#c:rods/copper',...tagMembers('#c:rods/copper').filter(id=>id!==hammerOutputs.rod)]),hammerSeed=new Map([...frontier].filter(([id])=>!hammerSelected.has(id)&&!hammerRodAlternatives.has(id))),hammerRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!hammerRodAlternatives.has(id)&&(!hammerSelected.has(id)||hammerSelected.get(id)===r.id))})),hammerSolved=solve(hammerRules,hammerSeed),hammerTargets=[...Object.values(hammerOutputs),'capability:copper_hammer_forging_service'];
const orderFixture=read(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_copper_hammer_quest_order.json')),hammerChapter=readQuestSnbt(fs.readFileSync(path.join(liveRoot,orderFixture.chapter),'utf8')),hammerQuests=new Map(hammerChapter.quests.map(q=>[q.id,q]));
for(const[id,dependencies]of Object.entries(orderFixture.afterDependencies)){const q=hammerQuests.get(id);assert.deepEqual(structuredClone(q.dependencies),dependencies);assert.deepEqual({...structuredClone(q),dependencies:orderFixture.before[id].dependencies},orderFixture.before[id],'Only copper hammer prerequisite edges may change '+id);}
const hasAncestor=(graph,id,ancestor,seen=new Set())=>{if(seen.has(id))return false;seen.add(id);return(graph.get(id)?.dependencies??[]).some(d=>d===ancestor||hasAncestor(graph,d,ancestor,seen));};
function checkHammerOrder(graph){assert(hasAncestor(graph,'0F573E8D8FBAA0D6',orderFixture.requiredAnvil));assert(!hasAncestor(graph,orderFixture.requiredAnvil,'0F573E8D8FBAA0D6'));assert(hasAncestor(graph,'0DEE1DD112355C06','0F573E8D8FBAA0D6'));}
checkHammerOrder(hammerQuests);const orderNegatives=[];for(const[id,q]of Object.entries(orderFixture.before)){const old=new Map(hammerQuests);old.set(id,q);assert.throws(()=>checkHammerOrder(old),'Old copper hammer edge restored '+id);orderNegatives.push({name:'restore_old_dependencies_'+id,rejected:true});}
const firstCopperHammer={truth:hammerTargets.every(id=>hammerSolved.reached.has(id))?'BOUNDED_NATIVE_CAST_COPPER_HAMMER_AND_QUEST_ORDER':'INCOMPLETE_FIRST_COPPER_HAMMER',targets:hammerTargets,witnesses:Object.fromEntries(hammerTargets.map(id=>[id,hammerSolved.witness.get(id)??null])),nativeContract:nativeCopperHammer,selectedRecipes:hammerIds,quantityPlan:nativeCopperHammer.quantityPlan,questOrder:{fixture:'mission02_copper_hammer_quest_order.json',anvilBeforeHammer:true,hammerRetainedByCapstone:true,onlyDependencyFieldsChanged:true,negativeCases:orderNegatives},negativeCases:[],limits:[...nativeCopperHammer.limits,'Other copper-rod variants and any inherited rod-tag stock are excluded only in this scoped proof so its selected native two-rod batch and retained-parts ledger are actually exercised.','Three existing quest prerequisite lists now put the stone-hammer flux/welding/copper-anvil path before the fitted metal hammer, retaining that hammer on the canonical capstone path. Quest/task/reward IDs and definitions remain identical; no saved progress is modified.']};
if(firstCopperHammer.truth==='BOUNDED_NATIVE_CAST_COPPER_HAMMER_AND_QUEST_ORDER'){
 for(const[name,blocked]of [['no_mold',[hammerOutputs.firedMold]],['no_head',[hammerOutputs.head]],['no_rivet',[hammerOutputs.rivet]],['no_glue',tagMembers('#c:glue')],['no_handle',[...tagMembers('#c:handle/medium'),...tagMembers('#c:rods/wooden')]],['no_copper_anvil',['tfc:metal/anvil/copper']],['no_earlier_stone_hammer',[nativeCopperHammer.stoneHammer]],['no_heat',['capability:primitive_heat']],['no_forging_service',['capability:copper_hammer_forging_service']],['no_molten_copper',[hammerOutputs.molten]],['no_copper_ingot',['#c:ingots/copper',...tagMembers('#c:ingots/copper')]]]){const absent=new Set(blocked);assert(!solve(hammerRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...hammerSeed].filter(([id])=>!absent.has(id)))).reached.has(hammerOutputs.craft),'First copper hammer bypasses '+name);firstCopperHammer.negativeCases.push({name,rejected:true});}
 for(const[key,id]of Object.entries(hammerIds)){assert(!solve(hammerRules.filter(r=>r.id!==id),hammerSeed).reached.has(hammerOutputs.craft),'First copper hammer bypasses native '+key);firstCopperHammer.negativeCases.push({name:'no_native_'+key,rejected:true});}
 const absent=new Set(['bronze','wrought_iron','steel','black_steel'].flatMap(m=>['tfc:metal/anvil/'+m,'tfc:metal/hammer/'+m]));assert(solve(hammerRules.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...hammerSeed].filter(([id])=>!absent.has(id)))).reached.has(hammerOutputs.craft));firstCopperHammer.noLaterAnvilOrMetalHammerRequired=true;
}
const firstBucketPrecision=firstBucketPrecisionStock({root:liveRoot,precision:nativePrecisionAttempt,primitive:nativePrimitiveGold,gold:nativeRailGold,bucket:nativeSteelSteamBucket,forming:nativeFormingSetup,proofs:{precision:firstPrecisionAttempt,forming:firstFormingSetup},brass:firstBrassSheetStock,tags,locks,ledger});
trace('separate early two-precision stock checked: '+firstBucketPrecision.truth);
const firstBucketNickel=firstBucketNickelStock({nickel:nativeNickelStock,early:firstBucketPrecision,primitive:nativePrimitiveGold,leather:nativeTfcLeather,brass:firstBrassSheetStock,bucket:nativeSteelSteamBucket,forge:nativeForgeBindings,tags,locks});
trace('primitive pre-bucket nickel checked: '+firstBucketNickel.truth);
const report={firstBucketNickel,firstBucketPrecision,firstFreightObjective,canonicalSteelProvider,firstLocomotiveAssemblyStock,firstLocomotiveOilHandoff,firstLocomotiveCastIronPipeStock,firstLocomotiveBoilerStock,firstGlassStock,nativeSawRecipeCycle,firstBrassSheetStock,firstPlainGlass,truth:missingNodes.length||missingPacks.length?'MIXED_RESEARCH_ACQUISITION_INCOMPLETE':'BOUNDED_MIXED_RESEARCH_ACQUISITION',researchNodes:ledger.nodes.length,researchReached:ledger.nodes.length-missingNodes.length,packs:ledger.packs.length,packsReached:ledger.packs.length-missingPacks.length,recipesModeled:recipes.length,ambiguousNative,conservativeOverlays,firstSuit,firstAluminum,firstLunarStudy,firstMartianStudy,firstVenusianStudy,firstMercuryCargo,nativeProcessingUnit,firstProcessingUnit,nativeStarlight,firstStarlight,nativeSuperconductor,firstSuperconductor,nativeMekInfuser,firstMekInfuser,firstElectronicCircuit,firstSteelVat,firstVatProcessing,firstGeologicalAcid,firstCableConnector,firstGeologicalChlorine,firstPvcBoard,firstDigitalSubstrates,firstDigitalCircuit,firstEndMaterials,firstEndCertus,firstAe2Processors,firstMechanicalCrafter,firstCrushingHardware,firstCrushingService,firstNativeSilicon,firstHeatedMagneticAlloy,firstAdvancedMotion,firstInscriber,firstController,firstGeologicalBlueDye,firstCopperHammer,firstWitchHerbs,firstIndustrialIron,firstWrought,firstNaturalRubber,nativeNaturalRubber,firstStartupLubricant,nativeStartupLubricant,firstTfcStartupHardware,tfcStartupHardware,firstAir,nativeFirstAir,firstHotAir,nativeFirstHotAir,firstGeologicalCoke,nativeGeologicalCoke,firstSteel,nativeFirstSteel,firstSteelShaft,nativeFirstSteelShaft,firstGeologicalNaturalRubber,nativeFirstIgnition,firstIgnition,nativeSteelSteamBucket,firstSteelSteamBucket,firstGeologicalLubricationBucket,nativeManualRolling,firstManualRolling,nativeRailGradeSteel,firstRailGradeSteel,nativeRailStock,firstRailStock,nativeRailFeedstocks,firstRailFeedstocks,nativeRailGold,firstRailGold,nativeRailDetectors,firstRailDetectors,nativeRailCircuits,firstRailCircuits,nativeRailTerminals,firstRailTerminals,nativeSteelMechanism,steelMechanismCandidate,nativeMechanismSteelStock,firstMechanismSteelStock,nativeMechanismLead,mechanismLeadCandidate,nativeLeadStock,firstLeadStock,nativeNickelStock,firstNickelStock,nativeMechanismOilStock,firstMechanismOilStock,nativePrecisionAttempt,firstPrecisionAttempt,nativeFormingSetup,firstFormingSetup,firstSteelPressStock,firstPrecisionBatchStock,firstSteelMechanismStock,bulkWroughtLedger,additionalMiCasingStock,firstLocomotivePumpStock,firstLavaRigRecovery,firstPoweredLavaCapture,firstHeatedObsidianStock,firstSturdySheetStock,firstTfcLeverStock,nativeResearchRuntimeAliases,nativeManualApplicationResearch,firstControlsStock,firstFireboxStock,firstCopperRingStock,nativePreparseExclusions:[{id:'create:crafting/kinetics/wrench',provider:'greate',evidence:'nativeFormingSetup.nativeCodeSha256',replacement:'createch2:age_foundation/create/wrench'}],nativeMechanicalIronEntry,firstMechanicalIron,nativePrimitiveGold,firstPrimitiveGold,nativeFoundryBronze,foundryBronzeCandidate,metalFluidUnitTags,firstTfcLeather,nativeTfcLeather,firstLubricationBucket,nativeLubricationBucket,nativeFirstWrought,nativeIndustrialIron,nativeCopperHammer,nativeRecipeEvent,nativeControllerLine,nativeInscriber,inscriberAdmissions,nativeLvAssembler,nativeHeatedMixing,nativeSiliconFurnace,nativeEarlyCrushing,nativeGeneratedPlate,nativeColdworks,nativeSteam,castingContract,castingAdmissions,nativeVat,vatSchemaChecks,vatAdmissions,sourceNormalizations:policy.modifications.length,normalizationWitnesses,sourceModificationsNotReplayed:0,nativeMechanics,nativeLifeSupport,freshFoodGuards:[...freshFoodGuards],waves:solved.waves,missingNodes,missingPacks,pendingFirstRoutes,cutLeaves:[...cuts].sort((a,b)=>b[1]-a[1]).map(([id,uses])=>({id,uses})),frontier:Object.fromEntries(frontier),upgradeNeeds:[...upgradeNeeds.values()],witnesses:Object.fromEntries(solved.witness),targetDetails,unsupportedCodecs:Object.fromEntries([...unsupported].map(([type,rows])=>[type,{count:rows.length,examples:rows.slice(0,3)}])),limits:['canonicalSteelProvider supersedes historical raw TFMG/Railcraft/MI steel-ingot labels for the reviewed AU projection; earlier reachability witnesses do not prove those physical provider inventories. Quantities remain conditional and no stock is added.','Fresh-food requirements retain an existential fresh-harvest/processing condition; storage decay, calendar time and successful feeding are not simulated.','Frontier explicitly inherits earlier terrestrial factory stocks; this is not yet a full geology-to-Infinity proof.','Native event layers distinguish original-resource removals/normalizations from separately applied scripted additions. The delimited shipped metal-fluid-unit callbacks are replayed; other runtime fluid-tag callbacks, condition/codec failures and loaded unification behavior remain unqualified. This candidate census is not acceptance proof.','Recipes with unmodeled processors/ingredient constraints are excluded, never treated as free producers.','Installed tag declarations are replayed; native matching/unification and actual registration remain runtime qualification.','Machine-capacity upgrade counts and power hardware dependencies are modeled; operation, throughput and network capacity are not proven.']};
fs.writeFileSync(path.join(state,'research-acquisition-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,researchReached:report.researchReached,packsReached:report.packsReached,missingNodes,missingPacks,pendingFirstRoutes,cutLeaves:report.cutLeaves.slice(0,35),targetDetails}));
if(process.argv.includes('--require-complete'))assert.equal(report.truth,'BOUNDED_MIXED_RESEARCH_ACQUISITION');

if(process.argv.includes('--require-targets')){assert(requested.length,'Specify at least one --target');assert(targetDetails.every(t=>t.reached),'Unreached requested acquisition targets: '+targetDetails.filter(t=>!t.reached).map(t=>t.id).join(', '));}
requireFirst('--require-first-suit',()=>assert.equal(firstSuit.truth,'BOUNDED_NATIVE_TFC_SUIT_SUPPLIERS'));
requireFirst('--require-first-aluminum',()=>assert.equal(firstAluminum.truth,'BOUNDED_FIRST_ALUMINUM_WITHOUT_ELECTRONIC_CIRCUIT'));
requireFirst('--require-first-lunar-study',()=>assert.equal(firstLunarStudy.truth,'BOUNDED_LUNAR_MONUMENT_TO_NOTEBOOK'));
requireFirst('--require-first-martian-study',()=>assert.equal(firstMartianStudy.truth,'BOUNDED_MARTIAN_RECORD_SUPPLIERS'));
requireFirst('--require-first-venusian-study',()=>assert.equal(firstVenusianStudy.truth,'BOUNDED_VENUSIAN_FIELD_SUPPLIERS'));
requireFirst('--require-first-mercury-cargo',()=>assert.equal(firstMercuryCargo.truth,'BOUNDED_NATIVE_STAGED_MERCURY_CARGO'));
requireFirst('--require-first-processing-unit',()=>assert.equal(firstProcessingUnit.truth,'BOUNDED_NATIVE_LUNAR_AND_TFC_PROCESSING_UNIT'));
requireFirst('--require-first-starlight',()=>assert.equal(firstStarlight.truth,'BOUNDED_NATIVE_STARLIGHT_RETURN_FEEDSTOCKS'));
requireFirst('--require-first-superconductor',()=>assert.equal(firstSuperconductor.truth,'BOUNDED_NATIVE_RETURNED_SUPERCONDUCTOR_AND_QUBIT'));
requireFirst('--require-first-mek-infuser',()=>assert.equal(firstMekInfuser.truth,'BOUNDED_NATIVE_MEK_INFUSER_CONTROLS'));

requireFirst('--require-first-electronic-circuit',()=>assert.equal(firstElectronicCircuit.truth,'BOUNDED_NATIVE_SAPPHIRE_ELECTRONIC_PROTOTYPE'));

requireFirst('--require-first-steel-vat',()=>assert.equal(firstSteelVat.truth,'BOUNDED_STEEL_CHEMICAL_VAT_MANUFACTURE'));

requireFirst('--require-first-vat-processing',()=>assert.equal(firstVatProcessing.truth,'BOUNDED_NATIVE_NAPHTHA_VAT_CRACKING'));

requireFirst('--require-first-geological-acid',()=>assert.equal(firstGeologicalAcid.truth,'BOUNDED_TFC_MINERALS_TO_NATIVE_ACID'));

requireFirst('--require-first-cable-connector',()=>assert.equal(firstCableConnector.truth,'BOUNDED_NATIVE_CABLE_CONNECTOR_MANUFACTURE'));

requireFirst('--require-first-geological-chlorine',()=>assert.equal(firstGeologicalChlorine.truth,'BOUNDED_TFC_HALITE_TO_MI_CHLORINE'));

requireFirst('--require-first-pvc-board',()=>assert.equal(firstPvcBoard.truth,'BOUNDED_NATIVE_MI_PVC_TO_ETCHED_BOARD'));

requireFirst('--require-first-digital-substrates',()=>assert.equal(firstDigitalSubstrates.truth,'BOUNDED_NATIVE_STAINLESS_AND_DIGITAL_SUBSTRATES'));

requireFirst('--require-first-digital-circuit',()=>assert.equal(firstDigitalCircuit.truth,'BOUNDED_NATIVE_FINISHED_DIGITAL_CIRCUIT'));

requireFirst('--require-first-end-materials',()=>assert.equal(firstEndMaterials.truth,'BOUNDED_NATIVE_DUNGEON_TO_ENDER_EYE'));

requireFirst('--require-first-end-certus',()=>assert.equal(firstEndCertus.truth,'BOUNDED_NATIVE_END_RETURN_SUPPLIERS_AND_CERTUS'));

requireFirst('--require-first-ae2-processors',()=>assert.equal(firstAe2Processors.truth,'BOUNDED_NATIVE_MI_FIRST_AE2_PROCESSORS'));

requireFirst('--require-first-mechanical-crafter',()=>assert.equal(firstMechanicalCrafter.truth,'BOUNDED_TFC_WORKBENCH_TO_MECHANICAL_CRAFTER'));

requireFirst('--require-first-crushing-hardware',()=>assert.equal(firstCrushingHardware.truth,'BOUNDED_NATIVE_FIRST_CRUSHING_HARDWARE'));

requireFirst('--require-first-crushing-service',()=>assert.equal(firstCrushingService.truth,'BOUNDED_NATIVE_FIRST_COKE_CRUSHING_SERVICE'));

requireFirst('--require-first-native-silicon',()=>assert.equal(firstNativeSilicon.truth,'BOUNDED_NATIVE_EARTH_QUARTZ_TO_SILICON'));

requireFirst('--require-first-heated-magnetic-alloy',()=>assert.equal(firstHeatedMagneticAlloy.truth,'BOUNDED_NATIVE_BENEATH_BLAZE_TO_MAGNETIC_ALLOY'));

requireFirst('--require-first-advanced-motion',()=>assert.equal(firstAdvancedMotion.truth,'BOUNDED_NATIVE_FIRST_ADVANCED_MOTOR_AND_PUMP'));

requireFirst('--require-first-inscriber',()=>assert.equal(firstInscriber.truth,'BOUNDED_NATIVE_PHYSICAL_INSCRIBER_AND_FE_SERVICE'));

requireFirst('--require-first-controller',()=>assert.equal(firstController.truth,'BOUNDED_NATIVE_FIRST_STAINLESS_PRESS_AND_CONTROLLER'));

requireFirst('--require-first-geological-blue-dye',()=>assert.equal(firstGeologicalBlueDye.truth,'BOUNDED_TFC_GRAPHITE_TO_SYNAXIS_DIAGRAM'));
requireFirst('--require-first-copper-hammer',()=>assert.equal(firstCopperHammer.truth,'BOUNDED_NATIVE_CAST_COPPER_HAMMER_AND_QUEST_ORDER'));
requireFirst('--require-first-witch-herbs',()=>assert.equal(firstWitchHerbs.truth,'BOUNDED_NATIVE_TFC_GRASSES_TO_WITCH_HERBS_AND_ESOTERIC_RECORDS'));

requireFirst('--require-first-tfc-startup-hardware',()=>assert.equal(firstTfcStartupHardware.truth,'BOUNDED_TFC_FIRST_TFMG_INTAKE_AND_STOVE_HARDWARE',JSON.stringify(firstTfcStartupHardware.missingDetails)));
requireFirst('--require-first-air',()=>assert.equal(firstAir.truth,'BOUNDED_NATIVE_FIRST_TFMG_AIR',JSON.stringify(firstAir.missingDetails)));
requireFirst('--require-first-hot-air',()=>assert.equal(firstHotAir.truth,'BOUNDED_NATIVE_FINITE_HOT_AIR_PRECHARGE',JSON.stringify(firstHotAir.missingDetails)));

requireFirst('--require-first-geological-coke',()=>assert.equal(firstGeologicalCoke.truth,'BOUNDED_NATIVE_GEOLOGICAL_COKE_DUST',JSON.stringify(firstGeologicalCoke.missingDetails)));

requireFirst('--require-first-steel',()=>assert.equal(firstSteel.truth,'BOUNDED_NATIVE_GEOLOGY_TO_FIRST_TFMG_STEEL',JSON.stringify(firstSteel.missingDetails)));

requireFirst('--require-first-steel-shafts',()=>assert.equal(firstSteelShaft.truth,'BOUNDED_NATIVE_FIRST_STEEL_PLATE_AND_SHAFTS',JSON.stringify(firstSteelShaft.missingDetails)));

requireFirst('--require-first-ignition',()=>assert.equal(firstIgnition.truth,'BOUNDED_NATIVE_TWO_STEEL_BATCHES_TO_IGNITION_AND_SHAFTS',JSON.stringify(firstIgnition.missingDetails)));
requireFirst('--require-first-geological-natural-rubber',()=>assert.equal(firstGeologicalNaturalRubber.truth,'BOUNDED_NATIVE_GEOLOGICAL_FIRST_NATURAL_RUBBER_SHEET',JSON.stringify(firstGeologicalNaturalRubber.missingDetails)));

requireFirst('--require-first-steel-steam-buckets',()=>assert.equal(firstSteelSteamBucket.truth,'BOUNDED_NATIVE_GEOLOGICAL_STEEL_STEAM_BUCKETS',JSON.stringify(firstSteelSteamBucket.missingDetails)));
requireFirst('--require-first-geological-lubrication-buckets',()=>assert.equal(firstGeologicalLubricationBucket.truth,'BOUNDED_NATIVE_GEOLOGICAL_LUBRICATION_BUCKETS',JSON.stringify(firstGeologicalLubricationBucket.missingDetails)));
requireFirst('--require-first-manual-rolling',()=>assert.equal(firstManualRolling.truth,'BOUNDED_NATIVE_BRONZE_REBAR_AND_MANUAL_ROLLING',JSON.stringify(firstManualRolling.missingDetails)));
requireFirst('--require-first-rail-grade-steel',()=>assert.equal(firstRailGradeSteel.truth,'BOUNDED_NATIVE_GEOLOGICAL_RAIL_GRADE_STEEL',JSON.stringify(firstRailGradeSteel.missingDetails)));
requireFirst('--require-first-rail-stock',()=>assert.equal(firstRailStock.truth,'BOUNDED_NATIVE_GEOLOGICAL_RAIL_STOCK_PACKET',JSON.stringify(firstRailStock.missingDetails)));
requireFirst('--require-first-rail-feedstocks',()=>assert.equal(firstRailFeedstocks.truth,'BOUNDED_NATIVE_GEOLOGICAL_RAIL_CONTROLLER_FEEDSTOCKS',JSON.stringify(firstRailFeedstocks.missingDetails)));

requireFirst('--require-first-rail-gold',()=>assert.equal(firstRailGold.truth,'BOUNDED_NATIVE_GEOLOGICAL_FOUR_RAIL_GOLD',JSON.stringify(firstRailGold.missingDetails)));

requireFirst('--require-first-rail-detectors',()=>assert.equal(firstRailDetectors.truth,'BOUNDED_NATIVE_TWO_RAIL_DETECTORS',JSON.stringify(firstRailDetectors.missingDetails)));

requireFirst('--require-first-rail-circuits',()=>assert.equal(firstRailCircuits.truth,'BOUNDED_NATIVE_FOUR_RAIL_CONTROLLER_CIRCUITS',JSON.stringify(firstRailCircuits.missingDetails)));

requireFirst('--require-first-rail-terminals',()=>assert.equal(firstRailTerminals.truth,'BOUNDED_NATIVE_SELECTED_RAIL_TERMINALS',JSON.stringify(firstRailTerminals.missingDetails)));

requireFirst('--require-first-mechanism-steel-stock',()=>assert.equal(firstMechanismSteelStock.truth,'BOUNDED_NATIVE_FIFTY_THREE_ADDITIONAL_STEEL_RESERVE',JSON.stringify(firstMechanismSteelStock.missingDetails)));

requireFirst('--require-first-canonical-lead-stock',()=>assert.equal(firstLeadStock.truth,'BOUNDED_NATIVE_TWENTY_FOUR_CANONICAL_LEAD_PLATES',JSON.stringify(firstLeadStock.missingDetails)));

requireFirst('--require-first-garnierite-nickel-stock',()=>assert.equal(firstNickelStock.truth,'BOUNDED_NATIVE_TWENTY_FOUR_GARNIERITE_NICKEL_PLATES',JSON.stringify(firstNickelStock.missingDetails)));

requireFirst('--require-first-mechanism-oil-stock',()=>assert.equal(firstMechanismOilStock.truth,'BOUNDED_NATIVE_SIX_LITRE_ADDITIONAL_MECHANISM_OIL',JSON.stringify(firstMechanismOilStock.missingDetails)));

requireFirst('--require-first-precision-attempt-inputs',()=>assert.equal(firstPrecisionAttempt.truth,'BOUNDED_NATIVE_FIRST_PRECISION_ATTEMPT_INPUTS',JSON.stringify(firstPrecisionAttempt.missingDetails)));

requireFirst('--require-first-mechanical-iron-entry',()=>assert.equal(firstMechanicalIron.truth,'BOUNDED_MECHANICAL_IRON_ENTRY_WITHOUT_PRECISION',JSON.stringify(firstMechanicalIron.missingDetails)));

requireFirst('--require-first-primitive-gold-entry',()=>assert.equal(firstPrimitiveGold.truth,'BOUNDED_NATIVE_PRIMITIVE_FOUR_COLD_GOLD',JSON.stringify(firstPrimitiveGold.missingDetails)));

requireFirst('--require-first-forming-setup',()=>assert.equal(firstFormingSetup.truth,'BOUNDED_OWNED_WRENCH_AND_NATIVE_EARLY_FORMING_SETUP',JSON.stringify(firstFormingSetup.missing)));

requireFirst('--require-first-steel-press-stock',()=>assert.equal(firstSteelPressStock.truth,'BOUNDED_CONDITIONAL_NATIVE_STEEL_PRESS_AND_EIGHT_HEAVY_PLATES'));

requireFirst('--require-first-precision-batch-stock',()=>assert.equal(firstPrecisionBatchStock.truth,'BOUNDED_CONDITIONAL_EIGHT_PRECISION_BEFORE_STEEL_PRESS'));

requireFirst('--require-first-steel-mechanism-stock',()=>assert.equal(firstSteelMechanismStock.truth,'BOUNDED_CONDITIONAL_EIGHT_STEEL_MECHANISMS'));

requireFirst('--require-first-bulk-wrought-conservation',()=>assert.equal(bulkWroughtLedger.truth,'STATIC_NATIVE_BULK_WROUGHT_METAL_CONSERVATION'));
requireFirst('--require-first-additional-mi-casing-stock',()=>assert.equal(additionalMiCasingStock.truth,'BOUNDED_CONDITIONAL_ADDITIONAL_MI_STEEL_CASING'));
requireFirst('--require-first-locomotive-pump-stock',()=>assert.equal(firstLocomotivePumpStock.truth,'BOUNDED_CONDITIONAL_LOCOMOTIVE_PUMP_STOCK'));
requireFirst('--require-first-lava-rig-recovery',()=>assert.equal(firstLavaRigRecovery.truth,'STATIC_NATIVE_LAVA_RIG_BLOCK_SELF_DROP_PATHS'));

requireFirst('--require-first-powered-lava-capture',()=>assert.equal(firstPoweredLavaCapture.truth,'BOUNDED_CONDITIONAL_TWO_SITE_POWERED_LAVA_CAPTURE'));

requireFirst('--require-first-heated-obsidian-stock',()=>assert.equal(firstHeatedObsidianStock.truth,'BOUNDED_CONDITIONAL_HEATED_OBSIDIAN_AND_POWDER'));

requireFirst('--require-first-sturdy-sheet-stock',()=>assert.equal(firstSturdySheetStock.truth,'BOUNDED_CONDITIONAL_ONE_LOOP_STURDY_SHEET_AND_RECOVERED_TANK'));

requireFirst('--require-first-tfc-lever-stock',()=>assert.equal(firstTfcLeverStock.truth,'BOUNDED_CONDITIONAL_TFC_LEVER_WITH_NATIVE_ID_REPAIR'));

requireFirst('--require-first-greate-research-aliases',()=>assert.equal(nativeResearchRuntimeAliases.truth,'STATIC_EXACT_GREATE_RESEARCH_ALIAS_GATES'));

requireFirst('--require-first-manual-application-research',()=>assert.equal(nativeManualApplicationResearch.truth,'STATIC_DEPLOYED_MANUAL_APPLICATION_PLAYER_RESEARCH_SCOPE'));

requireFirst('--require-first-controls-stock',()=>assert.equal(firstControlsStock.truth,'BOUNDED_CONDITIONAL_LOCOMOTIVE_CONTROLS_STOCK'));

requireFirst('--require-first-firebox-stock',()=>assert.equal(firstFireboxStock.truth,'BOUNDED_CONDITIONAL_LOCOMOTIVE_FIREBOX_STOCK'));

requireFirst('--require-first-copper-ring-stock',()=>assert.equal(firstCopperRingStock.truth,'BOUNDED_CONDITIONAL_FOUR_COPPER_RINGS_WITH_PRESS_REPAIR'));
requireFirst('--require-first-native-clear-glass',()=>assert.equal(firstPlainGlass.truth,'BOUNDED_NATIVE_TFC_CLEAR_GLASS_AND_PANE'));
requireFirst('--require-first-brass-sheet-stock',()=>assert.equal(firstBrassSheetStock.truth,'BOUNDED_CONDITIONAL_FOUR_TFC_BRASS_SHEETS'));
requireFirst('--require-first-saw-recipe-cycle',()=>assert.equal(nativeSawRecipeCycle.truth,'STATIC_DEPLOYED_GREATE_SAW_RECIPE_CYCLE'));
requireFirst('--require-first-glass-stock',()=>assert.equal(firstGlassStock.truth,'BOUNDED_CONDITIONAL_GLASS_BLOCK_AND_PANE_STOCK'));
requireFirst('--require-first-locomotive-boiler-stock',()=>assert.equal(firstLocomotiveBoilerStock.truth,'BOUNDED_CONDITIONAL_ADDITIONAL_LOCOMOTIVE_BRONZE_BOILER'));
requireFirst('--require-first-locomotive-cast-iron-pipe-stock',()=>assert.equal(firstLocomotiveCastIronPipeStock.truth,'BOUNDED_CONDITIONAL_LOCOMOTIVE_CAST_IRON_PIPE_STOCK'));
requireFirst('--require-first-locomotive-oil-handoff',()=>assert.equal(firstLocomotiveOilHandoff.truth,'BOUNDED_CONDITIONAL_REUSED_BUCKET_LOCOMOTIVE_OIL_HANDOFF'));
requireFirst('--require-first-locomotive-assembly-stock',()=>assert.equal(firstLocomotiveAssemblyStock.truth,'BOUNDED_CONDITIONAL_COMPLETE_LOCOMOTIVE_ASSEMBLY'));
requireFirst('--require-canonical-steel-provider',()=>assert.equal(canonicalSteelProvider.truth,'STATIC_CANONICAL_STEEL_PROVIDER_AND_TASK_REPAIR'));
requireFirst('--require-first-bucket-nickel',()=>assert.equal(firstBucketNickel.truth,'BOUNDED_CONDITIONAL_PRE_BUCKET_NICKEL_WITH_REUSED_FORGE'));
requireFirst('--require-first-bucket-precision',()=>assert.equal(firstBucketPrecision.truth,'BOUNDED_CONDITIONAL_TWO_EARLY_PRECISION_FOR_FIRST_BUCKET'));
requireFirst('--require-first-freight-objective',()=>assert.equal(firstFreightObjective.truth,'BOUNDED_CONDITIONAL_NONCONSUMING_COMBINED_FREIGHT_OBJECTIVE'));

if(process.argv.includes('--collect-first-results')){
 assert(collectedFirstRequirements.length>0,'Request at least one explicit first-supplier flag');
 const failed=collectedFirstRequirements.filter(r=>!r.passed),results={truth:failed.length?'FIRST_SUPPLIER_REQUIREMENTS_INCOMPLETE':'FIRST_SUPPLIER_REQUIREMENTS_PASS',requested:collectedFirstRequirements.length,passed:collectedFirstRequirements.length-failed.length,failed:failed.length,results:collectedFirstRequirements,researchReportSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(state,'research-acquisition-validation.json'))).digest('hex'),scope:'Fresh native/model run with each requested original assertion executed. An incomplete result never qualifies the whole campaign or the failed suppliers.'};
 fs.writeFileSync(path.join(state,'first-supplier-requirements.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({truth:results.truth,requested:results.requested,passed:results.passed,failed:failed.map(r=>r.flag)}));if(failed.length)process.exitCode=1;
}
