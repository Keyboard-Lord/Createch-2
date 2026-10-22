// Static resource references, not ingredient matching, quantities or acquisition.
// Assembly intermediates are inputs to steps, never independent final outputs.
const idPattern = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/;

function refs(value, kind = 'item') {
  if (Array.isArray(value)) return value.flatMap(entry => refs(entry, kind));
  if (typeof value === 'string') {
    const tag = value.startsWith('#'), id = tag ? value.slice(1) : value;
    return idPattern.test(id) ? [{ kind: tag ? `${kind}_tag` : kind, id }] : [];
  }
  if (!value || typeof value !== 'object') return [];
  if (value.type === 'neoforge:tag' && value.tag) return refs('#' + value.tag, 'fluid');
  if (value.fluid) return refs(value.fluid, 'fluid');
  if (value.chemical) return refs(value.chemical, 'chemical');
  if (value.tag) return refs('#' + value.tag, kind);
  if (value.item) return refs(value.item, 'item');
  if (value.id) return refs(value.id, kind);
  // Native compound ingredients retain all referenced alternatives. Their
  // logical choice/combination still needs the installed ingredient codec.
  return ['ingredient', 'ingredients', 'children', 'items', 'result', 'stack'].flatMap(key => refs(value[key], kind));
}

function unique(values) {
  const entries = new Map(values.map(ref => [`${ref.kind}:${ref.id}`, ref]));
  return [...entries.values()].sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`));
}

export function recipeInputRefs(recipe) {
  const items = ['ingredient', 'ingredients', 'item_input', 'item_inputs', 'input_item', 'input', 'inputs', 'base', 'addition', 'repairMaterial']
    .flatMap(key => refs(recipe[key]));
  if (recipe.key) items.push(...Object.values(recipe.key).flatMap(value => refs(value)));
  const fluids = ['fluid_input', 'fluid_inputs', 'input_fluid'].flatMap(key => refs(recipe[key], 'fluid'));
  const chemicals = ['chemical_input', 'chemical_inputs'].flatMap(key => refs(recipe[key], 'chemical'));
  const workpiece = recipe.transitional_item?.id ?? recipe.transitional_item?.item;
  const steps = (recipe.sequence ?? []).flatMap(recipeInputRefs)
    .filter(ref => ref.kind !== 'item' || ref.id !== workpiece);
  return unique([...items, ...fluids, ...chemicals, ...steps]);
}

export function recipeOutputRefs(recipe) {
  const results = [recipe.result, recipe.output, recipe.outputs].flatMap(value => refs(value));
  results.push(...(recipe.results ?? []).flatMap(value => refs(value,
    value && typeof value === 'object' && value.amount !== undefined ? 'fluid' : 'item')));
  results.push(...['result_item', 'item_output', 'item_outputs', 'output_item'].flatMap(key => refs(recipe[key], 'item')));
  results.push(...['result_fluid', 'fluid_output', 'fluid_outputs', 'output_fluid'].flatMap(key => refs(recipe[key], 'fluid')));
  results.push(...['chemical_output', 'chemical_outputs'].flatMap(key => refs(recipe[key], 'chemical')));
  return unique(results);
}

export function refLabel(ref) {
  const tag = ref.kind.endsWith('_tag') ? '#' : '';
  const registry = ref.kind.replace(/_tag$/, '');
  return (registry === 'item' ? '' : registry + ':') + tag + ref.id;
}
