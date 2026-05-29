# Phase 6: Legacy Shell Analysis for TypeScript+Vite Port

**Analysis Date**: May 2026  
**Scope**: Apollo 11, 13, and 17 legacy shells (byte-for-byte baseline comparison)  
**Goal**: Inform typed shell template architecture for next-phase implementation

---

## 1. Shared DOM Skeleton

All three missions use an identical DOM structure with minimal per-mission variation. Below is the shared baseline organized by functional role.

### Header Section
- `.header-wrapper` (flex row)
  - `.logo-wrapper` — Mission patch background image; mission-specific
  - `.info-wrapper` → `.content`
    - `.pre-title` — "The [Mission Description]"
    - `.title` — "Apollo [11/13/17]"
    - `.subtitle` — "Real-Time Mission Experience"
    - `.historicalDate.date` — Current date simulation
    - `.historicalTime.time` — Current time simulation
    - `#missionTime` `.GETWrapper` with `#missionElapsedTime` input + `#GETBtn`
  - `.navigator-wrapper.monitor`
    - `#navigator.navigator` → `#navCanvas` (Paper.js canvas)

### Video Block
- `.video-block`
  - `.monitor.video-monitor`
    - `.video-wrapper`
      - `img.aspect-holder` — 4:3 placeholder
      - `.player-wrapper`
        - `#LRO-overlay` — Lunar Recon Orbiter metadata/link
        - `.search-overlay` → search input + `#searchResultsTable`
        - `.dashboard-overlay` → mission telemetry display (`#dashboardContent`)
        - `#player-iframe-wrapper` → `#player` — YouTube iframe inserted here
  - `.tabs-wrapper`
    - `.button-row` → `#transcriptTab`, `#tocTab`, `#commentaryTab` (content-tab class)
    - `.button-row-small-container`
      - `.button-row.small` → `#searchBtn`, `#realtimeBtn`, `#aboutBtn`
      - `.button-row.small` → `#dashboardBtn`, `#soundBtn`, `.fullscreenBtn`
    - `.button-row-medium-container`
      - `.button-row.medium` → `#shareBtn`, `#playPauseBtn`
  - `.monitor.output` (SizeManager)
    - `.output-wrapper`
      - `#transcriptWrapper.text-wrapper` → `#utteranceTable.utteranceTable`
      - `#tocWrapper.text-wrapper` → `#iFrameTOC` (iframe to TOC.html)
      - `#commentaryWrapper.text-wrapper` → `#commentaryTable.commentaryTable`

### Mission Control Channels (Thirtytrack)
- `.thirtytrack-block`
  - `#thirtytrack-title` — "Mission Control Channels"
  - `#thirtytrack-container` — scrollable grid of 44 channel buttons
    - `.buttondiv` × 44 → `.thirtybtn-channel#btn-ch[2–59]` (e.g., CAPCOM, FIDO, GUIDO)
    - MOCRviz iframe overlays channel to `.thirtytrack-overlay`

### Photo/App Gallery (Mission-Variant)
**A11 & A13**: `.app-with-tabs-block`
- `.app-tabs` → `.app-button-row`
  - `#photoTab` (selected by default)
  - `#mocrTab`
  - `#geosampleTab` (A11 only)
  - `#spacecraftTab` (A13 only)
- `.app-block`
  - `.app-wrapper`
    - `#photoGallery` — thumbnail carousel (lazy-loaded)
    - `#photodiv` — main photo display
    - `#geosample-overlay` → mission geology sample metadata
    - `#thirtytrackplaceholder` — MOCR audio iframe mount

**A17**: `.photo-block` (alternative layout)
- `.monitor.photo-wrapper` (SizeManager)
  - `.photos-wrapper`
    - `#photoGallery`
    - `.geosample-overlay` (class, not id)
    - `#photodiv`

### Splash Screen (Landing)
- `.splash-content`
  - `.about`
    - `.content-wrapper` → `.patch` (mission insignia), `.patch-right` (title/headings)
  - `.actions`
    - `.section` buttons: T-MINUS 1M, NOW, Fullscreen
    - Mission stats list
    - Forum link

### Help / Instructions Overlay
- `.help-content`
  - `.help-overlay.body` (main help page)
    - `.content-wrapper` → `.headline`, `.quote`, `.credits`
    - Crew quotes, credits, thanks sections
  - `.help-overlay.navigator` (A17: navigator legend)
  - `.help-overlay.legend` (A17: mission navigator color codes)

### Share Modal
- `#shareModal.modal`
  - `.shareModalWrapper`
    - Copy-to-clipboard textareas for website and moment URLs

---

## 2. Per-Mission Differences

### Meta & Identity
| Aspect | A11 | A13 | A17 |
|--------|-----|-----|-----|
| `<title>` | Apollo 11 in Real Time | Apollo 13 in Real Time | Apollo 17 in Real-time |
| `og:title` | Apollo 11 in Real Time | Apollo 13 in Real Time | Apollo 17 in Real Time |
| `og:image` | `/11/img/screenshot.png` | `/13/img/13home_screengrab.jpg` | `/17/img/17home_screengrab.jpg` |
| Logo image | `Apollo_11-insignia100.png` | `Apollo_13-insignia100.png` | `Apollo_17-insignia100.png` |
| Favicon | All custom per-mission | All custom per-mission | All custom per-mission |

### Pre-Title & Mission Duration
| Item | A11 | A13 | A17 |
|------|-----|-----|-----|
| `.pre-title` | The First Landing on the Moon | The Third Lunar Landing Attempt | The Last Landing on The Moon |
| Dashboard `/[N]` | `/9` (9-day mission) | `/7` (7-day mission) | `/13` (13-day mission) |
| Historical subtext | 56 years ago | ~55 years ago | 53 years ago |

### Panel Composition
- **A11**: `#photoTab`, `#mocrTab`, `#geosampleTab` (astromaterials sample database)
- **A13**: `#photoTab`, `#mocrTab`, `#spacecraftTab` (Apollo 13 Odyssey/Aquarius info)
- **A17**: No app tabs; uses `.photo-block` layout with `.photos-wrapper` instead; no separate MOCR panel

### Dashboard Metrics (A17-specific)
- **A17 only**: Biometric data row at bottom-right of `#dashboardContent`:
  ```
  Cernan: [heart rate] bpm / [metabolic rate] btu/hr
  Schmitt: [heart rate] bpm / [metabolic rate] btu/hr
  ```
- **A13 only**: Frame-of-reference selector spans for velocity/distance

### Photo Gallery Styling
- **A11/A13**: `.imageBlock` with `.imageContainer`, `.aspect-holder`, gallery on right
- **A17**: Uses `.photos-wrapper` inside `.photo-wrapper.monitor` with different flex layout

### Navigator Legend (A17-only)
```html
<div class="help-overlay legend">
  Legend entries: brown (POI), green (photo), blue/grey/darkgrey (speech), video/3D
</div>
<div class="help-overlay navigator">
  Three-tier zoom explanation with visual bars
</div>
```

### Landing Page Image
- **A11/A13**: `background-image: url("img/bg_panorama_alt.jpg")`
- **A17**: `background-image: url("img/bg_panorama.jpg")`

---

## 3. CSS Architecture

### Line Counts & Organization
- **A11**: 2,531 lines
- **A13**: 2,691 lines (slightly heavier with more variable states)
- **A17**: 2,474 lines (leaner, consolidated hover states)

All three use identical selector patterns and inheritance hierarchy.

### Top-Level Selectors (Top 40 by functional importance)

**Core Layout**
```
section.app, .header-wrapper, .info-wrapper, .navigator-wrapper
.video-block, .thirtytrack-block, .app-with-tabs-block, .photo-block
.video-monitor, .player-wrapper, #player, #navCanvas
.monitor, .tabs-wrapper, .output-wrapper, .button-row
```

**Transcript / Commentary / TOC**
```
.utteranceTable, .commentaryTable, .TOC_container
tr.utterance, tr.commentary, #utteranceDiv, #commentaryDiv
.utt_pao, .utt_capcom, .utt_crew, .utt_mocr (A17-only)
.com_support, .com_crew
.spokenwords, .timestamp, .who, .attribution
ul.TOC1, ul.TOC2, ul.TOC3, .TOC_item
```

**Photo Gallery**
```
#photoGallery, #photodiv, .imageBlock, .imageContainer
.imageOverlay, .galleryItemContainer, .galleryImage, .galleryOverlay
.photodivcaption, .photoTable, .geosample-overlay
#geosampleTable, .sampleframe, .sampletitle
```

**Buttons & Controls**
```
.splash-btn, .splash-btn.primary, .splash-btn.subdued, .splash-btn.activated
.button-row, .button-row.small, .button-row.medium
.button-row-small-container, .button-row-medium-container
.thirtybtn-channel, .thirtybtn-active, .thirtybtn-selected
#searchBtn, #playPauseBtn, #soundBtn, #dashboardBtn, .fullscreenBtn, #shareBtn
```

**Overlays & Modals**
```
.splash-content, .help-content, .help-overlay, .help-overlay.body
.help-overlay.legend, .help-overlay.navigator
.search-overlay, .dashboard-overlay, .thirtytrack-overlay
.geosample-overlay, #shareModal, .shareModalWrapper
.close-btn
```

**Scrollbars & UI Polish**
```
::-webkit-scrollbar, ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-track
#navigatorKey, .close-btn
```

### Common Color Tokens (with CSS variable proposals)

| Hex | Current Usage | Proposed CSS Var | Intent |
|-----|---|---|---|
| `#000000` | Primary dark bg, text | `--airt-bg-primary` | Deep black for text contrast |
| `#0a0a0a`, `#0f0f0f` | Alternate rows, subtle | `--airt-bg-alternate` | Striping in tables |
| `#1e1e1e`, `#222222` | Hover backgrounds | `--airt-bg-hover` | Interactive highlight |
| `#161819` | Gradient start (bg:before) | `--airt-gradient-start` | Background gradient |
| `#2d3033` | Gradient mid | `--airt-gradient-mid` | Background gradient |
| `#080b0c` | Gradient end | `--airt-gradient-end` | Background gradient |
| `#444444` | Borders, dividers | `--airt-border-subtle` | Low-contrast outline |
| `#535353`, `#595959` | Disabled text | `--airt-text-disabled` | Muted content |
| `#84b8d9` | Crew/section headers | `--airt-accent-blue-primary` | Crew dialogue color |
| `#5e92a6` | Dark blue headers | `--airt-accent-blue-dark` | Section headers, footer |
| `#7bbfd8` | Blue hover state | `--airt-accent-blue-light` | Interactive hover |
| `#999999`, `#bbbbbb` | Main body text | `--airt-text-primary`, `--airt-text-secondary` | Readable body copy |
| `#215160`, `#d7a06c` | *Not found* | | (Possibly obsolete) |
| `#ffc688` | Orange/accent button | `--airt-accent-orange-light` | Primary CTA hover |
| `#d7a06c` | Orange base | `--airt-accent-orange-dark` | Primary button state |

### Responsive Breakpoints

```css
@media only screen and (min-width: 768px) and (max-width: 1279px)
  /* Help content font-size: 15px (down from 16px) */

@media only screen and (min-width: 1660px)
  /* Help content font-size: 19px or 24px (scale up) */
```

No mobile-first or tablets breakpoints; layout is generally desktop-centric with flex fallbacks.

### Font Stack

**Primary**: `"Michroma", sans-serif` — mission title, splash buttons, headlines  
**Secondary**: `"Oswald", sans-serif` — info wrapper (date/time), button labels  
**Monospace**: `"Roboto Mono", sans-serif` — transcript, commentary, code-like content  
**Fallback**: `"Roboto", sans-serif`, `"Roboto Slab"` (A17) — credits, descriptions  
**Serif**: (none; all sans)

WebFont loader references external fonts via `lib/webfontloader.js`.

### Z-Index Layers
```
.isloading-overlay:       9000
.thirtytrack-overlay:    1000
#shareModal, .modal:      (default/auto)
.close-btn, overlays:        2
section.app:           0 (fixed, static)
```

---

## 4. Per-Mission CSS Deltas

### Apollo 11 (public/11/styles.css)

**Unique Rules**:
```css
/* Apollo 11 logo patch override */
.splash-content .patch {
  background-image: url("img/Apollo_11_insignia_200.png");
}
.logo-wrapper {
  background-image: url("img/Apollo_11-insignia100.png");
}

/* Badge row uses A11 insignia */
.badge-row {
  background-image: url("img/Apollo_11-insignia100.png");
}

/* Gallery colors (green) */
.galleryItemContainer.selected, .galleryItemContainer:hover {
  border: 1px solid green;
}
.galleryItemContainer.selected .galleryOverlay,
.galleryItemContainer:hover .galleryOverlay {
  background-color: darkgreen;
}

/* A11-specific scrollbar color override */
#photoGallery::-webkit-scrollbar-thumb {
  border: 1px solid green;
}
```

**Line Count Estimate**: ~40 lines unique; ~2,490 shared

---

### Apollo 13 (public/13/styles.css)

**Unique Rules**:
```css
/* Apollo 13 logo patch */
.splash-content .patch {
  background-image: url("img/Apollo_13-insignia200.png");
}
.logo-wrapper {
  background-image: url("img/Apollo_13-insignia100.png");
}

/* Splash panorama alt background */
.splash-content:before {
  background-image: url("img/bg_panorama_alt.jpg");
  background-position: center bottom;
}

/* Transcript hover state (lighter) */
tr.utterance:hover, tr.commentary:hover {
  background-color: #1e1e1e;  /* A13 uses #1e1e1e; others may use #222222 */
}

/* Additional MOCR transcript color (new speaker type) */
.utt_mocr {
  color: #b86c75;  /* A13-specific speaker class not in A11 */
}

/* Frame-of-reference spans for dashboard */
#frameOfReferenceVelocitySpan, #frameOfReferenceDistanceSpan {
  /* styled inline in HTML; no CSS rule needed */
}

/* Scrollbar (same as base, not overridden) */
```

**Line Count Estimate**: ~60 lines unique; ~2,630 shared

---

### Apollo 17 (public/17/styles.css)

**Unique Rules**:
```css
/* Apollo 17 logo patch */
.splash-content .patch {
  background-image: url("img/Apollo_17_insignia_200.png");
}
.logo-wrapper {
  background-image: url("img/Apollo_17-insignia100.png");
}

/* Alternative layout: photo-block instead of app-with-tabs-block */
.photo-block {
  float: left;
  /* width: 60% set by jQuery */
}
.photos-wrapper {
  height: 100%;
  /* used in place of .app-wrapper for A17 */
}

/* Gallery image sizing (A17-specific) */
.galleryImage {
  width: auto;        /* A17: auto; A11/A13: 100% max-height */
  max-width: 100%;
  height: 100%;
  border: 10px solid transparent;
}

/* Legend overlay (A17-only) */
.help-overlay.legend {
  font-family: "Roboto Slab";
  /* ... complete legend styling */
}
.help-overlay.navigator {
  /* ... navigator zoom level illustration */
}

/* Hover backgrounds slightly lighter in A17 */
tr.utterance:hover, tr.commentary:hover {
  background-color: #222222;  /* A17: #222222; A13: #1e1e1e */
}
ul.TOC1 li:hover, ul.TOC2 li:hover, ul.TOC3 li:hover {
  background-color: #222222;  /* A17 darker */
}

/* Image overlay background */
#imageOverlay {
  background-color: #222222;  /* A17: #222222; others: #1e1e1e */
}

/* Gallery overlay background */
.galleryOverlay {
  background-color: #222222;  /* A17: #222222; others: #1e1e1e */
}

/* Help overlay quote styling (different fonts) */
.help-overlay.body .quote {
  font-family: "Roboto Slab";  /* A17: different from A11/A13 */
}

/* Biometric data (A17 mission-specific) */
/* No CSS rule; inline style in HTML */

/* A17 splash content background */
.splash-content:before {
  background-image: url("img/bg_panorama.jpg");
  background-position: left top;  /* A17: left top; A13: center bottom */
}

/* Logo hover (A17 uses external URL) */
.logo-wrapper:hover {
  background-image: url("https://apolloinrealtime.org/img/apollo_program_patch_100.png");
}
```

**Line Count Estimate**: ~70 lines unique; ~2,404 shared

---

## 5. JS-Managed DOM Mutations

### Primary Mutation Points (from public/13/index.js)

1. **Body State Classes**
   ```javascript
   $("body").addClass("splash-loaded")   // Show splash screen
   $("body").addClass("app-ready")       // Show app UI after font load
   $("body").removeClass("splash-loaded") // Transition to app
   ```

2. **Tab State Management**
   ```javascript
   $tab.addClass("blink_me")              // Highlight urgent tab
   $tab.removeClass("blink_me")           // Clear highlight
   
   /* Tabs: #transcriptTab, #tocTab, #commentaryTab */
   ```

3. **Play/Pause Button**
   ```javascript
   playPauseBtn.addClass("pause")         // Show pause icon (playing)
   playPauseBtn.removeClass("pause")      // Show play icon (paused)
   
   playPauseBtn.addClass("blink_me_orange")   // Highlight when recording starts
   playPauseBtn.removeClass("blink_me_orange")
   ```

4. **Sound Button**
   ```javascript
   soundBtn.removeClass("mute")  // Mute icon off
   soundBtn.addClass("mute")     // Mute icon on
   ```

5. **Transcript Table Population**
   ```javascript
   utteranceTable.html("")                    // Clear
   utteranceTable.append(getUtteranceObjectHTML(i))  // Append rows
   /* Also: prependTranscript(), appendUtterances() for virtual scroll */
   ```

6. **Commentary Table Population**
   ```javascript
   commentaryTable.html("")
   appendCommentary(appendCount)
   prependCommentary(prependCount)
   ```

7. **Photo Gallery**
   ```javascript
   /* #photoGallery: thumbnail injection via lazy-load */
   /* #photodiv: main image display (background-image set via inline style) */
   ```

8. **Player Injection**
   ```javascript
   /* #player or #player-iframe-wrapper: YouTube API replaces element with iframe */
   ```

9. **Overlay Content**
   ```javascript
   /* #searchResultsTable: search results injected */
   /* #dashboardContent: mission telemetry populated */
   /* #geosampleTable: geology sample metadata */
   ```

### Template-Based Rendering

Templates (in `<script type="text/html" id="[name]Template">`) used for:
- `#photoTemplate` → `.imageBlock`
- `#utteranceTemplate` → transcript row
- `#commentaryTemplate` → commentary row
- `#photoGalleryTemplate` → gallery thumbnail
- `#searchResultTemplate` → search result
- `#geosampleTemplate` → geology sample card
- `#geosampleSplashTemplate` → geology intro
- `#spacecraftDescription` (A13) → spacecraft info
- `#MOCROverlayTemplate` → MOCR iframe wrapper

---

## 6. Proposed Phase 6 Shell HTML Structure

The next agent should generate a typed shell component producing this structure. Suggestions:

```typescript
// src/app/shell.ts
interface MissionConfig {
  missionNumber: 11 | 13 | 17
  logoPath: string        // e.g., "Apollo_11-insignia100.png"
  preTitle: string
  duration: 9 | 7 | 13    // Days
  historicalYearsAgo: number
  hasGeosamplePanel?: boolean  // A11 only
  hasSpacecraftPanel?: boolean // A13 only
  photoLayout: 'app-with-tabs' | 'photo-block'  // A17 variant
  includeBiometrics?: boolean  // A17 only
  includeLegendOverlay?: boolean  // A17 only
}

export function renderShell(config: MissionConfig): string {
  return `
    <section class="app">
      ${renderHeader(config)}
      <div class="body">
        ${renderVideoBlock(config)}
        ${renderThirtyttrackBlock(config)}
        ${renderPhotoBlock(config)}
      </div>
    </section>
    ${renderSplashContent(config)}
    ${renderHelpContent(config)}
    ${renderShareModal()}
    ${renderTemplates()}
  `
}

interface HeaderProps extends MissionConfig {
  
}

function renderHeader(config: MissionConfig): string {
  return `
    <header>
      <div class="header-wrapper">
        <div class="logo-wrapper" onclick="goToURL('/')"></div>
        <div class="info-wrapper">
          <div class="content">
            <div class="pre-title">${config.preTitle}</div>
            <div class="title">Apollo ${config.missionNumber}</div>
            <div class="subtitle">Real-Time Mission Experience</div>
            <div class="historicalDate date">Thu Dec 07 1972</div>
            <div class="historicalTime time">12:32:00 AM</div>
            <div class="GETWrapper" id="missionTime" style="display: flex;">
              <div style="flex: 1;">Ground Elapsed Time (GET):</div>
              <div style="flex: 1;">
                <input type="text" size="9" id="missionElapsedTime" 
                       name="missionElapsedTime" value="000:00:00" />
              </div>
              <div class="button-row small" style="flex: 1;">
                <a class="splash-btn subdued" id="GETBtn" title="Jump to GET">
                  <span id="GETButtonLabel">GO</span>
                  <span class="sr-only">Jump to Ground Elapsed Time</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="navigator-wrapper monitor">
          <div id="navigator" class="navigator">
            <canvas id="navCanvas" hidpi="off" resize keepalive="true"></canvas>
          </div>
        </div>
      </div>
    </header>
  `
}

function renderVideoBlock(config: MissionConfig): string {
  // Render video player, transcript, TOC, commentary tabs
  // Mount point: #player (YouTube API), #utteranceTable, #commentaryTable, #iFrameTOC
  return `<!-- Typed panel mount: Transcript/TOC/Commentary -->`
}

function renderThittyttrackBlock(): string {
  // 44 channel buttons in flex grid
  // Mount point: #thirtytrack-container
  return `<!-- Typed panel mount: Mission Control Channels -->`
}

function renderPhotoBlock(config: MissionConfig): string {
  if (config.photoLayout === 'photo-block') {
    // A17: simpler photo-only layout
  } else {
    // A11/A13: tabbed photo/mocr/geosample layout
  }
  // Mount points: #photoGallery, #photodiv, #geosampleTable, #iFrameTOC
  return `<!-- Typed panel mount: Photo Gallery / Geology -->`
}
```

**Key mount points the shell must expose**:
- `#player` — YouTube API replacement
- `#utteranceTable` — transcript rows injected
- `#commentaryTable` — commentary rows injected
- `#photodiv` — main photo display (background-image set by JS)
- `#photoGallery` — gallery thumbnail carousel
- `#geosampleTable` — geology samples
- `#iFrameTOC` — Table of Contents iframe
- `#dashboardContent` — mission telemetry
- `#searchResultsTable` — search results
- `#thirtytrack-container` — mission control buttons
- Body state classes: `splash-loaded`, `app-ready`
- Tab classes: `.content-tab` (state-managed)
- Various `#[elementId]` for button event delegation

---

## 7. Proposed CSS File Structure

Recommended organization for `src/styles/` in Vite app:

```
src/styles/
├── base.css                    (2–3KB)
│   └── Global resets, fonts, body/html, z-index scale, responsive base
│
├── tokens.css                  (1KB)
│   └── CSS custom properties (--airt-*) for colors, fonts, spacing
│
├── components/
│   ├── buttons.css             (400B)
│   │   └── .splash-btn, .button-row, .thirtybtn-channel styles
│   ├── tabs.css                (300B)
│   │   └── .content-tab, .app-tab, tab state classes
│   ├── overlay.css             (600B)
│   │   └── .help-overlay, .search-overlay, .dashboard-overlay, .thirtytrack-overlay
│   ├── modal.css               (300B)
│   │   └── #shareModal, .close-btn
│   ├── gallery.css             (500B)
│   │   └── .galleryItemContainer, .imageContainer, photo display
│   └── scrollbar.css           (200B)
│       └── ::-webkit-scrollbar-* (all variants)
│
├── layout/
│   ├── header.css              (600B)
│   │   └── .header-wrapper, .logo-wrapper, .info-wrapper, .navigator-wrapper
│   ├── video-block.css         (800B)
│   │   └── .video-block, .player-wrapper, .tabs-wrapper, .output-wrapper
│   ├── thirtytrack.css         (400B)
│   │   └── .thirtytrack-block, channel grid layout
│   ├── photo-block.css         (300B)
│   │   └── .app-with-tabs-block, .photo-block (A17 variant)
│   └── splash.css              (1.2KB)
│       └── .splash-content, .about, .actions, launch buttons
│
├── panels/
│   ├── transcript.css          (600B)
│   │   └── .utteranceTable, tr.utterance, text colors (.utt_pao, .utt_crew, etc.)
│   ├── toc.css                 (400B)
│   │   └── .TOC_container, ul.TOC1/2/3, .TOC_item
│   ├── commentary.css          (400B)
│   │   └── .commentaryTable, tr.commentary, comment styling
│   └── dashboard.css           (300B)
│       └── #dashboardContent, metrics display
│
├── missions/
│   ├── base.css                (2.2KB)
│   │   └── Shared A11/A13/A17 defaults (accents, monochrome scheme)
│   ├── 11.css                  (100B)
│   │   └── Logo image, gallery green accent override only
│   ├── 13.css                  (150B)
│   │   └── Logo image, splash panorama alt, MOCR transcript color
│   └── 17.css                  (200B)
│       └── Logo image, photo-block layout, legend overlay, lighter hovers
│
└── index.css                   (50B)
    └── Import all above in order
```

**Total new structure**: ~12 KB (vs. 2.5 KB per mission in legacy)

**Benefits**:
- Single shared base + component library (no duplication)
- Per-mission CSS reduced to ~100–200 lines each (only visual deltas)
- Easy to theme (token layer)
- BEM-ish naming for clarity
- Easier refactoring (find selectors by file, not line number in 2,600-line monolith)

---

## 8. Open Questions & Risks

### Ambiguities Needing Clarification

1. **A17 Layout Mismatch**: Why does A17 use `.photo-block` instead of `.app-with-tabs-block`?
   - Is this intentional (simplified UX) or legacy quirk?
   - Should typed shell support both, or standardize to one?

2. **Dashboard Mission-Specific Content**: A17 includes biometric heart rate / metabolic rate data.
   - Is this data live-fetched, or static template?
   - Should new shell allow per-mission dashboard slots?

3. **TOC iframe vs. Dynamic Table**: A11/A13 load TOC via `<iframe src="TOC.html">`, but commentary uses `<table>`.
   - Should Phase 6 replace iframe with dynamic component, or preserve iframe pattern?

4. **Scrollbar Customization**: Only `#photoGallery` has override (green border in A11). Why?
   - Should all scrollbars be consistent, or preserve per-mission theming?

5. **Template Injection**: Current JS uses `getUtteranceObjectHTML(i)` to render rows from template.
   - Should typed shell move these to Svelte/Preact components, or keep template approach?

6. **Help Overlay Legend**: A17 alone has navigator legend overlay with color-coded mission elements.
   - Should A11/A13 get this overlay too, or keep A17 as special case?

7. **Splash Panorama Images**: A11/A13 use `bg_panorama_alt.jpg`, A17 uses `bg_panorama.jpg`.
   - Are these pixel-identical, or intentionally different?

### Risks

- **CSS Fragility**: Tight coupling between layout classes and JS selectors (e.g., `.video-block` width hardcoded to 40%).
  - **Mitigation**: Introduce CSS custom properties for layout dimensions; use data-attributes for JS hooks.

- **Template String Injection**: `getUtteranceObjectHTML()` and similar could be XSS vectors if utterances contain HTML.
  - **Mitigation**: Sanitize all utterance text in data layer; use DOM APIs instead of `.html()` for user content.

- **Paper.js Canvas (Navigator)**: Paper.js is heavyweight; A17 ships slightly smaller build (paper-full.js vs. min.js variance).
  - **Mitigation**: Evaluate if Canvas 2D API alone could replace Paper.js; audit bundle impact.

- **YouTube IFrame API**: Global `window.onYouTubeIframeAPIReady` callback; modern bundlers may conflict.
  - **Mitigation**: Isolate API interaction in utility module; mock in tests.

- **Accessibility**: ARIA labels sparse (`sr-only` used only for icon buttons). Overlays not properly marked as `dialog`.
  - **Mitigation**: Add ARIA live regions for transcript updates, `role="dialog"` for overlays, keyboard nav.

- **Mobile Responsiveness**: Layout assumes desktop viewport; no tablet/mobile breakpoints below 768px.
  - **Mitigation**: Add mobile-first media queries; test responsiveness at common breakpoints.

---

## Summary

**Shell is a highly standardized container** with ~95% code reuse across A11/A13/A17. Per-mission deltas are primarily:
- Logo image paths
- Title/subtitle strings
- Dashboard duration (7/9/13 days) and optional biometric data
- Layout variant (A17 photo-block)
- Visual accents (gallery green, hovers, legend overlay)

**Typed implementation should:**
1. Generate a single shared HTML template with `MissionConfig` injection points.
2. Use CSS variables for per-mission theming (colors, images, layout toggles).
3. Expose typed mount points for JS panel injection (transcript, photos, video, channels).
4. Keep per-mission CSS overrides under 150 lines each.
5. Transition from jQuery `.html()/.append()` to DOM API or modern component framework for better testability.

**Estimated Phase 6 effort**: 2–3 days for typed shell + refactored CSS architecture.
