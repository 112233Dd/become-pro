const { getCookie, hasSupabaseAdmin, listStripeOrders, sendJson, supabaseRequest, verifyAdminToken } = require("../_shared");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const session = verifyAdminToken(getCookie(req, "bp_admin"));
    if (!session) return sendJson(res, 401, { error: "Unauthorized." });
    if (!hasSupabaseAdmin()) {
      const orders = await listStripeOrders();
      return sendJson(res, 200, { orders, source: "stripe" });
    }

    try {
      const orders = await supabaseRequest("orders?select=*&order=created_at.desc");
      return sendJson(res, 200, { orders, source: "supabase" });
    } catch (supabaseError) {
      console.error("Supabase orders unavailable:", supabaseError);
      const orders = await listStripeOrders();
      return sendJson(res, 200, { orders, source: "stripe-fallback" });
    }
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Orders could not be loaded." });
  }
};
