// priority: 600
// Createch 2 off-world archaeology interpretation recipes.
//
// Research'd owns the unlocks. The Solar-System structures supply evidence,
// while these recipes turn completed analysis into nonfunctional control
// artifacts before FRN-04E unlocks the actual Stargate construction line.

ServerEvents.recipes(function (event) {
  event.shaped('sgjourney:archeologist_notebook', [
    'PIP',
    'GBC',
    'PMP'
  ], {
    P: 'minecraft:paper',
    I: 'minecraft:ink_sac',
    G: 'sgjourney:stone_symbol',
    B: 'minecraft:book',
    C: 'minecraft:compass',
    M: '#createch2:geology/lunar_samples'
  }).id('createch2:offworld_archaeology/archeologist_notebook')

  event.shaped('sgjourney:memory_crystal', [
    'QHQ',
    'SNS',
    'QCQ'
  ], {
    Q: 'ae2:certus_quartz_crystal',
    H: 'sgjourney:sandstone_hieroglyphs',
    S: 'modern_industrialization:electrum_wire',
    N: 'sgjourney:archeologist_notebook',
    C: 'ae2:calculation_processor'
  }).id('createch2:offworld_archaeology/memory_crystal')

  event.shaped('sgjourney:advanced_control_crystal', [
    'QMQ',
    'CLC',
    'QEQ'
  ], {
    Q: 'modern_industrialization:quantum_circuit',
    M: 'sgjourney:advanced_memory_crystal',
    C: 'sgjourney:control_crystal',
    L: 'ae2:quantum_link',
    E: 'sgjourney:energy_crystal'
  }).id('createch2:offworld_archaeology/advanced_control_crystal')

  event.shaped('sgjourney:pegasus_dhd', [
    'BBB',
    'ACA',
    'QEQ'
  ], {
    B: '#createch2:materials/rock/buttons',
    A: 'sgjourney:naquadah_alloy',
    C: 'sgjourney:advanced_control_crystal',
    Q: 'modern_industrialization:quantum_circuit',
    E: 'ae2:quantum_link'
  }).id('createch2:offworld_archaeology/pegasus_dhd')
})

console.info('[Createch2 Off-World Archaeology] Registered staged interpretation and intergalactic-control recipes')
