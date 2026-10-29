// Guide pages ("Learn") and the two sidebars shared by every page: learning links, related
// hexagrams, an interactive hexagram builder, and the 8×8 table of all 64 hexagrams.
import { HEXAGRAMS, T } from "./engine/data.ts";
import { SYMBOLS, getByLines, getByNumber, linesOf } from "./engine/core.ts";
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

export const LEARN = ["reading-a-hexagram", "lines-and-positions", "the-eight-trigrams", "moving-lines", "takashima-method", "related-hexagrams"];
export const learnPath = (lang: Lang, slug: string) => `/${lang}/learn/${slug}`;

const TITLES: Record<string, Record<Lang, string>> = {
  "reading-a-hexagram": { en: "How to read a hexagram", zh: "怎样读一卦", ja: "卦の読み方" },
  "lines-and-positions": { en: "Yin, yang and the six positions", zh: "阴阳与六爻之位", ja: "陰陽と六爻の位" },
  "the-eight-trigrams": { en: "The eight trigrams", zh: "八卦", ja: "八卦" },
  "moving-lines": { en: "Moving lines and the changed hexagram", zh: "动爻与之卦", ja: "動爻と之卦" },
  "takashima-method": { en: "Takashima’s three-change method", zh: "高岛的略筮法", ja: "高島の略筮法" },
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
      ].join("");
    }
    case "the-eight-trigrams":
      return [
        p(t("Three lines give 2³ = 8 trigrams, the building blocks of the hexagrams. Each has an image in nature, a place in the family and a number in the Earlier Heaven order, which Takashima’s method uses to turn stalk counts into trigrams.",
          "三爻得 2³ = 8 个三画卦，是六十四卦的基本单位。每卦有自然之象、家人之象与先天之数；高岛略筮法即以先天数把筮数译成卦。",
          "三本の爻で 2³＝8 つの小成卦ができ、六十四卦の材料になります。それぞれ自然の象・家族の象・先天数を持ち、高島の略筮法は先天数で筮竹の数を卦に直します。")),
        trigramTable(lang),
        p(t(`Two trigrams make a hexagram: <a href="/${lang}/hexagrams">all 64 in one table</a>.`, `两卦相重成六十四卦：<a href="/${lang}/hexagrams">六十四卦全表</a>。`, `二つを重ねて六十四卦：<a href="/${lang}/hexagrams">一覧表</a>。`)),
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
        p(t("<b>Takashima’s own example.</b> Left-hand counts 21, 22, 16: 21 → remainder 5, +1 = 6 = Kan; 22 → remainder 6, +1 = 7 = Gen; 16 counted by sixes → remainder 4, +1 = 5. Kan below Gen is Meng, moving line 5, changing to Huan. It is the reading he made for his friend Fukuhara Minoru on his appointment as Governor of Okinawa.",
          "<b>高岛自己的占例。</b>左手 21、22、16 策：21 余 5 加 1 得 6 为坎；22 余 6 加 1 得 7 为艮；16 六六数之余 4 加 1 得 5。下坎上艮为蒙，动五爻，之涣。即高岛为友人福原实赴任冲绳县知事所占。",
          "<b>高島自身の占例。</b>左手 21・22・16 本：21 は余り 5 で＋1＝6、坎。22 は余り 6 で＋1＝7、艮。16 は六本ずつで余り 4、＋1＝5。下坎上艮で蒙、五爻動いて渙に之く。友人福原実の沖縄県知事赴任に際しての占いです。")),
        row(cap(fig(MENG, [4]), H(lang, MENG)), `<span class="arrow">→</span>`, cap(fig(59, [4]), H(lang, 59))),
        p(`<a class="btn" href="/${lang}/">${esc(t("Split the stalks yourself", "亲手分筮竹起一卦", "自分で筮竹を分ける"))}</a>`),
      ].join("");
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
      ].join("");
  }
  return "";
}

const DESC: Record<string, Record<Lang, string>> = {
  "reading-a-hexagram": { en: "Yin and yang lines, reading from the bottom, the two trigrams, line names like 六五, and what to read after a cast.", zh: "阴爻阳爻、自下而上、上下卦、爻题与起卦后读什么。", ja: "陰爻・陽爻、下から読むこと、上下卦、爻の名前、起卦後に読むもの。" },
  "lines-and-positions": { en: "Proper place, central lines, correspondence and neighbours: how a line is read against its place.", zh: "当位、得中、应与比：爻如何结合其位来读。", ja: "当位・中・応・比：爻を位との関係で読む方法。" },
  "the-eight-trigrams": { en: "The eight trigrams with their images, family roles and Earlier Heaven numbers.", zh: "八卦之象、家人与先天数。", ja: "八卦の象・家族・先天数。" },
  "moving-lines": { en: "Old and young lines, moving lines, and how the changed hexagram is formed.", zh: "老少之爻、动爻与之卦如何得出。", ja: "老陰老陽、動爻と之卦の求め方。" },
  "takashima-method": { en: "Takashima Donshō’s abbreviated yarrow-stalk method, step by step, with his own worked example.", zh: "高岛呑象三变略筮法，逐步讲解，附其本人占例。", ja: "高島呑象の三変略筮法を一歩ずつ、本人の占例つきで。" },
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
