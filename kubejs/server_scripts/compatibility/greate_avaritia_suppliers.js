// Generated from createch-dev/scripts/sources/avaritia_supplier_bridge.json. Original identity and full base osmium/energy bill are preserved.
ServerEvents.recipes(event => {
  ["avaritia:eternal_singularity", "avaritia:infinity_catalyst", "avaritia:infinity_catalyst_eternal"].forEach(id => event.remove({ id: id }))
  event.remove({ id: "mekanism:processing/refined_obsidian/ingot/from_dust" })
  event.custom({"type":"modern_industrialization:assembler","eu":4,"duration":200,"item_inputs":[{"item":"mekanism:dust_refined_obsidian","amount":1},{"tag":"c:ingots/osmium","amount":1}],"item_outputs":{"item":"mekanism:ingot_refined_obsidian","amount":1}}).id("mekanism:processing/refined_obsidian/ingot/from_dust")
})
