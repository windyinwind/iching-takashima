"""起卦引擎。三种输入全部为确定性运算，同一输入必得同一结果。

设计原则：接口不接收自由文本问题。所占何事完全在用户自己心里，
系统只见卦象不见所问之事。这是本设计的合规基础。

输出仅包含：卦象结构、卦爻辞、训诂、义理、出处。
不输出吉凶预测、应验判断或任何占断结论。

起卦法与依据
------------
- 略筮法（三变筮）：《増補高島易断》筮儀所载、高島呑象常用之法。
- 大衍筮法（十八变）：《周易·系辞上》「大衍之数五十，其用四十有九」，
  朱熹《周易本义·筮仪》复原之揲蓍法。
- 数字起卦、时间起卦：邵雍《梅花易数》报数起卦与年月日时起卦。
"""

import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Sequence, Tuple

from . import calendar as cal
from .hexagrams import get_by_lines, line_label
from .trigrams import SYMBOLS, TRIGRAMS

# 先天八卦数：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
TRIGRAM_ORDER = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]

# 六爻结果：老阴 6 / 少阳 7 / 少阴 8 / 老阳 9
OLD_YIN = 6
YOUNG_YANG = 7
YOUNG_YIN = 8
OLD_YANG = 9

# 爻值 → 阴阳。老阴 6 与少阴 8 为阴，少阳 7 与老阳 9 为阳。
LINE_FROM_VALUE = {OLD_YIN: 0, YOUNG_YIN: 0, YOUNG_YANG: 1, OLD_YANG: 1}

# 爻值的传统名称，供前端展示
VALUE_NAMES = {
    OLD_YIN: "老阴（交）",
    YOUNG_YANG: "少阳（单）",
    YOUNG_YIN: "少阴（拆）",
    OLD_YANG: "老阳（重）",
}

# 筮竹：大衍之数五十，去一象太极，其用四十有九
STALKS_TOTAL = 50
STALKS_USED = 49

# 「shaoban」是旧版对略筮法的误称，保留为别名以免旧调用报错
VARIANT_ALIASES = {"shaoban": "lueshi"}


# ---------------------------------------------------------------------------
# 底层
# ---------------------------------------------------------------------------

def _num_to_trigram(n: int) -> str:
    """先天数 1-8 映射到三画卦名；按除八取余用时，余 0 作 8（坤）。"""
    n = n % 8
    if n == 0:
        n = 8
    return TRIGRAM_ORDER[n - 1]


def _moving_index(n: int) -> int:
    """除六取余定动爻：余 1 为初爻 … 余 0 作 6 为上爻。返回下标 0-5。"""
    r = n % 6
    return (r if r else 6) - 1


def _compose(lower: str, upper: str) -> Tuple[int, ...]:
    """由上下卦名合成自下而上的六爻。"""
    return TRIGRAMS[lower] + TRIGRAMS[upper]


def _one_moving_values(lines: Sequence[int], moving_idx: int) -> List[int]:
    """恒一动爻之法的爻值：静爻为少（7/8），动爻为老（阳 9、阴 6）。"""
    values = [YOUNG_YANG if l == 1 else YOUNG_YIN for l in lines]
    values[moving_idx] = OLD_YANG if lines[moving_idx] == 1 else OLD_YIN
    return values


def _stream(seed_material: str, n: int) -> List[int]:
    """由种子材料生成确定性整数流（SHA-256 链式摘要，跨平台一致）。"""
    out = []
    counter = 0
    while len(out) < n:
        digest = hashlib.sha256(f"{seed_material}#{counter}".encode("utf-8")).digest()
        for i in range(0, len(digest), 2):
            if len(out) >= n:
                break
            out.append((digest[i] << 8) | digest[i + 1])
        counter += 1
    return out


def _split(draw: int, n: int) -> int:
    """「分而为二」：把 n 根分成左右两堆，返回左堆根数（1 … n-1，两堆皆不空）。"""
    return draw % (n - 1) + 1


# ---------------------------------------------------------------------------
# 起卦方法一：略筮法（高島呑象常用）
# ---------------------------------------------------------------------------

def cast_lueshi(seed: Optional[str] = None,
                piles: Optional[Sequence[int]] = None) -> dict:
    """略筮法（三变筮）。《増補高島易断》筮儀：「今吾辈之常用《易》，三变之略筮法最为适当。」

    手续（每变皆同）：
      五十本取一不用以象太极，余四十九本随手分为二；
      右手一堆置案上，自中取一本挟于左手小指（挂一，象人）；
      左手一堆八本八本数之（第三变六本六本数之），余数加小指一本即得数。

      第一变：得数 1-8 按先天数定 内卦（下卦）
      第二变：得数 1-8 按先天数定 外卦（上卦）
      第三变：得数 1-6 定动爻，1 为初爻 … 6 为上爻

    高島先装内卦、后装外卦（「《易》，逆数也」，自下而上）。
    恒得一爻动。

    参数
    ----
    seed
        种子字符串，由摘要流代替手分筮竹，同一 seed 必得同一卦。
    piles
        亲手分筮竹者：三变时左手（天策）的根数，各 1-48。给出时忽略 seed。
    """
    if piles is not None:
        piles = list(piles)
        if len(piles) != 3 or not all(isinstance(p, int) for p in piles):
            raise ValueError("略筮法需三个整数：三变时左手（天策）的根数")
        if not all(1 <= p <= STALKS_USED - 1 for p in piles):
            raise ValueError("每变左手根数须在 1-48 之间（49 本分二，右手至少留一本挂一）")
        source = "piles"
    else:
        if seed is None:
            raise ValueError("略筮法需 seed 或 piles")
        draw = _stream(seed, 3)
        piles = [_split(d, STALKS_USED) for d in draw]
        source = "seed"

    changes = []
    for i, (left, mod) in enumerate(zip(piles, (8, 8, 6))):
        remainder = left % mod
        changes.append({
            "change": i + 1,
            "left": left,
            "right": STALKS_USED - left,
            "divisor": mod,
            "remainder": remainder,
            "number": remainder + 1,  # 余数加小指所挂一本
        })

    lower = TRIGRAM_ORDER[changes[0]["number"] - 1]
    upper = TRIGRAM_ORDER[changes[1]["number"] - 1]
    moving_idx = changes[2]["number"] - 1
    lines = _compose(lower, upper)

    return {
        "lines": lines,
        "values": _one_moving_values(lines, moving_idx),
        "moving": [moving_idx],
        "method": "lueshi",
        "variant": "lueshi",
        "source": source,
        "seed": seed if source == "seed" else None,
        "piles": list(piles),
        "changes": changes,
    }


# ---------------------------------------------------------------------------
# 起卦方法二：大衍筮法（十八变）
# ---------------------------------------------------------------------------

def _dayan_change(n: int, draw: int) -> dict:
    """一变：分二、挂一、揲四、归奇。返回本变明细与余下根数。

    左右各四四揲之，余数 1-4（整除则余 4）。挂一 + 左余 + 右余 即本变所去，
    第一变恒为 5 或 9，第二、三变恒为 4 或 8。
    """
    left = _split(draw, n)
    right = n - left
    hang = 1
    right_after = right - hang
    left_rem = left % 4 or 4
    right_rem = right_after % 4 or 4
    removed = hang + left_rem + right_rem
    return {
        "n": n, "left": left, "right": right,
        "left_rem": left_rem, "right_rem": right_rem,
        "removed": removed, "remaining": n - removed,
    }


def cast_dayan(seed: str, stalks: int = STALKS_TOTAL, variant: str = "dayan") -> dict:
    """大衍筮法。五十本去一，以四十九本三变成一爻，十八变成卦。

    三变后余策必为 36 / 32 / 28 / 24，除四得 9 / 8 / 7 / 6：
    老阳 9、少阴 8、少阳 7、老阴 6。老阴老阳为动爻，故动爻数不定（0-6）。
    各爻值概率：6 为 1/16，7 为 5/16，8 为 7/16，9 为 3/16。

    variant="lueshi"（或旧名 "shaoban"）时改用略筮法，见 cast_lueshi。
    """
    variant = VARIANT_ALIASES.get(variant, variant)
    if variant == "lueshi":
        return cast_lueshi(seed)
    if variant != "dayan":
        raise ValueError("variant must be 'lueshi' or 'dayan'")
    if stalks != STALKS_TOTAL:
        raise ValueError("大衍之数五十：蓍草须为 50 本（其用 49）")

    draw = _stream(seed, 18)
    lines: List[int] = []
    values: List[int] = []
    trace: List[dict] = []
    k = 0
    for pos in range(6):
        n = STALKS_USED
        stages = []
        for _ in range(3):
            st = _dayan_change(n, draw[k])
            k += 1
            stages.append(st)
            n = st["remaining"]
        value = n // 4
        values.append(value)
        lines.append(LINE_FROM_VALUE[value])
        trace.append({"position": pos, "value": value, "remaining": n, "stages": stages})

    return {
        "lines": tuple(lines),
        "values": values,
        "moving": [i for i, v in enumerate(values) if v in (OLD_YIN, OLD_YANG)],
        "method": "dayan",
        "variant": "dayan",
        "seed": seed,
        "stalks": stalks,
        "trace": trace,
    }


# ---------------------------------------------------------------------------
# 起卦方法三：数字起卦（梅花易数）
# ---------------------------------------------------------------------------

def cast_numbers(numbers: List[int]) -> dict:
    """梅花易数报数起卦。

    报两数：上卦 = 数一 除八取余，下卦 = 数二 除八取余，动爻 = 两数之和 除六取余。
    报三数：上下卦同上，动爻 = 三数之和 除六取余。
    余 0 时卦取 8（坤），爻取 6（上爻）。

    仅接受正整数。意图在用户心中，系统不接收问题文本。
    """
    nums = list(numbers)
    if not all(isinstance(n, int) and not isinstance(n, bool) for n in nums):
        raise TypeError("numbers must be integers")
    if not 2 <= len(nums) <= 3:
        raise ValueError("数字起卦需报两个或三个正整数")
    if not all(n > 0 for n in nums):
        raise ValueError("数字起卦只接受正整数")

    upper = _num_to_trigram(nums[0])
    lower = _num_to_trigram(nums[1])
    total = sum(nums)
    moving_idx = _moving_index(total)
    lines = _compose(lower, upper)

    return {
        "lines": lines,
        "values": _one_moving_values(lines, moving_idx),
        "moving": [moving_idx],
        "method": "numbers",
        "numbers": nums,
        "upper_from": nums[0],
        "lower_from": nums[1],
        "moving_from": total,
    }


# ---------------------------------------------------------------------------
# 起卦方法四：时间起卦（梅花易数年月日时起卦）
# ---------------------------------------------------------------------------

def cast_time(dt: datetime) -> dict:
    """梅花易数年月日时起卦。

    年 = 农历年支数（子 1 … 亥 12），月 = 农历月，日 = 农历日，时 = 时支数（子 1 … 亥 12）。
    上卦 = (年 + 月 + 日) 除八取余
    下卦 = (年 + 月 + 日 + 时) 除八取余
    动爻 = (年 + 月 + 日 + 时) 除六取余
    余 0 时卦取 8（坤），爻取 6（上爻）。

    dt 必须带时区信息，否则结果不可复现，函数将抛出异常。
    时刻按所填墙上时间解读，不做时区换算。
    """
    if dt.tzinfo is None:
        raise ValueError(
            "datetime must be timezone-aware; "
            "use e.g. datetime(..., tzinfo=timezone.utc)"
        )

    gz = cal.gz_numbers(dt)
    y, m, d, h = gz["year_number"], gz["month"], gz["day"], gz["shichen_number"]

    upper_n = y + m + d
    lower_n = y + m + d + h
    upper = _num_to_trigram(upper_n)
    lower = _num_to_trigram(lower_n)
    moving_idx = _moving_index(lower_n)
    lines = _compose(lower, upper)

    lunar = gz["lunar"]
    return {
        "lines": lines,
        "values": _one_moving_values(lines, moving_idx),
        "moving": [moving_idx],
        "method": "time",
        "at": dt.isoformat(),
        "ganzhi": "%s年%s%d月%d日%s时" % (
            gz["year_ganzhi"], "闰" if lunar["leap"] else "", m, d, gz["shichen"]),
        # 推导链要用：墙上时间（用户填什么就是什么）与农历数字
        "wall": {
            "year": dt.year, "month": dt.month, "day": dt.day,
            "hour": dt.hour, "minute": dt.minute,
        },
        "gz": gz,
        "upper_from": upper_n,
        "lower_from": lower_n,
        "moving_from": lower_n,
    }


# ---------------------------------------------------------------------------
# 统一输出
# ---------------------------------------------------------------------------

def render(cast_result: dict, include_trace: bool = False) -> dict:
    """将起卦原始结果渲染为结构化输出。

    只输出卦象结构与经文，不含任何占断结论。
    """
    lines = cast_result["lines"]
    hexagram = get_by_lines(lines)
    values = cast_result.get("values")
    moving = cast_result.get("moving", [])

    moving_line = None
    if moving:
        mi = moving[0]
        moving_line = {
            "position": mi,
            "label": line_label(mi, lines[mi] == 1),
            "value": values[mi] if values else None,
            "changed": values[mi] in (OLD_YIN, OLD_YANG) if values else False,
            # 大衍筮法常得两三个动爻，一并列出供前端高亮
            "all": [
                {
                    "position": p,
                    "label": line_label(p, lines[p] == 1),
                    "value": values[p] if values else None,
                }
                for p in moving
            ],
        }

    out = {
        "hexagram": {
            "number": hexagram["number"],
            "name": hexagram["name"],
            "upper": hexagram["upper"],
            "lower": hexagram["lower"],
            "symbol": SYMBOLS[hexagram["upper"]] + " " + SYMBOLS[hexagram["lower"]],
            "lines_bottom_up": list(lines),
        },
        "method": cast_result["method"],
        "moving_line": moving_line,
    }

    if moving:
        changed = [1 - l if i in moving else l for i, l in enumerate(lines)]
        ch = get_by_lines(tuple(changed))
        out["changed_hexagram"] = {"number": ch["number"], "name": ch["name"],
                                   "upper": ch["upper"], "lower": ch["lower"]}

    for key in ("at", "ganzhi", "wall", "gz", "numbers", "seed", "stalks",
                "variant", "source", "piles", "changes",
                "upper_from", "lower_from", "moving_from"):
        if cast_result.get(key) is not None:
            out[key] = cast_result[key]

    # 爻值 6/7/8/9 与逐爻三变明细，供前端展示起卦过程
    if values:
        out["values"] = list(values)

    if include_trace and "trace" in cast_result:
        out["trace"] = cast_result["trace"]

    return out


def seed_from_timestamp(dt: datetime) -> str:
    """由时间生成蓍草法种子。同一时刻必得同一卦。"""
    return dt.astimezone(timezone.utc).isoformat(timespec="microseconds")
