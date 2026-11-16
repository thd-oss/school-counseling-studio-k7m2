/* ==========================================================================
   Interactive Pinned Stage Vector Artifacts (Ch01-Ch06) &
   Section-Level Inline Visualizers (18 Widgets)
   Strict DOM construction + addEventListener (zero inline onclick).
   ========================================================================== */

(function () {
  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bindChipGroup(bodyEl, selector, initialId, renderFn) {
    const chips = Array.from(bodyEl.querySelectorAll(selector));
    if (!chips.length) return;
    function select(id) {
      chips.forEach((c) => {
        const active = c.dataset.chip === id;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", active ? "true" : "false");
      });
      renderFn(id);
    }
    chips.forEach((c) => c.addEventListener("click", () => select(c.dataset.chip)));
    select(initialId);
  }

  /* ==========================================================================
     PART 1. 6 Signature Sticky Pinned Stage SVG Engines (Ch01 - Ch06)
     Each returns { updateBeat(beatIdx, progress) } without rebuilding DOM.
     ========================================================================== */

  function mountCh1PinnedSvg(container) {
    container.innerHTML = `
      <svg viewBox="0 0 560 420" class="theater-svg" role="img" aria-label="제01장 학교상담 3층 안전망 및 훈육 분리 방화벽 도식">
        <defs>
          <radialGradient id="ch1Glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#2997ff" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#07090e" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="560" height="420" rx="20" fill="url(#ch1Glow)"/>

        <!-- Layer Tier 1 -->
        <g data-layer="0" style="transition:transform 420ms cubic-bezier(0.23,1,0.32,1),opacity 320ms ease">
          <ellipse cx="280" cy="215" rx="220" ry="145" fill="rgba(41,151,255,0.08)" stroke="#2997ff" stroke-width="2" stroke-dasharray="6 4"/>
          <text x="280" y="92" text-anchor="middle" fill="#7ec2ff" font-size="13" font-weight="800">TIER 1 · 생활지도 & 보편 예방 (전교생 100%)</text>
          <text x="280" y="346" text-anchor="middle" fill="#94a3b8" font-size="11.5">학급 교육과정 · 진로정보 · 사회정서 역량 계발</text>
        </g>

        <!-- Layer Tier 2 -->
        <g data-layer="1" style="transition:transform 420ms cubic-bezier(0.23,1,0.32,1),opacity 320ms ease">
          <ellipse cx="280" cy="215" rx="152" ry="96" fill="rgba(94,92,230,0.14)" stroke="#8e8cff" stroke-width="2.2"/>
          <text x="280" y="142" text-anchor="middle" fill="#c7c6ff" font-size="13" font-weight="800">TIER 2 · 학교상담 · 위(Wee) 클래스</text>
          <text x="280" y="294" text-anchor="middle" fill="#cbd5e1" font-size="11">지금-여기 적응 · 개인/소집단 조기개입 · 이중 동의</text>
        </g>

        <!-- Layer Tier 3 -->
        <g data-layer="2" style="transition:transform 420ms cubic-bezier(0.23,1,0.32,1),opacity 320ms ease">
          <ellipse cx="280" cy="215" rx="84" ry="52" fill="rgba(255,159,10,0.16)" stroke="#ff9f0a" stroke-width="2.4"/>
          <text x="280" y="210" text-anchor="middle" fill="#ffd48a" font-size="13" font-weight="800">TIER 3 · 심리치료</text>
          <text x="280" y="229" text-anchor="middle" fill="#ffedd5" font-size="11">Wee 센터 · 스쿨 · 의료 연계</text>
        </g>

        <!-- Beat 4 Firewall -->
        <g data-layer="3" style="transition:opacity 360ms ease,transform 360ms ease">
          <line x1="280" y1="30" x2="280" y2="390" stroke="#30d158" stroke-width="3" stroke-dasharray="7 5"/>
          <rect x="44" y="28" width="174" height="52" rx="12" fill="rgba(255,69,58,0.16)" stroke="#ff453a" stroke-width="1.6"/>
          <text x="131" y="50" text-anchor="middle" fill="#ff8e86" font-size="12" font-weight="800">생활안전부 · 선도위</text>
          <text x="131" y="68" text-anchor="middle" fill="#fecaca" font-size="10.5">사안 조사 · 징계 처분 전담</text>

          <rect x="342" y="28" width="174" height="52" rx="12" fill="rgba(48,209,88,0.18)" stroke="#30d158" stroke-width="1.6"/>
          <text x="429" y="50" text-anchor="middle" fill="#6ee7a0" font-size="12" font-weight="800">위(Wee) 클래스</text>
          <text x="429" y="68" text-anchor="middle" fill="#bbf7d0" font-size="10.5">비밀보장 안전지대 · 회복·자문</text>

          <rect x="192" y="366" width="176" height="32" rx="16" fill="#0d131f" stroke="#30d158" stroke-width="1.6"/>
          <text x="280" y="386" text-anchor="middle" fill="#6ee7a0" font-size="11.5" font-weight="800">훈육–상담 엄격 분리 방화벽</text>
        </g>
      </svg>
    `;
    const layers = [0, 1, 2, 3].map((i) => container.querySelector(`[data-layer="${i}"]`));
    return {
      updateBeat(beatIdx, progress) {
        const p = Math.max(0, Math.min(1, progress || 0));
        const splitShift = beatIdx === 0 ? 0 : beatIdx === 1 ? 8 : beatIdx === 2 ? 14 : 6;
        if (layers[0]) {
          layers[0].style.opacity = beatIdx === 0 ? "1" : "0.52";
          layers[0].style.transform = `translateY(${(-splitShift * (0.4 + p * 0.6)).toFixed(1)}px)`;
        }
        if (layers[1]) {
          layers[1].style.opacity = beatIdx === 1 ? "1" : beatIdx === 0 ? "0.45" : "0.65";
          layers[1].style.transform = `scale(${beatIdx === 1 ? 1.03 : 1})`;
        }
        if (layers[2]) {
          layers[2].style.opacity = beatIdx === 2 ? "1" : "0.55";
          layers[2].style.transform = `translateY(${(splitShift * 0.6).toFixed(1)}px)`;
        }
        if (layers[3]) {
          layers[3].style.opacity = beatIdx === 3 ? "1" : "0.14";
        }
      },
    };
  }

  function mountCh2PinnedSvg(container) {
    const scanXs = [105, 220, 345, 470];
    const stageLabels = [
      { age: "만 6~8세 (초저)", cog: "전조작 → 구체적 조작", zpd: "놀이·사적언어 비계", ego: "근면성 첫 숙달" },
      { age: "만 9~12세 (초고)", cog: "구체적 조작 안정", zpd: "내적 자기교시 내면화", ego: "또래·잠복기 승화" },
      { age: "만 13~15세 (중등)", cog: "형식적 조작 입문", zpd: "상상적 청중 · 개인적 우화 피크", ego: "변연계 >> 전두엽 격차!" },
      { age: "만 16~18세 (고등)", cog: "형식적 조작 정교화", zpd: "유실 vs 유예 정체감 탐색", ego: "전두엽 통합 · 성취" },
    ];
    container.innerHTML = `
      <svg viewBox="0 0 560 420" class="theater-svg" role="img" aria-label="제02장 만 6세에서 18세까지 변연계와 전두엽 성숙 및 6대 발달이론 동기화 그래프">
        <rect x="34" y="42" width="492" height="270" rx="16" fill="#0d111a" stroke="rgba(255,255,255,0.12)"/>
        <!-- Grid lines -->
        <line x1="60" y1="110" x2="500" y2="110" stroke="rgba(255,255,255,0.07)"/>
        <line x1="60" y1="180" x2="500" y2="180" stroke="rgba(255,255,255,0.07)"/>
        <line x1="60" y1="250" x2="500" y2="250" stroke="rgba(255,255,255,0.09)"/>

        <!-- Limbic Reactivity Curve (peaks sharply in early/mid adolescence) -->
        <path d="M 70 230 Q 170 210 250 140 T 355 86 Q 425 94 495 142" fill="none" stroke="#ff9f0a" stroke-width="3.2" stroke-linecap="round"/>
        <text x="355" y="72" text-anchor="middle" fill="#ffc46b" font-size="11.5" font-weight="800">변연계 정서 반응성</text>

        <!-- Prefrontal Control Curve (linear gradual rise through 18+) -->
        <path d="M 70 258 Q 200 232 340 184 T 495 104" fill="none" stroke="#2997ff" stroke-width="3.2" stroke-linecap="round"/>
        <text x="456" y="96" text-anchor="middle" fill="#7ec2ff" font-size="11.5" font-weight="800">전두엽 실행 통제</text>

        <!-- Shaded developmental gap highlight in middle school -->
        <path id="ch2-gap-band" d="M 285 110 Q 345 78 405 112 L 405 170 Q 345 186 285 205 Z" fill="rgba(255,69,58,0.16)" stroke="rgba(255,69,58,0.45)" stroke-dasharray="4 3"/>

        <!-- Age ticks -->
        <g fill="#94a3b8" font-size="11" font-weight="700" text-anchor="middle">
          <text x="105" y="294">6~8세 (초저)</text>
          <text x="220" y="294">9~12세 (초고)</text>
          <text x="345" y="294">13~15세 (중등)</text>
          <text x="470" y="294">16~18세 (고등)</text>
        </g>

        <!-- Dynamic Scanner Bar -->
        <g id="ch2-scanner" style="transition:transform 380ms cubic-bezier(0.23,1,0.32,1)">
          <line x1="0" y1="54" x2="0" y2="275" stroke="#30d158" stroke-width="2.5"/>
          <circle cx="0" cy="54" r="5" fill="#30d158"/>
        </g>

        <!-- Telemetry Footer Card inside SVG -->
        <rect x="34" y="328" width="492" height="68" rx="14" fill="rgba(41,151,255,0.10)" stroke="rgba(41,151,255,0.35)"/>
        <text id="ch2-tel-age" x="54" y="352" fill="#ffffff" font-size="13.5" font-weight="800"></text>
        <text id="ch2-tel-cog" x="54" y="376" fill="#7ec2ff" font-size="12" font-weight="600"></text>
        <text id="ch2-tel-zpd" x="506" y="352" text-anchor="end" fill="#6ee7a0" font-size="12" font-weight="800"></text>
        <text id="ch2-tel-ego" x="506" y="376" text-anchor="end" fill="#ffd48a" font-size="12" font-weight="700"></text>
      </svg>
    `;
    const scanner = container.querySelector("#ch2-scanner");
    const gapBand = container.querySelector("#ch2-gap-band");
    const tAge = container.querySelector("#ch2-tel-age");
    const tCog = container.querySelector("#ch2-tel-cog");
    const tZpd = container.querySelector("#ch2-tel-zpd");
    const tEgo = container.querySelector("#ch2-tel-ego");

    return {
      updateBeat(beatIdx) {
        const idx = Math.max(0, Math.min(3, beatIdx));
        const info = stageLabels[idx];
        if (scanner) scanner.style.transform = `translateX(${scanXs[idx]}px)`;
        if (gapBand) gapBand.style.opacity = idx === 2 ? "1" : "0.22";
        if (tAge) tAge.textContent = info.age;
        if (tCog) tCog.textContent = `인지: ${info.cog}`;
        if (tZpd) tZpd.textContent = `ZPD: ${info.zpd}`;
        if (tEgo) tEgo.textContent = info.ego;
      },
    };
  }

  function mountCh3PinnedSvg(container) {
    container.innerHTML = `
      <svg viewBox="0 0 560 420" class="theater-svg" role="img" aria-label="제03장 윤리 형량 저울 및 고위기 법적 신고 결정 회로">
        <!-- Node 1: Dual Consent -->
        <g data-c3="0" style="transition:opacity 300ms ease">
          <rect x="64" y="28" width="196" height="58" rx="12" fill="rgba(41,151,255,0.14)" stroke="#2997ff" stroke-width="2"/>
          <text x="162" y="52" text-anchor="middle" fill="#ffffff" font-size="12.5" font-weight="800">학생 승낙 (Assent)</text>
          <text x="162" y="71" text-anchor="middle" fill="#93c5fd" font-size="10.5">비밀보장 한계 발달 맞춤 사전고지</text>

          <rect x="300" y="28" width="196" height="58" rx="12" fill="rgba(41,151,255,0.14)" stroke="#2997ff" stroke-width="2"/>
          <text x="398" y="52" text-anchor="middle" fill="#ffffff" font-size="12.5" font-weight="800">법정대리인 사전동의</text>
          <text x="398" y="71" text-anchor="middle" fill="#93c5fd" font-size="10.5">이중 동의 · 교육적 협력 범위 합의</text>
          <path d="M 162 86 L 280 124 L 398 86" fill="none" stroke="#2997ff" stroke-width="2"/>
        </g>

        <!-- Node 2: Balance Scale (Kitchener Critical-Evaluative) -->
        <g data-c3="1" style="transition:opacity 300ms ease">
          <polygon points="280,124 268,162 292,162" fill="#64748b"/>
          <g id="c3-beam" style="transform-origin:280px 134px;transition:transform 450ms cubic-bezier(0.23,1,0.32,1)">
            <line x1="130" y1="134" x2="430" y2="134" stroke="#e2e8f0" stroke-width="3"/>
            <rect x="66" y="144" width="128" height="44" rx="10" fill="rgba(148,163,184,0.16)" stroke="#94a3b8"/>
            <text x="130" y="164" text-anchor="middle" fill="#e2e8f0" font-size="11.5" font-weight="700">자율성 · 충실</text>
            <text x="130" y="180" text-anchor="middle" fill="#94a3b8" font-size="10">(원칙적 비밀보장)</text>

            <rect x="366" y="144" width="128" height="44" rx="10" fill="rgba(255,69,58,0.22)" stroke="#ff453a" stroke-width="2"/>
            <text x="430" y="164" text-anchor="middle" fill="#fca5a5" font-size="11.5" font-weight="800">비유해성 최우선</text>
            <text x="430" y="180" text-anchor="middle" fill="#fecaca" font-size="10">(생명·신체 안전 수호)</text>
          </g>
        </g>

        <!-- Node 3: 3 Legal Immediate Actions -->
        <g data-c3="2" style="transition:opacity 300ms ease">
          <path d="M 430 190 L 430 220 M 430 220 L 106 244 M 430 220 L 280 244 M 430 220 L 454 244" fill="none" stroke="#ff9f0a" stroke-width="2"/>
          <rect x="30" y="244" width="152" height="72" rx="12" fill="rgba(255,69,58,0.14)" stroke="#ff453a" stroke-width="1.6"/>
          <text x="106" y="268" text-anchor="middle" fill="#ff9e96" font-size="12" font-weight="800">자살·자해 고위기</text>
          <text x="106" y="286" text-anchor="middle" fill="#fed7d7" font-size="10.5">홀로 방치 절대 금지</text>
          <text x="106" y="302" text-anchor="middle" fill="#fed7d7" font-size="10.5">보호자 대면 안전 인계</text>

          <rect x="204" y="244" width="152" height="72" rx="12" fill="rgba(255,159,10,0.14)" stroke="#ff9f0a" stroke-width="1.6"/>
          <text x="280" y="268" text-anchor="middle" fill="#ffd48a" font-size="12" font-weight="800">Tarasoff 타해 위험</text>
          <text x="280" y="286" text-anchor="middle" fill="#ffedd5" font-size="10.5">구체·식별·임박 시</text>
          <text x="280" y="302" text-anchor="middle" fill="#ffedd5" font-size="10.5">잠재피해자 경고·보호</text>

          <rect x="378" y="244" width="152" height="72" rx="12" fill="rgba(255,69,58,0.18)" stroke="#ff453a" stroke-width="1.8"/>
          <text x="454" y="268" text-anchor="middle" fill="#ff9e96" font-size="12" font-weight="800">아동학대·학폭 신고</text>
          <text x="454" y="286" text-anchor="middle" fill="#fed7d7" font-size="10.5">의심만으로 즉시 112</text>
          <text x="454" y="302" text-anchor="middle" fill="#fed7d7" font-size="10.5">교장 결재 지연 위법</text>
        </g>

        <!-- Node 4: Vault & Self-Care -->
        <g data-c3="3" style="transition:opacity 300ms ease">
          <rect x="52" y="336" width="456" height="58" rx="14" fill="rgba(48,209,88,0.14)" stroke="#30d158" stroke-width="1.8"/>
          <text x="280" y="361" text-anchor="middle" fill="#6ee7a0" font-size="12.5" font-weight="800">단독소유기록 분리 보관 + 최소 정보 공유 원칙</text>
          <text x="280" y="381" text-anchor="middle" fill="#d1fae5" font-size="11">소진(조직) · 공감피로(급성) · 대리외상(도식변형) 조기 변별 & 동료 수퍼비전</text>
        </g>
      </svg>
    `;
    const groups = [0, 1, 2, 3].map((i) => container.querySelector(`[data-c3="${i}"]`));
    const beam = container.querySelector("#c3-beam");
    return {
      updateBeat(beatIdx) {
        groups.forEach((g, i) => {
          if (g) g.style.opacity = i === beatIdx ? "1" : i < beatIdx ? "0.62" : "0.28";
        });
        if (beam) {
          beam.style.transform = beatIdx >= 1 ? "rotate(8deg)" : "rotate(0deg)";
        }
      },
    };
  }

  function mountCh4PinnedSvg(container) {
    container.innerHTML = `
      <svg viewBox="0 0 560 420" class="theater-svg" role="img" aria-label="제04장 45분 단회학생상담 타임박스와 167시간 일상 전이 아크">
        <!-- Outer 167h orbit -->
        <g data-c4="2" style="transition:opacity 360ms ease">
          <circle cx="235" cy="210" r="165" fill="none" stroke="rgba(48,209,88,0.38)" stroke-width="2" stroke-dasharray="8 6"/>
          <text x="235" y="32" text-anchor="middle" fill="#6ee7a0" font-size="12" font-weight="800">주 1시간 상담 → 교실·가정 167시간 실생활 행동 실험 전이</text>
        </g>

        <!-- Chronometer base ring -->
        <circle cx="235" cy="210" r="118" fill="#0d111a" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>

        <!-- 4 Quadrant Arcs inside chronometer -->
        <g data-c4="0" style="transition:opacity 320ms ease">
          <path d="M 235 210 L 235 92 A 118 118 0 0 1 353 210 Z" fill="rgba(41,151,255,0.28)" stroke="#2997ff" stroke-width="2"/>
          <text x="288" y="156" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="800">1. 접수·MMSE</text>
          <text x="288" y="172" text-anchor="middle" fill="#93c5fd" font-size="10.5">5~8분 · 비자발 수용</text>
        </g>

        <g data-c4="1" style="transition:opacity 320ms ease">
          <path d="M 235 210 L 353 210 A 118 118 0 0 1 235 328 Z" fill="rgba(94,92,230,0.28)" stroke="#8e8cff" stroke-width="2"/>
          <text x="290" y="264" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="800">2. 미시기술 심화</text>
          <text x="290" y="280" text-anchor="middle" fill="#c7c6ff" font-size="10.5">SOLER·반영→직면</text>
        </g>

        <g data-c4="2" style="transition:opacity 320ms ease">
          <path d="M 235 210 L 235 328 A 118 118 0 0 1 117 210 Z" fill="rgba(48,209,88,0.24)" stroke="#30d158" stroke-width="2"/>
          <text x="180" y="264" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="800">3. 예외·통합전략</text>
          <text x="180" y="280" text-anchor="middle" fill="#bbf7d0" font-size="10.5">WDEP·SFBT·행동실험</text>
        </g>

        <g data-c4="3" style="transition:opacity 320ms ease">
          <path d="M 235 210 L 117 210 A 118 118 0 0 1 235 92 Z" fill="rgba(255,159,10,0.28)" stroke="#ff9f0a" stroke-width="2"/>
          <text x="182" y="156" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="800">4. 실행 리허설</text>
          <text x="182" y="172" text-anchor="middle" fill="#ffedd5" font-size="10.5">5~7분 · DAP·추수</text>
        </g>

        <circle cx="235" cy="210" r="36" fill="#07090e" stroke="rgba(255,255,255,0.25)"/>
        <text x="235" y="207" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="800">45분</text>
        <text x="235" y="224" text-anchor="middle" fill="#7ec2ff" font-size="10">단회/회기</text>

        <!-- Right-side Signal Legend -->
        <rect x="415" y="112" width="128" height="200" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)"/>
        <text x="479" y="140" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="800">작업동맹 3축</text>
        <text x="479" y="164" text-anchor="middle" fill="#93c5fd" font-size="11">• 목표 합의</text>
        <text x="479" y="184" text-anchor="middle" fill="#93c5fd" font-size="11">• 과제 합의</text>
        <text x="479" y="204" text-anchor="middle" fill="#93c5fd" font-size="11">• 정서적 유대</text>
        <line x1="430" y1="224" x2="528" y2="224" stroke="rgba(255,255,255,0.1)"/>
        <text x="479" y="248" text-anchor="middle" fill="#ffd48a" font-size="12" font-weight="800">동기 3차원</text>
        <text x="479" y="272" text-anchor="middle" fill="#ffedd5" font-size="11">Want · Confidence</text>
        <text x="479" y="292" text-anchor="middle" fill="#ffedd5" font-size="11">Readiness</text>
      </svg>
    `;
    return {
      updateBeat(beatIdx) {
        container.querySelectorAll("[data-c4]").forEach((el) => {
          const match = parseInt(el.dataset.c4, 10) === beatIdx;
          el.style.opacity = match ? "1" : "0.28";
        });
      },
    };
  }

  function mountCh5PinnedSvg(container) {
    const nodes = [
      { id: "adler", label: "5.1 아들러", sub: "그릇된 4목표·격려", x: 120, y: 82, cluster: 0 },
      { id: "beh", label: "5.2 행동·사회인지", sub: "FBA·효능감", x: 430, y: 82, cluster: 1 },
      { id: "rog", label: "5.3 로저스", sub: "3대 태도조건", x: 92, y: 215, cluster: 2 },
      { id: "ges", label: "5.4 게슈탈트", sub: "접촉혼란·빈의자", x: 132, y: 342, cluster: 2 },
      { id: "rebt", label: "5.5 REBT", sub: "당위·3차원 논박", x: 420, y: 185, cluster: 3 },
      { id: "beck", label: "5.6 벡 CT", sub: "3위계·협력경험주의", x: 465, y: 270, cluster: 3 },
      { id: "real", label: "5.7 현실치료", sub: "전행동·WDEP·SAMIC³", x: 382, y: 348, cluster: 3 },
      { id: "multi", label: "5.8 중다양식", sub: "BASIC I.D.·HELPING", x: 256, y: 368, cluster: 3 },
      { id: "pos", label: "5.9 강점기반", sub: "VIA 24·스미스 10단계", x: 280, y: 54, cluster: 3 },
    ];
    const centerLabels = [
      "아들러 렌즈: 교사 분노/무기력 → 힘·무능 목표 진단",
      "행동 렌즈: 수업 회피 부적 강화 고리 & 숙달 경험",
      "현상학 렌즈: 조건 없는 수용 & 지금-여기 반전 자각",
      "통합 렌즈: 당위·독심술 검증 · 선택 조향 · 강점 점화",
    ];
    container.innerHTML = `
      <svg viewBox="0 0 560 420" class="theater-svg" role="img" aria-label="제05장 9대 상담이론 성좌와 동일 사례 개념화 맵">
        <circle cx="280" cy="212" r="148" fill="none" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 6"/>
        <circle cx="280" cy="212" r="88" fill="none" stroke="rgba(41,151,255,0.16)"/>
        <g id="c5-lines">
          ${nodes
            .map(
              (n) =>
                `<line data-cluster="${n.cluster}" x1="280" y1="212" x2="${n.x}" y2="${n.y}" stroke="#2997ff" stroke-width="1.8" style="transition:opacity 300ms ease"/>`
            )
            .join("")}
        </g>
        <!-- Central Shared Case -->
        <rect x="196" y="182" width="168" height="60" rx="14" fill="#0d1526" stroke="#2997ff" stroke-width="2"/>
        <text x="280" y="205" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="800">공통 사례 (무기력·지각)</text>
        <text id="c5-center-sub" x="280" y="226" text-anchor="middle" fill="#7ec2ff" font-size="9.5" font-weight="600"></text>

        ${nodes
          .map(
            (n) => `
          <g data-cluster="${n.cluster}" style="transition:opacity 300ms ease">
            <rect x="${n.x - 68}" y="${n.y - 24}" width="136" height="48" rx="12" fill="#131926" stroke="#8e8cff" stroke-width="1.6"/>
            <text x="${n.x}" y="${n.y - 3}" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="800">${esc(n.label)}</text>
            <text x="${n.x}" y="${n.y + 14}" text-anchor="middle" fill="#cbd5e1" font-size="9.5">${esc(n.sub)}</text>
          </g>`
          )
          .join("")}
      </svg>
    `;
    const subTxt = container.querySelector("#c5-center-sub");
    return {
      updateBeat(beatIdx) {
        container.querySelectorAll("[data-cluster]").forEach((el) => {
          el.style.opacity = parseInt(el.dataset.cluster, 10) === beatIdx ? "1" : "0.24";
        });
        if (subTxt) subTxt.textContent = centerLabels[beatIdx] || centerLabels[0];
      },
    };
  }

  function mountCh6PinnedSvg(container) {
    const members = [
      { id: "L", label: "리더 L", x: 280, y: 108, leader: true },
      { id: "M1", label: "M1", x: 175, y: 152 },
      { id: "M2", label: "M2", x: 385, y: 152 },
      { id: "M3", label: "M3", x: 145, y: 248 },
      { id: "M4", label: "M4", x: 415, y: 248 },
      { id: "M5", label: "M5", x: 215, y: 318 },
      { id: "M6", label: "M6", x: 345, y: 318 },
    ];
    const students = members.slice(1);
    const peerLinks = [
      [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6], [1, 5], [2, 6], [3, 4],
    ];
    container.innerHTML = `
      <svg viewBox="0 0 560 420" class="theater-svg" role="img" aria-label="제06장 집단상담 소시오그램 발달단계 및 학급단위 확산 도식">
        <!-- Tier 1 Classroom outer diffusion (Beat 3) -->
        <g data-c6="3" style="transition:opacity 360ms ease">
          <ellipse cx="280" cy="212" rx="238" ry="178" fill="rgba(48,209,88,0.06)" stroke="#30d158" stroke-width="2" stroke-dasharray="6 5"/>
          <text x="280" y="398" text-anchor="middle" fill="#6ee7a0" font-size="12" font-weight="800">TIER 1 확산 · 민주적 학급회의 & 아들러식 격려 (전교생 15~25%)</text>
        </g>

        <!-- Stage 1: Spokes to Leader (Beat 0) -->
        <g data-c6="0" style="transition:opacity 320ms ease">
          ${students
            .map((m) => `<line x1="${m.x}" y1="${m.y}" x2="280" y2="108" stroke="#7ec2ff" stroke-width="1.8" stroke-dasharray="5 4"/>`)
            .join("")}
          <text x="280" y="54" text-anchor="middle" fill="#93c5fd" font-size="12" font-weight="800">초기단계: 모든 시선·질문이 리더(L)에게 집중되는 방사형 의존</text>
        </g>

        <!-- Stage 2: Transition Conflict & Blocking Shield (Beat 1) -->
        <g data-c6="1" style="transition:opacity 320ms ease">
          <line x1="175" y1="152" x2="385" y2="152" stroke="#ff453a" stroke-width="2.5" stroke-dasharray="4 3"/>
          <path d="M 280 120 L 280 235" stroke="#2997ff" stroke-width="4" stroke-linecap="round"/>
          <rect x="208" y="198" width="144" height="32" rx="16" fill="#0d1526" stroke="#2997ff" stroke-width="1.8"/>
          <text x="280" y="218" text-anchor="middle" fill="#7ec2ff" font-size="11.5" font-weight="800">차단하기(Blocking) 개입</text>
          <text x="280" y="54" text-anchor="middle" fill="#fca5a5" font-size="12" font-weight="800">과도기: 비난·독점·속죄양 갈등 출현 시 즉시 안전 차단</text>
        </g>

        <!-- Stage 3: Linking Horizontal Mesh (Beat 2) -->
        <g data-c6="2" style="transition:opacity 320ms ease">
          ${peerLinks
            .map(
              ([a, b]) =>
                `<line x1="${members[a].x}" y1="${members[a].y}" x2="${members[b].x}" y2="${members[b].y}" stroke="#30d158" stroke-width="2.2"/>`
            )
            .join("")}
          <text x="280" y="54" text-anchor="middle" fill="#6ee7a0" font-size="12" font-weight="800">작업단계: 연결짓기(Linking) 수평 그물망 & Yalom 보편성·응집력</text>
        </g>

        <!-- Member Nodes -->
        ${members
          .map(
            (m) => `
          <g>
            <circle cx="${m.x}" cy="${m.y}" r="${m.leader ? 24 : 20}" fill="${m.leader ? "#2997ff" : "#151c2c"}" stroke="${m.leader ? "#ffffff" : "#64748b"}" stroke-width="2"/>
            <text x="${m.x}" y="${m.y + 4}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="800">${esc(m.label)}</text>
          </g>`
          )
          .join("")}
      </svg>
    `;
    return {
      updateBeat(beatIdx) {
        container.querySelectorAll("[data-c6]").forEach((el) => {
          const idx = parseInt(el.dataset.c6, 10);
          el.style.opacity = idx === beatIdx ? "1" : "0.10";
        });
      },
    };
  }

  /* ==========================================================================
     PART 2. Section-Level Inline Interactive Widgets (18 Widgets)
     ========================================================================== */

  function mountWidgetShell(container, eyebrow, title, subtitle, bodyHtml) {
    container.innerHTML = `
      <div class="inline-viz-studio">
        <div class="inline-viz-head">
          <span class="sec-num">${esc(eyebrow)}</span>
          <h4>${esc(title)}</h4>
          ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
        </div>
        <div class="inline-viz-body">${bodyHtml}</div>
      </div>
    `;
    return container.querySelector(".inline-viz-body");
  }

  function renderRoomBlueprintWidget(container) {
    const rooms = [
      { id: "ind", label: "1. 개인상담실", spec: "천장 슬래브 밀폐 차음 · 방음문 · 90~120° 대각선 좌석 배치(권위 위계 완화) · 복수 탈출 동선 & 비상벨 · 「학교폭력예방법 시행령」 제15조 준수" },
      { id: "grp", label: "2. 집단상담·활동실", spec: "6~10명 원형 토의 가능 모듈형 책상/이동식 좌석 · 가변 파티션(소규모 교실 시 공간 겸용) · 역할극·매체 활동용 투사 교구 수납" },
      { id: "test", label: "3. 심리검사·해석실", spec: "외부 시선·소음 차단이 가능한 독립 책상 · 온라인·지면 검사 해석 구역 · 상담일지 및 검사 원자료 이중 잠금 캐비닛/암호화 PC" },
      { id: "wait", label: "4. 접수·대기 완충 코너", spec: "복도 직시 차단 가림막(익명성 보호) · 선도실·교무실 인접 회피 입지 · 신청 포스트잇/QR·마음 쉼 책자 구비로 접근 용이성 극대화" },
    ];
    const bodyEl = mountWidgetShell(
      container,
      "INTERACTIVE FLOORPLAN · 표 1-4 기준",
      "학교상담실 4대 기능 공간 & 보안 설계 평면도",
      "각 구역을 클릭해 법·물리적 설계 기준과 소규모 학교(0.5~1칸) 운용 대안을 확인하세요.",
      `
        <div style="display:grid;gap:12px">
          <svg viewBox="0 0 560 190" style="width:100%;max-height:210px;border-radius:14px;background:var(--bg-alt);border:1px solid var(--border)" role="img" aria-label="학교상담실 4대 구획 평면도">
            <rect x="14" y="16" width="160" height="158" rx="10" class="bp-zone" data-room="ind" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" style="cursor:pointer"/>
            <text x="94" y="88" text-anchor="middle" fill="var(--text)" font-size="13" font-weight="800" pointer-events="none">① 개인상담실</text>
            <text x="94" y="108" text-anchor="middle" fill="var(--text-muted)" font-size="10.5" pointer-events="none">슬래브 차음 · 120° 좌석 · 비상벨</text>

            <rect x="184" y="16" width="164" height="158" rx="10" class="bp-zone" data-room="grp" fill="var(--surface-subtle)" stroke="var(--border-strong)" stroke-width="1.5" style="cursor:pointer"/>
            <text x="266" y="88" text-anchor="middle" fill="var(--text)" font-size="13" font-weight="800" pointer-events="none">② 집단·활동실</text>
            <text x="266" y="108" text-anchor="middle" fill="var(--text-muted)" font-size="10.5" pointer-events="none">모듈 가구 · 가변 파티션</text>

            <rect x="358" y="16" width="188" height="74" rx="10" class="bp-zone" data-room="test" fill="var(--surface-subtle)" stroke="var(--border-strong)" stroke-width="1.5" style="cursor:pointer"/>
            <text x="452" y="49" text-anchor="middle" fill="var(--text)" font-size="12.5" font-weight="800" pointer-events="none">③ 심리검사 · 이중잠금 기록실</text>
            <text x="452" y="67" text-anchor="middle" fill="var(--text-muted)" font-size="10" pointer-events="none">「개인정보 보호법」 제23조 분리보관</text>

            <rect x="358" y="100" width="188" height="74" rx="10" class="bp-zone" data-room="wait" fill="var(--surface-subtle)" stroke="var(--border-strong)" stroke-width="1.5" style="cursor:pointer"/>
            <text x="452" y="133" text-anchor="middle" fill="var(--text)" font-size="12.5" font-weight="800" pointer-events="none">④ 접수 · 완충 대기 코너</text>
            <text x="452" y="151" text-anchor="middle" fill="var(--text-muted)" font-size="10" pointer-events="none">복도 직시 차단 · 동선 분리</text>
          </svg>
          <div id="bp-spec-box" class="diag-card is-highlight"></div>
        </div>
      `
    );
    const out = bodyEl.querySelector("#bp-spec-box");
    const zones = Array.from(bodyEl.querySelectorAll(".bp-zone"));
    function pick(roomId) {
      const r = rooms.find((x) => x.id === roomId) || rooms[0];
      zones.forEach((z) => {
        const active = z.dataset.room === r.id;
        z.setAttribute("fill", active ? "var(--accent-soft)" : "var(--surface-subtle)");
        z.setAttribute("stroke", active ? "var(--accent)" : "var(--border-strong)");
        z.setAttribute("stroke-width", active ? "2.4" : "1.5");
      });
      out.innerHTML = `<h4>${esc(r.label)}</h4><p>${esc(r.spec)}</p>`;
    }
    zones.forEach((z) => z.addEventListener("click", () => pick(z.dataset.room)));
    pick("ind");
  }

  function renderZpdWidget(container) {
    const levels = [
      { id: "alone", label: "1. 혼자 해결 가능 영역", tag: "실제적 발달수준", desc: "상담자의 개입 없이도 학생 스스로 기존 인지·정서 전략으로 해결할 수 있는 수준(지나치게 쉬운 과제만 주면 성장 정체).", script: "사적 언어 상태: \"친구랑 다퉈서 짜증 나. 어쨌든 참아야지.\"" },
      { id: "zpd", label: "2. 근접발달영역 (ZPD · 상담 골든존)", tag: "비계설정 투입 구간", desc: "감정 어휘 제공·선택지 축소·시범(modeling) 등 상담교사의 비계가 투입될 때 새로운 자기조절이 성취되는 핵심 개입 구간.", script: "비계 자기교시 훈련: \"화가 10점 중 8점 올라올 때 3초 멈추고 '내가 진짜 원하는 말' 하나만 골라 말해보자.\"" },
      { id: "fade", label: "3. 비계 철수 → 내적 언어 완성", tag: "잠재적 발달수준 달성", desc: "대인 간(intermental) 공동 대화가 학생 내부의 정신 내(intramental) 내적 언어로 완전히 내면화되어 비계를 회수하는 단계.", script: "내면화 완료: 학생 스스로 갈등 순간 속으로 3초 멈춤 스크립트를 가동해 표현 조절 성공." },
    ];
    const bodyEl = mountWidgetShell(
      container,
      "INTERACTIVE VYGOTSKY · 표 2-3 연계",
      "비고츠키 ZPD 비계설정 & 사적 언어→내적 언어 전이기",
      "단계를 클릭하여 대인 간 상담 비계가 어떻게 학생의 내적 자기조절 언어로 내면화되는지 확인하세요.",
      `
        <div class="diag-pill-row">${levels.map((l) => `<button type="button" class="diag-chip" data-chip="${l.id}">${esc(l.label)}</button>`).join("")}</div>
        <div id="zpd-out"></div>
      `
    );
    bindChipGroup(bodyEl, "[data-chip]", "zpd", (id) => {
      const lv = levels.find((x) => x.id === id);
      bodyEl.querySelector("#zpd-out").innerHTML = `
        <div class="diag-grid-2">
          <div class="diag-card is-highlight"><span class="bento-badge">${esc(lv.tag)}</span><h4>${esc(lv.label)}</h4><p>${esc(lv.desc)}</p></div>
          <div class="diag-card is-good"><span class="bento-badge">혼잣말 · 자기교시 변환</span><h4>언어 내면화 스크립트</h4><p>${esc(lv.script)}</p></div>
        </div>
      `;
    });
  }

  function renderMarciaWidget(container) {
    const statuses = [
      { id: "achieved", label: "정체감 성취 (탐색 ○ · 전념 ○)", badge: "고탐색 × 고전념", sign: "직업·전공을 직접 탐색하고 시행착오를 거친 뒤 자기 결정으로 진로·가치관에 전념하는 상태.", guide: "자율적 목표 실행을 격려하고 대학·사회 전환기 스트레스 관리만 보조." },
      { id: "moratorium", label: "정체감 유예 (탐색 ○ · 전념 △)", badge: "고탐색 × 저전념", sign: "'내가 진짜 뭘 좋아하는지 모르겠어요'라며 치열히 고민·탐색 중이라 일시 불안을 겪는 상태.", guide: "유예를 병리/나태로 낙인찍지 말고 안전한 시행착오 공간과 탐색 자원을 보호." },
      { id: "foreclosed", label: "정체감 유실 (탐색 ✕ · 전념 ○)", badge: "저탐색 × 고전념", sign: "한국 성실 모범생에게 흔함! 자기 질문 없이 부모·입시 서열 기준을 무비판 내면화해 전념하다 뒤늦게 번아웃.", guide: "부모 기대와 내 진짜 흥미를 분리해 '내 목소리로 고르기' 탐색 질문 투입 필수." },
      { id: "diffused", label: "정체감 혼미 (탐색 ✕ · 전념 ✕)", badge: "저탐색 × 저전념", sign: "무기력·방황·즉흥 충동에 머무르며 진로·관계 어디에도 탐색이나 방향 감각이 없는 상태.", guide: "거창한 진로 결정 압박 금지! 작은 흥미·일상 유능감(근면성 보충)부터 비계 설정." },
    ];
    const bodyEl = mountWidgetShell(
      container,
      "2×2 MATRIX · 표 2-5 핵심",
      "마샤(Marcia) 자아정체감 4지위 사분면 탐색기",
      "탐색(위기)과 전념 수준 조합을 클릭하여 한국 모범생형 '정체감 유실'과 건강한 '유예'를 변별해 보세요.",
      `
        <div class="diag-grid-2" style="margin-bottom:12px">
          ${statuses
            .map(
              (s) =>
                `<button type="button" class="diag-chip" data-chip="${s.id}" style="border-radius:12px;padding:10px 12px;text-align:left">${esc(s.label)}</button>`
            )
            .join("")}
        </div>
        <div id="marcia-out"></div>
      `
    );
    bindChipGroup(bodyEl, "[data-chip]", "foreclosed", (id) => {
      const st = statuses.find((x) => x.id === id);
      bodyEl.querySelector("#marcia-out").innerHTML = `
        <div class="diag-card is-highlight">
          <span class="bento-badge">${esc(st.badge)}</span>
          <h4>${esc(st.label)}</h4>
          <p><strong>한국 학교 발현:</strong> ${esc(st.sign)}</p>
          <p style="margin-top:6px"><strong>상담 개입 전략:</strong> ${esc(st.guide)}</p>
        </div>
      `;
    });
  }

  function renderGlasserCarWidget(container) {
    const parts = [
      { id: "steer", label: "핸들: 5대 욕구 · 질적 세계", role: "방향 결정자", desc: "생존·사랑과 소속·힘·자유·즐거움 중 어떤 욕구가 질적 세계(Quality World)에서 좌절되었는지가 모든 선택 행동의 출발점입니다." },
      { id: "front", label: "앞바퀴: 행동(Acting) · 사고(Thinking)", role: "직접 조향 가능!", desc: "네 요소 중 학생이 지금 당장 직접 바꾸고 통제할 수 있는 두 바퀴입니다. '오늘 교실 자리에서 뭘 달리해 볼까?'를 WDEP(SAMIC³)로 조향합니다." },
      { id: "rear", label: "뒷바퀴: 감정(Feeling) · 생리(Physiology)", role: "앞바퀴 따라 종속 이동", desc: "우울하기·분노하기·두통 등 감정과 신체 반응은 뒷바퀴입니다. 뒷바퀴만 직접 비틀 수 없으므로 앞바퀴(행동·생각) 선택을 바꿀 때 함께 달라집니다." },
    ];
    const bodyEl = mountWidgetShell(
      container,
      "INTERACTIVE TOTAL BEHAVIOR CAR · 표 5-13·5-14",
      "글래서 선택이론 전행동 자동차(Total Behavior) 조향기",
      "핸들·앞바퀴·뒷바퀴를 눌러 왜 현실치료가 '감정 탓하기' 대신 '행동·생각 선택(WDEP)'에 집중하는지 확인하세요.",
      `
        <div class="diag-pill-row">${parts.map((p) => `<button type="button" class="diag-chip" data-chip="${p.id}">${esc(p.label)}</button>`).join("")}</div>
        <div id="glasser-out"></div>
      `
    );
    bindChipGroup(bodyEl, "[data-chip]", "front", (id) => {
      const p = parts.find((x) => x.id === id);
      bodyEl.querySelector("#glasser-out").innerHTML = `
        <div class="diag-card ${id === "front" ? "is-good" : "is-highlight"}">
          <span class="bento-badge">${esc(p.role)}</span>
          <h4>${esc(p.label)}</h4>
          <p>${esc(p.desc)}</p>
          <p style="margin-top:8px;font-size:0.82rem;color:var(--text-muted)"><strong>SAMIC³ 점검:</strong> Simple(단순) · Attainable(달성가능) · Measurable(측정) · Immediate(즉각) · Consistent(일관) · Controlled by Student(학생 통제)</p>
        </div>
      `;
    });
  }

  function renderWidgetFromData(container, widgetId, ch) {
    const d = ch.diagrams || {};
    if (widgetId === "ch1-room-blueprint") return renderRoomBlueprintWidget(container);
    if (widgetId === "ch2-zpd") return renderZpdWidget(container);
    if (widgetId === "ch2-marcia") return renderMarciaWidget(container);
    if (widgetId === "ch5-glasser") return renderGlasserCarWidget(container);

    if (widgetId === "ch1-spectrum") {
      const b = mountWidgetShell(container, "표 1-1 비교 탐색기", "생활지도 · 학교상담 · 심리치료 3축 스펙트럼", "비교 차원을 눌러 세 영역의 경계를 대조해 보세요.", `<div class="diag-pill-row">${d.spectrum.map((s) => `<button type="button" class="diag-chip" data-chip="${esc(s.id)}">${esc(s.dim)}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", d.spectrum[0].id, (id) => {
        const r = d.spectrum.find((x) => x.id === id);
        b.querySelector("#w-out").innerHTML = `<div class="diag-grid-3"><div class="diag-card"><h4>생활지도</h4><p>${esc(r.guidance)}</p></div><div class="diag-card is-highlight"><h4>학교상담</h4><p>${esc(r.counseling)}</p></div><div class="diag-card"><h4>심리치료</h4><p>${esc(r.therapy)}</p></div></div>`;
      });
    }
    if (widgetId === "ch1-timeline") {
      const b = mountWidgetShell(container, "표 1-3 역사 비교", "한·미 학교상담 4기 제도 발전 타임라인", "시대를 클릭해 미국의 NDEA·ASCA 경로와 한국의 교도교사·Wee 경로를 비교하세요.", `<div class="diag-pill-row">${d.timeline.map((t, i) => `<button type="button" class="diag-chip" data-chip="t${i}">${esc(t.era)}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", "t0", (cid) => {
        const item = d.timeline[parseInt(cid.slice(1), 10)];
        b.querySelector("#w-out").innerHTML = `<div class="diag-grid-2"><div class="diag-card"><span class="bento-badge">미국 경로</span><h4>${esc(item.usYears)}</h4><p>${esc(item.usDesc)}</p></div><div class="diag-card is-highlight"><span class="bento-badge">한국 경로</span><h4>${esc(item.krYears)}</h4><p>${esc(item.krDesc)}</p></div></div>`;
      });
    }
    if (widgetId === "ch2-ages") {
      const b = mountWidgetShell(container, "표 2-2 발달 맞춤 면담", "학령기~청소년기 6대 발달이론 통합 탐색기", "학령을 전환해 피아제·비고츠키·엘킨드·프로이트·에릭슨 상담 팁을 확인하세요.", `<div class="diag-pill-row">${d.stages.map((s) => `<button type="button" class="diag-chip" data-chip="${esc(s.id)}">${esc(s.label)}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", d.stages[0].id, (id) => {
        const st = d.stages.find((x) => x.id === id);
        b.querySelector("#w-out").innerHTML = `<div class="diag-grid-3"><div class="diag-card"><h4>하비거스트</h4><p>${esc(st.havighurst)}</p></div><div class="diag-card"><h4>피아제 인지</h4><p>${esc(st.piaget)}</p></div><div class="diag-card"><h4>비고츠키 ZPD</h4><p>${esc(st.vygotsky)}</p></div><div class="diag-card"><h4>엘킨드 자아중심</h4><p>${esc(st.elkind)}</p></div><div class="diag-card"><h4>프로이트 역동</h4><p>${esc(st.freud)}</p></div><div class="diag-card"><h4>에릭슨·마샤</h4><p>${esc(st.erikson)}</p></div></div><div class="diag-card is-highlight" style="margin-top:10px"><h4>맞춤 매체·발문 전략</h4><p>${esc(st.counselingTip)}</p></div>`;
      });
    }
    if (widgetId === "ch2-defenses") {
      const levels = ["전체", "미성숙", "신경증적", "성숙한"];
      const b = mountWidgetShell(container, "표 2-4 임상 필터", "학생 자아 방어기제 성숙도 매트릭스", "성숙도 수준을 눌러 학교 발현 양상과 비파괴 개입 지침을 확인하세요.", `<div class="diag-pill-row">${levels.map((lv) => `<button type="button" class="diag-chip" data-chip="${esc(lv)}">${esc(lv)}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", "전체", (lv) => {
        const items = lv === "전체" ? d.defenses : d.defenses.filter((x) => x.level === lv);
        b.querySelector("#w-out").innerHTML = `<div class="diag-grid-2">${items.map((def) => `<div class="diag-card ${def.level === "성숙한" ? "is-good" : ""}"><span class="bento-badge">${esc(def.level)} 수준</span><h4>${esc(def.name)}</h4><p><strong>발현:</strong> ${esc(def.schoolSign)}</p><p style="margin-top:6px"><strong>개입:</strong> ${esc(def.intervention)}</p></div>`).join("")}</div>`;
      });
    }
    if (widgetId === "ch3-tasks") {
      const b = mountWidgetShell(container, "표 3-3 직무 자가 판별", "ASCA 적합 전문 직무 vs 부적합 비상담 업무 판별기", "각 업무 카드를 클릭해 전문상담교사 적합 여부를 직접 테스트하세요.", `<div class="diag-grid-2">${d.tasks.map((t, i) => `<button type="button" class="diag-card" style="text-align:left;cursor:pointer" data-task-idx="${i}"><h4>${esc(t.task)}</h4><p class="task-verdict" style="margin-top:6px;color:var(--accent);font-weight:700">클릭하여 판별하기 →</p></button>`).join("")}</div>`);
      return b.querySelectorAll("[data-task-idx]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const item = d.tasks[parseInt(btn.dataset.taskIdx, 10)];
          btn.classList.remove("is-good", "is-bad");
          btn.classList.add(item.fit ? "is-good" : "is-bad");
          btn.querySelector(".task-verdict").textContent = `${item.fit ? "[적합 전문 직무]" : "[부적합 비상담 업무]"} ${item.reason}`;
        })
      );
    }
    if (widgetId === "ch3-tree") {
      const b = mountWidgetShell(container, "표 3-6 고위기 의사결정", "비밀보장 예외 · 법정 신고 의사결정 시뮬레이터", "고위기 상황을 선택하면 형량 도덕원칙과 즉각 실행 프로토콜이 펼쳐집니다.", `<div class="diag-pill-row">${d.scenarios.map((sc) => `<button type="button" class="diag-chip" data-chip="${esc(sc.id)}">${esc(sc.badge)}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", d.scenarios[0].id, (id) => {
        const sc = d.scenarios.find((x) => x.id === id);
        b.querySelector("#w-out").innerHTML = `<div class="diag-card is-highlight" style="margin-bottom:10px"><h4>${esc(sc.title)}</h4><p><strong>형량:</strong> ${esc(sc.principles)} · <strong>근거:</strong> ${esc(sc.law)}</p></div><div class="diag-card"><h4>실행 프로토콜</h4><ul>${sc.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>`;
      });
    }
    if (widgetId === "ch3-burnout") {
      return mountWidgetShell(container, "표 3-7 조기 변별", "직무 소진 · 공감 피로(STS) · 대리외상(VT) 3자 비교", "발생 속도와 원인, 인지 도식 손상 여부에 따른 맞춤형 3층 자기관리 전략입니다.", `<div class="diag-grid-3">${d.burnout.map((item) => `<div class="diag-card"><span class="bento-badge">${esc(item.onset)}</span><h4>${esc(item.type)}</h4><p><strong>원인:</strong> ${esc(item.cause)}</p><p style="margin-top:6px"><strong>징후:</strong> ${esc(item.core)}</p><p style="margin-top:6px"><strong>처방:</strong> ${esc(item.remedy)}</p></div>`).join("")}</div>`);
    }
    if (widgetId === "ch4-micro") {
      const b = mountWidgetShell(container, "표 4-4 · 4-5 축어록 대조", "초임 교사 오용 vs 미시상담기술 치료적 반응 비교기", "학생 발화 상황을 선택해 반응 차이를 비교하세요.", `<div class="diag-pill-row">${d.microskills.map((m, i) => `<button type="button" class="diag-chip" data-chip="m${i}">사례 ${i + 1}: ${esc(m.skill.split("+")[0])}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", "m0", (cid) => {
        const m = d.microskills[parseInt(cid.slice(1), 10)];
        b.querySelector("#w-out").innerHTML = `<div class="diag-card is-highlight" style="margin-bottom:10px"><h4>학생 발화</h4><p>${esc(m.case)}</p></div><div class="diag-grid-2"><div class="diag-card is-bad"><h4>초임 교사의 오용</h4><p>${esc(m.wrong)}</p></div><div class="diag-card is-good"><h4>치료적 반응 (${esc(m.skill)})</h4><p>${esc(m.good)}</p></div></div>`;
      });
    }
    if (widgetId === "ch4-sfbt") {
      const b = mountWidgetShell(container, "표 4-10 · 4-11 발문/타임박스", "해결중심 SFBT 초·중등 발문 변환기 & 45분 단회 프로토콜", "기법 버튼을 눌러 초등학생 vs 중·고등학생 맞춤 발문을 비교하고 4단계 배분을 확인하세요.", `<div class="diag-pill-row">${d.sfbt.map((s, i) => `<button type="button" class="diag-chip" data-chip="s${i}">${esc(s.tech)}</button>`).join("")}</div><div id="w-out"></div><div class="diag-grid-2" style="margin-top:12px">${d.singleSession.map((st) => `<div class="diag-card"><span class="bento-badge">${esc(st.mins)}</span><h4>${esc(st.step)}</h4><p>${esc(st.desc)}</p></div>`).join("")}</div>`);
      return bindChipGroup(b, "[data-chip]", "s0", (cid) => {
        const s = d.sfbt[parseInt(cid.slice(1), 10)];
        b.querySelector("#w-out").innerHTML = `<div class="diag-grid-2"><div class="diag-card"><span class="bento-badge">초등학생</span><h4>${esc(s.tech)}</h4><p>${esc(s.elem)}</p></div><div class="diag-card is-highlight"><span class="bento-badge">중·고등학생</span><h4>${esc(s.tech)}</h4><p>${esc(s.sec)}</p></div></div>`;
      });
    }
    if (widgetId === "ch5-adler") {
      const b = mountWidgetShell(container, "표 5-1 교사 역전이 진단기", "교사의 즉각 정서로 진단하는 그릇된 행동 4목표", "문제행동 직후 교사 자신에게 떠오르는 정서 단서를 클릭해 보세요.", `<div class="diag-pill-row">${d.adlerGoals.map((g, i) => `<button type="button" class="diag-chip" data-chip="g${i}">${esc(g.cue.split("(")[0].trim())}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", "g0", (cid) => {
        const g = d.adlerGoals[parseInt(cid.slice(1), 10)];
        b.querySelector("#w-out").innerHTML = `<div class="diag-grid-2"><div class="diag-card is-highlight"><span class="bento-badge">교사 정서: ${esc(g.cue)}</span><h4>${esc(g.goal)}</h4><p><strong>사적 논리:</strong> ${esc(g.childLogic)}</p></div><div class="diag-card is-good"><h4>격려 & 논리적 결과</h4><p>${esc(g.intervention)}</p></div></div>`;
      });
    }
    if (widgetId === "ch5-theories") {
      const b = mountWidgetShell(
        container,
        "표 5-12 연계 1:1 이론 비교 스튜디오",
        "9대 상담이론 두 관점 직접 대조기 (REBT vs 벡 CT 등)",
        "두 이론을 선택하면 인간관·부적응 기제·동일 사례 개념화·개입 기법을 나란히 대조합니다.",
        `<div class="diag-grid-2" style="margin-bottom:12px"><label style="font-size:0.84rem;font-weight:700">이론 A<select id="w-cmp-a" class="btn" style="width:100%;margin-top:6px;border-radius:10px">${d.theories.map((t) => `<option value="${esc(t.id)}" ${t.id === "rebt" ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label><label style="font-size:0.84rem;font-weight:700">이론 B<select id="w-cmp-b" class="btn" style="width:100%;margin-top:6px;border-radius:10px">${d.theories.map((t) => `<option value="${esc(t.id)}" ${t.id === "beck" ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label></div><div id="w-cmp-out"></div>`
      );
      const selA = b.querySelector("#w-cmp-a");
      const selB = b.querySelector("#w-cmp-b");
      function draw() {
        const x = d.theories.find((t) => t.id === selA.value) || d.theories[0];
        const y = d.theories.find((t) => t.id === selB.value) || d.theories[1] || d.theories[0];
        if (!x || !y) return;
        b.querySelector("#w-cmp-out").innerHTML = `<div class="table-scroll"><table class="study-table"><thead><tr><th>비교 차원</th><th>${esc(x.name)}</th><th>${esc(y.name)}</th></tr></thead><tbody><tr><td><strong>인간관</strong></td><td>${esc(x.human)}</td><td>${esc(y.human)}</td></tr><tr><td><strong>부적응 기제</strong></td><td>${esc(x.cause)}</td><td>${esc(y.cause)}</td></tr><tr><td><strong>사례 해석</strong></td><td>${esc(x.caseLens)}</td><td>${esc(y.caseLens)}</td></tr><tr><td><strong>핵심 기법</strong></td><td>${esc(x.tech)}</td><td>${esc(y.tech)}</td></tr></tbody></table></div>`;
      }
      selA.addEventListener("change", draw);
      selB.addEventListener("change", draw);
      return draw();
    }
    if (widgetId === "ch6-yalom") {
      return mountWidgetShell(container, "표 6-3 치료 엔진", "얄롬과 레슈츠(Yalom & Leszcz) 11대 치료적 요인", "학령기 학교 집단상담에서 개인상담과 달리 작동하는 11가지 또래 치유 동력입니다.", `<div class="diag-grid-3">${d.yalom11.map((y) => `<div class="diag-card"><span class="bento-badge">요인 ${y.num}</span><h4>${esc(y.name)}</h4><p>${esc(y.desc)}</p></div>`).join("")}</div>`);
    }
    if (widgetId === "ch6-stages") {
      const b = mountWidgetShell(container, "표 6-12 발달 역동", "집단 거시 4단계 역동과 과도기 리더십 탐색기", "각 단계를 클릭해 집단원 역동과 리더의 핵심 개입 초점을 확인하세요.", `<div class="diag-pill-row">${d.groupStages.map((s, i) => `<button type="button" class="diag-chip" data-chip="gs${i}">${esc(s.stage.split("(")[0].trim())}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", "gs1", (cid) => {
        const st = d.groupStages[parseInt(cid.slice(2), 10)];
        b.querySelector("#w-out").innerHTML = `<div class="diag-grid-2"><div class="diag-card"><span class="bento-badge">${esc(st.sessions)}</span><h4>${esc(st.stage)}</h4><p>${esc(st.dynamic)}</p></div><div class="diag-card is-highlight"><h4>리더 개입 초점</h4><p>${esc(st.leader)}</p></div></div>`;
      });
    }
    if (widgetId === "ch6-praise") {
      const b = mountWidgetShell(container, "표 6-15 교실 발화 변환기", "외적 칭찬/처벌 → 아들러식 격려/논리적 결과 변환기", "교실 상황별 통제적 발화와 민주적 성장 발화의 차이를 비교하세요.", `<div class="diag-pill-row">${d.praiseVsEnc.map((p, i) => `<button type="button" class="diag-chip" data-chip="pv${i}">${esc(p.type)}</button>`).join("")}</div><div id="w-out"></div>`);
      return bindChipGroup(b, "[data-chip]", "pv0", (cid) => {
        const row = d.praiseVsEnc[parseInt(cid.slice(2), 10)];
        b.querySelector("#w-out").innerHTML = `<div class="diag-grid-2"><div class="diag-card is-bad"><h4>외적 통제 (칭찬/처벌)</h4><p>${esc(row.control)}</p></div><div class="diag-card is-good"><h4>민주적 성장 (격려/논리적 결과)</h4><p>${esc(row.encouragement)}</p></div></div>`;
      });
    }
  }

  const PINNED_SVG_MOUNT = {
    1: mountCh1PinnedSvg,
    2: mountCh2PinnedSvg,
    3: mountCh3PinnedSvg,
    4: mountCh4PinnedSvg,
    5: mountCh5PinnedSvg,
    6: mountCh6PinnedSvg,
  };

  window.DiagramEngine = {
    renderPinnedStageGraphic(container, chapterObj, initialBeatIdx = 0) {
      if (!container || !chapterObj) return { updateBeat() {} };
      const fn = PINNED_SVG_MOUNT[chapterObj.chapter];
      if (!fn) return { updateBeat() {} };
      const ctrl = fn(container);
      if (ctrl && typeof ctrl.updateBeat === "function") ctrl.updateBeat(initialBeatIdx, 0);
      return ctrl;
    },
    renderSectionWidget(container, widgetId, chapterObj) {
      if (!container || !widgetId || !chapterObj) return;
      renderWidgetFromData(container, widgetId, chapterObj);
    },
    renderChapterDiagram(container, chapterObj) {
      if (!container || !chapterObj) return;
      const defaultWidget = { 1: "ch1-spectrum", 2: "ch2-ages", 3: "ch3-tree", 4: "ch4-micro", 5: "ch5-theories", 6: "ch6-yalom" };
      renderWidgetFromData(container, defaultWidget[chapterObj.chapter], chapterObj);
    },
  };
})();
