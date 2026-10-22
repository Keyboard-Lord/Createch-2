import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity'),baseline=JSON.parse(fs.readFileSync(path.join(state,'baseline.json'))),campaign=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/config/createch2_campaign.json'))),rows=[];
const numeric=x=>Number.parseFloat(x??1),canon=new Set(campaign.canonical_ages.map(a=>a.quest));
const overlaps=(a,b)=>Math.abs(numeric(a.x)-numeric(b.x))<(numeric(a.size)+numeric(b.size))/2+.2&&Math.abs(numeric(a.y)-numeric(b.y))<(numeric(a.size)+numeric(b.size))/2+.2;
for(const age of campaign.canonical_ages){const file=path.join(liveRoot,age.file),text=fs.readFileSync(file,'utf8'),chapter=readQuestSnbt(text),edits=new Map();
 for(const q of chapter.quests){const old=baseline.quests.find(o=>o.id===q.id);if(!canon.has(q.id)&&old.tags?.includes('role_capstone')&&q.tags?.includes('discipline_mastery')){
  const shape=q.tags.includes('role_required')?'createch_target':'createch_optional';
  if(q.size!=='2.1d'||q.shape!==shape){edits.set(q.id,{size:'2.1d',shape});q.size='2.1d';q.shape=shape;}
 }}
 const q=chapter.quests.find(q=>q.id===age.quest),others=chapter.quests.filter(o=>o!==q),origin={x:numeric(q.x),y:numeric(q.y)};
 if(others.some(o=>overlaps(q,o))){const positions=[];for(let dx=-8;dx<=8;dx+=.25)for(let dy=-8;dy<=8;dy+=.25)positions.push({x:origin.x+dx,y:origin.y+dy,cost:dx*dx+dy*dy});positions.sort((a,b)=>a.cost-b.cost||a.y-b.y||a.x-b.x);const free=positions.find(p=>others.every(o=>!overlaps({...q,x:p.x,y:p.y},o)));assert(free,`No local clearance for age ${age.age}`);const next={x:Number(free.x.toFixed(3))+'d',y:Number(free.y.toFixed(3))+'d'};edits.set(q.id,{...(edits.get(q.id)??{}),...next});Object.assign(q,next);}
 assert(others.every(o=>!overlaps(q,o)),`Canonical icon crowding ${age.age}`);
 if(process.argv.includes('--check'))assert.equal(edits.size,0,`${age.file}: spacing/hierarchy drift`);
 else {let out=text.replace(/\t\t\{\n[\s\S]*?\n\t\t\}(?=\n|$)/g,block=>{const id=/^\t\t\tid: "([^"]+)"/m.exec(block)?.[1];if(!edits.has(id))return block;for(const [key,value]of Object.entries(edits.get(id))){const re=new RegExp('^\\t\\t\\t'+key+': [^\\n]+','m');assert(re.test(block));block=block.replace(re,'\t\t\t'+key+': '+(key==='shape'?JSON.stringify(value):value));}return block;});readQuestSnbt(out);if(out!==text)fs.writeFileSync(file,out);}
 rows.push({age:age.age,quest:q.id,x:q.x,y:q.y,size:q.size,minimumIconGap:.2,edits:[...edits].map(([id,fields])=>({id,fields}))});
}
if(!process.argv.includes('--check'))fs.writeFileSync(path.join(state,'layout-changes.json'),JSON.stringify({truth:'VERIFIED_STATIC_LAYOUT',limits:'Axis-aligned icon clearance only; actual questbook rendering and labels remain unviewed while Minecraft is held.',ages:rows},null,2)+'\n');
console.log(JSON.stringify({ages:17,canonicalIconOverlap:0,minimumGap:.2,gameRuntime:false}));
