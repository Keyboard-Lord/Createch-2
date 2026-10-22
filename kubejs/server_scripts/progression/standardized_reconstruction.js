// priority: 700
// Createch 2 0.7.6 standardized reconstruction.
// PRE-03B owns the only survival recipe. The tool begins uncharged; Electro Energetics
// remains the only authorized infrastructure source for its FE charging path.
ServerEvents.recipes(function (event) {
  event.remove({ output: 'mbtool:mbtool' })

  event.shaped('mbtool:mbtool', [
    'CEG',
    'RBR',
    'HDA'
  ], {
    C: 'mekanism:chemical_crystallizer',
    E: 'ae2:engineering_processor',
    G: 'electroenergetics:energy_meter',
    R: 'gtceu:hv_robot_arm',
    B: 'electroenergetics:accumulator',
    H: 'electroenergetics:sulfur_hexafluoride_breaker',
    D: 'modern_industrialization:digital_circuit',
    A: 'railcraft:advanced_item_loader'
  }).id('createch2:construction/age_10/multibuilder_tool')
})
