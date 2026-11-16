# The carry-on arcade expansion

Three new three.js games join Tidewater, Deepvault and Bastion Maze. All models,
illustrations, labels and sounds are local or generated in code. There are no
network dependencies during play. Each game saves after an action and on exit.

## Odd Crown

A 6 × 6 discovery chess game against a deliberately forgiving opponent.
Each new court assigns six piece types different movements and capture powers.
The twelve movement patterns include sliding pieces, knight and camel jumps,
cannons, frogs, crab steps and repeated knight jumps. A piece never receives its
ordinary rook, bishop, knight or king movement.

Six powers range from ordinary captures to blasts, recruitment, boomerang
returns, victory hops and allied swaps. Rules are shared by gold and blue, but
start unknown. Successful moves and enemy moves reveal rules. Failed experiments
are free; two failed experiments reveal a rule. Insight peeks, a notebook, threat
warnings, a three-round royal truce and three-turn undo history ease discovery.
Undo preserves discoveries. Capture the rival king; there is no check or castling.

Three unmarked squares hide a royal trapdoor, a launch spring and a confetti
cannon. Each king has one emergency parachute for the trapdoor. Hidden traps are
excluded from AI evaluation until discovered. New courts randomize rules and
hazards; continuing a save preserves the current court.

## Pocket Planets

A 4 × 4 sliding merge puzzle. Swipe or use arrow buttons/keys to combine matching
planets, from 2-value moons to a 2048 Sun and beyond. Every valid slide spawns a
new 2 or 4. Tiles merge once per slide. The atlas tracks discovered planets.

Eight-step undo, recyclable planets, persistent best scores, a win celebration
and endless play provide room to experiment. Recycling starts with two charges,
earns another each 512 score, and caps at five. No timer.

## Reef Relay

A procedural 5 × 5 channel-rotation puzzle. Turn channels to carry water from the
left spring through three pearls and into the right shell. The generator embeds
a connected solution; later reefs add side branches. Water and pearl lighting
update immediately. Turn direction is reversible, undo is available, and hints
can either highlight a useful tile or set its orientation. No turn limit or timer.

## Development

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5310 --strictPort
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 5311 --strictPort
```

The new games use `src/shell/arcade.js` for layout, dialogs and a three.js stage.
Pure simulations live beside rendering and controller modules. Saves use version
1 and the existing per-game storage namespace. Tiles and repeated stars use
instanced meshes. Renderer disposal releases instance resources as well.

## Checks performed

- Odd Crown: 80 deterministic, distinct courts; full bot games; legal-position
  invariants; all capture powers; cannon screens; royal truce, danger detection,
  trapdoor/parachute behavior; undo with retained discoveries.
- Pocket Planets: 100 generated runs; directional merges, single-merge rule,
  deterministic spawning, exact undo, recycling and blocked-board detection.
- Reef Relay: 500 generated reefs across levels; guaranteed solution connectivity,
  all pearls reachable, hint completion, forward/reverse rotations and undo.
- Existing builder, roguelike and tower-defence regression suites passed.
- Browser play at 390 × 844; layout/control bounds at 375 × 667 and 430 × 932.
  Controls measure at least 44 CSS pixels. Verified board hit testing, swipes,
  merges, AI replies, discovery/undo, reef hints and victory, save/continue, and exits.
- Production service worker caches all six modules. Normal reload and all six game
  launches work with network throttled offline; an uncached fetch fails as expected.
  A cache-bypassing hard reload deliberately bypasses the offline service worker.
- Real iPhone performance and Safari installation have not been tested.

## Before the flight

Host the contents of `dist/` at an HTTPS address (including `sw.js`, its workbox
file, all assets, and `manifest.webmanifest`). In Safari on the phone, open that
address, use Share → Add to Home Screen, then launch the installed app online.
Wait for “All six games ready offline”. Close it, enable airplane mode, and reopen
it once before leaving. Saves stay on that device and origin; clearing site data
removes them. Localhost is a computer preview, not an iPhone installation address.
