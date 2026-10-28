"""English layer: James Legge's 1882 translation, preparation guide and step-by-step narration.

Legge's text is public domain (Sacred Books of the East, vol. XVI). Hexagram glosses and
the rest of the English here are this tool's own wording. Takashima's commentary exists only
in Chinese (Wang Zhiben's translation); see takashima.py.
"""

import json
from functools import lru_cache
from typing import Dict, List, Optional

from .casting import TRIGRAM_ORDER
from .hexagrams import data_file, get_by_number, normalize_position

DATA_PATH = data_file("legge.json")

TRIGRAM_EN = {
    "乾": ("Qian", "Heaven"), "兑": ("Dui", "Lake"), "离": ("Li", "Fire"), "震": ("Zhen", "Thunder"),
    "巽": ("Xun", "Wind"), "坎": ("Kan", "Water"), "艮": ("Gen", "Mountain"), "坤": ("Kun", "Earth"),
}
SYMBOLS = {"乾": "☰", "兑": "☱", "离": "☲", "震": "☳", "巽": "☴", "坎": "☵", "艮": "☶", "坤": "☷"}

# (pinyin, short gloss). Glosses are plain renderings of the hexagram names.
HEXAGRAM_EN = {
    1: ("Qian", "Heaven"), 2: ("Kun", "Earth"), 3: ("Zhun", "Difficult Beginnings"),
    4: ("Meng", "Youthful Ignorance"), 5: ("Xu", "Waiting"), 6: ("Song", "Dispute"), 7: ("Shi", "The Army"),
    8: ("Bi", "Union"), 9: ("Xiao Xu", "Small Restraint"), 10: ("Lü", "Treading"), 11: ("Tai", "Peace"),
    12: ("Pi", "Stagnation"), 13: ("Tong Ren", "Fellowship"), 14: ("Da You", "Great Possession"),
    15: ("Qian", "Modesty"), 16: ("Yu", "Enthusiasm"), 17: ("Sui", "Following"),
    18: ("Gu", "Remedying Decay"), 19: ("Lin", "Approach"), 20: ("Guan", "Contemplation"),
    21: ("Shi He", "Biting Through"), 22: ("Bi", "Adornment"), 23: ("Bo", "Stripping Away"),
    24: ("Fu", "Return"), 25: ("Wu Wang", "Without Falsehood"), 26: ("Da Xu", "Great Restraint"),
    27: ("Yi", "Nourishment"), 28: ("Da Guo", "Great Excess"), 29: ("Kan", "The Abyss"),
    30: ("Li", "Clinging Fire"), 31: ("Xian", "Influence"), 32: ("Heng", "Constancy"), 33: ("Dun", "Retreat"),
    34: ("Da Zhuang", "Great Strength"), 35: ("Jin", "Advance"), 36: ("Ming Yi", "Darkening of the Light"),
    37: ("Jia Ren", "The Family"), 38: ("Kui", "Opposition"), 39: ("Jian", "Obstruction"),
    40: ("Xie", "Release"), 41: ("Sun", "Decrease"), 42: ("Yi", "Increase"), 43: ("Guai", "Breakthrough"),
    44: ("Gou", "Encounter"), 45: ("Cui", "Gathering"), 46: ("Sheng", "Rising"), 47: ("Kun", "Exhaustion"),
    48: ("Jing", "The Well"), 49: ("Ge", "Revolution"), 50: ("Ding", "The Cauldron"), 51: ("Zhen", "Thunder"),
    52: ("Gen", "Stillness"), 53: ("Jian", "Gradual Progress"), 54: ("Gui Mei", "The Marrying Maiden"),
    55: ("Feng", "Abundance"), 56: ("Lü", "The Traveller"), 57: ("Xun", "Wind"), 58: ("Dui", "Joy"),
    59: ("Huan", "Dispersion"), 60: ("Jie", "Limitation"), 61: ("Zhong Fu", "Inner Truth"),
    62: ("Xiao Guo", "Small Excess"), 63: ("Ji Ji", "After Completion"), 64: ("Wei Ji", "Before Completion"),
}

ORDINAL = ["first", "second", "third", "fourth", "fifth", "sixth"]
SHIYI_EN = "Takashima, Zōho Takashima Ekidan, chapter on the casting ritual (筮儀), Wang Zhiben's Chinese translation"


@lru_cache(maxsize=1)
def _load() -> Dict:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def legge_meta() -> Dict:
    return _load()["_meta"]


def hexagram_title(number: int) -> str:
    h = get_by_number(number)
    pinyin, gloss = HEXAGRAM_EN[number]
    return f"Hexagram {number} {pinyin} {h['name']} ({gloss})"


def trigram_title(name: str) -> str:
    pinyin, nature = TRIGRAM_EN[name]
    return f"{pinyin} {SYMBOLS[name]} ({nature})"


def line_title(position: int, is_yang: bool, chinese_label: str) -> str:
    where = {0: " (bottom)", 5: " (top)"}.get(position, "")
    return f"the {ORDINAL[position]} line{where}, {'yang' if is_yang else 'yin'} — {chinese_label}"


def legge(number: int, position=None) -> Dict:
    """Legge's English for a hexagram (position None) or one line. Accepts 用九/用六 too."""
    d = _load()[str(number)]
    m = legge_meta()
    out = {"legge_name": d["name"], "source": {"work": m["work"], "translator": m["translator"],
                                              "status": m["status"]}}
    if position is None:
        out["judgment"] = d["judgment"]
        out["lines"] = d["lines"]
        if d.get("yong"):
            out["yong"] = d["yong"]
        return out
    if isinstance(position, str) and position.strip() in ("用", "用九", "用六", "yong"):
        if not d.get("yong"):
            raise ValueError(f"hexagram {number} has no 用九/用六 text")
        out["yong"] = d["yong"]
        return out
    out["line"] = d["lines"][normalize_position(position)]
    return out


def preparation() -> Dict:
    """English version of guide.preparation()."""
    return {
        "title": "Before you cast",
        "intro": ("This reading follows Takashima Donshō's abbreviated method (略筮法). Takashima taught that "
                  "a reading depends less on the ritual than on whether your mind is sincere and focused at the "
                  "moment of casting. Please prepare as follows, then give your input."),
        "prepare": [
            {"step": "One matter", "say": "Settle on one matter. Ask about one thing at a time."},
            {"step": "Hold it in mind", "say": "Go over the matter silently in your mind. You don't need to tell me what it is.",
             "quote": "将其欲占问之事项默念于心", "quote_en": "Recite silently in your heart the matter you wish to ask about.",
             "src": SHIYI_EN},
            {"step": "Let go of wanting", "say": "Set aside the wish for a particular answer. You are asking what is so, not for what you hope to hear.",
             "quote": "诚意正心，不挟一点之私", "quote_en": "Make your intent sincere and your heart upright, holding no trace of self-interest.",
             "src": SHIYI_EN},
            {"step": "Calm your breath", "say": "Close your eyes and breathe slowly until stray thoughts settle — a minute or two.",
             "quote": "闭眼收息", "quote_en": "Close the eyes and gather the breath.", "src": SHIYI_EN},
            {"step": "Answer at the moment of focus", "say": "When your mind feels most focused, answer at once. Don't deliberate or pick a \"lucky\" number.",
             "quote": "于其至诚之极处之时，以右手拇指，随手平分为二",
             "quote_en": "At the very height of sincerity, divide the stalks in two with the right thumb, without deliberation.",
             "src": SHIYI_EN},
        ],
        "inputs": [
            {"method": "lueshi", "name": "Abbreviated method (recommended; Takashima's own)",
             "ask": "Say the first short phrase or few words that come to mind.", "example": "this afternoon",
             "how": "The phrase is only converted into the three stalk counts; its meaning is never read. It stands in for splitting the stalks by hand.",
             "command": "chain --seed <the phrase> --lang en"},
            {"method": "lueshi-piles", "name": "Abbreviated method with real stalks",
             "ask": "If you have 50 stalks (yarrow, bamboo sticks or toothpicks), do this three times and tell me the count in your left hand each time.",
             "how": ["Take 50 stalks, set one aside unused (it stands for the Great Ultimate). 49 remain.",
                     "Hold your matter in mind; at the moment of focus, split them into two bundles without thinking.",
                     "Put down the right-hand bundle and take one stalk from it; hold it between the fingers of your left hand.",
                     "Count the stalks in your left-hand bundle (not counting the one you are holding) and tell me the number.",
                     "Gather all 49 and repeat twice more, for three numbers in all."],
             "example": "21 22 16", "command": "chain --piles <three numbers> --lang en"},
            {"method": "numbers", "name": "Number casting (Plum Blossom method)",
             "ask": "Say two or three positive whole numbers, whatever comes to mind.", "example": "7 13",
             "command": "chain --numbers <numbers> --lang en"},
            {"method": "time", "name": "Time casting (Plum Blossom method)",
             "ask": "Say \"now\" when you are ready, and the reading uses that moment; or give a time that matters to you.",
             "example": "now", "command": "chain --at <ISO time with timezone> --lang en"},
        ],
        "after": [
            {"step": "The first reading stands", "say": "Ask about the same matter only once and keep the first answer. Casting again because you dislike the result is disrespectful and meaningless.",
             "quote": "初筮告，再三渎，渎则不告",
             "quote_en": "At the first inquiry I answer. A second or third time is importunate, and the importunate I do not answer.",
             "src": "Book of Changes, hexagram 4 (Meng), judgment"},
            {"step": "Read the text first", "say": "This method gives one moving line. Read that line of your hexagram first, then Takashima's commentary on it."},
            {"step": "The decision is yours", "say": "The classic and Takashima's words are a reference, not a decision made for you. For health, medical, legal or major financial matters, please consult a professional."},
        ],
        "language_note": ("Takashima's commentary and cases exist in Chinese only. Any English rendering of them is "
                          "the assistant's own translation and should be labelled as such."),
    }


def _hex_lines(number: int):
    h = get_by_number(number)
    from .trigrams import TRIGRAMS
    return h, TRIGRAMS[h["lower"]] + TRIGRAMS[h["upper"]]


def _tail(cast: Dict, chain: Dict) -> List[str]:
    from .hexagrams import line_label
    n = chain["hexagram"]["number"]
    h, lines = _hex_lines(n)
    out = [
        f"Stack the trigrams: {trigram_title(h['lower'])} below, {trigram_title(h['upper'])} above. "
        f"Drawn top to bottom: {chain['hexagram']['glyphs']}",
        f"Look up the pair in the table of 64: {hexagram_title(n)}.",
        f"The judgment (Legge): {legge(n)['judgment']}",
    ]
    moving = cast.get("moving") or []
    if not moving:
        out.append("No line is moving: read the judgment as a whole.")
        return out
    for p in moving:
        label = line_label(p, lines[p] == 1)
        out.append(f"Moving line: {line_title(p, lines[p] == 1, label)}. Legge: {legge(n, p)['line']}")
    if chain.get("changed"):
        c = chain["changed"]["number"]
        if len(moving) == 1:
            was = "yang" if lines[moving[0]] == 1 else "yin"
            now = "yin" if was == "yang" else "yang"
            turn = f"The moving line turns from {was} to {now}"
        else:
            turn = "Each moving line turns to its opposite"
        out.append(f"{turn}, giving the changed hexagram: {hexagram_title(c)}.")
    if len(moving) == 1:
        p = moving[0]
        out.append(f"Next: Takashima's commentary on hexagram {n}, {line_label(p, lines[p] == 1)}.")
    return out


def _lueshi(cast: Dict) -> List[str]:
    out = []
    if cast.get("source") == "seed":
        out.append(f"Your phrase “{cast['seed']}” stands in for splitting the stalks by hand: it fixes how many "
                   "stalks fall in the left hand at each change. Everything else follows Takashima's procedure.")
    else:
        out.append("Using the left-hand counts you reported from splitting the stalks yourself, following Takashima's procedure.")
    out.append("Of 50 stalks, one is set aside unused (it stands for the Great Ultimate). 49 remain.")
    for i, c in enumerate(cast["changes"]):
        left, right, d, r, n = c["left"], c["right"], c["divisor"], c["remainder"], c["number"]
        word = "eight" if d == 8 else "six"
        plural = "eights" if d == 8 else "sixes"
        tally = (f"{left} is fewer than {d}, so {r} remain" if left < d
                 else f"{left} counted off by {plural} leaves {r}")
        s = (f"{['First', 'Second', 'Third'][i]} change: the 49 stalks are split at random, {left} in the left hand and "
             f"{right} in the right (the two forces). One stalk is taken from the right and held in the left hand "
             f"(heaven, earth and humanity). The left-hand stalks are counted off in {plural}: {tally}. "
             f"Adding the held stalk gives {n}. ")
        if d == 8:
            name = TRIGRAM_ORDER[n - 1]
            s += (f"In the Earlier Heaven numbering, {n} is {trigram_title(name)}: this is the "
                  f"{'lower (inner)' if i == 0 else 'upper (outer)'} trigram.")
        else:
            s += f"{n} means the {ORDINAL[n - 1]} line from the bottom is the moving line."
        out.append(s)
    return out


def _numbers(cast: Dict) -> List[str]:
    nums = cast["numbers"]
    up, lo, mv = cast["upper_from"], cast["lower_from"], cast["moving_from"]
    def tri(x):
        r = x % 8 or 8
        return f"{x} ÷ 8 leaves {x % 8}{' (counted as 8)' if x % 8 == 0 else ''} → {trigram_title(TRIGRAM_ORDER[r - 1])}"
    m = mv % 6 or 6
    return [
        f"Your numbers: {' and '.join(map(str, nums))}.",
        f"Upper trigram from the first number: {tri(up)}.",
        f"Lower trigram from the second number: {tri(lo)}.",
        f"Moving line from the total {mv}: {mv} ÷ 6 leaves {mv % 6}{' (counted as 6)' if mv % 6 == 0 else ''} "
        f"→ the {ORDINAL[m - 1]} line.",
    ]


def _time(cast: Dict) -> List[str]:
    gz = cast["gz"]
    w = cast["wall"]
    up, lo = cast["upper_from"], cast["lower_from"]
    def tri(x):
        r = x % 8 or 8
        return f"{x} ÷ 8 leaves {x % 8}{' (counted as 8)' if x % 8 == 0 else ''} → {trigram_title(TRIGRAM_ORDER[r - 1])}"
    m = lo % 6 or 6
    out = [f"The moment: {w['year']}-{w['month']:02d}-{w['day']:02d} {w['hour']:02d}:{w['minute']:02d}."]
    if gz.get("next_day"):
        out.append("At 23:00 or later the new day has begun (the Zi double-hour), so the next day's date is used.")
    out += [
        f"Double-hour: {gz['shichen']} (number {gz['shichen_number']}).",
        f"Chinese lunar date: year {gz['year_ganzhi']} (branch {gz['year_branch']}, number {gz['year_number']}), "
        f"month {gz['month']}, day {gz['day']}.",
        f"Upper trigram from year + month + day = {up}: {tri(up)}.",
        f"Lower trigram adding the hour, {up} + {gz['shichen_number']} = {lo}: {tri(lo)}.",
        f"Moving line: {lo} ÷ 6 leaves {lo % 6}{' (counted as 6)' if lo % 6 == 0 else ''} → the {ORDINAL[m - 1]} line.",
    ]
    return out


def _dayan(cast: Dict) -> List[str]:
    names = {6: "old yin (moving)", 7: "young yang", 8: "young yin", 9: "old yang (moving)"}
    out = [f"Your phrase “{cast['seed']}” stands in for the random splits. Each line takes three changes: split the "
           "49 stalks, hang one, count both piles by fours, and set the remainders aside. 49 − first change − second − "
           "third leaves 36, 32, 28 or 24, which divided by 4 gives 9, 8, 7 or 6."]
    for t in cast["trace"]:
        st = t["stages"]
        steps = ", ".join(f"{s['n']} − {s['removed']}" for s in st)
        out.append(f"The {ORDINAL[t['position']]} line: {steps} → {t['remaining']} remain, "
                   f"÷ 4 = {t['value']}, {names[t['value']]}.")
    return out


def narrate(cast: Dict, chain: Dict) -> List[str]:
    method = chain["method"]
    if method == "lueshi":
        steps = _lueshi(cast)
    elif method == "numbers":
        steps = _numbers(cast)
    elif method == "time":
        steps = _time(cast)
    else:
        steps = _dayan(cast)
    steps += _tail(cast, chain)
    return [f"{i}. {t}" for i, t in enumerate(steps, 1)]
