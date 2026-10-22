// priority: 100000
// Temporary read-only operator capture. Never a release script.
;(function () {
  var control = JsonIO.read('kubejs/config/createch2_recipe_diagnostic.json')
  var report = { beforePolicy: {}, snapshots: [], errors: [], javaAdapterAvailable: typeof JavaAdapter !== 'undefined' }
  var precision = 'greate:sequenced_assembly/precision_mechanism'
  var ids = control.ids
  ServerEvents.recipes(function (event) {
    var records = {}
    ids.concat([precision]).forEach(function (id) {
      event.forEachRecipe({ id: id }, function (recipe) {
        records[id] = JSON.parse(String(recipe.json))
      })
    })
    report.beforePolicy = records
    console.info('[086a recipe diagnostic] Pre-policy precision present: ' + !!records[precision])
  })
  var ticks = 0
  function capture(server, phase) {
    var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
    var Recipe = Java.loadClass('net.minecraft.world.item.crafting.Recipe')
    var RegistryOps = Java.loadClass('net.minecraft.resources.RegistryOps')
    var JsonOps = Java.loadClass('com.mojang.serialization.JsonOps')
    var BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
    var ops = RegistryOps.create(JsonOps.INSTANCE, server.registryAccess())
    var Snapshot = Java.loadClass('createch2.core.compat.RecipePolicySnapshot')
    var payloads = JSON.parse(String(Snapshot.selectedPayloads(server, ids.concat([precision]))))
    var records = {}
    Object.keys(payloads).forEach(function (id) { records[id] = { payload: payloads[id] } })
    report.snapshots.push({ phase: phase, tick: Number(server.tickCount), recipes: records })
    if (phase === 'later' && control.fullCensus !== false) {
      var complete = JSON.parse(String(Snapshot.capture(server)))
      if (!/^[A-Z][A-Z0-9_]{0,31}$/.test(control.label)) throw new Error('Invalid semantic-control label')
      JsonIO.write('kubejs/createch2_semantic_' + control.label + '.json', complete)
      report.postCensusPayloads = JSON.parse(String(Snapshot.selectedPayloads(server, ids.concat([precision]))))
      report.semanticControlLabel = control.label
      report.currentCoreDataHashes = {}
      ids.concat([precision]).forEach(function (id) { report.currentCoreDataHashes[id] = complete.recipePayloadHashes[id] })
      report.currentResearchIdsMissing = []
      var ledger = JsonIO.read('kubejs/config/createch2_research_tree.json')
      ledger.nodes.forEach(function (node) {
        node.recipes_unlocked.forEach(function (id) {
          if (!complete.recipeNetworkHashes[id]) report.currentResearchIdsMissing.push(id)
        })
      })
    }
    report.controlLabel = control.label
    JsonIO.write('kubejs/createch2_recipe_diagnostic_result.json', report)
    if (!report.registryIds) {
      report.registryIds = {}
      ;['ITEM', 'RECIPE_SERIALIZER', 'DATA_COMPONENT_TYPE', 'FLUID'].forEach(function (key) {
        var registry = BuiltInRegistries[key], mappings = {}
        var iterator = registry.keySet().iterator()
        while (iterator.hasNext()) {
          var id = iterator.next()
          mappings[String(id)] = Number(registry.getId(id))
        }
        report.registryIds[key] = mappings
      })
    }
    JsonIO.write('kubejs/createch2_recipe_diagnostic_result.json', report)
    console.info('[086a recipe diagnostic] Captured ' + phase + ': ' + Object.keys(records).length + ' recipes')
  }
  ServerEvents.tick(function (event) {
    if (String(event.server.worldData.levelName) !== '086a Performance') return
    ticks++
    if (ticks !== 1 && ticks !== 101) return
    try {
      capture(event.server, ticks === 1 ? 'initial' : 'later')
      if (ticks === 1) capture(event.server, 'same_tick_repeat')
    } catch (error) {
      report.errors.push(String(error))
      JsonIO.write('kubejs/createch2_recipe_diagnostic_result.json', report)
      console.error('[086a recipe diagnostic] ' + String(error))
    }
  })
})()
