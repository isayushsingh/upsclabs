# Carousel images

Drop one image per tool here, named after its `slug` in `lib/tools.ts`
(`.jpg`, portrait-ish, roughly 4:5 — cards are cropped with `object-fit: cover`):

- `ancient-india-timeline.jpg`
- `national-parks.jpg`
- `rivers-of-india.jpg`
- `governors-general.jpg`

`components/site/ToolCarousel.tsx` renders every tool that isn't `"planned"`
automatically, so a new tool just needs a matching filename here — no code
change required. Until a file exists, that card shows a plain gradient
placeholder box (styled in `.ul-carousel-card`) rather than a broken image.
