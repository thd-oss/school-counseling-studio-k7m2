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
    view: "dashboard", // "dashboard" | "chapter" | "exam"
    chapter: 1,
    mode: "learn", // "learn" | "mcq" | "essay"
    examTab: "mcq", // "mcq" | "essay" | "report"
    mcqFilter: "all", // "all" | "unanswered" | "wrong" | "bookmarked"
    examMcqFilter: "all", // "all" | "unanswered" | "wrong" | "bookmarked"
    examEssayChapter: 0, // 0 = all chapters, 1..6 = chapter filter
    selectedEssayId: null,
    selectedExamEssayId: null,
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

  function isEssayCompleted(essayMap, essayId) {
    const d = essayMap[essayId];
    if (!d) return false;
    const hasText =
      (d.unifiedText && d.unifiedText.trim().length > 10) ||
      (d.scaffold && (d.scaffold.diagnosis + d.scaffold.theory + d.scaffold.intervention).trim().length > 10);
    return hasText || Object.values(d.rubricChecks || {}).some(Boolean);
  }

  function computeMetrics() {
    const state = STORE.getState();
    const pack = getActivePack();
    const mcqState = STORE.getPackMcqState(pack.id);
    const examState = STORE.getVolumeExamState(pack.id);
    const totalSections = DATA.chapters.reduce((acc, c) => acc + c.coreSections.length, 0);
    const readCount = DATA.chapters.reduce(
      (acc, c) => acc + c.coreSections.filter((s) => Boolean(state.readSections[s.id])).length,
      0
    );

    const mcqs = pack.mcqs || [];
    const attemptedMcqs = mcqs.filter((m) => mcqState.answers[m.id]);
    const correctMcqs = attemptedMcqs.filter((m) => mcqState.answers[m.id].correct);

    const examAttemptedMcqs = mcqs.filter((m) => examState.answers[m.id]);
    const examCorrectMcqs = examAttemptedMcqs.filter((m) => examState.answers[m.id].correct);

    const essays = pack.essays || [];
    const essayMap = state.essayProgress[pack.id] || {};
    const doneEssays = essays.filter((e) => isEssayCompleted(essayMap, e.id));
    const examEssayMap = examState.essays || {};
    const examDoneEssays = essays.filter((e) => isEssayCompleted(examEssayMap, e.id));

    const byChapter = DATA.chapters.map((ch) => {
      const chSecs = ch.coreSections;
      const chRead = chSecs.filter((s) => Boolean(state.readSections[s.id])).length;
      const chMcqs = mcqs.filter((m) => m.chapter === ch.chapter);
      const chMcqDone = chMcqs.filter((m) => mcqState.answers[m.id]);
      const chMcqCorrect = chMcqDone.filter((m) => mcqState.answers[m.id].correct).length;
      const chExamDone = chMcqs.filter((m) => examState.answers[m.id]);
      const chExamCorrect = chExamDone.filter((m) => examState.answers[m.id].correct).length;
      const chEssays = essays.filter((e) => e.chapter === ch.chapter);
      const chEssayDone = chEssays.filter((e) => doneEssays.some((x) => x.id === e.id)).length;
      const chExamEssayDone = chEssays.filter((e) => examDoneEssays.some((x) => x.id === e.id)).length;

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
        examAttempted: chExamDone.length,
        examCorrect: chExamCorrect,
        examPct: chMcqs.length ? Math.round((chExamDone.length / chMcqs.length) * 100) : 0,
        examAccuracy: chExamDone.length ? Math.round((chExamCorrect / chExamDone.length) * 100) : 0,
        essayDone: chEssayDone,
        essayTotal: chEssays.length,
        essayPct: chEssays.length ? Math.round((chEssayDone / chEssays.length) * 100) : 0,
        examEssayDone: chExamEssayDone,
      };
    });

    return {
      totalSections,
      readCount,
      readPct: totalSections ? Math.round((readCount / totalSections) * 100) : 0,
      allChaptersRead: totalSections > 0 && readCount === totalSections,
      mcqAttempted: attemptedMcqs.length,
      mcqCorrect: correctMcqs.length,
      mcqTotal: mcqs.length,
      mcqPct: mcqs.length ? Math.round((attemptedMcqs.length / mcqs.length) * 100) : 0,
      mcqAccuracy: attemptedMcqs.length ? Math.round((correctMcqs.length / attemptedMcqs.length) * 100) : 0,
      essayDone: doneEssays.length,
      essayTotal: essays.length,
      essayPct: essays.length ? Math.round((doneEssays.length / essays.length) * 100) : 0,
      round: mcqState.round,
      examRound: examState.round,
      examAttempted: examAttemptedMcqs.length,
      examCorrect: examCorrectMcqs.length,
      examPct: mcqs.length ? Math.round((examAttemptedMcqs.length / mcqs.length) * 100) : 0,
      examAccuracy: examAttemptedMcqs.length ? Math.round((examCorrectMcqs.length / examAttemptedMcqs.length) * 100) : 0,
      examEssayDone: examDoneEssays.length,
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
      `<button type="button" class="chap-pill is-exam-pill ${ui.view === "exam" ? "is-active" : ""}" ${
        ui.view === "exam" ? 'aria-current="page"' : ""
      } data-nav-exam="true">★ 상권 통합 연습</button>`,
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
    chNav.querySelectorAll("[data-nav-exam]").forEach((b) =>
      b.addEventListener("click", () => navigate({ view: "exam", examTab: ui.examTab || "mcq" }))
    );

    const activePill = chNav.querySelector('[aria-current="page"]');
    if (activePill && typeof chNav.scrollTo === "function" && chNav.clientWidth > 0) {
      const targetLeft = Math.max(0, activePill.offsetLeft - (chNav.clientWidth - activePill.offsetWidth) / 2);
      chNav.scrollTo({ left: targetLeft, behavior: "auto" });
    }
  }

  function renderSubbar() {
    const subbar = document.getElementById("chapter-subbar");
    if (ui.view === "dashboard") {
      subbar.hidden = true;
      return;
    }
    subbar.hidden = false;
    if (ui.view === "exam") {
      const examTabs = [
        { id: "mcq", label: "1. 통합 객관식 실전" },
        { id: "essay", label: "2. 통합 실상황 논술" },
        { id: "report", label: "3. 단원별 성취 리포트" },
      ];
      subbar.innerHTML = `
        <div class="subbar-inner">
          <div class="subbar-title">
            <span class="subbar-code">VOLUME 1 EXAM</span>
            <span class="subbar-name">상권(01~06장) 전 범위 통합 실전 연습</span>
          </div>
          <nav class="mode-tabs" aria-label="상권 통합 연습 단계">
            ${examTabs
              .map(
                (t) =>
                  `<button type="button" class="mode-tab" data-exam-tab="${t.id}" ${
                    ui.examTab === t.id ? 'aria-current="page"' : ""
                  }>${t.label}</button>`
              )
              .join("")}
          </nav>
        </div>
      `;
      subbar.querySelectorAll("[data-exam-tab]").forEach((btn) => {
        btn.addEventListener("click", () => navigate({ view: "exam", examTab: btn.dataset.examTab }));
      });
      return;
    }

    const ch = DATA.chapters.find((c) => c.chapter === ui.chapter) || DATA.chapters[0];
    const tabs = [
      { id: "learn", label: "1. 요약 학습" },
      { id: "mcq", label: "2. 장 마무리 객관식" },
      { id: "essay", label: "3. 장 실상황 논술" },
    ];
    subbar.innerHTML = `
      <div class="subbar-inner">
        <div class="subbar-title">
          <span class="subbar-code">${esc(ch.code)}</span>
          <span class="subbar-name">${esc(ch.fullTitle)}</span>
        </div>
        <nav class="mode-tabs" aria-label="장 학습 단계">
          ${tabs
            .map(
              (t) =>
                `<button type="button" class="mode-tab" data-mode-tab="${t.id}" ${
                  ui.mode === t.id ? 'aria-current="page"' : ""
                }>${t.label}</button>`
            )
            .join("")}
        </nav>
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
        examTab: ui.examTab,
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
    const modeLabel = lastPos.mode === "mcq" ? "장 마무리 객관식" : lastPos.mode === "essay" ? "장 실상황 논술" : "요약 학습";
    const resumeLabel =
      lastPos.view === "exam"
        ? `상권(01~06장) 통합 실전 연습 · ${lastPos.examTab === "essay" ? "통합 논술" : lastPos.examTab === "report" ? "성취 리포트" : "통합 객관식"}`
        : `${lastCh.fullTitle} · ${modeLabel}`;

    root.innerHTML = `
      <section class="apple-hero">
        <div>
          <span class="hero-eyebrow">학교상담과 생활지도 · 상권 (01~06장)</span>
          <h1 class="hero-title">읽고, 도식으로 꿰뚫고,<br>현장 사례로 완성하는 전공 학습</h1>
          <p class="hero-desc">각 장의 요약 학습이 끝나면 장별 확인 문제를 풀고, 상권 완독 후에는 전 범위를 백지상태로 다시 섞어 푸는 <strong>★ 상권 통합 연습</strong>으로 복습을 완성할 수 있습니다.</p>
          <div class="hero-cta-row">
            <button type="button" class="btn btn-primary" id="hero-start-ch1">제01장부터 학습 시작하기 →</button>
            <button type="button" class="btn" id="hero-open-gemini">제미나이 문제팩(.txt) 불러오기</button>
            <button type="button" class="btn" id="hero-open-progress">상세 진도표 · JSON 백업</button>
          </div>
        </div>
        <div class="resume-panel">
          <h3>최근 자동 저장된 학습 위치</h3>
          <div class="resume-loc">${esc(resumeLabel)}</div>
          <div class="resume-meta">장별 학습 진도와 권 통합 실전 기록이 각각 독립적으로 자동 저장됩니다.</div>
          <button type="button" class="btn btn-primary" style="width:100%" id="hero-resume-btn">마지막 위치에서 이어하기 →</button>
        </div>
      </section>

      <section class="kpi-bento" aria-label="전체 학습 현황 지표">
        <div class="kpi-card">
          ${renderProgressRingHtml(m.readPct, "요약 완독률", "#0071e3")}
          <div class="kpi-text">
            <h4>상권 요약 완독률</h4>
            <div class="kpi-val">${m.readCount} / ${m.totalSections}절</div>
            <div class="kpi-sub">각 절 하단 완료 체크 기준</div>
          </div>
        </div>
        <div class="kpi-card">
          ${renderProgressRingHtml(m.mcqPct, "장별 객관식 풀이율", "#5e5ce6")}
          <div class="kpi-text">
            <h4>장별 확인 객관식</h4>
            <div class="kpi-val">${m.mcqCorrect} / ${m.mcqAttempted} <small style="font-weight:600;color:var(--text-muted)">(${m.mcqAccuracy}%)</small></div>
            <div class="kpi-sub">전체 ${m.mcqTotal}문항 중 장별 누적</div>
          </div>
        </div>
        <div class="kpi-card">
          ${renderProgressRingHtml(m.essayPct, "장별 논술 해결률", "#008060")}
          <div class="kpi-text">
            <h4>장별 실상황 논술</h4>
            <div class="kpi-val">${m.essayDone} / ${m.essayTotal}문항</div>
            <div class="kpi-sub">작성 또는 채점 루브릭 점검</div>
          </div>
        </div>
        <div class="kpi-card">
          ${renderProgressRingHtml(m.examPct, "권 통합 실전율", "#bf5a00")}
          <div class="kpi-text">
            <h4>상권 통합 실전 (${m.examRound}회차)</h4>
            <div class="kpi-val">${m.examCorrect} / ${m.examAttempted} <small style="font-weight:600;color:var(--text-muted)">(${m.examAccuracy}%)</small></div>
            <div class="kpi-sub">${esc(pack.name)}</div>
          </div>
        </div>
      </section>

      <section class="flow-gate-card is-exam-callout" aria-label="상권 통합 연습 바로가기">
        <div>
          <span class="hero-eyebrow" style="margin-bottom:8px">2-TRACK EXAM · 장별 진도 보존형 권 통합 복습</span>
          <h2 style="margin:0 0 4px;font-size:1.22rem;letter-spacing:-0.02em">
            ${m.allChaptersRead ? "🎓 상권 38개 절 완독! 전 범위 통합 실전 연습을 시작해 보세요" : "★ 한 권(01~06장) 통합 실전 연습장"}
          </h2>
          <p style="margin:0;font-size:0.88rem;color:var(--text-secondary)">
            요약 완독 <strong>${m.readCount}/${m.totalSections}절</strong> · 통합 객관식 <strong>${m.examAttempted}/${m.mcqTotal}문항</strong>(정답률 ${m.examAccuracy}%) · 통합 논술 <strong>${m.examEssayDone}/${m.essayTotal}문항</strong>. 장별 학습 정답과 분리되어 언제든 백지·랜덤 순서로 반복 풀이할 수 있습니다.
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-primary" id="hero-to-exam">★ 상권 전 범위 통합 연습문제 풀기 →</button>
        </div>
      </section>

      <div class="section-heading">
        <h2>장별 숙달도 진도표 (Chapter Mastery Matrix)</h2>
        <span>각 장의 요약 완독·장 마무리 객관식·논술 진행률을 확인하고 원하는 단계로 바로 진입하세요</span>
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
    root.querySelector("#hero-to-exam").addEventListener("click", () => navigate({ view: "exam", examTab: "mcq" }));
    root.querySelector("#hero-resume-btn").addEventListener("click", () => {
      if (lastPos.view === "exam") {
        navigate({ view: "exam", examTab: lastPos.examTab || "mcq" });
        return;
      }
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
    const ms = ch.masterSummary || {};
    const stage = ms.pinnedStage || {};

    root.innerHTML = `
      <div class="learn-mode-shell">
        <!-- Zone 1: Chapter Apple Showcase Header + Master Chapter Summary -->
        <header class="chapter-showcase-hero">
          <span class="hero-eyebrow">${esc(ch.code)} · ${esc(ch.meta.tag)}</span>
          <h1 aria-label="${esc(ch.fullTitle)}">
            <span class="motion-line-mask"><span>${esc(ch.code)}</span></span>
            <span class="motion-line-mask"><span>${esc(ch.title)}</span></span>
          </h1>
          <p class="chapter-showcase-lead">${esc(ch.meta.heroSummary)}</p>
          <p class="chapter-showcase-goal"><strong>장 학습목표:</strong> ${esc(ch.goal || "")}</p>
        </header>

        ${
          ms.thesis
            ? `
          <section id="master-summary-ch${ch.chapter}" tabindex="-1" class="master-summary-panel" aria-label="${esc(ch.code)} 장 마스터 요약">
            <div class="master-summary-head">
              <div>
                <span class="sec-num">MASTER SYNTHESIS · 상권 핵심 재분석 요약</span>
                <h2>${esc(ch.code)} 전체 구조 한눈에 꿰뚫기</h2>
              </div>
              <span class="concept-tag">${ch.coreSections.length}개 절 · ${ch.coreSections.reduce((a, s) => a + (s.subsections || []).length, 0)}개 소절 · ${ch.coreSections.reduce((a, s) => a + (s.tableCount || 0), 0)}개 표 통합</span>
            </div>
            <div class="master-thesis-box">${esc(ms.thesis)}</div>
            <div class="pillar-grid">
              ${(ms.keyPillars || [])
                .map(
                  (p) => `
                <button type="button" class="pillar-card" data-jump-pillar-sec="${esc(p.secId)}">
                  <span class="sec-num">SECTION ${esc(p.secNo)}</span>
                  <h3>${esc(p.secNo)} ${esc(p.title)}</h3>
                  <div class="pillar-focus">${esc(p.focus)}</div>
                  <div class="pillar-must">★ ${esc(p.mustKnow)}</div>
                </button>
              `
                )
                .join("")}
            </div>
            ${
              ms.examHighlights && ms.examHighlights.length
                ? `
              <div class="exam-highlight-strip">
                <h4>임용·대학원 및 현장 실무 최빈출 변별 포인트</h4>
                <ul>${ms.examHighlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
              </div>
            `
                : ""
            }
          </section>
        `
            : ""
        }

        <!-- Zone 2: Apple Single-Viewport Sticky Runway Stage (Zero Jump Buttons) -->
        ${
          stage.beats && stage.beats.length
            ? `
          <section
            id="pinned-stage-ch${ch.chapter}"
            tabindex="-1"
            class="theater-runway"
            style="--beat-count: ${stage.beats.length}"
            aria-label="${esc(ch.code)} 인터랙티브 스크롤 스토리 스테이지"
          >
            <div class="apple-theater-stage theater-sticky-viewport" data-theater-sticky>
              <div class="theater-topbar">
                <div class="theater-title-wrap">
                  <span class="theater-kicker">${esc(stage.kicker)}</span>
                  <h2>${esc(stage.title)}</h2>
                  <p class="theater-sub">${esc(stage.subtitle)}</p>
                </div>
                <div class="theater-progress-meta" aria-live="polite">
                  <span class="theater-step-count" id="stage-beat-lbl-${ch.chapter}">01 / 0${stage.beats.length}</span>
                  <div class="theater-progress-rail" aria-hidden="true">
                    ${stage.beats
                      .map(
                        (_b, idx) =>
                          `<span class="theater-seg"><span class="theater-seg-fill" data-stage-seg="${idx}" style="transform:scaleX(${
                            idx === 0 ? 0.25 : 0
                          })"></span></span>`
                      )
                      .join("")}
                  </div>
                </div>
              </div>

              <div class="theater-stage-body">
                <div class="theater-visual-frame">
                  <div id="stage-svg-host-${ch.chapter}" class="theater-svg-mount"></div>
                </div>
                <div class="theater-spec-column">
                  <div class="theater-spec-deck" role="region" aria-label="도식 연동 핵심 해설" tabindex="0">
                    ${stage.beats
                      .map(
                        (b, idx) => `
                      <article
                        class="story-beat-slide ${idx === 0 ? "is-active" : ""}"
                        data-story-beat="${idx}"
                        aria-hidden="${idx === 0 ? "false" : "true"}"
                      >
                        <div class="story-beat-top">
                          <span class="story-beat-badge">${esc(b.badge)}</span>
                          <div class="story-spec-callout">
                            <span class="story-spec-label">${esc(b.metricLabel)}</span>
                            <strong class="story-spec-value">${esc(b.metricValue)}</strong>
                          </div>
                        </div>
                        <h3>${esc(b.step)}. ${esc(b.title)}</h3>
                        <p>${esc(b.desc)}</p>
                      </article>
                    `
                      )
                      .join("")}
                  </div>
                  <div class="theater-sync-hint" aria-hidden="true">스크롤하거나 도식 구역을 탭하면 설명과 도식이 한 화면에서 함께 바뀝니다</div>
                </div>
              </div>
            </div>
          </section>
        `
            : ""
        }

        <!-- Zone 3: Scrollytelling Sections + Full 81-Subsection Deep Notes + 60 Spec Tables -->
        <div class="learn-layout">
          <aside class="toc-sidebar" aria-label="절 목차 탐색">
            <div class="toc-header">
              <span>${esc(ch.code)} 학습 목차</span>
              <span id="toc-progress-count">${ch.coreSections.filter((s) => state.readSections[s.id]).length}/${ch.coreSections.length}절 완료</span>
            </div>
            <nav class="toc-nav" id="chapter-toc-nav">
              <a href="#master-summary-ch${ch.chapter}"><span>★ 장 마스터 요약</span><span></span></a>
              <a href="#pinned-stage-ch${ch.chapter}"><span>◆ 스크롤 스토리 스테이지</span><span></span></a>
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
            ${ch.coreSections
              .map((sec) => {
                const isDone = Boolean(state.readSections[sec.id]);
                const cur = sec.curated || {};
                const subs = sec.subsections || [];
                return `
                <article class="sec-article" id="${esc(sec.id)}" tabindex="-1">
                  <div class="sec-top">
                    <div>
                      <span class="sec-num">SECTION ${esc(sec.secNo)}</span>
                      <h2 class="sec-title">${esc(sec.secNo)} ${esc(sec.title)}</h2>
                    </div>
                    <span class="sec-status-pill ${isDone ? "is-done" : ""}" data-sec-badge="${esc(sec.id)}">
                      ${isDone ? "✓ 학습 완료" : "학습 전"}
                    </span>
                  </div>

                  <div class="sec-takeaway">${esc(cur.heroTakeaway)}</div>

                  ${cur.sectionSummary ? `<div class="sec-synthesis-lead">${esc(cur.sectionSummary)}</div>` : ""}

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

                  <!-- Subsection Structured Deep Notes + Direct Spec Tables -->
                  <div class="subsec-study-stack">
                    ${subs
                      .map((sub) => {
                        const sn = sub.studyNote || {};
                        const dialogues = sn.clinicalDialogues || [];
                        const tables = sub.tables || [];
                        return `
                        <section class="subsec-card" aria-label="${esc(sub.subNo)} ${esc(sub.title)}">
                          <div class="subsec-head">
                            <h3>${esc(sub.subNo)} ${esc(sub.title)}</h3>
                            ${tables.length ? `<span class="concept-tag">표 ${tables.length}개 포함</span>` : ""}
                          </div>
                          ${sn.coreLead ? `<p class="subsec-lead">${sn.coreLead.html || esc(sn.coreLead.plain)}</p>` : ""}
                          ${
                            sn.keyPoints && sn.keyPoints.length
                              ? `<ul class="subsec-points">${sn.keyPoints
                                  .map((pt) => `<li>${pt.html || esc(pt.plain)}</li>`)
                                  .join("")}</ul>`
                              : ""
                          }
                          ${
                            sn.keyTerms && sn.keyTerms.length
                              ? `<div class="subsec-term-row">${sn.keyTerms
                                  .map((kt) => `<span class="term-chip">${esc(kt)}</span>`)
                                  .join("")}</div>`
                              : ""
                          }
                          ${
                            dialogues.length
                              ? `
                            <div class="clinical-dialogue-box">
                              <span class="clinical-dialogue-title">임상 사례 · 축어록 핵심 발췌</span>
                              ${dialogues.map((d) => `<p>${d.html || esc(d.plain)}</p>`).join("")}
                            </div>
                          `
                              : ""
                          }
                          ${tables.map((t) => `<div class="spec-table-card">${renderTableHtml(t)}</div>`).join("")}
                        </section>
                      `;
                      })
                      .join("")}
                  </div>

                  ${
                    cur.inlineWidgetId
                      ? `<section class="inline-viz-mount" data-sec-widget="${esc(cur.inlineWidgetId)}"></section>`
                      : ""
                  }

                  <details class="deep-drawer">
                    <summary>교재 원문 전체(${subs.length}개 소절) 및 참고 링크 원문 보기</summary>
                    <div class="deep-body">
                      ${(sec.introParagraphs || []).map((p) => `<p>${p.html || esc(p.plain)}</p>`).join("")}
                      ${subs
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
                  <footer class="sec-footer">
                    <button
                      type="button"
                      class="btn complete-btn ${isDone ? "is-done" : ""}"
                      data-toggle-read="${esc(sec.id)}"
                      aria-pressed="${isDone ? "true" : "false"}"
                    ><span aria-hidden="true">${isDone ? "✓" : "○"}</span> ${esc(sec.secNo)}절 학습 완료 체크</button>
                  </footer>
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

            <div class="flow-gate-card">
              <div>
                <span class="concept-tag" id="learn-gate-count" style="background:var(--accent-soft);color:var(--accent);margin-bottom:8px">${ch.coreSections.filter((s) => state.readSections[s.id]).length}/${ch.coreSections.length}절 학습 완료</span>
                <h3>${esc(ch.code)} 핵심 요약 학습을 마치셨나요?</h3>
                <p>각 절 하단에서 완료 체크를 마쳤다면 바로 제0${ch.chapter}장 객관식 연습문제로 이해도를 확인하고, 실상황 논술형으로 연결해 보세요.</p>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button type="button" class="btn btn-primary" id="cta-to-mcq">2단계: 제0${ch.chapter}장 객관식 풀러 가기 →</button>
                <button type="button" class="btn" id="cta-to-essay">3단계: 제0${ch.chapter}장 논술형 풀기 →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mount all section-level inline interactive widgets
    root.querySelectorAll("[data-sec-widget]").forEach((el) => {
      if (DIAGRAMS && typeof DIAGRAMS.renderSectionWidget === "function") {
        DIAGRAMS.renderSectionWidget(el, el.dataset.secWidget, ch);
      }
    });

    // Quick jump buttons inside Master Synthesis Panel
    root.querySelectorAll("[data-jump-pillar-sec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.jumpPillarSec);
        if (window.ScrollyEngine) window.ScrollyEngine.scrollToElement(target);
        else if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    function syncSectionUi(secId, done) {
      const sec = ch.coreSections.find((s) => s.id === secId);
      const secNo = sec ? sec.secNo : "";
      const badge = root.querySelector(`[data-sec-badge="${secId}"]`);
      if (badge) {
        badge.classList.toggle("is-done", done);
        badge.textContent = done ? "✓ 학습 완료" : "학습 전";
      }
      const toggleBtn = root.querySelector(`[data-toggle-read="${secId}"]`);
      if (toggleBtn) {
        toggleBtn.classList.toggle("is-done", done);
        toggleBtn.setAttribute("aria-pressed", done ? "true" : "false");
        toggleBtn.innerHTML = `<span aria-hidden="true">${done ? "✓" : "○"}</span> ${esc(secNo)}절 학습 완료 체크`;
      }
      const tocItem = root.querySelector(`[data-toc-for="${secId}"] .toc-check`);
      if (tocItem) tocItem.textContent = done ? "✓" : "";
      const doneCount = ch.coreSections.filter((s) => STORE.getState().readSections[s.id]).length;
      const cntEl = root.querySelector("#toc-progress-count");
      if (cntEl) cntEl.textContent = `${doneCount}/${ch.coreSections.length}절 완료`;
      const gateCntEl = root.querySelector("#learn-gate-count");
      if (gateCntEl) gateCntEl.textContent = `${doneCount}/${ch.coreSections.length}절 학습 완료`;
      if (window.ScrollyEngine) window.ScrollyEngine.syncSectionPillDone(ch);
    }

    // Toggle read button listeners
    root.querySelectorAll("[data-toggle-read]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const secId = btn.dataset.toggleRead;
        const done = STORE.toggleSectionRead(secId);
        syncSectionUi(secId, done);
      });
    });

    root.querySelector("#cta-to-mcq").addEventListener("click", () => navigate({ view: "chapter", chapter: ch.chapter, mode: "mcq" }));
    root.querySelector("#cta-to-essay").addEventListener("click", () => navigate({ view: "chapter", chapter: ch.chapter, mode: "essay" }));

    setupScrollspy(root, ch);
    if (window.ScrollyEngine) window.ScrollyEngine.mountChapterLearn(root, ch);
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

  /* ---------- Shared Flow / Question / Essay Rendering Helpers ---------- */
  function renderFlowGateHtml({ badgeText, title, desc, buttonsHtml, isExamCallout }) {
    return `
      <div class="flow-gate-card ${isExamCallout ? "is-exam-callout" : ""}">
        <div>
          ${
            badgeText
              ? `<span class="concept-tag" style="background:var(--accent-soft);color:var(--accent);margin-bottom:8px">${esc(badgeText)}</span>`
              : ""
          }
          <h3>${esc(title)}</h3>
          <p>${desc}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${buttonsHtml}
        </div>
      </div>
    `;
  }

  function renderMcqFilterPillsHtml(activeFilter, scopedCount) {
    const filters = [
      { id: "all", label: `전체 (${scopedCount})` },
      { id: "unanswered", label: "미풀이" },
      { id: "wrong", label: "오답만 모아보기" },
      { id: "bookmarked", label: "★ 오답/북마크" },
    ];
    return `
      <div class="diag-pill-row">
        ${filters
          .map(
            (f) =>
              `<button type="button" class="diag-chip ${activeFilter === f.id ? "is-active" : ""}" data-mcq-filter="${f.id}">${f.label}</button>`
          )
          .join("")}
        <button type="button" class="diag-chip" id="mcq-import-cta" style="border-style:dashed;color:var(--accent)">＋ 제미나이 .txt 문제팩 추가</button>
      </div>
    `;
  }

  function renderMcqCardsHtml(filtered, answersMap, bookmarksMap, options = {}) {
    if (!filtered.length) {
      return (
        options.emptyHtml ||
        `<div class="sec-article"><p style="margin:0;color:var(--text-muted)">선택한 조건에 해당하는 문항이 없습니다. 위 필터를 변경하거나 새 Gemini 문제팩을 불러와 보세요.</p></div>`
      );
    }
    return filtered
      .map((q) => {
        const rec = answersMap[q.id];
        const isBm = Boolean(bookmarksMap[q.id]);
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
      .join("");
  }

  function renderShortAnswerSectionHtml(shortAnswers, checkedMap, eyebrowText, titleText) {
    if (!shortAnswers || !shortAnswers.length) return "";
    return `
      <section class="sec-article" style="margin-top:24px">
        <span class="sec-num">${esc(eyebrowText)}</span>
        <h2 class="sec-title">${esc(titleText)}</h2>
        <div class="diag-grid-2">
          ${shortAnswers
            .map((sa) => {
              const checked = Boolean(checkedMap[sa.id]);
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
    `;
  }

  function bindMcqCardActions(root, { allMcqs, onPick, onBookmark, onToggleSa }) {
    root.querySelectorAll("[data-pick-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qId = btn.dataset.pickQ;
        const opt = parseInt(btn.dataset.pickOpt, 10);
        const q = allMcqs.find((x) => x.id === qId);
        if (q) onPick(qId, opt, q);
      });
    });
    root.querySelectorAll("[data-bm-q]").forEach((btn) => {
      btn.addEventListener("click", () => onBookmark(btn.dataset.bmQ));
    });
    root.querySelectorAll("[data-toggle-sa]").forEach((btn) => {
      btn.addEventListener("click", () => onToggleSa(btn.dataset.toggleSa));
    });
  }

  function calcEssayKeywordHits(essay, text) {
    const lower = (text || "").replace(/\s+/g, "").toLowerCase();
    return (essay.keywords || []).map((kw) => ({
      kw,
      hit: kw.replace(/\s+/g, "").length >= 2 && lower.includes(kw.replace(/\s+/g, "").toLowerCase()),
    }));
  }

  function renderEssayShellHtml({ scopedEssays, activeEssay, draft, getDraft, emptyHtml }) {
    if (!activeEssay) {
      return emptyHtml || `<div class="sec-article"><p style="margin:0;color:var(--text-muted)">이 범위에 등록된 논술형 문항이 없습니다.</p></div>`;
    }
    const composed = getComposedEssayText(draft);
    return `
      <div class="essay-split">
        <div class="essay-list">
          ${scopedEssays
            .map((e) => {
              const d = getDraft(e.id);
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
              ${calcEssayKeywordHits(activeEssay, composed)
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
    `;
  }

  function bindEssayShell(root, { activeEssay, draft, getDraft, updateDraft, onPickEssay, onRerender }) {
    root.querySelectorAll("[data-pick-essay]").forEach((b) =>
      b.addEventListener("click", () => onPickEssay(b.dataset.pickEssay))
    );
    if (!activeEssay) return;

    root.querySelectorAll("[data-ed-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        const nextMode = b.dataset.edMode;
        if (nextMode === "unified" && !draft.unifiedText && draft.mode === "scaffold") {
          updateDraft(activeEssay.id, { mode: nextMode, unifiedText: getComposedEssayText(draft) });
        } else {
          updateDraft(activeEssay.id, { mode: nextMode });
        }
        onRerender();
      })
    );

    function handleDraftInput(patchFn) {
      window.clearTimeout(essayDebounceTimer);
      essayDebounceTimer = window.setTimeout(() => {
        const updated = updateDraft(activeEssay.id, patchFn());
        const nextTxt = getComposedEssayText(updated);
        const charEl = root.querySelector("#essay-char-stat");
        if (charEl) charEl.textContent = `현재 ${nextTxt.length}자 (자동 저장됨)`;
        const cmpEl = root.querySelector("#compare-my-answer");
        if (cmpEl) cmpEl.textContent = nextTxt || "(아직 작성된 내용이 없습니다)";
        const kwStrip = root.querySelector("#essay-kw-strip");
        if (kwStrip) {
          kwStrip.innerHTML = calcEssayKeywordHits(activeEssay, nextTxt)
            .map((k) => `<span class="kw-pill ${k.hit ? "is-hit" : ""}">${k.hit ? "✓ " : ""}${esc(k.kw)}</span>`)
            .join("");
        }
      }, 300);
    }

    root.querySelectorAll("[data-scaf-field]").forEach((ta) => {
      ta.addEventListener("input", () => {
        const field = ta.dataset.scafField;
        handleDraftInput(() => {
          const cur = getDraft(activeEssay.id).scaffold || {};
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
        const curChecks = Object.assign({}, getDraft(activeEssay.id).rubricChecks || {});
        curChecks[cb.dataset.rubricIdx] = cb.checked;
        updateDraft(activeEssay.id, {
          rubricChecks: curChecks,
          submittedAt: new Date().toISOString(),
        });
      });
    });
  }

  /* ---------- Mode 2: Multiple-Choice Quiz Arena (Chapter Scoped) ---------- */
  function renderMcqMode(root, ch) {
    const packs = getAllPacks();
    const pack = getActivePack();
    const mcqState = STORE.getPackMcqState(pack.id);
    const chRound = STORE.getChapterMcqRound(pack.id, ch.chapter);
    const allMcqs = pack.mcqs || [];
    const scoped = allMcqs.filter((q) => q.chapter === ch.chapter);
    const chapterIds = scoped.map((q) => q.id);

    const filtered = scoped.filter((q) => {
      const ans = mcqState.answers[q.id];
      if (ui.mcqFilter === "unanswered") return !ans;
      if (ui.mcqFilter === "wrong") return ans && !ans.correct;
      if (ui.mcqFilter === "bookmarked") return Boolean(mcqState.bookmarks[q.id]);
      return true;
    });

    const attemptedCount = scoped.filter((q) => mcqState.answers[q.id]).length;
    const correctCount = scoped.filter((q) => mcqState.answers[q.id] && mcqState.answers[q.id].correct).length;
    const chShortAnswers = (pack.shortAnswers || []).filter((sa) => sa.chapter === ch.chapter);
    const nextCh = DATA.chapters.find((c) => c.chapter === ch.chapter + 1);

    const emptyPackHtml = `
      <div class="sec-article">
        <p style="margin:0;color:var(--text-muted)">현재 활성 문제팩(<strong>${esc(pack.name)}</strong>)에는 제0${ch.chapter}장 객관식 문항이 없습니다.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          ${pack.id !== DATA.defaultPack.id ? `<button type="button" class="btn btn-sm" id="mcq-fallback-default">기본 문제팩으로 전환</button>` : ""}
          <button type="button" class="btn btn-sm btn-primary" id="mcq-fallback-exam">★ 상권 통합 연습에서 전체 문항 풀기 →</button>
        </div>
      </div>
    `;

    root.innerHTML = `
      <div class="toolbar-card">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <label style="font-size:0.84rem;font-weight:700">문제팩:
            <select id="mcq-pack-sel" class="btn btn-sm" style="margin-left:6px">
              ${packs.map((p) => `<option value="${esc(p.id)}" ${p.id === pack.id ? "selected" : ""}>${esc(p.name)} (${(p.mcqs || []).length}문항)</option>`).join("")}
            </select>
          </label>
          <span class="concept-tag">제0${ch.chapter}장 확인 객관식 (${scoped.length}문항)</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span class="concept-tag" style="background:var(--accent-soft);color:var(--accent)">제0${ch.chapter}장 ${chRound}회차 · ${correctCount}/${attemptedCount} 정답</span>
          <button type="button" class="btn btn-sm" id="mcq-retry-wrong">제0${ch.chapter}장 오답만 다시 풀기</button>
          <button type="button" class="btn btn-sm btn-primary" id="mcq-retry-all">제0${ch.chapter}장 새 회차</button>
        </div>
      </div>

      ${renderMcqFilterPillsHtml(ui.mcqFilter, scoped.length)}

      ${scoped.length === 0 ? emptyPackHtml : renderMcqCardsHtml(filtered, mcqState.answers, mcqState.bookmarks)}

      ${renderShortAnswerSectionHtml(
        chShortAnswers,
        STORE.getState().shortAnswerChecked,
        `BONUS · 제0${ch.chapter}장 단답형 자가점검 카드 (${chShortAnswers.length}문항)`,
        "이론 핵심 구인 인출 연습 (표 5-25)"
      )}

      ${renderFlowGateHtml({
        badgeText: `제0${ch.chapter}장 객관식 · ${correctCount}/${scoped.length} 풀이`,
        title: `제0${ch.chapter}장 객관식 확인을 마치셨나요?`,
        desc: `이제 사례 기반 <strong>실상황 논술형(3단계)</strong>에서 이론과 법령을 직접 적용해 보세요.`,
        buttonsHtml: `
          <button type="button" class="btn btn-primary" id="mcq-to-essay">3단계: 제0${ch.chapter}장 실상황 논술 풀기 →</button>
          ${
            nextCh
              ? `<button type="button" class="btn" id="mcq-to-next-ch">다음 제0${nextCh.chapter}장 학습하기 →</button>`
              : `<button type="button" class="btn" id="mcq-to-exam">★ 상권 통합 연습 바로 가기 →</button>`
          }
        `,
      })}
    `;

    root.querySelector("#mcq-pack-sel").addEventListener("change", (e) => {
      STORE.setActivePack(e.target.value);
      renderApp();
    });
    root.querySelectorAll("[data-mcq-filter]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.mcqFilter = b.dataset.mcqFilter;
        renderMcqMode(root, ch);
      })
    );
    root.querySelector("#mcq-import-cta").addEventListener("click", () => openGeminiModal());
    root.querySelector("#mcq-retry-wrong").addEventListener("click", () => {
      STORE.resetChapterMcq(pack.id, ch.chapter, chapterIds, true);
      ui.mcqFilter = "unanswered";
      renderMcqMode(root, ch);
    });
    root.querySelector("#mcq-retry-all").addEventListener("click", () => {
      STORE.resetChapterMcq(pack.id, ch.chapter, chapterIds, false);
      ui.mcqFilter = "all";
      renderMcqMode(root, ch);
    });

    bindMcqCardActions(root, {
      allMcqs: scoped,
      onPick: (qId, opt, q) => {
        STORE.recordMcqAnswer(pack.id, qId, opt, q.answer);
        renderMcqMode(root, ch);
      },
      onBookmark: (qId) => {
        STORE.toggleBookmark(pack.id, qId);
        renderMcqMode(root, ch);
      },
      onToggleSa: (saId) => {
        STORE.toggleShortAnswer(saId);
        renderMcqMode(root, ch);
      },
    });

    const fallbackDef = root.querySelector("#mcq-fallback-default");
    if (fallbackDef) {
      fallbackDef.addEventListener("click", () => {
        STORE.setActivePack(DATA.defaultPack.id);
        renderApp();
      });
    }
    const fallbackExam = root.querySelector("#mcq-fallback-exam");
    if (fallbackExam) {
      fallbackExam.addEventListener("click", () => navigate({ view: "exam", examTab: "mcq" }));
    }
    root.querySelector("#mcq-to-essay").addEventListener("click", () => navigate({ view: "chapter", chapter: ch.chapter, mode: "essay" }));
    const nextChBtn = root.querySelector("#mcq-to-next-ch");
    if (nextChBtn && nextCh) {
      nextChBtn.addEventListener("click", () => navigate({ view: "chapter", chapter: nextCh.chapter, mode: "learn" }));
    }
    const toExamBtn = root.querySelector("#mcq-to-exam");
    if (toExamBtn) {
      toExamBtn.addEventListener("click", () => navigate({ view: "exam", examTab: "mcq" }));
    }
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
    const scoped = allEssays.filter((e) => e.chapter === ch.chapter);
    let activeEssay = scoped.find((e) => e.id === ui.selectedEssayId) || scoped[0] || null;
    if (activeEssay) ui.selectedEssayId = activeEssay.id;

    const draft = activeEssay ? STORE.getEssayDraft(pack.id, activeEssay.id) : null;
    const nextCh = DATA.chapters.find((c) => c.chapter === ch.chapter + 1);

    const emptyPackHtml = `
      <div class="sec-article">
        <p style="margin:0;color:var(--text-muted)">현재 활성 문제팩(<strong>${esc(pack.name)}</strong>)에는 제0${ch.chapter}장 논술형 문항이 없습니다.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          ${pack.id !== DATA.defaultPack.id ? `<button type="button" class="btn btn-sm" id="essay-fallback-default">기본 문제팩으로 전환</button>` : ""}
          <button type="button" class="btn btn-sm btn-primary" id="essay-fallback-exam">★ 상권 통합 연습에서 전체 논술 보기 →</button>
        </div>
      </div>
    `;

    root.innerHTML = `
      <div class="toolbar-card">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <label style="font-size:0.84rem;font-weight:700">문제팩:
            <select id="essay-pack-sel" class="btn btn-sm" style="margin-left:6px">
              ${packs.map((p) => `<option value="${esc(p.id)}" ${p.id === pack.id ? "selected" : ""}>${esc(p.name)} (${(p.essays || []).length}문항)</option>`).join("")}
            </select>
          </label>
          <span class="concept-tag">제0${ch.chapter}장 실상황 논술 (${scoped.length}문항)</span>
        </div>
        <button type="button" class="btn btn-sm" id="essay-import-cta">＋ 제미나이 .txt 논술 문항 추가</button>
      </div>

      ${renderEssayShellHtml({
        scopedEssays: scoped,
        activeEssay,
        draft,
        getDraft: (id) => STORE.getEssayDraft(pack.id, id),
        emptyHtml: emptyPackHtml,
      })}

      ${
        nextCh
          ? renderFlowGateHtml({
              badgeText: `제0${ch.chapter}장 학습 사이클 완주`,
              title: `제0${ch.chapter}장의 요약·객관식·논술형 학습을 마쳤습니다!`,
              desc: `다음 장으로 넘어가 <strong>제0${nextCh.chapter}장 ${esc(nextCh.title)}</strong> 요약 학습을 시작하거나, 상권 통합 연습을 미리 살펴보세요.`,
              buttonsHtml: `
                <button type="button" class="btn btn-primary" id="essay-to-next-ch">다음 제0${nextCh.chapter}장 요약 학습하기 →</button>
                <button type="button" class="btn" id="essay-to-exam">★ 상권 통합 연습 보기</button>
              `,
            })
          : renderFlowGateHtml({
              badgeText: "상권 01~06장 전 단원 완주",
              title: "🎉 상권 마지막 제06장까지 모든 장 학습을 마쳤습니다!",
              desc: `이제 장별 풀이 기록과 분리된 새 환경에서 <strong>상권 전체 객관식·논술형 통합 실전 연습</strong>을 순서대로 또는 무작위로 풀어보세요.`,
              buttonsHtml: `
                <button type="button" class="btn btn-primary" id="essay-to-exam">★ 상권 통합 연습 시작하기 →</button>
                <button type="button" class="btn" id="essay-to-home">진도표 홈에서 전체 숙달도 보기</button>
              `,
              isExamCallout: true,
            })
      }
    `;

    root.querySelector("#essay-pack-sel").addEventListener("change", (e) => {
      STORE.setActivePack(e.target.value);
      ui.selectedEssayId = null;
      renderApp();
    });
    root.querySelector("#essay-import-cta").addEventListener("click", () => openGeminiModal());

    const fallbackDef = root.querySelector("#essay-fallback-default");
    if (fallbackDef) {
      fallbackDef.addEventListener("click", () => {
        STORE.setActivePack(DATA.defaultPack.id);
        ui.selectedEssayId = null;
        renderApp();
      });
    }
    const fallbackExam = root.querySelector("#essay-fallback-exam");
    if (fallbackExam) {
      fallbackExam.addEventListener("click", () => navigate({ view: "exam", examTab: "essay" }));
    }
    const nextChBtn = root.querySelector("#essay-to-next-ch");
    if (nextChBtn && nextCh) {
      nextChBtn.addEventListener("click", () => navigate({ view: "chapter", chapter: nextCh.chapter, mode: "learn" }));
    }
    const toExamBtn = root.querySelector("#essay-to-exam");
    if (toExamBtn) {
      toExamBtn.addEventListener("click", () => navigate({ view: "exam", examTab: "mcq" }));
    }
    const toHomeBtn = root.querySelector("#essay-to-home");
    if (toHomeBtn) {
      toHomeBtn.addEventListener("click", () => navigate({ view: "dashboard" }));
    }

    bindEssayShell(root, {
      activeEssay,
      draft,
      getDraft: (id) => STORE.getEssayDraft(pack.id, id),
      updateDraft: (id, patch) => STORE.updateEssayDraft(pack.id, id, patch),
      onPickEssay: (id) => {
        ui.selectedEssayId = id;
        renderEssayMode(root, ch);
      },
      onRerender: () => renderEssayMode(root, ch),
    });
  }

  /* ---------- Track 2: Full-Volume Integrated Practice Studio ---------- */
  function bindCommonExamHeader(root) {
    const sel = root.querySelector("#exam-pack-sel");
    if (sel) {
      sel.addEventListener("change", (e) => {
        STORE.setActivePack(e.target.value);
        ui.selectedExamEssayId = null;
        renderApp();
      });
    }
    const importBtn = root.querySelector("#exam-import-cta");
    if (importBtn) importBtn.addEventListener("click", () => openGeminiModal());
    const homeBtn = root.querySelector("#exam-to-home");
    if (homeBtn) homeBtn.addEventListener("click", () => navigate({ view: "dashboard" }));
  }

  function renderVolumeExam(root) {
    const packs = getAllPacks();
    const pack = getActivePack();
    const examState = STORE.getVolumeExamState(pack.id);
    const mcqState = STORE.getPackMcqState(pack.id);
    const allMcqs = pack.mcqs || [];
    const allMcqIds = allMcqs.map((q) => q.id);
    const allEssays = pack.essays || [];

    const packHeaderHtml = `
      <div class="toolbar-card">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <label style="font-size:0.84rem;font-weight:700">통합 연습 문제팩:
            <select id="exam-pack-sel" class="btn btn-sm" style="margin-left:6px">
              ${packs
                .map(
                  (p) =>
                    `<option value="${esc(p.id)}" ${p.id === pack.id ? "selected" : ""}>${esc(p.name)} (객관식 ${(p.mcqs || []).length} · 논술 ${(p.essays || []).length})</option>`
                )
                .join("")}
            </select>
          </label>
          <span class="concept-tag" style="background:var(--accent-soft);color:var(--accent)">장별 학습 진도와 독립 저장 · 백지/랜덤 반복 가능</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-sm" id="exam-import-cta">＋ 제미나이 .txt 문제팩 추가</button>
          <button type="button" class="btn btn-sm" id="exam-to-home">진도표 홈</button>
        </div>
      </div>
    `;

    if (ui.examTab === "essay") {
      const scopedEssays =
        ui.examEssayChapter === 0 ? allEssays : allEssays.filter((e) => e.chapter === ui.examEssayChapter);
      let activeEssay = scopedEssays.find((e) => e.id === ui.selectedExamEssayId) || scopedEssays[0] || null;
      if (activeEssay) ui.selectedExamEssayId = activeEssay.id;
      const draft = activeEssay ? STORE.getVolumeExamEssayDraft(pack.id, activeEssay.id) : null;

      root.innerHTML = `
        ${packHeaderHtml}
        <div class="toolbar-card">
          <div class="diag-pill-row" style="margin:0">
            <button type="button" class="diag-chip ${ui.examEssayChapter === 0 ? "is-active" : ""}" data-exam-essay-ch="0">전체 (${allEssays.length})</button>
            ${DATA.chapters
              .map((c) => {
                const cnt = allEssays.filter((e) => e.chapter === c.chapter).length;
                return `<button type="button" class="diag-chip ${ui.examEssayChapter === c.chapter ? "is-active" : ""}" data-exam-essay-ch="${c.chapter}">${c.chapter}장 (${cnt})</button>`;
              })
              .join("")}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn btn-sm btn-primary" id="exam-random-essay-btn" ${
              scopedEssays.length === 0 ? "disabled" : ""
            }>🎲 무작위 사례 뽑기</button>
          </div>
        </div>

        ${renderEssayShellHtml({
          scopedEssays,
          activeEssay,
          draft,
          getDraft: (id) => STORE.getVolumeExamEssayDraft(pack.id, id),
          emptyHtml: `<div class="sec-article"><p style="margin:0;color:var(--text-muted)">선택한 조건에 해당하는 통합 논술 문항이 없습니다. 전체 필터를 선택하거나 새 Gemini 문제팩을 추가해 보세요.</p></div>`,
        })}

        ${renderFlowGateHtml({
          badgeText: `통합 실전 논술 · ${scopedEssays.length}문항 범위`,
          title: "통합 논술 점검 후 단원별 성취 리포트를 확인해 보세요",
          desc: "장별 확인 풀이와 상권 통합 연습 정답률을 단원별로 나란히 비교해 취약한 장을 바로 찾아 복습할 수 있습니다.",
          buttonsHtml: `
            <button type="button" class="btn btn-primary" id="exam-goto-report">3. 단원별 성취 리포트 보기 →</button>
            <button type="button" class="btn" id="exam-goto-mcq">1. 통합 객관식 실전으로</button>
          `,
        })}
      `;

      bindCommonExamHeader(root);
      root.querySelectorAll("[data-exam-essay-ch]").forEach((b) =>
        b.addEventListener("click", () => {
          ui.examEssayChapter = parseInt(b.dataset.examEssayCh, 10) || 0;
          ui.selectedExamEssayId = null;
          renderVolumeExam(root);
        })
      );
      const randBtn = root.querySelector("#exam-random-essay-btn");
      if (randBtn && scopedEssays.length > 0) {
        randBtn.addEventListener("click", () => {
          const pool =
            scopedEssays.length > 1 && activeEssay
              ? scopedEssays.filter((e) => e.id !== activeEssay.id)
              : scopedEssays;
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (pick) {
            ui.selectedExamEssayId = pick.id;
            renderVolumeExam(root);
          }
        });
      }
      root.querySelector("#exam-goto-report").addEventListener("click", () => navigate({ view: "exam", examTab: "report" }));
      root.querySelector("#exam-goto-mcq").addEventListener("click", () => navigate({ view: "exam", examTab: "mcq" }));

      bindEssayShell(root, {
        activeEssay,
        draft,
        getDraft: (id) => STORE.getVolumeExamEssayDraft(pack.id, id),
        updateDraft: (id, patch) => STORE.updateVolumeExamEssayDraft(pack.id, id, patch),
        onPickEssay: (id) => {
          ui.selectedExamEssayId = id;
          renderVolumeExam(root);
        },
        onRerender: () => renderVolumeExam(root),
      });
      return;
    }

    if (ui.examTab === "report") {
      const m = computeMetrics();
      root.innerHTML = `
        ${packHeaderHtml}
        <section class="kpi-bento" style="margin-top:0" aria-label="장별 대 통합 성취 비교">
          <div class="kpi-card">
            ${renderProgressRingHtml(m.readPct, "요약 완독률", "#0071e3")}
            <div class="kpi-text">
              <h4>전 범위 요약 완독</h4>
              <div class="kpi-val">${m.readCount} / ${m.totalSections}절</div>
              <div class="kpi-sub">각 절 하단 완료 체크 누적</div>
            </div>
          </div>
          <div class="kpi-card">
            ${renderProgressRingHtml(m.mcqAccuracy, "장별 객관식 정답률", "#5e5ce6")}
            <div class="kpi-text">
              <h4>장 마무리 객관식 누적</h4>
              <div class="kpi-val">${m.mcqCorrect} / ${m.mcqAttempted} <small style="color:var(--text-muted)">(${m.mcqAccuracy}%)</small></div>
              <div class="kpi-sub">단원 학습 직후 확인 풀이</div>
            </div>
          </div>
          <div class="kpi-card">
            ${renderProgressRingHtml(m.examAccuracy, "통합 실전 정답률", "#bf5a00")}
            <div class="kpi-text">
              <h4>상권 통합 객관식 (${m.examRound}회차)</h4>
              <div class="kpi-val">${m.examCorrect} / ${m.examAttempted} <small style="color:var(--text-muted)">(${m.examAccuracy}%)</small></div>
              <div class="kpi-sub">전 범위 백지·무작위 실전</div>
            </div>
          </div>
          <div class="kpi-card">
            ${renderProgressRingHtml(m.essayTotal ? Math.round((m.examEssayDone / m.essayTotal) * 100) : 0, "통합 논술 작성률", "#008060")}
            <div class="kpi-text">
              <h4>통합 실상황 논술</h4>
              <div class="kpi-val">${m.examEssayDone} / ${m.essayTotal}문항</div>
              <div class="kpi-sub">장별 논술 완료: ${m.essayDone}/${m.essayTotal}문항</div>
            </div>
          </div>
        </section>

        <section class="sec-article">
          <span class="sec-num">CHAPTER-BY-CHAPTER COMPARISON</span>
          <h2 class="sec-title">단원별 장 학습 vs 상권 통합 실전 성취 리포트</h2>
          <p class="sec-summary">단원을 마친 직후에 풀었던 <strong>장별 확인 성적</strong>과 시간이 지난 뒤 전 범위를 섞어 다시 푼 <strong>통합 실전 성적</strong>을 비교해 취약 단원을 바로 복습하세요.</p>
          <div class="table-scroll">
            <table class="study-table">
              <thead>
                <tr>
                  <th>단원</th>
                  <th>요약 완독</th>
                  <th>장 마무리 객관식</th>
                  <th>상권 통합 객관식</th>
                  <th>통합 실상황 논술</th>
                  <th>취약 단원 바로 복습</th>
                </tr>
              </thead>
              <tbody>
                ${m.byChapter
                  .map((c) => {
                    const chAcc = c.mcqAttempted ? Math.round((c.mcqCorrect / c.mcqAttempted) * 100) : 0;
                    const examWeak = c.examAttempted > 0 && c.examAccuracy < 70;
                    return `
                    <tr>
                      <td><strong>${esc(c.code)}</strong><br><small style="color:var(--text-muted)">${esc(c.title)}</small></td>
                      <td><strong>${c.readDone}/${c.readTotal}절</strong> (${c.readPct}%)</td>
                      <td>${c.mcqCorrect}/${c.mcqAttempted} <small style="color:var(--text-muted)">(총 ${c.mcqTotal}, ${chAcc}%)</small></td>
                      <td style="font-weight:700;color:${examWeak ? "var(--danger)" : "inherit"}">${c.examCorrect}/${c.examAttempted} <small>(총 ${c.mcqTotal}, ${c.examAccuracy}%)</small></td>
                      <td>${c.examEssayDone}/${c.essayTotal}문항</td>
                      <td>
                        <div style="display:flex;gap:6px;flex-wrap:wrap">
                          <button type="button" class="btn btn-sm" data-rep-ch="${c.chapter}" data-rep-mode="learn">요약</button>
                          <button type="button" class="btn btn-sm" data-rep-ch="${c.chapter}" data-rep-mode="mcq">장 객관식</button>
                        </div>
                      </td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>

        ${
          examState.roundHistory && examState.roundHistory.length
            ? `
          <section class="sec-article">
            <span class="sec-num">EXAM HISTORY</span>
            <h2 class="sec-title">상권 통합 객관식 회차 누적 기록 (${examState.roundHistory.length}회)</h2>
            <div class="table-scroll">
              <table class="study-table">
                <thead><tr><th>회차</th><th>기록 일시</th><th>점수</th><th>오답 문항 수</th></tr></thead>
                <tbody>
                  ${examState.roundHistory
                    .slice(0, 10)
                    .map(
                      (h) => `
                    <tr>
                      <td><strong>${h.round}회차</strong></td>
                      <td>${new Date(h.completedAt).toLocaleString("ko-KR")}</td>
                      <td><strong>${h.score} / ${h.attempted}</strong> (총 ${h.total}문항)</td>
                      <td>${(h.wrongIds || []).length}개</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </section>
        `
            : ""
        }

        ${renderFlowGateHtml({
          badgeText: "2-TRACK REVIEW LOOP",
          title: "틀렸던 통합 문항만 골라 다시 점검해 볼까요?",
          desc: "통합 객관식 실전으로 돌아가 오답만 모아 새 회차를 시작하거나 전 범위 무작위 출제에 재도전할 수 있습니다.",
          buttonsHtml: `
            <button type="button" class="btn btn-primary" id="report-to-mcq">1. 통합 객관식 실전 →</button>
            <button type="button" class="btn" id="report-to-essay">2. 통합 실상황 논술 →</button>
          `,
          isExamCallout: true,
        })}
      `;

      bindCommonExamHeader(root);
      root.querySelectorAll("[data-rep-ch]").forEach((b) =>
        b.addEventListener("click", () =>
          navigate({ view: "chapter", chapter: parseInt(b.dataset.repCh, 10), mode: b.dataset.repMode || "learn" })
        )
      );
      root.querySelector("#report-to-mcq").addEventListener("click", () => navigate({ view: "exam", examTab: "mcq" }));
      root.querySelector("#report-to-essay").addEventListener("click", () => navigate({ view: "exam", examTab: "essay" }));
      return;
    }

    // Default tab: examTab === "mcq"
    let orderedMcqs = allMcqs;
    if (examState.orderMode === "shuffle" && Array.isArray(examState.shuffledIds) && examState.shuffledIds.length) {
      const byId = new Map(allMcqs.map((q) => [q.id, q]));
      const seen = new Set();
      orderedMcqs = [];
      examState.shuffledIds.forEach((id) => {
        const item = byId.get(id);
        if (item && !seen.has(id)) {
          orderedMcqs.push(item);
          seen.add(id);
        }
      });
      allMcqs.forEach((item) => {
        if (!seen.has(item.id)) orderedMcqs.push(item);
      });
    }

    const filtered = orderedMcqs.filter((q) => {
      const ans = examState.answers[q.id];
      if (ui.examMcqFilter === "unanswered") return !ans;
      if (ui.examMcqFilter === "wrong") return ans && !ans.correct;
      if (ui.examMcqFilter === "bookmarked") return Boolean(mcqState.bookmarks[q.id]);
      return true;
    });

    const attemptedCount = allMcqs.filter((q) => examState.answers[q.id]).length;
    const correctCount = allMcqs.filter((q) => examState.answers[q.id] && examState.answers[q.id].correct).length;

    root.innerHTML = `
      ${packHeaderHtml}
      <div class="toolbar-card">
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span style="font-size:0.84rem;font-weight:700">출제 순서:</span>
          <div class="diag-pill-row" style="margin:0">
            <button type="button" class="diag-chip ${examState.orderMode !== "shuffle" ? "is-active" : ""}" data-exam-order="sequential">단원 순차 출제</button>
            <button type="button" class="diag-chip ${examState.orderMode === "shuffle" ? "is-active" : ""}" data-exam-order="shuffle">전 범위 무작위 섞기</button>
          </div>
          ${
            examState.orderMode === "shuffle"
              ? `<button type="button" class="btn btn-sm" id="exam-reshuffle-btn">🎲 순서 다시 섞기</button>`
              : ""
          }
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span class="concept-tag" style="background:var(--accent-soft);color:var(--accent)">통합 실전 ${examState.round}회차 · ${correctCount}/${attemptedCount} 정답 (총 ${allMcqs.length}문항)</span>
          <button type="button" class="btn btn-sm" id="exam-retry-wrong">통합 오답만 새 회차</button>
          <button type="button" class="btn btn-sm btn-primary" id="exam-retry-all">통합 전 범위 새 회차</button>
        </div>
      </div>

      ${renderMcqFilterPillsHtml(ui.examMcqFilter, allMcqs.length)}

      ${
        examState.roundHistory && examState.roundHistory.length
          ? `
        <details class="deep-drawer" style="margin-bottom:18px">
          <summary>이전 통합 실전 회차 기록 (${examState.roundHistory.length}회 완료)</summary>
          <div class="deep-body">
            ${examState.roundHistory
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

      ${renderMcqCardsHtml(filtered, examState.answers, mcqState.bookmarks)}

      ${renderShortAnswerSectionHtml(
        pack.shortAnswers || [],
        examState.shortAnswerChecked || {},
        `BONUS · 상권 통합 단답형 인출 카드 (${(pack.shortAnswers || []).length}문항)`,
        "이론 핵심 구인 통합 인출 연습 (장별 기록과 독립 체크)"
      )}

      ${renderFlowGateHtml({
        badgeText: `통합 실전 ${examState.round}회차 · ${correctCount}/${attemptedCount} 정답`,
        title: "통합 객관식 점검을 마치셨나요?",
        desc: "<strong>2. 통합 실상황 논술</strong>에서 전 단원 사례를 직접 작성해 보거나, <strong>3. 단원별 성취 리포트</strong>로 취약 단원을 진단하세요.",
        buttonsHtml: `
          <button type="button" class="btn btn-primary" id="exam-to-essay-tab">2. 통합 실상황 논술 →</button>
          <button type="button" class="btn" id="exam-to-report-tab">3. 단원별 성취 리포트 →</button>
        `,
        isExamCallout: true,
      })}
    `;

    bindCommonExamHeader(root);
    root.querySelectorAll("[data-exam-order]").forEach((b) =>
      b.addEventListener("click", () => {
        STORE.setVolumeExamOrder(pack.id, b.dataset.examOrder, allMcqIds, false);
        renderVolumeExam(root);
      })
    );
    const reshuffleBtn = root.querySelector("#exam-reshuffle-btn");
    if (reshuffleBtn) {
      reshuffleBtn.addEventListener("click", () => {
        STORE.setVolumeExamOrder(pack.id, "shuffle", allMcqIds, true);
        renderVolumeExam(root);
      });
    }
    root.querySelectorAll("[data-mcq-filter]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.examMcqFilter = b.dataset.mcqFilter;
        renderVolumeExam(root);
      })
    );
    root.querySelector("#mcq-import-cta").addEventListener("click", () => openGeminiModal());
    root.querySelector("#exam-retry-wrong").addEventListener("click", () => {
      STORE.startNewVolumeExamRound(pack.id, allMcqIds, true);
      ui.examMcqFilter = "unanswered";
      renderVolumeExam(root);
    });
    root.querySelector("#exam-retry-all").addEventListener("click", () => {
      STORE.startNewVolumeExamRound(pack.id, allMcqIds, false);
      ui.examMcqFilter = "all";
      renderVolumeExam(root);
    });

    bindMcqCardActions(root, {
      allMcqs,
      onPick: (qId, opt, q) => {
        STORE.recordVolumeExamMcq(pack.id, qId, opt, q.answer);
        renderVolumeExam(root);
      },
      onBookmark: (qId) => {
        STORE.toggleBookmark(pack.id, qId);
        renderVolumeExam(root);
      },
      onToggleSa: (saId) => {
        STORE.toggleVolumeShortAnswer(saId);
        renderVolumeExam(root);
      },
    });

    root.querySelector("#exam-to-essay-tab").addEventListener("click", () => navigate({ view: "exam", examTab: "essay" }));
    root.querySelector("#exam-to-report-tab").addEventListener("click", () => navigate({ view: "exam", examTab: "report" }));
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
    if (ui.view !== "chapter" && scrollspyObserver) {
      scrollspyObserver.disconnect();
      scrollspyObserver = null;
    }
    if (!(ui.view === "chapter" && ui.mode === "learn") && window.ScrollyEngine) {
      window.ScrollyEngine.teardown();
    }
    if (ui.view === "dashboard") {
      renderDashboard(root);
    } else if (ui.view === "exam") {
      renderVolumeExam(root);
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
    if (window.ScrollyEngine) window.ScrollyEngine.initGlobalChrome();
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
    if (savedPos) {
      if (savedPos.chapter) ui.chapter = savedPos.chapter;
      if (savedPos.mode) ui.mode = savedPos.mode;
      if (savedPos.examTab) ui.examTab = savedPos.examTab;
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
