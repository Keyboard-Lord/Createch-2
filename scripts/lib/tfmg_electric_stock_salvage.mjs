import assert from 'node:assert/strict';

// Selected ordinary stock only; carrier, paper, insulation and machine state are unrecovered.
export function tfmgElectricStockSalvage(source, units) {
  const policy = source.tfmgElectricRecovery.stockSalvage;
  assert.equal(policy.maximumTrackedRecovery, 0.5);
  const plate = material => {
    const form = units.forms.find(r => r.material === material);
    assert.equal(form.plateMetalUnits, 100);
    return form.plateMetalUnits;
  };
  const witness = id => {
    const row = source.tfmgElectricRecovery.stockSnapshots.find(r => r.recipe === id);
    assert(row, 'Missing reviewed electric stock supplier');
    return row.data;
  };
  const wire = source.motionWireStock.nativeWitnesses.find(r => r.recipe === 'modern_industrialization:materials/copper/wiremill/wire').data;
  assert.deepEqual(wire.item_inputs, [{amount: 1, tag: 'c:plates/copper'}]);
  assert.deepEqual(wire.item_outputs, [{amount: 2, item: 'modern_industrialization:copper_wire'}]);
  const wireUnits = plate('copper') / wire.item_outputs[0].amount;
  const spool = witness('tfmg:crafting/copper_spool');
  assert.equal(spool.type, 'minecraft:crafting_shaped');
  assert.deepEqual(spool.result, {count: 1, id: 'tfmg:copper_spool'});
  let spoolCopper = 0;
  for (const symbol of spool.pattern.join('')) {
    if (symbol === ' ') continue;
    const input = spool.key[symbol];
    assert(input);
    if (input.tag === 'c:wires/copper') spoolCopper += wireUnits;
    else assert.equal(input.item, 'tfmg:empty_spool');
  }
  const capacitor = witness('tfmg:sequenced_assembly/capacitor');
  assert.equal(capacitor.type, 'create:sequenced_assembly');
  assert.deepEqual(capacitor.ingredient, {tag: 'c:plates/steel'});
  assert.deepEqual(capacitor.results, [{count: 4, id: 'tfmg:capacitor_item'}]);
  const loops = capacitor.loops ?? source.tfmgStockRecovery.nativeAssembly.defaultLoops;
  assert.equal(loops, 5);
  let capacitorCopper = 0;
  for (const step of capacitor.sequence) {
    assert.equal(step.type, 'create:deploying');
    for (const input of step.ingredients) {
      if (input.tag === 'c:plates/copper') capacitorCopper += plate('copper') * (input.count ?? 1);
      else assert(['tfmg:unfinished_capacitor', 'minecraft:paper'].includes(input.item));
    }
  }
  const stock = {
    'tfmg:copper_spool': {copper: spoolCopper},
    'tfmg:capacitor_item': {steel: plate('steel') / 4, copper: capacitorCopper * loops / 4}
  };
  const recipes = {};
  for (const row of policy.rows) {
    assert.deepEqual(row.trackedBill, stock[row.item]);
    assert(Number.isSafeInteger(row.inputCount) && row.inputCount > 0 && row.inputCount <= 64);
    const outputs = Object.entries(stock[row.item]).map(([material, amount]) => ({
      item: 'modern_industrialization:' + material + '_dust',
      amount: Math.floor(amount * row.inputCount * policy.maximumTrackedRecovery / 100)
    }));
    assert.deepEqual(row.outputs, outputs);
    assert(outputs.every(r => r.amount > 0 && r.amount <= 64));
    assert(outputs.length <= source.tfmgElectricRecovery.maceratorEvidence.itemOutputs);
    recipes[row.recovery] = {type: 'modern_industrialization:macerator', eu: 2,
      duration: 400 * row.inputCount, item_inputs: [{item: row.item, amount: row.inputCount}], item_outputs: outputs};
  }
  return {stock, wireUnits, recipes};
}
