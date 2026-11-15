/* ==========================================================================
   Main Application Controller — 학교상담과 생활지도 (상권) 인터랙티브 학습 스튜디오
   ========================================================================== */

(function () {
  const DATA = window.__VOL1_DATA__;
  const STORE = window.StudyStore;
  const PARSER = window.GeminiParser;
  const DIAGRAMS = window.DiagramEngine;
  const CIRCLES = ["①", "②", "③", "④", "⑤"];

  let ui = {
    view: "dashboard", // "dashboard" | "chapter"
    chapter: 1,
    mode: "learn", // "learn" | "mcq" | "essay"
    mcqScope: "chapter", // "chapter" | "all"
    mcqFilter: "all", // "all" | "unanswered" | "wrong" | "bookmarked"
    essayScope: "chapter", // "chapter" | "all"
    selectedEssayId: null,
    selectedPromptChapters: [1, 2, 3, 4, 5, 6],
    pendingImportResult: null,
  };

  let scrollspyObserver = null;
  let essayDebounceTimer = null;

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getAllPacks() {
    const state = STORE.getState();
    return [DATA.defaultPack, ...(state.customPacks || [])];
  }

  function getActivePack() {
    const state = STORE.getState();
    const packs = getAllPacks();
    return packs.find((p) => p.id === state.activePackId) || DATA.defaultPack;
  }

  function renderProgressRingHtml(pct, label, color) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const ringStyle = `--value:${clamped};${color ? `--ring-color:${color}` : ""}`;
    return `
      <div class="progress-ring" style="${ringStyle}">
        <progress value="${clamped}" max="100" aria-valuetext="${esc(label)} ${clamped}%"></progress>
        <span class="ring-label" aria-hidden="true">${clamped}%</span>
      </div>
    `;
  }

  function computeMetrics() {
    const state = STORE.getState();
    const pack = getActivePack();
    const mcqState = STORE.getPackMcqState(pack.id);
    const totalSections = DATA.chapters.reduce((acc, c) => acc + c.coreSections.length, 0);
    const readCount = DATA.chapters.reduce(
      (acc, c) => acc + c.coreSections.filter((s) => Boolean(state.readSections[s.id])).length,
      0
    );

    const mcqs = pack.mcqs || [];
    const attemptedMcqs = mcqs.filter((m) => mcqState.answers[m.id]);
    const correctMcqs = attemptedMcqs.filter((m) => mcqState.answers[m.id].correct);

    const essays = pack.essays || [];
    const essayMap = state.essayProgress[pack.id] || {};
    const doneEssays = essays.filter((e) => {
      const d = essayMap[e.id];
      if (!d) return false;
      const hasText =
        (d.unifiedText && d.unifiedText.trim().length > 10) ||
        (d.scaffold && (d.scaffold.diagnosis + d.scaffold.theory + d.scaffold.intervention).trim().length > 10);
      return hasText || Object.values(d.rubricChecks || {}).some(Boolean);
    });

    const byChapter = DATA.chapters.map((ch) => {
      const chSecs = ch.coreSections;
      const chRead = chSecs.filter((s) => Boolean(state.readSections[s.id])).length;
      const chMcqs = mcqs.filter((m) => m.chapter === ch.chapter);
      const chMcqDone = chMcqs.filter((m) => mcqState.answers[m.id]);
      const chMcqCorrect = chMcqDone.filter((m) => mcqState.answers[m.id].correct).length;
      const chEssays = essays.filter((e) => e.chapter === ch.chapter);
      const chEssayDone = chEssays.filter((e) => doneEssays.some((x) => x.id === e.id)).length;

      return {
        chapter: ch.chapter,
        code: ch.code,
        title: ch.title,
        accent: ch.meta.accent,
        heroSummary: ch.meta.heroSummary,
        readDone: chRead,
        readTotal: chSecs.length,
        readPct: chSecs.length ? Math.round((chRead / chSecs.length) * 100) : 0,
        mcqAttempted: chMcqDone.length,
        mcqCorrect: chMcqCorrect,
        mcqTotal: chMcqs.length,
        mcqPct: chMcqs.length ? Math.round((chMcqDone.length / chMcqs.length) * 100) : 0,
        essayDone: chEssayDone,
        essayTotal: chEssays.length,
        essayPct: chEssays.length ? Math.round((chEssayDone / chEssays.length) * 100) : 0,
      };
    });

    return {
      totalSections,
      readCount,
      readPct: totalSections ? Math.round((readCount / totalSections) * 100) : 0,
      mcqAttempted: attemptedMcqs.length,
      mcqCorrect: correctMcqs.length,
      mcqTotal: mcqs.length,
      mcqPct: mcqs.length ? Math.round((attemptedMcqs.length / mcqs.length) * 100) : 0,
      mcqAccuracy: attemptedMcqs.length ? Math.round((correctMcqs.length / attemptedMcqs.length) * 100) : 0,
      essayDone: doneEssays.length,
      essayTotal: essays.length,
      essayPct: essays.length ? Math.round((doneEssays.length / essays.length) * 100) : 0,
      round: mcqState.round,
      byChapter,
    };
  }

  function syncStickyHeights() {
    const docEl = document.documentElement;
    if (!docEl || !docEl.style || typeof docEl.style.setProperty !== "function") return;
    const headerEl = document.querySelector(".global-header");
    const subbarEl = document.getElementById("chapter-subbar");
    if (headerEl && typeof headerEl.getBoundingClientRect === "function") {
      const h = Math.ceil(headerEl.getBoundingClientRect().height);
      if (h > 0) docEl.style.setProperty("--header-h", `${h}px`);
    }
    if (subbarEl && !subbarEl.hidden && typeof subbarEl.getBoundingClientRect === "function") {
      const sh = Math.ceil(subbarEl.getBoundingClientRect().height);
      docEl.style.setProperty("--subnav-h", `${sh > 0 ? sh : 0}px`);
    } else {
      docEl.style.setProperty("--subnav-h", "0px");
    }
  }

  function applyTheme() {
    const theme = STORE.getState().theme || "light";
    const isDark = theme === "dark";
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle-btn");
    const iconEl = document.getElementById("theme-icon");
    const labelEl = document.getElementById("theme-label");
    if (iconEl) iconEl.textContent = isDark ? "☀️" : "🌙";
    if (labelEl) labelEl.textContent = isDark ? "라이트 모드" : "다크 모드";
    if (btn) {
      const nextActionLabel = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";
      btn.setAttribute("aria-label", nextActionLabel);
      btn.title = nextActionLabel;
      if (!iconEl && !labelEl) btn.textContent = isDark ? "☀️ 라이트 모드" : "🌙 다크 모드";
    }
  }

  function renderHeader() {
    const pack = getActivePack();
    const chNav = document.getElementById("chapter-nav");
    chNav.innerHTML = [
      `<button type="button" class="chap-pill ${ui.view === "dashboard" ? "is-active" : ""}" ${
        ui.view === "dashboard" ? 'aria-current="page"' : ""
      } data-nav-home="true">진도표 홈</button>`,
      ...DATA.chapters.map((c) => {
        const isCurrent = ui.view === "chapter" && ui.chapter === c.chapter;
        return `<button type="button" class="chap-pill ${isCurrent ? "is-active" : ""}" ${
          isCurrent ? 'aria-current="page"' : ""
        } data-nav-ch="${c.chapter}">${c.chapter}장 · ${esc(c.meta.shortTitle)}</button>`;
      }),
    ].join("");

    const packBtn = document.getElementById("open-gemini-btn");
    if (packBtn) {
      packBtn.title = `활성 문제팩: ${pack.name}`;
      packBtn.setAttribute("aria-label", `문제팩 관리 및 불러오기 (현재: ${pack.name})`);
    }

    chNav.querySelectorAll("[data-nav-home]").forEach((b) =>
      b.addEventListener("click", () => navigate({ view: "dashboard" }))
    );
    chNav.querySelectorAll("[data-nav-ch]").forEach((b) =>
      b.addEventListener("click", () =>
        navigate({ view: "chapter", chapter: parseInt(b.dataset.navCh, 10), mode: ui.mode || "learn" })
      )
    );

    const activePill = chNav.querySelector('[aria-current="page"]');
    if (activePill && typeof chNav.scrollTo === "function" && chNav.clientWidth > 0) {
      const targetLeft = Math.max(0, activePill.offsetLeft - (chNav.clientWidth - activePill.offsetWidth) / 2);
      chNav.scrollTo({ left: targetLeft, behavior: "auto" });
    }
  }

  function renderSubbar() {
    const subbar = document.getElementById("chapter-subbar");
    if (ui.view !== "chapter") {
      subbar.hidden = true;
      return;
    }
    subbar.hidden = false;
    const ch = DATA.chapters.find((c) => c.chapter === ui.chapter);
    const tabs = [
      { id: "learn", label: "1. 스크롤 요약 학습" },
      { id: "mcq", label: "2. 객관식 문제 풀기" },
      { id: "essay", label: "3. 실상황 논술형 해결" },
    ];
    subbar.innerHTML = `
      <div class="subbar-inner">
        <div class="subbar-title">
          <span class="subbar-code">${esc(ch.code)}</span>
          <span class="subbar-name">${esc(ch.fullTitle)}</span>
        </div>
        <div class="mode-tabs" role="tablist" aria-label="장 학습 모드">
          ${tabs
            .map(
              (t) =>
                `<button type="button" class="mode-tab" role="tab" data-mode-tab="${t.id}" aria-selected="${
                  ui.mode === t.id ? "true" : "false"
                }">${t.label}</button>`
            )
            .join("")}
        </div>
      </div>
    `;
    subbar.querySelectorAll("[data-mode-tab]").forEach((btn) => {
      btn.addEventListener("click", () => navigate({ view: "chapter", chapter: ui.chapter, mode: btn.dataset.modeTab }));
    });
  }

  function navigate(next, skipSave) {
    ui = Object.assign({}, ui, next);
    if (!skipSave) {
      STORE.setLastPosition({
        view: ui.view,
        chapter: ui.chapter,
        mode: ui.mode,
        scrollY: 0,
      });
    }
    renderApp();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ---------- View: Dashboard ---------- */
  function renderDashboard(root) {
    const m = computeMetrics();
    const pack = getActivePack();
    const lastPos = STORE.getState().lastPosition || { view: "chapter", chapter: 1, mode: "learn", sectionId: "sec-1-1" };
    const lastCh = DATA.chapters.find((c) => c.chapter === (lastPos.chapter || 1)) || DATA.chapters[0];
    const modeLabel = lastPos.mode === "mcq" ? "객관식 문제" : lastPos.mode === "essay" ? "실상황 논술형" : "요약 학습";

    root.innerHTML = `
      <section class="apple-hero">
        <div>
          <span class="hero-eyebrow">학교상담과 생활지도 · 상권 (01~06장)</span>
          <h1 class="hero-title">읽고, 도식으로 꿰뚫고,<br>현장 사례로 완성하는 전공 학습</h1>
          <p class="hero-desc">모든 절의 핵심 개념·표·원문 법령 링크를 스크롤 학습으로 익히고, 기본 35문항·25개 실상황 논술은 물론 제미나이(Gemini) <code>.txt</code> 문제팩을 불러와 회차별로 무제한 반복 훈련할 수 있습니다.</p>
          <div class="hero-cta-row">
            <button type="button" class="btn btn-primary" id="hero-start-ch1">제01장부터 학습 시작하기 →</button>
            <button type="button" class="btn" id="hero-open-gemini">제미나이 문제팩(.txt) 불러오기</button>
            <button type="button" class="btn" id="hero-open-progress">상세 진도표 · JSON 백업</button>
          </div>
        </div>
        <div class="resume-panel">
          <h3>최근 자동 저장된 학습 위치</h3>
          <div class="resume-loc">${esc(lastCh.fullTitle)} · ${esc(modeLabel)}</div>
          <div class="resume-meta">이 브라우저에 모든 진도·체크·논술 초안이 실시간 자동 저장됩니다.</div>
          <button type="button" class="btn btn-primary" style="width:100%" id="hero-resume-btn">마지막 위치에서 이어하기 →</button>
        </div>
      </section>

      <section class="kpi-bento" aria-label="전체 학습 현황 지표">
        <div class="kpi-card">
          ${renderProgressRingHtml(m.readPct, "요약 완독률", "#0071e3")}
          <div class="kpi-text">
            <h4>상권 요약 완독률</h4>
            <div class="kpi-val">${m.readCount} / ${m.totalSections}절</div>
            <div class="kpi-sub">핵심 절 학습 체크 기준</div>
          </div>
        </div>
        <div class="kpi-card">
          ${renderProgressRingHtml(m.mcqPct, "객관식 풀이율", "#5e5ce6")}
          <div class="kpi-text">
            <h4>객관식 풀이 · 정답률</h4>
            <div class="kpi-val">${m.mcqCorrect} / ${m.mcqAttempted} <small style="font-weight:600;color:var(--text-muted)">(${m.mcqAccuracy}%)</small></div>
            <div class="kpi-sub">전체 ${m.mcqTotal}문항 중 진행률</div>
          </div>
        </div>
        <div class="kpi-card">
          ${renderProgressRingHtml(m.essayPct, "논술형 해결율", "#008060")}
          <div class="kpi-text">
            <h4>실상황 논술 해결률</h4>
            <div class="kpi-val">${m.essayDone} / ${m.essayTotal}문항</div>
            <div class="kpi-sub">작성 또는 채점 루브릭 점검</div>
          </div>
        </div>
        <div class="kpi-card">
          ${renderProgressRingHtml(100, "활성 문제팩", "#bf5a00")}
          <div class="kpi-text">
            <h4>활성 문제팩 · 회차</h4>
            <div class="kpi-val">${m.round}회차 진행 중</div>
            <div class="kpi-sub">${esc(pack.name)}</div>
          </div>
        </div>
      </section>

      <div class="section-heading">
        <h2>장별 숙달도 진도표 (Chapter Mastery Matrix)</h2>
        <span>각 장의 요약 완독·객관식·논술 진행률을 한눈에 보고 원하는 모드로 바로 진입하세요</span>
      </div>

      <section class="matrix-grid">
        ${m.byChapter
          .map(
            (c) => `
          <article class="matrix-card">
            <div class="matrix-head">
              <div>
                <span class="matrix-code" style="color:${c.accent};background:${c.accent}18">${esc(c.code)}</span>
                <h3 class="matrix-title">${esc(c.title)}</h3>
              </div>
              <span style="font-size:0.8rem;font-weight:700;color:var(--text-muted)">${c.readDone}/${c.readTotal}절</span>
            </div>
            <p class="matrix-desc">${esc(c.heroSummary)}</p>
            <div class="bars-stack">
              <div class="bar-row">
                <span>요약 학습</span>
                <div class="bar-track"><div class="bar-fill" style="width:${c.readPct}%"></div></div>
                <strong>${c.readPct}%</strong>
              </div>
              <div class="bar-row">
                <span>객관식</span>
                <div class="bar-track"><div class="bar-fill is-mcq" style="width:${c.mcqPct}%"></div></div>
                <strong>${c.mcqAttempted}/${c.mcqTotal}</strong>
              </div>
              <div class="bar-row">
                <span>논술형</span>
                <div class="bar-track"><div class="bar-fill is-essay" style="width:${c.essayPct}%"></div></div>
                <strong>${c.essayDone}/${c.essayTotal}</strong>
              </div>
            </div>
            <div class="matrix-actions">
              <button type="button" class="btn btn-sm" data-go-ch="${c.chapter}" data-go-mode="learn">요약 학습</button>
              <button type="button" class="btn btn-sm" data-go-ch="${c.chapter}" data-go-mode="mcq">객관식</button>
              <button type="button" class="btn btn-sm" data-go-ch="${c.chapter}" data-go-mode="essay">논술형</button>
            </div>
          </article>
        `
          )
          .join("")}
      </section>
    `;

    root.querySelector("#hero-start-ch1").addEventListener("click", () => navigate({ view: "chapter", chapter: 1, mode: "learn" }));
    root.querySelector("#hero-open-gemini").addEventListener("click", () => openGeminiModal());
    root.querySelector("#hero-open-progress").addEventListener("click", () => openProgressModal());
    root.querySelector("#hero-resume-btn").addEventListener("click", () => {
      navigate({
        view: "chapter",
        chapter: lastPos.chapter || 1,
        mode: lastPos.mode || "learn",
      });
    });
    root.querySelectorAll("[data-go-ch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigate({
          view: "chapter",
          chapter: parseInt(btn.dataset.goCh, 10),
          mode: btn.dataset.goMode,
        });
      });
    });
  }

  /* ---------- Mode 1: Scrollytelling Summary + Interactive Diagrams ---------- */
  function renderTableHtml(tbl) {
    return `
      ${tbl.caption ? `<div class="table-caption">${esc(tbl.caption)}</div>` : ""}
      <div class="table-scroll">
        <table class="study-table">
          <thead>
            <tr>${(tbl.headers || []).map((h) => `<th>${h.html || esc(h.plain)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${(tbl.rows || [])
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${cell.html || esc(cell.plain)}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderLearnMode(root, ch) {
    const state = STORE.getState();

    root.innerHTML = `
      <div class="learn-layout">
        <aside class="toc-sidebar" aria-label="절 목차 탐색">
          <div class="toc-header">
            <span>${esc(ch.code)} 학습 목차</span>
            <span id="toc-progress-count">${ch.coreSections.filter((s) => state.readSections[s.id]).length}/${ch.coreSections.length}절 완료</span>
          </div>
          <nav class="toc-nav" id="chapter-toc-nav">
            <a href="#diag-anchor-${ch.chapter}"><span>◆ 인터랙티브 도식화</span><span></span></a>
            ${ch.coreSections
              .map(
                (s) =>
                  `<a href="#${esc(s.id)}" data-toc-for="${esc(s.id)}"><span>${esc(s.secNo)} ${esc(s.title)}</span><span class="toc-check">${
                    state.readSections[s.id] ? "✓" : ""
                  }</span></a>`
              )
              .join("")}
            ${
              ch.activitySection && ch.activitySection.activities && ch.activitySection.activities.length
                ? `<a href="#activity-anchor-${ch.chapter}"><span>★ 수업활동 가이드</span><span></span></a>`
                : ""
            }
          </nav>
        </aside>

        <div class="learn-content">
          <header class="chapter-goal-banner">
            <span class="hero-eyebrow">${esc(ch.code)} · ${esc(ch.meta.tag)}</span>
            <h1>${esc(ch.fullTitle)}</h1>
            <p>${esc(ch.goal || ch.meta.heroSummary)}</p>
          </header>

          <section id="diag-anchor-${ch.chapter}" tabindex="-1" class="diag-mount"></section>

          ${ch.coreSections
            .map((sec) => {
              const isDone = Boolean(state.readSections[sec.id]);
              const cur = sec.curated || {};
              return `
              <article class="sec-article" id="${esc(sec.id)}" tabindex="-1">
                <div class="sec-top">
                  <div>
                    <span class="sec-num">SECTION ${esc(sec.secNo)}</span>
                    <h2 class="sec-title">${esc(sec.secNo)} ${esc(sec.title)}</h2>
                  </div>
                  <button type="button" class="btn complete-btn ${isDone ? "is-done" : ""}" data-toggle-read="${esc(sec.id)}">
                    ${isDone ? "✓ 학습 완료됨" : "○ 학습 완료 체크"}
                  </button>
                </div>

                <div class="sec-takeaway">${esc(cur.heroTakeaway)}</div>

                <div class="tag-row">
                  ${(cur.tags || []).map((t) => `<span class="concept-tag"># ${esc(t)}</span>`).join("")}
                </div>

                <div class="bento-grid">
                  ${(cur.bentoCards || [])
                    .map(
                      (b) => `
                    <div class="bento-card">
                      <span class="bento-badge">${esc(b.badge)}</span>
                      <h4>${esc(b.title)}</h4>
                      <p>${esc(b.summary)}</p>
                    </div>
                  `
                    )
                    .join("")}
                </div>

                <details class="deep-drawer">
                  <summary>교재 원문 · 비교표(${sec.tableCount}개) · 하이퍼링크 전체 보기</summary>
                  <div class="deep-body">
                    ${(sec.introParagraphs || []).map((p) => `<p>${p.html || esc(p.plain)}</p>`).join("")}
                    ${(sec.subsections || [])
                      .map(
                        (sub) => `
                      <div class="deep-sub">
                        <h4>${esc(sub.subNo)} ${esc(sub.title)}</h4>
                        ${(sub.paragraphs || []).map((p) => `<p>${p.html || esc(p.plain)}</p>`).join("")}
                        ${(sub.tables || []).map((t) => renderTableHtml(t)).join("")}
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </details>
              </article>
            `;
            })
            .join("")}

          ${
            ch.activitySection && ch.activitySection.activities && ch.activitySection.activities.length
              ? `
            <section id="activity-anchor-${ch.chapter}" tabindex="-1" class="sec-article">
              <span class="sec-num">CLASSROOM ACTIVITY · ${esc(ch.activitySection.secNo)}</span>
              <h2 class="sec-title">${esc(ch.activitySection.title)}</h2>
              <details class="deep-drawer">
                <summary>대학원·교직 수업활동 안내 및 활동지 펼치기 (${ch.activitySection.activities.length}개 활동)</summary>
                <div class="deep-body">
                  ${ch.activitySection.activities
                    .map(
                      (act) => `
                    <div class="deep-sub">
                      <h4>${esc(act.subNo)} ${esc(act.title)}</h4>
                      ${(act.paragraphs || []).map((p) => `<p>${p.html || esc(p.plain)}</p>`).join("")}
                      ${(act.tables || []).map((t) => renderTableHtml(t)).join("")}
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </details>
            </section>
          `
              : ""
          }

          <div class="toolbar-card" style="justify-content:space-between">
            <div>
              <strong>${esc(ch.code)} 핵심 요약 학습을 마치셨나요?</strong>
              <div style="font-size:0.86rem;color:var(--text-muted)">바로 이어서 객관식 복습문제와 실상황 대입 논술형 문항으로 숙달도를 점검해 보세요.</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn btn-primary" id="cta-to-mcq">객관식 문제 풀러 가기 →</button>
              <button type="button" class="btn" id="cta-to-essay">실상황 논술형 해결하기 →</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render interactive diagram for this chapter
    DIAGRAMS.renderChapterDiagram(root.querySelector(`#diag-anchor-${ch.chapter}`), ch);

    // Toggle read button listeners
    root.querySelectorAll("[data-toggle-read]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const secId = btn.dataset.toggleRead;
        const done = STORE.toggleSectionRead(secId);
        btn.classList.toggle("is-done", done);
        btn.textContent = done ? "✓ 학습 완료됨" : "○ 학습 완료 체크";
        const tocItem = root.querySelector(`[data-toc-for="${secId}"] .toc-check`);
        if (tocItem) tocItem.textContent = done ? "✓" : "";
        const doneCount = ch.coreSections.filter((s) => STORE.getState().readSections[s.id]).length;
        const cntEl = root.querySelector("#toc-progress-count");
        if (cntEl) cntEl.textContent = `${doneCount}/${ch.coreSections.length}절 완료`;
      });
    });

    root.querySelector("#cta-to-mcq").addEventListener("click", () => navigate({ view: "chapter", chapter: ch.chapter, mode: "mcq" }));
    root.querySelector("#cta-to-essay").addEventListener("click", () => navigate({ view: "chapter", chapter: ch.chapter, mode: "essay" }));

    setupScrollspy(root, ch);
  }

  function setupScrollspy(root, ch) {
    if (scrollspyObserver) {
      scrollspyObserver.disconnect();
      scrollspyObserver = null;
    }
    const navLinks = Array.from(root.querySelectorAll("#chapter-toc-nav a"));
    const targets = Array.from(root.querySelectorAll(".sec-article, .diag-mount"));
    if (!("IntersectionObserver" in window) || !targets.length) return;

    function setActiveLink(id) {
      navLinks.forEach((a) => {
        const match = a.getAttribute("href") === `#${id}`;
        a.classList.toggle("target-current", match);
        if (match) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    scrollspyObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          const topId = visible[0].target.id;
          setActiveLink(topId);
          if (topId.startsWith("sec-")) {
            STORE.setLastPosition({ view: "chapter", chapter: ch.chapter, mode: "learn", sectionId: topId });
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: [0, 0.25] }
    );
    targets.forEach((t) => scrollspyObserver.observe(t));
  }

  /* ---------- Mode 2: Multiple-Choice Quiz Arena ---------- */
  function renderMcqMode(root, ch) {
    const packs = getAllPacks();
    const pack = getActivePack();
    const mcqState = STORE.getPackMcqState(pack.id);
    const allMcqs = pack.mcqs || [];
    const scoped = ui.mcqScope === "all" ? allMcqs : allMcqs.filter((q) => q.chapter === ch.chapter);

    const filtered = scoped.filter((q) => {
      const ans = mcqState.answers[q.id];
      if (ui.mcqFilter === "unanswered") return !ans;
      if (ui.mcqFilter === "wrong") return ans && !ans.correct;
      if (ui.mcqFilter === "bookmarked") return Boolean(mcqState.bookmarks[q.id]);
      return true;
    });

    const attemptedCount = scoped.filter((q) => mcqState.answers[q.id]).length;
    const correctCount = scoped.filter((q) => mcqState.answers[q.id] && mcqState.answers[q.id].correct).length;
    const chShortAnswers = (pack.shortAnswers || []).filter((sa) => sa.chapter === ch.chapter || ui.mcqScope === "all");

    root.innerHTML = `
      <div class="toolbar-card">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <label style="font-size:0.84rem;font-weight:700">문제팩:
            <select id="mcq-pack-sel" class="btn btn-sm" style="margin-left:6px">
              ${packs.map((p) => `<option value="${esc(p.id)}" ${p.id === pack.id ? "selected" : ""}>${esc(p.name)} (${(p.mcqs || []).length}문항)</option>`).join("")}
            </select>
          </label>
          <div class="diag-pill-row" style="margin:0">
            <button type="button" class="diag-chip ${ui.mcqScope === "chapter" ? "is-active" : ""}" data-mcq-scope="chapter">제0${ch.chapter}장만 보기</button>
            <button type="button" class="diag-chip ${ui.mcqScope === "all" ? "is-active" : ""}" data-mcq-scope="all">상권 전체 보기</button>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span class="concept-tag" style="background:var(--accent-soft);color:var(--accent)">현재 ${mcqState.round}회차 · ${correctCount}/${attemptedCount} 정답 (총 ${scoped.length}문항)</span>
          <button type="button" class="btn btn-sm" id="mcq-retry-wrong">오답만 새 회차 풀기</button>
          <button type="button" class="btn btn-sm btn-primary" id="mcq-retry-all">전체 새 회차 시작</button>
        </div>
      </div>

      <div class="diag-pill-row">
        ${[
          { id: "all", label: `전체 (${scoped.length})` },
          { id: "unanswered", label: "미풀이" },
          { id: "wrong", label: "오답만 모아보기" },
          { id: "bookmarked", label: "★ 오답/북마크" },
        ]
          .map(
            (f) =>
              `<button type="button" class="diag-chip ${ui.mcqFilter === f.id ? "is-active" : ""}" data-mcq-filter="${f.id}">${f.label}</button>`
          )
          .join("")}
        <button type="button" class="diag-chip" id="mcq-import-cta" style="border-style:dashed;color:var(--accent)">＋ 제미나이 .txt 문제팩 추가</button>
      </div>

      ${
        mcqState.roundHistory && mcqState.roundHistory.length
          ? `
        <details class="deep-drawer" style="margin-bottom:18px">
          <summary>이전 회차 풀이 기록 (${mcqState.roundHistory.length}회 완료)</summary>
          <div class="deep-body">
            ${mcqState.roundHistory
              .slice(0, 8)
              .map(
                (h) =>
                  `<p>• <strong>${h.round}회차</strong> (${new Date(h.completedAt).toLocaleString("ko-KR")}): <strong>${h.score} / ${h.attempted}</strong> 정답 (팩 총 ${h.total}문항, 오답 ${
                    (h.wrongIds || []).length
                  }개)</p>`
              )
              .join("")}
          </div>
        </details>
      `
          : ""
      }

      ${
        filtered.length === 0
          ? `<div class="sec-article"><p style="margin:0;color:var(--text-muted)">선택한 조건(${esc(ui.mcqFilter)})에 해당하는 문항이 없습니다. 위 필터를 변경하거나 새 Gemini 문제팩을 불러와 보세요.</p></div>`
          : filtered
              .map((q) => {
                const rec = mcqState.answers[q.id];
                const isBm = Boolean(mcqState.bookmarks[q.id]);
                return `
                <article class="mcq-card" id="card-${esc(q.id)}">
                  <div class="mcq-meta">
                    <div class="mcq-badges">
                      <span class="matrix-code">제0${q.chapter}장 · 문항 ${q.num}</span>
                      ${q.sectionRef ? `<span class="concept-tag">${esc(q.sectionRef)}절</span>` : ""}
                      ${q.difficulty ? `<span class="concept-tag">${esc(q.difficulty)}</span>` : ""}
                      ${q.keyArea ? `<span class="concept-tag">${esc(q.keyArea)}</span>` : ""}
                    </div>
                    <button type="button" class="btn btn-sm" data-bm-q="${esc(q.id)}">${isBm ? "★ 북마크됨" : "☆ 북마크"}</button>
                  </div>
                  ${q.contextBox ? `<div class="mcq-context">${q.contextBoxHtml || esc(q.contextBox)}</div>` : ""}
                  <h3 class="mcq-stem">${q.stemHtml || esc(q.stem)}</h3>
                  <div class="mcq-options">
                    ${(q.options || [])
                      .map((optText, i) => {
                        const optNo = i + 1;
                        let cls = "mcq-opt";
                        if (rec) {
                          if (optNo === q.answer) cls += " is-correct";
                          else if (optNo === rec.selected && !rec.correct) cls += " is-wrong";
                        }
                        return `<button type="button" class="${cls}" data-pick-q="${esc(q.id)}" data-pick-opt="${optNo}"><span class="opt-num">${
                          CIRCLES[i] || optNo
                        }</span><span>${esc(optText)}</span></button>`;
                      })
                      .join("")}
                  </div>
                  ${
                    rec
                      ? `
                    <div class="mcq-explain">
                      <p style="margin:0 0 6px;font-weight:800;color:${rec.correct ? "var(--success)" : "var(--danger)"}">
                        ${rec.correct ? `✓ 정답입니다! (${CIRCLES[q.answer - 1] || q.answer})` : `✕ 오답입니다. 정답은 ${CIRCLES[q.answer - 1] || q.answer} 입니다.`}
                      </p>
                      <div>${q.explanationHtml || `<p>${esc(q.explanation)}</p>`}</div>
                      ${q.sources ? `<p style="margin:8px 0 0;font-size:0.8rem;color:var(--text-muted)">근거: ${esc(q.sources)}</p>` : ""}
                    </div>
                  `
                      : ""
                  }
                </article>
              `;
              })
              .join("")
      }

      ${
        chShortAnswers.length
          ? `
        <section class="sec-article" style="margin-top:24px">
          <span class="sec-num">BONUS · 제05장 단답형 자가점검 카드 (${chShortAnswers.length}문항)</span>
          <h2 class="sec-title">이론 핵심 구인 인출 연습 (표 5-25)</h2>
          <div class="diag-grid-2">
            ${chShortAnswers
              .map((sa) => {
                const checked = Boolean(STORE.getState().shortAnswerChecked[sa.id]);
                return `
                <div class="diag-card ${checked ? "is-good" : ""}">
                  <h4>단답형 ${sa.num}</h4>
                  <p>${sa.questionHtml || esc(sa.question)}</p>
                  <details class="deep-drawer" style="margin-top:10px">
                    <summary>정답 및 해설 확인하기</summary>
                    <div class="deep-body">
                      <p><strong>정답:</strong> ${esc(sa.answer)}</p>
                      <p>${esc(sa.explanation)}</p>
                      <button type="button" class="btn btn-sm ${checked ? "is-done complete-btn" : ""}" data-toggle-sa="${esc(sa.id)}">${
                  checked ? "✓ 인출 확인 완료" : "정답 확인 체크"
                }</button>
                    </div>
                  </details>
                </div>`;
              })
              .join("")}
          </div>
        </section>
      `
          : ""
      }
    `;

    root.querySelector("#mcq-pack-sel").addEventListener("change", (e) => {
      STORE.setActivePack(e.target.value);
      renderApp();
    });
    root.querySelectorAll("[data-mcq-scope]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.mcqScope = b.dataset.mcqScope;
        renderMcqMode(root, ch);
      })
    );
    root.querySelectorAll("[data-mcq-filter]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.mcqFilter = b.dataset.mcqFilter;
        renderMcqMode(root, ch);
      })
    );
    root.querySelector("#mcq-import-cta").addEventListener("click", () => openGeminiModal());
    root.querySelector("#mcq-retry-wrong").addEventListener("click", () => {
      STORE.startNewMcqRound(pack.id, allMcqs.length, true);
      ui.mcqFilter = "unanswered";
      renderApp();
    });
    root.querySelector("#mcq-retry-all").addEventListener("click", () => {
      STORE.startNewMcqRound(pack.id, allMcqs.length, false);
      ui.mcqFilter = "all";
      renderApp();
    });

    root.querySelectorAll("[data-pick-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qId = btn.dataset.pickQ;
        const opt = parseInt(btn.dataset.pickOpt, 10);
        const q = allMcqs.find((x) => x.id === qId);
        if (!q) return;
        STORE.recordMcqAnswer(pack.id, qId, opt, q.answer);
        renderMcqMode(root, ch);
      });
    });

    root.querySelectorAll("[data-bm-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        STORE.toggleBookmark(pack.id, btn.dataset.bmQ);
        renderMcqMode(root, ch);
      });
    });

    root.querySelectorAll("[data-toggle-sa]").forEach((btn) => {
      btn.addEventListener("click", () => {
        STORE.toggleShortAnswer(btn.dataset.toggleSa);
        renderMcqMode(root, ch);
      });
    });
  }

  /* ---------- Mode 3: Real-Case Essay Practice Lab ---------- */
  function getComposedEssayText(draft) {
    if (!draft) return "";
    if (draft.mode === "unified") return draft.unifiedText || "";
    const sc = draft.scaffold || {};
    return [
      sc.diagnosis ? `[1. 사례/원인 진단]\n${sc.diagnosis}` : "",
      sc.theory ? `[2. 이론·법·윤리 근거]\n${sc.theory}` : "",
      sc.intervention ? `[3. 현장 개입 전략]\n${sc.intervention}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  function renderEssayMode(root, ch) {
    const packs = getAllPacks();
    const pack = getActivePack();
    const allEssays = pack.essays || [];
    const scoped = ui.essayScope === "all" ? allEssays : allEssays.filter((e) => e.chapter === ch.chapter);
    let activeEssay = scoped.find((e) => e.id === ui.selectedEssayId) || scoped[0] || allEssays[0];
    if (activeEssay) ui.selectedEssayId = activeEssay.id;

    const draft = activeEssay ? STORE.getEssayDraft(pack.id, activeEssay.id) : null;
    const composed = getComposedEssayText(draft);

    function calcKeywordHits(essay, text) {
      const lower = (text || "").replace(/\s+/g, "").toLowerCase();
      return (essay.keywords || []).map((kw) => ({
        kw,
        hit: kw.replace(/\s+/g, "").length >= 2 && lower.includes(kw.replace(/\s+/g, "").toLowerCase()),
      }));
    }

    root.innerHTML = `
      <div class="toolbar-card">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <label style="font-size:0.84rem;font-weight:700">문제팩:
            <select id="essay-pack-sel" class="btn btn-sm" style="margin-left:6px">
              ${packs.map((p) => `<option value="${esc(p.id)}" ${p.id === pack.id ? "selected" : ""}>${esc(p.name)} (${(p.essays || []).length}문항)</option>`).join("")}
            </select>
          </label>
          <div class="diag-pill-row" style="margin:0">
            <button type="button" class="diag-chip ${ui.essayScope === "chapter" ? "is-active" : ""}" data-essay-scope="chapter">제0${ch.chapter}장만 보기</button>
            <button type="button" class="diag-chip ${ui.essayScope === "all" ? "is-active" : ""}" data-essay-scope="all">상권 전체 (${allEssays.length})</button>
          </div>
        </div>
        <button type="button" class="btn btn-sm" id="essay-import-cta">＋ 제미나이 .txt 논술 문항 추가</button>
      </div>

      ${
        !activeEssay
          ? `<div class="sec-article"><p style="margin:0;color:var(--text-muted)">이 범위에 등록된 논술형 문항이 없습니다.</p></div>`
          : `
        <div class="essay-split">
          <div class="essay-list">
            ${scoped
              .map((e) => {
                const d = STORE.getEssayDraft(pack.id, e.id);
                const len = getComposedEssayText(d).trim().length;
                return `
                <button type="button" class="essay-item-btn ${e.id === activeEssay.id ? "is-active" : ""}" data-pick-essay="${esc(e.id)}">
                  <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted)">
                    <span>제0${e.chapter}장 · 문항 ${e.num}</span>
                    <span>${len > 0 ? `${len}자 작성` : "미작성"}</span>
                  </div>
                  <h4>${esc(e.title)}</h4>
                </button>
              `;
              })
              .join("")}
          </div>

          <section class="essay-workspace">
            <span class="matrix-code">제0${activeEssay.chapter}장 · 실상황 논술형 ${activeEssay.num}</span>
            <h2 style="margin:8px 0 14px;font-size:1.35rem;letter-spacing:-0.02em">${esc(activeEssay.title)}</h2>

            <div class="case-box">
              <h4>[실상황 사례 제시문]</h4>
              <div>${activeEssay.situationHtml || `<p>${esc(activeEssay.situation)}</p>`}</div>
            </div>

            <div class="case-box" style="border-left:4px solid var(--accent)">
              <h4>[논술 과제 발문]</h4>
              <div>${activeEssay.promptHtml || `<p>${esc(activeEssay.prompt)}</p>`}</div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin:18px 0 10px">
              <div class="diag-pill-row" style="margin:0">
                <button type="button" class="diag-chip ${draft.mode === "scaffold" ? "is-active" : ""}" data-ed-mode="scaffold">단계별 구조화 답안 (추천)</button>
                <button type="button" class="diag-chip ${draft.mode === "unified" ? "is-active" : ""}" data-ed-mode="unified">통합 서술형 답안지</button>
              </div>
              <span id="essay-char-stat" style="font-size:0.82rem;color:var(--text-muted)">현재 ${composed.length}자 (300ms 자동 저장)</span>
            </div>

            ${
              draft.mode === "scaffold"
                ? `
              <div style="display:grid;gap:12px">
                <label style="font-size:0.85rem;font-weight:700">1) 사례/문제 진단 (발달·심리역동·위기 수준)
                  <textarea class="essay-textarea" data-scaf-field="diagnosis" placeholder="학생의 핵심 증상/발달/위기 역동과 교사·학교 맥락을 먼저 진단해 보세요.">${esc(
                    (draft.scaffold && draft.scaffold.diagnosis) || ""
                  )}</textarea>
                </label>
                <label style="font-size:0.85rem;font-weight:700">2) 이론적 근거 · 법/윤리 기준 (학자·법조항 인용)
                  <textarea class="essay-textarea" data-scaf-field="theory" placeholder="관련 상담·발달이론(학자/연도) 및 한국 실정법·ASCA 윤리강령을 정확히 연결하세요.">${esc(
                    (draft.scaffold && draft.scaffold.theory) || ""
                  )}</textarea>
                </label>
                <label style="font-size:0.85rem;font-weight:700">3) 학교상담 현장 개입 설계 및 주의점
                  <textarea class="essay-textarea" data-scaf-field="intervention" placeholder="상담실에서 실행할 단계별 절차, 보호자·교원 협력과 윤리적 유의점을 서술하세요.">${esc(
                    (draft.scaffold && draft.scaffold.intervention) || ""
                  )}</textarea>
                </label>
              </div>
            `
                : `
              <label style="font-size:0.85rem;font-weight:700">실전 서술형 답안지
                <textarea class="essay-textarea is-tall" id="essay-unified-box" placeholder="실전 시험 답안지처럼 서론-본론(이론/법적 근거 및 진단)-결론(구체적 개입) 순으로 자유롭게 작성하세요.">${esc(
                  draft.unifiedText || ""
                )}</textarea>
              </label>
            `
            }

            <div style="margin-top:16px">
              <strong style="font-size:0.84rem">핵심 키워드 포함 자동 점검</strong>
              <div class="kw-strip" id="essay-kw-strip">
                ${calcKeywordHits(activeEssay, composed)
                  .map((k) => `<span class="kw-pill ${k.hit ? "is-hit" : ""}">${k.hit ? "✓ " : ""}${esc(k.kw)}</span>`)
                  .join("")}
              </div>
            </div>

            <details class="deep-drawer" style="margin-top:18px" ${draft.submittedAt ? "open" : ""}>
              <summary>채점 기준표 자가점검 & 모범답안 1:1 비교 열기</summary>
              <div class="deep-body">
                <h4 style="margin-top:0">채점 기준표 자가 체크리스트 (해당 항목을 달성했으면 체크하세요)</h4>
                <div class="table-scroll">
                  <table class="study-table">
                    <thead><tr><th style="width:68px">달성</th><th>평가 영역</th><th>배점</th><th>핵심 채점 준거</th></tr></thead>
                    <tbody>
                      ${(activeEssay.rubric || [])
                        .map((r, i) => {
                          const checked = Boolean((draft.rubricChecks || {})[i]);
                          return `
                          <tr>
                            <td><input type="checkbox" data-rubric-idx="${i}" ${checked ? "checked" : ""} style="width:18px;height:18px;cursor:pointer"></td>
                            <td><strong>${esc(r.area)}</strong></td>
                            <td>${esc(r.weight)}</td>
                            <td>${esc(r.criteria)}${r.deduction ? `<br><small style="color:var(--warn)">${esc(r.deduction)}</small>` : ""}</td>
                          </tr>`;
                        })
                        .join("")}
                    </tbody>
                  </table>
                </div>

                <div class="compare-grid">
                  <div class="compare-pane">
                    <h4 style="margin:0 0 8px;color:var(--accent)">내가 작성한 답안</h4>
                    <div id="compare-my-answer">${esc(composed) || "(아직 작성된 내용이 없습니다)"}</div>
                  </div>
                  <div class="compare-pane" style="border-color:var(--success)">
                    <h4 style="margin:0 0 8px;color:var(--success)">교재 모범답안 요지</h4>
                    <div>${activeEssay.modelAnswerHtml || esc(activeEssay.modelAnswer)}</div>
                  </div>
                </div>
              </div>
            </details>
          </section>
        </div>
      `
      }
    `;

    root.querySelector("#essay-pack-sel").addEventListener("change", (e) => {
      STORE.setActivePack(e.target.value);
      ui.selectedEssayId = null;
      renderApp();
    });
    root.querySelectorAll("[data-essay-scope]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.essayScope = b.dataset.essayScope;
        ui.selectedEssayId = null;
        renderEssayMode(root, ch);
      })
    );
    root.querySelector("#essay-import-cta").addEventListener("click", () => openGeminiModal());

    root.querySelectorAll("[data-pick-essay]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.selectedEssayId = b.dataset.pickEssay;
        renderEssayMode(root, ch);
      })
    );

    if (!activeEssay) return;

    root.querySelectorAll("[data-ed-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        const nextMode = b.dataset.edMode;
        if (nextMode === "unified" && !draft.unifiedText && draft.mode === "scaffold") {
          STORE.updateEssayDraft(pack.id, activeEssay.id, { mode: nextMode, unifiedText: getComposedEssayText(draft) });
        } else {
          STORE.updateEssayDraft(pack.id, activeEssay.id, { mode: nextMode });
        }
        renderEssayMode(root, ch);
      })
    );

    function handleDraftInput(patchFn) {
      window.clearTimeout(essayDebounceTimer);
      essayDebounceTimer = window.setTimeout(() => {
        const updated = STORE.updateEssayDraft(pack.id, activeEssay.id, patchFn());
        const nextTxt = getComposedEssayText(updated);
        const charEl = root.querySelector("#essay-char-stat");
        if (charEl) charEl.textContent = `현재 ${nextTxt.length}자 (자동 저장됨)`;
        const cmpEl = root.querySelector("#compare-my-answer");
        if (cmpEl) cmpEl.textContent = nextTxt || "(아직 작성된 내용이 없습니다)";
        const kwStrip = root.querySelector("#essay-kw-strip");
        if (kwStrip) {
          kwStrip.innerHTML = calcKeywordHits(activeEssay, nextTxt)
            .map((k) => `<span class="kw-pill ${k.hit ? "is-hit" : ""}">${k.hit ? "✓ " : ""}${esc(k.kw)}</span>`)
            .join("");
        }
      }, 300);
    }

    root.querySelectorAll("[data-scaf-field]").forEach((ta) => {
      ta.addEventListener("input", () => {
        const field = ta.dataset.scafField;
        handleDraftInput(() => {
          const cur = STORE.getEssayDraft(pack.id, activeEssay.id).scaffold || {};
          return { scaffold: Object.assign({}, cur, { [field]: ta.value }) };
        });
      });
    });

    const unifiedBox = root.querySelector("#essay-unified-box");
    if (unifiedBox) {
      unifiedBox.addEventListener("input", () => {
        handleDraftInput(() => ({ unifiedText: unifiedBox.value }));
      });
    }

    root.querySelectorAll("[data-rubric-idx]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const curChecks = Object.assign({}, STORE.getEssayDraft(pack.id, activeEssay.id).rubricChecks || {});
        curChecks[cb.dataset.rubricIdx] = cb.checked;
        STORE.updateEssayDraft(pack.id, activeEssay.id, {
          rubricChecks: curChecks,
          submittedAt: new Date().toISOString(),
        });
      });
    });
  }

  /* ---------- <dialog> Modals: Gemini .txt Studio & Progress/Backup ---------- */
  function openGeminiModal() {
    const dlg = document.getElementById("gemini-dialog");
    const body = document.getElementById("gemini-dialog-body");
    const state = STORE.getState();

    body.innerHTML = `
      <div class="diag-tab-bar" role="tablist">
        <button type="button" class="diag-tab-btn" role="tab" data-g-tab="import" aria-selected="true">1. .txt 문제팩 불러오기 / 회차 전환</button>
        <button type="button" class="diag-tab-btn" role="tab" data-g-tab="prompt" aria-selected="false">2. 제미나이 맞춤 문제 출제 프롬프트</button>
      </div>

      <div id="g-panel-import">
        <div class="drop-zone" id="gemini-drop-zone">
          <p style="margin:0 0 10px;font-weight:700">제미나이가 생성한 <code>.txt</code> / <code>.md</code> / <code>.json</code> 파일을 여기에 드롭하거나 선택하세요</p>
          <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
            <label class="btn btn-primary btn-sm" style="cursor:pointer">
              파일 찾아보기 (.txt/.md/.json)
              <input type="file" id="gemini-file-input" accept=".txt,.md,.json,text/plain" style="display:none">
            </label>
            <button type="button" class="btn btn-sm" id="load-sample-pack-btn">제공된 샘플 팩 바로 체험하기</button>
          </div>
        </div>

        <label style="font-size:0.84rem;font-weight:700">또는 아래 입력란에 제미나이 출력 텍스트를 직접 붙여넣으세요:
          <textarea id="gemini-paste-box" class="essay-textarea" style="margin-top:6px;min-height:150px" placeholder="[SET]&#10;제목: 나만의 실전 문제팩&#10;&#10;[MCQ]&#10;장: 1&#10;발문: ..."></textarea>
        </label>

        <div id="gemini-parse-preview" style="margin-top:12px"></div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
          <button type="button" class="btn" id="gemini-preview-btn">양식 검증하기</button>
          <button type="button" class="btn btn-primary" id="gemini-save-pack-btn" disabled>문제팩 저장 및 바로 풀기</button>
        </div>

        <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
        <h4 style="margin:0 0 10px">저장된 문제팩 관리</h4>
        <div style="display:grid;gap:8px">
          ${getAllPacks()
            .map(
              (p) => `
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border);border-radius:12px;background:var(--bg-alt)">
              <div style="min-width:0;flex:1 1 200px">
                <strong>${esc(p.name)}</strong> ${p.id === state.activePackId ? `<span class="bento-badge" style="margin:0 0 0 6px">활성</span>` : ""}
                <div style="font-size:0.78rem;color:var(--text-muted)">객관식 ${(p.mcqs || []).length}문항 · 논술형 ${(p.essays || []).length}문항 (${esc(p.source || "")})</div>
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0">
                <button type="button" class="btn btn-sm" data-use-pack="${esc(p.id)}">선택</button>
                ${!p.isDefault ? `<button type="button" class="btn btn-sm btn-danger" data-del-pack="${esc(p.id)}">삭제</button>` : ""}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div id="g-panel-prompt" hidden>
        <p style="margin-top:0;font-size:0.88rem;color:var(--text-secondary)">아래 조건을 고르면 상권 교재 목차가 포함된 <strong>제미나이 전용 프롬프트</strong>가 생성됩니다. 복사해서 Gemini에 붙여넣고 받은 답을 <code>.txt</code>로 저장하거나 왼쪽 탭에 붙여넣으세요.</p>
        <div class="diag-grid-2" style="margin-bottom:12px">
          <div>
            <strong style="font-size:0.83rem">출제할 장 선택</strong>
            <div class="diag-pill-row" style="margin-top:6px">
              ${[1, 2, 3, 4, 5, 6]
                .map(
                  (n) =>
                    `<button type="button" class="diag-chip ${ui.selectedPromptChapters.includes(n) ? "is-active" : ""}" data-prm-ch="${n}">${n}장</button>`
                )
                .join("")}
            </div>
          </div>
          <div style="display:flex;gap:10px">
            <label style="font-size:0.82rem;font-weight:700;flex:1">객관식 문항 수
              <input type="number" id="prm-mcq-n" value="6" min="0" max="30" class="btn btn-sm" style="width:100%;margin-top:6px">
            </label>
            <label style="font-size:0.82rem;font-weight:700;flex:1">논술형 문항 수
              <input type="number" id="prm-essay-n" value="2" min="0" max="10" class="btn btn-sm" style="width:100%;margin-top:6px">
            </label>
          </div>
        </div>
        <textarea id="prm-output-box" class="essay-textarea is-tall" readonly></textarea>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
          <button type="button" class="btn btn-primary" id="prm-copy-btn">프롬프트 클립보드 복사</button>
        </div>
      </div>
    `;

    const tabImport = body.querySelector("#g-panel-import");
    const tabPrompt = body.querySelector("#g-panel-prompt");
    const tabBtns = Array.from(body.querySelectorAll("[data-g-tab]"));
    tabBtns.forEach((b) => {
      b.addEventListener("click", () => {
        const isImp = b.dataset.gTab === "import";
        tabBtns.forEach((x) => x.setAttribute("aria-selected", x === b ? "true" : "false"));
        tabImport.hidden = !isImp;
        tabPrompt.hidden = isImp;
        if (!isImp) refreshPromptText();
      });
    });

    const pasteBox = body.querySelector("#gemini-paste-box");
    const previewEl = body.querySelector("#gemini-parse-preview");
    const saveBtn = body.querySelector("#gemini-save-pack-btn");
    let currentFileName = "";

    function runPreview(fileNameOverride) {
      if (fileNameOverride) currentFileName = fileNameOverride;
      const res = PARSER.parseGeminiStudyPack(pasteBox.value, currentFileName);
      ui.pendingImportResult = res;
      if (res.ok) {
        previewEl.innerHTML = `
          <div class="diag-card is-good">
            <h4>✓ 양식 검증 통과: "${esc(res.pack.name)}"</h4>
            <p>객관식 <strong>${res.stats.mcqs}문항</strong> · 실상황 논술형 <strong>${res.stats.essays}문항</strong>이 인식되었습니다.</p>
            ${res.warnings.length ? `<p style="margin-top:6px;color:var(--warn)">참고: ${esc(res.warnings.join(" / "))}</p>` : ""}
          </div>`;
        saveBtn.disabled = false;
      } else {
        previewEl.innerHTML = `
          <div class="diag-card is-bad">
            <h4>✕ 인식 오류</h4>
            <p>${esc(res.errors.join(" / "))}</p>
          </div>`;
        saveBtn.disabled = true;
      }
    }

    body.querySelector("#gemini-preview-btn").addEventListener("click", () => runPreview());
    body.querySelector("#load-sample-pack-btn").addEventListener("click", () => {
      pasteBox.value = window.__SAMPLE_GEMINI_TXT__ || "";
      runPreview("sample_gemini_pack_vol1.txt");
    });

    function handleFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        pasteBox.value = String(reader.result || "");
        runPreview(file.name);
      };
      reader.readAsText(file, "utf-8");
    }

    body.querySelector("#gemini-file-input").addEventListener("change", (e) => handleFile(e.target.files[0]));
    const dropZone = body.querySelector("#gemini-drop-zone");
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("is-over");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-over"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("is-over");
      handleFile(e.dataTransfer.files[0]);
    });

    saveBtn.addEventListener("click", () => {
      const res = ui.pendingImportResult;
      if (!res || !res.ok || !res.pack) return;
      STORE.addCustomPack(res.pack);
      dlg.close();
      navigate({
        view: "chapter",
        chapter: (res.pack.mcqs[0] && res.pack.mcqs[0].chapter) || (res.pack.essays[0] && res.pack.essays[0].chapter) || 1,
        mode: res.pack.mcqs.length ? "mcq" : "essay",
      });
    });

    body.querySelectorAll("[data-use-pack]").forEach((b) =>
      b.addEventListener("click", () => {
        STORE.setActivePack(b.dataset.usePack);
        dlg.close();
        renderApp();
      })
    );
    body.querySelectorAll("[data-del-pack]").forEach((b) =>
      b.addEventListener("click", () => {
        STORE.deleteCustomPack(b.dataset.delPack);
        openGeminiModal();
        renderApp();
      })
    );

    function refreshPromptText() {
      const out = body.querySelector("#prm-output-box");
      out.value = PARSER.buildGeminiPromptTemplate({
        chapters: ui.selectedPromptChapters,
        mcqCount: parseInt(body.querySelector("#prm-mcq-n").value, 10) || 6,
        essayCount: parseInt(body.querySelector("#prm-essay-n").value, 10) || 2,
      });
    }
    body.querySelectorAll("[data-prm-ch]").forEach((b) =>
      b.addEventListener("click", () => {
        const n = parseInt(b.dataset.prmCh, 10);
        if (ui.selectedPromptChapters.includes(n)) {
          if (ui.selectedPromptChapters.length > 1) {
            ui.selectedPromptChapters = ui.selectedPromptChapters.filter((x) => x !== n);
          }
        } else {
          ui.selectedPromptChapters.push(n);
          ui.selectedPromptChapters.sort();
        }
        b.classList.toggle("is-active", ui.selectedPromptChapters.includes(n));
        refreshPromptText();
      })
    );
    body.querySelector("#prm-mcq-n").addEventListener("change", refreshPromptText);
    body.querySelector("#prm-essay-n").addEventListener("change", refreshPromptText);
    body.querySelector("#prm-copy-btn").addEventListener("click", async () => {
      const out = body.querySelector("#prm-output-box");
      try {
        await navigator.clipboard.writeText(out.value);
        body.querySelector("#prm-copy-btn").textContent = "✓ 복사 완료!";
      } catch (e) {
        out.select();
        document.execCommand("copy");
        body.querySelector("#prm-copy-btn").textContent = "✓ 선택 및 복사됨";
      }
    });

    if (!dlg.open) dlg.showModal();
  }

  function openProgressModal() {
    const dlg = document.getElementById("progress-dialog");
    const body = document.getElementById("progress-dialog-body");
    const state = STORE.getState();
    const m = computeMetrics();

    body.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:16px">
        <div>
          <strong>전체 상권 요약 완독 ${m.readCount}/${m.totalSections}절 (${m.readPct}%)</strong>
          <div style="font-size:0.84rem;color:var(--text-muted)">다른 기기나 브라우저로 옮기려면 JSON 백업 파일을 저장해 두세요.</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-primary btn-sm" id="export-json-btn">JSON 백업 다운로드</button>
          <label class="btn btn-sm" style="cursor:pointer">백업 복원
            <input type="file" id="import-json-input" accept=".json,application/json" style="display:none">
          </label>
          <button type="button" class="btn btn-sm btn-danger" id="reset-all-btn" data-armed="false">진도 초기화</button>
        </div>
      </div>
      <div id="progress-status-msg"></div>

      <h4 style="margin:12px 0 8px">38개 절(Section)별 학습 완료 체크표</h4>
      <div class="table-scroll">
        <table class="study-table">
          <thead><tr><th>장</th><th>절 번호 및 제목</th><th>상태</th><th>바로가기</th></tr></thead>
          <tbody>
            ${DATA.chapters
              .flatMap((c) =>
                c.coreSections.map((s) => {
                  const done = Boolean(state.readSections[s.id]);
                  return `
                  <tr>
                    <td>${esc(c.code)}</td>
                    <td><strong>${esc(s.secNo)}</strong> ${esc(s.title)}</td>
                    <td style="color:${done ? "var(--success)" : "var(--text-muted)"};font-weight:700">${done ? "✓ 완료" : "미완료"}</td>
                    <td><button type="button" class="btn btn-sm" data-jump-sec="${esc(s.id)}" data-jump-ch="${c.chapter}">이동</button></td>
                  </tr>`;
                })
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    body.querySelector("#export-json-btn").addEventListener("click", () => {
      const blob = new Blob([STORE.exportBackupJson()], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `학교상담상권_학습기록백업_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const statusMsg = body.querySelector("#progress-status-msg");
    body.querySelector("#import-json-input").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          STORE.importBackupJson(String(r.result || ""));
          dlg.close();
          renderApp();
        } catch (err) {
          if (statusMsg) {
            statusMsg.innerHTML = `<div class="diag-card is-bad" style="margin-bottom:14px"><strong>복원 오류:</strong> ${esc(err.message)}</div>`;
          }
        }
      };
      r.readAsText(f, "utf-8");
    });

    const resetBtn = body.querySelector("#reset-all-btn");
    let resetArmTimer = null;
    resetBtn.addEventListener("click", () => {
      if (resetBtn.dataset.armed !== "true") {
        resetBtn.dataset.armed = "true";
        resetBtn.textContent = "정말 초기화할까요? (한 번 더 클릭)";
        if (statusMsg) {
          statusMsg.innerHTML = `<div class="diag-card" style="margin-bottom:14px;border-color:var(--danger)"><strong>초기화 대기:</strong> 4초 안에 한 번 더 누르면 모든 진도와 풀이 기록이 초기화됩니다. (불러온 Gemini 문제팩은 유지)</div>`;
        }
        window.clearTimeout(resetArmTimer);
        resetArmTimer = window.setTimeout(() => {
          resetBtn.dataset.armed = "false";
          resetBtn.textContent = "진도 초기화";
        }, 4000);
        return;
      }
      window.clearTimeout(resetArmTimer);
      STORE.resetAllProgress();
      openProgressModal();
      renderApp();
    });

    body.querySelectorAll("[data-jump-sec]").forEach((b) =>
      b.addEventListener("click", () => {
        const chNo = parseInt(b.dataset.jumpCh, 10);
        const secId = b.dataset.jumpSec;
        dlg.close();
        navigate({ view: "chapter", chapter: chNo, mode: "learn" });
        window.setTimeout(() => {
          const el = document.getElementById(secId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 60);
      })
    );

    if (!dlg.open) dlg.showModal();
  }

  /* ---------- Main Render Orchestrator ---------- */
  function renderApp() {
    applyTheme();
    renderHeader();
    renderSubbar();
    const root = document.getElementById("app-root");
    if (ui.view === "dashboard") {
      if (scrollspyObserver) {
        scrollspyObserver.disconnect();
        scrollspyObserver = null;
      }
      renderDashboard(root);
    } else {
      const ch = DATA.chapters.find((c) => c.chapter === ui.chapter) || DATA.chapters[0];
      if (ui.mode === "learn") renderLearnMode(root, ch);
      else if (ui.mode === "mcq") renderMcqMode(root, ch);
      else renderEssayMode(root, ch);
    }
    syncStickyHeights();
  }

  async function init() {
    await STORE.hydrateFromIdbIfEmpty();
    let hasSavedPrefs = false;
    try {
      hasSavedPrefs = Boolean(window.localStorage.getItem("school_counseling_vol1_state_v1"));
    } catch (e) {
      hasSavedPrefs = false;
    }
    if (!hasSavedPrefs) {
      const hostDark =
        document.documentElement.classList.contains("dark") ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (hostDark) STORE.setTheme("dark");
    }

    const savedPos = STORE.getState().lastPosition;
    if (savedPos && savedPos.chapter) {
      ui.chapter = savedPos.chapter;
      ui.mode = savedPos.mode || "learn";
    }

    document.getElementById("brand-home-btn").addEventListener("click", () => navigate({ view: "dashboard" }));
    document.getElementById("open-gemini-btn").addEventListener("click", () => openGeminiModal());
    document.getElementById("open-progress-btn").addEventListener("click", () => openProgressModal());
    document.getElementById("theme-toggle-btn").addEventListener("click", () => {
      const next = STORE.getState().theme === "dark" ? "light" : "dark";
      STORE.setTheme(next);
      applyTheme();
    });

    window.addEventListener("themechange", () => {
      const isHostLight = document.documentElement.classList.contains("light");
      const isHostDark = document.documentElement.classList.contains("dark");
      if (isHostLight || isHostDark) {
        STORE.setTheme(isHostDark ? "dark" : "light");
        applyTheme();
      }
    });

    // Fallback scroll progress for browsers without CSS scroll() timeline
    window.addEventListener(
      "scroll",
      () => {
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - window.innerHeight);
        doc.style.setProperty("--scroll-fallback", String(Math.min(1, Math.max(0, window.scrollY / max))));
      },
      { passive: true }
    );

    STORE.subscribe((_state, timeStr) => {
      const badge = document.getElementById("autosave-badge");
      if (badge) badge.textContent = `● 자동 저장됨 ${timeStr}`;
    });

    if (typeof ResizeObserver === "function") {
      const stickyObserver = new ResizeObserver(() => syncStickyHeights());
      const headerEl = document.querySelector(".global-header");
      const subbarEl = document.getElementById("chapter-subbar");
      if (headerEl) stickyObserver.observe(headerEl);
      if (subbarEl) stickyObserver.observe(subbarEl);
    }

    renderApp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
