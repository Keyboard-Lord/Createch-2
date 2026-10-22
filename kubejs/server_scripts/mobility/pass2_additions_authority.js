// priority: 1200
// Narrow integration for the four 8.1d additions. Research'd owns the native
// coaster, compact-transmission and jet-component recipe timing. Only the two
// engineered coaster electrical parts need physical recipe replacement so a
// nominal "linear motor" cannot be built before practical electrics.

ServerEvents.recipes(event => {
  event.remove({ output: 'coastersengineered:linear_motor' })
  event.remove({ output: 'coastersengineered:linear_motor_controller' })

  event.shaped('coastersengineered:linear_motor', [
    'SCS',
    'MEM',
    'SCS'
  ], {
    S: '#c:plates/steel',
    C: 'electroenergetics:inductor',
    M: 'electroenergetics:white_electric_motor',
    E: 'electroenergetics:electrical_panel'
  }).id('createch2:mobility/coasters_engineered/linear_motor')

  event.shapeless('coastersengineered:linear_motor_controller', [
    'coastersengineered:coaster_casing',
    'coastersengineered:linear_motor',
    'electroenergetics:potentiometer',
    'modern_industrialization:analog_circuit'
  ]).id('createch2:mobility/coasters_engineered/linear_motor_controller')
})
