import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,compileRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
import {leverFixture,reviewLeverRepair,tfcLeverStock} from './lib/tfc_lever_stock.mjs';
const f=leverFixture(),target=path.join(liveRoot,'kubejs/data/minecraft/recipe/lever.json');
const jar=path.resolve(liveRoot,'../../Install/versions/1.21.1/1.21.1.jar');
assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',jar,f.nativePath],{encoding:'utf8'})),f.before);
reviewLeverRepair(f.after,f.before);
const out=JSON.stringify(f.after,null,2)+'\n',check=process.argv.includes('--check');
if(check)assert.equal(fs.readFileSync(target,'utf8'),out,'Lever source/output drift');
else {if(fs.existsSync(target))assert.deepEqual(JSON.parse(fs.readFileSync(target)),f.after,'Unowned lever override');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,out);}
const native=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'))),tags=staticBulkReplicationPolicy(liveRoot,native,{includeAuthored:true});
const ledger=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'))),locks=new Map([[f.id,ledger.nodes.filter(n=>n.recipes_unlocked.includes(f.id)).map(n=>'research:'+n.id)]]);
let result;
for(const optional of [false,true]) {
  const policy=captureRecipePolicy(liveRoot,optional);
  result=tfcLeverStock({root:liveRoot,native,authored:new Map([[f.id,JSON.parse(fs.readFileSync(target))]]),policy,removals:policy.removals.map(r=>compileRecipeFilter(r.filter)),tags,locks});
}
console.log(JSON.stringify({truth:result.truth,mode:check?'check':'write',optionalProviderModes:2,repairNegativeCases:result.repairNegativeCases.length,stockNegativeCases:result.stockNegativeCases.length,tfcCobblestones:result.acceptedTfcCobblestones,tfcTwigs:result.acceptedTfcTwigs,minimum:result.minimum}));
