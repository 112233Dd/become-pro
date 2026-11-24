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
  previews: [],
  tracks: [
    { title: "Силова и физическа подготовка", description: "Развиваш сила, издръжливост и координация за движенията на терена.", video: "/winter-program/media/hurdles.mp4", poster: "/winter-program/media/hurdles.jpg", exercise: "Координация с препятствия и пас" },
    { title: "Скоростна и бегова подготовка", description: "Работиш върху първите крачки, ускорението и експлозивността при смяна на темпото.", video: "/assets/videos/individual-speed-explosiveness.mp4", poster: "/assets/videos/individual-speed-explosiveness-540.webp", exercise: "Първи крачки и ускорение" },
    { title: "Техническа подготовка", description: "Свързваш първото докосване със следващото действие — подаване или завършващ удар.", video: "/winter-program/media/finish.mp4", poster: "/winter-program/media/finish.jpg", exercise: "Завършващ удар под ъгъл" }
  ],
  bonuses: [
    { mark: "80+", title: "Ball Mastery", detail: "Над 80 упражнения за контрол на топката, включително тренировки с над 1000 докосвания." },
    { mark: "Преди / След", title: "Хранителен наръчник", detail: "Практически насоки за хранене преди и след тренировка или мач, за енергия и възстановяване." },
    { mark: "Viber", title: "Футболна интелигентност", detail: "Общност с ежедневни задачи за анализ на игрови ситуации и вземане на решения." }
  ]
};
if (typeof module !== "undefined" && module.exports) module.exports = winterProgram;
else window.winterProgram = winterProgram;
