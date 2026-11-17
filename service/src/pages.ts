// Server-rendered pages for search engines and link previews: hexagrams, lines and trigrams in
// three languages. Every page draws its lines (yang ⚊ / yin ⚋) and links to the related pages.
import { HEXAGRAMS, LEGGE, LINE_MEANING, T, TRAD } from "./engine/data.ts";
import { SYMBOLS, getByLines, getByNumber, lineLabel, linesOf } from "./engine/core.ts";
import excerptsJson from "./generated/excerpts.json" with { type: "json" };
import { LEARN, type SideCtx, hexData, learnPage, learnPath, learnTitle, leftSidebar, rightSidebar } from "./learn.ts";
import { INFO, infoLinks, infoPage, infoPath } from "./info.ts";

export type Lang = "en" | "zh" | "ja";
export const LANGS: Lang[] = ["en", "zh", "ja"];
const EXCERPTS: any = excerptsJson;
const ORDER = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
const TRIGRAM_SLUG: Record<string, string> = { "乾": "qian", "兑": "dui", "离": "li", "震": "zhen", "巽": "xun", "坎": "kan", "艮": "gen", "坤": "kun" };
const SLUG_TRIGRAM = Object.fromEntries(Object.entries(TRIGRAM_SLUG).map(([k, v]) => [v, k]));
const TEMPLATE = "https://x.ai/bot/1UcfT98mXBGBnDMaoGtG2";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ascii = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

export const hexSlug = (n: number) => `${n}-${ascii(T.hexagram_en[String(n)][0])}`;
export const hexPath = (lang: Lang, n: number) => `/${lang}/hexagram/${hexSlug(n)}`;
export const linePath = (lang: Lang, n: number, p: number) => `${hexPath(lang, n)}/line-${p + 1}`;
export const trigramPath = (lang: Lang, t: string) => `/${lang}/trigram/${TRIGRAM_SLUG[t]}`;

// --- words ------------------------------------------------------------------

export const W = {
  en: {
    site: "I Ching · Takashima Method", learn: "Learn", all: "All 64 hexagrams", trigrams: "The eight trigrams", cast: "Cast a hexagram",
    judgment: "The judgment", lines: "The six lines", line: (p: number) => `Line ${p + 1}`, original: "Original text",
    lower: "Lower (inner) trigram", upper: "Upper (outer) trigram", changesTo: "If this line moves, it changes to",
    takashima: "From Takashima's commentary", tkFull: "Takashima’s full commentary, topic readings and recorded cases: in the Grok Bot and the forthcoming edition.",
    tkZhOnly: "Takashima’s commentary in the Chinese text.",
    legge: "English: James Legge, The Yî King (1882), public domain.", prev: "Previous", next: "Next",
    structure: "Structure", asLower: "As the lower trigram", asUpper: "As the upper trigram",
    askBot: "Ask the Grok Bot about this", noPredict: "A study tool for the classic text. It makes no predictions; the decision is yours.",
    yongLabel: "All lines moving",
  },
  zh: {
    site: "周易 · 高岛略筮", learn: "入门", all: "六十四卦", trigrams: "八卦", cast: "起一卦",
    judgment: "卦辞", lines: "六爻", line: (p: number) => `第 ${p + 1} 爻`, original: "原文",
    lower: "下卦（内卦）", upper: "上卦（外卦）", changesTo: "此爻动则变为",
    takashima: "高岛原书（节录）", tkFull: "高岛全文、分事占断与占例：见 Grok Bot。", tkZhOnly: "",
    legge: "", prev: "上一卦", next: "下一卦",
    structure: "象数结构", asLower: "为下卦", asUpper: "为上卦",
    askBot: "问 Grok Bot", noPredict: "经文与义理的检索工具，不作预测，结论在你。",
    yongLabel: "六爻皆动",
  },
  ja: {
    site: "易経 · 高島流略筮", learn: "入門", all: "六十四卦一覧", trigrams: "八卦", cast: "卦を立てる",
    judgment: "卦辞", lines: "六爻", line: (p: number) => `${["初", "二", "三", "四", "五", "上"][p]}爻`, original: "原文",
    lower: "下卦（内卦）", upper: "上卦（外卦）", changesTo: "この爻が動けば之卦は",
    takashima: "高島の解釈（抄録）", tkFull: "高島の全文・事項別占断・占例は Grok Bot で。",
    tkZhOnly: "高島の解釈は漢文テキストのまま掲げます。",
    legge: "", prev: "前の卦", next: "次の卦",
    structure: "卦の構造", asLower: "下卦として", asUpper: "上卦として",
    askBot: "Grok Bot に聞く", noPredict: "経文を調べるための道具です。予言はしません。結論はご自身で。",
    yongLabel: "六爻すべて動く",
  },
};

const FAMILY_EN: Record<string, string> = { "乾": "father", "坤": "mother", "震": "eldest son", "巽": "eldest daughter", "坎": "middle son", "离": "middle daughter", "艮": "youngest son", "兑": "youngest daughter" };
const FAMILY_JA: Record<string, string> = { "乾": "父", "坤": "母", "震": "長男", "巽": "長女", "坎": "中男", "离": "中女", "艮": "少男", "兑": "少女" };
const DIR_EN: Record<string, string> = { "乾": "north-west", "坤": "south-west", "震": "east", "巽": "south-east", "坎": "north", "离": "south", "艮": "north-east", "兑": "west" };

export function hexTitle(lang: Lang, n: number) {
  const h = getByNumber(n);
  if (lang === "en") return `Hexagram ${n} ${T.hexagram_en[String(n)][0]} ${h.name} (${T.hexagram_en[String(n)][1]})`;
  if (lang === "ja") return `第${n}卦 ${T.hexagram_ja[String(n)][0]}（${T.hexagram_ja[String(n)][1]}）`;
  return `第 ${n} 卦 ${h.name}`;
}
const hexShort = (lang: Lang, n: number) =>
  lang === "en" ? `${n} ${T.hexagram_en[String(n)][0]} ${getByNumber(n).name}` : lang === "ja" ? `${n} ${T.hexagram_ja[String(n)][0]}` : `${n} ${getByNumber(n).name}`;

export function trigramTitle(lang: Lang, t: string) {
  if (lang === "en") return `${T.trigram_en[t][0]} ${t} ${SYMBOLS[t]} (${T.trigram_en[t][1]})`;
  if (lang === "ja") return `${T.trigram_ja[t][0]}（${T.trigram_ja[t][1]}）${SYMBOLS[t]}・${T.trigram_ja[t][2]}`;
  return `${t} ${SYMBOLS[t]}（${T.nature[t]}）`;
}

// --- drawing ----------------------------------------------------------------

/** The lines drawn bottom-up: yang a solid bar, yin a broken one; `hl` marks lines in red. */
export function figure(lines: number[], { hl = [] as number[], small = false, label = "" } = {}) {
  const w = small ? 44 : 96, bh = small ? 5 : 11, gap = small ? 4 : 8, n = lines.length;
  const h = n * bh + (n - 1) * gap;
  const bars = lines.map((l, i) => {
    const y = h - (i + 1) * bh - i * gap;
    const cls = hl.includes(i) ? ' class="hl"' : "";
    return l
      ? `<rect${cls} x="0" y="${y}" width="${w}" height="${bh}" rx="1.5"/>`
      : `<rect${cls} x="0" y="${y}" width="${w * 0.43}" height="${bh}" rx="1.5"/><rect${cls} x="${w * 0.57}" y="${y}" width="${w * 0.43}" height="${bh}" rx="1.5"/>`;
  }).join("");
  return `<svg class="fig${small ? " sm" : ""}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">${bars}</svg>`;
}

// --- structure facts --------------------------------------------------------

function facts(lang: Lang, n: number, p: number): string[] {
  const lines = linesOf(getByNumber(n));
  const yang = lines[p] === 1, posYang = p % 2 === 0, central = p === 1 || p === 4;
  const pair = (p + 3) % 6, answered = yang !== (lines[pair] === 1);
  const t = p <= 2 ? getByNumber(n).lower : getByNumber(n).upper;
  if (lang === "en") return [
    `${yang ? "Yang" : "Yin"} line in a ${posYang ? "yang" : "yin"} place: ${yang === posYang ? "in its proper place" : "out of its proper place"}.`,
    central ? `Central: the middle line of the ${p === 1 ? "lower" : "upper"} trigram.` : "Not central (only lines 2 and 5 are).",
    `Corresponds with line ${pair + 1}, which is ${lines[pair] ? "yang" : "yin"}: ${answered ? "they answer each other" : "no response"}.`,
    `Part of the ${p <= 2 ? "lower" : "upper"} trigram ${T.trigram_en[t][0]} ${SYMBOLS[t]} (${T.trigram_en[t][1]}).`,
  ];
  if (lang === "ja") return [
    `${yang ? "陽" : "陰"}爻が${posYang ? "陽" : "陰"}位にある：${yang === posYang ? "位を得る（当位）" : "位を得ない（不当位）"}。`,
    central ? `中を得る：${p === 1 ? "下" : "上"}卦の真ん中。` : "中ではない（中は二爻・五爻）。",
    `${["初", "二", "三", "四", "五", "上"][pair]}爻（${lines[pair] ? "陽" : "陰"}）と応：${answered ? "陰陽が応じる" : "同性で応じない"}。`,
    `${p <= 2 ? "下" : "上"}卦 ${T.trigram_ja[t][0]}${SYMBOLS[t]}（${T.trigram_ja[t][2]}）に属する。`,
  ];
  return [
    `${yang ? "阳" : "阴"}爻居${posYang ? "阳" : "阴"}位：${yang === posYang ? "当位" : "不当位"}。`,
    central ? `得中：居${p === 1 ? "下" : "上"}卦之中。` : "非中（二、五方为中）。",
    `与第 ${pair + 1} 爻（${lines[pair] ? "阳" : "阴"}）相应：${answered ? "阴阳相异，有应" : "同性，无应"}。`,
    `属${p <= 2 ? "下" : "上"}卦 ${t} ${SYMBOLS[t]}（${T.nature[t]}）。`,
  ];
}

const changedOf = (n: number, p: number) => {
  const l = linesOf(getByNumber(n));
  l[p] = 1 - l[p];
  return getByLines(l).number;
};

// --- analytics --------------------------------------------------------------
// Google Tag Manager, injected into every HTML page. Landing pages are rewritten
// by worker.ts; all other pages are built by shell() below.
export const GTM_HEAD = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-PK39VX5W');</script>
<!-- End Google Tag Manager -->`;

export const GTM_NOSCRIPT = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PK39VX5W" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;

export const ADSENSE_HEAD = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2386768377934520" crossorigin="anonymous"></script>`;

// --- advertising ------------------------------------------------------------
// Manual AdSense units. The slot IDs are created in the AdSense dashboard; until they are
// filled in, adUnit() renders nothing and every page stays exactly as it is today.
export const AD_SLOT_INARTICLE = "4165708695";
export const AD_SLOT_DISPLAY = "1241383649";

export function adUnit(slot: string, format = "auto") {
  if (!slot) return "";
  return `<div class="adbox"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-2386768377934520" data-ad-slot="${esc(slot)}" data-ad-format="${esc(format)}" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;
}

// --- shell ------------------------------------------------------------------

type Meta = { lang: Lang; title: string; description: string; path: (l: Lang) => string; og?: string; jsonld?: unknown; origin: string; side?: SideCtx };

export function sideScripts(lang: Lang) {
  return `<script type="application/json" id="hexdata">${JSON.stringify(hexData(lang)).replace(/</g, "\\u003c")}</script><script type="module" src="/explore.js"></script>`;
}

function shell(m: Meta, body: string) {
  const w = W[m.lang];
  const url = m.origin + m.path(m.lang);
  const alt = LANGS.map((l) => `<link rel="alternate" hreflang="${l === "zh" ? "zh-Hans" : l}" href="${m.origin}${m.path(l)}">`).join("") +
    `<link rel="alternate" hreflang="x-default" href="${m.origin}${m.path("en")}">`;
  const og = m.origin + (m.og ?? "/og/default.png");
  const langs = LANGS.map((l) => `<a href="${m.path(l)}" hreflang="${l}"${l === m.lang ? ' aria-current="true"' : ""}>${{ en: "EN", zh: "中文", ja: "日本語" }[l]}</a>`).join("");
  return `<!doctype html><html lang="${m.lang === "zh" ? "zh-Hans" : m.lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m.title)}</title><meta name="description" content="${esc(m.description)}">
<link rel="canonical" href="${url}">${alt}
<meta property="og:type" content="article"><meta property="og:title" content="${esc(m.title)}"><meta property="og:description" content="${esc(m.description)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css">
${GTM_HEAD}
${ADSENSE_HEAD}
${m.jsonld ? `<script type="application/ld+json">${JSON.stringify(m.jsonld).replace(/</g, "\\u003c")}</script>` : ""}
</head><body>
${GTM_NOSCRIPT}
<header class="top"><a class="brand" href="/${m.lang}/">${esc(w.site)}</a><nav class="langs pages" aria-label="Language">${langs}</nav></header>
<nav class="crumbs"><a href="/${m.lang}/hexagrams">${esc(w.all)}</a> · <a href="/${m.lang}/trigrams">${esc(w.trigrams)}</a> · <a href="${learnPath(m.lang, LEARN[0])}">${esc(w.learn)}</a> · <a class="cta" href="/${m.lang}/">${esc(w.cast)}</a></nav>
<div class="layout">${leftSidebar(m.lang, m.side ?? {})}<main class="doc">${body}</main>${rightSidebar(m.lang, m.side ?? {})}</div>
${sideScripts(m.lang)}
<footer><p>${esc(w.noPredict)}</p><p class="small"><a href="${TEMPLATE}" rel="noopener">${esc(w.askBot)}</a> · <a href="https://github.com/windyinwind/iching-takashima" rel="noopener">GitHub</a></p><p class="small">${infoLinks(m.lang)}</p></footer>
</body></html>`;
}

const tLink = (lang: Lang, t: string) =>
  `<a class="tri" href="${trigramPath(lang, t)}">${figure([...T.trigrams[t]], { small: true, label: trigramTitle(lang, t) })}<span>${esc(trigramTitle(lang, t))}</span></a>`;
const hLink = (lang: Lang, n: number, hl: number[] = []) =>
  `<a class="hexlink" href="${hexPath(lang, n)}">${figure(linesOf(getByNumber(n)), { small: true, hl, label: hexTitle(lang, n) })}<span>${esc(hexShort(lang, n))}</span></a>`;

function judgmentText(lang: Lang, n: number) {
  const h = getByNumber(n);
  if (lang === "en") return `<blockquote class="text">${esc(LEGGE[String(n)].judgment)}<div class="muted small" lang="zh">${esc(h.judgment)}</div></blockquote>`;
  if (lang === "ja") return `<blockquote class="text" lang="ja">${esc(TRAD[String(n)].judgment)}</blockquote>`;
  return `<blockquote class="text">${esc(h.judgment)}</blockquote>`;
}

function lineText(lang: Lang, n: number, p: number) {
  const h = getByNumber(n);
  const label = lineLabel(p, linesOf(h)[p] === 1);
  if (lang === "en") return `<blockquote class="text">${esc(LEGGE[String(n)].lines[p])}<div class="muted small" lang="zh">${esc(label)}：${esc(h.lines[p])}</div></blockquote>`;
  if (lang === "ja") return `<blockquote class="text" lang="ja">${esc(label)}。${esc(TRAD[String(n)].lines[p])}</blockquote>`;
  return `<blockquote class="text">${esc(label)}：${esc(h.lines[p])}</blockquote>`;
}

function takashimaBlock(lang: Lang, n: number, key: string) {
  const e = EXCERPTS[String(n)]?.[key];
  if (!e) return "";
  const w = W[lang];
  const tr: string[] | undefined = e[lang];
  const paras = lang === "zh" || !tr ? e.zh : tr;
  const note = lang === "zh" ? "" : tr ? "" : `<p class="muted small">${esc(w.tkZhOnly)}</p>`;
  return `<section class="tk"><h3>${esc(w.takashima)}</h3>${note}${paras.map((p: string) => `<p${paras === e.zh ? ' lang="zh"' : ""}>${esc(p)}</p>`).join("")}<p class="muted small"><a href="${TEMPLATE}" rel="noopener">${esc(w.tkFull)}</a></p></section>`;
}

function lineSection(lang: Lang, n: number, p: number, { heading = "h3", link = true } = {}) {
  const w = W[lang];
  const lines = linesOf(getByNumber(n));
  const label = lineLabel(p, lines[p] === 1);
  const ch = changedOf(n, p);
  const meaning = lang === "zh" ? LINE_MEANING[String(n)]?.[p] : null;
  const title = `${w.line(p)} · ${label}`;
  return `<section class="line" id="line-${p + 1}">
<${heading}>${link ? `<a href="${linePath(lang, n, p)}">${esc(title)}</a>` : esc(title)}</${heading}>
<div class="line-head">${figure(lines, { hl: [p], label: `${hexTitle(lang, n)}, ${title}` })}<div>${lineText(lang, n, p)}</div></div>
<ul class="facts">${facts(lang, n, p).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
${meaning ? `<p>${esc(meaning.x)}</p><p>${esc(meaning.l)}</p>` : ""}
<p class="changes">${esc(w.changesTo)} ${hLink(lang, ch, [p])}</p>
${heading === "h1" ? takashimaBlock(lang, n, String(p)) : ""}
</section>`;
}

// --- pages ------------------------------------------------------------------

function descFor(lang: Lang, n: number) {
  const h = getByNumber(n);
  if (lang === "en") return `${hexTitle("en", n)}: ${T.trigram_en[h.upper][1]} over ${T.trigram_en[h.lower][1]}. The judgment and six lines in Legge's translation, each line drawn and explained, and Takashima Donshō's commentary.`;
  if (lang === "ja") return `${hexTitle("ja", n)}の卦辞・爻辞（原文）、六爻それぞれの図と構造、高島呑象の解釈。上卦${T.trigram_ja[h.upper][0]}・下卦${T.trigram_ja[h.lower][0]}。`;
  return `${h.name}卦（第${n}卦），上${h.upper}下${h.lower}：卦辞、六爻爻辞与逐爻图解、义理，附高岛呑象《増補高島易断》原注。`;
}

export // legge.json stores 用九/用六 as one string, not a list, so joining it directly
// threw on the only two hexagrams that have it (1 and 2).
function leggeYong(n: number): string {
  const v = LEGGE[String(n)].yong;
  return Array.isArray(v) ? v.join(" ") : (v ?? "");
}

// --- hexagram FAQ -------------------------------------------------------------
// Questions and answers generated only from the site's own data: the judgment text, the two
// trigrams and their images, and the moving-line reading order taught on the Learn pages.
const FAQ_HEADING: Record<Lang, string> = { en: "Frequently asked questions", zh: "常见问题", ja: "よくある質問" };

function hexFaq(lang: Lang, n: number): { q: string; aHtml: string; aText: string }[] {
  const h = getByNumber(n);
  const up = h.upper, lo = h.lower;
  const ml = `<a href="${learnPath(lang, "moving-lines")}">${esc(learnTitle(lang, "moving-lines"))}</a>`;
  const mlName = learnTitle(lang, "moving-lines");
  if (lang === "en") {
    const j = String(LEGGE[String(n)].judgment);
    return [
      { q: `What is I Ching hexagram ${n} (${T.hexagram_en[String(n)][0]}, ${h.name})?`,
        aHtml: `${esc(hexTitle(lang, n))} is hexagram ${n} of the 64: ${esc(T.trigram_en[up][1])} over ${esc(T.trigram_en[lo][1])}. Its judgment, in James Legge’s translation, reads: “${esc(j)}”`,
        aText: `${hexTitle(lang, n)} is hexagram ${n} of the 64: ${T.trigram_en[up][1]} over ${T.trigram_en[lo][1]}. Its judgment, in James Legge’s translation, reads: “${j}”` },
      { q: `Which two trigrams form hexagram ${n}?`,
        aHtml: `The upper (outer) trigram is ${esc(trigramTitle(lang, up))}, whose image is ${esc(T.trigram_en[up][1])}; the lower (inner) trigram is ${esc(trigramTitle(lang, lo))}, whose image is ${esc(T.trigram_en[lo][1])}.`,
        aText: `The upper (outer) trigram is ${trigramTitle(lang, up)}, whose image is ${T.trigram_en[up][1]}; the lower (inner) trigram is ${trigramTitle(lang, lo)}, whose image is ${T.trigram_en[lo][1]}.` },
      { q: `How is a moving line in hexagram ${n} read?`,
        aHtml: `Read the moving line’s own text first — each line section on this page gives it — then look at the hexagram it changes into, linked under “${esc(W.en.changesTo)}”. See ${ml} for how moving lines and the changed hexagram work.`,
        aText: `Read the moving line’s own text first — each line section on this page gives it — then look at the hexagram it changes into, linked under “${W.en.changesTo}”. See “${mlName}” for how moving lines and the changed hexagram work.` },
    ];
  }
  if (lang === "ja") {
    const j = String(TRAD[String(n)].judgment);
    const name = T.hexagram_ja[String(n)][0];
    return [
      { q: `第${n}卦 ${name}とはどんな卦ですか？`,
        aHtml: `${esc(hexTitle(lang, n))}は六十四卦の第${n}卦で、上卦は${esc(up)}、下卦は${esc(lo)}です。卦辞の原文は「${esc(j)}」。`,
        aText: `${hexTitle(lang, n)}は六十四卦の第${n}卦で、上卦は${up}、下卦は${lo}です。卦辞の原文は「${j}」。` },
      { q: `${name}を構成する二つの卦は何ですか？`,
        aHtml: `上卦（外卦）は${esc(trigramTitle(lang, up))}で、象は${esc(T.trigram_ja[up][2])}。下卦（内卦）は${esc(trigramTitle(lang, lo))}で、象は${esc(T.trigram_ja[lo][2])}です。`,
        aText: `上卦（外卦）は${trigramTitle(lang, up)}で、象は${T.trigram_ja[up][2]}。下卦（内卦）は${trigramTitle(lang, lo)}で、象は${T.trigram_ja[lo][2]}です。` },
      { q: `${name}の動爻はどう読みますか？`,
        aHtml: `まず本卦の動爻そのものの爻辞を読みます（このページの各爻の節にあります）。次に、その爻が変化してなる之卦を見ます（「${esc(W.ja.changesTo)}」のリンク先）。動爻と之卦の仕組みは${ml}を参照してください。`,
        aText: `まず本卦の動爻そのものの爻辞を読みます（このページの各爻の節にあります）。次に、その爻が変化してなる之卦を見ます（「${W.ja.changesTo}」のリンク先）。動爻と之卦の仕組みは「${mlName}」を参照してください。` },
    ];
  }
  const j = h.judgment;
  return [
    { q: `第 ${n} 卦 ${h.name} 是什么卦？`,
      aHtml: `${esc(h.name)}是六十四卦之第 ${n} 卦，上${esc(up)}下${esc(lo)}。卦辞原文：「${esc(j)}」`,
      aText: `${h.name}是六十四卦之第 ${n} 卦，上${up}下${lo}。卦辞原文：「${j}」` },
    { q: `${h.name} 由哪两个三画卦组成？`,
      aHtml: `上卦（外卦）为 ${esc(up)} ${SYMBOLS[up]}，象${esc(T.nature[up])}；下卦（内卦）为 ${esc(lo)} ${SYMBOLS[lo]}，象${esc(T.nature[lo])}。`,
      aText: `上卦（外卦）为 ${up} ${SYMBOLS[up]}，象${T.nature[up]}；下卦（内卦）为 ${lo} ${SYMBOLS[lo]}，象${T.nature[lo]}。` },
    { q: `${h.name} 的动爻怎么读？`,
      aHtml: `先读本卦动爻本身的爻辞（见本页各爻小节），再看该爻变化后所成的之卦（见各爻下「${esc(W.zh.changesTo)}」的链接）。动爻与之卦的原理见${ml}。`,
      aText: `先读本卦动爻本身的爻辞（见本页各爻小节），再看该爻变化后所成的之卦（见各爻下「${W.zh.changesTo}」的链接）。动爻与之卦的原理见《${mlName}》。` },
  ];
}

function faqSection(lang: Lang, n: number) {
  return `<section class="faq"><h2>${esc(FAQ_HEADING[lang])}</h2>${hexFaq(lang, n).map(({ q, aHtml }) => `<h3>${esc(q)}</h3><p>${aHtml}</p>`).join("")}</section>`;
}

/** EN only: one factual sentence-summary of the hexagram, templated from its name, trigrams and Legge's judgment. */
function inBrief(n: number) {
  const h = getByNumber(n);
  const [name, meaningWord] = T.hexagram_en[String(n)];
  const first = String(LEGGE[String(n)].judgment).split(/(?<=[.!?])\s+/)[0];
  return `<p class="brief"><b>In brief:</b> ${esc(name)} — “${esc(meaningWord)}” — is ${esc(T.trigram_en[h.upper][1])} over ${esc(T.trigram_en[h.lower][1])}. Legge translates its judgment: “${esc(first)}”</p>`;
}

function hexagramPage(lang: Lang, n: number, origin: string) {
  const w = W[lang];
  const h = getByNumber(n);
  const lines = linesOf(h);
  const meaning = lang === "zh" ? T.hexagram_meaning[h.name] : "";
  const yong = h.yong
    ? `<section class="line" id="yong"><h3>${esc(h.yong.label)} · ${esc(w.yongLabel)}</h3><blockquote class="text">${esc(lang === "en" ? leggeYong(n) : h.yong.text)}</blockquote>${takashimaBlock(lang, n, "yong")}</section>`
    : "";
  const body = `<article>
<p class="kicker">${esc(lang === "en" ? `Hexagram ${n} of 64` : lang === "ja" ? `六十四卦の第${n}` : `六十四卦之第 ${n}`)}</p>
<h1>${esc(hexTitle(lang, n))}</h1>
<div class="hero">${figure(lines, { label: hexTitle(lang, n) })}
<div class="trigrams"><div><span class="muted small">${esc(w.upper)}</span>${tLink(lang, h.upper)}</div><div><span class="muted small">${esc(w.lower)}</span>${tLink(lang, h.lower)}</div></div></div>
<h2>${esc(w.judgment)}</h2>${judgmentText(lang, n)}
${lang === "en" ? inBrief(n) : ""}
${meaning ? `<p>${esc(meaning)}</p>` : ""}
${takashimaBlock(lang, n, "judgment")}
${adUnit(AD_SLOT_INARTICLE)}
<h2>${esc(w.lines)}</h2>
${[5, 4, 3, 2, 1, 0].map((p) => lineSection(lang, n, p)).join("")}
${yong}
${faqSection(lang, n)}
${adUnit(AD_SLOT_DISPLAY)}
<nav class="prevnext">${n > 1 ? `<a rel="prev" href="${hexPath(lang, n - 1)}">← ${esc(w.prev)}: ${esc(hexShort(lang, n - 1))}</a>` : "<span></span>"}${n < 64 ? `<a rel="next" href="${hexPath(lang, n + 1)}">${esc(w.next)}: ${esc(hexShort(lang, n + 1))} →</a>` : ""}</nav>
${lang === "en" ? `<p class="muted small">${esc(w.legge)}</p>` : ""}
</article>`;
  return shell({
    lang, origin, title: `${hexTitle(lang, n)} · ${w.site}`, description: descFor(lang, n), path: (l) => hexPath(l, n), og: `/og/${n}.png`, side: { n },
    jsonld: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Article", headline: hexTitle(lang, n), inLanguage: lang,
          about: { "@type": "CreativeWork", name: "I Ching (Book of Changes)" }, isPartOf: { "@type": "WebSite", name: W.en.site, url: origin },
          breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: w.all, item: `${origin}/${lang}/hexagrams` },
            { "@type": "ListItem", position: 2, name: hexTitle(lang, n), item: origin + hexPath(lang, n) }] } },
        { "@type": "FAQPage", inLanguage: lang,
          mainEntity: hexFaq(lang, n).map(({ q, aText }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: aText } })) },
      ],
    },
  }, body);
}

export function linePage(lang: Lang, n: number, p: number, origin: string) {
  const w = W[lang];
  const label = lineLabel(p, linesOf(getByNumber(n))[p] === 1);
  const title = `${hexTitle(lang, n)} · ${w.line(p)} ${label}`;
  const body = `<article><p class="kicker"><a href="${hexPath(lang, n)}">${esc(hexTitle(lang, n))}</a></p>
${lineSection(lang, n, p, { heading: "h1", link: false })}
${adUnit(AD_SLOT_INARTICLE)}
<nav class="prevnext">${p > 0 ? `<a rel="prev" href="${linePath(lang, n, p - 1)}">← ${esc(w.line(p - 1))}</a>` : `<a href="${hexPath(lang, n)}">← ${esc(hexShort(lang, n))}</a>`}${p < 5 ? `<a rel="next" href="${linePath(lang, n, p + 1)}">${esc(w.line(p + 1))} →</a>` : `<a href="${hexPath(lang, n)}">${esc(hexShort(lang, n))} →</a>`}</nav></article>`;
  const desc = lang === "en"
    ? `${title}: “${LEGGE[String(n)].lines[p]}” Drawn and explained, with the hexagram it changes to and Takashima's commentary.`
    : lang === "ja" ? `${title}：${TRAD[String(n)].lines[p]} 爻の図・構造・之卦と高島の解釈。`
      : `${title}：${getByNumber(n).lines[p]} 爻位图解、义理、之卦与高岛原注。`;
  return shell({ lang, origin, title: `${title} · ${w.site}`, description: desc, path: (l) => linePath(l, n, p), og: `/og/${n}.png`, side: { n, p } }, body);
}

export function hexagramsIndex(lang: Lang, origin: string) {
  const w = W[lang];
  const grid = HEXAGRAMS.map((h) => `<li>${hLink(lang, h.number)}</li>`).join("");
  const title = lang === "en" ? "The 64 hexagrams of the I Ching" : lang === "ja" ? "易経 六十四卦一覧" : "周易六十四卦";
  return shell({ lang, origin, title: `${title} · ${w.site}`, path: (l) => `/${l}/hexagrams`,
    description: lang === "en" ? "All 64 I Ching hexagrams, each drawn line by line, with the judgment, the six lines and Takashima's commentary." :
      lang === "ja" ? "易経の六十四卦すべてを図で一覧。卦辞・爻辞・高島呑象の解釈へ。" : "周易六十四卦全览，逐卦图示，附卦辞爻辞与高岛原注。" },
    `<h1>${esc(title)}</h1><ol class="grid">${grid}</ol>`);
}

export function trigramPage(lang: Lang, slug: string, origin: string) {
  const t = SLUG_TRIGRAM[slug];
  if (!t) return null;
  const w = W[lang];
  const asLower = HEXAGRAMS.filter((h) => h.lower === t), asUpper = HEXAGRAMS.filter((h) => h.upper === t);
  const n = ORDER.indexOf(t) + 1;
  const info = lang === "en"
    ? `${T.trigram_en[t][1]}; in the family, the ${FAMILY_EN[t]}; direction ${DIR_EN[t]} (Later Heaven); Earlier Heaven number ${n}.`
    : lang === "ja" ? `象は${T.trigram_ja[t][2]}、家族では${FAMILY_JA[t]}、先天数 ${n}。`
      : `象${T.nature[t]}，家人为${T.family[t]}，五行${T.elements[t]}，方位${T.directions[t]}，先天数 ${n}，动物象${T.creatures[t]}。`;
  const title = trigramTitle(lang, t);
  const body = `<h1>${esc(title)}</h1><div class="hero">${figure([...T.trigrams[t]], { label: title })}<p>${esc(info)}</p></div>
<h2>${esc(w.asLower)}</h2><ol class="grid">${asLower.map((h) => `<li>${hLink(lang, h.number)}</li>`).join("")}</ol>
<h2>${esc(w.asUpper)}</h2><ol class="grid">${asUpper.map((h) => `<li>${hLink(lang, h.number)}</li>`).join("")}</ol>`;
  return shell({ lang, origin, title: `${title} · ${w.site}`, path: (l) => `/${l}/trigram/${slug}`, description: `${title}: ${info}`, side: { trigram: t } }, body);
}

export function trigramsIndex(lang: Lang, origin: string) {
  const w = W[lang];
  const title = lang === "en" ? "The eight trigrams" : lang === "ja" ? "八卦" : "八卦";
  return shell({ lang, origin, title: `${title} · ${w.site}`, path: (l) => `/${l}/trigrams`,
    description: lang === "en" ? "The eight trigrams of the I Ching in the Earlier Heaven order, each with its image and the hexagrams it forms." : `${title}：先天八卦之序，各附所成之卦。` },
    `<h1>${esc(title)}</h1><ol class="grid tri-grid">${ORDER.map((t) => `<li>${tLink(lang, t)}</li>`).join("")}</ol>`);
}

export function sitemap(origin: string) {
  const urls: string[] = [];
  for (const l of LANGS) {
    urls.push(`/${l}/`, `/${l}/hexagrams`, `/${l}/trigrams`, ...LEARN.map((s) => learnPath(l, s)), ...INFO.map((s) => infoPath(l, s)));
    for (const t of ORDER) urls.push(trigramPath(l, t));
    for (let n = 1; n <= 64; n++) {
      urls.push(hexPath(l, n));
      for (let p = 0; p < 6; p++) urls.push(linePath(l, n, p));
    }
  }
  const altFor = (u: string) => {
    const rest = u.replace(/^\/(en|zh|ja)\//, "");
    const href = (l: Lang) => `${origin}/${l}/${rest}`;
    return LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l === "zh" ? "zh-Hans" : l}" href="${href(l)}"/>`).join("") +
      `<xhtml:link rel="alternate" hreflang="x-default" href="${href("en")}"/>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map((u) => `<url><loc>${origin}${u}</loc>${altFor(u)}<lastmod>2026-11-18</lastmod></url>`).join("\n")}\n</urlset>\n`;
}

/** Page URLs for a cast, so the website, the API and the MCP server can link every part of a reading. */
export function castLinks(lang: Lang, origin: string, chain: any) {
  const n = chain.hexagram.number;
  const h = getByNumber(n);
  const p = chain.moving_position;
  return {
    hexagram: origin + hexPath(lang, n),
    moving_line: p === null ? null : origin + linePath(lang, n, p),
    changed: chain.changed ? origin + hexPath(lang, chain.changed.number) : null,
    lower_trigram: origin + trigramPath(lang, h.lower),
    upper_trigram: origin + trigramPath(lang, h.upper),
  };
}

export function route(path: string, origin: string): string | null {
  const lm = /^\/(en|zh|ja)\/learn\/([a-z-]+)$/.exec(path);
  if (lm) {
    const lang = lm[1] as Lang, pg = learnPage(lang, lm[2]);
    return pg && shell({ lang, origin, title: `${pg.title} · ${W[lang].site}`, description: pg.description, path: (l) => learnPath(l, lm[2]), side: { learn: lm[2] } }, pg.body.replace('<nav class="prevnext">', `${adUnit(AD_SLOT_INARTICLE)}<nav class="prevnext">`));
  }
  const im = /^\/(en|zh|ja)\/([a-z]+)$/.exec(path);
  const ip = im && infoPage(im[1] as Lang, im[2], origin);
  if (ip) return shell({ lang: im![1] as Lang, origin, title: `${ip.title} · ${W[im![1] as Lang].site}`, description: ip.description, path: (l) => `/${l}/${im![2]}` }, ip.body);
  const m = /^\/(en|zh|ja)\/(hexagrams|trigrams|hexagram\/(\d+)(?:-[a-z-]*)?(?:\/line-([1-6]))?|trigram\/([a-z]+))$/.exec(path);
  if (!m) return null;
  const lang = m[1] as Lang;
  if (m[2] === "hexagrams") return hexagramsIndex(lang, origin);
  if (m[2] === "trigrams") return trigramsIndex(lang, origin);
  if (m[5]) return trigramPage(lang, m[5], origin);
  const n = Number(m[3]);
  if (!(n >= 1 && n <= 64)) return null;
  return m[4] ? linePage(lang, n, Number(m[4]) - 1, origin) : hexagramPage(lang, n, origin);
}
