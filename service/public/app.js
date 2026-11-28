// I Ching · Takashima Method — website. All casting and text come from the Worker's /api.

const UI = {
  en: {
    brand: "I Ching · Takashima Method",
    sharedNote: "This is a shared reading. The same input always gives the same hexagram.",
    startOwn: "Start your own reading",
    step1: "1 · Prepare", step2: "2 · Cast", step3: "3 · Every step", step4: "4 · The text", step5: "5 · Afterwards",
    ready: "I'm ready",
    chooseTitle: "Cast your hexagram",
    noQuestion: "Keep your question in your mind. Don't type it anywhere: it never leaves your head.",
    tabStalks: "Split the stalks", tabPhrase: "Say a phrase", tabNumbers: "Numbers", tabTime: "This moment",
    stalksHow: "49 stalks are moving. At the moment your mind feels most focused, tap them (or press Space) to split them in two, without aiming. Do it three times.",
    divide: "Split now",
    phraseLabel: "The first short phrase that comes to mind",
    cast: "Cast",
    numbersLabel: "Two or three positive whole numbers, whatever comes to mind",
    timeHow: "When you are ready, cast with this exact moment (your local time).",
    castNow: "Cast now",
    showAll: "Show all steps",
    judgment: "The judgment", takashima: "Takashima's commentary", zhan: "Takashima's readings by topic", cases: "Takashima's recorded cases",
    copyLink: "Copy link to this reading", openGrok: "Ask the Grok Bot", restart: "New reading",
    footer: "A study tool for the classic text: it shows the method and the sources, and makes no predictions. The decision is always yours.",
    mcp: "MCP server for AI assistants:",
    left: (l, r) => `Left hand ${l} · right hand ${r}`,
    countItem: (i, l) => `Change ${i}: left hand ${l} stalks`,
    waiting: (i) => `Change ${i} of 3: tap when ready`,
    casting: "Casting…",
    movingLine: (label) => `The moving line — ${label}`,
    leggeSrc: "English: James Legge, The Yî King (Sacred Books of the East XVI, 1882). Public domain.",
    tkNote: "Takashima's own words from Zōho Takashima Ekidan, shown in the Chinese text. For an explanation in English, ask the Grok Bot.",
    omitted: "Health, pregnancy and war-related passages are left out.",
    copied: "Link copied.",
    allHex: "All 64 hexagrams",
    upperTri: "upper trigram", lowerTri: "lower trigram", lineLink: "this line explained",
    error: "Something went wrong. Please try again.",
  },
  zh: {
    brand: "周易 · 高岛略筮",
    sharedNote: "这是别人分享的一卦。同一输入永远得同一卦。",
    startOwn: "自己起一卦",
    step1: "一 · 准备", step2: "二 · 起卦", step3: "三 · 逐步推演", step4: "四 · 经文", step5: "五 · 起卦之后",
    ready: "我准备好了",
    chooseTitle: "起卦",
    noQuestion: "所问之事放在心里，不要写出来。它不会进入任何系统。",
    tabStalks: "分筮竹", tabPhrase: "说一句话", tabNumbers: "报数", tabTime: "此刻",
    stalksHow: "四十九根筮竹在移动。心最专一的那一刻，点一下（或按空格）随手分为二，不要瞄准。共分三次。",
    divide: "分",
    phraseLabel: "当下浮现的一句话",
    cast: "起卦",
    numbersLabel: "随口报两三个正整数",
    timeHow: "准备好时，以此刻（你所在地的时间）起卦。",
    castNow: "以此刻起卦",
    showAll: "显示全部步骤",
    judgment: "卦辞", takashima: "高岛原书", zhan: "高岛分事占断", cases: "高岛占例",
    copyLink: "复制这一卦的链接", openGrok: "问 Grok Bot", restart: "重新起卦",
    footer: "这是经文与方法的检索工具：展示过程与出处，不作预测。结论永远在你。",
    mcp: "供 AI 助手使用的 MCP 服务：",
    left: (l, r) => `左手 ${l} 策 · 右手 ${r} 策`,
    countItem: (i, l) => `第${"一二三"[i - 1]}变：左手 ${l} 策`,
    waiting: (i) => `第${"一二三"[i - 1]}变（共三变）：准备好就点`,
    casting: "起卦中…",
    movingLine: (label) => `动爻 · ${label}`,
    leggeSrc: "",
    tkNote: "以下为高岛原书之辞，照录原文。",
    omitted: "健康、生育与战事相关内容已略去。",
    copied: "链接已复制。",
    allHex: "六十四卦",
    upperTri: "上卦", lowerTri: "下卦", lineLink: "此爻详解",
    error: "出错了，请再试一次。",
  },
  hant: {
    brand: "周易 · 高島略筮",
    sharedNote: "這是別人分享的一卦。同一輸入永遠得同一卦。",
    startOwn: "自己起一卦",
    step1: "一 · 準備", step2: "二 · 起卦", step3: "三 · 逐步推演", step4: "四 · 經文", step5: "五 · 起卦之後",
    ready: "我準備好了",
    chooseTitle: "起卦",
    noQuestion: "所問之事放在心裡，不要寫出來。它不會進入任何系統。",
    tabStalks: "分筮竹", tabPhrase: "說一句話", tabNumbers: "報數", tabTime: "此刻",
    stalksHow: "四十九根筮竹在移動。心最專一的那一刻，點一下（或按空格）隨手分為二，不要瞄準。共分三次。",
    divide: "分",
    phraseLabel: "當下浮現的一句話",
    cast: "起卦",
    numbersLabel: "隨口報兩三個正整數",
    timeHow: "準備好時，以此刻（你所在地的時間）起卦。",
    castNow: "以此刻起卦",
    showAll: "顯示全部步驟",
    judgment: "卦辭", takashima: "高島原書", zhan: "高島分事占斷", cases: "高島占例",
    copyLink: "複製這一卦的鏈接", openGrok: "問 Grok Bot", restart: "重新起卦",
    footer: "這是經文與方法的檢索工具：展示過程與出處，不作預測。結論永遠在你。",
    mcp: "供 AI 助手使用的 MCP 服務：",
    left: (l, r) => `左手 ${l} 策 · 右手 ${r} 策`,
    countItem: (i, l) => `第${"一二三"[i - 1]}變：左手 ${l} 策`,
    waiting: (i) => `第${"一二三"[i - 1]}變（共三變）：準備好就點`,
    casting: "起卦中…",
    movingLine: (label) => `動爻 · ${label}`,
    leggeSrc: "",
    tkNote: "以下為高島原書之辭，照錄原文。",
    omitted: "健康、生育與戰事相關內容已略去。",
    copied: "鏈接已複製。",
    allHex: "六十四卦",
    upperTri: "上卦", lowerTri: "下卦", lineLink: "此爻詳解",
    error: "出錯了，請再試一次。",
  },
  ja: {
    brand: "易経 · 高島流略筮",
    sharedNote: "共有された卦です。同じ入力からは必ず同じ卦が得られます。",
    startOwn: "自分で占う",
    step1: "一 · 準備", step2: "二 · 起卦", step3: "三 · 手順をすべて", step4: "四 · 経文", step5: "五 · 占いのあとに",
    ready: "準備ができました",
    chooseTitle: "卦を立てる",
    noQuestion: "占う事は心の中に。どこにも書かないでください。",
    tabStalks: "筮竹を分ける", tabPhrase: "言葉を一言", tabNumbers: "数", tabTime: "今この時",
    stalksHow: "四十九本の筮竹が動いています。心が最も一つにまとまった瞬間に、狙わずにタップ（またはスペースキー）して二つに分けてください。三回行います。",
    divide: "分ける",
    phraseLabel: "今ふと浮かんだ言葉",
    cast: "卦を立てる",
    numbersLabel: "思い浮かんだ正の整数を二つか三つ",
    timeHow: "準備ができたら、今この瞬間（現地時刻）で卦を立てます。",
    castNow: "今で立てる",
    showAll: "すべての手順を表示",
    judgment: "卦辞", takashima: "高島の解釈", zhan: "高島の事項別占断", cases: "高島の占例",
    copyLink: "この卦のリンクをコピー", openGrok: "Grok Bot に聞く", restart: "新しく占う",
    footer: "経文と方法を調べるための道具です。手順と出典を示し、予言はしません。結論はご自身で。",
    mcp: "AI アシスタント用 MCP サーバー：",
    left: (l, r) => `左手 ${l} 本 · 右手 ${r} 本`,
    countItem: (i, l) => `第${"一二三"[i - 1]}変：左手 ${l} 本`,
    waiting: (i) => `第${"一二三"[i - 1]}変（全三変）：準備ができたらタップ`,
    casting: "起卦中…",
    movingLine: (label) => `動爻 · ${label}`,
    leggeSrc: "",
    tkNote: "高島の原書は日本語（明治19年刊）ですが、ここでは漢文テキストをそのまま掲げます。",
    omitted: "健康・出産・戦争に関する部分は省略しています。",
    copied: "リンクをコピーしました。",
    allHex: "六十四卦一覧",
    upperTri: "上卦", lowerTri: "下卦", lineLink: "この爻の解説",
    error: "エラーが発生しました。もう一度お試しください。",
  },
};

const $ = (s) => document.querySelector(s);

// Analytics: events go to the GTM dataLayer; GTM forwards them to GA4.
function track(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}
// Derive a cast method from input KEYS only. Never send the values — a phrase
// is the user's question and must stay on the device.
const methodOf = (x) => !x ? "none" : "piles" in x ? "stalks" : "seed" in x ? "phrase" : "numbers" in x ? "numbers" : "at" in x ? "now" : "shared";
const $$ = (s) => [...document.querySelectorAll(s)];
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const k of kids) if (k !== null && k !== undefined) e.append(k);
  return e;
};

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
const session = {
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
  take: (k) => { try { const v = sessionStorage.getItem(k); sessionStorage.removeItem(k); return v; } catch { return null; } },
};

const params = new URLSearchParams(location.search);
const INPUT_KEYS = ["seed", "piles", "numbers", "at", "variant"];

function pickLang() {
  const page = document.documentElement.dataset.lang;
  if (page in UI) return page;
  const q = params.get("lang");
  if (q in UI) return q;
  const saved = store.get("lang");
  if (saved in UI) return saved;
  const nav = (navigator.language || "").toLowerCase();
  if (/^zh-(hant|tw|hk|mo)\b/.test(nav)) return "hant";
  return nav.startsWith("zh") ? "zh" : nav.startsWith("ja") ? "ja" : "en";
}

let lang = pickLang();
let guide = null;
let input = null;      // the cast input, kept so a language switch re-renders the same reading
let chain = null;
let revealTimer = null;

const t = (k) => UI[lang][k];

async function api(path, q) {
  const res = await fetch(`/api/${path}?` + new URLSearchParams({ ...q, lang }));
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || t("error"));
  return body;
}

// ---------------------------------------------------------------------------
// language and static text
// ---------------------------------------------------------------------------

function applyChrome() {
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang === "hant" ? "zh-Hant" : lang;
  document.title = t("brand");
  for (const n of $$("[data-i18n]")) {
    const v = t(n.dataset.i18n);
    if (typeof v === "string") n.textContent = v;
  }
  for (const b of $$(".langs [data-lang]")) b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  $("#mcp-url").textContent = location.origin + "/mcp";
  $("#all-link").setAttribute("href", `/${lang}/hexagrams`);
}

function quoteBlock(item) {
  if (!item.quote) return null;
  const qLang = lang === "en" ? "zh" : lang === "zh" ? "zh-Hans" : lang === "hant" ? "zh-Hant" : lang;
  const q = el("blockquote", { class: "quote" }, el("span", { lang: qLang }, item.quote));
  if (item.quote_en) q.append(el("div", {}, "“" + item.quote_en + "”"));
  if (item.src) q.append(el("cite", {}, item.src));
  return q;
}

function renderGuide() {
  $("#prep-title").textContent = guide.title;
  $("#prep-intro").textContent = guide.intro;
  $("#prep-steps").replaceChildren(...guide.prepare.map((s) => el("li", {}, el("strong", {}, s.step), s.say, quoteBlock(s))));
  $("#after-list").replaceChildren(...guide.after.map((s) => el("li", {}, el("strong", {}, s.step), s.say, quoteBlock(s))));
  const phraseInput = guide.inputs.find((i) => i.method === "lueshi");
  $("#phrase").placeholder = phraseInput.example;
  const how = $("[data-panel=phrase] .muted");
  how.textContent = phraseInput.how;
}

// Load the other language's page: the sidebars and guide are rendered on the server.
// A cast in progress travels in the URL; the flag keeps it from showing as a shared link.
function setLang(next) {
  if (next === lang) return;
  store.set("lang", next);
  const u = new URL(location.href);
  u.pathname = `/${next}/`;
  u.searchParams.delete("lang");
  if (input) session.set("own-cast", "1");
  location.assign(u);
}

// ---------------------------------------------------------------------------
// casting
// ---------------------------------------------------------------------------

function show(id) {
  $(id).hidden = false;
}

// Casting funnel: a view per step lets GA4 show exactly where readers drop off.
const stepView = (step, extra = {}) => track("cast_step_view", { lang, step, ...extra });

function selectTab(name) {
  for (const b of $$("[data-tab]")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
  for (const p of $$("[data-panel]")) p.hidden = p.dataset.panel !== name;
  stalks.active = name === "stalks";
  if (stalks.active) stalks.start();
  else stalks.stop();
}

const stalks = {
  counts: [], cursor: 24, dir: 1, timer: null, busy: false, active: false,
  build() {
    $("#stalks").replaceChildren(...Array.from({ length: 49 }, () => el("span", { class: "stalk" })));
    this.paint();
  },
  paint() {
    const kids = $("#stalks").children;
    for (let i = 0; i < kids.length; i++) {
      kids[i].classList.toggle("gap", i === this.cursor);
      kids[i].classList.toggle("left", i < this.cursor);
      kids[i].classList.toggle("right", i >= this.cursor);
    }
  },
  start() {
    if (this.timer || this.busy || this.counts.length >= 3) return;
    $("#stalks").classList.remove("split");
    this.timer = setInterval(() => {
      // sweep back and forth across 1..48, a little unevenly, so the split can't be aimed
      this.cursor += this.dir * (Math.random() < 0.25 ? 2 : 1);
      if (this.cursor >= 48) { this.cursor = 48; this.dir = -1; }
      if (this.cursor <= 1) { this.cursor = 1; this.dir = 1; }
      this.paint();
    }, 34);
  },
  stop() {
    clearInterval(this.timer);
    this.timer = null;
  },
  reset() {
    this.stop();
    this.counts = [];
    this.busy = false;
    $("#stalk-counts").replaceChildren();
    $("#stalks").classList.remove("split");
    updateStalkStatus();
  },
  divide() {
    if (!this.timer || this.busy) return;
    this.stop();
    this.busy = true;
    const left = this.cursor;
    this.counts.push(left);
    track("cast_change_completed", { lang, change: this.counts.length });
    $("#stalks").classList.add("split");
    $("#stalk-status").textContent = t("left")(left, 49 - left);
    $("#stalk-counts").append(el("li", {}, t("countItem")(this.counts.length, left)));
    setTimeout(() => {
      this.busy = false;
      if (this.counts.length < 3) {
        updateStalkStatus();
        this.start();
      } else {
        runCast({ piles: this.counts.join(",") });
      }
    }, 1300);
  },
};

function updateStalkStatus() {
  if (stalks.counts.length < 3 && !stalks.busy) $("#stalk-status").textContent = t("waiting")(stalks.counts.length + 1);
}

function localIso() {
  const d = new Date();
  const p = (n) => String(Math.abs(n)).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` +
    `${off >= 0 ? "+" : "-"}${p(Math.trunc(off / 60))}:${p(off % 60)}`;
}

function castError(msg, method = "none") {
  const e = $("#cast-error");
  e.textContent = msg;
  e.hidden = !msg;
  // Send the stage, never the message: an API error may echo the user's phrase.
  if (msg) track("cast_error", { lang, cast_method: method, stage: "chain" });
}

// ---------------------------------------------------------------------------
// reveal and reading
// ---------------------------------------------------------------------------

const linesFromGlyphs = (g) => [...g].reverse().map((c) => (c === "⚊" ? 1 : 0));

const TRIGRAM_SLUG = { "☰": "qian", "☱": "dui", "☲": "li", "☳": "zhen", "☴": "xun", "☵": "kan", "☶": "gen", "☷": "kun" };

/** Turn a narration line into text with links: trigram symbols go to their trigram page, hexagram titles to theirs. */
function linkify(text, c) {
  const targets = [[c.titles.hexagram, c.links.hexagram]];
  if (c.changed) targets.push([c.titles.changed, c.links.changed]);
  const pattern = new RegExp(`(${targets.map(([t]) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}|[☰-☷])`, "g");
  const out = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    out.push(text.slice(last, m.index));
    const hit = targets.find(([t]) => t === m[0]);
    const href = hit ? hit[1] : `/${lang}/trigram/${TRIGRAM_SLUG[m[0]]}`;
    out.push(el("a", { href, class: hit ? "inline-hex" : "inline-tri" }, m[0]));
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

const linkTo = (href, text) => (href ? el("a", { href }, text) : text);

function drawHex(target, lines, moving, animate) {
  target.replaceChildren(...lines.map((l, i) => {
    const bar = el("div", { class: `bar ${l ? "yang" : "yin"}${moving.includes(i) ? " moving" : ""}` });
    bar.append(...(l ? [el("span")] : [el("span"), el("span")]));
    return bar;
  }));
  [...target.children].forEach((b, i) => (animate ? setTimeout(() => b.classList.add("on"), 220 * i + 100) : b.classList.add("on")));
}

async function runCast(next, { animate = true } = {}) {
  castError("");
  let c;
  try {
    c = await api("chain", next);
  } catch (e) {
    if ($("#method").hidden) {
      // a shared link with bad input: fall back to the normal flow
      $("#shared").hidden = true;
      $("#prepare").hidden = true;
      show("#method");
      selectTab("stalks");
    }
    castError(e.message, methodOf(next));
    stalks.reset();
    if ($('[data-tab="stalks"]').getAttribute("aria-selected") === "true") stalks.start();
    return;
  }
  input = next;
  chain = c;
  track("cast_completed", {
    lang,
    cast_method: methodOf(next),
    hexagram_number: c.hexagram.number,
    hexagram_title: c.titles?.hexagram || "",
    moving_line: c.moving_position == null ? 0 : c.moving_position + 1,
    changed_hexagram_number: c.changed ? c.changed.number : 0,
  });
  const u = new URL(location.href);
  for (const k of INPUT_KEYS) u.searchParams.delete(k);
  for (const [k, v] of Object.entries(input)) u.searchParams.set(k, v);
  history.replaceState(null, "", u);

  $("#method").hidden = true;
  $("#prepare").hidden = true;
  show("#reveal");
  stepView("reveal");
  const lines = linesFromGlyphs(c.hexagram.glyphs);
  const moving = c.changed ? lines.flatMap((l, i) => (l !== c.changed.linesBottomUp[i] ? [i] : [])) : [];
  drawHex($("#hex"), lines, moving, animate);
  window.dispatchEvent(new CustomEvent("iching:cast", { detail: { lines } }));
  $("#hex-name").replaceChildren(linkTo(c.links.hexagram, c.titles.hexagram));
  $("#changed-wrap").hidden = !c.changed;
  if (c.changed) {
    drawHex($("#hex-changed"), c.changed.linesBottomUp, [], animate);
    $("#changed-name").replaceChildren(linkTo(c.links.changed, c.titles.changed));
  }

  clearInterval(revealTimer);
  const list = $("#narration");
  list.replaceChildren();
  const skip = $('[data-action="skip"]');
  const finish = () => {
    clearInterval(revealTimer);
    list.replaceChildren(...c.narration.map((n) => el("li", {}, ...linkify(n, c))));
    skip.hidden = true;
    loadReading();
  };
  if (!animate) return finish();
  skip.hidden = false;
  $("#reveal").scrollIntoView({ behavior: "smooth", block: "start" });
  let i = 0;
  revealTimer = setInterval(() => {
    if (i >= c.narration.length) return finish();
    list.append(el("li", {}, ...linkify(c.narration[i++], c)));
  }, 900);
}

async function loadReading() {
  const c = chain;
  const n = c.hexagram.number;
  const [read, tk] = await Promise.all([
    api("read", { n }),
    c.next ? api("takashima", { n, pos: c.next.position }) : Promise.resolve(null),
  ]);
  if (c !== chain) return; // a newer cast or language switch has started
  const p = c.moving_position;
  $("#read-title").replaceChildren(linkTo(c.links.hexagram, c.titles.hexagram));
  const [upSym, loSym] = [...c.hexagram.symbol].filter((x) => x in TRIGRAM_SLUG);
  $("#read-parts").replaceChildren(
    el("a", { href: c.links.upper_trigram }, `${upSym} ${t("upperTri")}`), " · ",
    el("a", { href: c.links.lower_trigram }, `${loSym} ${t("lowerTri")}`),
    ...(c.links.moving_line ? [" · ", el("a", { href: c.links.moving_line }, t("lineLink"))] : []),
    ...(c.links.changed ? [" · ", el("a", { href: c.links.changed }, c.titles.changed)] : []));
  const original = (txt) => el("div", { class: "muted small", lang: "zh" }, txt);
  if (lang === "en") {
    $("#read-judgment").replaceChildren(read.english.judgment, original(read.judgment));
  } else if (lang === "ja") {
    $("#read-judgment").replaceChildren(el("span", { lang: "ja" }, read.japanese.judgment));
  } else {
    $("#read-judgment").replaceChildren(read.judgment);
  }
  $("#read-line-wrap").hidden = p === null;
  if (p !== null) {
    const ln = read.lines[p];
    $("#read-line-label").replaceChildren(linkTo(c.links.moving_line, t("movingLine")(ln.label)));
    if (lang === "en") $("#read-line").replaceChildren(read.english.lines[p], original(ln.text));
    else if (lang === "ja") $("#read-line").replaceChildren(el("span", { lang: "ja" }, read.japanese.lines[p]));
    else $("#read-line").replaceChildren(ln.text);
    $("#read-meaning").replaceChildren(...((lang === "zh" || lang === "hant") && ln.meaning ? [el("p", {}, ln.meaning.xiang), el("p", {}, ln.meaning.li)] : []));
  }
  $("#read-source").textContent = lang === "en" ? t("leggeSrc") : "";
  show("#reading");

  $("#tk").hidden = !tk;
  if (tk) {
    const tkLang = lang === "hant" ? "zh-Hant" : "zh";
    $("#tk-commentary").lang = tkLang;
    $("#tk-zhan").lang = tkLang;
    $("#tk-cases").lang = tkLang;
    $("#tk-note").textContent = t("tkNote") + (tk.omitted.zhan || tk.omitted.cases ? " " + t("omitted") : "");
    $("#tk-commentary").textContent = tk.commentary;
    $("#tk-zhan").replaceChildren(...(tk.zhan_general ? [el("dd", {}, tk.zhan_general)] : []),
      ...tk.zhan.flatMap((z) => [el("dt", {}, (lang === "hant" ? "問" : "问") + z.topic), el("dd", {}, z.text)]));
    $("#tk-zhan-wrap").hidden = !tk.zhan.length && !tk.zhan_general;
    $("#tk-cases").replaceChildren(...tk.cases.map((x) => el("div", { class: "case" }, x.cast ? el("b", {}, x.cast) : null, x.text)));
    $("#tk-cases-wrap").hidden = !tk.cases.length;
    $("#tk-source").textContent = `${tk.source.author}《${tk.source.work}》 · ${tk.source.location}`;
  }
  show("#after");
  stepView("reading");
}

// ---------------------------------------------------------------------------
// wiring
// ---------------------------------------------------------------------------

function restart() {
  input = null;
  chain = null;
  clearInterval(revealTimer);
  const u = new URL(location.href);
  for (const k of INPUT_KEYS) u.searchParams.delete(k);
  history.replaceState(null, "", u);
  for (const id of ["#shared", "#method", "#reveal", "#reading", "#after"]) $(id).hidden = true;
  show("#prepare");
  stalks.reset();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Reading behaviour: do readers follow the result into the hexagram, line and
// trigram pages? Only clicks inside the reveal/reading flow count here; the
// sidebars are tracked separately by explore.js.
document.addEventListener("click", (ev) => {
  const a = ev.target.closest('#reveal a[href*="/hexagram/"], #reveal a[href*="/trigram/"], #reading a[href*="/hexagram/"], #reading a[href*="/trigram/"], #after a[href*="/hexagram/"], #after a[href*="/trigram/"]');
  if (a) track("reading_link_click", { lang, target: a.getAttribute("href") });
});

document.addEventListener("click", async (ev) => {
  const a = ev.target.closest("[data-action]");
  const l = ev.target.closest(".langs [data-lang]");
  const tab = ev.target.closest("[data-tab]");
  if (l) {
    track("language_switched", { from_lang: lang, to_lang: l.dataset.lang });
    return setLang(l.dataset.lang);
  }
  if (tab) {
    track("cast_method_selected", { lang, method: tab.dataset.tab });
    return selectTab(tab.dataset.tab);
  }
  if (ev.target.closest("#stalks")) return stalks.divide();
  if (!a) return;
  const act = a.dataset.action;
  if (act === "ready") {
    track("cast_started", { lang });
    $("#prepare").hidden = true;
    show("#method");
    stepView("method");
    selectTab("stalks");
    $("#method").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (act === "divide") stalks.divide();
  else if (act === "now") runCast({ at: localIso() });
  else if (act === "skip") {
    clearInterval(revealTimer);
    $("#narration").replaceChildren(...chain.narration.map((n) => el("li", {}, ...linkify(n, chain))));
    a.hidden = true;
    loadReading();
  } else if (act === "restart") restart();
  else if (act === "copy") {
    // Never send the URL: it carries the phrase/numbers the user cast with.
    track("share_link_copy", { lang, cast_method: methodOf(input), hexagram_number: chain?.hexagram?.number || 0 });
    try {
      await navigator.clipboard.writeText(location.href);
      $("#copied").textContent = t("copied");
    } catch {
      $("#copied").textContent = location.href;
    }
  }
});

document.addEventListener("keydown", (ev) => {
  if (ev.code === "Space" && stalks.active && !$("#method").hidden && !["INPUT", "BUTTON", "A"].includes(document.activeElement?.tagName)) {
    ev.preventDefault();
    stalks.divide();
  }
});

$("[data-panel=phrase]").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const v = $("#phrase").value.trim();
  if (v) runCast({ seed: v });
});

$("[data-panel=numbers]").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const nums = ["n1", "n2", "n3"].map((k) => String(f.get(k) || "").trim()).filter(Boolean);
  runCast({ numbers: nums.join(",") });
});

(async function init() {
  applyChrome();
  stalks.build();
  try {
    guide = await api("guide", {});
  } catch {
    track("cast_error", { lang, stage: "guide" });
    $("#prep-intro").textContent = t("error");
    return;
  }
  renderGuide();
  const shared = Object.fromEntries(INPUT_KEYS.filter((k) => params.get(k)).map((k) => [k, params.get(k)]));
  if (Object.keys(shared).length) {
    if (!session.take("own-cast")) show("#shared");
    $("#prepare").hidden = true;
    await runCast(shared, { animate: false });
  }
  // Deep link from the Learn pages: /#cast skips the guide, /#cast=stalks|phrase|numbers|time also preselects the method.
  const deep = /^#(?:cast|method)(?:=([a-z]+))?$/.exec(location.hash);
  if (deep && !Object.keys(shared).length) {
    $("#prepare").hidden = true;
    show("#method");
    stepView("method", { entry: "deep_link" });
    if (deep[1] && ["stalks", "phrase", "numbers", "time"].includes(deep[1])) selectTab(deep[1]);
    $("#method").scrollIntoView();
  }
})();
