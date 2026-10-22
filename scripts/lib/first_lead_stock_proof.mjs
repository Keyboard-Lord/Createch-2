import assert from 'node:assert/strict';
import {selectMechanismLeadSuppliers} from './first_mechanism_lead_candidate.mjs';

export function selectLeadStockSuppliers({contract,leadArgs,steelStock,detectors,terminals,oilBuckets}) {
 assert.equal(contract.truth,'STATIC_NATIVE_TWENTY_FOUR_CANONICAL_LEAD_PLATES_AND_FAN_STOCK');
 for(const [p,truth] of [[steelStock,'BOUNDED_NATIVE_FIFTY_THREE_ADDITIONAL_STEEL_RESERVE'],[detectors,'BOUNDED_NATIVE_TWO_RAIL_DETECTORS'],[terminals,'BOUNDED_NATIVE_SELECTED_RAIL_TERMINALS'],[oilBuckets,'BOUNDED_NATIVE_GEOLOGICAL_LUBRICATION_BUCKETS']]) assert.equal(p.truth,truth);
 assert.equal(steelStock.finitePlan.charcoalAfterBloomeryBeforeOtherUses,2225);
 assert.equal(detectors.quantityPlan.fullWoodSpare,2);assert.equal(terminals.quantityPlan.ordinaryChestsRetained,3);assert.equal(oilBuckets.quantityPlan.emptyBucketsRetained,2);
 const previous=selectMechanismLeadSuppliers(leadArgs),{solve,locks}=previous,cap=k=>'capability:lead_stock_'+k,target=cap('twenty_four_plates');
 const i=contract.ids,l=leadArgs.contract.ids,batches=[['shaft',i.shaft],['cog',i.cog],['wheel',i.wheel],['casing',i.casing],['depot',i.depot],['planks',i.planks],['tin',i.tin],['fan',l.fan],['crush',l.crush],['wash',l.wash],['dust',l.dust],['smelt',l.smelt],['plate',l.plate]];
 const choices={'#minecraft:planks':cap('planks'),'greate:andesite_alloy_shaft':cap('shaft'),'greate:andesite_alloy_cogwheel':cap('cog'),'create:andesite_casing':cap('casing'),'#c:plates/tin':cap('tin'),'#minecraft:logs':cap('retained_wood'),'#c:ingots/tin':'tfc:metal/ingot/tin','create:crushed_raw_lead':cap('crush'),'modern_industrialization:lead_tiny_dust':cap('wash'),'modern_industrialization:lead_dust':cap('dust'),'modern_industrialization:lead_ingot':cap('smelt'),'capability:canonical_lead_fan_service':cap('fan_service'),'capability:canonical_lead_furnace_service':cap('furnace_service')};
 const choose=e=>e.id?{id:choices[e.id]??e.id}:e.all?{all:e.all.map(choose)}:{any:e.any.map(choose)};
 // Private recipe instances preserve earlier factory suppliers and their paid allocations.
 const rules=previous.rules.map(r=>({...r})),seed=new Map(previous.seed);
 for(const [name,id]of batches){const r=previous.rules.find(r=>r.id===id);assert(r,'Unmodeled lead-stock recipe '+id);rules.push({...r,id:'packet:lead_stock_'+name,sourceRecipeId:id,kind:'qualified_existing_recipe_batch',outputs:[cap(name)],requirements:choose(r.requirements)});}
 const reserves=cap('earlier_retained_inputs');
 rules.push({id:'native:lead_stock_retained_inputs',kind:'fresh_parent_proofs_and_saved_finite_allocations',outputs:[reserves,cap('retained_wood'),cap('retained_chest'),cap('retained_empty_bucket'),cap('retained_charcoal')],requirements:{all:['capability:mechanism_steel_stock_batch','capability:rail_terminal_steel_allocation','railcraft:item_detector','minecraft:bucket'].map(id=>({id}))},evidence:{steel:steelStock.truth,detectors:detectors.truth,terminals:terminals.truth,buckets:oilBuckets.truth}});
 rules.push({id:'native:lead_stock_water_bucket_transfer',kind:'native_source_pickup_full_fan_fill_and_empty_bucket_return',outputs:[cap('fan_water')],requirements:{all:[cap('retained_empty_bucket'),'fluid:minecraft:water'].map(id=>({id}))},evidence:contract.nativeCodeSha256});
 rules.push({id:'native:lead_stock_fan_service',kind:'native_independent_eight_rpm_internal_water_fan',outputs:[cap('fan_service')],requirements:{all:['fan','wheel','shaft','depot','fan_water'].map(k=>({id:cap(k)}))},evidence:leadArgs.contract.power});
 rules.push({id:'native:lead_stock_furnace_service',kind:'native_four_charcoal_cold_furnace_and_single_output_handling',outputs:[cap('furnace_service')],requirements:{all:['minecraft:furnace',cap('retained_charcoal'),cap('retained_chest')].map(id=>({id}))},evidence:contract.plan.furnacePlan});
 const inputs=[reserves,...batches.map(([name])=>cap(name)),cap('fan_water'),cap('fan_service'),cap('furnace_service'),'tfc_metallurgy:ore/normal_galena','create:andesite_alloy','createbigcannons:basin_foundry_lid','tfc:wood/lumber/oak','tfc:metal/ingot/tin','modern_industrialization:bronze_compressor','fluid:modern_industrialization:steam'];
 rules.push({id:'native:lead_stock_finite_batch',kind:'native_quantified_twenty_four_plate_and_hardware_allocation',outputs:[target],requirements:{all:inputs.map(id=>({id}))},evidence:contract.plan});
 return {previous,contract,rules,seed,solve,locks,cap,target,inputs,batches,allowed:previous.allowed,forbidden:previous.forbidden,tagMembers:previous.tagMembers};
}
export function firstLeadStockProof(args){
 const {contract,rules,seed,solve,locks,cap,target,inputs,batches}=selectLeadStockSuppliers(args);
 const targets=[target,...batches.map(([name])=>cap(name))],s=solve(rules,seed,{recordInputs:true}),missing=targets.filter(id=>!s.reached.has(id)),leaves=e=>s.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_FIRST_CANONICAL_LEAD_STOCK':'BOUNDED_NATIVE_TWENTY_FOUR_CANONICAL_LEAD_PLATES',targets,missing,missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),witnesses:Object.fromEntries(targets.map(id=>[id,s.witness.get(id)??null])),batchSourceRecipes:Object.fromEntries(batches.map(([name,id])=>[cap(name),id])),researchOwners:Object.fromEntries([...new Set(batches.map(([,id])=>id))].map(id=>[id,locks.get(id)??[]])),quantityPlan:contract.quantityPlan,finitePlan:contract.finitePlan,negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 for(const id of targets)assert(!seed.has(id),'Inherited lead stock '+id);
 const used=new Set(),seen=new Set(),walk=id=>{if(seen.has(id))return;seen.add(id);if(seed.has(id)){used.add(id);return;}const ins=s.witnessInputs.get(id);assert(ins,'Missing lead-stock provenance '+id);ins.forEach(walk);};targets.forEach(walk);result.usedEarlierFrontier=Object.fromEntries([...used].sort().map(id=>[id,seed.get(id)]));
 const reject=(name,{outputs=[],ids=[]}={})=>{const absent=new Set(outputs),removed=new Set(ids),x=solve(rules.filter(r=>!removed.has(r.id)&&!removed.has(r.sourceRecipeId)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!x.reached.has(target),'Lead-stock bypass '+name);result.negativeCases.push({name,rejected:true});};
 for(const id of inputs)reject('no_'+id,{outputs:[id]});
 for(const [,id]of batches)reject('no_source_'+id,{ids:[id]});
 for(const id of ['native:lead_stock_retained_inputs','native:lead_stock_water_bucket_transfer','native:lead_stock_fan_service','native:lead_stock_furnace_service','native:lead_stock_finite_batch'])reject('no_'+id,{ids:[id]});
 result.priorSteelRailAndOilAllocationsPreserved=true;result.optionalSilverCredited=false;result.weightedMechanismsManufactured=0;return result;
}
