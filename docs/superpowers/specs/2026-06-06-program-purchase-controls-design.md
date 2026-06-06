# Program Purchase Controls Design

## Goal

Every online program must show its price clearly and offer two direct purchase actions:

- `Добави в количка`
- `Купи програмата`

The same purchase language and behavior must be used consistently across the Become Pro program storefront and all product detail pages.

## Programs In Scope

1. Лятна програма
2. Технически пакет
3. Силова програма — Ниво 1
4. Силова програма — Ниво 2
5. Силова програма — Ниво 3
6. Мачов пакет

All programs keep the current temporary live price of `€0.50`.

## Storefront Cards

Each card in `programs.html` must contain:

- program cover;
- program category or badge;
- program name;
- short description;
- visible price `€0.50`;
- `Добави в количка` button;
- `Купи програмата` button.

The cover and program name remain links to the corresponding product detail page. The purchase area contains only the two purchase buttons so the cards stay clean and visually balanced.

### Add To Cart

`Добави в количка` uses the existing cart state:

- adds the selected program once;
- updates the cart counter immediately;
- keeps the program after refresh through the existing local storage implementation;
- does not navigate to the training questionnaire.

### Buy Program

`Купи програмата`:

- starts Stripe Checkout directly for the selected program;
- uses the current product data and price from the shared catalog;
- shows the existing clear checkout error message if Stripe Checkout cannot be started;
- never navigates to the individual training questionnaire.

## Product Detail Pages

Every product detail page must show:

- the program price in the hero purchase area;
- `Добави в количка`;
- `Купи програмата`.

The final CTA at the bottom of each product page uses the same price and button labels. Existing `Купи сега` labels are renamed to `Купи програмата`.

## Related Program Cards

Cards in the `Виж и други програми` section must also show:

- program price;
- `Добави в количка`;
- `Купи програмата`.

The cover and name link to the related program detail page.

## Responsive Layout

- Desktop: price is clearly separated from the two equal-width action buttons.
- Tablet: buttons remain contained inside the card and may stack when space is limited.
- Mobile: price and buttons use the full card width, with no overlap or horizontal overflow.
- Button text must wrap cleanly without changing card width.
- Cards in the same grid row should remain visually aligned.

## Accessibility

- Buttons use native `button` elements.
- Links to product detail pages use descriptive accessible labels.
- Focus states remain visible.
- Disabled/loading checkout states remain understandable.

## Data And Payment Safety

- Product prices continue to come from the shared catalog rather than duplicated HTML values.
- Stripe secret keys remain server-side.
- No card data is stored by the site.
- The individual training form remains separate from online program purchases.

## Verification

1. Confirm all six storefront cards show `€0.50`.
2. Confirm every storefront card has both purchase buttons.
3. Confirm every product hero and final CTA uses `Купи програмата`.
4. Confirm related program cards show price and both purchase buttons.
5. Add each program to the cart and verify the counter and persisted cart state.
6. Start direct checkout from each program.
7. Start checkout from the cart.
8. Verify no online-program purchase action opens the training questionnaire.
9. Check desktop, laptop, tablet, and mobile layouts for overflow and overlap.
10. Run the existing checkout tests and add focused tests for the new labels and visible prices.

## Out Of Scope

- Changing the temporary `€0.50` price.
- Changing Stripe keys or payment mode.
- Modifying individual training CTAs or questionnaire behavior.
- Redesigning program descriptions, covers, or product page content.
