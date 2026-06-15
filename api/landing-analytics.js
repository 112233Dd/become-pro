const { readJsonBody, sendJson, supabaseRequest } = require("./_shared");

const EVENT_NAMES = new Set([
  "page_view",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_90",
  "view_problem",
  "view_solution",
  "view_program_contents",
  "view_price",
  "click_primary_cta",
  "click_secondary_cta",
  "form_start",
  "form_submit_success",
  "form_submit_error",
  "checkout_started",
  "checkout_created",
  "checkout_error",
]);

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    if (["name", "phone", "email"].some((key) => body[key] != null)) {
      return sendJson(res, 400, { error: "Personal data is not accepted by analytics." });
    }

    const sessionId = cleanText(body.sessionId, 100);
    const eventName = cleanText(body.eventName, 50);
    const landingPageUrl = cleanText(body.landingPageUrl, 500);
    const pageVariant = cleanText(body.pageVariant, 160) || "general";

    if (!/^[a-zA-Z0-9-]{12,100}$/.test(sessionId)) {
      return sendJson(res, 400, { error: "Invalid analytics session." });
    }
    if (!EVENT_NAMES.has(eventName)) {
      return sendJson(res, 400, { error: "Invalid analytics event." });
    }
    if (!landingPageUrl.startsWith("http")) {
      return sendJson(res, 400, { error: "Invalid landing page URL." });
    }

    await supabaseRequest("landing_analytics_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify([
        {
          session_id: sessionId,
          landing_page_url: landingPageUrl,
          page_variant: pageVariant,
          event_name: eventName,
          utm_source: cleanText(body.utm_source, 160) || null,
          utm_medium: cleanText(body.utm_medium, 160) || null,
          utm_campaign: cleanText(body.utm_campaign, 160) || null,
          utm_content: cleanText(body.utm_content, 160) || null,
          utm_term: cleanText(body.utm_term, 160) || null,
          referrer: cleanText(body.referrer, 500) || null,
          device_type: cleanText(body.deviceType, 40) || "unknown",
        },
      ]),
    });

    return sendJson(res, 201, { ok: true });
  } catch (error) {
    console.error("Landing analytics event failed:", error);
    return sendJson(res, 500, { error: "Analytics event could not be stored." });
  }
};
