import assert from 'node:assert/strict';
import {selectPrimitiveGoldEntrySuppliers} from './primitive_gold_entry.mjs';
import {selectMechanicalIronEntrySuppliers} from './mechanical_iron_entry.mjs';

export function selectFirstPrecisionAttemptSuppliers({contract,wroughtArgs,locks,mechanical,primitiveGold,gold}) {
 assert.equal(contract.truth,'STATIC_NATIVE_FIRST_PRECISION_ATTEMPT_INPUTS');
 const primitive=selectPrimitiveGoldEntrySuppliers({contract:primitiveGold,gold,wroughtArgs,locks});
 const previous=selectMechanicalIronEntrySuppliers({contract:mechanical,wroughtArgs,base:primitive});
 const {solve,tagMembers}=previous,cap=k=>'capability:precision_attempt_'+k,target=cap('inputs_ready'),i=contract.ids;
 const batches=Object.entries(i).filter(([k])=>k!=='polish');
 // Remove every output of each original precision producer, including scraps.
 const precisionProducers=new Set(previous.recipes.filter(r=>r.outputs.includes('create:precision_mechanism')).map(r=>r.id));
 assert(precisionProducers.has(i.precision));
 const rules=previous.rules.map(r=>({...r,outputs:precisionProducers.has(r.id)?[]:r.outputs}));
 const excluded=new Set(['create:precision_mechanism','create:deployer','create:brass_hand','create:electron_tube','create:polished_rose_quartz','create:rose_quartz','create:sand_paper','create:golden_sheet','create:brass_sheet','railcraft:manual_rolling_machine','capability:manual_rolling_service']);
 const seed=new Map([...previous.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x)))));
 const choices={
  'create:deployer':cap('deployer'),'create:brass_hand':cap('hand'),'create:electron_tube':cap('tube'),'create:andesite_casing':cap('casing'),
  'create:polished_rose_quartz':cap('polish'),'create:rose_quartz':cap('rose'),'minecraft:iron_ingot':cap('ordinaryIngot'),'minecraft:iron_nugget':cap('mechanicalIron'),
  '#c:plates/brass':cap('brass'),'#c:plates/gold':cap('gold'),'#c:plates/iron':cap('iron'),'#c:ingots/gold':'tfc:metal/ingot/gold','#c:ingots/brass':'tfc:metal/ingot/brass','#c:ingots/iron':cap('ordinaryIngot'),'#c:nuggets/iron':cap('mechanicalIron'),
  '#c:createch2_kinetics/cogwheel/andesite_alloy':cap('small'),'#c:createch2_kinetics/large_cogwheel/andesite_alloy':cap('large'),
  'greate:andesite_alloy_shaft':cap('shaft'),'greate:andesite_alloy_cogwheel':cap('small'),'greate:large_andesite_alloy_cogwheel':cap('large'),
  '#minecraft:planks':cap('planks'),'#minecraft:logs':'tfc:wood/log/oak','#minecraft:sand':'tfc:sand/white','#c:gems/quartz':'minecraft:quartz','#c:dusts/redstone':'minecraft:redstone'
 };
 const choose=e=>e.id?{id:choices[e.id]??e.id}:e.all?{all:e.all.map(choose)}:{any:e.any.map(choose)};
 for(const[k,id]of batches){const r=previous.rules.find(r=>r.id===id);assert(r,'Unmodeled precision attempt source '+id);rules.push({...r,id:'packet:precision_attempt_'+k,sourceRecipeId:id,kind:k==='precision'?'weighted_recipe_attempt_conditions_only':'qualified_existing_recipe_batch',outputs:[cap(k)],requirements:choose(r.requirements)});}
 rules.push({id:'native:precision_attempt_manual_polishing',sourceRecipeId:i.polish,kind:'native_manual_sandpaper_use',outputs:[cap('polish')],requirements:{all:[cap('rose'),cap('paper')].map(id=>({id}))},evidence:contract.manualPolishing});
 const inputs=[...batches.map(([k])=>cap(k)),cap('polish'),primitive.forge,primitive.cap,primitive.fuel,previous.service,'capability:early_millstone_service',
  'tfc:ore/normal_native_gold','tfc:metal/ingot/brass','tfc:metal/ingot/wrought_iron','tfc:wood/log/oak','tfc:wood/lumber/oak','tfc:rock/loose/granite','tfc:rock/raw/granite','minecraft:clay_ball','tfc:straw','minecraft:paper','tfc:sand/white','minecraft:quartz','minecraft:redstone','minecraft:charcoal',
  'create:andesite_alloy','createbigcannons:basin_foundry_lid','greate:andesite_alloy_mechanical_press','railcraft:manual_rolling_machine','capability:manual_rolling_service'];
 rules.push({id:'native:precision_attempt_finite_inputs',outputs:[target],requirements:{all:inputs.map(id=>({id}))},kind:'native_finite_stock_for_one_weighted_attempt',evidence:contract.plan});
 return {contract,wroughtArgs,locks,mechanical,primitiveGold,gold,previous,primitive,rules,seed,cap,target,i,batches,inputs,solve,tagMembers};
}
export function firstPrecisionAttemptProof(args) {
 const {contract,rules,seed,cap,target,i,batches,inputs,solve,locks,mechanical}=selectFirstPrecisionAttemptSuppliers(args);
 const targets=[target,...batches.map(([k])=>cap(k)),cap('polish')],s=solve(rules,seed,{recordInputs:true}),missing=targets.filter(id=>!s.reached.has(id)),leaves=e=>s.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_FIRST_PRECISION_ATTEMPT_INPUTS':'BOUNDED_NATIVE_FIRST_PRECISION_ATTEMPT_INPUTS',targets,missing,
  missingDetails:missing.map(output=>({output,producers:rules.filter(r=>r.outputs.includes(output)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),
  witnesses:Object.fromEntries(targets.map(id=>[id,s.witness.get(id)??null])),batchSourceRecipes:Object.fromEntries(Object.entries(i).map(([k,id])=>[cap(k),id])),
  researchOwners:Object.fromEntries(Object.values(i).map(id=>[id,locks.get(id)??[]])),quantityPlan:contract.quantityPlan,finitePlan:contract.finitePlan,outputSelection:contract.outputSelection,negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 for(const id of targets)assert(!seed.has(id),'Inherited precision attempt '+id);assert(!seed.has('create:precision_mechanism'));assert(!seed.has('create:deployer'));
 const used=new Set(),seen=new Set(),walk=id=>{if(seen.has(id))return;seen.add(id);if(seed.has(id)){used.add(id);return;}const ins=s.witnessInputs.get(id);assert(ins,'Missing precision attempt provenance '+id);ins.forEach(walk);};targets.forEach(walk);result.usedEarlierFrontier=Object.fromEntries([...used].sort().map(id=>[id,seed.get(id)]));
 const reject=(name,{outputs=[],ids=[]}={})=>{const absent=new Set(outputs),removed=new Set(ids),x=solve(rules.filter(r=>!removed.has(r.id)&&!removed.has(r.sourceRecipeId)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!x.reached.has(target),'Precision attempt bypass '+name);result.negativeCases.push({name,rejected:true});};
 for(const id of inputs)reject('no_'+id,{outputs:[id]});for(const id of Object.values(i))reject('no_source_'+id,{ids:[id]});
 for(const id of [mechanical.id,'native:mechanical_iron_saw','native:primitive_gold_covered_forge','native:primitive_gold_cold_molds','native:primitive_gold_furnace_fuel','native:primitive_gold_mortar','minecraft:charcoal','tfc:crafting/rock/bricks/granite','createch2:railway/rolling/manual_rolling_machine'])reject('no_selected_'+id,{ids:[id]});
 assert(!s.reached.has('create:precision_mechanism'));
 result.noInheritedPrecisionOrDeployer=true;result.noPrecisionFailureScrapBootstrap=true;result.noPrecisionMaceratorRailWorkshopOrOilCharcoal=true;result.precisionMechanismsHeldUnconditionally=0;result.weightedSteelMechanismsMade=0;
 return result;
}
