# Playover Home — approved implementation brief

Approved November 17, 2026. This is the authoritative brief for a fresh implementation. The owner approved the latest mockup and interaction split with “it works.” Earlier proposals and the rejected implementation are superseded.

## Start here

Read this brief and view **playover-home-spacing-review.png** before writing code. Start in a fresh worktree from the agreed current project baseline; do not carry over rejected `codex/playover-home-design` app changes. Verify tutorial/PWA integration using the source notes below. Implement this approved design faithfully, show an iPhone-sized result first, and ask before committing or pushing. This document does not authorize deleting/resetting other worktrees or committing another agent's unfinished work.

## Approved Home and interaction model

- Playover is a private nine-game collection, primarily played on an iPhone during flights, layovers and waiting.
- A stable, compact **3×3 grid** contains the existing illustrations, names and short genre lines.
- **Artwork → open the game's existing entry/menu.** This is the quick-play path, without a mandatory information/tutorial step.
- **Name/genre/chevron → open the game's information sheet.** The text area is one secondary target. This explicitly supersedes the earlier assumption that tapping the name should also play.
- No separate Details row, no visible “Info” label, no underlined links. A small chevron beside the name identifies the secondary action.
- The information sheet shows the full current game description, primary **Play**, secondary **How to play**, and an obvious close/back action.
- Sheet Play and artwork open the same entry. Existing game menus own Continue/New game choices; Home must not reset saves.
- Closing a sheet or exiting a game restores relevant focus and browsing position. Preserve deep links and coherent browser Back, safe lazy-load cancellation, retry and disposal.

## Approved dimensions and hierarchy

The supplied screenshot is **375×667 CSS pixels**. Match its proportions, adapting naturally for 390×844, 430px widths, safe areas, short browser viewports and enlarged text. Desktop is a centered responsive version of this collection.

- Side padding approximately **16px**; header approximately **88px high**, with **24px reference top padding**. Respect actual safe areas without counting them twice.
- Window approximately **54×66px**; wordmark box approximately **196×66px**, preserving the approved silhouette/aspect.
- Sound control: **44×44px tap target**, **16px visible speaker glyph**, no large filled circle. It is visually quieter than the window.
- Grid begins approximately **16px below the header**. Column gap **10px**, row gap **14px** at the reference width.
- Artwork surfaces approximately **108×104px**, nearly square. Illustrations are larger and bright, with their original colors and no dimming/filter.
- Metadata button approximately **56px high**: name about **12.5–13px**, genre about **11.5px**, room for wrapping, small chevron beside the name.
- Every target at least **44px**. Artwork and metadata are separate sibling buttons; no nested buttons or overlapping hit regions.
- Tiny version in the bottom-right corner, approximately **10px**, no reserved footer band. It may be omitted on constrained layouts rather than stealing space from the header/art/information.
- All nine entries fit at the normal reference size. Enlarged text/browser chrome may require natural scrolling; do not clip names or shrink essential text/squash art to force a fit.

Grid order, left to right by row:

| Row | ID | Name | Genre |
| --- | --- | --- | --- |
| 1 | everbrook | Everbrook | Peaceful city builder |
| 1 | lanternfall | Lanternfall | Mystery visual novel |
| 1 | helpdesk | Patch & Kettle | Cozy IT management |
| 2 | oddcrown | Odd Crown | Discovery chess |
| 2 | planets | Pocket Planets | Merge puzzle |
| 2 | reef | Reef Relay | Quiet puzzles |
| 3 | builder | Tidewater | Island builder |
| 3 | roguelike | Deepvault | Dungeon adventure |
| 3 | towerdefence | Bastion Maze | Tower defence |

Use descriptions from the current game registry/source. Preserve IDs and saves; do not add Home best-score badges.

## Approved palette: Cabin blue

Page **#101e2b**; artwork surfaces **#203448**; main text/Home wordmark **#f0f2f4**; secondary text **#b6c3d0**; action accent **#8cd3ed**. Identity navy/icon background/wingtip approximately **#0b2345**, matching the approved identity board. The owner selected this dark palette; earlier charcoal, cloud-gray and pale-sage alternatives are not selected. Add no theme picker.

## Approved branding and supplied files

All files below are alongside this brief:

- **playover-home-spacing-review.png** — approved full Home target; authority for spacing and hierarchy.
- **playover-home-spacing-review.html** — standalone visual reference for the same composition. It is a mockup, not production source or a completed click-through app.
- **playover-wordmark-capital-p-preview.png** — approved transparent, relaxed/slanted **Playover** lettering with capital P. Generated artwork, not an identified font. There is no font file to install. Preserve these actual letterforms; do not substitute a similar font or regenerate the name differently.
- **playover-wing-view-navy-review.png** — approved identity board: open cabin window, bright blue sky, white clouds, pale cool-gray wing, navy wingtip, off-white frame and narrow gray inner rim. The owner specifically likes the wingtip matching the navy iOS icon background.
- **playover-window-portable-preview.png** — standalone transparent Home-window derivative. Useful for positioning, but has edge/fringe artifacts to clean before production. The approved identity board is authority for the intended geometry/interior; cleanup must not become redesign.

For Home, use the standalone window **without** the navy rounded-square icon backing. For iOS, retain that navy backing. Home and app icon are separate compositions with a shared identity. The approved shade-free mark must not acquire an ambiguous handle/cap.

Display the wordmark in light ink on dark Home using its alpha silhouette or a faithful color variant. Bundled PNG is acceptable and fully offline; a true SVG requires separate faithful vector recreation. The source is not already vector artwork. Prepare clean production assets and required icon sizes using existing project tooling/workflows. Coordinate app-icon ownership with the PWA workstream. Do not ship the whole labeled presentation board as a logo asset.

The owner permits expressive Home animation, but no animation is approved. Start with the approved static composition. Later refinement must preserve fast access and reduced-motion preferences; do not add a hero or shift the grid to accommodate invented animation.

## Tutorials and global controls

- Reuse the tutorial workstream's standardized slides/API, available from Home and each game's own menu. Do not recreate their content.
- Home flow: information sheet → How to play → close/finish returns to the same information sheet. Viewing a guide must not start/reset a run or unexpectedly mark an in-game first-run guide completed.
- Keep each game's own menu guide entry. No global tutorial index.
- One persistent **global sound-effects toggle** in the header, with accurate on/off state and accessible label.
- **No Settings sheet, general menu, About/credits page or music toggle.** Music is not wired across most games; no inactive placeholder control.
- Version comes from build/package metadata, not a separate manual string or network fetch. Save backup/restore and development helpers were possibilities, not approved scope.

## Exclusions and compatibility

- No hero, featured subset, carousel, filters, categories, surprise picker, recent-games section, promotional paragraphs, bottom navigation or Home online/offline availability copy.
- No tickets, birds, prior plover logo, generic play symbol, ambiguous shade/handle or rejected lettering.
- No gameplay redesign or duplicate guides. Scope work to Home/shell/branding and necessary guide integration.
- **No new packages, downloaded fonts, CDN resources, analytics, login, remote content or runtime APIs.** Use native HTML/CSS/JavaScript, system text and bundled assets.
- Preserve IDs, `?game=<id>`, the **flightgames:** storage prefix and save formats. Do not clear browser storage during code replacement.
- Preserve `start(ctx)`/`dispose()` lifecycle, scope Home CSS, dispose listeners/timers correctly.
- Reuse Vite/PWA caching for shell, all nine lazy game chunks, artwork and branding. After the first complete download, everything must run offline. Cache quietly; actual launch failure may show focused retry/return actions.

## Integration snapshot — verify again at implementation start

- Main checkout **/Users/irispepa/Projects/flight-games** was clean at **acb2bdd**, “Merge How to play guides for six games.” Its npm test script now runs **all nine** simulation suites.
- Rejected checkout **/Users/irispepa/.codex/worktrees/948f/flight-games**, branch **codex/playover-home-design**, remains at **763f565** with rejected uncommitted app changes. Do not merge/reuse them.
- Tutorial checkout **/Users/irispepa/Projects/flight-games/.claude/worktrees/playover-missing-tutorials-ca78d7**, at acb2bdd, has **uncommitted** further standardization: new builder/roguelike/towerdefence guide.js modules and related UI/style/index edits, plus Helpdesk updates. Main's six-guide merge does not include all latest work. Preserve that owner's changes and establish their stable integration path; do not silently copy an active snapshot or rewrite it.
- PWA checkout **/Users/irispepa/Projects/flight-games/.claude/worktrees/playover-pwa-conversion-9dbb76** was clean at **e918e1b**, not an ancestor of main. Verify current ownership/integration before changing manifest, service worker, icons or audio lifecycle.
- Main's **src/shell/guide.js** exports **openGuide(root, {pages, className, doneLabel, onClose})**, returning a close handle/open state. Per-game exports differ: GUIDE_PAGES, guidePages(...), showGuide(...), Reef's GUIDE object, etc. Inspect actual current modules. The latest guide.js modules for the three original games were still in the tutorial worktree at handoff.

These are source-verified snapshots, not permission to overwrite other checkouts. Consult current repository instructions and owning source. Useful references: src/shell/CONTRACT.md, storage.js, audio.js, existing guides and docs/plans/ui-polish.md.

## Acceptance checks

1. Prepare clean baseline/assets and show the first recognizable result at **iPhone size**. Match the approved header prominence, quiet sound icon, nearly square bright art and compact metadata.
2. Check 375×667, 390×844, 430px, safe areas, shorter browser viewports and enlarged text. No overlaps, clipped names/genres or horizontal scroll; at least 44px targets.
3. Verify every artwork → correct game; every text/chevron → correct information sheet; sheet Play → same game entry. Check exit/Back/focus restoration, deep links, loading errors, retries and leaving during delayed imports.
4. Verify all nine shared guides from Home and in-game, correct return origin, swipes/keyboard/reduced motion, no unintended save/first-run changes.
5. Verify persistent global sound state and actual game audio. Version matches metadata and stays quiet. No extra menus/music controls/availability copy.
6. Run **npm test** and **npm run build** on rebuilt code. Complete caching in production preview, go offline, reload Home and launch all nine games. Preserve existing saves and check runtime errors/external dependencies.
7. Review icon/logo at small sizes and test on a physical iPhone before claiming device verification. Browser emulation does not establish installed-mode behavior, touch feel or device performance.
8. Leave the result reviewable and ask before committing or pushing.

Only the approved mockup's geometry has been checked at 375×667: all nine entries fit, at least 44px targets, no horizontal overflow. It remains a visual study. Prior build/test/online-offline checks on the rejected implementation do not validate the approved rebuild; rerun them on actual new code.
