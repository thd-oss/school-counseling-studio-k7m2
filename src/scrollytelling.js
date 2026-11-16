/* ==========================================================================
   Apple Scrollytelling Engine — Lenis + GSAP ScrollTrigger + Liquid Glass Pill
   Gracefully degrades when offline (no CDN) or prefers-reduced-motion: reduce.
   ========================================================================== */

(function () {
  let lenisInstance = null;
  let activeGsapCtx = null;
  let activeScrollListener = null;
  let activeResizeListener = null;
  let cleanupCallbacks = [];
  let activeBeats = [];
  let activeSections = [];
  let activeChapter = null;

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isFallbackSnapMode() {
    return prefersReducedMotion() || (window.innerHeight || 800) <= 530;
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  }

  function getStickyOffsetPx() {
    try {
      const cs = getComputedStyle(document.documentElement);
      const hh = parseFloat(cs.getPropertyValue("--header-h")) || 58;
      const sh = parseFloat(cs.getPropertyValue("--subnav-h")) || 0;
      return hh + sh + 8;
    } catch (_e) {
      return 115;
    }
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
    const off = -getStickyOffsetPx();
    if (lenisInstance && typeof lenisInstance.scrollTo === "function" && !prefersReducedMotion()) {
      lenisInstance.scrollTo(el, { offset: off, duration: 0.8 });
    } else if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  }

  function teardown() {
    if (activeScrollListener) {
      window.removeEventListener("scroll", activeScrollListener);
      activeScrollListener = null;
    }
    if (activeResizeListener) {
      window.removeEventListener("resize", activeResizeListener);
      activeResizeListener = null;
    }
    while (cleanupCallbacks.length) {
      const fn = cleanupCallbacks.pop();
      try {
        fn();
      } catch (_e) {}
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
      pill.classList.remove("is-stage-tucked");
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

    // 1. Mount Single-Viewport Sticky Runway SVG Stage
    const runwayEl = root.querySelector(`#pinned-stage-ch${ch.chapter}`);
    const stickyEl = runwayEl ? runwayEl.querySelector("[data-theater-sticky]") : null;
    const svgHost = runwayEl ? runwayEl.querySelector(`#stage-svg-host-${ch.chapter}`) : null;
    const stepLabel = runwayEl ? runwayEl.querySelector(`#stage-beat-lbl-${ch.chapter}`) : null;
    const segFills = runwayEl ? Array.from(runwayEl.querySelectorAll("[data-stage-seg]")) : [];
    const visualFrame = runwayEl ? runwayEl.querySelector(".theater-visual-frame") : null;
    const specDeck = runwayEl ? runwayEl.querySelector(".theater-spec-deck") : null;

    let svgCtrl = { updateBeat() {} };
    if (svgHost && window.DiagramEngine && typeof window.DiagramEngine.renderPinnedStageGraphic === "function") {
      svgCtrl = window.DiagramEngine.renderPinnedStageGraphic(svgHost, ch, 0);
    }

    activeBeats = runwayEl ? Array.from(runwayEl.querySelectorAll("[data-story-beat]")) : [];
    const svgHotspots = runwayEl ? Array.from(runwayEl.querySelectorAll("[data-stage-region]")) : [];
    let currentBeatIdx = 0;

    function syncFallbackClass() {
      if (!runwayEl || !runwayEl.classList) return false;
      const snapMode = isFallbackSnapMode();
      runwayEl.classList.toggle("is-snap-fallback", snapMode);
      return snapMode;
    }
    syncFallbackClass();

    function activateBeat(beatIdx, rawProgress, explicitLocalT) {
      const n = Math.max(1, activeBeats.length);
      const clampedIdx = Math.max(0, Math.min(n - 1, beatIdx));
      currentBeatIdx = clampedIdx;
      const p = clamp01(rawProgress ?? clampedIdx / Math.max(1, n - 1));
      const localT =
        typeof explicitLocalT === "number"
          ? clamp01(explicitLocalT)
          : prefersReducedMotion()
          ? 1
          : clamp01(p * n - clampedIdx);

      activeBeats.forEach((b, i) => {
        const act = i === clampedIdx;
        b.classList.toggle("is-active", act);
        b.setAttribute("aria-hidden", act ? "false" : "true");
      });

      svgHotspots.forEach((el) => {
        const regIdx = parseInt(el.dataset.stageRegion, 10);
        if (!Number.isNaN(regIdx)) {
          el.setAttribute("aria-pressed", regIdx === clampedIdx ? "true" : "false");
        }
      });

      if (stepLabel) {
        stepLabel.textContent = `0${clampedIdx + 1} / 0${n || 4}`;
      }

      segFills.forEach((fill, i) => {
        const scale = i < clampedIdx ? 1 : i === clampedIdx ? Math.max(0.14, localT) : 0;
        fill.style.transform = `scaleX(${scale.toFixed(3)})`;
      });

      if (svgCtrl && typeof svgCtrl.updateBeat === "function") {
        svgCtrl.updateBeat(clampedIdx, p, localT);
      }
    }

    function scrollToRunwayBeat(targetIdx) {
      const n = Math.max(1, activeBeats.length);
      const idx = Math.max(0, Math.min(n - 1, targetIdx));
      const targetFrac = (idx + 0.35) / n;

      if (isFallbackSnapMode() && specDeck) {
        const targetCard = activeBeats[idx];
        if (targetCard && typeof specDeck.scrollTo === "function") {
          const left = Math.max(0, targetCard.offsetLeft - 8);
          try {
            specDeck.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
          } catch (_e) {
            specDeck.scrollLeft = left;
          }
        }
        activateBeat(idx, idx / Math.max(1, n - 1), 1);
        return;
      }

      activateBeat(idx, targetFrac, 0.85);
      if (runwayEl && stickyEl && typeof runwayEl.getBoundingClientRect === "function") {
        const rect = runwayEl.getBoundingClientRect();
        const stickyTopPx = getStickyOffsetPx();
        const scrollable = Math.max(1, (runwayEl.offsetHeight || 0) - (stickyEl.offsetHeight || 0));
        if (scrollable > 20) {
          const runwayDocTop = (window.scrollY || window.pageYOffset || 0) + rect.top;
          const targetY = Math.max(0, runwayDocTop - stickyTopPx + targetFrac * scrollable);
          if (lenisInstance && typeof lenisInstance.scrollTo === "function" && !prefersReducedMotion()) {
            lenisInstance.scrollTo(targetY, { duration: 0.55 });
          } else if (typeof window.scrollTo === "function") {
            window.scrollTo({ top: targetY, behavior: "smooth" });
          }
        }
      }
    }

    // Wire direct SVG hotspot taps/clicks & keyboard activation (no jump away from stage)
    svgHotspots.forEach((hs) => {
      const regIdx = parseInt(hs.dataset.stageRegion, 10);
      if (Number.isNaN(regIdx)) return;
      const onTrigger = (e) => {
        if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        scrollToRunwayBeat(regIdx);
      };
      hs.addEventListener("click", onTrigger);
      const onKey = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTrigger(e);
        }
      };
      hs.addEventListener("keydown", onKey);
      cleanupCallbacks.push(() => {
        hs.removeEventListener("click", onTrigger);
        hs.removeEventListener("keydown", onKey);
      });
    });

    // Horizontal swipe directly on diagram or sticky stage advances/rewinds beat inside the same screen
    const swipeTargets = [visualFrame, specDeck].filter(Boolean);
    swipeTargets.forEach((el) => {
      let startX = 0;
      let startY = 0;
      const onTouchStart = (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };
      const onTouchEnd = (e) => {
        if (isFallbackSnapMode() && el === specDeck) return;
        if (!e.changedTouches || !e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          const nextIdx = dx < 0 ? currentBeatIdx + 1 : currentBeatIdx - 1;
          if (nextIdx >= 0 && nextIdx < activeBeats.length) {
            scrollToRunwayBeat(nextIdx);
          }
        }
      };
      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("touchend", onTouchEnd, { passive: true });
      cleanupCallbacks.push(() => {
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("touchend", onTouchEnd);
      });
    });

    // Fallback horizontal snap scroll sync (reduced motion / short landscape heights)
    if (specDeck) {
      const onSnapScroll = () => {
        if (!isFallbackSnapMode() || activeBeats.length <= 1) return;
        const deckCenter = specDeck.scrollLeft + specDeck.clientWidth / 2;
        let closest = 0;
        let bestDist = Infinity;
        activeBeats.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const dist = Math.abs(cardCenter - deckCenter);
          if (dist < bestDist) {
            bestDist = dist;
            closest = i;
          }
        });
        activateBeat(closest, closest / Math.max(1, activeBeats.length - 1), 1);
      };
      specDeck.addEventListener("scroll", onSnapScroll, { passive: true });
      cleanupCallbacks.push(() => specDeck.removeEventListener("scroll", onSnapScroll));
    }

    if (activeBeats.length) activateBeat(0, 0, isFallbackSnapMode() ? 1 : 0.25);

    // 2. Mount Floating Liquid Glass Section Pill
    renderFloatingSectionPill(ch);
    activeSections = Array.from(root.querySelectorAll("article.sec-article[id]"));

    // 3. GSAP Masked Line Reveals on Showcase Hero (when CDN loaded & motion allowed)
    if (!prefersReducedMotion() && typeof window.gsap !== "undefined") {
      const gsap = window.gsap;
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
      if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
        window.ScrollTrigger.refresh();
      }
    }

    // 4. Single Source of Truth Scroll Tracker (Runway Sync + Bottom Pill Auto-Tuck)
    function updateOnScroll() {
      const viewH = window.innerHeight || 800;
      const viewMid = viewH * 0.42;
      const snapMode = syncFallbackClass();

      // Synchronize Zone 2 runway diagram & active single spec caption cleanly
      let inPinnedViewport = false;
      if (runwayEl && stickyEl && activeBeats.length > 1 && typeof runwayEl.getBoundingClientRect === "function") {
        const rect = runwayEl.getBoundingClientRect();
        const stickyTopPx = getStickyOffsetPx();
        inPinnedViewport = !snapMode && rect.top < viewH - 96 && rect.bottom > 180;

        if (!snapMode) {
          const scrollable = Math.max(1, (runwayEl.offsetHeight || 0) - (stickyEl.offsetHeight || 0));
          const rawP = clamp01((stickyTopPx - rect.top) / scrollable);
          const n = activeBeats.length;
          const idx = Math.min(n - 1, Math.floor(rawP * n));
          const localT = idx === n - 1 && rawP >= 0.99 ? 1 : clamp01(rawP * n - idx);
          activateBeat(idx, rawP, localT);
        }
      }

      // Update floating section pill dot + internal scaleX bar, and tuck while stage occupies viewport
      const pill = document.getElementById("apple-section-pill");
      if (pill && !pill.hidden) {
        pill.classList.toggle("is-stage-tucked", Boolean(inPinnedViewport));
        if (activeSections.length) {
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
      }
    }

    activeScrollListener = updateOnScroll;
    activeResizeListener = updateOnScroll;
    window.addEventListener("scroll", activeScrollListener, { passive: true });
    window.addEventListener("resize", activeResizeListener, { passive: true });
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
