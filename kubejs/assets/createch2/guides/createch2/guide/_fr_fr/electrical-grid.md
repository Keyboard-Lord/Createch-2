---
navigation:
  title: Exploitation d’Electro Energetics
  icon: "electroenergetics:converter"
  position: 9
---

# Exploitation d’Electro Energetics

Electro Energetics est l’unique réseau électrique de Createch. Les alternateurs convertissent la rotation visible de Create ; câbles, connecteurs, transformateurs, interrupteurs, fusibles, compteurs, moteurs et caténaires appartiennent à une seule simulation physique.

- **ELE-01 :** conducteurs en cuivre, isolation en caoutchouc, connecteurs céramiques, mise à la terre, fusibles et mesure.
- **ELE-02 :** alternateur et moteur pour la conversion dans les deux sens.
- **ELE-03 :** stockage, distribution, comptage et traction ferroviaire.
- **ELE-04 :** haute tension, transformation, régulation, protection SF6 et convertisseur FE.
- **ELE-05 :** supraconducteurs et contrôle des champs élevés sans second réseau.

Le `electroenergetics:converter` est la frontière intentionnelle des consommateurs FE. MI, Mekanism, Oritech, AE2 et les autres systèmes consomment derrière cette frontière sans devenir autorités du réseau. Chute de tension, échauffement, électrocution et pannes destructrices restent des conséquences natives.

Un modem CC:Tweaked relié à un voltmètre ou ampèremètre utilise le périphérique natif `ElectroEnergetics_ElectricGauge` et `getValue()`. L’ordinateur supervise ; la protection physique élimine le défaut. Le comportement doit être validé en jeu.
