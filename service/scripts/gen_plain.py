#!/usr/bin/env python3
"""生成 human-readable 人话版数据 plain.json，并同步到 Pro 引擎源目录。

数据结构：
  {
    "_meta": {...},
    "hexagrams": { "1": {"zh":..., "en":..., "ja":...}, ... },   # 64 卦，一卦一句
    "lines": { "1-0": {"zh":..., "en":..., "ja":...}, ... }      # 384 爻，"卦号-爻序(0..5)"
  }

写作准则（务必遵守）：
  1. 人话 = 把「取象/义理」的文言注释体，改写成现代口语。不是新编，是转写。
  2. 忠实原义：x（结构分析）和 l（修身处事）说了什么就说什么，不夸大、不引申。
  3. 不作占断、不预测、不按事项给吉凶结论。断语字只是解释字义。
  4. 三语各自成文，含义对齐，不做字面机翻。

运行（仓库根）：
  python3 service/scripts/gen_plain.py            # 生成并同步到 Pro
  python3 service/scripts/gen_plain.py --check     # 校验现有 plain.json 是否齐全、可解析
"""
import json
import re
import copy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
OUT = ROOT / "skills/zhouyi-lookup/scripts/zhouyi/plain.json"
sys.path.insert(0, str(SCRIPT_DIR))
import plain_data  # noqa: E402
import plain_zh_v2  # noqa: E402  v2 精修覆盖：仍是注释腔的条目重写成真白话
import plain_en_v2  # noqa: E402  对应条目的英文人话
import plain_ja_v2  # noqa: E402  对应条目的日文人话
PRO_ENGINE = Path.home() / (
    "WorkBuddy/MakeMoney On WB/zhouyi-api/workbuddy-engine/plain.json"
)

META = {
    "title": "周易 人话版解读",
    "layer": "L3.5 现代白话转写",
    "provenance": "据本工具「取象/义理」层（公版注疏撰述）改写为现代白话，"
                  "忠实原义，不作占断、不按事项给吉凶；三语各自成文。",
    "coverage": "64 卦 + 384 爻 × zh/en/ja",
    "keys": {"hexagrams": "卦号→三语一句", "lines": "卦号-爻序(0..5)→三语一段"},
    "version": plain_data.VERSION,
}


def build() -> dict:
    hexagrams = copy.deepcopy(plain_data.HEXAGRAMS)
    lines = copy.deepcopy(plain_data.LINES)
    # v2 精修：覆盖三语，保留未被覆盖的 en/ja 原文
    for key, zh in plain_zh_v2.ZH.items():
        if key.isdigit():
            target = hexagrams.get(key)
        else:
            target = lines.get(key)
        if target is None:
            raise SystemExit(f"v2 覆盖的 key 不存在: {key}")
        target["zh"] = zh
        if key in plain_en_v2.EN:
            target["en"] = plain_en_v2.EN[key]
        if key in plain_ja_v2.JA:
            target["ja"] = plain_ja_v2.JA[key]
    return {
        "_meta": META,
        "hexagrams": hexagrams,
        "lines": lines,
    }


def validate(d: dict) -> list:
    errs = []
    hexes = d["hexagrams"]
    lines = d["lines"]
    if len(hexes) != 64:
        errs.append(f"hexagrams 应为 64，实际 {len(hexes)}")
    if len(lines) != 384:
        errs.append(f"lines 应为 384，实际 {len(lines)}")
    for group, name in ((hexes, "hexagram"), (lines, "line")):
        for key, val in group.items():
            for lang in ("zh", "en", "ja"):
                if lang not in val or not isinstance(val[lang], str) or not val[lang].strip():
                    errs.append(f"{name}[{key}] 缺 {lang}")
                    continue
                # 中文/日文正文里不应混入英文单词（常见的手写笔误）
                if lang in ("zh", "ja"):
                    bad = re.findall(r"[A-Za-z]{2,}", val[lang])
                    if bad:
                        errs.append(f"{name}[{key}].{lang} 混入拉丁词 {bad}")
    return errs


def main() -> None:
    d = build()
    errs = validate(d)
    if errs:
        print("校验失败：")
        for e in errs[:30]:
            print("  -", e)
        if len(errs) > 30:
            print(f"  ... 另 {len(errs) - 30} 条")
        sys.exit(1)
    text = json.dumps(d, ensure_ascii=False, indent=1) + "\n"
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            sys.exit("plain.json 缺失或过期，运行 python3 service/scripts/gen_plain.py")
        print(f"plain.json OK ({len(d['hexagrams'])} 卦 / {len(d['lines'])} 爻)")
        return
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")
    if PRO_ENGINE.parent.exists():
        PRO_ENGINE.write_text(text, encoding="utf-8")
        print(f"synced {PRO_ENGINE}")
    else:
        print(f"WARN: Pro 引擎目录不存在，未同步: {PRO_ENGINE}")


if __name__ == "__main__":
    main()
