import assert from 'node:assert/strict';
export function firstIndustrialIronProof({contract,recipes,frontier,powerContract,nativeSteam,locks,solve,tagMembers}){
 assert.equal(contract.truth,'STATIC_TFC_WROUGHT_TO_ORDINARY_IRON_HANDOFF');
 assert.equal(nativeSteam.truth,'STATIC_NATIVE_MI_BOILER_STEAM');
 const machine='modern_industrialization:bronze_macerator',boiler='modern_industrialization:bronze_boiler',steam=powerContract.steamProcessors.macerator.find(m=>m.item===machine);
 assert.equal(steam.maxEu,2);assert.equal(contract.recipe.eu,steam.maxEu);
 assert.deepEqual(locks.get(contract.id),['research:'+contract.researchId]);
 const smelt=new Set(['modern_industrialization:materials/iron/smelting/dust_to_ingot_smelting','modern_industrialization:materials/iron/smelting/dust_to_ingot_blasting']);
 const excluded=new Set(['create:crushed_raw_iron','minecraft:raw_iron','minecraft:raw_iron_block','create:crimsite','fluid:minecraft:lava','minecraft:lava_bucket','modern_industrialization:electric_macerator','capability:eu_power','capability:industrial_power','capability:mi_sustained_lv_service','modern_industrialization:steel_macerator',...recipes.flatMap(r=>r.outputs).filter(id=>id.startsWith('capability:')&&id.endsWith('_return_expedition_suppliers'))]);
 const rules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!excluded.has(id)&&id!==contract.input&&(id!==contract.output||r.id===contract.id)&&(id!=='minecraft:iron_ingot'||smelt.has(r.id)))}));
 const removeSeed=new Set([...excluded,contract.input,contract.output,'minecraft:iron_ingot','#c:ingots/iron',machine,boiler,'capability:steam_service','fluid:modern_industrialization:steam']);
 const seed=new Map([...frontier].filter(([id])=>!removeSeed.has(id)));
 seed.set(contract.input,{kind:'earned_TFC_wrought_metallurgy_boundary',requiredMetalUnitsPerIngot:100,limit:'Earlier physical TFC wrought-ingot stock; bloomery/geology, forging and actual quantities are a preceding unproved boundary, not free ordinary iron or raw ore.'});
 const solved=solve(rules,seed),targets=[machine,boiler,'capability:steam_service','fluid:modern_industrialization:steam','research:'+contract.researchId,contract.output,'minecraft:iron_ingot'];
 const result={truth:targets.every(id=>solved.reached.has(id))?'BOUNDED_TFC_WROUGHT_TO_CANONICAL_IRON_BATCHES':'INCOMPLETE_TFC_INDUSTRIAL_IRON',targets,missing:targets.filter(id=>!solved.reached.has(id)),witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),nativeContract:contract,selectedMacerator:steam,excludedShortcuts:[...excluded],earlierBoundary:seed.get(contract.input),quantityPlan:{inputMetalUnits:100,outputMetalUnits:100,requiredEuPerIngot:400,batches:[{dust:16,wroughtIngots:16,eu:6400},{dust:32,wroughtIngots:32,eu:12800}],scope:'Independent stock thresholds; this does not claim consumption by quests, an actual32-item inventory or double-counting/reuse of produced items.'},negativeCases:[],limits:[...contract.limits,'Only the reviewed handoff may produce canonical iron dust in this scoped proof. Native dust smelting can return ordinary iron; all initially inherited ordinary iron and alternate raw-ore/crimsite/lava/electric producers are excluded.','The reviewed native bronze boiler and2EU/t bronze macerator are manufactured; finite heat-up, water/charcoal/steam transfer, native process ticking and actual output remain runtime qualification.','This closes the post-wrought industrial handoff and aligns the two stock objectives; it does not certify a full Stone-to-wrought or hot-air blast-furnace route. All17age acceptance remains incomplete.']};
 if(result.truth!=='BOUNDED_TFC_WROUGHT_TO_CANONICAL_IRON_BATCHES')return result;
 for(const[name,outputs,ids]of [['no_earned_wrought',[contract.input],[]],['no_industrial_heat',['research:'+contract.researchId],[]],['no_bronze_macerator',[machine],[]],['no_bronze_boiler',[boiler],[]],['no_water',['fluid:minecraft:water'],[]],['no_charcoal',['minecraft:charcoal'],[]],['no_steam_service',['capability:steam_service'],[]],['no_owned_handoff',[],[contract.id]]]){
  const absent=new Set(outputs),removed=new Set(ids),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));
  assert(!check.reached.has(contract.output),'TFC industrial iron bypasses '+name);result.negativeCases.push({name,rejected:true});
 }
 result.noOrdinaryIronOrRawOreBootstrap=true;
 return result;
}
