#!/usr/bin/env python3
"""Decrypt Effect.app /all-shaders.json using SHA-256(effects.json) as AES-GCM key."""

from __future__ import annotations

import base64
import hashlib
import json
import urllib.request
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "effect-app-shaders"
EFFECTS_URL = "https://effect.app/effects.json"
SHADERS_URL = "https://effect.app/all-shaders.json"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "fxcanvas-research/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def decrypt_blob(aes: AESGCM, b64: str) -> str:
    raw = base64.b64decode(b64)
    if len(raw) < 28:
        return b64
    iv, tag, ct = raw[:12], raw[12:28], raw[28:]
    return aes.decrypt(iv, ct + tag, None).decode("utf-8")


def main() -> None:
    effects_bytes = fetch(EFFECTS_URL)
    shaders = json.loads(fetch(SHADERS_URL))
    key = hashlib.sha256(effects_bytes).digest()
    aes = AESGCM(key)

    OUT.mkdir(parents=True, exist_ok=True)
    (ROOT / "docs" / "effect-app-effects.json").write_bytes(effects_bytes)

    manifest = []
    for path, enc in sorted(shaders.items()):
        glsl = decrypt_blob(aes, enc)
        safe = path.replace("/", "__") + ".glsl"
        (OUT / safe).write_text(glsl, encoding="utf-8")
        manifest.append({"shader_path": path, "file": safe, "bytes": len(glsl.encode())})

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Decrypted {len(manifest)} shaders → {OUT}")


if __name__ == "__main__":
    main()
