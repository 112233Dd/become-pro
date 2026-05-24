const SHOP_CART_KEY = "becomeProProgramCart";

const shopPrograms = [
  {
    id: "technical-pack",
    title: "Технически пакет",
    price: "€49.99",
    image: "assets/program-cover-technical-pack.png",
    description:
      "Пълна техническа система за футболисти, които искат по-добър контрол, по-уверени действия с топката и повече качество в игра.",
    suitable: "Играчи, които искат цялостно техническо развитие.",
    focus: "Техника • Контрол • Скорост • Увереност",
    problem: "липса на ясна техническа структура и случайна самостоятелна работа",
    result:
      "по-качествени действия с топката, повече спокойствие при първо докосване и по-ясна идея в игра.",
    intro:
      "Техническият пакет е създаден за играчи, които искат самостоятелната работа да има посока. Вместо да правиш случайни упражнения, следваш структура с конкретен технически фокус.",
  },
  {
    id: "strength-level-1",
    title: "Силова програма — Ниво 1",
    price: "€49.99",
    image: "assets/program-cover-strength-level-1.png",
    description:
      "Начална силова програма за футболисти, които искат да изградят стабилна основа, правилна техника и по-добър контрол на тялото.",
    suitable: "Играчи, които започват със силова подготовка.",
    focus: "Основа • Стабилност • Контрол",
    problem: "липса на стабилна физическа основа и сигурна техника на движение",
    result:
      "по-добър контрол на тялото, по-стабилни движения и по-уверен старт в силовата подготовка.",
    intro:
      "Ниво 1 е първата стъпка за футболисти, които искат да изградят сила правилно и безопасно, без хаотично натоварване.",
  },
  {
    id: "strength-level-2",
    title: "Силова програма — Ниво 2",
    price: "€49.99",
    image: "assets/program-cover-strength-level-2.png",
    description:
      "Следващо ниво за футболисти, които вече имат основа и искат повече сила, експлозивност и устойчивост.",
    suitable: "Играчи със средно ниво на подготовка.",
    focus: "Сила • Експлозивност • Издръжливост",
    problem: "нужда от по-сериозно натоварване и по-ясна прогресия",
    result:
      "повече устойчивост, по-добра физическа готовност и по-стабилно присъствие в интензивни ситуации.",
    intro:
      "Ниво 2 надгражда основата чрез по-предизвикателни тренировки и прогресивно натоварване, съобразено с футболния контекст.",
  },
  {
    id: "strength-level-3",
    title: "Силова програма — Ниво 3",
    price: "€49.99",
    image: "assets/program-cover-strength-level-3.png",
    description:
      "Напреднала програма за футболисти, които искат по-висока физическа готовност, повече мощност и по-добро представяне на терена.",
    suitable: "Напреднали играчи.",
    focus: "Мощност • Скорост • Атлетизъм",
    problem: "нужда от по-висока мощност, скорост и физическа готовност",
    result:
      "по-добра атлетична база, повече експлозивност и по-сериозна готовност за високо темпо.",
    intro:
      "Ниво 3 е за играчи, които вече имат силова основа и искат да работят по-целенасочено върху мощност, скорост и атлетизъм.",
  },
  {
    id: "summer-program",
    title: "Лятна програма",
    price: "€49.99",
    image: "assets/program-cover-summer.png",
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
        "Цялостна програма за футболисти, които искат да използват периода извън сезона с ясна структура, вместо да губят форма и посока.",
      ],
      [
        "02",
        "За кого е подходяща",
        "За играчи, които искат структурирана подготовка през лятото/паузата и имат нужда от конкретен план за самостоятелна работа.",
      ],
      [
        "03",
        "Как се използва",
        "Следваш програмата самостоятелно, изпълняваш упражненията по ред и надграждаш постепенно според зададената структура.",
      ],
      [
        "04",
        "Какъв проблем решава",
        "Премахва хаоса от случайните тренировки и дава ясна посока за работа върху техника, физика, дисциплина и постоянство.",
      ],
      [
        "05",
        "Какъв резултат гоним",
        "По-добра подготовка, повече увереност, по-добра дисциплина и по-ясна основа преди следващия тренировъчен период.",
      ],
    ],
  },
  {
    id: "matchday-pack",
    title: "Мачов пакет",
    price: "€49.99",
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
  },
];

const getAssetPath = (program) => `${window.location.pathname.includes("/programs/") ? "../../" : ""}${program.image}`;
const getProgramUrl = (program) => `${window.location.pathname.includes("/programs/") ? "../" : "programs/"}${program.id}/index.html`;
const getCartUrl = () => `${window.location.pathname.includes("/programs/") ? "../../" : ""}cart.html`;
const getCheckoutUrl = (program) =>
  `${window.location.pathname.includes("/programs/") ? "../../" : ""}checkout.html?program=${program.id}`;

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(SHOP_CART_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeCart = (items) => localStorage.setItem(SHOP_CART_KEY, JSON.stringify(items));

const addToCart = (programId) => {
  const cart = readCart();
  if (!cart.includes(programId)) writeCart([...cart, programId]);
  showShopToast("Програмата е добавена в количката.");
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

const renderCartCount = () => {
  document.querySelectorAll("[data-cart-count]").forEach((item) => {
    item.textContent = readCart().length;
  });
};

const benefitCards = [
  ["01", "Ясна структура", "Следваш подредена система за самостоятелна работа."],
  ["02", "Конкретен фокус", "Всяко упражнение има цел и посока."],
  ["03", "Прогресия", "Надграждаш от по-лесно към по-трудно."],
  ["04", "Насоки за изпълнение", "Разбираш не само какво да правиш, а и защо."],
  ["05", "Достъп след покупка", "Получаваш линк към материалите на имейл."],
  ["06", "Работа извън клуба", "Можеш да тренираш допълнително със структура."],
];

const processSteps = [
  "Избираш програмата",
  "Плащаш онлайн или заявяваш покупка",
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

const renderProgramCard = (program, compact = false) => `
  <article class="program-card product-related-card">
    <span class="program-image">
      <img src="${getAssetPath(program)}" alt="Корица на ${program.title}" />
    </span>
    <span class="program-label">${compact ? "Онлайн програма" : "Become Pro"}</span>
    <span class="program-title">${program.title}</span>
    <p class="program-desc">${program.description}</p>
    <div class="program-meta">
      <p><strong>Цена:</strong> ${program.price}</p>
      <p><strong>Фокус:</strong> ${program.focus}</p>
    </div>
    <div class="program-actions">
      <a class="program-buy" href="${getProgramUrl(program)}">Виж програмата</a>
      <button class="program-cart" type="button" data-shop-add="${program.id}">Добави в количка</button>
    </div>
  </article>
`;

const renderProductDetail = () => {
  const root = document.querySelector("[data-product-detail]");
  if (!root) return;

  const program = shopPrograms.find((item) => item.id === root.dataset.programId) || shopPrograms[0];
  const related = shopPrograms.filter((item) => item.id !== program.id).slice(0, 5);
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
        <h1>${program.title}</h1>
        <p class="product-lead">${program.description}</p>
        <div class="product-detail-price"><span>Цена</span><strong>${program.price}</strong></div>
        <div class="product-detail-meta">
          <p><strong>Подходяща за:</strong> ${program.suitable}</p>
          <p><strong>Фокус:</strong> ${program.focus}</p>
        </div>
        <div class="product-actions">
          <button class="btn btn-secondary" type="button" data-shop-add="${program.id}">Добави в количка</button>
          <a class="btn btn-primary" href="${getCheckoutUrl(program)}">Купи сега</a>
        </div>
      </div>
    </section>

    <section class="product-benefits section-dark reveal">
      <div class="section-heading center">
        <p class="eyebrow">Какво получаваш вътре?</p>
        <h2>Всичко най-важно, без излишно претрупване.</h2>
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
        <a class="btn btn-primary" href="${getCheckoutUrl(program)}">Купи сега</a>
      </div>
    </section>
  `;
};

const renderCartPage = () => {
  const root = document.querySelector("[data-cart-page]");
  if (!root) return;

  const selected = readCart()
    .map((id) => shopPrograms.find((program) => program.id === id))
    .filter(Boolean);

  if (!selected.length) {
    root.innerHTML = `
      <section class="cart-page section-dark">
        <div class="section-heading center">
          <p class="eyebrow">Количка</p>
          <h1>Количката е празна.</h1>
          <p>Избери онлайн програма и я добави тук, за да продължиш към заявка за покупка.</p>
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
                    <strong>${program.price}</strong>
                  </div>
                  <button type="button" data-shop-remove="${program.id}">Премахни</button>
                </article>
              `,
            )
            .join("")}
        </div>
        <aside class="cart-summary">
          <span>Общо</span>
          <strong>${selected.length} програма${selected.length > 1 ? "и" : ""}</strong>
          <p>Плащането ще бъде финализирано през checkout/request процеса, без сайтът да съхранява банкови данни.</p>
          <a class="btn btn-primary" href="checkout.html">Продължи към checkout</a>
        </aside>
      </div>
    </section>
  `;
};

const renderCheckoutPage = () => {
  const root = document.querySelector("[data-checkout-page]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const directProgram = shopPrograms.find((program) => program.id === params.get("program"));
  const selected = directProgram
    ? [directProgram]
    : readCart()
        .map((id) => shopPrograms.find((program) => program.id === id))
        .filter(Boolean);
  const programName = selected.map((program) => program.title).join(", ");

  root.innerHTML = `
    <section class="checkout-page section-dark">
      <div class="checkout-copy">
        <p class="eyebrow">Checkout</p>
        <h1>Заявка за покупка</h1>
        <p>Попълни данните си. След това ще получиш потвърждение и инструкции за достъп до програмата.</p>
      </div>
      <form class="contact-form training-survey checkout-form" data-form>
        <input type="hidden" name="request_type" value="program" data-request-type />
        <input type="hidden" name="selected_program" value="${programName}" data-selected-program />
        <label class="full">Избрана програма<input type="text" value="${programName || "Все още няма избрана програма"}" readonly /></label>
        <label class="full">Кого записваш?
          <select name="who" required>
            <option>Моето дете</option>
            <option>Себе си</option>
          </select>
        </label>
        <label class="full">Име и фамилия<input type="text" name="name" required /></label>
        <label class="full">Имейл<input type="email" name="email" required /></label>
        <label class="full">Телефонен номер<input type="tel" name="phone" required /></label>
        <label>Име на футболиста<input type="text" name="player_name" /></label>
        <label>Възраст на футболиста<input type="number" name="player_age" min="6" max="30" /></label>
        <label class="full">Коментар<textarea name="goal" rows="4" placeholder="Напр. коя програма искаш, въпрос за достъп, възраст/позиция на играча"></textarea></label>
        <button class="btn btn-primary full" type="submit">Изпрати заявка за покупка</button>
        <p class="form-status" data-form-status aria-live="polite"></p>
      </form>
    </section>
  `;
};

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-shop-add]");
  if (addButton) addToCart(addButton.dataset.shopAdd);

  const removeButton = event.target.closest("[data-shop-remove]");
  if (removeButton) removeFromCart(removeButton.dataset.shopRemove);
});

renderProductDetail();
renderCartPage();
renderCheckoutPage();
renderCartCount();
