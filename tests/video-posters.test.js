const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const htmlFiles = [
  "index.html",
  "individual-training.html",
  "matchday-pack.html",
  "programs.html",
  "summer-program.html",
  "training.html",
  "training/index.html",
  "training/parents/index.html",
  "training/players/index.html",
  "training/plovdiv/index.html",
  "training/sofia/index.html",
  "training/stara-zagora/index.html",
];

test("every published video uses a poster extracted from that same video", () => {
  for (const relativePath of htmlFiles) {
    const html = fs.readFileSync(path.join(root, relativePath), "utf8");
    const videoSources = [...html.matchAll(/(?:src|data-src|data-deferred-video-src)="([^"]+\.mp4)/g)];

    for (const [, source] of videoSources) {
      const videoName = path.basename(source, ".mp4");
      const posterName = `${videoName}-poster.webp`;
      assert.match(html, new RegExp(posterName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${relativePath}: ${videoName} must use its own poster`);
      assert.ok(fs.existsSync(path.join(root, "assets", "videos", posterName)), `${posterName} must exist`);
    }
  }
});
