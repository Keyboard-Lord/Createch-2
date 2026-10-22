// The established GT precision campus supplies native LuV controls and motion.
// Existing MI electronics, PGM refining and Greate stock remain the suppliers.
ServerEvents.recipes(event => {
  var id = name => `createch2:greate_precision/${name}`
  var clean = recipe => recipe.cleanroom(CleanroomType.CLEANROOM)
  clean(event.recipes.gtceu.laser_engraver(id('nor_memory_wafer'))
    .itemInputs('gtceu:silicon_wafer', 'ae2:printed_logic_processor')
    .itemOutputs('gtceu:nor_memory_wafer').duration(400).EUt(1024))
  clean(event.recipes.gtceu.laser_engraver(id('nor_memory_chip'))
    .itemInputs('gtceu:nor_memory_wafer')
    .itemOutputs('8x gtceu:nor_memory_chip').duration(300).EUt(1024))

  // Native advanced-SMD component counts, duration and voltage are retained.
  // The pack's existing solder alloy provides the fluid side of this handoff.
  clean(event.recipes.gtceu.circuit_assembler(id('quantum_processor_assembly'))
    .itemInputs('gtceu:fiber_reinforced_printed_circuit_board', '2x gtceu:quantum_processor',
      '2x gtceu:advanced_smd_inductor', '4x gtceu:advanced_smd_capacitor',
      '4x gtceu:ram_chip', '16x gtceu:fine_platinum_wire')
    .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
    .itemOutputs('2x gtceu:quantum_processor_assembly').duration(200).EUt(2400))
  clean(event.recipes.gtceu.circuit_assembler(id('quantum_processor_computer'))
    .itemInputs('gtceu:fiber_reinforced_printed_circuit_board', '2x gtceu:quantum_processor_assembly',
      '2x gtceu:advanced_smd_diode', '4x gtceu:nor_memory_chip',
      '16x gtceu:ram_chip', '32x gtceu:fine_platinum_wire')
    .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
    .itemOutputs('gtceu:quantum_processor_computer').duration(200).EUt(2400))

  // Keep the native quantum-mainframe logic bill and cleanroom conditions.
  // Existing computer casings and common copper wire supply its enclosure and
  // interconnects; do not add a separate HSS-G material/manufacturing ladder.
  clean(event.recipes.gtceu.circuit_assembler(id('quantum_processor_mainframe'))
    .itemInputs('2x gtceu:advanced_computer_casing', '2x gtceu:quantum_processor_computer',
      '6x gtceu:advanced_smd_inductor', '12x gtceu:advanced_smd_capacitor',
      '24x gtceu:ram_chip', '48x modern_industrialization:copper_wire')
    .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 576))
    .itemOutputs('gtceu:quantum_processor_mainframe').duration(400).EUt(7680))

  // Motion remains supplied by the existing shared MI-qualified component
  // route in gregtech_components.js; do not duplicate its motor progression.
  // Native 3:1 Ir/Os stock uses the earned LuV mixer and shared ordinary dusts.
  event.remove({ id: 'gtceu:mixer/osmiridium' })
  event.recipes.gtceu.mixer('createch2:greate_precision/osmiridium_stock')
    .itemInputs('#c:dusts/osmium', '3x #c:dusts/iridium')
    .itemOutputs('4x gtceu:osmiridium_dust')
    .circuit(1).duration(300).EUt(30720)
})
