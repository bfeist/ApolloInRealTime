# 03 — Architecture options

## Option A — Vanilla + ESM + Vite + **TypeScript** (CHOSEN)

### Shape

- Vite dev server + `vite build` producing static assets per mission route.
- Source in `src/` as **TypeScript** ES modules. One entry per HTML page.
- Routing via the URL path (`/11`, `/13`, `/17`) — Vite multi-page build, or a
  single-page shell that reads the first path segment and loads a mission
  config module.
- **No jQuery.** It is ripped out and replaced by a small typed `src/dom/`
  helper module (`qs`, `qsa`, `on`, `html` tagged-template, `addClass`/etc.).
  This is a few dozen lines and removes a 2015-era black box.
- **Paper.js stays, vendored + pinned.** It's the navigator engine; it works,
  so it ships untouched. Not tracked for upgrades.
- DOM-update code stays imperative. Where re-render gets gnarly (transcript
  panels, photo grid), use the hand-rolled `html` tagged-template helper in
  `src/dom/` — no framework, no runtime dependency. **Not** React.
- Per-mission CSS via CSS custom properties + a mission body class
  (`<body data-mission="13">`). One stylesheet, scoped overrides per mission.
- `import.meta.glob('./missions/*.config.ts')` to enumerate missions at build
  time — adding A16 is a single typed file drop.
- **TypeScript is build-time only.** It compiles to plain JS in the bundle;
  nothing TS-related ships. Strict mode on; mission config and CSV rows are
  typed contracts so future-mission mistakes are caught at compile time.

### Pros

- **Closest path from the current code.** The author can lift `index.js`
  into a `.ts` module (loose types first), then incrementally extract and
  tighten. Each extraction is independently testable with Vitest.
- **No framework lock-in.** The Paper.js navigator, the YouTube player
  wrapper, and the audio scheduler are all imperative state machines that
  React would fight, not help.
- **Zero runtime dependencies once jQuery is gone** (Paper.js vendored).
  Smallest, most durable shippable surface — aligns with the 15-year
  longevity goal.
- **No re-render correctness traps** for the timeline scrubber and the
  per-second clock tick. The current app updates the DOM many times/sec in
  some panels; React would force us into refs everywhere.
- **TypeScript** catches the class of bugs most likely in this rewrite:
  mis-typed CSV columns, missing mission-config fields, GET/seconds
  confusion. Pays for itself immediately given the god-object globals.
- **Vite gives us:** dead-code elimination, fast HMR for dev, fingerprinted
  asset URLs (cache-bust without query strings), per-page chunks, modern JS
  with legacy fallbacks via `@vitejs/plugin-legacy` if needed.

### Cons / costs (accepted)

- Ripping out jQuery is real work spread across Phases 3–5 (not a one-shot).
  Mitigated by the `src/dom/` shim absorbing the common call sites.
- Typing the ~30+ `g*` globals as they're modularized is tedious but is
  exactly the work that makes the consolidation safe.
- Author works in React day-to-day; vanilla typed DOM will feel slow at
  first. Offset by the lift-and-shift path and TS autocomplete.

## Option B — React (Vite + React) — REJECTED (kept for the record)

### Shape

- Same Vite setup, but the shell and panels are React components.
- React Router for `/11`, `/13`, `/17`.
- Paper.js navigator wrapped in a `useEffect`-managed canvas component with a
  ref-held instance — imperative inside, declarative outside.
- YouTube player as a wrapper component with an imperative ref.
- Per-mission data loaded via a context provider keyed on the route param.

### Pros

- Matches the author's current skill set.
- Component boundaries naturally encode "which panels does this mission
  have?" (just don't render the geology panel for A13).
- Easier to onboard collaborators in 2026.
- Storybook-able panels, easier visual regression testing.

### Cons

- **Bigger rewrite up-front.** You can't lift the current `index.js` in;
  you're rewriting it. That's the part that takes a year.
- **Imperative engines (Paper.js, YouTube, the per-tick clock) sit
  awkwardly inside React's lifecycle.** Doable, but it's friction on every
  panel.
- Larger bundle, more dependencies to keep patched.
- React's value (composability, ecosystem) is largely wasted on a
  single-screen bespoke UI with no reused components across the app.

## Option C — Mixed: shell in React, engine modules in vanilla — REJECTED

Use React only for layout + dashboards + TOC. Keep Paper.js, YouTube
controller, and audio scheduler as plain ES modules with a small adapter
component.

This is the worst of both worlds for a first version (two paradigms to
maintain), but **may become the right shape later** if collaborators join.
Don't start here.

## Decision (locked)

**Option A — Vanilla + ESM + Vite + TypeScript, jQuery removed.**

Reasons, in priority order:

1. **Longevity.** Shipped output is zero-runtime-dependency static files;
   the toolchain compiles away. This is the property Ben most wants to carry
   forward — the site has run 15 years untouched and should run 15 more.
   React + its ecosystem is the opposite of that bet.
2. The migration path is incremental: lift `index.js` into a `.ts` module,
   then extract pieces. Ship A13 on the new shell quickly, refactor inward.
3. The app is one bespoke screen with imperative engines underneath it.
   React's strengths (reusable composition, declarative state→DOM mapping)
   are not aligned with that.
4. TypeScript gives the safety React-component boundaries would have given,
   without the runtime weight or the lifecycle friction against Paper.js /
   YouTube / the per-tick clock.

React (Option B) was considered and rejected for this project specifically
because its maintenance/upgrade cadence conflicts with the longevity goal.
The analysis is kept below for the record.

## Folder shape (chosen)

```
AiRT2/
  index.html                  (landing page, replaces apolloinrealtime.org)
  vite.config.ts
  tsconfig.json
  package.json
  .nvmrc                      (pin Node version for reproducible rebuilds)
  vitest.config.ts
  src/
    main.ts                   (mission router)
    dom/
      index.ts                (typed jQuery replacement: qs/qsa/on/html/...)
    shell/
      layout.ts               (header, monitor wrappers, dashboard frame)
      clock.ts                (GET <-> Zulu, per-tick scheduler)
      router.ts               (path -> mission config)
    engines/
      navigator/              (Paper.js timeline; Paper.js vendored + pinned)
      ytplayer/               (YouTube iframe wrapper)
      audio/                  (air-to-ground scheduler)
    panels/
      toc.ts
      transcript.ts
      commentary.ts
      photos.ts
      telemetry.ts
      crewStatus.ts
      geology.ts              (mounted only if mission.features.geology)
      heartrates.ts           (mounted only if mission.features.heartrates)
      mocrviz/                (mounted only if mission.features.mocrviz)
    data/
      csvLoader.ts            (parse + index a CSV by GET seconds, typed rows)
      mediaResolver.ts        (mission media root -> media URLs)
    types/
      mission.ts              (MissionConfig type)
      csv.ts                  (row types per CSV file)
    missions/
      11.config.ts
      13.config.ts
      17.config.ts
    styles/
      base.css
      panels/*.css
      missions/{11,13,17}.css (just CSS vars + overrides)
    vendor/
      paper/                  (pinned Paper.js copy; not npm-tracked)
  public/
    11/{indexes,img,favicons,...}   (per-mission static, served as-is)
    13/{indexes,img,favicons,...}
    17/{indexes,img,favicons,...}
  tests/
    unit/                     (Vitest: clock, csvLoader, mediaResolver)
    browser/                  (Vitest browser mode / Playwright component)
    visual/baseline/          (Playwright production screenshots)
  pipeline/                   (new uv + Python 3 data ingestion; see 04)
```

### Toolchain pinning (longevity)

- `.nvmrc` + exact (non-caret) versions in `package.json` + committed
  lockfile → any future rebuild is byte-reproducible.
- Dev dependencies may rot; the live site does not care because it is static
  output. We rebuild only when _we choose to make a change_, never on a
  dependency's schedule.
- `src/vendor/paper/` holds the pinned Paper.js. No `paper` npm dep tracked
  for upgrades.
