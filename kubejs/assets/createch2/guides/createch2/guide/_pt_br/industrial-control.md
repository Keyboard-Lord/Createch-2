---
navigation:
  title: Controlo industrial e SCADA
  icon: "advancedperipherals:energy_detector"
  position: 12
---

# Controlo industrial e SCADA

CC:Tweaked supervisiona; não substitui Rede elétrica, AE2, Criar, ou segurança física. AE2 O produtor-exportador alegou que a Comissão tinha solicitado a sua produção e armazenagem. Rede elétrica Os computadores recolhem sinais, alarmes, contactores de sequência e mantêm um registo de operações.

O pacote `createch2/grid`, `createch2/black_start`, e `createch2/plant_watch` Os programas usam apenas APIs de computação periférica e redstone documentadas. Eles permanecem úteis mesmo quando um mod não expõe nenhum periférico de computador direto.

- Colocar Rede elétrica medidores e disjuntores onde um operador pode lê-los.
- Use um relé de pedra vermelha ou contator para isolamento remoto, com um controle manual local.
- Use os detectores de energia/ambiente avançados apenas onde suas receitas já são legais.
- Alarme sobre mudança e estado degradado; não assumir que uma amostra prova uma saúde planta.
- Manter partida autônoma A automação não deve energizar todas as cargas de uma vez após uma interrupção.

Rede elétrica 0.5.5.1 não expõe uma tensão/corrente periférica verificada do ComputerCraft. Os programas, portanto, não inventam uma. A proteção elétrica direta permanece nativa e física.
