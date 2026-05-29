# Preview shot list

Curated **category heroes** for effect sidebar thumbnails. Three art-directed photos under `static/previews/sources/hero-*.webp` — all effects in a category share the same source for a cohesive dock (Effect.app-style).

## Heroes

| Hero | Categories / overrides | Subject |
|------|------------------------|---------|
| `hero-portrait` | Blur, Color, Film; default Effects | Fashion portrait, neutral background |
| `hero-neon` | Distort; overrides: `crt` | Neon abstract, high contrast edges |
| `hero-night` | Overrides: `star_glow`, `bloom`, `dither` | Sunset / point highlights |

Mapping lives in `src/lib/engine/effectPreviewSources.ts`.

## Workflow

1. Edit `scripts/preview-sources.manifest.json` (`heroes` object — three URLs max).
2. Run `npm run previews:fetch` to download webp (640×480, 4:3 crop).
3. Run `npm run previews:generate` for SVG fallbacks when offline.
4. Reload the app — GPU thumbnails regenerate on start via `initDefaultThumbnails()`.

Fallback order per hero: **webp → jpg/jpeg → png → svg**.

## Thumbnail params

Showcase values (stronger than UI defaults) live in `src/lib/engine/thumbnailParams.ts`. Tune there if an effect still looks too subtle at 256px render size.

## Credits

See `static/previews/CREDITS.md`.
