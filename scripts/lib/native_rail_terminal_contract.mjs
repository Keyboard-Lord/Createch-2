import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
import{replayRecipeEventEntry}from'./native_recipe_event_contract.mjs';
import{railTerminalStockPlan}from'./rail_terminal_stock_plan.mjs';
const method=(s,name)=>{const i=s.indexOf(name);assert(i>=0,name);const t=s.slice(i),n=/\n  (?:public |private |protected |static \{)/.exec(t);return n?t.slice(0,n.index):t;};

export function nativeRailTerminalContract({root,native,authored,policy,removals,tags,stock,circuits,wrought,iron,shaft,steel}){
 const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_rail_terminals.json',import.meta.url))),code={},hashes={},recipes={},events={};
 assert.equal(stock.truth,'STATIC_NATIVE_RAIL_STOCK_PACKET');assert.equal(circuits.truth,'STATIC_NATIVE_FOUR_RAIL_CONTROLLER_CIRCUITS');
 for(const[k,[jar,name,v]]of Object.entries(f.nativeClasses)){
  const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:8*1024*1024});code[k]=text;hashes[k]=crypto.createHash('sha256').update(v?text.replace(/^Classfile[^\n]*\n/,''):text).digest('hex');assert.equal(hashes[k],f.nativeCodeSha256[k],k+' terminal native drift');
 }
 assert.equal(hashes.master,steel.nativeCodeSha256.master);assert.equal(hashes.utilityV,circuits.nativeCodeSha256.utilityV);
 const review=c=>{
  const tick=method(c.master,'public void tick('),can=method(c.master,'private boolean canProcess(');
  assert(/Field fuel:I\n[^\n]*ifne\s+9\n[^\n]*iconst_0\n[^\n]*ireturn/.test(can),'Completion must retain native positive fuel check');
  const debit=tick.indexOf('blastFurnaceFuelConsumption:'),subtract=tick.indexOf('isub',debit),complete=tick.indexOf('Method canProcess:');assert(debit>=0&&subtract>debit&&complete>subtract);
  assert(/Field fuelConsumeTimer:I[^]*if_icmplt\s+192/.test(tick));assert(/Field timer:I\n[^\n]*ifne\s+389/.test(tick));
  assert(tick.indexOf('IndustrialBlastingRecipe.getPrimaryResult:')>complete);assert(tick.includes('ForceableFluidTank.forceFill:'));
  assert(/public static boolean easyHopper;[^]*?flag="easy_hopper"/.test(c.utilityV));
 };review(code);
 const negativeCases=[];
 for(const[name,k,a,b]of [['completion_ignores_zero_fuel','master','ifne          9','ifge          9'],['missing_fuel_timer_threshold','master','blastFurnaceFuelConsumption:','unknownFuelConsumption:'],['missing_completion_gate','master','Method canProcess:','Method unknownProcess:'],['missing_weightless_completion_output','master','IndustrialBlastingRecipe.getPrimaryResult:','IndustrialBlastingRecipe.unknown:'],['wrong_disabled_hopper_flag','utilityV','flag="easy_hopper"','flag="easy_sticks"']]){
  const bad={...code,[k]:code[k].replaceAll(a,b)};assert.notEqual(bad[k],code[k]);assert.throws(()=>review(bad),name);negativeCases.push({name,rejected:true});
 }
 for(const[id,expected]of Object.entries(f.recipes)){
  const kind=f.kinds[id];let actual;
  if(kind==='native'){
   assert(!authored.has(id));assert.deepEqual(native.recipes[id],f.nativeRows[id]);assert(f.nativeRows[id].every(r=>JSON.stringify(r.data)===JSON.stringify(expected)));
   for(const row of f.nativeRows[id])assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',row.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'})),row.data);
   actual=native.recipes[id][0].data;
  }else actual=authored.get(id);
  assert.deepEqual(actual,expected,id);assert(!policy.additions.some(r=>r.id===id));const event=replayRecipeEventEntry(id,actual,kind,policy.modifications,removals);assert(!event.removed);
  if(kind==='native')assert.deepEqual(event.data,expected);else assert.deepEqual(event.data,stock.recipes[id],id+' prior owned recipe');
  recipes[id]=event.data;events[id]={kind,normalizations:event.applied};
 }
 const hopper=recipes[f.ids.hopper],chests=recipes[f.ids.chests],count=(r,k)=>r.pattern.join('').split(k).length-1;
 assert.equal(count(hopper,'p'),5);assert.equal(count(hopper,'c'),1);assert.equal(hopper.result.count,2);assert.equal(count(chests,'l'),8);assert.equal(chests.result.count,4);
 for(const[tag,item]of [['minecraft:logs','tfc:wood/log/oak'],['c:plates/steel','modern_industrialization:steel_plate'],['c:ingots/steel','tfmg:steel_ingot'],['c:tools/hammer','tfc:stone/hammer/igneous_intrusive']])assert(tags.hasTag(tag,item),tag);
 assert.deepEqual(native.recipes['quark:tweaks/crafting/utility/misc/easy_hopper'],f.excludedEasyHopperRows);
 for(const row of f.excludedEasyHopperRows){assert.deepEqual(row.data['neoforge:conditions'],[{type:'zeta:flag',flag:'easy_hopper'}]);assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',row.provider),'data/quark/recipe/tweaks/crafting/utility/misc/easy_hopper.json'],{encoding:'utf8'})),row.data);}
 const easyHopper=JSON.parse(execFileSync('/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',['-c','import json,sys,tomllib; c=tomllib.load(open(sys.argv[1],"rb")); print(json.dumps(c["tweaks"]["utility_recipes"]["Easy Hopper"]))',path.join(root,'config/quark-common.toml')],{encoding:'utf8'}));assert.equal(easyHopper,false);
 assert.equal(wrought.recipes[wrought.ids.pellet].ingredients.length,4);assert.equal(wrought.recipes[wrought.ids.briquet].ingredients.length,4);assert.equal(wrought.recipes[wrought.ids.hammer].result.count,5);assert.equal(wrought.recipes[wrought.ids.bloom].fluid.amount,100);
 const plan=railTerminalStockPlan({stock,circuits,wrought,iron,shaft});
 return {truth:'STATIC_NATIVE_SELECTED_RAIL_TERMINALS',ids:f.ids,recipes,events,nativeCodeSha256:hashes,negativeCases,disabledEasyHopperRetained:true,plan,quantityPlan:plan.quantityPlan,finitePlan:plan.finitePlan,limits:plan.limits};
}
