const { readJsonBody, sendEmail, sendJson, supabaseRequest } = require("./_shared");

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const isContactSchemaError = (error) =>
  /contact_inquiries|PGRST205|PGRST204|schema cache/i.test(String(error?.message || error || ""));

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    const name = cleanText(body.name, 120);
    const phone = cleanText(body.phone, 40);
    const email = cleanText(body.email, 160).toLowerCase();
    const message = cleanText(body.message, 2000);
    const consent = Boolean(body.consent);

    if (name.length < 2) return sendJson(res, 400, { error: "Моля, въведи име." });
    if (phone.length < 6) return sendJson(res, 400, { error: "Моля, въведи валиден телефон." });
    if (!isEmail(email)) return sendJson(res, 400, { error: "Моля, въведи валиден имейл адрес." });
    if (message.length < 5) return sendJson(res, 400, { error: "Моля, въведи съобщение." });
    if (!consent) return sendJson(res, 400, { error: "Моля, потвърди съгласието за връзка." });

    let rows;
    try {
      rows = await supabaseRequest("contact_inquiries", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify([
          {
            name,
            phone,
            email,
            message,
            status: "new",
          },
        ]),
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
        to: process.env.ADMIN_EMAIL,
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
      });
    } catch (emailError) {
      console.error("Contact inquiry admin email failed:", emailError);
    }

    return sendJson(res, 201, { ok: true, inquiry: rows?.[0] || null });
  } catch (error) {
    console.error("Contact inquiry failed:", error);
    return sendJson(res, 500, { error: "Възникна проблем при изпращане на съобщението." });
  }
};
