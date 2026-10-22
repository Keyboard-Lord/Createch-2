import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot, developmentRoot} from './lib/live_paths.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const tags=staticBulkReplicationPolicy(liveRoot,native);
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const forms=[];
for(const[k,field]of [['fineDusts','physicalDust'],['physicalFoils','physicalFoil'],['lightWires','physicalWire'],['physicalFasteners','physicalItem']])
 for(const r of source[k])forms.push({material:r.material,kind:k,item:r[field],ordinaryTag:r.ordinaryTag,physicalTag:r.physicalTag,provider:r.heating.provider});
for(const r of source.industrialGears.filter(r=>r.heavyHeating))for(const item of r.heavyItems.filter(i=>i.startsWith('tfc_items:')))forms.push({material:r.material,kind:'industrialGears',item,ordinaryTag:r.ordinaryTag,physicalTag:r.heavyTag,provider:r.heavyHeating.provider});
const newRows=source.physicalHeatDefinitions;
assert.equal(newRows.length,135);
assert.deepEqual(contract.physicalHeatDefinitions,newRows.map(({material,kind,item,ordinaryTag,physicalTag,provider,resource})=>({material,kind,item,ordinaryTag,physicalTag,provider,resource})));
const oldRows=source.moltenProviderHandoffs.flatMap(r=>r.physicalHeatDefinitions.map(p=>{
 const f=forms.find(f=>f.physicalTag===p.physicalTag);assert(f);return {...f,...p};
}));
const all=[...newRows,...oldRows],ids=new Set(all.map(r=>r.resource));
assert.equal(all.length,139);assert.equal(ids.size,139);
const matches=(value,item)=>Array.isArray(value)?value.some(v=>matches(v,item)):
 value?.item===item||value?.tag&&tags.hasTag(value.tag,item)||value?.type==='neoforge:compound'&&value.children.some(v=>matches(v,item));
const tagRefs=v=>Array.isArray(v)?v.flatMap(tagRefs):v&&typeof v==='object'?Object.entries(v).flatMap(([k,x])=>k==='tag'?[x]:tagRefs(x)):[];
let negativeCases=0;
function definition(row,data){
 const baseline=structuredClone(data);baseline.ingredient=row.payload.ingredient;
 assert.deepEqual(baseline,row.payload,'Heat capacity, forging/welding or other native fields changed');
 const original=Array.isArray(row.payload.ingredient)?row.payload.ingredient:[row.payload.ingredient];
 assert.deepEqual(data.ingredient,[...original,{tag:row.physicalTag}],'Unreviewed definition membership change');
 assert(!matches(row.payload.ingredient,row.item),'Pinned native definition still matches isolated item');
 assert(matches(data.ingredient,row.item),'Restored definition misses isolated item');
}
for(const row of all){
 const f=forms.find(f=>f.item===row.item&&f.ordinaryTag===row.ordinaryTag&&f.physicalTag===row.physicalTag);assert(f,'Definition outside reviewed unit isolation');
 assert(tags.hasTag(row.physicalTag,row.item));assert(!tags.hasTag(row.ordinaryTag,row.item));
 assert(tagRefs(row.payload.ingredient).includes(row.ordinaryTag));
 const data=read(path.join(liveRoot,'kubejs',row.resource));definition(row,data);
 for(const change of [d=>d.ingredient=d.ingredient.filter(i=>i.tag!==row.physicalTag),d=>d.heat_capacity+=1]){
  const bad=structuredClone(data);change(bad);assert.throws(()=>definition(row,bad));negativeCases++;
 }
}
// Independent current-provider census: only definitions that explicitly used a
// removed ordinary tag are in this contract. Do not infer runtime heat selection.
const py='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const script=`import json,sys,zipfile,pathlib
root=pathlib.Path(sys.argv[1]);rows=[]
for provider in json.loads(sys.argv[2]):
 with zipfile.ZipFile(root/'mods'/provider)as z:
  for resource in z.namelist():
   if '/tfc/item_heat/'in resource and resource.endswith('.json'):
    rows.append({'provider':provider,'resource':resource,'payload':json.loads(z.read(resource).decode('utf-8-sig'))})
print(json.dumps(rows))`;
const providers=[...new Set(forms.map(r=>r.provider))].sort();
const inventory=JSON.parse(execFileSync(py,['-c',script,liveRoot,JSON.stringify(providers)],{encoding:'utf8',maxBuffer:8*1024*1024}));
const census=new Set();
for(const d of inventory)for(const f of forms){
 if(!tagRefs(d.payload.ingredient).includes(f.ordinaryTag))continue;
 assert(!matches(d.payload.ingredient,f.item));
 census.add(d.resource);
 const pin=all.find(r=>r.resource===d.resource);assert(pin,'Unreviewed native heat-definition gap');
 assert.equal(pin.provider,d.provider);assert.deepEqual(pin.payload,d.payload);
}
assert.deepEqual(census,ids);
const byKind={};for(const row of all)byKind[row.kind]=(byKind[row.kind]??0)+1;
const report={truth:'STATIC_PHYSICAL_HEAT_DEFINITION_MEMBERSHIP',newDefinitions:135,previousConstantanDefinitions:4,
 totalDefinitions:139,providers:providers.length,nativeDefinitionsInspected:inventory.length,byKind,negativeCases,
 capacitiesChanged:0,forgingOrWeldingValuesChanged:0,recoveryAmountsChanged:0,
 limits:['Coverage is the existing isolated small-form and standard/heavy-gear set and native definitions explicitly referencing its removed ordinary tags; arbitrary custom/dynamic heat definitions are outside this proof.',
 'Current tag replay proves definition membership; loaded definition selection, heat/forge operation, NBT and temperature remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/physical-heat-membership-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({newDefinitions:135,totalDefinitions:139,negativeCases,providers:providers.length}));
