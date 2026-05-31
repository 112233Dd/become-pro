# Online Player Cards Layout Design

## Goal

Simplify the three cards in the "Играчите, които тренират онлайн с Become Pro" section so that each card presents verified player information with the same premium layout and spacing.

## Scope

Only the online player cards in `players.html` are changed. The live training cards, page headings, navigation, images, and CTA remain unchanged.

## Card Structure

Each online player card keeps the existing player image and player name. Below the name, the card contains exactly two information boxes:

1. A profile box with three rows:
   - `Играе за`
   - `Години`
   - `Позиция`
2. An achievements box:
   - heading `Отличия`
   - a short unordered list of achievements

The current middle box (`Използва Become Pro за`) and focus pill are removed from all three online cards. The standalone position text under the player name is also removed because the position appears in the profile box.

## Player Data

### Мирослав Маринов

- Играе за: Фратрия
- Години: 21
- Позиция: Нападател / Крило
- Отличия:
  - 100+ мача в професионалния футбол
  - Национал на България U21
  - 3-ти голмайстор във Втора лига - 14 гола (сезон 2025/2026)

### Ирен Георгиева

- Играе за: Brook House
- Години: 15
- Позиция: Дефанзивен халф
- Отличия:
  - Националка на България U15

### Панайот Пасков

- Играе за: Локомотив Горна Оряховица
- Години: 19
- Позиция: Дефанзивен / Офанзивен халф
- Отличия:
  - 80+ мача в професионалния футбол
  - Национал на България U19

## Layout And Responsive Behavior

- All three cards use a grid-based content area with matching gaps.
- Cards stretch to the same height on desktop.
- The achievements box grows to fill the remaining content height so cards stay visually aligned even when achievement counts differ.
- The profile box uses stacked rows to remain readable for the longer club and position values.
- At tablet and mobile widths, the existing responsive grid continues to stack cards without horizontal overflow.

## Visual Style

- Preserve the dark Become Pro card background, yellow accents, rounded corners, and premium spacing.
- Reuse the existing detail box visual language.
- Add a dedicated achievements class so the lower box remains visually consistent and easy to scan.

## Verification

- Confirm all three online cards show the requested data and no placeholder copy.
- Confirm the removed middle box and focus pill no longer appear in online cards.
- Confirm the live training cards are unchanged.
- Check desktop and mobile layouts for equal spacing, contained text, and no horizontal overflow.
