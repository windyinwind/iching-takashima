// Cloudflare Worker: JSON API for the website, the remote MCP server, and static assets.
import * as engine from "./engine/index.ts";
import { mcp } from "./mcp.ts";

type Env = { ASSETS: { fetch: (req: Request) => Promise<Response> } };

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version" };

const json = (data: unknown, status = 200, cache = true) =>
  Response.json(data, {
    status,
    headers: { ...CORS, "Cache-Control": status === 200 && cache ? "public, max-age=86400" : "no-store" },
  });

const lang = (q: URLSearchParams): engine.Lang => {
  const l = q.get("lang");
  return l === "en" || l === "ja" ? l : "zh";
};
const listParam = (q: URLSearchParams, k: string) => q.get(k)?.split(/[\s,]+/).filter(Boolean);

function api(path: string, q: URLSearchParams): unknown {
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

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "GET, POST, OPTIONS" } });
    if (url.pathname === "/mcp") {
      const res = await mcp(req);
      for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
      return res;
    }
    if (url.pathname.startsWith("/api/")) {
      if (req.method !== "GET") return json({ error: "Use GET." }, 405);
      try {
        const out = api(url.pathname, url.searchParams);
        return out === undefined ? json({ error: "Not found." }, 404) : json(out);
      } catch (e) {
        if (e instanceof engine.EngineError) return json({ error: e.message }, 400);
        throw e;
      }
    }
    return env.ASSETS.fetch(req);
  },
};
