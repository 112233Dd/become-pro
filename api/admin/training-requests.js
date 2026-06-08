const {
  getCookie,
  readJsonBody,
  sendJson,
  hasSupabaseAdmin,
  supabaseRequest,
  verifyAdminToken,
} = require("../_shared");

const REQUEST_STATUSES = new Set(["new", "contacted", "booked", "declined"]);

module.exports = async (req, res) => {
  try {
    const session = verifyAdminToken(getCookie(req, "bp_admin"));
    if (!session) return sendJson(res, 401, { error: "Unauthorized." });

    if (req.method === "GET") {
      if (!hasSupabaseAdmin()) {
        return sendJson(res, 200, { requests: [], source: "supabase-not-configured" });
      }

      const requests = await supabaseRequest(
        "training_requests?select=id,created_at,applicant_type,name,city,phone,status&order=created_at.desc",
      );
      return sendJson(res, 200, { requests: Array.isArray(requests) ? requests : [] });
    }

    if (req.method === "PATCH") {
      if (!hasSupabaseAdmin()) {
        return sendJson(res, 503, { error: "Supabase is not configured." });
      }

      const body = await readJsonBody(req);
      const id = String(body.id || "").trim();
      const status = String(body.status || "").trim();

      if (!/^[0-9a-f-]{36}$/i.test(id)) return sendJson(res, 400, { error: "Invalid request ID." });
      if (!REQUEST_STATUSES.has(status)) return sendJson(res, 400, { error: "Invalid request status." });

      const updated = await supabaseRequest(`training_requests?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status }),
      });

      return sendJson(res, 200, { request: updated?.[0] || null });
    }

    res.setHeader("Allow", "GET, PATCH");
    return sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error("Admin training requests failed:", error);
    return sendJson(res, 500, { error: "Не успяхме да заредим заявките." });
  }
};
