const crypto = require("crypto");
const tls = require("tls");

const PROGRAM_LINK = "https://drive.google.com/file/d/1OXwQyMSRqO-e10RVv-fl16YiF1fMA0Lk/view?usp=sharing";
const PROGRAM_LINKS = {
  "technical-pack": "https://drive.google.com/file/d/1OXwQyMSRqO-e10RVv-fl16YiF1fMA0Lk/view?usp=sharing",
  "strength-level-1": "https://drive.google.com/file/d/1qS-VwiYIMCZ0Mw2mxOouFr7Y97Mq7iNl/view?usp=sharing",
  "strength-level-2": "https://drive.google.com/file/d/1MK_AsqPkBwZWU0-6hVgBk3iROQ0DMRfm/view?usp=sharing",
  "strength-level-3": "https://drive.google.com/file/d/1atcTXsukVSr3lWvggcfEdqvHCbTZIfLF/view?usp=sharing",
  "summer-program": "https://drive.google.com/file/d/10PK5AIcqO8xb1Xx4gzKWxIUG_pS96HO_/view?usp=sharing",
  "matchday-pack": "https://drive.google.com/file/d/16x5DuIX8f7p7UyZNQ972EKU1YSEGLBQX/view?usp=sharing",
};
const ORDER_STATUSES = new Set(["pending", "paid", "failed", "expired", "delivery_failed"]);
const STRIPE_API_VERSION = "2026-02-25.clover";

const productCatalog = {
  "technical-pack": {
    id: "technical-pack",
    name: "Технически пакет",
    price: 0.5,
    priceCents: 50,
    image: "/assets/program-cover-technical-pack.png",
    programLink: PROGRAM_LINKS["technical-pack"],
    description:
      "Пълна техническа система за футболисти, които искат по-добър контрол, по-уверени действия с топката и повече качество в игра.",
  },
  "strength-level-1": {
    id: "strength-level-1",
    name: "Силова програма — Ниво 1",
    price: 0.5,
    priceCents: 50,
    image: "/assets/program-cover-strength-level-1.jfif",
    programLink: PROGRAM_LINKS["strength-level-1"],
    description:
      "Начална силова програма за футболисти, които искат стабилна основа, правилна техника и по-добър контрол на тялото.",
  },
  "strength-level-2": {
    id: "strength-level-2",
    name: "Силова програма — Ниво 2",
    price: 0.5,
    priceCents: 50,
    image: "/assets/program-cover-strength-level-2.jfif",
    programLink: PROGRAM_LINKS["strength-level-2"],
    description:
      "Следващо ниво за футболисти, които вече имат основа и искат повече сила, експлозивност и устойчивост.",
  },
  "strength-level-3": {
    id: "strength-level-3",
    name: "Силова програма — Ниво 3",
    price: 0.5,
    priceCents: 50,
    image: "/assets/program-cover-strength-level-3.jfif",
    programLink: PROGRAM_LINKS["strength-level-3"],
    description:
      "Напреднала програма за футболисти, които искат по-висока физическа готовност, мощност и атлетизъм.",
  },
  "summer-program": {
    id: "summer-program",
    name: "Лятна програма",
    price: 0.5,
    priceCents: 50,
    image: "/assets/program-cover-summer.png",
    programLink: PROGRAM_LINKS["summer-program"],
    description:
      "Структурирана програма за футболисти, които искат да използват лятото правилно и да се върнат по-подготвени.",
  },
  "matchday-pack": {
    id: "matchday-pack",
    name: "Мачов пакет",
    price: 0.5,
    priceCents: 50,
    image: "/assets/program-cover-matchday.png",
    programLink: PROGRAM_LINKS["matchday-pack"],
    description:
      "Пакет за играчи, които искат по-добра рутина преди мач, повече спокойствие и по-добра мачова готовност.",
  },
};

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const readRawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const readJsonBody = async (req) => {
  const raw = await readRawBody(req);
  if (!raw.length) return {};
  return JSON.parse(raw.toString("utf8"));
};

const getOrigin = (req) => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) return configured.startsWith("http") ? configured.replace(/\/$/, "") : `https://${configured.replace(/\/$/, "")}`;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
};

const getProgramsByIds = (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const programs = uniqueIds.map((id) => productCatalog[id]).filter(Boolean);
  if (!programs.length || programs.length !== uniqueIds.length) {
    throw new Error("Invalid or missing program selection.");
  }
  return programs;
};

const getProgramsByNames = (names) => {
  const normalizedNames = new Set(names.map((name) => String(name || "").trim()).filter(Boolean));
  return Object.values(productCatalog).filter((program) => normalizedNames.has(program.name));
};

const createStripeCheckoutSession = async ({ programs, customer, origin, attribution = {} }) => {
  const metadata = {
    programId: programs.map((program) => program.id).join(","),
    programName: programs.map((program) => program.name).join(", "),
    customerName: customer.customerName,
    customerEmail: customer.customerEmail,
    customerPhone: customer.customerPhone,
    playerName: customer.playerName || "",
    playerAge: customer.playerAge || "",
    landingSessionId: attribution.landingSessionId || "",
    landingPageUrl: attribution.landingPageUrl || "",
    pageVariant: attribution.pageVariant || "",
    utm_source: attribution.utm_source || "",
    utm_medium: attribution.utm_medium || "",
    utm_campaign: attribution.utm_campaign || "",
    utm_content: attribution.utm_content || "",
    utm_term: attribution.utm_term || "",
    referrer: attribution.referrer || "",
    deviceType: attribution.deviceType || "",
  };

  const body = new URLSearchParams();
  body.append("mode", "payment");
  body.append("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  body.append("cancel_url", `${origin}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`);
  if (customer.customerEmail) body.append("customer_email", customer.customerEmail);
  body.append("customer_creation", "always");
  body.append("billing_address_collection", "auto");
  body.append("phone_number_collection[enabled]", "true");
  body.append("payment_method_types[]", "card");

  Object.entries(metadata).forEach(([key, value]) => {
    body.append(`metadata[${key}]`, value || "");
    body.append(`payment_intent_data[metadata][${key}]`, value || "");
  });

  programs.forEach((program, index) => {
    body.append(`line_items[${index}][quantity]`, "1");
    body.append(`line_items[${index}][price_data][currency]`, "eur");
    body.append(`line_items[${index}][price_data][unit_amount]`, String(program.priceCents));
    body.append(`line_items[${index}][price_data][product_data][name]`, program.name);
    body.append(`line_items[${index}][price_data][product_data][description]`, program.description);
    body.append(`line_items[${index}][price_data][product_data][images][]`, `${origin}${program.image}`);
    body.append(`line_items[${index}][price_data][product_data][metadata][programId]`, program.id);
    body.append(`line_items[${index}][price_data][product_data][metadata][programName]`, program.name);
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${required("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body,
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Stripe Checkout session failed.");
  return payload;
};

const listCheckoutSessionLineItems = async (sessionId) => {
  if (!sessionId) return [];
  const payload = await stripeRequest(
    `checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100&expand[]=data.price.product`,
  );
  return payload.data || [];
};

const getProgramsFromCheckoutLineItems = (lineItems = []) => {
  const ids = lineItems
    .map((item) => item?.price?.product?.metadata?.programId)
    .filter(Boolean);

  if (ids.length) return getProgramsByIds(ids);

  const names = lineItems.map((item) => item?.price?.product?.name || item?.description).filter(Boolean);
  const programs = getProgramsByNames(names);
  return programs.length === names.length ? programs : [];
};

const validateProgramAccessLinks = (programs = []) =>
  programs.filter((program) => {
    try {
      const url = new URL(program.programLink || "");
      return url.hostname.includes("drive.google.com");
    } catch {
      return false;
    }
  });

const logAdminEvent = async ({ level = "error", event, message, stripeSessionId = null, metadata = {} }) => {
  const payload = {
    level,
    event,
    message,
    stripe_checkout_session_id: stripeSessionId,
    metadata,
  };

  console[level === "error" ? "error" : "log"](`[admin-log:${event}] ${message}`, payload);

  if (!hasSupabaseAdmin()) return { skipped: true };

  try {
    await supabaseRequest("admin_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify([payload]),
    });
    return { ok: true };
  } catch (error) {
    console.error("Admin log persistence failed:", error);
    return { skipped: true, error: error.message };
  }
};

const supabaseRequest = async (path, options = {}) => {
  const url = required("SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${text}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const hasSupabaseAdmin = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const isCheckoutEnabled = () => process.env.CHECKOUT_ENABLED === "true";

const orderRowsFromPrograms = ({ programs, customer, status, sessionId, paymentIntentId }) =>
  programs.map((program) => ({
    customer_name: customer.customerName,
    customer_email: customer.customerEmail,
    customer_phone: customer.customerPhone || null,
    player_name: customer.playerName || null,
    player_age: customer.playerAge || null,
    program_id: program.id,
    program_name: program.name,
    program_price: program.price,
    program_link: program.programLink,
    payment_status: status,
    payment_provider: "stripe",
    stripe_checkout_session_id: sessionId || null,
    stripe_payment_intent_id: paymentIntentId || null,
    updated_at: new Date().toISOString(),
  }));

const upsertOrders = async ({ programs, customer, status, sessionId, paymentIntentId }) => {
  if (!ORDER_STATUSES.has(status)) throw new Error("Invalid order status.");
  const rows = orderRowsFromPrograms({ programs, customer, status, sessionId, paymentIntentId });
  await supabaseRequest("orders?on_conflict=stripe_checkout_session_id,program_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
};

const stripeRequest = async (path, options = {}) => {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${required("STRIPE_SECRET_KEY")}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Stripe request failed.");
  return payload;
};

const listStripeOrders = async () => {
  const payload = await stripeRequest("checkout/sessions?limit=100");
  return (payload.data || []).flatMap((session) => {
    const metadata = session.metadata || {};
    let programs = [];

    try {
      programs = getProgramsByIds(String(metadata.programId || "").split(","));
    } catch (error) {
      programs = [
        {
          id: metadata.programId || "unknown",
          name: metadata.programName || "Unknown program",
          price: Number(session.amount_total || 0) / 100,
          programLink: PROGRAM_LINK,
        },
      ];
    }

    const status =
      session.payment_status === "paid"
        ? "paid"
        : session.status === "expired"
          ? "expired"
          : session.status === "complete"
            ? "paid"
            : "pending";

    return programs.map((program) => ({
      customer_name: metadata.customerName || session.customer_details?.name || session.customer_email || "-",
      customer_email: metadata.customerEmail || session.customer_details?.email || session.customer_email || "",
      customer_phone: metadata.customerPhone || session.customer_details?.phone || "",
      player_name: metadata.playerName || "",
      player_age: metadata.playerAge || "",
      program_id: program.id,
      program_name: program.name,
      program_price: program.price,
      program_link: program.programLink || PROGRAM_LINK,
      payment_status: status,
      payment_provider: "stripe",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent || "",
      created_at: new Date((session.created || 0) * 1000).toISOString(),
      updated_at: new Date((session.created || 0) * 1000).toISOString(),
    }));
  });
};

const getStripeDiagnostics = async () => {
  const [account, sessions] = await Promise.all([
    stripeRequest("account"),
    stripeRequest("checkout/sessions?limit=10"),
  ]);

  return {
    checkoutEnabled: isCheckoutEnabled(),
    environment: {
      stripeSecretKeyMode: String(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_")
        ? "live"
        : String(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_")
          ? "test"
          : "unknown",
      hasStripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY),
      siteUrl: getOrigin({ headers: { host: process.env.VERCEL_PROJECT_PRODUCTION_URL || "" } }),
    },
    account: {
      id: account.id,
      country: account.country,
      defaultCurrency: account.default_currency,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || "",
    },
    recentSessions: (sessions.data || []).map((session) => ({
      id: session.id,
      mode: session.mode,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email || session.metadata?.customerEmail || "",
      programId: session.metadata?.programId || "",
      programName: session.metadata?.programName || "",
      paymentIntentId: session.payment_intent || "",
      createdAt: session.created ? new Date(session.created * 1000).toISOString() : "",
    })),
  };
};

const encodeHeader = (value) => `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;

const sanitizeAddress = (value) => String(value || "").replace(/[\r\n]+/g, " ").trim();

const dotStuff = (value) =>
  String(value || "")
    .replace(/\r?\n/g, "\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");

const encodeBodyBase64 = (value) =>
  Buffer.from(String(value || "").replace(/\r?\n/g, "\r\n"), "utf8")
    .toString("base64")
    .replace(/.{1,76}/g, "$&\r\n")
    .trimEnd();

const escapeEmailHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const buildMultipartBody = ({ text, html, boundary }) =>
  [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodeBodyBase64(text),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodeBodyBase64(html),
    `--${boundary}--`,
  ].join("\r\n");

const sendSmtpEmail = async ({ to, subject, text, html }) => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass || !from || !to) return { skipped: true };

  const fromAddress = sanitizeAddress(from);
  const toAddress = sanitizeAddress(to);
  const envelopeFrom = fromAddress.match(/<([^>]+)>/)?.[1] || fromAddress;
  const boundary = `become-pro-${crypto.randomBytes(18).toString("hex")}`;
  const htmlBody = html || `<pre>${escapeEmailHtml(text)}</pre>`;
  const message = [
    `From: ${fromAddress}`,
    `To: ${toAddress}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `Date: ${new Date().toUTCString()}`,
    "",
    buildMultipartBody({ text, html: htmlBody, boundary }),
  ].join("\r\n");

  return new Promise((resolve, reject) => {
    let buffer = "";
    const socket = tls.connect(port, host, { servername: host });
    socket.setMaxListeners(30);

    const fail = (error) => {
      socket.destroy();
      reject(error);
    };

    const readResponse = () =>
      new Promise((resolveResponse, rejectResponse) => {
        const onData = (chunk) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split(/\r?\n/).filter(Boolean);
          const lastLine = lines[lines.length - 1] || "";
          if (/^\d{3}\s/.test(lastLine)) {
            socket.off("data", onData);
            const response = buffer;
            buffer = "";
            resolveResponse(response);
          }
        };

        const onError = (error) => {
          socket.off("data", onData);
          rejectResponse(error);
        };

        socket.once("error", onError);
        socket.on("data", onData);
      });

    const expect = async (code) => {
      const response = await readResponse();
      if (!response.startsWith(String(code))) throw new Error(`SMTP expected ${code}, received: ${response}`);
      return response;
    };

    const command = async (line, code) => {
      socket.write(`${line}\r\n`);
      return expect(code);
    };

    socket.once("error", fail);
    socket.once("secureConnect", async () => {
      try {
        await expect(220);
        await command(`EHLO ${host}`, 250);
        await command("AUTH LOGIN", 334);
        await command(Buffer.from(user, "utf8").toString("base64"), 334);
        await command(Buffer.from(pass, "utf8").toString("base64"), 235);
        await command(`MAIL FROM:<${envelopeFrom}>`, 250);
        await command(`RCPT TO:<${toAddress}>`, 250);
        await command("DATA", 354);
        socket.write(`${message}\r\n.\r\n`);
        await expect(250);
        await command("QUIT", 221);
        socket.end();
        resolve({ ok: true, provider: "smtp" });
      } catch (error) {
        fail(error);
      }
    });
  });
};

const sendResendEmail = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from || !to) return { skipped: true };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  if (!response.ok) throw new Error(`Email send failed: ${await response.text()}`);
  return response.json();
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (process.env.RESEND_API_KEY) return sendResendEmail({ to, subject, text, html });
  return sendSmtpEmail({ to, subject, text, html });
};

const verifyStripeSignature = (rawBody, signatureHeader) => {
  const webhookSecret = required("STRIPE_WEBHOOK_SECRET");
  if (!signatureHeader) throw new Error("Missing Stripe signature.");

  const parts = signatureHeader.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key === "t") acc.timestamp = value;
      if (key === "v1") acc.signatures.push(value);
      return acc;
    },
    { timestamp: "", signatures: [] },
  );

  if (!parts.timestamp || !parts.signatures.length) throw new Error("Invalid Stripe signature header.");

  const signedPayload = `${parts.timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  const isValid = parts.signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "hex");
    return signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  });

  if (!isValid) throw new Error("Invalid Stripe webhook signature.");
};

const signAdminToken = (payload) => {
  const secret = required("ADMIN_SESSION_SECRET");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
};

const verifyAdminToken = (token) => {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", required("ADMIN_SESSION_SECRET")).update(body).digest("base64url");
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!payload.exp || payload.exp < Date.now()) return null;
  if (payload.email !== process.env.ADMIN_EMAIL) return null;
  return payload;
};

const getCookie = (req, name) => {
  const cookie = req.headers.cookie || "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
};

module.exports = {
  productCatalog,
  PROGRAM_LINK,
  PROGRAM_LINKS,
  STRIPE_API_VERSION,
  createStripeCheckoutSession,
  getProgramsFromCheckoutLineItems,
  getOrigin,
  getProgramsByIds,
  hasSupabaseAdmin,
  isCheckoutEnabled,
  listCheckoutSessionLineItems,
  listStripeOrders,
  getStripeDiagnostics,
  logAdminEvent,
  readJsonBody,
  readRawBody,
  sendEmail,
  sendJson,
  signAdminToken,
  supabaseRequest,
  upsertOrders,
  validateProgramAccessLinks,
  verifyAdminToken,
  verifyStripeSignature,
  getCookie,
};
