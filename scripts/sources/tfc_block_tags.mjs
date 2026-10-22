// Canonical TFC block compatibility, moved unchanged out of server reloads.
// Generate with createch-dev/scripts/generate_tfc_block_tags.mjs.
export default function generate(event) {

    // Createch 2 TFC cross-tier compatibility.
    //
    // Goal:
    // - Keep TerraFirmaCraft materials useful throughout the entire pack.
    // - Let other mods consume physically equivalent TFC items through item tags.
    // - Preserve distinct alloys and age gates instead of blindly unifying metals.
    // - Avoid broad world-block classification and global recipe rewrites that can
    //   make every placement or inventory update expensive in a large modpack.
    //
    // Important performance rule:
    // Recipe compatibility belongs primarily in ITEM tags. BLOCK tags below are
    // intentionally pack-owned and narrow. Do not re-add blanket mineable,
    // Supplementaries, container, storage-block, or vanilla/common world-block tags
    // without profiling the exact mechanic that requires them.
    // Extended Industrialization's farmer validates every field tile against
    // farmer_dirt. TFC tilling correctly replaces dirt with its native farmland,
    // so the resulting farmland family must remain part of that structure
    // contract instead of invalidating the machine after the first tilling pass.
    event.add('extended_industrialization:farmer_dirt', '#tfc:farmlands')

    var CREATECH2_TFC_WOODS = [
      'acacia',
      'ash',
      'aspen',
      'birch',
      'blackwood',
      'chestnut',
      'douglas_fir',
      'hickory',
      'kapok',
      'mangrove',
      'maple',
      'oak',
      'palm',
      'pine',
      'rosewood',
      'sequoia',
      'spruce',
      'sycamore',
      'white_cedar',
      'willow'
    ]

    var CREATECH2_TFC_ROCKS = [
      'andesite',
      'basalt',
      'chalk',
      'chert',
      'claystone',
      'conglomerate',
      'dacite',
      'diorite',
      'dolomite',
      'gabbro',
      'gneiss',
      'granite',
      'limestone',
      'marble',
      'phyllite',
      'quartzite',
      'rhyolite',
      'schist',
      'shale',
      'slate',
      'tuff'
    ]

    var CREATECH2_TFC_FLUX_ROCKS = [
      'chalk',
      'dolomite',
      'limestone',
      'marble'
    ]

    var CREATECH2_TFC_BASE_METALS = [
      'bismuth',
      'bismuth_bronze',
      'black_bronze',
      'black_steel',
      'blue_steel',
      'brass',
      'bronze',
      'cast_iron',
      'copper',
      'gold',
      'nickel',
      'red_steel',
      'rose_gold',
      'silver',
      'steel',
      'sterling_silver',
      'tin',
      'wrought_iron',
      'zinc'
    ]

    var CREATECH2_TFC_GENERIC_FORM_METALS = [
      'bismuth',
      'copper',
      'gold',
      'nickel',
      'silver',
      'tin',
      'zinc'
    ]

    var CREATECH2_TFC_DISTINCT_BASE_METALS = [
      'bismuth_bronze',
      'black_bronze',
      'black_steel',
      'blue_steel',
      'brass',
      'bronze',
      'cast_iron',
      'red_steel',
      'rose_gold',
      'steel',
      'sterling_silver',
      'wrought_iron'
    ]

    var CREATECH2_TFC_METALLURGY_METALS = [
      'alnico',
      'aluminum',
      'andesite_alloy',
      'antimony',
      'beryllium',
      'beryllium_copper',
      'blutonium',
      'boron',
      'cobalt',
      'compressed_iron',
      'constantan',
      'electrum',
      'enderium',
      'ferroboron',
      'florentine_bronze',
      'graphite',
      'invar',
      'iridium',
      'lead',
      'lithium',
      'lumium',
      'magnesium',
      'manganese',
      'mithril',
      'neodymium',
      'nickel_silver',
      'osmiridium',
      'osmium',
      'pewter',
      'pink_slime',
      'platinum',
      'refined_glowstone',
      'refined_obsidian',
      'signalum',
      'solder',
      'thorium',
      'titanium',
      'tungsten',
      'tungsten_steel',
      'uranium',
      'vanadium',
      'zircaloy',
      'zirconium'
    ]

    var CREATECH2_TFC_ITEM_PART_METALS = [
      'aluminum',
      'bismuth',
      'bismuth_bronze',
      'black_bronze',
      'black_steel',
      'blue_steel',
      'brass',
      'bronze',
      'cast_iron',
      'chromium',
      'constantan',
      'copper',
      'electrum',
      'gold',
      'lead',
      'nickel',
      'red_steel',
      'rose_gold',
      'silver',
      'stainless_steel',
      'steel',
      'sterling_silver',
      'tin',
      'uranium',
      'wrought_iron',
      'zinc'
    ]

    var CREATECH2_TFC_METALLURGY_TOOL_METALS = [
      'aluminum',
      'beryllium_copper',
      'boron',
      'cobalt',
      'compressed_iron',
      'enderium',
      'ferroboron',
      'florentine_bronze',
      'invar',
      'lumium',
      'mithril',
      'nickel_silver',
      'osmiridium',
      'osmium',
      'pewter',
      'refined_glowstone',
      'refined_obsidian',
      'signalum',
      'thorium',
      'titanium',
      'tungsten',
      'tungsten_steel',
      'uranium'
    ]

    var CREATECH2_TFC_TOOL_METALS = [
      'bismuth_bronze',
      'black_bronze',
      'black_steel',
      'blue_steel',
      'bronze',
      'copper',
      'red_steel',
      'steel',
      'wrought_iron'
    ]

    var CREATECH2_TFC_ARMOR_TAGS = {
      helmet: ['c:helmets', 'c:armor/helmets', 'c:armors/helmets'],
      chestplate: ['c:chestplates', 'c:armor/chestplates', 'c:armors/chestplates'],
      greaves: ['c:leggings', 'c:armor/leggings', 'c:armors/leggings'],
      boots: ['c:boots', 'c:armor/boots', 'c:armors/boots']
    }

    var add = (tag, values) => {
      values.forEach(value => event.add(tag, value))
    }

    var addToEach = (tags, values) => {
      tags.forEach(tag => add(tag, values))
    }

    // 0.8.2 canonical geology contracts. Runtime mining proof reads these
    // block tags directly, so producers and the consumer must move together.
    var CREATECH2_PLANETARY_METALLUM_FAMILIES = [
      'bauxite',
      'bertrandite',
      'galena',
      'magnesite',
      'monazite',
      'native_iridium',
      'native_osmium',
      'native_platinum',
      'rutile',
      'spodumene',
      'stibnite',
      'uraninite',
      'wolframite',
      'zircon'
    ]

    CREATECH2_PLANETARY_METALLUM_FAMILIES.forEach(family => {
      CREATECH2_TFC_ROCKS.forEach(rock => {
        ;['poor', 'normal', 'rich'].forEach(grade => {
          event.add(
            `createch2:geology/planetary_ore_family/${family}`,
            `tfc_metallurgy:ore/${grade}_${family}/${rock}`
          )
        })
      })
    })

    ;['poor', 'normal', 'rich'].forEach(grade => {
      CREATECH2_TFC_ROCKS.forEach(rock => {
        event.add(
          'createch2:geology/planetary_ore_family/garnierite',
          `tfc:ore/${grade}_garnierite/${rock}`
        )
      })
    })

    CREATECH2_TFC_ROCKS.forEach(rock => {
      event.add(
        'createch2:geology/planetary_ore_family/sulfur',
        `tfc:ore/sulfur/${rock}`
      )
      event.add(
        'createch2:geology/planetary_ore_family/certus_quartz',
        `tfc_metallurgy:ore/certus_quartz/${rock}`
      )
    })

    add('createch2:geology/planetary_ore_family/naquadah', [
      'sgjourney:naquadah_ore',
      'sgjourney:deepslate_naquadah_ore'
    ])

    // Tracks 1.0.1 ships invalid uppercase resource locations in both vanilla
    // mineable tags. createch2_runtime_compat.zip must quarantine those two
    // complete lower-pack resources, which also hides TFC and vanilla entries.
    // Restore only the early wood/stone families required by actual tool
    // effectiveness; do not alter tool speeds, tiers, or block hardness.
    add('minecraft:mineable/axe', [
      '#minecraft:logs_that_burn',
      '#minecraft:planks'
    ])

    add('minecraft:mineable/pickaxe', [
      '#minecraft:base_stone_overworld',
      '#c:ores',
      'minecraft:cobblestone',
      'minecraft:mossy_cobblestone',
      'minecraft:stone_bricks',
      'minecraft:cracked_stone_bricks',
      'minecraft:mossy_stone_bricks',
      'minecraft:cobbled_deepslate',
      'minecraft:polished_deepslate',
      'minecraft:deepslate_bricks',
      'minecraft:cracked_deepslate_bricks',
      'minecraft:deepslate_tiles',
      'minecraft:cracked_deepslate_tiles'
    ])

    CREATECH2_TFC_ROCKS.forEach(rock => {
      ;[
        'raw',
        'smooth',
        'cobble',
        'bricks',
        'cracked_bricks',
        'mossy_bricks',
        'mossy_cobble'
      ].forEach(form => {
        add('minecraft:mineable/pickaxe', [
          `tfc:rock/${form}/${rock}`,
          `tfc:rock/${form}/${rock}_slab`,
          `tfc:rock/${form}/${rock}_stairs`,
          `tfc:rock/${form}/${rock}_wall`
        ])
      })
    })

    // Deliberately narrow:
    // - These tags are owned by Createch 2.
    // - Other-mod recipe compatibility is handled by ITEM tags above.
    // - The mineable exceptions immediately above repair an upstream resource
    //   quarantine and are intentionally limited to early wood/stone families.
    // - We avoid other broad tags such as supplementaries:flint_metals,
    //   c:storage_blocks, c:chains,
    //   c:barrels/wooden, and c:chests/wooden because mods may attach
    //   placement, interaction, neighbor, or capability logic to them.
    CREATECH2_TFC_WOODS.forEach(wood => {
      var log = `tfc:wood/log/${wood}`
      var woodBlock = `tfc:wood/wood/${wood}`
      var strippedLog = `tfc:wood/stripped_log/${wood}`
      var strippedWood = `tfc:wood/stripped_wood/${wood}`
      var family = [log, woodBlock, strippedLog, strippedWood]

      add('createch2:tfc_logs', family)

      addToEach([
        'c:logs', 'c:logs_that_burn',
        'minecraft:logs', 'minecraft:logs_that_burn',
        'minecraft:mineable/axe', 'tfc:logs_that_log'
      ], family)

      add('minecraft:overworld_natural_logs', [log, woodBlock])

      if (['acacia', 'birch', 'mangrove', 'oak', 'spruce'].includes(wood)) {
        add(`minecraft:${wood}_logs`, family)
      }

      add('createch2:stripped_logs', [
        `tfc:wood/stripped_log/${wood}`
      ])

      add('createch2:stripped_woods', [
        `tfc:wood/stripped_wood/${wood}`
      ])

      add('createch2:wooden_barrels', [
        `tfc:wood/barrel/${wood}`
      ])

      add('createch2:wooden_storage_chests', [
        `tfc:wood/chest/${wood}`,
        `tfc:wood/trapped_chest/${wood}`
      ])

      add('createch2:tfc_planks', [
        `tfc:wood/planks/${wood}`
      ])

      add('createch2:tfc_mine_supports', [
        `tfc:wood/support/${wood}`
      ])

      add('createch2:tfc_wooden_doors', [
        `tfc:wood/door/${wood}`
      ])

      add('createch2:tfc_wooden_trapdoors', [
        `tfc:wood/trapdoor/${wood}`
      ])

      add('createch2:tfc_wooden_fences', [
        `tfc:wood/fence/${wood}`
      ])
    })

    add('createch2:wooden_barrels', [
      'minecraft:barrel'
    ])

    add('createch2:wooden_storage_chests', [
      'minecraft:chest',
      'minecraft:trapped_chest'
    ])

    CREATECH2_TFC_ROCKS.forEach(rock => {
      add('createch2:tfc_raw_rocks', [
        `tfc:rock/raw/${rock}`
      ])

      add('createch2:tfc_cobblestones', [
        `tfc:rock/cobble/${rock}`
      ])

      add('createch2:tfc_smooth_stones', [
        `tfc:rock/smooth/${rock}`
      ])

      add('createch2:tfc_smooth_stone_slabs', [
        `tfc:rock/smooth/${rock}_slab`
      ])

      add('createch2:tfc_stone_bricks', [
        `tfc:rock/bricks/${rock}`
      ])

      add('createch2:tfc_stone_brick_slabs', [
        `tfc:rock/bricks/${rock}_slab`
      ])
    })

    CREATECH2_TFC_FLUX_ROCKS.forEach(rock => {
      add('createch2:flux_stones', [
        `tfc:rock/raw/${rock}`,
        `tfc:rock/cobble/${rock}`,
        `tfc:rock/smooth/${rock}`
      ])
    })

    CREATECH2_TFC_BASE_METALS.forEach(metal => {
      add(`createch2:tfc_metal_blocks/${metal}`, [
        `tfc:metal/block/${metal}`,
        `tfc:metal/block/${metal}_slab`,
        `tfc:metal/block/${metal}_stairs`
      ])
    })

    CREATECH2_TFC_TOOL_METALS.forEach(metal => {
      add(`createch2:tfc_metal_fixtures/${metal}`, [
        `tfc:metal/anvil/${metal}`,
        `tfc:metal/bars/${metal}`,
        `tfc:metal/chain/${metal}`,
        `tfc:metal/lamp/${metal}`,
        `tfc:metal/trapdoor/${metal}`
      ])
    })

    CREATECH2_TFC_METALLURGY_METALS.forEach(metal => {
      add(`createch2:tfc_metallurgy_metal_blocks/${metal}`, [
        `tfc_metallurgy:metal/block/${metal}`,
        `tfc_metallurgy:metal/slab/${metal}`,
        `tfc_metallurgy:metal/stairs/${metal}`
      ])
    })

    CREATECH2_TFC_METALLURGY_TOOL_METALS.forEach(metal => {
      add(`createch2:tfc_metallurgy_metal_fixtures/${metal}`, [
        `tfc_metallurgy:metal/anvil/${metal}`,
        `tfc_metallurgy:metal/chain/${metal}`,
        `tfc_metallurgy:metal/lamp/${metal}`,
        `tfc_metallurgy:metal/trapdoor/${metal}`
      ])
    })

    add('createch2:tfc_primitive_iron_blocks', [
      '#createch2:tfc_metal_blocks/wrought_iron',
      '#createch2:tfc_metal_blocks/cast_iron'
    ])
}
