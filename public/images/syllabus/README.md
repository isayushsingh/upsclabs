# Syllabus card images

Drop one image per paper here (`.jpg`, portrait-ish, cropped with
`object-fit: cover`):

- `gs1.jpg`
- `gs2.jpg`
- `gs3.jpg`
- `gs4.jpg`

`components/site/CoverageGrid.tsx` looks up `/images/syllabus/<id>.jpg`
(lowercased paper id) automatically — no code change needed once a file
exists. Until then, that card shows a plain gradient placeholder box.
