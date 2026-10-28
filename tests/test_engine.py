"""周易·高岛略筮 自检。

    python3 -m unittest discover -s tests -v

只用标准库。覆盖：
  1. 略筮法与《増補高島易断》所载手续、占例逐一对照
  2. 大衍筮法揲蓍规则与爻值概率
  3. 梅花易数报数起卦、年月日时起卦（含农历换算）
  4. 六十四卦卦序、上下卦、经文校勘回归
  5. 确定性、推导链自洽、CLI 行为、合规用语
  6. 高島原文齐全对齐，书中占例逐条以略筮法重演
  7. 起卦前准备说明、起卦过程逐步叙述
"""

import itertools
import json
import subprocess
import sys
import unittest
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from fractions import Fraction
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent / "skills" / "zhouyi-lookup"
SCRIPTS = SKILL / "scripts"
sys.path.insert(0, str(SCRIPTS))

from zhouyi import casting  # noqa: E402
from zhouyi.calendar import gz_numbers, solar_to_lunar  # noqa: E402
from zhouyi.derivation import build  # noqa: E402
from zhouyi.hexagrams import all_hexagrams, get_by_lines, get_by_number  # noqa: E402
from zhouyi.interpretation import HEXAGRAM_MEANING, LINE_MEANING, full_reading  # noqa: E402
from zhouyi.trigrams import TRIGRAMS  # noqa: E402

CST = timezone(timedelta(hours=8))

# 文王卦序：卦序 → (卦名, 上卦, 下卦)。独立于数据文件手录，用以校验数据。
KING_WEN = """
1乾乾乾 2坤坤坤 3屯坎震 4蒙艮坎 5需坎乾 6讼乾坎 7师坤坎 8比坎坤 9小畜巽乾 10履乾兑
11泰坤乾 12否乾坤 13同人乾离 14大有离乾 15谦坤艮 16豫震坤 17随兑震 18蛊艮巽 19临坤兑 20观巽坤
21噬嗑离震 22贲艮离 23剥艮坤 24复坤震 25无妄乾震 26大畜艮乾 27颐艮震 28大过兑巽 29坎坎坎 30离离离
31咸兑艮 32恒震巽 33遁乾艮 34大壮震乾 35晋离坤 36明夷坤离 37家人巽离 38睽离兑 39蹇坎艮 40解震坎
41损艮兑 42益巽震 43夬兑乾 44姤乾巽 45萃兑坤 46升坤巽 47困兑坎 48井坎巽 49革兑离 50鼎离巽
51震震震 52艮艮艮 53渐巽艮 54归妹震兑 55丰震离 56旅离艮 57巽巽巽 58兑兑兑 59涣巽坎 60节坎兑
61中孚巽兑 62小过震艮 63既济坎离 64未济离坎
"""


def _king_wen():
    out = {}
    for tok in KING_WEN.split():
        i = 0
        while tok[i].isdigit():
            i += 1
        rest = tok[i:]
        out[int(tok[:i])] = (rest[:-2], rest[-2], rest[-1])
    return out


def _hex(cast):
    return get_by_lines(cast["lines"])


def _changed(cast):
    flipped = tuple(1 - l if i in cast["moving"] else l for i, l in enumerate(cast["lines"]))
    return get_by_lines(flipped)


class TestLueshiTakashima(unittest.TestCase):
    """略筮法：《増補高島易断》筮儀。"""

    def test_book_trigram_examples(self):
        # 筮儀：「最初剩一本为乾，置之于下，其次剩五本为巽，置之于上，成风天小畜卦；
        # 最初剩两本其次剩六本，成水泽节；三本、七本为山火贲；四本、八本为地雷复。」
        # 得数 = 左手余数 + 挂一，故左手根数取 得数 - 1 + 8k。
        cases = [((1, 5), "小畜"), ((2, 6), "节"), ((3, 7), "贲"), ((4, 8), "复")]
        for (first, second), name in cases:
            piles = [first - 1 + 16, second - 1 + 16, 1]
            h = _hex(casting.cast_lueshi(piles=piles))
            self.assertEqual(h["name"], name, (first, second))

    def test_book_case_meng_zhi_huan(self):
        # 占例：福原実荣转冲绳县知事，筮得「蒙之涣」，断辞据六五「童蒙，吉」。
        c = casting.cast_lueshi(piles=[21, 22, 16])  # 21→6 坎（内），22→7 艮（外），16→5 五爻
        self.assertEqual(_hex(c)["name"], "蒙")
        self.assertEqual(c["moving"], [4])
        self.assertEqual(_changed(c)["name"], "涣")
        self.assertEqual(get_by_number(4)["lines"][4], "童蒙，吉。")

    def test_book_case_xu_zhi_jing(self):
        # 占例：左右田金作问入社，筮得「需之井」，断辞引初爻「需于郊」。
        c = casting.cast_lueshi(piles=[8, 13, 6])  # 8→1 乾（内），13→6 坎（外），6→1 初爻
        self.assertEqual(_hex(c)["name"], "需")
        self.assertEqual(c["moving"], [0])
        self.assertEqual(_changed(c)["name"], "井")
        self.assertTrue(get_by_number(5)["lines"][0].startswith("需于郊"))

    def test_lower_trigram_comes_first(self):
        # 高島先装内卦后装外卦：第一变定下卦。
        c = casting.cast_lueshi(piles=[0 + 8, 7 + 8, 1])  # 1 乾、8 坤
        h = _hex(c)
        self.assertEqual((h["lower"], h["upper"]), ("乾", "坤"))

    def test_counting_rule(self):
        for left in range(1, 49):
            c = casting.cast_lueshi(piles=[left, left, left])
            ch = c["changes"]
            self.assertEqual(ch[0]["number"], left % 8 + 1)
            self.assertEqual(ch[2]["number"], left % 6 + 1)
            self.assertEqual(ch[0]["right"], 49 - left)

    def test_always_exactly_one_moving_line(self):
        seen = set()
        for i in range(3000):
            c = casting.cast_lueshi(seed="s%d" % i)
            self.assertEqual(len(c["moving"]), 1)
            v = c["values"][c["moving"][0]]
            self.assertIn(v, (6, 9))
            self.assertEqual(v == 9, c["lines"][c["moving"][0]] == 1)
            for p in range(6):
                if p != c["moving"][0]:
                    self.assertIn(c["values"][p], (7, 8))
            self.assertTrue(all(1 <= x <= 48 for x in c["piles"]))
            seen.add((_hex(c)["number"], c["moving"][0]))
        self.assertGreater(len(seen), 300)  # 384 种结果大多可达

    def test_all_384_outcomes_reachable_by_hand(self):
        outcomes = set()
        for a, b, m in itertools.product(range(1, 9), range(1, 9), range(1, 7)):
            outcomes.add((_hex(casting.cast_lueshi(piles=[a, b, m]))["number"], m))
        self.assertEqual(len(outcomes), 384)

    def test_invalid_piles_rejected(self):
        for bad in ([0, 1, 1], [49, 1, 1], [1, 1], [1, 2, 3, 4]):
            with self.assertRaises(ValueError):
                casting.cast_lueshi(piles=bad)

    def test_shaoban_alias(self):
        a = casting.cast_dayan("x", variant="shaoban")
        b = casting.cast_dayan("x", variant="lueshi")
        self.assertEqual(a["lines"], b["lines"])
        self.assertEqual(a["moving"], b["moving"])


class TestDayan(unittest.TestCase):
    """大衍筮法：系辞「分而为二以象两，挂一以象三，揲之以四以象四时，归奇于扐以象闰」。"""

    def test_change_invariants(self):
        for i in range(500):
            c = casting.cast_dayan("d%d" % i)
            for t in c["trace"]:
                st = t["stages"]
                self.assertEqual(st[0]["n"], 49)
                self.assertIn(st[0]["removed"], (5, 9))
                self.assertIn(st[1]["removed"], (4, 8))
                self.assertIn(st[2]["removed"], (4, 8))
                self.assertIn(t["remaining"], (24, 28, 32, 36))
                self.assertEqual(t["value"], t["remaining"] // 4)
            self.assertEqual(c["moving"], [i for i, v in enumerate(c["values"]) if v in (6, 9)])

    def test_exact_value_probabilities(self):
        # 枚举每变左手根数的全部分法，求爻值的精确分布。
        dist = Counter({49: Fraction(1)})
        for _ in range(3):
            nxt = Counter()
            for n, p in dist.items():
                for left in range(1, n):
                    st = casting._dayan_change(n, left - 1)
                    nxt[st["remaining"]] += p / (n - 1)
            dist = nxt
        probs = {r // 4: float(p) for r, p in dist.items()}
        # 传统概率 6:1/16 7:5/16 8:7/16 9:3/16；均匀分二下应接近
        for v, expect in ((6, 1 / 16), (7, 5 / 16), (8, 7 / 16), (9, 3 / 16)):
            self.assertAlmostEqual(probs[v], expect, delta=0.02, msg=v)

    def test_rejects_wrong_stalk_count(self):
        with self.assertRaises(ValueError):
            casting.cast_dayan("x", stalks=40)


class TestNumbersMeihua(unittest.TestCase):
    """梅花易数报数起卦：数一为上卦，数二为下卦，总数除六为动爻。"""

    def test_two_numbers(self):
        c = casting.cast_numbers([7, 13])  # 7 艮上，13→5 巽下，20→2 二爻
        h = _hex(c)
        self.assertEqual((h["upper"], h["lower"], h["name"]), ("艮", "巽", "蛊"))
        self.assertEqual(c["moving"], [1])

    def test_three_numbers_moving_uses_sum(self):
        c = casting.cast_numbers([3, 5, 4])  # 3 离上，5 巽下，12→0 作 6 上爻
        self.assertEqual(_hex(c)["name"], "鼎")
        self.assertEqual(c["moving"], [5])

    def test_remainder_conventions(self):
        self.assertEqual(casting.cast_numbers([8, 16])["moving"], [5])   # 24 mod 6 = 0 → 上爻
        self.assertEqual(casting.cast_numbers([1, 6])["moving"], [0])    # 7 mod 6 = 1 → 初爻
        self.assertEqual(_hex(casting.cast_numbers([8, 8]))["name"], "坤")

    def test_yin_moving_line_is_old_yin(self):
        c = casting.cast_numbers([8, 16])  # 坤，24 mod 6 = 0 → 动上爻（阴）
        self.assertEqual(c["moving"], [5])
        self.assertEqual(c["values"][5], 6)

    def test_rejects_bad_input(self):
        for bad in ([5], [1, 2, 3, 4], [0, 3], [-1, 3]):
            with self.assertRaises(ValueError):
                casting.cast_numbers(bad)
        with self.assertRaises(TypeError):
            casting.cast_numbers([1.5, 2])


class TestTimeMeihua(unittest.TestCase):
    """梅花易数年月日时起卦：农历年支数 + 月 + 日（+ 时支数）。"""

    def test_lunar_known_dates(self):
        cases = {
            date(2026, 2, 17): (2026, 1, 1, False),   # 丙午年正月初一
            date(2025, 1, 29): (2025, 1, 1, False),   # 乙巳年正月初一
            date(2023, 3, 22): (2023, 2, 1, True),    # 癸卯年闰二月初一
            date(2020, 5, 23): (2020, 4, 1, True),    # 庚子年闰四月初一
            date(2026, 9, 25): (2026, 8, 15, False),  # 中秋
            date(1984, 2, 2): (1984, 1, 1, False),    # 甲子年正月初一
        }
        for d, (y, m, dd, leap) in cases.items():
            l = solar_to_lunar(d)
            self.assertEqual((l["year"], l["month"], l["day"], l["leap"]), (y, m, dd, leap), d)

    def test_year_branch_changes_at_lunar_new_year(self):
        before = gz_numbers(datetime(2026, 2, 16, 12, tzinfo=CST))
        after = gz_numbers(datetime(2026, 2, 17, 12, tzinfo=CST))
        self.assertEqual((before["year_ganzhi"], before["year_number"]), ("乙巳", 6))
        self.assertEqual((after["year_ganzhi"], after["year_number"]), ("丙午", 7))

    def test_shichen_numbers(self):
        expect = {0: ("子", 1), 1: ("丑", 2), 2: ("丑", 2), 11: ("午", 7),
                  12: ("午", 7), 21: ("亥", 12), 22: ("亥", 12), 23: ("子", 1)}
        for hour, (name, num) in expect.items():
            g = gz_numbers(datetime(2026, 10, 4, hour, 30, tzinfo=CST))
            self.assertEqual((g["shichen"], g["shichen_number"]), (name, num), hour)

    def test_late_zi_hour_counts_as_next_day(self):
        g = gz_numbers(datetime(2026, 10, 3, 23, 30, tzinfo=CST))
        h = gz_numbers(datetime(2026, 10, 4, 0, 30, tzinfo=CST))
        self.assertEqual((g["month"], g["day"]), (h["month"], h["day"]))

    def test_worked_example(self):
        # 2026-10-04 00:35 = 丙午年八月廿四 子时：7+8+24=39→7 艮上；40→0 坤下；40 mod 6=4 四爻
        c = casting.cast_time(datetime(2026, 10, 4, 0, 35, tzinfo=CST))
        h = _hex(c)
        self.assertEqual((h["upper"], h["lower"], h["name"]), ("艮", "坤", "剥"))
        self.assertEqual(c["moving"], [3])
        self.assertEqual(c["values"][3], 6)

    def test_requires_timezone(self):
        with self.assertRaises(ValueError):
            casting.cast_time(datetime(2026, 10, 4, 0, 35))


class TestData(unittest.TestCase):

    def test_king_wen_sequence(self):
        kw = _king_wen()
        self.assertEqual(len(all_hexagrams()), 64)
        for n, (name, up, lo) in kw.items():
            h = get_by_number(n)
            self.assertEqual((h["name"], h["upper"], h["lower"]), (name, up, lo), n)
            self.assertEqual(len(h["lines"]), 6)

    def test_line_lookup_is_bijective(self):
        seen = set()
        for bits in itertools.product((0, 1), repeat=6):
            seen.add(get_by_lines(bits)["number"])
        self.assertEqual(len(seen), 64)

    def test_meaning_structure_matches_trigrams(self):
        nature = {"天": "乾", "泽": "兑", "火": "离", "雷": "震",
                  "风": "巽", "水": "坎", "山": "艮", "地": "坤"}
        for h in all_hexagrams():
            m = HEXAGRAM_MEANING[h["name"]]
            if m.startswith("下") and m[2] == "上":
                lo, up = nature.get(m[1], m[1]), nature.get(m[3], m[3])
                self.assertEqual((lo, up), (h["lower"], h["upper"]), h["name"])

    def test_corrected_texts(self):
        # 回归：以下各条曾有脱文或误字，已据通行本校正
        self.assertEqual(get_by_number(5)["lines"][0], "需于郊，利用恒，无咎。")
        self.assertIn("有孚盈缶", get_by_number(8)["lines"][0])
        self.assertEqual(get_by_number(11)["lines"][4], "帝乙归妹，以祉，元吉。")
        self.assertIn("勿用师", get_by_number(11)["lines"][5])
        self.assertEqual(get_by_number(45)["lines"][1], "引吉，无咎，孚乃利用禴。")
        self.assertEqual(get_by_number(46)["lines"][1], "孚乃利用禴，无咎。")
        self.assertEqual(get_by_number(1)["yong"]["text"], "见群龙无首，吉。")
        self.assertEqual(get_by_number(2)["yong"]["text"], "利永贞。")
        self.assertNotIn("用六", get_by_number(2)["lines"][5])

    def test_line_labels_follow_structure(self):
        r = full_reading(13)  # 同人：唯六二为阴
        self.assertEqual([l["label"] for l in r["lines"]],
                         ["初九", "六二", "九三", "九四", "九五", "上九"])

    def test_line_meaning_coverage(self):
        self.assertEqual(len(LINE_MEANING), 64)
        self.assertTrue(all(len(v) == 6 for v in LINE_MEANING.values()))


class TestDeterminismAndChain(unittest.TestCase):

    def test_determinism(self):
        dt = datetime(2026, 10, 4, 0, 35, tzinfo=CST)
        for f in (lambda: casting.cast_lueshi(seed="当下所念"),
                  lambda: casting.cast_dayan("当下所念"),
                  lambda: casting.cast_numbers([7, 13]),
                  lambda: casting.cast_time(dt)):
            first = f()
            for _ in range(20):
                self.assertEqual(f(), first)

    def test_chain_agrees_with_cast(self):
        casts = [casting.cast_lueshi(seed="c%d" % i) for i in range(50)]
        casts += [casting.cast_dayan("c%d" % i) for i in range(50)]
        casts += [casting.cast_numbers([a, b]) for a in range(1, 12) for b in range(1, 6)]
        casts += [casting.cast_time(datetime(2026, 1, 1, tzinfo=CST) + timedelta(hours=7 * i))
                  for i in range(60)]
        for c in casts:
            chain = build(c)
            h = _hex(c)
            self.assertEqual(chain["hexagram"]["number"], h["number"])
            if c["moving"]:
                self.assertEqual(chain["changed"]["number"], _changed(c)["number"])
                self.assertEqual(chain["moving_position"], c["moving"][0])
            else:
                self.assertIsNone(chain["changed"])
            self.assertEqual(chain["steps"][-1]["key"], "boundary")

    def test_chain_trigram_steps_show_correct_arithmetic(self):
        c = casting.cast_numbers([7, 13])
        steps = {s["key"]: s for s in build(c)["steps"]}
        self.assertIn("7 mod 8 = 7", steps["upper"]["expr"])
        self.assertIn("13 mod 8 = 5", steps["lower"]["expr"])
        self.assertIn("20 mod 6 = 2 → 第 2 爻", steps["moving"]["expr"])


class TestTakashimaBook(unittest.TestCase):
    """《増補高島易断》逐卦逐爻原文与全部占例。"""

    # 原书（汉译本）自身的不一致：本卦与之卦相差不止一爻，或占例所附之爻与之卦不合。
    # (所附卦序, 所附爻位 0-5, 之卦卦序)。若解析结果变动，此表须重核。
    BOOK_ANOMALIES = {
        (1, 4, 26),   # 乾之大畜，相差两爻
        (9, 3, 61),   # 小畜之中孚，附六四，实为九三
        (11, 2, 34),  # 泰之大壮，附九三，实为六四
        (14, 3, 37),  # 大有之家人，相差多爻
        (27, 3, 42),  # 颐之益，附六四，实为六五
        (34, 5, 35),  # 大壮之晋，相差多爻
        (54, 5, 58),  # 归妹之兑，附上六，实为六五
    }

    @classmethod
    def setUpClass(cls):
        from zhouyi.takashima import _load
        cls.data = _load()
        cls.pages = []  # (卦序, 页位, 页数据)
        for n in range(1, 65):
            e = cls.data[str(n)]
            cls.pages.append((n, "judgment", e["judgment"]))
            cls.pages += [(n, p, e["lines"][p]) for p in range(6)]
            if "yong" in e:
                cls.pages.append((n, "yong", e["yong"]))

    def test_every_page_present_and_aligned(self):
        self.assertEqual(len(self.pages), 64 + 384 + 2)
        for n, slot, page in self.pages:
            h = get_by_number(n)
            if slot == "judgment":
                self.assertRegex(page["heading"], "^(习)?" + h["name"] + "：", n)
            elif slot == "yong":
                self.assertTrue(page["heading"].startswith(h["yong"]["label"]), n)
            else:
                lines = TRIGRAMS[h["lower"]] + TRIGRAMS[h["upper"]]
                from zhouyi.hexagrams import line_label
                self.assertTrue(page["heading"].startswith(line_label(slot, lines[slot] == 1)),
                                (n, slot, page["heading"]))
            self.assertTrue(page["commentary"], (n, slot))

    def _cases(self):
        for n, slot, page in self.pages:
            for c in page["cases"]:
                yield n, slot, c

    def test_every_recorded_case_reproduces_with_lueshi(self):
        """每个记有本卦、之卦的占例，用略筮法三变之数重演，须得同一本卦与之卦。"""
        n_ok = 0
        for _, _, c in self._cases():
            if c["moving"] is None:
                continue
            ben = get_by_number(c["ben"])
            lower = casting.TRIGRAM_ORDER.index(ben["lower"]) + 1
            upper = casting.TRIGRAM_ORDER.index(ben["upper"]) + 1
            # 左手根数 k+7 → k mod 8 余 k-1，加挂一得 k；动爻同理以 6 除
            cast = casting.cast_lueshi(piles=[lower + 7, upper + 7, c["moving"] + 1 + 5])
            self.assertEqual(_hex(cast)["number"], c["ben"])
            self.assertEqual(cast["moving"], [c["moving"]])
            self.assertEqual(_changed(cast)["number"], c["zhi"])
            self.assertEqual(casting.render(cast)["changed_hexagram"]["number"], c["zhi"])
            n_ok += 1
        self.assertGreaterEqual(n_ok, 489)

    def test_cases_are_one_moving_line(self):
        """高島略筮恒一动爻：几乎全部占例本卦与之卦只差一爻。"""
        both = [c for _, _, c in self._cases() if c["ben"] and c["zhi"]]
        multi = [c for c in both if c["moving"] is None]
        self.assertGreaterEqual(len(both), 490)
        self.assertEqual(len(multi), 3)

    def test_cases_filed_under_their_moving_line(self):
        consistent, anomalies = 0, set()
        for n, slot, c in self._cases():
            if not isinstance(slot, int) or c["ben"] != n or not c["zhi"]:
                continue
            if c["moving"] == slot:
                consistent += 1
            else:
                anomalies.add((n, slot, c["zhi"]))
        self.assertEqual(anomalies, self.BOOK_ANOMALIES)
        self.assertGreaterEqual(consistent, 480)

    def test_book_cases_cited_in_shiyi(self):
        from zhouyi.takashima import commentary
        casts = [c["cast"] for c in commentary(4, "六五")["cases"]]
        self.assertIn("蒙之涣", casts)
        casts = [c["cast"] for c in commentary(5, "初九")["cases"]]
        self.assertIn("需之井", casts)

    def test_sensitive_content_omitted_by_default(self):
        from zhouyi.takashima import SENSITIVE_TAGS, SENSITIVE_TOPICS, commentary
        for n, slot, _ in self.pages:
            pos = None if slot == "judgment" else ("用" if slot == "yong" else slot)
            out = commentary(n, pos)
            self.assertFalse(SENSITIVE_TOPICS & {z["topic"] for z in out["zhan"]}, (n, slot))
            for c in out["cases"]:
                self.assertFalse(SENSITIVE_TAGS & set(c["tags"]), (n, slot))
        full = commentary(4, "六五", include_sensitive=True)
        self.assertIn("六甲", {z["topic"] for z in full["zhan"]})

    def test_no_editorial_footnote_markers(self):
        import re
        blob = json.dumps(self.data, ensure_ascii=False)
        self.assertIsNone(re.search(r"［\d+］", blob))
        self.assertNotIn("▲", blob)


class TestGuideAndNarration(unittest.TestCase):

    def _chain(self, raw):
        from zhouyi.guide import narrate, next_lookup
        chain = build(raw)
        return narrate(raw, chain), next_lookup(raw, chain)

    def test_guide_preparation_quotes_shiyi(self):
        from zhouyi.guide import preparation
        g = preparation()
        self.assertEqual([p["step"] for p in g["prepare"]],
                         ["一事一占", "默念于心", "去私心", "静心收息", "至诚之际报数"])
        self.assertTrue(all("筮儀" in p["src"] for p in g["prepare"] if "quote" in p))
        self.assertIn("初筮告，再三渎，渎则不告", [a.get("quote") for a in g["after"]])
        self.assertEqual({i["method"] for i in g["inputs"]},
                         {"lueshi", "lueshi-piles", "numbers", "time"})

    def test_lueshi_narration_shows_every_count(self):
        lines, nxt = self._chain(casting.cast_lueshi(piles=[8, 13, 6]))
        text = "\n".join(lines)
        for frag in ("左手 8 策，右手 41 策", "余 0 策；加小指一策，得 1", "乾 ☰（天），定内卦",
                     "左手 13 策", "余 5 策；加小指一策，得 6", "坎 ☵（水），定外卦",
                     "第 1 爻（初爻），为动爻", "需于郊", "第 48 卦　井"):
            self.assertIn(frag, text)
        self.assertEqual(nxt["command"], "takashima 5 初九")
        self.assertTrue(lines[0].startswith("1. "))

    def test_seed_narration_names_the_phrase(self):
        lines, _ = self._chain(casting.cast_lueshi(seed="今天下午"))
        self.assertIn("「今天下午」", lines[0])

    def test_narration_for_every_method(self):
        for raw in (casting.cast_numbers([7, 13]),
                    casting.cast_time(datetime(2026, 10, 4, 0, 35, tzinfo=CST)),
                    casting.cast_dayan("x", variant="dayan")):
            lines, _ = self._chain(raw)
            self.assertGreater(len(lines), 8)
            self.assertFalse(any("止于此处" in l for l in lines))

    def test_dayan_without_single_moving_line_has_no_pointer(self):
        _, nxt = self._chain(casting.cast_dayan("x", variant="dayan"))
        self.assertIsNone(nxt)


class TestEnglish(unittest.TestCase):
    """Legge 英译与英文说明。"""

    @classmethod
    def setUpClass(cls):
        from zhouyi.english import _load
        cls.legge = _load()

    def test_legge_complete(self):
        for n in range(1, 65):
            e = self.legge[str(n)]
            self.assertTrue(e["judgment"], n)
            self.assertEqual(len(e["lines"]), 6, n)
            self.assertTrue(all(e["lines"]), n)
            self.assertEqual(bool(e.get("yong")), n in (1, 2), n)

    def test_legge_lines_match_yin_yang(self):
        """Legge 每爻自言 divided / undivided，须与本工具卦画逐爻一致。"""
        import re
        ords = [("first", "lowest"), ("second",), ("third",), ("fourth",), ("fifth",), ("sixth", "topmost")]
        for n in range(1, 65):
            h = get_by_number(n)
            lines = TRIGRAMS[h["lower"]] + TRIGRAMS[h["upper"]]
            for k, t in enumerate(self.legge[str(n)]["lines"]):
                head = t[:90].lower()
                self.assertTrue(any(o in head for o in ords[k]), (n, k, t[:60]))
                if lines[k] == 1:
                    self.assertIn("undivided", head, (n, k))
                else:
                    self.assertRegex(head, r"\bdivided", (n, k))
                    self.assertNotIn("undivided", head, (n, k))

    def test_no_ocr_debris(self):
        import re
        for n in range(1, 65):
            e = self.legge[str(n)]
            for t in [e["judgment"]] + e["lines"]:
                self.assertIsNone(re.search(r"[0-9&®*/\\\\|]", re.sub(r"\(= ", "", t)), (n, t[:80]))

    def test_english_narration_every_method(self):
        from zhouyi.english import narrate
        for raw in (casting.cast_lueshi(piles=[8, 13, 6]), casting.cast_lueshi(seed="this afternoon"),
                    casting.cast_numbers([7, 13]),
                    casting.cast_time(datetime(2026, 10, 4, 23, 30, tzinfo=CST)),
                    casting.cast_dayan("x", variant="dayan")):
            lines = narrate(raw, build(raw))
            self.assertGreater(len(lines), 6)
            self.assertTrue(all(l.split(". ", 1)[0].isdigit() for l in lines))
        text = "\n".join(narrate(*(lambda r: (r, build(r)))(casting.cast_lueshi(piles=[8, 13, 6]))))
        for frag in ("8 in the left hand and 41 in the right", "gives 1", "Qian ☰ (Heaven): this is the lower",
                     "Kan ☵ (Water): this is the upper", "the first line from the bottom is the moving line",
                     "Hexagram 5 Xu 需", "waiting in the distant border", "Hexagram 48 Jing 井"):
            self.assertIn(frag, text)

    def test_english_guide_mirrors_chinese(self):
        from zhouyi.english import preparation as en
        from zhouyi.guide import preparation as zh
        a, b = en(), zh()
        self.assertEqual(len(a["prepare"]), len(b["prepare"]))
        self.assertEqual([p.get("quote") for p in a["prepare"]], [p.get("quote") for p in b["prepare"]])
        self.assertEqual({i["method"] for i in a["inputs"]}, {i["method"] for i in b["inputs"]})


class TestJapanese(unittest.TestCase):

    def test_names_cover_all_and_match_trigrams(self):
        from zhouyi.japanese import HEXAGRAM_JA, TRIGRAM_JA
        self.assertEqual(sorted(HEXAGRAM_JA), list(range(1, 65)))
        nature = {k: v[2] for k, v in TRIGRAM_JA.items()}
        for n, (name, yomi) in HEXAGRAM_JA.items():
            h = get_by_number(n)
            self.assertTrue(yomi, n)
            if h["upper"] == h["lower"]:
                # 乾為天・兌為沢 …：八純卦は「卦名＋為＋象」（兌為沢は「だいたく」と読む）
                self.assertTrue(name.endswith("為" + nature[h["upper"]]), (n, name))
            else:
                self.assertTrue(name.startswith(nature[h["upper"]] + nature[h["lower"]]), (n, name))

    def test_japanese_narration_every_method(self):
        from zhouyi.japanese import narrate
        for raw in (casting.cast_lueshi(piles=[21, 22, 16]), casting.cast_lueshi(seed="今日の午後"),
                    casting.cast_numbers([7, 13]),
                    casting.cast_time(datetime(2026, 10, 4, 23, 30, tzinfo=CST)),
                    casting.cast_dayan("x", variant="dayan")):
            lines = narrate(raw, build(raw))
            self.assertGreater(len(lines), 6)
        text = "\n".join(narrate(*(lambda r: (r, build(r)))(casting.cast_lueshi(piles=[21, 22, 16]))))
        for frag in ("左手 21 本、右手 28 本", "坎（かん）☵・水、内卦（下卦）", "艮（ごん）☶・山、外卦（上卦）",
                     "5 は五爻、これを動爻とする", "第4卦 山水蒙（さんすいもう）", "再三瀆，瀆則不告", "第59卦 風水渙"):
            self.assertIn(frag, text)

    def test_kanji_text_is_our_edition(self):
        """旧字体本文は字形だけを変え、字数・句読点は本工具の底本と一致。"""
        from zhouyi.japanese import judgment_kanji, line_kanji
        punct = "，。：；？！、"
        for n in range(1, 65):
            h = get_by_number(n)
            pairs = [(h["judgment"], judgment_kanji(n))] + [(h["lines"][p], line_kanji(n, p)) for p in range(6)]
            for a, b in pairs:
                self.assertEqual(len(a), len(b), (n, a, b))
                self.assertEqual([c for c in a if c in punct], [c for c in b if c in punct], (n, a))
        self.assertEqual(line_kanji(18, 0), "幹父之蠱，有子，考无咎，厲終吉。")
        self.assertEqual(line_kanji(53, 0), "鴻漸于干，小子厲，有言，无咎。")
        self.assertTrue(line_kanji(21, 4).startswith("噬乾肉"))

    def test_japanese_guide_mirrors_chinese(self):
        from zhouyi.guide import preparation as zh
        from zhouyi.japanese import preparation as ja
        a, b = ja(), zh()
        self.assertEqual(len(a["prepare"]), len(b["prepare"]))
        self.assertEqual({i["method"] for i in a["inputs"]}, {i["method"] for i in b["inputs"]})


class TestCompliance(unittest.TestCase):
    BANNED = ["预示", "必中", "灵验", "应验", "保证", "宜出行", "大吉之兆", "主大吉"]

    def test_interpretive_layers_have_no_divination_claims(self):
        texts = list(HEXAGRAM_MEANING.values())
        for rows in LINE_MEANING.values():
            texts += [r["x"] for r in rows] + [r["l"] for r in rows]
        for t in texts:
            for w in self.BANNED:
                self.assertNotIn(w, t, t)

    def test_disclaimer_present(self):
        self.assertIn("不含吉凶预测", full_reading(1, 0)["disclaimer"])


class TestCLI(unittest.TestCase):

    def run_cli(self, *args):
        p = subprocess.run([sys.executable, str(SCRIPTS / "zy.py"), *args],
                           capture_output=True, text=True, cwd="/")
        return p.returncode, p.stdout, p.stderr

    def test_commands_succeed(self):
        for args in (["cast", "--seed", "当下所念"],
                     ["cast", "--piles", "21", "22", "16"],
                     ["cast", "--seed", "x", "--variant", "dayan", "--trace"],
                     ["cast", "--numbers", "7", "13"],
                     ["cast", "--at", "2026-10-04T00:35:27+08:00"],
                     ["chain", "--at", "2026-10-04T23:30:00Z"],
                     ["chain", "--piles", "8", "13", "6"],
                     ["read", "62", "六二"], ["read", "11", "4"], ["read", "1"],
                     ["takashima", "4", "六五"], ["takashima", "1"],
                     ["takashima", "2", "用六", "--all"],
                     ["guide"], ["guide", "--lang", "en"],
                     ["chain", "--seed", "now", "--lang", "en"], ["read", "4", "六五", "--lang", "en"],
                     ["takashima", "4", "六五", "--lang", "en"],
                     ["guide", "--lang", "ja"], ["chain", "--numbers", "7", "13", "--lang", "ja"],
                     ["read", "4", "六五", "--lang", "ja"], ["takashima", "4", "六五", "--lang", "ja"],
                     ["list"], ["sources"]):
            code, out, err = self.run_cli(*args)
            self.assertEqual(code, 0, (args, err))
            json.loads(out)

    def test_read_line_name_matches_text(self):
        _, out, _ = self.run_cli("read", "62", "六二")
        self.assertTrue(json.loads(out)["line"]["text"].startswith("过其祖"))

    def test_errors_are_friendly(self):
        for args in (["cast", "--at", "2026-10-04T00:35:27"],
                     ["cast", "--numbers", "7"],
                     ["cast", "--numbers", "a", "b"],
                     ["cast", "--piles", "0", "1", "1"],
                     ["read", "65"], ["read", "1", "7"],
                     ["takashima", "3", "用九"], ["takashima", "0"]):
            code, out, err = self.run_cli(*args)
            self.assertEqual(code, 2, args)
            self.assertNotIn("Traceback", err, args)


if __name__ == "__main__":
    unittest.main()
