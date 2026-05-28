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
import type { PaperScopeLike } from "../engines/navigator/paperApi.js";

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

    <section class="card" id="modules">
      <h2>typed modules wired in</h2>
      <ul>
        <li><code>src/shell/clock.ts</code> — live readout above</li>
        <li><code>src/engines/navigator/layout.ts</code> + <code>renderer.ts</code> — navigator above</li>
        <li class="muted">Add a list item here as each new engine/panel is mounted.</li>
      </ul>
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
  console.warn(`[dev/missionHarness] ${config.name} (${id}) ready`);
});
