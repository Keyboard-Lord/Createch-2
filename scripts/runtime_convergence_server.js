// priority: -10000
// Validation-copy-only, one-shot lookup. Never a release-pack server script.
;(function () {
  var supplyCandidates = []
  ServerEvents.recipes(event => {
    supplyCandidates = []
    event.forEachRecipe({ output: /^(?:gtceu|chemica|chemlib):.*(?:vanadium|magnetite).*/ }, recipe => {
      supplyCandidates.push({ id: String(recipe.getId()), json: JSON.parse(String(recipe.json)) })
    })
    JsonIO.write('kubejs/config/generated/validation/vanadium_candidates.json', supplyCandidates)
  })
  var pending = true
  var report = null
  var emcPending = true
  var emcStartedAt = 0
  var emcNextCheckAt = 0
  ServerEvents.tick(event => {
    if (!pending) return
    pending = false
    try {
      var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
      var BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
      emcStartedAt = Date.now()
      report = { errors: [], emcProbe: { status: 'WAITING', truth: 'INFERRED_UNVERIFIED' } }
      var ledger = JsonIO.read('kubejs/config/createch2_research_tree.json')
      var checked = new Set()
      var missing = []
      ledger.nodes.forEach(node => (node.recipes_unlocked || []).forEach(id => {
        if (checked.has(id)) return
        checked.add(id)
        if (!event.server.recipeManager.byKey(ResourceLocation.parse(id)).isPresent()) missing.push(id)
      }))
      var families = /(?:^|[/_])(?:cobalt|compressed_iron|constantan|enderium|invar|lumium|neodymium|signalum|thorium|vanadium|zircaloy)(?:$|[/_])/
      var forms = /(?:^|[/_])(?:ingot|dust|nugget|plate|sheet|rod|wire|gear)(?:$|[/_])/
      var materialItems = []
      var iterator = BuiltInRegistries.ITEM.keySet().iterator()
      while (iterator.hasNext()) {
        var id = iterator.next()
        var itemPath = String(id.getPath())
        if (!families.test(itemPath) || !forms.test(itemPath)) continue
        var tags = []
        var tagIterator = BuiltInRegistries.ITEM.get(id).builtInRegistryHolder().tags().iterator()
        while (tagIterator.hasNext()) tags.push(String(tagIterator.next().location()))
        materialItems.push({ id: String(id), tags: tags.sort() })
      }
      report.checkedResearchRecipes = checked.size
      report.missingResearchRecipes = missing.sort()
      report.materialItems = materialItems
      report.serverTick = event.server.tickCount
      report.vanadiumProducers = supplyCandidates.map(recipe => ({
        id: recipe.id, json: recipe.json,
        presentAfterFinalize: event.server.recipeManager.byKey(ResourceLocation.parse(recipe.id)).isPresent()
      }))
      // KubeJS output filters do not cover every native machine schema. Read
      // final holders for this bounded family and serialize only those IDs.
      try {
        var JsonOps = Java.loadClass('com.mojang.serialization.JsonOps')
        var RegistryOps = Java.loadClass('net.minecraft.resources.RegistryOps')
        var ops = RegistryOps.create(JsonOps.INSTANCE, event.server.registryAccess())
        report.nativeVanadiumRecipes = []
        var recipes = event.server.recipeManager.getRecipes().iterator()
        while (recipes.hasNext()) {
          var holder = recipes.next()
          var recipeId = String(holder.id())
          if (!/(?:vanadium|magnetite)/.test(recipeId)) continue
          var recipe = holder.value()
          try {
            var json = recipe.getSerializer().codec().codec().encodeStart(ops, recipe).getOrThrow()
            report.nativeVanadiumRecipes.push({ id: recipeId, json: JSON.parse(String(json)) })
          } catch (error) {
            report.nativeVanadiumRecipes.push({ id: recipeId, error: String(error) })
          }
        }
      } catch (error) { report.errors.push('native recipe census: ' + String(error)) }
      try {
        var expected = JsonIO.read('kubejs/config/generated/validation/material_expected.json')
        var AlmostUnified = Java.loadClass('com.almostreliable.unified.api.AlmostUnified')
        var TagKey = Java.loadClass('net.minecraft.tags.TagKey')
        var Registries = Java.loadClass('net.minecraft.core.registries.Registries')
        report.unification = []
        Object.keys(expected.materials).forEach(material => {
          var forms = expected.materials[material].canonicalForms || {}
          Object.keys(forms).forEach(form => {
            var target = forms[form]
            var item = AlmostUnified.INSTANCE.getTagTargetItem(TagKey.create(Registries.ITEM, ResourceLocation.parse(target.tag)))
            report.unification.push({ tag: target.tag, expected: target.item,
              actual: item ? String(BuiltInRegistries.ITEM.getKey(item)) : null })
          })
        })
      } catch (error) { report.errors.push('unification: ' + String(error)) }
      JsonIO.write('kubejs/config/generated/validation/hardening_convergence.json', report)
      console.info('[Createch2 convergence] Checked ' + checked.size + ' research recipe IDs; missing=' + missing.length)
    } catch (error) {
      console.error('[Createch2 convergence] Lookup failed: ' + String(error))
      if (report) {
        report.errors.push('census: ' + String(error))
        JsonIO.write('kubejs/config/generated/validation/hardening_convergence.json', report)
      }
    }
  })
  // ProjectE maps after the first server tick. Keep the independent census,
  // then check native initial-load readiness at most once per second for 45s.
  // A legitimate zero value is not a readiness signal. This probe is for a
  // fresh validation process, not a claim about concurrent /reload behavior.
  ServerEvents.tick(event => {
    if (!emcPending || !report) return
    var now = Date.now()
    if (now < emcNextCheckAt) return
    emcNextCheckAt = now + 1000
    try {
      var Mapping = Java.loadClass('moze_intel.projecte.emc.EMCMappingHandler')
      var loadIndex = Number(Mapping.getLoadIndex())
      var mapSize = Number(Mapping.getEmcMapSize())
      var ready = loadIndex > 0 && mapSize > 0
      if (!ready && now - emcStartedAt < 45000) return
      emcPending = false
      report.emcProbe = { status: ready ? 'COMPLETE' : 'TIMED_OUT',
        truth: ready ? 'VERIFIED_RUNTIME' : 'INFERRED_UNVERIFIED',
        loadIndex: loadIndex, mapSize: mapSize, serverTick: event.server.tickCount,
        elapsedMs: now - emcStartedAt }
      if (ready) {
        var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
        var BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
        var EmcProxy = Java.loadClass('moze_intel.projecte.api.proxy.IEMCProxy')
        var ItemInfo = Java.loadClass('moze_intel.projecte.api.ItemInfo')
        report.emc = {}
        ;['modern_industrialization:iron_dust', 'modern_industrialization:iron_tiny_dust',
          'gtceu:tiny_iron_dust', 'gtceu:small_iron_dust', 'gtceu:tiny_stainless_steel_dust',
          'modern_industrialization:iridium_tiny_dust', 'gtceu:iridium_dust'].forEach(id => {
          report.emc[id] = String(EmcProxy.INSTANCE['getValue(moze_intel.projecte.api.ItemInfo)'](
            ItemInfo.fromItem(BuiltInRegistries.ITEM.get(ResourceLocation.parse(id)))))
        })
      }
    } catch (error) {
      emcPending = false
      report.emcProbe = { status: 'ERROR', truth: 'INFERRED_UNVERIFIED', error: String(error) }
      delete report.emc
      report.errors.push('EMC: ' + String(error))
    }
    JsonIO.write('kubejs/config/generated/validation/hardening_convergence.json', report)
    console.info('[Createch2 convergence] EMC probe ' + report.emcProbe.status)
  })
})()
