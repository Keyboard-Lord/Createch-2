-- Generic physical-redstone preflight. No unsupported rocket API is assumed.
local readySides = {"left", "right", "back", "top"}
local ignitionSide = "front"
local abortSide = "bottom"

for _, side in ipairs(readySides) do
  if not redstone.getInput(side) then error("Preflight NOT READY: " .. side) end
end
if redstone.getInput(abortSide) then error("Abort circuit is active") end

for count = 10, 1, -1 do print("T-" .. count); sleep(1) end
if redstone.getInput(abortSide) then error("Abort during countdown") end
redstone.setOutput(ignitionSide, true)
sleep(1)
redstone.setOutput(ignitionSide, false)
print("Ignition pulse authorized; physical vehicle remains in control")
