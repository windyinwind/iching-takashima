// Port of derivation.build and the zh / en / ja narrations (guide.py, english.py, japanese.py).
import { T } from "./data.ts";
import {
  type Cast, LINE_NAMES, OLD_YANG, OLD_YIN, SYMBOLS, TRIGRAM_ORDER, VALUE_NAMES,
  getByLines, getByNumber, lineLabel, linesOf, pad, render,
} from "./core.ts";
import {
  ORDINAL, POS_JA, SOURCES, fullReading, hexagramTitleEn, hexagramTitleJa, judgmentKanji, legge, lineKanji,
  trigramTitleEn, trigramTitleJa,
} from "./reading.ts";

const NATURE: Record<string, string> = T.nature;
const ELEMENTS: Record<string, string> = T.elements;
const DIRECTIONS: Record<string, string> = T.directions;
const YANG_GLYPH = "⚊", YIN_GLYPH = "⚋";
const POSITION_IS_YANG = [true, false, true, false, true, false];
const isCenter = (p: number) => p === 1 || p === 4;

type KV = [string, string | number];

function step(no: number, key: string, title: string, rule: string, kw: {
  inputs?: KV[]; expr?: string; out?: string; note?: string; src?: string[]; table?: any; facts?: KV[];
} = {}) {
  const s: any = {
    no, key, title, rule,
    inputs: (kw.inputs ?? []).map(([k, v]) => ({ k, v: String(v) })),
    expr: kw.expr ?? "",
    out: String(kw.out ?? ""),
    note: kw.note ?? "",
    src: (kw.src ?? []).map((i) => ({ id: i, work: SOURCES[i]?.title ?? i, status: SOURCES[i]?.status ?? "" })),
  };
  if (kw.table) s.table = kw.table;
  if (kw.facts && kw.facts.length) s.facts = kw.facts.map(([k, v]) => ({ k, v: String(v) }));
  return s;
}

const trigOf = (r: number): [number, string] => {
  const n = r % 8 || 8;
  return [n, TRIGRAM_ORDER[n - 1]];
};

const glyphs = (lines: number[]) => [...lines].reverse().map((l) => (l === 1 ? YANG_GLYPH : YIN_GLYPH)).join("");

export function build(raw: Cast): Record<string, any> {
  const cast = render(raw, true);
  const hexa = cast.hexagram;
  const { number, name, lower, upper } = hexa;
  const lines: number[] = [...hexa.lines_bottom_up];
  const method = cast.method;
  const ml = cast.moving_line;
  const pos: number | null = ml ? ml.position : null;
  const reading = fullReading(number, pos);

  const steps: any[] = [];
  const add = (key: string, title: string, rule: string, kw = {}) => steps.push(step(steps.length + 1, key, title, rule, kw));

  const xtRows = T.reference_tables[0].rows;
  const trigStep = (key: string, title: string, rule: string, formula: string, total: number, src: string[]) => {
    const [n, tname] = trigOf(total);
    add(key, title, rule, {
      inputs: [["算式", formula]],
      expr: `${total} mod 8 = ${total % 8} → 第 ${n}`,
      out: `${tname}　${SYMBOLS[tname]}`,
      table: { head: ["数", "卦", "卦画", "爻"], rows: xtRows, hl: [n - 1] },
      src,
    });
  };
  const movingStep = (rule: string, formula: string, total: number, note: string) => {
    const mv = total % 6 || 6;
    add("moving", "定动爻", rule, {
      inputs: [["算式", formula]],
      expr: `${total} mod 6 = ${total % 6} → 第 ${mv} 爻`,
      out: `第 ${mv} 爻（${LINE_NAMES[mv - 1]}）`,
      note,
    });
  };

  if (method === "time") {
    const gz = raw.gz, wall = raw.wall, lunar = gz.lunar;
    const [y, m, d, h] = [gz.year_number, gz.month, gz.day, gz.shichen_number];
    const hm = `${pad(wall.hour)}:${pad(wall.minute)}`;
    const ymd = `${pad(wall.year, 4)}-${pad(wall.month)}-${pad(wall.day)}`;
    add("input", "取时刻", "按所填的墙上时间解读，不做时区换算——填什么时刻，就算那一刻。", {
      inputs: [["年", wall.year], ["月", wall.month], ["日", wall.day], ["时刻", hm]],
      out: `${ymd} ${hm}`,
      note: "系统只接收时刻，不接收你所问之事。",
    });
    add("shichen", "定时辰", "一日分十二时辰，每辰两小时。子时 23:00–01:00，23:00 起入子时即归次日。", {
      inputs: [["时刻", hm]],
      expr: `${hm} 落在 ${gz.shichen} 时`,
      out: `${gz.shichen}时（时支数 ${h}）`,
      note: "时支数：子 1、丑 2 … 亥 12。" + (gz.next_day ? "23 点后已归次日计。" : ""),
    });
    add("lunar", "换农历", "梅花易数年月日时起卦用农历：年取年支数（子 1 … 亥 12），月、日取农历月日。", {
      inputs: [["公历", ymd + (gz.next_day ? "（归次日）" : "")]],
      expr: `农历 ${lunar.year} 年${lunar.leap ? "闰" : ""}${m} 月 ${d} 日，${gz.year_ganzhi}年`,
      out: `年=${y}（${gz.year_branch}）　月=${m}　日=${d}　时=${h}`,
      note: "农历年以正月初一为界；闰月按其本月之数计。",
    });
    trigStep("upper", "定上卦", "上卦 =（年 + 月 + 日）mod 8，余数查先天八卦数表；余 0 作 8。",
      `(${y} + ${m} + ${d}) mod 8`, y + m + d, ["meihua"]);
    trigStep("lower", "定下卦", "下卦 =（年 + 月 + 日 + 时）mod 8，余数查先天八卦数表；余 0 作 8。",
      `(${y} + ${m} + ${d} + ${h}) mod 8`, y + m + d + h, ["meihua"]);
    movingStep("动爻 =（年 + 月 + 日 + 时）mod 6；余 1 为初爻，余 0 作 6 为上爻。",
      `(${y} + ${m} + ${d} + ${h}) mod 6`, y + m + d + h, "爻位自下而上数，初爻为第一爻。");
  } else if (method === "numbers") {
    const nums: number[] = cast.numbers;
    const total = nums.reduce((a, b) => a + b, 0);
    add("input", "报数", "报两个或三个正整数，不收任何文字。", {
      inputs: nums.map((n, i) => [`数${"一二三"[i]}`, n] as KV),
      out: nums.join(" / "),
      note: "你所想的事不进入系统，只有数字进入计算。",
    });
    trigStep("upper", "定上卦", "上卦 = 数一 mod 8，余数查先天八卦数表；余 0 作 8。", `${nums[0]} mod 8`, nums[0], ["meihua"]);
    trigStep("lower", "定下卦", "下卦 = 数二 mod 8，余数查先天八卦数表；余 0 作 8。", `${nums[1]} mod 8`, nums[1], ["meihua"]);
    movingStep("动爻 = 诸数之和 mod 6；余 1 为初爻，余 0 作 6 为上爻。", `(${nums.join(" + ")}) mod 6`, total,
      "爻位自下而上数，初爻为第一爻。");
  } else if (method === "lueshi") {
    const changes = cast.changes;
    const lefts = changes.map((c: any) => String(c.left)).join("、");
    if (cast.source === "piles") {
      add("seed", "取筮数", "亲手分筮竹：报三变时左手（天策）所余根数。", {
        inputs: [["三变左手根数", lefts]],
        out: "以所报根数计算",
        note: "五十本取一象太极，四十九本分二；右手一堆取一本挂于小指。",
      });
    } else {
      add("seed", "取种子", "以 SHA-256 链式摘要代替手分筮竹，不使用任何随机数发生器。", {
        inputs: [["种子", cast.seed ?? ""]],
        out: "三变左手根数 " + lefts,
        note: "「分而为二」的偶然，在此是可复现的摘要：同一句话永远起出同一卦。",
      });
    }
    const what = ["内卦（下卦）", "外卦（上卦）", "动爻"];
    const rows = changes.map((c: any, i: number) => [
      `第${"一二三"[c.change - 1]}变`, String(c.left), `${c.left} mod ${c.divisor} = ${c.remainder}`,
      `${c.remainder} + 1 = ${c.number}`, what[i],
      c.divisor === 8 ? TRIGRAM_ORDER[c.number - 1] : `第 ${c.number} 爻（${LINE_NAMES[c.number - 1]}）`,
    ]);
    add("triples", "三变成卦",
      "略筮法：左手之策八八数之，余数加挂一之一本为得数。第一变定内卦，第二变定外卦，第三变六六数之定动爻。", {
        inputs: [["先天数", "乾1 兑2 离3 震4 巽5 坎6 艮7 坤8"], ["爻位", "1 初爻 … 6 上爻"]],
        out: `内卦 ${TRIGRAM_ORDER[changes[0].number - 1]}、外卦 ${TRIGRAM_ORDER[changes[1].number - 1]}、动第 ${changes[2].number} 爻`,
        table: { head: ["变", "左手根数", "取余", "加挂一", "所定", "所得"], rows, hl: [] },
        src: ["takashima"],
        note: "高島先装内卦、后装外卦，自下而上；略筮法恒得一爻动。",
      });
  } else if (method === "dayan") {
    const trace: any[] = cast.trace ?? [];
    add("seed", "取种子", "以 SHA-256 链式摘要代替手分蓍草，不使用任何随机数发生器。", {
      inputs: [["种子", cast.seed ?? ""], ["蓍草", "50 本，其用 49"]],
      out: "摘要流 18 个十六位整数（每变一个）",
      note: "「分而为二」的偶然，在此是可复现的摘要：同一句话永远起出同一卦。",
    });
    const rows = trace.map((t) => {
      const st = t.stages;
      return [LINE_NAMES[t.position] + "爻", `${st[0].n}→去${st[0].removed}`, `${st[1].n}→去${st[1].removed}`,
        `${st[2].n}→去${st[2].removed}`, `${t.remaining} ÷ 4 = ${t.value}`, VALUE_NAMES[t.value]];
    });
    add("triples", "十八变成卦",
      "每爻三变：分二、挂一、揲四、归奇。第一变去 5 或 9，第二、三变去 4 或 8；三变余策 36/32/28/24，除四得 9/8/7/6。自初爻起，共六爻。", {
        inputs: [["每变所去", "挂一 + 左余 + 右余（四四揲之，余 1-4，整除余 4）"]],
        out: trace.map((t) => `${LINE_NAMES[t.position]}=${t.value}`).join("、"),
        table: { head: ["爻", "一变", "二变", "三变", "余策", "爻值"], rows, hl: [] },
        src: ["xici"],
      });
    const old = trace.filter((t) => t.value === OLD_YIN || t.value === OLD_YANG).map((t) => t.position);
    add("moving", "定动爻", "大衍筮法：老阴（6）与老阳（9）为物极必反之处，皆为动爻。", {
      inputs: [["爻值", trace.map((t) => String(t.value)).join("、")]],
      expr: old.length ? `6 与 9 出现在第 ${old.map((p) => String(p + 1)).join("、")} 爻` : "六七八九中无 6 亦无 9",
      out: old.length ? old.map((p) => LINE_NAMES[p] + "爻").join("、") : "六爻皆静，无动爻",
      note: old.length ? "动爻数不定。变卦由全部动爻一并变出；本工具录最下一动爻之辞，其余一并列出。" : "此时看卦辞与卦义，不看爻辞。",
    });
  }

  add("compose", "成六爻", "下卦三爻在下，上卦三爻在上，自下而上合成六爻。这是《周易》画卦通例。", {
    inputs: [["下卦", `${lower} ${SYMBOLS[lower]}（初、二、三爻）`], ["上卦", `${upper} ${SYMBOLS[upper]}（四、五、上爻）`]],
    out: glyphs(lines),
    table: {
      head: ["爻位", "所属", "爻性", "爻画"],
      rows: [0, 1, 2, 3, 4, 5].map((p) => [`第 ${p + 1} 爻`, p <= 2 ? "下卦 " + lower : "上卦 " + upper,
        lines[p] === 1 ? "阳" : "阴", lines[p] === 1 ? YANG_GLYPH : YIN_GLYPH]),
      hl: pos !== null ? [pos] : [],
    },
    note: "读卦自上而下，故上爻画在最上面。",
  });
  add("lookup", "查六十四卦表", "以（下卦，上卦）为键查文王卦序表，得卦名与卦序。", {
    inputs: [["键", `下 ${lower} ／ 上 ${upper}`]],
    expr: `${SYMBOLS[lower]} ＋ ${SYMBOLS[upper]} → 第 ${number} 卦`,
    out: `第 ${number} 卦　${name}`,
    src: ["yijing"],
  });
  add("judgment", "录卦辞", "卦辞为《周易》本文，逐字照录，不加改写。", {
    out: reading.judgment, src: ["yijing"], note: reading.judgment_source.location,
  });
  add("hexmeaning", "卦义主旨", "就卦象结构作整体义理阐发。此条据公版注疏撰述，非古籍原文照录。", {
    out: reading.meaning, src: ["yijing", "wangbi"],
    note: `上卦 ${upper} 为${NATURE[upper]}，下卦 ${lower} 为${NATURE[lower]}。`,
  });

  let changed: any = null;
  if (pos === null) {
    add("static", "六爻皆静", "无动爻时，看卦辞与卦义，不取爻辞。", { out: "静卦：以卦辞为主", note: "此为本工具的规则选择，不是断语。" });
  } else {
    const yang = lines[pos] === 1;
    const label = lineLabel(pos, yang);
    add("labelname", "定爻题名", "阳爻称九，阴爻称六。初爻与上爻位名置前（初九、上六），二三四五爻数名置前（九二、六三）。", {
      inputs: [["第几爻", String(pos + 1)], ["爻性", yang ? "阳" : "阴"]],
      expr: `${LINE_NAMES[pos]} ＋ ${yang ? "九" : "六"} → ${label}`,
      out: label,
    });
    const allMoving: number[] = ml.all.map((m: any) => m.position);
    const chLines = lines.map((l, i) => (allMoving.includes(i) ? 1 - l : l));
    const ch = getByLines(chLines);
    changed = {
      number: ch.number, name: ch.name, upper: ch.upper, lower: ch.lower,
      symbol: SYMBOLS[ch.upper] + SYMBOLS[ch.lower], linesBottomUp: chLines,
    };
    add("changed", "得变卦", "动爻阴阳互变，其余各爻不变，即得变卦（之卦）。", {
      inputs: [["本卦", `第 ${number} 卦 ${name}`], ["动爻", label]],
      expr: allMoving.map((p) => `第 ${p + 1} 爻由${lines[p] === 1 ? "阳" : "阴"}变为${lines[p] === 1 ? "阴" : "阳"}`).join("、"),
      out: `第 ${ch.number} 卦　${ch.name}`,
      note: "本工具只列变卦之名与其卦辞，不以变卦作任何推断。",
    });
    const ln = reading.line;
    add("linetext", "录爻辞", "爻辞为《周易》本文，逐字照录，不加改写。", { out: ln.text, src: ["yijing"], note: `${name}卦·${label}` });

    const posYang = POSITION_IS_YANG[pos];
    const center = isCenter(pos);
    const pair = (pos + 3) % 6;
    const hasYing = yang !== (lines[pair] === 1);
    const tier = pos <= 2 ? "下卦" : "上卦";
    const trig = pos <= 2 ? lower : upper;
    add("xiang", "推取象", "取象只看结构：爻性、爻位阴阳、是否得中、与应爻是否阴阳相异、所属三画卦。", {
      inputs: [["爻", `${label}（${yang ? "阳" : "阴"}）`]],
      out: ln.meaning ? ln.meaning.xiang : "",
      facts: [
        ["爻位", `第 ${pos + 1} 爻 · ${LINE_NAMES[pos]}`],
        ["爻性", yang ? "阳" : "阴"],
        ["位之阴阳", posYang ? "阳位" : "阴位"],
        [yang === posYang ? "当位" : "不当位",
          yang && posYang ? "阳居阳位" : !yang && !posYang ? "阴居阴位" : yang ? "阳居阴位" : "阴居阳位"],
        [center ? "得中" : "非中", center && pos === 1 ? "居下卦之中" : center ? "居上卦之中" : "二、五方为中"],
        [`应与第 ${pair + 1} 爻`, hasYing ? "阴阳相异，有应" : "同性，无应"],
        ["所属", `${tier} ${trig} ${SYMBOLS[trig]}`],
        ["自然象", `${NATURE[trig]} · 五行${ELEMENTS[trig]} · ${DIRECTIONS[trig]}`],
      ],
      note: "以上八项皆可由卦画直接数出，不依赖任何外部解释。",
    });
    add("li", "申义理", "义理由上一步的结构推出，落在修身处事上，不落在具体事项的成败上。", {
      out: ln.meaning ? ln.meaning.li : "",
      src: ln.meaning ? ln.meaning.sources.map((s: any) => s.id) : [],
      note: "此条据公版注疏撰述，非古籍原文照录。",
    });
  }

  add("boundary", "止于此处",
    "链条到此为止。本工具自己不判断吉凶，不预测成败，不替你回答具体事项。高島呑象对这一爻的阐发与占例，可另查 takashima，那是原书之言。", {
      out: "输出为经文与义理的结构化检索结果",
      note: "你所占何事只在你自己心里。工具给的是可以自己核对的一段文字，不是一个替你做的决定。",
    });

  return {
    method, steps,
    hexagram: { number, name, upper, lower, symbol: SYMBOLS[upper] + SYMBOLS[lower], glyphs: glyphs(lines) },
    changed,
    moving_position: pos,
    reproduce: reproduce(cast),
  };
}

function reproduce(cast: Record<string, any>): string {
  const m = cast.method;
  if (m === "time") {
    const w = cast.wall ?? {};
    return `time|${pad(w.year ?? 0, 4)}-${pad(w.month ?? 0)}-${pad(w.day ?? 0)} ${pad(w.hour ?? 0)}:${pad(w.minute ?? 0)}`;
  }
  if (m === "numbers") return "numbers|" + (cast.numbers ?? []).join(",");
  if (m === "lueshi") return cast.source === "piles" ? "lueshi-piles|" + (cast.piles ?? []).join(",") : `lueshi|${cast.seed ?? ""}`;
  if (m === "dayan") return `dayan|${cast.seed ?? ""}`;
  return m ?? "";
}

export function nextLookup(cast: Cast, chain: Record<string, any>) {
  if (cast.moving.length !== 1) return null;
  const p = cast.moving[0];
  const label = lineLabel(p, cast.lines[p] === 1);
  const n = chain.hexagram.number;
  return { number: n, position: label, command: `takashima ${n} ${label}` };
}

const numbered = (lines: string[]) => lines.map((t, i) => `${i + 1}. ${t}`);

// --- Chinese narration (guide.narrate) --------------------------------------

const trigramZh = (n: number) => {
  const name = TRIGRAM_ORDER[n - 1];
  return `${name} ${SYMBOLS[name]}（${NATURE[name]}）`;
};

function lueshiZh(cast: Cast): string[] {
  const out = [cast.source === "seed"
    ? `以你所说「${cast.seed}」代替亲手分筮竹：由它定出每一变左手的根数，其余照筮儀手续。`
    : "用你亲手分筮竹报来的左手根数，照筮儀手续计算。"];
  out.push("五十策，取一策置旁不用，象太极；余四十九策。");
  const names = ["第一变", "第二变", "第三变"];
  cast.changes.forEach((c: any, i: number) => {
    const { left, right, divisor: d, remainder: r, number: n } = c;
    const head = `${names[i]}：四十九策随手分二，左手 ${left} 策，右手 ${right} 策（象两仪）。自右手取一策，挂左手小指（象三才）。`;
    const tally = left < d ? `${left} 策不足${d === 8 ? "八" : "六"}策，即余 ${r} 策` : `${left} 策数去 ${left - r} 策，余 ${r} 策`;
    let count: string, tail: string;
    if (d === 8) {
      count = `左手之策八策一数（象四时）：${tally}；加小指一策，得 ${n}。`;
      tail = `先天数 ${n} 为${trigramZh(n)}，定${i === 0 ? "内卦（下卦）" : "外卦（上卦）"}。`;
    } else {
      count = `这一变左手之策六策一数：${tally}；加小指一策，得 ${n}。`;
      tail = `${n} 即第 ${n} 爻（${LINE_NAMES[n - 1]}爻），为动爻。`;
    }
    out.push(head + count + tail);
  });
  return out;
}

function narrateZh(cast: Cast, chain: Record<string, any>): string[] {
  const lines: string[] = [];
  for (const s of chain.steps) {
    const key = s.key;
    if (key === "seed" && chain.method === "lueshi") continue;
    if (key === "triples") {
      if (chain.method === "lueshi") lines.push(...lueshiZh(cast));
      else {
        lines.push(s.rule);
        for (const [label, a, b, c, rest, value] of s.table.rows) lines.push(`${label}：${a}，${b}，${c}；余策 ${rest}，${value}。`);
      }
      continue;
    }
    if (key === "boundary") continue;
    if (key === "compose") {
      const h = chain.hexagram;
      lines.push(`成六爻：下卦${h.lower}在下，上卦${h.upper}在上，自上而下画作 ${s.out}`);
      continue;
    }
    const expr: string = s.expr ?? "", res: string = s.out ?? "";
    let body: string;
    const words = res.replace(/　/g, " ").trim().split(/\s+/);
    if (expr && res && !expr.includes(words[words.length - 1])) body = `${expr}，得 ${res}`;
    else body = expr || res || s.rule;
    lines.push(`${s.title}：${body}`);
  }
  const nxt = nextLookup(cast, chain);
  if (nxt) lines.push(`查高島原书：${chain.hexagram.name}卦${nxt.position}，看高島对这一爻的阐发与占例。`);
  return numbered(lines);
}

// --- English narration (english.narrate) ------------------------------------

function lineTitleEn(p: number, yang: boolean, label: string) {
  const where = p === 0 ? " (bottom)" : p === 5 ? " (top)" : "";
  return `the ${ORDINAL[p]} line${where}, ${yang ? "yang" : "yin"} — ${label}`;
}

function triEn(x: number) {
  const r = x % 8 || 8;
  return `${x} ÷ 8 leaves ${x % 8}${x % 8 === 0 ? " (counted as 8)" : ""} → ${trigramTitleEn(TRIGRAM_ORDER[r - 1])}`;
}

function tailEn(cast: Cast, chain: Record<string, any>): string[] {
  const n = chain.hexagram.number;
  const h = getByNumber(n);
  const lines = linesOf(h);
  const out = [
    `Stack the trigrams: ${trigramTitleEn(h.lower)} below, ${trigramTitleEn(h.upper)} above. Drawn top to bottom: ${chain.hexagram.glyphs}`,
    `Look up the pair in the table of 64: ${hexagramTitleEn(n)}.`,
    `The judgment (Legge): ${legge(n).judgment}`,
  ];
  const moving = cast.moving;
  if (!moving.length) {
    out.push("No line is moving: read the judgment as a whole.");
    return out;
  }
  for (const p of moving) {
    out.push(`Moving line: ${lineTitleEn(p, lines[p] === 1, lineLabel(p, lines[p] === 1))}. Legge: ${legge(n, p).line}`);
  }
  if (chain.changed) {
    let turn: string;
    if (moving.length === 1) {
      const was = lines[moving[0]] === 1 ? "yang" : "yin";
      turn = `The moving line turns from ${was} to ${was === "yang" ? "yin" : "yang"}`;
    } else turn = "Each moving line turns to its opposite";
    out.push(`${turn}, giving the changed hexagram: ${hexagramTitleEn(chain.changed.number)}.`);
  }
  if (moving.length === 1) {
    const p = moving[0];
    out.push(`Next: Takashima's commentary on hexagram ${n}, ${lineLabel(p, lines[p] === 1)}.`);
  }
  return out;
}

function narrateEn(cast: Cast, chain: Record<string, any>): string[] {
  const out: string[] = [];
  if (chain.method === "lueshi") {
    out.push(cast.source === "seed"
      ? `Your phrase “${cast.seed}” stands in for splitting the stalks by hand: it fixes how many stalks fall in the left hand at each change. Everything else follows Takashima's procedure.`
      : "Using the left-hand counts you reported from splitting the stalks yourself, following Takashima's procedure.");
    out.push("Of 50 stalks, one is set aside unused (it stands for the Great Ultimate). 49 remain.");
    cast.changes.forEach((c: any, i: number) => {
      const { left, right, divisor: d, remainder: r, number: n } = c;
      const plural = d === 8 ? "eights" : "sixes";
      const tally = left < d ? `${left} is fewer than ${d}, so ${r} remain` : `${left} counted off by ${plural} leaves ${r}`;
      let s = `${["First", "Second", "Third"][i]} change: the 49 stalks are split at random, ${left} in the left hand and ` +
        `${right} in the right (the two forces). One stalk is taken from the right and held in the left hand ` +
        `(heaven, earth and humanity). The left-hand stalks are counted off in ${plural}: ${tally}. ` +
        `Adding the held stalk gives ${n}. `;
      if (d === 8) {
        s += `In the Earlier Heaven numbering, ${n} is ${trigramTitleEn(TRIGRAM_ORDER[n - 1])}: this is the ` +
          `${i === 0 ? "lower (inner)" : "upper (outer)"} trigram.`;
      } else s += `${n} means the ${ORDINAL[n - 1]} line from the bottom is the moving line.`;
      out.push(s);
    });
  } else if (chain.method === "numbers") {
    const mv = cast.moving_from, m = mv % 6 || 6;
    out.push(
      `Your numbers: ${cast.numbers.join(" and ")}.`,
      `Upper trigram from the first number: ${triEn(cast.upper_from)}.`,
      `Lower trigram from the second number: ${triEn(cast.lower_from)}.`,
      `Moving line from the total ${mv}: ${mv} ÷ 6 leaves ${mv % 6}${mv % 6 === 0 ? " (counted as 6)" : ""} → the ${ORDINAL[m - 1]} line.`,
    );
  } else if (chain.method === "time") {
    const gz = cast.gz, w = cast.wall, up = cast.upper_from, lo = cast.lower_from, m = lo % 6 || 6;
    out.push(`The moment: ${w.year}-${pad(w.month)}-${pad(w.day)} ${pad(w.hour)}:${pad(w.minute)}.`);
    if (gz.next_day) out.push("At 23:00 or later the new day has begun (the Zi double-hour), so the next day's date is used.");
    out.push(
      `Double-hour: ${gz.shichen} (number ${gz.shichen_number}).`,
      `Chinese lunar date: year ${gz.year_ganzhi} (branch ${gz.year_branch}, number ${gz.year_number}), month ${gz.month}, day ${gz.day}.`,
      `Upper trigram from year + month + day = ${up}: ${triEn(up)}.`,
      `Lower trigram adding the hour, ${up} + ${gz.shichen_number} = ${lo}: ${triEn(lo)}.`,
      `Moving line: ${lo} ÷ 6 leaves ${lo % 6}${lo % 6 === 0 ? " (counted as 6)" : ""} → the ${ORDINAL[m - 1]} line.`,
    );
  } else {
    const names: Record<number, string> = { 6: "old yin (moving)", 7: "young yang", 8: "young yin", 9: "old yang (moving)" };
    out.push(`Your phrase “${cast.seed}” stands in for the random splits. Each line takes three changes: split the ` +
      "49 stalks, hang one, count both piles by fours, and set the remainders aside. 49 − first change − second − " +
      "third leaves 36, 32, 28 or 24, which divided by 4 gives 9, 8, 7 or 6.");
    for (const t of cast.trace) {
      const st = t.stages.map((s: any) => `${s.n} − ${s.removed}`).join(", ");
      out.push(`The ${ORDINAL[t.position]} line: ${st} → ${t.remaining} remain, ÷ 4 = ${t.value}, ${names[t.value]}.`);
    }
  }
  return numbered([...out, ...tailEn(cast, chain)]);
}

// --- Japanese narration (japanese.narrate) ----------------------------------

const triJa = (x: number) =>
  `${x} を 8 で割って余り ${x % 8}${x % 8 === 0 ? "（0 は 8 とする）" : ""} → ${trigramTitleJa(TRIGRAM_ORDER[(x % 8 || 8) - 1])}`;
const mvJa = (x: number) => `${x} を 6 で割って余り ${x % 6}${x % 6 === 0 ? "（0 は 6 とする）" : ""} → ${POS_JA[(x % 6 || 6) - 1]}`;

function narrateJa(cast: Cast, chain: Record<string, any>): string[] {
  const out: string[] = [];
  if (chain.method === "lueshi") {
    out.push(cast.source === "seed"
      ? `お知らせいただいた「${cast.seed}」を、筮竹を手で分ける代わりに用います。各変の左手の本数がこれで決まり、ほかは筮儀の手順どおりです。`
      : "ご自身で筮竹を分けて得た左手の本数で、筮儀の手順どおりに計算します。");
    out.push("五十本のうち一本を脇に置いて用いません（太極）。残りは四十九本。");
    cast.changes.forEach((c: any, i: number) => {
      const { left, right, divisor: d, remainder: r, number: n } = c;
      const tally = left < d ? `${left} 本は ${d} 本に満たないので余り ${r} 本` : `${left} 本から ${left - r} 本を払って余り ${r} 本`;
      let s = `${["第一変", "第二変", "第三変"][i]}：四十九本を無心に二分し、左手 ${left} 本、右手 ${right} 本（両儀）。` +
        "右手から一本取って左手の小指に挟む（三才）。";
      if (d === 8) {
        s += `左手の筮竹を八本ずつ払う（四時）：${tally}。小指の一本を加えて ${n}。` +
          `先天数 ${n} は${trigramTitleJa(TRIGRAM_ORDER[n - 1])}、${i === 0 ? "内卦（下卦）" : "外卦（上卦）"}とする。`;
      } else s += `左手の筮竹を六本ずつ払う：${tally}。小指の一本を加えて ${n}。${n} は${POS_JA[n - 1]}、これを動爻とする。`;
      out.push(s);
    });
  } else if (chain.method === "numbers") {
    out.push(
      `お知らせいただいた数：${cast.numbers.join("、")}。`,
      `上卦は第一の数から：${triJa(cast.upper_from)}。`,
      `下卦は第二の数から：${triJa(cast.lower_from)}。`,
      `動爻は数の合計 ${cast.moving_from} から：${mvJa(cast.moving_from)}。`,
    );
  } else if (chain.method === "time") {
    const gz = cast.gz, w = cast.wall, up = cast.upper_from, lo = cast.lower_from;
    out.push(`時刻：${w.year}年${w.month}月${w.day}日 ${pad(w.hour)}:${pad(w.minute)}。`);
    if (gz.next_day) out.push("23 時以降は子の刻で翌日に属するため、翌日の日付で計算します。");
    out.push(
      `時辰：${gz.shichen}の刻（時支数 ${gz.shichen_number}）。`,
      `旧暦（中国暦）：${gz.year_ganzhi}年（年支 ${gz.year_branch}＝${gz.year_number}）${gz.month}月${gz.day}日。`,
      `上卦は 年＋月＋日 ＝ ${up}：${triJa(up)}。`,
      `下卦はこれに時支数を加えて ${up}＋${gz.shichen_number} ＝ ${lo}：${triJa(lo)}。`,
      `動爻：${mvJa(lo)}。`,
    );
  } else {
    const names: Record<number, string> = { 6: "老陰（動）", 7: "少陽", 8: "少陰", 9: "老陽（動）" };
    out.push(`「${cast.seed}」を筮竹を分ける代わりに用います。一爻ごとに三変：分二・掛一・揲四・帰奇。` +
      "三変後の残りは 36・32・28・24 本で、4 で割って 9・8・7・6 となります。");
    for (const t of cast.trace) {
      const st = t.stages.map((s: any) => `${s.n}−${s.removed}`).join("、");
      out.push(`${POS_JA[t.position]}：${st} → 残り ${t.remaining} 本、÷4 ＝ ${t.value}、${names[t.value]}。`);
    }
  }
  const n = chain.hexagram.number;
  const h = getByNumber(n);
  const lines = linesOf(h);
  out.push(
    `卦を組む：下に${trigramTitleJa(h.lower)}、上に${trigramTitleJa(h.upper)}。上から描くと ${chain.hexagram.glyphs}`,
    `六十四卦表で引く：${hexagramTitleJa(n)}。`,
    `卦辞：${judgmentKanji(n)}`,
  );
  const moving = cast.moving;
  if (!moving.length) out.push("動爻なし：卦辞を全体として読みます。");
  for (const p of moving) out.push(`動爻：${POS_JA[p]}（${lineLabel(p, lines[p] === 1)}）。爻辞：${lineKanji(n, p)}`);
  if (chain.changed) {
    const c = chain.changed.number;
    if (moving.length === 1) {
      const was = lines[moving[0]] === 1 ? "陽" : "陰";
      out.push(`動爻が${was}から${was === "陽" ? "陰" : "陽"}に変じ、之卦は ${hexagramTitleJa(c)}。`);
    } else out.push(`動爻がそれぞれ陰陽を変じ、之卦は ${hexagramTitleJa(c)}。`);
  }
  if (moving.length === 1) {
    const p = moving[0];
    out.push(`次に：${T.hexagram_ja[String(n)][0]}・${lineLabel(p, lines[p] === 1)}についての高島の解釈を参照します。`);
  }
  return numbered(out);
}

export function narrate(cast: Cast, chain: Record<string, any>, lang: string): string[] {
  if (lang === "en") return narrateEn(cast, chain);
  if (lang === "ja") return narrateJa(cast, chain);
  return narrateZh(cast, chain);
}
