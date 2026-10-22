import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// One derived native membership, not a plate supplier or a general registry
// reconstruction. GT injects it after resource loading, before KubeJS tags.
export function nativeGeneratedPlateContract(root) {
 const greate=path.join(root,'mods/greate-createch-1.21.1.jar'),gt=path.join(root,'mods/gtceu-1.21.1-8.1.0.jar');
 const specs={
  materials:[greate,'electrolyte.greate.registry.GreateMaterials'],greate:[greate,'electrolyte.greate.Greate'],
  flags:[gt,'com.gregtechceu.gtceu.data.material.GTMaterials'],prefix:[gt,'com.gregtechceu.gtceu.api.tag.TagPrefix'],
  prefixV:[gt,'com.gregtechceu.gtceu.api.tag.TagPrefix',true],items:[gt,'com.gregtechceu.gtceu.data.item.GTMaterialItems'],
  itemHooks:[gt,'com.gregtechceu.gtceu.data.item.GTItems'],entries:[gt,'com.gregtechceu.gtceu.api.material.material.ItemMaterialData'],
  tagType:[gt,'com.gregtechceu.gtceu.api.tag.TagType'],tagUtil:[gt,'com.gregtechceu.gtceu.api.tag.TagUtil'],
  tags:[gt,'com.gregtechceu.gtceu.core.MixinHelpers'],loader:[gt,'com.gregtechceu.gtceu.core.mixins.TagLoaderMixin',true],
  manager:[gt,'com.gregtechceu.gtceu.core.mixins.TagManagerMixin',true],plugin:[gt,'com.gregtechceu.gtceu.core.mixins.GTMixinPlugin']
 };
 const code=Object.fromEntries(Object.entries(specs).map(([k,[jar,name,verbose]])=>[k,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',jar,name],{encoding:'utf8',maxBuffer:16*1024*1024})]));
 const config=JSON.parse(execFileSync('/usr/bin/unzip',['-p',gt,'gtceu.mixins.json'],{encoding:'utf8'}));
 const method=(s,signature)=>{const start=s.indexOf(signature);assert(start>=0,'Missing native method '+signature);const tail=s.slice(start),end=/\n  (?:public |private |protected |static \{)/.exec(tail);return end?tail.slice(0,end.index):tail;};
 function review(c,cfg) {
  const alloy=c.materials.slice(c.materials.indexOf('String andesite_alloy\n'),c.materials.indexOf('String rose_quartz\n'));
  for(const v of ['Material$Builder.ingot:','GTMaterials.STD_METAL:','Material$Builder.appendFlags:','Material$Builder.buildAndRegister:','Field AndesiteAlloy:'])assert(alloy.includes(v),'Native andesite material changed: '+v);
  assert(c.materials.includes('Method electrolyte/greate/Greate.id:')&&method(c.greate,'public static net.minecraft.resources.ResourceLocation id(').includes('String greate\n'),'Native material namespace changed');
  assert(/Field STD_METAL:[\s\S]{0,200}MaterialFlags.GENERATE_PLATE:[\s\S]{0,140}List.add:/.test(c.flags),'Missing native standard plate flag');
  assert(!/TagPrefix.plate:[\s\S]{0,350}AndesiteAlloy:[\s\S]{0,350}setIgnored:/.test(c.materials),'Andesite plate is ignored');
  const plateStart=c.prefix.indexOf('String plate\n'),plateEnd=c.prefix.indexOf('Field plate:',plateStart),plate=c.prefix.slice(plateStart,plateEnd);
  assert(plateStart>=0&&plate.includes('String plates/%s\n')&&/iconst_1\n[^\n]*Method generateItem:/.test(plate),'Native plate tag/item generation changed');
  const indy=/InvokeDynamic #(\d+):test:/.exec(plate);assert(indy,'Missing plate predicate');
  const boot=c.prefixV.slice(c.prefixV.indexOf('\n  '+indy[1]+':'),c.prefixV.indexOf('\n  '+(Number(indy[1])+1)+':'));
  const predicate=/REF_invokeStatic[^\n]*TagPrefix\.([^:]+):/.exec(boot)?.[1];assert(predicate,'Missing plate predicate target');
  assert(method(c.prefix,'private static boolean '+predicate+'(').includes('MaterialFlags.GENERATE_PLATE:'),'Wrong native plate condition');
  assert(c.prefixV.includes('%s_\\u0001')&&method(c.prefix,'public com.gregtechceu.gtceu.api.tag.TagPrefix(java.lang.String);').includes('Field idPattern:'),'Native item pattern changed');
  const registration=method(c.items,'public static void generateMaterialItems();');
  for(const v of ['Material.getModid:','GTRegistrate.createIgnoringListenerErrors:','TagPrefix.doGenerateItem:','Method generateMaterialItem:'])assert(registration.includes(v),'Native item registration changed: '+v);
  const item=method(c.items,'private static void generateMaterialItem(');
  for(const v of ['TagPrefix.idPattern:','Material.getName:','String.formatted:','GTItems.unificationItem:','ItemBuilder.register:'])assert(item.includes(v),'Native plate item binding changed: '+v);
  assert(c.itemHooks.includes('ItemMaterialData.registerMaterialEntry:')&&method(c.entries,'private static void registerItemEntry(').includes('Field MATERIAL_ENTRY_ITEM_MAP:'),'Missing material entry registration');
  assert(method(c.tagType,'private static net.minecraft.tags.TagKey lambda$withDefaultFormatter$0(').includes('Material.getName:')&&c.tagType.includes('TagUtil.createItemTag:'),'Missing native tag formatter');
  assert(/ifeq\s+13[\s\S]{0,600}String c\n/.test(c.tagUtil),'Native common tag namespace changed');
  assert(c.tags.includes('ItemMaterialData.MATERIAL_ENTRY_ITEM_MAP:')&&c.tags.includes('TagPrefix.getAllItemTags:')&&c.tags.includes('List.addAll:'),'Missing native dynamic membership injection');
  assert(cfg.required===true&&cfg.injectors?.defaultRequire===1&&cfg.mixins.includes('TagLoaderMixin')&&cfg.mixins.includes('TagManagerMixin'),'Native tag mixins not configured');
  assert(c.loader.includes('method=["load"]')&&c.loader.includes('value="RETURN"')&&c.loader.includes('MixinHelpers.generateGTDynamicTags:'),'Missing native tag load hook');
  assert(c.manager.includes('method=["createLoader"]')&&c.manager.includes('IGTTagLoader.gtceu$setRegistry:'),'Missing native registry assignment');
  assert(!c.plugin.includes('String TagLoaderMixin')&&!c.plugin.includes('String TagManagerMixin')&&/68: iconst_1\n\s+69: ireturn/.test(c.plugin),'Unreviewed tag mixin plugin gate');
 }
 review(code,config);const negativeCases=[];
 for(const [name,change]of [
  ['no_plate_flag',c=>{c.flags=c.flags.replaceAll('MaterialFlags.GENERATE_PLATE:','MaterialFlags.GENERATE_ROD:');}],
  ['wrong_material_namespace',c=>{c.greate=c.greate.replaceAll('String greate\n','String other\n');}],
  ['wrong_plate_tag',c=>{c.prefix=c.prefix.replaceAll('String plates/%s\n','String rods/%s\n');}],
  ['wrong_plate_predicate',c=>{c.prefix=c.prefix.replaceAll('MaterialFlags.GENERATE_PLATE:','MaterialFlags.GENERATE_ROD:');}],
  ['wrong_item_pattern',c=>{c.prefixV=c.prefixV.replaceAll('%s_\\u0001','%s_wrong');}],
  ['no_item_generation',c=>{c.items=c.items.replaceAll('GTItems.unificationItem:','GTItems.otherItem:');}],
  ['no_entry_map',c=>{c.entries=c.entries.replaceAll('Field MATERIAL_ENTRY_ITEM_MAP:','Field OTHER_MAP:');}],
  ['wrong_common_namespace',c=>{c.tagUtil=c.tagUtil.replaceAll('String c\n','String other\n');}],
  ['no_dynamic_tags',c=>{c.tags=c.tags.replaceAll('TagPrefix.getAllItemTags:','TagPrefix.getOtherTags:');}],
  ['no_registry_assignment',c=>{c.manager=c.manager.replaceAll('IGTTagLoader.gtceu$setRegistry:','IGTTagLoader.gtceu$clearRegistry:');}]
 ]){const c={...code};change(c);assert.throws(()=>review(c,config),name);negativeCases.push({name,rejected:true});}
 const cfg=structuredClone(config);cfg.mixins=cfg.mixins.filter(v=>v!=='TagLoaderMixin');assert.throws(()=>review(code,cfg));negativeCases.push({name:'unconfigured_loader',rejected:true});
 return {truth:'STATIC_NATIVE_GENERATED_ANDESITE_PLATE_TAG',itemTags:{'c:plates/andesite_alloy':['greate:andesite_alloy_plate']},source:'Greate material flags -> GT material item registration -> native GT dynamic tags before KubeJS policy',negativeCases,hashes:Object.fromEntries(Object.entries(code).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),limits:['Exactly one native derived membership; no item stock, recipe, common tag file, registry or gameplay policy is changed.','Configured native code only; actual mixin transformation, loaded tag contents and recipe matching remain runtime qualification.']};
}
