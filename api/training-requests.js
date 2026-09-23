const { logAdminEvent, readJsonBody, sendEmail, sendJson, supabaseRequest } = require("./_shared");

const APPLICANT_TYPES = new Set(["Моето дете", "Себе си"]);

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const isLegacyTrainingSchemaError = (error) =>
  /PGRST204|applicant_type|training_requests_status|landing_page_url|page_variant|utm_/i.test(
    String(error?.message || error || ""),
  );
const isContactSchemaError = (error) =>
  /contact_inquiries|PGRST205|PGRST204|schema cache/i.test(String(error?.message || error || ""));
const getAdminNotificationEmail = () =>
  process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || "become.pro2024@gmail.com";
const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const notificationHtml = ({ title, rows }) => `
  <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#0b0b0a;color:#f8f4e8;border-radius:18px;">
    <p style="margin:0 0 8px;color:#f5c400;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">Become Pro</p>
    <h1 style="margin:0 0 22px;font-size:26px;line-height:1.2;">${escapeHtml(title)}</h1>
    <table style="width:100%;border-collapse:collapse;">
      ${rows
        .map(
          ([label, value]) => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #2d2a21;color:#bdb7aa;">${escapeHtml(label)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #2d2a21;font-weight:700;">${escapeHtml(value || "-")}</td>
            </tr>`,
        )
        .join("")}
    </table>
    <p style="margin:22px 0 0;"><a href="https://becomeprofootball.com/admin-orders" style="color:#f5c400;font-weight:800;">Отвори админ панела →</a></p>
  </div>`;

const createContactInquiry = async (body) => {
  const name = cleanText(body.name, 120);
  const phone = cleanText(body.phone, 40);
  const email = cleanText(body.email, 160).toLowerCase();
  const message = cleanText(body.message, 2000);
  const consent = Boolean(body.consent);

  if (name.length < 2) return { error: "Моля, въведи име." };
  if (phone.length < 6) return { error: "Моля, въведи валиден телефон." };
  if (!isEmail(email)) return { error: "Моля, въведи валиден имейл адрес." };
  if (message.length < 5) return { error: "Моля, въведи съобщение." };
  if (!consent) return { error: "Моля, потвърди съгласието за връзка." };

  let rows;
  try {
    rows = await supabaseRequest("contact_inquiries", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([{ name, phone, email, message, status: "new" }]),
    });
  } catch (schemaError) {
    if (!isContactSchemaError(schemaError)) throw schemaError;
    rows = await supabaseRequest("admin_logs", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([
        {
          level: "info",
          event: "contact_inquiry",
          message: `Контактно запитване от ${name}`,
          metadata: { name, phone, email, message, status: "new" },
        },
      ]),
    });
  }

  try {
    await sendEmail({
      to: getAdminNotificationEmail(),
      subject: "Ново контактно запитване",
      text: [
        "Получено е ново контактно запитване.",
        "",
        `Име: ${name}`,
        `Телефон: ${phone}`,
        `Имейл: ${email}`,
        "",
        "Съобщение:",
        message,
        "",
        "Запитването е записано в админ панела.",
      ].join("\n"),
      html: notificationHtml({
        title: "Ново контактно запитване",
        rows: [
          ["Име", name],
          ["Телефон", phone],
          ["Имейл", email],
          ["Съобщение", message],
        ],
      }),
    });
  } catch (emailError) {
    console.error("Contact inquiry admin email failed:", emailError);
  }

  return { inquiry: rows?.[0] || null };
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    if (body.requestType === "contact") {
      const result = await createContactInquiry(body);
      if (result.error) return sendJson(res, 400, { error: result.error });
      return sendJson(res, 201, { ok: true, inquiry: result.inquiry });
    }

    const applicantType = cleanText(body.applicantType, 40);
    const name = cleanText(body.name, 120);
    const playerAge = cleanText(body.playerAge, 40);
    const city = cleanText(body.city, 120);
    const phone = cleanText(body.phone, 40);
    const consent = Boolean(body.consent);
    const attribution = body.attribution || {};
    const attributionRow = {
      landing_page_url: cleanText(attribution.landingPageUrl, 500) || null,
      page_variant: cleanText(attribution.pageVariant, 160) || null,
      utm_source: cleanText(attribution.utm_source, 160) || null,
      utm_medium: cleanText(attribution.utm_medium, 160) || null,
      utm_campaign: cleanText(attribution.utm_campaign, 160) || null,
      utm_content: cleanText(attribution.utm_content, 160) || null,
      utm_term: cleanText(attribution.utm_term, 160) || null,
      referrer: cleanText(attribution.referrer, 500) || null,
      device_type: cleanText(attribution.deviceType, 40) || null,
      browser: cleanText(attribution.browser, 300) || null,
      session_id: cleanText(attribution.sessionId, 100) || null,
    };

    if (!APPLICANT_TYPES.has(applicantType)) {
      return sendJson(res, 400, { error: "Моля, избери кого искаш да запишеш." });
    }
    if (name.length < 2) return sendJson(res, 400, { error: "Моля, въведи име." });
    if (playerAge.length < 1) return sendJson(res, 400, { error: "Моля, въведи възраст." });
    if (city.length < 2) return sendJson(res, 400, { error: "Моля, въведи град." });
    if (phone.length < 6) return sendJson(res, 400, { error: "Моля, въведи валиден телефон." });
    if (!consent) return sendJson(res, 400, { error: "Моля, потвърди съгласието за връзка." });

    let rows = null;
    let storageSaved = false;
    let storageError = "";
    try {
      try {
        rows = await supabaseRequest("training_requests", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify([
            {
              applicant_type: applicantType,
              who: applicantType,
              name,
              player_age: playerAge,
              city,
              phone,
              status: "new",
              ...attributionRow,
            },
          ]),
        });
      } catch (schemaError) {
        if (!isLegacyTrainingSchemaError(schemaError)) throw schemaError;
        rows = await supabaseRequest("training_requests", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify([
            {
              request_type: "training",
              who: applicantType,
              name,
              player_age: playerAge,
              city,
              phone,
            },
          ]),
        });
      }
      storageSaved = true;
    } catch (requestStorageError) {
      storageError = requestStorageError.message || "Unknown storage error";
      console.error("Training request storage failed; continuing with admin email:", requestStorageError);
    }

    let notificationSent = false;
    let notificationError = "";
    try {
      await sendEmail({
        to: getAdminNotificationEmail(),
        subject: storageSaved
          ? "Нова заявка за индивидуална тренировка"
          : "ВАЖНО: Нова заявка за тренировка (не е записана в админ панела)",
        text: [
          "Получена е нова заявка за индивидуална тренировка.",
          storageSaved
            ? "Заявката е записана в админ панела."
            : "ВНИМАНИЕ: базата е недостъпна и заявката не е записана в админ панела. Свържи се с играча по телефона по-долу.",
          "",
          `Кого искат да запишат: ${applicantType}`,
          `Име: ${name}`,
          `Възраст: ${playerAge}`,
          `Град: ${city}`,
          `Телефон: ${phone}`,
          `Landing page: ${attributionRow.page_variant || "-"}`,
          `Кампания: ${attributionRow.utm_campaign || "-"}`,
        ].join("\n"),
        html: notificationHtml({
          title: storageSaved
            ? "Нова заявка за индивидуална тренировка"
            : "Нова заявка — не е записана в админ панела",
          rows: [
            ["Статус", storageSaved ? "Записана в админ панела" : "Само email — базата е недостъпна"],
            ["Кого записват", applicantType],
            ["Име", name],
            ["Възраст", playerAge],
            ["Град", city],
            ["Телефон", phone],
            ["Landing page", attributionRow.page_variant],
            ["Кампания", attributionRow.utm_campaign],
          ],
        }),
      });
      notificationSent = true;
    } catch (emailError) {
      notificationError = emailError.message || "Unknown email error";
      console.error("Training request admin email failed:", emailError);
    }

    await logAdminEvent({
      level: notificationSent ? "info" : "error",
      event: notificationSent ? "training_request_notification_sent" : "training_request_notification_failed",
      message: notificationSent
        ? "Admin email sent for a new individual training request."
        : "A training request was saved, but the admin email could not be sent.",
      metadata: {
        requestId: rows?.[0]?.id || null,
        storageSaved,
        storageError: storageError || null,
        notificationError: notificationError || null,
      },
    });

    if (!storageSaved && !notificationSent) {
      return sendJson(res, 500, { error: "Възникна проблем при изпращане на заявката." });
    }

    return sendJson(res, 201, {
      ok: true,
      request: rows?.[0] || null,
      notificationSent,
      storageSaved,
    });
  } catch (error) {
    console.error("Training request failed:", error);
    return sendJson(res, 500, { error: "Възникна проблем при изпращане на заявката." });
  }
};
