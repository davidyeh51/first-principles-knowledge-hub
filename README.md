# 第一性原理知識庫（First Principles Knowledge Hub）

> 對象：自己與團隊成員 ｜ 架構：麥肯錫結構化 10 分鐘簡報 ✕ 原創 SVG 圖解 ✕ 50 生活問題速查矩陣 ✕ 全域關鍵字檢索 ✕ 可擴充多書入口 ✕ Supabase BaaS (RLS) ✕ GitHub Pages

## 核心特色

1. **首頁可擴充書庫架構 (`data/library.json`)**：
   - 首頁直接連結《第一性原理學習法》（北辰）與《用第一性原理讀懂日常：50個生活問題的重新拆解》（品成心理）兩大旗艦簡報。
   - 預留《第一性原理（李善友）》《馬斯克工程與商業實戰》《窮查理寶典 ✕ 多元思維模型》擴充席位；新增書籍僅需 3 步驟（詳見 [`docs/EXPANSION.md`](docs/EXPANSION.md)），無須修改首頁程式碼。
2. **全域關鍵字即時檢索 (`Ctrl + K`)**：
   - 由 `data/search-index.json` 驅動，完整收錄兩本書共 30 頁投影片與 50 個日常問題，輸入任何詞彙（如：艾賓浩斯、間隔效應、三步拆解、反內耗、價值交換、心流、選擇悖論）即可跨書搜尋並精準跳轉至目標簡報頁碼（`#slide-N`）。
3. **麥肯錫 10 分鐘精華簡報 (`decks/*.html`)**：
   - **完全忠於來源**：嚴格依據兩本原著文字內容萃取，零幻覺、零杜撰。
   - **雙旗艦各 15 頁 16:9 投影片**：金字塔行動結論標題（Action Title）、28+ 張原創向量 SVG 圖表、三段式講者備忘稿 (`N`)、10 分鐘演講計時器 (`T`)、縮圖總覽與頁內檢索 (`G`)、列印/PDF 匯出。
   - **重新繪製主題視覺與書籍封面**：專屬訂製無字版首頁主視覺與雙書封面插畫（儲存於 `assets/images/`）。
4. **互動工具：50 生活問題速查矩陣 & 四步第一性原理拆解工作台**：
   - 支援依 7 大人生維度篩選《用第一性原理讀懂日常》全部 50 條對比拆解（「本質是 X，不是 Y」+ 東西方印證 + 最小行動）。
   - 提供互動式「四步拆解診斷器」（拋開慣例 ➔ 連續五問 ➔ 鎖定條件 ➔ 重建解法），並可儲存至 Supabase 或本機。
5. **Supabase 雲端團隊共學 + RLS 行級安全 (`supabase/schema.sql`)**：
   - 前端僅使用公開 `publishable key`（零私鑰外洩風險）。
   - 透過 `fp_team_notes`、`fp_action_checkins`、`fp_deconstructions` 實現團隊共學筆記、拆解實戰庫與行動打卡同步；未登入時自動降級至本機 `localStorage` 暫存。

## 專案結構

```text
first-principles-knowledge-hub/
├── index.html                        # 知識庫門戶首頁（搜尋、雙旗艦書庫、50問速查、四步拆解器、團隊共學）
├── decks/
│   ├── fp-learning-beichen.html      # 《第一性原理學習法》15 頁麥肯錫 10 分鐘簡報
│   └── fp-daily-50-pincheng.html     # 《用第一性原理讀懂日常》15 頁麥肯錫 10 分鐘簡報
├── assets/
│   ├── css/                          # portal.css, deck.css
│   ├── js/                           # portal.js, deck.js, supabase-sync.js
│   └── images/                       # 重新繪製之首頁主視覺與雙書封面插畫
├── data/
│   ├── library.json                  # 書目註冊檔與預留擴充槽位
│   ├── principles-50.json            # 50 個生活問題第一性原理結構化資料庫
│   └── search-index.json             # 跨書跨模組全域關鍵字搜尋索引
├── docs/
│   └── EXPANSION.md                  # 3 步驟擴充維護手冊
└── supabase/
    └── schema.sql                    # PostgreSQL 資料表與 RLS 安全策略
```
