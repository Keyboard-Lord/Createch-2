// Literal convergence families. Native crafting-remainder actions stay in KubeJS.
import { staticRecipeWriter } from '../../lib/static_recipe_writer.mjs';

export function convergenceStatic() {
  const writer = staticRecipeWriter();
  const { event, Item, removeRecipe, removeOutputRecipes } = writer;
  const families = [];
  const compileFamily = (name, action) => { const before = writer.calls.length; action(); families.push({ name, recipes: writer.calls.length - before }); };
  compileFamily('Age 5 — Steel Steam', () => {
    // The replacement furnace uses TFC-fired refractory material. This is a
    // material translation, not a second clay/firing simulation.
    removeOutputRecipes(['tfmg:fireproof_brick'])
    event.shapeless('tfmg:fireproof_brick', ['tfc:ceramic/fire_brick'])
      .id('createch2:compatibility/tfc_blast_furnace/fireproof_brick')
    // Railcraft is the railway heavy-industry specialist. Native coke-oven
    // recipes remain live for coke and creosote; generic blast-furnace and
    // crusher families stay denied by the global authority phase.
    removeOutputRecipes([
      'railcraft:manual_rolling_machine',
      'railcraft:powered_rolling_machine',
      'railcraft:item_loader',
      'railcraft:item_unloader',
      'railcraft:advanced_item_loader',
      'railcraft:advanced_item_unloader',
      'railcraft:fluid_loader',
      'railcraft:fluid_unloader',
      'railcraft:steam_locomotive',
      'railcraft:standard_rail',
      'railcraft:stone_railbed',
      'railcraft:track_parts'
    ])

    event.shaped('railcraft:manual_rolling_machine', [
      'GPG',
      'PCP',
      'GAG'
    ], {
      G: '#c:heavy_gears/bronze',
      P: 'create:mechanical_press',
      C: 'railcraft:coke_oven_bricks',
      A: 'create:andesite_casing'
    }).id('createch2:railway/rolling/manual_rolling_machine')

    event.shaped('railcraft:powered_rolling_machine', [
      'SPS',
      'RMR',
      'SCS'
    ], {
      S: 'tfmg:heavy_plate',
      P: 'create:mechanical_press',
      R: 'railcraft:standard_rail',
      M: 'modern_industrialization:motor',
      C: 'railcraft:manual_rolling_machine'
    }).id('createch2:railway/rolling/powered_rolling_machine')

    event.shaped(Item.of('railcraft:crusher', 4), [
      'DPD',
      'PHP',
      'MCM'
    ], {
      D: '#c:gems/diamond',
      P: 'create:mechanical_piston',
      H: 'tfmg:heavy_plate',
      M: 'tfmg:steel_mechanism',
      C: 'railcraft:manual_rolling_machine'
    }).id('createch2:railway/crusher/multiblock')

    event.shaped(Item.of('railcraft:blast_furnace_bricks', 4), [
      'NBN',
      'BCB',
      'NBN'
    ], {
      N: 'minecraft:nether_bricks',
      B: 'railcraft:coke_oven_bricks',
      C: 'tfmg:fireproof_bricks'
    }).id('createch2:railway/blast_furnace/bricks')

    // Railcraft's blast furnace heat-treats established TFMG steel into
    // rail-grade stock. It cannot create steel from raw iron.
    event.custom({
      type: 'railcraft:blasting',
      experience: 0.0,
      ingredient: { item: 'tfmg:steel_ingot' },
      result: {
        count: 1,
        id: 'railcraft:steel_ingot'
      },
      slagOutput: 1
    }).id('createch2:railway/blast_furnace/rail_grade_steel')

    ;[
      ['coal', { item: 'minecraft:coal' }, [{ probability: 1.0, result: { item: 'railcraft:coal_dust' } }]],
      ['coal_block', { item: 'minecraft:coal_block' }, [{ count: 9, probability: 1.0, result: { item: 'railcraft:coal_dust' } }]],
      ['ballast', { item: 'minecraft:gravel' }, [
        { probability: 1.0, result: { item: 'railcraft:stone_railbed' } },
        { probability: 0.25, result: { item: 'minecraft:flint' } }
      ]],
      ['refractory_recovery', { item: 'railcraft:coke_oven_bricks' }, [
        { count: 3, probability: 1.0, result: { item: 'minecraft:brick' } },
        { probability: 0.5, result: { item: 'minecraft:sand' } }
      ]],
      ['slag_conditioning', { item: 'railcraft:slag' }, [
        { probability: 1.0, result: { item: 'minecraft:gravel' } },
        { probability: 0.25, result: { item: 'minecraft:sand' } }
      ]]
    ].forEach(([name, ingredient, outputs]) => event.custom({
      type: 'railcraft:crusher',
      ingredient: ingredient,
      outputs: outputs
    }).id(`createch2:railway/crusher/${name}`))

    event.custom({
      type: 'railcraft:rolling',
      key: {
        A: { item: 'railcraft:steel_ingot' },
        C: { item: 'railcraft:track_parts' }
      },
      pattern: [
        'ACA',
        'A A',
        'ACA'
      ],
      result: {
        count: 16,
        id: 'railcraft:standard_rail'
      }
    }).id('createch2:railway/rolling/standard_rail')

    event.custom({
      type: 'railcraft:rolling',
      key: {
        A: { item: 'railcraft:steel_ingot' }
      },
      pattern: [
        'AA',
        'AA'
      ],
      result: {
        count: 4,
        id: 'railcraft:steel_plate'
      }
    }).id('createch2:railway/rolling/steel_plate')

    event.custom({
      type: 'railcraft:rolling',
      key: {
        A: { tag: 'c:nuggets/steel' }
      },
      pattern: [
        'AA',
        ' A'
      ],
      result: {
        count: 3,
        id: 'railcraft:track_parts'
      }
    }).id('createch2:railway/rolling/track_parts')

    ;[
      ['item_loader', 'minecraft:hopper', 'railcraft:item_detector'],
      ['item_unloader', 'railcraft:item_detector', 'minecraft:hopper'],
      ['fluid_loader', 'tfmg:industrial_pipe', 'railcraft:tank_detector'],
      ['fluid_unloader', 'railcraft:tank_detector', 'tfmg:industrial_pipe']
    ].forEach(([output, upper, lower]) => event.shaped(`railcraft:${output}`, [
      'SUS',
      'RCR',
      'SLS'
    ], {
      S: 'railcraft:steel_plate',
      U: upper,
      R: 'railcraft:standard_rail',
      C: 'railcraft:controller_circuit',
      L: lower
    }).id(`createch2:railway/terminal/${output}`))

    ;[
      ['advanced_item_loader', 'railcraft:item_loader'],
      ['advanced_item_unloader', 'railcraft:item_unloader']
    ].forEach(([output, base]) => event.shaped(`railcraft:${output}`, [
      'SCS',
      'RBR',
      'SLS'
    ], {
      S: 'railcraft:steel_plate',
      C: 'railcraft:controller_circuit',
      R: 'railcraft:standard_rail',
      B: base,
      L: 'railcraft:steel_crowbar'
    }).id(`createch2:railway/terminal/${output}`))

    event.custom({
      type: 'railcraft:rolling',
      key: {
        C: { item: 'railcraft:coke_oven_bricks' },
        S: { item: 'railcraft:steel_plate' },
        M: { item: 'minecraft:minecart' },
        R: { item: 'railcraft:standard_rail' }
      },
      pattern: [
        'C C',
        'SMS',
        'R R'
      ],
      result: {
        count: 1,
        id: 'railcraft:frame'
      }
    }).id('createch2:railway/locomotive/underframe')

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'railcraft:frame' },
      transitional_item: { id: 'railcraft:frame' },
      loops: 1,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'railcraft:frame' },
            { item: 'railcraft:solid_fueled_firebox' }
          ],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'railcraft:frame' },
            { item: 'modern_industrialization:bronze_boiler' }
          ],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'railcraft:frame' },
            { item: 'tfmg:steel_mechanism' }
          ],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'railcraft:frame' }, { item: 'railcraft:standard_rail' }],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'railcraft:frame' }, { item: 'railcraft:controller_circuit' }],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'railcraft:frame' }, { item: 'railcraft:steel_plate' }],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'railcraft:frame' }, { item: 'railcraft:track_parts' }],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'railcraft:frame' }, { item: 'create:fluid_tank' }],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'railcraft:frame' }, { item: 'create:mechanical_pump' }],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'railcraft:frame' }, { item: 'create:controls' }],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'railcraft:frame' }, { item: 'tfmg:cast_iron_pipe' }],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'railcraft:frame' },
            { type: 'neoforge:single', amount: 250, fluid: 'tfmg:lubrication_oil' }
          ],
          results: [{ id: 'railcraft:frame' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'railcraft:frame' }],
          results: [{ id: 'railcraft:frame' }]
        }
      ],
      results: [{ id: 'railcraft:steam_locomotive' }]
    }).id('createch2:railway/locomotive/steam_assembly')

    event.custom({
      type: 'tfmg:industrial_blasting',
      hot_air_usage: 40,
      ingredients: [
        { item: 'create:crushed_raw_iron' },
        { item: 'tfc:powder/flux' }
      ],
      processing_time: 80,
      results: [
        { amount: 144, id: 'tfmg:molten_steel' },
        { amount: 144, id: 'tfmg:molten_slag' },
        { amount: 200, id: 'tfmg:furnace_gas' }
      ]
    }).id('createch2:steel_steam/tfmg/industrial_blasting/steel_from_coke_and_crushed_iron')

    event.custom({
      type: 'tfmg:industrial_blasting',
      hot_air_usage: 40,
      ingredients: [
        { tag: 'c:dusts/iron' },
        { item: 'tfc:powder/flux' }
      ],
      processing_time: 80,
      results: [
        { amount: 144, id: 'tfmg:molten_steel' },
        { amount: 144, id: 'tfmg:molten_slag' },
        { amount: 100, id: 'tfmg:furnace_gas' }
      ]
    }).id('createch2:steel_steam/tfmg/industrial_blasting/steel_from_coke_and_iron_dust')

    // TFC's advanced steels still need pig iron. Move its production to the
    // same native TFMG plant, not a second furnace or an ungated alloy shortcut.
    // One TFC cast-iron ingot contains 100 mB; preserve that metal quantity.
    // This distinct feed avoids ambiguous matching with either steel recipe.
    event.custom({
      type: 'tfmg:industrial_blasting',
      hot_air_usage: 40,
      ingredients: [
        { item: 'tfc:metal/ingot/cast_iron' },
        { item: 'tfc:powder/flux' }
      ],
      processing_time: 80,
      results: [
        { amount: 100, id: 'tfc:metal/pig_iron' },
        { amount: 144, id: 'tfmg:molten_slag' },
        { amount: 100, id: 'tfmg:furnace_gas' }
      ]
    }).id('createch2:steel_steam/tfmg/industrial_blasting/pig_iron')

    event.custom({
      type: 'tfmg:casting',
      ingredients: [{ type: 'neoforge:single', amount: 100, fluid: 'tfc:metal/pig_iron' }],
      processing_time: 200,
      results: [{ id: 'tfc:metal/ingot/pig_iron' }]
    }).id('createch2:steel_steam/tfmg/casting/pig_iron_ingot')

    event.custom({
      type: 'tfmg:casting',
      ingredients: [
        {
          type: 'neoforge:single',
          amount: 144,
          fluid: 'tfmg:molten_steel'
        }
      ],
      processing_time: 200,
      results: [
        { id: 'tfmg:steel_ingot' }
      ]
    }).id('createch2:steel_steam/tfmg/casting/steel_ingot')


    event.shaped('modern_industrialization:steel_block', [
      'SSS',
      'SSS',
      'SSS'
    ], {
      S: '#createch2:industrial_steel'
    }).id('createch2:steel_steam/mi/steel_block')

    event.custom({
      type: 'create:item_application',
      ingredients: [
        { item: 'tfmg:hardened_planks' },
        { tag: 'createch2:industrial_steel' }
      ],
      results: [
        { id: 'tfmg:steel_casing' }
      ]
    }).id('createch2:steel_steam/tfmg/steel_casing')

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'tfmg:heavy_plate' },
      transitional_item: { id: 'tfmg:unfinished_steel_mechanism' },
      loops: 3,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_steel_mechanism' },
            { item: 'tfmg:steel_casing' }
          ],
          results: [{ id: 'tfmg:unfinished_steel_mechanism' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'tfmg:unfinished_steel_mechanism' },
            { type: 'neoforge:single', amount: 250, fluid: 'tfmg:lubrication_oil' }
          ],
          results: [{ id: 'tfmg:unfinished_steel_mechanism' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_steel_mechanism' },
            { tag: 'c:plates/nickel' }
          ],
          results: [{ id: 'tfmg:unfinished_steel_mechanism' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_steel_mechanism' },
            { tag: 'c:plates/lead' }
          ],
          results: [{ id: 'tfmg:unfinished_steel_mechanism' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'tfmg:unfinished_steel_mechanism' }],
          results: [{ id: 'tfmg:unfinished_steel_mechanism' }]
        }
      ],
      results: [
        { chance: 120.0, id: 'tfmg:steel_mechanism' },
        { chance: 4.0, id: 'tfmg:heavy_plate' },
        { chance: 2.0, id: 'tfmg:steel_ingot' }
      ]
    }).id('createch2:steel_steam/tfmg/steel_mechanism')
  });
  compileFamily('Age 16 — Infinity', () => {
    var id = name => `createch2:infinity/${name}`

    ;[
      /^avaritia:infinity_.*$/,
      /^avaritia:.*creative.*$/,
      /^avaritia:ae2_creative.*$/,
      /^avaritia:mek_creative.*$/,
      /^avaritia:rs_creative.*$/,
      /^avaritia:de_creative.*$/,
      'avaritia:eternal_singularity',
      'avaritia:neutron_gear',
      'avaritia:neutron_ring',
      'avaritia:cosmic_meatballs',
      'avaritia:ultimate_stew',
      'avaritia:endest_pearl',
      'avaritia:record_fragment',
      'avaritia:star_fuel'
    ].forEach(recipeId => event.remove({ id: recipeId }))

    removeOutputRecipes([
      'avaritia:infinity_catalyst',
      'avaritia:infinity_ingot',
      'avaritia:infinity_upgrade',
      'avaritia:infinity_sword',
      'avaritia:infinity_pickaxe',
      'avaritia:infinity_axe',
      'avaritia:infinity_shovel',
      'avaritia:infinity_hoe',
      'avaritia:infinity_bow',
      'avaritia:infinity_crossbow',
      'avaritia:infinity_trident',
      'avaritia:infinity_mace',
      'avaritia:infinity_shield',
      'avaritia:infinity_helmet',
      'avaritia:infinity_chestplate',
      'avaritia:infinity_pants',
      'avaritia:infinity_boots',
      'avaritia:infinity_elytra',
      'avaritia:infinity_totem',
      'avaritia:infinity_bucket',
      'avaritia:infinity_clock',
      'avaritia:infinity_umbrella',
      'avaritia:infinity_chest',
      'avaritia:neutron_gear',
      'avaritia:neutron_ring',
      'avaritia:cosmic_meatballs',
      'avaritia:ultimate_stew',
      'avaritia:endest_pearl',
      'avaritia:record_fragment',
      'avaritia:star_fuel',
      'ae2:creative_energy_cell',
      'mekanism:creative_bin',
      'mekanism:creative_fluid_tank',
      'mekanism:creative_chemical_tank'
    ])

    var table = (name, output, pattern, key, count) => {
      var resultCount = count || 1
      var usedKey = {}
      pattern.forEach(row => {
        row.split('').forEach(symbol => {
          if (symbol !== ' ' && key[symbol]) {
            usedKey[symbol] = key[symbol]
          }
        })
      })
      event.custom({
        type: 'avaritia:shaped_table',
        pattern: pattern,
        key: usedKey,
        result: { id: output, count: resultCount },
        tier: 4
      }).id(id(name))
    }

    var shapeless = (name, output, ingredients, count) => {
      var resultCount = count || 1
      event.custom({
        type: 'avaritia:shapeless_table',
        ingredients: ingredients,
        result: { id: output, count: resultCount },
        tier: 4
      }).id(id(name))
    }

    // Native dynamic contract: Avaritia supplies every registered singularity
    // at getIngredients()/match time. Its shipped recipe also uses []. This is
    // not an empty-cost recipe; verify_eternal_contract.mjs pins that behavior.
    event.custom({
      type: 'avaritia:eternal_singularity',
      ingredients: []
    }).id(id('eternal_singularity'))

    shapeless('food/cosmic_meatballs', 'avaritia:cosmic_meatballs', [
      { item: 'tfc:food/beef' },
      { item: 'tfc:food/pork' },
      { item: 'tfc:food/mutton' },
      { item: 'tfc:food/chicken' },
      { item: 'tfc:food/rabbit' },
      { item: 'tfc:food/cod' },
      { item: 'tfc:food/salmon' },
      { item: 'tfc:food/tropical_fish' },
      { item: 'tfc:food/calamari' },
      { item: 'minecraft:rotten_flesh' },
      { item: 'minecraft:spider_eye' },
      { tag: 'c:eggs' },
      { item: 'avaritia:neutron_nugget' },
      { item: 'modern_industrialization:uu_matter_bucket' }
    ])

    shapeless('food/ultimate_stew', 'avaritia:ultimate_stew', [
      { item: 'tfc:food/red_apple' },
      { item: 'tfc:food/green_apple' },
      { item: 'tfc:food/melon_slice' },
      { item: 'minecraft:chorus_fruit' },
      { item: 'tfc:food/carrot' },
      { item: 'tfc:food/potato' },
      { item: 'tfc:food/beet' },
      { item: 'tfc:food/sugarcane' },
      { item: 'tfc:food/dried_kelp' },
      { item: 'minecraft:nether_wart' },
      { item: 'tfc:food/red_bell_pepper' },
      { item: 'minecraft:honey_bottle' },
      { item: 'tfc:plant/barrel_cactus' },
      { item: 'tfc:plant/golden_bamboo' },
      { item: 'avaritia:neutron_nugget' },
      { item: 'modern_industrialization:uu_matter_bucket' }
    ])

    table('end/endest_pearl', 'avaritia:endest_pearl', [
      ' EEEEEEE ',
      'EPPPPPPPE',
      'EPPQCQPPE',
      'EPPQNQPPE',
      'EPPQCQPPE',
      'EPPPPPPPE',
      ' EEEEEEE '
    ], {
      E: { tag: 'c:end_stones' },
      P: { tag: 'c:ender_pearls' },
      Q: { item: 'modern_industrialization:quantum_circuit' },
      C: { item: 'ae2:quantum_link' },
      N: { item: 'avaritia:neutron_ingot' }
    })

    table('culture/record_fragment', 'avaritia:record_fragment', [
      '   N   ',
      '  NDN  ',
      ' NDQDN ',
      '  NDN  ',
      '   N   '
    ], {
      N: { item: 'avaritia:neutron_pile' },
      D: { tag: 'c:music_discs' },
      Q: { item: 'modern_industrialization:quantum_circuit' }
    }, 4)

    // Star Fuel is the first explicit whole-factory capacity test. The 9x9
    // pattern consumes repeatable aerospace, nuclear, control, UU and spatial
    // output instead of accepting a single representative from each line.
    table('power/star_fuel', 'avaritia:star_fuel', [
      'XCCCCCCCY',
      'CFFFFFFFC',
      'CFMMMMMFC',
      'CFMRNRMFC',
      'CFUGSGUFC',
      'CFMRNRMFC',
      'CFMMMMMFC',
      'CFFFFFFFC',
      'CCCCCCCCC'
    ], {
      C: { item: 'minecraft:coal_block' },
      X: { item: 'gtceu:crystal_processor' },
      Y: { item: 'gtceu:luv_field_generator' },
      F: { item: 'modern_industrialization:superconductor_coil' },
      M: { item: 'modern_industrialization:processing_unit' },
      R: { item: 'rocketnautics:rocket_thruster' },
      N: { item: 'mekanismgenerators:fission_fuel_assembly' },
      U: { item: 'modern_industrialization:uu_matter_bucket' },
      G: { item: 'sgjourney:stargate_variant_crystal' },
      S: { item: 'avaritia:eternal_singularity' }
    })

    table('neutron/gear', 'avaritia:neutron_gear', [
      ' N ',
      'NCN',
      ' N '
    ], {
      N: { item: 'avaritia:neutron_ingot' },
      C: { item: 'avaritia:crystal_matrix_ingot' }
    })

    table('neutron/ring', 'avaritia:neutron_ring', [
      'NNN',
      'NQN',
      'NNN'
    ], {
      N: { item: 'avaritia:neutron_ingot' },
      Q: { item: 'modern_industrialization:singularity' }
    })

    var catalystIngredients = [
      { item: 'avaritia:eternal_singularity' },
      { item: 'avaritia:crystal_matrix' },
      { item: 'avaritia:neutron_ingot' },
      { item: 'avaritia:cosmic_meatballs' },
      { item: 'avaritia:ultimate_stew' },
      { item: 'avaritia:endest_pearl' },
      { item: 'avaritia:record_fragment' },
      { item: 'avaritia:star_fuel' },
      { item: 'modern_industrialization:bronze_machine_casing' },
      { item: 'modern_industrialization:bronze_curved_plate' },
      { item: 'create:precision_mechanism' },
      { item: 'tfmg:steel_mechanism' },
      { item: 'tfmg:heavy_plate' },
      { item: 'tfmg:coal_coke' },
      { item: 'modern_industrialization:rubber_sheet' },
      { item: 'tfmg:lubrication_oil_bucket' },
      { item: 'modern_industrialization:motor' },
      { item: 'modern_industrialization:pump' },
      { item: 'electroenergetics:inductor' },
      { item: 'stellaris:rocket_engine' },
      { item: 'stellaris:big_oxygen_tank' },
      { item: 'modern_industrialization:sulfuric_acid_bucket' },
      { item: 'modern_industrialization:carbon_plate' },
      { item: 'mekanism:alloy_infused' },
      { item: 'modern_industrialization:digital_circuit' },
      { item: 'megacells:cell_component_4m' },
      { item: 'modern_industrialization:titanium_large_plate' },
      { item: 'rocketnautics:titanium_nozzle' },
      { item: 'modern_industrialization:nuclear_alloy_plate' },
      { item: 'mekanism:pellet_plutonium' },
      { item: 'mekanismgenerators:fission_fuel_assembly' },
      { item: 'eternal_starlight:crystalborn_catalyst' },
      { item: 'eternal_starlight:starcore' },
      { item: 'eternal_starlight:aethersent_ingot' },
      { item: 'eternal_starlight:thioquartz_shard' },
      { item: 'eternal_starlight:malarite' },
      { item: 'eternal_starlight:soul_dew' },
      { item: 'eternal_starlight:deepsilver_ingot' },
      { item: 'modern_industrialization:superconductor_coil' },
      { item: 'modern_industrialization:quantum_circuit' },
      { item: 'modern_industrialization:singularity' },
      { item: 'modern_industrialization:uu_matter_bucket' },
      { item: 'sgjourney:stargate_variant_crystal' },
      { item: 'tfmg:heavy_machinery_casing' },
      { item: 'enchanted:infinity_egg' }
    ]

    var addCatalystBatch = (item, amount) => {
      for (var index = 0; index < amount; index++) {
        catalystIngredients.push({ item: item })
      }
    }

    // Avaritia combination recipes accept at most 81 ingredient entries.
    // Keep the catalyst at exactly that ceiling while Star Fuel carries the
    // largest whole-factory batch requirement through its separate 9x9 recipe.
    ;[
      ['tfmg:heavy_plate', 1],
      ['modern_industrialization:advanced_motor', 1],
      ['modern_industrialization:advanced_pump', 1],
      ['modern_industrialization:rubber_sheet', 3],
      ['modern_industrialization:electronic_circuit', 2],
      ['modern_industrialization:digital_circuit', 2],
      ['modern_industrialization:processing_unit', 1],
      ['sgjourney:naquadah_alloy', 1],
      ['rocketnautics:rocket_thruster', 2],
      ['mekanismgenerators:fission_fuel_assembly', 2],
      ['modern_industrialization:nuclear_alloy_plate', 2],
      ['modern_industrialization:superconductor_coil', 2],
      ['eternal_starlight:starcore', 1],
      ['modern_industrialization:singularity', 1],
      ['modern_industrialization:uu_matter_bucket', 1],
      ['sgjourney:stargate_variant_crystal', 1],
      ['gtceu:luv_robot_arm', 1],
      ['gtceu:luv_sensor', 1],
      ['gtceu:luv_emitter', 1],
      ['avaritia:star_fuel', 1],
      ['gtceu:uxv_electric_motor', 1],
      ['gtceu:uxv_electric_pump', 1],
      ['gtceu:uxv_electric_piston', 1],
      ['gtceu:uxv_conveyor_module', 1],
      ['gtceu:uxv_robot_arm', 1],
      ['gtceu:uxv_sensor', 1],
      ['gtceu:uxv_emitter', 1],
      ['gtceu:uxv_field_generator', 1]
    ].forEach(([item, amount]) => addCatalystBatch(item, amount))

    event.custom({
      type: 'avaritia:infinity_catalyst',
      group: 'eternal_singularity',
      ingredients: catalystIngredients
    }).id(id('infinity_catalyst'))

    // OpV is intentionally post-first-Infinity. This recovery formula cannot
    // bootstrap the first catalyst because each OpV family consumes Infinity,
    // but it turns a stocked final precision line into the second campaign
    // shift required by the release acceptance standard.
    var opvRecoveryIngredients = [
      { item: 'avaritia:infinity_ingot' },
      { item: 'avaritia:eternal_singularity' },
      { item: 'avaritia:crystal_matrix' },
      { item: 'avaritia:star_fuel' },
      { item: 'modern_industrialization:uu_matter_bucket' },
      { item: 'oritech:still_strange_matter_bucket' },
      { item: 'sgjourney:stargate_variant_crystal' },
      { item: 'justdirethings:time_crystal' }
    ]
    ;[
      'electric_motor', 'electric_pump', 'electric_piston', 'conveyor_module',
      'robot_arm', 'sensor', 'emitter', 'field_generator'
    ].forEach(family => {
      opvRecoveryIngredients.push({ item: `gtceu:opv_${family}` })
      opvRecoveryIngredients.push({ item: `gtceu:uxv_${family}` })
    })
    event.custom({
      type: 'avaritia:infinity_catalyst',
      group: 'eternal_singularity',
      ingredients: opvRecoveryIngredients
    }).id(id('infinity_catalyst_opv_recovery'))

    table('infinity/ingot', 'avaritia:infinity_ingot', [
      'NNNNNNNNN',
      'NCXXQXXCN',
      'NXCCSCCXN',
      'NCXXQXXCN',
      'NNNNNNNNN'
    ], {
      N: { item: 'avaritia:neutron_ingot' },
      C: { item: 'avaritia:crystal_matrix_ingot' },
      X: { item: 'avaritia:infinity_catalyst' },
      Q: { item: 'modern_industrialization:quantum_machine_hull' },
      S: { item: 'modern_industrialization:singularity' }
    })


    // Preserve Re:Avaritia's lossless ingot/nugget conversion after its native
    // recipe namespace is suppressed. This does not create Infinity material;
    // the extreme-table ingot remains the sole production authority.
    event.shapeless(Item.of('avaritia:infinity_nugget', 9), [
      'avaritia:infinity_ingot'
    ]).id(id('materials/infinity_nugget_from_ingot'))

    event.shaped('avaritia:infinity_ingot', [
      'NNN',
      'NNN',
      'NNN'
    ], {
      N: 'avaritia:infinity_nugget'
    }).id(id('materials/infinity_ingot_from_nuggets'))

    table('infinity/upgrade', 'avaritia:infinity_upgrade', [
      ' CXC ',
      'CINIC',
      'XNQNX',
      'CINIC',
      ' CXC '
    ], {
      C: { item: 'avaritia:crystal_matrix_ingot' },
      X: { item: 'avaritia:infinity_catalyst' },
      I: { item: 'avaritia:infinity_ingot' },
      N: { item: 'avaritia:neutron_ingot' },
      Q: { item: 'modern_industrialization:quantum_upgrade' }
    })

    var toolKey = {
      I: { item: 'avaritia:infinity_ingot' },
      N: { item: 'avaritia:neutron_ingot' },
      C: { item: 'avaritia:crystal_matrix' },
      X: { item: 'avaritia:infinity_catalyst' },
      G: { item: 'avaritia:neutron_gear' }
    }

    table('equipment/sword', 'avaritia:infinity_sword', [
      '      III',
      '     III ',
      '    III  ',
      ' C III   ',
      'CCXII    ',
      ' CGN     ',
      ' NG      '
    ], toolKey)
    table('equipment/pickaxe', 'avaritia:infinity_pickaxe', [
      'IIIIIIIII',
      'ICCCXCCCI',
      '    G    ',
      '    N    ',
      '    N    '
    ], toolKey)
    table('equipment/axe', 'avaritia:infinity_axe', [
      ' III ',
      ' ICI ',
      ' IXG ',
      '  N  ',
      '  N  '
    ], toolKey)
    table('equipment/shovel', 'avaritia:infinity_shovel', [
      ' III ',
      ' IXI ',
      '  G  ',
      '  N  ',
      '  N  '
    ], toolKey)
    table('equipment/hoe', 'avaritia:infinity_hoe', [
      'IIIII',
      '  XG ',
      '  N  ',
      '  N  '
    ], toolKey)
    table('equipment/bow', 'avaritia:infinity_bow', [
      '  IN ',
      ' I CN',
      'I X N',
      ' I CN',
      '  IN '
    ], toolKey)
    table('equipment/crossbow', 'avaritia:infinity_crossbow', [
      'NNNNN',
      'ICXCI',
      '  G  ',
      '  I  '
    ], toolKey)
    table('equipment/trident', 'avaritia:infinity_trident', [
      'I I I',
      'IXGXI',
      '  N  ',
      '  N  ',
      '  N  '
    ], toolKey)
    table('equipment/mace', 'avaritia:infinity_mace', [
      ' III ',
      'IXGXI',
      ' III ',
      '  N  ',
      '  N  '
    ], toolKey)
    table('equipment/shield', 'avaritia:infinity_shield', [
      'CIXIC',
      'INNNI',
      'INGNI',
      ' INI '
    ], toolKey)

    table('armor/helmet', 'avaritia:infinity_helmet', [
      'NNNNN',
      'NIXIN',
      'NI IN'
    ], toolKey)
    table('armor/chestplate', 'avaritia:infinity_chestplate', [
      'NN   NN',
      'NII IIN',
      'NIIXIIN',
      'NIIXIIN',
      ' NNNNN '
    ], toolKey)
    table('armor/pants', 'avaritia:infinity_pants', [
      'NNNNN',
      'NIXIN',
      'NI IN',
      'NI IN',
      'NI IN'
    ], toolKey)
    table('armor/boots', 'avaritia:infinity_boots', [
      'NI IN',
      'NI IN',
      'NN NN'
    ], toolKey)
    table('armor/elytra', 'avaritia:infinity_elytra', [
      'N   N',
      'IN NI',
      'IXGXI',
      'I   I'
    ], toolKey)

    table('utility/totem', 'avaritia:infinity_totem', [
      'CXC',
      'NIN',
      ' G '
    ], toolKey)
    table('utility/bucket', 'avaritia:infinity_bucket', [
      'I I',
      'IXI',
      ' I '
    ], toolKey)
    table('utility/clock', 'avaritia:infinity_clock', [
      'CNC',
      'IXI',
      'CNC'
    ], toolKey)
    table('utility/umbrella', 'avaritia:infinity_umbrella', [
      'IIIII',
      'NCXCN',
      '  N  ',
      '  N  '
    ], toolKey)
    table('utility/chest', 'avaritia:infinity_chest', [
      'ICCCI',
      'CNNNC',
      'CNXNC',
      'CNNNC',
      'ICCCI'
    ], toolKey)

    table('creative/ae2_energy_cell', 'ae2:creative_energy_cell', [
      'QQQQQQQ',
      'QIIXIIQ',
      'QICCCIQ',
      'QIXGXIQ',
      'QICCCIQ',
      'QIIXIIQ',
      'QQQQQQQ'
    ], {
      Q: { item: 'ae2:quantum_ring' },
      I: { item: 'avaritia:infinity_ingot' },
      X: { item: 'avaritia:infinity_catalyst' },
      C: { item: 'modern_industrialization:superconductor_coil' },
      G: { item: 'modern_industrialization:singularity' }
    })

    table('creative/mekanism_bin', 'mekanism:creative_bin', [
      'QQQQQ',
      'QIIIQ',
      'QIXIQ',
      'QIIIQ',
      'QQQQQ'
    ], {
      Q: { item: 'mekanism:ultimate_bin' },
      I: { item: 'avaritia:infinity_ingot' },
      X: { item: 'avaritia:infinity_catalyst' }
    })

    table('creative/mekanism_fluid_tank', 'mekanism:creative_fluid_tank', [
      'QQQQQ',
      'QIIIQ',
      'QIXIQ',
      'QIIIQ',
      'QQQQQ'
    ], {
      Q: { item: 'mekanism:ultimate_fluid_tank' },
      I: { item: 'avaritia:infinity_ingot' },
      X: { item: 'avaritia:infinity_catalyst' }
    })

    table('creative/mekanism_chemical_tank', 'mekanism:creative_chemical_tank', [
      'QQQQQ',
      'QIIIQ',
      'QIXIQ',
      'QIIIQ',
      'QQQQQ'
    ], {
      Q: { item: 'mekanism:ultimate_chemical_tank' },
      I: { item: 'avaritia:infinity_ingot' },
      X: { item: 'avaritia:infinity_catalyst' }
    })
  });
  return { ...writer, families };
}
