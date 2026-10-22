---
navigation:
  title: Operações da Electro Energetics
  icon: "electroenergetics:converter"
  position: 9
---

# Operações da Electro Energetics

Electro Energetics é a única rede elétrica de Createch. Alternadores convertem a rotação visível de Create; fios, conectores, transformadores, chaves, fusíveis, medidores, motores e catenárias continuam na mesma simulação física.

- **ELE-01:** condutores de cobre, isolamento de borracha, conectores cerâmicos, aterramento, fusíveis e medição.
- **ELE-02:** alternador e motor para conversão nos dois sentidos.
- **ELE-03:** armazenamento, distribuição, medição e tração ferroviária.
- **ELE-04:** alta tensão, transformação, regulação, proteção SF6 e conversor FE.
- **ELE-05:** supercondutores e controle de alto campo sem uma segunda rede.

O `electroenergetics:converter` é a fronteira intencional para consumidores FE. MI, Mekanism, Oritech, AE2 e outros consomem energia depois dela, mas não assumem a autoridade da rede. Queda de tensão, aquecimento, eletrocussão e falhas destrutivas continuam sendo consequências nativas.

Um modem do CC:Tweaked ligado a um voltímetro ou amperímetro usa o periférico nativo `ElectroEnergetics_ElectricGauge` e `getValue()`. O computador supervisiona; a proteção física elimina a falha. O comportamento exige validação no jogo.
