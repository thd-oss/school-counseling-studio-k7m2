/* ==========================================================================
   Auto-save Store (localStorage + IndexedDB mirror + JSON Backup)
   ========================================================================== */

(function () {
  const STORAGE_KEY = "school_counseling_vol1_state_v1";
  const DB_NAME = "SchoolCounselingStudyDB";
  const STORE_NAME = "kv";

  function defaultState() {
    return {
      version: 1,
      theme: "light",
      lastPosition: {
        view: "dashboard",
        chapter: 1,
        mode: "learn",
        sectionId: "sec-1-1",
        scrollY: 0,
        updatedAt: new Date().toISOString(),
      },
      readSections: {},
      activePackId: "pack-default-vol1",
      customPacks: [],
      mcqProgress: {},
      shortAnswerChecked: {},
      essayProgress: {},
    };
  }

  function loadInitialState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed || {});
    } catch (e) {
      return defaultState();
    }
  }

  function openIdb() {
    return new Promise((resolve) => {
      if (!("indexedDB" in window)) return resolve(null);
      try {
        const req = window.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function mirrorToIdb(stateObj) {
    const db = await openIdb();
    if (!db) return;
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(stateObj, STORAGE_KEY);
    } catch (e) {
      /* Ignore IDB restriction under strict file:// policies */
    }
  }

  let state = loadInitialState();
  const listeners = new Set();

  function formatNowTime() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function persist(silent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* Storage full or blocked */
    }
    mirrorToIdb(state);
    if (!silent) {
      const timeStr = formatNowTime();
      listeners.forEach((fn) => fn(state, timeStr));
    }
  }

  function ensurePackMcq(packId) {
    if (!state.mcqProgress[packId]) {
      state.mcqProgress[packId] = {
        round: 1,
        answers: {},
        bookmarks: {},
        roundHistory: [],
      };
    }
    return state.mcqProgress[packId];
  }

  function ensurePackEssay(packId, essayId) {
    if (!state.essayProgress[packId]) state.essayProgress[packId] = {};
    if (!state.essayProgress[packId][essayId]) {
      state.essayProgress[packId][essayId] = {
        mode: "scaffold",
        scaffold: { diagnosis: "", theory: "", intervention: "" },
        unifiedText: "",
        rubricChecks: {},
        selfScore: 0,
        submittedAt: null,
        updatedAt: null,
      };
    }
    return state.essayProgress[packId][essayId];
  }

  window.StudyStore = {
    getState() {
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async hydrateFromIdbIfEmpty() {
      if (Object.keys(state.readSections).length > 0 || state.customPacks.length > 0) return false;
      const db = await openIdb();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const req = tx.objectStore(STORE_NAME).get(STORAGE_KEY);
          req.onsuccess = () => {
            if (req.result && typeof req.result === "object") {
              state = Object.assign(defaultState(), req.result);
              persist(true);
              resolve(true);
            } else {
              resolve(false);
            }
          };
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    },
    setTheme(theme) {
      state.theme = theme === "dark" ? "dark" : "light";
      persist();
    },
    setLastPosition(patch) {
      state.lastPosition = Object.assign({}, state.lastPosition, patch, {
        updatedAt: new Date().toISOString(),
      });
      persist(true);
    },
    toggleSectionRead(secId, forceVal) {
      const next = typeof forceVal === "boolean" ? forceVal : !state.readSections[secId];
      if (next) {
        state.readSections[secId] = new Date().toISOString();
      } else {
        delete state.readSections[secId];
      }
      persist();
      return next;
    },
    getPackMcqState(packId) {
      return ensurePackMcq(packId);
    },
    recordMcqAnswer(packId, qId, selectedOpt, correctOpt) {
      const rec = ensurePackMcq(packId);
      rec.answers[qId] = {
        selected: selectedOpt,
        correct: selectedOpt === correctOpt,
        checkedAt: new Date().toISOString(),
      };
      persist();
    },
    toggleBookmark(packId, qId) {
      const rec = ensurePackMcq(packId);
      if (rec.bookmarks[qId]) delete rec.bookmarks[qId];
      else rec.bookmarks[qId] = true;
      persist();
    },
    startNewMcqRound(packId, totalQuestionsInPack, onlyWrong) {
      const rec = ensurePackMcq(packId);
      const answeredEntries = Object.entries(rec.answers);
      const correctCount = answeredEntries.filter(([, v]) => v.correct).length;
      const wrongIds = answeredEntries.filter(([, v]) => !v.correct).map(([id]) => id);
      if (answeredEntries.length > 0) {
        rec.roundHistory.unshift({
          round: rec.round,
          score: correctCount,
          attempted: answeredEntries.length,
          total: totalQuestionsInPack,
          completedAt: new Date().toISOString(),
          wrongIds,
        });
      }
      rec.round += 1;
      if (onlyWrong) {
        const nextAnswers = {};
        answeredEntries.forEach(([id, v]) => {
          if (v.correct) nextAnswers[id] = v;
        });
        rec.answers = nextAnswers;
      } else {
        rec.answers = {};
      }
      persist();
    },
    toggleShortAnswer(saId) {
      if (state.shortAnswerChecked[saId]) delete state.shortAnswerChecked[saId];
      else state.shortAnswerChecked[saId] = true;
      persist();
    },
    getEssayDraft(packId, essayId) {
      return ensurePackEssay(packId, essayId);
    },
    updateEssayDraft(packId, essayId, patch) {
      const draft = ensurePackEssay(packId, essayId);
      Object.assign(draft, patch, { updatedAt: new Date().toISOString() });
      persist();
      return draft;
    },
    setActivePack(packId) {
      state.activePackId = packId;
      persist();
    },
    addCustomPack(packObj) {
      state.customPacks = state.customPacks.filter((p) => p.id !== packObj.id);
      state.customPacks.unshift(packObj);
      state.activePackId = packObj.id;
      persist();
    },
    deleteCustomPack(packId) {
      state.customPacks = state.customPacks.filter((p) => p.id !== packId);
      if (state.activePackId === packId) {
        state.activePackId = "pack-default-vol1";
      }
      persist();
    },
    exportBackupJson() {
      return JSON.stringify(state, null, 2);
    },
    importBackupJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || !parsed.readSections) {
        throw new Error("올바른 학습 백업 JSON 파일이 아닙니다.");
      }
      state = Object.assign(defaultState(), parsed);
      persist();
      return state;
    },
    resetAllProgress() {
      const packs = state.customPacks;
      const theme = state.theme;
      state = defaultState();
      state.customPacks = packs;
      state.theme = theme;
      persist();
    },
  };
})();
