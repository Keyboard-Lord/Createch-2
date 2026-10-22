// priority: 1200
// Synaxis is the physical telemetry and actuation layer after CC wired control.
ServerEvents.recipes(event => {
  event.remove({ mod: 'synaxis' })
  const id = path => `createch2:synaxis/${path}`

  event.shaped('synaxis:controller_wire_cable', ['RCR', 'WDW', 'RCR'], {
    R: '#c:plates/rubber', C: 'computercraft:cable',
    W: 'electroenergetics:insulated_wire', D: 'modern_industrialization:digital_circuit'
  }).id(id('network/controller_cable'))

  event.shaped('synaxis:circuit', [' S ', 'CDC', ' P '], {
    S: 'create:sturdy_sheet', C: 'electroenergetics:electrum_wire',
    D: 'modern_industrialization:digital_circuit', P: 'create:precision_mechanism'
  }).id(id('control/circuit'))

  event.shapeless('synaxis:circuit_diagram', [
    'synaxis:circuit', 'minecraft:paper', 'minecraft:blue_dye'
  ]).id(id('control/circuit_diagram'))

  event.shaped('synaxis:camera', ['GSG', 'CDC', 'PMP'], {
    G: 'minecraft:tinted_glass', S: 'create:sturdy_sheet', C: 'electroenergetics:electrum_wire',
    D: 'modern_industrialization:digital_circuit', P: 'create:precision_mechanism',
    M: 'computercraft:wired_modem'
  }).id(id('telemetry/camera'))

  event.shaped('synaxis:control_chair', ['LDL', 'NSN', 'CCC'], {
    L: 'create:linked_controller', D: 'computercraft:computer_advanced',
    N: 'create:nixie_tube', S: '#create:seats',
    C: 'modern_industrialization:stainless_steel_plate'
  }).id(id('control/chair'))

  event.shaped('synaxis:compact_flap', [' S ', 'GFG', ' C '], {
    S: 'create:sturdy_sheet', G: 'create:sequenced_gearshift',
    F: 'create:white_sail', C: 'synaxis:controller_wire_cable'
  }).id(id('actuation/compact_flap'))

  event.shaped('synaxis:dynamic_revolute_motor', [' F ', 'SMS', ' C '], {
    F: 'create:flywheel', S: 'modern_industrialization:stainless_steel_plate',
    M: 'electroenergetics:white_electric_motor', C: 'synaxis:controller_wire_cable'
  }).id(id('actuation/revolute_motor'))

  event.shapeless('synaxis:dynamic_joint_motor', [
    'synaxis:dynamic_revolute_motor', 'create:precision_mechanism', 'synaxis:circuit'
  ]).id(id('actuation/joint_motor'))

  event.shaped('synaxis:hydraulic_linear_actuator', ['SMS', 'SPS', 'CGC'], {
    S: 'modern_industrialization:stainless_steel_plate', M: 'create:mechanical_piston',
    P: 'create:piston_extension_pole', C: 'synaxis:controller_wire_cable',
    G: 'create:sequenced_gearshift'
  }).id(id('actuation/hydraulic_linear'))

  event.shaped('synaxis:kinetic_resistor', [' R ', 'SCS', ' W '], {
    R: 'electroenergetics:resistor', S: 'modern_industrialization:stainless_steel_plate',
    C: 'synaxis:circuit', W: 'create:shaft'
  }).id(id('control/kinetic_resistor'))
})
