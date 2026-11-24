// One checkout for all players. Confirm the bands before enabling sales.
window.winterProgram = {
  productId: 'winter-program-2026-27',
  currency: 'EUR',
  priceMinor: 4499,
  referencePriceMinor: 8999,
  ageGroups: { u12: 'Под 12 години', youth: '12–15 години', senior: '16+ години' },
  checkoutUrl: '', // Verified endpoint accepting age_group as order metadata.
  salesEnabled: false,
  delivery: '',
  bonuses: [
    { title: 'Ball Mastery', detail: 'Над 80 технически упражнения за работа с топката.' },
    { title: 'Хранителен наръчник', detail: 'Насоки за спортно хранене преди и след физическо натоварване.' },
    { title: 'Viber общност', detail: 'Ежедневни задачи за футболна интелигентност, игрово мислене и вземане на решения.' },
  ],
};
