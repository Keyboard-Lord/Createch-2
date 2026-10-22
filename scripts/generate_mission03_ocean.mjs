import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
const policy=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission03_ocean.json')));
assert.equal(policy.schema,1);
const check=process.argv.includes('--check');
const write=(relative,bytes)=>{
  const file=path.join(liveRoot,relative);
  if(check)assert.equal(fs.readFileSync(file,'utf8'),bytes,'Ocean source drift: '+relative);
  else {fs.mkdirSync(path.dirname(file),{recursive:true});if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==bytes)fs.writeFileSync(file,bytes);}
};
const climatePath='kubejs/data/sgjourney/worldgen/noise_settings/lantea.json';
const terrain=JSON.parse(fs.readFileSync(path.join(liveRoot,climatePath),'utf8'));
Object.assign(terrain.noise_router,policy.climateRouter);
write(climatePath,JSON.stringify(terrain,null,2)+'\n');
for(const [name,data]of Object.entries({
  'worldgen/configured_feature/lantea_oxyhelium':policy.configuredFeature,
  'worldgen/placed_feature/lantea_oxyhelium':policy.placedFeature,
  'neoforge/biome_modifier/worldgen_lantea_oxyhelium':{
    type:'neoforge:add_features',biomes:policy.biomes,features:['createch2:lantea_oxyhelium'],step:'vegetal_decoration'
  }
}))write('kubejs/data/createch2/'+name+'.json',JSON.stringify(data,null,2)+'\n');
for(const name of fs.readdirSync(path.join(liveRoot,'config/ftbquests/quests/lang')).filter(n=>n.endsWith('.snbt'))){
  const rel='config/ftbquests/quests/lang/'+name;
  let text=fs.readFileSync(path.join(liveRoot,rel),'utf8');
  for(const [key,value]of Object.entries(policy.questText)){
    const pattern=new RegExp('^\\t'+key.replaceAll('.','\\.')+': [\\s\\S]*?(?=\\n\\t(?:quest|chapter)\\.|\\n\\}$)','m');
    const line='\t'+key+': '+JSON.stringify(value);
    if(pattern.test(text))text=text.replace(pattern,()=>line);
    else {assert.notEqual(name,'en_us.snbt','Missing canonical quest text '+key);text=text.replace(/\n\}\s*$/, '\n'+line+'\n}\n');}
  }
  readQuestSnbt(text);write(rel,text);
}
console.log(JSON.stringify({mode:check?'check':'write',habitats:policy.biomes.length,nativeFeature:policy.configuredFeature.type}));
