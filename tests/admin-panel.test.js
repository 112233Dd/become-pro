const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readIfPresent(relativePath) {
  const filePath = path.join(root, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function createRequest(body) {
  const req = Readable.from([JSON.stringify(body)]);
  req.method = "POST";
  req.headers = {};
  return req;
}

function createResponse() {
  const headers = {};

  return {
    headers,
    statusCode: 0,
    body: "",
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    end(body = "") {
      this.body = body;
    },
  };
}

async function withAdminEnv(callback) {
  const names = ["ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));

  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.ADMIN_PASSWORD = "correct-password";
  process.env.ADMIN_SESSION_SECRET = "test-session-secret";

  try {
    await callback();
  } finally {
    names.forEach((name) => {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    });
  }
}

function getRewrites() {
  const vercelConfig = JSON.parse(read("vercel.json"));
  return new Map(vercelConfig.rewrites.map(({ source, destination }) => [source, destination]));
}

test("admin routes expose the dedicated login page", () => {
  const rewrites = getRewrites();

  assert.equal(rewrites.get("/admin/login"), "/admin-login.html");
});

test("admin routes expose the dedicated orders page", () => {
  const rewrites = getRewrites();

  assert.equal(rewrites.get("/admin/orders"), "/admin-orders.html");
});

test("admin login page requests only a password", () => {
  const loginPath = path.join(root, "admin-login.html");
  const loginHtml = readIfPresent("admin-login.html");
  const passwordInputs = loginHtml.match(/<input\b[^>]*\btype\s*=\s*["']password["'][^>]*>/gi) || [];

  assert.ok(fs.existsSync(loginPath), "admin-login.html should exist");
  assert.equal(passwordInputs.length, 1, "admin login should contain exactly one password input");
  assert.match(passwordInputs[0], /\bname\s*=\s*["']password["']/i);
  assert.doesNotMatch(loginHtml, /\btype\s*=\s*["']email["']/i);
  assert.doesNotMatch(loginHtml, /\bname\s*=\s*["']email["']/i);
  assert.doesNotMatch(loginHtml, /\bid\s*=\s*["']email["']/i);
});

test("admin login API accepts the configured password without reading an email from the request", async () => {
  await withAdminEnv(async () => {
    const loginHandler = require(path.join(root, "api/admin/login.js"));
    const successResponse = createResponse();
    await loginHandler(createRequest({ email: "attacker@example.com", password: "correct-password" }), successResponse);

    assert.equal(successResponse.statusCode, 200);
    assert.match(successResponse.headers["set-cookie"], /bp_admin=/);
    assert.match(successResponse.headers["set-cookie"], /HttpOnly/);

    const cookieToken = decodeURIComponent(successResponse.headers["set-cookie"].match(/bp_admin=([^;]+)/)[1]);
    const payload = JSON.parse(Buffer.from(cookieToken.split(".")[0], "base64url").toString("utf8"));

    assert.equal(payload.email, "admin@example.com");

    const failureResponse = createResponse();
    await loginHandler(createRequest({ password: "wrong-password" }), failureResponse);

    assert.equal(failureResponse.statusCode, 401);
  });
});

test("admin orders dashboard exposes search, filters, refresh, and empty state", () => {
  const ordersHtml = read("admin-orders.html");

  assert.match(ordersHtml, /data-admin-search/);
  assert.match(ordersHtml, /data-admin-filter/);
  assert.match(ordersHtml, /data-admin-refresh/);
  assert.match(ordersHtml, /data-admin-empty/);
  assert.match(ordersHtml, /data-admin-error/);
  assert.match(ordersHtml, /data-admin-status-filter\s*=\s*["']all["']/);
  assert.match(ordersHtml, /data-admin-status-filter\s*=\s*["']paid["']/);
  assert.match(ordersHtml, /data-admin-status-filter\s*=\s*["']pending["']/);
  assert.match(ordersHtml, /data-admin-status-filter\s*=\s*["']failed["']/);
  assert.match(ordersHtml, /data-admin-status-filter\s*=\s*["']expired["']/);
  assert.match(ordersHtml, /Stripe Session ID/);
  assert.match(ordersHtml, /Program Link/);
});

test("admin orders client filters by status and search term", () => {
  const ordersScript = read("admin-orders.js");

  assert.match(ordersScript, /selectedStatus/);
  assert.match(ordersScript, /searchTerm/);
  assert.match(ordersScript, /statusFilterButtons/);
  assert.match(ordersScript, /searchInput/);
  assert.match(ordersScript, /refreshButton/);
  assert.match(ordersScript, /escapeHtml/);
  assert.match(ordersScript, /window\.location\.replace\(["']\/admin\/login["']\)/);
});

test("order status model includes expired instead of cancelled for new records", () => {
  const sharedApi = read("api/_shared.js");
  const webhookApi = read("api/stripe/webhook.js");
  const schema = read("supabase/schema.sql");

  assert.match(sharedApi, /"expired"/);
  assert.doesNotMatch(sharedApi, /ORDER_STATUSES\s*=\s*new Set\(\[[^\]]*"cancelled"/);
  assert.match(sharedApi, /session\.status === "expired"\s*\?\s*"expired"/);
  assert.match(webhookApi, /status:\s*"expired"/);
  assert.match(schema, /'expired'/);
});
