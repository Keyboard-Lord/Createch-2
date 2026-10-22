import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';

// Replay declared item-tag policy only. Native scanning and copy behavior are
// intentionally outside this static predicate.
export function staticBulkReplicationPolicy(root,native,options={}) {
  const tags=new Map();
  const members=tag=>{if(!tags.has(tag))tags.set(tag,new Set());return tags.get(tag);};
  for(const [tag,providers]of Object.entries(native.itemTags))for(const p of providers){if(p.data.replace)members(tag).clear();for(const v of p.data.values??[])members(tag).add(typeof v==='string'?v:v.id);}
  if(options.includeAuthored){
    const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
    for(const f of walk(path.join(root,'kubejs/data')).filter(f=>/\/tags\/item\/.+\.json$/.test(f)).sort()){
      const m=/\/data\/([^/]+)\/tags\/item\/(.+)\.json$/.exec(f),d=JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),tag=m[1]+':'+m[2];
      if(d.replace)members(tag).clear();for(const v of d.values??[])members(tag).add(typeof v==='string'?v:v.id);
    }
  }
  // Native GT tag-loader injection follows resource tags. Pack tag events
  // still run afterward and retain their normal removal authority.
  for(const [tag,values]of Object.entries(options.nativeGeneratedItemTags??{}))for(const value of values)members(tag).add(value);
  const event={add(tag,value){for(const v of [value].flat())members(tag).add(v);},remove(tag,value){for(const v of [value].flat())members(tag).delete(v);},removeAll(tag){members(tag).clear();}},errors=[];
  const context={ServerEvents:{tags(type,callback){if(type==='item')callback(event);},recipes(){}},Item:{exists:()=>true},JsonIO:{read:file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'))},console:{info(){},error:v=>errors.push(String(v))}};
  for(const file of ['core/tag_authority.js','resources/strategic_resource_authority.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'kubejs/server_scripts',file),'utf8'),context,{filename:file,timeout:5000});
  assert.equal(errors.length,0,errors.join('\n'));
  const matches=(tag,item,seen=new Set())=>{if(seen.has(tag))return false;for(const v of members(tag)){if(typeof v==='string'){if(v===item)return true;if(v.startsWith('#')&&matches(v.slice(1),item,new Set(seen).add(tag)))return true;}else if(Object.prototype.toString.call(v)==='[object RegExp]'&&v.test(item))return true;}return false;};
  const declared=(tag,seen=new Set())=>{if(seen.has(tag))return [];const ids=new Set();for(const v of members(tag)){if(typeof v==='string'){if(v.startsWith('#'))for(const id of declared(v.slice(1),new Set(seen).add(tag)))ids.add(id);else ids.add(v);}else if(Object.prototype.toString.call(v)==='[object RegExp]'){for(const id of Object.keys(native.itemModels))if(v.test(id))ids.add(id);}}return [...ids].sort();};
  return {members:declared,hasTag:matches,blocked:item=>matches('modern_industrialization:replicator_blacklist',item),scope:'Declared blacklist, including native/static parent tags and current source additions; loaded registry/scan/copy operation is unqualified.'};
}
