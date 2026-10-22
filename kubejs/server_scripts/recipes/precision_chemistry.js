// priority: 800
// Createch 2 0.7.6 precision-beneficiation pilot.
//
// TFC owns graded tetrahedrite and its quern remains the low-infrastructure
// fallback. MI improves mineral liberation, then Mekanism owns dissolution,
// washing, crystallization and the native crystal-to-dust recovery sequence.
// Only the direct universal copper ore/raw entry points are closed.
ServerEvents.recipes(event => {
  const pilot = {
    small: { input: 'tfc:ore/small_tetrahedrite', powder: 2, sulfurChance: 0.10 },
    poor: { input: 'tfc:ore/poor_tetrahedrite', powder: 4, sulfurChance: 0.20 },
    normal: { input: 'tfc:ore/normal_tetrahedrite', powder: 6, sulfurChance: 0.30 },
    rich: { input: 'tfc:ore/rich_tetrahedrite', powder: 9, sulfurChance: 0.45 }
  }

  Object.entries(pilot).forEach(([grade, route]) => {
    event.custom({
      type: 'modern_industrialization:macerator',
      eu: 32,
      duration: 300,
      item_inputs: [
        { item: route.input, amount: 1 },
        { item: 'modern_industrialization:digital_circuit', amount: 1, probability: 0 }
      ],
      item_outputs: [
        { item: 'tfc:powder/tetrahedrite', amount: route.powder },
        { item: 'tfmg:sulfur_dust', amount: 1, probability: route.sulfurChance }
      ]
    }).id(`createch2:precision_beneficiation/tetrahedrite/beneficiation/${grade}`)
  })

  ;[
    /^mekanism:processing\/copper\/slurry\/dirty\/from_(?:ore|raw_block|raw_ore)$/,
    /^mekanism:processing\/copper\/shard\/from_(?:ore|raw_block|raw_ore)$/,
    /^mekanism:processing\/copper\/clump\/from_(?:ore|raw_block|raw_ore)$/,
    /^mekanism:processing\/copper\/dust\/from_(?:ore|raw_block|raw_ore)$/
  ].forEach(id => event.remove({ id: id }))

  event.custom({
    type: 'mekanism:dissolution',
    chemical_input: {
      amount: 1,
      chemical: 'mekanism:sulfuric_acid'
    },
    item_input: {
      count: 10,
      item: 'tfc:powder/tetrahedrite'
    },
    output: {
      amount: 200,
      id: 'mekanism:dirty_copper'
    },
    per_tick_usage: true
  }).id('createch2:precision_beneficiation/tetrahedrite/dissolution')
})
