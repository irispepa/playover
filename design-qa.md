# Playover Home design QA

**Final result: passed**

Visual fidelity and browser interaction acceptance pass. The owner-supplied stable tutorial commit `3235cf2` is integrated, including all nine standardized guides, optional More tips and Helpdesk's title-menu guide entry. No active snapshot was copied. Physical iPhone/installed-mode verification remains unperformed.

## Evidence and normalization

- Source truth: `docs/playover-home/IMPLEMENTATION.md` and `docs/playover-home/source/playover-home-spacing-review.png`.
- Implementation: `docs/playover-home/evidence/home-375x667.png`, production preview `http://127.0.0.1:5328/`.
- Source and implementation: 375×667 pixels, 375×667 CSS px, deviceScaleFactor 1. No bezel or browser chrome; no rescaling.
- State: default Cabin blue Home, nine entries, sound on, no overlay.
- Full-view comparison: `docs/playover-home/evidence/home-comparison-final.png` (source left, implementation right).
- Focused branding comparison: `docs/playover-home/evidence/header-comparison.png` (source left, implementation right, both enlarged equally).
- Additional captures: 390×844, 430×932, 375×500, 1280×900, simulated safe areas, 200% text, information sheet, Home guide, offline Home and loading failure.
- The in-app browser reported a doubled CSS viewport; the shared Chrome plugin profile was locked. Exact-size evidence comes from an isolated Chrome process using the project's existing puppeteer-core dependency.

## Fidelity surfaces

- **Fonts/typography:** supplied alpha-silhouette lettering, with its actual capital-P letterforms. System UI text; names 12.5px, genre 11.5px, matching wrapping at the reference size. Enlarged text wraps without clipping and scrolls naturally. Raster edge smoothing differs slightly from the mockup's mask rendering; no substitute font was used.
- **Spacing/layout:** 16px sides, 24px reference top, 88px header, 16px header-to-grid gap, 10px column and 14px row gaps. Art is approximately 108×104px; metadata targets are at least 56px tall. All nine entries fit at 375×667. Every Home target is at least 44×44px. Safe areas use a maximum rather than adding the reference padding twice.
- **Colors/tokens:** page #101e2b, art #203448, ink #f0f2f4, secondary #b6c3d0, accent #8cd3ed. Quiet 16px speaker within a 44px target. No filled sound circle or theme picker.
- **Images:** existing approved game illustrations remain bright and unfiltered. Supplied window and wordmark are bundled; outside window fringe is masked away. Home's window is transparent; app icons retain navy backing. The production icon was reviewed at 192px. No labeled identity board is shipped as a logo.
- **Copy/content:** nine names/genres and order match the approved brief. Information sheets use the unchanged full registry descriptions. No best badges, Settings, music control, offline-status copy, promotional section or extra navigation appears on Home. Version matches package metadata.

## Comparison and fix history

1. Initial full-view and focused comparison found the Home geometry close to the source. Responsive testing found horizontal overflow at 200% text because a long genre word exceeded its column (P2). Added natural wrapping; new enlarged-text capture and geometry assertions pass with vertical scrolling and no horizontal overflow/clipping.
2. Overlay inspection found native dialog max-width insetting the information sheet and shared guide CSS overriding Home's blue accent (P2). Set the sheet's explicit max-width and increased Home guide theme specificity. Recaptured `information-sheet.png` and `home-guide.png`; the sheet is now 375px wide and the guide action is #8cd3ed. Targeted browser checks pass.
3. Post-fix visual comparison finds no remaining actionable visual P0/P1/P2 mismatch.
4. The tutorial integration dependency was resolved with stable commit `3235cf2`. Full all-nine Home, in-game and offline guide checks now pass, including More tips and unchanged saved state. Fresh guide screenshots are included in the evidence folder. Home geometry is unchanged and the new production Home capture still matches the source comparison.
5. After committing the reviewed implementation as `9d06cb4`, the owner requested centered information-sheet actions and asked about dismissal conventions. Follow-up centers Play/How to play and uses the existing game-sheet X shape in a 44×44 target with an accessible Close label. The title and prose remain left aligned. Updated sheet capture: `docs/playover-home/evidence/information-sheet.png`. The owner approved the follow-up for commit and merge.

## Findings

- No remaining actionable P0/P1/P2 finding in the reviewed browser experience. The earlier tutorial blocker is resolved.

## Verification

- `npm test`: all nine simulation suites pass.
- `npm run build`: passes; current build precaches 60 entries, approximately 2.44 MiB, including all game/guide chunks, branding and the sheet X icon.
- Normal production browser flow: all nine artwork and sheet Play paths pass; registry descriptions, Back/focus restoration, deep-link exit, responsive dimensions, safe-area padding and 200% text pass.
- All nine Home guides: close/finish returns to the same information sheet, keyboard and simulated horizontal swipes pass, reduced motion passes, and all storage remains unchanged. More tips opens from the last card, returns to the main guide and closes back to the information sheet without save/first-run writes.
- All nine in-game guide entries: shared guide and More tips open and return to the same game. Includes Helpdesk's new title-screen entry. No console or runtime errors.
- Cold offline test: after complete installation, each of nine tests reloads Home offline to reset the JS module map, opens its guide and More tips with saved state unchanged, then launches its game successfully. Branding is loaded offline.
- Delayed-import cancellation and failed-chunk retry pass. Retry preserves the information-sheet return origin.
- Real Reef action produces sound when enabled and none when globally muted. Existing save data remains unchanged on entry and Continue is offered.
- Installed SW update waits while a game is open; returning Home applies it with exactly one reload, using a disposable production copy.
- Normal-flow console errors, uncaught errors and external requests: none. Deliberate failure-test network/console errors are expected and isolated.
- Targeted final checks: full-width sheet, guide accent, short-viewport scroll restoration, browser Forward and package version pass.
- Post-commit sheet polish: centered action geometry and 44×44 accessible X pass at all five viewport sizes. Close/focus restoration, guide return, Escape and the cached X asset offline pass; no console/runtime errors.

## Remaining acceptance

1. Review on a physical iPhone before claiming installed-mode/device acceptance. Browser emulation and synthetic swipes do not establish that.
2. Reviewed implementation committed as `9d06cb4`. The owner approved committing the sheet polish and merging into main; ask before pushing. Nothing pushed or deployed.

final result: passed
