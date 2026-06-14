const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("home hero uses only the requested training video", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const hero = html.match(/<section class="hero section-dark">([\s\S]*?)<\/section>/)?.[1] || "";

  assert.match(hero, /assets\/videos\/hero-hat-swap-game\.mp4/);
  assert.doesNotMatch(hero, /coach-yordan-zhelev\.png/);
  assert.doesNotMatch(hero, /media-badge/);
  assert.ok(fs.existsSync(path.join(root, "assets", "videos", "hero-hat-swap-game.mp4")));
});
