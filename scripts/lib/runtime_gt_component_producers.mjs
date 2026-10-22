import assert from 'node:assert/strict';
import {gtBuilderItem} from './paired_component_dismantling.mjs';

// Offline filter/accounting view of captured builder arguments, not a GT codec
// payload. Manufacturing remains authored by the original native GT builder.
export function runtimeGtBudgetView(declaration){
 assert(['assembler','assembly_line'].includes(declaration.type));
 return {type:'gtceu:'+declaration.type,item_inputs:declaration.itemInputs.map(gtBuilderItem),item_outputs:declaration.itemOutputs.map(gtBuilderItem)};
}

export function verifyRuntimeGtComponentProducers(policy,captured,source){
 const records=new Map();
 for(const[id,d]of Object.entries(policy.runtimeProducerDeclarations??{})){
  assert.equal(id,'createch2:'+d.type+'/greate_computation/'+d.nativeName);
  const route=source.routes.find(r=>r.nativeName===d.nativeName);
  assert(route,'Missing native computation source');
  // The reviewed host migration preserves the original assembler ID and paid
  // bill. Recycling declarations account for that bill; host authority remains
  // in research_computation and is checked against the actual captured builder.
  const {hostType,...budget}=route;
  assert.deepEqual(d,budget,'Native computation source budget changed');
  const matches=captured.additions.filter(r=>r.id===id);assert.equal(matches.length,1,'Missing/duplicate captured native producer');const actual=matches[0];
  assert.equal(actual.file,'kubejs/server_scripts/compatibility/greate_computation.js');assert.equal(actual.nativeType,'gtceu:'+(hostType??d.type));
  for(const method of ['itemInputs','itemOutputs','inputFluids','outputFluids'])assert.deepEqual(JSON.parse(JSON.stringify(actual.nativeCalls.find(c=>c.method===method)?.args??[])),d[method]);
  for(const[method,value]of [['duration',d.duration],['EUt',d.eu],['cleanroom',d.cleanroom?'cleanroom':undefined]])assert.deepEqual(actual.nativeCalls.find(c=>c.method===method)?.args??[],value===undefined?[]:[value]);
  if(d.research){const callback=actual.nativeCalls.find(c=>c.method==='stationResearch')?.args[0]?.callbackSource;assert(callback&&callback.includes(d.research.item)&&callback.includes('CWUt('+d.research.cwut+')')&&callback.includes('EUt('+d.research.eu+')'));assert(actual.nativeCalls.some(c=>c.method==='setValue'&&c.args[0]==='conditions'));}
  records.set(id,runtimeGtBudgetView(d));
 }
 return records;
}
