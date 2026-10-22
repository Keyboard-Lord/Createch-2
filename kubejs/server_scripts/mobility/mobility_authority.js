// priority: 1400
// Createch 2 0.8.0 mobility authority.
//
// Body control is innate and risky (Fall Physics). Its existing parachute is
// the first engineered recovery tool; the reserve follows at MEC-02. Powered
// Aeronautics and freight rail retain their infrastructure roles. Portal and
// Telepad transport remain quantum-era.
ServerEvents.recipes(event => {
  const removeIds = [
    'fallphysics:parachute',
    'fallphysics:reserve_parachute',
    'fallphysics:parachute_repack',
    'fallphysics:flare_red',
    'fallphysics:flare_green',
    'fallphysics:flare_blue',
    'fallphysics:flare_white',
    'aperture_innovations:portal_gun',
    'aperture_innovations:portal_gun_atlas',
    'aperture_innovations:portal_gun_pbody',
    'aperture_innovations:portal_gun_reloaded',
    'aperture_innovations:gun_coloring',
    'aperture_innovations:long_fall_boots',
    'hologenica:bioscanner',
    'hologenica:hologram',
    'hologenica:imprinter',
    'hologenica:neurocell',
    'hologenica:neurolink',
    'hologenica:reformer',
    'hologenica:telepad'
  ]
  removeIds.forEach(recipeId => event.remove({ id: recipeId }))

  // MEC-01: migrate the retired Core glider role to Fall Physics' native item.
  // The recipe ids stay stable so existing Research'd unlock state survives.
  event.shaped('fallphysics:parachute', [
    'CCC',
    'LWL',
    'SBS'
  ], {
    C: '#tfc:high_quality_cloth',
    L: 'minecraft:leather',
    W: '#tfc:lumber',
    S: '#c:strings',
    B: '#c:sheets/bronze'
  }).id('createch2:mobility/field_glider')

  event.shapeless('fallphysics:parachute', [
    'fallphysics:parachute',
    '#tfc:high_quality_cloth',
    'minecraft:leather'
  ]).id('createch2:mobility/field_glider_repair')

  // MEC-02 recovery equipment: the reserve complements the early parachute.
  event.shaped('fallphysics:reserve_parachute', [
    'CC',
    'SL'
  ], {
    C: '#tfc:high_quality_cloth',
    S: '#c:strings',
    L: 'minecraft:leather'
  }).id('createch2:mobility/fallphysics/reserve_parachute')

  const flareDyes = {
    red: 'minecraft:red_dye',
    green: 'minecraft:green_dye',
    blue: 'minecraft:blue_dye',
    white: 'minecraft:white_dye'
  }
  Object.keys(flareDyes).forEach(color => {
    event.shapeless(Item.of(`fallphysics:flare_${color}`, 2), [
      'minecraft:paper',
      'minecraft:gunpowder',
      flareDyes[color]
    ]).id(`createch2:mobility/fallphysics/flare_${color}`)
  })

  // Powered impact protection belongs to the industrial electrical tier.
  event.shaped('aperture_innovations:long_fall_boots', [
    'PBP',
    'RMR',
    'S S'
  ], {
    P: 'modern_industrialization:steel_plate',
    B: 'electroenergetics:accumulator',
    R: 'modern_industrialization:rubber_sheet',
    M: 'create:precision_mechanism',
    S: 'minecraft:netherite_scrap'
  }).id('createch2:mobility/aperture/long_fall_boots')

  // Networked-control display/sensing layer.
  event.shaped(Item.of('hologenica:neurolink', 8), [
    'WCW',
    'CRC',
    'WCW'
  ], {
    W: 'modern_industrialization:copper_wire',
    C: 'minecraft:copper_ingot',
    R: 'modern_industrialization:analog_circuit'
  }).id('createch2:mobility/hologenica/neurolink')

  event.shaped('hologenica:bioscanner', [
    'NGN',
    'AMA',
    'NCN'
  ], {
    N: 'hologenica:neurolink',
    G: 'minecraft:spyglass',
    A: 'modern_industrialization:analog_circuit',
    M: 'electroenergetics:clamp_meter',
    C: 'minecraft:copper_ingot'
  }).id('createch2:mobility/hologenica/bioscanner')

  event.shaped('hologenica:hologram', [
    'GTG',
    'NLN',
    'CRC'
  ], {
    G: 'minecraft:glass_pane',
    T: 'minecraft:tinted_glass',
    N: 'hologenica:neurolink',
    L: 'electroenergetics:bulb',
    C: 'minecraft:copper_ingot',
    R: 'modern_industrialization:analog_circuit'
  }).id('createch2:mobility/hologenica/hologram')

  // Distributed computation owns player-imprint/reform machinery. Hologenica
  // 1.0.2's entity surface is a player clone, not a general mob duplicator.
  event.shaped('hologenica:imprinter', [
    'NBN',
    'CAC',
    'NPN'
  ], {
    N: 'hologenica:neurolink',
    B: 'hologenica:bioscanner',
    C: 'modern_industrialization:electronic_circuit',
    A: 'mekanism:advanced_control_circuit',
    P: 'minecraft:piston'
  }).id('createch2:mobility/hologenica/imprinter')

  event.shaped('hologenica:reformer', [
    'NBN',
    'TAT',
    'IDI'
  ], {
    N: 'hologenica:neurolink',
    B: 'hologenica:bioscanner',
    T: 'mekanism:basic_chemical_tank',
    A: 'mekanism:advanced_control_circuit',
    I: 'modern_industrialization:steel_plate',
    D: 'minecraft:diamond'
  }).id('createch2:mobility/hologenica/reformer')

  event.shaped('hologenica:neurocell', [
    'GNG',
    'URU',
    'SCS'
  ], {
    G: 'minecraft:tinted_glass',
    N: 'hologenica:neurolink',
    U: 'mekanism:ultimate_control_circuit',
    R: 'hologenica:reformer',
    S: 'modern_industrialization:steel_plate',
    C: 'mekanism:basic_chemical_tank'
  }).id('createch2:mobility/hologenica/neurocell')

  // Quantum-era local portal transport. The Stargate crystal makes these
  // derivative tools explicitly downstream of dimensional mastery.
  event.shaped('aperture_innovations:portal_gun', [
    'QIQ',
    'ETE',
    'CVC'
  ], {
    Q: 'ae2:quantum_link',
    I: 'modern_industrialization:electronic_circuit',
    E: 'minecraft:ender_eye',
    T: 'mekanism:teleportation_core',
    C: 'modern_industrialization:quantum_circuit_board',
    V: 'sgjourney:stargate_variant_crystal'
  }).id('createch2:mobility/aperture/portal_gun')

  const portalVariants = {
    atlas: 'minecraft:blue_dye',
    pbody: 'minecraft:orange_dye',
    reloaded: 'minecraft:lime_dye'
  }
  Object.keys(portalVariants).forEach(variant => {
    event.custom({
      type: 'minecraft:crafting_shapeless',
      ingredients: [
        { item: 'aperture_innovations:portal_gun' },
        { item: portalVariants[variant] }
      ],
      result: {
        id: 'aperture_innovations:portal_gun',
        count: 1,
        components: {
          'aperture_innovations:portal_gun_variant': `aperture_innovations:${variant}`
        }
      }
    }).id(`createch2:mobility/aperture/portal_gun_${variant}`)
  })

  event.shaped('hologenica:telepad', [
    'Q N',
    'THT',
    'QVQ'
  ], {
    Q: 'ae2:quantum_ring',
    N: 'hologenica:neurocell',
    T: 'mekanism:teleportation_core',
    H: 'hologenica:hologram',
    V: 'sgjourney:stargate_variant_crystal'
  }).id('createch2:mobility/hologenica/telepad')
})
