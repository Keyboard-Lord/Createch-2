import assert from'node:assert/strict';
import{selectRailCircuitSuppliers}from'./first_rail_circuit_proof.mjs';

export function selectRailTerminalSuppliers({contract,circuitArgs}){
 assert.equal(contract.truth,'STATIC_NATIVE_SELECTED_RAIL_TERMINALS');
 const previous=selectRailCircuitSuppliers(circuitArgs),{solve,tagMembers,locks}=previous,i=contract.ids;
 const selected=new Map([['minecraft:chest',i.chests],['minecraft:hopper',i.hopper],['railcraft:item_loader',i.loader],['railcraft:item_unloader',i.unloader],['railcraft:advanced_item_loader',i.advancedLoader],['capability:rail_terminal_steel_allocation','native:rail_terminal_steel_allocation'],['capability:rail_terminal_plate_batch','packet:rail_terminal_plates']]);
 const allowed=new Map(previous.allowed),forbidden=new Set(previous.forbidden);for(const[out,id]of selected){allowed.set(out,new Set([id]));forbidden.delete(out);}
 const excluded=new Set([...allowed.keys(),...forbidden]),seed=new Map([...previous.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x))))),restored=new Map();for(const[out,id]of selected){if(!restored.has(id))restored.set(id,[]);restored.get(id).push(out);}
 const choose=e=>e.id?{id:({'#minecraft:logs':'tfc:wood/log/oak','#c:plates/steel':'capability:rail_terminal_plate_batch'})[e.id]??e.id}:e.all?{all:e.all.map(choose)}:{any:e.any.map(choose)};
 const terminalIds=new Set([i.loader,i.unloader,i.advancedLoader]);
 const rules=previous.rules.map(r=>({...r,outputs:[...new Set([...r.outputs,...(restored.get(r.id)??[])])].filter(out=>!forbidden.has(out)&&(!allowed.has(out)||allowed.get(out).has(r.id))),requirements:{all:[restored.has(r.id)?choose(r.requirements):r.requirements,...(terminalIds.has(r.id)?[{id:'capability:rail_terminal_steel_allocation'}]:[])]}}));
 const original=previous.rules.find(r=>r.id===i.plate);assert(original,'Missing existing canonical plate manufacturer');
 rules.push({...original,id:'packet:rail_terminal_plates',sourceRecipeId:i.plate,kind:'qualified_existing_recipe_batch',outputs:['capability:rail_terminal_plate_batch'],requirements:{all:[original.requirements,{id:'capability:rail_terminal_steel_allocation'}]}});
 for(const id of restored.keys())assert(rules.some(r=>r.id===id),'Unmodeled terminal source '+id);
 return {previous,rules,seed,allowed,forbidden,selected,contract,solve,tagMembers,locks,i};
}
export function firstRailTerminalProof(args){
 const {rules,seed,allowed,forbidden,selected,contract,solve,tagMembers,locks,i}=selectRailTerminalSuppliers(args);
 const targets=[...selected.keys(),'railcraft:controller_circuit','railcraft:item_detector','railcraft:frame'],s=solve(rules,seed,{recordInputs:true}),missing=targets.filter(id=>!s.reached.has(id)),leaves=e=>s.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_FIRST_RAIL_TERMINALS':'BOUNDED_NATIVE_SELECTED_RAIL_TERMINALS',targets,missing,missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),witnesses:Object.fromEntries(targets.map(id=>[id,s.witness.get(id)??null])),selectedSources:Object.fromEntries(selected),researchOwners:Object.fromEntries(Object.values(i).map(id=>[id,locks.get(id)??[]])),quantityPlan:contract.quantityPlan,finitePlan:contract.finitePlan,negativeCases:[],limits:contract.limits};if(missing.length)return result;
 for(const out of selected.keys())assert(!seed.has(out),'Inherited selected terminal output '+out);
 const used=new Set(),visited=new Set(),walk=id=>{if(visited.has(id))return;visited.add(id);if(seed.has(id)){used.add(id);return;}const inputs=s.witnessInputs.get(id);assert(inputs,'Missing terminal provenance '+id);inputs.forEach(walk);};targets.forEach(walk);result.usedEarlierFrontier=Object.fromEntries([...used].sort().map(id=>[id,seed.get(id)]));
 const reject=(name,target,{outputs=[],ids=[]}={})=>{const absent=new Set(outputs),removed=new Set(ids),check=solve(rules.filter(r=>!removed.has(r.id)&&!removed.has(r.sourceRecipeId)).map(r=>({...r,outputs:r.outputs.filter(out=>!absent.has(out))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has(target),'Terminal bypass '+name);result.negativeCases.push({name,target,rejected:true});};
 for(const[out]of selected)reject('no_'+out,out==='railcraft:item_unloader'?out:'railcraft:advanced_item_loader',{outputs:[out]});
 for(const out of ['tfmg:steel_ingot','tfc:ore/normal_hematite','tfmg:coal_coke_dust','fluid:tfmg:hot_air','fluid:railcraft:creosote','capability:rail_stock_slag_storage','capability:rail_stock_steel_allocation','capability:rail_circuit_hammer_batch','capability:rail_circuit_handstone_batch','railcraft:controller_circuit','railcraft:item_detector','railcraft:steel_plate','railcraft:standard_rail','railcraft:steel_crowbar','tfc:wood/log/oak'])reject('no_'+out,'railcraft:advanced_item_loader',{outputs:[out]});
 for(const id of new Set([...selected.values(),i.plate]))reject('no_source_'+id,id===i.unloader?'railcraft:item_unloader':'railcraft:advanced_item_loader',{ids:[id]});
 result.fiveAdditionalSteelIngotsDoNotReallocatePriorForty=true;result.noInheritedChestsHoppersOrTerminalMachines=true;result.baseLoaderIsSequentialMilestoneNotRetainedStock=true;result.locomotiveAndEarlierAggregateStillUnresolved=true;return result;
}
