// Analytics: events go to the GTM dataLayer; GTM forwards them to GA4.
function track(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

document.addEventListener("click", (ev) => {
  const a = ev.target.closest('a[href*="x.ai/bot"]');
  if (a) track("grok_bot_click", { lang: document.documentElement.lang, page: location.pathname });
});

// Navigation behaviour: which onward links readers actually follow, so weak
// pages can be fixed from evidence instead of guesses.
const hexNumOf = (href) => {
  const m = /\/hexagram\/(\d+)-/.exec(href || "");
  return m ? Number(m[1]) : 0;
};
document.addEventListener("click", (ev) => {
  const a = ev.target.closest("a");
  if (!a) return;
  const href = a.getAttribute("href") || "";
  const base = { lang: document.documentElement.lang, page: location.pathname };
  if (a.closest("section.line h3")) track("line_page_click", { ...base, hexagram_number: hexNumOf(href) });
  else if (a.closest(".rel-lines")) track("related_line_click", { ...base, hexagram_number: hexNumOf(href) });
  else if (a.closest(".changes")) track("changed_hexagram_click", { ...base, hexagram_number: hexNumOf(href) });
  else if (a.closest(".rel")) track("related_hexagram_click", { ...base, hexagram_number: hexNumOf(href) });
  else if (a.closest(".matrix")) track("hexagram_table_click", { ...base, hexagram_number: hexNumOf(href) });
  if (a.classList.contains("btn") && href.includes("#cast")) track("learn_cast_cta_click", base);
});

// Scroll depth on reading pages: 50% and 90%, once each per page view.
(() => {
  const fired = new Set();
  addEventListener("scroll", () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return;
    const pct = (h.scrollTop / max) * 100;
    for (const t of [50, 90]) {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        track("scroll_depth", { percent: t, lang: document.documentElement.lang, page: location.pathname });
      }
    }
  }, { passive: true });
})();

// Sidebar interactions: the hexagram builder and highlighting in the 64-hexagram table.
const data = JSON.parse(document.getElementById("hexdata")?.textContent || "[]");
const byLines = new Map(data.map(([n, lines, title, path]) => [lines, { n, title, path }]));
const builder = document.querySelector(".builder");

function paint(lines) {
  if (!builder) return;
  for (const b of builder.querySelectorAll("button")) {
    const i = Number(b.dataset.i);
    b.className = lines[i] === "1" ? "yang" : "yin";
    b.setAttribute("aria-pressed", String(lines[i] === "1"));
  }
  const hit = byLines.get(lines);
  const out = builder.nextElementSibling;
  out.replaceChildren();
  if (hit) {
    const a = document.createElement("a");
    a.href = hit.path;
    a.textContent = hit.title;
    out.append(a);
  }
  for (const td of document.querySelectorAll(".matrix td.built")) td.classList.remove("built");
  if (hit) document.querySelector(`.matrix td[data-n="${hit.n}"]`)?.classList.add("built");
}

if (builder) {
  let lines = builder.dataset.lines;
  paint(lines);
  builder.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    const i = Number(b.dataset.i);
    lines = lines.slice(0, i) + (lines[i] === "1" ? "0" : "1") + lines.slice(i + 1);
    paint(lines);
    const hit = byLines.get(lines);
    if (hit) track("hexagram_built", { hexagram_number: hit.n, lang: document.documentElement.lang });
  });
  // the casting app announces each new hexagram
  window.addEventListener("iching:cast", (ev) => {
    lines = ev.detail.lines.join("");
    paint(lines);
  });
}
