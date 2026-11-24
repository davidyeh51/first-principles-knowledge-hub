# 知識庫擴充維護手冊 (Expansion Guide)

本知識庫採用「**數據與視圖分離**」架構。未來團隊新增任何「第一性原理」相關書籍、專題或案例簡報時，**無須修改首頁 `index.html` 與核心 JS 程式碼**，只需依照以下 **3 個步驟**即可完成擴充並自動納入全域搜尋。

---

## 步驟一：建立簡報檔與重繪封面插畫

1. 依循麥肯錫 10 分鐘結構化簡報規格（12–16 頁 16:9 寬螢幕、金字塔行動結論標題、原創 SVG 圖表、三段式講者備忘稿），將新簡報放置於 `decks/` 目錄下：
   - 例如：`decks/fp-li-shanyou.html`
2. 嚴禁直接挪用原書掃描或截圖作為網站主視覺；請重新繪製與知識庫色系一致的無字封面插畫，存於 `assets/images/`：
   - 例如：`assets/images/book-fp-li-shanyou-cover.png`

---

## 步驟二：註冊書目至 `data/library.json`

打開 `data/library.json`，在 `"books"` 陣列中將對應的預留席位（如 `fp-003`）狀態從 `"planned"` 改為 `"ready"`，或新增一筆書籍物件：

```json
{
  "id": "fp-003",
  "slug": "fp-li-shanyou",
  "code": "FP-03",
  "title": "《第一性原理》",
  "subtitle": "從歸納法誤區到演繹法公理化思維的商業破局",
  "author": "李善友（著）",
  "sourceMeta": "混沌大學思維模型講義",
  "category": "business",
  "categoryLabel": "商業破局與演繹法",
  "status": "ready",
  "badge": "經典理論簡報",
  "readingTime": "10 分鐘導讀",
  "slidesCount": 15,
  "svgCount": 14,
  "coverImage": "assets/images/book-fp-li-shanyou-cover.png",
  "deckUrl": "decks/fp-li-shanyou.html",
  "publishedDate": "2026-12-01",
  "coreThesis": "一句話核心主張...",
  "keyPillars": [
    { "label": "支柱一", "desc": "說明..." }
  ],
  "teamActions": [
    {
      "key": "fp03-action-1",
      "title": "團隊可執行行動...",
      "desc": "行動細節...",
      "owner": "個人＆團隊"
    }
  ],
  "modules": [
    { "range": "P01–P02", "name": "封面與架構", "desc": "全書邏輯骨架" }
  ]
}
```

---

## 步驟三：補齊全域搜尋索引 `data/search-index.json`

將新簡報的每一頁投影片（Action Title、摘要、關鍵字與跳轉錨點 `#slide-N`）加入 `data/search-index.json`：

```json
{
  "id": "fp03-s01",
  "bookSlug": "fp-li-shanyou",
  "bookTitle": "《第一性原理》",
  "author": "李善友",
  "slideNo": 1,
  "module": "封面與核心主張",
  "actionTitle": "本頁完整結論句...",
  "summary": "忠於來源的事實、數據與關鍵論證...",
  "keywords": ["第一性原理", "演繹法", "公理", "破界創新"],
  "url": "decks/fp-li-shanyou.html#slide-1"
}
```

完成上述 3 步並 `git push` 至 GitHub 後，首頁統計數據、書庫卡片、`Ctrl + K` 全域搜尋索引與 Supabase 團隊共學下拉選單皆會**自動更新生效**。
