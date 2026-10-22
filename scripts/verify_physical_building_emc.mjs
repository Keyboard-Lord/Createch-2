import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const units=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_form_units.json'));
const eligibility=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_eligibility.json'));
const reviewed=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json'));
const table=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json'));
const excluded=new Set(eligibility.itemGroups.physical_material_forms.items),checked=[];
const installed=(provider,resource,expected)=>{const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',provider),resource],{encoding:'utf8'}).replace(/^\uFEFF/,''));if(expected)assert.deepEqual(d,expected,'Native building units changed '+resource);return d;};
const noPrice=id=>{assert(excluded.has(id),'Physical building form lacks explicit eligibility exclusion');assert(!Object.hasOwn(reviewed.values,id),'Physical building form regained a reviewed price');assert.equal(table.values[id]??0,0,'Physical building form regained EMC');};
for(const block of units.platedBlocks.filter(b=>b.buildingVariants.length)){
 assert.equal(block.physicalMetalUnits,100);assert.equal(block.ordinaryMetalUnits,900);
 const forming=installed(block.forming.provider??block.heating.provider,block.forming.resource,block.forming.payload);
 assert.deepEqual(forming.pattern,[' SH','SWS',' S ']);assert.deepEqual(forming.key.S,{tag:'c:sheets/'+block.material});assert.equal(forming.result.id,block.physicalBlock);assert.equal(forming.result.count,8);
 const sheet=units.forms.find(f=>f.material===block.material);assert(sheet);assert.equal(sheet.sheetMetalUnits,200);assert.equal(4*sheet.sheetMetalUnits,8*block.physicalMetalUnits);
 for(const variant of block.buildingVariants){
  const original=installed(block.heating.provider,variant.resource,variant.payload),item=original.result.id;
  assert.deepEqual(original.key.B,{tag:'c:storage_blocks/'+block.material});
  const id=variant.resource.split('/')[1]+':'+variant.resource.split('/recipe/')[1].slice(0,-5),actual=read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));delete actual._generated_by;
  const patched=structuredClone(original);patched.key.B={tag:'c:plated_blocks/'+block.material};assert.deepEqual(actual,patched,'Physical crafting rebound changed more than the block tag');
  const paid=[...original.pattern.join('')].filter(c=>c==='B').length*100,unitsPerItem=paid/original.result.count;
  const kind=/\/metal\/(slab|stairs)\//.exec(variant.resource)?.[1]??(item.endsWith('_slab')?'slab':item.endsWith('_stairs')?'stairs':null);
  assert(kind,'Unknown physical building variant');assert.equal(unitsPerItem,kind==='slab'?50:75);
  const heatResource=variant.resource.replace('/crafting/','/heating/'),heat=installed(block.heating.provider,heatResource);
  assert.equal(heat.type,'tfc:heating');assert.deepEqual(heat.ingredient,{item});assert.equal(heat.result_fluid.amount,unitsPerItem);assert.equal(heat.result_fluid.id,block.heating.payload.result_fluid.id);
  noPrice(item);checked.push({item,material:block.material,metalUnits:unitsPerItem,forming:id,heating:heatResource});
 }
}
assert.equal(checked.length,40);assert.equal(new Set(checked.map(r=>r.item)).size,40);
for(const [item,value]of Object.entries(reviewed.provenance.removedPhysicalBuildingPrices)){assert(checked.some(r=>r.item===item));assert(value>0);}
assert.equal(Object.keys(reviewed.provenance.removedPhysicalBuildingPrices).length,26);
const compiled=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json')),weathered=[];
for(const form of units.physicalConstructionVariants??[]){
 const d=installed(form.heating.provider,form.heating.resource,form.heating.payload);
 assert.deepEqual(d.ingredient,{item:form.item});assert.equal(d.result_fluid.amount,form.physicalMetalUnits);assert([100,50,75].includes(form.physicalMetalUnits));
 assert.deepEqual(compiled.physicalConstructionVariants.find(v=>v.item===form.item),{material:form.material,item:form.item,physicalMetalUnits:form.physicalMetalUnits,heating:form.heating.recipe,moltenFluid:d.result_fluid.id});
 noPrice(form.item);weathered.push({item:form.item,material:form.material,metalUnits:form.physicalMetalUnits,heating:form.heating.recipe});
}
assert.equal(weathered.length,65);for(const [item,value]of Object.entries(reviewed.provenance.removedWeatheredConstructionPrices)){assert(weathered.some(r=>r.item===item));assert(value>0);}assert.equal(Object.keys(reviewed.provenance.removedWeatheredConstructionPrices).length,45);
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const declared=Object.entries(native.recipes).filter(([id])=>/^tfc:heating\/metal\/(exposed|weathered|oxidized)_block\//.test(id)).map(([,versions])=>versions[0].data.ingredient.item);
assert.deepEqual(new Set(weathered.filter(v=>/^tfc:metal\/(exposed|weathered|oxidized)_block\//.test(v.item)).map(v=>v.item)),new Set(declared),'An existing native weathered form remains outside the measured boundary');
const alreadyChecked=new Set(checked.map(r=>r.item));checked.push(...weathered.filter(r=>!alreadyChecked.has(r.item)));

// Exercise the shipped ProjectE event with a poisoned explicit table too.
const ordinary='minecraft:iron_ingot',ids=[...checked.map(r=>r.item),ordinary].map(id=>({toString:()=>id,getNamespace:()=>id.split(':')[0]}));
const registry={keySet:()=>({iterator:()=>{let i=0;return {hasNext:()=>i<ids.length,next:()=>ids[i++]};}}),get:id=>String(id)};
const script=fs.readFileSync(path.join(liveRoot,'kubejs/server_scripts/resources/projecte_authority.js'),'utf8');
function run(policy){let handler;vm.runInNewContext(script,{ServerEvents:{recipes(){}},ProjectEEvents:{setEMC:f=>handler=f},Java:{loadClass:()=>({ITEM:registry})},JsonIO:{read:()=>policy},console:{info(){}}});assert(handler);const result=new Map(ids.map(id=>[String(id),999999]));handler({setEMCAfter:(id,value)=>result.set(String(id),value)});return result;}
for(const policy of [table,{...table,values:{...table.values,...Object.fromEntries(checked.map(r=>[r.item,8192]))}}]){const result=run(policy);for(const {item}of checked)assert.equal(result.get(item),0,'Runtime event accepts physical building EMC');assert.equal(result.get(ordinary),table.values[ordinary]);}
const report={truth:'STATIC_EXPLICIT_PHYSICAL_BUILDING_EMC',checked,excludedForms:checked.length,removedReviewedPrices:reviewed.provenance.removedPhysicalBuildingPrices,removedWeatheredConstructionPrices:reviewed.provenance.removedWeatheredConstructionPrices,poisonedMappingCases:checked.length,ordinaryControl:ordinary,limits:['Forty reviewed basic building variants and all sixty-three current native TFC weathered physical forms only; no name-based exclusion of future blocks.','100-unit construction blocks, 50-unit slabs and 75-unit stairs remain distinct from 900-unit storage blocks. Native forming/heating and shipped ingredient rebound prove the units.','The shipped event is exercised offline. Actual weathering, ProjectE mappings, learning, research and loaded recipe manager require runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/physical-building-emc-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({physicalVariants:checked.length,weatheredVariants:declared.length,measuredConstructionVariants:weathered.length,removedReviewedPrices:Object.keys(reviewed.provenance.removedPhysicalBuildingPrices).length+Object.keys(reviewed.provenance.removedWeatheredConstructionPrices).length,poisonedMappingCases:checked.length}));
