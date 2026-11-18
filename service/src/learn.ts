// Guide pages ("Learn") and the two sidebars shared by every page: learning links, related
// hexagrams, an interactive hexagram builder, and the 8×8 table of all 64 hexagrams.
import { HEXAGRAMS, LEGGE, T, TRAD } from "./engine/data.ts";
import { SYMBOLS, getByLines, getByNumber, linesOf } from "./engine/core.ts";
import excerptsJson from "./generated/excerpts.json" with { type: "json" };

const EXCERPTS: any = excerptsJson;
import { type Lang, figure, hexPath, hexTitle, linePath, trigramPath, trigramTitle } from "./pages.ts";

const ORDER = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// --- relations ---------------------------------------------------------------

export function relations(n: number) {
  const l = linesOf(getByNumber(n));
  return {
    inverse: getByLines([...l].reverse()).number,                      // 综卦: turned upside down
    opposite: getByLines(l.map((x) => 1 - x)).number,                  // 错卦: every line changed
    nuclear: getByLines([l[1], l[2], l[3], l[2], l[3], l[4]]).number,   // 互卦: lines 2-4 and 3-5
    pair: n % 2 ? n + 1 : n - 1,                                        // its partner in the sequence
  };
}

const short = (lang: Lang, n: number) =>
  lang === "en" ? `${n} ${T.hexagram_en[String(n)][0]} ${getByNumber(n).name}` : lang === "ja" ? `${n} ${T.hexagram_ja[String(n)][0]}` : `${n} ${getByNumber(n).name}`;

const mini = (lang: Lang, n: number, hl: number[] = []) =>
  `<a class="hexlink" href="${hexPath(lang, n)}">${figure(linesOf(getByNumber(n)), { small: true, hl, label: hexTitle(lang, n) })}<span>${esc(short(lang, n))}</span></a>`;

// --- learn pages -------------------------------------------------------------

export const LEARN = ["reading-a-hexagram", "lines-and-positions", "the-eight-trigrams", "moving-lines", "takashima-method", "worked-example", "how-to-read-the-text", "related-hexagrams"];
export const learnPath = (lang: Lang, slug: string) => `/${lang}/learn/${slug}`;

const TITLES: Record<string, Record<Lang, string>> = {
  "reading-a-hexagram": { en: "How to read a hexagram", zh: "怎样读一卦", ja: "卦の読み方" },
  "lines-and-positions": { en: "Yin, yang and the six positions", zh: "阴阳与六爻之位", ja: "陰陽と六爻の位" },
  "the-eight-trigrams": { en: "The eight trigrams", zh: "八卦", ja: "八卦" },
  "moving-lines": { en: "Moving lines and the changed hexagram", zh: "动爻与之卦", ja: "動爻と之卦" },
  "takashima-method": { en: "Takashima’s three-change method", zh: "高岛的略筮法", ja: "高島の略筮法" },
  "worked-example": { en: "A complete cast, stalk by stalk", zh: "一次完整的起卦：逐步拆解", ja: "起卦の完全な実例：一歩ずつ" },
  "how-to-read-the-text": { en: "How to read the text", zh: "经文怎么读", ja: "経文の読み方" },
  "related-hexagrams": { en: "Related hexagrams: inverse, opposite, nuclear", zh: "综卦、错卦、互卦", ja: "綜卦・錯卦・互卦" },
};
export const learnTitle = (lang: Lang, slug: string) => TITLES[slug][lang];

const MENG = 4;
const p = (s: string) => `<p>${s}</p>`;
const L = (lang: Lang, slug: string) => `<a href="${learnPath(lang, slug)}">${esc(learnTitle(lang, slug))}</a>`;
const H = (lang: Lang, n: number) => `<a href="${hexPath(lang, n)}">${esc(hexTitle(lang, n))}</a>`;
const fig = (n: number, hl: number[] = []) => figure(linesOf(getByNumber(n)), { hl, label: "" });
const row = (...items: string[]) => `<div class="demo">${items.join("")}</div>`;
const cap = (figHtml: string, text: string) => `<figure>${figHtml}<figcaption>${text}</figcaption></figure>`;
// Deep link into the casting flow: /#cast opens the method step, /#cast=stalks preselects a method.
const castLink = (lang: Lang, text: string, hash = "#cast") => `<p><a class="btn" href="/${lang}/${hash}">${esc(text)}</a></p>`;

function labelledFigure(lang: Lang) {
  const l = linesOf(getByNumber(MENG));
  const names = { en: ["1 (bottom)", "2", "3", "4", "5", "6 (top)"], zh: ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"], ja: ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"] }[lang];
  const yy = { en: ["yin", "yang"], zh: ["阴", "阳"], ja: ["陰", "陽"] }[lang];
  const rows = [5, 4, 3, 2, 1, 0].map((i) => `<tr><td>${figure([l[i]], { small: true })}</td><td>${esc(names[i])}</td><td>${esc(yy[l[i]])}</td></tr>`).join("");
  return `<table class="labelled">${rows}</table>`;
}

function trigramTable(lang: Lang) {
  const head = { en: ["", "Trigram", "Image", "Family", "No."], zh: ["", "卦", "象", "家人", "先天数"], ja: ["", "卦", "象", "家族", "先天数"] }[lang];
  const fam: Record<Lang, Record<string, string>> = {
    en: { "乾": "father", "坤": "mother", "震": "eldest son", "巽": "eldest daughter", "坎": "middle son", "离": "middle daughter", "艮": "youngest son", "兑": "youngest daughter" },
    zh: T.family, ja: { "乾": "父", "坤": "母", "震": "長男", "巽": "長女", "坎": "中男", "离": "中女", "艮": "少男", "兑": "少女" },
  };
  const img = (t: string) => (lang === "en" ? T.trigram_en[t][1] : lang === "ja" ? T.trigram_ja[t][2] : T.nature[t]);
  const rows = ORDER.map((t, i) => `<tr><td>${figure([...T.trigrams[t]], { small: true })}</td><td><a href="${trigramPath(lang, t)}">${esc(trigramTitle(lang, t))}</a></td><td>${esc(img(t))}</td><td>${esc(fam[lang][t])}</td><td>${i + 1}</td></tr>`).join("");
  return `<table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}

function body(lang: Lang, slug: string): string {
  const r = relations(MENG);
  const en = lang === "en", ja = lang === "ja";
  const t = (e: string, z: string, j: string) => (en ? e : ja ? j : z);
  const qa = (q: string, a: string) => `<h3>${q}</h3>${p(a)}`;
  const faq = (items: string[]) => [`<h2>${t("Frequently asked questions", "常见问题", "よくある質問")}</h2>`, ...items].join("");
  switch (slug) {
    case "reading-a-hexagram":
      return [
        p(t("A hexagram is six lines stacked from the bottom up. Each line is either <b>yang</b>, a solid line ⚊, or <b>yin</b>, a broken line ⚋. Six lines with two choices each give 2⁶ = 64 hexagrams.",
          "一卦由六爻自下而上叠成。每一爻非<b>阳</b>（—，⚊）即<b>阴</b>（--，⚋）。六爻各有两种，共得 2⁶ = 64 卦。",
          "卦は六本の爻を下から上へ積み重ねたものです。爻は<b>陽</b>（実線 ⚊）か<b>陰</b>（切れた線 ⚋）のどちらか。六本それぞれに二通りで、2⁶＝64卦になります。")),
        row(cap(fig(MENG), H(lang, MENG)), labelledFigure(lang)),
        p(t("<b>Read from the bottom.</b> Line 1 is the lowest and line 6 the top, because a situation is thought to grow from below, like a plant.",
          "<b>自下而上读。</b>初爻在最下，上爻在最上：事物从下面生长起来，如草木。",
          "<b>下から読みます。</b>初爻が一番下、上爻が一番上。物事は植物のように下から育つと考えるからです。")),
        p(t(`<b>Six lines are two trigrams.</b> Lines 1–3 form the lower (inner) trigram and lines 4–6 the upper (outer) one. Meng is ${trigramTitle("en", "坎")} below ${trigramTitle("en", "艮")}: water at the foot of a mountain, a spring that has not yet found its way. See ${L(lang, "the-eight-trigrams")}.`,
          `<b>六爻即两个三画卦。</b>初、二、三爻为下卦（内卦），四、五、上爻为上卦（外卦）。蒙卦下坎上艮：山下有水，泉始出而未知所之。见${L(lang, "the-eight-trigrams")}。`,
          `<b>六爻は二つの小成卦です。</b>初〜三爻が下卦（内卦）、四〜上爻が上卦（外卦）。蒙は下が坎、上が艮で、山の下の水、まだ行き先を知らない泉の象です。${L(lang, "the-eight-trigrams")}も参照。`)),
        p(t("<b>Line names.</b> A yang line is called Nine (九) and a yin line Six (六). The name gives the kind of line and its place: 六五 is a yin line in the fifth place, 九二 a yang line in the second. The bottom and top lines put the place first: 初六, 上九.",
          "<b>爻题。</b>阳爻称九，阴爻称六。爻题标明爻性与爻位：六五是第五位的阴爻，九二是第二位的阳爻。初爻、上爻位名置前：初六、上九。",
          "<b>爻の名前。</b>陽爻を九、陰爻を六と呼びます。六五は五番目の陰爻、九二は二番目の陽爻。初爻と上爻は位を先に言います：初六、上九。")),
        p(t(`<b>What to read.</b> Each hexagram has a <i>judgment</i> for the whole and a text for each line. When you cast by Takashima’s method you get one hexagram and one moving line: read the judgment, then that line, then look at the hexagram it changes into. See ${L(lang, "moving-lines")}.`,
          `<b>读什么。</b>每卦有总说全卦的卦辞，与六条爻辞。按高岛略筮法起卦，得一卦一动爻：先读卦辞，再读那一爻的爻辞，再看它变成的之卦。见${L(lang, "moving-lines")}。`,
          `<b>何を読むか。</b>卦には全体を述べる卦辞と、六つの爻辞があります。高島の略筮法では一卦と一つの動爻が得られます。まず卦辞、次にその爻の爻辞、そして之卦を見ます。${L(lang, "moving-lines")}を参照。`)),
        `<h2>${t("After a cast on this site", "在本站起卦之后", "このサイトで起卦したら")}</h2>`,
        p(t(`Your cast links every part of the reading; read them in this order. <b>1. The judgment</b> — on your hexagram’s own page, for example ${H(lang, MENG)}. <b>2. The moving line</b> — it has a page of its own, for example <a href="${linePath(lang, MENG, 4)}">Meng, line 5</a>, where the line’s text, its structure and Takashima’s commentary sit together. <b>3. The changed hexagram</b> — for example ${H(lang, 59)}, read as background: where the situation is heading. The reasoning behind steps 2 and 3 is in ${L(lang, "moving-lines")}.`,
          `起卦结果会把每一部分都链接好，按此顺序读。<b>一、卦辞</b>——在该卦自己的页面，如${H(lang, MENG)}。<b>二、动爻</b>——动爻有独立的页面，如<a href="${linePath(lang, MENG, 4)}">蒙卦六五</a>，爻辞、结构与高岛原注都在一处。<b>三、之卦</b>——如${H(lang, 59)}，作为事之所趋的参照。第二、三步的读法见${L(lang, "moving-lines")}。`,
          `起卦の結果は各部分へリンクしています。この順序で読んでください。<b>1．卦辞</b>――その卦自身のページ、例えば${H(lang, MENG)}。<b>2．動爻</b>――動爻には専用のページがあり、例えば<a href="${linePath(lang, MENG, 4)}">蒙・六五</a>には爻辞・構造・高島の解釈がまとまっています。<b>3．之卦</b>――例えば${H(lang, 59)}。事の行く先を示す参考として読みます。2と3の読み方は${L(lang, "moving-lines")}にあります。`)),
        castLink(lang, t("Cast one now and read it in this order", "现在起一卦，按这个顺序读", "今すぐ一卦立て、この順序で読みましょう")),
      ].join("");
    case "lines-and-positions": {
      const five = linePath(lang, MENG, 4);
      return [
        p(t("Each of the six places has a character of its own, and a line is read against its place.", "六爻之位各有其性，读爻要看它居于何位。", "六つの位にはそれぞれ性格があり、爻はその位との関係で読みます。")),
        `<ul class="points">`,
        `<li>${t("<b>Proper place (当位).</b> Places 1, 3 and 5 are yang places; 2, 4 and 6 are yin places. A yang line in a yang place, or a yin line in a yin place, is “in its proper place”.",
          "<b>当位。</b>初、三、五为阳位，二、四、上为阴位。阳爻居阳位、阴爻居阴位为当位，反之为不当位。",
          "<b>当位。</b>初・三・五は陽位、二・四・上は陰位。陽爻が陽位、陰爻が陰位にあれば「位を得る」といいます。")}</li>`,
        `<li>${t("<b>Central (中).</b> Lines 2 and 5 are the middle of their trigrams. Being central is usually favourable; the fifth is the ruler’s place and the second the minister’s.",
          "<b>得中。</b>二、五两爻居上下卦之中，多吉。五为君位，二为臣位。",
          "<b>中。</b>二爻と五爻は上下卦の真ん中で、多くは吉。五は君の位、二は臣の位です。")}</li>`,
        `<li>${t("<b>Correspondence (应).</b> Lines 1 and 4, 2 and 5, 3 and 6 are partners. They answer each other when one is yin and the other yang; two lines of the same kind do not respond.",
          "<b>应。</b>初与四、二与五、三与上相应。一阴一阳为有应，同性则无应。",
          "<b>応。</b>初と四、二と五、三と上が対になります。陰と陽なら応じ、同性なら応じません。")}</li>`,
        `<li>${t("<b>Neighbours (比).</b> Adjacent lines also affect each other, especially a yin line just below a yang one, which “receives” it.",
          "<b>比。</b>相邻两爻亦相影响，尤其阴爻在阳爻之下，称承。",
          "<b>比。</b>隣り合う爻も影響し合います。特に陽爻のすぐ下の陰爻は、それを「承ける」といいます。")}</li></ul>`,
        row(cap(fig(MENG, [4]), `<a href="${five}">${esc(t("Meng, line 5 (六五)", "蒙卦六五", "蒙・六五"))}</a>`)),
        p(t(`<b>Example.</b> In Meng the fifth line is yin in a yang place (out of place), but central, and it answers the yang second line. Takashima reads it as a young ruler who trusts a worthy minister: “The youthful and inexperienced: good fortune.” <a href="${five}">Read the line</a>.`,
          `<b>例。</b>蒙卦六五，阴居阳位不当位，然得中，下应九二之阳。高岛释为幼主信任贤臣：「童蒙，吉。」<a href="${five}">看这一爻</a>。`,
          `<b>例。</b>蒙の六五は陰が陽位にあって位を得ませんが、中を得て九二の陽と応じます。高島は若い君主が賢臣を信任する象と読みます：「童蒙、吉」。<a href="${five}">この爻を読む</a>。`)),
        faq([
          qa(t("Which places are yang places, and which are yin?", "哪些是阳位，哪些是阴位？", "陽位と陰位はどれですか？"),
            t("Places 1, 3 and 5 are yang places; 2, 4 and 6 are yin places. A yang line in a yang place, or a yin line in a yin place, is in its proper place.", "初、三、五为阳位，二、四、上为阴位。阳爻居阳位、阴爻居阴位为当位。", "初・三・五が陽位、二・四・上が陰位です。陽爻が陽位、陰爻が陰位にあれば当位です。")),
          qa(t("Which lines are central?", "哪两爻得中？", "中を得る爻はどれですか？"),
            t("Lines 2 and 5, the middle of the lower and upper trigrams. The fifth is the ruler’s place and the second the minister’s.", "二、五两爻，居下卦与上卦之中。五为君位，二为臣位。", "二爻と五爻で、上下卦の真ん中です。五は君の位、二は臣の位です。")),
          qa(t("Which lines correspond to each other?", "哪几对爻相应？", "応じる爻の組はどれですか？"),
            t("Lines 1 and 4, 2 and 5, and 3 and 6 are partners. They answer each other when one is yin and the other yang; two lines of the same kind do not respond.", "初与四、二与五、三与上相应。一阴一阳为有应，同性则无应。", "初と四、二と五、三と上が対です。陰と陽なら応じ、同性なら応じません。")),
        ]),
        castLink(lang, t("Cast one and see which place your moving line takes", "起一卦，看你的动爻居于何位", "一卦立てて、動爻がどの位にあるか見てみましょう")),
      ].join("");
    }
    case "the-eight-trigrams":
      return [
        p(t("Three lines give 2³ = 8 trigrams, the building blocks of the hexagrams. Each has an image in nature, a place in the family and a number in the Earlier Heaven order, which Takashima’s method uses to turn stalk counts into trigrams.",
          "三爻得 2³ = 8 个三画卦，是六十四卦的基本单位。每卦有自然之象、家人之象与先天之数；高岛略筮法即以先天数把筮数译成卦。",
          "三本の爻で 2³＝8 つの小成卦ができ、六十四卦の材料になります。それぞれ自然の象・家族の象・先天数を持ち、高島の略筮法は先天数で筮竹の数を卦に直します。")),
        trigramTable(lang),
        p(t(`Two trigrams make a hexagram: <a href="/${lang}/hexagrams">all 64 in one table</a>.`, `两卦相重成六十四卦：<a href="/${lang}/hexagrams">六十四卦全表</a>。`, `二つを重ねて六十四卦：<a href="/${lang}/hexagrams">一覧表</a>。`)),
        faq([
          qa(t("Why are there exactly eight trigrams?", "为什么恰好是八卦？", "なぜ八卦は八つなのですか？"),
            t("Each trigram is three lines, and each line is yin or yang: 2³ = 8.", "每卦三爻，每爻或阴或阳：2³ = 8。", "各卦は三本の爻で、各爻は陰か陽：2³＝8 です。")),
          qa(t("What belongs to each trigram?", "每一卦都带哪些象？", "各卦には何が属しますか？"),
            t("An image in nature, a place in the family and a number in the Earlier Heaven order — all three are in the table above.", "自然之象、家人之象与先天之数——三者都在上表中。", "自然の象、家族の象、先天数です。三つとも上の表にあります。")),
          qa(t("How do trigrams make hexagrams?", "八卦怎样组成六十四卦？", "八卦はどう六十四卦になりますか？"),
            t("Stack two trigrams, one as the lower (inner) and one as the upper (outer): the 8 × 8 combinations are the 64 hexagrams.", "两卦相重，一为下卦（内卦），一为上卦（外卦）：8 × 8 即成六十四卦。", "二つを重ね、一つを下卦（内卦）、一つを上卦（外卦）とすると、8×8 で六十四卦になります。")),
        ]),
        castLink(lang, t("Split the stalks and watch two trigrams meet", "分筮竹起一卦，看两个三画卦如何相遇", "筮竹を分けて、二つの小成卦が重なるのを見てみましょう"), "#cast=stalks"),
      ].join("");
    case "moving-lines":
      return [
        p(t("When the stalks are counted, each line comes out as one of four numbers: 7 young yang and 8 young yin are still; 9 old yang and 6 old yin are <b>moving</b>. An old line has reached its extreme and turns into its opposite.",
          "揲蓍所得每爻为六、七、八、九之一：七为少阳，八为少阴，皆静；九为老阳，六为老阴，皆<b>动</b>。老则极，极则变。",
          "筮竹を数えると各爻は六・七・八・九のいずれかになります。七（少陽）と八（少陰）は静、九（老陽）と六（老陰）は<b>動</b>。極まったものは反対に転じます。")),
        p(t("Change the moving lines and you get the <b>changed hexagram</b> (之卦), which shows where the situation is heading.", "把动爻阴阳互变，即得<b>之卦</b>，示事之所趋。", "動爻の陰陽を反転させると<b>之卦</b>が得られ、事の行く先を示します。")),
        row(cap(fig(MENG, [4]), H(lang, MENG)), `<span class="arrow">→</span>`, cap(fig(59, [4]), H(lang, 59))),
        p(t("Takashima’s method always gives exactly one moving line. Read that line in the original hexagram first; the changed hexagram is background. The classical 18-change method can give anywhere from none to six.",
          "高岛略筮法恒得一动爻：先读本卦这一爻，之卦为参照。古法大衍十八变则动爻零至六个不定。",
          "高島の略筮法では動爻は必ず一つ。まず本卦のその爻を読み、之卦は参考にします。古法の十八変では動爻は〇〜六と一定しません。")),
        faq([
          qa(t("What makes a line “moving”?", "什么叫动爻？", "「動爻」とはどういう爻ですか？"),
            t("Its number: 9 (old yang) and 6 (old yin) are moving, while 7 (young yang) and 8 (young yin) are still. An old line has reached its extreme and turns into its opposite.", "看其数：九为老阳、六为老阴，皆动；七为少阳、八为少阴，皆静。老则极，极则变为其反面。", "その数です。九（老陽）と六（老陰）が動、七（少陽）と八（少陰）は静。極まったものは反対に転じます。")),
          qa(t("How is the changed hexagram formed?", "之卦如何得出？", "之卦はどうやって得ますか？"),
            t("Turn every moving line into its opposite — yang becomes yin, yin becomes yang — and leave the still lines as they are. The result is the changed hexagram.", "把所有动爻阴阳互变，静爻不变，所得即之卦。", "動爻の陰陽をすべて反転させ、静の爻はそのままにします。その結果が之卦です。")),
          qa(t("How many moving lines can a cast give?", "一次起卦能有几个动爻？", "一度の起卦で動爻はいくつ出ますか？"),
            t("Takashima’s method always gives exactly one. The classical 18-change method can give anywhere from none to six.", "高岛略筮法恒得一动爻。古法大衍十八变则零至六个不定。", "高島の略筮法では必ず一つです。古法の十八変では〇〜六と一定しません。")),
        ]),
        castLink(lang, t("Cast one and read only your moving line", "起一卦，只读你动的那一爻", "一卦立てて、動いた一爻だけを読みましょう")),
      ].join("");
    case "takashima-method":
      return [
        p(t("Takashima Kaemon (pen name Donshō, 1832–1914) was a Meiji-era businessman and the best-known I Ching scholar of modern Japan. In <i>Zōho Takashima Ekidan</i> he recommends the abbreviated three-change method for everyday use.",
          "高岛嘉右卫门（号呑象，1832–1914），明治时期实业家，近代日本最著名的易学家。其《増補高島易断》以三变略筮法为日常最宜。",
          "高島嘉右衛門（号は呑象、1832–1914）は明治の実業家で、近代日本で最も知られた易学者。『増補高島易断』で、日常には三変の略筮法が最も適すると説きます。")),
        `<ol class="points">`,
        `<li>${t("Take 50 stalks and set one aside; it stands for the Great Ultimate. 49 remain.", "取五十策，去一不用，象太极；余四十九。", "五十本から一本を除き太極とする。残り四十九本。")}</li>`,
        `<li>${t("Hold your matter in mind. At the moment of greatest focus, split the 49 into two bundles without aiming.", "默念所占之事，至诚之际随手分为二。", "占う事を念じ、至誠の極みで無心に二つに分ける。")}</li>`,
        `<li>${t("Take one stalk from the right bundle and hold it between the fingers of the left hand.", "自右手取一策挂于左手小指。", "右手の束から一本取り、左手の小指に挟む。")}</li>`,
        `<li>${t("Count the left bundle off in eights. The remainder (0–7) plus the held stalk gives 1–8: the Earlier Heaven number of the <b>lower</b> trigram.", "左手之策八八数之，余数加挂一之一策，得一至八，按先天数定<b>下卦</b>。", "左手の束を八本ずつ払い、余り（〇〜七）に小指の一本を加えて一〜八。先天数で<b>下卦</b>を定める。")}</li>`,
        `<li>${t("Do it again for the <b>upper</b> trigram.", "再分一次，定<b>上卦</b>。", "もう一度行い<b>上卦</b>を定める。")}</li>`,
        `<li>${t("A third time, count off in sixes: 1–6 gives the <b>moving line</b>.", "第三次六六数之，得一至六，定<b>动爻</b>。", "三回目は六本ずつ払い、一〜六で<b>動爻</b>を定める。")}</li></ol>`,
        `<h2>${t("One change in slow motion", "一变，慢动作", "一変をスローモーションで")}</h2>`,
        p(t("Every change uses the same hand movements. Here is one change slowed right down — the first two changes count in eights, the third in sixes; everything else is identical.",
          "每一变的手法都相同。把一变放慢来看——前两变八八数，第三变六六数，其余全同。",
          "どの変も手の動きは同じです。一変をゆっくり分解します――最初の二変は八本ずつ、三変目は六本ずつ数え、それ以外はまったく同じです。")),
        `<ol class="points">`,
        `<li>${t("<b>Gather all 49 stalks.</b> Each change starts again from the full 49 — the set-aside stalk stays aside for the whole cast.", "<b>集齐四十九策。</b>每一变都重新从完整的四十九策开始；去掉的那一策在整个起卦过程中始终不用。", "<b>四十九本を集める。</b>どの変も完全な四十九本から改めて始めます。除いた一本は起卦の間ずっと使いません。")}</li>`,
        `<li>${t("<b>Hold your matter in mind, then split.</b> At the moment of greatest focus, divide the 49 into two bundles with the right thumb, without aiming at any number.", "<b>默念所问，随手分二。</b>至诚专注之际，用右手拇指把四十九策分为两堆，不瞄着任何数字。", "<b>占う事を念じ、無心に分ける。</b>最も集中した瞬間に、右手の親指で四十九本を二つに分けます。数を狙ってはいけません。")}</li>`,
        `<li>${t("<b>Take one from the right bundle.</b> Hold it in the left hand — this is the “hung” stalk. It is the only part the right bundle plays in this method: its other stalks are not counted.", "<b>自右堆取一策。</b>挂于左手——这就是「挂一」。右堆在本法中只起这一个作用：其余的策并不数。", "<b>右の束から一本取る。</b>左手に挟みます。これが「掛一」です。右の束がこの方法で果たす役割はこれだけで、残りは数えません。")}</li>`,
        `<li>${t("<b>Count the left bundle off in eights.</b> Lay the groups of eight aside one by one until fewer than eight remain. (In the third change, count in sixes instead.)", "<b>左堆八八数之。</b>一组组八策放下，直到余下不足八策。（第三变改作六六数。）", "<b>左の束を八本ずつ数える。</b>八本の組を一つずつ脇に置き、八本未満が残るまで続けます。（三変目では六本ずつ。）")}</li>`,
        `<li>${t("<b>Note the remainder: 0 to 7.</b> If the bundle divides exactly, the remainder is 0 — that is a valid result, not a mistake.", "<b>记下余数：0 至 7。</b>若恰好数尽，余数为 0——这是有效结果，不是出错。", "<b>余りを記録する：〇〜七。</b>ちょうど割り切れたら余りは〇。それは誤りではなく、有効な結果です。")}</li>`,
        `<li>${t("<b>Add the hung stalk: remainder + 1.</b> The answer of this change is a number from 1 to 8 (in the third change, 1 to 6). Never use the remainder on its own.", "<b>加挂一：余数 + 1。</b>这一变的得数是 1 至 8（第三变为 1 至 6）。绝不能只用余数。", "<b>掛一を加える：余り＋1。</b>この変の答えは一〜八（三変目では一〜六）です。余りだけを使ってはいけません。")}</li>`,
        `<li>${t("<b>Look the number up.</b> In the first two changes it is an Earlier Heaven number and names a trigram — see " + L(lang, "the-eight-trigrams") + ". In the third change it names the moving line, counted from the bottom.", "<b>查这个数。</b>前两变中，它是先天数，对应一个三画卦——见" + L(lang, "the-eight-trigrams") + "。第三变中，它定动爻，自下而上数。", "<b>その数を引く。</b>最初の二変では先天数として一つの小成卦を定めます――" + L(lang, "the-eight-trigrams") + "参照。三変目では、下から数えた動爻を定めます。")}</li></ol>`,
        p(t("<b>Takashima’s own example.</b> Left-hand counts 21, 22, 16: 21 → remainder 5, +1 = 6 = Kan; 22 → remainder 6, +1 = 7 = Gen; 16 counted by sixes → remainder 4, +1 = 5. Kan below Gen is Meng, moving line 5, changing to Huan. It is the reading he made for his friend Fukuhara Minoru on his appointment as Governor of Okinawa.",
          "<b>高岛自己的占例。</b>左手 21、22、16 策：21 余 5 加 1 得 6 为坎；22 余 6 加 1 得 7 为艮；16 六六数之余 4 加 1 得 5。下坎上艮为蒙，动五爻，之涣。即高岛为友人福原实赴任冲绳县知事所占。",
          "<b>高島自身の占例。</b>左手 21・22・16 本：21 は余り 5 で＋1＝6、坎。22 は余り 6 で＋1＝7、艮。16 は六本ずつで余り 4、＋1＝5。下坎上艮で蒙、五爻動いて渙に之く。友人福原実の沖縄県知事赴任に際しての占いです。")),
        row(cap(fig(MENG, [4]), H(lang, MENG)), `<span class="arrow">→</span>`, cap(fig(59, [4]), H(lang, 59))),
        `<h2>${t("Three ways to cast, compared", "三种起卦法比较", "三つの起卦法の比較")}</h2>`,
        p(t("All three methods answer with one of the 64 hexagrams; they differ in how much work they take and in how the moving lines fall out.",
          "三种方法都得六十四卦之一，区别在手续繁简与动爻的出法。",
          "三つの方法はいずれも六十四卦の一つを返します。違いは手続きの手間と、動爻の出方です。")),
        `<table class="tbl"><thead><tr><th>${t("Method", "方法", "方法")}</th><th>${t("Operations", "操作次数", "操作回数")}</th><th>${t("Moving lines", "动爻", "動爻")}</th><th>${t("Used for", "适用", "用途")}</th></tr></thead><tbody>
<tr><td>${t("Three coins", "三钱法", "三銭法")}</td><td>${t("6 tosses, one for each line", "掷六次，每次成一爻", "六回投げ、一回ごとに一爻")}</td><td>${t("none to six", "零至六个", "〇〜六")}</td><td>${t("the common quick method today", "今日最常用的简便法", "今日最も一般的な簡便法")}</td></tr>
<tr><td>${t("Classical yarrow stalks (Dayan)", "大衍筮法（古法蓍筮）", "大衍筮法（古法の筮竹）")}</td><td>${t("18 changes, three for each line", "十八变，每爻三变", "十八変、一爻ごとに三変")}</td><td>${t("none to six", "零至六个", "〇〜六")}</td><td>${t("the full classical rite", "完整的古典仪式", "古典の正式な手順")}</td></tr>
<tr><td>${t("Takashima’s three changes", "高岛略筮（三变）", "高島の略筮（三変）")}</td><td>${t("3 operations: two give the trigrams, one the moving line", "三变：两变定上下卦，一变定动爻", "三変：二変で上下卦、一変で動爻")}</td><td>${t("exactly one", "恒为一爻", "必ず一つ")}</td><td>${t("everyday use, as Takashima recommends", "日常起卦，高岛所荐", "日常の起卦。高島の勧め")}</td></tr>
</tbody></table>`,
        p(t("Takashima keeps the yarrow stalks and the Earlier Heaven numbers of the classical rite, but compresses its 18 changes into 3. The shortcut has a fixed price: where the classical method lets the number of moving lines fall where it may — none to six — his method always gives exactly one, and the reading turns on that single line.",
          "高岛保留了古法的蓍草与先天数，只把十八变压缩为三变。简化的代价是固定的：古法动爻之数听其自然，零至六个不定；略筮则恒得一动爻，全卦的读法系于这一爻。",
          "高島は古法の筮竹と先天数を保ちながら、十八変を三変に圧縮しました。その代償は固定です。古法では動爻の数は〇〜六と自然に委ねられますが、略筮では必ず一つとなり、読みはその一爻に懸かります。")),
        faq([
          qa(t("Why are 49 stalks used, out of 50?", "五十策为何只用四十九？", "五十本のうち四十九本を使うのはなぜですか？"),
            t("One stalk is set aside and not used; it stands for the Great Ultimate. The remaining 49 are the ones divided and counted.", "去一策不用，象太极；所分所数的，是余下的四十九策。", "一本を除いて使わず、太極を象ります。分けて数えるのは残りの四十九本です。")),
          qa(t("Why count off in eights, and then in sixes?", "为何先八八数、后六六数？", "なぜ八本ずつ、次に六本ずつ数えるのですか？"),
            t("Eights because there are eight trigrams: the count gives an Earlier Heaven number from 1 to 8, which names a trigram. Sixes because a hexagram has six lines: the count gives 1 to 6, which names the moving line.", "八八数，因卦有八：得数一至八，按先天数定一卦。六六数，因一卦六爻：得数一至六，定动爻。", "八本ずつは、卦が八つあるからです。得られた一〜八の数が先天数として一卦を定めます。六本ずつは、一卦が六爻だからで、一〜六が動爻を定めます。")),
        ]),
        p(`<a class="btn" href="/${lang}/#cast=stalks">${esc(t("Split the stalks yourself", "亲手分筮竹起一卦", "自分で筮竹を分ける"))}</a>`),
      ].join("");
    case "worked-example":
      return workedExample(lang);
    case "how-to-read-the-text":
      return howToReadTheText(lang);
    case "related-hexagrams":
      return [
        p(t("Hexagrams come in families. Three relations are used constantly in commentary, Takashima’s included:", "卦与卦之间有亲缘。注家（包括高岛）常用三种关系：", "卦と卦には親戚関係があります。注釈（高島も含む）でよく使われる三つ：")),
        `<ul class="points">`,
        `<li>${t("<b>Inverse (综卦):</b> the hexagram turned upside down.", "<b>综卦：</b>把卦上下颠倒。", "<b>綜卦：</b>卦を上下逆さにしたもの。")}</li>`,
        `<li>${t("<b>Opposite (错卦):</b> every line changed.", "<b>错卦：</b>六爻阴阳全变。", "<b>錯卦：</b>六爻の陰陽をすべて変えたもの。")}</li>`,
        `<li>${t("<b>Nuclear (互卦):</b> lines 2–4 as the lower trigram and lines 3–5 as the upper: the hexagram hidden inside.", "<b>互卦：</b>取二至四爻为下卦、三至五爻为上卦，是卦中所藏之卦。", "<b>互卦：</b>二〜四爻を下卦、三〜五爻を上卦としたもの。卦の中に隠れた卦です。")}</li></ul>`,
        p(t("For Meng:", "以蒙卦为例：", "蒙の場合：")),
        row(cap(fig(MENG), H(lang, MENG)), cap(fig(r.inverse), `${esc(t("Inverse", "综卦", "綜卦"))}: ${H(lang, r.inverse)}`),
          cap(fig(r.opposite), `${esc(t("Opposite", "错卦", "錯卦"))}: ${H(lang, r.opposite)}`), cap(fig(r.nuclear), `${esc(t("Nuclear", "互卦", "互卦"))}: ${H(lang, r.nuclear)}`)),
        p(t("The traditional order of the 64 hexagrams pairs each one with its inverse; the eight that look the same upside down are paired with their opposite instead. Every hexagram page lists its relatives in the left column.",
          "通行卦序两两相配：多以综卦为对，上下颠倒仍不变的八卦则以错卦为对。每一卦页面的左栏都列出其亲缘卦。",
          "伝統的な卦の順序は二つずつ対になっており、多くは綜卦同士、上下逆さでも同じ八卦は錯卦同士です。各卦のページの左欄に親戚の卦を示しています。")),
        faq([
          qa(t("What is the inverse hexagram?", "什么是综卦？", "綜卦とは何ですか？"),
            t("The same hexagram turned upside down: its six lines read in reverse order.", "把卦上下颠倒：六爻次序整个反过来。", "卦を上下逆さにしたもの。六爻の順序が逆になります。")),
          qa(t("What is the nuclear hexagram?", "什么是互卦？", "互卦とは何ですか？"),
            t("The hexagram hidden inside: lines 2–4 taken as the lower trigram and lines 3–5 as the upper.", "卦中所藏之卦：取二至四爻为下卦、三至五爻为上卦。", "卦の中に隠れた卦です。二〜四爻を下卦、三〜五爻を上卦とします。")),
          qa(t("How are the 64 hexagrams paired in the traditional order?", "通行卦序如何配对？", "伝統的な卦の順序ではどう対になりますか？"),
            t("Each hexagram is paired with its inverse; the eight that look the same upside down are paired with their opposite instead.", "多以综卦为对；上下颠倒仍不变的八卦，则以错卦为对。", "多くは綜卦同士が対で、上下逆さでも同じ八卦は錯卦同士が対になります。")),
        ]),
        castLink(lang, t("Cast one and find its kin in the left column", "起一卦，在左栏找它的亲缘卦", "一卦立てて、左欄の関連卦を探してみましょう")),
      ].join("");
  }
  return "";
}

function workedExample(lang: Lang): string {
  const en = lang === "en", ja = lang === "ja";
  const t = (e: string, z: string, j: string) => (en ? e : ja ? j : z);
  const meng = getByNumber(MENG), huan = getByNumber(59);
  const jq = (n: number) => esc(lang === "en" ? LEGGE[String(n)].judgment : lang === "ja" ? TRAD[String(n)].judgment : getByNumber(n).judgment);
  const line5 = lang === "en" ? esc(LEGGE["4"].lines[4]) : lang === "ja" ? `六五。${esc(TRAD["4"].lines[4])}` : `六五：${esc(meng.lines[4])}`;
  const tkParas: string[] = EXCERPTS["4"]?.["4"]?.zh ?? [];
  const changeTable = (left: number, mod: number, result: string) => {
    const right = 49 - left, rem = left % mod, groups = Math.floor(left / mod);
    const head = [t("Item", "项目", "項目"), t("Count", "数目", "数")];
    const rows: [string, string][] = [
      [t("Stalks in play", "所用之策", "使う筮竹"), "49"],
      [t("Left bundle (the one counted)", "左手（天策，所数）", "左手の束（数える方）"), String(left)],
      [t("Right bundle (not counted)", "右手（地策，不数）", "右手の束（数えない）"), String(right)],
      [t("Taken from the right and hung", "自右取一挂一", "右から取り掛ける"), "1"],
      [t(`Counted off in ${mod === 8 ? "eights" : "sixes"}`, mod === 8 ? "八八数之" : "六六数之", mod === 8 ? "八本ずつ払う" : "六本ずつ払う"), `${left} = ${mod} × ${groups} + ${rem}`],
      [t("Remainder", "余数", "余り"), String(rem)],
      [t("Remainder + the hung stalk", "余数 + 挂一", "余り＋掛一"), `${rem} + 1 = ${rem + 1}`],
      [t("Result of this change", "本变得数", "この変の結果"), result],
    ];
    return `<table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</tbody></table>`;
  };
  const ex = (counts: string, steps: string[], result: string) =>
    `<p>${counts}</p><details><summary>${t("Show the answer", "看答案", "答えを見る")}</summary>${steps.map((s) => p(s)).join("")}${p(result)}</details>`;
  return [
    p(t("This page takes one real cast apart from the first stalk to the finished reading, slowly enough to follow with your own hands. The cast is Takashima’s own recorded example — the reading he made for his friend Fukuhara Minoru on his appointment as Governor of Okinawa. His three left-hand counts were <b>21, 22, 16</b>. If any step is unclear, the method itself is summarised in " + L(lang, "takashima-method") + ".",
      "这一页把一次真实的起卦从第一策拆到读完，慢到可以跟着亲手做。所用占例是高岛本人记录下来的那一次——他为友人福原实赴任冲绳县知事所占。三变的左手根数是 <b>21、22、16</b>。哪一步不清楚，方法本身见" + L(lang, "takashima-method") + "。",
      "このページでは、実際の起卦を最初の筮竹から読み終えるまで、手を動かしながら追える速さで分解します。題材は高島自身が記録した占例――友人・福原実の沖縄県知事赴任に際しての占いです。三変の左手の数は <b>21・22・16</b> でした。分からない手順があれば、方法そのものは" + L(lang, "takashima-method") + "にまとめてあります。")),
    `<h2>${t("Before the first split", "第一次分筮之前", "最初に分ける前に")}</h2>`,
    p(t("Lay out <b>50 stalks</b>. Set <b>one aside and do not use it</b>: it stands for the Great Ultimate. <b>49 stalks</b> are in play for every change. Settle on one matter, hold it silently in mind, and let go of wanting a particular answer — the preparation is part of the method, and this site’s home page walks through it before every cast.",
      "备好<b>五十策</b>。<b>取出一策不用</b>，象太极。每一变所用的都是<b>四十九策</b>。先定下一件事，默念于心，放下对某种结果的期待——准备功夫本身就是方法的一部分，本站首页在每次起卦前都会带你走一遍。",
      "<b>五十本</b>を用意します。<b>一本を取り分けて使わない</b>：太極を象ります。どの変でも使うのは<b>四十九本</b>です。一つの事を定め、心の中で静かに念じ、望む答えへの執着を手放してください――心の準備も方法の一部で、このサイトのホームでは起卦のたびにその手順を案内します。")),
    `<h2>${t("Change 1: the lower trigram", "第一变：下卦", "一変目：下卦")}</h2>`,
    p(t("Split the 49 without aiming. Suppose — as in Takashima’s cast — the left bundle comes to <b>21</b> and the right bundle to <b>28</b>. Take <b>one stalk from the right bundle</b> and hold it in your left hand. Then count the <b>left bundle only</b>, off in eights: 21 = 8 × 2 + 5, so the remainder is 5. In this abbreviated method the right bundle is never counted — beyond the one stalk taken from it, it plays no part. Add the hung stalk: 5 + 1 = <b>6</b>. Earlier Heaven number 6 is <b>Kan 坎</b>, water. That is the lower trigram.",
      "把四十九策随手分二。设如高岛此占，左手得 <b>21</b>，右手得 <b>28</b>。<b>自右手取一策</b>挂于左手。然后只数<b>左手</b>，八八数之：21 = 8 × 2 + 5，余 5。略筮法中右手之策从不计数——除取出的那一策外，它不起任何作用。加挂一：5 + 1 = <b>6</b>。先天数 6 为<b>坎</b>，象水。此为下卦。",
      "四十九本を無心に分けます。高島の占いのように、左の束が <b>21</b> 本、右の束が <b>28</b> 本だったとします。<b>右の束から一本</b>を取り、左手に挟みます。次に<b>左の束だけ</b>を八本ずつ数えます：21 ＝ 8 × 2 ＋ 5 で、余りは 5。この略筮法では右の束は決して数えません――取り出した一本を除けば、役割はありません。掛一を加えます：5 ＋ 1 ＝ <b>6</b>。先天数 6 は<b>坎</b>、水の象。これが下卦です。")),
    changeTable(21, 8, t("Earlier Heaven 6 → Kan 坎, the lower trigram", "先天数 6 → 坎，为下卦", "先天数 6 → 坎、下卦")),
    row(cap(figure([...T.trigrams["坎"]]), t("Lower trigram: Kan 坎 — water", "下卦：坎——水", "下卦：坎――水"))),
    `<table class="tbl"><thead><tr><th>${t("Earlier Heaven number", "先天数", "先天数")}</th><th>${t("Trigram", "卦", "卦")}</th><th>${t("Image", "象", "象")}</th></tr></thead><tbody>` +
      [6, 7].map((n) => { const tr = ORDER[n - 1]; return `<tr><td>${n}</td><td><a href="${trigramPath(lang, tr)}">${esc(trigramTitle(lang, tr))}</a></td><td>${esc(lang === "en" ? T.trigram_en[tr][1] : lang === "ja" ? T.trigram_ja[tr][2] : T.nature[tr])}</td></tr>`; }).join("") +
      `</tbody></table>`,
    p(t("Only the two numbers that occur in this cast are listed here; the full table of eight is in " + L(lang, "the-eight-trigrams") + ".",
      "这里只列本占出现的两个数；八卦全表见" + L(lang, "the-eight-trigrams") + "。",
      "ここにはこの占いで出た二つの数だけを挙げます。八つの全体表は" + L(lang, "the-eight-trigrams") + "にあります。")),
    `<h2>${t("Change 2: the upper trigram", "第二变：上卦", "二変目：上卦")}</h2>`,
    p(t("Gather the 49 again — every change starts from the full set. Split without aiming; this time the left bundle is <b>22</b> (right bundle 27). Take one from the right, count the left in eights: 22 = 8 × 2 + 6, remainder 6, plus the hung stalk = <b>7</b>. Earlier Heaven 7 is <b>Gen 艮</b>, mountain — the upper trigram. Kan below and Gen above: the hexagram is complete, and it is " + H(lang, MENG) + ".",
      "重新集齐四十九策——每一变都从全数开始。随手分二，这次左手得 <b>22</b>（右手 27）。自右取一，左手八八数之：22 = 8 × 2 + 6，余 6，加挂一 = <b>7</b>。先天数 7 为<b>艮</b>，象山——上卦。下坎上艮，卦已成形，即" + H(lang, MENG) + "。",
      "四十九本を再び集めます――どの変も全数から始めます。無心に分けると、今度は左の束が <b>22</b> 本（右は 27 本）。右から一本取り、左を八本ずつ数えます：22 ＝ 8 × 2 ＋ 6、余り 6、掛一を加えて <b>7</b>。先天数 7 は<b>艮</b>、山の象――上卦です。下に坎、上に艮で卦が完成しました。" + H(lang, MENG) + "です。")),
    changeTable(22, 8, t("Earlier Heaven 7 → Gen 艮, the upper trigram", "先天数 7 → 艮，为上卦", "先天数 7 → 艮、上卦")),
    row(cap(fig(MENG), H(lang, MENG))),
    `<h2>${t("Change 3: the moving line", "第三变：动爻", "三変目：動爻")}</h2>`,
    p(t("Gather the 49 a third time and split; the left bundle is <b>16</b> (right bundle 33). Take one from the right as before, but now count the left bundle <b>in sixes</b>, because a hexagram has six lines: 16 = 6 × 2 + 4, remainder 4, plus the hung stalk = <b>5</b>. The moving line is <b>line 5</b>, counted from the bottom. Flip that one line — in Meng it is yin, so it becomes yang — and the hexagram changes into " + H(lang, 59) + ".",
      "第三次集齐四十九策分二，左手得 <b>16</b>（右手 33）。照例自右取一，但这次左手<b>六六数之</b>，因一卦有六爻：16 = 6 × 2 + 4，余 4，加挂一 = <b>5</b>。动爻为<b>第五爻</b>，自下而上数。把这一爻翻转——蒙卦五爻为阴，变为阳——卦即变为" + H(lang, 59) + "。",
      "三度目に四十九本を集めて分けると、左の束は <b>16</b> 本（右は 33 本）。同じく右から一本取りますが、今度は左の束を<b>六本ずつ</b>数えます。一卦は六爻だからです：16 ＝ 6 × 2 ＋ 4、余り 4、掛一を加えて <b>5</b>。動爻は下から数えて<b>五爻</b>です。その一爻を反転させます――蒙の五爻は陰なので陽になります――すると卦は" + H(lang, 59) + "に変わります。")),
    changeTable(16, 6, t("Line 5 moves", "第五爻动", "五爻が動く")),
    row(cap(fig(MENG, [4]), H(lang, MENG)), `<span class="arrow">→</span>`, cap(fig(59, [4]), H(lang, 59))),
    `<h2>${t("Reading this cast, in order", "按顺序读这一卦", "この卦を順序どおりに読む")}</h2>`,
    p(t("Takashima’s method gives exactly one moving line, and the reading has a fixed order: <b>the judgment, then the moving line, then the changed hexagram</b> as background. Here is that order applied to the cast you have just built. How to read each piece of text — its picture, its verdict words, how they connect — is its own lesson: " + L(lang, "how-to-read-the-text") + ".",
      "高岛略筮恒得一动爻，读法次序固定：<b>先卦辞，次动爻，再以之卦为参照</b>。下面就把这个次序用到刚刚起成的这一卦上。经文本身怎么读——象、断语、二者的连接——另有一课：" + L(lang, "how-to-read-the-text") + "。",
      "高島の略筮では動爻は必ず一つで、読む順序は決まっています：<b>まず卦辞、次に動爻、最後に之卦を参考として</b>。その順序を、今立てたばかりのこの卦に当てはめます。経文そのものの読み方――絵・断語・そのつながり――は別の課です：" + L(lang, "how-to-read-the-text") + "。")),
    `<h3>${t("Step 1 — the judgment of Meng", "第一步——蒙卦卦辞", "第一歩――蒙の卦辞")}</h3>`,
    `<blockquote class="text">${jq(4)}</blockquote>`,
    p(t("The judgment speaks for the whole situation: a beginner who comes sincerely to be taught will be taught; one who keeps asking again and again will not. Keep that sentence in mind — it returns in the common mistakes below.",
      "卦辞总说全卦之势：诚心来求教的初学者，会得到教导；一再追问的，则不会。记住这句话——它在下面的常见错误里还会出现。",
      "卦辞は状況全体を述べます。誠実に教えを請う初心者は教えられますが、何度も問い直す者は教えられません。この一文を覚えておいてください――下の「よくある間違い」に再び登場します。")),
    `<h3>${t("Step 2 — the moving line: Meng, line 5", "第二步——动爻：蒙卦六五", "第二歩――動爻：蒙の六五")}</h3>`,
    `<blockquote class="text">${line5}</blockquote>`,
    p(t(`This is the line the whole reading turns on, and it has a page of its own: <a href="${linePath(lang, MENG, 4)}">Meng, line 5</a>. Structurally it is a yin line in a yang place (out of place), but it is central — the middle of the upper trigram, the ruler’s place — and it answers the strong yang line 2 below it. Takashima reads it as a young ruler who knows his own inexperience and trusts a worthy minister.`,
      `全卦的读法系于这一爻，它有自己的页面：<a href="${linePath(lang, MENG, 4)}">蒙卦六五</a>。从结构看，它是阴爻居阳位（不当位），但得中——居上卦之中、君位——且下应刚健的九二。高岛释之为：幼主自知年少，信任贤臣。`,
      `読み全体が懸かるのはこの爻で、専用のページがあります：<a href="${linePath(lang, MENG, 4)}">蒙・六五</a>。構造上は陰爻が陽位にあって位を得ませんが、中を得ており――上卦の真ん中、君の位です――下の剛健な九二と応じます。高島はこれを、若い君主が自らの未熟さを知り、賢臣を信任する象と読みます。`)),
    ...(tkParas.length ? [
      `<h3>${t("What Takashima himself wrote on this line", "高岛本人对此爻的原注", "高島自身によるこの爻への注")}</h3>`,
      ...(lang === "zh" ? [] : [p(t("The commentary is shown in its original Chinese text, as elsewhere on this site.", "原注以汉文原文呈现，与本站其他页面同例。", "解釈は他のページと同様、漢文の原文で示します。"))]),
      ...tkParas.slice(0, 2).map((para) => `<p lang="zh">${esc(para)}</p>`),
    ] : []),
    `<h3>${t("Step 3 — the changed hexagram: Huan", "第三步——之卦：涣", "第三歩――之卦：渙")}</h3>`,
    `<blockquote class="text">${jq(59)}</blockquote>`,
    p(t("Read the changed hexagram last and lightly: it is the background the situation moves toward — here, dispersion giving way to a gathering around a centre — not a second answer competing with the first. The full page is " + H(lang, 59) + ".",
      "之卦最后读、轻轻读：它是事情趋向的背景——此处是涣散之后向中心凝聚——而不是与本卦竞争的第二个答案。全文见" + H(lang, 59) + "。",
      "之卦は最後に、軽く読みます。事が向かう先の背景――ここでは散らかったものが中心へ集まっていく流れ――であり、本卦と競う第二の答えではありません。全文は" + H(lang, 59) + "にあります。")),
    p(t("<b>The case.</b> Fukuhara Minoru was about to take up his post as Governor of Okinawa — a young official, in effect, going to govern a place new to him. Takashima’s reading turned on line 5: govern as the “simple lad” of the line, by trusting and listening to the experienced people under him, and it will go well. Whether you believe the reading or not, notice its shape: one hexagram, one line, one plain piece of counsel drawn from the text.",
      "<b>占例本身。</b>福原实当时正要赴任冲绳县知事——实际上是一位年轻官员，去治理一个对他全然陌生的地方。高岛的断语系于五爻：以爻辞中「童蒙」的姿态施政，信任并倾听手下有经验的人，便会顺利。信与不信在你，但请留意它的形态：一卦、一爻、一句从经文里得出的朴素劝告。",
      "<b>占例そのもの。</b>福原実は沖縄県知事に赴任するところでした――実質的には、初めての土地を治める若い官吏です。高島の読みは五爻に懸かりました。爻辞の「童蒙」の姿勢で政を行い、経験ある部下を信任して耳を傾ければ、うまくいく。信じるかどうかは別として、その形に注目してください。一卦、一爻、経文から得た一つの素直な助言です。")),
    `<h2>${t("Practice: three casts to work out yourself", "练习：自己算三卦", "練習：自分で三つの卦を立ててみる")}</h2>`,
    p(t("For each cast you are given the three left-hand counts, exactly as a caster would record them. Work out the hexagram, the moving line and the changed hexagram before opening the answer. All three answers were produced by this site’s own casting engine.",
      "每题给出三个左手根数，正如起卦者所记录的。先自己算出本卦、动爻与之卦，再打开答案。三个答案均由本站自己的起卦引擎算出。",
      "各問では、起卦者が記録する通りの左手の数を三つ示します。答えを開く前に、本卦・動爻・之卦を自分で出してください。三つの答えはいずれもこのサイト自身の起卦エンジンで算出しました。")),
    `<h3>${t("Exercise 1", "练习一", "練習一")}</h3>`,
    ex(t("Left-hand counts: <b>10, 17, 23</b>.", "左手根数：<b>10、17、23</b>。", "左手の数：<b>10・17・23</b>。"),
      [t("Change 1: 10 = 8 × 1 + 2, remainder 2, + 1 = 3 → Earlier Heaven 3 is Li 離, the lower trigram.", "第一变：10 = 8 × 1 + 2，余 2，加 1 = 3 → 先天数 3 为离，下卦。", "一変目：10 ＝ 8 × 1 ＋ 2、余り 2、＋1 ＝ 3 → 先天数 3 は離、下卦。"),
       t("Change 2: 17 = 8 × 2 + 1, remainder 1, + 1 = 2 → Earlier Heaven 2 is Dui 兌, the upper trigram. Dui over Li is " + H(lang, 49) + ".", "第二变：17 = 8 × 2 + 1，余 1，加 1 = 2 → 先天数 2 为兑，上卦。下离上兑为" + H(lang, 49) + "。", "二変目：17 ＝ 8 × 2 ＋ 1、余り 1、＋1 ＝ 2 → 先天数 2 は兌、上卦。下に離、上に兌で" + H(lang, 49) + "。"),
       t("Change 3: 23 = 6 × 3 + 5, remainder 5, + 1 = 6 → line 6 moves.", "第三变：23 = 6 × 3 + 5，余 5，加 1 = 6 → 上爻动。", "三変目：23 ＝ 6 × 3 ＋ 5、余り 5、＋1 ＝ 6 → 上爻が動く。")],
      t(`Result: <b>${esc(hexTitle(lang, 49))}</b>, <a href="${linePath(lang, 49, 5)}">line 6 moving</a>, changing to <b>${esc(hexTitle(lang, 13))}</b> — ${H(lang, 13)}.`, `结果：<b>${esc(hexTitle(lang, 49))}</b>，<a href="${linePath(lang, 49, 5)}">上爻动</a>，之<b>${esc(hexTitle(lang, 13))}</b>——${H(lang, 13)}。`, `結果：<b>${esc(hexTitle(lang, 49))}</b>、<a href="${linePath(lang, 49, 5)}">上爻が動き</a>、之卦は<b>${esc(hexTitle(lang, 13))}</b>――${H(lang, 13)}。`)),
    `<h3>${t("Exercise 2", "练习二", "練習二")}</h3>`,
    ex(t("Left-hand counts: <b>40, 8, 12</b>. Watch the remainders on this one.", "左手根数：<b>40、8、12</b>。这一题请特别留意余数。", "左手の数：<b>40・8・12</b>。この問では余りに注意してください。"),
      [t("Change 1: 40 = 8 × 5 + 0, remainder 0, + 1 = 1 → Earlier Heaven 1 is Qian 乾, the lower trigram. A remainder of 0 is valid: it is the +1 that turns it into a usable number.", "第一变：40 = 8 × 5 + 0，余 0，加 1 = 1 → 先天数 1 为乾，下卦。余 0 是有效的：正是那 +1 把它变成可用的数。", "一変目：40 ＝ 8 × 5 ＋ 0、余り 0、＋1 ＝ 1 → 先天数 1 は乾、下卦。余り 0 は有効です。その＋1 が使える数に変えます。"),
       t("Change 2: 8 = 8 × 1 + 0, remainder 0, + 1 = 1 → Qian 乾 again, the upper trigram. Qian over Qian is " + H(lang, 1) + ".", "第二变：8 = 8 × 1 + 0，余 0，加 1 = 1 → 仍为乾，上卦。下乾上乾为" + H(lang, 1) + "。", "二変目：8 ＝ 8 × 1 ＋ 0、余り 0、＋1 ＝ 1 → 再び乾、上卦。下も上も乾で" + H(lang, 1) + "。"),
       t("Change 3: 12 = 6 × 2 + 0, remainder 0, + 1 = 1 → line 1 moves.", "第三变：12 = 6 × 2 + 0，余 0，加 1 = 1 → 初爻动。", "三変目：12 ＝ 6 × 2 ＋ 0、余り 0、＋1 ＝ 1 → 初爻が動く。")],
      t(`Result: <b>${esc(hexTitle(lang, 1))}</b>, <a href="${linePath(lang, 1, 0)}">line 1 moving</a>, changing to <b>${esc(hexTitle(lang, 44))}</b> — ${H(lang, 44)}.`, `结果：<b>${esc(hexTitle(lang, 1))}</b>，<a href="${linePath(lang, 1, 0)}">初爻动</a>，之<b>${esc(hexTitle(lang, 44))}</b>——${H(lang, 44)}。`, `結果：<b>${esc(hexTitle(lang, 1))}</b>、<a href="${linePath(lang, 1, 0)}">初爻が動き</a>、之卦は<b>${esc(hexTitle(lang, 44))}</b>――${H(lang, 44)}。`)),
    `<h3>${t("Exercise 3", "练习三", "練習三")}</h3>`,
    ex(t("Left-hand counts: <b>27, 35, 20</b>.", "左手根数：<b>27、35、20</b>。", "左手の数：<b>27・35・20</b>。"),
      [t("Change 1: 27 = 8 × 3 + 3, remainder 3, + 1 = 4 → Earlier Heaven 4 is Zhen 震, the lower trigram.", "第一变：27 = 8 × 3 + 3，余 3，加 1 = 4 → 先天数 4 为震，下卦。", "一変目：27 ＝ 8 × 3 ＋ 3、余り 3、＋1 ＝ 4 → 先天数 4 は震、下卦。"),
       t("Change 2: 35 = 8 × 4 + 3, remainder 3, + 1 = 4 → Zhen 震 again, the upper trigram. Zhen over Zhen is " + H(lang, 51) + ".", "第二变：35 = 8 × 4 + 3，余 3，加 1 = 4 → 仍为震，上卦。下震上震为" + H(lang, 51) + "。", "二変目：35 ＝ 8 × 4 ＋ 3、余り 3、＋1 ＝ 4 → 再び震、上卦。下も上も震で" + H(lang, 51) + "。"),
       t("Change 3: 20 = 6 × 3 + 2, remainder 2, + 1 = 3 → line 3 moves.", "第三变：20 = 6 × 3 + 2，余 2，加 1 = 3 → 三爻动。", "三変目：20 ＝ 6 × 3 ＋ 2、余り 2、＋1 ＝ 3 → 三爻が動く。")],
      t(`Result: <b>${esc(hexTitle(lang, 51))}</b>, <a href="${linePath(lang, 51, 2)}">line 3 moving</a>, changing to <b>${esc(hexTitle(lang, 55))}</b> — ${H(lang, 55)}.`, `结果：<b>${esc(hexTitle(lang, 51))}</b>，<a href="${linePath(lang, 51, 2)}">三爻动</a>，之<b>${esc(hexTitle(lang, 55))}</b>——${H(lang, 55)}。`, `結果：<b>${esc(hexTitle(lang, 51))}</b>、<a href="${linePath(lang, 51, 2)}">三爻が動き</a>、之卦は<b>${esc(hexTitle(lang, 55))}</b>――${H(lang, 55)}。`)),
    `<h2>${t("Common mistakes", "常见错误", "よくある間違い")}</h2>`,
    `<ul class="points">`,
    `<li>${t("<b>Aiming the split.</b> Trying to split at a “lucky” place, or deliberating over the bundles, breaks the method at its root: the split is made at the moment of greatest focus, without deliberation. If you caught yourself aiming, that cast is spent — but see the last mistake before casting again.", "<b>分筮时瞄着分。</b>想分在「吉利」的位置，或对着两堆迟疑斟酌，是从根本上破坏方法：分筮要在至诚专注之际随手为之，不加思量。若发现自己在瞄，这一卦已经作废——但再起之前，先看最后一条。", "<b>狙って分ける。</b>「縁起の良い」場所で分けようとしたり、束の前で迷ったりすると、方法の根幹が崩れます。分けるのは最も集中した瞬間に、無心で。狙ってしまったらその起卦は無効です――ただし、もう一度立てる前に最後の項目を見てください。")}</li>`,
    `<li>${t("<b>Forgetting the hung stalk.</b> The remainder alone is never the answer: 0–7 becomes 1–8 only after adding the stalk you took from the right bundle. Skip the +1 and every trigram shifts by one.", "<b>忘记挂一。</b>余数本身永远不是答案：0–7 必须加上自右堆取出的那一策，才成为 1–8。漏掉这个 +1，每一卦都会错位一格。", "<b>掛一を忘れる。</b>余りだけが答えになることは決してありません。〇〜七は、右の束から取った一本を加えて初めて一〜八になります。＋1 を省くと、すべての卦が一つずつずれます。")}</li>`,
    `<li>${t("<b>Counting the right bundle.</b> In this abbreviated method only the left bundle is counted; the right bundle contributes exactly one stalk. Counting both is the classical rite’s business, not this one’s.", "<b>去数右手。</b>略筮法中只数左手；右手只贡献一策。两堆都数是古法大衍的事，不是本法的。", "<b>右の束を数える。</b>この略筮法で数えるのは左の束だけです。右の束の寄与はちょうど一本。両方を数えるのは古法の大衍の仕事で、この方法の仕事ではありません。")}</li>`,
    `<li>${t("<b>Building the hexagram top-down.</b> The first change gives the <i>lower</i> trigram and the second the <i>upper</i>; lines are counted from the bottom. Swap the trigrams and you are reading a different hexagram — Meng with Gen below and Kan above would be Jian, not Meng.", "<b>自上而下成卦。</b>第一变成<i>下</i>卦，第二变成<i>上</i>卦；爻自下而上数。上下易位，读的就是另一卦——下艮上坎是蹇，不是蒙。", "<b>卦を上から組み立てる。</b>一変目は<i>下</i>卦、二変目は<i>上</i>卦を定め、爻は下から数えます。上下を入れ替えれば別の卦を読んでいることになります――下が艮、上が坎なら蹇であって、蒙ではありません。")}</li>`,
    `<li>${t("<b>Reading all six lines.</b> A Takashima cast has exactly one moving line; that line, with the judgment, carries the reading. Weighing all six line texts equally dissolves the answer into noise.", "<b>六爻全读。</b>高岛略筮恒得一动爻；这一爻连同卦辞，才是读法的重心。六条爻辞等量齐观，答案就散成了噪声。", "<b>六爻すべてを読む。</b>高島の起卦で動爻はちょうど一つ。その爻と卦辞が読みの中心です。六つの爻辞を同じ重みで読めば、答えは雑音に溶けてしまいます。")}</li>`,
    `<li>${t("<b>Casting again because you dislike the answer.</b> Meng’s own judgment answers this one: at the first casting you are instructed; a second and third application is troublesome, and the troublesome are not instructed. Ask once, about one matter, and sit with what you get.", "<b>不喜欢答案就再起一卦。</b>蒙卦卦辞本身就回答了这一点：初筮则告，再三则渎，渎则不告。一事只问一次，然后静下心来面对所得。", "<b>答えが気に入らず、もう一度立てる。</b>蒙の卦辞そのものがこれに答えています。最初の起卦では教えられますが、二度三度と重ねれば瀆（けが）れとなり、教えられません。一つの事は一度だけ問い、得たものと向き合ってください。")}</li></ul>`,
    `<h2>${t("You can do this now", "现在你已经能做到", "もうできること")}</h2>`,
    `<ul class="points">`,
    `<li>${t("Prepare 50 stalks, set one aside, and work with 49.", "备五十策，去一不用，用四十九。", "五十本を用意し、一本を除いて四十九本で進める。")}</li>`,
    `<li>${t("Split without aiming, take one from the right, and count the left bundle — in eights, in eights, then in sixes.", "随手分二，自右取一，只数左手——八八、八八、六六。", "無心に分け、右から一本取り、左の束を数える――八ずつ、八ずつ、六ずつ。")}</li>`,
    `<li>${t("Turn each result into a trigram or a line by adding the hung stalk, and build the hexagram from the bottom up.", "每变得数都加挂一，译成卦或爻，自下而上成卦。", "各変の結果に掛一を加えて卦や爻に直し、下から上へ卦を組み立てる。")}</li>`,
    `<li>${t("Read in order: judgment, the one moving line, then the changed hexagram as background.", "按次序读：卦辞、唯一的动爻、之卦为参照。", "順序どおりに読む：卦辞、唯一の動爻、之卦は参考。")}</li></ul>`,
    p(t("That is the whole method. The summary is in " + L(lang, "takashima-method") + "; when you are ready, do a real cast and let the site count alongside you:",
      "方法全体就是这些。提要见" + L(lang, "takashima-method") + "；准备好了，就亲手起一卦，让本站陪你一起数：",
      "方法の全体はこれだけです。要約は" + L(lang, "takashima-method") + "にあります。準備ができたら、実際に起卦して、サイトに一緒に数えさせてください：")),
    p(`<a class="btn" href="/${lang}/#cast">${esc(t("Cast a hexagram now", "现在起一卦", "今すぐ卦を立てる"))}</a>`),
  ].join("");
}

function howToReadTheText(lang: Lang): string {
  const en = lang === "en", ja = lang === "ja";
  const t = (e: string, z: string, j: string) => (en ? e : ja ? j : z);
  const qa = (q: string, a: string) => `<h3>${q}</h3>${p(a)}`;
  const faq = (items: string[]) => [`<h2>${t("Frequently asked questions", "常见问题", "よくある質問")}</h2>`, ...items].join("");
  // The classic text quoted from the site's own data: Legge for English, the traditional-character text for Japanese, the received text for Chinese.
  const lineText = (n: number, idx: number, name: string) =>
    en ? esc(LEGGE[String(n)].lines[idx]) : ja ? `${name}。${esc(TRAD[String(n)].lines[idx])}` : `${name}：${esc(getByNumber(n).lines[idx])}`;
  const verdictTable = () => {
    const rows: [string, string, string][] = en ? [
      ["亨", "smooth going", "the way is open; things flow without obstruction"],
      ["吉", "auspicious", "favorable to the matter at hand"],
      ["元吉", "greatly auspicious", "the strongest favorable verdict"],
      ["利贞", "favorable to persevere", "holding steady is the advantage"],
      ["咎", "blame", "fault attaches; 无咎, “no blame”, often follows a warning and marks the way out"],
      ["厉", "danger", "precarious but avoidable; often paired with its way out: 厉，无咎 — “danger, yet no blame”"],
      ["悔", "remorse", "distress from a misstep; 悔亡, “the remorse fades”, when you correct course"],
      ["吝", "regret", "embarrassment from hesitation; lighter than 厉"],
      ["凶", "inauspicious", "unfavorable to the matter at hand"],
    ] : ja ? [
      ["亨（こう）", "とおる", "道が開け、物事が阻害なく運ぶ"],
      ["吉（きち）", "よし", "その事にとって順"],
      ["元吉（げんきち）", "大いに吉", "最も強い吉の断語"],
      ["利貞（りてい）", "守るに利あり", "保つことが利になる"],
      ["咎（とが）", "とが", "无咎（とがなし）は戒めののちに置かれ、出路を示すことが多い"],
      ["厲（あやうし）", "あやうし", "危ないが避けられる。厲，无咎（危ういがとがなし）と併記されやすい"],
      ["悔（くい）", "くい", "誤りからの懊悩。悔亡（くいが消える）は軌道修正のとき"],
      ["吝（りん）", "こん", "ためらいからの恥。厲より軽い"],
      ["凶（きょう）", "わるし", "その事にとって逆"],
    ] : [
      ["亨", "通畅", "道路敞开，事情没有阻隔地运行"],
      ["吉", "有利", "对所占之事为顺"],
      ["元吉", "大吉", "吉中最强的断语"],
      ["利贞", "宜于守正", "持守不躁为利"],
      ["咎", "灾殃", "「无咎」即无灾；经文常先加戒惧，再以无咎示出路"],
      ["厉", "危险", "形势不稳但可避免；常与出路连言：厉，无咎"],
      ["悔", "追悔", "一步走错带来的憾恨；改辙则「悔亡」"],
      ["吝", "羞吝", "迟疑不决所致的难堪，较厉为轻"],
      ["凶", "不利", "对所占之事为逆"],
    ];
    const head = { en: ["Word", "Meaning", "Note"], zh: ["断语", "义", "注"], ja: ["断語", "意味", "注"] }[lang];
    return `<table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}</tbody></table>`;
  };
  const top = linePath(lang, MENG, 5), tai3 = linePath(lang, 11, 2);
  return [
    p(t("The classic text is terse. Each judgment and each line text does two things: it <b>pictures</b> a situation, and it <b>names its quality</b>. The picture is built from the hexagram’s own structure — which trigrams meet, where the line stands, what it touches. Read the picture first; the verdict hangs on it.",
      "经文极简。卦辞与爻辞各做两件事：<b>画出</b>一个处境，<b>说出</b>它的性质。画面取自卦体本身——哪两个卦相遇、此爻居于何位、与谁相接。先读象；断语挂在象上。",
      "経文はきわめて簡潔です。卦辞も爻辞も、二つのことをします：<b>状況を絵として描き</b>、<b>その性質を名指す</b>こと。絵の材料は卦そのもの――どの卦と卦が重なり、爻がどこに立ち、何に接しているか。まず絵を読みます。断語はその絵に掛かっています。")),
    p(t("The quality is named in a small verdict vocabulary, met over and over across all 64 hexagrams. Learn it once and every page of this site opens:",
      "性质由一套很小的断语词汇说出，六十四卦中反复出现。记一次，本站每一页都为你打开：",
      "性質は小さな断語の語彙で名指されます。六十四卦を通じて繰り返し現れる語ばかりです。一度覚えれば、このサイトのどのページも開けます。")),
    verdictTable(),
    `<h2>${t("How to read a line, in four steps", "读一条爻辞，四步", "一爻を四歩で読む")}</h2>`,
    `<ol class="points">`,
    `<li>${t("<b>Find the picture.</b> Ask what scene the text paints. The scene comes from the hexagram’s structure: the two trigrams meeting, the place the line stands in, the lines it touches.",
      "<b>找象。</b>先问这句经文画的是什么场景。场景取自卦体：哪两个卦相遇，此爻居什么位，与谁相接。",
      "<b>絵を見つける。</b>まず、この経文はどんな場面を描いているのかを問います。場面の材料は卦そのもの：どの卦と卦が重なり、この爻がどこに立ち、何に接しているか。")}</li>`,
    `<li>${t("<b>Find the verdict.</b> Which word from the table appears — and is it plain (吉) or qualified (厉，无咎 — “danger, yet no blame”)? A qualified verdict carries its way out inside it; the condition is the teaching.",
      "<b>找断。</b>看上表哪个词出现了；是直言（吉），还是带条件的断（厉，无咎——虽危而可免）？带条件的断语把出路写进了断语里，条件本身就是教导。",
      "<b>断語を見つける。</b>上の表のどの語が出たか。断定（吉）か、条件つき（厲，无咎――危ういがとがなし）か。条件つきの断語は出路を断語の中に含んでおり、その条件こそが教えです。")}</li>`,
    `<li>${t("<b>Connect picture and verdict.</b> Ask why this verdict follows this picture. That connection is the point of the line; once you can say it in one sentence, the line is yours.",
      "<b>连起来。</b>问为什么此象得此断。一问一答之间就是这一爻的道理；能用一句话说明白，这一爻就是你的了。",
      "<b>絵と断語をつなぐ。</b>なぜこの絵にこの断語が続くのかを問います。このつながりこそがその爻の言葉です。一文で言い表せたら、その爻はあなたのものです。")}</li>`,
    `<li>${t("<b>Set it in place.</b> Re-read the line against its position and partners — proper place, centrality, correspondence, as in " + L(lang, "lines-and-positions") + " — and against the judgment of the whole hexagram.",
      "<b>放回爻位。</b>结合爻位与应与再读一遍——当位、得中、有应，见" + L(lang, "lines-and-positions") + "——并结合全卦卦辞。",
      "<b>位に置いて読む。</b>爻の位置と応爻に照らして――当位・中・応については" + L(lang, "lines-and-positions") + "参照――そして卦全体の卦辞に照らして、もう一度読みます。")}</li></ol>`,
    `<h2>${t("Two lines read through", "两条爻辞的完整走查", "二つの爻を読み通す")}</h2>`,
    `<h3>${t("Example 1 — Meng, top line (上九)", "例一——蒙卦上九", "例一――蒙・上九")}</h3>`,
    row(cap(fig(MENG, [5]), `<a href="${top}">${esc(t("Meng, top line (上九)", "蒙卦上九", "蒙・上九"))}</a>`)),
    `<blockquote class="text">${lineText(MENG, 5, t("Shang Jiu", "上九", "上九"))}</blockquote>`,
    p(t(`Step 1, the picture: 击蒙 — force applied to ignorance, striking the uncomprehending. Step 2, the verdicts: two of them, split by posture — 为寇, acting as a bandit, is <i>unfavorable</i>; 御寇, warding off bandits, is <i>favorable</i>. Step 3, the connection: the same force helps or harms depending on whether it imposes or protects — only defensive force clears ignorance; forcing people just breeds resistance. Step 4, in place: the top line is the extreme, where instruction has run its course, which is why the line’s only remaining tool is force, and why its verdict is conditional. One sentence, and the line is yours: <b>when words no longer reach someone, protect rather than compel</b>.`,
      `第一步找象：击蒙——以力开蒙，击其不悟。第二步找断：断语有二，随姿态而分——为寇（强加于人）则<i>不利</i>，御寇（护其所守）则<i>利</i>。第三步连起来：同样是用力，强加则激其抗拒，护持则开其蒙昧；唯防御之力能启蒙。第四步放回爻位：上爻居极，教化至此已穷，故此爻所用的只剩力，而其断语是有条件的。一句话：<b>言语达不到时，护而不迫</b>。`,
      `第一歩、絵：擊蒙――蒙昧に力を加えること。第二歩、断語：二つあり、姿勢で分かれます――為寇（寇のように攻める）は<i>不利</i>、禦寇（寇を防ぐ）は<i>利</i>。第三歩、つなぐ：同じ力でも、押しつければ抵抗を生み、守れば蒙を開く。防衛の力だけが蒙昧を開きます。第四歩、位：上爻は極みで、教化はここまで。だから残る道具は力だけとなり、断語は条件つきです。一文にすれば：<b>言葉が届かないときは、迫るより守る</b>。`)),
    `<h3>${t("Example 2 — Tai, line 3 (九三)", "例二——泰卦九三", "例二――泰・九三")}</h3>`,
    row(cap(fig(11, [2]), `<a href="${tai3}">${esc(t("Tai, line 3 (九三)", "泰卦九三", "泰・九三"))}</a>`)),
    `<blockquote class="text">${lineText(11, 2, t("Jiu San", "九三", "九三"))}</blockquote>`,
    p(t(`Step 1, the picture: 无平不陂，无往不复 — no plain without a slope, no going without returning: the turning point where prosperity begins to lean. Step 2, the verdict: 无咎, no blame — but conditional: 艰贞, persevering through hardship. Step 3, the connection: because decline begins here, the care taken now is what turns the change from harm into no blame. Step 4, in place: line 3 is the top of the inner trigram, the hinge where heaven below hands over to earth above. One sentence: <b>when things are at their best, the slope is already in sight</b>.`,
      `第一步找象：无平不陂，无往不复——平地无不有坡，去者无不有回：泰极将倾的转折之点。第二步找断：无咎，然有条件——艰贞，于艰难中守正。第三步连起来：衰自此时始，此刻的戒惧艰辛，正是把转变化成无咎的东西。第四步放回爻位：九三是内卦之顶，下乾上坤交割的枢纽。一句话：<b>最好之时，坡已在望</b>。`,
      `第一歩、絵：无平不陂，无往不復――平らかな地に坂のないことはなく、去るものに帰らないことはない。繁栄が傾き始める転換点です。第二歩、断語：无咎――とがなし。ただし条件つき：艱貞、苦難の中で貞を守ること。第三歩、つなぐ：衰えはここから始まる。今このときの戒めこそが、変化を災いではなく无咎へと変えるのです。第四歩、位：九三は内卦の頂で、下の乾から上の坤へ引き渡される継ぎ目。一文にすれば：<b>最も良いときこそ、坂はすでに見えている</b>。`)),
    `<h2>${t("The verdict is not a prophecy", "断语不是预言", "断語は予言ではありません")}</h2>`,
    p(t("吉 and 凶 in the text name the quality of the situation the picture depicts — they are a quotation from the classic, not a judgment about your matter. What the situation means for you is yours to draw. This site keeps the same line everywhere: it returns text and structure, and makes no judgment of its own.",
      "经文中的吉、凶说的是象所画处境的性质——那是《周易》原文的引用，不是对你所占之事的判断。处境于你意味着什么，由你自己领会。本站处处守住这条界线：只给经文与结构，不作任何断言。",
      "経文の吉・凶は、絵が描く状況の性質を述べるもの――『周易』の引用であって、あなたの占った事柄への判断ではありません。その状況があなたにとって何を意味するかは、自分で読み取るものです。このサイトもすべてのページでこの線を守ります：経文と構造を示すだけで、自らは判断しません。")),
    p(t("<b>Where this fits after a cast.</b> Read the judgment, then your moving line, then the changed hexagram as background — the full walk-through is in " + L(lang, "worked-example") + ". When Takashima’s commentary quotes 彖曰 or 象曰, it is citing the Tradition texts — the oldest layer of explanation attached to the classic. Read them the way you read any commentary: as someone else’s careful reading of the same picture and the same verdict.",
      "<b>起卦之后在哪一步用。</b>先读卦辞，再读动爻，之卦为参照——完整走查见" + L(lang, "worked-example") + "。高岛注中引「彖曰」「象曰」处，是引《彖传》《象传》——附于经文的最古解释层。读它们如读一切注疏：那是别人对同一幅象、同一条断语的细心解读。",
      "<b>起卦ののち、どこで使うか。</b>卦辞、動爻、之卦の順に読みます――通しの実例は" + L(lang, "worked-example") + "にあります。高島の注に「彖曰」「象曰」とあれば、『彖伝』『象伝』――経文に付された最古の解釈層――を引いています。それらは、同じ絵と同じ断語を他の人が丁寧に読んだものとして読んでください。")),
    faq([
      qa(t("Do the verdict words predict my future?", "断语是在预测我的未来吗？", "断語は私の将来を予言していますか？"),
        t("No. They name the quality of the situation depicted. The site’s standing rule holds here too: no predictions of its own, conclusions left to the reader.", "不是。断语描述的是象所画处境的性质。本站的立站之规在这里同样适用：不作任何预测，结论留给读者。", "いいえ。断語は描かれた状況の性質を述べるものです。このサイトの規則はここでも変わりません：予測をせず、結論を読む人に委ねます。")),
      qa(t("Why do some verdicts come with conditions?", "为什么有的断语带条件？", "なぜ断語に条件が付くのですか？"),
        t("Because the classic teaches rather than decrees: 厉，无咎 — danger, yet no blame — means the way out is written into the line itself. The condition is the instruction.", "因为经文在教导，不在判决：厉，无咎——虽危可免——出路就写在爻辞里，条件本身就是教导。", "経文は断罪ではなく教えだからです。厲，无咎――危ういがとがなし――のように、出路は爻辞の中に書き込まれています。その条件こそが教えです。")),
      qa(t("Where can I see a line’s picture explained in more depth?", "想更深入看一爻的象，去哪里看？", "一爻の絵をもっと深く知りたいときは？"),
        t("Each line page pairs the text with a structural reading (取象) and a practical one (义理), drawn from the classic commentaries; they are shown in Chinese.", "每一爻的页面都把爻辞与取象（爻位与卦体结构）、义理（修身处事之法）并列，依公版注疏撰述，中文显示。", "各爻のページでは、爻辞と取象（爻位と卦の構造）、義理（修身処世の道）が並べて示されます（中国語）。")),
    ]),
    castLink(lang, t("Cast one and read it with the four steps", "起一卦，用四步法读它", "一卦立てて、四歩で読んでみましょう")),
  ].join("");
}

const DESC: Record<string, Record<Lang, string>> = {

  "reading-a-hexagram": { en: "Yin and yang lines, reading from the bottom, the two trigrams, line names like 六五, and what to read after a cast.", zh: "阴爻阳爻、自下而上、上下卦、爻题与起卦后读什么。", ja: "陰爻・陽爻、下から読むこと、上下卦、爻の名前、起卦後に読むもの。" },
  "lines-and-positions": { en: "Proper place, central lines, correspondence and neighbours: how a line is read against its place.", zh: "当位、得中、应与比：爻如何结合其位来读。", ja: "当位・中・応・比：爻を位との関係で読む方法。" },
  "the-eight-trigrams": { en: "The eight trigrams with their images, family roles and Earlier Heaven numbers.", zh: "八卦之象、家人与先天数。", ja: "八卦の象・家族・先天数。" },
  "moving-lines": { en: "Old and young lines, moving lines, and how the changed hexagram is formed.", zh: "老少之爻、动爻与之卦如何得出。", ja: "老陰老陽、動爻と之卦の求め方。" },
  "takashima-method": { en: "Takashima Donshō’s abbreviated yarrow-stalk method, step by step, with his own worked example.", zh: "高岛呑象三变略筮法，逐步讲解，附其本人占例。", ja: "高島呑象の三変略筮法を一歩ずつ、本人の占例つきで。" },
  "worked-example": { en: "Takashima’s own cast (21, 22, 16 → Meng, line 5 → Huan) taken apart stalk by stalk, read in full, with practice casts and the common mistakes.", zh: "把高岛本人占例（21、22、16 → 蒙卦五爻动 → 之涣）一策一策拆开，完整读一遍，附练习与常见错误。", ja: "高島自身の占例（21・22・16 → 蒙・五爻動 → 之卦は渙）を筮竹一本ずつ分解し、読み通す。練習とよくある間違いつき。" },
  "how-to-read-the-text": { en: "The verdict vocabulary of the Zhouyi — 吉, 凶, 厉, 悔, 吝, 咎 — and a four-step way to read any judgment or line text, with two lines read through.", zh: "《周易》断语词汇——吉、凶、厉、悔、吝、咎——与四步读法，附两条爻辞的完整走查。", ja: "『周易』の断語の語彙――吉・凶・厉・悔・吝・咎――と四歩の読み方。二つの爻を読み通します。" },
  "related-hexagrams": { en: "Inverse, opposite and nuclear hexagrams, with examples.", zh: "综卦、错卦、互卦及其示例。", ja: "綜卦・錯卦・互卦とその例。" },
};

export function learnPage(lang: Lang, slug: string) {
  if (!LEARN.includes(slug)) return null;
  const i = LEARN.indexOf(slug);
  const prev = i > 0 ? `<a rel="prev" href="${learnPath(lang, LEARN[i - 1])}">← ${esc(learnTitle(lang, LEARN[i - 1]))}</a>` : "<span></span>";
  const next = i < LEARN.length - 1 ? `<a rel="next" href="${learnPath(lang, LEARN[i + 1])}">${esc(learnTitle(lang, LEARN[i + 1]))} →</a>` : "";
  return {
    title: learnTitle(lang, slug), description: DESC[slug][lang],
    body: `<article class="learn"><p class="kicker">${esc({ en: "Learn", zh: "入门", ja: "入門" }[lang])} · ${i + 1}/${LEARN.length}</p><h1>${esc(learnTitle(lang, slug))}</h1>${body(lang, slug)}<nav class="prevnext">${prev}${next}</nav></article>`,
  };
}

// --- sidebars ----------------------------------------------------------------

const SIDE = {
  en: { learn: "Learn", related: "Related hexagrams", inverse: "Inverse (upside down)", opposite: "Opposite (all lines changed)", nuclear: "Nuclear (hidden inside)", pair: "Its pair in the sequence", sameUpper: "Same upper trigram", sameLower: "Same lower trigram", build: "Build a hexagram", buildHint: "Click a line to switch yin ⚋ / yang ⚊.", table: "All 64 hexagrams", tableHint: "Rows: lower trigram · columns: upper trigram" },
  zh: { learn: "入门", related: "亲缘卦", inverse: "综卦（上下颠倒）", opposite: "错卦（六爻全变）", nuclear: "互卦（卦中之卦）", pair: "卦序之对", sameUpper: "同上卦", sameLower: "同下卦", build: "自己画一卦", buildHint: "点击一爻切换阴 ⚋ / 阳 ⚊。", table: "六十四卦表", tableHint: "行：下卦 · 列：上卦" },
  ja: { learn: "入門", related: "関連する卦", inverse: "綜卦（上下逆さ）", opposite: "錯卦（全爻反転）", nuclear: "互卦（内に隠れた卦）", pair: "卦序の対", sameUpper: "上卦が同じ", sameLower: "下卦が同じ", build: "卦を組み立てる", buildHint: "爻をクリックして陰 ⚋／陽 ⚊ を切り替え。", table: "六十四卦一覧", tableHint: "行：下卦・列：上卦" },
};

export type SideCtx = { n?: number; p?: number; learn?: string; trigram?: string };

export function leftSidebar(lang: Lang, ctx: SideCtx) {
  const s = SIDE[lang];
  const learn = LEARN.map((slug) => `<li><a href="${learnPath(lang, slug)}"${slug === ctx.learn ? ' aria-current="page"' : ""}>${esc(learnTitle(lang, slug))}</a></li>`).join("");
  let related = "";
  if (ctx.n) {
    const r = relations(ctx.n);
    const h = getByNumber(ctx.n);
    const item = (label: string, n: number) => `<li><span class="muted small">${esc(label)}</span>${mini(lang, n)}</li>`;
    related = `<section><h4>${esc(s.related)} <a class="help" href="${learnPath(lang, "related-hexagrams")}" title="?">?</a></h4><ul class="rel">${item(s.inverse, r.inverse)}${item(s.opposite, r.opposite)}${item(s.nuclear, r.nuclear)}${item(s.pair, r.pair)}</ul>
<p class="small"><a href="${trigramPath(lang, h.upper)}">${esc(s.sameUpper)}: ${SYMBOLS[h.upper]}</a> · <a href="${trigramPath(lang, h.lower)}">${esc(s.sameLower)}: ${SYMBOLS[h.lower]}</a></p></section>`;
  }
  const start = ctx.n ? linesOf(getByNumber(ctx.n)) : [1, 0, 0, 0, 1, 0];
  const builder = `<section><h4>${esc(s.build)}</h4><p class="muted small">${esc(s.buildHint)}</p>
<div class="builder" data-lang="${lang}" data-lines="${start.join("")}">${[5, 4, 3, 2, 1, 0].map((i) => `<button type="button" data-i="${i}" aria-label="${i + 1}"></button>`).join("")}</div>
<p class="builder-out"></p></section>`;
  return `<aside class="side left"><section><h4>${esc(s.learn)}</h4><ol class="learn-list">${learn}</ol></section>${related}${builder}</aside>`;
}

export function rightSidebar(lang: Lang, ctx: SideCtx) {
  const s = SIDE[lang];
  const cur = ctx.n;
  const head = `<tr><th></th>${ORDER.map((u) => `<th title="${esc(trigramTitle(lang, u))}"><a href="${trigramPath(lang, u)}">${SYMBOLS[u]}</a></th>`).join("")}</tr>`;
  const rows = ORDER.map((lo) => `<tr><th title="${esc(trigramTitle(lang, lo))}"><a href="${trigramPath(lang, lo)}">${SYMBOLS[lo]}</a></th>${ORDER.map((up) => {
    const h = HEXAGRAMS.find((x) => x.lower === lo && x.upper === up)!;
    const isCur = h.number === cur || (ctx.trigram && (lo === ctx.trigram || up === ctx.trigram));
    return `<td${isCur ? ' class="cur"' : ""} data-n="${h.number}"><a href="${hexPath(lang, h.number)}" title="${esc(hexTitle(lang, h.number))}">${figure(linesOf(h), { small: true })}<span>${h.number}</span></a></td>`;
  }).join("")}</tr>`).join("");
  return `<aside class="side right"><section><h4><a href="/${lang}/hexagrams">${esc(s.table)}</a></h4><p class="muted small">${esc(s.tableHint)}</p><table class="matrix">${head}${rows}</table></section></aside>`;
}

/** Compact data for the builder and the table highlighting in /explore.js. */
export function hexData(lang: Lang) {
  return HEXAGRAMS.map((h) => [h.number, linesOf(h).join(""), hexTitle(lang, h.number), hexPath(lang, h.number)]);
}
