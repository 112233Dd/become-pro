const tableBody = document.querySelector("[data-admin-table]");
const countNode = document.querySelector("[data-admin-count]");
const logoutButton = document.querySelector("[data-admin-logout]");
const searchInput = document.querySelector("[data-admin-search]");
const statusFilterButtons = [...document.querySelectorAll("[data-admin-status-filter]")];
const refreshButton = document.querySelector("[data-admin-refresh]");
const emptyState = document.querySelector("[data-admin-empty]");
const errorState = document.querySelector("[data-admin-error]");

const trainingTableBody = document.querySelector("[data-training-request-table]");
const trainingCountNode = document.querySelector("[data-training-request-count]");
const trainingSearchInput = document.querySelector("[data-training-request-search]");
const trainingStatusButtons = [...document.querySelectorAll("[data-training-request-status-filter]")];
const trainingRefreshButton = document.querySelector("[data-training-request-refresh]");
const trainingEmptyState = document.querySelector("[data-training-request-empty]");
const trainingErrorState = document.querySelector("[data-training-request-error]");
const contactInquiryTableBody = document.querySelector("[data-contact-inquiry-table]");
const contactInquiryCountNode = document.querySelector("[data-contact-inquiry-count]");
const contactInquirySearchInput = document.querySelector("[data-contact-inquiry-search]");
const contactInquiryStatusButtons = [...document.querySelectorAll("[data-contact-inquiry-status-filter]")];
const contactInquiryRefreshButton = document.querySelector("[data-contact-inquiry-refresh]");
const contactInquiryEmptyState = document.querySelector("[data-contact-inquiry-empty]");
const contactInquiryErrorState = document.querySelector("[data-contact-inquiry-error]");
const logTableBody = document.querySelector("[data-admin-log-table]");
const logCountNode = document.querySelector("[data-admin-log-count]");
const logRefreshButton = document.querySelector("[data-admin-log-refresh]");
const logEmptyState = document.querySelector("[data-admin-log-empty]");
const logErrorState = document.querySelector("[data-admin-log-error]");
const stripeDiagnosticsStatus = document.querySelector("[data-stripe-diagnostics-status]");
const stripeDiagnosticsRefreshButton = document.querySelector("[data-stripe-diagnostics-refresh]");
const stripeDiagnosticsError = document.querySelector("[data-stripe-diagnostics-error]");
const stripeDiagnosticsSummary = document.querySelector("[data-stripe-diagnostics-summary]");
const stripeDiagnosticsSessions = document.querySelector("[data-stripe-diagnostics-sessions]");
const landingAnalyticsFilters = document.querySelector("[data-landing-analytics-filters]");
const landingAnalyticsStatus = document.querySelector("[data-landing-analytics-status]");
const landingAnalyticsRefresh = document.querySelector("[data-landing-analytics-refresh]");
const landingAnalyticsReset = document.querySelector("[data-landing-analytics-reset]");
const landingAnalyticsError = document.querySelector("[data-landing-analytics-error]");
const landingAnalyticsSummary = document.querySelector("[data-landing-analytics-summary]");
const landingFunnelTable = document.querySelector("[data-landing-funnel-table]");
const landingVariantTable = document.querySelector("[data-landing-variant-table]");
const landingCampaignTable = document.querySelector("[data-landing-campaign-table]");
const landingComparison = document.querySelector("[data-landing-comparison]");
const dashboardTabs = [...document.querySelectorAll("[data-landing-dashboard-tab]")];
const dashboardPanels = [...document.querySelectorAll("[data-landing-dashboard-panel]")];
const individualDashboardSummary = document.querySelector("[data-individual-dashboard-summary]");
const individualFunnel = document.querySelector("[data-individual-funnel]");
const individualLeadsTable = document.querySelector("[data-individual-leads-table]");
const summerDashboardSummary = document.querySelector("[data-summer-dashboard-summary]");
const summerFunnel = document.querySelector("[data-summer-funnel]");
const summerOrdersTable = document.querySelector("[data-summer-orders-table]");

let orders = [];
let selectedStatus = "all";
let searchTerm = "";
let trainingRequests = [];
let selectedTrainingStatus = "all";
let trainingSearchTerm = "";
let contactInquiries = [];
let selectedContactInquiryStatus = "all";
let contactInquirySearchTerm = "";

const contactInquiryStatusLabels = {
  new: "Ново",
  answered: "Отговорено",
  archived: "Архивирано",
};
let adminLogs = [];
let stripeDiagnostics = null;
let landingAnalytics = null;
let selectedLandingDashboard = "individual";

const trainingStatusLabels = {
  new: "Нова",
  contacted: "Свързан",
  booked: "Записан",
  declined: "Отказан",
};

const orderField = (order, snakeKey, camelKey) => order?.[snakeKey] ?? order?.[camelKey] ?? "";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeStatus = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  return normalized === "cancelled" ? "expired" : normalized;
};

const safeProgramLink = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatPrice = (value) =>
  new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(Number(value || 0));

const formatMinorAmount = (amount, currency = "eur") =>
  new Intl.NumberFormat("bg-BG", { style: "currency", currency: String(currency || "eur").toUpperCase() }).format(
    Number(amount || 0) / 100,
  );

const rate = (part, total) => (total ? `${Number(((part / total) * 100).toFixed(2))}%` : "0%");

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const ymd = (date) => date.toISOString().slice(0, 10);

const analyticsDateRange = () => {
  const form = landingAnalyticsFilters;
  const period = form?.querySelector("[name='period']")?.value || "30d";
  const now = new Date();
  const start = new Date(now);
  if (period === "today") {
    return { start: ymd(now), end: ymd(now) };
  }
  if (period === "7d") {
    start.setDate(start.getDate() - 6);
    return { start: ymd(start), end: ymd(now) };
  }
  if (period === "30d") {
    start.setDate(start.getDate() - 29);
    return { start: ymd(start), end: ymd(now) };
  }
  const formData = form ? new FormData(form) : new FormData();
  return {
    start: String(formData.get("start") || ""),
    end: String(formData.get("end") || ""),
  };
};

const getLandingFilterValues = () => {
  const values = {};
  if (!landingAnalyticsFilters) return values;
  new FormData(landingAnalyticsFilters).forEach((value, key) => {
    if (key === "period" || key === "start" || key === "end") return;
    const cleanValue = String(value || "").trim().toLowerCase();
    if (cleanValue) values[key] = cleanValue;
  });
  return values;
};

const valueMatches = (value, expected, contains = false) => {
  if (!expected) return true;
  const current = String(value || "").toLowerCase();
  return contains ? current.includes(expected) : current === expected;
};

const isInDateRange = (value) => {
  const { start, end } = analyticsDateRange();
  if (!start && !end) return true;
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  if (start && date < new Date(`${start}T00:00:00.000`)) return false;
  if (end && date > new Date(`${end}T23:59:59.999`)) return false;
  return true;
};

const matchesLandingFilters = (row, forcedVariant) => {
  const filters = getLandingFilterValues();
  if (forcedVariant && !valueMatches(row.page_variant, forcedVariant)) return false;
  if (!isInDateRange(row.created_at || row.event_time)) return false;
  return (
    valueMatches(row.landing_page_url, filters.landing_page_url, true) &&
    valueMatches(row.page_variant, filters.page_variant) &&
    valueMatches(row.utm_source, filters.utm_source) &&
    valueMatches(row.utm_medium, filters.utm_medium) &&
    valueMatches(row.utm_campaign, filters.utm_campaign) &&
    valueMatches(row.device_type, filters.device_type)
  );
};

const isSummerOrder = (order) => {
  const programId = orderField(order, "program_id", "programId");
  const programName = orderField(order, "program_name", "programName");
  return String(programId || "").includes("summer-program") || /summer|лятн/i.test(String(programName || ""));
};

const isIndividualTrainingRequest = (request) => {
  const variant = String(request.page_variant || "");
  const url = String(request.landing_page_url || "");
  return (
    variant === "individual-training" ||
    ["plovdiv", "sofia", "stara-zagora", "parents", "players"].includes(variant) ||
    url.includes("/individual-training") ||
    url.includes("/training")
  );
};

const isPaidOrder = (order) => {
  const status = normalizeStatus(orderField(order, "payment_status", "paymentStatus"));
  return status === "paid" || status === "delivery_failed";
};

const setError = (node, message = "") => {
  if (!node) return;
  node.hidden = !message;
  node.textContent = message;
};

const getFilteredOrders = () =>
  orders.filter((order) => {
    const status = normalizeStatus(orderField(order, "payment_status", "paymentStatus"));
    const haystack = [
      orderField(order, "customer_name", "customerName"),
      orderField(order, "customer_email", "customerEmail"),
      orderField(order, "program_name", "programName"),
    ]
      .join(" ")
      .toLowerCase();
    return (selectedStatus === "all" || status === selectedStatus) && (!searchTerm || haystack.includes(searchTerm));
  });

const renderOrders = () => {
  if (!tableBody) return;
  const filteredOrders = getFilteredOrders();
  if (countNode) countNode.textContent = `${filteredOrders.length} поръчки`;
  if (emptyState) emptyState.hidden = filteredOrders.length > 0;

  tableBody.innerHTML = filteredOrders
    .map((order) => {
      const status = normalizeStatus(orderField(order, "payment_status", "paymentStatus"));
      const programLink = safeProgramLink(orderField(order, "program_link", "programLink"));
      return `
        <tr class="is-${escapeHtml(status)}">
          <td>${escapeHtml(formatDate(orderField(order, "created_at", "createdAt")))}</td>
          <td><strong>${escapeHtml(orderField(order, "customer_name", "customerName") || "-")}</strong></td>
          <td>${escapeHtml(orderField(order, "customer_email", "customerEmail") || "-")}</td>
          <td>${escapeHtml(orderField(order, "customer_phone", "customerPhone") || "-")}</td>
          <td>${escapeHtml(orderField(order, "program_name", "programName") || "-")}</td>
          <td>${escapeHtml(formatPrice(orderField(order, "program_price", "programPrice")))}</td>
          <td><mark class="order-status status-${escapeHtml(status)}">${escapeHtml(status)}</mark></td>
          <td><code>${escapeHtml(orderField(order, "stripe_checkout_session_id", "stripeCheckoutSessionId") || "-")}</code></td>
          <td>${programLink ? `<a href="${escapeHtml(programLink)}" target="_blank" rel="noreferrer">Отвори</a>` : "-"}</td>
        </tr>
      `;
    })
    .join("");
};

const getFilteredTrainingRequests = () =>
  trainingRequests.filter((request) => {
    const status = request.status || "new";
    const haystack = [request.applicant_type, request.name, request.city, request.phone].join(" ").toLowerCase();
    return (
      (selectedTrainingStatus === "all" || status === selectedTrainingStatus) &&
      (!trainingSearchTerm || haystack.includes(trainingSearchTerm))
    );
  });

const renderTrainingRequests = () => {
  if (!trainingTableBody) return;
  const filteredRequests = getFilteredTrainingRequests();
  if (trainingCountNode) trainingCountNode.textContent = `${filteredRequests.length} заявки`;
  if (trainingEmptyState) trainingEmptyState.hidden = filteredRequests.length > 0;

  trainingTableBody.innerHTML = filteredRequests
    .map((request) => {
      const status = request.status || "new";
      const options = Object.entries(trainingStatusLabels)
        .map(
          ([value, label]) =>
            `<option value="${value}"${value === status ? " selected" : ""}>${escapeHtml(label)}</option>`,
        )
        .join("");

      return `
        <tr class="training-status-${escapeHtml(status)}">
          <td>${escapeHtml(formatDate(request.created_at))}</td>
          <td>${escapeHtml(request.applicant_type || "-")}</td>
          <td><strong>${escapeHtml(request.name || "-")}</strong></td>
          <td>${escapeHtml(request.city || "-")}</td>
          <td><a href="tel:${escapeHtml(request.phone || "")}">${escapeHtml(request.phone || "-")}</a></td>
          <td>
            <strong>${escapeHtml(request.page_variant || "-")}</strong>
            ${request.landing_page_url ? `<span>${escapeHtml(request.landing_page_url)}</span>` : ""}
          </td>
          <td>
            <strong>${escapeHtml(request.utm_campaign || "-")}</strong>
            ${request.utm_source || request.utm_medium ? `<span>${escapeHtml([request.utm_source, request.utm_medium].filter(Boolean).join(" / "))}</span>` : ""}
          </td>
          <td>
            <select
              class="training-request-status status-${escapeHtml(status)}"
              data-training-request-status
              data-request-id="${escapeHtml(request.id)}"
              aria-label="Статус на заявката"
            >
              ${options}
            </select>
          </td>
        </tr>
      `;
    })
    .join("");
};

const getFilteredContactInquiries = () =>
  contactInquiries.filter((inquiry) => {
    const status = inquiry.status || "new";
    const haystack = [inquiry.name, inquiry.phone, inquiry.email, inquiry.message].join(" ").toLowerCase();
    return (
      (selectedContactInquiryStatus === "all" || status === selectedContactInquiryStatus) &&
      (!contactInquirySearchTerm || haystack.includes(contactInquirySearchTerm))
    );
  });

const renderContactInquiries = () => {
  if (!contactInquiryTableBody) return;
  const filteredInquiries = getFilteredContactInquiries();
  if (contactInquiryCountNode) contactInquiryCountNode.textContent = `${filteredInquiries.length} запитвания`;
  if (contactInquiryEmptyState) contactInquiryEmptyState.hidden = filteredInquiries.length > 0;

  contactInquiryTableBody.innerHTML = filteredInquiries
    .map((inquiry) => {
      const status = inquiry.status || "new";
      const options = Object.entries(contactInquiryStatusLabels)
        .map(
          ([value, label]) =>
            `<option value="${value}"${value === status ? " selected" : ""}>${escapeHtml(label)}</option>`,
        )
        .join("");

      return `
        <tr class="contact-status-${escapeHtml(status)}">
          <td>${escapeHtml(formatDate(inquiry.created_at))}</td>
          <td><strong>${escapeHtml(inquiry.name || "-")}</strong></td>
          <td><a href="tel:${escapeHtml(inquiry.phone || "")}">${escapeHtml(inquiry.phone || "-")}</a></td>
          <td><a href="mailto:${escapeHtml(inquiry.email || "")}">${escapeHtml(inquiry.email || "-")}</a></td>
          <td class="admin-message-cell">${escapeHtml(inquiry.message || "-")}</td>
          <td>
            <select
              class="contact-inquiry-status status-${escapeHtml(status)}"
              data-contact-inquiry-status
              data-inquiry-id="${escapeHtml(inquiry.id)}"
              aria-label="Статус на контактното запитване"
            >
              ${options}
            </select>
          </td>
        </tr>
      `;
    })
    .join("");
};

const analyticsMetricCard = (label, value) => `
  <article class="admin-diagnostic-card">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
  </article>
`;

const dashboardMetricCards = (items) => items.map(([label, value]) => analyticsMetricCard(label, value)).join("");

const renderFunnelVisual = (node, steps) => {
  if (!node) return;
  node.innerHTML = steps
    .map(
      ([label, value], index) => `
        <article class="admin-funnel-step">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          ${index < steps.length - 1 ? '<em aria-hidden="true">→</em>' : ""}
        </article>
      `,
    )
    .join("");
};

const renderComparison = (individualSummary, summerSummary, summerOrders) => {
  if (!landingComparison) return;
  const paidSummerOrders = summerOrders.filter(isPaidOrder);
  const revenue = paidSummerOrders.reduce((sum, order) => sum + Number(orderField(order, "program_price", "programPrice") || 0), 0);
  landingComparison.innerHTML = `
    <article class="admin-comparison-card">
      <span>Individual Training</span>
      <strong>${escapeHtml(individualSummary.pageViews || 0)} visits</strong>
      <p>${escapeHtml(individualSummary.formSubmitSuccess || 0)} leads · ${escapeHtml(formatPercent(individualSummary.conversionRate))} conversion</p>
    </article>
    <article class="admin-comparison-card">
      <span>Summer Program</span>
      <strong>${escapeHtml(summerSummary.pageViews || 0)} visits</strong>
      <p>${escapeHtml(paidSummerOrders.length)} purchases · ${escapeHtml(formatPrice(revenue))} revenue · ${escapeHtml(formatPercent(summerSummary.purchaseConversionRate))} conversion</p>
    </article>
  `;
};

const analyticsRows = (rows = []) =>
  rows
    .map(
      (row) => `
        <tr>
          <td><strong>${escapeHtml(row.name || "-")}</strong></td>
          <td>${escapeHtml(row.pageViews ?? 0)}</td>
          <td>${escapeHtml(row.uniqueSessions ?? 0)}</td>
          <td>${escapeHtml(row.ctaClicks ?? 0)}</td>
          <td>${escapeHtml(row.formStarts ?? 0)}</td>
          <td>${escapeHtml(row.formSubmissions ?? 0)}</td>
          <td>${escapeHtml(row.checkoutStarts ?? 0)}</td>
          <td>${escapeHtml(row.purchases ?? 0)}</td>
          <td>${escapeHtml(`${Number(row.conversionRate || 0).toFixed(2)}%`)}</td>
          <td>${escapeHtml(`${Number(row.purchaseConversionRate || 0).toFixed(2)}%`)}</td>
        </tr>
      `,
    )
    .join("");

const analyticsFunnelRows = (rows = []) =>
  rows
    .map(
      (row) => `
        <tr>
          <td><strong>${escapeHtml(row.name || "-")}</strong></td>
          <td>${escapeHtml(row.pageViews ?? 0)}</td>
          <td>${escapeHtml(row.ctaClicks ?? 0)}</td>
          <td>${escapeHtml(row.formStarts ?? 0)}</td>
          <td>${escapeHtml(row.formSubmissions ?? 0)}</td>
          <td>${escapeHtml(row.checkoutStarts ?? 0)}</td>
          <td>${escapeHtml(row.purchases ?? 0)}</td>
          <td>${escapeHtml(`${Number(row.conversionRate || 0).toFixed(2)}%`)}</td>
          <td>${escapeHtml(`${Number(row.purchaseConversionRate || 0).toFixed(2)}%`)}</td>
        </tr>
      `,
    )
    .join("");

const renderLandingAnalytics = () => {
  if (!landingAnalyticsSummary || !landingFunnelTable || !landingVariantTable || !landingCampaignTable) return;
  const summary = landingAnalytics?.summary || {};
  const individualSummary = landingAnalytics?.dashboards?.individualTraining?.summary || {};
  const summerSummary = landingAnalytics?.dashboards?.summerProgram?.summary || {};
  const filteredLeads = trainingRequests
    .filter((request) => isIndividualTrainingRequest(request) && matchesLandingFilters(request))
    .slice(0, 25);
  const filteredSummerOrders = orders.filter((order) => isSummerOrder(order) && matchesLandingFilters(order));
  const paidSummerOrders = filteredSummerOrders.filter(isPaidOrder);
  const revenue = paidSummerOrders.reduce(
    (sum, order) => sum + Number(orderField(order, "program_price", "programPrice") || 0),
    0,
  );

  renderComparison(individualSummary, summerSummary, filteredSummerOrders);
  if (individualDashboardSummary) {
    individualDashboardSummary.innerHTML = dashboardMetricCards([
      ["Page Views", individualSummary.pageViews || 0],
      ["Unique Sessions", individualSummary.uniqueSessions || 0],
      ["CTA Clicks", individualSummary.primaryCtaClicks || 0],
      ["Secondary CTA Clicks", individualSummary.secondaryCtaClicks || 0],
      ["Scroll 25%", individualSummary.scroll25 || 0],
      ["Scroll 50%", individualSummary.scroll50 || 0],
      ["Scroll 75%", individualSummary.scroll75 || 0],
      ["Scroll 90%", individualSummary.scroll90 || 0],
      ["Form Starts", individualSummary.formStarts || 0],
      ["Form Submit Success", individualSummary.formSubmitSuccess || 0],
      ["Form Submit Error", individualSummary.formSubmitError || 0],
      ["Conversion Rate", formatPercent(individualSummary.conversionRate)],
      ["CTA Conversion Rate", formatPercent(individualSummary.ctaConversionRate)],
    ]);
  }
  renderFunnelVisual(individualFunnel, [
    ["Page Views", individualSummary.pageViews || 0],
    ["CTA Clicks", individualSummary.primaryCtaClicks || 0],
    ["Form Starts", individualSummary.formStarts || 0],
    ["Form Submits", individualSummary.formSubmitSuccess || 0],
  ]);
  if (individualLeadsTable) {
    individualLeadsTable.innerHTML = filteredLeads
      .map(
        (request) => `
          <tr>
            <td>${escapeHtml(formatDate(request.created_at))}</td>
            <td><strong>${escapeHtml(request.name || "-")}</strong></td>
            <td>${escapeHtml(request.city || "-")}</td>
            <td>${escapeHtml(request.phone || "-")}</td>
            <td>${escapeHtml(request.applicant_type || request.who || "-")}</td>
            <td>${escapeHtml(trainingStatusLabels[request.status] || request.status || "new")}</td>
            <td>${escapeHtml(request.page_variant || "-")}</td>
            <td>${escapeHtml(request.utm_source || "-")}</td>
            <td>${escapeHtml(request.utm_medium || "-")}</td>
            <td>${escapeHtml(request.utm_campaign || "-")}</td>
            <td>${escapeHtml(request.referrer || "-")}</td>
          </tr>
        `,
      )
      .join("");
  }
  if (summerDashboardSummary) {
    summerDashboardSummary.innerHTML = dashboardMetricCards([
      ["Page Views", summerSummary.pageViews || 0],
      ["Unique Sessions", summerSummary.uniqueSessions || 0],
      ["CTA Clicks", summerSummary.primaryCtaClicks || 0],
      ["Secondary CTA Clicks", summerSummary.secondaryCtaClicks || 0],
      ["Scroll 25%", summerSummary.scroll25 || 0],
      ["Scroll 50%", summerSummary.scroll50 || 0],
      ["Scroll 75%", summerSummary.scroll75 || 0],
      ["Scroll 90%", summerSummary.scroll90 || 0],
      ["Checkout Started", summerSummary.checkoutStarted || 0],
      ["Checkout Created", summerSummary.checkoutCreated || 0],
      ["Checkout Error", summerSummary.checkoutError || 0],
      ["Purchase Completed", summerSummary.purchaseCompleted || 0],
      ["Conversion Rate", formatPercent(summerSummary.purchaseConversionRate)],
      ["Checkout Conversion Rate", formatPercent(summerSummary.checkoutConversionRate)],
      ["Revenue", formatPrice(revenue)],
      ["Orders Count", paidSummerOrders.length],
    ]);
  }
  renderFunnelVisual(summerFunnel, [
    ["Page Views", summerSummary.pageViews || 0],
    ["CTA Clicks", summerSummary.primaryCtaClicks || 0],
    ["Checkout Started", summerSummary.checkoutStarted || 0],
    ["Purchase Completed", summerSummary.purchaseCompleted || 0],
  ]);
  if (summerOrdersTable) {
    summerOrdersTable.innerHTML = filteredSummerOrders
      .slice(0, 25)
      .map((order) => {
        const status = normalizeStatus(orderField(order, "payment_status", "paymentStatus"));
        return `
          <tr>
            <td>${escapeHtml(formatDate(orderField(order, "created_at", "createdAt")))}</td>
            <td>${escapeHtml(orderField(order, "customer_email", "customerEmail") || "-")}</td>
            <td>${escapeHtml(orderField(order, "program_name", "programName") || "-")}</td>
            <td>${escapeHtml(formatPrice(orderField(order, "program_price", "programPrice")))}</td>
            <td>${escapeHtml(status)}</td>
            <td><code>${escapeHtml(orderField(order, "stripe_checkout_session_id", "stripeCheckoutSessionId") || "-")}</code></td>
            <td>${escapeHtml(orderField(order, "payment_status", "paymentStatus") || "-")}</td>
            <td>${escapeHtml(orderField(order, "page_variant", "pageVariant") || "-")}</td>
            <td>${escapeHtml(orderField(order, "utm_source", "utmSource") || "-")}</td>
            <td>${escapeHtml(orderField(order, "utm_medium", "utmMedium") || "-")}</td>
            <td>${escapeHtml(orderField(order, "utm_campaign", "utmCampaign") || "-")}</td>
            <td>${escapeHtml(orderField(order, "referrer", "referrer") || "-")}</td>
          </tr>
        `;
      })
      .join("");
  }

  landingAnalyticsSummary.innerHTML = [
    ["Общо посещения", summary.pageViews || 0],
    ["Уникални сесии", summary.uniqueSessions || 0],
    ["CTA кликове", summary.ctaClicks || 0],
    ["Започнати форми", summary.formStarts || 0],
    ["Изпратени форми", summary.formSubmissions || 0],
    ["Checkout Starts", summary.checkoutStarts || 0],
    ["Checkouts Created", summary.checkoutsCreated || 0],
    ["Purchases", summary.purchases || 0],
    ["Conversion rate", `${Number(summary.conversionRate || 0).toFixed(2)}%`],
    ["Purchase Conversion", `${Number(summary.purchaseConversionRate || 0).toFixed(2)}%`],
  ]
    .map(([label, value]) => analyticsMetricCard(label, value))
    .join("");
  landingFunnelTable.innerHTML = analyticsFunnelRows(landingAnalytics?.byLandingPage);
  landingVariantTable.innerHTML = analyticsRows(landingAnalytics?.byVariant);
  landingCampaignTable.innerHTML = analyticsRows(landingAnalytics?.byCampaign);
};

const renderAdminLogs = () => {
  if (!logTableBody) return;
  if (logCountNode) logCountNode.textContent = `${adminLogs.length} logs`;
  if (logEmptyState) logEmptyState.hidden = adminLogs.length > 0;

  logTableBody.innerHTML = adminLogs
    .map(
      (log) => `
        <tr class="log-level-${escapeHtml(log.level || "error")}">
          <td>${escapeHtml(formatDate(log.created_at))}</td>
          <td><mark class="order-status status-${escapeHtml(log.level || "error")}">${escapeHtml(log.level || "error")}</mark></td>
          <td>${escapeHtml(log.event || "-")}</td>
          <td>${escapeHtml(log.message || "-")}</td>
          <td><code>${escapeHtml(log.stripe_checkout_session_id || "-")}</code></td>
        </tr>
      `,
    )
    .join("");
};

const renderStripeDiagnostics = () => {
  if (!stripeDiagnosticsSummary || !stripeDiagnosticsSessions) return;

  if (!stripeDiagnostics) {
    stripeDiagnosticsSummary.innerHTML = "";
    stripeDiagnosticsSessions.innerHTML = "";
    if (stripeDiagnosticsStatus) stripeDiagnosticsStatus.textContent = "Not loaded";
    return;
  }

  const account = stripeDiagnostics.account || {};
  const environment = stripeDiagnostics.environment || {};
  const checkoutLabel = stripeDiagnostics.checkoutEnabled ? "ENABLED" : "DISABLED";
  if (stripeDiagnosticsStatus) stripeDiagnosticsStatus.textContent = `Checkout ${checkoutLabel}`;

  const items = [
    ["Stripe account", account.id || "-"],
    ["Secret key mode", environment.stripeSecretKeyMode || "-"],
    ["Checkout", checkoutLabel],
    ["Webhook secret", environment.hasStripeWebhookSecret ? "configured" : "missing"],
    ["Publishable key", environment.hasPublishableKey ? "configured" : "missing"],
    ["Business name", account.businessName || "-"],
    ["Country", account.country || "-"],
    ["Default currency", account.defaultCurrency || "-"],
    ["Charges enabled", account.chargesEnabled ? "yes" : "no"],
    ["Payouts enabled", account.payoutsEnabled ? "yes" : "no"],
  ];

  stripeDiagnosticsSummary.innerHTML = items
    .map(
      ([label, value]) => `
        <article class="admin-diagnostic-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `,
    )
    .join("");

  stripeDiagnosticsSessions.innerHTML = (stripeDiagnostics.recentSessions || [])
    .map(
      (session) => `
        <tr>
          <td>${escapeHtml(formatDate(session.createdAt))}</td>
          <td><code>${escapeHtml(session.id || "-")}</code></td>
          <td>${escapeHtml(session.paymentStatus || session.status || "-")}</td>
          <td>${escapeHtml(formatMinorAmount(session.amountTotal, session.currency))}</td>
          <td>${escapeHtml(session.customerEmail || "-")}</td>
          <td>${escapeHtml(session.programName || session.programId || "-")}</td>
        </tr>
      `,
    )
    .join("");
};

const setLoading = (button, isLoading, idleText, loadingText) => {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : idleText;
};

const handleUnauthorized = (response) => {
  if (response.status !== 401) return false;
  window.location.replace("/admin/login");
  return true;
};

const loadOrders = async () => {
  setLoading(refreshButton, true, "Обнови поръчките", "Зареждане...");
  setError(errorState);
  try {
    const response = await fetch("/api/admin/orders");
    const data = await response.json();
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(data.error || "Не успяхме да заредим поръчките.");
    orders = Array.isArray(data.orders) ? data.orders : [];
    renderOrders();
    renderLandingAnalytics();
  } catch (error) {
    orders = [];
    renderOrders();
    setError(errorState, error.message || "Възникна проблем при зареждане на поръчките.");
  } finally {
    setLoading(refreshButton, false, "Обнови поръчките", "Зареждане...");
  }
};

const loadTrainingRequests = async () => {
  setLoading(trainingRefreshButton, true, "Обнови заявките", "Зареждане...");
  setError(trainingErrorState);
  try {
    const response = await fetch("/api/admin/training-requests");
    const data = await response.json();
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(data.error || "Не успяхме да заредим заявките.");
    trainingRequests = Array.isArray(data.requests) ? data.requests : [];
    renderTrainingRequests();
    renderLandingAnalytics();
  } catch (error) {
    trainingRequests = [];
    renderTrainingRequests();
    setError(trainingErrorState, error.message || "Възникна проблем при зареждане на заявките.");
  } finally {
    setLoading(trainingRefreshButton, false, "Обнови заявките", "Зареждане...");
  }
};

const loadContactInquiries = async () => {
  setLoading(contactInquiryRefreshButton, true, "Обнови запитванията", "Зареждане...");
  setError(contactInquiryErrorState);
  try {
    const response = await fetch("/api/admin/training-requests?type=contact");
    const data = await response.json();
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(data.error || "Не успяхме да заредим контактните запитвания.");
    contactInquiries = Array.isArray(data.inquiries) ? data.inquiries : [];
    renderContactInquiries();
  } catch (error) {
    contactInquiries = [];
    renderContactInquiries();
    setError(contactInquiryErrorState, error.message || "Възникна проблем при зареждане на контактните запитвания.");
  } finally {
    setLoading(contactInquiryRefreshButton, false, "Обнови запитванията", "Зареждане...");
  }
};

const loadAdminLogs = async () => {
  setLoading(logRefreshButton, true, "Refresh logs", "Loading...");
  setError(logErrorState);
  try {
    const response = await fetch("/api/admin/logs");
    const data = await response.json();
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(data.error || "Admin logs could not be loaded.");
    adminLogs = Array.isArray(data.logs) ? data.logs : [];
    renderAdminLogs();
  } catch (error) {
    adminLogs = [];
    renderAdminLogs();
    setError(logErrorState, error.message || "Admin logs could not be loaded.");
  } finally {
    setLoading(logRefreshButton, false, "Refresh logs", "Loading...");
  }
};

const loadStripeDiagnostics = async () => {
  setLoading(stripeDiagnosticsRefreshButton, true, "Refresh Stripe status", "Loading...");
  setError(stripeDiagnosticsError);
  try {
    const response = await fetch("/api/admin/stripe-diagnostics");
    const data = await response.json();
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(data.error || "Stripe diagnostics could not be loaded.");
    stripeDiagnostics = data;
    renderStripeDiagnostics();
  } catch (error) {
    stripeDiagnostics = null;
    renderStripeDiagnostics();
    setError(stripeDiagnosticsError, error.message || "Stripe diagnostics could not be loaded.");
  } finally {
    setLoading(stripeDiagnosticsRefreshButton, false, "Refresh Stripe status", "Loading...");
  }
};

const loadLandingAnalytics = async () => {
  setLoading(landingAnalyticsRefresh, true, "Обнови статистиката", "Зареждане...");
  setError(landingAnalyticsError);
  try {
    const params = new URLSearchParams();
    const range = analyticsDateRange();
    if (range.start) params.set("start", range.start);
    if (range.end) params.set("end", range.end);
    if (landingAnalyticsFilters) {
      new FormData(landingAnalyticsFilters).forEach((value, key) => {
        if (key === "period" || key === "start" || key === "end") return;
        const cleanValue = String(value || "").trim();
        if (cleanValue) params.set(key, cleanValue);
      });
    }
    const response = await fetch(`/api/admin/landing-analytics${params.size ? `?${params}` : ""}`);
    const data = await response.json();
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(data.error || "Landing analytics could not be loaded.");
    landingAnalytics = data;
    renderLandingAnalytics();
    if (landingAnalyticsStatus) {
      const start = formatDate(data.range?.start);
      const end = formatDate(data.range?.end);
      landingAnalyticsStatus.textContent = `${start} ? ${end}`;
    }
  } catch (error) {
    landingAnalytics = null;
    renderLandingAnalytics();
    setError(landingAnalyticsError, error.message || "Landing analytics could not be loaded.");
  } finally {
    setLoading(landingAnalyticsRefresh, false, "Обнови статистиката", "Зареждане...");
  }
};

const updateTrainingRequestStatus = async (select) => {
  const id = select.dataset.requestId;
  const previousStatus = trainingRequests.find((request) => request.id === id)?.status || "new";
  select.disabled = true;

  try {
    const response = await fetch("/api/admin/training-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: select.value }),
    });
    const data = await response.json();
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(data.error || "Статусът не беше запазен.");

    trainingRequests = trainingRequests.map((request) =>
      request.id === id ? { ...request, status: select.value } : request,
    );
    renderTrainingRequests();
  } catch (error) {
    select.value = previousStatus;
    setError(trainingErrorState, error.message || "Статусът не беше запазен.");
  } finally {
    select.disabled = false;
  }
};

const updateContactInquiryStatus = async (select) => {
  const id = select.dataset.inquiryId;
  const previousStatus = contactInquiries.find((inquiry) => inquiry.id === id)?.status || "new";
  select.disabled = true;

  try {
    const response = await fetch("/api/admin/training-requests?type=contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: select.value }),
    });
    const data = await response.json();
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(data.error || "Статусът не беше запазен.");

    contactInquiries = contactInquiries.map((inquiry) =>
      inquiry.id === id ? { ...inquiry, status: select.value } : inquiry,
    );
    renderContactInquiries();
  } catch (error) {
    select.value = previousStatus;
    setError(contactInquiryErrorState, error.message || "Статусът не беше запазен.");
  } finally {
    select.disabled = false;
  }
};

searchInput?.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderOrders();
});

statusFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedStatus = button.dataset.adminStatusFilter || "all";
    statusFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderOrders();
  });
});

trainingSearchInput?.addEventListener("input", (event) => {
  trainingSearchTerm = event.target.value.trim().toLowerCase();
  renderTrainingRequests();
});

trainingStatusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedTrainingStatus = button.dataset.trainingRequestStatusFilter || "all";
    trainingStatusButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderTrainingRequests();
  });
});

trainingTableBody?.addEventListener("change", (event) => {
  const select = event.target.closest("[data-training-request-status]");
  if (select) updateTrainingRequestStatus(select);
});

contactInquirySearchInput?.addEventListener("input", (event) => {
  contactInquirySearchTerm = event.target.value.trim().toLowerCase();
  renderContactInquiries();
});

contactInquiryStatusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedContactInquiryStatus = button.dataset.contactInquiryStatusFilter || "all";
    contactInquiryStatusButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderContactInquiries();
  });
});

contactInquiryTableBody?.addEventListener("change", (event) => {
  const select = event.target.closest("[data-contact-inquiry-status]");
  if (select) updateContactInquiryStatus(select);
});

refreshButton?.addEventListener("click", loadOrders);
trainingRefreshButton?.addEventListener("click", loadTrainingRequests);
contactInquiryRefreshButton?.addEventListener("click", loadContactInquiries);
logRefreshButton?.addEventListener("click", loadAdminLogs);
stripeDiagnosticsRefreshButton?.addEventListener("click", loadStripeDiagnostics);
landingAnalyticsRefresh?.addEventListener("click", loadLandingAnalytics);
landingAnalyticsFilters?.addEventListener("submit", (event) => {
  event.preventDefault();
  loadLandingAnalytics();
});
landingAnalyticsReset?.addEventListener("click", () => {
  landingAnalyticsFilters?.reset();
  loadLandingAnalytics();
});

dashboardTabs.forEach((button) => {
  button.addEventListener("click", () => {
    selectedLandingDashboard = button.dataset.landingDashboardTab || "individual";
    dashboardTabs.forEach((tab) => tab.classList.toggle("is-active", tab === button));
    dashboardPanels.forEach((panel) => {
      panel.hidden = panel.dataset.landingDashboardPanel !== selectedLandingDashboard;
    });
  });
});

logoutButton?.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.replace("/admin/login");
});

Promise.all([
  loadStripeDiagnostics(),
  loadOrders(),
  loadTrainingRequests(),
  loadContactInquiries(),
  loadLandingAnalytics(),
  loadAdminLogs(),
]);
