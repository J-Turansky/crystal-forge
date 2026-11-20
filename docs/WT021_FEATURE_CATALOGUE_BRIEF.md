# UX-01 — Features & What's New catalogue

**Approved additional feature: 20 November 2026, P1.** Implement within draft PR #102, after essential P0 fabrication and seven-family work, or in a genuinely independent UI slot that does not interfere with those tests. Track its own acceptance in [WT-021 register](WT021_COMPLETION_REGISTER.md). This is a **working web-app feature**, not just a documentation mockup.

## Design within the existing app

The current Pixel Model Maker already has a **Help / Changelog** dialog in `index.html` (`#infoOverlay`, `[data-info="help"]`, `[data-info="changelog"]`) and toolbar `#changelogBtn` (What's New). **Reuse and extend this popup** with a third **Features** view; don't create a competing modal or separate website.

- Organise visually attractive feature cards by **all seven model builders** (Crystals, Tiles, Gears, Waves, Caps, Characters, Pebbles/Pods) and **Design & Shaping, Build & 3D Editing, Pixels & Fit, Wiring & Lighting, Mounting & Assembly, Library & Projects, Print Centre & Cura, Inspection/QA, Accessibility & Help**. Use sensible categories, a short title, concise plain-English explanation, supported model families and clear capability status.
- Provide **graphics** on cards: small local SVG/icon/diagrams and genuine app screenshots where available. Do not invent screenshots, embed remote stock images, or add bulky dependencies. Lazy-load visuals and provide a readable fallback.
- **Clickable actions** such as Go to Design, Open Pixel Fittings, Select Gear, Open Library, Open Print Centre must use actual existing Studio/navigation APIs, preserve unsaved changes and active model, and never silently overwrite data. If a destination is unavailable, show honest instructions or a disabled option explaining why. Include search/category filters and accessible navigation.
- Clearly distinguish **implemented and independently verified**, **partial/experimental**, and **not available**; do not portray a visual wire guide as an exported physical channel, or unverified Cura/print fit as certified.
- Support light/dark, mobile/tablet, keyboard Tab/Enter/Escape, focus management, good contrast, reduced-motion fallback and no unnecessary geometry creation on opening.

## Single-source release history

`CHANGELOG.md` is the authoritative chronological human-facing changelog. It has a **draft / unreleased section** for PR #102. The app currently embeds a second changelog directly in `index.html`; implement an inexpensive **shared release/feature manifest** or deterministic generation so the catalogue, What's New tab and app's displayed version cannot drift away from the changelog. No GitHub API or external service required, because this is a static site. A draft feature must **not** appear shipped on the live `main` website. Include practical recent updates, working Go-to-feature actions and a way to browse older history without dumping it all on initial open. Document a cheap, repeatable maintenance step.

## Required acceptance (before UX-01 VERIFIED)

1. Real Chromium: open What's New, switch Help/Features/Changelog, search/filter, close/reopen and exercise at least one valid action in Design, Build, Library and Print Centre and all seven model families.
2. Real state preservation: catalogue navigation must not silently change editable models, project data or unsaved settings; unsupported actions explain why.
3. Keyboard/focus/mobile/light/dark plus representative graphics load with no console errors or missing assets; correct feature IDs/routes verified against actual code.
4. Release/source parity test checks `CHANGELOG.md`, feature/release manifest, in-app What's New and displayed version; labels unmerged PR-only changes as **unreleased**.
5. Existing Help, browser exports, physical manufacturing acceptance and owner-only Cura/printed proof #10 remain unaffected. Capture screenshots, actual tests and exact SHA in UX-01 row.

**Avoid wasting tokens:** reuse existing styles/modal/navigation; make autonomous design choices without owner interview. Complete P0 physical work first.

## Release history maintenance

Edit CHANGELOG.md and run `npm run release:metadata` to update the generated version and release history in index.html. The release metadata test checks for drift. Feature names, availability and routes live in studio-features.js. Local Chromium screenshots are saved under qa/ and uploaded by the browser workflow.
