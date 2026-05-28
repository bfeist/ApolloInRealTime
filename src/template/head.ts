// Shared <head> builder. Produces the per-mission head HTML from the typed
// mission config. Replaces the legacy per-mission <head> spaghetti during
// Phase 3 of the migration (see docs-plan/05-migration-plan.md).
//
// IMPORTANT: This generates the same script-tag chain (and same load order)
// the legacy missions used. Don't reorder or drop libs — Phase 4 will replace
// individual entries with ESM imports.

const SHARED_HEAD_META = [
  '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />',
  '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
  '<meta http-equiv="Pragma" content="no-cache" />',
  '<meta http-equiv="Expires" content="0" />',
  '<link rel="copyright" href="http://creativecommons.org/licenses/by-nc-sa/3.0/" />',
];

const GA_ID = "G-WHBJ2838KH";

const escapeAttr = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function favicons(extended: boolean, manifestFile: string): string[] {
  const tags: string[] = [];
  if (extended) {
    tags.push(
      '<link rel="apple-touch-icon" sizes="144x144" href="favicons/apple-touch-icon-144x144.png" />',
      '<link rel="apple-touch-icon" sizes="152x152" href="favicons/apple-touch-icon-152x152.png" />',
      '<link rel="apple-touch-icon" sizes="180x180" href="favicons/apple-touch-icon-180x180.png" />',
      '<link rel="icon" type="image/png" sizes="32x32" href="favicons/favicon-32x32.png" />',
      '<link rel="icon" type="image/png" sizes="192x192" href="favicons/android-chrome-192x192.png" />',
      '<link rel="icon" type="image/png" sizes="96x96" href="favicons/favicon-96x96.png" />',
      '<link rel="icon" type="image/png" sizes="16x16" href="favicons/favicon-16x16.png" />',
      `<link rel="manifest" href="favicons/${manifestFile}" />`,
      '<link rel="shortcut icon" href="favicons/favicon.ico" />',
    );
  } else {
    tags.push(
      '<link rel="apple-touch-icon" sizes="180x180" href="favicons/apple-touch-icon.png" />',
      '<link rel="icon" type="image/png" sizes="32x32" href="favicons/favicon-32x32.png" />',
      '<link rel="icon" type="image/png" sizes="16x16" href="favicons/favicon-16x16.png" />',
      `<link rel="manifest" href="favicons/${manifestFile}" />`,
    );
  }
  tags.push(
    '<meta name="msapplication-TileColor" content="#da532c" />',
    '<meta name="msapplication-TileImage" content="favicons/mstile-144x144.png" />',
    '<meta name="msapplication-config" content="favicons/browserconfig.xml" />',
    '<meta name="theme-color" content="#000000" />',
  );
  return tags;
}

/**
 * Build the contents of the <head> for a given mission config.
 * Returns the inner HTML — caller wraps in <head>…</head>.
 *
 * `options.includeEsmEntry` controls whether the `<script type="module"
 * src="/src/main.ts">` tag is emitted. True in dev (Vite serves the TS
 * module directly); false in build until a dedicated entry chunk exists
 * (deferred to Phase 4 — see docs-plan/05-migration-plan.md).
 */
export function renderMissionHead(
  config: MissionConfig,
  options: { includeEsmEntry?: boolean } = {},
): string {
  const includeEsm = options.includeEsmEntry ?? true;
  const { meta, head } = config;
  const stylesHref = head.stylesCacheBust ? `styles.css?rnd=${head.stylesCacheBust}` : "styles.css";
  const paperSrc = head.paperVariant === "min" ? "lib/paper-full.min.js" : "lib/paper-full.js";

  const parts: string[] = [
    ...SHARED_HEAD_META,
    "",
    `<title>${escapeAttr(meta.title)}</title>`,
    `<link rel="image_src" href="${escapeAttr(meta.ogImage)}" />`,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`,
    "",
    `<meta property="fb:app_id" content="${escapeAttr(meta.fbAppId)}" />`,
    `<meta property="og:title" content="${escapeAttr(meta.title.replace(/Real-time/, "Real Time"))}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:image" content="${escapeAttr(meta.ogImage)}" />`,
    `<meta property="og:url" content="${escapeAttr(meta.ogUrl)}" />`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`,
    `<meta property="og:site_name" content="${escapeAttr(meta.title.replace(/Real-time/, "Real Time"))}" />`,
    "",
    ...favicons(head.extendedFavicons, head.manifestFile),
    "",
    '<meta name="robots" content="index,follow" />',
    "",
    `<link rel="stylesheet" type="text/css" href="${stylesHref}" />`,
    "",
  ];

  if (head.includeYouTubeIframeApi) {
    parts.push('<script type="text/javascript" src="https://www.youtube.com/iframe_api"></script>');
  }
  parts.push(
    "<!-- Google tag (gtag.js) -->",
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>`,
    "<script>",
    "  window.dataLayer = window.dataLayer || [];",
    "  function gtag() { dataLayer.push(arguments); }",
    '  gtag("js", new Date());',
    `  gtag("config", "${GA_ID}");`,
    "</script>",
    "",
    '<script type="text/javascript" src="lib/webfontloader.js"></script>',
    '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.js"></script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-modal/0.9.1/jquery.modal.min.js"></script>',
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-modal/0.9.1/jquery.modal.min.css" />',
    '<script type="text/javascript" src="lib/jquery_plugins.js"></script>',
    '<script type="text/javascript" src="lib/jquery.fullscreen.js"></script>',
    '<script type="text/javascript" src="lib/jquery.lazyload.js"></script>',
    `<script type="text/javascript" src="${paperSrc}"></script>`,
    '<script type="text/javascript" src="lib/date.js"></script>',
    '<script type="text/javascript" src="lib/jquery.waitforimages.min.js"></script>',
    '<script type="text/javascript" src="lib/size_manager.js"></script>',
    '<script type="text/javascript" src="lib/help_overlay_manager.js"></script>',
    '<script type="text/javascript" src="lib/modemizr.js"></script>',
    '<script type="text/javascript" src="navigator.js"></script>',
    '<script type="text/javascript" src="index.js"></script>',
    '<script type="text/javascript" src="ajax.js"></script>',
  );

  if (includeEsm) {
    parts.push("", '<script type="module" src="/src/main.ts"></script>');
  }

  return parts.join("\n");
}
