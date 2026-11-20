# WT-021 — Durable Codex run / recovery log

> **Purpose:** Append-only operational checkpoints for uninterrupted overnight sessions and quota-safe restart. The [completion register](WT021_COMPLETION_REGISTER.md) is authoritative for requirement status; this log is chronological evidence, **not** a claim of completion. Follow the [overnight runbook](../prompts/active/WT021_OVERNIGHT_RUNBOOK.md).

## Initial handover checkpoint — 20 November 2026

- **Repository / PR:** `connorturansky-svg/crystal-forge`, existing draft [#102](https://github.com/connorturansky-svg/crystal-forge/pull/102); branch `wt021/integrated-release`.
- **Last checked repository head at runbook creation:** `38b58e5001023f89689c8dc810aa3fedb8bd5071`. Re-check the actual branch tip whenever resuming; this is historical, not a permanent pointer.
- **Checks on that head:** static, Chromium and real Manifold fabrication all reported **success** when checked before authoring this runbook; note that a new runbook commit will have its **own exact-head checks**.
- **Original owner-approved contract:** `prompts/021-complete-seven-builder-manufacturing-parity.md`. **Execution instructions:** `prompts/active/WT021_EXECUTION.md`, `prompts/active/WT021_OVERNIGHT_RUNBOOK.md`.
- **Current acceptance:** 23 rows PARTIAL. Crystal, Gear and Tile have targeted positive/negative fitting-preview evidence, not all seven full end-to-end journeys. All software parity belongs to #79; real Cura/physical validation to #10.
- **Known highest-priority remaining work:** full stock/routed-cut/adjacent-fittings collision in FIT-02; positive+cutter validation in Wave/Cap/Character/Pod; arbitrary-face drag and saved-state rejection; physical side/curved IN→all pixels→OUT channels; independent seven-family acceptance.
- **Access/approval prerequisites:** Codex has **not yet checked** its own overnight environment for GitHub push, CI, Node, Manifold, Chromium or credentials. Perform Stage 0 of the runbook at session start. User has not approved merge/deploy/new PR.
- **Exact next step for Codex:** Confirm branch tip and CI, inspect `docs/WT021_COMPLETION_REGISTER.md`, then extend the FIT-02 collision tester to include already-routed cuts and neighbouring socket negatives, create failing Manifold and Chromium fixtures, and implement the production collision check. If CI is red first, diagnose/fix that before new work.
- **Changes pushed in this checkpoint:** documentation organisation and prompt archiving were committed in PR #102. Do not infer any subsequent Codex implementation from this note.

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
