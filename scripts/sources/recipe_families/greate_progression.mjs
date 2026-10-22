// Build-time authority for the native Greate hierarchy. No new items or tiers.
import { staticRecipeWriter } from '../../lib/static_recipe_writer.mjs';

// Existing late breakthroughs explicitly own all upper machinery. Native GT
// materials, research, circuits and predecessor machinery still prove supply.
export const upperKineticKnowledgePolicy = {
  firstTier: 6, lastTier: 9, gateway: 'COM-06',
  authority: 'existing_researchd_milestones_plus_native_gt_suppliers',
  directResearchdLocks: true,
  tierNodes: { 6: 'NUC-06', 7: 'FRN-04E', 8: 'FRN-05', 9: 'FRN-06' },
  retainedProofs: ['previous Greate machinery', 'current material plate', 'voltage circuit', 'machine hull and motor where used']
};

export const greateTiers = [
  { material: 'andesite_alloy', plate: 'andesite_alloy', control: null, casing: 'create:andesite_casing', motion: null },
  { material: 'steel', plate: 'steel', control: 'create:precision_mechanism', casing: 'tfmg:steel_casing', motion: 'tfmg:steel_mechanism' },
  { material: 'aluminium', plate: 'aluminum', control: 'modern_industrialization:electronic_circuit', casing: 'modern_industrialization:advanced_machine_hull', motion: 'modern_industrialization:advanced_motor' },
  { material: 'stainless_steel', plate: 'stainless_steel', control: 'modern_industrialization:digital_circuit', casing: 'modern_industrialization:advanced_machine_hull', motion: 'modern_industrialization:advanced_motor' },
  { material: 'titanium', plate: 'titanium', control: 'modern_industrialization:processing_unit', casing: 'modern_industrialization:highly_advanced_machine_hull', motion: 'modern_industrialization:advanced_motor' },
  { material: 'tungsten_steel', plate: 'tungsten_steel', control: 'modern_industrialization:quantum_circuit', casing: 'modern_industrialization:quantum_machine_hull', motion: 'modern_industrialization:advanced_motor' },
  ...['luv', 'zpm', 'uv', 'uhv'].map((voltage, index) => ({
    material: ['rhodium_plated_palladium', 'naquadah_alloy', 'darmstadtium', 'neutronium'][index],
    plate: ['rhodium_plated_palladium', 'naquadah_alloy', 'darmstadtium', 'neutronium'][index],
    control: `#gtceu:circuits/${voltage}`, casing: `gtceu:${voltage}_machine_hull`, motion: `gtceu:${voltage}_electric_motor`
  }))
];
export const kineticParts = ['shaft', 'cogwheel', 'large_cogwheel', 'gearbox', 'vertical_gearbox',
  'mechanical_press', 'mechanical_mixer', 'mechanical_pump', 'mechanical_saw', 'millstone', 'encased_fan', 'crushing_wheel'];
// Installed native belt families each serve two successive shaft tiers.
export const beltGrades = [
  { material: 'rubber', firstTier: 0, lastTier: 1, stock: 'rubberworks:rubber' },
  { material: 'silicone_rubber', firstTier: 2, lastTier: 3, fluid: 'gtceu:silicone_rubber' },
  { material: 'polyethylene', firstTier: 4, lastTier: 5, fluid: 'modern_industrialization:polyethylene' },
  { material: 'polytetrafluoroethylene', firstTier: 6, lastTier: 7, fluid: 'gtceu:polytetrafluoroethylene' },
  { material: 'polybenzimidazole', firstTier: 8, lastTier: 9, fluid: 'gtceu:polybenzimidazole' }
];
export const beltItem = tier => `greate:${beltGrades.find(grade => tier >= grade.firstTier && tier <= grade.lastTier).material}_belt_connector`;
export function kineticItem(tier, part) {
  const material = greateTiers[tier].material;
  return `greate:${part === 'large_cogwheel' ? `large_${material}_cogwheel` : `${material}_${part}`}`;
}
export function kineticTier(id) {
  const name = id.split(':')[1];
  if (/^(quantum|greg_gateway|extreme_industry)\//.test(name)) return 5;
  if (/^(nuclear|cosmonautics|cosmonautics_foundation|high_pressure|compact_mobile)\//.test(name)) return 4;
  if (/^(stainless_digital|greg_shared|aeronautics\/stage_[34]|create_aeronautics_automated_logistics)\//.test(name)) return 3;
  if (/^(advanced_electric|chemical_age|arcane_chemistry)\//.test(name)) return 2;
  if (/^(heavy_industry|steel_age|low_voltage|first_space|aeronautics\/stage_2|cbc_ballistics)\//.test(name)) return 1;
  if (name.startsWith('factory_scaling/')) {
    if (name.includes('/quantum/')) return 5;
    if (/\/(nuclear|aerospace)\//.test(name)) return 4;
    if (/\/(factory_control|logistics|mass_processing)\//.test(name)) return 3;
    return 1;
  }
  return 0;
}
const processing = new Set(['pressing', 'cutting', 'milling', 'crushing', 'mixing', 'compacting', 'splashing', 'haunting']);
const legacy = new Map(kineticParts.map(part => [`create:${part === 'crushing_wheel' ? 'crushing_wheel' : part}`, part]));
export const baseKineticAliases = [...legacy].map(([oldItem, part]) => ({
  tag: `c:createch2_kinetics/${part}/andesite_alloy`, values: [oldItem, kineticItem(0, part)]
}));
export function canonicalizeKineticRecipes(recipes) {
  return Object.fromEntries(Object.entries(recipes).map(([id, original]) => {
    const tier = kineticTier(id);
    function rewrite(value, field) {
      if (Array.isArray(value)) return value.map(entry => rewrite(entry, field));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, rewrite(entry, key)]));
      if (typeof value === 'string' && ['item', 'id'].includes(field) && legacy.has(value)) {
        // Existing basic output owners become Greate entry recipes; inputs
        // follow the consuming industry's tier. Recipe IDs remain stable.
        return kineticItem(field === 'id' ? 0 : tier, legacy.get(value));
      }
      if (value === 'create:belt_connector' && field === 'item') return beltItem(tier);
      return value;
    }
    const data = rewrite(original);
    if (original.type.startsWith('create:') && processing.has(original.type.slice(7))) {
      data.type = `greate:${original.type.slice(7)}`;
      data.recipe_tier = tier;
      // Form a new tier's stock on the preceding tier's tools, avoiding a
      // press -> plate -> same press bootstrap cycle.
      const materials = JSON.stringify(original.results ?? []);
      for (let i = greateTiers.length - 1; i > 0; i--) {
        if (new RegExp(`(?:${greateTiers[i].plate}|${greateTiers[i].material})_(?:plate|sheet|ingot|shaft)`).test(materials)) {
          data.recipe_tier = Math.max(0, i - 1); break;
        }
      }
      // Existing entry-tier factories retain their native processing routes.
      // Greate itself integrates these at tier zero; higher capabilities use
      // its explicit serializer and cannot run on legacy untiered machinery.
      if (data.recipe_tier === 0) data.type = original.type;
      // Fan washing supplies its physical water input in the native codec.
      if (data.type === 'greate:splashing' && !data.ingredients.some(entry => entry.fluid || entry.type === 'neoforge:single')) {
        data.ingredients.push({ type: 'neoforge:single', fluid: 'minecraft:water', amount: 1 });
      }
    }
    return [id, data];
  }));
}

export function greateProgression() {
  const writer = staticRecipeWriter();
  const { event, Item, removeOutputRecipes } = writer;
  const name = (tier, part) => `createch2:greate/tier_${tier}/${part}`;
  // Native legacy scrap from the precision assembly remains compatible. Its
  // failure outputs must never cause the precision supplier to be removed.
  const precision = 'greate:sequenced_assembly/precision_mechanism';
  removeOutputRecipes([...legacy.keys()], precision);
  for (let tier = 0; tier < greateTiers.length; tier++) {
    const rule = greateTiers[tier], plate = `#c:plates/${rule.plate}`;
    const item = part => kineticItem(tier, part);
    // Almost Unified also rewrites legacy precision scraps into these parts.
    // Preserve that same native supplier after unification as well as before it.
    removeOutputRecipes(kineticParts.map(item), precision);
    event.custom({ type: 'greate:cutting', recipe_tier: Math.max(0, tier - 1),
      ingredients: [{ tag: `c:plates/${rule.plate}` }], processing_time: 100,
      results: [{ id: item('shaft'), count: 6 }] }).id(name(tier, 'shaft_cutting'));
    event.shapeless(item('cogwheel'), tier === 0
      ? [item('shaft'), 'create:andesite_alloy', '#minecraft:planks']
      : [kineticItem(tier - 1, 'cogwheel'), item('shaft'), plate]).id(name(tier, 'cogwheel'));
    event.shapeless(item('large_cogwheel'), [item('cogwheel'), item('cogwheel'), tier === 0 ? '#minecraft:planks' : plate])
      .id(name(tier, 'large_cogwheel'));
    event.shaped(item('gearbox'), ['CSC', 'PHP', ' S '], {
      C: item('cogwheel'), S: item('shaft'), P: tier === 0 ? 'create:andesite_alloy' : plate,
      H: tier === 0 ? 'create:andesite_casing' : kineticItem(tier - 1, 'gearbox')
    }).id(name(tier, 'gearbox'));
    event.shapeless(item('vertical_gearbox'), [item('gearbox')]).id(name(tier, 'vertical_gearbox'));
    event.shapeless(item('gearbox'), [item('vertical_gearbox')]).id(name(tier, 'horizontal_gearbox'));
    for (const part of ['mechanical_press', 'mechanical_mixer', 'millstone', 'encased_fan', 'mechanical_saw', 'mechanical_pump']) {
      if (tier === 0 && part === 'mechanical_press') continue; // Existing TFC double-sheet owner.
      if (tier === 0) {
        const work = part === 'mechanical_mixer' ? 'create:whisk' : part === 'mechanical_saw' ? 'tfc:metal/double_sheet/bronze'
          : part === 'mechanical_pump' ? 'create:fluid_pipe' : part === 'millstone' ? '#c:stones/raw' : '#c:plates/tin';
        event.shaped(item(part), [' G ', 'SCS', ' W '], {
          G: item('cogwheel'), S: item('shaft'), C: rule.casing, W: work
        }).id(name(tier, part));
      } else if (part === 'mechanical_saw') {
        event.shaped(item(part), ['PGP', 'HMS', ' C '], { P: plate, G: kineticItem(tier - 1, part),
          H: rule.casing, M: rule.motion, S: item('cogwheel'), C: rule.control }).id(name(tier, part));
      } else if (part === 'mechanical_pump') {
        event.shaped(item(part), ['RPR', 'GHC', ' S '], {
          R: tier === 1 ? '#createch2:natural_rubber_sheet_precursors' : 'modern_industrialization:rubber_sheet',
          P: 'create:fluid_pipe', G: kineticItem(tier - 1, part), H: plate, C: rule.control, S: item('cogwheel')
        }).id(name(tier, part));
      } else {
        event.shaped(item(part), ['PGP', 'CHC', ' M '], {
          P: plate, G: kineticItem(tier - 1, part),
          C: item('cogwheel'), H: rule.casing, M: rule.control
        }).id(name(tier, part));
      }
    }
    event.custom({ type: 'create:mechanical_crafting', pattern: ['PCP', 'GSG', 'PHP'],
      key: { P: { tag: `c:plates/${rule.plate}` }, C: { item: item('cogwheel') },
        G: { item: tier === 0 ? 'create:andesite_casing' : kineticItem(tier - 1, 'crushing_wheel') },
        S: { item: item('shaft') }, H: rule.control?.startsWith('#') ? { tag: rule.control.slice(1) }
          : { item: rule.control ?? 'create:andesite_casing' } },
      result: { id: item('crushing_wheel'), count: 2 }, accept_mirrored: false }).id(name(tier, 'crushing_wheel'));
  }
  event.custom({ type: 'greate:pressing', recipe_tier: 0,
    ingredients: [{ item: 'create:andesite_alloy' }], results: [{ id: 'greate:andesite_alloy_plate' }] })
    .id('createch2:greate/tier_0/andesite_plate');
  return { recipes: writer.recipes, removals: writer.removals, families: [{ name: 'Greate mechanical hierarchy', recipes: writer.calls.length }] };
}
