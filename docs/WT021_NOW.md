# WT-021 — Current actionable state (overwrite the pointer, preserve the log)

**Read this first on each Codex restart.** Keep ≤45 lines; this is an initial snapshot, not a live status service. Actual head and CI must be fetched.

- **Only authorised destination:** `wt021/integrated-release`, existing open draft [PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102); never open a new PR, merge, deploy or modify `main`.
- **Last confirmed all-three-workflow-green checkpoint:** `38b58e5001023f89689c8dc810aa3fedb8bd5071` (static, Chromium, Manifold). **Historic only**; run `npm run wt021:status` and inspect latest actual head.
- **Acceptance:** 23 original rows PARTIAL, new UX-01 P1 MISSING; 24 tracked total, zero VERIFIED. Crystal underside, Gear top and Tile underside have tested physical positive/negative previews; the remaining families and complete E2E are not accepted.
- **Authoritative documents:** [completion register](WT021_COMPLETION_REGISTER.md), [approved full WT-021 brief](../prompts/021-complete-seven-builder-manufacturing-parity.md) and [engineering handover](WT021_CODEX_HANDOFF.md).
- **Owner constraints:** owner controls final merge/deploy, not routine commits; GitHub development branch is not review-protected. Real Cura and physical proof are tracked under #10, software parity under #79.

## Next executable step

- **Target:** FIT-02 / FIT-03 P0, verify actual side placement and same-face hold-and-drag in Chromium, then extend routing to eligible side and curved faces.
- **Checkpoint:** shared Manifold preview now shows insertion approach, stock and adjacent-cut warnings from fabrication checks and measures wire/positive overlap. Gear/Tile and four additional compact backed-underside Manifold fixtures pass. Chromium proves adjacent Gear socket placement is rejected and the original fitting survives reload. Tile backing now has an editable thickness and reset; the test measures 8 mm in both downloaded formats. Wire overlap alone is informational because contact with the intended relief is normal.
- **Next test:** Gear rejected-drag rollback passed locally. Native preparation now verifies the roof against actual stock and other cuts. Straight native exported route proofs now include flat 3.2 mm clearance, vaulted ceiling and both open exterior apertures. The pinned curved route now has independent 3.2 mm width and >6 mm roof checks in both formats. Native underside preparation now rejects missing side stock and interfering cuts. Both exports retain at least 0.55 mm at sampled straight and curved vaulted sections. A flat top route now prepares on a solid decorative Gear with shaped top sockets. A rectangular top fixture has independent STL/3MF width, depth and open inlet/outlet measurements. The Gear top Chromium journey now passes through reload and STL/3MF downloads. Marker regression now covers actual top and side socket poses. Next add an accepted side placement and hold-and-drag in tests/unified-studio-browser.test.mjs, then use that fixture to prove a side route.
- **Then:** add Wave/Cap/Character/Pod interactive preview and export proof, arbitrary-face drag, side/curved continuous routing and seven independent browser-to-STL/3MF journeys.
- **UX-01:** implement the approved catalogue after P0 work. Keep #10 for Cura and printed proof.

## Resume instruction

Check branch, working tree, actual remote HEAD and relevant exact-head CI. If this task was completed, move to the next unverified dependency instead of rerunning it. Before interruption **overwrite this pointer** with current tested state/one next command, append a terse `WT021_RUN_LOG.md` checkpoint, and push coherent changes to #102.
