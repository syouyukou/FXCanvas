# Preset & effect signatures

> Each look has **one hook** the thumbnail must read in &lt;1s.  
> Preset stacks in `src/lib/presets/builtin.ts` (v2 tuned 2026-05-30).

## Preset 必須「難以手調復現」

Effect.app 的 curated preset 不是「常用特效疊在一起」，而是：

| 原則 | 反例（太易復現） | 正例 |
|------|------------------|------|
| **一個非直覺主鉤** | levels + vignette + duotone | RGB 套色錯位 halftone、邊緣-only motion blur mask |
| **參數在極端區** | strength 0.3、opacity 0.5 | misregister 2.3、threshold 148 + blend_mode overlay |
| **服務層低透明度** | 三層 grain 各 0.8 | paper 0.25 multiply、ink 0.32 multiply |
| **順序不可直覺對調** | blur 在最上 | halftone 在 ink bleed 前、print margin 最後 |
| **依賴多 pass / 專用 shader** | 只用 exposure | `rgb_halftone` + `print_stamp`（FXCanvas 專用） |

對照 Effect.app：`dither-pro` 單層就有 22 種 pattern × 12 palette × gamma（見 [`effect-app-shaders/Color__dither-pro.glsl`](./effect-app-shaders/Color__dither-pro.glsl)）。我們的 preset 若只用通用 `dither` + 預設 palette，用戶 30 秒就能仿出。

**v3 目標：** 每個 preset 至少含 1 個「FXCanvas 專用或極端參數」層，且拿掉單獨 `vignette` 當主識別。

## Presets (panel)

| ID | Hook (one line) | Target look | Do not stack |
|----|-----------------|-------------|--------------|
| `vintage_print` | RGB misregistered halftone + print margin | Risograph on warm paper | Heavy grain-only presets |
| `cyanotype` | Prussian blue silhouette | Sun-print chemistry, no warm paper | Vintage print, VHS |
| `soft_editorial` | Sharp center, soft edges, matte gradient | Magazine portrait | Noir, glitch |
| `lofi_vhs` | Animated tape tracking + warm duotone | 90s camcorder (use 5s anim) | Glitch cyber |
| `film_noir` | S-curve silver + edge grain in shadows | Classic noir contrast | Editorial, cyanotype |

## QA before shipping a preset

1. Thumbnail: name guessable without reading label?  
2. Remove vignette: still recognizable? (hook must survive)  
3. Side-by-side with other four: clearly different?
