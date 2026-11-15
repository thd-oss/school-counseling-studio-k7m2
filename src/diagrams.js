/* ==========================================================================
   Chapter-specific Interactive Visualizers & Simulators (Ch01 - Ch06)
   Uses strict DOM builders + addEventListener (zero inline onclick).
   ========================================================================== */

(function () {
  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTabsShell(container, chapterObj, tabsSpec, onRenderTabBody) {
    const meta = chapterObj.meta;
    container.innerHTML = `
      <div class="diagram-studio">
        <div class="diagram-head">
          <span class="sec-num">${esc(chapterObj.code)} INTERACTIVE EXPLORER</span>
          <h2>${esc(meta.diagramTitle)}</h2>
          <p>${esc(meta.diagramSubtitle)}</p>
        </div>
        <div class="diag-tab-bar" role="tablist" aria-label="도식화 탐색기 탭">
          ${tabsSpec
            .map(
              (t, idx) =>
                `<button type="button" class="diag-tab-btn" role="tab" data-diag-tab="${esc(t.id)}" aria-selected="${
                  idx === 0 ? "true" : "false"
                }">${esc(t.label)}</button>`
            )
            .join("")}
        </div>
        <div class="diag-body" id="diag-body-${chapterObj.chapter}"></div>
      </div>
    `;

    const bodyEl = container.querySelector(`#diag-body-${chapterObj.chapter}`);
    const tabBtns = Array.from(container.querySelectorAll(".diag-tab-btn"));

    function activate(tabId) {
      tabBtns.forEach((b) => {
        b.setAttribute("aria-selected", b.dataset.diagTab === tabId ? "true" : "false");
      });
      onRenderTabBody(tabId, bodyEl);
    }

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => activate(btn.dataset.diagTab));
    });

    activate(tabsSpec[0].id);
  }

  function bindChipGroup(bodyEl, selector, initialId, renderFn) {
    const chips = Array.from(bodyEl.querySelectorAll(selector));
    function select(id) {
      chips.forEach((c) => c.classList.toggle("is-active", c.dataset.chip === id));
      renderFn(id);
    }
    chips.forEach((c) => c.addEventListener("click", () => select(c.dataset.chip)));
    select(initialId);
  }

  function renderCh1(container, ch) {
    const d = ch.diagrams;
    renderTabsShell(
      container,
      ch,
      [
        { id: "spectrum", label: "1. 조력 연속선 3축 스펙트럼" },
        { id: "wee", label: "2. Wee 3단계 안전망 · 훈육 분리" },
        { id: "timeline", label: "3. 한·미 학교상담 4기 타임라인" },
      ],
      (tabId, bodyEl) => {
        if (tabId === "spectrum") {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.spectrum
                .map((s) => `<button type="button" class="diag-chip" data-chip="${esc(s.id)}">${esc(s.dim)}</button>`)
                .join("")}
            </div>
            <div id="ch1-spec-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", d.spectrum[0].id, (id) => {
            const row = d.spectrum.find((x) => x.id === id);
            bodyEl.querySelector("#ch1-spec-out").innerHTML = `
              <div class="diag-grid-3">
                <div class="diag-card"><h4>생활지도 (Guidance)</h4><p>${esc(row.guidance)}</p></div>
                <div class="diag-card is-highlight"><h4>학교상담 (School Counseling)</h4><p>${esc(row.counseling)}</p></div>
                <div class="diag-card"><h4>심리치료 (Psychotherapy)</h4><p>${esc(row.therapy)}</p></div>
              </div>
            `;
          });
        } else if (tabId === "wee") {
          bodyEl.innerHTML = `
            <div class="diag-grid-3">
              ${d.weeTiers
                .map(
                  (w, i) => `
                <div class="diag-card ${i === 0 ? "is-highlight" : ""}">
                  <span class="bento-badge">Tier ${i + 1}</span>
                  <h4>${esc(w.tier)}</h4>
                  <p style="margin-bottom:8px;font-weight:600">${esc(w.scope)}</p>
                  <ul>${w.roles.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
                </div>`
                )
                .join("")}
            </div>
            <div class="diag-card is-good" style="margin-top:14px">
              <h4>핵심 경계 원칙 · 훈육·징계와 상담 역할의 엄격 분리</h4>
              <p>선도·징계 처분이나 학생부 통제 권한을 전문상담교사에게 맡기면 비자발적 학생의 자기개방과 신뢰 동맹이 파괴됩니다. 규율 책무는 학년부·생활안전부(교원)가, 심리적 안전지대와 회복 지원은 위(Wee) 클래스가 전담하는 상호 보완 분리가 필수입니다.</p>
            </div>
          `;
        } else {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.timeline
                .map((t, i) => `<button type="button" class="diag-chip" data-chip="t${i}">${esc(t.era)}</button>`)
                .join("")}
            </div>
            <div id="ch1-tl-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", "t0", (chipId) => {
            const item = d.timeline[parseInt(chipId.slice(1), 10)];
            bodyEl.querySelector("#ch1-tl-out").innerHTML = `
              <div class="diag-grid-2">
                <div class="diag-card">
                  <span class="bento-badge">미국 경로</span>
                  <h4>${esc(item.usYears)}</h4>
                  <p>${esc(item.usDesc)}</p>
                </div>
                <div class="diag-card is-highlight">
                  <span class="bento-badge">한국 경로</span>
                  <h4>${esc(item.krYears)}</h4>
                  <p>${esc(item.krDesc)}</p>
                </div>
              </div>
            `;
          });
        }
      }
    );
  }

  function renderCh2(container, ch) {
    const d = ch.diagrams;
    renderTabsShell(
      container,
      ch,
      [
        { id: "ages", label: "1. 학령별 6대 발달이론 통합 탐색기" },
        { id: "defenses", label: "2. 자아 방어기제 · 상담 개입 매트릭스" },
      ],
      (tabId, bodyEl) => {
        if (tabId === "ages") {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.stages
                .map((s) => `<button type="button" class="diag-chip" data-chip="${esc(s.id)}">${esc(s.label)}</button>`)
                .join("")}
            </div>
            <div id="ch2-age-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", d.stages[0].id, (id) => {
            const st = d.stages.find((x) => x.id === id);
            bodyEl.querySelector("#ch2-age-out").innerHTML = `
              <div class="diag-grid-3">
                <div class="diag-card"><h4>2.1 하비거스트 발달과업</h4><p>${esc(st.havighurst)}</p></div>
                <div class="diag-card"><h4>2.2 피아제 인지발달</h4><p>${esc(st.piaget)}</p></div>
                <div class="diag-card"><h4>2.3 비고츠키 ZPD · 사적언어</h4><p>${esc(st.vygotsky)}</p></div>
                <div class="diag-card"><h4>2.4 엘킨드 자아중심성</h4><p>${esc(st.elkind)}</p></div>
                <div class="diag-card"><h4>2.5 프로이트 심리성적 단계</h4><p>${esc(st.freud)}</p></div>
                <div class="diag-card"><h4>2.6 에릭슨 · 마샤 정체감</h4><p>${esc(st.erikson)}</p></div>
              </div>
              <div class="diag-card is-highlight" style="margin-top:14px">
                <h4>이 학령기 학생 맞춤 상담 실무 팁</h4>
                <p>${esc(st.counselingTip)}</p>
              </div>
            `;
          });
        } else {
          const levels = ["전체", "미성숙", "신경증적", "성숙한"];
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${levels
                .map((lv) => `<button type="button" class="diag-chip" data-chip="${esc(lv)}">${esc(lv)} 방어</button>`)
                .join("")}
            </div>
            <div id="ch2-def-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", "전체", (lv) => {
            const items = lv === "전체" ? d.defenses : d.defenses.filter((x) => x.level === lv);
            bodyEl.querySelector("#ch2-def-out").innerHTML = `
              <div class="diag-grid-2">
                ${items
                  .map(
                    (def) => `
                  <div class="diag-card ${def.level === "성숙한" ? "is-good" : ""}">
                    <span class="bento-badge">${esc(def.level)} 수준</span>
                    <h4>${esc(def.name)}</h4>
                    <p><strong>학교 발현:</strong> ${esc(def.schoolSign)}</p>
                    <p style="margin-top:8px"><strong>치료적 개입:</strong> ${esc(def.intervention)}</p>
                  </div>`
                  )
                  .join("")}
              </div>
            `;
          });
        }
      }
    );
  }

  function renderCh3(container, ch) {
    const d = ch.diagrams;
    renderTabsShell(
      container,
      ch,
      [
        { id: "tree", label: "1. 고위기 비밀보장 · 신고 의무 시뮬레이터" },
        { id: "tasks", label: "2. 적합 직무 vs 비상담 업무 판별기" },
        { id: "burnout", label: "3. 소진 · 공감피로 · 대리외상 3자 변별" },
      ],
      (tabId, bodyEl) => {
        if (tabId === "tree") {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.scenarios
                .map((sc) => `<button type="button" class="diag-chip" data-chip="${esc(sc.id)}">${esc(sc.badge)}</button>`)
                .join("")}
            </div>
            <div id="ch3-tree-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", d.scenarios[0].id, (id) => {
            const sc = d.scenarios.find((x) => x.id === id);
            bodyEl.querySelector("#ch3-tree-out").innerHTML = `
              <div class="diag-card is-highlight" style="margin-bottom:12px">
                <span class="bento-badge">${esc(sc.badge)}</span>
                <h4>딜레마 상황: ${esc(sc.title)}</h4>
                <p><strong>윤리 원칙 형량:</strong> ${esc(sc.principles)}</p>
                <p style="margin-top:4px"><strong>법·강령 근거:</strong> ${esc(sc.law)}</p>
              </div>
              <div class="diag-card">
                <h4>전문상담교사 표준 실행 프로토콜</h4>
                <ul>${sc.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
              </div>
            `;
          });
        } else if (tabId === "tasks") {
          bodyEl.innerHTML = `
            <p style="font-size:0.86rem;color:var(--text-muted);margin-top:0">각 업무 카드를 클릭해 ASCA(2023b) 및 교육부 매뉴얼 기준 적합 여부를 확인하세요.</p>
            <div class="diag-grid-2">
              ${d.tasks
                .map(
                  (t, i) => `
                <button type="button" class="diag-card" style="text-align:left;cursor:pointer" data-task-idx="${i}">
                  <h4>${esc(t.task)}</h4>
                  <p class="task-verdict" style="margin-top:6px;color:var(--accent);font-weight:700">클릭하여 적합성 판별하기 →</p>
                </button>`
                )
                .join("")}
            </div>
          `;
          bodyEl.querySelectorAll("[data-task-idx]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const item = d.tasks[parseInt(btn.dataset.taskIdx, 10)];
              btn.classList.remove("is-good", "is-bad");
              btn.classList.add(item.fit ? "is-good" : "is-bad");
              btn.querySelector(".task-verdict").textContent = `${item.fit ? "[적합 전문 직무]" : "[부적합 비상담 업무]"} ${item.reason}`;
            });
          });
        } else {
          bodyEl.innerHTML = `
            <div class="diag-grid-3">
              ${d.burnout
                .map(
                  (b) => `
                <div class="diag-card">
                  <span class="bento-badge">${esc(b.onset)}</span>
                  <h4>${esc(b.type)}</h4>
                  <p><strong>주요 원인:</strong> ${esc(b.cause)}</p>
                  <p style="margin-top:6px"><strong>핵심 징후:</strong> ${esc(b.core)}</p>
                  <p style="margin-top:6px"><strong>자기관리 처방:</strong> ${esc(b.remedy)}</p>
                </div>`
                )
                .join("")}
            </div>
          `;
        }
      }
    );
  }

  function renderCh4(container, ch) {
    const d = ch.diagrams;
    renderTabsShell(
      container,
      ch,
      [
        { id: "micro", label: "1. 미시상담기술 축어록 비교기" },
        { id: "sfbt", label: "2. 해결중심 SFBT 초등 vs 중등 발문기" },
        { id: "single", label: "3. 한국형 단회학생상담 45분 타임박스" },
      ],
      (tabId, bodyEl) => {
        if (tabId === "micro") {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.microskills
                .map((m, i) => `<button type="button" class="diag-chip" data-chip="m${i}">사례 ${i + 1}: ${esc(m.skill.split("+")[0])}</button>`)
                .join("")}
            </div>
            <div id="ch4-mic-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", "m0", (chipId) => {
            const m = d.microskills[parseInt(chipId.slice(1), 10)];
            bodyEl.querySelector("#ch4-mic-out").innerHTML = `
              <div class="diag-card is-highlight" style="margin-bottom:12px">
                <h4>학생 발화</h4>
                <p style="font-weight:600">${esc(m.case)}</p>
              </div>
              <div class="diag-grid-2">
                <div class="diag-card is-bad">
                  <h4>초임 교사의 흔한 오용</h4>
                  <p>${esc(m.wrong)}</p>
                </div>
                <div class="diag-card is-good">
                  <h4>치료적 미시기술 반응 (${esc(m.skill)})</h4>
                  <p>${esc(m.good)}</p>
                </div>
              </div>
            `;
          });
        } else if (tabId === "sfbt") {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.sfbt
                .map((s, i) => `<button type="button" class="diag-chip" data-chip="s${i}">${esc(s.tech)}</button>`)
                .join("")}
            </div>
            <div id="ch4-sfbt-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", "s0", (chipId) => {
            const s = d.sfbt[parseInt(chipId.slice(1), 10)];
            bodyEl.querySelector("#ch4-sfbt-out").innerHTML = `
              <div class="diag-grid-2">
                <div class="diag-card">
                  <span class="bento-badge">초등학생 · 구체적 시각화</span>
                  <h4>${esc(s.tech)}</h4>
                  <p>${esc(s.elem)}</p>
                </div>
                <div class="diag-card is-highlight">
                  <span class="bento-badge">중·고등학생 · 자율/맥락 중심</span>
                  <h4>${esc(s.tech)}</h4>
                  <p>${esc(s.sec)}</p>
                </div>
              </div>
            `;
          });
        } else {
          bodyEl.innerHTML = `
            <div class="diag-grid-2">
              ${d.singleSession
                .map(
                  (st) => `
                <div class="diag-card">
                  <span class="bento-badge">${esc(st.mins)}</span>
                  <h4>${esc(st.step)}</h4>
                  <p>${esc(st.desc)}</p>
                </div>`
                )
                .join("")}
            </div>
          `;
        }
      }
    );
  }

  function renderCh5(container, ch) {
    const d = ch.diagrams;
    renderTabsShell(
      container,
      ch,
      [
        { id: "lens", label: "1. 동일 사례, 9대 이론 렌즈 스위처" },
        { id: "compare", label: "2. 1:1 이론 정밀 비교기" },
        { id: "adler", label: "3. 아들러 그릇된 행동 4목표 진단기" },
      ],
      (tabId, bodyEl) => {
        if (tabId === "lens") {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.theories
                .map((t) => `<button type="button" class="diag-chip" data-chip="${esc(t.id)}">${esc(t.name)}</button>`)
                .join("")}
            </div>
            <div id="ch5-lens-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", d.theories[0].id, (id) => {
            const t = d.theories.find((x) => x.id === id);
            bodyEl.querySelector("#ch5-lens-out").innerHTML = `
              <div class="diag-grid-2">
                <div class="diag-card"><h4>인간관 및 핵심 원리</h4><p>${esc(t.human)}</p></div>
                <div class="diag-card"><h4>부적응 발생 기제</h4><p>${esc(t.cause)}</p></div>
                <div class="diag-card is-highlight"><h4>공통 사례(무기력·지각·교우갈등) 해석</h4><p>${esc(t.caseLens)}</p></div>
                <div class="diag-card is-good"><h4>대표 학교 개입 기법</h4><p>${esc(t.tech)}</p></div>
              </div>
            `;
          });
        } else if (tabId === "compare") {
          bodyEl.innerHTML = `
            <div class="diag-grid-2" style="margin-bottom:14px">
              <label style="font-size:0.85rem;font-weight:700">이론 A 선택
                <select id="cmp-a" class="btn" style="width:100%;margin-top:6px;border-radius:10px">
                  ${d.theories.map((t) => `<option value="${esc(t.id)}" ${t.id === "rebt" ? "selected" : ""}>${esc(t.name)}</option>`).join("")}
                </select>
              </label>
              <label style="font-size:0.85rem;font-weight:700">이론 B 선택
                <select id="cmp-b" class="btn" style="width:100%;margin-top:6px;border-radius:10px">
                  ${d.theories.map((t) => `<option value="${esc(t.id)}" ${t.id === "beck" ? "selected" : ""}>${esc(t.name)}</option>`).join("")}
                </select>
              </label>
            </div>
            <div id="ch5-cmp-out"></div>
          `;
          const selA = bodyEl.querySelector("#cmp-a");
          const selB = bodyEl.querySelector("#cmp-b");
          function drawCmp() {
            const a = d.theories.find((x) => x.id === selA.value);
            const b = d.theories.find((x) => x.id === selB.value);
            bodyEl.querySelector("#ch5-cmp-out").innerHTML = `
              <div class="table-scroll">
                <table class="study-table">
                  <thead><tr><th>비교 차원</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr></thead>
                  <tbody>
                    <tr><td><strong>인간관</strong></td><td>${esc(a.human)}</td><td>${esc(b.human)}</td></tr>
                    <tr><td><strong>부적응 기제</strong></td><td>${esc(a.cause)}</td><td>${esc(b.cause)}</td></tr>
                    <tr><td><strong>사례 해석 초점</strong></td><td>${esc(a.caseLens)}</td><td>${esc(b.caseLens)}</td></tr>
                    <tr><td><strong>핵심 개입 기법</strong></td><td>${esc(a.tech)}</td><td>${esc(b.tech)}</td></tr>
                  </tbody>
                </table>
              </div>
            `;
          }
          selA.addEventListener("change", drawCmp);
          selB.addEventListener("change", drawCmp);
          drawCmp();
        } else {
          bodyEl.innerHTML = `
            <p style="font-size:0.86rem;color:var(--text-muted);margin-top:0">학생의 문제행동을 볼 때 교사 자신에게 즉각 떠오르는 <strong>역전이 정서 단서</strong>를 선택해 보세요.</p>
            <div class="diag-pill-row">
              ${d.adlerGoals
                .map((g, i) => `<button type="button" class="diag-chip" data-chip="g${i}">${esc(g.cue.split("(")[0].trim())}</button>`)
                .join("")}
            </div>
            <div id="ch5-adl-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", "g0", (chipId) => {
            const g = d.adlerGoals[parseInt(chipId.slice(1), 10)];
            bodyEl.querySelector("#ch5-adl-out").innerHTML = `
              <div class="diag-grid-2">
                <div class="diag-card is-highlight">
                  <span class="bento-badge">교사 정서: ${esc(g.cue)}</span>
                  <h4>진단된 그릇된 목표: ${esc(g.goal)}</h4>
                  <p><strong>학생의 사적 논리:</strong> ${esc(g.childLogic)}</p>
                  <p style="margin-top:6px"><strong>훈육 시 전형적 반응:</strong> ${esc(g.reaction)}</p>
                </div>
                <div class="diag-card is-good">
                  <h4>아들러식 격려 & 논리적 결과 처방</h4>
                  <p>${esc(g.intervention)}</p>
                </div>
              </div>
            `;
          });
        }
      }
    );
  }

  function renderCh6(container, ch) {
    const d = ch.diagrams;
    renderTabsShell(
      container,
      ch,
      [
        { id: "yalom", label: "1. 얄롬 11대 치료적 요인 카드" },
        { id: "stages", label: "2. 거시 발달 4단계 · 과도기 개입" },
        { id: "praise", label: "3. 칭찬/처벌 → 격려/논리적 결과 변환기" },
      ],
      (tabId, bodyEl) => {
        if (tabId === "yalom") {
          bodyEl.innerHTML = `
            <div class="diag-grid-3">
              ${d.yalom11
                .map(
                  (y) => `
                <div class="diag-card">
                  <span class="bento-badge">요인 ${y.num}</span>
                  <h4>${esc(y.name)}</h4>
                  <p>${esc(y.desc)}</p>
                </div>`
                )
                .join("")}
            </div>
          `;
        } else if (tabId === "stages") {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.groupStages
                .map((s, i) => `<button type="button" class="diag-chip" data-chip="gs${i}">${esc(s.stage.split("(")[0].trim())}</button>`)
                .join("")}
            </div>
            <div id="ch6-st-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", "gs1", (chipId) => {
            const st = d.groupStages[parseInt(chipId.slice(2), 10)];
            bodyEl.querySelector("#ch6-st-out").innerHTML = `
              <div class="diag-grid-2">
                <div class="diag-card">
                  <span class="bento-badge">${esc(st.sessions)}</span>
                  <h4>${esc(st.stage)} · 집단원 역동</h4>
                  <p>${esc(st.dynamic)}</p>
                </div>
                <div class="diag-card is-highlight">
                  <h4>리더의 핵심 개입 전략</h4>
                  <p>${esc(st.leader)}</p>
                </div>
              </div>
            `;
          });
        } else {
          bodyEl.innerHTML = `
            <div class="diag-pill-row">
              ${d.praiseVsEnc
                .map((p, i) => `<button type="button" class="diag-chip" data-chip="pv${i}">${esc(p.type)}</button>`)
                .join("")}
            </div>
            <div id="ch6-pv-out"></div>
          `;
          bindChipGroup(bodyEl, "[data-chip]", "pv0", (chipId) => {
            const row = d.praiseVsEnc[parseInt(chipId.slice(2), 10)];
            bodyEl.querySelector("#ch6-pv-out").innerHTML = `
              <div class="diag-grid-2">
                <div class="diag-card is-bad">
                  <h4>외적 통제 (칭찬 / 처벌)</h4>
                  <p>${esc(row.control)}</p>
                </div>
                <div class="diag-card is-good">
                  <h4>민주적 성장 (아들러식 격려 / 논리적 결과)</h4>
                  <p>${esc(row.encouragement)}</p>
                </div>
              </div>
            `;
          });
        }
      }
    );
  }

  window.DiagramEngine = {
    renderChapterDiagram(container, chapterObj) {
      if (!container || !chapterObj) return;
      const map = {
        1: renderCh1,
        2: renderCh2,
        3: renderCh3,
        4: renderCh4,
        5: renderCh5,
        6: renderCh6,
      };
      const fn = map[chapterObj.chapter];
      if (fn) fn(container, chapterObj);
    },
  };
})();
