// Controlled-environment agriculture for Extended Industrialization.
// Core owns the runtime compatibility boundary; KubeJS owns shipped recipe policy.
(() => {
  ServerEvents.recipes(event => {
    const greenTiers = [
      { name: 'low', amount: 16 },
      { name: 'medium', amount: 8 },
      // TFC halves high-value food additions when they are rotten. The machine
      // cannot inspect that temporal component in an ingredient, so charge the
      // conservative eight items for both fresh and rotten high-value greens.
      { name: 'high', amount: 8 }
    ]
    const brownTiers = [
      { name: 'low', amount: 16 },
      { name: 'medium', amount: 8 },
      { name: 'high', amount: 4 }
    ]

    greenTiers.forEach(green => brownTiers.forEach(brown => {
      event.custom({
        type: 'extended_industrialization:composter',
        eu: 4,
        duration: 28800,
        item_inputs: [
          { tag: `tfc:compost_greens/${green.name}`, amount: green.amount },
          { tag: `tfc:compost_browns/${brown.name}`, amount: brown.amount }
        ],
        item_outputs: [
          { item: 'tfc:compost', amount: 1 }
        ]
      }).id(`createch2:controlled_agriculture/composter/${green.name}_${brown.name}`)
    }))

    // Keep both upstream IDs stable so already-paid MI batches resume with
    // their saved identity. New mulch now contains actual compost authority.
    event.remove({ id: 'extended_industrialization:mixer/mulch' })
    event.custom({
      type: 'modern_industrialization:mixer',
      eu: 4,
      duration: 400,
      item_inputs: [
        { item: 'tfc:compost', amount: 1 },
        { item: 'modern_industrialization:wood_pulp', amount: 6 }
      ],
      item_outputs: [
        { item: 'extended_industrialization:mulch', amount: 1 }
      ]
    }).id('extended_industrialization:mixer/mulch')

    event.remove({ id: 'extended_industrialization:composter/fertilizer/composted_manure' })
    event.custom({
      type: 'extended_industrialization:composter',
      eu: 4,
      duration: 400,
      fluid_inputs: [
        { fluid: 'extended_industrialization:manure', amount: 150 }
      ],
      item_inputs: [
        { item: 'minecraft:bone_meal', amount: 1 },
        { item: 'extended_industrialization:mulch', amount: 1 }
      ],
      fluid_outputs: [
        { fluid: 'extended_industrialization:composted_manure', amount: 200 }
      ]
    }).id('extended_industrialization:composter/fertilizer/composted_manure')
  })
})()
