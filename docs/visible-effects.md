# Visible effects (curated panel)

> **Status:** Temporary — hide uncurated effects from the left **EFFECTS** tab while keeping full registry in code.  
> **Set on:** 2026-05-29

## Shown in panel (12)

| Category | Effect ID | Name |
|----------|-----------|------|
| Blur | `gaussian_blur` | Gaussian Blur |
| Color | `hue_saturation` | Hue / Saturation |
| Color | `duotone` | Duotone |
| Color | `monochrome` | Monochrome |
| Film | `noise` | Noise |
| Film | `rgb_halftone` | RGB Halftone |
| Film | `paper_grain` | Paper Grain |
| Distort | `glitch_digital` | Glitch Digital |
| Distort | `glitch_vhs` | Glitch VHS |
| Effects | `crt` | CRT Screen |
| Effects | `star_glow` | Star Glow |
| Effects | `dither` | Dither |

## Hidden from panel (for now)

| Category | Effect ID |
|----------|-----------|
| Blur | `sharpen` |
| Color | `exposure`, `curves`, `levels`, `brightness_contrast` |
| Film | `soft_bleed`, `print_stamp` |
| Distort | `pixelate` |
| Effects | `vignette`, `bloom` |

Hidden effects can still appear on **existing layers** and in **presets**; they are only omitted from the add-effects grid and search results in the panel.

## Restore all effects

Edit `VISIBLE_EFFECT_IDS` in `src/lib/effects/visibleEffects.ts`, or replace the filter in `filteredEffects` (`src/lib/stores/editor.ts`) to return all `EFFECTS`.

## Source of truth

```ts
// src/lib/effects/visibleEffects.ts
export const VISIBLE_EFFECT_IDS = [ ... ];
```
