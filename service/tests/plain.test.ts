// Regression: the plain-language layer (plain.json) covers 64 hexagrams + 384 lines in
// three languages, and the rendered pages show it. This is the layer that makes the
// classical xiang/li commentary readable — if it goes missing, users hit the same
// "I can't understand the text" wall on the site that we fixed in the mini-tool.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PLAIN } from "../src/engine/data.ts";
import { linePage } from "../src/pages.ts";
import { read } from "../src/engine/index.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const LANGS = ["en", "zh", "ja"] as const;

test("plain.json covers all 64 hexagrams and 384 lines in three languages", () => {
  assert.equal(Object.keys(PLAIN.hexagrams).length, 64);
  assert.equal(Object.keys(PLAIN.lines).length, 384);
  for (let n = 1; n <= 64; n++) {
    const h = PLAIN.hexagrams[String(n)];
    assert.ok(h, `hexagram ${n} missing`);
    for (const l of LANGS) assert.ok(h[l]?.trim(), `hexagram ${n} missing ${l}`);
    for (let p = 0; p < 6; p++) {
      const ln = PLAIN.lines[`${n}-${p}`];
      assert.ok(ln, `line ${n}-${p} missing`);
      for (const l of LANGS) assert.ok(ln[l]?.trim(), `line ${n}-${p} missing ${l}`);
    }
  }
});

test("plain language has no stray latin in zh/ja and no CJK in en", () => {
  for (const grp of [PLAIN.hexagrams, PLAIN.lines]) {
    for (const [key, v] of Object.entries(grp) as [string, any][]) {
      for (const l of ["zh", "ja"]) {
        assert.doesNotMatch(v[l], /[A-Za-z]{2,}/, `${key}.${l} has latin`);
      }
      assert.doesNotMatch(v.en, /[一-鿿]{2,}/, `${key}.en has CJK`);
    }
  }
});

test("line pages render the plain-language block in every language", () => {
  const origin = "https://takashima-iching.com";
  for (const lang of LANGS) {
    const html = linePage(lang, 56, 3, origin); // 旅卦九四
    assert.match(html, /class="plain"/, `${lang}: plain block missing`);
    const plain = PLAIN.lines["56-3"][lang];
    assert.ok(html.includes(plain), `${lang}: plain text not rendered verbatim`);
    assert.doesNotMatch(html.slice(html.indexOf('class="plain"')).slice(0, 600), /undefined|\[object Object\]/, `${lang}: garbage in plain block`);
  }
});

test("engine.read exposes plain at top level and on each line (mini-tool/MCP contract)", () => {
  const hex = read(56, null, "zh");
  assert.deepEqual(hex.plain, PLAIN.hexagrams["56"]);
  const line = read(56, 3, "zh");
  assert.deepEqual(line.line.plain, PLAIN.lines["56-3"]);
  // plain is a sibling of meaning, not nested inside it
  assert.ok(!("plain" in (line.line.meaning ?? {})), "plain must not be nested under meaning");
});

test("plain.json committed copy matches the generator source", () => {
  // The site reads plain.json directly; guard against a stale copy after data edits.
  const src = JSON.parse(readFileSync(`${ROOT}/skills/zhouyi-lookup/scripts/zhouyi/plain.json`, "utf8"));
  assert.equal(JSON.stringify(src), JSON.stringify(PLAIN));
});
