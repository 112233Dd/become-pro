const { config: winterConfig, winterSelection } = require("../winter-program/server.cjs");
const {
  createStripeCheckoutSession,
  getOrigin,
  getProgramsByIds,
  hasSupabaseAdmin,
  readJsonBody,
  sendJson,
  upsertOrders,
} = require("./_shared");

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    const ids = Array.isArray(body.items) ? body.items : [body.programId];
    const winter = ids.length === 1 && ids[0] === winterConfig.productId;
    const programs = winter ? [winterSelection(body.playerAge, body.expectedPriceMinor)] : getProgramsByIds(ids);
    const attribution = body.attribution || {};
    const checkoutAttribution = {
      landingSessionId: cleanText(attribution.sessionId, 100),
      landingPageUrl: winter ? getOrigin(req) + "/winter-program" : cleanText(attribution.landingPageUrl, 500),
      pageVariant: winter ? winterConfig.productId : cleanText(attribution.pageVariant, 160),
      utm_source: cleanText(attribution.utm_source, 160),
      utm_medium: cleanText(attribution.utm_medium, 160),
      utm_campaign: cleanText(attribution.utm_campaign, 160),
      utm_content: cleanText(attribution.utm_content, 160),
      utm_term: cleanText(attribution.utm_term, 160),
      referrer: cleanText(attribution.referrer, 500),
      deviceType: cleanText(attribution.deviceType, 40),
    };
    const customer = {
      customerName: String(body.customer?.customerName || "").trim(),
      customerEmail: String(body.customer?.customerEmail || "").trim(),
      customerPhone: String(body.customer?.customerPhone || "").trim(),
      playerName: String(body.customer?.playerName || "").trim(),
      playerAge: winter ? programs[0].winterAgeGroup : String(body.customer?.playerAge || "").trim(),
    };

    ["STRIPE_SECRET_KEY"].forEach((name) => {
      if (!process.env[name]) throw new Error(`Missing environment variable: ${name}`);
    });

    const session = await createStripeCheckoutSession({
      programs,
      customer,
      origin: getOrigin(req),
      attribution: checkoutAttribution,
    });

    if (hasSupabaseAdmin()) {
      try {
        await upsertOrders({
          programs,
          customer,
          status: "pending",
          sessionId: session.id,
          paymentIntentId: session.payment_intent || null,
          attribution: checkoutAttribution,
        });
      } catch (persistenceError) {
        console.error("Pending order persistence failed:", persistenceError);
      }
    }

    return sendJson(res, 200, { url: session.url, sessionId: session.id });
  } catch (error) {
    const isConfigError = String(error.message || "").startsWith("Missing environment variable");
    return sendJson(res, isConfigError ? 500 : 400, { error: error.message || "Checkout could not be created." });
  }
};
