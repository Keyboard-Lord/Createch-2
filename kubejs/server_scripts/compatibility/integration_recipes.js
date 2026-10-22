// priority: 2000
// Createch 2 v0.7.3a — new-mod integration and TFC compatibility.
// Uses only installed native items. No JAR content is modified.

ServerEvents.recipes(event => {
  var shaped = (output, pattern, key, id) => event.shaped(output, pattern, key).id(id)
  var removeOutputs = outputs => event.remove(outputs.map(output => ({ output: output })))

  // The retained compatibility variant must consume the canonical bronze supply.
  event.replaceInput({ id: 'mekanism:control_circuit/ultimate' },
    { match: 'mekanism:ingot_bronze', exact: true }, '#c:ingots/bronze')

  // Advanced Finders: late surveyed prospecting, never early ore radar.
  removeOutputs([
    'adfinders:mineral_finder',
    'adfinders:metal_finder',
    'adfinders:gem_finder'
  ])

  shaped('adfinders:mineral_finder', [
    'QEQ',
    'DCD',
    'PMP'
  ], {
    Q: 'ae2:quartz_glass',
    E: 'modern_industrialization:electronic_circuit',
    D: 'electroenergetics:converter',
    C: 'minecraft:compass',
    P: 'modern_industrialization:aluminum_plate',
    M: '#c:tools/propick'
  }, 'adfinders:mineral_finder')

  shaped('adfinders:metal_finder', [
    'SAS',
    'DCD',
    'PMP'
  ], {
    S: 'modern_industrialization:stainless_steel_plate',
    A: 'ae2:calculation_processor',
    D: 'electroenergetics:transformer_core',
    C: 'minecraft:compass',
    P: 'modern_industrialization:digital_circuit',
    M: 'adfinders:mineral_finder'
  }, 'adfinders:metal_finder')

  shaped('adfinders:gem_finder', [
    'IQI',
    'EFE',
    'CMC'
  ], {
    I: 'modern_industrialization:iridium_plate',
    Q: 'modern_industrialization:quantum_circuit',
    E: 'ae2:engineering_processor',
    F: 'shield_generators:shield_generator',
    C: 'eternal_starlight:crystalborn_catalyst',
    M: 'adfinders:metal_finder'
  }, 'adfinders:gem_finder')

  // Advanced Chimneys: masonry exhaust, refinery ducting, then powered extraction.
  removeOutputs([
    'adchimneys:cobblestone_chimney',
    'adchimneys:stone_chimney',
    'adchimneys:small_brick_chimney',
    'adchimneys:large_brick_chimney',
    'adchimneys:glass_chimney',
    'adchimneys:metal_chimney',
    'adchimneys:pipe',
    'adchimneys:stone_vent',
    'adchimneys:metal_vent',
    'adchimneys:stone_pump',
    'adchimneys:metal_pump'
  ])

  shaped(Item.of('adchimneys:cobblestone_chimney', 4), ['SMS', 'S S', 'SMS'], {
    S: '#c:cobblestones',
    M: 'tfc:mortar'
  }, 'adchimneys:cobblestone_chimney')
  shaped(Item.of('adchimneys:stone_chimney', 4), ['SMS', 'S S', 'SMS'], {
    S: '#c:stones',
    M: 'tfc:mortar'
  }, 'adchimneys:stone_chimney')
  shaped(Item.of('adchimneys:small_brick_chimney', 4), ['BMB', 'B B', 'BMB'], {
    B: '#c:bricks',
    M: 'tfc:mortar'
  }, 'adchimneys:small_brick_chimney')
  shaped(Item.of('adchimneys:large_brick_chimney', 4), ['FBF', 'M M', 'FBF'], {
    F: 'tfc:ceramic/fire_brick',
    B: '#c:plates/bronze',
    M: 'tfc:mortar'
  }, 'adchimneys:large_brick_chimney')
  shaped(Item.of('adchimneys:glass_chimney', 4), ['BGB', 'G G', 'BGB'], {
    B: '#c:plates/bronze',
    G: '#c:glass_blocks'
  }, 'adchimneys:glass_chimney')

  shaped(Item.of('adchimneys:metal_chimney', 4), ['HPH', 'P P', 'HPH'], {
    H: 'tfmg:heavy_plate',
    P: 'tfmg:steel_pipe'
  }, 'adchimneys:metal_chimney')
  shaped(Item.of('adchimneys:pipe', 8), ['SSS', 'P P', 'SSS'], {
    S: 'tfmg:cast_iron_sheet',
    P: 'create:fluid_pipe'
  }, 'adchimneys:pipe')
  shaped(Item.of('adchimneys:stone_vent', 2), ['BFB', 'PCP', 'BFB'], {
    B: '#c:plates/bronze',
    F: 'create:propeller',
    P: 'adchimneys:pipe',
    C: 'adchimneys:stone_chimney'
  }, 'adchimneys:stone_vent')
  shaped(Item.of('adchimneys:metal_vent', 2), ['HFG', 'PCP', 'HFG'], {
    H: 'tfmg:heavy_plate',
    F: 'create:propeller',
    G: 'tfmg:steel_mechanism',
    P: 'adchimneys:pipe',
    C: 'adchimneys:metal_chimney'
  }, 'adchimneys:metal_vent')
  shaped('adchimneys:stone_pump', ['AFA', 'MCM', 'ADA'], {
    A: 'modern_industrialization:analog_circuit',
    F: 'create:propeller',
    M: 'electroenergetics:white_electric_motor',
    C: 'adchimneys:stone_vent',
    D: 'electroenergetics:converter'
  }, 'adchimneys:stone_pump')
  shaped('adchimneys:metal_pump', ['SFS', 'MCM', 'SDS'], {
    S: 'tfmg:steel_casing',
    F: 'create:propeller',
    M: 'electroenergetics:white_electric_motor',
    C: 'adchimneys:metal_vent',
    D: 'electroenergetics:converter'
  }, 'adchimneys:metal_pump')

  // Dyson Cube Project: native-only Age 15–16 stellar infrastructure.
  ;[
    'dysoncubeproject:beam',
    'dysoncubeproject:beam_package',
    'dysoncubeproject:solar_sail',
    'dysoncubeproject:solar_sail_package',
    'dysoncubeproject:em_railejector_controller',
    'dysoncubeproject:ray_receiver_controller'
  ].forEach(id => event.remove({ id: id }))

  event.custom({
    type: 'modern_industrialization:assembler',
    eu: 512,
    duration: 2400,
    item_inputs: [
      { item: 'modern_industrialization:titanium_large_plate', amount: 2 },
      { item: 'modern_industrialization:iridium_plate', amount: 2 },
      { item: 'modern_industrialization:superconductor_wire', amount: 8 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 2 },
      { item: 'rocketnautics:titanium_casing', amount: 2 },
      { item: 'mekanism:ultimate_control_circuit', amount: 2 },
      { item: 'ae2:engineering_processor', amount: 4 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:soldering_alloy',
      amount: 576
    },
    item_outputs: [
      { item: 'dysoncubeproject:beam_package', amount: 1 }
    ]
  }).id('createch2:dyson/beam_core')

  event.custom({
    type: 'create:sequenced_assembly',
    ingredient: { item: 'dysoncubeproject:beam_package' },
    transitional_item: { id: 'dysoncubeproject:beam_package' },
    loops: 1,
    sequence: [
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'create:precision_mechanism' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'modern_industrialization:iridium_plate' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:filling',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { type: 'neoforge:single', amount: 144, fluid: 'modern_industrialization:soldering_alloy' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'greate:pressing',
        recipe_tier: 8,
        ingredients: [{ item: 'dysoncubeproject:beam_package' }],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      }
    ],
    results: [{ id: 'dysoncubeproject:beam', count: 2 }]
  }).id('dysoncubeproject:beam')

  event.custom({
    type: 'modern_industrialization:assembler',
    eu: 512,
    duration: 2400,
    item_inputs: [
      { item: 'ae2:quartz_glass', amount: 4 },
      { item: 'ae2:quartz_fiber', amount: 8 },
      { item: 'modern_industrialization:superconductor_wire', amount: 8 },
      { item: 'modern_industrialization:iridium_plate', amount: 2 },
      { item: 'eternal_starlight:aethersent_ingot', amount: 2 },
      { item: 'create:precision_mechanism', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:soldering_alloy',
      amount: 288
    },
    item_outputs: [
      { item: 'dysoncubeproject:solar_sail_package', amount: 1 }
    ]
  }).id('createch2:dyson/solar_sail_laminate')

  event.custom({
    type: 'create:sequenced_assembly',
    ingredient: { item: 'dysoncubeproject:solar_sail_package' },
    transitional_item: { id: 'dysoncubeproject:solar_sail_package' },
    loops: 1,
    sequence: [
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:solar_sail_package' },
          { item: 'ae2:quartz_fiber' }
        ],
        results: [{ id: 'dysoncubeproject:solar_sail_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:solar_sail_package' },
          { item: 'eternal_starlight:aethersent_ingot' }
        ],
        results: [{ id: 'dysoncubeproject:solar_sail_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:solar_sail_package' },
          { item: 'create:precision_mechanism' }
        ],
        results: [{ id: 'dysoncubeproject:solar_sail_package' }]
      },
      {
        type: 'greate:pressing',
        recipe_tier: 8,
        ingredients: [{ item: 'dysoncubeproject:solar_sail_package' }],
        results: [{ id: 'dysoncubeproject:solar_sail_package' }]
      }
    ],
    results: [{ id: 'dysoncubeproject:solar_sail' }]
  }).id('dysoncubeproject:solar_sail')

  event.custom({
    type: 'create:sequenced_assembly',
    ingredient: { item: 'dysoncubeproject:beam_package' },
    transitional_item: { id: 'dysoncubeproject:beam_package' },
    loops: 1,
    sequence: [
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'dysoncubeproject:solar_sail_package' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'ae2:quantum_link' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'modern_industrialization:fusion_reactor' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'sgjourney:milky_way_stargate' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'modern_industrialization:superconductor_coil' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'modern_industrialization:quantum_circuit' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'oritech:accelerator_controller' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'eternal_starlight:starcore' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { item: 'electroenergetics:sulfur_hexafluoride_breaker' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'create:filling',
        ingredients: [
          { item: 'dysoncubeproject:beam_package' },
          { type: 'neoforge:single', amount: 1000, fluid: 'modern_industrialization:cryofluid' }
        ],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      },
      {
        type: 'greate:pressing',
        recipe_tier: 9,
        ingredients: [{ item: 'dysoncubeproject:beam_package' }],
        results: [{ id: 'dysoncubeproject:beam_package' }]
      }
    ],
    results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
  }).id('dysoncubeproject:em_railejector_controller')

  event.custom({
    type: 'create:sequenced_assembly',
    ingredient: { item: 'dysoncubeproject:em_railejector_controller' },
    transitional_item: { id: 'dysoncubeproject:em_railejector_controller' },
    loops: 1,
    sequence: [
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { item: 'dysoncubeproject:beam_package' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { item: 'dysoncubeproject:solar_sail_package' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { item: 'avaritia:crystal_matrix' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { item: 'oritech:particle_collector_block' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { item: 'sgjourney:stargate_variant_crystal' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { item: 'ae2:quantum_link' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { item: 'gtceu:zpm_sensor' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'create:deploying',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { item: 'modern_industrialization:quantum_circuit' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'create:filling',
        ingredients: [
          { item: 'dysoncubeproject:em_railejector_controller' },
          { type: 'neoforge:single', amount: 1000, fluid: 'modern_industrialization:uu_matter' }
        ],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      },
      {
        type: 'greate:pressing',
        recipe_tier: 9,
        ingredients: [{ item: 'dysoncubeproject:em_railejector_controller' }],
        results: [{ id: 'dysoncubeproject:em_railejector_controller' }]
      }
    ],
    results: [{ id: 'dysoncubeproject:ray_receiver_controller' }]
  }).id('dysoncubeproject:ray_receiver_controller')

  // Colossal Chests: bounded Age 5+ physical warehousing.
  ;[
    'colossalchests:chest_wall_wood',
    'colossalchests:chest_wall_copper',
    'colossalchests:chest_wall_iron',
    'colossalchests:chest_wall_silver',
    'colossalchests:chest_wall_gold',
    'colossalchests:chest_wall_diamond',
    'colossalchests:chest_wall_obsidian',
    'colossalchests:colossal_chest_wood',
    'colossalchests:colossal_chest_copper',
    'colossalchests:colossal_chest_iron',
    'colossalchests:colossal_chest_silver',
    'colossalchests:colossal_chest_gold',
    'colossalchests:colossal_chest_diamond',
    'colossalchests:colossal_chest_obsidian',
    'colossalchests:interface_wood',
    'colossalchests:interface_copper',
    'colossalchests:interface_iron',
    'colossalchests:interface_silver',
    'colossalchests:interface_gold',
    'colossalchests:interface_diamond',
    'colossalchests:interface_obsidian',
    'colossalchests:uncolossal_chest',
    'colossalchests:upgrade_tool',
    'colossalchests:upgrade_tool_2',
    'colossalchests:upgrade_tool_reverse'
  ].forEach(id => event.remove({ id: id }))

  shaped(Item.of('colossalchests:chest_wall_wood', 4), ['LPL', 'PCP', 'LPL'], {
    L: '#tfc:lumber',
    P: 'modern_industrialization:steel_plate',
    C: '#createch2:wooden_storage_chests'
  }, 'colossalchests:chest_wall_wood')

  var wallTiers = [
    ['copper', 'wood', '#c:sheets/copper', 'modern_industrialization:steel_plate'],
    ['iron', 'copper', '#c:sheets/wrought_iron', 'modern_industrialization:steel_plate'],
    ['silver', 'iron', '#c:sheets/silver', 'modern_industrialization:aluminum_plate'],
    ['gold', 'silver', '#c:sheets/gold', 'modern_industrialization:aluminum_plate'],
    ['diamond', 'gold', '#c:gems/diamond', 'modern_industrialization:stainless_steel_plate'],
    ['obsidian', 'diamond', 'minecraft:obsidian', 'modern_industrialization:titanium_plate']
  ]

  wallTiers.forEach(([tier, previous, material, plate]) => {
    shaped(Item.of(`colossalchests:chest_wall_${tier}`, 4), ['MPM', 'PWP', 'MPM'], {
      M: material,
      P: plate,
      W: `colossalchests:chest_wall_${previous}`
    }, `colossalchests:chest_wall_${tier}`)
  })

  var controlTiers = [
    ['wood', 'modern_industrialization:steel_plate', 'modern_industrialization:analog_circuit'],
    ['copper', 'modern_industrialization:steel_plate', 'modern_industrialization:analog_circuit'],
    ['iron', 'modern_industrialization:steel_plate', 'modern_industrialization:analog_circuit'],
    ['silver', 'modern_industrialization:aluminum_plate', 'modern_industrialization:electronic_circuit'],
    ['gold', 'modern_industrialization:aluminum_plate', 'modern_industrialization:electronic_circuit'],
    ['diamond', 'modern_industrialization:stainless_steel_plate', 'modern_industrialization:digital_circuit'],
    ['obsidian', 'modern_industrialization:titanium_plate', 'modern_industrialization:digital_circuit']
  ]

  controlTiers.forEach(([tier, plate, circuit]) => {
    shaped(`colossalchests:colossal_chest_${tier}`, ['PMP', 'CWC', 'PMP'], {
      P: plate,
      M: 'create:precision_mechanism',
      C: circuit,
      W: `colossalchests:chest_wall_${tier}`
    }, `colossalchests:colossal_chest_${tier}`)

    shaped(Item.of(`colossalchests:interface_${tier}`, 2), ['PFP', 'CWC', 'PFP'], {
      P: plate,
      F: 'create:brass_funnel',
      C: 'create:smart_chute',
      W: `colossalchests:chest_wall_${tier}`
    }, `colossalchests:interface_${tier}`)
  })

  shaped('colossalchests:uncolossal_chest', ['LPL', 'PCP', 'LPL'], {
    L: '#tfc:lumber',
    P: 'modern_industrialization:bronze_plate',
    C: '#createch2:wooden_storage_chests'
  }, 'colossalchests:uncolossal_chest')

  shaped('colossalchests:upgrade_tool', [' R ', 'RPR', ' R '], {
    R: '#c:rods/steel',
    P: 'create:precision_mechanism'
  }, 'colossalchests:upgrade_tool')
  event.shapeless('colossalchests:upgrade_tool_reverse', [
    'colossalchests:upgrade_tool'
  ]).id('colossalchests:upgrade_tool_reverse')
  event.shapeless('colossalchests:upgrade_tool', [
    'colossalchests:upgrade_tool_reverse'
  ]).id('colossalchests:upgrade_tool_2')

  // Create Aeronautics Toolgun: survival engineering and recovery only. The
  // creative tools stay hidden; structure transport is reserved for quantum age.
  removeOutputs([
    'create_aeronautics_toolgun:magnetic_gun',
    'create_aeronautics_toolgun:survival_structure_tool',
    'create_aeronautics_toolgun:portable_structure_container'
  ])

  shaped('create_aeronautics_toolgun:magnetic_gun', [
    'SES',
    'BQB',
    'PDP'
  ], {
    S: 'modern_industrialization:stainless_steel_plate',
    E: 'modern_industrialization:electronic_circuit',
    B: 'create:brass_block',
    Q: 'create:rose_quartz',
    P: 'create:precision_mechanism',
    D: 'electroenergetics:converter'
  }, 'create_aeronautics_toolgun:magnetic_gun')

  shaped('create_aeronautics_toolgun:survival_structure_tool', [
    ' E ',
    'DMP',
    ' E '
  ], {
    E: 'ae2:engineering_processor',
    D: 'modern_industrialization:digital_circuit',
    M: 'create_aeronautics_toolgun:magnetic_gun',
    P: 'create:precision_mechanism'
  }, 'create_aeronautics_toolgun:survival_structure_tool')

  shaped('create_aeronautics_toolgun:portable_structure_container', [
    'ISI',
    'SNS',
    'IQI'
  ], {
    I: 'modern_industrialization:iridium_plate',
    S: 'ae2:spatial_pylon',
    N: 'minecraft:nether_star',
    Q: 'modern_industrialization:quantum_circuit'
  }, 'create_aeronautics_toolgun:portable_structure_container')
})
