# WT-021 — Overnight autonomous execution protocol

**For:** Codex continuing [draft PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102) on `wt021/integrated-release`.  
**Owner instruction:** Run through all uncompleted WT-021 software work continuously within the available Codex session, without stopping after each subtask or asking routine questions. If limits cut off the session, preserve an immediately resumable state.  
**Priority:** This runbook governs the execution style; the complete [approved WT-021 specification](../021-complete-seven-builder-manufacturing-parity.md), [acceptance register](../../docs/WT021_COMPLETION_REGISTER.md), [engineering handover](../../docs/WT021_CODEX_HANDOFF.md) and hard safety/authorisation limits remain authoritative.

## Stage 0 — Front-load permissions, access and uncertainty BEFORE starting intensive work

1. Check this repository, **PR #102 branch write access**, GitHub credentials/remote, and the ability to push to the *existing* branch. Confirm permissions are available for source edits, tests, commits and GitHub Actions logs. Check Node/npm, WebAssembly Manifold, Chromium/Playwright, test fixtures and necessary downloads are functional.
2. Read the original WT-021 prompt and every currently incomplete register row. Inspect latest PR head, open comments, issue #79 software and #10 owner physical validation. Identify anything that genuinely **requires** the owner (credentials, account/organisation settings, access changes, irreversible action, design decision incompatible with accepted contracts). Batch those requests in **one concise upfront message** with the exact action needed and a suggested safe default when possible. Do this BEFORE starting long implementation.
3. Do not invent account permissions, override mandatory confirmation, use credentials you do not have, or interpret "unattended" as blanket approval for high-risk/destructive actions. An assistant's preference to ask is **not** a blocker: make conservative documented engineering choices whenever the brief and tests support them.
4. If a permission is a **hard** platform/OS limit and the user cannot grant it immediately, do **not** repeatedly ask: clearly record the blocker and move to the highest-priority **independent** work still possible. If every valuable task is blocked, create a complete checkpoint and stop cleanly.
5. The owner has **not** authorised: merge, deploy, creating another PR, changing `main`, changing branch protection/visibility, deleting or rewriting history, paying for services, or weakening fabrication/safety acceptance. The owner must explicitly approve any such operation; none is necessary for progressing software work on #102.

## GitHub review and owner approval are NOT a development pause

**Verified against the repository's actual GitHub API on 20 November 2026:**

- Branch `wt021/integrated-release` is **not protected** and existing draft PR #102 remains open. No PR reviewer is requested and no review has been submitted.
- The active `Protect main — reviewed releases` repository ruleset (ID `27557340`) targets **only the default branch**, not the WT-021 working branch. Its configured `required_approving_review_count` is **0** and `require_code_owner_review` is **false**; it does require the `static` status and resolved review threads for a merge to `main`. The `.github/CODEOWNERS` file does not separately enforce approval.
- The `AI contributor contract` workflow is conditional on a PR title starting with `[WT-`. PR #102's current title does not match this pattern, so that job is **skipped**, not a request for owner approval.
- **Therefore, DO NOT wait for owner approval, a PR review, a reviewer assignment, the draft PR to become "ready for review", or a merge between implementation milestones.** Continue creating tested commits on **the already-authorised draft PR #102 branch**. Successful checks are a signal to continue to the next software requirement, **not** a cue to ask the owner to merge.
- Owner sign-off is reserved for **final review, merging and deployment**, none of which is in scope for the unattended software run. Ignore branch governance text that assumes every new phase requires a newly approved PR; the owner already approved continuation in #102.
- Re-check current rules before acting if the repository protection changes. This is a **GitHub configuration finding**, not proof that the specific Codex session has valid push credentials. If Codex gets an actual `403`, authentication prompt or push rejection on #102, log the exact error, request necessary access once at the start, and continue independent tasks rather than pretending credentials or approvals are available.

## Token and CI efficiency — don't spend quota replaying known work

Start with [fast start](WT021_FAST_START.md) and the [one next action](../../docs/WT021_NOW.md). Read the full owner-approved specification on initial orientation, but do not repeatedly reload the entire prompt archive or accumulated run log after each small task. Consult original requirements for the specific work.

The static/Chromium/Manifold GitHub workflows use **`cancel-in-progress: true`** per PR. Each push can cancel expensive ongoing checks. Commit coherent progress locally, run targeted tests while iterating, then **batch one tested milestone + register + NOW + log** into a remote push. Exception: push the best recoverable checkpoint immediately if session limits approach. Run full independent CI before acceptance; targeted checks don't certify completion. Do not tight-poll CI or repeatedly fetch full success logs.

If the same failure produces no new evidence after a focused reproduction and correction, record the exact repro and advance a safe independent task rather than looping. Keep NOW ≤45 lines; append the run log only after meaningful milestones. See the [specific test commands](WT021_FAST_START.md).

## Stage 1 — Unattended execution loop (repeat until software acceptance is genuinely complete or the session ends)

**Do not stop at the end of a phase, at a green CI run, or simply to ask "what next?"** Follow the ordered [active execution tasks](WT021_EXECUTION.md), moving from the next unverified register item to the next. Resolve ordinary design/implementation ambiguities using accepted requirements, measured fixtures and prior tests, and document the choice.

For each coherent milestone:

1. Capture **baseline exact SHA**, select the next P0/P1 item from the 24-row register (23 original + UX-01 P1), identify an objective failing/absent test and implement the **actual** shared app/Manifold change.
2. Run targeted test(s), independent exported STL/3MF measurement and real Chromium interaction checks. Test valid+invalid paths, saved state and cross-family regressions. Never change tests merely to hide a real geometry mismatch.
3. **Commit and push to the existing PR #102 branch** with a descriptive message, then record the exact head in the checkpoint log. Preserve each already tested milestone and avoid large uncommitted edits.
4. Let relevant exact-head CI complete, inspect failures and fix them while staying in #102. Continue separate non-overlapping work while CI runs **only if** doing so does not invalidate/cancel the verification run or hide its result. Re-run and report checks on the final intended commit.
5. Update the authoritative [completion register](../../docs/WT021_COMPLETION_REGISTER.md) item-by-item with precise evidence; mark VERIFIED **only** if every software gate for that item has actually passed. Physical Cura/print evidence belongs to #10 and cannot be invented.
6. Append a compact **session checkpoint** to [`docs/WT021_RUN_LOG.md`](../../docs/WT021_RUN_LOG.md): completed work, actual file changes, exact head, pass/fail evidence, outstanding blockers and **the exact next task and test/command**.
7. Pick the next unverified work item **immediately**. No routine user confirmation required between items.

**Checkpoint cadence (critical for limited 5-hour/variable token usage):** Write and push the log at the start, **after each meaningful tested milestone**, after any significant failure/blocked branch, and again **before context compaction, token-budget warnings, planned handover or session exit**. Prefer small commit sets so progress is recoverable even if the environment terminates unexpectedly. Do not assume you can predict the exact quota deadline.

## Changelog, in-app catalogue and owner morning report — required work

- Every **meaningful, tested user-facing change** receives a concise entry in the **Unreleased — WT-021 draft** section of [CHANGELOG.md](../../CHANGELOG.md) with real user impact, relevant families, limits and proof. Batch it in the same push as source/tests/register/NOW/log; **do not push a separate change-log-only commit that cancels expensive CI**. Never claim unreleased draft features are deployed.
- Deliver **UX-01 P1** per [feature catalogue brief](../../docs/WT021_FEATURE_CATALOGUE_BRIEF.md): extend the app's existing Help/Changelog popup and What's New control; visual category cards, accurate working/partial status, representative local graphics, real click-through to tools, proper accessibility and one maintainable feature/release source so the in-app release text doesn't drift from `CHANGELOG.md`. P0 manufacturing gates remain the higher priority; use only independent UI time before those are met.
- Maintain [docs/WT021_OVERNIGHT_SUMMARY.md](../../docs/WT021_OVERNIGHT_SUMMARY.md) as a **short owner-facing rolling morning digest**. Update it with actual progress, tests, exact pushed SHA, limitations and single next action **after each meaningful tested milestone**, plus before expected quota/context cutoff. It must already be useful if Codex is suddenly interrupted. Keep it separate from detailed technical RUN_LOG and user-facing CHANGELOG.
- **Before normal finish or predictable cutoff**, push the current report, **post one concise PR #102 comment with report link and latest exact-head CI**, and write a matching summary in Codex chat if possible. No routine owner permission needed. A hard unexpected quota stop may prevent the final comment, so the committed summary is primary.
- **Purpose separation:** CHANGELOG = user-visible release history; NOW = one next task; RUN_LOG = chronological engineering proof; OVERNIGHT_SUMMARY = what the owner needs to read in the morning. Avoid duplicated long prose and redundant pushes.

## Stage 2 — When the session is interrupted or quota is nearly exhausted

- **Do not discard work or keep uncommitted state as the only record.** Commit/push coherent work; if experimental changes remain unverified, keep them explicitly labelled as such (do not claim green).
- Update `docs/WT021_RUN_LOG.md` with: current branch/head, last passing SHA and CI links, files changed, test results, known invalid states and their repro, register rows still open, **one unambiguous next executable step** and whether all changes have been pushed.
- If there is no safe opportunity to push or a write permission is denied, say so clearly and preserve the exact local path/patch/commit reference (if any). Never claim GitHub has a commit it does not have.
- When restarted, **read the run log first**, re-check current remote head (do not trust stale SHA), recover work from git commits and run the listed next step. Do not restart the milestone from scratch or rewrite tested work. If previous CI was pending, fetch its result first.
- There is **no guarantee a cut-off Codex session automatically resumes**. This log enables a new session to continue quickly when the user or product restarts it. Hard quotas/approval prompts are enforced by the platform.

## Stage 3 — Finish conditions and owner-facing report

Only report **software ready for final owner review** after all applicable software requirements for all seven builders are VERIFIED with full independent browser and Manifold/STL/3MF evidence and no unresolved P0s. Preserve owner-only Cura/physical print work under #10.

Finish with a concise report showing the exact final head, CI, each family acceptance, remaining owner-only physical steps and outstanding limitations. **Keep PR #102 draft and unmerged; never deploy.** Do not ask whether to merge as a routine overnight follow-up—leave that decision to the owner after review.
