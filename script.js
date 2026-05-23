const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector("[data-form]");
const formStatus = document.querySelector("[data-form-status]");
const requestTypeInput = document.querySelector("[data-request-type]");
const selectedProgramInput = document.querySelector("[data-selected-program]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const faqSearch = document.querySelector("[data-faq-search]");

document.body.dataset.theme = "dark";
localStorage.removeItem("becomeProTheme");

const programNames = {
  "technical-pack": "Технически пакет",
  "strength-level-1": "Силова програма — Ниво 1",
  "strength-level-2": "Силова програма — Ниво 2",
  "strength-level-3": "Силова програма — Ниво 3",
  "summer-program": "Лятна програма",
  "matchday-pack": "Мачов пакет",
};

const params = new URLSearchParams(window.location.search);
const requestTypeParam = params.get("type");
const requestType = requestTypeParam === "program" || requestTypeParam === "training" ? requestTypeParam : "";
const selectedProgram = params.get("program") || "";

if (requestTypeInput && requestType) requestTypeInput.value = requestType;
if (selectedProgramInput && selectedProgram) selectedProgramInput.value = programNames[selectedProgram] || selectedProgram;

const initialRequestTypeValue = requestTypeInput?.value || "training";
const initialSelectedProgramValue = selectedProgramInput?.value || "";

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

const getSupabaseClient = () => {
  const config = window.BECOME_PRO_SUPABASE;
  if (!config?.url || !config?.anonKey || !window.supabase) return null;
  return window.supabase.createClient(config.url, config.anonKey);
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (formStatus) formStatus.textContent = "Изпращаме заявката...";

  const formData = new FormData(form);
  const basePayload = {
    request_type: formData.get("request_type") || "training",
    selected_program: formData.get("selected_program") || null,
    who: formData.get("who"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    page_url: window.location.href,
    user_agent: navigator.userAgent,
  };
  const payload = {
    ...basePayload,
    email: formData.get("email") || null,
    player_name: formData.get("player_name") || null,
    player_age: formData.get("player_age") || null,
    city: formData.get("city") || null,
    position: formData.get("position") || null,
    goal: formData.get("goal") || null,
    preferred_time: formData.get("preferred_time") || null,
  };

  try {
    const client = getSupabaseClient();

    if (!client) throw new Error("Supabase is not configured yet.");

    const { error } = await client.from("training_requests").insert(payload);
    if (error) {
      const canRetryWithBasePayload =
        error.message?.includes("schema cache") || error.message?.includes("column");

      if (!canRetryWithBasePayload) throw error;

      const retry = await client.from("training_requests").insert(basePayload);
      if (retry.error) throw retry.error;
    }

    if (formStatus) {
      formStatus.textContent =
        "Заявката е изпратена. Ще се свържем с вас, за да уточним следващата стъпка.";
    }

    form.reset();
    if (requestTypeInput) requestTypeInput.value = initialRequestTypeValue;
    if (selectedProgramInput) selectedProgramInput.value = initialSelectedProgramValue;
  } catch (error) {
    console.error(error);
    if (formStatus) {
      formStatus.textContent =
        "Заявката не се изпрати. Моля, пробвай отново или ни пиши директно на имейл.";
    }
  }
});

