(() => {
  "use strict";
  const config = window.winterProgram;
  const byId = id => document.getElementById(id);
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  config.tracks.forEach((track, index) => {
    const card = node("article");
    const link = node("a", "", "clip");
    link.href = track.video;
    link.setAttribute("aria-label", "Пусни видеото — " + track.exercise);
    const img = node("img");
    img.src = track.poster;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    const icon = node("span", "▶", "play");
    icon.setAttribute("aria-hidden", "true");
    link.append(img, icon);
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const video = node("video");
      video.controls = true;
      video.playsInline = true;
      video.poster = track.poster;
      video.src = track.video;
      video.tabIndex = 0;
      video.setAttribute("aria-label", track.exercise);
      video.addEventListener("play", () => document.querySelectorAll(".tracks video").forEach(other => {
        if (other !== video) other.pause();
      }));
      video.addEventListener("error", () => { video.replaceWith(link); link.focus(); }, {once:true});
      link.replaceWith(video);
      video.focus({preventScroll:true});
      video.play().catch(() => {});
    });
    const copy = node("div", "", "track-copy");
    copy.append(node("small", "0" + (index + 1)), node("h3", track.title), node("p", track.description));
    card.append(link, copy);
    byId("tracks").append(card);
    byId("offer-tracks").append(node("li", track.title));
  });
  config.bonuses.forEach(bonus => {
    const card = node("article", "", "bonus");
    const excerpt = node("figure", "", "bonus-excerpt");
    const image = node("img");
    image.src = bonus.excerpt;
    image.alt = "";
    image.loading = "lazy";
    excerpt.append(image, node("figcaption", "Откъс от изданието за 2025 г."));
    const copy = node("div", "", "bonus-copy");
    copy.append(node("span", bonus.mark, "bonus-mark"), node("h3", bonus.title), node("p", bonus.detail));
    card.append(copy, excerpt);
    byId("bonuses").append(card);
    byId("offer-bonuses").append(node("li", bonus.title));
  });
  const zoom = byId("zoom");
  const magnify = byId("magnify");
  const page = zoom.querySelector(".reader-page");
  function setMagnified(on) {
    page.classList.toggle("magnified", on);
    magnify.setAttribute("aria-pressed", String(on));
    magnify.textContent = on ? "Цяла страница" : "Увеличи";
    page.scrollTo(0, 0);
  }
  magnify.addEventListener("click", () => setMagnified(!page.classList.contains("magnified")));
  config.previews.forEach(sample => {
    const button = node("button");
    button.type = "button";
    button.setAttribute("aria-label", "Увеличи — " + sample.title);
    const img = node("img");
    img.src = sample.thumb || sample.src;
    img.alt = sample.alt;
    img.loading = "lazy";
    button.append(img, node("span", sample.title + " ↗"));
    byId("samples").append(button);
    button.addEventListener("click", () => {
      byId("sample-title").textContent = sample.title;
      zoom.querySelector("img").src = sample.src;
      zoom.querySelector("img").alt = sample.alt;
      setMagnified(false);
      zoom.showModal();
    });
  });
  byId("inside").hidden = !config.previews.length;
  const questions = [
    ["За кого е подходяща програмата?", "За футболисти, които планират самостоятелна подготовка през зимната пауза, както и за родители, които търсят план за детето си."],
    ["Колко седмици продължава?", config.weeks + " седмици."],
    ["Как се адаптира според възрастта?", "При покупка избираш възрастовата група на футболиста. Подготовката е съобразена с нея."],
    ["Какво точно включва?", config.tracks.map(t => t.title).join(", ") + ". Към плана са включени и трите бонуса от офертата."],
    ["Кога мога да започна?", config.startInfo || "Началната дата предстои да бъде обявена."],
    ["Как получавам достъп?", config.delivery || "Начинът за получаване на материалите ще бъде уточнен преди отваряне на продажбите."],
    ["Необходимо ли е оборудване?", config.equipmentInfo || "Точният списък с необходимото оборудване предстои да бъде обявен."],
    ["Мога ли да я комбинирам с клубни тренировки?", "Съгласувай заниманията с клубния си треньор според графика на отбора и времето за възстановяване."],
    ["Какво включва Viber общността?", config.bonuses[2].detail],
    ["Еднократно ли е плащането?", config.salesEnabled ? "Да. Плащането е еднократно за целия пакет." : "Условията за плащане ще бъдат публикувани при отваряне на продажбите."]
  ];
  for (const [question, answer] of questions) {
    const details = node("details");
    details.append(node("summary", question), node("p", answer));
    byId("questions").append(details);
  }
  const form = byId("winter-purchase");
  const select = form.elements.age_group;
  const buy = form.querySelector("button");
  const status = byId("sale-status");
  const clock = form.querySelector(".countdown");
  const digits = clock.querySelectorAll("b");
  const sticky = document.querySelector(".sticky-offer");
  const priceText = document.querySelector("[data-price]");
  const date = new Intl.DateTimeFormat("bg-BG", { day:"numeric", month:"long", timeZone:config.timeZone }).format(new Date(config.launchEndsAt));
  const deadline = new Intl.DateTimeFormat("bg-BG", {hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:config.timeZone}).format(new Date(config.launchEndsAt));
  byId("deadline-label").textContent = "Стартова цена до " + date + ", " + deadline + " ч. (София)";
  for (const [key,label] of Object.entries(config.ageGroups)) select.add(new Option(label,key));
  const configured = config.salesEnabled && config.delivery && select.options.length > 1;
  let lastState = "";
  let seenOffer = false;
  let inOffer = false;
  let pastHero = false;
  const mobile = matchMedia("(max-width: 767px)");
  const sessionKey = config.productId + "-session";
  let sessionId = crypto.randomUUID();
  try {
    sessionId = sessionStorage.getItem(sessionKey) || sessionId;
    sessionStorage.setItem(sessionKey,sessionId);
  } catch {}
  const attribution = {sessionId, landingPageUrl:location.origin + location.pathname, pageVariant:config.productId,
    deviceType:mobile.matches ? "mobile" : "desktop"};
  for (const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"]) attribution[key] = new URLSearchParams(location.search).get(key) || "";
  function track(eventName) {
    if (navigator.doNotTrack === "1") return;
    fetch("/api/landing-analytics",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...attribution,eventName}),keepalive:true}).catch(()=>{});
  }
  document.querySelectorAll("[data-cta]").forEach(link=>link.addEventListener("click",()=>track(link.dataset.cta === "sticky" ? "click_sticky_cta" : "click_primary_cta")));
  function updateSticky() {
    sticky.hidden = !mobile.matches || !pastHero || inOffer || !!document.querySelector("dialog[open]");
  }
  const observer = new IntersectionObserver(entries=>{
    for (const entry of entries) {
      if (entry.target.id === "offer") {
        inOffer = entry.isIntersecting;
        if (inOffer && !seenOffer) { seenOffer = true; track("view_price"); }
      } else pastHero = entry.boundingClientRect.bottom <= 0;
    }
    updateSticky();
  });
  observer.observe(byId("offer"));
  observer.observe(document.querySelector(".hero"));
  mobile.addEventListener("change",updateSticky);
  new MutationObserver(updateSticky).observe(zoom,{attributes:true,attributeFilter:["open"]});
  function renderOffer() {
    const now = Date.now();
    const offer = config.offerAt(now);
    const key = [offer.launch,offer.price,offer.sessionWindow].join("/");
    if (lastState !== key) {
      lastState = key;
      const price = offer.price && (offer.price/100).toLocaleString("bg-BG",{minimumFractionDigits:2,maximumFractionDigits:2}) + " €";
      priceText.hidden = !price;
      priceText.textContent = price ? (offer.launch ? "Стартова цена " : "Цена ") + price : "";
      const note = byId("launch-note");
      note.hidden = !offer.launch;
      note.textContent = offer.launch ? "Стартова цена " + price + " до " + date + "." : "";
      document.querySelector('[data-cta="bonus"]').textContent = "ВЗЕМИ ЦЕЛИЯ ПАКЕТ" + (price ? " ЗА " + price : "") + " →";
      document.querySelector('[data-cta="final"]').textContent = "ВЗЕМИ ПРОГРАМАТА" + (offer.launch ? " НА СТАРТОВА ЦЕНА" : "") + " →";
      sticky.querySelector("strong").textContent = "WINTER PROGRAM" + (price ? " · " + price : "");
      clock.hidden = !offer.launch;
      const available = Boolean(configured && price && offer.sessionWindow);
      buy.hidden = select.parentElement.hidden = !available;
      buy.textContent = price ? "КУПИ ЗИМНАТА ПРОГРАМА — " + price + " →" : "";
      status.textContent = available ? config.delivery : !offer.launch && !price ? "Стартовата оферта приключи. Новата цена предстои да бъде обявена." :
        configured && !offer.sessionWindow ? "Вече отворените плащания могат да се завършат до края на срока." : "Покупките все още не са отворени.";
    }
    if (offer.launch) {
      const seconds = Math.max(0,Math.ceil((offer.until-now)/1000));
      [Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60].forEach((value,i)=>{
        const next = String(value).padStart(2,"0");
        if (digits[i].textContent !== next) digits[i].textContent = next;
      });
    }
    return offer;
  }
  function tick() { if (renderOffer().launch) setTimeout(tick,1000-Date.now()%1000); }
  tick();
  window.addEventListener("pageshow",renderOffer);
  document.addEventListener("visibilitychange",renderOffer);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const shown = lastState;
    const offer = renderOffer();
    if (shown !== lastState || buy.hidden || buy.disabled || !form.reportValidity()) return;
    buy.disabled = true;
    try {
      const response = await fetch("/api/create-checkout-session", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({programId:config.productId,ageGroup:select.value,expectedPriceMinor:offer.price,attribution})
      });
      if (!response.ok) throw new Error();
      const checkout = new URL((await response.json()).url);
      if (checkout.origin !== "https://checkout.stripe.com") throw new Error();
      track("checkout_started");
      location.assign(checkout.href);
    } catch {
      renderOffer();
      if (!buy.hidden) status.textContent = "Плащането не се отвори. Провери цената и опитай отново.";
      buy.disabled = false;
    }
  });
})();