// priority: 400
;(function () {
// Createch 2 Space Update Phase 2
// Cold Sweat owns temperature; Stellaris and Create: Cosmonautics own
// planetary/orbital/deep-space exposure; Mekanism owns industrial radiation;
// and Cosmonautics/Rocketnautics asteroids remain physical moving structures.
ServerEvents.recipes(event => {
  var id = name => `createch2:space_environment_phase2/${name}`

  // First-space crews must carry the same independent instruments later used
  // for controlled Mekanism nuclear operations.
  // Retain the two later cosmonautics routes now compiled into static data.
  event.remove({ not: { or: [
    { id: /^createch2:cosmonautics_foundation\/sensor\/(?:geiger_counter|dosimeter)$/ },
    { id: /^createch2:space_environment_phase2\/radiation\/(?:geiger_counter|dosimeter)_first_space$/ }
  ] }, or: [
    { output: 'mekanism:geiger_counter' },
    { output: 'mekanism:dosimeter' }
  ] })

  event.shaped('mekanism:geiger_counter', [
    'LGL',
    'CEC',
    'LWL'
  ], {
    L: 'modern_industrialization:lead_plate',
    G: 'electroenergetics:ammeter',
    C: 'electroenergetics:insulated_wire',
    E: '#createch2:control/factory/analog',
    W: 'modern_industrialization:redstone_battery'
  }).id(id('radiation/geiger_counter_first_space'))

  event.shaped('mekanism:dosimeter', [
    'LGL',
    'RDR',
    'LWL'
  ], {
    L: 'modern_industrialization:lead_plate',
    G: '#c:glass_panes',
    R: '#c:dusts/redstone',
    D: 'mekanism:geiger_counter',
    W: 'electroenergetics:insulated_wire'
  }).id(id('radiation/dosimeter_first_space'))

  // Native asteroids contain Rocketnautics titanium. Keep direct smelting and
  // crushing disabled, but reconnect that ore to the established High Pressure
  // chloride/sponge chain through standardized MI raw titanium.
  ;[
    ['titanium_ore', 'rocketnautics:titanium_ore', 2, 400],
    ['deepslate_titanium_ore', 'rocketnautics:deepslate_titanium_ore', 2, 450],
    ['raw_titanium', 'rocketnautics:raw_titanium', 1, 150],
    ['raw_titanium_block', 'rocketnautics:raw_titanium_block', 9, 600]
  ].forEach(([name, input, amount, duration]) => {
    event.custom({
      type: 'modern_industrialization:macerator',
      eu: 64,
      duration: duration,
      item_inputs: [
        { item: input, amount: 1 },
        { item: 'modern_industrialization:processing_unit', amount: 1, probability: 0 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:raw_titanium', amount: amount }
      ]
    }).id(id(`asteroid/${name}_to_raw_titanium`))
  })
})
})()
