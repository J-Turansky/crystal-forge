# Historical README release notes — archived without changing claims

These two sections were formerly embedded in the root README. They are retained for historical context and earlier issue/PR references; they **do not imply current completeness or acceptance**. Relative Markdown links have been adjusted to remain valid under `docs/history/`.

## Historical development milestones

### PR7 — Completion milestone

[Draft PR7](https://github.com/connorturansky-svg/crystal-forge/pull/13) extends all five development packages in one branch. [PR7 scope and physical acceptance matrix](../PR7_COMPLETE_FABRICATION.md): real opt-in targeted light conduits, mixed per-LED socket profiles, shaped fit coupons, detachable M3 base/plate, modular production ZIP, worker progress and extended benchmarking. None of these guarantees every spike is illuminated or mounted safely without actual Cura/print testing.

## PR6: all five packages in one pull request

[Merged PR6](https://github.com/connorturansky-svg/crystal-forge/pull/11) contains **implementation changes from all five major development packages**, with reviewable commits and an [all-phase acceptance matrix](../PR6_ALL_PHASES.md). It includes Cura/print checks, candidate optical audit and LED retention, split dowels, shape presets/hardware snap, and a complete production ZIP. It does **not** claim that physical safety, optical transmission, Cura imports or the advanced work backlog are all verified or complete.

## PR5 development and what remains

Draft [PR5](https://github.com/connorturansky-svg/crystal-forge/pull/5) adds an opt-in underside wiring plan and manufacturing grooves, wire CSV, LED-specific calibration strips, conservative roof-span review and user-entered printer dimensions. The live app only updates after a reviewed merge to main.

The **[PR5 master implementation plan](../PR5_MASTER_IMPLEMENTATION_PLAN.md)** groups all outstanding tasks into five large delivery packages, and the [Cura profile generator guide](../CURA_PROFILE_GENERATOR.md) explains machine/nozzle/material compatibility, importing the .curaprofile ZIP and the required test prints. The backlog tracks stages from physical pixel retention through real optical passages, bridge/support checks, modular split connectors, hardware editing, performance and material previews. Items listed there are not automatically implemented.


## v0.8.0 — Extreme shapes and printable hardware

**Design:** Crystal starting size (50–400%) changes crystal diameter independently of height. Bottom and top/shoulder adjustments (-85% to +400%) and reproducible per-crystal width randomness create extreme tapered shapes. Lean is a rigid quaternion rotation rather than a stretched/sheared shaft; the whole root perimeter is seated inside the mound. Viewport brightness controls the softer studio lighting only.

**LEDs:** Automatic socket placement searches crystal roots and the wider integrated base, using the actual global crystal scale. In Build choose Place / move LED: hover the model for a circular valid/invalid bore preview, click to add repeatedly without orbiting, then use Escape/Stop to exit. A rounded blind roof retains modeled wall above each LED channel; verify physical LED clearance and light routes in Cura.

**Edge fixing tabs:** Advanced Build → Mounting → Edge fixing tabs. Set number of equally spaced semicircular ears, holes per ear, diameter, thickness and plastic web. Build shows planned ears/holes; valid ones are fused into the prepared mesh, and crowded ears are skipped with a warning. Neither geometry tests nor tooltips certify load strength or suitable overhead fastening.

**Help:** Hover buttons, tabs and sliders (or keyboard-focus them) for a short contextual explanation. See the in-app What's new panel and [testing instructions](../TESTING.md).

