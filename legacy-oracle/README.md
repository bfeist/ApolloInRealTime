# `legacy-oracle/` — pristine mission `index.html` files

Each `legacy-oracle/{11,13,17}/index.html` is a **byte-for-byte copy** of
the corresponding `_webroot/{N}/index.html` from the sibling repos
(`../Apollo_11`, `../Apollo_13`, `../Apollo17.org`). They are never
edited.

## Why this folder exists

The new typed app lives at `/{N}/` in the dev server, served from
`{N}/index.html` at the repo root. That URL slot can only hold one file,
so the pristine legacy HTML can't sit there too.

The Vite plugin `legacyOraclePlugin` (in `vite.config.ts`) makes
`/legacy/{N}/` serve `legacy-oracle/{N}/index.html`, and rewrites every
asset request (`/legacy/11/lib/jquery-2.1.4.js`, `/legacy/11/index.js`,
etc.) to `public/{N}/<asset>`. The asset tree in `public/{N}/` is itself
pristine, so the result is a live, in-dev-server copy of the legacy site
for side-by-side comparison against the typed app at `/{N}/`.

## What to do with it

- **Don't edit anything in this folder.** If a file here ever drifts from
  the pristine sibling-repo source, re-copy it.
- **Don't build it into the production output.** The Vite plugin is
  dev-only and the `legacy-oracle/` directory is not listed in
  `rollupOptions.input`.
- When the legacy oracle is no longer needed (the typed app at `/{N}/`
  fully replaces it), delete this folder and the `legacyOraclePlugin`
  block in `vite.config.ts` in one commit.
