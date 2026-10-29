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
  });
  // the casting app announces each new hexagram
  window.addEventListener("iching:cast", (ev) => {
    lines = ev.detail.lines.join("");
    paint(lines);
  });
}
