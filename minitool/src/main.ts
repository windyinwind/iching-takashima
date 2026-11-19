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
  // 分筮竹只在方法页且处于该方法面板时游走
  if (id === "v-method") stalks.start();
  else stalks.stop();
  window.scrollTo(0, 0);
}

// --- 工具 --------------------------------------------------------------------
const POS_KEY: Record<string, string> = { 初: "0", 二: "1", 三: "2", 四: "3", 五: "4", 上: "5" };
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
  $("rv-hex").textContent = String(h.glyphs).split("").join("\n");
  $("rv-name").textContent = `${h.number} · ${h.name}卦（上${h.upper}下${h.lower}）`;
  const ol = $("rv-narration");
  ol.innerHTML = "";
  const lines = c.narration.map((n: string) => `<li>${esc(n)}</li>`).join("");
  ol.innerHTML = lines;
  $("rv-steps").textContent = `${c.method} · 共 ${c.narration.length} 步`;
  // 逐步显示：先只露第一条，用户点「继续」推进
  const items = Array.from(ol.children) as El[];
  items.forEach((li, i) => (li.hidden = i > 0));
  let shown = 1;
  const btn = $("rv-next");
  btn.hidden = false;
  $("rv-skip").hidden = false;
  const advance = () => {
    if (shown < items.length) {
      items[shown++].hidden = false;
      if (shown === items.length) btn.hidden = true;
    }
  };
  btn.onclick = advance;
  $("rv-skip").onclick = () => {
    items.forEach((li) => (li.hidden = false));
    shown = items.length;
    btn.hidden = true;
  };
  $("rv-reproduce").textContent = c.reproduce?.note ?? "";
  store.set("last-cast", JSON.stringify({ input: (LAST as any)._input ?? null, hex: h.number }));
  show("v-reveal");
  $("rv-to-reading").onclick = () => renderReading(c);
}

function renderReading(c: any): void {
  const h = c.hexagram;
  const r = engine.read(h.number, null, "zh");
  $("rd-judgment-label").textContent = `${h.number} · ${h.name}卦 卦辞`;
  $("rd-judgment").innerHTML = blockquote(r.judgment);
  $("rd-ctx").textContent = `上${r.hexagram.upper}（${r.upper_nature}）下${r.hexagram.lower}（${r.lower_nature}）`;

  // 动爻（略筮法恒得一爻；无动爻则只读卦辞）
  const pos = c.next?.position ?? null;
  const wrap = $("rd-line-wrap");
  if (pos) {
    const lr = engine.read(h.number, pos, "zh");
    const li = lr.line;
    $("rd-line-label").textContent = `${h.name}卦 ${li.label} · 动爻`;
    $("rd-line").innerHTML = blockquote(li.text);
    const m = li.meaning ?? ({} as any);
    $("rd-meaning").innerHTML =
      `<p><b>取象：</b>${esc(m.xiang ?? "")}</p><p><b>义理：</b>${esc(m.li ?? "")}</p>` +
      (m.sources?.length ? `<p class="small muted">出处：${esc(m.sources.map((s: any) => s.work).join("、"))}</p>` : "");
    // 高岛节录（与网站卦页同源切片）
    const tk = excerptFor(h.number, li.label);
    $("rd-tk").innerHTML = tk
      ? `<h3>高岛原书 · 节录</h3>` + tk.map((p: string) => `<p lang="zh">${esc(p)}</p>`).join("")
      : "";
    // 之卦
    const ch = c.changed;
    $("rd-changed").innerHTML = ch
      ? `<p class="arrow">→ 之卦</p><div class="changed">${esc(String(ch.glyphs).split("").join("\n"))}<p>${ch.number} · ${ch.name}卦（事之所趋，轻轻读）</p>` +
        blockquote(engine.read(ch.number, null, "zh").judgment) +
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
