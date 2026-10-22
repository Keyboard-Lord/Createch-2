---
navigation:
  title: Electro Energetics Operations
  icon: "electroenergetics:converter"
  position: 9
---

# Electro Energetics Operations

Electro Energetics is Createch's only electrical grid. Its alternators turn visible Create rotation into electricity; its wires, connectors, transformers, switches, fuses, breakers, meters, motors, and pantographs remain one physical circuit simulation.

The research sequence is deliberate:

- **ELE-01:** prepare copper conductors and rubber insulation; build ceramic connectors, grounding, fuses, switches, and meters.
- **ELE-02:** assemble the alternator and electric motor, proving conversion in both directions.
- **ELE-03:** scale storage, distribution, metering, and electric rail traction.
- **ELE-04:** build high-voltage conductors, transformers, regulation, SF6 protection, and the FE converter.
- **ELE-05:** apply superconductors and high-field control to extreme loads without opening a second grid.

The `electroenergetics:converter` is the intentional boundary for FE consumers. MI, Mekanism, Oritech, AE2, and other FE systems consume power behind it; their internal cables or generators do not replace the taught grid. Size protection from measurements under load. Native voltage drop, wire heating, electrocution, fuse/breaker operation, and destructive faults remain authoritative.

For programmable supervision, attach a CC:Tweaked modem to an Electro Energetics voltmeter or ammeter. The native `ElectroEnergetics_ElectricGauge` peripheral exposes `getValue()`. Computers may observe and coordinate switching, but physical protection must still clear a fault.

Electric trains remain part of the same discipline: catenary, pantographs, contact shoes, feeders, measurement, and protection are infrastructure, not a free locomotive upgrade.

After updating, commission one loaded branch at a time: generate mechanically, meter it, transform to the required service, add correctly sized protection, connect the FE boundary only where needed, then test failure and recovery. Circuit behavior is **RUNTIME-ONLY** until observed in a running world.
