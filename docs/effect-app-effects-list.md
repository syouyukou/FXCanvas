# Effect.app 特效 ID 與 GLSL 索引

> 資料來源：`https://effect.app/effects.json`（61 個面板特效）、`https://effect.app/sitemap.xml`（53 個 SEO slug）、`https://effect.app/all-shaders.json`（80 段加密 GLSL，已解密至 [`effect-app-shaders/`](./effect-app-shaders/)）。

## GLSL 如何取得

1. `GET /effects.json` → 特效目錄（filename / alias / 分類）
2. `GET /all-shaders.json` → Base64 封裝的 **AES-GCM** shader blob
3. 金鑰：`SHA-256( effects.json 原始檔案 bytes )`
4. 解密後寫入 `docs/effect-app-shaders/{Category}__{name}.glsl`

重新解密：`python3 scripts/decrypt-effect-app-shaders.py`

移植優先級（53 slug ↔ 80 shader ↔ FXCanvas）：[`effect-app-porting-priority.md`](./effect-app-porting-priority.md)（`python3 scripts/generate-effect-app-porting-priority.py` 可重產）

## 公開 SEO slug（53）— sitemap

| # | slug | URL |
|---|------|-----|
| 1 | `ascii` | https://effect.app/effects/ascii |
| 2 | `blob-tracker` | https://effect.app/effects/blob-tracker |
| 3 | `bloom` | https://effect.app/effects/bloom |
| 4 | `circular-blur` | https://effect.app/effects/circular-blur |
| 5 | `color-matrix` | https://effect.app/effects/color-matrix |
| 6 | `crt-screen` | https://effect.app/effects/crt-screen |
| 7 | `cubify` | https://effect.app/effects/cubify |
| 8 | `curves` | https://effect.app/effects/curves |
| 9 | `cyanotype` | https://effect.app/effects/cyanotype |
| 10 | `depth-of-field` | https://effect.app/effects/depth-of-field |
| 11 | `dither` | https://effect.app/effects/dither |
| 12 | `duotone` | https://effect.app/effects/duotone |
| 13 | `elastic-grid` | https://effect.app/effects/elastic-grid |
| 14 | `emboss` | https://effect.app/effects/emboss |
| 15 | `film-bw` | https://effect.app/effects/film-bw |
| 16 | `film-grain` | https://effect.app/effects/film-grain |
| 17 | `film-vintage` | https://effect.app/effects/film-vintage |
| 18 | `gaussian-blur` | https://effect.app/effects/gaussian-blur |
| 19 | `glitch` | https://effect.app/effects/glitch |
| 20 | `gradient-map` | https://effect.app/effects/gradient-map |
| 21 | `grunge` | https://effect.app/effects/grunge |
| 22 | `halftone-screen` | https://effect.app/effects/halftone-screen |
| 23 | `hue-saturation` | https://effect.app/effects/hue-saturation |
| 24 | `ink-bleed` | https://effect.app/effects/ink-bleed |
| 25 | `layer-mix` | https://effect.app/effects/layer-mix |
| 26 | `led-screen` | https://effect.app/effects/led-screen |
| 27 | `modulation` | https://effect.app/effects/modulation |
| 28 | `modulation-dither` | https://effect.app/effects/modulation-dither |
| 29 | `motion-blur` | https://effect.app/effects/motion-blur |
| 30 | `motion-trails` | https://effect.app/effects/motion-trails |
| 31 | `noise` | https://effect.app/effects/noise |
| 32 | `ntsc` | https://effect.app/effects/ntsc |
| 33 | `paper-scan` | https://effect.app/effects/paper-scan |
| 34 | `perspective` | https://effect.app/effects/perspective |
| 35 | `polar-to-rectangular` | https://effect.app/effects/polar-to-rectangular |
| 36 | `print-stamp` | https://effect.app/effects/print-stamp |
| 37 | `radial-blur` | https://effect.app/effects/radial-blur |
| 38 | `rectangular-to-polar` | https://effect.app/effects/rectangular-to-polar |
| 39 | `reeded-glass` | https://effect.app/effects/reeded-glass |
| 40 | `rgb-shift` | https://effect.app/effects/rgb-shift |
| 41 | `ripple` | https://effect.app/effects/ripple |
| 42 | `star-glow` | https://effect.app/effects/star-glow |
| 43 | `stripe` | https://effect.app/effects/stripe |
| 44 | `texture-blur` | https://effect.app/effects/texture-blur |
| 45 | `texture-displacement` | https://effect.app/effects/texture-displacement |
| 46 | `thermal` | https://effect.app/effects/thermal |
| 47 | `threshold` | https://effect.app/effects/threshold |
| 48 | `transform` | https://effect.app/effects/transform |
| 49 | `tv` | https://effect.app/effects/tv |
| 50 | `vhs` | https://effect.app/effects/vhs |
| 51 | `vintage-poster` | https://effect.app/effects/vintage-poster |
| 52 | `xerox` | https://effect.app/effects/xerox |
| 53 | `y2k-blue` | https://effect.app/effects/y2k-blue |

## 編輯器內建特效（61）— effects.json

| 分類 | 顯示名稱 | filename | alias | archived |
|------|----------|----------|-------|----------|
| Blur | Depth of field | `depth-of-field` | — |  |
| Blur | Circular blur | `circular-blur-1, circular-blur-2, circular-blur-3, circular-blur-4` | — |  |
| Blur | Gaussian blur | `gaussian-blur-1, gaussian-blur-2, gaussian-blur-3` | — |  |
| Blur | Motion blur | `motion-blur` | — |  |
| Blur | Radial blur | `radial-blur` | — |  |
| Blur | Blur/sharp | `blur-sharpen` | — |  |
| Blur | Zoom blur | `zoom-blur` | — |  |
| Color | Thermal | `thermal-1, thermal-2, thermal-3` | — |  |
| Color | Curves | `curves` | — |  |
| Color | Color balance | `color-balance` | — |  |
| Color | Gradient map | `gradient-map` | — |  |
| Color | Color temperature | `color-temperature` | — |  |
| Color | Dither | `dither-pro` | dither |  |
| Color | Dither (archived) | `dither` | — | ✓ |
| Color | Duotone | `duotone` | — |  |
| Color | Hue/saturation | `hue-saturation` | — |  |
| Color | Levels | `levels` | — |  |
| Color | Exposure | `exposure` | — |  |
| Color | Monochrome | `monochrome` | — |  |
| Color | Color matrix | `color-matrix` | — |  |
| Color | RGB Gain | `rgb-gain-gamma` | — |  |
| Color | Contrast | `contrast` | — |  |
| Distort | Elastic grid | `elastic-grid` | — |  |
| Distort | Reeded glass | `reeded-glass` | — |  |
| Distort | Cubify | `cubify` | — |  |
| Distort | Glitch | `glitch` | — |  |
| Distort | Perspective | `perspective` | — |  |
| Distort | Pinch | `pinch` | — |  |
| Distort | Polar to rectangular | `polar-to-rectangular` | — |  |
| Distort | Rectangular to polar | `rectangular-to-polar` | — |  |
| Distort | Ripple | `ripple` | — |  |
| Distort | Transform | `transform` | — |  |
| Distort | Swirl | `swirl` | — |  |
| Effects | VHS | `vhs` | — |  |
| Effects | ASCII | `ascii` | — |  |
| Effects | Halftone screen (archived) | `halftone-screen` | — | ✓ |
| Effects | Halftone screen | `halftone-screen-v2` | halftone-screen |  |
| Effects | Emboss | `emboss` | — |  |
| Effects | Bloom | `bloom-1, bloom-2, bloom-3` | — |  |
| Effects | Star glow | `star-glow` | — |  |
| Effects | Motion trails | `motion-trails-1, motion-trails-2` | — |  |
| Effects | LED screen | `led-screen` | — |  |
| Effects | NTSC | `ntsc-1, ntsc-2, ntsc-3` | — |  |
| Effects | RGB Shift | `rgb-shift` | — |  |
| Effects | CRT screen | `crt-screen` | — |  |
| Effects | Modulation | `modulation-1, modulation-2` | — |  |
| Effects | Threshold | `threshold-1, threshold-2, threshold-3` | — |  |
| Effects | Vignette (archived) | `vignette` | — | ✓ |
| Effects | Vignette | `vignette-v2` | vignette |  |
| Effects | Stripe | `stripe` | — |  |
| Generate | Noise | `noise` | — |  |
| Generate | Ink bleed | `ink-bleed` | — |  |
| Generate | Paper scan | `paper-scan` | — |  |
| Generate | Blob Tracker | `blob-tracker-1, blob-tracker-2` | — |  |
| Custom | Layer Mix (archived) | `layer-mix` | — | ✓ |
| Custom | Layer Mix | `layer-mix-curve` | layer-mix |  |
| Custom | Texture Blur | `texture-blur` | — |  |
| Custom | Displacement | `texture-displacement-1, texture-displacement-2, texture-displacement-3, texture-displacement-4` | — |  |
| Film | Vintage Film | `film-vintage` | — |  |
| Film | Black & White | `film-bw` | — |  |
| Film | Film Grain | `film-grain` | — |  |

## Shader 檔案（80）— all-shaders.json

| shader key | 本地檔案 |
|------------|----------|
| `Blur/blur-sharpen` | [effect-app-shaders/Blur__blur-sharpen.glsl](./effect-app-shaders/Blur__blur-sharpen.glsl) |
| `Blur/circular-blur-1` | [effect-app-shaders/Blur__circular-blur-1.glsl](./effect-app-shaders/Blur__circular-blur-1.glsl) |
| `Blur/circular-blur-2` | [effect-app-shaders/Blur__circular-blur-2.glsl](./effect-app-shaders/Blur__circular-blur-2.glsl) |
| `Blur/circular-blur-3` | [effect-app-shaders/Blur__circular-blur-3.glsl](./effect-app-shaders/Blur__circular-blur-3.glsl) |
| `Blur/circular-blur-4` | [effect-app-shaders/Blur__circular-blur-4.glsl](./effect-app-shaders/Blur__circular-blur-4.glsl) |
| `Blur/depth-of-field` | [effect-app-shaders/Blur__depth-of-field.glsl](./effect-app-shaders/Blur__depth-of-field.glsl) |
| `Blur/gaussian-blur-1` | [effect-app-shaders/Blur__gaussian-blur-1.glsl](./effect-app-shaders/Blur__gaussian-blur-1.glsl) |
| `Blur/gaussian-blur-2` | [effect-app-shaders/Blur__gaussian-blur-2.glsl](./effect-app-shaders/Blur__gaussian-blur-2.glsl) |
| `Blur/gaussian-blur-3` | [effect-app-shaders/Blur__gaussian-blur-3.glsl](./effect-app-shaders/Blur__gaussian-blur-3.glsl) |
| `Blur/motion-blur` | [effect-app-shaders/Blur__motion-blur.glsl](./effect-app-shaders/Blur__motion-blur.glsl) |
| `Blur/radial-blur` | [effect-app-shaders/Blur__radial-blur.glsl](./effect-app-shaders/Blur__radial-blur.glsl) |
| `Blur/zoom-blur` | [effect-app-shaders/Blur__zoom-blur.glsl](./effect-app-shaders/Blur__zoom-blur.glsl) |
| `Color/color-balance` | [effect-app-shaders/Color__color-balance.glsl](./effect-app-shaders/Color__color-balance.glsl) |
| `Color/color-matrix` | [effect-app-shaders/Color__color-matrix.glsl](./effect-app-shaders/Color__color-matrix.glsl) |
| `Color/color-temperature` | [effect-app-shaders/Color__color-temperature.glsl](./effect-app-shaders/Color__color-temperature.glsl) |
| `Color/contrast` | [effect-app-shaders/Color__contrast.glsl](./effect-app-shaders/Color__contrast.glsl) |
| `Color/curves` | [effect-app-shaders/Color__curves.glsl](./effect-app-shaders/Color__curves.glsl) |
| `Color/dither` | [effect-app-shaders/Color__dither.glsl](./effect-app-shaders/Color__dither.glsl) |
| `Color/dither-pro` | [effect-app-shaders/Color__dither-pro.glsl](./effect-app-shaders/Color__dither-pro.glsl) |
| `Color/duotone` | [effect-app-shaders/Color__duotone.glsl](./effect-app-shaders/Color__duotone.glsl) |
| `Color/exposure` | [effect-app-shaders/Color__exposure.glsl](./effect-app-shaders/Color__exposure.glsl) |
| `Color/gradient-map` | [effect-app-shaders/Color__gradient-map.glsl](./effect-app-shaders/Color__gradient-map.glsl) |
| `Color/hue-saturation` | [effect-app-shaders/Color__hue-saturation.glsl](./effect-app-shaders/Color__hue-saturation.glsl) |
| `Color/levels` | [effect-app-shaders/Color__levels.glsl](./effect-app-shaders/Color__levels.glsl) |
| `Color/monochrome` | [effect-app-shaders/Color__monochrome.glsl](./effect-app-shaders/Color__monochrome.glsl) |
| `Color/rgb-gain-gamma` | [effect-app-shaders/Color__rgb-gain-gamma.glsl](./effect-app-shaders/Color__rgb-gain-gamma.glsl) |
| `Color/thermal-1` | [effect-app-shaders/Color__thermal-1.glsl](./effect-app-shaders/Color__thermal-1.glsl) |
| `Color/thermal-2` | [effect-app-shaders/Color__thermal-2.glsl](./effect-app-shaders/Color__thermal-2.glsl) |
| `Color/thermal-3` | [effect-app-shaders/Color__thermal-3.glsl](./effect-app-shaders/Color__thermal-3.glsl) |
| `Custom/layer-mix` | [effect-app-shaders/Custom__layer-mix.glsl](./effect-app-shaders/Custom__layer-mix.glsl) |
| `Custom/layer-mix-curve` | [effect-app-shaders/Custom__layer-mix-curve.glsl](./effect-app-shaders/Custom__layer-mix-curve.glsl) |
| `Custom/texture-blur` | [effect-app-shaders/Custom__texture-blur.glsl](./effect-app-shaders/Custom__texture-blur.glsl) |
| `Custom/texture-displacement-1` | [effect-app-shaders/Custom__texture-displacement-1.glsl](./effect-app-shaders/Custom__texture-displacement-1.glsl) |
| `Custom/texture-displacement-2` | [effect-app-shaders/Custom__texture-displacement-2.glsl](./effect-app-shaders/Custom__texture-displacement-2.glsl) |
| `Custom/texture-displacement-3` | [effect-app-shaders/Custom__texture-displacement-3.glsl](./effect-app-shaders/Custom__texture-displacement-3.glsl) |
| `Custom/texture-displacement-4` | [effect-app-shaders/Custom__texture-displacement-4.glsl](./effect-app-shaders/Custom__texture-displacement-4.glsl) |
| `Distort/cubify` | [effect-app-shaders/Distort__cubify.glsl](./effect-app-shaders/Distort__cubify.glsl) |
| `Distort/elastic-grid` | [effect-app-shaders/Distort__elastic-grid.glsl](./effect-app-shaders/Distort__elastic-grid.glsl) |
| `Distort/glitch` | [effect-app-shaders/Distort__glitch.glsl](./effect-app-shaders/Distort__glitch.glsl) |
| `Distort/perspective` | [effect-app-shaders/Distort__perspective.glsl](./effect-app-shaders/Distort__perspective.glsl) |
| `Distort/pinch` | [effect-app-shaders/Distort__pinch.glsl](./effect-app-shaders/Distort__pinch.glsl) |
| `Distort/polar-to-rectangular` | [effect-app-shaders/Distort__polar-to-rectangular.glsl](./effect-app-shaders/Distort__polar-to-rectangular.glsl) |
| `Distort/rectangular-to-polar` | [effect-app-shaders/Distort__rectangular-to-polar.glsl](./effect-app-shaders/Distort__rectangular-to-polar.glsl) |
| `Distort/reeded-glass` | [effect-app-shaders/Distort__reeded-glass.glsl](./effect-app-shaders/Distort__reeded-glass.glsl) |
| `Distort/ripple` | [effect-app-shaders/Distort__ripple.glsl](./effect-app-shaders/Distort__ripple.glsl) |
| `Distort/swirl` | [effect-app-shaders/Distort__swirl.glsl](./effect-app-shaders/Distort__swirl.glsl) |
| `Distort/transform` | [effect-app-shaders/Distort__transform.glsl](./effect-app-shaders/Distort__transform.glsl) |
| `Effects/ascii` | [effect-app-shaders/Effects__ascii.glsl](./effect-app-shaders/Effects__ascii.glsl) |
| `Effects/bloom-1` | [effect-app-shaders/Effects__bloom-1.glsl](./effect-app-shaders/Effects__bloom-1.glsl) |
| `Effects/bloom-2` | [effect-app-shaders/Effects__bloom-2.glsl](./effect-app-shaders/Effects__bloom-2.glsl) |
| `Effects/bloom-3` | [effect-app-shaders/Effects__bloom-3.glsl](./effect-app-shaders/Effects__bloom-3.glsl) |
| `Effects/crt-screen` | [effect-app-shaders/Effects__crt-screen.glsl](./effect-app-shaders/Effects__crt-screen.glsl) |
| `Effects/emboss` | [effect-app-shaders/Effects__emboss.glsl](./effect-app-shaders/Effects__emboss.glsl) |
| `Effects/halftone-screen` | [effect-app-shaders/Effects__halftone-screen.glsl](./effect-app-shaders/Effects__halftone-screen.glsl) |
| `Effects/halftone-screen-v2` | [effect-app-shaders/Effects__halftone-screen-v2.glsl](./effect-app-shaders/Effects__halftone-screen-v2.glsl) |
| `Effects/led-screen` | [effect-app-shaders/Effects__led-screen.glsl](./effect-app-shaders/Effects__led-screen.glsl) |
| `Effects/modulation-1` | [effect-app-shaders/Effects__modulation-1.glsl](./effect-app-shaders/Effects__modulation-1.glsl) |
| `Effects/modulation-2` | [effect-app-shaders/Effects__modulation-2.glsl](./effect-app-shaders/Effects__modulation-2.glsl) |
| `Effects/motion-trails-1` | [effect-app-shaders/Effects__motion-trails-1.glsl](./effect-app-shaders/Effects__motion-trails-1.glsl) |
| `Effects/motion-trails-2` | [effect-app-shaders/Effects__motion-trails-2.glsl](./effect-app-shaders/Effects__motion-trails-2.glsl) |
| `Effects/ntsc-1` | [effect-app-shaders/Effects__ntsc-1.glsl](./effect-app-shaders/Effects__ntsc-1.glsl) |
| `Effects/ntsc-2` | [effect-app-shaders/Effects__ntsc-2.glsl](./effect-app-shaders/Effects__ntsc-2.glsl) |
| `Effects/ntsc-3` | [effect-app-shaders/Effects__ntsc-3.glsl](./effect-app-shaders/Effects__ntsc-3.glsl) |
| `Effects/rgb-shift` | [effect-app-shaders/Effects__rgb-shift.glsl](./effect-app-shaders/Effects__rgb-shift.glsl) |
| `Effects/star-glow` | [effect-app-shaders/Effects__star-glow.glsl](./effect-app-shaders/Effects__star-glow.glsl) |
| `Effects/stripe` | [effect-app-shaders/Effects__stripe.glsl](./effect-app-shaders/Effects__stripe.glsl) |
| `Effects/threshold-1` | [effect-app-shaders/Effects__threshold-1.glsl](./effect-app-shaders/Effects__threshold-1.glsl) |
| `Effects/threshold-2` | [effect-app-shaders/Effects__threshold-2.glsl](./effect-app-shaders/Effects__threshold-2.glsl) |
| `Effects/threshold-3` | [effect-app-shaders/Effects__threshold-3.glsl](./effect-app-shaders/Effects__threshold-3.glsl) |
| `Effects/vhs` | [effect-app-shaders/Effects__vhs.glsl](./effect-app-shaders/Effects__vhs.glsl) |
| `Effects/vignette` | [effect-app-shaders/Effects__vignette.glsl](./effect-app-shaders/Effects__vignette.glsl) |
| `Effects/vignette-v2` | [effect-app-shaders/Effects__vignette-v2.glsl](./effect-app-shaders/Effects__vignette-v2.glsl) |
| `Film/film-bw` | [effect-app-shaders/Film__film-bw.glsl](./effect-app-shaders/Film__film-bw.glsl) |
| `Film/film-grain` | [effect-app-shaders/Film__film-grain.glsl](./effect-app-shaders/Film__film-grain.glsl) |
| `Film/film-vintage` | [effect-app-shaders/Film__film-vintage.glsl](./effect-app-shaders/Film__film-vintage.glsl) |
| `Generate/blob-tracker-1` | [effect-app-shaders/Generate__blob-tracker-1.glsl](./effect-app-shaders/Generate__blob-tracker-1.glsl) |
| `Generate/blob-tracker-2` | [effect-app-shaders/Generate__blob-tracker-2.glsl](./effect-app-shaders/Generate__blob-tracker-2.glsl) |
| `Generate/ink-bleed` | [effect-app-shaders/Generate__ink-bleed.glsl](./effect-app-shaders/Generate__ink-bleed.glsl) |
| `Generate/noise` | [effect-app-shaders/Generate__noise.glsl](./effect-app-shaders/Generate__noise.glsl) |
| `Generate/paper-scan` | [effect-app-shaders/Generate__paper-scan.glsl](./effect-app-shaders/Generate__paper-scan.glsl) |
