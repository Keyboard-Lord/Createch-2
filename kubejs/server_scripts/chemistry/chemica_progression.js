// priority: 1850
// Createch 2 0.8.7a — authored geology-to-laboratory handoffs for Chemica.
// Chemica never owns ore placement. These recipes start from established TFC,
// TFC Metallum, FirmaLife, or common-tag material authorities.
;(() => {
ServerEvents.recipes(event => {
  const crushing = (name, ingredient, results, time) => event.custom({
    type: 'create:crushing',
    ingredients: [ingredient.startsWith('#') ? { tag: ingredient.slice(1) } : { item: ingredient }],
    processing_time: time == null ? 300 : time,
    results: results
  }).id(`createch2:chemica/feedstock/${name}`)

  crushing('tfc_graphite', 'tfc:powder/graphite', [
    { id: 'chemica:crushed_graphite' }
  ], 240)

  crushing('tfc_phosphorus', 'tfc:pure_phosphorus', [
    { id: 'chemica:phosphorus_dust' }
  ], 240)

  crushing('canonical_fluorite', '#c:gems/fluorite', [
    { id: 'chemica:fluorite_dust' }
  ], 300)

  crushing('tfc_rutile', '#c:ores/titanium', [
    { id: 'chemica:rutile_crystal' },
    { id: 'chemica:rutile_dust', chance: 0.25 }
  ], 500)

  // The registered Chemica ore blocks remain compatibility-only. Late
  // concentrates enter the chemistry plant as powders rather than creating a
  // second geology. These conversions intentionally require a heated TFMG vat.
  event.custom({
    type: 'tfmg:vat_machine_recipe',
    allowed_vat_types: ['tfmg:steel', 'tfmg:fireproof'],
    heat_level: 1,
    ingredients: [
      { item: 'gtceu:molybdenite_dust' },
      { type: 'neoforge:single', amount: 250, fluid: 'tfmg:sulfuric_acid' }
    ],
    machines: ['tfmg:mixing'],
    min_size: 1,
    processing_time: 400,
    results: [
      { id: 'gtceu:molybdenum_ingot' },
      { amount: 250, id: 'chemica:waste_slurry' }
    ]
  }).id('createch2:chemica/feedstock/molybdenite_wet_separation')

  event.custom({
    type: 'tfmg:vat_machine_recipe',
    allowed_vat_types: ['tfmg:steel', 'tfmg:fireproof'],
    heat_level: 1,
    ingredients: [
      { item: 'gtceu:vanadium_magnetite_dust' },
      { type: 'neoforge:single', amount: 250, fluid: 'chemica:hydrochloric_acid' }
    ],
    machines: ['tfmg:mixing'],
    min_size: 1,
    processing_time: 400,
    results: [
      { id: 'gtceu:vanadium_dust' },
      { id: 'chemica:iron_dust' },
      { amount: 250, id: 'chemica:waste_slurry' }
    ]
  }).id('createch2:chemica/feedstock/vanadium_magnetite_wet_separation')
})
})()
