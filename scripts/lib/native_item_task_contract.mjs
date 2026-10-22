import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';

// Only the reviewed ordinary material/tool stacks with incidental TFC heat
// are classified here. Item-filter stacks and other components remain open.
export function itemTaskComponentReview(task,reviewedItems){
 const mode=task.match_components??'none',components=Object.keys(task.item?.components??{});
 if(!['none','fuzzy','strict'].includes(mode))return {mode,requiresReview:true,reason:'Unreviewed matching setting'};
 if(mode!=='none')return {mode,requiresReview:true,reason:'Explicit component matching retained'};
 if(!components.length)return {mode,requiresReview:false,ignoredComponents:[]};
 if(components.length===1&&components[0]==='tfc:heat'&&reviewedItems.includes(task.item.id))return {mode,requiresReview:false,ignoredComponents:components,reason:'Reviewed ordinary literal item; native NONE comparison ignores display heat'};
 return {mode,requiresReview:true,reason:'Unreviewed component or item-filter stack'};
}

export function nativeItemTaskContract(root){
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_item_task.json',import.meta.url),'utf8'));
 const code=Object.fromEntries(Object.entries(fixture.nativeClasses).map(([key,[jar,name]])=>[key,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:4*1024*1024})]));
 const hashes=Object.fromEntries(Object.entries(code).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')]));assert.deepEqual(hashes,fixture.nativeCodeSha256,'Native FTB item task matching changed');
 const method=(key,name)=>{const body=code[key].split(/\n  (?=\S)/).find(s=>s.includes(' '+name+'('));assert(body,'Missing native method '+name);return body;};
 const taskRead=method('task','readData');assert(taskRead.includes('String match_components')&&taskRead.includes('NameMap.get:')&&code.task.includes('ComponentMatchType.NONE:'));
 assert(/Field NONE:[\s\S]*Method values:[\s\S]*NameMap.of:/.test(code.mode),'Missing native NONE default');
 const get=method('names','get'),nullable=method('names','getNullable');assert(get.includes('Field defaultValue:')&&get.includes('Method getNullable:')&&nullable.includes('String.isEmpty:')&&nullable.includes('aconst_null')&&nullable.includes('Map.get:'));
 const compare=method('matching','areItemStacksEqual'),branch=/tableswitch\s+\{\s*\/\/ 0 to 2\s+0:\s+(\d+)/.exec(compare);assert(branch&&new RegExp('\\n\\s*'+branch[1]+': iconst_1').test(compare));assert(compare.includes('ItemStack.getItem:')&&compare.includes('ItemStack.isSameItemSameComponents:'));
 assert(/String NONE\s*\n\s+\d+: iconst_0/.test(code.mode),'NONE ordinal changed');
 const match=method('matching','doesItemMatch');assert(match.includes('getFilterAdapter:')&&match.includes('areItemStacksEqual:')&&method('task','test').includes('ItemMatchingSystem.doesItemMatch:'));
 const item=fixture.reviewedLiteralItems[0],stack={type:'item',item:{id:item,components:{'tfc:heat':{}}}},review=t=>itemTaskComponentReview(t,fixture.reviewedLiteralItems);
 assert(!review(stack).requiresReview);assert(!review({...stack,match_components:'none'}).requiresReview);assert(!review({...stack,item:{id:item,components:{'tfc:heat':{temperature:800}}}}).requiresReview);
 for(const mode of ['strict','fuzzy','unknown'])assert(review({...stack,match_components:mode}).requiresReview);
 assert(review({...stack,item:{id:item,components:{'minecraft:custom_data':{}}}}).requiresReview);assert(review({...stack,item:{id:'mission02:unreviewed_filter',components:{'tfc:heat':{}}}}).requiresReview);assert(review({type:'item',item:{id:item},match_components:'strict'}).requiresReview);
 return {truth:'STATIC_NATIVE_FTB_LITERAL_HEAT_COMPONENT_POLICY',nativeCodeSha256:hashes,defaultMode:'none',reviewedLiteralItems:fixture.reviewedLiteralItems,checkedCases:9,limits:['Installed native FTB ItemTask/NameMap/default enum and ordinary-item matcher bytecode only. No ItemTask, ItemStack, inventory detection, quest completion, team or save operation is executed.','The reviewed ordinary material/tool IDs use native NONE matching when match_components is absent or none; their serialized TFC heat is display data for this predicate. This does not change their recipe/supplier requirements.','Explicit strict/fuzzy or unknown settings remain component constraints, even when a task stack has no explicit components. Unreviewed item IDs/components and item-filter adapter stacks remain excluded from this narrow classification.','Loaded filter adapters, mixins/providers, actual task decoding, native recipe/item registration, quantities, crafting-only detection and successful completion remain runtime qualification. Quest/task/reward identities and saved progress are untouched.']};
}
