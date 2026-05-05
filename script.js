const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector("[data-form]");
const formStatus = document.querySelector("[data-form-status]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");

const setTheme = (theme) => {
  document.body.dataset.theme = theme;
  localStorage.setItem("becomeProTheme", theme);
  if (themeLabel) themeLabel.textContent = theme === "light" ? "Черна тема" : "Бяла тема";
};

setTheme(localStorage.getItem("becomeProTheme") || "dark");

const closeNav = () => {
  nav?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

themeToggle?.addEventListener("click", () => {
  setTheme(document.body.dataset.theme === "light" ? "dark" : "light");
});

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

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "Анкетата е изпратена. Ще се свържем с вас за уточняване на ден и час.";
  form.reset();
});

