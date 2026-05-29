/**
 * Per-mission progressive dev harness.
 *
 * Boots a near-blank shell at `/dev/{11,13,17}/` that loads ONLY the typed
 * ESM modules that exist so far — no legacy `index.js` / `ajax.js` /
 * `navigator.js`. This is the surface where each Phase 4 / 4.5 / 5 module
 * is wired in as soon as it lands, so the author can verify it
 * behaviorally in a real browser against real mission config.
 *
 * See docs-plan/05-migration-plan.md §Verification "layer 2" and
 * docs-plan/08-progress-tracker.md.
 *
 * Mission id is read from `<body data-mission="11|13|17">`. The script
 * imports the matching typed config statically (all three are tiny) and
 * exposes it at `window.MISSION` for any module that still reads it.
 *
 * This module is dev-only scaffolding. It is excluded from the production
 * build (Phase 7 cutover removes the `/dev/` pages entirely).
 */

import { a11Config } from "../missions/11.config.js";
import { a13Config } from "../missions/13.config.js";
import { a17Config } from "../missions/17.config.js";
import { secondsToTimeStr } from "../shell/clock.js";
import { ready } from "../dom/index.js";
import { NavigatorRenderer } from "../engines/navigator/renderer.js";
import { loadTocData, findClosestTocIndex } from "../data/tocData.js";
import { loadMissionStagesData, findStageIndex } from "../data/missionStagesData.js";
import { loadVideoSegmentData, findVideoSegmentIndex } from "../data/videoSegmentData.js";
import { loadCommentaryData, findClosestCommentaryIndex } from "../data/commentaryData.js";
import { loadUtteranceData, findClosestUtteranceIndex } from "../data/utteranceData.js";
import { loadPhotoData, findClosestPhotoIndex } from "../data/photoData.js";
import { loadVideoUrlData, findVideoUrlIndex } from "../data/videoUrlData.js";
import { loadCrewStatusData, findCrewStatusIndex } from "../data/crewStatusData.js";
import { loadTelemetryData, findTelemetryIndex } from "../data/telemetryData.js";
import { loadOrbitData, findOrbitIndex } from "../data/orbitData.js";

const CONFIGS: Record<string, MissionConfig> = {
  "11": a11Config,
  "13": a13Config,
  "17": a17Config,
};

function readMissionId(): "11" | "13" | "17" | null {
  const id = document.body.dataset.mission;
  return id === "11" || id === "13" || id === "17" ? id : null;
}

/**
 * Resolve the "current-year" launch date for a mission.
 * Mirrors the legacy `index.js` pattern of prepending the current year
 * to `launchDateModernSuffix`, e.g. "2026" + "-04-11 19:13:00 GMT".
 * Returns `NaN` if the resulting string can't be parsed.
 */
function modernLaunchEpochMs(config: MissionConfig): number {
  const year = new Date().getFullYear().toString();
  return Date.parse(year + config.launchDateModernSuffix);
}

interface ClockReadout {
  modern: HTMLElement;
  historic: HTMLElement;
}

function buildShell(config: MissionConfig): ClockReadout {
  const root = document.getElementById("mission-root");
  if (!root) throw new Error("[dev/missionHarness] #mission-root missing");

  root.innerHTML = `
    <header>
      <h1>${config.name} <small>(${config.id})</small></h1>
      <p class="muted">
        Progressive dev shell — loads only typed ESM modules. No legacy
        <code>index.js</code> / <code>ajax.js</code> / <code>navigator.js</code>.
      </p>
    </header>

    <section class="card">
      <h2>clock</h2>
      <div class="row"><label>GET (modern launch year):</label><code id="get-modern">--:--:--</code></div>
      <div class="row"><label>GET (historic launch):</label><code id="get-historic">--:--:--</code></div>
      <div class="row muted">
        mission duration: ${secondsToTimeStr(config.missionDurationSeconds)} ·
        countdown: ${secondsToTimeStr(config.countdownSeconds)} ·
        default start: ${config.defaultStartTimeId}
      </div>
    </section>

    <section class="card">
      <h2>mission config</h2>
      <pre id="config-dump"></pre>
    </section>

    <section class="card">
      <h2>navigator (Paper.js renderer)</h2>
      <p class="muted">
        Typed <code>NavigatorRenderer</code> on the injected Paper.js scope.
        Tiers, nav boxes, cursor + hover nav-cursor; click a tier to seek.
        Data overlays (stage/video/photo ticks) are Phase 5.
      </p>
      <canvas id="navCanvas" width="1200" height="220"
        style="width:100%;height:220px;background:#0b0b0b;border:1px solid #2a2a2a;border-radius:4px;display:block"></canvas>
      <div class="row muted">last seek: <code id="nav-seek">(none)</code></div>
    </section>

    <section class="card">
      <h2>mission stages</h2>
      <p class="muted">
        Typed <code>loadMissionStagesData()</code> against
        <code>indexes/missionStagesData.csv</code>. Highlighted row =
        stage containing the live historic-launch GET.
      </p>
      <div class="row muted">status: <code id="stages-status">loading...</code></div>
      <ol id="stages-list" style="margin:0;padding:0 0 0 1.5em;font-family:'Roboto Mono',monospace;font-size:12px"></ol>
    </section>

    <section class="card">
      <h2>video segments</h2>
      <p class="muted">
        Typed <code>loadVideoSegmentData()</code> against
        <code>indexes/videoSegmentData.csv</code>. Total count + the segment
        (if any) covering the current GET.
      </p>
      <div class="row muted">status: <code id="segments-status">loading...</code></div>
      <div class="row muted">current segment: <code id="segments-current">(none)</code></div>
    </section>

    <section class="card">
      <h2>TOC data</h2>
      <p class="muted">
        Typed <code>loadTocData()</code> against <code>indexes/TOCData.csv</code>.
        Highlighted row = nearest TOC entry &le; current historic-launch GET
        (the same rule as legacy <code>scrollToClosestTOC</code>).
      </p>
      <div class="row muted">status: <code id="toc-status">loading...</code></div>
      <ol id="toc-list" style="max-height:240px;overflow:auto;margin:0;padding:0 0 0 1.5em;font-family:'Roboto Mono',monospace;font-size:12px"></ol>
    </section>

    <section class="card" id="modules">
      <h2>typed modules wired in</h2>
      <ul>
        <li><code>src/shell/clock.ts</code> — live readout above</li>
        <li><code>src/engines/navigator/layout.ts</code> + <code>renderer.ts</code> — navigator above</li>
        <li><code>src/data/csvLoader.ts</code> + <code>src/data/tocData.ts</code> — TOC list above</li>
        <li><code>src/data/missionStagesData.ts</code> — mission stages list above</li>
        <li><code>src/data/videoSegmentData.ts</code> — video segments readout above</li>
        <li><code>src/data/commentaryData.ts</code> — commentary readout below</li>
        <li><code>src/data/utteranceData.ts</code> — transcript/utterance readout below</li>
        <li><code>src/data/photoData.ts</code> — photo ticks readout below</li>
        <li><code>src/data/videoUrlData.ts</code> — video URL segments readout below</li>
        <li><code>src/data/crewStatusData.ts</code> — crew status readout below</li>
        <li><code>src/data/telemetryData.ts</code> — telemetry readout below</li>
        <li><code>src/data/orbitData.ts</code> — orbit readout below</li>
      </ul>
    </section>

    <section class="card">
      <h2>commentary data</h2>
      <p class="muted">
        Typed <code>loadCommentaryData()</code> against
        <code>indexes/commentaryData.csv</code>. Current entry at historic GET.
      </p>
      <div class="row muted">status: <code id="commentary-status">loading...</code></div>
      <div class="row muted">current: <code id="commentary-current">(none)</code></div>
    </section>

    <section class="card">
      <h2>utterance (transcript) data</h2>
      <p class="muted">
        Typed <code>loadUtteranceData()</code> against
        <code>indexes/utteranceData.csv</code>. Current utterance at historic GET.
      </p>
      <div class="row muted">status: <code id="utterance-status">loading...</code></div>
      <div class="row muted">current: <code id="utterance-current">(none)</code></div>
    </section>

    <section class="card">
      <h2>photo data</h2>
      <p class="muted">
        Typed <code>loadPhotoData()</code> against
        <code>indexes/photoData.csv</code>. Most recent photo at historic GET.
      </p>
      <div class="row muted">status: <code id="photo-status">loading...</code></div>
      <div class="row muted">current: <code id="photo-current">(none)</code></div>
    </section>

    <section class="card">
      <h2>video URL data</h2>
      <p class="muted">
        Typed <code>loadVideoUrlData()</code> against
        <code>indexes/videoURLData.csv</code>. Current video segment at historic GET.
      </p>
      <div class="row muted">status: <code id="videourl-status">loading...</code></div>
      <div class="row muted">current: <code id="videourl-current">(none)</code></div>
    </section>

    <section class="card">
      <h2>crew status data</h2>
      <p class="muted">
        Typed <code>loadCrewStatusData()</code> against
        <code>indexes/crewStatusData.csv</code>. Current crew status at historic GET.
      </p>
      <div class="row muted">status: <code id="crewstatus-status">loading...</code></div>
      <div class="row muted">current: <code id="crewstatus-current">(none)</code></div>
    </section>

    <section class="card">
      <h2>telemetry data</h2>
      <p class="muted">
        Typed <code>loadTelemetryData()</code> against
        <code>indexes/telemetryData.csv</code>. Current telemetry at historic GET.
      </p>
      <div class="row muted">status: <code id="telemetry-status">loading...</code></div>
      <div class="row muted">current: <code id="telemetry-current">(none)</code></div>
    </section>

    <section class="card">
      <h2>orbit data</h2>
      <p class="muted">
        Typed <code>loadOrbitData()</code> against
        <code>indexes/orbitData.csv</code>. Current orbit at historic GET (A17 only).
      </p>
      <div class="row muted">status: <code id="orbit-status">loading...</code></div>
      <div class="row muted">current: <code id="orbit-current">(none)</code></div>
    </section>
  `;

  const dump = root.querySelector("#config-dump");
  if (dump) dump.textContent = JSON.stringify(config, null, 2);

  const modern = root.querySelector("#get-modern");
  const historic = root.querySelector("#get-historic");
  if (!(modern instanceof HTMLElement) || !(historic instanceof HTMLElement)) {
    throw new Error("[dev/missionHarness] clock readout elements missing");
  }
  return { modern, historic };
}

function startClock(config: MissionConfig, readout: ClockReadout): void {
  const modernEpoch = modernLaunchEpochMs(config);
  const historicEpoch = Date.parse(config.launchDate);

  const tick = (): void => {
    const now = Date.now();
    if (Number.isFinite(modernEpoch)) {
      readout.modern.textContent = secondsToTimeStr(Math.trunc((now - modernEpoch) / 1000));
    } else {
      readout.modern.textContent = "(unparseable launchDateModernSuffix)";
    }
    if (Number.isFinite(historicEpoch)) {
      readout.historic.textContent = secondsToTimeStr(Math.trunc((now - historicEpoch) / 1000));
    } else {
      readout.historic.textContent = "(unparseable launchDate)";
    }
  };
  tick();
  window.setInterval(tick, 1000);
}

/**
 * Load the legacy `paper-full.js` for this mission (it sets a global `paper`
 * PaperScope) and resolve it as a {@link PaperScopeLike}. Paper.js is a
 * classic script, not an ESM module, so it's injected via a `<script>` tag.
 */
function loadPaper(missionId: string): Promise<PaperScopeLike> {
  const existing = (window as unknown as { paper?: PaperScopeLike }).paper;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `/${missionId}/lib/paper-full.js`;
    script.onload = (): void => {
      const paper = (window as unknown as { paper?: PaperScopeLike }).paper;
      if (paper) resolve(paper);
      else reject(new Error("[dev/missionHarness] paper-full.js loaded but window.paper is unset"));
    };
    script.onerror = (): void => {
      reject(new Error(`[dev/missionHarness] failed to load ${script.src}`));
    };
    document.head.appendChild(script);
  });
}

/**
 * Mount the typed {@link NavigatorRenderer} on the dev page's `#navCanvas`,
 * driven by the live mission clock. Click-to-seek updates the displayed
 * mission time (no media player on this page) and the "last seek" readout.
 */
async function mountNavigator(config: MissionConfig): Promise<void> {
  const canvas = document.getElementById("navCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const seekReadout = document.getElementById("nav-seek");

  let paper: PaperScopeLike;
  try {
    paper = await loadPaper(config.id);
  } catch (err) {
    console.error(err);
    return;
  }

  let currentSeconds = 0;
  const renderer = new NavigatorRenderer(paper, {
    missionDurationSeconds: config.missionDurationSeconds,
    countdownSeconds: config.countdownSeconds,
    onSeek: (seconds) => {
      currentSeconds = seconds;
      if (seekReadout) seekReadout.textContent = secondsToTimeStr(seconds);
    },
  });
  renderer.mount(canvas);

  // Advance the playback cursor once per second from the historic launch.
  const historicEpoch = Date.parse(config.launchDate);
  if (Number.isFinite(historicEpoch)) {
    currentSeconds = Math.trunc((Date.now() - historicEpoch) / 1000);
  }
  renderer.render(currentSeconds);
  window.setInterval(() => {
    if (Number.isFinite(historicEpoch)) {
      currentSeconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    }
    renderer.render(currentSeconds);
  }, 1000);
}

/**
 * Load `indexes/TOCData.csv` and render the parsed entries as a scrollable
 * list. The row whose time is the most recent &le; the live historic-launch
 * GET gets a highlight class on each clock tick.
 */
async function mountTocData(config: MissionConfig): Promise<void> {
  const listEl = document.getElementById("toc-list");
  const statusEl = document.getElementById("toc-status");
  if (!(listEl instanceof HTMLOListElement)) return;

  let toc: TocData;
  try {
    toc = await loadTocData(`/${config.id}/`);
  } catch (err) {
    if (statusEl) statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  if (statusEl) statusEl.textContent = `${String(toc.entries.length)} entries`;

  for (const entry of toc.entries) {
    const li = document.createElement("li");
    li.id = `tocdev-${entry.timeId}`;
    li.style.padding = "2px 4px";
    li.style.marginLeft = entry.level === 1 ? "0" : "1em";
    li.style.fontWeight = entry.level === 1 ? "bold" : "normal";
    li.textContent = `${entry.timeStr}  ${entry.label}`;
    listEl.appendChild(li);
  }

  const historicEpoch = Date.parse(config.launchDate);
  let lastHighlighted: HTMLElement | null = null;
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findClosestTocIndex(toc, seconds);
    if (idx < 0) return;
    const entry = toc.entries[idx];
    if (!entry) return;
    const el = document.getElementById(`tocdev-${entry.timeId}`);
    if (!el || el === lastHighlighted) return;
    if (lastHighlighted) lastHighlighted.style.background = "";
    el.style.background = "#234";
    lastHighlighted = el;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/missionStagesData.csv` and render the parsed stages as a
 * list. The stage covering the live historic-launch GET gets a highlight
 * class on each clock tick.
 */
async function mountMissionStages(config: MissionConfig): Promise<void> {
  const listEl = document.getElementById("stages-list");
  const statusEl = document.getElementById("stages-status");
  if (!(listEl instanceof HTMLOListElement)) return;

  let data: MissionStagesData;
  try {
    data = await loadMissionStagesData(`/${config.id}/`, {
      missionDurationSeconds: config.missionDurationSeconds,
    });
  } catch (err) {
    if (statusEl) statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  if (statusEl) statusEl.textContent = `${String(data.stages.length)} stages`;

  for (const [idx, stage] of data.stages.entries()) {
    const li = document.createElement("li");
    li.id = `stagedev-${String(idx)}`;
    li.style.padding = "2px 4px";
    li.textContent = `${stage.timeStr} \u2192 ${stage.endTimeStr}  ${stage.name}`;
    li.title = stage.description;
    listEl.appendChild(li);
  }

  const historicEpoch = Date.parse(config.launchDate);
  let lastHighlighted: HTMLElement | null = null;
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findStageIndex(data, seconds);
    if (idx < 0) {
      if (lastHighlighted) {
        lastHighlighted.style.background = "";
        lastHighlighted = null;
      }
      return;
    }
    const el = document.getElementById(`stagedev-${String(idx)}`);
    if (!el || el === lastHighlighted) return;
    if (lastHighlighted) lastHighlighted.style.background = "";
    el.style.background = "#234";
    lastHighlighted = el;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/videoSegmentData.csv` and surface a count + the segment
 * (if any) covering the live historic-launch GET.
 */
async function mountVideoSegments(config: MissionConfig): Promise<void> {
  const statusEl = document.getElementById("segments-status");
  const currentEl = document.getElementById("segments-current");
  if (!statusEl || !currentEl) return;

  let data: VideoSegmentsData;
  try {
    data = await loadVideoSegmentData(`/${config.id}/`);
  } catch (err) {
    statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  statusEl.textContent = `${String(data.segments.length)} segments`;

  const historicEpoch = Date.parse(config.launchDate);
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) {
      currentEl.textContent = "(launch date unparseable)";
      return;
    }
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findVideoSegmentIndex(data, seconds);
    if (idx < 0) {
      currentEl.textContent = "(none)";
      return;
    }
    const seg = data.segments[idx];
    if (!seg) {
      currentEl.textContent = "(none)";
      return;
    }
    currentEl.textContent = `#${String(idx)}  ${seg.startTimeStr} \u2192 ${seg.endTimeStr}`;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/commentaryData.csv` and surface count + current entry at GET.
 */
async function mountCommentaryData(config: MissionConfig): Promise<void> {
  const statusEl = document.getElementById("commentary-status");
  const currentEl = document.getElementById("commentary-current");
  if (!statusEl || !currentEl) return;

  let data: CommentaryData;
  try {
    data = await loadCommentaryData(`/${config.id}/`);
  } catch (err) {
    statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  statusEl.textContent = `${String(data.entries.length)} entries`;

  const historicEpoch = Date.parse(config.launchDate);
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findClosestCommentaryIndex(data, seconds);
    if (idx < 0) {
      currentEl.textContent = "(none)";
      return;
    }
    const entry = data.entries[idx];
    if (!entry) {
      currentEl.textContent = "(none)";
      return;
    }
    currentEl.textContent = `${entry.timeStr}  ${entry.text.slice(0, 80)}…`;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/utteranceData.csv` and surface count + current utterance at GET.
 */
async function mountUtteranceData(config: MissionConfig): Promise<void> {
  const statusEl = document.getElementById("utterance-status");
  const currentEl = document.getElementById("utterance-current");
  if (!statusEl || !currentEl) return;

  let data: UtteranceData;
  try {
    data = await loadUtteranceData(`/${config.id}/`);
  } catch (err) {
    statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  statusEl.textContent = `${String(data.entries.length)} entries`;

  const historicEpoch = Date.parse(config.launchDate);
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findClosestUtteranceIndex(data, seconds);
    if (idx < 0) {
      currentEl.textContent = "(none)";
      return;
    }
    const entry = data.entries[idx];
    if (!entry) {
      currentEl.textContent = "(none)";
      return;
    }
    currentEl.textContent = `${entry.timeStr}  [${entry.speaker}]  ${entry.words.slice(0, 80)}…`;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/photoData.csv` and surface count + most recent photo at GET.
 */
async function mountPhotoData(config: MissionConfig): Promise<void> {
  const statusEl = document.getElementById("photo-status");
  const currentEl = document.getElementById("photo-current");
  if (!statusEl || !currentEl) return;

  let data: PhotoData;
  try {
    data = await loadPhotoData(`/${config.id}/`);
  } catch (err) {
    statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  statusEl.textContent = `${String(data.entries.length)} entries`;

  const historicEpoch = Date.parse(config.launchDate);
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findClosestPhotoIndex(data, seconds);
    if (idx < 0) {
      currentEl.textContent = "(none)";
      return;
    }
    const entry = data.entries[idx];
    if (!entry) {
      currentEl.textContent = "(none)";
      return;
    }
    currentEl.textContent = `${entry.timeStr}  ${entry.photoId}  ${entry.description.slice(0, 60)}`;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/videoURLData.csv` and surface count + current video segment at GET.
 */
async function mountVideoUrlData(config: MissionConfig): Promise<void> {
  const statusEl = document.getElementById("videourl-status");
  const currentEl = document.getElementById("videourl-current");
  if (!statusEl || !currentEl) return;

  let data: VideoUrlData;
  try {
    data = await loadVideoUrlData(`/${config.id}/`);
  } catch (err) {
    statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  statusEl.textContent = `${String(data.entries.length)} entries`;

  const historicEpoch = Date.parse(config.launchDate);
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findVideoUrlIndex(data, seconds);
    if (idx < 0) {
      currentEl.textContent = "(none)";
      return;
    }
    const entry = data.entries[idx];
    if (!entry) {
      currentEl.textContent = "(none)";
      return;
    }
    currentEl.textContent = `#${String(idx)}  ${entry.startTimeStr} \u2192 ${entry.endTimeStr}  id=${entry.videoId}`;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/crewStatusData.csv` and surface count + current crew status at GET.
 */
async function mountCrewStatusData(config: MissionConfig): Promise<void> {
  const statusEl = document.getElementById("crewstatus-status");
  const currentEl = document.getElementById("crewstatus-current");
  if (!statusEl || !currentEl) return;

  let data: CrewStatusData;
  try {
    data = await loadCrewStatusData(`/${config.id}/`, {
      missionDurationSeconds: config.missionDurationSeconds,
    });
  } catch (err) {
    statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  statusEl.textContent = `${String(data.entries.length)} entries`;

  const historicEpoch = Date.parse(config.launchDate);
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findCrewStatusIndex(data, seconds);
    if (idx < 0) {
      currentEl.textContent = "(none)";
      return;
    }
    const entry = data.entries[idx];
    if (!entry) {
      currentEl.textContent = "(none)";
      return;
    }
    currentEl.textContent = `${entry.startTimeStr}  ${entry.statusHtml.replace(/<[^>]*>/g, "").slice(0, 80)}`;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/telemetryData.csv` and surface count + current telemetry at GET.
 */
async function mountTelemetryData(config: MissionConfig): Promise<void> {
  const statusEl = document.getElementById("telemetry-status");
  const currentEl = document.getElementById("telemetry-current");
  if (!statusEl || !currentEl) return;

  let data: TelemetryData;
  try {
    data = await loadTelemetryData(`/${config.id}/`, {
      missionDurationSeconds: config.missionDurationSeconds,
    });
  } catch (err) {
    statusEl.textContent = `failed: ${(err as Error).message}`;
    return;
  }
  statusEl.textContent = `${String(data.entries.length)} entries`;

  const historicEpoch = Date.parse(config.launchDate);
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findTelemetryIndex(data, seconds);
    if (idx < 0) {
      currentEl.textContent = "(none)";
      return;
    }
    const entry = data.entries[idx];
    if (!entry) {
      currentEl.textContent = "(none)";
      return;
    }
    currentEl.textContent =
      `v\u2295${String(entry.velocityEarth)} mph  d\u2295${String(entry.distanceEarth)} nm  ` +
      `d\u2299${String(entry.distanceMoon)} nm  v\u2299${String(entry.velocityMoon)} mph`;
  };
  update();
  window.setInterval(update, 1000);
}

/**
 * Load `indexes/orbitData.csv` and surface count + current orbit at GET.
 * This CSV only exists for missions with lunar orbit (A17); A11/A13 will fail gracefully.
 */
async function mountOrbitData(config: MissionConfig): Promise<void> {
  const statusEl = document.getElementById("orbit-status");
  const currentEl = document.getElementById("orbit-current");
  if (!statusEl || !currentEl) return;

  let data: OrbitData;
  try {
    data = await loadOrbitData(`/${config.id}/`);
  } catch (err) {
    statusEl.textContent = `n/a (${(err as Error).message})`;
    return;
  }
  if (data.entries.length === 0) {
    statusEl.textContent = "0 entries (not applicable for this mission)";
    return;
  }
  statusEl.textContent = `${String(data.entries.length)} entries`;

  const historicEpoch = Date.parse(config.launchDate);
  const update = (): void => {
    if (!Number.isFinite(historicEpoch)) return;
    const seconds = Math.trunc((Date.now() - historicEpoch) / 1000);
    const idx = findOrbitIndex(data, seconds);
    if (idx < 0) {
      currentEl.textContent = "(none)";
      return;
    }
    const entry = data.entries[idx];
    if (!entry) {
      currentEl.textContent = "(none)";
      return;
    }
    currentEl.textContent = `orbit ${entry.orbitNumber}  ${entry.startTimeStr} \u2192 ${entry.endTimeStr}`;
  };
  update();
  window.setInterval(update, 1000);
}

ready(() => {
  const id = readMissionId();
  if (!id) {
    console.error("[dev/missionHarness] <body data-mission> missing or invalid");
    return;
  }
  const config = CONFIGS[id];
  if (!config) return;
  window.MISSION = config;
  const readout = buildShell(config);
  startClock(config, readout);
  void mountNavigator(config);
  void mountTocData(config);
  void mountMissionStages(config);
  void mountVideoSegments(config);
  void mountCommentaryData(config);
  void mountUtteranceData(config);
  void mountPhotoData(config);
  void mountVideoUrlData(config);
  void mountCrewStatusData(config);
  void mountTelemetryData(config);
  void mountOrbitData(config);
  console.warn(`[dev/missionHarness] ${config.name} (${id}) ready`);
});
