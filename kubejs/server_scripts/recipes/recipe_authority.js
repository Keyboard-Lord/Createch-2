// priority: 1900
;(function () {
// Createch 2 recipe authority. Phase order below is the only recipe mutation order.

ServerEvents.recipes(event => {
  var phaseFailures = []
  var pendingRemovalFilters = []
  var committedRemovalFilters = []
  var performanceSettings = JsonIO.read('kubejs/config/createch2_performance.json') || {}
  var compiledRecipeProtection = ids => {
    if (performanceSettings.coalesceExactRecipeIds === true) {
      Java.loadClass('createch2.core.compat.ExactRecipeIdFilter')
      return { createch2_exact_ids: ids }
    }
    var alternatives = []
    for (var offset = 0; offset < ids.length; offset += 64) {
      var escaped = ids.slice(offset, offset + 64).map(id => id.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&'))
      alternatives.push({ id: new RegExp('^(?:' + escaped.join('|') + ')$') })
    }
    return { or: alternatives }
  }
  // Opt-in until the paired Core and a controlled reload have been qualified.
  // Only bare item IDs can share a lookup; all compound/native predicates stay intact.
  var coalesceExactOutputFilters = filters => {
    if (performanceSettings.coalesceExactOutputFilters !== true) return filters
    var ids = [], remaining = []
    filters.forEach(filter => {
      if (filter && Object.keys(filter).length === 1 && typeof filter.output === 'string'
        && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(filter.output)) ids.push(filter.output)
      else remaining.push(filter)
    })
    if (ids.length < 2) return filters
    var ExactItemOutputMatch = Java.loadClass('createch2.core.compat.ExactItemOutputMatch')
    remaining.push({ output: ExactItemOutputMatch.of(ids) })
    console.info(`[Createch 2 Recipes] Coalesced ${ids.length} plain output filters into one reload-local lookup`)
    return remaining
  }
  // KubeJS can resolve exact recipe IDs with a map lookup, but every output,
  // input, or type filter walks the full ~70k-recipe set. Batch OR filters so
  // each authority group performs one walk instead of one walk per item.
  var removeOutputRecipes = (outputs, retainedRecipeId) => {
    outputs.forEach(output => pendingRemovalFilters.push(retainedRecipeId
      ? { output: output, not: { id: retainedRecipeId } }
      : { output: output }))
  }
  var removeRecipe = filter => {
    if (Array.isArray(filter)) filter.forEach(entry => pendingRemovalFilters.push(entry))
    else pendingRemovalFilters.push(filter)
  }
  var flushRemovalFilters = () => {
    pendingRemovalFilters.forEach(filter => committedRemovalFilters.push(filter))
    pendingRemovalFilters = []
  }
  var runPhase = (name, action) => {
    try {
      action()
      flushRemovalFilters()
    } catch (error) {
      pendingRemovalFilters = []
      phaseFailures.push({ name: name, error: error })
      console.error(`[Createch 2 Recipes] ${name} failed: ${error}`)
      if (error && error.stack) console.error(error.stack)
    }
  }

  // Static release recipes: Age foundation and global containment. Source: industrial_progression.mjs.


  runPhase('TFC Metallurgy equipment policy', () => {
    // The Metallum catalogue is retained as a physical material library.
    // Finished equipment is pack-owned only when another live progression
    // recipe assigns it a concrete role. At present that is the tier-6
    // titanium pickaxe used by the late Ultimate Factory bridge.
    var equipmentFamilies = [
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

    var equipmentForms = [
      'tuyere',
      'fish_hook',
      'fishing_rod',
      'pickaxe',
      'pickaxe_head',
      'propick',
      'propick_head',
      'axe',
      'axe_head',
      'shovel',
      'shovel_head',
      'hoe',
      'hoe_head',
      'chisel',
      'chisel_head',
      'hammer',
      'hammer_head',
      'saw',
      'saw_blade',
      'javelin',
      'javelin_head',
      'sword',
      'sword_blade',
      'mace',
      'mace_head',
      'knife',
      'knife_blade',
      'scythe',
      'scythe_blade',
      'shears',
      'unfinished_helmet',
      'helmet',
      'unfinished_chestplate',
      'chestplate',
      'unfinished_greaves',
      'greaves',
      'unfinished_boots',
      'boots',
      'shield'
    ]

    var equipmentOutputs = []
    equipmentFamilies.forEach(family => {
      equipmentForms.forEach(form => {
        if (family === 'titanium' && (form === 'pickaxe' || form === 'pickaxe_head')) {
          return
        }
        equipmentOutputs.push(`tfc_metallurgy:metal/${form}/${family}`)
      })
    })
    removeOutputRecipes(equipmentOutputs)

    // The supported titanium pickaxe remains a smithing reward. Its head must
    // be forged on a tier-appropriate TFC anvil, not cast directly.
    event.remove({
      id: 'tfc_metallurgy:casting/titanium_pickaxe_head'
    })
  })

  runPhase('TFC Metallurgy machine-control handoff', () => {
    // TFC metals and the early industrial overlap remain fully heat/forge
    // aware. Mature and exotic families may still carry native heat and be
    // recycled through their authored molten forms, but their rods, sheets,
    // armor and hardware are no longer produced on a hand anvil or by manual
    // welding. Their canonical MI/GT/Mekanism/Createch machine routes own
    // shaping from this point forward.
    // Generated from createch-dev/scripts/sources/material_authority.json.
    var earlyHandFormed = [
      'andesite_alloy',
      'constantan',
      'electrum',
      'florentine_bronze',
      'invar',
      'lead',
      'nickel_silver',
      'pewter',
      'solder'
    ]
    // Generated from createch-dev/scripts/sources/material_authority.json.
    var machineControlled = [
      'alnico',
      'aluminum',
      'antimony',
      'beryllium',
      'beryllium_copper',
      'blutonium',
      'boron',
      'cobalt',
      'compressed_iron',
      'enderium',
      'ferroboron',
      'graphite',
      'iridium',
      'lithium',
      'lumium',
      'magnesium',
      'magnesite',
      'manganese',
      'mithril',
      'neodymium',
      'osmiridium',
      'osmium',
      'pink_slime',
      'platinum',
      'refined_glowstone',
      'refined_obsidian',
      'signalum',
      'thorium',
      'titanium',
      'tungsten',
      'tungsten_steel',
      'uranium',
      'vanadium',
      'zircaloy',
      'zirconium'
    ]

    var overlap = machineControlled.filter(material => earlyHandFormed.indexOf(material) !== -1)
    if (overlap.length > 0) throw new Error(`Metallurgy handoff overlap: ${overlap.join(', ')}`)

    machineControlled.forEach(material => {
      if (material === 'titanium') {
        // One named late-game smithing reward remains: the tier-6 titanium
        // pickaxe head used by the Ultimate Factory bridge. Titanium itself is
        // still produced and standardized by the high-pressure machine chain.
        removeRecipe({
          id: /^tfc_metallurgy:(?:anvil|welding)\/titanium_(?!pickaxe_head$).*$/
        })
        return
      }
      removeRecipe({
        id: new RegExp(`^tfc_metallurgy:(?:anvil|welding)/${material}_.*$`)
      })
    })
  })

  // BEGIN GENERATED COMPONENT RECYCLING AUTHORITY
  // Shared MI-qualified component bills own recovery; native GT bills do not.
  // Keep assembly uses intact and retire only the parallel recovery processes.
  runPhase('Component recycling authority', () => {
    var components = ["modern_industrialization:bronze_boiler","modern_industrialization:bronze_compressor","modern_industrialization:bronze_macerator","modern_industrialization:bronze_machine_casing","modern_industrialization:bronze_mixer","modern_industrialization:bronze_tank","modern_industrialization:bronze_water_pump","modern_industrialization:steel_machine_casing","modern_industrialization:basic_machine_hull","mekanismgenerators:turbine_casing","mekanismgenerators:turbine_blade","mekanismgenerators:turbine_rotor","mekanismgenerators:electromagnetic_coil","mekanismgenerators:saturating_condenser","crowns:turbine_casing","rocketnautics:titanium_nozzle","rocketnautics:rcs_thruster","rocketnautics:rocket_thruster","rocketnautics:booster_thruster","rocketnautics:vector_thruster","modern_industrialization:frostproof_machine_casing","modern_industrialization:heatproof_machine_casing","crowns:heat_exchanger","tfmg:electric_motor","tfmg:generator","tfmg:copper_spool","tfmg:capacitor_item","tfmg:electric_pump","tfmg:heavy_plate","tfmg:steel_casing","tfmg:steel_mechanism","gtceu:lv_electric_motor","gtceu:lv_electric_pump","gtceu:lv_conveyor_module","gtceu:mv_electric_motor","gtceu:mv_electric_pump","gtceu:mv_conveyor_module","gtceu:hv_electric_motor","gtceu:hv_electric_pump","gtceu:hv_conveyor_module","modern_industrialization:motor","modern_industrialization:pump","modern_industrialization:advanced_motor","modern_industrialization:advanced_pump","modern_industrialization:advanced_machine_casing","modern_industrialization:advanced_machine_hull","modern_industrialization:highly_advanced_machine_hull","modern_industrialization:assembler","modern_industrialization:electric_macerator","modern_industrialization:electric_compressor","modern_industrialization:electric_mixer","modern_industrialization:large_motor","modern_industrialization:large_pump","modern_industrialization:conveyor","modern_industrialization:chemical_reactor","modern_industrialization:electrolyzer","modern_industrialization:distillery","modern_industrialization:electric_cutting_machine","modern_industrialization:electric_wiremill","modern_industrialization:electric_packer","modern_industrialization:centrifuge","modern_industrialization:piston","modern_industrialization:robot_arm","modern_industrialization:electric_furnace","modern_industrialization:electric_unpacker","modern_industrialization:electric_blast_furnace","modern_industrialization:polarizer","modern_industrialization:vacuum_freezer","modern_industrialization:small_heat_exchanger","modern_industrialization:heat_exchanger","modern_industrialization:oil_drilling_rig","modern_industrialization:distillation_tower","modern_industrialization:hv_steam_turbine","modern_industrialization:large_steam_turbine","modern_industrialization:turbo_machine_casing","modern_industrialization:turbo_machine_hull","modern_industrialization:superconductor_coil","gtceu:maintenance_hatch","gtceu:cleanroom","tfmg:pumpjack_base","tfmg:pumpjack_crank","tfmg:pumpjack_hammer","tfmg:pumpjack_hammer_connector","tfmg:pumpjack_hammer_head","modern_industrialization:quantum_machine_casing","modern_industrialization:quantum_machine_hull","modern_industrialization:quantum_upgrade","gtceu:zpm_circuit_assembler","gtceu:zpm_1a_energy_converter","gtceu:uv_1a_energy_converter","gtceu:uv_energy_input_hatch","gtceu:luv_mixer","gtceu:luv_centrifuge","gtceu:luv_autoclave","gtceu:luv_brewery","gtceu:luv_distillery","gtceu:luv_fluid_heater","gtceu:sterilizing_filter_casing","gtceu:iv_circuit_assembler","gtceu:iv_laser_engraver","gtceu:iv_scanner","gtceu:iv_1a_energy_converter","gtceu:iv_energy_input_hatch","gtceu:iv_input_bus","gtceu:iv_output_bus","gtceu:iv_input_hatch","gtceu:iv_output_hatch","gtceu:hpca_active_cooler_component","gtceu:hpca_advanced_computation_component","gtceu:hpca_bridge_component","gtceu:network_switch","gtceu:normal_optical_pipe","greate:neutronium_cogwheel","greate:neutronium_crushing_wheel","greate:neutronium_encased_fan","greate:neutronium_gearbox","greate:large_neutronium_cogwheel","greate:neutronium_mechanical_mixer","greate:neutronium_mechanical_press","greate:neutronium_mechanical_pump","greate:neutronium_mechanical_saw","greate:neutronium_millstone","greate:neutronium_shaft","greate:neutronium_vertical_gearbox","greate:darmstadtium_cogwheel","greate:darmstadtium_crushing_wheel","greate:darmstadtium_encased_fan","greate:darmstadtium_gearbox","greate:large_darmstadtium_cogwheel","greate:darmstadtium_mechanical_mixer","greate:darmstadtium_mechanical_press","greate:darmstadtium_mechanical_pump","greate:darmstadtium_mechanical_saw","greate:darmstadtium_millstone","greate:darmstadtium_shaft","greate:darmstadtium_vertical_gearbox","greate:rhodium_plated_palladium_cogwheel","greate:rhodium_plated_palladium_crushing_wheel","greate:rhodium_plated_palladium_encased_fan","greate:rhodium_plated_palladium_gearbox","greate:large_rhodium_plated_palladium_cogwheel","greate:rhodium_plated_palladium_mechanical_mixer","greate:rhodium_plated_palladium_mechanical_press","greate:rhodium_plated_palladium_mechanical_pump","greate:rhodium_plated_palladium_mechanical_saw","greate:rhodium_plated_palladium_millstone","greate:rhodium_plated_palladium_shaft","greate:rhodium_plated_palladium_vertical_gearbox","greate:naquadah_alloy_cogwheel","greate:naquadah_alloy_crushing_wheel","greate:naquadah_alloy_encased_fan","greate:naquadah_alloy_gearbox","greate:large_naquadah_alloy_cogwheel","greate:naquadah_alloy_mechanical_mixer","greate:naquadah_alloy_mechanical_press","greate:naquadah_alloy_mechanical_pump","greate:naquadah_alloy_mechanical_saw","greate:naquadah_alloy_millstone","greate:naquadah_alloy_shaft","greate:naquadah_alloy_vertical_gearbox","greate:aluminium_cogwheel","greate:aluminium_crushing_wheel","greate:aluminium_encased_fan","greate:aluminium_gearbox","greate:large_aluminium_cogwheel","greate:aluminium_mechanical_mixer","greate:aluminium_mechanical_press","greate:aluminium_mechanical_pump","greate:aluminium_mechanical_saw","greate:aluminium_millstone","greate:aluminium_shaft","greate:aluminium_vertical_gearbox","greate:titanium_cogwheel","greate:titanium_crushing_wheel","greate:titanium_encased_fan","greate:titanium_gearbox","greate:large_titanium_cogwheel","greate:titanium_mechanical_mixer","greate:titanium_mechanical_press","greate:titanium_mechanical_pump","greate:titanium_mechanical_saw","greate:titanium_millstone","greate:titanium_shaft","greate:titanium_vertical_gearbox","greate:steel_cogwheel","greate:steel_crushing_wheel","greate:steel_encased_fan","greate:steel_gearbox","greate:large_steel_cogwheel","greate:steel_mechanical_mixer","greate:steel_mechanical_press","greate:steel_mechanical_pump","greate:steel_mechanical_saw","greate:steel_millstone","greate:steel_shaft","greate:steel_vertical_gearbox","greate:stainless_steel_cogwheel","greate:stainless_steel_crushing_wheel","greate:stainless_steel_encased_fan","greate:stainless_steel_gearbox","greate:large_stainless_steel_cogwheel","greate:stainless_steel_mechanical_mixer","greate:stainless_steel_mechanical_press","greate:stainless_steel_mechanical_pump","greate:stainless_steel_mechanical_saw","greate:stainless_steel_millstone","greate:stainless_steel_shaft","greate:stainless_steel_vertical_gearbox","greate:tungsten_steel_cogwheel","greate:tungsten_steel_crushing_wheel","greate:tungsten_steel_encased_fan","greate:tungsten_steel_gearbox","greate:large_tungsten_steel_cogwheel","greate:tungsten_steel_mechanical_mixer","greate:tungsten_steel_mechanical_press","greate:tungsten_steel_mechanical_pump","greate:tungsten_steel_mechanical_saw","greate:tungsten_steel_millstone","greate:tungsten_steel_shaft","greate:tungsten_steel_vertical_gearbox"]
    components.forEach(item => {
      event.remove({ input: item, or: [{"type":"gtceu:macerator"},{"type":"gtceu:arc_furnace"},{"type":"gtceu:extractor"}] })
    })
  })
  // END GENERATED COMPONENT RECYCLING AUTHORITY

  runPhase('GregTech containment', () => {
    // GregTech contributes material forms and precision components before LuV,
    // but its parallel ULV-IV machine/power ladder remains contained. The
    // Createch-owned IV bridge and LuV gateway are authored later in this file.
    // Component outputs are intentionally excluded from the tiered-machine deny.
    removeOutputRecipes([/^gtceu:(?:ulv|lv|mv|hv|ev|iv)_(?!(?:electric_motor|electric_pump|electric_piston|conveyor_module|robot_arm|sensor|emitter|field_generator|diode)$).+$/])

    removeOutputRecipes([
      /^gtceu:(?:lp|hp)_steam_.+$/,
      /^gtceu:(?:bronze|steel)_large_boiler$/,
      /^gtceu:(?:primitive_blast_furnace|coke_oven|charcoal_pile_igniter)$/,
      /^gtceu:(?:electric_blast_furnace|multi_smelter|implosion_compressor)$/,
      /^gtceu:(?:large_(?:combustion_engine|steam_turbine|gas_turbine|plasma_turbine)|extreme_combustion_engine)$/,
      /^gtceu:(?:steam|gas|plasma)_large_turbine$/
    ])
  })

  // Static release recipes: TFC geology — worldgen containment. Source: industrial_progression.mjs.


  // Static release recipes: TFC geology — ore processing. Source: industrial_progression.mjs.


  // Static release recipes: Core balance and compatibility. Source: industrial_progression.mjs.


  // Static release recipes: Fluid compatibility. Source: industrial_progression.mjs.


  // Static release recipes: Quality-of-life integration. Source: industrial_progression.mjs.


  // Static release recipes: Age 0 — Stone. Source: industrial_progression.mjs.


  // Static release recipes: Age 1 — Copper. Source: industrial_progression.mjs.


  // Static release recipes: Age 3 — Bronze Steam — Rubber Plantation. Source: industrial_progression.mjs.


  // Static release recipes: Age 4 — Heavy Industry. Source: industrial_progression.mjs.


  // Static release recipes: Steel Steam literal routes; see convergence_static.mjs.
  runPhase('Retired blast-furnace stock recovery', () => {
    // Retired addon holders have no acquisition route. Recover the original
    // three wrought-iron sheets; an insulated block also returns its brick
    // block as the native crafting remainder. Never alias three sheets to one.
    event.shapeless(Item.of('tfc:metal/sheet/wrought_iron', 3), [
      'kubejs:retired_blast_furnace_insulation'
    ]).id('createch2:migration/blast_furnace/recover_insulation')
    event.shapeless(Item.of('tfc:metal/sheet/wrought_iron', 3), [
      'kubejs:retired_insulated_fire_bricks'
    ]).replaceIngredient('kubejs:retired_insulated_fire_bricks', 'tfc:fire_bricks')
      .id('createch2:migration/blast_furnace/recover_insulated_bricks')

  })

  // Static release recipes: Age 6 — Low Voltage. Source: industrial_progression.mjs.


  // Static release recipes: Age 7 — First Space. Source: industrial_progression.mjs.


  // Static release recipes: Age 8 — Advanced Electric. Source: industrial_progression.mjs.


  // Static release recipes: Age 9 — Chemical. Source: industrial_progression.mjs.


  // Static release recipes: Age 9 — Arcane Chemistry. Source: industrial_progression.mjs.


  // Static release recipes: Age 10 — Stainless and Digital. Source: industrial_progression.mjs.


  // Static release recipes: Age 10 — GregTech shared component vocabulary. Source: industrial_progression.mjs.


  // Static release recipes: Aeronautics stage 1 — experimental physical construction. Source: industrial_progression.mjs.


  // Static release recipes: Aeronautics stage 2 — industrial propulsion and freight hardware. Source: industrial_progression.mjs.


  // Static release recipes: Aeronautics stage 3 — stabilization and digital flight control. Source: industrial_progression.mjs.


  // Static release recipes: Aeronautics stage 4 — autonomous air logistics. Source: industrial_progression.mjs.


  // Static release recipes: Bee progression. Source: industrial_progression.mjs.


  // Static release recipes: Age 11 — High Pressure. Source: industrial_progression.mjs.


  // Static release recipes: Age 12 — PGM and Cosmonautics foundation. Source: industrial_progression.mjs.


  // Static release recipes: Age 12 — Cosmonautics. Source: industrial_progression.mjs.


  // Static release recipes: Age 13 — Nuclear. Source: industrial_progression.mjs.


  runPhase('Integrated supernatural and resource systems', () => {
    var id = name => `createch2:systems/${name}`
    var removeOutputs = outputs => removeOutputRecipes(outputs)

    // Compatibility content from the retired Gobber/Minium pair is intentionally
    // inert in the exact-340 build. Keeping the old integration behind a loader
    // guard preserves upgrade compatibility without asking KubeJS to resolve
    // hundreds of items that are not registered in this release.
    if (Platform.isLoaded('gobber2') && Platform.isLoaded('miniumstone')) {
    var gobberTieredParts = [
      'axe',
      'block',
      'boots',
      'bow',
      'chestplate',
      'excavator',
      'foo',
      'glass',
      'glob',
      'globette',
      'hammer',
      'helmet',
      'hoe',
      'ingot',
      'leggings',
      'medallion',
      'paxel',
      'pickaxe',
      'ring',
      'rod',
      'shovel',
      'sword',
      'tree_axe'
    ]
    var gobberTierSuffixes = ['', '_nether', '_end']
    var gobberSpecialOutputs = [
      'gobber2:gobber2_boots_dragon',
      'gobber2:gobber2_chestplate_dragon',
      'gobber2:gobber2_goo',
      'gobber2:gobber2_goo_nether',
      'gobber2:gobber2_gooey_apple',
      'gobber2:gobber2_gooey_apple_nether',
      'gobber2:gobber2_gooey_beef',
      'gobber2:gobber2_gooey_beef_nether',
      'gobber2:gobber2_gooey_beefstew',
      'gobber2:gobber2_gooey_beefstew_nether',
      'gobber2:gobber2_gooey_bread',
      'gobber2:gobber2_gooey_bread_nether',
      'gobber2:gobber2_helmet_dragon',
      'gobber2:gobber2_leggings_dragon',
      'gobber2:gobber2_links_end',
      'gobber2:gobber2_medallion_breathing',
      'gobber2:gobber2_medallion_exp',
      'gobber2:gobber2_medallion_healing',
      'gobber2:gobber2_medallion_healing2',
      'gobber2:gobber2_medallion_healing3',
      'gobber2:gobber2_medallion_hero',
      'gobber2:gobber2_medallion_sea',
      'gobber2:gobber2_medallion_shielding',
      'gobber2:gobber2_medallion_suffering',
      'gobber2:gobber2_paxel_stars',
      'gobber2:gobber2_ring_above',
      'gobber2:gobber2_ring_airwalking',
      'gobber2:gobber2_ring_ascent',
      'gobber2:gobber2_ring_attraction',
      'gobber2:gobber2_ring_blink',
      'gobber2:gobber2_ring_curing',
      'gobber2:gobber2_ring_dismissal',
      'gobber2:gobber2_ring_enderchest',
      'gobber2:gobber2_ring_explorer',
      'gobber2:gobber2_ring_farmer',
      'gobber2:gobber2_ring_haste',
      'gobber2:gobber2_ring_luck',
      'gobber2:gobber2_ring_miner',
      'gobber2:gobber2_ring_phoenix',
      'gobber2:gobber2_ring_repair',
      'gobber2:gobber2_ring_return',
      'gobber2:gobber2_ring_stealth',
      'gobber2:gobber2_ring_strength',
      'gobber2:gobber2_ring_sunshine',
      'gobber2:gobber2_ring_swiftness',
      'gobber2:gobber2_ring_teleport',
      'gobber2:gobber2_ring_traveler',
      'gobber2:gobber2_ring_vision',
      'gobber2:gobber2_ring_void',
      'gobber2:gobber2_staff_clearing',
      'gobber2:gobber2_staff_ensnarement',
      'gobber2:gobber2_staff_farmer',
      'gobber2:gobber2_staff_hostile_ensnarement',
      'gobber2:gobber2_staff_nature',
      'gobber2:gobber2_staff_sniper',
      'gobber2:gobber2_staff_sound',
      'gobber2:gobber2_staff_stars',
      'gobber2:gobber2_staff_transformation',
      'gobber2:gobber2_sword_sniper',
      'gobber2:gobber2_sword_traveler',
      'gobber2:dragon_elytra',
      'gobber2:dragon_star'
    ]
    var gobberOutputs = gobberSpecialOutputs.slice()
    gobberTierSuffixes.forEach(suffix => {
      gobberTieredParts.forEach(part => gobberOutputs.push(`gobber2:gobber2_${part}${suffix}`))
    })
    removeOutputs(gobberOutputs)

    var gobberTiers = [
      {
        key: 'base',
        suffix: '',
        ingot: 'gobber2:gobber2_ingot',
        rod: 'gobber2:gobber2_rod',
        glob: 'gobber2:gobber2_glob',
        ring: 'gobber2:gobber2_ring',
        medallion: 'gobber2:gobber2_medallion',
        core: '#createch2:malum_forbidden_containment',
        plate: 'modern_industrialization:stainless_steel_plate'
      },
      {
        key: 'nether',
        suffix: '_nether',
        ingot: 'gobber2:gobber2_ingot_nether',
        rod: 'gobber2:gobber2_rod_nether',
        glob: 'gobber2:gobber2_glob_nether',
        ring: 'gobber2:gobber2_ring_nether',
        medallion: 'gobber2:gobber2_medallion_nether',
        core: '#createch2:malum_forbidden_containment',
        plate: 'modern_industrialization:titanium_plate'
      },
      {
        key: 'end',
        suffix: '_end',
        ingot: 'gobber2:gobber2_ingot_end',
        rod: 'gobber2:gobber2_rod_end',
        glob: 'gobber2:gobber2_glob_end',
        ring: 'gobber2:gobber2_ring_end',
        medallion: 'gobber2:gobber2_medallion_end',
        core: '#createch2:malum_reality_engineering',
        plate: 'modern_industrialization:nuclear_alloy_plate'
      }
    ]

    event.shaped('gobber2:gobber2_glob', [
      'SDS',
      'CMC',
      'SPS'
    ], {
      S: 'malum:refined_soulstone',
      D: 'evilcraft:dark_gem',
      C: 'modern_industrialization:digital_circuit',
      M: '#createch2:malum_forbidden_containment',
      P: 'modern_industrialization:stainless_steel_plate'
    }).id(id('gobber/glob'))

    event.shaped('gobber2:gobber2_glob_nether', [
      'BGB',
      'TMT',
      'HNH'
    ], {
      B: 'minecraft:blaze_rod',
      G: 'gobber2:gobber2_glob',
      T: 'modern_industrialization:titanium_plate',
      M: '#createch2:malum_forbidden_containment',
      H: 'evilcraft:hardened_blood',
      N: 'minecraft:netherite_scrap'
    }).id(id('gobber/glob_nether'))

    event.shaped('gobber2:gobber2_glob_end', [
      'DND',
      'RMR',
      'TST'
    ], {
      D: 'minecraft:dragon_breath',
      N: 'gobber2:gobber2_glob_nether',
      R: '#createch2:malum_reality_engineering',
      M: 'rocketnautics:rocket_thruster',
      T: 'eternal_starlight:crystalborn_catalyst',
      S: 'eternal_starlight:starcore'
    }).id(id('gobber/glob_end'))

    gobberTiers.forEach(tier => {
      event.shaped(Item.of(tier.ingot, 2), [
        'PMP',
        'GGG',
        'PMP'
      ], {
        P: tier.plate,
        M: tier.core,
        G: tier.glob
      }).id(id(`gobber/${tier.key}/ingot`))

      event.shapeless(Item.of(`gobber2:gobber2_globette${tier.suffix}`, 4), [
        tier.glob,
        'minecraft:honeycomb'
      ]).id(id(`gobber/${tier.key}/globette`))

      event.shaped(Item.of(`gobber2:gobber2_block${tier.suffix}`, 1), [
        'III',
        'III',
        'III'
      ], {
        I: tier.ingot
      }).id(id(`gobber/${tier.key}/block`))

      event.shaped(Item.of(tier.rod, 2), [
        'I',
        'M',
        'I'
      ], {
        I: tier.ingot,
        M: tier.core
      }).id(id(`gobber/${tier.key}/rod`))

      event.shaped(tier.ring, [
        ' I ',
        'IMI',
        ' I '
      ], {
        I: tier.ingot,
        M: tier.core
      }).id(id(`gobber/${tier.key}/ring`))

      event.shaped(tier.medallion, [
        ' R ',
        'IMI',
        ' I '
      ], {
        R: tier.rod,
        I: tier.ingot,
        M: tier.core
      }).id(id(`gobber/${tier.key}/medallion`))

      event.shaped(Item.of(`gobber2:gobber2_glass${tier.suffix}`, 4), [
        'GGG',
        'GIG',
        'GGG'
      ], {
        G: 'minecraft:glass',
        I: tier.ingot
      }).id(id(`gobber/${tier.key}/glass`))

      event.shapeless(`gobber2:gobber2_foo${tier.suffix}`, [
        tier.glob,
        tier.key === 'base' ? 'minecraft:charcoal' : tier.key === 'nether' ? 'minecraft:blaze_powder' : 'minecraft:chorus_fruit'
      ]).id(id(`gobber/${tier.key}/foo`))
    })

    var gobberToolShapes = [
      ['sword', [' I ', ' I ', ' R ']],
      ['pickaxe', ['III', ' R ', ' R ']],
      ['axe', ['II ', 'IR ', ' R ']],
      ['shovel', [' I ', ' R ', ' R ']],
      ['hoe', ['II ', ' R ', ' R ']],
      ['hammer', ['III', 'IRI', ' R ']],
      ['excavator', ['III', 'IRI', ' I ']],
      ['tree_axe', ['IAI', 'IRI', ' R ']]
    ]
    gobberTiers.forEach(tier => {
      gobberToolShapes.forEach(([tool, pattern]) => {
        var keys = {
          I: tier.ingot,
          R: tier.rod
        }
        if (tool === 'tree_axe') {
          keys.A = `gobber2:gobber2_axe${tier.suffix}`
        }
        event.shaped(`gobber2:gobber2_${tool}${tier.suffix}`, pattern, keys)
          .id(id(`gobber/${tier.key}/${tool}`))
      })

      event.shaped(`gobber2:gobber2_paxel${tier.suffix}`, [
        'APS',
        ' R ',
        ' R '
      ], {
        A: `gobber2:gobber2_axe${tier.suffix}`,
        P: `gobber2:gobber2_pickaxe${tier.suffix}`,
        S: `gobber2:gobber2_shovel${tier.suffix}`,
        R: tier.rod
      }).id(id(`gobber/${tier.key}/paxel`))

      event.shaped(`gobber2:gobber2_bow${tier.suffix}`, [
        ' IR',
        'I R',
        ' IR'
      ], {
        I: tier.ingot,
        R: 'minecraft:string'
      }).id(id(`gobber/${tier.key}/bow`))

      event.shaped(`gobber2:gobber2_helmet${tier.suffix}`, [
        'III',
        'I I'
      ], { I: tier.ingot }).id(id(`gobber/${tier.key}/helmet`))
      event.shaped(`gobber2:gobber2_chestplate${tier.suffix}`, [
        'I I',
        'III',
        'III'
      ], { I: tier.ingot }).id(id(`gobber/${tier.key}/chestplate`))
      event.shaped(`gobber2:gobber2_leggings${tier.suffix}`, [
        'III',
        'I I',
        'I I'
      ], { I: tier.ingot }).id(id(`gobber/${tier.key}/leggings`))
      event.shaped(`gobber2:gobber2_boots${tier.suffix}`, [
        'I I',
        'I I'
      ], { I: tier.ingot }).id(id(`gobber/${tier.key}/boots`))
    })

    ;[
      ['gobber2:gobber2_goo', 'gobber2:gobber2_glob', 'the_bumblezone:royal_jelly_bottle'],
      ['gobber2:gobber2_goo_nether', 'gobber2:gobber2_glob_nether', 'evilcraft:hardened_blood']
    ].forEach(([output, glob, catalyst]) => {
      event.shapeless(output, [
        glob,
        catalyst,
        'minecraft:honey_bottle',
        '#createch2:malum_forbidden_containment'
      ]).id(id(`gobber/${output.replace(/^gobber2:/, '')}`))
    })

    ;[
      ['gobber2:gobber2_gooey_apple', 'gobber2:gobber2_goo', '#createch2:food/apples'],
      ['gobber2:gobber2_gooey_bread', 'gobber2:gobber2_goo', '#createch2:food/breads'],
      ['gobber2:gobber2_gooey_beef', 'gobber2:gobber2_goo', '#createch2:food/cooked_beef'],
      ['gobber2:gobber2_gooey_beefstew', 'gobber2:gobber2_goo', '#createch2:food/protein_soups'],
      ['gobber2:gobber2_gooey_apple_nether', 'gobber2:gobber2_goo_nether', '#createch2:food/apples'],
      ['gobber2:gobber2_gooey_bread_nether', 'gobber2:gobber2_goo_nether', '#createch2:food/breads'],
      ['gobber2:gobber2_gooey_beef_nether', 'gobber2:gobber2_goo_nether', '#createch2:food/cooked_beef'],
      ['gobber2:gobber2_gooey_beefstew_nether', 'gobber2:gobber2_goo_nether', '#createch2:food/protein_soups']
    ].forEach(([output, goo, food]) => {
      event.shapeless(output, [goo, food]).id(id(`gobber/food/${output.replace(/^gobber2:gobber2_/, '')}`))
    })

    var ringUpgrades = [
      ['gobber2:gobber2_ring_above', 'minecraft:phantom_membrane'],
      ['gobber2:gobber2_ring_airwalking', 'enchanted:flying_ointment'],
      ['gobber2:gobber2_ring_ascent', 'rocketnautics:jetpack'],
      ['gobber2:gobber2_ring_attraction', 'minecraft:ender_pearl'],
      ['gobber2:gobber2_ring_blink', 'minecraft:ender_eye'],
      ['gobber2:gobber2_ring_curing', 'enchanted:purified_milk'],
      ['gobber2:gobber2_ring_dismissal', 'malum:refined_soulstone'],
      ['gobber2:gobber2_ring_enderchest', 'minecraft:ender_chest'],
      ['gobber2:gobber2_ring_explorer', 'create_radar:radar_goggles'],
      ['gobber2:gobber2_ring_farmer', 'enchanted:mutandis'],
      ['gobber2:gobber2_ring_haste', 'modern_industrialization:advanced_motor'],
      ['gobber2:gobber2_ring_luck', 'minecraft:rabbit_foot'],
      ['gobber2:gobber2_ring_miner', 'modern_industrialization:stainless_steel_drill'],
      ['gobber2:gobber2_ring_phoenix', 'minecraft:totem_of_undying'],
      ['gobber2:gobber2_ring_repair', 'minecraft:anvil'],
      ['gobber2:gobber2_ring_return', 'travelanchors:travel_anchor'],
      ['gobber2:gobber2_ring_stealth', 'enchanted:attuned_stone'],
      ['gobber2:gobber2_ring_strength', 'minecraft:blaze_powder'],
      ['gobber2:gobber2_ring_sunshine', 'minecraft:daylight_detector'],
      ['gobber2:gobber2_ring_swiftness', 'minecraft:sugar'],
      ['gobber2:gobber2_ring_teleport', 'sgjourney:classic_stargate'],
      ['gobber2:gobber2_ring_traveler', 'rocketnautics:magnetic_stabilizer'],
      ['gobber2:gobber2_ring_vision', 'mekanism:geiger_counter'],
      ['gobber2:gobber2_ring_void', 'minecraft:echo_shard']
    ]
    ringUpgrades.forEach(([output, catalyst]) => {
      event.shaped(output, [
        'ACA',
        'RBR',
        'ACA'
      ], {
        A: 'gobber2:gobber2_ingot',
        C: catalyst,
        R: 'gobber2:gobber2_ring',
        B: '#createch2:malum_forbidden_containment'
      }).id(id(`gobber/rings/${output.replace(/^gobber2:gobber2_ring_/, '')}`))
    })

    var medallionUpgrades = [
      ['gobber2:gobber2_medallion_breathing', 'stellaris:big_oxygen_tank'],
      ['gobber2:gobber2_medallion_exp', 'minecraft:experience_bottle'],
      ['gobber2:gobber2_medallion_healing', 'enchanted:purified_milk'],
      ['gobber2:gobber2_medallion_healing2', 'the_bumblezone:royal_jelly_bottle'],
      ['gobber2:gobber2_medallion_healing3', 'minecraft:enchanted_golden_apple'],
      ['gobber2:gobber2_medallion_hero', 'minecraft:nether_star'],
      ['gobber2:gobber2_medallion_sea', 'minecraft:heart_of_the_sea'],
      ['gobber2:gobber2_medallion_shielding', 'mekanism:module_radiation_shielding_unit'],
      ['gobber2:gobber2_medallion_suffering', 'evilcraft:vengeance_essence']
    ]
    medallionUpgrades.forEach(([output, catalyst]) => {
      event.shaped(output, [
        'ACA',
        'MBM',
        'ACA'
      ], {
        A: 'gobber2:gobber2_ingot_nether',
        C: catalyst,
        M: 'gobber2:gobber2_medallion_nether',
        B: '#createch2:malum_forbidden_containment'
      }).id(id(`gobber/medallions/${output.replace(/^gobber2:gobber2_medallion_/, '')}`))
    })

    var staffUpgrades = [
      ['gobber2:gobber2_staff_clearing', 'enchanted:mutandis'],
      ['gobber2:gobber2_staff_ensnarement', 'minecraft:lead'],
      ['gobber2:gobber2_staff_farmer', 'the_bumblezone:pile_of_pollen'],
      ['gobber2:gobber2_staff_hostile_ensnarement', 'evilcraft:vengeance_essence'],
      ['gobber2:gobber2_staff_nature', 'enchanted:mutandis_extremis'],
      ['gobber2:gobber2_staff_sniper', 'create_radar:fire_controller'],
      ['gobber2:gobber2_staff_sound', 'minecraft:sculk_sensor'],
      ['gobber2:gobber2_staff_stars', 'eternal_starlight:starcore'],
      ['gobber2:gobber2_staff_transformation', 'miniumstone:minium_stone']
    ]
    staffUpgrades.forEach(([output, catalyst]) => {
      event.shaped(output, [
        ' C ',
        ' R ',
        ' M '
      ], {
        C: catalyst,
        R: 'gobber2:gobber2_rod_end',
        M: '#createch2:malum_reality_engineering'
      }).id(id(`gobber/staffs/${output.replace(/^gobber2:gobber2_staff_/, '')}`))
    })

    event.shaped('gobber2:gobber2_sword_sniper', [
      ' F ',
      ' E ',
      ' S '
    ], {
      F: 'create_radar:fire_controller',
      E: 'gobber2:gobber2_sword_end',
      S: '#createch2:malum_reality_engineering'
    }).id(id('gobber/sword_sniper'))

    event.shaped('gobber2:gobber2_sword_traveler', [
      ' M ',
      ' E ',
      ' S '
    ], {
      M: 'rocketnautics:magnetic_stabilizer',
      E: 'gobber2:gobber2_sword_end',
      S: '#createch2:malum_reality_engineering'
    }).id(id('gobber/sword_traveler'))

    event.shaped('gobber2:gobber2_paxel_stars', [
      ' S ',
      ' P ',
      ' D '
    ], {
      S: 'gobber2:gobber2_staff_stars',
      P: 'gobber2:gobber2_paxel_end',
      D: 'gobber2:dragon_star'
    }).id(id('gobber/paxel_stars'))

    event.shaped('gobber2:gobber2_links_end', [
      'RDR',
      'RER',
      'RDR'
    ], {
      R: 'gobber2:gobber2_rod_end',
      D: 'minecraft:dragon_breath',
      E: 'gobber2:gobber2_ring_end'
    }).id(id('gobber/links_end'))

    event.shaped('gobber2:dragon_star', [
      'DAD',
      'RBR',
      'DCD'
    ], {
      D: 'minecraft:dragon_breath',
      A: 'minecraft:dragon_head',
      R: '#createch2:malum_reality_engineering',
      B: 'minecraft:nether_star',
      C: 'gobber2:gobber2_ingot_end'
    }).id(id('gobber/dragon_star'))

    event.shaped('gobber2:dragon_elytra', [
      'DAD',
      'RBR',
      'DCD'
    ], {
      D: 'minecraft:dragon_breath',
      A: 'minecraft:dragon_head',
      R: '#createch2:malum_reality_engineering',
      B: 'minecraft:elytra',
      C: 'gobber2:gobber2_ingot_end'
    }).id(id('gobber/dragon_elytra'))

    ;['helmet', 'chestplate', 'leggings', 'boots'].forEach(piece => {
      event.shaped(`gobber2:gobber2_${piece}_dragon`, [
        'SDS',
        'AEA',
        'SDS'
      ], {
        S: '#createch2:malum_reality_engineering',
        D: 'gobber2:dragon_star',
        A: 'minecraft:netherite_ingot',
        E: `gobber2:gobber2_${piece}_end`
      }).id(id(`gobber/dragon_armor/${piece}`))
    })

    removeOutputs([
      'gobberdelight:gobber_knife',
      'gobberdelight:nether_gobber_knife',
      'gobberdelight:ender_gobber_knife'
    ])
    ;[
      ['gobberdelight:gobber_knife', 'gobber2:gobber2_ingot', 'gobber2:gobber2_rod'],
      ['gobberdelight:nether_gobber_knife', 'gobber2:gobber2_ingot_nether', 'gobber2:gobber2_rod_nether'],
      ['gobberdelight:ender_gobber_knife', 'gobber2:gobber2_ingot_end', 'gobber2:gobber2_rod_end']
    ].forEach(([output, ingot, rod]) => {
      event.shaped(output, ['I', 'R'], { I: ingot, R: rod }).id(id(`gobberdelight/${output.replace(/^gobberdelight:/, '')}`))
    })

    removeRecipe({ type: 'miniumstone:transmutation_crafting' })
    removeRecipe({ type: 'miniumstone:transmutation_in_world' })
    removeOutputs([
      'miniumstone:minium_shard',
      'miniumstone:minium_stone'
    ])

    event.shaped('miniumstone:minium_shard', [
      'AMA',
      'SRS',
      'ACA'
    ], {
      A: 'minecraft:amethyst_shard',
      M: '#createch2:malum_reality_engineering',
      S: 'modern_industrialization:singularity',
      R: 'eternal_starlight:crystalborn_catalyst',
      C: 'modern_industrialization:quantum_circuit'
    }).id(id('minium/shard_reality_engineering'))

    event.shaped('miniumstone:minium_stone', [
      'SMS',
      'RCR',
      'SES'
    ], {
      S: 'miniumstone:minium_shard',
      M: '#createch2:malum_reality_engineering',
      R: 'modern_industrialization:singularity',
      C: 'modern_industrialization:quantum_machine_casing',
      E: 'minecraft:ender_eye'
    }).id(id('minium/stone_reality_engineering'))

    var transmutation = (name, input, output, count) => {
      event.custom({
        type: 'miniumstone:transmutation_crafting',
        category: 'misc',
        ingredients: [{ item: input }],
        result: { count: count || 1, id: output }
      }).id(id(`minium/transmutation/${name}`))
    }
    ;[
      ['oak_to_birch_log', 'minecraft:oak_log', 'minecraft:birch_log'],
      ['birch_to_spruce_log', 'minecraft:birch_log', 'minecraft:spruce_log'],
      ['spruce_to_jungle_log', 'minecraft:spruce_log', 'minecraft:jungle_log'],
      ['jungle_to_acacia_log', 'minecraft:jungle_log', 'minecraft:acacia_log'],
      ['acacia_to_dark_oak_log', 'minecraft:acacia_log', 'minecraft:dark_oak_log'],
      ['dark_oak_to_mangrove_log', 'minecraft:dark_oak_log', 'minecraft:mangrove_log'],
      ['mangrove_to_oak_log', 'minecraft:mangrove_log', 'minecraft:oak_log'],
      ['oak_to_birch_planks', 'minecraft:oak_planks', 'minecraft:birch_planks'],
      ['birch_to_spruce_planks', 'minecraft:birch_planks', 'minecraft:spruce_planks'],
      ['spruce_to_jungle_planks', 'minecraft:spruce_planks', 'minecraft:jungle_planks'],
      ['jungle_to_acacia_planks', 'minecraft:jungle_planks', 'minecraft:acacia_planks'],
      ['acacia_to_dark_oak_planks', 'minecraft:acacia_planks', 'minecraft:dark_oak_planks'],
      ['dark_oak_to_mangrove_planks', 'minecraft:dark_oak_planks', 'minecraft:mangrove_planks'],
      ['mangrove_to_oak_planks', 'minecraft:mangrove_planks', 'minecraft:oak_planks'],
      ['stone_to_cobblestone', 'minecraft:stone', 'minecraft:cobblestone'],
      ['cobblestone_to_stone', 'minecraft:cobblestone', 'minecraft:stone'],
      ['sand_to_red_sand', 'minecraft:sand', 'minecraft:red_sand'],
      ['red_sand_to_sand', 'minecraft:red_sand', 'minecraft:sand'],
      ['sandstone_to_red_sandstone', 'minecraft:sandstone', 'minecraft:red_sandstone'],
      ['red_sandstone_to_sandstone', 'minecraft:red_sandstone', 'minecraft:sandstone'],
      ['terracotta_to_white', 'minecraft:terracotta', 'minecraft:white_terracotta'],
      ['white_wool_to_black_wool', 'minecraft:white_wool', 'minecraft:black_wool'],
      ['black_wool_to_white_wool', 'minecraft:black_wool', 'minecraft:white_wool'],
      ['white_concrete_to_black_concrete', 'minecraft:white_concrete', 'minecraft:black_concrete'],
      ['black_concrete_to_white_concrete', 'minecraft:black_concrete', 'minecraft:white_concrete'],
      ['clear_glass_to_tinted_glass', 'minecraft:glass', 'minecraft:tinted_glass'],
      ['tinted_glass_to_clear_glass', 'minecraft:tinted_glass', 'minecraft:glass']
    ].forEach(([name, input, output, count]) => transmutation(name, input, output, count))
    }

    removeOutputs([
      'mekanismgenerators:control_rod_assembly',
      'mekanismgenerators:fission_fuel_assembly',
      'mekanismgenerators:fission_reactor_logic_adapter'
    ])

    event.shaped('mekanismgenerators:fission_fuel_assembly', [
      'ZPZ',
      'RUR',
      'ZDZ'
    ], {
      Z: 'chemlib:zirconium_plate',
      P: 'modern_industrialization:platinum_plate',
      R: 'modern_industrialization:uranium_fuel_rod',
      U: 'mekanism:uranium_hexafluoride_bucket',
      D: 'mekanism:dosimeter'
    }).id(id('radiation/fission_fuel_assembly'))

    event.shaped('mekanismgenerators:control_rod_assembly', [
      'BIB',
      'BFB',
      'BGB'
    ], {
      B: 'chemlib:boron_dust',
      I: 'modern_industrialization:iridium_plate',
      F: 'mekanismgenerators:fission_fuel_assembly',
      G: 'mekanism:geiger_counter'
    }).id(id('radiation/control_rod_assembly'))

    // The Mekanism logic adapter is a Class III safety/control package. Every
    // deployed part corresponds to a real subsystem that must be replaceable
    // during the shutdown and restart proofs.
    event.custom({
      type: 'create:sequenced_assembly',
      ingredient: { item: 'mekanismgenerators:fission_reactor_casing' },
      transitional_item: { id: 'mekanismgenerators:fission_reactor_casing' },
      loops: 1,
      sequence: [
        'mekanism:elite_control_circuit',
        'mekanismgenerators:fission_reactor_port',
        'mekanismgenerators:fission_fuel_assembly',
        'mekanism:solar_neutron_activator',
        'mekanism:geiger_counter',
        'mekanism:dosimeter',
        'electroenergetics:sulfur_hexafluoride_breaker',
        'computercraft:computer_advanced',
        'gtceu:iv_sensor',
        'modern_industrialization:nuclear_alloy_plate',
        'modern_industrialization:iridium_plate',
        'mekanismgenerators:control_rod_assembly',
        'crowns:heat_exchanger'
      ].map(component => ({
        type: 'create:deploying',
        ingredients: [{ item: 'mekanismgenerators:fission_reactor_casing' }, { item: component }],
        results: [{ id: 'mekanismgenerators:fission_reactor_casing' }]
      })).concat([
        {
          type: 'create:filling',
          ingredients: [
            { item: 'mekanismgenerators:fission_reactor_casing' },
            { type: 'neoforge:single', amount: 250, fluid: 'modern_industrialization:lubricant' }
          ],
          results: [{ id: 'mekanismgenerators:fission_reactor_casing' }]
        },
        {
          type: 'greate:pressing',
          recipe_tier: 4,
          ingredients: [{ item: 'mekanismgenerators:fission_reactor_casing' }],
          results: [{ id: 'mekanismgenerators:fission_reactor_casing' }]
        }
      ]),
      results: [{ id: 'mekanismgenerators:fission_reactor_logic_adapter' }]
    }).id(id('radiation/mekanism_fission_logic_adapter'))

    // Obsolete disabled Enchanted integration removed; native active authorities retained.

    removeOutputs([
      'productivebees:gene_indexer',
      'modularbees:bee_extractor'
    ])

    event.shaped('productivebees:gene_indexer', [
      'SCS',
      'QHQ',
      'JDJ'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      C: 'ae2:calculation_processor',
      Q: '#c:gems/certus_quartz',
      H: 'productivebees:advanced_oak_beehive',
      J: 'the_bumblezone:royal_jelly_bottle',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('bumblezone/gene_indexer'))

    event.shaped('modularbees:bee_extractor', [
      'SCS',
      'GHG',
      'BDB'
    ], {
      S: 'modern_industrialization:stainless_steel_plate',
      C: 'ae2:calculation_processor',
      G: 'productivebees:gene',
      H: 'productivebees:gene_indexer',
      B: 'the_bumblezone:bee_stinger',
      D: 'the_bumblezone:essence_of_the_bees'
    }).id(id('bumblezone/bee_extractor'))

  })

  runPhase('Age 14 — Eternal Starlight', () => {
    // Native Portal Ruins, Gatekeeper entry, and Eternal Starlight recipes remain authoritative.
  })

  // Static release recipes: Age 15 — Quantum. Source: industrial_progression.mjs.


  // Static release recipes: GregTech earned gateway. Source: industrial_progression.mjs.


  runPhase('GregTech 1024 precision fabrication', () => {
    var id = name => `createch2:greg_1024/${name}`
    var clean = recipe => recipe.cleanroom(CleanroomType.CLEANROOM)

    clean(event.recipes.gtceu.circuit_assembler(id('semiconductor/silicon_boule'))
      .itemInputs('8x modern_industrialization:silicon_wafer', '2x ae2:printed_silicon')
      .inputFluids(Fluid.of('modern_industrialization:polyethylene', 250))
      .itemOutputs('gtceu:silicon_boule').duration(600).EUt(1024))

    clean(event.recipes.gtceu.laser_engraver(id('semiconductor/silicon_wafer'))
      .itemInputs('gtceu:silicon_boule', 'ae2:printed_silicon')
      .itemOutputs('16x gtceu:silicon_wafer').duration(500).EUt(1024))

    ;[
      ['cpu', 'ae2:printed_engineering_processor'],
      ['ram', 'ae2:printed_calculation_processor'],
      ['simple_soc', 'ae2:printed_logic_processor']
    ].forEach(([name, printedProcessor]) => {
      clean(event.recipes.gtceu.laser_engraver(id(`semiconductor/${name}_wafer`))
        .itemInputs('gtceu:silicon_wafer', printedProcessor)
        .itemOutputs(`gtceu:${name}_wafer`).duration(400).EUt(1024))
      clean(event.recipes.gtceu.laser_engraver(id(`semiconductor/${name}_chip`))
        .itemInputs(`gtceu:${name}_wafer`)
        .itemOutputs(`8x gtceu:${name === 'simple_soc' ? 'simple_soc' : name + '_chip'}`).duration(300).EUt(1024))
    })

    ;[
      ['resistor', 'modern_industrialization:resistor'],
      ['capacitor', 'modern_industrialization:capacitor'],
      ['diode', 'modern_industrialization:diode'],
      ['transistor', 'modern_industrialization:transistor'],
      ['inductor', 'modern_industrialization:inductor']
    ].forEach(([name, authorityPart]) => clean(event.recipes.gtceu.circuit_assembler(id(`smd/${name}`))
      .itemInputs(authorityPart, '2x modern_industrialization:electrum_fine_wire', 'gtceu:ram_chip')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 144))
      .itemOutputs(`4x gtceu:smd_${name}`).duration(240).EUt(1024)))

    clean(event.recipes.gtceu.circuit_assembler(id('boards/plastic_circuit_board'))
      .itemInputs('modern_industrialization:digital_circuit_board', '2x modern_industrialization:titanium_plate')
      .inputFluids(Fluid.of('modern_industrialization:polyethylene', 500))
      .itemOutputs('2x gtceu:plastic_circuit_board').duration(360).EUt(1024))

    clean(event.recipes.gtceu.laser_engraver(id('boards/plastic_printed_circuit_board'))
      .itemInputs('gtceu:plastic_circuit_board', 'ae2:engineering_processor_press')
      .itemOutputs('gtceu:plastic_printed_circuit_board').duration(320).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('processors/micro_processor'))
      .itemInputs('gtceu:plastic_printed_circuit_board', '2x gtceu:cpu_chip', '2x gtceu:ram_chip',
        '2x gtceu:smd_resistor', '2x gtceu:smd_capacitor', '2x gtceu:smd_transistor')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
      .itemOutputs('2x gtceu:micro_processor').duration(500).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('components/iv_electric_motor'))
      .itemInputs('2x modern_industrialization:advanced_motor', '4x modern_industrialization:titanium_rod',
        '4x modern_industrialization:kanthal_wire', 'modern_industrialization:digital_circuit')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 144))
      .itemOutputs('gtceu:iv_electric_motor').duration(420).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('components/iv_electric_pump'))
      .itemInputs('gtceu:iv_electric_motor', 'modern_industrialization:advanced_pump',
        '2x modern_industrialization:titanium_plate', '2x modern_industrialization:rubber_sheet',
        'modern_industrialization:digital_circuit')
      .inputFluids(Fluid.of('modern_industrialization:polyvinyl_chloride', 144))
      .itemOutputs('gtceu:iv_electric_pump').duration(480).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('components/iv_conveyor_module'))
      .itemInputs('2x modern_industrialization:advanced_motor', '4x modern_industrialization:rubber_sheet',
        '2x modern_industrialization:titanium_plate')
      .itemOutputs('gtceu:iv_conveyor_module').duration(360).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('components/iv_robot_arm'))
      .itemInputs('gtceu:iv_conveyor_module', '2x modern_industrialization:advanced_motor',
        'modern_industrialization:digital_circuit', '2x modern_industrialization:titanium_rod')
      .itemOutputs('gtceu:iv_robot_arm').duration(480).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('components/iv_sensor'))
      .itemInputs('gtceu:cpu_chip', 'gtceu:ram_chip', 'ae2:calculation_processor',
        '2x modern_industrialization:electrum_fine_wire', 'modern_industrialization:titanium_plate')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 144))
      .itemOutputs('gtceu:iv_sensor').duration(420).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('components/iv_emitter'))
      .itemInputs('gtceu:cpu_chip', 'gtceu:simple_soc', 'ae2:engineering_processor',
        '2x modern_industrialization:electrum_fine_wire', 'modern_industrialization:platinum_plate')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 144))
      .itemOutputs('gtceu:iv_emitter').duration(420).EUt(1024))

    // Seeded mature routes cannot bootstrap the MI control ladder.
    clean(event.recipes.gtceu.circuit_assembler(id('convergence/electronic_circuit_batch'))
      .itemInputs('modern_industrialization:electronic_circuit', '2x gtceu:smd_resistor',
        '2x gtceu:smd_capacitor', 'gtceu:smd_diode', 'modern_industrialization:electronic_circuit_board')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
      .itemOutputs('8x modern_industrialization:electronic_circuit').duration(500).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('convergence/digital_circuit_batch'))
      .itemInputs('modern_industrialization:digital_circuit', 'gtceu:micro_processor', '2x gtceu:cpu_chip',
        '2x gtceu:ram_chip', 'modern_industrialization:digital_circuit_board')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 432))
      .itemOutputs('6x modern_industrialization:digital_circuit').duration(600).EUt(1024))

    clean(event.recipes.gtceu.circuit_assembler(id('convergence/processing_unit_batch'))
      .itemInputs('modern_industrialization:processing_unit', '2x gtceu:micro_processor', '2x gtceu:smd_diode',
        '2x gtceu:smd_transistor', 'modern_industrialization:processing_unit_board')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 576))
      .itemOutputs('4x modern_industrialization:processing_unit').duration(700).EUt(1024))
  })

  runPhase('GregTech specialist thermal and refinery wing', () => {
    var id = name => `createch2:greg_specialist/${name}`
    var shaped = (output, pattern, keys, name) => event.shaped(output, pattern, keys).id(id(name))

    // Own every construction route used by the two IV specialist structures.
    removeOutputRecipes([
      'gtceu:pyrolyse_oven',
      'gtceu:cracker',
      'gtceu:ulv_machine_casing',
      'gtceu:clean_machine_casing',
      'gtceu:kanthal_coil_block',
      'gtceu:iv_muffler_hatch'
    ])

    shaped('8x gtceu:ulv_machine_casing', ['TST', 'SHS', 'TST'], {
      T: 'modern_industrialization:titanium_plate',
      S: 'modern_industrialization:stainless_steel_plate',
      H: 'modern_industrialization:clean_stainless_steel_machine_casing'
    }, 'structure/ulv_machine_casing')

    shaped('8x gtceu:clean_machine_casing', ['TST', 'SCS', 'TST'], {
      T: 'modern_industrialization:titanium_plate',
      S: 'modern_industrialization:stainless_steel_large_plate',
      C: 'modern_industrialization:clean_stainless_steel_machine_casing'
    }, 'structure/clean_machine_casing')

    shaped('8x gtceu:kanthal_coil_block', ['KPK', 'PHP', 'KPK'], {
      K: 'modern_industrialization:kanthal_coil',
      P: 'modern_industrialization:kanthal_plate',
      H: 'electroenergetics:resistive_heater'
    }, 'structure/kanthal_coil_block')

    shaped('gtceu:iv_muffler_hatch', ['TAT', 'PHP', 'TDT'], {
      T: 'modern_industrialization:titanium_plate',
      A: 'modern_industrialization:air_intake',
      P: 'gtceu:iv_electric_pump',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      D: 'modern_industrialization:digital_circuit'
    }, 'structure/iv_muffler_hatch')

    shaped('gtceu:pyrolyse_oven', ['CMC', 'PHP', 'TDT'], {
      C: 'gtceu:ulv_machine_casing',
      M: 'gtceu:iv_electric_motor',
      P: 'gtceu:iv_electric_pump',
      H: 'tfmg:steel_distillation_controller',
      T: 'modern_industrialization:titanium_plate',
      D: 'modern_industrialization:digital_circuit'
    }, 'controller/pyrolyse_oven')

    shaped('gtceu:cracker', ['KPK', 'RHR', 'TDT'], {
      K: 'gtceu:kanthal_coil_block',
      P: 'gtceu:iv_electric_pump',
      R: 'tfmg:steel_distillation_output',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      T: 'modern_industrialization:titanium_plate',
      D: 'ae2:engineering_processor'
    }, 'controller/cracker')

    // Native maps use hidden GT fluids/materials and bypass established first
    // access. They are default-denied; only these Createch-owned routes remain.
    removeRecipe({ type: 'gtceu:pyrolyse_oven' })
    removeRecipe({ type: 'gtceu:cracker' })

    event.recipes.gtceu.pyrolyse_oven(id('process/rail_coke_batch'))
      .itemInputs('16x minecraft:coal')
      .itemOutputs('16x railcraft:coal_coke')
      .outputFluids(Fluid.of('railcraft:creosote', 8000))
      .duration(800).EUt(1024)

    // Four buckets of heavy oil cannot return more than two buckets of a
    // fuel-bearing fraction; the asphalt remainder cannot close a fuel loop.
    event.recipes.gtceu.cracker(id('process/hydrogen_assisted_heavy_oil'))
      .inputFluids(
        Fluid.of('tfmg:heavy_oil', 4000),
        Fluid.of('modern_industrialization:hydrogen', 2000)
      )
      .outputFluids(
        Fluid.of('tfmg:naphtha', 2000),
        Fluid.of('tfmg:liquid_asphalt', 1000)
      )
      .duration(1000).EUt(1024)
  })

  runPhase('GregTech 2048 research fabrication', () => {
    var id = name => `createch2:greg_2048/${name}`
    var clean = recipe => recipe.cleanroom(CleanroomType.CLEANROOM)
    var shaped = (output, pattern, keys, name) => event.shaped(output, pattern, keys).id(id(`facility/${name}`))

    shaped('4x gtceu:large_scale_assembler_casing', ['IPI', 'PHP', 'IPI'], {
      I: 'modern_industrialization:iridium_plate',
      P: 'gtceu:iv_robot_arm',
      H: 'modern_industrialization:highly_advanced_machine_hull'
    }, 'large_scale_assembler_casing')

    ;[
      ['large_assembler', 'gtceu:iv_robot_arm'],
      ['large_circuit_assembler', 'gtceu:iv_sensor']
    ].forEach(([output, precision]) => shaped(`gtceu:${output}`, ['RPR', 'CHC', 'RER'], {
      R: 'gtceu:iv_robot_arm',
      P: precision,
      C: 'gtceu:large_scale_assembler_casing',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      E: 'gtceu:micro_processor'
    }, output))

    shaped('4x gtceu:advanced_computer_casing', ['IQI', 'PHP', 'IQI'], {
      I: 'modern_industrialization:iridium_plate',
      Q: 'gtceu:micro_processor',
      P: 'modern_industrialization:processing_unit',
      H: 'modern_industrialization:highly_advanced_machine_hull'
    }, 'advanced_computer_casing')

    shaped('gtceu:data_bank', ['DCD', 'PHP', 'SES'], {
      D: 'computercraft:disk',
      C: 'gtceu:advanced_computer_casing',
      P: 'modern_industrialization:processing_unit',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      S: 'computercraft:cable',
      E: 'ae2:engineering_processor'
    }, 'data_bank')

    shaped('gtceu:research_station', ['SJS', 'PHP', 'CEC'], {
      S: 'gtceu:iv_sensor',
      J: 'computercraft:computer_advanced',
      P: 'gtceu:iv_robot_arm',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      C: 'gtceu:advanced_computer_casing',
      E: 'ae2:engineering_processor'
    }, 'research_station')

    shaped('gtceu:high_performance_computation_array', ['QCQ', 'PHP', 'SES'], {
      Q: 'gtceu:micro_processor',
      C: 'gtceu:advanced_computer_casing',
      P: 'modern_industrialization:processing_unit',
      H: 'modern_industrialization:quantum_machine_hull',
      S: 'modern_industrialization:superconductor_wire',
      E: 'ae2:engineering_processor'
    }, 'hpca/controller')

    shaped('4x gtceu:hpca_computation_component', ['QCQ', 'PHP', 'SES'], {
      Q: 'gtceu:micro_processor',
      C: 'ae2:calculation_processor',
      P: 'modern_industrialization:processing_unit',
      H: 'gtceu:advanced_computer_casing',
      S: 'modern_industrialization:superconductor_wire',
      E: 'gtceu:iv_sensor'
    }, 'hpca/computation_component')

    shaped('4x gtceu:hpca_heat_sink_component', ['IPI', 'PHP', 'IAI'], {
      I: 'modern_industrialization:iridium_plate',
      P: 'modern_industrialization:advanced_pump',
      H: 'gtceu:advanced_computer_casing',
      A: 'modern_industrialization:air_intake'
    }, 'hpca/heat_sink_component')

    shaped('gtceu:computation_receiver_hatch', ['SCS', 'PHP', 'SDS'], {
      S: 'modern_industrialization:superconductor_wire',
      C: 'ae2:calculation_processor',
      P: 'modern_industrialization:processing_unit',
      H: 'gtceu:iv_input_bus',
      D: 'computercraft:cable'
    }, 'research/computation_receiver_hatch')

    shaped('gtceu:computation_transmitter_hatch', ['SCS', 'PHP', 'SDS'], {
      S: 'modern_industrialization:superconductor_wire',
      C: 'ae2:engineering_processor',
      P: 'modern_industrialization:processing_unit',
      H: 'gtceu:iv_output_bus',
      D: 'computercraft:cable'
    }, 'research/computation_transmitter_hatch')

    shaped('gtceu:object_holder', ['RGR', 'PHP', 'SDS'], {
      R: 'gtceu:iv_robot_arm',
      G: '#c:glass_blocks',
      P: 'modern_industrialization:advanced_pump',
      H: 'gtceu:iv_input_bus',
      S: 'gtceu:iv_sensor',
      D: 'modern_industrialization:digital_circuit'
    }, 'research/object_holder')

    shaped('gtceu:data_access_hatch', ['DCD', 'PHP', 'SES'], {
      D: 'computercraft:disk',
      C: 'gtceu:micro_processor',
      P: 'modern_industrialization:processing_unit',
      H: 'gtceu:iv_input_bus',
      S: 'computercraft:cable',
      E: 'ae2:engineering_processor'
    }, 'research/data_access_hatch')

    shaped('gtceu:data_receiver_hatch', ['SCS', 'PHP', 'SDS'], {
      S: 'modern_industrialization:superconductor_wire',
      C: 'gtceu:micro_processor',
      P: 'modern_industrialization:processing_unit',
      H: 'gtceu:iv_input_bus',
      D: 'computercraft:cable'
    }, 'research/data_receiver_hatch')

    shaped('gtceu:data_transmitter_hatch', ['SCS', 'PHP', 'SDS'], {
      S: 'modern_industrialization:superconductor_wire',
      C: 'gtceu:micro_processor',
      P: 'modern_industrialization:processing_unit',
      H: 'gtceu:iv_output_bus',
      D: 'computercraft:cable'
    }, 'research/data_transmitter_hatch')

    shaped('gtceu:data_stick', ['  D', ' S ', 'P  '], {
      D: 'computercraft:disk',
      S: 'modern_industrialization:superconductor_wire',
      P: 'modern_industrialization:processing_unit'
    }, 'research/data_stick')

    shaped('gtceu:data_orb', ['SDS', 'DCD', 'SDS'], {
      S: 'modern_industrialization:superconductor_wire',
      D: 'computercraft:disk',
      C: 'ae2:calculation_processor'
    }, 'research/data_orb')

    clean(event.recipes.gtceu.laser_engraver(id('semiconductor/phosphorus_boule'))
      .itemInputs('gtceu:silicon_boule', '4x #c:dusts/phosphorus')
      .itemOutputs('gtceu:phosphorus_boule').duration(700).EUt(2048))

    clean(event.recipes.gtceu.laser_engraver(id('semiconductor/phosphorus_wafer'))
      .itemInputs('gtceu:phosphorus_boule', 'ae2:printed_silicon')
      .itemOutputs('16x gtceu:phosphorus_wafer').duration(600).EUt(2048))

    ;[
      ['nano_cpu', 'ae2:printed_engineering_processor', 'nano_cpu_chip'],
      ['advanced_soc', 'ae2:printed_logic_processor', 'advanced_soc'],
      ['qbit_cpu', 'ae2:printed_calculation_processor', 'qbit_cpu_chip']
    ].forEach(([name, printedProcessor, chip]) => {
      clean(event.recipes.gtceu.laser_engraver(id(`semiconductor/${name}_wafer`))
        .itemInputs('gtceu:phosphorus_wafer', printedProcessor)
        .itemOutputs(`gtceu:${name}_wafer`).duration(500).EUt(2048))
      clean(event.recipes.gtceu.laser_engraver(id(`semiconductor/${name}_chip`))
        .itemInputs(`gtceu:${name}_wafer`, 'gtceu:iv_sensor')
        .itemOutputs(`8x gtceu:${chip}`).duration(400).EUt(2048))
    })

    ;['resistor', 'capacitor', 'diode', 'transistor', 'inductor'].forEach(name =>
      clean(event.recipes.gtceu.circuit_assembler(id(`smd/advanced_${name}`))
        .itemInputs(`2x gtceu:smd_${name}`, 'gtceu:nano_cpu_chip',
          '2x modern_industrialization:superconductor_tiny_dust')
        .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
        .itemOutputs(`2x gtceu:advanced_smd_${name}`).duration(360).EUt(2048)))

    clean(event.recipes.gtceu.circuit_assembler(id('boards/fiber_reinforced_circuit_board'))
      .itemInputs('gtceu:plastic_circuit_board', 'modern_industrialization:iridium_plate',
        '2x modern_industrialization:superconductor_tiny_dust')
      .inputFluids(Fluid.of('modern_industrialization:polyvinyl_chloride', 500))
      .itemOutputs('2x gtceu:fiber_reinforced_circuit_board').duration(500).EUt(2048))

    clean(event.recipes.gtceu.laser_engraver(id('boards/fiber_reinforced_printed_circuit_board'))
      .itemInputs('gtceu:fiber_reinforced_circuit_board', 'gtceu:iv_emitter')
      .itemOutputs('gtceu:fiber_reinforced_printed_circuit_board').duration(420).EUt(2048))

    clean(event.recipes.gtceu.circuit_assembler(id('processors/nano_processor'))
      .itemInputs('gtceu:fiber_reinforced_printed_circuit_board', '2x gtceu:nano_cpu_chip',
        '2x gtceu:advanced_soc', '2x gtceu:advanced_smd_resistor',
        '2x gtceu:advanced_smd_capacitor', '2x gtceu:advanced_smd_transistor')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 576))
      .itemOutputs('2x gtceu:nano_processor').duration(700).EUt(2048))

    event.recipes.gtceu.circuit_assembler(id('processors/quantum_processor'))
      .itemInputs('gtceu:fiber_reinforced_printed_circuit_board', '2x gtceu:qbit_cpu_chip',
        '2x gtceu:advanced_soc', '2x gtceu:advanced_smd_diode',
        '2x gtceu:advanced_smd_inductor', 'modern_industrialization:quantum_circuit')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 864))
      .itemOutputs('gtceu:quantum_processor').duration(900).EUt(2048)
      .cleanroom(CleanroomType.CLEANROOM)
      .scannerResearch(Item.of('gtceu:nano_processor'))

    clean(event.recipes.gtceu.assembler(id('components/iv_field_generator'))
      .itemInputs('2x gtceu:iv_emitter', '2x gtceu:iv_sensor', 'gtceu:nano_processor',
        '4x modern_industrialization:superconductor_wire', 'modern_industrialization:nuclear_alloy_plate')
      .itemOutputs('gtceu:iv_field_generator').duration(800).EUt(2048))

    clean(event.recipes.gtceu.circuit_assembler(id('convergence/digital_circuit_batch'))
      .itemInputs('modern_industrialization:digital_circuit', 'gtceu:nano_processor',
        '2x gtceu:advanced_smd_resistor', '2x gtceu:advanced_smd_capacitor',
        'modern_industrialization:digital_circuit_board')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 432))
      .itemOutputs('12x modern_industrialization:digital_circuit').duration(600).EUt(2048))

    clean(event.recipes.gtceu.circuit_assembler(id('convergence/processing_unit_batch'))
      .itemInputs('modern_industrialization:processing_unit', '2x gtceu:nano_processor',
        '2x gtceu:advanced_soc', '2x gtceu:advanced_smd_diode',
        'modern_industrialization:processing_unit_board')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 576))
      .itemOutputs('8x modern_industrialization:processing_unit').duration(720).EUt(2048))

    clean(event.recipes.gtceu.circuit_assembler(id('components/iv_sensor_batch'))
      .itemInputs('gtceu:iv_sensor', 'gtceu:nano_processor', '2x gtceu:advanced_soc',
        '2x ae2:calculation_processor', '2x modern_industrialization:iridium_plate')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
      .itemOutputs('4x gtceu:iv_sensor').duration(600).EUt(2048))

    clean(event.recipes.gtceu.circuit_assembler(id('components/iv_emitter_batch'))
      .itemInputs('gtceu:iv_emitter', 'gtceu:nano_processor', '2x gtceu:qbit_cpu_chip',
        '2x ae2:engineering_processor', '2x modern_industrialization:iridium_plate')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
      .itemOutputs('4x gtceu:iv_emitter').duration(600).EUt(2048))

    clean(event.recipes.gtceu.assembler(id('convergence/aerospace_sensor_assembly'))
      .itemInputs('rocketnautics:magnetic_stabilizer', '2x gtceu:iv_sensor', 'gtceu:iv_emitter',
        '2x modern_industrialization:advanced_motor', 'modern_industrialization:processing_unit')
      .itemOutputs('2x rocketnautics:magnetic_stabilizer').duration(900).EUt(2048))

    clean(event.recipes.gtceu.assembler(id('convergence/nuclear_control_assembly'))
      .itemInputs('mekanismgenerators:fission_reactor_casing', 'gtceu:iv_sensor', 'gtceu:iv_field_generator',
        '2x modern_industrialization:nuclear_alloy_plate', 'modern_industrialization:processing_unit')
      .itemOutputs('2x mekanismgenerators:fission_reactor_casing').duration(1000).EUt(2048))
  })

  runPhase('GregTech specialist chemical and alloy wing', () => {
    var id = name => `createch2:greg_specialist/${name}`
    var shaped = (output, pattern, keys, name) => event.shaped(output, pattern, keys).id(id(name))

    removeOutputRecipes([
      'gtceu:large_chemical_reactor',
      'gtceu:alloy_blast_smelter',
      'gtceu:inert_machine_casing',
      'gtceu:ptfe_pipe_casing',
      'gtceu:high_temperature_smelting_casing',
      'gtceu:heat_vent'
    ])

    shaped('8x gtceu:inert_machine_casing', ['PTP', 'THT', 'PTP'], {
      P: 'modern_industrialization:polyvinyl_chloride_bucket',
      T: 'modern_industrialization:titanium_plate',
      H: 'modern_industrialization:clean_stainless_steel_machine_casing'
    }, 'structure/inert_machine_casing')

    shaped('2x gtceu:ptfe_pipe_casing', ['PMP', 'THT', 'PMP'], {
      P: 'modern_industrialization:polyvinyl_chloride_bucket',
      M: 'gtceu:iv_electric_pump',
      T: 'modern_industrialization:titanium_plate',
      H: 'modern_industrialization:nuclear_alloy_machine_casing_pipe'
    }, 'structure/ptfe_pipe_casing')

    shaped('8x gtceu:high_temperature_smelting_casing', ['NKN', 'KHK', 'NKN'], {
      N: 'modern_industrialization:nuclear_alloy_large_plate',
      K: 'modern_industrialization:kanthal_coil',
      H: 'modern_industrialization:highly_advanced_machine_hull'
    }, 'structure/high_temperature_smelting_casing')

    shaped('4x gtceu:heat_vent', ['TAT', 'PHP', 'TAT'], {
      T: 'modern_industrialization:titanium_plate',
      A: 'modern_industrialization:air_intake',
      P: 'gtceu:iv_electric_pump',
      H: 'crowns:heat_exchanger'
    }, 'structure/heat_vent')

    shaped('gtceu:large_chemical_reactor', ['PFP', 'CHC', 'RER'], {
      P: 'gtceu:iv_electric_pump',
      F: 'gtceu:iv_field_generator',
      C: 'gtceu:inert_machine_casing',
      H: 'modern_industrialization:chemical_reactor',
      R: 'gtceu:large_scale_assembler_casing',
      E: 'ae2:engineering_processor'
    }, 'controller/large_chemical_reactor')

    shaped('gtceu:alloy_blast_smelter', ['KFK', 'CHC', 'RER'], {
      K: 'gtceu:kanthal_coil_block',
      F: 'gtceu:iv_field_generator',
      C: 'gtceu:high_temperature_smelting_casing',
      H: 'modern_industrialization:electric_blast_furnace',
      R: 'gtceu:large_scale_assembler_casing',
      E: 'gtceu:iv_robot_arm'
    }, 'controller/alloy_blast_smelter')

    removeRecipe({ type: 'gtceu:large_chemical_reactor' })
    removeRecipe({ type: 'gtceu:alloy_blast_smelter' })

    // This is the four-shift form of the established Age 12 PGM feed. MI still
    // owns the downstream separation into individual metals.
    event.recipes.gtceu.large_chemical_reactor(id('process/pgm_aqua_regia_batch'))
      .itemInputs(
        '8x modern_industrialization:raw_platinum',
        '16x modern_industrialization:platinum_tiny_dust',
        '4x #c:dusts/sodium'
      )
      .inputFluids(
        Fluid.of('modern_industrialization:hydrochloric_acid', 8000),
        Fluid.of('modern_industrialization:chlorine', 4000)
      )
      .itemOutputs('4x modern_industrialization:mixed_ingot_iridium')
      .duration(1600).EUt(2048)

    // The established Stargate alloy recipe remains first access. This exact
    // 8x specialist batch consumes substantially more precision and exotic
    // material than the baseline route in exchange for campus-scale batching.
    event.recipes.gtceu.alloy_blast_smelter(id('process/naquadah_master_alloy_batch'))
      .itemInputs(
        '8x modern_industrialization:titanium_ingot',
        '8x modern_industrialization:platinum_ingot',
        '8x eternal_starlight:aethersent_ingot',
        '8x sgjourney:refined_naquadah'
      )
      .itemOutputs('8x sgjourney:naquadah_alloy')
      .duration(1800).EUt(4096).blastFurnaceTemp(2700)
  })

  runPhase('GregTech 4096 assembly convergence', () => {
    var id = name => `createch2:greg_4096/${name}`
    var shaped = (output, pattern, keys, name) => event.shaped(output, pattern, keys).id(id(`facility/${name}`))
    var GTRecipeSchema = Java.loadClass('com.gregtechceu.gtceu.integration.kjs.recipe.GTRecipeSchema')
    var ArrayList = Java.loadClass('java.util.ArrayList')
    var StationResearchRecipes = Java.loadClass('createch2.core.compat.GtStationResearchRecipes')
    var ResearchRecipeId = Java.loadClass('net.minecraft.resources.ResourceLocation')
    var research = (recipe, stack, cwu) => {
      // GT 8.1.0's research adapter assumes this optional schema list exists.
      recipe.setValue(GTRecipeSchema.CONDITIONS, new ArrayList())
      // GT's KubeJS adapter retains the condition but never emits its station job.
      // Use the native research factory/codec, including the research-data component.
      var deliveryId = `createch2:research_station/greg_4096/research/${stack.replace(':', '/')}`
      var station = StationResearchRecipes.stationRecipe(Item.of(stack), cwu, ResearchRecipeId.parse(deliveryId))
      if (station != null) StationResearchRecipes.assignStationId(event.custom(station), ResearchRecipeId.parse(deliveryId))
      return recipe.stationResearch(builder => builder
        .researchStack(Item.of(stack)).CWUt(cwu).EUt(2048))
    }

    shaped('4x gtceu:assembly_line_casing', ['SIS', 'PHP', 'SIS'], {
      S: 'modern_industrialization:superconductor_plate',
      I: 'modern_industrialization:iridium_plate',
      P: 'gtceu:iv_robot_arm',
      H: 'modern_industrialization:quantum_machine_hull'
    }, 'assembly_line_casing')

    shaped('4x gtceu:assembly_line_grating', ['RCR', 'SPS', 'RCR'], {
      R: 'gtceu:iv_robot_arm',
      C: 'gtceu:iv_conveyor_module',
      S: 'modern_industrialization:superconductor_wire',
      P: 'modern_industrialization:iridium_plate'
    }, 'assembly_line_grating')

    shaped('gtceu:assembly_line_unit', ['RCR', 'PHP', 'SES'], {
      R: 'gtceu:iv_robot_arm',
      C: 'gtceu:quantum_processor',
      P: 'gtceu:iv_field_generator',
      H: 'modern_industrialization:quantum_machine_hull',
      S: 'modern_industrialization:superconductor_wire',
      E: 'gtceu:iv_emitter'
    }, 'assembly_line_unit')

    shaped('gtceu:assembly_line', ['RCR', 'UHU', 'SES'], {
      R: 'gtceu:iv_robot_arm',
      C: 'gtceu:quantum_processor',
      U: 'gtceu:assembly_line_unit',
      H: 'modern_industrialization:quantum_machine_hull',
      S: 'modern_industrialization:superconductor_cable',
      E: 'gtceu:iv_field_generator'
    }, 'assembly_line')

    ;[
      ['luv_circuit_assembler', 'gtceu:iv_circuit_assembler'],
      ['luv_laser_engraver', 'gtceu:iv_laser_engraver']
    ].forEach(([output, previous]) => shaped(`gtceu:${output}`, ['SQS', 'PHP', 'CEC'], {
      S: 'modern_industrialization:superconductor_plate',
      Q: 'gtceu:quantum_processor',
      P: 'gtceu:iv_field_generator',
      H: previous,
      C: 'modern_industrialization:quantum_circuit',
      E: 'eternal_starlight:starcore'
    }, output))

    shaped('gtceu:luv_energy_input_hatch', ['BQB', 'PHP', 'SES'], {
      B: 'electroenergetics:sulfur_hexafluoride_breaker',
      Q: 'modern_industrialization:quantum_circuit',
      P: 'gtceu:iv_field_generator',
      H: 'gtceu:iv_energy_input_hatch',
      S: 'modern_industrialization:superconductor_cable',
      E: 'gtceu:quantum_processor'
    }, 'luv_energy_input_hatch')

    shaped('gtceu:luv_1a_energy_converter', ['BQB', 'PHP', 'SES'], {
      B: 'electroenergetics:sulfur_hexafluoride_breaker',
      Q: 'modern_industrialization:quantum_circuit',
      P: 'gtceu:iv_field_generator',
      H: 'gtceu:iv_1a_energy_converter',
      S: 'modern_industrialization:superconductor_cable',
      E: 'sgjourney:refined_naquadah'
    }, 'luv_1a_bridge')

    ;[
      ['conveyor_module', 'gtceu:iv_conveyor_module', 'modern_industrialization:advanced_motor'],
      ['robot_arm', 'gtceu:iv_robot_arm', 'gtceu:iv_conveyor_module'],
      ['sensor', 'gtceu:iv_sensor', 'gtceu:advanced_soc'],
      ['emitter', 'gtceu:iv_emitter', 'gtceu:qbit_cpu_chip'],
      ['field_generator', 'gtceu:iv_field_generator', 'gtceu:quantum_processor']
    ].forEach(([name, previous, precision]) => research(
      event.recipes.gtceu.assembly_line(id(`components/luv_${name}`))
        .itemInputs(previous, precision, '2x gtceu:quantum_processor', '2x modern_industrialization:quantum_circuit',
          '4x modern_industrialization:superconductor_wire', '2x eternal_starlight:aethersent_ingot',
          'modern_industrialization:iridium_plate', 'sgjourney:refined_naquadah')
        .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 1152))
        .itemOutputs(`gtceu:luv_${name}`).duration(1200).EUt(4096),
      previous, 16))

    // First research optics must precede PBI and the late assembler campus.
    // Retain the native PTFE144mB basis, full7680EU*100tick batch and room.
    event.recipes.gtceu.circuit_assembler(id('research/optical_pipe_bootstrap'))
      .itemInputs('#c:glass_blocks', '2x #c:plates/silver')
      .inputFluids(Fluid.of('gtceu:polytetrafluoroethylene', 144))
      .itemOutputs('gtceu:normal_optical_pipe').duration(100).EUt(7680)
      .cleanroom(CleanroomType.CLEANROOM)

    research(event.recipes.gtceu.assembly_line(id('processors/crystal_soc'))
      .itemInputs('gtceu:qbit_cpu_chip', '2x gtceu:advanced_soc', 'gtceu:quantum_processor',
        '2x eternal_starlight:starcore', '4x eternal_starlight:thioquartz_shard',
        '4x modern_industrialization:superconductor_wire', 'sgjourney:communication_crystal')
      .inputFluids(Fluid.of('modern_industrialization:uu_matter', 250))
      .itemOutputs('2x gtceu:crystal_soc').duration(1400).EUt(4096),
    'gtceu:quantum_processor', 24)

    research(event.recipes.gtceu.assembly_line(id('processors/crystal_processor'))
      .itemInputs('gtceu:fiber_reinforced_printed_circuit_board', '2x gtceu:crystal_soc',
        '2x gtceu:advanced_smd_resistor', '2x gtceu:advanced_smd_capacitor',
        '2x gtceu:advanced_smd_transistor', '2x gtceu:advanced_smd_diode',
        'modern_industrialization:quantum_circuit', 'ae2:engineering_processor')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 1152))
      .itemOutputs('2x gtceu:crystal_processor').duration(1500).EUt(4096),
    'gtceu:crystal_soc', 24)

    research(event.recipes.gtceu.assembly_line(id('convergence/processing_unit_batch'))
      .itemInputs('modern_industrialization:processing_unit', '2x gtceu:crystal_processor',
        '2x gtceu:luv_robot_arm', '2x gtceu:luv_sensor', '2x ae2:engineering_processor',
        'modern_industrialization:processing_unit_board')
      .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 864))
      .itemOutputs('16x modern_industrialization:processing_unit').duration(1000).EUt(4096),
    'modern_industrialization:processing_unit', 16)

    research(event.recipes.gtceu.assembly_line(id('convergence/quantum_circuit_batch'))
      .itemInputs('modern_industrialization:quantum_circuit', '2x gtceu:crystal_processor',
        'gtceu:luv_field_generator', 'gtceu:luv_sensor', 'gtceu:luv_emitter',
        '2x eternal_starlight:starcore', '2x sgjourney:refined_naquadah')
      .inputFluids(Fluid.of('modern_industrialization:uu_matter', 500))
      .itemOutputs('6x modern_industrialization:quantum_circuit').duration(1600).EUt(4096),
    'modern_industrialization:quantum_circuit', 32)

    research(event.recipes.gtceu.assembly_line(id('convergence/aerospace_control'))
      .itemInputs('stellaris:rocket_engine', '2x rocketnautics:rocket_thruster',
        '2x gtceu:luv_sensor', 'gtceu:luv_emitter', 'gtceu:luv_robot_arm',
        '2x modern_industrialization:quantum_circuit', '2x modern_industrialization:nuclear_alloy_plate')
      .inputFluids(Fluid.of('modern_industrialization:lubricant', 2000))
      .itemOutputs('3x stellaris:rocket_engine').duration(1800).EUt(4096),
    'rocketnautics:rocket_thruster', 24)

    research(event.recipes.gtceu.assembly_line(id('convergence/stargate_crystallizer'))
      .itemInputs('sgjourney:crystallizer', '2x gtceu:luv_robot_arm',
        '2x gtceu:luv_sensor', '2x gtceu:luv_emitter', 'gtceu:luv_field_generator',
        '2x sgjourney:control_crystal', '4x sgjourney:refined_naquadah',
        '2x eternal_starlight:aethersent_ingot')
      .inputFluids(Fluid.of('modern_industrialization:uu_matter', 500))
      .itemOutputs('2x sgjourney:advanced_crystallizer').duration(2200).EUt(4096),
    'sgjourney:crystallizer', 32)
  })

  // Static release recipes: Extreme industry convergence. Source: industrial_progression.mjs.


  // Static release recipes: Aeronautics transmission and linkage tradeoffs. Source: industrial_progression.mjs.


  runPhase('Mod identity enforcement', () => {
    var id = name => `createch2:identity/${name}`

    var removeOutputs = outputs => removeOutputRecipes(outputs)
    var miRecipe = (machine, name, recipe) => event.custom(Object.assign({
      type: `modern_industrialization:${machine}`
    }, recipe)).id(id(name))

    // Easy Villagers owns managed civic labor. It should not own infinite metals,
    // and its administration blocks should require actual factory/civic hardware.
    removeOutputs([
      'easy_villagers:trader',
      'easy_villagers:auto_trader',
      'easy_villagers:farmer',
      'easy_villagers:breeder',
      'easy_villagers:converter',
      'easy_villagers:incubator',
      'easy_villagers:iron_farm'
    ])

    event.shaped('easy_villagers:trader', [
      'GPG',
      'CEC',
      'SLS'
    ], {
      G: '#c:glass_panes',
      P: 'minecraft:paper',
      C: 'tfmg:steel_mechanism',
      E: '#c:gems/emerald',
      S: 'modern_industrialization:steel_plate',
      L: 'minecraft:lectern'
    }).id(id('easy_villagers/trader'))

    event.shaped('easy_villagers:auto_trader', [
      'GCG',
      'SMS',
      'ATA'
    ], {
      G: '#c:glass_panes',
      C: '#createch2:control/factory/digital',
      S: 'computercraft:cable',
      M: 'computercraft:computer_advanced',
      A: 'modern_industrialization:analog_circuit',
      T: 'easy_villagers:trader'
    }).id(id('easy_villagers/auto_trader'))

    // This block is a controlled-environment abstraction, not a replacement
    // for TFC field farming. Its recipe physically proves greenhouse shell,
    // irrigation, nutrients, electrical conversion, digital control, and a
    // mechanical harvesting head before managed civic agriculture exists.
    event.shaped('easy_villagers:farmer', [
      'GCG',
      'IHI',
      'NEN'
    ], {
      G: 'firmalife:copper_greenhouse_port',
      C: '#createch2:control/factory/digital',
      I: 'firmalife:irrigation_tank',
      H: 'create:mechanical_harvester',
      N: 'tfc:compost',
      E: 'electroenergetics:converter'
    }).id(id('easy_villagers/farmer'))

    event.shaped('easy_villagers:breeder', [
      'GCG',
      'BFB',
      'SIS'
    ], {
      G: '#c:glass_panes',
      C: '#createch2:control/factory/analog',
      B: '#minecraft:beds',
      F: 'firmalife:food/pineapple',
      S: 'modern_industrialization:steel_plate',
      I: 'easy_villagers:incubator'
    }).id(id('easy_villagers/breeder'))

    event.shaped('easy_villagers:converter', [
      'GCG',
      'FBF',
      'SAS'
    ], {
      G: '#c:glass_panes',
      C: '#createch2:malum_spirit_handling',
      F: 'minecraft:rotten_flesh',
      B: 'evilcraft:hardened_blood',
      S: 'modern_industrialization:steel_plate',
      A: 'enchanted:attuned_stone'
    }).id(id('easy_villagers/converter'))

    event.shaped('easy_villagers:incubator', [
      'GCG',
      'WHW',
      'SAS'
    ], {
      G: '#c:glass_panes',
      C: 'modern_industrialization:analog_circuit',
      W: '#minecraft:wool',
      H: '#createch2:agriculture/incubator_bedding',
      S: 'modern_industrialization:steel_plate',
      A: 'tfmg:steel_mechanism'
    }).id(id('easy_villagers/incubator'))

    // Building Gadgets owns planned construction. Remove older convenience
    // template-manager recipes that make the mod feel like a cheap paper craft.
    removeOutputRecipes(['buildinggadgets2:template_manager'])
    event.shaped('buildinggadgets2:template_manager', [
      'SDS',
      'PMP',
      'SCS'
    ], {
      S: 'modern_industrialization:steel_plate',
      D: 'computercraft:disk',
      P: 'create:precision_mechanism',
      M: '#createch2:control/factory/digital',
      C: '#createch2:wooden_storage_chests'
    }).id(id('buildinggadgets2/template_manager'))

    // Solar Industrialization owns mature distributed solar power. Its native
    // recipes were globally removed; restore them behind MI chemistry and grid
    // infrastructure so solar is a real branch without becoming early free EU.
    // The exact-340 release does not ship that optional mod, so keep the
    // integration inert unless a future build restores its registry.
    if (Platform.isLoaded('solar_industrialization')) {
    removeOutputRecipes([/^solar_industrialization:.*$/])

    miRecipe('blast_furnace', 'solar_industrialization/hot_tempered_glass', {
      eu: 32,
      duration: 200,
      item_inputs: [
        { tag: 'c:dusts/quartz', amount: 1 },
        { tag: 'c:sands', amount: 1 }
      ],
      item_outputs: [
        { item: 'solar_industrialization:hot_tempered_glass', amount: 1 }
      ]
    })

    miRecipe('vacuum_freezer', 'solar_industrialization/tempered_glass', {
      eu: 32,
      duration: 200,
      item_inputs: [
        { item: 'solar_industrialization:hot_tempered_glass', amount: 1 }
      ],
      item_outputs: [
        { item: 'solar_industrialization:tempered_glass', amount: 1 }
      ]
    })

    miRecipe('centrifuge', 'solar_industrialization/polyethylene_sheet', {
      eu: 32,
      duration: 200,
      item_inputs: [
        { item: 'modern_industrialization:carbon_plate', amount: 1 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:polyethylene',
        amount: 200
      },
      item_outputs: {
        item: 'solar_industrialization:polyethylene_sheet',
        amount: 1
      }
    })

    ;[
      ['lv', 'redstone_battery', 'copper_cable', 'basic_machine_hull'],
      ['mv', 'silicon_battery', 'cupronickel_cable', 'advanced_machine_hull'],
      ['hv', 'sodium_battery', 'kanthal_cable', 'turbo_machine_hull'],
      ['ev', 'cadmium_battery', 'platinum_cable', 'highly_advanced_machine_hull'],
      ['sv', 'plutonium_battery', 'superconductor_cable', 'quantum_machine_hull']
    ].forEach(([tier, battery, cable, hull]) => {
      miRecipe('assembler', `solar_industrialization/${tier}_solar_component`, {
        eu: 8,
        duration: 200,
        item_inputs: [
          { tag: 'c:dusts/silicon', amount: 16 },
          { item: 'solar_industrialization:tempered_glass', amount: 3 },
          { item: `modern_industrialization:${battery}`, amount: 2 },
          { item: `modern_industrialization:${cable}`, amount: 2 },
          { item: 'modern_industrialization:electronic_circuit_board', amount: 1 },
          { item: 'modern_industrialization:electronic_circuit', amount: 1 }
        ],
        fluid_inputs: [
          { fluid: 'modern_industrialization:synthetic_rubber', amount: 1000 },
          { fluid: 'modern_industrialization:soldering_alloy', amount: 1000 }
        ],
        item_outputs: [
          { item: `solar_industrialization:${tier}_solar_component`, amount: 1 }
        ]
      })

      miRecipe('assembler', `solar_industrialization/${tier}_solar_panel`, {
        eu: 8,
        duration: 200,
        item_inputs: [
          { item: 'modern_industrialization:resistor', amount: 16 },
          { item: 'modern_industrialization:capacitor', amount: 16 },
          { item: `solar_industrialization:${tier}_solar_component`, amount: 3 },
          { item: 'solar_industrialization:polyethylene_sheet', amount: 2 },
          { item: `modern_industrialization:${hull}`, amount: 1 }
        ],
        fluid_inputs: [
          { fluid: 'modern_industrialization:soldering_alloy', amount: 1000 }
        ],
        item_outputs: [
          { item: `solar_industrialization:${tier}_solar_panel`, amount: 1 }
        ]
      })
    })

    miRecipe('assembler', 'solar_industrialization/solar_farm_controller', {
      eu: 8,
      duration: 200,
      item_inputs: [
        { item: 'electroenergetics:converter', amount: 2 },
        { item: 'modern_industrialization:memory_management_unit', amount: 1 },
        { item: 'modern_industrialization:digital_circuit', amount: 1 },
        { item: 'modern_industrialization:random_access_memory', amount: 2 },
        { item: 'modern_industrialization:electrum_fine_wire', amount: 2 },
        { item: 'modern_industrialization:clean_stainless_steel_machine_casing', amount: 4 }
      ],
      item_outputs: [
        { item: 'solar_industrialization:solar_farm_controller', amount: 1 }
      ]
    })

    miRecipe('assembler', 'solar_industrialization/panel_cleaner', {
      eu: 2,
      duration: 200,
      item_inputs: [
        { item: 'modern_industrialization:electronic_circuit_board', amount: 1 },
        { item: 'modern_industrialization:motor', amount: 1 },
        { item: 'modern_industrialization:analog_circuit', amount: 2 },
        { item: 'solar_industrialization:polyethylene_sheet', amount: 2 },
        { tag: 'minecraft:wool', amount: 4 }
      ],
      item_outputs: [
        { item: 'solar_industrialization:panel_cleaner', amount: 1 }
      ]
    })

    ;[
      ['basic_solar_filter', 'modern_industrialization:air_intake'],
      ['advanced_solar_filter', 'solar_industrialization:basic_solar_filter'],
      ['turbo_solar_filter', 'solar_industrialization:advanced_solar_filter']
    ].forEach(([filter, core]) => miRecipe('assembler', `solar_industrialization/${filter}`, {
      eu: 8,
      duration: 200,
      item_inputs: [
        { item: 'modern_industrialization:silicon_wafer', amount: 16 },
        { item: 'modern_industrialization:arithmetic_logic_unit', amount: 4 },
        { item: 'modern_industrialization:random_access_memory', amount: 2 },
        { item: 'modern_industrialization:processing_unit_board', amount: 1 },
        { item: core, amount: 1 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:oxygen', amount: 16000 },
        { fluid: 'modern_industrialization:nylon', amount: 16000 }
      ],
      item_outputs: [
        { item: `solar_industrialization:${filter}`, amount: 1 }
      ]
    }))

    ;[
      ['basic_energy_upgrade', 'modern_industrialization:portable_storage_unit'],
      ['advanced_energy_upgrade', 'solar_industrialization:basic_energy_upgrade'],
      ['turbo_energy_upgrade', 'solar_industrialization:advanced_energy_upgrade']
    ].forEach(([upgrade, core]) => miRecipe('assembler', `solar_industrialization/${upgrade}`, {
      eu: 8,
      duration: 200,
      item_inputs: [
        { item: 'modern_industrialization:silicon_plate', amount: 16 },
        { item: 'modern_industrialization:overdrive_module', amount: 4 },
        { item: 'modern_industrialization:basic_upgrade', amount: 2 },
        { item: 'modern_industrialization:processing_unit_board', amount: 1 },
        { item: core, amount: 1 }
      ],
      fluid_inputs: [
        { fluid: 'modern_industrialization:soldering_alloy', amount: 16000 },
        { fluid: 'modern_industrialization:helium', amount: 16000 }
      ],
      item_outputs: [
        { item: `solar_industrialization:${upgrade}`, amount: 1 }
      ]
    }))
    }

    // Additional Enchanted Miner owns surveyed fixed excavation, not cheap
    // diamond-pick quarrying. Restore only the quarry line and surveying tools.
    removeOutputRecipes([/^quarryplus:.*$/])

    event.shaped('quarryplus:marker', [
      'LRL',
      'RCR',
      'LR '
    ], {
      L: '#c:gems/lapis',
      R: '#c:dusts/redstone',
      C: 'modern_industrialization:electronic_circuit'
    }).id(id('quarryplus/marker'))

    event.shaped('quarryplus:flexible_marker', [
      'RDR',
      'MMM',
      'RDR'
    ], {
      R: '#c:dusts/redstone',
      D: 'create_radar:data_link',
      M: 'quarryplus:marker'
    }).id(id('quarryplus/flexible_marker'))

    event.shaped('quarryplus:chunk_marker', [
      'RCR',
      'MMM',
      'RCR'
    ], {
      R: '#c:dusts/redstone',
      C: 'modern_industrialization:quantum_circuit',
      M: 'quarryplus:marker'
    }).id(id('quarryplus/chunk_marker'))

    event.shaped('quarryplus:status_checker', [
      'GCG',
      'GMG',
      'GCG'
    ], {
      G: '#c:glass_panes',
      C: 'modern_industrialization:electronic_circuit',
      M: 'quarryplus:marker'
    }).id(id('quarryplus/status_checker'))

    event.shaped('quarryplus:filter_module', [
      'PBP',
      'CMC',
      'PBP'
    ], {
      P: 'minecraft:paper',
      B: 'minecraft:book',
      C: 'modern_industrialization:digital_circuit',
      M: 'quarryplus:marker'
    }).id(id('quarryplus/filter_module'))

    event.shaped('quarryplus:pump_module', [
      'GTG',
      'PMP',
      'GCG'
    ], {
      G: '#c:glass_panes',
      T: 'modern_industrialization:configurable_tank',
      P: 'modern_industrialization:advanced_pump',
      M: 'quarryplus:marker',
      C: 'modern_industrialization:digital_circuit'
    }).id(id('quarryplus/pump_module'))

    event.shaped('quarryplus:quarry', [
      'RMR',
      'FQF',
      'PDP'
    ], {
      R: 'create_radar:radar_receiver_block',
      M: 'shield_generators:shield_generator',
      F: 'quarryplus:flexible_marker',
      Q: 'modern_industrialization:electric_quarry',
      P: 'tfmg:heavy_plate',
      D: 'modern_industrialization:digital_circuit'
    }).id(id('quarryplus/quarry'))

    event.shaped('quarryplus:adv_quarry', [
      'RMR',
      'QFQ',
      'HCH'
    ], {
      R: 'create_radar:fire_controller',
      M: 'shield_generators:shield_generator',
      Q: 'quarryplus:quarry',
      F: 'quarryplus:filter_module',
      H: 'modern_industrialization:highly_advanced_machine_hull',
      C: 'modern_industrialization:digital_circuit'
    }).id(id('quarryplus/adv_quarry'))

    // Create Horse Power owns preindustrial animal rotation. Keep it tied to
    // TFC settlement materials instead of vanilla stone.
    removeOutputRecipes(['createhorsepower:horse_crank'])
    event.shaped('createhorsepower:horse_crank', [
      ' R ',
      'LCL',
      'SSS'
    ], {
      R: 'tfc:rope',
      L: 'minecraft:leather',
      C: 'create:cogwheel',
      S: 'create:shaft'
    }).id(id('createhorsepower/horse_crank'))

  })

  // Static release recipes: Resource authority and space-return processing. Source: industrial_progression.mjs.


  // Static release recipes: Utility and transport authority. Source: industrial_progression.mjs.


  // BEGIN GENERATED STATIC INDUSTRIAL CONTAINMENT
  // Generated literal-ID protection; no native namespace is reopened.
  var compiledReleaseRecipeIds = ["createch2:advanced_electric/mekanism/basic_control_circuit","createch2:advanced_electric/mekanism/metallurgic_infuser","createch2:advanced_electric/mi/advanced_machine_casing_space_aluminum","createch2:advanced_electric/mi/advanced_machine_hull_space_aluminum","createch2:advanced_electric/mi/advanced_motor_lubricated_assembly","createch2:advanced_electric/mi/advanced_pump_lubricated_assembly","createch2:advanced_electric/mi/aluminum_from_aluminum_dust_space_reduction","createch2:advanced_electric/mi/aluminum_from_bauxite_space_reduction","createch2:aeroclaims_ftb/claim_block","createch2:aeronautics/adjustable_burner","createch2:aeronautics/gyroscopic_propeller_bearing","createch2:aeronautics/propeller_bearing","createch2:aeronautics/stage_1/adjustable_burner","createch2:aeronautics/stage_1/control_desk","createch2:aeronautics/stage_1/joystick","createch2:aeronautics/stage_1/mechanical_servo","createch2:aeronautics/stage_1/physics_assembler","createch2:aeronautics/stage_1/propeller_bearing","createch2:aeronautics/stage_1/steam_vent","createch2:aeronautics/stage_2/docking_connector","createch2:aeronautics/stage_2/engine_assembly","createch2:aeronautics/stage_2/liquid_burner","createch2:aeronautics/stage_2/portable_engine_heavy_industry","createch2:aeronautics/stage_2/solid_burner","createch2:aeronautics/stage_2/solid_fuel_thruster","createch2:aeronautics/stage_2/tempered_wing","createch2:aeronautics/stage_2/thruster","createch2:aeronautics/stage_2/wing_frame","createch2:aeronautics/stage_3/advanced_tilt_adapter","createch2:aeronautics/stage_3/gyroscope","createch2:aeronautics/stage_3/gyroscopic_propeller_bearing","createch2:aeronautics/stage_3/liquid_vector_thruster","createch2:aeronautics/stage_3/stepper_servo","createch2:aeronautics/stage_3/vector_thruster","createch2:aeronautics/stage_4/airship_station","createch2:aeronautics/stage_4/ship_transponder","createch2:aeronautics/steam_vent","createch2:age_foundation/create/andesite_alloy","createch2:age_foundation/create/andesite_casing","createch2:age_foundation/create/andesite_funnel","createch2:age_foundation/create/andesite_tunnel","createch2:age_foundation/create/basin","createch2:age_foundation/create/fluid_pipe","createch2:age_foundation/create/hand_crank","createch2:age_foundation/create/item_drain","createch2:age_foundation/create/large_water_wheel","createch2:age_foundation/create/mechanical_press","createch2:age_foundation/create/shaft","createch2:age_foundation/create/spout","createch2:age_foundation/create/water_wheel","createch2:age_foundation/create/wrench","createch2:age_foundation/foundry/basin_foundry_lid","createch2:age_foundation/foundry/brass_casing_from_foundry_brass","createch2:age_foundation/foundry/brass_foundry_batch","createch2:age_foundation/foundry/brass_sheet_from_foundry_brass","createch2:age_foundation/foundry/cast_bronze_ingot","createch2:age_foundation/foundry/molten_bronze_from_copper_tin","createch2:age_foundation/mi_bronze/boiler","createch2:age_foundation/mi_bronze/bronze_curved_plate","createch2:age_foundation/mi_bronze/compressor","createch2:age_foundation/mi_bronze/copper_bolt_from_create_cutting","createch2:age_foundation/mi_bronze/copper_curved_plate_from_create_pressing","createch2:age_foundation/mi_bronze/copper_ring_from_create_pressing","createch2:age_foundation/mi_bronze/copper_rod_from_create_cutting","createch2:age_foundation/mi_bronze/fire_clay_dust_from_create_mixing","createch2:age_foundation/mi_bronze/fluid_pipe","createch2:age_foundation/mi_bronze/item_pipe","createch2:age_foundation/mi_bronze/macerator","createch2:age_foundation/mi_bronze/machine_casing","createch2:age_foundation/mi_bronze/mixer","createch2:age_foundation/mi_bronze/tank","createch2:age_foundation/mi_bronze/water_pump","createch2:age_foundation/stone/furnace_from_tfc_raw_rock","createch2:alloy_age/astikorcartsredux/acacia_reaper","createch2:alloy_age/astikorcartsredux/acacia_seed_drill","createch2:alloy_age/astikorcartsredux/bamboo_reaper","createch2:alloy_age/astikorcartsredux/bamboo_seed_drill","createch2:alloy_age/astikorcartsredux/birch_reaper","createch2:alloy_age/astikorcartsredux/birch_seed_drill","createch2:alloy_age/astikorcartsredux/crimson_reaper","createch2:alloy_age/astikorcartsredux/crimson_seed_drill","createch2:alloy_age/astikorcartsredux/dark_oak_reaper","createch2:alloy_age/astikorcartsredux/dark_oak_seed_drill","createch2:alloy_age/astikorcartsredux/jungle_reaper","createch2:alloy_age/astikorcartsredux/jungle_seed_drill","createch2:alloy_age/astikorcartsredux/mangrove_reaper","createch2:alloy_age/astikorcartsredux/mangrove_seed_drill","createch2:alloy_age/astikorcartsredux/oak_reaper","createch2:alloy_age/astikorcartsredux/oak_seed_drill","createch2:alloy_age/astikorcartsredux/spruce_reaper","createch2:alloy_age/astikorcartsredux/spruce_seed_drill","createch2:alloy_age/astikorcartsredux/warped_reaper","createch2:alloy_age/astikorcartsredux/warped_seed_drill","createch2:alloy_age/tfcastikorcarts/reaper/acacia","createch2:alloy_age/tfcastikorcarts/reaper/ash","createch2:alloy_age/tfcastikorcarts/reaper/aspen","createch2:alloy_age/tfcastikorcarts/reaper/birch","createch2:alloy_age/tfcastikorcarts/reaper/blackwood","createch2:alloy_age/tfcastikorcarts/reaper/chestnut","createch2:alloy_age/tfcastikorcarts/reaper/douglas_fir","createch2:alloy_age/tfcastikorcarts/reaper/hickory","createch2:alloy_age/tfcastikorcarts/reaper/kapok","createch2:alloy_age/tfcastikorcarts/reaper/mangrove","createch2:alloy_age/tfcastikorcarts/reaper/maple","createch2:alloy_age/tfcastikorcarts/reaper/oak","createch2:alloy_age/tfcastikorcarts/reaper/palm","createch2:alloy_age/tfcastikorcarts/reaper/pine","createch2:alloy_age/tfcastikorcarts/reaper/rosewood","createch2:alloy_age/tfcastikorcarts/reaper/sequoia","createch2:alloy_age/tfcastikorcarts/reaper/spruce","createch2:alloy_age/tfcastikorcarts/reaper/sycamore","createch2:alloy_age/tfcastikorcarts/reaper/white_cedar","createch2:alloy_age/tfcastikorcarts/reaper/willow","createch2:alloy_age/tfcastikorcarts/seed_drill/acacia","createch2:alloy_age/tfcastikorcarts/seed_drill/ash","createch2:alloy_age/tfcastikorcarts/seed_drill/aspen","createch2:alloy_age/tfcastikorcarts/seed_drill/birch","createch2:alloy_age/tfcastikorcarts/seed_drill/blackwood","createch2:alloy_age/tfcastikorcarts/seed_drill/chestnut","createch2:alloy_age/tfcastikorcarts/seed_drill/douglas_fir","createch2:alloy_age/tfcastikorcarts/seed_drill/hickory","createch2:alloy_age/tfcastikorcarts/seed_drill/kapok","createch2:alloy_age/tfcastikorcarts/seed_drill/mangrove","createch2:alloy_age/tfcastikorcarts/seed_drill/maple","createch2:alloy_age/tfcastikorcarts/seed_drill/oak","createch2:alloy_age/tfcastikorcarts/seed_drill/palm","createch2:alloy_age/tfcastikorcarts/seed_drill/pine","createch2:alloy_age/tfcastikorcarts/seed_drill/rosewood","createch2:alloy_age/tfcastikorcarts/seed_drill/sequoia","createch2:alloy_age/tfcastikorcarts/seed_drill/spruce","createch2:alloy_age/tfcastikorcarts/seed_drill/sycamore","createch2:alloy_age/tfcastikorcarts/seed_drill/white_cedar","createch2:alloy_age/tfcastikorcarts/seed_drill/willow","createch2:alloy_age/toolbelt/pouch","createch2:arcane_chemistry/alchemistry/atomizer","createch2:arcane_chemistry/alchemistry/combiner","createch2:arcane_chemistry/alchemistry/compactor","createch2:arcane_chemistry/alchemistry/dissolver","createch2:arcane_chemistry/alchemistry/liquifier","createch2:arcane_chemistry/alchemistry/reactor_casing","createch2:arcane_chemistry/alchemistry/reactor_energy","createch2:arcane_chemistry/alchemistry/reactor_input","createch2:arcane_chemistry/alchemistry/reactor_output","createch2:backpacked/backpack","createch2:backpacked/backpack_dock","createch2:bees/create/manual_centrifuge","createch2:bees/field/bee_cage","createch2:bees/field/honey_treat","createch2:bees/first_space/breeding_chamber","createch2:bees/low_voltage/incubator","createch2:bees/planetary/heated_centrifuge","createch2:bees/stainless_digital/advanced_oak_beehive","createch2:bees/stainless_digital/me_beehive_export","createch2:bees/stainless_digital/me_centrifuge_export","createch2:bees/stainless_digital/modular_beehive_core","createch2:bees/stainless_digital/modular_centrifuge_core","createch2:bees/stainless_digital/modular_export","createch2:bees/stainless_digital/powered_centrifuge","createch2:bees/steel/sturdy_bee_cage","createch2:bronze_steam/rubberworks/sapper","createch2:buildinggadgets2/gadget_building","createch2:buildinggadgets2/gadget_copy_paste","createch2:buildinggadgets2/gadget_cut_paste","createch2:buildinggadgets2/gadget_destruction","createch2:buildinggadgets2/gadget_exchanging","createch2:cargoboats/capacity_upgrade","createch2:cargoboats/fishing_upgrade","createch2:cargoboats/fluid_motorboat","createch2:cargoboats/icebreaker_upgrade","createch2:cargoboats/lava_upgrade","createch2:cargoboats/motorboat","createch2:cargoboats/speed_upgrade","createch2:cbc_ballistics/artillery_coordinator","createch2:cbc_ballistics/ballistics_calculator","createch2:cbc_ballistics/cannon_control","createch2:cbc_ballistics/network_manager_item","createch2:cbc_ballistics/radio_item","createch2:cbc_ballistics/rangefinder","createch2:cbc_enhanced_shells/fire_control/guided_nose_cone","createch2:cbc_enhanced_shells/fire_control/target_designator","createch2:chemical_age/mekanism/basic_chemical_tank","createch2:chemical_age/mekanism/basic_pressurized_tube","createch2:chemical_age/mekanism/chemical_crystallizer","createch2:chemical_age/mekanism/chemical_dissolution_chamber","createch2:chemical_age/mekanism/chemical_infuser","createch2:chemical_age/mekanism/chemical_injection_chamber","createch2:chemical_age/mekanism/chemical_oxidizer","createch2:chemical_age/mekanism/chemical_washer","createch2:chemical_age/mekanism/electrolytic_core","createch2:chemical_age/mekanism/electrolytic_separator","createch2:chemical_age/mekanism/pressurized_reaction_chamber_assembly","createch2:chemical_age/mekanism/pressurized_reaction_chamber_workpiece","createch2:chemical_age/mekanism/purification_chamber","createch2:chemical_age/mekanism/sterile_nutritional_liquifier","createch2:chemical_age/mi/chlorine_from_geological_salt","createch2:chemical_age/mi/coal_dust_from_geological_coal","createch2:chemical_age/mi/electronic_circuit_from_chemica","createch2:chemical_age/mi/industrial_rubber_sheet_from_synthetic_rubber","createch2:chemical_age/mi/polydimethylsiloxane","createch2:chemical_age/mi/silicone_rubber","createch2:chemical_age/tfmg/electric_motor","createch2:chemical_age/tfmg/electric_pump","createch2:chemical_age/tfmg/synthetic_rubber","createch2:compact_mobile/transmission/brass_universal_joint","createch2:compact_mobile/transmission/damping_stress_bearing","createch2:compact_mobile/transmission/hydraulic_connection_head","createch2:compact_mobile/transmission/hydraulic_hinge_head","createch2:compact_mobile/transmission/hydraulic_regulator","createch2:compatibility/tfc_blast_furnace/fireproof_brick","createch2:copper_age/astikorcartsredux/acacia_animal_cart","createch2:copper_age/astikorcartsredux/acacia_hand_cart","createch2:copper_age/astikorcartsredux/acacia_plow","createch2:copper_age/astikorcartsredux/acacia_supply_cart","createch2:copper_age/astikorcartsredux/bamboo_animal_cart","createch2:copper_age/astikorcartsredux/bamboo_hand_cart","createch2:copper_age/astikorcartsredux/bamboo_plow","createch2:copper_age/astikorcartsredux/bamboo_supply_cart","createch2:copper_age/astikorcartsredux/birch_animal_cart","createch2:copper_age/astikorcartsredux/birch_hand_cart","createch2:copper_age/astikorcartsredux/birch_plow","createch2:copper_age/astikorcartsredux/birch_supply_cart","createch2:copper_age/astikorcartsredux/crimson_animal_cart","createch2:copper_age/astikorcartsredux/crimson_hand_cart","createch2:copper_age/astikorcartsredux/crimson_plow","createch2:copper_age/astikorcartsredux/crimson_supply_cart","createch2:copper_age/astikorcartsredux/dark_oak_animal_cart","createch2:copper_age/astikorcartsredux/dark_oak_hand_cart","createch2:copper_age/astikorcartsredux/dark_oak_plow","createch2:copper_age/astikorcartsredux/dark_oak_supply_cart","createch2:copper_age/astikorcartsredux/jungle_animal_cart","createch2:copper_age/astikorcartsredux/jungle_hand_cart","createch2:copper_age/astikorcartsredux/jungle_plow","createch2:copper_age/astikorcartsredux/jungle_supply_cart","createch2:copper_age/astikorcartsredux/mangrove_animal_cart","createch2:copper_age/astikorcartsredux/mangrove_hand_cart","createch2:copper_age/astikorcartsredux/mangrove_plow","createch2:copper_age/astikorcartsredux/mangrove_supply_cart","createch2:copper_age/astikorcartsredux/oak_animal_cart","createch2:copper_age/astikorcartsredux/oak_hand_cart","createch2:copper_age/astikorcartsredux/oak_plow","createch2:copper_age/astikorcartsredux/oak_supply_cart","createch2:copper_age/astikorcartsredux/spruce_animal_cart","createch2:copper_age/astikorcartsredux/spruce_hand_cart","createch2:copper_age/astikorcartsredux/spruce_plow","createch2:copper_age/astikorcartsredux/spruce_supply_cart","createch2:copper_age/astikorcartsredux/warped_animal_cart","createch2:copper_age/astikorcartsredux/warped_hand_cart","createch2:copper_age/astikorcartsredux/warped_plow","createch2:copper_age/astikorcartsredux/warped_supply_cart","createch2:copper_age/astikorcartsredux/wheel","createch2:copper_age/cookingforblockheads/cabinet","createch2:copper_age/cookingforblockheads/connector","createch2:copper_age/cookingforblockheads/cooking_table","createch2:copper_age/cookingforblockheads/counter","createch2:copper_age/cookingforblockheads/crafting_book","createch2:copper_age/cookingforblockheads/fruit_basket","createch2:copper_age/cookingforblockheads/no_filter_edition","createch2:copper_age/cookingforblockheads/recipe_book","createch2:copper_age/cookingforblockheads/tool_rack","createch2:copper_age/cookingforblockheads/white_oven","createch2:copper_age/tfcastikorcarts/animal_cart/acacia","createch2:copper_age/tfcastikorcarts/animal_cart/ash","createch2:copper_age/tfcastikorcarts/animal_cart/aspen","createch2:copper_age/tfcastikorcarts/animal_cart/birch","createch2:copper_age/tfcastikorcarts/animal_cart/blackwood","createch2:copper_age/tfcastikorcarts/animal_cart/chestnut","createch2:copper_age/tfcastikorcarts/animal_cart/douglas_fir","createch2:copper_age/tfcastikorcarts/animal_cart/hickory","createch2:copper_age/tfcastikorcarts/animal_cart/kapok","createch2:copper_age/tfcastikorcarts/animal_cart/mangrove","createch2:copper_age/tfcastikorcarts/animal_cart/maple","createch2:copper_age/tfcastikorcarts/animal_cart/oak","createch2:copper_age/tfcastikorcarts/animal_cart/palm","createch2:copper_age/tfcastikorcarts/animal_cart/pine","createch2:copper_age/tfcastikorcarts/animal_cart/rosewood","createch2:copper_age/tfcastikorcarts/animal_cart/sequoia","createch2:copper_age/tfcastikorcarts/animal_cart/spruce","createch2:copper_age/tfcastikorcarts/animal_cart/sycamore","createch2:copper_age/tfcastikorcarts/animal_cart/white_cedar","createch2:copper_age/tfcastikorcarts/animal_cart/willow","createch2:copper_age/tfcastikorcarts/hand_cart/acacia","createch2:copper_age/tfcastikorcarts/hand_cart/ash","createch2:copper_age/tfcastikorcarts/hand_cart/aspen","createch2:copper_age/tfcastikorcarts/hand_cart/birch","createch2:copper_age/tfcastikorcarts/hand_cart/blackwood","createch2:copper_age/tfcastikorcarts/hand_cart/chestnut","createch2:copper_age/tfcastikorcarts/hand_cart/douglas_fir","createch2:copper_age/tfcastikorcarts/hand_cart/hickory","createch2:copper_age/tfcastikorcarts/hand_cart/kapok","createch2:copper_age/tfcastikorcarts/hand_cart/mangrove","createch2:copper_age/tfcastikorcarts/hand_cart/maple","createch2:copper_age/tfcastikorcarts/hand_cart/oak","createch2:copper_age/tfcastikorcarts/hand_cart/palm","createch2:copper_age/tfcastikorcarts/hand_cart/pine","createch2:copper_age/tfcastikorcarts/hand_cart/rosewood","createch2:copper_age/tfcastikorcarts/hand_cart/sequoia","createch2:copper_age/tfcastikorcarts/hand_cart/spruce","createch2:copper_age/tfcastikorcarts/hand_cart/sycamore","createch2:copper_age/tfcastikorcarts/hand_cart/white_cedar","createch2:copper_age/tfcastikorcarts/hand_cart/willow","createch2:copper_age/tfcastikorcarts/plow/acacia","createch2:copper_age/tfcastikorcarts/plow/ash","createch2:copper_age/tfcastikorcarts/plow/aspen","createch2:copper_age/tfcastikorcarts/plow/birch","createch2:copper_age/tfcastikorcarts/plow/blackwood","createch2:copper_age/tfcastikorcarts/plow/chestnut","createch2:copper_age/tfcastikorcarts/plow/douglas_fir","createch2:copper_age/tfcastikorcarts/plow/hickory","createch2:copper_age/tfcastikorcarts/plow/kapok","createch2:copper_age/tfcastikorcarts/plow/mangrove","createch2:copper_age/tfcastikorcarts/plow/maple","createch2:copper_age/tfcastikorcarts/plow/oak","createch2:copper_age/tfcastikorcarts/plow/palm","createch2:copper_age/tfcastikorcarts/plow/pine","createch2:copper_age/tfcastikorcarts/plow/rosewood","createch2:copper_age/tfcastikorcarts/plow/sequoia","createch2:copper_age/tfcastikorcarts/plow/spruce","createch2:copper_age/tfcastikorcarts/plow/sycamore","createch2:copper_age/tfcastikorcarts/plow/white_cedar","createch2:copper_age/tfcastikorcarts/plow/willow","createch2:copper_age/tfcastikorcarts/supply_cart/acacia","createch2:copper_age/tfcastikorcarts/supply_cart/ash","createch2:copper_age/tfcastikorcarts/supply_cart/aspen","createch2:copper_age/tfcastikorcarts/supply_cart/birch","createch2:copper_age/tfcastikorcarts/supply_cart/blackwood","createch2:copper_age/tfcastikorcarts/supply_cart/chestnut","createch2:copper_age/tfcastikorcarts/supply_cart/douglas_fir","createch2:copper_age/tfcastikorcarts/supply_cart/hickory","createch2:copper_age/tfcastikorcarts/supply_cart/kapok","createch2:copper_age/tfcastikorcarts/supply_cart/mangrove","createch2:copper_age/tfcastikorcarts/supply_cart/maple","createch2:copper_age/tfcastikorcarts/supply_cart/oak","createch2:copper_age/tfcastikorcarts/supply_cart/palm","createch2:copper_age/tfcastikorcarts/supply_cart/pine","createch2:copper_age/tfcastikorcarts/supply_cart/rosewood","createch2:copper_age/tfcastikorcarts/supply_cart/sequoia","createch2:copper_age/tfcastikorcarts/supply_cart/spruce","createch2:copper_age/tfcastikorcarts/supply_cart/sycamore","createch2:copper_age/tfcastikorcarts/supply_cart/white_cedar","createch2:copper_age/tfcastikorcarts/supply_cart/willow","createch2:copper_age/tfcastikorcarts/wheel/acacia","createch2:copper_age/tfcastikorcarts/wheel/ash","createch2:copper_age/tfcastikorcarts/wheel/aspen","createch2:copper_age/tfcastikorcarts/wheel/birch","createch2:copper_age/tfcastikorcarts/wheel/blackwood","createch2:copper_age/tfcastikorcarts/wheel/chestnut","createch2:copper_age/tfcastikorcarts/wheel/douglas_fir","createch2:copper_age/tfcastikorcarts/wheel/hickory","createch2:copper_age/tfcastikorcarts/wheel/kapok","createch2:copper_age/tfcastikorcarts/wheel/mangrove","createch2:copper_age/tfcastikorcarts/wheel/maple","createch2:copper_age/tfcastikorcarts/wheel/oak","createch2:copper_age/tfcastikorcarts/wheel/palm","createch2:copper_age/tfcastikorcarts/wheel/pine","createch2:copper_age/tfcastikorcarts/wheel/rosewood","createch2:copper_age/tfcastikorcarts/wheel/sequoia","createch2:copper_age/tfcastikorcarts/wheel/spruce","createch2:copper_age/tfcastikorcarts/wheel/sycamore","createch2:copper_age/tfcastikorcarts/wheel/white_cedar","createch2:copper_age/tfcastikorcarts/wheel/willow","createch2:copper_age/toolbelt/belt","createch2:cosmonautics/components/copper_nozzle","createch2:cosmonautics/components/titanium_nozzle","createch2:cosmonautics/equipment/copper_anchor_boots","createch2:cosmonautics/equipment/copper_leg_thrusters","createch2:cosmonautics/equipment/jetpack","createch2:cosmonautics/hologram_block","createch2:cosmonautics/magnetic_stabilizer","createch2:cosmonautics/mechanical_crafting/booster_thruster","createch2:cosmonautics/mechanical_crafting/rocket_thruster","createch2:cosmonautics/mechanisms/rcs_thruster","createch2:cosmonautics/mechanisms/separator","createch2:cosmonautics/mechanisms/vector_thruster","createch2:cosmonautics/sputnik","createch2:cosmonautics_foundation/catalyst/pgm_atomic_alloy","createch2:cosmonautics_foundation/catalyst/regenerate_atomic_alloy","createch2:cosmonautics_foundation/megacells/accumulation_processor","createch2:cosmonautics_foundation/megacells/accumulation_processor_press","createch2:cosmonautics_foundation/megacells/cell_component_1m","createch2:cosmonautics_foundation/megacells/cell_component_4m","createch2:cosmonautics_foundation/megacells/item_storage_cell_1m","createch2:cosmonautics_foundation/megacells/item_storage_cell_4m","createch2:cosmonautics_foundation/megacells/mega_item_cell_housing","createch2:cosmonautics_foundation/megacells/printed_accumulation_processor","createch2:cosmonautics_foundation/mekanism/advanced_thermodynamic_conductor","createch2:cosmonautics_foundation/mekanism/elite_chemical_tank","createch2:cosmonautics_foundation/mekanism/elite_control_circuit","createch2:cosmonautics_foundation/mekanism/elite_mechanical_pipe","createch2:cosmonautics_foundation/mekanism/elite_pressurized_tube","createch2:cosmonautics_foundation/mi/iridium_machine_casing_pipe","createch2:cosmonautics_foundation/nuclear/alloy_plate","createch2:cosmonautics_foundation/nuclear/coolant_test_loop","createch2:cosmonautics_foundation/nuclear/dynamic_tank","createch2:cosmonautics_foundation/nuclear/dynamic_valve","createch2:cosmonautics_foundation/nuclear/elemental_fluorine","createch2:cosmonautics_foundation/nuclear/fission_casing","createch2:cosmonautics_foundation/nuclear/fission_port","createch2:cosmonautics_foundation/nuclear/mixed_plate","createch2:cosmonautics_foundation/nuclear/reactor_glass","createch2:cosmonautics_foundation/nuclear/reactor_logic_adapter","createch2:cosmonautics_foundation/nuclear/uraninite_concentrate/normal","createch2:cosmonautics_foundation/nuclear/uraninite_concentrate/poor","createch2:cosmonautics_foundation/nuclear/uraninite_concentrate/rich","createch2:cosmonautics_foundation/nuclear/uranium_oxide_precursor","createch2:cosmonautics_foundation/nuclear/waste_barrel","createch2:cosmonautics_foundation/nuclear/yellow_cake","createch2:cosmonautics_foundation/nuclear/zircon_concentrate/normal","createch2:cosmonautics_foundation/nuclear/zircon_concentrate/poor","createch2:cosmonautics_foundation/nuclear/zircon_concentrate/rich","createch2:cosmonautics_foundation/nuclear/zirconium_ingot","createch2:cosmonautics_foundation/pgm/aqua_regia_feed","createch2:cosmonautics_foundation/pgm/aqua_regia_separation","createch2:cosmonautics_foundation/pgm/chemlib_iridium_ingot","createch2:cosmonautics_foundation/pgm/iridium_dust_from_trace","createch2:cosmonautics_foundation/pgm/mi_iridium_ingot","createch2:cosmonautics_foundation/pgm/osmium_ingot","createch2:cosmonautics_foundation/pgm/palladium_ingot","createch2:cosmonautics_foundation/pgm/platinum_ingot","createch2:cosmonautics_foundation/pgm/trace_residue_centrifuge","createch2:cosmonautics_foundation/plates/iridium_plate","createch2:cosmonautics_foundation/plates/osmium_plate","createch2:cosmonautics_foundation/plates/palladium_plate","createch2:cosmonautics_foundation/plates/platinum_plate","createch2:cosmonautics_foundation/plates/zirconium_plate","createch2:cosmonautics_foundation/recycling/mixed_iridium_ingot","createch2:cosmonautics_foundation/sensor/dosimeter","createch2:cosmonautics_foundation/sensor/geiger_counter","createch2:cosmonautics_foundation/sensor/geiger_module","createch2:cosmonautics_foundation/shielding/radiation_module","createch2:create/crafting/kinetics/belt_connector","createch2:create/crafting/kinetics/elevator_pulley","createch2:create/crafting/kinetics/hose_pulley","createch2:create/pressing/bronze_plate","createch2:create/pressing/copper_plate","createch2:create/pressing/iron_plate","createch2:create/pressing/steel_plate","createch2:create/pressing/tin_plate","createch2:create/track_bulk","createch2:create_aeronautics_automated_logistics/airship_station","createch2:create_aeronautics_automated_logistics/ship_transponder","createch2:create_hypertube/hyper_accelerator_large_cogwheel","createch2:create_hypertube/hyper_accelerator_small_cogwheel","createch2:create_hypertube/hypertube_entrance","createch2:create_radar/crafting/auto_pitch_controller","createch2:create_radar/crafting/auto_yaw_controller","createch2:create_radar/crafting/fire_controller","createch2:create_radar/crafting/guided_fuze","createch2:create_radar/crafting/radar_receiver","createch2:createbigcannons/cannon_builder","createch2:createbigcannons/cannon_drill","createch2:createbigcannons/cannon_loader","createch2:createbigcannons/cannon_mount","createch2:createbigcannons/fixed_cannon_mount","createch2:createbigcannons/solid_shot","createch2:enderstorage/ender_chest","createch2:enderstorage/ender_pouch","createch2:enderstorage/ender_tank","createch2:extreme_industry/avaritia/crystal_matrix","createch2:extreme_industry/avaritia/crystal_matrix_ingot","createch2:extreme_industry/avaritia/diamond_lattice","createch2:extreme_industry/avaritia/extreme_crafting_table","createch2:extreme_industry/avaritia/neutron_collector","createch2:extreme_industry/avaritia/neutron_compressor","createch2:factory_scaling/ae2/calculation_processor_batch","createch2:factory_scaling/ae2/engineering_processor_batch","createch2:factory_scaling/ae2/logic_processor_batch","createch2:factory_scaling/aerospace/big_fuel_tank_upgrade_batch","createch2:factory_scaling/aerospace/booster_thruster_batch","createch2:factory_scaling/aerospace/magnetic_stabilizer_batch","createch2:factory_scaling/aerospace/rcs_thruster_batch","createch2:factory_scaling/aerospace/rocket_thruster_batch","createch2:factory_scaling/aerospace/stellaris_rocket_engine_mature","createch2:factory_scaling/aerospace/titanium_nozzle_batch","createch2:factory_scaling/aerospace/vector_thruster_batch","createch2:factory_scaling/chemistry/heavy_oil_lubricant_recovery","createch2:factory_scaling/components/advanced_motor_batch","createch2:factory_scaling/components/advanced_pump_batch","createch2:factory_scaling/components/highly_advanced_machine_hull","createch2:factory_scaling/components/hv_conveyor_module_batch","createch2:factory_scaling/components/hv_electric_motor_batch","createch2:factory_scaling/components/hv_electric_pump_batch","createch2:factory_scaling/components/lv_conveyor_module_batch","createch2:factory_scaling/components/lv_electric_motor_batch","createch2:factory_scaling/components/lv_electric_pump_batch","createch2:factory_scaling/components/mi_conveyor_batch","createch2:factory_scaling/components/mi_large_advanced_motor_batch","createch2:factory_scaling/components/mi_large_advanced_pump_batch","createch2:factory_scaling/components/mi_large_motor_batch","createch2:factory_scaling/components/mi_large_pump_batch","createch2:factory_scaling/components/mi_piston_batch","createch2:factory_scaling/components/mi_robot_arm_batch","createch2:factory_scaling/components/mv_conveyor_module_batch","createch2:factory_scaling/components/mv_electric_motor_batch","createch2:factory_scaling/components/mv_electric_pump_batch","createch2:factory_scaling/components/precision_mechanism_batch","createch2:factory_scaling/components/steel_mechanism_batch","createch2:factory_scaling/controls/analog_circuit_batch","createch2:factory_scaling/controls/digital_circuit_batch","createch2:factory_scaling/controls/digital_circuit_board_batch","createch2:factory_scaling/controls/electronic_circuit_batch","createch2:factory_scaling/controls/processing_unit_batch","createch2:factory_scaling/controls/processing_unit_board_batch","createch2:factory_scaling/controls/quantum_circuit_board_batch","createch2:factory_scaling/factory_control/machine_chainer","createch2:factory_scaling/factory_control/machine_chainer_relay","createch2:factory_scaling/logistics/advanced_item_input_hatch","createch2:factory_scaling/logistics/advanced_item_output_hatch","createch2:factory_scaling/machines/electric_compressor_batch","createch2:factory_scaling/machines/electric_macerator_batch","createch2:factory_scaling/mass_processing/large_electric_macerator","createch2:factory_scaling/mass_processing/large_steam_macerator","createch2:factory_scaling/mass_processing/processing_array","createch2:factory_scaling/materials/titanium_chloride_batch","createch2:factory_scaling/materials/titanium_hot_ingot_batch","createch2:factory_scaling/materials/titanium_ingot_batch","createch2:factory_scaling/nuclear/electromagnetic_coil_batch","createch2:factory_scaling/nuclear/empty_heat_sink_batch","createch2:factory_scaling/nuclear/fission_fuel_assembly_batch","createch2:factory_scaling/nuclear/nuclear_alloy_plate_batch","createch2:factory_scaling/nuclear/saturating_condenser_batch","createch2:factory_scaling/nuclear/turbine_blade_batch","createch2:factory_scaling/nuclear/turbine_rotor_batch","createch2:factory_scaling/nuclear/uranium_fuel_rod_batch","createch2:factory_scaling/pgm/industrial_feed_batch","createch2:factory_scaling/pgm/industrial_separation_batch","createch2:factory_scaling/pgm/mixed_concentrate_batch","createch2:factory_scaling/quantum/naquadah_refining_batch","createch2:factory_scaling/quantum/quantum_circuit_batch","createch2:factory_scaling/quantum/stargate_base_block_batch","createch2:factory_scaling/quantum/stargate_chevron_block_batch","createch2:factory_scaling/quantum/stargate_communication_crystal_batch","createch2:factory_scaling/quantum/stargate_control_crystal_batch","createch2:factory_scaling/quantum/stargate_crystal_base_batch","createch2:factory_scaling/quantum/stargate_ring_block_batch","createch2:factory_scaling/quantum/stargate_stargate_variant_crystal_batch","createch2:factory_scaling/quantum/stargate_transfer_crystal_batch","createch2:factory_scaling/quantum/superconductor_coil_batch","createch2:factory_scaling/quantum/superconductor_dust_mature","createch2:farmersdelight/salvaging/quartz_block","createch2:first_space/fuel/tfmg_diesel_to_stellaris_fuel","createch2:first_space/fuel/tfmg_gasoline_to_stellaris_fuel","createch2:first_space/fuel/tfmg_kerosene_to_stellaris_fuel","createch2:first_space/stellaris/battery_lv","createch2:first_space/stellaris/big_oxygen_tank_lv","createch2:first_space/stellaris/cable_lv","createch2:first_space/stellaris/coal_generator_moon_base","createch2:first_space/stellaris/engine_fan_lv","createch2:first_space/stellaris/fuel_refinery_lv","createch2:first_space/stellaris/oxygen_distributor_lv","createch2:first_space/stellaris/oxygen_tank_lv","createch2:first_space/stellaris/radioactive_generator_space_gated","createch2:first_space/stellaris/rocket_airframe_lv","createch2:first_space/stellaris/rocket_engine_lv","createch2:first_space/stellaris/rocket_fin_lv","createch2:first_space/stellaris/rocket_final_assembly","createch2:first_space/stellaris/rocket_launch_pad_lv","createch2:first_space/stellaris/rocket_nose_cone_lv","createch2:first_space/stellaris/rocket_station_lv","createch2:first_space/stellaris/rover_lv","createch2:first_space/stellaris/solar_panel_moon_base","createch2:first_space/stellaris/spacesuit_boots_lv","createch2:first_space/stellaris/spacesuit_chestplate_lv","createch2:first_space/stellaris/spacesuit_helmet_lv","createch2:first_space/stellaris/spacesuit_leggings_lv","createch2:first_space/stellaris/water_pump_lv","createch2:first_space/stellaris/water_separator_lv","createch2:fluid_compat/chemica_chlorine_to_mi","createch2:fluid_compat/chemica_hydrochloric_acid_to_mi","createch2:fluid_compat/chemica_methane_to_mi","createch2:fluid_compat/chemica_polyethylene_to_mi","createch2:fluid_compat/chemica_polyvinyl_chloride_to_mi","createch2:fluid_compat/mek_ethene_to_mi_ethylene","createch2:fluid_compat/mek_hydrogen_to_mi","createch2:fluid_compat/mek_sulfuric_acid_to_mi","createch2:fluid_compat/mi_diesel_to_tfmg","createch2:fluid_compat/mi_ethylene_to_mek_ethene","createch2:fluid_compat/mi_ethylene_to_tfmg","createch2:fluid_compat/mi_hydrogen_to_mek","createch2:fluid_compat/mi_hydrogen_to_tfmg","createch2:fluid_compat/mi_lubricant_to_tfmg_lubrication_oil","createch2:fluid_compat/mi_naphtha_to_tfmg","createch2:fluid_compat/mi_sulfuric_acid_to_mek","createch2:fluid_compat/mi_sulfuric_acid_to_tfmg","createch2:fluid_compat/tfmg_diesel_to_mi","createch2:fluid_compat/tfmg_ethylene_to_mi","createch2:fluid_compat/tfmg_hydrogen_to_mi","createch2:fluid_compat/tfmg_lubrication_oil_to_mi_lubricant","createch2:fluid_compat/tfmg_naphtha_to_mi","createch2:fluid_compat/tfmg_sulfuric_acid_to_mi","createch2:greate/belts/polybenzimidazole","createch2:greate/belts/polyethylene","createch2:greate/belts/polytetrafluoroethylene","createch2:greate/belts/rubber","createch2:greate/belts/silicone_rubber","createch2:greate/factory/wire_coating_controller","createch2:greate/polymers/chloroform","createch2:greate/polymers/nitration_mixture","createch2:greate/polymers/polytetrafluoroethylene","createch2:greate/polymers/pvc_foil","createch2:greate/polymers/pvc_plate","createch2:greate/polymers/sulfuric_acid_recovery","createch2:greate/polymers/tetrafluoroethylene","createch2:greate/suppliers/biology_bio_chaff","createch2:greate/suppliers/biology_biomass","createch2:greate/suppliers/biology_calcite","createch2:greate/suppliers/biology_calcium","createch2:greate/suppliers/biology_distilled_water","createch2:greate/suppliers/biology_meat","createch2:greate/suppliers/biology_plant_ball","createch2:greate/suppliers/computation_stainless_screw","createch2:greate/suppliers/computation_stainless_tiny_pipe","createch2:greate/suppliers/computation_tiny_pipe_mold","createch2:greate/suppliers/copper_element_feed","createch2:greate/suppliers/darmstadtium_compaction","createch2:greate/suppliers/darmstadtium_fusion","createch2:greate/suppliers/darmstadtium_plate","createch2:greate/suppliers/darmstadtium_reduction","createch2:greate/suppliers/lithium_crushed_stock","createch2:greate/suppliers/luv_hull","createch2:greate/suppliers/naquadah_alloy","createch2:greate/suppliers/naquadah_alloy_plate","createch2:greate/suppliers/naquadah_alloy_reprocessing","createch2:greate/suppliers/naquadah_billet","createch2:greate/suppliers/neodymium_element_feed","createch2:greate/suppliers/neuro_pbi_pipe","createch2:greate/suppliers/neuro_pipe_small_mold","createch2:greate/suppliers/neuro_plate_mold","createch2:greate/suppliers/neuro_silicone_foil","createch2:greate/suppliers/neuro_silicone_plate","createch2:greate/suppliers/neuro_tungsten_steel_bolt","createch2:greate/suppliers/neutronium_conditioning","createch2:greate/suppliers/neutronium_plate","createch2:greate/suppliers/osmium_ordinary_stock","createch2:greate/suppliers/platinum_fine_wire","createch2:greate/suppliers/rhodium_compaction","createch2:greate/suppliers/rhodium_fusion","createch2:greate/suppliers/rpp_blend","createch2:greate/suppliers/rpp_plate","createch2:greate/suppliers/rpp_reduction","createch2:greate/suppliers/steel_foundry_melting","createch2:greate/suppliers/steel_reprocessing","createch2:greate/suppliers/sulfur_element_feed","createch2:greate/suppliers/tin_element_feed","createch2:greate/suppliers/trinium_billet","createch2:greate/suppliers/tungsten_steel_plate","createch2:greate/suppliers/tungsten_steel_refining","createch2:greate/suppliers/tungsten_steel_reprocessing","createch2:greate/suppliers/uhv_hull","createch2:greate/suppliers/uraninite_recovery_normal","createch2:greate/suppliers/uraninite_recovery_poor","createch2:greate/suppliers/uraninite_recovery_rich","createch2:greate/suppliers/uv_hull","createch2:greate/suppliers/uv_uu_matter_bucket","createch2:greate/suppliers/vanadium_mineral_consolidation","createch2:greate/suppliers/wetware_cylinder_mold","createch2:greate/suppliers/wetware_luv_autoclave","createch2:greate/suppliers/wetware_luv_brewery","createch2:greate/suppliers/wetware_luv_centrifuge","createch2:greate/suppliers/wetware_luv_distillery","createch2:greate/suppliers/wetware_luv_fluid_heater","createch2:greate/suppliers/wetware_luv_mixer","createch2:greate/suppliers/wetware_pbi_foil","createch2:greate/suppliers/wetware_pbi_plate","createch2:greate/suppliers/wetware_petri_dish","createch2:greate/suppliers/wetware_sterilizing_filter_casing","createch2:greate/suppliers/wetware_uv_1a_energy_converter","createch2:greate/suppliers/wetware_uv_energy_input_hatch","createch2:greate/suppliers/wetware_zpm_1a_energy_converter","createch2:greate/suppliers/wetware_zpm_circuit_assembler","createch2:greate/suppliers/zinc_plate","createch2:greate/suppliers/zpm_hull","createch2:greate/tier_0/andesite_plate","createch2:greate/tier_0/cogwheel","createch2:greate/tier_0/crushing_wheel","createch2:greate/tier_0/encased_fan","createch2:greate/tier_0/gearbox","createch2:greate/tier_0/horizontal_gearbox","createch2:greate/tier_0/large_cogwheel","createch2:greate/tier_0/mechanical_mixer","createch2:greate/tier_0/mechanical_pump","createch2:greate/tier_0/mechanical_saw","createch2:greate/tier_0/millstone","createch2:greate/tier_0/shaft_cutting","createch2:greate/tier_0/vertical_gearbox","createch2:greate/tier_1/cogwheel","createch2:greate/tier_1/crushing_wheel","createch2:greate/tier_1/encased_fan","createch2:greate/tier_1/gearbox","createch2:greate/tier_1/horizontal_gearbox","createch2:greate/tier_1/large_cogwheel","createch2:greate/tier_1/mechanical_mixer","createch2:greate/tier_1/mechanical_press","createch2:greate/tier_1/mechanical_pump","createch2:greate/tier_1/mechanical_saw","createch2:greate/tier_1/millstone","createch2:greate/tier_1/shaft_cutting","createch2:greate/tier_1/vertical_gearbox","createch2:greate/tier_2/cogwheel","createch2:greate/tier_2/crushing_wheel","createch2:greate/tier_2/encased_fan","createch2:greate/tier_2/gearbox","createch2:greate/tier_2/horizontal_gearbox","createch2:greate/tier_2/large_cogwheel","createch2:greate/tier_2/mechanical_mixer","createch2:greate/tier_2/mechanical_press","createch2:greate/tier_2/mechanical_pump","createch2:greate/tier_2/mechanical_saw","createch2:greate/tier_2/millstone","createch2:greate/tier_2/shaft_cutting","createch2:greate/tier_2/vertical_gearbox","createch2:greate/tier_3/cogwheel","createch2:greate/tier_3/crushing_wheel","createch2:greate/tier_3/encased_fan","createch2:greate/tier_3/gearbox","createch2:greate/tier_3/horizontal_gearbox","createch2:greate/tier_3/large_cogwheel","createch2:greate/tier_3/mechanical_mixer","createch2:greate/tier_3/mechanical_press","createch2:greate/tier_3/mechanical_pump","createch2:greate/tier_3/mechanical_saw","createch2:greate/tier_3/millstone","createch2:greate/tier_3/shaft_cutting","createch2:greate/tier_3/vertical_gearbox","createch2:greate/tier_4/cogwheel","createch2:greate/tier_4/crushing_wheel","createch2:greate/tier_4/encased_fan","createch2:greate/tier_4/gearbox","createch2:greate/tier_4/horizontal_gearbox","createch2:greate/tier_4/large_cogwheel","createch2:greate/tier_4/mechanical_mixer","createch2:greate/tier_4/mechanical_press","createch2:greate/tier_4/mechanical_pump","createch2:greate/tier_4/mechanical_saw","createch2:greate/tier_4/millstone","createch2:greate/tier_4/shaft_cutting","createch2:greate/tier_4/vertical_gearbox","createch2:greate/tier_5/cogwheel","createch2:greate/tier_5/crushing_wheel","createch2:greate/tier_5/encased_fan","createch2:greate/tier_5/gearbox","createch2:greate/tier_5/horizontal_gearbox","createch2:greate/tier_5/large_cogwheel","createch2:greate/tier_5/mechanical_mixer","createch2:greate/tier_5/mechanical_press","createch2:greate/tier_5/mechanical_pump","createch2:greate/tier_5/mechanical_saw","createch2:greate/tier_5/millstone","createch2:greate/tier_5/shaft_cutting","createch2:greate/tier_5/vertical_gearbox","createch2:greate/tier_6/cogwheel","createch2:greate/tier_6/crushing_wheel","createch2:greate/tier_6/encased_fan","createch2:greate/tier_6/gearbox","createch2:greate/tier_6/horizontal_gearbox","createch2:greate/tier_6/large_cogwheel","createch2:greate/tier_6/mechanical_mixer","createch2:greate/tier_6/mechanical_press","createch2:greate/tier_6/mechanical_pump","createch2:greate/tier_6/mechanical_saw","createch2:greate/tier_6/millstone","createch2:greate/tier_6/shaft_cutting","createch2:greate/tier_6/vertical_gearbox","createch2:greate/tier_7/cogwheel","createch2:greate/tier_7/crushing_wheel","createch2:greate/tier_7/encased_fan","createch2:greate/tier_7/gearbox","createch2:greate/tier_7/horizontal_gearbox","createch2:greate/tier_7/large_cogwheel","createch2:greate/tier_7/mechanical_mixer","createch2:greate/tier_7/mechanical_press","createch2:greate/tier_7/mechanical_pump","createch2:greate/tier_7/mechanical_saw","createch2:greate/tier_7/millstone","createch2:greate/tier_7/shaft_cutting","createch2:greate/tier_7/vertical_gearbox","createch2:greate/tier_8/cogwheel","createch2:greate/tier_8/crushing_wheel","createch2:greate/tier_8/encased_fan","createch2:greate/tier_8/gearbox","createch2:greate/tier_8/horizontal_gearbox","createch2:greate/tier_8/large_cogwheel","createch2:greate/tier_8/mechanical_mixer","createch2:greate/tier_8/mechanical_press","createch2:greate/tier_8/mechanical_pump","createch2:greate/tier_8/mechanical_saw","createch2:greate/tier_8/millstone","createch2:greate/tier_8/shaft_cutting","createch2:greate/tier_8/vertical_gearbox","createch2:greate/tier_9/cogwheel","createch2:greate/tier_9/crushing_wheel","createch2:greate/tier_9/encased_fan","createch2:greate/tier_9/gearbox","createch2:greate/tier_9/horizontal_gearbox","createch2:greate/tier_9/large_cogwheel","createch2:greate/tier_9/mechanical_mixer","createch2:greate/tier_9/mechanical_press","createch2:greate/tier_9/mechanical_pump","createch2:greate/tier_9/mechanical_saw","createch2:greate/tier_9/millstone","createch2:greate/tier_9/shaft_cutting","createch2:greate/tier_9/vertical_gearbox","createch2:greg_gateway/assembly_line/acetic_acid","createch2:greg_gateway/assembly_line/butyraldehyde","createch2:greg_gateway/assembly_line/laminated_glass","createch2:greg_gateway/assembly_line/polyvinyl_acetate","createch2:greg_gateway/assembly_line/polyvinyl_butyral","createch2:greg_gateway/assembly_line/polyvinyl_butyral_plate","createch2:greg_gateway/assembly_line/single_input_bus","createch2:greg_gateway/assembly_line/tempered_glass","createch2:greg_gateway/assembly_line/vinyl_acetate","createch2:greg_gateway/cleanroom/controller","createch2:greg_gateway/cleanroom/filter_casing","createch2:greg_gateway/cleanroom/glass","createch2:greg_gateway/cleanroom/plascrete","createch2:greg_gateway/energy/iv_1a_bridge","createch2:greg_gateway/machine/iv_circuit_assembler","createch2:greg_gateway/machine/iv_laser_engraver","createch2:greg_gateway/machine/iv_scanner","createch2:greg_gateway/multiblock/iv_energy_input_hatch","createch2:greg_gateway/multiblock/iv_input_bus","createch2:greg_gateway/multiblock/iv_input_hatch","createch2:greg_gateway/multiblock/iv_output_bus","createch2:greg_gateway/multiblock/iv_output_hatch","createch2:greg_gateway/multiblock/maintenance_hatch","createch2:greg_gateway/research/computer_casing","createch2:greg_gateway/research/computer_heat_vent","createch2:greg_shared/boards/phenolic","createch2:greg_shared/boards/phenolic_printed","createch2:greg_shared/control/lv_emitter","createch2:greg_shared/control/lv_field_generator","createch2:greg_shared/control/lv_sensor","createch2:greg_shared/electronics/capacitor","createch2:greg_shared/electronics/diode","createch2:greg_shared/electronics/resistor","createch2:greg_shared/electronics/transistor","createch2:greg_shared/electronics/vacuum_tube","createch2:greg_shared/motion/lv_conveyor","createch2:greg_shared/motion/lv_motor","createch2:greg_shared/motion/lv_pump","createch2:greg_shared/motion/lv_robot_arm","createch2:gtceu/rubber_wood/button","createch2:gtceu/rubber_wood/door","createch2:gtceu/rubber_wood/fence","createch2:gtceu/rubber_wood/fence_gate","createch2:gtceu/rubber_wood/planks","createch2:gtceu/rubber_wood/pressure_plate","createch2:gtceu/rubber_wood/slab","createch2:gtceu/rubber_wood/stairs","createch2:gtceu/rubber_wood/stripped_wood","createch2:gtceu/rubber_wood/trapdoor","createch2:gtceu/rubber_wood/wood","createch2:heavy_industry/railcraft/coke_oven_bricks","createch2:heavy_industry/rubberworks/compressor","createch2:heavy_industry/tfmg/distillation_controller","createch2:heavy_industry/tfmg/distillation_output","createch2:heavy_industry/tfmg/naphtha_cast_iron_vat","createch2:heavy_industry/tfmg/oil_can","createch2:heavy_industry/tfmg/oil_hammer","createch2:heavy_industry/tfmg/process_gas_coking","createch2:heavy_industry/tfmg/pumpjack_base","createch2:heavy_industry/tfmg/pumpjack_crank","createch2:heavy_industry/tfmg/pumpjack_hammer","createch2:heavy_industry/tfmg/pumpjack_hammer_connector","createch2:heavy_industry/tfmg/pumpjack_hammer_head","createch2:heavy_industry/tfmg/steel_chemical_vat","createch2:heavy_industry/tfmg/steel_fluid_tank","createch2:heavy_industry/tfmg/sulfuric_acid_tfc_minerals","createch2:high_pressure/mekanism/advanced_chemical_tank","createch2:high_pressure/mekanism/advanced_pressurized_tube","createch2:high_pressure/mekanism/osmium_compressor","createch2:high_pressure/mi/implosion_compressor","createch2:high_pressure/mi/vacuum_freezer","createch2:high_pressure/pgm/electrolysis","createch2:high_pressure/pgm/mixed_concentrate","createch2:high_pressure/pgm/platinum_hot_ingot","createch2:high_pressure/pgm/platinum_ingot","createch2:high_pressure/pgm/purified_solution","createch2:high_pressure/shield_generators/shield_generator","createch2:high_pressure/stellaris/big_fuel_tank_upgrade","createch2:high_pressure/stellaris/big_rocket_upgrade","createch2:high_pressure/stellaris/corronium_ingot","createch2:high_pressure/stellaris/jet_suit_boots","createch2:high_pressure/stellaris/jet_suit_chestplate","createch2:high_pressure/stellaris/jet_suit_helmet","createch2:high_pressure/stellaris/jet_suit_leggings","createch2:high_pressure/stellaris/normal_rocket_upgrade","createch2:high_pressure/stellaris/solerium_ingot","createch2:high_pressure/titanium/chloride_sponge","createch2:high_pressure/titanium/hot_ingot","createch2:high_pressure/titanium/rutile_concentrate/normal","createch2:high_pressure/titanium/rutile_concentrate/poor","createch2:high_pressure/titanium/rutile_concentrate/rich","createch2:high_pressure/titanium/vacuum_refine_ingot","createch2:high_pressure/travelanchors/travel_anchor","createch2:high_pressure/travelanchors/travel_staff","createch2:hni/electric_simulation_chamber","createch2:hni/large_loot_fabricator","createch2:hni/large_simulation_chamber","createch2:hni/mono_loot_fabricator","createch2:hni/prediction_machine_casing","createch2:hnn/blank_data_model","createch2:hnn/deep_learner","createch2:hnn/loot_fabricator","createch2:hnn/prediction_matrix","createch2:hnn/sim_chamber","createch2:infinity/armor/boots","createch2:infinity/armor/chestplate","createch2:infinity/armor/elytra","createch2:infinity/armor/helmet","createch2:infinity/armor/pants","createch2:infinity/creative/ae2_energy_cell","createch2:infinity/creative/mekanism_bin","createch2:infinity/creative/mekanism_chemical_tank","createch2:infinity/creative/mekanism_fluid_tank","createch2:infinity/culture/record_fragment","createch2:infinity/end/endest_pearl","createch2:infinity/equipment/axe","createch2:infinity/equipment/bow","createch2:infinity/equipment/crossbow","createch2:infinity/equipment/hoe","createch2:infinity/equipment/mace","createch2:infinity/equipment/pickaxe","createch2:infinity/equipment/shield","createch2:infinity/equipment/shovel","createch2:infinity/equipment/sword","createch2:infinity/equipment/trident","createch2:infinity/eternal_singularity","createch2:infinity/food/cosmic_meatballs","createch2:infinity/food/ultimate_stew","createch2:infinity/infinity/ingot","createch2:infinity/infinity/upgrade","createch2:infinity/infinity_catalyst","createch2:infinity/infinity_catalyst_opv_recovery","createch2:infinity/materials/infinity_ingot_from_nuggets","createch2:infinity/materials/infinity_nugget_from_ingot","createch2:infinity/neutron/gear","createch2:infinity/neutron/ring","createch2:infinity/power/star_fuel","createch2:infinity/utility/bucket","createch2:infinity/utility/chest","createch2:infinity/utility/clock","createch2:infinity/utility/totem","createch2:infinity/utility/umbrella","createch2:low_voltage/create/cutting/copper_wire_bootstrap","createch2:low_voltage/create/cutting/tin_wire_bootstrap","createch2:low_voltage/create/pressing/battery_alloy_curved_plate_bootstrap","createch2:low_voltage/create/pressing/battery_alloy_plate_bootstrap","createch2:low_voltage/mi/assembler_prototype","createch2:low_voltage/mi/basic_motor_prototype","createch2:low_voltage/mi/basic_motor_standard_assembly","createch2:low_voltage/mi/basic_pump_prototype","createch2:low_voltage/mi/basic_pump_standard_assembly","createch2:low_voltage/mi/electric_compressor_prototype","createch2:low_voltage/mi/electric_macerator_prototype","createch2:low_voltage/mi/electric_water_pump_prototype","createch2:low_voltage/mi/industrial_rubber_sheet_from_natural_rubber","createch2:low_voltage/mi/magnetic_steel_rod_from_tfmg_lamination","createch2:material_recycling/greate_aluminum/aluminium_cogwheel","createch2:material_recycling/greate_aluminum/aluminium_crushing_wheel","createch2:material_recycling/greate_aluminum/aluminium_encased_fan","createch2:material_recycling/greate_aluminum/aluminium_gearbox","createch2:material_recycling/greate_aluminum/aluminium_mechanical_mixer","createch2:material_recycling/greate_aluminum/aluminium_mechanical_press","createch2:material_recycling/greate_aluminum/aluminium_mechanical_pump","createch2:material_recycling/greate_aluminum/aluminium_mechanical_saw","createch2:material_recycling/greate_aluminum/aluminium_millstone","createch2:material_recycling/greate_aluminum/aluminium_shaft","createch2:material_recycling/greate_aluminum/aluminium_vertical_gearbox","createch2:material_recycling/greate_aluminum/large_aluminium_cogwheel","createch2:material_recycling/greate_darmstadtium/darmstadtium_cogwheel","createch2:material_recycling/greate_darmstadtium/darmstadtium_crushing_wheel","createch2:material_recycling/greate_darmstadtium/darmstadtium_encased_fan","createch2:material_recycling/greate_darmstadtium/darmstadtium_gearbox","createch2:material_recycling/greate_darmstadtium/darmstadtium_mechanical_mixer","createch2:material_recycling/greate_darmstadtium/darmstadtium_mechanical_press","createch2:material_recycling/greate_darmstadtium/darmstadtium_mechanical_pump","createch2:material_recycling/greate_darmstadtium/darmstadtium_mechanical_saw","createch2:material_recycling/greate_darmstadtium/darmstadtium_millstone","createch2:material_recycling/greate_darmstadtium/darmstadtium_shaft","createch2:material_recycling/greate_darmstadtium/darmstadtium_vertical_gearbox","createch2:material_recycling/greate_darmstadtium/large_darmstadtium_cogwheel","createch2:material_recycling/greate_naquadah_alloy/large_naquadah_alloy_cogwheel","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_cogwheel","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_crushing_wheel","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_encased_fan","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_gearbox","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_mechanical_mixer","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_mechanical_press","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_mechanical_pump","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_mechanical_saw","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_millstone","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_shaft","createch2:material_recycling/greate_naquadah_alloy/naquadah_alloy_vertical_gearbox","createch2:material_recycling/greate_neutronium/large_neutronium_cogwheel","createch2:material_recycling/greate_neutronium/neutronium_cogwheel","createch2:material_recycling/greate_neutronium/neutronium_crushing_wheel","createch2:material_recycling/greate_neutronium/neutronium_encased_fan","createch2:material_recycling/greate_neutronium/neutronium_gearbox","createch2:material_recycling/greate_neutronium/neutronium_mechanical_mixer","createch2:material_recycling/greate_neutronium/neutronium_mechanical_press","createch2:material_recycling/greate_neutronium/neutronium_mechanical_pump","createch2:material_recycling/greate_neutronium/neutronium_mechanical_saw","createch2:material_recycling/greate_neutronium/neutronium_millstone","createch2:material_recycling/greate_neutronium/neutronium_shaft","createch2:material_recycling/greate_neutronium/neutronium_vertical_gearbox","createch2:material_recycling/greate_rhodium_plated_palladium/large_rhodium_plated_palladium_cogwheel","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_cogwheel","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_crushing_wheel","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_encased_fan","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_gearbox","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_mechanical_mixer","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_mechanical_press","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_mechanical_pump","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_mechanical_saw","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_millstone","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_shaft","createch2:material_recycling/greate_rhodium_plated_palladium/rhodium_plated_palladium_vertical_gearbox","createch2:material_recycling/greate_stainless_steel/large_stainless_steel_cogwheel","createch2:material_recycling/greate_stainless_steel/stainless_steel_cogwheel","createch2:material_recycling/greate_stainless_steel/stainless_steel_crushing_wheel","createch2:material_recycling/greate_stainless_steel/stainless_steel_encased_fan","createch2:material_recycling/greate_stainless_steel/stainless_steel_gearbox","createch2:material_recycling/greate_stainless_steel/stainless_steel_mechanical_mixer","createch2:material_recycling/greate_stainless_steel/stainless_steel_mechanical_press","createch2:material_recycling/greate_stainless_steel/stainless_steel_mechanical_pump","createch2:material_recycling/greate_stainless_steel/stainless_steel_mechanical_saw","createch2:material_recycling/greate_stainless_steel/stainless_steel_millstone","createch2:material_recycling/greate_stainless_steel/stainless_steel_shaft","createch2:material_recycling/greate_stainless_steel/stainless_steel_vertical_gearbox","createch2:material_recycling/greate_steel/large_steel_cogwheel","createch2:material_recycling/greate_steel/steel_cogwheel","createch2:material_recycling/greate_steel/steel_crushing_wheel","createch2:material_recycling/greate_steel/steel_encased_fan","createch2:material_recycling/greate_steel/steel_gearbox","createch2:material_recycling/greate_steel/steel_mechanical_mixer","createch2:material_recycling/greate_steel/steel_mechanical_press","createch2:material_recycling/greate_steel/steel_mechanical_pump","createch2:material_recycling/greate_steel/steel_mechanical_saw","createch2:material_recycling/greate_steel/steel_millstone","createch2:material_recycling/greate_steel/steel_shaft","createch2:material_recycling/greate_steel/steel_vertical_gearbox","createch2:material_recycling/greate_titanium/large_titanium_cogwheel","createch2:material_recycling/greate_titanium/titanium_cogwheel","createch2:material_recycling/greate_titanium/titanium_crushing_wheel","createch2:material_recycling/greate_titanium/titanium_encased_fan","createch2:material_recycling/greate_titanium/titanium_gearbox","createch2:material_recycling/greate_titanium/titanium_mechanical_mixer","createch2:material_recycling/greate_titanium/titanium_mechanical_press","createch2:material_recycling/greate_titanium/titanium_mechanical_pump","createch2:material_recycling/greate_titanium/titanium_mechanical_saw","createch2:material_recycling/greate_titanium/titanium_millstone","createch2:material_recycling/greate_titanium/titanium_shaft","createch2:material_recycling/greate_titanium/titanium_vertical_gearbox","createch2:material_recycling/greate_tungsten_steel/large_tungsten_steel_cogwheel","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_cogwheel","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_crushing_wheel","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_encased_fan","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_gearbox","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_mechanical_mixer","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_mechanical_press","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_mechanical_pump","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_mechanical_saw","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_millstone","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_shaft","createch2:material_recycling/greate_tungsten_steel/tungsten_steel_vertical_gearbox","createch2:materials/galena/concentrating/crushed","createch2:materials/galena/crushing/normal","createch2:materials/galena/crushing/poor","createch2:materials/galena/crushing/rich","createch2:materials/galena/crushing/small","createch2:mekanism/advanced_control_circuit_gem_lattice","createch2:mekanism/energy_tablet","createch2:mekanism/hdpe_rod_from_rubber_sheet","createch2:mekanism/hdpe_stick_from_rubber","createch2:mekanism/jetpack_armored_refined_glowstone","createch2:mekanism/jetpack_glowstone","createch2:mekanism/portable_teleporter","createch2:mekanism/steel_casing","createch2:mekanism/teleportation_core","createch2:mekanism/teleporter","createch2:mekanism/teleporter_frame","createch2:mekanism/transmitter/logistical_transporter/basic","createch2:mekanism/transmitter/mechanical_pipe/basic","createch2:minecraft/activator_rail_bulk","createch2:minecraft/crafter","createch2:minecraft/detector_rail_bulk","createch2:minecraft/lodestone","createch2:minecraft/powered_rail_bulk","createch2:minecraft/rail_bulk","createch2:minecraft/suspicious_sand_from_brushing_sand","createch2:modern_industrialization/analog_circuit_tfmg_entry","createch2:modern_industrialization/basic_machine_hull_tfmg_entry","createch2:modern_industrialization/electronic_circuit_gem_lattice","createch2:modern_industrialization/steel_machine_casing_tfmg_entry","createch2:nuclear/ae2/wireless_access_point","createch2:nuclear/ae2/wireless_terminal","createch2:nuclear/alchemistry/fission_chamber_controller","createch2:nuclear/alchemistry/fission_core","createch2:nuclear/crowns/compressor","createch2:nuclear/crowns/fuel_assembly","createch2:nuclear/crowns/fuel_rod","createch2:nuclear/crowns/heat_exchanger","createch2:nuclear/crowns/steam_collector","createch2:nuclear/crowns/steam_input","createch2:nuclear/crowns/turbine_casing","createch2:nuclear/crowns/turbine_stage","createch2:nuclear/fuel/uranium_fuel_rod","createch2:nuclear/fuel/uranium_fuel_rod_double","createch2:nuclear/fuel/uranium_fuel_rod_quad","createch2:nuclear/fusion_prep/deuterium_trace","createch2:nuclear/mekanism/isotopic_centrifuge","createch2:nuclear/mekanism/solar_neutron_activator","createch2:nuclear/national_chemical_complex/bulk_synthetic_rubber","createch2:nuclear/reprocessing/plutonium_from_waste","createch2:nuclear/reprocessing/plutonium_pellet","createch2:nuclear/reprocessing/recovered_fissile_fuel","createch2:nuclear/reprocessing/spent_fuel_fragment","createch2:nuclear/turbine/blade","createch2:nuclear/turbine/casing","createch2:nuclear/turbine/electromagnetic_coil","createch2:nuclear/turbine/rotational_complex","createch2:nuclear/turbine/rotor","createch2:nuclear/turbine/saturating_condenser","createch2:nuclear/turbine/valve","createch2:nuclear/turbine/vent","createch2:nuclear/uranium/depleted_fraction","createch2:nuclear/uranium/enrichment_cascade","createch2:nuclear/uranium/fissile_fuel","createch2:nuclear/uranium/fuel_pellet","createch2:nuclear/uranium/hexafluoride_feedstock","createch2:nuclear/uranium/uranium_235_dust","createch2:process_facilities/metallurgy/electric_blast_furnace","createch2:process_facilities/separation/distillation_tower","createch2:process_facilities/thermal/large_electric_furnace","createch2:process_facilities/thermal/large_steam_furnace","createch2:process_facilities/transport/advanced_fluid_input_from_other","createch2:process_facilities/transport/advanced_fluid_input_hatch","createch2:process_facilities/transport/advanced_fluid_output_from_other","createch2:process_facilities/transport/advanced_fluid_output_hatch","createch2:process_facilities/transport/advanced_item_input_from_other","createch2:process_facilities/transport/advanced_item_output_from_other","createch2:process_facilities/transport/large_tank","createch2:process_facilities/transport/large_tank_hatch","createch2:productivebees/quarry_bee","createch2:qol/backpacked/unlock_token","createch2:qol/minecraft/bundle","createch2:qol/minecraft/scaffolding_bulk","createch2:qol/minecraft/slime_ball_from_dough","createch2:qol/minecraft/torch_double_stick","createch2:quantum/ae2/quantum_link_assembly","createch2:quantum/ae2/quantum_link_workpiece","createch2:quantum/ae2wtlib/quantum_bridge_card","createch2:quantum/alchemistry/fusion_chamber_controller","createch2:quantum/alchemistry/fusion_core","createch2:quantum/fusion/chamber","createch2:quantum/fusion/plasma_turbine","createch2:quantum/fusion/reactor_assembly","createch2:quantum/fusion/reactor_workpiece","createch2:quantum/fusion/tfmg_generator","createch2:quantum/machine/plasma_handling_casing","createch2:quantum/machine/quantum_machine_casing","createch2:quantum/machine/quantum_machine_hull","createch2:quantum/machine/quantum_upgrade","createch2:quantum/matter/controlled_singularity","createch2:quantum/matter/replicator","createch2:quantum/matter/uu_matter_from_singularity","createch2:quantum/mekanism/module_teleportation_unit","createch2:quantum/power/plutonium_battery","createch2:quantum/sgjourney/classic_base_block","createch2:quantum/sgjourney/classic_chevron_block","createch2:quantum/sgjourney/classic_dhd","createch2:quantum/sgjourney/classic_ring_block","createch2:quantum/sgjourney/classic_stargate","createch2:quantum/sgjourney/communication_crystal","createch2:quantum/sgjourney/control_crystal","createch2:quantum/sgjourney/crystal_base","createch2:quantum/sgjourney/crystallizer","createch2:quantum/sgjourney/energy_crystal","createch2:quantum/sgjourney/fusion_naquadah","createch2:quantum/sgjourney/materialization_crystal","createch2:quantum/sgjourney/milky_way_dhd","createch2:quantum/sgjourney/milky_way_stargate","createch2:quantum/sgjourney/naquadah_alloy","createch2:quantum/sgjourney/transfer_crystal","createch2:quantum/storage/quantum_barrel","createch2:quantum/storage/quantum_tank","createch2:quantum/storage/superconductor_storage_unit","createch2:quantum/superconductor/cable","createch2:quantum/superconductor/cryogenic_ingot","createch2:quantum/superconductor/high_field_coil","createch2:quantum/superconductor/hot_ingot","createch2:quantum/superconductor/plate","createch2:quantum/superconductor/quantum_alloy_dust","createch2:quantum/superconductor/wire","createch2:railway/blast_furnace/bricks","createch2:railway/blast_furnace/rail_grade_steel","createch2:railway/crusher/ballast","createch2:railway/crusher/coal","createch2:railway/crusher/coal_block","createch2:railway/crusher/multiblock","createch2:railway/crusher/refractory_recovery","createch2:railway/crusher/slag_conditioning","createch2:railway/locomotive/steam_assembly","createch2:railway/locomotive/underframe","createch2:railway/rolling/manual_rolling_machine","createch2:railway/rolling/powered_rolling_machine","createch2:railway/rolling/standard_rail","createch2:railway/rolling/steel_plate","createch2:railway/rolling/track_parts","createch2:railway/terminal/advanced_item_loader","createch2:railway/terminal/advanced_item_unloader","createch2:railway/terminal/fluid_loader","createch2:railway/terminal/fluid_unloader","createch2:railway/terminal/item_loader","createch2:railway/terminal/item_unloader","createch2:resource_authority/stellaris/desh_concentrate_from_moon_ore","createch2:resource_authority/stellaris/desh_ingot_from_raw","createch2:resource_authority/stellaris/tharsite_concentrate_from_mars_ore","createch2:resource_authority/stellaris/tharsite_ingot_from_raw","createch2:resource_synthesis/industrial/redstone","createch2:resource_synthesis/quantum/diamond","createch2:resource_synthesis/quantum/netherite_trace_recovery","createch2:rubberworks/sapping/gtceu_rubber_tree","createch2:simulated/mechanical_crafting/docking_connector","createch2:simulated/physics_assembler","createch2:simulated/red_portable_engine","createch2:simulated/sequenced_assembly/engine_assembly","createch2:stainless_digital/ae2/annihilation_core","createch2:stainless_digital/ae2/blank_pattern","createch2:stainless_digital/ae2/calculation_processor_press","createch2:stainless_digital/ae2/cell_component_1k","createch2:stainless_digital/ae2/charger","createch2:stainless_digital/ae2/control_chip","createch2:stainless_digital/ae2/controller_assembly","createch2:stainless_digital/ae2/controller_workpiece","createch2:stainless_digital/ae2/crafting_terminal","createch2:stainless_digital/ae2/dark_monitor","createch2:stainless_digital/ae2/drive","createch2:stainless_digital/ae2/energy_acceptor","createch2:stainless_digital/ae2/engineering_processor_press","createch2:stainless_digital/ae2/export_bus","createch2:stainless_digital/ae2/fluix_glass_cable","createch2:stainless_digital/ae2/formation_core","createch2:stainless_digital/ae2/import_bus","createch2:stainless_digital/ae2/inscriber","createch2:stainless_digital/ae2/inscriber/certus_quartz_dust","createch2:stainless_digital/ae2/inscriber/fluix_dust","createch2:stainless_digital/ae2/inscriber/printed_calculation_processor","createch2:stainless_digital/ae2/inscriber/printed_engineering_processor","createch2:stainless_digital/ae2/inscriber/printed_logic_processor","createch2:stainless_digital/ae2/inscriber/printed_silicon","createch2:stainless_digital/ae2/interface","createch2:stainless_digital/ae2/item_cell_housing","createch2:stainless_digital/ae2/item_storage_cell_1k","createch2:stainless_digital/ae2/logic_processor_press","createch2:stainless_digital/ae2/molecular_assembler","createch2:stainless_digital/ae2/monitor","createch2:stainless_digital/ae2/pattern_provider","createch2:stainless_digital/ae2/processor/calculation","createch2:stainless_digital/ae2/processor/engineering","createch2:stainless_digital/ae2/processor/logic","createch2:stainless_digital/ae2/quartz_fiber","createch2:stainless_digital/ae2/quartz_glass","createch2:stainless_digital/ae2/semi_dark_monitor","createch2:stainless_digital/ae2/silicon_press","createch2:stainless_digital/ae2/storage_bus","createch2:stainless_digital/ae2/terminal","createch2:stainless_digital/appflux/charged_redstone","createch2:stainless_digital/appflux/core_1k","createch2:stainless_digital/appflux/energy_processor","createch2:stainless_digital/appflux/energy_processor_press","createch2:stainless_digital/appflux/fe_1k_cell","createch2:stainless_digital/appflux/fe_cell_housing","createch2:stainless_digital/appflux/flux_accessor","createch2:stainless_digital/appflux/flux_accessor_from_part","createch2:stainless_digital/appflux/part_flux_accessor","createch2:stainless_digital/appflux/printed_energy_processor","createch2:stainless_digital/appflux/redstone_crystal","createch2:stainless_digital/appmek/chemical_cell_housing","createch2:stainless_digital/appmek/chemical_storage_cell_1k","createch2:steel_age/cookingforblockheads/ice_unit","createch2:steel_age/cookingforblockheads/sink","createch2:steel_age/cookingforblockheads/white_fridge","createch2:steel_steam/mi/invar_gear_from_heavy","createch2:steel_steam/mi/steel_block","createch2:steel_steam/tfmg/casting/pig_iron_ingot","createch2:steel_steam/tfmg/casting/steel_ingot","createch2:steel_steam/tfmg/industrial_blasting/pig_iron","createch2:steel_steam/tfmg/industrial_blasting/steel_from_coke_and_crushed_iron","createch2:steel_steam/tfmg/industrial_blasting/steel_from_coke_and_iron_dust","createch2:steel_steam/tfmg/steel_casing","createch2:steel_steam/tfmg/steel_mechanism","createch2:steel_steam/tfmg/steel_nuggets","createch2:stone_age/animaltrap/empty","createch2:stone_age/animaltrap/small_animals_bait","createch2:stone_age/animaltrap/twine","createch2:tfc_geology/advanced_electric/bauxite/normal","createch2:tfc_geology/advanced_electric/bauxite/poor","createch2:tfc_geology/advanced_electric/bauxite/rich","createch2:tfc_geology/advanced_electric/chromite/normal","createch2:tfc_geology/advanced_electric/chromite/poor","createch2:tfc_geology/advanced_electric/chromite/rich","createch2:tfc_geology/advanced_electric/magnesite/normal","createch2:tfc_geology/advanced_electric/magnesite/poor","createch2:tfc_geology/advanced_electric/magnesite/rich","createch2:tfc_geology/advanced_electric/pyrolusite/normal","createch2:tfc_geology/advanced_electric/pyrolusite/poor","createch2:tfc_geology/advanced_electric/pyrolusite/rich","createch2:tfc_geology/advanced_electric/stibnite/normal","createch2:tfc_geology/advanced_electric/stibnite/poor","createch2:tfc_geology/advanced_electric/stibnite/rich","createch2:tfc_geology/bronze_steam/iron_dust_from_wrought_iron","createch2:tfc_geology/digital/certus_quartz/normal","createch2:tfc_geology/high_pressure/cobaltite/normal","createch2:tfc_geology/high_pressure/cobaltite/poor","createch2:tfc_geology/high_pressure/cobaltite/rich","createch2:tfc_geology/high_pressure/kernite/normal","createch2:tfc_geology/high_pressure/kernite/poor","createch2:tfc_geology/high_pressure/kernite/rich","createch2:tfc_geology/high_pressure/spodumene/normal","createch2:tfc_geology/high_pressure/spodumene/poor","createch2:tfc_geology/high_pressure/spodumene/rich","createch2:tfc_geology/mechanical/iron_nuggets_from_wrought_iron","createch2:tfc_geology/pgm_foundation/monazite/normal","createch2:tfc_geology/pgm_foundation/monazite/poor","createch2:tfc_geology/pgm_foundation/monazite/rich","createch2:tfc_geology/pgm_foundation/native_iridium/normal","createch2:tfc_geology/pgm_foundation/native_iridium/poor","createch2:tfc_geology/pgm_foundation/native_iridium/rich","createch2:tfc_geology/pgm_foundation/native_osmium/normal","createch2:tfc_geology/pgm_foundation/native_osmium/poor","createch2:tfc_geology/pgm_foundation/native_osmium/rich","createch2:tfc_geology/pgm_foundation/native_platinum/normal","createch2:tfc_geology/pgm_foundation/native_platinum/poor","createch2:tfc_geology/pgm_foundation/native_platinum/rich","createch2:tfc_geology/quantum/bertrandite/normal","createch2:tfc_geology/quantum/bertrandite/poor","createch2:tfc_geology/quantum/bertrandite/rich","createch2:tfc_geology/quantum/wolframite/normal","createch2:tfc_geology/quantum/wolframite/poor","createch2:tfc_geology/quantum/wolframite/rich","createch2:tfc_geology/vent_processing/crimsite","createch2:tfc_geology/vent_processing/scorchia","createch2:tfc_geology/vent_processing/scoria","createch2:tfmg/crafting/materials/unfinished_resistor_from_rubber","createch2:tfmg/fireclay_ball_from_create_mixing","createch2:utility_authority/mining_gadgets/mk1","createch2:utility_authority/mining_gadgets/mk2","createch2:utility_authority/mining_gadgets/mk3","createch2:utility_authority/mining_gadgets/modification_table","createch2:vent_processing/crushing/molten_vents/asurine","createch2:alloy_blast_smelter/greg_specialist/process/naquadah_master_alloy_batch","createch2:large_chemical_reactor/greate_biology/bacterial_sludge","createch2:large_chemical_reactor/greate_biology/collagen_from_bone","createch2:large_chemical_reactor/greate_biology/stem_cells","createch2:large_chemical_reactor/greate_computation/biphenyl_from_oxygen","createch2:large_chemical_reactor/greate_computation/polychlorinated_biphenyl","createch2:large_chemical_reactor/greate_neuro/chloromethane_from_methane","createch2:large_chemical_reactor/greate_neuro/dimethylchlorosilane_from_chloromethane","createch2:large_chemical_reactor/greate_neuro/neuro_processor","createch2:large_chemical_reactor/greate_neuro/polydimethylsiloxane_from_dimethyldichlorosilane","createch2:large_chemical_reactor/greate_neuro/silicone_rubber","createch2:large_chemical_reactor/greate_polymers/chlorobenzene","createch2:large_chemical_reactor/greate_polymers/chromium_trioxide","createch2:large_chemical_reactor/greate_polymers/diaminobenzidine","createch2:large_chemical_reactor/greate_polymers/dichlorobenzidine","createch2:large_chemical_reactor/greate_polymers/dimethylbenzene","createch2:large_chemical_reactor/greate_polymers/diphenyl_isophtalate","createch2:large_chemical_reactor/greate_polymers/nitrochlorobenzene","createch2:large_chemical_reactor/greate_polymers/phthalic_acid","createch2:large_chemical_reactor/greate_polymers/polybenzimidazole","createch2:large_chemical_reactor/greate_polymers/potassium_dichromate","createch2:large_chemical_reactor/greate_wetware_boards/iron_3_chloride","createch2:large_chemical_reactor/greate_wetware_boards/multilayer_fiber_board","createch2:large_chemical_reactor/greate_wetware_boards/wetware_board","createch2:large_chemical_reactor/greate_wetware_boards/wetware_circuit_board_iron3","createch2:large_chemical_reactor/greg_specialist/process/pgm_aqua_regia_batch","createch2:greg_components/age_08/mv_electric_motor","createch2:greg_components/age_08/mv_electric_pump","createch2:greg_components/age_08/mv_conveyor_module","createch2:greg_components/age_10/hv_electric_motor","createch2:greg_components/age_10/hv_electric_pump","createch2:greg_components/age_10/hv_conveyor_module","createch2:material_recycling/tfmg_pumpjack/base","createch2:material_recycling/tfmg_pumpjack/crank","createch2:material_recycling/tfmg_pumpjack/hammer","createch2:material_recycling/tfmg_pumpjack/hammer_connector","createch2:material_recycling/tfmg_pumpjack/hammer_head","createch2:material_recycling/quantum_chassis/quantum_machine_casing","createch2:material_recycling/quantum_chassis/quantum_machine_hull","createch2:material_recycling/quantum_chassis/quantum_upgrade","createch2:material_recycling/wetware_facilities/zpm_circuit_assembler","createch2:material_recycling/wetware_facilities/zpm_1a_energy_converter","createch2:material_recycling/wetware_facilities/uv_1a_energy_converter","createch2:material_recycling/wetware_facilities/uv_energy_input_hatch","createch2:material_recycling/wetware_facilities/luv_mixer","createch2:material_recycling/wetware_facilities/luv_centrifuge","createch2:material_recycling/wetware_facilities/luv_autoclave","createch2:material_recycling/wetware_facilities/luv_brewery","createch2:material_recycling/wetware_facilities/luv_distillery","createch2:material_recycling/wetware_facilities/luv_fluid_heater","createch2:material_recycling/wetware_facilities/sterilizing_filter_casing","createch2:material_recycling/precision_gateway/iv_circuit_assembler","createch2:material_recycling/precision_gateway/iv_laser_engraver","createch2:material_recycling/precision_gateway/iv_scanner","createch2:material_recycling/precision_gateway/iv_1a_energy_converter","createch2:material_recycling/precision_gateway/iv_energy_input_hatch","createch2:material_recycling/precision_gateway/iv_input_bus","createch2:material_recycling/precision_gateway/iv_output_bus","createch2:material_recycling/precision_gateway/iv_input_hatch","createch2:material_recycling/precision_gateway/iv_output_hatch","createch2:material_recycling/computation/hpca_active_cooler_component","createch2:material_recycling/computation/hpca_advanced_computation_component","createch2:material_recycling/computation/hpca_bridge_component","createch2:material_recycling/computation/network_switch","createch2:material_recycling/computation/optical_pipe","createch2:assembler/greate_computation/hpca_active_cooler_component","createch2:assembler/greate_computation/hpca_advanced_computation_component","createch2:assembler/greate_computation/hpca_bridge_component","createch2:assembly_line/greate_computation/network_switch","createch2:assembler/greate_computation/optical_pipe","createch2:material_recycling/components/lv_electric_motor","createch2:material_recycling/components/lv_electric_pump","createch2:material_recycling/components/lv_conveyor_module","createch2:material_recycling/components/mv_electric_motor","createch2:material_recycling/components/mv_electric_pump","createch2:material_recycling/components/mv_conveyor_module","createch2:material_recycling/components/hv_electric_motor","createch2:material_recycling/components/hv_electric_pump","createch2:material_recycling/components/hv_conveyor_module","createch2:material_recycling/native_utilities/maintenance_hatch","createch2:material_recycling/native_utilities/cleanroom","createch2:material_recycling/mi_bronze/boiler","createch2:material_recycling/mi_bronze/compressor","createch2:material_recycling/mi_bronze/macerator","createch2:material_recycling/mi_bronze/machine_casing","createch2:material_recycling/mi_bronze/mixer","createch2:material_recycling/mi_bronze/tank","createch2:material_recycling/mi_bronze/water_pump","createch2:material_recycling/mi_steel/machine_casing","createch2:material_recycling/mi_steel/basic_machine_hull","createch2:material_recycling/nuclear_turbine/turbine_casing","createch2:material_recycling/nuclear_turbine/turbine_blade","createch2:material_recycling/nuclear_turbine/turbine_rotor","createch2:material_recycling/nuclear_turbine/electromagnetic_coil","createch2:material_recycling/nuclear_turbine/saturating_condenser","createch2:material_recycling/nuclear_turbine/crowns_turbine_casing","createch2:material_recycling/aerospace_titanium/titanium_nozzle","createch2:material_recycling/aerospace_titanium/rcs_thruster","createch2:material_recycling/aerospace_titanium/rocket_thruster","createch2:material_recycling/aerospace_titanium/booster_thruster","createch2:material_recycling/aerospace_titanium/vector_thruster","createch2:material_recycling/mi_thermal/frostproof_machine_casing","createch2:material_recycling/mi_thermal/heatproof_machine_casing","createch2:material_recycling/nuclear_thermal/crowns_heat_exchanger","createch2:material_recycling/mi_motion/motor","createch2:material_recycling/mi_motion/pump","createch2:material_recycling/mi_motion/advanced_motor","createch2:material_recycling/mi_motion/advanced_pump","createch2:material_recycling/mi_hull/advanced_machine_casing","createch2:material_recycling/mi_hull/advanced_machine_hull","createch2:material_recycling/mi_hull/highly_advanced_machine_hull","createch2:material_recycling/mi_electric/assembler","createch2:material_recycling/mi_electric/electric_macerator","createch2:material_recycling/mi_electric/electric_compressor","createch2:material_recycling/mi_electric/electric_mixer","createch2:material_recycling/mi_process/large_motor","createch2:material_recycling/mi_process/large_pump","createch2:material_recycling/mi_process/conveyor","createch2:material_recycling/mi_process/chemical_reactor","createch2:material_recycling/mi_process/electrolyzer","createch2:material_recycling/mi_process/distillery","createch2:material_recycling/mi_process/electric_cutting_machine","createch2:material_recycling/mi_process/electric_wiremill","createch2:material_recycling/mi_process/electric_packer","createch2:material_recycling/mi_process/centrifuge","createch2:material_recycling/mi_process/piston","createch2:material_recycling/mi_process/robot_arm","createch2:material_recycling/mi_process/electric_furnace","createch2:material_recycling/mi_process/electric_unpacker","createch2:material_recycling/mi_process/electric_blast_furnace","createch2:material_recycling/mi_process/polarizer","createch2:material_recycling/mi_process/vacuum_freezer","createch2:material_recycling/mi_process/small_heat_exchanger","createch2:material_recycling/mi_process/heat_exchanger","createch2:material_recycling/mi_process/oil_drilling_rig","createch2:material_recycling/mi_process/distillation_tower","createch2:material_recycling/mi_process/hv_steam_turbine","createch2:material_recycling/mi_process/large_steam_turbine","createch2:material_recycling/mi_process/turbo_machine_casing","createch2:material_recycling/mi_process/turbo_machine_hull","createch2:material_recycling/superconductor/high_field_coil","createch2:material_recycling/tfmg_stock/heavy_plate","createch2:material_recycling/tfmg_stock/steel_casing","createch2:material_recycling/tfmg_stock/steel_mechanism","createch2:material_recycling/tfmg_electric/electric_motor","createch2:material_recycling/tfmg_electric/generator","createch2:material_recycling/tfmg_electric/copper_spool","createch2:material_recycling/tfmg_electric/capacitor","createch2:material_recycling/tfmg_electric/electric_pump","createch2:circuit_assembler/greg_4096/research/optical_pipe_bootstrap","createch2:research_station/greg_4096/research/gtceu/iv_conveyor_module","createch2:research_station/greg_4096/research/gtceu/iv_robot_arm","createch2:research_station/greg_4096/research/gtceu/iv_sensor","createch2:research_station/greg_4096/research/gtceu/iv_emitter","createch2:research_station/greg_4096/research/gtceu/iv_field_generator","createch2:research_station/greg_4096/research/gtceu/quantum_processor","createch2:research_station/greg_4096/research/gtceu/crystal_soc","createch2:research_station/greg_4096/research/modern_industrialization/processing_unit","createch2:research_station/greg_4096/research/modern_industrialization/quantum_circuit","createch2:research_station/greg_4096/research/rocketnautics/rocket_thruster","createch2:research_station/greg_4096/research/sgjourney/crystallizer","createch2:space_environment_phase2/radiation/geiger_counter_first_space","createch2:space_environment_phase2/radiation/dosimeter_first_space"]
  runPhase('Static industrial recipe containment', () => {
    removeRecipe([
      {"id": "oritech:crafting/alloy/steel"},
      {"id": "oritech:mixing/compat/create/steel"},
      {"id": "createch2:vent_processing/crushing/molten_vents/veridium"},
      {"id": "createch2:vent_processing/crushing/molten_vents/crimsite"},
      {"id": "createch2:vent_processing/crushing/molten_vents/scoria"},
      {"id": "createch2:vent_processing/crushing/molten_vents/scorchia"},
      {"input": "#c:ores/aluminum", "output": "#c:ingots/aluminum", "type": "minecraft:smelting"},
      {"input": "#c:ores/aluminum", "output": "#c:ingots/aluminum", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/aluminum", "output": "#c:ingots/aluminum", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/aluminum", "output": "#c:ingots/aluminum", "type": "minecraft:blasting"},
      {"input": "#c:ores/antimony", "output": "#c:ingots/antimony", "type": "minecraft:smelting"},
      {"input": "#c:ores/antimony", "output": "#c:ingots/antimony", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/antimony", "output": "#c:ingots/antimony", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/antimony", "output": "#c:ingots/antimony", "type": "minecraft:blasting"},
      {"input": "#c:ores/beryllium", "output": "#c:ingots/beryllium", "type": "minecraft:smelting"},
      {"input": "#c:ores/beryllium", "output": "#c:ingots/beryllium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/beryllium", "output": "#c:ingots/beryllium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/beryllium", "output": "#c:ingots/beryllium", "type": "minecraft:blasting"},
      {"input": "#c:ores/iridium", "output": "#c:ingots/iridium", "type": "minecraft:smelting"},
      {"input": "#c:ores/iridium", "output": "#c:ingots/iridium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/iridium", "output": "#c:ingots/iridium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/iridium", "output": "#c:ingots/iridium", "type": "minecraft:blasting"},
      {"input": "#c:ores/lead", "output": "#c:ingots/lead", "type": "minecraft:smelting"},
      {"input": "#c:ores/lead", "output": "#c:ingots/lead", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/lead", "output": "#c:ingots/lead", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/lead", "output": "#c:ingots/lead", "type": "minecraft:blasting"},
      {"input": "#c:ores/lithium", "output": "#c:ingots/lithium", "type": "minecraft:smelting"},
      {"input": "#c:ores/lithium", "output": "#c:ingots/lithium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/lithium", "output": "#c:ingots/lithium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/lithium", "output": "#c:ingots/lithium", "type": "minecraft:blasting"},
      {"input": "#c:ores/magnesium", "output": "#c:ingots/magnesium", "type": "minecraft:smelting"},
      {"input": "#c:ores/magnesium", "output": "#c:ingots/magnesium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/magnesium", "output": "#c:ingots/magnesium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/magnesium", "output": "#c:ingots/magnesium", "type": "minecraft:blasting"},
      {"input": "#c:ores/manganese", "output": "#c:ingots/manganese", "type": "minecraft:smelting"},
      {"input": "#c:ores/manganese", "output": "#c:ingots/manganese", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/manganese", "output": "#c:ingots/manganese", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/manganese", "output": "#c:ingots/manganese", "type": "minecraft:blasting"},
      {"input": "#c:ores/osmium", "output": "#c:ingots/osmium", "type": "minecraft:smelting"},
      {"input": "#c:ores/osmium", "output": "#c:ingots/osmium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/osmium", "output": "#c:ingots/osmium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/osmium", "output": "#c:ingots/osmium", "type": "minecraft:blasting"},
      {"input": "#c:ores/platinum", "output": "#c:ingots/platinum", "type": "minecraft:smelting"},
      {"input": "#c:ores/platinum", "output": "#c:ingots/platinum", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/platinum", "output": "#c:ingots/platinum", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/platinum", "output": "#c:ingots/platinum", "type": "minecraft:blasting"},
      {"input": "#c:ores/thorium", "output": "#c:ingots/thorium", "type": "minecraft:smelting"},
      {"input": "#c:ores/thorium", "output": "#c:ingots/thorium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/thorium", "output": "#c:ingots/thorium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/thorium", "output": "#c:ingots/thorium", "type": "minecraft:blasting"},
      {"input": "#c:ores/titanium", "output": "#c:ingots/titanium", "type": "minecraft:smelting"},
      {"input": "#c:ores/titanium", "output": "#c:ingots/titanium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/titanium", "output": "#c:ingots/titanium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/titanium", "output": "#c:ingots/titanium", "type": "minecraft:blasting"},
      {"input": "#c:ores/tungsten", "output": "#c:ingots/tungsten", "type": "minecraft:smelting"},
      {"input": "#c:ores/tungsten", "output": "#c:ingots/tungsten", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/tungsten", "output": "#c:ingots/tungsten", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/tungsten", "output": "#c:ingots/tungsten", "type": "minecraft:blasting"},
      {"input": "#c:ores/uranium", "output": "#c:ingots/uranium", "type": "minecraft:smelting"},
      {"input": "#c:ores/uranium", "output": "#c:ingots/uranium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/uranium", "output": "#c:ingots/uranium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/uranium", "output": "#c:ingots/uranium", "type": "minecraft:blasting"},
      {"input": "#c:ores/zirconium", "output": "#c:ingots/zirconium", "type": "minecraft:smelting"},
      {"input": "#c:ores/zirconium", "output": "#c:ingots/zirconium", "type": "minecraft:blasting"},
      {"input": "#c:raw_materials/zirconium", "output": "#c:ingots/zirconium", "type": "minecraft:smelting"},
      {"input": "#c:raw_materials/zirconium", "output": "#c:ingots/zirconium", "type": "minecraft:blasting"},
      {"id": /^tfc_metallurgy:heating\/ore\/.*$/},
      {"id": /^firmalife:heating\/ore\/.*chromite.*$/},
      {"input": "#createch2:tfc_ores/bauxite"},
      {"input": "#createch2:tfc_ores/bertrandite"},
      {"input": "#createch2:tfc_ores/certus_quartz"},
      {"input": "#createch2:tfc_ores/chromite"},
      {"input": "#createch2:tfc_ores/cobaltite"},
      {"input": "#createch2:tfc_ores/galena"},
      {"input": "#createch2:tfc_ores/kernite"},
      {"input": "#createch2:tfc_ores/magnesite"},
      {"input": "#createch2:tfc_ores/monazite"},
      {"input": "#createch2:tfc_ores/native_iridium"},
      {"input": "#createch2:tfc_ores/native_osmium"},
      {"input": "#createch2:tfc_ores/native_platinum"},
      {"input": "#createch2:tfc_ores/pyrolusite"},
      {"input": "#createch2:tfc_ores/rutile"},
      {"input": "#createch2:tfc_ores/spodumene"},
      {"input": "#createch2:tfc_ores/stibnite"},
      {"input": "#createch2:tfc_ores/uraninite"},
      {"input": "#createch2:tfc_ores/wolframite"},
      {"input": "#createch2:tfc_ores/zircon"},
      {"input": "tfmg:galena"},
      {"output": "create:crushed_raw_lead"},
      {"input": "create:crushed_raw_lead"},
      {"output": "animaltrap:empty"},
      {"output": "animaltrap:small_animals_bait"},
      {"output": "animaltrap:twine"},
      {"output": "toolbelt:belt"},
      {"output": "toolbelt:pouch"},
      {"id": "astikorcartsredux:wheel"},
      {"id": /^astikorcartsredux:.*_(?:hand_cart|supply_cart|animal_cart|plow|reaper|seed_drill)$/},
      {"id": /^tfcastikorcarts:crafting\/(?:wheel|hand_cart|supply_cart|animal_cart|plow|reaper|seed_drill)\/.*$/},
      {"output": "cookingforblockheads:recipe_book"},
      {"output": "cookingforblockheads:crafting_book"},
      {"output": "cookingforblockheads:no_filter_edition"},
      {"output": "cookingforblockheads:cooking_table"},
      {"output": "cookingforblockheads:counter"},
      {"output": "cookingforblockheads:cabinet"},
      {"output": "cookingforblockheads:connector"},
      {"output": "cookingforblockheads:tool_rack"},
      {"output": "cookingforblockheads:fruit_basket"},
      {"output": "cookingforblockheads:white_oven"},
      {"output": "cookingforblockheads:sink"},
      {"output": "cookingforblockheads:white_fridge"},
      {"output": "cookingforblockheads:ice_unit"},
      {"id": "tfmg:crafting/materials/oil_can"},
      {"id": "tfmg:crafting/materials/oil_hammer"},
      {"id": "tfmg:crafting/materials/pumpjack_base"},
      {"id": "tfmg:crafting/materials/pumpjack_crank"},
      {"id": "tfmg:crafting/materials/pumpjack_hammer"},
      {"id": "tfmg:crafting/materials/pumpjack_hammer_connector"},
      {"id": "tfmg:crafting/materials/pumpjack_hammer_head"},
      {"id": "tfmg:crafting/materials/steel_distillation_controller"},
      {"id": "tfmg:crafting/materials/steel_distillation_output"},
      {"id": "tfmg:vat_machine_recipe/rubber"},
      {"id": "tfmg:vat_machine_recipe/naphtha"},
      {"id": "tfmg:coking/coal"},
      {"id": "tfmg:coking/charcoal"},
      {"output": "tfmg:oil_can"},
      {"output": "tfmg:oil_hammer"},
      {"output": "tfmg:pumpjack_base"},
      {"output": "tfmg:pumpjack_crank"},
      {"output": "tfmg:pumpjack_hammer"},
      {"output": "tfmg:pumpjack_hammer_connector"},
      {"output": "tfmg:pumpjack_hammer_head"},
      {"output": "tfmg:steel_distillation_controller"},
      {"output": "tfmg:steel_distillation_output"},
      {"output": "modern_industrialization:motor"},
      {"id": "createch2:createaddition/portable_energy_interface"},
      {"id": "createch2:createaddition/modular_accumulator"},
      {"output": "modern_industrialization:pump"},
      {"output": "modern_industrialization:electric_macerator"},
      {"output": "modern_industrialization:electric_compressor"},
      {"output": "modern_industrialization:electric_water_pump"},
      {"output": "modern_industrialization:assembler"},
      {"id": "stellaris:misc/rocket_launch_pad"},
      {"output": "stellaris:cable"},
      {"output": "stellaris:battery"},
      {"output": "stellaris:engine_fan"},
      {"output": "stellaris:fuel_refinery"},
      {"output": "stellaris:rocket_engine"},
      {"output": "stellaris:rocket_fin"},
      {"output": "stellaris:rocket_nose_cone"},
      {"output": "stellaris:rocket_station"},
      {"output": "stellaris:heavy_metal_casing"},
      {"output": "stellaris:rocket"},
      {"output": "stellaris:oxygen_tank"},
      {"output": "stellaris:big_oxygen_tank"},
      {"output": "stellaris:oxygen_distributor"},
      {"output": "stellaris:water_pump"},
      {"output": "stellaris:water_separator"},
      {"output": "stellaris:space_suit_helmet"},
      {"output": "stellaris:space_suit_chestplate"},
      {"output": "stellaris:space_suit_leggings"},
      {"output": "stellaris:space_suit_boots"},
      {"output": "stellaris:rover"},
      {"output": "stellaris:coal_generator"},
      {"output": "stellaris:solar_panel"},
      {"output": "stellaris:radioactive_generator"},
      {"id": "modern_industrialization:materials/blast_furnace/bauxite_to_aluminum_ingot"},
      {"id": "modern_industrialization:materials/blast_furnace/bauxite_to_aluminum_nugget"},
      {"id": "modern_industrialization:materials/aluminum/blast_furnace/dust"},
      {"id": "modern_industrialization:materials/aluminum/blast_furnace/tiny_dust"},
      {"id": "modern_industrialization:assembler_generated/electric_age/casing/advanced_machine_casing"},
      {"id": "modern_industrialization:electric_age/casing/advanced_machine_casing_asbl"},
      {"id": "modern_industrialization:assembler_generated/electric_age/hull/advanced_machine_hull"},
      {"id": "modern_industrialization:electric_age/hull/advanced_machine_hull_asbl"},
      {"id": "modern_industrialization:assembler_generated/electric_age/component/craft/advanced_motor"},
      {"id": "modern_industrialization:electric_age/component/craft/advanced_motor_asbl"},
      {"id": "modern_industrialization:assembler_generated/electric_age/component/craft/advanced_pump"},
      {"id": "modern_industrialization:electric_age/component/assembler/advanced_pump"},
      {"id": "modern_industrialization:electric_age/component/craft/advanced_pump"},
      {"id": "mekanism:basic_chemical_tank"},
      {"id": "mekanism:transmitter/pressurized_tube/basic"},
      {"id": "mekanism:electrolytic_core"},
      {"id": "mekanism:electrolytic_separator"},
      {"id": "mekanism:chemical_infuser"},
      {"id": "mekanism:chemical_oxidizer"},
      {"id": "mekanism:pressurized_reaction_chamber"},
      {"id": "mekanism:purification_chamber"},
      {"id": "mekanism:chemical_injection_chamber"},
      {"id": "mekanism:chemical_dissolution_chamber"},
      {"id": "mekanism:chemical_washer"},
      {"id": "mekanism:chemical_crystallizer"},
      {"output": "mekanism:basic_chemical_tank"},
      {"output": "mekanism:basic_pressurized_tube"},
      {"output": "mekanism:electrolytic_core"},
      {"output": "mekanism:nutritional_liquifier"},
      {"output": "tfmg:electric_motor"},
      {"output": "tfmg:electric_pump"},
      {"output": "alchemistry:dissolver"},
      {"output": "alchemistry:combiner"},
      {"output": "alchemistry:compactor"},
      {"output": "alchemistry:liquifier"},
      {"output": "alchemistry:atomizer"},
      {"id": "modern_industrialization:materials/blast_furnace/titanium_from_raw"},
      {"id": "modern_industrialization:materials/titanium/blast_furnace/dust"},
      {"output": "modern_industrialization:titanium_ingot"},
      {"output": "modern_industrialization:titanium_hot_ingot"},
      {"output": "modern_industrialization:titanium_nugget"},
      {"output": "modern_industrialization:titanium_block"},
      {"output": "create_connected:control_chip"},
      {"id": /^hostilenetworks:(?:deep_learner|framework|loot_fabricator|prediction_matrix|sim_chamber)$/},
      {"id": "hostile_neural_industrialization:guidebook"},
      {"id": "hostile_neural_industrialization:hostilenetworks/blank_data_model_assembler"},
      {"id": "hostile_neural_industrialization:hostilenetworks/deep_learner_assembler"},
      {"id": "hostile_neural_industrialization:hostilenetworks/loot_fabricator_assembler"},
      {"id": "hostile_neural_industrialization:hostilenetworks/prediction_matrix_assembler"},
      {"id": "hostile_neural_industrialization:hostilenetworks/simulation_chamber_assembler"},
      {"id": "hostile_neural_industrialization:machine/electric_simulation_chamber"},
      {"id": "hostile_neural_industrialization:machine/electric_simulation_chamber_assembler"},
      {"id": "hostile_neural_industrialization:machine/large_loot_fabricator"},
      {"id": "hostile_neural_industrialization:machine/large_loot_fabricator_assembler"},
      {"id": "hostile_neural_industrialization:machine/large_simulation_chamber"},
      {"id": "hostile_neural_industrialization:machine/large_simulation_chamber_assembler"},
      {"id": "hostile_neural_industrialization:machine/mono_loot_fabricator"},
      {"id": "hostile_neural_industrialization:machine/mono_loot_fabricator_assembler"},
      {"id": "hostile_neural_industrialization:prediction_machine_casing"},
      {"id": "hostile_neural_industrialization:prediction_machine_casing_assembler"},
      {"output": "hostilenetworks:deep_learner"},
      {"output": "hostilenetworks:blank_data_model"},
      {"output": "hostilenetworks:prediction_matrix"},
      {"output": "hostilenetworks:sim_chamber"},
      {"output": "hostilenetworks:loot_fabricator"},
      {"output": "gtceu:phenolic_circuit_board"},
      {"output": "gtceu:phenolic_printed_circuit_board"},
      {"output": "gtceu:vacuum_tube"},
      {"output": "gtceu:resistor"},
      {"output": "gtceu:capacitor"},
      {"output": "gtceu:diode"},
      {"output": "gtceu:transistor"},
      {"output": "gtceu:lv_electric_motor"},
      {"output": "gtceu:lv_electric_pump"},
      {"output": "gtceu:lv_conveyor_module"},
      {"output": "gtceu:lv_robot_arm"},
      {"output": "gtceu:lv_sensor"},
      {"output": "gtceu:lv_emitter"},
      {"output": "gtceu:lv_field_generator"},
      {"output": "simulated:physics_assembler"},
      {"output": "aeronautics:propeller_bearing"},
      {"output": "aeronautics:adjustable_burner"},
      {"output": "aeronautics:steam_vent"},
      {"output": "aeroworks:mechanical_servo"},
      {"output": "aeroworks:joystick"},
      {"output": "aeroworks:control_desk"},
      {"output": "simulated:engine_assembly"},
      {"output": "simulated:red_portable_engine"},
      {"output": "simulated:docking_connector"},
      {"output": "createpropulsion:wing"},
      {"output": "createpropulsion:tempered_wing"},
      {"output": "createpropulsion:solid_burner"},
      {"output": "createpropulsion:solid_fuel_thruster"},
      {"output": "createpropulsion:liquid_burner"},
      {"output": "createpropulsion:thruster"},
      {"output": "aeronautics:gyroscopic_propeller_bearing"},
      {"output": "aeroworks:stepper_servo"},
      {"output": "aeroworks:gyroscope"},
      {"output": "createpropulsion:liquid_vector_thruster"},
      {"output": "createpropulsion:vector_thruster"},
      {"output": "createpropulsion:advanced_tilt_adapter"},
      {"output": "create_aeronautics_automated_logistics:airship_station"},
      {"output": "create_aeronautics_automated_logistics:ship_transponder"},
      {"id": "modern_industrialization:materials/blast_furnace/titanium_from_raw"},
      {"id": "modern_industrialization:materials/titanium/blast_furnace/dust"},
      {"id": "modern_industrialization:materials/titanium/vacuum_freezer/hot_ingot"},
      {"id": "modern_industrialization:materials/platinum/blast_furnace/dust"},
      {"id": "modern_industrialization:materials/iridium/smelting/dust_to_ingot_blasting"},
      {"id": "modern_industrialization:materials/iridium/smelting/dust_to_ingot_smelting"},
      {"id": "modern_industrialization:materials/iridium/smelting/ore_to_ingot_blasting"},
      {"id": "modern_industrialization:materials/iridium/smelting/ore_to_ingot_smelting"},
      {"id": "modern_industrialization:materials/iridium/smelting/raw_metal_to_ingot_blasting"},
      {"id": "modern_industrialization:materials/iridium/smelting/raw_metal_to_ingot_smelting"},
      {"id": "modern_industrialization:electric_age/machine/vacuum_freezer_asbl"},
      {"id": "modern_industrialization:electric_age/machine/implosion_compressor_asbl"},
      {"id": "stellaris:misc/corronium_ingot_from_blasting_raw_corronium"},
      {"id": "stellaris:misc/corronium_ingot_from_blasting_venus_corronium_ore"},
      {"id": "stellaris:misc/corronium_ingot_from_smelting_raw_corronium"},
      {"id": "stellaris:misc/corronium_ingot_from_smelting_venus_corronium_ore"},
      {"id": "stellaris:misc/solerium_from_blasting_mercury_solerium_ore"},
      {"id": "stellaris:misc/solerium_from_blasting_raw_solerium"},
      {"id": "stellaris:misc/solerium_from_smelting_mercury_solerium_ore"},
      {"id": "stellaris:misc/solerium_from_smelting_raw_solerium"},
      {"id": "travelanchors:travel_anchor"},
      {"id": "travelanchors:travel_staff"},
      {"output": "modern_industrialization:titanium_ingot"},
      {"output": "modern_industrialization:titanium_hot_ingot"},
      {"output": "modern_industrialization:platinum_ingot"},
      {"output": "modern_industrialization:platinum_hot_ingot"},
      {"output": "modern_industrialization:iridium_ingot"},
      {"output": "modern_industrialization:iridium_ore"},
      {"output": "modern_industrialization:raw_iridium"},
      {"output": "stellaris:corronium_ingot"},
      {"output": "stellaris:solerium"},
      {"output": "mekanism:advanced_chemical_tank"},
      {"output": "mekanism:advanced_pressurized_tube"},
      {"output": "mekanism:osmium_compressor"},
      {"id": "chemlib:titanium_ingot_from_smelting_titanium_dust"},
      {"id": "chemlib:titanium_ingot_from_blasting_titanium_dust"},
      {"id": "shield_generators:shield_generator"},
      {"output": "shield_generators:shield_generator"},
      {"id": /^chemlib:.*(?:platinum|palladium|osmium|iridium|uranium|zirconium).*$/},
      {"id": /^mekanism:processing\/uranium\/(?:fissile_fuel|reprocessing|ingot|ore|raw|storage_blocks).*$/},
      {"id": /^mekanism:processing\/lategame\/.*$/},
      {"id": /^mekanismgenerators:reactor\/.*$/},
      {"id": /^mekanismgenerators:turbine\/.*$/},
      {"id": /^mekanismgenerators:chemical_infusing\/fusion_fuel$/},
      {"id": /^mekanismgenerators:rotary\/fusion_fuel$/},
      {"id": /^megacells:.*$/},
      {"output": "modern_industrialization:iridium_ingot"},
      {"output": "modern_industrialization:nuclear_reactor"},
      {"output": "modern_industrialization:uranium_fuel_rod"},
      {"output": "modern_industrialization:uranium_fuel_rod_double"},
      {"output": "modern_industrialization:uranium_fuel_rod_quad"},
      {"output": "mekanism:ingot_osmium"},
      {"output": "mekanism:ingot_uranium"},
      {"output": "mekanism:dust_uranium"},
      {"output": "mekanism:yellow_cake_uranium"},
      {"output": "mekanism:pellet_plutonium"},
      {"output": "mekanism:pellet_polonium"},
      {"output": "mekanism:pellet_antimatter"},
      {"output": "mekanism:alloy_atomic"},
      {"output": "mekanism:elite_control_circuit"},
      {"output": "mekanism:elite_chemical_tank"},
      {"output": "mekanism:elite_mechanical_pipe"},
      {"output": "mekanism:elite_pressurized_tube"},
      {"output": "mekanism:advanced_thermodynamic_conductor"},
      {"output": "mekanism:elite_tier_installer"},
      {"output": "mekanism:ultimate_tier_installer"},
      {"output": "mekanism:radioactive_waste_barrel"},
      {"output": "mekanism:geiger_counter"},
      {"output": "mekanism:dosimeter"},
      {"output": "mekanism:module_radiation_shielding_unit"},
      {"output": "mekanism:module_geiger_unit"},
      {"output": "mekanism:elite_thermodynamic_conductor"},
      {"output": "mekanism:dynamic_tank"},
      {"output": "mekanism:dynamic_valve"},
      {"output": "mekanismgenerators:fission_reactor_casing"},
      {"output": "mekanismgenerators:reactor_glass"},
      {"output": "mekanismgenerators:fission_reactor_port"},
      {"output": "mekanismgenerators:fission_reactor_logic_adapter"},
      {"output": "mekanismgenerators:fission_fuel_assembly"},
      {"output": "mekanismgenerators:control_rod_assembly"},
      {"output": "mekanismgenerators:turbine_casing"},
      {"output": "mekanismgenerators:turbine_valve"},
      {"output": "mekanismgenerators:turbine_rotor"},
      {"output": "rocketnautics:copper_nozzle"},
      {"output": "rocketnautics:copper_anchor_boots"},
      {"output": "rocketnautics:copper_leg_thrusters"},
      {"output": "rocketnautics:titanium_nozzle"},
      {"output": "rocketnautics:jetpack"},
      {"output": "rocketnautics:rcs_thruster"},
      {"output": "rocketnautics:separator"},
      {"output": "rocketnautics:rocket_thruster"},
      {"output": "rocketnautics:booster_thruster"},
      {"output": "rocketnautics:vector_thruster"},
      {"output": "rocketnautics:magnetic_stabilizer"},
      {"output": "rocketnautics:sputnik"},
      {"output": "rocketnautics:hologram_block"},
      {"output": /^rocketnautics:titanium_(?:ingot|block|nugget)$/},
      {"id": /^rocketnautics:(?:smelting|blasting)\/titanium_ingot_from_/},
      {"id": /^mekanism:processing\/uranium\/fissile_fuel$/},
      {"id": /^mekanism:processing\/uranium\/reprocessing\/.*$/},
      {"id": /^mekanism:processing\/lategame\/plutonium$/},
      {"id": /^mekanism:processing\/lategame\/plutonium_pellet\/.*$/},
      {"id": /^mekanism:processing\/lategame\/polonium.*$/},
      {"id": /^mekanismgenerators:turbine\/.*$/},
      {"id": /^mekanismgenerators:chemical_infusing\/fusion_fuel$/},
      {"id": /^mekanismgenerators:rotary\/fusion_fuel$/},
      {"id": "mekanism:isotopic_centrifuge"},
      {"id": "mekanism:solar_neutron_activator"},
      {"id": "mekanism:antiprotonic_nucleosynthesizer"},
      {"id": "mekanism:sps_casing"},
      {"id": "mekanism:sps_port"},
      {"id": "mekanism:supercharged_coil"},
      {"id": "modern_industrialization:electric_age/machine/fusion_reactor_asbl"},
      {"id": "modern_industrialization:electric_age/machine/plasma_turbine_asbl"},
      {"id": "modern_industrialization:electric_age/casing/quantum_machine_casing_asbl"},
      {"id": "modern_industrialization:electric_age/hull/quantum_machine_hull_asbl"},
      {"output": "crowns:heat_exchanger"},
      {"output": "crowns:fuel_rod"},
      {"output": "crowns:fuel_assembly"},
      {"output": "crowns:steam_input"},
      {"output": "crowns:steam_collector"},
      {"output": "crowns:turbine_casing"},
      {"output": "crowns:turbine_stage"},
      {"output": "crowns:compressor"},
      {"output": "mekanism:isotopic_centrifuge"},
      {"output": "mekanism:solar_neutron_activator"},
      {"output": "mekanism:antiprotonic_nucleosynthesizer"},
      {"output": "mekanism:sps_casing"},
      {"output": "mekanism:sps_port"},
      {"output": "mekanism:supercharged_coil"},
      {"output": "mekanism:pellet_plutonium"},
      {"output": "mekanism:pellet_polonium"},
      {"output": "mekanism:pellet_antimatter"},
      {"output": "modern_industrialization:uranium_fuel_rod"},
      {"output": "modern_industrialization:uranium_fuel_rod_double"},
      {"output": "modern_industrialization:uranium_fuel_rod_quad"},
      {"output": "modern_industrialization:uranium_fuel_rod_depleted"},
      {"output": "modern_industrialization:fusion_reactor"},
      {"output": "modern_industrialization:fusion_chamber"},
      {"output": "modern_industrialization:plasma_turbine"},
      {"output": "modern_industrialization:quantum_machine_casing"},
      {"output": "modern_industrialization:quantum_machine_hull"},
      {"output": "mekanismgenerators:turbine_casing"},
      {"output": "mekanismgenerators:turbine_valve"},
      {"output": "mekanismgenerators:turbine_vent"},
      {"output": "mekanismgenerators:turbine_blade"},
      {"output": "mekanismgenerators:turbine_rotor"},
      {"output": "mekanismgenerators:rotational_complex"},
      {"output": "mekanismgenerators:electromagnetic_coil"},
      {"output": "mekanismgenerators:saturating_condenser"},
      {"output": "mekanismgenerators:fission_fuel_assembly"},
      {"id": /^avaritia:.*$/},
      {"id": /^sgjourney:.*$/},
      {"id": /^mekanism:processing\/lategame\/polonium.*$/},
      {"id": /^mekanism:processing\/lategame\/antimatter.*$/},
      {"id": /^mekanism:processing\/lategame\/antiprotonic_nucleosynthesizer.*$/},
      {"id": /^mekanismgenerators:chemical_infusing\/fusion_fuel$/},
      {"id": /^mekanismgenerators:rotary\/fusion_fuel$/},
      {"id": "modern_industrialization:electric_age/component/implosion_compressor/singularity"},
      {"id": "modern_industrialization:materials/electrolyzer/uu_matter"},
      {"id": "modern_industrialization:alloy/mixer/superconductor/dust"},
      {"id": "modern_industrialization:electric_age/casing/quantum_machine_casing_asbl"},
      {"id": "modern_industrialization:electric_age/hull/quantum_machine_hull_asbl"},
      {"id": "modern_industrialization:electric_age/machine/fusion_reactor_asbl"},
      {"id": "modern_industrialization:electric_age/machine/plasma_turbine_asbl"},
      {"id": "ae2:network/blocks/quantum_ring"},
      {"id": "ae2:network/blocks/quantum_link"},
      {"output": "mekanism:pellet_polonium"},
      {"output": "mekanism:pellet_antimatter"},
      {"output": "mekanism:module_teleportation_unit"},
      {"output": "modern_industrialization:singularity"},
      {"output": "modern_industrialization:uu_matter_bucket"},
      {"output": "modern_industrialization:superconductor_dust"},
      {"output": "modern_industrialization:superconductor_ingot"},
      {"output": "modern_industrialization:superconductor_plate"},
      {"output": "modern_industrialization:superconductor_wire"},
      {"output": "modern_industrialization:superconductor_cable"},
      {"output": "modern_industrialization:superconductor_coil"},
      {"output": "modern_industrialization:superconductor_storage_unit"},
      {"output": "modern_industrialization:plutonium_battery"},
      {"output": "modern_industrialization:quantum_machine_casing"},
      {"output": "modern_industrialization:quantum_machine_hull"},
      {"output": "modern_industrialization:fusion_chamber"},
      {"output": "modern_industrialization:fusion_reactor"},
      {"output": "modern_industrialization:plasma_turbine"},
      {"output": "modern_industrialization:replicator"},
      {"output": "modern_industrialization:quantum_barrel"},
      {"output": "modern_industrialization:quantum_tank"},
      {"output": "modern_industrialization:quantum_upgrade"},
      {"output": "ae2:quantum_ring"},
      {"output": "ae2:quantum_link"},
      {"id": "modern_industrialization:alloy/mixer/superconductor/tiny_dust"},
      {"output": "tfmg:generator"},
      {"output": "aeronautics_utility_objects:brass_universal_joint"},
      {"output": "aeronautics_utility_objects:damping_stress_bearing"},
      {"output": "aeronautics_utility_objects:hydraulic_connection_head"},
      {"output": "aeronautics_utility_objects:hydraulic_hinge_head"},
      {"output": "aeronautics_utility_objects:hydraulic_regulator"},
      {"id": "chancecubes:chance_cube_crafting"},
      {"id": "chancecubes:cube_scanner_crafting"},
      {"id": "chancecubes:silk_pendant_crafting"},
      {"id": "chancecubes:tier_1_pendant_crafting"},
      {"id": "chancecubes:tier_2_pendant_crafting"},
      {"id": "chancecubes:tier_3_pendant_crafting"},
      {"id": "createch2:bronze/mekanism_to_cbc"},
      {"id": "createch2:bronze/cbc_to_mekanism"},
      {"id": "createch2:create/mixing/bronze_ingot"},
      {"id": /^minecraft:(?:smelting|blasting)\/.*(?:copper|iron|gold|ore).*$/},
      {"output": "minecraft:furnace", "type": "minecraft:crafting_shaped"},
      {"output": "minecraft:iron_pickaxe"},
      {"output": "minecraft:iron_axe"},
      {"output": "minecraft:iron_shovel"},
      {"output": "minecraft:iron_hoe"},
      {"output": "minecraft:iron_sword"},
      {"output": "minecraft:golden_pickaxe"},
      {"output": "minecraft:golden_axe"},
      {"output": "minecraft:golden_shovel"},
      {"output": "minecraft:golden_hoe"},
      {"output": "minecraft:golden_sword"},
      {"output": "minecraft:diamond_pickaxe"},
      {"output": "minecraft:diamond_axe"},
      {"output": "minecraft:diamond_shovel"},
      {"output": "minecraft:diamond_hoe"},
      {"output": "minecraft:diamond_sword"},
      {"id": /^minecraft:(?:smelting|blasting)\/(?:copper_ingot|raw_copper|copper_ore|deepslate_copper_ore).*$/},
      {"id": /^create:(?:crushing|milling)\/.*copper_ore.*$/},
      {"id": /^mekanism:processing\/copper\/ingot\/from_(?:ore|raw).*$/},
      {"output": "create:andesite_alloy", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:andesite_casing", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:basin", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:water_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:large_water_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:hand_crank", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:fluid_pipe", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:item_drain", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:spout", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:andesite_funnel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:andesite_tunnel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"id": "createbigcannons:mixing/alloy_bronze_tin"},
      {"id": "createbigcannons:mixing/alloy_bronze_brass"},
      {"id": "createbigcannons:mixing/alloy_bronze_tinless"},
      {"id": "modern_industrialization:alloy/mixer/bronze/dust"},
      {"id": "modern_industrialization:alloy/mixer/bronze/tiny_dust"},
      {"id": "createbigcannons:basin_foundry_lid"},
      {"output": "mekanism:ingot_bronze"},
      {"output": "create:brass_ingot"},
      {"output": "create:brass_sheet"},
      {"output": "create:brass_casing"},
      {"id": "modern_industrialization:assembler_generated/steam_age/bronze/boiler"},
      {"id": "modern_industrialization:assembler_generated/steam_age/bronze/compressor"},
      {"id": "modern_industrialization:assembler_generated/steam_age/bronze/macerator"},
      {"id": "modern_industrialization:assembler_generated/steam_age/bronze/machine_casing"},
      {"id": "modern_industrialization:assembler_generated/steam_age/bronze/mixer"},
      {"id": "modern_industrialization:assembler_generated/steam_age/bronze/water_pump"},
      {"id": "modern_industrialization:steam_age/bronze/boiler_asbl"},
      {"id": "modern_industrialization:steam_age/bronze/compressor_asbl"},
      {"id": "modern_industrialization:steam_age/bronze/macerator_asbl"},
      {"id": "modern_industrialization:steam_age/bronze/machine_casing_asbl"},
      {"id": "modern_industrialization:steam_age/bronze/mixer_asbl"},
      {"id": "modern_industrialization:steam_age/bronze/water_pump_asbl"},
      {"id": "modern_industrialization:materials/bronze/craft/tank"},
      {"id": "modern_industrialization:assembler_generated/steam_age/item_pipe"},
      {"id": "modern_industrialization:assembler_generated/steam_age/fluid_pipe"},
      {"id": "modern_industrialization:steam_age/item_pipe_asbl"},
      {"id": "modern_industrialization:steam_age/fluid_pipe_asbl"},
      {"output": "modern_industrialization:bronze_compressor"},
      {"id": "modern_industrialization:steam_age/fireclay/coke_oven"},
      {"id": "modern_industrialization:steam_age/fireclay/packer/coke_oven"},
      {"id": "modern_industrialization:steam_age/fireclay/steam_blast_furnace"},
      {"id": "modern_industrialization:steam_age/fireclay/packer/packer_steam_blast_furnace"},
      {"output": "modern_industrialization:coke_oven"},
      {"output": "modern_industrialization:steam_blast_furnace"},
      {"output": "tfc:blast_furnace"},
      {"type": "tfc:blast_furnace"},
      {"output": "modern_industrialization:coke"},
      {"output": "modern_industrialization:coke_block"},
      {"output": "modern_industrialization:coke_dust"},
      {"output": "modern_industrialization:uncooked_steel_dust"},
      {"output": "modern_industrialization:steel_ingot"},
      {"output": "modern_industrialization:steel_nugget"},
      {"output": "modern_industrialization:steel_block"},
      {"output": /^tfmg:steel_.*/, "not": {"id": /^tfmg:crafting\/materials\/steel_pipe(?:_vertical)?$/}},
      {"output": /^mekanism:(?:ingot|nugget|block)_steel$/, "not": {"id": /^tfmg:crafting\/materials\/steel_pipe(?:_vertical)?$/}},
      {"output": "mekanism:block_steel", "not": {"id": /^tfmg:crafting\/materials\/steel_pipe(?:_vertical)?$/}},
      {"id": /^tfmg:smelting\/(?:lead|nickel|lithium)_ingot.*$/},
      {"id": /^tfmg:blasting\/(?:lead|nickel|lithium)_ingot.*$/},
      {"id": /^tfmg:vat_machine_recipe\/aluminum$/},
      {"id": /^tfmg:casting\/steel$/},
      {"id": /^tfmg:industrial_blasting\/steel.*$/},
      {"id": "create_ultimate_factory:compacting_coalblock"},
      {"id": "create_ultimate_factory:crushing_netherite"},
      {"id": "create_ultimate_factory:mixing_redstone"},
      {"id": /^create:crushing\/(?:deepslate_)?lithium_ore$/},
      {"id": /^create:crushing\/raw_lithium(?:_block)?$/},
      {"id": /^stellaris:.*steel.*(?:smelting|blasting).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^stellaris:.*uranium.*(?:smelting|blasting).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^stellaris:.*plutonium.*(?:smelting|blasting).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^stellaris:.*titanium.*(?:smelting|blasting).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^stellaris:misc\/(?:steel|raw_steel|uranium|raw_uranium|plutonium).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^mekanism:processing\/(?:osmium|uranium)\/.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^mekanism:.*\/(?:basic_control_circuit|metallurgic_infuser|enrichment_chamber|crusher|energized_smelter|steel_casing).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^ae2:network\/.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^ae2:tools\/network\/.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^ae2:inscriber\/.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^ae2:decorative\/.*controller.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^ae2wtlib:.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^appflux:.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^appmek:.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^megacells:.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^railcraft:blast_furnace\/.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^railcraft:crusher\/.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^railcraft:.*(?:blast_furnace|crusher).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^railcraft:.*steel_(?:ingot|nugget|block|axe|pickaxe|shovel|hoe|sword|helmet|chestplate|leggings|boots|shears|anvil|gear).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^alchemistry:.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^sgjourney:.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^solar_industrialization:.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^extended_industrialization:.*(?:solar|photovoltaic|tesla|nano|quantum|ultimate_laser_drill|large_configurable_chest|processing_array|machine_chainer|interdimensional).*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^extended_industrialization:vanilla_recipes\/blast_furnace\/netherite_dust_to_ingot$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"id": /^quarryplus:.*$/, "not": {"id": /^(?:ae2:network\/upgrade_wireless_crafting_terminal|ae2wtlib:pattern_encoding\/upgrade_wireless_pattern_encoding_terminal|ae2wtlib:wireless_universal_terminal\/ce|ae2:network\/cells\/item_storage_components_cell_4k_part|ae2:network\/cells\/item_storage_components_cell_16k_part|ae2:network\/cells\/item_storage_components_cell_64k_part|ae2:network\/cells\/item_storage_components_cell_256k_part|ae2:network\/parts\/terminals_pattern_encoding|ae2:network\/parts\/terminals_pattern_access|ae2wtlib:wireless_universal_terminal\/ae|ae2wtlib:wireless_universal_terminal\/ca|ae2wtlib:wireless_universal_terminal\/upgrade_crafting|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_acces|ae2wtlib:wireless_universal_terminal\/upgrade_pattern_encoding|ae2:network\/blocks\/io_port|ae2:network\/blocks\/spatial_io_port|ae2:network\/cells\/spatial_components|ae2:network\/cells\/spatial_components_0|ae2:network\/cells\/spatial_components_1|ae2:network\/parts\/level_emitter)$/}},
      {"output": "mekanism:metallurgic_infuser"},
      {"output": "mekanism:enrichment_chamber"},
      {"output": "mekanism:crusher"},
      {"output": "mekanism:energized_smelter"},
      {"output": "mekanism:digital_miner"},
      {"output": "mekanism:basic_control_circuit"},
      {"output": "clavis:lock_pick"},
      {"output": "ae2:controller"},
      {"output": "ae2:energy_acceptor"},
      {"output": "ae2:drive"},
      {"output": "ae2:terminal"},
      {"output": "ae2:crafting_terminal"},
      {"output": "ae2:inscriber"},
      {"output": "ae2:molecular_assembler"},
      {"output": "ae2:pattern_provider"},
      {"output": "ae2:wireless_terminal"},
      {"output": "ae2:wireless_access_point"},
      {"output": "ae2:quantum_link"},
      {"output": "ae2:quantum_ring"},
      {"output": "ae2wtlib:quantum_bridge_card"},
      {"output": "appflux:flux_accessor"},
      {"output": "appflux:part_flux_accessor"},
      {"output": "appflux:fe_cell_housing"},
      {"output": "appmek:chemical_cell_housing"},
      {"output": "appmek:chemical_p2p_tunnel"},
      {"output": "railcraft:coke_oven_bricks"},
      {"output": "railcraft:blast_furnace_bricks"},
      {"output": "railcraft:crusher"},
      {"output": "railcraft:steel_ingot"},
      {"output": "railcraft:steel_block"},
      {"output": "railcraft:steel_nugget"},
      {"output": "alchemistry:combiner"},
      {"output": "alchemistry:dissolver"},
      {"output": "alchemistry:compactor"},
      {"output": "alchemistry:fission_chamber_controller"},
      {"output": "alchemistry:fission_core"},
      {"output": "alchemistry:fusion_chamber_controller"},
      {"output": "alchemistry:fusion_core"},
      {"output": "sgjourney:classic_stargate"},
      {"output": "sgjourney:milky_way_stargate"},
      {"output": "sgjourney:pegasus_stargate"},
      {"output": "sgjourney:universe_stargate"},
      {"output": "sgjourney:tollan_stargate"},
      {"output": "sgjourney:classic_dhd"},
      {"output": "sgjourney:milky_way_dhd"},
      {"output": "sgjourney:pegasus_dhd"},
      {"output": "sgjourney:transport_rings"},
      {"output": "sgjourney:ring_panel"},
      {"output": "sgjourney:ring_remote"},
      {"output": "sgjourney:transceiver"},
      {"output": "sgjourney:gdo"},
      {"output": "sgjourney:pda"},
      {"output": "sgjourney:crystallizer"},
      {"output": "sgjourney:advanced_crystallizer"},
      {"output": "sgjourney:reaction_chamber"},
      {"output": "sgjourney:naquadah_liquidizer"},
      {"output": "sgjourney:heavy_naquadah_liquidizer"},
      {"output": "sgjourney:naquadah_generator_mark_i"},
      {"output": "sgjourney:naquadah_generator_mark_ii"},
      {"output": "sgjourney:naquadah_power_cell"},
      {"output": "sgjourney:plasma_converter"},
      {"output": "sgjourney:fusion_core"},
      {"output": "sgjourney:jaffa_staff_head"},
      {"output": "sgjourney:kara_kesh"},
      {"output": "sgjourney:personal_shield_emitter"},
      {"output": "extended_industrialization:lv_solar_panel"},
      {"output": "extended_industrialization:mv_solar_panel"},
      {"output": "extended_industrialization:hv_solar_panel"},
      {"output": "extended_industrialization:tesla_coil"},
      {"output": "extended_industrialization:tesla_tower"},
      {"output": "extended_industrialization:tesla_receiver"},
      {"output": "extended_industrialization:tesla_particle_generator"},
      {"output": "extended_industrialization:tesla_interdimensional_upgrade"},
      {"output": "extended_industrialization:machine_chainer"},
      {"output": "extended_industrialization:machine_chainer_relay"},
      {"output": "extended_industrialization:processing_array"},
      {"output": "extended_industrialization:large_configurable_chest"},
      {"output": "extended_industrialization:ultimate_laser_drill"},
      {"output": "extended_industrialization:electric_mining_drill"},
      {"output": "extended_industrialization:nano_saber"},
      {"output": "extended_industrialization:nano_helmet"},
      {"output": "extended_industrialization:nano_chestplate"},
      {"output": "extended_industrialization:nano_leggings"},
      {"output": "extended_industrialization:nano_boots"},
      {"output": "extended_industrialization:nano_gravichestplate"},
      {"output": "extended_industrialization:nano_quantum_saber"},
      {"output": "extended_industrialization:nano_quantum_helmet"},
      {"output": "extended_industrialization:nano_quantum_chestplate"},
      {"output": "extended_industrialization:nano_quantum_leggings"},
      {"output": "extended_industrialization:nano_quantum_boots"},
      {"output": "mininggadgets:mininggadget_simple"},
      {"output": "mininggadgets:mininggadget_fancy"},
      {"output": "quarryplus:quarry"},
      {"output": "quarryplus:adv_quarry"},
      {"id": "cargoboats:motorboat"},
      {"id": "cargoboats:fluid_motorboat"},
      {"id": "cargoboats:lava_upgrade"},
      {"id": "cargoboats:speed_upgrade"},
      {"id": "cargoboats:capacity_upgrade"},
      {"id": "cargoboats:fishing_upgrade"},
      {"id": "cargoboats:icebreaker_upgrade"},
      {"output": "mekanism:basic_logistical_transporter"},
      {"output": "mekanism:basic_mechanical_pipe"},
      {"id": "createaddition:charging/channeling"},
      {"id": "createaddition:charging/deoxidize_create_exposed_copper_shingle_slab"},
      {"id": "createaddition:charging/deoxidize_create_exposed_copper_shingle_stairs"},
      {"id": "createaddition:charging/deoxidize_create_exposed_copper_shingles"},
      {"id": "createaddition:charging/deoxidize_create_exposed_copper_tile_slab"},
      {"id": "createaddition:charging/deoxidize_create_exposed_copper_tile_stairs"},
      {"id": "createaddition:charging/deoxidize_create_exposed_copper_tiles"},
      {"id": "createaddition:charging/deoxidize_create_oxidized_copper_shingle_slab"},
      {"id": "createaddition:charging/deoxidize_create_oxidized_copper_shingle_stairs"},
      {"id": "createaddition:charging/deoxidize_create_oxidized_copper_shingles"},
      {"id": "createaddition:charging/deoxidize_create_oxidized_copper_tile_slab"},
      {"id": "createaddition:charging/deoxidize_create_oxidized_copper_tile_stairs"},
      {"id": "createaddition:charging/deoxidize_create_oxidized_copper_tiles"},
      {"id": "createaddition:charging/deoxidize_create_weathered_copper_shingle_slab"},
      {"id": "createaddition:charging/deoxidize_create_weathered_copper_shingle_stairs"},
      {"id": "createaddition:charging/deoxidize_create_weathered_copper_shingles"},
      {"id": "createaddition:charging/deoxidize_create_weathered_copper_tile_slab"},
      {"id": "createaddition:charging/deoxidize_create_weathered_copper_tile_stairs"},
      {"id": "createaddition:charging/deoxidize_create_weathered_copper_tiles"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_chiseled_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_copper_bulb"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_copper_door"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_copper_grate"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_copper_trapdoor"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_cut_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_cut_copper_slab"},
      {"id": "createaddition:charging/deoxidize_minecraft_exposed_cut_copper_stairs"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_chiseled_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_copper_bulb"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_copper_door"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_copper_grate"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_copper_trapdoor"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_cut_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_cut_copper_slab"},
      {"id": "createaddition:charging/deoxidize_minecraft_oxidized_cut_copper_stairs"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_chiseled_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_copper_bulb"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_copper_door"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_copper_grate"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_copper_trapdoor"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_cut_copper"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_cut_copper_slab"},
      {"id": "createaddition:charging/deoxidize_minecraft_weathered_cut_copper_stairs"},
      {"id": "createaddition:charging/electrify_gold_block"},
      {"id": "createaddition:charging/electrify_gold_ingot"},
      {"id": "createaddition:charging/electrify_gold_nugget"},
      {"id": "createaddition:charging/electrify_gold_rod"},
      {"id": "createaddition:charging/electrify_gold_sheet"},
      {"id": "createaddition:charging/electrify_gold_wire"},
      {"id": "createaddition:compacting/biomass_pellet"},
      {"id": "createaddition:compacting/cake_base"},
      {"id": "createaddition:compacting/seed_oil"},
      {"id": "createaddition:compat/ae2/charged_certus_quartz"},
      {"id": "createaddition:compat/immersiveengineering/constantan"},
      {"id": "createaddition:compat/immersiveengineering/crushing/steel_ingot"},
      {"id": "createaddition:compat/immersiveengineering/fabric_sail"},
      {"id": "createaddition:compat/immersiveengineering/item_application/kiln_brick"},
      {"id": "createaddition:compat/immersiveengineering/item_application/leaded_concrete"},
      {"id": "createaddition:compat/immersiveengineering/item_application/reinforced_blast_brick"},
      {"id": "createaddition:compat/immersiveengineering/rolling/aluminum_ingot"},
      {"id": "createaddition:compat/immersiveengineering/rolling/aluminum_plate"},
      {"id": "createaddition:compat/immersiveengineering/rolling/lead_plate"},
      {"id": "createaddition:compat/immersiveengineering/rolling/steel_ingot"},
      {"id": "createaddition:compat/immersiveengineering/rolling/steel_plate"},
      {"id": "createaddition:compat/immersiveengineering/sphalerite"},
      {"id": "createaddition:compat/jeed/shocking"},
      {"id": "createaddition:compat/mekanism/rose_quartz_enriching"},
      {"id": "createaddition:compat/mekanism/rose_quartz_metallurgic_infusing"},
      {"id": "createaddition:compat/tconstruct/amethyst_bronze"},
      {"id": "createaddition:compat/tconstruct/blaze_blood"},
      {"id": "createaddition:compat/tconstruct/hepatizon"},
      {"id": "createaddition:compat/tconstruct/manyullyn"},
      {"id": "createaddition:compat/tconstruct/queens_slime"},
      {"id": "createaddition:compat/tconstruct/rose_gold"},
      {"id": "createaddition:compat/tconstruct/slimesteel"},
      {"id": "createaddition:compat/tconstruct/tinkers_bronze"},
      {"id": "createaddition:compat/thermal/liquid_burning/heavy_oil"},
      {"id": "createaddition:compat/thermal/liquid_burning/light_oil"},
      {"id": "createaddition:compat/thermal/liquid_burning/refined_fuel"},
      {"id": "createaddition:compat/thermal/liquid_burning/tree_oil"},
      {"id": "createaddition:crafting/barbed_wire"},
      {"id": "createaddition:crafting/biomass_pallet_block"},
      {"id": "createaddition:crafting/biomass_pellet_from_biomass_pallet_block"},
      {"id": "createaddition:crafting/capacitor_1"},
      {"id": "createaddition:crafting/capacitor_2"},
      {"id": "createaddition:crafting/connector"},
      {"id": "createaddition:crafting/copper_spool"},
      {"id": "createaddition:crafting/diamond_grit_sandpaper"},
      {"id": "createaddition:crafting/digital_adapter"},
      {"id": "createaddition:crafting/electrum_amulet"},
      {"id": "createaddition:crafting/electrum_block"},
      {"id": "createaddition:crafting/electrum_ingot_from_electrum_block"},
      {"id": "createaddition:crafting/electrum_ingot_from_nugget"},
      {"id": "createaddition:crafting/electrum_nugget"},
      {"id": "createaddition:crafting/electrum_spool"},
      {"id": "createaddition:crafting/festive_spool"},
      {"id": "createaddition:crafting/gold_spool"},
      {"id": "createaddition:crafting/large_connector"},
      {"id": "createaddition:crafting/modular_accumulator"},
      {"id": "createaddition:crafting/portable_energy_interface"},
      {"id": "createaddition:crafting/redstone_relay"},
      {"id": "createaddition:crafting/rolling_mill"},
      {"id": "createaddition:crafting/small_light_connector"},
      {"id": "createaddition:crafting/spool"},
      {"id": "createaddition:crushing/diamond"},
      {"id": "createaddition:filling/cake"},
      {"id": "createaddition:filling/chocolate_cake"},
      {"id": "createaddition:filling/honey_cake"},
      {"id": "createaddition:liquid_burning/biodiesel"},
      {"id": "createaddition:liquid_burning/biofuel"},
      {"id": "createaddition:liquid_burning/creosote"},
      {"id": "createaddition:liquid_burning/crude_oil"},
      {"id": "createaddition:liquid_burning/diesel"},
      {"id": "createaddition:liquid_burning/ethanol"},
      {"id": "createaddition:liquid_burning/gasoline"},
      {"id": "createaddition:liquid_burning/lava"},
      {"id": "createaddition:liquid_burning/plantoil"},
      {"id": "createaddition:mechanical_crafting/alternator"},
      {"id": "createaddition:mechanical_crafting/electric_motor"},
      {"id": "createaddition:mechanical_crafting/tesla_coil"},
      {"id": "createaddition:mixing/bioethanol"},
      {"id": "createaddition:mixing/biomass_from_crops"},
      {"id": "createaddition:mixing/biomass_from_flowers"},
      {"id": "createaddition:mixing/biomass_from_honeycomb"},
      {"id": "createaddition:mixing/biomass_from_leaves"},
      {"id": "createaddition:mixing/biomass_from_plant_foods"},
      {"id": "createaddition:mixing/biomass_from_plants"},
      {"id": "createaddition:mixing/biomass_from_saplings"},
      {"id": "createaddition:mixing/biomass_from_stricks"},
      {"id": "createaddition:mixing/electrum"},
      {"id": "createaddition:mixing/netherrack"},
      {"id": "createaddition:pressing/electrum_ingot"},
      {"id": "createaddition:pressing/zinc_ingot"},
      {"id": "createaddition:rolling/brass_rod"},
      {"id": "createaddition:rolling/copper_ingot"},
      {"id": "createaddition:rolling/copper_plate"},
      {"id": "createaddition:rolling/electrum_ingot"},
      {"id": "createaddition:rolling/electrum_plate"},
      {"id": "createaddition:rolling/gold_ingot"},
      {"id": "createaddition:rolling/gold_plate"},
      {"id": "createaddition:rolling/iron_ingot"},
      {"id": "createaddition:rolling/iron_plate"},
      {"id": "createaddition:smoking/cake_base_baked"},
      {"id": "minecraft:dried_ghast"},
      {"id": "minecraft:saddle"},
      {"id": "minecraft:lodestone"},
      {"id": "minecraft:white_harness"},
      {"id": "minecraft:orange_harness"},
      {"id": "minecraft:magenta_harness"},
      {"id": "minecraft:light_blue_harness"},
      {"id": "minecraft:yellow_harness"},
      {"id": "minecraft:lime_harness"},
      {"id": "minecraft:pink_harness"},
      {"id": "minecraft:gray_harness"},
      {"id": "minecraft:light_gray_harness"},
      {"id": "minecraft:cyan_harness"},
      {"id": "minecraft:purple_harness"},
      {"id": "minecraft:blue_harness"},
      {"id": "minecraft:brown_harness"},
      {"id": "minecraft:green_harness"},
      {"id": "minecraft:red_harness"},
      {"id": "minecraft:black_harness"},
      {"id": "minecraft:crafter"},
      {"output": "mekanismgenerators:heat_generator"},
      {"output": "mekanismgenerators:bio_generator"},
      {"output": "mekanismgenerators:gas_burning_generator"},
      {"output": "mekanismgenerators:wind_generator"},
      {"output": "mekanismgenerators:solar_generator"},
      {"id": "create_mekanism_improvements:uranium_ingot"},
      {"output": "mekanism:steel_casing"},
      {"output": "mekanism:energy_tablet"},
      {"output": "mekanism:advanced_control_circuit"},
      {"id": /^modern_industrialization:assembler_generated\/electric_age\/circuit\/craft\/lv_circuit$/},
      {"id": /^modern_industrialization:electric_age\/circuit\/craft\/lv_circuit_asbl$/},
      {"id": /^modern_industrialization:assembler_generated\/electric_age\/circuit\/craft\/electronic_circuit$/},
      {"id": /^modern_industrialization:electric_age\/circuit\/craft\/electronic_circuit_asbl$/},
      {"id": /^modern_industrialization:assembler_generated\/steam_age\/steel\/machine_casing$/},
      {"id": /^modern_industrialization:steam_age\/steel\/machine_casing_asbl$/},
      {"id": /^modern_industrialization:assembler_generated\/electric_age\/hull\/lv_machine_hull$/},
      {"id": /^modern_industrialization:electric_age\/hull\/lv_machine_hull_asbl$/},
      {"id": "supplementaries:sus_sand"},
      {"type": "rubberworks:sapping"},
      {"id": "rubberworks:compacting/rubber"},
      {"id": "tfmg:vat_machine_recipe/rubber"},
      {"output": "tfmg:rubber_sheet"},
      {"output": "modern_industrialization:rubber_sheet"},
      {"id": "modern_industrialization:materials/mixer/oil_to_rubber"},
      {"id": "modern_industrialization:materials/mixer/oil_to_rubber_sheet"},
      {"id": "modern_industrialization:materials/mixer/rubber_sheet_from_synthetic"},
      {"id": "modern_industrialization:oil/vacuum_freezer/styrene_butadiene_rubber"},
      {"id": /^modern_industrialization:materials\/.+\/assembler\/cable_(?:styrene_rubber|synthetic_rubber)$/},
      {"output": "create:belt_connector"},
      {"output": "create:hose_pulley"},
      {"output": "create:elevator_pulley"},
      {"id": "tfmg:crafting/materials/unfinished_resistorfrom_slime"},
      {"output": "mekanism:jetpack"},
      {"output": "mekanism:jetpack_armored"},
      {"output": "minecraft:cherry_log"},
      {"output": "minecraft:stripped_cherry_log"},
      {"output": "minecraft:cherry_wood"},
      {"output": "minecraft:stripped_cherry_wood"},
      {"output": "minecraft:cherry_planks"},
      {"output": "minecraft:cherry_slab"},
      {"output": "minecraft:cherry_stairs"},
      {"output": "minecraft:cherry_fence"},
      {"output": "minecraft:cherry_fence_gate"},
      {"output": "minecraft:cherry_door"},
      {"output": "minecraft:cherry_trapdoor"},
      {"output": "minecraft:cherry_pressure_plate"},
      {"output": "minecraft:cherry_button"},
      {"output": "minecraft:cherry_sign"},
      {"output": "minecraft:cherry_hanging_sign"},
      {"output": "minecraft:cherry_boat"},
      {"output": "minecraft:cherry_chest_boat"},
      {"output": "minecraft:cherry_sapling"},
      {"output": "minecraft:cherry_leaves"},
      {"output": "quark:cherry_ladder"},
      {"id": "backpacked:backpack"},
      {"id": "backpacked:backpack_dock"},
      {"output": /^create:cherry_window(?:_pane)?$/},
      {"output": /^farmersdelight:cherry_cabinet$/},
      {"output": /^mcwbridges:.*cherry.*$/},
      {"output": /^mcwroofs:.*cherry.*$/},
      {"output": /^quark:(?:trapped_)?(?:lootr_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|blossom|azalea|ancient|purpur|prismarine|nether_brick)_chest$/},
      {"output": /^quark:(?:lootr_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|blossom|azalea|ancient|purpur|prismarine|nether_brick)_chest_(?:boat|raft)$/},
      {"id": "farmersdelight:salvaging/quartz_block"},
      {"output": "mekanism:teleportation_core"},
      {"output": "mekanism:teleporter_frame"},
      {"output": "mekanism:teleporter"},
      {"output": "mekanism:portable_teleporter"},
      {"output": "mekanism:module_teleportation_unit"},
      {"id": "simulated:physics_assembler"},
      {"id": "aeronautics:propeller_bearing"},
      {"id": "simulated:sequenced_assembly/gyroscopic_mechanism"},
      {"id": "aeronautics:gyroscopic_propeller_bearing"},
      {"id": "aeronautics:adjustable_burner"},
      {"id": "aeronautics:steam_vent"},
      {"id": "simulated:sequenced_assembly/engine_assembly"},
      {"id": "simulated:red_portable_engine"},
      {"id": "simulated:mechanical_crafting/docking_connector"},
      {"output": "create_aeronautics_automated_logistics:airship_station"},
      {"output": "create_aeronautics_automated_logistics:ship_transponder"},
      {"id": "aeroclaims_ftb:claim_block"},
      {"id": "create_hypertube:hypertube_entrance"},
      {"id": "create_hypertube:hyper_accelerator_large_cogwheel"},
      {"id": "create_hypertube:hyper_accelerator_small_cogwheel"},
      {"output": "enderstorage:ender_chest"},
      {"output": "enderstorage:ender_tank"},
      {"output": "enderstorage:ender_pouch"},
      {"id": /^buildinggadgets2:gadget_/},
      {"id": "buildinggadgets2:template_manager"},
      {"id": "createbigcannons:mixing/alloy_steel"},
      {"id": "createbigcannons:steel_ingot_from_nuggets"},
      {"id": "createbigcannons:steel_ingot_from_block"},
      {"id": "createbigcannons:steel_block"},
      {"id": "createbigcannons:steel_scrap"},
      {"id": "createbigcannons:compacting/forge_steel_ingot"},
      {"id": "createbigcannons:compacting/forge_steel_nugget"},
      {"id": "createbigcannons:compacting/forge_steel_block"},
      {"id": "createbigcannons:cannon_builder"},
      {"id": "createbigcannons:cannon_drill"},
      {"id": "createbigcannons:cannon_loader"},
      {"id": "createbigcannons:cannon_mount"},
      {"id": "createbigcannons:fixed_cannon_mount"},
      {"id": "createbigcannons:solid_shot"},
      {"id": "create_radar:crafting/radar_reciever"},
      {"id": "create_radar:crafting/fire_controller"},
      {"id": "create_radar:crafting/auto_pitch_controller"},
      {"id": "create_radar:crafting/auto_yaw_controller"},
      {"id": "create_radar:crafting/guided_fuze"},
      {"id": "cbc_enhanced_shells:target_designator"},
      {"id": "cbc_enhanced_shells:guided_nose_cone"},
      {"id": "cbc_ballistics:rangefinder"},
      {"id": "cbc_ballistics:ballistics_calculator"},
      {"id": "cbc_ballistics:network_manager_item"},
      {"id": "cbc_ballistics:cannon_control"},
      {"id": "cbc_ballistics:artillery_coordinator"},
      {"id": "cbc_ballistics:radio_item"},
      {"output": "productivebees:advanced_oak_beehive"},
      {"id": /^productivebees:hives\/advanced_.*_(beehive|canvas_hive)$/},
      {"id": /^productivebees:powered_centrifuge\//},
      {"id": "productivebees:bee_breeding/quarry_bee"},
      {"id": "productivebees:bee_breeding/farmer_bee"},
      {"output": "rubberworks:sapper"},
      {"output": "rubberworks:compressor"},
      {"output": /^productivebees:advanced_.*_beehive(?:_clear)?$/},
      {"output": "productivebees:bee_cage"},
      {"output": "productivebees:sturdy_bee_cage"},
      {"output": "productivebees:centrifuge"},
      {"output": "productivebees:heated_centrifuge"},
      {"output": "productivebees:powered_centrifuge"},
      {"output": "productivebees:incubator"},
      {"output": "productivebees:breeding_chamber"},
      {"output": "productivebees:gene_indexer"},
      {"output": "productivebees:honey_generator"},
      {"output": "modularbees:bee_extractor"},
      {"output": "modularbees:modular_beehive_core"},
      {"output": "modularbees:modular_centrifuge_core"},
      {"output": "modularbees:modular_export"},
      {"output": "modularbees:me_beehive_export"},
      {"output": "modularbees:me_centrifuge_export"},
      "gtceu:assembler/plascrete",
      "gtceu:assembler/computer_casing",
      "gtceu:assembler/computer_heat_vent",
      {"id": "avaritia:diamond_lattice"},
      {"id": "avaritia:crystal_matrix_ingot"},
      {"id": "avaritia:crystal_matrix"},
      {"id": "avaritia:extreme_crafting_table"},
      {"id": "avaritia:neutron_collector"},
      {"id": "avaritia:neutron_compressor"},
      {"output": "avaritia:diamond_lattice"},
      {"output": "avaritia:crystal_matrix_ingot"},
      {"output": "avaritia:crystal_matrix"},
      {"output": "avaritia:extreme_crafting_table"},
      {"output": "avaritia:neutron_collector"},
      {"output": "avaritia:neutron_compressor"},
      {"id": /^rocketnautics:(?:blasting|smelting)\/titanium_ingot_from_.*$/},
      {"id": /^rocketnautics:crushing\/(?:deepslate_titanium_ore|raw_titanium|raw_titanium_block|titanium_ore)$/},
      {"id": /^rocketnautics:crafting\/materials\/(?:raw_titanium(?:_block)?|titanium_(?:block|ingot|nugget))_from_.*$/},
      {"id": /^rocketnautics:splashing\/crushed_raw_titanium$/},
      {"id": /^stellaris:misc\/(?:desh_ingot|tharsite_ingot)_from_(?:blasting|smelting)_(?:mars_tharsite_ore|moon_desh_ore|raw_desh_ingot|raw_tharsite)$/},
      {"output": "mekanism:basic_universal_cable"},
      {"output": "mekanism:advanced_universal_cable"},
      {"output": "mekanism:elite_universal_cable"},
      {"output": "mekanism:ultimate_universal_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:tin_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:tin_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:copper_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:copper_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:cupronickel_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:cupronickel_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:electrum_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:electrum_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:silver_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:silver_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:aluminum_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:aluminum_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:kanthal_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:kanthal_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:platinum_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:platinum_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:annealed_copper_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:annealed_copper_cable"},
      {"type": "minecraft:crafting_shaped", "output": "modern_industrialization:superconductor_cable"},
      {"type": "minecraft:crafting_shapeless", "output": "modern_industrialization:superconductor_cable"},
      {"output": "moderndynamics:lv_cable"},
      {"output": "moderndynamics:mv_cable"},
      {"output": "moderndynamics:hv_cable"},
      {"output": "moderndynamics:ev_cable"},
      {"output": "moderndynamics:superconductor_cable"},
      {"id": /^moderndynamics:cable\//},
      {"output": "moderndynamics:item_pipe"},
      {"output": "moderndynamics:fluid_pipe"},
      {"output": "moderndynamics:extractor"},
      {"output": "moderndynamics:attractor"},
      {"output": "moderndynamics:filter"},
      {"output": "moderndynamics:inhibitor"},
      {"output": "moderndynamics:machine_extender"},
      {"output": "moderndynamics:wrench"},
      {"output": "mininggadgets:mininggadget_simple"},
      {"output": "mininggadgets:mininggadget_fancy"},
      {"output": "mininggadgets:mininggadget"},
      {"output": "mininggadgets:modificationtable"},
      {"output": "htm:hatchet"},
      {"output": "htm:flint_knife"},
      {"output": "htm:bone_knife"},
      {"output": "create:shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:large_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "create:crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_andesite_alloy_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:andesite_alloy_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_steel_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:steel_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_aluminium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:aluminium_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_stainless_steel_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:stainless_steel_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_titanium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:titanium_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_tungsten_steel_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:tungsten_steel_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_rhodium_plated_palladium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:rhodium_plated_palladium_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_naquadah_alloy_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:naquadah_alloy_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_darmstadtium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:darmstadtium_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_shaft", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:large_neutronium_cogwheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_vertical_gearbox", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_mechanical_press", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_mechanical_mixer", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_mechanical_pump", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_mechanical_saw", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_millstone", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_encased_fan", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "greate:neutronium_crushing_wheel", "not": {"id": "greate:sequenced_assembly/precision_mechanism"}},
      {"output": "gtceu:neutronium_ingot"},
      {"output": "gtceu:neutronium_plate"},
      {"output": "gtceu:zpm_circuit_assembler"},
      {"output": "gtceu:zpm_1a_energy_converter"},
      {"output": "gtceu:uv_1a_energy_converter"},
      {"output": "gtceu:uv_energy_input_hatch"},
      {"output": "gtceu:luv_mixer"},
      {"output": "gtceu:luv_centrifuge"},
      {"output": "gtceu:luv_autoclave"},
      {"output": "gtceu:luv_brewery"},
      {"output": "gtceu:luv_distillery"},
      {"output": "gtceu:luv_fluid_heater"},
      {"output": "gtceu:sterilizing_filter_casing"},
      {"id": "mekanism_tfmg_compat:lithium/lithium_ore_blasting"},
      {"id": "mekanism_tfmg_compat:lithium/lithium_ore_smelting"},
      {"id": "mekanism_tfmg_compat:lithium/lithium_deepslate_ore_blasting"},
      {"id": "mekanism_tfmg_compat:lithium/lithium_deepslate_ore_smelting"},
      {"output": "greate:rubber_belt_connector"},
      {"output": "greate:silicone_rubber_belt_connector"},
      {"output": "greate:polyethylene_belt_connector"},
      {"output": "greate:polytetrafluoroethylene_belt_connector"},
      {"output": "greate:polybenzimidazole_belt_connector"},
      {"output": "gtceu:polyvinyl_chloride_plate"},
      {"output": "gtceu:polyvinyl_chloride_foil"},
      {"output": "greate:wire_coating_factory"},
      {"output": "modern_industrialization:electric_blast_furnace"},
      {"output": "modern_industrialization:distillation_tower"},
      {"output": "modern_industrialization:advanced_fluid_input_hatch"},
      {"output": "modern_industrialization:advanced_fluid_output_hatch"},
      {"output": "modern_industrialization:large_tank"},
      {"output": "modern_industrialization:large_tank_hatch"},
      {"output": "extended_industrialization:large_steam_furnace"},
      {"output": "extended_industrialization:large_electric_furnace"},
      {"output": "tfmg:fireproof_brick"},
      {"output": "railcraft:manual_rolling_machine"},
      {"output": "railcraft:powered_rolling_machine"},
      {"output": "railcraft:item_loader"},
      {"output": "railcraft:item_unloader"},
      {"output": "railcraft:advanced_item_loader"},
      {"output": "railcraft:advanced_item_unloader"},
      {"output": "railcraft:fluid_loader"},
      {"output": "railcraft:fluid_unloader"},
      {"output": "railcraft:steam_locomotive"},
      {"output": "railcraft:standard_rail"},
      {"output": "railcraft:stone_railbed"},
      {"output": "railcraft:track_parts"},
      {"id": /^avaritia:infinity_.*$/},
      {"id": /^avaritia:.*creative.*$/},
      {"id": /^avaritia:ae2_creative.*$/},
      {"id": /^avaritia:mek_creative.*$/},
      {"id": /^avaritia:rs_creative.*$/},
      {"id": /^avaritia:de_creative.*$/},
      {"id": "avaritia:eternal_singularity"},
      {"id": "avaritia:neutron_gear"},
      {"id": "avaritia:neutron_ring"},
      {"id": "avaritia:cosmic_meatballs"},
      {"id": "avaritia:ultimate_stew"},
      {"id": "avaritia:endest_pearl"},
      {"id": "avaritia:record_fragment"},
      {"id": "avaritia:star_fuel"},
      {"output": "avaritia:infinity_catalyst"},
      {"output": "avaritia:infinity_ingot"},
      {"output": "avaritia:infinity_upgrade"},
      {"output": "avaritia:infinity_sword"},
      {"output": "avaritia:infinity_pickaxe"},
      {"output": "avaritia:infinity_axe"},
      {"output": "avaritia:infinity_shovel"},
      {"output": "avaritia:infinity_hoe"},
      {"output": "avaritia:infinity_bow"},
      {"output": "avaritia:infinity_crossbow"},
      {"output": "avaritia:infinity_trident"},
      {"output": "avaritia:infinity_mace"},
      {"output": "avaritia:infinity_shield"},
      {"output": "avaritia:infinity_helmet"},
      {"output": "avaritia:infinity_chestplate"},
      {"output": "avaritia:infinity_pants"},
      {"output": "avaritia:infinity_boots"},
      {"output": "avaritia:infinity_elytra"},
      {"output": "avaritia:infinity_totem"},
      {"output": "avaritia:infinity_bucket"},
      {"output": "avaritia:infinity_clock"},
      {"output": "avaritia:infinity_umbrella"},
      {"output": "avaritia:infinity_chest"},
      {"output": "avaritia:neutron_gear"},
      {"output": "avaritia:neutron_ring"},
      {"output": "avaritia:cosmic_meatballs"},
      {"output": "avaritia:ultimate_stew"},
      {"output": "avaritia:endest_pearl"},
      {"output": "avaritia:record_fragment"},
      {"output": "avaritia:star_fuel"},
      {"output": "ae2:creative_energy_cell"},
      {"output": "mekanism:creative_bin"},
      {"output": "mekanism:creative_fluid_tank"},
      {"output": "mekanism:creative_chemical_tank"}
    ])
  })
  // END GENERATED STATIC INDUSTRIAL CONTAINMENT

  // BEGIN GENERATED STATIC FACTORY CONTAINMENT
  // Canonical source: createch-dev/scripts/sources/recipe_families/factory_scaling.mjs.
  runPhase('Static factory-scaling containment', () => {
    removeOutputRecipes(["extended_industrialization:large_steam_macerator", "modern_industrialization:advanced_item_input_hatch", "modern_industrialization:advanced_item_output_hatch", "extended_industrialization:large_electric_macerator", "modern_industrialization:highly_advanced_machine_hull", "extended_industrialization:processing_array", "extended_industrialization:machine_chainer", "extended_industrialization:machine_chainer_relay"])
  })
  // END GENERATED STATIC FACTORY CONTAINMENT

  // Static release recipes: Infinity; native singularity matching remains in Avaritia.

  if (phaseFailures.length > 0) {
    var failedPhases = phaseFailures.map(failure => failure.name).join(', ')
    throw new Error(`[Createch 2 Recipes] Recipe reload aborted; failed phases: ${failedPhases}`)
  }

  if (committedRemovalFilters.length > 0) {
    committedRemovalFilters = coalesceExactOutputFilters(committedRemovalFilters)
    // KubeJS combines object fields with AND; an explicit "and" key is unsupported.
    event.remove({ not: compiledRecipeProtection(compiledReleaseRecipeIds), or: committedRemovalFilters })
  }

})
})()

// BEGIN GENERATED STANDARD GEAR RECOVERY
// Retire GT recovery only when its input admits a 200-unit MI standard gear.
// The four-ingot heavy form has an explicit recovery route above.
ServerEvents.recipes(event => {
  ["modern_industrialization:aluminum_gear","modern_industrialization:bronze_gear","modern_industrialization:copper_gear","modern_industrialization:gold_gear","modern_industrialization:invar_gear","modern_industrialization:iron_gear","modern_industrialization:stainless_steel_gear","modern_industrialization:steel_gear","modern_industrialization:tin_gear","modern_industrialization:titanium_gear"].forEach(item => {
    ['gtceu:macerator', 'gtceu:arc_furnace', 'gtceu:extractor'].forEach(type => event.remove({ type: type, input: item }))
  })
})
// END GENERATED STANDARD GEAR RECOVERY
