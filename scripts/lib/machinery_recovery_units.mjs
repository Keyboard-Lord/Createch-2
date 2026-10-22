import assert from 'node:assert/strict';

// Extend the existing component-recovery constitution with actual prototype
// inheritance. Opaque controls, pipes and other metals are not guessed.
export function machineryRecovery(policy,units){
 const plate=units.forms.find(f=>f.material===policy.material);
 assert(plate);assert.equal(plate.plate,policy.trackedPlate);assert.equal(plate.plateMetalUnits,100);
 assert.equal(policy.maximumTrackedRecovery,0.5);
 const ingot=policy.trackedIngotStock;
 if(ingot){
  assert.equal(ingot.tag,'c:ingots/'+policy.material);assert.equal(ingot.units,100);
  const d=ingot.nativeCast.data;assert.equal(d.type,'tfc:casting');assert.equal(d.fluid.amount,ingot.units);
  assert.deepEqual(d.mold,{item:'tfc:ceramic/ingot_mold'});assert.equal(d.result.count,1);
  const heat=ingot.nativeHeating.data;assert.equal(heat.type,'tfc:heating');assert.deepEqual(heat.ingredient,{tag:ingot.tag});assert.equal(heat.result_fluid.amount,ingot.units);assert.equal(heat.result_fluid.id,d.fluid.fluid);
 }
 const parts=p=>{
  if(['minecraft:crafting_shaped','create:mechanical_crafting'].includes(p.type))return {
   inputs:[...p.pattern.join('')].filter(c=>c!==' ').map(c=>{assert(p.key[c],'Missing recipe symbol');return p.key[c];}),
   outputs:[{item:p.result.id,amount:p.result.count??1}]
  };
  if(p.type==='minecraft:crafting_shapeless')return {inputs:p.ingredients,outputs:[{item:p.result.id,amount:p.result.count??1}]};
  assert(['modern_industrialization:assembler','modern_industrialization:packer'].includes(p.type));
  return {inputs:p.item_inputs,outputs:p.item_outputs};
 };
 const stocks=new Map([[policy.trackedPlate,plate.plateMetalUnits]]);
 const gear=policy.trackedIndustrialGear;
 if(gear){
  const form=units.industrialGears.find(r=>r.material===policy.material);
  assert(form,'Missing ordinary gear unit authority');
  assert.equal(gear.item,form.ordinaryGear);assert.equal(gear.tag,form.ordinaryTag);
  assert.equal(gear.primaryUnits,form.ordinaryMetalUnits);assert.equal(gear.primaryUnits,200);
  stocks.set(gear.item,gear.primaryUnits);
 }
 for(const stock of policy.stockInputs??[]){
  assert(!stocks.has(stock.item),'Duplicate tracked stock');
  if(stock.kind==='reviewedItemApplication'){
   const d=stock.forming.data;assert.equal(d.type,'create:item_application');assert.deepEqual(d.results,[{id:stock.item}]);
   assert.equal(d.ingredients.filter(i=>i.tag===stock.inputTag).length,1);assert.equal(stock.inputTag,'createch2:industrial_steel');assert.equal(policy.material,'steel');stocks.set(stock.item,100);continue;
  }
  const {inputs,outputs}=parts(stock.forming.data);assert.deepEqual(outputs,[{item:stock.item,amount:1}]);
  let paid=0;for(const input of inputs){assert(input.item===policy.trackedPlate||input.tag==='c:plates/'+policy.material,'Unreviewed composite stock');assert(input.probability===undefined||input.probability===1);const count=input.amount??1;assert(Number.isInteger(count)&&count>0);paid+=plate.plateMetalUnits*count;}
  assert(paid>0);stocks.set(stock.item,paid);
 }
 const byItem=new Map(policy.routes.map(r=>[r.item,r])),bills=new Map();assert.equal(byItem.size,policy.routes.length);
 function bill(item,visiting=new Set()){
  assert(!visiting.has(item),'Machinery inheritance cycle '+item);
  if(bills.has(item))return bills.get(item);
  const row=byItem.get(item),totals=[];
  for(const id of [row.producer,...(row.alternativeProducers??[])]){
   const p=policy.producerSnapshots[id];assert(p,'Missing machinery producer '+item);
   assert(['minecraft:crafting_shaped','minecraft:crafting_shapeless','create:mechanical_crafting','modern_industrialization:assembler'].includes(p.type));
   const {inputs,outputs}=parts(p);
   assert.equal(outputs.length,1,'Unreviewed machinery byproduct');assert.equal(outputs[0].item,item);
   assert(Number.isInteger(outputs[0].amount)&&outputs[0].amount>0);
   let total=0;for(const input of inputs){
    if(input.probability===0)continue;
    assert(input.probability===undefined||input.probability===1,'Stochastic machinery bill');
    const count=input.amount??input.count??1;assert(Number.isInteger(count)&&count>0);
    if(stocks.has(input.item))total+=stocks.get(input.item)*count;
    else if(input.tag==='c:plates/'+policy.material)total+=plate.plateMetalUnits*count;
    else if(ingot&&input.tag===ingot.tag)total+=ingot.units*count;
    else if(gear&&input.tag===gear.tag)total+=gear.primaryUnits*count;
    else if(byItem.has(input.item))total+=bill(input.item,new Set(visiting).add(item))*count;
   }
   assert(total>0,'Unmeasured machinery '+item);totals.push(total/outputs[0].amount);
  }
  const total=Math.min(...totals);bills.set(item,total);return total;
 }
 const supplements=new Map((policy.additionalStockInputs??[]).map(r=>[r.item,r]));
 for(const r of supplements.values()){const d=r.forming.data;assert.equal(d.type,'minecraft:crafting_shaped');assert.deepEqual(d.result,{count:1,id:r.item});const inputs=parts(d).inputs.filter(i=>i.tag===r.rootTag);assert.equal(inputs.length,8);assert.equal(r.rootTag,'c:wires/copper');assert.equal(r.material,'copper');assert.equal(r.rootUnits,50);assert.equal(r.units,inputs.length*r.rootUnits);}
 const extraCache=new Map();function extra(item,seen=new Set()){
  assert(!seen.has(item),'Supplemental machinery inheritance cycle');if(extraCache.has(item))return extraCache.get(item);const row=byItem.get(item),vectors=[];
  for(const id of [row.producer,...(row.alternativeProducers??[])]){const p=policy.producerSnapshots[id],{inputs,outputs}=parts(p),v={};for(const i of inputs){if(i.probability===0)continue;const count=i.amount??1;const r=supplements.get(i.item);if(r)v[r.material]=(v[r.material]??0)+r.units*count;else if(byItem.has(i.item))for(const [m,u]of Object.entries(extra(i.item,new Set(seen).add(item))))v[m]=(v[m]??0)+u*count;}for(const m of Object.keys(v))v[m]/=outputs[0].amount;vectors.push(v);}
  const keys=[...new Set(vectors.flatMap(v=>Object.keys(v)))],v=Object.fromEntries(keys.map(m=>[m,Math.min(...vectors.map(v=>v[m]??0))]).filter(([,u])=>u>0));extraCache.set(item,v);return v;
 }
 const recipes={},materialBills={};for(const row of policy.routes){const paid=bill(row.item);assert.equal(paid,row.trackedBill[policy.material]);const vector={[policy.material]:paid,...extra(row.item)};assert.deepEqual(row.trackedBill,vector);materialBills[row.item]=vector;
  const batch=row.recoveryBatchSize??1;assert(Number.isInteger(batch)&&batch>0);
  const count=Math.floor(paid*batch*policy.maximumTrackedRecovery/100);assert(count>0);
  recipes[row.recovery]={...policy.processing,duration:policy.processing.duration*batch,item_inputs:[{item:row.item,amount:batch}],item_outputs:[{item:policy.canonicalDust,amount:count},...Object.entries(vector).filter(([m])=>m!==policy.material).map(([m,u])=>({item:'modern_industrialization:'+m+'_dust',amount:Math.floor(u*batch/200)}))]};
 }
 return {recipes,bills:Object.fromEntries(bills),materialBills,stockUnits:Object.fromEntries(stocks)};
}
