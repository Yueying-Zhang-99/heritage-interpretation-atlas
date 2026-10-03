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

## Visitation / setting update — 2026-10-03

`node tools/check.cjs` passes with 36 records and 9 auxiliary nodes. Added checks cover fifth-theme membership, old-import setting fallback, malformed/duplicate tags, source-evidence locators, Both matching On-site/Off-site and compound digital/setting filtering. Offline snapshot parity and script syntax pass; `git diff --check` reports no whitespace errors.

Browser verification at http://127.0.0.1:4173:

- Flow renders 36 dots and 5 theme paths. At 1920×1080 and 1366×768, `data-layout-fit=true`, the chart does not require horizontal scrolling, and document height equals viewport height.
- Visitation selection highlights related records; the NPS AR record has visitation, interpretation and digital memberships.
- On-site + AR filtering yields the New Philadelphia case. Its reading card shows On-site evidence, official source link, source-update date distinction and thematic relations.
- Chinese editor exposes five membership choices and setting/source-evidence fields. Saving then reopening the test case retains On-site and source-checked evidence. The temporary test draft was discarded after verification; no GitHub publish action was made.
- Label management exposes the four preset setting labels. Cluster offers Interpretive setting and groups 3 Both, 7 On-site, 26 unspecified records. Library shows and sorts the new column.
- Network loads the new case and its connections. Bands renders all five rows / all 36 records; with the current dense dataset it remains vertically scrollable at 1920×1080. The default Flow mode fits the viewport.
- No browser console errors found.

Final layout restores the continuous outer shell, enclosed internal cavities and equal early decades. Tourism now precedes digital methods in the theme reading order. Verification of the final geometry and published website is recorded below.


## Final Flow layout / release checks — 2026-10-03

- `tools/check.cjs` and `tools/check-flow-shell.cjs` pass: 36 records, 9 auxiliary nodes; tourism-before-digital reading order, continuous shells, protected member dots, enclosed cavities and equal 1930–1990 decades.
- Final Flow renders 36 dots / 5 envelopes at 1920×1080 and 2560×1440 without horizontal or page scrolling. At 1366×768 it preserves page height and uses internal horizontal scrolling to retain readable labels. This supersedes the earlier viewport result for the branching geometry.
- Tourism selection visibly retains a connected outer outline with internal openings; no browser console errors. Asset query versions are bumped to atlas-43 for the changed website scripts/styles.
