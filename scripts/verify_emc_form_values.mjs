import {toolFs as fs,liveRoot} from './lib/live_paths.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {reviewedEmcSeed,constrainReviewedPriceParity,constrainReviewedFormCeilings} from './lib/reviewed_emc_values.mjs';
process.chdir(liveRoot);
const table=JSON.parse(fs.readFileSync('kubejs/config/createch2_emc_values.json'));
const values=table.values;
assert.equal(table.sale_tax_percent,10);
assert.equal(table.runtime_status,'RUNTIME_UNVERIFIED');
// Fixed useful baselines and strategic/unknown boundaries, not the old broad
// substring fallback. Registry entries outside the reviewed table must erase
// any native recipe-derived value, including unknown future provider items.
const expected=new Map([
 ['tfmg:copper_wire',values['tfmg:copper_wire']??0],['tfc_items:copper_wire',0],['electroenergetics:copper_wire',0],
 ['tfc_metallurgy:metal/dust/aluminum',0],['tfc_items:copper_foil',0],['tfc:metal/block/copper',0],
 ['tfc_items:copper_ring',0],['tfc_items:copper_screw',0],
 ['tfc_items:copper_gear',0],['railcraft:copper_gear',0],['gtceu:copper_gear',0],
 ['tfc:metal/block/nickel_slab',0],['tfc:metal/block/nickel_stairs',0],
 ['minecraft:oak_log',64],['modern_industrialization:steel_ingot',values['tfc:metal/ingot/steel']],
 ['modern_industrialization:titanium_ingot',0],['modern_industrialization:uranium_dust',0],
 ['gtceu:tungsten_ingot',0],['gtceu:platinum_ingot',0],['gtceu:iridium_ingot',0],
 ['mekanism:ingot_osmium',0],['researchd:research_pack',0],['sgjourney:memory_crystal',0],
 ['modern_industrialization:iron_machine_casing',0],['example:new_glass_machine',0],
 ['example:deepsilver_ingot',0],['gtceu:tiny_vanadium_magnetite_dust',0],
 ['minecraft:glass_pane',values['minecraft:glass_pane']??0]
]);
const ids=[...expected.keys(),'minecraft:air'].map(id=>({toString:()=>id,getNamespace:()=>id.split(':')[0]}));
let handler;const registry={keySet:()=>({iterator:()=>{let i=0;return {hasNext:()=>i<ids.length,next:()=>ids[i++]};}}),get:id=>String(id)};
const source=fs.readFileSync('kubejs/server_scripts/resources/projecte_authority.js','utf8');
function run(policy,script=source){handler=null;vm.runInNewContext(script,{ServerEvents:{recipes(){}},ProjectEEvents:{setEMC:f=>handler=f},Java:{loadClass:()=>({ITEM:registry})},JsonIO:{read:()=>policy},console:{info(){}}});const result=new Map([...expected.keys()].map(id=>[id,999999]));handler({setEMCAfter:(id,value)=>{assert.notEqual(id,'minecraft:air','Native NSSItem rejects an empty stack');result.set(id,value);}});return result;}
assert.deepEqual(run(table),expected);
assert.throws(()=>run(table,source.replace("    if (id === 'minecraft:air') continue\n",'')),/empty stack/,'The previous all-registry loop must reproduce the native mapper failure');
assert([...run(null).values()].every(v=>v===0),'Missing policy must erase native mapping values');
const poisoned={values:{'tfc_items:copper_wire':8192,'electroenergetics:copper_wire':8192,'tfc_metallurgy:metal/dust/aluminum':8192,'tfc_items:copper_foil':8192,'tfc:metal/block/copper':8192,'sgjourney:memory_crystal':8192,'researchd:research_pack':8192,'example:new_glass_machine':-4}};
poisoned.values['tfc_items:copper_ring']=8192;poisoned.values['tfc_items:copper_screw']=8192;
for(const id of ['tfc_items:copper_gear','railcraft:copper_gear','gtceu:copper_gear'])poisoned.values[id]=8192;
assert([...run(poisoned).values()].every(v=>v===0),'Explicit eligibility and invalid values must remain zero');
for(const [id,value]of Object.entries(values)){assert(Number.isSafeInteger(value)&&value>0,id);assert(!/(?:titanium|tungsten|uranium|platinum|iridium|osmium|neutronium)/.test(id.split(':')[1]),id);}
const reviewed=JSON.parse(fs.readFileSync('createch-dev/scripts/sources/emc_reviewed_values.json'));
const eligibility=JSON.parse(fs.readFileSync('createch-dev/scripts/sources/emc_eligibility.json'));
const future=['example:silver_ingot','example:steel_dust','example:new_wood_log','example:new_oak_planks','example:compressed_iron_ingot'];
const seed=reviewedEmcSeed(reviewed,eligibility,new Set([...Object.keys(reviewed.values),...future]));
assert(future.every(id=>!Object.hasOwn(seed,id)),'Names must not create a reviewed price');
assert(Object.keys(values).every(id=>Object.hasOwn(seed,id)&&values[id]<=seed[id]),'Recipe analysis added a value or raised its ceiling');
for(const id of Object.keys(seed))assert(!id.startsWith('biomeswevegone:')&&!id.startsWith('regions_unexplored:')&&!id.includes('compressed_iron'),'Absent/library EMC returned');
for(const group of reviewed.sameUnitPrices){
 if(group.material==='steel'){
  const expected={100:['createbigcannons:steel_ingot','modern_industrialization:steel_ingot','railcraft:steel_ingot','tfc:metal/ingot/steel','tfmg:steel_ingot','modern_industrialization:steel_dust','modern_industrialization:steel_plate','railcraft:steel_plate'],[100/9]:['modern_industrialization:steel_nugget','railcraft:steel_nugget','tfmg:steel_nugget','modern_industrialization:steel_tiny_dust'],900:['createbigcannons:steel_block','modern_industrialization:steel_block','railcraft:steel_block','tfmg:steel_block']};
  assert.deepEqual(group.items,expected[group.metalUnits]);
 }
 const active=group.items.filter(id=>Object.hasOwn(values,id));assert(active.length>0);
 assert(active.every(id=>values[id]===values[active[0]]),'Equal-unit stock prices differ');
}
const sample={'test:a':512,'test:b':170},repairs=[];
assert.equal(constrainReviewedPriceParity(sample,[{material:'test',metalUnits:100,items:['test:a','test:b','test:unreviewed']}],repairs),1);
assert.deepEqual(sample,{'test:a':170,'test:b':170});
assert.throws(()=>constrainReviewedPriceParity(sample,[{material:'test',metalUnits:200,items:['test:a','test:b']}],[]));
assert.throws(()=>reviewedEmcSeed({schema:1,values:{'test:a':-1}},eligibility,new Set(['test:a'])));
assert(!Object.hasOwn(reviewedEmcSeed({schema:1,values:{'test:a':512}},{itemGroups:{deny:{items:['test:a']}},namespaceExclusions:{}},new Set(['test:a'])),'test:a'));
const units=JSON.parse(fs.readFileSync('kubejs/data/createch2/material_contracts/form_units.json'));
for(const cap of reviewed.formPriceCeilings){
 const measured=units.industrialGears.find(f=>f.ordinaryGear===cap.item);
 if(cap.material==='steel'&&cap.item!=='modern_industrialization:steel_gear'){
  const measured={'modern_industrialization:steel_double_ingot':200,'modern_industrialization:steel_large_plate':400,'modern_industrialization:steel_curved_plate':100,'modern_industrialization:steel_rod':50,'tfc:metal/double_ingot/steel':200};
  assert.equal(cap.metalUnits,measured[cap.item]);assert.equal(cap.baseMetalUnits,100);assert.equal(cap.baseItem,'modern_industrialization:steel_dust');assert(values[cap.item]<=Math.floor(cap.metalUnits*values[cap.baseItem]/100));continue;
 }
 if(cap.material==='lead'){
  const measured={'modern_industrialization:lead_double_ingot':200,'tfc_metallurgy:metal/double_ingot/lead':200,'tfc_items:lead_rod':50,'tfc_items:lead_wire':25,'tfc_items:lead_gear':400,'railcraft:lead_gear':400};
  assert.equal(cap.metalUnits,measured[cap.item]);assert.equal(cap.baseMetalUnits,100);assert.equal(cap.baseItem,'tfmg:lead_ingot');
  assert(values[cap.item]<=Math.floor(cap.metalUnits*values[cap.baseItem]/100),'Lead component exceeds paid stock');continue;
 }
 if(cap.material==='tin'&&cap.item!=='modern_industrialization:tin_gear'){
  if(cap.item==='modern_industrialization:tin_dust'){
   assert.equal(cap.metalUnits,100);assert.equal(cap.baseMetalUnits,50);assert.equal(cap.baseItem,'modern_industrialization:tin_wire');
   assert(values[cap.item]<=2*values[cap.baseItem],'Tin thermal stock exceeds paid wires');continue;
  }
  const measured={'modern_industrialization:tin_double_ingot':200,'tfc:metal/double_ingot/tin':200,'modern_industrialization:tin_curved_plate':100,'modern_industrialization:tin_rod':50,'modern_industrialization:tin_wire':50};
  assert.equal(cap.metalUnits,measured[cap.item]);assert.equal(cap.baseMetalUnits,100);assert.equal(cap.baseItem,'modern_industrialization:tin_dust');
  assert(values[cap.item]<=Math.floor(cap.metalUnits*values[cap.baseItem]/100),'Tin component exceeds paid stock');continue;
 }
 if(cap.material==='silver'){
  if(cap.item==='modern_industrialization:silver_dust'){
   assert.equal(cap.metalUnits,100);assert.equal(cap.baseMetalUnits,50);assert.equal(cap.baseItem,'modern_industrialization:silver_wire');assert(values[cap.item]<=2*values[cap.baseItem]);continue;
  }
  const measured={'modern_industrialization:silver_double_ingot':200,'tfc:metal/double_ingot/silver':200,'extended_industrialization:silver_curved_plate':100,'modern_industrialization:silver_wire':50,'railcraft:silver_gear':400,'tfc_items:silver_gear':400};
  assert.equal(cap.metalUnits,measured[cap.item]);assert.equal(cap.baseMetalUnits,100);assert.equal(cap.baseItem,'modern_industrialization:silver_dust');assert(values[cap.item]<=Math.floor(cap.metalUnits*values[cap.baseItem]/100));continue;
 }
 if(cap.material==='gold'&&cap.item!=='modern_industrialization:gold_gear'){
  if(cap.item==='modern_industrialization:gold_dust'){
   assert.equal(cap.metalUnits,100);assert.equal(cap.baseMetalUnits,50);assert.equal(cap.baseItem,'createaddition:gold_wire');assert(values[cap.item]<=2*values[cap.baseItem]);continue;
  }
  const measured={'modern_industrialization:gold_double_ingot':200,'tfc:metal/double_ingot/gold':200,'modern_industrialization:gold_curved_plate':100,'modern_industrialization:gold_rod':50,'createaddition:gold_rod':50,'createaddition:gold_wire':50};
  assert.equal(cap.metalUnits,measured[cap.item]);assert.equal(cap.baseMetalUnits,100);assert.equal(cap.baseItem,'modern_industrialization:gold_dust');assert(values[cap.item]<=Math.floor(cap.metalUnits*values[cap.baseItem]/100));continue;
 }
 if(cap.material==='iron'&&cap.item!=='modern_industrialization:iron_gear'){
  if(cap.item==='modern_industrialization:iron_dust'){
   assert.equal(cap.metalUnits,100);assert.equal(cap.baseMetalUnits,50);assert.equal(cap.baseItem,'createaddition:iron_wire');assert(values[cap.item]<=2*values[cap.baseItem]);continue;
  }
  const measured={'modern_industrialization:iron_double_ingot':200,'modern_industrialization:iron_large_plate':400,'modern_industrialization:iron_rod':50,'createaddition:iron_rod':50,'createaddition:iron_wire':50};
  assert.equal(cap.metalUnits,measured[cap.item]);assert.equal(cap.baseMetalUnits,100);assert.equal(cap.baseItem,'modern_industrialization:iron_dust');assert(values[cap.item]<=Math.floor(cap.metalUnits*values[cap.baseItem]/100));continue;
 }
 assert(measured,'Unmeasured priced gear '+cap.item);assert.equal(cap.metalUnits,measured.ordinaryMetalUnits);
 assert.equal(cap.metalUnits,200);assert.equal(cap.baseMetalUnits,100);assert.equal(cap.baseItem,measured.canonicalDust);
 assert(values[cap.item]<=2*values[cap.baseItem],'Standard gear exceeds its measured stock value');
}
const gearValues={'test:stock':170,'test:gear':935};
constrainReviewedFormCeilings(gearValues,[{material:'test',item:'test:gear',metalUnits:200,baseItem:'test:stock',baseMetalUnits:100},{material:'test',item:'test:unreviewed',metalUnits:200,baseItem:'test:stock',baseMetalUnits:100}],[]);
assert.deepEqual(gearValues,{'test:stock':170,'test:gear':340});
assert.throws(()=>constrainReviewedFormCeilings(gearValues,[{item:'test:gear',metalUnits:200,baseItem:'test:stock',baseMetalUnits:5}],[]));
const thermal={'test:wire':32,'test:stock':80};constrainReviewedFormCeilings(thermal,[{item:'test:stock',metalUnits:100,baseItem:'test:wire',baseMetalUnits:50}],[]);assert.equal(thermal['test:stock'],64);
const fractions={'test:stock':64,'test:nugget':8,'test:block':720};constrainReviewedPriceParity(fractions,[{material:'test',metalUnits:100/9,items:['test:nugget'],baseItem:'test:stock',baseMetalUnits:100},{material:'test',metalUnits:900,items:['test:block'],baseItem:'test:stock',baseMetalUnits:100}],[]);assert.deepEqual(fractions,{'test:stock':64,'test:nugget':7,'test:block':576});
console.log(JSON.stringify({truth:'VERIFIED_TEST',boundaryCases:expected.size,reviewedValues:Object.keys(values).length,nativeFallbackErased:true,gameRuntime:false}));
