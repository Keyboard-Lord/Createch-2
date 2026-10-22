import { toolFs as fs } from '../lib/live_paths.mjs';

import assert from 'node:assert/strict';

// Geological hosts come from existing planet authorities. Surface patches also
// admit that planet's authored weathering/sediment materials; an ore-host-only
// tag would incorrectly exclude its sand, soil and terracotta surface layers.
const root='kubejs/data/createch2';
const marker='createch2:offworld_decoration_hosts';
const noiseNamespace={abydos:'sgjourney',lantea:'sgjourney',unitas:'sgjourney',rima:'sgjourney',mars:'stellaris',venus:'stellaris',mercury:'stellaris'};
const shared={
  canyon_calcite_lower:{name:'calcite_canyons',planets:['rima','unitas']},
  canyon_calcite_upper:{name:'calcite_canyons',planets:['rima','unitas']},
  calcite_pools:{name:'calcite_pools',planets:['cavum','lantea']},
  cave_ash_vents:{name:'volcanic_cave_floor',planets:['mercury','venus']}
};
const weatheredMaterial=id=>/^minecraft:(?:stone|deepslate|diorite|andesite|granite|calcite|tuff|basalt|smooth_basalt|blackstone|dirt|coarse_dirt|grass_block|sand|red_sand|sandstone|red_sandstone|(?:[a-z_]+_)?terracotta|gravel|cobbled_deepslate)$/.test(id);
const read=file=>JSON.parse(fs.readFileSync(file));
const geology=planet=>{
  const id=`createch2:geology/replaceables/${planet}`;
  assert(fs.existsSync(`${root}/tags/block/geology/replaceables/${planet}.json`),`Missing planet geology: ${planet}`);
  return id;
};
export default function bindHosts(rules,write) {
  const biomes=fs.readdirSync(`${root}/worldgen/biome`).filter(f=>f.endsWith('.json'))
    .map(f=>({name:f.slice(0,-5),features:read(`${root}/worldgen/biome/${f}`).features.flat()}));
  const generatedTags=new Map(),noiseSources=new Set(),featureHosts={};
  for(const rule of rules) {
    if(!JSON.stringify(rule.feature).includes(marker))continue;
    const users=biomes.filter(b=>b.features.includes(rule.to)||b.features.includes(rule.from));
    const planets=[...new Set(users.map(b=>b.name.split('_')[0]))].sort();
    assert(planets.length,`Unbound material feature: ${rule.to}`);
    const name=rule.to.split('/').at(-1);let host;
    if(planets.length>1) {
      const group=shared[name];assert(group,`Shared geology needs explicit ownership: ${name}`);
      assert.deepEqual(planets,group.planets,`Shared geological scope drifted: ${name}`);
      host=`createch2:geology/feature_hosts/${group.name}`;
      generatedTags.set(host,{replace:false,values:planets.map(p=>`#${geology(p)}`)});
    } else {
      const planet=planets[0];host=geology(planet);
      if(rule.mode==='surface_ground') {
        const namespace=noiseNamespace[planet];assert(namespace,`Missing surface authority: ${planet}`);
        const source=`kubejs/data/${namespace}/worldgen/noise_settings/${planet}.json`;
        const natural=new Set();
        const collect=v=>{if(!v||typeof v!=='object')return;if(v.Name&&weatheredMaterial(v.Name))natural.add(v.Name);for(const x of Object.values(v))collect(x);};
        collect(read(source).surface_rule);noiseSources.add(source);
        host=`createch2:geology/weathered_surface/${planet}`;
        generatedTags.set(host,{replace:false,values:[`#${geology(planet)}`,...[...natural].sort()]});
      }
    }
    rule.feature=JSON.parse(JSON.stringify(rule.feature).replaceAll(marker,host));
    featureHosts[rule.to]={host,biomes:users.map(b=>b.name)};
  }
  for(const [id,value]of generatedTags)write(`${root}/tags/block/${id.split(':')[1]}.json`,value);
  return {featureHosts,generatedTags:[...generatedTags.keys()],noiseSources:[...noiseSources].sort(),
    policy:'Base-rock seams use existing planet geology; surface deposits also use authored planet weathering/sediments. Shared features have explicit geological groups, never a universal decoration allowlist.'};
}
