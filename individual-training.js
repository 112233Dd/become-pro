(() => {
  const EVENT_NAMES = new Set([
    "page_view",
    "scroll_50",
    "scroll_90",
    "click_primary_cta",
    "click_secondary_cta",
    "form_start",
    "form_submit_success",
    "form_submit_error",
  ]);
  const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const VARIANT_BY_PATH = new Map([
    ["/training", "general"],
    ["/individual-training", "general"],
    ["/training/plovdiv", "plovdiv"],
    ["/training/sofia", "sofia"],
    ["/training/stara-zagora", "stara-zagora"],
    ["/training/parents", "parents"],
    ["/training/players", "players"],
  ]);
  const CITY_BY_VARIANT = new Map([
    ["plovdiv", "Пловдив"],
    ["sofia", "София"],
    ["stara-zagora", "Стара Загора"],
  ]);
  const params = new URLSearchParams(window.location.search);
  const campaign = Object.fromEntries(CAMPAIGN_KEYS.map((key) => [key, (params.get(key) || "").slice(0, 160)]));
  const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/training";
  const pageVariant = VARIANT_BY_PATH.get(normalizedPath) || document.body.dataset.pageVariant || "general";
  document.body.dataset.pageVariant = pageVariant;
  const landingPageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const referrer = document.referrer.slice(0, 500);
  const deviceType = window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop";
  const SESSION_KEY = "bp_landing_session_id";
  const sessionId =
    sessionStorage.getItem(SESSION_KEY) ||
    (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  sessionStorage.setItem(SESSION_KEY, sessionId);

  const onceStorageKey = (eventName) =>
    `bp_landing_once:${sessionId}:${window.location.pathname}:${pageVariant}:${eventName}`;
  const track = (eventName, once = false) => {
    if (!EVENT_NAMES.has(eventName) || (once && sessionStorage.getItem(onceStorageKey(eventName)))) return;
    if (once) sessionStorage.setItem(onceStorageKey(eventName), "1");

    const analyticsPayload = {
      sessionId,
      landingPageUrl,
      pageVariant,
      eventName,
      ...campaign,
      referrer,
      deviceType,
    };
    const body = JSON.stringify(analyticsPayload);
    let sent = false;

    if (navigator.sendBeacon) {
      sent = navigator.sendBeacon("/api/landing-analytics", new Blob([body], { type: "application/json" }));
    }
    if (!sent) {
      fetch("/api/landing-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  };

  track("page_view", true);

  const onScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const depth = window.scrollY / scrollable;
    if (depth >= 0.5) track("scroll_50", true);
    if (depth >= 0.9) {
      track("scroll_90", true);
      window.removeEventListener("scroll", onScroll);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  document.querySelectorAll("[data-primary-cta]").forEach((button) => {
    button.addEventListener("click", () => track("click_primary_cta"));
  });
  document.querySelectorAll("[data-secondary-cta]").forEach((button) => {
    button.addEventListener("click", () => track("click_secondary_cta"));
  });

  const form = document.querySelector("[data-training-landing-form]");
  const formStatus = document.querySelector("[data-landing-form-status]");
  const cityInput = form?.querySelector('[name="city"]');
  const suggestedCity = CITY_BY_VARIANT.get(pageVariant);
  if (cityInput && suggestedCity && !cityInput.value) {
    cityInput.value = suggestedCity;
  }
  const markFormStart = () => track("form_start", true);
  ["focusin", "input", "change"].forEach((eventName) => form?.addEventListener(eventName, markFormStart));

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Изпращане...";
    formStatus.textContent = "Изпращаме заявката...";

    const payload = {
      applicantType: formData.get("applicant_type"),
      name: formData.get("name"),
      city: formData.get("city"),
      phone: formData.get("phone"),
      attribution: {
        landingPageUrl,
        pageVariant,
        ...campaign,
        referrer,
        deviceType,
        browser: navigator.userAgent.slice(0, 300),
      },
    };

    try {
      const response = await fetch("/api/training-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Заявката не беше изпратена.");

      track("form_submit_success");
      formStatus.textContent =
        "Благодаря ви! Заявката е изпратена успешно. Ще се свържем с вас възможно най-скоро.";
      form.reset();
    } catch (error) {
      track("form_submit_error");
      formStatus.textContent = error.message || "Заявката не беше изпратена. Моля, опитайте отново.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
})();
