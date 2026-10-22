// Close the upper mechanical handoffs through existing industry.
// The Greate hierarchy itself keeps its native material, voltage and predecessor.
import {staticRecipeWriter} from '../../lib/static_recipe_writer.mjs';
import culturePolicy from '../biology_cultures.json' with {type:'json'};
import boardPolicy from '../wetware_boards.json' with {type:'json'};
import neuroPolicy from '../neuro_processing.json' with {type:'json'};
import wetwarePolicy from '../wetware_circuits.json' with {type:'json'};
import computationPolicy from '../research_computation.json' with {type:'json'};
import componentRecoveryPolicy from '../component_recycling.json' with {type:'json'};
import materialPolicy from '../material_authority.json' with {type:'json'};
import assemblyGlass from '../mission02_assembly_glass.json' with {type:'json'};
import {primaryGreateMetalRecovery} from '../../lib/greate_recovery_units.mjs';
export function greateSuppliers() {
  const w=staticRecipeWriter(), e=w.event;
  const id=name=>'createch2:greate/suppliers/'+name;
  // Preserve the native glass/PVB bills through retained pack processors.
  // Arc glass includes the native on-save oxygen charge; no dry-furnace shortcut.
  for (const [name,data] of Object.entries(assemblyGlass.recipes))
    e.custom(data).id('createch2:greg_gateway/assembly_line/'+name);
  e.custom(materialPolicy.constitution.zinc.acquisition.ownedPlate.data).id(materialPolicy.constitution.zinc.acquisition.ownedPlate.recipe);
  // Preserve native CBC melting budget through the owned TFMG steel economy.
  e.custom(materialPolicy.constitution.steel.acquisition.ownedFoundryMelting.data).id(materialPolicy.constitution.steel.acquisition.ownedFoundryMelting.recipe);
  // Native Alchemistry IDs are intentionally denied pack-wide. Restore only
  // the four operations needed by this earned rhodium cell, under exact owners.
  for (const element of ['copper','sulfur']) e.custom({type:'alchemistry:dissolver',
    group:'alchemistry:dissolver',input:{count:1,ingredient:{tag:element==='copper'?'c:ingots/copper':'c:dusts/sulfur'}},
    output:{groups:[{probability:100,results:[{count:16,item:'chemlib:'+element}]}],rolls:1,weighted:false}
  }).id(id(element+'_element_feed'));
  e.custom({type:'alchemistry:fusion',group:'fusion',
    input1:{item:'chemlib:sulfur'},input2:{item:'chemlib:copper'},output:{item:'chemlib:rhodium'}
  }).id(id('rhodium_fusion'));
  e.custom({type:'alchemistry:compactor',group:'alchemistry:compactor',
    input:{count:16,ingredient:{item:'chemlib:rhodium'}},result:{item:'chemlib:rhodium_dust'}
  }).id(id('rhodium_compaction'));
  // Installed GT MixerRecipes: three palladium + one rhodium -> four RPP.
  // Rhodium comes from the owned fusion cell above, not the denied native library.
  e.custom({type:'greate:mixing',recipe_tier:5,processing_time:400,
    ingredients:[{item:'chemlib:palladium_dust'},{item:'chemlib:palladium_dust'},
      {item:'chemlib:palladium_dust'},{item:'chemlib:rhodium_dust'}],
    results:[{id:'gtceu:rhodium_plated_palladium_dust',count:4}]
  }).id(id('rpp_blend'));
  // MI remains the pack's hot-process authority. This is an authored thermal
  // handoff, not a claim that its furnace has GT's temperature or overclock model.
  e.custom({type:'modern_industrialization:blast_furnace',eu:128,duration:6400,
    item_inputs:[{item:'gtceu:rhodium_plated_palladium_dust',amount:4}],
    fluid_inputs:[{fluid:'modern_industrialization:nitrogen',amount:1000}],
    item_outputs:[{item:'gtceu:rhodium_plated_palladium_ingot',amount:4}]
  }).id(id('rpp_reduction'));
  e.custom({type:'greate:pressing',recipe_tier:5,
    ingredients:[{item:'gtceu:rhodium_plated_palladium_ingot'}],
    results:[{id:'gtceu:rhodium_plated_palladium_plate'}]
  }).id(id('rpp_plate'));
  // Nine alloy plates retain the native casing-plus-hull metal budget. The
  // established quantum chassis, superconductor service and chemical insulation
  // replace an otherwise disconnected GT cable/polymer bootstrap. No polymer
  // material units are created by this enclosure recipe.
  e.custom({type:'modern_industrialization:assembler',eu:512,duration:600,
    item_inputs:[{item:'modern_industrialization:quantum_machine_hull',amount:1},
      {item:'gtceu:rhodium_plated_palladium_plate',amount:9},
      {item:'chemica:polytetrafluoroethylene_sheet',amount:2},
      {item:'modern_industrialization:superconductor_cable',amount:2}],
    item_outputs:[{item:'gtceu:luv_machine_hull',amount:1}]
  }).id(id('luv_hull'));
  // Native GT wireFine is 453,600 material units: eight per 3,628,800-unit ingot.
  e.custom({type:'modern_industrialization:wiremill',eu:128,duration:400,
    item_inputs:[{item:'modern_industrialization:platinum_ingot',amount:1}],
    item_outputs:[{item:'gtceu:fine_platinum_wire',amount:8}]
  }).id(id('platinum_fine_wire'));
  // Native GT composition, expanded through osmiridium's own 1 Os : 3 Ir
  // definition: four batches need 8 Naquadah + 4 Trinium + 1 Os + 3 Ir.
  // SGJourney declares these ingots in the matching common material tags.
  // Co-smelting the existing stock avoids introducing another alloy family.
  // MI remains the authored thermal authority, not GT temperature equivalence.
  for(const metal of ['naquadah','trinium']) e.custom({
    type:'modern_industrialization:blast_furnace',eu:64,duration:800,
    item_inputs:[{item:'sgjourney:raw_'+metal,amount:1}],
    item_outputs:[{item:'sgjourney:'+metal+'_ingot',amount:1}]
  }).id(id(metal+'_billet'));
  e.custom({type:'modern_industrialization:blast_furnace',eu:128,duration:25600,
    item_inputs:[{item:'sgjourney:naquadah_ingot',amount:8},
      {item:'sgjourney:trinium_ingot',amount:4},
      {item:'chemlib:osmium_dust',amount:1},
      {item:'modern_industrialization:iridium_dust',amount:3}],
    fluid_inputs:[{fluid:'modern_industrialization:nitrogen',amount:4000}],
    item_outputs:[{item:'gtceu:naquadah_alloy_ingot',amount:16}]
  }).id(id('naquadah_alloy'));
  // Recycled, already-alloyed stock uses the same per-ingot thermal budget
  // and nitrogen rate as the established 16-ingot co-smelting batch.
  e.custom({type:'modern_industrialization:blast_furnace',eu:128,duration:6400,
    item_inputs:[{item:'gtceu:naquadah_alloy_dust',amount:4}],
    fluid_inputs:[{fluid:'modern_industrialization:nitrogen',amount:1000}],
    item_outputs:[{item:'gtceu:naquadah_alloy_ingot',amount:4}]
  }).id(id('naquadah_alloy_reprocessing'));
  e.custom({type:'greate:pressing',recipe_tier:6,
    ingredients:[{item:'gtceu:naquadah_alloy_ingot'}],
    results:[{id:'gtceu:naquadah_alloy_plate'}]
  }).id(id('naquadah_alloy_plate'));
  e.custom({type:'modern_industrialization:assembler',eu:1024,duration:900,
    item_inputs:[{item:'modern_industrialization:quantum_machine_hull',amount:1},
      {item:'gtceu:naquadah_alloy_plate',amount:9},
      {item:'chemica:polytetrafluoroethylene_sheet',amount:2},
      {item:'modern_industrialization:superconductor_cable',amount:2}],
    item_outputs:[{item:'gtceu:zpm_machine_hull',amount:1}]
  }).id(id('zpm_hull'));
  // Native tin (50) + neodymium (60) fusion supplies element 110. The Moon's
  // existing monazite -> MI neodymium centrifuge line supplies the rare earth;
  // this does not depend on a new Gadolinium/Ruthenium material family.
  for (const element of ['tin','neodymium']) e.custom({type:'alchemistry:dissolver',
    group:'alchemistry:dissolver',input:{count:1,ingredient:{tag:'c:dusts/'+element}},
    output:{groups:[{probability:100,results:[{count:16,item:'chemlib:'+element}]}],rolls:1,weighted:false}
  }).id(id(element+'_element_feed'));
  e.custom({type:'alchemistry:fusion',group:'fusion',
    input1:{item:'chemlib:tin'},input2:{item:'chemlib:neodymium'},output:{item:'chemlib:darmstadtium'}
  }).id(id('darmstadtium_fusion'));
  // Chemlib registers the element but no Darmstadtium dust. Preserve the
  // native sixteen-element dust unit at this explicit GT material handoff.
  e.custom({type:'alchemistry:compactor',group:'alchemistry:compactor',
    input:{count:16,ingredient:{item:'chemlib:darmstadtium'}},result:{item:'gtceu:darmstadtium_dust'}
  }).id(id('darmstadtium_compaction'));
  // Authored MI thermal integration, not a reproduction of GT plasma cooling.
  e.custom({type:'modern_industrialization:blast_furnace',eu:128,duration:102400,
    item_inputs:[{item:'gtceu:darmstadtium_dust',amount:4}],
    fluid_inputs:[{fluid:'modern_industrialization:nitrogen',amount:4000}],
    item_outputs:[{item:'gtceu:darmstadtium_ingot',amount:4}]
  }).id(id('darmstadtium_reduction'));
  e.custom({type:'greate:pressing',recipe_tier:7,
    ingredients:[{item:'gtceu:darmstadtium_ingot'}],results:[{id:'gtceu:darmstadtium_plate'}]
  }).id(id('darmstadtium_plate'));
  e.custom({type:'modern_industrialization:assembler',eu:2048,duration:1200,
    item_inputs:[{item:'modern_industrialization:quantum_machine_hull',amount:1},
      {item:'gtceu:darmstadtium_plate',amount:9},
      {item:'chemica:polytetrafluoroethylene_sheet',amount:2},
      {item:'modern_industrialization:superconductor_cable',amount:2}],
    item_outputs:[{item:'gtceu:uv_machine_hull',amount:1}]
  }).id(id('uv_hull'));
  // The existing UV component line consumes a real filled bucket. Give its
  // fluid-to-container handoff an explicit automated owner and full 1 B debit.
  e.custom({type:'create:filling',ingredients:[{item:'minecraft:bucket'},
    {type:'neoforge:single',fluid:'modern_industrialization:uu_matter',amount:1000}],
    results:[{id:'modern_industrialization:uu_matter_bucket'}]
  }).id(id('uv_uu_matter_bucket'));
  // Explicit mechanical-stock handoff from the existing neutron collectors.
  // One full Avaritia ingot (81 piles) becomes one GT ingot. Native common
  // ingot/nugget tags already overlap, so contain alternate output recipes;
  // do not mistake tag membership for this conditioning operation. Cryofluid
  // returns its native 70:30 argon/helium charge for powered recooling.
  // These conditioning parameters are authored, not native GT fusion parity.
  w.removeOutputRecipes(['gtceu:neutronium_ingot','gtceu:neutronium_plate']);
  e.custom({type:'modern_industrialization:vacuum_freezer',eu:8192,duration:1200,
    item_inputs:[{item:'avaritia:neutron_ingot',amount:1}],
    fluid_inputs:[{fluid:'modern_industrialization:cryofluid',amount:1000}],
    item_outputs:[{item:'gtceu:neutronium_ingot',amount:1}],
    fluid_outputs:[{fluid:'modern_industrialization:argon',amount:700},
      {fluid:'modern_industrialization:helium',amount:300}]
  }).id(id('neutronium_conditioning'));
  e.custom({type:'greate:pressing',recipe_tier:8,
    ingredients:[{item:'gtceu:neutronium_ingot'}],results:[{id:'gtceu:neutronium_plate'}]
  }).id(id('neutronium_plate'));
  e.custom({type:'modern_industrialization:assembler',eu:8192,duration:1800,
    item_inputs:[{item:'modern_industrialization:quantum_machine_hull',amount:1},
      {item:'gtceu:neutronium_plate',amount:9},
      {item:'modern_industrialization:superconductor_cable',amount:2}],
    fluid_inputs:[{fluid:'gtceu:polybenzimidazole',amount:288}],
    item_outputs:[{item:'gtceu:uhv_machine_hull',amount:1}]
  }).id(id('uhv_hull'));
  // The wetware campus upgrades established equipment before making its first
  // UHV circuit. These are shared-industry bills, not native GT recipe ports.
  // Keep ZPM single-block power separate from UV multiblock service.
  const wetwareFacilities = [
    ['zpm_circuit_assembler', [
      ['gtceu:luv_circuit_assembler',1], ['gtceu:zpm_machine_hull',1],
      ['gtceu:zpm_robot_arm',2], ['gtceu:crystal_processor_mainframe',2],
      ['modern_industrialization:superconductor_cable',2]]],
    ['zpm_1a_energy_converter', [
      ['gtceu:luv_1a_energy_converter',1], ['gtceu:zpm_machine_hull',1],
      ['gtceu:zpm_field_generator',1], ['modern_industrialization:quantum_circuit',2],
      ['modern_industrialization:superconductor_cable',4],
      ['electroenergetics:sulfur_hexafluoride_breaker',2]]],
    ['uv_1a_energy_converter', [
      ['gtceu:zpm_1a_energy_converter',1], ['gtceu:uv_machine_hull',1],
      ['gtceu:uv_field_generator',1], ['gtceu:crystal_processor_mainframe',2],
      ['modern_industrialization:superconductor_cable',4],
      ['electroenergetics:sulfur_hexafluoride_breaker',2]]],
    ['uv_energy_input_hatch', [
      ['gtceu:luv_energy_input_hatch',1], ['gtceu:uv_machine_hull',1],
      ['gtceu:uv_field_generator',1], ['gtceu:crystal_processor_mainframe',2],
      ['modern_industrialization:superconductor_cable',2]]],
    ['luv_mixer', [
      ['modern_industrialization:electric_mixer',1], ['gtceu:luv_machine_hull',1],
      ['gtceu:luv_electric_motor',2], ['gtceu:crystal_processor_mainframe',1],
      ['modern_industrialization:superconductor_cable',2]]],
    ['luv_centrifuge', [
      ['modern_industrialization:centrifuge',1], ['gtceu:luv_machine_hull',1],
      ['gtceu:luv_electric_motor',2], ['gtceu:crystal_processor_mainframe',1],
      ['modern_industrialization:superconductor_cable',2]]],
    ['luv_autoclave', [
      ['modern_industrialization:pressurizer',1], ['gtceu:luv_machine_hull',1],
      ['gtceu:luv_electric_pump',2], ['gtceu:crystal_processor_mainframe',1],
      ['modern_industrialization:superconductor_cable',2]]],
    ['luv_brewery', [
      ['modern_industrialization:electric_mixer',1], ['gtceu:luv_machine_hull',1],
      ['gtceu:luv_electric_pump',2], ['gtceu:crystal_processor_mainframe',1],
      ['modern_industrialization:superconductor_cable',2]]],
    ['luv_distillery', [
      ['modern_industrialization:distillation_tower',1], ['gtceu:luv_machine_hull',1],
      ['gtceu:luv_electric_pump',2], ['gtceu:crystal_processor_mainframe',1],
      ['modern_industrialization:superconductor_cable',2]]],
    ['luv_fluid_heater', [
      ['modern_industrialization:heat_exchanger',1], ['gtceu:luv_machine_hull',1],
      ['gtceu:luv_electric_pump',2], ['gtceu:crystal_processor_mainframe',1],
      ['modern_industrialization:superconductor_cable',2]]],
    ['sterilizing_filter_casing', [
      ['gtceu:filter_casing',1], ['gtceu:darmstadtium_plate',2],
      ['gtceu:zpm_electric_pump',1]]]
  ];
  w.removeOutputRecipes(wetwareFacilities.map(([name])=>'gtceu:'+name));
  for(const [name,inputs] of wetwareFacilities) e.custom({
    type:'modern_industrialization:assembler',eu:8192,duration:1200,
    item_inputs:inputs.map(([item,amount])=>({item,amount})),
    fluid_inputs:[{fluid:'gtceu:polybenzimidazole',amount:288}],
    item_outputs:[{item:'gtceu:'+name,amount:1}]
  }).id(id('wetware_'+name));
  // Native biology preparation uses shared industry and real TFC roots.
  e.custom({type:'modern_industrialization:compressor',eu:2,duration:300,
    item_inputs:[{tag:'minecraft:saplings',amount:1}],
    item_outputs:[{item:'gtceu:plant_ball',amount:1}]
  }).id(id('biology_plant_ball'));
  e.custom({type:'modern_industrialization:mixer',eu:3,duration:800,
    item_inputs:[{tag:'minecraft:saplings',amount:1}],
    fluid_inputs:[{fluid:'minecraft:water',amount:100}],
    fluid_outputs:[{fluid:'gtceu:biomass',amount:100}]
  }).id(id('biology_biomass'));
  e.custom({type:'modern_industrialization:distillation_tower',eu:120,duration:160,
    fluid_inputs:[{fluid:'minecraft:water',amount:576}],
    fluid_outputs:[{fluid:'gtceu:distilled_water',amount:520}]
  }).id(id('biology_distilled_water'));
  e.custom({type:'modern_industrialization:macerator',eu:2,duration:102,
    item_inputs:[{item:'tfc:food/beef',amount:1}],
    item_outputs:[{item:'gtceu:meat_dust',amount:1},
      {item:'gtceu:meat_dust',amount:1,probability:0.5},
      {item:'gtceu:tiny_bone_dust',amount:1}]
  }).id(id('biology_meat'));
  e.custom({type:'modern_industrialization:macerator',eu:2,duration:150,
    item_inputs:[{item:'tfc:rock/raw/chalk',amount:1}],
    item_outputs:[{item:'gtceu:calcite_dust',amount:1},
      {item:'gtceu:stone_dust',amount:1,probability:0.0025}]
  }).id(id('biology_calcite'));
  e.custom({type:'modern_industrialization:macerator',eu:4,duration:200,
    item_inputs:[{item:'gtceu:plant_ball',amount:2}],
    item_outputs:[{item:'gtceu:bio_chaff',amount:2},
      {item:'gtceu:bio_chaff',amount:1,probability:0.5},
      {item:'gtceu:bio_chaff',amount:1,probability:0.25}]
  }).id(id('biology_bio_chaff'));
  // Native CaCO3 decomposition: five constituent units, no mineral/pure-metal
  // alias. Existing canonical calcium/carbon/oxygen species receive the yield.
  e.custom({type:'modern_industrialization:electrolyzer',eu:60,duration:100,
    item_inputs:[{item:'gtceu:calcite_dust',amount:5}],
    item_outputs:[{item:'chemlib:calcium_dust',amount:1},
      {item:'modern_industrialization:carbon_dust',amount:1}],
    fluid_outputs:[{fluid:'modern_industrialization:oxygen',amount:3000}]
  }).id(id('biology_calcium'));
  // Native blank mould contains four steel plates. Shared machining forms the
  // cylinder directly; this is a capital tool, retained during polymer casting.
  e.custom({type:'modern_industrialization:assembler',eu:512,duration:400,
    item_inputs:[{tag:'c:plates/steel',amount:4}],
    item_outputs:[{item:'gtceu:cylinder_casting_mold',amount:1}]
  }).id(id('wetware_cylinder_mold'));
  e.custom({type:'modern_industrialization:assembler',eu:480,duration:40,
    item_inputs:[{item:'gtceu:cylinder_casting_mold',amount:1,probability:0}],
    fluid_inputs:[{fluid:'gtceu:polybenzimidazole',amount:18}],
    item_outputs:[{item:'gtceu:petri_dish',amount:2}]
  }).id(id('wetware_petri_dish'));
  const castingMolds={pipe_small:'gtceu:small_pipe_casting_mold',plate:'gtceu:plate_casting_mold'};
  for(const shape of Object.keys(castingMolds))e.custom({type:'modern_industrialization:assembler',eu:512,duration:400,
    item_inputs:[{tag:'c:plates/steel',amount:4}],item_outputs:[{item:castingMolds[shape],amount:1}]
  }).id(id('neuro_'+shape+'_mold'));
  e.custom({type:'modern_industrialization:assembler',eu:480,duration:200,
    item_inputs:[{item:'gtceu:small_pipe_casting_mold',amount:1,probability:0}],
    fluid_inputs:[{fluid:'gtceu:polybenzimidazole',amount:144}],
    item_outputs:[{item:'gtceu:polybenzimidazole_small_fluid_pipe',amount:1}]
  }).id(id('neuro_pbi_pipe'));
  e.custom({type:'modern_industrialization:assembler',eu:480,duration:200,
    item_inputs:[{item:'gtceu:plate_casting_mold',amount:1,probability:0}],
    fluid_inputs:[{fluid:'gtceu:silicone_rubber',amount:144}],
    item_outputs:[{item:'gtceu:silicone_rubber_plate',amount:1}]
  }).id(id('neuro_silicone_plate'));
  e.custom({type:'greate:pressing',recipe_tier:5,
    ingredients:[{item:'gtceu:silicone_rubber_plate'}],results:[{id:'gtceu:silicone_rubber_foil',count:4}]
  }).id(id('neuro_silicone_foil'));
  e.custom({type:'greate:cutting',recipe_tier:5,processing_time:100,
    ingredients:[{tag:'c:plates/tungsten_steel'}],results:[{id:'gtceu:tungsten_steel_bolt',count:8}]
  }).id(id('neuro_tungsten_steel_bolt'));
  e.custom({type:'modern_industrialization:assembler',eu:480,duration:200,
    item_inputs:[{item:'gtceu:plate_casting_mold',amount:1,probability:0}],
    fluid_inputs:[{fluid:'gtceu:polybenzimidazole',amount:144}],
    item_outputs:[{item:'gtceu:polybenzimidazole_plate',amount:1}]
  }).id(id('wetware_pbi_plate'));
  e.custom({type:'greate:pressing',recipe_tier:8,
    ingredients:[{item:'gtceu:polybenzimidazole_plate'}],results:[{id:'gtceu:polybenzimidazole_foil',count:4}]
  }).id(id('wetware_pbi_foil'));
  // Native tiny pipe = 1/2 ingot; native industrial screw = 1/9 ingot.
  // The reusable mould retains the installed four-steel-plate capital bill.
  e.custom({type:'modern_industrialization:assembler',eu:512,duration:400,
    item_inputs:[{tag:'c:plates/steel',amount:4}],
    item_outputs:[{item:'gtceu:tiny_pipe_casting_mold',amount:1}]
  }).id(id('computation_tiny_pipe_mold'));
  e.custom({type:'modern_industrialization:assembler',eu:480,duration:200,
    item_inputs:[{item:'gtceu:tiny_pipe_casting_mold',amount:1,probability:0},{tag:'c:plates/stainless_steel',amount:3}],
    item_outputs:[{item:'gtceu:stainless_steel_tiny_fluid_pipe',amount:6}]
  }).id(id('computation_stainless_tiny_pipe'));
  e.custom({type:'greate:cutting',recipe_tier:8,processing_time:100,
    ingredients:[{tag:'c:plates/stainless_steel'}],results:[{id:'gtceu:stainless_steel_screw',count:9}]
  }).id(id('computation_stainless_screw'));
  for(const policy of [componentRecoveryPolicy.greateNeutronium,componentRecoveryPolicy.greateDarmstadtium,componentRecoveryPolicy.greateRpp,componentRecoveryPolicy.greateNaquadahAlloy,componentRecoveryPolicy.greateAluminum,componentRecoveryPolicy.greateTitanium,componentRecoveryPolicy.greateSteel,componentRecoveryPolicy.greateStainlessSteel,componentRecoveryPolicy.greateTungstenSteel])for(const [recipeId,recipe]of Object.entries(primaryGreateMetalRecovery(policy).recipes))e.custom(recipe).id(recipeId);
  e.custom(componentRecoveryPolicy.greateSteel.reprocessing.payload).id(componentRecoveryPolicy.greateSteel.reprocessing.recipe);
  for(const [recipeId,recipe]of Object.entries(componentRecoveryPolicy.greateTungstenSteel.supply.recipes))e.custom(recipe).id(recipeId);
  const mineral=materialPolicy.constitution.vanadium.acquisition.mineralConsolidation;
  e.shapeless(mineral.output,new Array(mineral.inputCount).fill(mineral.ingredient)).id(mineral.recipe);
  for(const [recipeId,recipe]of Object.entries(materialPolicy.constitution.uranium.acquisition.processingRecipes))e.custom(recipe).id(recipeId);
  const osmium=materialPolicy.constitution.osmium.acquisition.ordinaryStockProcessing;
  e.custom(osmium.recipeData).id(osmium.recipe);
  const lithium=materialPolicy.constitution.lithium.acquisition;
  e.custom(lithium.processingRecipe).id(lithium.firstProcessing);
  for(const recipe of materialPolicy.constitution.lithium.retiredPrimitiveRoutes)e.remove({id:recipe});
  return {...w,families:[{name:'Greate upper mechanical supplier handoffs',recipes:w.calls.length}]};
}

export const greateSupplierLocks = {
  ...Object.fromEntries(Object.keys(assemblyGlass.recipes).map(name=>[
    'createch2:greg_gateway/assembly_line/'+name,assemblyGlass.gate])),
  [materialPolicy.constitution.lithium.acquisition.firstProcessing]:materialPolicy.constitution.lithium.acquisition.gate,
  ...Object.fromEntries(Object.keys(materialPolicy.constitution.superconductor.acquisition.producerSnapshots).map(id=>[id,materialPolicy.constitution.superconductor.acquisition.gate])),
  ...Object.fromEntries(materialPolicy.constitution.platinum.acquisition.refineryChain.recipes.map(id=>[id,materialPolicy.constitution.platinum.acquisition.refineryChain.gate])),
  [materialPolicy.constitution.osmium.acquisition.ordinaryStockProcessing.recipe]:materialPolicy.constitution.osmium.acquisition.ordinaryStockProcessing.gate,
  ...Object.fromEntries(materialPolicy.constitution.uranium.acquisition.firstAcquisition.map(id=>[id,materialPolicy.constitution.uranium.acquisition.gate])),
  [materialPolicy.constitution.vanadium.acquisition.mineralConsolidation.recipe]:materialPolicy.constitution.vanadium.acquisition.gate,
  ...Object.fromEntries(Object.keys(componentRecoveryPolicy.greateTungstenSteel.supply.recipes).map(id=>[id,componentRecoveryPolicy.greateTungstenSteel.gate])),
  ...Object.fromEntries((componentRecoveryPolicy.machineryRecovery??[]).flatMap(p=>p.routes.filter(r=>r.gate).map(r=>[r.recovery,r.gate]))),
  ...Object.fromEntries((componentRecoveryPolicy.miMotionRecovery?.routes??[]).map(r=>[r.recovery,r.gate])),
  ...Object.fromEntries((componentRecoveryPolicy.miHullRecovery?.routes??[]).map(r=>[r.recovery,r.gate])),
  ...Object.fromEntries((componentRecoveryPolicy.miElectricMachineRecovery?.routes??[]).map(r=>[r.recovery,r.gate])),
  ...Object.fromEntries((componentRecoveryPolicy.miProcessRecovery?.routes??[]).map(r=>[r.recovery,r.gate])),
  ...Object.fromEntries((componentRecoveryPolicy.tfmgStockRecovery?.rows??[]).map(r=>[r.recovery,r.gate])),
  ...Object.fromEntries((componentRecoveryPolicy.tfmgElectricRecovery?.rows??[]).map(r=>[r.recovery,r.gate])),
  ...Object.fromEntries(Object.keys(componentRecoveryPolicy.tfmgElectricRecovery?.conversions??{}).map(id=>[id,componentRecoveryPolicy.tfmgElectricRecovery.conversionGate])),
  [materialPolicy.constitution.zinc.acquisition.ownedPlate.recipe]:materialPolicy.constitution.zinc.acquisition.ownedPlate.gate,
  [materialPolicy.constitution.steel.acquisition.ownedFoundryMelting.recipe]:materialPolicy.constitution.steel.acquisition.ownedFoundryMelting.gate,
  ...Object.fromEntries([componentRecoveryPolicy.greateNeutronium,componentRecoveryPolicy.greateDarmstadtium,componentRecoveryPolicy.greateRpp,componentRecoveryPolicy.greateNaquadahAlloy,componentRecoveryPolicy.greateAluminum,componentRecoveryPolicy.greateTitanium,componentRecoveryPolicy.greateSteel,componentRecoveryPolicy.greateStainlessSteel,componentRecoveryPolicy.greateTungstenSteel].flatMap(p=>p.routes.map(r=>[r.recovery,p.gate]))),
  'createch2:greate/suppliers/naquadah_alloy_reprocessing':'FRN-04E',
  [componentRecoveryPolicy.greateSteel.reprocessing.recipe]:componentRecoveryPolicy.greateSteel.gate,
  'dysoncubeproject:em_railejector_controller':'FRN-06',
  'dysoncubeproject:ray_receiver_controller':'FRN-06',
  ...Object.fromEntries(computationPolicy.routes.map(r=>['createch2:'+r.type+'/greate_computation/'+r.nativeName,computationPolicy.gate])),
  ...Object.fromEntries(['tiny_pipe_mold','stainless_tiny_pipe','stainless_screw'].map(n=>['createch2:greate/suppliers/computation_'+n,'FRN-06'])),
  'createch2:greg_gateway/research/computer_casing':'COM-06',
  'createch2:greg_gateway/research/computer_heat_vent':'COM-06',
  'createch2:circuit_assembler/greg_4096/research/optical_pipe_bootstrap':'COM-06',
  'createch2:research_station/greg_4096/research/gtceu/iv_conveyor_module':'COM-06',
  'createch2:research_station/greg_4096/research/gtceu/iv_robot_arm':'COM-06',
  'createch2:research_station/greg_4096/research/gtceu/iv_sensor':'COM-06',
  'createch2:research_station/greg_4096/research/gtceu/iv_emitter':'COM-06',
  'createch2:research_station/greg_4096/research/gtceu/iv_field_generator':'COM-06',
  'createch2:research_station/greg_4096/research/gtceu/quantum_processor':'COM-06',
  'createch2:research_station/greg_4096/research/gtceu/crystal_soc':'COM-06',
  'createch2:assembly_line/greg_4096/processors/crystal_soc':'COM-06',
  'createch2:assembly_line/greg_4096/processors/crystal_processor':'COM-06',
  'createch2:research_station/greg_4096/research/modern_industrialization/processing_unit':'COM-06',
  'createch2:research_station/greg_4096/research/modern_industrialization/quantum_circuit':'COM-06',
  'createch2:research_station/greg_4096/research/rocketnautics/rocket_thruster':'COM-06',
  'createch2:research_station/greg_4096/research/sgjourney/crystallizer':'COM-06',
  ...Object.fromEntries(wetwarePolicy.routes.map(r=>['createch2:'+r.type+'/greate_wetware_circuits/'+r.nativeName,wetwarePolicy.gate])),
  'createch2:greate/suppliers/wetware_pbi_plate':'FRN-06',
  'createch2:greate/suppliers/wetware_pbi_foil':'FRN-06',
  ...Object.fromEntries(neuroPolicy.routes.map(r=>['createch2:'+r.type+'/greate_neuro/'+r.nativeName,neuroPolicy.gate])),
  ...Object.fromEntries(['pipe_small_mold','plate_mold','pbi_pipe','silicone_plate','silicone_foil','tungsten_steel_bolt'].map(n=>['createch2:greate/suppliers/neuro_'+n,'FRN-06'])),
  ...Object.fromEntries(boardPolicy.routes.map(r=>['createch2:'+r.type+'/greate_wetware_boards/'+r.nativeName,boardPolicy.gate])),
  'createch2:greate/suppliers/wetware_cylinder_mold':'FRN-06',
  'createch2:greate/suppliers/wetware_petri_dish':'FRN-06',
  ...Object.fromEntries(culturePolicy.routes.map(route=>[
    'createch2:'+route.type+'/greate_biology/'+route.nativeName,culturePolicy.gate])),
  ...Object.fromEntries(['plant_ball','biomass','distilled_water','meat','calcite','bio_chaff','calcium']
    .map(name=>['createch2:greate/suppliers/biology_'+name,'FRN-06'])),
  'createch2:mixer/greate_precision/osmiridium_stock': 'FRN-06',
  ...Object.fromEntries(['zpm_circuit_assembler','zpm_1a_energy_converter',
    'uv_1a_energy_converter','uv_energy_input_hatch','sterilizing_filter_casing','luv_mixer','luv_centrifuge','luv_autoclave','luv_brewery','luv_distillery','luv_fluid_heater']
    .map(name=>['createch2:greate/suppliers/wetware_'+name,'FRN-06'])),
  ...Object.fromEntries(['neutronium_conditioning','neutronium_plate','uhv_hull']
    .map(name=>['createch2:greate/suppliers/'+name,'FRN-06'])),
  ...Object.fromEntries(['tin_element_feed','neodymium_element_feed','darmstadtium_fusion',
    'darmstadtium_compaction','darmstadtium_reduction','darmstadtium_plate','uv_hull','uv_uu_matter_bucket']
    .map(name=>['createch2:greate/suppliers/'+name,'FRN-05'])),
  ...Object.fromEntries(['nand_memory_wafer','nand_memory_chip']
    .map(name=>['createch2:laser_engraver/greate_uv/'+name,'FRN-05'])),
  ...Object.fromEntries(['crystal_processor_assembly','crystal_processor_computer']
    .map(name=>['createch2:circuit_assembler/greate_uv/'+name,'FRN-05'])),
  'createch2:assembly_line/greate_uv/crystal_processor_mainframe': 'FRN-05',
  ...Object.fromEntries(['chromium_trioxide','potassium_dichromate','dimethylbenzene',
    'phthalic_acid','chlorobenzene','nitrochlorobenzene','dichlorobenzidine',
    'diaminobenzidine','diphenyl_isophtalate','polybenzimidazole'].map(name=>[
      'createch2:large_chemical_reactor/greate_polymers/'+name,'CHE-03'])),
  'createch2:greate/polymers/nitration_mixture': 'CHE-03',
  'createch2:greate/polymers/sulfuric_acid_recovery': 'CHE-03',
  'createch2:greate/belts/polybenzimidazole': 'FRN-05',
  'createch2:greate/suppliers/naquadah_billet': 'FRN-04E',
  'createch2:greate/suppliers/trinium_billet': 'FRN-04E',
  'createch2:greate/suppliers/naquadah_alloy': 'FRN-04E',
  'createch2:greate/suppliers/naquadah_alloy_plate': 'FRN-04E',
  'createch2:greate/suppliers/zpm_hull': 'FRN-04E',
  'createch2:circuit_assembler/greate_precision/quantum_processor_mainframe': 'FRN-04E',
  'createch2:greate/polymers/chloroform': 'CHE-03',
  'createch2:greate/polymers/tetrafluoroethylene': 'CHE-03',
  'createch2:greate/polymers/polytetrafluoroethylene': 'CHE-03',
  'createch2:greate/belts/polytetrafluoroethylene': 'NUC-06',
  'createch2:greate/suppliers/copper_element_feed': 'NUC-06',
  'createch2:greate/suppliers/sulfur_element_feed': 'NUC-06',
  'createch2:greate/suppliers/rhodium_fusion': 'NUC-06',
  'createch2:greate/suppliers/rhodium_compaction': 'NUC-06',
  'createch2:greate/suppliers/rpp_blend': 'NUC-06',
  'createch2:greate/suppliers/rpp_reduction': 'NUC-06',
  'createch2:greate/suppliers/rpp_plate': 'NUC-06',
  'createch2:greate/suppliers/luv_hull': 'NUC-06',
  'createch2:greate/suppliers/platinum_fine_wire': 'COM-06',
  'createch2:laser_engraver/greate_precision/nor_memory_wafer': 'COM-06',
  'createch2:laser_engraver/greate_precision/nor_memory_chip': 'COM-06',
  'createch2:circuit_assembler/greate_precision/quantum_processor_assembly': 'COM-06',
  'createch2:circuit_assembler/greate_precision/quantum_processor_computer': 'COM-06'
};

// Existing exact recipe protection also owns these reviewed native processes.
export const reviewedNativeProcessOwners = [...Object.keys(greateSupplierLocks).filter(id=>id.startsWith('createch2:large_chemical_reactor/')),
  'createch2:large_chemical_reactor/greg_specialist/process/pgm_aqua_regia_batch',
  'createch2:alloy_blast_smelter/greg_specialist/process/naquadah_master_alloy_batch'].sort();
