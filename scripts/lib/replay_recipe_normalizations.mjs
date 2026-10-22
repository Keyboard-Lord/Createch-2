import assert from 'node:assert/strict';
import {matchesRecipeModification} from './capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs} from './recipe_dependency_refs.mjs';

// Replay reviewed literal food and one native compatibility normalization,
// not arbitrary callbacks. Component-sensitive inputs retain their identities.
export function replayRecipeNormalizations(id, original, modifications) {
  const data=structuredClone(original), applied=[];
  const sources={input:new Set(recipeInputRefs(original).filter(r=>r.kind==='item').map(r=>r.id)),output:new Set(recipeOutputRefs(original).filter(r=>r.kind==='item').map(r=>r.id))};
  function rewrite(value, from, to, input) {
    if(Array.isArray(value))return value.map(v=>rewrite(v,from,to,input));
    if(typeof value==='string')return value===from?to:value;
    if(!value||typeof value!=='object')return value;
    if(input&&(value.components||value.type==='neoforge:components'))return value;
    if(value.tag)return value;
    const field=value.item===from?'item':value.id===from?'id':null;
    if(field){const copy={...value};delete copy[field];copy[to.startsWith('#')?'tag':field]=to.startsWith('#')?to.slice(1):to;return copy;}
    return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,['ingredient','ingredients','children','items','stack'].includes(k)?rewrite(v,from,to,input):v]));
  }
  for(const m of modifications){
    const input=m.kind==='input';assert(input||m.kind==='output');
    let source;const target=m.args[1];
    if(m.file==='kubejs/server_scripts/compatibility/integration_recipes.js'){
      assert(input);assert.deepEqual(structuredClone(m.filter),{id:'mekanism:control_circuit/ultimate'});
      assert.deepEqual(structuredClone(m.args),[{match:'mekanism:ingot_bronze',exact:true},'#c:ingots/bronze']);source=m.args[0].match;
    }else{
      assert.equal(m.file,'kubejs/server_scripts/food/food_authority.js','Unreviewed normalization source');
      source=input?m.args[0]?.match:m.args[0];
      assert.equal(m.filter[input?'input':'output'],source);if(input)assert.equal(m.args[0].exact,true);
      assert(source.startsWith('minecraft:')&&(input?target.startsWith('#createch2:food/'):target.startsWith('tfc:food/')),'Unreviewed normalization chain');
    }
    assert.equal(typeof source,'string');assert.equal(typeof target,'string');
    if(!sources[m.kind].has(source))continue;
    const match=matchesRecipeModification(m,id,data);if(match!==true)continue;
    const fields=input?['ingredient','ingredients','input','inputs','item_inputs','base','addition']:['result','results','output','outputs','item_outputs'];
    const before=JSON.stringify(data);
    for(const field of fields)if(data[field]!==undefined)data[field]=rewrite(data[field],source,target,input);
    if(input&&data.key)for(const key of Object.keys(data.key))data.key[key]=rewrite(data.key[key],source,target,true);
    if(JSON.stringify(data)!==before)applied.push({kind:m.kind,source,target});
  }
  return {data,applied};
}
