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
  await assert.rejects(winterSelection("invalid", () => assert.fail()), /група/);
  await assert.rejects(winterSelection("fixture", async () => ({...price,unit_amount:111})), /does not match/);
  const program = await winterSelection("fixture", async () => price);
  let body;
  t.mock.method(global, "fetch", async (url, opts) => {
    body = opts.body;
    return {ok:true,json:async()=>({id:"cs_fixture"})};
  });
  await createStripeCheckoutSession({programs:[program],customer:{playerAge:"Test group"},origin:"https://example.org"});
  assert.equal(body.get("line_items[0][price]"),"price_fixture");
  assert.equal(body.get("metadata[playerAge]"),"Test group");
  assert.equal(body.get("metadata[winterAgeGroup]"),"fixture");
  assert.equal(body.get("payment_intent_data[metadata][winterAgeGroup]"),"fixture");
  config.salesEnabled=false;
  assert.equal(winterOrder({winterAgeGroup:"fixture",winterPriceMinor:"1234"}).programLink,program.programLink);
});
