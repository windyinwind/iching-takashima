// The same commands as skills/zhouyi-lookup/scripts/zy.py, as functions.
// Each returns the object zy.py prints, or throws EngineError with zy.py's error message.
import { HEXAGRAMS, T } from "./data.ts";
import { type Cast, EngineError, castDayan, castLueshi, castNumbers, castTime, parseIso, render } from "./core.ts";
import { build, narrate, nextLookup } from "./chain.ts";
import { SOURCES, commentary, fullReading, hexagramTitleEn, hexagramTitleJa, legge, readExtraJa, takashimaExtraJa } from "./reading.ts";

export { EngineError } from "./core.ts";
export const VERSION = "1.4.0";
export type Lang = "zh" | "en" | "ja";

export type CastInput = {
  seed?: string;
  piles?: (string | number)[];
  numbers?: (string | number)[];
  at?: string;
  variant?: string;
};

/** Python int() for the strings zy.py receives on its command line. */
function pyInt(x: string | number): number {
  if (typeof x === "number") {
    if (!Number.isInteger(x)) throw new EngineError(`invalid literal for int() with base 10: '${x}'`);
    return x;
  }
  const s = x.trim().replace(/_/g, "");
  if (!/^[+-]?\d+$/.test(s)) throw new EngineError(`invalid literal for int() with base 10: '${x}'`);
  return parseInt(s, 10);
}

/** zy.py _build_cast: numbers, then piles, then seed, then at. */
export function buildCast(a: CastInput): Cast {
  if (a.numbers && a.numbers.length) {
    let nums: number[];
    try {
      nums = a.numbers.map(pyInt);
    } catch {
      throw new EngineError("数字起卦只接受整数，收到：" + a.numbers.join(" "));
    }
    return castNumbers(nums);
  }
  if (a.piles && a.piles.length) {
    if (a.piles.length !== 3) throw new EngineError("略筮法需三个整数：三变时左手（天策）的根数");
    return castLueshi(null, a.piles.map(pyInt));
  }
  if (a.seed) return castDayan(a.seed, a.variant ?? "lueshi");
  if (a.at) return castTime(parseIso(a.at));
  throw new EngineError("请指定 --at / --numbers / --seed / --piles 之一。");
}

export function cast(a: CastInput & { trace?: boolean }) {
  return render(buildCast(a), !!a.trace);
}

export function chain(a: CastInput & { lang?: Lang }) {
  const raw = buildCast(a);
  const out = build(raw);
  out.narration = narrate(raw, out, a.lang ?? "zh");
  out.next = nextLookup(raw, out);
  return out;
}

export const guide = (lang: Lang = "zh") => structuredClone(T.preparation[lang] ?? T.preparation.zh);

const checkNumber = (n: number) => {
  if (!Number.isInteger(n) || n < 1 || n > 64) throw new EngineError(`卦序须在 1-64 之间，收到 ${n}。`);
};

export function read(number: number, position: string | null = null, lang: Lang = "zh") {
  checkNumber(number);
  const out = fullReading(number, position);
  if (lang === "en") out.english = { title: hexagramTitleEn(number), ...legge(number, position) };
  else if (lang === "ja") out.japanese = readExtraJa(number, position);
  return out;
}

export function takashima(number: number, position: string | null = null, lang: Lang = "zh", all = false) {
  checkNumber(number);
  const out = commentary(number, position, all);
  if (lang === "en") {
    out.english = {
      title: hexagramTitleEn(number),
      language_note: "Takashima's text exists in Chinese only (Wang Zhiben's translation). Translate it for the user and label it as your own translation.",
    };
  } else if (lang === "ja") out.japanese = takashimaExtraJa(number);
  return out;
}

/** A hexagram's display title in each language, e.g. "Hexagram 4 Meng 蒙 (Youthful Ignorance)". */
export function title(number: number, lang: Lang = "zh"): string {
  checkNumber(number);
  if (lang === "en") return hexagramTitleEn(number);
  if (lang === "ja") return hexagramTitleJa(number);
  return `第 ${number} 卦　${HEXAGRAMS[number - 1].name}`;
}

export const list = () => HEXAGRAMS.map((h) => ({ number: h.number, name: h.name, upper: h.upper, lower: h.lower, judgment: h.judgment }));
export const sources = () => SOURCES;
