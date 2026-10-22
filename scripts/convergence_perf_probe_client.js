// Temporary matching client observer; native clean stop after completed workload.
;(function () {
  var Minecraft = Java.loadClass('net.minecraft.client.Minecraft')
  var settings = JsonIO.read('kubejs/config/createch2_perf_trial.json')
  var started = 0, sampleAt = 0, completed = 0, stopping = false
  ClientEvents.loggedIn(event => {
    var server = Minecraft.getInstance().getSingleplayerServer()
    if (server === null || String(server.worldData.levelName) !== '086a Performance') return
    started = Date.now()
  })
  NetworkEvents.dataReceived('createch2_perf_complete', event => { if (started) completed = Date.now() })
  ClientEvents.tick(event => {
    if (!started || stopping) return
    var now = Date.now(), client = Minecraft.getInstance()
    if (now - sampleAt >= 1000) {
      sampleAt = now
      console.info('[086a Perf client] ' + JSON.stringify({ trial: settings.id, at: now, fps: Number(client.getFps()),
        frameWorkMs: Number(client.getFrameTimeNs()) / 1000000, focused: client.isWindowActive(), screenOpen: client.screen !== null }))
    }
    if (completed && now - completed >= 15000 || now - started >= 900000) {
      stopping = true
      console.info('[086a Perf client] ' + JSON.stringify({ trial: settings.id, event: completed ? 'clean_stop' : 'timeout_stop', at: now }))
      client.stop()
    }
  })
})()
