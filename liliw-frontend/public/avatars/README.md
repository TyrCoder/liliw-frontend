# Default avatar sprite sheet

This folder needs one file:

    liliw-avatars.png

It is the sheet of twelve illustrated avatars — **6 columns × 2 rows**, in this
order, left to right and top to bottom:

| # | id | who |
|---|----|-----|
| 1 | `liliw-01` | Visitor in a Liliw shirt |
| 2 | `liliw-02` | Festival dancer |
| 3 | `liliw-03` | Tsinelas maker |
| 4 | `liliw-04` | Photographer |
| 5 | `liliw-05` | Hiker with a backpack |
| 6 | `liliw-06` | Tourism officer |
| 7 | `liliw-07` | Traveller in a sun hat |
| 8 | `liliw-08` | Cafe barista |
| 9 | `liliw-09` | Weaver with a woven sash |
| 10 | `liliw-10` | Festival performer |
| 11 | `liliw-11` | Student with a guidebook |
| 12 | `liliw-12` | Local with a sampaguita flower |

## Requirements

- **Exactly 6 × 2**, evenly spaced. The picker crops by percentage, so an
  uneven grid shifts every avatar after the first.
- Each cell should be **square** and the face roughly centred, since avatars are
  displayed inside a circle and the corners get clipped.
- PNG with a transparent or white background. Aim for **1536 × 512** or larger
  (256px per cell) so it stays sharp on retina screens.
- Keep it under ~400 KB — it loads on any page showing a chosen avatar.

If the order ever changes, update `DEFAULT_AVATARS` in
`src/lib/avatars.ts` to match. The `col` / `row` values there are what map an
id to its cell; the labels are read out by screen readers.

Until this file exists, the twelve options render as empty circles — nothing
breaks, they just have no picture in them.
