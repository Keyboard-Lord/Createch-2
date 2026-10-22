// Controlled copied-save workload: warmup 120s, stationary 60s, 18 new-chunk
// waypoints at least 5s apart, settle 30s. No waypoints are skipped under load.
;(function () {
  var startedAt = 0
  var lastSample = 0
  var lastTick = 0
  var waypoint = -1
  var phase = ''
  var phaseStartedAt = 0
  var nextWaypointAt = 0
  var benchmarkPlayer = null
  var completed = false
  PlayerEvents.loggedIn(event => {
    if (String(event.player.username) !== 'Createch2Check') return
    startedAt = Date.now()
    benchmarkPlayer = event.player
    phaseStartedAt = startedAt
    lastSample = startedAt
    lastTick = event.server.getTickCount()
    event.server.runCommandSilent('gamemode spectator Createch2Check')
    event.server.runCommandSilent('execute in minecraft:overworld run tp Createch2Check 2839 160 2318 -90 25')
    console.info('[Createch2 benchmark] server_start=' + startedAt + ' spectator=' + benchmarkPlayer.isSpectator() + ' x=' + benchmarkPlayer.getX() + ' y=' + benchmarkPlayer.getY())
  })
  ServerEvents.tick(event => {
    if (!startedAt || completed) return
    var server = event.server
    var now = Date.now()
    var elapsed = (now - startedAt) / 1000
    var currentPhase = phase || 'warmup'
    if (phase === 'warmup' && now - phaseStartedAt >= 120000) currentPhase = 'stationary'
    if (phase === 'stationary' && now - phaseStartedAt >= 60000) currentPhase = 'new_chunks'
    if (phase === 'new_chunks' && waypoint === 17 && now >= nextWaypointAt) currentPhase = 'settle'
    if (phase !== currentPhase) {
      phase = currentPhase
      phaseStartedAt = now
      if (phase === 'new_chunks') nextWaypointAt = now
      console.info('[Createch2 benchmark] phase=' + phase + ' at=' + now)
    }
    if (phase === 'new_chunks' && waypoint < 17 && now >= nextWaypointAt) {
        waypoint++
        var x = 2839 + 128 * (waypoint + 1)
        server.runCommandSilent('execute in minecraft:overworld run tp Createch2Check ' + x + ' 160 2318 -90 25')
        console.info('[Createch2 benchmark] waypoint=' + waypoint + ' x=' + x + ' at=' + now + ' observedX=' + benchmarkPlayer.getX() + ' observedY=' + benchmarkPlayer.getY())
        nextWaypointAt = Date.now() + 5000
    }
    if (now - lastSample >= 1000) {
      var tick = server.getTickCount()
      console.info('[Createch2 benchmark server] ' + JSON.stringify({ at: now, elapsed: elapsed,
        phase: phase, averageMspt: Number(server.getAverageTickTimeNanos()) / 1000000,
        observedTps: (tick - lastTick) * 1000 / (now - lastSample), tick: tick }))
      lastSample = now
      lastTick = tick
    }
    if (phase === 'settle' && now - phaseStartedAt >= 30000) {
      completed = true
      console.info('[Createch2 benchmark] scenario_complete at=' + now + ' finalWaypoint=' + waypoint)
      server.sendData('createch2_benchmark_complete')
    }
  })
})()
