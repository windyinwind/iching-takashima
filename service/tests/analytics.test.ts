// Regression: the dataLayer events that feed the GA4 funnel. This is browser
// code, so we assert on the shipped source — same approach as learn-cta.test.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const app = readFileSync(fileURLToPath(new URL("../public/app.js", import.meta.url)), "utf8");
const explore = readFileSync(fileURLToPath(new URL("../public/explore.js", import.meta.url)), "utf8");

const has = (src: string, name: string) => new RegExp(`track\\("${name}"`).test(src);

test("the casting funnel emits every step of the journey", () => {
  for (const name of [
    "cast_started", "cast_method_selected", "cast_change_completed",
    "cast_completed", "cast_step_view", "cast_error", "share_link_copy",
    "language_switched", "reading_link_click",
  ]) assert.ok(has(app, name), `app.js no longer emits ${name}`);
});

test("content pages emit navigation, CTA and scroll events", () => {
  for (const name of [
    "learn_cast_cta_click", "scroll_depth", "grok_bot_click", "hexagram_built",
    "line_page_click", "related_line_click", "changed_hexagram_click",
    "related_hexagram_click", "hexagram_table_click",
  ]) assert.ok(has(explore, name), `explore.js no longer emits ${name}`);
});

test("step views cover method, reveal and reading, so drop-off is measurable", () => {
  for (const step of ["method", "reveal", "reading"]) {
    assert.ok(app.includes(`stepView("${step}"`), `cast_step_view missing step ${step}`);
  }
});

test("share tracking never sends the URL or the cast input", () => {
  const m = app.match(/track\("share_link_copy", \{(.*?)\}\)/);
  assert.ok(m, "share_link_copy params not found");
  assert.doesNotMatch(m[1], /location\.href|location\.search|searchParams|\.href/);
  assert.match(m[1], /methodOf\(input\)/, "only the method key, not its value, may be sent");
  assert.match(m[1], /hexagram_number/);
});

test("error tracking never sends the message or the phrase", () => {
  const calls = [...app.matchAll(/track\("cast_error", \{(.*?)\}\)/g)].map((x) => x[1]);
  assert.equal(calls.length, 2, "expected a chain error and a guide error event");
  for (const params of calls) {
    assert.doesNotMatch(params, /\bmsg\b|\.message|\bseed\b|\bphrase\b|location/);
  }
  assert.ok(calls.some((p) => p.includes("cast_method: method")), "chain error should report the method");
  assert.ok(calls.some((p) => p.includes('stage: "guide"')), "guide failure should be tagged");
});

test("cast method is derived from input keys, never values", () => {
  const m = app.match(/const methodOf = (.*?);/);
  assert.ok(m, "methodOf helper not found");
  assert.match(m[1], /"piles" in x/);
  assert.doesNotMatch(m[1], /x\.piles|x\.seed|x\.numbers|x\.at/);
});
