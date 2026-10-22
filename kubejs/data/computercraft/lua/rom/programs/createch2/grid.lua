local interval = tonumber(({ ... })[1]) or 2
local sides = redstone.getSides()

local function snapshot()
  local result = { peripherals = {}, redstone = {} }
  for _, name in ipairs(peripheral.getNames()) do
    result.peripherals[name] = table.concat({ peripheral.getType(name) }, ",")
  end
  for _, side in ipairs(sides) do
    result.redstone[side] = {
      digital = redstone.getInput(side),
      analog = redstone.getAnalogInput(side)
    }
  end
  return result
end

local function gaugeValues()
  local result = {}
  for _, name in ipairs(peripheral.getNames()) do
    if peripheral.getType(name) == "ElectroEnergetics_ElectricGauge" then
      local gauge = peripheral.wrap(name)
      result[name] = gauge.getValue()
    end
  end
  return result
end

while true do
  term.clear()
  term.setCursorPos(1, 1)
  print("Createch grid console")
  print("Signals supervise; Electro Energetics protection stays physical.")
  local state = snapshot()
  local gauges = gaugeValues()
  print("\nElectrical gauges:")
  for name, value in pairs(gauges) do print(("  %s: %.3f"):format(name, value)) end
  print("\nPeripherals:")
  for name, kind in pairs(state.peripherals) do print(("  %s: %s"):format(name, kind)) end
  print("\nRedstone inputs:")
  for _, side in ipairs(sides) do
    local value = state.redstone[side]
    print(("  %-6s digital=%-5s analog=%d"):format(side, tostring(value.digital), value.analog))
  end
  sleep(interval)
end
