const {
  getCookie,
  readJsonBody,
  sendJson,
  hasSupabaseAdmin,
  supabaseRequest,
  verifyAdminToken,
} = require("../_shared");

const REQUEST_STATUSES = new Set(["new", "contacted", "booked", "declined"]);
const INQUIRY_STATUSES = new Set(["new", "answered", "archived"]);
const isLegacyTrainingSchemaError = (error) =>
  /PGRST204|applicant_type|training_requests_status|landing_page_url|page_variant|utm_/i.test(
    String(error?.message || error || ""),
  );
const isContactSchemaError = (error) =>
  /contact_inquiries|PGRST205|PGRST204|schema cache/i.test(String(error?.message || error || ""));
const normalizeRequest = (request) => ({
  ...request,
  applicant_type: request.applicant_type || request.who || "",
  status: request.status || "new",
});
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

const handleContactInquiries = async (req, res) => {
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
      updated = await supabaseRequest(`admin_logs?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ metadata: { ...(log.metadata || {}), status } }),
      });
      updated = updated?.map(normalizeLogInquiry);
    }

    return sendJson(res, 200, { inquiry: updated?.[0] || null });
  }

  res.setHeader("Allow", "GET, PATCH");
  return sendJson(res, 405, { error: "Method not allowed." });
};

module.exports = async (req, res) => {
  try {
    const session = verifyAdminToken(getCookie(req, "bp_admin"));
    if (!session) return sendJson(res, 401, { error: "Unauthorized." });
    const requestUrl = new URL(req.url || "/", "http://localhost");
    if (requestUrl.searchParams.get("type") === "contact") {
      return await handleContactInquiries(req, res);
    }

    if (req.method === "GET") {
      if (!hasSupabaseAdmin()) {
        return sendJson(res, 200, { requests: [], source: "supabase-not-configured" });
      }

      let requests;
      try {
        requests = await supabaseRequest(
          "training_requests?select=id,created_at,applicant_type,who,name,city,phone,status,landing_page_url,page_variant,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer,device_type,browser&order=created_at.desc",
        );
      } catch (schemaError) {
        if (!isLegacyTrainingSchemaError(schemaError)) throw schemaError;
        requests = await supabaseRequest(
          "training_requests?select=id,created_at,who,name,city,phone&order=created_at.desc",
        );
      }
      return sendJson(res, 200, {
        requests: Array.isArray(requests) ? requests.map(normalizeRequest) : [],
      });
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
