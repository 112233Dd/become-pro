const { getCookie, hasSupabaseAdmin, sendJson, supabaseRequest, verifyAdminToken } = require("../_shared");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const session = verifyAdminToken(getCookie(req, "bp_admin"));
    if (!session) return sendJson(res, 401, { error: "Unauthorized." });
    if (!hasSupabaseAdmin()) return sendJson(res, 200, { orders: [], setupRequired: true });

    const orders = await supabaseRequest("orders?select=*&order=created_at.desc");
    return sendJson(res, 200, { orders });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Orders could not be loaded." });
  }
};
