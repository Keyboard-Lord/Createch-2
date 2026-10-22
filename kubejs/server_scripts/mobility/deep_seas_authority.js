// priority: 1200
// Createch 2 Deep Seas and Crush Depth progression authority.
// Native implosion, depth pressure, bends, currents and air drain stay native.
ServerEvents.recipes(event => {
  event.remove([
    'create_submarine:ballast_tank',
    'create_submarine:ballast_vent',
    'create_submarine:barometer',
    'create_submarine:copper_pressurizer',
    'create_submarine:iron_pressurizer',
    'create_submarine:oxygene_diffuser',
    'create_submarine:electrolyzer',
    'create_submarine:submarine_propeller',
    'create_submarine:water_thruster',
    'create_submarine:steel_cable',
    'create_submarine:pulley',
    'create_submarine:industrial_alarm',
    'create_submarine:decompression_chamber',
    'crush_depth:fathometer'
  ].map(output => ({ output: output })))

  const id = path => `createch2:deep_seas/${path}`

  // MEC-03 / Steel & Steam: hull, ballast, instrumentation and propulsion.
  event.shaped('crush_depth:fathometer', ['GBG', 'BCB', 'RAR'], {
    G: 'minecraft:glass_pane', B: '#c:plates/brass', C: 'minecraft:compass',
    R: 'minecraft:redstone', A: 'minecraft:amethyst_shard'
  }).id(id('instrument/fathometer'))

  event.shaped('create_submarine:copper_pressurizer', ['GCG', 'CPC', 'GCG'], {
    G: 'create:framed_glass', C: '#c:plates/copper', P: 'create:precision_mechanism'
  }).id(id('hull/copper_pressurizer'))

  event.shaped('create_submarine:iron_pressurizer', ['GSG', 'SPS', 'GSG'], {
    G: 'create:framed_glass', S: '#c:plates/steel', P: 'tfmg:steel_mechanism'
  }).id(id('hull/steel_pressurizer'))

  event.shaped('create_submarine:barometer', ['GGG', 'GFG', 'SBS'], {
    G: 'create_submarine:iron_pressurizer', F: 'crush_depth:fathometer',
    S: '#c:plates/steel', B: '#c:plates/brass'
  }).id(id('instrument/hull_barometer'))

  event.shaped('create_submarine:ballast_tank', ['SPS', 'TMT', 'SPS'], {
    S: '#c:plates/steel', P: 'create:precision_mechanism',
    T: 'create:fluid_tank', M: 'tfmg:steel_mechanism'
  }).id(id('ballast/tank'))

  event.shaped('create_submarine:ballast_vent', ['BSB', 'SFS', 'BSB'], {
    B: '#c:plates/brass', S: '#c:plates/steel', F: 'create:fluid_valve'
  }).id(id('ballast/vent'))

  event.shaped('create_submarine:submarine_propeller', [' P ', 'SMS', ' A '], {
    P: 'create:propeller', S: '#c:plates/steel',
    M: 'tfmg:steel_mechanism', A: 'create:shaft'
  }).id(id('propulsion/propeller'))

  event.shaped('create_submarine:water_thruster', [' P ', 'SWS', 'CMC'], {
    P: 'create:mechanical_pump', S: '#c:plates/steel', W: 'create:propeller',
    C: 'create:copper_casing', M: 'tfmg:steel_mechanism'
  }).id(id('propulsion/water_thruster'))

  event.shaped('create_submarine:steel_cable', ['RSR', 'IPI', 'RSR'], {
    R: '#c:rods/steel', S: 'simulated:spring', I: '#c:plates/steel',
    P: 'simulated:rope_coupling'
  }).id(id('rigging/steel_cable'))

  event.shaped('create_submarine:pulley', [' S ', 'IGI', 'SMS'], {
    S: '#c:plates/steel', I: '#c:ingots/iron',
    G: 'simulated:gyroscopic_mechanism', M: 'tfmg:steel_mechanism'
  }).id(id('rigging/pulley'))

  // ELE-02 / Low Voltage: powered atmosphere support follows grid literacy.
  event.shaped('create_submarine:oxygene_diffuser', [' F ', 'LNL', 'PDP'], {
    F: 'electroenergetics:white_electric_motor', L: 'create:redstone_link', N: 'create:nozzle',
    P: 'create:precision_mechanism', D: 'create:item_drain'
  }).id(id('life_support/oxygen_diffuser'))

  event.shaped('create_submarine:electrolyzer', ['GEG', 'CHC', 'PMP'], {
    G: 'create:framed_glass', E: 'create:electron_tube', C: '#c:plates/copper',
    H: 'electroenergetics:resistive_heater', P: 'electroenergetics:connector', M: 'electroenergetics:white_electric_motor'
  }).id(id('life_support/electrolyzer'))

  // COM-02: persistent bases can signal hull and pressure state.
  event.shaped('create_submarine:industrial_alarm', ['SRS', 'NBN', 'SCS'], {
    S: '#c:plates/steel', R: 'create:redstone_link', N: 'create:nixie_tube',
    B: 'create_submarine:barometer', C: 'computercraft:cable'
  }).id(id('automation/industrial_alarm'))

  // THM-03: harvested abyssal material closes the decompression loop.
  event.shaped('create_submarine:decompression_chamber', ['TGT', 'OAO', 'TGT'], {
    T: 'modern_industrialization:titanium_plate', G: 'create_submarine:iron_pressurizer',
    O: 'aquamirae:oxyhelium', A: 'create_submarine:industrial_alarm'
  }).id(id('pressure/decompression_chamber'))
})
