# I Ching · Takashima Method · 周易·高岛略筮

A Grok Bot / Grok Build plugin for structured lookup of the *Zhouyi* (I Ching): the 64 hexagram judgments, the 384 line texts, and a line-by-line interpretation of each, with public-domain sources cited.

![logo](assets/logo.png)

## Install

```bash
grok plugin marketplace add windyinwind/iching-takashima
grok plugin install iching-takashima --trust
```

`--trust` lets Grok load the plugin's skill and agent; without it, the install only shows what the plugin contains. To update later: `grok plugin marketplace update`.

## What it does

- **Casting methods**: Takashima Donshō's three-change abbreviated method (略筮法, default; from the 筮儀 section of 《増補高島易断》), the classical 18-change Dayan method, and Meihua number and time casting (time casting uses the Chinese lunar calendar, 1900–2100)
- **Deterministic**: the same input always gives the same hexagram. Randomness comes from a SHA-256 hash chain, so results reproduce across machines.
- **Chinese, English and Japanese**: every user-facing command takes `--lang en` or `--lang ja`; Japanese uses the standard Japanese hexagram names and readings; the English classic text is James Legge's 1882 translation (public domain). Takashima's commentary is Chinese only.
- **Guided session**: `guide` returns what to tell users before casting (Takashima's preparation steps from the 筮儀 and the input options), and `chain` adds a plain-language `narration` so users see every step of the cast, not just the result
- **Derivation chain**: `chain` prints every step with the rule applied, the actual numbers substituted, the result and the source
- **Line-by-line reading**: 384 entries, each with structural imagery (象), principle (义理) and its public-domain commentary sources
- **Takashima's own text**: `takashima` returns Takashima's commentary, topic readings and recorded cases for every hexagram and line (450 pages, 503 cases, from Wang Zhiben's Chinese translation of 《増補高島易断》). Health, pregnancy and Meiji-era war content is left out by default.

## What it deliberately does not do

It does not make predictions of its own, judge any specific matter, or ask the user what they are divining about. It returns text, structure and sources (Takashima's readings are quoted with attribution), and the user draws their own conclusions.

## Components

| Type | Path | Purpose |
|---|---|---|
| Skill | `skills/zhouyi-lookup/` | `SKILL.md` + zero-dependency Python CLI (`scripts/zy.py`) |
| Agent | `agents/iching-takashima.md` | Zhouyi text and interpretation advisor persona |

## Requirements, network and credentials

- Python 3 standard library only. No third-party packages.
- **No network access, no credentials, no telemetry.** All data (`hexagrams.json`, `lines.json`, `takashima.json`, `legge.json`, `jing_trad.json`) ships in the repo, and the CLI reads only its own files.

## Testing instructions

```bash
cd skills/zhouyi-lookup
python3 scripts/zy.py guide                 # preparation instructions shown to users
python3 scripts/zy.py chain --seed "this afternoon" --lang en   # English step-by-step cast
python3 scripts/zy.py read 11              # full hexagram 泰
python3 scripts/zy.py read 62 六二          # single line (小过 六二)
python3 scripts/zy.py cast --piles 21 22 16  # Takashima's 蒙之涣 case
python3 scripts/zy.py takashima 4 六五       # Takashima's commentary and cases for 蒙 六五
python3 scripts/zy.py cast --numbers 7 13  # cast by numbers
python3 scripts/zy.py chain --numbers 7 13 # step-by-step derivation
python3 scripts/zy.py cast --at "2026-10-04T00:35:27+08:00"
```

Full test suite (stdlib only), from the plugin root:

```bash
python3 -m unittest discover -s tests -v
```

In Grok Bot, try: *"帮我起一卦，要能看到起卦过程"* or *"What does line 2 of Small Exceeding mean?"*

## License

The code is MIT, see [LICENSE](LICENSE). The bundled data has its own status:

| Data | Source | Status |
|---|---|---|
| `hexagrams.json` (judgments and line texts), `jing_trad.json` | the *Zhouyi* | public domain; `jing_trad.json` is this project's text in traditional characters |
| `lines.json` (384 interpretations) | original writing by this project, based on public-domain commentaries | MIT |
| `legge.json` | James Legge, *The Yi King* (1882) | public domain |
| `takashima.json` | Takashima Donshō, 《増補高島易断》, Wang Zhiben's Chinese translation | the original and the translation are public domain; see `skills/zhouyi-lookup/scripts/references/compliance.md` for the digitized text's source |

---

# 周易·高岛略筮

《周易》六十四卦经文与三百八十四爻爻辞的结构化检索专家。

## 能做什么

- **起卦**：略筮法（默认，高島呑象常用，见《増補高島易断》筮儀）、大衍筮法、梅花易数数字起卦与时间起卦（按农历）
- **确定性**：随机源为 SHA-256 链式摘要，同一输入永远得同一卦，跨平台可复现
- **推导链**：`chain` 命令输出逐步推导过程，每步含规则、代入的真实数字、所得、依据出处
- **逐爻解读**：384 条，每条含取象（爻位与卦体结构）与义理（修身与处事方法），标注所据公版注疏
- **经文检索**：六十四卦卦辞与三百八十四爻爻辞全文
- **高島原文**：`takashima` 命令返回《増補高島易断》逐卦逐爻的义理、分事占断与占例（王治本汉译，450 页、503 例），健康、生育与战事内容默认略去

## 明确不做的事

- 不自行预测任何事项，不判断任何是非，不替用户做决定（高島占断仅作标明出处的引文）
- 不接收占问事项的文本——所占何事完全在用户自己心里
- 不声称解读质量优于别处

这是合规基础，不是功能缺失。一旦接收问题文本，无论怎么约束输出，它都只能是算命程序。

## 依赖

- Python 3（无第三方依赖，零安装）
- 调用方式：`scripts/zy.py`，统一 CLI，不写内联脚本

## 数据来源与边界

**可用（公有领域）**：周易卦爻辞、王弼集解、礼记、系辞、《増補高島易断》1886 年日文原书及王治本汉译

**不可用（保护期）**：《白话高岛易断》2014、《图解高岛易断》2008、《占断破解》2010 及一切现代白话译本

《増補高島易断》筮儀所载略筮法为本工具默认起卦法；逐卦逐爻原文见 `takashima` 命令。数字化文本的来源说明见 `skills/zhouyi-lookup/scripts/references/compliance.md`。

384 条解读由本工具依公版注疏撰述，**不是古籍原文照录**。

## 自检

```bash
python3 scripts/zy.py read 11        # 全卦
python3 scripts/zy.py chain --numbers 7 13   # 推导链
```
