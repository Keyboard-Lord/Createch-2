// priority: 200
// Createch 2 native-item magic research.
// Enchanted Witchcraft opens the path; Malum reveals later disciplines.

function c2ResearchId(path) {
  return 'createch2:magic_research/' + path
}

function c2Item(id, count) {
  var value = { item: id }
  if (count > 1) value.count = count
  return value
}

function c2Result(id, count) {
  return { count: count || 1, id: id }
}

function c2Spirit(type, count) {
  return { count: count, type: 'malum:' + type }
}

function c2Infusion(event, path, output, input, extras, spirits, recipeId) {
  var recipe = {
    type: 'malum:spirit_infusion',
    input: input,
    result: output,
    spirits: spirits
  }
  if (extras.length > 0) recipe.extraInputs = extras
  event.custom(recipe).id(recipeId || c2ResearchId(path))
}

function c2RemoveIds(event, ids) {
  var i
  for (i = 0; i < ids.length; i++) {
    event.remove({ id: ids[i] })
  }
}

ServerEvents.recipes(function (event) {
  // Clear obsolete pack recipes before installing the statically verified set.
  // Final dimensional continuity has an explicit owned supplier boundary;
  // retiring stale magic IDs must not depend on recipe-event ordering here.
  event.remove({ id: /^createch2:magic_research\/.*$/, not: { id: 'createch2:magic_research/mastery/dimensional_continuity' } })
  event.remove({ id: /^createch2:malum_discovery\/.*$/ })
  event.remove({ id: /^createch2:enchanted\/.*$/ })
  event.remove({ id: /^createch2:werewolves\/.*$/ })
  // Guide content is folded into FTB Quests; the book item is not a gate.
  event.remove({ id: 'enchanted:art_of_witchcraft' })

  // TFC-era Witchcraft apparatus. These replacements are registered before
  // their exact native recipes are removed.
  event.shaped(Item.of('enchanted:soft_clay_jar', 4), [
    ' C ',
    'CCC'
  ], {
    C: 'minecraft:clay_ball'
  }).id('enchanted:soft_clay_jar')
  c2RemoveIds(event, ['enchanted:soft_clay_jar'])

  event.custom({
    type: 'tfc:heating',
    ingredient: { item: 'enchanted:soft_clay_jar' },
    result_item: { count: 1, id: 'enchanted:clay_jar' },
    temperature: 1399.0
  }).id('enchanted:clay_jar')
  c2RemoveIds(event, ['enchanted:clay_jar'])

  event.shaped('enchanted:witch_oven', [
    'FBF',
    'CVC',
    'FSF'
  ], {
    B: 'minecraft:iron_bars',
    C: '#c:ingots/copper',
    F: 'tfc:ceramic/fire_brick',
    S: '#c:ingots/bronze',
    V: 'tfc:ceramic/vessel'
  }).id('enchanted:witch_oven')
  c2RemoveIds(event, ['enchanted:witch_oven'])

  event.shaped('enchanted:kettle', [
    'B B',
    'CVC',
    'SFS'
  ], {
    B: 'minecraft:iron_bars',
    C: '#c:ingots/copper',
    F: 'tfc:ceramic/fire_brick',
    S: '#c:ingots/bronze',
    V: 'tfc:ceramic/vessel'
  }).id('enchanted:kettle')
  c2RemoveIds(event, ['enchanted:kettle'])

  event.shaped('enchanted:distillery', [
    'GJG',
    'CVC',
    'SFS'
  ], {
    C: '#c:ingots/copper',
    F: 'tfc:ceramic/fire_brick',
    G: '#c:glass_blocks',
    J: 'tfc:ceramic/jug',
    S: '#c:ingots/bronze',
    V: 'enchanted:clay_jar'
  }).id('enchanted:distillery')
  c2RemoveIds(event, ['enchanted:distillery'])

  event.shaped('enchanted:spinning_wheel', [
    'SWS',
    'RCR',
    'SWS'
  ], {
    C: '#c:ingots/copper',
    R: '#c:rods/wooden',
    S: 'minecraft:string',
    W: '#tfc:lumber'
  }).id('enchanted:spinning_wheel')
  c2RemoveIds(event, ['enchanted:spinning_wheel'])

  event.shaped('enchanted:arthana', [
    ' S ',
    ' C ',
    ' R '
  ], {
    C: 'tfc:metal/ingot/bronze',
    R: '#c:rods/wooden',
    S: '#c:ingots/silver'
  }).id('enchanted:arthana')
  c2RemoveIds(event, ['enchanted:arthana'])

  event.shaped('enchanted:attuned_stone', [
    'ASA',
    'SMS',
    'ADA'
  ], {
    A: 'minecraft:amethyst_shard',
    D: 'minecraft:diamond',
    M: '#c:ingots/silver',
    S: 'enchanted:belladonna_flower'
  }).id('enchanted:attuned_stone')
  c2RemoveIds(event, ['enchanted:attuned_stone'])

  event.shapeless('enchanted:anointing_paste', [
    'enchanted:mandrake_root',
    'enchanted:belladonna_flower',
    'enchanted:wolfsbane_flower',
    'minecraft:bone_meal',
    'tfc:ceramic/bowl'
  ]).id('enchanted:anointing_paste')
  c2RemoveIds(event, ['enchanted:anointing_paste'])

  event.shapeless('enchanted:ritual_chalk', [
    'enchanted:attuned_stone',
    'minecraft:bone_meal',
    'minecraft:clay_ball',
    'tfc:ceramic/bowl'
  ]).id('enchanted:ritual_chalk')
  c2RemoveIds(event, ['enchanted:ritual_chalk'])

  event.shaped('enchanted:altar', [
    'SCS',
    'BVB',
    'RMR'
  ], {
    B: '#createch2:materials/rock/bricks',
    C: 'enchanted:attuned_stone',
    M: 'enchanted:ritual_chalk',
    R: '#tfc:lumber',
    S: '#c:ingots/silver',
    V: 'tfc:ceramic/vessel'
  }).id('enchanted:altar')
  c2RemoveIds(event, ['enchanted:altar'])

  event.shaped('enchanted:bone_needle', [
    ' B',
    'S '
  ], {
    B: 'minecraft:bone',
    S: 'minecraft:string'
  }).id('enchanted:bone_needle')
  c2RemoveIds(event, ['enchanted:bone_needle'])

  event.shaped('enchanted:poppet', [
    'SBS',
    'WMW',
    'SBS'
  ], {
    B: 'enchanted:bone_needle',
    M: 'enchanted:mandrake_root',
    S: 'minecraft:string',
    W: '#minecraft:wool'
  }).id('enchanted:poppet')
  c2RemoveIds(event, ['enchanted:poppet'])

  // TFC milk can be processed directly in a sealed barrel. The native bucket
  // recipe remains available for other compatible containers and automation.
  event.custom({
    type: 'tfc:barrel_sealed',
    duration: 1200,
    input_fluid: { amount: 1000, fluid: 'minecraft:milk' },
    input_item: { count: 1, item: 'enchanted:odour_of_purity' },
    output_item: { count: 3, id: 'enchanted:purified_milk' }
  }).id(c2ResearchId('enchanted/tfc_purified_milk'))

  // Native witch plants remain renewable without converting TFC soil.
  event.shapeless(Item.of('enchanted:belladonna_seeds', 2), [
    'enchanted:belladonna_flower',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/belladonna_seeds'))
  event.shapeless(Item.of('enchanted:belladonna_flower', 2), [
    'enchanted:belladonna_seeds',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/belladonna_flower'))
  event.shapeless(Item.of('enchanted:mandrake_seeds', 2), [
    'enchanted:mandrake_root',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/mandrake_seeds'))
  event.shapeless(Item.of('enchanted:mandrake_root', 2), [
    'enchanted:mandrake_seeds',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/mandrake_root'))
  event.shapeless(Item.of('enchanted:wolfsbane_seeds', 2), [
    'enchanted:wolfsbane_flower',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/wolfsbane_seeds'))
  event.shapeless(Item.of('enchanted:wolfsbane_flower', 2), [
    'enchanted:wolfsbane_seeds',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/wolfsbane_flower'))
  event.shapeless(Item.of('enchanted:water_artichoke_seeds', 2), [
    'enchanted:water_artichoke',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/water_artichoke_seeds'))
  event.shapeless(Item.of('enchanted:water_artichoke', 2), [
    'enchanted:water_artichoke_seeds',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/water_artichoke'))
  event.shapeless(Item.of('enchanted:snowbell_seeds', 2), [
    'enchanted:snowbell_seeds',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/snowbell'))
  event.shapeless(Item.of('enchanted:garlic', 2), [
    'enchanted:garlic',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/garlic'))
  event.shapeless('vampirism:garlic', [
    'enchanted:garlic',
    'minecraft:bone_meal'
  ]).id(c2ResearchId('plants/vampirism_garlic'))

  // TFC saplings supply the native Witch Oven fumes and fibers.
  event.custom({
    type: 'enchanted:byproduct',
    ingredient: { item: 'tfc:wood/sapling/birch' },
    result: c2Result('enchanted:breath_of_the_goddess', 1)
  }).id(c2ResearchId('byproduct/breath_of_the_goddess'))
  event.custom({
    type: 'enchanted:byproduct',
    ingredient: { item: 'tfc:wood/sapling/oak' },
    result: c2Result('enchanted:exhale_of_the_horned_one', 1)
  }).id(c2ResearchId('byproduct/exhale_of_the_horned_one'))
  event.custom({
    type: 'enchanted:byproduct',
    ingredient: { item: 'tfc:wood/sapling/maple' },
    result: c2Result('enchanted:whiff_of_magic', 1)
  }).id(c2ResearchId('byproduct/whiff_of_magic'))
  event.custom({
    type: 'enchanted:byproduct',
    ingredient: { item: 'tfc:wood/sapling/white_cedar' },
    result: c2Result('enchanted:odour_of_purity', 1)
  }).id(c2ResearchId('byproduct/odour_of_purity'))
  event.custom({
    type: 'enchanted:byproduct',
    ingredient: { item: 'tfc:wood/sapling/blackwood' },
    result: c2Result('enchanted:reek_of_misfortune', 1)
  }).id(c2ResearchId('byproduct/reek_of_misfortune'))
  event.custom({
    type: 'enchanted:byproduct',
    ingredient: { item: 'tfc:wood/sapling/spruce' },
    result: c2Result('enchanted:hint_of_rebirth', 1)
  }).id(c2ResearchId('byproduct/hint_of_rebirth'))

  // The first Malum gate joins Enchanted ritual practice to native soulstone.
  event.shaped('malum:encyclopedia_arcana', [
    'PIP',
    'SBS',
    'PRP'
  ], {
    B: 'minecraft:book',
    I: 'minecraft:ink_sac',
    P: 'minecraft:paper',
    R: 'enchanted:ritual_chalk',
    S: 'malum:refined_soulstone'
  }).id(c2ResearchId('malum/encyclopedia_arcana'))
  c2RemoveIds(event, ['malum:encyclopedia_arcana'])

  // Discoveries consume evidence, materials, technology, and spirits. The
  // Spirit Altar and the rest of the laboratory remain reusable.
  c2RemoveIds(event, ['tarotcards:tarot_deck'])
  c2Infusion(event, 'discover/tarot', c2Result('tarotcards:tarot_deck', 1),
    c2Item('minecraft:book', 1), [
      c2Item('enchanted:attuned_stone', 1),
      c2Item('malum:alchemical_calx', 2),
      c2Item('minecraft:clock', 1)
    ], [
      c2Spirit('arcane', 6),
      c2Spirit('aerial', 4)
    ], 'tarotcards:tarot_deck')

  c2RemoveIds(event, ['evilcraft:crafting/blood_extractor'])
  c2Infusion(event, 'discover/evilcraft', c2Result('evilcraft:blood_extractor', 1),
    c2Item('evilcraft:dark_gem', 1), [
      c2Item('malum:alchemical_impetus', 1),
      c2Item('vampirism:vampire_fang', 1),
      c2Item('minecraft:amethyst_shard', 2)
    ], [
      c2Spirit('wicked', 8),
      c2Spirit('infernal', 6),
      c2Spirit('aqueous', 6)
    ], 'evilcraft:crafting/blood_extractor')

  c2Infusion(event, 'discover/vampirism', c2Result('vampirism:vampire_book', 1),
    c2Item('vampirism:vampire_fang', 1), [
      c2Item('malum:soulwoven_silk', 2),
      c2Item('modern_industrialization:electronic_circuit', 1),
      c2Item('minecraft:book', 1)
    ], [
      c2Spirit('wicked', 8),
      c2Spirit('sacred', 8),
      c2Spirit('arcane', 6)
    ])

  c2RemoveIds(event, ['werewolves:stone_altar'])
  c2Infusion(event, 'discover/werewolves', c2Result('werewolves:stone_altar', 1),
    c2Item('werewolves:werewolf_tooth', 1), [
      c2Item('enchanted:wolfsbane_flower', 4),
      c2Item('malum:soulwoven_silk', 2),
      c2Item('modern_industrialization:electronic_circuit', 1),
      c2Item('modern_industrialization:silver_ingot', 2)
    ], [
      c2Spirit('earthen', 8),
      c2Spirit('sacred', 6),
      c2Spirit('wicked', 6)
    ], 'werewolves:stone_altar')

  // Keep the native Dictionary recipe: it is the required name-binding tool.
  // The existing Foliot discovery infusion remains the campaign entry artifact.
  c2Infusion(event, 'discover/occultism', c2Result('occultism:book_of_binding_foliot', 1),
    c2Item('minecraft:book', 1), [
      c2Item('enchanted:ritual_chalk', 1),
      c2Item('malum:refined_soulstone', 2),
      c2Item('minecraft:ender_pearl', 1)
    ], [
      c2Spirit('arcane', 8),
      c2Spirit('eldritch', 6),
      c2Spirit('aerial', 4)
    ])

  c2RemoveIds(event, ['psi:assembler'])
  c2Infusion(event, 'discover/psi', c2Result('psi:cad_assembler', 1),
    c2Item('modern_industrialization:digital_circuit', 1), [
      c2Item('malum:alchemical_impetus', 1),
      c2Item('minecraft:amethyst_shard', 4),
      c2Item('tfmg:steel_mechanism', 1)
    ], [
      c2Spirit('aerial', 12),
      c2Spirit('arcane', 12),
      c2Spirit('eldritch', 8)
    ], 'psi:assembler')

  c2RemoveIds(event, ['eternal_starlight:seeking_eye'])
  c2Infusion(event, 'discover/eternal_starlight', c2Result('eternal_starlight:seeking_eye', 4),
    c2Item('minecraft:ender_eye', 1), [
      c2Item('malum:blazing_quartz', 4),
      c2Item('malum:malignant_pewter_ingot', 2),
      c2Item('mekanism:dosimeter', 1),
      c2Item('modern_industrialization:superconductor_plate', 1)
    ], [
      c2Spirit('aerial', 16),
      c2Spirit('arcane', 16),
      c2Spirit('sacred', 12)
    ], 'eternal_starlight:seeking_eye')

  c2Infusion(event, 'discover/stargate_journey', c2Result('sgjourney:archeologist_notebook', 1),
    c2Item('minecraft:book', 1), [
      c2Item('modern_industrialization:processing_unit', 2),
      c2Item('malum:malignant_pewter_ingot', 2),
      c2Item('minecraft:echo_shard', 1),
      c2Item('mekanism:dosimeter', 1)
    ], [
      c2Spirit('arcane', 24),
      c2Spirit('eldritch', 16),
      c2Spirit('earthen', 16)
    ])

  c2RemoveIds(event, ['aeroworks:gyroscope'])
  c2Infusion(event, 'discover/aeroworks_gyroscope', c2Result('aeroworks:gyroscope', 1),
    c2Item('create:precision_mechanism', 1), [
      c2Item('tfmg:steel_mechanism', 1),
      c2Item('modern_industrialization:electronic_circuit', 1),
      c2Item('malum:stellar_mechanism', 1),
      c2Item('create:electron_tube', 2)
    ], [
      c2Spirit('aerial', 16),
      c2Spirit('arcane', 12),
      c2Spirit('earthen', 8)
    ], 'aeroworks:gyroscope')

  // Perfected contributions use native capstones and expendable materials.
  c2Infusion(event, 'mastery/living_continuity', c2Result('evilcraft:dark_power_gem', 1),
    c2Item('enchanted:mutandis_extremis', 1), [
      c2Item('vampirism:injection_garlic', 1),
      c2Item('werewolves:injection_un_werewolf', 1),
      c2Item('evilcraft:hardened_blood', 4),
      c2Item('modern_industrialization:quantum_circuit', 1)
    ], [
      c2Spirit('sacred', 32),
      c2Spirit('wicked', 24),
      c2Spirit('aqueous', 24),
      c2Spirit('earthen', 16)
    ])
  c2RemoveIds(event, [
    'evilcraft:crafting/dark_power_gem',
    'evilcraft:blood_infuser/base/dark_power_gem'
  ])

  c2Infusion(event, 'mastery/mind_and_matter', c2Result('malum:paracausal_flame', 1),
    c2Item('occultism:spirit_attuned_gem', 1), [
      c2Item('projecte:medium_covalence_dust', 1),
      c2Item('psi:psigem', 1),
      c2Item('tarotcards:tarot_deck', 1),
      c2Item('modern_industrialization:quantum_circuit', 1)
    ], [
      c2Spirit('arcane', 32),
      c2Spirit('eldritch', 24),
      c2Spirit('aerial', 24),
      c2Spirit('infernal', 16)
    ])
  c2RemoveIds(event, ['malum:spirit_infusion/paracausal_flame'])

  c2Infusion(event, 'mastery/dimensional_continuity', c2Result('sgjourney:stargate_variant_crystal', 1),
    c2Item('sgjourney:crystal_base', 1), [
      c2Item('occultism:dimensional_matrix', 1),
      c2Item('sgjourney:archeologist_notebook', 1),
      c2Item('eternal_starlight:starcore', 1),
      c2Item('ae2:quantum_link', 1)
    ], [
      c2Spirit('arcane', 32),
      c2Spirit('eldritch', 32),
      c2Spirit('aerial', 24),
      c2Spirit('sacred', 24)
    ])
  c2RemoveIds(event, [
    'sgjourney:crystallizing/stargate_variant_crystal',
    'createch2:quantum/sgjourney/stargate_variant_crystal'
  ])
  // First discovery stays here. The compiled factory route consumes the same
  // industrial feedstock as before and additionally requires a retained crystal.

  c2Infusion(event, 'mastery/infinity_egg', c2Result('enchanted:infinity_egg', 1),
    c2Item('evilcraft:dark_power_gem', 1), [
      c2Item('malum:paracausal_flame', 1),
      c2Item('sgjourney:stargate_variant_crystal', 1),
      c2Item('malum:malignant_pewter_ingot', 4),
      c2Item('modern_industrialization:singularity', 1)
    ], [
      c2Spirit('sacred', 64),
      c2Spirit('wicked', 64),
      c2Spirit('arcane', 64),
      c2Spirit('eldritch', 64),
      c2Spirit('earthen', 32),
      c2Spirit('aerial', 32),
      c2Spirit('aqueous', 32),
      c2Spirit('infernal', 32)
    ])

  console.info('[Createch2 Magic Research] Verified native-item research recipes loaded')
})
