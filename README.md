# this-is-the-one

A fully static etymology explorer built with vanilla HTML/CSS/JavaScript.

## Features

- Instant case-insensitive search across words, meanings, PIE roots, cognates, and etymology chains.
- Word detail panel with meaning, part of speech, IPA, etymology chain, and cognates.
- Related words grouped by shared PIE root.
- Random word selection from current filtered results.
- Mobile-friendly two-panel layout that collapses to a single column on small screens.
- Accessibility basics: labeled search input, keyboard navigation in results (ArrowUp/ArrowDown/Home/End), visible focus rings, and a skip link.

## Data file

Lexicon data lives at:

- `data/lexicon.json`

Each entry is an object with this schema:

```json
{
  "id": "unique-string-id",
  "word": "headword",
  "meaning": "short definition",
  "pos": "optional part of speech",
  "ipa": "optional IPA string",
  "pieRoot": "optional PIE root string",
  "etymologyChain": ["ordered", "list", "from older to newer"],
  "cognates": ["optional", "related words"]
}
```

## How to add entries

1. Open `data/lexicon.json`.
2. Add a new object to the array using a unique `id`.
3. Provide at least `id`, `word`, `meaning`, and `etymologyChain`.
4. Optionally add `pos`, `ipa`, `pieRoot`, and `cognates`.
5. Keep valid JSON syntax (commas between objects, double-quoted keys/strings).
6. Commit and push — no build step is required.

## Deployment

GitHub Pages deploys from the repository root through `.github/workflows/blank.yml`.

- No npm install.
- No bundling/transpile step.
- All assets use relative URLs and run directly in-browser.
