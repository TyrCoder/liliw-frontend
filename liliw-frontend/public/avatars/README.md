# Default avatar sprite sheet

`liliw-avatars.png` — the sheet of twelve illustrated avatars, **6 columns ×
2 rows of square 256×256 cells** (1536×512 overall), in this order, left to
right and top to bottom:

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

## If you ever redraw these

- **Cells must be square.** `spriteStyle()` in `src/lib/avatars.ts` scales the
  sheet to 600% × 200% of a square container, which only lines up when a cell
  is as wide as it is tall. The original artwork was 256×512 per cell and had
  to be re-cropped; a 1:2 cell dropped straight into a circular avatar squashes
  every face.
- **Frame the rows the same.** In the source art, row 0's artwork began around
  y=134 within its cell and row 1's around y=23, so a fixed crop caught one row
  at the forehead and the other at the chin. Each cell was measured and cropped
  around its own head and shoulders instead.
- **Exactly 6 × 2, evenly spaced, no outer margin.** Positioning is by
  percentage, so padding around the grid pulls the first and last columns
  inward.
- Keep it near or under **400 KB** — it loads wherever an avatar shows. A
  256-colour palette is visually lossless on flat illustration and took this
  sheet from 1.7 MB to 340 KB.

If the order changes, update `DEFAULT_AVATARS` in `src/lib/avatars.ts` to
match. The `col` / `row` values map an id to its cell; the labels are what
screen readers announce.
