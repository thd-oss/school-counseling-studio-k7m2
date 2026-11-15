/* ==========================================================================
   Gemini .txt / .md / .json Study Pack Parser & Prompt Generator (Vol 1)
   Supports UMD export for both Browser (window.GeminiParser) and Node test runs.
   ========================================================================== */

(function () {
  const CIRCLES = ["①", "②", "③", "④", "⑤"];

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toHtmlParas(str) {
    return String(str || "")
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `<p>${escapeHtml(s).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  function parseChapterNum(val) {
    const m = String(val || "").match(/\d+/);
    if (!m) return 1;
    const n = parseInt(m[0], 10);
    return n >= 1 && n <= 6 ? n : 1;
  }

  function parseAnswerIndex(val) {
    const s = String(val || "").trim();
    for (let i = 0; i < CIRCLES.length; i++) {
      if (s.includes(CIRCLES[i])) return i + 1;
    }
    const m = s.match(/[1-5]/);
    return m ? parseInt(m[0], 10) : 0;
  }

  function parseMcqBlock(lines, idx, setChapter) {
    const obj = {
      chapter: setChapter || 1,
      sectionRef: "",
      difficulty: "실전 변형",
      contextBox: "",
      stem: "",
      options: [],
      answer: 0,
      explanation: "",
      sources: "",
      keyArea: "",
    };

    let currentKey = null;
    const bufferMap = {};

    function flushKey() {
      if (!currentKey) return;
      const joined = (bufferMap[currentKey] || []).join("\n").trim();
      if (currentKey === "장") obj.chapter = parseChapterNum(joined);
      else if (currentKey === "연계절") obj.sectionRef = joined;
      else if (currentKey === "난이도") obj.difficulty = joined;
      else if (currentKey === "지문" || currentKey === "사례" || currentKey === "맥락") obj.contextBox = joined;
      else if (currentKey === "발문" || currentKey === "문제") obj.stem = joined;
      else if (currentKey === "정답") obj.answer = parseAnswerIndex(joined);
      else if (currentKey === "해설") obj.explanation = joined;
      else if (currentKey === "출처" || currentKey === "근거") obj.sources = joined;
      else if (currentKey === "핵심영역" || currentKey === "영역") obj.keyArea = joined;
    }

    const optLines = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (currentKey && (currentKey === "발문" || currentKey === "문제" || currentKey === "지문" || currentKey === "해설")) {
          bufferMap[currentKey].push("");
        }
        continue;
      }

      const optMatch = line.match(/^(?:([①②③④⑤])|([1-5])[).])\s+(.+)$/);
      if (optMatch && currentKey !== "해설" && currentKey !== "근거") {
        flushKey();
        currentKey = null;
        const optNum = optMatch[1] ? CIRCLES.indexOf(optMatch[1]) + 1 : parseInt(optMatch[2], 10);
        optLines.push({ num: optNum, text: optMatch[3].trim() });
        continue;
      }

      const keyMatch = line.match(/^(장|연계절|난이도|지문|사례|맥락|발문|문제|정답|해설|출처|근거|핵심영역|영역)\s*[:：]\s*(.*)$/);
      if (keyMatch) {
        flushKey();
        currentKey = keyMatch[1];
        bufferMap[currentKey] = keyMatch[2] ? [keyMatch[2].trim()] : [];
        continue;
      }

      if (currentKey) {
        bufferMap[currentKey].push(line);
      } else if (!obj.stem) {
        obj.stem = line;
      }
    }
    flushKey();

    optLines.sort((a, b) => a.num - b.num);
    obj.options = optLines.map((o) => o.text);

    const issues = [];
    if (!obj.stem) issues.push(`MCQ #${idx + 1}: 발문(문제)이 비어 있습니다.`);
    if (obj.options.length !== 5) issues.push(`MCQ #${idx + 1}: 선택지가 ${obj.options.length}개입니다 (5지선다 권장).`);
    if (obj.answer < 1 || obj.answer > Math.max(5, obj.options.length)) {
      issues.push(`MCQ #${idx + 1}: 정답 번호(1~5 또는 ①~⑤)를 확인할 수 없습니다.`);
    }

    return {
      ok: issues.length === 0,
      issues,
      item: {
        id: `custom-mcq-${idx + 1}`,
        chapter: obj.chapter,
        num: idx + 1,
        sectionRef: obj.sectionRef || `${obj.chapter}.1`,
        difficulty: obj.difficulty,
        stem: obj.stem,
        stemHtml: escapeHtml(obj.stem),
        contextBox: obj.contextBox,
        contextBoxHtml: obj.contextBox ? toHtmlParas(obj.contextBox) : "",
        options: obj.options,
        answer: obj.answer || 1,
        keyArea: obj.keyArea || `제${String(obj.chapter).padStart(2, "0")}장 연계`,
        sources: obj.sources || "Gemini 생성 실전 변형 문항",
        explanation: obj.explanation || "제공된 해설이 없습니다.",
        explanationHtml: toHtmlParas(obj.explanation || "제공된 해설이 없습니다."),
      },
    };
  }

  function parseRubricLines(raw) {
    const rows = [];
    const lines = String(raw || "")
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    for (const line of lines) {
      if (line.includes("|")) {
        const parts = line.split("|").map((p) => p.trim());
        const area = parts[0] || "평가 영역";
        const weight = parts[1] || "25점";
        const ptsMatch = weight.match(/\d+/);
        rows.push({
          area,
          weight,
          points: ptsMatch ? parseInt(ptsMatch[0], 10) : 25,
          criteria: parts.slice(2).join(" · ") || area,
          deduction: "",
        });
      } else {
        const ptsMatch = line.match(/(\d+)\s*[점%]/);
        rows.push({
          area: line.slice(0, 22),
          weight: ptsMatch ? ptsMatch[0] : "기준",
          points: ptsMatch ? parseInt(ptsMatch[1], 10) : 25,
          criteria: line,
          deduction: "",
        });
      }
    }
    if (!rows.length) {
      rows.push(
        { area: "핵심 사례/원인 진단", weight: "30%", points: 30, criteria: "사례의 핵심 심리·법적·발달적 쟁점을 정확히 진단함", deduction: "" },
        { area: "이론 및 법·윤리 근거", weight: "35%", points: 35, criteria: "적절한 학자·이론·법조항 근거를 논리적으로 연결함", deduction: "" },
        { area: "현장 개입 전략 설계", weight: "35%", points: 35, criteria: "학교 현장에 즉시 실행 가능한 구체적 개입 절차를 제시함", deduction: "" }
      );
    }
    return rows;
  }

  function parseEssayBlock(lines, idx, setChapter) {
    const obj = {
      chapter: setChapter || 1,
      sectionRef: "",
      title: "",
      situation: "",
      prompt: "",
      rubricRaw: "",
      keywords: [],
      modelAnswer: "",
    };

    let currentKey = null;
    const bufferMap = {};

    function flushKey() {
      if (!currentKey) return;
      const joined = (bufferMap[currentKey] || []).join("\n").trim();
      if (currentKey === "장") obj.chapter = parseChapterNum(joined);
      else if (currentKey === "연계절") obj.sectionRef = joined;
      else if (currentKey === "제목" || currentKey === "주제") obj.title = joined;
      else if (currentKey === "상황" || currentKey === "사례" || currentKey === "지문") obj.situation = joined;
      else if (currentKey === "발문" || currentKey === "문제" || currentKey === "논제") obj.prompt = joined;
      else if (currentKey === "채점기준" || currentKey === "루브릭") {
        obj.rubricRaw = obj.rubricRaw ? `${obj.rubricRaw}\n${joined}` : joined;
      }
      else if (currentKey === "핵심키워드" || currentKey === "키워드") {
        obj.keywords = joined
          .split(/[,，、;]+/)
          .map((k) => k.trim())
          .filter(Boolean);
      } else if (currentKey === "모범답안" || currentKey === "해설") obj.modelAnswer = joined;
    }

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (currentKey) bufferMap[currentKey].push("");
        continue;
      }
      const keyMatch = line.match(/^(장|연계절|제목|주제|상황|사례|지문|발문|문제|논제|채점기준|루브릭|핵심키워드|키워드|모범답안|해설)\s*[:：]\s*(.*)$/);
      if (keyMatch) {
        flushKey();
        currentKey = keyMatch[1];
        bufferMap[currentKey] = keyMatch[2] ? [keyMatch[2].trim()] : [];
        continue;
      }
      if (currentKey) {
        bufferMap[currentKey].push(line);
      }
    }
    flushKey();

    const issues = [];
    if (!obj.situation && !obj.prompt) {
      issues.push(`ESSAY #${idx + 1}: 상황(사례) 또는 발문이 비어 있습니다.`);
    }
    if (!obj.prompt) obj.prompt = "위 사례에 대하여 관련 이론·법·윤리 근거를 밝히고 학교상담 개입 전략을 논술하시오.";
    if (!obj.situation) obj.situation = obj.prompt;

    const rubric = parseRubricLines(obj.rubricRaw);
    return {
      ok: issues.length === 0,
      issues,
      item: {
        id: `custom-essay-${idx + 1}`,
        chapter: obj.chapter,
        num: idx + 1,
        sectionRef: obj.sectionRef || `${obj.chapter}.1`,
        title: obj.title || `실상황 논술 문항 ${idx + 1}`,
        situation: obj.situation,
        situationHtml: toHtmlParas(obj.situation),
        prompt: obj.prompt,
        promptHtml: toHtmlParas(obj.prompt),
        rubric,
        keywords: obj.keywords.length ? obj.keywords : ["학교상담", "사례개념화", "윤리적 의사결정", "개입 전략"],
        modelAnswer: obj.modelAnswer || "모범답안이 입력되지 않았습니다.",
        modelAnswerHtml: toHtmlParas(obj.modelAnswer || "모범답안이 입력되지 않았습니다."),
      },
    };
  }

  function parseGeminiStudyPack(rawText, fileName) {
    const text = String(rawText || "").replace(/\r\n/g, "\n").trim();
    if (!text) {
      return { ok: false, pack: null, stats: { mcqs: 0, essays: 0 }, warnings: [], errors: ["입력된 텍스트가 비어 있습니다."] };
    }

    // 1. JSON support (avoid colliding with [SET] / [MCQ] / [ESSAY] headers)
    if (!/^\[(SET|MCQ|ESSAY)\]/i.test(text) && (text.startsWith("{") || text.startsWith("["))) {
      try {
        const parsed = JSON.parse(text);
        const mcqs = Array.isArray(parsed) ? parsed.filter((x) => x.options) : (parsed.mcqs || []);
        const essays = Array.isArray(parsed) ? parsed.filter((x) => !x.options) : (parsed.essays || []);
        const packId = `pack-${Date.now()}`;
        return {
          ok: mcqs.length + essays.length > 0,
          pack: {
            id: packId,
            name: (parsed && parsed.name) || (fileName ? fileName.replace(/\.(json|txt|md)$/i, "") : "불러온 JSON 문제팩"),
            source: fileName || "JSON 업로드",
            createdAt: new Date().toISOString(),
            isDefault: false,
            mcqs: mcqs.map((m, i) => Object.assign({ id: `${packId}-q${i + 1}`, chapter: 1, num: i + 1 }, m)),
            shortAnswers: [],
            essays: essays.map((e, i) => Object.assign({ id: `${packId}-e${i + 1}`, chapter: 1, num: i + 1 }, e)),
          },
          stats: { mcqs: mcqs.length, essays: essays.length },
          warnings: [],
          errors: mcqs.length + essays.length === 0 ? ["JSON 안에 mcqs 또는 essays 항목이 없습니다."] : [],
        };
      } catch (e) {
        return { ok: false, pack: null, stats: { mcqs: 0, essays: 0 }, warnings: [], errors: [`JSON 파싱 오류: ${e.message}`] };
      }
    }

    // 2. [SET] / [MCQ] / [ESSAY] structured text format
    const lines = text.split("\n");
    const blocks = [];
    let curBlock = { type: "PREAMBLE", lines: [] };

    for (const rawLine of lines) {
      const cleanLine = rawLine.replace(/^#+\s*/, "").trim();
      const tagMatch = cleanLine.match(/^\[(SET|MCQ|ESSAY)\]\s*(.*)$/i);
      if (tagMatch) {
        if (curBlock.lines.length || curBlock.type !== "PREAMBLE") {
          blocks.push(curBlock);
        }
        curBlock = {
          type: tagMatch[1].toUpperCase(),
          lines: tagMatch[2] ? [tagMatch[2]] : [],
        };
      } else {
        curBlock.lines.push(rawLine);
      }
    }
    if (curBlock.lines.length || curBlock.type !== "PREAMBLE") {
      blocks.push(curBlock);
    }

    let setTitle = fileName ? fileName.replace(/\.(txt|md)$/i, "") : `Gemini 맞춤 문제팩 (${new Date().toLocaleDateString("ko-KR")})`;
    let setChapter = 1;

    const mcqs = [];
    const essays = [];
    const warnings = [];
    const errors = [];

    for (const blk of blocks) {
      if (blk.type === "SET") {
        for (const l of blk.lines) {
          const t = l.trim();
          const mTitle = t.match(/^(?:제목|세트명|이름)\s*[:：]\s*(.+)$/);
          if (mTitle) setTitle = mTitle[1].trim();
          const mCh = t.match(/^(?:대상장|장)\s*[:：]\s*(.+)$/);
          if (mCh) setChapter = parseChapterNum(mCh[1]);
        }
      } else if (blk.type === "MCQ") {
        const res = parseMcqBlock(blk.lines, mcqs.length, setChapter);
        if (res.issues.length) warnings.push(...res.issues);
        if (res.item.stem && res.item.options.length >= 2) {
          mcqs.push(res.item);
        } else {
          errors.push(`MCQ 블록 무시됨: ${res.issues.join(" ")}`);
        }
      } else if (blk.type === "ESSAY") {
        const res = parseEssayBlock(blk.lines, essays.length, setChapter);
        if (res.issues.length) warnings.push(...res.issues);
        if (res.item.situation || res.item.prompt) {
          essays.push(res.item);
        } else {
          errors.push(`ESSAY 블록 무시됨: ${res.issues.join(" ")}`);
        }
      }
    }

    if (mcqs.length === 0 && essays.length === 0) {
      errors.push("인식된 [MCQ] 또는 [ESSAY] 블록이 없습니다. [MCQ] / [ESSAY] 헤더 양식을 확인해 주세요.");
    }

    const packId = `pack-gemini-${Date.now()}`;
    mcqs.forEach((m, i) => {
      m.id = `${packId}-q${i + 1}`;
    });
    essays.forEach((e, i) => {
      e.id = `${packId}-e${i + 1}`;
    });

    return {
      ok: mcqs.length + essays.length > 0,
      pack: mcqs.length + essays.length > 0 ? {
        id: packId,
        name: setTitle,
        source: fileName || "직접 붙여넣기 (.txt)",
        createdAt: new Date().toISOString(),
        isDefault: false,
        mcqs,
        shortAnswers: [],
        essays,
      } : null,
      stats: { mcqs: mcqs.length, essays: essays.length },
      warnings,
      errors,
    };
  }

  function buildGeminiPromptTemplate(opts) {
    const chaptersData = (typeof window !== "undefined" && window.__VOL1_DATA__ && window.__VOL1_DATA__.chapters) || [];
    const selectedChapters = (opts && opts.chapters && opts.chapters.length) ? opts.chapters : [1, 2, 3, 4, 5, 6];
    const mcqCount = (opts && opts.mcqCount) || 6;
    const essayCount = (opts && opts.essayCount) || 2;
    const difficulty = (opts && opts.difficulty) || "임용고시·대학원 심화 (실상황 사례 대입형)";
    const focusNotes = (opts && opts.focusNotes) ? `\n[추가 강조 요청]\n${opts.focusNotes}` : "";

    const syllabusLines = selectedChapters
      .map((chNo) => {
        const ch = chaptersData.find((c) => c.chapter === chNo);
        if (!ch) return `- 제0${chNo}장`;
        const secList = ch.coreSections.map((s) => `${s.secNo} ${s.title}`).join(", ");
        return `- ${ch.fullTitle}: ${secList}`;
      })
      .join("\n");

    return `당신은 한국의 「학교상담과 생활지도」 전공 교수이자 전문상담교사 임용 및 대학원 시험 출제위원입니다.
아래 교재 범위와 출력 양식 규격에 맞추어 객관식 ${mcqCount}문항과 실상황 대입 논술형 ${essayCount}문항을 출제해 주세요.
모든 문항은 반드시 학교상담 현장 사례(초·중·고 위(Wee) 클래스 맥락)와 원전 학자/법령 근거를 반영해야 합니다.

[출제 대상 범위 — 상권]
${syllabusLines}

[난이도 및 출제 지침]
- 목표 수준: ${difficulty}
- 객관식: 모든 문항은 반드시 ①~⑤ 5지선다로 구성하고, 매력적인 오답 선지 분석을 해설에 포함하세요.
- 논술형: 학생·학급의 구체적 상황(사례)을 먼저 제시하고, 이론/법·윤리 근거와 실행 절차를 요구하세요.${focusNotes}

[필수 출력 형식 — 아래 태그([SET], [MCQ], [ESSAY])와 필드명을 한 글자도 바꾸지 말고 순수 텍스트(.txt)로만 작성하세요]

[SET]
제목: 상권 실전 모의훈련 세트 (${selectedChapters.map((c) => c + "장").join("·")})
대상장: ${selectedChapters[0]}

[MCQ]
장: ${selectedChapters[0]}
연계절: ${selectedChapters[0]}.1
난이도: ${difficulty}
지문: (필요시 짧은 상담 장면이나 대화 축어록을 여기에 2~3줄 적고, 불필요하면 이 줄을 생략해도 됩니다)
발문: 다음 학교상담 상황 중 가장 타당한 설명은?
① 첫 번째 선택지 내용
② 두 번째 선택지 내용
③ 세 번째 선택지 내용
④ 네 번째 선택지 내용
⑤ 다섯 번째 선택지 내용
정답: 3
핵심영역: 출제 핵심 개념명
출처: 관련 학자(연도) 또는 한국 법령·ASCA 강령
해설: 정답이 3번인 이론적·법적 근거와 나머지 오답(①, ②, ④, ⑤)이 틀린 이유를 구체적으로 설명하세요.

[ESSAY]
장: ${selectedChapters[0]}
연계절: ${selectedChapters[0]}.2
제목: 사례 제목 (예: 비자발적 의뢰 학생과 비밀보장 딜레마)
상황: 초/중/고 위(Wee) 클래스에 의뢰된 학생의 구체적 배경, 문제행동, 교사·보호자의 갈등 상황을 4~6문장으로 서술하세요.
발문: 1) 관련 발달·상담이론 또는 법·윤리 기준에 근거하여 위 사례의 핵심 문제를 진단하고, 2) 전문상담교사가 취해야 할 구체적 개입 절차를 논술하시오.
채점기준: 사례 진단 정확성 | 30점 | 핵심 문제와 기저 역동을 정확히 규명함
채점기준: 이론·법령 근거 적실성 | 35점 | 관련 학자 및 한국 실정법·윤리강령을 정확히 인용함
채점기준: 현장 개입 절차의 구체성 | 35점 | 단계별 실행 절차 및 주의사항을 구체적으로 제시함
핵심키워드: 키워드1, 키워드2, 키워드3, 키워드4, 키워드5
모범답안: 1) 사례 진단: ...
2) 이론·법적 근거: ...
3) 구체적 개입 방안: ...

위 [MCQ] 형식 ${mcqCount}개와 [ESSAY] 형식 ${essayCount}개를 순서대로 모두 출력하세요.`;
  }

  const api = {
    parseGeminiStudyPack,
    buildGeminiPromptTemplate,
  };

  if (typeof window !== "undefined") window.GeminiParser = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
