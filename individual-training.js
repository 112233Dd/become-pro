(() => {
  const EVENT_NAMES = new Set([
    "page_view",
    "scroll_25",
    "scroll_50",
    "scroll_75",
    "scroll_90",
    "click_primary_cta",
    "click_secondary_cta",
    "click_sticky_cta",
    "form_start",
    "form_submit_success",
    "form_submit_error",
  ]);
  const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const VARIANT_BY_PATH = new Map([
    ["/training", "general"],
    ["/individual-training", "individual-training"],
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
  let marketingConfig = {};
  let marketingInitialized = false;
  let leadTracked = false;

  const isProduction = () => window.location.hostname === "becomeprofootball.com";
  const hasMarketingConsent = () => {
    const storedConsent = localStorage.getItem("bp_marketing_consent");
    if (storedConsent) return storedConsent === "granted";
    return true;
  };
  const loadScript = (src, id) =>
    new Promise((resolve, reject) => {
      if (id && document.getElementById(id)) return resolve();
      const script = document.createElement("script");
      script.async = true;
      script.src = src;
      if (id) script.id = id;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

  const initMarketingTracking = async () => {
    if (marketingInitialized || !isProduction() || !hasMarketingConsent()) return;
    try {
      const response = await fetch("/api/landing-analytics", { method: "GET", headers: { Accept: "application/json" } });
      if (!response.ok) return;
      marketingConfig = await response.json();

      if (marketingConfig.ga4MeasurementId && !window.gtag) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
          window.dataLayer.push(arguments);
        };
        window.gtag("js", new Date());
        window.gtag("config", marketingConfig.ga4MeasurementId, { send_page_view: true });
        await loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(marketingConfig.ga4MeasurementId)}`, "bp-ga4");
      }

      if (marketingConfig.metaPixelId && !window.fbq) {
        window.fbq = function fbq() {
          window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
        };
        window.fbq.push = window.fbq;
        window.fbq.loaded = true;
        window.fbq.version = "2.0";
        window.fbq.queue = [];
        window.fbq("init", marketingConfig.metaPixelId);
        window.fbq("track", "PageView");
        await loadScript("https://connect.facebook.net/en_US/fbevents.js", "bp-meta-pixel");
      }

      if (marketingConfig.tiktokPixelId && !window.ttq) {
        window.TiktokAnalyticsObject = "ttq";
        const ttq = (window.ttq = window.ttq || []);
        ttq.methods = [
          "page",
          "track",
          "identify",
          "instances",
          "debug",
          "on",
          "off",
          "once",
          "ready",
          "alias",
          "group",
          "enableCookie",
          "disableCookie",
        ];
        ttq.setAndDefer = (target, method) => {
          target[method] = function ttqMethod() {
            target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (let index = 0; index < ttq.methods.length; index += 1) {
          ttq.setAndDefer(ttq, ttq.methods[index]);
        }
        ttq.instance = (pixelId) => {
          const instance = ttq._i[pixelId] || [];
          for (let index = 0; index < ttq.methods.length; index += 1) {
            ttq.setAndDefer(instance, ttq.methods[index]);
          }
          return instance;
        };
        ttq.load = (pixelId) => {
          ttq._i = ttq._i || {};
          ttq._i[pixelId] = [];
          ttq._i[pixelId]._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._t = ttq._t || {};
          ttq._t[pixelId] = Date.now();
          ttq._o = ttq._o || {};
          ttq._o[pixelId] = {};
          loadScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(pixelId)}&lib=ttq`, "bp-tiktok-pixel");
        };
        ttq.load(marketingConfig.tiktokPixelId);
        ttq.page();
      }

      marketingInitialized = true;
    } catch (error) {
      console.warn("Marketing tracking was not initialized.");
    }
  };

  const sendMarketingEvent = (eventName, params = {}) => {
    const safeParams = {
      page_path: window.location.pathname,
      page_title: document.title,
      ...params,
    };
    if (window.gtag) window.gtag("event", eventName, safeParams);
    if (window.fbq && eventName === "training_cta_click") {
      window.fbq("trackCustom", "TrainingCTAClick", {
        cta_location: safeParams.cta_location,
        page_path: safeParams.page_path,
      });
    }
    if (window.fbq && eventName === "generate_lead") {
      window.fbq("track", "Lead", {
        content_name: "individual_training_request",
        lead_type: "individual_training",
      });
    }
    if (window.ttq && eventName === "generate_lead") {
      window.ttq.track("SubmitForm", {
        form_name: "individual_training_request",
        lead_type: "individual_training",
      });
    }
  };

  initMarketingTracking();

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
    if (depth >= 0.25) track("scroll_25", true);
    if (depth >= 0.5) track("scroll_50", true);
    if (depth >= 0.75) track("scroll_75", true);
    if (depth >= 0.9) {
      track("scroll_90", true);
      window.removeEventListener("scroll", onScroll);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const scrollToTarget = (href) => {
    const target = href?.startsWith("#") ? document.querySelector(href) : null;
    if (!target) return false;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
    return true;
  };

  document.querySelectorAll("[data-primary-cta]").forEach((button) => {
    button.addEventListener("click", (event) => {
      track("click_primary_cta");
      sendMarketingEvent("training_cta_click", {
        cta_location: button.dataset.ctaLocation || "middle_section",
      });
      if (button.getAttribute("href")?.startsWith("#")) {
        event.preventDefault();
        scrollToTarget(button.getAttribute("href"));
      }
    });
  });
  const stickyCta = document.querySelector("[data-mobile-sticky-cta]");
  const trainingFormSection = document.getElementById("training-form");
  let isTrainingFormVisible = false;
  stickyCta?.addEventListener("click", () => track("click_sticky_cta"));

  const updateStickyCta = () => {
    if (!stickyCta) return;
    const isMobile = window.matchMedia("(max-width: 620px)").matches;
    const hasScrolled = window.scrollY > 180;
    const formRect = trainingFormSection?.getBoundingClientRect();
    const isNearForm = !!formRect && formRect.top < window.innerHeight * 0.88 && formRect.bottom > 0;
    stickyCta.classList.toggle("is-visible", isMobile && hasScrolled && !isNearForm && !isTrainingFormVisible);
  };
  if (trainingFormSection && "IntersectionObserver" in window) {
    const formObserver = new IntersectionObserver(
      (entries) => {
        isTrainingFormVisible = entries.some((entry) => entry.isIntersecting);
        updateStickyCta();
      },
      { threshold: 0.05 },
    );
    formObserver.observe(trainingFormSection);
  }
  updateStickyCta();
  window.addEventListener("scroll", updateStickyCta, { passive: true });
  window.addEventListener("resize", updateStickyCta);

  document.querySelectorAll("[data-secondary-cta]").forEach((button) => {
    button.addEventListener("click", (event) => {
      track("click_secondary_cta");
      if (button.getAttribute("href")?.startsWith("#")) {
        event.preventDefault();
        scrollToTarget(button.getAttribute("href"));
      }
    });
  });

  const form = document.querySelector("[data-training-landing-form]");
  const formStatus = document.querySelector("[data-landing-form-status]");
  const cityInput = form?.querySelector('[name="city"]');
  const suggestedCity = CITY_BY_VARIANT.get(pageVariant);
  if (cityInput && suggestedCity && !cityInput.value) {
    cityInput.value = suggestedCity;
  }
  let marketingFormStarted = false;
  const markFormStart = () => {
    track("form_start", true);
    if (!marketingFormStarted) {
      marketingFormStarted = true;
      sendMarketingEvent("training_form_start", {
        form_name: "individual_training_request",
      });
    }
  };
  ["focusin", "input", "change"].forEach((eventName) => form?.addEventListener(eventName, markFormStart));

  const getFieldValue = (formData, key) => String(formData.get(key) || "").trim();
  const validateTrainingForm = (formData) => {
    if (!getFieldValue(formData, "applicant_type")) return "Моля, избери кого искаш да запишеш.";
    if (getFieldValue(formData, "name").length < 2) return "Моля, въведи име.";
    if (getFieldValue(formData, "city").length < 2) return "Моля, въведи град.";
    if (getFieldValue(formData, "phone").length < 6) return "Моля, въведи валиден телефонен номер.";
    if (formData.get("consent") !== "yes") return "Моля, потвърди съгласието за връзка.";
    return "";
  };

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const originalText = submitButton.textContent;
    const validationError = validateTrainingForm(formData);

    if (validationError) {
      track("form_submit_error");
      formStatus.textContent = validationError;
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Изпращане...";
    formStatus.textContent = "Изпращаме заявката...";

    const payload = {
      applicantType: formData.get("applicant_type"),
      name: formData.get("name"),
      city: formData.get("city"),
      phone: formData.get("phone"),
      consent: formData.get("consent") === "yes",
      attribution: {
        landingPageUrl,
        pageVariant,
        ...campaign,
        referrer,
        deviceType,
        browser: navigator.userAgent.slice(0, 300),
        sessionId,
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
      if (!leadTracked) {
        leadTracked = true;
        sendMarketingEvent("generate_lead", {
          form_name: "individual_training_request",
          lead_type: "individual_training",
        });
      }
      formStatus.textContent =
        formStatus.dataset.successMessage ||
        "Благодарим! Получихме заявката ти. Ще се свържем с теб, за да уточним подходящ ден и час.";
      form.reset();
    } catch (error) {
      track("form_submit_error");
      sendMarketingEvent("training_form_error", {
        error_type: "submit_failed",
      });
      formStatus.textContent = error.message || "Заявката не беше изпратена. Моля, опитайте отново.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
})();
