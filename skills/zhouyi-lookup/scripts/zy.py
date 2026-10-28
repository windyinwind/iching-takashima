#!/usr/bin/env python3
"""周易结构化解读命令行入口。

技能包内的统一调用方式。不依赖任何第三方库。

用法
----
    python3 scripts/zy.py cast --at 2026-10-04T00:35:27+08:00
    python3 scripts/zy.py cast --numbers 7 13
    python3 scripts/zy.py cast --seed "当下所念"                 # 略筮法（高島常用）
    python3 scripts/zy.py cast --piles 21 22 16                  # 略筮法，亲手分筮竹
    python3 scripts/zy.py cast --seed "当下所念" --variant dayan
    python3 scripts/zy.py guide                                  # 起卦前给用户看的准备说明
    python3 scripts/zy.py chain --at 2026-10-04T00:35:27+08:00
    python3 scripts/zy.py read 11
    python3 scripts/zy.py read 11 6
    python3 scripts/zy.py takashima 4 六五                       # 高島原书该爻之辞与占例
    python3 scripts/zy.py list
    python3 scripts/zy.py sources

说明
----
- 起卦只接受时间、数字、种子串，**不接受问题文本**。所占何事在用户自己心里。
- 时间为 ISO 8601，**必须带时区**（Z 或 ±HH:MM），否则拒绝执行：
  无时区则结果不可复现。时间起卦按农历计（支持农历 1900–2100 年）。
- 所有输出均为确定性运算，同一输入永远得到同一结果。
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# 允许从任意工作目录运行
sys.path.insert(0, str(Path(__file__).resolve().parent))

from zhouyi import casting                      # noqa: E402
from zhouyi.hexagrams import all_hexagrams      # noqa: E402
from zhouyi.interpretation import SOURCES, full_reading  # noqa: E402


def _print(obj) -> None:
    print(json.dumps(obj, ensure_ascii=False, indent=2))


def _build_cast(args):
    """由命令行参数构造起卦原始结果。失败时返回 (None, 中文错误信息)。"""
    if args.numbers:
        try:
            nums = [int(x) for x in args.numbers]
        except ValueError:
            return None, "数字起卦只接受整数，收到：%s" % " ".join(args.numbers)
        try:
            return casting.cast_numbers(nums), None
        except ValueError as e:
            return None, str(e)
    if args.piles:
        try:
            return casting.cast_lueshi(piles=[int(x) for x in args.piles]), None
        except ValueError as e:
            return None, str(e)
    if args.seed:
        return casting.cast_dayan(args.seed, variant=args.variant), None
    if args.at:
        # fromisoformat 在 Python 3.11+ 支持 Z；3.7-3.10 需替换
        iso = args.at.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(iso)
        except ValueError:
            return None, ("时间格式无法解析：%s\n"
                          "需 ISO 8601 且带时区，如 2026-10-04T00:35:27+08:00" % args.at)
        if dt.tzinfo is None:
            return None, "时间必须带时区偏移（如 +08:00 或 Z），否则结果不可复现。"
        try:
            return casting.cast_time(dt), None
        except ValueError as e:
            return None, str(e)
    return None, "请指定 --at / --numbers / --seed / --piles 之一。"


def cmd_cast(args) -> int:
    cast, err = _build_cast(args)
    if err:
        print(err, file=sys.stderr)
        return 2
    _print(casting.render(cast, include_trace=args.trace))
    return 0


def cmd_chain(args) -> int:
    """输出完整推导链：每步规则、代入数字、所得与依据。"""
    from zhouyi.derivation import build
    from zhouyi.guide import narrate, next_lookup
    cast, err = _build_cast(args)
    if err:
        print(err, file=sys.stderr)
        return 2
    chain = build(cast)
    if args.lang == "en":
        from zhouyi.english import narrate as narrate_en
        chain["narration"] = narrate_en(cast, chain)
    elif args.lang == "ja":
        from zhouyi.japanese import narrate as narrate_ja
        chain["narration"] = narrate_ja(cast, chain)
    else:
        chain["narration"] = narrate(cast, chain)
    chain["next"] = next_lookup(cast, chain)
    _print(chain)
    return 0


def cmd_guide(args) -> int:
    if args.lang == "en":
        from zhouyi.english import preparation
    elif args.lang == "ja":
        from zhouyi.japanese import preparation
    else:
        from zhouyi.guide import preparation
    _print(preparation())
    return 0


def cmd_read(args) -> int:
    if not 1 <= args.number <= 64:
        print("卦序须在 1-64 之间，收到 %d。" % args.number, file=sys.stderr)
        return 2
    try:
        out = (full_reading(args.number, args.position)
               if args.position is not None else full_reading(args.number))
        if args.lang == "en":
            from zhouyi.english import hexagram_title, legge
            out["english"] = {"title": hexagram_title(args.number), **legge(args.number, args.position)}
        elif args.lang == "ja":
            from zhouyi.japanese import read_extra
            out["japanese"] = read_extra(args.number, args.position)
        _print(out)
    except (ValueError, KeyError) as e:
        print(str(e), file=sys.stderr)
        return 2
    return 0


def cmd_takashima(args) -> int:
    from zhouyi.takashima import commentary
    if not 1 <= args.number <= 64:
        print("卦序须在 1-64 之间，收到 %d。" % args.number, file=sys.stderr)
        return 2
    try:
        out = commentary(args.number, args.position, include_sensitive=args.all)
        if args.lang == "en":
            from zhouyi.english import hexagram_title
            out["english"] = {
                "title": hexagram_title(args.number),
                "language_note": ("Takashima's text exists in Chinese only (Wang Zhiben's translation). "
                                  "Translate it for the user and label it as your own translation."),
            }
        elif args.lang == "ja":
            from zhouyi.japanese import takashima_extra
            out["japanese"] = takashima_extra(args.number)
        _print(out)
    except (ValueError, KeyError) as e:
        print(str(e), file=sys.stderr)
        return 2
    return 0


def cmd_list(_args) -> int:
    out = []
    for h in all_hexagrams():
        out.append({
            "number": h["number"],
            "name": h["name"],
            "upper": h["upper"],
            "lower": h["lower"],
            "judgment": h["judgment"],
        })
    _print(out)
    return 0


def cmd_sources(_args) -> int:
    _print(SOURCES)
    return 0


def main() -> int:
    p = argparse.ArgumentParser(
        prog="zy.py",
        description="周易经文与义理结构化检索（确定性起卦，不作预测）",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("guide", help="起卦前的准备说明与可报的输入")
    g.add_argument("--lang", choices=["zh", "en", "ja"], default="zh", help="输出语言：zh 中文（默认）/ en 英文 / ja 日文")
    g.set_defaults(func=cmd_guide)

    c = sub.add_parser("cast", help="起卦")
    c.add_argument("--at", help="ISO 8601 时间，必须带时区")
    c.add_argument("--numbers", nargs="+", help="两个或三个正整数（梅花易数）")
    c.add_argument("--seed", help="种子字符串（筮竹法）")
    c.add_argument("--piles", nargs=3, metavar="N",
                   help="略筮法亲手分筮竹：三变时左手根数（各 1-48）")
    c.add_argument("--variant", default="lueshi",
                   choices=["lueshi", "dayan", "shaoban"],
                   help="筮竹法：lueshi 略筮法（默认，高島常用）/ dayan 大衍筮法；shaoban 为 lueshi 旧名")
    c.add_argument("--trace", action="store_true", help="附三变明细")
    c.set_defaults(func=cmd_cast)

    ch = sub.add_parser("chain", help="输出逐步推导链（规则、算式、所得、依据）")
    ch.add_argument("--lang", choices=["zh", "en", "ja"], default="zh", help="输出语言：zh 中文（默认）/ en 英文 / ja 日文")
    ch.add_argument("--at", help="ISO 8601 时间，必须带时区")
    ch.add_argument("--numbers", nargs="+", help="两个或三个正整数（梅花易数）")
    ch.add_argument("--seed", help="种子字符串（筮竹法）")
    ch.add_argument("--piles", nargs=3, metavar="N",
                    help="略筮法亲手分筮竹：三变时左手根数（各 1-48）")
    ch.add_argument("--variant", default="lueshi",
                    choices=["lueshi", "dayan", "shaoban"],
                    help="筮竹法：lueshi 略筮法（默认，高島常用）/ dayan 大衍筮法；shaoban 为 lueshi 旧名")
    ch.set_defaults(func=cmd_chain)

    r = sub.add_parser("read", help="查卦辞爻辞与义理")
    r.add_argument("--lang", choices=["zh", "en", "ja"], default="zh", help="输出语言：zh 中文（默认）/ en 英文 / ja 日文")
    r.add_argument("number", type=int, help="卦序 1-64")
    r.add_argument("position", nargs="?",
                   help="爻位：爻题名（初九/六二/上六…或 初/二/…/上）最稳妥；数字为 0-5（0=初爻），6 亦指上爻")
    r.set_defaults(func=cmd_read)

    t = sub.add_parser("takashima", help="高島呑象《増補高島易断》原文：义理、占断、占例")
    t.add_argument("--lang", choices=["zh", "en", "ja"], default="zh", help="输出语言：zh 中文（默认）/ en 英文 / ja 日文")
    t.add_argument("number", type=int, help="卦序 1-64")
    t.add_argument("position", nargs="?",
                   help="省略为卦辞；爻题名（六五/上九…）、数字 0-5（0=初爻）、或 用九/用六")
    t.add_argument("--all", action="store_true",
                   help="含默认略去的健康、生育、战事内容")
    t.set_defaults(func=cmd_takashima)

    l = sub.add_parser("list", help="六十四卦列表")
    l.set_defaults(func=cmd_list)

    s = sub.add_parser("sources", help="出处登记表")
    s.set_defaults(func=cmd_sources)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
