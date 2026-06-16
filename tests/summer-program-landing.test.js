const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("summer program advertising route is separate from the product detail route", () => {
  const config = JSON.parse(read("vercel.json"));
  const rewrites = new Map(config.rewrites.map(({ source, destination }) => [source, destination]));

  assert.equal(rewrites.get("/summer-program"), "/summer-program.html");
  assert.equal(rewrites.get("/programs/summer-program"), "/programs/summer-program/index.html");
  assert.ok(fs.existsSync(path.join(root, "summer-program.html")));
});

test("summer program landing contains only the approved conversion structure", () => {
  const html = read("summer-program.html");

  [
    'id="summer-hero"',
    'id="summer-problem"',
    'id="summer-solution"',
    'id="summer-vision"',
    'id="summer-benefits"',
    'id="summer-contents"',
    'id="summer-fit"',
    'id="summer-proof"',
    'id="summer-price"',
    'id="summer-guarantee"',
    'id="summer-faq"',
    'id="summer-final-cta"',
  ].forEach((marker) => assert.match(html, new RegExp(marker)));

  assert.match(html, /data-summer-checkout/);
  assert.match(html, /data-mobile-sticky-cta/);
  assert.match(html, /0,50\s*€/);
  assert.doesNotMatch(html, /data-cart-count|site-nav|Други програми|Свързани програми/);
  assert.doesNotMatch(html, /technical-pack|strength-level|matchday-pack/);
});

test("summer program landing uses approved sales copy and trust content", () => {
  const html = read("summer-program.html");

  assert.match(html, /Технически тренировки/);
  assert.match(html, /Скорост и експлозивност/);
  assert.match(html, /Физическа подготовка/);
  assert.match(html, /Ясен план за действие/);
  assert.match(html, /50\+[\s\S]*футболисти/);
  assert.match(html, /100\+[\s\S]*проведени тренировки/);
  assert.match(html, /Сигурно плащане чрез Stripe/);
  assert.match(html, /Достъп веднага след плащане/);
  assert.match(html, /Получаваш програмата на имейл/);
  assert.match(html, /Няма месечни такси/);
  assert.match(html, /become\.pro2024@gmail\.com/);
  assert.match(html, /privacy-policy/);
  assert.match(html, /terms/);
  assert.match(html, /cookie-policy/);
  assert.match(html, /refund-policy/);
});

test("summer program landing adds real product, player, coach, and testimonial proof", () => {
  const html = read("summer-program.html");
  const heroIndex = html.indexOf('id="summer-hero"');
  const proofIndex = html.indexOf('id="summer-proof"');
  const problemIndex = html.indexOf('id="summer-problem"');

  assert.ok(heroIndex >= 0 && proofIndex > heroIndex && problemIndex > proofIndex);
  assert.match(html, /id="summer-preview"/);
  [
    "program-structure.webp",
    "weekly-plan.webp",
    "fitness-levels.webp",
    "training-library.webp",
  ].forEach((asset) => assert.match(html, new RegExp(asset)));

  [
    "Мирослав Маринов",
    "Ирен Георгиева",
    "Панайот Пасков",
    "miroslav-marinov.jfif",
    "iren-georgieva.jfif",
    "panayot-paskov.jpg",
  ].forEach((content) => assert.match(html, new RegExp(content)));

  assert.match(html, /id="summer-coach"/);
  assert.match(html, /Йордан Желев/);
  assert.match(html, /coach-yordan-zhelev\.png/);
  assert.match(html, /Първа лига на 16/);
  assert.match(html, /България U15/);
  assert.match(html, /Нотингам Форест/);

  assert.match(html, /id="summer-testimonials"/);
  assert.match(html, /Играч, 16 г\./);
  assert.match(html, /Родител на играч, 13 г\./);
  assert.match(html, /Играч, 18 г\./);
  assert.ok((html.match(/Промо цена 0,50 €/g) || []).length >= 3);
});

test("summer program landing places the explainer and training videos in the approved order", () => {
  const html = read("summer-program.html");
  const heroIndex = html.indexOf('id="summer-hero"');
  const explainerIndex = html.indexOf('id="summer-explainer"');
  const proofIndex = html.indexOf('id="summer-proof"');
  const trainingVideosIndex = html.indexOf('id="summer-training-videos"');
  const playerHeadingIndex = html.indexOf("ИГРАЧИ, КОИТО ТРЕНИРАТ ОНЛАЙН");

  assert.ok(
    heroIndex >= 0 &&
      explainerIndex > heroIndex &&
      proofIndex > explainerIndex &&
      trainingVideosIndex > proofIndex &&
      playerHeadingIndex > trainingVideosIndex
  );
  assert.match(html, /Какво точно получаваш в Лятната програма\?/);
  assert.match(html, /summer-program-explainer\.mp4/);
  assert.match(html, /controls\s+playsinline\s+preload="metadata"/);

  [
    "field-drill-side-forward-back.mp4",
    "overlap-passing-cones.mp4",
    "change-direction-back.mp4",
  ].forEach((video) => assert.match(html, new RegExp(video)));
  assert.ok((html.match(/autoplay muted loop playsinline/g) || []).length >= 3);
  assert.equal((html.match(/data-lazy-video/g) || []).length, 3);
  assert.equal((html.match(/preload="none"/g) || []).length, 3);
  [
    "field-drill-side-forward-back-poster.jpg",
    "overlap-passing-cones-poster.jpg",
    "change-direction-back-poster.jpg",
  ].forEach((poster) => assert.match(html, new RegExp(poster)));
});

test("summer program training videos present the exercises as part of the online program", () => {
  const html = read("summer-program.html");
  const start = html.indexOf('id="summer-training-videos"');
  const end = html.indexOf("ИГРАЧИ, КОИТО ТРЕНИРАТ ОНЛАЙН", start);
  const trainingVideosSection = html.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(trainingVideosSection, /ОТ ПРОГРАМАТА КЪМ ТЕРЕНА/);
  assert.match(trainingVideosSection, /Виж упражненията, които стоят зад програмата/);
  assert.match(
    trainingVideosSection,
    /Лятната програма използва реални футболни упражнения, които играчът може да следва самостоятелно с ясна структура, повторения и фокус\./
  );
  assert.doesNotMatch(trainingVideosSection, /РЕАЛНИ ТРЕНИРОВКИ|Виж как работим на терена|Техника и движение с топка/);

  [
    "Скорост и смяна на посоката",
    "Упражнения за по-бърза реакция, първа крачка и динамика.",
    "Техника и контрол с топка",
    "Работа върху движение, контрол и увереност с топката.",
    "Координация и реакция",
    "Задачи, които развиват баланс, ориентация и вземане на решения.",
  ].forEach((copy) => assert.match(trainingVideosSection, new RegExp(copy)));

  assert.equal((trainingVideosSection.match(/class="summer-training-video-copy"/g) || []).length, 3);
  assert.match(trainingVideosSection, /class="summer-training-video-shell"/);
  assert.match(trainingVideosSection, /class="summer-training-video-cta"/);
  assert.match(trainingVideosSection, /Тези упражнения са само малка част от цялата система\./);
  assert.match(trainingVideosSection, /href="#summer-contents"/);
  assert.match(trainingVideosSection, /Виж какво включва програмата/);
});

test("summer program adds strategic CTAs after key persuasion sections", () => {
  const html = read("summer-program.html");

  [
    "Готов ли си да използваш лятото по правилния начин?",
    "Вземи достъп сега",
    "Тези упражнения са само малка част от цялата система.",
    "Виж какво включва програмата",
    "Програмите са създадени за играчи с реални цели и желание за развитие.",
    "Започни още днес",
    "След 8 седмици така може да изглежда и твоят напредък.",
    "Искам този резултат",
    "Вземи цялата структура и започни още днес.",
    "Вземи програмата за 0,50 €",
    "Работи по система, създадена от човек, който е минал по този път.",
    "Започни подготовката си",
    "Следващият положителен резултат може да бъде твоят.",
  ].forEach((copy) => assert.match(html, new RegExp(copy)));

  assert.equal((html.match(/class="summer-section-cta/g) || []).length, 6);
  assert.ok((html.match(/data-summer-checkout/g) || []).length >= 11);
  assert.match(html, /class="summer-training-video-cta"[\s\S]*href="#summer-contents"/);
  assert.match(html, /data-mobile-sticky-cta[\s\S]*Вземи програмата - 0,50 €/);
});

test("summer program fit section uses specific emotional cards and a direct checkout CTA", () => {
  const html = read("summer-program.html");
  const fitSection = html.match(/<section id="summer-fit"[\s\S]*?<\/section>/)?.[0] || "";

  assert.match(fitSection, /Тази програма е за теб, ако искаш лятото да работи за развитието ти/);
  assert.match(
    fitSection,
    /Не е нужно да тренираш хаотично\. Нужно е да знаеш какво да правиш, кога да го правиш и защо го правиш\./
  );
  [
    "Играч, който иска структура",
    "Родител, който търси ясен план",
    "Футболист в клуб",
    "Играч, който иска предимство",
  ].forEach((copy) => assert.match(fitSection, new RegExp(copy)));

  assert.match(fitSection, /Разпозна ли се\?/);
  assert.match(fitSection, /Вземи програмата и започни с ясен план\./);
  assert.equal((fitSection.match(/class="summer-fit-icon"/g) || []).length, 4);
  assert.match(fitSection, /class="summer-fit-grid"/);
  assert.match(fitSection, /class="summer-fit-cta"/);
  assert.match(fitSection, /data-summer-checkout/);
  assert.match(fitSection, /data-primary-cta/);
});

test("summer program vision section shows the imagined end-of-summer outcome before benefits", () => {
  const html = read("summer-program.html");
  const solutionIndex = html.indexOf('id="summer-solution"');
  const visionIndex = html.indexOf('id="summer-vision"');
  const benefitsIndex = html.indexOf('id="summer-benefits"');
  const visionSection = html.match(/<section id="summer-vision"[\s\S]*?<\/section>/)?.[0] || "";

  assert.ok(solutionIndex >= 0 && visionIndex > solutionIndex && benefitsIndex > visionIndex);
  assert.match(visionSection, /ПРЕДСТАВИ СИ КРАЯ НА ЛЯТОТО/);
  assert.match(
    visionSection,
    /Само няколко седмици постоянна работа могат да променят начина, по който играчът влиза в новия сезон\./
  );
  [
    "По-уверен първи допир",
    "По-бърза реакция",
    "По-добра физическа подготовка",
    "По-голяма увереност",
    "По-малко загубено време",
    "По-лесно връщане към клубните тренировки",
  ].forEach((copy) => assert.match(visionSection, new RegExp(copy)));

  assert.equal((visionSection.match(/class="summer-vision-icon"/g) || []).length, 6);
  assert.match(visionSection, /class="summer-vision-grid"/);
});

test("summer program problem section uses premium emotional cards and bridges into the solution", () => {
  const html = read("summer-program.html");
  const problemSection = html.match(/<section id="summer-problem"[\s\S]*?<\/section>/)?.[0] || "";

  assert.match(problemSection, /Лятото без ясен план може да те върне една крачка назад/);
  assert.match(
    problemSection,
    /Желанието да тренираш не е достатъчно, ако всяка тренировка е случайна, натоварването е непоследователно\s+и не знаеш какво качество развиваш\./
  );
  [
    "Тренираш без посока",
    "Губиш постоянство",
    "Не знаеш дали напредваш",
    "Връщаш се неподготвен",
  ].forEach((copy) => assert.match(problemSection, new RegExp(copy)));

  assert.equal((problemSection.match(/class="summer-problem-icon"/g) || []).length, 4);
  assert.equal((problemSection.match(/class="summer-problem-number"/g) || []).length, 4);
  assert.match(problemSection, /class="summer-problem-grid"/);
  assert.match(problemSection, /class="summer-problem-bridge"/);
  assert.match(problemSection, /Проблемът не е липсата на желание\./);
  assert.match(problemSection, /Проблемът е липсата на система\./);
});

test("summer program guarantee section uses larger icon trust cards", () => {
  const html = read("summer-program.html");
  const guaranteeSection = html.match(/<section id="summer-guarantee"[\s\S]*?<\/section>/)?.[0] || "";

  [
    "Сигурно плащане чрез Stripe",
    "Достъп веднага след плащане",
    "Получаваш програмата на имейл",
    "Няма месечни такси",
  ].forEach((copy) => assert.match(guaranteeSection, new RegExp(copy)));

  assert.equal((guaranteeSection.match(/class="summer-guarantee-icon"/g) || []).length, 4);
  assert.match(guaranteeSection, /class="summer-guarantee-grid"/);
  assert.doesNotMatch(guaranteeSection, /Поддръжка при въпроси/);
});

test("summer program player proof cards mirror the official authority player cards", () => {
  const html = read("summer-program.html");
  const proofSection = html.match(/<section id="summer-proof"[\s\S]*?<\/section>/)?.[0] || "";

  assert.equal((proofSection.match(/class="summer-player-card summer-player-profile-card"/g) || []).length, 3);
  assert.equal((proofSection.match(/class="summer-player-photo"/g) || []).length, 3);
  assert.equal((proofSection.match(/class="summer-player-detail-block summer-player-profile-facts"/g) || []).length, 3);
  assert.equal((proofSection.match(/class="summer-player-detail-block summer-player-achievements"/g) || []).length, 3);
  assert.equal((proofSection.match(/class="summer-player-fact-row"/g) || []).length, 9);
  assert.doesNotMatch(proofSection, /summer-player-badge|Онлайн подготовка/);

  ["Играе за:", "Години:", "Позиция:", "Отличия:"].forEach((label) => {
    assert.match(proofSection, new RegExp(label));
  });

  assert.match(proofSection, /100\+ мача в професионалния футбол/);
  assert.match(proofSection, /3-ти голмайстор във Втора лига - 14 гола/);
  assert.match(proofSection, /Националка на България U15/);
  assert.match(proofSection, /Играч на Brooke House \(Англия\)/);
  assert.match(proofSection, /80\+ мача в професионалния футбол/);
  assert.match(proofSection, /Участник на UEFA EURO U19/);
});

test("summer program landing has isolated premium responsive styling", () => {
  const html = read("summer-program.html");
  const css = read("summer-program.css");

  assert.match(html, /summer-program\.css/);
  assert.match(css, /#050505/);
  assert.match(css, /#f5c400|245,\s*196,\s*0/);
  assert.match(css, /\.summer-mobile-sticky/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /\.summer-section-cta/);
  assert.match(css, /\.summer-mobile-sticky\.is-visible/);
});

test("summer program tracker emits the approved anonymous commerce funnel", () => {
  const script = read("summer-program.js");

  [
    "page_view",
    "scroll_25",
    "scroll_50",
    "scroll_75",
    "scroll_90",
    "view_problem",
    "view_solution",
    "view_program_contents",
    "view_price",
    "view_product_preview",
    "view_coach",
    "view_testimonials",
    "view_explainer_video",
    "view_training_videos",
    "play_explainer_video",
    "click_primary_cta",
    "checkout_started",
    "checkout_created",
    "checkout_error",
  ].forEach((eventName) => assert.match(script, new RegExp(eventName)));

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((field) => {
    assert.match(script, new RegExp(field));
  });

  assert.match(script, /pageVariant\s*=\s*"summer-program"/);
  assert.match(script, /sessionStorage/);
  assert.match(script, /crypto\.randomUUID/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /data-lazy-video/);
  assert.match(script, /data-src/);
  assert.match(script, /rootMargin:\s*"700px 0px"/);
  assert.match(script, /\/api\/landing-analytics/);
  assert.doesNotMatch(script, /analyticsPayload[\s\S]{0,900}\b(name|phone|email)\s*:/);
});

test("summer program CTA creates checkout only for the summer program", () => {
  const script = read("summer-program.js");

  assert.match(script, /\/api\/create-checkout-session/);
  assert.match(script, /items:\s*\["summer-program"\]/);
  assert.match(script, /checkout_started/);
  assert.match(script, /checkout_created/);
  assert.match(script, /checkout_error/);
  assert.match(script, /window\.location\.href\s*=\s*data\.url/);
  assert.match(script, /data-mobile-sticky-cta/);
  assert.match(script, /is-visible/);
  assert.match(script, /scrollY\s*>\s*80/);
});

test("checkout copies anonymous landing attribution into Stripe metadata", () => {
  const endpoint = read("api/create-checkout-session.js");
  const shared = read("api/_shared.js");

  [
    "landingSessionId",
    "landingPageUrl",
    "pageVariant",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "referrer",
    "deviceType",
  ].forEach((field) => assert.match(`${endpoint}\n${shared}`, new RegExp(field)));
  assert.match(shared, /landingSessionId:\s*attribution\.landingSessionId/);
  assert.match(shared, /body\.append\(`metadata\[\$\{key\}\]`/);
  assert.match(shared, /body\.append\(`payment_intent_data\[metadata\]\[\$\{key\}\]`/);
});

test("analytics API accepts summer funnel events but reserves purchases for the webhook", () => {
  const endpoint = read("api/landing-analytics.js");
  const publicEvents = endpoint.match(/const EVENT_NAMES[\s\S]*?\]\);/)?.[0] || "";

  [
    "scroll_25",
    "scroll_75",
    "view_problem",
    "view_solution",
    "view_program_contents",
    "view_price",
    "view_product_preview",
    "view_coach",
    "view_testimonials",
    "view_explainer_video",
    "view_training_videos",
    "play_explainer_video",
    "checkout_started",
    "checkout_created",
    "checkout_error",
  ].forEach((eventName) => assert.match(publicEvents, new RegExp(eventName)));

  assert.doesNotMatch(publicEvents, /purchase_completed/);
});

test("purchase completion is written only by the verified Stripe webhook", () => {
  const browser = read("summer-program.js");
  const analyticsApi = read("api/landing-analytics.js");
  const webhook = read("api/stripe/webhook.js");
  const schema = read("supabase/schema.sql");

  assert.doesNotMatch(browser, /track\(["']purchase_completed/);
  assert.doesNotMatch(analyticsApi.match(/const EVENT_NAMES[\s\S]*?\]\);/)?.[0] || "", /purchase_completed/);
  assert.match(webhook, /purchase_completed/);
  assert.match(webhook, /landing_analytics_events/);
  assert.match(webhook, /checkout\.session\.completed/);
  assert.match(schema, /stripe_checkout_session_id/);
  assert.match(schema, /program_id/);
  assert.match(schema, /landing_analytics_purchase_session_idx/);
});

test("admin analytics exposes checkout and purchase metrics", () => {
  const endpoint = read("api/admin/landing-analytics.js");
  const html = read("admin-orders.html");
  const script = read("admin-orders.js");
  const funnelRenderer = script.match(/const analyticsFunnelRows[\s\S]*?\.join\(""\);/)?.[0] || "";

  ["checkoutStarts", "checkoutsCreated", "purchases", "purchaseConversionRate"].forEach((field) => {
    assert.match(endpoint, new RegExp(field));
    assert.match(script, new RegExp(field));
  });
  ["checkoutStarts", "purchases", "purchaseConversionRate"].forEach((field) => {
    assert.match(funnelRenderer, new RegExp(field));
  });
  assert.match(html, /Checkout Starts/);
  assert.match(html, /Purchases/);
  assert.match(html, /Purchase Conversion/);
  assert.equal((html.match(/<th>Checkout Starts<\/th>/g) || []).length, 3);
  assert.equal((html.match(/<th>Purchases<\/th>/g) || []).length, 3);
  assert.equal((html.match(/<th>Purchase Conversion<\/th>/g) || []).length, 3);
});

test("Vercel Hobby deployment remains within the function limit", () => {
  const functionFiles = fs
    .readdirSync(path.join(root, "api"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js") && entry.name !== "_shared.js");

  assert.ok(functionFiles.length <= 12, `Expected at most 12 functions, found ${functionFiles.length}`);
});
