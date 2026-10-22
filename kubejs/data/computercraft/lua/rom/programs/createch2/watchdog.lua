-- Native redstone watchdog for a real physical workcell.
local inputSide = ({...})[1] or "back"
local stopSide = ({...})[2] or "front"
local alarmSide = ({...})[3] or "top"

print("Createch 2 watchdog armed")
while true do
  local healthy = redstone.getInput(inputSide)
  redstone.setOutput(stopSide, not healthy)
  redstone.setOutput(alarmSide, not healthy)
  if not healthy then print("INTERLOCK: safe stop requested") end
  os.pullEvent("redstone")
end
