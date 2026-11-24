/**
 * 第一性原理知識庫 — 首頁互動引擎
 * 功能：載入 library.json / search-index.json / principles-50.json
 *       全域即時搜尋 (Ctrl+K 跨書＋50問)、書庫分類篩選、50生活問題矩陣、
 *       四步拆解工作台、團隊共學筆記與行動打卡（Supabase / localStorage 雙軌）
 */

(function () {
  let libraryData = null;
  let searchIndex = [];
  let principles50 = [];
  let activeCategory = 'all';
  let activeDim = 'all';

  const PRESETS = {
    spacex: {
      topic: '為什麼近地軌道運載火箭發射要上千萬美元 ($18,500/kg)？',
      surface: '類比思維：認為航太本來就是這麼貴，不斷向供應商議價或在舊設計微調',
      whys: '1.為何貴？→ 火箭一次性拋棄\n2.為何零件貴？→ 沒上過天不許用＋4–5層外包層層加價\n3.為何沒人改？→ 政府成本加成合同，做得越貴賺越多',
      bedrock: '鋁/鈦/銅/碳纖維原料僅佔火箭售價約 2%，物理上能重複使用',
      cond: '自製核心零件砍掉外包加價，並回收佔整枚約 3/4 價格的一級火箭',
      rebuilt: '研發可垂直回收復用的獵鷹 9 號／重型獵鷹，單位成本降至 $1,400/kg (-92%)'
    },
    meeting: {
      topic: '為什麼團隊每週開很多會議，專案推進還是感覺很慢？',
      surface: '慣例做法：遇到卡關就再加開一次對齊會議、要求全員抄送郵件匯報進度',
      whys: '1.為何開會多仍慢？→ 會議都在複述經過而非作決定\n2.為何沒做決定？→ 會議前沒寫清「本次要決策的唯一目的」與外部交付物\n3.為何沒交付？→ 把「忙碌過程」當成了「產出價值」',
      bedrock: '職場價值是外部交付成果，不是內部同步時長（#20 職場＝價值；#16 決策＝目的）',
      cond: '會前必先定義單一決策目的與會後誰交付何物，並分清各自課題邊界（#39）',
      rebuilt: '本週起所有會議無「唯一目的＋待拍板選項」不開；會後只留一句可複用規則（#17）'
    },
    study: {
      topic: '為什麼每天花 4 小時看網課、抄筆記、刷題，換卷子還是不會？',
      surface: '搬運工模式：開倍速聽課、螢光筆劃滿課本、工整抄寫標準答案到錯題本',
      whys: '1.為何不會？→ 把「聽懂的流暢感」當成真懂\n2.為何記不住？→ 只有被動編碼，缺乏間隔與主動提取\n3.為何換題就倒？→ 只記數字血肉，未抽離公式骨架',
      bedrock: '大腦是意義與提取驅動器；記憶＝提取×間隔，能力＝應用×反思',
      cond: '學完必須合書提取、24 小時內完成最小應用，並針對錯題改條件重做',
      rebuilt: '今晚寫下明日 3 項定量任務＋製作 3 張正反提取卡＋錯題原卷畫圈隔天塗黑'
    }
  };

  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightText(text, terms) {
    let safe = escapeHtml(text);
    terms.forEach(term => {
      if (!term) return;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      safe = safe.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
    });
    return safe;
  }

  async function loadAllData() {
    try {
      const [libRes, idxRes, p50Res] = await Promise.all([
        fetch('data/library.json'),
        fetch('data/search-index.json'),
        fetch('data/principles-50.json')
      ]);
      libraryData = await libRes.json();
      searchIndex = await idxRes.json();
      principles50 = await p50Res.json();
      renderPortal();
    } catch (err) {
      console.error('載入知識庫資料失敗：', err);
      const wrap = $('featured-wrap');
      if (wrap) {
        wrap.innerHTML = `<div class="notice-box">無法載入資料檔（請透過 GitHub Pages 或本機 HTTP 伺服器預覽，勿直接雙擊 file:// 開啟）。</div>`;
      }
    }
  }

  function renderPortal() {
    if (!libraryData) return;

    const hotTags = $('hot-tags');
    if (hotTags) {
      hotTags.innerHTML =
        `<span class="hot-label">熱門檢索：</span>` +
        libraryData.hotKeywords
          .map(kw => `<button type="button" class="hot-chip" data-kw="${escapeHtml(kw)}">${escapeHtml(kw)}</button>`)
          .join('');
    }

    const catTabs = $('category-tabs');
    if (catTabs) {
      catTabs.innerHTML = libraryData.categories
        .map(cat => {
          const count = cat.id === 'all'
            ? libraryData.books.length
            : libraryData.books.filter(b => b.category === cat.id).length;
          return `<button type="button" class="cat-tab ${cat.id === activeCategory ? 'active' : ''}" data-cat="${escapeHtml(cat.id)}">${escapeHtml(cat.name)} (${count})</button>`;
        })
        .join('');
    }

    const readyBooks = libraryData.books.filter(b => b.status === 'ready');
    const totalSlides = readyBooks.reduce((s, b) => s + (b.slidesCount || 0), 0);
    const totalSvgs = readyBooks.reduce((s, b) => s + (b.svgCount || 0), 0);
    if ($('stat-books')) $('stat-books').innerHTML = `${readyBooks.length}<em>/ ${libraryData.books.length} 席位</em>`;
    if ($('stat-slides')) $('stat-slides').innerHTML = `${totalSlides}<em>頁</em>`;
    if ($('stat-svgs')) $('stat-svgs').innerHTML = `${totalSvgs}<em>張</em>`;
    if ($('stat-keywords')) $('stat-keywords').innerHTML = `${searchIndex.length + principles50.length}<em>條索引</em>`;

    renderBooks();
    renderPrinciples50();
    renderActions();
  }

  function renderBooks() {
    if (!libraryData) return;
    const filtered = activeCategory === 'all'
      ? libraryData.books
      : libraryData.books.filter(b => b.category === activeCategory);

    const readyList = filtered.filter(b => b.status === 'ready');
    const plannedList = filtered.filter(b => b.status !== 'ready');

    const featuredWrap = $('featured-wrap');
    if (featuredWrap) {
      featuredWrap.innerHTML = readyList.map(book => `
        <article class="featured-book" id="book-${escapeHtml(book.slug)}">
          <a href="${escapeHtml(book.deckUrl)}" class="book-cover-frame" aria-label="開啟 ${escapeHtml(book.title)} 10 分鐘簡報">
            <img src="${escapeHtml(book.coverImage)}" alt="${escapeHtml(book.title)} 重新繪製封面" class="book-cover-art">
            <div class="book-cover-scrim"></div>
            <div class="book-cover-top">
              <span class="book-cover-code">${escapeHtml(book.code)} · McKINSEY BRIEF</span>
              <h3 class="book-cover-title">${escapeHtml(book.title.replace(/[《》]/g, ''))}</h3>
              <p class="book-cover-sub">${escapeHtml(book.subtitle)}</p>
            </div>
            <div class="book-cover-bottom">
              <span>${escapeHtml(book.author.split('（')[0])}</span>
              <span>${book.slidesCount}P · 10 MIN</span>
            </div>
          </a>

          <div>
            <div class="book-meta-row">
              <span class="pill pill-navy">${escapeHtml(book.badge)}</span>
              <span class="pill pill-gold">${escapeHtml(book.readingTime)} · ${book.slidesCount} 頁</span>
              <span class="pill pill-slate">${escapeHtml(book.categoryLabel)}</span>
              <span class="pill pill-slate">${book.svgCount}+ 原創 SVG 圖解</span>
            </div>

            <h3 class="book-headline">${escapeHtml(book.title)}：${escapeHtml(book.subtitle)}</h3>
            <p class="book-author">作者：${escapeHtml(book.author)} ｜ 來源：${escapeHtml(book.sourceMeta)}</p>
            <div class="book-thesis">${escapeHtml(book.coreThesis)}</div>

            <div class="pillars-grid">
              ${book.keyPillars.map(p => `
                <div class="pillar-mini">
                  <strong>${escapeHtml(p.label)}</strong>
                  <span>${escapeHtml(p.desc)}</span>
                </div>
              `).join('')}
            </div>

            <div class="modules-strip">
              ${book.modules.map(m => `
                <div class="mod-chip">
                  <strong>${escapeHtml(m.range)} · ${escapeHtml(m.name)}</strong>
                  <span>${escapeHtml(m.desc)}</span>
                </div>
              `).join('')}
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
              <a href="${escapeHtml(book.deckUrl)}" class="btn-gold">開啟 10 分鐘完整簡報 (${book.slidesCount} 頁) →</a>
              <a href="${escapeHtml(book.deckUrl)}#slide-2" class="btn-cyan" style="color:var(--navy-900);border-color:var(--slate-300);background:var(--slate-100);">直達全書骨架圖</a>
              <a href="${escapeHtml(book.deckUrl)}#slide-15" class="btn-cyan" style="color:var(--navy-900);border-color:var(--slate-300);background:var(--slate-100);">附錄總表</a>
            </div>
          </div>
        </article>
      `).join('');
    }

    const plannedWrap = $('planned-wrap');
    if (plannedWrap) {
      plannedWrap.innerHTML = plannedList.map(book => `
        <article class="planned-card">
          <div>
            <div class="book-meta-row">
              <span class="pill pill-slate">${escapeHtml(book.code)}</span>
              <span class="pill pill-gold">${escapeHtml(book.badge)}</span>
            </div>
            <h4>${escapeHtml(book.title)}</h4>
            <p>${escapeHtml(book.coreThesis)}</p>
          </div>
          <div class="planned-foot">
            <span>${escapeHtml(book.categoryLabel)}</span>
            <span>${escapeHtml(book.readingTime)}</span>
          </div>
        </article>
      `).join('');
    }
  }

  function renderPrinciples50() {
    const grid = $('p50-grid');
    if (!grid) return;
    const kw = ($('p50-filter')?.value || '').trim().toLowerCase();

    const items = principles50.filter(item => {
      if (activeDim !== 'all' && item.dimKey !== activeDim) return false;
      if (!kw) return true;
      const blob = `${item.no} ${item.dim} ${item.topic} ${item.is} ${item.not} ${item.insight} ${item.action}`.toLowerCase();
      return blob.includes(kw);
    });

    if (items.length === 0) {
      grid.innerHTML = `<div class="notice-box" style="grid-column:1/-1;">找不到符合「${escapeHtml(kw)}」的日常原理條目。</div>`;
      return;
    }

    grid.innerHTML = items.map(p => `
      <article class="p50-card">
        <div class="p50-top">
          <span>#${String(p.no).padStart(2, '0')} · ${escapeHtml(p.dim)}</span>
          <span>Slide P${String(p.slideNo).padStart(2, '0')}</span>
        </div>
        <div class="p50-title">
          ${escapeHtml(p.topic)}是${escapeHtml(p.is)}
          <span class="not">，不是${escapeHtml(p.not)}</span>
        </div>
        <div class="p50-insight">${escapeHtml(p.insight)}</div>
        <div class="p50-action"><strong>最小行動：</strong>${escapeHtml(p.action)}</div>
        <a class="p50-link" href="decks/fp-daily-50-pincheng.html#slide-${p.slideNo}">前往簡報第 ${p.slideNo} 頁詳解 →</a>
      </article>
    `).join('');
  }

  function runGlobalSearch(rawQuery) {
    const query = rawQuery.trim();
    const clearBtn = $('search-clear-btn');
    const resultsBox = $('search-results');
    const countText = $('search-count-text');
    const resultsGrid = $('results-grid');

    if (clearBtn) clearBtn.classList.toggle('visible', query.length > 0);
    if (!query) {
      resultsBox?.classList.remove('active');
      return;
    }

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    const slideHits = searchIndex
      .map(item => {
        const hay = [item.bookTitle, item.module, item.actionTitle, item.summary, ...(item.keywords || [])].join(' ').toLowerCase();
        const matched = terms.every(t => hay.includes(t));
        if (!matched) return null;
        let score = 0;
        terms.forEach(t => {
          if (item.actionTitle.toLowerCase().includes(t)) score += 3;
          if ((item.keywords || []).some(k => k.toLowerCase().includes(t))) score += 2;
          score += 1;
        });
        return {
          type: 'slide',
          score,
          topLeft: `${item.bookTitle} · Slide ${item.slideNo}`,
          topRight: item.module,
          title: item.actionTitle,
          snippet: item.summary,
          url: item.url
        };
      })
      .filter(Boolean);

    const p50Hits = principles50
      .map(p => {
        const title = `#${String(p.no).padStart(2, '0')} ${p.topic}是${p.is}，不是${p.not}`;
        const hay = `${title} ${p.dim} ${p.insight} ${p.action}`.toLowerCase();
        const matched = terms.every(t => hay.includes(t));
        if (!matched) return null;
        let score = 2;
        terms.forEach(t => {
          if (title.toLowerCase().includes(t)) score += 4;
        });
        return {
          type: 'p50',
          score,
          topLeft: `日常 50 問 · ${p.dim}`,
          topRight: `Slide ${p.slideNo}`,
          title,
          snippet: `${p.insight} 行動：${p.action}`,
          url: `decks/fp-daily-50-pincheng.html#slide-${p.slideNo}`
        };
      })
      .filter(Boolean);

    const combined = [...p50Hits, ...slideHits].sort((a, b) => b.score - a.score).slice(0, 24);

    resultsBox?.classList.add('active');
    if (countText) countText.textContent = `找到 ${combined.length} 筆相關結果（關鍵字：「${query}」）`;
    if (!resultsGrid) return;

    if (combined.length === 0) {
      resultsGrid.innerHTML = `<div class="notice-box" style="grid-column:1/-1;">查無「${escapeHtml(query)}」，請試試：艾賓浩斯、三步拆解法、馬斯克、反內耗、邊界感、心流、選擇悖論。</div>`;
      return;
    }

    resultsGrid.innerHTML = combined.map(hit => `
      <a href="${escapeHtml(hit.url)}" class="result-card">
        <div class="result-top">
          <span>${escapeHtml(hit.topLeft)}</span>
          <span>${escapeHtml(hit.topRight)}</span>
        </div>
        <div class="result-title">${highlightText(hit.title, terms)}</div>
        <div class="result-snippet">${highlightText(hit.snippet, terms)}</div>
      </a>
    `).join('');
  }

  async function renderActions() {
    const wrap = $('actions-wrap');
    if (!wrap || !libraryData) return;
    const readyBooks = libraryData.books.filter(b => b.status === 'ready');

    let html = '';
    for (const book of readyBooks) {
      const { map } = await window.FirstPrinciplesSync.getCheckins(book.slug);
      html += `<div style="margin-bottom:14px;">
        <div style="font-size:12px;font-weight:700;color:var(--gold-600);margin-bottom:6px;">${escapeHtml(book.title)}</div>`;
      html += (book.teamActions || []).map(act => {
        const checked = !!map[act.key];
        return `
          <label class="action-check-item ${checked ? 'done' : ''}">
            <input type="checkbox" data-book="${escapeHtml(book.slug)}" data-key="${escapeHtml(act.key)}" ${checked ? 'checked' : ''}>
            <div>
              <strong>${escapeHtml(act.title)}</strong>
              <div style="font-size:12px;color:var(--slate-600);margin-top:2px;">${escapeHtml(act.desc)} <span style="color:var(--navy-700);font-weight:600;">[${escapeHtml(act.owner)}]</span></div>
            </div>
          </label>
        `;
      }).join('');
      html += `</div>`;
    }
    wrap.innerHTML = html;
  }

  async function renderNotes() {
    const list = $('notes-list');
    if (!list) return;
    const bookFilter = $('notes-book-filter')?.value || 'all';
    const { mode, items, notice } = await window.FirstPrinciplesSync.listNotes(bookFilter);

    let prefix = '';
    if (notice) {
      prefix = `<div class="notice-box">雲端提示：${escapeHtml(notice)}（目前自動改以本機瀏覽器暫存，待於 Supabase 執行 <code>supabase/schema.sql</code> 後即啟用雲端同步）</div>`;
    }

    if (!items.length) {
      list.innerHTML = prefix + `<div style="font-size:13px;color:var(--slate-500);padding:12px 0;">尚無共學筆記。可在上方表單發佈第一筆拆解觀察！</div>`;
      return;
    }

    list.innerHTML = prefix + items.map(n => `
      <div class="note-item">
        <div class="note-meta">
          <span><strong>${escapeHtml(n.author_name)}</strong> · ${escapeHtml(n.category)} · ${escapeHtml(n.book_slug === 'fp-learning-beichen' ? '學習法' : '日常50問')}${n.slide_no ? ` P${n.slide_no}` : ''}</span>
          <span>${mode === 'cloud' ? '☁ 雲端' : '💾 本機'} · ${new Date(n.created_at).toLocaleDateString('zh-TW')}</span>
        </div>
        <div class="note-title">${escapeHtml(n.title)}</div>
        <div class="note-body">${escapeHtml(n.content)}</div>
      </div>
    `).join('');
  }

  async function renderDeconstructions() {
    const list = $('decon-list');
    const badge = $('decon-mode-badge');
    if (!list) return;
    const { mode, items } = await window.FirstPrinciplesSync.listDeconstructions();
    if (badge) {
      badge.textContent = mode === 'cloud' ? '☁ Supabase 雲端已連線' : '💾 本機暫存（登入同步雲端）';
      badge.className = `pill ${mode === 'cloud' ? 'pill-navy' : 'pill-slate'}`;
    }

    if (!items.length) {
      list.innerHTML = `<div class="notice-box">尚未儲存拆解紀錄。可點擊左側「帶入經典範本」或輸入團隊遇到的實際難題開始拆解！</div>`;
      return;
    }

    list.innerHTML = items.map(d => `
      <div class="note-item">
        <div class="note-meta">
          <span><strong>${escapeHtml(d.author_name || '團隊成員')}</strong></span>
          <span>${new Date(d.created_at).toLocaleDateString('zh-TW')}</span>
        </div>
        <div class="note-title">${escapeHtml(d.topic)}</div>
        <div class="note-body"><strong>本質根源：</strong>${escapeHtml(d.bedrock_truth)}\n<strong>重建行動：</strong>${escapeHtml(d.rebuilt_solution)}</div>
      </div>
    `).join('');
  }

  function updateAuthUI({ user, cloudReady }) {
    const dot = $('sync-dot');
    const btnLabel = $('auth-btn-label');
    const statusPill = $('cloud-status-pill');
    const signedBox = $('auth-signed-in-box');
    const authForm = $('auth-form');
    const userEmail = $('auth-user-email');

    if (user && cloudReady) {
      dot?.classList.add('online');
      if (btnLabel) btnLabel.textContent = user.email.split('@')[0];
      if (statusPill) {
        statusPill.textContent = `☁ Supabase 雲端同步中 (${user.email})`;
        statusPill.className = 'pill pill-navy';
      }
      if (signedBox) signedBox.style.display = 'block';
      if (authForm) authForm.style.display = 'none';
      if (userEmail) userEmail.textContent = user.email;
    } else {
      dot?.classList.remove('online');
      if (btnLabel) btnLabel.textContent = '團隊登入 / Supabase';
      if (statusPill) {
        statusPill.textContent = '目前模式：本機暫存（登入後啟用 Supabase 雲端同步）';
        statusPill.className = 'pill pill-slate';
      }
      if (signedBox) signedBox.style.display = 'none';
      if (authForm) authForm.style.display = 'flex';
    }

    renderActions();
    renderNotes();
    renderDeconstructions();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = $('global-search-input');
    searchInput?.addEventListener('input', (e) => runGlobalSearch(e.target.value));
    $('search-clear-btn')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      runGlobalSearch('');
      searchInput?.focus();
    });

    $('top-search-btn')?.addEventListener('click', () => {
      searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => searchInput?.focus(), 200);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => searchInput?.focus(), 120);
      }
    });

    $('hot-tags')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.hot-chip');
      if (!chip || !searchInput) return;
      searchInput.value = chip.dataset.kw;
      runGlobalSearch(chip.dataset.kw);
    });

    $('category-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.cat-tab');
      if (!tab) return;
      activeCategory = tab.dataset.cat;
      document.querySelectorAll('#category-tabs .cat-tab').forEach(t => t.classList.toggle('active', t === tab));
      renderBooks();
    });

    $('dim-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.cat-tab');
      if (!tab) return;
      activeDim = tab.dataset.dim;
      document.querySelectorAll('#dim-tabs .cat-tab').forEach(t => t.classList.toggle('active', t === tab));
      renderPrinciples50();
    });

    $('p50-filter')?.addEventListener('input', renderPrinciples50);

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = PRESETS[btn.dataset.preset];
        if (!p) return;
        $('decon-topic').value = p.topic;
        $('decon-surface').value = p.surface;
        $('decon-whys').value = p.whys;
        $('decon-bedrock').value = p.bedrock;
        $('decon-cond').value = p.cond;
        $('decon-rebuilt').value = p.rebuilt;
      });
    });

    $('decon-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await window.FirstPrinciplesSync.saveDeconstruction({
        topic: $('decon-topic').value,
        surface_convention: $('decon-surface').value,
        five_whys: $('decon-whys').value,
        bedrock_truth: $('decon-bedrock').value,
        required_condition: $('decon-cond').value,
        rebuilt_solution: $('decon-rebuilt').value
      });
      e.target.reset();
      renderDeconstructions();
    });

    $('actions-wrap')?.addEventListener('change', async (e) => {
      const cb = e.target.closest('input[type="checkbox"]');
      if (!cb) return;
      await window.FirstPrinciplesSync.toggleCheckin(cb.dataset.book, cb.dataset.key, cb.checked);
      cb.closest('.action-check-item')?.classList.toggle('done', cb.checked);
    });

    $('notes-book-filter')?.addEventListener('change', renderNotes);

    $('note-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await window.FirstPrinciplesSync.addNote({
        book_slug: $('note-book').value,
        slide_no: $('note-slide').value,
        category: $('note-cat').value,
        title: $('note-title').value,
        content: $('note-content').value,
        author_name: $('note-author').value
      });
      $('note-title').value = '';
      $('note-content').value = '';
      renderNotes();
    });

    // Auth Modal
    const modal = $('auth-modal');
    $('auth-open-btn')?.addEventListener('click', () => modal?.classList.add('open'));
    $('auth-close-btn')?.addEventListener('click', () => modal?.classList.remove('open'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });

    $('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('auth-msg');
      if (msg) msg.textContent = '';
      try {
        await window.FirstPrinciplesSync.signIn($('auth-email').value, $('auth-password').value);
        modal?.classList.remove('open');
      } catch (err) {
        if (msg) msg.textContent = err?.message || '登入失敗';
      }
    });

    $('btn-signup')?.addEventListener('click', async () => {
      const msg = $('auth-msg');
      if (msg) msg.textContent = '';
      try {
        await window.FirstPrinciplesSync.signUp($('auth-email').value, $('auth-password').value);
        if (msg) {
          msg.style.color = '#0F766E';
          msg.textContent = '註冊請求已送出！請至信箱點擊驗證連結，或直接登入。';
        }
      } catch (err) {
        if (msg) msg.textContent = err?.message || '註冊失敗';
      }
    });

    $('btn-signout')?.addEventListener('click', async () => {
      await window.FirstPrinciplesSync.signOut();
      modal?.classList.remove('open');
    });

    window.FirstPrinciplesSync.init(updateAuthUI);
    loadAllData();
  });
})();
