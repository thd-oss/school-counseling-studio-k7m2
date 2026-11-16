/* ==========================================================================
   Apple-Scrollytelling Optical Diagram Topology Engine (Ch01-Ch06)
   - Part 1: 6 Signature Sticky Pinned Stage SVG Engines (Continuous Scrub)
   - Part 2: 18 Section-Level Interactive Topology Studios (Registry Pattern)
   Zero inline event handlers; full keyboard & forced-colors accessibility.
   ========================================================================== */

(function () {
  let uidSeq = 0;
  function nextUid() {
    uidSeq += 1;
    return `viz${uidSeq}`;
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  }

  function lerp(a, b, t) {
    return a + (b - a) * clamp01(t);
  }

  function shortLabel(str, maxLen = 14) {
    const s = String(str || "").replace(/\([^)]*\)/g, "").trim();
    return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
  }

  const VIZ_CONST = {
    VIEWBOX_STAGE: "0 0 560 420",
    VIEWBOX_WIDE: "0 0 640 255",
    VIEWBOX_TALL: "0 0 640 295",
    NODE_RX: 12,
    PANEL_RX: 16,
    PILL_RX: 999,
    STROKE_MAIN: 2.4,
    STROKE_SUB: 1.6,
    STROKE_GRID: 1,
  };

  const SvgKit = {
    defs(uid) {
      return `
        <defs>
          <marker id="${uid}-arr-pri" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--viz-primary)" />
          </marker>
          <marker id="${uid}-arr-safe" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--viz-safe)" />
          </marker>
          <marker id="${uid}-arr-crit" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--viz-critical)" />
          </marker>
          <marker id="${uid}-arr-warn" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--viz-warn)" />
          </marker>
          <marker id="${uid}-arr-depth" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--viz-depth)" />
          </marker>
          <marker id="${uid}-arr-muted" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--viz-keyline)" />
          </marker>
        </defs>
      `;
    },
    mountStudioShell(container, eyebrow, title, subtitle, bodyHtml) {
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
    },
    bindSegmentedControls(rootEl, selector, initialId, onChange) {
      const btns = Array.from(rootEl.querySelectorAll(selector));
      if (!btns.length) return;
      function select(id) {
        btns.forEach((b) => {
          const active = b.dataset.chip === id;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        onChange(id);
      }
      btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.chip)));
      select(initialId);
      return select;
    },
    bindSvgNodes(svgHost, selector, onSelect) {
      const nodes = Array.from(svgHost.querySelectorAll(selector));
      nodes.forEach((node) => {
        node.addEventListener("click", () => onSelect(node.dataset.nodeId, node));
        node.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(node.dataset.nodeId, node);
          }
        });
      });
    },
  };

  /* ==========================================================================
     PART 1. 6 Signature Sticky Pinned Stage SVG Engines (Continuous Scrub)
     Each returns { updateBeat(beatIdx, rawProgress, localT) }
     ========================================================================== */

  function mountCh1PinnedSvg(container) {
    const uid = nextUid();
    container.innerHTML = `
      <svg viewBox="${VIZ_CONST.VIEWBOX_STAGE}" class="theater-svg viz-svg" role="img" aria-label="제01장 스위스 치즈 3중 안전망과 훈육-상담 분리 방화벽 도식">
        ${SvgKit.defs(uid)}
        <rect x="14" y="14" width="532" height="392" rx="18" fill="var(--viz-canvas)" stroke="var(--viz-keyline)" stroke-width="1"/>

        <text x="280" y="42" text-anchor="middle" fill="var(--viz-ink)" font-size="13" font-weight="800">SWISS CHEESE 3-TIER SAFETY NET &amp; FIREWALL</text>
        <text x="280" y="60" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10.5">단일 안전망의 사각지대(구멍)를 다음 계층이 차단하고 훈육 경계와 분리합니다</text>

        <!-- Risk trajectory arrows piercing through Swiss Cheese holes -->
        <path d="M 38 188 L 116 188" stroke="var(--viz-critical)" stroke-width="2.4" stroke-dasharray="5 3" marker-end="url(#${uid}-arr-crit)"/>
        <text x="64" y="172" text-anchor="middle" fill="var(--viz-critical)" font-size="10" font-weight="800">위기·부적응</text>
        <text x="64" y="210" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">발달 신호</text>

        <!-- Layer 0: Tier 1 Slice -->
        <g data-ch1-layer="0" style="transition:opacity 240ms ease,transform 260ms ease">
          <polygon points="122,92 204,76 204,284 122,300" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="2.2"/>
          <ellipse cx="163" cy="188" rx="18" ry="22" fill="var(--viz-canvas)" stroke="var(--viz-primary)" stroke-width="1.5" stroke-dasharray="4 3"/>
          <text x="163" y="185" text-anchor="middle" fill="var(--viz-primary)" font-size="9" font-weight="700">개별욕구</text>
          <text x="163" y="197" text-anchor="middle" fill="var(--viz-primary)" font-size="9" font-weight="700">통과</text>
          <text x="163" y="114" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">TIER 1</text>
          <text x="163" y="130" text-anchor="middle" fill="var(--viz-primary)" font-size="10" font-weight="700">보편 예방</text>
          <text x="163" y="266" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">전교생 100%</text>
        </g>

        <!-- Path Tier 1 -> Tier 2 -->
        <path id="${uid}-p12" d="M 181 188 L 246 188" fill="none" stroke="var(--viz-warn)" stroke-width="2.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>

        <!-- Layer 1: Tier 2 Slice -->
        <g data-ch1-layer="1" style="transition:opacity 240ms ease,transform 260ms ease">
          <polygon points="248,92 332,76 332,284 248,300" fill="var(--viz-depth-soft)" stroke="var(--viz-depth)" stroke-width="2.2"/>
          <ellipse cx="290" cy="148" rx="16" ry="18" fill="var(--viz-canvas)" stroke="var(--viz-depth)" stroke-width="1.5" stroke-dasharray="4 3"/>
          <ellipse cx="290" cy="236" rx="17" ry="20" fill="var(--viz-canvas)" stroke="var(--viz-depth)" stroke-width="1.5" stroke-dasharray="4 3"/>
          <rect x="262" y="176" width="56" height="24" rx="8" fill="var(--viz-depth)" />
          <text x="290" y="192" text-anchor="middle" fill="#ffffff" font-size="9.5" font-weight="800">조기개입</text>
          <text x="290" y="114" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">TIER 2</text>
          <text x="290" y="266" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">Wee 클래스</text>
        </g>

        <!-- Path Tier 2 -> Tier 3 (from lower hole) -->
        <path id="${uid}-p23" d="M 307 236 L 374 236" fill="none" stroke="var(--viz-critical)" stroke-width="2.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>

        <!-- Layer 2: Tier 3 Slice -->
        <g data-ch1-layer="2" style="transition:opacity 240ms ease,transform 260ms ease">
          <polygon points="376,92 462,76 462,284 376,300" fill="var(--viz-warn-soft)" stroke="var(--viz-warn)" stroke-width="2.2"/>
          <ellipse cx="419" cy="176" rx="16" ry="18" fill="var(--viz-canvas)" stroke="var(--viz-warn)" stroke-width="1.5" stroke-dasharray="4 3"/>
          <rect x="387" y="222" width="64" height="28" rx="9" fill="var(--viz-warn)"/>
          <text x="419" y="240" text-anchor="middle" fill="#0f172a" font-size="9.5" font-weight="800">심층·의료연계</text>
          <text x="419" y="114" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">TIER 3</text>
          <text x="419" y="266" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">Wee 센터·스쿨</text>
        </g>

        <!-- Outcome Safe Shield -->
        <rect x="476" y="156" width="58" height="72" rx="12" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="1.8"/>
        <text x="505" y="186" text-anchor="middle" fill="var(--viz-safe)" font-size="14" font-weight="800">✓</text>
        <text x="505" y="204" text-anchor="middle" fill="var(--viz-ink)" font-size="10" font-weight="800">적응</text>
        <text x="505" y="218" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">회복</text>

        <!-- Layer 3: Firewall Dock Shutter (Bottom HUD) -->
        <g data-ch1-layer="3" style="transition:opacity 260ms ease">
          <rect x="28" y="316" width="214" height="72" rx="12" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-width="1.8" stroke-dasharray="5 3"/>
          <text x="135" y="342" text-anchor="middle" fill="var(--viz-critical)" font-size="11.5" font-weight="800">✕ 생활안전부 · 선도위</text>
          <text x="135" y="362" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">사안 조사 · 징계 처분 전담</text>
          <text x="135" y="378" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">규율 통제 권한 분리</text>

          <rect x="318" y="316" width="214" height="72" rx="12" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="1.8"/>
          <text x="425" y="342" text-anchor="middle" fill="var(--viz-safe)" font-size="11.5" font-weight="800">✓ 위(Wee) 클래스 상담실</text>
          <text x="425" y="362" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">비밀보장 안전지대 · 회복·자문</text>
          <text x="425" y="378" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">이중잠금 · 90~120° 좌석</text>

          <g id="${uid}-fw-top" style="transition:transform 260ms cubic-bezier(0.23,1,0.32,1)">
            <line x1="280" y1="306" x2="280" y2="350" stroke="var(--viz-safe)" stroke-width="3.5" stroke-linecap="round"/>
          </g>
          <g id="${uid}-fw-bot" style="transition:transform 260ms cubic-bezier(0.23,1,0.32,1)">
            <line x1="280" y1="354" x2="280" y2="398" stroke="var(--viz-safe)" stroke-width="3.5" stroke-linecap="round"/>
          </g>
          <rect x="242" y="338" width="76" height="28" rx="14" fill="var(--viz-surface)" stroke="var(--viz-safe)" stroke-width="2"/>
          <text x="280" y="356" text-anchor="middle" fill="var(--viz-safe)" font-size="10.5" font-weight="800">방화벽 분리</text>
        </g>
      </svg>
    `;
    const layers = [0, 1, 2, 3].map((i) => container.querySelector(`[data-ch1-layer="${i}"]`));
    const p12 = container.querySelector(`#${uid}-p12`);
    const p23 = container.querySelector(`#${uid}-p23`);
    const fwTop = container.querySelector(`#${uid}-fw-top`);
    const fwBot = container.querySelector(`#${uid}-fw-bot`);

    return {
      updateBeat(beatIdx, _rawP, localT = 1) {
        const t = clamp01(localT);
        layers.forEach((el, idx) => {
          if (!el) return;
          const isCur = idx === beatIdx;
          const isPast = idx < beatIdx;
          el.style.opacity = isCur ? "1" : isPast ? "0.7" : "0.26";
          if (idx < 3) {
            const lift = isCur ? -lerp(2, 8, t) : 0;
            el.style.transform = `translateY(${lift.toFixed(1)}px)`;
          }
        });
        if (p12) p12.style.strokeDashoffset = beatIdx >= 1 ? "0" : (1 - t * 0.4).toFixed(2);
        if (p23) p23.style.strokeDashoffset = beatIdx >= 2 ? "0" : "0.75";
        if (fwTop && fwBot) {
          const offset = beatIdx === 3 ? lerp(18, 0, t) : 18;
          fwTop.style.transform = `translateY(-${offset.toFixed(1)}px)`;
          fwBot.style.transform = `translateY(${offset.toFixed(1)}px)`;
        }
      },
    };
  }

  function mountCh2PinnedSvg(container) {
    const uid = nextUid();
    const scanXs = [105, 220, 345, 470];
    const stageLabels = [
      { age: "만 6~8세 (초저)", cog: "전조작 → 구체적 조작", zpd: "놀이·사적언어 비계", ego: "근면성 첫 숙달" },
      { age: "만 9~12세 (초고)", cog: "구체적 조작 안정", zpd: "내적 자기교시 내면화", ego: "또래·잠복기 승화" },
      { age: "만 13~15세 (중등)", cog: "형식적 조작 입문", zpd: "상상적 청중 · 개인적 우화", ego: "변연계 >> 전두엽 격차!" },
      { age: "만 16~18세 (고등)", cog: "형식적 조작 정교화", zpd: "유실 vs 유예 정체감", ego: "전두엽 통합 · 성취" },
    ];

    function limbicY(x) {
      const u = clamp01((x - 70) / 425);
      // Peaks sharply around middle school (u ~ 0.65)
      return 230 - 144 * Math.exp(-Math.pow((u - 0.66) / 0.27, 2)) - 42 * u;
    }
    function prefrontalY(x) {
      const u = clamp01((x - 70) / 425);
      return 258 - 154 * Math.pow(u, 1.15);
    }

    const limbicPts = [];
    const pfcPts = [];
    for (let x = 70; x <= 495; x += 15) {
      limbicPts.push(`${x},${limbicY(x).toFixed(1)}`);
      pfcPts.push(`${x},${prefrontalY(x).toFixed(1)}`);
    }

    container.innerHTML = `
      <svg viewBox="${VIZ_CONST.VIEWBOX_STAGE}" class="theater-svg viz-svg" role="img" aria-label="제02장 만 6세에서 18세까지 변연계와 전두엽 성숙 및 6대 발달이론 동기화 그래프">
        <rect x="24" y="24" width="512" height="290" rx="16" fill="var(--viz-canvas)" stroke="var(--viz-keyline)"/>
        <line x1="60" y1="96" x2="500" y2="96" stroke="var(--viz-grid)"/>
        <line x1="60" y1="168" x2="500" y2="168" stroke="var(--viz-grid)"/>
        <line x1="60" y1="242" x2="500" y2="242" stroke="var(--viz-grid)"/>

        <!-- Developmental gap highlight around middle school -->
        <rect id="${uid}-gap-band" x="285" y="64" width="120" height="196" rx="12" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-dasharray="4 3" style="transition:opacity 240ms ease"/>
        <text x="345" y="54" text-anchor="middle" fill="var(--viz-critical)" font-size="10" font-weight="800">충동–통제 최대 격차 구간</text>

        <!-- Curves -->
        <polyline points="${limbicPts.join(" ")}" fill="none" stroke="var(--viz-warn)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="200" y="106" text-anchor="middle" fill="var(--viz-warn)" font-size="11" font-weight="800">변연계 정서 반응성</text>

        <polyline points="${pfcPts.join(" ")}" fill="none" stroke="var(--viz-primary)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="454" y="92" text-anchor="middle" fill="var(--viz-primary)" font-size="11" font-weight="800">전두엽 실행 통제</text>

        <!-- Age ticks -->
        <g fill="var(--viz-ink-sub)" font-size="10.5" font-weight="700" text-anchor="middle">
          <text x="105" y="294">6~8세 (초저)</text>
          <text x="220" y="294">9~12세 (초고)</text>
          <text x="345" y="294">13~15세 (중등)</text>
          <text x="470" y="294">16~18세 (고등)</text>
        </g>

        <!-- Continuous Scrub Scanner + Live Tracking Dots -->
        <g id="${uid}-scanner">
          <line id="${uid}-scan-line" x1="105" y1="44" x2="105" y2="275" stroke="var(--viz-safe)" stroke-width="2.4"/>
          <line id="${uid}-gap-ruler" x1="105" y1="200" x2="105" y2="250" stroke="var(--viz-critical)" stroke-width="3" stroke-dasharray="3 2"/>
          <circle id="${uid}-dot-lim" cx="105" cy="215" r="5.5" fill="var(--viz-warn)" stroke="#ffffff" stroke-width="1.5"/>
          <circle id="${uid}-dot-pfc" cx="105" cy="250" r="5.5" fill="var(--viz-primary)" stroke="#ffffff" stroke-width="1.5"/>
          <circle id="${uid}-dot-top" cx="105" cy="44" r="4.5" fill="var(--viz-safe)"/>
        </g>

        <!-- Telemetry Footer HUD inside SVG -->
        <rect x="24" y="328" width="512" height="72" rx="14" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="1.4"/>
        <text id="${uid}-tel-age" x="44" y="353" fill="var(--viz-ink)" font-size="13" font-weight="800"></text>
        <text id="${uid}-tel-cog" x="44" y="378" fill="var(--viz-primary)" font-size="11.5" font-weight="700"></text>
        <text id="${uid}-tel-zpd" x="516" y="353" text-anchor="end" fill="var(--viz-safe)" font-size="11.5" font-weight="800"></text>
        <text id="${uid}-tel-ego" x="516" y="378" text-anchor="end" fill="var(--viz-warn)" font-size="11.5" font-weight="700"></text>
      </svg>
    `;

    const scanLine = container.querySelector(`#${uid}-scan-line`);
    const gapRuler = container.querySelector(`#${uid}-gap-ruler`);
    const dotLim = container.querySelector(`#${uid}-dot-lim`);
    const dotPfc = container.querySelector(`#${uid}-dot-pfc`);
    const dotTop = container.querySelector(`#${uid}-dot-top`);
    const gapBand = container.querySelector(`#${uid}-gap-band`);
    const tAge = container.querySelector(`#${uid}-tel-age`);
    const tCog = container.querySelector(`#${uid}-tel-cog`);
    const tZpd = container.querySelector(`#${uid}-tel-zpd`);
    const tEgo = container.querySelector(`#${uid}-tel-ego`);

    return {
      updateBeat(beatIdx, rawProgress, localT = 1) {
        const idx = Math.max(0, Math.min(3, beatIdx));
        const info = stageLabels[idx];
        const xPos = localT >= 0.99 ? scanXs[idx] : lerp(scanXs[0], scanXs[3], rawProgress ?? idx / 3);
        const yLim = limbicY(xPos);
        const yPfc = prefrontalY(xPos);

        if (scanLine) {
          scanLine.setAttribute("x1", xPos.toFixed(1));
          scanLine.setAttribute("x2", xPos.toFixed(1));
        }
        if (dotTop) dotTop.setAttribute("cx", xPos.toFixed(1));
        if (dotLim) {
          dotLim.setAttribute("cx", xPos.toFixed(1));
          dotLim.setAttribute("cy", yLim.toFixed(1));
        }
        if (dotPfc) {
          dotPfc.setAttribute("cx", xPos.toFixed(1));
          dotPfc.setAttribute("cy", yPfc.toFixed(1));
        }
        if (gapRuler) {
          gapRuler.setAttribute("x1", xPos.toFixed(1));
          gapRuler.setAttribute("x2", xPos.toFixed(1));
          gapRuler.setAttribute("y1", Math.min(yLim, yPfc).toFixed(1));
          gapRuler.setAttribute("y2", Math.max(yLim, yPfc).toFixed(1));
        }
        if (gapBand) gapBand.style.opacity = idx === 2 ? "1" : "0.24";
        if (tAge) tAge.textContent = info.age;
        if (tCog) tCog.textContent = `인지: ${info.cog}`;
        if (tZpd) tZpd.textContent = `ZPD: ${info.zpd}`;
        if (tEgo) tEgo.textContent = info.ego;
      },
    };
  }

  function mountCh3PinnedSvg(container) {
    const uid = nextUid();
    container.innerHTML = `
      <svg viewBox="${VIZ_CONST.VIEWBOX_STAGE}" class="theater-svg viz-svg" role="img" aria-label="제03장 윤리 형량 저울 및 고위기 법적 신고 결정 회로">
        ${SvgKit.defs(uid)}
        <rect x="14" y="14" width="532" height="392" rx="18" fill="var(--viz-canvas)" stroke="var(--viz-keyline)" stroke-width="1"/>

        <!-- Gate 1: Dual Consent -->
        <g data-c3="0" style="transition:opacity 240ms ease">
          <rect x="52" y="28" width="200" height="54" rx="12" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="1.8"/>
          <text x="152" y="51" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">학생 승낙 (Assent)</text>
          <text x="152" y="69" text-anchor="middle" fill="var(--viz-primary)" font-size="10">비밀보장 한계 발달 맞춤 고지</text>

          <rect x="308" y="28" width="200" height="54" rx="12" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="1.8"/>
          <text x="408" y="51" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">법정대리인 사전동의</text>
          <text x="408" y="69" text-anchor="middle" fill="var(--viz-primary)" font-size="10">이중 동의 · 교육적 협력 합의</text>
          <path d="M 152 82 L 280 116 L 408 82" fill="none" stroke="var(--viz-primary)" stroke-width="2"/>
        </g>

        <!-- Gate 2: Kitchener Balance Scale -->
        <g data-c3="1" style="transition:opacity 240ms ease">
          <polygon points="280,122 268,158 292,158" fill="var(--viz-keyline)"/>
          <g id="${uid}-beam" style="transform-origin:280px 132px;transition:transform 260ms cubic-bezier(0.23,1,0.32,1)">
            <line x1="128" y1="132" x2="432" y2="132" stroke="var(--viz-ink)" stroke-width="3"/>
            <rect x="54" y="142" width="142" height="44" rx="10" fill="var(--viz-surface-alt)" stroke="var(--viz-keyline)" stroke-dasharray="4 3"/>
            <text x="125" y="161" text-anchor="middle" fill="var(--viz-ink)" font-size="11" font-weight="700">자율성 · 충실</text>
            <text x="125" y="177" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">(원칙적 비밀보장)</text>

            <rect x="364" y="142" width="142" height="44" rx="10" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-width="2"/>
            <text x="435" y="161" text-anchor="middle" fill="var(--viz-critical)" font-size="11.5" font-weight="800">! 비유해성 최우선</text>
            <text x="435" y="177" text-anchor="middle" fill="var(--viz-ink)" font-size="9.5">(생명·신체 안전 수호)</text>
          </g>
        </g>

        <!-- Gate 3: 3 Legal Immediate Circuits (Draw on Beat 2) -->
        <g data-c3="2" style="transition:opacity 240ms ease">
          <path id="${uid}-circ-l" d="M 435 190 L 435 214 L 106 238" fill="none" stroke="var(--viz-critical)" stroke-width="2.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>
          <path id="${uid}-circ-m" d="M 435 190 L 435 214 L 280 238" fill="none" stroke="var(--viz-warn)" stroke-width="2.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>
          <path id="${uid}-circ-r" d="M 435 190 L 435 214 L 454 238" fill="none" stroke="var(--viz-critical)" stroke-width="2.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>

          <rect x="30" y="242" width="152" height="68" rx="12" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-width="1.8"/>
          <text x="106" y="264" text-anchor="middle" fill="var(--viz-critical)" font-size="11.5" font-weight="800">자살·자해 고위기</text>
          <text x="106" y="282" text-anchor="middle" fill="var(--viz-ink)" font-size="10">홀로 방치 절대 금지</text>
          <text x="106" y="298" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">보호자 대면 안전 인계</text>

          <rect x="204" y="242" width="152" height="68" rx="12" fill="var(--viz-warn-soft)" stroke="var(--viz-warn)" stroke-width="1.8"/>
          <text x="280" y="264" text-anchor="middle" fill="var(--viz-warn)" font-size="11.5" font-weight="800">Tarasoff 타해 위험</text>
          <text x="280" y="282" text-anchor="middle" fill="var(--viz-ink)" font-size="10">구체·식별·임박 시</text>
          <text x="280" y="298" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">잠재피해자 경고·보호</text>

          <rect x="378" y="242" width="152" height="68" rx="12" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-width="1.8"/>
          <text x="454" y="264" text-anchor="middle" fill="var(--viz-critical)" font-size="11.5" font-weight="800">아동학대 즉시 신고</text>
          <text x="454" y="282" text-anchor="middle" fill="var(--viz-ink)" font-size="10">의심만으로 즉시 112</text>
          <text x="454" y="298" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">교장 결재 지연 위법</text>
        </g>

        <!-- Gate 4: Vault & Self-Care -->
        <g data-c3="3" style="transition:opacity 240ms ease">
          <rect x="44" y="330" width="472" height="60" rx="14" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="1.8"/>
          <text x="280" y="354" text-anchor="middle" fill="var(--viz-safe)" font-size="12" font-weight="800">✓ 단독소유기록 이중잠금 분리 + 최소 정보 공유</text>
          <text x="280" y="375" text-anchor="middle" fill="var(--viz-ink)" font-size="10.5">소진 · 공감피로(STS) · 대리외상(VT) 조기 변별 &amp; 동료 수퍼비전</text>
        </g>
      </svg>
    `;

    const groups = [0, 1, 2, 3].map((i) => container.querySelector(`[data-c3="${i}"]`));
    const beam = container.querySelector(`#${uid}-beam`);
    const circs = ["l", "m", "r"].map((k) => container.querySelector(`#${uid}-circ-${k}`));

    return {
      updateBeat(beatIdx, _rawP, localT = 1) {
        const t = clamp01(localT);
        groups.forEach((g, i) => {
          if (g) g.style.opacity = i === beatIdx ? "1" : i < beatIdx ? "0.66" : "0.24";
        });
        if (beam) {
          const deg = beatIdx === 0 ? 0 : beatIdx === 1 ? lerp(0, 9, t) : 9;
          beam.style.transform = `rotate(${deg.toFixed(1)}deg)`;
        }
        circs.forEach((c) => {
          if (!c) return;
          const off = beatIdx > 2 ? 0 : beatIdx === 2 ? 1 - t : 0.85;
          c.style.strokeDashoffset = off.toFixed(2);
        });
      },
    };
  }

  function mountCh4PinnedSvg(container) {
    const uid = nextUid();
    container.innerHTML = `
      <svg viewBox="${VIZ_CONST.VIEWBOX_STAGE}" class="theater-svg viz-svg" role="img" aria-label="제04장 45분 단회학생상담 크로노미터와 167시간 일상 전이 아크">
        ${SvgKit.defs(uid)}
        <rect x="14" y="14" width="532" height="392" rx="18" fill="var(--viz-canvas)" stroke="var(--viz-keyline)" stroke-width="1"/>

        <!-- Outer 167h orbit -->
        <g data-c4="2" style="transition:opacity 280ms ease">
          <circle cx="220" cy="212" r="154" fill="none" stroke="var(--viz-safe)" stroke-width="1.8" stroke-dasharray="7 5" opacity="0.55"/>
          <text x="278" y="42" text-anchor="middle" fill="var(--viz-safe)" font-size="11.5" font-weight="800">주 1시간 상담실 → 교실·가정 167시간 행동 실험 전이</text>
        </g>

        <!-- Chronometer base + progress ring -->
        <circle cx="220" cy="212" r="118" fill="var(--viz-surface)" stroke="var(--viz-grid)" stroke-width="2"/>
        <circle id="${uid}-prog-ring" cx="220" cy="212" r="126" fill="none" stroke="var(--viz-primary)" stroke-width="3.5" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 220 212)" stroke-linecap="round"/>

        <!-- 4 Quadrant Arcs -->
        <g data-c4="0" style="transition:opacity 240ms ease">
          <path d="M 220 212 L 220 94 A 118 118 0 0 1 338 212 Z" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="2"/>
          <text x="272" y="158" text-anchor="middle" fill="var(--viz-ink)" font-size="11" font-weight="800">1. 접수·MMSE</text>
          <text x="272" y="174" text-anchor="middle" fill="var(--viz-primary)" font-size="10">5~8분 · 동맹</text>
        </g>

        <g data-c4="1" style="transition:opacity 240ms ease">
          <path d="M 220 212 L 338 212 A 118 118 0 0 1 220 330 Z" fill="var(--viz-depth-soft)" stroke="var(--viz-depth)" stroke-width="2"/>
          <text x="272" y="264" text-anchor="middle" fill="var(--viz-ink)" font-size="11" font-weight="800">2. 미시기술</text>
          <text x="272" y="280" text-anchor="middle" fill="var(--viz-depth)" font-size="10">SOLER·반영·직면</text>
        </g>

        <g data-c4="2" style="transition:opacity 240ms ease">
          <path d="M 220 212 L 220 330 A 118 118 0 0 1 102 212 Z" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="2"/>
          <text x="168" y="264" text-anchor="middle" fill="var(--viz-ink)" font-size="11" font-weight="800">3. 예외·통합</text>
          <text x="168" y="280" text-anchor="middle" fill="var(--viz-safe)" font-size="10">WDEP·행동실험</text>
        </g>

        <g data-c4="3" style="transition:opacity 240ms ease">
          <path d="M 220 212 L 102 212 A 118 118 0 0 1 220 94 Z" fill="var(--viz-warn-soft)" stroke="var(--viz-warn)" stroke-width="2"/>
          <text x="168" y="158" text-anchor="middle" fill="var(--viz-ink)" font-size="11" font-weight="800">4. 실행 리허설</text>
          <text x="168" y="174" text-anchor="middle" fill="var(--viz-warn)" font-size="10">5~7분 · DAP·추수</text>
        </g>

        <!-- Sweep Hand + Center Hub -->
        <g id="${uid}-hand" style="transform-origin:220px 212px">
          <line x1="220" y1="212" x2="220" y2="112" stroke="var(--viz-ink)" stroke-width="2.6" stroke-linecap="round"/>
          <circle cx="220" cy="112" r="4" fill="var(--viz-safe)"/>
        </g>
        <circle cx="220" cy="212" r="34" fill="var(--viz-canvas)" stroke="var(--viz-keyline)" stroke-width="1.8"/>
        <text x="220" y="208" text-anchor="middle" fill="var(--viz-ink)" font-size="13" font-weight="800">45분</text>
        <text x="220" y="224" text-anchor="middle" fill="var(--viz-primary)" font-size="9.5" font-weight="700">단회/회기</text>

        <!-- Transfer Arcs to 167h Contexts -->
        <path id="${uid}-arc1" d="M 332 165 Q 374 140 404 148" fill="none" stroke="var(--viz-safe)" stroke-width="2" pathLength="1" stroke-dasharray="1" marker-end="url(#${uid}-arr-safe)"/>
        <path id="${uid}-arc2" d="M 342 212 L 404 212" fill="none" stroke="var(--viz-safe)" stroke-width="2" pathLength="1" stroke-dasharray="1" marker-end="url(#${uid}-arr-safe)"/>
        <path id="${uid}-arc3" d="M 332 258 Q 374 282 404 276" fill="none" stroke="var(--viz-safe)" stroke-width="2" pathLength="1" stroke-dasharray="1" marker-end="url(#${uid}-arr-safe)"/>

        <!-- Right 167h Telemetry Panel -->
        <rect x="408" y="106" width="124" height="214" rx="14" fill="var(--viz-surface)" stroke="var(--viz-keyline)"/>
        <text x="470" y="132" text-anchor="middle" fill="var(--viz-ink)" font-size="11.5" font-weight="800">167h 전이 맥락</text>
        <text x="470" y="154" text-anchor="middle" fill="var(--viz-safe)" font-size="10.5" font-weight="700">• 교실 자리 실천</text>
        <text x="470" y="176" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">• 또래 대화 실험</text>
        <text x="470" y="198" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">• 가정 정서조절</text>
        <line x1="422" y1="214" x2="518" y2="214" stroke="var(--viz-grid)"/>
        <text x="470" y="236" text-anchor="middle" fill="var(--viz-primary)" font-size="11" font-weight="800">작업동맹 3축</text>
        <text x="470" y="254" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">목표 · 과제 · 유대</text>
        <text x="470" y="280" text-anchor="middle" fill="var(--viz-warn)" font-size="11" font-weight="800">동기 3차원</text>
        <text x="470" y="298" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">Want · Conf · Ready</text>
      </svg>
    `;

    const ring = container.querySelector(`#${uid}-prog-ring`);
    const hand = container.querySelector(`#${uid}-hand`);
    const arcs = ["arc1", "arc2", "arc3"].map((k) => container.querySelector(`#${uid}-${k}`));

    return {
      updateBeat(beatIdx, rawProgress, localT = 1) {
        const t = clamp01(localT);
        const totalFrac = clamp01((beatIdx + t) / 4);
        const deg = Math.max(45, lerp(45, 360, rawProgress ?? totalFrac));
        container.querySelectorAll("[data-c4]").forEach((el) => {
          const match = parseInt(el.dataset.c4, 10) === beatIdx;
          el.style.opacity = match ? "1" : "0.30";
        });
        if (ring) ring.style.strokeDashoffset = (1 - Math.max(0.25, totalFrac)).toFixed(2);
        if (hand) hand.style.transform = `rotate(${deg.toFixed(1)}deg)`;
        arcs.forEach((a) => {
          if (!a) return;
          const off = beatIdx >= 2 ? 0 : 0.72;
          a.style.strokeDashoffset = off.toFixed(2);
        });
      },
    };
  }

  function mountCh5PinnedSvg(container) {
    const uid = nextUid();
    const nodes = [
      { label: "5.1 아들러", sub: "그릇된 4목표·격려", x: 432, y: 72, cluster: 0, color: "var(--viz-primary)" },
      { label: "5.2 행동·사회인지", sub: "FBA·자기효능감", x: 432, y: 128, cluster: 1, color: "var(--viz-safe)" },
      { label: "5.3 로저스 인간중심", sub: "3대 태도·가치조건", x: 432, y: 184, cluster: 2, color: "var(--viz-depth)" },
      { label: "5.4 펄스 게슈탈트", sub: "접촉혼란·빈의자", x: 432, y: 236, cluster: 2, color: "var(--viz-depth)" },
      { label: "5.5 REBT · 5.6 벡 CT", sub: "당위논박 · 인지3위계", x: 432, y: 292, cluster: 3, color: "var(--viz-warn)" },
      { label: "5.7 현실 · 5.8 중다 · 5.9 강점", sub: "WDEP · BASIC · VIA 24", x: 432, y: 344, cluster: 3, color: "var(--viz-warn)" },
    ];
    const centerLabels = [
      "아들러 렌즈: 교사 분노/무기력 → 힘·무능 목표 진단",
      "행동 렌즈: 수업 회피 부적 강화 고리 & 숙달 경험",
      "현상학 렌즈: 조건 없는 수용 & 지금-여기 알아차림",
      "통합 렌즈: 당위·독심술 검증 · 앞바퀴 조향 · 강점 점화",
    ];
    container.innerHTML = `
      <svg viewBox="${VIZ_CONST.VIEWBOX_STAGE}" class="theater-svg viz-svg" role="img" aria-label="제05장 공통 사례를 9대 상담이론으로 분광하는 광학 프리즘 맵">
        ${SvgKit.defs(uid)}
        <rect x="14" y="14" width="532" height="392" rx="18" fill="var(--viz-canvas)" stroke="var(--viz-keyline)" stroke-width="1"/>

        <!-- Incident Beam -->
        <rect x="26" y="168" width="126" height="72" rx="14" fill="var(--viz-surface)" stroke="var(--viz-primary)" stroke-width="2"/>
        <text x="89" y="198" text-anchor="middle" fill="var(--viz-ink)" font-size="11.5" font-weight="800">공통 학교 사례</text>
        <text x="89" y="218" text-anchor="middle" fill="var(--viz-primary)" font-size="10">무기력 · 지각 · 회피</text>
        <line x1="152" y1="204" x2="212" y2="204" stroke="var(--viz-primary)" stroke-width="3.2" marker-end="url(#${uid}-arr-pri)"/>

        <!-- Central Optical Prism -->
        <polygon points="244,124 304,204 244,284 206,204" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="2.2"/>
        <text x="250" y="199" text-anchor="middle" fill="var(--viz-ink)" font-size="11" font-weight="800">9대 이론</text>
        <text x="250" y="215" text-anchor="middle" fill="var(--viz-primary)" font-size="9.5" font-weight="700">개념화 프리즘</text>

        <!-- Refracted Rays & Target Nodes -->
        ${nodes
          .map(
            (n, i) => `
          <g data-cluster="${n.cluster}" style="transition:opacity 240ms ease">
            <path class="${uid}-ray" data-ray-cluster="${n.cluster}" d="M 294 204 Q 332 ${lerp(204, n.y, 0.45).toFixed(0)} 348 ${n.y}" fill="none" stroke="${n.color}" stroke-width="2.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>
            <rect x="350" y="${n.y - 21}" width="176" height="42" rx="11" fill="var(--viz-surface)" stroke="${n.color}" stroke-width="1.8"/>
            <text x="438" y="${n.y - 2}" text-anchor="middle" fill="var(--viz-ink)" font-size="10.8" font-weight="800">${esc(n.label)}</text>
            <text x="438" y="${n.y + 13}" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.2">${esc(n.sub)}</text>
          </g>
        `
          )
          .join("")}

        <!-- Bottom Lens Readout -->
        <rect x="26" y="370" width="500" height="28" rx="9" fill="var(--viz-surface-alt)" stroke="var(--viz-keyline)" stroke-width="1"/>
        <text id="${uid}-sub" x="276" y="388" text-anchor="middle" fill="var(--viz-primary)" font-size="10.5" font-weight="800"></text>
      </svg>
    `;
    const subTxt = container.querySelector(`#${uid}-sub`);
    const rays = Array.from(container.querySelectorAll(`.${uid}-ray`));

    return {
      updateBeat(beatIdx, _rawP, localT = 1) {
        const t = clamp01(localT);
        container.querySelectorAll("[data-cluster]").forEach((el) => {
          el.style.opacity = parseInt(el.dataset.cluster, 10) === beatIdx ? "1" : "0.24";
        });
        rays.forEach((r) => {
          const match = parseInt(r.dataset.rayCluster, 10) === beatIdx;
          r.style.strokeDashoffset = match ? (1 - Math.max(0.25, t)).toFixed(2) : "0";
        });
        if (subTxt) subTxt.textContent = centerLabels[beatIdx] || centerLabels[0];
      },
    };
  }

  function mountCh6PinnedSvg(container) {
    const uid = nextUid();
    const members = [
      { id: "L", label: "리더 L", x: 280, y: 112, leader: true },
      { id: "M1", label: "M1", x: 175, y: 156 },
      { id: "M2", label: "M2", x: 385, y: 156 },
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
      <svg viewBox="${VIZ_CONST.VIEWBOX_STAGE}" class="theater-svg viz-svg" role="img" aria-label="제06장 집단상담 소시오그램 발달단계 및 학급단위 확산 도식">
        <rect x="14" y="14" width="532" height="392" rx="18" fill="var(--viz-canvas)" stroke="var(--viz-keyline)" stroke-width="1"/>

        <!-- Tier 1 Classroom Diffusion (Beat 3) -->
        <g data-c6="3" style="transition:opacity 280ms ease">
          <ellipse id="${uid}-tier1-ring" cx="280" cy="216" rx="236" ry="170" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="2" stroke-dasharray="6 4"/>
          <text x="280" y="396" text-anchor="middle" fill="var(--viz-safe)" font-size="11.5" font-weight="800">TIER 1 확산 · 민주적 학급회의 &amp; 아들러식 격려 (직무의 15~25%)</text>
        </g>

        <!-- Stage 1: Radial Spokes to Leader (Beat 0) -->
        <g data-c6="0" style="transition:opacity 240ms ease">
          ${students
            .map(
              (m) =>
                `<line class="${uid}-spoke" x1="${m.x}" y1="${m.y}" x2="280" y2="112" stroke="var(--viz-primary)" stroke-width="2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>`
            )
            .join("")}
          <text x="280" y="50" text-anchor="middle" fill="var(--viz-primary)" font-size="11.5" font-weight="800">초기단계: 모든 시선·질문이 리더(L)에게 집중되는 방사형 의존</text>
        </g>

        <!-- Stage 2: Transition Conflict & Blocking Shield (Beat 1) -->
        <g data-c6="1" style="transition:opacity 240ms ease">
          <line x1="175" y1="156" x2="385" y2="156" stroke="var(--viz-critical)" stroke-width="2.6" stroke-dasharray="5 3"/>
          <g id="${uid}-shield" style="transition:transform 260ms cubic-bezier(0.23,1,0.32,1)">
            <path d="M 280 124 L 280 232" stroke="var(--viz-primary)" stroke-width="3.6" stroke-linecap="round"/>
            <rect x="206" y="192" width="148" height="32" rx="16" fill="var(--viz-surface)" stroke="var(--viz-primary)" stroke-width="2"/>
            <text x="280" y="212" text-anchor="middle" fill="var(--viz-primary)" font-size="11" font-weight="800">차단하기(Blocking) 개입</text>
          </g>
          <text x="280" y="50" text-anchor="middle" fill="var(--viz-critical)" font-size="11.5" font-weight="800">과도기: 비난·독점·속죄양 갈등 출현 시 안전 차단</text>
        </g>

        <!-- Stage 3: Horizontal Linking Mesh (Beat 2) -->
        <g data-c6="2" style="transition:opacity 240ms ease">
          ${peerLinks
            .map(
              ([a, b]) =>
                `<line class="${uid}-mesh" x1="${members[a].x}" y1="${members[a].y}" x2="${members[b].x}" y2="${members[b].y}" stroke="var(--viz-safe)" stroke-width="2.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>`
            )
            .join("")}
          <text x="280" y="50" text-anchor="middle" fill="var(--viz-safe)" font-size="11.5" font-weight="800">작업단계: 연결짓기(Linking) 수평 그물망 &amp; Yalom 응집력</text>
        </g>

        <!-- Member Nodes -->
        ${members
          .map(
            (m) => `
          <g>
            <circle cx="${m.x}" cy="${m.y}" r="${m.leader ? 23 : 19}" fill="${m.leader ? "var(--viz-primary)" : "var(--viz-surface)"}" stroke="${m.leader ? "#ffffff" : "var(--viz-keyline)"}" stroke-width="2"/>
            <text x="${m.x}" y="${m.y + 4}" text-anchor="middle" fill="${m.leader ? "#ffffff" : "var(--viz-ink)"}" font-size="11.5" font-weight="800">${esc(m.label)}</text>
          </g>`
          )
          .join("")}
      </svg>
    `;

    const spokes = Array.from(container.querySelectorAll(`.${uid}-spoke`));
    const mesh = Array.from(container.querySelectorAll(`.${uid}-mesh`));
    const shield = container.querySelector(`#${uid}-shield`);

    return {
      updateBeat(beatIdx, _rawP, localT = 1) {
        const t = clamp01(localT);
        container.querySelectorAll("[data-c6]").forEach((el) => {
          const idx = parseInt(el.dataset.c6, 10);
          el.style.opacity = idx === beatIdx ? "1" : "0.14";
        });
        spokes.forEach((s) => {
          s.style.strokeDashoffset = beatIdx === 0 ? (1 - Math.max(0.3, t)).toFixed(2) : "0";
        });
        if (shield) {
          const dy = beatIdx === 1 ? lerp(-20, 0, t) : 0;
          shield.style.transform = `translateY(${dy.toFixed(1)}px)`;
        }
        mesh.forEach((l, i) => {
          const frac = clamp01((t - i * 0.06) / 0.45);
          l.style.strokeDashoffset = beatIdx === 2 ? (1 - Math.max(0.25, frac)).toFixed(2) : "0";
        });
      },
    };
  }

  /* ==========================================================================
     PART 2. Declarative Section-Level Topology Studios (18 Widgets)
     ========================================================================== */

  function renderCh1Spectrum(container, ch) {
    const items = (ch.diagrams && ch.diagrams.spectrum) || [];
    if (!items.length) return;
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "CONTINUUM TRACK · 표 1-1 비교",
      "생활지도 · 학교상담 · 심리치료 3축 연속선",
      "비교 차원을 선택하거나 SVG 상의 3개 영역 브래킷을 확인해 조력 연속선의 경계를 파악하세요.",
      `
        <div class="viz-ctrl-bar">${items.map((s) => `<button type="button" class="viz-ctrl-pill" data-chip="${esc(s.id)}">${esc(s.dim)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    SvgKit.bindSegmentedControls(body, "[data-chip]", items[0].id, (id) => {
      const r = items.find((x) => x.id === id) || items[0];
      const z = r.zones || { guidance: [18, 28], counseling: [50, 34], therapy: [82, 28] };
      const mapX = (pct) => 56 + (pct / 100) * 528;
      const drawZone = (cxPct, wPct, label, sub, tone) => {
        const w = (wPct / 100) * 528;
        const x = mapX(cxPct) - w / 2;
        const col = tone === "primary" ? "var(--viz-primary)" : tone === "depth" ? "var(--viz-depth)" : "var(--viz-safe)";
        const soft = tone === "primary" ? "var(--viz-primary-soft)" : tone === "depth" ? "var(--viz-depth-soft)" : "var(--viz-safe-soft)";
        return `
          <rect x="${x.toFixed(1)}" y="84" width="${w.toFixed(1)}" height="78" rx="${VIZ_CONST.NODE_RX}" fill="${soft}" stroke="${col}" stroke-width="2"/>
          <circle cx="${mapX(cxPct).toFixed(1)}" cy="62" r="7" fill="${col}" stroke="#ffffff" stroke-width="2"/>
          <line x1="${mapX(cxPct).toFixed(1)}" y1="69" x2="${mapX(cxPct).toFixed(1)}" y2="84" stroke="${col}" stroke-width="2"/>
          <text x="${mapX(cxPct).toFixed(1)}" y="112" text-anchor="middle" fill="var(--viz-ink)" font-size="13" font-weight="800">${esc(label)}</text>
          <text x="${mapX(cxPct).toFixed(1)}" y="136" text-anchor="middle" fill="${col}" font-size="10.5" font-weight="700">${esc(sub)}</text>
        `;
      };

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 215" class="viz-svg" role="img" aria-label="${esc(r.dim)} 기준 조력 연속선">
          ${SvgKit.defs(uid)}
          <text x="320" y="28" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="11" font-weight="700">비교 차원: ${esc(r.dim)}</text>
          <line x1="56" y1="62" x2="584" y2="62" stroke="var(--viz-keyline)" stroke-width="4" stroke-linecap="round"/>
          <line x1="56" y1="62" x2="584" y2="62" stroke="var(--viz-primary)" stroke-width="2" marker-start="url(#${uid}-arr-muted)" marker-end="url(#${uid}-arr-pri)"/>
          <text x="56" y="44" text-anchor="start" fill="var(--viz-safe)" font-size="11" font-weight="800">◀ ${esc(r.leftPole || "보편 예방")}</text>
          <text x="584" y="44" text-anchor="end" fill="var(--viz-depth)" font-size="11" font-weight="800">${esc(r.rightPole || "임상 치유")} ▶</text>

          ${drawZone(z.guidance[0], z.guidance[1], "생활지도", "보편·정보·수업", "safe")}
          ${drawZone(z.counseling[0], z.counseling[1], "학교상담 (Wee)", "지금-여기 적응 촉진", "primary")}
          ${drawZone(z.therapy[0], z.therapy[1], "심리치료", "임상 병리·심층", "depth")}

          <text x="320" y="192" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10.5">학교상담은 교육과정 예방(좌)과 임상 개입(우)을 연결하는 공교육 전문 허브입니다</text>
        </svg>
      `;

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-safe"><span class="viz-tel-kicker">✓ 보편 생활지도</span><h4>생활지도</h4><p>${esc(r.guidance)}</p></div>
          <div class="viz-tel-card is-primary"><span class="viz-tel-kicker">★ 공교육 핵심 허브</span><h4>학교상담</h4><p>${esc(r.counseling)}</p></div>
          <div class="viz-tel-card is-depth"><span class="viz-tel-kicker">◆ 전문 치료 연계</span><h4>심리치료</h4><p>${esc(r.therapy)}</p></div>
        </div>
      `;
    });
  }

  function renderCh1Timeline(container, ch) {
    const items = (ch.diagrams && ch.diagrams.timeline) || [];
    if (!items.length) return;
    const uid = nextUid();
    const xs = [110, 250, 390, 530];
    const body = SvgKit.mountStudioShell(
      container,
      "PARALLEL SWIMLANE · 표 1-3 제도 발전사",
      "한·미 학교상담 4기 평행 스윔레인 연표",
      "시대를 선택하거나 연표 노드를 클릭해 미국(ASCA)과 한국(교도교사→Wee→학맞통법)의 병행 진화를 비교하세요.",
      `
        <div class="viz-ctrl-bar">${items.map((t, i) => `<button type="button" class="viz-ctrl-pill" data-chip="t${i}">${esc(t.era)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function render(idx) {
      const item = items[idx] || items[0];
      stageEl.innerHTML = `
        <svg viewBox="${VIZ_CONST.VIEWBOX_WIDE}" class="viz-svg" role="img" aria-label="한미 학교상담 4기 평행 스윔레인 타임라인">
          ${SvgKit.defs(uid)}
          <!-- Swimlane tracks -->
          <rect x="20" y="28" width="600" height="86" rx="12" fill="var(--viz-surface)" stroke="var(--viz-keyline)"/>
          <text x="34" y="50" fill="var(--viz-ink-sub)" font-size="10.5" font-weight="800">미국 LANE (상향식 전문화)</text>
          <line x1="76" y1="80" x2="572" y2="80" stroke="var(--viz-keyline)" stroke-width="2.2" marker-end="url(#${uid}-arr-muted)"/>

          <rect x="20" y="132" width="600" height="86" rx="12" fill="var(--viz-surface)" stroke="var(--viz-keyline)"/>
          <text x="34" y="154" fill="var(--viz-primary)" font-size="10.5" font-weight="800">한국 LANE (법제 · Wee 안전망)</text>
          <line x1="76" y1="184" x2="572" y2="184" stroke="var(--viz-primary)" stroke-width="2.2" marker-end="url(#${uid}-arr-pri)"/>

          <!-- Cross-influence arrows -->
          <path d="M 110 94 L 110 166" fill="none" stroke="var(--viz-warn)" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#${uid}-arr-warn)"/>
          <path d="M 250 94 L 250 166" fill="none" stroke="var(--viz-warn)" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#${uid}-arr-warn)"/>
          <path d="M 390 94 L 390 166" fill="none" stroke="var(--viz-primary)" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#${uid}-arr-pri)"/>
          <path d="M 530 94 L 530 166" fill="none" stroke="var(--viz-safe)" stroke-width="1.8" marker-end="url(#${uid}-arr-safe)"/>

          <!-- Highlight column -->
          <rect x="${xs[idx] - 58}" y="22" width="116" height="202" rx="14" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="1.8" pointer-events="none"/>

          ${items
            .map((it, i) => {
              const active = i === idx;
              const x = xs[i];
              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="t${i}" aria-label="${esc(it.era)} 선택">
                  <rect x="${x - 50}" y="62" width="100" height="36" rx="10" fill="${active ? "var(--viz-depth)" : "var(--viz-surface-alt)"}" stroke="${active ? "var(--viz-depth)" : "var(--viz-keyline)"}" stroke-width="1.6"/>
                  <text x="${x}" y="84" text-anchor="middle" fill="${active ? "#ffffff" : "var(--viz-ink)"}" font-size="10.2" font-weight="800">${esc(shortLabel(it.usYears, 13))}</text>

                  <rect x="${x - 50}" y="166" width="100" height="36" rx="10" fill="${active ? "var(--viz-primary)" : "var(--viz-surface-alt)"}" stroke="${active ? "var(--viz-primary)" : "var(--viz-keyline)"}" stroke-width="1.6"/>
                  <text x="${x}" y="188" text-anchor="middle" fill="${active ? "#ffffff" : "var(--viz-ink)"}" font-size="10.2" font-weight="800">${esc(shortLabel(it.krYears, 13))}</text>

                  <text x="${x}" y="242" text-anchor="middle" fill="${active ? "var(--viz-primary)" : "var(--viz-ink-sub)"}" font-size="10.5" font-weight="800">${esc(it.era.split("·")[0].trim())}</text>
                </g>
              `;
            })
            .join("")}
        </svg>
      `;
      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-depth"><span class="viz-tel-kicker">미국 경로 · ${esc(item.era)}</span><h5>${esc(item.usYears)}</h5><p>${esc(item.usDesc)}</p></div>
          <div class="viz-tel-card is-primary"><span class="viz-tel-kicker">한국 경로 · ${esc(item.era)}</span><h5>${esc(item.krYears)}</h5><p>${esc(item.krDesc)}</p></div>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "t0", (cid) => {
      render(parseInt(cid.slice(1), 10) || 0);
    });
  }

  function renderCh1Floorplan(container) {
    const rooms = [
      { id: "ind", label: "① 개인상담실", tag: "슬래브 차음 · 120° 좌석 · 비상벨", spec: "천장 슬래브 밀폐 차음 · 방음문 · 90~120° 대각선 좌석 배치(권위 위계 완화) · 복수 탈출 동선 & 비상벨 · 「학교폭력예방법 시행령」 제15조 준수", tone: "primary" },
      { id: "grp", label: "② 집단·활동실", tag: "모듈형 원형 토의 · 가변 파티션", spec: "6~10명 원형 토의 가능 모듈형 책상/이동식 좌석 · 가변 파티션(소규모 교실 시 공간 겸용) · 역할극·매체 활동용 투사 교구 수납", tone: "depth" },
      { id: "test", label: "③ 심리검사·기록실", tag: "이중 잠금 캐비닛 · 개인정보 보호", spec: "외부 시선·소음 차단이 가능한 독립 책상 · 온라인·지면 검사 해석 구역 · 상담일지 및 검사 원자료 이중 잠금 캐비닛/암호화 PC", tone: "warn" },
      { id: "wait", label: "④ 접수·완충 대기", tag: "복도 직시 차단 · 동선 분리", spec: "복도 직시 차단 가림막(익명성 보호) · 선도실·교무실 인접 회피 입지 · 신청 포스트잇/QR·마음 쉼 책자 구비로 접근 용이성 극대화", tone: "safe" },
    ];
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "ARCHITECTURAL FLOORPLAN · 표 1-4 기준",
      "학교상담실 4대 기능 공간 & 보안·동선 평면도",
      "각 구역을 클릭해 차음벽·비상탈출 동선·시야 차단막·이중잠금 기준을 확인하세요.",
      `
        <div class="viz-ctrl-bar">${rooms.map((r) => `<button type="button" class="viz-ctrl-pill" data-chip="${r.id}">${esc(r.label)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(activeId) {
      const r = rooms.find((x) => x.id === activeId) || rooms[0];
      const isA = (id) => id === r.id;
      stageEl.innerHTML = `
        <svg viewBox="0 0 640 245" class="viz-svg" role="img" aria-label="학교상담실 4대 구획 건축 평면도">
          ${SvgKit.defs(uid)}
          <!-- Corridor outside -->
          <rect x="16" y="16" width="608" height="32" rx="6" fill="var(--viz-surface-alt)" stroke="var(--viz-grid)"/>
          <text x="150" y="36" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10.5" font-weight="700">학교 복도 (교무실·선도실과 원거리 배치)</text>
          <text x="530" y="36" text-anchor="middle" fill="var(--viz-safe)" font-size="10" font-weight="800">접근 동선 ↘</text>

          <!-- Zone 1: Individual Room (Soundproof double wall + 120° seats + emergency exit) -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="ind" aria-label="개인상담실 선택">
            <rect x="16" y="54" width="194" height="174" rx="12" fill="${isA("ind") ? "var(--viz-primary-soft)" : "var(--viz-surface)"}" stroke="${isA("ind") ? "var(--viz-primary)" : "var(--viz-keyline)"}" stroke-width="${isA("ind") ? "2.6" : "1.6"}"/>
            <rect x="20" y="58" width="186" height="166" rx="9" fill="none" stroke="var(--viz-primary)" stroke-dasharray="3 2" opacity="0.55"/>
            <text x="113" y="80" text-anchor="middle" fill="var(--viz-ink)" font-size="12.5" font-weight="800">① 개인상담실</text>
            <text x="113" y="96" text-anchor="middle" fill="var(--viz-primary)" font-size="9.5" font-weight="700">천장 슬래브 차음벽</text>
            <!-- 120° chairs -->
            <rect x="66" y="128" width="28" height="20" rx="5" fill="var(--viz-primary)" transform="rotate(-25 80 138)"/>
            <rect x="130" y="128" width="28" height="20" rx="5" fill="var(--viz-safe)" transform="rotate(25 144 138)"/>
            <text x="113" y="172" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">90~120° 대각선 좌석</text>
            <!-- Emergency exit -->
            <path d="M 113 188 L 113 220" stroke="var(--viz-critical)" stroke-width="2" stroke-dasharray="4 2" marker-end="url(#${uid}-arr-crit)"/>
            <text x="113" y="216" text-anchor="middle" fill="var(--viz-critical)" font-size="9" font-weight="800">복수 탈출문·비상벨</text>
          </g>

          <!-- Zone 2: Group Activity Room -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="grp" aria-label="집단활동실 선택">
            <rect x="220" y="54" width="194" height="174" rx="12" fill="${isA("grp") ? "var(--viz-depth-soft)" : "var(--viz-surface)"}" stroke="${isA("grp") ? "var(--viz-depth)" : "var(--viz-keyline)"}" stroke-width="${isA("grp") ? "2.6" : "1.6"}"/>
            <text x="317" y="80" text-anchor="middle" fill="var(--viz-ink)" font-size="12.5" font-weight="800">② 집단·활동실</text>
            <text x="317" y="96" text-anchor="middle" fill="var(--viz-depth)" font-size="9.5" font-weight="700">가변 방음 파티션</text>
            <!-- Round modular table + 6 seats -->
            <circle cx="317" cy="146" r="24" fill="var(--viz-depth-soft)" stroke="var(--viz-depth)" stroke-width="1.8"/>
            <circle cx="317" cy="114" r="6" fill="var(--viz-depth)"/>
            <circle cx="346" cy="130" r="6" fill="var(--viz-depth)"/>
            <circle cx="346" cy="162" r="6" fill="var(--viz-depth)"/>
            <circle cx="317" cy="178" r="6" fill="var(--viz-depth)"/>
            <circle cx="288" cy="162" r="6" fill="var(--viz-depth)"/>
            <circle cx="288" cy="130" r="6" fill="var(--viz-depth)"/>
            <text x="317" y="206" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">6~10명 원형 토의 모듈</text>
          </g>

          <!-- Zone 4: Reception & Buffer Corner (Top Right near corridor) -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="wait" aria-label="접수 완충 대기 코너 선택">
            <rect x="424" y="54" width="200" height="82" rx="12" fill="${isA("wait") ? "var(--viz-safe-soft)" : "var(--viz-surface)"}" stroke="${isA("wait") ? "var(--viz-safe)" : "var(--viz-keyline)"}" stroke-width="${isA("wait") ? "2.6" : "1.6"}"/>
            <text x="524" y="79" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">④ 접수·완충 대기</text>
            <path d="M 444 96 L 464 106 L 444 116 L 464 126" fill="none" stroke="var(--viz-safe)" stroke-width="2.2"/>
            <text x="536" y="106" text-anchor="middle" fill="var(--viz-safe)" font-size="9.5" font-weight="700">시선 차단 가림막</text>
            <text x="536" y="122" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">QR 신청 · 마음 쉼</text>
          </g>

          <!-- Zone 3: Testing & Vault Records (Bottom Right) -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="test" aria-label="심리검사 기록실 선택">
            <rect x="424" y="146" width="200" height="82" rx="12" fill="${isA("test") ? "var(--viz-warn-soft)" : "var(--viz-surface)"}" stroke="${isA("test") ? "var(--viz-warn)" : "var(--viz-keyline)"}" stroke-width="${isA("test") ? "2.6" : "1.6"}"/>
            <text x="524" y="172" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">③ 검사·이중잠금실</text>
            <rect x="444" y="186" width="160" height="28" rx="8" fill="var(--viz-warn-soft)" stroke="var(--viz-warn)" stroke-width="1.3"/>
            <text x="524" y="204" text-anchor="middle" fill="var(--viz-warn)" font-size="9.5" font-weight="800">🔒 개인정보법 제23조 분리보관</text>
          </g>
        </svg>
      `;
      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-${r.tone}">
            <span class="viz-tel-kicker">${esc(r.tag)}</span>
            <h5>${esc(r.label)} 설계 · 법적 기준</h5>
            <p>${esc(r.spec)}</p>
          </div>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "ind", draw);
  }

  function renderCh2Ages(container, ch) {
    const stages = (ch.diagrams && ch.diagrams.stages) || [];
    if (!stages.length) return;
    const uid = nextUid();
    const theorists = [
      { key: "havighurst", name: "하비거스트" },
      { key: "piaget", name: "피아제" },
      { key: "vygotsky", name: "비고츠키" },
      { key: "elkind", name: "엘킨드" },
      { key: "freud", name: "프로이트" },
      { key: "erikson", name: "에릭슨·마샤" },
    ];
    const colXs = [150, 265, 380, 495];
    const body = SvgKit.mountStudioShell(
      container,
      "SYNCHRONIZED MATRIX · 표 2-2 발달 맞춤 면담",
      "학령기~청소년기 6대 발달이론 동기화 스캐너",
      "학령 열(Column)을 클릭해 6대 발달이론의 핵심 초점과 맞춤 상담 매체를 한눈에 스캔하세요.",
      `
        <div class="viz-ctrl-bar">${stages.map((s) => `<button type="button" class="viz-ctrl-pill" data-chip="${esc(s.id)}">${esc(s.label)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(id) {
      const idx = Math.max(0, stages.findIndex((x) => x.id === id));
      const st = stages[idx];
      const cellTags = [
        ["또래·3R·양심", "또래소속·역할", "정서독립·가치", "진로·친밀감"],
        ["전조작→구체", "구체조작 안정", "형식조작 초입", "형식조작 정교"],
        ["외현 사적언어", "내적 자기교시", "또래·메타비계", "소크라테스 비계"],
        ["재촉 신체화", "단톡 비교의식", "청중·우화 피크!", "흑백 완벽주의"],
        ["남근→잠복기", "잠복기 승화", "생식기 충동·투사", "성숙 방어 전환"],
        ["근면성 첫 숙달", "비교 열등 방어", "정체감 유예·유실", "성취·유실 점검"],
      ];

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 270" class="viz-svg" role="img" aria-label="6대 발달이론 학령별 동기화 매트릭스">
          <!-- Column Scanner Highlight -->
          <rect x="${colXs[idx] - 52}" y="14" width="104" height="244" rx="12" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="2"/>
          <!-- Header row -->
          ${stages
            .map(
              (s, cIdx) => `
            <g class="viz-node" tabindex="0" role="button" data-node-id="${esc(s.id)}" aria-label="${esc(s.label)} 선택">
              <rect x="${colXs[cIdx] - 46}" y="20" width="92" height="26" rx="8" fill="${cIdx === idx ? "var(--viz-primary)" : "var(--viz-surface)"}" stroke="${cIdx === idx ? "var(--viz-primary)" : "var(--viz-keyline)"}"/>
              <text x="${colXs[cIdx]}" y="37" text-anchor="middle" fill="${cIdx === idx ? "#ffffff" : "var(--viz-ink)"}" font-size="10" font-weight="800">${esc(shortLabel(s.label, 8))}</text>
            </g>
          `
            )
            .join("")}

          <!-- Matrix Rows -->
          ${theorists
            .map((th, rIdx) => {
              const y = 58 + rIdx * 33;
              return `
                <line x1="16" y1="${y + 27}" x2="616" y2="${y + 27}" stroke="var(--viz-grid)"/>
                <text x="24" y="${y + 16}" fill="var(--viz-ink)" font-size="10.5" font-weight="800">${esc(th.name)}</text>
                ${stages
                  .map((s, cIdx) => {
                    const active = cIdx === idx;
                    const isPeak = rIdx === 3 && cIdx === 2;
                    return `
                      <g class="viz-node" tabindex="0" role="button" data-node-id="${esc(s.id)}" aria-label="${esc(s.label)} ${esc(th.name)}">
                        <rect x="${colXs[cIdx] - 46}" y="${y}" width="92" height="23" rx="6" fill="${isPeak ? "var(--viz-critical-soft)" : active ? "var(--viz-surface)" : "transparent"}" stroke="${isPeak ? "var(--viz-critical)" : active ? "var(--viz-primary)" : "transparent"}" stroke-width="1.2"/>
                        <text x="${colXs[cIdx]}" y="${y + 15}" text-anchor="middle" fill="${isPeak ? "var(--viz-critical)" : active ? "var(--viz-ink)" : "var(--viz-ink-sub)"}" font-size="9.5" font-weight="${active ? "800" : "600"}">${esc(cellTags[rIdx][cIdx])}</text>
                      </g>
                    `;
                  })
                  .join("")}
              `;
            })
            .join("")}
        </svg>
      `;
      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          ${theorists.map((th) => `<div class="viz-tel-card"><span class="viz-tel-kicker">${esc(th.name)}</span><p>${esc(st[th.key])}</p></div>`).join("")}
        </div>
        <div class="viz-tel-card is-primary" style="margin-top:10px">
          <span class="viz-tel-kicker">★ ${esc(st.label)} 맞춤 매체·발문 전략</span>
          <p>${esc(st.counselingTip)}</p>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", stages[0].id, draw);
  }

  function renderCh2Zpd(container) {
    const levels = [
      { id: "alone", label: "1. 실제적 발달수준", tag: "혼자 해결 가능 영역", desc: "상담자의 개입 없이도 학생 스스로 기존 인지·정서 전략으로 해결할 수 있는 수준(너무 쉬운 과제만 주면 성장 정체).", script: "사적 언어 상태: \"친구랑 다퉈서 짜증 나. 어쨌든 참아야지.\"" },
      { id: "zpd", label: "2. 근접발달영역 (ZPD)", tag: "비계설정 투입 골든존", desc: "감정 어휘 제공·선택지 축소·시범(modeling) 등 상담교사의 비계가 투입될 때 새로운 자기조절이 성취되는 핵심 개입 구간.", script: "비계 자기교시 훈련: \"화가 10점 중 8점 올라올 때 3초 멈추고 '내가 진짜 원하는 말' 하나만 골라 말해보자.\"" },
      { id: "fade", label: "3. 비계 철수 → 내면화", tag: "잠재적 발달수준 달성", desc: "대인 간(intermental) 공동 대화가 학생 내부의 정신 내(intramental) 내적 언어로 완전히 내면화되어 비계를 회수하는 단계.", script: "내면화 완료: 학생 스스로 갈등 순간 속으로 3초 멈춤 스크립트를 가동해 표현 조절 성공." },
    ];
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "SCAFFOLDING BRIDGE · 표 2-3 비고츠키 연계",
      "비고츠키 ZPD 비계설정 & 사적 언어→내적 언어 전이기",
      "단계를 선택하거나 다리 구간을 클릭해 대인 간 비계가 내적 자기조절로 내면화되는 구조를 확인하세요.",
      `
        <div class="viz-ctrl-bar">${levels.map((l) => `<button type="button" class="viz-ctrl-pill" data-chip="${l.id}">${esc(l.label)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(id) {
      const lv = levels.find((x) => x.id === id) || levels[1];
      const isZpd = lv.id === "zpd";
      const isFade = lv.id === "fade";
      stageEl.innerHTML = `
        <svg viewBox="0 0 640 235" class="viz-svg" role="img" aria-label="비고츠키 ZPD 비계설정 가교 도식">
          ${SvgKit.defs(uid)}
          <!-- Left Cliff: Actual Development -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="alone" aria-label="실제적 발달수준">
            <rect x="20" y="114" width="166" height="98" rx="12" fill="${lv.id === "alone" ? "var(--viz-primary-soft)" : "var(--viz-surface)"}" stroke="${lv.id === "alone" ? "var(--viz-primary)" : "var(--viz-keyline)"}" stroke-width="${lv.id === "alone" ? "2.4" : "1.6"}"/>
            <text x="103" y="146" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">실제적 발달수준</text>
            <text x="103" y="166" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10">혼자 해결 가능</text>
            <text x="103" y="186" text-anchor="middle" fill="var(--viz-warn)" font-size="10" font-weight="700">외현적 사적 언어</text>
          </g>

          <!-- ZPD Chasm & Arch Bridge -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="zpd" aria-label="근접발달영역 ZPD">
            <rect x="198" y="176" width="244" height="36" rx="8" fill="var(--viz-surface-alt)" stroke="var(--viz-grid)"/>
            <text x="320" y="198" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10.5" font-weight="700">근접발달영역 (ZPD 협곡 · 대인 간 조력 구간)</text>

            <!-- Arch Bridge -->
            <path d="M 186 114 Q 320 56 454 102" fill="none" stroke="${isZpd ? "var(--viz-primary)" : isFade ? "var(--viz-safe)" : "var(--viz-keyline)"}" stroke-width="4" stroke-dasharray="${isFade ? "8 5" : "none"}" marker-end="url(#${uid}-arr-${isFade ? "safe" : "pri"})"/>

            <!-- Scaffolding Pillars -->
            <g opacity="${lv.id === "alone" ? "0.25" : isZpd ? "1" : "0.42"}">
              <line x1="252" y1="88" x2="252" y2="176" stroke="var(--viz-primary)" stroke-width="2.4" stroke-dasharray="${isFade ? "4 4" : "none"}"/>
              <line x1="320" y1="76" x2="320" y2="176" stroke="var(--viz-primary)" stroke-width="2.4" stroke-dasharray="${isFade ? "4 4" : "none"}"/>
              <line x1="388" y1="84" x2="388" y2="176" stroke="var(--viz-primary)" stroke-width="2.4" stroke-dasharray="${isFade ? "4 4" : "none"}"/>
              <rect x="220" y="34" width="200" height="30" rx="999" fill="${isZpd ? "var(--viz-primary)" : "var(--viz-surface)"}" stroke="var(--viz-primary)" stroke-width="1.6"/>
              <text x="320" y="53" text-anchor="middle" fill="${isZpd ? "#ffffff" : "var(--viz-primary)"}" font-size="10.5" font-weight="800">${isFade ? "비계 점진적 철수 (Fading)" : "상담 비계: 감정어휘·시범·단서"}</text>
            </g>
          </g>

          <!-- Right High Cliff: Potential Development -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="fade" aria-label="잠재적 발달수준">
            <rect x="454" y="88" width="166" height="124" rx="12" fill="${isFade ? "var(--viz-safe-soft)" : "var(--viz-surface)"}" stroke="${isFade ? "var(--viz-safe)" : "var(--viz-keyline)"}" stroke-width="${isFade ? "2.4" : "1.6"}"/>
            <text x="537" y="124" text-anchor="middle" fill="var(--viz-ink)" font-size="12" font-weight="800">잠재적 발달수준</text>
            <text x="537" y="144" text-anchor="middle" fill="var(--viz-safe)" font-size="10.5" font-weight="700">✓ 내적 언어 완성</text>
            <text x="537" y="166" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">정신 내 자기조절</text>
            <text x="537" y="186" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">독립 수행 도달</text>
          </g>

          <!-- Student Position Marker -->
          <circle cx="${lv.id === "alone" ? "103" : isZpd ? "320" : "537"}" cy="${lv.id === "alone" ? "102" : isZpd ? "76" : "76"}" r="9" fill="${isFade ? "var(--viz-safe)" : "var(--viz-warn)"}" stroke="#ffffff" stroke-width="2.2"/>
        </svg>
      `;
      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-primary"><span class="viz-tel-kicker">${esc(lv.tag)}</span><h5>${esc(lv.label)}</h5><p>${esc(lv.desc)}</p></div>
          <div class="viz-tel-card is-safe"><span class="viz-tel-kicker">혼잣말 → 자기교시 변환</span><h5>언어 내면화 스크립트</h5><p>${esc(lv.script)}</p></div>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "zpd", draw);
  }

  function renderCh2Defenses(container, ch) {
    const defenses = (ch.diagrams && ch.diagrams.defenses) || [];
    if (!defenses.length) return;
    const levels = ["전체", "미성숙", "신경증적", "성숙한"];
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "MATURITY SPECTRUM · 표 2-4 방어기제",
      "자아 방어기제 성숙도 × 현실왜곡도 2차원 스펙트럼",
      "수준 필터를 고르거나 그래프 위의 각 방어기제 노드를 클릭해 학교 발현과 비파괴 개입 지침을 확인하세요.",
      `
        <div class="viz-ctrl-bar">${levels.map((lv) => `<button type="button" class="viz-ctrl-pill" data-chip="${esc(lv)}">${esc(lv)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);
    let activeFilter = "전체";
    let selectedIdx = 0;

    const toneForLevel = (lv) => (lv === "성숙한" ? "safe" : lv === "신경증적" ? "warn" : "critical");
    const colForLevel = (lv) => (lv === "성숙한" ? "var(--viz-safe)" : lv === "신경증적" ? "var(--viz-warn)" : "var(--viz-critical)");

    function draw() {
      const mapX = (pct) => 68 + (pct / 100) * 510;
      const mapY = (pct) => 222 - (pct / 100) * 182;

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 260" class="viz-svg" role="img" aria-label="방어기제 성숙도와 현실왜곡도 좌표 그래프">
          ${SvgKit.defs(uid)}
          <!-- Grid & Axes -->
          <rect x="68" y="34" width="510" height="188" rx="10" fill="var(--viz-surface)" stroke="var(--viz-grid)"/>
          <!-- Zone bands -->
          <rect x="68" y="34" width="180" height="188" fill="var(--viz-critical-soft)" opacity="0.45"/>
          <rect x="248" y="34" width="165" height="188" fill="var(--viz-warn-soft)" opacity="0.45"/>
          <rect x="413" y="34" width="165" height="188" fill="var(--viz-safe-soft)" opacity="0.45"/>

          <line x1="68" y1="222" x2="584" y2="222" stroke="var(--viz-keyline)" stroke-width="1.8" marker-end="url(#${uid}-arr-safe)"/>
          <line x1="68" y1="222" x2="68" y2="28" stroke="var(--viz-keyline)" stroke-width="1.8" marker-end="url(#${uid}-arr-crit)"/>
          <text x="325" y="246" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10.5" font-weight="800">방어 성숙도 (미성숙 → 신경증적 → 성숙한 대처) ▶</text>
          <text x="26" y="130" text-anchor="middle" fill="var(--viz-critical)" font-size="10" font-weight="800" transform="rotate(-90 26 130)">현실왜곡도 ▶</text>

          <!-- Adaptation Trajectory -->
          <path d="M ${mapX(18).toFixed(0)} ${mapY(78).toFixed(0)} Q 320 120 ${mapX(86).toFixed(0)} ${mapY(18).toFixed(0)}" fill="none" stroke="var(--viz-safe)" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#${uid}-arr-safe)"/>
          <text x="412" y="102" text-anchor="middle" fill="var(--viz-safe)" font-size="9.5" font-weight="800">방어 존중 → 승화 전환 방향</text>

          ${defenses
            .map((d, i) => {
              const x = mapX(d.maturityX || 50);
              const y = mapY(100 - (d.distortionY || 50));
              const inFilter = activeFilter === "전체" || d.level === activeFilter;
              const isSel = i === selectedIdx;
              const c = colForLevel(d.level);
              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="def-${i}" opacity="${inFilter ? "1" : "0.24"}" aria-label="${esc(d.name)} (${esc(d.level)})">
                  ${isSel ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="3 2"/>` : ""}
                  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isSel ? "16" : "13"}" fill="${isSel ? c : "var(--viz-surface)"}" stroke="${c}" stroke-width="2.2"/>
                  <text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" fill="${isSel ? "#ffffff" : c}" font-size="9.5" font-weight="800">${i + 1}</text>
                  <text x="${x.toFixed(1)}" y="${(y + 28).toFixed(1)}" text-anchor="middle" fill="var(--viz-ink)" font-size="10.5" font-weight="800">${esc(shortLabel(d.name, 7))}</text>
                </g>
              `;
            })
            .join("")}
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        selectedIdx = parseInt(nid.replace("def-", ""), 10) || 0;
        draw();
      });

      const items = activeFilter === "전체" ? [defenses[selectedIdx]] : defenses.filter((x) => x.level === activeFilter);
      const displayList = activeFilter === "전체" ? items : items;
      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          ${displayList
            .map(
              (def) => `
            <div class="viz-tel-card is-${toneForLevel(def.level)}">
              <span class="viz-tel-kicker">${esc(def.level)} 수준 · 성숙도 ${def.maturityX || 50}%</span>
              <h5>${esc(def.name)}</h5>
              <p><strong>발현:</strong> ${esc(def.schoolSign)}</p>
              <p style="margin-top:6px"><strong>비파괴 개입:</strong> ${esc(def.intervention)}</p>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "전체", (lv) => {
      activeFilter = lv;
      const firstIdx = defenses.findIndex((x) => lv === "전체" || x.level === lv);
      if (firstIdx >= 0) selectedIdx = firstIdx;
      draw();
    });
  }

  function renderCh2Marcia(container) {
    const statuses = [
      { id: "moratorium", label: "정체감 유예", badge: "고탐색 ○ × 저전념 △", quad: "top-left", tone: "primary", sign: "'내가 진짜 뭘 좋아하는지 모르겠어요'라며 치열히 고민·탐색 중이라 일시 불안을 겪는 상태.", guide: "유예를 병리/나태로 낙인찍지 말고 안전한 시행착오 공간과 탐색 자원을 보호." },
      { id: "achieved", label: "정체감 성취", badge: "고탐색 ○ × 고전념 ○", quad: "top-right", tone: "safe", sign: "직업·전공을 직접 탐색하고 시행착오를 거친 뒤 자기 결정으로 진로·가치관에 전념하는 상태.", guide: "자율적 목표 실행을 격려하고 대학·사회 전환기 스트레스 관리만 보조." },
      { id: "diffused", label: "정체감 혼미", badge: "저탐색 ✕ × 저전념 ✕", quad: "bottom-left", tone: "warn", sign: "무기력·방황·즉흥 충동에 머무르며 진로·관계 어디에도 탐색이나 방향 감각이 없는 상태.", guide: "거창한 진로 결정 압박 금지! 작은 흥미·일상 유능감(근면성 보충)부터 비계 설정." },
      { id: "foreclosed", label: "정체감 유실", badge: "저탐색 ✕ × 고전념 ○ (한국 모범생 주의)", quad: "bottom-right", tone: "critical", sign: "한국 성실 모범생에게 흔함! 자기 질문 없이 부모·입시 서열 기준을 무비판 내면화해 전념하다 뒤늦게 번아웃.", guide: "부모 기대와 내 진짜 흥미를 분리해 '내 목소리로 고르기' 탐색 질문 투입 필수." },
    ];
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "2×2 QUADRANT MATRIX · 표 2-5 핵심",
      "마샤(Marcia) 자아정체감 4지위 2×2 사분면 좌표계",
      "탐색(위기) 세로축과 전념 가로축으로 나뉜 4사분면을 클릭해 한국 모범생형 '정체감 유실'과 건강한 '유예'를 변별하세요.",
      `
        <div class="viz-ctrl-bar">${statuses.map((s) => `<button type="button" class="viz-ctrl-pill" data-chip="${s.id}">${esc(s.label)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(id) {
      const st = statuses.find((x) => x.id === id) || statuses[3];
      const boxMeta = {
        moratorium: { x: 86, y: 34, sub: "고민·시행착오 탐색 중", col: "var(--viz-primary)", soft: "var(--viz-primary-soft)" },
        achieved: { x: 354, y: 34, sub: "자율적 탐색 후 자기 전념", col: "var(--viz-safe)", soft: "var(--viz-safe-soft)" },
        diffused: { x: 86, y: 146, sub: "무기력·방향 상실", col: "var(--viz-warn)", soft: "var(--viz-warn-soft)" },
        foreclosed: { x: 354, y: 146, sub: "! 모범생 타인기준 순응", col: "var(--viz-critical)", soft: "var(--viz-critical-soft)" },
      };

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 278" class="viz-svg" role="img" aria-label="마샤 자아정체감 4지위 2x2 사분면">
          ${SvgKit.defs(uid)}
          <!-- Crosshair Axes -->
          <line x1="68" y1="138" x2="604" y2="138" stroke="var(--viz-keyline)" stroke-width="2" marker-end="url(#${uid}-arr-pri)"/>
          <line x1="336" y1="252" x2="336" y2="20" stroke="var(--viz-keyline)" stroke-width="2" marker-end="url(#${uid}-arr-pri)"/>

          <text x="336" y="15" text-anchor="middle" fill="var(--viz-primary)" font-size="10.5" font-weight="800">▲ 고탐색 (자율적 탐색·위기 경험)</text>
          <text x="336" y="268" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10" font-weight="700">▼ 저탐색 (고민·대안 탐색 부재)</text>
          <text x="64" y="132" text-anchor="start" fill="var(--viz-ink-sub)" font-size="10" font-weight="700">◀ 저전념</text>
          <text x="606" y="132" text-anchor="end" fill="var(--viz-safe)" font-size="10.5" font-weight="800">고전념 ▶</text>

          ${statuses
            .map((s) => {
              const m = boxMeta[s.id];
              const act = s.id === st.id;
              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="${s.id}" aria-label="${esc(s.label)} 선택">
                  <rect x="${m.x}" y="${m.y}" width="232" height="90" rx="14" fill="${act ? m.soft : "var(--viz-surface)"}" stroke="${act ? m.col : "var(--viz-keyline)"}" stroke-width="${act ? "2.6" : "1.5"}"/>
                  <text x="${m.x + 116}" y="${m.y + 34}" text-anchor="middle" fill="${act ? m.col : "var(--viz-ink)"}" font-size="13.5" font-weight="800">${esc(s.label)}</text>
                  <text x="${m.x + 116}" y="${m.y + 56}" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10.5" font-weight="600">${esc(m.sub)}</text>
                  <text x="${m.x + 116}" y="${m.y + 76}" text-anchor="middle" fill="${m.col}" font-size="9.5" font-weight="800">${esc(s.badge.split("(")[0].trim())}</text>
                </g>
              `;
            })
            .join("")}

          <!-- Healthy transition arrow Moratorium -> Achieved -->
          <path d="M 318 76 L 352 76" fill="none" stroke="var(--viz-safe)" stroke-width="2.4" marker-end="url(#${uid}-arr-safe)"/>
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-card is-${st.tone}">
          <span class="viz-tel-kicker">${esc(st.badge)}</span>
          <h5>${esc(st.label)}</h5>
          <p><strong>한국 학교 발현:</strong> ${esc(st.sign)}</p>
          <p style="margin-top:6px"><strong>상담 개입 전략:</strong> ${esc(st.guide)}</p>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "foreclosed", draw);
  }

  function renderCh3Tasks(container, ch) {
    const tasks = (ch.diagrams && ch.diagrams.tasks) || [];
    if (!tasks.length) return;
    const uid = nextUid();
    const revealed = new Set();
    let selectedTaskIdx = 0;

    const body = SvgKit.mountStudioShell(
      container,
      "GATE FILTER FLOW · 표 3-3 직무 자가 판별",
      "ASCA 80% 전문 직무 vs 부적합 비상담 업무 분류 게이트",
      "각 업무 노드를 클릭해 ASCA 직무 필터를 통과시켜 보고(✓ 적합 vs ✕ 부적합), 상단 버튼으로 전체 정답을 일괄 확인할 수 있습니다.",
      `
        <div class="viz-ctrl-bar">
          <button type="button" class="viz-ctrl-pill" id="${uid}-reveal-all">전체 판별 결과 보기</button>
          <button type="button" class="viz-ctrl-pill" id="${uid}-reset">판별 초기화</button>
        </div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw() {
      const fitRows = [];
      const unfitRows = [];
      tasks.forEach((t, i) => {
        if (t.fit) fitRows.push(i);
        else unfitRows.push(i);
      });

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 285" class="viz-svg" role="img" aria-label="ASCA 적합 직무와 부적합 업무 게이트 분류도">
          ${SvgKit.defs(uid)}
          <!-- Central ASCA Gate -->
          <polygon points="274,108 320,108 338,142 320,176 274,176 256,142" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="2.2"/>
          <text x="297" y="138" text-anchor="middle" fill="var(--viz-ink)" font-size="11" font-weight="800">ASCA</text>
          <text x="297" y="153" text-anchor="middle" fill="var(--viz-primary)" font-size="9.5" font-weight="800">역할 필터</text>

          <!-- Output Zones -->
          <rect x="378" y="18" width="244" height="114" rx="12" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="1.5"/>
          <text x="500" y="38" text-anchor="middle" fill="var(--viz-safe)" font-size="11" font-weight="800">✓ 적합 전문 직무 (80%+ 확보)</text>

          <rect x="378" y="152" width="244" height="114" rx="12" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-width="1.5" stroke-dasharray="5 3"/>
          <text x="500" y="172" text-anchor="middle" fill="var(--viz-critical)" font-size="11" font-weight="800">✕ 부적합 비상담 업무 (거부·협상)</text>

          ${tasks
            .map((t, i) => {
              const yIn = 24 + i * 42;
              const rev = revealed.has(i);
              const isSel = i === selectedTaskIdx;
              const laneIdx = t.fit ? fitRows.indexOf(i) : unfitRows.indexOf(i);
              const yOut = (t.fit ? 56 : 190) + laneIdx * 26;
              const toneCol = !rev ? "var(--viz-keyline)" : t.fit ? "var(--viz-safe)" : "var(--viz-critical)";

              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="tk-${i}" aria-label="${esc(t.task)} 판별하기">
                  <rect x="18" y="${yIn}" width="212" height="32" rx="9" fill="${isSel ? "var(--viz-primary-soft)" : "var(--viz-surface)"}" stroke="${isSel ? "var(--viz-primary)" : toneCol}" stroke-width="${isSel ? "2.2" : "1.5"}"/>
                  <text x="28" y="${yIn + 20}" fill="var(--viz-ink)" font-size="10" font-weight="700">${rev ? (t.fit ? "✓ " : "✕ ") : "? "}${esc(shortLabel(t.task, 17))}</text>
                </g>
                <path d="M 230 ${yIn + 16} L 256 142" fill="none" stroke="${rev ? toneCol : "var(--viz-grid)"}" stroke-width="${rev ? "1.8" : "1.2"}"/>
                ${
                  rev
                    ? `
                  <path d="M 338 142 C 356 142, 358 ${yOut}, 386 ${yOut}" fill="none" stroke="${toneCol}" stroke-width="2" stroke-dasharray="${t.fit ? "none" : "5 3"}" marker-end="url(#${uid}-arr-${t.fit ? "safe" : "crit"})"/>
                  <text x="394" y="${yOut + 4}" fill="var(--viz-ink)" font-size="10" font-weight="700">${t.fit ? "✓" : "✕"} ${esc(shortLabel(t.task, 18))}</text>
                `
                    : `<text x="500" y="${yOut + 4}" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5" opacity="0.55">좌측 업무 클릭 시 분류 경로 점등</text>`
                }
              `;
            })
            .join("")}
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const idx = parseInt(nid.replace("tk-", ""), 10) || 0;
        revealed.add(idx);
        selectedTaskIdx = idx;
        draw();
      });

      const cur = tasks[selectedTaskIdx];
      const curRev = revealed.has(selectedTaskIdx);
      hudEl.innerHTML = curRev
        ? `
          <div class="viz-tel-card is-${cur.fit ? "safe" : "critical"}">
            <span class="viz-tel-kicker">${cur.fit ? "✓ 적합 전문 직무 (직접·간접 서비스)" : "✕ 부적합 비상담 업무 (경계 협상 필요)"}</span>
            <h5>${esc(cur.task)}</h5>
            <p>${esc(cur.reason)}</p>
          </div>
        `
        : `
          <div class="viz-tel-card is-primary">
            <span class="viz-tel-kicker">판별 대기 (${revealed.size}/${tasks.length}개 확인됨)</span>
            <h5>${esc(cur.task)}</h5>
            <p>위 SVG에서 좌측 업무 노드를 클릭하면 ASCA 필터를 통과해 적합/부적합 경로가 연결됩니다.</p>
          </div>
        `;
    }

    body.querySelector(`#${uid}-reveal-all`).addEventListener("click", () => {
      tasks.forEach((_, i) => revealed.add(i));
      draw();
    });
    body.querySelector(`#${uid}-reset`).addEventListener("click", () => {
      revealed.clear();
      selectedTaskIdx = 0;
      draw();
    });
    draw();
  }

  function renderCh3Tree(container, ch) {
    const scenarios = (ch.diagrams && ch.diagrams.scenarios) || [];
    if (!scenarios.length) return;
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "BOWTIE & TRIAGE CIRCUIT · 표 3-6 고위기 의사결정",
      "비밀보장 예외 · 법정 신고 의사결정 보타이 회로",
      "위기 시나리오를 선택하면 형량 도덕원칙(자율·충실 vs 비유해성) 분기와 즉각 실행 프로토콜 경로가 점등됩니다.",
      `
        <div class="viz-ctrl-bar">${scenarios.map((sc) => `<button type="button" class="viz-ctrl-pill" data-chip="${esc(sc.id)}">${esc(sc.badge)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(id) {
      const sc = scenarios.find((x) => x.id === id) || scenarios[0];
      const isUrgent = sc.id === "suicide" || sc.id === "tarasoff" || sc.id === "abuse";
      stageEl.innerHTML = `
        <svg viewBox="0 0 640 245" class="viz-svg" role="img" aria-label="고위기 윤리 법적 의사결정 보타이 회로">
          ${SvgKit.defs(uid)}
          <!-- Left: Alliance Baseline -->
          <rect x="18" y="84" width="128" height="76" rx="12" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="1.8"/>
          <text x="82" y="114" text-anchor="middle" fill="var(--viz-ink)" font-size="11.5" font-weight="800">이중동의 동맹</text>
          <text x="82" y="134" text-anchor="middle" fill="var(--viz-primary)" font-size="9.5">원칙적 비밀보장</text>

          <line x1="146" y1="122" x2="188" y2="122" stroke="var(--viz-primary)" stroke-width="2.2" marker-end="url(#${uid}-arr-pri)"/>

          <!-- Center Knot: Crisis Scenario -->
          <rect x="192" y="74" width="144" height="96" rx="14" fill="var(--viz-surface)" stroke="${isUrgent ? "var(--viz-critical)" : "var(--viz-warn)"}" stroke-width="2.4"/>
          <text x="264" y="102" text-anchor="middle" fill="${isUrgent ? "var(--viz-critical)" : "var(--viz-warn)"}" font-size="10.5" font-weight="800">${esc(sc.badge)}</text>
          <text x="264" y="124" text-anchor="middle" fill="var(--viz-ink)" font-size="11" font-weight="800">윤리 형량 분기점</text>
          <text x="264" y="144" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">6대 원칙 × 실정법</text>

          <!-- Diamond Decision -->
          <polygon points="384,92 418,122 384,152 350,122" fill="var(--viz-surface-alt)" stroke="var(--viz-keyline)" stroke-width="1.8"/>
          <text x="384" y="119" text-anchor="middle" fill="var(--viz-ink)" font-size="9" font-weight="800">생명·법적</text>
          <text x="384" y="131" text-anchor="middle" fill="var(--viz-ink)" font-size="9" font-weight="800">예외?</text>
          <line x1="336" y1="122" x2="348" y2="122" stroke="var(--viz-keyline)" stroke-width="2"/>

          <!-- Top Branch: Urgent Exception -->
          <path d="M 384 92 L 384 56 L 444 56" fill="none" stroke="${isUrgent ? "var(--viz-critical)" : "var(--viz-grid)"}" stroke-width="${isUrgent ? "2.6" : "1.4"}" marker-end="url(#${uid}-arr-${isUrgent ? "crit" : "muted"})"/>
          <rect x="448" y="24" width="174" height="72" rx="12" fill="${isUrgent ? "var(--viz-critical-soft)" : "var(--viz-surface)"}" stroke="${isUrgent ? "var(--viz-critical)" : "var(--viz-grid)"}" stroke-width="${isUrgent ? "2.2" : "1.2"}" opacity="${isUrgent ? "1" : "0.45"}"/>
          <text x="535" y="48" text-anchor="middle" fill="var(--viz-critical)" font-size="11" font-weight="800">! 비유해성 최우선 개입</text>
          <text x="535" y="68" text-anchor="middle" fill="var(--viz-ink)" font-size="9.8">즉각 안전감호·112신고·인계</text>
          <text x="535" y="84" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.2">최소 정보만 공개</text>

          <!-- Bottom Branch: Boundary Protection -->
          <path d="M 384 152 L 384 188 L 444 188" fill="none" stroke="${!isUrgent ? "var(--viz-safe)" : "var(--viz-grid)"}" stroke-width="${!isUrgent ? "2.6" : "1.4"}" marker-end="url(#${uid}-arr-${!isUrgent ? "safe" : "muted"})"/>
          <rect x="448" y="150" width="174" height="72" rx="12" fill="${!isUrgent ? "var(--viz-safe-soft)" : "var(--viz-surface)"}" stroke="${!isUrgent ? "var(--viz-safe)" : "var(--viz-grid)"}" stroke-width="${!isUrgent ? "2.2" : "1.2"}" opacity="${!isUrgent ? "1" : "0.45"}"/>
          <text x="535" y="174" text-anchor="middle" fill="var(--viz-safe)" font-size="11" font-weight="800">✓ 신뢰·경계 수호</text>
          <text x="535" y="194" text-anchor="middle" fill="var(--viz-ink)" font-size="9.8">원문 거절·공식채널 전환</text>
          <text x="535" y="210" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.2">기능적 요약·이중잠금</text>
        </svg>
      `;

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-${isUrgent ? "critical" : "safe"}">
            <span class="viz-tel-kicker">${esc(sc.badge)}</span>
            <h5>${esc(sc.title)}</h5>
            <p><strong>형량 원칙:</strong> ${esc(sc.principles)}</p>
            <p style="margin-top:4px"><strong>법·윤리 근거:</strong> ${esc(sc.law)}</p>
          </div>
          <div class="viz-tel-card">
            <span class="viz-tel-kicker">실행 프로토콜 체크리스트</span>
            <ul>${sc.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          </div>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", scenarios[0].id, draw);
  }

  function renderCh3Burnout(container, ch) {
    const burnout = (ch.diagrams && ch.diagrams.burnout) || [];
    if (!burnout.length) return;
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "ICEBERG STRATA · 표 3-7 조기 변별",
      "직무 소진 · 공감 피로(STS) · 대리외상(VT) 심도 단면도",
      "지층을 클릭해 발생 속도와 손상 깊이(조직 소진 → 정서 전염 → 핵심 도식 변형)에 따른 자기돌봄 처방을 확인하세요.",
      `
        <div class="viz-ctrl-bar">${burnout.map((b, i) => `<button type="button" class="viz-ctrl-pill" data-chip="b${i}">${esc(b.type.split("(")[0].trim())}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(idx) {
      const item = burnout[idx] || burnout[0];
      const tones = ["warn", "primary", "critical"];
      const cols = ["var(--viz-warn)", "var(--viz-primary)", "var(--viz-critical)"];
      const softs = ["var(--viz-warn-soft)", "var(--viz-primary-soft)", "var(--viz-critical-soft)"];

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 245" class="viz-svg" role="img" aria-label="직무소진 공감피로 대리외상 3층 심도 단면도">
          <!-- Waterline -->
          <path d="M 20 74 Q 160 66 320 74 T 620 74" fill="none" stroke="var(--viz-primary)" stroke-width="2" stroke-dasharray="6 4"/>
          <text x="614" y="65" text-anchor="end" fill="var(--viz-primary)" font-size="9.5" font-weight="800">외현/조직 수면선</text>

          <!-- Depth gauge -->
          <line x1="586" y1="30" x2="586" y2="224" stroke="var(--viz-keyline)" stroke-width="2"/>
          <text x="598" y="42" fill="var(--viz-ink-sub)" font-size="9">표층</text>
          <text x="598" y="132" fill="var(--viz-ink-sub)" font-size="9">중층</text>
          <text x="598" y="216" fill="var(--viz-critical)" font-size="9" font-weight="800">심층</text>

          ${burnout
            .map((b, i) => {
              const y = 20 + i * 68;
              const act = i === idx;
              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="b${i}" aria-label="${esc(b.type)} 선택">
                  <rect x="28" y="${y}" width="538" height="58" rx="12" fill="${act ? softs[i] : "var(--viz-surface)"}" stroke="${act ? cols[i] : "var(--viz-keyline)"}" stroke-width="${act ? "2.4" : "1.4"}"/>
                  <text x="48" y="${y + 25}" fill="${act ? cols[i] : "var(--viz-ink)"}" font-size="12" font-weight="800">LAYER ${i + 1} · ${esc(b.type)}</text>
                  <text x="48" y="${y + 44}" fill="var(--viz-ink-sub)" font-size="10">${esc(shortLabel(b.core, 36))}</text>
                  <rect x="444" y="${y + 15}" width="104" height="26" rx="999" fill="var(--viz-surface)" stroke="${cols[i]}"/>
                  <text x="496" y="${y + 32}" text-anchor="middle" fill="${cols[i]}" font-size="10" font-weight="800">${esc(b.speedLabel || b.onset)}</text>
                </g>
              `;
            })
            .join("")}
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-card is-${tones[idx]}">
          <span class="viz-tel-kicker">${esc(item.onset)} · 심도 LAYER ${item.depthTier || idx + 1}</span>
          <h5>${esc(item.type)}</h5>
          <p><strong>발생 원인:</strong> ${esc(item.cause)}</p>
          <p style="margin-top:5px"><strong>핵심 징후:</strong> ${esc(item.core)}</p>
          <p style="margin-top:5px"><strong>맞춤 자기돌봄 처방:</strong> ${esc(item.remedy)}</p>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "b0", (cid) => {
      draw(parseInt(cid.slice(1), 10) || 0);
    });
  }

  function renderCh4Micro(container, ch) {
    const micro = (ch.diagrams && ch.diagrams.microskills) || [];
    if (!micro.length) return;
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "DIALOGUE BRANCH FLOW · 표 4-4 · 4-5 축어록 대조",
      "초임 교사 오용 vs 미시상담기술 치료적 반응 분기도",
      "학생 발화 사례를 선택해 상담자의 반응에 따라 방어벽이 높아지는 경로와 작업동맹이 열리는 경로가 어떻게 갈리는지 확인하세요.",
      `
        <div class="viz-ctrl-bar">${micro.map((m, i) => `<button type="button" class="viz-ctrl-pill" data-chip="m${i}">사례 ${i + 1}: ${esc(m.skill.split("+")[0].trim())}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(idx) {
      const m = micro[idx] || micro[0];
      stageEl.innerHTML = `
        <svg viewBox="0 0 640 230" class="viz-svg" role="img" aria-label="미시상담기술 반응 분기 흐름도">
          ${SvgKit.defs(uid)}
          <!-- Origin Node: Student Utterance -->
          <rect x="20" y="72" width="168" height="86" rx="14" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="2"/>
          <text x="104" y="98" text-anchor="middle" fill="var(--viz-primary)" font-size="10.5" font-weight="800">학생 발화 원점</text>
          <text x="104" y="120" text-anchor="middle" fill="var(--viz-ink)" font-size="11.5" font-weight="800">${esc(shortLabel(m.case.split(":")[0], 13))}</text>
          <text x="104" y="140" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">저항·좌절·불일치 신호</text>

          <!-- Top Branch: Wrong (Dashed + X) -->
          <path d="M 188 102 C 232 102, 234 54, 276 54" fill="none" stroke="var(--viz-critical)" stroke-width="2.2" stroke-dasharray="6 4" marker-end="url(#${uid}-arr-crit)"/>
          <rect x="282" y="20" width="174" height="68" rx="12" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-width="1.8" stroke-dasharray="5 3"/>
          <text x="369" y="45" text-anchor="middle" fill="var(--viz-critical)" font-size="11" font-weight="800">✕ 초임 오용 반응</text>
          <text x="369" y="65" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">취조 · 성급처방 · 공격추궁</text>
          <line x1="456" y1="54" x2="492" y2="54" stroke="var(--viz-critical)" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#${uid}-arr-crit)"/>
          <rect x="496" y="28" width="124" height="52" rx="12" fill="var(--viz-surface)" stroke="var(--viz-critical)"/>
          <text x="558" y="51" text-anchor="middle" fill="var(--viz-critical)" font-size="11" font-weight="800">방어벽 상승</text>
          <text x="558" y="68" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">침묵 · 라포 단절</text>

          <!-- Bottom Branch: Therapeutic (Solid + Check) -->
          <path d="M 188 128 C 232 128, 234 174, 276 174" fill="none" stroke="var(--viz-safe)" stroke-width="2.6" marker-end="url(#${uid}-arr-safe)"/>
          <rect x="282" y="140" width="174" height="68" rx="12" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="2"/>
          <text x="369" y="165" text-anchor="middle" fill="var(--viz-safe)" font-size="11" font-weight="800">✓ 치료적 미시기술</text>
          <text x="369" y="185" text-anchor="middle" fill="var(--viz-ink)" font-size="9.5">${esc(shortLabel(m.skill, 18))}</text>
          <line x1="456" y1="174" x2="492" y2="174" stroke="var(--viz-safe)" stroke-width="2.4" marker-end="url(#${uid}-arr-safe)"/>
          <rect x="496" y="148" width="124" height="52" rx="12" fill="var(--viz-surface)" stroke="var(--viz-safe)"/>
          <text x="558" y="171" text-anchor="middle" fill="var(--viz-safe)" font-size="11" font-weight="800">동맹 · 자기개방</text>
          <text x="558" y="188" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">지각된 공감 형성</text>
        </svg>
      `;

      hudEl.innerHTML = `
        <div class="viz-tel-card is-primary" style="margin-bottom:10px">
          <span class="viz-tel-kicker">학생 발화 원문</span>
          <p>${esc(m.case)}</p>
        </div>
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-critical"><span class="viz-tel-kicker">✕ 초임 교사의 오용</span><p>${esc(m.wrong)}</p></div>
          <div class="viz-tel-card is-safe"><span class="viz-tel-kicker">✓ 치료적 반응 (${esc(m.skill)})</span><p>${esc(m.good)}</p></div>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "m0", (cid) => {
      draw(parseInt(cid.slice(1), 10) || 0);
    });
  }

  function renderCh4Sfbt(container, ch) {
    const sfbt = (ch.diagrams && ch.diagrams.sfbt) || [];
    const ss = (ch.diagrams && ch.diagrams.singleSession) || [];
    if (!sfbt.length) return;
    const uid = nextUid();
    let selTech = 0;
    let selStep = 0;

    const body = SvgKit.mountStudioShell(
      container,
      "TIMEBOX ARC & DUAL LENS · 표 4-10 · 4-11",
      "45분 단회 타임박스 아크 & SFBT 초·중등 발문 변환기",
      "좌측 45분 링 세그먼트나 우측 SFBT 발문 기법 버튼을 눌러 회기 시간 배분과 발달 맞춤 발문을 동시에 탐색하세요.",
      `
        <div class="viz-ctrl-bar">${sfbt.map((s, i) => `<button type="button" class="viz-ctrl-pill" data-chip="s${i}">${esc(s.tech)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    const arcs = [
      { d: "M 150 42 A 86 86 0 0 1 226 88", col: "var(--viz-primary)", mins: "5~8분", lx: 196, ly: 54, label: "1.초점" },
      { d: "M 230 96 A 86 86 0 0 1 190 206", col: "var(--viz-depth)", mins: "10~15분", lx: 244, ly: 162, label: "2.예외" },
      { d: "M 182 208 A 86 86 0 0 1 70 156", col: "var(--viz-safe)", mins: "10~15분", lx: 102, ly: 214, label: "3.실천" },
      { d: "M 66 146 A 86 86 0 0 1 142 42", col: "var(--viz-warn)", mins: "5~7분", lx: 78, ly: 76, label: "4.종결" },
    ];

    function draw() {
      const s = sfbt[selTech] || sfbt[0];
      const st = ss[selStep] || ss[0];

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 245" class="viz-svg" role="img" aria-label="45분 단회상담 타임박스와 SFBT 발문 변환 도식">
          ${SvgKit.defs(uid)}
          <!-- Left: 45-min Single Session Timebox Ring -->
          <text x="150" y="22" text-anchor="middle" fill="var(--viz-ink)" font-size="11.5" font-weight="800">45분 단회상담 타임박스 (클릭)</text>
          <circle cx="150" cy="128" r="52" fill="var(--viz-surface)" stroke="var(--viz-grid)"/>
          <text x="150" y="124" text-anchor="middle" fill="var(--viz-ink)" font-size="13" font-weight="800">${esc(st ? st.mins : "45분")}</text>
          <text x="150" y="141" text-anchor="middle" fill="var(--viz-primary)" font-size="9.5" font-weight="700">${esc(shortLabel(st ? st.step.split("·")[1] || st.step : "", 10))}</text>

          ${arcs
            .map((a, i) => {
              const act = i === selStep;
              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="ss-${i}" aria-label="${esc(a.label)} 단계 선택">
                  <path d="${a.d}" fill="none" stroke="${a.col}" stroke-width="${act ? "18" : "12"}" stroke-linecap="round" opacity="${act ? "1" : "0.42"}"/>
                  <text x="${a.lx}" y="${a.ly}" text-anchor="middle" fill="${act ? a.col : "var(--viz-ink-sub)"}" font-size="10" font-weight="800">${esc(a.label)}</text>
                </g>
              `;
            })
            .join("")}

          <line x1="305" y1="22" x2="305" y2="225" stroke="var(--viz-grid)" stroke-dasharray="4 3"/>

          <!-- Right: Dual Developmental Lens for SFBT -->
          <text x="470" y="22" text-anchor="middle" fill="var(--viz-ink)" font-size="11.5" font-weight="800">SFBT 발달 맞춤 발문 변환: ${esc(shortLabel(s.tech, 10))}</text>

          <rect x="330" y="42" width="284" height="72" rx="12" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="1.8"/>
          <text x="348" y="66" fill="var(--viz-safe)" font-size="11" font-weight="800">초등학생 렌즈 (구체 심상 · 은유)</text>
          <text x="348" y="88" fill="var(--viz-ink)" font-size="10.2">${esc(shortLabel(s.elem, 27))}</text>
          <text x="348" y="103" fill="var(--viz-ink-sub)" font-size="9.2">마음 온도계 · 마법 · 구체적 장면화</text>

          <path d="M 472 114 L 472 142" fill="none" stroke="var(--viz-primary)" stroke-width="2" marker-start="url(#${uid}-arr-safe)" marker-end="url(#${uid}-arr-pri)"/>

          <rect x="330" y="144" width="284" height="72" rx="12" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="1.8"/>
          <text x="348" y="168" fill="var(--viz-primary)" font-size="11" font-weight="800">중·고등학생 렌즈 (메타인지 · 대인조망)</text>
          <text x="348" y="190" fill="var(--viz-ink)" font-size="10.2">${esc(shortLabel(s.sec, 27))}</text>
          <text x="348" y="205" fill="var(--viz-ink-sub)" font-size="9.2">자율 선택 · 작은 1점 변화 행동</text>
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        selStep = parseInt(nid.replace("ss-", ""), 10) || 0;
        draw();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-safe"><span class="viz-tel-kicker">초등학생 발문</span><h5>${esc(s.tech)}</h5><p>${esc(s.elem)}</p></div>
          <div class="viz-tel-card is-primary"><span class="viz-tel-kicker">중·고등학생 발문</span><h5>${esc(s.tech)}</h5><p>${esc(s.sec)}</p></div>
          ${st ? `<div class="viz-tel-card is-warn"><span class="viz-tel-kicker">타임박스 · ${esc(st.mins)}</span><h5>${esc(st.step)}</h5><p>${esc(st.desc)}</p></div>` : ""}
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "s0", (cid) => {
      selTech = parseInt(cid.slice(1), 10) || 0;
      draw();
    });
  }

  function renderCh5Adler(container, ch) {
    const goals = (ch.diagrams && ch.diagrams.adlerGoals) || [];
    if (!goals.length) return;
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "ESCALATION CURVE · 표 5-1 교사 역전이 진단기",
      "교사 정서 단서별 그릇된 4목표 에스컬레이션 & 격려 역전 곡선",
      "문제행동 직후 교사에게 떠오르는 정서 단서를 클릭해 4단계 악순환 깊이와 격려·논리적 결과 역전 포인트를 확인하세요.",
      `
        <div class="viz-ctrl-bar">${goals.map((g, i) => `<button type="button" class="viz-ctrl-pill" data-chip="g${i}">${esc(g.cue.split("(")[0].trim())}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);
    const pts = [
      { x: 96, y: 68, short: "1. 관심 끌기", cue: "짜증·성가심" },
      { x: 244, y: 108, short: "2. 힘 과시", cue: "분노·맞대응" },
      { x: 392, y: 148, short: "3. 복수", cue: "상처·실망" },
      { x: 540, y: 188, short: "4. 무능 과시", cue: "포기·무기력" },
    ];

    function draw(idx) {
      const g = goals[idx] || goals[0];
      const p = pts[idx];
      stageEl.innerHTML = `
        <svg viewBox="0 0 640 250" class="viz-svg" role="img" aria-label="아들러 그릇된 행동 4목표 에스컬레이션 곡선">
          ${SvgKit.defs(uid)}
          <!-- Escalation Staircase Path -->
          <path d="M 96 68 L 244 108 L 392 148 L 540 188" fill="none" stroke="var(--viz-critical)" stroke-width="2.4" stroke-dasharray="6 4" marker-end="url(#${uid}-arr-crit)"/>
          <text x="320" y="230" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="10.5" font-weight="700">방치·강압 훈육 시 낙담 심화 방향 (관심 → 힘 → 복수 → 완전 포기) ▶</text>

          <!-- Encouraging Reversal Arrow at Active Step -->
          <path d="M ${p.x} ${p.y - 22} L ${p.x} 28" fill="none" stroke="var(--viz-safe)" stroke-width="2.8" marker-end="url(#${uid}-arr-safe)"/>
          <rect x="${Math.max(24, Math.min(460, p.x - 84))}" y="14" width="168" height="24" rx="999" fill="var(--viz-safe)"/>
          <text x="${Math.max(108, Math.min(544, p.x))}" y="30" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="800">✓ 격려 · 논리적 결과 역전!</text>

          ${pts
            .map((pt, i) => {
              const act = i === idx;
              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="g${i}" aria-label="${esc(pt.short)} 선택">
                  <rect x="${pt.x - 66}" y="${pt.y - 22}" width="132" height="44" rx="11" fill="${act ? "var(--viz-critical-soft)" : "var(--viz-surface)"}" stroke="${act ? "var(--viz-critical)" : "var(--viz-keyline)"}" stroke-width="${act ? "2.4" : "1.5"}"/>
                  <text x="${pt.x}" y="${pt.y - 2}" text-anchor="middle" fill="${act ? "var(--viz-critical)" : "var(--viz-ink)"}" font-size="11.5" font-weight="800">${esc(pt.short)}</text>
                  <text x="${pt.x}" y="${pt.y + 14}" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">${esc(pt.cue)}</text>
                </g>
              `;
            })
            .join("")}
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-critical"><span class="viz-tel-kicker">교사 역전이 단서: ${esc(g.cue)}</span><h5>${esc(g.goal)}</h5><p><strong>학생의 사적 논리:</strong> ${esc(g.childLogic)}</p></div>
          <div class="viz-tel-card is-safe"><span class="viz-tel-kicker">✓ 악순환 차단 개입</span><h5>격려 &amp; 논리적 결과</h5><p>${esc(g.intervention)}</p></div>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "g0", (cid) => {
      draw(parseInt(cid.slice(1), 10) || 0);
    });
  }

  function renderCh5Theories(container, ch) {
    const theories = (ch.diagrams && ch.diagrams.theories) || [];
    const axes = (ch.diagrams && ch.diagrams.radarAxes) || ["인지구조", "정서체험", "행동실천", "관계동맹", "과거역동", "구조화"];
    if (!theories.length) return;
    const uid = nextUid();

    const body = SvgKit.mountStudioShell(
      container,
      "RADAR POLYGON OVERLAY · 표 5-12 연계 1:1 대조",
      "9대 상담이론 6축 레이더 오버레이 & 임상 개념화 비교",
      "두 이론을 고르면 인지·정서·행동·관계·과거·구조화 6축 레이더 다각형이 실시간으로 겹쳐지며 인간관과 개입 기법이 대조됩니다.",
      `
        <div class="viz-select-pair">
          <label class="viz-select-label">이론 A (실선 · 파랑)
            <select id="${uid}-sel-a" class="btn" style="width:100%;border-radius:10px">${theories.map((t) => `<option value="${esc(t.id)}" ${t.id === "rebt" ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>
          </label>
          <label class="viz-select-label">이론 B (대시선 · 인디고)
            <select id="${uid}-sel-b" class="btn" style="width:100%;border-radius:10px">${theories.map((t) => `<option value="${esc(t.id)}" ${t.id === "beck" ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>
          </label>
        </div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );

    const selA = body.querySelector(`#${uid}-sel-a`);
    const selB = body.querySelector(`#${uid}-sel-b`);
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function polar(cx, cy, r, idx, n) {
      const ang = -Math.PI / 2 + (idx * 2 * Math.PI) / n;
      return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
    }

    function polyPoints(cx, cy, maxR, vals) {
      return vals
        .map((v, i) => {
          const [x, y] = polar(cx, cy, (v / 5) * maxR, i, vals.length);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    }

    function draw() {
      const a = theories.find((t) => t.id === selA.value) || theories[0];
      const b = theories.find((t) => t.id === selB.value) || theories[1] || theories[0];
      const cx = 190;
      const cy = 148;
      const maxR = 96;
      const valsA = a.radar || [3, 3, 3, 3, 3, 3];
      const valsB = b.radar || [3, 3, 3, 3, 3, 3];

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 295" class="viz-svg" role="img" aria-label="${esc(a.name)} 대 ${esc(b.name)} 6축 레이더 비교">
          <!-- Concentric spider rings 1..5 -->
          ${[1, 2, 3, 4, 5]
            .map((lv) => {
              const pts = axes.map((_, i) => polar(cx, cy, (lv / 5) * maxR, i, axes.length).map((n) => n.toFixed(1)).join(",")).join(" ");
              return `<polygon points="${pts}" fill="none" stroke="var(--viz-grid)" stroke-width="1"/>`;
            })
            .join("")}
          ${axes
            .map((ax, i) => {
              const [x2, y2] = polar(cx, cy, maxR, i, axes.length);
              const [lx, ly] = polar(cx, cy, maxR + 24, i, axes.length);
              return `
                <line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--viz-grid)" stroke-width="1.2"/>
                <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" fill="var(--viz-ink)" font-size="10.5" font-weight="800">${esc(ax)}</text>
              `;
            })
            .join("")}

          <!-- Polygons A & B -->
          <polygon points="${polyPoints(cx, cy, maxR, valsA)}" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="2.5"/>
          <polygon points="${polyPoints(cx, cy, maxR, valsB)}" fill="var(--viz-depth-soft)" stroke="var(--viz-depth)" stroke-width="2.5" stroke-dasharray="6 4"/>

          <!-- Vertices A (Circles) & B (Squares) -->
          ${valsA
            .map((v, i) => {
              const [px, py] = polar(cx, cy, (v / 5) * maxR, i, axes.length);
              return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4.5" fill="var(--viz-primary)" stroke="#ffffff" stroke-width="1.5"/>`;
            })
            .join("")}
          ${valsB
            .map((v, i) => {
              const [px, py] = polar(cx, cy, (v / 5) * maxR, i, axes.length);
              return `<rect x="${(px - 4).toFixed(1)}" y="${(py - 4).toFixed(1)}" width="8" height="8" fill="var(--viz-depth)" stroke="#ffffff" stroke-width="1.4"/>`;
            })
            .join("")}

          <!-- Right Side Score Bar Readout -->
          <rect x="352" y="22" width="268" height="250" rx="14" fill="var(--viz-surface)" stroke="var(--viz-keyline)"/>
          <circle cx="374" cy="44" r="5" fill="var(--viz-primary)"/>
          <text x="386" y="48" fill="var(--viz-primary)" font-size="11" font-weight="800">${esc(a.shortName || a.name)}</text>
          <rect x="490" y="39" width="9" height="9" fill="var(--viz-depth)"/>
          <text x="505" y="48" fill="var(--viz-depth)" font-size="11" font-weight="800">${esc(b.shortName || b.name)}</text>

          ${axes
            .map((ax, i) => {
              const y = 76 + i * 32;
              const wA = (valsA[i] / 5) * 124;
              const wB = (valsB[i] / 5) * 124;
              return `
                <text x="368" y="${y + 10}" fill="var(--viz-ink)" font-size="10.2" font-weight="700">${esc(ax)}</text>
                <rect x="444" y="${y - 2}" width="124" height="6" rx="3" fill="var(--viz-grid)"/>
                <rect x="444" y="${y - 2}" width="${wA.toFixed(1)}" height="6" rx="3" fill="var(--viz-primary)"/>
                <rect x="444" y="${y + 8}" width="124" height="6" rx="3" fill="var(--viz-grid)"/>
                <rect x="444" y="${y + 8}" width="${wB.toFixed(1)}" height="6" rx="3" fill="var(--viz-depth)"/>
                <text x="606" y="${y + 10}" text-anchor="end" fill="var(--viz-ink-sub)" font-size="9.5" font-weight="700">${valsA[i]} : ${valsB[i]}</text>
              `;
            })
            .join("")}
        </svg>
      `;

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-primary">
            <span class="viz-tel-kicker">● 이론 A · 실선 프로파일</span>
            <h5>${esc(a.name)}</h5>
            <p><strong>인간관:</strong> ${esc(a.human)}</p>
            <p style="margin-top:4px"><strong>부적응 기제:</strong> ${esc(a.cause)}</p>
            <p style="margin-top:4px"><strong>사례 해석:</strong> ${esc(a.caseLens)}</p>
            <p style="margin-top:4px"><strong>핵심 기법:</strong> ${esc(a.tech)}</p>
          </div>
          <div class="viz-tel-card is-depth">
            <span class="viz-tel-kicker">■ 이론 B · 대시 프로파일</span>
            <h5>${esc(b.name)}</h5>
            <p><strong>인간관:</strong> ${esc(b.human)}</p>
            <p style="margin-top:4px"><strong>부적응 기제:</strong> ${esc(b.cause)}</p>
            <p style="margin-top:4px"><strong>사례 해석:</strong> ${esc(b.caseLens)}</p>
            <p style="margin-top:4px"><strong>핵심 기법:</strong> ${esc(b.tech)}</p>
          </div>
        </div>
      `;
    }

    selA.addEventListener("change", draw);
    selB.addEventListener("change", draw);
    draw();
  }

  function renderCh5Glasser(container) {
    const parts = [
      { id: "steer", label: "핸들: 5대 욕구 · 질적 세계", role: "방향 결정자", tone: "primary", desc: "생존·사랑과 소속·힘·자유·즐거움 중 어떤 욕구가 질적 세계(Quality World)에서 좌절되었는지가 모든 선택 행동의 출발점입니다." },
      { id: "front", label: "앞바퀴: 행동(Acting) · 사고(Thinking)", role: "✓ 직접 조향 가능!", tone: "safe", desc: "네 요소 중 학생이 지금 당장 직접 바꾸고 통제할 수 있는 두 바퀴입니다. '오늘 교실 자리에서 뭘 달리해 볼까?'를 WDEP(SAMIC³)로 조향합니다." },
      { id: "rear", label: "뒷바퀴: 감정(Feeling) · 생리(Physiology)", role: "앞바퀴 따라 종속 이동", tone: "warn", desc: "우울하기·분노하기·두통 등 감정과 신체 반응은 뒷바퀴입니다. 뒷바퀴만 직접 비틀 수 없으므로 앞바퀴(행동·생각) 선택을 바꿀 때 함께 달라집니다." },
    ];
    const uid = nextUid();
    const body = SvgKit.mountStudioShell(
      container,
      "MECHANISM VECTOR · 표 5-13 · 5-14",
      "글래서 선택이론 전행동 자동차(Total Behavior) 조향 도해",
      "자동차의 핸들·앞바퀴·뒷바퀴를 직접 클릭해 왜 현실치료가 '감정 탓하기' 대신 앞바퀴(행동·생각) 조향에 집중하는지 확인하세요.",
      `
        <div class="viz-ctrl-bar">${parts.map((p) => `<button type="button" class="viz-ctrl-pill" data-chip="${p.id}">${esc(p.label)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(id) {
      const p = parts.find((x) => x.id === id) || parts[1];
      const actS = id === "steer";
      const actF = id === "front";
      const actR = id === "rear";
      stageEl.innerHTML = `
        <svg viewBox="0 0 640 245" class="viz-svg" role="img" aria-label="글래서 전행동 자동차 조향 도해">
          ${SvgKit.defs(uid)}
          <!-- Car Chassis -->
          <rect x="116" y="54" width="388" height="134" rx="34" fill="var(--viz-surface)" stroke="var(--viz-keyline)" stroke-width="2"/>
          <line x1="196" y1="121" x2="432" y2="121" stroke="var(--viz-grid)" stroke-width="3"/>

          <!-- Drive Direction Arrow -->
          <path d="M 522 121 L 598 94" fill="none" stroke="var(--viz-safe)" stroke-width="2.6" marker-end="url(#${uid}-arr-safe)"/>
          <text x="564" y="80" text-anchor="middle" fill="var(--viz-safe)" font-size="10.5" font-weight="800">선택 조향 방향</text>

          <!-- Rear Wheels (Feeling & Physiology) -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="rear" aria-label="뒷바퀴 감정과 생리 선택">
            <rect x="148" y="28" width="88" height="30" rx="8" fill="${actR ? "var(--viz-warn)" : "var(--viz-surface-alt)"}" stroke="var(--viz-warn)" stroke-width="2"/>
            <text x="192" y="47" text-anchor="middle" fill="${actR ? "#0f172a" : "var(--viz-ink)"}" font-size="10.5" font-weight="800">감정 (Feeling)</text>

            <rect x="148" y="184" width="88" height="30" rx="8" fill="${actR ? "var(--viz-warn)" : "var(--viz-surface-alt)"}" stroke="var(--viz-warn)" stroke-width="2"/>
            <text x="192" y="203" text-anchor="middle" fill="${actR ? "#0f172a" : "var(--viz-ink)"}" font-size="10.5" font-weight="800">생리 (Physio)</text>
            <text x="192" y="156" text-anchor="middle" fill="var(--viz-warn)" font-size="10" font-weight="700">뒷바퀴 (종속 추적)</text>
          </g>

          <!-- Steering Wheel (5 Basic Needs & Quality World) -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="steer" aria-label="핸들 5대욕구와 질적세계 선택">
            <circle cx="304" cy="121" r="36" fill="${actS ? "var(--viz-primary-soft)" : "var(--viz-canvas)"}" stroke="var(--viz-primary)" stroke-width="${actS ? "3" : "2"}"/>
            <circle cx="304" cy="121" r="14" fill="var(--viz-primary)"/>
            <text x="304" y="170" text-anchor="middle" fill="var(--viz-primary)" font-size="10.5" font-weight="800">핸들: 5대 욕구 · 질적세계</text>
          </g>
          <line x1="340" y1="121" x2="432" y2="121" stroke="var(--viz-primary)" stroke-width="3"/>

          <!-- Front Wheels (Acting & Thinking - Steered) -->
          <g class="viz-node" tabindex="0" role="button" data-node-id="front" aria-label="앞바퀴 행동과 사고 선택">
            <rect x="388" y="24" width="96" height="32" rx="9" fill="${actF ? "var(--viz-safe)" : "var(--viz-safe-soft)"}" stroke="var(--viz-safe)" stroke-width="2.2" transform="rotate(-14 436 40)"/>
            <text x="436" y="44" text-anchor="middle" fill="${actF ? "#ffffff" : "var(--viz-safe)"}" font-size="10.5" font-weight="800" transform="rotate(-14 436 40)">✓ 행동 (Acting)</text>

            <rect x="388" y="186" width="96" height="32" rx="9" fill="${actF ? "var(--viz-safe)" : "var(--viz-safe-soft)"}" stroke="var(--viz-safe)" stroke-width="2.2" transform="rotate(-14 436 202)"/>
            <text x="436" y="206" text-anchor="middle" fill="${actF ? "#ffffff" : "var(--viz-safe)"}" font-size="10.5" font-weight="800" transform="rotate(-14 436 202)">✓ 사고 (Thinking)</text>
            <text x="436" y="156" text-anchor="middle" fill="var(--viz-safe)" font-size="10" font-weight="800">앞바퀴 (직접 조향!)</text>
          </g>
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-card is-${p.tone}">
          <span class="viz-tel-kicker">${esc(p.role)}</span>
          <h5>${esc(p.label)}</h5>
          <p>${esc(p.desc)}</p>
          <p style="margin-top:8px;font-size:0.82rem"><strong>SAMIC³ 점검:</strong> Simple(단순) · Attainable(달성가능) · Measurable(측정) · Immediate(즉각) · Consistent(일관) · Controlled by Student(학생 통제)</p>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "front", draw);
  }

  function renderCh6Yalom(container, ch) {
    const factors = (ch.diagrams && ch.diagrams.yalom11) || [];
    const clusters = (ch.diagrams && ch.diagrams.yalomClusters) || [{ id: "all", label: "전체 성좌", tone: "primary" }];
    if (!factors.length) return;
    const uid = nextUid();
    let activeCluster = "all";
    let selNum = 9; // Group Cohesion default

    const body = SvgKit.mountStudioShell(
      container,
      "CONSTELLATION NETWORK · 표 6-3 치료 엔진",
      "얄롬과 레슈츠(Yalom & Leszcz) 11대 치료적 요인 성좌",
      "클러스터 필터로 요인 묶음을 보거나, 별자리 노드를 직접 클릭해 학교 집단상담에서의 치유 기제를 확인하세요.",
      `
        <div class="viz-ctrl-bar">${clusters.map((c) => `<button type="button" class="viz-ctrl-pill" data-chip="${esc(c.id)}">${esc(c.label)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    const coords = {
      9: [320, 142], // Core cohesion
      1: [164, 66],
      2: [110, 146],
      6: [480, 66],
      7: [544, 142],
      8: [480, 218],
      3: [232, 232],
      4: [390, 238],
      5: [184, 214],
      10: [280, 56],
      11: [398, 56],
    };
    const clusterColors = {
      safety: "var(--viz-safe)",
      interpersonal: "var(--viz-primary)",
      empower: "var(--viz-depth)",
      insight: "var(--viz-warn)",
    };

    function draw() {
      const selFactor = factors.find((f) => f.num === selNum) || factors[0];
      const cx = 320;
      const cy = 142;

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 278" class="viz-svg" role="img" aria-label="얄롬 11대 치료적 요인 성좌 네트워크">
          <!-- Orbits -->
          <ellipse cx="${cx}" cy="${cy}" rx="238" ry="108" fill="none" stroke="var(--viz-grid)" stroke-dasharray="5 4"/>
          <ellipse cx="${cx}" cy="${cy}" rx="154" ry="74" fill="none" stroke="var(--viz-grid)"/>

          <!-- Constellation Links -->
          ${factors
            .map((f) => {
              if (f.num === 9) return "";
              const [fx, fy] = coords[f.num] || [cx, cy];
              const act = activeCluster === "all" || f.cluster === activeCluster;
              const col = clusterColors[f.cluster] || "var(--viz-primary)";
              return `<line x1="${cx}" y1="${cy}" x2="${fx}" y2="${fy}" stroke="${act ? col : "var(--viz-grid)"}" stroke-width="${act ? "1.8" : "1"}" opacity="${act ? "0.72" : "0.25"}"/>`;
            })
            .join("")}

          <!-- Factor Nodes -->
          ${factors
            .map((f) => {
              const [fx, fy] = coords[f.num] || [cx, cy];
              const act = activeCluster === "all" || f.cluster === activeCluster;
              const isSel = f.num === selNum;
              const col = clusterColors[f.cluster] || "var(--viz-primary)";
              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="y${f.num}" opacity="${act ? "1" : "0.22"}" aria-label="${f.num}. ${esc(f.name)}">
                  ${isSel ? `<circle cx="${fx}" cy="${fy}" r="22" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="3 2"/>` : ""}
                  <circle cx="${fx}" cy="${fy}" r="${f.num === 9 ? "19" : "15"}" fill="${isSel ? col : "var(--viz-surface)"}" stroke="${col}" stroke-width="2"/>
                  <text x="${fx}" y="${fy + 4}" text-anchor="middle" fill="${isSel ? "#ffffff" : col}" font-size="10.5" font-weight="800">${f.num}</text>
                  <text x="${fx}" y="${fy + 29}" text-anchor="middle" fill="var(--viz-ink)" font-size="9.8" font-weight="800">${esc(shortLabel(f.name, 9))}</text>
                </g>
              `;
            })
            .join("")}
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        selNum = parseInt(nid.slice(1), 10) || 1;
        draw();
      });

      const clMeta = clusters.find((c) => c.id === selFactor.cluster) || { label: "치료 요인", tone: "primary" };
      hudEl.innerHTML = `
        <div class="viz-tel-card is-${clMeta.tone}">
          <span class="viz-tel-kicker">요인 ${selFactor.num} · ${esc(clMeta.label)}</span>
          <h5>${esc(selFactor.name)}</h5>
          <p>${esc(selFactor.desc)}</p>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "all", (cid) => {
      activeCluster = cid;
      if (cid !== "all") {
        const first = factors.find((f) => f.cluster === cid);
        if (first) selNum = first.num;
      }
      draw();
    });
  }

  function renderCh6Stages(container, ch) {
    const stages = (ch.diagrams && ch.diagrams.groupStages) || [];
    if (!stages.length) return;
    const uid = nextUid();
    const xs = [98, 246, 394, 542];

    const body = SvgKit.mountStudioShell(
      container,
      "DYNAMICS WAVE CURVE · 표 6-12 발달 역동",
      "집단 거시 4단계 응집력 vs 갈등 파동 & 과도기 개입 포인트",
      "단계를 선택하거나 파동 노드를 클릭해 응집력과 저항·갈등이 교차하는 과도기 돌파 전략을 확인하세요.",
      `
        <div class="viz-ctrl-bar">${stages.map((s, i) => `<button type="button" class="viz-ctrl-pill" data-chip="gs${i}">${esc(s.stage.split("(")[0].trim())}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);
    const mapY = (pct) => 200 - (pct / 100) * 145;

    function draw(idx) {
      const st = stages[idx] || stages[1];
      const cohPts = stages.map((s, i) => `${xs[i]},${mapY(s.cohesion || 50).toFixed(1)}`).join(" ");
      const conPts = stages.map((s, i) => `${xs[i]},${mapY(s.conflict || 40).toFixed(1)}`).join(" ");

      stageEl.innerHTML = `
        <svg viewBox="0 0 640 245" class="viz-svg" role="img" aria-label="집단 4단계 응집력과 갈등 파동 그래프">
          <rect x="44" y="34" width="560" height="170" rx="12" fill="var(--viz-surface)" stroke="var(--viz-grid)"/>
          <!-- Active column -->
          <rect x="${xs[idx] - 58}" y="38" width="116" height="162" rx="10" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="1.6"/>

          <!-- Wave Lines -->
          <polyline points="${cohPts}" fill="none" stroke="var(--viz-safe)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="${conPts}" fill="none" stroke="var(--viz-critical)" stroke-width="2.6" stroke-dasharray="6 4" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Blocking -> Linking callout at Transition Peak -->
          <rect x="190" y="16" width="144" height="22" rx="999" fill="var(--viz-critical)"/>
          <text x="262" y="31" text-anchor="middle" fill="#ffffff" font-size="9.5" font-weight="800">! 과도기 Blocking → Linking</text>

          ${stages
            .map((s, i) => {
              const act = i === idx;
              const yCoh = mapY(s.cohesion || 50);
              const yCon = mapY(s.conflict || 40);
              return `
                <g class="viz-node" tabindex="0" role="button" data-node-id="gs${i}" aria-label="${esc(s.stage)} 선택">
                  <circle cx="${xs[i]}" cy="${yCoh.toFixed(1)}" r="${act ? "7" : "5"}" fill="var(--viz-safe)" stroke="#ffffff" stroke-width="1.8"/>
                  <rect x="${xs[i] - 5}" y="${(yCon - 5).toFixed(1)}" width="10" height="10" fill="var(--viz-critical)" stroke="#ffffff" stroke-width="1.5"/>
                  <text x="${xs[i]}" y="224" text-anchor="middle" fill="${act ? "var(--viz-primary)" : "var(--viz-ink)"}" font-size="10.5" font-weight="800">${esc(shortLabel(s.stage.split("(")[0], 9))}</text>
                  <text x="${xs[i]}" y="238" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.2">${esc(s.sessions.split("(")[0].trim())}</text>
                </g>
              `;
            })
            .join("")}

          <text x="58" y="54" fill="var(--viz-safe)" font-size="10" font-weight="800">● 실선: 집단 응집력</text>
          <text x="58" y="70" fill="var(--viz-critical)" font-size="10" font-weight="800">■ 점선: 갈등·저항 파동</text>
        </svg>
      `;

      SvgKit.bindSvgNodes(stageEl, "[data-node-id]", (nid) => {
        const btn = body.querySelector(`[data-chip="${nid}"]`);
        if (btn) btn.click();
      });

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-${idx === 1 ? "critical" : "safe"}">
            <span class="viz-tel-kicker">${esc(st.sessions)} · 응집 ${st.cohesion}% / 갈등 ${st.conflict}%</span>
            <h5>${esc(st.stage)}</h5>
            <p>${esc(st.dynamic)}</p>
          </div>
          <div class="viz-tel-card is-primary">
            <span class="viz-tel-kicker">✓ 리더 핵심 개입 초점</span>
            <h5>과정화 · 차단 · 연결</h5>
            <p>${esc(st.leader)}</p>
          </div>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "gs1", (cid) => {
      draw(parseInt(cid.slice(2), 10) || 0);
    });
  }

  function renderCh6Praise(container, ch) {
    const rows = (ch.diagrams && ch.diagrams.praiseVsEnc) || [];
    if (!rows.length) return;
    const uid = nextUid();

    const body = SvgKit.mountStudioShell(
      container,
      "FORCE FIELD ANALYSIS · 표 6-15 교실 발화 변환기",
      "외적 통제(칭찬·처벌) vs 민주적 격려(논리적 결과) 힘의 장",
      "교실 상황을 선택해 학생의 내재 동기를 누르는 통제 힘과 자율성을 키우는 격려 힘의 대립 구조를 확인하세요.",
      `
        <div class="viz-ctrl-bar">${rows.map((p, i) => `<button type="button" class="viz-ctrl-pill" data-chip="pv${i}">${esc(p.type)}</button>`).join("")}</div>
        <div class="viz-stage-frame" id="${uid}-stage"></div>
        <div class="viz-telemetry-hud" id="${uid}-hud"></div>
      `
    );
    const stageEl = body.querySelector(`#${uid}-stage`);
    const hudEl = body.querySelector(`#${uid}-hud`);

    function draw(idx) {
      const row = rows[idx] || rows[0];
      stageEl.innerHTML = `
        <svg viewBox="0 0 640 220" class="viz-svg" role="img" aria-label="외적 통제와 민주적 격려 힘의 장 분석">
          ${SvgKit.defs(uid)}
          <!-- Center Baseline: Student Autonomy -->
          <rect x="256" y="28" width="128" height="164" rx="16" fill="var(--viz-primary-soft)" stroke="var(--viz-primary)" stroke-width="2"/>
          <text x="320" y="96" text-anchor="middle" fill="var(--viz-ink)" font-size="12.5" font-weight="800">학생 자율성</text>
          <text x="320" y="116" text-anchor="middle" fill="var(--viz-primary)" font-size="10.5" font-weight="800">내재동기·책임감</text>
          <text x="320" y="136" text-anchor="middle" fill="var(--viz-ink-sub)" font-size="9.5">${esc(row.type)}</text>

          <!-- Left Restraining Forces (Control / Praise-Punish) -->
          <rect x="20" y="34" width="176" height="44" rx="10" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-dasharray="4 3"/>
          <text x="108" y="60" text-anchor="middle" fill="var(--viz-critical)" font-size="10.5" font-weight="800">✕ 서열 평가 · 실수 공포</text>
          <line x1="196" y1="56" x2="250" y2="56" stroke="var(--viz-critical)" stroke-width="2.4" stroke-dasharray="5 3" marker-end="url(#${uid}-arr-crit)"/>

          <rect x="20" y="88" width="176" height="44" rx="10" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-dasharray="4 3"/>
          <text x="108" y="114" text-anchor="middle" fill="var(--viz-critical)" font-size="10.5" font-weight="800">✕ 외재 보상 · 비교 통제</text>
          <line x1="196" y1="110" x2="250" y2="110" stroke="var(--viz-critical)" stroke-width="2.4" stroke-dasharray="5 3" marker-end="url(#${uid}-arr-crit)"/>

          <rect x="20" y="142" width="176" height="44" rx="10" fill="var(--viz-critical-soft)" stroke="var(--viz-critical)" stroke-dasharray="4 3"/>
          <text x="108" y="168" text-anchor="middle" fill="var(--viz-critical)" font-size="10.5" font-weight="800">✕ 수치심 · 결함 낙인</text>
          <line x1="196" y1="164" x2="250" y2="164" stroke="var(--viz-critical)" stroke-width="2.4" stroke-dasharray="5 3" marker-end="url(#${uid}-arr-crit)"/>

          <!-- Right Driving Forces (Encouragement / Logical Consequences) -->
          <line x1="384" y1="56" x2="442" y2="56" stroke="var(--viz-safe)" stroke-width="2.8" marker-end="url(#${uid}-arr-safe)"/>
          <rect x="446" y="34" width="174" height="44" rx="10" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="1.8"/>
          <text x="533" y="60" text-anchor="middle" fill="var(--viz-safe)" font-size="10.5" font-weight="800">✓ 과정 · 끈기 격려</text>

          <line x1="384" y1="110" x2="442" y2="110" stroke="var(--viz-safe)" stroke-width="2.8" marker-end="url(#${uid}-arr-safe)"/>
          <rect x="446" y="88" width="174" height="44" rx="10" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="1.8"/>
          <text x="533" y="114" text-anchor="middle" fill="var(--viz-safe)" font-size="10.5" font-weight="800">✓ 존중 · 논리적 결과</text>

          <line x1="384" y1="164" x2="442" y2="164" stroke="var(--viz-safe)" stroke-width="2.8" marker-end="url(#${uid}-arr-safe)"/>
          <rect x="446" y="142" width="174" height="44" rx="10" fill="var(--viz-safe-soft)" stroke="var(--viz-safe)" stroke-width="1.8"/>
          <text x="533" y="168" text-anchor="middle" fill="var(--viz-safe)" font-size="10.5" font-weight="800">✓ 기여 · 사회적 관심</text>
        </svg>
      `;

      hudEl.innerHTML = `
        <div class="viz-tel-grid">
          <div class="viz-tel-card is-critical"><span class="viz-tel-kicker">✕ 외적 통제 (칭찬/처벌)</span><p>${esc(row.control)}</p></div>
          <div class="viz-tel-card is-safe"><span class="viz-tel-kicker">✓ 민주적 성장 (격려/논리적 결과)</span><p>${esc(row.encouragement)}</p></div>
        </div>
      `;
    }

    SvgKit.bindSegmentedControls(body, "[data-chip]", "pv0", (cid) => {
      draw(parseInt(cid.slice(2), 10) || 0);
    });
  }

  const WIDGET_REGISTRY = {
    "ch1-spectrum": renderCh1Spectrum,
    "ch1-timeline": renderCh1Timeline,
    "ch1-room-blueprint": renderCh1Floorplan,
    "ch2-ages": renderCh2Ages,
    "ch2-zpd": renderCh2Zpd,
    "ch2-defenses": renderCh2Defenses,
    "ch2-marcia": renderCh2Marcia,
    "ch3-tasks": renderCh3Tasks,
    "ch3-tree": renderCh3Tree,
    "ch3-burnout": renderCh3Burnout,
    "ch4-micro": renderCh4Micro,
    "ch4-sfbt": renderCh4Sfbt,
    "ch5-adler": renderCh5Adler,
    "ch5-theories": renderCh5Theories,
    "ch5-glasser": renderCh5Glasser,
    "ch6-yalom": renderCh6Yalom,
    "ch6-stages": renderCh6Stages,
    "ch6-praise": renderCh6Praise,
  };

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
      if (ctrl && typeof ctrl.updateBeat === "function") ctrl.updateBeat(initialBeatIdx, 0, 1);
      return ctrl;
    },
    renderSectionWidget(container, widgetId, chapterObj) {
      if (!container || !widgetId || !chapterObj) return;
      const renderer = WIDGET_REGISTRY[widgetId];
      if (typeof renderer === "function") {
        renderer(container, chapterObj);
      }
    },
    renderChapterDiagram(container, chapterObj) {
      if (!container || !chapterObj) return;
      const defaultWidget = {
        1: "ch1-spectrum",
        2: "ch2-ages",
        3: "ch3-tree",
        4: "ch4-micro",
        5: "ch5-theories",
        6: "ch6-yalom",
      };
      const wId = defaultWidget[chapterObj.chapter];
      if (wId && WIDGET_REGISTRY[wId]) {
        WIDGET_REGISTRY[wId](container, chapterObj);
      }
    },
  };
})();
