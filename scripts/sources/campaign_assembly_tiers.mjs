// Reviewed production duties, not age-name inference. Runtime-script owners use
// these exact tiers too; verify_campaign_assemblies checks their captured output.
export const assemblyPressPolicy = {
  "createch2:heavy_industry/tfmg/distillation_controller": {
    "tier": 0,
    "purpose": "Keep petroleum bootstrap on the existing foundry."
  },
  "createch2:steel_steam/tfmg/steel_mechanism": {
    "tier": 1,
    "purpose": "Steel forming serves durable machinery; the steel press uses precision mechanisms, not its own steel-mechanism output."
  },
  "createch2:aeronautics/stage_2/engine_assembly": {
    "tier": 1,
    "purpose": "The serviced steel district supplies flight engines."
  },
  "createch2:simulated/sequenced_assembly/engine_assembly": {
    "tier": 1,
    "purpose": "The parallel engine route uses the same forming capability."
  },
  "createch2:railway/locomotive/steam_assembly": {
    "tier": 1,
    "purpose": "Steel machinery builds the bulk freight network."
  },
  "createch2:first_space/stellaris/rocket_final_assembly": {
    "tier": 1,
    "purpose": "Terrestrial steel machinery builds first access; no returned-space machinery required."
  },
  "createch2:oritech_jdt/age_08/oritech/hall/machine_core_1_commissioning": {
    "tier": 2,
    "purpose": "Returned-space aluminum machinery commissions the modular electric hall."
  },
  "createch2:chemical_age/mekanism/pressurized_reaction_chamber_assembly": {
    "tier": 2,
    "purpose": "Advanced Electric machinery assembles the pressure chemistry installation."
  },
  "createch2:stainless_digital/ae2/controller_assembly": {
    "tier": 3,
    "purpose": "Digital circuits build the stainless press before the AE2 controller."
  },
  "createch2:oritech_jdt/age_11/oritech/deep_drill": {
    "tier": 4,
    "purpose": "Titanium precision forms the deep-extraction plant."
  },
  "createch2:systems/radiation/mekanism_fission_logic_adapter": {
    "tier": 4,
    "purpose": "The aerospace floor manufactures reactor instrumentation."
  },
  "createch2:extreme_industry/avaritia/neutron_collector": {
    "tier": 4,
    "purpose": "Keep neutron and Starlight work before COM-06 tungsten-steel machinery."
  },
  "createch2:quantum/fusion/reactor_assembly": {
    "tier": 5,
    "purpose": "Quantum-grade machinery forms controlled-fusion infrastructure."
  },
  "createch2:quantum/ae2/quantum_link_assembly": {
    "tier": 6,
    "purpose": "LuV precision machinery serves distributed quantum networks."
  },
  "createch2:quantum/sgjourney/classic_stargate": {
    "tier": 6,
    "purpose": "The established RPP floor builds first-gate access before returned trinium supplies Naquadah machinery."
  },
  "createch2:oritech_jdt/age_15/oritech/accelerator/accelerator_ring": {
    "tier": 7,
    "purpose": "Returned trinium and the shared precision campus supply Naquadah forming for the accelerator."
  },
  "createch2:oritech_jdt/age_15/oritech/accelerator/accelerator_motor": {
    "tier": 7,
    "purpose": "Returned trinium and the shared precision campus supply Naquadah forming for the accelerator."
  },
  "createch2:oritech_jdt/age_15/oritech/accelerator/accelerator_sensor": {
    "tier": 7,
    "purpose": "Returned trinium and the shared precision campus supply Naquadah forming for the accelerator."
  },
  "createch2:oritech_jdt/age_15/oritech/accelerator/particle_collector_block": {
    "tier": 7,
    "purpose": "Returned trinium and the shared precision campus supply Naquadah forming for the accelerator."
  },
  "createch2:oritech_jdt/age_15/oritech/accelerator/accelerator_controller": {
    "tier": 7,
    "purpose": "Returned trinium and the shared precision campus supply Naquadah forming for the accelerator."
  },
  "dysoncubeproject:beam": {
    "tier": 8,
    "purpose": "The accelerator-era floor supplies repeat stellar-array structure."
  },
  "dysoncubeproject:solar_sail": {
    "tier": 8,
    "purpose": "The accelerator-era floor supplies repeat stellar-array collectors."
  },
  "dysoncubeproject:em_railejector_controller": {
    "tier": 9,
    "purpose": "Final neutronium machinery assembles the stellar launch installation."
  },
  "dysoncubeproject:ray_receiver_controller": {
    "tier": 9,
    "purpose": "Final neutronium machinery assembles stellar power reception."
  }
};

export function applyAssemblyPressTiers(recipes) {
  return Object.fromEntries(Object.entries(recipes).map(([id, recipe]) => {
    const rule = assemblyPressPolicy[id];
    if (!rule || rule.tier === 0 || rule.supplierUnresolved) return [id, recipe];
    if (recipe.type !== 'create:sequenced_assembly') throw new Error(`Assembly owner changed: ${id}`);
    let presses = 0;
    const sequence = recipe.sequence.map(step => {
      if (step.type !== 'create:pressing') return step;
      presses++;
      return { ...step, type: 'greate:pressing', recipe_tier: rule.tier };
    });
    if (presses !== 1) throw new Error(`Expected one commissioning press: ${id}`);
    return [id, { ...recipe, sequence }];
  }));
}
