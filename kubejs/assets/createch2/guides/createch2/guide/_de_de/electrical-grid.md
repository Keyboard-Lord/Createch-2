---
navigation:
  title: Betrieb von Electro Energetics
  icon: "electroenergetics:converter"
  position: 9
---

# Betrieb von Electro Energetics

Electro Energetics ist das einzige Stromnetz von Createch. Generatoren wandeln sichtbare Create-Rotation in Strom um; Leitungen, Anschlüsse, Transformatoren, Schalter, Sicherungen, Messgeräte, Motoren und Oberleitungen bleiben Teil derselben physikalischen Simulation.

- **ELE-01:** Kupferleiter, Gummiisolierung, Keramikanschlüsse, Erdung, Sicherungen und Messung.
- **ELE-02:** Generator und Elektromotor für die Umwandlung in beide Richtungen.
- **ELE-03:** Speicher, Verteilung, Messung und elektrische Bahntraktion.
- **ELE-04:** Hochspannung, Transformatoren, Regelung, SF6-Schutz und der FE-Konverter.
- **ELE-05:** Supraleiter und Hochfeldsteuerung für extreme Lasten ohne zweites Netz.

Der `electroenergetics:converter` ist die absichtliche Grenze für FE-Verbraucher. MI, Mekanism, Oritech, AE2 und andere Systeme verbrauchen dahinter Strom, übernehmen aber nicht die Netzhoheit. Spannungsabfall, Erwärmung, Stromschlag, Sicherungen und zerstörerische Fehler bleiben native Konsequenzen.

Ein CC:Tweaked-Modem an Volt- oder Amperemeter sieht das native Peripheriegerät `ElectroEnergetics_ElectricGauge` mit `getValue()`. Computer überwachen; der physische Schutz schaltet ab. Das Verhalten muss im laufenden Spiel geprüft werden.
