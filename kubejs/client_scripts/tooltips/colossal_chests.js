ItemEvents.modifyTooltips(event => {
  event.add([
    'colossalchests:colossal_chest_wood',
    'colossalchests:colossal_chest_copper',
    'colossalchests:colossal_chest_iron',
    'colossalchests:colossal_chest_silver',
    'colossalchests:colossal_chest_gold',
    'colossalchests:colossal_chest_diamond',
    'colossalchests:colossal_chest_obsidian'
  ], [
    Text.translate('tooltip.createch2.colossal_chest.food_storage').gray(),
    Text.translate('tooltip.createch2.colossal_chest.tfc_decay').gray()
  ])
})
