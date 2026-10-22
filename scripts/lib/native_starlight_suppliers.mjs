import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

export function nativeStarlightSuppliers({root,native,policy,removals,world}) {
  assert.equal(world.starlightWorld?.truth,'STATIC_NATIVE_GATEKEEPER_STARLIGHT_FEEDSTOCKS');
  const recipes={},events={};
  for(const [mineral,input] of [['deepsilver','raw_deepsilver'],['aethersent','raw_aethersent']]) {
    const id=`eternal_starlight:${mineral}_ingot_smelting_from_${input}`,rows=native.recipes[id]??[];
    assert.equal(rows.length,1,id);
    const current=JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',rows[0].provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));
    assert.deepEqual(current,rows[0].data);
    const event=replayRecipeEventEntry(id,current,'native',policy.modifications,removals);
    assert(!event.removed,id+' must remain a native supplier');
    assert.equal(event.data.type,'minecraft:smelting');
    assert.deepEqual(event.data.ingredient,{item:'eternal_starlight:'+input});
    assert.deepEqual(event.data.result,{count:1,id:'eternal_starlight:'+mineral+'_ingot'});
    assert.equal(event.data.cookingtime,200);
    recipes[id]=event.data;events[id]=event.applied;
  }
  return {truth:'STATIC_NATIVE_STARLIGHT_SMELTING',recipes,events,world:world.starlightWorld,observedOutputs:false,stockCredited:0,limits:['Two retained native furnace recipes bind raw Deepsilver and raw Aethersent to the required ingots. The existing furnace/fuel capability is still required; quantities, operation and loaded matching remain unobserved.']};
}
