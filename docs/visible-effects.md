# Visible effects (curated panel)

> **Product zones:** [product-zones.md](./product-zones.md)

## Panel tabs

| Tab | Contents | UI |
|-----|----------|-----|
| **ADJUST** | Fine-tuning tools | PS-style icon grid |
| **EFFECTS** | Stackable creative looks | Thumbnail cards + hover compare |
| **ANIMATED** | Motion on stills | Portrait cards |
| **PRESETS** | Multi-layer curated stacks | Preset cards |

## ADJUST tab (8)

`curves`, `gradient_map`, `exposure`, `levels`, `brightness_contrast`, `sharpen`, `gaussian_blur`, `motion_blur`

## EFFECTS tab (15)

| Category | Effect IDs |
|----------|------------|
| Color | `hue_saturation`, `duotone`, `monochrome` |
| Film | `noise`, `rgb_halftone`, `ink_bleed`, `paper_grain` |
| Distort | `glitch_digital`, `glitch_vhs` |
| Effects | `crt`, `emboss`, `threshold`, `modulation_dither`, `star_glow`, `dither` |

## Source of truth

```ts
// src/lib/effects/visibleEffects.ts
ADJUST_VISIBLE_EFFECT_IDS
CREATIVE_VISIBLE_EFFECT_IDS
ANIMATED_VISIBLE_EFFECT_IDS
```
