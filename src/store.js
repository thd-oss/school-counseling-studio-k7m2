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
      volumeExamProgress: {},
      shortAnswerChecked: {},
      essayProgress: {},
    };
  }

  function loadInitialState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const merged = Object.assign(defaultState(), parsed || {});
      merged.volumeExamProgress = merged.volumeExamProgress || {};
      return merged;
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
        chapterRounds: {},
        answers: {},
        bookmarks: {},
        roundHistory: [],
      };
    }
    if (!state.mcqProgress[packId].chapterRounds) {
      state.mcqProgress[packId].chapterRounds = {};
    }
    return state.mcqProgress[packId];
  }

  function ensureVolumeExam(packId) {
    if (!state.volumeExamProgress) state.volumeExamProgress = {};
    if (!state.volumeExamProgress[packId]) {
      state.volumeExamProgress[packId] = {
        round: 1,
        orderMode: "chapter",
        shuffledIds: [],
        answers: {},
        shortAnswerChecked: {},
        essays: {},
        roundHistory: [],
      };
    }
    return state.volumeExamProgress[packId];
  }

  function defaultEssayDraftObj() {
    return {
      mode: "scaffold",
      scaffold: { diagnosis: "", theory: "", intervention: "" },
      unifiedText: "",
      rubricChecks: {},
      selfScore: 0,
      submittedAt: null,
      updatedAt: null,
    };
  }

  function ensurePackEssay(packId, essayId) {
    if (!state.essayProgress[packId]) state.essayProgress[packId] = {};
    if (!state.essayProgress[packId][essayId]) {
      state.essayProgress[packId][essayId] = defaultEssayDraftObj();
    }
    return state.essayProgress[packId][essayId];
  }

  function ensureVolumeExamEssay(packId, essayId) {
    const exam = ensureVolumeExam(packId);
    if (!exam.essays) exam.essays = {};
    if (!exam.essays[essayId]) {
      exam.essays[essayId] = defaultEssayDraftObj();
    }
    return exam.essays[essayId];
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
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
      if (
        Object.keys(state.readSections).length > 0 ||
        state.customPacks.length > 0 ||
        Object.keys(state.volumeExamProgress || {}).length > 0
      ) {
        return false;
      }
      const db = await openIdb();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const req = tx.objectStore(STORE_NAME).get(STORAGE_KEY);
          req.onsuccess = () => {
            if (req.result && typeof req.result === "object") {
              state = Object.assign(defaultState(), req.result);
              state.volumeExamProgress = state.volumeExamProgress || {};
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
    getChapterMcqRound(packId, chapterNo) {
      const rec = ensurePackMcq(packId);
      return rec.chapterRounds[chapterNo] || 1;
    },
    resetChapterMcq(packId, chapterNo, chapterQuestionIds, onlyWrong) {
      const rec = ensurePackMcq(packId);
      const idSet = new Set(chapterQuestionIds || []);
      const curRound = rec.chapterRounds[chapterNo] || 1;
      const chEntries = Object.entries(rec.answers).filter(([id]) => idSet.has(id));
      const correctCount = chEntries.filter(([, v]) => v.correct).length;
      const wrongIds = chEntries.filter(([, v]) => !v.correct).map(([id]) => id);
      if (chEntries.length > 0) {
        rec.roundHistory.unshift({
          scope: "chapter",
          chapter: chapterNo,
          round: curRound,
          score: correctCount,
          attempted: chEntries.length,
          total: idSet.size,
          completedAt: new Date().toISOString(),
          wrongIds,
        });
      }
      rec.chapterRounds[chapterNo] = curRound + 1;
      idSet.forEach((id) => {
        const ans = rec.answers[id];
        if (!ans) return;
        if (!onlyWrong || !ans.correct) {
          delete rec.answers[id];
        }
      });
      persist();
    },
    getVolumeExamState(packId) {
      return ensureVolumeExam(packId);
    },
    setVolumeExamOrder(packId, orderMode, allQuestionIds, forceReshuffle) {
      const exam = ensureVolumeExam(packId);
      exam.orderMode = orderMode === "shuffle" ? "shuffle" : "chapter";
      const ids = allQuestionIds || [];
      if (exam.orderMode === "shuffle" && (forceReshuffle || (exam.shuffledIds || []).length !== ids.length)) {
        exam.shuffledIds = shuffleArray(ids);
      }
      persist();
      return exam;
    },
    recordVolumeExamMcq(packId, qId, selectedOpt, correctOpt) {
      const exam = ensureVolumeExam(packId);
      exam.answers[qId] = {
        selected: selectedOpt,
        correct: selectedOpt === correctOpt,
        checkedAt: new Date().toISOString(),
      };
      persist();
    },
    startNewVolumeExamRound(packId, allQuestionIds, onlyWrong) {
      const exam = ensureVolumeExam(packId);
      const ids = allQuestionIds || [];
      const answeredEntries = Object.entries(exam.answers);
      const correctCount = answeredEntries.filter(([, v]) => v.correct).length;
      const wrongIds = answeredEntries.filter(([, v]) => !v.correct).map(([id]) => id);
      if (answeredEntries.length > 0) {
        exam.roundHistory.unshift({
          scope: "volume",
          round: exam.round,
          score: correctCount,
          attempted: answeredEntries.length,
          total: ids.length,
          completedAt: new Date().toISOString(),
          wrongIds,
        });
      }
      exam.round += 1;
      if (onlyWrong) {
        const nextAnswers = {};
        answeredEntries.forEach(([id, v]) => {
          if (v.correct) nextAnswers[id] = v;
        });
        exam.answers = nextAnswers;
      } else {
        exam.answers = {};
      }
      if (exam.orderMode === "shuffle") {
        exam.shuffledIds = shuffleArray(ids);
      }
      persist();
    },
    toggleVolumeShortAnswer(packId, saId) {
      const exam = ensureVolumeExam(packId);
      if (!exam.shortAnswerChecked) exam.shortAnswerChecked = {};
      if (exam.shortAnswerChecked[saId]) delete exam.shortAnswerChecked[saId];
      else exam.shortAnswerChecked[saId] = true;
      persist();
    },
    getVolumeExamEssayDraft(packId, essayId) {
      return ensureVolumeExamEssay(packId, essayId);
    },
    updateVolumeExamEssayDraft(packId, essayId, patch) {
      const draft = ensureVolumeExamEssay(packId, essayId);
      Object.assign(draft, patch, { updatedAt: new Date().toISOString() });
      persist();
      return draft;
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
      state.volumeExamProgress = state.volumeExamProgress || {};
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
