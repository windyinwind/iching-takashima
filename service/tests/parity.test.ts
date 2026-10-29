// The TypeScript engine must give exactly what the Python CLI (zy.py) gives.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as engine from "../src/engine/index.ts";

const ORACLE = fileURLToPath(new URL("./oracle.py", import.meta.url));
const LANGS = ["zh", "en", "ja"] as const;

// Small deterministic generator so the case list is the same on every run.
let state = 20261029;
const rand = (n: number) => {
  state = (state * 1103515245 + 12345) % 2147483648;
  return state % n;
};

function cases(): string[][] {
  const c: string[][] = [];
  for (const l of LANGS) c.push(["guide", "--lang", l]);
  c.push(["list"], ["sources"]);

  const seeds = ["今天下午", "this afternoon", "今日の午後", "a", "Ünïcödé 🌸", "  spaces  ", "x#1", "1"];
  for (let i = 0; i < 40; i++) seeds.push("seed-" + rand(1e9));
  for (const s of seeds) {
    for (const l of LANGS) {
      c.push(["chain", "--seed", s, "--lang", l]);
      c.push(["chain", "--seed", s, "--variant", "dayan", "--lang", l]);
    }
    c.push(["cast", "--seed", s, "--trace"], ["cast", "--seed", s, "--variant", "dayan", "--trace"]);
  }
  c.push(["chain", "--seed", "old name", "--variant", "shaoban"]);

  const piles = [[1, 1, 1], [48, 48, 48], [7, 8, 6], [8, 16, 12], [21, 22, 16], [5, 6, 5]];
  for (let i = 0; i < 120; i++) piles.push([1 + rand(48), 1 + rand(48), 1 + rand(48)]);
  for (const p of piles) for (const l of LANGS) c.push(["chain", "--piles", ...p.map(String), "--lang", l]);
  c.push(["cast", "--piles", "0", "5", "5"], ["cast", "--piles", "49", "5", "5"], ["cast", "--piles", "x", "5", "5"]);

  const nums = [["7", "13"], ["8", "16"], ["1", "2", "3"], ["48", "96", "6"], ["100", "200", "300"], ["5", "5"], ["+7", "013"]];
  for (let i = 0; i < 60; i++) nums.push([String(1 + rand(999)), String(1 + rand(999))]);
  for (const n of nums) for (const l of LANGS) c.push(["chain", "--numbers", ...n, "--lang", l]);
  c.push(["cast", "--numbers", "0", "5"], ["cast", "--numbers", "1"], ["cast", "--numbers", "1", "2", "3", "4"],
    ["cast", "--numbers", "a", "b"], ["cast", "--numbers", "-3", "5"]);

  const times = ["2026-10-04T00:35:27+08:00", "2026-10-04T23:30:00+08:00", "2026-10-04T23:59Z", "2020-05-23T12:00:00-05:00",
    "1900-01-31T01:00+00:00", "2100-12-31T10:00+09:00", "2026-02-17T11:11:11.5+08:00", "2026-06-21T22:59:59+0530",
    "2026-10-04 08:00+09:00"];
  for (let i = 0; i < 80; i++) {
    const y = 1901 + rand(199), mo = 1 + rand(12), d = 1 + rand(28), h = rand(24), mi = rand(60);
    const off = ["+08:00", "+09:00", "-05:00", "Z", "+00:00", "-11:30"][rand(6)];
    const p = (x: number) => String(x).padStart(2, "0");
    times.push(`${y}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}:00${off}`);
  }
  for (const t of times) for (const l of LANGS) c.push(["chain", "--at", t, "--lang", l]);
  c.push(["cast", "--at", "2026-10-04T00:35:27"], ["cast", "--at", "garbage"], ["cast", "--at", "2026-02-30T00:00+00:00"],
    ["cast", "--at", "1899-12-31T00:00+00:00"], ["cast"]);

  const positions = ["0", "1", "2", "3", "4", "5", "6", "初", "上", "初九", "六二", "九三", "六四", "九五", "上六"];
  for (let n = 1; n <= 64; n++) {
    for (const l of LANGS) {
      c.push(["read", String(n), "--lang", l]);
      c.push(["read", String(n), positions[rand(positions.length)], "--lang", l]);
      c.push(["takashima", String(n), "--lang", l]);
    }
    for (let p = 0; p < 6; p++) c.push(["takashima", String(n), String(p)], ["takashima", String(n), String(p), "--all"]);
  }
  for (const y of ["用九", "用六", "用"]) c.push(["takashima", "1", y], ["takashima", "2", y, "--all"], ["takashima", "3", y]);
  c.push(["read", "0"], ["read", "65"], ["read", "1", "7"], ["read", "1", "七"], ["takashima", "65"], ["takashima", "1", "x"]);
  return c;
}

function argValue(argv: string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

function multi(argv: string[], flag: string): string[] | undefined {
  const i = argv.indexOf(flag);
  if (i < 0) return undefined;
  const out = [];
  for (let j = i + 1; j < argv.length && !argv[j].startsWith("--"); j++) out.push(argv[j]);
  return out;
}

/** Run the TS engine with zy.py's command line. */
function runTs(argv: string[]): { code: number; out: any; err: string | null } {
  const [cmd, ...rest] = argv;
  const lang = (argValue(rest, "--lang") ?? "zh") as engine.Lang;
  const positional = rest.filter((a, i) => !a.startsWith("--") && !(i > 0 && rest[i - 1].startsWith("--") && rest[i - 1] !== "--all" && rest[i - 1] !== "--trace"));
  const input = {
    seed: argValue(rest, "--seed"), at: argValue(rest, "--at"), variant: argValue(rest, "--variant"),
    numbers: multi(rest, "--numbers"), piles: multi(rest, "--piles"),
  };
  try {
    let out: any;
    if (cmd === "guide") out = engine.guide(lang);
    else if (cmd === "list") out = engine.list();
    else if (cmd === "sources") out = engine.sources();
    else if (cmd === "cast") out = engine.cast({ ...input, trace: rest.includes("--trace") });
    else if (cmd === "chain") out = engine.chain({ ...input, lang });
    else if (cmd === "read") out = engine.read(+positional[0], positional[1] ?? null, lang);
    else if (cmd === "takashima") out = engine.takashima(+positional[0], positional[1] ?? null, lang, rest.includes("--all"));
    else throw new Error("unknown command " + cmd);
    return { code: 0, out: JSON.parse(JSON.stringify(out)), err: null };
  } catch (e) {
    if (!(e instanceof engine.EngineError)) throw e;
    return { code: 2, out: null, err: e.message };
  }
}

test("TypeScript engine matches zy.py on every case", () => {
  const all = cases();
  const expected = JSON.parse(execFileSync("python3", ["-I", ORACLE], { input: JSON.stringify(all), maxBuffer: 1 << 30 }).toString());
  assert.equal(expected.length, all.length);
  let failures = 0;
  for (let i = 0; i < all.length; i++) {
    const got = runTs(all[i]);
    try {
      assert.deepStrictEqual(got, expected[i]);
    } catch (e) {
      if (++failures <= 5) console.error("MISMATCH", JSON.stringify(all[i]), (e as Error).message.slice(0, 2000));
    }
  }
  assert.equal(failures, 0, `${failures} of ${all.length} cases differ`);
  console.log(`${all.length} cases match`);
});

test("tables.json is current", () => {
  execFileSync("python3", ["-I", fileURLToPath(new URL("../scripts/gen_tables.py", import.meta.url)), "--check"]);
});
