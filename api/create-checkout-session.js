const {
  createStripeCheckoutSession,
  getOrigin,
  getProgramsByIds,
  hasSupabaseAdmin,
  isCheckoutEnabled,
  readJsonBody,
  sendJson,
  upsertOrders,
} = require("./_shared");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (!isCheckoutEnabled()) {
    return sendJson(res, 503, {
      error: "Плащанията са временно спрени, докато проверяваме Stripe настройките.",
    });
  }

  try {
    const body = await readJsonBody(req);
    const programs = getProgramsByIds(Array.isArray(body.items) ? body.items : [body.programId]);
    const customer = {
      customerName: String(body.customer?.customerName || "").trim(),
      customerEmail: String(body.customer?.customerEmail || "").trim(),
      customerPhone: String(body.customer?.customerPhone || "").trim(),
      playerName: String(body.customer?.playerName || "").trim(),
      playerAge: String(body.customer?.playerAge || "").trim(),
    };

    ["STRIPE_SECRET_KEY"].forEach((name) => {
      if (!process.env[name]) throw new Error(`Missing environment variable: ${name}`);
    });

    const session = await createStripeCheckoutSession({
      programs,
      customer,
      origin: getOrigin(req),
    });

    if (hasSupabaseAdmin()) {
      try {
        await upsertOrders({
          programs,
          customer,
          status: "pending",
          sessionId: session.id,
          paymentIntentId: session.payment_intent || null,
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
