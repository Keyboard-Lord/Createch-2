// Temporary supplied-stock physical operation fixture. Never a release script.
;(function () {
  var fixture = null
  var BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
  var Components = Java.loadClass('com.simibubi.create.AllDataComponents')
  var Hand = Java.loadClass('net.minecraft.world.InteractionHand')
  var stockIds = ['greate:andesite_alloy_cogwheel', 'greate:large_andesite_alloy_cogwheel', 'minecraft:iron_nugget']
  function log(data) { console.info('[086a precision physical] ' + JSON.stringify(data)) }
  ServerEvents.basicCommand('086a_precision_physical', function (event) {
    var server = event.server
    if (String(server.worldData.levelName) !== '086a Performance') throw new Error('Disposable fixture world required')
    if (fixture) throw new Error('Physical fixture already active')
    server.runCommandSilent('forceload add -1600 2730')
    server.runCommandSilent('fill -1602 150 2728 -1598 150 2732 minecraft:stone')
    server.runCommandSilent('setblock -1600 151 2730 create:depot')
    server.runCommandSilent('setblock -1600 153 2730 create:deployer[facing=down,axis_along_first=false]')
    server.runCommandSilent('setblock -1600 153 2729 create:creative_motor[facing=south]{ScrollValue:64}')
    var level = server.overworld()
    var depot = level.getBlockEntity(new BlockPos(-1600, 151, 2730))
    fixture = { startTick: Number(server.tickCount), setupPending: true, lastStep: 0, supplied: [0, 0, 0], consumed: [0, 0, 0], handPhase: -1, handCount: 0, samples: [] }
    log({ event: 'started', input: 'create:golden_sheet', availableStock: stockIds, quantityEach: 5,
      boundary: 'Supplied creative stock/RPM; actual native ticking, consumption and output only. Earned acquisition/research is separate.' })
  })
  ServerEvents.tick(function (event) {
    if (!fixture) return
    var server = event.server, tick = Number(server.tickCount)
    if (tick % 5 !== 0) return
    var level = server.overworld()
    var depot = level.getBlockEntity(new BlockPos(-1600, 151, 2730))
    var deployer = level.getBlockEntity(new BlockPos(-1600, 153, 2730))
    if (!depot || !deployer) {
      if (tick - fixture.startTick > 200) {
        log({ truth: 'FIXTURE_BLOCK_ENTITY_ABSENT', depot: !!depot, deployer: !!deployer })
        server.runCommandSilent('forceload remove -1600 2730'); fixture = null
      }
      return
    }
    if (fixture.setupPending) { depot.setHeldItem(Item.of('create:golden_sheet')); fixture.setupPending = false }
    var held = depot.getHeldItem(), assembly = held.get(Components.SEQUENCED_ASSEMBLY)
    var step = assembly ? Number(assembly.step()) : 0
    var player = deployer.getPlayer(), hand = player.getMainHandItem()
    if (fixture.handPhase >= 0 && Number(hand.count) < fixture.handCount) {
      fixture.consumed[fixture.handPhase] += fixture.handCount - Number(hand.count)
      fixture.handCount = Number(hand.count)
    }
    if (step !== fixture.lastStep) {
      log({ event: 'step', step: step, item: String(held.id), speed: Number(deployer.getSpeed()), consumed: fixture.consumed })
      fixture.lastStep = step
    }
    if (!assembly && String(held.id) !== 'create:golden_sheet' && !held.empty) {
      var report = { truth: 'NATIVE_PHYSICAL_ASSEMBLY_COMPLETED', elapsedTicks: tick - fixture.startTick,
        output: String(held.id), count: Number(held.count), supplied: fixture.supplied, consumed: fixture.consumed,
        nativeWeightedOutcome: true, boundary: 'No recipe assemble/advance calls or granted research; actual world machine ticks.' }
      JsonIO.write('kubejs/createch2_precision_physical_result.json', report); log(report)
      server.runCommandSilent('forceload remove -1600 2730'); fixture = null; return
    }
    if (tick - fixture.startTick > 2400) {
      var report = { truth: 'PHYSICAL_FIXTURE_TIMED_OUT', step: step, item: String(held.id), speed: Number(deployer.getSpeed()),
        supplied: fixture.supplied, consumed: fixture.consumed, recipeFound: !!deployer.getRecipe(held) }
      JsonIO.write('kubejs/createch2_precision_physical_result.json', report); log(report)
      server.runCommandSilent('forceload remove -1600 2730'); fixture = null; return
    }
    if (hand.empty) {
      var phase = step % 3
      if (fixture.supplied[phase] < 5) {
        player.setItemInHand(Hand.MAIN_HAND, Item.of(stockIds[phase]))
        fixture.supplied[phase]++; fixture.handPhase = phase; fixture.handCount = 1
      }
    }
  })
})()
