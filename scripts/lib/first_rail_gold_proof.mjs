import assert from 'node:assert/strict';
import {selectRailFeedstockSuppliers} from './first_rail_feedstock_proof.mjs';

function safeHandling(c){assert.equal(c.selectedHandling,'SHELTERED_CHARCOAL_FORGE_AND_COLD_MOLDS');assert.equal(c.hotItemHandling.qualifiedWithinSelectedNativePlan,true);assert.equal(c.hotItemHandling.hotVesselTransfers,0);assert.equal(c.hotItemHandling.hotMoldTransfers,0);assert.equal(c.hotItemHandling.manualVesselPouringAdmitted,false);}

export function selectRailGoldSuppliers({contract,feedstockArgs}) {
 assert.equal(contract.truth,'STATIC_NATIVE_FOUR_RAIL_CONTROLLER_GOLD');safeHandling(contract);
 const previous=selectRailFeedstockSuppliers(feedstockArgs),{solve,tagMembers,locks}=previous,i=contract.ids;
 const selected=new Map([
  ['tfc:ore/normal_native_gold','world:rail_controller_gold'],
  ['tfcorewashing:rocky_chunks_gold',i.hammer],
  ['tfcorewashing:chunks_gold','native:rail_gold_sluice/rocky_chunk'],
  ['tfcorewashing:dirty_dust_gold',i.quern],
  ['tfc:powder/native_gold','native:rail_gold_sluice/dirty_dust'],
  ['fluid:tfc:metal/gold',i.melt],['tfc:metal/ingot/gold',i.cast],
  ['capability:rail_gold_sheltered_forge','native:rail_gold_forge_construction'],
  ['tfc:ceramic/unfired_ingot_mold',i.knapMold],['tfc:ceramic/ingot_mold',i.fireMold],
  ['capability:rail_gold_casting_service','native:rail_gold_casting_service']
 ]);
 const allowed=new Map(previous.allowed),forbidden=new Set(previous.forbidden);
 for(const[out,id]of selected){allowed.set(out,new Set([id]));forbidden.delete(out);}
 const excluded=new Set([...allowed.keys(),...forbidden]),seed=new Map([...previous.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x))))),restored=new Map();
 for(const[out,id]of selected){if(!restored.has(id))restored.set(id,[]);restored.get(id).push(out);}
 const choices={'#c:ores/clean_dusts/gold':'tfc:powder/native_gold','#tfc:clay_knapping':'minecraft:clay_ball'},choose=e=>e.id?{id:choices[e.id]??e.id}:e.all?{all:e.all.map(choose)}:{any:e.any.map(choose)};
 const rules=previous.rules.map(r=>({...r,outputs:[...new Set([...r.outputs,...(restored.get(r.id)??[])])].filter(out=>!forbidden.has(out)&&(!allowed.has(out)||allowed.get(out).has(r.id))),requirements:{all:[restored.has(r.id)?choose(r.requirements):r.requirements,...([i.melt,i.cast].includes(r.id)?[{id:'capability:rail_gold_casting_service'}]:[])]}}));
 for(const id of restored.keys())assert(rules.some(r=>r.id===id),'Unmodeled gold supplier '+id);
 return {rules,seed,allowed,forbidden,selected,contract,solve,tagMembers,locks,i};
}
export function firstRailGoldProof(args) {
 const {rules,seed,allowed,forbidden,selected,contract,solve,tagMembers,locks,i}=selectRailGoldSuppliers(args);
 const targets=[...selected.keys(),'tfc:gem/lapis_lazuli','minecraft:red_wool','minecraft:repeater','railcraft:frame','railcraft:steel_crowbar'],s=solve(rules,seed,{recordInputs:true}),missing=targets.filter(id=>!s.reached.has(id)),leaves=e=>s.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_FIRST_RAIL_GOLD':'BOUNDED_NATIVE_GEOLOGICAL_FOUR_RAIL_GOLD',targets,missing,missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),witnesses:Object.fromEntries(targets.map(id=>[id,s.witness.get(id)??null])),selectedSources:Object.fromEntries([...selected].map(([out,id])=>[out,[id]])),researchOwners:Object.fromEntries(Object.values(i).map(id=>[id,locks.get(id)??[]])),quantityPlan:contract.quantityPlan,negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 for(const id of selected.keys())assert(!seed.has(id),'Inherited rail gold stock '+id);
 const used=new Set(),visited=new Set(),walk=id=>{if(visited.has(id))return;visited.add(id);if(seed.has(id)){used.add(id);return;}const ins=s.witnessInputs.get(id);assert(ins,'Missing rail gold provenance '+id);ins.forEach(walk);};targets.forEach(walk);result.usedEarlierFrontier=Object.fromEntries([...used].sort().map(id=>[id,seed.get(id)]));
 const reject=(name,{outputs=[],ids=[]}={})=>{const absent=new Set(outputs),removed=new Set(ids),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(out=>!absent.has(out))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has('tfc:metal/ingot/gold'),'Gold bypass '+name);result.negativeCases.push({name,rejected:true});};
 for(const[out]of selected)reject('no_'+out,{outputs:[out]});
 for(const out of ['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze','tfc:quern','capability:first_wrought_sluice_service','minecraft:clay_ball','tfc:straw','tfc:wood/log/oak','tfc:firestarter','minecraft:charcoal','tfc:rock/raw/granite','railcraft:blast_furnace_bricks'])reject('no_'+out,{outputs:[out]});
 reject('no_hammer',{outputs:['#c:tools/hammer',...tagMembers('#c:tools/hammer')]});
 reject('no_handstone',{outputs:['#tfc:quern_handstones',...tagMembers('#tfc:quern_handstones')]});
 for(const id of new Set(selected.values()))reject('no_selected_'+id,{ids:[id]});
 result.handlingNegativeCases=[];for(const [name,change]of [['legacy_hot_vessel',{selectedHandling:'LEGACY_HOT_VESSELS'}],['unqualified_handling',{hotItemHandling:{...contract.hotItemHandling,qualifiedWithinSelectedNativePlan:false}}],['hot_vessel_transfer',{hotItemHandling:{...contract.hotItemHandling,hotVesselTransfers:1}}],['hot_mold_transfer',{hotItemHandling:{...contract.hotItemHandling,hotMoldTransfers:1}}],['manual_pour_admitted',{hotItemHandling:{...contract.hotItemHandling,manualVesselPouringAdmitted:true}}]]){assert.throws(()=>safeHandling({...contract,...change}),name);result.handlingNegativeCases.push({name,rejected:true});}
 result.noInheritedGoldOrePowderMoltenIngotOrMold=true;result.coldForgeHandlingQualified=true;result.usesLaterNickelHardware=false;
 result.allMoldsMayBreakWithoutLosingFourIngots=true;
 result.finalControllersAndEarlierAggregateStillUnresolved=true;
 return result;
}
