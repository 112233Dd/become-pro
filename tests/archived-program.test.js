const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("summer program remains in the catalog for historical fulfillment but is archived", () => {
  const shop = read("shop.js");
  const shared = read("api/_shared.js");

  assert.match(shop, /id:\s*"summer-program",\s*archived:\s*true/);
  assert.match(shared, /"summer-program":\s*{\s*id:\s*"summer-program",\s*archived:\s*true/);
  assert.match(shared, /programs\.some\(\(program\) => program\.archived === true\)/);
  assert.match(shared, /This program is archived and no longer available for purchase/);
  assert.match(shared, /getProgramsByNames[\s\S]*Object\.values\(productCatalog\)/);
});

test("summer program is absent from active storefront, cart and direct checkout", () => {
  const shop = read("shop.js");

  assert.match(shop, /const activeShopPrograms = shopPrograms\.filter\(isActiveProgram\)/);
  assert.match(shop, /root\.innerHTML = activeShopPrograms\.map/);
  assert.match(shop, /activeShopPrograms\.find\(\(program\) => program\.id === params\.get\("program"\)\)/);
  assert.match(shop, /activeShopPrograms\.some\(\(program\) => program\.id === id\)/);
  assert.match(shop, /Тази програма вече не се предлага/);
});

test("archived summer detail shows an archive notice without purchase controls", () => {
  const shop = read("shop.js");
  const archiveBranch = shop.match(/if \(!isActiveProgram\(program\)\) {[\s\S]*?\n  }/)?.[0] || "";

  assert.match(archiveBranch, /Архивирана програма/);
  assert.match(archiveBranch, /вече не се предлага за нови покупки/);
  assert.match(archiveBranch, /\/programs#programs/);
  assert.doesNotMatch(archiveBranch, /data-shop-buy|data-shop-add|data-shop-checkout/);
});

test("public copy no longer promotes summer preparation as an active offer", () => {
  const programs = read("programs.html");
  const faq = read("faq.html");

  assert.doesNotMatch(programs, /техника, сила, лятна подготовка или мачова готовност/);
  assert.doesNotMatch(programs, /href="programs\/summer-program\/index\.html">Започни с програма/);
  assert.doesNotMatch(faq, /Ниво 3, Лятна програма и Мачов пакет/);
});
