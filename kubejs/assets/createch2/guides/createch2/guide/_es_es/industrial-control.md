---
navigation:
  title: Control y Control Industrial SCADA
  icon: "advancedperipherals:energy_detector"
  position: 12
---

# Control y Control Industrial SCADA

CC:Tweaked supervisa; no reemplaza Red eléctrica, AE2, Crear, o seguridad física. AE2 posee la producción y almacenamiento solicitados. Red eléctrica Los ordenadores recogen señales, alarma, contactores de secuencia y mantienen un registro operativo.

El paquete `createch2/grid`, `createch2/black_start`, y `createch2/plant_watch` Los programas utilizan sólo APIs de computación documentadas y de piedra roja. Siguen siendo útiles incluso cuando un mod no expone ningún periférico de computadora directa.

- Pongamos Red eléctrica medidores y rotores donde un operador puede leerlos.
- Usar un relé de piedra roja o contactor para aislamiento remoto, con un control local manual.
- Usar detectores de energía/ambiente avanzados periféricos sólo cuando sus recetas ya son legales.
- Alarma sobre cambio y estado degradado; no asuma una muestra prueba un estado saludable planta.
- Mantente quieto. arranque en negro La automatización no debe energizar cada carga inmediatamente después de un desvío.

Red eléctrica 0.5.5.1 no expone un voltaje computarizado verificado/periférico actual. Los programas por lo tanto no inventan uno. La protección eléctrica directa sigue siendo nativa y física.
