# MVP validation

Checked on 2026-09-25.

## Automated checks

`node tools/check.cjs` passes:

- 16 research entries and 8 auxiliary nodes.
- Unique IDs, required fields, supported node types and valid relation targets.
- Local HTML asset references and JavaScript syntax, including vendored D3.
- JSON / offline snapshot consistency.
- Author search, OR selections within a filter, AND between dimensions, year ranges and zero-result behavior.
- Invalid data rejection and unsafe link rejection.

## Browser checks

Local HTTP preview at `http://127.0.0.1:4173`:

- Knowledge JSON loads with 16 entries.
- Timeline renders all three streams and all 16 nodes; labels checked visually after overlap correction.
- Search for Tilden returns one record; its detail includes metadata, summaries, relations, source and missing-PDF state.
- Cluster renders 16 nodes, switches from Paradigm to Public Role, and responds to Research Lens.
- Network renders 24 nodes; label spacing checked visually; filtering critiques leaves one edge.
- Book + Convention multi-select returns 6 records; Matrix uses the same filtered set.
- Matrix descending Year sort places Uses of Heritage (2006) first in that filtered set.
- A nonexistent search shows the empty state and reset restores results.
- Local JSON file selection reloads the collection without a server upload.
- Selecting a non-JSON file shows an error while preserving the previous 16 records.
- 1366px desktop layout and 390px mobile layout checked; mobile page has no horizontal overflow, while chart and matrix scroll internally. Mobile filter dialog fits the viewport.
- Optional WebMCP search succeeds for Faro and rejects a non-string query.
- No browser console errors observed after these checks.

## Boundaries

- GitHub Pages was enabled on 2026-09-25 from `main` and `/(root)`. Its build completed successfully, and the public URL loaded 16 entries from `knowledge.json`; Timeline and Matrix were checked in the live browser. Relative resource paths and `.nojekyll` are used. Configuration follows [GitHub documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- The browser automation environment blocks `file://` navigation, so double-click/offline mode was not browser-tested. Its snapshot parity and script syntax were checked; the normal HTTP mode and local JSON chooser were browser-tested.
- No PDF files were supplied; the missing-PDF state was tested. Actual PDF opening should be checked after adding a PDF.
- Research text and relationships are explicitly marked as sample coding pending source-level verification.
