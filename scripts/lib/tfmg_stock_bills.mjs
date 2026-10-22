import assert from 'node:assert/strict';

// Current primary steel only. Weighted sequence outputs select one result;
// their chance values never multiply stock or imply independent outputs.
export function tfmgStockBills(policy,motorSteel){
 const snapshots=policy.producerSnapshots,roots=new Map(policy.roots.map(r=>[r.item??'#'+r.tag,r.units])),values={};
 const output=(d,item)=>{const o=[d.result??d.results??d.item_outputs].flat().find(o=>(o.id??o.item)===item);assert(o,'Missing TFMG output '+item);return o.count??o.amount??1;};
 const value=i=>roots.get(i.item??'#'+i.tag)??values[i.item]??(i.item==='modern_industrialization:motor'?motorSteel:0);
 function paid(d){
  if(d.type==='minecraft:crafting_shapeless')return d.ingredients.reduce((n,i)=>n+value(i)*(i.count??1),0);
  if(d.type==='create:item_application')return d.ingredients.reduce((n,i)=>n+value(i)*(i.count??1),0);
  if(d.type==='modern_industrialization:assembler')return d.item_inputs.filter(i=>i.probability!==0).reduce((n,i)=>n+value(i)*i.amount,0);
  assert.equal(d.type,'create:sequenced_assembly');const loops=d.loops??policy.nativeAssembly.defaultLoops;assert(Number.isSafeInteger(loops)&&loops>0);
  let units=value(d.ingredient),transitional=d.transitional_item.id;
  for(const step of d.sequence)for(const i of step.ingredients??[]){if(i.item===transitional||i.fluid||i.type==='neoforge:single')continue;units+=value(i)*(i.count??1)*loops;}
  return units;
 }
 for(const row of policy.rows){const candidates=row.primaryProducers.map(id=>{const d=snapshots[id];assert(d,'Missing primary TFMG producer '+id);return paid(d)/output(d,row.item);});const minimum=Math.min(...candidates);assert(minimum>0,'Unmeasured TFMG primary steel stock');assert.equal(minimum,row.minimumSteelUnits);values[row.item]=minimum;}
 const checkedReturns=[];for(const id of policy.returnRecipes){const d=snapshots[id];assert(d,'Missing TFMG return producer');const budget=paid(d);for(const o of d.results??[]){const units=values[o.id]??roots.get(o.id);if(units){assert(units*(o.count??1)<=budget,'Unfunded sequenced TFMG return '+id);checkedReturns.push({recipe:id,item:o.id,paidSteelUnits:budget,returnedSteelUnits:units*(o.count??1)});}}}
 return {values,checkedReturns};
}
