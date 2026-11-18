# Approved Playover Home implementation

Authoritative design: [IMPLEMENTATION.md](IMPLEMENTATION.md) and [375×667 mockup](source/playover-home-spacing-review.png).

## Baseline and ownership

- Fresh worktree: `/Users/irispepa/.codex/worktrees/playover-home-approved/flight-games`.
- Branch: `codex/playover-home-approved`, based on clean main `acb2bdd`.
- The rejected `codex/playover-home-design` checkout was not read, copied, merged or changed.
- Tutorial source: owner-supplied stable commit `3235cf2`, directly based on `acb2bdd`. Its 35 code/document files (including deletions) were applied exactly; this worktree's `HANDOFF.md` was preserved and updated separately. This includes standardized guides and optional More tips for all nine games, Helpdesk's title guide entry and Bastion's data-driven tower reference. No active snapshot was copied; importing the tutorial patch did not create a separate commit.
- PWA owner: clean `e918e1b` in `/Users/irispepa/Projects/flight-games/.claude/worktrees/playover-pwa-conversion-9dbb76`, separate from main. Home adapts its committed shell update/persistent-storage policy and prompt registration. Its deployment workflow and rendering changes are outside this patch. That commit does not modify the icons, so there is no existing icon-file conflict.
- Reviewed implementation was committed as `9d06cb4` at the owner's request. Nothing pushed or deployed. Subsequent information-sheet action centering and X-button polish were approved for commit and merge.

## Implementation

`src/games.js` retains the nine IDs, descriptions and lazy entries. `src/shell/home.js` and `home.css` implement the approved collection, information sheet and separate artwork/metadata controls. `src/main.js` owns history, focus, scroll, cancellation, retry and disposal. Home guide adapters read existing slide exports without starting games or writing guide completion flags.

PWA assets include the branded manifest and 180/192/512 icons. Production precaching includes all nine game chunks, guide assets, local fonts and branding. Updates wait during games and overlays, then apply once on idle Home. The storage prefix remains `flightgames:`.

## Run and verify

Use the existing lockfile/dependencies; no package was added.

```sh
npm run dev -- --host 127.0.0.1 --port 5327 --strictPort
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 5328 --strictPort
PLAYOVER_URL=http://127.0.0.1:5328/ node scripts/check-home.mjs
node scripts/check-in-game-guides.mjs
node scripts/check-home-offline.mjs
node scripts/check-home-updates.mjs
```

Browser scripts use the already-declared `puppeteer-core` dependency and isolated Chrome profiles. Set `CHROME_PATH`, `PLAYOVER_URL` and `PLAYOVER_EVIDENCE` as needed. All nine shared guides and their optional More tips sections are required by these checks.

Branding regeneration uses the existing local Python/Pillow image tool:

```sh
node scripts/make-icons.mjs
```

The supplied raster originals live in `source/`. Preparation preserves their letterforms and interior artwork, removes the portable window's outside fringe, makes light-ink lettering, and produces separate transparent Home and navy-backed app-icon compositions. The speaker-on asset is the approved mockup's icon; other controls follow the existing game icon vocabulary.

## Integration result and remaining review

The tutorial commit and all nine Home adapters are integrated. Tidewater and Everbrook reuse their existing thumbnail renderers in temporary, disposed renderers; no game is started to view a guide. Deepvault's Home guide uses its default class and adapts controls to pointer/keyboard capability. Every adapter includes the game-owned More tips content.

Simulation tests, build, all-nine Home/in-game guide checks and cold offline guide/game checks pass. Guide close/finish and More tips preserve the Home information-sheet origin and all saved state. See `design-qa.md` for evidence and the remaining physical-device limitation.

1. The owner approved the follow-up sheet polish for commit and merge; ask before pushing. The reviewed implementation is already committed as `9d06cb4`; nothing pushed or deployed.
2. Physical iPhone/installed-mode verification still requires the owner's device. Browser emulation does not establish device acceptance.
