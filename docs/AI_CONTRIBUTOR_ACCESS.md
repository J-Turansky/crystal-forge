# External AI collaboration — access, security and owner setup

## The low-risk collaboration path is available without sharing credentials
This is a **public** repository with Issues and pull requests enabled and forking allowed (observed 2026-11-18). A person or their AI may **read** the repo and the `planning/prompts` branch, then provide review findings right away. To comment or create a fork/PR, they sign in with **their own** GitHub account and let their own AI connect to GitHub if supported.

**Never distribute the repository owner's access token or password.** External agents must use their own authorisation. For code contributions, a personal fork is preferable to inviting every contributor as a direct writer. The repository's source licence is all-rights-reserved: resolve contributor rights for accepted code/assets with the owner before merge.

## Owner setup — necessary to enforce the review rules (not done by this document)

On GitHub (repo `Settings → Rules → Rulesets`, or `Settings → Branches` when available), create a branch protection/ruleset for **`main`**:
1. Require pull requests before merge; disallow force pushes and deletion of `main`.
2. Require at least one independent approval; enable code-owner review using `.github/CODEOWNERS` when available.
3. Require status checks that actually exist on `main`: Static repository checks, Browser smoke test, Verify Crystal Forge fabrication, and optionally the new contributor intake check. Verify exact job names in GitHub; do not invent check context names.
4. Require conversation resolution and latest-head checks where supported; block direct pushes except explicitly approved emergency maintainers.
5. Keep auto-merge disabled and owner-controlled deployments; verify Pages currently deploys from every `main` push and release metadata must be updated.
6. Check any plan- or permissions-related limits shown in the UI. A setting is not active until GitHub confirms it; this document is not enforcement.

The currently connected AI GitHub tool can *read* many repository APIs but **cannot configure branch protection/rulesets or invite collaborators** through its exposed actions. The owner must apply these settings. Do not claim they are already enabled.

## Fork + PR workflow for a contributor
1. Sign in to their own GitHub account.
2. Open the public repo and click **Fork** (for code; pure review requires no fork).
3. In their AI tool, connect GitHub with the minimum scopes needed for their fork (if the AI cannot write, use a local git client and their own credentials, or send a proposed patch to the owner).
4. Read onboarding and exact assigned brief: `git fetch origin planning/prompts` then `git show <PINNED_SHA>:prompts/NNN-topic.md`. In a fork, ensure the upstream remote points to the source repository before fetching.
5. Work on `feat/WT-###-slug` based on source `main`, run tests, push to the fork, then open a **draft** PR to the owner repo. Include task ID, prompt+SHA, overlap check, source/test evidence and handover updates.
6. Wait for the owner's review; never request elevated repository permissions or merge without authority.

## Duplication and agent scheduling
- The canonical task record is its Issue and the approved pinned prompt. Add a claim comment when starting, with actor and affected files.
- New contributor PRs named `[WT-###] ...` can be automatically checked by the staged `ai-pr-contract.yml` workflow after it is merged into `main`. That check validates handoff fields and flags duplicate open PRs claiming the same Issue. It does **not** reliably detect semantic duplicates; coordination still requires inspecting all open PRs.
- Multiple AI conversations do not become autonomous workers by being added to GitHub. The person starts their AI or an independently authenticated agent runner does. Scheduled audit reporting can be created separately.
- For first-time onboarding, use the **read-only pilot** [WT-001](https://github.com/connorturansky-svg/crystal-forge/issues/31).

## Legal / content
The project presently uses an all-rights-reserved notice. A public fork feature is not an open-source grant. Do not submit unlicensed designs, copyrighted reference assets, private customer files, secrets, tokens or other contributor's code without permission. The repository owner decides contribution/IP terms before merging substantive third-party code.

## How to verify the setup
- On `main`, check whether `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/ai-task.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS` and `.github/workflows/ai-pr-contract.yml` are present.
- Confirm a contributor can open the onboarding and read-only task from a logged-out browser.
- With a test fork, create a *draft* test PR with `[WT-###]` in its title, a valid Issue claim and approved SHA. Ensure the contract check fails incomplete metadata and flags a second PR claiming the same Issue.
- Verify owner review/branch ruleset restrictions by checking actual GitHub configuration and UI, not by trusting a documentation claim.
