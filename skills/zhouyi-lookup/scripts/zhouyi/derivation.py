"""推导链：把一次起卦拆成可逐步复算的链条。

这是本工具「可信」的全部依据所在。一次起卦从输入到义理，中间的每一步
都编号、给出规则、代入真实数字、给出所得，并标注所依据的材料。用户
可以拿计算器逐条核对，也可以只信自己核对过的那几步。

刻意不做的事：链条里没有任何一步通向吉凶、成败或应验。最后一步是
边界声明——输出止于义理，不替用户对具体事项下判断。
"""

from typing import Dict, List, Optional, Tuple

from .casting import OLD_YANG, OLD_YIN, VALUE_NAMES, render
from .hexagrams import get_by_lines, get_by_number, line_label
from .interpretation import SOURCES, full_reading
from .trigrams import DIRECTIONS, ELEMENTS, NATURE, SYMBOLS, TRIGRAMS

# 爻位的固有属性（《周易》通例，与具体卦象无关）
POSITION_IS_YANG = {0: True, 1: False, 2: True, 3: False, 4: True, 5: False}
POSITION_IS_CENTER = {1: True, 4: True}
POSITION_NAMES = ["初", "二", "三", "四", "五", "上"]
TRIGRAM_NAMES = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]

YANG_GLYPH = "⚊"
YIN_GLYPH = "⚋"


# ---------------------------------------------------------------------------
# 小工具
# ---------------------------------------------------------------------------

def _src(ids) -> List[Dict[str, str]]:
    out = []
    for i in ids or []:
        meta = SOURCES.get(i, {})
        out.append({
            "id": i,
            "work": meta.get("title", i),
            "status": meta.get("status", ""),
        })
    return out


def _step(no: int, key: str, title: str, rule: str, inputs=None, expr: str = "",
          out: str = "", note: str = "", src=None, table=None, facts=None) -> Dict:
    s = {
        "no": no,
        "key": key,
        "title": title,
        "rule": rule,
        "inputs": [{"k": k, "v": str(v)} for k, v in (inputs or [])],
        "expr": expr,
        "out": str(out),
        "note": note,
        "src": _src(src or []),
    }
    if table:
        s["table"] = table
    if facts:
        s["facts"] = [{"k": k, "v": str(v)} for k, v in facts]
    return s


def _trig_of(remainder: int) -> Tuple[int, str]:
    """余数 0-7 转（先天数 1-8，卦名）。余 0 作 8。"""
    n = remainder % 8
    if n == 0:
        n = 8
    return n, ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"][n - 1]


def _glyphs(lines) -> str:
    """六爻画成符号串。参数自下而上，输出自上而下（读卦顺序）。"""
    return "".join(YANG_GLYPH if l == 1 else YIN_GLYPH for l in reversed(list(lines)))


def _lines_of(number: int) -> List[int]:
    h = get_by_number(number)
    return list(TRIGRAMS[h["lower"]]) + list(TRIGRAMS[h["upper"]])


# ---------------------------------------------------------------------------
# 对照表（推导链每一步都可以翻到这里核对）
# ---------------------------------------------------------------------------

def reference_tables() -> List[Dict]:
    xiantian = []
    for i, name in enumerate(["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"], start=1):
        xiantian.append([
            str(i), name, SYMBOLS[name],
            "".join(YANG_GLYPH if b == 1 else YIN_GLYPH for b in reversed(TRIGRAMS[name])),
        ])

    shichen = []
    for i, (name, start, _end) in enumerate([
        ("子", 23, 1), ("丑", 1, 3), ("寅", 3, 5), ("卯", 5, 7),
        ("辰", 7, 9), ("巳", 9, 11), ("午", 11, 13), ("未", 13, 15),
        ("申", 15, 17), ("酉", 17, 19), ("戌", 19, 21), ("亥", 21, 23),
    ]):
        shichen.append([name, "%02d:00–%02d:00" % (start, (start + 2) % 24), str(i + 1)])

    position = []
    for p in range(6):
        position.append([
            "第 %d 爻" % (p + 1),
            "九" + POSITION_NAMES[p] + " / 六" + POSITION_NAMES[p],
            "阳位" if POSITION_IS_YANG[p] else "阴位",
            "中" if POSITION_IS_CENTER.get(p) else "",
            "与第 %d 爻" % (((p + 3) % 6) + 1),
        ])

    values = [
        ["6", "老阴（交）", "阴", "动爻"],
        ["7", "少阳（单）", "阳", "静爻"],
        ["8", "少阴（拆）", "阴", "静爻"],
        ["9", "老阳（重）", "阳", "动爻"],
    ]

    catalogue = []
    for i in range(1, 65):
        h = get_by_number(i)
        catalogue.append([
            str(h["number"]), h["name"], h["lower"], h["upper"],
            SYMBOLS[h["upper"]] + SYMBOLS[h["lower"]],
        ])

    return [
        {"id": "xiantian", "title": "先天八卦数",
         "note": "略筮法、时间起卦、数字起卦皆以此表把数译成卦。",
         "head": ["数", "卦", "卦画", "爻"],
         "rows": xiantian, "hl": []},
        {"id": "shichen", "title": "十二时辰",
         "note": "子时跨夜：23:00–01:00 同属子，23:00 起归次日。时支数参与时间起卦。",
         "head": ["时辰", "时刻", "时支数"],
         "rows": shichen, "hl": []},
        {"id": "position", "title": "爻位属性",
         "note": "初、三、五为阳位；二、四、上为阴位。二、五得中。初与四、二与五、三与上相应当阴阳相异。",
         "head": ["位", "题名", "阴阳位", "中", "应"],
         "rows": position, "hl": []},
        {"id": "values", "title": "大衍爻值",
         "note": "大衍三变余策除四得六七八九。老阴老阳极则变，故为动爻。",
         "head": ["数", "名", "阴阳", "动静"],
         "rows": values, "hl": []},
        {"id": "catalogue", "title": "文王卦序",
         "note": "以下卦、上卦为键查此表即得卦名与卦序。",
         "head": ["序", "卦", "下", "上", "卦画"],
         "rows": catalogue, "hl": []},
    ]


# ---------------------------------------------------------------------------
# 主体
# ---------------------------------------------------------------------------

def build(raw: Dict) -> Dict:
    """输入起卦原始结果，输出完整推导链。"""
    cast = render(raw, include_trace=True)
    hexa = cast["hexagram"]
    number = hexa["number"]
    name = hexa["name"]
    lower, upper = hexa["lower"], hexa["upper"]
    lines = list(hexa["lines_bottom_up"])
    method = cast.get("method")

    ml = cast.get("moving_line")
    pos: Optional[int] = ml["position"] if ml else None
    reading = full_reading(number, pos)

    steps: List[Dict] = []
    counter = [0]

    def add(key, title, rule, **kw):
        counter[0] += 1
        steps.append(_step(counter[0], key, title, rule, **kw))

    # --- 前段：随起卦法而异 -------------------------------------------------

    xt_rows = reference_tables()[0]["rows"]

    def trig_step(key, title, rule, formula, total, src):
        n, tname = _trig_of(total)
        add(key, title, rule,
            inputs=[("算式", formula)],
            expr="%d mod 8 = %d → 第 %d" % (total, total % 8, n),
            out="%s　%s" % (tname, SYMBOLS[tname]),
            table={"head": ["数", "卦", "卦画", "爻"], "rows": xt_rows, "hl": [n - 1]},
            src=src)

    def moving_step(rule, formula, total, note):
        mv = (total % 6 or 6)
        add("moving", "定动爻", rule,
            inputs=[("算式", formula)],
            expr="%d mod 6 = %d → 第 %d 爻" % (total, total % 6, mv),
            out="第 %d 爻（%s）" % (mv, POSITION_NAMES[mv - 1]),
            note=note)

    if method == "time":
        gz = raw["gz"]
        wall = raw["wall"]
        lunar = gz["lunar"]
        y, m, d, h = gz["year_number"], gz["month"], gz["day"], gz["shichen_number"]

        add("input", "取时刻",
            "按所填的墙上时间解读，不做时区换算——填什么时刻，就算那一刻。",
            inputs=[("年", wall["year"]), ("月", wall["month"]), ("日", wall["day"]),
                    ("时刻", "%02d:%02d" % (wall["hour"], wall["minute"]))],
            out="%04d-%02d-%02d %02d:%02d" % (
                wall["year"], wall["month"], wall["day"], wall["hour"], wall["minute"]),
            note="系统只接收时刻，不接收你所问之事。")

        add("shichen", "定时辰",
            "一日分十二时辰，每辰两小时。子时 23:00–01:00，23:00 起入子时即归次日。",
            inputs=[("时刻", "%02d:%02d" % (wall["hour"], wall["minute"]))],
            expr="%02d:%02d 落在 %s 时" % (wall["hour"], wall["minute"], gz["shichen"]),
            out="%s时（时支数 %d）" % (gz["shichen"], h),
            note="时支数：子 1、丑 2 … 亥 12。" + ("23 点后已归次日计。" if gz["next_day"] else ""))

        add("lunar", "换农历",
            "梅花易数年月日时起卦用农历：年取年支数（子 1 … 亥 12），月、日取农历月日。",
            inputs=[("公历", "%04d-%02d-%02d" % (wall["year"], wall["month"], wall["day"])
                     + ("（归次日）" if gz["next_day"] else ""))],
            expr="农历 %d 年%s%d 月 %d 日，%s年" % (
                lunar["year"], "闰" if lunar["leap"] else "", m, d, gz["year_ganzhi"]),
            out="年=%d（%s）　月=%d　日=%d　时=%d" % (y, gz["year_branch"], m, d, h),
            note="农历年以正月初一为界；闰月按其本月之数计。")

        trig_step("upper", "定上卦",
                  "上卦 =（年 + 月 + 日）mod 8，余数查先天八卦数表；余 0 作 8。",
                  "(%d + %d + %d) mod 8" % (y, m, d), y + m + d, ["meihua"])
        trig_step("lower", "定下卦",
                  "下卦 =（年 + 月 + 日 + 时）mod 8，余数查先天八卦数表；余 0 作 8。",
                  "(%d + %d + %d + %d) mod 8" % (y, m, d, h), y + m + d + h, ["meihua"])
        moving_step("动爻 =（年 + 月 + 日 + 时）mod 6；余 1 为初爻，余 0 作 6 为上爻。",
                    "(%d + %d + %d + %d) mod 6" % (y, m, d, h), y + m + d + h,
                    "爻位自下而上数，初爻为第一爻。")

    elif method == "numbers":
        nums = list(cast["numbers"])
        total = sum(nums)
        add("input", "报数",
            "报两个或三个正整数，不收任何文字。",
            inputs=[("数%s" % "一二三"[i], n) for i, n in enumerate(nums)],
            out=" / ".join(str(n) for n in nums),
            note="你所想的事不进入系统，只有数字进入计算。")
        trig_step("upper", "定上卦",
                  "上卦 = 数一 mod 8，余数查先天八卦数表；余 0 作 8。",
                  "%d mod 8" % nums[0], nums[0], ["meihua"])
        trig_step("lower", "定下卦",
                  "下卦 = 数二 mod 8，余数查先天八卦数表；余 0 作 8。",
                  "%d mod 8" % nums[1], nums[1], ["meihua"])
        moving_step("动爻 = 诸数之和 mod 6；余 1 为初爻，余 0 作 6 为上爻。",
                    "(%s) mod 6" % " + ".join(str(n) for n in nums), total,
                    "爻位自下而上数，初爻为第一爻。")

    elif method == "lueshi":
        changes = cast["changes"]
        if cast.get("source") == "piles":
            add("seed", "取筮数",
                "亲手分筮竹：报三变时左手（天策）所余根数。",
                inputs=[("三变左手根数", "、".join(str(c["left"]) for c in changes))],
                out="以所报根数计算",
                note="五十本取一象太极，四十九本分二；右手一堆取一本挂于小指。")
        else:
            add("seed", "取种子",
                "以 SHA-256 链式摘要代替手分筮竹，不使用任何随机数发生器。",
                inputs=[("种子", cast.get("seed", ""))],
                out="三变左手根数 " + "、".join(str(c["left"]) for c in changes),
                note="「分而为二」的偶然，在此是可复现的摘要：同一句话永远起出同一卦。")
        rows = []
        for c, what in zip(changes, ("内卦（下卦）", "外卦（上卦）", "动爻")):
            if c["divisor"] == 8:
                got = TRIGRAM_NAMES[c["number"] - 1]
            else:
                got = "第 %d 爻（%s）" % (c["number"], POSITION_NAMES[c["number"] - 1])
            rows.append(["第%s变" % "一二三"[c["change"] - 1], str(c["left"]),
                         "%d mod %d = %d" % (c["left"], c["divisor"], c["remainder"]),
                         "%d + 1 = %d" % (c["remainder"], c["number"]), what, got])
        add("triples", "三变成卦",
            "略筮法：左手之策八八数之，余数加挂一之一本为得数。"
            "第一变定内卦，第二变定外卦，第三变六六数之定动爻。",
            inputs=[("先天数", "乾1 兑2 离3 震4 巽5 坎6 艮7 坤8"),
                    ("爻位", "1 初爻 … 6 上爻")],
            out="内卦 %s、外卦 %s、动第 %d 爻" % (
                TRIGRAM_NAMES[changes[0]["number"] - 1],
                TRIGRAM_NAMES[changes[1]["number"] - 1], changes[2]["number"]),
            table={"head": ["变", "左手根数", "取余", "加挂一", "所定", "所得"],
                   "rows": rows, "hl": []},
            src=["takashima"],
            note="高島先装内卦、后装外卦，自下而上；略筮法恒得一爻动。")

    elif method == "dayan":
        trace = cast.get("trace") or []
        add("seed", "取种子",
            "以 SHA-256 链式摘要代替手分蓍草，不使用任何随机数发生器。",
            inputs=[("种子", cast.get("seed", "")), ("蓍草", "50 本，其用 49")],
            out="摘要流 18 个十六位整数（每变一个）",
            note="「分而为二」的偶然，在此是可复现的摘要：同一句话永远起出同一卦。")
        rows = []
        for t in trace:
            st = t["stages"]
            rows.append([
                POSITION_NAMES[t["position"]] + "爻",
                "%d→去%d" % (st[0]["n"], st[0]["removed"]),
                "%d→去%d" % (st[1]["n"], st[1]["removed"]),
                "%d→去%d" % (st[2]["n"], st[2]["removed"]),
                "%d ÷ 4 = %d" % (t["remaining"], t["value"]),
                VALUE_NAMES[t["value"]],
            ])
        add("triples", "十八变成卦",
            "每爻三变：分二、挂一、揲四、归奇。第一变去 5 或 9，第二、三变去 4 或 8；"
            "三变余策 36/32/28/24，除四得 9/8/7/6。自初爻起，共六爻。",
            inputs=[("每变所去", "挂一 + 左余 + 右余（四四揲之，余 1-4，整除余 4）")],
            out="、".join("%s=%d" % (POSITION_NAMES[t["position"]], t["value"]) for t in trace),
            table={"head": ["爻", "一变", "二变", "三变", "余策", "爻值"],
                   "rows": rows, "hl": []},
            src=["xici"])
        old = [t["position"] for t in trace if t["value"] in (OLD_YIN, OLD_YANG)]
        add("moving", "定动爻",
            "大衍筮法：老阴（6）与老阳（9）为物极必反之处，皆为动爻。",
            inputs=[("爻值", "、".join(str(t["value"]) for t in trace))],
            expr=("6 与 9 出现在第 %s 爻" % "、".join(str(p + 1) for p in old))
                 if old else "六七八九中无 6 亦无 9",
            out="、".join(POSITION_NAMES[p] + "爻" for p in old) if old else "六爻皆静，无动爻",
            note="动爻数不定。变卦由全部动爻一并变出；本工具录最下一动爻之辞，其余一并列出。"
                 if old else "此时看卦辞与卦义，不看爻辞。")

    # --- 后段：三种方法共用 -------------------------------------------------

    add("compose", "成六爻",
        "下卦三爻在下，上卦三爻在上，自下而上合成六爻。这是《周易》画卦通例。",
        inputs=[("下卦", "%s %s（初、二、三爻）" % (lower, SYMBOLS[lower])),
                ("上卦", "%s %s（四、五、上爻）" % (upper, SYMBOLS[upper]))],
        out=_glyphs(lines),
        table={"head": ["爻位", "所属", "爻性", "爻画"],
               "rows": [[
                   "第 %d 爻" % (p + 1),
                   ("下卦 " + lower) if p <= 2 else ("上卦 " + upper),
                   "阳" if lines[p] == 1 else "阴",
                   YANG_GLYPH if lines[p] == 1 else YIN_GLYPH,
               ] for p in range(6)],
               "hl": [pos] if pos is not None else []},
        note="读卦自上而下，故上爻画在最上面。")

    add("lookup", "查六十四卦表",
        "以（下卦，上卦）为键查文王卦序表，得卦名与卦序。",
        inputs=[("键", "下 %s ／ 上 %s" % (lower, upper))],
        expr="%s ＋ %s → 第 %d 卦" % (SYMBOLS[lower], SYMBOLS[upper], number),
        out="第 %d 卦　%s" % (number, name),
        src=["yijing"])

    add("judgment", "录卦辞",
        "卦辞为《周易》本文，逐字照录，不加改写。",
        out=reading["judgment"],
        src=["yijing"],
        note=reading["judgment_source"]["location"])

    add("hexmeaning", "卦义主旨",
        "就卦象结构作整体义理阐发。此条据公版注疏撰述，非古籍原文照录。",
        out=reading["meaning"],
        src=["yijing", "wangbi"],
        note="上卦 %s 为%s，下卦 %s 为%s。" % (
            upper, NATURE[upper], lower, NATURE[lower]))

    changed = None
    if pos is None:
        add("static", "六爻皆静",
            "无动爻时，看卦辞与卦义，不取爻辞。",
            out="静卦：以卦辞为主",
            note="此为本工具的规则选择，不是断语。")
    else:
        is_yang = lines[pos] == 1
        label = line_label(pos, is_yang)

        add("labelname", "定爻题名",
            "阳爻称九，阴爻称六。初爻与上爻位名置前（初九、上六），"
            "二三四五爻数名置前（九二、六三）。",
            inputs=[("第几爻", "%d" % (pos + 1)), ("爻性", "阳" if is_yang else "阴")],
            expr="%s ＋ %s → %s" % (
                POSITION_NAMES[pos], "九" if is_yang else "六", label),
            out=label)

        all_moving = [m["position"] for m in ml["all"]]
        changed_lines_tuple = tuple(1 - l if i in all_moving else l
                                    for i, l in enumerate(lines))
        ch = get_by_lines(changed_lines_tuple)
        changed = {
            "number": ch["number"],
            "name": ch["name"],
            "upper": ch["upper"],
            "lower": ch["lower"],
            "symbol": SYMBOLS[ch["upper"]] + SYMBOLS[ch["lower"]],
            "linesBottomUp": list(changed_lines_tuple),
        }
        add("changed", "得变卦",
            "动爻阴阳互变，其余各爻不变，即得变卦（之卦）。",
            inputs=[("本卦", "第 %d 卦 %s" % (number, name)), ("动爻", label)],
            expr="、".join("第 %d 爻由%s变为%s" % (
                p + 1, "阳" if lines[p] == 1 else "阴", "阴" if lines[p] == 1 else "阳")
                for p in all_moving),
            out="第 %d 卦　%s" % (ch["number"], ch["name"]),
            note="本工具只列变卦之名与其卦辞，不以变卦作任何推断。")

        ln = reading["line"]
        add("linetext", "录爻辞",
            "爻辞为《周易》本文，逐字照录，不加改写。",
            out=ln["text"],
            src=["yijing"],
            note="%s卦·%s" % (name, label))

        # 取象：把结构与所得一并摊开，让用户自己核对
        pos_yang = POSITION_IS_YANG[pos]
        center = POSITION_IS_CENTER.get(pos, False)
        pair = (pos + 3) % 6
        pair_yang = lines[pair] == 1
        has_ying = is_yang != pair_yang
        tier = "下卦" if pos <= 2 else "上卦"
        trig = lower if pos <= 2 else upper

        add("xiang", "推取象",
            "取象只看结构：爻性、爻位阴阳、是否得中、与应爻是否阴阳相异、所属三画卦。",
            inputs=[("爻", "%s（%s）" % (label, "阳" if is_yang else "阴"))],
            out=(ln["meaning"]["xiang"] if ln.get("meaning") else ""),
            facts=[
                ("爻位", "第 %d 爻 · %s" % (pos + 1, POSITION_NAMES[pos])),
                ("爻性", "阳" if is_yang else "阴"),
                ("位之阴阳", "阳位" if pos_yang else "阴位"),
                ("当位" if is_yang == pos_yang else "不当位",
                 "阳居阳位" if (is_yang and pos_yang)
                 else ("阴居阴位" if (not is_yang and not pos_yang)
                       else ("阳居阴位" if is_yang else "阴居阳位"))),
                ("得中" if center else "非中",
                 "居下卦之中" if (center and pos == 1) else
                 ("居上卦之中" if center else "二、五方为中")),
                ("应与第 %d 爻" % (pair + 1),
                 "阴阳相异，有应" if has_ying else "同性，无应"),
                ("所属", "%s %s %s" % (tier, trig, SYMBOLS[trig])),
                ("自然象", "%s · 五行%s · %s" % (
                    NATURE[trig], ELEMENTS[trig], DIRECTIONS[trig])),
            ],
            note="以上八项皆可由卦画直接数出，不依赖任何外部解释。")

        add("li", "申义理",
            "义理由上一步的结构推出，落在修身处事上，不落在具体事项的成败上。",
            out=(ln["meaning"]["li"] if ln.get("meaning") else ""),
            src=[s["id"] for s in (ln["meaning"]["sources"] if ln.get("meaning") else [])],
            note="此条据公版注疏撰述，非古籍原文照录。")

    add("boundary", "止于此处",
        "链条到此为止。本工具自己不判断吉凶，不预测成败，不替你回答具体事项。"
        "高島呑象对这一爻的阐发与占例，可另查 takashima，那是原书之言。",
        out="输出为经文与义理的结构化检索结果",
        note="你所占何事只在你自己心里。工具给的是可以自己核对的一段文字，"
             "不是一个替你做的决定。")

    return {
        "method": method,
        "steps": steps,
        "hexagram": {
            "number": number, "name": name,
            "upper": upper, "lower": lower,
            "symbol": SYMBOLS[upper] + SYMBOLS[lower],
            "glyphs": _glyphs(lines),
        },
        "changed": changed,
        "moving_position": pos,
        "reproduce": _reproduce(cast),
    }


def _reproduce(cast: Dict) -> str:
    """复算凭据：把这次的输入原样写下来，重新填入必得同一卦。"""
    m = cast.get("method")
    if m == "time":
        w = cast.get("wall") or {}
        return "time|%04d-%02d-%02d %02d:%02d" % (
            w.get("year", 0), w.get("month", 0), w.get("day", 0),
            w.get("hour", 0), w.get("minute", 0))
    if m == "numbers":
        return "numbers|" + ",".join(str(n) for n in cast.get("numbers", []))
    if m == "lueshi":
        if cast.get("source") == "piles":
            return "lueshi-piles|" + ",".join(str(p) for p in cast.get("piles", []))
        return "lueshi|%s" % cast.get("seed", "")
    if m == "dayan":
        return "dayan|%s" % cast.get("seed", "")
    return m or ""
