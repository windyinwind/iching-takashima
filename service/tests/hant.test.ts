// Comprehensive regression suite for Traditional Chinese (hant / /hant/ / zh-Hant) support.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { HEXAGRAMS, PLAIN, TRAD } from "../src/engine/data.ts";
import { deepHant, toHant, toHantHtml } from "../src/engine/hant.ts";
import s2t from "../src/engine/s2t.json" with { type: "json" };
import * as engine from "../src/engine/index.ts";
import { INFO } from "../src/info.ts";
import { LEARN } from "../src/learn.ts";
import { hexSlug, route, sitemap } from "../src/pages.ts";
import worker from "../src/worker.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ORIGIN = "https://takashima-iching.com";
const TRIGRAMS = ["qian", "dui", "li", "zhen", "xun", "kan", "gen", "kun"];

// Intentional classical keeps + dual-valid characters that also appear as keys in s2t.ch.
const ALLOWED_RESIDUAL_CH = new Set([
  "无", "于", "占", "凶", "咸", "征", "群", "云", "斗", "里",
  "尸", "咨", "干", "丑", "采", "瓮", "后", "腊", "机", "范", "余",
]);

let prevCaches: unknown;
let prevRewriter: unknown;

// Lightweight HTMLRewriter double covering the selectors used by worker.ts landing().
class MockHTMLRewriter {
  private handlers: { selector: string; handler: { element: (el: any) => void } }[] = [];
  on(selector: string, handler: { element: (el: any) => void }) {
    this.handlers.push({ selector, handler });
    return this;
  }
  transform(res: Response) {
    return (async () => {
      let html = await res.text();
      for (const { selector, handler } of this.handlers) {
        html = applySelector(html, selector, handler);
      }
      return new Response(html, { status: res.status, headers: res.headers });
    })();
  }
}

function setOrReplaceAttr(tag: string, name: string, val: string): string {
  const re = new RegExp(`(\\s${name}=)"[^"]*"`);
  return re.test(tag) ? tag.replace(re, `$1"${val}"`) : tag.replace(/>$/, ` ${name}="${val}">`);
}

function applySelector(html: string, selector: string, handler: { element: (el: any) => void }): string {
  const mkEl = (getTag: () => string, setTag: (s: string) => void, insertBefore: (s: string) => void, insertAfter: (s: string) => void, prependInner: (s: string) => void, appendInner: (s: string) => void, setInner: (s: string) => void) => ({
    setAttribute: (k: string, v: string) => setTag(setOrReplaceAttr(getTag(), k, v)),
    setInnerContent: (s: string) => setInner(s),
    prepend: (s: string) => prependInner(s),
    append: (s: string) => appendInner(s),
    before: (s: string) => insertBefore(s),
    after: (s: string) => insertAfter(s),
  });

  if (/^[a-z]+$/.test(selector)) {
    const openRe = new RegExp(`<${selector}\\b[^>]*>`, "i");
    const closeTag = `</${selector}>`;
    const m = openRe.exec(html);
    if (!m) return html;
    let open = m[0];
    let before = "", after = "", prepend = "", append = "";
    let innerOverride: string | null = null;
    const start = m.index;
    const bodyStart = start + open.length;
    const closeIdx = html.indexOf(closeTag, bodyStart);
    handler.element(mkEl(
      () => open,
      (s) => { open = s; },
      (s) => { before += s; },
      (s) => { after += s; },
      (s) => { prepend += s; },
      (s) => { append += s; },
      (s) => { innerOverride = s; },
    ));
    if (closeIdx < 0) return html.slice(0, start) + before + open + after + html.slice(bodyStart);
    const inner = innerOverride !== null ? innerOverride : html.slice(bodyStart, closeIdx);
    return html.slice(0, start) + before + open + prepend + inner + append + closeTag + after + html.slice(closeIdx + closeTag.length);
  }

  const metaM = /^meta\[(name|property)="([^"]+)"\]$/.exec(selector);
  if (metaM) {
    const attr = metaM[1], val = metaM[2];
    const re = new RegExp(`<meta\\b[^>]*\\b${attr}="${val}"[^>]*>`, "i");
    return html.replace(re, (tag) => {
      let cur = tag;
      handler.element(mkEl(() => cur, (s) => { cur = s; }, () => {}, () => {}, () => {}, () => {}, () => {}));
      return cur;
    });
  }

  const idM = /^#([a-z-]+)$/.exec(selector);
  if (idM) {
    const id = idM[1];
    const openRe = new RegExp(`<([a-z0-9]+)\\b[^>]*\\bid="${id}"[^>]*>`, "i");
    const m = openRe.exec(html);
    if (!m) return html;
    const tagName = m[1];
    let open = m[0], prepend = "", append = "", innerOverride: string | null = null;
    const bodyStart = m.index + open.length;
    const closeTag = `</${tagName}>`;
    const closeIdx = html.indexOf(closeTag, bodyStart);
    handler.element(mkEl(() => open, (s) => { open = s; }, () => {}, () => {}, (s) => { prepend += s; }, (s) => { append += s; }, (s) => { innerOverride = s; }));
    const inner = innerOverride !== null ? innerOverride : html.slice(bodyStart, closeIdx);
    return html.slice(0, m.index) + open + prepend + inner + append + html.slice(closeIdx);
  }

  if (selector === "a.brand") {
    return html.replace(/<a\b[^>]*\bclass="brand"[^>]*>/i, (tag) => {
      let cur = tag;
      handler.element(mkEl(() => cur, (s) => { cur = s; }, () => {}, () => {}, () => {}, () => {}, () => {}));
      return cur;
    });
  }
  return html;
}

const INDEX_HTML = readFileSync(`${ROOT}/service/public/index.html`, "utf8");
const MOCK_ENV = {
  ASSETS: {
    fetch: async (req: Request | string) => {
      const u = typeof req === "string" ? req : req.url;
      if (u.endsWith("/index.html")) return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      return new Response("Not found", { status: 404 });
    },
  },
};
const MOCK_CTX = { waitUntil: () => {} };

before(() => {
  prevCaches = (globalThis as any).caches;
  prevRewriter = (globalThis as any).HTMLRewriter;
  (globalThis as any).caches = { default: { match: async () => undefined, put: async () => {} } };
  (globalThis as any).HTMLRewriter = MockHTMLRewriter;
});

after(() => {
  (globalThis as any).caches = prevCaches;
  (globalThis as any).HTMLRewriter = prevRewriter;
});

test("toHant is an exact 450/450 fixpoint on gold jing_trad.json (judgments, lines, yong)", () => {
  let count = 0;
  for (let n = 1; n <= 64; n++) {
    const t = TRAD[String(n)];
    assert.equal(toHant(t.judgment), t.judgment, `hex ${n} judgment not fixpoint`);
    count++;
    for (let p = 0; p < 6; p++) {
      assert.equal(toHant(t.lines[p]), t.lines[p], `hex ${n} line ${p} not fixpoint`);
      count++;
    }
    if (t.yong) {
      assert.equal(toHant(t.yong), t.yong, `hex ${n} yong not fixpoint`);
      count++;
    }
  }
  assert.equal(count, 450);
});

test("toHant matches gold jing_trad.json on 446/448 simplified texts (only Hex 13 无/無 edition diffs)", () => {
  const diffs: string[] = [];
  for (const h of HEXAGRAMS) {
    const t = TRAD[String(h.number)];
    if (toHant(h.judgment) !== t.judgment) diffs.push(`${h.number}-judgment`);
    for (let p = 0; p < 6; p++) {
      if (toHant(h.lines[p]) !== t.lines[p]) diffs.push(`${h.number}-line-${p}`);
    }
  }
  assert.deepEqual(diffs, ["13-line-0", "13-line-5"]);
});

test("curated overrides and HTML nav protection work accurately", () => {
  const pairs: [string, string][] = [
    ["发蒙", "發蒙"], ["反复", "反復"], ["考祥", "考詳"], ["己日", "已日"],
    ["干胏", "乾胏"], ["腊肉", "腊肉"], ["奔其机", "奔其机"], ["闲有家", "閑有家"],
    ["见沫", "見沬"], ["耕获", "耕獲"], ["菑畲", "菑畬"], ["众", "眾"],
    ["未占有孚", "未占有孚"], ["齎咨", "齎咨"], ["以其汇", "以其彙"], ["亦可丑也", "亦可醜也"],
    ["匪其丑", "匪其醜"], ["群丑", "群丑"], ["丑类", "丑類"], ["舆尸", "輿尸"],
    ["三岁不觌", "三歲不覿"], ["遁", "遯"], ["増補高島易断", "增補高島易斷"],
    ["居于何位", "居於何位"], ["复制", "複製"], ["亦几几乎将至于亡矣", "亦幾幾乎將至于亡矣"],
    ["合作伙伴", "合作夥伴"],
  ];
  for (const [src, want] of pairs) {
    assert.equal(toHant(src), want, `${src} -> ${want}`);
  }
  const html = '<p>简体转换</p><nav class="langs pages"><a href="/zh/">简体</a><a href="/hant/">繁體</a><a href="/ja/">日本語</a></nav>';
  const out = toHantHtml(html);
  assert.ok(out.includes("<p>簡體轉換</p>"));
  assert.ok(out.includes('<a href="/zh/">简体</a>'));
  assert.ok(out.includes('<a href="/ja/">日本語</a>'));
});

test("all 470 /hant/ server-rendered pages render cleanly with no /zh/ leaks or simplified-only char leaks", () => {
  const paths: string[] = [
    "/hant/hexagrams",
    "/hant/trigrams",
    ...TRIGRAMS.map((t) => `/hant/trigram/${t}`),
    ...LEARN.map((s) => `/hant/learn/${s}`),
    ...INFO.map((s) => `/hant/${s}`),
  ];
  for (let n = 1; n <= 64; n++) {
    const slug = hexSlug(n);
    paths.push(`/hant/hexagram/${slug}`);
    for (let p = 1; p <= 6; p++) paths.push(`/hant/hexagram/${slug}/line-${p}`);
  }
  assert.equal(paths.length, 470);

  const chKeys = new Set(Object.keys(s2t.ch));
  const badChars: string[] = [];

  for (const path of paths) {
    const html = route(path, ORIGIN);
    assert.ok(html, `${path} returned null`);
    assert.ok(html.startsWith('<!doctype html><html lang="zh-Hant">'), `${path} missing zh-Hant lang`);
    assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}${path}">`), `${path} missing canonical`);
    for (const hreflang of ["en", "zh-Hans", "zh-Hant", "ja", "x-default"]) {
      assert.ok(html.includes(`hreflang="${hreflang}"`), `${path} missing hreflang ${hreflang}`);
    }

    // No /zh/ links outside the language switcher nav and <link rel="alternate">.
    const withoutLangAlt = html
      .replace(/<nav class="langs[\s\S]*?<\/nav>/g, "")
      .replace(/<link rel="alternate"[^>]*>/g, "");
    assert.doesNotMatch(withoutLangAlt, /href="[^"]*\/zh(?:\/|")/, `${path} leaked a /zh link`);

    // Check residual characters from s2t.ch keys.
    const textOnly = withoutLangAlt.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    for (const c of textOnly) {
      if (chKeys.has(c) && !ALLOWED_RESIDUAL_CH.has(c)) {
        badChars.push(`${path}: ${c}`);
      }
    }
  }
  assert.deepEqual(badChars, [], `Unexpected simplified-only chars: ${badChars.slice(0, 10).join(", ")}`);

  // Hexagram pages must render gold TRAD texts.
  for (let n = 1; n <= 64; n++) {
    const html = route(`/hant/hexagram/${hexSlug(n)}`, ORIGIN)!;
    const t = TRAD[String(n)];
    assert.ok(html.includes(t.judgment), `hex ${n} missing gold judgment`);
    for (let p = 0; p < 6; p++) {
      assert.ok(html.includes(t.lines[p]), `hex ${n} missing gold line ${p}`);
    }
    if (t.yong) assert.ok(html.includes(t.yong), `hex ${n} missing gold yong`);
  }
});

test("sitemap includes all 1884 URLs (471 x 4) with zh-Hant alternates", () => {
  const xml = sitemap(ORIGIN);
  const urls = [...xml.matchAll(/<url>/g)];
  assert.equal(urls.length, 1884);
  for (const sample of [
    `${ORIGIN}/hant/`,
    `${ORIGIN}/hant/hexagrams`,
    `${ORIGIN}/hant/trigrams`,
    `${ORIGIN}/hant/learn/reading-a-hexagram`,
    `${ORIGIN}/hant/about`,
    `${ORIGIN}/hant/hexagram/1-qian`,
    `${ORIGIN}/hant/hexagram/1-qian/line-1`,
  ]) {
    assert.ok(xml.includes(`<loc>${sample}</loc>`), `sitemap missing ${sample}`);
  }
  const zhHantLinks = [...xml.matchAll(/hreflang="zh-Hant"/g)];
  assert.equal(zhHantLinks.length, 1884);
});

test("worker redirects, landing, API, and MCP support hant cleanly", async () => {
  const fetchReq = (url: string, init?: RequestInit) => worker.fetch(new Request(url, init), MOCK_ENV as any, MOCK_CTX);

  // Language negotiation & redirects
  const tw = await fetchReq(`${ORIGIN}/`, { headers: { "Accept-Language": "zh-TW,zh;q=0.9" } });
  assert.equal(tw.status, 302);
  assert.equal(tw.headers.get("Location"), `${ORIGIN}/hant/`);

  const hantHdr = await fetchReq(`${ORIGIN}/`, { headers: { "Accept-Language": "zh-Hant" } });
  assert.equal(hantHdr.status, 302);
  assert.equal(hantHdr.headers.get("Location"), `${ORIGIN}/hant/`);

  const hk = await fetchReq(`${ORIGIN}/`, { headers: { "Accept-Language": "zh-HK,en;q=0.8" } });
  assert.equal(hk.status, 302);
  assert.equal(hk.headers.get("Location"), `${ORIGIN}/hant/`);

  const cn = await fetchReq(`${ORIGIN}/`, { headers: { "Accept-Language": "zh-CN,zh;q=0.9" } });
  assert.equal(cn.status, 302);
  assert.equal(cn.headers.get("Location"), `${ORIGIN}/zh/`);

  const qTw = await fetchReq(`${ORIGIN}/?lang=zh-TW`);
  assert.equal(qTw.status, 302);
  assert.equal(qTw.headers.get("Location"), `${ORIGIN}/hant/`);

  const slash = await fetchReq(`${ORIGIN}/hant`);
  assert.equal(slash.status, 301);
  assert.equal(slash.headers.get("Location"), `${ORIGIN}/hant/`);

  // Landing page /hant/
  const landingRes = await fetchReq(`${ORIGIN}/hant/`);
  assert.equal(landingRes.status, 200);
  const landingHtml = await landingRes.text();
  assert.match(landingHtml, /<html lang="zh-Hant" data-lang="hant">/);
  assert.ok(landingHtml.includes(`<link rel="canonical" href="${ORIGIN}/hant/">`));
  assert.ok(landingHtml.includes('"inLanguage":"zh-Hant"'));
  assert.ok(landingHtml.includes("周易 · 高島略筮"));
  assert.ok(landingHtml.includes("現在起一卦"));

  // API endpoints
  const guideRes = await fetchReq(`${ORIGIN}/api/guide?lang=hant`);
  assert.equal(guideRes.status, 200);
  const guide = await guideRes.json() as any;
  assert.equal(guide.title, "起卦之前");
  assert.ok(guide.intro.includes("準備"));

  const seed = "风和日丽";
  const chainRes = await fetchReq(`${ORIGIN}/api/chain?seed=${encodeURIComponent(seed)}&lang=hant`);
  assert.equal(chainRes.status, 200);
  const chain = await chainRes.json() as any;
  assert.equal(chain.reproduce, `lueshi|${seed}`);
  assert.ok(chain.narration[0].includes(`「${seed}」`), "narration must preserve raw seed verbatim");
  assert.ok(chain.links.hexagram.startsWith(`${ORIGIN}/hant/hexagram/`));
  assert.ok(chain.titles.hexagram.includes("第"));

  const readRes = await fetchReq(`${ORIGIN}/api/read?n=4&lang=hant`);
  assert.equal(readRes.status, 200);
  const readData = await readRes.json() as any;
  assert.equal(readData.judgment, TRAD["4"].judgment);
  assert.equal(readData.plain.hant, toHant(PLAIN.hexagrams["4"].zh));
  assert.equal(readData.plain.en, PLAIN.hexagrams["4"].en);
  assert.equal(readData.plain.ja, PLAIN.hexagrams["4"].ja);

  const tkRes = await fetchReq(`${ORIGIN}/api/takashima?n=4&pos=${encodeURIComponent("六五")}&lang=hant`);
  assert.equal(tkRes.status, 200);
  const tkData = await tkRes.json() as any;
  assert.equal(tkData.heading, `六五：${TRAD["4"].lines[4]}`);
  assert.ok(!tkData.commentary.some((p: string) => p.includes("増補")));

  const listRes = await fetchReq(`${ORIGIN}/api/list?lang=hant`);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json() as any[];
  assert.equal(listData.length, 64);
  assert.equal(listData[32].name, "遯");
  assert.equal(listData[32].judgment, TRAD["33"].judgment);

  const srcRes = await fetchReq(`${ORIGIN}/api/sources?lang=hant`);
  assert.equal(srcRes.status, 200);
  const srcData = await srcRes.json() as any;
  assert.equal(srcData.takashima.title, "增補高島易斷");

  // MCP tools/list & tools/call
  const mcpPost = async (body: unknown) => {
    const r = await fetchReq(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(r.status, 200);
    return await r.json() as any;
  };

  const toolsList = await mcpPost({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  for (const tool of toolsList.result.tools) {
    assert.ok(tool.inputSchema.properties.lang.enum.includes("hant"), `MCP tool ${tool.name} missing hant`);
  }

  const gCall = await mcpPost({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "iching_guide", arguments: { lang: "hant" } } });
  assert.ok(JSON.parse(gCall.result.content[0].text).intro.includes("準備"));

  const cCall = await mcpPost({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "iching_cast", arguments: { phrase: seed, lang: "hant" } } });
  const cJson = JSON.parse(cCall.result.content[0].text);
  assert.equal(cJson.reproduce, `lueshi|${seed}`);
  assert.ok(cJson.links.hexagram.startsWith(`${ORIGIN}/hant/hexagram/`));

  const rCall = await mcpPost({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "iching_read", arguments: { number: 4, lang: "hant" } } });
  const rJson = JSON.parse(rCall.result.content[0].text);
  assert.equal(rJson.judgment, TRAD["4"].judgment);

  const tCall = await mcpPost({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "iching_takashima", arguments: { number: 4, position: "六五", lang: "hant" } } });
  const tJson = JSON.parse(tCall.result.content[0].text);
  assert.equal(tJson.heading, `六五：${TRAD["4"].lines[4]}`);
});

test("frontend assets and wrangler.jsonc wire hant cleanly", () => {
  assert.ok(INDEX_HTML.includes('data-lang="hant"'), "index.html missing data-lang=hant button");
  const appJs = readFileSync(`${ROOT}/service/public/app.js`, "utf8");
  // Evaluate UI dictionary cleanly by extracting the const UI block.
  const m = /const UI = (\{[\s\S]*?\n\});/.exec(appJs);
  assert.ok(m, "UI object not found in app.js");
  const UI = new Function(`return ${m[1]}`)() as Record<string, Record<string, unknown>>;
  assert.deepEqual(Object.keys(UI.hant).sort(), Object.keys(UI.zh).sort(), "UI.hant keys must match UI.zh");
  assert.ok(appJs.includes('zh-(hant|tw|hk|mo)'), "app.js pickLang missing zh-Hant/TW/HK detection");
  assert.ok(appJs.includes('(lang === "zh" || lang === "hant") && ln.meaning'), "app.js loadReading must show meaning for hant");
  assert.ok(appJs.includes('lang === "hant" ? "問" : "问"'), "app.js loadReading must use 問 for hant");
  assert.ok(appJs.includes('lang === "hant" ? "zh-Hant" : "zh"'), "app.js loadReading must set zh-Hant on tk containers");

  const wrangler = readFileSync(`${ROOT}/service/wrangler.jsonc`, "utf8");
  assert.ok(wrangler.includes('"/hant"') && wrangler.includes('"/hant/*"'), "wrangler.jsonc missing /hant routes");
});

test("deepHant preserves en/ja/seed/reproduce/links verbatim", () => {
  const sample = {
    seed: "风和日丽",
    reproduce: "lueshi|风和日丽",
    links: { hexagram: "https://takashima-iching.com/hant/hexagram/1-qian" },
    plain: { zh: "简体的白话", en: "English", ja: "日本語の説明" },
    inputs: [{ k: "种子", v: "风和日丽" }],
  };
  const out = deepHant(sample) as any;
  assert.equal(out.seed, "风和日丽");
  assert.equal(out.reproduce, "lueshi|风和日丽");
  assert.equal(out.plain.zh, "简体的白话");
  assert.equal(out.plain.hant, "簡體的白話");
  assert.equal(out.plain.en, "English");
  assert.equal(out.plain.ja, "日本語の説明");
  assert.deepEqual(out.inputs[0], { k: "種子", v: "风和日丽" });
});
