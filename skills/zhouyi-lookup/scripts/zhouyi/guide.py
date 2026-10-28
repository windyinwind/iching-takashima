"""起卦前的准备说明，与起卦过程的逐步白话叙述。

准备说明据《増補高島易断》筮儀（王治本译）；叙述由 derivation.build 的推导链
与起卦原始数据生成，每一步的数字都是本次实际算得的数字，不另作发挥。
"""

from typing import Dict, List

from .casting import TRIGRAM_ORDER
from .trigrams import NATURE, SYMBOLS

LINE_NAMES = ["初", "二", "三", "四", "五", "上"]

SHIYI = "《増補高島易断》筮儀（王治本译）"


def preparation() -> Dict:
    """起卦之前给用户看的说明：如何准备、报什么、起卦后如何对待。"""
    return {
        "title": "起卦之前",
        "intro": (
            "本卦按高島呑象的略筮法起卦。高島认为，卦准不准不在手续繁简，"
            "而在起卦那一刻心是否至诚专一。请照下面几步准备好，再报数。"
        ),
        "prepare": [
            {
                "step": "一事一占",
                "say": "先想定一件事。一次只占一件，不要几件事混在一起。",
            },
            {
                "step": "默念于心",
                "say": "把这件事在心里默念清楚，不必告诉我。所占何事只在你自己心里。",
                "quote": "将其欲占问之事项默念于心",
                "src": SHIYI,
            },
            {
                "step": "去私心",
                "say": "放下想要某个结果的念头。问的是事理，不是求一个想听的答案。",
                "quote": "诚意正心，不挟一点之私",
                "src": SHIYI,
            },
            {
                "step": "静心收息",
                "say": "闭眼，慢慢呼吸，等杂念退去。约一两分钟。",
                "quote": "闭眼收息",
                "src": SHIYI,
            },
            {
                "step": "至诚之际报数",
                "say": "觉得心最专一的那一刻，立即报数，不要斟酌，不要挑一个「好数字」。",
                "quote": "于其至诚之极处之时，以右手拇指，随手平分为二",
                "src": SHIYI,
            },
        ],
        "inputs": [
            {
                "method": "lueshi",
                "name": "略筮法（推荐，高島常用）",
                "ask": "随口说一句当下浮现的话，或几个字。",
                "example": "今天下午",
                "how": "这句话只被换算成三变的筮数，不读其意。它代替了亲手分筮竹的那一下。",
                "command": "cast --seed <所说的话>",
            },
            {
                "method": "lueshi-piles",
                "name": "略筮法，亲手分筮竹",
                "ask": "若你有五十根筮竹（或竹签、牙签），照下面做三次，每次报左手的根数。",
                "how": [
                    "取五十根，抽出一根放在一旁不用，象太极。余四十九根。",
                    "默念所占之事，至诚之际随手分为左右两把。",
                    "右手一把放下，从中取一根夹在左手小指间。",
                    "数左手那把共有几根，报给我。",
                    "合拢四十九根，再做两次，共报三个数。",
                ],
                "example": "21 22 16",
                "command": "cast --piles <三个数>",
            },
            {
                "method": "numbers",
                "name": "报数起卦（梅花易数）",
                "ask": "随口报两个或三个正整数。",
                "example": "7 13",
                "command": "cast --numbers <两三个数>",
            },
            {
                "method": "time",
                "name": "时间起卦（梅花易数）",
                "ask": "准备好时说「现在」，以那一刻起卦；或报一个你认为有意义的时刻。",
                "example": "现在",
                "command": "cast --at <带时区的 ISO 时间>",
            },
        ],
        "after": [
            {
                "step": "初筮为准",
                "say": "同一件事只占一次，以第一次所得为准。不满意再占，是不敬，也无意义。",
                "quote": "初筮告，再三渎，渎则不告",
                "src": "《周易》蒙卦卦辞",
            },
            {
                "step": "以经文为主",
                "say": "略筮法只得一个动爻，读的是本卦这一爻的爻辞，再参看高島对这一爻的阐发。",
            },
            {
                "step": "结论在你",
                "say": "经文与高島之言是参照，不是替你做的决定。健康、医疗、法律、财务大事，请向专业人士求助。",
            },
        ],
    }


def _trigram(n: int) -> str:
    name = TRIGRAM_ORDER[n - 1]
    return f"{name} {SYMBOLS[name]}（{NATURE[name]}）"


def _lueshi_changes(cast: Dict) -> List[str]:
    out = []
    if cast.get("source") == "seed":
        out.append(f"以你所说「{cast['seed']}」代替亲手分筮竹：由它定出每一变左手的根数，其余照筮儀手续。")
    else:
        out.append("用你亲手分筮竹报来的左手根数，照筮儀手续计算。")
    out.append("五十策，取一策置旁不用，象太极；余四十九策。")
    names = ["第一变", "第二变", "第三变"]
    for i, c in enumerate(cast["changes"]):
        left, right, d, r, n = c["left"], c["right"], c["divisor"], c["remainder"], c["number"]
        head = (f"{names[i]}：四十九策随手分二，左手 {left} 策，右手 {right} 策（象两仪）。"
                f"自右手取一策，挂左手小指（象三才）。")
        if left < d:
            tally = f"{left} 策不足{'八' if d == 8 else '六'}策，即余 {r} 策"
        else:
            tally = f"{left} 策数去 {left - r} 策，余 {r} 策"
        if d == 8:
            count = f"左手之策八策一数（象四时）：{tally}；加小指一策，得 {n}。"
            target = "内卦（下卦）" if i == 0 else "外卦（上卦）"
            tail = f"先天数 {n} 为{_trigram(n)}，定{target}。"
        else:
            count = f"这一变左手之策六策一数：{tally}；加小指一策，得 {n}。"
            tail = f"{n} 即第 {n} 爻（{LINE_NAMES[n - 1]}爻），为动爻。"
        out.append(head + count + tail)
    return out


def _dayan_lines(step: Dict) -> List[str]:
    out = [step["rule"]]
    for row in step["table"]["rows"]:
        label, a, b, c, rest, value = row
        out.append(f"{label}：{a}，{b}，{c}；余策 {rest}，{value}。")
    return out


def narrate(cast: Dict, chain: Dict) -> List[str]:
    """把推导链译成给用户看的逐步说明，每条一步。"""
    lines: List[str] = []
    for s in chain["steps"]:
        key = s["key"]
        if key == "seed" and chain["method"] == "lueshi":
            continue
        if key == "triples":
            lines += _lueshi_changes(cast) if chain["method"] == "lueshi" else _dayan_lines(s)
            continue
        if key == "boundary":
            continue
        if key == "compose":
            h = chain["hexagram"]
            lines.append(f"成六爻：下卦{h['lower']}在下，上卦{h['upper']}在上，"
                         f"自上而下画作 {s['out']}")
            continue
        expr, res = s.get("expr", ""), s.get("out", "")
        if expr and res and res.replace("　", " ").split()[-1] not in expr:
            body = f"{expr}，得 {res}"
        else:
            body = expr or res or s["rule"]
        lines.append(f"{s['title']}：{body}")
    nxt = next_lookup(cast, chain)
    if nxt:
        lines.append(f"查高島原书：{chain['hexagram']['name']}卦{nxt['position']}，"
                     f"看高島对这一爻的阐发与占例。")
    return [f"{i}. {t}" for i, t in enumerate(lines, 1)]


def next_lookup(cast: Dict, chain: Dict):
    """起卦之后该查哪一页高島原文。仅一个动爻时有确定答案。"""
    from .hexagrams import line_label
    moving = cast.get("moving") or []
    if len(moving) != 1:
        return None
    p = moving[0]
    label = line_label(p, cast["lines"][p] == 1)
    return {"number": chain["hexagram"]["number"], "position": label,
            "command": f"takashima {chain['hexagram']['number']} {label}"}
