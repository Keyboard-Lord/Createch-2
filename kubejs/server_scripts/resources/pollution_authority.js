// priority: 1300
// Createch 2 paired Pollution of the Realms + Advanced Chimneys campaign.
// Emission simulation remains environmental; chimneys route exhaust and the
// filter/vacuum equipment performs active cleanup at authored age gates.
;(function () {
ServerEvents.recipes(event => {
  var id = name => `createch2:pollution/${name}`
  var removalFilters = []
  var replace = (output, factory) => {
    removalFilters.push({ output: output })
    return factory()
  }

  replace('adchimneys:cobblestone_chimney', () => event.shaped(Item.of('adchimneys:cobblestone_chimney', 4), [
    'R R', 'R R', 'R R'
  ], { R: '#createch2:materials/rock/bricks' })).id(id('age_00/cobblestone_chimney'))

  replace('adchimneys:small_brick_chimney', () => event.shaped(Item.of('adchimneys:small_brick_chimney', 4), [
    'B B', 'B B', 'B B'
  ], { B: 'minecraft:brick' })).id(id('age_02/small_brick_chimney'))

  replace('adchimneys:large_brick_chimney', () => event.shaped(Item.of('adchimneys:large_brick_chimney', 4), [
    'BBB', 'B B', 'BBB'
  ], { B: 'minecraft:bricks' })).id(id('age_03/large_brick_chimney'))

  replace('adchimneys:stone_vent', () => event.shaped('adchimneys:stone_vent', [
    'ISI', 'SFS', 'ISI'
  ], {
    I: 'tfc:metal/ingot/cast_iron',
    S: '#createch2:materials/rock/bricks',
    F: 'create:encased_fan'
  })).id(id('age_03/stone_vent'))

  replace('adchimneys:stone_pump', () => event.shaped('adchimneys:stone_pump', [
    'ISI', 'PFP', 'ISI'
  ], {
    I: 'tfc:metal/ingot/cast_iron',
    S: '#createch2:materials/rock/bricks',
    P: 'create:mechanical_pump',
    F: 'create:encased_fan'
  })).id(id('age_03/stone_pump'))

  ;[
    ['metal_chimney', 'create:fluid_pipe'],
    ['metal_vent', 'create:encased_fan'],
    ['pipe', 'create:fluid_pipe']
  ].forEach(([output, core]) => replace(`adchimneys:${output}`, () => event.shaped(Item.of(`adchimneys:${output}`, output === 'pipe' ? 8 : 4), [
    'SCS', 'P P', 'SCS'
  ], {
    S: 'modern_industrialization:steel_plate',
    C: core,
    P: 'tfmg:cast_iron_pipe'
  })).id(id(`age_05/${output}`)))

  replace('adchimneys:metal_pump', () => event.shaped('adchimneys:metal_pump', [
    'SCS', 'MFM', 'SDS'
  ], {
    S: 'modern_industrialization:steel_plate',
    C: 'electroenergetics:inductor',
    M: 'modern_industrialization:motor',
    F: 'create:encased_fan',
    D: 'electroenergetics:converter'
  })).id(id('age_06/metal_pump'))

  replace('adpother:aerometer', () => event.shaped('adpother:aerometer', [
    ' G ', 'RCR', ' S '
  ], {
    G: '#c:glass_panes',
    R: 'minecraft:redstone',
    C: 'minecraft:compass',
    S: 'tfc:metal/ingot/copper'
  })).id(id('age_06/aerometer'))

  var filterTiers = [
    {
      age: 'age_05', name: 'iron', material: 'modern_industrialization:steel_plate',
      media: 'minecraft:charcoal', circuit: 'modern_industrialization:analog_circuit'
    },
    {
      age: 'age_09', name: 'gold', material: 'minecraft:gold_ingot',
      media: 'modern_industrialization:carbon_dust', circuit: 'modern_industrialization:digital_circuit'
    },
    {
      age: 'age_13', name: 'diamond', material: 'minecraft:diamond',
      media: 'modern_industrialization:carbon_plate', circuit: 'gtceu:iv_sensor'
    }
  ]

  filterTiers.forEach((tier, index) => {
    var previous = index === 0 ? 'minecraft:iron_bars' : `adpother:${filterTiers[index - 1].name}_filter_frame`
    replace(`adpother:${tier.name}_filter_frame`, () => event.shaped(`adpother:${tier.name}_filter_frame`, [
      'MFM', 'PCP', 'MFM'
    ], {
      M: tier.material,
      F: tier.media,
      P: previous,
      C: tier.circuit
    })).id(id(`${tier.age}/${tier.name}_filter_frame`))

    ;['vacuum_tube', 'vacuum_bag', 'respirator'].forEach((family, familyIndex) => {
      var core = family === 'vacuum_tube' ? 'adchimneys:metal_pump'
        : family === 'vacuum_bag' ? 'minecraft:bundle'
          : 'minecraft:leather_helmet'
      replace(`adpother:${tier.name}_${family}`, () => event.shaped(`adpother:${tier.name}_${family}`, [
        ' F ', 'MCM', ' E '
      ], {
        F: `adpother:${tier.name}_filter_frame`,
        M: tier.material,
        C: core,
        E: familyIndex === 0 ? 'electroenergetics:converter' : tier.media
      })).id(id(`${tier.age}/${tier.name}_${family}`))
    })
  })

  event.remove(removalFilters)
})
})()
