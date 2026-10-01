(function exposeProgramCatalog(root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) module.exports = catalog;
  if (root) root.BECOME_PRO_PROGRAM_CATALOG = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this, function createProgramCatalog() {
  return Object.freeze({
    "technical-pack": Object.freeze({
      id: "technical-pack",
      name: "Технически пакет",
      title: "Технически пакет",
      price: 24.99,
      priceCents: 2499,
      displayPrice: "24.99 €",
      image: "/assets/program-cover-technical-pack.webp",
      description:
        "За футболисти, които искат да подобрят първото докосване, подаването, дрибъла и завършващия удар.",
    }),
    "strength-level-1": Object.freeze({
      id: "strength-level-1",
      name: "Силова програма — Ниво 1",
      title: "Силова програма — Ниво 1",
      price: 24.99,
      priceCents: 2499,
      displayPrice: "24.99 €",
      image: "/assets/program-cover-strength-level-1.webp",
      description:
        "За начинаещи в силовата подготовка — работа върху стабилност, контрол на тялото и правилна техника.",
    }),
    "strength-level-2": Object.freeze({
      id: "strength-level-2",
      name: "Силова програма — Ниво 2",
      title: "Силова програма — Ниво 2",
      price: 24.99,
      priceCents: 2499,
      displayPrice: "24.99 €",
      image: "/assets/program-cover-strength-level-2.webp",
      description:
        "За футболисти с изградена основа — работа върху сила, експлозивност и издръжливост.",
    }),
    "strength-level-3": Object.freeze({
      id: "strength-level-3",
      name: "Силова програма — Ниво 3",
      title: "Силова програма — Ниво 3",
      price: 24.99,
      priceCents: 2499,
      displayPrice: "24.99 €",
      image: "/assets/program-cover-strength-level-3.webp",
      description:
        "За напреднали футболисти — работа върху мощност, скорост и физическа готовност за високо темпо.",
    }),
    "summer-program": Object.freeze({
      id: "summer-program",
      name: "Лятна програма",
      title: "Лятна програма",
      price: 34.99,
      priceCents: 3499,
      displayPrice: "34.99 €",
      image: "/assets/program-cover-summer.webp",
      archived: true,
      description:
        "Архивирана сезонна програма за футболисти, които искат структурирана подготовка през лятото.",
    }),
    "matchday-pack": Object.freeze({
      id: "matchday-pack",
      name: "Мачов пакет",
      title: "Мачов пакет",
      price: 24.99,
      priceCents: 2499,
      displayPrice: "24.99 €",
      image: "/assets/program-cover-matchday.webp",
      description:
        "За футболисти, които искат подредена подготовка преди мач и насоки за възстановяване след него.",
    }),
  });
});
