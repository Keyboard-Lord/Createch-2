---
navigation:
  title: Electro Energetics 电网运行
  icon: "electroenergetics:converter"
  position: 9
---

# Electro Energetics 电网运行

Electro Energetics 是 Createch 唯一的电网。发电机把可见的 Create 旋转转化为电力；导线、接头、变压器、开关、保险装置、仪表、电机和接触网都属于同一套物理模拟。

- **ELE-01：**铜导体、橡胶绝缘、陶瓷接头、接地、保险装置与测量。
- **ELE-02：**组装发电机和电机，掌握双向机电转换。
- **ELE-03：**工业储能、配电、计量与铁路电气化。
- **ELE-04：**高压输电、变压、调节、SF6 保护和 FE 转换器。
- **ELE-05：**以超导体和强场控制承担极端负载，不引入第二套电网。

`electroenergetics:converter` 是 FE 用电系统的有意边界。MI、Mekanism、Oritech、AE2 等系统在边界之后用电，但不取得电网权威。压降、导线发热、触电和破坏性故障仍由原生模拟负责。

把 CC:Tweaked 调制解调器接到电压表或电流表，即可使用原生外设 `ElectroEnergetics_ElectricGauge` 与 `getValue()`。计算机负责监控，物理保护负责切除故障。实际行为仍需在游戏运行时验证。
