// Remote MCP server (Streamable HTTP, stateless, JSON responses).
// Spec: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
import * as engine from "./engine/index.ts";
import { castLinks } from "./pages.ts";

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `I Ching · Takashima Method. You guide the user through Takashima Donshō's abbreviated yarrow-stalk method (略筮法) step by step. Follow these rules:
1. Never ask what the user's question is. The matter stays in their mind. If they type it, don't repeat it or use it as input; ask for a short phrase that comes to mind instead.
2. Start with iching_guide in the user's language (zh, en or ja; for any other language use en and translate). Explain the five preparation steps with their quotes, then offer the input methods. Default: a short phrase.
3. Cast with iching_cast. Relay the "narration" lines exactly as returned, numbered, one per line. Don't merge them, change numbers or recompute anything. Draw the hexagram from "hexagram.glyphs", top to bottom.
4. Then call iching_takashima with next.number and next.position. Quote Takashima's commentary, the topic reading the user cares about (zhan) and one recorded case (cases), always attributed. Takashima's text is Chinese only (Wang Zhiben's translation): if you translate it, say it is your translation.
5. Link the user to the pages in "links" (the hexagram, the moving line, the changed hexagram and both trigrams) so they can read each part and see its lines drawn.
6. Close with the guide's "after" items: the first cast stands (初筮告，再三渎，渎则不告), read the text first, the decision is the user's.
Never make predictions or say whether something will succeed. Give structure, text and sources and leave the conclusion to the user. Health, pregnancy and war content is left out by default; don't use include_sensitive for a user's medical or pregnancy matter.`;

const LANG = { type: "string", enum: ["zh", "en", "ja"], description: "Output language: zh Chinese, en English (with Legge's translation), ja Japanese." };
const POSITION = { type: "string", description: "Line, best given by its name (初九, 六二, 九三 … 上六) or 初/二/三/四/五/上; 0-5 with 0 = bottom line, 6 = top. Omit for the judgment page. iching_takashima also accepts 用九 / 用六." };

const TOOLS = [
  {
    name: "iching_guide",
    title: "Preparation guide",
    description: "What to tell the user before casting: Takashima's five preparation steps (with the original quotes and sources), the input methods they can choose, and what to keep in mind afterwards. Call this first.",
    inputSchema: { type: "object", properties: { lang: LANG }, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "iching_cast",
    title: "Cast a hexagram, step by step",
    description: "Cast a hexagram and return every step of the derivation as numbered narration in the user's language, the hexagram, the changed hexagram and which Takashima page to read next. Give exactly one input: phrase (the default, Takashima's method), piles (three left-hand stalk counts from real stalks), numbers (2-3 positive integers, Plum Blossom method) or at (ISO 8601 time with timezone, Plum Blossom method; for \"now\" pass the user's current local time with its offset). The same input always gives the same hexagram.",
    inputSchema: {
      type: "object",
      properties: {
        phrase: { type: "string", description: "A short phrase the user says at the moment of focus. Never the user's question." },
        piles: { type: "array", items: { type: "integer", minimum: 1, maximum: 48 }, minItems: 3, maxItems: 3, description: "Left-hand stalk counts from three real splits of 49 stalks." },
        numbers: { type: "array", items: { type: "integer", minimum: 1 }, minItems: 2, maxItems: 3 },
        at: { type: "string", description: "ISO 8601 with timezone, e.g. 2026-10-04T00:35:27+08:00." },
        method: { type: "string", enum: ["lueshi", "dayan"], description: "For phrase only: lueshi (default, Takashima's three-change method) or dayan (classical 18-change method)." },
        lang: LANG,
        detail: { type: "boolean", description: "Also return the full derivation steps with rules, tables and sources." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
  },
  {
    name: "iching_read",
    title: "Read a hexagram or line",
    description: "The judgment and line texts of a hexagram (or one line) with structural notes and line-by-line interpretation, plus Legge's English (lang en) or the traditional-kanji text (lang ja).",
    inputSchema: {
      type: "object",
      properties: { number: { type: "integer", minimum: 1, maximum: 64 }, position: POSITION, lang: LANG },
      required: ["number"], additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "iching_takashima",
    title: "Takashima's commentary and cases",
    description: "Takashima Donshō's own page for a hexagram or line from 増補高島易断 (Wang Zhiben's Chinese translation): his commentary, readings by topic (zhan) and recorded cases. Quote with attribution; it is Chinese only.",
    inputSchema: {
      type: "object",
      properties: {
        number: { type: "integer", minimum: 1, maximum: 64 }, position: POSITION, lang: LANG,
        include_sensitive: { type: "boolean", description: "Include health, pregnancy and Meiji-era war content (left out by default). Only when the user explicitly wants the full original text." },
      },
      required: ["number"], additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

const lang = (v: unknown): engine.Lang => (v === "en" || v === "ja" ? v : "zh");
const pos = (v: unknown) => (v === undefined || v === null || v === "" ? null : String(v));

function callTool(name: string, a: Record<string, any>, origin: string): unknown {
  if (name === "iching_guide") return engine.guide(lang(a.lang));
  if (name === "iching_cast") {
    const given = ["phrase", "piles", "numbers", "at"].filter((k) => a[k] !== undefined && a[k] !== null && a[k] !== "");
    if (given.length !== 1) throw new engine.EngineError("Give exactly one of phrase, piles, numbers or at.");
    const c = engine.chain({
      seed: a.phrase, piles: a.piles, numbers: a.numbers, at: a.at,
      variant: a.method === "dayan" ? "dayan" : "lueshi", lang: lang(a.lang),
    });
    c.links = castLinks(lang(a.lang) as any, origin, c);
    if (a.detail) return c;
    return { method: c.method, narration: c.narration, hexagram: c.hexagram, changed: c.changed, moving_position: c.moving_position,
      next: c.next, reproduce: c.reproduce, links: c.links };
  }
  if (name === "iching_read") return engine.read(Number(a.number), pos(a.position), lang(a.lang));
  if (name === "iching_takashima") return engine.takashima(Number(a.number), pos(a.position), lang(a.lang), !!a.include_sensitive);
  throw new RpcError(-32602, `Unknown tool: ${name}`);
}

class RpcError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

function handle(msg: any, origin: string): any | null {
  const { id, method, params } = msg ?? {};
  const isNotification = id === undefined || id === null;
  try {
    if (typeof method !== "string") throw new RpcError(-32600, "Invalid request");
    let result: any;
    if (method === "initialize") {
      const asked = params?.protocolVersion;
      result = {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "iching-takashima", title: "I Ching · Takashima Method", version: engine.VERSION },
        instructions: INSTRUCTIONS,
      };
    } else if (method === "ping") {
      result = {};
    } else if (method === "tools/list") {
      result = { tools: TOOLS };
    } else if (method === "tools/call") {
      try {
        const out = callTool(params?.name, params?.arguments ?? {}, origin);
        result = { content: [{ type: "text", text: JSON.stringify(out, null, 1) }] };
      } catch (e) {
        if (!(e instanceof engine.EngineError)) throw e;
        result = { content: [{ type: "text", text: e.message }], isError: true };
      }
    } else if (method.startsWith("notifications/")) {
      return null;
    } else {
      throw new RpcError(-32601, `Method not found: ${method}`);
    }
    return isNotification ? null : { jsonrpc: "2.0", id, result };
  } catch (e) {
    if (isNotification) return null;
    const err = e instanceof RpcError ? e : new RpcError(-32603, "Internal error");
    return { jsonrpc: "2.0", id, error: { code: err.code, message: err.message } };
  }
}

export async function mcp(req: Request, origin: string): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("This MCP server speaks Streamable HTTP: send JSON-RPC with POST.", { status: 405, headers: { Allow: "POST" } });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
  const replies = (Array.isArray(body) ? body : [body]).map((m) => handle(m, origin)).filter((r) => r !== null);
  if (!replies.length) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(body) ? replies : replies[0]);
}
