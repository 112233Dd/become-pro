const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("homepage does not promote the player app", () => {
  const html = read("index.html");

  assert.doesNotMatch(html, /app\.becomeprofootball\.com/);
  assert.doesNotMatch(html, /hero-app-link/);
});

test("shared navigation and footer do not promote the player app", () => {
  const script = read("script.js");
  assert.doesNotMatch(script, /app\.becomeprofootball\.com/);
  assert.doesNotMatch(script, />Приложение(?: \(14–17 г\.\))?<\/a>/);
  assert.doesNotMatch(read("styles.css"), /\.hero-app-link/);
  assert.match(read("styles.css"), /\.hero-media\s*\{\s*min-height: 390px;\s*order: 1;/, "tablet hero copy should precede the large video");
});

test("shared navigation marks clean routes as the current page", () => {
  const script = read("script.js");
  const css = read("styles.css");

  assert.match(script, /normalizeNavigationRoute/);
  assert.match(script, /replace\(\/\\\/index\\\.html\$\/i/);
  assert.match(script, /replace\(\/\\\.html\$\/i/);
  assert.match(script, /normalizedPath === "\/matchday-pack"/);
  assert.match(script, /normalizedPath\.startsWith\("\/programs\/"\)/);
  assert.match(script, /link\.classList\.toggle\("is-active", isCurrentPage\)/);
  assert.match(script, /link\.setAttribute\("aria-current", "page"\)/);
  assert.match(css, /\.site-nav a\.is-active\s*{[\s\S]*?background:/);
});
