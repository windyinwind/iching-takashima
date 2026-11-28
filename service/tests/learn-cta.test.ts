// Regression: the Learn pages' cast CTAs deep-link into the casting flow, and
// app.js parses those deep links. If either drifts, the learn → practice loop breaks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LEARN, learnPage } from "../src/learn.ts";

const LANGS = ["en", "zh", "hant", "ja"] as const;

// Articles ending in the stalk-splitting CTA deep-link straight to that method.
const STALKS_SLUGS = new Set(["the-eight-trigrams", "takashima-method"]);
const EXPECTED_HASH = (slug: string) => (STALKS_SLUGS.has(slug) ? "#cast=stalks" : "#cast");

test("every learn page ends in a cast CTA deep-linked to the right method, in every language", () => {
  for (const slug of LEARN) {
    for (const lang of LANGS) {
      const page = learnPage(lang, slug);
      assert.ok(page, `${slug} must render`);
      const buttons = [...page.body.matchAll(/class="btn" href="(\/[a-z]+\/#[^"]*)">([^<]*)</g)];
      const btn = buttons.find((m) => m[1].includes("#cast"));
      assert.ok(btn, `${lang}/${slug}: no cast CTA found`);
      assert.equal(btn[1], `/${lang}/${EXPECTED_HASH(slug)}`, `${lang}/${slug}: wrong deep link`);
      assert.ok(btn[2].trim().length > 0, `${lang}/${slug}: empty CTA text`);
    }
  }
});

test("CTA texts differ across languages (no untranslated fallback)", () => {
  for (const slug of LEARN) {
    const texts = LANGS.map((lang) => {
      const page = learnPage(lang, slug)!;
      const btn = [...page.body.matchAll(/class="btn" href="\/[a-z]+\/#[^"]*">([^<]*)</g)][0];
      return btn[1];
    });
    assert.equal(new Set(texts).size, 4, `${slug}: CTA text identical across languages`);
  }
});

test("app.js parses the deep links the learn pages emit", () => {
  const app = readFileSync(fileURLToPath(new URL("../public/app.js", import.meta.url)), "utf8");
  const literal = "^#(?:cast|method)(?:=([a-z]+))?$";
  assert.ok(app.includes(literal), "app.js no longer contains the deep-link regex");
  assert.ok(app.includes('"stalks", "phrase", "numbers", "time"'), "app.js no longer whitelists the four method tabs");

  const re = new RegExp(literal);
  const plain = re.exec("#cast");
  assert.ok(plain, "#cast must match");
  assert.equal(plain[1], undefined, "#cast must not carry a tab");
  const stalks = re.exec("#cast=stalks");
  assert.ok(stalks, "#cast=stalks must match");
  assert.equal(stalks[1], "stalks", "#cast=stalks must capture the tab");
  assert.equal(re.exec("#cast=bogus")?.[1], "bogus", "unknown tabs must be capturable (the whitelist rejects them)");
  assert.equal(re.exec("cast=stalks"), null, "a bare word must not match");
  assert.equal(re.exec("#other"), null, "unrelated hashes must not match");
});
