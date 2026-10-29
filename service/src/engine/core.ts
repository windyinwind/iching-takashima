// Port of zhouyi/trigrams.py, hexagrams.py, calendar.py and casting.py.
// Same inputs give the same outputs as the Python engine; tests/parity.test.ts checks this.
import { HEXAGRAMS, T, type Hexagram } from "./data.ts";
import { sha256 } from "./sha256.ts";

export class EngineError extends Error {}

export const TRIGRAM_ORDER = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
export const TRIGRAMS: Record<string, number[]> = T.trigrams;
export const SYMBOLS: Record<string, string> = T.symbols;
export const LINE_NAMES = ["初", "二", "三", "四", "五", "上"];

export const OLD_YIN = 6, YOUNG_YANG = 7, YOUNG_YIN = 8, OLD_YANG = 9;
export const STALKS_TOTAL = 50, STALKS_USED = 49;
export const VALUE_NAMES: Record<number, string> = {
  6: "老阴（交）", 7: "少阳（单）", 8: "少阴（拆）", 9: "老阳（重）",
};

/** Python's % for integers: the result takes the divisor's sign. */
export const pmod = (a: number, b: number) => ((a % b) + b) % b;
export const pad = (n: number, w = 2) => String(n).padStart(w, "0");

// ---------------------------------------------------------------------------
// hexagrams
// ---------------------------------------------------------------------------

const BY_NUMBER = new Map(HEXAGRAMS.map((h) => [h.number, h]));
const BY_PAIR = new Map(HEXAGRAMS.map((h) => [h.lower + h.upper, h]));

export function getByNumber(n: number): Hexagram {
  const h = BY_NUMBER.get(n);
  if (!h) throw new EngineError(`'hexagram ${n} not found (valid range 1-64)'`);
  return h;
}

export function buildTrigram(b: number, m: number, t: number): string {
  for (const [name, v] of Object.entries(TRIGRAMS)) if (v[0] === b && v[1] === m && v[2] === t) return name;
  throw new EngineError(`invalid trigram: (${b}, ${m}, ${t})`);
}

export function getByLines(lines: number[]): Hexagram {
  const lower = buildTrigram(lines[0], lines[1], lines[2]);
  const upper = buildTrigram(lines[3], lines[4], lines[5]);
  return BY_PAIR.get(lower + upper)!;
}

export const linesOf = (h: Hexagram) => [...TRIGRAMS[h.lower], ...TRIGRAMS[h.upper]];

const POSITION_ALIASES: Record<string, number> = {
  "初": 0, "二": 1, "三": 2, "四": 3, "五": 4, "上": 5,
  "初九": 0, "九二": 1, "九三": 2, "九四": 3, "九五": 4, "上九": 5,
  "初六": 0, "六二": 1, "六三": 2, "六四": 3, "六五": 4, "上六": 5,
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 5,
};

/** Python repr() of a str, enough for the error messages that quote user input. */
export const pyRepr = (s: string) => (s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);

export function normalizePosition(pos: number | string): number {
  let p: number;
  if (typeof pos === "string") {
    const key = pos.trim();
    if (key in POSITION_ALIASES) return POSITION_ALIASES[key];
    if (!/^\s*[+-]?\d+\s*$/.test(key)) {
      throw new EngineError(
        `invalid line position ${pyRepr(pos)}; use 0-5 (0=初爻, 5=上爻), 6 (上爻 alias), or a line name (初/二/三/四/五/上, 初九/九二…, 初六/六二…)`);
    }
    p = parseInt(key, 10);
  } else {
    p = pos;
  }
  if (p >= 0 && p <= 5) return p;
  if (p === 6) return 5;
  const shown = typeof pos === "string" ? pyRepr(pos) : String(pos);
  throw new EngineError(`line position must be 0-5 (0=初爻, 5=上爻) or 6 (上爻 alias), got ${shown}`);
}

export function lineLabel(position: number, isYang: boolean): string {
  const prefix = isYang ? "九" : "六";
  if (position === 0) return "初" + prefix;
  if (position === 5) return "上" + prefix;
  return prefix + LINE_NAMES[position];
}

// ---------------------------------------------------------------------------
// calendar
// ---------------------------------------------------------------------------

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const LUNAR_YEARS: number[] = T.lunar_years;
const LUNAR_BASE = Date.UTC(1900, 0, 31);
const DAY = 86400000;

function yearMonths(year: number): [number, boolean, number][] {
  const info = LUNAR_YEARS[year - 1900];
  const leap = info >> 13;
  const out: [number, boolean, number][] = [];
  let i = 0;
  for (let m = 1; m <= 12; m++) {
    out.push([m, false, info & (1 << i) ? 30 : 29]);
    i++;
    if (m === leap) {
      out.push([m, true, info & (1 << i) ? 30 : 29]);
      i++;
    }
  }
  return out;
}

function solarToLunar(utcDays: number) {
  let offset = Math.round((utcDays - LUNAR_BASE) / DAY);
  if (offset < 0) throw new EngineError("日期早于 1900-01-31，超出农历表范围");
  for (let y = 1900; y < 1900 + LUNAR_YEARS.length; y++) {
    for (const [m, leap, days] of yearMonths(y)) {
      if (offset < days) return { year: y, month: m, day: offset + 1, leap };
      offset -= days;
    }
  }
  throw new EngineError("日期晚于农历 2100 年，超出农历表范围");
}

export type Wall = { year: number; month: number; day: number; hour: number; minute: number; second: number; micro: number; offset: string };

function gzNumbers(w: Wall) {
  const idx = Math.floor((w.hour + 1) / 2) % 12;
  const next = w.hour >= 23;
  const lunar = solarToLunar(Date.UTC(w.year, w.month - 1, w.day) + (next ? DAY : 0));
  const y = lunar.year - 1984;
  return {
    lunar,
    next_day: next,
    year_ganzhi: STEMS[pmod(y, 10)] + BRANCHES[pmod(y, 12)],
    year_branch: BRANCHES[pmod(y, 12)],
    year_number: pmod(y, 12) + 1,
    month: lunar.month,
    day: lunar.day,
    shichen: BRANCHES[idx],
    shichen_number: idx + 1,
  };
}

const PARSE_ERR = (s: string) => `时间格式无法解析：${s}\n需 ISO 8601 且带时区，如 2026-10-04T00:35:27+08:00`;

/** Parse an ISO 8601 time the way zy.py does (Z accepted; an offset is required). */
export function parseIso(input: string): Wall {
  const iso = input.replace(/Z/g, "+00:00");
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2})(?::(\d{2})(?::(\d{2})(?:[.,](\d{1,6}))?)?)?(?:([+-])(\d{2})(?::?(\d{2}))?)?)?$/.exec(iso);
  if (!m) throw new EngineError(PARSE_ERR(input));
  const [year, month, day] = [+m[1], +m[2], +m[3]];
  const hour = m[4] ? +m[4] : 0, minute = m[5] ? +m[5] : 0, second = m[6] ? +m[6] : 0;
  const micro = m[7] ? +m[7].padEnd(6, "0") : 0;
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > dim || hour > 23 || minute > 59 || second > 59) {
    throw new EngineError(PARSE_ERR(input));
  }
  if (!m[8]) throw new EngineError("时间必须带时区偏移（如 +08:00 或 Z），否则结果不可复现。");
  const oh = +m[9], om = m[10] ? +m[10] : 0;
  if (oh > 23 || om > 59) throw new EngineError(PARSE_ERR(input));
  return { year, month, day, hour, minute, second, micro, offset: `${m[8]}${pad(oh)}:${pad(om)}` };
}

const isoformat = (w: Wall) =>
  `${pad(w.year, 4)}-${pad(w.month)}-${pad(w.day)}T${pad(w.hour)}:${pad(w.minute)}:${pad(w.second)}` +
  (w.micro ? "." + pad(w.micro, 6) : "") + w.offset;

// ---------------------------------------------------------------------------
// casting
// ---------------------------------------------------------------------------

export type Cast = Record<string, any> & { lines: number[]; values: number[]; moving: number[]; method: string };

const numToTrigram = (n: number) => TRIGRAM_ORDER[(pmod(n, 8) || 8) - 1];
const movingIndex = (n: number) => (pmod(n, 6) || 6) - 1;
const compose = (lower: string, upper: string) => [...TRIGRAMS[lower], ...TRIGRAMS[upper]];

function oneMovingValues(lines: number[], idx: number): number[] {
  const v = lines.map((l) => (l === 1 ? YOUNG_YANG : YOUNG_YIN));
  v[idx] = lines[idx] === 1 ? OLD_YANG : OLD_YIN;
  return v;
}

const enc = new TextEncoder();

function stream(seed: string, n: number): number[] {
  const out: number[] = [];
  for (let counter = 0; out.length < n; counter++) {
    const d = sha256(enc.encode(`${seed}#${counter}`));
    for (let i = 0; i < d.length && out.length < n; i += 2) out.push((d[i] << 8) | d[i + 1]);
  }
  return out;
}

const split = (draw: number, n: number) => (draw % (n - 1)) + 1;

export function castLueshi(seed: string | null, piles?: number[]): Cast {
  let source: string;
  if (piles) {
    if (piles.length !== 3 || !piles.every(Number.isInteger)) throw new EngineError("略筮法需三个整数：三变时左手（天策）的根数");
    if (!piles.every((p) => p >= 1 && p <= STALKS_USED - 1)) {
      throw new EngineError("每变左手根数须在 1-48 之间（49 本分二，右手至少留一本挂一）");
    }
    source = "piles";
  } else {
    if (seed === null) throw new EngineError("略筮法需 seed 或 piles");
    piles = stream(seed, 3).map((d) => split(d, STALKS_USED));
    source = "seed";
  }
  const changes = piles.map((left, i) => {
    const mod = i < 2 ? 8 : 6;
    const remainder = left % mod;
    return { change: i + 1, left, right: STALKS_USED - left, divisor: mod, remainder, number: remainder + 1 };
  });
  const lower = TRIGRAM_ORDER[changes[0].number - 1];
  const upper = TRIGRAM_ORDER[changes[1].number - 1];
  const idx = changes[2].number - 1;
  const lines = compose(lower, upper);
  return {
    lines, values: oneMovingValues(lines, idx), moving: [idx], method: "lueshi", variant: "lueshi",
    source, seed: source === "seed" ? seed : null, piles: [...piles], changes,
  };
}

function dayanChange(n: number, draw: number) {
  const left = split(draw, n);
  const right = n - left;
  const leftRem = left % 4 || 4;
  const rightRem = (right - 1) % 4 || 4;
  const removed = 1 + leftRem + rightRem;
  return { n, left, right, left_rem: leftRem, right_rem: rightRem, removed, remaining: n - removed };
}

export function castDayan(seed: string, variant = "dayan"): Cast {
  if (variant === "shaoban") variant = "lueshi";
  if (variant === "lueshi") return castLueshi(seed);
  if (variant !== "dayan") throw new EngineError("variant must be 'lueshi' or 'dayan'");
  const draw = stream(seed, 18);
  const lines: number[] = [], values: number[] = [], trace: any[] = [];
  let k = 0;
  for (let pos = 0; pos < 6; pos++) {
    let n = STALKS_USED;
    const stages = [];
    for (let j = 0; j < 3; j++) {
      const st = dayanChange(n, draw[k++]);
      stages.push(st);
      n = st.remaining;
    }
    const value = Math.floor(n / 4);
    values.push(value);
    lines.push(value === YOUNG_YANG || value === OLD_YANG ? 1 : 0);
    trace.push({ position: pos, value, remaining: n, stages });
  }
  return {
    lines, values, moving: values.flatMap((v, i) => (v === OLD_YIN || v === OLD_YANG ? [i] : [])),
    method: "dayan", variant: "dayan", seed, stalks: STALKS_TOTAL, trace,
  };
}

export function castNumbers(nums: number[]): Cast {
  if (nums.length < 2 || nums.length > 3) throw new EngineError("数字起卦需报两个或三个正整数");
  if (!nums.every((n) => n > 0)) throw new EngineError("数字起卦只接受正整数");
  const upper = numToTrigram(nums[0]);
  const lower = numToTrigram(nums[1]);
  const total = nums.reduce((a, b) => a + b, 0);
  const idx = movingIndex(total);
  const lines = compose(lower, upper);
  return {
    lines, values: oneMovingValues(lines, idx), moving: [idx], method: "numbers",
    numbers: [...nums], upper_from: nums[0], lower_from: nums[1], moving_from: total,
  };
}

export function castTime(w: Wall): Cast {
  const gz = gzNumbers(w);
  const [y, m, d, h] = [gz.year_number, gz.month, gz.day, gz.shichen_number];
  const upperN = y + m + d, lowerN = y + m + d + h;
  const idx = movingIndex(lowerN);
  const lines = compose(numToTrigram(lowerN), numToTrigram(upperN));
  return {
    lines, values: oneMovingValues(lines, idx), moving: [idx], method: "time",
    at: isoformat(w),
    ganzhi: `${gz.year_ganzhi}年${gz.lunar.leap ? "闰" : ""}${m}月${d}日${gz.shichen}时`,
    wall: { year: w.year, month: w.month, day: w.day, hour: w.hour, minute: w.minute },
    gz, upper_from: upperN, lower_from: lowerN, moving_from: lowerN,
  };
}

// ---------------------------------------------------------------------------
// render
// ---------------------------------------------------------------------------

const RENDER_KEYS = ["at", "ganzhi", "wall", "gz", "numbers", "seed", "stalks", "variant", "source", "piles",
  "changes", "upper_from", "lower_from", "moving_from"];

export function render(cast: Cast, includeTrace = false): Record<string, any> {
  const { lines, values, moving } = cast;
  const hex = getByLines(lines);
  let movingLine: any = null;
  if (moving.length) {
    const mi = moving[0];
    movingLine = {
      position: mi,
      label: lineLabel(mi, lines[mi] === 1),
      value: values[mi],
      changed: values[mi] === OLD_YIN || values[mi] === OLD_YANG,
      all: moving.map((p) => ({ position: p, label: lineLabel(p, lines[p] === 1), value: values[p] })),
    };
  }
  const out: Record<string, any> = {
    hexagram: {
      number: hex.number, name: hex.name, upper: hex.upper, lower: hex.lower,
      symbol: SYMBOLS[hex.upper] + " " + SYMBOLS[hex.lower], lines_bottom_up: [...lines],
    },
    method: cast.method,
    moving_line: movingLine,
  };
  if (moving.length) {
    const ch = getByLines(lines.map((l, i) => (moving.includes(i) ? 1 - l : l)));
    out.changed_hexagram = { number: ch.number, name: ch.name, upper: ch.upper, lower: ch.lower };
  }
  for (const k of RENDER_KEYS) if (cast[k] !== undefined && cast[k] !== null) out[k] = cast[k];
  out.values = [...values];
  if (includeTrace && cast.trace) out.trace = cast.trace;
  return out;
}
