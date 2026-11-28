#!/usr/bin/env python3
"""Generate service/src/engine/s2t.json from OpenCC tables + curated Zhouyi overrides.

Run from the repo root:
    python3 service/scripts/gen_s2t.py [--chars PATH] [--phrases PATH] [--check]
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "service/src/engine/s2t.json"
DEFAULT_CHARS = "/tmp/oc/STCharacters.txt"
DEFAULT_PHRASES = "/tmp/oc/STPhrases.txt"

# STPhrases maps V+于 -> V於 (e.g. 于野->於野, 困于->困於). Classical 经文 keeps
# 于 (gold/Wikisource has no 於 at all), so drop every 于/於 rule except these
# clearly-modern prepositions, which need 於 in Traditional Chinese.
YU_MODERN = {
    "于是", "对于", "关于", "由于", "在于", "属于", "位于", "等于", "高于", "低于",
    "多于", "少于", "大于", "小于", "过于", "终于", "用于", "出于", "归于", "处于",
    "善于", "敢于", "忠于", "勇于", "基于", "便于", "限于", "易于", "难于", "羞于",
    "近于", "忙于", "优于", "重于", "轻于", "急于", "富于", "长于", "短于", "强于",
    "弱于", "适于", "鉴于", "甘于", "苦于", "乐于", "惯于", "居于", "有利于", "不利于",
    "以至于", "不同于", "取决于", "表现为", "无利于",
}

# Curated override table (human-reviewed against Wikisource 周易 & corpus)
OVERRIDE = {
    # Classical 经文 keeps its own form (confirmed vs Wikisource 周易)
    "无": "无",   # 無 (always classical 无 in this corpus; modern compounds covered by STPhrases)
    "于": "于",   # 於 (classical preposition; modern prepositions covered by YU_MODERN)
    "凶": "凶",   # 兇 (吉凶 keeps 凶)
    "征": "征",   # 徵 (war/journey keeps 征; 特征/征服 covered by STPhrases)
    "咸": "咸",   # 鹹 (hexagram 31 keeps 咸)
    "斗": "斗",   # 鬥 (日中见斗/北斗 keep 斗; 争斗/战斗 covered by STPhrases)
    "余": "余",   # 餘 (first-person 余曰 keeps 余; 有余/十余/其余 covered by STPhrases)
    "丑": "丑",   # 醜 (地支 & 群丑 keep 丑; modern 醜 compounds covered below)
    "谷": "谷",   # 穀 (幽谷/井谷 keep 谷; 五谷/年谷 covered by STPhrases)
    "遁": "遯",   # gold hexagram 33 name
    "尸": "尸",   # classical 輿尸 / 尸位 / 載尸 (modern 尸体->屍體 still via STPhrases)

    # classical 系 -> 係 (隨/坎/遯 lines); modern 系统/关系/系辞 handled by STPhrases
    "系": "係",
    "系于": "係于",
    "系之": "係之",
    "拘系": "拘係",
    "于干": "于干",

    # phrase-level fixes (gold form differs from OpenCC first candidate)
    "发蒙": "發蒙",
    "反复": "反復",
    "考祥": "考詳",
    "己日": "已日",
    "干胏": "乾胏",
    "腊肉": "腊肉",
    "奔其机": "奔其机",
    "闲有家": "閑有家",
    "闲舆": "閑輿",
    "见沫": "見沬",
    "耕获": "耕獲",
    "菑畲": "菑畬",
    "众": "眾",
    "占": "占",
    "咨": "咨",
    "畲": "畬",
    "汇": "彙",

    # 丑 => 醜 only in these modern/classical-醜 contexts
    "可丑": "可醜",
    "恶丑": "惡醜",
    "丑者": "醜者",
    "丑矣": "醜矣",
    "丑体": "醜體",
    "愧丑": "愧醜",
    "丑也": "醜也",
    "丑有": "醜有",
    "丑不": "醜不",
    "匪其丑": "匪其醜",
    "群丑": "群丑",
    "丑类": "丑類",
    "丑为牛": "丑為牛",

    # remaining gold-specific & Japanese-kanji fixes
    "几几乎": "幾幾乎",
    "合作伙伴": "合作夥伴",
    "或系之牛": "或係之牛",
    "未占有": "未占有",
    "群": "群",
    "瓮": "瓮",
    "祗": "祇",
    "増補高島易断": "增補高島易斷",
    "増補": "增補",
}

CJK = re.compile(r"[\u4e00-\u9fff]+")


def load_opencc(path: str) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 2:
                continue
            vals = parts[1].split()
            if vals:
                out[parts[0]] = vals
    return out


def corpus_text() -> str:
    paths = [
        ROOT / "skills/zhouyi-lookup/scripts/zhouyi/hexagrams.json",
        ROOT / "skills/zhouyi-lookup/scripts/zhouyi/lines.json",
        ROOT / "skills/zhouyi-lookup/scripts/zhouyi/plain.json",
        ROOT / "skills/zhouyi-lookup/scripts/zhouyi/takashima.json",
        ROOT / "skills/zhouyi-lookup/scripts/zhouyi/jing_trad.json",
        ROOT / "service/src/engine/tables.json",
        ROOT / "service/public/app.js",
        *sorted((ROOT / "service/src").glob("*.ts")),
        *sorted((ROOT / "service/src/engine").glob("*.ts")),
    ]
    return "\n".join(p.read_text(encoding="utf-8") for p in paths if p.exists())


def build_table(chars_path: str, phrases_path: str) -> dict:
    ch_raw = load_opencc(chars_path)
    ph_raw = load_opencc(phrases_path)

    ch = {k: v[0] for k, v in ch_raw.items() if v[0] != k}

    ph_filtered: dict[str, str] = {}
    for k, v in ph_raw.items():
        if "于" in k and any("於" in x for x in v) and k not in YU_MODERN:
            continue
        ph_filtered[k] = v[0]

    max_raw = max(len(k) for k in ph_filtered)
    blob = corpus_text()
    seen_phrases: set[str] = set()
    for m in CJK.finditer(blob):
        run = m.group(0)
        n = len(run)
        for i in range(n):
            for L in range(2, min(max_raw, n - i) + 1):
                sub = run[i : i + L]
                if sub in ph_filtered:
                    seen_phrases.add(sub)
    for k in YU_MODERN:
        if k in ph_filtered:
            seen_phrases.add(k)

    ph = {k: ph_filtered[k] for k in sorted(seen_phrases)}
    max_len = max(*(len(k) for k in ph), *(len(k) for k in OVERRIDE))

    return {
        "_meta": {
            "note": "Generated by service/scripts/gen_s2t.py. Do not edit by hand.",
            "source": "BYVoid/OpenCC (STCharacters.txt, STPhrases.txt), Apache License 2.0, with curated classical Zhouyi overrides.",
            "license": "Apache-2.0",
        },
        "maxLen": max_len,
        "ch": ch,
        "ph": ph,
        "ov": OVERRIDE,
    }


def make_converter(tbl: dict):
    ch = tbl["ch"]
    ph = tbl["ph"]
    ov = tbl["ov"]
    max_len = tbl["maxLen"]

    def convert_run(run: str) -> str:
        out: list[str] = []
        i = 0
        n = len(run)
        while i < n:
            hit = None
            for L in range(min(max_len, n - i), 1, -1):
                sub = run[i : i + L]
                if sub in ov:
                    hit = ov[sub]
                    i += L
                    break
                if sub in ph:
                    hit = ph[sub]
                    i += L
                    break
            if hit is None:
                c = run[i]
                hit = ov.get(c, ch.get(c, c))
                i += 1
            out.append(hit)
        return "".join(out)

    return lambda s: CJK.sub(lambda m: convert_run(m.group(0)), s).replace("爲", "為")


def verify_gold(tbl: dict) -> None:
    to_hant = make_converter(tbl)
    hexs = json.loads((ROOT / "skills/zhouyi-lookup/scripts/zhouyi/hexagrams.json").read_text(encoding="utf-8"))["hexagrams"]
    trad = json.loads((ROOT / "skills/zhouyi-lookup/scripts/zhouyi/jing_trad.json").read_text(encoding="utf-8"))

    fixpoint_bad = []
    simp_bad = []
    gold_total = 0
    simp_total = 0
    for h in hexs:
        n = str(h["number"])
        t = trad[n]
        pairs = [("judgment", h["judgment"], t["judgment"])] + [
            (f"line-{i}", sl, tl) for i, (sl, tl) in enumerate(zip(h["lines"], t["lines"]))
        ]
        for kind, s, g in pairs:
            simp_total += 1
            gold_total += 1
            if to_hant(g) != g:
                fixpoint_bad.append((n, kind, g, to_hant(g)))
            if to_hant(s) != g:
                simp_bad.append((n, kind, to_hant(s), g))
        if "yong" in t:
            gold_total += 1
            if to_hant(t["yong"]) != t["yong"]:
                fixpoint_bad.append((n, "yong", t["yong"], to_hant(t["yong"])))

    if fixpoint_bad:
        sys.exit(f"gold fixpoint failed on {len(fixpoint_bad)}/{gold_total}: {fixpoint_bad[:5]}")
    print(f"gold fixpoint: {gold_total}/{gold_total}; simp->gold: {simp_total - len(simp_bad)}/{simp_total}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--chars", default=DEFAULT_CHARS)
    ap.add_argument("--phrases", default=DEFAULT_PHRASES)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    tbl = build_table(args.chars, args.phrases)
    verify_gold(tbl)
    text = json.dumps(tbl, ensure_ascii=False, separators=(",", ":")) + "\n"
    if args.check:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            sys.exit(f"{OUT} is out of date; run python3 service/scripts/gen_s2t.py")
        print("s2t.json OK")
    else:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(text, encoding="utf-8")
        print(f"wrote {OUT.relative_to(ROOT)} ({len(text.encode('utf-8')):,} bytes, ch={len(tbl['ch'])}, ph={len(tbl['ph'])}, ov={len(tbl['ov'])})")


if __name__ == "__main__":
    main()
