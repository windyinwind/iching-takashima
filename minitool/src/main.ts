// 小红书小工具：周易·高岛略筮（中文精简版）
// 确定性引擎与网站/MCP 同源（../service/src/engine），不作预测，结论留给用户。
import * as engine from "../../service/src/engine/index.ts";
import TAKASHIMA_ZH from "excerpts-zh";

type El = HTMLElement;
const $ = (id: string): El => document.getElementById(id)!;
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// --- 平台能力（判空降级；存储失败只用内存，不回退 localStorage） -------------
const X = (window as any).xhs;
const HAS_X = !!(X && X.miniTool);
const mem: Record<string, string> = {};
const store = {
  get(k: string): string | null {
    try {
      if (HAS_X && X.miniTool.getStorage) return X.miniTool.getStorage({ key: k }).data?.value ?? null;
    } catch {}
    return mem[k] ?? null;
  },
  set(k: string, v: string): void {
    mem[k] = v;
    try {
      if (HAS_X && X.miniTool.setStorage) X.miniTool.setStorage({ key: k, value: v });
    } catch {}
  },
};
const buzz = () => {
  try {
    if (HAS_X && X.miniTool.vibrateShort) X.miniTool.vibrateShort({});
  } catch {}
};

// --- 分筮竹互动（同网站：光标自动游走，点「分」定左手根数，三变成卦） ---------
const stalks = {
  counts: [] as number[],
  cursor: 24,
  dir: 1,
  timer: null as any,
  busy: false,
  build(): void {
    const box = $("stalks");
    box.innerHTML = "";
    for (let i = 0; i < 49; i++) {
      const s = document.createElement("span");
      s.className = "stalk";
      box.appendChild(s);
    }
    this.paint();
  },
  paint(): void {
    const kids = $("stalks").children;
    for (let i = 0; i < kids.length; i++) {
      (kids[i] as El).classList.toggle("gap", i === this.cursor);
      (kids[i] as El).classList.toggle("left", i < this.cursor);
    }
  },
  start(): void {
    if (this.timer || this.busy || this.counts.length >= 3) return;
    const box = $("stalks");
    box.classList.remove("split");
    this.timer = setInterval(() => {
      // 来回扫过 1..48，略有快慢不匀，让人瞄不准
      this.cursor += this.dir * (Math.random() < 0.25 ? 2 : 1);
      if (this.cursor >= 48) { this.cursor = 48; this.dir = -1; }
      if (this.cursor <= 1) { this.cursor = 1; this.dir = 1; }
      this.paint();
    }, 34);
    $("stalk-status").textContent = this.waitingText();
  },
  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  },
  reset(): void {
    this.stop();
    this.counts = [];
    this.busy = false;
    $("stalk-counts").innerHTML = "";
    $("stalks").classList.remove("split");
    $("stalk-status").textContent = this.waitingText();
  },
  waitingText(): string {
    const n = ["一", "二", "三"][this.counts.length] ?? "一";
    return this.counts.length >= 3 ? "" : `第${n}变：点「分」定左手根数`;
  },
  divide(): void {
    if (!this.timer || this.busy) return;
    this.stop();
    this.busy = true;
    const left = this.cursor;
    this.counts.push(left);
    $("stalks").classList.add("split");
    const right = 49 - left;
    $("stalk-status").textContent = `第${["一", "二", "三"][this.counts.length - 1]}变：左手 ${left} 策，右手 ${right} 策`;
    const li = document.createElement("li");
    li.textContent = `第${["一", "二", "三"][this.counts.length - 1]}变左手 ${left} 策`;
    $("stalk-counts").appendChild(li);
    buzz();
    setTimeout(() => {
      this.busy = false;
      if (this.counts.length < 3) this.start();
      else runCast({ piles: this.counts });
    }, 1100);
  },
};

function show(id: string): void {
  for (const v of document.querySelectorAll(".view")) (v as El).hidden = v.id !== id;
  // 分筮竹只在方法页且处于该方法面板时游走。
  // 三次分完起卦后 counts 保留 3 个值；退回方法页必须重置，否则 start() 被 counts>=3 挡住，按钮卡死。
  if (id === "v-method") {
    if (stalks.counts.length >= 3) stalks.reset();
    stalks.start();
  } else stalks.stop();
  window.scrollTo(0, 0);
}

// --- 工具 --------------------------------------------------------------------
const POS_KEY: Record<string, string> = { 初: "0", 二: "1", 三: "2", 四: "3", 五: "4", 上: "5" };
const METHOD_LABEL: Record<string, string> = { lueshi: "略筮法", dayan: "大衍筮法", numbers: "报数起卦", time: "时间起卦" };

// 断语小抄：经文里这些字最让人费解。这里是字义解释（字典），不是对任何事项的判断。
const VERDICT: Record<string, string> = {
  "元吉": "大吉，吉中最强",
  "无咎": "没有灾祸；常出现在告诫之后，指照着做可免于咎",
  "利贞": "宜于守持正固，不躁进",
  "亨": "通畅，事情无阻隔",
  "吉": "有利、顺遂（经文原字，非对你的判断）",
  "咎": "灾祸、过错",
  "厉": "危险、不稳；经典常连「无咎」给出路",
  "悔亡": "悔恨消失，指改辙之后憾恨可消",
  "悔": "懊悔、因走错一步而憾",
  "吝": "羞吝、难堪，较「厉」为轻",
  "凶": "不利（经文原字，非对你的判断）",
};
const VERDICT_ORDER = ["元吉", "无咎", "利贞", "亨", "吉", "悔亡", "悔", "吝", "厉", "咎", "凶"];
const verdictsIn = (text: string): { word: string; gloss: string }[] =>
  VERDICT_ORDER.filter((w) => text.includes(w)).map((w) => ({ word: w, gloss: VERDICT[w] }));
const excerptKey = (label: string): string => POS_KEY[label[0]] ?? "judgment";
const excerptFor = (n: number, label: string | null): string[] | null => {
  const key = label ? excerptKey(label) : "judgment";
  return (TAKASHIMA_ZH as any)[String(n)]?.[key]?.zh ?? null;
};

function localIso(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sign}${p(Math.abs(off) / 60 | 0)}:${p(Math.abs(off) % 60)}`;
}

const blockquote = (text: string, cls = "text") => `<blockquote class="${cls}">${esc(text)}</blockquote>`;

// 卦画：一行一条长横杠，阳爻一条实线、阴爻中间断开（同网站的呈现）
const hexBars = (glyphs: string): string =>
  glyphs.split("").map((g) =>
    g === "⚊"
      ? `<div class="hexrow yang"><i class="bar"></i></div>`
      : `<div class="hexrow yin"><i class="bar"></i><i class="bar"></i></div>`
  ).join("");

// --- 起卦入口 ----------------------------------------------------------------
let LAST: any = null;

function runCast(input: Record<string, unknown>): void {
  let c: any;
  try {
    c = engine.chain({ ...input, lang: "zh" } as any);
  } catch (e) {
    if (e instanceof engine.EngineError) return alert(e.message);
    throw e;
  }
  LAST = c;
  buzz();
  renderReveal(c);
}

function renderReveal(c: any): void {
  const h = c.hexagram;
  $("rv-hex").innerHTML = hexBars(String(h.glyphs));
  $("rv-name").textContent = `${h.number} · ${h.name}卦（上${h.upper}下${h.lower}）`;
  $("rv-hex").classList.remove("revealed");
  $("rv-name").classList.remove("revealed");
  const banner = $("rv-banner");
  banner.hidden = false;
  banner.innerHTML = `<span class="banner-cap">结果：这一卦是</span> <b>${esc(h.name)}卦</b>（第${esc(String(h.number))}卦）　动爻 ${esc(c.next?.position ?? "—")}　之卦 ${esc(String(c.changed?.number ?? "—"))}·${esc(c.changed?.name ?? "—")}<br><span class="banner-note">上面一行就是结果。下面是怎么一步步算出来的（可核对）；看完点「看这一卦的解读」读经文。</span>`;
  const ol = $("rv-narration");
  ol.innerHTML = "";
  const lines = c.narration.map((n: string) => `<li>${esc(n)}</li>`).join("");
  ol.innerHTML = lines;
  $("rv-steps").textContent = `${METHOD_LABEL[c.method] ?? c.method} · 共 ${c.narration.length} 步`;
  // 逐步推演：像网站一样每秒推出一条，卦名在最后一条出现时才点亮
  const items = Array.from(ol.children) as El[];
  items.forEach((li, i) => (li.hidden = i > 0));
  let shown = 1;
  let timer: any = null;
  const btn = $("rv-next");
  const skipBtn = $("rv-skip");
  btn.hidden = false;
  skipBtn.hidden = false;
  const finish = () => {
    if (timer) { clearInterval(timer); timer = null; }
    items.forEach((li) => (li.hidden = false));
    shown = items.length;
    btn.hidden = true;
    skipBtn.hidden = true;
    $("rv-hex").classList.add("revealed");
    $("rv-name").classList.add("revealed");
  };
  const advance = () => {
    if (shown < items.length) {
      items[shown++].hidden = false;
      if (shown === items.length) finish();
    }
  };
  btn.onclick = advance;
  skipBtn.onclick = finish;
  timer = setInterval(advance, 420);
  $("rv-reproduce").textContent = c.reproduce ? `同一输入必得同一卦 · ${c.reproduce}` : "";
  store.set("last-cast", JSON.stringify({ input: (LAST as any)._input ?? null, hex: h.number }));
  show("v-reveal");
  $("rv-to-reading").onclick = () => { finish(); renderReading(c); };
}

function renderReading(c: any): void {
  const h = c.hexagram;
  const r = engine.read(h.number, null, "zh");
  const pos = c.next?.position ?? null;
  const lr = pos ? engine.read(h.number, pos, "zh") : null;
  const li: any = lr?.line ?? null;

  // ── 结果速览：一眼看清「起了什么卦、动哪爻、在讲什么、先看哪」──
  const summary = $("rd-summary");
  const parts: string[] = [];
  parts.push(`<div class="sum-head"><span class="sum-no">第 ${esc(String(h.number))} 卦</span><b>${esc(h.name)}卦</b></div>`);
  parts.push(`<div class="sum-meta">上${esc(h.upper)}（${esc(r.upper_nature?.nature ?? "")}）· 下${esc(h.lower)}（${esc(r.lower_nature?.nature ?? "")}）` +
    (pos ? `　·　动爻 <b>${esc(pos)}</b>　·　之卦 ${esc(String(c.changed?.number ?? "—"))} ${esc(c.changed?.name ?? "")}` : "") + `</div>`);
  // 白话大意：用引擎的 plain 层（真正的现代白话），结果的意思放最显眼处
  if (r.plain?.zh) parts.push(`<div class="sum-meaning"><span class="sum-step">1</span><div><b>这卦在讲什么</b><p>${esc(r.plain.zh)}</p></div></div>`);
  if (li?.plain?.zh) parts.push(`<div class="sum-meaning"><span class="sum-step">2</span><div><b>动的这一爻在讲什么</b><p>${esc(li.plain.zh)}</p></div></div>`);
  parts.push(`<p class="sum-how">怎么读：先看卦辞（全卦处境）→ 再看动爻（你这一爻）→ 之卦作参照。看完往下翻，原文按此顺序排好。</p>`);
  // 断语小抄：只列本卦经文里真正出现的字，大白话解释（不按事项下断）
  const vw = verdictsIn(r.judgment + " " + (li?.text ?? ""));
  if (vw.length) {
    parts.push(`<details class="verdict-box" open><summary>经文里的「${esc(vw.map((v) => v.word).join("、"))}」是什么意思？</summary>` +
      vw.map((v) => `<p><b>${esc(v.word)}</b>：${esc(v.gloss)}</p>`).join("") +
      `<p class="small muted">以上是对经文用字的解释；吉凶等字是《周易》原文，不是对你的判断。</p></details>`);
  }
  summary.innerHTML = parts.join("");

  // ── 经文原文（按读序排：卦辞 → 动爻 → 之卦）──
  $("rd-ctx").textContent = `以下经文均按「卦辞 → 动爻 → 之卦」的次序排列；吉凶等字是《周易》原文引用，不是给你的判断。`;
  $("rd-judgment-label").textContent = `① 卦辞 · 全卦的处境`;
  $("rd-judgment-label").className = "section-h";
  $("rd-judgment").innerHTML = blockquote(r.judgment);
  // 卦辞白话：引擎 plain 层的现代白话转写，直接摆在原文下方
  if (r.plain?.zh) {
    $("rd-judgment").insertAdjacentHTML("afterend", `<p class="plain"><b>白话：</b>${esc(r.plain.zh)}</p>`);
  }
  const label2 = $("rd-line-label");
  label2.className = "section-h";

  const wrap = $("rd-line-wrap");
  if (li) {
    $("rd-line-label").textContent = `② 动爻 · ${esc(li.label)}（略筮法系于这一爻，重点看）`;
    $("rd-line").innerHTML = blockquote(li.text);
    const m = li.meaning ?? ({} as any);
    $("rd-meaning").innerHTML =
      (li.plain?.zh ? `<p class="plain"><b>白话：</b>${esc(li.plain.zh)}</p>` : "") +
      (m.sources?.length ? `<details class="source-box"><summary>原文取象与义理（点开看）</summary><p class="small muted">取象：${esc(m.xiang ?? "")}　义理：${esc(m.li ?? "")}</p><p class="small muted">出处：${esc(m.sources.map((s: any) => s.work).join("、"))}</p></details>` : "");
    // 高岛原书节录：出处引文，折叠收起，想深入者自点
    const tk = excerptFor(h.number, li.label);
    $("rd-tk").innerHTML = tk
      ? `<details class="source-box"><summary>高岛原书 · 义理节录（王治本汉译，点开看原文）</summary>` +
        tk.map((p: string) => `<p lang="zh">${esc(p)}</p>`).join("") +
        `<p class="small muted">引自《増補高島易断》，为原书对这一爻的阐发，不是给你的判断。</p></details>`
      : "";
    // 之卦：changed 对象只有 linesBottomUp，没有 glyphs —— 由爻线现算
    const ch = c.changed;
    const chGlyphs = Array.isArray(ch?.linesBottomUp)
      ? ch.linesBottomUp.slice().reverse().map((b: number) => (b === 1 ? "⚊" : "⚋")).join("")
      : ch?.symbol ?? "";
    $("rd-changed").innerHTML = ch
      ? `<p class="arrow">→ 之卦</p><div class="changed"><div class="hexdraw">${hexBars(chGlyphs)}</div><p>${ch.number} · ${ch.name}卦（事之所趋，轻轻读）</p>` +
        blockquote(engine.read(ch.number, null, "zh").judgment) +
        (engine.read(ch.number, null, "zh").plain?.zh
          ? `<p class="plain"><b>白话：</b>${esc(engine.read(ch.number, null, "zh").plain.zh)}</p>` : "") +
        `</div>`
      : "";
    wrap.hidden = false;
  } else {
    wrap.hidden = true;
    $("rd-tk").innerHTML = "";
    $("rd-changed").innerHTML = "";
  }
  $("rd-disclaimer").textContent = r.disclaimer;
  show("v-reading");
}

// --- 事件绑定（全部 addEventListener，无行内事件） ----------------------------
function bind(): void {
  stalks.build();
  $("prep-ready").addEventListener("click", () => show("v-method"));

  // 上次结果
  const last = store.get("last-cast");
  if (last) {
    try {
      const n = JSON.parse(last).hex;
      $("prep-last").textContent = `看上次的结果：${n} · ${engine.title(n, "zh")}`;
      $("prep-last").hidden = false;
      $("prep-last").addEventListener("click", () => {
        const r = engine.read(n, null, "zh");
        renderReading({ hexagram: r.hexagram, next: null, changed: null });
      });
    } catch {}
  }

  // 方法选项卡
  const tabs = document.querySelectorAll("[data-tab]") as NodeListOf<El>;
  const panels = document.querySelectorAll("[data-panel]") as NodeListOf<El>;
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.setAttribute("aria-selected", String(x === t)));
      panels.forEach((p) => (p.hidden = p.dataset.panel !== t.dataset.tab));
      if (t.dataset.tab === "stalks") { stalks.reset(); stalks.start(); }
      else stalks.stop();
    })
  );

  // 分筮竹：点「分」或点策列即分
  $("stalk-divide").addEventListener("click", () => stalks.divide());
  $("stalks").addEventListener("click", () => stalks.divide());

  // 随口一句
  $("m-phrase-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const v = ($("m-phrase") as HTMLInputElement).value.trim();
    if (v) runCast({ seed: v });
  });

  // 分筮竹
  $("m-piles-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const vals = (["p1", "p2", "p3"] as const).map((id) => (($(`m-${id}`) as HTMLInputElement).value || "").trim());
    if (vals.some((v) => !v)) return alert("请报齐三次左手的根数。");
    runCast({ piles: vals });
  });

  // 报数
  $("m-numbers-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const vals = (["n1", "n2", "n3"] as const)
      .map((id) => (($(`m-${id}`) as HTMLInputElement).value || "").trim())
      .filter(Boolean);
    if (vals.length < 2) return alert("请报两个或三个正整数。");
    runCast({ numbers: vals });
  });

  // 当前时间
  $("m-now").addEventListener("click", () => runCast({ at: localIso() }));

  $("rv-back").addEventListener("click", () => show("v-method"));
  $("rd-again").addEventListener("click", () => show("v-after"));
  $("af-restart").addEventListener("click", () => show("v-prepare"));
}

bind();
show("v-prepare");
// 深链：#method 直达方法选择页（与网站 /#cast 同思路）
if (location.hash === "#method") show("v-method");
