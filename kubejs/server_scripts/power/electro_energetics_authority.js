// priority: 1200
// Createch 2 0.8.3 electrical constitution.
//
// Create: Electro Energetics is the sole player-facing electrical grid. Its
// native simulation owns voltage/current, loss, faults, metering, switching,
// transformation, alternators, motors, rail electrification and the explicit
// FE converter. KubeJS only authors acquisition/progression and suppresses
// rival compact generation/transmission; it never shadows the simulation.

var CREATECH2_RIVAL_GRID_OUTPUTS = [
  'mekanismgenerators:heat_generator',
  'mekanismgenerators:bio_generator',
  'mekanismgenerators:gas_burning_generator',
  'mekanismgenerators:wind_generator',
  'mekanismgenerators:solar_generator',
  'mekanismgenerators:advanced_solar_generator',
  'productivebees:honey_generator',
  'mekanism:basic_universal_cable',
  'mekanism:advanced_universal_cable',
  'mekanism:elite_universal_cable',
  'mekanism:ultimate_universal_cable',
  'moderndynamics:lv_cable',
  'moderndynamics:mv_cable',
  'moderndynamics:hv_cable',
  'moderndynamics:ev_cable',
  'moderndynamics:superconductor_cable'
]

var CREATECH2_REAUTHORED_ELECTRICAL_OUTPUTS = [
  'electroenergetics:empty_spool',
  'electroenergetics:connector',
  'electroenergetics:copper_wire',
  'electroenergetics:insulated_wire',
  'electroenergetics:wire_spool',
  'electroenergetics:copper_wire_spool',
  'electroenergetics:fuse',
  'electroenergetics:fuse_holder',
  'electroenergetics:voltmeter',
  'electroenergetics:ammeter',
  'electroenergetics:ground_rod',
  'electroenergetics:commutator',
  'electroenergetics:alternator_rotor',
  'electroenergetics:stator',
  'electroenergetics:alternator_brushes',
  'electroenergetics:white_electric_motor',
  'electroenergetics:electric_pump',
  'electroenergetics:converter'
]

ServerEvents.recipes(event => {
  event.remove(CREATECH2_RIVAL_GRID_OUTPUTS.map(output => ({ output: output })))
  const authoredIds = []
  const id = path => {
    const recipeId = `createch2:electrical/${path}`
    authoredIds.push(recipeId)
    return recipeId
  }

  // ELE-01 — conductors, ceramic interfaces, protection and measurement.
  event.shaped(Item.of('electroenergetics:empty_spool', 4), ['S', 'R', 'S'], {
    S: '#minecraft:wooden_slabs',
    R: '#c:rods/wooden'
  }).id(id('wire/empty_spool'))

  event.custom({
    type: 'create:cutting',
    ingredients: [{ tag: 'c:plates/copper' }],
    processing_time: 50,
    results: [{ count: 4, id: 'electroenergetics:copper_wire' }]
  }).id(id('wire/copper_wire'))

  event.shaped(Item.of('electroenergetics:connector', 2), [
    ' C ',
    'ABA',
    ' F '
  ], {
    C: '#c:nuggets/copper',
    A: 'create:andesite_alloy',
    B: '#c:plates/brass',
    F: 'tfc:ceramic/fire_brick'
  }).id(id('distribution/connector'))

  event.shapeless(Item.of('electroenergetics:insulated_wire', 4), [
    'electroenergetics:copper_wire',
    'electroenergetics:copper_wire',
    '#createch2:rubber_sheets'
  ]).id(id('wire/insulated_wire'))

  event.shaped('electroenergetics:wire_spool', [
    ' W ',
    'WSW',
    ' W '
  ], {
    W: 'electroenergetics:insulated_wire',
    S: 'electroenergetics:empty_spool'
  }).id(id('wire/insulated_spool'))

  event.shaped('electroenergetics:copper_wire_spool', [
    ' W ',
    'WSW',
    ' W '
  ], {
    W: 'electroenergetics:copper_wire',
    S: 'electroenergetics:empty_spool'
  }).id(id('wire/bare_spool'))

  event.shaped('electroenergetics:fuse', [
    'AGA',
    'CWC',
    'AGA'
  ], {
    A: 'create:andesite_alloy',
    G: 'minecraft:glass_pane',
    C: 'electroenergetics:connector',
    W: 'electroenergetics:copper_wire'
  }).id(id('protection/fuse'))

  event.shaped('electroenergetics:fuse_holder', [
    'C C',
    'SFS',
    'C C'
  ], {
    C: 'electroenergetics:connector',
    S: '#c:plates/iron',
    F: 'tfc:ceramic/fire_brick'
  }).id(id('protection/fuse_holder'))

  event.shaped('electroenergetics:ground_rod', ['C', 'I', 'I'], {
    C: 'electroenergetics:connector',
    I: '#c:ingots/copper'
  }).id(id('protection/ground_rod'))

  event.shaped('electroenergetics:voltmeter', [' A ', 'CEC'], {
    A: 'modern_industrialization:analog_circuit',
    C: 'electroenergetics:connector',
    E: 'create:andesite_alloy_block'
  }).id(id('measurement/voltmeter'))

  event.shaped('electroenergetics:ammeter', [' A ', 'CEC'], {
    A: 'modern_industrialization:analog_circuit',
    C: 'electroenergetics:connector',
    E: '#c:plates/iron'
  }).id(id('measurement/ammeter'))

  // ELE-02 — mechanical generation and motor conversion. The alternator is
  // the first electrical source and retains visible Create rotation.
  event.shaped('electroenergetics:commutator', ['ASA', 'CSC', 'ASA'], {
    A: 'create:andesite_alloy',
    S: 'create:shaft',
    C: '#c:plates/copper'
  }).id(id('alternator/commutator'))

  event.shaped('electroenergetics:alternator_rotor', ['WAW', 'ASA', 'WAW'], {
    W: 'electroenergetics:copper_wire_spool',
    A: 'create:andesite_alloy',
    S: 'create:shaft'
  }).id(id('alternator/rotor'))

  event.shaped('electroenergetics:stator', ['AS', 'MS', 'AS'], {
    A: 'create:andesite_alloy',
    M: 'electroenergetics:magnet',
    S: '#c:plates/iron'
  }).id(id('alternator/stator'))

  event.shaped('electroenergetics:alternator_brushes', [' C ', 'SMB', ' C '], {
    C: 'electroenergetics:connector',
    S: 'create:shaft',
    M: 'electroenergetics:commutator',
    B: '#c:plates/brass'
  }).id(id('alternator/brushes'))

  event.shaped('electroenergetics:white_electric_motor', ['CWC', 'RMR', 'CWC'], {
    C: 'electroenergetics:connector',
    W: 'electroenergetics:copper_wire_spool',
    R: '#c:rods/steel',
    M: 'modern_industrialization:steel_rod_magnetic'
  }).id(id('conversion/electric_motor'))

  event.shaped('electroenergetics:electric_pump', [' MC', 'APA', 'CW '], {
    M: 'electroenergetics:magnet',
    C: 'electroenergetics:connector',
    A: 'create:andesite_alloy',
    P: 'create:mechanical_pump',
    W: 'electroenergetics:wire_spool'
  }).id(id('conversion/electric_pump'))

  // ELE-02 — the only FE boundary. It is deliberately later than practical
  // circuits so FE machine systems consume power without becoming a grid.
  event.shaped('electroenergetics:converter', ['CHC', 'WTW', 'CEC'], {
    C: 'electroenergetics:connector',
    H: 'electroenergetics:high_voltage_capacitor',
    W: 'electroenergetics:heavily_insulated_wire_spool',
    T: 'electroenergetics:transformer_core',
    E: '#createch2:control/factory/analog'
  }).id(id('conversion/fe_boundary'))

  // Existing cross-system consumers remain useful, but they are constructed
  // from the sole grid's explicit conversion/storage hardware.
  event.shapeless('createaddition:portable_energy_interface', [
    'electroenergetics:converter',
    'create:brass_casing',
    'create:chute',
    'modern_industrialization:analog_circuit',
    'electroenergetics:wire_spool'
  ]).id(id('conversion/portable_energy_interface'))

  event.shaped('createaddition:modular_accumulator', [' C ', 'ABA', ' W '], {
    C: 'modern_industrialization:analog_circuit',
    A: 'electroenergetics:accumulator',
    B: '#c:plates/steel',
    W: 'electroenergetics:wire_spool'
  }).id(id('storage/modular_accumulator'))

  // Retire same-output alternatives while retaining the exact recipes authored
  // above. First-space propulsion depends on this workshop's existing motor.
  event.remove({
    not: { createch2_exact_ids: authoredIds },
    or: CREATECH2_REAUTHORED_ELECTRICAL_OUTPUTS.map(output => ({ output: output }))
  })
})
