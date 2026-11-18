# Handoff

## Date
2026-11-18 · Approved Playover Home implementation review

## Important links
- `docs/playover-home/IMPLEMENTATION.md` — authoritative approved design and interaction brief.
- `docs/playover-home/README.md` — implementation, ownership, regeneration and verification commands.
- `design-qa.md` — visual comparison, browser checks and physical-device limitation.
- `docs/playover-home/evidence/` — screenshots and machine-readable browser results.
- `src/shell/CONTRACT.md` — lifecycle, storage, offline and shared guide contracts.
- `docs/history.md` — lasting game architecture, testing lessons and tutorial decisions.
- `docs/wishlist.md` — deferred game features; keep them outside this Home task.

## Plan / Spec
`docs/playover-home/IMPLEMENTATION.md`. Reviewed implementation is committed. Physical iPhone acceptance remains unverified. The approved information-sheet follow-up is committed and merged into main.

## Branch / Worktree
- `main` at `/Users/irispepa/Projects/flight-games` contains the approved Home implementation and sheet polish.
- Main preserves the tutorial commit `3235cf2` and merges `codex/playover-home-approved`, including implementation `9d06cb4` and sheet polish `c635257`.
- Source review worktree: `/Users/irispepa/.codex/worktrees/playover-home-approved/flight-games`, branch `codex/playover-home-approved`; retained for the running preview.
- Fresh Home baseline was `acb2bdd`. The rejected implementation and unrelated worktrees were not changed.

## Status
Approved Cabin blue Home, branding, information sheets, history/focus/scroll, loading cancellation/retry and global sound are committed. All nine shared guides and More tips work from Home and in-game, including Helpdesk's title screen. Nothing pushed or deployed. Follow-up: center information-sheet actions and replace visible Close text with the existing X icon pattern, a 44×44 target and accessible Close label. The centered actions and accessible X are committed and merged into main at the owner's request.

## How to run it
Main uses its existing node_modules; the Home review worktree links those same dependencies. No package was added.

- `npm run dev -- --host 127.0.0.1 --port 5327 --strictPort` — Home development preview.
- `npm test` — all nine simulation suites; passes after tutorial integration.
- `npm run build` — passes; current production cache contains 60 entries, about 2.44 MiB, including the X icon.
- `npm run preview -- --host 127.0.0.1 --port 5328 --strictPort` — production preview (running).
- `PLAYOVER_URL=http://127.0.0.1:5328/ node scripts/check-home.mjs` — all-nine Home guides, More tips, navigation, responsive layout, save preservation and errors.
- `node scripts/check-in-game-guides.mjs` — all-nine in-game guide and More tips entries.
- `node scripts/check-home-offline.mjs` — cold offline guides/games, cancellation, failure/retry, actual audio mute and saved Continue.
- `node scripts/check-home-updates.mjs` — disposable production copy verifies updates wait during play and apply once on Home.
- `node scripts/make-icons.mjs` — approved raster branding and icon regeneration with the existing local Python/Pillow tool.

Browser scripts accept `CHROME_PATH`, `PLAYOVER_URL` and `PLAYOVER_EVIDENCE`. Evidence was captured at 375×667, 390×844, 430×932, 375×500 and 1280×900, plus safe areas and 200% text.

## Next steps
1. Test on a physical iPhone, including installation, safe areas, touch feel and airplane-mode reopening, before claiming device acceptance.
2. Ask before pushing; the owner authorized local commits and merge only.
3. Keep broader game review, hosting and the remaining PWA rendering/deployment changes separate unless authorized.

## Key decisions
- Artwork opens the existing game entry immediately; name/genre/chevron opens its information sheet. No Home save resets or best-score badges.
- Information-sheet Play/How to play actions are centered; title and descriptive text remain left aligned. Dismiss with a top-right X, matching most game sheets; guides retain Skip/Done and navigation retains Back.
- Home guide adapters read each game's own slides and More tips. They do not start games or write guide-completion flags; temporary thumbnail renderers are disposed.
- IDs, `?game=<id>`, the `flightgames:` storage prefix and save formats are preserved.
- Approved supplied raster letterforms and cleaned window are bundled offline. Home uses the transparent window; app icons use navy backing. The approved asset brief supersedes older code-only art notes.
- Home CSS is scoped; version comes from package/build metadata. No new package, theme picker, global Settings or music toggle was added.
- The clean PWA source commit `e918e1b` remains separate. This patch adapts its committed shell update/persistent-storage policy and prompt SW registration. Its deployment workflow and battery-rendering changes are outside this patch; it has no icon-file conflict.

## Known limitations / session issues
- Physical iPhone and installed-mode verification have not been performed. Browser emulation and synthetic swipes do not establish device acceptance.
- The in-app browser reported a doubled CSS viewport; the shared Chrome plugin profile was locked. Verification used isolated Chrome through the project's existing puppeteer-core dependency.
- The in-game test runner initially passed all assertions but stalled while closing many isolated browser contexts. It now uses separate pages in one temporary browser profile; the rerun passed and exited normally.
- The prior full-app review and human balance/playtesting remain separate work; this session verifies Home/shell/guide integration.
