# FXCanvas Design System — Master

> **Logic:** For page-specific rules, check `design-system/fxcanvas/pages/[page].md` first.
> Page rules override this file when they exist.

**Project:** FXCanvas — browser image effect editor (Effect.app-inspired)
**Mood:** Professional creative tool · dark · quiet · precise · fashion-forward restraint
**Reference products:** Effect.app, Linear, Figma panels

---

## Aesthetic Director Principles

1. **Canvas first** — UI chrome stays quiet; the image is the hero.
2. **Density with breath** — panels are information-dense but never cramped; use consistent 4px rhythm.
3. **Typography is hierarchy** — max 4 text sizes in the app shell; no decorative type.
4. **Borders over shadows** — dark UI uses hairline borders and surface steps, not drop shadows.
5. **Motion with purpose** — 150–200ms transitions only; no bounce, no layout-shifting hovers.

---

## Color System

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| App background | `#111111` | `--bg-app` | Root canvas area |
| Surface | `#161616` | `--bg-surface` | Header, footer, panels |
| Surface raised | `#1a1a1a` | `--bg-raised` | Cards, inputs, hover |
| Border subtle | `#2a2a2a` | `--border-subtle` | Panel dividers |
| Border default | `#333333` | `--border-default` | Buttons, inputs |
| Border strong | `#555555` | `--border-strong` | Hover borders |
| Text primary | `#eeeeee` | `--text-primary` | Headings, active labels |
| Text secondary | `#bbbbbb` | `--text-secondary` | Body, buttons |
| Text muted | `#666666` | `--text-muted` | Hints, footer meta |
| Text faint | `#3a3a3a` | `--text-faint` | Disabled tips only |
| Accent | `#888888` | `--accent` | Logo mark, subtle emphasis |

**Rules (Robi / dark-mode):**
- Never use pure `#000` or `#fff`.
- Saturation stays low; accent is neutral grey, not neon green/purple.
- Contrast: secondary text ≥ `#666` on `#111`; primary ≥ `#bbb`.

---

## Typography

**Font stack:** System UI (no webfont load in v1)

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-lg` | 16px | 700 | Logo, major section titles |
| `--text-base` | 13px | 400–500 | Buttons, panel body, menu items |
| `--text-sm` | 12px | 500 | Category labels, compact controls |
| `--text-xs` | 11px | 400 | Footer, metadata, badges |
| `--text-2xs` | 10px | 400 | Zoom badge, numeric-only micro labels |

**Numeric data:** always `font-variant-numeric: tabular-nums`.

### Mono panels (Effect + Layer)

Font: `var(--font-mono)` — SF Mono / Fira Code stack.

| Token | Size | Usage |
|-------|------|-------|
| `--text-panel-label` | 11px | Uppercase section labels, tabs, hints, preset pills |
| `--text-panel-body` | 12px | Layer names, param names/values, effect card names, search |

**Density tokens:**

| Token | Value | Usage |
|-------|-------|-------|
| `--panel-padding-x` | 12px | Horizontal panel inset |
| `--panel-padding-y` | 8px | Vertical section padding |
| `--panel-row-height` | 34px | Layer list row min-height |
| `--panel-gap` | 10px | Between param groups |
| `--panel-gap-tight` | 4px | Within param row (label → slider) |

**Forbidden in panels:** 8px, 9px. Tighten via spacing tokens, not smaller type.

---

## Spacing (4px base)

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |

**Layout constants:**
- Header height: `48px`
- Footer height: `30px`
- Header/footer horizontal padding: `16px`
- Panel internal padding: `8px–12px` (mono panels); header/footer `16px`
- Icon–label gap: `6px–8px`

---

## Iconography

- SVG only, **14×14** in header/actions, **12×12** in compact panels
- `stroke="currentColor"` `stroke-width="2"` `fill="none"`
- No emoji as UI icons (replace `◈` logo mark with SVG over time)

---

## Components

### Icon button (`.btn-icon`)
- 32×32, border `1px solid var(--border-default)`, radius `6px`
- Hover: `--bg-raised` + `--border-strong`, text `--text-primary`
- Disabled: opacity `0.35`, no pointer

### Ghost button (`.btn-ghost`)
- Padding `6px 12px`, `--text-base`, gap `6px`
- Same border/hover pattern as icon button

### Panel resize handle
- 6px hit area, 2px visual indicator, no layout shift on hover

### Badges (footer)
- `--text-xs`, uppercase optional, border `1px solid var(--border-default)`

---

## App Shell Structure

```
┌─────────────────────────────────────────────┐
│ Header 48px — logo | history | actions      │
├──────────┬──────────────────────┬───────────┤
│ Effect   │ Canvas (flex 1)      │ Layer     │
│ Panel    │                      │ Panel     │
├──────────┴──────────────────────┴───────────┤
│ Footer 30px — metadata | tip                │
└─────────────────────────────────────────────┘
```

Do not add nav clutter. Primary actions stay in header right cluster.

---

## Anti-Patterns (Do NOT)

- Purple/cyan gradients, glassmorphism, neon accents
- `transition: all` — specify properties explicitly
- Hover `transform: scale()` on layout-critical elements
- Mixed icon sizes or stroke weights
- Shadows in dark mode (use borders)
- More than 4 distinct font sizes in one panel
- Generic AI landing-page patterns (hero, bento grids) — this is a tool, not marketing

---

## Pre-Delivery Checklist

- [ ] All sizes use design tokens (no new magic px for type/spacing)
- [ ] Clickable elements have `cursor: pointer` + visible `:focus-visible`
- [ ] Transitions 150–200ms on color/border/opacity only
- [ ] Icons consistent 14×14 or 12×12
- [ ] `prefers-reduced-motion` respected
- [ ] No horizontal scroll; panels collapse gracefully
- [ ] Run `npx ui-craft-detect ./src` — zero critical findings before ship

---

## Skill Stack (for AI agents)

When reviewing or building UI, consult in order:

1. `design-system/fxcanvas/MASTER.md` (this file)
2. `ui-craft-minimal` — Linear/Notion restraint (CRAFT=8, DENSITY=2)
3. `ui-design-brain` — component-level patterns
4. `ui-ux-pro-max` — searchable palette/UX database (`--stack svelte`)
5. `robi-design-best-practice` — dark mode color/spacing discipline
