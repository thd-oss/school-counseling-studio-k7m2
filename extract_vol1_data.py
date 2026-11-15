#!/usr/bin/env python3
"""
Extract structured Volume 1 (Chapters 01-06) content, tables, hyperlinks,
and review questions (MCQs, Short Answers, Essays with rubrics & model answers)
from 05_기존마스터원고/학교상담과 생활지도_상권_제01-06장_마스터원고.docx (read-only).
"""

import html
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOL1_DOCX = os.path.join(
    BASE_DIR, "05_기존마스터원고", "학교상담과 생활지도_상권_제01-06장_마스터원고.docx"
)
OUT_JSON = os.path.join(BASE_DIR, "study_web", "src", "data", "vol1_raw.json")

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
W = f"{{{W_NS}}}"
R = f"{{{R_NS}}}"

CIRCLE_MAP = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}
CIRCLES = ["①", "②", "③", "④", "⑤"]


def el_plain(el):
    return "".join(t.text or "" for t in el.iter(f"{W}t")).strip()


def run_to_html(r_el):
    text = "".join(t.text or "" for t in r_el.iter(f"{W}t"))
    if not text:
        return ""
    escaped = html.escape(text)
    rpr = r_el.find(f"{W}rPr")
    is_bold = False
    is_italic = False
    if rpr is not None:
        b = rpr.find(f"{W}b")
        if b is not None and b.attrib.get(f"{W}val", "1") not in ("0", "false"):
            is_bold = True
        i_el = rpr.find(f"{W}i")
        if i_el is not None and i_el.attrib.get(f"{W}val", "1") not in ("0", "false"):
            is_italic = True
    if is_bold and is_italic:
        return f"<strong><em>{escaped}</em></strong>"
    if is_bold:
        return f"<strong>{escaped}</strong>"
    if is_italic:
        return f"<em>{escaped}</em>"
    return escaped


def p_to_html_and_links(p_el, rel_map):
    parts = []
    links = []
    for child in p_el:
        tag = child.tag
        if tag == f"{W}r":
            parts.append(run_to_html(child))
        elif tag == f"{W}hyperlink":
            rid = child.attrib.get(f"{R}id", "")
            url = rel_map.get(rid, "")
            inner_html = "".join(run_to_html(r) for r in child.findall(f"{W}r"))
            inner_text = "".join(t.text or "" for t in child.iter(f"{W}t")).strip()
            if not inner_html:
                inner_html = html.escape(inner_text)
            if url:
                safe_url = html.escape(url, quote=True)
                parts.append(
                    f'<a class="ext-link" href="{safe_url}" target="_blank" rel="noopener noreferrer">{inner_html}</a>'
                )
                if inner_text and url:
                    links.append({"label": inner_text, "url": url})
            else:
                parts.append(inner_html)
        elif tag in (f"{W}ins", f"{W}smartTag"):
            for r in child.findall(f".//{W}r"):
                parts.append(run_to_html(r))
    raw_html = "".join(parts).strip()
    # Collapse redundant adjacent tags cleanly
    raw_html = raw_html.replace("</strong><strong>", "").replace("</em><em>", "")
    return raw_html, links


def tc_to_data(tc_el, rel_map):
    ps = tc_el.findall(f"{W}p")
    plain_parts = []
    html_parts = []
    all_links = []
    for p in ps:
        pt = el_plain(p)
        if pt:
            plain_parts.append(pt)
            ph, lnks = p_to_html_and_links(p, rel_map)
            html_parts.append(ph)
            all_links.extend(lnks)
    return {
        "plain": "\n".join(plain_parts).strip(),
        "html": "<br>".join(html_parts).strip(),
        "links": all_links,
    }


def tbl_to_data(tbl_el, rel_map, caption=""):
    rows = []
    links = []
    for tr in tbl_el.findall(f"{W}tr"):
        row_cells = []
        for tc in tr.findall(f"{W}tc"):
            cd = tc_to_data(tc, rel_map)
            row_cells.append({"plain": cd["plain"], "html": cd["html"]})
            links.extend(cd["links"])
        if any(c["plain"] for c in row_cells):
            rows.append(row_cells)
    headers = rows[0] if rows else []
    body_rows = rows[1:] if len(rows) > 1 else []
    return {
        "caption": caption,
        "headers": headers,
        "rows": body_rows,
        "links": links,
    }


def split_sentences_ko(text):
    """Split Korean academic prose into complete sentences without breaking citations/laws."""
    # Protect decimals, initials, et al., a/b years like 2025a.
    protected = text
    # Simple reliable split after sentence-ending 다./요./까./됨./함./임. followed by space or end
    chunks = re.split(r"(?<=[다요까]\.)\s+(?=[가-힣A-Za-z0-9「『(\[])", protected)
    return [c.strip() for c in chunks if len(c.strip()) > 15]


def auto_bullets_from_paragraphs(paras, max_bullets=4):
    candidates = []
    for p in paras:
        t = p["plain"]
        if not t or p.get("isCaption"):
            continue
        if re.match(r"^\[임상사례", t):
            continue
        for s in split_sentences_ko(t):
            score = 0
            if any(k in s for k in ["정의", "핵심", "원칙", "기준", "차별", "비교", "유의"]):
                score += 2
            if re.search(r"(N\s*=|d\s*=|β\s*=|%|「[^」]+」|제\d+조)", s):
                score += 3
            if 35 <= len(s) <= 220:
                score += 2
            candidates.append((score, len(candidates), s))
    if not candidates:
        return [p["plain"][:180] for p in paras[:max_bullets] if p["plain"]]
    # Keep narrative diversity across paragraphs by picking top scored sentences then sorting by original order
    picked = sorted(candidates, key=lambda x: (-x[0], x[1]))[:max_bullets]
    picked.sort(key=lambda x: x[1])
    out = []
    for _, _, s in picked:
        if len(s) > 210:
            s = s[:207].rstrip() + "..."
        out.append(s)
    return out


def split_inline_options(text):
    """Extract 5 options whether they are all in 1 paragraph or separate lines."""
    # Find positions of ① ② ③ ④ ⑤
    positions = []
    for idx, sym in enumerate(CIRCLES, 1):
        m = re.search(rf"(?:^|\s){re.escape(sym)}\s*", text)
        if not m:
            pos = text.find(sym)
            if pos == -1:
                return None
            positions.append((idx, pos, pos + len(sym)))
        else:
            sym_pos = text.find(sym, m.start())
            positions.append((idx, sym_pos, sym_pos + len(sym)))
    positions.sort(key=lambda x: x[1])
    opts = []
    for i, (num, start, content_start) in enumerate(positions):
        end = positions[i + 1][1] if i + 1 < len(positions) else len(text)
        opts.append(text[content_start:end].strip())
    return opts


def parse_mcq_answer_char(txt):
    for sym, num in CIRCLE_MAP.items():
        if sym in txt:
            return num
    m = re.search(r"([1-5])", txt)
    return int(m.group(1)) if m else None


def extract_keywords_from_text(text, max_kw=7):
    kws = []
    seen = set()
    # Laws 「...」
    for m in re.finditer(r"「([^」]{2,30})」", text):
        k = f"「{m.group(1)}」"
        if k not in seen:
            seen.add(k)
            kws.append(k)
    # Key scholars / models like Author(Year) or English capitalized models
    for m in re.finditer(r"\b(ASCA|ACA|MTSS|MMSE|DAP|SOLER|WDEP|SAMIC³?|REBT|BASIC\s*I\.D\.|HELPING|ZPD|MMO|Tarasoff|STEPS|FERPA|Wee|FBA|UDL|USA|UOA|ULA)\b", text):
        k = m.group(1).strip()
        if k not in seen:
            seen.add(k)
            kws.append(k)
    # Important Korean key concepts
    concept_candidates = re.findall(
        r"(비계설정|사적 언어|근접발달영역|상상적 청중|개인적 우화|방어기제|자아분화|삼각관계|"
        r"정체감 유실|정체감 유예|정체감 성취|다차원적 자아개념|단짝친구|가치 괄호치기|"
        r"사전동의|윤리적 승낙|비밀보장|보호의무|경고의무|전문가 과실|역할갈등|자기돌봄|"
        r"작업동맹|접수면접|심층 감정 반영|돌봄 어린 직면|즉시성|가교 놓기|점화순서|단회상담|"
        r"아들러식 격려|과잉정당화|자기효능감|무조건적 긍정적 존중|일치성|공감적 이해|"
        r"협력적 경험주의|소크라테스식 질문|당위|무조건적 자기수용|전행동|대표강점|몰입|"
        r"차단하기|연결짓기|지금-여기|과정 조명|보편성|이타성|또래조정|솔리언|학급회의|논리적 결과|"
        r"교시 순환제|선별면담|이중 동의|학생맞춤통합지원|데이터 기반 책무성)",
        text,
    )
    for k in concept_candidates:
        if k not in seen:
            seen.add(k)
            kws.append(k)
    if len(kws) < 4:
        # Fallback: extract salient multi-syllable noun tokens inside parentheses or comma segments
        for seg in re.split(r"[,·()\[\]:;]+", text):
            seg = seg.strip()
            if 3 <= len(seg) <= 18 and not re.search(r"\d{4}", seg) and seg not in seen:
                if re.search(r"[가-힣]{3,}", seg):
                    seen.add(seg)
                    kws.append(seg)
                    if len(kws) >= 6:
                        break
    return kws[:max_kw]


def parse_ch1_to_ch4_review(ch_no, items, rel_map):
    """Parse Ch01-04 review sections (5 MCQs + 4 Essays with per-question rubric tables)."""
    # Find key landmarks
    type_a_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and "유형 A" in x["plain"])
    type_b_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and "유형 B" in x["plain"] and "선택" not in x["plain"])
    ans_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and re.match(rf"^{ch_no}\.\d+\.2\s+", x["plain"]))
    ans_b_idx = next(i for i, x in enumerate(items) if i > ans_idx and x["tag"] == "p" and "유형 B" in x["plain"])

    # --- 1. Parse 5 MCQs from items[type_a_idx+1 : type_b_idx] ---
    mcq_items = items[type_a_idx + 1 : type_b_idx]
    mcqs = []
    cur = None
    for it in mcq_items:
        t = it["plain"]
        if not t:
            continue
        m_q = re.match(r"^문항\s*(\d+)\.\s*(.+)$", t)
        if m_q:
            if cur:
                mcqs.append(cur)
            cur = {
                "num": int(m_q.group(1)),
                "stem": m_q.group(2).strip(),
                "stemHtml": it["html"],
                "contextParts": [],
                "contextHtmlParts": [],
                "rawOptionTexts": [],
            }
            continue
        if cur is None:
            continue
        if t[0] in CIRCLES or (cur["rawOptionTexts"]):
            cur["rawOptionTexts"].append(t)
        else:
            cur["contextParts"].append(t)
            cur["contextHtmlParts"].append(it["html"])
    if cur:
        mcqs.append(cur)

    # Split options cleanly for each MCQ
    for q in mcqs:
        combined_opt_str = "\n".join(q["rawOptionTexts"])
        opts = split_inline_options(combined_opt_str)
        assert opts and len(opts) == 5, f"Ch{ch_no} MCQ {q['num']} failed option split: {combined_opt_str[:120]}"
        q["options"] = opts
        q["contextBox"] = "\n".join(q["contextParts"]).strip()
        q["contextBoxHtml"] = "<br>".join(q["contextHtmlParts"]).strip()
        del q["rawOptionTexts"], q["contextParts"], q["contextHtmlParts"]

    # --- 2. Parse MCQ Answers & Explanations from items[ans_idx : ans_b_idx] ---
    ans_a_items = items[ans_idx:ans_b_idx]
    summary_tbl = next((x["table"] for x in ans_a_items if x["tag"] == "tbl"), None)
    ans_meta = {}
    if summary_tbl:
        for row in summary_tbl["rows"]:
            m_num = re.search(r"(\d+)", row[0]["plain"])
            if m_num:
                q_num = int(m_num.group(1))
                ans_num = parse_mcq_answer_char(row[1]["plain"])
                if len(row) >= 5:
                    # Ch04 format: 문항 | 정답 | 관련 절 | 핵심 평가 영역 | 원전
                    ans_meta[q_num] = {
                        "answer": ans_num,
                        "sectionRef": row[2]["plain"],
                        "keyArea": row[3]["plain"],
                        "sources": row[4]["plain"],
                    }
                else:
                    ans_meta[q_num] = {
                        "answer": ans_num,
                        "sectionRef": "",
                        "keyArea": row[2]["plain"] if len(row) > 2 else "",
                        "sources": row[3]["plain"] if len(row) > 3 else "",
                    }

    # Parse detailed explanation blocks: "문항 N 해설 ..."
    exp_blocks = {}
    cur_exp_num = None
    for it in ans_a_items:
        if it["tag"] != "p" or not it["plain"]:
            continue
        t = it["plain"]
        m_exp = re.match(r"^문항\s*(\d+)\s*해설", t)
        if m_exp:
            cur_exp_num = int(m_exp.group(1))
            ans_char = parse_mcq_answer_char(t)
            if cur_exp_num in ans_meta and ans_char and ans_meta[cur_exp_num]["answer"] is None:
                ans_meta[cur_exp_num]["answer"] = ans_char
            exp_blocks[cur_exp_num] = {"plain": [t], "html": [it["html"]]}
        elif cur_exp_num is not None:
            exp_blocks[cur_exp_num]["plain"].append(t)
            exp_blocks[cur_exp_num]["html"].append(it["html"])

    final_mcqs = []
    for q in mcqs:
        n = q["num"]
        meta = ans_meta[n]
        exp_p = "\n\n".join(exp_blocks[n]["plain"])
        exp_h = "".join(f"<p>{h}</p>" for h in exp_blocks[n]["html"])
        # Strip leading "문항 N. " from stemHtml if present
        stem_html = re.sub(rf"^문항\s*{n}\.\s*", "", q["stemHtml"])
        final_mcqs.append({
            "id": f"default-ch{ch_no:02d}-q{n}",
            "chapter": ch_no,
            "num": n,
            "sectionRef": meta["sectionRef"] or f"{ch_no}.{min(n, 4)}",
            "difficulty": "대학원 심화",
            "stem": q["stem"],
            "stemHtml": stem_html,
            "contextBox": q["contextBox"],
            "contextBoxHtml": q["contextBoxHtml"],
            "options": q["options"],
            "answer": meta["answer"],
            "keyArea": meta["keyArea"],
            "sources": meta["sources"],
            "explanation": exp_p,
            "explanationHtml": exp_h,
        })

    # --- 3. Parse 4 Essays from items[type_b_idx+1 : ans_idx] ---
    ess_items = items[type_b_idx + 1 : ans_idx]
    ess_raw = []
    cur_e = None
    for it in ess_items:
        if it["tag"] != "p" or not it["plain"]:
            continue
        t = it["plain"]
        m_e = re.match(r"^(?:논술형\s*)?문항\s*(\d+)\.\s*(.+)$", t)
        if m_e:
            if cur_e:
                ess_raw.append(cur_e)
            cur_e = {
                "num": int(m_e.group(1)),
                "headerText": m_e.group(2).strip(),
                "bodyParas": [],
                "bodyHtmls": [],
            }
        elif cur_e is not None:
            cur_e["bodyParas"].append(t)
            cur_e["bodyHtmls"].append(it["html"])
    if cur_e:
        ess_raw.append(cur_e)

    # --- 4. Parse Essay Rubrics & Model Answers from items[ans_b_idx+1 :] ---
    ans_b_items = items[ans_b_idx + 1 :]
    essay_rubrics = {}
    essay_models = {}
    cur_m_num = None
    last_tbl_q = None
    for it in ans_b_items:
        if it["tag"] == "p":
            t = it["plain"]
            if not t:
                continue
            m_caption = re.match(r"^표\s*\d+-\d+\.\s*논술형\s*문항\s*(\d+)", t)
            if m_caption:
                last_tbl_q = int(m_caption.group(1))
                continue
            m_title = re.match(r"^논술형\s*문항\s*(\d+)\s*해설\s*\((.+)\)", t)
            if m_title:
                last_tbl_q = int(m_title.group(1))
                essay_models.setdefault(last_tbl_q, {"subtitle": m_title.group(2), "p": [], "h": []})
                continue
            m_mod = re.match(r"^-?\s*논술형\s*문항\s*(\d+)\s*모범\s*답안", t)
            if m_mod:
                cur_m_num = int(m_mod.group(1))
                essay_models.setdefault(cur_m_num, {"subtitle": "", "p": [], "h": []})
                continue
            if t.startswith("[모범 답안 요지]"):
                cur_m_num = last_tbl_q
                essay_models.setdefault(cur_m_num, {"subtitle": "", "p": [], "h": []})
                continue
            if cur_m_num is not None:
                essay_models[cur_m_num]["p"].append(t)
                essay_models[cur_m_num]["h"].append(it["html"])
        elif it["tag"] == "tbl":
            q_num = last_tbl_q or (len(essay_rubrics) + 1)
            tbl = it["table"]
            rubric_rows = []
            for row in tbl["rows"]:
                # Ch01-03: 평가 영역 | 배점 비중 | 핵심 채점 준거 | 감점 유의점
                # Ch04:    평가 영역 | 세부 채점 기준 | 배점 (총 25점) | 핵심 근거 문헌
                c0 = row[0]["plain"]
                c1 = row[1]["plain"] if len(row) > 1 else ""
                c2 = row[2]["plain"] if len(row) > 2 else ""
                c3 = row[3]["plain"] if len(row) > 3 else ""
                if re.search(r"\d+\s*점", c2):
                    # Ch04 layout
                    pts_m = re.search(r"(\d+)\s*점", c2)
                    rubric_rows.append({
                        "area": c0,
                        "weight": c2,
                        "points": int(pts_m.group(1)) if pts_m else 0,
                        "criteria": c1,
                        "deduction": f"근거 문헌: {c3}" if c3 else "",
                    })
                else:
                    pct_m = re.search(r"(\d+)\s*%", c1)
                    rubric_rows.append({
                        "area": c0,
                        "weight": c1,
                        "points": int(pct_m.group(1)) if pct_m else 0,
                        "criteria": c2,
                        "deduction": c3,
                    })
            essay_rubrics[q_num] = rubric_rows

    final_essays = []
    for er in ess_raw:
        n = er["num"]
        hdr = er["headerText"]
        # Split bodyParas into situation vs prompt questions
        sit_parts = []
        sit_htmls = []
        prm_parts = []
        prm_htmls = []
        in_prompt = False
        for bp, bh in zip(er["bodyParas"], er["bodyHtmls"]):
            if re.match(r"^(위 사례에 대하여|1\)|1\.\s|①|[가-힣]+에 대해\s+다음|[가-힣\s,()]+에 대하여)", bp) and (
                "논술하시오" in bp or "논하시오" in bp or "서술하시오" in bp or "제시" in bp or re.match(r"^1\)", bp)
            ):
                in_prompt = True
            elif in_prompt is False and (re.search(r"(서술하시오|논하시오|논술하시오|작성하시오|분석하시오|수립하시오|제시할 것)\.?(\s*\(\d+점\))?$", bp)):
                # Check if whole paragraph is a sub-question or Ch04 direct question paragraph
                if len(bp) < 420 and ("사례" not in bp[:20] or "논하시오" in bp[-25:] or "서술하시오" in bp[-25:] or "작성하시오" in bp[-25:]):
                    prm_parts.append(bp)
                    prm_htmls.append(bh)
                    in_prompt = True
                    continue
            if in_prompt:
                prm_parts.append(bp)
                prm_htmls.append(bh)
            else:
                sit_parts.append(bp)
                sit_htmls.append(bh)
        if not prm_parts and sit_parts:
            # Move last paragraph(s) with questions into prompt
            prm_parts = [sit_parts.pop()]
            prm_htmls = [sit_htmls.pop()]
        if prm_parts and not sit_parts and len(prm_parts) == 1:
            single_p = prm_parts[0]
            m_inline = re.search(r"^(.*?(?:하였다|였다|보인다|요청했다)\.)\s+(1\)\s*.+)$", single_p)
            if m_inline:
                sit_parts = [m_inline.group(1).strip()]
                sit_htmls = [html.escape(sit_parts[0])]
                prm_parts = [m_inline.group(2).strip()]
                prm_htmls = [html.escape(prm_parts[0])]

        title = hdr.strip("[]")
        if ch_no == 4 and n in essay_models and essay_models[n]["subtitle"]:
            title = essay_models[n]["subtitle"]

        rubric = essay_rubrics[n]
        mod_p = "\n\n".join(essay_models[n]["p"])
        mod_h = "".join(f"<p>{h}</p>" for h in essay_models[n]["h"])
        kw_source = " ".join(r["criteria"] for r in rubric) + " " + mod_p
        keywords = extract_keywords_from_text(kw_source, max_kw=7)

        final_essays.append({
            "id": f"default-ch{ch_no:02d}-e{n}",
            "chapter": ch_no,
            "num": n,
            "sectionRef": f"{ch_no}.{min(n, 4)}",
            "title": title,
            "situation": "\n\n".join(sit_parts),
            "situationHtml": "".join(f"<p>{h}</p>" for h in sit_htmls),
            "prompt": "\n\n".join(prm_parts),
            "promptHtml": "".join(f"<p>{h}</p>" for h in prm_htmls),
            "rubric": rubric,
            "keywords": keywords,
            "modelAnswer": mod_p,
            "modelAnswerHtml": mod_h,
        })

    return final_mcqs, [], final_essays


def parse_ch5_review(items):
    """Parse Ch05 (10 MCQs + 5 Short Answers + 5 Essays from 표 5-25 & 표 5-26)."""
    s1_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and "5.11.1" in x["plain"])
    sa_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and "2) 단답형" in x["plain"])
    t25_idx = next(i for i, x in enumerate(items) if x["tag"] == "tbl" and i > sa_idx)
    s2_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and "5.11.2" in x["plain"])
    t26_idx = next(i for i, x in enumerate(items) if x["tag"] == "tbl" and i > s2_idx)

    # --- 1. Parse 10 MCQs ---
    mcqs_raw = []
    cur = None
    for it in items[s1_idx + 1 : sa_idx]:
        t = it["plain"]
        if not t or t.startswith("1) 객관식"):
            continue
        m_q = re.match(r"^(\d+)\.\s+(.+)$", t)
        if m_q:
            if cur:
                mcqs_raw.append(cur)
            cur = {"num": int(m_q.group(1)), "stem": m_q.group(2).strip(), "stemHtml": it["html"], "opts": []}
        elif cur is not None:
            for sym in CIRCLES:
                if t.startswith(sym):
                    cur["opts"].append(t[len(sym):].strip())
                    break
    if cur:
        mcqs_raw.append(cur)

    # --- 2. Parse 5 Short Answers ---
    short_raw = []
    for it in items[sa_idx + 1 : t25_idx]:
        t = it["plain"]
        m_s = re.match(r"^(\d+)\.\s+(.+)$", t)
        if m_s:
            short_raw.append({"num": int(m_s.group(1)), "question": m_s.group(2).strip(), "questionHtml": it["html"]})

    # --- 3. Parse Table 5-25 Answers ---
    t25 = items[t25_idx]["table"]
    t25_map = {}
    for row in t25["rows"]:
        m_num = re.search(r"(\d+)", row[0]["plain"])
        if m_num:
            num = int(m_num.group(1))
            t25_map[num] = {
                "ansText": row[1]["plain"],
                "ansNum": parse_mcq_answer_char(row[1]["plain"]),
                "exp": row[2]["plain"] if len(row) > 2 else "",
                "expHtml": row[2]["html"] if len(row) > 2 else "",
                "sources": row[3]["plain"] if len(row) > 3 else "",
                "sourcesHtml": row[3]["html"] if len(row) > 3 else "",
            }

    mcqs = []
    for q in mcqs_raw:
        n = q["num"]
        assert len(q["opts"]) == 5, f"Ch05 MCQ {n} opts={len(q['opts'])}"
        m = t25_map[n]
        stem_html = re.sub(rf"^{n}\.\s*", "", q["stemHtml"])
        mcqs.append({
            "id": f"default-ch05-q{n}",
            "chapter": 5,
            "num": n,
            "sectionRef": f"5.{min(n, 9)}",
            "difficulty": "이론·사례 판별",
            "stem": q["stem"],
            "stemHtml": stem_html,
            "contextBox": "",
            "contextBoxHtml": "",
            "options": q["opts"],
            "answer": m["ansNum"],
            "keyArea": "상담이론 핵심 개념 및 학교 적용",
            "sources": m["sources"],
            "explanation": f"정답: {m['ansText']} — {m['exp']}\n(근거 문헌: {m['sources']})",
            "explanationHtml": f"<p><strong>정답: {m['ansText']}</strong> — {m['expHtml']}</p><p><strong>근거 문헌:</strong> {m['sourcesHtml']}</p>",
        })

    short_answers = []
    for sa in short_raw:
        n = sa["num"]
        m = t25_map[n]
        short_answers.append({
            "id": f"default-ch05-sa{n}",
            "chapter": 5,
            "num": n,
            "question": sa["question"],
            "questionHtml": re.sub(rf"^{n}\.\s*", "", sa["questionHtml"]),
            "answer": m["ansText"],
            "explanation": m["exp"],
            "sources": m["sources"],
        })

    # --- 4. Parse 5 Essays & Table 5-26 Rubric ---
    ess_raw = []
    for it in items[s2_idx + 1 : t26_idx]:
        if it["tag"] != "p":
            continue
        t = it["plain"]
        m_e = re.match(r"^(\d+)\.\s+([^:]+):\s*(.+)$", t)
        if m_e:
            ess_raw.append({
                "num": int(m_e.group(1)),
                "title": m_e.group(2).strip(),
                "body": m_e.group(3).strip(),
                "bodyHtml": it["html"],
            })

    t26 = items[t26_idx]["table"]
    t26_map = {}
    for row in t26["rows"]:
        m_num = re.search(r"(\d+)", row[0]["plain"])
        if m_num:
            num = int(m_num.group(1))
            t26_map[num] = {
                "competency": row[1]["plain"],
                "criteria": row[2]["plain"],
                "criteriaHtml": row[2]["html"],
                "sources": row[3]["plain"] if len(row) > 3 else "",
                "sourcesHtml": row[3]["html"] if len(row) > 3 else "",
            }

    essays = []
    for er in ess_raw:
        n = er["num"]
        meta = t26_map[n]
        # Split "(1) ..., (2) ..., (3) ..." criteria into individual rubric items
        parts = re.split(r"(?=\(\d+\)\s*)", meta["criteria"])
        parts = [p.strip(" ,.") for p in parts if p.strip()]
        rubric = []
        base_pts = 100 // max(len(parts), 1)
        rem = 100 - base_pts * len(parts)
        for idx_p, part in enumerate(parts):
            pts = base_pts + (1 if idx_p < rem else 0)
            rubric.append({
                "area": f"논점 {idx_p + 1} ({meta['competency']})",
                "weight": f"{pts}%",
                "points": pts,
                "criteria": part,
                "deduction": f"핵심 문헌: {meta['sources']}",
            })
        # Split situation vs prompt cleanly
        body = er["body"]
        m_sep = re.search(r"^(.*?(?:가정하자\.|학생을 대상으로|위기 학생에 대하여))\s*(.+)$", body)
        if m_sep:
            sit = m_sep.group(1).strip()
            prm = m_sep.group(2).strip()
        else:
            sit = f"[{er['title']}] 이론 비교 및 학교 현장 적용 논술 과제"
            prm = body

        model_txt = f"[핵심 평가 역량] {meta['competency']}\n\n[모범 답안 필수 포함 논거]\n" + "\n".join(f"• {p}" for p in parts) + f"\n\n[핵심 문헌] {meta['sources']}"
        model_html = f"<p><strong>핵심 평가 역량:</strong> {html.escape(meta['competency'])}</p><p><strong>모범 답안 필수 포함 논거:</strong></p><ul>" + "".join(f"<li>{html.escape(p)}</li>" for p in parts) + f"</ul><p><strong>핵심 문헌:</strong> {meta['sourcesHtml']}</p>"

        essays.append({
            "id": f"default-ch05-e{n}",
            "chapter": 5,
            "num": n,
            "sectionRef": f"5.{min(n * 2 - 1, 9)}",
            "title": er["title"],
            "situation": sit,
            "situationHtml": f"<p>{html.escape(sit)}</p>",
            "prompt": prm,
            "promptHtml": f"<p>{html.escape(prm)}</p>",
            "rubric": rubric,
            "keywords": extract_keywords_from_text(meta["criteria"] + " " + er["body"], max_kw=7),
            "modelAnswer": model_txt,
            "modelAnswerHtml": model_html,
        })

    return mcqs, short_answers, essays


def parse_ch6_review(items):
    """Parse Ch06 (5 MCQs + 4 Essays with Table 6-19 ~ 6-23)."""
    type_a_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and "유형 A" in x["plain"])
    type_b_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and "유형 B" in x["plain"])
    ans_idx = next(i for i, x in enumerate(items) if x["tag"] == "p" and "6.9.2" in x["plain"])

    # --- 1. Parse 5 MCQs ---
    mcqs_raw = []
    cur = None
    for it in items[type_a_idx + 1 : type_b_idx]:
        t = it["plain"]
        m_q = re.match(r"^문항\s*6-(\d+)\.\s*(.+)$", t)
        if m_q:
            if cur:
                mcqs_raw.append(cur)
            cur = {"num": int(m_q.group(1)), "stem": m_q.group(2).strip(), "stemHtml": it["html"], "opts": []}
        elif cur is not None:
            for sym in CIRCLES:
                if t.startswith(sym):
                    cur["opts"].append(t[len(sym):].strip())
                    break
    if cur:
        mcqs_raw.append(cur)

    # --- 2. Parse Table 6-19 + bullet detailed explanations ---
    t19 = next(x["table"] for x in items[ans_idx:] if x["tag"] == "tbl")
    ans_meta = {}
    for row in t19["rows"]:
        m_num = re.search(r"6-(\d+)", row[0]["plain"])
        if m_num:
            n = int(m_num.group(1))
            ans_meta[n] = {
                "answer": parse_mcq_answer_char(row[1]["plain"]),
                "keyArea": row[2]["plain"] if len(row) > 2 else "",
                "sources": row[3]["plain"] if len(row) > 3 else "",
            }

    exp_map = {}
    for it in items[ans_idx:]:
        if it["tag"] == "p":
            m_ex = re.match(r"^[◦•\-\s]*문항\s*6-(\d+)\s*해설[:：]\s*(.+)$", it["plain"])
            if m_ex:
                n = int(m_ex.group(1))
                exp_map[n] = {"plain": m_ex.group(2).strip(), "html": it["html"]}

    mcqs = []
    for q in mcqs_raw:
        n = q["num"]
        assert len(q["opts"]) == 5, f"Ch06 MCQ {n} opts={len(q['opts'])}"
        meta = ans_meta[n]
        mcqs.append({
            "id": f"default-ch06-q{n}",
            "chapter": 6,
            "num": n,
            "sectionRef": f"6.{n}",
            "difficulty": "대학원 심화",
            "stem": q["stem"],
            "stemHtml": re.sub(rf"^문항\s*6-{n}\.\s*", "", q["stemHtml"]),
            "contextBox": "",
            "contextBoxHtml": "",
            "options": q["opts"],
            "answer": meta["answer"],
            "keyArea": meta["keyArea"],
            "sources": meta["sources"],
            "explanation": exp_map[n]["plain"],
            "explanationHtml": f"<p>{exp_map[n]['html']}</p>",
        })

    # --- 3. Parse 4 Essays ---
    ess_raw = []
    cur_e = None
    for it in items[type_b_idx + 1 : ans_idx]:
        if it["tag"] != "p" or not it["plain"]:
            continue
        t = it["plain"]
        m_e = re.match(r"^문항\s*6-(\d+)\.\s*(.+)$", t)
        if m_e:
            if cur_e:
                ess_raw.append(cur_e)
            cur_e = {"num": int(m_e.group(1)), "paras": [t], "htmls": [it["html"]]}
        elif cur_e is not None:
            cur_e["paras"].append(t)
            cur_e["htmls"].append(it["html"])
    if cur_e:
        ess_raw.append(cur_e)

    # Parse Tables 6-20 ~ 6-23
    rubric_tables = {}
    last_q = None
    for it in items[ans_idx:]:
        if it["tag"] == "p":
            m_cap = re.search(r"\[논술형 문항\s*6-(\d+)\]\s*(.+?)\s*채점 기준표", it["plain"])
            if m_cap:
                last_q = int(m_cap.group(1))
                rubric_tables[last_q] = {"title": m_cap.group(2).strip(), "tbl": None}
        elif it["tag"] == "tbl" and last_q is not None and rubric_tables[last_q]["tbl"] is None:
            rubric_tables[last_q]["tbl"] = it["table"]

    essays = []
    for er in ess_raw:
        n = er["num"]
        rt = rubric_tables[n]
        rubric = []
        model_parts_p = []
        model_parts_h = []
        for row in rt["tbl"]["rows"]:
            c0 = row[0]["plain"]
            c1 = row[1]["plain"] if len(row) > 1 else ""
            c2 = row[2]["plain"] if len(row) > 2 else ""
            pts_m = re.search(r"(\d+)\s*점", c0)
            pts = int(pts_m.group(1)) if pts_m else 30
            rubric.append({
                "area": c0,
                "weight": f"{pts}점",
                "points": pts,
                "criteria": c1,
                "deduction": "",
            })
            model_parts_p.append(f"[{c0}]\n{c2}")
            model_parts_h.append(f"<p><strong>{html.escape(c0)}</strong></p><p>{row[2]['html'] if len(row)>2 else ''}</p>")

        first_p = re.sub(rf"^문항\s*6-{n}\.\s*", "", er["paras"][0])
        if len(er["paras"]) > 1:
            sit = first_p
            sit_h = f"<p>{re.sub(rf'^문항\s*6-{n}\.\s*', '', er['htmls'][0])}</p>"
            prm = "\n".join(er["paras"][1:])
            prm_h = "".join(f"<p>{h}</p>" for h in er["htmls"][1:])
        else:
            # Split at ① or sentence prompting action
            m_sp = re.search(r"^(.*?[었다다였]\.)\s*(①.+|.*(?:논술하시오|논하시오|설명하시오|제시하시오|구상하시오|설계하시오)\.?)$", first_p)
            if m_sp:
                sit = m_sp.group(1).strip()
                prm = m_sp.group(2).strip()
            else:
                sit = first_p
                prm = first_p
            sit_h = f"<p>{html.escape(sit)}</p>"
            prm_h = f"<p>{html.escape(prm)}</p>"

        model_txt = "\n\n".join(model_parts_p)
        model_html = "".join(model_parts_h)
        kw_src = " ".join(r["criteria"] for r in rubric) + " " + model_txt

        essays.append({
            "id": f"default-ch06-e{n - 5}",
            "chapter": 6,
            "num": n - 5,
            "sectionRef": f"6.{min(n - 5, 7)}",
            "title": rt["title"],
            "situation": sit,
            "situationHtml": sit_h,
            "prompt": prm,
            "promptHtml": prm_h,
            "rubric": rubric,
            "keywords": extract_keywords_from_text(kw_src, max_kw=7),
            "modelAnswer": model_txt,
            "modelAnswerHtml": model_html,
        })

    return mcqs, [], essays


def main():
    with zipfile.ZipFile(VOL1_DOCX) as z:
        root = ET.fromstring(z.read("word/document.xml"))
        rels = ET.fromstring(z.read("word/_rels/document.xml.rels"))

    rel_map = {el.attrib["Id"]: el.attrib.get("Target", "") for el in rels}
    body = list(root.find(f"{W}body"))

    # Locate chapters 1..6 and stop strictly at 제07장
    ch_starts = []
    vol2_start = None
    for i, el in enumerate(body):
        if el.tag == f"{W}p":
            t = el_plain(el)
            if re.match(r"^제07장\s+", t) and len(t) < 40:
                vol2_start = i
                break
            m = re.match(r"^제(0[1-6])장\s+(.+)$", t)
            if m and len(t) < 40:
                ch_starts.append((i, int(m.group(1)), m.group(2).strip(), t))

    assert len(ch_starts) == 6, f"Expected 6 chapters, got {len(ch_starts)}"
    assert vol2_start is not None, "Could not locate 제07장 marker"

    chapters = []
    all_mcqs = []
    all_short_answers = []
    all_essays = []

    for idx, (start_idx, ch_no, ch_short_title, ch_full_title) in enumerate(ch_starts):
        end_idx = ch_starts[idx + 1][0] if idx + 1 < len(ch_starts) else vol2_start
        raw_nodes = body[start_idx + 1 : end_idx]

        # Build clean list of {tag, plain, html, links, table} and skip misplaced 2.6 in Ch01
        items = []
        skip_misplaced_26 = False
        for node in raw_nodes:
            tag = node.tag.split("}")[-1]
            if tag == "p":
                t = el_plain(node)
                if ch_no == 1 and re.match(r"^2\.6\s+", t) and len(t) < 65:
                    skip_misplaced_26 = True
                    continue
                if skip_misplaced_26:
                    if re.match(r"^1\.\d+\s+", t) and len(t) < 65:
                        skip_misplaced_26 = False
                    else:
                        continue
                p_html, p_links = p_to_html_and_links(node, rel_map)
                items.append({"tag": "p", "plain": t, "html": p_html, "links": p_links})
            elif tag == "tbl":
                if skip_misplaced_26:
                    continue
                # Check if previous item was a table caption
                cap = ""
                if items and items[-1]["tag"] == "p" and re.match(r"^표\s*\d+-\d+", items[-1]["plain"]):
                    cap = items[-1]["plain"]
                tbl_data = tbl_to_data(node, rel_map, caption=cap)
                items.append({"tag": "tbl", "plain": "", "table": tbl_data, "links": tbl_data["links"]})

        # Split chapter items into sections
        goal = ""
        sections = []
        cur_sec = None
        for it in items:
            if it["tag"] == "p":
                t = it["plain"]
                if not t:
                    continue
                if cur_sec is None and t.startswith("장 학습목표:"):
                    goal = t.replace("장 학습목표:", "").strip()
                    continue
                m_sec = re.match(rf"^({ch_no}\.\d+)\s+(.+)$", t)
                if m_sec and len(t) < 65:
                    if cur_sec:
                        sections.append(cur_sec)
                    cur_sec = {
                        "secNo": m_sec.group(1),
                        "title": m_sec.group(2).strip(),
                        "rawItems": [],
                    }
                    continue
            if cur_sec is not None:
                cur_sec["rawItems"].append(it)
        if cur_sec:
            sections.append(cur_sec)

        core_sections = []
        activity_section = None
        review_section = None

        for sec in sections:
            if "수업활동" in sec["title"]:
                # Collect paragraphs & tables for interactive classroom workshop cards
                sub_blocks = []
                cur_sub = {"subNo": "", "title": sec["title"], "paragraphs": [], "tables": []}
                for it in sec["rawItems"]:
                    if it["tag"] == "p":
                        t = it["plain"]
                        m_sub = re.match(rf"^({re.escape(sec['secNo'])}\.\d+)\s+(.+)$", t)
                        if m_sub and len(t) < 110:
                            if cur_sub["paragraphs"] or cur_sub["tables"]:
                                sub_blocks.append(cur_sub)
                            cur_sub = {"subNo": m_sub.group(1), "title": m_sub.group(2).strip(), "paragraphs": [], "tables": []}
                        else:
                            is_cap = bool(re.match(r"^표\s*\d+-\d+", t))
                            cur_sub["paragraphs"].append({"plain": t, "html": it["html"], "isCaption": is_cap})
                    elif it["tag"] == "tbl":
                        cur_sub["tables"].append(it["table"])
                if cur_sub["paragraphs"] or cur_sub["tables"]:
                    sub_blocks.append(cur_sub)
                activity_section = {
                    "secNo": sec["secNo"],
                    "title": sec["title"],
                    "activities": sub_blocks,
                }
            elif "복습문제" in sec["title"]:
                review_section = sec
            else:
                # Core theory section
                intro_paras = []
                subsections = []
                cur_sub = None
                for it in sec["rawItems"]:
                    if it["tag"] == "p":
                        t = it["plain"]
                        m_sub = re.match(rf"^({re.escape(sec['secNo'])}\.\d+)\s+(.+)$", t)
                        if m_sub and len(t) < 110:
                            if cur_sub:
                                subsections.append(cur_sub)
                            cur_sub = {
                                "subNo": m_sub.group(1),
                                "title": m_sub.group(2).strip(),
                                "paragraphs": [],
                                "tables": [],
                                "links": [],
                            }
                            continue
                        is_cap = bool(re.match(r"^표\s*\d+-\d+", t))
                        p_obj = {"plain": t, "html": it["html"], "isCaption": is_cap}
                        if cur_sub is None:
                            intro_paras.append(p_obj)
                        else:
                            cur_sub["paragraphs"].append(p_obj)
                            cur_sub["links"].extend(it.get("links", []))
                    elif it["tag"] == "tbl":
                        if cur_sub is not None:
                            cur_sub["tables"].append(it["table"])
                            cur_sub["links"].extend(it.get("links", []))
                        else:
                            # Table before first subsection
                            cur_sub = {
                                "subNo": f"{sec['secNo']}.0",
                                "title": "개관 표",
                                "paragraphs": [],
                                "tables": [it["table"]],
                                "links": list(it.get("links", [])),
                            }
                if cur_sub:
                    subsections.append(cur_sub)

                # Deduplicate links and compute bullets per subsection
                total_tables = 0
                for sub in subsections:
                    total_tables += len(sub["tables"])
                    seen_u = set()
                    uniq_links = []
                    for lk in sub["links"]:
                        key = (lk["label"], lk["url"])
                        if key not in seen_u:
                            seen_u.add(key)
                            uniq_links.append(lk)
                    sub["links"] = uniq_links[:16]
                    sub["bullets"] = auto_bullets_from_paragraphs(sub["paragraphs"], max_bullets=3)

                core_sections.append({
                    "id": f"sec-{sec['secNo'].replace('.', '-')}",
                    "chapter": ch_no,
                    "secNo": sec["secNo"],
                    "title": sec["title"],
                    "introParagraphs": intro_paras,
                    "subsections": subsections,
                    "tableCount": total_tables,
                })

        assert review_section is not None, f"Missing review section in Ch{ch_no}"
        if ch_no in (1, 2, 3, 4):
            mcqs, shorts, essays = parse_ch1_to_ch4_review(ch_no, review_section["rawItems"], rel_map)
        elif ch_no == 5:
            mcqs, shorts, essays = parse_ch5_review(review_section["rawItems"])
        else:
            mcqs, shorts, essays = parse_ch6_review(review_section["rawItems"])

        all_mcqs.extend(mcqs)
        all_short_answers.extend(shorts)
        all_essays.extend(essays)

        chapters.append({
            "chapter": ch_no,
            "code": f"제{ch_no:02d}장",
            "title": ch_short_title,
            "fullTitle": ch_full_title,
            "goal": goal,
            "coreSections": core_sections,
            "activitySection": activity_section,
        })

    # --- Strict Assertions ---
    assert len(chapters) == 6
    sec_counts = [len(c["coreSections"]) for c in chapters]
    assert sec_counts == [4, 6, 8, 4, 9, 7], f"Unexpected core section counts: {sec_counts}"
    for c in chapters:
        for s in c["coreSections"]:
            assert s["secNo"].startswith(f"{c['chapter']}."), f"Stray section {s['secNo']} in Ch{c['chapter']}"

    assert len(all_mcqs) == 35, f"Expected 35 MCQs, got {len(all_mcqs)}"
    for q in all_mcqs:
        assert len(q["options"]) == 5, f"{q['id']} options != 5"
        assert q["answer"] in (1, 2, 3, 4, 5), f"{q['id']} invalid answer {q['answer']}"
        assert q["stem"] and q["explanation"], f"{q['id']} empty stem/explanation"

    assert len(all_short_answers) == 5, f"Expected 5 short answers, got {len(all_short_answers)}"
    assert len(all_essays) == 25, f"Expected 25 essays, got {len(all_essays)}"
    for e in all_essays:
        assert e["title"] and e["prompt"], f"{e['id']} missing title/prompt"
        min_rubric = 2 if e["chapter"] == 5 else 3
        assert len(e["rubric"]) >= min_rubric, f"{e['id']} rubric < {min_rubric} rows"
        assert len(e["keywords"]) >= 4, f"{e['id']} keywords < 4"
        assert e["modelAnswer"], f"{e['id']} missing modelAnswer"

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    payload = {
        "chapters": chapters,
        "defaultPack": {
            "id": "pack-default-vol1",
            "name": "상권 마스터원고 기본 세트 (제01~06장)",
            "source": "『학교상담과 생활지도』 상권 마스터원고",
            "createdAt": "2026-11-15",
            "isDefault": True,
            "mcqs": all_mcqs,
            "shortAnswers": all_short_answers,
            "essays": all_essays,
        },
    }
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(
        f"[OK] Extracted Vol 1 -> {OUT_JSON}\n"
        f"     Chapters: {len(chapters)}, Core Sections: {sum(sec_counts)} {sec_counts}\n"
        f"     MCQs: {len(all_mcqs)}, ShortAnswers: {len(all_short_answers)}, Essays: {len(all_essays)}"
    )


if __name__ == "__main__":
    main()
