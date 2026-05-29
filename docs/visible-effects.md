# Visible effects (curated panel)

> **Product zones:** [product-zones.md](./product-zones.md)

## Panel tabs

| Tab | Contents | UI |
|-----|----------|-----|
| **ADJUST** | Fine-tuning tools | PS-style icon grid |
| **EFFECTS** | Stackable creative looks | Thumbnail cards + hover compare |
| **ANIMATED** | Motion on stills | Portrait cards |
| **PRESETS** | Multi-layer curated stacks | Preset cards |

## ADJUST tab (9) — v0.12.0

`curves`, `gradient_map`, `exposure`, `levels`, `brightness_contrast`, `sharpen`, `gaussian_blur`, `motion_blur`, `depth_of_field`

UI：PS 風 icon 網格；Curves 使用 `CurveEditor.svelte`。

## EFFECTS tab (15) — v0.12.0

| Category | Effect IDs |
|----------|------------|
| Color | `hue_saturation`, `duotone`, `monochrome` |
| Film | `noise`, `rgb_halftone`, `ink_bleed`, `paper_grain` |
| Distort | `glitch_digital`, `glitch_vhs` |
| Effects | `crt`, `emboss`, `threshold`, `modulation_dither`, `star_glow`, `dither` |

> **v0.12.0+ WIP（未發版）：** `thermal`, `motion_trails`, `blob_tracker`, `layer_mix` 已加入 `visibleEffects.ts`，待 commit。

## ANIMATED tab (1)

`msx_ascii`

## Source of truth

```ts
// src/lib/effects/visibleEffects.ts
ADJUST_VISIBLE_EFFECT_IDS
CREATIVE_VISIBLE_EFFECT_IDS
ANIMATED_VISIBLE_EFFECT_IDS
```
