# Stamp compositions

The library contains 32 subjects and three compositions per subject (96 total). The original 20 renderers remain composition zero; new scenes combine a subject with named scenery and explicitly grouped moving details. The SVG viewBox stays 180×130, shared by grid and reading stamps.

Optional frontmatter `artwork: v1/cat/1` pins a composition. The writer assigns it before saving a new postcard, using only fictional title/body and the latest 12 entries. Title matches have five times the weight of body matches; recent subject usage breaks ties. Composition choices prefer unseen, then least recently used. Seeds break remaining ties. Unknown or unsupported metadata is rejected. Unannotated legacy entries retain their original selector.

Run `node scripts/migrate-artwork.mjs` to annotate a collection once. It preserves the oldest occurrence of each legacy subject and varies later repetitions; saved assignments are never reassigned. Creation timestamp, date, and ID establish chronological order. Story prose is untouched.

For visual review, run the development server and open `/artwork-preview.html?page=0` through `page=3`. These four sheets cover every composition. This entry is excluded from the production build. New compositions must have named stationary and living-detail groups rather than numbered stroke selectors; original renderers retain their legacy motion.

Motion uses the existing stamp lifecycle: offscreen and hidden-tab pausing, reduced-motion CSS, and shared hover/focus behavior. Palette and postmark placement remain stable per postcard ID. No network image generation is involved.
