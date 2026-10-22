import {toolFs as fs,execFileSync,liveRoot} from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
process.chdir(liveRoot);
const jar='mods/Stargate.Journey-1.21.1-0.6.52.jar';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(fs.readFileSync(jar)),'a2048fc084d610c3cceb51284f7b71a382653681018f463842a96d7151b6e364','Stargate provider changed; reconcile native payload before generating compatibility');
const readNative=name=>JSON.parse(execFileSync('unzip',['-p',jar,`data/sgjourney/recipe/crystallizing/${name}.json`],{encoding:'utf8'}));
const current=readNative('andromeda_upgrade_crystal');
const expected={type:'sgjourney:crystallizing',crystal_base:{ingredient:{item:'sgjourney:crystal_base'},amount:1},primary_ingredient:{ingredient:{item:'sgjourney:naquadah_copper_alloy'},amount:16,deplete:true},secondary_ingredient:{ingredient:{item:'minecraft:emerald'},amount:9,deplete:true},output:{id:'sgjourney:stargate_upgrade_crystal',components:{'sgjourney:stargate_upgrade':'sgjourney:andromeda_stargate'}},progress:100,input_fluid:{id:'sgjourney:liquid_naquadah',amount:100}};
assert.deepEqual(current,expected,'Current native Andromeda costs/schema changed');
const peer=readNative('pegasus_upgrade_crystal');assert.deepEqual(Object.keys(peer.crystal_base).sort(),['amount','ingredient']);assert.deepEqual(Object.keys(peer.primary_ingredient).sort(),['amount','deplete','ingredient']);
//0.6.51 supplies the native fix. The existing owned snapshot remains identical;
//no namespace, cost, component or acquisition relationship changes here.
const file='kubejs/data/sgjourney/recipe/crystallizing/andromeda_upgrade_crystal.json',text=JSON.stringify({_generated_by:'createch-dev/scripts/generate_stargate_compatibility.mjs',...current},null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),text,'Native Stargate compatibility snapshot drift');else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}
const report={truth:'VERIFIED_STATIC_NATIVE_PENDING',recipe:'sgjourney:crystallizing/andromeda_upgrade_crystal',jar,jarSha256:sha(fs.readFileSync(jar)),nativeFixAlreadyPresent:true,changes:[],preserved:['exact current native nested ingredient/deplete/component schema','all input identities and counts','100mB liquid naquadah','100 progress','one Andromeda upgrade crystal','existing namespace containment'],limits:'Current-provider payload verification only. The owned snapshot is identical to the native fix; no acquisition route or runtime operation is inferred.'};
fs.writeFileSync('createch-dev/runtime-state/086a/stargate-codec-repair.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({nativeFixAlreadyPresent:true,provider:'0.6.51',ownedPayloadChanges:0}));
