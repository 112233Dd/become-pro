const { getCookie, getStripeDiagnostics, sendJson, verifyAdminToken } = require("../_shared");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const session = verifyAdminToken(getCookie(req, "bp_admin"));
    if (!session) return sendJson(res, 401, { error: "Unauthorized." });
    const hasStripeSecretKey = Boolean(process.env.STRIPE_SECRET_KEY);
    if (!hasStripeSecretKey) return sendJson(res, 500, { error: "Stripe is not configured." });

    const diagnostics = await getStripeDiagnostics();
    return sendJson(res, 200, diagnostics);
  } catch (error) {
    console.error("Stripe diagnostics failed:", error);
    return sendJson(res, 500, { error: error.message || "Stripe diagnostics could not be loaded." });
  }
};
