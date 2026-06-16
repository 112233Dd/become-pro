(() => {
  const EVENT_NAMES = new Set([
    "page_view", "scroll_25", "scroll_50", "scroll_75", "scroll_90",
    "view_problem", "view_solution", "view_program_contents", "view_product_preview",
    "view_coach", "view_testimonials", "view_explainer_video", "view_training_videos",
    "play_explainer_video", "view_price",
    "click_primary_cta", "checkout_started", "checkout_created", "checkout_error",
  ]);
  const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const params = new URLSearchParams(window.location.search);
  const campaign = Object.fromEntries(CAMPAIGN_KEYS.map((key) => [key, (params.get(key) || "").slice(0, 160)]));
  const landingPageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const pageVariant = "summer-program";
  const referrer = document.referrer.slice(0, 500);
  const deviceType = window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop";
  const SESSION_KEY = "bp_summer_program_session_id";
  const sessionId = sessionStorage.getItem(SESSION_KEY) ||
    (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  sessionStorage.setItem(SESSION_KEY, sessionId);

  const onceKey = (eventName) => `bp_summer_once:${sessionId}:${eventName}`;
  const track = (eventName, once = false) => {
    if (!EVENT_NAMES.has(eventName) || (once && sessionStorage.getItem(onceKey(eventName)))) return;
    if (once) sessionStorage.setItem(onceKey(eventName), "1");
    const analyticsPayload = { sessionId, landingPageUrl, pageVariant, eventName, ...campaign, referrer, deviceType };
    const body = JSON.stringify(analyticsPayload);
    let sent = false;
    if (navigator.sendBeacon) sent = navigator.sendBeacon("/api/landing-analytics", new Blob([body], { type: "application/json" }));
    if (!sent) fetch("/api/landing-analytics", {
      method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true,
    }).catch(() => {});
  };

  track("page_view", true);
  const scrollEvents = [[0.25,"scroll_25"],[0.5,"scroll_50"],[0.75,"scroll_75"],[0.9,"scroll_90"]];
  window.addEventListener("scroll", () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const depth = window.scrollY / scrollable;
    scrollEvents.forEach(([threshold, eventName]) => { if (depth >= threshold) track(eventName, true); });
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting && entry.target.dataset.trackView) {
      track(entry.target.dataset.trackView, true);
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.45 });
  document.querySelectorAll("[data-track-view]").forEach((section) => observer.observe(section));
  document.querySelector("[data-explainer-video]")?.addEventListener("play", () => {
    track("play_explainer_video", true);
  });

  const loadLazyVideo = (video) => {
    if (!video || video.dataset.videoLoaded === "true") return;
    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    });
    video.dataset.videoLoaded = "true";
    video.load();
    if (video.autoplay) {
      video.play().catch(() => {});
    }
  };
  const lazyVideos = [...document.querySelectorAll("video[data-lazy-video]")];
  if ("IntersectionObserver" in window) {
    const lazyVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadLazyVideo(entry.target);
        lazyVideoObserver.unobserve(entry.target);
      });
    }, { rootMargin: "700px 0px", threshold: 0.01 });
    lazyVideos.forEach((video) => lazyVideoObserver.observe(video));
  } else {
    lazyVideos.forEach(loadLazyVideo);
  }

  const mobileStickyCta = document.querySelector("[data-mobile-sticky-cta]");
  let mobileStickyRevealed = false;
  const updateMobileStickyCta = () => {
    if (!mobileStickyCta) return;
    const visible = mobileStickyRevealed || window.scrollY > 80;
    mobileStickyCta.classList.toggle("is-visible", visible);
    mobileStickyCta.style.opacity = visible ? "1" : "0";
    mobileStickyCta.style.pointerEvents = visible ? "auto" : "none";
    mobileStickyCta.style.transform = visible ? "translateY(0)" : "translateY(100%)";
  };
  const revealMobileStickyCta = () => {
    mobileStickyRevealed = true;
    updateMobileStickyCta();
  };
  updateMobileStickyCta();
  window.addEventListener("scroll", updateMobileStickyCta, { passive: true });
  window.addEventListener("wheel", revealMobileStickyCta, { passive: true, once: true });
  window.addEventListener("touchmove", revealMobileStickyCta, { passive: true, once: true });
  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "PageDown", " "].includes(event.key)) revealMobileStickyCta();
  }, { once: true });

  window.summerProgramAnalytics = { sessionId, landingPageUrl, pageVariant, campaign, referrer, deviceType, track };

  const checkoutButtons = [...document.querySelectorAll("[data-summer-checkout]")];
  const checkoutStatus = document.querySelector("[data-summer-checkout-status]");
  let checkoutPending = false;
  const setCheckoutPending = (pending) => {
    checkoutPending = pending;
    checkoutButtons.forEach((button) => {
      button.disabled = pending;
      button.setAttribute("aria-busy", String(pending));
      if (pending) {
        button.dataset.originalText = button.textContent;
        button.textContent = "Отваряме Stripe...";
      } else if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    });
  };
  const startCheckout = async () => {
    if (checkoutPending) return;
    track("click_primary_cta");
    track("checkout_started");
    setCheckoutPending(true);
    if (checkoutStatus) checkoutStatus.textContent = "Подготвяме сигурното плащане...";
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: ["summer-program"],
          attribution: { sessionId, landingPageUrl, pageVariant, ...campaign, referrer, deviceType },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Не успяхме да отворим плащането.");
      track("checkout_created");
      window.location.href = data.url;
    } catch (error) {
      track("checkout_error");
      if (checkoutStatus) checkoutStatus.textContent = error.message || "Плащането не се отвори. Моля, опитай отново.";
      setCheckoutPending(false);
    }
  };
  checkoutButtons.forEach((button) => button.addEventListener("click", startCheckout));
})();
