const { readJsonBody, sendEmail, sendJson, supabaseRequest } = require("./_shared");

const APPLICANT_TYPES = new Set(["Моето дете", "Себе си"]);

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    const applicantType = cleanText(body.applicantType, 40);
    const name = cleanText(body.name, 120);
    const city = cleanText(body.city, 120);
    const phone = cleanText(body.phone, 40);

    if (!APPLICANT_TYPES.has(applicantType)) {
      return sendJson(res, 400, { error: "Моля, избери кого искаш да запишеш." });
    }
    if (name.length < 2) return sendJson(res, 400, { error: "Моля, въведи име." });
    if (city.length < 2) return sendJson(res, 400, { error: "Моля, въведи град." });
    if (phone.length < 6) return sendJson(res, 400, { error: "Моля, въведи валиден телефон." });

    const rows = await supabaseRequest("training_requests", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([
        {
          applicant_type: applicantType,
          who: applicantType,
          name,
          city,
          phone,
          status: "new",
        },
      ]),
    });

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "Нова заявка за индивидуална тренировка",
        text: [
          "Получена е нова заявка за индивидуална тренировка.",
          "",
          `Кого искат да запишат: ${applicantType}`,
          `Име: ${name}`,
          `Град: ${city}`,
          `Телефон: ${phone}`,
          "",
          "Заявката е записана в админ панела.",
        ].join("\n"),
      });
    } catch (emailError) {
      console.error("Training request admin email failed:", emailError);
    }

    return sendJson(res, 201, { ok: true, request: rows?.[0] || null });
  } catch (error) {
    console.error("Training request failed:", error);
    return sendJson(res, 500, { error: "Възникна проблем при изпращане на заявката." });
  }
};
