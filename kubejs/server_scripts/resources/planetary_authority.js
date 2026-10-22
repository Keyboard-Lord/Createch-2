// priority: 500
;(function () {
// Createch 2 0.7.3a planetary geology, migration, and apiary authority.
// Resource conversions in this file are replacements for explicitly classified
// native routes. The actual destination-processed material is the bee-conversion
// handoff; visitation and extraction remain recorded by advancements.

ServerEvents.recipes(event => {
  var authorityId = name => `createch2:planetary_apiary/${name}`

  var planetaryBee = (planet, resource, parent, result, processedSample) => {
    event.custom({
      'neoforge:conditions': [
        {
          type: 'productivebees:bee_exists',
          bee: parent
        },
        {
          type: 'productivebees:bee_exists',
          bee: result
        }
      ],
      type: 'productivebees:bee_conversion',
      source: parent,
      result: result,
      item: { item: processedSample }
    }).id(authorityId(`${planet}/${resource}`))
  }

  ;[
    ['monazite', 'productivebees:frosty', 'productivebees:monazite', 'modern_industrialization:monazite_crushed_dust'],
    ['platinum', 'productivebees:ender', 'productivebees:platinum', 'modern_industrialization:platinum_plate'],
    ['osmium', 'productivebees:ender', 'productivebees:osmium', 'chemlib:osmium_plate'],
    ['zirconium', 'productivebees:frosty', 'productivebees:zirconium', 'chemlib:zirconium_plate']
  ].forEach(route => {
    planetaryBee('moon', route[0], route[1], route[2], route[3])
  })

  ;[
    ['bauxite', 'productivebees:bauxite', 'modern_industrialization:bauxite_crushed_dust'],
    ['aluminum', 'productivebees:aluminum', 'modern_industrialization:aluminum_plate'],
    ['titanium', 'productivebees:titanium', 'modern_industrialization:titanium_plate'],
    ['lithium', 'productivebees:lithium', 'chemlib:lithium_dust']
  ].forEach(route => {
    planetaryBee('mars', route[0], 'productivebees:ashy_mining_bee', route[1], route[2])
  })

  ;[
    ['tungsten', 'productivebees:tungsten', 'modern_industrialization:tungsten_plate'],
    ['uranium', 'productivebees:radioactive', 'modern_industrialization:uranium_fuel_rod'],
    ['iridium', 'productivebees:iridium', 'modern_industrialization:iridium_plate']
  ].forEach(route => {
    planetaryBee('mercury', route[0], 'productivebees:magmatic', route[1], route[2])
  })

  ;[
    ['antimony', 'productivebees:antimony', 'modern_industrialization:antimony_dust'],
    ['magnesium', 'productivebees:magnesium', 'chemlib:magnesium_plate'],
    ['sulfur', 'productivebees:sulfur', 'tfmg:sulfur_dust']
  ].forEach(route => {
    planetaryBee('venus', route[0], 'productivebees:magmatic', route[1], route[2])
  })

  // Forever-world recovery never modifies a generated chunk. A
  // destination-native anchor, hauled host material, prospecting tool,
  // factory control, environmental hardware, acid, and sustained power recover
  // one poor-grade feedstock. Physical new-chunk deposits remain much faster.
  var legacyRecovery = (destination, resource, anchor, host, environment, output, eu) => {
    event.custom({
      type: 'modern_industrialization:assembler',
      eu: eu,
      duration: 7200,
      item_inputs: [
        { item: anchor, amount: 1, probability: 0 },
        { item: 'minecraft:spyglass', amount: 1, probability: 0 },
        { item: 'modern_industrialization:processing_unit', amount: 1, probability: 0 },
        { item: environment, amount: 1, probability: 0 },
        { item: host, amount: 64 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:sulfuric_acid', amount: 4000 }
      ],
      item_outputs: [
        { item: output, amount: 1 }
      ]
    }).id(`createch2:planetary_legacy_recovery/${destination}/${resource}`)
  }

  ;[
    ['monazite', 'tfc_metallurgy:ore/poor_monazite/basalt'],
    ['platinum', 'tfc_metallurgy:ore/poor_native_platinum/basalt'],
    ['osmium', 'tfc_metallurgy:ore/poor_native_osmium/basalt'],
    ['zircon', 'tfc_metallurgy:ore/poor_zircon/basalt']
  ].forEach(route => legacyRecovery(
    'moon', route[0], 'stellaris:desh_ingot',
    'rocketnautics:lunar_regolith', 'stellaris:oxygen_distributor', route[1], 256
  ))
  ;[
    ['bauxite', 'tfc_metallurgy:ore/poor_bauxite/basalt'],
    ['rutile', 'tfc_metallurgy:ore/poor_rutile/basalt'],
    ['spodumene', 'tfc_metallurgy:ore/poor_spodumene/basalt'],
    ['zircon', 'tfc_metallurgy:ore/poor_zircon/basalt']
  ].forEach(route => legacyRecovery(
    'mars', route[0], 'stellaris:tharsite_ingot',
    'stellaris:mars_stone', 'stellaris:vacuumator', route[1], 256
  ))
  ;[
    ['wolframite', 'tfc_metallurgy:ore/poor_wolframite/basalt'],
    ['uraninite', 'tfc_metallurgy:ore/poor_uraninite/basalt'],
    ['osmium', 'tfc_metallurgy:ore/poor_native_osmium/basalt'],
    ['iridium', 'tfc_metallurgy:ore/poor_native_iridium/basalt']
  ].forEach(route => legacyRecovery(
    'mercury', route[0], 'stellaris:solerium',
    'stellaris:mercury_stone', 'mekanism:module_radiation_shielding_unit', route[1], 512
  ))
  ;[
    ['stibnite', 'tfc_metallurgy:ore/poor_stibnite/basalt'],
    ['magnesite', 'tfc_metallurgy:ore/poor_magnesite/basalt'],
    ['sulfur', 'tfc:ore/sulfur/basalt']
  ].forEach(route => legacyRecovery(
    'venus', route[0], 'stellaris:corronium_ingot',
    'stellaris:venus_stone', 'mekanism:advanced_chemical_tank', route[1], 512
  ))
  ;[
    ['bertrandite', 'tfc_metallurgy:ore/poor_bertrandite/basalt'],
    ['certus_quartz', 'tfc_metallurgy:ore/certus_quartz/basalt']
  ].forEach(route => legacyRecovery(
    'end', route[0], 'ae2:engineering_processor',
    'minecraft:end_stone', 'ae2:quantum_ring', route[1], 512
  ))
  ;[
    ['sg_unitas', 'galena', 'minecraft:stone', 'tfc_metallurgy:ore/poor_galena/granite'],
    ['sg_unitas', 'garnierite', 'minecraft:stone', 'tfc:ore/poor_garnierite/granite'],
    ['sg_rima', 'uraninite', 'minecraft:stone', 'tfc_metallurgy:ore/poor_uraninite/granite'],
    ['sg_rima', 'zircon', 'minecraft:stone', 'tfc_metallurgy:ore/poor_zircon/granite'],
    ['sg_cavum', 'platinum', 'minecraft:deepslate', 'tfc_metallurgy:ore/poor_native_platinum/granite'],
    ['sg_cavum', 'osmium', 'minecraft:deepslate', 'tfc_metallurgy:ore/poor_native_osmium/granite'],
    ['sg_cavum', 'iridium', 'minecraft:deepslate', 'tfc_metallurgy:ore/poor_native_iridium/granite'],
    ['sg_lantea', 'certus_quartz', 'minecraft:stone', 'tfc_metallurgy:ore/certus_quartz/basalt']
  ].forEach(route => legacyRecovery(
    route[0], route[1], 'sgjourney:crystal_base',
    route[2], 'sgjourney:advanced_control_crystal', route[3], 2048
  ))
  legacyRecovery(
    'sg_abydos', 'naquadah', 'sgjourney:crystal_base',
    'minecraft:sandstone', 'sgjourney:advanced_control_crystal', 'sgjourney:raw_naquadah', 2048
  )
  // The primary Jovian route consumes feedstock that can only be collected at a
  // local Jupiter station by createch2_runtime.js. Separation is power-hungry
  // but produces fusion gases at mature throughput.
  event.custom({
    type: 'modern_industrialization:chemical_reactor',
    eu: 2048,
    duration: 2400,
    item_inputs: [
      { item: 'stellaris:hydrogen_bucket', amount: 1 },
      { item: 'minecraft:knowledge_book', amount: 1 },
      { item: 'modern_industrialization:quantum_circuit', amount: 1, probability: 0 }
    ],
    fluid_outputs: [
      { fluid: 'modern_industrialization:hydrogen', amount: 12000 },
      { fluid: 'modern_industrialization:helium', amount: 4000 },
      { fluid: 'modern_industrialization:deuterium', amount: 500 }
    ]
  }).id('createch2:planetary_atmospheric_separation')
})
})()
