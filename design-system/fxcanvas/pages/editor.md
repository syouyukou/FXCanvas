# FXCanvas — Editor Page Override

> Overrides `MASTER.md` for the main app shell (`+page.svelte` and panel components).

## Layout

- Three-column main: EffectPanel (resizable) | Canvas | LayerPanel
- Effect panel: min readable width; collapsed rail ~40px; snap behavior preserved
- Canvas: always receives remaining flex space; checkerboard or neutral `#111` surround

## Panel Typography (mono)

| Element | Token | Notes |
|---------|-------|-------|
| Section labels (LAYERS, tabs) | `--text-panel-label` (11px) | Uppercase + letter-spacing |
| Layer names, params, card names | `--text-panel-body` (12px) | Primary reading size |
| Header chrome (logo, buttons) | `--text-base` / `--text-lg` | Sans stack |

No 9px in panels.

## Density (Effect.app-like)

- Layer row: `--panel-row-height` (34px), padding `6px 12px`
- Param list gap: `--panel-gap` (10px), intra-row `--panel-gap-tight` (4px)
- Effect grid gap: 6px; category groups margin-bottom 14px

## States

Every panel section needs: default, hover, active/selected, disabled, empty (no image loaded).

## Do Not

- Add marketing copy or onboarding banners in the editor chrome
- Use bright accent colors for effect thumbnail borders
- Shrink footer below 30px or header below 48px
- Reduce readability to achieve density — shrink padding/gaps instead
