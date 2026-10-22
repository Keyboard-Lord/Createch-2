---
navigation:
  title: Industrial Control and SCADA
  icon: "advancedperipherals:energy_detector"
  position: 12
---

# Industrial Control and SCADA

CC:Tweaked supervises; it does not replace Electro Energetics, AE2, Create, or physical safety. AE2 owns requested production and storage. Electro Energetics owns electrical protection. Computers collect signals, alarm, sequence contactors, and keep an operating record.

The bundled `createch2/grid`, `createch2/black_start`, and `createch2/plant_watch` programs use only documented ComputerCraft peripheral and redstone APIs. They remain useful even when a mod exposes no direct computer peripheral.

- Put Electro Energetics gauges and breakers where an operator can read them.
- Use a redstone relay or contactor for remote isolation, with a manual local override.
- Use Advanced Peripherals energy/environment detectors only where their recipes are already legal.
- Alarm on change and degraded state; do not assume one sample proves a healthy plant.
- Keep black start deliberately staged. Automation must not energize every load at once after an outage.

Electro Energetics 0.5.5.1 does not expose a verified ComputerCraft voltage/current peripheral. The programs therefore do not invent one. Direct electrical protection remains native and physical.
