local interval = tonumber(({ ... })[1]) or 1
local previous = {}

local function current()
  local state = {}
  for _, side in ipairs(redstone.getSides()) do
    state["redstone:" .. side] = tostring(redstone.getInput(side)) .. "/" .. redstone.getAnalogInput(side)
  end
  for _, name in ipairs(peripheral.getNames()) do
    state["peripheral:" .. name] = table.concat({ peripheral.getType(name) }, ",")
  end
  return state
end

print("Createch plant watch: reporting signal and peripheral changes")
while true do
  local nextState = current()
  for key, value in pairs(nextState) do
    if previous[key] ~= value then
      print(("[%s] %s -> %s"):format(os.date("%T"), key, value))
    end
  end
  for key in pairs(previous) do
    if nextState[key] == nil then print(("[%s] %s -> missing"):format(os.date("%T"), key)) end
  end
  previous = nextState
  sleep(interval)
end
