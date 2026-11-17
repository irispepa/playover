# Wishlist

Deferred items found while building; none block play.

## All games
- Play each game on a real iPhone: touch feel, safe areas, 60 fps with late-game load.
- Pick an HTTPS host so the PWA can be installed (GitHub Pages, Netlify, Cloudflare Pages).

## Tidewater (builder)
- Mid and late game are bot-tested only; pacing for a human is a guess.
- Several milestones often complete at once.
- Harsh difficulty scores well above Standard.
- Camera cannot rotate.
- How to play opened from the pause menu closes back to the island, not to the pause menu.
- The Royal Charter modal was restyled but only checked in code; a headless run cannot reach it quickly.

## Deepvault (roguelike)
- Boss floors, shops, inventory and three of four classes are covered by the headless test only, not seen on screen.
- Palette is muted; enemies can be dark against the floor.
- Loading a save starts at the floor entrance.
- F is the potion key on desktop; interact has no obvious key.
- Enemy contrast against the floor is a render.js matter (materials or a rim light); the UI pass left 3D rendering alone.
- Records shows every unseen bestiary entry as "???" (37 rows); could collapse to seen entries plus a count.
- First-run button labels show on floor 1 of the first run only (meta.runs === 0); there is no way to bring them back.

## Bastion Maze (tower defence)
- Tower models are separate meshes (a few hundred draw calls with 60+ towers).
- Balance is bot-measured; Shades and early bosses cause most losses.
- Projectiles in flight are dropped when saving mid-wave.
- In Hero mode a targeted ability can only be cancelled by tapping off the map.
- Hero view leaves the lower third of the screen empty.
- First-wave coach can sit over the core tile on 375x667 screens; it hides once you dismiss it or start wave 1.
- Ability name labels show only before wave 1 (and until the first hero touch); there is no way to bring them back.
- The "Next" wave strip and the hero card are tappable divs, not buttons, so they are not reachable by keyboard.

## New pocket games
- Play Odd Crown on a real phone for longer sessions; tune opponent pacing from human feedback.
- Verify all three new games in iPhone Safari standalone: physical safe areas, touch accuracy, battery use and frame rate.

## Everbrook (peaceful city builder)
- Balance is bot-measured (a clumsy bot finishes all six ages in about 2,300 to 6,000 in-game days); human pacing is a guess.
- No music or ambient sound, only the shared effect presets.
- Cloud shadows are hard-edged.

## Lanternfall (mystery visual novel)
- The test bot learns the motive in about 79% of runs (the check was lowered from 90% to 75%); may need easing if it feels stingy.
- No music. Portraits and backdrops are drawn in code; generated art could replace them.
- The Mayor's hair reads a little like a helmet.

## Patch & Kettle (cozy IT)
- Get-togethers need 2 hours and are easy to miss late in the campaign; consider a nudge.
- Mini-games sit in the middle of tall screens with empty space above.
- Only day one was played by hand through the UI; days 2 to 15 were fast-forwarded through the rules.
