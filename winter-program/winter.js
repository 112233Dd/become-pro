(() => {
  'use strict';
  const config = window.winterProgram;
  const form = document.querySelector('#winter-purchase');
  if (config && form) {
    const formatter = new Intl.NumberFormat('bg-BG', {style: 'currency', currency: config.currency});
    const money = cents => formatter.format(cents / 100);
    document.querySelector('#current-price').textContent = money(config.priceMinor);
    if (config.referencePriceMinor > config.priceMinor) {
      document.querySelector('#previous-price').textContent = money(config.referencePriceMinor);
      document.querySelector('#saving').textContent = 'Спестяваш ' + money(config.referencePriceMinor - config.priceMinor);
    }
    const cards = document.querySelectorAll('.bonus-card');
    config.bonuses.forEach((bonus, index) => {
      cards[index].querySelector('h4').textContent = bonus.title;
      cards[index].querySelector('p').textContent = bonus.detail;
    });
    document.querySelector('#included-extras').textContent = config.bonuses.map(b => b.title).join(' · ');
    const group = form.elements.age_group;
    for (const [value, label] of Object.entries(config.ageGroups)) group.add(new Option(label, value));
    let checkout;
    if (config.checkoutUrl) {
      try { checkout = new URL(config.checkoutUrl, location.origin); } catch { /* Sales stay closed. */ }
    }
    if (config.salesEnabled && config.delivery && checkout?.protocol === 'https:') {
      form.querySelector('label').hidden = false;
      group.disabled = false;
      form.querySelector('button').disabled = false;
      document.querySelector('#sale-status').textContent = config.delivery;
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!Object.hasOwn(config.ageGroups, group.value)) return;
        checkout.searchParams.set('age_group', group.value);
        document.dispatchEvent(new CustomEvent('bp:commerce', {detail: {
          event: 'begin_checkout', productId: config.productId, ageGroup: group.value,
          priceMinor: config.priceMinor, currency: config.currency,
        }}));
        location.assign(checkout.href);
      });
    }
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
