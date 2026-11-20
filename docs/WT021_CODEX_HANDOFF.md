# WT-021 — Codex return handover

**Prepared:** 20 November 2026  
**Repository:** `connorturansky-svg/crystal-forge`  
**Only working branch / PR:** `wt021/integrated-release`, existing **draft [PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102)**  
**Last code checkpoint with all three exact-head CI suites confirmed green:** `b132359a67090e3620e33ea51964ec624b644c83` (static + Chromium + Manifold).  
**Subsequent test-only change:** `042ef97b412b8f63a261867113584b6296e1c304` adds Gear/Tile preview no-mutation browser assertions. **Check exact-head CI for the current branch before claiming this additional test passed.**

## Fast continuation

Read [current next task](WT021_NOW.md) and [fast start / test map](../prompts/active/WT021_FAST_START.md), then run `npm run wt021:status` to avoid replaying old prompts and checks. The original full approved brief remains binding.

## Overnight / limited-token execution protocol

Read [`prompts/active/WT021_OVERNIGHT_RUNBOOK.md`](../prompts/active/WT021_OVERNIGHT_RUNBOOK.md) **before** implementation and [`docs/WT021_RUN_LOG.md`](WT021_RUN_LOG.md) before resuming an interrupted session. Batch unavoidable permission/access questions at the start, continue the approved software queue without routine check-ins, commit/push and append exact-head evidence after each tested milestone, and preserve the next executable task for quota-based restart. This does not bypass a required platform approval or guarantee automatic resume.

## Owner's non-negotiable boundaries

- **Do not merge, deploy, open another PR, change draft state or silently change `main`.** Pushing to `main` invokes the GitHub Pages deployment workflow.
- Preserve previously merged work and the other issue scopes: software parity **#79**, owner Cura/real print evidence **#10**, unrelated **#90** separately. Do not use an Issue/PR explosion to substitute for integration.
- Deliver a genuinely editable **seven-family** integrated WT-021 release candidate, not only Crystal fixtures, and do not promote a requirement to VERIFIED because the existing CI is green.
- Preserve physical measurements for the owner's real A–G pixel profiles; do not change sizes to disguise fit failures. The owner's historical original STL/Cura discrepancy remains unconfirmed without the original files.

## What has been delivered and checked

| Area | Tested scope | Important limitation |
| --- | --- | --- |
| AUD-01 test integrity | Sampled exported Crystal cable roofs now require actual **finite** inside-stock intersections, rather than treating missing hits as infinite clearance. Intentional IN/OUT perimeter openings are exempt only at the actual boundary. | Independent bend radius, entire aperture boundary, and all non-Crystal families remain open. |
| AUD-02 calibration | Native track width and Crystal relief/coupon wire width use the physical wire relief F or explicitly requested track width, **not the socket bore clearance**. Native and STL coupon regressions pass. | No full cross-family saved-profile/calibration acceptance; retention remains open. |
| FIT-02 native positive + cutter | Crystal underside preview, **Gear top with 22 mm gumdrop**, and **Tile underside with a shorter fitting** covered. Native preview and preparation share `putSocket` and `placeNativeSocketSolid`. Browser toggles, Manifold cutter/positive full-envelope and cut-volume parity pass at b132359. | Remaining native builders lack acceptance tests. Native collision report compares original stock only, **not routed cut volumes or neighbouring cutters**. Displayed roof is *nominal allowance*, not a measured local stock wall. |
| FIT-02 actual physical fit defect | The new Gear fixture found **0.62463 mm³ of positive pixel outside the negative cutter**. `fabrication-v1.js` now uses a single continuous profile-revolved Manifold socket cutter, preserving conical/rounded options, flange, bore and retention geometry. | Digital clearance is not proof of printed fit, print support-freeness, or usable insertion on arbitrary surfaces. |
| Export integrity | Repaired Crystal degeneracy failures. Preparation checks STL-precision triangles, attempts bounded Manifold/zero-area cleanup and must reconstruct a valid closed, volume-stable solid or refuse the job. Existing Manifold and Chromium Print Centre exports pass at b132359. | Do not replace fail-closed behavior with `Infinity` clearance, silently omit triangles, or change nominal dimensions. |
| No-mutation browser regression | Added Gear and Tile toggles verifying the model JSON remains identical before/after physical preview, at 042ef97. | Await exact-head CI. Does not replace invalid drag/saved reload/undo tests. |

All **23 completion-register items remain PARTIAL**; none has been independently accepted through every gate. This is not a statement that the implementation is empty; it distinguishes *substantial tested partials* from an integrated, independently verified release.

## Priority implementation sequence for Codex

1. **Read/check before coding.** Re-read [completion register](WT021_COMPLETION_REGISTER.md), [independent source audit](WT021_INDEPENDENT_AUDIT.md), latest #102 conversation comments and the actual current branch head. Confirm exact-head static/Chromium/fabrication results. If CI is red, fix the concrete regression without weakening measured geometry assertions.
2. **Finish the authoritative shared positive/negative preview.** Extend actual Build viewport and exported-cutter parity testing from Gear/Tile to **Wave, Control Cap, Character, Pebble/Pod**, while preserving Crystal. Show real installation normal, insertion, flange, body/dome protrusion and **measured** local wall/breakthrough. Collision computations must include **the full prepared stock with pre-existing cavities, routed cuts, other sockets, mounts and tabs**, not just base stock. Invalid moves must visibly fail and preserve the last valid state.
3. **True arbitrary-face placement & dragging.** Complete click-to-select, click-hold drag, face-pick with true outward surface normal / inward insertion transform, rotation, rejection on thin/obstructed stock, saved revision, undo/reload. Demonstrate both top, underside and an eligible side/curved location against the actual manufactured cutter pose, including one intentionally invalid move.
4. **Actually physical IN → pixels → OUT wiring.** Remove the current off-underside refusal in `studio-native-routing.js` **only with a real printable Boolean route**, preserving opposed straight 180° pixel IN/OUT ports, smooth bend in the physical recessed track, 25/50/100/custom available cable lengths and explicit red/error over-length feedback. Independently measure **5.8 × 1.95 mm usable clearance**, true minimum bend radius, aperture openings, junctions and roof in STL **and** 3MF, using print-Z-aware overhang geometry; reject collisions/insufficient stock without state corruption.
5. **Close dimensional, calibration and mounting gates.** Independently inspect requested/profile/compensation/applied/exported measurements; compare exact STL and transform-aware 3MF bounds, insertion depth, retention, flange, fastener/tab walls and prepared revision. Include additional wall/breakthrough tests and a production coupon with the *same* vaulted wire-roof cross-section. Preserve real Cura/printed proof as **#10**, separate from software acceptance.
6. **Seven independent browser/manufacturing E2E journeys.** For Crystal, Tile, Gear, Wave, Cap, Character and Pod, individually run **Design → profile → place → drag → route → mount → calibrate → save/reload → prepare → inspect → STL+3MF → independent dimensions**, plus invalid state and no-mutation rejection. A shared unit test does not replace one complete journey per family.
7. **Update register after each coherent milestone**, include exact SHA, CI results, screenshots/logs and numerical measurements; only mark **VERIFIED** when that row's entire acceptance is satisfied. Leave PR #102 draft for owner review and do **not** merge/deploy.

## Useful source/test pointers

- `studio-geometry.js`: `placeNativeSocketSolid`, `nativeFittingPreviews`, `prepareRecipe` share the same actual Manifold pose and cutter.
- `sensory-studio.js`: native Build preview toggle, overlay status/report and browser UI.
- `fabrication-v1.js`: `putSocket`, unified profile cutter; manufacture, precision guard and full-shape coupon.
- `studio-native-routing.js`: native route planner and explicit non-underside limitation.
- `studio-pixel-builder.js`, `studio-catalogue.js`: surface-pick/fitting placement, validation and build recipe.
- `tests/studio-catalogue.test.mjs`: Gear/Tile positive containment and actual cutter parity, independent routed width and 3D source tests.
- `tests/unified-studio-browser.test.mjs`: Gear/Tile interactions, Print Centre downloads, preview no-mutation.
- `tests/fabrication.test.mjs`: independent Crystal STL/3MF sampled cavity dimensions, precision regression and coupons.
- `tests/wt021-crystal-dimensions-browser.test.mjs`: independent downloaded Crystal bounds.
- `docs/WT021_COMPLETION_REGISTER.md`: **authoritative** 23 acceptance requirements; no VERIFIED rows currently.

## Copyable first Codex instruction

> Resume WT-021 **only** inside existing draft PR #102, `wt021/integrated-release`. Do not create another PR, merge, deploy or change `main`. Read `docs/WT021_CODEX_HANDOFF.md`, `docs/WT021_COMPLETION_REGISTER.md`, `docs/WT021_INDEPENDENT_AUDIT.md` and latest PR checks/comments. Begin by checking the exact branch head, static/Chromium/fabrication CI and the Gear/Tile preview no-mutation regression. Fix any failing exact-head test without weakening physical fit/closure/volume checks. Then continue the ranked items above, starting with full routed/adjacent interference and the four remaining native family previews, followed by arbitrary-face placement and real side/curved physical wiring. Implement, test, commit into #102 and update the acceptance register across the session. **Leave all integration, merge and deployment decisions with the owner.**
