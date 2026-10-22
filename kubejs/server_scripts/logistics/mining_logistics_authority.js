// priority: 1500
// Createch 2 logistics, mining, and ExtendedAE succession.
;(function () {
ServerEvents.recipes(event => {
  var id = name => `createch2:logistics_mining/${name}`
  var removalFilters = []
  var replace = (output, factory) => {
    removalFilters.push({ output: output })
    return factory()
  }

  // Electro Energetics owns electricity. Modern Dynamics owns enclosed item/fluid
  // routing only; all MD cable tiers and debug surfaces stay unobtainable.
  ;[
    'moderndynamics:lv_cable', 'moderndynamics:mv_cable',
    'moderndynamics:hv_cable', 'moderndynamics:ev_cable',
    'moderndynamics:superconductor_cable', 'moderndynamics:debug_tool'
  ].forEach(output => removalFilters.push({ output: output }))

  replace('moderndynamics:item_pipe', () => event.shaped(Item.of('moderndynamics:item_pipe', 8), [
    'SGS',
    'R R',
    'SGS'
  ], {
    S: 'modern_industrialization:steel_plate',
    G: '#c:glass_blocks',
    R: 'modern_industrialization:rubber_sheet'
  })).id(id('age_06/item_pipe'))

  replace('moderndynamics:fluid_pipe', () => event.shaped(Item.of('moderndynamics:fluid_pipe', 8), [
    'SGS',
    'P P',
    'SGS'
  ], {
    S: 'modern_industrialization:steel_plate',
    G: '#c:glass_blocks',
    P: 'tfmg:industrial_pipe'
  })).id(id('age_06/fluid_pipe'))

  replace('moderndynamics:extractor', () => event.shaped('moderndynamics:extractor', [
    ' R ',
    'PCP',
    ' S '
  ], {
    R: 'create:brass_funnel',
    P: 'modern_industrialization:steel_plate',
    C: 'modern_industrialization:electronic_circuit',
    S: 'electroenergetics:converter'
  })).id(id('age_06/extractor'))

  ;[
    ['filter', 'create:filter', 'modern_industrialization:electronic_circuit'],
    ['attractor', 'minecraft:lodestone', 'modern_industrialization:advanced_machine_hull'],
    ['inhibitor', 'electroenergetics:cut_off_switch', 'modern_industrialization:digital_circuit'],
    ['machine_extender', 'create:smart_chute', 'modern_industrialization:digital_circuit']
  ].forEach(([name, core, circuit]) => replace(`moderndynamics:${name}`, () => event.shaped(`moderndynamics:${name}`, [
    'SCS',
    'PEP',
    'SRS'
  ], {
    S: 'modern_industrialization:steel_plate',
    C: circuit,
    P: 'moderndynamics:item_pipe',
    E: 'moderndynamics:extractor',
    R: core
  })).id(id(`age_07_09/${name}`)))

  replace('moderndynamics:wrench', () => event.shaped('moderndynamics:wrench', [
    ' S ',
    ' BC',
    'B  '
  ], {
    S: 'modern_industrialization:steel_plate',
    B: 'create:brass_ingot',
    C: 'electroenergetics:inductor'
  })).id(id('age_06/wrench'))

  // The first conventional electric quarry. QuarryPlus consumes this block in
  // its existing pack-owned Ages 10-12 route.
  replace('modern_industrialization:electric_quarry', () => event.custom({
    type: 'modern_industrialization:assembler',
    eu: 64,
    duration: 1600,
    item_inputs: [
      { item: 'modern_industrialization:steel_machine_casing', amount: 4 },
      { item: 'modern_industrialization:advanced_motor', amount: 4 },
      { item: 'create:mechanical_drill', amount: 8 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 4 },
      { item: 'modern_industrialization:advanced_machine_hull', amount: 1 }
    ],
    fluid_inputs: { fluid: 'modern_industrialization:lubricant', amount: 2000 },
    item_outputs: [{ item: 'modern_industrialization:electric_quarry', amount: 1 }]
  })).id(id('age_08/mi_electric_quarry'))

  // Deep-space selective extraction only. Returned-sample hardware, physical
  // quarry history, communication, protection, and a Electro Energetics interface are
  // all consumed before the block can exist.
  replace('mekanism:digital_miner', () => event.shaped('mekanism:digital_miner', [
    'TCT',
    'QAQ',
    'BHB'
  ], {
    T: 'modern_industrialization:titanium_large_plate',
    C: 'computercraft:computer_advanced',
    Q: 'quarryplus:adv_quarry',
    A: 'ae2:spatial_io_port',
    B: 'electroenergetics:sulfur_hexafluoride_breaker',
    H: 'modern_industrialization:highly_advanced_machine_hull'
  })).id(id('age_12/deep_space_digital_miner'))

  // ExtendedAE is an extension after base AE2 proof. Native compatibility
  // recipes are removed wholesale; only selected specialist surfaces reopen.
  removalFilters.push({ output: /^extendedae:.+$/ })

  var extended = (age, output, core, proof) => event.shaped(`extendedae:${output}`, [
    'QDQ',
    'PCP',
    'QEQ'
  ], {
    Q: 'ae2:quartz_vibrant_glass',
    D: 'modern_industrialization:digital_circuit',
    P: proof,
    C: core,
    E: 'ae2:engineering_processor'
  }).id(id(`${age}/extendedae/${output}`))

  ;[
    ['ex_drive', 'ae2:drive'],
    ['ex_interface', 'ae2:interface'],
    ['ex_pattern_provider', 'ae2:pattern_provider'],
    ['ex_molecular_assembler', 'ae2:molecular_assembler'],
    ['ex_inscriber', 'ae2:inscriber'],
    ['ex_charger', 'ae2:charger'],
    ['ingredient_buffer', 'ae2:interface'],
    ['oversize_interface', 'ae2:interface'],
    ['precise_export_bus', 'ae2:export_bus'],
    ['precise_storage_bus', 'ae2:storage_bus'],
    ['threshold_export_bus', 'ae2:export_bus'],
    ['threshold_level_emitter', 'ae2:level_emitter']
  ].forEach(([output, core]) => extended('age_11', output, core, 'modern_industrialization:titanium_plate'))

  ;[
    ['ex_io_port', 'ae2:io_port'],
    ['wireless_hub', 'ae2:wireless_access_point'],
    ['wireless_connect', 'ae2:quantum_link'],
    ['wireless_tool', 'ae2:wireless_terminal']
  ].forEach(([output, core]) => extended('age_12', output, core, 'ae2:spatial_io_port'))

  ;[
    ['machine_frame', 'modern_industrialization:nuclear_alloy_machine_casing_pipe'],
    ['assembler_matrix_frame', 'extendedae:machine_frame'],
    ['assembler_matrix_wall', 'extendedae:machine_frame'],
    ['assembler_matrix_glass', 'ae2:quartz_vibrant_glass'],
    ['assembler_matrix_crafter', 'extendedae:ex_molecular_assembler'],
    ['assembler_matrix_pattern', 'extendedae:ex_pattern_provider'],
    ['assembler_matrix_speed', 'modern_industrialization:processing_unit'],
    ['concurrent_processor', 'ae2:engineering_processor'],
    ['circuit_cutter', 'ae2:inscriber'],
    ['crystal_assembler', 'ae2:charger'],
    ['crystal_fixer', 'ae2:charger']
  ].forEach(([output, core]) => extended('age_13', output, core, 'gtceu:iv_robot_arm'))

  event.remove(removalFilters)
})

// Core owns the same dimension policy for placement and saved/relocated operation.
var CREATECH2_DIGITAL_MINER_POLICY = Java.loadClass('createch2.core.compat.DigitalMinerPolicy')

BlockEvents.placed(event => {
  if (String(event.block.id) !== 'mekanism:digital_miner') return
  if (CREATECH2_DIGITAL_MINER_POLICY.allowsLevel(event.level)) return
  event.cancel()
  if (event.player) event.player.tell(Text.translate('message.createch2.digital_miner.denied'))
})
})()
