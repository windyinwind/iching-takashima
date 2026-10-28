"""周易结构化解读 API。

公有领域古籍的结构化检索与义理阐发工具。
不提供吉凶预测，不替代任何决策。
"""

from .casting import cast_dayan, cast_numbers, cast_time, render
from .hexagrams import (
    all_hexagrams,
    get_by_lines,
    get_by_name,
    get_by_number,
    get_line_text,
    line_label,
)
from .interpretation import SOURCES, full_reading, hexagram_meaning

__version__ = "1.4.0"

__all__ = [
    "cast_dayan",
    "cast_numbers",
    "cast_time",
    "render",
    "all_hexagrams",
    "get_by_lines",
    "get_by_name",
    "get_by_number",
    "get_line_text",
    "line_label",
    "SOURCES",
    "full_reading",
    "hexagram_meaning",
]
