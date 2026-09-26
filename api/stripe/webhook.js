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
  const landingProgram = programs.find((program) => program.id === metadata.pageVariant);
  if (!landingProgram) return;

  await supabaseRequest("landing_analytics_events?on_conflict=stripe_checkout_session_id,program_id,event_name", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([
      {
        session_id: metadata.landingSessionId || `stripe-${session.id}`,
        landing_page_url: metadata.landingPageUrl || `${origin}/${landingProgram.id}`,
        page_variant: metadata.pageVariant,
        event_name: "purchase_completed",
        utm_source: metadata.utm_source || null,
        utm_medium: metadata.utm_medium || null,
        utm_campaign: metadata.utm_campaign || null,
        utm_content: metadata.utm_content || null,
        utm_term: metadata.utm_term || null,
        referrer: metadata.referrer || null,
        device_type: metadata.deviceType || "unknown",
        stripe_checkout_session_id: session.id,
        program_id: landingProgram.id,
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

const getEmailContent = (programs) => {
  if (programs.length !== 1) {
    return {
      intro: "Твоите Become Pro програми вече са готови.",
      access: "Плащането е успешно. По-долу ще откриеш достъпа до закупените програми.",
      closing: "Следвай материалите стъпка по стъпка и се връщай към тях винаги когато имаш нужда.",
    };
  }

  if (programs[0].id === "matchday-pack") {
    return {
      intro: "Твоята ясна рутина около мача вече е готова.",
      access: "Плащането е успешно. По-долу ще откриеш достъпа до Мачов пакет.",
      closing: "Използвай Мачов пакет преди всеки важен мач, за да подредиш подготовката, фокуса и възстановяването си.",
    };
  }

  if (programs[0].id === "summer-program") {
    return {
      intro: "Твоята структурирана подготовка за лятната пауза вече е готова.",
      access: "Плащането е успешно. По-долу ще откриеш достъпа до Лятната програма.",
      closing: "Следвай програмата стъпка по стъпка, за да тренираш с ясна структура и конкретна цел през лятната пауза.",
    };
  }

  return {
    intro: "Твоята Become Pro програма вече е готова.",
    access: `Плащането е успешно. По-долу ще откриеш достъпа до ${programs[0].name}.`,
    closing: "Следвай програмата стъпка по стъпка и се връщай към нея винаги когато имаш нужда.",
  };
};

const buildCustomerEmailText = ({ programs, customer }) => {
  const content = getEmailContent(programs);
  return `${getCustomerGreeting(customer.customerName)}

Поздравления! 🎉
${content.intro}

Благодарим ти, че избра Become Pro.

${content.access}

Закупена програма:
${programs.map((program) => program.name).join(", ")}

Отвори закупената програма от съответния линк:
${formatProgramsForEmail(programs)}

Какво следва?
- Отвори програмата
- Прегледай съдържанието
- Избери откъде започваш
- Следвай плана стъпка по стъпка

${content.closing}

Ако имаш въпроси или проблем с достъпа, пиши ни на become.pro2024@gmail.com.

Последвай Become Pro за още футболно съдържание:
Instagram: @become_pro2024

Поздрави,
Become Pro`;
};

const buildCustomerEmailHtml = ({ programs, customer }) => {
  const content = getEmailContent(programs);
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
                        <a class="program-button" href="${escapeHtml(program.programLink)}" style="display:inline-block;padding:13px 22px;color:#11100c;font-size:15px;font-weight:800;text-decoration:none;" target="_blank">Отвори ${escapeHtml(program.name)}</a>
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
                <img src="https://becomeprofootball.com/assets/becomepro-logo-compact.webp" width="78" height="78" alt="Become Pro" style="display:block;width:78px;height:78px;object-fit:contain;" />
              </td>
            </tr>
            <tr>
              <td class="email-card" style="padding:34px;border:1px solid #302b1d;border-radius:20px;background:#11110f;">
                <p style="margin:0 0 10px;color:#f5c400;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">Become Pro</p>
                <h1 class="email-title" style="margin:0 0 22px;color:#ffffff;font-size:28px;line-height:1.2;">Достъп до твоята Become Pro програма</h1>
                <p style="margin:0 0 12px;color:#f4f0e6;font-size:16px;line-height:1.65;">${escapeHtml(getCustomerGreeting(customer.customerName))}</p>
                <p style="margin:0 0 8px;color:#ffffff;font-size:18px;line-height:1.5;font-weight:800;">Поздравления! 🎉</p>
                <p style="margin:0 0 18px;color:#f4f0e6;font-size:16px;line-height:1.65;">${escapeHtml(content.intro)}</p>
                <p style="margin:0 0 26px;color:#c9c3b5;font-size:15px;line-height:1.65;">${escapeHtml(content.access)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${programBlocks}
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 22px;border:1px solid #302b1d;border-radius:16px;background:#171610;">
                  <tr>
                    <td style="padding:22px;">
                      <p style="margin:0 0 14px;color:#f5c400;font-size:16px;font-weight:800;">Какво следва?</p>
                      <p style="margin:0 0 8px;color:#f4f0e6;font-size:14px;line-height:1.55;">✓ Отвори програмата</p>
                      <p style="margin:0 0 8px;color:#f4f0e6;font-size:14px;line-height:1.55;">✓ Прегледай съдържанието</p>
                      <p style="margin:0 0 8px;color:#f4f0e6;font-size:14px;line-height:1.55;">✓ Избери откъде започваш</p>
                      <p style="margin:0;color:#f4f0e6;font-size:14px;line-height:1.55;">✓ Следвай плана стъпка по стъпка</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 18px;color:#c9c3b5;font-size:14px;line-height:1.65;">${escapeHtml(content.closing)}</p>
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

const deliveryPath = (sessionId, channel) =>
  `fulfillment_deliveries?stripe_checkout_session_id=eq.${encodeURIComponent(sessionId)}&channel=eq.${encodeURIComponent(channel)}`;

const beginDelivery = async ({ sessionId, channel }) => {
  if (!hasSupabaseAdmin()) return { shouldSend: true, tracked: false };

  try {
    const inserted = await supabaseRequest("fulfillment_deliveries?on_conflict=stripe_checkout_session_id,channel", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify([
        {
          stripe_checkout_session_id: sessionId,
          channel,
          status: "sending",
          attempts: 1,
          updated_at: new Date().toISOString(),
        },
      ]),
    });
    if (Array.isArray(inserted) && inserted.length) return { shouldSend: true, tracked: true };

    const existing = await supabaseRequest(`${deliveryPath(sessionId, channel)}&select=status,attempts,updated_at`);
    const delivery = existing?.[0];
    if (delivery?.status === "delivered") return { shouldSend: false, tracked: true };

    const updatedAt = delivery?.updated_at ? new Date(delivery.updated_at).getTime() : 0;
    const activeClaim = delivery?.status === "sending" && Date.now() - updatedAt < 15 * 60 * 1000;
    if (activeClaim) return { shouldSend: false, tracked: true };

    await supabaseRequest(deliveryPath(sessionId, channel), {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "sending",
        attempts: Number(delivery?.attempts || 0) + 1,
        last_error: null,
        updated_at: new Date().toISOString(),
      }),
    });
    return { shouldSend: true, tracked: true };
  } catch (error) {
    await logAdminEvent({
      level: "error",
      event: "fulfillment_idempotency_unavailable",
      message: "Fulfillment delivery tracking was unavailable; delivery continued in fail-open mode.",
      stripeSessionId: sessionId,
      metadata: { channel, error: error.message },
    });
    return { shouldSend: true, tracked: false };
  }
};

const finishDelivery = async ({ sessionId, channel, tracked, error }) => {
  if (!tracked || !hasSupabaseAdmin()) return;
  await supabaseRequest(deliveryPath(sessionId, channel), {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status: error ? "failed" : "delivered",
      last_error: error ? error.message || String(error) : null,
      delivered_at: error ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
};

const deliverOnce = async ({ sessionId, channel, send }) => {
  const claim = await beginDelivery({ sessionId, channel });
  if (!claim.shouldSend) return { skipped: true };
  try {
    const result = await send();
    await finishDelivery({ sessionId, channel, tracked: claim.tracked });
    return result;
  } catch (error) {
    try {
      await finishDelivery({ sessionId, channel, tracked: claim.tracked, error });
    } catch (trackingError) {
      await logAdminEvent({
        level: "error",
        event: "fulfillment_delivery_tracking_failed",
        message: "A delivery failed and its failure status could not be saved.",
        stripeSessionId: sessionId,
        metadata: { channel, error: error.message, trackingError: trackingError.message },
      });
    }
    throw error;
  }
};

const buildAdminOrderText = ({ programs, customer, session }) => `Име на клиента:
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
${formatProgramsForEmail(programs)}`;

const sendFulfillmentEmails = async ({ programs, customer, session }) => {
  const customerDelivery = deliverOnce({
    sessionId: session.id,
    channel: "customer",
    send: () =>
      sendEmail({
        to: customer.customerEmail,
        subject: programs.length === 1 ? `Достъп до ${programs[0].name}` : "Достъп до твоите Become Pro програми",
        text: buildCustomerEmailText({ programs, customer }),
        html: buildCustomerEmailHtml({ programs, customer }),
      }),
  });
  const adminDelivery = deliverOnce({
    sessionId: session.id,
    channel: "admin",
    send: () =>
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "Нова поръчка в Become Pro",
        text: buildAdminOrderText({ programs, customer, session }),
      }),
  });

  const [customerResult, adminResult] = await Promise.allSettled([customerDelivery, adminDelivery]);
  if (adminResult.status === "rejected") {
    await logAdminEvent({
      level: "error",
      event: "admin_order_notification_failed",
      message: "The customer fulfillment was processed, but the admin order notification failed.",
      stripeSessionId: session.id,
      metadata: { error: adminResult.reason?.message || String(adminResult.reason || "") },
    });
  }
  if (customerResult.status === "rejected") throw customerResult.reason;

  return { customer: customerResult.value, admin: adminResult.status === "fulfilled" ? adminResult.value : null };
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
          await logAdminEvent({
            level: "error",
            event: "paid_order_persistence_failed",
            message: "The payment succeeded, but the paid order could not be saved before fulfillment.",
            stripeSessionId: session.id,
            metadata: { error: persistenceError.message, programIds: programs.map((program) => program.id) },
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
          message: "Paid landing-page order could not be added to landing analytics.",
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
        return sendJson(res, 500, { error: "Customer access email delivery failed. Stripe will retry the webhook." });
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

module.exports._test = {
  buildCustomerEmailHtml,
  buildCustomerEmailText,
  getEmailContent,
};
