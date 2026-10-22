import fs from 'node:fs';
import path from 'node:path';
import {liveRoot as root,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,compileRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {earlySpaceEntry} from './lib/early_space_entry.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const authored=new Map();for(const p of walk(path.join(root,'kubejs/data')).filter(p=>/\/recipe\/.+\.json$/.test(p))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(p);authored.set(m[1]+':'+m[2],read(p));}
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json')),policy=captureRecipePolicy(root,true),ledger=read(path.join(root,'kubejs/config/createch2_research_tree.json'));
const result=earlySpaceEntry({root,developmentRoot,native,authored,policy,removals:policy.removals.map(r=>compileRecipeFilter(r.filter)),ledger});
console.log(JSON.stringify(result));
