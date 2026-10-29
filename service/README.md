# Service: website, API and MCP server

The I Ching · Takashima Method as a Cloudflare Worker (free plan): a step-by-step casting website, a JSON API, and a remote MCP server for AI assistants. It uses the plugin's own data files, and its engine is a TypeScript port of `skills/zhouyi-lookup/scripts/zhouyi/` that must match the Python CLI exactly.

| Path | What |
|---|---|
| `/` | website: prepare, split the stalks, every step, the text, afterwards (en / 中文 / 日本語) |
| `/api/guide`, `/api/chain`, `/api/read`, `/api/takashima`, `/api/list`, `/api/sources` | JSON, GET only, query parameters as in `zy.py` (`lang`, `seed`, `piles=21,22,16`, `numbers=7,13`, `at`, `n`, `pos`, `all=1`) |
| `/mcp` | MCP server (Streamable HTTP, stateless): `iching_guide`, `iching_cast`, `iching_read`, `iching_takashima` |

No network calls, no storage, no analytics, no credentials. The question a user has in mind is never asked for or sent.

## Develop

Requires Node 23.6+ (runs TypeScript directly) and Wrangler. No npm dependencies.

```bash
npm test          # TS engine vs the Python CLI on ~2,600 cases, plus tables.json freshness
npm run tables    # regenerate src/engine/tables.json after changing the Python engine's static text
npm run dev       # http://localhost:8787
npm run deploy    # wrangler deploy
```

Static text (guides, names, sources, the lunar table) is exported from the Python modules into `src/engine/tables.json`; only logic and sentence templates are ported by hand, and `tests/parity.test.ts` runs `zy.py` as the reference.
