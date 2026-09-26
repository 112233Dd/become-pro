(() => {
  const nav = document.querySelector("[data-matchday-nav]");
  const navToggle = document.querySelector("[data-matchday-nav-toggle]");
  const closeNav = () => {
    nav?.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
  };
  navToggle?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", Boolean(isOpen));
    navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  const EVENT_NAMES = new Set([
    "page_view", "scroll_25", "scroll_50", "scroll_75", "scroll_90",
    "view_problem", "view_solution", "view_program_contents", "view_product_preview",
    "view_testimonials", "view_coach", "view_training_videos", "view_price", "click_primary_cta",
    "checkout_started", "checkout_created", "checkout_error",
  ]);
  const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const params = new URLSearchParams(window.location.search);
  const campaign = Object.fromEntries(CAMPAIGN_KEYS.map((key) => [key, (params.get(key) || "").slice(0, 160)]));
  const landingPageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const pageVariant = "matchday-pack";
  const referrer = document.referrer.slice(0, 500);
  const deviceType = window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop";
  const SESSION_KEY = "bp_matchday_pack_session_id";
  const sessionId = sessionStorage.getItem(SESSION_KEY) ||
    (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  sessionStorage.setItem(SESSION_KEY, sessionId);

  const onceKey = (eventName) => `bp_matchday_once:${sessionId}:${eventName}`;
  const track = (eventName, once = false) => {
    if (!EVENT_NAMES.has(eventName) || (once && sessionStorage.getItem(onceKey(eventName)))) return;
    if (once) sessionStorage.setItem(onceKey(eventName), "1");
    const body = JSON.stringify({
      sessionId, landingPageUrl, pageVariant, eventName, ...campaign, referrer, deviceType,
    });
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
  const scrollEvents = [[0.25, "scroll_25"], [0.5, "scroll_50"], [0.75, "scroll_75"], [0.9, "scroll_90"]];
  window.addEventListener("scroll", () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const depth = window.scrollY / scrollable;
    scrollEvents.forEach(([threshold, eventName]) => {
      if (depth >= threshold) track(eventName, true);
    });
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    const viewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !entry.target.dataset.trackView) return;
        track(entry.target.dataset.trackView, true);
        viewObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll("[data-track-view]").forEach((section) => viewObserver.observe(section));
  }

  const loadLazyVideo = (video) => {
    if (!video || video.dataset.videoLoaded === "true") return;
    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    });
    video.dataset.videoLoaded = "true";
    video.load();
  };
  const lazyVideos = [...document.querySelectorAll("video[data-lazy-video]")];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const constrainedConnection = Boolean(navigator.connection?.saveData);
  const desktopVideo = window.matchMedia("(min-width: 769px)").matches;
  const shouldAutoplayVideo = desktopVideo && !prefersReducedMotion && !constrainedConnection;
  lazyVideos.forEach((video) => {
    const playButton = video.parentElement?.querySelector("[data-video-play]");
    video.controls = false;
    video.autoplay = shouldAutoplayVideo && video.hasAttribute("data-desktop-autoplay");
    if (!shouldAutoplayVideo) {
      video.parentElement?.classList.add("requires-video-play");
      playButton?.addEventListener("click", () => {
        loadLazyVideo(video);
        video.controls = true;
        video.play().catch(() => {});
        video.parentElement?.classList.remove("requires-video-play");
      });
    }
  });
  if (shouldAutoplayVideo && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          loadLazyVideo(video);
          if (video.autoplay) video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      });
    }, { rootMargin: "80px 0px", threshold: 0.35 });
    lazyVideos.forEach((video) => videoObserver.observe(video));
  } else if (shouldAutoplayVideo) {
    lazyVideos.forEach((video) => {
      loadLazyVideo(video);
      if (video.autoplay) video.play().catch(() => {});
    });
  }

  const previewTriggers = [...document.querySelectorAll("[data-matchday-preview-index]")];
  const lightbox = document.querySelector("[data-matchday-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-matchday-lightbox-image]");
  const lightboxTitle = lightbox?.querySelector("[data-matchday-lightbox-title]");
  const lightboxCount = lightbox?.querySelector("[data-matchday-lightbox-count]");
  const lightboxClose = lightbox?.querySelector("[data-matchday-lightbox-close]");
  let activePreviewIndex = 0;
  let lastPreviewTrigger = null;

  const updateLightbox = (index) => {
    if (!previewTriggers.length || !lightboxImage || !lightboxTitle || !lightboxCount) return;
    activePreviewIndex = (index + previewTriggers.length) % previewTriggers.length;
    const trigger = previewTriggers[activePreviewIndex];
    const sourceImage = trigger.querySelector("img");
    const previewTitle = trigger.closest("figure")?.querySelector("figcaption h3")?.textContent || sourceImage?.alt || "Преглед";
    lightboxImage.src = sourceImage?.currentSrc || sourceImage?.src || "";
    lightboxImage.alt = sourceImage?.alt || previewTitle;
    lightboxTitle.textContent = previewTitle;
    lightboxCount.textContent = `${activePreviewIndex + 1} / ${previewTriggers.length}`;
  };

  const closeLightbox = () => {
    if (!lightbox?.open) return;
    lightbox.close();
    document.body.classList.remove("lightbox-open");
    lastPreviewTrigger?.focus();
    updateMobileStickyCta();
  };

  const openLightbox = (index, trigger) => {
    if (!lightbox || typeof lightbox.showModal !== "function") return;
    lastPreviewTrigger = trigger;
    updateLightbox(index);
    document.body.classList.add("lightbox-open");
    lightbox.showModal();
    lightboxClose?.focus();
    updateMobileStickyCta();
  };

  previewTriggers.forEach((trigger, index) => {
    trigger.addEventListener("click", () => openLightbox(index, trigger));
  });
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.querySelector("[data-matchday-lightbox-prev]")?.addEventListener("click", () => updateLightbox(activePreviewIndex - 1));
  lightbox?.querySelector("[data-matchday-lightbox-next]")?.addEventListener("click", () => updateLightbox(activePreviewIndex + 1));
  lightbox?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLightbox();
  });
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (!lightbox?.open) return;
    if (event.key === "ArrowLeft") updateLightbox(activePreviewIndex - 1);
    if (event.key === "ArrowRight") updateLightbox(activePreviewIndex + 1);
  });

  document.querySelectorAll(".matchday-faq details").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        document.querySelectorAll(".matchday-faq details").forEach((otherItem) => {
          if (otherItem !== item) otherItem.removeAttribute("open");
        });
      }
      document.body.classList.toggle("faq-open", Boolean(document.querySelector(".matchday-faq details[open]")));
      updateMobileStickyCta();
    });
  });

  const mobileStickyCta = document.querySelector("[data-mobile-sticky-cta]");
  const visiblePurchaseCtas = new Set();
  let footerVisible = false;
  const updateMobileStickyCta = () => {
    if (!mobileStickyCta) return;
    const visible =
      window.scrollY > 120 &&
      visiblePurchaseCtas.size === 0 &&
      !footerVisible &&
      !lightbox?.open &&
      !document.querySelector(".matchday-faq details[open]");
    mobileStickyCta.classList.toggle("is-visible", visible);
    mobileStickyCta.style.opacity = visible ? "1" : "0";
    mobileStickyCta.style.pointerEvents = visible ? "auto" : "none";
    mobileStickyCta.style.transform = visible ? "translateY(0)" : "translateY(100%)";
  };
  updateMobileStickyCta();
  window.addEventListener("scroll", updateMobileStickyCta, { passive: true });
  if ("IntersectionObserver" in window) {
    const stickyGuardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.matches(".matchday-footer")) {
          footerVisible = entry.isIntersecting;
        } else if (entry.isIntersecting) {
          visiblePurchaseCtas.add(entry.target);
        } else {
          visiblePurchaseCtas.delete(entry.target);
        }
      });
      updateMobileStickyCta();
    }, { threshold: 0.2 });
    document
      .querySelectorAll("[data-primary-cta]:not(.matchday-mobile-sticky [data-primary-cta]), .matchday-footer")
      .forEach((element) => stickyGuardObserver.observe(element));
  }

  window.matchdayPackAnalytics = { sessionId, landingPageUrl, pageVariant, campaign, referrer, deviceType, track };

  const checkoutButtons = [...document.querySelectorAll("[data-matchday-checkout]")];
  const checkoutStatus = document.querySelector("[data-matchday-checkout-status]");
  const checkoutToast = document.querySelector("[data-matchday-checkout-toast]");
  let checkoutToastTimer = null;
  const showCheckoutError = (message) => {
    if (!checkoutToast) return;
    window.clearTimeout(checkoutToastTimer);
    checkoutToast.textContent = message;
    checkoutToast.hidden = false;
    requestAnimationFrame(() => checkoutToast.classList.add("is-visible"));
    checkoutToastTimer = window.setTimeout(() => {
      checkoutToast.classList.remove("is-visible");
      window.setTimeout(() => { checkoutToast.hidden = true; }, 220);
    }, 8000);
  };
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
          items: ["matchday-pack"],
          attribution: { sessionId, landingPageUrl, pageVariant, ...campaign, referrer, deviceType },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Не успяхме да отворим плащането.");
      track("checkout_created");
      window.location.href = data.url;
    } catch (error) {
      track("checkout_error");
      const message = error.message || "Плащането не се отвори. Моля, опитай отново.";
      if (checkoutStatus) checkoutStatus.textContent = message;
      showCheckoutError(message);
      setCheckoutPending(false);
    }
  };

  checkoutButtons.forEach((button) => button.addEventListener("click", startCheckout));
})();
