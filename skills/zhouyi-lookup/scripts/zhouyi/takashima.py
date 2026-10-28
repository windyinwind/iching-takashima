"""高島呑象《増補高島易断》逐卦逐爻原文检索。

数据为王治本汉译本，按卦辞、六爻（乾坤另有用九、用六）分页，每页含：
  - heading       经文
  - commentary    高島义理阐发
  - zhan_general  占断总论
  - zhan          分事占断（问家宅、问营商……）
  - cases         占例实录

本模块原样引用高島之辞，不加推断。默认略去两类内容：
  - 健康与生育：占断「问疾病」「问六甲」等，以及涉及疾病、分娩的占例
  - 战事：涉及明治时期对外战争的占例
传 include_sensitive=True 可取全文。
"""

import json
from functools import lru_cache
from typing import Dict, Optional

from .hexagrams import data_file, get_by_number, line_label, normalize_position

DATA_PATH = data_file("takashima.json")

# 默认略去的分事占断
SENSITIVE_TOPICS = {"六甲", "疾病", "生产", "产生"}
# 默认略去的占例标签
SENSITIVE_TAGS = {"war", "health"}

_YONG_ALIASES = {"用", "用九", "用六", "yong"}


@lru_cache(maxsize=1)
def _load() -> Dict:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def meta() -> Dict:
    return _load()["_meta"]


def _is_yang(number: int, position: int) -> bool:
    from .trigrams import TRIGRAMS
    h = get_by_number(number)
    lines = TRIGRAMS[h["lower"]] + TRIGRAMS[h["upper"]]
    return lines[position] == 1


def _cast_label(case: Dict) -> Optional[str]:
    if not case.get("ben"):
        return None
    ben = get_by_number(case["ben"])["name"]
    if not case.get("zhi"):
        return ben
    return ben + "之" + get_by_number(case["zhi"])["name"]


def _page(number: int, position):
    """返回 (页数据, 页名)。position: None 为卦辞，「用九」等为用爻，其余为爻位。"""
    entry = _load()[str(number)]
    h = get_by_number(number)
    if position is None:
        return entry["judgment"], "卦辞"
    if isinstance(position, str) and position.strip() in _YONG_ALIASES:
        if "yong" not in entry:
            raise ValueError(f"{h['name']}卦无用九、用六")
        return entry["yong"], h["yong"]["label"]
    p = normalize_position(position)
    return entry["lines"][p], line_label(p, _is_yang(number, p))


def commentary(number: int, position=None, include_sensitive: bool = False) -> Dict:
    """高島对某卦（position=None）或某爻的原文。

    position 同 read：爻题名最稳妥，数字 0-5（0=初爻），6 亦指上爻；
    另接受「用九」「用六」。
    """
    h = get_by_number(number)
    page, part = _page(number, position)

    zhan = page["zhan"]
    cases = page["cases"]
    if not include_sensitive:
        zhan = [z for z in zhan if z["topic"] not in SENSITIVE_TOPICS]
        cases = [c for c in cases if not SENSITIVE_TAGS & set(c["tags"])]

    out_cases = []
    for c in cases:
        item = {"cast": _cast_label(c), "text": c["text"], "tags": c["tags"]}
        if c.get("moving") is not None and c.get("ben"):
            item["moving"] = line_label(c["moving"], _is_yang(c["ben"], c["moving"]))
        out_cases.append(item)

    m = meta()
    return {
        "hexagram": {"number": number, "name": h["name"]},
        "part": part,
        "heading": page.get("heading"),
        "commentary": page["commentary"],
        "zhan_general": page["zhan_general"],
        "zhan": zhan,
        "cases": out_cases,
        "omitted": {
            "zhan": len(page["zhan"]) - len(zhan),
            "cases": len(page["cases"]) - len(cases),
        },
        "source": {
            "work": m["work"],
            "author": m["author"],
            "translator": m["translator"],
            "location": f"{h['name']}卦·{part}",
        },
        "note": (
            "以上为高島呑象原书之辞（王治本汉译），系明治时期的占断与实录，"
            "照录原文，不代表对当下任何具体事项的判断。"
        ),
    }
