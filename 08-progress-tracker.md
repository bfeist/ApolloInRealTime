# 08 — Progress tracker

This is the ground truth for the current state of the AiRT2 migration.
Every agent session must read this first and update it before ending.

---

## ⏩ Resume here

**Status:** Planning complete. Ready to begin Phase 0 (scaffolding).

**Next action:**
1. Confirm the default branch name for each of the four legacy repos (run
   `git -C f:/_repos/Apollo_13 branch` etc.) — needed before `git subtree add`.
2. Create the `AiRT2` git repo (`git init`, first commit = planning docs).
3. Run the four `git subtree add` imports in oldest-first order:
   A17 (1972) → A11 (1969) → landing page → A13 (1970).
   See `07-repo-and-git-strategy.md` for the exact commands.
4. Then proceed with Phase 0 in `05-migration-plan.md`.

---

## Phase status

| Phase                            | Status        | Notes |
|----------------------------------|---------------|-------|
| Git init + subtree imports       | not started   |       |
| 0 — Scaffold + baseline capture  | not started   |       |
| 1 — Lift A13                     | not started   |       |
| 2 — Mission config (typed)       | not started   |       |
| 3 — Unified entry + jQuery start | not started   |       |
| 4 — Extract engines              | not started   |       |
| 4.5 — MOCRviz refactor           | not started   |       |
| 5 — Panels + finish jQuery       | not started   |       |
| 6 — CSS + responsive             | not started   |       |
| 7 — Cutover                      | not started   |       |
| 8 — Cleanup + future missions    | not started   |       |
| P-1 Pipeline scaffold (uv)       | not started   |       |
| P-2 CSV schema + data-inputs     | not started   |       |
| P-3 A13 ingestion                | not started   |       |
| P-4 A11 + A17 ingestion          | not started   |       |

---

## Decisions made during execution

*(Record here any deviations from the plan, on-the-fly decisions, or
discoveries that change how a future phase should be done.)*

| Date | Phase | Decision / Finding |
|------|-------|--------------------|
|      |       |                    |

---

## Deferred improvements noticed

*(Things worth doing eventually but out of scope for the current phase.
Log them here so they don't get lost.)*

| Noticed in phase | Description |
|-----------------|-------------|
|                 |             |

---

## Playwright baseline snapshot inventory

Captured in Phase 0. Delete rows that haven't been captured yet; add rows
as new snapshots are added.

| File | Mission | GET | Viewport | Captured |
|------|---------|-----|----------|---------|
|      |         |     |          |         |

---

## Session log

*(Brief one-liner per session. Newest at the top.)*

| Date | Summary |
|------|---------|
| 2026-05-28 | Planning complete. All 7 planning docs written and locked. `.github/copilot-instructions.md` and this tracker created. Ready for Phase 0. |
