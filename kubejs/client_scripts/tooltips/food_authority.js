ItemEvents.modifyTooltips(event => {
  event.add(['ae2:interface', 'ae2:cable_interface'], [Text.translate('tooltip.createch2.food.ae2.interface').gray()])
  event.add(['ae2:crafting_pattern', 'ae2:processing_pattern', 'ae2:stonecutting_pattern', 'ae2:smithing_table_pattern', 'ae2:molecular_assembler'], [
    Text.translate('tooltip.createch2.food.ae2.pattern').gray()
  ])
  event.add('mekanism:nutritional_liquifier', [
    Text.translate('tooltip.createch2.food.liquifier.input').gray(),
    Text.translate('tooltip.createch2.food.liquifier.yield').gray(),
    Text.translate('tooltip.createch2.food.liquifier.rotten').red()
  ])
  event.add(['mekanism:canteen', 'mekanism:nutritional_paste_bucket', 'mekanism:module_nutritional_injection_unit'], [
    Text.translate('tooltip.createch2.food.paste.diet').gray()
  ])
  event.add('evilcraft:flesh_rejuvenated', [Text.translate('tooltip.createch2.food.flesh.blood').gray()])
  event.add(['extended_industrialization:steel_canning_machine', 'extended_industrialization:electric_canning_machine'], [
    Text.translate('tooltip.createch2.food.canning.input').gray()
  ])
  event.add('extended_industrialization:canned_food', [Text.translate('tooltip.createch2.food.canning.nutrition').gray()])
})
