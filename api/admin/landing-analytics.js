const { getCookie, sendJson, supabaseRequest, verifyAdminToken } = require("../_shared");

const cleanFilter = (value, maxLength = 160) => String(value || "").trim().slice(0, maxLength);
const isoDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildStats = (events) => {
  const pageViewSessions = new Set();
  const allSessions = new Set();
  const submitSessions = new Set();
  const purchaseSessions = new Set();
  let pageViews = 0;
  let ctaClicks = 0;
  let formStarts = 0;
  let formSubmissions = 0;
  let formErrors = 0;
  let checkoutStarts = 0;
  let checkoutsCreated = 0;
  let checkoutErrors = 0;
  let purchases = 0;

  events.forEach((event) => {
    allSessions.add(event.session_id);
    if (event.event_name === "page_view") {
      pageViews += 1;
      pageViewSessions.add(event.session_id);
    }
    if (event.event_name === "click_primary_cta" || event.event_name === "click_secondary_cta") ctaClicks += 1;
    if (event.event_name === "form_start") formStarts += 1;
    if (event.event_name === "form_submit_success") {
      formSubmissions += 1;
      submitSessions.add(event.session_id);
    }
    if (event.event_name === "form_submit_error") formErrors += 1;
    if (event.event_name === "checkout_started") checkoutStarts += 1;
    if (event.event_name === "checkout_created") checkoutsCreated += 1;
    if (event.event_name === "checkout_error") checkoutErrors += 1;
    if (event.event_name === "purchase_completed") {
      purchases += 1;
      purchaseSessions.add(event.session_id);
    }
  });

  const conversionRate = pageViewSessions.size
    ? Number(((submitSessions.size / pageViewSessions.size) * 100).toFixed(2))
    : 0;
  const purchaseConversionRate = pageViewSessions.size
    ? Number(((purchaseSessions.size / pageViewSessions.size) * 100).toFixed(2))
    : 0;

  return {
    pageViews,
    uniqueSessions: allSessions.size,
    ctaClicks,
    formStarts,
    formSubmissions,
    formErrors,
    conversionRate,
    checkoutStarts,
    checkoutsCreated,
    checkoutErrors,
    purchases,
    purchaseConversionRate,
  };
};

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
    };
    const query = new URLSearchParams({
      select: "session_id,event_name,landing_page_url,page_variant,utm_source,utm_medium,utm_campaign,event_time,stripe_checkout_session_id,program_id",
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

    return sendJson(res, 200, {
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: buildStats(events),
      byLandingPage: groupEvents(events, "landing_page_url", "Landing page"),
      byVariant: groupEvents(events, "page_variant", "general"),
      byCampaign: groupEvents(events, "utm_campaign", "Без кампания"),
      filters: {
        landingPages: distinct("landing_page_url"),
        pageVariants: distinct("page_variant"),
        utmSources: distinct("utm_source"),
        utmMediums: distinct("utm_medium"),
        utmCampaigns: distinct("utm_campaign"),
      },
    });
  } catch (error) {
    console.error("Admin landing analytics failed:", error);
    return sendJson(res, 500, { error: "Landing analytics could not be loaded." });
  }
};
