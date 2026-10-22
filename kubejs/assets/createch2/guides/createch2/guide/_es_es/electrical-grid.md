---
navigation:
  title: Operaciones de Electro Energetics
  icon: "electroenergetics:converter"
  position: 9
---

# Operaciones de Electro Energetics

Electro Energetics es la única red eléctrica de Createch. Los alternadores convierten la rotación visible de Create; cables, conectores, transformadores, interruptores, fusibles, medidores, motores y catenarias pertenecen a una sola simulación física.

- **ELE-01:** conductores de cobre, aislamiento de caucho, conectores cerámicos, tierra, fusibles y medición.
- **ELE-02:** alternador y motor para demostrar la conversión en ambos sentidos.
- **ELE-03:** almacenamiento, distribución, medición y tracción ferroviaria.
- **ELE-04:** alta tensión, transformación, regulación, protección SF6 y el convertidor FE.
- **ELE-05:** superconductores y control de campos altos para cargas extremas sin otra red.

El `electroenergetics:converter` es la frontera intencional para consumidores FE. MI, Mekanism, Oritech, AE2 y otros consumen energía detrás de ella, pero no se convierten en autoridades de red. La caída de tensión, el calentamiento, la electrocución y los fallos destructivos siguen siendo consecuencias nativas.

Un módem de CC:Tweaked conectado a un voltímetro o amperímetro usa el periférico nativo `ElectroEnergetics_ElectricGauge` y `getValue()`. El ordenador supervisa; la protección física despeja el fallo. El comportamiento requiere validación dentro del juego.
