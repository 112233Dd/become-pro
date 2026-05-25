const { sendJson } = require("../_shared");

module.exports = async (_req, res) => {
  res.setHeader("Set-Cookie", "bp_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return sendJson(res, 200, { ok: true });
};
