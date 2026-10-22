// Createch 2 0.7.8 non-Metallurgy prospecting representatives.
//
// TFC Metallurgy owns every advanced graded family it registers. These narrow
// representatives cover only source-native planetary ores that cannot be
// truthfully merged into one of those minerals. No blocks or items are
// registered here.
TFCEvents.prospectRepresentatives(event => {
  event.register(
    'sgjourney:naquadah_ore',
    'sgjourney:deepslate_naquadah_ore',
    'sgjourney:nether_naquadah_ore'
  )
  event.register(
    'sgjourney:naquadria_ore',
    'sgjourney:deepslate_naquadria_ore',
    'sgjourney:nether_naquadria_ore'
  )
  event.register(
    'sgjourney:trinium_ore',
    'sgjourney:deepslate_trinium_ore',
    'sgjourney:nether_trinium_ore'
  )
})
