// Existing Greate machinery supplied by the common Createch industries.
import { staticRecipeWriter } from '../../lib/static_recipe_writer.mjs';
import { kineticItem, beltGrades } from './greate_progression.mjs';

// Native connectors contain six GT material units: 6 * 144 mB. Keep
// inexpensive MI/Chemica sheets out of these stock/recycling boundaries.
export function greateIndustry() {
  const writer = staticRecipeWriter();
  const { event, removeOutputRecipes } = writer;
  removeOutputRecipes(beltGrades.map(grade => `greate:${grade.material}_belt_connector`));
  for (const grade of beltGrades) {
    event.custom({ type: 'greate:compacting', recipe_tier: grade.firstTier,
      ingredients: grade.stock ? Array.from({ length: 6 }, () => ({ item: grade.stock }))
        : [{ type: 'neoforge:single', fluid: grade.fluid, amount: 864 }],
      heat_requirement: grade.fluid ? 'heated' : 'none',
      results: [{ id: `greate:${grade.material}_belt_connector` }]
    }).id(`createch2:greate/belts/${grade.material}`);
  }

  // Port the installed GT reaction's species, quantities, two acid outputs,
  // 96 EU/t and 480 ticks to MI's real reactor. Chlorine comes from the
  // shared electrolysis works; methane is recovered from cracked naphtha.
  // The GT machine ladder remains earned endgame infrastructure.
  event.custom({ type: 'modern_industrialization:chemical_reactor', eu: 96, duration: 480,
    item_inputs: [{ item: 'modern_industrialization:silicon_dust', amount: 1 }],
    fluid_inputs: [
      { fluid: 'minecraft:water', amount: 1000 },
      { fluid: 'modern_industrialization:chlorine', amount: 4000 },
      { fluid: 'modern_industrialization:methane', amount: 2000 }
    ],
    item_outputs: [{ item: 'gtceu:polydimethylsiloxane_dust', amount: 3 }],
    fluid_outputs: [
      { fluid: 'modern_industrialization:hydrochloric_acid', amount: 2000 },
      { fluid: 'gtceu:diluted_hydrochloric_acid', amount: 2000 }
    ]
  }).id('createch2:chemical_age/mi/polydimethylsiloxane');
  // Native sulfur curing: nine precursor dust -> 1,296 mB (nine units).
  event.custom({ type: 'modern_industrialization:chemical_reactor', eu: 30, duration: 600,
    item_inputs: [
      { item: 'gtceu:polydimethylsiloxane_dust', amount: 9 },
      { tag: 'c:dusts/sulfur', amount: 1 }
    ],
    fluid_outputs: [{ fluid: 'gtceu:silicone_rubber', amount: 1296 }]
  }).id('createch2:chemical_age/mi/silicone_rubber');

  // Native GT PTFE species, fluid quantities, acid returns, voltage and time.
  // Use the established refinery/electrolysis/HF supplies in the MI reactor.
  // Chemica's inexpensive sheet remains an equipment ingredient; it never
  // becomes six-unit native belt/recycling stock through a material alias.
  event.custom({ type: 'modern_industrialization:chemical_reactor', eu: 30, duration: 80,
    fluid_inputs: [
      { fluid: 'modern_industrialization:chlorine', amount: 6000 },
      { fluid: 'modern_industrialization:methane', amount: 1000 }
    ],
    fluid_outputs: [
      { fluid: 'modern_industrialization:hydrochloric_acid', amount: 3000 },
      { fluid: 'gtceu:chloroform', amount: 1000 }
    ]
  }).id('createch2:greate/polymers/chloroform');
  event.custom({ type: 'modern_industrialization:chemical_reactor', eu: 240, duration: 480,
    fluid_inputs: [
      { fluid: 'gtceu:chloroform', amount: 2000 },
      { fluid: 'chemica:hydrofluoric_acid', amount: 4000 }
    ],
    fluid_outputs: [
      { fluid: 'modern_industrialization:hydrochloric_acid', amount: 6000 },
      { fluid: 'gtceu:tetrafluoroethylene', amount: 1000 }
    ]
  }).id('createch2:greate/polymers/tetrafluoroethylene');
  event.custom({ type: 'modern_industrialization:chemical_reactor', eu: 30, duration: 160,
    fluid_inputs: [
      { fluid: 'modern_industrialization:oxygen', amount: 1000 },
      { fluid: 'gtceu:tetrafluoroethylene', amount: 144 }
    ],
    fluid_outputs: [{ fluid: 'gtceu:polytetrafluoroethylene', amount: 216 }]
  }).id('createch2:greate/polymers/polytetrafluoroethylene');

  // Feed and recover the late specialist polymer line using existing MI plant.
  // Quantities, time and EU follow the installed GT mixer/distillation recipes.
  event.custom({ type:'modern_industrialization:mixer',eu:2,duration:500,
    fluid_inputs:[{fluid:'chemica:nitric_acid',amount:1000},
      {fluid:'modern_industrialization:sulfuric_acid',amount:1000}],
    fluid_outputs:[{fluid:'gtceu:nitration_mixture',amount:2000}]
  }).id('createch2:greate/polymers/nitration_mixture');
  event.custom({ type:'modern_industrialization:distillation_tower',eu:120,duration:600,
    fluid_inputs:[{fluid:'gtceu:diluted_sulfuric_acid',amount:3000}],
    fluid_outputs:[{fluid:'modern_industrialization:sulfuric_acid',amount:2000},
      {fluid:'minecraft:water',amount:1000}]
  }).id('createch2:greate/polymers/sulfuric_acid_recovery');

  for (const fluid of ['chlorine', 'methane']) {
    event.custom({ type: 'create:mixing', recipe_tier: 0,
      ingredients: [{ type: 'neoforge:single', fluid: `chemica:${fluid}`, amount: 500 }],
      results: [{ id: `modern_industrialization:${fluid}`, amount: 500 }]
    }).id(`createch2:fluid_compat/chemica_${fluid}_to_mi`);
  }

  // High-voltage native Greate cable assembly consumes PVC foil. Form and
  // slit the shared polymer with existing Greate equipment rather than
  // requiring a parallel early Greg assembler/bender ladder.
  removeOutputRecipes(['gtceu:polyvinyl_chloride_plate', 'gtceu:polyvinyl_chloride_foil']);
  event.custom({ type: 'greate:compacting', recipe_tier: 2, heat_requirement: 'heated',
    ingredients: [{ type: 'neoforge:single', fluid: 'modern_industrialization:polyvinyl_chloride', amount: 144 }],
    results: [{ id: 'gtceu:polyvinyl_chloride_plate' }]
  }).id('createch2:greate/polymers/pvc_plate');
  event.custom({ type: 'greate:cutting', recipe_tier: 2,
    ingredients: [{ item: 'gtceu:polyvinyl_chloride_plate' }], processing_time: 100,
    results: [{ id: 'gtceu:polyvinyl_chloride_foil', count: 4 }]
  }).id('createch2:greate/polymers/pvc_foil');

  // Keep the native five-cube structure and IV pumps. The controller also
  // needs a mature MI hull/control line and Greate's titanium fluid tooling.
  removeOutputRecipes(['greate:wire_coating_factory']);
  event.shaped('greate:wire_coating_factory', ['WCP', 'HSG', 'WCP'], {
    W: 'gtceu:watertight_casing', C: 'modern_industrialization:quantum_circuit',
    P: 'gtceu:iv_electric_pump', H: 'modern_industrialization:highly_advanced_machine_hull',
    S: 'create:spout', G: kineticItem(4, 'mechanical_pump')
  }).id('createch2:greate/factory/wire_coating_controller');
  return { recipes: writer.recipes, removals: writer.removals,
    families: [{ name: 'Greate polymer logistics and wire-coating works', recipes: writer.calls.length }] };
}
