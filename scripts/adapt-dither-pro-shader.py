#!/usr/bin/env python3
"""Adapt docs/effect-app-shaders/Color__dither-pro.glsl → src/lib/effects/ditherProShader.ts"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/effect-app-shaders/Color__dither-pro.glsl"
OUT = ROOT / "src/lib/effects/ditherProShader.ts"

REPLACEMENTS = [
    ("pattern_type", "u_pattern"),
    ("palette_type", "u_palette"),
    ("color_count", "u_colors"),
    ("distance_mode", "u_distance"),
    ("dither_strength", "u_strength"),
    ("gamma", "u_gamma"),
    ("pixelStep", "u_pixelstep"),
    ("iChannel0", "u_texture"),
    ("iResolution", "u_resolution"),
]

HEADER = """// AUTO-GENERATED from docs/effect-app-shaders/Color__dither-pro.glsl
// Regenerate: python3 scripts/adapt-dither-pro-shader.py

export const DITHER_PRO_BODY = `
"""


def main() -> None:
    raw = SRC.read_text()
    lines = raw.splitlines()
    body_lines: list[str] = []
    skip_until_main_close = False
    for line in lines:
        s = line.strip()
        if s.startswith("uniform float"):
            continue
        if "mainImage" in line:
            body_lines.append("void main() {")
            body_lines.append("  vec2 fragCoord = v_texCoord * u_resolution;")
            skip_until_main_close = False
            continue
        body_lines.append(line)

    body = "\n".join(body_lines)
    for old, new in REPLACEMENTS:
        body = body.replace(old, new)

    body = body.replace(
        "fragColor = vec4(outputColor, texColor.a);",
        "outColor = vec4(outputColor, texColor.a);",
    )

    # getPixelatedUV already uses u_resolution after replace

    escaped = body.replace("\\", "\\\\").replace("`", "\\`")
    out = HEADER + escaped + "\n`;\n"
    OUT.write_text(out, encoding="utf-8")
    print(f"Wrote {OUT} ({len(body)} chars)")


if __name__ == "__main__":
    main()
