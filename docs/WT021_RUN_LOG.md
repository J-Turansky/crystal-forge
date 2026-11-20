# WT-021 — Durable Codex run / recovery log

> **Purpose:** Append-only operational checkpoints for uninterrupted overnight sessions and quota-safe restart. The [completion register](WT021_COMPLETION_REGISTER.md) is authoritative for requirement status; this log is chronological evidence, **not** a claim of completion. Follow the [overnight runbook](../prompts/active/WT021_OVERNIGHT_RUNBOOK.md).

## Initial handover checkpoint — 20 November 2026

- **Repository / PR:** `connorturansky-svg/crystal-forge`, existing draft [#102](https://github.com/connorturansky-svg/crystal-forge/pull/102); branch `wt021/integrated-release`.
- **Last checked repository head at runbook creation:** `38b58e5001023f89689c8dc810aa3fedb8bd5071`. Re-check the actual branch tip whenever resuming; this is historical, not a permanent pointer.
- **Checks on that head:** static, Chromium and real Manifold fabrication all reported **success** when checked before authoring this runbook; note that a new runbook commit will have its **own exact-head checks**.
- **Original owner-approved contract:** `prompts/021-complete-seven-builder-manufacturing-parity.md`. **Execution instructions:** `prompts/active/WT021_EXECUTION.md`, `prompts/active/WT021_OVERNIGHT_RUNBOOK.md`.
- **Current acceptance:** 23 rows PARTIAL. Crystal, Gear and Tile have targeted positive/negative fitting-preview evidence, not all seven full end-to-end journeys. All software parity belongs to #79; real Cura/physical validation to #10.
- **Known highest-priority remaining work:** full stock/routed-cut/adjacent-fittings collision in FIT-02; positive+cutter validation in Wave/Cap/Character/Pod; arbitrary-face drag and saved-state rejection; physical side/curved IN→all pixels→OUT channels; independent seven-family acceptance.
- **GitHub approval configuration checked on 20 November 2026:** active ruleset `Protect main — reviewed releases` only targets the default branch; required approving reviews = **0**, required code-owner reviews = **false**; `wt021/integrated-release` reports `protected: false`; PR #102 has no requested/submitted reviews; the optional contributor-contract job is skipped for its current title. **PR owner review is not a reason to pause implementation.** Final merge/deploy still requires the owner's explicit decision. Codex must verify its own push credentials independently.
- **Access/approval prerequisites:** Codex has **not yet checked** its own overnight environment for GitHub push, CI, Node, Manifold, Chromium or credentials. Perform Stage 0 of the runbook at session start. User has not approved merge/deploy/new PR.
- **Exact next step for Codex:** Confirm branch tip and CI, inspect `docs/WT021_COMPLETION_REGISTER.md`, then extend the FIT-02 collision tester to include already-routed cuts and neighbouring socket negatives, create failing Manifold and Chromium fixtures, and implement the production collision check. If CI is red first, diagnose/fix that before new work.
- **Changes pushed in this checkpoint:** documentation organisation and prompt archiving were committed in PR #102. Do not infer any subsequent Codex implementation from this note.

## Additional owner instructions — 20 November 2026 (planning, not implementation)

- Owner added **UX-01 P1**: implement an illustrated, categorised, searchable, accessible, click-through Features & What's New page inside the existing web-app popup. 23 original requirements remain; new UX-01 is **MISSING**, 24 tracked items total. Full original physical parity specification is unchanged.
- **CHANGELOG.md** must receive a concise *Unreleased* user-facing entry after each independently tested feature, in the same coherent commit as implementation/test evidence. Sync What's New and app version history through UX-01; never present draft PR changes as deployed.
- Maintain the concise owner report at `docs/WT021_OVERNIGHT_SUMMARY.md` **during milestones** and before quota cutoff, with exact SHA, evidence, remaining work and next action. A PR #102 comment and Codex chat recap are requested at normal end; this run log remains the detailed technical history.

## Checkpoint template — append for every coherent work increment

### YYYY-MM-DD HH:MM (local/UTC) — [WT-021 row and precise outcome]

- **Branch / latest pushed head:** `...`; **previous last-green SHA:** `...`
- **Changed files / actual behaviour:** ...
- **Commands and tests run:** ...; **exact-head workflows / URLs:** ...
- **Objective measurement and acceptance:** ... (STL/3MF/mm, Chromium action, invalid case)
- **Register rows updated:** ... (PARTIAL / VERIFIED with reason)
- **Unresolved failures / blockers:** ... (minimal reproduction and logs)
- **Git status / push status:** ... (clean or name of uncommitted files)
- **Next exact task, file and command:** ...
- **Can the next session resume without owner input?** yes/no; if no, state required permission precisely.

**Do not overwrite prior checkpoint history.** Append a new entry and keep the most recent actionable one at the bottom.

### 2026-11-20 - FIT-02 native fabrication diagnostics

- Base: 1518a289f421ee5635c749d4fbb8b46f3c222187 on draft #102.
- Native preview and preparation share insertion opening, stock and adjacent-cut checks. Preview reports measured wire cut overlap separately.
- The Gear/Tile test injects physical wire and mounting cuts; both preview warning and manufacturing rejection are exercised for the mounting conflict.
- FIT-02 remains PARTIAL. Next action is the invalid-pose Chromium case and actual routed wall verification in NOW.

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

### 2026-11-20 - native route side-wall stock

- Base `960f9c90e4bbe486929aca11ec7ef825aa72bb10`; all three required GitHub workflows passed at that base.
- Production Manifold checks a 0.55 mm side envelope against real stock and neighbouring cuts. A side-cut regression failed before the implementation. The catalogue suite then passed with that case, thin actual stock, and independently decoded STL/3MF straight and curved side-wall probes. FIT-02 and FIT-03 remain PARTIAL.
- Next: create a physically cut planar top fixture in tests/studio-catalogue.test.mjs and measure the route and outlets in both exports.

### 2026-11-20 - flat top serial routes

- Base `efe7b9a291b922700db5e887c172b4c77a332fd6`. Shaped coplanar top seats on eligible solid decorative Gears now have a checked physical upward-opening channel. The route follows the installed fitting rotation and protects the channel floor and side stock.
- Added a failing top route fixture, then passed the catalogue Manifold suite with a solid Gear and a rectangular STL/3MF witness measuring width, depth, side stock and both open ends. Tilted/mixed faces and top vaulting are rejected. FIT-03 remains PARTIAL. Chromium local server was unreachable; exact-head Actions will cover the existing browser suite.
- Next extend tests/unified-studio-browser.test.mjs with the Gear top route, saved state and actual downloads.

### 2026-11-20 - Gear top Chromium and side markers

- Base `439fc789bd8a5c903c89271caf464795248fe50c`. The unified Chromium suite passed with Gear top placement, rejected drag rollback, physical routing after reload and real STL/3MF downloads. An isolated server port resolved the local test connection failure.
- Added a failing side marker fixture, then fixed the marker position and normal to match the production seat. Catalogue Manifold/export regression passed. FIT-01/FIT-03 remain PARTIAL. Next add an accepted side placement and same-face drag using real viewport input.

### 2026-11-20 - square Tile front-wall routes and browser drag

- Base `2c68782d187be2725d38488b6fd09707d0129696`. An initially failing front-route fixture now passes on the actual square Tile mesh. Guides and cutters share front-face coordinates. Manifold rejects inadequate surrounding stock and an adjacent side-wall cut.
- Independently measured exported channel: 3.2 mm usable width, 1.8 mm depth and open passage through both apertures in STL and 3MF. Focused Chromium passed real side placement, held drag, reload, routing, preparation and downloads. FIT-01/FIT-03 remain PARTIAL.
- Next place a short fitting on a genuinely curved Wave face and measure the accepted seat in both formats.

### 2026-11-20 - gentle parallel Wave routes

- Base `c6655a30e33d9a2707e368ce38e32ba14e9f7e36`. Added a failing curved Wave route case, then a groove swept along the same sampled Wave mesh used for manufacturing. Real Manifold tests reject an unsupported convex seat, route wall interference and vaulting on the upward-facing groove.
- Both formats independently prove a 9 mm long, 5.3 mm sized tilted seat and continuous 3.2 × 1.8 mm surface-following wiring across the Wave. Focused Chromium passed real curved placement, rotation, routing, preparation and downloads. FIT-01/FIT-03 remain PARTIAL.
- Next combine validated manual mounts with routed placement, covering real conflicts and state rollback.

### 2026-11-20 - manual mounts with native routes

- Base `766daed9c1c2c3ddd07d90545d964ff2ee951eed`. The initially rejected separated through-hole now routes, prepares and exports alongside serial grooves. Both parsed formats measure 3.4 mm through and 8.7 mm material web.
- Focused Chromium passed safe Gear mounting and refused an edit into the path before changing the saved revision. DIM-05 and PAR-01 remain PARTIAL. Next finish Gear calibration/inspection and independent browser-download measurements.
