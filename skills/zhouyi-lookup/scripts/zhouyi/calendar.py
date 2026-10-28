"""干支与农历换算（确定性，无外部依赖）。

时间起卦（梅花易数年月日时起卦法）用农历：年取年支数，月取农历月，
日取农历日，时取时支数。故须先把公历换成农历。

农历表 LUNAR_YEARS 覆盖农历 1900–2100 年，每年一个整数：
  bit 0–12   各月大小（1 = 大月三十日，0 = 小月二十九日），按月序排列，闰月紧随其本月
  bit 13–16  闰月月份（0 表示无闰月）
基准：公历 1900-01-31 = 农历 1900 年正月初一。
"""

from datetime import date, datetime, timedelta
from typing import Dict, Tuple

# 十天干
HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
# 十二地支。梅花易数取数：子 1、丑 2 … 亥 12
EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

LUNAR_BASE = date(1900, 1, 31)
LUNAR_FIRST_YEAR = 1900
LUNAR_YEARS = [
    71378, 1874, 3749, 46666, 1611, 2715, 38230, 1386, 2905, 22354, 1874,
    56101, 2853, 2635, 46251, 685, 1387, 19305, 3497, 64914, 3730, 3365,
    47693, 2646, 694, 38325, 1748, 3753, 24210, 3730, 52518, 1323, 2647,
    45750, 2906, 1748, 28361, 1865, 63123, 2707, 1323, 51803, 2733, 1386,
    39765, 2980, 2889, 23187, 2709, 62765, 1334, 2733, 46506, 1458, 3493,
    32074, 3402, 68245, 2711, 1366, 51893, 2773, 1746, 36517, 3749, 1610,
    27799, 2715, 62810, 1386, 2921, 46930, 2898, 2853, 38475, 2635, 70827,
    685, 1389, 52073, 3497, 3474, 40229, 3365, 88653, 2646, 694, 50613, 1749,
    3753, 48786, 3730, 3366, 27222, 2647, 70870, 858, 1749, 46793, 1865, 1683,
    38187, 1323, 2651, 21850, 1386, 64341, 2980, 2889, 47763, 2709, 1325,
    35501, 2741, 79274, 1490, 3493, 56650, 3402, 3221, 38190, 1366, 2741,
    21938, 1746, 52901, 1829, 1611, 44183, 3243, 1370, 27350, 2921, 96082,
    2898, 2853, 55883, 2635, 1195, 42331, 1453, 2922, 23378, 3474, 64805,
    3365, 2645, 46253, 1206, 1461, 28074, 3785, 73362, 3730, 3366, 51798,
    2647, 1238, 34517, 1877, 1865, 28307, 1683, 62763, 1323, 2651, 46426,
    1386, 2917, 38730, 2890, 72341, 2709, 1325, 51885, 2741, 1450, 35749,
    3493, 3402, 31893, 3222, 63822, 1366, 2741, 46514, 1746, 3749, 36426,
    1675, 68759, 1195, 1371, 51926, 2922, 1874, 38693, 2885, 2699, 21659, 1195
]


def _year_months(year: int):
    """返回该农历年各月 [(月, 是否闰月, 天数), ...]。"""
    info = LUNAR_YEARS[year - LUNAR_FIRST_YEAR]
    leap = info >> 13
    out = []
    i = 0
    for m in range(1, 13):
        out.append((m, False, 30 if info & (1 << i) else 29))
        i += 1
        if m == leap:
            out.append((m, True, 30 if info & (1 << i) else 29))
            i += 1
    return out


def solar_to_lunar(d: date) -> Dict:
    """公历日期 → 农历 {year, month, day, leap}。"""
    offset = (d - LUNAR_BASE).days
    if offset < 0:
        raise ValueError("日期早于 1900-01-31，超出农历表范围")
    for y in range(LUNAR_FIRST_YEAR, LUNAR_FIRST_YEAR + len(LUNAR_YEARS)):
        for m, leap, days in _year_months(y):
            if offset < days:
                return {"year": y, "month": m, "day": offset + 1, "leap": leap}
            offset -= days
    raise ValueError("日期晚于农历 2100 年，超出农历表范围")


def get_shichen(dt: datetime) -> Tuple[str, int]:
    """由 datetime 判定时辰，返回 (时支, 时支数 1–12)。

    子时 23:00–01:00，丑时 01:00–03:00 … 亥时 21:00–23:00。
    """
    idx = ((dt.hour + 1) // 2) % 12
    return EARTHLY_BRANCHES[idx], idx + 1


def branch_number(year: int) -> int:
    """农历年的年支数，子 1 … 亥 12。1984 为甲子年。"""
    return (year - 1984) % 12 + 1


def year_ganzhi(year: int) -> str:
    return HEAVENLY_STEMS[(year - 1984) % 10] + EARTHLY_BRANCHES[(year - 1984) % 12]


def gz_numbers(dt: datetime) -> Dict:
    """时间起卦所需的数字。

    23:00 起即入子时，按传统归次日：先把日期推进一天再换农历。
    """
    s_name, s_num = get_shichen(dt)
    d = dt.date() + (timedelta(days=1) if dt.hour >= 23 else timedelta(0))
    lunar = solar_to_lunar(d)
    return {
        "lunar": lunar,
        "next_day": dt.hour >= 23,
        "year_ganzhi": year_ganzhi(lunar["year"]),
        "year_branch": EARTHLY_BRANCHES[branch_number(lunar["year"]) - 1],
        "year_number": branch_number(lunar["year"]),
        "month": lunar["month"],
        "day": lunar["day"],
        "shichen": s_name,
        "shichen_number": s_num,
    }
