ItemEvents.modifyTooltips(event => {
  var gtTiers = [
    'lv', 'mv', 'hv', 'ev', 'iv', 'luv', 'zpm', 'uv', 'uhv', 'uev', 'uiv', 'uxv', 'opv'
  ]
  var gtFunctions = [
    'electric_motor', 'electric_pump', 'electric_piston', 'conveyor_module',
    'robot_arm', 'sensor', 'emitter', 'field_generator'
  ]
  var gtFunctionalComponents = []
  gtTiers.forEach(tier => gtFunctions.forEach(kind => {
    gtFunctionalComponents.push(`gtceu:${tier}_${kind}`)
  }))
  gtFunctionalComponents.push(
    'gtceu:phenolic_circuit_board', 'gtceu:phenolic_printed_circuit_board',
    'gtceu:plastic_circuit_board', 'gtceu:plastic_printed_circuit_board',
    'gtceu:fiber_reinforced_circuit_board', 'gtceu:fiber_reinforced_printed_circuit_board',
    'gtceu:micro_processor', 'gtceu:nano_processor', 'gtceu:quantum_processor',
    'gtceu:crystal_processor', 'gtceu:wetware_processor'
  )
  event.add(gtFunctionalComponents, [
    Text.translate('tooltip.createch2.component.gt.role').gold(),
    Text.translate('tooltip.createch2.component.gt.succession').gray()
  ])

  event.add([
    'modern_industrialization:motor', 'modern_industrialization:pump',
    'modern_industrialization:conveyor', 'modern_industrialization:advanced_motor',
    'modern_industrialization:advanced_pump', 'modern_industrialization:large_advanced_motor',
    'modern_industrialization:large_advanced_pump', 'modern_industrialization:electronic_circuit',
    'modern_industrialization:digital_circuit', 'modern_industrialization:quantum_circuit',
    'modern_industrialization:basic_machine_hull', 'modern_industrialization:advanced_machine_hull',
    'modern_industrialization:highly_advanced_machine_hull', 'modern_industrialization:quantum_machine_hull'
  ], [Text.translate('tooltip.createch2.component.mi_subassembly.role').gray()])

  event.add([
    'tfmg:unfinished_steel_mechanism', 'tfmg:steel_mechanism', 'tfmg:heavy_machinery_casing'
  ], [Text.translate('tooltip.createch2.component.tfmg_subassembly.role').gray()])

  var eeMotors = [
    'black', 'blue', 'brown', 'cyan', 'gray', 'green', 'light_blue', 'light_gray',
    'lime', 'magenta', 'orange', 'pink', 'purple', 'red', 'white', 'yellow'
  ].map(color => `electroenergetics:${color}_electric_motor`)
  event.add(eeMotors, [
    Text.translate('tooltip.createch2.component.ee_motor.role').gray(),
    Text.translate('tooltip.createch2.component.ee_motor.safety').red()
  ])

  event.add([
    'coastersengineered:linear_motor',
    'coastersengineered:linear_motor_controller'
  ], [Text.translate('tooltip.createch2.component.coaster_linear.role').gray()])

  event.add([
    'morepropulsion:centrifuge',
    'morepropulsion:engine_mount',
    'morepropulsion:compressor',
    'morepropulsion:turbojet_compressor'
  ], [Text.translate('tooltip.createch2.component.powered_airframe.role').gray()])

  event.add([
    'compactgearbox:compact_gearbox',
    'compactgearbox:sequential_gearbox',
    'compactgearbox:gearbox_controller'
  ], [Text.translate('tooltip.createch2.component.compact_transmission.role').gray()])

  event.add([
    'crush_depth:fathometer',
    'create_submarine:barometer'
  ], [Text.translate('tooltip.createch2.component.depth_instrument.role').gray()])

  event.add([
    'create_submarine:copper_pressurizer',
    'create_submarine:iron_pressurizer'
  ], [Text.translate('tooltip.createch2.component.pressure_hull.role').gray()])
})

// BEGIN GENERATED SMALL FORM UNIT TOOLTIPS
ItemEvents.modifyTooltips(event => {
  event.add(["tfc_metallurgy:metal/dust/alnico","tfc_metallurgy:metal/dust/aluminum","tfc_metallurgy:metal/dust/andesite_alloy","tfc_metallurgy:metal/dust/antimony","tfc_metallurgy:metal/dust/beryllium_copper","tfc_metallurgy:metal/dust/beryllium","tfc_metallurgy:metal/dust/blutonium","tfc_metallurgy:metal/dust/boron","tfc_metallurgy:metal/dust/cobalt","tfc_metallurgy:metal/dust/compressed_iron","tfc_metallurgy:metal/dust/constantan","tfc_metallurgy:metal/dust/electrum","tfc_metallurgy:metal/dust/enderium","tfc_metallurgy:metal/dust/ferroboron","tfc_metallurgy:metal/dust/florentine_bronze","tfc_metallurgy:metal/dust/graphite","tfc_metallurgy:metal/dust/high_alloy_steel","tfc_metallurgy:metal/dust/invar","tfc_metallurgy:metal/dust/iridium","tfc_metallurgy:metal/dust/lead","tfc_metallurgy:metal/dust/lithium","tfc_metallurgy:metal/dust/lumium","tfc_metallurgy:metal/dust/magnesium","tfc_metallurgy:metal/dust/manganese","tfc_metallurgy:metal/dust/mithril","tfc_metallurgy:metal/dust/molybdenum","tfc_metallurgy:metal/dust/neodymium","tfc_metallurgy:metal/dust/nickel_silver","tfc_metallurgy:metal/dust/niobium","tfc_metallurgy:metal/dust/osmiridium","tfc_metallurgy:metal/dust/osmium","tfc_metallurgy:metal/dust/pewter","tfc_metallurgy:metal/dust/pink_slime","tfc_metallurgy:metal/dust/platinum","tfc_metallurgy:metal/dust/refined_glowstone","tfc_metallurgy:metal/dust/refined_obsidian","tfc_metallurgy:metal/dust/signalum","tfc_metallurgy:metal/dust/solder","tfc_metallurgy:metal/dust/tantalum","tfc_metallurgy:metal/dust/thorium","tfc_metallurgy:metal/dust/titanium","tfc_metallurgy:metal/dust/tungsten","tfc_metallurgy:metal/dust/tungsten_steel","tfc_metallurgy:metal/dust/uranium","tfc_metallurgy:metal/dust/vanadium","tfc_metallurgy:metal/dust/zircaloy","tfc_metallurgy:metal/dust/zirconium"], [Text.translate('tooltip.createch2.material.physical_dust.units').gray(), Text.translate('tooltip.createch2.material.physical_dust.conservation').gray()])
  event.add(["tfc_items:aluminum_foil","tfc_items:bismuth_foil","tfc_items:bismuth_bronze_foil","tfc_items:black_bronze_foil","tfc_items:black_steel_foil","tfc_items:blue_steel_foil","tfc_items:brass_foil","tfc_items:bronze_foil","tfc_items:cast_iron_foil","tfc_items:chromium_foil","tfc_items:constantan_foil","tfc_items:copper_foil","tfc_items:electrum_foil","tfc_items:gold_foil","tfc_items:lead_foil","tfc_items:nickel_foil","tfc_items:red_steel_foil","tfc_items:rose_gold_foil","tfc_items:silver_foil","tfc_items:stainless_steel_foil","tfc_items:steel_foil","tfc_items:sterling_silver_foil","tfc_items:tin_foil","tfc_items:uranium_foil","tfc_items:wrought_iron_foil","tfc_items:zinc_foil"], [Text.translate('tooltip.createch2.material.physical_foil.units').gray(), Text.translate('tooltip.createch2.material.physical_foil.conservation').gray()])
  event.add(["tfc_items:copper_wire","electroenergetics:copper_wire","tfc_items:aluminum_wire","tfc_items:constantan_wire","tfc_items:gold_wire","tfc_items:electrum_wire","tfc_items:tin_wire","tfc_items:silver_wire"], [Text.translate('tooltip.createch2.material.light_wire.units').gray(), Text.translate('tooltip.createch2.material.light_wire.conservation').gray()])
})
// END GENERATED SMALL FORM UNIT TOOLTIPS

// BEGIN GENERATED PHYSICAL FASTENER TOOLTIPS
ItemEvents.modifyTooltips(event => {
  event.add(["tfc_items:aluminum_ring","tfc_items:bismuth_bronze_ring","tfc_items:bismuth_ring","tfc_items:black_bronze_ring","tfc_items:black_steel_ring","tfc_items:blue_steel_ring","tfc_items:brass_ring","tfc_items:bronze_ring","tfc_items:cast_iron_ring","tfc_items:chromium_ring","tfc_items:constantan_ring","tfc_items:copper_ring","tfc_items:electrum_ring","tfc_items:gold_ring","tfc_items:lead_ring","tfc_items:nickel_ring","tfc_items:red_steel_ring","tfc_items:rose_gold_ring","tfc_items:silver_ring","tfc_items:stainless_steel_ring","tfc_items:steel_ring","tfc_items:sterling_silver_ring","tfc_items:tin_ring","tfc_items:uranium_ring","tfc_items:wrought_iron_ring","tfc_items:zinc_ring"], [Text.translate('tooltip.createch2.material.physical_ring.units').gray(), Text.translate('tooltip.createch2.material.physical_ring.conservation').gray()])
  event.add(["tfc_items:aluminum_screw","tfc_items:bismuth_bronze_screw","tfc_items:bismuth_screw","tfc_items:black_bronze_screw","tfc_items:black_steel_screw","tfc_items:blue_steel_screw","tfc_items:brass_screw","tfc_items:bronze_screw","tfc_items:cast_iron_screw","tfc_items:chromium_screw","tfc_items:constantan_screw","tfc_items:copper_screw","tfc_items:electrum_screw","tfc_items:gold_screw","tfc_items:lead_screw","tfc_items:nickel_screw","tfc_items:red_steel_screw","tfc_items:rose_gold_screw","tfc_items:silver_screw","tfc_items:stainless_steel_screw","tfc_items:steel_screw","tfc_items:sterling_silver_screw","tfc_items:tin_screw","tfc_items:uranium_screw","tfc_items:wrought_iron_screw","tfc_items:zinc_screw"], [Text.translate('tooltip.createch2.material.physical_screw.units').gray(), Text.translate('tooltip.createch2.material.physical_screw.conservation').gray()])
})
// END GENERATED PHYSICAL FASTENER TOOLTIPS

// BEGIN GENERATED GEAR UNIT TOOLTIPS
ItemEvents.modifyTooltips(event => {
  event.add(["modern_industrialization:aluminum_gear","modern_industrialization:bronze_gear","modern_industrialization:copper_gear","modern_industrialization:gold_gear","modern_industrialization:invar_gear","modern_industrialization:iron_gear","modern_industrialization:stainless_steel_gear","modern_industrialization:steel_gear","modern_industrialization:tin_gear","modern_industrialization:titanium_gear"], [Text.translate('tooltip.createch2.material.standard_gear.units').gray()])
  event.add(["tfc_items:aluminum_gear","gtceu:aluminum_gear","tfc_items:bronze_gear","railcraft:bronze_gear","gtceu:bronze_gear","tfc_items:copper_gear","railcraft:copper_gear","gtceu:copper_gear","tfc_items:gold_gear","railcraft:gold_gear","gtceu:gold_gear","railcraft:invar_gear","gtceu:invar_gear","railcraft:iron_gear","gtceu:iron_gear","tfc_items:stainless_steel_gear","gtceu:stainless_steel_gear","tfc_items:steel_gear","railcraft:steel_gear","gtceu:steel_gear","tfc_items:tin_gear","railcraft:tin_gear","gtceu:tin_gear","gtceu:titanium_gear"].filter(id => Item.exists(id)), [Text.translate('tooltip.createch2.material.heavy_gear.units').gray()])
})
// END GENERATED GEAR UNIT TOOLTIPS

// BEGIN GENERATED FRACTIONAL WIRE TOOLTIPS
ItemEvents.modifyTooltips(event => {
  event.add(["electroenergetics:iron_wire"], [Text.translate('tooltip.createch2.material.third_wire.units').gray(), Text.translate('tooltip.createch2.material.third_wire.conservation').gray()])
})
// END GENERATED FRACTIONAL WIRE TOOLTIPS
