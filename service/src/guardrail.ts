// Soft guardrails for the API and the MCP endpoint. The hard backstop is the
// zone's WAF rate-limiting rule (one rule, configured in the Cloudflare
// dashboard, enforced at the edge before the Worker). This in-isolate window
// exists so abusive clients get a clean, self-explanatory 429 — and because
// there is no paid tier to upsell, the overflow message points heavy users at
// self-hosting instead of a pricing page.

export const LIMIT = 60;
export const WINDOW_MS = 60_000;
export const SELF_HOST = "https://github.com/windyinwind/iching-takashima (MIT)";

type Bucket = { n: number; reset: number };
const HITS = new Map<string, Bucket>();

/** Seconds until the window resets if the IP is over the limit, else null. */
export function retryIn(ip: string, now = Date.now()): number | null {
  if (HITS.size > 20_000) for (const [k, v] of HITS) if (v.reset < now) HITS.delete(k);
  const e = HITS.get(ip);
  if (!e || e.reset < now) {
    HITS.set(ip, { n: 1, reset: now + WINDOW_MS });
    return null;
  }
  e.n += 1;
  return e.n > LIMIT ? Math.ceil((e.reset - now) / 1000) : null;
}

const headers = (retry: number) => ({ "Cache-Control": "no-store", "Retry-After": String(Math.max(1, retry)) });

export function apiTooMany(l: "zh" | "en" | "ja", retry: number, cors: Record<string, string>): Response {
  const say = {
    zh: "请求过于频繁：请稍候再试。",
    en: "Rate limit exceeded: please wait a while and try again.",
    ja: "リクエストが多すぎます：しばらく待ってから再試行してください。",
  };
  return Response.json({ error: `${say[l]} For heavy use, self-host: ${SELF_HOST}` }, { status: 429, headers: { ...cors, ...headers(retry) } });
}

export function mcpTooMany(retry: number, cors: Record<string, string>): Response {
  const body = {
    jsonrpc: "2.0",
    id: null,
    error: { code: -32000, message: `Rate limit exceeded (请求过于频繁): retry after ${Math.max(1, retry)}s. For heavy use, self-host: ${SELF_HOST}` },
  };
  return new Response(JSON.stringify(body), { status: 429, headers: { "Content-Type": "application/json", ...cors, ...headers(retry) } });
}
