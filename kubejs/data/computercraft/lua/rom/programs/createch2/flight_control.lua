-- Native analog I/O only: physical Aeronautics/Avionics devices own motion.
local headingInput = "left"
local altitudeInput = "right"
local servoOutput = "front"
local disengageInput = "back"
local target = tonumber(({...})[1]) or redstone.getAnalogInput(headingInput)

while not redstone.getInput(disengageInput) do
  local heading = redstone.getAnalogInput(headingInput)
  local altitude = redstone.getAnalogInput(altitudeInput)
  local correction = math.max(0, math.min(15, 8 + target - heading))
  redstone.setAnalogOutput(servoOutput, correction)
  print(("heading=%d altitude=%d servo=%d"):format(heading, altitude, correction))
  sleep(0.25)
end
redstone.setAnalogOutput(servoOutput, 0)
print("Autopilot disengaged to safe-neutral; manual control retained")
