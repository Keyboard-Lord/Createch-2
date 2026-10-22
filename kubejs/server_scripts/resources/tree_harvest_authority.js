// Player mining guard for the authoritative full-trunk tag. Machines such as
// Create saws, turtles and earned forestry systems do not impersonate an
// empty-handed player and keep their own power/tool/age costs.

var createch2IsAcceptedTreeTool = item => {
  if (!item || item.empty) return false
  return item.hasTag('minecraft:axes') || item.hasTag('c:tools/axes')
}

BlockEvents.leftClicked(event => {
  if (!event.block.hasTag('createch2:forestry/trunks/full_tree')) return
  if (event.player && event.player.creative) return
  if (!createch2IsAcceptedTreeTool(event.item)) event.cancel()
})

// Defense in depth for mining systems that synthesize a final player break
// without delivering the ordinary left-click start event.
BlockEvents.broken(event => {
  if (!event.block.hasTag('createch2:forestry/trunks/full_tree')) return
  if (event.player && event.player.creative) return
  if (!createch2IsAcceptedTreeTool(event.player.mainHandItem)) event.cancel()
})
