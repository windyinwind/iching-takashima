"""人话版数据聚合：64 卦 + 384 爻 × zh/en/ja。

每条忠实「取象/义理」原义，改写成现代口语；不作占断、不按事项给吉凶。
三语各自成文，含义对齐。由 service/scripts/gen_plain.py 导出为 plain.json。

分 8 批存储，每批 8 卦，便于写作与校对。
"""
from plain_p1 import HEXAGRAMS as H1, LINES as L1
from plain_p2 import HEXAGRAMS as H2, LINES as L2
from plain_p3 import HEXAGRAMS as H3, LINES as L3
from plain_p4 import HEXAGRAMS as H4, LINES as L4
from plain_p5 import HEXAGRAMS as H5, LINES as L5
from plain_p6 import HEXAGRAMS as H6, LINES as L6
from plain_p7 import HEXAGRAMS as H7, LINES as L7
from plain_p8 import HEXAGRAMS as H8, LINES as L8

VERSION = "1.0.0"

HEXAGRAMS = {}
LINES = {}
for _h, _l in ((H1, L1), (H2, L2), (H3, L3), (H4, L4),
               (H5, L5), (H6, L6), (H7, L7), (H8, L8)):
    HEXAGRAMS.update(_h)
    LINES.update(_l)
