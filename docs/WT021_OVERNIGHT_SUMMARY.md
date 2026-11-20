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
- Local Chromium could launch but timed out connecting to the local server. The draft PR runs browser tests. Continue with a Gear top Build-and-export browser case, then generalise route frames to eligible side and curved installations.
