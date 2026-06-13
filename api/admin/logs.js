const { getCookie, hasSupabaseAdmin, sendJson, supabaseRequest, verifyAdminToken } = require("../_shared");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const session = verifyAdminToken(getCookie(req, "bp_admin"));
    if (!session) return sendJson(res, 401, { error: "Unauthorized." });

    if (!hasSupabaseAdmin()) {
      return sendJson(res, 200, { logs: [], source: "supabase-not-configured" });
    }

    const logs = await supabaseRequest(
      "admin_logs?select=id,created_at,level,event,message,stripe_checkout_session_id,metadata&order=created_at.desc&limit=100",
    );

    return sendJson(res, 200, { logs: Array.isArray(logs) ? logs : [], source: "supabase" });
  } catch (error) {
    console.error("Admin logs failed:", error);
    return sendJson(res, 500, { error: "Admin logs could not be loaded." });
  }
};
