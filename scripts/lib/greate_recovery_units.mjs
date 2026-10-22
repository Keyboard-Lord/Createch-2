import assert from 'node:assert/strict';

// Extend the existing recovery ledger with a conservative current-metal bill.
// Sixth-units preserve the native six-shaft plate yield without float rounding.
export function primaryGreateMetalRecovery(policy) {
  assert.equal(policy.materialUnitDenominator,6);assert.equal(policy.plateUnits,100);assert.equal(policy.maximumTrackedRecovery,0.5);
  const output=d=>{const v=d.result??d.results?.[0]??d.item_outputs?.[0];assert(v);return{item:v.id??v.item,count:v.count??v.amount??1};};
  const producers=new Map(Object.entries(policy.producerSnapshots).map(([id,d])=>[output(d).item,{id,d}]));
  const material=policy.material??'neutronium';
  const bill=(item,seen=new Set())=>{
    if(!producers.has(item))return 0;
    assert(!seen.has(item),'Greate recovery inheritance cycle '+item);
    const d=producers.get(item).d;
    const inputs=d.key?Object.entries(d.key).map(([key,input])=>({...input,amount:d.pattern.join('').split(key).length-1})):[].concat(d.ingredients??d.item_inputs??[]);
    let total=0;
    for(const input of inputs){
      if(input.tag==='c:plates/'+material||input.item==='gtceu:'+material+'_plate')total+=600*(input.amount??1);
      else if(input.item)total+=bill(input.item,new Set(seen).add(item))*(input.amount??1);
    }
    const value=total/output(d).count;assert(Number.isSafeInteger(value),'Nonintegral sixth-unit bill '+item);return value;
  };
  const recipes={};
  for(const route of policy.routes){
    assert.equal(producers.get(route.item)?.id,route.producer);
    assert.equal(bill(route.item),route.trackedMetalSixths);
    assert.equal(route.inputCount,Math.ceil(1200/route.trackedMetalSixths));
    const returned=route.returnedDusts??route.returnedIngots;
    assert.equal(returned,Math.floor(route.trackedMetalSixths*route.inputCount/1200));
    assert(returned>0&&route.inputCount<=64);
    const base=policy.conditioningSnapshot;
    recipes[route.recovery]=base?{
      type:base.type,eu:base.eu,duration:base.duration*returned,
      item_inputs:[{item:route.item,amount:route.inputCount}],
      item_outputs:[{item:'gtceu:neutronium_ingot',amount:returned}],
      fluid_inputs:base.fluid_inputs.map(f=>({...f,amount:f.amount*returned})),
      fluid_outputs:base.fluid_outputs.map(f=>({...f,amount:f.amount*returned}))
    }:{type:policy.process.type,eu:policy.process.eu,duration:policy.process.durationPerReturnedUnit*returned,
      item_inputs:[{item:route.item,amount:route.inputCount}],item_outputs:[{item:policy.process.outputItem,amount:returned}]};
  }
  return {recipes,bill};
}
