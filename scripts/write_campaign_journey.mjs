// Player instructions at the existing age entries; no new quests or task gates.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot, developmentRoot} from './lib/live_paths.mjs';
import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
const source=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/campaign_journey.json')));
const campaign=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/config/createch2_campaign.json')));
const semantics=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/static_campaign_semantics.json')));
const replacements={};
for(const age of source.ages){const id=campaign.canonical_ages[age.age].entry;
 replacements[`quest.${id}.quest_desc`]=[age.purpose,...age.instructions,age.connections,age.reliefAndRecovery];
 if(age.title)replacements[`quest.${id}.title`]=age.title;
}
for(const q of source.productionQuests)replacements[`quest.${q.id}.quest_desc`]=[...q.instructions,q.mechanicalDuty];
const langDir=path.join(liveRoot,'config/ftbquests/quests/lang');
let locales=0;
for(const name of fs.readdirSync(langDir).filter(n=>n.endsWith('.snbt'))){
 const file=path.join(langDir,name);let text=fs.readFileSync(file,'utf8');
 // The canonical semantic descriptions own later mechanical corrections and
 // translations. Journey text remains the fallback for its other fields.
 const descriptions={...semantics.descriptions,...(semantics.localizations[name.slice(0,-5)]?.descriptions??{})};
 for(const [key,journeyValue]of Object.entries(replacements)){
  const id=/^quest\.([^.]+)\.quest_desc$/.exec(key)?.[1],value=descriptions[id]??journeyValue;
  const re=new RegExp('^\\t'+key.replaceAll('.','\\.')+': [\\s\\S]*?(?=\\n\\t(?:quest|chapter)\\.[^\\n:]+:|\\n\\}$)','m');
  assert(re.test(text),`Missing existing language field: ${name}/${key}`);
  text=text.replace(re,()=>`\t${key}: ${JSON.stringify(value)}`);
 }
 readQuestSnbt(text,file);
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),text,`Campaign journey drift: ${name}`);
 else fs.writeFileSync(file,text);
 locales++;
}
console.log(JSON.stringify({ageJourneys:source.ages.length,productionQuests:source.productionQuests.length,locales,mode:process.argv.includes('--check')?'check':'write'}));
