# WT-021 — Current actionable state (overwrite the pointer, preserve the log)

**Read this first on each Codex restart.** Keep ≤45 lines; this is an initial snapshot, not a live status service. Actual head and CI must be fetched.

- **Only authorised destination:** `wt021/integrated-release`, existing open draft [PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102); never open a new PR, merge, deploy or modify `main`.
- **Last confirmed all-three-workflow-green checkpoint:** `38b58e5001023f89689c8dc810aa3fedb8bd5071` (static, Chromium, Manifold). **Historic only**; run `npm run wt021:status` and inspect latest actual head.
- **Acceptance:** 23 original rows PARTIAL, new UX-01 P1 MISSING; 24 tracked total, zero VERIFIED. Crystal underside, Gear top and Tile underside have tested physical positive/negative previews; the remaining families and complete E2E are not accepted.
- **Authoritative documents:** [completion register](WT021_COMPLETION_REGISTER.md), [approved full WT-021 brief](../prompts/021-complete-seven-builder-manufacturing-parity.md) and [engineering handover](WT021_CODEX_HANDOFF.md).
- **Owner constraints:** owner controls final merge/deploy, not routine commits; GitHub development branch is not review-protected. Real Cura and physical proof are tracked under #10, software parity under #79.

## Next executable step

- **Target:** complete the independent Wave journey, including curved routing, real attached tabs and mechanical mounting.
- **Checkpoint:** the Gear top and square Tile front-wall journeys passed local Chromium through calibrated fit, visible cutaway, Library backup and measured STL/3MF/Cura/ZIP downloads. Exact-head acceptance remains pending.
- **Next test:** extend the existing gentle Wave browser case in tests/unified-studio-browser.test.mjs to use the actual Design width control, accepted curved-seat drag, two mounts and tabs, calibration, Library snapshot/backup, reload, prepared cutaway and independent measurements. Preserve the original route perimeter with backing.
- **Then:** finish the Crystal, compulsory rotary Cap, Character and Pod journeys. Continue general side/curved routing, mounting and dimensional acceptance under #79.
- **UX-01:** implement the approved catalogue after P0 work. Keep #10 for Cura and printed proof.

## Resume instruction

Check branch, working tree, actual remote HEAD and relevant exact-head CI. If this task was completed, move to the next unverified dependency instead of rerunning it. Before interruption **overwrite this pointer** with current tested state/one next command, append a terse `WT021_RUN_LOG.md` checkpoint, and push coherent changes to #102.
