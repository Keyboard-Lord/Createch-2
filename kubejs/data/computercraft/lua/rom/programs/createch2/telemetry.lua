-- Bounded modem telemetry for factory, vehicle, freight, or mission control.
local modem = peripheral.find("modem")
if not modem then error("Attach a native wired or wireless modem") end
local channel = math.max(1, math.min(65535, tonumber(({...})[1]) or 4242))
modem.open(channel)
print("Telemetry listening on " .. channel)
while true do
  local _, side, received, reply, message, distance = os.pullEvent("modem_message")
  if received == channel then
    print(textutils.serialize({side=side, reply=reply, message=message, distance=distance}))
  end
end
