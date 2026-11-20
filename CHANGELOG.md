# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.5.0] - 2026-11-20

The release that turned the plugin into a three-surface product: a public website with search visibility and monetisation, a rate-limited API/MCP endpoint, a Xiaohongshu mini-tool, and a plain-language reading layer shared by all of them.

### Added

- **Plain-language layer** (`plain.json`, 64 hexagrams + 384 lines × zh/en/ja): a faithful modern-language retelling of the classical 取象/义理 commentary, so readers actually understand the text they receive. Rendered as a distinct "白话 / In plain language / 平易な解説" block on every hexagram and line page in all three languages — this also fills the gap where English and Japanese previously had only the bare classic text. Exposed as `plain` on the Pro expert's `read` output.
- **Xiaohongshu mini-tool** (`minitool/zhouyi-minitool.zip`): a lean, offline Chinese build with the website's interactive stalk-splitting as the default casting method, step-by-step narration, verdict glossary and plain-language explanations. Built from the same engine as the site and MCP. 7 jsdom e2e tests parity-check its casts against `zy.py`. Store assets (icon, 3:4 cover, name/slogan) included; submitted for review under `learning_education`.
- **SEO and search**: a page for every hexagram, line and trigram; FAQ sections with FAQPage schema; hreflang alternates and lastmod in the sitemap; in-brief English summaries.
- **AdSense**: `ads.txt`, the loader in every page head, and in-article/display ad units; privacy pages disclose advertising in all three languages.
- **Deeper Learn content**: stalk-by-stalk worked example with practice casts and common mistakes, "How to read the text" (verdict vocabulary + four-step reading method + two worked examples), casting-method comparison, reading path and per-article FAQs. Every Learn article ends with a cast CTA deep-linking into the casting flow (`/#cast`, `/#cast=stalks`).
- **API/MCP guardrails**: per-IP soft rate limit with a clean 429 + `Retry-After` and a self-host pointer (no pricing page), plus Cache API caching of deterministic API responses. An edge WAF rate-limit rule complements the in-Worker limit.
- **CI**: GitHub Actions runs the Python engine tests, the service parity suite, the Learn CTA regression and the mini-tool e2e tests on every push and PR; a status badge sits at the top of the README.

### Changed

- Takashima's topic readings (分事占断) now render expanded by default with a seal-red label, instead of being collapsed and hard to find.
- The pre-commit hook runs `scripts/cleanup.py`, removing caches, `.DS_Store` and scratch dirs before each commit.

### Fixed

- Seven 讹字 in the Takashima proofread text, aligned with the received edition (carried over from 1.4.1).
- Rendered 用九/用六 on hexagrams 1 and 2 instead of throwing.
- Kept the chosen language when switching mid-cast; removed Wang Zhiben from user-facing source labels.

## [1.4.1] - 2026-11-17

### Fixed

- Corrected seven textual errors in the point-proofread Takashima data to match the received edition.

## [1.4.0] - 2026-10-29

Initial public release.

### Added

- The Grok plugin: `skills/zhouyi-lookup/` (zero-dependency Python CLI) and `agents/iching-takashima.md`.
- Three casting methods (略筮法 / 大衍筮法 / 梅花易数 number and time), deterministic SHA-256 derivation with a fully reproducible `chain`, the 64 judgments and 384 line texts with structural 取象 and 义理, and Takashima's 450-page commentary with 503 recorded cases (sensitive topics omitted by default).
- Chinese, English (Legge 1882) and Japanese output; public-domain sources cited; no predictions of its own.
- Built as its own Grok plugin marketplace.
