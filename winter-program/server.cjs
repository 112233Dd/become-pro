const config = require("./config");

function winterOrder(metadata) {
  const url = new URL(process.env.WINTER_PDF_URL);
  if (url.protocol !== "https:" || url.hostname !== "drive.google.com") throw new Error("Missing winter delivery configuration.");
  const cents = Number(metadata.winterPriceMinor);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error("Missing winter order amount.");
  return { id: config.productId, name: config.name, priceCents: cents, price: cents / 100, programLink: url.href };
}

function winterSelection(expectedPrice, now = Date.now()) {
  const offer = config.offerAt(now);
  if (!config.salesEnabled || !config.delivery || !offer.price || !offer.sessionWindow || expectedPrice !== offer.price)
    throw new Error("Продажбите на зимната програма още не са отворени.");
  const program = winterOrder({winterPriceMinor:offer.price});
  return {
    ...program,
    description:"Четириседмична футболна подготовка и включени бонуси.",
    image:"/winter-program/media/campaign.webp",
    winterExpiresAt:offer.launch ? Math.min(Math.floor(now/1000) + 86399, offer.until/1000) : null,
  };
}
module.exports = {config, winterOrder, winterSelection};
