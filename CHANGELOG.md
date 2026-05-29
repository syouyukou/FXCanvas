# Changelog

FXCanvas 版本更新紀錄（對應 [GitHub Releases](https://github.com/syouyukou/FXCanvas/releases)）。

## 發版流程

1. 在此檔新增 `## vX.Y.Z — YYYY-MM-DD` 區塊與更新項目
2. 提交並 push 到 `main`
3. 建立並 push tag：`git tag vX.Y.Z && git push origin vX.Y.Z`
4. GitHub Actions 會自動從對應區塊建立 Release

## v0.11.0 — 2026-05-30

- **Explore** 頁（`/explore`）：瀏覽精選效果、搜尋、分類；深連結 `/?effect=` 一鍵開編輯器
- **MSX ASCII** 效果與 **影片** 載入／播放預覽
- **動畫時間軸**：關鍵影格、scrub、`Timeline`、WebM／序列匯出；EffectPanel **ANIMATED** 區
- 匯出流程強化（`exportSession` 暫停預覽 loop、`animationExport` 擴充）
- Smoke test 改對齊精選面板（Star Glow 取代 Bloom）

## v0.10.2 — 2026-05-29

- PRESETS 分頁保留，內建 preset 全部隱藏（重寫中，顯示空狀態）
- 隱藏 FAVORITES 喜好分頁
- 新增 `visiblePresets.ts` 與 `docs/visible-presets.md`

## v0.10.1 — 2026-05-29

- 左側 EFFECTS 面板改為精選 12 個效果（其餘仍可在圖層／Preset 使用）
- 新增 `visibleEffects.ts` 與 `docs/visible-effects.md` 說明取捨
- LayerPanel 移除參數 hint 文案，介面更簡潔

## v0.10.0 — 2026-05-29

- 新增 **Curves**、**Sharpen** 效果
- 工作階段自動儲存（IndexedDB）：重開瀏覽器可還原圖片與圖層堆疊
- 效果縮圖改為分類 hero 圖（portrait / neon / night），支援 WebP 與 `previews:fetch`
- Export 新增 WebP 格式與逐層序列匯出
- 內建 Preset 擴充：Glitch Cyber、Lo-fi VHS、Film Noir 等
- Preset 支援 blend mode；LayerPanel / ExportMenu UI 強化
- 設計 token（`tokens.css`）與 preview 文件、素材 credits

## v0.9.0 — 2026-05-29

- 多語系支援：English、繁體中文、简体中文、日本語
- 新增 LanguageMenu 語言切換，UI 文案全面 i18n 化
- 效果縮圖改為 bundled 靜態 preview 來源，載入更穩定
- 新增 `previews:generate` 腳本產生 preview 素材
- 新增 scenario test（多語系使用流程）與 `npm run test` 整合測試
- Smoke test 固定 English locale，選擇器跨語系穩定

## v0.8.0 — 2026-05-29

- 左側效果面板可拖曳縮放、收合成 icon rail（類 Effect.app）
- 收合模式 hover 顯示效果名稱標籤
- 2 / 3 欄自適應布局，窄拖自動收合
- 新增印刷／底片效果：Paper Grain、Print Stamp、RGB Halftone、Soft Bleed
- PRESETS 分頁：內建一鍵預設組合
- LayerPanel 與效果庫 UI 強化

## v0.7.1 — 2026-05-29

- 修復：雙擊無法重置畫布縮放
- 修復：儲存 Preset 後選單 backdrop 擋住操作
- Dither 預設更名為「高對比黑白」

## v0.7.0 — 2026-05-29

- 新增 Glitch Digital、Glitch VHS 及一鍵預設
- 圖層 Opacity 滑桿與 blend 合成
- GitHub Actions CI（check + smoke test）
- 修復：圖層堆疊變長時刪除錯誤

## v0.6.0 — 2026-05-29

- 畫布滾輪縮放、拖曳平移、雙擊重置
- 新增 Exposure、Levels 等色調效果
- Presets 儲存／載入效果堆疊
- 煙霧測試與 dev server 可靠性改善

## v0.5.0 — 2026-05-29

- Export 多種尺寸（0.5×–4×、1080p、4K）
- 效果縮圖 hover 對比原圖
- 編輯器與 renderer 修正

## v0.4.0 — 2026-05-29

- Vercel 部署設定（adapter-vercel）
- 煙霧測試腳本、Effect.app 對照文件
- Renderer 與 UI 改進

## v0.3.0 — 2026-05-29

- 強化既有效果參數
- Randomize / Reset 按鈕
- 新增 Star Glow 星芒效果

## v0.2.0 — 2026-05-29

- 專案更名 **FXCanvas**
- LayerPanel 重設計
- 效果縮圖預覽

## v0.1.0 — 2026-05-29

- 初始版本：Effect.app 風格 WebGL 影像效果編輯器
- 基礎效果庫與圖層堆疊
