// Build-time recipe vocabulary. Only literal vanilla crafting and raw custom
// codecs are supported; native builders and ingredient actions stay in KubeJS.
import assert from 'node:assert/strict';

export function staticRecipeWriter() {
  const recipes = {}, removals = [], calls = [];
  const ingredient = value => {
    assert.equal(typeof value, 'string', 'Use explicit custom JSON for nonliteral ingredients');
    assert.match(value, /^#?[a-z0-9_.-]+:[a-z0-9_./-]+$/);
    return value.startsWith('#') ? { tag: value.slice(1) } : { item: value };
  };
  const result = value => {
    const counted = typeof value === 'string' && /^(\d+)x ([a-z0-9_.-]+:[a-z0-9_./-]+)$/.exec(value);
    const stack = counted ? { id: counted[2], count: Number(counted[1]) }
      : typeof value === 'string' ? { id: value, count: 1 } : value;
    assert.deepEqual(Object.keys(stack).sort(), ['count', 'id']);
    assert.match(stack.id, /^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
    assert(Number.isSafeInteger(stack.count) && stack.count > 0);
    return stack;
  };
  const add = (kind, args, data) => ({ id(id) {
    assert(!Object.hasOwn(recipes, id), `Duplicate source recipe: ${id}`);
    assert.match(id, /^createch2:[a-z0-9_./-]+$/);
    recipes[id] = data;
    calls.push({ id, kind, args });
  } });
  const event = {
    custom(data) { return add('custom', [data], data); },
    shaped(output, pattern, key) {
      assert(pattern.length >= 1 && pattern.length <= 3 && pattern.every(row => row.length === pattern[0].length && row.length <= 3));
      const used = [...new Set(pattern.join('').replaceAll(' ', ''))].sort();
      assert.deepEqual(Object.keys(key).sort(), used, 'Shaped keys must exactly cover the pattern');
      return add('shaped', [output, pattern, key], { type: 'minecraft:crafting_shaped', pattern,
        key: Object.fromEntries(Object.entries(key).map(([symbol, value]) => [symbol, ingredient(value)])), result: result(output) });
    },
    shapeless(output, inputs) {
      assert(inputs.length >= 1 && inputs.length <= 9);
      return add('shapeless', [output, inputs], { type: 'minecraft:crafting_shapeless', ingredients: inputs.map(ingredient), result: result(output) });
    },
    remove(filter) { removals.push(filter); }
  };
  return { event, recipes, removals, calls, Item: { of: (id, count = 1) => ({ id, count }) },
    removeRecipe: filter => removals.push(...(Array.isArray(filter) ? filter : [filter])),
    removeOutputRecipes: (outputs, retainedRecipeId) => outputs.forEach(output => removals.push(retainedRecipeId
      ? { output, not: { id: retainedRecipeId } } : { output })) };
}
