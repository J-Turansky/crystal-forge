# WT-021 — Fast start for an uninterrupted Codex session

**Use this as a cheap navigation/index page, not a substitute for the approved [full specification](../021-complete-seven-builder-manufacturing-parity.md).** Scope stays in existing draft PR #102, branch `wt021/integrated-release`; no new PR, main push, merge or deployment.

## Startup, without replaying the entire history

1. `git status --short --branch`, then `npm run wt021:status` (or `npm run wt021:status -- --json`). This read-only helper prints branch, SHA, changed-file count, requirement totals and the one current next action. If git/Node is unavailable, inspect manually.
2. Read the **short [current-state pointer](../../docs/WT021_NOW.md)**, the **latest relevant checkpoint** (not every entry) of [the run log](../../docs/WT021_RUN_LOG.md), and the current PR head / exact-head CI. Follow [AGENTS](../../AGENTS.md) and the [overnight runbook](WT021_OVERNIGHT_RUNBOOK.md).
3. On initial orientation, read the original full WT-021 brief and [engineering handover](../../docs/WT021_CODEX_HANDOFF.md). Subsequently consult the **specific original spec section + acceptance-register row** for the task in hand; don't repeatedly ingest all 31 historical prompts, the full long handover and every old CI log unless the evidence actually requires them.
4. Batch any genuinely mandatory access/credentials questions at the start. Owner PR approval is **not** required to keep implementing or pushing to #102. Do not request routine continuation or merge approval. If a true credential blocker persists, record it and continue safe independent tasks.
5. Take the one actionable next task from `WT021_NOW.md`, write the failing/absent test, implement the actual feature, verify it, checkpoint it, then immediately continue with the next unfinished P0/P1 gate. No task-by-task permission pause.

## Smallest useful validation first

| Area | Targeted local test |
| --- | --- |
| Edited JS / light logic | `node --check PATH` then matching existing unit test |
| Native pixel fitting, preview, transforms, collisions | `node tests/studio-catalogue.test.mjs` and `node tests/studio-pixel-fit-manifold.test.mjs` where relevant |
| Physical sockets, tracks, exported STL/3MF | `node tests/fabrication.test.mjs` |
| Native interactive Build/Print Centre | `node tests/unified-studio-browser.test.mjs` |
| Crystal dimensions and export revision | `node tests/wt021-crystal-dimensions-browser.test.mjs` |
| Complete integration/release checkpoint | `npm run test:static`, `npm test`, `npm run test:browser`, relevant `npm run test:benchmark`; confirm exact-head CI |

Browser tests need a local host (`python3 -m http.server 4321`) and Chromium/Chrome. Use `CRYSTAL_FORGE_BROWSER_EXECUTABLE` if needed; see [testing guide](../../docs/TESTING.md). These targeted tests speed *iteration*; **none replaces the independent browser+manufacturing acceptance for all seven builders**.

## One-pass changelog and morning reporting

- Add one short [CHANGELOG.md](../../CHANGELOG.md) entry for each **actually tested user-visible** milestone within the same source/test/register/log commit. The in-app catalogue UX-01 must keep release/version and What's New aligned; [acceptance brief](../../docs/WT021_FEATURE_CATALOGUE_BRIEF.md).
- Update the concise [morning report](../../docs/WT021_OVERNIGHT_SUMMARY.md) during each substantial checkpoint; before quota cutoff push it and post a **single PR #102 report link/comment**, plus a Codex chat recap when possible.
- Distinct outputs: **changelog = user-visible change; morning report = owner's outcome; NOW = next command; run log = proof**. Keep each short and avoid redundant pushes.

## Preserve tokens and expensive GitHub Actions minutes

- The three CI workflows use **`concurrency.cancel-in-progress: true`** for the same PR. A push can cancel expensive in-flight browser and fabrication jobs. **Make frequent local commits, but batch related tested edits + register/NOW/log into one remote push per coherent milestone.** Push earlier when a real quota/interruption risk demands a recovery point.
- Run the narrowest failing regression first; don't repeatedly run all suites or fetch entire old logs. When ready, check CI with `gh pr checks 102 --repo connorturansky-svg/crystal-forge` (only if authorised `gh` is available). Inspect logs only for actual failed jobs and avoid tight status polling.
- Debug the **first actionable failure**. If a second identical attempt provides no new evidence, record the repro and take the next independent task rather than looping. Never dilute safety/fit/mesh assertions to get a green check.
- Keep [`docs/WT021_NOW.md`](../../docs/WT021_NOW.md) short (≤45 lines) with **one next executable step**, plus a compact entry in [the append-only log](../../docs/WT021_RUN_LOG.md) after a tested milestone or before cutoff. A new Codex session starts from NOW + remote head, not by replaying old chat or all logs.
- A cancelled, skipped or prior-head CI run is **not** exact-head green. Current full CI, actual STL/3MF measurements and all register gates remain mandatory before VERIFIED. Quota/mandatory platform approval limits cannot be bypassed or guaranteed to resume automatically.

**Decision rule:** choose the conservative tested implementation when the approved design supports it; document once and continue. Genuine missing authorisation can be asked upfront, but never interpret waiting for a review/merge as blocking development.
