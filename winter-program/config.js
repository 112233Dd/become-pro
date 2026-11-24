// Public product information. Delivery links belong only in server configuration.
const winterProgram = {
  productId: "winter-program-2026-27",
  name: "Become Pro — Winter Program 2026/27",
  weeks: 4,
  currency: "EUR",
  priceMinor: null,
  salesEnabled: false,
  delivery: "",
  ageGroups: {},
  // Approved sample images only: { title, src, alt }.
  previews: [
  {
    "title": "Въведение в програмата",
    "src": "/winter-program/media/sample-2025-introduction.webp",
    "thumb": "/winter-program/media/thumb-sample-2025-introduction.webp",
    "alt": "Въведение в програмата — страница от зимната програма за 2025 г."
  },
  {
    "title": "Как да следваш тренировката",
    "src": "/winter-program/media/sample-2025-reading.webp",
    "thumb": "/winter-program/media/thumb-sample-2025-reading.webp",
    "alt": "Как да следваш тренировката — страница от зимната програма за 2025 г."
  },
  {
    "title": "Примерен седмичен план",
    "src": "/winter-program/media/sample-2025-week.webp",
    "thumb": "/winter-program/media/thumb-sample-2025-week.webp",
    "alt": "Примерен седмичен план — страница от зимната програма за 2025 г."
  }
],
  tracks: [
    { title: "Силова и физическа подготовка", description: "Развиваш сила, издръжливост и координация за движенията на терена.", video: "/winter-program/media/hurdles.mp4", poster: "/winter-program/media/hurdles.jpg", exercise: "Координация с препятствия и пас" },
    { title: "Скоростна и бегова подготовка", description: "Работиш върху първите крачки, ускорението и експлозивността при смяна на темпото.", video: "/assets/videos/individual-speed-explosiveness.mp4", poster: "/assets/videos/individual-speed-explosiveness-540.webp", exercise: "Първи крачки и ускорение" },
    { title: "Техническа подготовка", description: "Свързваш първото докосване със следващото действие — подаване или завършващ удар.", video: "/winter-program/media/finish.mp4", poster: "/winter-program/media/finish.jpg", exercise: "Завършващ удар под ъгъл" }
  ],
  bonuses: [
    { mark: "80+", excerpt: "/winter-program/media/excerpt-2025-mastery.webp", title: "Ball Mastery", detail: "Над 80 упражнения за контрол на топката, включително тренировки с над 1000 докосвания." },
    { mark: "Преди / След", excerpt: "/winter-program/media/excerpt-2025-nutrition.webp", title: "Хранителен наръчник", detail: "Практически насоки за хранене преди и след тренировка или мач, за енергия и възстановяване." },
    { mark: "Viber", excerpt: "/winter-program/media/excerpt-2025-community.webp", title: "Футболна интелигентност", detail: "Общност с ежедневни задачи за анализ на игрови ситуации и вземане на решения." }
  ]
};
if (typeof module !== "undefined" && module.exports) module.exports = winterProgram;
else window.winterProgram = winterProgram;
