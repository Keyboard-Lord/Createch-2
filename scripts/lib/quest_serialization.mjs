import assert from 'node:assert/strict';

// Equivalences observed in Mission04's native FTB resave. Keep arrays, IDs,
// quantities, numeric types and non-default components exact.
export function questSerializationValue(value, key = '') {
  if (Array.isArray(value)) return value.map(entry => questSerializationValue(entry));
  if (value && typeof value === 'object') {
    const result = Object.fromEntries(Object.entries(value).map(([name, entry]) => [name, questSerializationValue(entry, name)]));
    if (result.type === 'advancement' && result.criterion === '') delete result.criterion;
    const components = result.components;
    const heat = components?.['tfc:heat'];
    if (result.id === 'tfmg:aluminum_ingot' && components && Object.keys(components).length === 1
        && heat && typeof heat === 'object' && !Array.isArray(heat) && Object.keys(heat).length === 0) delete result.components;
    return result;
  }
  if (['x', 'y', 'size'].includes(key) && typeof value === 'string' && /^-?\d+(?:\.\d+)?d$/.test(value)) {
    return value.replace(/(\.[0-9]*?[1-9])0+d$/, '$1d').replace(/\.0+d$/, 'd');
  }
  return value;
}

export function verifyQuestSerializationControls() {
  const expected = {id: 'QUEST', x: '224d', dependencies: ['FIRST', 'SECOND'], tasks: [
    {id: 'RETURN', type: 'advancement', advancement: 'createch2:campaign/returned_starlight'},
    {id: 'STOCK', type: 'item', count: '16L', item: {id: 'tfmg:aluminum_ingot', count: '1'}}
  ], rewards: [{id: 'REWARD', type: 'xp', xp: '15'}]};
  const native = structuredClone(expected);
  native.x = '224.0d';
  native.tasks[0].criterion = '';
  native.tasks[1].item.components = {'tfc:heat': {}};
  assert.deepEqual(questSerializationValue(native), questSerializationValue(expected));
  const mutations = [
    v => {v.id = 'OTHER';},
    v => {v.x = '225.0d';},
    v => {v.x = '224f';},
    v => {v.dependencies.pop();},
    v => {v.dependencies.reverse();},
    v => {v.tasks[0].id = 'OTHER_TASK';},
    v => {v.tasks[0].advancement = 'createch2:campaign/returned_moon_cargo';},
    v => {v.tasks[0].criterion = 'specific_criterion';},
    v => {v.tasks[1].count = '32L';},
    v => {v.tasks[1].item.id = 'modern_industrialization:aluminum_plate';},
    v => {v.tasks[1].item.components['tfc:heat'].temperature = '100d';},
    v => {v.tasks[1].item.components['tfc:heat'] = [];},
    v => {v.tasks[1].item.components['minecraft:custom_name'] = 'Changed';},
    v => {v.rewards[0].xp = '30';}
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(native); mutate(changed);
    assert.notDeepEqual(questSerializationValue(changed), questSerializationValue(expected));
  }
  const other = {id: 'minecraft:stone'};
  assert.notDeepEqual(questSerializationValue({...other, components: {'tfc:heat': {}}}), other);
  assert.notEqual(questSerializationValue('16.0d', 'count'), questSerializationValue('16d', 'count'));
  return {nativeEquivalentFixture: true, rejectedCounterexamples: mutations.length + 2};
}
