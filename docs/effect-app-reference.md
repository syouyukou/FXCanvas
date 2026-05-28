# Effect.app 參考網站

> 來源：[https://effect.app/](https://effect.app/)  
> 最後整理：2026-05-28

---

## 產品定位

**Effect.app** 是一款在瀏覽器內運行的**即時影像／影片特效編輯器**，主打：

- 本地端處理（不上傳、不儲存媒體檔）
- 即時 WebGL 特效預覽
- 圖片與影片皆可套用效果
- 可儲存自訂 Preset、分享至社群
- 提供 Figma Plugin 與 Chrome Extension 整合

標語：**Online Image & Video Effect Generator – Free**

---

## 技術需求

| 項目 | 說明 |
|------|------|
| 核心技術 | **WebGL 2**（必須） |
| 建議瀏覽器 | Chrome、Safari（最穩定）；Edge、Firefox 可用 |
| 硬體 | 需開啟硬體加速 |
| 行動裝置 | iPad / 手機可用，但重度特效與匯出建議用桌面版 |
| 隱私 | 所有處理在本地瀏覽器完成，NDA 安全 |

---

## 介面結構

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo · Load Media · Feedback · Sign in · Export    │
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│ 左側     │         Canvas / Preview     │   右側 Layers     │
│ Controls │         (媒體預覽)            │   (圖層堆疊)       │
│ / Effects│                              │                   │
│          │                              │                   │
├──────────┴──────────────────────────────┴───────────────────┤
│ Timeline / Animation controls (Animate 方案)                 │
└─────────────────────────────────────────────────────────────┘
```

### 主要 UI 區塊

| 區塊 | 功能 |
|------|------|
| **Load Media** | 上傳圖片或影片 |
| **左側 Controls** | 特效列表、參數調整（可切換 Left 位置） |
| **Canvas** | 即時預覽（Media preview 可開關） |
| **Layers** | 圖層管理、Add、Upload |
| **Export** | 匯出面板（格式、解析度、動畫長度、FPS） |
| **Animation** | 時間軸與 Keyframe 控制（Animate 方案） |

### 設定選項

- **Media preview**：On / Off
- **Controls 位置**：Left

---

## 核心功能

### 1. 即時特效（Realtime Effects）

- 高解析度圖片與影片載入
- 特效堆疊（Layer stack）
- 即時預覽，無需離開瀏覽器
- 持續新增特效與改進

### 2. Preset 系統

- 建立自訂外觀並儲存為 Preset
- 內建策展 Preset 集合（可瀏覽、微調、學習）
- **Publish to Community**：提交至社群（需審核）
- **Public link access**：公開連結分享
- 可更換封面圖（Change cover）

| 方案 | Preset 數量 |
|------|-------------|
| Free | 基本控制 |
| Pro | 最多 10 個自訂 Preset |
| Animate | 無上限 |

### 3. 版本歷史（Version History）

- Free 方案即包含
- 可回溯編輯狀態

### 4. 動畫與 Keyframes（Animate 方案）

- 在時間軸上設定 Keyframe，動畫化特效參數
- 靜態圖片也可套用動態特效並匯出影片
- Keyframe timeline controls
- Reusable animation settings

### 5. 匯出（Export）

#### 靜態圖片

| 格式 | 說明 |
|------|------|
| PNG | 預設靜態匯出 |
| JPEG | 支援 |

#### 影片 / 動畫

| 格式 | 說明 |
|------|------|
| MP4 | Chrome / Safari 支援；Firefox 不支援 |
| WebM | 全瀏覽器 |
| PNG Sequence | 逐幀無損匯出 |
| Frames | 逐幀模式 |

#### 匯出參數

| 參數 | 選項 |
|------|------|
| **Animation 長度** | Off / 5s / 10s（Pro 最長 120s；Animate 最長 5 分鐘） |
| **Frame Rate** | 24 / 30 / 60 FPS |
| **解析度** | Free 最高 1080p；Pro 最高 4K（不超過原檔解析度） |

> **注意**：匯出為即時錄製，實際 FPS 取決於機器效能。若機器只能跑 20 FPS，即使選 60 FPS 匯出結果仍約 20 FPS。

#### 浮水印

- Free：有浮水印
- Pro / Animate：無浮水印

### 6. Dynamic Effects Export（Pro）

- 動態特效匯出（含靜態圖片的動畫 loop，Pro 可匯出 10 秒 loop）

---

## 方案與定價

| 方案 | 月費 | 年費優惠 | 用途 |
|------|------|----------|------|
| **Free** | $0 | — | 非商業用途、試用 |
| **Pro** | $12/月 | 年付省 10% | 商業授權、完整功能 |
| **Animate** | $20/月 | 年付省 10% | Keyframe 動畫、長片匯出 |

### Free 方案

- Version history
- 匯出最高 1080p
- 影片匯出最長 5 秒
- Core effects library
- Basic preset controls
- Figma plugin

### Pro 方案（Free 全部 +）

- 無浮水印
- 商業授權
- Dynamic effects export
- 4K 解析度匯出
- 120 秒影片匯出
- 最多 10 個自訂 Preset

### Animate 方案（Pro 全部 +）

- Keyframe 動畫特效
- 最長 5 分鐘影片匯出
- 無上限自訂 Preset
- Keyframe timeline controls
- Reusable animation settings

### 付款

- 訂閱制（Lemon Squeezy）
- 支援支付寶 / 微信（部分地區）
- 可透過購買確認信或 Pricing 選單管理訂閱

---

## 帳號系統

| 方式 | 說明 |
|------|------|
| Email + 密碼 | 註冊需 email 驗證碼 |
| Google OAuth | Continue with Google |
| 免登入 | Free 方案可不註冊直接使用 |

### 個人資料

- User name、Email 編輯
- Subscription 管理
- 帳號永久刪除（Danger zone）

---

## 外部整合

| 整合 | 連結 |
|------|------|
| **Figma Plugin** | [Figma Community](https://www.figma.com/community/plugin/1504395974062742075/effect-app-real-time-image-video-effects) |
| **Chrome Extension** | [Chrome Web Store](https://chromewebstore.google.com/detail/fkgcdohdgkkcpldoojdljaondijgcaik) |
| **iOS** | Coming soon |
| **Instagram** | [@effect_app](https://www.instagram.com/effect_app) |
| **Support** | [Telegram](https://t.me/effect_app) / support@effect.app |

### Figma Plugin

- 在 Figma 內直接對任意 frame 套用特效
- 無需離開 Figma 編輯圖片

### Chrome Extension

- 將任意圖片傳送至目前 Effect.app session

---

## 社群與內容

- **Community Tab**：使用者分享的 Preset（需審核）
- **Blog**：[`/blog`](https://effect.app/blog)
- **Changelog**：[`/changelog`](https://effect.app/changelog)
- **FAQ**：[`/faq`](https://effect.app/faq)
- **Features**：[`/features`](https://effect.app/features)

---

## 設計理念

| 原則 | 說明 |
|------|------|
| **Private by design** | 本地處理，檔案不離開機器 |
| **Art-directed** | 精簡介面，保留塑造視覺風格的核心控制 |
| **Always improving** | 頻繁更新特效與功能 |
| **Small team** | 獨立小團隊，快速迭代 |

---

## 常見問題摘要

### 效能

- 特效為即時渲染，效能取決於機器與瀏覽器
- 優化建議：降低解析度、簡化特效堆疊、關閉其他分頁、停用隱私/廣告阻擋擴充功能、開啟硬體加速

### 匯出問題

- 匯出卡住：先試短片段、低解析度、關閉最重特效
- 壓縮感過重：改用 PNG Sequence 無損匯出，再用 Premiere / DaVinci / AE 組裝
- Mac QuickTime 無法播放 MP4：改用 VLC 或瀏覽器；或用 HandBrake 轉 MOV

### 動畫

- Free：靜態圖只能匯 PNG；要匯動畫需上傳影片
- Pro：靜態圖也可匯出 10 秒動畫 loop
- Keyframes 僅 Animate 方案

---

## 與本專案（effect-clone）對照

| 功能 | Effect.app | effect-clone（目前） |
|------|------------|----------------------|
| 渲染引擎 | WebGL 2 | WebGL 2 |
| 媒體類型 | 圖片 + 影片 | 圖片 |
| 特效堆疊 | ✅ Layers | ✅ Layers |
| 左側特效面板 | Explore / 分類 / 搜尋 | Explore / Favorites / 分類 / 搜尋 |
| 縮圖預覽 | ✅ | ✅（thumbnail 生成） |
| 匯出 PNG / JPEG | ✅ | ✅ |
| 匯出 MP4 / WebM | ✅ | ❌ |
| 動畫 / Keyframes | ✅（Animate） | ❌ |
| Preset 儲存 | ✅ | ❌ |
| 帳號 / 訂閱 | ✅ | ❌ |
| Figma / Chrome 整合 | ✅ | ❌ |
| 本地端處理 | ✅ | ✅ |

### 本專案已實作特效（參考）

- Blur：Gaussian Blur
- Color：Brightness/Contrast、Hue/Saturation、Duotone、Monochrome
- Film：Noise
- Distort：Glitch
- Effects：CRT、Vignette、Pixelate、Star Glow、Dither

### Star Glow（effect.app 對照）

| 參數 | 說明 | 預設 |
|------|------|------|
| highlight boost | 亮部門檻／抽取強度（愈高愈只留高光） | 0.93 |
| streaks | 星芒射線數（2–8） | 3 |
| sample count | 每條射線取樣步數 | 30 |
| length | 射線長度（像素尺度） | 80 |
| alternate | 奇偶射線長度交替 | 1.00 |
| falloff | 沿射線衰減 | 0.45 |
| angle deg | 整體旋轉（度） | 0 |
| Colorize | 漸層著色混合量 | 1.00 |
| Gradient map | 三階色標（沿射線 t 取樣） | 白→淺藍→深藍 |
| Gradient shift | 漸層相位偏移 | 0.29 |

**技術**：WebGL2 fragment shader；自亮部沿多方向做 line gathering；與 Bloom（柔光暈）不同，屬星芒／十字濾鏡類效果。詳見 [effect.app/effects/star-glow](https://effect.app/effects/star-glow)。

---

## 相關連結

- 官網：[https://effect.app/](https://effect.app/)
- Features：[https://effect.app/features](https://effect.app/features)
- FAQ：[https://effect.app/faq](https://effect.app/faq)
- Changelog：[https://effect.app/changelog](https://effect.app/changelog)
- Privacy：[https://effect.app/privacy](https://effect.app/privacy)
- Terms：[https://effect.app/terms](https://effect.app/terms)
- CDN 範例圖：`https://cdn.effect.app/features/media/`
