import assert from 'node:assert/strict';

// Scale active paid bills; preserve fluid shape and all predecessor inputs.
export function componentBatchProduction(source){
 const p=source.productionRelief;assert.equal(p.batchSize,4);assert.equal(p.powerMultiplier,4);assert.equal(p.durationMultiplier,1);assert.deepEqual(p.heldPrototype,{amount:1,probability:0});
 const prototypes=new Map(source.routes.map(r=>[r.item,r])),recipes={},nativeRecipes={},boardRecipes={};
 for(const row of p.routes){
  const prototype=prototypes.get(row.item);assert(prototype);assert.equal(row.prototype,prototype.producer);const original=prototype.producerPayload;assert.equal(original.type,'modern_industrialization:assembler');assert.deepEqual(original.item_outputs,[{item:row.item,amount:1}]);assert(!original.fluid_outputs);
  const batch=structuredClone(original);batch.eu*=4;
  batch.item_inputs=batch.item_inputs.map(input=>{assert(input.item||input.tag);assert.equal(input.probability,undefined);assert(Number.isSafeInteger(input.amount)&&input.amount>0);const result={...input,amount:input.amount*4};assert(result.amount<=64);return result;});
  const scaleFluid=fluid=>{assert.deepEqual(Object.keys(fluid).sort(),['amount','fluid']);assert.equal(fluid.fluid,'modern_industrialization:soldering_alloy');assert(Number.isSafeInteger(fluid.amount)&&fluid.amount>0);const result={...fluid,amount:fluid.amount*4};assert(result.amount<=p.assembler.fluidInputCapacity);return result;};
  batch.fluid_inputs=Array.isArray(batch.fluid_inputs)?batch.fluid_inputs.map(scaleFluid):scaleFluid(batch.fluid_inputs);assert([batch.fluid_inputs].flat().length<=p.assembler.fluidInputs);
  batch.item_inputs.push({item:row.item,...p.heldPrototype});assert(batch.item_inputs.length<=p.assembler.itemInputs);batch.item_outputs=[{item:row.item,amount:4}];assert.equal(batch.eu*batch.duration/4,original.eu*original.duration);assert(!recipes[row.batch]);recipes[row.batch]=batch;
 }
 // Native mechanical components use the same earned-prototype and power
 // investment policy. They add no solder when the native bill has none.
 for(const row of p.nativeRoutes??[]){
  const authority=p.nativeComponentAuthority?.find(r=>r.item===row.item);let original;
  if(authority){const witness=authority.nativePrototypes.find(r=>r.recipe===row.prototype);assert(witness,'Missing reviewed native first prototype');original=witness.data;}
  else{const route=source.miProcessRecovery.routes.find(r=>r.item===row.item);assert(route&&route.producerIds.includes(row.prototype));original=source.miProcessRecovery.producerSnapshots[row.prototype];assert(source.miProcessRecovery.nativeProducers.some(r=>r.recipe===row.prototype&&!r.retired));}
  assert(original);
  assert.equal(original.type,'modern_industrialization:assembler');assert.deepEqual(original.item_outputs,[{item:row.item,amount:1}]);assert(!original.fluid_inputs&&!original.fluid_outputs,'Unreviewed native component fluids');
  const batch=structuredClone(original);batch.eu*=p.powerMultiplier;batch.duration*=p.durationMultiplier;
  batch.item_inputs=batch.item_inputs.map(input=>{assert(input.item||input.tag);assert.equal(input.probability,undefined);assert(Number.isSafeInteger(input.amount)&&input.amount>0);const result={...input,amount:input.amount*p.batchSize};assert(result.amount<=64);return result;});
  batch.item_inputs.push({item:row.item,...p.heldPrototype});assert(batch.item_inputs.length<=p.assembler.itemInputs);batch.item_outputs=[{item:row.item,amount:p.batchSize}];
  assert.equal(batch.eu*batch.duration/p.batchSize,original.eu*original.duration);assert(!recipes[row.batch]&&!nativeRecipes[row.batch]);nativeRecipes[row.batch]=batch;
 }
 // Board production scales its original polymer/coolant bill. The PVC-heavy
 // processing board uses two outputs so each fluid slot fits the real machine.
 for(const row of p.nativeBoardRoutes??[]){
  const original=row.prototype.data,size=row.batchSize;
  assert([2,4].includes(size));assert.equal(row.powerMultiplier,size);
  assert.equal(original.type,'modern_industrialization:assembler');assert.deepEqual(original.item_outputs,[{item:row.item,amount:1}]);assert(!original.fluid_outputs);
  const batch=structuredClone(original);batch.eu*=size;
  batch.item_inputs=batch.item_inputs.map(input=>{assert(input.item||input.tag);assert.equal(input.probability,undefined);assert(Number.isSafeInteger(input.amount)&&input.amount>0);const out={...input,amount:input.amount*size};assert(out.amount<=64);return out;});
  assert(Array.isArray(original.fluid_inputs));assert(original.fluid_inputs.length>0&&original.fluid_inputs.length<=p.assembler.fluidInputs);
  batch.fluid_inputs=original.fluid_inputs.map(input=>{assert.deepEqual(Object.keys(input).sort(),['amount','fluid']);assert(Number.isSafeInteger(input.amount)&&input.amount>0);const out={...input,amount:input.amount*size};assert(out.amount<=p.assembler.fluidInputCapacity);return out;});
  batch.item_inputs.push({item:row.item,...p.heldPrototype});assert(batch.item_inputs.length<=p.assembler.itemInputs);batch.item_outputs=[{item:row.item,amount:size}];
  assert.equal(batch.eu*batch.duration/size,original.eu*original.duration);assert(!recipes[row.batch]&&!nativeRecipes[row.batch]&&!boardRecipes[row.batch]);boardRecipes[row.batch]=batch;
 }
 assert.equal(p.routes.length,source.routes.length,'Partial component production migration');return {recipes,nativeRecipes,boardRecipes};
}
