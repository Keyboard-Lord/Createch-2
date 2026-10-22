;(function () {
// Createch 2 player and server runtime behavior.

// First-login onboarding
{
PlayerEvents.loggedIn(event => {
  var player = event.player
  if (player.persistentData.createch2_onboarding_prompted) return

  player.persistentData.createch2_onboarding_prompted = true
  player.tell(Text.translate('message.createch2.onboarding.first_login'))
})
}

// Planetary Forever-World Migration and Recoverable Proof
{
var CREATECH2_PLANETARY_WORLDGEN_VERSION = 1

ServerEvents.loaded(event => {
  try {
    var migrated = event.server.runCommandSilent(
      'execute unless data storage createch2:migration {createch2_planetary_worldgen_version:1} run data modify storage createch2:migration createch2_planetary_worldgen_version set value 1'
    )
    if (migrated > 0) {
      console.info(
        `[Createch2 Migration] Recorded planetary worldgen version ${CREATECH2_PLANETARY_WORLDGEN_VERSION}. ` +
        'No chunks were loaded, scanned, regenerated, or modified; legacy recovery recipes are active.'
      )
    }
  } catch (error) {
    console.warn(`[Createch2 Migration] Failed safely before touching any chunk: ${error}`)
  }
})

var CREATECH2_VISIT_PROOFS = [
  // Both installed lunar destinations share one saved campaign milestone.
  ['stellaris:moon', 'moon'],
  ['rocketnautics:moon', 'moon'],
  ['stellaris:mars', 'mars'],
  ['stellaris:mercury', 'mercury'],
  ['stellaris:venus', 'venus'],
  ['minecraft:the_end', 'end'],
  ['stellaris:jupiter', 'jupiter'],
  ['eternal_starlight:starlight', 'eternal_starlight'],
  ['sgjourney:abydos', 'sg_abydos'],
  ['sgjourney:unitas', 'sg_unitas'],
  ['sgjourney:rima', 'sg_rima'],
  ['sgjourney:cavum_tenebrae', 'sg_cavum'],
  ['sgjourney:lantea', 'sg_lantea'],
  ['sgjourney:athos', 'sg_athos'],
  ['sgjourney:chulak', 'sg_chulak'],
  ['the_bumblezone:the_bumblezone', 'bumblezone']
]

var createch2PlayerName = player => String(player.getGameProfile().getName())
var createch2GrantAdvancement = (player, advancement) => player.server.runCommandSilent(
  `advancement grant ${createch2PlayerName(player)} only ${advancement}`
)

ServerEvents.tick(event => {
  if (event.server.tickCount % 20 !== 0) {
    return
  }

  var players = event.server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) {
    var player = players.get(i)
    var dimension = String(player.level.dimension)
    for (var proof of CREATECH2_VISIT_PROOFS) {
      if (dimension !== proof[0]) continue
      var visitKey = `createch2_visited_${proof[1]}`
      if (!player.persistentData[visitKey]) {
        createch2GrantAdvancement(player, `createch2:planetary_visit/${proof[1]}`)
        player.persistentData[visitKey] = true
      }
      break
    }
  }
})

var CREATECH2_MINING_PROOFS = [
  ['stellaris:moon', 'monazite', 'moon_monazite'],
  ['stellaris:moon', 'native_platinum', 'moon_platinum'],
  ['stellaris:moon', 'native_osmium', 'moon_osmium'],
  ['stellaris:moon', 'zircon', 'moon_zircon'],
  ['rocketnautics:moon', 'monazite', 'moon_monazite'],
  ['rocketnautics:moon', 'native_platinum', 'moon_platinum'],
  ['rocketnautics:moon', 'native_osmium', 'moon_osmium'],
  ['rocketnautics:moon', 'zircon', 'moon_zircon'],
  ['stellaris:mars', 'bauxite', 'mars_bauxite'],
  ['stellaris:mars', 'rutile', 'mars_rutile'],
  ['stellaris:mars', 'spodumene', 'mars_spodumene'],
  ['stellaris:mars', 'zircon', 'mars_zircon'],
  ['stellaris:mercury', 'wolframite', 'mercury_wolframite'],
  ['stellaris:mercury', 'uraninite', 'mercury_uraninite'],
  ['stellaris:mercury', 'native_osmium', 'mercury_osmium'],
  ['stellaris:mercury', 'native_iridium', 'mercury_iridium'],
  ['stellaris:venus', 'stibnite', 'venus_stibnite'],
  ['stellaris:venus', 'magnesite', 'venus_magnesite'],
  ['stellaris:venus', 'sulfur', 'venus_sulfur'],
  ['minecraft:the_end', 'bertrandite', 'end_bertrandite'],
  ['sgjourney:abydos', 'naquadah', 'sg_abydos_naquadah'],
  ['sgjourney:unitas', 'galena', 'sg_unitas_galena'],
  ['sgjourney:unitas', 'garnierite', 'sg_unitas_garnierite'],
  ['sgjourney:rima', 'uraninite', 'sg_rima_uraninite'],
  ['sgjourney:rima', 'zircon', 'sg_rima_zircon'],
  ['sgjourney:cavum_tenebrae', 'native_platinum', 'sg_cavum_platinum'],
  ['sgjourney:cavum_tenebrae', 'native_osmium', 'sg_cavum_osmium'],
  ['sgjourney:cavum_tenebrae', 'native_iridium', 'sg_cavum_iridium'],
  ['sgjourney:lantea', 'certus_quartz', 'sg_lantea_certus_quartz']
]

var createch2BlockMatchesOreFamily = (block, family) => {
  try {
    if (block.hasTag(`createch2:geology/planetary_ore_family/${family}`)) return true
  } catch (ignored) {
    // The ID fallback below preserves proof if a wrapper lacks hasTag().
  }
  var id = String(block.id)
  if (family === 'naquadah') return /^sgjourney:(?:deepslate_)?naquadah_ore$/.test(id)
  if (family === 'sulfur') return /^tfc:ore\/sulfur\//.test(id)
  if (family === 'certus_quartz') return /^tfc_metallurgy:ore\/certus_quartz\//.test(id)
  return new RegExp(`^tfc_metallurgy:ore/(?:poor_|normal_|rich_)?${family}/`).test(id)
}

BlockEvents.broken(event => {
  var player = event.player
  if (!player || player.isFake && player.isFake()) return
  var dimension = String(event.level.dimension)
  for (var proof of CREATECH2_MINING_PROOFS) {
    if (dimension !== proof[0] || !createch2BlockMatchesOreFamily(event.block, proof[1])) continue
    createch2GrantAdvancement(player, `createch2:planetary_mining/${proof[2]}`)
    break
  }
})
}

// Jupiter Local Atmospheric Infrastructure
{
var CREATECH2_JUPITER_DIMENSION = 'stellaris:jupiter'
var CREATECH2_JOVIAN_REQUIRED_BLOCKS = new Set([
  'stellaris:vacuumator',
  'stellaris:t4_tank',
  'stellaris:rocket_station'
])
var CREATECH2_JOVIAN_POWER_BLOCKS = new Set([
  'electroenergetics:hanging_glass_insulator',
  'modern_industrialization:hv_energy_input_hatch',
  'modern_industrialization:ev_energy_input_hatch'
])

// The native Vacuumator is a powered canning machine, not an atmosphere API.
// This pack service consumes its real stored power plus tank utility water.
// No reward is issued from cached proximity or an empty/unpowered installation.
var Createch2JovianRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
var createch2JovianStationWarned = false
var createch2JovianStationBatch = player => {
  var found = new Set()
  var power = false
  var vacuumator = null
  var waterTank = null
  var waterTankEntity = null
  var baseX = Math.floor(player.x)
  var baseY = Math.floor(player.y)
  var baseZ = Math.floor(player.z)
  for (var x = baseX - 6; x <= baseX + 6; x++) {
    for (var y = baseY - 3; y <= baseY + 3; y++) {
      for (var z = baseZ - 6; z <= baseZ + 6; z++) {
        var block = player.level.getBlock(x, y, z)
        if (!player.level.hasChunkAt(block.pos)) continue
        var id = String(block.id)
        if (CREATECH2_JOVIAN_REQUIRED_BLOCKS.has(id)) found.add(id)
        if (CREATECH2_JOVIAN_POWER_BLOCKS.has(id)) power = true
        if (id === 'stellaris:vacuumator' && block.entity && Number(block.entity.getEnergy(null).getEnergy()) >= 1000) vacuumator = block.entity
        if (id === 'stellaris:t4_tank' && block.entity) {
          var candidate = block.entity.getFluidTank()
          var fluid = candidate.getFluidInTank(0)
          if (String(Createch2JovianRegistries.FLUID.getKey(fluid.getFluid())) === 'minecraft:water' && Number(fluid.getAmount()) >= 1000) { waterTank = candidate; waterTankEntity = block.entity }
        }
      }
    }
  }
  if (!power || !vacuumator || !waterTank || found.size !== CREATECH2_JOVIAN_REQUIRED_BLOCKS.size) return false
  var energy = vacuumator.getEnergy(null)
  // Installed Potentials/SingleFluidStorage use true=simulate. On the server
  // thread no other tick runs between these checks and their matching debit.
  if (Number(energy.extractWithoutLimits(1000, true)) !== 1000 || Number(waterTank.drainWithoutLimits(1000, true).getAmount()) !== 1000) return false
  var waterBefore = Number(waterTank.getFluidInTank(0).getAmount())
  if (Number(energy.extractWithoutLimits(1000, false)) !== 1000) return false
  vacuumator.setChanged()
  // Installed Stellaris reads the fluid AFTER shrinking its tank. At exactly
  // one remaining bucket, Architectury turns that returned stack into EMPTY
  // even though the full water debit occurred. Verify the stored amount delta.
  waterTank.drainWithoutLimits(1000, false)
  waterTankEntity.setChanged()
  if (waterBefore - Number(waterTank.getFluidInTank(0).getAmount()) !== 1000) return false
  return true
}

ServerEvents.tick(event => {
  if (event.server.tickCount % 100 !== 0) return
  var players = event.server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) {
    var player = players.get(i)
    if (String(player.level.dimension) !== CREATECH2_JUPITER_DIMENSION) continue
    var cooldown = Number(player.persistentData.createch2_jovian_collection_cooldown || 0)
    if (cooldown > 0) {
      player.persistentData.createch2_jovian_collection_cooldown = Math.max(0, cooldown - 100)
      continue
    }
    var stationReady = false
    try { stationReady = createch2JovianStationBatch(player) }
    catch (error) {
      if (!createch2JovianStationWarned) {
        console.warn('[Createch2 Jupiter] Operating input check failed closed; no batch issued: ' + error)
        createch2JovianStationWarned = true
      }
    }
    // Legacy proximity flags never authorize a batch after this migration.
    player.persistentData.createch2_jovian_station_ready = stationReady
    if (!stationReady) continue
    createch2GrantAdvancement(player, 'createch2:planetary_visit/jupiter_infrastructure')
    player.give('minecraft:knowledge_book')
    player.give('stellaris:hydrogen_bucket')
    player.persistentData.createch2_jovian_collection_cooldown = 1200
  }
})
}



// Deep Space Native Asteroid Fallback
{
// Rocketnautics' native player-tick condition currently recognizes a dimension
// path of "space" or altitude above Y 5000. The shipped travel dimension is
// rocketnautics:deep_space, so ordinary Deep Space instances can miss natural
// asteroid spawning. This fallback calls the native AsteroidSpawner once every
// ten minutes only when the player is in Deep Space at or below Y 5000.
var CREATECH2_DEEP_SPACE_DIMENSION = 'rocketnautics:deep_space'
var CREATECH2_ASTEROID_FALLBACK_INTERVAL = 12000
var createch2AsteroidFallbackLogged = false
var Createch2AsteroidSpawner = null

try {
  // Load locally: KubeJS isolates the top-level behavior blocks, so helpers
  // declared by the atmosphere block are not visible here after a reload.
  Createch2AsteroidSpawner = Java.loadClass('dev.devce.rocketnautics.content.physics.AsteroidSpawner')
} catch (error) {
  console.warn(`[Createch2] Could not load the native Rocketnautics AsteroidSpawner; command fallback will be used. ${error}`)
}

var createch2SpawnDeepSpaceAsteroid = player => {
  try {
    if (Createch2AsteroidSpawner !== null) {
      Createch2AsteroidSpawner.spawnAsteroid(player, player.serverLevel())
      return
    }
  } catch (error) {
    if (!createch2AsteroidFallbackLogged) {
      createch2AsteroidFallbackLogged = true
      console.warn(`[Createch2] Native asteroid spawn call failed; using /rn command fallback. ${error}`)
    }
  }
  player.server.runCommandSilent(
    `execute as ${String(player.getGameProfile().getName())} at @s run rn asteroid spawn`
  )
}

ServerEvents.tick(event => {
  if (event.server.tickCount % CREATECH2_ASTEROID_FALLBACK_INTERVAL !== 0) return
  var players = event.server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) {
    var player = players.get(i)
    if (String(player.level.dimension) !== CREATECH2_DEEP_SPACE_DIMENSION) continue
    if (player.getY() > 5000) continue // Native Rocketnautics condition already covers this altitude.
    createch2SpawnDeepSpaceAsteroid(player)
    break // One asteroid per interval per server, not one per passenger.
  }
})
}

})()
