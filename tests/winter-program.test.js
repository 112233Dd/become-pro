const {test} = require("node:test");
const assert = require("node:assert/strict");
const {config, winterOrder, winterSelection} = require("../winter-program/server.cjs");
const {createStripeCheckoutSession} = require("../api/_shared");

test("unconfigured winter offer refuses direct requests before Stripe is called", async () => {
  await assert.rejects(winterSelection("youth", () => assert.fail()), /не са отворени/);
});

test("configured winter checkout preserves the selected group and uses its own verified Stripe price", async t => {
  const initial = {...config};
  const originalEnv = Object.fromEntries(["WINTER_DELIVERY_LINKS","WINTER_STRIPE_PRICE_ID","STRIPE_SECRET_KEY"].map(k => [k,process.env[k]]));
  t.after(() => {
    Object.assign(config, initial);
    for (const [key,value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  Object.assign(config,{salesEnabled:true, delivery:"Test delivery", ageGroups:{fixture:"Test group"},priceMinor:1234});
  process.env.WINTER_DELIVERY_LINKS = JSON.stringify({fixture:"https://drive.google.com/file/d/test/view"});
  process.env.WINTER_STRIPE_PRICE_ID = "price_fixture";
  process.env.STRIPE_SECRET_KEY = "test";
  const price = {active:true, type:"one_time", currency:"eur",unit_amount:1234,product:{active:true,metadata:{programId:config.productId}}};
  const now = Date.parse(config.launchEndsAt) - 3600000;
  await assert.rejects(winterSelection("invalid", () => assert.fail(),1234,now), /група/);
  await assert.rejects(winterSelection("fixture", async () => ({...price,unit_amount:111}),1234,now), /does not match/);
  const program = await winterSelection("fixture", async () => price,1234,now);
  let body;
  t.mock.method(global, "fetch", async (url, opts) => {
    body = opts.body;
    return {ok:true,json:async()=>({id:"cs_fixture"})};
  });
  await createStripeCheckoutSession({programs:[program],customer:{playerAge:"Test group"},origin:"https://example.org"});
  assert.equal(Number(body.get("expires_at")), (Date.parse(config.launchEndsAt)+1000)/1000);
  assert.equal(body.get("line_items[0][price]"),"price_fixture");
  assert.equal(body.get("metadata[playerAge]"),"Test group");
  assert.equal(body.get("metadata[winterAgeGroup]"),"fixture");
  assert.equal(body.get("payment_intent_data[metadata][winterAgeGroup]"),"fixture");
  config.salesEnabled=false;
  assert.equal(winterOrder({winterAgeGroup:"fixture",winterPriceMinor:"1234"}).programLink,program.programLink);
});

test("winter launch ends at Sofia midnight and never falls back to a launch price", async () => {
  const cutoff = Date.parse("2026-12-15T22:00:00Z");
  assert.equal(config.offerAt(cutoff-1).price,4499);
  assert.equal(config.offerAt(cutoff-1).sessionWindow,false);
  assert.equal(config.offerAt(cutoff).launch,false);
  assert.equal(config.offerAt(cutoff).price,null);
  const regular = {...config, regularPriceMinor:5200};
  assert.equal(regular.offerAt(cutoff).price,5200);
});
