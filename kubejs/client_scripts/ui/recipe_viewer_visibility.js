;(function () {
// BEGIN GENERATED CANONICAL PLATE VISIBILITY
// Generated from createch-dev/scripts/sources/material_form_units.json; canonical plates must remain discoverable.
var createch2CanonicalPlateItems = new Set(["create:copper_sheet","create:golden_sheet","create:brass_sheet","modern_industrialization:bronze_plate","modern_industrialization:tin_plate","modern_industrialization:steel_plate","tfmg:nickel_sheet","modern_industrialization:silver_plate","tfmg:lead_sheet","tfmg:aluminum_sheet","modern_industrialization:titanium_plate","modern_industrialization:tungsten_plate","modern_industrialization:stainless_steel_plate","gtceu:cobalt_plate","modern_industrialization:invar_plate","gtceu:neodymium_plate","chemlib:vanadium_plate","chemlib:bismuth_plate","createaddition:zinc_sheet","chemica:graphite_sheet","gtceu:bismuth_bronze_plate","gtceu:black_bronze_plate","gtceu:rose_gold_plate","gtceu:sterling_silver_plate","gtceu:wrought_iron_plate","tfmg:cast_iron_sheet","gtceu:black_steel_plate","gtceu:blue_steel_plate","gtceu:red_steel_plate","greate:andesite_alloy_plate","modern_industrialization:beryllium_plate","createaddition:electrum_sheet","modern_industrialization:platinum_plate","modern_industrialization:iridium_plate","chemlib:lithium_plate","chemica:magnesium_sheet","gtceu:manganese_plate","gtceu:osmium_plate","gtceu:osmiridium_plate","gtceu:thorium_plate","gtceu:tungsten_steel_plate","chemlib:uranium_plate","modern_industrialization:chromium_plate","gtceu:molybdenum_plate"])
// END GENERATED CANONICAL PLATE VISIBILITY
// BEGIN GENERATED HEAVY GEAR VISIBILITY
var createch2HeavyGearItems = new Set(["tfc_items:aluminum_gear","gtceu:aluminum_gear","tfc_items:bronze_gear","railcraft:bronze_gear","gtceu:bronze_gear","tfc_items:copper_gear","railcraft:copper_gear","gtceu:copper_gear","tfc_items:gold_gear","railcraft:gold_gear","gtceu:gold_gear","railcraft:invar_gear","gtceu:invar_gear","railcraft:iron_gear","gtceu:iron_gear","tfc_items:stainless_steel_gear","gtceu:stainless_steel_gear","tfc_items:steel_gear","railcraft:steel_gear","gtceu:steel_gear","tfc_items:tin_gear","railcraft:tin_gear","gtceu:tin_gear","gtceu:titanium_gear"])
// END GENERATED HEAVY GEAR VISIBILITY
var createch2ChemicaPresentation = JsonIO.read('kubejs/config/createch2_chemica_presentation.json') || {
  hidden_items: [],
  hidden_fluids: [],
  runtime_only_items: []
}
var createch2HiddenChemicaItems = createch2ChemicaPresentation.hidden_items
  .concat(createch2ChemicaPresentation.runtime_only_items)

var createch2HiddenParallelSteelItems = [
  'tfc:blast_furnace',
  'kubejs:retired_blast_furnace_insulation',
  'kubejs:retired_insulated_fire_bricks',
  'createbigcannons:steel_ingot',
  'createbigcannons:steel_block',
  'createbigcannons:steel_scrap'
]

var createch2HiddenDuplicateOreItems = [
  'create:zinc_ore',
  'create:deepslate_zinc_ore',
  'mekanism:tin_ore',
  'mekanism:deepslate_tin_ore',
  'mekanism:osmium_ore',
  'mekanism:deepslate_osmium_ore',
  'mekanism:uranium_ore',
  'mekanism:deepslate_uranium_ore',
  'mekanism:fluorite_ore',
  'mekanism:deepslate_fluorite_ore',
  'mekanism:lead_ore',
  'mekanism:deepslate_lead_ore',
  'modern_industrialization:lead_ore',
  'modern_industrialization:deepslate_lead_ore',
  'modern_industrialization:nickel_ore',
  'modern_industrialization:deepslate_nickel_ore',
  'modern_industrialization:salt_ore',
  'modern_industrialization:deepslate_salt_ore',
  'modern_industrialization:tin_ore',
  'modern_industrialization:deepslate_tin_ore',
  'modern_industrialization:uranium_ore',
  'modern_industrialization:deepslate_uranium_ore',
  'tfmg:lead_ore',
  'tfmg:deepslate_lead_ore',
  'tfmg:nickel_ore',
  'tfmg:deepslate_nickel_ore'
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

var createch2HiddenAgeFoundationItems = [
  /^chancecubes:.*$/,
  'stellaris:steel_ingot',
  'stellaris:raw_steel_ingot',
  'stellaris:uranium_ingot',
  'stellaris:raw_uranium',
  'stellaris:plutonium_ingot'
]

// TFC Metallurgy owns physical geology in Createch 2. Its ore blocks,
// graded ore items, and small surface samples stay visible, while MI or the
// source mod owns most conventional processed forms and finished equipment.
// This is JEI presentation cleanup only; recipe and tag authority are handled
// in their owning server-side phases.
var createch2HiddenTfcMetallurgyItems = []

var createch2TfcMetallurgySuppressedFamilies = new Set([
  'alnico',
  'beryllium_copper',
  'blutonium',
  'ferroboron',
  'florentine_bronze',
  'high_carbon_tungsten_steel',
  'mithril',
  'nickel_silver',
  'osmiridium',
  'pink_slime',
  'tungsten_steel'
])

var createch2TfcMetallurgyDuplicateFamilies = new Set([
  'andesite_alloy',
  'pewter',
  'refined_glowstone',
  'refined_obsidian',
  'solder'
])

var createch2TfcMetallurgyPhysicalOnlyFamilies = new Set([
  'aluminum',
  'antimony',
  'beryllium',
  'boron',
  'graphite',
  'iridium',
  'lead',
  'lithium',
  'magnesium',
  'manganese',
  'osmium',
  'platinum',
  'titanium',
  'tungsten',
  'uranium',
  'zirconium'
])

// BEGIN GENERATED MATERIAL FAMILY CLASSIFICATION
// Source: createch-dev/scripts/sources/material_authority.json; server ownership is authoritative.
var createch2MaterialFamilyPolicy = {"cobalt":{"classification":"ACTIVE","forms":{"ingot":"gtceu:cobalt_ingot","dust":"gtceu:cobalt_dust","nugget":"gtceu:cobalt_nugget","plate":"gtceu:cobalt_plate","rod":"gtceu:cobalt_rod"}},"compressed_iron":{"classification":"LIBRARY_NON_CAMPAIGN","forms":{"ingot":"tfc_metallurgy:metal/ingot/compressed_iron","rod":"tfc_metallurgy:metal/rod/compressed_iron"}},"constantan":{"classification":"ACTIVE","forms":{"ingot":"tfmg:constantan_ingot","dust":"chemica:constantan_dust","nugget":"tfmg:constantan_nugget","rod":"tfc_items:constantan_rod","wire":"tfmg:constantan_wire","gear":"tfc_items:constantan_gear"}},"enderium":{"classification":"LIBRARY_NON_CAMPAIGN","forms":{"ingot":"tfc_metallurgy:metal/ingot/enderium","rod":"tfc_metallurgy:metal/rod/enderium"}},"invar":{"classification":"ACTIVE","forms":{"ingot":"modern_industrialization:invar_ingot","dust":"modern_industrialization:invar_dust","nugget":"modern_industrialization:invar_nugget","plate":"modern_industrialization:invar_plate","rod":"modern_industrialization:invar_rod","gear":"modern_industrialization:invar_gear"}},"lumium":{"classification":"LIBRARY_NON_CAMPAIGN","forms":{"ingot":"tfc_metallurgy:metal/ingot/lumium","rod":"tfc_metallurgy:metal/rod/lumium"}},"neodymium":{"classification":"ACTIVE","forms":{"ingot":"gtceu:neodymium_ingot","dust":"modern_industrialization:neodymium_dust","nugget":"gtceu:neodymium_nugget","plate":"gtceu:neodymium_plate","rod":"gtceu:neodymium_rod"}},"signalum":{"classification":"LIBRARY_NON_CAMPAIGN","forms":{"ingot":"tfc_metallurgy:metal/ingot/signalum","rod":"tfc_metallurgy:metal/rod/signalum"}},"thorium":{"classification":"LIBRARY_NON_CAMPAIGN","forms":{"ingot":"gtceu:thorium_ingot","dust":"gtceu:thorium_dust","nugget":"gtceu:thorium_nugget","plate":"gtceu:thorium_plate","rod":"gtceu:thorium_rod"}},"vanadium":{"classification":"ACTIVE","forms":{"ingot":"gtceu:vanadium_ingot","dust":"gtceu:vanadium_dust","nugget":"gtceu:vanadium_nugget","plate":"chemlib:vanadium_plate","rod":"tfc_metallurgy:metal/rod/vanadium"}},"zircaloy":{"classification":"LIBRARY_NON_CAMPAIGN","forms":{"ingot":"tfc_metallurgy:metal/ingot/zircaloy","rod":"tfc_metallurgy:metal/rod/zircaloy"}}}
var createch2CanonicalMaterialItems = new Set(["create:copper_sheet","tfc:metal/ingot/copper","modern_industrialization:copper_dust","create:copper_nugget","tfc:metal/rod/copper","modern_industrialization:copper_gear","tfmg:copper_wire","modern_industrialization:tin_plate","tfc:metal/ingot/tin","modern_industrialization:tin_dust","modern_industrialization:tin_nugget","tfc:metal/rod/tin","modern_industrialization:tin_gear","modern_industrialization:tin_wire","createaddition:zinc_sheet","tfc:metal/ingot/zinc","create:zinc_nugget","tfc:metal/rod/zinc","modern_industrialization:bronze_plate","tfc:metal/ingot/bronze","modern_industrialization:bronze_dust","modern_industrialization:bronze_nugget","tfc:metal/rod/bronze","modern_industrialization:bronze_gear","create:brass_sheet","tfc:metal/ingot/brass","create:brass_nugget","tfc:metal/rod/brass","gtceu:wrought_iron_plate","tfc:metal/ingot/wrought_iron","tfc:metal/rod/wrought_iron","modern_industrialization:steel_plate","tfc:metal/ingot/steel","modern_industrialization:steel_dust","tfmg:steel_nugget","tfc:metal/rod/steel","modern_industrialization:steel_gear","tfmg:nickel_sheet","tfc:metal/ingot/nickel","modern_industrialization:nickel_dust","tfmg:nickel_nugget","tfc:metal/rod/nickel","tfmg:lead_sheet","tfmg:lead_ingot","modern_industrialization:lead_dust","tfmg:lead_nugget","tfmg:aluminum_sheet","tfmg:aluminum_ingot","modern_industrialization:aluminum_dust","tfmg:aluminum_nugget","modern_industrialization:aluminum_rod","modern_industrialization:aluminum_gear","tfmg:aluminum_wire","modern_industrialization:stainless_steel_plate","modern_industrialization:stainless_steel_ingot","modern_industrialization:stainless_steel_dust","modern_industrialization:stainless_steel_nugget","modern_industrialization:stainless_steel_rod","modern_industrialization:stainless_steel_gear","modern_industrialization:chromium_plate","modern_industrialization:chromium_ingot","modern_industrialization:chromium_dust","modern_industrialization:chromium_nugget","gtceu:manganese_plate","modern_industrialization:manganese_dust","modern_industrialization:titanium_plate","modern_industrialization:titanium_ingot","modern_industrialization:titanium_dust","modern_industrialization:titanium_nugget","modern_industrialization:titanium_rod","modern_industrialization:titanium_gear","modern_industrialization:tungsten_plate","modern_industrialization:tungsten_ingot","modern_industrialization:tungsten_dust","modern_industrialization:tungsten_nugget","gtceu:molybdenum_ingot","gtceu:molybdenum_dust","gtceu:molybdenum_nugget","gtceu:molybdenum_plate","gtceu:molybdenum_rod","chemlib:lithium_plate","tfmg:lithium_ingot","mekanism:dust_lithium","tfmg:lithium_nugget","chemlib:uranium_plate","modern_industrialization:uranium_ingot","modern_industrialization:uranium_dust","modern_industrialization:uranium_nugget","modern_industrialization:uranium_rod","modern_industrialization:platinum_plate","modern_industrialization:platinum_ingot","modern_industrialization:platinum_dust","modern_industrialization:platinum_nugget","gtceu:osmium_plate","mekanism:ingot_osmium","mekanism:dust_osmium","mekanism:nugget_osmium","modern_industrialization:iridium_plate","modern_industrialization:iridium_ingot","modern_industrialization:iridium_dust","modern_industrialization:iridium_nugget","gtceu:neodymium_ingot","modern_industrialization:neodymium_dust","gtceu:neodymium_nugget","gtceu:neodymium_plate","gtceu:neodymium_rod","gtceu:tungsten_steel_plate","gtceu:tungsten_steel_ingot","gtceu:tungsten_steel_dust","gtceu:rhodium_plated_palladium_ingot","gtceu:rhodium_plated_palladium_dust","gtceu:rhodium_plated_palladium_plate","sgjourney:naquadah_ingot","gtceu:naquadah_alloy_ingot","gtceu:naquadah_alloy_plate","gtceu:naquadah_alloy_dust","gtceu:darmstadtium_ingot","gtceu:darmstadtium_dust","gtceu:darmstadtium_plate","gtceu:neutronium_ingot","gtceu:neutronium_plate","gtceu:cobalt_ingot","gtceu:cobalt_dust","gtceu:cobalt_nugget","gtceu:cobalt_plate","gtceu:cobalt_rod","tfmg:constantan_ingot","chemica:constantan_dust","tfmg:constantan_nugget","tfc_items:constantan_rod","tfmg:constantan_wire","tfc_items:constantan_gear","modern_industrialization:invar_ingot","modern_industrialization:invar_dust","modern_industrialization:invar_nugget","modern_industrialization:invar_plate","modern_industrialization:invar_rod","modern_industrialization:invar_gear","gtceu:vanadium_ingot","gtceu:vanadium_dust","gtceu:vanadium_nugget","chemlib:vanadium_plate","tfc_metallurgy:metal/rod/vanadium","modern_industrialization:superconductor_dust","modern_industrialization:superconductor_ingot","modern_industrialization:superconductor_nugget","modern_industrialization:superconductor_plate","modern_industrialization:superconductor_wire","modern_industrialization:superconductor_cable","tfc:metal/ingot/silver","modern_industrialization:silver_dust","modern_industrialization:silver_plate","modern_industrialization:silver_nugget","tfc:metal/rod/silver","modern_industrialization:silver_wire","tfc_items:silver_gear","tfc:metal/ingot/gold","modern_industrialization:gold_dust","create:golden_sheet","minecraft:gold_nugget","tfc:metal/rod/gold","createaddition:gold_wire","modern_industrialization:gold_gear","minecraft:iron_ingot","modern_industrialization:iron_dust","create:iron_sheet","minecraft:iron_nugget","modern_industrialization:iron_rod","createaddition:iron_wire","modern_industrialization:iron_gear","gtceu:osmiridium_dust","chemlib:calcium_dust","tfc_metallurgy:metal/ingot/high_carbon_tungsten_steel","gtceu:tiny_vanadium_magnetite_dust","gtceu:vanadium_magnetite_dust","chemlib:palladium_dust","chemlib:palladium_ingot","chemlib:osmium_dust","chemlib:osmium_ingot","tfc_metallurgy:metal/ingot/magnesium","gtceu:magnesium_dust","chemlib:magnesium_nugget","chemica:magnesium_sheet","tfc_metallurgy:metal/rod/magnesium","gtceu:tantalum_ingot","gtceu:tantalum_dust","gtceu:tantalum_nugget","gtceu:tantalum_plate","tfc_metallurgy:metal/rod/tantalum","tfc_metallurgy:metal/ingot/graphite","gtceu:graphite_dust","chemica:graphite_sheet","tfc_metallurgy:metal/rod/graphite","chemlib:sodium_ingot","modern_industrialization:sodium_dust","chemlib:sodium_nugget","chemlib:sodium_plate","gtceu:molybdenite_dust","gtceu:tiny_tungsten_steel_dust","modern_industrialization:aluminum_tiny_dust"])
var createch2PhysicalMicroformItems = new Set(["tfc_metallurgy:metal/dust/alnico","tfc_metallurgy:metal/dust/aluminum","tfc_metallurgy:metal/dust/andesite_alloy","tfc_metallurgy:metal/dust/antimony","tfc_metallurgy:metal/dust/beryllium_copper","tfc_metallurgy:metal/dust/beryllium","tfc_metallurgy:metal/dust/blutonium","tfc_metallurgy:metal/dust/boron","tfc_metallurgy:metal/dust/cobalt","tfc_metallurgy:metal/dust/compressed_iron","tfc_metallurgy:metal/dust/constantan","tfc_metallurgy:metal/dust/electrum","tfc_metallurgy:metal/dust/enderium","tfc_metallurgy:metal/dust/ferroboron","tfc_metallurgy:metal/dust/florentine_bronze","tfc_metallurgy:metal/dust/graphite","tfc_metallurgy:metal/dust/high_alloy_steel","tfc_metallurgy:metal/dust/invar","tfc_metallurgy:metal/dust/iridium","tfc_metallurgy:metal/dust/lead","tfc_metallurgy:metal/dust/lithium","tfc_metallurgy:metal/dust/lumium","tfc_metallurgy:metal/dust/magnesium","tfc_metallurgy:metal/dust/manganese","tfc_metallurgy:metal/dust/mithril","tfc_metallurgy:metal/dust/molybdenum","tfc_metallurgy:metal/dust/neodymium","tfc_metallurgy:metal/dust/nickel_silver","tfc_metallurgy:metal/dust/niobium","tfc_metallurgy:metal/dust/osmiridium","tfc_metallurgy:metal/dust/osmium","tfc_metallurgy:metal/dust/pewter","tfc_metallurgy:metal/dust/pink_slime","tfc_metallurgy:metal/dust/platinum","tfc_metallurgy:metal/dust/refined_glowstone","tfc_metallurgy:metal/dust/refined_obsidian","tfc_metallurgy:metal/dust/signalum","tfc_metallurgy:metal/dust/solder","tfc_metallurgy:metal/dust/tantalum","tfc_metallurgy:metal/dust/thorium","tfc_metallurgy:metal/dust/titanium","tfc_metallurgy:metal/dust/tungsten","tfc_metallurgy:metal/dust/tungsten_steel","tfc_metallurgy:metal/dust/uranium","tfc_metallurgy:metal/dust/vanadium","tfc_metallurgy:metal/dust/zircaloy","tfc_metallurgy:metal/dust/zirconium","tfc_items:aluminum_foil","tfc_items:bismuth_foil","tfc_items:bismuth_bronze_foil","tfc_items:black_bronze_foil","tfc_items:black_steel_foil","tfc_items:blue_steel_foil","tfc_items:brass_foil","tfc_items:bronze_foil","tfc_items:cast_iron_foil","tfc_items:chromium_foil","tfc_items:constantan_foil","tfc_items:copper_foil","tfc_items:electrum_foil","tfc_items:gold_foil","tfc_items:lead_foil","tfc_items:nickel_foil","tfc_items:red_steel_foil","tfc_items:rose_gold_foil","tfc_items:silver_foil","tfc_items:stainless_steel_foil","tfc_items:steel_foil","tfc_items:sterling_silver_foil","tfc_items:tin_foil","tfc_items:uranium_foil","tfc_items:wrought_iron_foil","tfc_items:zinc_foil"])
// END GENERATED MATERIAL FAMILY CLASSIFICATION
// BEGIN GENERATED INTERNAL PROCESS VISIBILITY
var createch2InternalProcessItems = new Set(["gtceu:plant_ball","gtceu:meat_dust","gtceu:tiny_bone_dust","gtceu:calcite_dust","gtceu:stone_dust","gtceu:bio_chaff","gtceu:collagen_dust","gtceu:gelatin_dust","gtceu:agar_dust","gtceu:stem_cells","gtceu:cylinder_casting_mold","gtceu:petri_dish","gtceu:multilayer_fiber_reinforced_circuit_board","gtceu:wetware_circuit_board","gtceu:wetware_printed_circuit_board","gtceu:polydimethylsiloxane_dust","gtceu:small_pipe_casting_mold","gtceu:plate_casting_mold","gtceu:polybenzimidazole_small_fluid_pipe","gtceu:silicone_rubber_plate","gtceu:silicone_rubber_foil","gtceu:tungsten_steel_bolt","gtceu:neuro_processing_unit","gtceu:polybenzimidazole_plate","gtceu:polybenzimidazole_foil","gtceu:wetware_processor","gtceu:wetware_processor_assembly","gtceu:wetware_processor_computer","gtceu:wetware_processor_mainframe","gtceu:biphenyl_dust","gtceu:tiny_pipe_casting_mold","gtceu:stainless_steel_tiny_fluid_pipe","gtceu:stainless_steel_screw"])
var createch2InternalProcessFluids = new Set(["gtceu:biomass","gtceu:distilled_water","gtceu:dimethylbenzene","gtceu:phthalic_acid","gtceu:chlorobenzene","gtceu:nitrochlorobenzene","gtceu:dichlorobenzidine","gtceu:diaminobenzidine","gtceu:diphenyl_isophthalate","gtceu:polybenzimidazole","gtceu:nitration_mixture","gtceu:diluted_sulfuric_acid","gtceu:bacteria","gtceu:bacterial_sludge","gtceu:enriched_bacterial_sludge","gtceu:mutagen","gtceu:gelatin_mixture","gtceu:raw_growth_medium","gtceu:sterilized_growth_medium","gtceu:iron_iii_chloride","gtceu:chloromethane","gtceu:dimethyldichlorosilane","gtceu:diluted_hydrochloric_acid","gtceu:silicone_rubber","gtceu:polychlorinated_biphenyl","gtceu:pcb_coolant"])
// END GENERATED INTERNAL PROCESS VISIBILITY

var createch2TfcMetallurgyProcessedForms = new Set([
  'dust',
  'ingot',
  'double_ingot',
  'sheet',
  'double_sheet',
  'rod'
])

var createch2TfcMetallurgyEquipmentForms = new Set([
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
])

var createch2TfcMetallurgyDecorativeForms = new Set([
  'unfinished_lamp',
  'anvil',
  'chain',
  'lamp',
  'trapdoor',
  'block',
  'stairs',
  'slab'
])

var createch2TfcMetallurgyRootDecorativeFamilies = {
  beryllium_copper_bell: 'beryllium_copper',
  florentine_bronze_bell: 'florentine_bronze',
  enderium_bars: 'enderium',
  titanium_bars: 'titanium',
  tungsten_bars: 'tungsten',
  tungsten_steel_bars: 'tungsten_steel'
}

var createch2TfcMetallurgySupportedEquipment = new Set([
  'titanium:pickaxe',
  'titanium:pickaxe_head'
])

var createch2HiddenTfcMetallurgyFluids = []

var createch2HiddenElectricalDuplicates = [
  'mekanism:basic_universal_cable',
  'mekanism:advanced_universal_cable',
  'mekanism:elite_universal_cable',
  'mekanism:ultimate_universal_cable',
  /^modern_industrialization:(?:tin|copper|cupronickel|electrum|silver|aluminum|kanthal|platinum|annealed_copper)_cable$/,
  /^moderndynamics:(?:lv|mv|hv|ev|superconductor)_cable$/,
  'moderndynamics:debug_tool',
  'mekanismgenerators:heat_generator',
  'mekanismgenerators:bio_generator',
  'mekanismgenerators:gas_burning_generator',
  'mekanismgenerators:wind_generator',
  'mekanismgenerators:solar_generator',
  'mekanismgenerators:advanced_solar_generator',
  'productivebees:honey_generator'
]

var createch2HiddenOritechJdtAuthorityConflicts = [
  /^oritech:(?:basic_generator_block|big_solar_panel_block|bio_generator_block|fuel_generator_block|lava_generator_block|steam_engine_block)$/,
  /^oritech:(?:energy_pipe|energy_pipe_connection|energy_pipe_duct_block|framed_energy_pipe|framed_energy_pipe_connection|superconductor|superconductor_duct_block|framed_superconductor|framed_superconductor_connection|power_pole_block)$/,
  /^oritech:(?:small_storage_block|large_storage_block|creative_storage_block|creative_tank_block|capacitor_addon_extender|steam_boiler_addon)$/,
  /^oritech:(?:item_pipe|transparent_item_pipe|framed_item_pipe|item_pipe_connection|framed_item_pipe_connection|item_pipe_duct_block|fluid_pipe|framed_fluid_pipe|fluid_pipe_connection|framed_fluid_pipe_connection|fluid_pipe_duct_block)$/,
  /^oritech:(?:nickel_ore|deepslate_nickel_ore|deepslate_platinum_ore|endstone_platinum_ore|deepslate_uranium_ore|raw_nickel|raw_nickel_block|raw_platinum|raw_platinum_block|raw_uranium|raw_uranium_block|uranium_gem|small_uranium_dust|uranium_dust|uranium_dust_block|uranium_pellet|small_uranium_pellet)$/,
  /^oritech:still_(?:oil|heavy_oil|diesel|naphtha|fuel|steam|biofuel|sulfuric_acid)_bucket$/,
  'oritech:quarry_addon',
  'oritech:low_yield_nuke',
  'oritech:nuke',
  'oritech:exo_jetpack',
  'oritech:jetpack_exo_elytra',
  /^justdirethings:(?:raw_ferricore|raw_ferricore_ore|raw_blazegold|raw_blazegold_ore|raw_celestigem_ore|raw_eclipsealloy|raw_eclipsealloy_ore)$/,
  /^justdirethings:(?:generatort1|generatorfluidt1|energytransmitter|pocket_generator)$/,
  /^justdynathings:(?:ferricore_solar_panel|blazegold_solar_panel|celestigem_solar_panel|eclipse_alloy_solar_panel|thermo_generator|creative_goo)$/,
  /^justdynathings:echoing_budding_(?:allthemodium|black_quartz|entro|phasorite|ruby|sapphire|topaz|unobtainium|vibranium)$/
]

var createch2HiddenOrdinaryToolDuplicates = [
  'minecraft:copper_pickaxe',
  'minecraft:copper_axe',
  'minecraft:copper_shovel',
  'minecraft:copper_hoe',
  'minecraft:copper_sword',
  'minecraft:copper_helmet',
  'minecraft:copper_chestplate',
  'minecraft:copper_leggings',
  'minecraft:copper_boots',
  'htm:hatchet',
  'htm:flint_knife',
  'htm:bone_knife'
]


var createch2HiddenEternalStarlightBypassItems = [
  'eternal_starlight:underminer',
  'eternal_starlight:mechanical_spawner',
  'eternal_starlight:wand_of_teleportation',
  'eternal_starlight:gravity_pickaxe',
  'eternal_starlight:orb_of_prophecy',
  'eternal_starlight:aetherstrike_rocket',
  'eternal_starlight:tear_bomb',
  /^eternal_starlight:.*(?:deepsilver|amaramber|malarite|aethersent|unrealium|golem_steel|starlit_diamond).*(?:sword|axe|pickaxe|shovel|hoe|sickle|spear|helmet|chestplate|leggings|boots|hood|bottoms|cape|crossbow|greatsword).*$/
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
  /^quark:(?:lootr_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|blossom|azalea|ancient|purpur|prismarine|nether_brick)_chest_(?:boat|raft)$/,
]

var Createch2JeiBuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
var Createch2JeiResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')

// GregTech is presentation-default-denied to match the server-side recipe
// policy. Registry paths are coerced to native strings before Set lookup.
var createch2GregFacilityPaths = new Set([
  'filter_casing', 'cleanroom_glass', 'cleanroom',
  'iv_circuit_assembler', 'iv_laser_engraver', 'iv_scanner',
  'iv_1a_energy_converter', 'iv_energy_input_hatch', 'maintenance_hatch',
  'iv_input_bus', 'iv_output_bus', 'iv_input_hatch', 'iv_output_hatch',
  'large_scale_assembler_casing', 'large_assembler', 'large_circuit_assembler',
  'advanced_computer_casing', 'data_bank', 'research_station',
  'high_performance_computation_array', 'hpca_computation_component',
  'hpca_heat_sink_component', 'computation_receiver_hatch',
  'hpca_advanced_computation_component', 'hpca_active_cooler_component',
  'hpca_bridge_component', 'network_switch', 'normal_optical_pipe',
  'computation_transmitter_hatch', 'object_holder',
  'data_access_hatch', 'data_receiver_hatch', 'data_transmitter_hatch',
  'data_stick', 'data_orb',
  'pyrolyse_oven', 'cracker', 'large_chemical_reactor', 'alloy_blast_smelter',
  'ulv_machine_casing', 'clean_machine_casing', 'inert_machine_casing',
  'ptfe_pipe_casing', 'kanthal_coil_block',
  'high_temperature_smelting_casing', 'heat_vent', 'iv_muffler_hatch',
  'assembly_line_casing', 'assembly_line_grating', 'assembly_line_unit',
  'assembly_line', 'luv_circuit_assembler', 'luv_laser_engraver',
  'luv_energy_input_hatch', 'luv_1a_energy_converter',
  'luv_mixer', 'luv_centrifuge', 'luv_autoclave', 'sterilizing_filter_casing',
  'luv_brewery', 'luv_distillery', 'luv_fluid_heater',
  'zpm_circuit_assembler', 'zpm_1a_energy_converter',
  'uv_1a_energy_converter', 'uv_energy_input_hatch'
])

var createch2GregComponentPaths = new Set([
  'silicon_boule', 'silicon_wafer', 'cpu_wafer', 'cpu_chip',
  'ram_wafer', 'ram_chip', 'simple_soc_wafer', 'simple_soc',
  'smd_resistor', 'smd_capacitor', 'smd_diode', 'smd_transistor', 'smd_inductor',
  'plastic_circuit_board', 'plastic_printed_circuit_board', 'micro_processor',
  'iv_electric_motor', 'iv_electric_pump', 'iv_conveyor_module', 'iv_robot_arm',
  'iv_sensor', 'iv_emitter', 'iv_field_generator',
  'phosphorus_boule', 'phosphorus_wafer', 'nano_cpu_wafer', 'nano_cpu_chip',
  'advanced_soc_wafer', 'advanced_soc', 'qbit_cpu_wafer', 'qbit_cpu_chip',
  'advanced_smd_resistor', 'advanced_smd_capacitor', 'advanced_smd_diode',
  'advanced_smd_transistor', 'advanced_smd_inductor',
  'fiber_reinforced_circuit_board', 'fiber_reinforced_printed_circuit_board',
  'nano_processor', 'quantum_processor', 'crystal_soc', 'crystal_processor',
  'luv_conveyor_module', 'luv_robot_arm', 'luv_sensor', 'luv_emitter', 'luv_field_generator'
])

// The exact 104 registered functional components are the only broad GT tier
// surface exposed by the pack.  Every other high-tier machine remains hidden.
;[
  'lv', 'mv', 'hv', 'ev', 'iv', 'luv', 'zpm', 'uv',
  'uhv', 'uev', 'uiv', 'uxv', 'opv'
].forEach(tier => {
  ;[
    'electric_motor', 'electric_pump', 'electric_piston', 'conveyor_module',
    'robot_arm', 'sensor', 'emitter', 'field_generator'
  ].forEach(family => createch2GregComponentPaths.add(`${tier}_${family}`))
})

var createch2GregVisiblePaths = new Set()
createch2GregFacilityPaths.forEach(path => createch2GregVisiblePaths.add(path))
createch2GregComponentPaths.forEach(path => createch2GregVisiblePaths.add(path))
;[
  'rubber_log', 'stripped_rubber_log', 'rubber_wood', 'stripped_rubber_wood',
  'rubber_leaves', 'rubber_sapling', 'rubber_planks', 'rubber_slab',
  'rubber_stairs', 'rubber_fence', 'rubber_fence_gate', 'rubber_door',
  'rubber_trapdoor', 'rubber_pressure_plate', 'rubber_button'
].forEach(path => createch2GregVisiblePaths.add(path))

var createch2HiddenGregItems = []
var createch2HiddenGregFluids = []
var createch2GregJeiStats = {
  discovered: 0,
  hidden: 0,
  visible: 0,
  selectedFacilitiesVisible: 0,
  selectedComponentsVisible: 0,
  unexpectedVisible: 0
}
var createch2GregJeiListsBuilt = false

var createch2BuildGregJeiHideLists = () => {
  if (createch2GregJeiListsBuilt) return

  createch2HiddenGregItems.length = 0
  createch2HiddenGregFluids.length = 0
  Object.keys(createch2GregJeiStats).forEach(key => {
    createch2GregJeiStats[key] = 0
  })

  var itemKeys = Createch2JeiBuiltInRegistries.ITEM.keySet().iterator()
  while (itemKeys.hasNext()) {
    var itemId = itemKeys.next()
    if (String(itemId.getNamespace()) !== 'gtceu') continue

    createch2GregJeiStats.discovered++
    var path = String(itemId.getPath())
    if (createch2GregVisiblePaths.has(path) || createch2CanonicalMaterialItems.has(String(itemId.toString())) || createch2CanonicalPlateItems.has(String(itemId.toString())) || createch2HeavyGearItems.has(String(itemId.toString())) || createch2InternalProcessItems.has(String(itemId.toString()))) {
      createch2GregJeiStats.visible++
      if (createch2GregFacilityPaths.has(path)) createch2GregJeiStats.selectedFacilitiesVisible++
      if (createch2GregComponentPaths.has(path)) createch2GregJeiStats.selectedComponentsVisible++
    } else {
      createch2HiddenGregItems.push(String(itemId.toString()))
      createch2GregJeiStats.hidden++
    }
  }

  var fluidKeys = Createch2JeiBuiltInRegistries.FLUID.keySet().iterator()
  while (fluidKeys.hasNext()) {
    var fluidId = fluidKeys.next()
    if (String(fluidId.getNamespace()) === 'gtceu' && !createch2InternalProcessFluids.has(String(fluidId.toString()))) {
      createch2HiddenGregFluids.push(String(fluidId.toString()))
    }
  }

  createch2HiddenGregItems.sort()
  createch2HiddenGregFluids.sort()

  console.info(
    '[Createch2 JEI] Greg containment: ' +
    createch2GregJeiStats.discovered + ' discovered, ' +
    createch2GregJeiStats.hidden + ' hidden, ' +
    createch2GregJeiStats.visible + ' visible; ' +
    createch2GregJeiStats.selectedFacilitiesVisible + ' selected facilities, ' +
    createch2GregJeiStats.selectedComponentsVisible + ' selected components, ' +
    createch2GregJeiStats.unexpectedVisible + ' unexpected visible.'
  )
  createch2GregJeiListsBuilt = true
}

var createch2TfcMetallurgyHideStats = {
  totalDiscovered: 0,
  hiddenBefore: 0,
  hiddenAfter: 0,
  remainingVisible: 0,
  oreFormsPreserved: 0,
  smallOreFormsPreserved: 0,
  bloomIntermediatesPreserved: 0,
  equipmentItemsHidden: 0,
  decorativeItemsHidden: 0,
  processedFormsHidden: 0,
  canonicalItemsRetained: 0,
  physicalItemsRetained: 0,
  libraryItemsHidden: 0,
  duplicateItemsHidden: 0,
  otherItemsRetained: 0
}

var createch2ClassifyTfcMetallurgyItem = path => {
  // Registry paths arrive as java.lang.String values under Rhino. Coerce once
  // so Set membership checks use the script's native string keys.
  path = String(path)

  // All geological registry paths are deliberately preserved, including
  // poor/normal/rich ore items, rock-hosted ore blocks, and small indicators.
  if (path.startsWith('ore/')) {
    return {
      hide: false,
      category: path.startsWith('ore/small_') ? 'small_ore' : 'ore'
    }
  }

  // Bloom intermediates are left visible until the later processing-authority
  // phase proves whether their native metallurgy route is being retained.
  if (
    (path.startsWith('raw_') || path.startsWith('refined_')) &&
    path.endsWith('_bloom')
  ) {
    return { hide: false, category: 'bloom' }
  }

  if (Object.prototype.hasOwnProperty.call(createch2TfcMetallurgyRootDecorativeFamilies, path)) {
    var family = createch2TfcMetallurgyRootDecorativeFamilies[path]
    return { hide: false, category: 'decorative', family: family }
  }

  if (path.startsWith('bucket/metal/')) {
    var family = path.substring('bucket/metal/'.length)
    return { hide: false, category: 'other', family: family }
  }

  if (!path.startsWith('metal/')) {
    return { hide: false, category: 'other' }
  }

  var pathParts = path.split('/')
  if (pathParts.length !== 3) {
    return { hide: false, category: 'other' }
  }

  var form = pathParts[1]
  var family = pathParts[2]

  if (createch2TfcMetallurgyEquipmentForms.has(form)) {
    var equipmentKey = `${family}:${form}`
    return {
      hide: !createch2TfcMetallurgySupportedEquipment.has(equipmentKey),
      category: 'equipment',
      family: family
    }
  }

  if (createch2TfcMetallurgyProcessedForms.has(form)) {
    var policy = createch2MaterialFamilyPolicy[family]
    if (policy) {
      if (policy.classification === 'LIBRARY_NON_CAMPAIGN') return { hide: true, category: 'library', family: family }
      if (createch2PhysicalMicroformItems.has('tfc_metallurgy:' + path)) return { hide: false, category: 'physical', family: family }
      var canonical = policy.forms[form]
      if (canonical) return { hide: canonical !== 'tfc_metallurgy:' + path, category: canonical === 'tfc_metallurgy:' + path ? 'canonical' : 'duplicate', family: family }
      return { hide: false, category: 'physical', family: family }
    }
    return { hide: false, category: 'processed', family: family }
  }

  if (createch2TfcMetallurgyDecorativeForms.has(form)) {
    return { hide: false, category: 'decorative', family: family }
  }

  return { hide: false, category: 'other', family: family }
}

var createch2BuildTfcMetallurgyJeiHideList = () => {
  createch2HiddenTfcMetallurgyItems.length = 0
  Object.keys(createch2TfcMetallurgyHideStats).forEach(key => {
    createch2TfcMetallurgyHideStats[key] = 0
  })

  var itemKeys = Createch2JeiBuiltInRegistries.ITEM.keySet().iterator()

  while (itemKeys.hasNext()) {
    var itemId = itemKeys.next()
    if (itemId.getNamespace() !== 'tfc_metallurgy') {
      continue
    }

    createch2TfcMetallurgyHideStats.totalDiscovered++
    var classification = createch2ClassifyTfcMetallurgyItem(itemId.getPath())

    if (classification.hide) {
      // ResourceLocation#toString returns a java.lang.String under Rhino.
      // Normalize it so the removal builder does not misclassify the ID as a
      // regular-expression object and attempt to call .test() on it.
      createch2HiddenTfcMetallurgyItems.push(String(itemId.toString()))
      createch2TfcMetallurgyHideStats.hiddenAfter++

      if (classification.category === 'library') {
        createch2TfcMetallurgyHideStats.libraryItemsHidden++
      } else if (classification.category === 'duplicate') {
        createch2TfcMetallurgyHideStats.duplicateItemsHidden++
      } else if (classification.category === 'equipment') {
        createch2TfcMetallurgyHideStats.equipmentItemsHidden++
      } else if (classification.category === 'decorative') {
        createch2TfcMetallurgyHideStats.decorativeItemsHidden++
      } else if (classification.category === 'processed') {
        createch2TfcMetallurgyHideStats.processedFormsHidden++
      }
      continue
    }

    if (classification.category === 'small_ore') {
      createch2TfcMetallurgyHideStats.oreFormsPreserved++
      createch2TfcMetallurgyHideStats.smallOreFormsPreserved++
    } else if (classification.category === 'ore') {
      createch2TfcMetallurgyHideStats.oreFormsPreserved++
    } else if (classification.category === 'bloom') {
      createch2TfcMetallurgyHideStats.bloomIntermediatesPreserved++
    } else if (classification.category === 'canonical') {
      createch2TfcMetallurgyHideStats.canonicalItemsRetained++
    } else if (classification.category === 'physical') {
      createch2TfcMetallurgyHideStats.physicalItemsRetained++
    } else {
      createch2TfcMetallurgyHideStats.otherItemsRetained++
    }
  }

  createch2HiddenTfcMetallurgyItems.sort()
  createch2TfcMetallurgyHideStats.remainingVisible =
    createch2TfcMetallurgyHideStats.totalDiscovered - createch2TfcMetallurgyHideStats.hiddenAfter

  console.info(
    '[Createch2 JEI] TFC Metallurgy presentation: ' +
    createch2TfcMetallurgyHideStats.totalDiscovered + ' discovered, ' +
    createch2TfcMetallurgyHideStats.hiddenAfter + ' hidden, ' +
    createch2TfcMetallurgyHideStats.remainingVisible + ' visible; preserved ' +
    createch2TfcMetallurgyHideStats.oreFormsPreserved + ' ore forms (' +
    createch2TfcMetallurgyHideStats.smallOreFormsPreserved + ' small indicators).'
  )
}

var createch2BuildJeiRemovalPredicate = (ruleGroups, registry, valueGetter) => {
  var exactIds = new Set()
  var patterns = []

  ruleGroups.forEach(rules => rules.forEach(rule => {
    if (typeof rule === 'string') {
      if (registry.containsKey(Createch2JeiResourceLocation.parse(rule))) exactIds.add(rule)
    } else {
      patterns.push(rule)
    }
  }))

  return value => {
    var id = String(registry.getKey(valueGetter(value)).toString())
    if (registry === Createch2JeiBuiltInRegistries.ITEM && createch2InternalProcessItems.has(id)) return false
    if (registry === Createch2JeiBuiltInRegistries.FLUID && createch2InternalProcessFluids.has(id)) return false
    if (registry === Createch2JeiBuiltInRegistries.ITEM && createch2HeavyGearItems.has(id)) return false
    if (registry === Createch2JeiBuiltInRegistries.ITEM && createch2CanonicalMaterialItems.has(id)) return false
    if (registry === Createch2JeiBuiltInRegistries.ITEM && createch2CanonicalPlateItems.has(id)) return false
    if (exactIds.has(id)) return true
    for (var index = 0; index < patterns.length; index++) {
      if (patterns[index].test(id)) return true
    }
    return false
  }
}

RecipeViewerEvents.removeEntries('item', event => {
  // Client scripts are evaluated before the item registry is populated on a
  // fresh launch. Build the dynamic TFC Metallurgy list when JEI requests its
  // removals, after registries are ready.
  createch2BuildTfcMetallurgyJeiHideList()
  createch2BuildGregJeiHideLists()

  event.remove(createch2BuildJeiRemovalPredicate([
    createch2HiddenParallelSteelItems,
    createch2HiddenDuplicateOreItems,
    createch2HiddenChemicaItems,
    createch2HiddenCreateAdditionItems,
    createch2HiddenProductiveBeePatterns,
    createch2HiddenPersonalExplosives,
    createch2HiddenJunkItems,
    createch2HiddenQuarryPlusItems,
    createch2HiddenWoodFamilyItems,
    createch2HiddenAgeFoundationItems,
    createch2HiddenTfcMetallurgyItems,
    createch2HiddenEternalStarlightBypassItems,
    createch2HiddenElectricalDuplicates,
    createch2HiddenOritechJdtAuthorityConflicts,
    createch2HiddenOrdinaryToolDuplicates,
    createch2HiddenGregItems,
  ], Createch2JeiBuiltInRegistries.ITEM, stack => stack.getItem()))
})

RecipeViewerEvents.removeEntries('fluid', event => {
  createch2BuildGregJeiHideLists()

  // In KubeJS 2101.7, fluid removeEntries converts its argument directly to a
  // FluidIngredient; unlike the item entry type, it cannot wrap a JavaScript
  // predicate. Remove the exact, registry-validated IDs individually.
  var createch2HiddenFluidIds = [
    'createaddition:seed_oil',
    'createaddition:bioethanol',
    'oritech:still_oil',
    'oritech:still_heavy_oil',
    'oritech:still_diesel',
    'oritech:still_naphtha',
    'oritech:still_fuel',
    'oritech:still_steam',
    'oritech:still_biofuel',
    'oritech:still_sulfuric_acid'
  ].concat(
    createch2ChemicaPresentation.hidden_fluids,
    createch2HiddenTfcMetallurgyFluids,
    createch2HiddenGregFluids
  )

  createch2HiddenFluidIds.forEach(fluidId => {
    var normalizedId = String(fluidId)
    if (Createch2JeiBuiltInRegistries.FLUID.containsKey(
      Createch2JeiResourceLocation.parse(normalizedId)
    )) {
      event.remove(normalizedId)
    }
  })
})

// Seamless Loading Screen 2.2.1 can miss its world-selection callback when a
// custom/quick-play menu opens an integrated world. Its screenshot filename
// then remains empty and Save and Quit crashes in Path.of(file.getParent()).
// Seed the public loader with the authoritative level name after login.
var Createch2MinecraftClient = Java.loadClass('net.minecraft.client.Minecraft')
var Createch2SeamlessScreenshotLoader = Java.loadClass(
  'com.minenash.seamless_loading_screen.ScreenshotLoader'
)

ClientEvents.loggedIn(event => {
  var client = Createch2MinecraftClient.getInstance()
  var server = client.getSingleplayerServer()
  if (server !== null) {
    Createch2SeamlessScreenshotLoader.setScreenshot(server.getWorldData().getLevelName())
  }
})

})()
