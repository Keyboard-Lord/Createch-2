// Generated from createch-dev/scripts/sources/wetware_data_module.json. Native data-module identity and bank requirement are preserved.
ServerEvents.recipes(event => {
  event.remove({ id: "gtceu:assembler/high_power_casing" })
  event.custom({"type":"modern_industrialization:assembler","eu":1024,"duration":750,"item_inputs":[{"item":"gtceu:iridium_frame","amount":1},{"tag":"c:plates/iridium","amount":6},{"tag":"gtceu:circuits/iv","amount":1},{"item":"gtceu:fine_cobalt_wire","amount":16},{"item":"gtceu:fine_copper_wire","amount":16},{"item":"modern_industrialization:superconductor_wire","amount":2}],"item_outputs":{"item":"gtceu:high_power_casing","amount":2}}).id("gtceu:assembler/high_power_casing")
  event.remove({ id: "gtceu:circuit_assembler/data_module_soldering_alloy" })
  event.recipes.gtceu.circuit_assembler("gtceu:data_module_soldering_alloy")
    .itemInputs("gtceu:wetware_printed_circuit_board", "2x #gtceu:circuits/zpm", "32x gtceu:ram_chip", "64x gtceu:nor_memory_chip", "64x gtceu:nand_memory_chip", "8x modern_industrialization:superconductor_wire")
    .itemOutputs("gtceu:data_module")
    .inputFluids(Fluid.of("modern_industrialization:soldering_alloy", 144))
    .duration(400).EUt(38400).cleanroom(CleanroomType.STERILE_CLEANROOM)
})
