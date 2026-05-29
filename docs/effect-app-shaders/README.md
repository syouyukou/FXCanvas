# Effect.app 解密 GLSL

本目錄由 `scripts/decrypt-effect-app-shaders.py` 產生，來源為 production 的：

- [`/effects.json`](https://effect.app/effects.json) — 特效目錄
- [`/all-shaders.json`](https://effect.app/all-shaders.json) — 加密 shader 庫

## 解密方式

| 步驟 | 說明 |
|------|------|
| 金鑰 | `SHA-256` 對 **effects.json 原始位元組**（不是 parse 後的 JSON） |
| 演算法 | AES-GCM，IV 12 bytes + tag 16 bytes + ciphertext |
| 編譯後 | 前端會刪除 `fsSource`（僅保留 WebGL program），故必須從此檔還原 |

## 檔名規則

`{Category}__{shader-name}.glsl` 對應 `all-shaders.json` 的 key `{Category}/{shader-name}`。

## 與面板 ID 的關係

面板上的 `filename`（見 [`../effect-app-effects-list.md`](../effect-app-effects-list.md)）不一定等於檔名：

- 多變體：`gaussian-blur` → `gaussian-blur-1/2/3`
- 別名：`dither`（slug）→ `dither-pro`（shader，alias `dither`）
- 多 pass 堆疊：一個「Vintage poster」preset 可能含 10+ 段 shader，不會只有一個 `vintage-poster.glsl`

## 授權提醒

此為研究與對照 FXCanvas 實作之用；GLSL 為 Effect.app 資產，請勿整份複製到商業產品。
