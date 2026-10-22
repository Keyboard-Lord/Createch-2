// A selected native first-seed path. Random world suppliers remain conditional;
// the solver never promotes arbitrary block/chest loot names to free stock.
import assert from 'node:assert/strict';

export function firstWitchHerbsProof({world,ledger,policy,native,recipes,frontier,locks,solve,tagMembers}){
 const contract=world.witchHerbSources,knife=contract.knife;
 const clone=v=>JSON.parse(JSON.stringify(v));
 assert.equal(contract.truth,'STATIC_NATIVE_TFC_GRASSES_TO_WITCH_SEEDS');
 for(const tag of ['#tfc:rock_knapping','#tfc:stones/loose/sedimentary'])assert(tagMembers(tag).includes(knife.rawItem));
 for(const tag of ['#tfc:tools/sharp','#c:tools/knife'])assert(tagMembers(tag).includes(knife.item));
 assert(tagMembers('#c:rods/wooden').includes('minecraft:stick'));
 for(const [id,data]of [[knife.knapId,knife.knap],[knife.craftId,knife.craft]])assert.deepEqual(native.recipes[id].map(r=>r.data),[data]);
 const boneMealId='tfc:quern/bone_meal',boneMeal={type:'tfc:quern',ingredient:{item:'minecraft:bone'},result:{count:3,id:'minecraft:bone_meal'}};
 assert.deepEqual(native.recipes[boneMealId].map(r=>r.data),[boneMeal]);
 const allowed=new Map(),select=(output,id)=>{if(!allowed.has(output))allowed.set(output,new Set());allowed.get(output).add(id);};
 select(knife.head,knife.knapId);select(knife.item,knife.craftId);
 select('minecraft:bone','world:tfc_sheep_bone');select('minecraft:bone_meal',boneMealId);
 const seedSources=Object.fromEntries(contract.sources.flatMap(source=>Object.keys(source.probabilitiesPerEligibleLootContext).map(id=>[id,'world:witch_herbs/'+source.grass])));
 for(const [output,id]of Object.entries(seedSources))select(output,id);
 const renewalOwners={};
 for(const expected of contract.renewalRecipes){
  assert.deepEqual(clone(policy.additions.find(r=>r.id===expected.id)),expected,'Existing captured renewal payload changed');
  const output=typeof expected.args[0]==='string'?expected.args[0]:expected.args[0].id;
  select(output,expected.id);
  renewalOwners[expected.id]=locks.get(expected.id)??[];
  assert.deepEqual(renewalOwners[expected.id],[],'First-seed renewal must not require its own botanical research');
 }
 const recordId='createch2:research/pack/esoteric_records',recordToken='pack:createch2:esoteric_records',record=ledger.pack_routes.find(r=>r.id===recordId);
 assert.equal(record.unlock_node,'createch2:sci_01_empirical_method');
 assert.equal(record.output_count,2);assert.deepEqual(record.recipe.pattern,['BPG','CPC','GPB']);
 assert.equal(record.recipe.key.B,'enchanted:belladonna_flower');
 select(recordToken,recordId);select('createch2:esoteric_records',recordId);
 // Exclude alternative rock-category/tool and handle stock only here. The
 // native first-button debit is a quantity precondition, not a free tag token.
 const excluded=new Set([...tagMembers('#c:tools/knife').filter(id=>id!==knife.item),...tagMembers('#tfc:stones/loose/sedimentary').filter(id=>id!==knife.rawItem),...tagMembers('#c:rods/wooden').filter(id=>id!=='minecraft:stick')]);
 const rules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!excluded.has(id)&&(!allowed.has(id)||allowed.get(id).has(r.id)))}));
 const seed=new Map([...frontier].filter(([id])=>!excluded.has(id)&&!allowed.has(id)&&!id.startsWith('research:createch2:eso_')));
 const solved=solve(rules,seed),targets=[knife.head,knife.item,...Object.keys(seedSources),'minecraft:bone','tfc:quern','tfc:handstone','minecraft:bone_meal',...contract.renewalRecipes.map(r=>typeof r.args[0]==='string'?r.args[0]:r.args[0].id),recordToken,'research:createch2:eso_01_botanical_observation'];
 const uniqueTargets=[...new Set(targets)];
 const result={truth:uniqueTargets.every(id=>solved.reached.has(id))?'BOUNDED_NATIVE_TFC_GRASSES_TO_WITCH_HERBS_AND_ESOTERIC_RECORDS':'INCOMPLETE_FIRST_WITCH_HERBS',targets:uniqueTargets,missing:uniqueTargets.filter(id=>!solved.reached.has(id)),witnesses:Object.fromEntries(uniqueTargets.map(id=>[id,solved.witness.get(id)??null])),nativeContract:contract,renewalOwners,selectedSources:seedSources,selectedRecipes:{knap:knife.knapId,knife:knife.craftId,boneMeal:boneMealId,records:recordId,renewal:contract.renewalRecipes.map(r=>r.id)},quantityPlan:{knife:{heldLooseLimestone:2,firstModificationConsumes:1,headsProduced:1,sticksConsumed:1,knivesProduced:1,looseLimestoneRetained:1},belladonnaExample:{startingWildSeeds:1,nativeBones:1,boneMealProduced:3,flowerCrafts:2,seedCrafts:1,boneMealConsumed:3,boneMealRetained:0,flowersProduced:4,flowersForSeedCraft:1,flowersForRecords:2,flowersRetained:1,seedsProduced:2,seedsConsumed:2,seedsRetained:1,recordOtherInputs:{'minecraft:paper':3,'minecraft:charcoal':2,'tfc:ceramic/vessel':2},recordsProduced:2},scope:'Exact native/author-authored recipe batch ledger after the required random world drops and earlier workshop stocks are available. This is not a fixed collection, inventory, durability or expedition budget.'},negativeCases:[],limits:[...contract.limits,'Specific raw limestone is an earlier Copper workshop input; manufacture of all original terrestrial frontier stock and procurement quantities remain outside this bounded proof.','All six first seeds must enter through their selected grass hook. Reciprocal/self renewal remains enabled and cannot create the first seed from nothing. A native player-slaughter bone, quern and handstone supply bone meal; disabled vanilla bone crafting and conditional furnace alternatives are excluded only here.','The first record route retains SCI-01, paper, charcoal, vessels and the laboratory/pack dependencies of ESO-01. Later esoteric records do not bootstrap the first pack.','Native crop/soil/hoe and mature Mandrake behavior are not needed by the selected existing crafting-renewal route and are not inferred to work on TFC farmland.']};
 if(result.truth!=='BOUNDED_NATIVE_TFC_GRASSES_TO_WITCH_HERBS_AND_ESOTERIC_RECORDS')return result;
 const reject=(name,{outputs=[],ids=[],target})=>{
  const absent=new Set(outputs),removed=new Set(ids),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));
  assert(!check.reached.has(target),'First herb path bypasses '+name);
  result.negativeCases.push({name,target,rejected:true});
 };
 for(const [item,source]of Object.entries(seedSources))reject('no_first_source_'+item.split(':')[1],{ids:[source],target:item});
 for(const [name,outputs,target]of [
  ['no_native_knife',[knife.item],'enchanted:belladonna_seeds'],
  ['no_loose_limestone',[knife.rawItem],knife.item],
  ['no_wooden_stick',['minecraft:stick'],knife.item],
  ['no_prospecting',['capability:terrestrial_prospecting'],'enchanted:belladonna_seeds'],
  ['no_coastal_boat',['tfc:wood/boat/oak'],'enchanted:water_artichoke_seeds'],
  ['no_native_bone',['minecraft:bone'],'enchanted:belladonna_flower'],
  ['no_quern',['tfc:quern'],'enchanted:belladonna_flower'],
  ['no_handstone',tagMembers('#tfc:quern_handstones'),'enchanted:belladonna_flower'],
  ['no_bone_meal',['minecraft:bone_meal'],recordToken],
  ['no_empirical_owner',['research:createch2:sci_01_empirical_method'],recordToken],
  ['no_laboratory',['researchd:research_lab'],'research:createch2:eso_01_botanical_observation']
 ])reject(name,{outputs,target});
 for(const [name,id,target]of [['no_native_knap',knife.knapId,knife.item],['no_native_knife_craft',knife.craftId,knife.item],['no_native_quern_bone_meal',boneMealId,'enchanted:belladonna_flower'],['no_belladonna_flower_renewal','createch2:magic_research/plants/belladonna_flower',recordToken],['no_bootstrap_records',recordId,recordToken]])reject(name,{ids:[id],target});
 const later=new Set(['capability:kinetic_power','capability:eu_power','capability:fe_power','capability:steam_service',...recipes.flatMap(r=>r.outputs).filter(id=>id.startsWith('capability:')&&id.endsWith('_return_expedition_suppliers'))]);
 const primitive=solve(rules.map(r=>({...r,outputs:r.outputs.filter(id=>!later.has(id))})),new Map([...seed].filter(([id])=>!later.has(id))));
 assert([knife.item,...Object.keys(seedSources)].every(id=>primitive.reached.has(id)),'First seed collection unexpectedly requires factory power or space');
 result.firstSeedsNeedNoFactoryPowerOrSpace=true;
 result.firstSeedExcludedServices=[...later];
 result.renewalWithoutFactoryPower={reached:primitive.reached.has(recordToken),unreachedTargets:uniqueTargets.filter(id=>!primitive.reached.has(id)),limit:'The selected first-seed/knapped-knife collection passes without factory power. Quern manufacture and research renewal still compose the stated earlier workshop, including its existing powered tool-fitting suppliers; unpowered renewal is not certified.'};
 return result;
}
