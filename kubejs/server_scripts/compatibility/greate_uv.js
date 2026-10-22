// Crystal controls extend the existing precision campus and shared suppliers.
ServerEvents.recipes(event => {
  var id = name => `createch2:greate_uv/${name}`
  var clean = recipe => recipe.cleanroom(CleanroomType.CLEANROOM)
  // Use the pack's established phosphorus-wafer / AE2 patterning process.
  // One NAND wafer yields the native 32 chips; no extra sensor is consumed.
  clean(event.recipes.gtceu.laser_engraver(id('nand_memory_wafer'))
    .itemInputs('gtceu:phosphorus_wafer', 'ae2:printed_logic_processor')
    .itemOutputs('gtceu:nand_memory_wafer').duration(900).EUt(2048))
  clean(event.recipes.gtceu.laser_engraver(id('nand_memory_chip'))
    .itemInputs('gtceu:nand_memory_wafer')
    .itemOutputs('32x gtceu:nand_memory_chip').duration(900).EUt(2048))

  // Retain native logic counts, yields, time, voltage and cleanroom. Existing
  // MI quantum boards replace Elite boards; common superconductor wire replaces
  // NbTi fine wire at the same metal-unit budget (four fine wires per MI wire).
  clean(event.recipes.gtceu.circuit_assembler(id('crystal_processor_assembly'))
    .itemInputs('modern_industrialization:quantum_circuit_board', '2x gtceu:crystal_processor',
      '4x gtceu:advanced_smd_inductor', '8x gtceu:advanced_smd_capacitor',
      '24x gtceu:ram_chip', '4x modern_industrialization:superconductor_wire')
    .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
    .itemOutputs('2x gtceu:crystal_processor_assembly').duration(400).EUt(9600))
  clean(event.recipes.gtceu.circuit_assembler(id('crystal_processor_computer'))
    .itemInputs('modern_industrialization:quantum_circuit_board', '2x gtceu:crystal_processor_assembly',
      '4x gtceu:ram_chip', '32x gtceu:nor_memory_chip', '64x gtceu:nand_memory_chip',
      '8x modern_industrialization:superconductor_wire')
    .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 288))
    .itemOutputs('gtceu:crystal_processor_computer').duration(400).EUt(9600))

  // The native mainframe topology uses two computers, 32 RAM, 8 inductors,
  // 16 capacitors and 8 diodes. Shared advanced casings replace HSSE frames;
  // eight advanced transistors implement the two power-die stages. This is an
  // authored circuit integration, not a claim of native HPIC equivalence.
  var mainframe = event.recipes.gtceu.assembly_line(id('crystal_processor_mainframe'))
    .itemInputs('2x gtceu:advanced_computer_casing', '2x gtceu:crystal_processor_computer',
      '32x gtceu:ram_chip', '8x gtceu:advanced_smd_transistor',
      '8x modern_industrialization:superconductor_wire', '8x gtceu:advanced_smd_inductor',
      '16x gtceu:advanced_smd_capacitor', '8x gtceu:advanced_smd_diode')
    .inputFluids(Fluid.of('modern_industrialization:soldering_alloy', 1440))
    .itemOutputs('gtceu:crystal_processor_mainframe').duration(800).EUt(30720)
  // Installed GT 8.1.0 requires initialization before its station adapter.
  var schema = Java.loadClass('com.gregtechceu.gtceu.integration.kjs.recipe.GTRecipeSchema')
  var ArrayList = Java.loadClass('java.util.ArrayList')
  mainframe.setValue(schema.CONDITIONS, new ArrayList())
  mainframe.stationResearch(builder => builder
    .researchStack(Item.of('gtceu:crystal_processor_computer')).CWUt(16).EUt(2048))

  // GT 8.1.0 records the condition above but omits its station recipe.
  // Reuse the installed native factory so the orb carries native research data.
  var StationResearchRecipes = Java.loadClass('createch2.core.compat.GtStationResearchRecipes')
  var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
  var stationId = 'createch2:research_station/greate_uv/research/gtceu/crystal_processor_computer'
  var stationRecipe = StationResearchRecipes.stationRecipe(
    Item.of('gtceu:crystal_processor_computer'), 16, ResourceLocation.parse(stationId)
  )
  if (stationRecipe) StationResearchRecipes.assignStationId(event.custom(stationRecipe), ResourceLocation.parse(stationId))
})
