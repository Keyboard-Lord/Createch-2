// Canonical build-time factory-scaling recipes. No runtime registry decisions.
// Preserves mature batch routes, infrastructure proofs and native machine limits.
import assert from 'node:assert/strict';
import componentPolicy from '../component_recycling.json' with {type:'json'};
import {componentBatchProduction} from '../../lib/component_batch_production.mjs';
import { canonicalizeKineticRecipes, kineticItem } from './greate_progression.mjs';

export const runtimeRetained = [];

export function factoryScaling() {
  const recipes = {}, removedOutputs = [];
  const add = (name, recipe) => {
    const id = 'createch2:factory_scaling/' + name;
    assert(!Object.hasOwn(recipes, id), 'Duplicate factory recipe: ' + id);
    recipes[id] = recipe;
  };
  const miRecipe = (machine, name, recipe) => add(name, {
    type: 'modern_industrialization:' + machine, ...recipe
  });
  const removeOutputs = outputs => removedOutputs.push(...outputs);

  // Native batch machines are made from the ordinary machines they scale.
  // They improve throughput without skipping the underlying machine ladder.
  removeOutputs(['extended_industrialization:large_steam_macerator'])
  add('mass_processing/large_steam_macerator', {
    type: 'minecraft:crafting_shaped',
    pattern: ['MCM', 'TPT', 'MCM'],
    key: {
      M: { item: 'modern_industrialization:bronze_macerator' },
      C: { item: 'modern_industrialization:bronze_machine_casing' },
      T: { item: 'modern_industrialization:bronze_tank' },
      P: { tag: 'createch2:control/mechanical' }
    },
    result: { id: 'extended_industrialization:large_steam_macerator', count: 1 }
  })

  removeOutputs([
    'modern_industrialization:advanced_item_input_hatch',
    'modern_industrialization:advanced_item_output_hatch'
  ])

  miRecipe('assembler', 'logistics/advanced_item_input_hatch', {
    eu: 64,
    duration: 600,
    item_inputs: [
      { item: 'modern_industrialization:advanced_machine_hull', amount: 1 },
      { item: 'modern_industrialization:item_pipe', amount: 8 },
      { item: 'modern_industrialization:advanced_motor', amount: 2 },
      { item: 'electroenergetics:white_electric_motor', amount: 2 },
      { item: 'modern_industrialization:electronic_circuit', amount: 2 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 2 },
      { item: kineticItem(2, 'gearbox'), amount: 1 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:polyethylene', amount: 1000 },
      { fluid: 'modern_industrialization:lubricant', amount: 250 }
    ],
    item_outputs: [
      { item: 'modern_industrialization:advanced_item_input_hatch', amount: 1 }
    ]
  })

  miRecipe('assembler', 'logistics/advanced_item_output_hatch', {
    eu: 64,
    duration: 600,
    item_inputs: [
      { item: 'modern_industrialization:advanced_machine_hull', amount: 1 },
      { item: 'modern_industrialization:item_pipe', amount: 8 },
      { item: 'modern_industrialization:advanced_motor', amount: 2 },
      { item: 'electroenergetics:white_electric_motor', amount: 2 },
      { item: 'modern_industrialization:electronic_circuit', amount: 2 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 2 },
      { item: kineticItem(2, 'gearbox'), amount: 1 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 1000 },
      { fluid: 'modern_industrialization:lubricant', amount: 250 }
    ],
    item_outputs: [
      { item: 'modern_industrialization:advanced_item_output_hatch', amount: 1 }
    ]
  })

  removeOutputs(['extended_industrialization:large_electric_macerator'])
  miRecipe('assembler', 'mass_processing/large_electric_macerator', {
    eu: 128,
    duration: 1600,
    item_inputs: [
      { item: 'modern_industrialization:electric_macerator', amount: 4 },
      { item: 'modern_industrialization:advanced_machine_casing', amount: 2 },
      { item: 'modern_industrialization:advanced_motor', amount: 2 },
      { item: 'modern_industrialization:advanced_pump', amount: 2 },
      { item: 'modern_industrialization:processing_unit', amount: 2 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 4 },
      { item: 'tfmg:steel_mechanism', amount: 4 },
      { item: kineticItem(2, 'crushing_wheel'), amount: 2 },
      { item: kineticItem(2, 'gearbox'), amount: 1 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:polyethylene', amount: 1000 },
      { fluid: 'modern_industrialization:lubricant', amount: 500 }
    ],
    item_outputs: [
      { item: 'extended_industrialization:large_electric_macerator', amount: 1 }
    ]
  })

  // Existing components gain mature routes. The first route remains necessary
  // to build the machines that unlock these higher-throughput alternatives.
  miRecipe('assembler', 'components/precision_mechanism_batch', {
    eu: 32,
    duration: 500,
    item_inputs: [
      { item: 'create:brass_sheet', amount: 4 },
      { item: 'create:cogwheel', amount: 4 },
      { item: 'create:shaft', amount: 2 },
      { item: 'modern_industrialization:electronic_circuit', amount: 1 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 250
    },
    item_outputs: [
      { item: 'create:precision_mechanism', amount: 4 }
    ]
  })

  miRecipe('assembler', 'components/steel_mechanism_batch', {
    eu: 64,
    duration: 700,
    item_inputs: [
      { item: 'tfmg:steel_mechanism', amount: 1, probability: 0 },
      { item: 'tfmg:heavy_plate', amount: 8 },
      { item: 'tfmg:steel_casing', amount: 4 },
      { item: 'create:precision_mechanism', amount: 4 },
      { item: 'modern_industrialization:motor', amount: 2 },
      { item: 'modern_industrialization:analog_circuit', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 500
    },
    item_outputs: [
      { item: 'tfmg:steel_mechanism', amount: 4 }
    ]
  })

  miRecipe('assembler', 'machines/electric_macerator_batch', {
    eu: 32,
    duration: 700,
    item_inputs: [
      { item: 'modern_industrialization:bronze_macerator', amount: 2 },
      { item: 'modern_industrialization:basic_machine_hull', amount: 2 },
      { item: 'modern_industrialization:motor', amount: 4 },
      { item: 'tfmg:steel_mechanism', amount: 4 },
      { item: 'modern_industrialization:analog_circuit', amount: 2 },
      { item: 'electroenergetics:insulated_wire', amount: 4 }
    ],
    fluid_inputs: { fluid: 'modern_industrialization:lubricant', amount: 500 },
    item_outputs: [{ item: 'modern_industrialization:electric_macerator', amount: 2 }]
  })

  miRecipe('assembler', 'machines/electric_compressor_batch', {
    eu: 32,
    duration: 700,
    item_inputs: [
      { item: 'modern_industrialization:bronze_compressor', amount: 2 },
      { item: 'modern_industrialization:basic_machine_hull', amount: 2 },
      { item: 'modern_industrialization:motor', amount: 4 },
      { item: 'tfmg:steel_mechanism', amount: 4 },
      { item: 'modern_industrialization:analog_circuit', amount: 2 },
      { item: 'electroenergetics:insulated_wire', amount: 4 }
    ],
    fluid_inputs: { fluid: 'modern_industrialization:lubricant', amount: 500 },
    item_outputs: [{ item: 'modern_industrialization:electric_compressor', amount: 2 }]
  })

  miRecipe('assembler', 'controls/analog_circuit_batch', {
    eu: 16,
    duration: 500,
    item_inputs: [
      { item: 'modern_industrialization:analog_circuit', amount: 1, probability: 0 },
      { item: 'modern_industrialization:resistor', amount: 8 },
      { item: 'tfmg:transistor_item', amount: 4 },
      { item: 'tfmg:capacitor_item', amount: 4 },
      { item: 'tfmg:copper_spool', amount: 8 },
      { item: 'modern_industrialization:electronic_circuit_board', amount: 2 },
      { tag: 'c:dusts/redstone', amount: 8 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:soldering_alloy',
      amount: 1000
    },
    item_outputs: [
      { item: 'modern_industrialization:analog_circuit', amount: 8 }
    ]
  })

  miRecipe('assembler', 'controls/electronic_circuit_batch', {
    eu: 32,
    duration: 700,
    item_inputs: [
      { item: 'modern_industrialization:electronic_circuit', amount: 1, probability: 0 },
      { item: 'modern_industrialization:analog_circuit', amount: 4 },
      { item: 'tfmg:transistor_item', amount: 8 },
      { item: 'tfmg:capacitor_item', amount: 8 },
      { item: 'modern_industrialization:electronic_circuit_board', amount: 2 },
      { item: 'tfc:gem/sapphire', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:soldering_alloy',
      amount: 2000
    },
    item_outputs: [
      { item: 'modern_industrialization:electronic_circuit', amount: 4 }
    ]
  })

  miRecipe('assembler', 'controls/digital_circuit_batch', {
    eu: 64,
    duration: 900,
    item_inputs: [
      { item: 'modern_industrialization:digital_circuit', amount: 1, probability: 0 },
      { item: 'modern_industrialization:electronic_circuit', amount: 4 },
      { item: 'modern_industrialization:digital_circuit_board', amount: 2 },
      { item: 'modern_industrialization:random_access_memory', amount: 4 },
      { item: 'modern_industrialization:memory_management_unit', amount: 2 },
      { item: 'modern_industrialization:arithmetic_logic_unit', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:soldering_alloy',
      amount: 3000
    },
    item_outputs: [
      { item: 'modern_industrialization:digital_circuit', amount: 4 }
    ]
  })

  miRecipe('assembler', 'controls/processing_unit_batch', {
    eu: 128,
    duration: 1200,
    item_inputs: [
      { item: 'modern_industrialization:processing_unit', amount: 1, probability: 0 },
      { item: 'modern_industrialization:digital_circuit', amount: 4 },
      { item: 'modern_industrialization:processing_unit_board', amount: 2 },
      { item: 'modern_industrialization:random_access_memory', amount: 8 },
      { item: 'modern_industrialization:memory_management_unit', amount: 4 },
      { item: 'modern_industrialization:arithmetic_logic_unit', amount: 4 },
      { item: 'modern_industrialization:silicon_wafer', amount: 16 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:soldering_alloy',
      amount: 4000
    },
    item_outputs: [
      { item: 'modern_industrialization:processing_unit', amount: 2 }
    ]
  })

  miRecipe('assembler', 'components/advanced_motor_batch', {
    eu: 64,
    duration: 650,
    item_inputs: [
      { item: 'modern_industrialization:advanced_motor', amount: 1, probability: 0 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 4 },
      { item: 'modern_industrialization:annealed_copper_wire', amount: 4 },
      { item: 'modern_industrialization:electrum_wire', amount: 4 },
      { item: 'tfmg:magnetic_alloy_sheet', amount: 2 },
      { tag: 'c:rods/aluminum', amount: 4 },
      { item: 'modern_industrialization:electronic_circuit', amount: 1 },
      { item: 'modern_industrialization:motor', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 500
    },
    item_outputs: [
      { item: 'modern_industrialization:advanced_motor', amount: 2 }
    ]
  })

  miRecipe('assembler', 'components/advanced_pump_batch', {
    eu: 64,
    duration: 800,
    item_inputs: [
      { item: 'modern_industrialization:advanced_pump', amount: 1, probability: 0 },
      { tag: 'modern_industrialization:fluid_pipes', amount: 8 },
      { item: 'modern_industrialization:aluminum_rotor', amount: 4 },
      { item: 'modern_industrialization:advanced_motor', amount: 2 },
      { item: 'modern_industrialization:aluminum_bolt', amount: 8 },
      { item: 'modern_industrialization:electronic_circuit', amount: 2 },
      { item: 'modern_industrialization:pump', amount: 2 },
      { item: 'stellaris:tharsite_ingot', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 1000
    },
    item_outputs: [
      { item: 'modern_industrialization:advanced_pump', amount: 2 }
    ]
  })

  // High Pressure batch chlorination stays inside the Chemical Reactor's
  // verified three-item layout. A retained purified-PGM charge proves the
  // original titanium and concentrate lines before the 8-to-10 run is used.
  miRecipe('chemical_reactor', 'materials/titanium_chloride_batch', {
    eu: 128,
    duration: 1800,
    item_inputs: [
      { tag: 'c:raw_materials/titanium', amount: 8 },
      { tag: 'c:dusts/carbon', amount: 8 },
      { tag: 'c:dusts/sodium', amount: 4 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:hydrochloric_acid', amount: 8000 },
      { fluid: 'modern_industrialization:chlorine', amount: 4000 },
      { fluid: 'modern_industrialization:purified_platinum_sulfuric_solution', amount: 250 }
    ],
    item_outputs: [
      { item: 'modern_industrialization:titanium_dust', amount: 10 }
    ],
    fluid_outputs: [
      { fluid: 'modern_industrialization:sulfuric_acid', amount: 2000 },
      { fluid: 'modern_industrialization:purified_platinum_sulfuric_solution', amount: 250 }
    ]
  })

  miRecipe('blast_furnace', 'materials/titanium_hot_ingot_batch', {
    eu: 128,
    duration: 2700,
    item_inputs: [
      { item: 'modern_industrialization:titanium_dust', amount: 8 },
      { tag: 'c:dusts/carbon', amount: 8 },
      { item: 'modern_industrialization:titanium_plate', amount: 1, probability: 0 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:manganese_sulfuric_solution',
      amount: 4000
    },
    item_outputs: [
      { item: 'modern_industrialization:titanium_hot_ingot', amount: 8 }
    ],
    fluid_outputs: {
      fluid: 'modern_industrialization:manganese_sulfuric_solution',
      amount: 3500
    }
  })

  // Quantum retrofit: the Age 11 one-at-a-time freezer remains the complete
  // High Pressure route. Cryofluid upgrades only the eight-ingot finish.
  miRecipe('vacuum_freezer', 'materials/titanium_ingot_batch', {
    eu: 128,
    duration: 1200,
    item_inputs: [
      { item: 'modern_industrialization:titanium_hot_ingot', amount: 8 },
      { item: 'modern_industrialization:titanium_plate', amount: 1, probability: 0 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:cryofluid',
      amount: 500
    },
    item_outputs: [
      { item: 'modern_industrialization:titanium_ingot', amount: 8 }
    ]
  })

  miRecipe('chemical_reactor', 'pgm/mixed_concentrate_batch', {
    eu: 128,
    duration: 2200,
    item_inputs: [
      { item: 'modern_industrialization:monazite_crushed_dust', amount: 4 },
      { item: 'stellaris:corronium_ingot', amount: 4 },
      { item: 'stellaris:solerium', amount: 4 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:sulfuric_acid', amount: 16000 },
      { fluid: 'modern_industrialization:purified_platinum_sulfuric_solution', amount: 250 }
    ],
    item_outputs: [
      { item: 'modern_industrialization:raw_platinum', amount: 5 },
      { item: 'modern_industrialization:platinum_tiny_dust', amount: 10 }
    ],
    fluid_outputs: [
      { fluid: 'modern_industrialization:platinum_sulfuric_solution', amount: 5000 },
      { fluid: 'modern_industrialization:purified_platinum_sulfuric_solution', amount: 250 }
    ]
  })

  // The existing mixed iridium ingot is the mature PGM feed body. Preparing
  // it in the Assembler lets the Centrifuge keep its verified one-item input
  // while retaining all four separated PGM outputs.
  miRecipe('assembler', 'pgm/industrial_feed_batch', {
    eu: 192,
    duration: 1200,
    item_inputs: [
      { item: 'modern_industrialization:raw_platinum', amount: 8 },
      { item: 'modern_industrialization:platinum_tiny_dust', amount: 16 },
      { tag: 'c:dusts/sodium', amount: 4 },
      { item: 'modern_industrialization:platinum_plate', amount: 1, probability: 0 },
      { item: 'modern_industrialization:processing_unit', amount: 1, probability: 0 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:hydrochloric_acid', amount: 8000 },
      { fluid: 'modern_industrialization:chlorine', amount: 4000 }
    ],
    item_outputs: [
      { item: 'modern_industrialization:mixed_ingot_iridium', amount: 4 }
    ]
  })

  miRecipe('centrifuge', 'pgm/industrial_separation_batch', {
    eu: 192,
    duration: 2400,
    item_inputs: [
      { item: 'modern_industrialization:mixed_ingot_iridium', amount: 4 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:purified_platinum_sulfuric_solution',
      amount: 1000
    },
    item_outputs: [
      { item: 'modern_industrialization:platinum_dust', amount: 4 },
      { item: 'chemlib:palladium_dust', amount: 4 },
      { item: 'chemlib:osmium_dust', amount: 4 },
      { item: 'modern_industrialization:iridium_tiny_dust', amount: 12 }
    ],
    fluid_outputs: {
      fluid: 'modern_industrialization:sulfuric_acid',
      amount: 3000
    }
  })

  miRecipe('chemical_reactor', 'chemistry/heavy_oil_lubricant_recovery', {
    eu: 128,
    duration: 900,
    item_inputs: [
      { tag: 'createch2:chemical_filter_media', amount: 1, probability: 0.8 },
      { tag: 'createch2:control/factory/digital', amount: 1, probability: 0 }
    ],
    fluid_inputs: {
      fluid: 'tfmg:heavy_oil',
      amount: 1000
    },
    fluid_outputs: [
      { fluid: 'modern_industrialization:lubricant', amount: 250 },
      { fluid: 'modern_industrialization:naphtha', amount: 250 }
    ]
  })

  // AE2 still owns printing and processor identity. MI only batches already
  // printed components after the player has built a real inscriber line.
  ;[
    ['logic', 'ae2:printed_logic_processor', 'ae2:logic_processor'],
    ['calculation', 'ae2:printed_calculation_processor', 'ae2:calculation_processor'],
    ['engineering', 'ae2:printed_engineering_processor', 'ae2:engineering_processor']
  ].forEach(([name, printed, output]) => {
    miRecipe('assembler', `ae2/${name}_processor_batch`, {
      eu: 128,
      duration: 800,
      item_inputs: [
        { item: printed, amount: 4 },
        { item: 'ae2:printed_silicon', amount: 4 },
        { tag: 'c:dusts/redstone', amount: 8 },
        { item: 'modern_industrialization:digital_circuit', amount: 1, probability: 0 }
      ],
      fluid_inputs: {
        fluid: 'modern_industrialization:soldering_alloy',
        amount: 2000
      },
      item_outputs: [
        { item: output, amount: 4 }
      ]
    })
  })

  // The highly advanced hull is the late Age 10 physical bridge from
  // ordinary stainless/digital infrastructure into factory-scale control.
  // It requires processing control and protected power, but no Age 11 material.
  removeOutputs(['modern_industrialization:highly_advanced_machine_hull'])
  miRecipe('assembler', 'components/highly_advanced_machine_hull', {
    eu: 128,
    duration: 1400,
    item_inputs: [
      { item: 'modern_industrialization:advanced_machine_hull', amount: 1 },
      { item: 'modern_industrialization:stainless_steel_large_plate', amount: 8 },
      { item: 'modern_industrialization:stainless_steel_plate', amount: 16 },
      { tag: 'createch2:control/factory/processing', amount: 2 },
      { item: 'modern_industrialization:advanced_motor', amount: 2 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 4 },
      { item: 'electroenergetics:transformer_core', amount: 2 },
      { item: 'electroenergetics:sulfur_hexafluoride_breaker', amount: 1 },
      { item: kineticItem(3, 'gearbox'), amount: 2 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 1000 },
      { fluid: 'modern_industrialization:lubricant', amount: 500 }
    ],
    item_outputs: [
      { item: 'modern_industrialization:highly_advanced_machine_hull', amount: 1 }
    ]
  })

  // Processing Arrays scale known machines; Machine Chainers coordinate
  // ordinary factory cells. Both require controls, IO, switchgear and polymers.
  removeOutputs([
    'extended_industrialization:processing_array',
    'extended_industrialization:machine_chainer',
    'extended_industrialization:machine_chainer_relay'
  ])

  miRecipe('assembler', 'mass_processing/processing_array', {
    eu: 128,
    duration: 2200,
    item_inputs: [
      { item: 'modern_industrialization:advanced_item_input_hatch', amount: 2 },
      { item: 'modern_industrialization:advanced_item_output_hatch', amount: 2 },
      { item: 'modern_industrialization:highly_advanced_machine_hull', amount: 1 },
      { item: 'modern_industrialization:configurable_tank', amount: 4 },
      { item: 'modern_industrialization:advanced_motor', amount: 4 },
      { item: 'modern_industrialization:advanced_pump', amount: 4 },
      { tag: 'createch2:control/factory/processing', amount: 4 },
      { item: 'electroenergetics:sulfur_hexafluoride_breaker', amount: 2 },
      { tag: 'createch2:factory/fluid_hatches', amount: 2 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:polyethylene', amount: 2000 },
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 2000 }
    ],
    item_outputs: [
      { item: 'extended_industrialization:processing_array', amount: 1 }
    ]
  })

  miRecipe('assembler', 'factory_control/machine_chainer', {
    eu: 128,
    duration: 1800,
    item_inputs: [
      { item: 'modern_industrialization:highly_advanced_machine_hull', amount: 2 },
      { item: 'computercraft:computer_advanced', amount: 2 },
      { item: 'computercraft:cable', amount: 64 },
      { item: 'modern_industrialization:advanced_motor', amount: 4 },
      { item: 'electroenergetics:transformer_core', amount: 2 },
      { tag: 'createch2:control/factory/processing', amount: 4 },
      { item: 'electroenergetics:current_transformer', amount: 4 },
      { item: 'electroenergetics:sulfur_hexafluoride_breaker', amount: 2 },
      { item: kineticItem(3, 'gearbox'), amount: 2 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:polyethylene', amount: 2000 },
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 2000 }
    ],
    item_outputs: [
      { item: 'extended_industrialization:machine_chainer', amount: 1 }
    ]
  })

  miRecipe('assembler', 'factory_control/machine_chainer_relay', {
    eu: 64,
    duration: 600,
    item_inputs: [
      { item: 'modern_industrialization:advanced_machine_hull', amount: 1 },
      { item: 'computercraft:cable', amount: 16 },
      { item: 'modern_industrialization:digital_circuit', amount: 4 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 4 },
      { item: 'electroenergetics:current_transformer', amount: 2 },
      { item: 'electroenergetics:white_electric_motor', amount: 2 },
      { item: 'extended_industrialization:machine_chainer', amount: 1, probability: 0 },
      { item: kineticItem(2, 'gearbox'), amount: 1 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:polyvinyl_chloride',
      amount: 1000
    },
    item_outputs: [
      { item: 'extended_industrialization:machine_chainer_relay', amount: 4 }
    ]
  })

  // Mature aerospace production standardizes parts only after titanium, PGM,
  // digital control and Rocketnautics hardware are already established.
  miRecipe('assembler', 'aerospace/rocket_thruster_batch', {
    eu: 192,
    duration: 1600,
    item_inputs: [
      { item: 'rocketnautics:titanium_nozzle', amount: 4 },
      { item: 'modern_industrialization:advanced_pump', amount: 4 },
      { item: 'modern_industrialization:advanced_motor', amount: 4 },
      { item: 'modern_industrialization:digital_circuit', amount: 4 },
      { item: 'mekanism:elite_control_circuit', amount: 2 },
      { item: 'modern_industrialization:titanium_large_plate', amount: 8 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 8 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:lubricant', amount: 1000 },
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 1000 }
    ],
    item_outputs: [
      { item: 'rocketnautics:rocket_thruster', amount: 4 }
    ]
  })

  miRecipe('assembler', 'aerospace/booster_thruster_batch', {
    eu: 256,
    duration: 1800,
    item_inputs: [
      { item: 'rocketnautics:rocket_thruster', amount: 4 },
      { item: 'rocketnautics:magnetic_stabilizer', amount: 2 },
      { item: 'modern_industrialization:titanium_large_plate', amount: 12 },
      { item: 'modern_industrialization:processing_unit', amount: 4 },
      { item: 'mekanism:elite_control_circuit', amount: 4 },
      { item: 'modern_industrialization:iridium_plate', amount: 4 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 2000
    },
    item_outputs: [
      { item: 'rocketnautics:booster_thruster', amount: 2 }
    ]
  })

  miRecipe('assembler', 'aerospace/stellaris_rocket_engine_mature', {
    eu: 256,
    duration: 2000,
    item_inputs: [
      { item: 'rocketnautics:rocket_thruster', amount: 2 },
      { item: 'rocketnautics:titanium_nozzle', amount: 2 },
      { item: 'modern_industrialization:advanced_motor', amount: 4 },
      { item: 'modern_industrialization:advanced_pump', amount: 4 },
      { item: 'tfmg:steel_mechanism', amount: 8 },
      { item: 'modern_industrialization:processing_unit', amount: 4 },
      { item: 'modern_industrialization:titanium_plate', amount: 8 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 8 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:lubricant', amount: 2000 },
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 2000 }
    ],
    item_outputs: [
      { item: 'stellaris:rocket_engine', amount: 2 }
    ]
  })

  miRecipe('assembler', 'aerospace/titanium_nozzle_batch', {
    eu: 192,
    duration: 1200,
    item_inputs: [
      { item: 'rocketnautics:titanium_nozzle', amount: 1, probability: 0 },
      { item: 'rocketnautics:titanium_alloy_sheet', amount: 8 },
      { item: 'modern_industrialization:titanium_plate', amount: 4 },
      { item: 'rocketnautics:titanium_alloy', amount: 8 },
      { tag: 'c:plates/obsidian', amount: 4 },
      { item: 'modern_industrialization:platinum_plate', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 500
    },
    item_outputs: [
      { item: 'rocketnautics:titanium_nozzle', amount: 4 }
    ]
  })

  miRecipe('assembler', 'aerospace/rcs_thruster_batch', {
    eu: 192,
    duration: 1200,
    item_inputs: [
      { item: 'rocketnautics:rcs_thruster', amount: 1, probability: 0 },
      { item: 'modern_industrialization:titanium_plate', amount: 8 },
      { item: 'stellaris:corronium_ingot', amount: 4 },
      { item: 'modern_industrialization:digital_circuit', amount: 4 },
      { tag: 'c:dusts/redstone', amount: 8 },
      { item: 'modern_industrialization:iridium_tiny_dust', amount: 4 },
      { item: 'modern_industrialization:advanced_motor', amount: 2 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:lubricant', amount: 500 },
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 500 }
    ],
    item_outputs: [
      { item: 'rocketnautics:rcs_thruster', amount: 8 }
    ]
  })

  miRecipe('assembler', 'aerospace/magnetic_stabilizer_batch', {
    eu: 256,
    duration: 1600,
    item_inputs: [
      { item: 'rocketnautics:magnetic_stabilizer', amount: 1, probability: 0 },
      { item: 'rocketnautics:titanium_casing', amount: 4 },
      { item: 'electroenergetics:hanging_glass_insulator', amount: 8 },
      { tag: 'c:storage_blocks/redstone', amount: 8 },
      { tag: 'c:storage_blocks/iron', amount: 4 },
      { item: 'modern_industrialization:digital_circuit', amount: 4 },
      { tag: 'createch2:iridium_sensors', amount: 8 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 1000 },
      { fluid: 'modern_industrialization:lubricant', amount: 500 }
    ],
    item_outputs: [
      { item: 'rocketnautics:magnetic_stabilizer', amount: 4 }
    ]
  })

  miRecipe('assembler', 'aerospace/vector_thruster_batch', {
    eu: 256,
    duration: 1800,
    item_inputs: [
      { item: 'rocketnautics:vector_thruster', amount: 1, probability: 0 },
      { item: 'rocketnautics:rocket_thruster', amount: 4 },
      { item: 'rocketnautics:rcs_thruster', amount: 4 },
      { item: 'modern_industrialization:advanced_motor', amount: 4 },
      { item: 'mekanism:elite_control_circuit', amount: 4 },
      { tag: 'createch2:iridium_sensors', amount: 4 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:lubricant', amount: 1000 },
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 1000 }
    ],
    item_outputs: [
      { item: 'rocketnautics:vector_thruster', amount: 4 }
    ]
  })

  miRecipe('assembler', 'aerospace/big_fuel_tank_upgrade_batch', {
    eu: 256,
    duration: 1800,
    item_inputs: [
      { item: 'stellaris:big_fuel_tank_upgrade', amount: 1, probability: 0 },
      { item: 'stellaris:t4_tank', amount: 2 },
      { item: 'modern_industrialization:titanium_plate', amount: 8 },
      { item: 'stellaris:corronium_ingot', amount: 6 },
      { item: 'stellaris:solerium', amount: 2 },
      { item: 'modern_industrialization:advanced_pump', amount: 2 },
      { item: 'modern_industrialization:processing_unit', amount: 2 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:polyvinyl_chloride', amount: 1000 },
      { fluid: 'modern_industrialization:lubricant', amount: 1000 }
    ],
    item_outputs: [
      { item: 'stellaris:big_fuel_tank_upgrade', amount: 2 }
    ]
  })

  // Nuclear components become production lines rather than single crafts.
  miRecipe('assembler', 'nuclear/uranium_fuel_rod_batch', {
    eu: 128,
    duration: 1200,
    item_inputs: [
      { item: 'modern_industrialization:uranium_235_ingot', amount: 4 },
      { item: 'chemlib:zirconium_plate', amount: 12 },
      { item: 'chemlib:boron_dust', amount: 4 },
      { item: 'modern_industrialization:digital_circuit', amount: 1, probability: 0 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 500
    },
    item_outputs: [
      { item: 'modern_industrialization:uranium_fuel_rod', amount: 4 }
    ]
  })

  miRecipe('assembler', 'nuclear/fission_fuel_assembly_batch', {
    eu: 192,
    duration: 1600,
    item_inputs: [
      { item: 'modern_industrialization:uranium_fuel_rod', amount: 4 },
      { item: 'chemlib:zirconium_plate', amount: 8 },
      { item: 'modern_industrialization:platinum_plate', amount: 4 },
      { item: 'mekanism:uranium_hexafluoride_bucket', amount: 2 },
      { item: 'mekanism:dosimeter', amount: 2 },
      { item: 'modern_industrialization:advanced_pump', amount: 2 },
      { item: 'modern_industrialization:processing_unit', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:polyvinyl_chloride',
      amount: 1000
    },
    item_outputs: [
      { item: 'mekanismgenerators:fission_fuel_assembly', amount: 2 }
    ]
  })

  miRecipe('assembler', 'nuclear/turbine_blade_batch', {
    eu: 192,
    duration: 1000,
    item_inputs: [
      { item: 'modern_industrialization:nuclear_alloy_plate', amount: 8 },
      { item: 'modern_industrialization:platinum_plate', amount: 4 },
      { item: 'modern_industrialization:iridium_plate', amount: 2 },
      { item: 'modern_industrialization:advanced_motor', amount: 1 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 500
    },
    item_outputs: [
      { item: 'mekanismgenerators:turbine_blade', amount: 4 }
    ]
  })

  miRecipe('assembler', 'nuclear/empty_heat_sink_batch', {
    eu: 128,
    duration: 800,
    item_inputs: [
      { item: 'crowns:heat_exchanger', amount: 1, probability: 0 },
      { item: 'modern_industrialization:nuclear_alloy_plate', amount: 4 },
      { tag: 'c:ingots/lead', amount: 8 },
      { item: 'modern_industrialization:advanced_pump', amount: 1 }
    ],
    fluid_inputs: {
      fluid: 'minecraft:water',
      amount: 1000
    },
    item_outputs: [
      { item: 'crowns:heat_exchanger', amount: 8 }
    ]
  })

  miRecipe('assembler', 'nuclear/nuclear_alloy_plate_batch', {
    eu: 192,
    duration: 1600,
    item_inputs: [
      { item: 'modern_industrialization:nuclear_alloy_plate', amount: 1, probability: 0 },
      { item: 'modern_industrialization:mixed_plate_nuclear', amount: 8 },
      { item: 'chemlib:zirconium_plate', amount: 24 },
      { item: 'modern_industrialization:iridium_plate', amount: 12 },
      { item: 'modern_industrialization:platinum_plate', amount: 12 },
      { item: 'chemlib:boron_dust', amount: 4 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 1000
    },
    item_outputs: [
      { item: 'modern_industrialization:nuclear_alloy_plate', amount: 8 }
    ]
  })

  miRecipe('assembler', 'nuclear/turbine_rotor_batch', {
    eu: 192,
    duration: 1000,
    item_inputs: [
      { item: 'mekanismgenerators:turbine_rotor', amount: 1, probability: 0 },
      { item: 'mekanismgenerators:turbine_blade', amount: 8 },
      { item: 'modern_industrialization:iridium_plate', amount: 2 },
      { item: 'modern_industrialization:advanced_motor', amount: 1 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:lubricant',
      amount: 500
    },
    item_outputs: [
      { item: 'mekanismgenerators:turbine_rotor', amount: 2 }
    ]
  })

  miRecipe('assembler', 'nuclear/electromagnetic_coil_batch', {
    eu: 192,
    duration: 1200,
    item_inputs: [
      { item: 'mekanismgenerators:electromagnetic_coil', amount: 1, probability: 0 },
      { item: 'modern_industrialization:stainless_steel_rod_magnetic', amount: 16 },
      { item: 'modern_industrialization:platinum_plate', amount: 8 },
      { item: 'modern_industrialization:iridium_plate', amount: 4 },
      { item: 'modern_industrialization:processing_unit', amount: 1, probability: 0 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:polyvinyl_chloride',
      amount: 1000
    },
    item_outputs: [
      { item: 'mekanismgenerators:electromagnetic_coil', amount: 4 }
    ]
  })

  miRecipe('assembler', 'nuclear/saturating_condenser_batch', {
    eu: 192,
    duration: 1600,
    item_inputs: [
      { item: 'mekanismgenerators:saturating_condenser', amount: 1, probability: 0 },
      { item: 'modern_industrialization:platinum_plate', amount: 8 },
      { item: 'modern_industrialization:iridium_tiny_dust', amount: 2 },
      { item: 'mekanism:elite_thermodynamic_conductor', amount: 4 },
      { item: 'modern_industrialization:heat_exchanger', amount: 2 },
      { item: 'crowns:heat_exchanger', amount: 2 },
      { item: 'modern_industrialization:advanced_pump', amount: 1 }
    ],
    fluid_inputs: {
      fluid: 'minecraft:water',
      amount: 2000
    },
    item_outputs: [
      { item: 'mekanismgenerators:saturating_condenser', amount: 2 }
    ]
  })

  // Quantum controls consume the entire preceding control ladder and the
  // exotic materials that make their environment possible.
  miRecipe('assembler', 'quantum/quantum_circuit_batch', {
    eu: 512,
    duration: 2400,
    item_inputs: [
      { item: 'modern_industrialization:quantum_circuit', amount: 1, probability: 0 },
      { item: 'modern_industrialization:processing_unit', amount: 4 },
      { item: 'modern_industrialization:quantum_circuit_board', amount: 2 },
      { item: 'modern_industrialization:superconductor_wire', amount: 8 },
      { item: 'modern_industrialization:iridium_plate', amount: 4 },
      { item: 'eternal_starlight:starcore', amount: 1 },
      { item: 'eternal_starlight:thioquartz_shard', amount: 4 },
      { item: 'eternal_starlight:soul_dew', amount: 1, probability: 0 },
      { item: 'sgjourney:refined_naquadah', amount: 2 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:uu_matter', amount: 250 },
      { fluid: 'modern_industrialization:cryofluid', amount: 1000 }
    ],
    item_outputs: [
      { item: 'modern_industrialization:quantum_circuit', amount: 2 }
    ]
  })

  miRecipe('assembler', 'quantum/superconductor_dust_mature', {
    eu: 512,
    duration: 2400,
    item_inputs: [
      { item: 'modern_industrialization:iridium_dust', amount: 4 },
      { item: 'modern_industrialization:platinum_dust', amount: 4 },
      { item: 'stellaris:corronium_ingot', amount: 4 },
      { item: 'stellaris:solerium', amount: 4 },
      { tag: 'c:dusts/lithium', amount: 4 },
      { item: 'eternal_starlight:starcore', amount: 2 },
      { item: 'eternal_starlight:aethersent_ingot', amount: 2 },
      { item: 'eternal_starlight:deepsilver_ingot', amount: 4 },
      { item: 'modern_industrialization:superconductor_ingot', amount: 1, probability: 0 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:deuterium', amount: 2000 },
      { fluid: 'modern_industrialization:tritium', amount: 1000 }
    ],
    item_outputs: [
      { item: 'modern_industrialization:superconductor_dust', amount: 24 }
    ]
  })

  miRecipe('assembler', 'quantum/superconductor_coil_batch', {
    eu: 512,
    duration: 1800,
    item_inputs: [
      { item: 'modern_industrialization:superconductor_coil', amount: 1, probability: 0 },
      { item: 'modern_industrialization:superconductor_cable', amount: 32 },
      { item: 'modern_industrialization:iridium_plate', amount: 8 },
      { item: 'eternal_starlight:malarite', amount: 4 },
      { item: 'modern_industrialization:quantum_circuit', amount: 1, probability: 0 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:cryofluid',
      amount: 2000
    },
    item_outputs: [
      { item: 'modern_industrialization:superconductor_coil', amount: 4 }
    ]
  })

  miRecipe('assembler', 'quantum/naquadah_refining_batch', {
    eu: 512,
    duration: 2200,
    item_inputs: [
      { item: 'sgjourney:raw_naquadah', amount: 4 },
      { item: 'modern_industrialization:superconductor_dust', amount: 2 },
      { item: 'eternal_starlight:thioquartz_shard', amount: 4 },
      { item: 'eternal_starlight:soul_dew', amount: 1, probability: 0 },
      { item: 'sgjourney:refined_naquadah', amount: 1, probability: 0 }
    ],
    fluid_inputs: [
      { fluid: 'modern_industrialization:helium_plasma', amount: 1000 },
      { fluid: 'modern_industrialization:sulfuric_acid', amount: 2000 }
    ],
    item_outputs: [
      { item: 'sgjourney:refined_naquadah', amount: 6 }
    ]
  })

  miRecipe('assembler', 'quantum/stargate_crystal_base_batch', {
    eu: 512,
    duration: 1800,
    item_inputs: [
      { item: 'sgjourney:crystal_base', amount: 1, probability: 0 },
      { item: 'ae2:certus_quartz_crystal', amount: 16 },
      { item: 'modern_industrialization:superconductor_wire', amount: 16 },
      { item: 'sgjourney:naquadah_alloy', amount: 4 },
      { tag: 'createch2:malum_reality_engineering', amount: 4 },
      { item: 'eternal_starlight:malarite', amount: 4 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:uu_matter',
      amount: 250
    },
    item_outputs: [
      { item: 'sgjourney:crystal_base', amount: 4 }
    ]
  })

  ;[
    ['communication_crystal', 'ae2:logic_processor'],
    ['control_crystal', 'ae2:engineering_processor'],
    ['transfer_crystal', 'modern_industrialization:quantum_circuit'],
    ['stargate_variant_crystal', 'modern_industrialization:quantum_circuit_board']
  ].forEach(([name, core]) => {
    miRecipe('assembler', `quantum/stargate_${name}_batch`, {
      eu: 512,
      duration: 1600,
      item_inputs: [
        { item: 'sgjourney:crystal_base', amount: 4 },
        { item: 'sgjourney:refined_naquadah', amount: 4 },
        { item: core, amount: 4 },
        { item: 'modern_industrialization:superconductor_wire', amount: 8 },
        { item: 'modern_industrialization:quantum_circuit', amount: 1, probability: 0 }
      ].concat(name === 'stargate_variant_crystal'
        ? [{ item: 'sgjourney:stargate_variant_crystal', amount: 1, probability: 0 }]
        : []),
      fluid_inputs: {
        fluid: 'modern_industrialization:uu_matter',
        amount: 250
      },
      item_outputs: [
        { item: `sgjourney:${name}`, amount: 4 }
      ]
    })
  })

  miRecipe('assembler', 'quantum/stargate_ring_block_batch', {
    eu: 512,
    duration: 2000,
    item_inputs: [
      { item: 'sgjourney:classic_stargate_ring_block', amount: 1, probability: 0 },
      { item: 'sgjourney:naquadah_alloy', amount: 12 },
      { item: 'sgjourney:refined_naquadah', amount: 4 },
      { item: 'modern_industrialization:quantum_machine_casing', amount: 4 },
      { item: 'modern_industrialization:superconductor_coil', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:uu_matter',
      amount: 250
    },
    item_outputs: [
      { item: 'sgjourney:classic_stargate_ring_block', amount: 4 }
    ]
  })

  miRecipe('assembler', 'quantum/stargate_chevron_block_batch', {
    eu: 512,
    duration: 2200,
    item_inputs: [
      { item: 'sgjourney:classic_stargate_chevron_block', amount: 1, probability: 0 },
      { item: 'sgjourney:naquadah_alloy', amount: 8 },
      { item: 'sgjourney:refined_naquadah', amount: 8 },
      { item: 'sgjourney:transfer_crystal', amount: 4 },
      { item: 'sgjourney:energy_crystal', amount: 4 },
      { item: 'modern_industrialization:superconductor_coil', amount: 4 },
      { item: 'modern_industrialization:quantum_circuit', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:uu_matter',
      amount: 500
    },
    item_outputs: [
      { item: 'sgjourney:classic_stargate_chevron_block', amount: 4 }
    ]
  })

  miRecipe('assembler', 'quantum/stargate_base_block_batch', {
    eu: 512,
    duration: 2200,
    item_inputs: [
      { item: 'sgjourney:classic_stargate_base_block', amount: 1, probability: 0 },
      { item: 'sgjourney:naquadah_alloy', amount: 8 },
      { item: 'sgjourney:refined_naquadah', amount: 8 },
      { item: 'sgjourney:transfer_crystal', amount: 4 },
      { item: 'sgjourney:communication_crystal', amount: 4 },
      { item: 'sgjourney:control_crystal', amount: 4 },
      { item: 'modern_industrialization:quantum_circuit', amount: 2 }
    ],
    fluid_inputs: {
      fluid: 'modern_industrialization:uu_matter',
      amount: 500
    },
    item_outputs: [
      { item: 'sgjourney:classic_stargate_base_block', amount: 4 }
    ]
  })

  const componentBatches=componentBatchProduction(componentPolicy);
  for(const [id,data]of Object.entries({...componentBatches.recipes,...componentBatches.nativeRecipes,...componentBatches.boardRecipes}))add(id.slice('createch2:factory_scaling/'.length),data);
  return { recipes: canonicalizeKineticRecipes(recipes), removedOutputs };
}
