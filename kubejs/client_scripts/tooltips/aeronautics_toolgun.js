ItemEvents.modifyTooltips(event => {
  event.add('create_aeronautics_toolgun:survival_structure_tool', [
    Text.translate('tooltip.createch2.toolgun.survival_structure_tool.controlled').gray(),
    Text.translate('tooltip.createch2.toolgun.survival_structure_tool.hidden_modes').gray()
  ])

  event.add('create_aeronautics_toolgun:portable_structure_container', [
    Text.translate('tooltip.createch2.toolgun.portable_structure_container.description').gray(),
    Text.translate('tooltip.createch2.toolgun.portable_structure_container.backpack_warning').red()
  ])
})
