import assert from 'node:assert/strict';

export function moltenHeatingHandoff(policy, data) {
  const row = (policy.moltenProviderHandoffs ?? []).find(r => r.legacyFluid === data.result_fluid?.id);
  if (!row) return data;
  assert.equal(data.type, 'tfc:heating');
  assert.equal(row.reference.payload.result_fluid.id, row.moltenFluid);
  assert.equal(row.reference.payload.temperature, row.meltTemperature);
  const conditions = structuredClone(data['neoforge:conditions'] ?? []).map(c =>
    c.type === 'neoforge:mod_loaded' && c.modid === row.legacyMod ? {...c, modid: row.providerMod} : c);
  if (!conditions.some(c => c.type === 'neoforge:mod_loaded' && c.modid === row.providerMod))
    conditions.push({type: 'neoforge:mod_loaded', modid: row.providerMod});
  return {...data, result_fluid: {...data.result_fluid, id: row.moltenFluid},
    temperature: row.meltTemperature, 'neoforge:conditions': conditions};
}

export function physicalHeatDefinition(pin) {
  const d = structuredClone(pin.payload), inputs = Array.isArray(d.ingredient) ? d.ingredient : [d.ingredient];
  assert(inputs.some(i => i.tag === pin.ordinaryTag));
  assert(!inputs.some(i => i.tag === pin.physicalTag));
  d.ingredient = [...inputs, {tag: pin.physicalTag}];
  return d;
}
