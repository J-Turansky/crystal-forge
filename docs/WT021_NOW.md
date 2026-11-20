# WT-021 — Current actionable state (overwrite the pointer, preserve the log)

**Read this first on each Codex restart.** Keep ≤45 lines; this is an initial snapshot, not a live status service. Actual head and CI must be fetched.

- **Only authorised destination:** `wt021/integrated-release`, existing open draft [PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102); never open a new PR, merge, deploy or modify `main`.
- **Last confirmed all-three-workflow-green checkpoint:** `c2cf3d0fe39c495edc287611c16f742b1cac85db` (static 44661415796, Chromium 44661415832, Manifold 44661415876). Verify the current SHA separately.
- **Acceptance:** E2E-G/T/W VERIFIED at that exact SHA. E2E-C/K/H/P and UX-01 have local acceptance evidence, with exact-head checks pending. The remaining WT-021 software rows are partial.
- **Authoritative documents:** [completion register](WT021_COMPLETION_REGISTER.md), [approved full WT-021 brief](../prompts/021-complete-seven-builder-manufacturing-parity.md) and [engineering handover](WT021_CODEX_HANDOFF.md).
- **Owner constraints:** owner controls final merge/deploy, not routine commits; GitHub development branch is not review-protected. Real Cura and physical proof are tracked under #10, software parity under #79.

## Next executable step

- **Target:** DIM-03 and CAL-01, independently measure flange, bore, roof and retention when individual calibration values change.
- **Checkpoint:** all seven browser fixtures have local Design-to-download evidence. Crystal supports manual through-holes with edge tabs. Rotary Caps explicitly distinguish moving from stationary. The Features and What’s New catalogue passed local navigation, state, layout and keyboard tests.
- **Next test:** in tests/studio-catalogue.test.mjs add an actual 9 mm high flanged fitting with separate baseline, calibrated bore, retention and wire-width cases. Decode STL and 3MF and measure the flange, straight bore, retention throat, roof and wire path independently.
- **Then:** verify linked/copy profile export behaviour, the remaining dimensional and clearance rows, the current GitHub workflows and physical validation boundary under #10.

## Resume instruction

Check branch, working tree, actual remote HEAD and relevant exact-head CI. If this task was completed, move to the next unverified dependency instead of rerunning it. Before interruption **overwrite this pointer** with current tested state/one next command, append a terse `WT021_RUN_LOG.md` checkpoint, and push coherent changes to #102.
