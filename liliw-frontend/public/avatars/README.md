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
- **Centre on the head, not the top of the artwork.** In the source art, row 0
  began around y=134 within its cell and row 1 around y=23, so any fixed crop
  framed the two rows differently. Each cell is measured for its own content
  bounds and the square is centred on the head — about 22.5% of the bust height
  down from the top of the hair — padding with white where the window falls
  outside the cell. Anchoring near the top of the artwork instead pushes the
  hair against the edge, and once the avatar is masked into a circle the top of
  the head is clipped.
- **Do not recentre horizontally.** The characters are drawn centred in their
  cells, and the window is already as wide as a cell, so shifting it sideways
  can only crop one edge and pad the other with white. Centring on the artwork's
  bounding box seems reasonable and is not: that box includes a flower beside
  the hair, a wide hat, a backpack strap, so its centre is not the face's. Take
  the full cell width.
- Detecting the neck from the silhouette was tried and abandoned: these
  shoulders widen gradually, so a width threshold found them anywhere from a
  third to nine tenths of the way down. The proportion is steadier because all
  twelve are drawn to the same scale — measured bust heights fall within
  365–395px of each other.
- **Exactly 6 × 2, evenly spaced, no outer margin.** Positioning is by
  percentage, so padding around the grid pulls the first and last columns
  inward.
- Keep it near or under **400 KB** — it loads wherever an avatar shows. A
  256-colour palette is visually lossless on flat illustration and took this
  sheet from 1.7 MB to 340 KB.

If the order changes, update `DEFAULT_AVATARS` in `src/lib/avatars.ts` to
match. The `col` / `row` values map an id to its cell; the labels are what
screen readers announce.
