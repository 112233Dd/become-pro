const {test} = require("node:test");
const assert = require("node:assert/strict");
const {config, winterOrder, winterSelection} = require("../winter-program/server.cjs");
const {createStripeCheckoutSession} = require("../api/_shared");

test("winter uses a server-priced Stripe item and the approved PDF", async t => {
  const original = process.env.WINTER_PDF_URL;
  const secret = process.env.STRIPE_SECRET_KEY;
  t.after(() => {
    for (const [key,value] of Object.entries({WINTER_PDF_URL:original, STRIPE_SECRET_KEY:secret})) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const now = Date.parse(config.launchEndsAt) - 3600000;
  assert.throws(()=>winterSelection(10,now));
  delete process.env.WINTER_PDF_URL;
  assert.throws(()=>winterSelection(4499,now));
  process.env.WINTER_PDF_URL="https://drive.google.com/file/d/test/view";
  process.env.STRIPE_SECRET_KEY="test";
  const program = winterSelection(4499,now);
  let body;
  t.mock.method(global,"fetch",async (url,opts)=>{
    body=opts.body;
    return {ok:true,json:async()=>({id:"cs_fixture"})};
  });
  await createStripeCheckoutSession({programs:[program],customer:{},origin:"https://example.org"});
  assert.equal(body.get("line_items[0][price_data][unit_amount]"),"4499");
  assert.equal(body.get("line_items[0][price_data][currency]"),"eur");
  assert.equal(body.get("metadata[programId]"),config.productId);
  assert.equal(body.get("metadata[playerAge]"),"");
  assert.equal(body.get("metadata[winterPriceMinor]"),"4499");
  assert.equal(body.get("metadata[winterAgeGroup]"),null);
  assert.equal(body.get("expires_at"),String((Date.parse(config.launchEndsAt)+1000)/1000));
  assert.equal(winterOrder({winterPriceMinor:"4499"}).programLink,process.env.WINTER_PDF_URL);
  assert.equal(body.toString().includes(encodeURIComponent(process.env.WINTER_PDF_URL)),false);
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
