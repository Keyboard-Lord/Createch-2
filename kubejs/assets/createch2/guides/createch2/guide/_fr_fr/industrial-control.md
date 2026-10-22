---
navigation:
  title: Contrôle industriel et SCADA
  icon: "advancedperipherals:energy_detector"
  position: 12
---

# Contrôle industriel et SCADA

CC:Tweaked supervise; il ne remplace pas Réseau électrique, AE2, Créer, ou la sécurité physique. AE2 possède la production et le stockage demandés. Réseau électrique Les ordinateurs recueillent les signaux, les alarmes, les contacteurs de séquence et tiennent un registre de fonctionnement.

Le paqueté `createch2/grid`, `createch2/black_start`et `createch2/plant_watch` Les programmes utilisent uniquement des API périphériques et redstone documentées d'ordinateur. Ils restent utiles même lorsqu'un mod n'expose aucun périphérique informatique direct.

- Mettre Réseau électrique les jauges et les disjoncteurs où un opérateur peut les lire.
- Utilisez un relais ou un contacteur Redstone pour l'isolement à distance, avec une commande locale manuelle.
- Utilisez des détecteurs d'énergie/environnement de pointe uniquement lorsque leurs recettes sont déjà légales.
- Alarme sur le changement et l'état dégradé; ne présumez pas qu'un échantillon prouve une santé installation.
- Gardez démarrage autonome L'automatisation ne doit pas énergiser chaque charge à la fois après une panne.

Réseau électrique 0.5.5.1 ne présente pas de périphérique de tension/courant d'ordinateur vérifié. Les programmes ne l'inventent donc pas. La protection électrique directe reste native et physique.
