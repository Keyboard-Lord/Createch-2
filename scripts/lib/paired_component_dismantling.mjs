import assert from 'node:assert/strict';

export function gtBuilderItem(value){
 assert.equal(typeof value,'string');const m=/^(?:(\d+)x\s+)?(#?)([a-z0-9_.-]+:[a-z0-9_./-]+)$/.exec(value);assert(m,'Unreviewed native builder item syntax');
 const amount=Number(m[1]??1);assert(Number.isSafeInteger(amount)&&amount>0);return {[m[2]?'tag':'item']:m[3],amount};
}

// Refund selected actual inputs. No nested material value is inferred.
export function pairedComponentDismantling(policy){
 assert.equal(policy.inputCount,2);assert.equal(policy.maximumComponentRecovery,0.5);
 assert.equal(policy.unpackerEvidence.itemInputs,1);assert.equal(policy.unpackerEvidence.itemOutputs,2);
 if(policy.silverPlateCompatibility){
  const s=policy.silverPlateCompatibility;assert.equal(s.tag,'c:plates/silver');assert.equal(s.units,100);assert.equal(s.canonical,'modern_industrialization:silver_plate');assert(s.physicalExcluded.includes('tfc:metal/sheet/silver'));
  assert.deepEqual(policy.tagRefunds[s.tag],{item:s.canonical,minimumMetalUnits:100,physicalExclusion:'tfc:metal/sheet/silver'});
 }
 const recipes={},bills={};
 for(const row of policy.routes){
  const native=policy.runtimeProducerDeclarations?.[row.producer];const d=native??policy.producerSnapshots[row.producer];assert(d,'Missing owned dismantling producer');let inputs;
  if(native){
   assert(['assembler','assembly_line'].includes(native.type));assert.deepEqual(native.itemOutputs.map(gtBuilderItem),[{item:row.item,amount:1}]);assert.equal(native.outputFluids.length,0);
   inputs=native.itemInputs.map(gtBuilderItem);
  }else if(d.type==='minecraft:crafting_shaped'){
   assert.deepEqual(d.result,{id:row.item,count:1});inputs=[...d.pattern.join('')].filter(c=>c!==' ').map(c=>d.key[c]);
  }else{
   assert.equal(d.type,'modern_industrialization:assembler');assert.deepEqual(d.item_outputs,[{item:row.item,amount:1}]);inputs=d.item_inputs;
  }
  const paid={};for(const i of inputs){assert(i);if(i.probability===0)continue;assert(i.probability===undefined||i.probability===1,'Stochastic component funding');const amount=i.amount??1;assert(Number.isSafeInteger(amount)&&amount>0);const item=i.item??policy.tagRefunds[i.tag]?.item;if(item)paid[item]=(paid[item]??0)+amount;}
  assert(row.outputs.length>0&&row.outputs.length<=policy.unpackerEvidence.itemOutputs);const seen=new Set();
  for(const o of row.outputs){assert(!seen.has(o.item));seen.add(o.item);assert(Number.isSafeInteger(o.amount)&&o.amount>0&&o.amount<=64);assert(paid[o.item]>0,'Unpaid dismantling component');assert(o.amount<=paid[o.item]*policy.inputCount*policy.maximumComponentRecovery,'Dismantling exceeds paid half-component limit');}
  assert(!recipes[row.recovery]);recipes[row.recovery]={type:'modern_industrialization:unpacker',eu:2,duration:200*policy.inputCount,item_inputs:[{item:row.item,amount:policy.inputCount}],item_outputs:row.outputs};bills[row.item]=paid;
 }
 return {recipes,bills};
}
