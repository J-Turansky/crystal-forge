# WT-021 overnight checkpoint

Draft [PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102) continues from `1518a289f421ee5635c749d4fbb8b46f3c222187`. The commit containing this report records the implementation checkpoint. See the [checks](https://github.com/connorturansky-svg/crystal-forge/pull/102/checks) for its exact head and CI results.

## Implemented

- Native Build fitting inspection shares the production Manifold checks for blocked insertion, insufficient stock and nearby cut interference. It reports measured wire-cut overlap independently, since contact with a wire relief can be intentional.
- Gear-top and Tile-underside fabrication fixtures exercise actual Boolean wire overlap and confirm that an interfering mounting cut is shown in the preview and rejected by preparation.
- Updated the unreleased changelog, in-app release notes and FIT-02 acceptance evidence.

## Evidence and next action

- The targeted catalogue/manufacturing test passed locally. Added Chromium assertions for the new diagnostic readout. Exact-head CI is reported on the PR.
- The register remains at 23 PARTIAL and one MISSING. Remaining limitations include routed stock protection, browser state preservation for rejected edits, side/curved-face fabrication, the remaining builder journeys and UX-01.
- Resume with [the exact FIT-02 task](WT021_NOW.md), then continue through the [acceptance register](WT021_COMPLETION_REGISTER.md). Keep Cura and printed proof in #10.

- First checkpoint e6dc8a8d1ea61aee9b037a6c7e57d87342ac9d8a failed the exact-head release-metadata gate because a draft note was inside the release entry. Moved the note to a labelled unreleased paragraph and verified node tests/release-metadata.mjs against main. Local Chromium also caught the missing readout text; wired the measured overlap and warnings into the DOM and started the browser retry.

### 2026-11-20 - native preview matrix and rejection persistence

- Static GitHub checks passed on 16d53df02659e96dc017af513b34df3c0f544498. All five browser scripts in the local suite passed when run in two batches after the readout fix.
- Additional local Chromium run proved overlapping Gear-top placement is refused and the saved original pose survives reload. Catalogue Manifold suite passed with compact backed-underside fixtures for Wave, Cap, Character and Beacon Pod, checking actual cutter/envelope equivalence and nearby cut rejection.
- These are selected fixture results. The seven full journeys, routed stock checks and UX-01 remain open. Resume at WT021_NOW.md.

### 2026-11-20 - native backing thickness and export parity

- Previous pushed checkpoint d097fad24e68da884a90bad339ff4a165f711373. Released version is unchanged; the unreleased changelog and in-app draft note were updated.
- Added native Build numeric fitting backing thickness (3–10 mm) with reset to 4 mm. Existing shaped fittings and enabled routes trigger off-thread preparation validation before committing a backing edit.
- Unified Chromium passed with an out-of-range edit, a reset, reload persistence and independent 8 mm Z measurements outside the Tile footprint in both downloaded STL and 3MF. Release metadata passed.
- Next work remains routed roof-stock validation outside intended wire junctions and rejected drag state preservation. PAR-01 and DIM-05 remain PARTIAL.

### 2026-11-20 - native route roof integrity

- Base e9c1ea481d7c75bbe990700f63ed1342f76a4ab0. Manifold intersects the real cutter roof guard with model stock, excluding material beyond its intended exterior boundary and the actual cuts at connected pixel ports. It rejects missing roof stock and other cut interference.
- The catalogue Manifold suite passed with new false-stock and roof-cut fixtures. Existing flat, vaulted, curved and pinned native routes remain covered. This does not certify route side walls or off-underside routing.
- Focused real Chromium Gear test passed: two accepted top fittings, then hold-and-drag one onto the other, reload, and compare both stored poses and normals. Full Chromium regression started.

- Independent native route export evidence: tests/studio-catalogue.test.mjs decoded binary STL and indexed 3MF separately, probing five cross sections including both edges. Both files had 3.2 mm usable width, expected lowered vault section at a 0.2 mm lateral offset, open cable direction through both exterior faces and material beside the openings. Test suite passed; no whole-family gate promoted.

- Added the pinned curved witness in both formats. Surface-normal ray sections between the socket junction and exterior edge preserved 3.2 mm clearance within 0.06 mm and more than 6 mm roof stock in every sampled section. Browser regression including rejected Gear drag passed. Minimum side stock and independent curved radius remain open.

### Native underside channel side walls

- Draft head before this checkpoint was `960f9c90e4bbe486929aca11ec7ef825aa72bb10`, with static, Chromium and Manifold checks green. This report is committed alongside the side-wall change.
- Native preparation now checks actual side stock along the channel shoulders and refuses nearby cuts that erode it. The catalogue Manifold suite passed, including false stock and encroaching-cut fixtures. Independent STL and 3MF measurements found at least 0.55 mm of continuous side stock at sampled straight and pinned curved sections.
- These are underside channel fixtures. Next add a planar top route and measure its exported clearances and perimeter openings before extending routing to side and curved placement. The seven complete journeys, UX-01 and owner Cura/printed checks are still open.

### Flat top routes on solid decorative Gears

- This checkpoint follows side-wall commit `efe7b9a291b922700db5e887c172b4c77a332fd6`.
- Build can plan and cut open top-face serial grooves between coplanar shaped seats on eligible Gears. The catalogue Manifold suite passed. The independent rectangular witness showed a 3.2 mm opening, 1.8 mm depth and both open ends in STL and 3MF. Mixed normals and top vaulting are rejected.
- The default local browser port was occupied. On a separate port, the unified Chromium suite passed the new Gear top Build-and-export journey, including reload, an STL print pack containing three serial links and a separate 3MF download.

### Side-face selection markers

- The marker for a shaped socket now uses its actual point and normal. The catalogue suite reproduced the incorrect side marker and passed after the fix. Next exercise side placement and drag in Chromium before generalising route frames.

### Square Tile front-wall serial routing

- Base was `2c68782d187be2725d38488b6fd09707d0129696`. The browser fixture places and drags a shaped socket on the vertical Tile face, reloads the moved pose, places a second socket, enables routing, then prepares and downloads STL and 3MF. The focused Chromium run passed.
- The catalogue Manifold suite verified a 3.2 mm wide and 1.8 mm deep channel with uninterrupted clearance through the front groove and both open ends in each independently decoded file. Preparation refuses a neighbouring cut that removes side stock.
- Next prove curved-face seating and routing, then finish full family journeys and UX-01. Printed and Cura evidence remain with #10.

### Gentle Wave curved sockets and routing

- Base was `c6655a30e33d9a2707e368ce38e32ba14e9f7e36`. The focused Chromium Wave case placed two sockets with distinct normals and downloaded routed STL and 3MF. Full unified Chromium also passed the preceding Tile checkpoint.
- The actual production Wave mesh supports flat, upward-opening grooves on gentle parallel profiles. Both exported formats show 3.2 mm width and 1.8 mm depth at seven sections and an open path between exterior ends. A sampled shaped seat had 9 mm installed-axis depth and 5.3 mm diameter. A convex location with inadequate stock and a cut in a route wall were rejected.
- Next test concurrent routing and noninterfering manual mounts, then advance the full model-family journeys. Broad multi-axis curved routing, final acceptance and physical Cura/print checks remain open.

### Manual mounting alongside serial wiring

- Base was `766daed9c1c2c3ddd07d90545d964ff2ee951eed`. Native routing accepts validated manual through-holes with adequate channel clearance. Focused Chromium passed the separated Gear mount and rejected a move into the channel without editing the saved model.
- Both formats independently measured a 3.4 mm through-hole and 8.7 mm of continuous material between its wall and the routed channel in the controlled Gear specimen. Next complete the Gear journey with fit calibration, Library/Print inspection and measurements of the browser downloads.

### Gear design-to-download acceptance journey

- Base was `6030de31553a49b289514212297f667df32b7e6f`. The focused Gear Chromium case now covers Design editing, two top sockets, accepted and rejected drags, serial channels, two manual holes, two edited external tabs, calibration, Library snapshot and backup, reload and actual prepared cutaway.
- Real downloads included standalone STL and Cura profiles byte-matched to the ZIP, plus 3MF. The independently decoded model files measured the 12.5 mm calibrated bore and 3.2 mm channel, and confirmed through-holes and 4 mm printed material on both tabs.
- Adding external-tab backing now preserves the original Gear top routing footprint. Exact-head CI gates completion. Next preserve eligible Tile front routing with backing, then complete the Tile journey.

### Tile design-to-download acceptance journey

- Base was `0b57821548d17823fccb3e869019faa376198a26`. External-tab backing now preserves a square Tile’s front wall route where the channel clears the backing. The browser rejected a conflicting backing thickness while retaining the model revision.
- Focused Chromium passed the full Tile sequence with two shaped sockets, two manual mounts, two edited external tabs, calibrated fit, Library snapshot and backup, inspection and four Print Centre downloads. Independent STL and 3MF sections measured a 5.5 mm socket, 3.2 mm route, four through-holes and 4 mm tab stock.
- Next complete the gentle Wave browser sequence and its independent export measurements.
