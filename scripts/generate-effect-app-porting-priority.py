#!/usr/bin/env python3
"""Regenerate docs/effect-app-porting-priority.md from effects.json + FXCanvas ids."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EFFECTS_JSON = ROOT / "docs/effect-app-effects.json"
OUT = ROOT / "docs/effect-app-porting-priority.md"
INDEX_TS = ROOT / "src/lib/effects/index.ts"
VISIBLE_TS = ROOT / "src/lib/effects/visibleEffects.ts"

# slug -> FXCanvas effect id (None = preset-only SEO slug)
SLUG_FX: dict[str, str | None] = {
    "gaussian-blur": "gaussian_blur",
    "circular-blur": "gaussian_blur",
    "texture-blur": "gaussian_blur",
    "hue-saturation": "hue_saturation",
    "crt-screen": "crt",
    "tv": "crt",
    "ntsc": "crt",
    "film-bw": "monochrome",
    "film-grain": "noise",
    "star-glow": "star_glow",
    "duotone": "duotone",
    "noise": "noise",
    "curves": "curves",
    "gradient-map": "gradient_map",
    "motion-blur": "motion_blur",
    "emboss": "emboss",
    "threshold": "threshold",
    "modulation-dither": "modulation_dither",
    "modulation": "modulation_dither",
    "dither": "dither",
    "depth-of-field": "depth_of_field",
    "thermal": "thermal",
    "motion-trails": "motion_trails",
    "blob-tracker": "blob_tracker",
    "layer-mix": "layer_mix",
    "ink-bleed": "ink_bleed",
    "halftone-screen": "rgb_halftone",
    "vhs": "glitch_vhs",
    "glitch": "glitch_digital",
    "modulation-dither": "modulation_dither",
    "bloom": "bloom",
    "print-stamp": "print_stamp",
    "cyanotype": None,
    "vintage-poster": None,
    "y2k-blue": None,
    "xerox": None,
    "grunge": None,
}

# slug -> priority override (default computed from fx + shader complexity)
PRIORITY_OVERRIDE: dict[str, str] = {
    "dither": "P2",
    "thermal": "P2",
    "motion-trails": "P2",
    "blob-tracker": "P2",
    "layer-mix": "P2",
    "depth-of-field": "P2",
    "blob-tracker": "P0",
    "depth-of-field": "P2",
    "layer-mix": "P0",
    "motion-trails": "P0",
    "thermal": "P0",
    "bloom": "P2",
    "ink-bleed": "P2",
    "vhs": "P2",
    "halftone-screen": "P2",
    "emboss": "P2",
    "glitch": "P2",
    "curves": "—",
    "gradient-map": "—",
    "motion-blur": "—",
    "threshold": "P2",
    "modulation-dither": "P2",
    "duotone": "—",
    "noise": "—",
    "cyanotype": "P3",
    "vintage-poster": "P3",
    "y2k-blue": "P3",
    "print-stamp": "P2",
    "xerox": "P3",
    "grunge": "P3",
}

P1_SLUGS = {
    "ascii",
    "color-matrix",
    "cubify",
    "elastic-grid",
    "film-vintage",
    "led-screen",
    "paper-scan",
    "perspective",
    "polar-to-rectangular",
    "radial-blur",
    "rectangular-to-polar",
    "reeded-glass",
    "rgb-shift",
    "ripple",
    "stripe",
    "texture-displacement",
    "transform",
}


_PASS_IDS = {"blur_h", "blur_v", "extract", "composite", "main", "unsharp"}


def fx_effect_ids() -> set[str]:
    ids: set[str] = set()
    effects_dir = ROOT / "src/lib/effects"
    for path in effects_dir.glob("*.ts"):
        text = path.read_text()
        for m in re.finditer(
            r"export const \w+_EFFECT[^=]*=\s*\{[^}]*?\bid:\s*'([^']+)'",
            text,
            re.S,
        ):
            ids.add(m.group(1))
        if path.name == "index.ts":
            for m in re.finditer(r"^\s+id: '([^']+)'", text, re.M):
                ids.add(m.group(1))
        if path.name == "msx_ascii.ts":
            m = re.search(r"id: '([^']+)'", text)
            if m:
                ids.add(m.group(1))
    return ids - _PASS_IDS


def visible_ids() -> set[str]:
    text = VISIBLE_TS.read_text()
    return set(re.findall(r"'([a-z][a-z0-9_]*)'", text))


def slug_from_sitemap() -> list[str]:
    # from effect-app-effects-list.md table
    md = (ROOT / "docs/effect-app-effects-list.md").read_text()
    return re.findall(r"\| \d+ \| `([^`]+)` \|", md)


def _filenames(row: dict) -> list[str]:
    fn = row["filename"]
    if isinstance(fn, list):
        return fn
    return [fn]


def _slug_for_row(row: dict) -> str:
    if row.get("alias"):
        return str(row["alias"])
    base = _filenames(row)[0]
    return re.sub(r"-\d+$", "", base)


def load_catalog_by_slug() -> dict[str, dict]:
    data = json.loads(EFFECTS_JSON.read_text())
    by_slug: dict[str, dict] = {}
    for row in data:
        slug = _slug_for_row(row)
        files = _filenames(row)
        keys = [f"{row['category']}/{f}" for f in files]
        entry = {
            "name": row["name"],
            "category": row["category"],
            "shader_keys": keys,
            "archived": row.get("archived", False),
        }
        prev = by_slug.get(slug)
        if prev is None:
            by_slug[slug] = entry
            continue
        # Prefer canonical alias row (e.g. halftone-screen-v2, dither-pro)
        if row.get("alias") == slug and not row.get("archived"):
            by_slug[slug] = entry
        elif prev.get("archived") and not entry.get("archived"):
            by_slug[slug] = entry
        else:
            by_slug[slug]["shader_keys"] = list(
                dict.fromkeys(prev["shader_keys"] + entry["shader_keys"])
            )
    return by_slug


def priority_for(slug: str, fx_id: str | None, in_engine: bool) -> str:
    if slug in PRIORITY_OVERRIDE:
        return PRIORITY_OVERRIDE[slug]
    if fx_id is None and slug in {"cyanotype", "vintage-poster", "y2k-blue", "xerox", "grunge"}:
        return "P3"
    if in_engine and slug not in P1_SLUGS:
        return "P2"
    if slug in P1_SLUGS or not in_engine:
        return "P1"
    return "P2"


def status_for(priority: str, fx_id: str | None, visible: set[str]) -> str:
    if priority == "P3":
        return "Preset/配方"
    if priority == "—":
        return "已覆蓋"
    if not fx_id:
        return "未實作"
    if fx_id not in visible:
        return "引擎已有（面板未開）"
    if priority == "P0":
        return "已有（需對齊 dither-pro 等）"
    if priority == "P2":
        return "已有（近似）"
    return "未實作"


def note_for(slug: str, fx_id: str | None, priority: str) -> str:
    notes: list[str] = []
    if slug == "dither":
        notes.append("已移植 `Color/dither-pro` GLSL（`ditherProShader.ts`）")
    if slug == "halftone-screen" and fx_id == "rgb_halftone":
        notes.append("對照 `Effects/halftone-screen-v2` 升級")
    if slug == "vhs" and fx_id == "glitch_vhs":
        notes.append("對照 `Effects/vhs` GLSL")
    if slug == "bloom" and fx_id == "bloom":
        notes.append("三 pass variant；目前未進面板")
    if slug == "print-stamp" and fx_id == "print_stamp":
        notes.append("effect 已有；SEO 用 preset 堆疊")
    if priority == "P3":
        notes.append("無獨立 shader，用 preset 配方")
    if not notes:
        if priority == "P0":
            notes.append("高曝光 / FXCanvas 缺口")
        elif priority == "P1":
            notes.append("差異化或 catalog 補齊")
        elif priority == "P2":
            notes.append("升級現有實作品質")
        elif priority == "—":
            notes.append("維護對齊 GLSL")
    return "；".join(notes)


def main() -> None:
    fx_ids = fx_effect_ids()
    visible = visible_ids()
    slugs = slug_from_sitemap()
    catalog = load_catalog_by_slug()

    rows: list[dict] = []
    for slug in slugs:
        cat = catalog.get(slug, {})
        if slug in SLUG_FX:
            fx = SLUG_FX[slug]
        else:
            guess = slug.replace("-", "_")
            fx = guess if guess in fx_ids else None
        in_engine = bool(fx and fx in fx_ids)
        if fx and fx not in fx_ids:
            fx = None
            in_engine = False
        pri = priority_for(slug, fx, in_engine)
        if pri == "—" and not in_engine:
            pri = "P1"
        shader_keys = cat.get("shader_keys", ["—"])
        rows.append(
            {
                "priority": pri,
                "slug": slug,
                "name": cat.get("name", "—"),
                "category": cat.get("category", "—"),
                "shaders": shader_keys,
                "fx": fx or "—",
                "status": status_for(pri, fx, visible),
                "note": note_for(slug, fx, pri),
            }
        )

    order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3, "—": 4}
    rows.sort(key=lambda r: (order[r["priority"]], r["slug"]))

    counts: dict[str, int] = {}
    for r in rows:
        counts[r["priority"]] = counts.get(r["priority"], 0) + 1

    lines = [
        "# Effect.app slug → shader 對照與 FXCanvas 移植優先級",
        "",
        "> 53 個 sitemap slug · 80 個解密 shader · FXCanvas `src/lib/effects/`（**28** 個 effect id）",
        "",
        "相關：[`effect-app-effects-list.md`](./effect-app-effects-list.md) · [`effect-app-shaders/`](./effect-app-shaders/)",
        "",
        "重新產生：`python3 scripts/generate-effect-app-porting-priority.py`",
        "",
        "## 優先級定義",
        "",
        "| 級別 | 含義 |",
        "|------|------|",
        "| **P0** | Effect.app 高曝光或 shader 極複雜；FXCanvas 無對應或僅簡化版（如 dither-pro） |",
        "| **P1** | 創意差異化或 catalog 補齊；值得新 effect 檔 |",
        "| **P2** | 已有近似實作（含引擎有、面板未開）；應對照 GLSL 升級 |",
        "| **P3** | 無獨立 shader（SEO/preset 名），需 preset 配方 |",
        "| **—** | 已覆蓋，僅需維護 |",
        "",
        "## 總覽",
        "",
        f"- **P0** {counts.get('P0', 0)} · **P1** {counts.get('P1', 0)} · **P2** {counts.get('P2', 0)} · **P3** {counts.get('P3', 0)} · **已覆蓋** {counts.get('—', 0)}",
        "",
        "## 完整對照表",
        "",
        "| 優先級 | slug | Effect.app 名稱 | 分類 | shader key(s) | FXCanvas id | 狀態 | 備註 |",
        "|--------|------|-----------------|------|---------------|-------------|------|------|",
    ]

    for r in rows:
        shaders = "<br>".join(f"`{k}`" for k in r["shaders"]) if r["shaders"] != ["—"] else "—（preset 堆疊）"
        fx = f"`{r['fx']}`" if r["fx"] != "—" else "`—`"
        lines.append(
            f"| {r['priority']} | `{r['slug']}` | {r['name']} | {r['category']} | {shaders} | {fx} | {r['status']} | {r['note']} |"
        )

    p0 = [r for r in rows if r["priority"] == "P0"]
    lines += [
        "",
        "## P0 建議實作順序（精簡）",
        "",
    ]
    for i, r in enumerate(p0, 1):
        keys = ", ".join(f"`{k}`" for k in r["shaders"][:3])
        if len(r["shaders"]) > 3:
            keys += ", …"
        fx_note = f" · FXCanvas `{r['fx']}`" if r["fx"] != "—" else ""
        lines.append(f"{i}. **`{r['slug']}`** ({r['name']}) — {keys}{fx_note}")

    # shaders not in sitemap
    all_shaders = sorted(
        p.stem.replace("__", "/")
        for p in (ROOT / "docs/effect-app-shaders").glob("*.glsl")
    )
    sitemap_shader_set: set[str] = set()
    for r in rows:
        for k in r["shaders"]:
            if k != "—":
                sitemap_shader_set.add(k)
    extra = [k for k in all_shaders if k not in sitemap_shader_set]

    lines += [
        "",
        "## 未出現在 sitemap 的 shader（僅 all-shaders.json）",
        "",
        f"共 **{len(extra)}** 個（多為 variant 或輔助 pass）：",
        "",
    ]
    for k in extra:
        lines.append(f"- `{k}`")

    lines += [
        "",
        "## FXCanvas 已有、Effect.app sitemap 未列",
        "",
        "引擎內建但 SEO 無獨立頁（仍值得對照 GLSL）：",
        "",
    ]
    mapped_fx = {SLUG_FX.get(s) for s in slugs if SLUG_FX.get(s)}
    for fid in sorted(fx_ids - mapped_fx - {None}):
        vis = "面板可見" if fid in visible else "引擎 only"
        lines.append(f"- `{fid}` — {vis}")

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(rows)} slugs)")


if __name__ == "__main__":
    main()
