ItemEvents.modifyTooltips(event => {
  event.add('tfc:blast_furnace', [Text.translate('tooltip.createch2.blast_furnace.retired').gray()])
  event.add('kubejs:retired_blast_furnace_insulation', [Text.translate('tooltip.createch2.blast_furnace.recover_insulation').gray()])
  event.add('kubejs:retired_insulated_fire_bricks', [Text.translate('tooltip.createch2.blast_furnace.recover_bricks').gray()])
  event.add('tfmg:blast_furnace_hatch', [Text.translate('tooltip.createch2.blast_furnace.authority').gray()])
})
