#!/usr/bin/env python3
"""Bundle Vol 1 study_web source files into standalone zero-install ./07_상권_인터랙티브_학습스튜디오.html"""

import json
import os
from pathlib import Path

STUDY_WEB_DIR = Path(__file__).resolve().parent
ROOT_DIR = STUDY_WEB_DIR.parent
SRC_DIR = STUDY_WEB_DIR / "src"
SAMPLE_TXT = STUDY_WEB_DIR / "sample_gemini_pack_vol1.txt"
PAGES_INDEX_HTML = STUDY_WEB_DIR / "index.html"
OUT_HTML = ROOT_DIR / "07_상권_인터랙티브_학습스튜디오.html"


def safe_inline_js(code: str) -> str:
    """Prevent premature </script> termination inside inline scripts."""
    return code.replace("</script", "<\\/script")


def main():
    css = (SRC_DIR / "styles.css").read_text(encoding="utf-8")
    bundle_js = safe_inline_js((SRC_DIR / "data" / "vol1_bundle.js").read_text(encoding="utf-8"))
    store_js = safe_inline_js((SRC_DIR / "store.js").read_text(encoding="utf-8"))
    parser_js = safe_inline_js((SRC_DIR / "gemini_parser.js").read_text(encoding="utf-8"))
    diagrams_js = safe_inline_js((SRC_DIR / "diagrams.js").read_text(encoding="utf-8"))
    scrolly_js = safe_inline_js((SRC_DIR / "scrollytelling.js").read_text(encoding="utf-8"))
    app_js = safe_inline_js((SRC_DIR / "app.js").read_text(encoding="utf-8"))
    sample_txt = SAMPLE_TXT.read_text(encoding="utf-8")
    sample_js = safe_inline_js("window.__SAMPLE_GEMINI_TXT__ = " + json.dumps(sample_txt, ensure_ascii=False) + ";")

    html_doc = f"""<!DOCTYPE html>
<!-- __ARTIFACT_STAMP_V1__ -->
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="robots" content="noindex, nofollow">
  <title>학교상담과 생활지도 (상권) · 인터랙티브 학습 스튜디오</title>
  <style>
{css}
  </style>
</head>
<body>
  <svg width="0" height="0" style="position:absolute;left:0;top:0;overflow:hidden;pointer-events:none" aria-hidden="true">
    <defs>
      <filter id="liquid-bevel-lens" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
        <feImage id="sdf-bevel-feimage" href="" result="bevelMap" preserveAspectRatio="none" />
        <feDisplacementMap in="SourceGraphic" in2="bevelMap" scale="8" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
  <div class="scroll-progress" aria-hidden="true"></div>

  <header class="global-header">
    <div class="header-inner">
      <button type="button" class="brand-btn" id="brand-home-btn" title="상권 진도표 대시보드로 이동">
        <span class="brand-dot" aria-hidden="true"></span>
        <span class="brand-title">학교상담과 생활지도 <small class="brand-sub">상권 (01~06장)</small></span>
      </button>

      <nav class="chapter-nav" id="chapter-nav" aria-label="장 바로가기"></nav>

      <div class="header-actions">
        <span class="save-badge" id="autosave-badge">● 자동 저장 켜짐</span>
        <button type="button" class="btn btn-sm" id="open-gemini-btn"><span aria-hidden="true">＋</span><span>문제팩</span></button>
        <button type="button" class="btn btn-sm" id="open-progress-btn"><span>진도·백업</span></button>
        <button type="button" class="btn btn-sm theme-btn" id="theme-toggle-btn" aria-label="테마 전환">
          <span id="theme-icon" aria-hidden="true">🌙</span><span class="theme-btn-label" id="theme-label">다크 모드</span>
        </button>
      </div>
    </div>
  </header>

  <div class="chapter-subbar" id="chapter-subbar" hidden></div>

  <main class="main-shell" id="app-root"></main>
  <div id="apple-section-pill" class="liquid-pill" hidden></div>

  <dialog class="study-dialog" id="gemini-dialog" aria-labelledby="gemini-dlg-title">
    <div class="dialog-head">
      <h2 id="gemini-dlg-title">제미나이(Gemini) 문제팩 스튜디오 (.txt / 회차 전환)</h2>
      <form method="dialog">
        <button type="submit" class="btn btn-sm">닫기 ✕</button>
      </form>
    </div>
    <div class="dialog-body" id="gemini-dialog-body"></div>
  </dialog>

  <dialog class="study-dialog" id="progress-dialog" aria-labelledby="progress-dlg-title">
    <div class="dialog-head">
      <h2 id="progress-dlg-title">상권 38개 절 상세 진도표 & 학습 기록 백업</h2>
      <form method="dialog">
        <button type="submit" class="btn btn-sm">닫기 ✕</button>
      </form>
    </div>
    <div class="dialog-body" id="progress-dialog-body"></div>
  </dialog>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
  <script>
{bundle_js}
  </script>
  <script>
{sample_js}
  </script>
  <script>
{store_js}
  </script>
  <script>
{parser_js}
  </script>
  <script>
{diagrams_js}
  </script>
  <script>
{scrolly_js}
  </script>
  <script>
{app_js}
  </script>
</body>
</html>
"""
    PAGES_INDEX_HTML.write_text(html_doc, encoding="utf-8")
    size_mb = PAGES_INDEX_HTML.stat().st_size / (1024 * 1024)
    print(f"[OK] Built GitHub Pages index -> {PAGES_INDEX_HTML} ({size_mb:.2f} MB)")

    if (ROOT_DIR / "05_기존마스터원고").exists() or OUT_HTML.exists():
        OUT_HTML.write_text(html_doc, encoding="utf-8")
        print(f"[OK] Built standalone HTML bundle -> {OUT_HTML} ({size_mb:.2f} MB)")

    artifact_env = os.environ.get("ARTIFACT_HTML_PATH")
    if artifact_env:
        artifact_path = Path(artifact_env)
        artifact_path.parent.mkdir(parents=True, exist_ok=True)
        artifact_path.write_text(html_doc, encoding="utf-8")
        print(f"[OK] Synced Antigravity side-pane artifact -> {artifact_path} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
