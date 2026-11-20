# WT-021 — Current actionable state (overwrite the pointer, preserve the log)

**Read this first on each Codex restart.** Keep ≤45 lines; this is an initial snapshot, not a live status service. Actual head and CI must be fetched.

- **Only authorised destination:** `wt021/integrated-release`, existing open draft [PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102); never open a new PR, merge, deploy or modify `main`.
- **Last confirmed all-three-workflow-green checkpoint:** 8083c547b76b5b1df4b547ffccc3ceb6b5765439. Verify the current SHA separately.
- **Acceptance:** Seven independent family journeys and UX-01 verified at 8083c547b76b5b1df4b547ffccc3ceb6b5765439. Remaining software gates are partial.
- **Authoritative documents:** [completion register](WT021_COMPLETION_REGISTER.md), [approved full WT-021 brief](../prompts/021-complete-seven-builder-manufacturing-parity.md) and [engineering handover](WT021_CODEX_HANDOFF.md).
- **Owner constraints:** owner controls final merge/deploy, not routine commits; GitHub development branch is not review-protected. Real Cura and physical proof are tracked under #10, software parity under #79.

## Next executable step

- **Target:** Owner experiment checkpoint. Complete required CI on the exact draft head before handing it back.
- **Checkpoint:** all seven browser fixtures have local Design-to-download evidence. Crystal supports manual through-holes with edge tabs. Rotary Caps explicitly distinguish moving from stationary. The Features and What’s New catalogue passed local navigation, state, layout and keyboard tests.
- **Next test:** FIT-01 is verified. The next development task after the experiment checkpoint is FIT-02 diagnostic and overlay verification on the remaining browser fixtures. Preserve the six partial acceptance rows.
- **Then:** verify the remaining linked/copy project cases and dimensional and clearance rows, the current GitHub workflows and physical validation boundary under #10.

## Resume instruction

Check branch, working tree, actual remote HEAD and relevant exact-head CI. If this task was completed, move to the next unverified dependency instead of rerunning it. Before interruption **overwrite this pointer** with current tested state/one next command, append a terse `WT021_RUN_LOG.md` checkpoint, and push coherent changes to #102.
