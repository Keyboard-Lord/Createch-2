// Existing multiblocks grow from the shared foundry, motion and chemical works.
// Native structure, operating recipes and controller component budgets stay intact.
import { staticRecipeWriter } from '../../lib/static_recipe_writer.mjs';
import { kineticItem } from './greate_progression.mjs';

export function processFacilities() {
  const writer = staticRecipeWriter();
  const { event, removeOutputRecipes } = writer;
  const assembler = (name, output, item_inputs) => event.custom({
    type: 'modern_industrialization:assembler', eu: 8, duration: 200,
    item_inputs, item_outputs: [{ item: output, amount: 1 }]
  }).id(`createch2:process_facilities/${name}`);
  removeOutputRecipes([
    'modern_industrialization:electric_blast_furnace',
    'modern_industrialization:distillation_tower',
    'modern_industrialization:advanced_fluid_input_hatch',
    'modern_industrialization:advanced_fluid_output_hatch',
    'modern_industrialization:large_tank', 'modern_industrialization:large_tank_hatch',
    'extended_industrialization:large_steam_furnace', 'extended_industrialization:large_electric_furnace'
  ]);

  // Electrification adds a controlled hot-process district. Retain all seven
  // native heating wires, the basic hull and the original furnace foundation.
  assembler('metallurgy/electric_blast_furnace', 'modern_industrialization:electric_blast_furnace', [
    { item: 'modern_industrialization:cupronickel_wire_magnetic', amount: 7 },
    { item: 'modern_industrialization:basic_machine_hull', amount: 1 },
    { item: 'minecraft:blast_furnace', amount: 1 },
    { item: kineticItem(1, 'encased_fan'), amount: 1 },
    { item: 'tfmg:fireproof_bricks', amount: 2 },
    { item: 'tfmg:steel_mechanism', amount: 1 }
  ]);

  // Layered separation consumes existing distilleries and their native pump
  // budget. Mechanical transfer, refinery outlets and chemical seals connect
  // the tower to earlier districts rather than replacing the fuel refinery.
  assembler('separation/distillation_tower', 'modern_industrialization:distillation_tower', [
    { item: 'modern_industrialization:advanced_pump', amount: 4 },
    { item: 'modern_industrialization:turbo_machine_hull', amount: 1 },
    { item: 'modern_industrialization:digital_circuit', amount: 2 },
    { item: 'modern_industrialization:distillery', amount: 2 },
    { item: kineticItem(3, 'mechanical_pump'), amount: 2 },
    { item: 'tfmg:steel_distillation_output', amount: 2 },
    { item: 'chemica:polytetrafluoroethylene_sheet', amount: 2 }
  ]);

  for (const direction of ['input', 'output']) {
    const output = `modern_industrialization:advanced_fluid_${direction}_hatch`;
    assembler(`transport/advanced_fluid_${direction}_hatch`, output, [
      { item: 'modern_industrialization:aluminum_tank', amount: 1 },
      { item: 'modern_industrialization:advanced_machine_hull', amount: 1 },
      { item: kineticItem(2, 'mechanical_pump'), amount: 1 },
      { item: 'modern_industrialization:rubber_sheet', amount: 2 }
    ]);
    // Preserve the native reversible one-to-one direction change. Existing
    // reservoirs can be repurposed without paying the assembly cost again.
    event.shapeless(output, [
      `modern_industrialization:advanced_fluid_${direction === 'input' ? 'output' : 'input'}_hatch`
    ]).id(`createch2:process_facilities/transport/advanced_fluid_${direction}_from_other`);
    event.shapeless(`modern_industrialization:advanced_item_${direction}_hatch`, [
      `modern_industrialization:advanced_item_${direction === 'input' ? 'output' : 'input'}_hatch`
    ]).id(`createch2:process_facilities/transport/advanced_item_${direction}_from_other`);
  }

  // Low-voltage tank yards keep the native steel reservoirs, pumps, casing
  // and rotors. The same earlier mechanical workshop supplies their transfer
  // and seals; no aluminum or digital equipment is needed to store refinery cuts.
  assembler('transport/large_tank', 'modern_industrialization:large_tank', [
    { item: 'modern_industrialization:steel_tank', amount: 4 },
    { item: 'modern_industrialization:pump', amount: 2 },
    { item: 'modern_industrialization:steel_machine_casing', amount: 1 },
    { item: 'modern_industrialization:tin_rotor', amount: 2 },
    { item: kineticItem(1, 'mechanical_pump'), amount: 1 },
    { item: 'modern_industrialization:rubber_sheet', amount: 2 }
  ]);
  assembler('transport/large_tank_hatch', 'modern_industrialization:large_tank_hatch', [
    { item: 'modern_industrialization:steel_tank', amount: 1 },
    { item: 'modern_industrialization:pump', amount: 1 },
    { item: 'modern_industrialization:steel_machine_casing', amount: 1 },
    { item: kineticItem(1, 'mechanical_pump'), amount: 1 },
    { item: 'modern_industrialization:rubber_sheet', amount: 2 }
  ]);

  // Bulk ordinary heating is separate from EBF alloy metallurgy. Retain
  // the native nine-piece steam controller, then visibly assemble its steel
  // ventilation and extra refractory in the existing mechanical-crafter line.
  event.custom({ type: 'create:mechanical_crafting', pattern: ['XCBCX', 'GFMF ', ' RRR '],
    key: {
      B: { item: 'modern_industrialization:bronze_plated_bricks' },
      C: { item: 'modern_industrialization:bronze_curved_plate' },
      F: { item: 'modern_industrialization:bronze_furnace' },
      M: { item: 'modern_industrialization:bronze_machine_casing' },
      R: { item: 'modern_industrialization:fire_clay_bricks' },
      G: { item: kineticItem(1, 'encased_fan') }, X: { item: 'tfmg:fireproof_bricks' }
    }, result: { id: 'extended_industrialization:large_steam_furnace', count: 1 },
    accept_mirrored: false
  }).id('createch2:process_facilities/thermal/large_steam_furnace');
  assembler('thermal/large_electric_furnace', 'extended_industrialization:large_electric_furnace', [
    { item: 'modern_industrialization:cupronickel_wire_magnetic', amount: 2 },
    { item: 'modern_industrialization:electronic_circuit', amount: 2 },
    { item: 'modern_industrialization:electric_furnace', amount: 2 },
    { item: 'modern_industrialization:advanced_machine_hull', amount: 1 },
    { item: 'modern_industrialization:heatproof_machine_casing', amount: 2 },
    { item: kineticItem(2, 'encased_fan'), amount: 1 },
    { item: 'tfmg:fireproof_bricks', amount: 2 }
  ]);
  return { recipes: writer.recipes, removals: writer.removals,
    families: [{ name: 'Shared metallurgy, separation and fluid facilities', recipes: writer.calls.length }] };
}
