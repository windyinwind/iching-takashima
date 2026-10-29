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
    tkNote: "Takashima's own words, in Wang Zhiben's Chinese translation of Zōho Takashima Ekidan, shown untranslated. For an explanation in English, ask the Grok Bot.",
    omitted: "Health, pregnancy and war-related passages are left out.",
    copied: "Link copied.",
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
    tkNote: "以下为高岛原书之辞（王治本汉译），照录原文。",
    omitted: "健康、生育与战事相关内容已略去。",
    copied: "链接已复制。",
    error: "出错了，请再试一次。",
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
    tkNote: "高島の原書は日本語（明治19年刊）ですが、ここでは王治本の漢訳を原文のまま掲げます。",
    omitted: "健康・出産・戦争に関する部分は省略しています。",
    copied: "リンクをコピーしました。",
    error: "エラーが発生しました。もう一度お試しください。",
  },
};

const $ = (s) => document.querySelector(s);
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

const params = new URLSearchParams(location.search);
const INPUT_KEYS = ["seed", "piles", "numbers", "at", "variant"];

function pickLang() {
  const q = params.get("lang");
  if (q in UI) return q;
  const saved = store.get("lang");
  if (saved in UI) return saved;
  const nav = (navigator.language || "").toLowerCase();
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
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  document.title = t("brand");
  for (const n of $$("[data-i18n]")) {
    const v = t(n.dataset.i18n);
    if (typeof v === "string") n.textContent = v;
  }
  for (const b of $$("[data-lang]")) b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  $("#mcp-url").textContent = location.origin + "/mcp";
}

function quoteBlock(item) {
  if (!item.quote) return null;
  const q = el("blockquote", { class: "quote" }, el("span", { lang: lang === "en" ? "zh" : lang }, item.quote));
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

async function setLang(next) {
  lang = next;
  store.set("lang", lang);
  const u = new URL(location.href);
  u.searchParams.set("lang", lang);
  history.replaceState(null, "", u);
  applyChrome();
  guide = await api("guide", {});
  renderGuide();
  updateStalkStatus();
  if (input) await runCast(input, { animate: false });
}

// ---------------------------------------------------------------------------
// casting
// ---------------------------------------------------------------------------

function show(id) {
  $(id).hidden = false;
}

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

function castError(msg) {
  const e = $("#cast-error");
  e.textContent = msg;
  e.hidden = !msg;
}

// ---------------------------------------------------------------------------
// reveal and reading
// ---------------------------------------------------------------------------

const linesFromGlyphs = (g) => [...g].reverse().map((c) => (c === "⚊" ? 1 : 0));

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
    castError(e.message);
    stalks.reset();
    if ($('[data-tab="stalks"]').getAttribute("aria-selected") === "true") stalks.start();
    return;
  }
  input = next;
  chain = c;
  const u = new URL(location.href);
  for (const k of INPUT_KEYS) u.searchParams.delete(k);
  for (const [k, v] of Object.entries(input)) u.searchParams.set(k, v);
  history.replaceState(null, "", u);

  $("#method").hidden = true;
  $("#prepare").hidden = true;
  show("#reveal");
  const lines = linesFromGlyphs(c.hexagram.glyphs);
  const moving = c.changed ? lines.flatMap((l, i) => (l !== c.changed.linesBottomUp[i] ? [i] : [])) : [];
  drawHex($("#hex"), lines, moving, animate);
  $("#hex-name").textContent = c.titles.hexagram;
  $("#changed-wrap").hidden = !c.changed;
  if (c.changed) {
    drawHex($("#hex-changed"), c.changed.linesBottomUp, [], animate);
    $("#changed-name").textContent = c.titles.changed;
  }

  clearInterval(revealTimer);
  const list = $("#narration");
  list.replaceChildren();
  const skip = $('[data-action="skip"]');
  const finish = () => {
    clearInterval(revealTimer);
    list.replaceChildren(...c.narration.map((n) => el("li", {}, n)));
    skip.hidden = true;
    loadReading();
  };
  if (!animate) return finish();
  skip.hidden = false;
  $("#reveal").scrollIntoView({ behavior: "smooth", block: "start" });
  let i = 0;
  revealTimer = setInterval(() => {
    if (i >= c.narration.length) return finish();
    list.append(el("li", {}, c.narration[i++]));
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
  $("#read-title").textContent = c.titles.hexagram;
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
    $("#read-line-label").textContent = t("movingLine")(ln.label);
    if (lang === "en") $("#read-line").replaceChildren(read.english.lines[p], original(ln.text));
    else if (lang === "ja") $("#read-line").replaceChildren(el("span", { lang: "ja" }, read.japanese.lines[p]));
    else $("#read-line").replaceChildren(ln.text);
    $("#read-meaning").replaceChildren(...(lang === "zh" && ln.meaning ? [el("p", {}, ln.meaning.xiang), el("p", {}, ln.meaning.li)] : []));
  }
  $("#read-source").textContent = lang === "en" ? t("leggeSrc") : "";
  show("#reading");

  $("#tk").hidden = !tk;
  if (tk) {
    $("#tk-note").textContent = t("tkNote") + (tk.omitted.zhan || tk.omitted.cases ? " " + t("omitted") : "");
    $("#tk-commentary").textContent = tk.commentary;
    $("#tk-zhan").replaceChildren(...(tk.zhan_general ? [el("dd", {}, tk.zhan_general)] : []),
      ...tk.zhan.flatMap((z) => [el("dt", {}, "问" + z.topic), el("dd", {}, z.text)]));
    $("#tk-zhan-wrap").hidden = !tk.zhan.length && !tk.zhan_general;
    $("#tk-cases").replaceChildren(...tk.cases.map((x) => el("div", { class: "case" }, x.cast ? el("b", {}, x.cast) : null, x.text)));
    $("#tk-cases-wrap").hidden = !tk.cases.length;
    $("#tk-source").textContent = `${tk.source.author}《${tk.source.work}》${tk.source.translator ? "，" + tk.source.translator : ""} · ${tk.source.location}`;
  }
  show("#after");
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

document.addEventListener("click", async (ev) => {
  const a = ev.target.closest("[data-action]");
  const l = ev.target.closest("[data-lang]");
  const tab = ev.target.closest("[data-tab]");
  if (l) return setLang(l.dataset.lang);
  if (tab) return selectTab(tab.dataset.tab);
  if (ev.target.closest("#stalks")) return stalks.divide();
  if (!a) return;
  const act = a.dataset.action;
  if (act === "ready") {
    $("#prepare").hidden = true;
    show("#method");
    selectTab("stalks");
    $("#method").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (act === "divide") stalks.divide();
  else if (act === "now") runCast({ at: localIso() });
  else if (act === "skip") {
    clearInterval(revealTimer);
    $("#narration").replaceChildren(...chain.narration.map((n) => el("li", {}, n)));
    a.hidden = true;
    loadReading();
  } else if (act === "restart") restart();
  else if (act === "copy") {
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
    $("#prep-intro").textContent = t("error");
    return;
  }
  renderGuide();
  const shared = Object.fromEntries(INPUT_KEYS.filter((k) => params.get(k)).map((k) => [k, params.get(k)]));
  if (Object.keys(shared).length) {
    show("#shared");
    $("#prepare").hidden = true;
    await runCast(shared, { animate: false });
  }
})();
