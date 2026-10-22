import assert from 'node:assert/strict';
import {primaryGreateMetalRecovery} from './greate_recovery_units.mjs';
export function tfmgPumpRecovery(source){
 const p=source.tfmgPumpCompatibility,r=p.recycling,d=p.producerSnapshot;
 assert.equal(r.inputCount,2);assert.equal(r.maximumTrackedRecovery,0.5);assert.equal(d.type,'minecraft:crafting_shaped');assert.deepEqual(d.result,{id:p.item,count:1});
 const counts=new Map();for(const c of d.pattern.join('')){if(c===' ')continue;const i=d.key[c];assert(i);const id=i.item??'#'+i.tag;counts.set(id,(counts.get(id)??0)+1);}
 const cap=source.tfmgElectricRecovery.stockSnapshots.find(w=>w.recipe==='tfmg:sequenced_assembly/capacitor').data;
 assert.deepEqual(cap.ingredient,{tag:'c:plates/steel'});assert.deepEqual(cap.results,[{count:4,id:'tfmg:capacitor_item'}]);
 const loops=cap.loops??source.tfmgStockRecovery.nativeAssembly.defaultLoops,output=cap.results[0].count;let copperPlates=0;
 for(const step of cap.sequence)for(const i of step.ingredients??[])if(i.tag==='c:plates/copper')copperPlates++;
 assert.equal(loops,5);assert.equal(copperPlates,2);const capSteel=100/output,capCopper=copperPlates*100*loops/output;
 assert.equal(r.wireTag,'c:wires/copper');assert.equal(r.wireUnits,50);
 const core=primaryGreateMetalRecovery(source[r.corePolicy]).bill(p.canonicalInput);
 const sixths={steel:core*(counts.get(p.canonicalInput)??0)+capSteel*6*(counts.get('tfmg:capacitor_item')??0),copper:(capCopper*(counts.get('tfmg:capacitor_item')??0)+r.wireUnits*(counts.get('#'+r.wireTag)??0))*6};
 assert(Object.values(sixths).every(v=>Number.isSafeInteger(v)&&v>0));
 const outputs=Object.entries(sixths).map(([m,n])=>({item:'modern_industrialization:'+m+'_dust',amount:Math.floor(n*r.inputCount/1200)}));
 return {sixths,capacitor:{steel:capSteel,copper:capCopper},recipe:{type:'modern_industrialization:macerator',eu:2,duration:400*r.inputCount,item_inputs:[{item:p.item,amount:r.inputCount}],item_outputs:outputs}};
}
