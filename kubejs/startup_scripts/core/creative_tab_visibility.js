;(function () {
// Createch 2 startup registrations and startup-only compatibility.

// Creative Tabs
{
var createch2ModifyCreativeTab = (tab, handler) => {
  StartupEvents.modifyCreativeTab(tab, handler)
}

var Createch2CreativeTabBuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
var Createch2CreativeTabResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
var createch2FailedCreativeTabRemovals = new Set()

var createch2SafeCreativeTabRemove = (event, item) => {
  if (
    typeof item === 'string' &&
    !Createch2CreativeTabBuiltInRegistries.ITEM.containsKey(Createch2CreativeTabResourceLocation.parse(item))
  ) {
    return
  }

  try {
    event.remove(item)
  } catch (error) {
    if (!createch2FailedCreativeTabRemovals.has(String(item))) {
      createch2FailedCreativeTabRemovals.add(String(item))
      console.warn(`[Createch2 Creative Tabs] Unexpected removal failure for ${String(item)}: ${error}`)
    }
  }
}

var createch2MysticalCrops = [
  'air',
  'aluminum',
  'amethyst',
  'amethyst_bronze',
  'apatite',
  'aquamarine',
  'armadillo',
  'basalt',
  'basalz',
  'blaze',
  'blazing_crystal',
  'blitz',
  'blizz',
  'brass',
  'breeze',
  'bronze',
  'certus_quartz',
  'chicken',
  'coal',
  'cobalt',
  'compressed_iron',
  'conductive_alloy',
  'constantan',
  'copper',
  'copper_alloy',
  'coral',
  'cow',
  'creeper',
  'cyanite',
  'dark_steel',
  'deepslate',
  'diamond',
  'dirt',
  'draconium',
  'dye',
  'earth',
  'electrum',
  'elementium',
  'emerald',
  'end',
  'end_steel',
  'enderium',
  'enderman',
  'energetic_alloy',
  'energized_steel',
  'experience',
  'fiery_ingot',
  'fire',
  'fish',
  'fluix',
  'fluorite',
  'flux_infused_gem',
  'flux_infused_ingot',
  'ghast',
  'glowstone',
  'gold',
  'grains_of_infinity',
  'graphite',
  'hepatizon',
  'honey',
  'hop_graphite',
  'ice',
  'inferium',
  'invar',
  'iridium',
  'iron',
  'ironwood',
  'knightmetal',
  'lapis_lazuli',
  'lead',
  'limestone',
  'lumium',
  'manasteel',
  'manyullyn',
  'marble',
  'menril',
  'mystical_flower',
  'nature',
  'nether',
  'nether_quartz',
  'netherite',
  'nickel',
  'niotic_crystal',
  'obsidian',
  'osmium',
  'peridot',
  'phantom',
  'pig',
  'pig_iron',
  'platinum',
  'prismarine',
  'pulsating_alloy',
  'quartz_enriched_iron',
  'queens_slime',
  'rabbit',
  'redstone',
  'redstone_alloy',
  'refined_glowstone',
  'refined_obsidian',
  'rock_crystal',
  'rose_gold',
  'rubber',
  'ruby',
  'saltpeter',
  'sapphire',
  'sculk',
  'sheep',
  'signalum',
  'silicon',
  'silver',
  'skeleton',
  'sky_stone',
  'slime',
  'slimesteel',
  'soularium',
  'soulium',
  'spider',
  'spirited_crystal',
  'squid',
  'starmetal',
  'steel',
  'steeleaf',
  'stone',
  'sulfur',
  'terrasteel',
  'tin',
  'turtle',
  'uraninite',
  'uranium',
  'vibrant_alloy',
  'water',
  'wither_skeleton',
  'wood',
  'yellorium',
  'zinc',
  'zombie'
]

var createch2VisibleMysticalCrops = new Set([
  'inferium',
  'air',
  'earth',
  'fire',
  'water',
  'nature',
  'dye',
  'wood',
  'stone',
  'dirt',
  'nether',
  'end',
  'coal',
  'copper',
  'iron',
  'zinc',
  'redstone',
  'nether_quartz',
  'glowstone',
  'brass',
  'gold',
  'lapis_lazuli',
  'osmium',
  'fluorite',
  'sulfur',
  'steel',
  'diamond',
  'emerald',
  'uranium',
  'refined_glowstone',
  'refined_obsidian',
  'netherite'
])

var createch2HiddenMysticalCropItems = []

var createch2HiddenMysticalEquipmentItems = []

var createch2HiddenParallelSteelItems = [
  'tfc:blast_furnace',
  'kubejs:retired_blast_furnace_insulation',
  'kubejs:retired_insulated_fire_bricks',
  'createbigcannons:steel_ingot',
  'createbigcannons:steel_block',
  'createbigcannons:steel_scrap'
]

var createch2HiddenCreateAdditionItems = [
  'createaddition:alternator',
  'createaddition:barbed_wire',
  'createaddition:bioethanol_bucket',
  'createaddition:biomass',
  'createaddition:biomass_pellet',
  'createaddition:biomass_pellet_block',
  'createaddition:brass_rod',
  'createaddition:cake_base',
  'createaddition:cake_base_baked',
  'createaddition:capacitor',
  'createaddition:chocolate_cake',
  'createaddition:connector',
  'createaddition:copper_rod',
  'createaddition:copper_spool',
  'createaddition:copper_wire',
  'createaddition:creative_energy',
  'createaddition:diamond_grit',
  'createaddition:diamond_grit_sandpaper',
  'createaddition:digital_adapter',
  'createaddition:electric_motor',
  'createaddition:electrum_amulet',
  'createaddition:electrum_block',
  'createaddition:electrum_ingot',
  'createaddition:electrum_nugget',
  'createaddition:electrum_rod',
  'createaddition:electrum_sheet',
  'createaddition:electrum_spool',
  'createaddition:electrum_wire',
  'createaddition:festive_spool',
  'createaddition:gold_rod',
  'createaddition:gold_spool',
  'createaddition:gold_wire',
  'createaddition:honey_cake',
  'createaddition:iron_rod',
  'createaddition:iron_wire',
  'createaddition:large_connector',
  'createaddition:redstone_relay',
  'createaddition:rolling_mill',
  'createaddition:seed_oil_bucket',
  'createaddition:small_light_connector',
  'createaddition:spool',
  'createaddition:straw',
  'createaddition:tesla_coil',
  'createaddition:zinc_sheet'
]

var createch2HiddenProductiveBeePatterns = [
  /^productivebees:spawn_egg_.*$/,
  /^productivebees:advanced_(?!oak_beehive$).*$/,
  /^productivebees:expansion_box_(?!oak$).*$/,
  /^productivebees:.*petrified_honey$/,
  'productivebees:honey_generator',
  'productivebees:jar_oak'
]

var createch2HiddenPersonalExplosives = [
  'weaponmod:dynamite',
  'weaponmod:cannon',
  'weaponmod:cannonball',
  'weaponmod:mortar',
  'weaponmod:shell'
]

var createch2HiddenJunkItems = [
  'cbc_ballistics:ballistics_wand',
  'farmersdelight:debug_pumpkin_pie',
  'tfmg:debug_cinderblock',
  'railways:buffer',
  'tfmg:creative_generator',
  'create_radar:creative_radar_plate',
  'create_aeronautics_toolgun:structure_tool',
  'create_aeronautics_toolgun:creative_magnetic_gun',
  'create_connected:creative_fluid_vessel',
  'createpropulsion:creative_thruster',
  'createpropulsion:creative_vector_thruster',
  'rocketnautics:creative_thruster',
  'createbigcannons:cannon_crafting_wand',
  'createbigcannons:creative_autocannon_ammo_container'
]

var createch2HiddenQuarryPlusItems = [
  'quarryplus:remote_placer',
  'quarryplus:repeat_tick_module',
  'quarryplus:creative_generator',
  'quarryplus:debug_storage',
  'quarryplus:soft_block',
  'quarryplus:frame'
]

var createch2HiddenIdasCreativeSecrets = [
  'idas:music_disc_slither',
  'idas:music_disc_calidum'
]

var createch2HiddenWoodFamilyItems = [
  'minecraft:cherry_log',
  'minecraft:stripped_cherry_log',
  'minecraft:cherry_wood',
  'minecraft:stripped_cherry_wood',
  'minecraft:cherry_planks',
  'minecraft:cherry_slab',
  'minecraft:cherry_stairs',
  'minecraft:cherry_fence',
  'minecraft:cherry_fence_gate',
  'minecraft:cherry_door',
  'minecraft:cherry_trapdoor',
  'minecraft:cherry_pressure_plate',
  'minecraft:cherry_button',
  'minecraft:cherry_sign',
  'minecraft:cherry_hanging_sign',
  'minecraft:cherry_boat',
  'minecraft:cherry_chest_boat',
  'minecraft:cherry_sapling',
  'minecraft:cherry_leaves',
  'quark:cherry_ladder',
  /^create:cherry_window(?:_pane)?$/,
  /^farmersdelight:cherry_cabinet$/,
  /^mcwbridges:.*cherry.*$/,
  /^mcwroofs:.*cherry.*$/,
  /^quark:(?:trapped_)?(?:lootr_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|blossom|azalea|ancient|purpur|prismarine|nether_brick)_chest$/,
  /^quark:(?:lootr_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|blossom|azalea|ancient|purpur|prismarine|nether_brick)_chest_(?:boat|raft)$/
]

var createch2MysticalEquipmentTiers = [
  'inferium',
  'prudentium',
  'tertium',
  'imperium',
  'supremium',
  'awakened_supremium'
]

var createch2MysticalEquipmentTypes = [
  'helmet',
  'chestplate',
  'leggings',
  'boots',
  'sword',
  'pickaxe',
  'axe',
  'shovel',
  'hoe',
  'bow',
  'crossbow',
  'fishing_rod',
  'scythe',
  'sickle',
  'shears',
  'staff'
]

createch2ModifyCreativeTab('createbigcannons:base', event => {
  createch2HiddenParallelSteelItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('createaddition:createaddition', event => {
  createch2HiddenCreateAdditionItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('productivebees:productivebees', event => {
  createch2HiddenProductiveBeePatterns.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('minecraft:combat', event => {
  createch2HiddenPersonalExplosives.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('cbc_ballistics:ballistics', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('quarryplus:quarryplus', event => {
  createch2HiddenQuarryPlusItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

  ;[
    'idas:idas',
    'minecraft:tools_and_utilities'
  ].forEach(tab => {
    createch2ModifyCreativeTab(tab, event => {
      createch2HiddenIdasCreativeSecrets.forEach(item => createch2SafeCreativeTabRemove(event, item))
    })
  })

  ;[
    'minecraft:building_blocks',
    'minecraft:natural_blocks',
    'minecraft:functional_blocks',
    'minecraft:redstone_blocks',
    'minecraft:tools_and_utilities',
    'quark:main'
  ].forEach(tab => {
    createch2ModifyCreativeTab(tab, event => {
      createch2HiddenWoodFamilyItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
    })
  })

createch2ModifyCreativeTab('farmersdelight:farmersdelight', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('tfmg:tfmg_main', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('tfmg:tfmg_decoration', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('create_aeronautics_automated_logistics:create_aeronautics_automated_logistics', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('create_radar:radar', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('create_aeronautics_toolgun:main', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('buildinggadgets2:buildinggadgets2', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('create_connected:main', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

createch2ModifyCreativeTab('createpropulsion:base', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

  ;[
    'rocketnautics:resource_tab',
    'rocketnautics:world_tab'
  ].forEach(tab => {
    createch2ModifyCreativeTab(tab, event => {
      createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
    })
  })

createch2ModifyCreativeTab('createbigcannons:base', event => {
  createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
})

  ;[
    'railways:railways',
    'railways:railways_tracks',
    'railways:railways_palettes'
  ].forEach(tab => {
    createch2ModifyCreativeTab(tab, event => {
      createch2HiddenJunkItems.forEach(item => createch2SafeCreativeTabRemove(event, item))
    })
  })

createch2ModifyCreativeTab('modonomicon:modonomicon', event => {
  createch2SafeCreativeTabRemove(event, 'modonomicon:modonomicon')
})

}

})()
