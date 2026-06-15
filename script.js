const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector("[data-form]");
const formStatus = document.querySelector("[data-form-status]");
const contactForm = document.querySelector("[data-contact-form]");
const contactFormStatus = document.querySelector("[data-contact-form-status]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const faqSearch = document.querySelector("[data-faq-search]");
const siteFooter = document.querySelector("[data-site-footer]");

const renderSiteFooter = () => {
  if (!siteFooter) return;

  siteFooter.innerHTML = `
    <div class="footer-main">
      <div class="footer-brand">
        <a class="footer-logo" href="/" aria-label="Become Pro начало">
          <img src="/assets/becomepro-logo.png" alt="" />
          <span>BECOME <strong>PRO</strong></span>
        </a>
        <p>Футболни програми и индивидуални тренировки за целенасочено развитие.</p>
      </div>
      <nav class="footer-column" aria-label="Бързи връзки">
        <h2>Навигация</h2>
        <a href="/programs">Програми</a>
        <a href="/training">Индивидуални тренировки</a>
        <a href="/players">Играчи</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Контакти</a>
      </nav>
      <div class="footer-column">
        <h2>Свържи се с нас</h2>
        <a href="https://www.instagram.com/yordan.zhelew1/" target="_blank" rel="noreferrer">Instagram</a>
        <a href="https://www.tiktok.com/@yordan.zhelew1?lang=en" target="_blank" rel="noreferrer">TikTok</a>
        <a href="mailto:become.pro2024@gmail.com">become.pro2024@gmail.com</a>
        <a href="tel:+359897575257">+359 897 575 257</a>
      </div>
      <nav class="footer-column" aria-label="Правна информация">
        <h2>Правна информация</h2>
        <a href="/privacy-policy">Политика за поверителност</a>
        <a href="/terms">Общи условия</a>
        <a href="/cookie-policy">Политика за бисквитки</a>
        <a href="/refund-policy">Възстановяване на суми</a>
      </nav>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} Become Pro. Всички права запазени.</p>
    </div>
  `;
};

renderSiteFooter();

document.body.dataset.theme = "dark";
localStorage.removeItem("becomeProTheme");

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

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNav);
});

const currentPage = window.location.pathname.split("/").pop() || "index.html";

navLinks.forEach((link) => {
  const href = link.getAttribute("href") || "";
  const linkPage = href.split("#")[0];
  link.classList.toggle("is-active", linkPage === currentPage);
});

const sectionNavLinks = navLinks.filter((link) => link.getAttribute("href")?.startsWith("#"));

const setActiveNavLink = (id) => {
  sectionNavLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
};

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visibleEntry) setActiveNavLink(visibleEntry.target.id);
  },
  {
    rootMargin: "-35% 0px -45% 0px",
    threshold: [0.1, 0.3, 0.55],
  }
);

sectionNavLinks.forEach((link) => {
  const section = document.querySelector(link.getAttribute("href"));
  if (section) sectionObserver.observe(section);
});

document.querySelectorAll(".faq details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    document.querySelectorAll(".faq details").forEach((otherItem) => {
      if (otherItem !== item) otherItem.removeAttribute("open");
    });
  });
});

faqSearch?.addEventListener("input", () => {
  const query = faqSearch.value.trim().toLowerCase();

  document.querySelectorAll(".faq-category-card").forEach((category) => {
    let visibleItems = 0;

    category.querySelectorAll("details").forEach((item) => {
      const isVisible = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !isVisible;
      if (isVisible) visibleItems += 1;
    });

    category.closest(".faq-page").hidden = visibleItems === 0;
  });
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || "Запази място";

  if (formStatus) formStatus.textContent = "Изпращаме заявката...";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Изпращане...";
  }

  const formData = new FormData(form);
  const payload = {
    applicantType: formData.get("applicant_type"),
    name: formData.get("name"),
    city: formData.get("city"),
    phone: formData.get("phone"),
  };

  try {
    const response = await fetch("/api/training-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Заявката не беше изпратена.");

    if (formStatus) {
      formStatus.textContent =
        "Благодаря ви! Отговорите са изпратени успешно. Ще се свържем с вас възможно най-скоро.";
    }

    form.reset();
  } catch (error) {
    console.error(error);
    if (formStatus) {
      formStatus.textContent =
        "Заявката не се изпрати. Моля, пробвай отново или ни пиши директно на имейл.";
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || "Изпрати съобщението";

  if (contactFormStatus) contactFormStatus.textContent = "Изпращаме съобщението...";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Изпращане...";
  }

  const formData = new FormData(contactForm);
  const payload = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    message: formData.get("message"),
    consent: Boolean(formData.get("consent")),
  };

  try {
    const response = await fetch("/api/contact-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Съобщението не беше изпратено.");

    if (contactFormStatus) {
      contactFormStatus.textContent =
        "Благодарим ти! Съобщението е изпратено успешно. Ще се свържем с теб възможно най-скоро.";
    }

    contactForm.reset();
  } catch (error) {
    console.error(error);
    if (contactFormStatus) {
      contactFormStatus.textContent =
        "Съобщението не се изпрати. Моля, пробвай отново или ни пиши директно на имейл.";
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});

