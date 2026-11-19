// 小工具端到端回归：在 jsdom 里加载 dist 构建产物，驱动真实 UI 走完全流程，
// 并与 Python 引擎（zy.py）的输出逐字对拍。网站、MCP、小工具三端同源引擎的
// 一致性由此保证。运行前先 node build.mjs。
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";
import { TextEncoder, TextDecoder } from "node:util";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, "..", "dist");
const ZY = join(HERE, "..", "..", "skills", "zhouyi-lookup", "scripts", "zy.py");

const zy = (args) => JSON.parse(execFileSync("python3", [ZY, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));

async function boot() {
  const dom = await JSDOM.fromFile(join(DIST, "index.html"), {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    beforeParse(window) {
      // jsdom 未内置的 Web API（真机 Chrome 61+ 均原生可用）
      window.TextEncoder = TextEncoder;
      window.TextDecoder = TextDecoder;
      window.structuredClone = (v) => JSON.parse(JSON.stringify(v));
      window.scrollTo = () => {};
      window.alert = (msg) => { window.__alert = msg; };
    },
  });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("main.js 加载超时")), 15000);
    dom.window.addEventListener("load", () => { clearTimeout(t); resolve(); });
  });
  // main.js 在 load 事件后执行（普通脚本在 body 末尾）——等一个宏任务
  await new Promise((r) => setTimeout(r, 300));
  return dom.window;
}

const $ = (w, id) => w.document.getElementById(id);
const visible = (w, id) => !$(w, id).hidden;
const text = (w, id) => $(w, id).textContent;

async function castPhrase(w, seed) {
  $(w, "prep-ready").click();
  const input = $(w, "m-phrase");
  input.value = seed;
  $(w, "m-phrase-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 100));
}

test("静态首屏：准备五步在 JS 之前即可见", async () => {
  const w = await boot();
  assert.equal(text(w, "rd-disclaimer") === undefined, false);
  assert.match(w.document.body.textContent, /一事一占/);
  assert.match(w.document.body.textContent, /至诚之际报数/);
  assert.match(w.document.body.textContent, /増補高島易断/);
  assert.ok(visible(w, "v-prepare"));
  w.close();
});

test("随口一句起卦：与 zy.py 逐字对拍（seed=今天下午 → 旅卦）", async () => {
  const w = await boot();
  await castPhrase(w, "今天下午");

  // 视图流转
  assert.ok(visible(w, "v-reveal"), "应进入推演视图");
  // 结果横幅一眼可见：明确写"结果"、卦名、动爻、之卦
  const banner = $(w, "rv-banner").textContent;
  assert.match(banner, /结果：/);
  assert.match(banner, /旅卦/);
  assert.match(banner, /之卦/);
  assert.match(banner, /动爻/);
  // 逐步动画：narration 逐条出现（间隔 420ms），先只露第一条
  const li0 = $(w, "rv-narration").children;
  assert.equal(li0.length, 15);
  assert.equal(li0[0].hidden, false);
  assert.equal(li0[1].hidden, true, "第二条应先隐藏（自动逐条推出）");
  await new Promise((r) => setTimeout(r, 500));
  assert.equal(li0[1].hidden, false, "约 420ms 后第二条应自动出现");
  // 与 zy.py 对拍：narration 全文一致
  const oracle = zy(["chain", "--seed", "今天下午", "--lang", "zh"]);
  $(w, "rv-skip").click();
  const uiAll = Array.from($(w, "rv-narration").children).map((li) => li.textContent);
  assert.deepEqual(uiAll, oracle.narration, "narration 应与 zy.py 逐字一致");
  assert.equal(oracle.hexagram.number, 56, "zy.py 应得 56 旅");
  assert.match(text(w, "rv-name"), /56 · 旅卦/);
  assert.match(uiAll[2], /左手 6 策/);
  w.close();
});

test("经文页：卦辞、动爻、义理、高岛节录、免责声明齐全", async () => {
  const w = await boot();
  await castPhrase(w, "今天下午");
  $(w, "rv-skip").click();
  $(w, "rv-to-reading").click();
  assert.ok(visible(w, "v-reading"));
  const oracle = zy(["chain", "--seed", "今天下午", "--lang", "zh"]);
  const rn = zy(["read", "56", oracle.next.position, "--lang", "zh"]);
  assert.match(text(w, "rd-judgment"), /旅：小亨/);
  assert.ok(text(w, "rd-judgment").includes(rn.judgment), "卦辞与 zy.py 一致");
  assert.match(text(w, "rd-summary"), /上离（火）.*下艮（山）/, "自然象应是文字，不能是 [object Object]");
  assert.match(text(w, "rv-steps"), /略筮法/, "方法名应显示中文，不是 lueshi");
  assert.match(text(w, "rd-changed"), /→ 之卦/);
  assert.equal($(w, "rd-changed").querySelectorAll(".hexdraw .hexrow").length, 6, "之卦应画出 6 行横条，不是 undefined");
  assert.equal($(w, "rv-hex").querySelectorAll(".hexrow").length, 6, "本卦应画出 6 行横条");
  assert.ok($(w, "rv-hex").querySelector(".hexrow.yang"), "阳爻应有 yang 类（满宽）");
  assert.match($(w, "rv-to-reading").textContent, /解读（结果）/, "按钮应明确写'结果'");
  assert.match(text(w, "rd-summary"), /这卦讲：/, "结果速览应给出白话大意");
  assert.match(text(w, "rd-summary"), /怎么读：/, "结果速览应告诉用户先读哪");
  assert.match(text(w, "rd-summary"), /旅卦/, "结果速览应一眼看到卦名");
  assert.ok($(w, "rd-summary").querySelector(".sum-head b"), "卦名应是大字醒目呈现");
  // 断语小抄：扫出本卦经文里真实出现的字并解释（旅卦卦辞「小亨，旅贞吉」→ 亨、吉、利贞相关）
  const vbox = $(w, "rd-summary").querySelector(".verdict-box");
  assert.ok(vbox, "应给出断语小抄");
  assert.match(vbox.textContent, /亨|吉|利贞/, "小抄应解释本卦经文里出现的断语字");
  assert.match(vbox.textContent, /不是对你的判断/, "小抄须带合规声明");
  assert.doesNotMatch(w.document.body.textContent, /\[object Object\]|undefined|NaN/, "结果页不得出现乱码占位");
  assert.match(text(w, "rd-line-label"), /动爻/);
  assert.ok(text(w, "rd-line").includes(rn.line.text), "动爻爻辞与 zy.py 一致");
  assert.match(text(w, "rd-meaning"), /取象/);
  assert.match(text(w, "rd-meaning"), /义理/);
  assert.match(text(w, "rd-tk"), /高岛原书 · 节录/);
  assert.match(text(w, "rd-disclaimer"), /不含吉凶预测/);
  w.close();
});

test("报数起卦：numbers=7,13 → 18 蛊，与 zy.py 一致", async () => {
  const w = await boot();
  $(w, "prep-ready").click();
  // 切到报数选项卡
  Array.from(w.document.querySelectorAll("[data-tab]")).find((b) => b.dataset.tab === "numbers").click();
  $(w, "m-n1").value = "7";
  $(w, "m-n2").value = "13";
  $(w, "m-numbers-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 100));
  const oracle = zy(["chain", "--numbers", "7", "13", "--lang", "zh"]);
  assert.equal(oracle.hexagram.number, 18);
  assert.match(text(w, "rv-name"), /18 · 蛊卦/);
  $(w, "rv-skip").click();
  const uiAll = Array.from($(w, "rv-narration").children).map((li) => li.textContent);
  assert.deepEqual(uiAll, oracle.narration);
  w.close();
});

test("互动分筮竹：三变自动成卦，piles 与显示一致并可与 zy.py 对拍", async () => {
  const w = await boot();
  // 固定随机数：光标每次 +1，从 24 起步 → 第一变停在可控位置
  w.Math.random = () => 0;
  $(w, "prep-ready").click();
  assert.ok(visible(w, "v-method"));
  assert.equal($(w, "stalks").children.length, 49, "应有四十九策");
  // 分筮竹面板默认可见
  assert.ok(!$(w, "stalks").hidden);
  const counts = [];
  for (let i = 0; i < 3; i++) {
    $(w, "stalk-divide").click();
    counts.push(Number(Array.from($(w, "stalk-counts").children).pop().textContent.replace(/\D+/g, "")));
    await new Promise((r) => setTimeout(r, 1200)); // divide 内部 1100ms 后恢复
  }
  assert.equal(counts.length, 3);
  // 第三变后自动起卦进入推演视图
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(visible(w, "v-reveal"), "三变后应自动起卦");
  const oracle = zy(["chain", "--piles", String(counts[0]), String(counts[1]), String(counts[2]), "--lang", "zh"]);
  assert.match(text(w, "rv-name"), new RegExp(`${oracle.hexagram.number} · ${oracle.hexagram.name}卦`));
  $(w, "rv-skip").click();
  const uiAll = Array.from($(w, "rv-narration").children).map((li) => li.textContent);
  assert.deepEqual(uiAll, oracle.narration);
  w.close();
});

test("退回后重新起卦：分筮竹按钮不会卡死（counts 已满时自动重置）", async () => {
  const w = await boot();
  w.Math.random = () => 0;
  $(w, "prep-ready").click();
  // 第一次：分三次成卦
  for (let i = 0; i < 3; i++) {
    $(w, "stalk-divide").click();
    await new Promise((r) => setTimeout(r, 1200));
  }
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(visible(w, "v-reveal"));
  // 退回方法页
  $(w, "rv-back").click();
  assert.ok(visible(w, "v-method"));
  assert.equal($(w, "stalk-counts").children.length, 0, "退回后计数应清空");
  // 关键：再点「分」应能记录第一变，不再卡死
  $(w, "stalk-divide").click();
  await new Promise((r) => setTimeout(r, 100));
  assert.equal($(w, "stalk-counts").children.length, 1, "重新起卦应能再分第一变");
  w.close();
});

test("无 xhs 容器时优雅降级：内存存储可用，页面不崩", async () => {
  const w = await boot();
  assert.equal(typeof w.xhs, "undefined");
  await castPhrase(w, "测试");
  assert.ok(visible(w, "v-reveal"));
  w.close();
});

test("localIso 输出带时区偏移，可被引擎解析", async () => {
  const w = await boot();
  // 从构建产物内复用不了内部函数——这里验证引擎能解析页面同款格式
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  const iso = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${off >= 0 ? "+" : "-"}${p(Math.trunc(off / 60))}:${p(off % 60)}`;
  const c = zy(["chain", "--at", iso, "--lang", "zh"]);
  assert.ok(c.hexagram.number >= 1 && c.hexagram.number <= 64);
  w.close();
});
