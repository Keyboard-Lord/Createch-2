// priority: 1700
// Createch 2 CC:Tweaked authority.  Computers supervise real machines and
// vehicles through native redstone/modem interfaces; they do not move matter.
ServerEvents.recipes(event => {
  // BEGIN GENERATED REVIEWED COMPUTER RETURNS
  var reviewedComputerReturnIds = ["createch2:material_recycling/precision_gateway/iv_scanner"]
  // END GENERATED REVIEWED COMPUTER RETURNS
  var id = name => `createch2:computing/${name}`
  var removalFilters = []
  var replace = (output, factory) => {
    removalFilters.push({ output: output })
    return factory()
  }

  replace('computercraft:computer_normal', () => event.shaped('computercraft:computer_normal', [
    'SRS',
    'GCG',
    'SPS'
  ], {
    S: 'modern_industrialization:steel_plate',
    R: 'minecraft:redstone',
    G: '#c:glass_blocks',
    C: 'modern_industrialization:electronic_circuit',
    P: 'electroenergetics:converter'
  })).id(id('age_09/computer'))

  replace('computercraft:computer_advanced', () => event.shaped('computercraft:computer_advanced', [
    'TDT',
    'GCG',
    'TPT'
  ], {
    T: 'modern_industrialization:stainless_steel_plate',
    D: 'modern_industrialization:digital_circuit',
    G: 'ae2:quartz_glass',
    C: 'computercraft:computer_normal',
    P: 'electroenergetics:converter'
  })).id(id('age_10/advanced_computer'))

  replace('computercraft:cable', () => event.shapeless(Item.of('computercraft:cable', 8), [
    'electroenergetics:insulated_wire', 'modern_industrialization:rubber_sheet',
    'modern_industrialization:electronic_circuit'
  ])).id(id('age_09/network_cable'))

  replace('computercraft:wired_modem_full', () => event.shaped('computercraft:wired_modem_full', [
    ' C ',
    'RER',
    ' S '
  ], {
    C: 'computercraft:cable',
    R: 'minecraft:redstone',
    E: 'modern_industrialization:electronic_circuit',
    S: 'modern_industrialization:steel_plate'
  })).id(id('age_09/wired_modem'))

  replace('computercraft:monitor_normal', () => event.shaped('computercraft:monitor_normal', [
    'GGG',
    'GCG',
    'SPS'
  ], {
    G: '#c:glass_blocks',
    C: 'modern_industrialization:electronic_circuit',
    S: 'modern_industrialization:steel_plate',
    P: 'electroenergetics:converter'
  })).id(id('age_09/monitor'))

  replace('computercraft:monitor_advanced', () => event.shaped('computercraft:monitor_advanced', [
    'GGG',
    'GCG',
    'TDT'
  ], {
    G: 'ae2:quartz_vibrant_glass',
    C: 'computercraft:monitor_normal',
    T: 'modern_industrialization:stainless_steel_plate',
    D: 'modern_industrialization:digital_circuit'
  })).id(id('age_10/advanced_monitor'))

  replace('computercraft:speaker', () => event.shaped('computercraft:speaker', [
    ' S ',
    'RCR',
    ' M '
  ], {
    S: 'electroenergetics:insulated_wire',
    R: 'minecraft:redstone',
    C: 'modern_industrialization:electronic_circuit',
    M: 'minecraft:note_block'
  })).id(id('age_09/alarm_speaker'))

  replace('computercraft:disk_drive', () => event.shaped('computercraft:disk_drive', [
    'SRS',
    'MCM',
    'SPS'
  ], {
    S: 'modern_industrialization:steel_plate',
    R: 'minecraft:redstone',
    M: 'modern_industrialization:motor',
    C: 'modern_industrialization:electronic_circuit',
    P: 'electroenergetics:converter'
  })).id(id('age_09/disk_drive'))

  replace('computercraft:disk', () => event.custom({
    type: 'minecraft:crafting_shapeless',
    ingredients: [
      { item: 'modern_industrialization:rubber_sheet' },
      { item: 'minecraft:redstone' },
      { item: 'modern_industrialization:iron_tiny_dust' }
    ],
    result: { id: 'computercraft:disk', count: 1 }
  })).id(id('age_09/recovery_disk'))

  replace('computercraft:turtle_normal', () => event.shaped('computercraft:turtle_normal', [
    'SPS',
    'MCM',
    'SIS'
  ], {
    S: 'modern_industrialization:stainless_steel_plate',
    P: 'electroenergetics:accumulator',
    M: 'modern_industrialization:motor',
    C: 'computercraft:computer_normal',
    I: 'modern_industrialization:steel_item_input_hatch'
  })).id(id('age_10/mining_turtle'))

  replace('computercraft:turtle_advanced', () => event.shaped('computercraft:turtle_advanced', [
    'TPT',
    'MCM',
    'TIT'
  ], {
    T: 'modern_industrialization:titanium_plate',
    P: 'electroenergetics:accumulator',
    M: 'modern_industrialization:advanced_motor',
    C: 'computercraft:computer_advanced',
    I: 'modern_industrialization:advanced_item_input_hatch'
  })).id(id('age_11/advanced_turtle'))

  // Command computers and Advanced Peripherals' chunk/overpowered automata
  // would grant authority the campaign does not teach.
  ;[
    'computercraft:computer_command',
    'advancedperipherals:chunk_controller',
    'advancedperipherals:overpowered_end_automata_core',
    'advancedperipherals:overpowered_husbandry_automata_core',
    'advancedperipherals:overpowered_weak_automata_core'
  ].forEach(output => removalFilters.push({ output: output }))

  ;[
    ['advancedperipherals:peripheral_casing', 'modern_industrialization:stainless_steel_plate'],
    ['computercraft:redstone_relay', 'electroenergetics:current_transformer'],
    ['advancedperipherals:environment_detector', 'gtceu:hv_sensor'],
    ['advancedperipherals:energy_detector', 'electroenergetics:energy_meter'],
    ['advancedperipherals:geo_scanner', 'tfc:metal/propick/black_steel'],
    ['advancedperipherals:inventory_manager', 'ae2:interface'],
    ['advancedperipherals:me_bridge', 'ae2:controller']
  ].forEach(([output, proof]) => replace(output, () => event.shaped(output, [
    'SCS',
    'PMP',
    'SDS'
  ], {
    S: 'modern_industrialization:stainless_steel_plate',
    C: 'computercraft:cable',
    P: proof,
    M: 'computercraft:wired_modem_full',
    D: 'modern_industrialization:digital_circuit'
  })).id(id(`age_10/peripheral/${output.split(':')[1]}`)))

  event.remove({ not: { createch2_exact_ids: reviewedComputerReturnIds }, or: removalFilters })
})
