const {
  getCookie,
  readJsonBody,
  sendJson,
  hasSupabaseAdmin,
  supabaseRequest,
  verifyAdminToken,
} = require("../_shared");

const REQUEST_STATUSES = new Set(["new", "contacted", "conversation", "follow_up", "booked", "declined"]);
const INQUIRY_STATUSES = new Set(["new", "answered", "archived"]);
const isLegacyTrainingSchemaError = (error) =>
  /PGRST204|applicant_type|training_requests_status|landing_page_url|page_variant|utm_|player_age|position|notes|last_contacted_at|next_follow_up|updated_at|training_request_events/i.test(
    String(error?.message || error || ""),
  );
const isContactSchemaError = (error) =>
  /contact_inquiries|PGRST205|PGRST204|schema cache/i.test(String(error?.message || error || ""));
const normalizeRequest = (request) => ({
  ...request,
  applicant_type: request.applicant_type || request.who || "",
  status: request.status || "new",
  events:
    request.events?.length || !request.created_at
      ? request.events || []
      : [{ id: `${request.id || "lead"}-created`, event_type: "created", created_at: request.created_at }],
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

const cleanText = (value, maxLength = 1000) => String(value || "").trim().slice(0, maxLength);
const cleanDate = (value) => {
  const text = cleanText(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
};

const requestSelect =
  "id,created_at,applicant_type,who,name,city,phone,player_age,position,status,notes,last_contacted_at,next_follow_up_date,next_follow_up_note,landing_page_url,page_variant,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer,device_type,browser,session_id,updated_at";

const fetchTrainingEvents = async (ids) => {
  if (!ids.length) return new Map();
  try {
    const rows = await supabaseRequest(
      `training_request_events?select=id,training_request_id,event_type,previous_status,new_status,note,follow_up_date,follow_up_note,created_at&training_request_id=in.(${ids.join(",")})&order=created_at.desc`,
    );
    const grouped = new Map();
    (Array.isArray(rows) ? rows : []).forEach((event) => {
      const key = event.training_request_id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(event);
    });
    return grouped;
  } catch (schemaError) {
    if (!isLegacyTrainingSchemaError(schemaError)) throw schemaError;
    return new Map();
  }
};

const addTrainingEvent = async (event) => {
  try {
    await supabaseRequest("training_request_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify([event]),
    });
  } catch (schemaError) {
    if (!isLegacyTrainingSchemaError(schemaError)) throw schemaError;
  }
};

const crmPatchFromBody = (body) => {
  const patch = {};
  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    const status = cleanText(body.status, 40);
    if (!REQUEST_STATUSES.has(status)) return { error: "Invalid request status." };
    patch.status = status;
    if (["contacted", "conversation", "follow_up", "booked", "declined"].includes(status)) {
      patch.last_contacted_at = new Date().toISOString();
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, "notes")) patch.notes = cleanText(body.notes, 4000) || null;
  if (Object.prototype.hasOwnProperty.call(body, "next_follow_up_date")) {
    patch.next_follow_up_date = cleanDate(body.next_follow_up_date);
  }
  if (Object.prototype.hasOwnProperty.call(body, "next_follow_up_note")) {
    patch.next_follow_up_note = cleanText(body.next_follow_up_note, 1000) || null;
  }
  patch.updated_at = new Date().toISOString();
  return { patch };
};

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
          `training_requests?select=${requestSelect}&order=created_at.desc`,
        );
      } catch (schemaError) {
        if (!isLegacyTrainingSchemaError(schemaError)) throw schemaError;
        requests = await supabaseRequest(
          "training_requests?select=id,created_at,who,name,city,phone&order=created_at.desc",
        );
      }
      const requestIds = (Array.isArray(requests) ? requests : []).map((request) => request.id).filter(Boolean);
      const eventsByRequest = await fetchTrainingEvents(requestIds);
      return sendJson(res, 200, {
        requests: Array.isArray(requests)
          ? requests.map((request) => normalizeRequest({ ...request, events: eventsByRequest.get(request.id) || [] }))
          : [],
      });
    }

    if (req.method === "PATCH") {
      if (!hasSupabaseAdmin()) {
        return sendJson(res, 503, { error: "Supabase is not configured." });
      }

      const body = await readJsonBody(req);
      const id = String(body.id || "").trim();

      if (!/^[0-9a-f-]{36}$/i.test(id)) return sendJson(res, 400, { error: "Invalid request ID." });

      let currentRows;
      try {
        currentRows = await supabaseRequest(
          `training_requests?select=${requestSelect}&id=eq.${encodeURIComponent(id)}&limit=1`,
        );
      } catch (schemaError) {
        if (!isLegacyTrainingSchemaError(schemaError)) throw schemaError;
        currentRows = await supabaseRequest(
          `training_requests?select=id,created_at,who,name,city,phone,status&id=eq.${encodeURIComponent(id)}&limit=1`,
        );
      }
      const current = currentRows?.[0];
      if (!current) return sendJson(res, 404, { error: "Training request not found." });

      const action = cleanText(body.action, 40) || "update";
      const { patch, error } = crmPatchFromBody(body);
      if (error) return sendJson(res, 400, { error });

      if (action === "add_note") {
        const note = cleanText(body.note, 2000);
        if (note.length < 2) return sendJson(res, 400, { error: "Note is required." });
        patch.notes = [current.notes, note].filter(Boolean).join("\n\n");
        await addTrainingEvent({ training_request_id: id, event_type: "note_added", note });
      }

      if (Object.prototype.hasOwnProperty.call(patch, "status") && patch.status !== (current.status || "new")) {
        await addTrainingEvent({
          training_request_id: id,
          event_type: patch.status === "booked" || patch.status === "declined" ? patch.status : "status_changed",
          previous_status: current.status || "new",
          new_status: patch.status,
        });
      }

      if (
        Object.prototype.hasOwnProperty.call(patch, "next_follow_up_date") ||
        Object.prototype.hasOwnProperty.call(patch, "next_follow_up_note")
      ) {
        await addTrainingEvent({
          training_request_id: id,
          event_type: "follow_up_set",
          follow_up_date: patch.next_follow_up_date,
          follow_up_note: patch.next_follow_up_note,
        });
      }

      let updated;
      try {
        updated = await supabaseRequest(`training_requests?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(patch),
        });
      } catch (schemaError) {
        if (!isLegacyTrainingSchemaError(schemaError)) throw schemaError;
        if (!Object.prototype.hasOwnProperty.call(patch, "status")) {
          return sendJson(res, 409, { error: "CRM fields are not available until the Supabase migration is applied." });
        }
        updated = await supabaseRequest(`training_requests?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ status: patch.status }),
        });
      }

      const eventsByRequest = await fetchTrainingEvents([id]);

      return sendJson(res, 200, {
        request: updated?.[0] ? normalizeRequest({ ...updated[0], events: eventsByRequest.get(id) || [] }) : null,
      });
    }

    if (req.method === "POST") {
      if (!hasSupabaseAdmin()) {
        return sendJson(res, 503, { error: "Supabase is not configured." });
      }

      const body = await readJsonBody(req);
      const id = String(body.id || "").trim();
      const note = cleanText(body.note, 2000);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return sendJson(res, 400, { error: "Invalid request ID." });
      if (note.length < 2) return sendJson(res, 400, { error: "Note is required." });

      let currentRows;
      try {
        currentRows = await supabaseRequest(
          `training_requests?select=${requestSelect}&id=eq.${encodeURIComponent(id)}&limit=1`,
        );
      } catch (schemaError) {
        if (!isLegacyTrainingSchemaError(schemaError)) throw schemaError;
        return sendJson(res, 409, { error: "CRM notes are not available until the Supabase migration is applied." });
      }
      const current = currentRows?.[0];
      if (!current) return sendJson(res, 404, { error: "Training request not found." });

      await addTrainingEvent({ training_request_id: id, event_type: "note_added", note });
      const updated = await supabaseRequest(`training_requests?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          notes: [current.notes, note].filter(Boolean).join("\n\n"),
          updated_at: new Date().toISOString(),
        }),
      });
      const eventsByRequest = await fetchTrainingEvents([id]);

      return sendJson(res, 200, {
        request: updated?.[0] ? normalizeRequest({ ...updated[0], events: eventsByRequest.get(id) || [] }) : null,
      });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error("Admin training requests failed:", error);
    return sendJson(res, 500, { error: "Не успяхме да заредим заявките." });
  }
};
