// Createch 2 Threat Classification System.
// Champions selects tier/archetype first, then applies this supported event
// before attaching data. Eligibility, ceilings and final affix removals live here.

var CREATECH2_CHAMPIONS = JsonIO.read('kubejs/config/createch2_champions_authority.json')
var CREATECH2_CHAMPION_ELIGIBLE = {}
CREATECH2_CHAMPIONS.eligible_entities.forEach(entityId => {
  CREATECH2_CHAMPION_ELIGIBLE[String(entityId)] = true
})

ChampionsEvents.spawn(event => {
  var champion = event.getChampion()
  var entity = champion.entity()
  var entityId = String(entity.type)
  var dimension = String(entity.level.dimension)
  var tier = event.getTier().level()

  if (CREATECH2_CHAMPION_ELIGIBLE[entityId] !== true) {
    event.cancel()
    return
  }

  var configuredCap = CREATECH2_CHAMPIONS.dimension_rank_ceiling[dimension]
  var rankCap = configuredCap === undefined
    ? CREATECH2_CHAMPIONS.default_rank_ceiling
    : configuredCap

  if (tier > rankCap || (tier >= 5 && !CREATECH2_CHAMPIONS.ambient_rank_v)) {
    event.cancel()
    return
  }

  CREATECH2_CHAMPIONS.always_removed_affixes.forEach(affix => event.removeAffix(affix))
  Object.keys(CREATECH2_CHAMPIONS.rank_restricted_affixes).forEach(affix => {
    if (tier < CREATECH2_CHAMPIONS.rank_restricted_affixes[affix]) event.removeAffix(affix)
  })
})
