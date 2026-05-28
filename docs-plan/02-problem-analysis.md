# 02 — Problem analysis

## What's actually shared vs. what's per-mission

Looking past the textual drift, the **conceptual surface** of all three apps is
the same. The split is roughly:

### Shared (should live in a single core)

- The page layout: header / navigator monitor / video monitor / dashboard / TOC
- Mission clock + GET (Ground Elapsed Time) machinery
- Time-indexed lookup over CSV data (`gXxxIndex` + `gXxxDataLookup` pattern)
- The Paper.js navigator timeline (segments, scrubbing, hover)
- YouTube player wrapper + transport controls
- Air-to-ground audio playback (channel selector, redacted-channel mask)
- Onboard transcript / commentary / utterance panels
- TOC view + deep-link `?t=GET` URL handling
- Help overlay, size manager, font loader, modal
- Photo panel + lazyload
- Telemetry / crew status / mission-stage panels

### Per-mission (should be **data + config**, not code)

- Mission identity: name, patch, subtitle, dates
- `cMediaCdnRoot` (e.g. `…/A11`, `…/A13`, `…/A17`)
- `cMissionDurationSeconds`, `cCountdownSeconds`, `cDefaultStartTimeId`
- `cLaunchDate`, `cCountdownStartDate`
- `cRedactedChannelsArray` and the air-to-ground channel list
- Which optional panels apply (geology / paper / heartrate are A11/A17 only)
- Mission-specific colors, fonts, background images
- The `indexes/*.csv` files themselves
- Mission-specific copy on the splash screen
- LRO overlays, MOCRviz, graph overlays — present on some missions only

### Actually divergent code (the hard part)

Some logic legitimately differs and was bolted on per mission:

- A13 has the `spacecraft_dev/` view (post-explosion telemetry?)
- A11 and A13 have `MOCRviz/` (Mission Control Operations Room visualization)
- A17 has the heartrate/metrate charts and AV_index
- The "mobile" site is a parallel stripped-down build on A11 and A13 only
- A13 added jquery-modal for some interaction the other two don't use
- Channel masking, video segment overlay rules, LRO overlay timing — all
  carry mission-specific magic numbers

These need to be modeled as **optional feature modules** that the shell mounts
when the mission config enables them.

## The real consolidation problem

It is **not** "three apps that need to be merged." It is:

> One app that was forked twice over a decade, with per-mission features
> accreted onto each fork, and with no shared abstraction layer — because there
> was never a second consumer to motivate one.

So the work is:

1. **Pick the canonical fork** (recommend A13 — most recent activity, has
   modal, newest ajax/nav, Oct/Nov 2025 commits).
2. **Reverse-engineer the implicit config surface** from the constants and
   conditionals scattered through the other two forks.
3. **Refactor the canonical fork into shell + mission-data**, breaking the
   global-variable god-object into modules with explicit imports.
4. **Re-validate** by booting all three missions against the new shell and
   diffing the rendered UI against the production sites.
5. **Add optional feature modules** (geology, heartrate, MOCRviz) that mount
   only when the mission config enables them.

## Constraints worth naming up front

- **URL stability matters.** Every Reddit/Wikipedia/Google link to
  `apolloinrealtime.org/13/?t=055:55:35` (or whatever the param is) must
  keep working byte-for-byte.
- **SEO and share previews matter.** The og:image / og:description per mission
  must be preserved.
- **No server.** Production is a static host. Anything we build must
  pre-render or be SPA-fine for crawlers.
- **YouTube is external** and the media host (`media.apolloinrealtime.org`)
  is assumed brittle. We don't control YouTube; the player and the
  CSV-pointed media URLs must tolerate failure. (KeyCDN is being removed —
  see 04; media resolves to `media.apolloinrealtime.org` directly.)
- **Author has limited bandwidth.** A clever rewrite that takes a year is
  worse than a pragmatic refactor that ships in stages.
- **Author writes React day-to-day but chose vanilla + TypeScript here**
  specifically for longevity (see 00 and 03).
