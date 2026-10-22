// Canonical graded-ore tag source, extracted from the approved runtime authority.
// Generate with createch-dev/scripts/generate_tfc_ore_tags.mjs; no server reload expansion.
export default function generate(event) {

    var addAll = (tag, items) => items.forEach(item => event.add(tag, item))

    var hostRocks = [
      'andesite',
      'basalt',
      'chalk',
      'chert',
      'claystone',
      'conglomerate',
      'dacite',
      'diorite',
      'dolomite',
      'gabbro',
      'gneiss',
      'granite',
      'limestone',
      'marble',
      'phyllite',
      'quartzite',
      'rhyolite',
      'schist',
      'shale',
      'slate',
      'tuff'
    ]

    var gradedMinerals = [
      'bauxite',
      'bertrandite',
      'cobaltite',
      'galena',
      'kernite',
      'magnesite',
      'monazite',
      'native_iridium',
      'native_osmium',
      'native_platinum',
      'pyrolusite',
      'rutile',
      'spodumene',
      'stibnite',
      'uraninite',
      'wolframite',
      'zircon'
    ]

    gradedMinerals.forEach(mineral => {
      addAll(`createch2:tfc_ores/${mineral}/small`, [
        `tfc_metallurgy:ore/small_${mineral}`
      ])
      event.add(
        `createch2:tfc_ores/${mineral}`,
        `#createch2:tfc_ores/${mineral}/small`
      )

      ;['poor', 'normal', 'rich'].forEach(grade => {
        // Mining drops this loose item; rock-hosted block IDs alone do not
        // supply the existing grade-aware processing recipes.
        event.add(
          `createch2:tfc_ores/${mineral}/${grade}`,
          `tfc_metallurgy:ore/${grade}_${mineral}`
        )
        hostRocks.forEach(rock => {
          event.add(
            `createch2:tfc_ores/${mineral}/${grade}`,
            `tfc_metallurgy:ore/${grade}_${mineral}/${rock}`
          )
        })
        event.add(
          `createch2:tfc_ores/${mineral}`,
          `#createch2:tfc_ores/${mineral}/${grade}`
        )
      })
    })

    event.add('createch2:tfc_ores/certus_quartz/normal', 'tfc_metallurgy:ore/certus_quartz')
    hostRocks.forEach(rock => {
      event.add(
        'createch2:tfc_ores/certus_quartz/normal',
        `tfc_metallurgy:ore/certus_quartz/${rock}`
      )
    })
    event.add(
      'createch2:tfc_ores/certus_quartz',
      '#createch2:tfc_ores/certus_quartz/normal'
    )

    // Firmalife 3.0.11 still ships resources for small chromite, but does not
    // register the item in this installed mod combination. Keep the aggregate
    // tag on the registered graded ore pieces and blocks.
    ;['poor', 'normal', 'rich'].forEach(grade => {
      event.add(`createch2:tfc_ores/chromite/${grade}`, `firmalife:ore/${grade}_chromite`)
      hostRocks.forEach(rock => {
        event.add(
          `createch2:tfc_ores/chromite/${grade}`,
          `firmalife:ore/${grade}_chromite/${rock}`
        )
      })
      event.add(
        'createch2:tfc_ores/chromite',
        `#createch2:tfc_ores/chromite/${grade}`
      )
    })

    addAll('createch2:geology/ores/galena/all', [
      '#createch2:tfc_ores/galena'
    ])
    addAll('createch2:geology/ores/galena/poor', [
      '#createch2:tfc_ores/galena/poor'
    ])
    addAll('createch2:geology/ores/galena/normal', [
      '#createch2:tfc_ores/galena/normal'
    ])
    addAll('createch2:geology/ores/galena/rich', [
      '#createch2:tfc_ores/galena/rich'
    ])
    addAll('createch2:materials/lead/canonical_dusts', [
      'modern_industrialization:lead_dust'
    ])
    addAll('createch2:materials/lead/canonical_ingots', [
      'modern_industrialization:lead_ingot'
    ])

    event.add('c:dusts/lead', 'modern_industrialization:lead_dust')
    event.add('c:ingots/lead', 'modern_industrialization:lead_ingot')
    event.add('c:plates/lead', 'modern_industrialization:lead_plate')

    addAll('createch2:quest/copper_indicators', [
      'tfc:ore/small_native_copper',
      'tfc:ore/small_malachite',
      'tfc:ore/small_tetrahedrite',
      '#c:ores/copper/poor',
      '#c:ores/copper/normal',
      '#c:ores/copper/rich'
    ])
    addAll('createch2:quest/tin_indicators', [
      'tfc:ore/small_cassiterite',
      '#c:ores/tin/poor',
      '#c:ores/tin/normal',
      '#c:ores/tin/rich'
    ])
    addAll('createch2:quest/zinc_indicators', [
      'tfc:ore/small_sphalerite',
      '#c:ores/zinc/poor',
      '#c:ores/zinc/normal',
      '#c:ores/zinc/rich'
    ])
}
