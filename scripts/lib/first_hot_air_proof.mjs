import assert from 'node:assert/strict';
import {selectFirstAirSuppliers} from './first_air_proof.mjs';
import {recipeOutputRefs,refLabel} from './recipe_dependency_refs.mjs';

export function selectFirstHotAirSuppliers({contract,air,hardware,leather,fuel,recipes,frontier,solve,tagMembers,locks}){
 assert.equal(contract.truth,'STATIC_NATIVE_FINITE_HOT_AIR_PRECHARGE');
 const selected=selectFirstAirSuppliers({contract:air,hardware,leather,recipes,frontier,tagMembers}),allowed=new Map(selected.allowed),forbidden=new Set(selected.forbidden),{ids}=contract;
 for(const[key,id]of Object.entries(ids))if(key!=='coking')for(const ref of recipeOutputRefs(contract.recipes[id]))allowed.set(refLabel(ref),new Set([id]));
 allowed.set('fluid:railcraft:creosote',new Set([ids.coking]));allowed.set('capability:startup_lubricant_oven',new Set(['native:startup_lubricant_oven']));
 for(const out of ['capability:first_hot_air_service','capability:first_hot_air_precharge'])allowed.set(out,new Set(['native:'+out.slice(11)]));
 forbidden.delete('fluid:tfmg:hot_air');for(const fluid of fuel.mergedMembers)if(fluid!=='railcraft:creosote')forbidden.add('fluid:'+fluid);
 const append=new Map([[ids.coking,[leather.world.oak.log]],[ids.bufferCraft,['tfc:wood/barrel/oak']]]);
 const rules=selected.baseRules.map(r=>({...r,requirements:append.has(r.id)?{all:[r.requirements,...append.get(r.id).map(id=>({id}))]}:r.requirements,outputs:r.outputs.filter(out=>!forbidden.has(out)&&(!allowed.has(out)||allowed.get(out).has(r.id)))}));
 const excluded=new Set([...allowed.keys(),...forbidden]),seed=new Map([...selected.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x)))));
 return {selected,allowed,forbidden,ids,rules,seed,baseRules:selected.baseRules};
}

export function firstHotAirProof(args){
 const {contract,air,hardware,leather,fuel,recipes,frontier,solve,tagMembers,locks}=args;const {selected,allowed,forbidden,ids,rules,seed}=selectFirstHotAirSuppliers(args);
 const targets=['tfmg:blast_stove','modern_industrialization:fluid_pipe','create:fluid_tank','railcraft:coke_oven_bricks','fluid:railcraft:creosote','fluid:tfmg:air','fluid:tfmg:hot_air','fluid:tfmg:carbon_dioxide','capability:first_hot_air_precharge'],solved=solve(rules,seed),missing=targets.filter(id=>!solved.reached.has(id)),leaves=e=>solved.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_NATIVE_FIRST_HOT_AIR':'BOUNDED_NATIVE_FINITE_HOT_AIR_PRECHARGE',targets,missing,witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),selectedSources:Object.fromEntries([...allowed].map(([out,ids])=>[out,[...ids]])),researchOwners:Object.fromEntries(Object.values(ids).map(id=>[id,locks.get(id)??[]])),quantityPlan:contract.quantityPlan,excludedShortcuts:[...forbidden],earlierWorkshopBoundary:Object.fromEntries([...seed].filter(([id])=>['#c:plates/iron','#c:plates/cast_iron','#c:ingots/cast_iron','create:andesite_alloy','#minecraft:planks','tfc:wood/lumber/oak','modern_industrialization:bronze_curved_plate','modern_industrialization:copper_rotor','#c:glass_panes'].includes(id))),negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 const reject=(name,{outputs=[],ids:removedIds=[]}={})=>{const absent=new Set(outputs),removed=new Set(removedIds),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(out=>!absent.has(out))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has('capability:first_hot_air_precharge'),'First hot-air precharge bypasses '+name);result.negativeCases.push({name,rejected:true});};
 for(const out of ['fluid:tfmg:air','fluid:railcraft:creosote','fluid:tfmg:hot_air','fluid:tfmg:carbon_dioxide','tfmg:air_intake','tfmg:blast_stove','tfmg:cast_iron_fluid_tank','tfmg:cast_iron_pipe','tfmg:fireproof_bricks','tfc:wood/barrel/oak','tfc:wood/log/oak','modern_industrialization:fluid_pipe','create:fluid_tank','railcraft:coke_oven_bricks','create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:large_andesite_alloy_cogwheel','fluid:minecraft:water','capability:first_air_drive','capability:startup_lubricant_oven','capability:first_hot_air_service','capability:terrestrial_prospecting'])reject('no_'+out,{outputs:[out]});
 for(const[key,id]of Object.entries(ids))reject('no_selected_'+key,{ids:[id]});for(const key of ['stove','tank','ironPipe','wall','barrel','intake'])reject('no_selected_'+key,{ids:[hardware.ids[key]]});
 result.noInheritedAirHotAirCreosoteOrSelectedHardware=true;result.noSteelElectricOrOffworld=true;result.noFirstSteelAdmission=true;return result;
}
