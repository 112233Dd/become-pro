const { STRIPE_API_VERSION, sendJson } = require("./_shared");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const sessionId = new URL(req.url, `https://${req.headers.host}`).searchParams.get("session_id");
    if (!sessionId) return sendJson(res, 400, { error: "Missing session_id." });
    if (!process.env.STRIPE_SECRET_KEY) return sendJson(res, 500, { error: "Stripe is not configured." });

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Stripe-Version": STRIPE_API_VERSION,
      },
    });
    const session = await response.json();
    if (!response.ok) throw new Error(session.error?.message || "Session could not be loaded.");

    return sendJson(res, 200, {
      id: session.id,
      paymentStatus: session.payment_status,
      programName: session.metadata?.programName || "",
    });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "Session could not be loaded." });
  }
};
