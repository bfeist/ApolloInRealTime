# Legacy repository provenance

The four `legacy/` subtrees in this repo were imported from independent local
git repositories on 2026-05-28. Each subtree carries its full commit history
(no `--squash`), so `git log -- legacy/<name>/` replays the complete timeline
of that codebase.

## Subtrees

| Prefix            | Source path                      | Original branch | Import commit |
| ----------------- | -------------------------------- | --------------- | ------------- |
| `legacy/17/`      | `f:/_repos/Apollo17.org`         | `master`        | `0cec519f`    |
| `legacy/11/`      | `f:/_repos/Apollo_11`            | `master`        | `a018d8af`    |
| `legacy/13/`      | `f:/_repos/Apollo_13`            | `master`        | `261c3f25`    |
| `legacy/landing/` | `f:/_repos/apolloinrealtime.org` | `master`        | `b01d7629`    |

## Notes

- The original local repos are preserved unchanged and serve as the rollback
  target during Phase 7 (cutover).
- Large binary files (Premiere Pro projects, OCR data, PDFs, Sketch files)
  were migrated to Git LFS after import. The original blobs still exist in
  the source repos; LFS objects for files no longer present in any branch tip
  were pruned.
- Do not modify files under `legacy/` — they are read-only reference
  material. Lifted code moves to `src/` or `public/` in subsequent phases.
