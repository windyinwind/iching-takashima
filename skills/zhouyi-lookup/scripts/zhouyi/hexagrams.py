"""六十四卦数据加载与检索。"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple

def data_file(name: str) -> Path:
    """定位随包数据文件。

    数据曾放在 zhouyi/data/ 下，但技能包只允许两级目录
    （根目录/二级目录/文件），scripts/zhouyi/data/*.json 已超层，
    上传被平台以「目录层级超限」打回。故数据上移到 zhouyi/ 直接存放。
    这里保留对旧布局的兼容，免得已分发出去的旧副本一升级就崩。
    """
    here = Path(__file__).parent
    flat = here / name
    if flat.exists():
        return flat
    legacy = here / "data" / name
    if legacy.exists():
        return legacy
    return flat


DATA_PATH = data_file("hexagrams.json")

# 爻位名，自下而上
LINE_NAMES = ["初", "二", "三", "四", "五", "上"]

# 爻位归一映射。
# 程序内部与对外整数都用 0-5（0=初爻 … 5=上爻），6 另作上爻别名；
# 亦接受爻题名（初/二/三/四/五/上、初九/九二…、初六/六二…）。
# 注意 1 是二爻而非初爻：对外转述时优先用爻题名，避免差一位。
_POSITION_ALIASES = {
    "初": 0, "二": 1, "三": 2, "四": 3, "五": 4, "上": 5,
    "初九": 0, "九二": 1, "九三": 2, "九四": 3, "九五": 4, "上九": 5,
    "初六": 0, "六二": 1, "六三": 2, "六四": 3, "六五": 4, "上六": 5,
    "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 5,
}


@lru_cache(maxsize=1)
def _load() -> List[dict]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["hexagrams"]


@lru_cache(maxsize=1)
def _by_number() -> Dict[int, dict]:
    return {h["number"]: h for h in _load()}


@lru_cache(maxsize=1)
def _by_pair() -> Dict[Tuple[str, str], dict]:
    """(lower, upper) -> hexagram。"""
    return {(h["lower"], h["upper"]): h for h in _load()}


@lru_cache(maxsize=1)
def _by_name() -> Dict[str, dict]:
    return {h["name"]: h for h in _load()}


@lru_cache(maxsize=1)
def all_hexagrams() -> List[dict]:
    return list(_load())


def get_by_number(number: int) -> dict:
    h = _by_number().get(number)
    if h is None:
        raise KeyError(f"hexagram {number} not found (valid range 1-64)")
    return h


def get_by_name(name: str) -> dict:
    h = _by_name().get(name)
    if h is None:
        raise KeyError(f"hexagram {name} not found")
    return h


def get_by_lines(lines: Tuple[int, ...]) -> dict:
    """由六爻阴阳反查卦序。lines 自下而上，1 为阳。"""
    from .trigrams import build_trigram

    if len(lines) != 6:
        raise ValueError("hexagram requires exactly 6 lines")
    if any(l not in (0, 1) for l in lines):
        raise ValueError("each line must be 0 (yin) or 1 (yang)")
    lower = build_trigram(lines[0], lines[1], lines[2])
    upper = build_trigram(lines[3], lines[4], lines[5])
    h = _by_pair().get((lower, upper))
    if h is None:
        raise KeyError(f"hexagram not found for lower={lower} upper={upper}")
    return h


def get_line_text(number: int, position) -> str:
    """position: 0=初爻 … 5=上爻；亦接受 6（上爻）或爻题名。

    例如 6 / "6" / "上" / "上九" / "上六" 均指向最上一爻。
    """
    position = normalize_position(position)
    h = get_by_number(number)
    return h["lines"][position]


def normalize_position(pos) -> int:
    """爻位归一：统一映射为 0-5（0=初爻 … 5=上爻）。

    接受：
      - 程序下标 0-5（0=初爻 … 5=上爻）
      - 6 作为「上爻」的别名（与人类数到第六爻的直觉一致）
      - 爻题名：初/二/三/四/五/上，或 初九/九二/六三/六五/上九…
    非法输入抛 ValueError。
    """
    if isinstance(pos, bool):
        raise ValueError("line position must be an int or string, not bool")
    if isinstance(pos, str):
        key = pos.strip()
        if key in _POSITION_ALIASES:
            return _POSITION_ALIASES[key]
        try:
            p = int(key)
        except ValueError:
            raise ValueError(
                f"invalid line position {pos!r}; "
                "use 0-5 (0=初爻, 5=上爻), 6 (上爻 alias), or a line name "
                "(初/二/三/四/五/上, 初九/九二…, 初六/六二…)"
            )
    else:
        p = int(pos)
    # 整数约定：0=初爻 … 5=上爻；6 作为「上爻」别名亦接受。
    if p == 0:
        return 0
    if 1 <= p <= 5:
        return p
    if p == 6:
        return 5
    raise ValueError(
        f"line position must be 0-5 (0=初爻, 5=上爻) or 6 (上爻 alias), got {pos!r}"
    )


def line_label(position: int, is_yang: bool) -> str:
    """爻位名，如「初九」「六三」「上九」。

    传统爻题格式：初爻与上爻置前（初九、上九），
    二三四五爻置前数字、后置阴阳（九二、六三）。
    """
    if not 0 <= position <= 5:
        raise ValueError("line position must be 0-5")
    prefix = "九" if is_yang else "六"
    if position == 0:
        return "初" + prefix
    if position == 5:
        return "上" + prefix
    return prefix + LINE_NAMES[position]


def changed_lines(lines: Tuple[int, ...], moving: int) -> Tuple[int, ...]:
    """求变卦之爻。moving 为动爻下标 0-5。"""
    if not 0 <= moving <= 5:
        raise ValueError("moving line must be 0-5")
    out = list(lines)
    out[moving] = 1 - out[moving]
    return tuple(out)
