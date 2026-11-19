# WT-018 shared Builder acceptance

P means browser, persisted state and manufacturing evidence together. L means limited or awaiting combined verification. M means missing. B means blocked on named geometry.

| Family | Double-click pixel before → candidate | Manual mount context | Routing source and applicable geometry | Save, profile and Print Centre acceptance |
| --- | --- | --- | --- | --- |
| Crystal Clusters | L → L, existing Crystal context | L, existing Crystal editor | L, Crystal serial planner and cutters | L |
| Tactile Tiles | M → L, Tile Playwright case | L (WT-020 draft, verification pending) | L, #67 solid backed fixture | L |
| Gears | M → L, shared handler | L (WT-020 draft, verification pending) | L, #67 solid decorative gear | L |
| Waves | M → L, shared handler | L (WT-020 draft, verification pending) | L, #72 solid backed fixture | L |
| Control Caps | M → L, shared handler | L (WT-020 draft, verification pending) | L, #72 backed cap without a shaft | L |
| Characters | M → L, shared handler | L (WT-020 draft, verification pending) | L, #72 backed Cloud | L |
| Pebbles / Pods | M → L, shared handler | L (WT-020 draft, verification pending) | L, #72 backed non-hollow fixture | L |

The native Build handler in `sensory-studio.js` raycasts visible model meshes, checks the chosen bore through the same function as manual placement, and commits through the existing pixel state and undo path. Existing marker double-click selects without adding. The shared browser scenario covers a Tile surface, Escape and measured bore placement. Remaining interaction acceptance includes all-family real-pointer fixtures, mount tooling backed by printable geometry, continuous placement with a ghost, keyboard/touch placement at a chosen point, and overlay/cutaway verification. Exercise transformed and recessed geometry, invalid placements and route joins. Keep cavity and shaft exclusions until verified. Physical testing lives in #10.

The native Show routes and arrows control is independent of Cut serial channels. Both use the same planner. The Tile fixture checks that the guide matches the planned cut path and produces no preview cutters or extra export negatives when cuts are off.

## WT-019 acceptance in progress

| ID | Acceptance | Evidence and remaining limits |
| --- | --- | --- |
| WT019-01 | Repeated native manual pixel placement with valid/invalid viewport preview and explicit exit | `sensory-studio.js` validates raycast points through the shared native bore check. `unified-studio-browser.test.mjs` exercises the Tile workflow with real mouse events, placement screenshot and Escape. L across native families until full family verification. Crystal retains its established manual workflow. |
| WT019-02 | Context add and direct manipulation of pixel and mounting hardware | L for pixel work. WT-020 draft adds a conservative source-backed M1…Mn through-hole contract on verified solid columns, with physical Manifold and browser fixture tests. It is L until exact-head CI and actual cross-family release acceptance; curved side-facing retainers and load testing remain outside this draft. |
| WT019-03 | Guide, physical route and prepared shape agreement | L. Existing backed fixture manufacturing evidence covers eligible shapes. Complete route, cutaway and per-family interaction verification remains open. |
| WT019-04 | Design, Library, imports and current Print exports across built-in and imported types | L pending end-to-end matrix. Procedural subpart editing is N/A for imported mesh source. No safe imported-hardware guarantee is made. |

## WT019-05 · Gear placement and routing

The main-targeted integration preserves the checked #82 and #83 source history. The native picker shares the Build mode gate and carries the selected top or underside opening into preview marks. Mesh bores still cut through both faces and native cable channels remain underside-only. The browser suite covers bottom-view Gear double-click and guide visibility with cutting off. The existing openwork check confirms the planner explains why unbacked voids block cutting. Mark L until exact-head verification, including physical validation tracked separately in #10.

WT019-06 extends real viewport double-click coverage to the six native fixtures, including an explicit rejection case where the clicked face is unsupported. Existing Crystal tests remain separate. This is partial coverage: it does not certify on-face retainers, builds with unsupported backs, all-family print/reload, mounts or Studio-wide parity.

## WT020-01 — Native mounting integration candidate

The WT-020 native mounting draft is based on the verified #85 six-family fixture tip, not on deployed main. It adds contextual Add mounting feature, toolbar continuous placement, numbered direct-select M markers, 2–8 mm through-hole precision edits, delete and keyboard nudge, guarded negative geometry and preview rings. A positive result must pass the existing solid-column certificate and have a real cutting intersection, with actual Manifold/STL/3MF tests for all six native generator families; it must refuse unsupported side-facing mounts, voids, shaft/cavity interference, pixel overlap and unsafe routing. Native mount placement uses vertical through-holes, not arbitrary normal-aligned sockets, inserts or load-rated fasteners. Crystal keeps its established mount editor. Do not mark the L cells P until latest-head browser/production tests, storage round-trip and full user walk-through are proven. Hardware load, fit and Cura acceptance stay in #10.

## WT-020 native camera framing

The active native solid bounds drive view presets and orbit centring. Hardware overlays are excluded from those bounds. The six native browser fixtures exercise ISO, front, back, bottom and top before surface placement. This camera regression does not upgrade the fitting, mount, routing, persistence or export columns to proved.

## WT-020 openwork Gear acceptance

`tests/unified-studio-browser.test.mjs` exercises four automatically fitted pixels on the Forked Sun Gear, explicit unavailable wiring, workspace reload and bore-only STL and 3MF exports. The solid Gear scenario separately exercises underside viewport placement and routed geometry. Keep these cells L pending exact-head evidence and manual four-fitting workflow, face/cutaway and published-site verification.

## WT-021 shared manufacturing downloads

Print Centre exposes STL, 3MF, Cura profile and the production pack on each prepared job. A multi-material STL download groups the aligned STL parts with material assignments. Each action uses the existing freshness and geometry export gate. Cura uses the selected job's effective settings. The browser test compares the standalone Tile STL and Cura profile byte-for-byte with the corresponding production-pack entries. Keep full family manufacturing acceptance at L: external tabs, selected-face hardware and the complete workflow still require their own evidence for each family.

## WT-021 external backing tabs

The six recipe-based builders share one backing-tab editor under Mounting & attachments. It uses Crystal’s perimeter planner to union external stock and subtract a screw bore. The six-family fabrication fixture checks real union, volume, expanded bounds and STL/3MF. Crystal retains its existing hardware editor. This is limited (L): independent browser journeys, moving/fixed assemblies, drag interaction, other fixing types and public release evidence are pending.

### Tile backing compatibility repair

Tactile Tiles now have an explicitly allowed single-material fitting backing, separate from the legacy integrated-base feature, while dual-material/partitioned recipes remain rejected. All seven-builder parity cells are still limited until actual browser interactions, saved positions, correct Manifold positive tab unions, screw cuts, STL/3MF and live-site checks pass.
