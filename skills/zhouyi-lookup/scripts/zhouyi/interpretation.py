"""义理阐发层。

严格分工：
  - 象数层：卦象结构与阴阳关系，程序推导
  - 训诂层：经文释义，出自公版注疏
  - 义理层：哲学解读与修身方法，出自公版易学著作

三层的每一条都必须可溯源。凡无法溯源者，不得录入。

本模块只输出哲学与方法论内容，不输出吉凶预测、应验回溯，
也不替用户对任何具体事项作出判断。
"""

import json
from typing import Dict, List, Optional

from .hexagrams import (
    data_file,
    get_by_number,
    get_line_text,
    line_label,
    normalize_position,
)
from .trigrams import (
    CREATURES,
    DIRECTIONS,
    ELEMENTS,
    FAMILY,
    NATURE,
    SYMBOLS,
)

# 出处登记表。所有义理条目必须引用此表中的编号。
SOURCES: Dict[str, dict] = {
    "yijing": {
        "id": "yijing",
        "title": "周易",
        "status": "公有领域",
        "note": "卦爻辞原文，先秦至两汉累积成书",
    },
    "wangbi": {
        "id": "wangbi",
        "title": "周易集解（王弼集解）",
        "status": "公有领域",
        "note": "王弼注、韓康伯注，晋代",
    },
    "zhongyong": {
        "id": "zhongyong",
        "title": "礼记·中庸",
        "status": "公有领域",
        "note": "义理阐发常引",
    },
    "taixue": {
        "id": "taixue",
        "title": "礼记·大学",
        "status": "公有领域",
    },
    "xici": {
        "id": "xici",
        "title": "周易·系辞",
        "status": "公有领域",
        "note": "易学方法论总纲，如「辩吉凶者存乎辞」",
    },
    "chengyi": {
        "id": "chengyi",
        "title": "伊川易传（程颐）",
        "status": "公有领域",
        "note": "北宋程颐撰，义理派宗本，专以人事说卦爻",
    },
    "legge": {
        "id": "legge",
        "title": "The Yî King (Sacred Books of the East, vol. XVI), tr. James Legge, 1882",
        "status": "公有领域",
        "note": "英译经文；--lang en 时输出",
    },
    "meihua": {
        "id": "meihua",
        "title": "梅花易数（旧题邵雍撰）",
        "status": "公有领域",
        "note": "报数起卦、年月日时起卦之法所本",
    },
    "takashima": {
        "id": "takashima",
        "title": "増補高島易断",
        "status": "公有领域",
        "note": "日文原书 1886 年首版，作者高島嘉右衛門 1914 年卒，"
                "作者权已届满。起卦取其筮儀所载略筮法（三变筮）；"
                "逐卦逐爻原文（义理、占断、占例）用王治本汉译，见 takashima 命令。",
    },
}

# 每卦的核心义理。格式：卦名 -> 义理主旨。
# 撰写要求：只谈象数结构与修身方法，不作吉凶判断。
HEXAGRAM_MEANING: Dict[str, str] = {
    "乾": "六爻纯阳，刚健中正。卦义在自强不息之德，亦在盈满自戒之理。"
          "先元而后亨贞，序不可越。",
    "坤": "六爻纯阴，柔顺承载。卦义在厚德载物之量，亦在知几守静之智。"
          "先迷后得主，为顺势而行者立言。",
    "屯": "下震上坎，动而遇险。卦义在草创维艰之实：初爻磐桓，进退在度，"
          "不在速成。",
    "蒙": "下坎上艮，险而止。卦义在蒙昧待启之理：求教者当诚心自来，"
          "初筮则告；再三渎问则不复告，启蒙之道贵于正。",
    "需": "下乾上坎，刚而险。卦义在等待有度：待而不躁，"
          "涉险以渐，非一味冒进。",
    "讼": "下坎上乾，险而健。卦义在争讼止息：窒而能通，中道而止则不终，"
          "以让为贵。",
    "师": "下坎上坤，险而顺。卦义在统众有道：出师有名，"
          "纪律在先，师以律为用。",
    "比": "下坤上坎，顺而亲。卦义在亲比有度：比之匪人则失，"
          "慎择所亲为第一要义。",
    "小畜": "下乾上巽，以小畜大。卦义在积蓄之理：密云不雨，"
          "所积未足，须待时。",
    "履": "下兑上乾，悦而应。卦义在履礼有节：如履虎尾，"
          "知戒而不失礼，方能亨通。",
    "泰": "下乾上坤，天地交泰。卦义在通交之理：上下交而其志同，"
          "然泰极而否来，须存防满之心。",
    "否": "下坤上乾，天地不交。卦义在闭塞之理：否极则泰来，"
          "否时当俭德辟难，不可妄动。",
    "同人": "下离上乾，与人和同。卦义在同而有别：同于野则公，"
          "同于宗则私，公私之辨在所与何同。",
    "大有": "下乾上离，光明盛大。卦义在盛大知止：大有之时，"
          "须以谦抑保其有。",
    "谦": "下艮上坤，谦而又谦。卦义在谦德之理：谦尊而光，"
          "谦卑而不可逾，为六十四卦中唯一六爻皆美之卦。",
    "豫": "下坤上震，顺而动。卦义在预备之理：豫者豫备，"
          "不是逸乐。",
    "随": "下震上兑，动而随。卦义在随时之理：随时而不随波，"
          "所随贵在正。",
    "蛊": "下巽上艮，积弊待治。卦义在整治积弊：干父之蛊，"
          "拨乱反正，拨而先须明。",
    "临": "下兑上坤，柔临刚。卦义在居上之德：临以正不以势，"
          "八月为盛极之月，为盈满之戒。",
    "观": "下坤上巽，观而未动。卦义在观省之理：观国之光，"
          "观人观己，观风先观己。",
    "噬嗑": "下震上离，明罚敕法。卦义在除梗用刑：噬而后合，"
          "梗不除则事不成。",
    "贲": "下离上艮，文饰之道。卦义在饰以质：贲以文饰，"
          "然文胜则质伤，白贲为上。",
    "剥": "下坤上艮，五阴剥阳。卦义在剥落之理：剥时当止，"
          "硕果不食，待于阳复。",
    "复": "下震上坤，一阳来复。卦义在复归之理：不远复，无祗悔，"
          "初爻为全卦关键，知几其神。",
    "无妄": "下震上乾，不妄为。卦义在诚明之理：无妄者，"
          "不设机心，天道自然。",
    "大畜": "下乾上艮，大有蓄积。卦义在厚积之理：日新其德，"
          "积而不发为畜。",
    "颐": "下震上艮，颐养之道。卦义在自养之理：观颐自求口实，"
          "所养者正，所求者自。",
    "大过": "下巽上兑，过而能济。卦义在非常之理：栋桡之时，"
          "非常之任，非常之功。",
    "坎": "重坎相叠，重险。卦义在险中之理：习坎，"
          "以险炼心，唯实心为可恃。",
    "离": "重离相继，附丽。卦义在明而能柔：畜牝牛，"
          "明而不刚，柔以保明。",
    "咸": "下艮上兑，少男少女。卦义在感应之理：咸者感，"
          "感而遂通，不可以私。",
    "恒": "下巽上震，久而常。卦义在恒久之理：恒其德，"
          "久而能变，谓之通。",
    "遁": "下艮上乾，退避。卦义在退让之理：知几而退，"
          "肥遁无不利，退得其所。",
    "大壮": "下乾上震，刚壮。卦义在壮而须制：壮于趾则不进，"
          "羝羊触藩，壮而思进则困。",
    "晋": "下坤上离，明出地上。卦义在进之理：自昭明，"
          "进而不失其序。",
    "明夷": "下离上坤，明入地中。卦义在晦明之理：明夷之时，"
          "晦其明而保其心。",
    "家人": "下离上巽，家道。卦义在齐家之理：正家之道，"
          "严与和相济。",
    "睽": "下兑上离，二女同居。卦义在乖离之理：睽之时，"
          "以同而异，异而同。",
    "蹇": "下艮上坎，行道有险。卦义在见险能止：蹇之时，"
          "西南为利，东北为不利，方位喻进退。",
    "解": "下坎上震，险解。卦义在解纷之理：解而后动，"
          "以静制动。",
    "损": "下兑上艮，损下益上。卦义在损己之理：损之又损，"
          "惩忿窒欲，损而有孚。",
    "益": "下震上巽，损上益下。卦义在利人之理：见善则迁，"
          "有过则改，益者同理。",
    "夬": "下乾上兑，决而去之。卦义在决断之理：决而去之，"
          "必以众正，不可以偏。",
    "姤": "下巽上乾，不期而遇。卦义在邂逅之理：系于金柅，"
          "不期而遇者，礼节在先。",
    "萃": "下坤上兑，聚众。卦义在聚众之理：萃者聚也，聚以正则得众。",
    "升": "下巽上坤，积小成高。卦义在上升之理：允升则大，"
          "积而不骤。",
    "困": "下坎上兑，困穷。卦义在困穷之理：困而不失其所亨，"
          "致命遂志，困能通。",
    "井": "下巽上坎，井养不穷。卦义在养人之理：井者养也，"
          "养而不穷，井德也。",
    "革": "下离上兑，变革。卦义在变革之理：革而当，其悔乃亡，"
          "水火相息而后能变。",
    "鼎": "下巽上离，鼎新。卦义在养贤之理：鼎者国之宝，"
          "虚而能容，受纳四方。",
    "震": "震为雷，重雷。卦义在惊惕之理：震惊百里，"
          "不丧匕鬯，惊而后能定。",
    "艮": "艮为山，重艮。卦义在止之道：艮其背，"
          "知止而后能定，不见其人，无所争。",
    "渐": "下艮上巽，渐进。卦义在渐进之理：鸿之渐进，"
          "循序而不躐等。",
    "归妹": "下兑上震，归而未得其正。卦义在名分未正之理："
          "归妹非正配，位不当则事难成。",
    "丰": "下离上震，大明。卦义在丰大之时：日中则昃，"
          "丰而须持盈之戒。",
    "旅": "下艮上离，行旅在外。卦义在旅居之理：旅居者，"
          "柔顺为贵，卑以自处。",
    "巽": "巽为风，风行无形。卦义在柔入之理：巽以申命行事，"
          "柔而能入，入而能断。",
    "兑": "兑为泽，泽润万物。卦义在和悦之理：和悦可亲，"
          "悦以先民，说以先民。",
    "涣": "下坎上巽，涣散。卦义在涣而能聚：涣其群，"
          "大牲，其涣王居也。",
    "节": "下兑上坎，节制。卦义在节度之理：节以制度，"
          "不伤财不害民，苦节不可贞。",
    "中孚": "下兑上巽，中心诚信。卦义在诚信之理：孚者信也，"
          "中心实，诚可格豚鱼。",
    "小过": "下艮上震，小有过越。卦义在小事宜慎："
          "可小事不可大事，飞鸟遗音，卑下胜于高上。",
    "既济": "水在火上，事已成。卦义在成功须戒：初成而终乱，"
          "既济之时，患在不变。",
    "未济": "火在水上，事未成。卦辞：未济，亨。小狐汔济，"
          "濡其尾，无攸利。义理在未成之理：未济非终，"
          "慎终如始。",
}


def hexagram_meaning(number: int) -> str:
    """卦的义理主旨。"""
    h = get_by_number(number)
    return HEXAGRAM_MEANING.get(h["name"], "")


def _load_line_meaning() -> Dict[str, list]:
    """加载三百八十四爻逐爻解读（L3 层）。"""
    path = data_file("lines.json")
    with path.open(encoding="utf-8") as f:
        return json.load(f)["lines"]


LINE_MEANING: Dict[str, list] = _load_line_meaning()

SOURCE_TITLES: Dict[str, str] = {k: v["title"] for k, v in SOURCES.items()}


def line_meaning(number: int, position: int) -> Optional[Dict]:
    """单爻的取象与义理（L3）。

    position 0=初爻 … 5=上爻；亦接受 6 与爻题名。
    返回 None 表示该爻尚未录入。
    """
    position = normalize_position(position)
    rows = LINE_MEANING.get(str(number))
    if not rows or position >= len(rows):
        return None
    row = rows[position]
    return {
        "xiang": row["x"],
        "li": row["l"],
        "sources": [
            {"id": s, "work": SOURCE_TITLES.get(s, s),
             "status": SOURCES.get(s, {}).get("status", "")}
            for s in row["s"]
        ],
    }


def line_meaning_coverage() -> Dict[str, int]:
    """L3 覆盖统计，供自检使用。"""
    return {
        "hexagrams": len(LINE_MEANING),
        "lines": sum(len(v) for v in LINE_MEANING.values()),
    }


def line_commentary(number: int, position: int) -> Dict:
    """单爻的象数解读与出处。

    不含吉凶判断。position 0=初爻 … 5=上爻；亦接受 6（上爻）或爻题名。
    """
    position = normalize_position(position)
    h = get_by_number(number)
    lower_lines = h["lines"]
    is_yang = _line_is_yang(number, position)
    text = get_line_text(number, position)

    return {
        "position": position,
        "label": line_label(position, is_yang),
        "text": text,
        "meaning": line_meaning(number, position),
        "trigram": _position_trigram(number, position),
        "text_source": {
            "work": SOURCES["yijing"]["title"],
            "location": f"{h['name']}卦·{line_label(position, is_yang)}",
            "status": SOURCES["yijing"]["status"],
        },
        "commentary_source": {
            "work": SOURCES["wangbi"]["title"],
            "note": SOURCES["wangbi"]["note"],
            "status": SOURCES["wangbi"]["status"],
        },
        "method_source": {
            "work": SOURCES["takashima"]["title"],
            "note": "义理阐发方法参照，"
                    "不采用其占断结论与应验回溯",
            "status": SOURCES["takashima"]["status"],
        },
    }


def _line_is_yang(number: int, position: int) -> bool:
    from .hexagrams import get_by_lines

    h = get_by_number(number)
    from .trigrams import TRIGRAMS

    lower = TRIGRAMS[h["lower"]]
    upper = TRIGRAMS[h["upper"]]
    all_lines = list(lower) + list(upper)
    return all_lines[position] == 1


def _position_trigram(number: int, position: int) -> Dict:
    """爻所属三画卦及自然象。"""
    h = get_by_number(number)
    if position <= 2:
        t = h["lower"]
        tier = "下卦"
    else:
        t = h["upper"]
        tier = "上卦"
    return {
        "name": t,
        "tier": tier,
        "symbol": SYMBOLS[t],
        "nature": NATURE[t],
        "element": ELEMENTS[t],
        "direction": DIRECTIONS[t],
        "family": FAMILY[t],
        "creature": CREATURES[t],
    }


def full_reading(number: int, position: Optional[int] = None) -> Dict:
    """完整解读输出。position 为 None 时返回卦级解读。"""
    h = get_by_number(number)
    out = {
        "hexagram": {
            "number": h["number"],
            "name": h["name"],
            "upper": h["upper"],
            "lower": h["lower"],
            "symbol": SYMBOLS[h["upper"]] + " " + SYMBOLS[h["lower"]],
        },
        "judgment": h["judgment"],
        "judgment_source": {
            "work": SOURCES["yijing"]["title"],
            "location": f"{h['name']}卦·卦辞",
            "status": SOURCES["yijing"]["status"],
        },
        "meaning": hexagram_meaning(number),
        "upper_nature": {
            "name": h["upper"],
            "symbol": SYMBOLS[h["upper"]],
            "nature": NATURE[h["upper"]],
            "element": ELEMENTS[h["upper"]],
            "direction": DIRECTIONS[h["upper"]],
        },
        "lower_nature": {
            "name": h["lower"],
            "symbol": SYMBOLS[h["lower"]],
            "nature": NATURE[h["lower"]],
            "element": ELEMENTS[h["lower"]],
            "direction": DIRECTIONS[h["lower"]],
        },
    }

    # 乾用九、坤用六：六爻皆变时所观之辞，不属任何一爻
    if h.get("yong"):
        out["yong"] = {
            "label": h["yong"]["label"],
            "text": h["yong"]["text"],
            "source": {
                "work": SOURCES["yijing"]["title"],
                "location": f"{h['name']}卦·{h['yong']['label']}",
                "status": SOURCES["yijing"]["status"],
            },
        }

    if position is None:
        out["lines"] = [line_commentary(number, i) for i in range(6)]
    else:
        out["line"] = line_commentary(number, position)

    out["disclaimer"] = (
        "本输出为《周易》经文与义理的结构化检索结果，"
        "不含吉凶预测，不构成对任何具体事项的判断。"
    )
    return out
