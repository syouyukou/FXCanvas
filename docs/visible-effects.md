# Visible effects (curated panel)

> **Product zones:** [product-zones.md](./product-zones.md)

## Panel tabs

| Tab | Contents | UI |
|-----|----------|-----|
| **ADJUST** | Fine-tuning tools | PS-style icon grid |
| **EFFECTS** | Stackable creative looks | Thumbnail cards + hover compare |
| **ANIMATED** | Motion on stills | Portrait cards |
| **PRESETS** | Multi-layer curated stacks | Preset cards |

## ADJUST tab (10) — Unreleased

`curves`, `gradient_map`, `exposure`, `levels`, `brightness_contrast`, `sharpen`, `gaussian_blur`, `motion_blur`, `depth_of_field`, `circular_blur`

UI：PS 風 icon 網格；Curves 使用 `CurveEditor.svelte`。

## EFFECTS tab (22) — Unreleased

| Category | Effect IDs |
|----------|------------|
| Color | `hue_saturation`, `duotone`, `monochrome`, `thermal` |
| Film | `noise`, `rgb_halftone`, `ink_bleed`, `paper_grain` |
| Distort | `glitch_digital`, `glitch_vhs`, `stripe`, `cubify`, `rgb_shift` |
| Effects | `crt`, `emboss`, `threshold`, `modulation_dither`, `star_glow`, `dither`, `motion_trails`, `blob_tracker`, `layer_mix` |

## ANIMATED tab (1)

`msx_ascii`

## Source of truth

```ts
// src/lib/effects/visibleEffects.ts
ADJUST_VISIBLE_EFFECT_IDS
CREATIVE_VISIBLE_EFFECT_IDS
ANIMATED_VISIBLE_EFFECT_IDS
```
