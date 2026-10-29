#!/usr/bin/env python3
"""Build the Takashima excerpts the public pages show: src/generated/excerpts.json.

Only the opening of each page's commentary is published (the full translation is the edition).
English and Japanese come from translations/vol1/ when a page has been translated and checked;
otherwise only the Chinese original is shown. The output is git-ignored, like translations/.

    python3 service/scripts/gen_excerpts.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "translations"))
try:
    import check  # translations/ is private; without it only the Chinese originals are published
except ImportError:
    check = None
SRC = json.loads((ROOT / "skills/zhouyi-lookup/scripts/zhouyi/takashima.json").read_text(encoding="utf-8"))


def as_list(x):
    return x if isinstance(x, list) else ([x] if x else [])


def source_pages(n):
    v = SRC[str(n)]
    pages = {"judgment": v["judgment"], **{str(i): p for i, p in enumerate(v["lines"])}}
    if "yong" in v:
        pages["yong"] = v["yong"]
    return pages

OUT = ROOT / "service/src/generated/excerpts.json"
LIMIT = {"zh": 420, "en": 900, "ja": 520}   # characters, roughly the same amount of text
ENDS = {"zh": "。！？」", "en": ".!?”", "ja": "。！？」"}


def excerpt(paras, lang):
    """The first paragraphs up to LIMIT, cut at a sentence end."""
    out, total = [], 0
    for p in paras:
        if total >= LIMIT[lang]:
            break
        room = LIMIT[lang] - total
        if out and len(p) > room:
            break                      # never end on a stub: stop before a paragraph that won't fit
        if len(p) > room:
            cut = max(p.rfind(e, 0, room) for e in ENDS[lang])
            p = (p[:cut + 1] if cut > room // 3 else p[:room]) + "…"
        out.append(p)
        total += len(p)
    return out


def translated(n):
    f = ROOT / f"translations/vol1/{n:02d}.json"
    if check is None or not f.exists():
        return {}
    doc = json.loads(f.read_text(encoding="utf-8"))
    src = check.source_pages(n)
    ok = {}
    for key, page in doc["pages"].items():
        if key in src and not check.check_page(n, key, src[key], page):
            ok[key] = page
    return ok


result = {}
pages_done = 0
for n in range(1, 65):
    tr = translated(n)
    pages_done += len(tr)
    result[str(n)] = {}
    for key, p in source_pages(n).items():
        e = {"zh": excerpt(as_list(p["commentary"]), "zh")}
        for lang in ("en", "ja"):
            if key in tr:
                e[lang] = excerpt(tr[key][lang]["commentary"], lang)
        result[str(n)][key] = e
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(result, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"wrote {OUT.relative_to(ROOT)} ({pages_done} translated pages)")
