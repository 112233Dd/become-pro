const { getCookie, sendJson, supabaseRequest, verifyAdminToken } = require("../_shared");

const cleanFilter = (value, maxLength = 160) => String(value || "").trim().slice(0, maxLength);
const isoDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const rate = (part, total) => (total ? Number(((part / total) * 100).toFixed(2)) : 0);

const buildStats = (events) => {
  const allSessions = new Set();
  const pageViewSessions = new Set();
  const primaryCtaSessions = new Set();
  const submitSessions = new Set();
  const purchaseSessions = new Set();
  let pageViews = 0;
  let primaryCtaClicks = 0;
  let secondaryCtaClicks = 0;
  let scroll25 = 0;
  let scroll50 = 0;
  let scroll75 = 0;
  let scroll90 = 0;
  let formStarts = 0;
  let formSubmitSuccess = 0;
  let formSubmitError = 0;
  let checkoutStarted = 0;
  let checkoutCreated = 0;
  let checkoutError = 0;
  let purchaseCompleted = 0;

  events.forEach((event) => {
    const sessionId = event.session_id || "";
    if (sessionId) allSessions.add(sessionId);
    if (event.event_name === "page_view") {
      pageViews += 1;
      if (sessionId) pageViewSessions.add(sessionId);
    }
    if (event.event_name === "click_primary_cta") {
      primaryCtaClicks += 1;
      if (sessionId) primaryCtaSessions.add(sessionId);
    }
    if (event.event_name === "click_secondary_cta") secondaryCtaClicks += 1;
    if (event.event_name === "scroll_25") scroll25 += 1;
    if (event.event_name === "scroll_50") scroll50 += 1;
    if (event.event_name === "scroll_75") scroll75 += 1;
    if (event.event_name === "scroll_90") scroll90 += 1;
    if (event.event_name === "form_start") formStarts += 1;
    if (event.event_name === "form_submit_success") {
      formSubmitSuccess += 1;
      if (sessionId) submitSessions.add(sessionId);
    }
    if (event.event_name === "form_submit_error") formSubmitError += 1;
    if (event.event_name === "checkout_started") checkoutStarted += 1;
    if (event.event_name === "checkout_created") checkoutCreated += 1;
    if (event.event_name === "checkout_error") checkoutError += 1;
    if (event.event_name === "purchase_completed") {
      purchaseCompleted += 1;
      if (sessionId) purchaseSessions.add(sessionId);
    }
  });

  const uniqueSessions = allSessions.size || pageViewSessions.size;
  const ctaClicks = primaryCtaClicks + secondaryCtaClicks;

  return {
    pageViews,
    uniqueSessions,
    primaryCtaClicks,
    secondaryCtaClicks,
    ctaClicks,
    scroll25,
    scroll50,
    scroll75,
    scroll90,
    formStarts,
    formSubmitSuccess,
    formSubmitError,
    formSubmissions: formSubmitSuccess,
    formErrors: formSubmitError,
    checkoutStarted,
    checkoutStarts: checkoutStarted,
    checkoutCreated,
    checkoutsCreated: checkoutCreated,
    checkoutError,
    checkoutErrors: checkoutError,
    purchaseCompleted,
    purchases: purchaseCompleted,
    conversionRate: rate(submitSessions.size || formSubmitSuccess, uniqueSessions),
    ctaConversionRate: rate(primaryCtaSessions.size || primaryCtaClicks, uniqueSessions),
    purchaseConversionRate: rate(purchaseSessions.size || purchaseCompleted, uniqueSessions),
    checkoutConversionRate: rate(purchaseCompleted, checkoutStarted),
  };
};

const isIndividualTrainingEvent = (event) =>
  event.page_variant === "individual-training" ||
  String(event.landing_page_url || "").includes("/individual-training") ||
  String(event.landing_page_url || "").includes("/training");

const isSummerProgramEvent = (event) =>
  event.page_variant === "summer-program" || String(event.landing_page_url || "").includes("/summer-program");

const isMainWebsiteEvent = (event) => !isIndividualTrainingEvent(event) && !isSummerProgramEvent(event);

const groupEvents = (events, field, fallback) => {
  const grouped = new Map();
  events.forEach((event) => {
    const key = event[field] || fallback;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(event);
  });
  return [...grouped.entries()]
    .map(([name, rows]) => ({ name, ...buildStats(rows) }))
    .sort((a, b) => b.uniqueSessions - a.uniqueSessions);
};

const groupSourceCampaign = (events) => {
  const grouped = new Map();
  events.forEach((event) => {
    const source = event.utm_source || "No source";
    const campaign = event.utm_campaign || "No campaign";
    const key = `${source}|||${campaign}`;
    if (!grouped.has(key)) grouped.set(key, { source, campaign, rows: [] });
    grouped.get(key).rows.push(event);
  });
  return [...grouped.values()]
    .map(({ source, campaign, rows }) => ({
      name: campaign,
      utm_source: source,
      utm_campaign: campaign,
      ...buildStats(rows),
    }))
    .sort((a, b) => b.uniqueSessions - a.uniqueSessions);
};

module.exports = async (req, res) => {
  try {
    const session = verifyAdminToken(getCookie(req, "bp_admin"));
    if (!session) return sendJson(res, 401, { error: "Unauthorized." });
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 29);
    const start = req.query?.start ? isoDate(req.query.start) : defaultStart;
    const end = req.query?.end ? isoDate(req.query.end, true) : now;
    if (!start || !end || start > end || end - start > 366 * 24 * 60 * 60 * 1000) {
      return sendJson(res, 400, { error: "Invalid analytics date range." });
    }

    const filters = {
      landing_page_url: cleanFilter(req.query?.landing_page_url, 500),
      page_variant: cleanFilter(req.query?.page_variant),
      utm_source: cleanFilter(req.query?.utm_source),
      utm_medium: cleanFilter(req.query?.utm_medium),
      utm_campaign: cleanFilter(req.query?.utm_campaign),
      device_type: cleanFilter(req.query?.device_type, 40),
    };
    const query = new URLSearchParams({
      select:
        "session_id,event_name,landing_page_url,page_variant,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer,device_type,event_time,stripe_checkout_session_id,program_id",
      event_time: `gte.${start.toISOString()}`,
      order: "event_time.desc",
      limit: "10000",
    });
    query.append("event_time", `lte.${end.toISOString()}`);
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      query.append(key, key === "landing_page_url" ? `ilike.*${value}*` : `eq.${value}`);
    });

    const events = (await supabaseRequest(`landing_analytics_events?${query.toString()}`)) || [];
    const distinct = (field) => [...new Set(events.map((event) => event[field]).filter(Boolean))].sort();
    const individualEvents = events.filter(isIndividualTrainingEvent);
    const summerEvents = events.filter(isSummerProgramEvent);
    const mainWebsiteEvents = events.filter(isMainWebsiteEvent);

    return sendJson(res, 200, {
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: buildStats(events),
      dashboards: {
        individualTraining: {
          summary: buildStats(individualEvents),
          funnel: groupEvents(individualEvents, "landing_page_url", "/individual-training"),
          byVariant: groupEvents(individualEvents, "page_variant", "individual-training"),
          byCampaign: groupEvents(individualEvents, "utm_campaign", "No campaign"),
        },
        summerProgram: {
          summary: buildStats(summerEvents),
          funnel: groupEvents(summerEvents, "landing_page_url", "/summer-program"),
          byVariant: groupEvents(summerEvents, "page_variant", "summer-program"),
          byCampaign: groupEvents(summerEvents, "utm_campaign", "No campaign"),
        },
        mainWebsite: {
          summary: buildStats(mainWebsiteEvents),
          funnel: groupEvents(mainWebsiteEvents, "landing_page_url", "Main website"),
          byVariant: groupEvents(mainWebsiteEvents, "page_variant", "general"),
          byCampaign: groupEvents(mainWebsiteEvents, "utm_campaign", "No campaign"),
        },
      },
      byLandingPage: groupEvents(events, "landing_page_url", "Landing page"),
      byVariant: groupEvents(events, "page_variant", "general"),
      byCampaign: groupEvents(events, "utm_campaign", "No campaign"),
      bySourceCampaign: groupSourceCampaign(events),
      byDevice: groupEvents(events, "device_type", "unknown"),
      byReferrer: groupEvents(events, "referrer", "Direct"),
      filters: {
        landingPages: distinct("landing_page_url"),
        pageVariants: distinct("page_variant"),
        utmSources: distinct("utm_source"),
        utmMediums: distinct("utm_medium"),
        utmCampaigns: distinct("utm_campaign"),
        deviceTypes: distinct("device_type"),
      },
    });
  } catch (error) {
    console.error("Admin landing analytics failed:", error);
    return sendJson(res, 500, { error: "Landing analytics could not be loaded." });
  }
};
