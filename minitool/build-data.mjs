// Extract the zh Takashima excerpt slices from the website's generated excerpts.json
// so the mini-tool ships lean (the full takashima.json is 1.5MB and stays out).
// Usage: node build-data.mjs   (run from iching/minitool)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(readFileSync(join(here, "../service/src/generated/excerpts.json"), "utf8"));

// src: { "<hexagram>": { "<judgment|0..5|yong>": { zh: string[], en?: string[], ja?: string[] } } }
const out = {};
for (const [n, parts] of Object.entries(src)) {
  out[n] = {};
  for (const [key, langs] of Object.entries(parts)) {
    if (langs && Array.isArray(langs.zh) && langs.zh.length) out[n][key] = { zh: langs.zh };
  }
}
const dst = join(here, "src", "data");
mkdirSync(dst, { recursive: true });
const file = join(dst, "excerpts-zh.json");
writeFileSync(file, JSON.stringify(out));
const pages = Object.values(out).reduce((acc, p) => acc + Object.keys(p).length, 0);
console.log(`wrote ${file} (${pages} pages, ${Math.round(readFileSync(file).length / 1024)} KB)`);
