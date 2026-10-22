-- Recoverable straight tunnel program. It never chunkloads or invents drops.
local distance = math.max(1, tonumber(({...})[1]) or 16)
local minimumFuel = distance * 2 + 8

if turtle.getFuelLevel() ~= "unlimited" and turtle.getFuelLevel() < minimumFuel then
  error("Need at least " .. minimumFuel .. " fuel for outbound and recovery travel")
end

local function inventorySpace()
  for slot = 1, 16 do
    if turtle.getItemCount(slot) == 0 then return true end
  end
  return false
end

local travelled = 0
for step = 1, distance do
  if not inventorySpace() then print("Inventory full; beginning recovery") break end
  while turtle.detect() do
    if not turtle.dig() then print("Protected block; beginning recovery") goto recover end
    sleep(0.2)
  end
  if not turtle.forward() then print("Path blocked; beginning recovery") break end
  travelled = travelled + 1
  turtle.digUp()
  turtle.digDown()
end

::recover::
turtle.turnLeft(); turtle.turnLeft()
for step = 1, travelled do
  if not turtle.forward() then error("Recovery path obstructed at " .. step) end
end
turtle.turnLeft(); turtle.turnLeft()
print("Recovered to origin with " .. travelled .. " blocks surveyed")
