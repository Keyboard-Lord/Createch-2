// Createch 2 full-trunk physical authority.
// The generated registry list contains only real blockstate-backed trunk blocks;
// manufactured wood products are classified and excluded in the tree ledger.

var createch2TreeAuthority = JsonIO.read('kubejs/config/createch2_tree_authority.json')
var createch2FullTrunks = createch2TreeAuthority && createch2TreeAuthority.full_trunks
  ? createch2TreeAuthority.full_trunks
  : []

BlockEvents.modification(event => {
  createch2FullTrunks.forEach(blockId => {
    event.modify(blockId, block => {
      // Preserve the source block's native tool-requirement flag. For TFC
      // trunks, forcing requiresCorrectToolForDrops here bypasses the block's
      // native chopping/effectiveness path and makes valid TFC axes behave like
      // hands. The server-side player guard remains the axe-only authority.
      // High blast resistance independently closes the explosion bypass.
      block.setExplosionResistance(1200.0)
    })
  })
})

console.info(`[Createch2 Tree Authority] Protected ${createch2FullTrunks.length} full-trunk blocks`)
