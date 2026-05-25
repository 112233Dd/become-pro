const { readJsonBody, sendJson, signAdminToken } = require("../_shared");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
      return sendJson(res, 500, { error: "Admin login is not configured." });
    }

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return sendJson(res, 401, { error: "Invalid admin credentials." });
    }

    const token = signAdminToken({ email, exp: Date.now() + 1000 * 60 * 60 * 8 });
    const secureCookie = req.headers["x-forwarded-proto"] === "https" || process.env.VERCEL ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      `bp_admin=${encodeURIComponent(token)}; Path=/; HttpOnly${secureCookie}; SameSite=Lax; Max-Age=${60 * 60 * 8}`,
    );
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "Admin login failed." });
  }
};
