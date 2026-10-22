local stages = { ... }
if #stages == 0 then stages = { "back", "left", "right", "top" } end

print("Createch staged black start")
print("Outputs begin isolated. Pass redstone sides as arguments to change the order.")
for _, side in ipairs(stages) do redstone.setOutput(side, false) end

write("Type ARM after generation and protection are ready: ")
if read() ~= "ARM" then error("Black start cancelled", 0) end

for index, side in ipairs(stages) do
  print(("Stage %d/%d: verify %s load, then press Enter."):format(index, #stages, side))
  read()
  redstone.setOutput(side, true)
  sleep(1)
  print(("  %s enabled; input=%s analog=%d"):format(
    side, tostring(redstone.getInput(side)), redstone.getAnalogInput(side)))
end

print("Sequence complete. Prove one normal production batch before restoring unattended demand.")
