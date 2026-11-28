// The soft guardrail: per-IP fixed-window limiter and the 429 responses.
import { test } from "node:test";
import assert from "node:assert/strict";
import { retryIn, apiTooMany, mcpTooMany, LIMIT } from "../src/guardrail.ts";

const T = 1_000_000_000; // fixed "now" so windows are deterministic

test("requests under the limit pass", () => {
  for (let i = 0; i < LIMIT; i++) assert.equal(retryIn("a", T + i * 100), null);
});

test("the request over the limit gets a retry in seconds", () => {
  const retry = retryIn("a", T + LIMIT * 100);
  assert.ok(retry !== null && retry >= 1 && retry <= 60);
});

test("the window resets after it expires", () => {
  assert.equal(retryIn("b", T + 61_000), null);
});

test("api 429 carries Retry-After, no-store, CORS and the self-host pointer", async () => {
  const res = apiTooMany("zh", 30, { "Access-Control-Allow-Origin": "*" });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Retry-After"), "30");
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body: { error: string } = await res.json();
  assert.match(body.error, /请求过于频繁/);
  assert.match(body.error, /github\.com\/windyinwind\/iching-takashima/);

  const hantRes = apiTooMany("hant", 30, { "Access-Control-Allow-Origin": "*" });
  assert.equal(hantRes.status, 429);
  const hantBody: { error: string } = await hantRes.json();
  assert.match(hantBody.error, /請求過於頻繁/);
});

test("mcp 429 is a JSON-RPC error with Retry-After", async () => {
  const res = mcpTooMany(15, { "Access-Control-Allow-Origin": "*" });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Retry-After"), "15");
  assert.equal(res.headers.get("Content-Type"), "application/json");
  const body: { jsonrpc: string; error: { code: number; message: string } } = await res.json();
  assert.equal(body.jsonrpc, "2.0");
  assert.equal(body.error.code, -32000);
  assert.match(body.error.message, /Rate limit exceeded/);
});
