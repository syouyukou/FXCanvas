# Visible presets (curated panel)

> **Status:** Temporary — all builtin presets hidden from the left **PRESETS** tab while they are rewritten.  
> **Set on:** 2026-05-29

## Shown in panel

_None — `VISIBLE_PRESET_IDS` is empty. The **PRESETS** tab stays visible and shows an empty state._

## Hidden from panel (for now)

| Group | Preset ID | Name |
|-------|-----------|------|
| OLD PAINTING | `vintage_print` | Vintage print |
| DIGITAL | `glitch_cyber` | Glitch cyber |
| RETRO | `lofi_vhs` | Lo-fi VHS |
| FILM | `film_noir` | Film noir |

Definitions remain in `src/lib/presets/builtin.ts`. User-saved presets (header **Presets** menu) are unchanged.

## Restore / add presets

Add IDs to `VISIBLE_PRESET_IDS` in `src/lib/presets/visiblePresets.ts`:

```ts
export const VISIBLE_PRESET_IDS = ['vintage_print', 'glitch_cyber'] as const;
```

When the array is non-empty, matching presets appear inside the **PRESETS** tab.

## Favorites tab

The **FAVORITES** tab is hidden via `SHOW_FAVORITES_TAB = false` in `src/lib/effects/visibleEffects.ts`. Star buttons on effect cards still work in code; set the flag to `true` to restore the tab.
