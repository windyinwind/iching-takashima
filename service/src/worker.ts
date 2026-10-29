// Cloudflare Worker: pages for search engines, the casting app, the JSON API, the MCP server and static assets.
import * as engine from "./engine/index.ts";
import { mcp } from "./mcp.ts";
import { LANGS, type Lang, castLinks, route, sitemap } from "./pages.ts";

type Env = { ASSETS: { fetch: (req: Request | string) => Promise<Response> } };

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version" };
const CAST_KEYS = ["seed", "piles", "numbers", "at", "variant"];

const json = (data: unknown, status = 200, cache = true) =>
  Response.json(data, {
    status,
    headers: { ...CORS, "Cache-Control": status === 200 && cache ? "public, max-age=86400" : "no-store" },
  });

const html = (body: string, extra: Record<string, string> = {}) =>
  new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600", ...extra } });

const lang = (q: URLSearchParams): engine.Lang => {
  const l = q.get("lang");
  return l === "en" || l === "ja" ? l : "zh";
};
const listParam = (q: URLSearchParams, k: string) => q.get(k)?.split(/[\s,]+/).filter(Boolean);

function api(path: string, q: URLSearchParams, origin: string): unknown {
  switch (path) {
    case "/api/guide":
      return engine.guide(lang(q));
    case "/api/chain": {
      const c = engine.chain({
        seed: q.get("seed") ?? undefined, piles: listParam(q, "piles"), numbers: listParam(q, "numbers"),
        at: q.get("at") ?? undefined, variant: q.get("variant") ?? "lueshi", lang: lang(q),
      });
      c.titles = {
        hexagram: engine.title(c.hexagram.number, lang(q)),
        changed: c.changed ? engine.title(c.changed.number, lang(q)) : null,
      };
      c.links = castLinks(lang(q), origin, c);
      return c;
    }
    case "/api/read":
      return engine.read(Number(q.get("n")), q.get("pos") || null, lang(q));
    case "/api/takashima":
      return engine.takashima(Number(q.get("n")), q.get("pos") || null, lang(q), q.get("all") === "1");
    case "/api/list":
      return engine.list();
    case "/api/sources":
      return engine.sources();
  }
  return undefined;
}

function preferredLang(req: Request): Lang {
  const al = (req.headers.get("Accept-Language") || "").toLowerCase();
  const first = al.split(",").map((s) => s.trim().slice(0, 2)).find((s) => s === "zh" || s === "ja" || s === "en");
  return (first as Lang) || "en";
}

const LANDING: Record<Lang, { title: string; description: string }> = {
  en: { title: "I Ching · Takashima Method: cast and read the Book of Changes, step by step",
    description: "Split the yarrow stalks yourself and see every step of the cast by Takashima Donshō's method. The classic text, Legge's translation and Takashima's commentary. No predictions." },
  zh: { title: "周易 · 高岛略筮：按高岛呑象之法起卦，步步可见",
    description: "亲手分筮竹，按高岛呑象略筮法起卦，每一变怎么分、怎么数、得何卦，全部展示。附卦辞爻辞与《増補高島易断》原注，不作预测。" },
  ja: { title: "易経 · 高島流略筮：筮竹を分けて、起卦の手順をすべて見る",
    description: "高島呑象の略筮法で卦を立て、筮竹の数え方から卦の成り立ちまでを一歩ずつ表示。経文と高島の解釈を出典つきで。予言はしません。" },
};

/** The casting app, with the preparation guide rendered on the server so crawlers see it. */
async function landing(req: Request, env: Env, l: Lang, origin: string, noindex: boolean) {
  const page = await env.ASSETS.fetch(new Request(origin + "/index.html"));
  const g = engine.guide(l);
  const meta = LANDING[l];
  const steps = g.prepare.map((s: any) =>
    `<li><strong>${escapeHtml(s.step)}</strong>${escapeHtml(s.say)}${s.quote ? `<blockquote class="quote"><span lang="${l === "en" ? "zh" : l}">${escapeHtml(s.quote)}</span>${s.quote_en ? `<div>“${escapeHtml(s.quote_en)}”</div>` : ""}<cite>${escapeHtml(s.src)}</cite></blockquote>` : ""}</li>`).join("");
  const head = [
    `<link rel="canonical" href="${origin}/${l}/">`,
    ...LANGS.map((x) => `<link rel="alternate" hreflang="${x === "zh" ? "zh-Hans" : x}" href="${origin}/${x}/">`),
    `<link rel="alternate" hreflang="x-default" href="${origin}/en/">`,
    `<meta property="og:url" content="${origin}/${l}/">`,
    `<meta property="og:image" content="${origin}/og/default.png">`,
    `<meta name="twitter:image" content="${origin}/og/default.png">`,
    noindex ? `<meta name="robots" content="noindex, follow">` : "",
  ].join("");
  return new HTMLRewriter()
    .on("html", { element: (e) => { e.setAttribute("lang", l === "zh" ? "zh-Hans" : l); e.setAttribute("data-lang", l); } })
    .on("title", { element: (e) => { e.setInnerContent(meta.title); } })
    .on('meta[name="description"]', { element: (e) => e.setAttribute("content", meta.description) })
    .on('meta[property="og:title"]', { element: (e) => e.setAttribute("content", meta.title) })
    .on('meta[property="og:description"]', { element: (e) => e.setAttribute("content", meta.description) })
    .on('meta[name="twitter:card"]', { element: (e) => e.setAttribute("content", "summary_large_image") })
    .on("head", { element: (e) => { e.append(head, { html: true }); } })
    .on("#prep-title", { element: (e) => { e.setInnerContent(g.title); } })
    .on("#prep-intro", { element: (e) => { e.setInnerContent(g.intro); } })
    .on("#prep-steps", { element: (e) => { e.setInnerContent(steps, { html: true }); } })
    .on("a.brand", { element: (e) => { e.setAttribute("href", `/${l}/`); } })
    .transform(new Response(page.body, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": noindex ? "no-store" : "public, max-age=3600" } }));
}

const escapeHtml = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = url.origin;
    const path = url.pathname;
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "GET, POST, OPTIONS" } });
    if (path === "/mcp") {
      const res = await mcp(req, origin);
      for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
      return res;
    }
    if (path.startsWith("/api/")) {
      if (req.method !== "GET") return json({ error: "Use GET." }, 405);
      try {
        const out = api(path, url.searchParams, origin);
        return out === undefined ? json({ error: "Not found." }, 404) : json(out);
      } catch (e) {
        if (e instanceof engine.EngineError) return json({ error: e.message }, 400);
        throw e;
      }
    }
    if (path === "/sitemap.xml") return new Response(sitemap(origin), { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" } });
    if (path === "/robots.txt") return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain" } });

    const hasCast = CAST_KEYS.some((k) => url.searchParams.has(k));
    if (path === "/" || path === "/index.html") {
      const l = (url.searchParams.get("lang") as Lang) || preferredLang(req);
      const target = LANGS.includes(l) ? l : "en";
      if (!hasCast) return Response.redirect(`${origin}/${target}/`, 302);
      return landing(req, env, target, origin, true);
    }
    const lm = /^\/(en|zh|ja)\/?$/.exec(path);
    if (lm) return landing(req, env, lm[1] as Lang, origin, hasCast);

    const page = route(path.replace(/\/$/, ""), origin);
    if (page) return html(page);
    return env.ASSETS.fetch(req);
  },
};
