# User-provided v0.16.0 development brief

Authoritative scope imported from Codex development prompt(1).docx. Extracted document text follows; page markers identify the original document pages.

<PARSED TEXT FOR PAGE: 1 / 32>
Codex development prompt: Sensory Model Studio v0.16.0

Mission

Transform the existing Crystal Forge web application into Sensory Model
Studio, a browser-based parametric design and 3D fabrication environment
for creating tactile, decorative, illuminated and optionally interactive objects.

Repository: connorturansky-svg/crystal-forge

Starting point: Current main branch, approximately v0.15.1. Verify the latest
commit and release state before making changes.

Project: The Snowsmith — Wonder Trunks, a collection of four sensory
environments:

   1. The Goat Farm: Goats, grass, wool, cheese, picnic objects, pattern
      recognition and playful audio.

   2. Thawmor River: Flowing water, waves, wind, soft stimulation, fabric
      movement, prisms and coloured light.

   3. McDigger Mine Co.: Crystals, rocks, mineral surfaces, tactile exploration
      and illuminated gems.

   4. The Weather Workshop: Mechanical gears, controls, buttons, levers,
      weather instruments, ducting and faster sensory effects.

The intention is to create bespoke 3D-printable components for interactive
sensory installations, using Ultimaker 3 Extended and Ultimaker 2+ printers.

Key principle: Preserve the current Crystal Forge experience while expanding
it into a modular creative tool. This should remain approachable to a visual
artist, not become an unnecessarily complicated general CAD application.

1. Repository investigation and development rules

Before editing:

   1. Inspect the latest main, open PRs, branches, current application code
      and GitHub Actions.

   2. Read AGENTS.md, docs/AI_HANDOVER.md, docs/ARCHITECTURE.md,
      docs/PROJECT_VISION.md, docs/FEATURE_SPECIFICATIONS.md,
      docs/DESIGN_DECISIONS.md, docs/ROADMAP.md and docs/TESTING.md.
<PARSED TEXT FOR PAGE: 2 / 32>
   3. Examine the current crystal generator, Three.js editing, Manifold
       fabrication, save/library code, GitHub vault, Cura exporter and browser
       tests.

   4. Identify reusable systems and dependencies. Avoid unnecessary
       rewrites.

   5. Establish baseline automated tests and record the exact starting commit.

The current source includes:

      index.html — application interface and module bootstrap.

      studio-v3.js — existing editor, state management and workspace
       orchestration.

      geometry-v3.js — crystal generation and preview geometry.

      hardware-layout.js and hardware-editor.js — LED, mounting and Build
       interactions.

      fabrication-v1.js and fabrication-worker.js — Manifold geometry and
       manufacturing.

      cura-profiles.js and production-pack.js — printer configuration and
       exports.

      project-library.js, project-templates.js and github-vault.js — local
       persistence and private syncing.

      tests/ and .github/workflows/ — existing regression checks.

These are established responsibilities, not a mandate to preserve the existing
monolithic structure.

Create a new feature branch and one consolidated draft pull request,
provisionally titled:

PR15 — v0.16.0: Sensory Model Studio — Multi-Model Architecture and
First Generator Catalogue

The PR must contain meaningful implementation, not simply documentation,
mockups or placeholder controls.

Do not push to main, deploy, merge or publish a release without explicit
approval.
<PARSED TEXT FOR PAGE: 3 / 32>
2. New application layout

Replace the existing single-object navigation with a persistent project-level
workspace.

Top navigation

Create a browser-like model tab bar.

Example:

[ Library ] [ Crystal Mine × ] [ River Wave × ] [ Grass Tile × ] [ Cog Wheel × ] [ + ]
[ Print Centre ]

Required behaviour:

      The + button opens a visual model-type picker.

      Every model tab represents one independent editable model instance.

      Multiple models of the same type can be open simultaneously.

      Tabs can be renamed, reordered, duplicated, closed and reopened.

      Closing a tab must not automatically delete its model.

      Clearly show unsaved changes, background preparation and invalid
       manufacturing state.

      Persist open tabs, order and active selection as part of workspace state.

      Support keyboard navigation and accessible focus behaviour.

      Avoid destroying and reconstructing geometry unnecessarily when
       switching tabs.

      Background tabs must not continually consume rendering or fabrication
       resources.

Keep the project name, save controls and workspace navigation clearly
distinguishable from individual model controls.

Inside model tabs

Each model retains two primary stages:
<PARSED TEXT FOR PAGE: 4 / 32>
Design: Generator-specific modelling parameters, presets, visual styles,
selection and geometry controls.

Build: Shared physical features such as bases, hardware mounting, LED
placement, connections, tactile treatment and fabrication preparation.

Provide an obvious Send to Print Centre action.

The existing Crystal generator must retain its current design and Build
functionality.

Global Print Centre

Printing becomes a separate global workspace.

It is responsible for printer profiles, material assignment, fabrication
preparation, print-job collections, exports and print validation across every
model type.

The global Print Centre replaces duplicated printer controls inside individual
model tabs.



3. First catalogue: seven working model types

All seven generators are in scope for the first PR.

The existing Crystal generator counts as one of the seven, but must be
migrated into the new architecture rather than rebuilt.

Each generator must support:

      Deterministic, reproducible parametric generation.

      Editable numerical controls and sliders.

      Preset selection and randomisation where meaningful.

      Appropriate geometry limits and validation.

      Real 3D preview geometry.

      Manufacturing geometry produced through the shared pipeline.

      Optional applicable Build modules.

      Save, reopen, duplicate, link and export.
<PARSED TEXT FOR PAGE: 5 / 32>
      Thumbnail generation and library integration.

      Undo/redo and prepared-mesh invalidation.

Generator A — Crystal Clusters

Preserve the existing Crystal Forge feature set, including:

      Crystal families and formation patterns.

      Individual crystal editing, transforms, locks and seeded regeneration.

      Clustering and spacing.

      Rounded facets and tip controls.

      Existing base and optical options.

      Measured LED profiles.

      Physical cable routing, pixel ordering and wire-length snapping.

      Mounting holes and tabs.

      Cura-first fabrication and production exports.

Do not simplify this generator to make the new system easier.

Generator B — Tactile Texture Tiles

This is the lead new generator and reference implementation for the
shared architecture.

Parametric controls:

      Tile outline: square, rounded rectangle, circle, hexagon and freeform-
       style preset outlines.

      Width, depth, overall thickness and corner radius.

      Pattern type and density.

      Relief depth, spacing, scale and orientation.

      Pattern randomness and deterministic seed.

      Surface smoothing and tactile rounding.

      Border width and edge transition.
<PARSED TEXT FOR PAGE: 6 / 32>
      Optional repeating or seamless pattern alignment.

      Flat, curved or gently domed base.

Required initial surface presets:

      Short grass / grassy tufts.

      Woolly curls and fleece-like ridges.

      Gentle flowing river ripples.

      Rocky mineral ridges.

      Raindrops and weather patterns.

      Geometric dots, spirals and concentric patterns.

Prefer continuous raised geometry over delicate, independently printed
spikes.

Support optional integrated mounting, sensible print orientation and dual-
material regions.

Generator C — Cogs & Gears

Parametric controls:

      Tooth count, initially approximately 8–80 where geometrically valid.

      Outer diameter and thickness.

      Gear module and pressure angle in mechanical mode.

      Tooth shape and optional tactile rounding.

      Hub and shaft bore.

      Spoke count, style and spacing.

      Decorative cutouts.

      Backing plate.

      Optional mounting axle or bearing accommodation.

Provide distinct Decorative / Tactile and Mechanical presets.
<PARSED TEXT FOR PAGE: 7 / 32>
Mechanical presets should use appropriate gear geometry and interference
checks. Decorative smoothing must not silently alter a functional gear's
meshing dimensions.

Generate one-piece printable gear bodies by default.

Generator D — Waves & Organic Forms

Parametric controls:

      Wave length, width and height.

      Amplitude and frequency.

      Phase and direction.

      Twist and taper.

      Number of overlapping waves.

      Surface thickness.

      Smoothness and rounding.

      Seeded organic variation.

      Flat mounting base or free-standing configuration.

      Optional translucent light diffuser.

Presets should include river ripples, sculptural flowing ribbons, wind forms
and water-flow surfaces.

The generator must produce closed, manufacturable geometry rather than
unsupported infinitely thin surfaces.

Generator E — Buttons & Control Caps

Parametric controls:

      Round, square, oval and custom preset cap profiles.

      Overall diameter and height.

      Domed, flat, concave and stepped tops.

      Finger-grip patterns.

      Engraved or raised symbols.
<PARSED TEXT FOR PAGE: 8 / 32>
      Tactile texture.

      Mounting shaft dimensions.

      Fit tolerance.

      Optional translucent centre or lighting window.

Start with adapters for common physical pushbuttons, arcade buttons and
switches, with clearly marked nominal dimensions requiring actual
measurement.

Prefer reliable external switching hardware over unverified print-in-place
click mechanisms.

A cap should be usable as a decorative or tactile object without requiring
electronics.

Generator F — Characters & Silhouettes

A simplified parametric character/relief generator, not a full character-
animation or sculpting engine.

Initial presets:

      Goat.

      Sheep.

      Cloud.

      Simple boat silhouette.

      Weather symbols.

      Mining and farm-themed icons.

Controls:

      Overall width, height and depth.

      Body proportions.

      Rounded outline.

      Extrusion and bevel depth.

      Relief layer depth.
<PARSED TEXT FOR PAGE: 9 / 32>
      Simple feature proportions.

      Pose or silhouette variations appropriate to each preset.

      Optional base, wall mount and LED cavity.

For example, the goat should support controlled body/head/horn/leg
proportions without requiring a complete arbitrary character rig.

Avoid small unsupported ears, horns or legs that could create weak or
detachable parts.

Generator G — Glowing Pebbles & Light Pods

Parametric controls:

      Round, oval, elongated and faceted shapes.

      Size and proportions.

      Faceting and surface smoothing.

      Organic irregularity.

      Wall thickness.

      Light diffuser texture.

      Base opening.

      Number and type of LEDs.

      Mounting options.

      Optional external opaque/coloured accents.

Support both illuminated and non-illuminated variants.

For illuminated models, generate genuine accessible cavities and routes, then
report possible blocked passages and roof problems.

Do not claim uniform optical diffusion from geometry alone.



4. Modular generator architecture

Avoid creating seven independent applications.
<PARSED TEXT FOR PAGE: 10 / 32>
Introduce a small generator registry with consistent, typed-by-contract
JavaScript interfaces using existing ESM conventions.

Suggested organisation, subject to repository inspection:

      core/ — workspace documents, state, revision handling, commands and
       persistence.

      generators/ — registry, shared parameter helpers and individual
       generators.

      modules/ — optional base, mounting, lighting, tactile, mechanical and
       colour capabilities.

      manufacturing/ — shared job preparation, splitting, reports and exports.

      library/ — saved models, versions, thumbnails and collections.

      sync/ — migration and GitHub vault integration.

      ui/ — tab bar, model picker, generator controls and Print Centre.

These paths are architectural suggestions, not a reason to move every existing
file immediately.

A generator contract should expose equivalents of:

      typeId

      typeVersion

      displayName

      category

      capabilities

      defaultParameters

      parameterSchema

      presets

      validateParameters(parameters)

      generatePreview(parameters, context)

      generateManufacturingGeometry(parameters, context)
<PARSED TEXT FOR PAGE: 11 / 32>
       estimateBounds(parameters)

       migrateParameters(fromVersion, data)

The design schema should describe control types, ranges, units, dependencies,
visibility, defaults and user-facing help.

Do not introduce separate ad hoc parameter-handling systems for each
generator.

Create capability declarations such as:

       supportsBase

       supportsLEDs

       supportsMounting

       supportsTactileSurfaces

       supportsMechanisms

       supportsDualMaterial

       supportsPartSplitting

Only show relevant Build controls for enabled capabilities.

The Crystal generator may use an adapter around its existing code instead of
duplicating or rewriting the original geometry engine.



5. Common Build modules

Extract or adapt existing engineering features into optional components
usable by multiple model types.

Bases

Support flat, raised, domed and integrated bases where applicable.

Allow base thickness, outline, transitions and edge radius to be configured
independently of the parent generator.

Some objects, such as individual gears, must be able to omit a base entirely.

Mounting
<PARSED TEXT FOR PAGE: 12 / 32>
Retain existing M3 inserts, screw holes, magnet positions, tabs and mounting
plates.

Share collision checks, clearance calculations and placement interactions.

Mounting features must actually change printable geometry, not merely
appear as preview markers.

Illumination

Retain the measured pixel profile library and current physical cable planner.

Permit opt-in LED sockets, cavities, direct light passages and routing on
compatible models.

Do not impose illumination controls on models that do not need them.

Preserve the physical pixel-spacing and safe-routing behaviour established in
Crystal Forge.

Tactile surfaces

Allow suitable generators to apply procedural surface patterns without
needing to switch model type.

For example, a large weather button may use a raindrop texture, while a
pebble may use mineral ridges.

Avoid blindly applying relief to functional gear teeth, shaft bores or
mechanical mating surfaces.

Mechanical interfaces

Introduce reusable nominal shaft, switch, bearing and fit parameters.

Separate fixed installation geometry from moving or rotating geometry.

Highlight pinch points, exposed moving mechanisms and any detachable small
components for manual review.

All generated modules must pass through the same geometry and
manufacturing validation.



6. Global Print Centre
<PARSED TEXT FOR PAGE: 13 / 32>
Create a dedicated top-level Print Centre.

Shared machine profiles

Preserve and centralise support for:

      Ultimaker 3 Extended.

      Ultimaker 2+.

      Existing custom-printer options.

      Supported nozzle and print-core combinations.

      PLA and PETG.

      Appropriate quality settings.

      Print orientation and bed dimensions.

      Cura profile export and manual settings fallback.

Keep printer, material and nozzle settings available globally, with explicit per-
model overrides.

Do not automatically overwrite model-specific design geometry when a shared
printer profile changes.

Print jobs

Users must be able to:

   1. Send one model or several models to the Print Centre.

   2. Select a shared printer profile.

   3. Assign materials and extrusion roles.

   4. Inspect dimensions and bed fit.

   5. Prepare actual manufacturing geometry.

   6. Review errors and printability warnings.

   7. Export STL, 3MF and production packages.

   8. Save print-job configurations as part of a project.

A Print Centre queue must reference stable model IDs and revisions, not
fragile tab positions.
<PARSED TEXT FOR PAGE: 14 / 32>
When a model changes after preparation, mark its job stale and require re-
preparation.

Preserve cancellation, progress indicators and recoverable failure behaviour.

Printability-first approach

Prefer:

      Watertight, connected bodies.

      Stable bed contact.

      Sensible overhangs and roof spans.

      Minimal removable supports where feasible.

      Practical wall thickness.

      Appropriate fit tolerances.

      One-piece printable geometry by default.

Keep automated geometric checks separate from real Cura and printed-part
acceptance.

Reuse the existing Manifold fabrication pipeline where practical.



7. Real Ultimaker 3 dual-colour manufacturing

This functionality is mandatory for the first PR, not simply future
planning.

Implement actual dual-material geometry, including a reliable single-material
fallback.

A model may contain:

      Primary material body.

      Secondary material body.

      Stable material-role metadata.

      Assignable colours and material profiles.

Required behaviours:
<PARSED TEXT FOR PAGE: 15 / 32>
   1. Generate two actual printable solid bodies when a dual-colour preset is
      selected.

   2. Ensure the solids occupy correctly registered positions.

   3. Prevent unintended volumetric overlap between the two material
      bodies.

   4. Detect disconnected islands, unsupported secondary features and
      invalid body partitions.

   5. Export two aligned, clearly labelled STL files as a universal fallback.

   6. Generate a genuine multi-object 3MF package with matching
      transforms, identifiable objects and appropriate material metadata.

   7. Allow explicit assignment of primary/secondary material to the two
      UM3 extruders in the application.

   8. Document any extruder assignments that still require confirmation in
      Cura.

   9. Retain fully functional single-colour exports for both printers.

Do not treat coloured Three.js materials as proof that the file can be printed in
two colours.

Add representative tests for a raised-pattern tactile tile, a two-colour gear and
a control cap.

Validate object separation, orientation, material correspondence, ZIP/XML
integrity and re-import where feasible.

Physical Cura acceptance: The generated multi-body file must be opened and
checked against an actual UM3 Extended dual-extrusion configuration. Do not
report that this physical check has passed merely because 3MF parsing
succeeds.



8. Model document and project data structure

Introduce a versioned document model.

Individual model
<PARSED TEXT FOR PAGE: 16 / 32>
Each saved model should contain:

      Stable UUID.

      Human-readable name.

      Generator type and version.

      Parameter data.

      Shared Build-module configuration.

      Per-object overrides.

      Material assignments.

      Optional printer overrides.

      Source/preset metadata.

      Revision and update timestamps.

      Thumbnail reference.

      Generator-specific editable state.

Do not persist unnecessary generated mesh bytes as the authoritative source
of model geometry.

Full project

Each project should contain:

      Stable project ID and title.

      Description and collection metadata.

      Named model instances.

      Model references and revision pins.

      Open-tab arrangement and active tab.

      Shared printer preferences.

      Shared hardware and material profiles where selected.

      Print-job definitions.

      Project version and migration history.
<PARSED TEXT FOR PAGE: 17 / 32>
Support saving a project containing multiple independent copies of the same
generator type.

An individually saved model must also be available outside the project where
it was created.

Copy versus linked model

Implement both explicitly:

Copy: Creates a completely independent editable model. Future source
updates do not affect it.

Linked reference: References a saved library model and its revision. A newer
source revision can be detected and offered as an update.

Linked models must not automatically change silently when their source
model changes.

Provide clear actions to inspect updates, accept an update, duplicate
independently or break a link.

Editing a linked instance should require a clear choice between updating the
source and creating an independent variant. Default to the non-destructive
choice.

Preserve old revisions for rollback.



9. Visual Library

Create a dedicated top-level Library workspace.

It must support:

      Model type catalogue.

      Reusable presets.

      Saved individual models.

      Complete projects and collections.

      User-created favourites.

      Search, filtering and sorting.
<PARSED TEXT FOR PAGE: 18 / 32>
       Filtering by Wonder Trunk theme, generator and model capability.

Library presentation

Use a visual grid of cards containing:

       Actual generated model thumbnail.

       Model/project name.

       Generator type.

       Optional theme classification.

       Last edited date.

       Version/revision information.

       Optional material and hardware indicators.

Create thumbnails from the actual model preview using a consistent camera
framing, lighting and background.

Avoid storing temporary stock reference imagery as permanent model
thumbnails.

A project card could show a small composite or preview of its saved models.

Provide library actions to open, duplicate, rename, export, create a linked
instance and review versions.

Storage

Keep a local-first experience.

Consider IndexedDB for larger model records and thumbnail assets, while
retaining migration compatibility with current localStorage data.

Use the document records as the source of truth; thumbnails and prepared
meshes should be regenerable derivatives.

Avoid arbitrary silent library eviction or project-count limits that cause data
loss.

Make storage capacity and backup failures visible and recoverable.



10. GitHub private library syncing
<PARSED TEXT FOR PAGE: 19 / 32>
Extend the existing private GitHub vault rather than replacing it with a new
hosted service.

Requirements:

      Preserve the existing private-repository connection workflow.

      Continue using restricted credentials held in memory only.

      Never include authentication tokens in public GitHub code, saved
       projects or production ZIPs.

      Support syncing individual models, presets, complete projects,
       thumbnails and linked-reference metadata.

      Maintain revisions and conflict recovery.

      Work locally while offline.

      Display local, pending, synced and conflict states.

      Never silently overwrite newer work from another device.

      Permit complete portable backup and recovery independently of
       GitHub.

Introduce a versioned vault manifest and separated assets rather than
endlessly enlarging one unstructured JSON document.

Support stable asset references and change detection so unchanged
thumbnails and project records do not need needless re-uploading.

Use safe writes, remote revision/SHA checks, local backups and explicit
conflict handling.

A sync interrupted halfway through must not leave the library pointing to
missing assets or an incomplete project.



11. Backwards compatibility and migration

This is a critical release gate.

Existing Crystal Forge work must remain accessible.

Current persistence includes:
<PARSED TEXT FOR PAGE: 20 / 32>
      crystal-forge-v3 active model state.

      The current named-project library.

      Custom measured pixel profiles.

      Saved templates.

      Existing private GitHub vault data.

Build an additive migration into the new model/project schema.

Requirements:

   1. A previous single Crystal project opens as a valid Crystal model within
       the new studio.

   2. Its settings, crystals, transforms, hardware profiles and manual
       placements are preserved.

   3. Old settings + crystals[] JSON files remain importable.

   4. Existing local named projects become library models or project records
       without losing their original content.

   5. Create a full pre-migration backup.

   6. Preserve the old storage keys until successful migration and recovery
       have been verified.

   7. Make migrations deterministic, versioned and idempotent.

   8. A failed migration must leave the original user data accessible.

   9. Importing old vault backups must continue working.

   10. Undo/redo, save, reopen and cross-device restore must remain reliable.

Add fixture-based regression tests using representative legacy documents and
project libraries.

Do not rewrite old projects in place without retaining the original data.



12. Safety-conscious sensory design

The models are intended for participatory sensory installations, potentially
including children and users with differing sensory needs.
<PARSED TEXT FOR PAGE: 21 / 32>
Adopt a design-by-default approach:

      Generous accessible touch surfaces.

      Adjustable corner and edge rounding.

      Avoid fragile points, sharp projections and exposed rough features.

      Avoid unnecessary small detachable parts.

      Minimise support material and difficult-to-clean recesses where
       feasible.

      Prefer durable one-piece bodies.

      Provide conservative recommendations for wall thickness and
       structural features.

      Flag possible pinch points on mechanical models.

      Keep lighting and electronic components accessible for maintenance.

      Avoid inaccessible sealed electronics cavities where heat or
       serviceability is a concern.

      Permit subdued, non-illuminated and non-mechanical versions of
       models.

      Clearly distinguish decorative parts from load-bearing or safety-critical
       components.

Make users aware of potentially unsafe small features, weak mechanical
connectors, hot components and unsuitable mounting configurations.

Do not claim compliance with toy safety regulations, suitability for
unsupervised children, electrical safety or load-bearing strength solely from
automated mesh checks.

Safety verification, physical testing and relevant compliance decisions remain
separate obligations.



13. User interface and design quality

Retain the creative, approachable character of Crystal Forge.
<PARSED TEXT FOR PAGE: 22 / 32>
The application should feel like a lightweight visual maker rather than
enterprise CAD.

Required characteristics:

      Large usable Three.js preview.

      Responsive layout for laptop and tablet screens.

      Clear separation between project navigation, model editing and
       printing.

      Simple/Advanced controls sharing the same underlying model.

      Context-specific generator controls.

      Meaningful parameter names and units.

      Tooltips and inline descriptions.

      Immediate visual updates wherever computationally reasonable.

      Clear invalid/blocked geometry warnings.

      Consistent hardware colours and selection indicators.

      Visible progress on expensive operations.

      Undo/redo across supported model edits.

      No unintended camera resets when switching model tabs.

      Proper keyboard and pointer access.

      Stable view framing and orbit behaviour.

      Useful empty states and error recovery.

Do not copy Blender's or Fusion 360's complexity merely because the tab
metaphor is similar.

The visual model picker and saved library should make it easy to start creating
an object without reading technical documentation first.



14. Implementation stages within the first PR

The first PR must cover the selected full catalogue and shared foundation.
<PARSED TEXT FOR PAGE: 23 / 32>
Use clearly separated commits or internal milestones so incomplete
functionality can be diagnosed.

Stage A — Architecture and workspace

      Establish model registry and generator contracts.

      Introduce project and model document schemas.

      Create model tab bar and new-model picker.

      Introduce project-level state management.

      Preserve existing Crystal generator through an adapter.

      Establish shared model lifecycle, invalidation and revision rules.

Acceptance: Multiple independent Crystal model tabs can coexist, save,
reopen and switch without corrupting each other.

Stage B — Library and persistence

      Create Library workspace.

      Add model presets and project collections.

      Generate actual preview thumbnails.

      Implement copy and linked references.

      Add versioned migrations.

      Expand private GitHub sync and backup handling.

Acceptance: Two different browser profiles can recover equivalent saved
model collections through a tested backup/sync flow, without losing older
Crystal data.

Stage C — First generator catalogue

Implement the complete seven-generator catalogue.

Recommended implementation order:

   1. Tactile Texture Tiles.

   2. Cogs & Gears.

   3. Waves & Organic Forms.
<PARSED TEXT FOR PAGE: 24 / 32>
   4. Buttons & Control Caps.

   5. Glowing Pebbles & Light Pods.

   6. Characters & Silhouettes.

   7. Crystal migration and full parity verification.

Crystal preservation work begins in Stage A; the final item above is the
complete end-to-end regression sign-off.

Do not declare a generator complete until its controls produce valid,
exportable, repeatable physical geometry.

Acceptance: At least three meaningful presets per new generator, with
complete parameter editing, save/reopen and representative Manifold
manufacturing tests. For Characters, include the goat preset and at least two
other themed silhouettes.

Stage D — Shared Build and global Print

      Reuse mounting, base and optional lighting modules.

      Add capability-based Build controls.

      Implement global printer/profile preferences.

      Implement per-model print queue and overrides.

      Preserve existing manufacturing and Cura workflows.

      Add reliable multi-model production exports.

Acceptance: A Crystal, tactile tile, button and gear can all enter the Print
Centre and produce independently valid exports without duplicating printer
settings.

Stage E — Actual dual-colour exports

      Add stable material role definitions.

      Generate distinct physically valid material regions.

      Export aligned STL pairs.

      Export genuine multi-object 3MF packages.

      Test relevant geometry and import structures.
<PARSED TEXT FOR PAGE: 25 / 32>
      Provide explicit Cura validation instructions.

Acceptance: Representative tactile tile, gear and button models have two
distinct non-overlapping printable bodies, with stable alignment and material
metadata. Actual UM3 slicing remains a separate manual sign-off.

Stage F — QA, documentation and release handover

      Expand static and geometry tests.

      Expand Chromium interaction tests.

      Run migration, project/library and vault regressions.

      Verify multi-tab memory usage and state isolation.

      Verify cancelled and outdated preparation jobs.

      Update all accepted design records and architecture documentation.

      Update in-app Help, What's New, version and changelog.

      Produce one final acceptance matrix.

Acceptance: All mandatory software tests pass on the exact latest PR commit.



15. Test coverage

Create a test matrix covering the following.

Generator tests

For each generator:

      Deterministic output from a saved seed/parameter set.

      Different output when meaningful parameters change.

      Minimum/maximum legal parameter values.

      Invalid and out-of-range parameter handling.

      Watertight geometry and positive volume where expected.

      No unintended open surfaces or intersecting physical bodies.

      Correct print orientation and dimensions.
<PARSED TEXT FOR PAGE: 26 / 32>
     Undo/redo and data round-trip.

     Correct model thumbnail generation.

     Prepared-mesh invalidation following fabrication-relevant changes.

Workspace tests

     Open several independent tabs.

     Two tabs using the same generator maintain different settings.

     Switch tabs without changing other models.

     Close/reopen tabs without deleting models.

     Duplicate a tab as a genuinely independent model.

     Save and reopen an entire project.

     Reorder tabs.

     Recover from unexpected browser reload.

     Handle missing generator versions gracefully.

     Prevent stale worker results from attaching to another tab or a newer
      revision.

Library and sync tests

     Create, rename, save and duplicate models.

     Create complete themed collections.

     Save and restore thumbnails.

     Create independent and linked versions.

     Update source models without silently changing linked instances.

     Accept/reject linked updates.

     Import legacy Crystal projects.

     Import legacy full-backup JSON.

     Restore through the private GitHub vault.

     Handle offline edits and remote conflicts.
<PARSED TEXT FOR PAGE: 27 / 32>
      Restore an older revision.

      Recover from failed or interrupted persistence.

Print and export tests

      All seven generators produce printable candidate geometry.

      Shared profiles work across models.

      Per-model overrides do not modify shared defaults.

      Multiple queued jobs maintain correct model identity.

      Failed preparation does not expose stale STL/3MF downloads.

      Single-material STL and 3MF remain valid.

      Dual-material geometry contains separate printable bodies.

      Material alignment and Z-up transforms are correct.

      Existing crystal cable/manufacturing tests remain green.

      Production packages contain editable source documents and relevant
       reports.

Browser and performance tests

Use existing tooling and add coverage where necessary.

Test a representative project with seven or more open model tabs, a mixture of
generators and several prepared print jobs.

Check that inactive tabs do not continuously rebuild geometry, that switching
tabs remains responsive, and that browser memory does not grow without
bound after repeated opening/closing.

Run at least:

      npm run test:static

      npm test

      npm run test:browser

      Relevant representative performance benchmarks.

All tests must be verified against the exact final PR head.
<PARSED TEXT FOR PAGE: 28 / 32>
16. Required user-journey demonstration

Include one complete example project named:

The Snowsmith — Wonder Trunks

It should contain illustrative parametric models from all four themed
environments:

Environment          Example models

Goat Farm            Grass texture tile, goat silhouette, wool texture

Thawmor River        Flowing wave form, tactile river-ripple tile, light pod

McDigger Mine        Crystal cluster, mineral texture, faceted illuminated
Co.                  pebble

Weather
                     Cog wheel, tactile control cap, raindrop texture tile
Workshop

The demonstration must show:

      1. Opening the project.

      2. Switching between independent model tabs.

      3. Adjusting generator-specific parameters.

      4. Adding shared Build features where relevant.

      5. Saving one model as an independent library preset.

      6. Linking another instance to a saved model.

      7. Generating thumbnails and browsing the library.

      8. Sending multiple model types to the Print Centre.

      9. Assigning shared printer settings.

      10. Producing one single-colour and one dual-colour manufacturing export.

      11. Saving and restoring the complete project.

Example models should demonstrate architecture and real functionality, not
inflate the catalogue with fake or hardcoded geometry.
<PARSED TEXT FOR PAGE: 29 / 32>
17. Scope deliberately reserved for later PRs

The first PR must not be reduced to architecture-only work; all seven agreed
generators and dual-colour exports are included.

However, the following are not required for the first release:

      General-purpose arbitrary CAD sketching.

      Full 3D character sculpting, rigging or animation.

      Automatic mechanical simulation.

      Comprehensive functional geartrain simulation.

      Automatic assembly and mechanical load certification.

      Fully automated multi-model slicer plate nesting.

      Integrated G-code slicing.

      A new hosted cloud backend or permanent OAuth login.

      Realistic optical ray tracing.

      Automatic compliance certification.

      Complex print-in-place mechanisms or custom spring simulations.

      Additional dedicated generators for boats, terrain, levers, wind ducts or
       cloud machinery beyond the selected catalogue.

These may become later developments if useful.

Do not quietly implement unfinished placeholder versions of them just to
imply broader capabilities.



18. Documentation and handover

Update:

      AGENTS.md where development instructions genuinely change.

      docs/AI_HANDOVER.md

      docs/ARCHITECTURE.md
<PARSED TEXT FOR PAGE: 30 / 32>
      docs/PROJECT_VISION.md

      docs/FEATURE_SPECIFICATIONS.md

      docs/DESIGN_DECISIONS.md

      docs/ROADMAP.md

      docs/TESTING.md

      CHANGELOG.md

      In-app Help, What's New and version information.

Create a dedicated document:

docs/SENSORY_MODEL_STUDIO_V016_ACCEPTANCE.md

Include:

      Architecture summary.

      Full generator catalogue.

      Implementation progress.

      Data schema and migration description.

      Cross-device sync design.

      Single-/dual-material export compatibility.

      Software test results with exact commit SHA.

      Manual Cura checks.

      Outstanding physical safety and printed-part verification.

      Known limitations.

      Follow-on development candidates.

Update the AI handover so a separate ChatGPT or Codex session can
understand the project's purpose, user decisions, accepted design rationale,
actual implemented state and remaining work without relying on the original
conversation.

Distinguish actual user-approved decisions from technical assumptions.
<PARSED TEXT FOR PAGE: 31 / 32>
19. Pull request completion requirements

Deliver one consolidated draft PR containing the application changes, tests,
documentation and example project.

Before declaring implementation complete, provide:

      PR link and exact commit SHA.

      Files and subsystems changed.

      All seven generator implementation status summaries.

      Migration and backwards-compatibility results.

      Browser test evidence.

      Real Manifold fabrication test evidence.

      Dual-colour export test evidence.

      GitHub sync and recovery results.

      Known software limitations.

      Physical printing and Cura validation still required.

If the work is too large to satisfy every acceptance criterion in one
development pass, continue organising it inside the same draft PR through
reviewable commits, with explicit outstanding work. Do not represent
incomplete generators, unsuccessful tests or unvalidated exports as finished.

Never merge automatically.

Final acceptance principle

The finished software should let an artist open Sensory Model Studio, create a
goat silhouette, grass texture, river wave, illuminated crystal or mechanical
gear, tailor its appearance, add appropriate hardware, save it to a shared
visual library, and prepare the model for printing without needing to
understand conventional CAD.

The system must remain parametric, playful, modular, physically grounded
and reliable, with the existing Crystal Forge model creator preserved as a
fully functional part of the new application.
<PARSED TEXT FOR PAGE: 32 / 32>
Begin by auditing the repository and mapping the proposed architecture to its
real modules. Then implement the complete staged scope on a draft feature
branch, preserving main until the work is reviewed and approved.
