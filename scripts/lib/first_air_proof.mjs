import assert from 'node:assert/strict';
import {selectTfcStartupHardwareSuppliers} from './first_tfc_startup_hardware_proof.mjs';
import {recipeOutputRefs,refLabel} from './recipe_dependency_refs.mjs';

export function selectFirstAirSuppliers({contract,hardware,leather,recipes,frontier,tagMembers}){
 assert.equal(contract.truth,'STATIC_NATIVE_FIRST_TFMG_AIR');
 const selected=selectTfcStartupHardwareSuppliers({contract:hardware,leather,recipes,frontier,tagMembers}),allowed=new Map(selected.allowed);
 for(const k of ['waterWheel','largeCog']){const id=contract.ids[k];for(const ref of recipeOutputRefs(contract.recipes[id]))allowed.set(refLabel(ref),new Set([id]));}
 allowed.set('capability:first_air_drive',new Set(['native:first_air_drive']));allowed.set('fluid:tfmg:air',new Set(['native:first_air']));
 // Earlier workshop operations may use the existing paid rotary service. It
 // must be derived from manufactured hardware, never inherited as free power.
 allowed.set('capability:kinetic_power',new Set(['native:kinetic_service']));
 const forbidden=new Set([...selected.forbidden,'fluid:tfmg:hot_air','fluid:tfmg:furnace_gas']);
 const excluded=new Set([...allowed.keys(),...forbidden]),seed=new Map([...selected.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x)))));
 const baseRules=selected.baseRules,rules=baseRules.map(r=>({...r,outputs:r.outputs.filter(out=>!forbidden.has(out)&&(!allowed.has(out)||allowed.get(out).has(r.id)))}));
 return {allowed,forbidden,seed,rules,baseRules};
}

export function firstAirProof({contract,hardware,leather,recipes,frontier,solve,tagMembers,locks}){
 const {allowed,forbidden,seed,rules}=selectFirstAirSuppliers({contract,hardware,leather,recipes,frontier,tagMembers});
 const targets=['create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:large_andesite_alloy_cogwheel','tfmg:air_intake','capability:first_air_drive','fluid:tfmg:air'],solved=solve(rules,seed),missing=targets.filter(id=>!solved.reached.has(id)),leaves=e=>solved.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_NATIVE_FIRST_TFMG_AIR':'BOUNDED_NATIVE_FIRST_TFMG_AIR',targets,missing,missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),researchOwners:Object.fromEntries(Object.values(contract.ids).map(id=>[id,locks.get(id)??[]])),selectedSources:Object.fromEntries([...allowed].map(([out,ids])=>[out,[...ids]])),earlierWorkshopBoundary:Object.fromEntries([...seed].filter(([id])=>['minecraft:iron_ingot','#c:plates/iron','#c:plates/andesite_alloy','#c:plates/cast_iron','#c:ingots/cast_iron','tfc:wood/lumber/oak','fluid:minecraft:water'].includes(id))),quantityPlan:contract.quantityPlan,excludedShortcuts:[...forbidden],negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 const reject=(name,{outputs=[],ids=[]}={})=>{const absent=new Set(outputs),removed=new Set(ids),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(out=>!absent.has(out))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has('fluid:tfmg:air'),'First air bypasses '+name);result.negativeCases.push({name,rejected:true});};
 for(const out of ['tfmg:air_intake','create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:large_andesite_alloy_cogwheel','create:andesite_bars','create:industrial_iron_block','create:propeller','minecraft:stonecutter','tfc:rock/raw/quartzite','fluid:minecraft:water','capability:first_air_drive','capability:terrestrial_prospecting'])reject('no_'+out,{outputs:[out]});
 for(const k of ['intake','waterWheel','shaft','cog','largeCog','stonecutter','bars','ironBlock','propeller'])reject('no_selected_'+k,{ids:[contract.ids[k]]});
 result.noInheritedAirDriveOrSelectedHardware=true;result.noSteelElectricOrOffworld=true;return result;
}
