/* ==========================================================================
   Apple Scrollytelling Engine — Lenis + GSAP ScrollTrigger + Liquid Glass Pill
   Gracefully degrades when offline (no CDN) or prefers-reduced-motion: reduce.
   ========================================================================== */

(function () {
  let lenisInstance = null;
  let activeGsapCtx = null;
  let activeMatchMedia = null;
  let activeScrollListener = null;
  let activeBeats = [];
  let activeSections = [];
  let activeChapter = null;

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function buildSdfBevelMap() {
    try {
      const feImg = document.getElementById("sdf-bevel-feimage");
      if (!feImg) return;
      const canvas = document.createElement("canvas");
      if (!canvas || typeof canvas.getContext !== "function") return;
      const w = 160;
      const h = 56;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = ctx.createImageData(w, h);
      const rx = w / 2;
      const ry = h / 2;
      const rad = ry - 2;
      const bevel = 12;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const qx = Math.abs(x - rx) - (rx - rad);
          const qy = Math.abs(y - ry) - (ry - rad);
          const outDist =
            Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
          let nx = 0;
          let ny = 0;
          if (outDist < 0 && outDist > -bevel) {
            const t = 1 - Math.abs(outDist) / bevel;
            const strength = t * t * 0.92;
            const dx = x - rx;
            const dy = y - ry;
            const len = Math.hypot(dx, dy) || 1;
            nx = (dx / len) * strength;
            ny = (dy / len) * strength;
          }
          const idx = (y * w + x) * 4;
          img.data[idx] = Math.round(128 + nx * 127);
          img.data[idx + 1] = Math.round(128 + ny * 127);
          img.data[idx + 2] = 128;
          img.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      feImg.setAttribute("href", canvas.toDataURL("image/png"));
    } catch (_e) {
      // Safe no-op in headless/test DOM environments
    }
  }

  function initGlobalChrome() {
    buildSdfBevelMap();
    if (prefersReducedMotion()) return;
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;

    window.gsap.registerPlugin(window.ScrollTrigger);

    if (typeof window.Lenis === "function" && !lenisInstance) {
      lenisInstance = new window.Lenis({
        lerp: 0.09,
        smoothWheel: true,
        wheelMultiplier: 0.92,
      });
      lenisInstance.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => {
        if (lenisInstance) lenisInstance.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
    }
  }

  function scrollToElement(el) {
    if (!el) return;
    if (lenisInstance && typeof lenisInstance.scrollTo === "function" && !prefersReducedMotion()) {
      lenisInstance.scrollTo(el, { offset: -115, duration: 0.85 });
    } else if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  }

  function teardown() {
    if (activeScrollListener) {
      window.removeEventListener("scroll", activeScrollListener);
      activeScrollListener = null;
    }
    if (activeMatchMedia) {
      try {
        activeMatchMedia.revert();
      } catch (_e) {}
      activeMatchMedia = null;
    }
    if (activeGsapCtx) {
      try {
        activeGsapCtx.revert();
      } catch (_e) {}
      activeGsapCtx = null;
    }
    activeBeats = [];
    activeSections = [];
    activeChapter = null;

    const pill = document.getElementById("apple-section-pill");
    if (pill) {
      pill.hidden = true;
      pill.innerHTML = "";
    }
  }

  function renderFloatingSectionPill(ch) {
    const pill = document.getElementById("apple-section-pill");
    if (!pill || !ch || !ch.coreSections) return;
    const readMap = window.StudyStore ? window.StudyStore.getState().readSections || {} : {};
    pill.innerHTML = `
      <span class="pill-ch-tag">${ch.code}</span>
      <div class="pill-dots" role="navigation" aria-label="${ch.code} 절 빠른 이동">
        ${ch.coreSections
          .map((sec, idx) => {
            const done = Boolean(readMap[sec.id]);
            return `
              <button
                type="button"
                class="pill-dot ${idx === 0 ? "is-current" : ""} ${done ? "is-done" : ""}"
                data-pill-sec="${sec.id}"
                aria-label="${sec.secNo} ${sec.title} (${done ? "완료" : "미완료"})"
                title="${sec.secNo} ${sec.title}"
              >
                <span class="pill-fill" style="transform:scaleX(${idx === 0 ? 0.15 : 0})"></span>
                <span class="pill-num">${sec.secNo}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      <span class="pill-read-stat tabular" id="pill-done-stat"></span>
    `;
    pill.hidden = false;

    pill.querySelectorAll("[data-pill-sec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.pillSec);
        scrollToElement(target);
      });
    });

    syncSectionPillDone(ch);
  }

  function syncSectionPillDone(ch) {
    const targetCh = ch || activeChapter;
    if (!targetCh) return;
    const pill = document.getElementById("apple-section-pill");
    if (!pill || pill.hidden) return;
    const readMap = window.StudyStore ? window.StudyStore.getState().readSections || {} : {};
    let doneCount = 0;
    targetCh.coreSections.forEach((sec) => {
      const done = Boolean(readMap[sec.id]);
      if (done) doneCount += 1;
      const dot = pill.querySelector(`[data-pill-sec="${sec.id}"]`);
      if (dot) {
        dot.classList.toggle("is-done", done);
        dot.setAttribute("aria-label", `${sec.secNo} ${sec.title} (${done ? "완료" : "미완료"})`);
      }
    });
    const statEl = pill.querySelector("#pill-done-stat");
    if (statEl) statEl.textContent = `${doneCount}/${targetCh.coreSections.length}`;
  }

  function mountChapterLearn(root, ch) {
    teardown();
    if (!root || !ch) return;
    activeChapter = ch;

    // 1. Mount Pinned SVG Stage
    const stageEl = root.querySelector(`#pinned-stage-ch${ch.chapter}`);
    const svgHost = stageEl ? stageEl.querySelector(`#stage-svg-host-${ch.chapter}`) : null;
    const hudPct = stageEl ? stageEl.querySelector(`#stage-pct-${ch.chapter}`) : null;
    const hudBeat = stageEl ? stageEl.querySelector(`#stage-beat-lbl-${ch.chapter}`) : null;

    let svgCtrl = { updateBeat() {} };
    if (svgHost && window.DiagramEngine && typeof window.DiagramEngine.renderPinnedStageGraphic === "function") {
      svgCtrl = window.DiagramEngine.renderPinnedStageGraphic(svgHost, ch, 0);
    }

    activeBeats = stageEl ? Array.from(stageEl.querySelectorAll("[data-story-beat]")) : [];
    const beatDots = stageEl ? Array.from(stageEl.querySelectorAll("[data-stage-dot]")) : [];

    function activateBeat(beatIdx, rawProgress, explicitLocalT) {
      const n = Math.max(1, activeBeats.length);
      const clampedIdx = Math.max(0, Math.min(n - 1, beatIdx));
      const p = Math.max(0, Math.min(1, rawProgress ?? clampedIdx / Math.max(1, n - 1)));
      const localT =
        typeof explicitLocalT === "number"
          ? Math.max(0, Math.min(1, explicitLocalT))
          : prefersReducedMotion()
          ? 1
          : Math.max(0, Math.min(1, p * n - clampedIdx));
      activeBeats.forEach((b, i) => b.classList.toggle("is-active", i === clampedIdx));
      beatDots.forEach((d, i) => {
        d.classList.toggle("is-active", i === clampedIdx);
        d.setAttribute("aria-pressed", i === clampedIdx ? "true" : "false");
      });
      if (hudPct) hudPct.textContent = `${Math.round(p * 100)}%`;
      if (hudBeat) hudBeat.textContent = `BEAT 0${clampedIdx + 1} / 0${n || 4}`;
      if (svgCtrl && typeof svgCtrl.updateBeat === "function") {
        svgCtrl.updateBeat(clampedIdx, p, localT);
      }
    }

    activeBeats.forEach((beatEl, i) => {
      beatEl.addEventListener("click", () => {
        activateBeat(i, i / Math.max(1, activeBeats.length - 1), 1);
      });
    });
    beatDots.forEach((dotEl) => {
      dotEl.addEventListener("click", () => {
        const i = parseInt(dotEl.dataset.stageDot, 10) || 0;
        activateBeat(i, i / Math.max(1, activeBeats.length - 1), 1);
        const targetBeat = activeBeats[i];
        if (targetBeat) scrollToElement(targetBeat);
      });
    });

    if (activeBeats.length) activateBeat(0, 0, 1);

    // 2. Mount Floating Liquid Glass Section Pill
    renderFloatingSectionPill(ch);
    activeSections = Array.from(root.querySelectorAll("article.sec-article[id]"));

    // 3. GSAP Masked Line Reveals & ScrollTrigger Scrub (when CDN loaded & motion allowed)
    const reduce = prefersReducedMotion();
    if (!reduce && typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined") {
      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;

      activeGsapCtx = gsap.context(() => {
        const lineSpans = gsap.utils.toArray(".motion-line-mask > span", root);
        if (lineSpans.length) {
          gsap.fromTo(
            lineSpans,
            { yPercent: 105, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.78, ease: "power4.out", stagger: 0.08 }
          );
        }
      }, root);

      if (stageEl && activeBeats.length > 1) {
        activeMatchMedia = gsap.matchMedia();
        activeMatchMedia.add("(min-width: 768px)", () => {
          ScrollTrigger.create({
            trigger: stageEl,
            start: "top 16%",
            end: "bottom 72%",
            scrub: 0.8,
            onUpdate: (self) => {
              const p = self.progress;
              const idx = Math.min(activeBeats.length - 1, Math.floor(p * activeBeats.length));
              activateBeat(idx, p);
            },
          });
        });
      }

      ScrollTrigger.refresh();
    }

    // 4. Native lightweight scroll tracker for Section Progress Pill & Mobile/Offline Fallback
    function updateOnScroll() {
      const viewMid = (window.innerHeight || 800) * 0.42;

      // Update floating section pill dot + internal scaleX bar
      const pill = document.getElementById("apple-section-pill");
      if (pill && !pill.hidden && activeSections.length) {
        let bestIdx = 0;
        let bestFill = 0;
        activeSections.forEach((secEl, idx) => {
          if (typeof secEl.getBoundingClientRect !== "function") return;
          const r = secEl.getBoundingClientRect();
          if (r.top <= viewMid) {
            bestIdx = idx;
            const totalH = Math.max(1, r.height);
            bestFill = Math.max(0.08, Math.min(1, (viewMid - r.top) / totalH));
          }
        });
        activeSections.forEach((secEl, idx) => {
          const dot = pill.querySelector(`[data-pill-sec="${secEl.id}"]`);
          if (!dot) return;
          const isCur = idx === bestIdx;
          dot.classList.toggle("is-current", isCur);
          const fill = dot.querySelector(".pill-fill");
          if (fill) {
            fill.style.transform = `scaleX(${isCur ? bestFill : idx < bestIdx ? 1 : 0})`;
          }
        });
      }

      // Native fallback beat sync when ScrollTrigger is absent (e.g. offline/mobile)
      if ((typeof window.ScrollTrigger === "undefined" || (window.innerWidth || 1024) < 768) && activeBeats.length > 1) {
        let bestBeat = 0;
        activeBeats.forEach((b, idx) => {
          if (typeof b.getBoundingClientRect === "function") {
            const r = b.getBoundingClientRect();
            if (r.top <= (window.innerHeight || 800) * 0.55) bestBeat = idx;
          }
        });
        activateBeat(bestBeat, bestBeat / Math.max(1, activeBeats.length - 1), 1);
      }
    }

    activeScrollListener = updateOnScroll;
    window.addEventListener("scroll", activeScrollListener, { passive: true });
    updateOnScroll();
  }

  window.ScrollyEngine = {
    initGlobalChrome,
    mountChapterLearn,
    syncSectionPillDone,
    scrollToElement,
    teardown,
  };
})();
