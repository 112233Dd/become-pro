const SHOP_CART_KEY = "becomeProProgramCart";
const LEGACY_SHOP_CART_KEYS = ["becomepro-cart", "becomepro_cart"];

const shopPrograms = [
  {
    id: "summer-program",
    title: "Лятна програма",
    price: "€0.50",
    image: "assets/program-cover-summer.png",
    badge: "🥇 Най-добрият избор за лятото",
    badgeVariant: "featured",
    description:
      "Програма за футболисти, които искат да използват лятото правилно и да се върнат по-подготвени, по-дисциплинирани и по-уверени.",
    suitable: "Играчи, които искат структурирана подготовка през лятото.",
    focus: "Постоянство • Форма • Развитие",
    problem: "липса на структура през ваканционния период",
    result:
      "по-добра дисциплина, повече постоянство и по-ясна подготовка преди следващия период.",
    intro:
      "Лятната програма помага на играча да използва времето извън сезона по-смислено, с ясна структура вместо пауза без посока.",
    descriptionCards: [
      [
        "01",
        "Какво представлява",
        "Най-пълната лятна програма за футболисти, която комбинира физика, техника, скорост и подготовка в една система.",
      ],
      [
        "02",
        "За кого е подходяща",
        "За футболисти, които искат да използват лятото максимално и да се върнат по-подготвени за новия сезон.",
      ],
      [
        "03",
        "Как се използва",
        "Следваш програмите по структура, комбинираш различните направления и работиш по ясен план всяка седмица.",
      ],
      [
        "04",
        "Какъв проблем решава",
        "Премахва хаоса в подготовката и заменя случайните тренировки с ясна система и посока.",
      ],
      [
        "05",
        "Какъв резултат гоним",
        "По-добра физика, повече увереност с топката и по-силна готовност за сезона.",
      ],
    ],
    includedSection: {
      eyebrow: "Включено в програмата",
      title: "В програмата са включени:",
      layout: "three",
      items: [
        ["💪 Фитнес програма – всички 3 нива", "Сила, издръжливост и стабилна физическа основа."],
        ["⚡ Скоростна програма", "Ускорение, експлозивност и по-бърза реакция."],
        ["🎯 Технически пакет", "Контрол, подаване, дрибъл и завършване в един пълен пакет."],
        ["⚽ Бонус: Ball Mastery", "Над 80 упражнения и над 1000 докосвания на тренировка."],
        ["🍽️ Бонус: Хранителен наръчник", "Практични насоки какво да ядеш преди и след мач."],
        [
          "🧠 Бонус: Viber група с ежедневни задачи",
          "Всеки ден допълнителни задачи за футболната интелигентност, мотивация и развитие.",
        ],
      ],
    },
  },
  {
    id: "technical-pack",
    title: "Технически пакет",
    price: "€0.50",
    image: "assets/program-cover-technical-pack.png",
    description:
      "Пълна техническа система за футболисти, които искат по-добър контрол, по-уверени действия с топката и повече качество в игра.",
    suitable: "Играчи, които искат цялостно техническо развитие.",
    focus: "Техника • Контрол • Скорост • Увереност",
    badge: "⭐ 5 програми в 1 пакет",
    problem: "липса на ясна техническа структура и случайна самостоятелна работа",
    result:
      "по-качествени действия с топката, повече спокойствие при първо докосване и по-ясна идея в игра.",
    intro:
      "Техническият пакет е създаден за играчи, които искат самостоятелната работа да има посока. Вместо да правиш случайни упражнения, следваш структура с конкретен технически фокус.",
    descriptionCards: [
      [
        "01",
        "Какво представлява",
        "Пълна техническа система за футболисти, която събира най-важните технически елементи на играта в един пакет.",
      ],
      [
        "02",
        "За кого е подходяща",
        "За футболисти, които искат да изградят по-силна техника и да бъдат по-уверени във всяка ситуация с топката.",
      ],
      [
        "03",
        "Как се използва",
        "Следваш програмите по структура и работиш върху различните технически елементи стъпка по стъпка.",
      ],
      [
        "04",
        "Какъв проблем решава",
        "Помага при несигурно първо докосване, неточни подавания, липса на увереност в дрибъла и завършването.",
      ],
      [
        "05",
        "Какъв резултат гоним",
        "По-добър контрол, по-чисто изпълнение и повече увереност с топката в реална игра.",
      ],
    ],
    includedSection: {
      eyebrow: "Включено в пакета",
      title: "В пакета са включени 5 програми:",
      items: [
        ["⚽ Завършващ удар", "Удари, завършване и повече увереност пред вратата."],
        ["⚽ Първо докосване", "По-добър контрол и подготовка на следващото действие."],
        ["⚽ Подаване", "По-точни и по-уверени подавания в различни ситуации."],
        ["⚽ Дрибъл", "Контрол, смяна на посока и увереност 1v1."],
        ["🎁 ПОДАРЪК: Ball Mastery", "Допълнителна програма с много докосвания и работа върху контрола на топката."],
      ],
    },
  },
  {
    id: "strength-level-1",
    title: "Силова програма — Ниво 1",
    price: "€0.50",
    image: "assets/program-cover-strength-level-1.jfif",
    description:
      "Начална силова програма за футболисти, които искат да изградят стабилна основа, правилна техника и по-добър контрол на тялото.",
    suitable: "Играчи, които започват със силова подготовка.",
    focus: "Основа • Стабилност • Контрол",
    problem: "липса на стабилна физическа основа и сигурна техника на движение",
    result:
      "по-добър контрол на тялото, по-стабилни движения и по-уверен старт в силовата подготовка.",
    intro:
      "Ниво 1 е първата стъпка за футболисти, които искат да изградят сила правилно и безопасно, без хаотично натоварване.",
    descriptionCards: [
      [
        "01",
        "Какво представлява",
        "Силова програма за футболисти 10–12 години, изградена изцяло със собствено тегло и подходяща за тренировки у дома.",
      ],
      [
        "02",
        "За кого е подходяща",
        "За начинаещи футболисти, които искат да изградят силна основа и да развият правилни двигателни навици.",
      ],
      [
        "03",
        "Как се използва",
        "Следваш програмата стъпка по стъпка у дома, без нужда от фитнес уреди или тежести.",
      ],
      [
        "04",
        "Какъв проблем решава",
        "Помага при липса на базова сила, слаб контрол над движенията и несигурна техника.",
      ],
      [
        "05",
        "Какъв резултат гоним",
        "По-добра техника, повече стабилност и първи стъпки към по-силна и здрава физика.",
      ],
    ],
  },
  {
    id: "strength-level-2",
    title: "Силова програма — Ниво 2",
    price: "€0.50",
    image: "assets/program-cover-strength-level-2.jfif",
    description:
      "Следващо ниво за футболисти, които вече имат основа и искат повече сила, експлозивност и устойчивост.",
    suitable: "Играчи със средно ниво на подготовка.",
    focus: "Сила • Експлозивност • Издръжливост",
    problem: "нужда от по-сериозно натоварване и по-ясна прогресия",
    result:
      "повече устойчивост, по-добра физическа готовност и по-стабилно присъствие в интензивни ситуации.",
    intro:
      "Ниво 2 надгражда основата чрез по-предизвикателни тренировки и прогресивно натоварване, съобразено с футболния контекст.",
    descriptionCards: [
      [
        "01",
        "Какво представлява",
        "Силова програма със собствено тегло, създадена за футболисти, които искат да надградят основата си и да тренират по-сериозно.",
      ],
      [
        "02",
        "За кого е подходяща",
        "За футболисти 14+ години, които вече имат опит със силовите тренировки и са готови за следваща стъпка.",
      ],
      [
        "03",
        "Как се използва",
        "Следваш програмата седмица по седмица, като постепенно увеличаваш сериите и повторенията.",
      ],
      [
        "04",
        "Какъв проблем решава",
        "Помага при липса на сила, издръжливост и стабилност, които често се усещат по време на мач.",
      ],
      [
        "05",
        "Какъв резултат гоним",
        "Повече експлозивност, по-здрава мускулатура и по-високо ниво на физическа подготовка на терена.",
      ],
    ],
  },
  {
    id: "strength-level-3",
    title: "Силова програма — Ниво 3",
    price: "€0.50",
    image: "assets/program-cover-strength-level-3.jfif",
    description:
      "Напреднала програма за футболисти, които искат по-висока физическа готовност, повече мощност и по-добро представяне на терена.",
    suitable: "Напреднали играчи.",
    focus: "Мощност • Скорост • Атлетизъм",
    problem: "нужда от по-висока мощност, скорост и физическа готовност",
    result:
      "по-добра атлетична база, повече експлозивност и по-сериозна готовност за високо темпо.",
    intro:
      "Ниво 3 е за играчи, които вече имат силова основа и искат да работят по-целенасочено върху мощност, скорост и атлетизъм.",
    descriptionCards: [
      [
        "01",
        "Какво представлява",
        "Фитнес програма за футболисти, насочена към изграждане на максимална сила, експлозивност и специфична кондиция.",
      ],
      [
        "02",
        "За кого е подходяща",
        "За футболисти 16+ години, които вече имат изградена основа и са готови за по-високо ниво.",
      ],
      [
        "03",
        "Как се използва",
        "Следваш програмата седмица по седмица с прогресивно натоварване — повече серии, повторения и тежести.",
      ],
      [
        "04",
        "Какъв проблем решава",
        "Помага при липса на сила, експлозивност и физическа подготовка за по-интензивен футбол.",
      ],
      [
        "05",
        "Какъв резултат гоним",
        "По-силна физика, повече мощ и подготовка, която доближава играча до професионалното ниво.",
      ],
    ],
  },
  {
    id: "matchday-pack",
    title: "Мачов пакет",
    price: "€0.50",
    image: "assets/program-cover-matchday.png",
    description:
      "Пакет за играчи, които искат да се подготвят по-добре преди мач и да изградят по-добра рутина около представянето си.",
    suitable: "Футболисти, които искат по-добра мачова готовност.",
    focus: "Подготовка • Увереност • Възстановяване",
    problem: "липса на ясна рутина преди и след мач",
    result:
      "по-спокойна подготовка, по-добри навици около мача и по-ясна идея какво да правиш преди важен ден.",
    intro:
      "Мачовият пакет е за играчи, които искат да подходят по-професионално към деня на мача, подготовката и възстановяването.",
    descriptionCards: [
      [
        "01",
        "Какво представлява",
        "MATCHDAY PACK е пълен наръчник за футболисти, който ти показва как да се подготвиш като професионалист преди, по време и след мач.",
      ],
      [
        "02",
        "За кого е подходяща",
        "За футболисти, които искат да влизат по-уверени в мачовете и да бъдат готови физически и психически.",
      ],
      [
        "03",
        "Как се използва",
        "Следваш насоките за хранене, подготовка и възстановяване, плюс бонус тренировки в деня преди мача.",
      ],
      [
        "04",
        "Какъв проблем решава",
        "Премахва хаоса около мачовете и ти дава ясен план какво да правиш преди важен ден.",
      ],
      [
        "05",
        "Какъв резултат гоним",
        "По-добра готовност, повече увереност и максимум от представянето ти, когато има значение.",
      ],
    ],
  },
];

const getAssetPath = (program) => `${window.location.pathname.includes("/programs/") ? "../../" : ""}${program.image}`;
const getProgramUrl = (program) => `${window.location.pathname.includes("/programs/") ? "../" : "programs/"}${program.id}/index.html`;
const getCartUrl = () => `${window.location.pathname.includes("/programs/") ? "../../" : ""}cart.html`;
const parseProgramPrice = (program) => Number(String(program.price).replace(/[^\d.]/g, "")) || 0;
const formatProgramPrice = (value) => `€${value.toFixed(2)}`;
const normalizeCartItems = (items) =>
  [...new Set(Array.isArray(items) ? items : [])].filter(
    (id) => typeof id === "string" && shopPrograms.some((program) => program.id === id),
  );

const writeCart = (items) => {
  try {
    localStorage.setItem(SHOP_CART_KEY, JSON.stringify(normalizeCartItems(items)));
    return true;
  } catch {
    return false;
  }
};

const readCart = () => {
  try {
    const currentValue = localStorage.getItem(SHOP_CART_KEY);
    const legacyValue = LEGACY_SHOP_CART_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    const items = normalizeCartItems(JSON.parse(currentValue || legacyValue || "[]"));
    if (!currentValue && legacyValue) writeCart(items);
    return items;
  } catch {
    return [];
  }
};

const getCartPrograms = () =>
  readCart()
    .map((id) => shopPrograms.find((program) => program.id === id))
    .filter(Boolean);

const getCheckoutPrograms = () => {
  const params = new URLSearchParams(window.location.search);
  const directProgram = shopPrograms.find((program) => program.id === params.get("program"));
  return directProgram ? [directProgram] : getCartPrograms();
};

const addToCart = (programId) => {
  if (!shopPrograms.some((program) => program.id === programId)) return;
  const cart = readCart();
  if (!cart.includes(programId) && !writeCart([...cart, programId])) {
    showShopToast("Количката не можа да бъде запазена. Моля, опитайте отново.");
    return;
  }
  showShopToast("Програмата е добавена в количката.");
  renderCartPage();
  renderCartCount();
};

const removeFromCart = (programId) => {
  writeCart(readCart().filter((id) => id !== programId));
  renderCartPage();
  renderCartCount();
};

const showShopToast = (message) => {
  let toast = document.querySelector("[data-shop-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "shop-toast";
    toast.dataset.shopToast = "";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showShopToast.timeoutId);
  showShopToast.timeoutId = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
};

const startStripeCheckout = async (programIds, trigger) => {
  const items = [...new Set((programIds || []).filter(Boolean))];
  if (!items.length) {
    showShopToast("Няма избрана програма.");
    return;
  }

  const button = trigger?.closest?.("button, a") || trigger || null;
  const originalText = button?.textContent;

  try {
    if (button) {
      button.dataset.originalText = originalText || "";
      button.textContent = "Отваряме Stripe...";
      button.setAttribute("aria-busy", "true");
      if ("disabled" in button) button.disabled = true;
    }

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.error || "Не успяхме да стартираме плащането.");
    window.location.href = data.url;
  } catch {
    showShopToast("Възникна проблем при стартиране на плащането. Моля, опитайте отново.");
    if (button) {
      button.textContent = button.dataset.originalText || originalText || "Купи сега";
      button.removeAttribute("aria-busy");
      if ("disabled" in button) button.disabled = false;
    }
  }
};

const renderCartCount = () => {
  document.querySelectorAll("[data-cart-count]").forEach((item) => {
    item.textContent = readCart().length;
  });
};

const benefitCards = [
  [
    "01",
    "Ясна структура",
    "Следваш подредена система за самостоятелна работа, без да се чудиш какво да тренираш.",
  ],
  [
    "02",
    "Конкретен фокус",
    "Всяко упражнение има ясна цел - техника, контрол, скорост, сила или игрово приложение.",
  ],
  ["03", "Прогресия", "Надграждаш постепенно от по-лесни към по-трудни задачи."],
  ["04", "Насоки за изпълнение", "Разбираш не само какво да правиш, а и защо го правиш."],
  ["05", "Достъп след покупка", "Получаваш линк към материалите на имейла си след успешно плащане."],
  [
    "06",
    "Работа извън клуба",
    "Използваш времето извън отборните тренировки за допълнителна работа с ясна посока.",
  ],
];

const processSteps = [
  "Избираш програмата",
  "Плащаш онлайн",
  "Получаваш линк на имейл",
  "Отваряш програмата в Google Drive",
  "Започваш да следваш структурата",
];

const testimonials = [
  {
    meta: "Играч, 16 г.",
    text: "Най-много ми помогна това, че вече знам какво да тренирам сам, а не просто да правя случайни упражнения.",
  },
  {
    meta: "Родител на играч, 13 г.",
    text: "Структурата ни помогна да разберем върху какво работи детето и какво трябва да повтаря между тренировките.",
  },
  {
    meta: "Играч, 18 г.",
    text: "Харесва ми, че програмата има конкретен фокус и мога да я комбинирам с клубните тренировки.",
  },
];

const getProgramBonusItems = (program) => {
  const lifetimeAccess = [
    "Достъп завинаги",
    "След покупка програмата остава твоя завинаги и можеш да се връщаш към материалите, когато имаш нужда.",
  ];

  const viberCommunity = [
    "Viber група",
    "Получаваш достъп до общност с мотивирани играчи и допълнителна подкрепа около самостоятелната работа.",
  ];

  const clearDirection = [
    "Ясна посока",
    "Знаеш върху какво работиш, защо го правиш и как да използваш програмата извън клубните тренировки.",
  ];

  const bonusByProgram = {
    "technical-pack": [
      [
        "Ball Mastery",
        "Допълнителна програма с много докосвания и работа върху контрола на топката.",
      ],
      viberCommunity,
      lifetimeAccess,
    ],
    "summer-program": [
      ["Ball Mastery", "Над 80 упражнения и над 1000 докосвания на тренировка."],
      ["Хранителен наръчник", "Практични насоки какво да ядеш преди и след мач."],
      [
        "Viber група с ежедневни задачи",
        "Допълнителни задачи за футболна интелигентност, мотивация и развитие през периода на програмата.",
      ],
      lifetimeAccess,
    ],
    "matchday-pack": [
      [
        "Бонус тренировки преди мач",
        "Индивидуални задачи, които можеш да използваш в деня преди мача като част от подготовката.",
      ],
      viberCommunity,
      lifetimeAccess,
    ],
  };

  return bonusByProgram[program.id] || [clearDirection, viberCommunity, lifetimeAccess];
};

const renderProgramCard = (program, compact = false) => `
  <article class="program-card product-related-card">
    <a class="program-image" href="${getProgramUrl(program)}">
      <img src="${getAssetPath(program)}" alt="Корица на ${program.title}" />
    </a>
    <span class="program-label">${compact ? "Онлайн програма" : "Become Pro"}</span>
    <a class="program-title" href="${getProgramUrl(program)}">${program.title}</a>
    <span class="program-price">${program.price}</span>
    <div class="program-meta">
      <p>${program.description}</p>
    </div>
    <div class="program-actions">
      <a class="program-buy" href="${getProgramUrl(program)}">Виж програмата</a>
      <button class="program-cart" type="button" data-shop-add="${program.id}">Добави в количка</button>
      <button class="program-buy" type="button" data-shop-buy="${program.id}">Купи програмата</button>
    </div>
  </article>
`;

const renderProgramStorefront = () => {
  const root = document.querySelector("[data-program-storefront]");
  if (!root) return;

  root.innerHTML = shopPrograms.map((program) => renderProgramCard(program)).join("");
};

const renderProductDetail = () => {
  const root = document.querySelector("[data-product-detail]");
  if (!root) return;

  const program = shopPrograms.find((item) => item.id === root.dataset.programId) || shopPrograms[0];
  const related = shopPrograms.filter((item) => item.id !== program.id).slice(0, 5);
  const bonusItems = getProgramBonusItems(program);
  const includedSection = program.includedSection
    ? `
      <section class="product-included section-dark reveal">
        <div class="section-heading center">
          <p class="eyebrow">${program.includedSection.eyebrow}</p>
          <h2>${program.includedSection.title}</h2>
        </div>
        <div class="product-included-grid ${
          program.includedSection.layout === "three" ? "product-included-grid-three" : ""
        }">
          ${program.includedSection.items
            .map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`)
            .join("")}
        </div>
      </section>
    `
    : "";
  const bonusSection = `
    <section class="product-bonus section-dark reveal">
      <div class="section-heading center">
        <p class="eyebrow">Бонус</p>
        <h2>Допълнително към програмата</h2>
      </div>
      <div class="product-bonus-grid">
        ${bonusItems.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join("")}
      </div>
    </section>
  `;
  const descriptionCards =
    program.descriptionCards ||
    [
      ["01", "Какво представлява", program.intro],
      ["02", "За кого е подходяща", program.suitable],
      [
        "03",
        "Как се използва",
        "Следваш програмата самостоятелно, изпълняваш упражненията с внимание към детайла и надграждаш според структурата.",
      ],
      ["04", "Какъв проблем решава", `Помага при ${program.problem}, като дава по-ясна посока на индивидуалната работа.`],
      ["05", "Какъв резултат гоним", `Целта е ${program.result}`],
    ];

  document.title = `${program.title} | Become Pro`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute("content", program.description);

  root.innerHTML = `
    <section class="product-detail-hero section-dark">
      <div class="product-detail-media reveal">
        <img src="${getAssetPath(program)}" alt="Корица на ${program.title}" />
      </div>
      <div class="product-detail-copy reveal">
        <p class="eyebrow">Онлайн програма</p>
        ${
          program.badge
            ? `<span class="product-badge ${
                program.badgeVariant ? `product-badge-${program.badgeVariant}` : ""
              }">${program.badge}</span>`
            : ""
        }
        <h1>${program.title}</h1>
        <p class="product-lead">${program.description}</p>
        <div class="product-detail-price"><span>Цена</span><strong>${program.price}</strong></div>
        <div class="product-detail-meta">
          <p><strong>Подходяща за:</strong> ${program.suitable}</p>
          <p><strong>Фокус:</strong> ${program.focus}</p>
        </div>
        <div class="product-actions">
          <button class="btn btn-secondary" type="button" data-shop-add="${program.id}">Добави в количка</button>
          <button class="btn btn-primary" type="button" data-shop-buy="${program.id}">Купи програмата</button>
        </div>
      </div>
    </section>

    <section class="product-benefits section-dark reveal">
      <div class="section-heading center">
        <p class="eyebrow">Какво получаваш вътре?</p>
        <h2>Всичко най-важно, без излишно претрупване.</h2>
        <p>Получаваш ясна структура, конкретни упражнения и насоки, за да знаеш какво тренираш, защо го правиш и как да го изпълняваш правилно.</p>
      </div>
      <div class="product-benefit-grid">
        ${benefitCards.map(([number, title, text]) => `<article><span>${number}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}
      </div>
    </section>

    <section class="product-description product-detail-description section-dark reveal product-description-wide">
      <div class="section-heading center">
        <p class="eyebrow">Описание на програмата</p>
        <h2>Какво е, за кого е и каква работа върши.</h2>
      </div>
      <div class="product-description-grid">
        ${descriptionCards
          .map(
            ([number, title, text]) =>
              `<article>${number ? `<span>${number}</span>` : ""}<h3>${title}</h3><p>${text}</p></article>`
          )
          .join("")}
      </div>
    </section>

    ${includedSection}

    ${bonusSection}

    <section class="product-process section-dark reveal">
      <div class="section-heading center">
        <p class="eyebrow">Как работи след покупка?</p>
        <h2>Ясен процес от избора до първата тренировка.</h2>
      </div>
      <div class="product-process-grid">
        ${processSteps.map((step, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><p>${step}</p></article>`).join("")}
      </div>
    </section>

    <section class="product-testimonials section-dark reveal">
      <div class="section-heading center">
        <p class="eyebrow">Какво казват играчите</p>
        <h2>Реалистична обратна връзка за структурата и фокуса.</h2>
      </div>
      <div class="testimonial-grid">
        ${testimonials.map((item) => `<article><p>“${item.text}”</p><strong>${item.meta}</strong></article>`).join("")}
      </div>
    </section>

    <section class="product-related section-dark reveal">
      <div class="section-heading center">
        <p class="eyebrow">Виж и други програми</p>
        <h2>Избери следващата си стъпка.</h2>
      </div>
      <div class="program-grid product-related-grid">
        ${related.map((item) => renderProgramCard(item, true)).join("")}
      </div>
    </section>

    <section class="product-final-cta section-dark reveal">
      <h2>Готов ли си да започнеш?</h2>
      <p>Избери програмата, получи достъп по имейл и започни да тренираш с ясна структура и фокус.</p>
      <div class="product-actions">
        <button class="btn btn-secondary" type="button" data-shop-add="${program.id}">Добави в количка</button>
        <button class="btn btn-primary" type="button" data-shop-buy="${program.id}">Купи програмата</button>
      </div>
    </section>
  `;
};

const renderCartPage = () => {
  const root = document.querySelector("[data-cart-page]");
  if (!root) return;

  const selected = getCartPrograms();
  const total = selected.reduce((sum, program) => sum + parseProgramPrice(program), 0);

  if (!selected.length) {
    root.innerHTML = `
      <section class="cart-page section-dark">
        <div class="section-heading center">
          <p class="eyebrow">Количка</p>
          <h1>Количката е празна.</h1>
          <p>Избери онлайн програма и я добави тук, за да продължиш към сигурно плащане.</p>
          <a class="btn btn-primary" href="programs.html#programs">Виж програмите</a>
        </div>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="cart-page section-dark">
      <div class="section-heading">
        <p class="eyebrow">Количка</p>
        <h1>Избрани програми</h1>
      </div>
      <div class="cart-layout">
        <div class="cart-items">
          ${selected
            .map(
              (program) => `
                <article class="cart-item">
                  <img src="${getAssetPath(program)}" alt="Корица на ${program.title}" />
                  <div>
                    <h3>${program.title}</h3>
                    <p>${program.description}</p>
                    <span class="cart-item-quantity">Количество: 1</span>
                    <strong>${program.price}</strong>
                  </div>
                  <button type="button" data-shop-remove="${program.id}">Премахни</button>
                </article>
              `,
            )
            .join("")}
        </div>
        <aside class="cart-summary">
          <div class="cart-summary-row">
            <span>Брой програми</span>
            <strong>${selected.length}</strong>
          </div>
          <div class="cart-summary-row cart-summary-total">
            <span>Общо</span>
            <strong>${formatProgramPrice(total)}</strong>
          </div>
          <p>Плащането минава през сигурна Stripe Checkout страница. Become Pro не съхранява данни от банкови карти.</p>
          <button class="btn btn-primary" type="button" data-shop-checkout>Продължи към плащане</button>
        </aside>
      </div>
    </section>
  `;
};

const renderCheckoutPage = () => {
  const root = document.querySelector("[data-checkout-page]");
  if (!root) return;

  const selected = getCheckoutPrograms();
  const total = selected.reduce((sum, program) => sum + parseProgramPrice(program), 0);

  if (!selected.length) {
    root.innerHTML = `
      <section class="checkout-page section-dark">
        <div class="section-heading center">
          <p class="eyebrow">Checkout</p>
          <h1>Няма избрана програма.</h1>
          <p>Избери програма или добави продукт в количката, за да продължиш към плащане.</p>
          <a class="btn btn-primary" href="programs.html#programs">Виж програмите</a>
        </div>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="checkout-page section-dark checkout-redirect">
      <div class="checkout-copy">
        <p class="eyebrow">Checkout</p>
        <h1>Плащане с карта</h1>
        <p>Създаваме сигурна Stripe Checkout страница. Become Pro не съхранява данни от банкови карти.</p>
        <div class="checkout-order-summary">
          <span>Обобщение</span>
          ${selected
            .map(
              (program) => `
                <article>
                  <img src="${getAssetPath(program)}" alt="Корица на ${program.title}" />
                  <div>
                    <strong>${program.title}</strong>
                    <p>${program.price}</p>
                  </div>
                </article>
              `,
            )
            .join("")}
          <strong class="checkout-total">${formatProgramPrice(total)}</strong>
        </div>
      </div>
      <div class="checkout-order-summary checkout-direct-card">
        <span>Stripe Checkout</span>
        <p>Ако не бъдеш пренасочен автоматично, натисни бутона по-долу.</p>
        <button class="btn btn-primary" type="button" data-shop-checkout="${selected.map((program) => program.id).join(",")}">Продължи към Stripe</button>
      </div>
    </section>
  `;
  window.setTimeout(() => startStripeCheckout(selected.map((program) => program.id)), 300);
  return;
};

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-shop-add]");
  if (addButton) addToCart(addButton.dataset.shopAdd);

  const removeButton = event.target.closest("[data-shop-remove]");
  if (removeButton) removeFromCart(removeButton.dataset.shopRemove);

  const buyButton = event.target.closest("[data-shop-buy]");
  if (buyButton) startStripeCheckout([buyButton.dataset.shopBuy], buyButton);

  const checkoutButton = event.target.closest("[data-shop-checkout]");
  if (checkoutButton) {
    const directItems = String(checkoutButton.dataset.shopCheckout || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    startStripeCheckout(directItems.length ? directItems : readCart(), checkoutButton);
  }
});

renderProgramStorefront();
renderProductDetail();
renderCartPage();
renderCheckoutPage();
renderCartCount();
