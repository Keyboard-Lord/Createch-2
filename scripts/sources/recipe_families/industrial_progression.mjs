import { greateSuppliers } from './greate_suppliers.mjs';
import { applyAssemblyPressTiers } from '../campaign_assembly_tiers.mjs';
// Canonical deterministic progression recipes, extracted without value/ID changes.
// Runs only during development generation; the player artifact contains JSON.
import { staticRecipeWriter } from '../../lib/static_recipe_writer.mjs';
import { canonicalizeKineticRecipes, greateProgression } from './greate_progression.mjs';
import { greateIndustry } from './greate_industry.mjs';
import { processFacilities } from './process_facilities.mjs';
import { convergenceStatic } from './convergence_static.mjs';
export const retiredRecipeIds = [
  "createch2:mekanismgenerators/generator/heat",
  "createch2:mekanismgenerators/generator/bio",
  "createch2:mekanismgenerators/generator/gas_burning",
  "createch2:mekanismgenerators/generator/wind",
  "createch2:mekanismgenerators/generator/solar",
  "createch2:bees/low_voltage/honey_generator",
  "createch2:utility_authority/modern_dynamics/item_pipe",
  "createch2:utility_authority/modern_dynamics/fluid_pipe",
  "createch2:utility_authority/modern_dynamics/extractor",
  "createch2:utility_authority/modern_dynamics/attractor",
  "createch2:utility_authority/modern_dynamics/filter",
  "createch2:utility_authority/modern_dynamics/inhibitor",
  "createch2:utility_authority/modern_dynamics/machine_extender",
  "createch2:utility_authority/modern_dynamics/wrench"
];

export function industrialProgression() {
  const writer = staticRecipeWriter();
  const { event, Item, removeRecipe, removeOutputRecipes } = writer;
  const families = [];
  const compileFamily = (name, action) => { const before = writer.calls.length; action(); families.push({ name, recipes: writer.calls.length - before }); };
  // These two first-steel shortcuts bypass the existing THM-02 hot-blast chain.
  // Retain native steel stock reprocessing; only raw iron+coal synthesis retires.
  removeRecipe([{id:'oritech:crafting/alloy/steel'},{id:'oritech:mixing/compat/create/steel'}]);
  compileFamily('TFC geology — worldgen containment', () => {
    var removedVentRecipes = [
      'createch2:vent_processing/crushing/molten_vents/veridium',
      'createch2:vent_processing/crushing/molten_vents/crimsite',
      'createch2:vent_processing/crushing/molten_vents/scoria',
      'createch2:vent_processing/crushing/molten_vents/scorchia'
    ]

    removedVentRecipes.forEach(id => event.remove({ id: id }))

    var crushing = (id, input, results, time) => {
      event.custom({
        type: 'create:crushing',
        ingredients: [{ item: input }],
        processing_time: time,
        results: results
      }).id(id)
    }


    crushing('createch2:tfc_geology/vent_processing/crimsite', 'molten_vents:dormant_molten_crimsite', [
      { id: 'minecraft:redstone', count: 6 },
      { id: 'minecraft:redstone', chance: 0.75 },
      { id: 'create:experience_nugget', chance: 0.75 },
      { id: 'create:crimsite', chance: 0.25 }
    ], 450)

    crushing('createch2:tfc_geology/vent_processing/scoria', 'molten_vents:dormant_molten_scoria', [
      { id: 'minecraft:coal', chance: 0.75 },
      { id: 'tfmg:sulfur_dust', chance: 0.25 },
      { id: 'create:experience_nugget', chance: 0.75 },
      { id: 'create:scoria', chance: 0.25 }
    ], 450)

    crushing('createch2:tfc_geology/vent_processing/scorchia', 'molten_vents:dormant_molten_scorchia', [
      { id: 'tfmg:sulfur_dust', chance: 0.5 },
      { id: 'minecraft:gunpowder', chance: 0.25 },
      { id: 'create:experience_nugget', chance: 0.75 },
      { id: 'create:scorchia', chance: 0.25 }
    ], 450)
  })

  compileFamily('TFC geology — ore processing', () => {
    var directSmeltingMaterials = [
      'aluminum',
      'antimony',
      'beryllium',
      'iridium',
      'lead',
      'lithium',
      'magnesium',
      'manganese',
      'osmium',
      'platinum',
      'thorium',
      'titanium',
      'tungsten',
      'uranium',
      'zirconium'
    ]

    var directSmeltingFilters = []
    directSmeltingMaterials.forEach(material => {
      directSmeltingFilters.push(
        { input: `#c:ores/${material}`, output: `#c:ingots/${material}`, type: 'minecraft:smelting' },
        { input: `#c:ores/${material}`, output: `#c:ingots/${material}`, type: 'minecraft:blasting' },
        { input: `#c:raw_materials/${material}`, output: `#c:ingots/${material}`, type: 'minecraft:smelting' },
        { input: `#c:raw_materials/${material}`, output: `#c:ingots/${material}`, type: 'minecraft:blasting' }
      )
    })
    removeRecipe(directSmeltingFilters)

    var physicalMinerals = [
      'bauxite',
      'bertrandite',
      'certus_quartz',
      'chromite',
      'cobaltite',
      'galena',
      'kernite',
      'magnesite',
      'monazite',
      'native_iridium',
      'native_osmium',
      'native_platinum',
      'pyrolusite',
      'rutile',
      'spodumene',
      'stibnite',
      'uraninite',
      'wolframite',
      'zircon'
    ]

    removeRecipe({ id: /^tfc_metallurgy:heating\/ore\/.*$/ })
    removeRecipe({ id: /^firmalife:heating\/ore\/.*chromite.*$/ })
    // Sweep every installed processing backend first. Canonical routes are
    // added below after this removal, so newly installed enrichment,
    // dissolution, casting, compacting, bee, seed, or furnace recipes cannot
    // silently outrank the pack-owned graded chain.
    removeRecipe(physicalMinerals.map(mineral => ({ input: `#createch2:tfc_ores/${mineral}` })))

    // Galena is the first conventional graded-ore chain. TFC Metallurgy
    // retains physical geology, Create performs mechanical preparation, and
    // Modern Industrialization owns the canonical Lead and Silver outputs.
    var galenaGrades = [
      ['small', 'tfc_metallurgy:ore/small_galena', 1],
      ['poor', '#createch2:geology/ores/galena/poor', 1],
      ['normal', '#createch2:geology/ores/galena/normal', 2],
      ['rich', '#createch2:geology/ores/galena/rich', 3]
    ]

    // TFMG Galena generation is disabled by the datapack. Remove any surviving
    // native consumption route so it cannot become a parallel Lead source.
    removeRecipe({ input: 'tfmg:galena' })

    // Reuse Create's installed crushed-lead form instead of registering a
    // pack-owned Galena item. Its alternate production and processing routes
    // are removed so this remains a closed, graded Galena workstream.
    removeOutputRecipes(['create:crushed_raw_lead'])
    removeRecipe({ input: 'create:crushed_raw_lead' })

    galenaGrades.forEach(([grade, input, amount]) => {
      var ingredient = input.startsWith('#')
        ? { tag: input.substring(1) }
        : { item: input }

      event.custom({
        type: 'create:crushing',
        ingredients: [ingredient],
        processing_time: 250,
        results: [
          { id: 'create:crushed_raw_lead', count: amount }
        ]
      }).id(`createch2:materials/galena/crushing/${grade}`)
    })

    event.custom({
      type: 'create:splashing',
      ingredients: [
        { item: 'create:crushed_raw_lead' }
      ],
      results: [
        { id: 'modern_industrialization:lead_tiny_dust' },
        { id: 'modern_industrialization:silver_tiny_dust', chance: 0.05 }
      ]
    }).id('createch2:materials/galena/concentrating/crushed')

    // TFC Metallurgy owns the End-hosted Certus deposit. AE2 begins only after
    // that physical ore has passed through an electric Digital-Age separator;
    // the host-rock block is never interchangeable with an AE2 crystal.
    event.custom({
      type: 'modern_industrialization:macerator',
      eu: 32,
      duration: 300,
      item_inputs: [
        {
          tag: 'createch2:tfc_ores/certus_quartz/normal',
          amount: 1
        },
        {
          item: 'modern_industrialization:digital_circuit',
          amount: 1,
          probability: 0
        }
      ],
      item_outputs: [
        {
          item: 'ae2:certus_quartz_crystal',
          amount: 2
        },
        {
          item: 'ae2:certus_quartz_dust',
          amount: 1,
          probability: 0.25
        }
      ]
    }).id('createch2:tfc_geology/digital/certus_quartz/normal')

    // First ordinary industrial iron follows earned TFC wrought metallurgy.
    // Preserve the native MI ingot-milling cost and100-unit one-to-one yield;
    // this explicit handoff does not merge cast/wrought into ordinary iron tags.
    event.custom({
      type: 'modern_industrialization:macerator',
      eu: 2,
      duration: 200,
      item_inputs: [{ item: 'tfc:metal/ingot/wrought_iron', amount: 1 }],
      item_outputs: [{ item: 'modern_industrialization:iron_dust', amount: 1 }]
    }).id('createch2:tfc_geology/bronze_steam/iron_dust_from_wrought_iron')

    // Age-2 precision precedes the precision-controlled bronze macerator.
    // Mechanically divide earned wrought metal into the ordinary nine-part
    // form; do not merge cast/wrought tags or change the later steam-dust path.
    event.custom({
      type: 'greate:cutting',
      recipe_tier: 0,
      processing_time: 200,
      ingredients: [{ item: 'tfc:metal/ingot/wrought_iron' }],
      results: [{ id: 'minecraft:iron_nugget', count: 9 }]
    }).id('createch2:tfc_geology/mechanical/iron_nuggets_from_wrought_iron')

    // Every retained physical mineral has one explicit age-owned entry route.
    // Small ores are discovery samples; poor/normal/rich blocks are process
    // feedstock. Higher EU values deliberately require later MI voltage tiers.
    var gradedMineralRoutes = [
      {
        mineral: 'bauxite',
        age: 'advanced_electric',
        // Ordinary electronic circuit boards already consume aluminum. The
        // first bauxite batch retains LV control and its own MAT-03 research.
        catalyst: 'modern_industrialization:analog_circuit',
        eu: 32,
        duration: 320,
        output: 'modern_industrialization:bauxite_crushed_dust'
      },
      {
        mineral: 'chromite',
        age: 'advanced_electric',
        eu: 32,
        duration: 360,
        output: 'modern_industrialization:chromium_crushed_dust'
      },
      {
        mineral: 'pyrolusite',
        age: 'advanced_electric',
        eu: 32,
        duration: 320,
        output: 'modern_industrialization:manganese_crushed_dust'
      },
      {
        mineral: 'magnesite',
        age: 'advanced_electric',
        eu: 32,
        duration: 360,
        output: 'gtceu:magnesium_dust'
      },
      {
        mineral: 'stibnite',
        age: 'advanced_electric',
        eu: 32,
        duration: 360,
        output: 'modern_industrialization:antimony_dust'
      },
      {
        mineral: 'cobaltite',
        age: 'high_pressure',
        eu: 64,
        duration: 420,
        output: 'gtceu:cobalt_dust'
      },
      {
        mineral: 'kernite',
        age: 'high_pressure',
        eu: 64,
        duration: 420,
        output: 'chemlib:boron_dust'
      },
      {
        mineral: 'spodumene',
        age: 'high_pressure',
        eu: 64,
        duration: 480,
        output: 'tfmg:crushed_raw_lithium'
      },
      {
        mineral: 'native_osmium',
        age: 'pgm_foundation',
        eu: 128,
        duration: 520,
        output: 'chemlib:osmium_dust'
      },
      {
        mineral: 'native_platinum',
        age: 'pgm_foundation',
        eu: 128,
        duration: 520,
        output: 'modern_industrialization:platinum_dust'
      },
      {
        mineral: 'native_iridium',
        age: 'pgm_foundation',
        eu: 128,
        duration: 600,
        output: 'modern_industrialization:iridium_dust'
      },
      {
        mineral: 'monazite',
        age: 'pgm_foundation',
        eu: 128,
        duration: 600,
        output: 'modern_industrialization:monazite_crushed_dust'
      },
      {
        mineral: 'wolframite',
        age: 'quantum',
        eu: 128,
        duration: 640,
        output: 'modern_industrialization:tungsten_dust'
      },
      {
        mineral: 'bertrandite',
        age: 'quantum',
        eu: 128,
        duration: 640,
        output: 'modern_industrialization:beryllium_dust'
      }
    ]

    var gradeYield = {
      poor: 1,
      normal: 2,
      rich: 3
    }

    var mineralGateByAge = {
      advanced_electric: 'modern_industrialization:electronic_circuit',
      high_pressure: 'modern_industrialization:processing_unit',
      pgm_foundation: 'modern_industrialization:digital_circuit',
      quantum: 'modern_industrialization:quantum_circuit'
    }

    gradedMineralRoutes.forEach(route => {
      Object.entries(gradeYield).forEach(([grade, amount]) => {
        event.custom({
          type: 'modern_industrialization:macerator',
          eu: route.eu,
          duration: route.duration,
          item_inputs: [
            {
              tag: `createch2:tfc_ores/${route.mineral}/${grade}`,
              amount: 1
            },
            {
              item: route.catalyst || mineralGateByAge[route.age],
              amount: 1,
              probability: 0
            }
          ],
          item_outputs: [
            {
              item: route.output,
              amount: amount
            }
          ]
        }).id(
          `createch2:tfc_geology/${route.age}/${route.mineral}/${grade}`
        )
      })
    })

  })

  compileFamily('Fluid compatibility', () => {
    var fluid = (id, amount) => ({
      type: 'neoforge:single',
      fluid: id,
      amount: amount
    })

    var mixingBridge = (id, input, output, amount) => {
      event.custom({
        type: 'create:mixing',
        ingredients: [fluid(input, amount)],
        results: [{ id: output, amount: amount }]
      }).id(id)
    }

    // Modern Industrialization defines the industrial Age. These bridges let
    // supporting chemistry systems hand equivalent fluids into the MI ladder
    // without giving any route better yields.
    mixingBridge('createch2:fluid_compat/tfmg_ethylene_to_mi', 'tfmg:ethylene', 'modern_industrialization:ethylene', 500)
    mixingBridge('createch2:fluid_compat/mi_ethylene_to_tfmg', 'modern_industrialization:ethylene', 'tfmg:ethylene', 500)
    mixingBridge('createch2:fluid_compat/mek_ethene_to_mi_ethylene', 'mekanism:ethene', 'modern_industrialization:ethylene', 500)
    mixingBridge('createch2:fluid_compat/mi_ethylene_to_mek_ethene', 'modern_industrialization:ethylene', 'mekanism:ethene', 500)

    mixingBridge('createch2:fluid_compat/tfmg_hydrogen_to_mi', 'tfmg:hydrogen', 'modern_industrialization:hydrogen', 500)
    mixingBridge('createch2:fluid_compat/mi_hydrogen_to_tfmg', 'modern_industrialization:hydrogen', 'tfmg:hydrogen', 500)
    mixingBridge('createch2:fluid_compat/mek_hydrogen_to_mi', 'mekanism:hydrogen', 'modern_industrialization:hydrogen', 500)
    mixingBridge('createch2:fluid_compat/mi_hydrogen_to_mek', 'modern_industrialization:hydrogen', 'mekanism:hydrogen', 500)

    mixingBridge('createch2:fluid_compat/tfmg_sulfuric_acid_to_mi', 'tfmg:sulfuric_acid', 'modern_industrialization:sulfuric_acid', 500)
    mixingBridge('createch2:fluid_compat/mi_sulfuric_acid_to_tfmg', 'modern_industrialization:sulfuric_acid', 'tfmg:sulfuric_acid', 500)
    mixingBridge('createch2:fluid_compat/mek_sulfuric_acid_to_mi', 'mekanism:sulfuric_acid', 'modern_industrialization:sulfuric_acid', 500)
    mixingBridge('createch2:fluid_compat/mi_sulfuric_acid_to_mek', 'modern_industrialization:sulfuric_acid', 'mekanism:sulfuric_acid', 500)

    mixingBridge('createch2:fluid_compat/tfmg_diesel_to_mi', 'tfmg:diesel', 'modern_industrialization:diesel', 1000)
    mixingBridge('createch2:fluid_compat/mi_diesel_to_tfmg', 'modern_industrialization:diesel', 'tfmg:diesel', 1000)
    mixingBridge('createch2:fluid_compat/tfmg_naphtha_to_mi', 'tfmg:naphtha', 'modern_industrialization:naphtha', 1000)
    mixingBridge('createch2:fluid_compat/mi_naphtha_to_tfmg', 'modern_industrialization:naphtha', 'tfmg:naphtha', 1000)
    mixingBridge('createch2:fluid_compat/tfmg_lubrication_oil_to_mi_lubricant', 'tfmg:lubrication_oil', 'modern_industrialization:lubricant', 1000)
    mixingBridge('createch2:fluid_compat/mi_lubricant_to_tfmg_lubrication_oil', 'modern_industrialization:lubricant', 'tfmg:lubrication_oil', 1000)

    // Finished Chemica products feed the shared chemical and polymer economy.
    // One-way conditioning retains native vat/casting identities and every mB.
    mixingBridge('createch2:fluid_compat/chemica_polyethylene_to_mi', 'chemica:polyethylene', 'modern_industrialization:polyethylene', 500)
    mixingBridge('createch2:fluid_compat/chemica_polyvinyl_chloride_to_mi', 'chemica:polyvinyl_chloride', 'modern_industrialization:polyvinyl_chloride', 500)
    mixingBridge('createch2:fluid_compat/chemica_hydrochloric_acid_to_mi', 'chemica:hydrochloric_acid', 'modern_industrialization:hydrochloric_acid', 500)
  })

  compileFamily('Age 0 — Stone', () => {
    var removeOutputs = outputs => removeOutputRecipes(outputs)

    removeOutputs([
      'animaltrap:empty',
      'animaltrap:small_animals_bait',
      'animaltrap:twine',
      'toolbelt:belt',
      'toolbelt:pouch'
    ])

    event.shaped(Item.of('animaltrap:empty', 2), [
      'LLL',
      'S S',
      'LLL'
    ], {
      L: '#tfc:lumber',
      S: 'minecraft:stick'
    }).id('createch2:stone_age/animaltrap/empty')

    event.shapeless('animaltrap:twine', [
      '#c:strings',
      '#c:strings'
    ]).id('createch2:stone_age/animaltrap/twine')

    event.shapeless('animaltrap:small_animals_bait', [
      '#c:seeds',
      '#c:seeds',
      'tfc:food/barley_grain',
      'tfc:food/oat_grain'
    ]).id('createch2:stone_age/animaltrap/small_animals_bait')

    event.shaped('toolbelt:belt', [
      'SLS',
      'L L',
      'LCL'
    ], {
      S: '#c:strings',
      L: '#c:leathers',
      C: '#c:ingots/copper'
    }).id('createch2:copper_age/toolbelt/belt')

    event.shaped('toolbelt:pouch', [
      'SBS',
      'L L',
      'SLS'
    ], {
      S: '#c:strings',
      L: '#c:leathers',
      B: '#c:ingots/bronze'
    }).id('createch2:alloy_age/toolbelt/pouch')

    // Backpacked is already staged below with bronze plates, Create belts,
    // and steel/precision dock materials.
  })

  compileFamily('Age 1 — Copper', () => {
    var firedClay = 'minecraft:brick'
    var clearGlass = 'minecraft:glass'

    event.remove({ id: 'astikorcartsredux:wheel' })
    removeRecipe({ id: /^astikorcartsredux:.*_(?:hand_cart|supply_cart|animal_cart|plow|reaper|seed_drill)$/ })
    removeRecipe({ id: /^tfcastikorcarts:crafting\/(?:wheel|hand_cart|supply_cart|animal_cart|plow|reaper|seed_drill)\/.*$/ })

    event.shaped('astikorcartsredux:wheel', [
      'SCS',
      'CPC',
      'SCS'
    ], {
      S: 'minecraft:stick',
      C: '#c:ingots/copper',
      P: '#minecraft:planks'
    }).id('createch2:copper_age/astikorcartsredux/wheel')

    var vanillaWoods = [
      'oak',
      'spruce',
      'birch',
      'jungle',
      'acacia',
      'dark_oak',
      'mangrove',
      'bamboo',
      'crimson',
      'warped'
    ]

    vanillaWoods.forEach(wood => {
      var planks = `minecraft:${wood}_planks`

      event.shaped(`astikorcartsredux:${wood}_hand_cart`, [
        'PCP',
        'RWR',
        'B B'
      ], {
        P: planks,
        C: '#c:chests/wooden',
        R: '#c:rods/wooden',
        W: 'astikorcartsredux:wheel',
        B: '#c:ingots/copper'
      }).id(`createch2:copper_age/astikorcartsredux/${wood}_hand_cart`)

      event.shaped(`astikorcartsredux:${wood}_supply_cart`, [
        'PCP',
        'PCP',
        'BWB'
      ], {
        P: planks,
        C: '#c:chests/wooden',
        W: 'astikorcartsredux:wheel',
        B: '#c:ingots/copper'
      }).id(`createch2:copper_age/astikorcartsredux/${wood}_supply_cart`)

      event.shaped(`astikorcartsredux:${wood}_animal_cart`, [
        'PPP',
        'LPL',
        'BWB'
      ], {
        P: planks,
        L: '#c:leathers',
        W: 'astikorcartsredux:wheel',
        B: '#c:ingots/copper'
      }).id(`createch2:copper_age/astikorcartsredux/${wood}_animal_cart`)

      event.shaped(`astikorcartsredux:${wood}_plow`, [
        'STS',
        'PBP',
        'CWC'
      ], {
        S: '#c:rods/wooden',
        T: '#c:ingots/copper',
        P: planks,
        B: '#c:ingots/copper',
        W: 'astikorcartsredux:wheel',
        C: '#c:ingots/copper'
      }).id(`createch2:copper_age/astikorcartsredux/${wood}_plow`)

      event.shaped(`astikorcartsredux:${wood}_reaper`, [
        ' S#',
        'SPP',
        'BWW'
      ], {
        S: '#c:rods/wooden',
        '#': '#c:ingots/bronze',
        P: planks,
        B: '#c:ingots/bronze',
        W: 'astikorcartsredux:wheel'
      }).id(`createch2:alloy_age/astikorcartsredux/${wood}_reaper`)

      event.shaped(`astikorcartsredux:${wood}_seed_drill`, [
        'PCP',
        'BHB',
        'PWP'
      ], {
        P: planks,
        C: '#c:chests/wooden',
        B: '#c:ingots/bronze',
        H: 'minecraft:hopper',
        W: 'astikorcartsredux:wheel'
      }).id(`createch2:alloy_age/astikorcartsredux/${wood}_seed_drill`)
    })

    var tfcWoods = [
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

    tfcWoods.forEach(wood => {
      var planks = `tfc:wood/planks/${wood}`
      var wheel = `tfcastikorcarts:wheel/${wood}`

      event.shaped(wheel, [
        'SCS',
        'CPC',
        'SCS'
      ], {
        S: '#c:rods/wooden',
        C: '#c:ingots/copper',
        P: planks
      }).id(`createch2:copper_age/tfcastikorcarts/wheel/${wood}`)

      event.shaped(`tfcastikorcarts:hand_cart/${wood}`, [
        'PCP',
        'RWR',
        'B B'
      ], {
        P: planks,
        C: '#c:chests/wooden',
        R: '#c:rods/wooden',
        W: wheel,
        B: '#c:ingots/copper'
      }).id(`createch2:copper_age/tfcastikorcarts/hand_cart/${wood}`)

      event.shaped(`tfcastikorcarts:supply_cart/${wood}`, [
        'PCP',
        'PCP',
        'BWB'
      ], {
        P: planks,
        C: '#c:chests/wooden',
        W: wheel,
        B: '#c:ingots/copper'
      }).id(`createch2:copper_age/tfcastikorcarts/supply_cart/${wood}`)

      event.shaped(`tfcastikorcarts:animal_cart/${wood}`, [
        'PPP',
        'LPL',
        'BWB'
      ], {
        P: planks,
        L: '#c:leathers',
        W: wheel,
        B: '#c:ingots/copper'
      }).id(`createch2:copper_age/tfcastikorcarts/animal_cart/${wood}`)

      event.shaped(`tfcastikorcarts:plow/${wood}`, [
        'STS',
        'PBP',
        'CWC'
      ], {
        S: '#c:rods/wooden',
        T: '#c:ingots/copper',
        P: planks,
        B: '#c:ingots/copper',
        W: wheel,
        C: '#c:ingots/copper'
      }).id(`createch2:copper_age/tfcastikorcarts/plow/${wood}`)

      event.shaped(`tfcastikorcarts:reaper/${wood}`, [
        ' S#',
        'SPP',
        'BWW'
      ], {
        S: '#c:rods/wooden',
        '#': '#c:ingots/bronze',
        P: planks,
        B: '#c:ingots/bronze',
        W: wheel
      }).id(`createch2:alloy_age/tfcastikorcarts/reaper/${wood}`)

      event.shaped(`tfcastikorcarts:seed_drill/${wood}`, [
        'PCP',
        'BHB',
        'PWP'
      ], {
        P: planks,
        C: '#c:chests/wooden',
        B: '#c:ingots/bronze',
        H: 'minecraft:hopper',
        W: wheel
      }).id(`createch2:alloy_age/tfcastikorcarts/seed_drill/${wood}`)
    })

    removeOutputRecipes([
      'cookingforblockheads:recipe_book',
      'cookingforblockheads:crafting_book',
      'cookingforblockheads:no_filter_edition',
      'cookingforblockheads:cooking_table',
      'cookingforblockheads:counter',
      'cookingforblockheads:cabinet',
      'cookingforblockheads:connector',
      'cookingforblockheads:tool_rack',
      'cookingforblockheads:fruit_basket',
      'cookingforblockheads:white_oven',
      'cookingforblockheads:sink',
      'cookingforblockheads:white_fridge',
      'cookingforblockheads:ice_unit'
    ])

    event.shapeless('cookingforblockheads:recipe_book', [
      'minecraft:book',
      'minecraft:paper',
      '#c:ingots/copper'
    ]).id('createch2:copper_age/cookingforblockheads/recipe_book')

    event.shaped('cookingforblockheads:no_filter_edition', [
      ' P ',
      'PBP',
      ' P '
    ], {
      P: 'minecraft:paper',
      B: 'cookingforblockheads:recipe_book'
    }).id('createch2:copper_age/cookingforblockheads/no_filter_edition')

    event.shaped('cookingforblockheads:crafting_book', [
      ' C ',
      'WBW',
      ' C '
    ], {
      C: '#c:ingots/copper',
      W: '#c:chests/wooden',
      B: 'cookingforblockheads:recipe_book'
    }).id('createch2:copper_age/cookingforblockheads/crafting_book')

    event.shaped('cookingforblockheads:cooking_table', [
      'SSS',
      'CBC',
      'TTT'
    ], {
      S: '#c:stones',
      C: '#c:ingots/copper',
      B: 'cookingforblockheads:crafting_book',
      T: firedClay
    }).id('createch2:copper_age/cookingforblockheads/cooking_table')

    event.shaped('cookingforblockheads:counter', [
      'SSS',
      'CBC',
      'TTT'
    ], {
      S: '#c:stones',
      C: '#c:ingots/copper',
      B: '#c:chests/wooden',
      T: firedClay
    }).id('createch2:copper_age/cookingforblockheads/counter')

    event.shaped('cookingforblockheads:cabinet', [
      'TCT',
      'TBT'
    ], {
      T: firedClay,
      C: '#c:ingots/copper',
      B: '#c:chests/wooden'
    }).id('createch2:copper_age/cookingforblockheads/cabinet')

    event.shaped('cookingforblockheads:connector', [
      'SSS',
      'TCT',
      'TTT'
    ], {
      S: '#c:stones',
      T: firedClay,
      C: '#c:ingots/copper'
    }).id('createch2:copper_age/cookingforblockheads/connector')

    event.shaped('cookingforblockheads:tool_rack', [
      'SSS',
      'C C'
    ], {
      S: '#minecraft:wooden_slabs',
      C: '#c:ingots/copper'
    }).id('createch2:copper_age/cookingforblockheads/tool_rack')

    event.shaped('cookingforblockheads:fruit_basket', [
      'SPS',
      ' C '
    ], {
      S: '#minecraft:wooden_slabs',
      P: '#minecraft:wooden_pressure_plates',
      C: '#c:ingots/copper'
    }).id('createch2:copper_age/cookingforblockheads/fruit_basket')

    event.shaped('cookingforblockheads:white_oven', [
      'GGG',
      'CFC',
      'CCC'
    ], {
      G: clearGlass,
      C: '#c:ingots/copper',
      F: 'minecraft:furnace'
    }).id('createch2:copper_age/cookingforblockheads/white_oven')

    event.shaped('cookingforblockheads:sink', [
      'PPP',
      'WBW',
      'TTT'
    ], {
      P: '#c:plates/steel',
      W: 'minecraft:water_bucket',
      B: '#createch2:containers/metal_bucket',
      T: firedClay
    }).id('createch2:steel_age/cookingforblockheads/sink')

    event.shapeless('cookingforblockheads:white_fridge', [
      '#c:plates/steel',
      '#c:chests/wooden',
      'cookingforblockheads:ice_unit'
    ]).id('createch2:steel_age/cookingforblockheads/white_fridge')

    event.shaped('cookingforblockheads:ice_unit', [
      'SSS',
      'PCP',
      'PPP'
    ], {
      S: 'minecraft:snowball',
      P: '#c:plates/steel',
      C: 'minecraft:comparator'
    }).id('createch2:steel_age/cookingforblockheads/ice_unit')
  })

  compileFamily('Age 4 — Heavy Industry', () => {
    ;[
      'tfmg:crafting/materials/oil_can',
      'tfmg:crafting/materials/oil_hammer',
      'tfmg:crafting/materials/pumpjack_base',
      'tfmg:crafting/materials/pumpjack_crank',
      'tfmg:crafting/materials/pumpjack_hammer',
      'tfmg:crafting/materials/pumpjack_hammer_connector',
      'tfmg:crafting/materials/pumpjack_hammer_head',
      'tfmg:crafting/materials/steel_distillation_controller',
      'tfmg:crafting/materials/steel_distillation_output',
      'tfmg:vat_machine_recipe/rubber',
      'tfmg:vat_machine_recipe/naphtha'
    ].forEach(id => event.remove({ id: id }))

    // TFMG owns sealed heavy-industry carbonization and its process-gas
    // stream. Railcraft owns creosote and rail-fuel coking. Removing the TFMG
    // log route and its creosote coproduct prevents the two ovens from teaching
    // exact-equivalent jobs in the same age window.
    event.remove({ id: 'tfmg:coking/coal' })
    event.remove({ id: 'tfmg:coking/charcoal' })
    event.custom({
      type: 'tfmg:coking',
      ingredients: [{ tag: 'createch2:geology/coking_coal' }],
      processing_time: 1200,
      results: [
        { id: 'tfmg:coal_coke' },
        // Paired Core retains the existing optional second-fluid contract.
        { amount: 30, id: 'tfmg:carbon_dioxide' }
      ]
    }).id('createch2:heavy_industry/tfmg/process_gas_coking')

    removeOutputRecipes([
      'tfmg:oil_can',
      'tfmg:oil_hammer',
      'tfmg:pumpjack_base',
      'tfmg:pumpjack_crank',
      'tfmg:pumpjack_hammer',
      'tfmg:pumpjack_hammer_connector',
      'tfmg:pumpjack_hammer_head',
      'tfmg:steel_distillation_controller',
      'tfmg:steel_distillation_output'
    ])

    event.shaped('rubberworks:compressor', [
      ' S ',
      'BCB',
      'PMP'
    ], {
      S: 'create:shaft',
      B: '#c:plates/cast_iron',
      C: 'create:brass_casing',
      P: 'create:fluid_pipe',
      M: 'create:precision_mechanism'
    }).id('createch2:heavy_industry/rubberworks/compressor')

    event.shaped('tfmg:oil_can', [
      ' BB',
      'TBB',
      ' TT'
    ], {
      B: 'create:brass_sheet',
      T: '#c:plates/tin'
    }).id('createch2:heavy_industry/tfmg/oil_can')

    event.shaped('tfmg:oil_hammer', [
      ' B ',
      'CBC',
      ' I '
    ], {
      B: '#createch2:materials/bronze/machine_grade',
      C: '#c:plates/cast_iron',
      I: '#c:rods/iron'
    }).id('createch2:heavy_industry/tfmg/oil_hammer')

    event.shaped('tfmg:pumpjack_hammer_head', [
      'C',
      'B',
      'C'
    ], {
      C: '#c:storage_blocks/cast_iron',
      B: '#createch2:materials/bronze/machine_grade'
    }).id('createch2:heavy_industry/tfmg/pumpjack_hammer_head')

    event.shaped('tfmg:pumpjack_hammer_connector', [
      ' R ',
      'RBR',
      ' R '
    ], {
      R: 'tfmg:cast_iron_truss',
      B: '#createch2:materials/bronze/machine_grade'
    }).id('createch2:heavy_industry/tfmg/pumpjack_hammer_connector')

    event.shaped('tfmg:pumpjack_hammer', [
      'RCR',
      'BHB',
      ' T '
    ], {
      R: 'tfmg:cast_iron_truss',
      C: 'tfmg:pumpjack_hammer_connector',
      B: '#createch2:materials/bronze/machine_grade',
      H: 'tfmg:pumpjack_hammer_head',
      T: 'tfmg:cast_iron_truss'
    }).id('createch2:heavy_industry/tfmg/pumpjack_hammer')

    event.shaped('tfmg:pumpjack_crank', [
      'S S',
      'BMB',
      'TCT'
    ], {
      S: '#c:strings',
      B: 'create:brass_sheet',
      M: 'create:precision_mechanism',
      T: 'tfmg:cast_iron_truss',
      C: 'create:brass_casing'
    }).id('createch2:heavy_industry/tfmg/pumpjack_crank')

    event.shaped('tfmg:pumpjack_base', [
      'STS',
      'MCM',
      'PQP'
    ], {
      S: '#c:strings',
      T: 'tfmg:cast_iron_fluid_tank',
      M: 'create:precision_mechanism',
      C: 'tfmg:cast_iron_chemical_vat',
      P: 'tfmg:cast_iron_pipe',
      Q: 'tfmg:cast_iron_mechanical_pump'
    }).id('createch2:heavy_industry/tfmg/pumpjack_base')

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'tfmg:cast_iron_chemical_vat' },
      transitional_item: { id: 'tfmg:cast_iron_chemical_vat' },
      loops: 1,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:cast_iron_chemical_vat' }, { item: 'tfmg:cast_iron_pipe' }],
          results: [{ id: 'tfmg:cast_iron_chemical_vat' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:cast_iron_chemical_vat' }, { item: 'tfmg:cast_iron_mechanical_pump' }],
          results: [{ id: 'tfmg:cast_iron_chemical_vat' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:cast_iron_chemical_vat' }, { item: 'create:precision_mechanism' }],
          results: [{ id: 'tfmg:cast_iron_chemical_vat' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:cast_iron_chemical_vat' }, { item: 'create:electron_tube' }],
          results: [{ id: 'tfmg:cast_iron_chemical_vat' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:cast_iron_chemical_vat' }, { tag: 'c:plates/lead' }],
          results: [{ id: 'tfmg:cast_iron_chemical_vat' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:cast_iron_chemical_vat' }, { item: 'minecraft:compass' }],
          results: [{ id: 'tfmg:cast_iron_chemical_vat' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'tfmg:cast_iron_chemical_vat' },
            { type: 'neoforge:single', amount: 250, fluid: 'tfmg:lubrication_oil' }
          ],
          results: [{ id: 'tfmg:cast_iron_chemical_vat' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'tfmg:cast_iron_chemical_vat' }],
          results: [{ id: 'tfmg:cast_iron_chemical_vat' }]
        }
      ],
      results: [{ id: 'tfmg:steel_distillation_controller' }]
    }).id('createch2:heavy_industry/tfmg/distillation_controller')

    event.shaped('tfmg:steel_distillation_output', [
      'PTP',
      'TBT',
      'PTP'
    ], {
      P: 'tfmg:cast_iron_pipe',
      T: 'tfmg:cast_iron_fluid_tank',
      B: 'create:brass_casing'
    }).id('createch2:heavy_industry/tfmg/distillation_output')

    // The global steel-output authority retires TFMG's native tank along with
    // steel stock. Restore this required tower/firebox body through one owned
    // recipe, retaining its two heavy plates / two tanks and earlier barrel.
    event.shaped(Item.of('tfmg:steel_fluid_tank', 2), [' P ', ' B ', ' P '], {
      P: 'tfmg:heavy_plate',
      B: '#createch2:wooden_barrels'
    }).id('createch2:heavy_industry/tfmg/steel_fluid_tank')

    // The same broad steel-output retirement also removes the CE chemical
    // vessel required by steel-only polymer reactions. Preserve its native
    // six-heavy-plate, two-nickel-plate, one-tank bill and two-vat yield.
    event.shaped(Item.of('tfmg:steel_chemical_vat', 2), ['PPP', 'NTN', 'PPP'], {
      P: 'tfmg:heavy_plate',
      N: '#c:plates/nickel',
      T: 'tfmg:steel_fluid_tank'
    }).id('createch2:heavy_industry/tfmg/steel_chemical_vat')

    // The canonical nugget form is still consumed by native cable connectors,
    // but broad steel-output retirement removes all native fraction suppliers.
    // Retain the native one-ingot/nine-nugget bill through this explicit owner.
    event.shapeless(Item.of('tfmg:steel_nugget', 9), ['#c:ingots/steel'])
      .id('createch2:steel_steam/tfmg/steel_nuggets')

    // Native heatproof casings need the200-unit industrial gear, before the
    // electric cutter and solder plant. Machine the existing400-unit heavy
    // gear explicitly; the ordinary gear tag still excludes that larger form.
    event.custom({
      type: 'greate:cutting',
      recipe_tier: 0,
      processing_time: 200,
      ingredients: [{ item: 'railcraft:invar_gear' }],
      results: [{ id: 'modern_industrialization:invar_gear', count: 2 }]
    }).id('createch2:steel_steam/mi/invar_gear_from_heavy')

    // Compose the earlier TFC mineral powders with the installed native acid
    // batch. Keep the native dust route and every non-feedstock field intact.
    event.custom({
      type: 'tfmg:vat_machine_recipe',
      allowed_vat_types: ['tfmg:steel', 'tfmg:fireproof'],
      ingredients: [
        { item: 'tfc:powder/sulfur' },
        { item: 'tfc:powder/sulfur' },
        { item: 'tfc:powder/sulfur' },
        { item: 'tfc:powder/saltpeter' },
        { type: 'neoforge:single', amount: 1000, fluid: 'minecraft:water' }
      ],
      machines: ['tfmg:mixing'],
      min_size: 1,
      results: [{ amount: 500, id: 'tfmg:sulfuric_acid' }]
    }).id('createch2:heavy_industry/tfmg/sulfuric_acid_tfc_minerals')

    // Preserve MI's native salt-electrolysis batch while accepting the private
    // TFC chemistry-salt handoff already used by the applied-chemistry routes.
    event.custom({
      type: 'modern_industrialization:electrolyzer',
      eu: 8,
      duration: 400,
      item_inputs: { tag: 'createch2:chemical_salt', amount: 2 },
      item_outputs: { item: 'modern_industrialization:sodium_dust', amount: 1 },
      fluid_outputs: { fluid: 'modern_industrialization:chlorine', amount: 125 }
    }).id('createch2:chemical_age/mi/chlorine_from_geological_salt')

    // The active TFC mine drops bituminous coal, while MI's native dust
    // manufacturer accepts vanilla coal. Retain its full grinding bill.
    event.custom({
      type: 'modern_industrialization:macerator',
      duration: 100,
      eu: 2,
      item_inputs: [{ amount: 1, tag: 'createch2:geology/coking_coal' }],
      item_outputs: [{ amount: 1, item: 'modern_industrialization:coal_dust' }]
    }).id('createch2:chemical_age/mi/coal_dust_from_geological_coal')

    event.custom({
      type: 'tfmg:vat_machine_recipe',
      allowed_vat_types: [
        'tfmg:cast_iron',
        'tfmg:steel',
        'tfmg:fireproof'
      ],
      heat_level: 1,
      ingredients: [
        {
          type: 'neoforge:single',
          amount: 500,
          fluid: 'tfmg:naphtha'
        }
      ],
      machines: [
        'tfmg:mixing'
      ],
      min_size: 1,
      results: [
        { amount: 250, id: 'tfmg:ethylene' },
        { amount: 250, id: 'tfmg:propylene' }
      ]
    }).id('createch2:heavy_industry/tfmg/naphtha_cast_iron_vat')


    event.shaped(Item.of('railcraft:coke_oven_bricks', 4), [
      'FFF',
      'CBC',
      'FFF'
    ], {
      F: 'tfc:fire_bricks',
      C: '#c:plates/cast_iron',
      B: 'modern_industrialization:fire_clay_bricks'
    }).id('createch2:heavy_industry/railcraft/coke_oven_bricks')
  })

  compileFamily('Age 6 — Low Voltage', () => {
    // Shared electric motion begins in the mechanical factory. The crafting
    // route bootstraps the first assembler; batch assembly keeps that supplier.
    removeOutputRecipes(['modern_industrialization:motor'])
    event.shaped('modern_industrialization:motor', [
      'CWC',
      'RMR',
      'WPW'
    ], {
      C: 'modern_industrialization:tin_cable',
      W: 'modern_industrialization:copper_wire',
      R: '#c:rods/steel',
      M: 'modern_industrialization:steel_rod_magnetic',
      P: 'create:precision_mechanism'
    }).id('createch2:low_voltage/mi/basic_motor_prototype')

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 8,
      duration: 400,
      item_inputs: [
        { item: 'modern_industrialization:steel_rod_magnetic', amount: 2 },
        { tag: 'c:rods/steel', amount: 4 },
        { item: 'modern_industrialization:tin_cable', amount: 4 },
        { item: 'modern_industrialization:copper_wire', amount: 8 },
        { item: 'create:precision_mechanism', amount: 2 }
      ],
      fluid_inputs: { fluid: 'modern_industrialization:lubricant', amount: 250 },
      item_outputs: [{ item: 'modern_industrialization:motor', amount: 2 }]
    }).id('createch2:low_voltage/mi/basic_motor_standard_assembly')

    event.remove({ id: 'createch2:createaddition/portable_energy_interface' })
    event.remove({ id: 'createch2:createaddition/modular_accumulator' })

    // The Rubberworks sheet is a cured natural-rubber precursor. A final
    // mechanical press standardizes it into MI's electrical-grade sheet.
    event.custom({
      type: 'create:pressing',
      ingredients: [
        { tag: 'createch2:natural_rubber_sheet_precursors' }
      ],
      results: [
        { id: 'modern_industrialization:rubber_sheet' }
      ]
    }).id('createch2:low_voltage/mi/industrial_rubber_sheet_from_natural_rubber')

    event.custom({
      type: 'create:cutting',
      ingredients: [
        { tag: 'c:plates/copper' }
      ],
      processing_time: 80,
      results: [
        { count: 2, id: 'modern_industrialization:copper_wire' }
      ]
    }).id('createch2:low_voltage/create/cutting/copper_wire_bootstrap')

    event.custom({
      type: 'create:cutting',
      ingredients: [
        { tag: 'c:plates/tin' }
      ],
      processing_time: 80,
      results: [
        { count: 2, id: 'modern_industrialization:tin_wire' }
      ]
    }).id('createch2:low_voltage/create/cutting/tin_wire_bootstrap')

    event.custom({
      type: 'create:pressing',
      ingredients: [
        { tag: 'c:ingots/battery_alloy' }
      ],
      results: [
        { id: 'modern_industrialization:battery_alloy_plate' }
      ]
    }).id('createch2:low_voltage/create/pressing/battery_alloy_plate_bootstrap')

    event.custom({
      type: 'create:pressing',
      ingredients: [
        { tag: 'c:plates/battery_alloy' }
      ],
      results: [
        { id: 'modern_industrialization:battery_alloy_curved_plate' }
      ]
    }).id('createch2:low_voltage/create/pressing/battery_alloy_curved_plate_bootstrap')

    event.shaped('modern_industrialization:steel_rod_magnetic', [
      ' M ',
      ' R ',
      ' M '
    ], {
      M: 'tfmg:magnetic_alloy_sheet',
      R: '#c:rods/steel'
    }).id('createch2:low_voltage/mi/magnetic_steel_rod_from_tfmg_lamination')

    removeOutputRecipes([
      'modern_industrialization:pump',
      'modern_industrialization:electric_macerator',
      'modern_industrialization:electric_compressor',
      'modern_industrialization:electric_water_pump',
      'modern_industrialization:assembler'
    ])

    // Prototype components remain hand-assemblable. Their assembler routes below
    // become the standard recurring production once the first workcell exists.
    event.shaped('modern_industrialization:pump', [
      'FRF',
      'PMP',
      'FSF'
    ], {
      F: '#modern_industrialization:fluid_pipes',
      R: 'modern_industrialization:tin_rotor',
      P: '#createch2:rubber_sheets',
      M: 'modern_industrialization:motor',
      S: '#createch2:control/factory/analog'
    }).id('createch2:low_voltage/mi/basic_pump_prototype')

    event.shaped('modern_industrialization:electric_macerator', [
      'MAM',
      'WHW',
      'SBS'
    ], {
      M: 'modern_industrialization:motor',
      A: '#createch2:control/factory/analog',
      W: 'electroenergetics:insulated_wire',
      H: 'modern_industrialization:basic_machine_hull',
      S: 'tfmg:steel_mechanism',
      B: 'modern_industrialization:bronze_macerator'
    }).id('createch2:low_voltage/mi/electric_macerator_prototype')

    event.shaped('modern_industrialization:electric_compressor', [
      'MAM',
      'WHW',
      'SBS'
    ], {
      M: 'modern_industrialization:motor',
      A: '#createch2:control/factory/analog',
      W: 'electroenergetics:insulated_wire',
      H: 'modern_industrialization:basic_machine_hull',
      S: 'tfmg:steel_mechanism',
      B: 'modern_industrialization:bronze_compressor'
    }).id('createch2:low_voltage/mi/electric_compressor_prototype')

    event.shaped('modern_industrialization:electric_water_pump', [
      'PAP',
      'WHW',
      'FBF'
    ], {
      P: 'modern_industrialization:pump',
      A: '#createch2:control/factory/analog',
      W: 'electroenergetics:insulated_wire',
      H: 'modern_industrialization:basic_machine_hull',
      F: '#modern_industrialization:fluid_pipes',
      B: 'modern_industrialization:bronze_water_pump'
    }).id('createch2:low_voltage/mi/electric_water_pump_prototype')

    event.shaped('modern_industrialization:assembler', [
      'MPM',
      'WHW',
      'SBS'
    ], {
      M: 'modern_industrialization:motor',
      P: 'modern_industrialization:pump',
      W: 'electroenergetics:insulated_wire',
      H: 'modern_industrialization:basic_machine_hull',
      S: 'tfmg:steel_mechanism',
      B: 'modern_industrialization:bronze_mixer'
    }).id('createch2:low_voltage/mi/assembler_prototype')

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 64,
      duration: 500,
      item_inputs: [
        { tag: 'modern_industrialization:fluid_pipes', amount: 8 },
        { item: 'modern_industrialization:tin_rotor', amount: 4 },
        { item: 'modern_industrialization:motor', amount: 2 },
        { tag: 'createch2:rubber_sheets', amount: 4 },
        { item: 'modern_industrialization:analog_circuit', amount: 1 }
      ],
      fluid_inputs: { fluid: 'modern_industrialization:lubricant', amount: 500 },
      item_outputs: [{ item: 'modern_industrialization:pump', amount: 2 }]
    }).id('createch2:low_voltage/mi/basic_pump_standard_assembly')

  })

  compileFamily('Age 7 — First Space', () => {
    // Stellaris ships this recipe with an output count above the launch pad's
    // runtime stack limit. Remove it by id before output-based filtering tries
    // to deserialize that invalid stack.
    event.remove({ id: 'stellaris:misc/rocket_launch_pad' })

    removeOutputRecipes([
      'stellaris:cable',
      'stellaris:battery',
      'stellaris:engine_fan',
      'stellaris:fuel_refinery',
      'stellaris:rocket_engine',
      'stellaris:rocket_fin',
      'stellaris:rocket_nose_cone',
      'stellaris:rocket_station',
      'stellaris:heavy_metal_casing',
      'stellaris:rocket',
      'stellaris:oxygen_tank',
      'stellaris:big_oxygen_tank',
      'stellaris:oxygen_distributor',
      'stellaris:water_pump',
      'stellaris:water_separator',
      'stellaris:space_suit_helmet',
      'stellaris:space_suit_chestplate',
      'stellaris:space_suit_leggings',
      'stellaris:space_suit_boots',
      'stellaris:rover',
      'stellaris:coal_generator',
      'stellaris:solar_panel',
      'stellaris:radioactive_generator'
    ])

    event.shaped(Item.of('stellaris:cable', 6), [
      'RRR',
      'CTC',
      'RRR'
    ], {
      R: '#createch2:rubber_sheets',
      C: 'electroenergetics:insulated_wire',
      T: '#c:plates/steel'
    }).id('createch2:first_space/stellaris/cable_lv')

    event.shaped('stellaris:battery', [
      ' C ',
      'RBR',
      ' S '
    ], {
      C: 'modern_industrialization:analog_circuit',
      R: '#createch2:rubber_sheets',
      B: 'modern_industrialization:redstone_battery',
      S: '#c:plates/steel'
    }).id('createch2:first_space/stellaris/battery_lv')

    event.shaped('stellaris:engine_fan', [
      ' P ',
      'RMR',
      ' P '
    ], {
      P: '#c:plates/steel',
      R: 'modern_industrialization:tin_rotor',
      M: 'modern_industrialization:motor'
    }).id('createch2:first_space/stellaris/engine_fan_lv')

    event.shaped('stellaris:fuel_refinery', [
      'PAP',
      'DHC',
      'PMP'
    ], {
      P: '#c:plates/steel',
      A: 'modern_industrialization:analog_circuit',
      C: 'stellaris:cable',
      D: 'tfmg:steel_distillation_controller',
      H: 'modern_industrialization:basic_machine_hull',
      M: 'modern_industrialization:pump'
    }).id('createch2:first_space/stellaris/fuel_refinery_lv')

    event.shaped('stellaris:rocket_engine', [
      'FMF',
      'PSP',
      'HBH'
    ], {
      F: 'stellaris:engine_fan',
      M: 'modern_industrialization:motor',
      P: 'modern_industrialization:pump',
      S: 'tfmg:steel_mechanism',
      H: 'tfmg:heavy_plate',
      B: 'stellaris:battery'
    }).id('createch2:first_space/stellaris/rocket_engine_lv')

    event.shaped('stellaris:rocket_fin', [
      ' S',
      'HS',
      'RH'
    ], {
      S: '#c:plates/steel',
      H: 'tfmg:heavy_plate',
      R: '#createch2:rubber_sheets'
    }).id('createch2:first_space/stellaris/rocket_fin_lv')

    event.shaped('stellaris:rocket_launch_pad', [
      'HSH',
      'SCS',
      'HSH'
    ], {
      H: 'tfmg:heavy_plate',
      S: '#c:plates/steel',
      C: 'modern_industrialization:steel_machine_casing'
    }).id('createch2:first_space/stellaris/rocket_launch_pad_lv')

    event.shaped('stellaris:rocket_nose_cone', [
      ' G ',
      'SAS',
      'SBS'
    ], {
      G: 'minecraft:tinted_glass',
      S: '#c:plates/steel',
      A: 'modern_industrialization:analog_circuit',
      B: 'stellaris:battery'
    }).id('createch2:first_space/stellaris/rocket_nose_cone_lv')

    event.shaped('stellaris:rocket_station', [
      'CAC',
      'PHP',
      'LLL'
    ], {
      C: 'stellaris:cable',
      A: 'modern_industrialization:analog_circuit',
      P: 'stellaris:rocket_launch_pad',
      H: 'modern_industrialization:basic_machine_hull',
      L: 'tfmg:heavy_plate'
    }).id('createch2:first_space/stellaris/rocket_station_lv')

    event.custom({
      type: 'stellaris:rocket_station',
      ingredients: [
        { item: 'stellaris:rocket_nose_cone' },
        { item: 'stellaris:cable' },
        { item: 'stellaris:cable' },
        { tag: 'c:plates/steel' },
        { tag: 'c:plates/steel' },
        { item: 'stellaris:rocket_fin' },
        { tag: 'c:plates/steel' },
        { tag: 'c:plates/steel' },
        { item: 'stellaris:rocket_fin' },
        { item: 'stellaris:rocket_fin' },
        { item: 'stellaris:rocket_fin' },
        { item: 'modern_industrialization:basic_machine_hull' }
      ],
      output: {
        id: 'stellaris:heavy_metal_casing',
        count: 1
      }
    }).id('createch2:first_space/stellaris/rocket_airframe_lv')

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'stellaris:heavy_metal_casing' },
      transitional_item: { id: 'stellaris:heavy_metal_casing' },
      loops: 1,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'stellaris:heavy_metal_casing' },
            { item: 'stellaris:battery' }
          ],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'stellaris:heavy_metal_casing' },
            { item: 'stellaris:rocket_engine' }
          ],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'stellaris:heavy_metal_casing' }, { item: 'stellaris:oxygen_tank' }],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'stellaris:heavy_metal_casing' }, { item: 'stellaris:cable' }],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'stellaris:heavy_metal_casing' }, { item: 'modern_industrialization:pump' }],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'stellaris:heavy_metal_casing' }, { item: 'modern_industrialization:analog_circuit' }],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'stellaris:heavy_metal_casing' }, { item: 'electroenergetics:converter' }],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'stellaris:heavy_metal_casing' },
            { type: 'neoforge:single', amount: 250, fluid: 'tfmg:lubrication_oil' }
          ],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'stellaris:heavy_metal_casing' },
            { type: 'neoforge:single', amount: 1000, fluid: 'stellaris:fuel' }
          ],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'stellaris:heavy_metal_casing' }],
          results: [{ id: 'stellaris:heavy_metal_casing' }]
        }
      ],
      results: [{ id: 'stellaris:rocket' }]
    }).id('createch2:first_space/stellaris/rocket_final_assembly')

    event.shaped('stellaris:oxygen_tank', [
      ' C ',
      'SBS',
      ' R '
    ], {
      C: 'stellaris:cable',
      S: '#c:plates/steel',
      B: 'modern_industrialization:redstone_battery',
      R: '#createch2:rubber_sheets'
    }).id('createch2:first_space/stellaris/oxygen_tank_lv')

    event.shaped('stellaris:big_oxygen_tank', [
      'STS',
      'TBT',
      'SCS'
    ], {
      S: '#c:plates/steel',
      T: 'stellaris:oxygen_tank',
      B: 'stellaris:battery',
      C: 'stellaris:cable'
    }).id('createch2:first_space/stellaris/big_oxygen_tank_lv')

    event.shaped('stellaris:oxygen_distributor', [
      'FCF',
      'PHP',
      'TBT'
    ], {
      F: 'stellaris:engine_fan',
      C: 'stellaris:cable',
      P: 'modern_industrialization:pump',
      H: 'modern_industrialization:basic_machine_hull',
      T: 'stellaris:big_oxygen_tank',
      B: 'stellaris:battery'
    }).id('createch2:first_space/stellaris/oxygen_distributor_lv')

    event.shaped('stellaris:water_pump', [
      ' C ',
      'PHP',
      ' B '
    ], {
      C: 'stellaris:cable',
      P: 'modern_industrialization:pump',
      H: 'modern_industrialization:basic_machine_hull',
      B: 'modern_industrialization:bronze_water_pump'
    }).id('createch2:first_space/stellaris/water_pump_lv')

    event.shaped('stellaris:water_separator', [
      'TAT',
      'PHP',
      'CWC'
    ], {
      T: 'stellaris:oxygen_tank',
      A: 'modern_industrialization:analog_circuit',
      P: 'modern_industrialization:pump',
      H: 'modern_industrialization:basic_machine_hull',
      C: 'stellaris:cable',
      W: 'minecraft:water_bucket'
    }).id('createch2:first_space/stellaris/water_separator_lv')

    event.shaped('stellaris:space_suit_helmet', [
      'WTW',
      'GCG',
      'R R'
    ], {
      W: 'minecraft:white_wool',
      T: 'stellaris:oxygen_tank',
      G: 'minecraft:tinted_glass',
      C: 'stellaris:cable',
      R: '#createch2:rubber_sheets'
    }).id('createch2:first_space/stellaris/spacesuit_helmet_lv')

    event.shaped('stellaris:space_suit_chestplate', [
      'WTW',
      'CBC',
      'SRS'
    ], {
      W: 'minecraft:white_wool',
      T: 'stellaris:oxygen_tank',
      C: 'stellaris:cable',
      B: 'stellaris:battery',
      S: '#c:plates/steel',
      R: '#createch2:rubber_sheets'
    }).id('createch2:first_space/stellaris/spacesuit_chestplate_lv')

    event.shaped('stellaris:space_suit_leggings', [
      'SBS',
      'W W',
      'R R'
    ], {
      S: '#c:plates/steel',
      B: 'stellaris:battery',
      W: 'minecraft:white_wool',
      R: '#createch2:rubber_sheets'
    }).id('createch2:first_space/stellaris/spacesuit_leggings_lv')

    event.shaped('stellaris:space_suit_boots', [
      'W W',
      'S S',
      'R R'
    ], {
      W: 'minecraft:white_wool',
      S: '#c:plates/steel',
      R: '#createch2:rubber_sheets'
    }).id('createch2:first_space/stellaris/spacesuit_boots_lv')

    event.shaped('stellaris:rover', [
      'CBC',
      'MHM',
      'SPS'
    ], {
      C: 'stellaris:cable',
      B: 'electroenergetics:accumulator',
      M: 'modern_industrialization:motor',
      H: 'modern_industrialization:basic_machine_hull',
      S: '#c:plates/steel',
      P: 'modern_industrialization:pump'
    }).id('createch2:first_space/stellaris/rover_lv')

    event.shaped('stellaris:coal_generator', [
      'CAC',
      'DHD',
      'SFS'
    ], {
      C: 'stellaris:cable',
      A: 'modern_industrialization:analog_circuit',
      D: 'stellaris:desh_ingot',
      H: 'modern_industrialization:basic_machine_hull',
      S: '#c:plates/steel',
      F: 'minecraft:blast_furnace'
    }).id('createch2:first_space/stellaris/coal_generator_moon_base')

    event.shaped('stellaris:solar_panel', [
      'AAA',
      'DBD',
      'SCS'
    ], {
      A: 'minecraft:amethyst_block',
      D: 'stellaris:desh_ingot',
      B: 'stellaris:battery',
      S: '#c:plates/steel',
      C: 'stellaris:cable'
    }).id('createch2:first_space/stellaris/solar_panel_moon_base')

    event.shaped('stellaris:radioactive_generator', [
      'CUC',
      'DHD',
      'SBS'
    ], {
      C: 'stellaris:cable',
      U: '#c:ingots/uranium',
      D: 'stellaris:desh_ingot',
      H: 'modern_industrialization:basic_machine_hull',
      S: '#c:plates/steel',
      B: 'stellaris:battery'
    }).id('createch2:first_space/stellaris/radioactive_generator_space_gated')

    var fuelBridge = (id, input, amount) => {
      event.custom({
        type: 'create:mixing',
        ingredients: [
          {
            type: 'neoforge:single',
            amount: amount,
            fluid: input
          }
        ],
        results: [
          { amount: amount, id: 'stellaris:fuel' }
        ]
      }).id(id)
    }

    fuelBridge('createch2:first_space/fuel/tfmg_kerosene_to_stellaris_fuel', 'tfmg:kerosene', 500)
    fuelBridge('createch2:first_space/fuel/tfmg_gasoline_to_stellaris_fuel', 'tfmg:gasoline', 500)
    fuelBridge('createch2:first_space/fuel/tfmg_diesel_to_stellaris_fuel', 'tfmg:diesel', 500)
  })

  compileFamily('Age 8 — Advanced Electric', () => {
    ;[
      'modern_industrialization:materials/blast_furnace/bauxite_to_aluminum_ingot',
      'modern_industrialization:materials/blast_furnace/bauxite_to_aluminum_nugget',
      'modern_industrialization:materials/aluminum/blast_furnace/dust',
      'modern_industrialization:materials/aluminum/blast_furnace/tiny_dust',
      'modern_industrialization:assembler_generated/electric_age/casing/advanced_machine_casing',
      'modern_industrialization:electric_age/casing/advanced_machine_casing_asbl',
      'modern_industrialization:assembler_generated/electric_age/hull/advanced_machine_hull',
      'modern_industrialization:electric_age/hull/advanced_machine_hull_asbl',
      'modern_industrialization:assembler_generated/electric_age/component/craft/advanced_motor',
      'modern_industrialization:electric_age/component/craft/advanced_motor_asbl',
      'modern_industrialization:assembler_generated/electric_age/component/craft/advanced_pump',
      'modern_industrialization:electric_age/component/assembler/advanced_pump',
      'modern_industrialization:electric_age/component/craft/advanced_pump'
    ].forEach(id => event.remove({ id: id }))

    // First-space stock must run on the native32EU cupronickel coil.
    // Doubling batch time retains the previous total energy and all materials.
    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 32,
      duration: 4800,
      item_inputs: [
        { amount: 8, tag: 'c:dusts/bauxite' },
        { amount: 1, item: 'stellaris:desh_ingot' },
        { amount: 1, item: 'stellaris:tharsite_ingot' },
        { amount: 2, item: 'tfmg:coal_coke' }
      ],
      item_outputs: [
        { amount: 2, item: 'tfmg:aluminum_ingot' },
        { amount: 4, item: 'modern_industrialization:bauxite_tiny_dust' }
      ]
    }).id('createch2:advanced_electric/mi/aluminum_from_bauxite_space_reduction')

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 32,
      duration: 1600,
      item_inputs: [
        { amount: 1, tag: 'c:dusts/aluminum' },
        { amount: 1, item: 'stellaris:desh_ingot' },
        { amount: 1, item: 'tfmg:coal_coke' }
      ],
      item_outputs: [
        { amount: 1, item: 'tfmg:aluminum_ingot' }
      ]
    }).id('createch2:advanced_electric/mi/aluminum_from_aluminum_dust_space_reduction')

    event.shaped('modern_industrialization:advanced_machine_casing', [
      'ADA',
      'DHD',
      'ATA'
    ], {
      A: '#c:plates/aluminum',
      D: 'stellaris:desh_ingot',
      H: 'modern_industrialization:basic_machine_hull',
      T: 'stellaris:tharsite_ingot'
    }).id('createch2:advanced_electric/mi/advanced_machine_casing_space_aluminum')

    event.shaped('modern_industrialization:advanced_machine_hull', [
      'ECE',
      'BAB',
      'ETE'
    ], {
      E: 'electroenergetics:connector',
      C: 'modern_industrialization:electronic_circuit',
      B: 'modern_industrialization:silicon_battery',
      A: 'modern_industrialization:advanced_machine_casing',
      T: 'stellaris:tharsite_ingot'
    }).id('createch2:advanced_electric/mi/advanced_machine_hull_space_aluminum')

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 64,
      duration: 400,
      item_inputs: [
        { item: 'electroenergetics:hanging_glass_insulator', amount: 2 },
        { item: 'modern_industrialization:annealed_copper_wire', amount: 2 },
        { item: 'modern_industrialization:electrum_wire', amount: 2 },
        { item: 'tfmg:magnetic_alloy_sheet', amount: 1 },
        { tag: 'c:rods/aluminum', amount: 2 },
        { item: 'modern_industrialization:electronic_circuit', amount: 1 },
        { item: 'modern_industrialization:motor', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:lubricant',
        amount: 100
      },
      item_outputs: [
        { item: 'modern_industrialization:advanced_motor', amount: 1 }
      ]
    }).id('createch2:advanced_electric/mi/advanced_motor_lubricated_assembly')

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 64,
      duration: 500,
      item_inputs: [
        { tag: 'modern_industrialization:fluid_pipes', amount: 3 },
        { item: 'modern_industrialization:aluminum_rotor', amount: 2 },
        { item: 'modern_industrialization:advanced_motor', amount: 1 },
        { item: 'modern_industrialization:aluminum_bolt', amount: 2 },
        { item: 'stellaris:tharsite_ingot', amount: 1 },
        { item: 'modern_industrialization:electronic_circuit', amount: 1 },
        { item: 'modern_industrialization:pump', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:lubricant',
        amount: 250
      },
      item_outputs: [
        { item: 'modern_industrialization:advanced_pump', amount: 1 }
      ]
    }).id('createch2:advanced_electric/mi/advanced_pump_lubricated_assembly')


    // Mekanism enters after returned space materials establish Advanced Electric.
    // Its duplicate enrichment/crushing/smelting machines stay contained; this
    // restores only the defining infusion and gas-technology bootstrap.
    event.shaped('mekanism:metallurgic_infuser', [
      'ACA',
      'PHP',
      'AWA'
    ], {
      A: '#c:plates/aluminum',
      C: 'modern_industrialization:electronic_circuit',
      P: 'modern_industrialization:advanced_pump',
      H: 'modern_industrialization:advanced_machine_hull',
      W: 'electroenergetics:hanging_glass_insulator'
    }).id('createch2:advanced_electric/mekanism/metallurgic_infuser')

    event.custom({
      type: 'mekanism:metallurgic_infusing',
      chemical_input: {
        amount: 20,
        tag: 'mekanism:redstone'
      },
      item_input: {
        count: 1,
        item: 'modern_industrialization:electronic_circuit'
      },
      output: {
        count: 2,
        id: 'mekanism:basic_control_circuit'
      },
      per_tick_usage: false
    }).id('createch2:advanced_electric/mekanism/basic_control_circuit')
  })

  compileFamily('Age 9 — Chemical', () => {
    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 32,
      duration: 400,
      item_inputs: [
        { item: 'chemica:electronic_circuit', amount: 1 },
        { item: 'modern_industrialization:analog_circuit', amount: 1 }
      ],
      fluid_inputs: { fluid: 'modern_industrialization:soldering_alloy', amount: 144 },
      item_outputs: [{ item: 'modern_industrialization:electronic_circuit', amount: 1 }]
    }).id('createch2:chemical_age/mi/electronic_circuit_from_chemica')

    // TFMG's naphtha cracking already supplies propylene. Chemical Age adds a
    // sulfur-cured, catalyst-assisted synthetic route in the real TFMG vat;
    // natural rubber remains the only pre-chemical source.
    event.custom({
      type: 'tfmg:vat_machine_recipe',
      allowed_vat_types: [
        'tfmg:steel',
        'tfmg:fireproof'
      ],
      heat_level: 1,
      ingredients: [
        { item: 'tfmg:sulfur_dust' },
        { item: 'mekanism:alloy_infused' },
        {
          type: 'neoforge:single',
          amount: 500,
          fluid: 'tfmg:propylene'
        }
      ],
      machines: [
        'tfmg:mixing'
      ],
      min_size: 2,
      results: [
        { count: 4, id: 'tfmg:rubber_sheet' }
      ]
    }).id('createch2:chemical_age/tfmg/synthetic_rubber')

    event.custom({
      type: 'modern_industrialization:compressor',
      eu: 16,
      duration: 200,
      item_inputs: {
        tag: 'createch2:synthetic_rubber',
        amount: 1
      },
      item_outputs: {
        item: 'modern_industrialization:rubber_sheet',
        amount: 1
      }
    }).id('createch2:chemical_age/mi/industrial_rubber_sheet_from_synthetic_rubber')

    ;[
      'mekanism:basic_chemical_tank',
      'mekanism:transmitter/pressurized_tube/basic',
      'mekanism:electrolytic_core',
      'mekanism:electrolytic_separator',
      'mekanism:chemical_infuser',
      'mekanism:chemical_oxidizer',
      'mekanism:pressurized_reaction_chamber',
      'mekanism:purification_chamber',
      'mekanism:chemical_injection_chamber',
      'mekanism:chemical_dissolution_chamber',
      'mekanism:chemical_washer',
      'mekanism:chemical_crystallizer'
    ].forEach(id => event.remove({ id: id }))

    removeOutputRecipes(['mekanism:basic_chemical_tank', 'mekanism:basic_pressurized_tube', 'mekanism:electrolytic_core'])

    // Chemica's cured epoxy is the qualified liner that turns an ordinary MI
    // pressure body into a chemical tank. This is the physical Age 9 handoff
    // into Mekanism containment.
    event.shaped('mekanism:basic_chemical_tank', [
      'EAE',
      'PBP',
      'ECE'
    ], {
      A: '#c:plates/aluminum',
      E: 'chemica:cured_epoxy_sheet',
      P: 'modern_industrialization:advanced_pump',
      B: 'modern_industrialization:advanced_machine_casing',
      C: '#createch2:mekanism_advanced_control'
    }).id('createch2:chemical_age/mekanism/basic_chemical_tank')

    event.shaped(Item.of('mekanism:basic_pressurized_tube', 8), [
      'FRF',
      'TCT',
      'FRF'
    ], {
      F: 'chemica:polytetrafluoroethylene_sheet',
      R: '#createch2:rubber_sheets',
      T: 'mekanism:basic_chemical_tank',
      C: 'electroenergetics:hanging_glass_insulator'
    }).id('createch2:chemical_age/mekanism/basic_pressurized_tube')

    event.shaped('mekanism:electrolytic_core', [
      'ECE',
      'TAT',
      'RCR'
    ], {
      R: '#c:dusts/redstone',
      E: 'chemica:platinum_electrode',
      C: '#createch2:mekanism_advanced_control',
      T: 'mekanism:basic_chemical_tank',
      A: 'modern_industrialization:advanced_machine_hull'
    }).id('createch2:chemical_age/mekanism/electrolytic_core')

    // Sterile rations are a chemical-age abstraction of storage time, not a
    // vanilla-food bypass. Core restricts the machine to fresh mixed TFC meals.
    removeOutputRecipes(['mekanism:nutritional_liquifier'])
    event.shaped('mekanism:nutritional_liquifier', ['PFP', 'THT', 'ECE'], {
      P: 'chemica:polytetrafluoroethylene_sheet',
      F: 'create:blaze_burner',
      T: 'mekanism:basic_chemical_tank',
      H: 'modern_industrialization:advanced_machine_hull',
      E: 'chemica:cured_epoxy_sheet',
      C: '#createch2:mekanism_advanced_control'
    }).id('createch2:chemical_age/mekanism/sterile_nutritional_liquifier')

    event.shaped('mekanism:electrolytic_separator', [
      'ATA',
      'CEC',
      'APA'
    ], {
      A: '#c:plates/aluminum',
      T: 'mekanism:basic_chemical_tank',
      C: '#createch2:mekanism_advanced_control',
      E: 'mekanism:electrolytic_core',
      P: 'modern_industrialization:advanced_pump'
    }).id('createch2:chemical_age/mekanism/electrolytic_separator')

    event.shaped('mekanism:chemical_infuser', [
      'TCT',
      'PHP',
      'TCT'
    ], {
      T: 'mekanism:basic_chemical_tank',
      C: '#createch2:mekanism_advanced_control',
      P: 'mekanism:basic_pressurized_tube',
      H: 'modern_industrialization:advanced_machine_hull'
    }).id('createch2:chemical_age/mekanism/chemical_infuser')

    event.shaped('mekanism:chemical_oxidizer', [
      'ACA',
      'PHP',
      'ATA'
    ], {
      A: '#c:plates/aluminum',
      C: '#createch2:mekanism_advanced_control',
      P: 'mekanism:basic_pressurized_tube',
      H: 'modern_industrialization:advanced_machine_hull',
      T: 'mekanism:basic_chemical_tank'
    }).id('createch2:chemical_age/mekanism/chemical_oxidizer')

    // Keep TFMG's motor available without exposing its native sequenced
    // intermediate, which now serves as the closed PRC pressure-body handoff.
    removeOutputRecipes(['tfmg:electric_motor', 'tfmg:electric_pump'])
    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 32,
      duration: 400,
      item_inputs: [
        { item: 'create:shaft', amount: 1 },
        { item: 'tfmg:copper_spool', amount: 2 },
        { item: 'tfmg:magnet', amount: 2 },
        { item: 'tfmg:steel_mechanism', amount: 1 },
        { item: 'tfmg:screwdriver', amount: 1, probability: 0 }
      ],
      item_outputs: [
        { item: 'tfmg:electric_motor', amount: 1 }
      ]
    }).id('createch2:chemical_age/tfmg/electric_motor')

    // Optional TFMG utility retains its native bill, with the canonical
    // Greate steel pump supplying the retired parallel mechanical item.
    event.shaped('tfmg:electric_pump', ['MQK', 'CPW', 'MQK'], {
      M: 'tfmg:magnet',
      Q: 'tfmg:capacitor_item',
      K: 'tfmg:electromagnetic_coil',
      C: 'tfmg:circuit_board',
      P: 'greate:steel_mechanical_pump',
      W: '#c:wires/copper'
    }).id('createch2:chemical_age/tfmg/electric_pump')

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 32,
      duration: 500,
      item_inputs: [
        { item: 'modern_industrialization:advanced_machine_hull', amount: 1 },
        { item: 'modern_industrialization:advanced_pump', amount: 1 },
        { tag: 'c:plates/aluminum', amount: 2 },
        { tag: 'createch2:mekanism_advanced_control', amount: 2 },
        { item: 'mekanism:basic_chemical_tank', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:soldering_alloy',
        amount: 144
      },
      item_outputs: [
        { item: 'tfmg:unfinished_electric_motor', amount: 1 }
      ]
    }).id('createch2:chemical_age/mekanism/pressurized_reaction_chamber_workpiece')

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'tfmg:unfinished_electric_motor' },
      transitional_item: { id: 'tfmg:unfinished_electric_motor' },
      loops: 1,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_electric_motor' },
            { item: 'mekanism:basic_chemical_tank' }
          ],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_electric_motor' },
            { item: 'mekanism:electrolytic_core' }
          ],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_electric_motor' },
            { item: 'mekanism:basic_pressurized_tube' }
          ],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_electric_motor' }, { item: 'mekanism:basic_pressurized_tube' }],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_electric_motor' }, { item: 'mekanism:basic_chemical_tank' }],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_electric_motor' }, { item: 'modern_industrialization:rubber_sheet' }],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_electric_motor' }, { item: 'modern_industrialization:advanced_pump' }],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_electric_motor' }, { item: 'mekanism:advanced_control_circuit' }],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_electric_motor' }, { item: 'tfmg:electric_motor' }],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_electric_motor' }, { item: 'electroenergetics:hanging_glass_insulator' }],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'tfmg:unfinished_electric_motor' },
            { type: 'neoforge:single', amount: 250, fluid: 'tfmg:lubrication_oil' }
          ],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'tfmg:unfinished_electric_motor' }],
          results: [{ id: 'tfmg:unfinished_electric_motor' }]
        }
      ],
      results: [{ id: 'mekanism:pressurized_reaction_chamber' }]
    }).id('createch2:chemical_age/mekanism/pressurized_reaction_chamber_assembly')

    event.shaped('mekanism:purification_chamber', [
      'APA',
      'CHC',
      'ATA'
    ], {
      A: '#c:plates/aluminum',
      P: 'mekanism:basic_pressurized_tube',
      C: '#createch2:mekanism_advanced_control',
      H: 'modern_industrialization:advanced_machine_hull',
      T: 'mekanism:basic_chemical_tank'
    }).id('createch2:chemical_age/mekanism/purification_chamber')

    event.shaped('mekanism:chemical_injection_chamber', [
      'TPT',
      'PHP',
      'ACA'
    ], {
      T: 'mekanism:basic_chemical_tank',
      P: 'mekanism:basic_pressurized_tube',
      H: 'mekanism:purification_chamber',
      A: 'modern_industrialization:advanced_pump',
      C: '#createch2:mekanism_advanced_control'
    }).id('createch2:chemical_age/mekanism/chemical_injection_chamber')

    event.shaped('mekanism:chemical_dissolution_chamber', [
      'TPT',
      'FHF',
      'CAC'
    ], {
      T: 'mekanism:basic_chemical_tank',
      P: 'mekanism:basic_pressurized_tube',
      C: '#createch2:mekanism_advanced_control',
      F: '#createch2:chemical_catalyst_media',
      H: 'modern_industrialization:advanced_machine_hull',
      A: 'mekanism:advanced_control_circuit'
    }).id('createch2:chemical_age/mekanism/chemical_dissolution_chamber')

    event.shaped('mekanism:chemical_washer', [
      'TPT',
      'CHC',
      'PFP'
    ], {
      T: 'mekanism:basic_chemical_tank',
      P: 'mekanism:basic_pressurized_tube',
      C: '#createch2:mekanism_advanced_control',
      H: 'modern_industrialization:advanced_machine_hull',
      F: '#createch2:chemical_filter_media'
    }).id('createch2:chemical_age/mekanism/chemical_washer')

    event.shaped('mekanism:chemical_crystallizer', [
      'GTG',
      'PHP',
      'FCF'
    ], {
      G: '#c:gems/fluorite',
      T: 'mekanism:basic_chemical_tank',
      C: '#createch2:mekanism_advanced_control',
      P: 'modern_industrialization:advanced_pump',
      H: 'modern_industrialization:advanced_machine_hull',
      F: '#createch2:chemical_filter_media'
    }).id('createch2:chemical_age/mekanism/chemical_crystallizer')
  })

  compileFamily('Age 9 — Arcane Chemistry', () => {
    var id = name => `createch2:arcane_chemistry/${name}`

    removeOutputRecipes([
      'alchemistry:dissolver',
      'alchemistry:combiner',
      'alchemistry:compactor',
      'alchemistry:liquifier',
      'alchemistry:atomizer'
    ])

    event.shaped('alchemistry:dissolver', [
      'GCG',
      'TDT',
      'AMA'
    ], {
      G: '#c:glass_blocks/cheap',
      C: '#createch2:control/factory/electronic',
      T: 'mekanism:basic_chemical_tank',
      D: 'evilcraft:dark_gem',
      A: 'modern_industrialization:advanced_machine_hull',
      M: '#createch2:malum_industrial_occultism'
    }).id(id('alchemistry/dissolver'))

    event.shaped('alchemistry:combiner', [
      'TCT',
      'PDP',
      'BMB'
    ], {
      T: 'mekanism:basic_chemical_tank',
      C: '#createch2:control/factory/electronic',
      P: 'mekanism:pressurized_reaction_chamber',
      D: 'alchemistry:dissolver',
      B: 'evilcraft:blood_infusion_core',
      M: 'modern_industrialization:advanced_machine_hull'
    }).id(id('alchemistry/combiner'))

    event.shaped('alchemistry:compactor', [
      'SCS',
      'MAM',
      'SPS'
    ], {
      S: 'tfmg:heavy_plate',
      C: '#createch2:control/factory/electronic',
      M: 'tfmg:steel_mechanism',
      A: 'alchemistry:combiner',
      P: 'modern_industrialization:advanced_pump'
    }).id(id('alchemistry/compactor'))

    event.shaped('alchemistry:liquifier', [
      'TPT',
      'CBC',
      'TMT'
    ], {
      T: 'mekanism:basic_chemical_tank',
      P: 'modern_industrialization:advanced_pump',
      C: '#createch2:control/factory/electronic',
      B: 'evilcraft:blood_infuser',
      M: 'modern_industrialization:advanced_machine_hull'
    }).id(id('alchemistry/liquifier'))

    event.shaped('alchemistry:atomizer', [
      'GEG',
      'CLC',
      'GPG'
    ], {
      G: '#c:glass_blocks/cheap',
      E: 'mekanism:electrolytic_core',
      C: '#createch2:control/factory/electronic',
      L: 'alchemistry:liquifier',
      P: 'mekanism:basic_pressurized_tube'
    }).id(id('alchemistry/atomizer'))


    // The native Alchemistry namespace is replaced, so rebuild the shared
    // reactor shell explicitly. Controllers remain in their later nuclear and
    // quantum ages; these blocks only establish the physical vessel and ports.
    event.shaped(Item.of('alchemistry:reactor_casing', 4), [
      'HPH',
      'ACA',
      'HPH'
    ], {
      H: 'tfmg:heavy_plate',
      P: 'mekanism:hdpe_sheet',
      A: 'modern_industrialization:advanced_machine_hull',
      C: '#createch2:control/factory/processing'
    }).id(id('alchemistry/reactor_casing'))

    event.shaped('alchemistry:reactor_input', [
      'P',
      'C',
      'T'
    ], {
      P: 'modern_industrialization:advanced_pump',
      C: 'alchemistry:reactor_casing',
      T: 'mekanism:basic_chemical_tank'
    }).id(id('alchemistry/reactor_input'))

    event.shaped('alchemistry:reactor_output', [
      'D',
      'C',
      'D'
    ], {
      D: 'minecraft:dropper',
      C: 'alchemistry:reactor_casing'
    }).id(id('alchemistry/reactor_output'))

    event.shaped('alchemistry:reactor_energy', [
      'W',
      'C',
      'W'
    ], {
      W: 'electroenergetics:hanging_glass_insulator',
      C: 'alchemistry:reactor_casing'
    }).id(id('alchemistry/reactor_energy'))

  })

  compileFamily('Age 10 — Stainless and Digital', () => {
    var id = name => `createch2:stainless_digital/${name}`

    ;[
      'modern_industrialization:materials/blast_furnace/titanium_from_raw',
      'modern_industrialization:materials/titanium/blast_furnace/dust'
    ].forEach(recipeId => event.remove({ id: recipeId }))

    removeOutputRecipes([
      'modern_industrialization:titanium_ingot',
      'modern_industrialization:titanium_hot_ingot',
      'modern_industrialization:titanium_nugget',
      'modern_industrialization:titanium_block'
    ])

    event.shaped('ae2:inscriber', [
      'SPS',
      'PMP',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      P: 'modern_industrialization:advanced_pump',
      M: 'modern_industrialization:advanced_machine_hull',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/inscriber'))

    event.shaped('ae2:silicon_press', [
      'SSS',
      'SWS',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      // The first stencil predates iridium-doped monocrystalline wafers.
      W: 'modern_industrialization:silicon_plate',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/silicon_press'))

    event.shaped('ae2:logic_processor_press', [
      'SSS',
      'SGS',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      G: '#c:ingots/gold',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/logic_processor_press'))

    event.shaped('ae2:calculation_processor_press', [
      'SSS',
      'SCS',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      C: '#c:gems/certus_quartz',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/calculation_processor_press'))

    event.shaped('ae2:engineering_processor_press', [
      'SSS',
      'SES',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      E: '#c:gems/diamond',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/engineering_processor_press'))

    var inscribe = (name, middle, top, output) => {
      var ingredients = { middle: middle }
      if (top) ingredients.top = top
      event.custom({
        type: 'ae2:inscriber',
        ingredients: ingredients,
        mode: 'inscribe',
        result: {
          count: 1,
          id: output
        }
      }).id(id(`ae2/inscriber/${name}`))
    }

    var press = (name, top, bottom, output) => {
      event.custom({
        type: 'ae2:inscriber',
        ingredients: {
          bottom: bottom,
          middle: { item: 'minecraft:redstone' },
          top: top
        },
        mode: 'press',
        result: {
          count: 1,
          id: output
        }
      }).id(id(`ae2/processor/${name}`))
    }

    inscribe('printed_silicon', { tag: 'createch2:processed_ae2_silicon' }, { item: 'ae2:silicon_press' }, 'ae2:printed_silicon')
    inscribe('printed_logic_processor', { tag: 'c:ingots/gold' }, { item: 'ae2:logic_processor_press' }, 'ae2:printed_logic_processor')
    inscribe('printed_calculation_processor', { item: 'ae2:certus_quartz_crystal' }, { item: 'ae2:calculation_processor_press' }, 'ae2:printed_calculation_processor')
    inscribe('printed_engineering_processor', { tag: 'c:gems/diamond' }, { item: 'ae2:engineering_processor_press' }, 'ae2:printed_engineering_processor')
    inscribe('certus_quartz_dust', { tag: 'c:gems/certus_quartz' }, undefined, 'ae2:certus_quartz_dust')
    inscribe('fluix_dust', { tag: 'c:gems/fluix' }, undefined, 'ae2:fluix_dust')

    press('logic', { item: 'ae2:printed_logic_processor' }, { item: 'ae2:printed_silicon' }, 'ae2:logic_processor')
    press('calculation', { item: 'ae2:printed_calculation_processor' }, { item: 'ae2:printed_silicon' }, 'ae2:calculation_processor')
    press('engineering', { item: 'ae2:printed_engineering_processor' }, { item: 'ae2:printed_silicon' }, 'ae2:engineering_processor')

    event.shaped('4x ae2:quartz_glass', [
      'GCG',
      'CQC',
      'GCG'
    ], {
      G: '#c:glass_blocks/cheap',
      C: '#c:dusts/certus_quartz',
      Q: 'modern_industrialization:silicon_plate'
    }).id(id('ae2/quartz_glass'))

    event.shaped('3x ae2:quartz_fiber', [
      'GGG',
      'CCC',
      'GGG'
    ], {
      G: '#c:glass_blocks/cheap',
      C: '#c:dusts/certus_quartz'
    }).id(id('ae2/quartz_fiber'))

    event.shapeless('4x ae2:fluix_glass_cable', [
      'ae2:quartz_fiber',
      'ae2:fluix_crystal',
      'ae2:fluix_crystal',
      'modern_industrialization:stainless_steel_bolt'
    ]).id(id('ae2/fluix_glass_cable'))

    event.shaped('3x ae2:semi_dark_monitor', [
      ' GQ',
      'SRQ',
      ' GQ'
    ], {
      G: '#c:dusts/glowstone',
      Q: 'ae2:quartz_glass',
      S: 'modern_industrialization:stainless_steel_plate',
      R: '#c:dusts/redstone'
    }).id(id('ae2/semi_dark_monitor'))

    event.shapeless('ae2:monitor', ['ae2:semi_dark_monitor']).id(id('ae2/monitor'))
    event.shapeless('ae2:dark_monitor', ['ae2:monitor']).id(id('ae2/dark_monitor'))

    event.shaped('2x ae2:annihilation_core', [
      'QFL',
      ' D '
    ], {
      Q: '#c:gems/quartz',
      F: '#c:dusts/fluix',
      L: 'ae2:logic_processor',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/annihilation_core'))

    event.shaped('2x ae2:formation_core', [
      'CFL',
      ' D '
    ], {
      C: '#c:gems/certus_quartz',
      F: '#c:dusts/fluix',
      L: 'ae2:logic_processor',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/formation_core'))

    event.shaped('ae2:energy_acceptor', [
      'SQS',
      'QMQ',
      'SCS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      Q: 'ae2:quartz_glass',
      M: 'modern_industrialization:advanced_machine_hull',
      C: 'electroenergetics:hanging_glass_insulator'
    }).id(id('ae2/energy_acceptor'))

    // Preserve the native utility component without leaving its unfinished
    // sequenced-assembly item available as an alternate controller base.
    removeOutputRecipes(['create_connected:control_chip'])
    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 32,
      duration: 400,
      item_inputs: [
        { item: 'create:golden_sheet', amount: 1 },
        { item: 'create:electron_tube', amount: 2 },
        { item: 'minecraft:redstone', amount: 2 },
        { item: 'create:precision_mechanism', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:soldering_alloy',
        amount: 72
      },
      item_outputs: [
        { item: 'create_connected:control_chip', amount: 1 }
      ]
    }).id(id('ae2/control_chip'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 32,
      duration: 500,
      item_inputs: [
        { item: 'modern_industrialization:advanced_machine_hull', amount: 1 },
        { item: 'modern_industrialization:stainless_steel_large_plate', amount: 4 },
        { item: 'ae2:fluix_crystal', amount: 3 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:soldering_alloy',
        amount: 144
      },
      item_outputs: [
        { item: 'create_connected:incomplete_control_chip', amount: 1 }
      ]
    }).id(id('ae2/controller_workpiece'))

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'create_connected:incomplete_control_chip' },
      transitional_item: { id: 'create_connected:incomplete_control_chip' },
      loops: 1,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'create_connected:incomplete_control_chip' },
            { item: 'ae2:logic_processor' }
          ],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'create_connected:incomplete_control_chip' },
            { item: 'ae2:calculation_processor' }
          ],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'create_connected:incomplete_control_chip' },
            { item: 'ae2:engineering_processor' }
          ],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'create_connected:incomplete_control_chip' }, { item: 'ae2:formation_core' }],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'create_connected:incomplete_control_chip' }, { item: 'ae2:annihilation_core' }],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'create_connected:incomplete_control_chip' }, { item: 'modern_industrialization:digital_circuit' }],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'create_connected:incomplete_control_chip' }, { item: 'ae2:energy_acceptor' }],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'create_connected:incomplete_control_chip' }, { item: 'create_connected:control_chip' }],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'create_connected:incomplete_control_chip' }, { item: 'ae2:fluix_glass_cable' }],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'create_connected:incomplete_control_chip' }, { item: 'electroenergetics:converter' }],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'create_connected:incomplete_control_chip' },
            { type: 'neoforge:single', amount: 144, fluid: 'modern_industrialization:soldering_alloy' }
          ],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'create_connected:incomplete_control_chip' }],
          results: [{ id: 'create_connected:incomplete_control_chip' }]
        }
      ],
      results: [{ id: 'ae2:controller' }]
    }).id(id('ae2/controller_assembly'))

    event.shaped('ae2:drive', [
      'SES',
      'C C',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      E: 'ae2:engineering_processor',
      C: 'ae2:fluix_glass_cable',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/drive'))

    event.shaped('ae2:terminal', [
      'QMQ',
      'ALF',
      'SCS'
    ], {
      Q: 'ae2:quartz_glass',
      M: 'ae2:semi_dark_monitor',
      A: 'ae2:annihilation_core',
      L: 'ae2:logic_processor',
      F: 'ae2:formation_core',
      S: 'modern_industrialization:stainless_steel_plate',
      C: 'ae2:fluix_glass_cable'
    }).id(id('ae2/terminal'))

    event.shapeless('ae2:crafting_terminal', [
      'ae2:terminal',
      'minecraft:crafting_table',
      'ae2:calculation_processor',
      'modern_industrialization:digital_circuit'
    ]).id(id('ae2/crafting_terminal'))

    event.shaped('ae2:item_cell_housing', [
      'QRQ',
      'R R',
      'SSS'
    ], {
      Q: 'ae2:quartz_glass',
      R: '#c:dusts/redstone',
      S: 'modern_industrialization:stainless_steel_plate'
    }).id(id('ae2/item_cell_housing'))

    event.shaped('ae2:cell_component_1k', [
      'RCR',
      'CLC',
      'RCR'
    ], {
      R: '#c:dusts/redstone',
      C: '#c:gems/certus_quartz',
      L: 'ae2:logic_processor'
    }).id(id('ae2/cell_component_1k'))

    event.shaped('ae2:item_storage_cell_1k', [
      'QRQ',
      'RCR',
      'SIS'
    ], {
      Q: 'ae2:quartz_glass',
      R: '#c:dusts/redstone',
      C: 'ae2:cell_component_1k',
      S: 'modern_industrialization:stainless_steel_plate',
      I: 'ae2:item_cell_housing'
    }).id(id('ae2/item_storage_cell_1k'))

    // Applied Flux is the FE storage bridge for the Age 10 ME network.
    // Native recipes remain contained above; this is the single pack-owned
    // entry chain used by the existing Applied Flux quest branch.
    event.shaped('ae2:charger', [
      'SQS',
      'CEC',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      Q: 'ae2:quartz_glass',
      C: 'electroenergetics:inductor',
      E: 'ae2:energy_acceptor',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('ae2/charger'))

    event.shaped('2x appflux:redstone_crystal', [
      'RFR',
      'FSF',
      'RFR'
    ], {
      R: '#c:dusts/redstone',
      F: '#c:dusts/fluix',
      S: 'modern_industrialization:silicon_plate'
    }).id(id('appflux/redstone_crystal'))

    event.custom({
      type: 'ae2:charger',
      ingredient: {
        item: 'appflux:redstone_crystal'
      },
      result: {
        count: 1,
        id: 'appflux:charged_redstone'
      }
    }).id(id('appflux/charged_redstone'))

    event.shaped('appflux:energy_processor_press', [
      'SRS',
      'RER',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      R: '#c:dusts/redstone',
      E: 'ae2:engineering_processor',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('appflux/energy_processor_press'))

    event.custom({
      type: 'ae2:inscriber',
      ingredients: {
        middle: {
          item: 'appflux:charged_redstone'
        },
        top: {
          item: 'appflux:energy_processor_press'
        }
      },
      mode: 'inscribe',
      result: {
        count: 1,
        id: 'appflux:printed_energy_processor'
      }
    }).id(id('appflux/printed_energy_processor'))

    event.custom({
      type: 'ae2:inscriber',
      ingredients: {
        bottom: {
          item: 'ae2:printed_silicon'
        },
        middle: {
          item: 'minecraft:redstone'
        },
        top: {
          item: 'appflux:printed_energy_processor'
        }
      },
      mode: 'press',
      result: {
        count: 1,
        id: 'appflux:energy_processor'
      }
    }).id(id('appflux/energy_processor'))

    event.shaped('appflux:flux_accessor', [
      'GPG',
      'CEC',
      'GSG'
    ], {
      G: '#c:dusts/glowstone',
      P: 'appflux:energy_processor',
      C: 'electroenergetics:inductor',
      E: 'ae2:energy_acceptor',
      S: 'modern_industrialization:stainless_steel_plate'
    }).id(id('appflux/flux_accessor'))

    event.shapeless('appflux:part_flux_accessor', [
      'appflux:flux_accessor'
    ]).id(id('appflux/part_flux_accessor'))

    event.shapeless('appflux:flux_accessor', [
      'appflux:part_flux_accessor'
    ]).id(id('appflux/flux_accessor_from_part'))

    event.shaped('appflux:core_1k', [
      'CRC',
      'RER',
      'CRC'
    ], {
      C: '#c:dusts/certus_quartz',
      R: 'appflux:redstone_crystal',
      E: 'appflux:energy_processor'
    }).id(id('appflux/core_1k'))

    event.shaped('appflux:fe_cell_housing', [
      'QRQ',
      'R R',
      'SIS'
    ], {
      Q: 'ae2:quartz_glass',
      R: '#c:dusts/redstone',
      S: 'modern_industrialization:stainless_steel_plate',
      I: '#createch2:rubber_sheets'
    }).id(id('appflux/fe_cell_housing'))

    event.shapeless('appflux:fe_1k_cell', [
      'appflux:fe_cell_housing',
      'appflux:core_1k'
    ]).id(id('appflux/fe_1k_cell'))

    event.shaped('ae2:storage_bus', [
      'SAS',
      'PIP',
      'SFS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      A: 'ae2:annihilation_core',
      P: 'minecraft:piston',
      I: 'ae2:interface',
      F: 'ae2:formation_core'
    }).id(id('ae2/storage_bus'))

    event.shaped('ae2:import_bus', [
      ' A ',
      'SPS',
      ' C '
    ], {
      A: 'ae2:annihilation_core',
      S: 'modern_industrialization:stainless_steel_plate',
      P: 'minecraft:piston',
      C: 'ae2:fluix_glass_cable'
    }).id(id('ae2/import_bus'))

    event.shaped('ae2:export_bus', [
      ' F ',
      'SPS',
      ' C '
    ], {
      F: 'ae2:formation_core',
      S: 'modern_industrialization:stainless_steel_plate',
      P: 'minecraft:piston',
      C: 'ae2:fluix_glass_cable'
    }).id(id('ae2/export_bus'))

    event.shaped('ae2:interface', [
      'SQS',
      'AIF',
      'SCS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      Q: 'ae2:quartz_glass',
      A: 'ae2:annihilation_core',
      I: 'modern_industrialization:digital_circuit',
      F: 'ae2:formation_core',
      C: 'ae2:fluix_glass_cable'
    }).id(id('ae2/interface'))

    event.shaped('2x ae2:blank_pattern', [
      'QGQ',
      'GCG',
      'SRS'
    ], {
      Q: 'ae2:quartz_glass',
      G: '#c:dusts/glowstone',
      C: '#c:gems/certus_quartz',
      S: 'modern_industrialization:stainless_steel_plate',
      R: '#c:dusts/redstone'
    }).id(id('ae2/blank_pattern'))

    event.shaped('ae2:molecular_assembler', [
      'SQS',
      'ACT',
      'MFR'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      Q: 'ae2:quartz_glass',
      A: 'ae2:annihilation_core',
      C: 'minecraft:crafting_table',
      T: '#createch2:control/factory/processing',
      F: 'ae2:formation_core',
      M: 'modern_industrialization:advanced_motor',
      R: 'extended_industrialization:machine_chainer_relay'
    }).id(id('ae2/molecular_assembler'))

    event.shaped('ae2:pattern_provider', [
      'SCS',
      'AIF',
      'PMR'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      C: '#c:player_workstations/crafting_tables',
      A: 'ae2:annihilation_core',
      I: 'ae2:interface',
      F: 'ae2:formation_core',
      P: '#createch2:control/factory/processing',
      M: 'modern_industrialization:advanced_motor',
      R: 'extended_industrialization:machine_chainer_relay'
    }).id(id('ae2/pattern_provider'))

    event.shaped('appmek:chemical_cell_housing', [
      'QRQ',
      'R R',
      'OTO'
    ], {
      Q: 'ae2:quartz_glass',
      R: '#c:dusts/redstone',
      O: '#c:ingots/nickel',
      T: 'mekanism:basic_chemical_tank'
    }).id(id('appmek/chemical_cell_housing'))

    event.shapeless('appmek:chemical_storage_cell_1k', [
      'appmek:chemical_cell_housing',
      'ae2:cell_component_1k',
      'mekanism:basic_chemical_tank'
    ]).id(id('appmek/chemical_storage_cell_1k'))

    // Hostile Neural Networks is bounded digital mob processing. Base HNN machines
    // prove the native model loop before HNI acceleration scales it.
    removeRecipe({ id: /^hostilenetworks:(?:deep_learner|framework|loot_fabricator|prediction_matrix|sim_chamber)$/ })
    ;[
      'hostile_neural_industrialization:guidebook',
      'hostile_neural_industrialization:hostilenetworks/blank_data_model_assembler',
      'hostile_neural_industrialization:hostilenetworks/deep_learner_assembler',
      'hostile_neural_industrialization:hostilenetworks/loot_fabricator_assembler',
      'hostile_neural_industrialization:hostilenetworks/prediction_matrix_assembler',
      'hostile_neural_industrialization:hostilenetworks/simulation_chamber_assembler',
      'hostile_neural_industrialization:machine/electric_simulation_chamber',
      'hostile_neural_industrialization:machine/electric_simulation_chamber_assembler',
      'hostile_neural_industrialization:machine/large_loot_fabricator',
      'hostile_neural_industrialization:machine/large_loot_fabricator_assembler',
      'hostile_neural_industrialization:machine/large_simulation_chamber',
      'hostile_neural_industrialization:machine/large_simulation_chamber_assembler',
      'hostile_neural_industrialization:machine/mono_loot_fabricator',
      'hostile_neural_industrialization:machine/mono_loot_fabricator_assembler',
      'hostile_neural_industrialization:prediction_machine_casing',
      'hostile_neural_industrialization:prediction_machine_casing_assembler'
    ].forEach(recipeId => event.remove({ id: recipeId }))
    removeOutputRecipes([
      'hostilenetworks:deep_learner',
      'hostilenetworks:blank_data_model',
      'hostilenetworks:prediction_matrix',
      'hostilenetworks:sim_chamber',
      'hostilenetworks:loot_fabricator'
    ])

    event.shaped('hostilenetworks:deep_learner', [
      'OGO',
      'GCG',
      'ODO'
    ], {
      O: '#c:obsidians',
      G: '#c:glass_panes',
      C: '#createch2:control/factory/digital',
      D: 'tfmg:steel_mechanism'
    }).id('createch2:hnn/deep_learner')

    event.shaped('hostilenetworks:blank_data_model', [
      'RCR',
      'DSD',
      'RMR'
    ], {
      R: '#c:dusts/redstone',
      C: '#createch2:control/factory/digital',
      D: 'tfmg:steel_mechanism',
      S: 'minecraft:smooth_stone',
      M: 'mekanism:alloy_infused'
    }).id('createch2:hnn/blank_data_model')

    event.shaped('hostilenetworks:prediction_matrix', [
      'GLG',
      'DCD',
      'GMG'
    ], {
      G: '#c:glass_panes',
      L: '#c:gems/lapis',
      D: '#c:dusts/redstone',
      C: '#createch2:control/factory/digital',
      M: 'mekanism:alloy_infused'
    }).id('createch2:hnn/prediction_matrix')

    event.shaped('hostilenetworks:sim_chamber', [
      'GCG',
      'EHE',
      'MAM'
    ], {
      G: '#c:glass_panes',
      C: '#createch2:control/factory/digital',
      E: '#c:ender_pearls',
      H: '#createch2:machines/casings/industrial',
      M: 'hostilenetworks:prediction_matrix',
      A: 'mekanism:alloy_infused'
    }).id('createch2:hnn/sim_chamber')

    event.shaped('hostilenetworks:loot_fabricator', [
      'PCP',
      'MHM',
      'PAP'
    ], {
      P: 'hostilenetworks:prediction_matrix',
      C: '#createch2:control/factory/digital',
      M: 'tfmg:steel_mechanism',
      H: '#createch2:machines/casings/industrial',
      A: 'mekanism:alloy_infused'
    }).id('createch2:hnn/loot_fabricator')

    event.shaped('hostile_neural_industrialization:prediction_machine_casing', [
      'SDS',
      'DHD',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_ingot',
      D: 'modern_industrialization:digital_circuit',
      H: 'modern_industrialization:advanced_machine_hull'
    }).id('createch2:hni/prediction_machine_casing')

    event.shaped('hostile_neural_industrialization:electric_simulation_chamber', [
      'SDS',
      'CMC',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_large_plate',
      D: 'modern_industrialization:digital_circuit',
      C: 'hostile_neural_industrialization:prediction_machine_casing',
      M: 'hostilenetworks:sim_chamber'
    }).id('createch2:hni/electric_simulation_chamber')

    event.shaped('hostile_neural_industrialization:mono_loot_fabricator', [
      'SDS',
      'CMC',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_large_plate',
      D: 'modern_industrialization:digital_circuit',
      C: 'hostile_neural_industrialization:prediction_machine_casing',
      M: 'hostilenetworks:loot_fabricator'
    }).id('createch2:hni/mono_loot_fabricator')

    event.shaped('hostile_neural_industrialization:large_simulation_chamber', [
      'SCS',
      'DMD',
      'SCS'
    ], {
      S: 'modern_industrialization:stainless_steel_large_plate',
      C: 'hostile_neural_industrialization:prediction_machine_casing',
      D: 'modern_industrialization:digital_circuit',
      M: 'hostile_neural_industrialization:electric_simulation_chamber'
    }).id('createch2:hni/large_simulation_chamber')

    event.shaped('hostile_neural_industrialization:large_loot_fabricator', [
      'SCS',
      'DMD',
      'SCS'
    ], {
      S: 'modern_industrialization:stainless_steel_large_plate',
      C: 'hostile_neural_industrialization:prediction_machine_casing',
      D: 'modern_industrialization:digital_circuit',
      M: 'hostile_neural_industrialization:mono_loot_fabricator'
    }).id('createch2:hni/large_loot_fabricator')

  })

  compileFamily('Age 10 — GregTech shared component vocabulary', () => {
    var id = name => `createch2:greg_shared/${name}`
    var assemble = (name, inputs, output, amount, fluidAmount) => event.custom({
      type: 'modern_industrialization:assembler',
      eu: 32,
      duration: 240,
      item_inputs: inputs,
      fluid_inputs: [{
        fluid: 'modern_industrialization:soldering_alloy',
        amount: fluidAmount || 144
      }],
      item_outputs: [{
        item: output,
        amount: amount || 1
      }]
    }).id(id(name))

    // These are shared intermediates, not permission to enter GT's parallel
    // machine ladder. Every route uses the established MI/Create/AE2 factory.
    removeOutputRecipes([
      'gtceu:phenolic_circuit_board',
      'gtceu:phenolic_printed_circuit_board',
      'gtceu:vacuum_tube',
      'gtceu:resistor',
      'gtceu:capacitor',
      'gtceu:diode',
      'gtceu:transistor',
      'gtceu:lv_electric_motor',
      'gtceu:lv_electric_pump',
      'gtceu:lv_conveyor_module',
      'gtceu:lv_robot_arm',
      'gtceu:lv_sensor',
      'gtceu:lv_emitter',
      'gtceu:lv_field_generator'
    ])

    assemble('boards/phenolic', [
      { item: 'modern_industrialization:electronic_circuit_board', amount: 1 },
      { item: 'minecraft:paper', amount: 2 },
      { item: 'modern_industrialization:rubber_sheet', amount: 1 }
    ], 'gtceu:phenolic_circuit_board', 2, 72)

    assemble('boards/phenolic_printed', [
      { item: 'gtceu:phenolic_circuit_board', amount: 1 },
      { item: 'modern_industrialization:copper_fine_wire', amount: 4 },
      { item: 'ae2:printed_silicon', amount: 1 }
    ], 'gtceu:phenolic_printed_circuit_board', 1, 144)

    ;[
      ['vacuum_tube', 'minecraft:glass_bottle', 'modern_industrialization:copper_fine_wire', 2],
      ['resistor', 'modern_industrialization:resistor', 'modern_industrialization:carbon_dust', 4],
      ['capacitor', 'modern_industrialization:capacitor', 'modern_industrialization:aluminum_plate', 4],
      ['diode', 'modern_industrialization:diode', 'minecraft:quartz', 4],
      ['transistor', 'modern_industrialization:transistor', 'ae2:printed_silicon', 4]
    ].forEach(([name, authorityPart, precisionPart, count]) => assemble(`electronics/${name}`, [
      { item: authorityPart, amount: 1 },
      { item: precisionPart, amount: 1 },
      { item: 'modern_industrialization:copper_fine_wire', amount: 2 }
    ], `gtceu:${name}`, count, 144))

    assemble('motion/lv_motor', [
      { item: 'modern_industrialization:motor', amount: 1 },
      { item: 'modern_industrialization:steel_rod_magnetic', amount: 1 },
      { item: 'modern_industrialization:copper_fine_wire', amount: 4 }
    ], 'gtceu:lv_electric_motor', 1, 144)

    assemble('motion/lv_pump', [
      { item: 'gtceu:lv_electric_motor', amount: 1 },
      { item: 'modern_industrialization:pump', amount: 1 },
      { item: 'modern_industrialization:rubber_sheet', amount: 2 }
    ], 'gtceu:lv_electric_pump', 1, 144)

    assemble('motion/lv_conveyor', [
      { item: 'gtceu:lv_electric_motor', amount: 2 },
      { item: 'create:belt_connector', amount: 2 },
      { item: 'modern_industrialization:rubber_sheet', amount: 2 }
    ], 'gtceu:lv_conveyor_module', 1, 144)

    assemble('motion/lv_robot_arm', [
      { item: 'gtceu:lv_conveyor_module', amount: 1 },
      { item: 'gtceu:lv_electric_motor', amount: 2 },
      { item: 'create:mechanical_piston', amount: 1 },
      { item: 'gtceu:phenolic_printed_circuit_board', amount: 1 }
    ], 'gtceu:lv_robot_arm', 1, 288)

    ;[
      ['sensor', 'ae2:calculation_processor', 'create_radar:radar_receiver_block'],
      ['emitter', 'ae2:engineering_processor', 'create_radar:radar_bearing']
    ].forEach(([name, processor, instrument]) => assemble(`control/lv_${name}`, [
      { item: 'gtceu:phenolic_printed_circuit_board', amount: 1 },
      { item: processor, amount: 1 },
      { item: instrument, amount: 1 },
      { item: 'gtceu:transistor', amount: 2 }
    ], `gtceu:lv_${name}`, 1, 288))

    assemble('control/lv_field_generator', [
      { item: 'gtceu:lv_emitter', amount: 2 },
      { item: 'gtceu:lv_sensor', amount: 1 },
      { item: 'mekanism:energy_tablet', amount: 1 },
      { item: 'modern_industrialization:electrum_fine_wire', amount: 4 }
    ], 'gtceu:lv_field_generator', 1, 432)
  })

  compileFamily('Aeronautics stage 1 — experimental physical construction', () => {
    removeOutputRecipes([
      'simulated:physics_assembler',
      'aeronautics:propeller_bearing',
      'aeronautics:adjustable_burner',
      'aeronautics:steam_vent',
      'aeroworks:mechanical_servo',
      'aeroworks:joystick',
      'aeroworks:control_desk'
    ])

    event.shaped('simulated:physics_assembler', [
      'HCH',
      'RMR',
      'HGH'
    ], {
      H: 'tfmg:heavy_plate',
      C: 'tfmg:capacitor_item',
      R: 'railcraft:manual_rolling_machine',
      M: '#createch2:control/factory/processing',
      G: 'tfmg:steel_casing'
    }).id('createch2:aeronautics/stage_1/physics_assembler')

    event.shaped('aeronautics:propeller_bearing', [
      ' H ',
      'SCS',
      'ABA'
    ], {
      H: 'tfmg:heavy_plate',
      S: 'tfmg:steel_mechanism',
      C: 'simulated:physics_assembler',
      A: 'create:shaft',
      B: 'create:brass_casing'
    }).id('createch2:aeronautics/stage_1/propeller_bearing')

    event.shaped('aeronautics:adjustable_burner', [
      'HSH',
      'ICI',
      'ARA'
    ], {
      H: 'tfmg:heavy_plate',
      S: 'tfmg:steel_casing',
      I: 'create:iron_sheet',
      C: '#aeronautics:burner_fire',
      A: 'create:andesite_alloy',
      R: '#createch2:control/factory/analog'
    }).id('createch2:aeronautics/stage_1/adjustable_burner')

    event.shaped('aeronautics:steam_vent', [
      ' G ',
      'CSC',
      'IPI'
    ], {
      G: '#c:plates/gold',
      C: 'tfmg:capacitor_item',
      S: 'tfmg:steel_casing',
      I: 'tfmg:industrial_pipe',
      P: 'minecraft:copper_block'
    }).id('createch2:aeronautics/stage_1/steam_vent')

    event.shaped('aeroworks:mechanical_servo', [
      ' P ',
      'SCS',
      ' B '
    ], {
      P: 'create:precision_mechanism',
      S: 'create:sequenced_gearshift',
      C: 'tfmg:steel_mechanism',
      B: 'create:brass_casing'
    }).id('createch2:aeronautics/stage_1/mechanical_servo')

    event.custom({
      type: 'create:mechanical_crafting',
      accept_mirrored: true,
      category: 'misc',
      pattern: [
        ' L ',
        ' P ',
        ' S ',
        ' B ',
        'BBB'
      ],
      key: {
        L: { item: 'create:redstone_link' },
        P: { item: 'create:precision_mechanism' },
        S: { item: 'aeroworks:mechanical_servo' },
        B: { item: 'create:brass_sheet' }
      },
      result: {
        count: 1,
        id: 'aeroworks:joystick'
      }
    }).id('createch2:aeronautics/stage_1/joystick')

    event.shaped('aeroworks:control_desk', [
      ' J ',
      'SCS',
      'RPR'
    ], {
      J: 'aeroworks:joystick',
      S: 'aeroworks:mechanical_servo',
      C: 'create:brass_casing',
      R: 'create:redstone_link',
      P: '#createch2:control/factory/analog'
    }).id('createch2:aeronautics/stage_1/control_desk')
  })

  compileFamily('Aeronautics stage 2 — industrial propulsion and freight hardware', () => {
    removeOutputRecipes([
      'simulated:engine_assembly',
      'simulated:red_portable_engine',
      'simulated:docking_connector',
      'createpropulsion:wing',
      'createpropulsion:tempered_wing',
      'createpropulsion:solid_burner',
      'createpropulsion:solid_fuel_thruster',
      'createpropulsion:liquid_burner',
      'createpropulsion:thruster'
    ])

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'tfmg:heavy_plate' },
      transitional_item: { id: 'simulated:incomplete_engine_assembly' },
      loops: 4,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'simulated:incomplete_engine_assembly' },
            { item: 'tfmg:steel_mechanism' }
          ],
          results: [{ id: 'simulated:incomplete_engine_assembly' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'simulated:incomplete_engine_assembly' },
            { item: 'tfmg:copper_spool' }
          ],
          results: [{ id: 'simulated:incomplete_engine_assembly' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'simulated:incomplete_engine_assembly' },
            { type: 'neoforge:single', amount: 250, fluid: 'tfmg:lubrication_oil' }
          ],
          results: [{ id: 'simulated:incomplete_engine_assembly' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'simulated:incomplete_engine_assembly' }],
          results: [{ id: 'simulated:incomplete_engine_assembly' }]
        }
      ],
      results: [
        { chance: 80.0, id: 'simulated:engine_assembly' },
        { chance: 8.0, id: 'tfmg:heavy_plate' },
        { chance: 4.0, id: 'tfmg:steel_mechanism' },
        { id: 'tfmg:copper_spool' }
      ]
    }).id('createch2:aeronautics/stage_2/engine_assembly')

    // The portable engine is the Age 4 road-vehicle engine. Rail proof is
    // required later by the physics assembler, reinforced wings, and docking
    // hardware that turn it into practical freight aviation.
    event.shaped('simulated:red_portable_engine', [
      'CEC',
      'SAS',
      'RPR'
    ], {
      C: 'tfmg:capacitor_item',
      E: 'simulated:engine_assembly',
      S: 'tfmg:steel_casing',
      A: 'create:mechanical_piston',
      R: 'tfmg:heavy_plate',
      P: 'tfmg:industrial_pipe'
    }).id('createch2:aeronautics/stage_2/portable_engine_heavy_industry')

    event.custom({
      type: 'create:mechanical_crafting',
      accept_mirrored: true,
      category: 'misc',
      pattern: [
        'IHI',
        'LAL',
        'PCP',
        'BEB'
      ],
      key: {
        I: { item: 'create:iron_sheet' },
        H: { item: 'tfmg:heavy_plate' },
        L: { item: 'railcraft:standard_rail' },
        A: { item: 'create:brass_casing' },
        P: { item: 'minecraft:piston' },
        C: { item: 'railcraft:advanced_item_unloader' },
        B: { item: 'create:brass_sheet' },
        E: { tag: 'createch2:control/electromechanical' }
      },
      result: {
        id: 'simulated:docking_connector',
        count: 2
      }
    }).id('createch2:aeronautics/stage_2/docking_connector')

    event.custom({
      type: 'create:mechanical_crafting',
      accept_mirrored: true,
      category: 'misc',
      pattern: [
        'IHIHI',
        'HSHSH',
        'IHIHI'
      ],
      key: {
        I: { item: 'create:iron_sheet' },
        H: { item: 'tfmg:heavy_plate' },
        S: { item: 'create:shaft' }
      },
      result: {
        id: 'createpropulsion:wing',
        count: 4
      }
    }).id('createch2:aeronautics/stage_2/wing_frame')

    event.shaped(Item.of('createpropulsion:tempered_wing', 2), [
      'HWH',
      'SRS',
      'HWH'
    ], {
      H: 'tfmg:heavy_plate',
      W: 'createpropulsion:wing',
      S: 'railcraft:steel_plate',
      R: 'railcraft:manual_rolling_machine'
    }).id('createch2:aeronautics/stage_2/tempered_wing')

    ;[
      ['solid_burner', 'railcraft:solid_fueled_firebox'],
      ['liquid_burner', 'tfmg:firebox']
    ].forEach(([output, burner]) => event.shaped(`createpropulsion:${output}`, [
      'CSC',
      'PBP',
      'HAH'
    ], {
      C: 'create:copper_sheet',
      S: 'tfmg:steel_casing',
      P: 'tfmg:industrial_pipe',
      B: burner,
      H: 'tfmg:heavy_plate',
      A: 'simulated:physics_assembler'
    }).id(`createch2:aeronautics/stage_2/${output}`))

    ;[
      ['solid_fuel_thruster', 'createpropulsion:solid_burner'],
      ['thruster', 'createpropulsion:liquid_burner']
    ].forEach(([output, burner]) => event.shaped(`createpropulsion:${output}`, [
      'HCH',
      'PBP',
      'SES'
    ], {
      H: 'tfmg:heavy_plate',
      C: 'create:chute',
      P: 'create:mechanical_pump',
      B: burner,
      S: 'tfmg:steel_mechanism',
      E: 'simulated:engine_assembly'
    }).id(`createch2:aeronautics/stage_2/${output}`))
  })

  compileFamily('Aeronautics stage 3 — stabilization and digital flight control', () => {
    removeOutputRecipes([
      'aeronautics:gyroscopic_propeller_bearing',
      'aeroworks:stepper_servo',
      'aeroworks:gyroscope',
      'createpropulsion:liquid_vector_thruster',
      'createpropulsion:vector_thruster',
      'createpropulsion:advanced_tilt_adapter'
    ])

    event.shaped('aeroworks:stepper_servo', [
      ' M ',
      'SCS',
      ' P '
    ], {
      M: 'modern_industrialization:motor',
      S: 'aeroworks:mechanical_servo',
      C: 'modern_industrialization:digital_circuit',
      P: 'electroenergetics:converter'
    }).id('createch2:aeronautics/stage_3/stepper_servo')

    event.shaped('aeroworks:gyroscope', [
      ' S ',
      'MFM',
      ' C '
    ], {
      S: 'gtceu:lv_sensor',
      M: 'modern_industrialization:motor',
      F: 'create:flywheel',
      C: 'modern_industrialization:digital_circuit'
    }).id('createch2:aeronautics/stage_3/gyroscope')

    event.shaped('aeronautics:gyroscopic_propeller_bearing', [
      ' S ',
      'AGA',
      ' E '
    ], {
      S: 'aeroworks:stepper_servo',
      A: '#createch2:control/factory/digital',
      G: 'aeroworks:gyroscope',
      E: 'gtceu:lv_emitter'
    }).id('createch2:aeronautics/stage_3/gyroscopic_propeller_bearing')

    event.shaped('createpropulsion:liquid_vector_thruster', [
      'STS',
      'NGN',
      'PCP'
    ], {
      S: 'tfmg:heavy_plate',
      T: 'createpropulsion:thruster',
      N: 'create:copper_nugget',
      G: 'aeroworks:gyroscope',
      P: 'electroenergetics:converter',
      C: 'modern_industrialization:digital_circuit'
    }).id('createch2:aeronautics/stage_3/liquid_vector_thruster')

    event.shaped('createpropulsion:vector_thruster', [
      'PIP',
      'NGN',
      'SCS'
    ], {
      P: 'createpropulsion:platinum_sheet',
      I: 'createpropulsion:ion_thruster',
      N: 'createpropulsion:platinum_nugget',
      G: 'aeroworks:gyroscope',
      S: 'gtceu:lv_sensor',
      C: 'modern_industrialization:digital_circuit'
    }).id('createch2:aeronautics/stage_3/vector_thruster')

    event.shaped('createpropulsion:advanced_tilt_adapter', [
      'SCS',
      'MAM',
      'PEP'
    ], {
      S: 'tfmg:heavy_plate',
      C: 'modern_industrialization:digital_circuit',
      M: 'aeroworks:stepper_servo',
      A: 'createpropulsion:tilt_adapter',
      P: 'electroenergetics:converter',
      E: 'gtceu:lv_emitter'
    }).id('createch2:aeronautics/stage_3/advanced_tilt_adapter')
  })

  compileFamily('Aeronautics stage 4 — autonomous air logistics', () => {
    removeOutputRecipes([
      'create_aeronautics_automated_logistics:airship_station',
      'create_aeronautics_automated_logistics:ship_transponder'
    ])

    event.shaped('create_aeronautics_automated_logistics:airship_station', [
      'LTR',
      'SPS',
      'ACA'
    ], {
      L: 'railcraft:advanced_item_loader',
      T: 'create:track_station',
      R: 'railcraft:advanced_item_unloader',
      S: 'electroenergetics:hanging_glass_insulator',
      P: 'simulated:physics_assembler',
      A: 'ae2:pattern_provider',
      C: 'computercraft:computer_advanced'
    }).id('createch2:aeronautics/stage_4/airship_station')

    event.shaped('create_aeronautics_automated_logistics:ship_transponder', [
      'SNE',
      'TPT',
      'CJC'
    ], {
      S: 'gtceu:lv_sensor',
      N: 'simulated:navigation_table',
      E: 'gtceu:lv_emitter',
      T: 'tfmg:transistor_item',
      P: 'simulated:physics_assembler',
      C: 'modern_industrialization:digital_circuit',
      J: 'computercraft:computer_advanced'
    }).id('createch2:aeronautics/stage_4/ship_transponder')
  })

  compileFamily('Age 11 — High Pressure', () => {
    var id = name => `createch2:high_pressure/${name}`

    ;[
      'modern_industrialization:materials/blast_furnace/titanium_from_raw',
      'modern_industrialization:materials/titanium/blast_furnace/dust',
      'modern_industrialization:materials/titanium/vacuum_freezer/hot_ingot',
      'modern_industrialization:materials/platinum/blast_furnace/dust',
      'modern_industrialization:materials/iridium/smelting/dust_to_ingot_blasting',
      'modern_industrialization:materials/iridium/smelting/dust_to_ingot_smelting',
      'modern_industrialization:materials/iridium/smelting/ore_to_ingot_blasting',
      'modern_industrialization:materials/iridium/smelting/ore_to_ingot_smelting',
      'modern_industrialization:materials/iridium/smelting/raw_metal_to_ingot_blasting',
      'modern_industrialization:materials/iridium/smelting/raw_metal_to_ingot_smelting',
      'modern_industrialization:electric_age/machine/vacuum_freezer_asbl',
      'modern_industrialization:electric_age/machine/implosion_compressor_asbl',
      'stellaris:misc/corronium_ingot_from_blasting_raw_corronium',
      'stellaris:misc/corronium_ingot_from_blasting_venus_corronium_ore',
      'stellaris:misc/corronium_ingot_from_smelting_raw_corronium',
      'stellaris:misc/corronium_ingot_from_smelting_venus_corronium_ore',
      'stellaris:misc/solerium_from_blasting_mercury_solerium_ore',
      'stellaris:misc/solerium_from_blasting_raw_solerium',
      'stellaris:misc/solerium_from_smelting_mercury_solerium_ore',
      'stellaris:misc/solerium_from_smelting_raw_solerium',
      'travelanchors:travel_anchor',
      'travelanchors:travel_staff'
    ].forEach(recipeId => event.remove({ id: recipeId }))

    removeOutputRecipes([
      'modern_industrialization:titanium_ingot',
      'modern_industrialization:titanium_hot_ingot',
      'modern_industrialization:platinum_ingot',
      'modern_industrialization:platinum_hot_ingot',
      'modern_industrialization:iridium_ingot',
      'modern_industrialization:iridium_ore',
      'modern_industrialization:raw_iridium',
      'stellaris:corronium_ingot',
      'stellaris:solerium',
      'mekanism:advanced_chemical_tank',
      'mekanism:advanced_pressurized_tube',
      'mekanism:osmium_compressor'
    ])

    ;[
      ['poor', 1, 0],
      ['normal', 1, 3],
      ['rich', 2, 6]
    ].forEach(([grade, rawAmount, tinyAmount]) => {
      var rutileOutputs = [
        {
          item: 'modern_industrialization:raw_titanium',
          amount: rawAmount
        }
      ]
      if (tinyAmount > 0) {
        rutileOutputs.push({
          item: 'modern_industrialization:titanium_tiny_dust',
          amount: tinyAmount
        })
      }

      event.custom({
        type: 'modern_industrialization:macerator',
        eu: 64,
        duration: 400,
        item_inputs: [
          {
            tag: `createch2:tfc_ores/rutile/${grade}`,
            amount: 1
          },
          {
            item: 'modern_industrialization:processing_unit',
            amount: 1,
            probability: 0
          }
        ],
        item_outputs: rutileOutputs
      }).id(id(`titanium/rutile_concentrate/${grade}`))
    })

    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 64,
      duration: 800,
      item_inputs: [
        {
          tag: 'c:raw_materials/titanium',
          amount: 2
        },
        {
          tag: 'c:dusts/carbon',
          amount: 2
        },
        {
          tag: 'c:dusts/sodium',
          amount: 1
        }
      ],
      fluid_inputs: [
        {
          fluid: 'modern_industrialization:hydrochloric_acid',
          amount: 2000
        },
        {
          fluid: 'modern_industrialization:chlorine',
          amount: 1000
        }
      ],
      item_outputs: [
        {
          item: 'modern_industrialization:titanium_dust',
          amount: 2
        }
      ],
      fluid_outputs: {
        fluid: 'modern_industrialization:sulfuric_acid',
        amount: 250
      }
    }).id(id('titanium/chloride_sponge'))

    // Compatible ordinary dust cannot bypass certified hot/vacuum finishing.
    event.remove({ id: 'chemlib:titanium_ingot_from_smelting_titanium_dust' })
    event.remove({ id: 'chemlib:titanium_ingot_from_blasting_titanium_dust' })

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 128,
      duration: 600,
      item_inputs: [
        {
          tag: 'c:dusts/titanium',
          amount: 1
        },
        {
          tag: 'c:dusts/carbon',
          amount: 1
        }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:manganese_sulfuric_solution',
        amount: 1000
      },
      item_outputs: [
        {
          item: 'modern_industrialization:titanium_hot_ingot',
          amount: 1
        }
      ],
      fluid_outputs: {
        fluid: 'modern_industrialization:manganese_sulfuric_solution',
        amount: 750
      }
    }).id(id('titanium/hot_ingot'))

    event.custom({
      type: 'modern_industrialization:vacuum_freezer',
      eu: 64,
      duration: 350,
      item_inputs: [
        {
          item: 'modern_industrialization:titanium_hot_ingot',
          amount: 1
        }
      ],
      item_outputs: [
        {
          item: 'modern_industrialization:titanium_ingot',
          amount: 1
        }
      ]
    }).id(id('titanium/vacuum_refine_ingot'))

    event.shaped('modern_industrialization:vacuum_freezer', [
      'PTP',
      'CHC',
      'PMP'
    ], {
      P: 'modern_industrialization:stainless_steel_large_plate',
      T: 'mekanism:basic_chemical_tank',
      C: 'modern_industrialization:processing_unit',
      H: 'modern_industrialization:advanced_machine_hull',
      M: 'modern_industrialization:advanced_pump'
    }).id(id('mi/vacuum_freezer'))

    event.shaped('modern_industrialization:implosion_compressor', [
      'BTB',
      'MHM',
      'BTB'
    ], {
      B: 'modern_industrialization:blastproof_alloy_large_plate',
      T: 'modern_industrialization:titanium_large_plate',
      M: 'modern_industrialization:advanced_motor',
      H: 'modern_industrialization:advanced_machine_hull'
    }).id(id('mi/implosion_compressor'))

    event.shaped('mekanism:advanced_chemical_tank', [
      'TCT',
      'PHP',
      'TCT'
    ], {
      T: 'modern_industrialization:titanium_plate',
      C: '#createch2:mekanism_advanced_control',
      P: 'mekanism:basic_pressurized_tube',
      H: 'mekanism:basic_chemical_tank'
    }).id(id('mekanism/advanced_chemical_tank'))

    event.shaped('8x mekanism:advanced_pressurized_tube', [
      'TCT',
      'PHP',
      'TCT'
    ], {
      T: 'modern_industrialization:titanium_plate',
      C: '#createch2:mekanism_advanced_control',
      P: 'mekanism:basic_pressurized_tube',
      H: 'mekanism:advanced_chemical_tank'
    }).id(id('mekanism/advanced_pressurized_tube'))

    event.shaped('mekanism:osmium_compressor', [
      'TPT',
      'CHC',
      'TAT'
    ], {
      T: 'modern_industrialization:titanium_plate',
      P: 'modern_industrialization:advanced_pump',
      C: '#createch2:mekanism_advanced_control',
      H: 'modern_industrialization:advanced_machine_hull',
      A: 'mekanism:advanced_chemical_tank'
    }).id(id('mekanism/osmium_compressor'))

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 128,
      duration: 500,
      item_inputs: [
        {
          item: 'stellaris:raw_corronium',
          amount: 1
        },
        {
          tag: 'c:dusts/titanium',
          amount: 1
        }
      ],
      item_outputs: [
        {
          item: 'stellaris:corronium_ingot',
          amount: 1
        }
      ]
    }).id(id('stellaris/corronium_ingot'))

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 128,
      duration: 500,
      item_inputs: [
        {
          item: 'stellaris:raw_solerium',
          amount: 1
        },
        {
          tag: 'c:dusts/titanium',
          amount: 1
        }
      ],
      item_outputs: [
        {
          item: 'stellaris:solerium',
          amount: 1
        }
      ]
    }).id(id('stellaris/solerium_ingot'))

    event.shaped('stellaris:normal_rocket_upgrade', [
      'TCT',
      'PRP',
      'TET'
    ], {
      T: 'modern_industrialization:titanium_plate',
      C: 'stellaris:corronium_ingot',
      P: 'modern_industrialization:advanced_pump',
      R: 'stellaris:rocket_engine',
      E: 'modern_industrialization:processing_unit'
    }).id(id('stellaris/normal_rocket_upgrade'))

    event.shaped('stellaris:big_rocket_upgrade', [
      'TST',
      'CRC',
      'TET'
    ], {
      T: 'modern_industrialization:titanium_large_plate',
      S: 'stellaris:solerium',
      C: 'stellaris:corronium_ingot',
      R: 'stellaris:normal_rocket_upgrade',
      E: 'modern_industrialization:processing_unit'
    }).id(id('stellaris/big_rocket_upgrade'))

    event.shaped('stellaris:big_fuel_tank_upgrade', [
      'TCT',
      'CFC',
      'TST'
    ], {
      T: 'modern_industrialization:titanium_plate',
      C: 'stellaris:corronium_ingot',
      F: 'stellaris:t4_tank',
      S: 'stellaris:solerium'
    }).id(id('stellaris/big_fuel_tank_upgrade'))

    event.shaped('stellaris:jet_suit_helmet', [
      'TST',
      'CGC',
      ' D '
    ], {
      T: 'modern_industrialization:titanium_plate',
      S: 'stellaris:solerium',
      C: 'stellaris:corronium_ingot',
      G: 'minecraft:orange_stained_glass',
      D: 'modern_industrialization:processing_unit'
    }).id(id('stellaris/jet_suit_helmet'))

    event.shaped('stellaris:jet_suit_chestplate', [
      'T T',
      'COC',
      'TRT'
    ], {
      T: 'modern_industrialization:titanium_plate',
      C: 'stellaris:corronium_ingot',
      O: 'stellaris:big_oxygen_tank',
      R: 'stellaris:rocket_engine'
    }).id(id('stellaris/jet_suit_chestplate'))

    event.shaped('stellaris:jet_suit_leggings', [
      'TST',
      'CDC',
      'T T'
    ], {
      T: 'modern_industrialization:titanium_plate',
      S: 'stellaris:solerium',
      C: 'stellaris:corronium_ingot',
      D: 'modern_industrialization:processing_unit'
    }).id(id('stellaris/jet_suit_leggings'))

    event.shaped('stellaris:jet_suit_boots', [
      'C C',
      'T T',
      'R R'
    ], {
      C: 'stellaris:corronium_ingot',
      T: 'modern_industrialization:titanium_plate',
      R: 'stellaris:rocket_engine'
    }).id(id('stellaris/jet_suit_boots'))

    // Shield Generators replaces the retired field-system suite with one native,
    // bounded aerospace shield block behind the High Pressure control stack.
    event.remove({ id: 'shield_generators:shield_generator' })
    removeOutputRecipes(['shield_generators:shield_generator'])
    event.shaped('shield_generators:shield_generator', [
      'TFT',
      'ECE',
      'TGT'
    ], {
      T: 'modern_industrialization:titanium_plate',
      F: 'gtceu:lv_field_generator',
      E: 'mekanism:energy_tablet',
      C: 'modern_industrialization:advanced_machine_hull',
      G: 'stellaris:corronium_ingot'
    }).id(id('shield_generators/shield_generator'))

    event.shaped('travelanchors:travel_anchor', [
      'TET',
      'ESE',
      'TET'
    ], {
      T: 'modern_industrialization:titanium_plate',
      E: '#c:ender_pearls',
      S: 'stellaris:solerium'
    }).id(id('travelanchors/travel_anchor'))

    event.shaped('travelanchors:travel_staff', [
      '  S',
      ' C ',
      'T  '
    ], {
      S: 'stellaris:solerium',
      C: 'stellaris:corronium_ingot',
      T: 'modern_industrialization:titanium_rod'
    }).id(id('travelanchors/travel_staff'))

    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 64,
      duration: 1000,
      item_inputs: [
        {
          item: 'modern_industrialization:monazite_crushed_dust',
          amount: 1
        },
        {
          item: 'stellaris:corronium_ingot',
          amount: 1
        },
        {
          item: 'stellaris:solerium',
          amount: 1
        }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:sulfuric_acid',
        amount: 4000
      },
      item_outputs: [
        {
          item: 'modern_industrialization:raw_platinum',
          amount: 1
        },
        {
          item: 'modern_industrialization:platinum_tiny_dust',
          amount: 2
        }
      ],
      fluid_outputs: {
        fluid: 'modern_industrialization:platinum_sulfuric_solution',
        amount: 1000
      }
    }).id(id('pgm/mixed_concentrate'))

    event.custom({
      type: 'modern_industrialization:centrifuge',
      eu: 64,
      duration: 1200,
      fluid_inputs: {
        fluid: 'modern_industrialization:platinum_sulfuric_solution',
        amount: 1000
      },
      fluid_outputs: {
        fluid: 'modern_industrialization:purified_platinum_sulfuric_solution',
        amount: 1000
      },
      item_outputs: [
        {
          item: 'modern_industrialization:iridium_tiny_dust',
          amount: 1,
          probability: 0.08
        }
      ]
    }).id(id('pgm/purified_solution'))

    event.custom({
      type: 'modern_industrialization:electrolyzer',
      eu: 64,
      duration: 600,
      fluid_inputs: {
        fluid: 'modern_industrialization:purified_platinum_sulfuric_solution',
        amount: 1000
      },
      fluid_outputs: {
        fluid: 'modern_industrialization:sulfuric_acid',
        amount: 900
      },
      item_outputs: [
        {
          item: 'modern_industrialization:platinum_tiny_dust',
          amount: 3
        },
        {
          item: 'modern_industrialization:iridium_tiny_dust',
          amount: 1,
          probability: 0.04
        }
      ]
    }).id(id('pgm/electrolysis'))

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 128,
      duration: 600,
      item_inputs: [
        {
          tag: 'c:dusts/platinum',
          amount: 1
        }
      ],
      item_outputs: [
        {
          item: 'modern_industrialization:platinum_hot_ingot',
          amount: 1
        }
      ]
    }).id(id('pgm/platinum_hot_ingot'))

    event.custom({
      type: 'modern_industrialization:vacuum_freezer',
      eu: 64,
      duration: 350,
      item_inputs: [
        {
          item: 'modern_industrialization:platinum_hot_ingot',
          amount: 1
        }
      ],
      item_outputs: [
        {
          item: 'modern_industrialization:platinum_ingot',
          amount: 1
        }
      ]
    }).id(id('pgm/platinum_ingot'))
  })

  compileFamily('Age 12 — PGM and Cosmonautics foundation', () => {
    var id = name => `createch2:cosmonautics_foundation/${name}`

    ;[
      /^chemlib:.*(?:platinum|palladium|osmium|iridium|uranium|zirconium).*$/,
      /^mekanism:processing\/uranium\/(?:fissile_fuel|reprocessing|ingot|ore|raw|storage_blocks).*$/,
      /^mekanism:processing\/lategame\/.*$/,
      /^mekanismgenerators:reactor\/.*$/,
      /^mekanismgenerators:turbine\/.*$/,
      /^mekanismgenerators:chemical_infusing\/fusion_fuel$/,
      /^mekanismgenerators:rotary\/fusion_fuel$/,
      /^megacells:.*$/
    ].forEach(recipeId => event.remove({ id: recipeId }))

    removeOutputRecipes([
      'modern_industrialization:iridium_ingot',
      'modern_industrialization:nuclear_reactor',
      'modern_industrialization:uranium_fuel_rod',
      'modern_industrialization:uranium_fuel_rod_double',
      'modern_industrialization:uranium_fuel_rod_quad',
      'mekanism:ingot_osmium',
      'mekanism:ingot_uranium',
      'mekanism:dust_uranium',
      'mekanism:yellow_cake_uranium',
      'mekanism:pellet_plutonium',
      'mekanism:pellet_polonium',
      'mekanism:pellet_antimatter',
      'mekanism:alloy_atomic',
      'mekanism:elite_control_circuit',
      'mekanism:elite_chemical_tank',
      'mekanism:elite_mechanical_pipe',
      'mekanism:elite_pressurized_tube',
      'mekanism:advanced_thermodynamic_conductor',
      'mekanism:elite_tier_installer',
      'mekanism:ultimate_tier_installer',
      'mekanism:radioactive_waste_barrel',
      'mekanism:geiger_counter',
      'mekanism:dosimeter',
      'mekanism:module_radiation_shielding_unit',
      'mekanism:module_geiger_unit',
      'mekanism:elite_thermodynamic_conductor',
      'mekanism:dynamic_tank',
      'mekanism:dynamic_valve',
      'mekanismgenerators:fission_reactor_casing',
      'mekanismgenerators:reactor_glass',
      'mekanismgenerators:fission_reactor_port',
      'mekanismgenerators:fission_reactor_logic_adapter',
      'mekanismgenerators:fission_fuel_assembly',
      'mekanismgenerators:control_rod_assembly',
      'mekanismgenerators:turbine_casing',
      'mekanismgenerators:turbine_valve',
      'mekanismgenerators:turbine_rotor'
    ])

    // The standard line first prepares MI's existing mixed iridium feed, then
    // separates it in the Centrifuge. This keeps the first route seed-free and
    // gives the mature x4 line a proven feedstock without exceeding machine IO.
    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 96,
      duration: 800,
      item_inputs: [
        { item: 'modern_industrialization:raw_platinum', amount: 2 },
        { item: 'modern_industrialization:platinum_tiny_dust', amount: 4 },
        { tag: 'c:dusts/sodium', amount: 1 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:hydrochloric_acid', amount: 2000 },
        { fluid: 'modern_industrialization:chlorine', amount: 1000 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:mixed_ingot_iridium', amount: 1 }
      ]
    }).id(id('pgm/aqua_regia_feed'))

    event.custom({
      type: 'modern_industrialization:centrifuge',
      eu: 96,
      duration: 1200,
      item_inputs: [
        { item: 'modern_industrialization:mixed_ingot_iridium', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:purified_platinum_sulfuric_solution',
        amount: 250
      },
      item_outputs: [
        { item: 'modern_industrialization:platinum_dust', amount: 1 },
        { item: 'chemlib:palladium_dust', amount: 1 },
        { item: 'chemlib:osmium_dust', amount: 1 },
        { item: 'modern_industrialization:iridium_tiny_dust', amount: 2 }
      ],
      fluid_outputs: {
        fluid: 'modern_industrialization:sulfuric_acid',
        amount: 500
      }
    }).id(id('pgm/aqua_regia_separation'))

    event.custom({
      type: 'modern_industrialization:centrifuge',
      eu: 96,
      duration: 1400,
      item_inputs: [
        { item: 'modern_industrialization:mixed_ingot_iridium', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:purified_platinum_sulfuric_solution',
        amount: 1000
      },
      item_outputs: [
        { item: 'modern_industrialization:platinum_tiny_dust', amount: 4 },
        { item: 'chemlib:palladium_dust', amount: 1 },
        { item: 'chemlib:osmium_dust', amount: 1 },
        { item: 'modern_industrialization:iridium_tiny_dust', amount: 3 }
      ],
      fluid_outputs: {
        fluid: 'modern_industrialization:sulfuric_acid',
        amount: 750
      }
    }).id(id('pgm/trace_residue_centrifuge'))

    event.custom({
      type: 'modern_industrialization:packer',
      eu: 32,
      duration: 200,
      item_inputs: [
        { item: 'modern_industrialization:iridium_tiny_dust', amount: 9 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:iridium_dust', amount: 1 }
      ]
    }).id(id('pgm/iridium_dust_from_trace'))

    ;[
      ['platinum_ingot', 'modern_industrialization:platinum_dust', 'modern_industrialization:platinum_ingot'],
      ['palladium_ingot', 'chemlib:palladium_dust', 'chemlib:palladium_ingot'],
      ['osmium_ingot', 'chemlib:osmium_dust', 'chemlib:osmium_ingot'],
      ['chemlib_iridium_ingot', 'chemlib:iridium_dust', 'chemlib:iridium_ingot'],
      ['mi_iridium_ingot', 'modern_industrialization:iridium_dust', 'modern_industrialization:iridium_ingot']
    ].forEach(([name, inputItem, outputItem]) => {
      event.custom({
        type: 'modern_industrialization:blast_furnace',
        eu: 128,
        duration: 700,
        item_inputs: [
          { item: inputItem, amount: 1 },
          { item: 'chemlib:boron_dust', amount: 1 }
        ],
        item_outputs: [
          { item: outputItem, amount: 1 }
        ]
      }).id(id(`pgm/${name}`))
    })

    ;[
      ['platinum_plate', 'modern_industrialization:platinum_ingot', 'modern_industrialization:platinum_plate'],
      ['iridium_plate', 'modern_industrialization:iridium_ingot', 'modern_industrialization:iridium_plate'],
      ['palladium_plate', 'chemlib:palladium_ingot', 'chemlib:palladium_plate'],
      ['osmium_plate', 'chemlib:osmium_ingot', 'chemlib:osmium_plate'],
      ['zirconium_plate', 'chemlib:zirconium_ingot', 'chemlib:zirconium_plate']
    ].forEach(([name, inputItem, outputItem]) => {
      event.custom({
        type: 'modern_industrialization:compressor',
        eu: 32,
        duration: 300,
        item_inputs: [
          { item: inputItem, amount: 1 }
        ],
        item_outputs: [
          { item: outputItem, amount: 1 }
        ]
      }).id(id(`plates/${name}`))
    })

    event.shaped('modern_industrialization:iridium_machine_casing_pipe', [
      'IPI',
      'PCP',
      'IPI'
    ], {
      I: 'modern_industrialization:iridium_plate',
      P: 'modern_industrialization:platinum_plate',
      C: 'modern_industrialization:advanced_machine_casing'
    }).id(id('mi/iridium_machine_casing_pipe'))

    event.shaped('mekanism:alloy_atomic', [
      'PIO',
      'RCR',
      'OIP'
    ], {
      P: '#createch2:chemical_palladium_ingots',
      I: '#c:plates/iridium',
      O: '#createch2:chemical_osmium_ingots',
      R: 'mekanism:alloy_reinforced',
      C: 'electroenergetics:hanging_glass_insulator'
    }).id(id('catalyst/pgm_atomic_alloy'))

    event.shaped('mekanism:alloy_atomic', [
      'PRP',
      'ICI',
      'OAO'
    ], {
      P: '#c:dusts/platinum',
      R: 'mekanism:alloy_reinforced',
      I: 'modern_industrialization:iridium_tiny_dust',
      C: 'modern_industrialization:purified_platinum_sulfuric_solution_bucket',
      O: '#createch2:chemical_osmium_dusts',
      A: 'mekanism:alloy_infused'
    }).id(id('catalyst/regenerate_atomic_alloy'))

    event.shaped(Item.of('mekanism:elite_control_circuit', 2), [
      'PAP',
      'ICI',
      'OAO'
    ], {
      P: 'modern_industrialization:platinum_plate',
      A: 'mekanism:alloy_atomic',
      I: 'modern_industrialization:iridium_tiny_dust',
      C: '#createch2:mekanism_advanced_control',
      O: '#createch2:chemical_osmium_ingots'
    }).id(id('mekanism/elite_control_circuit'))

    event.shaped(Item.of('mekanism:elite_pressurized_tube', 8), [
      'PAP',
      'TCT',
      'PAP'
    ], {
      P: 'modern_industrialization:platinum_plate',
      A: 'mekanism:alloy_atomic',
      T: 'mekanism:advanced_pressurized_tube',
      C: 'modern_industrialization:iridium_tiny_dust'
    }).id(id('mekanism/elite_pressurized_tube'))

    event.shaped('mekanism:elite_chemical_tank', [
      'PAP',
      'TCT',
      'PAP'
    ], {
      P: 'modern_industrialization:platinum_plate',
      A: 'mekanism:alloy_atomic',
      T: 'mekanism:advanced_chemical_tank',
      C: 'mekanism:elite_control_circuit'
    }).id(id('mekanism/elite_chemical_tank'))

    event.shaped(Item.of('mekanism:elite_mechanical_pipe', 8), [
      'PAP',
      'TCT',
      'PAP'
    ], {
      P: 'modern_industrialization:platinum_plate',
      A: 'mekanism:alloy_atomic',
      T: 'mekanism:advanced_mechanical_pipe',
      C: 'modern_industrialization:iridium_tiny_dust'
    }).id(id('mekanism/elite_mechanical_pipe'))

    event.shaped(Item.of('mekanism:advanced_thermodynamic_conductor', 8), [
      'PTP',
      'ACA',
      'PTP'
    ], {
      P: 'modern_industrialization:platinum_plate',
      T: 'mekanism:advanced_pressurized_tube',
      A: 'mekanism:alloy_atomic',
      C: 'modern_industrialization:iridium_tiny_dust'
    }).id(id('mekanism/advanced_thermodynamic_conductor'))

    event.custom({
      type: 'modern_industrialization:macerator',
      eu: 64,
      duration: 500,
      item_inputs: [
        { item: 'modern_industrialization:mixed_ingot_iridium', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:iridium_tiny_dust', amount: 2 },
        { item: 'modern_industrialization:blastproof_alloy_ingot', amount: 1 },
        { item: 'modern_industrialization:platinum_tiny_dust', amount: 1 }
      ]
    }).id(id('recycling/mixed_iridium_ingot'))

    event.shaped('mekanism:geiger_counter', [
      'PGP',
      'ICI',
      'PDP'
    ], {
      P: 'modern_industrialization:platinum_plate',
      G: 'minecraft:glowstone_dust',
      I: 'modern_industrialization:iridium_plate',
      C: 'modern_industrialization:processing_unit',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('sensor/geiger_counter'))

    event.shaped('mekanism:dosimeter', [
      ' P ',
      'ICI',
      ' D '
    ], {
      P: 'modern_industrialization:platinum_plate',
      I: 'modern_industrialization:iridium_tiny_dust',
      C: 'modern_industrialization:digital_circuit',
      D: 'minecraft:glowstone_dust'
    }).id(id('sensor/dosimeter'))

    event.shaped('mekanism:module_geiger_unit', [
      'GIG',
      'CMC',
      'GIG'
    ], {
      G: 'minecraft:glowstone_dust',
      I: 'modern_industrialization:iridium_plate',
      C: 'modern_industrialization:processing_unit',
      M: 'mekanism:module_base'
    }).id(id('sensor/geiger_module'))

    event.shaped('mekanism:module_radiation_shielding_unit', [
      'LPL',
      'CMC',
      'LIL'
    ], {
      L: '#c:ingots/lead',
      P: 'chemlib:palladium_plate',
      C: 'modern_industrialization:platinum_plate',
      M: 'mekanism:module_base',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('shielding/radiation_module'))

    event.shaped('megacells:accumulation_processor_press', [
      'PPP',
      'PIP',
      'PDP'
    ], {
      P: 'modern_industrialization:platinum_plate',
      I: 'modern_industrialization:iridium_plate',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('megacells/accumulation_processor_press'))

    event.custom({
      type: 'ae2:inscriber',
      ingredients: {
        middle: { item: 'modern_industrialization:platinum_plate' },
        top: { item: 'megacells:accumulation_processor_press' }
      },
      mode: 'inscribe',
      result: {
        count: 1,
        id: 'megacells:printed_accumulation_processor'
      }
    }).id(id('megacells/printed_accumulation_processor'))

    event.custom({
      type: 'ae2:inscriber',
      ingredients: {
        bottom: { item: 'ae2:printed_silicon' },
        middle: { item: 'modern_industrialization:iridium_tiny_dust' },
        top: { item: 'megacells:printed_accumulation_processor' }
      },
      mode: 'press',
      result: {
        count: 1,
        id: 'megacells:accumulation_processor'
      }
    }).id(id('megacells/accumulation_processor'))

    event.shaped('megacells:mega_item_cell_housing', [
      'QIQ',
      'P P',
      'SDS'
    ], {
      Q: 'ae2:quartz_vibrant_glass',
      I: 'modern_industrialization:iridium_plate',
      P: 'modern_industrialization:platinum_plate',
      S: 'modern_industrialization:stainless_steel_plate',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('megacells/mega_item_cell_housing'))

    event.shaped('megacells:cell_component_1m', [
      'CAC',
      'BIB',
      'CAC'
    ], {
      C: 'ae2:cell_component_256k',
      A: 'megacells:accumulation_processor',
      B: 'electroenergetics:hanging_glass_insulator',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('megacells/cell_component_1m'))

    event.shaped('megacells:cell_component_4m', [
      'CPC',
      'AIA',
      'CPC'
    ], {
      C: 'megacells:cell_component_1m',
      P: 'modern_industrialization:platinum_plate',
      A: 'megacells:accumulation_processor',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('megacells/cell_component_4m'))

    event.shapeless('megacells:item_storage_cell_1m', [
      'megacells:mega_item_cell_housing',
      'megacells:cell_component_1m',
      'ae2:engineering_processor'
    ]).id(id('megacells/item_storage_cell_1m'))

    event.shapeless('megacells:item_storage_cell_4m', [
      'megacells:mega_item_cell_housing',
      'megacells:cell_component_4m',
      'ae2:engineering_processor'
    ]).id(id('megacells/item_storage_cell_4m'))

    ;[
      ['poor', 1, 0],
      ['normal', 2, 1],
      ['rich', 3, 1]
    ].forEach(([grade, primaryAmount, byproductAmount]) => {
      var uraniniteOutputs = [
        { item: 'mekanism:dust_uranium', amount: primaryAmount }
      ]
      if (byproductAmount > 0) {
        uraniniteOutputs.push({
          item: 'chemlib:uranium_dust',
          amount: byproductAmount
        })
      }

      event.custom({
        type: 'modern_industrialization:macerator',
        eu: 64,
        duration: 400,
        item_inputs: [
          { tag: `createch2:tfc_ores/uraninite/${grade}`, amount: 1 },
          {
            item: 'modern_industrialization:digital_circuit',
            amount: 1,
            probability: 0
          }
        ],
        item_outputs: uraniniteOutputs
      }).id(id(`nuclear/uraninite_concentrate/${grade}`))
    })

    // Preserve the native fluorine atomizer's 500 mB -> 8 element packets.
    // Its 51 paid calls at 50 FE equal 255 EU at the unchanged 10 FE/EU.
    // MI's chemical reactor accepts this fluid-to-item handoff; its packer
    // accepts item inputs only. Keep the same bill, energy, timing and ID.
    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 5,
      duration: 51,
      fluid_inputs: { fluid: 'chemica:fluorine', amount: 500 },
      item_outputs: [{ item: 'chemlib:fluorine', amount: 8 }]
    }).id(id('nuclear/elemental_fluorine'))

    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 96,
      duration: 900,
      item_inputs: [
        { item: 'mekanism:dust_uranium', amount: 2 },
        { item: 'chemlib:fluorine', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:sulfuric_acid',
        amount: 2000
      },
      item_outputs: [
        { item: 'mekanism:yellow_cake_uranium', amount: 3 },
        { item: 'chemlib:uranium_dust', amount: 1 }
      ],
      fluid_outputs: {
        fluid: 'modern_industrialization:sulfuric_acid',
        amount: 500
      }
    }).id(id('nuclear/yellow_cake'))

    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 128,
      duration: 1000,
      item_inputs: [
        { item: 'mekanism:yellow_cake_uranium', amount: 2 },
        { item: 'chemlib:fluorine', amount: 1 },
        { item: 'modern_industrialization:iridium_tiny_dust', amount: 1 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:hydrochloric_acid', amount: 1000 },
        { fluid: 'modern_industrialization:chlorine', amount: 1000 }
      ],
      item_outputs: [
        { item: 'mekanism:uranium_oxide_bucket', amount: 1 }
      ]
    }).id(id('nuclear/uranium_oxide_precursor'))

    ;[
      ['poor', 1, 0.1],
      ['normal', 2, 0.25],
      ['rich', 3, 0.5]
    ].forEach(([grade, primaryAmount, boronChance]) => {
      event.custom({
        type: 'modern_industrialization:macerator',
        eu: 64,
        duration: 400,
        item_inputs: [
          { tag: `createch2:tfc_ores/zircon/${grade}`, amount: 1 },
          {
            item: 'modern_industrialization:digital_circuit',
            amount: 1,
            probability: 0
          }
        ],
        item_outputs: [
          { item: 'chemlib:zirconium_dust', amount: primaryAmount },
          { item: 'chemlib:boron_dust', amount: 1, probability: boronChance }
        ]
      }).id(id(`nuclear/zircon_concentrate/${grade}`))
    })

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 128,
      duration: 700,
      item_inputs: [
        { item: 'chemlib:zirconium_dust', amount: 1 },
        { item: 'chemlib:boron_dust', amount: 1 }
      ],
      item_outputs: [
        { item: 'chemlib:zirconium_ingot', amount: 1 }
      ]
    }).id(id('nuclear/zirconium_ingot'))

    event.shaped('modern_industrialization:mixed_plate_nuclear', [
      'ZIZ',
      'PTP',
      'ZBZ'
    ], {
      Z: 'chemlib:zirconium_plate',
      I: 'modern_industrialization:iridium_plate',
      P: 'modern_industrialization:platinum_plate',
      T: 'modern_industrialization:titanium_plate',
      B: 'chemlib:boron_dust'
    }).id(id('nuclear/mixed_plate'))

    event.shaped('modern_industrialization:nuclear_alloy_plate', [
      'ZIZ',
      'PNP',
      'ZIZ'
    ], {
      Z: 'chemlib:zirconium_plate',
      I: 'modern_industrialization:iridium_plate',
      P: 'modern_industrialization:platinum_plate',
      N: 'modern_industrialization:mixed_plate_nuclear'
    }).id(id('nuclear/alloy_plate'))

    event.shaped('mekanism:dynamic_tank', [
      'SPS',
      'PIP',
      'SZS'
    ], {
      S: '#c:ingots/steel',
      P: 'modern_industrialization:platinum_plate',
      I: 'modern_industrialization:iridium_tiny_dust',
      Z: 'chemlib:zirconium_plate'
    }).id(id('nuclear/dynamic_tank'))

    event.shaped('mekanism:dynamic_valve', [
      'SPS',
      'PDP',
      'SES'
    ], {
      S: '#c:ingots/steel',
      P: 'modern_industrialization:platinum_plate',
      D: 'modern_industrialization:digital_circuit',
      E: 'mekanism:elite_mechanical_pipe'
    }).id(id('nuclear/dynamic_valve'))

    event.shaped('8x mekanism:elite_thermodynamic_conductor', [
      'PIP',
      'CNC',
      'PIP'
    ], {
      P: 'modern_industrialization:platinum_plate',
      I: 'modern_industrialization:iridium_tiny_dust',
      C: 'mekanism:advanced_thermodynamic_conductor',
      N: 'modern_industrialization:nuclear_alloy_plate'
    }).id(id('nuclear/coolant_test_loop'))

    event.shaped('mekanism:radioactive_waste_barrel', [
      'LIL',
      'PDP',
      'LIL'
    ], {
      L: '#c:ingots/lead',
      I: 'modern_industrialization:iridium_plate',
      P: 'modern_industrialization:platinum_plate',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('nuclear/waste_barrel'))

    event.shaped('4x mekanismgenerators:fission_reactor_casing', [
      'SNS',
      'NIN',
      'SNS'
    ], {
      S: 'modern_industrialization:stainless_steel_large_plate',
      N: 'modern_industrialization:nuclear_alloy_plate',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('nuclear/fission_casing'))

    event.shaped('2x mekanismgenerators:reactor_glass', [
      'GNG',
      'NIN',
      'GNG'
    ], {
      G: 'minecraft:orange_stained_glass',
      N: 'modern_industrialization:nuclear_alloy_plate',
      I: 'modern_industrialization:iridium_tiny_dust'
    }).id(id('nuclear/reactor_glass'))

    event.shaped('mekanismgenerators:fission_reactor_port', [
      'NPN',
      'PDP',
      'NPN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      P: 'mekanism:elite_pressurized_tube',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('nuclear/fission_port'))



    event.shaped('mekanismgenerators:fission_reactor_logic_adapter', [
      'ICI',
      'GPG',
      'IDI'
    ], {
      I: 'modern_industrialization:iridium_plate',
      C: 'mekanism:elite_control_circuit',
      G: 'mekanism:geiger_counter',
      P: 'modern_industrialization:processing_unit',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('nuclear/reactor_logic_adapter'))
  })

  compileFamily('Age 12 — Cosmonautics', () => {
    var id = name => `createch2:cosmonautics/${name}`

    removeOutputRecipes([
      'rocketnautics:copper_nozzle',
      'rocketnautics:copper_anchor_boots',
      'rocketnautics:copper_leg_thrusters',
      'rocketnautics:titanium_nozzle',
      'rocketnautics:jetpack',
      'rocketnautics:rcs_thruster',
      'rocketnautics:separator',
      'rocketnautics:rocket_thruster',
      'rocketnautics:booster_thruster',
      'rocketnautics:vector_thruster',
      'rocketnautics:magnetic_stabilizer',
      'rocketnautics:sputnik',
      'rocketnautics:hologram_block'
    ])

    removeOutputRecipes([/^rocketnautics:titanium_(?:ingot|block|nugget)$/])
    removeRecipe({ id: /^rocketnautics:(?:smelting|blasting)\/titanium_ingot_from_/ })

    event.shaped('rocketnautics:copper_nozzle', [
      ' A ',
      'BCB',
      'D D'
    ], {
      A: '#c:plates/gold',
      B: '#c:plates/copper',
      C: 'modern_industrialization:titanium_plate',
      D: 'tfmg:steel_mechanism'
    }).id(id('components/copper_nozzle'))

    event.shaped('rocketnautics:copper_anchor_boots', [
      'C C',
      'C C',
      'T T'
    ], {
      C: '#c:plates/copper',
      T: 'modern_industrialization:titanium_plate'
    }).id(id('equipment/copper_anchor_boots'))

    event.shaped('rocketnautics:copper_leg_thrusters', [
      'PAP',
      'C C',
      'N N'
    ], {
      P: 'create:precision_mechanism',
      A: 'create:andesite_alloy',
      C: '#c:plates/copper',
      N: 'rocketnautics:copper_nozzle'
    }).id(id('equipment/copper_leg_thrusters'))

    event.shaped('rocketnautics:titanium_nozzle', [
      ' A ',
      'BCB',
      'D D'
    ], {
      A: '#c:plates/obsidian',
      B: 'rocketnautics:titanium_alloy_sheet',
      C: 'modern_industrialization:titanium_plate',
      D: 'rocketnautics:titanium_alloy'
    }).id(id('components/titanium_nozzle'))

    event.shaped('rocketnautics:jetpack', [
      'PRP',
      'TBT',
      'N N'
    ], {
      P: 'modern_industrialization:processing_unit',
      R: 'stellaris:big_rocket_upgrade',
      T: 'modern_industrialization:titanium_plate',
      B: 'create:netherite_backtank',
      N: 'rocketnautics:titanium_nozzle'
    }).id(id('equipment/jetpack'))

    event.shaped('rocketnautics:rcs_thruster', [
      ' R ',
      'DCD',
      ' T '
    ], {
      R: '#c:dusts/redstone',
      D: 'modern_industrialization:digital_circuit',
      C: 'stellaris:corronium_ingot',
      T: 'modern_industrialization:titanium_plate'
    }).id(id('mechanisms/rcs_thruster'))

    event.shaped('rocketnautics:separator', [
      'H',
      'P',
      'Z'
    ], {
      H: 'tfmg:heavy_plate',
      P: 'create:precision_mechanism',
      Z: '#c:ingots/zinc'
    }).id(id('mechanisms/separator'))

    event.shaped('rocketnautics:hologram_block', [
      'AGA',
      'ITI',
      'PPP'
    ], {
      A: 'minecraft:amethyst_shard',
      G: 'minecraft:glass',
      I: 'modern_industrialization:digital_circuit',
      T: 'rocketnautics:titanium_casing',
      P: 'modern_industrialization:titanium_plate'
    }).id(id('hologram_block'))

    event.shaped('rocketnautics:magnetic_stabilizer', [
      'SDS',
      'CTC',
      'RBR'
    ], {
      S: '#createch2:iridium_sensors',
      D: 'modern_industrialization:digital_circuit',
      C: 'electroenergetics:hanging_glass_insulator',
      T: 'rocketnautics:titanium_casing',
      R: '#c:storage_blocks/redstone',
      B: '#c:storage_blocks/iron'
    }).id(id('magnetic_stabilizer'))

    event.shaped('rocketnautics:sputnik', [
      'LSL',
      'ICI',
      'LSL'
    ], {
      L: 'minecraft:lightning_rod',
      S: 'modern_industrialization:digital_circuit',
      I: 'modern_industrialization:iridium_plate',
      C: 'stellaris:rocket_station'
    }).id(id('sputnik'))

    event.custom({
      type: 'create:mechanical_crafting',
      accept_mirrored: false,
      category: 'misc',
      key: {
        A: { item: 'modern_industrialization:titanium_plate' },
        B: { item: 'modern_industrialization:digital_circuit' },
        C: { item: 'rocketnautics:titanium_casing' },
        D: { item: 'stellaris:big_rocket_upgrade' },
        E: { item: 'rocketnautics:titanium_nozzle' },
        F: { item: 'modern_industrialization:advanced_pump' },
        I: { tag: 'c:plates/iridium' },
        P: { item: 'mekanism:elite_control_circuit' }
      },
      pattern: [
        'ABA',
        'CDC',
        'IEI',
        'FPF'
      ],
      result: {
        count: 1,
        id: 'rocketnautics:rocket_thruster'
      },
      show_notification: false
    }).id(id('mechanical_crafting/rocket_thruster'))

    event.custom({
      type: 'create:mechanical_crafting',
      accept_mirrored: false,
      category: 'misc',
      key: {
        A: { item: 'modern_industrialization:titanium_large_plate' },
        B: { item: 'modern_industrialization:digital_circuit' },
        C: { item: 'rocketnautics:titanium_casing' },
        D: { item: 'stellaris:big_rocket_upgrade' },
        E: { item: 'rocketnautics:titanium_nozzle' },
        F: { item: 'modern_industrialization:advanced_pump' },
        I: { tag: 'c:plates/iridium' },
        P: { item: 'mekanism:elite_control_circuit' }
      },
      pattern: [
        'ABA',
        'CDC',
        'IEI',
        'FPF'
      ],
      result: {
        count: 1,
        id: 'rocketnautics:booster_thruster'
      },
      show_notification: false
    }).id(id('mechanical_crafting/booster_thruster'))

    event.shapeless('rocketnautics:vector_thruster', [
      'rocketnautics:rocket_thruster',
      'rocketnautics:rcs_thruster',
      'modern_industrialization:advanced_motor',
      'mekanism:elite_control_circuit',
      '#createch2:iridium_sensors'
    ]).id(id('mechanisms/vector_thruster'))
  })

  compileFamily('Age 13 — Nuclear', () => {
    var id = name => `createch2:nuclear/${name}`

    // National-chemical-complex scale: the high-voltage reactor batches the
    // same TFMG propylene/sulfur chemistry without becoming an earlier unlock.
    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 512,
      duration: 1200,
      item_inputs: [
        { item: 'tfmg:sulfur_dust', amount: 8 },
        { item: 'modern_industrialization:digital_circuit', amount: 1, probability: 0 }
      ],
      fluid_inputs: {
        fluid: 'tfmg:propylene',
        amount: 8000
      },
      item_outputs: {
        item: 'tfmg:rubber_sheet',
        amount: 64
      }
    }).id(id('national_chemical_complex/bulk_synthetic_rubber'))

    ;[
      /^mekanism:processing\/uranium\/fissile_fuel$/,
      /^mekanism:processing\/uranium\/reprocessing\/.*$/,
      /^mekanism:processing\/lategame\/plutonium$/,
      /^mekanism:processing\/lategame\/plutonium_pellet\/.*$/,
      /^mekanism:processing\/lategame\/polonium.*$/,
      /^mekanismgenerators:turbine\/.*$/,
      /^mekanismgenerators:chemical_infusing\/fusion_fuel$/,
      /^mekanismgenerators:rotary\/fusion_fuel$/,
      'mekanism:isotopic_centrifuge',
      'mekanism:solar_neutron_activator',
      'mekanism:antiprotonic_nucleosynthesizer',
      'mekanism:sps_casing',
      'mekanism:sps_port',
      'mekanism:supercharged_coil',
      'modern_industrialization:electric_age/machine/fusion_reactor_asbl',
      'modern_industrialization:electric_age/machine/plasma_turbine_asbl',
      'modern_industrialization:electric_age/casing/quantum_machine_casing_asbl',
      'modern_industrialization:electric_age/hull/quantum_machine_hull_asbl'
    ].forEach(recipeId => event.remove({ id: recipeId }))

    // CROWNS supplies the Create-native reactor hardware. Mekanism remains the
    // authoritative radiation, fissile-fuel, waste and industrial turbine system.
    removeOutputRecipes([
      'crowns:heat_exchanger',
      'crowns:fuel_rod',
      'crowns:fuel_assembly',
      'crowns:steam_input',
      'crowns:steam_collector',
      'crowns:turbine_casing',
      'crowns:turbine_stage',
      'crowns:compressor'
    ])

    removeOutputRecipes([
      'mekanism:isotopic_centrifuge',
      'mekanism:solar_neutron_activator',
      'mekanism:antiprotonic_nucleosynthesizer',
      'mekanism:sps_casing',
      'mekanism:sps_port',
      'mekanism:supercharged_coil',
      'mekanism:pellet_plutonium',
      'mekanism:pellet_polonium',
      'mekanism:pellet_antimatter',
      'modern_industrialization:uranium_fuel_rod',
      'modern_industrialization:uranium_fuel_rod_double',
      'modern_industrialization:uranium_fuel_rod_quad',
      'modern_industrialization:uranium_fuel_rod_depleted',
      'modern_industrialization:fusion_reactor',
      'modern_industrialization:fusion_chamber',
      'modern_industrialization:plasma_turbine',
      'modern_industrialization:quantum_machine_casing',
      'modern_industrialization:quantum_machine_hull',
      'mekanismgenerators:turbine_casing',
      'mekanismgenerators:turbine_valve',
      'mekanismgenerators:turbine_vent',
      'mekanismgenerators:turbine_blade',
      'mekanismgenerators:turbine_rotor',
      'mekanismgenerators:rotational_complex',
      'mekanismgenerators:electromagnetic_coil',
      'mekanismgenerators:saturating_condenser',
      'mekanismgenerators:fission_fuel_assembly'
    ])

    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 192,
      duration: 1200,
      item_inputs: [
        { item: 'mekanism:uranium_oxide_bucket', amount: 1 },
        { item: 'chemlib:fluorine', amount: 2 },
        { tag: 'createch2:chemical_catalyst_media', amount: 1 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:hydrochloric_acid', amount: 1000 },
        { fluid: 'modern_industrialization:chlorine', amount: 1000 }
      ],
      item_outputs: [
        { item: 'mekanism:uranium_hexafluoride_bucket', amount: 1 },
        { item: 'modern_industrialization:uranium_238_tiny_dust', amount: 2 }
      ]
    }).id(id('uranium/hexafluoride_feedstock'))

    event.custom({
      type: 'modern_industrialization:centrifuge',
      eu: 256,
      duration: 1800,
      item_inputs: [
        { item: 'mekanism:uranium_hexafluoride_bucket', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:uranium_235_tiny_dust', amount: 2 },
        { item: 'modern_industrialization:uranium_238_dust', amount: 2 }
      ]
    }).id(id('uranium/enrichment_cascade'))

    event.custom({
      type: 'mekanism:centrifuging',
      input: {
        amount: 1,
        chemical: 'mekanism:uranium_hexafluoride'
      },
      output: {
        amount: 1,
        id: 'mekanism:fissile_fuel'
      }
    }).id(id('uranium/fissile_fuel'))

    event.custom({
      type: 'modern_industrialization:packer',
      eu: 32,
      duration: 200,
      item_inputs: [
        { item: 'modern_industrialization:uranium_235_tiny_dust', amount: 9 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:uranium_235_dust', amount: 1 }
      ]
    }).id(id('uranium/uranium_235_dust'))

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 128,
      duration: 700,
      item_inputs: [
        { item: 'modern_industrialization:uranium_235_dust', amount: 1 },
        { item: 'chemlib:boron_dust', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:uranium_235_ingot', amount: 1 }
      ]
    }).id(id('uranium/fuel_pellet'))

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 128,
      duration: 700,
      item_inputs: [
        { item: 'modern_industrialization:uranium_238_dust', amount: 1 },
        { item: 'chemlib:boron_dust', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:uranium_238_ingot', amount: 1 }
      ]
    }).id(id('uranium/depleted_fraction'))

    event.shaped('modern_industrialization:uranium_fuel_rod', [
      'ZUZ',
      'ZUZ',
      'ZUZ'
    ], {
      Z: 'chemlib:zirconium_plate',
      U: 'modern_industrialization:uranium_235_ingot'
    }).id(id('fuel/uranium_fuel_rod'))

    event.shaped('modern_industrialization:uranium_fuel_rod_double', [
      'NUN',
      'BPB',
      'NUN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      U: 'modern_industrialization:uranium_fuel_rod',
      B: 'chemlib:boron_dust',
      P: 'modern_industrialization:platinum_plate'
    }).id(id('fuel/uranium_fuel_rod_double'))

    event.shaped('modern_industrialization:uranium_fuel_rod_quad', [
      'NUN',
      'UIU',
      'NUN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      U: 'modern_industrialization:uranium_fuel_rod_double',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('fuel/uranium_fuel_rod_quad'))


    event.shaped('mekanism:isotopic_centrifuge', [
      'LIL',
      'CTC',
      'LPL'
    ], {
      L: '#c:ingots/lead',
      I: 'modern_industrialization:iridium_plate',
      C: 'mekanism:elite_control_circuit',
      T: 'mekanism:elite_chemical_tank',
      P: 'modern_industrialization:advanced_pump'
    }).id(id('mekanism/isotopic_centrifuge'))

    event.shaped('mekanism:solar_neutron_activator', [
      'QPQ',
      'CTC',
      'NIN'
    ], {
      Q: 'ae2:quartz_vibrant_glass',
      P: 'modern_industrialization:platinum_plate',
      C: 'mekanism:elite_control_circuit',
      T: 'mekanism:elite_chemical_tank',
      N: 'modern_industrialization:nuclear_alloy_plate',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('mekanism/solar_neutron_activator'))

    event.custom({
      type: 'mekanism:centrifuging',
      input: {
        amount: 10,
        chemical: 'mekanism:nuclear_waste'
      },
      output: {
        amount: 1,
        id: 'mekanism:plutonium'
      }
    }).id(id('reprocessing/plutonium_from_waste'))

    event.custom({
      type: 'mekanism:oxidizing',
      input: {
        count: 1,
        item: 'mekanism:reprocessed_fissile_fragment'
      },
      output: {
        amount: 2000,
        id: 'mekanism:fissile_fuel'
      }
    }).id(id('reprocessing/recovered_fissile_fuel'))

    event.custom({
      type: 'mekanism:reaction',
      chemical_input: {
        amount: 1000,
        chemical: 'mekanism:nuclear_waste'
      },
      chemical_output: {
        amount: 1000,
        id: 'mekanism:spent_nuclear_waste'
      },
      duration: 200,
      fluid_input: {
        amount: 1000,
        tag: 'minecraft:water'
      },
      item_input: {
        count: 1,
        item: 'modern_industrialization:uranium_fuel_rod'
      },
      item_output: {
        count: 1,
        id: 'mekanism:reprocessed_fissile_fragment'
      }
    }).id(id('reprocessing/spent_fuel_fragment'))

    event.custom({
      type: 'mekanism:reaction',
      chemical_input: {
        amount: 1000,
        chemical: 'mekanism:plutonium'
      },
      chemical_output: {
        amount: 1000,
        id: 'mekanism:spent_nuclear_waste'
      },
      duration: 160,
      fluid_input: {
        amount: 1000,
        tag: 'minecraft:water'
      },
      item_input: {
        count: 1,
        tag: 'createch2:chemical_catalyst_media'
      },
      item_output: {
        count: 1,
        id: 'mekanism:pellet_plutonium'
      }
    }).id(id('reprocessing/plutonium_pellet'))

    event.shaped('mekanismgenerators:turbine_casing', [
      'NPN',
      'PIP',
      'NPN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      P: 'modern_industrialization:platinum_plate',
      I: 'modern_industrialization:iridium_tiny_dust'
    }).id(id('turbine/casing'))

    event.shaped('mekanismgenerators:turbine_valve', [
      'NPN',
      'PDP',
      'NPN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      P: 'mekanism:elite_mechanical_pipe',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('turbine/valve'))

    event.shaped('mekanismgenerators:turbine_vent', [
      'NPN',
      'PDP',
      'NPN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      P: 'mekanism:elite_pressurized_tube',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('turbine/vent'))

    event.shaped('mekanismgenerators:turbine_blade', [
      ' N ',
      ' P ',
      ' I '
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      P: 'modern_industrialization:platinum_plate',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('turbine/blade'))

    event.shaped('mekanismgenerators:turbine_rotor', [
      ' B ',
      'BIB',
      ' B '
    ], {
      B: 'mekanismgenerators:turbine_blade',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('turbine/rotor'))

    event.shaped('mekanismgenerators:rotational_complex', [
      'NIN',
      'RCR',
      'NIN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      I: 'modern_industrialization:iridium_plate',
      R: 'mekanismgenerators:turbine_rotor',
      C: 'modern_industrialization:processing_unit'
    }).id(id('turbine/rotational_complex'))

    event.shaped('mekanismgenerators:electromagnetic_coil', [
      'SPS',
      'PIP',
      'SPS'
    ], {
      S: 'modern_industrialization:stainless_steel_rod_magnetic',
      P: 'modern_industrialization:platinum_plate',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('turbine/electromagnetic_coil'))

    event.shaped('mekanismgenerators:saturating_condenser', [
      'PIP',
      'THT',
      'PWP'
    ], {
      P: 'modern_industrialization:platinum_plate',
      I: 'modern_industrialization:iridium_tiny_dust',
      T: 'mekanism:elite_thermodynamic_conductor',
      H: 'modern_industrialization:heat_exchanger',
      W: 'crowns:heat_exchanger'
    }).id(id('turbine/saturating_condenser'))

    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 128,
      duration: 1200,
      item_inputs: [
        { item: 'mekanism:pellet_plutonium', amount: 1 },
        { tag: 'c:dusts/lithium', amount: 1 },
        { tag: 'createch2:chemical_filter_media', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'minecraft:water',
        amount: 4000
      },
      item_outputs: [
        { item: 'modern_industrialization:superconductor_tiny_dust', amount: 2 }
      ],
      fluid_outputs: {
        fluid: 'modern_industrialization:deuterium',
        amount: 1000
      }
    }).id(id('fusion_prep/deuterium_trace'))

    event.shaped(Item.of('crowns:heat_exchanger', 4), [
      'TNT',
      'LCL',
      'TNT'
    ], {
      T: 'mekanism:elite_thermodynamic_conductor',
      N: 'modern_industrialization:nuclear_alloy_plate',
      L: '#c:ingots/lead',
      C: 'mekanism:elite_control_circuit'
    }).id(id('crowns/heat_exchanger'))

    event.shaped('crowns:fuel_rod', [
      'ZUZ',
      'NPN',
      'ZUZ'
    ], {
      Z: 'chemlib:zirconium_plate',
      U: 'modern_industrialization:uranium_fuel_rod',
      N: 'modern_industrialization:nuclear_alloy_plate',
      P: 'mekanism:elite_control_circuit'
    }).id(id('crowns/fuel_rod'))

    event.shaped('crowns:fuel_assembly', [
      'RCR',
      'FAF',
      'RHR'
    ], {
      R: 'crowns:fuel_rod',
      C: 'mekanismgenerators:control_rod_assembly',
      F: 'mekanismgenerators:fission_fuel_assembly',
      A: 'modern_industrialization:nuclear_alloy_plate',
      H: 'crowns:heat_exchanger'
    }).id(id('crowns/fuel_assembly'))

    event.shaped('crowns:steam_input', [
      'PTP',
      'NHN',
      'PVP'
    ], {
      P: 'modern_industrialization:nuclear_alloy_plate',
      T: 'mekanism:elite_pressurized_tube',
      N: 'mekanism:elite_thermodynamic_conductor',
      H: 'crowns:heat_exchanger',
      V: 'mekanismgenerators:turbine_valve'
    }).id(id('crowns/steam_input'))

    event.shaped('crowns:steam_collector', [
      'PCP',
      'NHN',
      'PTP'
    ], {
      P: 'modern_industrialization:nuclear_alloy_plate',
      C: 'mekanismgenerators:saturating_condenser',
      N: 'mekanism:elite_thermodynamic_conductor',
      H: 'crowns:heat_exchanger',
      T: 'mekanism:elite_pressurized_tube'
    }).id(id('crowns/steam_collector'))

    event.shaped(Item.of('crowns:turbine_casing', 4), [
      'NLN',
      'LCL',
      'NLN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      L: '#c:ingots/lead',
      C: 'mekanismgenerators:turbine_casing'
    }).id(id('crowns/turbine_casing'))

    event.shaped('crowns:turbine_stage', [
      'BRB',
      'TCT',
      'BRB'
    ], {
      B: 'mekanismgenerators:turbine_blade',
      R: 'mekanismgenerators:turbine_rotor',
      T: 'crowns:turbine_casing',
      C: 'mekanismgenerators:rotational_complex'
    }).id(id('crowns/turbine_stage'))

    event.shaped('crowns:compressor', [
      'PBP',
      'SCS',
      'PBP'
    ], {
      P: 'modern_industrialization:nuclear_alloy_plate',
      B: 'create:brass_casing',
      S: 'create:shaft',
      C: 'mekanism:elite_control_circuit'
    }).id(id('crowns/compressor'))


    event.shaped('alchemistry:fission_core', [
      'NAN',
      'FCF',
      'NPN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      A: 'mekanismgenerators:fission_fuel_assembly',
      F: 'crowns:fuel_assembly',
      C: 'alchemistry:compactor',
      P: 'mekanism:elite_control_circuit'
    }).id(id('alchemistry/fission_core'))

    event.shaped('alchemistry:fission_chamber_controller', [
      'NEN',
      'CFC',
      'NRN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      E: '#createch2:control/environment/harsh',
      C: 'mekanismgenerators:control_rod_assembly',
      F: 'alchemistry:fission_core',
      R: 'mekanismgenerators:fission_reactor_logic_adapter'
    }).id(id('alchemistry/fission_chamber_controller'))

    event.shaped('ae2:wireless_access_point', [
      'NCN',
      'QFQ',
      'NPN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      C: 'ae2:calculation_processor',
      Q: 'ae2:quartz_glass',
      F: 'ae2:fluix_glass_cable',
      P: 'electroenergetics:hanging_glass_insulator'
    }).id(id('ae2/wireless_access_point'))

    event.shaped('ae2:wireless_terminal', [
      'NBN',
      'TAT',
      'NPN'
    ], {
      N: 'modern_industrialization:nuclear_alloy_plate',
      B: 'electroenergetics:accumulator',
      T: 'ae2:terminal',
      A: 'ae2:wireless_access_point',
      P: 'ae2:calculation_processor'
    }).id(id('ae2/wireless_terminal'))
  })

  compileFamily('Age 15 — Quantum', () => {
    var id = name => `createch2:quantum/${name}`

    ;[
      /^avaritia:.*$/,
      /^sgjourney:.*$/,
      /^mekanism:processing\/lategame\/polonium.*$/,
      /^mekanism:processing\/lategame\/antimatter.*$/,
      /^mekanism:processing\/lategame\/antiprotonic_nucleosynthesizer.*$/,
      /^mekanismgenerators:chemical_infusing\/fusion_fuel$/,
      /^mekanismgenerators:rotary\/fusion_fuel$/,
      'modern_industrialization:electric_age/component/implosion_compressor/singularity',
      'modern_industrialization:materials/electrolyzer/uu_matter',
      'modern_industrialization:alloy/mixer/superconductor/dust',
      'modern_industrialization:electric_age/casing/quantum_machine_casing_asbl',
      'modern_industrialization:electric_age/hull/quantum_machine_hull_asbl',
      'modern_industrialization:electric_age/machine/fusion_reactor_asbl',
      'modern_industrialization:electric_age/machine/plasma_turbine_asbl',
      'ae2:network/blocks/quantum_ring',
      'ae2:network/blocks/quantum_link'
    ].forEach(recipeId => event.remove({ id: recipeId }))

    removeOutputRecipes([
      'mekanism:pellet_polonium',
      'mekanism:pellet_antimatter',
      'mekanism:module_teleportation_unit',
      'modern_industrialization:singularity',
      'modern_industrialization:uu_matter_bucket',
      'modern_industrialization:superconductor_dust',
      'modern_industrialization:superconductor_ingot',
      'modern_industrialization:superconductor_plate',
      'modern_industrialization:superconductor_wire',
      'modern_industrialization:superconductor_cable',
      'modern_industrialization:superconductor_coil',
      'modern_industrialization:superconductor_storage_unit',
      'modern_industrialization:plutonium_battery',
      'modern_industrialization:quantum_machine_casing',
      'modern_industrialization:quantum_machine_hull',
      'modern_industrialization:fusion_chamber',
      'modern_industrialization:fusion_reactor',
      'modern_industrialization:plasma_turbine',
      'modern_industrialization:replicator',
      'modern_industrialization:quantum_barrel',
      'modern_industrialization:quantum_tank',
      'modern_industrialization:quantum_upgrade',
      'ae2:quantum_ring',
      'ae2:quantum_link'
    ])

    // Retire the raw tiny-dust alloy alternative as well as the full-dust
    // mixer. Splitting already earned alloy stock into tiny dust is retained.
    event.remove({ id: 'modern_industrialization:alloy/mixer/superconductor/tiny_dust' })

    // Eight authority materials require the Assembler's metered 3x3 feed.
    // The MI Mixer exposes only four item inputs and cannot execute this blend.
    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 256,
      duration: 900,
      item_inputs: [
        { item: 'modern_industrialization:iridium_dust', amount: 1 },
        { item: 'modern_industrialization:platinum_dust', amount: 1 },
        { item: 'stellaris:corronium_ingot', amount: 1 },
        { item: 'stellaris:solerium', amount: 1 },
        { tag: 'c:dusts/lithium', amount: 1 },
        { item: 'eternal_starlight:starcore', amount: 1 },
        { item: 'eternal_starlight:aethersent_ingot', amount: 1 },
        { item: 'eternal_starlight:deepsilver_ingot', amount: 1 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:deuterium', amount: 500 },
        { fluid: 'modern_industrialization:tritium', amount: 250 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:superconductor_dust', amount: 6 }
      ]
    }).id(id('superconductor/quantum_alloy_dust'))

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 128,
      duration: 2400,
      item_inputs: [
        { item: 'modern_industrialization:superconductor_dust', amount: 1 },
        { item: 'modern_industrialization:nuclear_alloy_plate', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:superconductor_hot_ingot', amount: 1 }
      ]
    }).id(id('superconductor/hot_ingot'))

    event.custom({
      type: 'modern_industrialization:vacuum_freezer',
      eu: 256,
      duration: 450,
      item_inputs: [
        { item: 'modern_industrialization:superconductor_hot_ingot', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:cryofluid',
        amount: 500
      },
      item_outputs: [
        { item: 'modern_industrialization:superconductor_ingot', amount: 1 }
      ]
    }).id(id('superconductor/cryogenic_ingot'))

    event.custom({
      type: 'modern_industrialization:compressor',
      eu: 64,
      duration: 300,
      item_inputs: [
        { item: 'modern_industrialization:superconductor_ingot', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:superconductor_plate', amount: 1 }
      ]
    }).id(id('superconductor/plate'))

    event.custom({
      type: 'modern_industrialization:wiremill',
      eu: 64,
      duration: 300,
      item_inputs: [
        { item: 'modern_industrialization:superconductor_ingot', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:superconductor_wire', amount: 2 }
      ]
    }).id(id('superconductor/wire'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 128,
      duration: 600,
      item_inputs: [
        { item: 'modern_industrialization:superconductor_wire', amount: 3 },
        { item: 'modern_industrialization:cooling_cell', amount: 2 },
        { item: 'modern_industrialization:iridium_plate', amount: 1 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 1000 },
        { fluid: 'modern_industrialization:cryofluid', amount: 250 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:superconductor_cable', amount: 6 }
      ]
    }).id(id('superconductor/cable'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 128,
      duration: 800,
      item_inputs: [
        { item: 'modern_industrialization:superconductor_cable', amount: 8 },
        { item: 'modern_industrialization:iridium_plate', amount: 2 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:cryofluid',
        amount: 500
      },
      item_outputs: [
        { item: 'modern_industrialization:superconductor_coil', amount: 1 }
      ]
    }).id(id('superconductor/high_field_coil'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 128,
      duration: 800,
      item_inputs: [
        { item: 'mekanism:pellet_plutonium', amount: 1 },
        { item: 'electroenergetics:transformer_core', amount: 2 },
        { item: 'modern_industrialization:battery_alloy_curved_plate', amount: 4 },
        { item: 'modern_industrialization:iridium_plate', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:plutonium_battery', amount: 1 }
      ]
    }).id(id('power/plutonium_battery'))

    event.shaped('modern_industrialization:plasma_handling_iridium_machine_casing', [
      'IPI',
      'PCP',
      'IPI'
    ], {
      I: 'modern_industrialization:iridium_plate',
      P: 'modern_industrialization:platinum_plate',
      C: 'modern_industrialization:superconductor_coil'
    }).id(id('machine/plasma_handling_casing'))

    event.shaped('modern_industrialization:quantum_machine_casing', [
      'SMS',
      'IHI',
      'SMS'
    ], {
      S: 'modern_industrialization:superconductor_plate',
      M: 'eternal_starlight:malarite',
      I: 'modern_industrialization:iridium_plate',
      H: 'modern_industrialization:highly_advanced_machine_hull'
    }).id(id('machine/quantum_machine_casing'))

    event.shaped('modern_industrialization:quantum_machine_hull', [
      ' C ',
      'BQB',
      'PPP'
    ], {
      C: 'modern_industrialization:quantum_circuit',
      B: 'modern_industrialization:plutonium_battery',
      Q: 'modern_industrialization:quantum_machine_casing',
      P: 'electroenergetics:transformer_core'
    }).id(id('machine/quantum_machine_hull'))

    event.shaped('modern_industrialization:fusion_chamber', [
      'CLC',
      'PHP',
      'CLC'
    ], {
      C: 'modern_industrialization:superconductor_coil',
      L: 'modern_industrialization:nuclear_alloy_large_plate',
      P: 'modern_industrialization:plasma_handling_iridium_machine_casing',
      H: 'modern_industrialization:large_heat_exchanger'
    }).id(id('fusion/chamber'))

    // TFMG's unfinished generator is reserved for the fusion-reactor handoff;
    // retain the ordinary generator through a non-sequenced MI assembly route.
    removeOutputRecipes(['tfmg:generator'])
    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 128,
      duration: 800,
      item_inputs: [
        { item: 'create:shaft', amount: 1 },
        { item: 'tfmg:capacitor_item', amount: 2 },
        { tag: 'c:plates/steel', amount: 2 },
        { item: 'tfmg:copper_spool', amount: 2 },
        { item: 'tfmg:magnet', amount: 2 },
        { item: 'tfmg:steel_mechanism', amount: 1 },
        { item: 'tfmg:screwdriver', amount: 1, probability: 0 }
      ],
      item_outputs: [
        { item: 'tfmg:generator', amount: 1 }
      ]
    }).id(id('fusion/tfmg_generator'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 256,
      duration: 1600,
      item_inputs: [
        { item: 'modern_industrialization:quantum_machine_hull', amount: 1 },
        { item: 'modern_industrialization:fusion_chamber', amount: 6 },
        { item: 'modern_industrialization:quantum_circuit', amount: 1 },
        { item: 'modern_industrialization:superconductor_cable', amount: 8 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:cryofluid',
        amount: 1000
      },
      item_outputs: [
        { item: 'tfmg:unfinished_generator', amount: 1 }
      ]
    }).id(id('fusion/reactor_workpiece'))

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'tfmg:unfinished_generator' },
      transitional_item: { id: 'tfmg:unfinished_generator' },
      loops: 1,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_generator' },
            { item: 'modern_industrialization:quantum_circuit' }
          ],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_generator' },
            { item: 'modern_industrialization:plutonium_battery' }
          ],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'tfmg:unfinished_generator' },
            { item: 'modern_industrialization:superconductor_coil' }
          ],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_generator' }, { item: 'modern_industrialization:fusion_chamber' }],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_generator' }, { item: 'modern_industrialization:quantum_machine_hull' }],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_generator' }, { item: 'modern_industrialization:large_heat_exchanger' }],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_generator' }, { item: 'electroenergetics:sulfur_hexafluoride_breaker' }],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:deploying',
          ingredients: [{ item: 'tfmg:unfinished_generator' }, { item: 'tfmg:generator' }],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'tfmg:unfinished_generator' },
            { type: 'neoforge:single', amount: 1000, fluid: 'modern_industrialization:cryofluid' }
          ],
          results: [{ id: 'tfmg:unfinished_generator' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'tfmg:unfinished_generator' }],
          results: [{ id: 'tfmg:unfinished_generator' }]
        }
      ],
      results: [{ id: 'modern_industrialization:fusion_reactor' }]
    }).id(id('fusion/reactor_assembly'))

    event.shaped('modern_industrialization:plasma_turbine', [
      'CRC',
      'QHQ',
      'CRC'
    ], {
      C: 'modern_industrialization:superconductor_coil',
      R: 'modern_industrialization:titanium_rotor',
      Q: 'modern_industrialization:quantum_circuit',
      H: 'modern_industrialization:quantum_machine_hull'
    }).id(id('fusion/plasma_turbine'))

    event.custom({
      type: 'modern_industrialization:implosion_compressor',
      eu: 512,
      duration: 1200,
      item_inputs: [
        { item: 'modern_industrialization:ultradense_metal_ball', amount: 1 },
        { item: 'modern_industrialization:quantum_circuit', amount: 4 },
        { item: 'modern_industrialization:plutonium_battery', amount: 4 },
        { item: 'megacells:cell_component_4m', amount: 1 },
        { item: 'stellaris:solerium', amount: 4 },
        { item: 'modern_industrialization:helium_plasma_bucket', amount: 1 },
        { item: 'modern_industrialization:tritium_bucket', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:singularity', amount: 1 }
      ]
    }).id(id('matter/controlled_singularity'))

    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 512,
      duration: 2500,
      item_inputs: [
        { item: 'modern_industrialization:singularity', amount: 1, probability: 0 },
        { item: 'modern_industrialization:quantum_circuit', amount: 1, probability: 0 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:helium_plasma', amount: 1000 },
        { fluid: 'modern_industrialization:deuterium', amount: 1000 }
      ],
      fluid_outputs: [
        { fluid: 'modern_industrialization:uu_matter', amount: 250 }
      ]
    }).id(id('matter/uu_matter_from_singularity'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 128,
      duration: 1600,
      item_inputs: [
        { item: 'modern_industrialization:quantum_machine_hull', amount: 1 },
        { item: 'modern_industrialization:singularity', amount: 1 },
        { item: 'modern_industrialization:quantum_circuit_board', amount: 1 },
        { item: 'modern_industrialization:highly_advanced_upgrade', amount: 32 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:uu_matter',
        amount: 50
      },
      item_outputs: [
        { item: 'modern_industrialization:quantum_upgrade', amount: 1 }
      ]
    }).id(id('machine/quantum_upgrade'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 256,
      duration: 1600,
      item_inputs: [
        { item: 'modern_industrialization:quantum_machine_hull', amount: 1 },
        { item: 'modern_industrialization:quantum_upgrade', amount: 2 },
        { item: 'modern_industrialization:quantum_circuit', amount: 4 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:uu_matter',
        amount: 500
      },
      item_outputs: [
        { item: 'modern_industrialization:replicator', amount: 1 }
      ]
    }).id(id('matter/replicator'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 256,
      duration: 1200,
      item_inputs: [
        { item: 'modern_industrialization:quantum_machine_hull', amount: 1 },
        { item: 'modern_industrialization:singularity', amount: 1 },
        { item: 'modern_industrialization:quantum_circuit', amount: 2 },
        { item: 'modern_industrialization:iridium_plate', amount: 16 },
        { item: 'modern_industrialization:large_advanced_motor', amount: 8 },
        { item: 'modern_industrialization:titanium_barrel', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:quantum_barrel', amount: 1 }
      ]
    }).id(id('storage/quantum_barrel'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 256,
      duration: 1200,
      item_inputs: [
        { item: 'modern_industrialization:quantum_machine_hull', amount: 1 },
        { item: 'modern_industrialization:singularity', amount: 1 },
        { item: 'modern_industrialization:quantum_circuit', amount: 2 },
        { item: 'modern_industrialization:iridium_plate', amount: 16 },
        { item: 'modern_industrialization:large_advanced_pump', amount: 8 },
        { item: 'modern_industrialization:titanium_tank', amount: 1 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:quantum_tank', amount: 1 }
      ]
    }).id(id('storage/quantum_tank'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 256,
      duration: 1200,
      item_inputs: [
        { item: 'modern_industrialization:quantum_machine_hull', amount: 1 },
        { item: 'modern_industrialization:superconductor_coil', amount: 4 },
        { item: 'modern_industrialization:plutonium_battery', amount: 4 },
        { item: 'modern_industrialization:quantum_circuit', amount: 2 }
      ],
      item_outputs: [
        { item: 'modern_industrialization:superconductor_storage_unit', amount: 1 }
      ]
    }).id(id('storage/superconductor_storage_unit'))

    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 256,
      duration: 1200,
      item_inputs: [
        { item: 'modern_industrialization:singularity', amount: 1 },
        { item: 'ae2:quartz_vibrant_glass', amount: 4 },
        { item: 'ae2:fluix_pearl', amount: 2 },
        { item: 'modern_industrialization:quantum_circuit', amount: 1 }
      ],
      item_outputs: [
        { item: 'ae2:quantum_ring', amount: 1 }
      ]
    }).id(id('ae2/quantum_link_workpiece'))

    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'ae2:quantum_ring' },
      transitional_item: { id: 'ae2:quantum_ring' },
      loops: 1,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'ae2:quantum_ring' },
            { item: 'modern_industrialization:quantum_circuit' }
          ],
          results: [{ id: 'ae2:quantum_ring' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'ae2:quantum_ring' },
            { item: 'ae2:engineering_processor' }
          ],
          results: [{ id: 'ae2:quantum_ring' }]
        },
        {
          type: 'create:filling',
          ingredients: [
            { item: 'ae2:quantum_ring' },
            { type: 'neoforge:single', amount: 100, fluid: 'modern_industrialization:uu_matter' }
          ],
          results: [{ id: 'ae2:quantum_ring' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'ae2:quantum_ring' }],
          results: [{ id: 'ae2:quantum_ring' }]
        }
      ],
      results: [{ id: 'ae2:quantum_link' }]
    }).id(id('ae2/quantum_link_assembly'))

    event.shaped('mekanism:module_teleportation_unit', [
      'ATA',
      'UPU',
      'SCS'
    ], {
      A: '#c:alloys/ultimate',
      T: 'mekanism:teleportation_core',
      U: '#createch2:mekanism_ultimate_control',
      P: 'mekanism:module_base',
      S: 'modern_industrialization:superconductor_coil',
      C: 'modern_industrialization:quantum_machine_hull'
    }).id(id('mekanism/module_teleportation_unit'))

    event.custom({
      type: 'modern_industrialization:chemical_reactor',
      eu: 256,
      duration: 1200,
      item_inputs: [
        { item: 'stellaris:solerium', amount: 1 },
        { item: 'stellaris:corronium_ingot', amount: 1 },
        { item: 'modern_industrialization:superconductor_dust', amount: 1 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:helium_plasma', amount: 500 },
        { fluid: 'modern_industrialization:sulfuric_acid', amount: 1000 }
      ],
      item_outputs: [
        { item: 'sgjourney:raw_naquadah', amount: 2 },
        { item: 'sgjourney:refined_naquadah', amount: 1 }
      ]
    }).id(id('sgjourney/fusion_naquadah'))

    event.shaped(Item.of('sgjourney:naquadah_alloy', 2), [
      'RIR',
      'SMS',
      'RIR'
    ], {
      R: 'sgjourney:refined_naquadah',
      I: 'modern_industrialization:iridium_plate',
      S: 'modern_industrialization:superconductor_plate',
      M: '#createch2:malum_reality_engineering'
    }).id(id('sgjourney/naquadah_alloy'))

    event.shaped('sgjourney:crystal_base', [
      'QMQ',
      'SAS',
      'QMQ'
    ], {
      Q: 'ae2:certus_quartz_crystal',
      S: 'modern_industrialization:superconductor_wire',
      A: 'sgjourney:naquadah_alloy',
      M: '#createch2:malum_reality_engineering'
    }).id(id('sgjourney/crystal_base'))

    event.shaped('sgjourney:crystallizer', [
      'ANA',
      'CHC',
      'AWA'
    ], {
      A: 'sgjourney:naquadah_alloy',
      N: 'sgjourney:refined_naquadah',
      C: 'sgjourney:control_crystal',
      H: 'modern_industrialization:quantum_machine_hull',
      W: 'modern_industrialization:superconductor_coil'
    }).id(id('sgjourney/crystallizer'))

    ;[
      ['communication_crystal', 'ae2:logic_processor'],
      ['control_crystal', 'ae2:engineering_processor'],
      ['energy_crystal', 'modern_industrialization:plutonium_battery'],
      ['transfer_crystal', 'modern_industrialization:quantum_circuit'],
      ['materialization_crystal', 'modern_industrialization:singularity']
    ].forEach(([name, core]) => {
      event.shaped(`sgjourney:${name}`, [
        ' R ',
        'BCB',
        ' S '
      ], {
        R: 'sgjourney:refined_naquadah',
        B: 'sgjourney:crystal_base',
        C: core,
        S: 'modern_industrialization:superconductor_wire'
      }).id(id(`sgjourney/${name}`))
    })

    // The variant crystal's first synthesis belongs to Malum dimensional
    // mastery, unlocked by the same FRN-04E reconstruction research. Mature
    // factory production requires that first crystal as a retained template.

    event.shaped('sgjourney:classic_stargate_ring_block', [
      'AAA',
      'RQR',
      'AAA'
    ], {
      A: 'sgjourney:naquadah_alloy',
      R: 'sgjourney:refined_naquadah',
      Q: 'modern_industrialization:quantum_machine_casing'
    }).id(id('sgjourney/classic_ring_block'))

    event.shaped('sgjourney:classic_stargate_chevron_block', [
      'ATA',
      'NEN',
      'ARA'
    ], {
      A: 'sgjourney:naquadah_alloy',
      N: 'sgjourney:refined_naquadah',
      T: 'sgjourney:transfer_crystal',
      E: 'sgjourney:energy_crystal',
      R: 'modern_industrialization:superconductor_coil'
    }).id(id('sgjourney/classic_chevron_block'))

    event.shaped('sgjourney:classic_stargate_base_block', [
      'AGA',
      'NTN',
      'ADA'
    ], {
      A: 'sgjourney:naquadah_alloy',
      N: 'sgjourney:refined_naquadah',
      T: 'sgjourney:transfer_crystal',
      G: 'sgjourney:communication_crystal',
      D: 'sgjourney:control_crystal'
    }).id(id('sgjourney/classic_base_block'))

    event.shaped('sgjourney:classic_dhd', [
      'BBB',
      'ICI',
      'QRQ'
    ], {
      B: '#createch2:materials/rock/buttons',
      I: 'sgjourney:naquadah_alloy',
      C: 'sgjourney:communication_crystal',
      Q: 'modern_industrialization:quantum_circuit',
      R: 'sgjourney:control_crystal'
    }).id(id('sgjourney/classic_dhd'))

    // Real SGJourney ring, chevron, base, crystal, and control components are
    // integrated on the Create shipyard line; there is no fake gate workpiece.
    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'sgjourney:classic_stargate_base_block' },
      transitional_item: { id: 'sgjourney:classic_stargate_base_block' },
      loops: 1,
      sequence: [
        'sgjourney:classic_stargate_ring_block',
        'sgjourney:classic_stargate_ring_block',
        'sgjourney:classic_stargate_ring_block',
        'sgjourney:classic_stargate_ring_block',
        'sgjourney:classic_stargate_chevron_block',
        'sgjourney:classic_stargate_chevron_block',
        'sgjourney:classic_stargate_chevron_block',
        'sgjourney:communication_crystal',
        'sgjourney:control_crystal',
        'ae2:quantum_link',
        'oritech:machine_core_6',
        'justdirethings:eclipsealloy_ingot'
      ].map(component => ({
        type: 'create:deploying',
        ingredients: [{ item: 'sgjourney:classic_stargate_base_block' }, { item: component }],
        results: [{ id: 'sgjourney:classic_stargate_base_block' }]
      })).concat([
        {
          type: 'create:filling',
          ingredients: [
            { item: 'sgjourney:classic_stargate_base_block' },
            { type: 'neoforge:single', amount: 500, fluid: 'modern_industrialization:uu_matter' }
          ],
          results: [{ id: 'sgjourney:classic_stargate_base_block' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'sgjourney:classic_stargate_base_block' }],
          results: [{ id: 'sgjourney:classic_stargate_base_block' }]
        }
      ]),
      results: [{ id: 'sgjourney:classic_stargate' }]
    }).id(id('sgjourney/classic_stargate'))

    event.shaped('sgjourney:milky_way_stargate', [
      'VQV',
      'QCQ',
      'VQV'
    ], {
      V: 'sgjourney:stargate_variant_crystal',
      Q: 'modern_industrialization:quantum_circuit',
      C: 'sgjourney:classic_stargate'
    }).id(id('sgjourney/milky_way_stargate'))

    event.shaped('sgjourney:milky_way_dhd', [
      'BRB',
      'ICI',
      'NXN'
    ], {
      B: '#createch2:materials/rock/buttons',
      R: 'modern_industrialization:superconductor_wire',
      I: 'sgjourney:naquadah_alloy',
      C: 'sgjourney:communication_crystal',
      X: 'sgjourney:control_crystal',
      N: 'sgjourney:refined_naquadah'
    }).id(id('sgjourney/milky_way_dhd'))


    event.shaped('alchemistry:fusion_core', [
      'SQS',
      'FCF',
      'SPS'
    ], {
      S: 'modern_industrialization:superconductor_plate',
      Q: 'modern_industrialization:quantum_circuit',
      F: 'modern_industrialization:fusion_chamber',
      C: 'alchemistry:fission_core',
      P: 'eternal_starlight:starcore'
    }).id(id('alchemistry/fusion_core'))

    event.shaped('alchemistry:fusion_chamber_controller', [
      'QFQ',
      'RCR',
      'QHQ'
    ], {
      Q: 'modern_industrialization:quantum_circuit',
      F: 'alchemistry:fusion_core',
      R: 'modern_industrialization:fusion_reactor',
      C: '#createch2:control/factory/quantum',
      H: 'modern_industrialization:quantum_machine_hull'
    }).id(id('alchemistry/fusion_chamber_controller'))

    event.shaped('ae2wtlib:quantum_bridge_card', [
      'SQS',
      'LTL',
      'SQS'
    ], {
      S: 'modern_industrialization:superconductor_plate',
      Q: 'modern_industrialization:quantum_circuit',
      L: 'ae2:quantum_link',
      T: 'ae2wtlib:wireless_universal_terminal'
    }).id(id('ae2wtlib/quantum_bridge_card'))
  })

  compileFamily('Aeronautics transmission and linkage tradeoffs', () => {
    removeOutputRecipes([
      'aeronautics_utility_objects:brass_universal_joint',
      'aeronautics_utility_objects:damping_stress_bearing',
      'aeronautics_utility_objects:hydraulic_connection_head',
      'aeronautics_utility_objects:hydraulic_hinge_head',
      'aeronautics_utility_objects:hydraulic_regulator'
    ])

    event.shaped('aeronautics_utility_objects:brass_universal_joint', [
      ' S ',
      'HPH',
      ' C '
    ], {
      S: 'create:shaft',
      H: 'tfmg:heavy_plate',
      P: 'create:precision_mechanism',
      C: 'create:brass_casing'
    }).id('createch2:compact_mobile/transmission/brass_universal_joint')

    event.shaped('aeronautics_utility_objects:hydraulic_connection_head', [
      ' P ',
      'HMH',
      ' C '
    ], {
      P: 'create:fluid_pipe',
      H: 'tfmg:heavy_plate',
      M: 'modern_industrialization:advanced_pump',
      C: 'create:brass_casing'
    }).id('createch2:compact_mobile/transmission/hydraulic_connection_head')

    event.shaped('aeronautics_utility_objects:hydraulic_hinge_head', [
      ' S ',
      'HBH',
      ' C '
    ], {
      S: 'create:shaft',
      H: 'tfmg:heavy_plate',
      B: 'create:mechanical_bearing',
      C: 'create:brass_casing'
    }).id('createch2:compact_mobile/transmission/hydraulic_hinge_head')

    event.shaped('aeronautics_utility_objects:hydraulic_regulator', [
      'BCB',
      'PAP',
      'BFB'
    ], {
      B: 'create:brass_casing',
      C: 'create:chute',
      P: 'create:precision_mechanism',
      A: '#createch2:control/factory/analog',
      F: 'create:encased_fan'
    }).id('createch2:compact_mobile/transmission/hydraulic_regulator')

    event.shaped('aeronautics_utility_objects:damping_stress_bearing', [
      'SDS',
      'PBP',
      'SAS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      D: '#createch2:control/factory/digital',
      P: 'electroenergetics:converter',
      B: 'simulated:swivel_bearing',
      A: 'simulated:physics_assembler'
    }).id('createch2:compact_mobile/transmission/damping_stress_bearing')

  })
  compileFamily('Age foundation and global containment', () => {
    var removeIds = ids => ids.forEach(id => event.remove({ id: id }))

    removeIds([
      'chancecubes:chance_cube_crafting',
      'chancecubes:cube_scanner_crafting',
      'chancecubes:silk_pendant_crafting',
      'chancecubes:tier_1_pendant_crafting',
      'chancecubes:tier_2_pendant_crafting',
      'chancecubes:tier_3_pendant_crafting'
    ])

    removeIds([
      'createch2:bronze/mekanism_to_cbc',
      'createch2:bronze/cbc_to_mekanism',
      'createch2:create/mixing/bronze_ingot'
    ])

    removeRecipe({ id: /^minecraft:(?:smelting|blasting)\/.*(?:copper|iron|gold|ore).*$/ })

    removeRecipe({ output: 'minecraft:furnace', type: 'minecraft:crafting_shaped' })
    event.shaped('minecraft:furnace', [
      'SSS',
      'S S',
      'SSS'
    ], {
      S: '#c:stones/raw'
    }).id('createch2:age_foundation/stone/furnace_from_tfc_raw_rock')

    removeOutputRecipes([
      'minecraft:iron_pickaxe',
      'minecraft:iron_axe',
      'minecraft:iron_shovel',
      'minecraft:iron_hoe',
      'minecraft:iron_sword',
      'minecraft:golden_pickaxe',
      'minecraft:golden_axe',
      'minecraft:golden_shovel',
      'minecraft:golden_hoe',
      'minecraft:golden_sword',
      'minecraft:diamond_pickaxe',
      'minecraft:diamond_axe',
      'minecraft:diamond_shovel',
      'minecraft:diamond_hoe',
      'minecraft:diamond_sword'
    ])

    removeRecipe({ id: /^minecraft:(?:smelting|blasting)\/(?:copper_ingot|raw_copper|copper_ore|deepslate_copper_ore).*$/ })
    removeRecipe({ id: /^create:(?:crushing|milling)\/.*copper_ore.*$/ })
    removeRecipe({ id: /^mekanism:processing\/copper\/ingot\/from_(?:ore|raw).*$/ })

    // KubeJS matches every sequenced-assembly result, including failed-roll
    // scrap. Preserve Greate's precision recipe when replacing alloy/shafts.
    var precisionAssembly = 'greate:sequenced_assembly/precision_mechanism'
    removeOutputRecipes(['create:andesite_alloy'], precisionAssembly)
    event.shaped(Item.of('create:andesite_alloy', 4), [
      'ACA',
      'TZT',
      'ACA'
    ], {
      A: '#createch2:stone/andesite_feedstock',
      C: '#c:ingots/copper',
      T: '#c:ingots/tin',
      Z: '#c:ingots/zinc'
    }).id('createch2:age_foundation/create/andesite_alloy')

    removeOutputRecipes([
      'create:andesite_casing',
      'create:shaft',
      'create:basin',
      'create:mechanical_press',
      'create:water_wheel',
      'create:large_water_wheel',
      'create:hand_crank',
      'create:fluid_pipe',
      'create:item_drain',
      'create:spout',
      'create:andesite_funnel',
      'create:andesite_tunnel'
    ], precisionAssembly)

    event.shaped(Item.of('create:shaft', 8), [
      'A',
      'L',
      'A'
    ], {
      A: 'create:andesite_alloy',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/shaft')

    event.shaped('create:andesite_casing', [
      'AAA',
      'ALA',
      'AAA'
    ], {
      A: 'create:andesite_alloy',
      L: '#minecraft:logs'
    }).id('createch2:age_foundation/create/andesite_casing')

    event.shaped('create:basin', [
      'A A',
      'ALA',
      'AAA'
    ], {
      A: 'create:andesite_alloy',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/basin')

    event.shaped('create:mechanical_press', [
      ' S ',
      ' C ',
      ' D '
    ], {
      S: 'create:shaft',
      C: 'create:andesite_casing',
      D: 'tfc:metal/double_sheet/copper'
    }).id('createch2:age_foundation/create/mechanical_press')

    // Greate removes the vanilla wrench before parsing; keep an owned early
    // route with the original gold/cog/wooden-rod bill and explicit tier-0 tag.
    event.shaped('create:wrench', ['GG', 'GP', ' S'], {
      G: '#c:plates/gold',
      P: '#c:createch2_kinetics/cogwheel/andesite_alloy',
      S: '#c:rods/wooden'
    }).id('createch2:age_foundation/create/wrench')

    event.shaped('create:water_wheel', [
      'PPP',
      'PSP',
      'PLP'
    ], {
      P: '#minecraft:planks',
      S: 'create:shaft',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/water_wheel')

    event.shaped('create:large_water_wheel', [
      'PPP',
      'PWP',
      'PLP'
    ], {
      P: '#minecraft:planks',
      W: 'create:water_wheel',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/large_water_wheel')

    event.shaped('create:hand_crank', [
      'PPP',
      '  S',
      '  L'
    ], {
      P: '#minecraft:planks',
      S: 'create:shaft',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/hand_crank')

    event.shaped(Item.of('create:fluid_pipe', 4), [
      'SCS',
      ' L '
    ], {
      S: '#c:plates/copper',
      C: '#c:ingots/copper',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/fluid_pipe')

    event.shaped('create:item_drain', [
      'B',
      'C',
      'L'
    ], {
      B: '#createch2:bars/bronze_tier',
      C: 'create:copper_casing',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/item_drain')

    event.shaped('create:spout', [
      'C',
      'K',
      'L'
    ], {
      C: 'create:copper_casing',
      K: '#createch2:food/dried_kelp',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/spout')

    event.shaped(Item.of('create:andesite_funnel', 2), [
      'A',
      'K',
      'L'
    ], {
      A: 'create:andesite_alloy',
      K: '#createch2:food/dried_kelp',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/andesite_funnel')

    event.shaped(Item.of('create:andesite_tunnel', 2), [
      'AA',
      'KK',
      ' L'
    ], {
      A: 'create:andesite_alloy',
      K: '#createch2:food/dried_kelp',
      L: 'createbigcannons:basin_foundry_lid'
    }).id('createch2:age_foundation/create/andesite_tunnel')

    var moltenFluid = (tag, amount) => ({
      type: 'neoforge:tag',
      tag: tag,
      amount: amount
    })

    ;[
      'createbigcannons:mixing/alloy_bronze_tin',
      'createbigcannons:mixing/alloy_bronze_brass',
      'createbigcannons:mixing/alloy_bronze_tinless',
      'modern_industrialization:alloy/mixer/bronze/dust',
      'modern_industrialization:alloy/mixer/bronze/tiny_dust',
      'createbigcannons:basin_foundry_lid'
    ].forEach(id => event.remove({ id: id }))

    removeOutputRecipes(['mekanism:ingot_bronze', 'create:brass_ingot', 'create:brass_sheet', 'create:brass_casing'])

    event.shaped('createbigcannons:basin_foundry_lid', [
      'CCC',
      'ABA',
      'BBB'
    ], {
      C: '#c:ingots/copper',
      A: 'create:andesite_alloy',
      B: '#createch2:ceramic/foundry_masonry'
    }).id('createch2:age_foundation/foundry/basin_foundry_lid')

    event.custom({
      type: 'createbigcannons:melting',
      heat_requirement: 'heated',
      ingredients: [
        { tag: 'c:ingots/copper' },
        { tag: 'c:ingots/copper' },
        { tag: 'c:ingots/copper' },
        { tag: 'c:ingots/tin' }
      ],
      processing_time: 360,
      results: [
        {
          id: 'createbigcannons:molten_bronze',
          amount: 360
        }
      ]
    }).id('createch2:age_foundation/foundry/molten_bronze_from_copper_tin')

    event.custom({
      type: 'create:compacting',
      ingredients: [
        moltenFluid('c:molten_bronze', 90)
      ],
      results: [
        { id: 'createbigcannons:bronze_ingot' }
      ],
      heat_requirement: 'heated'
    }).id('createch2:age_foundation/foundry/cast_bronze_ingot')

    event.custom({
      type: 'create:mixing',
      ingredients: [
        { tag: 'c:ingots/copper' },
        { tag: 'c:ingots/copper' },
        { tag: 'c:ingots/copper' },
        { tag: 'c:ingots/zinc' },
        { item: 'createbigcannons:basin_foundry_lid' }
      ],
      results: [
        { id: 'create:brass_ingot', count: 4 },
        { id: 'createbigcannons:basin_foundry_lid' }
      ],
      heat_requirement: 'heated'
    }).id('createch2:age_foundation/foundry/brass_foundry_batch')

    event.custom({
      type: 'create:pressing',
      ingredients: [
        { tag: 'createch2:materials/brass/foundry' }
      ],
      results: [
        { id: 'create:brass_sheet' }
      ]
    }).id('createch2:age_foundation/foundry/brass_sheet_from_foundry_brass')

    event.custom({
      type: 'create:item_application',
      ingredients: [
        { tag: 'c:stripped_logs' },
        { tag: 'createch2:materials/brass/foundry' }
      ],
      results: [
        { id: 'create:brass_casing' }
      ]
    }).id('createch2:age_foundation/foundry/brass_casing_from_foundry_brass')

    ;[
      'modern_industrialization:assembler_generated/steam_age/bronze/boiler',
      'modern_industrialization:assembler_generated/steam_age/bronze/compressor',
      'modern_industrialization:assembler_generated/steam_age/bronze/macerator',
      'modern_industrialization:assembler_generated/steam_age/bronze/machine_casing',
      'modern_industrialization:assembler_generated/steam_age/bronze/mixer',
      'modern_industrialization:assembler_generated/steam_age/bronze/water_pump',
      'modern_industrialization:steam_age/bronze/boiler_asbl',
      'modern_industrialization:steam_age/bronze/compressor_asbl',
      'modern_industrialization:steam_age/bronze/macerator_asbl',
      'modern_industrialization:steam_age/bronze/machine_casing_asbl',
      'modern_industrialization:steam_age/bronze/mixer_asbl',
      'modern_industrialization:steam_age/bronze/water_pump_asbl',
      'modern_industrialization:materials/bronze/craft/tank',
      'modern_industrialization:assembler_generated/steam_age/item_pipe',
      'modern_industrialization:assembler_generated/steam_age/fluid_pipe',
      'modern_industrialization:steam_age/item_pipe_asbl',
      'modern_industrialization:steam_age/fluid_pipe_asbl'
    ].forEach(id => event.remove({ id: id }))

    event.custom({
      type: 'create:pressing',
      ingredients: [
        { item: 'modern_industrialization:bronze_plate' }
      ],
      results: [
        { id: 'modern_industrialization:bronze_curved_plate' }
      ]
    }).id('createch2:age_foundation/mi_bronze/bronze_curved_plate')

    event.custom({
      type: 'create:cutting',
      ingredients: [
        { tag: 'c:ingots/copper' }
      ],
      results: [
        { id: 'modern_industrialization:copper_rod' }
      ],
      processing_time: 100
    }).id('createch2:age_foundation/mi_bronze/copper_rod_from_create_cutting')

    event.custom({
      type: 'create:cutting',
      ingredients: [
        { tag: 'c:rods/copper' }
      ],
      results: [
        { id: 'modern_industrialization:copper_bolt', count: 2 }
      ],
      processing_time: 80
    }).id('createch2:age_foundation/mi_bronze/copper_bolt_from_create_cutting')

    // Keep one copper ingot per ring while separating the press inputs:
    // ingot -> plate -> curved plate -> ring. Direct ingot pressing also
    // matches the copper plate recipes and cannot select a ring reliably.
    event.custom({
      type: 'create:pressing',
      ingredients: [
        { item: 'modern_industrialization:copper_curved_plate' }
      ],
      results: [
        { id: 'modern_industrialization:copper_ring' }
      ]
    }).id('createch2:age_foundation/mi_bronze/copper_ring_from_create_pressing')

    event.custom({
      type: 'create:pressing',
      ingredients: [
        { item: 'modern_industrialization:copper_plate' }
      ],
      results: [
        { id: 'modern_industrialization:copper_curved_plate' }
      ]
    }).id('createch2:age_foundation/mi_bronze/copper_curved_plate_from_create_pressing')

    event.shaped(Item.of('modern_industrialization:fluid_pipe', 12), [
      'CCC',
      'RGR',
      'CCC'
    ], {
      C: 'modern_industrialization:bronze_curved_plate',
      R: 'modern_industrialization:copper_rotor',
      G: '#c:glass_panes'
    }).id('createch2:age_foundation/mi_bronze/fluid_pipe')

    event.shaped(Item.of('modern_industrialization:item_pipe', 12), [
      'CCC',
      'GBG',
      'CCC'
    ], {
      C: 'modern_industrialization:bronze_curved_plate',
      G: '#c:heavy_gears/copper',
      B: 'create:brass_sheet'
    }).id('createch2:age_foundation/mi_bronze/item_pipe')

    event.shaped('modern_industrialization:bronze_machine_casing', [
      'PPP',
      'PGP',
      'PPP'
    ], {
      P: 'modern_industrialization:bronze_plate',
      G: 'create:brass_casing'
    }).id('createch2:age_foundation/mi_bronze/machine_casing')

    event.shaped('modern_industrialization:bronze_tank', [
      'PRP',
      'RGR',
      'PRP'
    ], {
      P: 'modern_industrialization:bronze_plate',
      R: 'modern_industrialization:copper_ring',
      G: '#c:glass_blocks'
    }).id('createch2:age_foundation/mi_bronze/tank')

    event.custom({
      type: 'create:mixing',
      ingredients: [
        { item: 'minecraft:brick' },
        { item: 'minecraft:brick' },
        { item: 'minecraft:clay_ball' },
        { item: 'minecraft:clay_ball' }
      ],
      results: [
        { id: 'modern_industrialization:fire_clay_dust', count: 4 }
      ]
    }).id('createch2:age_foundation/mi_bronze/fire_clay_dust_from_create_mixing')

    event.shaped('modern_industrialization:bronze_boiler', [
      'PBP',
      'TFT',
      'RCR'
    ], {
      P: 'modern_industrialization:bronze_plate',
      B: 'modern_industrialization:bronze_tank',
      T: '#modern_industrialization:fluid_pipes',
      F: 'minecraft:furnace',
      R: 'modern_industrialization:fire_clay_bricks',
      C: 'modern_industrialization:bronze_machine_casing'
    }).id('createch2:age_foundation/mi_bronze/boiler')

    event.shaped('modern_industrialization:bronze_macerator', [
      'RGR',
      'PMP',
      'FCF'
    ], {
      R: 'modern_industrialization:copper_rotor',
      G: '#c:heavy_gears/copper',
      P: 'modern_industrialization:bronze_plate',
      M: 'modern_industrialization:bronze_machine_casing',
      F: '#modern_industrialization:fluid_pipes',
      C: '#createch2:control/mechanical'
    }).id('createch2:age_foundation/mi_bronze/macerator')

    event.shaped('modern_industrialization:bronze_mixer', [
      'RGR',
      'PMP',
      'FBF'
    ], {
      R: 'modern_industrialization:copper_rotor',
      G: '#c:heavy_gears/copper',
      P: 'modern_industrialization:bronze_plate',
      M: 'modern_industrialization:bronze_machine_casing',
      F: '#modern_industrialization:fluid_pipes',
      B: 'create:brass_casing'
    }).id('createch2:age_foundation/mi_bronze/mixer')

    event.shaped('modern_industrialization:bronze_water_pump', [
      'RGR',
      'PMP',
      'FTF'
    ], {
      R: 'modern_industrialization:copper_rotor',
      G: '#c:heavy_gears/copper',
      P: 'modern_industrialization:bronze_plate',
      M: 'modern_industrialization:bronze_machine_casing',
      F: '#modern_industrialization:fluid_pipes',
      T: 'modern_industrialization:bronze_tank'
    }).id('createch2:age_foundation/mi_bronze/water_pump')

    removeOutputRecipes(['modern_industrialization:bronze_compressor'])
    event.shaped('modern_industrialization:bronze_compressor', [
      'PMP',
      'RCR',
      'PTP'
    ], {
      P: 'modern_industrialization:bronze_plate',
      M: '#createch2:control/mechanical',
      R: 'modern_industrialization:copper_ring',
      C: 'modern_industrialization:bronze_machine_casing',
      T: 'create:mechanical_piston'
    }).id('createch2:age_foundation/mi_bronze/compressor')

    ;[
      'modern_industrialization:steam_age/fireclay/coke_oven',
      'modern_industrialization:steam_age/fireclay/packer/coke_oven',
      'modern_industrialization:steam_age/fireclay/steam_blast_furnace',
      'modern_industrialization:steam_age/fireclay/packer/packer_steam_blast_furnace'
    ].forEach(id => event.remove({ id: id }))
    removeOutputRecipes(['modern_industrialization:coke_oven', 'modern_industrialization:steam_blast_furnace'])
    // TFMG owns the early blast-furnace step. Keep TFC's registered device
    // for old saves and native inventory/tank recovery, but remove new builds
    // and every recipe its old furnace could execute. MI's later EBF remains.
    removeOutputRecipes(['tfc:blast_furnace'])
    removeRecipe({ type: 'tfc:blast_furnace' })
    removeOutputRecipes([
      'modern_industrialization:coke',
      'modern_industrialization:coke_block',
      'modern_industrialization:coke_dust',
      'modern_industrialization:uncooked_steel_dust',
      'modern_industrialization:steel_ingot',
      'modern_industrialization:steel_nugget',
      'modern_industrialization:steel_block'
    ])
    // Native fluid-pipe hardware is not an alternate steel material supply.
    // Preserve only its two original bills; CHE-01 owns both recipe unlocks.
    removeOutputRecipes([/^tfmg:steel_.*/, /^mekanism:(?:ingot|nugget|block)_steel$/, 'mekanism:block_steel'], /^tfmg:crafting\/materials\/steel_pipe(?:_vertical)?$/)

    ;[
      /^tfmg:smelting\/(?:lead|nickel|lithium)_ingot.*$/,
      /^tfmg:blasting\/(?:lead|nickel|lithium)_ingot.*$/,
      /^tfmg:vat_machine_recipe\/aluminum$/,
      /^tfmg:casting\/steel$/,
      /^tfmg:industrial_blasting\/steel.*$/
    ].forEach(id => event.remove({ id: id }))

    removeIds([
      'create_ultimate_factory:compacting_coalblock',
      'create_ultimate_factory:crushing_netherite',
      'create_ultimate_factory:mixing_redstone'
    ])

    event.custom({
      type: 'create:compacting',
      heat_requirement: 'heated',
      ingredients: [
        { item: 'minecraft:coal_block' },
        { item: 'minecraft:coal_block' },
        { item: 'minecraft:coal_block' },
        { item: 'minecraft:coal_block' },
        { item: 'minecraft:coal_block' },
        { item: 'minecraft:coal_block' },
        { item: 'minecraft:coal_block' },
        { item: 'minecraft:coal_block' },
        { item: 'modern_industrialization:quantum_circuit' },
        {
          type: 'neoforge:single',
          amount: 100,
          fluid: 'minecraft:lava'
        }
      ],
      results: [
        { id: 'minecraft:diamond' }
      ]
    }).id('createch2:resource_synthesis/quantum/diamond')

    event.custom({
      type: 'create:mixing',
      heat_requirement: 'heated',
      ingredients: [
        { item: 'minecraft:netherrack' },
        { tag: 'c:dusts/silicon' },
        { tag: 'c:dusts/sulfur' },
        {
          type: 'neoforge:single',
          amount: 100,
          fluid: 'minecraft:lava'
        }
      ],
      results: [
        { id: 'minecraft:redstone', count: 4 }
      ]
    }).id('createch2:resource_synthesis/industrial/redstone')

    event.custom({
      type: 'modern_industrialization:macerator',
      eu: 128,
      duration: 600,
      item_inputs: [
        { item: 'minecraft:nether_bricks', amount: 16 }
      ],
      item_outputs: [
        { item: 'minecraft:nether_brick', amount: 16 },
        {
          item: 'minecraft:netherite_scrap',
          amount: 1,
          probability: 0.005
        }
      ]
    }).id('createch2:resource_synthesis/quantum/netherite_trace_recovery')
    removeRecipe({ id: /^create:crushing\/(?:deepslate_)?lithium_ore$/ })
    removeRecipe({ id: /^create:crushing\/raw_lithium(?:_block)?$/ })

    // Native upgrades retain their component semantics and require the pack's
    // industrial terminals/providers or 1K component. Cheap native entry recipes stay contained.
    var retainedNativeAeRecipes = [
      'ae2:network/upgrade_wireless_crafting_terminal',
      'ae2wtlib:pattern_encoding/upgrade_wireless_pattern_encoding_terminal',
      'ae2wtlib:wireless_universal_terminal/ce',
      'ae2:network/cells/item_storage_components_cell_4k_part',
      'ae2:network/cells/item_storage_components_cell_16k_part',
      'ae2:network/cells/item_storage_components_cell_64k_part',
      'ae2:network/cells/item_storage_components_cell_256k_part',
      'ae2:network/parts/terminals_pattern_encoding',
      'ae2:network/parts/terminals_pattern_access',
      'ae2wtlib:wireless_universal_terminal/ae',
      'ae2wtlib:wireless_universal_terminal/ca',
      'ae2wtlib:wireless_universal_terminal/upgrade_crafting',
      'ae2wtlib:wireless_universal_terminal/upgrade_pattern_acces',
      'ae2wtlib:wireless_universal_terminal/upgrade_pattern_encoding',
      'ae2:network/blocks/io_port',
      'ae2:network/blocks/spatial_io_port',
      'ae2:network/cells/spatial_components',
      'ae2:network/cells/spatial_components_0',
      'ae2:network/cells/spatial_components_1',
      'ae2:network/parts/level_emitter'
    ]
    var retainedNativeAeRecipeIds = new RegExp('^(?:' + retainedNativeAeRecipes.join('|') + ')$')

    ;[
      /^stellaris:.*steel.*(?:smelting|blasting).*$/,
      /^stellaris:.*uranium.*(?:smelting|blasting).*$/,
      /^stellaris:.*plutonium.*(?:smelting|blasting).*$/,
      /^stellaris:.*titanium.*(?:smelting|blasting).*$/,
      /^stellaris:misc\/(?:steel|raw_steel|uranium|raw_uranium|plutonium).*$/,
      /^mekanism:processing\/(?:osmium|uranium)\/.*$/,
      /^mekanism:.*\/(?:basic_control_circuit|metallurgic_infuser|enrichment_chamber|crusher|energized_smelter|steel_casing).*$/,
      /^ae2:network\/.*$/,
      /^ae2:tools\/network\/.*$/,
      /^ae2:inscriber\/.*$/,
      /^ae2:decorative\/.*controller.*$/,
      /^ae2wtlib:.*$/,
      /^appflux:.*$/,
      /^appmek:.*$/,
      /^megacells:.*$/,
      /^railcraft:blast_furnace\/.*$/,
      /^railcraft:crusher\/.*$/,
      /^railcraft:.*(?:blast_furnace|crusher).*$/,
      /^railcraft:.*steel_(?:ingot|nugget|block|axe|pickaxe|shovel|hoe|sword|helmet|chestplate|leggings|boots|shears|anvil|gear).*$/,
      /^alchemistry:.*$/,
      /^sgjourney:.*$/,
      // Clavis is world-active loot security. Preserve its native content and
      // suppress only the lock-pick bypass in the exact-output list below.
      /^solar_industrialization:.*$/,
      /^extended_industrialization:.*(?:solar|photovoltaic|tesla|nano|quantum|ultimate_laser_drill|large_configurable_chest|processing_array|machine_chainer|interdimensional).*$/,
      /^extended_industrialization:vanilla_recipes\/blast_furnace\/netherite_dust_to_ingot$/,
      /^quarryplus:.*$/
    ].forEach(id => event.remove({ id: id, not: { id: retainedNativeAeRecipeIds } }))

    removeOutputRecipes([
      'mekanism:metallurgic_infuser',
      'mekanism:enrichment_chamber',
      'mekanism:crusher',
      'mekanism:energized_smelter',
      'mekanism:digital_miner',
      'mekanism:basic_control_circuit',
      'clavis:lock_pick',
      'ae2:controller',
      'ae2:energy_acceptor',
      'ae2:drive',
      'ae2:terminal',
      'ae2:crafting_terminal',
      'ae2:inscriber',
      'ae2:molecular_assembler',
      'ae2:pattern_provider',
      'ae2:wireless_terminal',
      'ae2:wireless_access_point',
      'ae2:quantum_link',
      'ae2:quantum_ring',
      'ae2wtlib:quantum_bridge_card',
      'appflux:flux_accessor',
      'appflux:part_flux_accessor',
      'appflux:fe_cell_housing',
      'appmek:chemical_cell_housing',
      'appmek:chemical_p2p_tunnel',
      'railcraft:coke_oven_bricks',
      'railcraft:blast_furnace_bricks',
      'railcraft:crusher',
      'railcraft:steel_ingot',
      'railcraft:steel_block',
      'railcraft:steel_nugget',
      'alchemistry:combiner',
      'alchemistry:dissolver',
      'alchemistry:compactor',
      'alchemistry:fission_chamber_controller',
      'alchemistry:fission_core',
      'alchemistry:fusion_chamber_controller',
      'alchemistry:fusion_core',
      'sgjourney:classic_stargate',
      'sgjourney:milky_way_stargate',
      'sgjourney:pegasus_stargate',
      'sgjourney:universe_stargate',
      'sgjourney:tollan_stargate',
      'sgjourney:classic_dhd',
      'sgjourney:milky_way_dhd',
      'sgjourney:pegasus_dhd',
      'sgjourney:transport_rings',
      'sgjourney:ring_panel',
      'sgjourney:ring_remote',
      'sgjourney:transceiver',
      'sgjourney:gdo',
      'sgjourney:pda',
      'sgjourney:crystallizer',
      'sgjourney:advanced_crystallizer',
      'sgjourney:reaction_chamber',
      'sgjourney:naquadah_liquidizer',
      'sgjourney:heavy_naquadah_liquidizer',
      'sgjourney:naquadah_generator_mark_i',
      'sgjourney:naquadah_generator_mark_ii',
      'sgjourney:naquadah_power_cell',
      'sgjourney:plasma_converter',
      'sgjourney:fusion_core',
      'sgjourney:jaffa_staff_head',
      'sgjourney:kara_kesh',
      'sgjourney:personal_shield_emitter',
      'extended_industrialization:lv_solar_panel',
      'extended_industrialization:mv_solar_panel',
      'extended_industrialization:hv_solar_panel',
      'extended_industrialization:tesla_coil',
      'extended_industrialization:tesla_tower',
      'extended_industrialization:tesla_receiver',
      'extended_industrialization:tesla_particle_generator',
      'extended_industrialization:tesla_interdimensional_upgrade',
      'extended_industrialization:machine_chainer',
      'extended_industrialization:machine_chainer_relay',
      'extended_industrialization:processing_array',
      'extended_industrialization:large_configurable_chest',
      'extended_industrialization:ultimate_laser_drill',
      'extended_industrialization:electric_mining_drill',
      'extended_industrialization:nano_saber',
      'extended_industrialization:nano_helmet',
      'extended_industrialization:nano_chestplate',
      'extended_industrialization:nano_leggings',
      'extended_industrialization:nano_boots',
      'extended_industrialization:nano_gravichestplate',
      'extended_industrialization:nano_quantum_saber',
      'extended_industrialization:nano_quantum_helmet',
      'extended_industrialization:nano_quantum_chestplate',
      'extended_industrialization:nano_quantum_leggings',
      'extended_industrialization:nano_quantum_boots',
      'mininggadgets:mininggadget_simple',
      'mininggadgets:mininggadget_fancy',
      'quarryplus:quarry',
      'quarryplus:adv_quarry'
    ])

  })

  compileFamily('Core balance and compatibility', () => {
    var removeRecipeIds = recipeIds => recipeIds.forEach(recipeId => event.remove({ id: recipeId }))

    // Cargo Boats are Copper Age shoreline logistics. Keep the base boat copper
    // and wood centered, then later upgrades ask for additional materials.
    event.remove({ id: 'cargoboats:motorboat' })
    event.shaped('cargoboats:motorboat', [
      ' T ',
      'CBC',
      'CFC'
    ], {
      T: '#createch2:wooden_barrels',
      B: '#minecraft:boats',
      C: '#c:ingots/copper',
      F: 'minecraft:furnace'
    }).id('createch2:cargoboats/motorboat')

    event.remove({ id: 'cargoboats:fluid_motorboat' })
    event.shaped('cargoboats:fluid_motorboat', [
      ' K ',
      'CBC',
      'IFI'
    ], {
      K: '#createch2:containers/metal_bucket',
      C: '#c:ingots/copper',
      I: '#c:ingots/iron',
      B: '#minecraft:boats',
      F: '#createch2:wooden_barrels'
    }).id('createch2:cargoboats/fluid_motorboat')

    event.remove({ id: 'cargoboats:lava_upgrade' })
    event.shaped('cargoboats:lava_upgrade', [
      'CCC',
      'CLC',
      'CCC'
    ], {
      C: '#c:ingots/copper',
      L: 'minecraft:lava_bucket'
    }).id('createch2:cargoboats/lava_upgrade')

    event.remove({ id: 'cargoboats:speed_upgrade' })
    event.shaped('cargoboats:speed_upgrade', [
      'SCS',
      'RBR',
      'SCS'
    ], {
      S: 'minecraft:sugar',
      C: '#c:ingots/copper',
      R: '#c:dusts/redstone',
      B: 'minecraft:leather'
    }).id('createch2:cargoboats/speed_upgrade')

    event.remove({ id: 'cargoboats:capacity_upgrade' })
    event.shaped('cargoboats:capacity_upgrade', [
      'ICI',
      'CBC',
      'ICI'
    ], {
      I: '#c:ingots/iron',
      C: '#createch2:wooden_storage_chests',
      B: '#createch2:wooden_barrels'
    }).id('createch2:cargoboats/capacity_upgrade')

    event.remove({ id: 'cargoboats:fishing_upgrade' })
    event.shaped('cargoboats:fishing_upgrade', [
      'SFS',
      'RBR',
      'SFS'
    ], {
      S: 'minecraft:string',
      F: 'minecraft:fishing_rod',
      R: '#c:dusts/redstone',
      B: '#createch2:wooden_barrels'
    }).id('createch2:cargoboats/fishing_upgrade')

    event.remove({ id: 'cargoboats:icebreaker_upgrade' })
    event.shaped('cargoboats:icebreaker_upgrade', [
      'TIT',
      'PBP',
      'TIT'
    ], {
      T: 'minecraft:torch',
      I: 'minecraft:blue_ice',
      P: '#c:plates/steel',
      B: 'cargoboats:motorboat'
    }).id('createch2:cargoboats/icebreaker_upgrade')

    // Keep early logistics visible: Mekanism item transport should supplement belts, not replace them.
    removeOutputRecipes(['mekanism:basic_logistical_transporter'])
    event.shaped(Item.of('mekanism:basic_logistical_transporter', 4), [
      'SFS',
      'HBR',
      'SFS'
    ], {
      S: '#c:ingots/steel',
      H: 'create:chute',
      F: 'create:brass_funnel',
      B: 'create:belt_connector',
      R: '#createch2:mekanism_basic_control'
    }).id('createch2:mekanism/transmitter/logistical_transporter/basic')

    // Fluid pipes should arrive through the Create/TFMG heavy-industry bridge.
    removeOutputRecipes(['mekanism:basic_mechanical_pipe'])
    event.shaped(Item.of('mekanism:basic_mechanical_pipe', 4), [
      'SCS',
      'PBP',
      'SCS'
    ], {
      S: '#c:ingots/steel',
      C: 'create:fluid_pipe',
      P: 'tfmg:steel_pipe',
      B: '#createch2:containers/metal_bucket'
    }).id('createch2:mekanism/transmitter/mechanical_pipe/basic')

    // C&A's direct FE/rotation conversion pair skips TFMG's electrical branch.
    removeRecipeIds([
      'createaddition:charging/channeling',
      'createaddition:charging/deoxidize_create_exposed_copper_shingle_slab',
      'createaddition:charging/deoxidize_create_exposed_copper_shingle_stairs',
      'createaddition:charging/deoxidize_create_exposed_copper_shingles',
      'createaddition:charging/deoxidize_create_exposed_copper_tile_slab',
      'createaddition:charging/deoxidize_create_exposed_copper_tile_stairs',
      'createaddition:charging/deoxidize_create_exposed_copper_tiles',
      'createaddition:charging/deoxidize_create_oxidized_copper_shingle_slab',
      'createaddition:charging/deoxidize_create_oxidized_copper_shingle_stairs',
      'createaddition:charging/deoxidize_create_oxidized_copper_shingles',
      'createaddition:charging/deoxidize_create_oxidized_copper_tile_slab',
      'createaddition:charging/deoxidize_create_oxidized_copper_tile_stairs',
      'createaddition:charging/deoxidize_create_oxidized_copper_tiles',
      'createaddition:charging/deoxidize_create_weathered_copper_shingle_slab',
      'createaddition:charging/deoxidize_create_weathered_copper_shingle_stairs',
      'createaddition:charging/deoxidize_create_weathered_copper_shingles',
      'createaddition:charging/deoxidize_create_weathered_copper_tile_slab',
      'createaddition:charging/deoxidize_create_weathered_copper_tile_stairs',
      'createaddition:charging/deoxidize_create_weathered_copper_tiles',
      'createaddition:charging/deoxidize_minecraft_exposed_chiseled_copper',
      'createaddition:charging/deoxidize_minecraft_exposed_copper',
      'createaddition:charging/deoxidize_minecraft_exposed_copper_bulb',
      'createaddition:charging/deoxidize_minecraft_exposed_copper_door',
      'createaddition:charging/deoxidize_minecraft_exposed_copper_grate',
      'createaddition:charging/deoxidize_minecraft_exposed_copper_trapdoor',
      'createaddition:charging/deoxidize_minecraft_exposed_cut_copper',
      'createaddition:charging/deoxidize_minecraft_exposed_cut_copper_slab',
      'createaddition:charging/deoxidize_minecraft_exposed_cut_copper_stairs',
      'createaddition:charging/deoxidize_minecraft_oxidized_chiseled_copper',
      'createaddition:charging/deoxidize_minecraft_oxidized_copper',
      'createaddition:charging/deoxidize_minecraft_oxidized_copper_bulb',
      'createaddition:charging/deoxidize_minecraft_oxidized_copper_door',
      'createaddition:charging/deoxidize_minecraft_oxidized_copper_grate',
      'createaddition:charging/deoxidize_minecraft_oxidized_copper_trapdoor',
      'createaddition:charging/deoxidize_minecraft_oxidized_cut_copper',
      'createaddition:charging/deoxidize_minecraft_oxidized_cut_copper_slab',
      'createaddition:charging/deoxidize_minecraft_oxidized_cut_copper_stairs',
      'createaddition:charging/deoxidize_minecraft_weathered_chiseled_copper',
      'createaddition:charging/deoxidize_minecraft_weathered_copper',
      'createaddition:charging/deoxidize_minecraft_weathered_copper_bulb',
      'createaddition:charging/deoxidize_minecraft_weathered_copper_door',
      'createaddition:charging/deoxidize_minecraft_weathered_copper_grate',
      'createaddition:charging/deoxidize_minecraft_weathered_copper_trapdoor',
      'createaddition:charging/deoxidize_minecraft_weathered_cut_copper',
      'createaddition:charging/deoxidize_minecraft_weathered_cut_copper_slab',
      'createaddition:charging/deoxidize_minecraft_weathered_cut_copper_stairs',
      'createaddition:charging/electrify_gold_block',
      'createaddition:charging/electrify_gold_ingot',
      'createaddition:charging/electrify_gold_nugget',
      'createaddition:charging/electrify_gold_rod',
      'createaddition:charging/electrify_gold_sheet',
      'createaddition:charging/electrify_gold_wire',
      'createaddition:compacting/biomass_pellet',
      'createaddition:compacting/cake_base',
      'createaddition:compacting/seed_oil',
      'createaddition:compat/ae2/charged_certus_quartz',
      'createaddition:compat/immersiveengineering/constantan',
      'createaddition:compat/immersiveengineering/crushing/steel_ingot',
      'createaddition:compat/immersiveengineering/fabric_sail',
      'createaddition:compat/immersiveengineering/item_application/kiln_brick',
      'createaddition:compat/immersiveengineering/item_application/leaded_concrete',
      'createaddition:compat/immersiveengineering/item_application/reinforced_blast_brick',
      'createaddition:compat/immersiveengineering/rolling/aluminum_ingot',
      'createaddition:compat/immersiveengineering/rolling/aluminum_plate',
      'createaddition:compat/immersiveengineering/rolling/lead_plate',
      'createaddition:compat/immersiveengineering/rolling/steel_ingot',
      'createaddition:compat/immersiveengineering/rolling/steel_plate',
      'createaddition:compat/immersiveengineering/sphalerite',
      'createaddition:compat/jeed/shocking',
      'createaddition:compat/mekanism/rose_quartz_enriching',
      'createaddition:compat/mekanism/rose_quartz_metallurgic_infusing',
      'createaddition:compat/tconstruct/amethyst_bronze',
      'createaddition:compat/tconstruct/blaze_blood',
      'createaddition:compat/tconstruct/hepatizon',
      'createaddition:compat/tconstruct/manyullyn',
      'createaddition:compat/tconstruct/queens_slime',
      'createaddition:compat/tconstruct/rose_gold',
      'createaddition:compat/tconstruct/slimesteel',
      'createaddition:compat/tconstruct/tinkers_bronze',
      'createaddition:compat/thermal/liquid_burning/heavy_oil',
      'createaddition:compat/thermal/liquid_burning/light_oil',
      'createaddition:compat/thermal/liquid_burning/refined_fuel',
      'createaddition:compat/thermal/liquid_burning/tree_oil',
      'createaddition:crafting/barbed_wire',
      'createaddition:crafting/biomass_pallet_block',
      'createaddition:crafting/biomass_pellet_from_biomass_pallet_block',
      'createaddition:crafting/capacitor_1',
      'createaddition:crafting/capacitor_2',
      'createaddition:crafting/connector',
      'createaddition:crafting/copper_spool',
      'createaddition:crafting/diamond_grit_sandpaper',
      'createaddition:crafting/digital_adapter',
      'createaddition:crafting/electrum_amulet',
      'createaddition:crafting/electrum_block',
      'createaddition:crafting/electrum_ingot_from_electrum_block',
      'createaddition:crafting/electrum_ingot_from_nugget',
      'createaddition:crafting/electrum_nugget',
      'createaddition:crafting/electrum_spool',
      'createaddition:crafting/festive_spool',
      'createaddition:crafting/gold_spool',
      'createaddition:crafting/large_connector',
      'createaddition:crafting/modular_accumulator',
      'createaddition:crafting/portable_energy_interface',
      'createaddition:crafting/redstone_relay',
      'createaddition:crafting/rolling_mill',
      'createaddition:crafting/small_light_connector',
      'createaddition:crafting/spool',
      'createaddition:crushing/diamond',
      'createaddition:filling/cake',
      'createaddition:filling/chocolate_cake',
      'createaddition:filling/honey_cake',
      'createaddition:liquid_burning/biodiesel',
      'createaddition:liquid_burning/biofuel',
      'createaddition:liquid_burning/creosote',
      'createaddition:liquid_burning/crude_oil',
      'createaddition:liquid_burning/diesel',
      'createaddition:liquid_burning/ethanol',
      'createaddition:liquid_burning/gasoline',
      'createaddition:liquid_burning/lava',
      'createaddition:liquid_burning/plantoil',
      'createaddition:mechanical_crafting/alternator',
      'createaddition:mechanical_crafting/electric_motor',
      'createaddition:mechanical_crafting/tesla_coil',
      'createaddition:mixing/bioethanol',
      'createaddition:mixing/biomass_from_crops',
      'createaddition:mixing/biomass_from_flowers',
      'createaddition:mixing/biomass_from_honeycomb',
      'createaddition:mixing/biomass_from_leaves',
      'createaddition:mixing/biomass_from_plant_foods',
      'createaddition:mixing/biomass_from_plants',
      'createaddition:mixing/biomass_from_saplings',
      'createaddition:mixing/biomass_from_stricks',
      'createaddition:mixing/electrum',
      'createaddition:mixing/netherrack',
      'createaddition:pressing/electrum_ingot',
      'createaddition:pressing/zinc_ingot',
      'createaddition:rolling/brass_rod',
      'createaddition:rolling/copper_ingot',
      'createaddition:rolling/copper_plate',
      'createaddition:rolling/electrum_ingot',
      'createaddition:rolling/electrum_plate',
      'createaddition:rolling/gold_ingot',
      'createaddition:rolling/gold_plate',
      'createaddition:rolling/iron_ingot',
      'createaddition:rolling/iron_plate',
      'createaddition:smoking/cake_base_baked'
    ])

    // C&A stays for mobile energy transfer. TFMG and Mekanism own stationary
    // electrical work, wire materials, fuel branches, and conversion machines.

    // Modern vanilla backports are atmosphere first. Remove cheap travel/flight
    // shortcuts, and keep navigation blocks expensive enough to feel earned.
    event.remove({ id: 'minecraft:dried_ghast' })
    event.remove({ id: 'minecraft:saddle' })
    event.remove({ id: 'minecraft:lodestone' })
    event.shaped('minecraft:lodestone', [
      'SSS',
      'SNS',
      'SSS'
    ], {
      S: 'minecraft:chiseled_stone_bricks',
      N: 'minecraft:netherite_ingot'
    }).id('createch2:minecraft/lodestone')

    var harnessColors = [
      'white',
      'orange',
      'magenta',
      'light_blue',
      'yellow',
      'lime',
      'pink',
      'gray',
      'light_gray',
      'cyan',
      'purple',
      'blue',
      'brown',
      'green',
      'red',
      'black'
    ]
    harnessColors.forEach(color => {
      event.remove({ id: `minecraft:${color}_harness` })
    })

    // The vanilla Crafter is useful, but it should not replace Create's
    // mechanical crafting/sequencing path before brass and precision work.
    event.remove({ id: 'minecraft:crafter' })
    event.shaped('minecraft:crafter', [
      'RCR',
      'PMP',
      'BCB'
    ], {
      R: '#c:dusts/redstone',
      C: 'minecraft:crafting_table',
      P: 'create:precision_mechanism',
      M: 'create:mechanical_crafter',
      B: 'create:brass_casing'
    }).id('createch2:minecraft/crafter')

    // Electro Energetics owns the grid; obsolete compact generator routes
    // are retired by its existing electrical constitution.
    removeOutputRecipes(['mekanismgenerators:heat_generator'])


    removeOutputRecipes(['mekanismgenerators:bio_generator'])


    removeOutputRecipes(['mekanismgenerators:gas_burning_generator'])


    removeOutputRecipes(['mekanismgenerators:wind_generator'])


    removeOutputRecipes(['mekanismgenerators:solar_generator'])


    // Native Ultimate Factory resource genesis is retiered above rather than
    // removed: its outputs remain available through age-owned synthesis.
    event.remove({ id: 'create_mekanism_improvements:uranium_ingot' })

    // Mekanism starts as the powered backend after Create precision, rubber, and
    // TFMG electrical work exist. Its first machines should escalate the factory,
    // not replace the early mechanical workshop.

    removeOutputRecipes(['mekanism:steel_casing'])
    event.shaped('mekanism:steel_casing', [
      'SOS',
      'OCO',
      'SPS'
    ], {
      S: '#c:ingots/steel',
      O: '#c:ingots/nickel',
      C: 'tfmg:steel_casing',
      P: 'create:precision_mechanism'
    }).id('createch2:mekanism/steel_casing')





    removeOutputRecipes(['mekanism:energy_tablet'])
    event.shaped('mekanism:energy_tablet', [
      'RCR',
      'SPS',
      'RCR'
    ], {
      R: '#c:dusts/redstone',
      C: 'tfmg:capacitor_item',
      S: '#c:ingots/steel',
      P: '#createch2:control/factory/analog'
    }).id('createch2:mekanism/energy_tablet')

    // Molten vent deposits should be geology first, not visible ore pockets.
    // Dormant molten Create stones carry the resource value and feed Create lines.
    var crushing = (id, input, results, time) => {
      time = time || 350
      event.custom({
        type: 'create:crushing',
        ingredients: [{ item: input }],
        processing_time: time,
        results: results
      }).id('createch2:vent_processing/crushing/' + id)
    }

    var gemOre = (id, ore, gem, stone) => {
      stone = stone || 'minecraft:cobblestone'
      crushing(id, ore, [
        { id: gem, count: 2 },
        { id: gem, chance: 0.25 },
        { id: 'create:experience_nugget', chance: 0.75 },
        { id: stone, chance: 0.125 }
      ], 350)
    }

    var richOre = (id, ore, output, count, stone) => {
      stone = stone || 'minecraft:cobblestone'
      crushing(id, ore, [
        { id: output, count: count },
        { id: output, chance: 0.5 },
        { id: 'create:experience_nugget', chance: 0.75 },
        { id: stone, chance: 0.125 }
      ], 400)
    }



    crushing('molten_vents/asurine', 'molten_vents:dormant_molten_asurine', [
      { id: 'minecraft:lapis_lazuli', count: 6 },
      { id: 'minecraft:diamond', chance: 0.25 },
      { id: 'create:experience_nugget', chance: 0.75 },
      { id: 'create:asurine', chance: 0.25 }
    ], 450)




    // TFMG owns transistor production. Do not add a self-seeding recipe here.

    removeOutputRecipes(['mekanism:advanced_control_circuit'])
    event.shaped(Item.of('mekanism:advanced_control_circuit', 2), [
      'RGR',
      'CBC',
      'AUA'
    ], {
      R: '#c:dusts/redstone',
      G: 'tfc:gem/sapphire',
      C: '#createch2:mekanism_basic_control',
      B: 'tfmg:capacitor_item',
      A: '#c:plates/aluminum',
      U: 'mekanism:alloy_reinforced'
    }).id('createch2:mekanism/advanced_control_circuit_gem_lattice')

    // MI can be chosen as the powered backend instead of Mekanism, but it should
    // still enter through the same Create, rubber, steel, and TFMG electronics.
    ;[
      /^modern_industrialization:assembler_generated\/electric_age\/circuit\/craft\/lv_circuit$/,
      /^modern_industrialization:electric_age\/circuit\/craft\/lv_circuit_asbl$/,
      /^modern_industrialization:assembler_generated\/electric_age\/circuit\/craft\/electronic_circuit$/,
      /^modern_industrialization:electric_age\/circuit\/craft\/electronic_circuit_asbl$/,
      /^modern_industrialization:assembler_generated\/steam_age\/steel\/machine_casing$/,
      /^modern_industrialization:steam_age\/steel\/machine_casing_asbl$/,
      /^modern_industrialization:assembler_generated\/electric_age\/hull\/lv_machine_hull$/,
      /^modern_industrialization:electric_age\/hull\/lv_machine_hull_asbl$/
    ].forEach(id => event.remove({ id: id }))

    // Vacuum-tube control starts LV before returned aluminum or late PGM dopants.
    // Keep TFMG copper spools, tin, rubber, redstone, COM-01 and the existing ID.
    event.shaped('modern_industrialization:analog_circuit', [
      'RTR',
      'COC',
      'RSR'
    ], {
      R: '#c:dusts/redstone',
      T: 'create:electron_tube',
      C: 'tfmg:copper_spool',
      O: '#c:ingots/tin',
      S: '#createch2:industrial_rubber_sheet'
    }).id('createch2:modern_industrialization/analog_circuit_tfmg_entry')

    event.shaped('modern_industrialization:electronic_circuit', [
      'TGT',
      'BAB',
      'WCW'
    ], {
      T: 'tfmg:transistor_item',
      G: 'tfc:gem/sapphire',
      B: 'modern_industrialization:electronic_circuit_board',
      A: '#createch2:control/factory/analog',
      W: 'electroenergetics:insulated_wire',
      C: 'tfmg:capacitor_item'
    }).id('createch2:modern_industrialization/electronic_circuit_gem_lattice')

    event.shaped('modern_industrialization:steel_machine_casing', [
      'SPS',
      'OTO',
      'SPS'
    ], {
      S: '#c:plates/steel',
      P: 'create:precision_mechanism',
      // Early structural nickel comes from the existing TFC foundry.
      // Osmium belongs to the later earned PGM discipline.
      O: '#c:ingots/nickel',
      T: 'tfmg:steel_casing'
    }).id('createch2:modern_industrialization/steel_machine_casing_tfmg_entry')

    event.shaped('modern_industrialization:basic_machine_hull', [
      'SCS',
      'PHP',
      'SCS'
    ], {
      S: '#c:plates/steel',
      C: '#createch2:control/factory/analog',
      P: 'tfmg:copper_spool',
      H: 'modern_industrialization:steel_machine_casing'
    }).id('createch2:modern_industrialization/basic_machine_hull_tfmg_entry')

    // Keep the MI steam-age metalwork compatible with Create's early kinetic
    // factory instead of forcing every plate through the forge hammer.
    var createPressedPlate = (material, output) => {
      event.custom({
        type: 'create:pressing',
        ingredients: [
          { tag: `c:ingots/${material}` }
        ],
        results: [
          { id: output }
        ]
      }).id(`createch2:create/pressing/${material}_plate`)
    }

    event.custom({
      type: 'create:pressing',
      ingredients: [
        { tag: 'createch2:materials/bronze/machine_grade' }
      ],
      results: [
        { id: 'modern_industrialization:bronze_plate' }
      ]
    }).id('createch2:create/pressing/bronze_plate')
    createPressedPlate('tin', 'modern_industrialization:tin_plate')
    createPressedPlate('copper', 'modern_industrialization:copper_plate')
    createPressedPlate('iron', 'modern_industrialization:iron_plate')
    createPressedPlate('steel', 'modern_industrialization:steel_plate')

    // Compat fallback for TFMG fireclay: same material, reachable through
    // Create when the worldgen vein is being annoying.
    event.custom({
      type: 'create:mixing',
      ingredients: [
        { item: 'minecraft:clay_ball' },
        { tag: 'c:sands' }
      ],
      results: [
        {
          count: 2,
          id: 'tfmg:fireclay_ball'
        }
      ]
    }).id('createch2:tfmg/fireclay_ball_from_create_mixing')

    // Supplementaries' suspicious sand recipe collides with Create sandpaper.
    // Keep suspicious sand craftable, but move it to archaeology-adjacent inputs.
    event.remove({ id: 'supplementaries:sus_sand' })
    event.shapeless('minecraft:suspicious_sand', [
      '#c:sands/colorless',
      'minecraft:gravel'
    ]).id('createch2:minecraft/suspicious_sand_from_brushing_sand')

    // Rails are the first empire. Make committing to long ground routes less
    // grindy without replacing the journey with teleportation or early flight.
    event.shaped(Item.of('minecraft:rail', 32), [
      'I I',
      'ISI',
      'I I'
    ], {
      I: '#c:ingots/iron',
      S: 'minecraft:stick'
    }).id('createch2:minecraft/rail_bulk')

    event.shaped(Item.of('minecraft:powered_rail', 12), [
      'G G',
      'GSG',
      'GRG'
    ], {
      G: '#c:ingots/gold',
      S: 'minecraft:stick',
      R: '#c:dusts/redstone'
    }).id('createch2:minecraft/powered_rail_bulk')

    event.shaped(Item.of('minecraft:detector_rail', 12), [
      'I I',
      'IPI',
      'IRI'
    ], {
      I: '#c:ingots/iron',
      P: '#createch2:materials/rock/pressure_plates',
      R: '#c:dusts/redstone'
    }).id('createch2:minecraft/detector_rail_bulk')

    event.shaped(Item.of('minecraft:activator_rail', 12), [
      'I I',
      'ISI',
      'IRI'
    ], {
      I: '#c:ingots/iron',
      S: 'minecraft:stick',
      R: 'minecraft:redstone_torch'
    }).id('createch2:minecraft/activator_rail_bulk')

    event.shaped(Item.of('create:track', 32), [
      'SIS',
      'AAA',
      'SIS'
    ], {
      S: '#createch2:materials/rock/smooth_slabs',
      I: 'create:iron_sheet',
      A: 'create:andesite_alloy'
    }).id('createch2:create/track_bulk')

    // GregTech owns the natural-rubber tree. Rubberworks only accepts the
    // actual GTCEu trunk and canopy, so ordinary logs and decorative blossom
    // trees cannot substitute for a plantation.
    removeRecipe({ type: 'rubberworks:sapping' })
    event.custom({
      type: 'rubberworks:sapping',
      ingredients: [
        { item: 'gtceu:rubber_log' },
        { item: 'gtceu:rubber_leaves' }
      ],
      results: [
        {
          id: 'rubberworks:resin',
          amount: 100
        }
      ]
    }).id('createch2:rubberworks/sapping/gtceu_rubber_tree')

    // Remove non-tree and parallel-petrochemical sheet bypasses. The retained
    // Rubberworks compressor recipes are the only early resin-to-rubber route.
    event.remove({ id: 'rubberworks:compacting/rubber' })
    event.remove({ id: 'tfmg:vat_machine_recipe/rubber' })
    removeOutputRecipes(['tfmg:rubber_sheet', 'modern_industrialization:rubber_sheet'])
    ;[
      'modern_industrialization:materials/mixer/oil_to_rubber',
      'modern_industrialization:materials/mixer/oil_to_rubber_sheet',
      'modern_industrialization:materials/mixer/rubber_sheet_from_synthetic',
      'modern_industrialization:oil/vacuum_freezer/styrene_butadiene_rubber'
    ].forEach(id => event.remove({ id: id }))
    removeRecipe({ id: /^modern_industrialization:materials\/.+\/assembler\/cable_(?:styrene_rubber|synthetic_rubber)$/ })

    // GregTech's machine and material recipes remain contained, but the tree's
    // harmless wood family stays usable as ordinary construction material.
    event.shapeless(Item.of('gtceu:rubber_planks', 4), [
      '#gtceu:rubber_logs'
    ]).id('createch2:gtceu/rubber_wood/planks')
    event.shaped(Item.of('gtceu:rubber_wood', 3), [
      'LL',
      'LL'
    ], {
      L: 'gtceu:rubber_log'
    }).id('createch2:gtceu/rubber_wood/wood')
    event.shaped(Item.of('gtceu:stripped_rubber_wood', 3), [
      'LL',
      'LL'
    ], {
      L: 'gtceu:stripped_rubber_log'
    }).id('createch2:gtceu/rubber_wood/stripped_wood')
    event.shaped(Item.of('gtceu:rubber_slab', 6), [
      'PPP'
    ], {
      P: 'gtceu:rubber_planks'
    }).id('createch2:gtceu/rubber_wood/slab')
    event.shaped(Item.of('gtceu:rubber_stairs', 4), [
      'P  ',
      'PP ',
      'PPP'
    ], {
      P: 'gtceu:rubber_planks'
    }).id('createch2:gtceu/rubber_wood/stairs')
    event.shaped(Item.of('gtceu:rubber_fence', 3), [
      'PSP',
      'PSP'
    ], {
      P: 'gtceu:rubber_planks',
      S: '#c:rods/wooden'
    }).id('createch2:gtceu/rubber_wood/fence')
    event.shaped('gtceu:rubber_fence_gate', [
      'SPS',
      'SPS'
    ], {
      P: 'gtceu:rubber_planks',
      S: '#c:rods/wooden'
    }).id('createch2:gtceu/rubber_wood/fence_gate')
    event.shaped(Item.of('gtceu:rubber_door', 3), [
      'PP',
      'PP',
      'PP'
    ], {
      P: 'gtceu:rubber_planks'
    }).id('createch2:gtceu/rubber_wood/door')
    event.shaped(Item.of('gtceu:rubber_trapdoor', 2), [
      'PPP',
      'PPP'
    ], {
      P: 'gtceu:rubber_planks'
    }).id('createch2:gtceu/rubber_wood/trapdoor')
    event.shaped('gtceu:rubber_pressure_plate', [
      'PP'
    ], {
      P: 'gtceu:rubber_planks'
    }).id('createch2:gtceu/rubber_wood/pressure_plate')
    event.shapeless('gtceu:rubber_button', [
      'gtceu:rubber_planks'
    ]).id('createch2:gtceu/rubber_wood/button')

    // Rubber is the pack's industrial polymer. Create logistics should come from
    // tapped trees, not kelp farms.
    removeOutputRecipes(['create:belt_connector'])
    event.shaped('create:belt_connector', [
      'RRR',
      'RRR'
    ], {
      R: 'rubberworks:rubber'
    }).id('createch2:create/crafting/kinetics/belt_connector')

    removeOutputRecipes(['create:hose_pulley'])
    event.shaped('create:hose_pulley', [
      'B',
      'R',
      'I'
    ], {
      B: 'create:copper_casing',
      R: 'rubberworks:rubber_block',
      I: '#c:plates/copper'
    }).id('createch2:create/crafting/kinetics/hose_pulley')

    removeOutputRecipes(['create:elevator_pulley'])
    event.shaped('create:elevator_pulley', [
      'B',
      'R',
      'I'
    ], {
      B: 'create:brass_casing',
      R: 'rubberworks:rubber_block',
      I: '#c:plates/iron'
    }).id('createch2:create/crafting/kinetics/elevator_pulley')

    event.remove({ id: 'tfmg:crafting/materials/unfinished_resistorfrom_slime' })
    event.shaped('tfmg:unfinished_resistor', [
      ' W ',
      ' R ',
      ' W '
    ], {
      W: '#c:wires/copper',
      R: 'rubberworks:rubber_sheet'
    }).id('createch2:tfmg/crafting/materials/unfinished_resistor_from_rubber')

    event.shaped('mekanism:hdpe_rod', [
      'RR',
      'RR'
    ], {
      R: 'rubberworks:rubber_sheet'
    }).id('createch2:mekanism/hdpe_rod_from_rubber_sheet')

    event.shaped('mekanism:hdpe_stick', [
      'R',
      'R'
    ], {
      R: 'rubberworks:rubber'
    }).id('createch2:mekanism/hdpe_stick_from_rubber')

    // Early flight should feel like a Nether-tier Tekkit milestone, not a cheap
    // basic-machine side craft.
    removeOutputRecipes(['mekanism:jetpack'])
    event.shaped('mekanism:jetpack', [
      'SCS',
      'GTG',
      'IRI'
    ], {
      S: '#c:ingots/steel',
      C: '#createch2:mekanism_basic_control',
      G: 'minecraft:glowstone',
      T: 'mekanism:basic_chemical_tank',
      I: '#c:ingots/tin',
      R: 'rubberworks:rubber_block'
    }).id('createch2:mekanism/jetpack_glowstone')

    removeOutputRecipes(['mekanism:jetpack_armored'])
    event.shaped('mekanism:jetpack_armored', [
      '#G#',
      'ISI',
      ' P '
    ], {
      '#': '#c:dusts/diamond',
      G: 'mekanism:ingot_refined_glowstone',
      I: '#c:ingots/bronze',
      S: '#c:storage_blocks/steel',
      P: 'mekanism:jetpack'
    }).id('createch2:mekanism/jetpack_armored_refined_glowstone')

    // Keep unsupported modded wood families out of crafting while allowing every
    // curated world-source vanilla family, including acacia and dark oak.
    removeOutputRecipes([
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
    ])

    event.remove({ id: 'backpacked:backpack' })
    event.remove({ id: 'backpacked:backpack_dock' })
    event.shaped('backpacked:backpack', [
      'LPL',
      'BCB',
      'LPL'
    ], {
      L: 'minecraft:leather',
      P: 'modern_industrialization:bronze_plate',
      B: 'create:belt_connector',
      C: '#createch2:wooden_storage_chests'
    }).id('createch2:backpacked/backpack')

    event.shaped('backpacked:backpack_dock', [
      'SBS',
      'PCP',
      'SBS'
    ], {
      S: 'modern_industrialization:steel_plate',
      B: 'backpacked:backpack',
      P: 'create:precision_mechanism',
      C: 'create:brass_casing'
    }).id('createch2:backpacked/backpack_dock')

    removeOutputRecipes([
      /^create:cherry_window(?:_pane)?$/,
      /^farmersdelight:cherry_cabinet$/,
      /^mcwbridges:.*cherry.*$/,
      /^mcwroofs:.*cherry.*$/,
      /^quark:(?:trapped_)?(?:lootr_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|blossom|azalea|ancient|purpur|prismarine|nether_brick)_chest$/,
      /^quark:(?:lootr_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|blossom|azalea|ancient|purpur|prismarine|nether_brick)_chest_(?:boat|raft)$/
    ])
    // Worldgen quartz blocks stand in for marble, so salvaging them should stay lossy.
    event.remove({ id: 'farmersdelight:salvaging/quartz_block' })
    event.custom({
      type: 'farmersdelight:cutting',
      ingredients: [
        { item: 'minecraft:quartz_block' }
      ],
      result: [
        {
          item: {
            id: 'minecraft:quartz',
            count: 1
          }
        }
      ],
      tool: [
        {
          type: 'farmersdelight:item_ability',
          action: 'pickaxe_dig'
        },
        { tag: 'minecraft:pickaxes' }
      ]
    }).id('createch2:farmersdelight/salvaging/quartz_block')

    // Teleportation is late network infrastructure. It should connect an empire
    // after rails and airships exist, not replace the need to build them.
    removeOutputRecipes(['mekanism:teleportation_core'])
    event.shaped('mekanism:teleportation_core', [
      'EAE',
      'CDC',
      'EPE'
    ], {
      E: 'minecraft:ender_eye',
      A: 'mekanism:alloy_atomic',
      C: '#createch2:mekanism_ultimate_control',
      D: 'minecraft:dragon_breath',
      P: 'simulated:physics_assembler'
    }).id('createch2:mekanism/teleportation_core')

    removeOutputRecipes(['mekanism:teleporter_frame'])
    event.shaped(Item.of('mekanism:teleporter_frame', 4), [
      'OHO',
      'HGH',
      'OHO'
    ], {
      O: '#c:ingots/refined_obsidian',
      H: 'tfmg:heavy_plate',
      G: '#c:ingots/refined_glowstone'
    }).id('createch2:mekanism/teleporter_frame')

    removeOutputRecipes(['mekanism:teleporter'])
    event.shaped('mekanism:teleporter', [
      'FTF',
      'CAC',
      'FMF'
    ], {
      F: 'mekanism:teleporter_frame',
      T: 'mekanism:teleportation_core',
      C: '#createch2:mekanism_ultimate_control',
      A: 'create_aeronautics_automated_logistics:airship_station',
      M: 'tfmg:heavy_machinery_casing'
    }).id('createch2:mekanism/teleporter')

    removeOutputRecipes(['mekanism:portable_teleporter'])
    event.shaped('mekanism:portable_teleporter', [
      'EUE',
      'ATA',
      'EUE'
    ], {
      E: '#createch2:portable_energy_cell',
      U: '#createch2:mekanism_ultimate_control',
      A: 'create_aeronautics_automated_logistics:airship_station',
      T: 'mekanism:teleportation_core'
    }).id('createch2:mekanism/portable_teleporter')

    removeOutputRecipes(['mekanism:module_teleportation_unit'])

    // Physical quarries can support extraction outposts. Mekanism's selective
    // digital extraction is End-frontier resource mastery.

    // Aeronautics is Chapter 8 infrastructure: rails and heavy industry should come first.
    event.remove({ id: 'simulated:physics_assembler' })
    event.shaped('simulated:physics_assembler', [
      'HCH',
      'SMS',
      'HGH'
    ], {
      H: 'tfmg:heavy_plate',
      C: 'tfmg:capacitor_item',
      S: 'tfmg:steel_mechanism',
      M: '#createch2:control/factory/processing',
      G: 'tfmg:steel_casing'
    }).id('createch2:simulated/physics_assembler')

    event.remove({ id: 'aeronautics:propeller_bearing' })
    event.shaped('aeronautics:propeller_bearing', [
      ' H ',
      'SCS',
      'ABA'
    ], {
      H: 'tfmg:heavy_plate',
      S: 'tfmg:steel_mechanism',
      C: 'tfmg:capacitor_item',
      A: 'create:shaft',
      B: 'create:brass_casing'
    }).id('createch2:aeronautics/propeller_bearing')

    event.remove({ id: 'simulated:sequenced_assembly/gyroscopic_mechanism' })

    event.remove({ id: 'aeronautics:gyroscopic_propeller_bearing' })
    event.shaped('aeronautics:gyroscopic_propeller_bearing', [
      ' C ',
      'AGA',
      ' H '
    ], {
      C: 'tfmg:capacitor_item',
      A: '#createch2:control/factory/digital',
      G: 'simulated:gyroscopic_mechanism',
      H: 'tfmg:heavy_machinery_casing'
    }).id('createch2:aeronautics/gyroscopic_propeller_bearing')

    event.remove({ id: 'aeronautics:adjustable_burner' })
    event.shaped('aeronautics:adjustable_burner', [
      'HSH',
      'ICI',
      'ARA'
    ], {
      H: 'tfmg:heavy_plate',
      S: 'tfmg:steel_casing',
      I: 'create:iron_sheet',
      C: '#aeronautics:burner_fire',
      A: 'create:andesite_alloy',
      R: '#createch2:control/factory/analog'
    }).id('createch2:aeronautics/adjustable_burner')

    event.remove({ id: 'aeronautics:steam_vent' })
    event.shaped('aeronautics:steam_vent', [
      ' G ',
      'CSC',
      'IPI'
    ], {
      G: '#c:plates/gold',
      C: 'tfmg:capacitor_item',
      S: 'tfmg:steel_casing',
      I: 'tfmg:industrial_pipe',
      P: 'minecraft:copper_block'
    }).id('createch2:aeronautics/steam_vent')

    event.remove({ id: 'simulated:sequenced_assembly/engine_assembly' })
    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'tfmg:heavy_plate' },
      transitional_item: { id: 'simulated:incomplete_engine_assembly' },
      loops: 4,
      sequence: [
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'simulated:incomplete_engine_assembly' },
            { item: 'tfmg:steel_mechanism' }
          ],
          results: [{ id: 'simulated:incomplete_engine_assembly' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'simulated:incomplete_engine_assembly' },
            { item: 'tfmg:copper_spool' }
          ],
          results: [{ id: 'simulated:incomplete_engine_assembly' }]
        },
        {
          type: 'create:deploying',
          ingredients: [
            { item: 'simulated:incomplete_engine_assembly' },
            { tag: 'createch2:control/electromechanical' }
          ],
          results: [{ id: 'simulated:incomplete_engine_assembly' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'simulated:incomplete_engine_assembly' }],
          results: [{ id: 'simulated:incomplete_engine_assembly' }]
        }
      ],
      results: [
        { chance: 80.0, id: 'simulated:engine_assembly' },
        { chance: 8.0, id: 'tfmg:heavy_plate' },
        { chance: 4.0, id: 'tfmg:steel_mechanism' },
        { id: 'tfmg:copper_spool' }
      ]
    }).id('createch2:simulated/sequenced_assembly/engine_assembly')

    event.remove({ id: 'simulated:red_portable_engine' })
    event.shaped('simulated:red_portable_engine', [
      ' C ',
      ' E ',
      'SBS'
    ], {
      C: 'tfmg:capacitor_item',
      E: 'simulated:engine_assembly',
      S: 'tfmg:steel_casing',
      B: 'minecraft:blast_furnace'
    }).id('createch2:simulated/red_portable_engine')

    event.remove({ id: 'simulated:mechanical_crafting/docking_connector' })
    event.custom({
      type: 'create:mechanical_crafting',
      accept_mirrored: true,
      category: 'misc',
      pattern: [
        'IHI',
        'LAL',
        'PCP',
        'BEB'
      ],
      key: {
        I: { item: 'create:iron_sheet' },
        H: { item: 'tfmg:heavy_plate' },
        L: { item: 'tfmg:cable_connector' },
        A: { item: 'create:brass_casing' },
        P: { item: 'minecraft:piston' },
        C: { item: 'create:chute' },
        B: { item: 'create:brass_sheet' },
        E: { tag: 'createch2:control/electromechanical' }
      },
      result: {
        id: 'simulated:docking_connector',
        count: 2
      }
    }).id('createch2:simulated/mechanical_crafting/docking_connector')

    removeOutputRecipes(['create_aeronautics_automated_logistics:airship_station'])
    event.shaped('create_aeronautics_automated_logistics:airship_station', [
      ' T ',
      'SPS',
      'CAC'
    ], {
      T: 'create:track_station',
      S: 'tfmg:steel_mechanism',
      P: 'simulated:physics_assembler',
      C: 'tfmg:cable_connector',
      A: '#createch2:control/factory/digital'
    }).id('createch2:create_aeronautics_automated_logistics/airship_station')

    removeOutputRecipes(['create_aeronautics_automated_logistics:ship_transponder'])
    event.shaped('create_aeronautics_automated_logistics:ship_transponder', [
      ' N ',
      'TPT',
      'CAC'
    ], {
      N: 'simulated:navigation_table',
      T: 'tfmg:transistor_item',
      P: 'simulated:physics_assembler',
      C: 'tfmg:copper_spool',
      A: '#createch2:control/factory/digital'
    }).id('createch2:create_aeronautics_automated_logistics/ship_transponder')

    event.remove({ id: 'aeroclaims_ftb:claim_block' })
    event.shaped('aeroclaims_ftb:claim_block', [
      ' G ',
      'HRC',
      'OIB'
    ], {
      G: 'create:framed_glass_pane',
      H: 'tfmg:heavy_plate',
      R: 'create:precision_mechanism',
      C: 'tfmg:cable_connector',
      O: 'minecraft:orange_dye',
      I: 'create:iron_sheet',
      B: 'minecraft:black_dye'
    }).id('createch2:aeroclaims_ftb/claim_block')

    event.remove({ id: 'create_hypertube:hypertube_entrance' })
    event.shaped('create_hypertube:hypertube_entrance', [
      'KPK',
      'SCS',
      'GEG'
    ], {
      K: 'rubberworks:rubber_sheet',
      P: 'create:precision_mechanism',
      S: 'tfmg:steel_mechanism',
      C: 'create:smart_chute',
      G: 'create:cogwheel',
      E: 'tfmg:cable_connector'
    }).id('createch2:create_hypertube/hypertube_entrance')

    event.remove({ id: 'create_hypertube:hyper_accelerator_large_cogwheel' })
    event.shaped(Item.of('create_hypertube:hypertube_accelerator', 2), [
      ' P ',
      'BEB',
      ' C '
    ], {
      P: 'create:precision_mechanism',
      B: '#createch2:control/factory/analog',
      E: 'create_hypertube:hypertube_entrance',
      C: 'create:large_cogwheel'
    }).id('createch2:create_hypertube/hyper_accelerator_large_cogwheel')

    event.remove({ id: 'create_hypertube:hyper_accelerator_small_cogwheel' })
    event.shaped(Item.of('create_hypertube:hypertube_accelerator', 2), [
      ' P ',
      'BEB',
      ' C '
    ], {
      P: 'create:precision_mechanism',
      B: '#createch2:control/factory/analog',
      E: 'create_hypertube:hypertube_entrance',
      C: 'create:cogwheel'
    }).id('createch2:create_hypertube/hyper_accelerator_small_cogwheel')

    // FRN-04E spatial logistics: the transfer crystal links an established
    // endpoint. Earlier titanium vessels remain useful in the mature system.
    event.remove({ output: 'enderstorage:ender_chest' })
    event.shaped('enderstorage:ender_chest', [
      'BPB',
      'OCO',
      'SAS'
    ], {
      B: 'minecraft:blaze_rod',
      P: '#c:ender_pearls',
      O: '#c:obsidians',
      C: 'modern_industrialization:solid_titanium_machine_casing',
      S: 'modern_industrialization:titanium_plate',
      A: 'sgjourney:transfer_crystal'
    }).id('createch2:enderstorage/ender_chest')

    event.remove({ output: 'enderstorage:ender_tank' })
    event.shaped('enderstorage:ender_tank', [
      'BPB',
      'OCO',
      'SAS'
    ], {
      B: 'minecraft:blaze_rod',
      P: '#c:ender_pearls',
      O: '#c:obsidians',
      C: 'modern_industrialization:solid_titanium_machine_casing',
      S: 'modern_industrialization:titanium_plate',
      A: 'sgjourney:transfer_crystal'
    }).id('createch2:enderstorage/ender_tank')

    event.remove({ output: 'enderstorage:ender_pouch' })
    event.shaped('enderstorage:ender_pouch', [
      'BLB',
      'LPL',
      'SCS'
    ], {
      B: 'minecraft:blaze_powder',
      L: '#c:leathers',
      P: '#c:ender_pearls',
      S: 'modern_industrialization:titanium_plate',
      C: 'sgjourney:transfer_crystal'
    }).id('createch2:enderstorage/ender_pouch')

    removeRecipe({ id: /^buildinggadgets2:gadget_/ })
    event.remove({ id: 'buildinggadgets2:template_manager' })
    event.shaped('buildinggadgets2:gadget_building', [
      'IRI',
      'PDP',
      'ICI'
    ], {
      I: '#c:ingots/iron',
      R: '#c:dusts/redstone',
      P: 'create:precision_mechanism',
      D: '#c:gems/diamond',
      C: '#createch2:control/factory/analog'
    }).id('createch2:buildinggadgets2/gadget_building')

    event.shaped('buildinggadgets2:gadget_exchanging', [
      'IRI',
      'PDP',
      'ICI'
    ], {
      I: '#c:ingots/iron',
      R: '#c:dusts/redstone',
      P: 'create:precision_mechanism',
      D: 'create:deployer',
      C: '#createch2:control/factory/analog'
    }).id('createch2:buildinggadgets2/gadget_exchanging')

    event.shaped('buildinggadgets2:gadget_copy_paste', [
      'IRI',
      'PEP',
      'ICI'
    ], {
      I: '#c:ingots/iron',
      R: '#c:dusts/redstone',
      P: 'create:precision_mechanism',
      E: '#c:gems/emerald',
      C: '#createch2:control/factory/digital'
    }).id('createch2:buildinggadgets2/gadget_copy_paste')

    event.shaped('buildinggadgets2:gadget_cut_paste', [
      'IRI',
      'PSP',
      'ICI'
    ], {
      I: '#c:ingots/iron',
      R: '#c:dusts/redstone',
      P: 'create:precision_mechanism',
      S: 'minecraft:shears',
      C: '#createch2:control/factory/digital'
    }).id('createch2:buildinggadgets2/gadget_cut_paste')

    event.shaped('buildinggadgets2:gadget_destruction', [
      'IRI',
      'PEP',
      'ICI'
    ], {
      I: '#c:ingots/steel',
      R: '#c:dusts/redstone',
      P: 'tfmg:steel_mechanism',
      E: '#c:ender_pearls',
      C: '#createch2:control/factory/processing'
    }).id('createch2:buildinggadgets2/gadget_destruction')


    // TFMG and Mekanism own the steel economy; CBC steel remains a casting consumer, not a shortcut path.
    event.remove({ id: 'createbigcannons:mixing/alloy_steel' })
    event.remove({ id: 'createbigcannons:steel_ingot_from_nuggets' })
    event.remove({ id: 'createbigcannons:steel_ingot_from_block' })
    event.remove({ id: 'createbigcannons:steel_block' })
    event.remove({ id: 'createbigcannons:steel_scrap' })
    event.remove({ id: 'createbigcannons:compacting/forge_steel_ingot' })
    event.remove({ id: 'createbigcannons:compacting/forge_steel_nugget' })
    event.remove({ id: 'createbigcannons:compacting/forge_steel_block' })

    // Cannon infrastructure is a heavy-industry branch, with radar fire control after factory logic.
    event.remove({ id: 'createbigcannons:cannon_builder' })
    event.shaped('createbigcannons:cannon_builder', [
      'PHP',
      'SCS',
      ' E '
    ], {
      P: 'create:iron_sheet',
      H: 'tfmg:heavy_plate',
      S: 'create:piston_extension_pole',
      C: 'tfmg:steel_casing',
      E: 'tfmg:steel_mechanism'
    }).id('createch2:createbigcannons/cannon_builder')

    event.remove({ id: 'createbigcannons:cannon_drill' })
    event.shaped('createbigcannons:cannon_drill', [
      ' H ',
      'PCP',
      ' E '
    ], {
      H: 'tfmg:heavy_plate',
      P: 'tfmg:steel_pipe',
      C: 'tfmg:steel_casing',
      E: 'tfmg:steel_mechanism'
    }).id('createch2:createbigcannons/cannon_drill')

    event.remove({ id: 'createbigcannons:cannon_loader' })
    event.shaped('createbigcannons:cannon_loader', [
      ' G ',
      'SCS',
      ' E '
    ], {
      G: '#createbigcannons:gunpowder',
      S: 'create:piston_extension_pole',
      C: 'tfmg:steel_casing',
      E: 'tfmg:steel_mechanism'
    }).id('createch2:createbigcannons/cannon_loader')

    event.remove({ id: 'createbigcannons:cannon_mount' })
    event.shaped('createbigcannons:cannon_mount', [
      'PSP',
      'MCM',
      'GHG'
    ], {
      P: 'create:iron_sheet',
      S: 'create:shaft',
      M: 'tfmg:steel_mechanism',
      C: 'tfmg:steel_casing',
      G: '#createbigcannons:gunpowder',
      H: 'tfmg:heavy_plate'
    }).id('createch2:createbigcannons/cannon_mount')

    event.remove({ id: 'createbigcannons:fixed_cannon_mount' })
    event.shaped('createbigcannons:fixed_cannon_mount', [
      ' P ',
      'GCG',
      ' M '
    ], {
      P: 'create:iron_sheet',
      G: '#createbigcannons:gunpowder',
      C: 'tfmg:steel_casing',
      M: 'tfmg:steel_mechanism'
    }).id('createch2:createbigcannons/fixed_cannon_mount')

    // First artillery payloads should start after the pack steel path, not off loose starter iron.
    event.remove({ id: 'createbigcannons:solid_shot' })
    event.shaped('createbigcannons:solid_shot', [
      ' n ',
      'SSS',
      ' H '
    ], {
      n: '#c:nuggets/iron',
      S: 'tfmg:steel_ingot',
      H: 'tfmg:heavy_plate'
    }).id('createch2:createbigcannons/solid_shot')

    event.remove({ id: 'create_radar:crafting/radar_reciever' })
    event.shaped('create_radar:radar_receiver_block', [
      ' R ',
      'HCH',
      ' E '
    ], {
      R: 'minecraft:lightning_rod',
      H: 'tfmg:heavy_plate',
      C: 'create:industrial_iron_block',
      E: '#createch2:control/factory/analog'
    }).id('createch2:create_radar/crafting/radar_receiver')

    event.remove({ id: 'create_radar:crafting/fire_controller' })
    event.shaped('create_radar:fire_controller', [
      ' R ',
      'CBC',
      ' M '
    ], {
      R: '#c:dusts/redstone',
      C: '#createch2:control/factory/analog',
      B: 'create:brass_casing',
      M: 'tfmg:steel_mechanism'
    }).id('createch2:create_radar/crafting/fire_controller')

    event.remove({ id: 'create_radar:crafting/auto_pitch_controller' })
    event.shaped('create_radar:auto_pitch_controller', [
      'PC',
      'GM'
    ], {
      P: 'create:precision_mechanism',
      C: '#createch2:control/factory/analog',
      G: 'create:gearbox',
      M: 'tfmg:steel_mechanism'
    }).id('createch2:create_radar/crafting/auto_pitch_controller')

    event.remove({ id: 'create_radar:crafting/auto_yaw_controller' })
    event.shaped('create_radar:auto_yaw_controller', [
      'PC',
      'GM'
    ], {
      P: 'create:precision_mechanism',
      C: '#createch2:control/factory/analog',
      G: 'create:gearbox',
      M: 'tfmg:steel_mechanism'
    }).id('createch2:create_radar/crafting/auto_yaw_controller')

    event.remove({ id: 'create_radar:crafting/guided_fuze' })
    event.shaped(Item.of('create_radar:guided_fuze', 2), [
      ' R ',
      'FCF',
      ' E '
    ], {
      R: 'create_radar:radar_receiver_block',
      F: 'createbigcannons:proximity_fuze',
      C: '#createch2:control/factory/digital',
      E: 'minecraft:ender_pearl'
    }).id('createch2:create_radar/crafting/guided_fuze')

    // CBC Enhanced Shells 1.2.3 exposes arbitrary-coordinate targeting through the
    // Target Designator. Keep that capability on Createch's established radar,
    // digital-control and heavy-steel authority instead of the native vanilla craft.
    event.remove({ id: 'cbc_enhanced_shells:target_designator' })
    event.shaped('cbc_enhanced_shells:target_designator', [
      ' AS',
      'PDC',
      ' HR'
    ], {
      A: 'minecraft:amethyst_shard',
      S: 'minecraft:spyglass',
      P: 'create:precision_mechanism',
      D: '#createch2:control/factory/digital',
      C: 'minecraft:compass',
      H: 'tfmg:heavy_plate',
      R: 'create_radar:radar_receiver_block'
    }).id('createch2:cbc_enhanced_shells/fire_control/target_designator')

    event.remove({ id: 'cbc_enhanced_shells:guided_nose_cone' })
    event.shaped('cbc_enhanced_shells:guided_nose_cone', [
      ' E ',
      'PCR',
      'SNS'
    ], {
      E: 'minecraft:ender_eye',
      P: 'create:precision_mechanism',
      C: '#createch2:control/factory/digital',
      R: 'create_radar:radar_receiver_block',
      S: 'tfmg:steel_mechanism',
      N: 'cbc_enhanced_shells:nose_cone_steel'
    }).id('createch2:cbc_enhanced_shells/fire_control/guided_nose_cone')

    // The Ballistics port ships fire-control recipes with legacy result JSON. Keep the field kit craftable here.
    event.remove({ id: 'cbc_ballistics:rangefinder' })
    event.shaped('cbc_ballistics:rangefinder', [
      ' AS',
      'ETI',
      'PI '
    ], {
      A: 'minecraft:amethyst_shard',
      S: 'minecraft:spyglass',
      E: 'create:electron_tube',
      T: 'minecraft:string',
      I: 'create:iron_sheet',
      P: 'create:framed_glass_pane'
    }).id('createch2:cbc_ballistics/rangefinder')

    event.remove({ id: 'cbc_ballistics:ballistics_calculator' })
    event.shaped('cbc_ballistics:ballistic_calculator', [
      'EPA',
      'DPP',
      'DBA'
    ], {
      E: 'create:electron_tube',
      P: 'create:precision_mechanism',
      A: 'create:andesite_alloy',
      D: 'create:display_board',
      B: 'create:brass_casing'
    }).id('createch2:cbc_ballistics/ballistics_calculator')

    event.remove({ id: 'cbc_ballistics:network_manager_item' })
    event.shaped('cbc_ballistics:network_manager_item', [
      ' T ',
      ' C ',
      ' A '
    ], {
      T: 'create:transmitter',
      C: 'create:clipboard',
      A: 'create:andesite_alloy'
    }).id('createch2:cbc_ballistics/network_manager_item')

    event.remove({ id: 'cbc_ballistics:cannon_control' })
    event.shaped('cbc_ballistics:cannon_control', [
      'RTS',
      'SPG',
      'ABA'
    ], {
      R: 'create:redstone_contact',
      T: 'create:transmitter',
      S: 'create:shaft',
      P: 'create:precision_mechanism',
      G: 'create:gearbox',
      A: 'create:andesite_alloy',
      B: 'create:brass_casing'
    }).id('createch2:cbc_ballistics/cannon_control')

    event.remove({ id: 'cbc_ballistics:artillery_coordinator' })
    event.shaped('cbc_ballistics:artillery_coordinator', [
      'PEP',
      'MDT',
      'ABA'
    ], {
      P: 'create:precision_mechanism',
      E: 'create:electron_tube',
      M: 'cbc_ballistics:network_manager_item',
      D: 'create:display_board',
      T: 'create:transmitter',
      A: 'create:andesite_alloy',
      B: 'create:brass_casing'
    }).id('createch2:cbc_ballistics/artillery_coordinator')

    event.remove({ id: 'cbc_ballistics:radio_item' })
    event.shaped('cbc_ballistics:radio_item', [
      ' R ',
      ' C ',
      ' L '
    ], {
      R: 'minecraft:lightning_rod',
      C: 'cbc_ballistics:artillery_coordinator',
      L: 'minecraft:leather'
    }).id('createch2:cbc_ballistics/radio_item')

    // Bees can stay discoverable early, but mining bees and advanced hives should not
    // become a resource factory before Stainless/Digital control infrastructure.
    removeOutputRecipes(['productivebees:advanced_oak_beehive'])
    removeRecipe({ id: /^productivebees:hives\/advanced_.*_(beehive|canvas_hive)$/ })

    removeRecipe({ id: /^productivebees:powered_centrifuge\// })

    event.remove({ id: 'productivebees:bee_breeding/quarry_bee' })
    // Productive Bees' Farmer Bee treats every mature CropBlock as a vanilla
    // right-click crop. TFC crops carry climate, nutrient, and lifecycle state,
    // so the unsafe generic worker has no survival acquisition route.
    event.remove({ id: 'productivebees:bee_breeding/farmer_bee' })
    event.custom({
      type: 'productivebees:bee_conversion',
      source: 'productivebees:digger_bee',
      result: 'productivebees:quarry_bee',
      item: {
        item: 'productivebees:advanced_oak_beehive'
      }
    }).id('createch2:productivebees/quarry_bee')

    // Gobber and Minium are owned by the integrated supernatural and resource systems phase.
    // Do not broad-remove either namespace here.
  })

  compileFamily('Quality-of-life integration', () => {
    event.shaped(Item.of('backpacked:unlock_token', 2), [
      'SLS',
      'PBP',
      'SLS'
    ], {
      S: '#c:strings',
      L: '#c:leathers',
      P: 'modern_industrialization:bronze_plate',
      B: '#createch2:wooden_storage_chests'
    }).id('createch2:qol/backpacked/unlock_token')



    event.shaped('minecraft:bundle', [
      'SLS',
      'L L',
      'LLL'
    ], {
      S: '#c:strings',
      L: '#c:leathers'
    }).id('createch2:qol/minecraft/bundle')

    event.shaped(Item.of('minecraft:scaffolding', 16), [
      'SBS',
      ' B ',
      'SBS'
    ], {
      S: '#c:strings',
      B: 'minecraft:bamboo'
    }).id('createch2:qol/minecraft/scaffolding_bulk')

    event.shapeless('minecraft:slime_ball', [
      'create:dough',
      'minecraft:lime_dye'
    ]).id('createch2:qol/minecraft/slime_ball_from_dough')

    event.shapeless(Item.of('minecraft:torch', 8), [
      '#minecraft:coals',
      'minecraft:stick',
      'minecraft:stick'
    ]).id('createch2:qol/minecraft/torch_double_stick')


  })

  compileFamily('Age 3 — Bronze Steam — Rubber Plantation', () => {
    removeOutputRecipes(['rubberworks:sapper', 'rubberworks:compressor'])

    event.shaped('rubberworks:sapper', [
      ' C ',
      'BGB',
      'WPL'
    ], {
      C: '#c:plates/copper',
      B: '#createch2:materials/bronze/machine_grade',
      G: 'create:cogwheel',
      W: '#tfc:lumber',
      P: 'create:fluid_pipe',
      L: '#c:leathers'
    }).id('createch2:bronze_steam/rubberworks/sapper')
  })

  compileFamily('Bee progression', () => {
    var id = name => `createch2:bees/${name}`

    removeOutputRecipes([/^productivebees:advanced_.*_beehive(?:_clear)?$/])

    removeOutputRecipes([
      'productivebees:bee_cage',
      'productivebees:sturdy_bee_cage',
      'productivebees:centrifuge',
      'productivebees:heated_centrifuge',
      'productivebees:powered_centrifuge',
      'productivebees:incubator',
      'productivebees:breeding_chamber',
      'productivebees:gene_indexer',
      'productivebees:honey_generator',
      'modularbees:bee_extractor',
      'modularbees:modular_beehive_core',
      'modularbees:modular_centrifuge_core',
      'modularbees:modular_export',
      'modularbees:me_beehive_export',
      'modularbees:me_centrifuge_export'
    ])

    event.shaped(Item.of('productivebees:bee_cage', 4), [
      'RHR',
      'WCW',
      'RHR'
    ], {
      R: '#c:rods/wooden',
      H: 'minecraft:honey_bottle',
      W: '#minecraft:planks',
      C: '#c:plates/copper'
    }).id(id('field/bee_cage'))

    event.shaped('productivebees:sturdy_bee_cage', [
      'SCS',
      'CHC',
      'SCS'
    ], {
      S: '#c:ingots/steel',
      C: 'productivebees:bee_cage',
      H: 'minecraft:honey_block'
    }).id(id('steel/sturdy_bee_cage'))

    event.shapeless('productivebees:honey_treat', [
      'minecraft:honeycomb',
      'minecraft:honey_bottle',
      '#c:seeds'
    ]).id(id('field/honey_treat'))

    event.shaped('productivebees:centrifuge', [
      'A A',
      'SGS',
      'ACA'
    ], {
      A: 'create:andesite_alloy',
      S: '#c:ingots/steel',
      G: 'minecraft:grindstone',
      C: 'create:andesite_casing'
    }).id(id('create/manual_centrifuge'))



    event.shaped('productivebees:incubator', [
      'GCG',
      'PHP',
      'GCG'
    ], {
      G: '#c:glass_blocks/cheap',
      C: 'modern_industrialization:analog_circuit',
      P: '#c:plates/steel',
      H: '#createch2:agriculture/incubator_bedding'
    }).id(id('low_voltage/incubator'))

    event.shaped('productivebees:breeding_chamber', [
      'GCG',
      'THT',
      'GCG'
    ], {
      G: '#c:glass_blocks/cheap',
      C: 'stellaris:cable',
      T: 'productivebees:honey_treat',
      H: 'stellaris:oxygen_distributor'
    }).id(id('first_space/breeding_chamber'))

    event.shaped('productivebees:advanced_oak_beehive', [
      'SCS',
      'HBH',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      C: 'modern_industrialization:digital_circuit',
      H: 'minecraft:honey_block',
      B: 'minecraft:beehive',
      D: 'modern_industrialization:advanced_machine_hull'
    }).id(id('stainless_digital/advanced_oak_beehive'))

    event.shaped('productivebees:powered_centrifuge', [
      'SCS',
      'PHP',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      C: 'modern_industrialization:digital_circuit',
      P: 'productivebees:centrifuge',
      H: 'modern_industrialization:advanced_machine_hull',
      D: 'electroenergetics:hanging_glass_insulator'
    }).id(id('stainless_digital/powered_centrifuge'))


    event.shaped('productivebees:heated_centrifuge', [
      'VGV',
      'CPC',
      'MHM'
    ], {
      V: 'stellaris:venus_sandstone',
      G: 'stellaris:venus_corronium_ore',
      C: 'modern_industrialization:stainless_steel_curved_plate',
      P: 'productivebees:powered_centrifuge',
      M: 'stellaris:mercury_solerium_ore',
      H: 'modern_industrialization:advanced_machine_hull'
    }).id(id('planetary/heated_centrifuge'))


    event.shaped('modularbees:modular_beehive_core', [
      'SAS',
      'BHB',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_large_plate',
      A: 'ae2:annihilation_core',
      B: 'minecraft:iron_bars',
      H: 'productivebees:advanced_oak_beehive',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('stainless_digital/modular_beehive_core'))

    event.shaped('modularbees:modular_centrifuge_core', [
      'SFS',
      'CPC',
      'SDS'
    ], {
      S: 'modern_industrialization:stainless_steel_large_plate',
      F: 'ae2:formation_core',
      C: 'electroenergetics:hanging_glass_insulator',
      P: 'productivebees:powered_centrifuge',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('stainless_digital/modular_centrifuge_core'))

    event.shaped('modularbees:modular_export', [
      ' P ',
      'CHC',
      ' S '
    ], {
      P: 'modern_industrialization:stainless_steel_plate',
      C: 'modern_industrialization:conveyor',
      H: 'minecraft:hopper',
      S: 'modularbees:modular_beehive_core'
    }).id(id('stainless_digital/modular_export'))

    event.shaped('modularbees:me_beehive_export', [
      'FIF',
      'PSP',
      ' D '
    ], {
      F: 'ae2:fluix_glass_cable',
      I: '#ae2:interface',
      P: 'modern_industrialization:stainless_steel_plate',
      S: 'modularbees:modular_export',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('stainless_digital/me_beehive_export'))

    event.shaped('modularbees:me_centrifuge_export', [
      'FIF',
      'PSP',
      ' D '
    ], {
      F: 'ae2:fluix_glass_cable',
      I: '#ae2:interface',
      P: 'modern_industrialization:stainless_steel_plate',
      S: 'modularbees:modular_centrifuge_core',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('stainless_digital/me_centrifuge_export'))
  })

  compileFamily('GregTech earned gateway', () => {
    var id = name => `createch2:greg_gateway/${name}`
    var shaped = (output, pattern, keys, name) => event.shaped(output, pattern, keys).id(id(name))

    // Classic GT assemblers are retired. Preserve the native Plascrete bill,
    // output and energy in the existing MI assembler before precision work.
    removeRecipe('gtceu:assembler/plascrete')
    event.custom({
      type: 'modern_industrialization:assembler',
      eu: 48,
      duration: 200,
      item_inputs: [
        { item: 'gtceu:steel_frame', amount: 1 },
        { tag: 'c:plates/polyethylene', amount: 6 }
      ],
      fluid_inputs: { fluid: 'gtceu:concrete', amount: 144 },
      item_outputs: { item: 'gtceu:plascrete', amount: 2 }
    }).id(id('cleanroom/plascrete'))

    // Native research shells must be buildable before the first Assembly Line
    // research. Keep native parts, yields and batch energy in the MI host;
    // the existing shared superconductor replaces specialist GT conductors.
    removeRecipe('gtceu:assembler/computer_casing')
    event.custom({
      type: 'modern_industrialization:assembler', eu: 1024, duration: 6000,
      item_inputs: [
        { item: 'gtceu:iridium_frame', amount: 1 },
        { tag: 'c:plates/iridium', amount: 6 },
        { tag: 'gtceu:circuits/luv', amount: 1 },
        { item: 'gtceu:fine_cobalt_wire', amount: 32 },
        { item: 'gtceu:fine_copper_wire', amount: 32 },
        { item: 'modern_industrialization:superconductor_wire', amount: 2 }
      ],
      item_outputs: { item: 'gtceu:computer_casing', amount: 2 }
    }).id(id('research/computer_casing'))
    removeRecipe('gtceu:assembler/computer_heat_vent')
    event.custom({
      type: 'modern_industrialization:assembler', eu: 960, duration: 200,
      item_inputs: [
        { item: 'gtceu:stainless_steel_frame', amount: 1 },
        { item: 'gtceu:iv_electric_motor', amount: 2 },
        { item: 'gtceu:stainless_steel_rotor', amount: 2 },
        { item: 'gtceu:stainless_steel_tiny_fluid_pipe', amount: 16 },
        { tag: 'c:plates/copper', amount: 16 },
        { item: 'modern_industrialization:superconductor_wire', amount: 1 }
      ],
      item_outputs: { item: 'gtceu:computer_heat_vent', amount: 2 }
    }).id(id('research/computer_heat_vent'))

    // The first useful Greg infrastructure is built entirely by the mature MI,
    // Electro Energetics, AE2 and factory-control stack.
    shaped('4x gtceu:filter_casing', ['TPT', 'PFP', 'TPT'], {
      T: 'modern_industrialization:titanium_plate',
      P: 'modern_industrialization:advanced_pump',
      F: 'modern_industrialization:clean_stainless_steel_machine_casing'
    }, 'cleanroom/filter_casing')

    shaped('8x gtceu:cleanroom_glass', ['GPG', 'PTP', 'GPG'], {
      G: '#c:glass_blocks',
      P: 'modern_industrialization:polyvinyl_chloride_bucket',
      T: 'modern_industrialization:titanium_plate'
    }, 'cleanroom/glass')

    shaped('gtceu:cleanroom', ['FPF', 'PHP', 'FDF'], {
      F: 'gtceu:filter_casing',
      P: 'modern_industrialization:advanced_pump',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      D: 'modern_industrialization:digital_circuit'
    }, 'cleanroom/controller')

    shaped('gtceu:iv_circuit_assembler', ['AEA', 'PHP', 'TDT'], {
      A: 'modern_industrialization:advanced_motor',
      E: 'ae2:engineering_processor',
      P: 'modern_industrialization:advanced_pump',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      T: 'modern_industrialization:titanium_plate',
      D: 'modern_industrialization:digital_circuit'
    }, 'machine/iv_circuit_assembler')

    shaped('gtceu:iv_laser_engraver', ['EPE', 'LHL', 'TDT'], {
      E: 'ae2:engineering_processor',
      P: 'electroenergetics:transformer_core',
      L: 'minecraft:amethyst_shard',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      T: 'modern_industrialization:titanium_plate',
      D: 'modern_industrialization:digital_circuit'
    }, 'machine/iv_laser_engraver')

    shaped('gtceu:iv_scanner', ['SJS', 'PHP', 'TET'], {
      S: 'computercraft:cable',
      J: 'computercraft:computer_advanced',
      P: 'modern_industrialization:advanced_pump',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      T: 'modern_industrialization:titanium_plate',
      E: 'ae2:engineering_processor'
    }, 'machine/iv_scanner')

    shaped('gtceu:iv_1a_energy_converter', ['BHB', 'TCT', 'PEP'], {
      B: 'electroenergetics:sulfur_hexafluoride_breaker',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      T: 'electroenergetics:transformer_core',
      C: 'modern_industrialization:processing_unit',
      P: 'modern_industrialization:platinum_plate',
      E: 'ae2:engineering_processor'
    }, 'energy/iv_1a_bridge')

    shaped('gtceu:iv_energy_input_hatch', ['BCB', 'PHP', 'TET'], {
      B: 'electroenergetics:sulfur_hexafluoride_breaker',
      C: 'modern_industrialization:processing_unit',
      P: 'electroenergetics:transformer_core',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      T: 'modern_industrialization:titanium_plate',
      E: 'electroenergetics:hanging_glass_insulator'
    }, 'multiblock/iv_energy_input_hatch')

    shaped('gtceu:maintenance_hatch', ['TWT', 'AHA', 'TDT'], {
      T: 'modern_industrialization:titanium_plate',
      W: 'tfc_metallurgy:metal/pickaxe/titanium',
      A: 'modern_industrialization:advanced_motor',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      D: 'modern_industrialization:digital_circuit'
    }, 'multiblock/maintenance_hatch')

    ;[
      ['iv_input_bus', 'modern_industrialization:advanced_item_input_hatch'],
      ['iv_output_bus', 'modern_industrialization:advanced_item_output_hatch'],
      ['iv_input_hatch', 'modern_industrialization:advanced_fluid_input_hatch'],
      ['iv_output_hatch', 'modern_industrialization:advanced_fluid_output_hatch']
    ].forEach(([output, core]) => shaped(`gtceu:${output}`, ['TCT', 'PHP', 'TDT'], {
      T: 'modern_industrialization:titanium_plate',
      C: 'electroenergetics:current_transformer',
      P: 'modern_industrialization:advanced_pump',
      H: core,
      D: 'modern_industrialization:digital_circuit'
    }, `multiblock/${output}`))
  })

  compileFamily('Extreme industry convergence', () => {
    var id = name => `createch2:extreme_industry/${name}`

    ;[
      'avaritia:diamond_lattice',
      'avaritia:crystal_matrix_ingot',
      'avaritia:crystal_matrix',
      'avaritia:extreme_crafting_table',
      'avaritia:neutron_collector',
      'avaritia:neutron_compressor'
    ].forEach(recipeId => event.remove({ id: recipeId }))

    removeOutputRecipes([
      'avaritia:diamond_lattice',
      'avaritia:crystal_matrix_ingot',
      'avaritia:crystal_matrix',
      'avaritia:extreme_crafting_table',
      'avaritia:neutron_collector',
      'avaritia:neutron_compressor'
    ])

    event.shaped('avaritia:diamond_lattice', [
      ' D ',
      'DID',
      ' D '
    ], {
      D: '#c:gems/diamond',
      I: 'modern_industrialization:iridium_plate'
    }).id(id('avaritia/diamond_lattice'))

    event.shaped('avaritia:crystal_matrix_ingot', [
      'LPL',
      'NEN',
      'LAL'
    ], {
      L: 'avaritia:diamond_lattice',
      P: 'modern_industrialization:platinum_plate',
      N: 'modern_industrialization:nuclear_alloy_plate',
      E: 'eternal_starlight:crystalborn_catalyst',
      A: 'mekanism:alloy_atomic'
    }).id(id('avaritia/crystal_matrix_ingot'))

    event.shaped('avaritia:crystal_matrix', [
      'III',
      'ASA',
      'III'
    ], {
      I: 'avaritia:crystal_matrix_ingot',
      A: 'modern_industrialization:mixed_plate_nuclear',
      S: 'eternal_starlight:starcore'
    }).id(id('avaritia/crystal_matrix'))

    event.shaped('avaritia:extreme_crafting_table', [
      'CNC',
      'MHM',
      'CRC'
    ], {
      C: 'avaritia:crystal_matrix',
      M: 'tfmg:heavy_machinery_casing',
      N: 'modern_industrialization:nuclear_alloy_plate',
      H: 'rocketnautics:hologram_block',
      R: 'rocketnautics:magnetic_stabilizer'
    }).id(id('avaritia/extreme_crafting_table'))

    // The collector is the Age 14 LuV consumer and an actual Class III project,
    // converging the nuclear, aerospace, Starlight, grid, and precision lines.
    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'avaritia:crystal_matrix' },
      transitional_item: { id: 'avaritia:crystal_matrix' },
      loops: 1,
      sequence: [
        'avaritia:crystal_matrix_ingot',
        'mekanism:pellet_plutonium',
        'eternal_starlight:starcore',
        'mekanismgenerators:fission_fuel_assembly',
        'gtceu:luv_field_generator',
        'rocketnautics:rocket_thruster',
        'crowns:fuel_assembly',
        'mekanism:elite_control_circuit',
        'mekanismgenerators:control_rod_assembly',
        'electroenergetics:sulfur_hexafluoride_breaker',
        'modern_industrialization:nuclear_alloy_large_plate',
        'rocketnautics:magnetic_stabilizer'
      ].map(component => ({
        type: 'create:deploying',
        ingredients: [{ item: 'avaritia:crystal_matrix' }, { item: component }],
        results: [{ id: 'avaritia:crystal_matrix' }]
      })).concat([
        {
          type: 'create:filling',
          ingredients: [
            { item: 'avaritia:crystal_matrix' },
            { type: 'neoforge:single', amount: 500, fluid: 'modern_industrialization:lubricant' }
          ],
          results: [{ id: 'avaritia:crystal_matrix' }]
        },
        {
          type: 'create:pressing',
          ingredients: [{ item: 'avaritia:crystal_matrix' }],
          results: [{ id: 'avaritia:crystal_matrix' }]
        }
      ]),
      results: [{ id: 'avaritia:neutron_collector' }]
    }).id(id('avaritia/neutron_collector'))

    event.shaped('avaritia:neutron_compressor', [
      'CPC',
      'RMR',
      'BEB'
    ], {
      C: 'avaritia:crystal_matrix_ingot',
      P: 'mekanism:pellet_plutonium',
      R: 'mekanismgenerators:control_rod_assembly',
      M: 'mekanism:elite_control_circuit',
      B: 'rocketnautics:booster_thruster',
      E: 'eternal_starlight:crystalborn_catalyst'
    }).id(id('avaritia/neutron_compressor'))
  })

  compileFamily('Resource authority and space-return processing', () => {
    var id = name => `createch2:resource_authority/${name}`

    ;[
      /^rocketnautics:(?:blasting|smelting)\/titanium_ingot_from_.*$/,
      /^rocketnautics:crushing\/(?:deepslate_titanium_ore|raw_titanium|raw_titanium_block|titanium_ore)$/,
      /^rocketnautics:crafting\/materials\/(?:raw_titanium(?:_block)?|titanium_(?:block|ingot|nugget))_from_.*$/,
      /^rocketnautics:splashing\/crushed_raw_titanium$/,
      /^stellaris:misc\/(?:desh_ingot|tharsite_ingot)_from_(?:blasting|smelting)_(?:mars_tharsite_ore|moon_desh_ore|raw_desh_ingot|raw_tharsite)$/
    ].forEach(recipeId => event.remove({ id: recipeId }))

    event.custom({
      type: 'modern_industrialization:macerator',
      eu: 16,
      duration: 400,
      item_inputs: [
        { item: 'stellaris:moon_desh_ore', amount: 1 }
      ],
      item_outputs: [
        { item: 'stellaris:raw_desh_ingot', amount: 2 },
        { item: 'stellaris:ice_shard', amount: 1, probability: 0.15 }
      ]
    }).id(id('stellaris/desh_concentrate_from_moon_ore'))

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 32,
      duration: 1000,
      item_inputs: [
        { item: 'stellaris:raw_desh_ingot', amount: 1 },
        { item: 'tfmg:coal_coke', amount: 1 }
      ],
      item_outputs: [
        { item: 'stellaris:desh_ingot', amount: 1 }
      ]
    }).id(id('stellaris/desh_ingot_from_raw'))

    event.custom({
      type: 'modern_industrialization:macerator',
      eu: 16,
      duration: 400,
      item_inputs: [
        { item: 'stellaris:mars_tharsite_ore', amount: 1 }
      ],
      item_outputs: [
        { item: 'stellaris:raw_tharsite', amount: 2 },
        { item: 'stellaris:ice_shard', amount: 1, probability: 0.15 }
      ]
    }).id(id('stellaris/tharsite_concentrate_from_mars_ore'))

    event.custom({
      type: 'modern_industrialization:blast_furnace',
      eu: 32,
      duration: 1000,
      item_inputs: [
        { item: 'stellaris:raw_tharsite', amount: 1 },
        { item: 'tfmg:coal_coke', amount: 1 }
      ],
      item_outputs: [
        { item: 'stellaris:tharsite_ingot', amount: 1 }
      ]
    }).id(id('stellaris/tharsite_ingot_from_raw'))
  })

  compileFamily('Utility and transport authority', () => {
    var id = path => `createch2:utility_authority/${path}`

    var mekanismCables = [
      'mekanism:basic_universal_cable',
      'mekanism:advanced_universal_cable',
      'mekanism:elite_universal_cable',
      'mekanism:ultimate_universal_cable'
    ]

    removeOutputRecipes(mekanismCables)

    var internalMiCables = [
      'modern_industrialization:tin_cable',
      'modern_industrialization:copper_cable',
      'modern_industrialization:cupronickel_cable',
      'modern_industrialization:electrum_cable',
      'modern_industrialization:silver_cable',
      'modern_industrialization:aluminum_cable',
      'modern_industrialization:kanthal_cable',
      'modern_industrialization:platinum_cable',
      'modern_industrialization:annealed_copper_cable',
      'modern_industrialization:superconductor_cable'
    ]

    var internalMiCableFilters = []
    internalMiCables.forEach(cable => internalMiCableFilters.push(
      { type: 'minecraft:crafting_shaped', output: cable },
      { type: 'minecraft:crafting_shapeless', output: cable }
    ))
    removeRecipe(internalMiCableFilters)

    var modernDynamicsCables = [
      'moderndynamics:lv_cable',
      'moderndynamics:mv_cable',
      'moderndynamics:hv_cable',
      'moderndynamics:ev_cable',
      'moderndynamics:superconductor_cable'
    ]

    removeOutputRecipes(modernDynamicsCables)
    removeRecipe({ id: /^moderndynamics:cable\// })

    var modernDynamicsTransport = [
      'moderndynamics:item_pipe',
      'moderndynamics:fluid_pipe',
      'moderndynamics:extractor',
      'moderndynamics:attractor',
      'moderndynamics:filter',
      'moderndynamics:inhibitor',
      'moderndynamics:machine_extender',
      'moderndynamics:wrench'
    ]
    removeOutputRecipes(modernDynamicsTransport)

















    var miningGadgets = [
      'mininggadgets:mininggadget_simple',
      'mininggadgets:mininggadget_fancy',
      'mininggadgets:mininggadget',
      'mininggadgets:modificationtable'
    ]
    removeOutputRecipes(miningGadgets)

    event.shaped('mininggadgets:mininggadget_simple', ['TDT', 'CBC', 'TUT'], {
      T: 'modern_industrialization:titanium_plate',
      D: 'electroenergetics:converter',
      C: 'modern_industrialization:electronic_circuit',
      B: 'electroenergetics:accumulator',
      U: 'mininggadgets:upgrade_empty'
    }).id(id('mining_gadgets/mk1'))

    event.shaped('mininggadgets:mininggadget_fancy', ['PTP', 'DGD', 'PBP'], {
      P: 'modern_industrialization:platinum_plate',
      T: 'electroenergetics:transformer_core',
      D: 'modern_industrialization:digital_circuit',
      G: 'mininggadgets:mininggadget_simple',
      B: 'electroenergetics:accumulator'
    }).id(id('mining_gadgets/mk2'))

    event.shaped('mininggadgets:mininggadget', ['IHI', 'QGQ', 'ICI'], {
      I: 'modern_industrialization:iridium_plate',
      H: 'electroenergetics:hanging_glass_insulator',
      Q: 'modern_industrialization:quantum_circuit',
      G: 'mininggadgets:mininggadget_fancy',
      C: 'mekanism:ultimate_control_circuit'
    }).id(id('mining_gadgets/mk3'))

    event.shaped('mininggadgets:modificationtable', ['PCP', 'HMH', 'PDP'], {
      P: 'modern_industrialization:titanium_plate',
      C: 'electroenergetics:converter',
      H: 'modern_industrialization:advanced_machine_hull',
      M: 'modern_industrialization:motor',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('mining_gadgets/modification_table'))

    var hardRockDuplicates = [
      'htm:hatchet',
      'htm:flint_knife',
      'htm:bone_knife'
    ]
    removeOutputRecipes(hardRockDuplicates)

  })
  const greate = greateProgression();
  const suppliers = greateSuppliers();
  const facilities = greateIndustry();
  const processes = processFacilities();
  const convergence = convergenceStatic();
  return { ...writer,
    removals: [...writer.removals, ...greate.removals, ...suppliers.removals, ...facilities.removals, ...processes.removals, ...convergence.removals],
    families: [...families, ...greate.families, ...suppliers.families, ...facilities.families, ...processes.families, ...convergence.families],
    recipes: applyAssemblyPressTiers({ ...canonicalizeKineticRecipes(writer.recipes), ...greate.recipes, ...suppliers.recipes, ...facilities.recipes, ...processes.recipes, ...convergence.recipes }) };
}
// Existing First Space instrument prototypes must survive the industrial
// same-output retirement alongside the later compiled Cosmonautics recipes.
export const reviewedCampaignRuntimeOwners = [
  'createch2:circuit_assembler/greg_4096/research/optical_pipe_bootstrap',
  'createch2:research_station/greg_4096/research/gtceu/iv_conveyor_module',
  'createch2:research_station/greg_4096/research/gtceu/iv_robot_arm',
  'createch2:research_station/greg_4096/research/gtceu/iv_sensor',
  'createch2:research_station/greg_4096/research/gtceu/iv_emitter',
  'createch2:research_station/greg_4096/research/gtceu/iv_field_generator',
  'createch2:research_station/greg_4096/research/gtceu/quantum_processor',
  'createch2:research_station/greg_4096/research/gtceu/crystal_soc',
  'createch2:research_station/greg_4096/research/modern_industrialization/processing_unit',
  'createch2:research_station/greg_4096/research/modern_industrialization/quantum_circuit',
  'createch2:research_station/greg_4096/research/rocketnautics/rocket_thruster',
  'createch2:research_station/greg_4096/research/sgjourney/crystallizer',
  'createch2:space_environment_phase2/radiation/geiger_counter_first_space',
  'createch2:space_environment_phase2/radiation/dosimeter_first_space'
];
