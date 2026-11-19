// Build the Xiaohongshu mini-tool zip payload from the iching repo sources.
//
//  - entry:  src/main.ts (UI) importing the deterministic engine from
//            ../service/src/engine — one source of truth for casting logic.
//  - alias:  the big multilingual data files (takashima/legge/jing_trad) are
//            swapped for stubs: zh-lean build, Takashima excerpts come from
//            src/data/excerpts-zh.json (same slices the website uses).
//  - output: dist/index.html + dist/assets/* — a classic-script IIFE bundle
//            targeting ES2017 (container CSP: no module, no inline scripts).
//
// Usage: node build.mjs
import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readdirSync, statSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "dist");

const stub = (name, body) => ({
  name: "lean-" + name,
  setup(build) {
    build.onResolve({ filter: new RegExp(name.replace(".", "\\.") + "$") }, () => ({
      path: name,
      namespace: "stub",
    }));
    build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      contents: `export default ${body};`,
      loader: "js",
    }));
  },
});

await esbuild.build({
  entryPoints: [join(here, "src/main.ts")],
  bundle: true,
  format: "iife",
  target: ["es2017"],
  minify: true,
  legalComments: "none",
  outfile: join(DIST, "assets/main.js"),
  alias: { "excerpts-zh": join(here, "src/data/excerpts-zh.json") },
  plugins: [
    stub("takashima.json", "{}"),
    stub("legge.json", "{}"),
    stub("jing_trad.json", "{}"),
  ],
  logLevel: "info",
});

mkdirSync(join(DIST, "assets"), { recursive: true });
cpSync(join(here, "index.html"), join(DIST, "index.html"));
cpSync(join(here, "assets/style.css"), join(DIST, "assets/style.css"));
cpSync(join(here, "assets/icon.png"), join(DIST, "assets/icon.png"));

// Size report
const size = (p) => statSync(p).size;
let total = 0;
const walk = (dir, prefix = "") => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, prefix + f + "/");
    else {
      total += size(p);
      console.log(`  ${prefix + f}  ${(size(p) / 1024).toFixed(0)} KB`);
    }
  }
};
console.log("dist contents:");
walk(DIST);
console.log(`total: ${(total / 1024).toFixed(0)} KB`);
