import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

// Native pours create blocks in the world. The table's item supplier is its
// cooled block loot (a vanilla pane), not the recipe's poured-glass block ID.
export function nativeClearGlass({root,native,authored,policy,removals,tags,locks}) {
  const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_clear_glass.json',import.meta.url)));
  const code={},hashes={},recipes={},events={};
  for(const[k,[jar,name]]of Object.entries(f.nativeClasses)) {
    const s=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:32*1024*1024});
    code[k]=s;hashes[k]=crypto.createHash('sha256').update(s).digest('hex');
    assert.equal(hashes[k],f.nativeCodeSha256[k],k+' native glass drift');
  }
  const required={
    basin:['BlockState.isAir:','Helpers.DIRECTIONS:','Direction.UP:','TFCTags$Blocks.GLASS_BASIN_BLOCKS:'],
    cooling:['Field animationTicks:I','bipush        100','Level.setBlockAndUpdate:','BlockItem.getBlock:'],
    pipe:['GlassBasinBlock.isValid:','GlassOperation.BASIN_POUR:','GlassOperation.TABLE_POUR:','GlassOperation.hasRequiredTemperature:','Method consumeBlowpipe:','GlassBasinBlockEntity.setGlassItem:','HotPouredGlassBlockEntity.setGlassItem:','RandomSource.nextFloat:','BlowpipeItem.transform:'],
    operation:['Heat.FAINT_RED:','public boolean hasRequiredTemperature(','TFCItems.CERAMIC_BLOWPIPE_WITH_GLASS:'],
    heat:['String FAINT_RED','float 480.0f'],
    hotItems:['Method isHoldingInsulatingOrGlassTool:','String glass_blowpipes','Method isHoldingGlassTools:','if_acmpeq'],
    tableCooling:['Method doFloodFill:','TFCTags$Blocks.GLASS_POURING_TABLE:','Level.setBlockAndUpdate:','long 4000l','bipush        15'],
    tableBlock:['TFCItems.PADDLE:','HotPouredGlassBlockEntity.flattenFirstBlock:'],
    pouredBlock:['BlockState.isFaceSturdy:','TFCTags$Blocks.SOLID_TOP_FACE:']
  };
  const review=c=>{for(const[k,terms]of Object.entries(required))for(const t of terms)assert(c[k].includes(t),k+':'+t);};
  review(code);const nativeNegativeCases=[];
  for(const[k,terms]of Object.entries(required)){assert.throws(()=>review({...code,[k]:code[k].replaceAll(terms[0],'BROKEN_GLASS_BINDING')}),k);nativeNegativeCases.push({name:'missing_'+k+'_binding',rejected:true});}
  for(const[id,expected]of Object.entries(f.nativeRows)) {
    assert.deepEqual(native.recipes[id],expected,id+' native index');
    assert(!authored.has(id)&&!policy.additions.some(r=>r.id===id));
    assert.deepEqual(locks.get(id)??[],[]);
    for(const row of expected){
      const jar=row.provider==='1.21.1.jar'?path.resolve(root,'../../Install/versions/1.21.1/1.21.1.jar'):path.join(root,'mods',row.provider);
      assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',jar,'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'})),row.data);
    }
    const mod=expected.filter(r=>r.provider!=='1.21.1.jar'),selected=mod.length?mod:expected;assert.equal(selected.length,1);
    const e=replayRecipeEventEntry(id,selected[0].data,'native',policy.modifications,removals);
    assert(!e.removed);assert.deepEqual(e.data,selected[0].data);
    recipes[id]=e.data;events[id]={provider:selected[0].provider,normalizations:e.applied};
  }
  assert.deepEqual(recipes[f.ids.pane],{'neoforge:conditions':[{type:'neoforge:false'}]},'Do not resurrect the disabled vanilla six-glass pane craft');
  for(const id of Object.values(f.ids).filter(id=>id!==f.ids.pane))assert(!(recipes[id]['neoforge:conditions']??[]).length);
  // Inspect only these six resources across the selected provider set. Changes
  // to a higher mod or authored layer must invalidate this admission.
  const python='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
  const resources=JSON.parse(execFileSync(python,['-c',
    'import sys,json,zipfile,pathlib;sys.path.insert(0,sys.argv[1]);from runtime_providers import runtime_providers;root=pathlib.Path(sys.argv[2]);names=json.loads(sys.argv[3]);out={n:[] for n in names}\nfor p in runtime_providers(root/"mods")[0]:\n with zipfile.ZipFile(p) as z:\n  for n in names:\n   if n in z.namelist():out[n].append({"provider":p.name,"data":json.loads(z.read(n))})\nfor n in names:\n p=root/"kubejs"/n\n if p.exists():out[n].append({"provider":"authored","data":json.loads(p.read_text())})\nprint(json.dumps(out))',
    path.dirname(new URL(import.meta.url).pathname),root,JSON.stringify(Object.keys(f.resources))],{encoding:'utf8',maxBuffer:1024*1024}));
  for(const[p,row]of Object.entries(f.resources))assert.deepEqual(resources[p],[row],p+' selected resource layers');
  const glassLoot=f.resources['data/minecraft/loot_table/blocks/glass.json'].data,paneLoot=f.resources['data/tfc/loot_table/blocks/poured_glass.json'].data;
  for(const[loot,item]of [[glassLoot,'minecraft:glass'],[paneLoot,'minecraft:glass_pane']])assert.deepEqual(loot.pools,[{name:'loot_pool',rolls:1,entries:[{type:'minecraft:item',name:item}],conditions:[{condition:'minecraft:survives_explosion'}]}]);
  for(const item of ['tfc:blowpipe_with_glass','tfc:ceramic_blowpipe_with_glass'])assert(tags.hasTag('tfc:glass_blowpipes',item));
  assert(tags.hasTag('c:glass_blocks','minecraft:glass'));assert(tags.hasTag('c:glass_panes','minecraft:glass_pane'));
  assert(tags.hasTag('tfc:glass_potash','tfc:powder/saltpeter'));assert(tags.hasTag('c:sands/silica','tfc:sand/white'));
  assert(tags.hasTag('tfc:clay_knapping','minecraft:clay_ball'));
  const cfg=fs.readFileSync(path.join(root,'config/tfc-server.toml'),'utf8');assert(/^\s*pitKilnTemperature\s*=\s*1400\s*$/m.test(cfg));
  assert.equal(recipes[f.ids.fired].temperature,1399);assert.equal(recipes[f.ids.lime].temperature,840);
  const model=({air=true,brassNeighbours=5,temperature=500,heldLoadedPipe=true,paddle=true,table=true,flattenBeforeExpiry=true,cool=true,breakNormally=true,breakPipes=true}={})=>{
    assert(air&&brassNeighbours===5&&temperature>480&&temperature<1500&&heldLoadedPipe&&paddle&&table&&flattenBeforeExpiry&&cool&&breakNormally);
    return {glassBlocks:1,glassPanes:1,glassBatchesCrafted:4,glassBatchesSpent:2,glassBatchesHeld:2,ceramicPipesProvided:2,ceramicPipesRemaining:breakPipes?0:2,basinBrassBlocks:5,isolatedTableBrassBlocks:1,brassBlocksCrafted:8,brassBlocksUnplaced:2,brassSheets:4,planks:1,paddleLumber:4,paddleTwigs:1,clayBallsForWorstCasePipes:10,heatUpAndFuelQualified:false};
  };
  const processVectors={bothPipesBreakAfterTheirSuccessfulPours:model(),bothPipesSurvive:model({breakPipes:false})},processNegativeCases=[];
  for(const[name,options]of [['blocked_basin',{air:false}],['one_basin_wall_missing',{brassNeighbours:4}],['at_faint_red_not_hot_enough',{temperature:480}],['melted_ceramic_load',{temperature:1500}],['loaded_pipe_not_held',{heldLoadedPipe:false}],['no_paddle',{paddle:false}],['no_brass_table',{table:false}],['unflattened_glass_expires',{flattenBeforeExpiry:false}],['harvest_while_hot',{cool:false}],['explosive_break_not_credited',{breakNormally:false}]]){assert.throws(()=>model(options),name);processNegativeCases.push({name,rejected:true});}
  return {truth:'STATIC_NATIVE_TFC_CLEAR_GLASS_AND_PANE_HANDOFFS',ids:f.ids,recipes,events,resources,nativeCodeSha256:hashes,nativeNegativeCases,processVectors,processNegativeCases,
    limits:['Only plain silica basin/table pours are newly admitted. The table produces placed TFC poured glass; only its cooled vanilla pane loot is credited to inventory. The disabled vanilla pane craft stays excluded.',
      'This is a conditional supplier and recipe packet, not allocated or observed stock. Add one saltpeter powder, one flux heated to lime, one white sand, ten clay balls for two independent ceramic pipes, four brass sheets, one plank, four lumber and one twig; earlier procurement, tools, fuel and heating services remain conditions. No prior ring, brass, saltpeter, charcoal, machine or fluid reserve is spent by this model admission.',
      'Build a five-block brass basin with an empty center; use a separate isolated single-block brass pouring table with air above. Keep the loaded pipe in hand, heat it to above480C below its1500C melt recipe, basin-pour once and table-pour once; flatten the table pour with a paddle before expiry. Allow both outputs to cool and break normally. Two ceramic pipes cover breakage after both successful pours; no guaranteed return is assumed.',
      'Actual clay collection,1399C firing,840C lime processing, heat-up/fuel amounts, temperature loss in transfer, native loading, survival/access, cooling, harvesting and inventory require runtime qualification. This does not qualify a locomotive boiler, fluid-pipe batch or whole17-age closure.']};
}

export function firstNativeClearGlass({contract,recipes,frontier,solve,tagMembers}) {
  const ids=contract.ids,targets=['minecraft:glass','minecraft:glass_pane'];
  const selected=new Map([[targets[0],ids.glass],[targets[1],ids.table],['tfc:silica_glass_batch',ids.batch],['tfc:ceramic_blowpipe',ids.fired],['tfc:ceramic/unfired_blowpipe',ids.unfired]]);
  const absent=new Set(['tfc:blowpipe','tfc:gem_saw','minecraft:tinted_glass','tfc:poured_glass',...targets,'#c:glass_blocks','#c:glass_panes']);
  const seed=new Map([...frontier].filter(([id])=>!absent.has(id)));
  const rules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id)||targets.includes(id)).filter(id=>!selected.has(id)||r.id===selected.get(id))}));
  const result=solve(rules,seed),witnesses=Object.fromEntries(targets.map(id=>[id,result.witness.get(id)??null]));
  assert.deepEqual(witnesses,{'minecraft:glass':ids.glass,'minecraft:glass_pane':ids.table});
  const negativeCases=[];
  for(const[name,blocked]of [['silica_batch',['tfc:silica_glass_batch']],['ceramic_pipe',['tfc:ceramic_blowpipe']],['brass_basin_and_table',['tfc:metal/block/brass']],['heat',['capability:primitive_heat']],['glass_potash',tagMembers('#tfc:glass_potash')],['white_sand',tagMembers('#c:sands/silica')],['lime',['tfc:powder/lime']],['paddle',['tfc:paddle']]]){
    const removed=new Set(blocked),s=new Map([...seed].filter(([id])=>!removed.has(id))),rs=rules.map(r=>({...r,outputs:r.outputs.filter(id=>!removed.has(id))})),n=solve(rs,s);
    const target=name==='paddle'?targets[1]:targets[0];assert(!n.reached.has(target),'Native clear glass bypasses '+name);negativeCases.push({name,target,rejected:true});
  }
  assert(!rules.some(r=>r.id===ids.pane),'Disabled vanilla pane recipe was admitted');
  assert(!result.reached.has('tfc:poured_glass'),'Placed table glass must not become a free inventory block');
  return {truth:'BOUNDED_NATIVE_TFC_CLEAR_GLASS_AND_PANE',witnesses,negativeCases,contract,scope:'Kind-level reachability from the stated Copper workshop frontier, with native silica/ceramic producers selected and inherited glass/panes/gem saw removed. Recipe packet quantities are conditional, not funded locomotive stock.'};
}
