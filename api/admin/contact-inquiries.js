const { getCookie, readJsonBody, sendJson, hasSupabaseAdmin, supabaseRequest, verifyAdminToken } = require("../_shared");

const INQUIRY_STATUSES = new Set(["new", "answered", "archived"]);
const isContactSchemaError = (error) =>
  /contact_inquiries|PGRST205|PGRST204|schema cache/i.test(String(error?.message || error || ""));
const normalizeLogInquiry = (log) => ({
  id: log.id,
  created_at: log.created_at,
  name: log.metadata?.name || "",
  phone: log.metadata?.phone || "",
  email: log.metadata?.email || "",
  message: log.metadata?.message || log.message || "",
  status: log.metadata?.status || "new",
  source: "admin_logs",
});

module.exports = async (req, res) => {
  try {
    const session = verifyAdminToken(getCookie(req, "bp_admin"));
    if (!session) return sendJson(res, 401, { error: "Unauthorized." });

    if (req.method === "GET") {
      if (!hasSupabaseAdmin()) {
        return sendJson(res, 200, { inquiries: [], source: "supabase-not-configured" });
      }

      let inquiries;
      try {
        inquiries = await supabaseRequest(
          "contact_inquiries?select=id,created_at,name,phone,email,message,status&order=created_at.desc",
        );
      } catch (schemaError) {
        if (!isContactSchemaError(schemaError)) throw schemaError;
        const logs = await supabaseRequest(
          "admin_logs?select=id,created_at,message,metadata&event=eq.contact_inquiry&order=created_at.desc",
        );
        inquiries = Array.isArray(logs) ? logs.map(normalizeLogInquiry) : [];
      }

      return sendJson(res, 200, { inquiries: Array.isArray(inquiries) ? inquiries : [] });
    }

    if (req.method === "PATCH") {
      if (!hasSupabaseAdmin()) {
        return sendJson(res, 503, { error: "Supabase is not configured." });
      }

      const body = await readJsonBody(req);
      const id = String(body.id || "").trim();
      const status = String(body.status || "").trim();

      if (!/^[0-9a-f-]{36}$/i.test(id)) return sendJson(res, 400, { error: "Invalid inquiry ID." });
      if (!INQUIRY_STATUSES.has(status)) return sendJson(res, 400, { error: "Invalid inquiry status." });

      let updated;
      try {
        updated = await supabaseRequest(`contact_inquiries?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ status }),
        });
      } catch (schemaError) {
        if (!isContactSchemaError(schemaError)) throw schemaError;
        const existing = await supabaseRequest(
          `admin_logs?select=id,created_at,message,metadata&id=eq.${encodeURIComponent(id)}&event=eq.contact_inquiry&limit=1`,
        );
        const log = existing?.[0];
        if (!log) return sendJson(res, 404, { error: "Contact inquiry not found." });
        const metadata = { ...(log.metadata || {}), status };
        updated = await supabaseRequest(`admin_logs?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ metadata }),
        });
        updated = updated?.map(normalizeLogInquiry);
      }

      return sendJson(res, 200, { inquiry: updated?.[0] || null });
    }

    res.setHeader("Allow", "GET, PATCH");
    return sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error("Admin contact inquiries failed:", error);
    return sendJson(res, 500, { error: "Не успяхме да заредим контактните запитвания." });
  }
};
