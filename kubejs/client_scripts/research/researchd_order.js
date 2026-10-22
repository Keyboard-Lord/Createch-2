;(function () {
// Research'd builds both of its visible side lists from hash-backed collections.
// Keep the UI stable by applying the canonical ledger order after the screen is
// initialized. This changes presentation only; registry IDs and save progress
// remain untouched.
var Createch2ResearchTree = JsonIO.read('kubejs/config/createch2_research_tree.json')
var Createch2Minecraft = Java.loadClass('net.minecraft.client.Minecraft')
var Createch2ResearchScreen = Java.loadClass(
  'com.portingdeadmods.researchd.client.screens.research.ResearchScreen'
)

var createch2PageOrder = []
var createch2NodeOrder = []
var createch2LastScreen = null
var createch2LastDisplayTechList = null

Createch2ResearchTree.pages.forEach(page => {
  createch2PageOrder.push(String(page.id))
})

Createch2ResearchTree.nodes.forEach(node => {
  createch2NodeOrder.push(String(node.id))
})

function createch2Rank(order, id) {
  var rank = order.indexOf(String(id))
  return rank < 0 ? 1000000 : rank
}

function createch2ReplaceInOrder(list, idGetter, order) {
  var values = []
  for (var index = 0; index < list.size(); index++) values.push(list.get(index))

  values.sort((left, right) => {
    var leftId = String(idGetter(left))
    var rightId = String(idGetter(right))
    var rankDifference = createch2Rank(order, leftId) - createch2Rank(order, rightId)
    return rankDifference !== 0 ? rankDifference : leftId.localeCompare(rightId)
  })

  list.clear()
  values.forEach(value => list.add(value))
}

function createch2OrderResearchScreen(screen) {
  var pagesList = screen.getResearchPagesList()
  var pages = pagesList.getPages()

  createch2ReplaceInOrder(pages, page => page.id(), createch2PageOrder)
  for (var pageIndex = 0; pageIndex < pages.size(); pageIndex++) {
    createch2ReplaceInOrder(
      pages.get(pageIndex).researches(),
      researchKey => researchKey.location(),
      createch2NodeOrder
    )
  }

  console.info(
    '[Createch2 Research] Applied canonical side order to ' +
    pages.size() + ' Research\'d pages; first page is ' + pages.get(0).id()
  )
}

function createch2OrderTechList(techList) {
  if (techList === null) return
  createch2ReplaceInOrder(
    techList.entries(),
    research => research.getResearch().location(),
    createch2NodeOrder
  )
}

function createch2ResetResearchScreenOrder() {
  createch2LastScreen = null
  createch2LastDisplayTechList = null
}

ClientEvents.loggedIn(createch2ResetResearchScreenOrder)
ClientEvents.loggedOut(createch2ResetResearchScreenOrder)

ClientEvents.tick(event => {
  var screen = Createch2Minecraft.getInstance().screen
  if (screen === null || !(screen instanceof Createch2ResearchScreen)) {
    createch2ResetResearchScreenOrder()
    return
  }

  if (screen !== createch2LastScreen) {
    createch2OrderResearchScreen(screen)
    createch2OrderTechList(screen.getTechList())
    console.info(
      '[Createch2 Research] First side-list node is ' +
      screen.getTechList().entries().get(0).getResearch().location()
    )
    createch2LastScreen = screen
    createch2LastDisplayTechList = null
  }

  // Searching replaces the displayed TechList, so order each new result set too.
  var displayTechList = screen.getTechListWidget().getDisplayTechList()
  if (displayTechList !== createch2LastDisplayTechList) {
    createch2OrderTechList(displayTechList)
    createch2LastDisplayTechList = displayTechList
  }
})
})()
