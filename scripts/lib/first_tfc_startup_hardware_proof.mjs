import assert from 'node:assert/strict';
import {selectTfcLeatherSuppliers} from './first_tfc_leather_proof.mjs';
import {recipeOutputRefs,refLabel} from './recipe_dependency_refs.mjs';

export function selectTfcStartupHardwareSuppliers({contract,leather,recipes,frontier,tagMembers}){
 assert.equal(contract.truth,'STATIC_TFC_FIRST_TFMG_INTAKE_AND_STOVE_HARDWARE');
 const selected=selectTfcLeatherSuppliers({contract:leather,recipes,frontier,tagMembers,isolateFirstLeather:false}),allowed=new Map([...selected.allowed].filter(([out])=>[leather.world.oak.tool,'tfc:stone/axe_head/sedimentary',leather.world.oak.twig,leather.world.oak.log,'tfc:wood/barrel/oak'].includes(out))),{ids}=contract;
 for(const id of Object.values(ids))for(const ref of recipeOutputRefs(contract.recipes[id]))allowed.set(refLabel(ref),new Set([id]));
 allowed.set('tfc:rock/raw/quartzite',new Set(['world:tfc_isolated_quartzite']));
 const forbidden=new Set(['minecraft:barrel','minecraft:stone','capability:industrial_power','capability:eu_power','capability:fe_power','capability:mi_sustained_lv_service',...recipes.flatMap(r=>r.outputs).filter(out=>out.startsWith('capability:')&&out.endsWith('_return_expedition_suppliers'))]);
 for(const out of [...frontier.keys(),...recipes.flatMap(r=>r.outputs)])if(!out.startsWith('research:')&&out.includes('steel'))forbidden.add(out);
 const append=new Map([[ids.tank,['tfc:wood/barrel/oak']],[ids.stonecutter,['tfc:rock/raw/quartzite']],[ids.barrel,['tfc:wood/lumber/oak']]]);
 const baseRules=selected.rules.map(r=>({...r,requirements:append.has(r.id)?{all:[r.requirements,...append.get(r.id).map(id=>({id}))]}:r.requirements}));
 const rules=baseRules.map(r=>({...r,outputs:r.outputs.filter(out=>!forbidden.has(out)&&(!allowed.has(out)||allowed.get(out).has(r.id)))}));
 const excluded=new Set([...allowed.keys(),...forbidden]),seed=new Map([...selected.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x)))));
 return {allowed,forbidden,rules,seed,baseRules};
}

export function firstTfcStartupHardwareProof({contract,leather,recipes,frontier,solve,tagMembers,locks}){
 const {allowed,forbidden,rules,seed}=selectTfcStartupHardwareSuppliers({contract,leather,recipes,frontier,tagMembers}),{ids}=contract;
 const targets=[...allowed.keys()],solved=solve(rules,seed),missing=targets.filter(id=>!solved.reached.has(id)),leaves=e=>solved.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_FIRST_TFC_STARTUP_HARDWARE':'BOUNDED_TFC_FIRST_TFMG_INTAKE_AND_STOVE_HARDWARE',targets,missing,witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),researchOwners:Object.fromEntries(Object.values(ids).map(id=>[id,locks.get(id)??[]])),selectedSources:Object.fromEntries([...allowed].map(([out,ids])=>[out,[...ids]])),quantityPlan:contract.quantityPlan,excludedShortcuts:[...forbidden],earlierWorkshopBoundary:Object.fromEntries([...seed].filter(([id])=>['minecraft:iron_ingot','#c:plates/iron','#c:plates/cast_iron','#c:ingots/cast_iron','tfc:wood/lumber/oak'].includes(id))),negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 const reject=(name,{outputs=[],ids:removedIds=[],change}={})=>{const absent=new Set(outputs),removed=new Set(removedIds),rs=rules.filter(r=>!removed.has(r.id)).map(r=>({...r,requirements:change?change(r):r.requirements,outputs:r.outputs.filter(out=>!absent.has(out))})),check=solve(rs,new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has('tfmg:air_intake')||!check.reached.has('tfmg:blast_stove'),'First intake/stove hardware bypasses '+name);result.negativeCases.push({name,rejected:true});};
 for(const out of ['tfc:wood/barrel/oak','tfc:rock/raw/quartzite','minecraft:stonecutter','tfmg:cast_iron_fluid_tank','tfmg:cast_iron_pipe','tfmg:fireproof_bricks','create:andesite_bars','create:industrial_iron_block','create:propeller','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','capability:terrestrial_prospecting'])reject('no_'+out,{outputs:[out]});
 for(const[key,id]of Object.entries(ids))reject('no_selected_'+key,{ids:[id]});
 const replace=(e,a,b)=>e.id?e.id===a?{id:b}:e:e.all?{all:e.all.map(x=>replace(x,a,b))}:{any:e.any.map(x=>replace(x,a,b))};
 reject('old_literal_barrel',{change:r=>r.id===ids.tank?replace(r.requirements,'#c:barrels/wooden','minecraft:barrel'):r.requirements});
 reject('old_literal_stone',{change:r=>r.id===ids.stonecutter?replace(r.requirements,'#c:stones','minecraft:stone'):r.requirements});
 result.noInheritedHardwareOrVanillaBarrelStone=true;result.noSteelElectricOrOffworld=true;return result;
}
