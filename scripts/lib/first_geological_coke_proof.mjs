import assert from 'node:assert/strict';
import {selectEarlyCokeSuppliers} from './early_coke_supplier_selection.mjs';
import {selectTfcStartupHardwareSuppliers} from './first_tfc_startup_hardware_proof.mjs';
import {recipeOutputRefs,refLabel} from './recipe_dependency_refs.mjs';

export function selectFirstGeologicalCokeSuppliers({contract,hardware,leather,hotAir,recipes,frontier,solve,tagMembers,locks}){
 assert.equal(contract.truth,'STATIC_NATIVE_GEOLOGICAL_COKING_AND_VENT');
 assert(!recipes.find(r=>r.id===contract.ids.coking)?.outputs.includes('fluid:tfmg:carbon_dioxide'),'Vented coking gas must not be credited as retained stock');
 const offworldSuppliers=[...new Set(recipes.flatMap(r=>r.outputs).filter(id=>id.startsWith('capability:')&&id.endsWith('_expedition_suppliers')))];
 const shared=selectEarlyCokeSuppliers({recipes,frontier,tagMembers,early:contract.crushingContract,offworldSuppliers}),selected=selectTfcStartupHardwareSuppliers({contract:hardware,leather,recipes:shared.cokeRules,frontier:shared.crafterSeed,tagMembers}),allowed=new Map(selected.allowed),forbidden=new Set(selected.forbidden),{ids}=contract;
 for(const[key,id]of Object.entries(ids))if(!['coking','cokeDust'].includes(key))for(const ref of recipeOutputRefs(contract.recipes[id]))allowed.set(refLabel(ref),new Set([id]));
 for(const[out,id]of [[shared.cokeStock,ids.coking],[shared.cokeTarget,ids.cokeDust],[shared.crafterTarget,shared.crafterId],[shared.firstPlate,shared.plateRoute],[shared.firstWheels,shared.wheelRoute],['tfc:ore/bituminous_coal','world:tfc_bituminous_coal'],['capability:kinetic_power','native:kinetic_service'],['capability:early_crafter_grid','native:early_crafter_grid'],['capability:early_crushing_service','native:early_crushing_service'],['capability:first_geological_coking_service','native:first_geological_coking_service'],['capability:first_coke_plate_press_service','native:first_coke_plate_press_service']])allowed.set(out,new Set([id]));
 // This oven vents its CO2. A retained-gas input, if needed by an earlier
 // recipe, must come from the separately qualified hot-air producer instead.
 allowed.set('fluid:tfmg:carbon_dioxide',new Set([hotAir.ids.hotAir]));forbidden.add('minecraft:coal');forbidden.add('fluid:tfmg:furnace_gas');
 const owners=locks.get(ids.coking)??[];assert.deepEqual(owners,['research:createch2:che_01_process_control'],'Retain CHE-01 coking ownership');
 const finished=[...Object.keys(contract.crushingContract.grid.hardware),...Object.keys(contract.crushingContract.pair.hardware),'greate:andesite_alloy_mechanical_press','create:depot'];
 const excluded=new Set([...allowed.keys(),...forbidden,...finished,...owners,'capability:steam_service','fluid:modern_industrialization:steam','modern_industrialization:bronze_boiler']);
 const seed=new Map([...selected.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x)))));
 const rules=selected.baseRules.map(r=>({...r,outputs:r.outputs.filter(out=>!forbidden.has(out)&&(!allowed.has(out)||allowed.get(out).has(r.id)))}));
 return {shared,selected,allowed,forbidden,ids,owners,rules,seed,baseRules:selected.baseRules};
}

export function firstGeologicalCokeProof(args){
 const {contract,hardware,leather,hotAir,recipes,frontier,solve,tagMembers,locks}=args;const {shared,selected,allowed,forbidden,ids,owners,rules,seed}=selectFirstGeologicalCokeSuppliers(args);
 const targets=['tfc:ore/bituminous_coal','tfmg:coke_oven','tfmg:exhaust','minecraft:iron_bars','create:chute','modern_industrialization:fluid_pipe','greate:andesite_alloy_mechanical_press','create:depot',shared.firstPlate,shared.crafterTarget,shared.firstWheels,'capability:first_geological_coking_service','capability:first_coke_plate_press_service','capability:early_crafter_grid','capability:early_crushing_service',shared.cokeStock,shared.cokeTarget,...owners],solved=solve(rules,seed,{recordInputs:true}),missing=targets.filter(id=>!solved.reached.has(id)),leaves=e=>solved.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_NATIVE_GEOLOGICAL_COKE_DUST':'BOUNDED_NATIVE_GEOLOGICAL_COKE_DUST',targets,missing,witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),selectedSources:Object.fromEntries([...allowed].map(([out,ids])=>[out,[...ids]])),researchOwners:owners,quantityPlan:contract.quantityPlan,questBinding:contract.questBinding,excludedShortcuts:[...forbidden],noVentedCokingGasCreditedAsRetained:true,negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 const used=new Set(),visited=new Set(),walkId=id=>{if(visited.has(id))return;visited.add(id);if(seed.has(id)){used.add(id);return;}const inputs=solved.witnessInputs.get(id);assert(inputs,'Missing admission provenance '+id);inputs.forEach(walkId);};targets.forEach(walkId);result.usedEarlierFrontier=Object.fromEntries([...used].sort().map(id=>[id,seed.get(id)]));
 const reject=(name,{outputs=[],ids:removeIds=[]}={})=>{const absent=new Set(outputs),removed=new Set(removeIds),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(out=>!absent.has(out))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has(shared.cokeTarget),'First geological coke dust bypasses '+name);result.negativeCases.push({name,rejected:true});};
 for(const out of ['tfc:ore/bituminous_coal','tfmg:coke_oven','tfmg:exhaust','minecraft:iron_bars','create:chute','modern_industrialization:fluid_pipe','create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:large_andesite_alloy_cogwheel','greate:andesite_alloy_mechanical_press','create:depot',shared.firstPlate,shared.firstWheels,shared.crafterTarget,'tfc:wood/workbench/oak','tfmg:coal_coke','capability:early_crafter_grid','capability:early_crushing_service','capability:first_geological_coking_service','capability:first_coke_plate_press_service','capability:kinetic_power','capability:terrestrial_prospecting','fluid:minecraft:water',...owners])reject('no_'+out,{outputs:[out]});
 for(const[key,id]of Object.entries(ids))reject('no_selected_'+key,{ids:[id]});
 result.noInheritedCokeDustOrSelectedApparatus=true;result.noSteelElectricOrOffworld=true;result.firstSteelNotYetAdmitted=true;return result;
}
