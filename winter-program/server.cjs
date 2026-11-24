const config = require("./config");

function winterOrder(metadata) {
  const links = JSON.parse(process.env.WINTER_DELIVERY_LINKS || "{}");
  const value = links[metadata.winterAgeGroup];
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "drive.google.com") throw new Error("Missing winter delivery configuration.");
  const cents = Number(metadata.winterPriceMinor);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error("Missing winter order amount.");
  return { id: config.productId, name: config.name, priceCents: cents, price: cents / 100, programLink: url.href };
}

async function winterSelection(group, stripeRequest) {
  if (!config.salesEnabled || !config.delivery || !Number.isSafeInteger(config.priceMinor) || config.priceMinor <= 0)
    throw new Error("Продажбите на зимната програма още не са отворени.");
  if (typeof group !== "string" || !Object.hasOwn(config.ageGroups, group)) throw new Error("Избери възрастова група.");
  const program = winterOrder({winterAgeGroup:group, winterPriceMinor:config.priceMinor});
  const priceId = process.env.WINTER_STRIPE_PRICE_ID;
  if (!/^price_[a-zA-Z0-9]+$/.test(priceId || "")) throw new Error("Missing winter Stripe price.");
  const price = await stripeRequest("prices/" + priceId + "?expand[]=product");
  if (!price.active || price.type !== "one_time" || price.currency !== "eur" || price.unit_amount !== config.priceMinor ||
      !price.product?.active || price.product.metadata?.programId !== config.productId) throw new Error("Winter Stripe price does not match the program.");
  return {...program, stripePriceId:priceId, winterAgeGroup:group};
}
module.exports = {config, winterOrder, winterSelection};
