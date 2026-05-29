#!/usr/bin/env python3
"""Adapt docs/effect-app-shaders/Blur__depth-of-field.glsl → src/lib/effects/depthOfFieldShader.ts"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/effect-app-shaders/Blur__depth-of-field.glsl"
OUT = ROOT / "src/lib/effects/depthOfFieldShader.ts"

# effect.app uniform name → FXCanvas u_snake_case (order: longest keys first)
UNIFORM_MAP = [
    ("maskRotation", "u_mask_rotation"),
    ("debugAperture", "u_debug_aperture"),
    ("catadioptric", "u_catadioptric"),
    ("invertMask", "u_invert_mask"),
    ("debugMask", "u_debug_mask"),
    ("maxRadius", "u_max_radius"),
    ("apertureRot", "u_aperture_rot"),
    ("anamorphic", "u_anamorphic"),
    ("roundness", "u_roundness"),
    ("falloff", "u_falloff"),
    ("feather", "u_feather"),
    ("samples", "u_samples"),
    ("blades", "u_blades"),
    ("aspect", "u_aspect"),
    ("radius", "u_radius"),
    ("center", "u_center"),
    ("iChannel0", "u_texture"),
    ("iResolution", "u_resolution"),
]

HEADER = """// AUTO-GENERATED from docs/effect-app-shaders/Blur__depth-of-field.glsl
// Regenerate: python3 scripts/adapt-depth-of-field-shader.py

export const DEPTH_OF_FIELD_BODY = `
"""


def sub_uniform(body: str, old: str, new: str) -> str:
    return re.sub(rf"(?<!u_)(?<!\w){re.escape(old)}(?!\w)", new, body)


def main() -> None:
    raw = SRC.read_text()
    lines = raw.splitlines()
    body_lines: list[str] = []
    in_main = False
    for line in lines:
        s = line.strip()
        if s.startswith("uniform "):
            continue
        if "mainImage" in line:
            in_main = True
            body_lines.append("void main() {")
            body_lines.append("  vec2 uv = v_texCoord;")
            continue
        if in_main:
            if "fragCoord" in line or s == "{":
                continue
            if s == "}" and line.strip() == "}":
                in_main = False
        body_lines.append(line)

    body = "\n".join(body_lines)
    body = re.sub(
        r"outColor = vec4\(srgbColor,\s*1\.0\);",
        "outColor = vec4(srgbColor, texture(u_texture, uv).a);",
        body,
    )
    for old, new in UNIFORM_MAP:
        body = sub_uniform(body, old, new)

    body = body.replace("fragColor", "outColor")
    escaped = body.replace("\\", "\\\\").replace("`", "\\`")
    OUT.write_text(HEADER + escaped + "\n`;\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(body)} chars)")


if __name__ == "__main__":
    main()
