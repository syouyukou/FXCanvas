# FXCanvas 產品分區

> 左側面板的三種使用方式，對應不同工作流。

## 分區對照

| 分區 | Tab | 用途 | UI | 典型操作 |
|------|-----|------|-----|----------|
| **微調** | ADJUST | 修正曝光、色調、銳利、局部模糊 | PS 風格小 icon 網格 | 加 1 層 → 精修參數 |
| **效果** | EFFECTS | 風格化、膠片感、故障、發光 | 縮圖卡片 + hover 前後對比 | 堆多層 → 快速出味 |
| **預設** | PRESETS | 策展好的多層 stack | Preset 卡片 | 一鍵載入整組圖層 |
| **動態** | ANIMATED | 靜圖上的時間動畫 | 直式動態卡片 | 加 timeline / 匯出影片 |

## 工作流建議

```
載入圖片
    │
    ├─ 想「修圖」？ ──► ADJUST（Curves / Levels / Exposure…）
    │
    ├─ 想「出風格」？ ──► PRESETS 一鍵 或 EFFECTS 逐層堆
    │                      Dither + Glitch + Grain + Vignette …
    │
    └─ 想「會動」？ ──► ANIMATED + Timeline
```

## 與 Photoshop 習慣

| PS | FXCanvas |
|----|----------|
| 調整圖層（曲線、色階…） | **ADJUST** tab |
| 滤镜库 / 外掛效果 | **EFFECTS** tab |
| Actions / 預設 | **PRESETS** tab |

## 程式對照

```ts
// src/lib/effects/visibleEffects.ts
ADJUST_VISIBLE_EFFECT_IDS    // ADJUST tab
CREATIVE_VISIBLE_EFFECT_IDS  // EFFECTS tab
ANIMATED_VISIBLE_EFFECT_IDS  // ANIMATED tab
```

圖層引擎相同（WebGL ping-pong stack）；差別只在**面板策展**與**預設 randomize 策略**：

- **Adjust**：Shift+Click 恢復預設，適合可預期微調
- **Effects**：Click 隨機參數，適合探索風格
- **Presets**：整包 `layerLabels` 一次載入

## 待擴充（Adjust）

Invert、Posterize、Color Balance、Vibrance、B&W Channel Mixer — 見 product 討論。

## 待擴充（Effects / Presets）

- **Presets（v0.12.0）：** 5 組內建已恢復 — 見 `docs/visible-presets.md`
- 更多策展 preset（Glitch cyber…）、Explore 頁與 dock 對齊 effect.app
- **WIP 效果：** thermal、motion_trails、blob_tracker、layer_mix（Effect.app porting）
