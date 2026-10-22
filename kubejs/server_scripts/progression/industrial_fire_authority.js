// priority: 1200
// Burnt owns physical fire and collapse; Createch owns mitigation progression.
ServerEvents.recipes(event => {
  event.remove({ output: 'burnt:extinguisher' })
  event.remove({ output: 'burnt:smoke_detector' })

  event.shaped('burnt:extinguisher', [' V ', 'STS', 'SRS'], {
    V: 'create:fluid_valve', S: '#c:plates/steel',
    T: 'create:fluid_tank', R: 'minecraft:redstone_block'
  }).id('createch2:consequences/fire/extinguisher')

  event.shaped('burnt:smoke_detector', [' Q ', 'RAR', ' C '], {
    Q: 'minecraft:quartz', R: 'electroenergetics:resistor',
    A: 'electroenergetics:buzzer', C: 'electroenergetics:electrical_panel'
  }).id('createch2:consequences/fire/smoke_detector')
})
