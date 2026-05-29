# Visible presets (curated panel)

> **Status:** Five gallery presets (v2 signature tuning) in the **PRESETS** tab (2026-05-30).  
> Signatures: [preset-signatures.md](./preset-signatures.md)

## Shown in panel

| Group | Preset ID | Name | Layers |
|-------|-----------|------|--------|
| OLD PAINTING | `vintage_print` | Vintage print | 6 |
| OLD PAINTING | `cyanotype` | Cyanotype | 6 |
| EDITORIAL | `soft_editorial` | Soft editorial | 5 |
| RETRO | `lofi_vhs` | Lo-fi VHS | 5 |
| FILM | `film_noir` | Film noir | 6 |

Definitions: `src/lib/presets/builtin.ts`  
Visibility: `src/lib/presets/visiblePresets.ts`

## Hidden from panel (for now)

| Group | Preset ID | Name |
|-------|-----------|------|
| DIGITAL | `glitch_cyber` | Glitch cyber |

## Sidebar thumbnails

On app load, `initPresetThumbnails()` GPU-renders each visible preset’s **full layer stack** (same engine as the canvas). Cards show **after** by default; hover for **before/after** (like EFFECTS tab).

Hero sources: `src/lib/engine/presetPreviewSources.ts` → `static/previews/sources/hero-*.webp`.

## Usage

1. **Load an image first**, then open **PRESETS**.
2. Click a card → **replaces** the current stack with that preset group (one clear look).
3. Hover the card thumbnail to compare before/after.
4. **Lo-fi VHS:** set Export / Animation to **5s** to preview tape motion (`animate` on VHS layer).

## Restore / add presets

Add IDs to `VISIBLE_PRESET_IDS` in `src/lib/presets/visiblePresets.ts`.

User-saved presets (header **Presets** menu) are unchanged.
