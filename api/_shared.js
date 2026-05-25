const crypto = require("crypto");

const PROGRAM_LINK = "https://drive.google.com/file/d/1MvHeNRPxktsNkckeYC9lLXhs84ztUir4/view?usp=sharing";
const ORDER_STATUSES = new Set(["pending", "paid", "failed", "cancelled"]);

const productCatalog = {
  "technical-pack": {
    id: "technical-pack",
    name: "Технически пакет",
    price: 49.99,
    priceCents: 4999,
    image: "/assets/program-cover-technical-pack.png",
    programLink: PROGRAM_LINK,
    description:
      "Пълна техническа система за футболисти, които искат по-добър контрол, по-уверени действия с топката и повече качество в игра.",
  },
  "strength-level-1": {
    id: "strength-level-1",
    name: "Силова програма — Ниво 1",
    price: 49.99,
    priceCents: 4999,
    image: "/assets/program-cover-strength-level-1.png",
    programLink: PROGRAM_LINK,
    description:
      "Начална силова програма за футболисти, които искат стабилна основа, правилна техника и по-добър контрол на тялото.",
  },
  "strength-level-2": {
    id: "strength-level-2",
    name: "Силова програма — Ниво 2",
    price: 49.99,
    priceCents: 4999,
    image: "/assets/program-cover-strength-level-2.png",
    programLink: PROGRAM_LINK,
    description:
      "Следващо ниво за футболисти, които вече имат основа и искат повече сила, експлозивност и устойчивост.",
  },
  "strength-level-3": {
    id: "strength-level-3",
    name: "Силова програма — Ниво 3",
    price: 49.99,
    priceCents: 4999,
    image: "/assets/program-cover-strength-level-3.png",
    programLink: PROGRAM_LINK,
    description:
      "Напреднала програма за футболисти, които искат по-висока физическа готовност, мощност и атлетизъм.",
  },
  "summer-program": {
    id: "summer-program",
    name: "Лятна програма",
    price: 49.99,
    priceCents: 4999,
    image: "/assets/program-cover-summer.png",
    programLink: PROGRAM_LINK,
    description:
      "Структурирана програма за футболисти, които искат да използват лятото правилно и да се върнат по-подготвени.",
  },
  "matchday-pack": {
    id: "matchday-pack",
    name: "Мачов пакет",
    price: 49.99,
    priceCents: 4999,
    image: "/assets/program-cover-matchday.png",
    programLink: PROGRAM_LINK,
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

const createStripeCheckoutSession = async ({ programs, customer, origin }) => {
  const metadata = {
    programId: programs.map((program) => program.id).join(","),
    programName: programs.map((program) => program.name).join(", "),
    customerName: customer.customerName,
    customerEmail: customer.customerEmail,
    customerPhone: customer.customerPhone,
    playerName: customer.playerName || "",
    playerAge: customer.playerAge || "",
  };

  const body = new URLSearchParams();
  body.append("mode", "payment");
  body.append("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  body.append("cancel_url", `${origin}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`);
  body.append("customer_email", customer.customerEmail);
  body.append("payment_method_types[]", "card");

  Object.entries(metadata).forEach(([key, value]) => {
    body.append(`metadata[${key}]`, value);
    body.append(`payment_intent_data[metadata][${key}]`, value);
  });

  programs.forEach((program, index) => {
    body.append(`line_items[${index}][quantity]`, "1");
    body.append(`line_items[${index}][price_data][currency]`, "eur");
    body.append(`line_items[${index}][price_data][unit_amount]`, String(program.priceCents));
    body.append(`line_items[${index}][price_data][product_data][name]`, program.name);
    body.append(`line_items[${index}][price_data][product_data][description]`, program.description);
    body.append(`line_items[${index}][price_data][product_data][images][]`, `${origin}${program.image}`);
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${required("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Stripe Checkout session failed.");
  return payload;
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

const sendEmail = async ({ to, subject, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from || !to) return { skipped: true };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!response.ok) throw new Error(`Email send failed: ${await response.text()}`);
  return response.json();
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
  createStripeCheckoutSession,
  getOrigin,
  getProgramsByIds,
  readJsonBody,
  readRawBody,
  sendEmail,
  sendJson,
  signAdminToken,
  supabaseRequest,
  upsertOrders,
  verifyAdminToken,
  verifyStripeSignature,
  getCookie,
};
