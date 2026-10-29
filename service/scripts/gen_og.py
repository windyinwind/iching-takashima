#!/usr/bin/env python3
"""Render the share images public/og/{1..64}.png and default.png with headless Chrome.

    python3 service/scripts/gen_og.py
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = ROOT / "service/public/og"
T = json.loads((ROOT / "service/src/engine/tables.json").read_text(encoding="utf-8"))
HEX = json.loads((ROOT / "skills/zhouyi-lookup/scripts/zhouyi/hexagrams.json").read_text(encoding="utf-8"))["hexagrams"]

CSS = """*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:#f6f1e7;color:#1f1b16;
font-family:"Iowan Old Style","Songti SC","Hiragino Mincho ProN",serif;display:flex;align-items:center;gap:80px;padding:0 90px;
position:relative;overflow:hidden}.bar{display:flex;justify-content:space-between;width:300px;height:34px}
.bar span{background:#1f1b16;border-radius:4px}.yang span{width:100%}.yin span{width:43%}
.fig{display:flex;flex-direction:column-reverse;gap:22px}.k{font:600 22px system-ui;letter-spacing:.14em;color:#b23a2b;text-transform:uppercase}
h1{font-size:76px;line-height:1.05;margin:18px 0 10px}.sub{font-size:40px;color:#4a4238}.foot{position:absolute;left:90px;bottom:44px;
font:600 24px system-ui;color:#6b6257}.seal{position:absolute;right:0;top:0;width:18px;height:630px;background:#b23a2b}"""


def bars(lines):
    return "".join(f'<div class="bar {"yang" if l else "yin"}">{"<span></span>" if l else "<span></span><span></span>"}</div>' for l in lines)


def page(fig, kicker, title, sub):
    return f'<!doctype html><meta charset="utf-8"><style>{CSS}</style><div class="seal"></div><div class="fig">{fig}</div>' \
           f'<div><div class="k">{kicker}</div><h1>{title}</h1><div class="sub">{sub}</div></div>' \
           f'<div class="foot">I Ching · Takashima Method · 周易 · 易経</div>'


def shoot(html, out, tmp):
    src = Path(tmp) / "og.html"
    src.write_text(html, encoding="utf-8")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={tmp}/profile", "--hide-scrollbars",
                    "--window-size=1200,630", f"--screenshot={out}", src.as_uri()], capture_output=True, check=True)


OUT.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    for h in HEX:
        n = h["number"]
        lines = T["trigrams"][h["lower"]] + T["trigrams"][h["upper"]]
        pinyin, gloss = T["hexagram_en"][str(n)]
        ja = T["hexagram_ja"][str(n)][0]
        shoot(page(bars(lines), f"Hexagram {n} of 64", f"{pinyin} {h['name']}", f"{gloss} · {ja}"), OUT / f"{n}.png", tmp)
        print(n, end=" ", flush=True)
    shoot(page(bars([1, 0, 0, 0, 1, 0]), "Every step of the cast", "I Ching", "Takashima Donshō's method · 高島呑象"),
          OUT / "default.png", tmp)
print("\nwrote", len(list(OUT.glob("*.png"))), "images")
sys.exit(0)
