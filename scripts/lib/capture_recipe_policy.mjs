import { toolFs as fs } from './live_paths.mjs';
// Offline capture of authored recipe filters/IDs, not a Minecraft recipe engine.
// Recipe builders are inert; only recipe-event callbacks execute. Native GT
// serializers, ingredient tags and registry-dependent callbacks are not modeled.

import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Keys accepted by the installed KubeJS RecipeFilter.wrap. Object fields are
// implicitly ANDed; arrays and "or" combine alternatives. Never model a made-up
// "and" key as valid, since that hides a real runtime parse failure.
function validateFilter(filter) {
  if (Array.isArray(filter)) { filter.forEach(validateFilter); return; }
  if (!filter || typeof filter !== 'object' || Object.prototype.toString.call(filter) === '[object RegExp]') return;
  for (const [key, value] of Object.entries(filter)) {
    assert(['id', 'mod', 'type', 'group', 'input', 'output', 'not', 'or', 'createch2_exact_ids'].includes(key), `Unsupported KubeJS recipe filter key: ${key}`);
    if (key === 'type') {
      assert(typeof value === 'string' && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value),
        'Installed KubeJS TypeFilter requires a literal serializer ID; regexes are supported only for recipe IDs');
    }
    if (key === 'createch2_exact_ids') {
      assert(Array.isArray(value) && value.length > 0 && value.length <= 8192, 'Exact recipe ID filter requires a bounded list');
      value.forEach(id => assert(typeof id === 'string' && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(id), 'Exact recipe ID filter requires literals'));
    }
    if (key === 'not' || key === 'or') validateFilter(value);
  }
}

export function captureRecipePolicy(root, optionalLoaded = true, sourceOverrides = {}) {
  const removals = [], modifications = [], additions = [], scans = [], failures = [];
  const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
  const scripts = walk(path.join(root, 'kubejs/server_scripts')).filter(file => file.endsWith('.js') &&
    fs.readFileSync(file, 'utf8').includes('ServerEvents.recipes'));
  for (const file of scripts) {
    const relative = path.relative(root, file);
    const nativeRecipeEntries = new WeakMap();
    const chain = (custom, kind, args) => {
      let proxy;
      proxy = new Proxy(function () { return proxy; }, {
        get: (_, key) => key === 'id' ? id => { additions.push({ file: relative, id: String(id), custom, kind, args }); return proxy; } :
          key === 'json' ? {} : proxy
      });
      return proxy;
    };
    const event = new Proxy({
      remove: (filter, ...rest) => { validateFilter(filter); removals.push({ file: relative, filter, extraArguments: rest }); },
      replaceInput: (filter, ...args) => { validateFilter(filter); modifications.push({ file: relative, kind: 'input', filter, args }); },
      replaceOutput: (filter, ...args) => { validateFilter(filter); modifications.push({ file: relative, kind: 'output', filter, args }); },
      forEachRecipe: filter => scans.push({ file: relative, filter }),
      recipes: new Proxy({}, { get: (_, mod) => new Proxy({}, { get: (_, type) => (...args) => {
        if (mod === 'create') return chain(undefined, `create:${type}`, args);
        assert.equal(mod, 'gtceu', 'Unreviewed native recipe builder');
        const id = args[0];
        // Installed GTKubeRecipe.id applies the recipe type as a path prefix.
        const qualify = value => {
          const text = String(value), split = text.indexOf(':');
          const ns = split < 0 ? mod : text.slice(0, split);
          return `${ns}:${type}/${split < 0 ? text : text.slice(split + 1)}`;
        };
        const entry = { file: relative, id: qualify(id), nativeType: `${mod}:${type}` };
        additions.push(entry);
        let proxy;
        const capturedMethods = new Set(['itemInputs','itemOutputs','inputFluids','outputFluids','notConsumableItem','duration','EUt','circuit','cleanroom','scannerResearch','setValue','stationResearch']);
        proxy = new Proxy(function () { return proxy; }, { get: (_, key) => key === 'id'
          ? value => { entry.id = qualify(value); return proxy; } : key === 'json' ? {} : (...values) => {
            // Retain literal native builder payloads for supplier proofs. This
            // records declarations; it never executes a registry or research callback.
            const call = {method:String(key),args:values.map(value=>typeof value==='function'?{callbackSource:String(value)}:value)};
            if (capturedMethods.has(key)) (entry.nativeCalls ??= []).push(call);
            else (entry.unmodeledNativeCalls ??= []).push(call);
            return proxy;
          } });
        nativeRecipeEntries.set(proxy, entry);
        return proxy;
      } }) })
    }, { get: (target, key) => {
      if (key in target) return target[key];
      assert(['custom', 'shaped', 'shapeless'].includes(key), `Unmodeled recipe method: ${String(key)}`);
      return (...args) => chain(key === 'custom' ? args[0] : undefined, key, args);
    } });
    const ignoredEvents = new Proxy({}, { get: () => () => {} });
    const classes = {
      'com.gregtechceu.gtceu.integration.kjs.recipe.GTRecipeSchema': { CONDITIONS: 'conditions' },
      'java.util.ArrayList': class ArrayList {},
      // Opaque native-factory request only. This marker is never a claim to
      // execute GT's codec or to manufacture research data in this capture.
      'createch2.core.compat.GtStationResearchRecipes': { stationRecipe: (held,cwu,...args) => {
        assert(args.length===1||args.length===2);
        const deliveryId=args.at(-1), request={held,cwu,deliveryId};
        if(args.length===2){assert(Number.isInteger(args[0])&&args[0]>0);request.eu=args[0];}
        return {type:'gtceu:research_station',createch2NativeStationFactory:request};
      }, assignStationId: (recipe,id) => {
        assert(String(id).startsWith('createch2:research_station/'));
        // Declarative identity only; this never executes the native GT builder.
        recipe.id(id);
      } },
      'createch2.core.compat.GtComputationRecipeIdentity': { preserveAssemblerId: (recipe,id) => {
        const entry=nativeRecipeEntries.get(recipe);
        assert(entry&&entry.nativeType==='gtceu:circuit_assembler');
        assert(['hpca_active_cooler_component','hpca_advanced_computation_component','hpca_bridge_component'].some(n=>id==='createch2:assembler/greate_computation/'+n));
        entry.id=id;
      } },
      'createch2.core.compat.DigitalMinerPolicy': {},
      'createch2.core.compat.ExactItemOutputMatch': { of: ids => ({ createch2ExactItemOutputs: Array.from(ids) }) },
      'createch2.core.compat.ExactRecipeIdFilter': {},
      'net.minecraft.resources.ResourceLocation': { parse: id => id },
      'net.minecraft.resources.ResourceKey': { create: (_, id) => id },
      'com.portingdeadmods.researchd.ResearchdRegistries': { RESEARCH_PACK_KEY: 'research_pack' },
      'com.portingdeadmods.researchd.impl.research.ResearchPackImpl': { asStack: () => chain() },
      'com.portingdeadmods.researchd.utils.registries.ResearchdManagers': {}
    };
    const context = {
      ServerEvents: new Proxy({}, { get: (_, key) => key === 'recipes' ? callback => callback(event) : () => {} }),
      BlockEvents: ignoredEvents, PlayerEvents: ignoredEvents, ProjectEEvents: ignoredEvents,
      Item: { of: (id, count = 1) => ({ id, count }) },
      Fluid: { of: (fluid, amount) => ({ fluid, amount }) },
      Platform: { isLoaded: () => optionalLoaded }, CleanroomType: { CLEANROOM: 'cleanroom', STERILE_CLEANROOM: 'sterile_cleanroom' },
      Java: { loadClass: name => { assert(Object.hasOwn(classes, name), `Unmodeled native lookup: ${name}`); return classes[name]; } },
      // Runtime census listeners are observational and require actual registries.
      // Keep them inert in this declarative capture even during live diagnostics.
      JsonIO: { read: name => name === 'kubejs/config/createch2_validation.json'
        ? {enabled:false} : JSON.parse(sourceOverrides[name] ?? fs.readFileSync(path.join(root, name), 'utf8')) },
      console: { info() {}, warn() {}, error: message => failures.push(`${relative}: ${message}`) }
    };
    try { vm.runInNewContext(sourceOverrides[relative] ?? fs.readFileSync(file, 'utf8'), context, { filename: relative, timeout: 5000 }); }
    catch (error) { failures.push(`${relative}: ${error.message}`); }
  }
  assert.equal(failures.length, 0, failures.join('\n'));
  return { scripts: scripts.length, removals, modifications, additions, scans };
}

// null means a tag/ingredient/native condition prevents a static decision.
const and = values => values.includes(false) ? false : values.includes(null) ? null : true;
const or = values => values.includes(true) ? true : values.includes(null) ? null : false;
function recipeIngredients(recipe, role) {
  const fields = role === 'output' ? ['result', 'results', 'output', 'outputs', 'item_outputs']
    : ['ingredient', 'ingredients', 'input', 'inputs', 'item_inputs', 'base', 'addition'];
  const values = fields.flatMap(key => recipe[key] ? [recipe[key]].flat() : []);
  if (role === 'input' && recipe.key) values.push(...Object.values(recipe.key));
  // Sequenced assembly's external ingredient/result is authoritative; its
  // intermediate step products do not constitute independently craftable output.
  return values.map(entry => typeof entry === 'string' ? { item: entry } : entry);
}
function match(pattern, value) {
  if (pattern && Array.isArray(pattern.createch2ExactItemOutputs)) return pattern.createch2ExactItemOutputs.includes(value);
  if (Object.prototype.toString.call(pattern) === '[object RegExp]') return pattern.test(value);
  if (typeof pattern !== 'string' || pattern.startsWith('#')) return null;
  return pattern === value;
}
export function matchesRecipeFilter(filter, id, recipe) {
  if (Array.isArray(filter)) return or(filter.map(entry => matchesRecipeFilter(entry, id, recipe)));
  if (typeof filter === 'string' || Object.prototype.toString.call(filter) === '[object RegExp]') return match(filter, id);
  if (!filter || typeof filter !== 'object') return null;
  const results = [];
  for (const [key, value] of Object.entries(filter)) {
    if (key === 'id') results.push(match(value, id));
    else if (key === 'createch2_exact_ids') results.push(value.includes(id));
    else if (key === 'mod') results.push(match(value, id.split(':')[0]));
    else if (key === 'type') results.push(match(value, recipe.type));
    else if (key === 'not') { const child = matchesRecipeFilter(value, id, recipe); results.push(child === null ? null : !child); }
    else if (key === 'or') results.push(or(value.map(entry => matchesRecipeFilter(entry, id, recipe))));
    else if (key === 'input' || key === 'output') {
      const ingredients = recipeIngredients(recipe, key);
      results.push(or(ingredients.map(entry => entry.tag ? null : match(value, entry.item ?? entry.id))));
    } else results.push(null);
  }
  return and(results);
}

// Compile a fixed captured filter for a large diagnostic census. The ordinary
// matcher remains pure; this explicitly snapshots literal sets at compilation.
export function compileRecipeFilter(filter) {
  if(Array.isArray(filter)){
    if(filter.every(e=>e&&Object.keys(e).length===1&&typeof e.output==='string'&&!e.output.startsWith('#'))){
      const outputs=new Set(filter.map(e=>e.output));
      return (_id,recipe)=>or(recipeIngredients(recipe,'output').map(e=>e.tag?null:outputs.has(e.item??e.id)));
    }
    const children=filter.map(compileRecipeFilter);
    return (id,recipe)=>{let unknown=false;for(const child of children){const r=child(id,recipe);if(r===true)return true;if(r===null)unknown=true;}return unknown?null:false;};
  }
  if(!filter||typeof filter!=='object'||Object.prototype.toString.call(filter)==='[object RegExp]')return (id,recipe)=>matchesRecipeFilter(filter,id,recipe);
  const priority={id:0,createch2_exact_ids:0,type:1,mod:2,output:3,input:4,not:5,or:6};
  const fields=Object.entries(filter).sort(([a],[b])=>(priority[a]??7)-(priority[b]??7)).map(([key,value])=>{
    if(key==='or')return compileRecipeFilter(value);
    if(key==='not'){const child=compileRecipeFilter(value);return (id,recipe)=>{const r=child(id,recipe);return r===null?null:!r;};}
    if(key==='createch2_exact_ids'){const ids=new Set(value);return id=>ids.has(id);}
    if(key==='output'&&Array.isArray(value?.createch2ExactItemOutputs)){
      const outputs=new Set(value.createch2ExactItemOutputs);return (_id,recipe)=>or(recipeIngredients(recipe,'output').map(e=>e.tag?null:outputs.has(e.item??e.id)));
    }
    return (id,recipe)=>matchesRecipeFilter({[key]:value},id,recipe);
  });
  return (id,recipe)=>{let unknown=false;for(const field of fields){const r=field(id,recipe);if(r===false)return false;if(r===null)unknown=true;}return unknown?null:true;};
}

export function matchesRecipeModification(modification, id, recipe) {
  const filtered = matchesRecipeFilter(modification.filter, id, recipe);
  if (filtered === false) return false;
  const replacement = modification.args[0];
  if (modification.kind === 'input' && replacement?.exact === true && typeof replacement.match === 'string') {
    // Native IngredientKJS exact matching compares tag identity / ingredient
    // equality, not tag membership. A literal item does not replace a tag.
    const ingredients = recipeIngredients(recipe, 'input');
    const exact = or(ingredients.map(entry => entry.tag ? false : match(replacement.match, entry.item ?? entry.id)));
    return and([filtered, exact]);
  }
  return filtered;
}
