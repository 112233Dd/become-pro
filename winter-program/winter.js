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
    ["Еднократно ли е плащането?", config.salesEnabled ? "Да. Плащането е еднократно за целия пакет." : "Условията за плащане ще бъдат публикувани с крайната цена."]
  ];
  for (const [question, answer] of questions) {
    const details = node("details");
    details.append(node("summary", question), node("p", answer));
    byId("questions").append(details);
  }
  const priced = Number.isSafeInteger(config.priceMinor) && config.priceMinor > 0;
  if (priced) {
    const price = new Intl.NumberFormat("bg-BG", {style:"currency", currency:config.currency}).format(config.priceMinor / 100);
    document.querySelectorAll("[data-price]").forEach(el => { el.textContent = price; el.hidden = false; });
  }
  if (!priced || !config.salesEnabled || !config.delivery || !Object.keys(config.ageGroups).length) return;
  const form = byId("winter-purchase");
  const status = byId("sale-status");
  const button = form.querySelector("button");
  for (const [key,label] of Object.entries(config.ageGroups)) form.elements.age_group.add(new Option(label,key));
  form.hidden = false;
  status.textContent = config.delivery;
  document.querySelectorAll("[data-offer-link]").forEach(link => {link.textContent = "ВЗЕМИ ЗИМНАТА ПРОГРАМА ↗";});
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({programId:config.productId, ageGroup:form.elements.age_group.value})
      });
      if (!response.ok) throw new Error();
      const checkout = new URL((await response.json()).url);
      if (checkout.origin !== "https://checkout.stripe.com") throw new Error();
      location.assign(checkout.href);
    } catch {
      status.textContent = "Плащането не се отвори. Опитай отново.";
      button.disabled = false;
    }
  });
})();
