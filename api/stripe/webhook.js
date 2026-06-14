const {
  getProgramsByIds,
  getProgramsFromCheckoutLineItems,
  hasSupabaseAdmin,
  listCheckoutSessionLineItems,
  logAdminEvent,
  readRawBody,
  sendEmail,
  sendJson,
  upsertOrders,
  validateProgramAccessLinks,
  VIBER_GROUP_LINK,
  verifyStripeSignature,
} = require("../_shared");

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

const formatViberBonusForEmail = () =>
  VIBER_GROUP_LINK
    ? `\n\nБонус: Viber група\n${VIBER_GROUP_LINK}`
    : "\n\nБонус: Viber група\nАко програмата включва Viber бонус, ще получиш достъп и до групата.";

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
    text: `Здравей, ${customer.customerName},

Благодарим ти, че избра Become Pro.

Покупката ти е успешна.

Закупена програма:
${programs.map((program) => program.name).join(", ")}

Можеш да достъпиш програмата от този линк:
${formatProgramsForEmail(programs)}${formatViberBonusForEmail()}

Ако имаш въпроси или проблем с достъпа, свържи се с нас.
Contact: become.pro2024@gmail.com

Поздрави,
Become Pro`,
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
${formatProgramsForEmail(programs)}${formatViberBonusForEmail()}`,
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
        });
      }
    }

    return sendJson(res, 200, { received: true });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "Webhook failed." });
  }
};
