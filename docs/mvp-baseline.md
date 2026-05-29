# FXCanvas 基礎功能清單（必做）

> 對標 [Effect.app](https://effect.app/) 的**編輯器核心**（不含帳號、訂閱、社群、Figma）。  
> 最後更新：2026-05-30  
> 相關：[effect-app-reference.md](./effect-app-reference.md) · [product-zones.md](./product-zones.md)

---

## 原則

1. **本地優先**：媒體與 preset 不離開瀏覽器。  
2. **先能「載入 → 調 → 看 → 存 → 匯出」**，再追特效數量與進階動畫。  
3. 下列 **P0 = 沒做就不算可用的 Effect 類編輯器**；P1 = 對齊官網體驗的缺口；P2+ = 加分，非基礎。

---

## P0 — 一定要做（MVP 門檻）

| # | 功能 | 說明 | FXCanvas 狀態 |
|---|------|------|---------------|
| 1 | **WebGL2 圖層堆疊** | 多層特效、順序、啟用、opacity / blend | ✅ `renderer.ts` |
| 2 | **載入圖片** | 拖曳 / 檔案選擇、預覽 | ✅ |
| 3 | **即時預覽** | 調參數即更新；預覽降採樣、匯出全解析度 | ✅ `PREVIEW_MAX_DIM` |
| 4 | **參數面板** | 每層 slider / enum / gradient / curve | ✅ `EffectPanel` |
| 5 | **圖層管理** | 新增、刪除、排序、顯示/隱藏、複製 | ✅ `LayerPanel` |
| 6 | **Undo / Redo** | 參數與圖層變更可回溯 | ✅ 本機 stack（≤50 步） |
| 7 | **靜態匯出** | PNG / JPEG（+ WebP）；尺寸選項 | ✅ |
| 8 | **產品分區 UI** | ADJUST / EFFECTS / PRESETS 工作流清楚 | ✅ 見 [product-zones.md](./product-zones.md) |
| 9 | **核心特效覆蓋** | 調色 + 風格 + 故障至少各幾個可用 | ⚠️ 有實作；面板策展需維護 |
| 10 | **內建 Preset 可點** | 策展多層 stack 一鍵載入（官網畫廊那類） | ✅ 5 組 — 見 [visible-presets.md](./visible-presets.md) |
| 11 | **Session 恢復** | 重整頁面不丟 stack（圖片） | ✅ IndexedDB |
| 12 | **Canvas 操作** | 縮放、平移、按住對比原圖 | ✅ |

**P0 未完成項（優先補）：**

- [x] 恢復 **PRESETS 面板**：5 個內建（Vintage print、Cyanotype、Soft editorial、Lo-fi VHS、Film noir）。  
- [ ] **文件與 smoke**：新使用者 30 秒內能「載圖 → 點 Preset → 匯出 PNG」。

---

## P1 — 基礎裡的「動態」與「影片」（對齊 Effect 免費～Pro 核心）

| # | 功能 | 說明 | FXCanvas 狀態 |
|---|------|------|---------------|
| 13 | **載入影片** | `HTMLVideoElement` → texture | ✅ |
| 14 | **Animation Off / 5s / 10s** | 靜圖 loop 預覽長度 | ✅ `AnimationMode` |
| 15 | **時間軸 UI** | play / scrub / 顯示時間碼 | ✅ `Timeline` |
| 16 | **程序動畫效果** | `u_time` 驅動（VHS、CRT、ASCII…） | ⚠️ shader 有；**ANIMATED 分頁僅 MSX** — 應策展進 tab |
| 17 | **影片匯出** | WebM / MP4 | ✅ `exportAnimationVideo` |
| 18 | **PNG 序列匯出** | Frames / 後期組片 | ✅ `exportAnimationFrames` |
| 19 | **FPS 24/30/60** | 匯出選項 | ✅ |
| 20 | **Keyframe 基礎** | float/int 參數打點、匯出時插值 | ✅ 引擎 + ◆；⚠️ 拖軌、easing UI 可再加 |
| 21 | **Explore 頁** | 瀏覽效果 / 動態分頁 | ✅ `/explore` |
| 22 | **匯出品質穩定** | 選 30fps 就接近 30fps | ❌ 仍 **MediaRecorder**；目標 **WebCodecs 逐幀** |

**P1 未完成項：**

- [ ] `ANIMATED_VISIBLE_EFFECT_IDS` 加入：`glitch_vhs`、`crt`、`glitch_digital`、`modulation_dither`。  
- [ ] Keyframe：時間軸拖曳 keyframe、preset 正式序列化 `keyframeTracks`。  
- [ ] WebCodecs 匯出路徑（Chrome/Safari），MediaRecorder 作 fallback。

---

## P2 — 基礎完成後再加（非 MVP，但 Effect 有）

| 功能 | 說明 |
|------|------|
| Motion Trails | 跨幀 feedback FBO |
| Film Grain 貼圖庫 | Frame interval |
| NTSC / Blob Tracker 等 | 專用 shader + 資產 |
| 真・Floyd–Steinberg dither | CPU / 多 pass |
| 影片 session 存檔 | 目前 skip |
| Favorites 分頁 | 已暫隱，可後做 |

---

## 刻意不做（非 FXCanvas 基礎）

| 功能 | 原因 |
|------|------|
| 帳號 / OAuth / Email 驗證 | 本地 privacy 定位 |
| 訂閱 / 浮水印 / Lemon Squeezy | 商業模式 |
| Community Preset 審核 | 需後端 |
| 雲端 Version history | 本機 undo 已足夠 MVP |
| Figma Plugin / Chrome Extension | 獨立產品線 |
| Shadertoy 使用者貼 GLSL | 沙箱與 UX 成本高 |

---

## 建議執行順序

```text
1. 填滿 PRESETS 面板（P0 #10）
2. 策展 ANIMATED 分頁（P1 #16）
3. Keyframe UX + preset 存軌道（P1 #20）
4. WebCodecs 匯出（P1 #22）
5. Motion Trails / Grain 等（P2）
```

---

## 驗收一句話

**基礎版完成 = 使用者不用帳號，就能：載入媒體 → 點策展 Preset 或堆效果 → 即時預覽 → Undo → 匯出靜圖或 5～10s 動畫（含至少數個會自己動的效果）。**

---

## 對照 Effect.app 方案（僅理解用）

| Effect 方案 | 我們要對齊的「基礎」部分 |
|-------------|-------------------------|
| Free | P0 + P1 的 5s 影片、1080p、核心特效與 preset 瀏覽 |
| Pro | P1 長片匯出、4K、靜圖動態 loop — **可不綁付費牆** |
| Animate | Keyframe 完整 UX — **引擎已有，UI 屬 P1** |
