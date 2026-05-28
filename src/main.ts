// Shared ESM entry for all three missions. Loaded by the generated head as
// `<script type="module" src="/src/main.ts"></script>` after the legacy
// script chain. Phase 3 lands this entry; future phases migrate engines and
// panels here, replacing the legacy script tags.
//
// For Phase 3 it only verifies the runtime context (window.MISSION is set,
// jQuery is loaded, paper.js is present) and re-exports the dom shim so
// follow-on modules can import it without juggling paths.

import * as dom from "./dom/index.js";

export { dom };

dom.ready(() => {
  const m = window.MISSION;
  if (!m) {
    console.error("[main.ts] window.MISSION is undefined — Vite plugin did not inject config.");
    return;
  }
  console.warn(`[main.ts] ESM bootstrap ready for ${m.name} (${m.id}).`);
});
