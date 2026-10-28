"""八卦基础数据。

以三画卦自下而上表示为 tuple，1 为阳（—），0 为阴（--）。
下标 0 = 初爻（最下），1 = 中爻，2 = 上爻（最上）。
"""

from typing import Dict, Tuple

# name -> (bottom, middle, top)
TRIGRAMS: Dict[str, Tuple[int, int, int]] = {
    "乾": (1, 1, 1),
    "兑": (1, 1, 0),
    "离": (1, 0, 1),
    "震": (1, 0, 0),
    "巽": (0, 1, 1),
    "坎": (0, 1, 0),
    "艮": (0, 0, 1),
    "坤": (0, 0, 0),
}

# 卦名 -> 卦画符号
SYMBOLS: Dict[str, str] = {
    "乾": "☰",
    "兑": "☱",
    "离": "☲",
    "震": "☳",
    "巽": "☴",
    "坎": "☵",
    "艮": "☶",
    "坤": "☷",
}

# 自然象（用于义理阐发，非占断）
NATURE: Dict[str, str] = {
    "乾": "天",
    "兑": "泽",
    "离": "火",
    "震": "雷",
    "巽": "风",
    "坎": "水",
    "艮": "山",
    "坤": "地",
}

# 五行
ELEMENTS: Dict[str, str] = {
    "乾": "金",
    "兑": "金",
    "离": "火",
    "震": "木",
    "巽": "木",
    "坎": "水",
    "艮": "土",
    "坤": "土",
}

# 方位
DIRECTIONS: Dict[str, str] = {
    "乾": "西北",
    "兑": "正西",
    "离": "正南",
    "震": "正东",
    "巽": "东南",
    "坎": "正北",
    "艮": "东北",
    "坤": "西南",
}

# 家人象（用于义理阐发）
FAMILY: Dict[str, str] = {
    "乾": "父",
    "兑": "少女",
    "离": "中女",
    "震": "长男",
    "巽": "长女",
    "坎": "中男",
    "艮": "少男",
    "坤": "母",
}

# 动物象
CREATURES: Dict[str, str] = {
    "乾": "马",
    "兑": "羊",
    "离": "雉",
    "震": "龙",
    "巽": "鸡",
    "坎": "豕",
    "艮": "狗",
    "坤": "牛",
}

# 方位/时序，用于时间起卦时的月将、方位判断
def trigram_to_number(t: str) -> int:
    """先天八卦数：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8。"""
    order = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]
    return order.index(t) + 1


def build_trigram(bottom: int, middle: int, top: int) -> str:
    """由三爻的阴阳反查三画卦名。"""
    target = (bottom, middle, top)
    for name, value in TRIGRAMS.items():
        if value == target:
            return name
    raise ValueError(f"invalid trigram: {target}")


def lines_to_hexagram(lines: Tuple[int, ...]):
    """由六爻（自下而上）求上下卦名。"""
    if len(lines) != 6:
        raise ValueError("hexagram requires exactly 6 lines")
    lower = build_trigram(lines[0], lines[1], lines[2])
    upper = build_trigram(lines[3], lines[4], lines[5])
    return lower, upper
