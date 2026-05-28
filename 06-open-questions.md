# 06 — Open questions

The Round-1 questions are answered and locked in
[00-decisions.md](00-decisions.md). The originals are kept below for
history, marked with their answer. A short Round-2 list of remaining
follow-ups is at the bottom.

## Round 1 — closed

| #    | Question                 | Answer                                                                                              |
| ---- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| A1   | Stack                    | Vanilla + ESM + Vite + **TypeScript** (no React)                                                    |
| A2   | jQuery                   | **Rip it out** (typed `src/dom/` shim replaces it)                                                  |
| A2b  | Longevity principle      | Zero-runtime-dep static output; pin/vendor toolchain; no upgrade chores                             |
| B3   | UX parity vs redesign    | Pixel-identical first                                                                               |
| B4   | URL stability            | Absolute requirement                                                                                |
| B5   | Mobile subfolder fate    | Drop; make main app responsive                                                                      |
| B6   | Side-apps fate           | MOCRviz refactored (de-iframe); spacecraft_dev discarded; nominee retired                           |
| C7   | Canonical base           | Apollo 13                                                                                           |
| C8   | Cutover style            | Big-bang (confirmed in Round 2 Q10)                                                                 |
| C9   | Data pipeline            | **Replace, don't migrate** — new uv + Python 3 ingestion                                            |
| D10  | Future missions in scope | Yes — all Apollo missions eventually                                                                |
| E11  | Hosting target           | Same static host as today                                                                           |
| E11b | Media CDN                | KeyCDN dropped; media from `media.apolloinrealtime.org`                                             |
| E12  | Hidden server-side bits  | (assumed none, flag in Phase 1)                                                                     |
| F13  | Test ambition            | Vitest unit + progressive browser tests + Playwright visual regression                              |
| F14  | Repo location            | Fresh `AiRT2` repo, full history of all 4 legacy repos imported — [07](07-repo-and-git-strategy.md) |

## Round 2 — answered

All answered inline by Ben. Captured here as resolved; the verbatim
answers are preserved below each question.

### Outcomes that changed the plan

- **MOCRviz** only receives the **clock time** from the parent today — so the
  de-iframe refactor is simple: the panel just subscribes to mission-time.
  **Assets are NOT unified across missions** (tapes + MOCR positions differ
  per mission, and future missions will differ too). Goal = **unify the
  code, lazy-load per-mission assets** from `public/{N}/mocrviz/`. Eventually
  all missions (including A17) get MOCRviz as recordings become available.
- **Data pipeline:** Ben runs it interactively for now (option A); may fold
  parts into a build-time job later. **Python 3.12+** OK. **Unify the harness
  around WhisperX** — do NOT re-transcribe with new models. Reuse the modern
  WhisperX pipeline patterns from `../ArtemisInRealTime/src/server-batch/`
  (e.g. `1_comm...`). [Action: inspect that repo when building `pipeline/`.]
- **Future missions:** _all_ Apollo missions are eventually in scope (8, 9,
  10, 12, 14, 15, 16 + the three done). Schema/config must not hard-code the
  current three.
- **Cutover:** big-bang. **Rollback** = revert DNS to the old server; no
  special plan needed since this is a new repo and the old sites stay intact.
- **Playwright baselines:** Copilot picks the GET timestamps.
- **Repo:** stay local for now; CI will be **GitHub Actions** later. New
  open decision on repo structure / history preservation → see
  [07-repo-and-git-strategy.md](07-repo-and-git-strategy.md).

### MOCRviz refactor (blocks Phase 4.5)

1. **What does today's MOCRviz iframe actually receive from the parent?**
   Just URL params, or live `postMessage` updates? If the latter, we need
   to inventory the message contract before refactoring.

I think just the clock time. MOCRviz is also cloned between 11 and 13 repos

2. **Is MOCRviz on A13 the canonical version**, or is A11's the reference?
   (A11's is 12 MB vs A13's 6 MB — different asset payloads.)

not really. both are valid as there were changes to the tapes available and the positions in mission control between those missions. as we go forward and get additional missions online, that data will likely differ as well. the goal should be to unify the code and make the assets lazy-load, but not necessarily unify the assets themselves if they are different between missions.

3. **Any future mission that should also get MOCRviz** even though it
   doesn't have one today? (A17 doesn't have MOCRviz currently — is that
   on purpose, or just "never built"?)

Eventually all apollo mission, including 17, but it depends on when we get the recordings.

### Python parallel track (blocks Python P-1)

4. **Who runs it?** Options: (a) Ben does it interactively, (b) Copilot
   does it on demand session-by-session, (c) a sub-agent owns it end-to-end
   from a single prompt. The Python work touches scraping (network) and
   transcription (GPU) — has implications for where it runs.

I think we can stick with A for now and see if we want to fold some aspects of it into a build time job later.

5. **Python version + dependency policy.** OK to bump to 3.12, single
   `pyproject.toml`, ruff + black + mypy? Or hold at 3.11 for some
   compatibility reason?

yes, Python 3.12 or later is fine.

6. **WhisperX / Whisper rewrites scope.** Is the goal "unify the harness
   around the existing models" or "also re-transcribe with newer models
   (Whisper v3, Gemini, etc.)"? The latter is a big content question, not
   a tooling question.

Unify the harness. whisperx is preferred. We have other repos that have modern whisperx-based pipelines (e.g. ../ArtemisInRealTime\src\server-batch\1_comm

### Future missions (informs Phase 0 mission-config schema)

7. **Apollo 8** — orbital only, no surface. Same data shape as A13?
8. **Apollo 14/15/16** — lunar landings; presumably need the geology /
   paper / heartrate data the A11/A17 models support. Anything genuinely
   new (e.g. A15 had the lunar rover — does that introduce a new panel
   type)?
9. **Apollo 9, 10** — earth-orbit / lunar-orbit tests. In or out?

all other apollo mission are in scope eventually.

### Cutover (blocks Phase 7)

10. **Big-bang or per-mission cutover?** Defaulted to big-bang. Per-mission
    is safer but means running two stacks during the transition.

big bang.

11. **Rollback plan beyond "keep old in a legacy branch."** If the new
    app misbehaves at GET T+24h post-cutover, what's the unwind?

this is a new repo. no need for rollback plan beyond reverting the DNS change to point back to the old server.

### Tests + tooling (blocks Phase 0)

12. **Playwright baseline GET times.** Recommend 6–10 fixed points per
    mission (T-2h, T-0, key event 1, key event 2, splashdown). Want to
    name them yourself for narrative significance, or let me pick?

you pick

13. **Repo location.** Stay in `f:/_repos/AiRT2`, or push to a new
    GitLab/GitHub remote right away?

keep repo local for now, we can push to remote later.

14. **CI host.** GitHub Actions, GitLab CI (you have an EMSS token already),
    or no CI for now?

It'll be github actions, but we're not pushing to remote yet. I'm trying to decide whether to fold this big change into the existing apolloinrealtime.org repo or start fresh with a new AiRT2 repo. The mission repos have long histories that I'd like to preserve. include plans for this in the strategy docs.

## Round 3 — resolved

### Repo structure + git-history preservation

R3-1. **Fold in vs fresh repo?** → **Fresh `AiRT2` repo (Option 2).**
R3-2. **How much history?** → **Full history of all four legacy repos,
imported via `git subtree` under `legacy/<name>/` prefixes** so gource and
`git log` replay the complete decade. Size cost accepted; no history
rewriting. Full plan in [07-repo-and-git-strategy.md](07-repo-and-git-strategy.md).
