# Purpose section inline images

Two small rounded-pill images sit inline inside the statement text in
`components/site/WhoWeAre.tsx`:

- `chip-1.jpg`
- `chip-2.jpg`

Roughly square/landscape, cropped with `object-fit: cover` at pill height.
Until a file exists at these paths, the chip is simply hidden (text reflows
around the gap) rather than showing a broken-image icon.
