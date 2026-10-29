// Port of interpretation.full_reading, english.legge / titles, japanese read_extra / titles,
// and takashima.commentary.
import { LEGGE, LINE_MEANING, TAKASHIMA, TRAD, T } from "./data.ts";
import { EngineError, SYMBOLS, getByNumber, lineLabel, linesOf, normalizePosition } from "./core.ts";

export const SOURCES: Record<string, any> = T.sources;
const NATURE: Record<string, string> = T.nature;
const ELEMENTS: Record<string, string> = T.elements;
const DIRECTIONS: Record<string, string> = T.directions;
const FAMILY: Record<string, string> = T.family;
const CREATURES: Record<string, string> = T.creatures;

const isYangAt = (number: number, p: number) => linesOf(getByNumber(number))[p] === 1;

function lineMeaning(number: number, position: number) {
  const rows = LINE_MEANING[String(number)];
  if (!rows || position >= rows.length) return null;
  const row = rows[position];
  return {
    xiang: row.x,
    li: row.l,
    sources: row.s.map((s) => ({ id: s, work: SOURCES[s]?.title ?? s, status: SOURCES[s]?.status ?? "" })),
  };
}

function lineCommentary(number: number, pos: number | string) {
  const position = normalizePosition(pos);
  const h = getByNumber(number);
  const yang = isYangAt(number, position);
  const t = position <= 2 ? h.lower : h.upper;
  return {
    position,
    label: lineLabel(position, yang),
    text: h.lines[position],
    meaning: lineMeaning(number, position),
    trigram: {
      name: t, tier: position <= 2 ? "下卦" : "上卦", symbol: SYMBOLS[t], nature: NATURE[t],
      element: ELEMENTS[t], direction: DIRECTIONS[t], family: FAMILY[t], creature: CREATURES[t],
    },
    text_source: { work: SOURCES.yijing.title, location: `${h.name}卦·${lineLabel(position, yang)}`, status: SOURCES.yijing.status },
    commentary_source: { work: SOURCES.wangbi.title, note: SOURCES.wangbi.note, status: SOURCES.wangbi.status },
    method_source: { work: SOURCES.takashima.title, note: "义理阐发方法参照，不采用其占断结论与应验回溯", status: SOURCES.takashima.status },
  };
}

const nature = (t: string) => ({ name: t, symbol: SYMBOLS[t], nature: NATURE[t], element: ELEMENTS[t], direction: DIRECTIONS[t] });

export function fullReading(number: number, position: number | string | null = null): Record<string, any> {
  const h = getByNumber(number);
  const out: Record<string, any> = {
    hexagram: { number: h.number, name: h.name, upper: h.upper, lower: h.lower, symbol: SYMBOLS[h.upper] + " " + SYMBOLS[h.lower] },
    judgment: h.judgment,
    judgment_source: { work: SOURCES.yijing.title, location: `${h.name}卦·卦辞`, status: SOURCES.yijing.status },
    meaning: T.hexagram_meaning[h.name] ?? "",
    upper_nature: nature(h.upper),
    lower_nature: nature(h.lower),
  };
  if (h.yong) {
    out.yong = {
      label: h.yong.label, text: h.yong.text,
      source: { work: SOURCES.yijing.title, location: `${h.name}卦·${h.yong.label}`, status: SOURCES.yijing.status },
    };
  }
  if (position === null) out.lines = [0, 1, 2, 3, 4, 5].map((i) => lineCommentary(number, i));
  else out.line = lineCommentary(number, position);
  out.disclaimer = "本输出为《周易》经文与义理的结构化检索结果，不含吉凶预测，不构成对任何具体事项的判断。";
  return out;
}

// --- English ---------------------------------------------------------------

export const ORDINAL = ["first", "second", "third", "fourth", "fifth", "sixth"];

export function hexagramTitleEn(number: number): string {
  const [pinyin, gloss] = T.hexagram_en[String(number)];
  return `Hexagram ${number} ${pinyin} ${getByNumber(number).name} (${gloss})`;
}

export function trigramTitleEn(name: string): string {
  const [pinyin, nat] = T.trigram_en[name];
  return `${pinyin} ${SYMBOLS[name]} (${nat})`;
}

const YONG = new Set(["用", "用九", "用六", "yong"]);

export function legge(number: number, position: number | string | null = null): Record<string, any> {
  const d = LEGGE[String(number)];
  const m = LEGGE._meta;
  const out: Record<string, any> = { legge_name: d.name, source: { work: m.work, translator: m.translator, status: m.status } };
  if (position === null) {
    out.judgment = d.judgment;
    out.lines = d.lines;
    if (d.yong) out.yong = d.yong;
    return out;
  }
  if (typeof position === "string" && YONG.has(position.trim())) {
    if (!d.yong) throw new EngineError(`hexagram ${number} has no 用九/用六 text`);
    out.yong = d.yong;
    return out;
  }
  out.line = d.lines[normalizePosition(position)];
  return out;
}

// --- Japanese --------------------------------------------------------------

export const POS_JA = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

export function hexagramTitleJa(number: number): string {
  const [name, yomi] = T.hexagram_ja[String(number)];
  return `第${number}卦 ${name}（${yomi}）`;
}

export function trigramTitleJa(name: string): string {
  const [kanji, yomi, zou] = T.trigram_ja[name];
  return `${kanji}（${yomi}）${SYMBOLS[name]}・${zou}`;
}

export const judgmentKanji = (number: number): string => TRAD[String(number)].judgment;
export const lineKanji = (number: number, pos: number | string): string => TRAD[String(number)].lines[normalizePosition(pos)];

export function readExtraJa(number: number, position: number | string | null = null): Record<string, any> {
  const out: Record<string, any> = { title: hexagramTitleJa(number), judgment: judgmentKanji(number) };
  if (position === null) out.lines = TRAD[String(number)].lines;
  else out.line = lineKanji(number, position);
  out.note = "経文は漢文原文（旧字体）。書き下し文や現代語訳を添える場合は、アシスタントの訳と明記すること。";
  return out;
}

export const takashimaExtraJa = (number: number) => ({
  title: hexagramTitleJa(number),
  language_note: "原書は明治19年刊の日本語（漢文訓読体）。本データは王治本による漢訳で、引用を和訳する場合は重訳となる。アシスタントの訳と明記すること。",
});

// --- Takashima -------------------------------------------------------------

const SENSITIVE_TOPICS = new Set<string>(T.sensitive_topics);
const SENSITIVE_TAGS = new Set<string>(T.sensitive_tags);

function castLabel(c: any): string | null {
  if (!c.ben) return null;
  const ben = getByNumber(c.ben).name;
  return c.zhi ? ben + "之" + getByNumber(c.zhi).name : ben;
}

export function commentary(number: number, position: string | number | null = null, includeSensitive = false): Record<string, any> {
  const h = getByNumber(number);
  const entry = TAKASHIMA[String(number)];
  let page: any, part: string;
  if (position === null) {
    page = entry.judgment; part = "卦辞";
  } else if (typeof position === "string" && YONG.has(position.trim())) {
    if (!entry.yong) throw new EngineError(`${h.name}卦无用九、用六`);
    page = entry.yong; part = h.yong!.label;
  } else {
    const p = normalizePosition(position);
    page = entry.lines[p]; part = lineLabel(p, isYangAt(number, p));
  }
  let zhan = page.zhan, cases = page.cases;
  if (!includeSensitive) {
    zhan = zhan.filter((z: any) => !SENSITIVE_TOPICS.has(z.topic));
    cases = cases.filter((c: any) => !c.tags.some((t: string) => SENSITIVE_TAGS.has(t)));
  }
  const outCases = cases.map((c: any) => {
    const item: any = { cast: castLabel(c), text: c.text, tags: c.tags };
    if (c.moving !== null && c.moving !== undefined && c.ben) item.moving = lineLabel(c.moving, isYangAt(c.ben, c.moving));
    return item;
  });
  const m = TAKASHIMA._meta;
  return {
    hexagram: { number, name: h.name },
    part,
    heading: page.heading ?? null,
    commentary: page.commentary,
    zhan_general: page.zhan_general,
    zhan,
    cases: outCases,
    omitted: { zhan: page.zhan.length - zhan.length, cases: page.cases.length - cases.length },
    source: { work: m.work, author: m.author, translator: m.translator, location: `${h.name}卦·${part}` },
    note: "以上为高島呑象原书之辞（王治本汉译），系明治时期的占断与实录，照录原文，不代表对当下任何具体事项的判断。",
  };
}
