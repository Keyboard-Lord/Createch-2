// Save-recovery holders only. Core aliases the two removed addon IDs here.
// No production recipe, insulation action, furnace logic, or new progression.
StartupEvents.registry('item', event => {
  event.create('kubejs:retired_blast_furnace_insulation')
    .texture('tfc:item/metal/sheet/wrought_iron')
})

StartupEvents.registry('block', event => {
  event.create('kubejs:retired_insulated_fire_bricks')
    .hardness(2.0)
    .resistance(6.0)
    .requiresTool()
    .tagBlock('minecraft:mineable/pickaxe')
    .texture('tfc:block/fire_bricks')
})
