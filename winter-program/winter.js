(() => {
  "use strict";
  const config = window.winterProgram;
  const select = document.querySelector("#offer-level");
  const form = document.querySelector("#interest");
  const status = document.querySelector("#status");
  const buy = document.querySelector("#buy");
  const checkout = document.querySelector("#checkout");
  const submit = form.querySelector("button");
  const storageKey = config.productId + "-level";
  let pending = false;
  let sent = false;

  function track(event, level) {
    // Local, non-identifying events. A consent-aware site analytics adapter may subscribe.
    document.dispatchEvent(
      new CustomEvent("bp:commerce", {
        detail: { event, productId: config.productId, level },
      }),
    );
  }

  const startText = document.querySelector("#start-description").textContent;
  const deliveryText = document.querySelector("#delivery-answer").textContent;

  function checkoutReady(level) {
    return (
      level &&
      Number.isSafeInteger(level.priceMinor) &&
      level.priceMinor > 0 &&
      level.terms &&
      level.delivery &&
      /^https:\/\//.test(level.checkoutUrl)
    );
  }

  function updateLevel(value, userAction = false) {
    if (pending) return;
    select.value = [...select.options].some((option) => option.value === value) ? value : "";
    const id = select.value;
    const level = config.levels[id];
    const ready = Boolean(checkoutReady(level));
    document.querySelector("#start-action").textContent = ready ? "Завърши покупката" : "Заяви интерес";
    document.querySelector("#start-description").textContent = ready ? level.delivery : startText;
    document.querySelector("#delivery-answer").textContent = ready ? level.delivery : deliveryText;
    document.querySelector(".nav-cta").firstChild.textContent = ready ? "Към офертата " : "Заяви интерес ";
    checkout.hidden = !ready;
    form.hidden = ready;
    sent = false;
    status.textContent = "";
    document.querySelector("#offer-title").textContent = ready ? "Твоята програма" : "Заяви интерес";
    if (ready) {
      buy.href = level.checkoutUrl;
      document.querySelector("#price").textContent = new Intl.NumberFormat("bg-BG", {
        style: "currency",
        currency: config.currency,
      }).format(level.priceMinor / 100);
      document.querySelector("#terms").textContent = level.terms + " " + level.delivery;
    } else {
      buy.removeAttribute("href");
    }
    for (const card of document.querySelectorAll("[data-card]")) {
      const active = card.dataset.card === id;
      card.classList.toggle("active", active);
      const link = card.querySelector("a");
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    if (userAction) {
      try {
        sessionStorage.setItem(storageKey, id);
      } catch {
        /* Storage is optional. */
      }
      if (id) track("select_level", id);
    }
  }

  let initial = "";
  try {
    initial = sessionStorage.getItem(storageKey) || "";
  } catch {
    /* Use the blank option. */
  }
  updateLevel(initial);
  select.addEventListener("change", () => updateLevel(select.value, true));
  for (const link of document.querySelectorAll("[data-level]")) {
    link.addEventListener("click", () => {
      updateLevel(link.dataset.level, true);
      select.focus({ preventScroll: true });
    });
  }
  buy.addEventListener("click", () => {
    if (checkoutReady(config.levels[select.value])) track("begin_checkout", select.value);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending || sent || form.hidden || !form.reportValidity()) return;
    if (!/^\+?\d{6,15}$/.test(form.elements.phone.value.replace(/[ ()-]/g, ""))) {
      form.elements.phone.setCustomValidity("Въведи валиден телефонен номер.");
      form.elements.phone.reportValidity();
      return;
    }
    const level = select.value;
    const label = select.selectedOptions[0].textContent;
    pending = true;
    select.disabled = true;
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    status.textContent = "Изпращане…";
    try {
      const response = await fetch("/api/training-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "contact",
          inquiryType: "program_recommendation",
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          phone: form.elements.phone.value.trim(),
          consent: form.elements.consent.checked,
          message: "Заявка за BECOME PRO — WINTER PROGRAM 2026/27. " + label,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error("inquiry_failed");
      sent = true;
      form.reset();
      select.value = level;
      form.hidden = true;
      status.textContent =
        "Получихме заявката ти за „" + label + "“. Ще се свържем с теб за зимната програма.";
      status.focus();
      track("interest_submitted", level);
    } catch {
      status.textContent = "Изпращането не успя. Опитай отново или пиши на become.pro2024@gmail.com.";
    } finally {
      pending = false;
      select.disabled = false;
      submit.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
  form.elements.phone.addEventListener("input", () => form.elements.phone.setCustomValidity(""));

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
    for (const section of [hero, ...document.querySelectorAll("#levels, #offer, .final, footer")])
      observer.observe(section);
  }
})();
