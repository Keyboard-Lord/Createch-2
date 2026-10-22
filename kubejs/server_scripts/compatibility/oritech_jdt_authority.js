// priority: 900
// Createch 2 0.7.3a Oritech + Just Dire Things activation authority.
;(function () {
ServerEvents.recipes(event => {
  var id = name => `createch2:oritech_jdt/${name}`
  var removalFilters = []
  // Retain processing of earned bee output and reversible material storage.
  // Bee proofs and flower blocks still require first manufacture.
  var retainedMaterialRecipes = [
    'productivebees:centrifuge/justdirethings/honeycomb_ferricore',
    'productivebees:centrifuge/justdirethings/honeycomb_blazegold',
    'productivebees:centrifuge/justdirethings/honeycomb_celestigem',
    'productivebees:centrifuge/justdirethings/honeycomb_eclipsealloy',
    'productivebees:centrifuge/oritech/honeycomb_uranite_crystal',
    'justdirethings:ferricore_ingot_smelted',
    'justdirethings:ferricore_ingot_blasted',
    'justdirethings:blazegold_ingot_smelted',
    'justdirethings:blazegold_ingot_blasted',
    'justdirethings:eclipsealloy_ingot_smelted',
    'justdirethings:eclipsealloy_ingot_blasted',
    'justdirethings:ferricore_block_9x9',
    'justdirethings:blazegold_block_9x9',
    'justdirethings:celestigem_block_9x9',
    'justdirethings:eclipsealloy_block_9x9'
  ]
  var retainedMaterialRecipeIds = new RegExp('^(?:' + retainedMaterialRecipes.join('|') + ')$')
  var replace = (output, factory) => {
    removalFilters.push({ output: output })
    return factory()
  }
  var miAssembler = (name, output, eu, duration, inputs, fluid, fluidAmount) => event.custom({
    type: 'modern_industrialization:assembler',
    eu: eu,
    duration: duration,
    item_inputs: inputs.map(entry => ({ item: entry[0], amount: entry[1] || 1 })),
    fluid_inputs: { fluid: fluid || 'modern_industrialization:soldering_alloy', amount: fluidAmount || 144 },
    item_outputs: [{ item: output, amount: 1 }]
  }).id(id(name))

  // Parallel power networks and native general generators have no acquisition
  // route. The experimental reactor remains separate and is gated below under
  // Mekanism/CROWNS fuel authority.
  var powerConflicts = [
    'oritech:basic_generator_block', 'oritech:big_solar_panel_block',
    'oritech:bio_generator_block', 'oritech:fuel_generator_block',
    'oritech:lava_generator_block', 'oritech:steam_engine_block',
    'oritech:energy_pipe',
    'oritech:energy_pipe_duct_block', 'oritech:framed_energy_pipe',
    'oritech:superconductor',
    'oritech:superconductor_duct_block', 'oritech:framed_superconductor',
    'oritech:power_pole_block',
    'oritech:creative_storage_block', 'oritech:creative_tank_block',
    'justdirethings:generatort1', 'justdirethings:generatorfluidt1',
    'justdirethings:energytransmitter', 'justdirethings:pocket_generator',
    'justdynathings:ferricore_solar_panel', 'justdynathings:blazegold_solar_panel',
    'justdynathings:celestigem_solar_panel', 'justdynathings:eclipse_alloy_solar_panel',
    'justdynathings:thermo_generator'
  ]
  powerConflicts.forEach(output => removalFilters.push({ output: output }))
  ;[
    'oritech:small_storage_block', 'oritech:large_storage_block',
    'oritech:capacitor_addon_extender', 'oritech:steam_boiler_addon',
    'oritech:item_pipe', 'oritech:transparent_item_pipe',
    'oritech:framed_item_pipe', 'oritech:item_pipe_duct_block',
    'oritech:fluid_pipe', 'oritech:framed_fluid_pipe',
    'oritech:fluid_pipe_duct_block'
  ].forEach(output => removalFilters.push({ output: output }))
  ;['oritech:bio_generator', 'oritech:fuel_generator', 'oritech:lava_generator', 'oritech:steam_engine'].forEach(type => removalFilters.push({ type: type }))

  // Native generation and general ore processing are not Oritech's role.
  ;[
    'oritech:pulverizer', 'oritech:grinder', 'oritech:foundry',
    'oritech:assembler', 'oritech:centrifuge', 'oritech:centrifuge_fluid',
    'oritech:refinery', 'oritech:deep_drill', 'oritech:particle_collision'
  ].forEach(type => removalFilters.push({ type: type }))

  // Oritech's native petroleum and ore surface is not a second geology or
  // chemistry authority. Worldgen is disabled by same-ID biome-modifier
  // overrides; these item routes close loot/crafting compatibility bypasses.
  ;[
    'oritech:nickel_ore', 'oritech:deepslate_nickel_ore',
    'oritech:deepslate_platinum_ore', 'oritech:endstone_platinum_ore',
    'oritech:deepslate_uranium_ore', 'oritech:raw_nickel',
    'oritech:raw_nickel_block', 'oritech:raw_platinum',
    'oritech:raw_platinum_block', 'oritech:raw_uranium',
    'oritech:raw_uranium_block', 'oritech:uranium_gem',
    'oritech:small_uranium_dust', 'oritech:uranium_dust',
    'oritech:uranium_dust_block', 'oritech:uranium_pellet',
    'oritech:small_uranium_pellet', 'oritech:still_oil_bucket',
    'oritech:still_heavy_oil_bucket', 'oritech:still_diesel_bucket',
    'oritech:still_naphtha_bucket', 'oritech:still_fuel_bucket',
    'oritech:still_steam_bucket', 'oritech:still_biofuel_bucket',
    'oritech:still_sulfuric_acid_bucket', 'oritech:still_sheol_fire_bucket',
    'oritech:still_strange_matter_bucket'
  ].forEach(output => removalFilters.push({ output: output }))

  // First supply remains manufactured. Accepted bees may renew raw material,
  // but native goo must not create the first ore or bypass that manufacture.
  ;['ferricore', 'blazegold', 'celestigem', 'eclipsealloy'].forEach(material => {
    removalFilters.push({ id: `justdirethings:raw_${material}_ore-goospread` })
  })
  ;[
    'justdirethings:raw_ferricore', 'justdirethings:raw_ferricore_ore',
    'justdirethings:raw_blazegold', 'justdirethings:raw_blazegold_ore',
    'justdirethings:raw_celestigem_ore',
    'justdirethings:raw_eclipsealloy', 'justdirethings:raw_eclipsealloy_ore'
  ].forEach(output => removalFilters.push({ output: output }))

  replace('justdirethings:ferricore_ingot', () => miAssembler(
    'age_06/jdt/ferricore', 'justdirethings:ferricore_ingot', 32, 600,
    [
      ['modern_industrialization:steel_ingot', 2],
      ['tfc:metal/ingot/copper', 1],
      ['electroenergetics:inductor', 1],
      ['modern_industrialization:electronic_circuit', 1]
    ]
  ))
  replace('justdirethings:blazegold_ingot', () => miAssembler(
    'age_09/jdt/blazegold', 'justdirethings:blazegold_ingot', 128, 900,
    [
      ['justdirethings:ferricore_ingot', 2],
      ['minecraft:gold_ingot', 2],
      ['tfmg:heavy_plate', 1],
      ['mekanism:advanced_control_circuit', 1]
    ], 'tfmg:naphtha', 1000
  ))
  replace('justdirethings:celestigem', () => miAssembler(
    'age_10/jdt/celestigem', 'justdirethings:celestigem', 256, 1200,
    [
      ['justdirethings:blazegold_ingot', 2],
      ['ae2:fluix_crystal', 4],
      ['minecraft:ender_pearl', 2],
      ['ae2:engineering_processor', 1]
    ], 'modern_industrialization:polyvinyl_chloride', 500
  ))
  replace('justdirethings:eclipsealloy_ingot', () => miAssembler(
    'age_15b/jdt/eclipse_alloy', 'justdirethings:eclipsealloy_ingot', 1024, 1800,
    [
      ['justdirethings:ferricore_ingot', 1],
      ['justdirethings:blazegold_ingot', 1],
      ['justdirethings:celestigem', 1],
      ['modern_industrialization:nuclear_alloy_plate', 2],
      ['eternal_starlight:starcore', 1],
      ['gtceu:luv_field_generator', 1]
    ], 'modern_industrialization:uu_matter', 250
  ))

  // Templates retain the full native tools/armor catalog while forcing the
  // authored material order. Native equipment recipes may consume these gates.
  ;[
    ['template_ferricore', 'justdirethings:ferricore_ingot', 'create:precision_mechanism'],
    ['template_blazegold', 'justdirethings:blazegold_ingot', 'mekanism:advanced_control_circuit'],
    ['template_celestigem', 'justdirethings:celestigem', 'ae2:engineering_processor'],
    ['template_eclipsealloy', 'justdirethings:eclipsealloy_ingot', 'gtceu:luv_sensor']
  ].forEach(([name, material, proof]) => replace(`justdirethings:${name}`, () => event.shaped(`justdirethings:${name}`, [
    ' M ',
    'PBP',
    ' M '
  ], {
    M: material,
    P: proof,
    B: 'minecraft:netherite_upgrade_smithing_template'
  })).id(id(`jdt/templates/${name}`)))

  // Ferricore field engineering and later upgrades. These are service tools,
  // not bulk miners or an alternate grid.
  ;[
    ['blockplacert1', 'create:deployer'],
    ['blockbreakert1', 'create:mechanical_drill'],
    ['sensort1', 'electroenergetics:ammeter'],
    ['clickert1', 'create:deployer'],
    ['droppert1', 'create:chute'],
    ['fluidplacert1', 'create:spout'],
    ['fluidcollectort1', 'create:portable_fluid_interface']
  ].forEach(([output, core]) => replace(`justdirethings:${output}`, () => event.shaped(`justdirethings:${output}`, [
    'FDF',
    'PCP',
    'FWF'
  ], {
    F: 'justdirethings:ferricore_ingot',
    D: 'electroenergetics:converter',
    P: core,
    C: 'modern_industrialization:electronic_circuit',
    W: 'electroenergetics:connector'
  })).id(id(`age_06/jdt/field/${output}`)))

  ;[
    ['blockplacert2', 'justdirethings:blockplacert1'],
    ['blockbreakert2', 'justdirethings:blockbreakert1'],
    ['sensort2', 'justdirethings:sensort1'],
    ['clickert2', 'justdirethings:clickert1'],
    ['droppert2', 'justdirethings:droppert1'],
    ['fluidplacert2', 'justdirethings:fluidplacert1'],
    ['fluidcollectort2', 'justdirethings:fluidcollectort1']
  ].forEach(([output, core]) => replace(`justdirethings:${output}`, () => event.shaped(`justdirethings:${output}`, [
    'BDB',
    'PCP',
    'BWB'
  ], {
    B: 'justdirethings:blazegold_ingot',
    D: 'electroenergetics:converter',
    P: core,
    C: 'modern_industrialization:digital_circuit',
    W: 'electroenergetics:current_transformer'
  })).id(id(`age_09/jdt/field/${output}`)))

  // Oritech material vocabulary. Each material feeds a later core or project;
  // none becomes a parallel universal alloy ladder.
  ;[
    ['fluxite', 64, 'ae2:fluix_crystal', 'modern_industrialization:steel_plate', 'electroenergetics:transformer_core'],
    ['energite_ingot', 128, 'oritech:fluxite', 'modern_industrialization:stainless_steel_plate', 'electroenergetics:sulfur_hexafluoride_breaker'],
    ['duratium_ingot', 256, 'oritech:energite_ingot', 'modern_industrialization:titanium_plate', 'justdirethings:celestigem'],
    ['adamant_ingot', 1024, 'oritech:duratium_ingot', 'modern_industrialization:nuclear_alloy_plate', 'justdirethings:eclipsealloy_ingot'],
    ['prometheum_ingot', 8192, 'oritech:adamant_ingot', 'oritech:still_strange_matter_bucket', 'gtceu:uhv_field_generator']
  ].forEach(([output, eu, prior, material, proof], index) => replace(`oritech:${output}`, () => miAssembler(
    `materials/oritech/${output}`, `oritech:${output}`, eu, 700 + index * 300,
    [[prior, 2], [material, 2], [proof, 1], ['electroenergetics:converter', 1]],
    index >= 3 ? 'modern_industrialization:uu_matter' : 'modern_industrialization:soldering_alloy',
    index >= 3 ? 250 : 288
  )))

  // Resource exceptions have one authored source each. Sheol Fire is a
  // controlled MI chemistry product; Uranite Crystal starts downstream of the
  // Mekanism fuel cycle. Neither route enables Oritech geology.
  event.custom({
    type: 'modern_industrialization:chemical_reactor',
    eu: 512,
    duration: 1800,
    item_inputs: [
      { item: 'malum:blazing_quartz', amount: 4 },
      { item: 'evilcraft:dark_power_gem', amount: 1 },
      { item: 'oritech:duratium_ingot', amount: 1 },
      { item: 'gtceu:iv_field_generator', amount: 1, probability: 0 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:sulfuric_acid', amount: 1000 },
      { fluid: 'minecraft:lava', amount: 4000 }
    ],
    fluid_outputs: [
      { fluid: 'oritech:still_sheol_fire', amount: 250 }
    ]
  }).id(id('age_13/resources/sheol_fire'))

  replace('oritech:uranium_crystal', () => event.custom({
    type: 'modern_industrialization:chemical_reactor',
    eu: 512,
    duration: 1600,
    item_inputs: [
      { item: 'crowns:fuel_rod', amount: 1 },
      { item: 'modern_industrialization:nuclear_alloy_plate', amount: 1 },
      { item: 'gtceu:iv_sensor', amount: 1, probability: 0 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:sulfuric_acid',
      amount: 1000
    },
    item_outputs: [
      { item: 'oritech:uranium_crystal', amount: 2 }
    ]
  })).id(id('age_13/resources/uranite_crystal'))

  // Age 8 modular machine hall: a Electro Energetics-fed acceptor is mandatory.
  ;[
    ['machine_acceptor_addon', 'electroenergetics:converter', 'electroenergetics:transformer_core'],
    ['machine_extender', 'modern_industrialization:steel_machine_casing', 'create:mechanical_bearing'],
    ['machine_processing_addon', 'modern_industrialization:assembler', 'modern_industrialization:electronic_circuit'],
    ['machine_efficiency_addon', 'modern_industrialization:advanced_machine_hull', 'electroenergetics:energy_meter'],
    ['assembler_block', 'modern_industrialization:assembler', 'oritech:machine_core_1'],
    ['centrifuge_block', 'modern_industrialization:centrifuge', 'oritech:machine_core_1']
  ].forEach(([output, core, proof]) => replace(`oritech:${output}`, () => event.shaped(`oritech:${output}`, [
    'FDF',
    'PCP',
    'FWF'
  ], {
    F: 'oritech:machine_frame_block',
    D: 'electroenergetics:converter',
    P: proof,
    C: core,
    W: 'electroenergetics:connector'
  })).id(id(`age_08/oritech/hall/${output}`)))

  // The hall frame is the base of the family and therefore cannot use the
  // generic frame-wrapped recipe used by its children.
  replace('oritech:machine_frame_block', () => event.shaped(Item.of('oritech:machine_frame_block', 4), [
    'SPS',
    'WCM',
    'SPS'
  ], {
    S: 'modern_industrialization:steel_plate',
    P: 'create:sturdy_sheet',
    W: 'electroenergetics:connector',
    C: 'modern_industrialization:steel_machine_casing',
    M: 'justdirethings:ferricore_ingot'
  })).id(id('age_08/oritech/hall/machine_frame_block'))

  // First Core 1 cannot require the Oritech assembler that consumes that core.
  // Keep the nominal 128FE*240tick batch: 12EU*256ticks at 10FE/EU.
  replace('oritech:processing_unit', () => event.custom({
    type: 'modern_industrialization:assembler',
    eu: 12,
    duration: 256,
    item_inputs: [
      { item: 'oritech:fluxite', amount: 1 },
      { item: 'modern_industrialization:electronic_circuit', amount: 1 },
      { item: 'electroenergetics:converter', amount: 1 },
      { item: 'create:precision_mechanism', amount: 1 }
    ],
    item_outputs: [{ item: 'oritech:processing_unit', amount: 1 }]
  })).id(id('age_08/oritech/hall/controlled_processing_unit'))

  // Core 1 commissions the modular hall through a real Class II integration
  // line instead of collapsing the age-defining machine into one shaped craft.
  replace('oritech:machine_core_1', () => event.custom({
    type: 'create:sequenced_assembly',
    ingredient: { item: 'oritech:machine_frame_block' },
    transitional_item: { id: 'oritech:machine_frame_block' },
    loops: 1,
    sequence: [
      'modern_industrialization:advanced_machine_hull',
      'justdirethings:ferricore_ingot',
      'oritech:processing_unit',
      'modern_industrialization:advanced_motor',
      'modern_industrialization:advanced_pump',
      'electroenergetics:converter',
      'create:precision_mechanism',
      'modern_industrialization:electronic_circuit'
    ].map(component => ({
      type: 'create:deploying',
      ingredients: [{ item: 'oritech:machine_frame_block' }, { item: component }],
      results: [{ id: 'oritech:machine_frame_block' }]
    })).concat([
      {
        type: 'create:filling',
        ingredients: [
          { item: 'oritech:machine_frame_block' },
          { type: 'neoforge:single', amount: 144, fluid: 'modern_industrialization:soldering_alloy' }
        ],
        results: [{ id: 'oritech:machine_frame_block' }]
      },
      {
        type: 'greate:pressing',
        recipe_tier: 2,
        ingredients: [{ item: 'oritech:machine_frame_block' }],
        results: [{ id: 'oritech:machine_frame_block' }]
      }
    ]),
    results: [{ id: 'oritech:machine_core_1' }]
  })).id(id('age_08/oritech/hall/machine_core_1_commissioning'))

  // Machine cores are the age gates for expansion. Higher addons inherit their
  // prior core rather than skipping directly to exotic materials.
  ;[
    ['machine_core_2', 'oritech:machine_core_1', 'justdirethings:blazegold_ingot', 'mekanism:advanced_control_circuit'],
    ['machine_core_3', 'oritech:machine_core_2', 'justdirethings:celestigem', 'ae2:engineering_processor'],
    ['machine_core_4', 'oritech:machine_core_3', 'oritech:duratium_ingot', 'gtceu:ev_robot_arm'],
    ['machine_core_5', 'oritech:machine_core_4', 'modern_industrialization:nuclear_alloy_plate', 'gtceu:iv_robot_arm'],
    ['machine_core_6', 'oritech:machine_core_5', 'oritech:adamant_ingot', 'gtceu:luv_robot_arm'],
    ['machine_core_7', 'oritech:machine_core_6', 'oritech:still_strange_matter_bucket', 'gtceu:zpm_robot_arm']
  ].forEach(([output, previous, material, precision], index) => replace(`oritech:${output}`, () => miAssembler(
    `machine_cores/tier_${index + 2}`, `oritech:${output}`, 128 << index, 900 + index * 300,
    [[previous, 1], [material, 2], [precision, 1], ['electroenergetics:sulfur_hexafluoride_breaker', 1]],
    index >= 3 ? 'modern_industrialization:uu_matter' : 'modern_industrialization:soldering_alloy',
    index >= 3 ? 250 : 288
  )))

  // Industrial biology: physical TFC organics -> Create preparation -> MI
  // controlled batch -> Oritech exclusive processing and JDT consumers.
  event.custom({
    type: 'create:mixing',
    ingredients: [
      { item: 'tfc:food/red_apple' }, { item: 'tfc:food/carrot' },
      { item: 'minecraft:oak_sapling' }, { item: 'tfc:compost' }
    ],
    results: [{ id: 'tfc:compost', count: 2 }],
    heat_requirement: 'heated'
  }).id(id('age_09/biology/create_organic_feedstock'))

  replace('oritech:biomass', () => event.custom({
    type: 'modern_industrialization:centrifuge',
    eu: 128,
    duration: 600,
    item_inputs: [
      { item: 'tfc:compost', amount: 4 },
      { item: 'modern_industrialization:rubber_sheet', amount: 1, probability: 0 }
    ],
    fluid_inputs: {
      fluid: 'minecraft:water',
      amount: 2000
    },
    item_outputs: [
      { item: 'oritech:biomass', amount: 8 },
      { item: 'tfc:powder/wood_ash', amount: 1 }
    ]
  })).id(id('age_09/biology/mi_sterilized_biomass'))

  replace('oritech:solid_biofuel', () => event.custom({
    type: 'oritech:assembler',
    ingredients: [
      { item: 'oritech:biomass' }, { item: 'oritech:biomass' },
      { item: 'tfc:powder/charcoal' }, { item: 'modern_industrialization:rubber_sheet' }
    ],
    results: [{ id: 'oritech:solid_biofuel', count: 2 }],
    time: 160
  })).id(id('age_09/biology/solid_biofuel'))

  replace('oritech:raw_biopolymer', () => event.custom({
    type: 'oritech:centrifuge_fluid',
    fluidInput: { amount: 1000, fluid: 'minecraft:water' },
    ingredients: [{ item: 'oritech:solid_biofuel' }],
    results: [{ id: 'oritech:raw_biopolymer', count: 1 }],
    time: 240
  })).id(id('age_09/biology/raw_biopolymer'))

  // Age 9 biosteel is the first structural biopolymer composite. Stainless
  // reinforcement remains an Age 10 property of the digital biology machines
  // below instead of leaking the next material age into this recipe.
  replace('oritech:biosteel_ingot', () => event.custom({
    type: 'oritech:foundry',
    ingredients: [
      { item: 'oritech:raw_biopolymer' },
      { item: 'modern_industrialization:steel_ingot' }
    ],
    results: [{ id: 'oritech:biosteel_ingot', count: 1 }],
    time: 320
  })).id(id('age_09/biology/biosteel'))

  ;[
    ['foundry_block', 'modern_industrialization:electric_blast_furnace'],
    ['refinery_block', 'modern_industrialization:chemical_reactor'],
    ['fertilizer_block', 'create:mechanical_harvester'],
    ['treefeller_block', '#createch2:components/mechanical_saw'],
    ['crop_filter_addon', 'tfc:metal/scythe/steel']
  ].forEach(([output, core]) => replace(`oritech:${output}`, () => event.shaped(`oritech:${output}`, [
    'BDB',
    'PCP',
    'BWB'
  ], {
    B: 'oritech:biosteel_ingot',
    D: 'electroenergetics:converter',
    P: 'oritech:machine_core_2',
    C: core,
    W: 'electroenergetics:current_transformer'
  })).id(id(`age_09/biology/machine/${output}`)))

  // Field heads retain a narrow Oritech/JDT role. The Oritech Destroyer and
  // quarry addon are denied: DestroyerBlockEntity removes blocks without a
  // NeoForge BreakEvent, so TFC never receives its collapse trigger. JDT owns
  // tool-backed field breaking; bulk extraction belongs to the bounded Deep
  // Drill campaign below.
  ;[
    ['placer_block', 'justdirethings:blockplacert2'],
    ['pump_block', 'justdirethings:fluidcollectort2'],
    ['laser_arm_block', 'gtceu:ev_emitter']
  ].forEach(([output, fieldCore]) => replace(`oritech:${output}`, () => event.shaped(`oritech:${output}`, [
    'BDB',
    'PCP',
    'BWB'
  ], {
    B: 'oritech:biosteel_ingot',
    D: 'electroenergetics:converter',
    P: fieldCore,
    C: 'oritech:machine_core_3',
    W: 'modern_industrialization:digital_circuit'
  })).id(id(`age_10/field_machine/${output}`)))
  removalFilters.push({ output: 'oritech:destroyer_block' })
  removalFilters.push({ output: 'oritech:quarry_addon' })

  replace('oritech:machine_hunter_addon', () => event.shaped('oritech:machine_hunter_addon', [
    'BDB',
    'HCH',
    'BDB'
  ], {
    B: 'oritech:biosteel_ingot',
    D: 'electroenergetics:converter',
    H: 'hostilenetworks:sim_chamber',
    C: 'hostilenetworks:loot_fabricator'
  })).id(id('age_11/biology/hunter_addon'))

  // Digital drones remain visible local freight. The port recipe includes AE2
  // storage/control, CC supervision, and a Electro Energetics-fed machine interface.
  replace('oritech:drone_port_block', () => event.shaped('oritech:drone_port_block', [
    'CDC',
    'PMP',
    'CAC'
  ], {
    C: 'justdirethings:celestigem',
    D: 'computercraft:computer_advanced',
    P: 'electroenergetics:converter',
    M: 'oritech:machine_core_3',
    A: 'ae2:interface'
  })).id(id('age_10/oritech/drone_port'))

  replace('oritech:target_designator', () => event.shaped('oritech:target_designator', [
    ' S ',
    'CDC',
    ' E '
  ], {
    S: 'gtceu:hv_sensor',
    C: 'justdirethings:celestigem',
    D: 'computercraft:pocket_computer_advanced',
    E: 'gtceu:hv_emitter'
  })).id(id('age_10/oritech/target_designator'))

  // Large machinery and bounded Deep Drill. A resource-node cartridge can be
  // built only from a processed sample, so it can never create first discovery.
  replace('oritech:deep_drill_block', () => event.custom({
    type: 'create:sequenced_assembly',
    ingredient: { item: 'modern_industrialization:electric_quarry' },
    transitional_item: { id: 'modern_industrialization:electric_quarry' },
    loops: 1,
    sequence: [
      ['create:mechanical_drill', 'create:deploying'],
      ['modern_industrialization:highly_advanced_machine_hull', 'create:deploying'],
      ['oritech:machine_core_4', 'create:deploying'],
      ['electroenergetics:sulfur_hexafluoride_breaker', 'create:deploying'],
      ['gtceu:ev_electric_motor', 'create:deploying'],
      ['modern_industrialization:titanium_plate', 'create:deploying'],
      ['computercraft:computer_advanced', 'create:deploying'],
      ['modern_industrialization:advanced_pump', 'create:deploying'],
      ['modern_industrialization:advanced_motor', 'create:deploying'],
      ['electroenergetics:hanging_glass_insulator', 'create:deploying'],
      ['gtceu:ev_sensor', 'create:deploying'],
      ['gtceu:ev_emitter', 'create:deploying'],
      ['ae2:interface', 'create:deploying'],
      ['oritech:duratium_ingot', 'create:deploying']
    ].map(entry => ({
      type: entry[1],
      ingredients: [
        { item: 'modern_industrialization:electric_quarry' },
        { item: entry[0] }
      ],
      results: [{ id: 'modern_industrialization:electric_quarry' }]
    })).concat([
      {
        type: 'create:filling',
        ingredients: [
          { item: 'modern_industrialization:electric_quarry' },
          { type: 'neoforge:single', amount: 1000, fluid: 'modern_industrialization:lubricant' }
        ],
        results: [{ id: 'modern_industrialization:electric_quarry' }]
      },
      {
        type: 'greate:pressing',
        recipe_tier: 4,
        ingredients: [{ item: 'modern_industrialization:electric_quarry' }],
        results: [{ id: 'modern_industrialization:electric_quarry' }]
      }
    ]),
    results: [{ id: 'oritech:deep_drill_block' }]
  })).id(id('age_11/oritech/deep_drill'))

  var drillRoutes = [
    ['coal', 'minecraft:coal', 'minecraft:coal', 16],
    ['copper', 'tfc:metal/ingot/copper', 'modern_industrialization:copper_dust', 8],
    ['iron', 'tfc:metal/ingot/wrought_iron', 'modern_industrialization:iron_dust', 8],
    ['nickel', 'modern_industrialization:nickel_ingot', 'modern_industrialization:nickel_dust', 6],
    ['platinum', 'modern_industrialization:platinum_ingot', 'modern_industrialization:platinum_dust', 4],
    ['uranium', 'modern_industrialization:uranium_dust', 'modern_industrialization:uranium_dust', 4]
  ]
  drillRoutes.forEach(([name, sample, result, count]) => {
    replace(`oritech:resource_node_${name}`, () => event.shaped(`oritech:resource_node_${name}`, [
      ' S ',
      'DMD',
      ' H '
    ], {
      S: sample,
      D: 'oritech:duratium_ingot',
      M: 'oritech:machine_core_4',
      H: 'modern_industrialization:highly_advanced_machine_hull'
    })).id(id(`age_11/deep_drill/cartridge_${name}`))
    event.custom({
      type: 'oritech:deep_drill',
      ingredients: [{ item: `oritech:resource_node_${name}` }],
      results: [{ id: result, count: count }],
      time: 2400 + (16 - count) * 300
    }).id(id(`age_11/deep_drill/route_${name}`))
  })

  // Experimental reactor support: construction and fuel both derive from the
  // established Mekanism/CROWNS campaign and connect through Electro Energetics.
  replace('oritech:reactor_controller', () => event.shaped('oritech:reactor_controller', [
    'NIN',
    'RCR',
    'BFB'
  ], {
    N: 'modern_industrialization:nuclear_alloy_plate',
    I: 'gtceu:iv_sensor',
    R: 'mekanismgenerators:fission_reactor_logic_adapter',
    C: 'oritech:machine_core_5',
    B: 'electroenergetics:sulfur_hexafluoride_breaker',
    F: 'mekanism:geiger_counter'
  })).id(id('age_13/oritech/experimental_reactor'))
  removalFilters.push({ type: 'oritech:reactor' })
  event.custom({
    type: 'oritech:reactor',
    ingredients: [{ item: 'crowns:fuel_rod' }],
    results: [],
    time: 8000
  }).id(id('age_13/oritech/mekanism_crowns_fuel_authority'))

  // Age 15 Particle Accelerator convergence. All native collisions are gone;
  // this is the sole Strange Matter production route.
  ;[
    ['accelerator_ring', 'gtceu:zpm_field_generator'],
    ['accelerator_motor', 'gtceu:zpm_electric_motor'],
    ['accelerator_sensor', 'gtceu:zpm_sensor'],
    ['particle_collector_block', 'gtceu:zpm_emitter'],
    ['accelerator_controller', 'gtceu:zpm_robot_arm']
  ].forEach(([output, precision]) => replace(`oritech:${output}`, () => event.custom({
    type: 'create:sequenced_assembly',
    ingredient: { item: precision },
    transitional_item: { id: precision },
    loops: 1,
    sequence: [
      'justdirethings:eclipsealloy_ingot',
      'eternal_starlight:starcore',
      'oritech:machine_core_6',
      'modern_industrialization:nuclear_alloy_plate',
      'ae2:quantum_link'
    ].map(component => ({
      type: 'create:deploying',
      ingredients: [{ item: precision }, { item: component }],
      results: [{ id: precision }]
    })).concat([
      {
        type: 'create:filling',
        ingredients: [
          { item: precision },
          { type: 'neoforge:single', amount: 50, fluid: 'modern_industrialization:uu_matter' }
        ],
        results: [{ id: precision }]
      },
      {
        type: 'greate:pressing',
        recipe_tier: 7,
        ingredients: [{ item: precision }],
        results: [{ id: precision }]
      }
    ]),
    results: [{ id: `oritech:${output}` }]
  })).id(id(`age_15/oritech/accelerator/${output}`)))

  removalFilters.push({ output: 'oritech:still_strange_matter_bucket' })
  event.custom({
    type: 'oritech:particle_collision',
    ingredients: [
      { item: 'gtceu:zpm_field_generator' },
      { item: 'justdirethings:eclipsealloy_ingot' }
    ],
    results: [{ id: 'oritech:still_strange_matter_bucket', count: 1 }],
    time: 12000
  }).id(id('age_15/oritech/accelerator/strange_matter'))

  // Exotic infrastructure consumes Strange Matter; it never produces it.
  ;[
    ['unstable_container', 'gtceu:zpm_field_generator'],
    ['machine_burst_addon', 'gtceu:zpm_emitter'],
    ['machine_combi_addon', 'gtceu:zpm_robot_arm'],
    ['machine_ultimate_addon', 'gtceu:uv_field_generator'],
    ['shrinker_block', 'ae2:spatial_io_port'],
    ['black_hole_block', 'sgjourney:classic_stargate']
  ].forEach(([output, convergence]) => replace(`oritech:${output}`, () => event.shaped(`oritech:${output}`, [
    'ESE',
    'PCP',
    'ESE'
  ], {
    E: 'justdirethings:eclipsealloy_ingot',
    S: 'oritech:still_strange_matter_bucket',
    P: convergence,
    C: 'oritech:machine_core_6'
  })).id(id(`age_15/oritech/exotic/${output}`)))

  // Spatial utilities require both accelerator physics and fixed-link theory.
  ;[
    ['justdirethings:portalgun', 'sgjourney:classic_stargate', 'gtceu:zpm_field_generator'],
    ['justdirethings:portalgun_v2', 'sgjourney:milky_way_stargate', 'avaritia:infinity_ingot'],
    ['justdirethings:eclipsegate_wand', 'sgjourney:stargate_variant_crystal', 'gtceu:uhv_sensor'],
    ['justdirethings:voidshift_wand', 'ae2:quantum_link', 'gtceu:uhv_emitter']
  ].forEach(([output, endpointProof, precision]) => replace(output, () => event.shaped(output, [
    'EPE',
    'SCS',
    'EPE'
  ], {
    E: 'justdirethings:eclipsealloy_ingot',
    P: endpointProof,
    S: precision,
    C: 'oritech:still_strange_matter_bucket'
  })).id(id(`age_15_16/spatial/${output.split(':')[1]}`)))

  // Time components begin with Age 15 matter engineering; stationary bounded
  // acceleration follows the accelerator, while portable/extreme systems
  // require Infinity and OpV.
  replace('justdirethings:time_crystal', () => miAssembler(
    'age_15/time/component', 'justdirethings:time_crystal', 1024, 1800,
    [
      ['justdirethings:eclipsealloy_ingot', 2],
      ['eternal_starlight:starcore', 1],
      ['gtceu:luv_sensor', 1],
      ['gtceu:luv_emitter', 1]
    ], 'modern_industrialization:uu_matter', 250
  ))
  ;[
    ['justdirethings:time_wand', 'projecte:watch_of_flowing_time'],
    ['justdynathings:advanced_time_wand', 'justdirethings:time_wand'],
    ['justdynathings:temporal_stupefy_wand', 'justdynathings:advanced_time_wand']
  ].forEach(([output, core]) => replace(output, () => event.shaped(output, [
    'OIO',
    'TCT',
    'OFO'
  ], {
    O: 'gtceu:opv_emitter',
    I: 'avaritia:infinity_ingot',
    T: 'justdirethings:time_crystal',
    C: core,
    F: 'gtceu:opv_field_generator'
  })).id(id(`age_16/time/portable/${output.split(':')[1]}`)))

  // Creative flight remains a final reward.
  ;['justdirethings:upgrade_flight', 'oritech:exo_jetpack', 'oritech:jetpack_exo_elytra'].forEach(output => removalFilters.push({ output: output }))
  event.shaped('justdirethings:upgrade_flight', [
    'OIO',
    'EUE',
    'OFO'
  ], {
    O: 'gtceu:opv_emitter',
    I: 'avaritia:infinity_ingot',
    E: 'justdirethings:eclipsealloy_ingot',
    U: 'justdirethings:upgrade_elytra',
    F: 'gtceu:opv_field_generator'
  }).id(id('age_16/jdt/creative_flight'))

  // Crystal renewal: every budding block consumes the exact material sample,
  // so no JDT/JustDyna route can create first discovery. Unknown/creative and
  // terminal families remain contained below.
  var buddingProof = {
    aluminum: 'modern_industrialization:aluminum_ingot', amethyst: 'minecraft:amethyst_shard',
    ancient_debris: 'minecraft:ancient_debris', certus: 'ae2:certus_quartz_crystal',
    coal: 'minecraft:coal', copper: 'tfc:metal/ingot/copper', diamond: 'minecraft:diamond',
    emerald: 'minecraft:emerald', gold: 'minecraft:gold_ingot', iron: 'tfc:metal/ingot/wrought_iron',
    lapis: 'minecraft:lapis_lazuli', lead: 'modern_industrialization:lead_ingot',
    monazite: 'modern_industrialization:monazite_dust', nickel: 'modern_industrialization:nickel_ingot',
    osmium: 'mekanism:ingot_osmium', platinum: 'modern_industrialization:platinum_ingot',
    quartz: 'minecraft:quartz', redstone: 'minecraft:redstone', silver: 'modern_industrialization:silver_ingot',
    tin: 'modern_industrialization:tin_ingot', tungsten: 'modern_industrialization:tungsten_ingot',
    uraninite: 'mekanism:yellow_cake_uranium', uranium: 'modern_industrialization:uranium_dust',
    zinc: 'tfc:metal/ingot/zinc', time: 'justdirethings:time_crystal'
  }
  Object.keys(buddingProof).forEach(material => replace(`justdynathings:echoing_budding_${material}`, () => event.shaped(`justdynathings:echoing_budding_${material}`, [
    'CSC',
    'BMB',
    'CGC'
  ], {
    C: 'justdirethings:celestigem',
    S: buddingProof[material],
    B: 'oritech:raw_biopolymer',
    M: 'ae2:charger',
    G: 'justdirethings:gooblock_tier3'
  })).id(id(`renewal/crystal/${material}`)))
  ;[
    'allthemodium', 'black_quartz', 'entro', 'phasorite', 'ruby', 'sapphire',
    'topaz', 'unobtainium', 'vibranium'
  ].forEach(material => removalFilters.push({ output: `justdynathings:echoing_budding_${material}` }))
  ;['justdynathings:creative_goo', 'oritech:low_yield_nuke', 'oritech:nuke'].forEach(output => removalFilters.push({ output: output }))

  // Cross-dimensional Oritech Things is post-accelerator and requires fixed
  // endpoint proof. Tiered addons inherit their prior tier and machine core.
  replace('oritechthings:addon_block_cross_dimensional', () => event.shaped('oritechthings:addon_block_cross_dimensional', [
    'UQU',
    'SCS',
    'UQU'
  ], {
    U: 'gtceu:uhv_field_generator',
    Q: 'ae2:quantum_link',
    S: 'sgjourney:stargate_variant_crystal',
    C: 'oritech:still_strange_matter_bucket'
  })).id(id('age_15/oritech/cross_dimensional_addon'))

  var addonFamilies = ['acceptor', 'capacitor', 'efficiency', 'efficient_speed', 'processing', 'speed']
  var addonProofs = [
    'oritech:energite_ingot', 'justdirethings:celestigem', 'oritech:duratium_ingot',
    'modern_industrialization:nuclear_alloy_plate', 'oritech:adamant_ingot',
    'oritech:still_strange_matter_bucket', 'avaritia:infinity_ingot', 'gtceu:opv_field_generator'
  ]
  addonFamilies.forEach(family => {
    for (var tier = 2; tier <= 9; tier++) {
      var output = `oritechthings:addon_block_${family}_tier_${tier}`
      var previous = tier === 2
        ? (family === 'acceptor' ? 'oritech:machine_acceptor_addon' : `oritech:machine_${family === 'efficient_speed' ? 'speed' : family}_addon`)
        : `oritechthings:addon_block_${family}_tier_${tier - 1}`
      replace(output, () => event.shaped(output, [
        'PDP',
        'ACA',
        'PDP'
      ], {
        P: previous,
        D: addonProofs[tier - 2],
        A: 'electroenergetics:converter',
        C: `oritech:machine_core_${Math.min(7, Math.max(2, tier - 1))}`
      })).id(id(`addons/${family}/tier_${tier}`))
    }
  })

  removalFilters.forEach(filter => {
    if (filter.output) filter.not = { id: retainedMaterialRecipeIds }
  })
  event.remove(removalFilters)
})
})()
