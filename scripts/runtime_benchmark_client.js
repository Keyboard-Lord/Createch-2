// Validation copy only. Paired with runtime_benchmark_server.js; never shipped.
;(function () {
  var BenchmarkMinecraft = Java.loadClass('net.minecraft.client.Minecraft')
  var joinedAt = 0
  var nextSample = 0
  var stopping = false
  var completedAt = 0
  NetworkEvents.dataReceived('createch2_benchmark_complete', event => {
    completedAt = Date.now()
    console.info('[Createch2 benchmark] completion_received=' + completedAt)
  })
  ClientEvents.loggedIn(event => {
    joinedAt = Date.now()
    nextSample = joinedAt
    console.info('[Createch2 benchmark] client_start=' + joinedAt)
  })
  ClientEvents.tick(event => {
    if (!joinedAt || stopping) return
    var client = BenchmarkMinecraft.getInstance()
    var now = Date.now()
    if (now >= nextSample) {
      nextSample = now + 1000
      console.info('[Createch2 benchmark client] ' + JSON.stringify({
        at: now, elapsed: (now - joinedAt) / 1000,
        fps: Number(client.getFps()), sampledFrameMs: Number(client.getFrameTimeNs()) / 1000000,
        focused: client.isWindowActive(), screenOpen: client.screen !== null,
        inWorld: client.level !== null
      }))
    }
    if ((completedAt && now - completedAt >= 15000) || now - joinedAt >= 1200000) {
      stopping = true
      console.info('[Createch2 benchmark] ' + (completedAt ? 'clean_client_stop' : 'timeout_client_stop'))
      client.stop()
    }
  })
})()
