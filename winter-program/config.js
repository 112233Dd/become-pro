// Only enable a level after its price, terms, fulfilment and checkout have been verified.
// priceMinor is the amount in euro cents. Each checkout URL must identify this exact level.
// Purchase completion belongs to the verified payment webhook, never to a browser click.
window.winterProgram = {
  productId: "winter-program-2026-27",
  currency: "EUR",
  levels: {
    "01": { priceMinor: null, terms: "", delivery: "", checkoutUrl: "" },
    "02": { priceMinor: null, terms: "", delivery: "", checkoutUrl: "" },
    "03": { priceMinor: null, terms: "", delivery: "", checkoutUrl: "" },
  },
};
