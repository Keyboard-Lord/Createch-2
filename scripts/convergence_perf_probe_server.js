// Temporary operator workload. Exact disposable world only; no release recipe changes.
// priority: -10000
;(function () {
  var Snapshot = Java.loadClass('createch2.core.compat.RecipePolicySnapshot')
  var settings = JsonIO.read('kubejs/config/createch2_perf_trial.json')
  function eligible(server) { return settings && String(server.worldData.levelName) === '086a Performance' }
  function log(data) { console.info('[086a Perf] ' + JSON.stringify(data)) }
  function phase(server, name) {
    server.persistentData.putString('c2p_phase', name)
    server.persistentData.putLong('c2p_at', Date.now())
    log({ event: 'phase', trial: settings.id, phase: name, at: Date.now() })
  }
  function encodingContext(server, builtins) {
    var context = { schema: 1, scope: 'BUILTIN_AND_SERVER_REGISTRIES_WITH_NATIVE_TAG_ORDER', registryIds: {}, tagValueOrder: {} }
    function collect(registry) {
      var name = String(registry.key().location()), ids = {}, tags = {}
      var keys = registry.keySet().iterator()
      while (keys.hasNext()) {
        var key = keys.next()
        ids[String(key)] = Number(registry.getId(key))
      }
      var pairs = registry.getTags().iterator()
      while (pairs.hasNext()) {
        var pair = pairs.next(), values = [], holders = pair.getSecond().stream().iterator()
        while (holders.hasNext()) values.push(String(holders.next().unwrapKey().orElseThrow().location()))
        tags[String(pair.getFirst().location())] = values
      }
      context.registryIds[name] = ids
      context.tagValueOrder[name] = tags
    }
    var staticKeys = builtins.REGISTRY.keySet().iterator()
    while (staticKeys.hasNext()) collect(builtins.REGISTRY.get(staticKeys.next()))
    var dynamicEntries = server.registryAccess().registries().iterator()
    while (dynamicEntries.hasNext()) collect(dynamicEntries.next().value())
    // Resolve the exact registries used by holder/custom-ingredient codecs
    // through the same server access, including custom NeoForge registries.
    var FoodTraits = Java.loadClass('net.dries007.tfc.common.component.food.FoodTraits')
    var NeoForgeKeys = Java.loadClass('net.neoforged.neoforge.registries.NeoForgeRegistries$Keys')
    collect(server.registryAccess().registryOrThrow(FoodTraits.KEY))
    collect(server.registryAccess().registryOrThrow(NeoForgeKeys.INGREDIENT_TYPES))
    return context
  }
  function selectedNetwork(server, ids) {
    if (!server.isSameThread() || !Array.isArray(ids) || !ids.length || ids.length > 256)
      throw new Error('Invalid bounded server-thread wire capture')
    var Scope = Java.loadClass('createch2.core.compat.RecipeSnapshotScope')
    var Recipe = Java.loadClass('net.minecraft.world.item.crafting.Recipe')
    var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
    var RegistryBuffer = Java.loadClass('net.minecraft.network.RegistryFriendlyByteBuf')
    var ConnectionType = Java.loadClass('net.neoforged.neoforge.network.connection.ConnectionType')
    var Unpooled = Java.loadClass('io.netty.buffer.Unpooled')
    var ByteBufUtil = Java.loadClass('io.netty.buffer.ByteBufUtil')
    var result = {}, total = 0, scope = Scope.open()
    try {
      ids.forEach(function (id) {
        var holder = server.recipeManager.byKey(ResourceLocation.parse(id))
        if (!holder.isPresent()) throw new Error('Native wire capture recipe absent: ' + id)
        var rawBuffer = Unpooled.buffer(256, 1024 * 1024)
        try {
          var buffer = new RegistryBuffer(rawBuffer, server.registryAccess(), ConnectionType.NEOFORGE)
          Recipe.STREAM_CODEC.encode(buffer, holder.get().value())
          var size = Number(buffer.readableBytes())
          total += size
          if (total > 8 * 1024 * 1024) throw new Error('Native wire selection exceeds 8 MiB')
          result[id] = { byteCount: size, hex: String(ByteBufUtil.hexDump(buffer)) }
        } finally { rawBuffer.release() }
      })
    } finally { scope.close() }
    return result
  }
  PlayerEvents.loggedIn(event => {
    var server = event.server
    if (!eligible(server)) return
    var data = server.persistentData
    data.putString('c2p_trial', settings.id)
    data.putInt('c2p_waypoint', -1)
    data.putLong('c2p_sample', 0)
    data.putLong('c2p_tick', server.getTickCount())
    server.runCommandSilent('gamemode spectator ' + event.player.username)
    server.runCommandSilent('execute in minecraft:overworld run tp ' + event.player.username + ' -1587.5 160 2728.5 -90 25')
    log({ event: 'login', trial: settings.id, at: Date.now(), revision: Snapshot.datapackRevision() })
    phase(server, 'warmup')
  })
  ServerEvents.tick(event => {
    var server = event.server
    if (!eligible(server)) return
    var data = server.persistentData
    if (String(data.getString('c2p_trial')) !== settings.id) return
    var now = Date.now(), current = String(data.getString('c2p_phase')), elapsed = now - Number(data.getLong('c2p_at'))
    if (current === 'complete' || current === 'failed') return
    var sampleAt = Number(data.getLong('c2p_sample'))
    if (now - sampleAt >= 1000) {
      var tick = Number(server.getTickCount()), previousTick = Number(data.getLong('c2p_tick'))
      log({ event: 'server_sample', trial: settings.id, phase: current, at: now,
        mspt: Number(server.getAverageTickTimeNanos()) / 1000000,
        tps: sampleAt ? (tick - previousTick) * 1000 / (now - sampleAt) : null })
      data.putLong('c2p_sample', now); data.putLong('c2p_tick', tick)
    }
    if (current === 'warmup' && elapsed >= 60000 || current === 'reload_settle' && elapsed >= 30000) {
      data.putLong('c2p_revision', Snapshot.datapackRevision())
      var name = current === 'warmup' ? 'reload_1' : 'reload_2'
      phase(server, name)
      server.runCommandSilent('reload')
    } else if (current === 'reload_1' || current === 'reload_2') {
      if (Number(Snapshot.datapackRevision()) > Number(data.getLong('c2p_revision'))) {
        log({ event: 'reload_complete', trial: settings.id, phase: current, at: now, durationMs: elapsed, revision: Snapshot.datapackRevision() })
        phase(server, current === 'reload_1' ? 'reload_settle' : 'stationary')
      } else if (elapsed > 180000) { phase(server, 'failed'); throw new Error('Native resource reload did not complete') }
    } else if (current === 'stationary' && elapsed >= 60000) {
      data.putLong('c2p_next_waypoint', now)
      phase(server, 'new_chunks')
    } else if (current === 'new_chunks' && now >= Number(data.getLong('c2p_next_waypoint'))) {
      var waypoint = Number(data.getInt('c2p_waypoint')) + 1
      if (waypoint === 12) phase(server, 'settle')
      else {
        var x = 40960 + 128 * waypoint
        server.runCommandSilent('execute as @a in minecraft:overworld run tp @s ' + x + ' 160 32768 -90 25')
        data.putInt('c2p_waypoint', waypoint)
        data.putLong('c2p_next_waypoint', Date.now() + 5000)
        log({ event: 'waypoint', trial: settings.id, index: waypoint, x: x, at: Date.now() })
      }
    } else if (current === 'settle' && elapsed >= 30000) {
      phase(server, 'snapshot')
      var start = Date.now()
      var managed = JsonIO.read('kubejs/config/createch2_perf_managed.json')
      var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
      var BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
      var checked = 0
      managed.recipes.forEach(function (fixture) {
        var holder = server.recipeManager.byKey(ResourceLocation.parse(fixture.id))
        if (!holder.isPresent()) throw new Error('Missing managed native recipe: ' + fixture.id)
        var recipe = holder.get().value(), ingredients = recipe.getIngredients()
        if (Number(recipe.getWidth()) !== fixture.width || Number(recipe.getHeight()) !== fixture.height)
          throw new Error('Managed native pattern changed: ' + fixture.id)
        var output = recipe.getResultItem(server.registryAccess())
        if (String(BuiltInRegistries.ITEM.getKey(output.getItem())) !== fixture.result.id || Number(output.getCount()) !== (fixture.result.count || 1))
          throw new Error('Managed native result changed: ' + fixture.id)
        fixture.slots.forEach(function (slot) {
          var ingredient = ingredients.get(slot.index)
          slot.accept.forEach(function (item) {
            if (!ingredient.test(Item.of(item))) throw new Error('Managed native ingredient rejected ' + item + ': ' + fixture.id)
            checked++
          })
          if (ingredient.test(Item.of(slot.reject))) throw new Error('Managed native shortcut accepted: ' + fixture.id)
          checked++
        })
      })
      log({ event: 'managed_native_contract', trial: settings.id, at: Date.now(), recipes: managed.recipes.length, ingredientDecisions: checked })
      // All captures occur after measured phases. Preserve native numeric IDs
      // and tag iteration order; neither is normalized into a parity claim.
      var context = encodingContext(server, BuiltInRegistries)
      ;['tfc:food_trait', 'neoforge:ingredient_serializer'].forEach(function (id) {
        if (!context.registryIds[id] || !Object.keys(context.registryIds[id]).length)
          throw new Error('Native ingredient wire registry context absent: ' + id)
      })
      JsonIO.write('kubejs/createch2_perf_encoding_context.json', context)
      if (!Array.isArray(settings.captureRecipeIds) || !settings.captureRecipeIds.length || settings.captureRecipeIds.length > 256)
        throw new Error('Missing bounded raw recipe capture selection')
      var selectedBefore = JSON.parse(String(Snapshot.selectedPayloads(server, settings.captureRecipeIds)))
      settings.captureRecipeIds.forEach(function (id) {
        if (!Object.prototype.hasOwnProperty.call(selectedBefore, id)) throw new Error('Raw capture recipe absent: ' + id)
      })
      var wireBefore = selectedNetwork(server, settings.captureRecipeIds)
      var snapshot = JSON.parse(String(Snapshot.capture(server)))
      var wireAfter = selectedNetwork(server, settings.captureRecipeIds)
      var selectedAfter = JSON.parse(String(Snapshot.selectedPayloads(server, settings.captureRecipeIds)))
      JsonIO.write('kubejs/createch2_perf_selected_payloads.json', { beforeCensus: selectedBefore, afterCensus: selectedAfter })
      JsonIO.write('kubejs/createch2_perf_selected_network.json', { schema: 1, beforeCensus: wireBefore, afterCensus: wireAfter })
      JsonIO.write('kubejs/createch2_perf_result.json', snapshot)
      log({ event: 'snapshot', trial: settings.id, at: Date.now(), durationMs: Date.now() - start,
        recipes: Object.keys(snapshot.recipePayloadHashes).length, unsupported: Object.keys(snapshot.unsupportedRecipeCodecs).length,
        semanticSha256: snapshot.semanticSha256 })
      phase(server, 'complete')
      server.sendData('createch2_perf_complete')
    }
  })
})()
