---
name: zhouyi-lookup
display_name: "周易·高岛略筮：起卦与经文检索"
display_name_en: "I Ching · Takashima Method: Casting and Text Lookup"
description: "Use when the user needs Zhouyi / I Ching material: casting a hexagram by time, numbers or yarrow stalks; retrieving the judgment, line texts and the 384 line-by-line interpretations; or understanding how a hexagram was derived. Works in Chinese and English (James Legge's translation). Covers Takashima Donsho's three-change abbreviated method (略筮法), his full commentary, topic readings and recorded cases from 増補高島易断, the classical Dayan method and Meihua number/time casting."
description_zh: "周易起卦与经文检索：时间、数字、蓍草三法起卦，查六十四卦卦辞与三百八十四爻爻辞，逐爻取象与义理阐发，《増補高島易断》逐卦逐爻原文（义理、占断、占例），以及略筮法（高島呑象常用）、大衍筮法与梅花易数的取数规则。同一输入永远得同一卦，取数过程逐步可复算。"
description_en: "Casting a Zhouyi hexagram by time, numbers or yarrow stalks; retrieving the 64 judgments and 384 line texts with line-by-line interpretation; plus Takashima's 略筮法, the Dayan method and Meihua casting. Fully reproducible."
category: culture
version: 1.4.0
author: "I Ching · Takashima Method 周易·高岛略筮"
metadata:
  author: "I Ching · Takashima Method"
  short-description: "Cast and read the I Ching step by step, Takashima's method (zh/en/ja)"
---

# 周易经文爻辞与逐爻义理检索

《周易》公版古籍的结构化检索工具。**不是算命工具。** 不预测任何事项，不判断任何是非，不替用户做决定。

所有输出走 `scripts/zy.py`（路径相对于本 SKILL.md 所在目录，从其他目录调用时请用绝对路径），不要手写内联 Python（内联脚本易漏 import 而报错）。

## 起卦

```bash
# 略筮法（默认，高島呑象常用）：以种子代替手分筮竹
python3 scripts/zy.py cast --seed "当下所念"

# 略筮法，用户亲手分了筮竹：报三变时左手（天策）的根数，各 1-48
python3 scripts/zy.py cast --piles 21 22 16

# 大衍筮法（十八变）
python3 scripts/zy.py cast --seed "当下所念" --variant dayan --trace

# 数字起卦（梅花易数）：两个或三个正整数
python3 scripts/zy.py cast --numbers 7 13

# 时间起卦（梅花易数年月日时）：必须带时区（Z 或 ±HH:MM），按农历计
python3 scripts/zy.py cast --at "2026-10-04T00:35:27+08:00"
```

- `lueshi`（默认）— **略筮法（三变筮）**，《増補高島易断》筮儀所载、高島呑象常用之法。四十九本分二，右手取一本挂小指；左手之策八八数之，余数加一：第一变定内卦（下卦），第二变定外卦（上卦）；第三变六六数之定动爻。**恒得一动爻**。`shaoban` 为旧名，仍可用。
- `dayan` — 大衍筮法，分二、挂一、揲四、归奇，十八变成卦。老阴老阳皆为动爻，动爻数不定。
- 数字起卦：数一定上卦，数二定下卦，诸数之和除六定动爻。
- 时间起卦：农历年支数（子 1 … 亥 12）+ 农历月 + 农历日 定上卦，再加时支数定下卦与动爻；23:00 起归次日子时。支持农历 1900–2100 年。

余数为 0 时，卦取 8（坤），爻取 6（上爻）。同一输入必得同一卦，这是可复现的基础，**不要改用随机数**。时间按墙上时间解读，不做时区换算。

## English / 日本語

Every user-facing command takes `--lang en` or `--lang ja` (Chinese is the default). Relay `narration` as returned rather than re-translating it, so the counts stay exact.

Japanese (`--lang ja`): preparation guide and step narration in Japanese, standard Japanese hexagram names with readings (山水蒙・さんすいもう), trigram readings (乾・けん … 坤・こん), and the classic text in the original kanji. Any 書き下し or modern Japanese rendering is the assistant's own and must be labelled.

English (`--lang en`):

```bash
python3 scripts/zy.py guide --lang en
python3 scripts/zy.py chain --seed "this afternoon" --lang en
python3 scripts/zy.py read 4 六五 --lang en
python3 scripts/zy.py takashima 4 六五 --lang en
```

English classic text is James Legge's translation (*The Yî King*, Sacred Books of the East vol. XVI, 1882; public domain). Hexagrams 1–31 come from the Wikisource proofread transcription, 32–64 from the Internet Archive scan, corrected by hand; the test suite checks that every one of Legge's 384 lines says "divided"/"undivided" in agreement with the hexagram data. Takashima's commentary exists only in Chinese: translate what you quote and label it as your own translation.

## 起卦前的准备说明

```bash
python3 scripts/zy.py guide
```

返回给用户看的说明：`prepare` 五步（一事一占、默念于心、去私心、静心收息、至诚之际报数，附《増補高島易断》筮儀原文）、`inputs` 各种报法（含亲手分筮竹的做法）、`after` 起卦后的三条（初筮为准等）。用户说想起卦时先给这个，再请其报数。

## 推导链

讲解「这个卦怎么来的」时用 `chain` 而不要自己复述算法：

```bash
python3 scripts/zy.py chain --at "2026-10-04T00:35:27+08:00"
python3 scripts/zy.py chain --numbers 7 13
python3 scripts/zy.py chain --seed "当下所念"
python3 scripts/zy.py chain --piles 21 22 16
```

每步含规则、代入的真实数字、所得、依据出处，末步是边界声明（不判断吉凶）。

`narration` 是同一推导链的白话逐步说明，一步一条，可直接照录给用户：略筮法每一变写明左手几策、右手几策、余几、得几、定何卦。`next` 给出该查的高島原文（如 `takashima 4 六五`）；动爻不止一个时为空。

**给用户看过程，不只看结果**：起卦一律用 `chain`，把 `narration` 逐条展示。

## 解读查询

```bash
python3 scripts/zy.py read 11          # 卦辞、卦义、象数、六爻经文与逐爻义理
python3 scripts/zy.py read 11 六五       # 用爻题名最稳妥：初九/六二/…/上六，或 初/二/…/上
python3 scripts/zy.py read 62 六二       # 小过六二
python3 scripts/zy.py read 11 4         # 数字为 0-5：0=初爻 … 5=上爻（注意 1 是二爻）
python3 scripts/zy.py list
python3 scripts/zy.py sources
```

全部子命令返回 JSON。越界输入会得到一句中文错误说明，**不会抛出 traceback**，可直接转述给用户。

转述用户说的「第几爻」时用爻题名传参，不要直接把「第一爻」写成 1。

乾、坤两卦另有 `yong`（用九 / 用六），不属任何一爻。

`read` 每爻的 `meaning` 含：

- `xiang` — 取象：爻位与卦体结构分析（刚柔、当位、应与、所处之位）
- `li` — 义理：由此结构推出的修身与处事方法
- `sources` — 所据公版注疏（周易、王弼注、伊川易传、系辞）

这 384 条由本工具依公版注疏撰述，**不是古籍原文照录**，也不含吉凶占断。`sources` 里的 `work` 字段可直接引用，不要自行编造出处。

## 高島原文

```bash
python3 scripts/zy.py takashima 4 六五    # 蒙六五：高島义理、分事占断、占例实录
python3 scripts/zy.py takashima 4         # 省略爻位为卦辞一页
python3 scripts/zy.py takashima 1 用九     # 乾用九、坤用六
```

略筮法恒得一动爻，高島即据**本卦动爻之辞**下断。所以起卦后取 `cast` 结果的卦序与动爻爻题名，直接查 `takashima`。

返回字段：

- `heading` — 经文
- `commentary` — 高島义理阐发（含所引彖传、象传）
- `zhan_general` / `zhan` — 占断总论与分事占断（`topic` 如 家宅、营商、功名、婚姻、失物、讼事、行人、战征）
- `cases` — 占例实录，`cast` 为「本卦之之卦」，`moving` 为所动之爻
- `omitted` — 默认略去的条数（见下）
- `source` — 出处，可直接引用

默认略去健康与生育类占断（问疾病、问六甲）及相关占例，并略去涉及明治时期对外战争的占例。`--all` 取全文，仅在用户明确要求阅读原书全文时使用。

数据为王治本汉译本，共 450 页（64 卦辞 + 384 爻 + 用九、用六）、503 条占例。自检用略筮法逐条重演书中记有本卦、之卦的占例，结果与原书一致；原书自身有 7 条本卦与之卦不合，已登记在 `tests/test_engine.py`。

## 表述规范

**可以说**
- 「此卦上乾下坤，天地交」
- 「卦义在通交之理：上下交而其志同，然泰极而否来，须存防满之心」
- 「这一爻的象数含义是……」
- 「经文这样讲，你可以自己体会」

- 「高島原书于此爻『问营商』云：……」——引高島之辞须标明是原书之言

**不能说**
- 「此卦主大吉」「宜出行」「此卦预示……」「能成 / 不能成」——作为你自己的结论
- 把高島的占断改写成对用户事项的断言
- 任何关于具体事项结果的判断
- 任何「本工具质量优于别处」的质量声称

把结论留给用户。给结构、给经文、给出处。

## 铁律：输入不承载语义

**永远不要向用户索取占问事项。** 不接收「我该不该问他」这类问题文本——所占何事完全在用户心里。用户心里默念一件事，报一个时间或两个数字，返回卦象与经文，解读由用户自己完成。

## 免责

每次输出都自带免责声明，不要去掉：

> 本输出为《周易》经文与义理的结构化检索结果，不含吉凶预测，不构成对任何具体事项的判断。

## 数据边界

**可用（公有领域）**：周易卦爻辞、王弼集解、礼记、系辞、《増補高島易断》1886 年日文原书及王治本（1835–1908）汉译

**不可用（保护期）**：《白话高岛易断》2014、《图解高岛易断》2008、《占断破解》2010 及一切现代白话译本

《増補高島易断》的逐卦逐爻原文经 `takashima` 命令原样引用，出处为王治本汉译。健康、生育、战事内容默认略去，见上。
