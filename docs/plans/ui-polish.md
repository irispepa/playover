# UI polish pass

Scope: a polish pass over the shell menu and all three games, with the weight on instructions and how to play. No new game rules, no balance changes, no save-format changes.

## What the survey found (390×844, headless Chrome)
- **Shell menu:** clean but bare. Three text cards, no art, a large empty lower half, and "Online"/"Offline" status text that says little. The loading screen is plain "Loading…".
- **Tidewater:** the most finished UI. How to play is seven text pages with two thumbnails each; it reads as paragraphs, not steps. No first-run pointers to the goal pill, resource bar or tray.
- **Deepvault:** the title screen is mostly empty black. How to play is one long scroll of eleven paragraph rows. HUD controls carry no labels, and the ability buttons have an empty `.dv-cost` slot (no energy cost shown).
- **Bastion Maze:** the weakest screens. The title modal has unlabelled chip groups (difficulty and map rows have no headings), wrapping chips, and six "—" record rows on a first launch. How to play is six plain bullet pages with "1 / 6" text and no pictures.

## Standard every game meets after the pass
1. **How to play** is a paged guide: one topic per page, a title, a picture (built in code from the game's own icons or thumbnails, or a small inline SVG diagram), and two to four short points of no more than about 20 words each. Page dots, Back/Next, Skip or close, and the last page ends with a clear start button. Controls get a diagram that shows where the thumbs go.
2. **Every fact is checked against the code** (`data.js`, `sim.js`) before it is written. Nothing is invented.
3. **Title and new-game screens** have clear hierarchy: labelled option groups, one primary action, a one-line description of the selected option, and records shown compactly (empty records collapse to a single line).
4. **First-run help in play:** short, dismissable pointers for the main controls the first time a player starts, stored in the game's storage so they show once.
5. **Consistency:** 44 pt targets, visible pressed states, `:focus-visible` rings, `prefers-reduced-motion` respected, tabular numbers for counters, safe areas respected.

## Writing style
Plain, short sentences. Sentence case. Second person ("you"). No emoji. Name controls by what the player sees ("the big round button bottom right").

## Constraints
- Offline only: no fonts, images or network. Art is SVG or canvas made in code.
- Each game only touches `src/games/<id>/`; the shell only touches `src/main.js`, `src/shell/`.
- Keep sims pure; the headless tests must still pass.
- Impeccable hook: no one-sided accent borders, no `width` animations (use full borders and `transform`).

## Work split
- Shell menu and loading screen: **dropped from this pass.** Branch `codex/pocket-games-expansion` (`012c792`) already replaces the launcher (`src/main.js`, `src/shell/arcade.*`), and `claude/niko-game-collection-2eb773` also edits `src/main.js`. Polishing the old menu here would only create merge conflicts. This pass stays inside the three game folders, which neither branch touches.
- Tidewater, Deepvault, Bastion Maze: one subagent each, working in parallel on disjoint folders, each verifying in its own headless Chrome and dev server.
- Lead reviews every diff and screenshot, runs all three test suites and a production build.
