(() => {
  "use strict";
  const config = window.winterProgram;
  for (const card of document.querySelectorAll('[data-variant]')) {
    const level = card.dataset.variant;
    const variant = config?.levels?.[level];
    if (!variant || !Number.isSafeInteger(variant.priceMinor) || variant.priceMinor <= 0) continue;
    if (!variant.terms || !variant.delivery || !variant.checkoutUrl) continue;
    let checkout;
    try {
      checkout = new URL(variant.checkoutUrl, location.origin);
    } catch {
      continue;
    }
    if (checkout.protocol !== 'https:') continue;
    if (!/^[A-Z]{3}$/.test(config.currency || '')) continue;
    card.querySelector('.variant-price').textContent = new Intl.NumberFormat('bg-BG', {
      style: 'currency', currency: config.currency,
    }).format(variant.priceMinor / 100);
    const button = card.querySelector('button');
    const link = document.createElement('a');
    link.className = button.className;
    link.textContent = button.textContent;
    link.setAttribute('aria-label', button.getAttribute('aria-label'));
    link.href = checkout.href;
    link.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('bp:commerce', {
        detail: { event: 'begin_checkout', productId: config.productId, level,
          priceMinor: variant.priceMinor, currency: config.currency },
      }));
    });
    card.querySelector('.variant-terms').textContent = variant.terms + ' ' + variant.delivery;
    button.replaceWith(link);
  }

  const dock = document.querySelector(".dock");
  if ("IntersectionObserver" in window) {
    const visible = new Set();
    const hero = document.querySelector(".hero");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      dock.hidden = visible.size > 0 || hero.getBoundingClientRect().bottom > 0;
    });
    for (const section of [hero, ...document.querySelectorAll("#offer, .final, footer")])
      observer.observe(section);
  }
})();
