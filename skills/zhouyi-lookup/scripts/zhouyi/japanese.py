"""日本語レイヤー：準備の説明、起卦手順の逐次説明、卦名・読み。

経文は漢文原文のまま示す（日本の読者は原文で読める）。書き下しや現代語訳を添える場合は、
アシスタント自身の訳であることを明記すること。高島の注釈の原書は日本語（明治19年刊）だが、
本データは王治本の漢訳であり、和訳は重訳になる。
"""

import json
from functools import lru_cache
from typing import Dict, List

from .casting import TRIGRAM_ORDER
from .hexagrams import data_file, get_by_number, normalize_position


@lru_cache(maxsize=1)
def _trad() -> Dict:
    with open(data_file("jing_trad.json"), "r", encoding="utf-8") as f:
        return json.load(f)


def judgment_kanji(number: int) -> str:
    """卦辞の旧字体（繁体）表記。文言は本工具の底本どおり、字形のみ変換。"""
    return _trad()[str(number)]["judgment"]


def line_kanji(number: int, position) -> str:
    return _trad()[str(number)]["lines"][normalize_position(position)]

# 八卦：日本での読みと象
TRIGRAM_JA = {
    "乾": ("乾", "けん", "天"), "兑": ("兌", "だ", "沢"), "离": ("離", "り", "火"), "震": ("震", "しん", "雷"),
    "巽": ("巽", "そん", "風"), "坎": ("坎", "かん", "水"), "艮": ("艮", "ごん", "山"), "坤": ("坤", "こん", "地"),
}
SYMBOLS = {"乾": "☰", "兑": "☱", "离": "☲", "震": "☳", "巽": "☴", "坎": "☵", "艮": "☶", "坤": "☷"}

# 六十四卦：日本で通用する卦名（上卦・下卦の象＋卦名）と読み
HEXAGRAM_JA = {
    1: ("乾為天", "けんいてん"), 2: ("坤為地", "こんいち"), 3: ("水雷屯", "すいらいちゅん"),
    4: ("山水蒙", "さんすいもう"), 5: ("水天需", "すいてんじゅ"), 6: ("天水訟", "てんすいしょう"),
    7: ("地水師", "ちすいし"), 8: ("水地比", "すいちひ"), 9: ("風天小畜", "ふうてんしょうちく"),
    10: ("天沢履", "てんたくり"), 11: ("地天泰", "ちてんたい"), 12: ("天地否", "てんちひ"),
    13: ("天火同人", "てんかどうじん"), 14: ("火天大有", "かてんたいゆう"), 15: ("地山謙", "ちざんけん"),
    16: ("雷地豫", "らいちよ"), 17: ("沢雷随", "たくらいずい"), 18: ("山風蠱", "さんぷうこ"),
    19: ("地沢臨", "ちたくりん"), 20: ("風地観", "ふうちかん"), 21: ("火雷噬嗑", "からいぜいこう"),
    22: ("山火賁", "さんかひ"), 23: ("山地剥", "さんちはく"), 24: ("地雷復", "ちらいふく"),
    25: ("天雷无妄", "てんらいむぼう"), 26: ("山天大畜", "さんてんたいちく"), 27: ("山雷頤", "さんらいい"),
    28: ("沢風大過", "たくふうたいか"), 29: ("坎為水", "かんいすい"), 30: ("離為火", "りいか"),
    31: ("沢山咸", "たくざんかん"), 32: ("雷風恒", "らいふうこう"), 33: ("天山遯", "てんざんとん"),
    34: ("雷天大壮", "らいてんたいそう"), 35: ("火地晋", "かちしん"), 36: ("地火明夷", "ちかめいい"),
    37: ("風火家人", "ふうかかじん"), 38: ("火沢睽", "かたくけい"), 39: ("水山蹇", "すいざんけん"),
    40: ("雷水解", "らいすいかい"), 41: ("山沢損", "さんたくそん"), 42: ("風雷益", "ふうらいえき"),
    43: ("沢天夬", "たくてんかい"), 44: ("天風姤", "てんぷうこう"), 45: ("沢地萃", "たくちすい"),
    46: ("地風升", "ちふうしょう"), 47: ("沢水困", "たくすいこん"), 48: ("水風井", "すいふうせい"),
    49: ("沢火革", "たくかかく"), 50: ("火風鼎", "かふうてい"), 51: ("震為雷", "しんいらい"),
    52: ("艮為山", "ごんいさん"), 53: ("風山漸", "ふうざんぜん"), 54: ("雷沢帰妹", "らいたくきまい"),
    55: ("雷火豊", "らいかほう"), 56: ("火山旅", "かざんりょ"), 57: ("巽為風", "そんいふう"),
    58: ("兌為沢", "だいたく"), 59: ("風水渙", "ふうすいかん"), 60: ("水沢節", "すいたくせつ"),
    61: ("風沢中孚", "ふうたくちゅうふ"), 62: ("雷山小過", "らいざんしょうか"), 63: ("水火既済", "すいかきせい"),
    64: ("火水未済", "かすいびせい"),
}

KANSUJI = ["一", "二", "三", "四", "五", "六"]
POS_JA = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"]
SHIYI_JA = "高島嘉右衛門『増補高島易断』筮儀（王治本漢訳より）"


def hexagram_title(number: int) -> str:
    name, yomi = HEXAGRAM_JA[number]
    return f"第{number}卦 {name}（{yomi}）"


def trigram_title(name: str) -> str:
    kanji, yomi, zou = TRIGRAM_JA[name]
    return f"{kanji}（{yomi}）{SYMBOLS[name]}・{zou}"


def read_extra(number: int, position=None) -> Dict:
    out = {"title": hexagram_title(number), "judgment": judgment_kanji(number)}
    if position is None:
        out["lines"] = _trad()[str(number)]["lines"]
    else:
        out["line"] = line_kanji(number, position)
    out["note"] = ("経文は漢文原文（旧字体）。書き下し文や現代語訳を添える場合は、"
                   "アシスタントの訳と明記すること。")
    return out


def takashima_extra(number: int) -> Dict:
    return {
        "title": hexagram_title(number),
        "language_note": ("原書は明治19年刊の日本語（漢文訓読体）。本データは王治本による漢訳で、"
                          "引用を和訳する場合は重訳となる。アシスタントの訳と明記すること。"),
    }


def preparation() -> Dict:
    return {
        "title": "占う前に",
        "intro": ("この占いは高島呑象の略筮法によります。高島は、当たるかどうかは手続きの繁簡ではなく、"
                  "卦を立てるその瞬間に心が至誠専一であるかどうかにある、と説きました。"
                  "次のように準備してから、数をお知らせください。"),
        "prepare": [
            {"step": "一事一占", "say": "占うことを一つに決めてください。一度に一つだけです。"},
            {"step": "心中に黙念する", "say": "その事を心の中で黙って念じてください。内容を私に伝える必要はありません。",
             "quote": "将其欲占問之事項默念於心", "src": SHIYI_JA},
            {"step": "私心を去る", "say": "望む答えを得たいという気持ちを手放してください。問うのは事の道理です。",
             "quote": "誠意正心，不挟一点之私", "src": SHIYI_JA},
            {"step": "目を閉じ息を収める", "say": "目を閉じ、ゆっくり呼吸して、雑念が静まるのを待ちます。一、二分ほどです。",
             "quote": "閉眼收息", "src": SHIYI_JA},
            {"step": "至誠の極みで数を出す", "say": "心が最も一つにまとまったと感じたその瞬間に、迷わず数を出してください。「良さそうな数」を選ばないこと。",
             "quote": "於其至誠之極處之時，以右手拇指，隨手平分為二", "src": SHIYI_JA},
        ],
        "inputs": [
            {"method": "lueshi", "name": "略筮法（おすすめ・高島が常用した法）",
             "ask": "今ふと浮かんだ言葉を一言、または数文字お知らせください。", "example": "今日の午後",
             "how": "この言葉は三変の筮数に換算されるだけで、意味は読みません。筮竹を手で分ける一瞬の代わりです。",
             "command": "chain --seed <言葉> --lang ja"},
            {"method": "lueshi-piles", "name": "略筮法・筮竹を実際に使う",
             "ask": "筮竹（竹ひご、つまようじでも可）が五十本あれば、次の手順を三回行い、毎回左手の本数をお知らせください。",
             "how": ["五十本から一本を抜いて脇に置きます（太極）。残りは四十九本。",
                     "占う事を念じ、至誠の極みで無心に左右二つに分けます。",
                     "右手の束を置き、そこから一本取って左手の小指に挟みます。",
                     "左手の束の本数を数えてお知らせください（小指の一本は数えません）。",
                     "四十九本をまとめ直し、あと二回。合わせて三つの数です。"],
             "example": "21 22 16", "command": "chain --piles <三つの数> --lang ja"},
            {"method": "numbers", "name": "数による起卦（梅花易数）",
             "ask": "思い浮かんだ正の整数を二つか三つお知らせください。", "example": "7 13",
             "command": "chain --numbers <数> --lang ja"},
            {"method": "time", "name": "時刻による起卦（梅花易数）",
             "ask": "準備ができたら「今」とお知らせください。その瞬間で卦を立てます。意味のある時刻を指定しても構いません。",
             "example": "今", "command": "chain --at <タイムゾーン付き ISO 時刻> --lang ja"},
        ],
        "after": [
            {"step": "初筮を以て定とする", "say": "同じ事は一度だけ占い、最初の卦を答えとします。気に入らないからと占い直すのは不敬であり、意味もありません。",
             "quote": "初筮告，再三瀆，瀆則不告", "src": "『易経』蒙卦・卦辞"},
            {"step": "まず経文を読む", "say": "略筮法では動爻は一つです。まず本卦のその爻の爻辞を読み、次に高島の解釈を参照します。"},
            {"step": "結論はご自身で", "say": "経文と高島の言葉は参考であり、あなたに代わって決めるものではありません。健康・医療・法律・大きな金銭の問題は専門家にご相談ください。"},
        ],
        "language_note": "高島の注釈は漢訳（王治本訳）のみ収録。和訳はアシスタント訳と明記すること。",
    }


def _tri(x: int) -> str:
    r = x % 8 or 8
    zero = "（0 は 8 とする）" if x % 8 == 0 else ""
    return f"{x} を 8 で割って余り {x % 8}{zero} → {trigram_title(TRIGRAM_ORDER[r - 1])}"


def _mv(x: int) -> str:
    r = x % 6 or 6
    zero = "（0 は 6 とする）" if x % 6 == 0 else ""
    return f"{x} を 6 で割って余り {x % 6}{zero} → {POS_JA[r - 1]}"


def _lueshi(cast: Dict) -> List[str]:
    out = []
    if cast.get("source") == "seed":
        out.append(f"お知らせいただいた「{cast['seed']}」を、筮竹を手で分ける代わりに用います。"
                   "各変の左手の本数がこれで決まり、ほかは筮儀の手順どおりです。")
    else:
        out.append("ご自身で筮竹を分けて得た左手の本数で、筮儀の手順どおりに計算します。")
    out.append("五十本のうち一本を脇に置いて用いません（太極）。残りは四十九本。")
    for i, c in enumerate(cast["changes"]):
        left, right, d, r, n = c["left"], c["right"], c["divisor"], c["remainder"], c["number"]
        tally = (f"{left} 本は {d} 本に満たないので余り {r} 本" if left < d
                 else f"{left} 本から {left - r} 本を払って余り {r} 本")
        s = (f"{'第一変' if i == 0 else '第二変' if i == 1 else '第三変'}：四十九本を無心に二分し、左手 {left} 本、右手 {right} 本（両儀）。"
             f"右手から一本取って左手の小指に挟む（三才）。")
        if d == 8:
            s += (f"左手の筮竹を八本ずつ払う（四時）：{tally}。小指の一本を加えて {n}。"
                  f"先天数 {n} は{trigram_title(TRIGRAM_ORDER[n - 1])}、{'内卦（下卦）' if i == 0 else '外卦（上卦）'}とする。")
        else:
            s += f"左手の筮竹を六本ずつ払う：{tally}。小指の一本を加えて {n}。{n} は{POS_JA[n - 1]}、これを動爻とする。"
        out.append(s)
    return out


def _numbers(cast: Dict) -> List[str]:
    return [
        f"お知らせいただいた数：{'、'.join(map(str, cast['numbers']))}。",
        f"上卦は第一の数から：{_tri(cast['upper_from'])}。",
        f"下卦は第二の数から：{_tri(cast['lower_from'])}。",
        f"動爻は数の合計 {cast['moving_from']} から：{_mv(cast['moving_from'])}。",
    ]


def _time(cast: Dict) -> List[str]:
    gz, w = cast["gz"], cast["wall"]
    up, lo = cast["upper_from"], cast["lower_from"]
    out = [f"時刻：{w['year']}年{w['month']}月{w['day']}日 {w['hour']:02d}:{w['minute']:02d}。"]
    if gz.get("next_day"):
        out.append("23 時以降は子の刻で翌日に属するため、翌日の日付で計算します。")
    out += [
        f"時辰：{gz['shichen']}の刻（時支数 {gz['shichen_number']}）。",
        f"旧暦（中国暦）：{gz['year_ganzhi']}年（年支 {gz['year_branch']}＝{gz['year_number']}）{gz['month']}月{gz['day']}日。",
        f"上卦は 年＋月＋日 ＝ {up}：{_tri(up)}。",
        f"下卦はこれに時支数を加えて {up}＋{gz['shichen_number']} ＝ {lo}：{_tri(lo)}。",
        f"動爻：{_mv(lo)}。",
    ]
    return out


def _dayan(cast: Dict) -> List[str]:
    names = {6: "老陰（動）", 7: "少陽", 8: "少陰", 9: "老陽（動）"}
    out = [f"「{cast['seed']}」を筮竹を分ける代わりに用います。一爻ごとに三変：分二・掛一・揲四・帰奇。"
           "三変後の残りは 36・32・28・24 本で、4 で割って 9・8・7・6 となります。"]
    for t in cast["trace"]:
        steps = "、".join(f"{s['n']}−{s['removed']}" for s in t["stages"])
        out.append(f"{POS_JA[t['position']]}：{steps} → 残り {t['remaining']} 本、÷4 ＝ {t['value']}、{names[t['value']]}。")
    return out


def narrate(cast: Dict, chain: Dict) -> List[str]:
    from .hexagrams import line_label
    from .trigrams import TRIGRAMS
    method = chain["method"]
    steps = {"lueshi": _lueshi, "numbers": _numbers, "time": _time}.get(method, _dayan)(cast)
    n = chain["hexagram"]["number"]
    h = get_by_number(n)
    lines = TRIGRAMS[h["lower"]] + TRIGRAMS[h["upper"]]
    steps += [
        f"卦を組む：下に{trigram_title(h['lower'])}、上に{trigram_title(h['upper'])}。上から描くと {chain['hexagram']['glyphs']}",
        f"六十四卦表で引く：{hexagram_title(n)}。",
        f"卦辞：{judgment_kanji(n)}",
    ]
    moving = cast.get("moving") or []
    if not moving:
        steps.append("動爻なし：卦辞を全体として読みます。")
    for p in moving:
        steps.append(f"動爻：{POS_JA[p]}（{line_label(p, lines[p] == 1)}）。爻辞：{line_kanji(n, p)}")
    if chain.get("changed"):
        c = chain["changed"]["number"]
        if len(moving) == 1:
            was = "陽" if lines[moving[0]] == 1 else "陰"
            steps.append(f"動爻が{was}から{'陰' if was == '陽' else '陽'}に変じ、之卦は {hexagram_title(c)}。")
        else:
            steps.append(f"動爻がそれぞれ陰陽を変じ、之卦は {hexagram_title(c)}。")
    if len(moving) == 1:
        p = moving[0]
        steps.append(f"次に：{HEXAGRAM_JA[n][0]}・{line_label(p, lines[p] == 1)}についての高島の解釈を参照します。")
    return [f"{i}. {t}" for i, t in enumerate(steps, 1)]
