# 01 — Current state of the three codebases

## Repo layout (observed)

| Repo                   | Webroot              | Mission subfolder   | Support                                              |
| ---------------------- | -------------------- | ------------------- | ---------------------------------------------------- |
| `Apollo_11`            | `_website/_webroot/` | `11/`               | `scripts/` (Python build), `support/` (OCR, social)  |
| `Apollo_13`            | `_website/_webroot/` | `13/`               | `scripts/` (Python build), `support/` (assets, docs) |
| `Apollo17.org`         | `_Website/_webroot/` | `17/`               | `Processing_Scripts/` (Python build)                 |
| `apolloinrealtime.org` | `_website/_webroot/` | — landing page only | none                                                 |

Production maps each `_webroot/{N}/` to `apolloinrealtime.org/{N}/`, and the
landing repo to `apolloinrealtime.org/`.

## Per-mission webroot (the runtime app)

Each mission folder is a self-contained static app. Top-level files:

```
ajax.js          (~480-580 lines)  — XHR / CSV loaders
index.html       (~28-45 KB)       — markup + script tags
index.js         (~2,580-2,670 lines) — main app, globals, control flow
navigator.js     (~1,240-1,340 lines) — Paper.js mission timeline canvas
styles.css       (~2,470-2,690 lines)
TOC.html         (~60-90 KB)        — embedded "table of contents" page
navigator_dev.{html,js}             — dev harness for the navigator
privacy.html, robots.txt
favicons/, img/, lib/, indexes/
mobile/          — separate stripped-down site (A11 + A13 only)
MOCRviz/         — A11 (12 MB) and A13 (6 MB), missing from A17
spacecraft_dev/  — A13 only
nominee/         — A17 only (Webby submission?)
```

### `lib/` (third-party, mostly identical across all three)

- jQuery 2.1.4 (full + min)
- Paper.js (full + min)
- jQuery plugins: `lazyload`, `waitforimages`, `fullscreen`, `browser` (11/13)
- jQuery Modal 0.9.1 (A13 only — newer)
- `date.js`, `modemizr.js` (sic), `webfontloader.js`, `entypo.min.css`,
  `layout-default-latest.css`
- Local utilities: `size_manager.js`, `help_overlay_manager.js`,
  `jquery_plugins.js`
- A13's `lib/` is the most evolved; A17's is the smallest

### `indexes/` (CSV data, per-mission)

Shared across all three:

```
commentaryData.csv     missionStagesData.csv  TOCData.csv
crewStatusData.csv     orbitData.csv          utteranceData.csv
photoData.csv          telemetryData.csv      videoSegmentData.csv
videoURLData.csv
```

Only on lunar-landing missions (A11, A17):

```
geoData.csv  geoCompendiumData.csv  paperData.csv  geosampledetails/
```

Only on A17:

```
AV_index.csv  heartrates_{CDR,LMP}.csv  metrates_{CDR,LMP}.csv
```

Not on A13: any geology/EVA data (no lunar landing).

### Approximate asset weight per mission

| Mission | lib    | indexes | img    | mobile | MOCRviz | other                                 |
| ------- | ------ | ------- | ------ | ------ | ------- | ------------------------------------- |
| A11     | 1.2 MB | 2.5 MB  | 11 MB  | 3.4 MB | 12 MB   | favicons 478 KB                       |
| A13     | 1.2 MB | 2.5 MB  | 2.9 MB | 3.4 MB | 6.1 MB  | favicons 565 KB, spacecraft_dev 28 KB |
| A17     | 828 KB | 5.8 MB  | 7.5 MB | —      | —       | nominee 340 KB                        |

Media (audio, video, hi-res images) is **not** in the repo — it's served from
`https://media.apolloinrealtime.org/A{N}` (formerly KeyCDN-backed; **KeyCDN
is being dropped** — see 04). The CSVs are
basically time-indexed pointers into that CDN.

## Per-mission code style (observed in index.js)

- Top of file is a wall of `var` globals: `gMediaList`, `gTOCData`, `gUtteranceData`, `gPhotoData`, `gPlaybackState`, `gCurrMissionTime`, …
- Mission-specific constants near the top: `cMediaCdnRoot`, `cMissionDurationSeconds`, `cCountdownSeconds`, `cLaunchDate`, `cRedactedChannelsArray`, etc.
- A mobile-detect block redirects `/Android|iPhone|…/` to `./mobile/`.
- YouTube iframe API is loaded twice (once in `<head>`, once injected by index.js — looks like a leftover).
- No build step. All `.js` files are served raw and rely on global side-effects + load order in `index.html`.
- jQuery `$(document).ready` style throughout.

## Python build pipeline (out-of-band, not user-facing)

Lives in each repo's `scripts/` (A11/A13) or `Processing_Scripts/` (A17).
Examples of what it does:

- Scrape AFJ (Apollo Flight Journal) and ALSJ (Apollo Lunar Surface Journal) for commentary, photos, geology samples
- Clean and merge mission-control / onboard / PAO transcripts (TEC files)
- Whisper / WhisperX transcription of audio tapes
- Generate audio waveform JSON (`write_audiowaveform_*.py`)
- Write the per-mission `indexes/*.csv` consumed by the runtime
- Convert Zulu ↔ GET (Ground Elapsed Time)

These are batch tools the author runs locally; they output static CSVs that get
checked into the webroot. They are **not** part of the live website.

## Drift between the three codebases

Even though A11 was forked from A17 and A13 from A11, the runtime files have
diverged substantially:

| Pair     | index.html | index.js | ajax.js | navigator.js | styles.css |
| -------- | ---------- | -------- | ------- | ------------ | ---------- |
| 11 vs 13 | 1,667      | 1,104    | 966     | 485          | 316        |
| 11 vs 17 | 1,512      | 1,526    | 240     | 1,121        | 771        |
| 13 vs 17 | 603        | 2,056    | 1,058   | 1,422        | 803        |

(numbers = lines that differ in a plain `diff`)

So: a naive "diff the three and extract common parts" will not produce a clean
shared core. The consolidation needs to be done by **re-deriving** the shared
core from one canonical base and re-applying the per-mission differences as
data + config, not as forked code.
