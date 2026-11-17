# Sensory Model Studio v0.16.0 — in-progress acceptance

**State: incomplete development checkpoint; not a release or merge candidate.**

The complete user-approved scope is retained in [the development brief](SENSORY_MODEL_STUDIO_V016_BRIEF.md). All stages A–F remain in this single draft PR. This checkpoint does not reduce the scope to architecture or substitute one generator for the seven requested.

## Audited baseline

- Repository: connorturansky-svg/crystal-forge.
- Main starting commit: `c7f540aa61b1e3998bcce61d2a187a5ebdffe8ff` (merged PR14, v0.15.1).
- No open pull requests were returned at the start of this audit.
- GitHub Releases returned no release objects. The active page displays v0.15.1.
- Exact-baseline static, fabrication, browser and Pages workflows were successful:
  [static](https://github.com/connorturansky-svg/crystal-forge/actions/runs/43198134896),
  [fabrication](https://github.com/connorturansky-svg/crystal-forge/actions/runs/43198134794),
  [browser](https://github.com/connorturansky-svg/crystal-forge/actions/runs/43198134748).
- These older successes do not verify this feature branch.

## Actual implementation

| Subsystem | Implemented source | Integration / acceptance still required |
| --- | --- | --- |
| Documents | Pure versioned model/project records; independent copies; tab ordering/closing/reopening; revision changes | Connect to editor, accessible tab UI, per-model undo/redo, cache and camera lifecycle |
| Print jobs | Stable model/job identity, unique preparation ticket, cancellation, stale-result rejection, printer override snapshot, export gating | Connect worker, global Print Centre, progress and cache ownership |
| Library | Immutable saved revision snapshots, guarded source updates, copies, pinned links, explicit update acceptance/break link | Visual cards, thumbnails, filters, conflict UI, rollback UI, durable scalable storage |
| Migration | Deterministic additive import of active state, all named projects, custom profiles and templates; verified backup before destination write; original keys preserved | Browser startup integration, actual vault-backup import, wider historical fixtures and cross-device tests |
| Registry | Executable contract validation; missing-type error preserves documents | Register legacy adapter and every new completed generator |
| Tactile geometry | Six continuous relief patterns, rectangular/rounded/elliptical/hexagonal outlines, numerical controls, repeatable seeds, closed flat underside, primary plate + contrasting connected top | Live controls/preview/library lifecycle; curved/domed bases, tactile rounding, seamless tiling and shared Build features |
| Materials | Separate touching solids with no intended volumetric overlap; Manifold adapter rejects overlap; common-frame STL pair and multi-object material-labelled 3MF writer | Verify actual Manifold tests, browser exports, robust XML/re-import coverage, gear/cap fixtures and installed Cura acceptance |
| Private sync | Existing vault was audited and preserved | Versioned manifest/assets, SHA guards for new schema, interrupted-sync recovery and conflict UI |

Only one currently implemented new generator is registered by consumers in tests; the production page has not been connected to the new core. There are no placeholder registrations pretending that the rest of the catalogue works.

## Generator catalogue

| Generator | Current status |
| --- | --- |
| Crystals | Existing v0.15.1 editor preserved; multi-model adapter and parity checks pending |
| Tactile Texture Tiles | Source geometry, material partitions and manufacturing/export modules added; end-to-end application integration pending |
| Cogs & Gears | Pending implementation, including involute mechanical geometry and interference checks |
| Waves & Organic Forms | Pending implementation |
| Buttons & Control Caps | Pending implementation |
| Characters & Silhouettes | Pending implementation |
| Glowing Pebbles & Light Pods | Pending implementation |

## Architecture mapping and next integration work

The original `studio-v3.js` owns mutable `s`, `crystals`, selection and undo history in module scope. `persist()` writes the active document to `crystal-forge-v3`. New documents wrap the full legacy settings and editable crystal records without filtering away measured profiles or hand placements.

Preserve `geometry-v3.js`, `hardware-layout.js`, `hardware-editor.js` and the existing Manifold entry point. Introduce a Crystal adapter against those real implementations. It must supply per-model settings, selection, history, view state and cached scene resources without iframe isolation or duplicating the full app. Replace worker result ownership with the model/revision/request ticket contract before permitting tab switching during jobs.

The tile generator returns indexed Y-up source meshes. Its Manifold adapter validates positive bodies and rejects material overlap; the export module rotates every part together into Z-up, retaining matching origins. Material roles are recorded in core 3MF basematerials plus a JSON companion; intended extruders are recorded as a request, never a claim that Cura assigned them. The secondary material is a connected contrasting top layer, not isolated floating pattern islands.

New modules are root ESM files to match the repository's existing import and CI discovery model. No additional dependency is introduced. This is an implementation choice, not a new user requirement.

## Verification

Added:

- `tests/studio-documents.test.mjs`: model isolation, close/reopen/reorder, duplicate independence, round-trip, stale/wrong-model/cancelled worker results, failure export gating, pinned link updates, revision conflict, deterministic legacy recovery and quota-failure preservation.
- `tests/tactile-tile.test.mjs`: all 24 outline/pattern combinations, repeatable geometry, finite points, oriented two-manifold indexed edges, positive signed volume, primary/secondary partition volume and touching plane.
- `tests/tactile-manifold.test.mjs`: real WASM tests for six patterns, connected positive parts, overlap rejection, aligned STL payloads, ZIP CRC/structure and multi-object 3MF metadata. Added to `npm test`.
- Document and source-mesh tests are added to `npm run test:static`; existing test commands are retained.

The document and source-topology assertions were executed successfully in hosted JavaScript against the authored source with ESM declarations removed. This is limited evidence: it is not Node module loading, Manifold, browser interaction, a benchmark, Cura slicing or a physical print.

This authoring session has no executor, filesystem, terminal or browser runtime. Therefore no local `npm` command, real Manifold run, screenshot or baseline rerun is claimed. Exact-PR-head GitHub Actions results must be checked separately after opening the draft PR. Browser CI currently exercises the preserved legacy application; its success alone would not verify a new studio UI.

## Remaining release gates

- Full seven-generator implementation with three presets per new generator and complete shared lifecycle.
- Actual project-level navigation, visual picker, visual library and global Print Centre.
- Shared physical mounting, base and optional lighting modules.
- Per-model history, thumbnail generation and invalidation, background resource disposal and performance measurements.
- Complete additive migration/recovery and private-vault manifest/assets integration.
- Actual dual-material gear and cap geometry and export fixtures.
- The complete Snowsmith Wonder Trunks demonstration project and required user journey.
- Latest-head static, real Manifold, browser and performance checks with exact commit SHA.
- Open single- and dual-material exports in installed Cura with an actual UM3 Extended dual-extrusion configuration; verify assignments, dimensions, overlap, layer support and prime tower.
- Print representative PLA/PETG samples, test fit, tactile surfaces, accessible illumination cavities and mounting. No optical, mechanical, toy-safety or electrical certification is implied.

Main is not changed, no deployment or release is requested, and merge remains subject to explicit approval.
