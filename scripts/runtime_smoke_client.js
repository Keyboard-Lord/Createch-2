// Copied into an isolated validation instance only; never a player-pack input.
;(function () {
  var SmokeMinecraft = Java.loadClass('net.minecraft.client.Minecraft')
  var joinedAt = 0
  var stopping = false
  ClientEvents.loggedIn(event => {
    joinedAt = Date.now()
    console.info('[Createch2 isolated smoke] client joined; sampling 60 seconds before clean exit')
  })
  ClientEvents.tick(event => {
    var client = SmokeMinecraft.getInstance()
    if (!stopping && joinedAt > 0 && Date.now() - joinedAt >= 60000) {
      stopping = true
      console.info('[Createch2 isolated smoke] requesting clean client stop')
      client.stop()
    }
  })
})()
