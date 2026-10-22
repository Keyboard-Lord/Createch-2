// priority: 1250
// TaCZ owns infantry arms; Create: TaCZ owns ammunition manufacture.
ServerEvents.recipes(event => {
  const id = path => `createch2:military/${path}`

  event.remove({ id: /^tacz:(?:gun|ammo)\/.*/ })
  ;[
    'tacz:gun_smith_table', 'tacz:ammo_workbench', 'tacz:attachment_workbench',
    'tacz:gunpowder', 'tacz_c:bullet_recipe', 'tacz_c:large_bullet_recipe'
  ].forEach(recipe => event.remove({ id: recipe }))

  event.shaped('tacz:gun_smith_table', ['SSS', 'CMC', 'ABA'], {
    S: '#c:plates/steel', C: 'create:andesite_casing', M: 'tfmg:steel_mechanism',
    A: 'create:andesite_alloy', B: 'create:depot'
  }).id(id('infantry/gun_smith_table'))

  event.custom({
    type: 'minecraft:crafting_shaped', pattern: ['CBC', 'SAS', 'MMM'],
    key: {
      A: { item: 'tacz:ammo_box' }, B: { item: 'create:brass_casing' },
      C: { tag: 'c:plates/brass' }, S: { tag: 'c:plates/steel' },
      M: { item: 'create:precision_mechanism' }
    },
    result: { id: 'tacz:workbench_a', components: { 'minecraft:custom_data': '{BlockId:"tacz:ammo_workbench"}' } }
  }).id(id('infantry/ammo_workbench'))

  event.custom({
    type: 'minecraft:crafting_shaped', pattern: ['GEG', 'CMC', 'SAS'],
    key: {
      A: { item: 'tacz:ammo_box' }, C: { item: 'create:brass_casing' },
      E: { item: 'create:electron_tube' }, G: { tag: 'c:glass_blocks' },
      M: { item: 'create:precision_mechanism' }, S: { item: 'modern_industrialization:stainless_steel_plate' }
    },
    result: { id: 'tacz:workbench_c', components: { 'minecraft:custom_data': '{BlockId:"tacz:attachment_workbench"}' } }
  }).id(id('infantry/attachment_workbench'))

  const material = (item, count) => ({ item: item.startsWith('#') ? { tag: item.slice(1) } : { item: item }, count: count })
  const gun = (name, materials) => event.custom({
    type: 'tacz:gun_smith_table_crafting',
    materials: materials.map(entry => material(entry[0], entry[1])),
    result: { type: 'gun', id: `tacz:${name}` }
  }).id(id(`infantry/gun/${name}`))

  gun('m1911', [['#c:plates/steel', 8], ['tfmg:steel_mechanism', 1], ['#minecraft:planks', 2]])
  gun('ak47', [['#c:plates/steel', 16], ['tfmg:steel_mechanism', 2], ['create:precision_mechanism', 1], ['#minecraft:planks', 4]])
  gun('m16a1', [['#c:plates/steel', 14], ['tfmg:steel_mechanism', 2], ['create:precision_mechanism', 2], ['create:electron_tube', 1]])
  gun('m4a1', [['modern_industrialization:stainless_steel_plate', 14], ['tfmg:steel_mechanism', 2], ['create:precision_mechanism', 2], ['modern_industrialization:electronic_circuit', 1]])
  gun('m249', [['tfmg:heavy_plate', 12], ['tfmg:steel_mechanism', 4], ['create:precision_mechanism', 3], ['modern_industrialization:motor', 1]])
  gun('m320', [['modern_industrialization:stainless_steel_plate', 12], ['tfmg:steel_mechanism', 3], ['create:precision_mechanism', 2], ['createbigcannons:proximity_fuze', 1]])
  gun('m107', [['modern_industrialization:titanium_plate', 16], ['tfmg:heavy_plate', 8], ['modern_industrialization:advanced_motor', 1], ['cbc_ballistics:ballistic_calculator', 1]])
  gun('rpg7', [['tfmg:heavy_plate', 12], ['tfmg:steel_mechanism', 4], ['create:precision_mechanism', 2], ['createbigcannons:proximity_fuze', 1]])

  event.remove({ output: 'create_the_air_wars:machinegun' })
  event.shaped('create_the_air_wars:machinegun', ['HPH', 'SDS', ' M '], {
    H: 'tfmg:heavy_plate', P: 'create:precision_mechanism', S: '#c:plates/steel',
    D: 'minecraft:dispenser', M: 'tfmg:steel_mechanism'
  }).id(id('mounted/machinegun'))

  event.remove({ output: 'create_submarine:underwater_mine' })
  event.shaped('create_submarine:underwater_mine', ['HPH', 'TFT', 'HPH'], {
    H: 'tfmg:heavy_plate', P: 'create:precision_mechanism', T: 'minecraft:tnt',
    F: 'createbigcannons:proximity_fuze'
  }).id(id('naval/underwater_mine'))

  event.remove({ output: 'create_the_air_wars:sonar' })
  event.shaped('create_the_air_wars:sonar', ['TAT', 'RCR', 'TBT'], {
    T: 'modern_industrialization:titanium_plate', A: 'aquamirae:abyssal_amethyst',
    R: 'create_radar:radar_receiver_block', C: 'computercraft:computer_advanced',
    B: 'create_submarine:barometer'
  }).id(id('naval/sonar'))

  event.remove({ output: 'create_the_air_wars:anti_aircraft_launcher' })
  event.shaped('create_the_air_wars:anti_aircraft_launcher', ['HYH', 'PFP', 'SBS'], {
    H: 'tfmg:heavy_plate', Y: 'create_radar:auto_yaw_controller', P: 'create:precision_mechanism',
    F: 'create_radar:fire_controller', S: 'modern_industrialization:titanium_plate', B: 'create:mechanical_bearing'
  }).id(id('air_defense/launcher'))

  event.remove({ output: 'create_the_air_wars:c75' })
  event.recipes.create.mechanical_crafting('create_the_air_wars:c75', ['  F  ', ' TET ', ' TCT ', ' TRS ', '  R  '], {
    F: 'create:precision_mechanism', T: 'modern_industrialization:titanium_plate',
    E: 'create_the_air_wars:explosive', C: 'create_the_air_wars:chip',
    R: 'create_the_air_wars:rocketengine', S: 'create_radar:radar_receiver_block'
  }).id(id('air_defense/c75_interceptor'))
})
