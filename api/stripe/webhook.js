const {
  getProgramsByIds,
  hasSupabaseAdmin,
  readRawBody,
  sendEmail,
  sendJson,
  upsertOrders,
  verifyStripeSignature,
} = require("../_shared");

const customerFromMetadata = (metadata = {}) => ({
  customerName: metadata.customerName || "Become Pro клиент",
  customerEmail: metadata.customerEmail || "",
  customerPhone: metadata.customerPhone || "",
  playerName: metadata.playerName || "",
  playerAge: metadata.playerAge || "",
});

const programsFromMetadata = (metadata = {}) => getProgramsByIds(String(metadata.programId || "").split(","));

const formatProgramsForEmail = (programs) =>
  programs.map((program) => `${program.name}\n${program.programLink}`).join("\n\n");

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
${formatProgramsForEmail(programs)}

Ако имаш въпроси или проблем с достъпа, свържи се с нас.

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
      const metadata = session.metadata || {};
      const programs = programsFromMetadata(metadata);
      const customer = customerFromMetadata(metadata);

      if (hasSupabaseAdmin()) {
        await upsertOrders({
          programs,
          customer,
          status: "paid",
          sessionId: session.id,
          paymentIntentId: session.payment_intent || null,
        });
      }

      try {
        await sendFulfillmentEmails({ programs, customer, session });
      } catch (emailError) {
        console.error("Fulfillment email failed", emailError);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata || {};
      const programs = programsFromMetadata(metadata);
      const customer = customerFromMetadata(metadata);

      if (hasSupabaseAdmin()) {
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
      const customer = customerFromMetadata(metadata);

      if (hasSupabaseAdmin()) {
        await upsertOrders({
          programs,
          customer,
          status: "cancelled",
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
