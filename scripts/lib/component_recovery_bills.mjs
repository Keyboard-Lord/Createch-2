import assert from 'node:assert/strict';
import {machineryRecovery} from './machinery_recovery_units.mjs';
import {primaryGreateMetalRecovery} from './greate_recovery_units.mjs';
import {tfmgStockBills} from './tfmg_stock_bills.mjs';

// Minimum primary stock in explicitly reviewed native forming routes. Fluids
// and unrelated ingredients do not acquire inferred metal value.
export function nativeMaterialStock(policy){
 const roots=new Map(policy.roots.map(r=>[r.item??'#'+r.tag,r.units])),forms=new Map(policy.forms.map(r=>[r.item,r])),cache=new Map();
 function value(item,seen=new Set()){
  if(roots.has(item))return roots.get(item);assert(!seen.has(item),'Native stock cycle '+item);if(cache.has(item))return cache.get(item);
  const row=forms.get(item);assert(row,'Missing native stock '+item);const totals=row.producerIds.map(id=>{
   const p=policy.producerSnapshots[id];assert(p,'Missing native stock producer '+id);let inputs,output;
   if(p.type==='minecraft:crafting_shaped'){inputs=[...p.pattern.join('')].filter(c=>c!==' ').map(c=>p.key[c]);output={item:p.result.id,count:p.result.count??1};}
   else if(p.type==='minecraft:crafting_shapeless'){inputs=p.ingredients;output={item:p.result.id,count:p.result.count??1};}
   else if(p.type==='minecraft:smelting'){inputs=[p.ingredient];output={item:p.result.id,count:p.result.count??1};}
   else if(p.type==='modern_industrialization:forge_hammer'){inputs=[{...p.ingredient,amount:p.count??1}];output={item:p.result.id,count:p.result.count??1};}
   else if(p.type==='greate:cutting'){inputs=p.ingredients;assert.equal(p.results.length,1);output={item:p.results[0].id,count:p.results[0].count??1};}
   else{assert(/^(modern_industrialization:(cutting_machine|compressor|packer|assembler|wiremill|polarizer)|extended_industrialization:bending_machine)$/.test(p.type));inputs=p.item_inputs;const outputs=Array.isArray(p.item_outputs)?p.item_outputs:[p.item_outputs];assert.equal(outputs.length,1);output={item:outputs[0].item,count:outputs[0].amount};}
   assert.equal(output.item,item);assert(Number.isSafeInteger(output.count)&&output.count>0);let total=0;
   for(const i of inputs){assert(i);if(i.probability===0)continue;assert(i.probability===undefined||i.probability===1);const count=i.amount??1;assert(Number.isSafeInteger(count)&&count>0);if((policy.untrackedInputs??[]).includes(i.item??'#'+i.tag))continue;total+=value(i.item??'#'+i.tag,new Set(seen).add(item))*count;}
   return total/output.count;
  });const result=Math.min(...totals);assert(result>0);cache.set(item,result);return result;
 }
 return Object.fromEntries(policy.forms.map(r=>[r.item,value(r.item)]));
}

// Count only reviewed stock and explicit current-component inheritance.
export function componentRecoveryBills(source,ledger){
 const embedded=source.miMotionRecovery?.routes??[];
 const hulls=source.miHullRecovery?.routes??[];
 const machines=source.miElectricMachineRecovery?.routes??[];
 const processes=source.miProcessRecovery?.routes??[];
 const producers=new Map([...source.routes,...embedded,...hulls,...machines,...processes].map(r=>[r.item,r])),tracked=new Map((source.trackedInputs??[]).map(r=>[r.item,r])),cache=new Map(),seeds=new Map();
 const tagged=new Map((source.trackedInputs??[]).filter(r=>r.rootTag).map(r=>[r.rootTag,{material:r.material,trackedUnits:100/r.nativeRod.data.result.count}]));
 for(const gear of ledger.industrialGears??[])tagged.set(gear.ordinaryTag,{material:gear.material,trackedUnits:gear.ordinaryMetalUnits});
 for(const wire of source.motionWireStock?.items??[]){assert.equal(wire.material,'copper');assert(wire.units>0);tracked.set(wire.item,{material:'copper',trackedUnits:wire.units});}
 assert.equal(producers.size,source.routes.length+embedded.length+hulls.length+machines.length+processes.length,'Duplicate component producer');
 for(const stock of source.miProcessRecovery?.materialStock??[]){for(const r of stock.roots)if(r.tag)tagged.set(r.tag,{material:stock.material,trackedUnits:r.units});for(const [item,units]of Object.entries(nativeMaterialStock(stock)))seeds.set(item,{[stock.material]:units});}
 if(source.tinMotionStock)for(const [item,units]of Object.entries(nativeMaterialStock(source.tinMotionStock)))seeds.set(item,{tin:units});
 function parts(recipe,item){
  if(recipe.type==='minecraft:crafting_shaped'){
   const count=recipe.result.count??1;assert.equal(recipe.result.id,item);assert(Number.isSafeInteger(count)&&count>0);
   return {inputs:[...recipe.pattern.join('')].filter(c=>c!==' ').map(c=>{assert(recipe.key[c],'Missing component recipe symbol');return recipe.key[c];}),count};
  }
  assert.equal(recipe.type,'modern_industrialization:assembler');assert.equal(recipe.item_outputs.length,1);assert.equal(recipe.item_outputs[0].item,item);assert(Number.isSafeInteger(recipe.item_outputs[0].amount)&&recipe.item_outputs[0].amount>0);
  return {inputs:recipe.item_inputs,count:recipe.item_outputs[0].amount};
 }
 for(const stock of [...(source.miHullRecovery?.stockInputs??[]),...(source.miElectricMachineRecovery?.stockInputs??[]),...(source.miProcessRecovery?.stockInputs??[])]){
  assert(!seeds.has(stock.item)&&!producers.has(stock.item),'Duplicate reviewed stock');let units;
  if(stock.kind==='reviewedMachinery'){
   const p=source.machineryRecovery.find(p=>p.material===stock.material);assert(p);const vector=machineryRecovery(p,ledger).materialBills[stock.item];assert(vector);seeds.set(stock.item,vector);continue;
  }else if(stock.kind==='reviewedGreate'){
   const p=source[stock.policy];assert.equal(p.material,stock.material);units=primaryGreateMetalRecovery(p).bill(stock.item)/p.materialUnitDenominator;
  }else{
   assert.equal(stock.kind,'nativeLargePlate');const {inputs,count}=parts(stock.forming.data,stock.item),plate=ledger.forms.find(f=>f.material===stock.material);assert.equal(count,1);assert.equal(plate.plateMetalUnits,100);units=0;
   for(const input of inputs){assert(input.item===plate.plate||input.tag==='c:plates/'+stock.material,'Unreviewed large-plate stock');units+=100*(input.amount??1);}
  }
  assert(units>0,'Unmeasured reviewed stock');seeds.set(stock.item,{[stock.material]:units});
 }
 function bill(item,visiting=new Set()){
  assert(!visiting.has(item),'Component inheritance cycle: '+item);if(cache.has(item))return cache.get(item);
  const route=producers.get(item);assert(route,'Missing component producer '+item);
  const isEmbedded=embedded.includes(route),isMachine=machines.includes(route),isProcess=processes.includes(route),variants=isEmbedded||isMachine||isProcess?route.producerIds.map(id=>{const p=(isEmbedded?source.miMotionAuthority:isMachine?source.miElectricMachineRecovery:source.miProcessRecovery).producerSnapshots[id];assert(p,'Missing embedded component producer '+id);return p;}):[route.producerPayload],results=[];
  for(const recipe of variants){const {inputs,count}=parts(recipe,item),result={};
  for(const input of inputs){
   const amount=input.amount??1;assert(Number.isSafeInteger(amount)&&amount>0);if(input.probability===0)continue;assert(input.probability===undefined||input.probability===1,'Stochastic component bill');
   const form=ledger.forms.find(f=>f.plate===input.item||input.item===`modern_industrialization:${f.material}_plate`||input.tag==='c:plates/'+f.material),stock=tracked.get(input.item);
   const tagStock=tagged.get(input.tag);
   const cable=(route.trackedCableItems??[]).includes(input.item)?ledger.reviewedCableUnits.find(r=>r.item===input.item):undefined;
   if((route.trackedCableItems??[]).includes(input.item))assert(cable&&cable.stockUnits>0,'Missing reviewed conductor stock '+input.item);
   if(form&&!isEmbedded)result[form.material]=(result[form.material]??0)+form.plateMetalUnits*amount;
   else if(cable)result[cable.material]=(result[cable.material]??0)+cable.stockUnits*amount;
   else if(stock){assert(stock.trackedUnits>0);result[stock.material]=(result[stock.material]??0)+stock.trackedUnits*amount;}
   else if(tagStock)result[tagStock.material]=(result[tagStock.material]??0)+tagStock.trackedUnits*amount;
   else if(seeds.has(input.item))for(const [material,units]of Object.entries(seeds.get(input.item)))result[material]=(result[material]??0)+units*amount;
   else if(producers.has(input.item))for(const [material,units]of Object.entries(bill(input.item,new Set(visiting).add(item))))result[material]=(result[material]??0)+units*amount;
  }
  assert(Object.keys(result).length,'Unmeasured component '+item);for(const material of Object.keys(result))result[material]/=count;
  if(isEmbedded)assert(Object.keys(result).every(m=>(source.miMotionRecovery.primaryMaterials??['steel']).includes(m)),'Unreviewed embedded material');results.push(result);
  }
  const materials=[...new Set(results.flatMap(r=>Object.keys(r)))],minimum=Object.fromEntries(materials.map(m=>[m,Math.min(...results.map(r=>r[m]??0))]).filter(([,v])=>v>0));
  assert(Object.keys(minimum).length,'No shared paid component stock '+item);cache.set(item,minimum);return minimum;
 }
 if(source.tfmgStockRecovery)for(const [item,units]of Object.entries(tfmgStockBills(source.tfmgStockRecovery,bill('modern_industrialization:motor').steel).values))seeds.set(item,{steel:units});
 return Object.fromEntries([...embedded,...hulls,...machines,...processes,...source.routes].map(row=>[row.item,bill(row.item)]));
}

// Utility alternatives use a conservative native casing constituent, not an
// inferred complete GT machine mass. Extra hull plates/cables remain uncounted.
export function nativeUtilityRecovery(source,ledger){
 const p=source.nativeDismantling.utilityStock;
 assert.equal(p.maximumTrackedRecovery,0.5);assert.equal(p.inputCount,1);
 assert.deepEqual(p.processing,{type:'modern_industrialization:macerator',eu:2,duration:400});
 assert.equal(p.nativeCaseUnits.length,2);assert.equal(p.rows.length,2);
 assert.equal(p.nativeDeclarations.maintenance.hullTier,1);assert.equal(p.nativeDeclarations.maintenance.hullAmount,1);
 assert.equal(p.nativeDeclarations.maintenance.circuitSelector,8);assert.equal(p.nativeDeclarations.maintenance.duration,100);
 assert.deepEqual(p.nativeDeclarations.cleanroom.pattern,['FFF','RHR','MCM']);assert.equal(p.nativeDeclarations.cleanroom.symbolicInputs.H,'GTCraftingComponents.HULL.get(3)');
 const expected={lv:{item:'gtceu:lv_machine_casing',hull:'gtceu:lv_machine_hull',tier:1,material:'steel'},hv:{item:'gtceu:hv_machine_casing',hull:'gtceu:hv_machine_hull',tier:3,material:'stainless_steel'}};
 const bills=componentRecoveryBills(source,ledger),recipes={},stock={};
 for(const c of p.nativeCaseUnits){
  const e=expected[c.key];assert(e);for(const[k,v]of Object.entries(e))assert.equal(c[k],v);
  assert.equal(c.plateCount,8);assert.equal(c.outputCount,1);assert.equal(c.knownStockUnits,800);
  const measured=ledger.reviewedNativeMachineCasings.find(r=>r.item===c.item);assert.deepEqual(measured,Object.fromEntries(['item','material','tier','plateCount','outputCount','knownStockUnits'].map(k=>[k,c[k]])));
  const form=ledger.forms.find(f=>f.material===c.material);assert.equal(form.plateMetalUnits,100);assert.equal(form.sheetMetalUnits,200);
  assert.equal(c.plateCount*form.plateMetalUnits/c.outputCount,c.knownStockUnits);
 }
 for(const row of p.rows){
  const c=p.nativeCaseUnits.find(c=>c.key===row.nativeCase);assert(c);assert.equal(c.material,row.material);assert.equal(row.nativeHullCount,1);
  assert.equal(row.item,row.nativeCase==='lv'?'gtceu:maintenance_hatch':'gtceu:cleanroom');assert.equal(row.gate,'COM-06');assert.equal(row.canonicalDust,'modern_industrialization:'+row.material+'_dust');
  const d=row.producerSnapshot;assert.equal(d.type,'minecraft:crafting_shaped');assert.deepEqual(d.result,{id:row.item,count:1});assert.deepEqual(row.producerResearchGates,[]);
  const inputs=[...d.pattern.join('')].filter(c=>c!==' ').map(c=>d.key[c]);
  assert.equal(new Set(row.trackedOwnComponents).size,row.trackedOwnComponents.length);
  const own=row.trackedOwnComponents.reduce((total,item)=>{assert(bills[item]?.[row.material]>0);const count=inputs.filter(i=>i.item===item).length;assert(count>0);return total+count*bills[item][row.material];},0);
  const native=c.knownStockUnits*row.nativeHullCount,minimum=Math.min(own,native),count=Math.floor(minimum*p.maximumTrackedRecovery/100);assert(count>0&&count<=64);assert(!recipes[row.recovery]);
  recipes[row.recovery]={...p.processing,item_inputs:[{item:row.item,amount:p.inputCount}],item_outputs:[{item:row.canonicalDust,amount:count}]};
  stock[row.item]={material:row.material,authoredKnownUnits:own,nativeCasingKnownUnits:native,minimumKnownUnits:minimum,recoveredUnits:count*100};
 }
 return {recipes,stock};
}
