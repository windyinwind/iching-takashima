// Simplified-to-Traditional Chinese boundary converter backed by s2t.json.
import s2tJson from "./s2t.json" with { type: "json" };

type S2TTable = {
  maxLen: number;
  ch: Record<string, string>;
  ph: Record<string, string>;
  ov: Record<string, string>;
};

const TBL = s2tJson as S2TTable;
const CJK_RUN = /[\u4e00-\u9fff]+/g;
const SKIP_KEYS = new Set(["reproduce", "seed", "en", "ja", "links", "url", "href", "id", "key", "method"]);

function convertRun(run: string): string {
  const { maxLen, ch, ph, ov } = TBL;
  let out = "";
  let i = 0;
  const n = run.length;
  while (i < n) {
    let hit: string | undefined;
    for (let L = Math.min(maxLen, n - i); L >= 2; L--) {
      const sub = run.slice(i, i + L);
      if (Object.hasOwn(ov, sub)) {
        hit = ov[sub];
        i += L;
        break;
      }
      if (Object.hasOwn(ph, sub)) {
        hit = ph[sub];
        i += L;
        break;
      }
    }
    if (hit === undefined) {
      const c = run[i];
      hit = Object.hasOwn(ov, c) ? ov[c] : Object.hasOwn(ch, c) ? ch[c] : c;
      i += 1;
    }
    out += hit;
  }
  return out;
}

/** Convert Simplified Chinese text to Traditional Chinese (preserving classical Zhouyi forms). */
export function toHant(s: string): string {
  return s.replace(CJK_RUN, convertRun).replaceAll("爲", "為");
}

/** Convert assembled HTML once at the page boundary, keeping language switcher labels intact. */
export function toHantHtml(html: string): string {
  const saved: string[] = [];
  const masked = html.replace(/<nav class="langs[\s\S]*?<\/nav>/g, (m) => {
    const idx = saved.push(m) - 1;
    return `\u0000LANGNAV_${idx}\u0000`;
  });
  return toHant(masked).replace(/\u0000LANGNAV_(\d+)\u0000/g, (_, idx) => saved[Number(idx)]);
}

/** Recursively convert JSON API / MCP payloads to Traditional Chinese without touching seeds, IDs, URLs, or en/ja text. */
export function deepHant<T>(val: T): T {
  if (typeof val === "string") return toHant(val) as unknown as T;
  if (Array.isArray(val)) return val.map((item) => deepHant(item)) as unknown as T;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    // Keep user's raw seed phrase verbatim inside chain step inputs: { k: "种子", v: <raw seed> }.
    if (obj.k === "种子" && "v" in obj && Object.keys(obj).length === 2) {
      return { k: toHant("种子"), v: obj.v } as unknown as T;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SKIP_KEYS.has(k)) {
        out[k] = v;
      } else if (k === "plain" && v && typeof v === "object" && !Array.isArray(v) && typeof (v as any).zh === "string") {
        const p = v as Record<string, unknown>;
        out[k] = { ...p, hant: toHant(p.zh as string) };
      } else {
        out[k] = deepHant(v);
      }
    }
    return out as T;
  }
  return val;
}
