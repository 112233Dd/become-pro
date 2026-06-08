const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector("[data-form]");
const formStatus = document.querySelector("[data-form-status]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const faqSearch = document.querySelector("[data-faq-search]");

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

