# Live Training Player Cards Design

## Goal

Replace the existing process-heavy live training cards with three cleaner player testimonial cards that feel personal, premium, and easy to scan.

## Card Structure

Each card uses the same structure:

1. Real player photo.
2. Small `Индивидуални тренировки` badge.
3. Player name.
4. Top info box with only city and age.
5. Bottom testimonial box with a quote label and quote.

The old focus badge, field-work block, and goal block are removed from this section.

## Visual Behavior

- All three cards use equal-height content areas and equal spacing.
- Testimonial boxes use a shared minimum height to keep the row balanced.
- Cards retain the Become Pro dark background, yellow borders, and rounded corners.
- On hover, the card lifts slightly, gains a subtle yellow border glow and shadow, and the photo zooms gently inside its contained frame.
- On mobile, cards stack in one column without horizontal overflow.

## Content

- Славчо Ахмедов: Стара Загора, 6 г., parent quote.
- Албена Георгиева: София, 16 г., player quote.
- Иван Трифонов: Пловдив, 17 г., player quote.

## Assets

The three supplied `.jfif` files are copied to `assets/` with descriptive names:

- `slavcho-ahmedov.jfif`
- `albena-georgieva.jfif`
- `ivan-trifonov.jfif`

