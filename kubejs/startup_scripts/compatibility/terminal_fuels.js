// Creative/terminal fuels use negative sentinel burn times upstream. GTCEu
// interprets those sentinels as recipe durations, producing invalid fuel
// recipes in the recipe viewer. NeoForge's furnace-fuel data map only accepts
// positive values, so use the smallest practical vanilla burn duration.
ItemEvents.modification(event => {
  ;[
    'avaritia:star_fuel',
    'avaritia:star_fuel_block',
    'create:creative_blaze_cake'
  ].forEach(itemId => event.modify(itemId, item => {
    item.burnTime = 200
  }))
})
