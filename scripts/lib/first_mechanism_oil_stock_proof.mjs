import assert from 'node:assert/strict';
import {selectGeologicalLubricationBucketSuppliers} from './first_geological_lubrication_bucket_proof.mjs';

export function firstMechanismOilStockProof({contract,oilArgs,oilProof,leadProof,nickelProof}) {
 assert.equal(contract.truth,'STATIC_NATIVE_SIX_LITRE_ADDITIONAL_MECHANISM_OIL');
 assert.equal(oilProof.truth,'BOUNDED_NATIVE_GEOLOGICAL_LUBRICATION_BUCKETS');
 assert.equal(leadProof.truth,'BOUNDED_NATIVE_TWENTY_FOUR_CANONICAL_LEAD_PLATES');
 assert.equal(nickelProof.truth,'BOUNDED_NATIVE_TWENTY_FOUR_GARNIERITE_NICKEL_PLATES');
 const previous=selectGeologicalLubricationBucketSuppliers(oilArgs),{solve,locks}=previous;
 const cap=k=>'capability:mechanism_oil_stock_'+k,target=cap('six_litres_held');
 const rules=previous.rules.map(r=>({...r})),seed=new Map(previous.seed),batches=['coking','lubricant','bridge'];
 for(const key of batches){const id=contract.ids[key],r=rules.find(r=>r.id===id);assert(r,id);rules.push({...r,id:'packet:mechanism_oil_stock_'+key,sourceRecipeId:id,kind:'qualified_existing_recipe_batch',outputs:[cap(key)]});}
 const inputs=[...batches.map(cap),'fluid:railcraft:creosote','fluid:modern_industrialization:lubricant',
  'tfc:wood/log/oak','minecraft:redstone','fluid:minecraft:water','fluid:modern_industrialization:steam',
  'modern_industrialization:bronze_boiler','modern_industrialization:bronze_mixer',
  'railcraft:coke_oven_bricks','modern_industrialization:fluid_pipe','create:fluid_tank',
  'create:basin','greate:andesite_alloy_mechanical_mixer',oilArgs.bucket.filled,
  ...previous.oil.services];
 rules.push({id:'native:mechanism_oil_stock_finite_batch',outputs:[target],requirements:{all:inputs.map(id=>({id}))},kind:'native_finite_production_storage_and_conditional_delivery',evidence:contract.plan});
 const targets=[target,...batches.map(cap)],s=solve(rules,seed,{recordInputs:true});
 const missing=targets.filter(id=>!s.reached.has(id)),leaves=e=>s.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_FIRST_MECHANISM_OIL_STOCK':'BOUNDED_NATIVE_SIX_LITRE_ADDITIONAL_MECHANISM_OIL',targets,missing,
  missingDetails:missing.map(output=>({output,producers:rules.filter(r=>r.outputs.includes(output)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),
  witnesses:Object.fromEntries(targets.map(id=>[id,s.witness.get(id)??null])),
  batchSourceRecipes:Object.fromEntries(batches.map(k=>[cap(k),contract.ids[k]])),
  researchOwners:Object.fromEntries(batches.map(k=>[contract.ids[k],locks.get(contract.ids[k])??[]])),
  quantityPlan:contract.quantityPlan,finitePlan:contract.finitePlan,conditionalDelivery:contract.plan.conditionalDelivery,
  negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 for(const id of targets)assert(!seed.has(id),'Inherited new oil stock '+id);
 const used=new Set(),seen=new Set(),walk=id=>{if(seen.has(id))return;seen.add(id);if(seed.has(id)){used.add(id);return;}const inputs=s.witnessInputs.get(id);assert(inputs,'Missing oil stock provenance '+id);inputs.forEach(walk);};targets.forEach(walk);
 result.usedEarlierFrontier=Object.fromEntries([...used].sort().map(id=>[id,seed.get(id)]));
 const reject=(name,{outputs=[],ids=[]}={})=>{const absent=new Set(outputs),removed=new Set(ids),x=solve(rules.filter(r=>!removed.has(r.id)&&!removed.has(r.sourceRecipeId)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!x.reached.has(target),'Oil stock bypass '+name);result.negativeCases.push({name,rejected:true});};
 for(const id of inputs)reject('no_'+id,{outputs:[id]});
 for(const key of batches)reject('no_source_'+key,{ids:[contract.ids[key]]});
 reject('no_finite_stock_service',{ids:['native:mechanism_oil_stock_finite_batch']});
 result.priorSteelLeadNickelAndBucketAllocationsPreserved=true;
 result.noNewOilSeeded=true;result.weightedMechanismsManufactured=0;
 return result;
}
