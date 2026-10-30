// Site information pages: about, contact, privacy and terms, in three languages.
// Keep the privacy page true to what the site actually does; update it whenever analytics or ads are added.
import type { Lang } from "./pages.ts";

export const INFO = ["about", "contact", "privacy", "terms"] as const;
export type InfoSlug = (typeof INFO)[number];
export const infoPath = (lang: Lang, slug: InfoSlug) => `/${lang}/${slug}`;

const REPO = "https://github.com/windyinwind/iching-takashima";
const ISSUES = `${REPO}/issues`;
const BOT = "https://x.ai/bot/1UcfT98mXBGBnDMaoGtG2";
const UPDATED = { en: "Last updated: 30 October 2026", zh: "最后更新：2026 年 10 月 30 日", ja: "最終更新：2026年10月30日" };

export const INFO_TITLES: Record<InfoSlug, Record<Lang, string>> = {
  about: { en: "About this site", zh: "关于本站", ja: "このサイトについて" },
  contact: { en: "Contact and support", zh: "联系与支持", ja: "お問い合わせ・サポート" },
  privacy: { en: "Privacy policy", zh: "隐私政策", ja: "プライバシーポリシー" },
  terms: { en: "Terms of use", zh: "使用条款", ja: "利用規約" },
};

const DESCRIPTIONS: Record<InfoSlug, Record<Lang, string>> = {
  about: {
    en: "What this I Ching site is, where its texts come from, and how the Takashima method of casting works here.",
    zh: "本站是什么、经文与注释的出处，以及本站如何按高岛略筮法起卦。",
    ja: "このサイトの目的、経文と解釈の出典、高島流略筮法による起卦の仕組み。",
  },
  contact: {
    en: "How to report a problem, suggest a correction to a text or translation, or ask a question about the site.",
    zh: "报告问题、指正经文或译文、咨询本站的方式。",
    ja: "不具合の報告、経文・翻訳の誤りのご指摘、ご質問の方法。",
  },
  privacy: {
    en: "What data this site processes when you visit or cast a hexagram, what stays in your browser, and what is kept.",
    zh: "访问本站或起卦时处理哪些数据、哪些只留在你的浏览器、保存多久。",
    ja: "サイト閲覧・起卦の際に扱うデータ、ブラウザ内にだけ残るもの、保存期間。",
  },
  terms: {
    en: "The terms for using this I Ching study site, its API and its MCP server.",
    zh: "使用本站及其 API、MCP 服务的条款。",
    ja: "本サイトと API・MCP サーバーの利用条件。",
  },
};

const a = (href: string, text: string) => `<a href="${href}"${href.startsWith("http") ? ' rel="noopener"' : ""}>${text}</a>`;

const BODY: Record<InfoSlug, Record<Lang, (origin: string) => string>> = {
  about: {
    en: (o) => `
<p>This site is a study tool for the <em>I Ching</em> (the <em>Book of Changes</em>, 周易). You can cast a hexagram by Takashima Donshō’s short method (略筮), splitting the stalks yourself and seeing every step, and then read the classic text and Takashima’s commentary for the result.</p>
<h2>What it does and doesn’t do</h2>
<p>It shows the method and the sources. It makes no predictions and gives no advice: what a reading means for your situation is your own judgment.</p>
<h2>Sources</h2>
<ul>
<li>The classic text of the <em>Zhouyi</em>, with the commentaries of the Ten Wings.</li>
<li>English: James Legge, <em>The Yî King</em> (Sacred Books of the East, vol. 16, 1882), in the public domain.</li>
<li>Takashima Donshō 高島呑象 (1832–1914), <em>Zōho Takashima Ekidan</em> 増補高島易断, from its Chinese text. The English and Japanese renderings of Takashima’s commentary were made with machine assistance, then checked against the Chinese item by item; pages here show excerpts.</li>
</ul>
<p>If you find a mistake in a text or a translation, please ${a("/en/contact", "tell us")}.</p>
<h2>Other ways to use it</h2>
<ul>
<li>A ${a(BOT, "Grok Bot")} that casts and reads with you in conversation.</li>
<li>A free MCP server for AI assistants at <code>${o}/mcp</code>, and a JSON API.</li>
<li>The casting engine is open source (MIT licence) on ${a(REPO, "GitHub")}.</li>
</ul>
<p>The site is run by an independent developer.</p>`,
    zh: (o) => `
<p>本站是研读《周易》的工具。你可以按高岛呑象的略筮法亲手分筮起卦，每一步怎么分、怎么数都看得见，再读所得之卦的经文与高岛原注。</p>
<h2>做什么，不做什么</h2>
<p>本站展示方法与出处，不作预测，也不提供建议。卦对你的处境意味着什么，由你自己判断。</p>
<h2>出处</h2>
<ul>
<li>《周易》经文及《十翼》传文。</li>
<li>英文：James Legge 译 <em>The Yî King</em>（1882 年，《东方圣书》第 16 卷），已进入公有领域。</li>
<li>高岛呑象（1832–1914）《増補高島易断》汉文本。高岛注的英文、日文译文由机器辅助翻译，再逐条对照汉文核校；本站页面只载节录。</li>
</ul>
<p>如发现经文或译文有误，请${a("/zh/contact", "告诉我们")}。</p>
<h2>其他用法</h2>
<ul>
<li>${a(BOT, "Grok Bot")}：在对话中陪你起卦、读卦。</li>
<li>免费的 MCP 服务（供 AI 助手使用）：<code>${o}/mcp</code>，以及 JSON API。</li>
<li>起卦引擎开源（MIT 许可），见 ${a(REPO, "GitHub")}。</li>
</ul>
<p>本站由个人开发者独立运营。</p>`,
    ja: (o) => `
<p>このサイトは『易経』（周易）を学ぶための道具です。高島呑象の略筮法で、筮竹を自分で分けて卦を立て、数え方から卦の成り立ちまでを一歩ずつ確かめたうえで、得た卦の経文と高島の解釈を読むことができます。</p>
<h2>できること・しないこと</h2>
<p>手順と出典を示します。予言や助言はしません。卦がご自身の状況に何を意味するかは、ご自身で判断してください。</p>
<h2>出典</h2>
<ul>
<li>『周易』の経文と十翼の伝。</li>
<li>英訳：James Legge, <em>The Yî King</em>（1882年、『東方聖典』第16巻）。パブリックドメイン。</li>
<li>高島呑象（1832–1914）『増補高島易断』の漢文テキスト。高島の解釈の英訳・和訳は機械の補助で作成し、漢文と一項ずつ照合しています。各ページは抄録です。</li>
</ul>
<p>経文や翻訳の誤りにお気づきの際は${a("/ja/contact", "お知らせください")}。</p>
<h2>ほかの使い方</h2>
<ul>
<li>会話で卦を立てて読む ${a(BOT, "Grok Bot")}。</li>
<li>AI アシスタント向けの無料 MCP サーバー <code>${o}/mcp</code> と JSON API。</li>
<li>起卦エンジンはオープンソース（MIT ライセンス）で ${a(REPO, "GitHub")} にあります。</li>
</ul>
<p>本サイトは個人の開発者が運営しています。</p>`,
  },
  contact: {
    en: () => `
<p>For a bug, a wrong character in a text, a translation that misreads the Chinese, or a question about the site, ${a(ISSUES, "open an issue on GitHub")}. You need a free GitHub account, and issues are public, so please don’t include personal details.</p>
<p>When you report a text or translation problem, include the page address (or the hexagram and line) and what you think it should say.</p>
<h2>Questions about a reading</h2>
<p>This site doesn’t interpret readings for individuals. To talk a reading through, try the ${a(BOT, "Grok Bot")}, or the ${a("/en/learn/reading-a-hexagram", "Learn")} pages.</p>
<h2>Privacy requests</h2>
<p>The site keeps no accounts and stores no casts (see the ${a("/en/privacy", "privacy policy")}), so there is usually nothing held about you. If you have a privacy question, open an issue and say only that you would like to be contacted privately.</p>`,
    zh: () => `
<p>报告程序问题、经文错字、译文误读汉文，或询问本站相关事宜，请${a(ISSUES, "在 GitHub 提交 issue")}。需要一个免费的 GitHub 账号；issue 是公开的，请勿填写个人信息。</p>
<p>指正经文或译文时，请附上页面地址（或卦与爻），并说明你认为应当如何。</p>
<h2>关于具体卦的解读</h2>
<p>本站不为个人解卦。想把一卦细细谈开，可以用 ${a(BOT, "Grok Bot")}，或读${a("/zh/learn/reading-a-hexagram", "入门")}各篇。</p>
<h2>隐私相关</h2>
<p>本站不设账号，也不保存起卦记录（见${a("/zh/privacy", "隐私政策")}），通常并无关于你的数据。如有隐私方面的问题，请提交 issue，只需写明希望私下联系。</p>`,
    ja: () => `
<p>不具合、経文の誤字、漢文を読み誤った翻訳、サイトについてのご質問は、${a(ISSUES, "GitHub の issue")} でお寄せください。無料の GitHub アカウントが必要です。issue は公開されるため、個人情報は書かないでください。</p>
<p>経文や翻訳のご指摘には、ページのアドレス（または卦と爻）と、正しいと思われる内容を添えてください。</p>
<h2>個別の卦の読み方について</h2>
<p>このサイトでは個人の占断はしていません。卦について対話しながら考えたいときは ${a(BOT, "Grok Bot")} を、または${a("/ja/learn/reading-a-hexagram", "入門")}のページをご覧ください。</p>
<h2>プライバシーに関するご依頼</h2>
<p>本サイトにはアカウントがなく、起卦の記録も保存しません（${a("/ja/privacy", "プライバシーポリシー")}参照）。そのため通常、お客様について保有している情報はありません。ご質問がある場合は、非公開での連絡を希望する旨だけを issue に書いてください。</p>`,
  },
  privacy: {
    en: () => `
<p class="muted">${UPDATED.en}</p>
<p>In short: no accounts, no cookies, no tracking, and your casts are not stored.</p>
<h2>When you visit</h2>
<p>The site runs on Cloudflare. Like any web server, it receives your IP address, browser type, the page address and the time of each request. Cloudflare uses these to deliver the page and protect against abuse, and the site’s request logs keep them for a few days for fixing errors. They are not used to identify you, build a profile or show ads. See ${a("https://www.cloudflare.com/privacypolicy/", "Cloudflare’s privacy policy")}.</p>
<h2>When you cast a hexagram</h2>
<p>The numbers from your stalk-splitting are sent to the server, which works out the hexagram and sends it back. The cast is not saved. It appears in the request logs only as part of the page address, for the same few days.</p>
<p>A “share” link carries the cast in the link itself. Anyone you give the link to can see that cast.</p>
<h2>In your browser</h2>
<p>The site remembers your language choice in your browser’s local storage, and briefly keeps an unfinished cast in session storage while you switch language. Neither leaves your device, and you can clear both in your browser settings. The site sets no cookies.</p>
<h2>API, MCP server and Grok Bot</h2>
<p>Requests to the API and the MCP server are handled in the same way as page requests and are not stored. The ${a(BOT, "Grok Bot")} runs on xAI’s service, under ${a("https://x.ai/legal/privacy-policy", "xAI’s privacy policy")}.</p>
<h2>Children</h2>
<p>The site is not aimed at children and collects no personal information from anyone.</p>
<h2>Changes</h2>
<p>If the site adds analytics or advertising, this page will be updated before they go live, and will say what they collect and how to opt out.</p>
<h2>Contact</h2>
<p>See ${a("/en/contact", "Contact and support")}.</p>`,
    zh: () => `
<p class="muted">${UPDATED.zh}</p>
<p>简而言之：不设账号，不用 Cookie，不做追踪，不保存你的起卦。</p>
<h2>访问时</h2>
<p>本站运行在 Cloudflare 上。和所有网站一样，服务器会收到每次请求的 IP 地址、浏览器类型、页面地址和时间。Cloudflare 用这些来送达页面、防范滥用；本站的请求日志会保留几天，用于排查错误。这些信息不用于识别你、建立画像或投放广告。详见 ${a("https://www.cloudflare.com/privacypolicy/", "Cloudflare 隐私政策")}。</p>
<h2>起卦时</h2>
<p>你分筮得到的数字会发送到服务器，服务器算出卦象后返回。起卦结果不保存，只会作为页面地址的一部分出现在请求日志中，同样保留几天。</p>
<p>“分享”链接把卦象写在链接里，拿到链接的人都能看到这一卦。</p>
<h2>浏览器中</h2>
<p>本站在浏览器的本地存储中记住你选的语言；切换语言时，会在会话存储中暂存未完成的起卦。两者都不离开你的设备，可在浏览器设置中清除。本站不设置 Cookie。</p>
<h2>API、MCP 服务与 Grok Bot</h2>
<p>对 API 与 MCP 服务的请求，处理方式与页面请求相同，不作保存。${a(BOT, "Grok Bot")} 运行在 xAI 的服务上，适用 ${a("https://x.ai/legal/privacy-policy", "xAI 隐私政策")}。</p>
<h2>未成年人</h2>
<p>本站不面向儿童，也不向任何人收集个人信息。</p>
<h2>变更</h2>
<p>如本站加入访问统计或广告，会在上线前更新本页，说明收集什么、如何拒绝。</p>
<h2>联系</h2>
<p>见${a("/zh/contact", "联系与支持")}。</p>`,
    ja: () => `
<p class="muted">${UPDATED.ja}</p>
<p>要点：アカウントなし、Cookie なし、トラッキングなし。起卦の結果は保存しません。</p>
<h2>閲覧時</h2>
<p>本サイトは Cloudflare 上で動いています。一般的なウェブサーバーと同じく、リクエストごとに IP アドレス、ブラウザの種類、ページのアドレス、時刻を受け取ります。Cloudflare はこれをページの配信と不正利用の防止に使い、本サイトのリクエストログはエラー対応のため数日間保持します。個人の特定、プロファイル作成、広告には使いません。詳しくは ${a("https://www.cloudflare.com/privacypolicy/", "Cloudflare のプライバシーポリシー")} をご覧ください。</p>
<h2>起卦時</h2>
<p>筮竹を分けて得た数はサーバーに送られ、サーバーが卦を算出して返します。起卦の結果は保存しません。ページのアドレスの一部としてリクエストログに残るだけで、保持期間は同じく数日です。</p>
<p>「共有」リンクには卦がリンク自体に含まれます。リンクを受け取った人は誰でもその卦を見られます。</p>
<h2>ブラウザ内</h2>
<p>選んだ言語をブラウザのローカルストレージに記憶し、言語を切り替える間だけ途中の起卦をセッションストレージに一時保存します。どちらも端末の外には出ず、ブラウザの設定で消去できます。Cookie は使いません。</p>
<h2>API・MCP サーバー・Grok Bot</h2>
<p>API と MCP サーバーへのリクエストはページと同じ扱いで、保存しません。${a(BOT, "Grok Bot")} は xAI のサービス上で動き、${a("https://x.ai/legal/privacy-policy", "xAI のプライバシーポリシー")}が適用されます。</p>
<h2>お子さまについて</h2>
<p>本サイトは子ども向けではなく、どなたからも個人情報を収集しません。</p>
<h2>変更</h2>
<p>アクセス解析や広告を導入する場合は、その前に本ページを更新し、収集する内容と拒否の方法を記載します。</p>
<h2>お問い合わせ</h2>
<p>${a("/ja/contact", "お問い合わせ・サポート")}をご覧ください。</p>`,
  },
  terms: {
    en: () => `
<p class="muted">${UPDATED.en}</p>
<h2>A study tool, not advice</h2>
<p>This site presents a classic text, its commentaries and a traditional casting method for study and reflection. It makes no predictions. Nothing here is medical, legal, financial or other professional advice, and decisions you make are your own responsibility.</p>
<h2>Using the site, API and MCP server</h2>
<p>You may use the site, the JSON API and the MCP server freely and at no cost, including from your own apps and AI assistants. Please don’t overload them: automated traffic may be rate-limited or blocked to keep the service available for everyone.</p>
<h2>Content</h2>
<ul>
<li>The <em>Zhouyi</em>, Legge’s 1882 translation and Takashima’s original text are in the public domain.</li>
<li>The casting engine is open source under the ${a(`${REPO}/blob/main/LICENSE`, "MIT licence")}.</li>
<li>The site’s own English and Japanese renderings of Takashima’s commentary, and its written explanations, belong to the site. Short quotations with a link back are welcome.</li>
</ul>
<h2>No warranty</h2>
<p>The site is provided as it is. We work to keep the texts accurate but can’t guarantee that every character or translation is free of error, or that the service will always be available.</p>
<h2>Changes</h2>
<p>These terms may be updated; the date above shows the latest version.</p>`,
    zh: () => `
<p class="muted">${UPDATED.zh}</p>
<h2>研读工具，而非建议</h2>
<p>本站呈现经典原文、注释与传统起卦方法，供研读与思考之用，不作预测。本站内容均不构成医疗、法律、财务或其他专业建议，你所作的决定由你自己负责。</p>
<h2>使用本站、API 与 MCP 服务</h2>
<p>本站、JSON API 与 MCP 服务可以免费自由使用，包括接入你自己的应用和 AI 助手。请勿过量请求；为保证大家都能使用，自动化流量可能被限速或阻止。</p>
<h2>内容</h2>
<ul>
<li>《周易》、Legge 1882 年英译与高岛原文均属公有领域。</li>
<li>起卦引擎以 ${a(`${REPO}/blob/main/LICENSE`, "MIT 许可")} 开源。</li>
<li>本站所作高岛注的英文、日文译文，以及本站撰写的说明文字，版权归本站所有。欢迎简短引用并附上链接。</li>
</ul>
<h2>免责</h2>
<p>本站按现状提供。我们尽力保证文本准确，但无法保证每个字、每处译文都没有错误，也无法保证服务始终可用。</p>
<h2>变更</h2>
<p>本条款可能更新，以上日期为最新版本。</p>`,
    ja: () => `
<p class="muted">${UPDATED.ja}</p>
<h2>学習の道具であり、助言ではありません</h2>
<p>本サイトは古典の経文・注釈と伝統的な起卦法を、学習と思索のために紹介するものです。予言はしません。医療・法律・金融その他の専門的な助言ではなく、ご自身の判断の責任はご自身にあります。</p>
<h2>サイト・API・MCP サーバーの利用</h2>
<p>本サイト、JSON API、MCP サーバーは、ご自身のアプリや AI アシスタントからの利用も含め、無料で自由にお使いいただけます。過度な負荷はおやめください。サービスを皆さまが使えるよう、自動アクセスは制限・遮断する場合があります。</p>
<h2>コンテンツ</h2>
<ul>
<li>『周易』、Legge の1882年英訳、高島の原文はパブリックドメインです。</li>
<li>起卦エンジンは ${a(`${REPO}/blob/main/LICENSE`, "MIT ライセンス")} のオープンソースです。</li>
<li>本サイトが作成した高島の解釈の英訳・和訳と解説文の権利は本サイトに帰属します。リンクを添えた短い引用は歓迎します。</li>
</ul>
<h2>免責</h2>
<p>本サイトは現状のまま提供されます。文字や翻訳の正確さに努めていますが、誤りがないこと、サービスが常に利用できることは保証できません。</p>
<h2>変更</h2>
<p>本規約は更新されることがあります。上記の日付が最新版です。</p>`,
  },
};

export function infoPage(lang: Lang, slug: string, origin: string) {
  if (!(INFO as readonly string[]).includes(slug)) return null;
  const s = slug as InfoSlug;
  return { title: INFO_TITLES[s][lang], description: DESCRIPTIONS[s][lang], body: `<h1>${INFO_TITLES[s][lang]}</h1>${BODY[s][lang](origin)}` };
}

/** Footer links to the information pages, shared by the casting app and the server-rendered pages. */
export const infoLinks = (lang: Lang) => INFO.map((s) => `<a href="${infoPath(lang, s)}">${INFO_TITLES[s][lang]}</a>`).join(" · ");
