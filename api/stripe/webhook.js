const {
  getProgramsByIds,
  getProgramsFromCheckoutLineItems,
  getOrigin,
  hasSupabaseAdmin,
  listCheckoutSessionLineItems,
  logAdminEvent,
  readRawBody,
  sendEmail,
  sendJson,
  supabaseRequest,
  upsertOrders,
  validateProgramAccessLinks,
  verifyStripeSignature,
} = require("../_shared");

const trackCompletedPurchase = async ({ session, programs, origin }) => {
  if (!hasSupabaseAdmin()) return;
  const metadata = session.metadata || {};
  const summerProgram = programs.find((program) => program.id === "summer-program");
  if (!summerProgram || metadata.pageVariant !== "summer-program") return;

  await supabaseRequest("landing_analytics_events?on_conflict=stripe_checkout_session_id,program_id,event_name", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([
      {
        session_id: metadata.landingSessionId || `stripe-${session.id}`,
        landing_page_url: metadata.landingPageUrl || `${origin}/summer-program`,
        page_variant: "summer-program",
        event_name: "purchase_completed",
        utm_source: metadata.utm_source || null,
        utm_medium: metadata.utm_medium || null,
        utm_campaign: metadata.utm_campaign || null,
        utm_content: metadata.utm_content || null,
        utm_term: metadata.utm_term || null,
        referrer: metadata.referrer || null,
        device_type: metadata.deviceType || "unknown",
        stripe_checkout_session_id: session.id,
        program_id: summerProgram.id,
      },
    ]),
  });
};

const customerFromMetadata = (metadata = {}) => ({
  customerName: metadata.customerName || "Become Pro клиент",
  customerEmail: metadata.customerEmail || "",
  customerPhone: metadata.customerPhone || "",
  playerName: metadata.playerName || "",
  playerAge: metadata.playerAge || "",
});

const customerFromSession = (session = {}) => {
  const metadata = session.metadata || {};
  return {
    customerName: metadata.customerName || session.customer_details?.name || "Become Pro клиент",
    customerEmail: metadata.customerEmail || session.customer_details?.email || session.customer_email || "",
    customerPhone: metadata.customerPhone || session.customer_details?.phone || "",
    playerName: metadata.playerName || "",
    playerAge: metadata.playerAge || "",
  };
};

const attributionFromMetadata = (metadata = {}) => ({
  landingSessionId: metadata.landingSessionId || "",
  landingPageUrl: metadata.landingPageUrl || "",
  pageVariant: metadata.pageVariant || "",
  utm_source: metadata.utm_source || "",
  utm_medium: metadata.utm_medium || "",
  utm_campaign: metadata.utm_campaign || "",
  utm_content: metadata.utm_content || "",
  utm_term: metadata.utm_term || "",
  referrer: metadata.referrer || "",
  deviceType: metadata.deviceType || "",
});

const programsFromMetadata = (metadata = {}) => {
  const ids = String(metadata.programId || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length ? getProgramsByIds(ids) : [];
};

const programsFromSession = async (session = {}) => {
  const metadataPrograms = programsFromMetadata(session.metadata || {});
  if (metadataPrograms.length) return metadataPrograms;

  try {
    return getProgramsFromCheckoutLineItems(await listCheckoutSessionLineItems(session.id));
  } catch (error) {
    await logAdminEvent({
      event: "stripe_program_lookup_failed",
      message: "Could not resolve purchased program from Stripe Checkout line items.",
      stripeSessionId: session.id,
      metadata: { error: error.message },
    });
    return [];
  }
};

const formatProgramsForEmail = (programs) =>
  programs.map((program) => `${program.name}\n${program.programLink}`).join("\n\n");

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getCustomerGreeting = (customerName) => {
  const name = String(customerName || "").trim();
  return name && name !== "Become Pro клиент" ? `Здравей, ${name},` : "Здравей,";
};

const buildCustomerEmailText = ({ programs, customer }) => `${getCustomerGreeting(customer.customerName)}

Поздравления! 🎉
Току-що направи първата крачка към по-добра подготовка през лятото.

Благодарим ти, че избра Become Pro.

Плащането е успешно. По-долу ще откриеш достъпа до Лятната програма.

Закупена програма:
${programs.map((program) => program.name).join(", ")}

Отвори Лятната програма от съответния линк:
${formatProgramsForEmail(programs)}

Какво следва?
- Отвори програмата
- Прегледай всички модули
- Избери с коя част започваш
- Следвай плана стъпка по стъпка

Програмата е създадена, за да ти помогне да тренираш с ясна структура, конкретна цел и повече увереност през лятната пауза.

Ако имаш въпроси или проблем с достъпа, пиши ни на become.pro2024@gmail.com.

Последвай Become Pro за още футболно съдържание:
Instagram: @become_pro2024

Поздрави,
Become Pro`;

const buildCustomerEmailHtml = ({ programs, customer }) => {
  const programBlocks = programs
    .map(
      (program) => `
        <tr>
          <td style="padding:0 0 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e6dfcf;border-radius:14px;background:#fffdf8;">
              <tr>
                <td class="program-card" style="padding:22px;">
                  <p style="margin:0 0 14px;color:#17150f;font-size:18px;font-weight:800;">${escapeHtml(program.name)}</p>
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="border-radius:9px;background:#f5c400;">
                        <a class="program-button" href="${escapeHtml(program.programLink)}" style="display:inline-block;padding:13px 22px;color:#11100c;font-size:15px;font-weight:800;text-decoration:none;" target="_blank">Отвори Лятната програма</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:16px 0 6px;color:#6d675c;font-size:12px;line-height:1.55;">Ако бутонът не работи, отвори директния линк:</p>
                  <p style="margin:0;font-size:12px;line-height:1.55;word-break:break-all;overflow-wrap:anywhere;">
                    <a href="${escapeHtml(program.programLink)}" style="color:#8b6800;">${escapeHtml(program.programLink)}</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="bg">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Достъп до твоята Become Pro програма</title>
    <style>
      @media only screen and (max-width: 480px) {
        .email-wrapper { padding: 24px 10px !important; }
        .email-card { padding: 24px 18px !important; }
        .email-title { font-size: 25px !important; line-height: 1.18 !important; }
        .program-card { padding: 20px 16px !important; }
        .program-button { display: block !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#070706;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070706;">
      <tr>
        <td class="email-wrapper" align="center" style="padding:34px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;">
            <tr>
              <td align="center" style="padding:0 0 20px;">
                <img src="https://become-pro-ivory.vercel.app/assets/becomepro-logo.png" width="78" height="78" alt="Become Pro" style="display:block;width:78px;height:78px;object-fit:contain;" />
              </td>
            </tr>
            <tr>
              <td class="email-card" style="padding:34px;border:1px solid #302b1d;border-radius:20px;background:#11110f;">
                <p style="margin:0 0 10px;color:#f5c400;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">Become Pro</p>
                <h1 class="email-title" style="margin:0 0 22px;color:#ffffff;font-size:28px;line-height:1.2;">Достъп до твоята Become Pro програма</h1>
                <p style="margin:0 0 12px;color:#f4f0e6;font-size:16px;line-height:1.65;">${escapeHtml(getCustomerGreeting(customer.customerName))}</p>
                <p style="margin:0 0 8px;color:#ffffff;font-size:18px;line-height:1.5;font-weight:800;">Поздравления! 🎉</p>
                <p style="margin:0 0 18px;color:#f4f0e6;font-size:16px;line-height:1.65;">Току-що направи първата крачка към по-добра подготовка през лятото.</p>
                <p style="margin:0 0 26px;color:#c9c3b5;font-size:15px;line-height:1.65;">Плащането е успешно. По-долу ще откриеш достъпа до Лятната програма.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${programBlocks}
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 22px;border:1px solid #302b1d;border-radius:16px;background:#171610;">
                  <tr>
                    <td style="padding:22px;">
                      <p style="margin:0 0 14px;color:#f5c400;font-size:16px;font-weight:800;">Какво следва?</p>
                      <p style="margin:0 0 8px;color:#f4f0e6;font-size:14px;line-height:1.55;">✓ Отвори програмата</p>
                      <p style="margin:0 0 8px;color:#f4f0e6;font-size:14px;line-height:1.55;">✓ Прегледай всички модули</p>
                      <p style="margin:0 0 8px;color:#f4f0e6;font-size:14px;line-height:1.55;">✓ Избери с коя част започваш</p>
                      <p style="margin:0;color:#f4f0e6;font-size:14px;line-height:1.55;">✓ Следвай плана стъпка по стъпка</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 18px;color:#c9c3b5;font-size:14px;line-height:1.65;">Програмата е създадена, за да ти помогне да тренираш с ясна структура, конкретна цел и повече увереност през лятната пауза.</p>
                <p style="margin:8px 0 0;color:#c9c3b5;font-size:14px;line-height:1.65;">При проблем с достъпа пиши на <a href="mailto:become.pro2024@gmail.com" style="color:#f5c400;">become.pro2024@gmail.com</a>.</p>
                <p style="margin:22px 0 0;color:#c9c3b5;font-size:14px;line-height:1.65;">Последвай Become Pro за още футболно съдържание:<br /><strong style="color:#ffffff;">Instagram: @become_pro2024</strong></p>
                <p style="margin:26px 0 0;color:#ffffff;font-size:14px;line-height:1.6;">Поздрави,<br /><strong>Become Pro</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const ensureFulfillmentPayload = async ({ programs, session }) => {
  if (!programs.length) {
    await logAdminEvent({
      event: "stripe_program_missing",
      message: "Checkout session has no recognizable purchased program. Fulfillment email was not sent.",
      stripeSessionId: session.id,
      metadata: { metadata: session.metadata || {} },
    });
    return false;
  }

  const validPrograms = validateProgramAccessLinks(programs);
  if (validPrograms.length !== programs.length) {
    await logAdminEvent({
      event: "fulfillment_access_link_missing",
      message: "Purchased program is missing a valid Google Drive access link. Fulfillment email was not sent.",
      stripeSessionId: session.id,
      metadata: {
        programs: programs.map((program) => ({
          id: program.id,
          name: program.name,
          programLink: program.programLink || "",
        })),
      },
    });
    return false;
  }

  return true;
};

const markDeliveryFailed = async ({ programs, customer, session, reason, error }) => {
  await logAdminEvent({
    event: "fulfillment_delivery_failed",
    message: `Paid checkout session requires manual delivery: ${reason}.`,
    stripeSessionId: session.id,
    metadata: {
      reason,
      error: error?.message || String(error || ""),
      programs: programs.map((program) => ({ id: program.id, name: program.name })),
      customerEmail: customer.customerEmail,
    },
  });

  if (!hasSupabaseAdmin()) return;

  try {
    await upsertOrders({
      programs,
      customer,
      status: "delivery_failed",
      sessionId: session.id,
      paymentIntentId: session.payment_intent || null,
      attribution: attributionFromMetadata(session.metadata || {}),
    });
  } catch (deliveryStatusError) {
    console.error("Delivery-failed order persistence failed:", deliveryStatusError);
    await logAdminEvent({
      event: "delivery_failed_persistence_failed",
      message: "Could not save delivery_failed status for a paid checkout session.",
      stripeSessionId: session.id,
      metadata: { error: deliveryStatusError.message, reason },
    });
  }
};

const sendFulfillmentEmails = async ({ programs, customer, session }) => {
  await sendEmail({
    to: customer.customerEmail,
    subject: "Достъп до твоята Become Pro програма",
    text: buildCustomerEmailText({ programs, customer }),
    html: buildCustomerEmailHtml({ programs, customer }),
  });

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: "Нова поръчка в Become Pro",
    text: `Име на клиента:
${customer.customerName}

Имейл:
${customer.customerEmail}

Телефон:
${customer.customerPhone}

Играч:
${customer.playerName || "-"}, ${customer.playerAge || "-"}

Закупена програма:
${programs.map((program) => program.name).join(", ")}

Цена:
${programs.map((program) => `${program.name}: €${program.price.toFixed(2)}`).join("\n")}

Статус:
paid

Stripe Session ID:
${session.id}

Изпратен линк:
${formatProgramsForEmail(programs)}`,
  });
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const rawBody = await readRawBody(req);
    verifyStripeSignature(rawBody, req.headers["stripe-signature"]);
    const event = JSON.parse(rawBody.toString("utf8"));

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const programs = await programsFromSession(session);
      const customer = customerFromSession(session);

      if (!(await ensureFulfillmentPayload({ programs, session }))) {
        return sendJson(res, 200, { received: true });
      }

      if (hasSupabaseAdmin()) {
        try {
          await upsertOrders({
            programs,
            customer,
            status: "paid",
            sessionId: session.id,
            paymentIntentId: session.payment_intent || null,
            attribution: attributionFromMetadata(session.metadata || {}),
          });
        } catch (persistenceError) {
          console.error("Paid order persistence failed:", persistenceError);
          await markDeliveryFailed({
            programs,
            customer,
            session,
            reason: "paid_order_save_failed",
            error: persistenceError,
          });
        }
      }

      try {
        await trackCompletedPurchase({
          session,
          programs,
          origin: getOrigin(req),
        });
      } catch (analyticsError) {
        console.error("Purchase analytics failed:", analyticsError);
        await logAdminEvent({
          level: "error",
          event: "purchase_analytics_failed",
          message: "Paid Summer Program order could not be added to landing analytics.",
          stripeSessionId: session.id,
          metadata: { programIds: programs.map((program) => program.id), error: analyticsError.message },
        });
      }

      try {
        await sendFulfillmentEmails({ programs, customer, session });
      } catch (emailError) {
        console.error("Fulfillment email failed", emailError);
        await markDeliveryFailed({
          programs,
          customer,
          session,
          reason: "email_delivery_failed",
          error: emailError,
        });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata || {};
      const programs = programsFromMetadata(metadata);
      const customer = customerFromMetadata(metadata);

      if (programs.length && hasSupabaseAdmin()) {
        await upsertOrders({
          programs,
          customer,
          status: "failed",
          sessionId: null,
          paymentIntentId: paymentIntent.id,
          attribution: attributionFromMetadata(metadata),
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const programs = programsFromMetadata(metadata);
      const customer = customerFromSession(session);

      if (programs.length && hasSupabaseAdmin()) {
        await upsertOrders({
          programs,
          customer,
          status: "expired",
          sessionId: session.id,
          paymentIntentId: session.payment_intent || null,
          attribution: attributionFromMetadata(metadata),
        });
      }
    }

    return sendJson(res, 200, { received: true });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "Webhook failed." });
  }
};
