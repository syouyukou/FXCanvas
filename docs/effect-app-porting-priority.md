# Effect.app slug → shader 對照與 FXCanvas 移植優先級

> 53 個 sitemap slug · 80 個解密 shader · FXCanvas `src/lib/effects/`（**28** 個 effect id）

相關：[`effect-app-effects-list.md`](./effect-app-effects-list.md) · [`effect-app-shaders/`](./effect-app-shaders/)

重新產生：`python3 scripts/generate-effect-app-porting-priority.py`

## 優先級定義

| 級別 | 含義 |
|------|------|
| **P0** | Effect.app 高曝光或 shader 極複雜；FXCanvas 無對應或僅簡化版（如 dither-pro） |
| **P1** | 創意差異化或 catalog 補齊；值得新 effect 檔 |
| **P2** | 已有近似實作（含引擎有、面板未開）；應對照 GLSL 升級 |
| **P3** | 無獨立 shader（SEO/preset 名），需 preset 配方 |
| **—** | 已覆蓋，僅需維護 |

## 總覽

- **P0** 4 · **P1** 17 · **P2** 22 · **P3** 5 · **已覆蓋** 5

## 完整對照表

| 優先級 | slug | Effect.app 名稱 | 分類 | shader key(s) | FXCanvas id | 狀態 | 備註 |
|--------|------|-----------------|------|---------------|-------------|------|------|
| P0 | `blob-tracker` | Blob Tracker | Generate | `Generate/blob-tracker-1`<br>`Generate/blob-tracker-2` | `—` | 未實作 | 高曝光 / FXCanvas 缺口 |
| P0 | `layer-mix` | Layer Mix | Custom | `Custom/layer-mix-curve` | `—` | 未實作 | 高曝光 / FXCanvas 缺口 |
| P0 | `motion-trails` | Motion trails | Effects | `Effects/motion-trails-1`<br>`Effects/motion-trails-2` | `—` | 未實作 | 高曝光 / FXCanvas 缺口 |
| P0 | `thermal` | Thermal | Color | `Color/thermal-1`<br>`Color/thermal-2`<br>`Color/thermal-3` | `—` | 未實作 | 高曝光 / FXCanvas 缺口 |
| P1 | `ascii` | ASCII | Effects | `Effects/ascii` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `color-matrix` | Color matrix | Color | `Color/color-matrix` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `cubify` | Cubify | Distort | `Distort/cubify` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `elastic-grid` | Elastic grid | Distort | `Distort/elastic-grid` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `film-vintage` | Vintage Film | Film | `Film/film-vintage` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `led-screen` | LED screen | Effects | `Effects/led-screen` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `paper-scan` | Paper scan | Generate | `Generate/paper-scan` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `perspective` | Perspective | Distort | `Distort/perspective` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `polar-to-rectangular` | Polar to rectangular | Distort | `Distort/polar-to-rectangular` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `radial-blur` | Radial blur | Blur | `Blur/radial-blur` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `rectangular-to-polar` | Rectangular to polar | Distort | `Distort/rectangular-to-polar` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `reeded-glass` | Reeded glass | Distort | `Distort/reeded-glass` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `rgb-shift` | RGB Shift | Effects | `Effects/rgb-shift` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `ripple` | Ripple | Distort | `Distort/ripple` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `stripe` | Stripe | Effects | `Effects/stripe` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `texture-displacement` | Displacement | Custom | `Custom/texture-displacement-1`<br>`Custom/texture-displacement-2`<br>`Custom/texture-displacement-3`<br>`Custom/texture-displacement-4` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P1 | `transform` | Transform | Distort | `Distort/transform` | `—` | 未實作 | 差異化或 catalog 補齊 |
| P2 | `bloom` | Bloom | Effects | `Effects/bloom-1`<br>`Effects/bloom-2`<br>`Effects/bloom-3` | `bloom` | 引擎已有（面板未開） | 三 pass variant；目前未進面板 |
| P2 | `circular-blur` | Circular blur | Blur | `Blur/circular-blur-1`<br>`Blur/circular-blur-2`<br>`Blur/circular-blur-3`<br>`Blur/circular-blur-4` | `gaussian_blur` | 已有（近似） | 升級現有實作品質 |
| P2 | `crt-screen` | CRT screen | Effects | `Effects/crt-screen` | `crt` | 已有（近似） | 升級現有實作品質 |
| P2 | `depth-of-field` | Depth of field | Blur | `Blur/depth-of-field` | `depth_of_field` | 已有（近似） | 升級現有實作品質 |
| P2 | `dither` | Dither | Color | `Color/dither-pro`<br>`Color/dither` | `dither` | 已有（近似） | 已移植 `Color/dither-pro` GLSL（`ditherProShader.ts`） |
| P2 | `emboss` | Emboss | Effects | `Effects/emboss` | `emboss` | 已有（近似） | 升級現有實作品質 |
| P2 | `film-bw` | Black & White | Film | `Film/film-bw` | `monochrome` | 已有（近似） | 升級現有實作品質 |
| P2 | `film-grain` | Film Grain | Film | `Film/film-grain` | `noise` | 已有（近似） | 升級現有實作品質 |
| P2 | `gaussian-blur` | Gaussian blur | Blur | `Blur/gaussian-blur-1`<br>`Blur/gaussian-blur-2`<br>`Blur/gaussian-blur-3` | `gaussian_blur` | 已有（近似） | 升級現有實作品質 |
| P2 | `glitch` | Glitch | Distort | `Distort/glitch` | `glitch_digital` | 已有（近似） | 升級現有實作品質 |
| P2 | `halftone-screen` | Halftone screen | Effects | `Effects/halftone-screen-v2` | `rgb_halftone` | 已有（近似） | 對照 `Effects/halftone-screen-v2` 升級 |
| P2 | `hue-saturation` | Hue/saturation | Color | `Color/hue-saturation` | `hue_saturation` | 已有（近似） | 升級現有實作品質 |
| P2 | `ink-bleed` | Ink bleed | Generate | `Generate/ink-bleed` | `ink_bleed` | 已有（近似） | 升級現有實作品質 |
| P2 | `modulation` | Modulation | Effects | `Effects/modulation-1`<br>`Effects/modulation-2` | `modulation_dither` | 已有（近似） | 升級現有實作品質 |
| P2 | `modulation-dither` | — | — | —（preset 堆疊） | `modulation_dither` | 已有（近似） | 升級現有實作品質 |
| P2 | `ntsc` | NTSC | Effects | `Effects/ntsc-1`<br>`Effects/ntsc-2`<br>`Effects/ntsc-3` | `crt` | 已有（近似） | 升級現有實作品質 |
| P2 | `print-stamp` | — | — | —（preset 堆疊） | `print_stamp` | 引擎已有（面板未開） | effect 已有；SEO 用 preset 堆疊 |
| P2 | `star-glow` | Star glow | Effects | `Effects/star-glow` | `star_glow` | 已有（近似） | 升級現有實作品質 |
| P2 | `texture-blur` | Texture Blur | Custom | `Custom/texture-blur` | `gaussian_blur` | 已有（近似） | 升級現有實作品質 |
| P2 | `threshold` | Threshold | Effects | `Effects/threshold-1`<br>`Effects/threshold-2`<br>`Effects/threshold-3` | `threshold` | 已有（近似） | 升級現有實作品質 |
| P2 | `tv` | — | — | —（preset 堆疊） | `crt` | 已有（近似） | 升級現有實作品質 |
| P2 | `vhs` | VHS | Effects | `Effects/vhs` | `glitch_vhs` | 已有（近似） | 對照 `Effects/vhs` GLSL |
| P3 | `cyanotype` | — | — | —（preset 堆疊） | `—` | Preset/配方 | 無獨立 shader，用 preset 配方 |
| P3 | `grunge` | — | — | —（preset 堆疊） | `—` | Preset/配方 | 無獨立 shader，用 preset 配方 |
| P3 | `vintage-poster` | — | — | —（preset 堆疊） | `—` | Preset/配方 | 無獨立 shader，用 preset 配方 |
| P3 | `xerox` | — | — | —（preset 堆疊） | `—` | Preset/配方 | 無獨立 shader，用 preset 配方 |
| P3 | `y2k-blue` | — | — | —（preset 堆疊） | `—` | Preset/配方 | 無獨立 shader，用 preset 配方 |
| — | `curves` | Curves | Color | `Color/curves` | `curves` | 已覆蓋 | 維護對齊 GLSL |
| — | `duotone` | Duotone | Color | `Color/duotone` | `duotone` | 已覆蓋 | 維護對齊 GLSL |
| — | `gradient-map` | Gradient map | Color | `Color/gradient-map` | `gradient_map` | 已覆蓋 | 維護對齊 GLSL |
| — | `motion-blur` | Motion blur | Blur | `Blur/motion-blur` | `motion_blur` | 已覆蓋 | 維護對齊 GLSL |
| — | `noise` | Noise | Generate | `Generate/noise` | `noise` | 已覆蓋 | 維護對齊 GLSL |

## P0 建議實作順序（精簡）

1. **`blob-tracker`** (Blob Tracker) — `Generate/blob-tracker-1`, `Generate/blob-tracker-2`
2. **`layer-mix`** (Layer Mix) — `Custom/layer-mix-curve`
3. **`motion-trails`** (Motion trails) — `Effects/motion-trails-1`, `Effects/motion-trails-2`
4. **`thermal`** (Thermal) — `Color/thermal-1`, `Color/thermal-2`, `Color/thermal-3`

## 未出現在 sitemap 的 shader（僅 all-shaders.json）

共 **15** 個（多為 variant 或輔助 pass）：

- `Blur/blur-sharpen`
- `Blur/zoom-blur`
- `Color/color-balance`
- `Color/color-temperature`
- `Color/contrast`
- `Color/exposure`
- `Color/levels`
- `Color/monochrome`
- `Color/rgb-gain-gamma`
- `Custom/layer-mix`
- `Distort/pinch`
- `Distort/swirl`
- `Effects/halftone-screen`
- `Effects/vignette`
- `Effects/vignette-v2`

## FXCanvas 已有、Effect.app sitemap 未列

引擎內建但 SEO 無獨立頁（仍值得對照 GLSL）：

- `brightness_contrast` — 面板可見
- `exposure` — 面板可見
- `levels` — 面板可見
- `msx_ascii` — 面板可見
- `paper_grain` — 面板可見
- `pixelate` — 引擎 only
- `sharpen` — 面板可見
- `soft_bleed` — 引擎 only
- `vignette` — 引擎 only
