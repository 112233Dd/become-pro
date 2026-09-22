const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("homepage links to the app with website attribution and an accurate pilot age", () => {
  const html = read("index.html");
  const links = [...html.matchAll(/href="(https:\/\/app\.becomeprofootball\.com\/start[^\"]+)"/g)]
    .map((match) => new URL(match[1].replaceAll("&amp;", "&")));
  assert.ok(links.length >= 2, "navigation and hero should both link to the app");
  for (const link of links) {
    assert.equal(link.pathname, "/start");
    assert.equal(link.searchParams.get("utm_source"), "website");
    assert.equal(link.searchParams.get("utm_medium"), "organic");
    assert.equal(link.searchParams.get("utm_campaign"), "sept_launch");
  }
  assert.match(html, /Пилотна версия за тази възрастова група/);
  assert.match(html, /На 14–17 г\.\?/);
});

test("other pages receive the same app link in shared navigation and footer", () => {
  const script = read("script.js");
  assert.match(script, /nav\.querySelector\('a\[href\*=\"app\.becomeprofootball\.com\/start\"\]'\)/);
  assert.match(script, /<a href="\$\{appLandingUrl\}">Приложение \(14–17 г\.\)<\/a>/);
  assert.match(read("styles.css"), /\.hero-app-link/);
});
