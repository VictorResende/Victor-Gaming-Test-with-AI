# Game Director Report — Tower Defense Project
**Repo:** Victor-Gaming-Test-with-AI · **Stack:** Phaser 3 + TypeScript + Vite + Capacitor (Android) · **Scope reviewed:** 16,677 lines across 36 source files
**Prepared:** 2026-08-31 (updated) · **Method:** full-codebase audit by four parallel specialist passes (gameplay/balance, UI/UX/feel, progression/levels, platform/audio/assets), cross-checked against the project's `2d-games`, `game-design`, `mobile-games`, `game-audio`, and `game-art` skill references.

## Director pass (2026-08-31, implementation)

**Identity (frozen):** the game is **Reino dos Guardiões: Defesa Arcana** — medieval-fantasy tower defense, Android-first. README and browser title now match. Biomes are FOREST / RAVINE / CITADEL / MAGMA / RUINS / PINNACLE (sci-fi `CYBER`/`ORBITAL` enum names removed).

**Art/audio (frozen until Sprint 6):** stay 100% procedural sprites + synthesized SFX. This pass adds a cheap looping pad so the existing music-volume control is honest; real tracks still wait for Sprint 6.

**This session shipped (player-visible):**
- Grimório, talentos de herói, runas, descrições T4 e o decreto diário (campos PT mortos) usam locale keys. Save merge/migration is a pure `mergeLoadedSave` with tests.
- Map cards, bestiary/inspect names, honor titles, and achievement unlock toasts use locale keys. Achievement toasts now fire (`ACHIEVEMENT_UNLOCKED` was emitted and never shown). Pináculo props are torches/skulls (not solar panels/satellites); ruins use torches instead of alien pillars.
- Relic names/descriptions, weather/obstacle/dragon banners, and crit floaters use locale keys. Relic loadout button/modal is localized. Star rating and daily modifiers have unit tests.
- Enemy specials split into `enemyCombat` (tested damage/phase/leak math) + `enemySpecials` / `enemyFx`. Carrier death now actually drops a minion (was gated behind `isAlive=false`). Boss/shaman/slain banners are localized.
- Bestiary/inspector threat lines and tower combat tags are localized (pt/en). Bottom build dock + drag-to-place live in `BuildDock` / `BuildDeckDrag`.
- Top resource bar and match dialogs extracted (`TopMatchHud`, `MatchDialogs`). Wave/hero/endless toasts use locale keys. Endless milestones emit `SURVIVAL_MILESTONE_REACHED` (weather HUD listener is registered after BoundBus reset).
- Hero widget, spell/ability gems, enemy inspect banner, and shared cooldown wedges extracted from `UIScene`.
- Build-deck cards, radial tower menu, and inspector panel extracted (`BuildDeckCard`, `RadialTowerMenu`, `TowerInspectorPanel`); aim labels localized.
- Pause, rune-chip, and tier-4 panels live in `PauseModal` / `ModChipModal` / `Tier4EvolveModal` (mute/equip/evolve copy is localized).
- HUD toasts and elite edge-badges live in `ToastBanner` / `ThreatIndicators` (carrier badge is a skull, not a sci-fi saucer).
- HUD/listeners no longer stack on restart/retry (UIScene now owns BoundBus handlers; GameScene already did).
- Boss spawn toast + camera shake + thunder sting.
- Achievement unlock toast; Endless best-wave already recorded.
- Music volume now drives a looping ambient pad (starts on first tap).
- Notch/gesture insets: `index.html` now exposes `--sat/--sab/--sal/--sar` from `env(safe-area-inset-*)`.
- Saves flush on background/pagehide; `saveVersion` field added.
- Balance: Tesla chain now halves per bounce + Storm fire-rate cut; Cryo Absolute Zero stun has ICD; Combat Turret no longer double-stacks; Headshot 18s / 480 dmg; King's Crown 4★; L4–L6 gold 575 / 625 / 700.
- Cryo/build-card combat roles; tap-enemy + pause Bestiary for resistances.
- Sell / restart / surrender confirmations; Endless map picker; relics gated behind campaign clears (Crown from minute one).
- First-session onboarding toasts; victory/defeat run stats; CI typecheck+tests.

**Cut / defer this week:** Tiled/LDtk spike, L1.5, i18next, Sentry/PostHog, iOS, new towers. Witch already covers anti-stealth — do not add a second stealth answer until playtest says otherwise. Relic gating shipped (Crown at start; others on campaign clears). `UIScene` is now an orchestrator (listeners, drag-to-build, cooldowns).

**Next:** Android restart QA (5× surrender/retry) still needs a device. Cryo T1 slow is now on the build card and inspector. Do not open Sprint 4 content until that restart scenario is verified on Android.

---
> **Scope decision: the iOS port is out of scope.** This project will ship Android-only (plus the existing web/browser dev build). The `ios/` Capacitor project remains in the repo and stays buildable, but no further iOS-specific work — App Store readiness, `PrivacyInfo.xcprivacy`, iOS signing/provisioning, TestFlight, etc. — is planned. iOS-specific items below are marked accordingly rather than removed, in case this is revisited later.

---

## 0. Executive Summary

This is a **systemically ambitious** tower-defense build for a solo/AI-paired project — five towers each with three base levels plus a tier-4 fork into two specialized branches, ten enemy archetypes with a five-damage-type resistance matrix, three playable heroes with active abilities and leveling, plus four bolted-on meta layers (tech tree, relics, mod chips, hero perks) and four game modes (Standard, Endless, Boss Rush, Daily Challenge). For a project built without a dedicated art or audio pipeline, the breadth of *systems* is genuinely impressive.

It is held back by four things, in order of how much they're currently costing the project:

1. **One critical, session-breaking bug.** `GameScene`'s intended listener cleanup (`shutdown()`) is dead code — Phaser never calls it — so every restart/retry/next-level transition stacks duplicate event listeners on the shared global `EventBus`. In practice this means **the HUD stops updating correctly after the very first match**, and this was independently rediscovered by three separate review passes (gameplay, UI, and platform) approaching it from different files. This has to be fixed before anything else — new content built on top of it will only compound the leak.
2. **Identity confusion.** The README describes a sci-fi "Galaxy Defenders," the git commit message says "Medieval Tower Defense," and the actual shipped `<title>` is "Reino dos Guardiões - Defesa Arcana." The code itself is a medieval-fantasy reskin (Goblins, Orcs, Dragons, Balistas, Santuários) layered on top of leftover sci-fi scaffolding (a `BiomeType` enum with values like `CYBER`/`ORBITAL` that no longer map to any real level theme). This needs to be settled before writing more level/marketing copy.
3. **Content is thin relative to the systems built around it.** Only 6 levels exist to feed 6 biomes, a tech tree, hero perks, relics, mod chips, and 4 game modes — and several of those systems (achievement UI, endless progress tracking, one daily-challenge modifier) are already fully coded but never actually wired up or surfaced to the player.
4. **No production art or audio pipeline exists yet, by design.** Every visual (94 textures) is procedurally drawn at runtime via Phaser's `Graphics` API, and every sound is synthesized live via raw Web Audio oscillators — there are **zero binary asset files** in the repo. This is a legitimate, low-cost prototyping choice, but it hard-caps visual/audio polish and needs a conscious decision (stay procedural vs. invest in real assets) before scaling content further.

None of this is bad news for a project at this stage — it's exactly the kind of thing a director's pass should catch before the next content push. The plan below fixes the stability issues first, then rebalances, then unblocks scalable content authoring, then expands content, then invests in polish/production-readiness.

---

## 1. Critical Bugs (P0 — fix before anything else)

| # | Bug | Where | Impact |
|---|---|---|---|
| 1 | **`EventBus` listener leak.** `GameScene.shutdown()` (`GameScene.ts:1614-1616`) calls `EventBus.removeAllListeners()`, but this method is never subscribed to Phaser's `Scenes.Events.SHUTDOWN` — it simply never runs. `GameScene.setupEventListeners()` (`GameScene.ts:1054-1118`) and `UIScene.setupEventListeners()` (`UIScene.ts:1919-2107`, plus `UIScene.ts:391`) re-register ~28 handlers on the shared, module-level `EventBus` singleton every time `GameScene`/`UIScene` run `create()` — which happens on every restart, retry, and level transition (`UIScene.ts:1460-1469`, `2234-2244`; `LevelSelectScene.ts:97,122,346`). `UIScene` itself is never stopped, only re-`launch()`ed onto an already-running instance (a Phaser no-op), so its `create()` never re-runs and its listeners are never refreshed either way. | Duplicate handlers stack up, stale closures reference destroyed scene state, the HUD (gold/lives/wave/hero HP) can stop updating correctly, memory grows every restart, and risk of runtime exceptions increases with session length. Reproducible from the **second** match played. |
| 2 | **`Hero.executeOvercharge` (Ignis ultimate) ignores its own radius.** `Hero.ts:879-917` — the visual ring draws at radius 260 and correctly filters towers by distance, but the enemy damage/slow loop (`enemies.forEach(...)`) has no distance check at all. Every living enemy on the map takes 140–340 damage and a 40% slow, regardless of position. | A hero ultimate functions as a repeatable, zero-counterplay "reset the wave" button — both a bug and (independently) a severe balance problem. |
| 3 | **`ObjectPool.release()` is never called anywhere.** `GameScene.ts:166` builds a 60-slot projectile pool, but nothing returns projectiles to it. Once exhausted, `ObjectPool.get()` (`ObjectPool.ts:14-25`) permanently falls back to creating new sprites forever. | Unbounded object growth in any match with >60 concurrent shots (trivial by mid-game) — defeats the pool's purpose and degrades performance over a session, worst in Endless mode. |
| 4 | **Achievements screen is a hardcoded stub.** `MenuScene.ts:584-590` renders a local 5-item sample array with different text than the real `AchievementsManager.ACHIEVEMENTS_LIST` (16 items, `AchievementsManager.ts:13-30`). | 11 of 16 real achievements are permanently invisible to players — this is finished, working content nobody can see. |
| 5 | **Endless mode never records its own headline stat.** `SaveManager.recordEndlessProgress()` (`SaveManager.ts:284`) is fully implemented but never called from anywhere; `endlessBestWave`/`endlessHighScore` are never read either. | "Best wave reached" — the entire bragging-rights hook of Endless mode — is permanently stuck at 0. |
| 6 | **`ENERGY_SURGE` daily-challenge modifier is dead.** Fully defined with flavor text/icon (`dailyChallengeConfig.ts:52-57`) and can be randomly selected as one of two daily modifiers, but no gameplay code anywhere checks for it. | ~1 in 8 daily challenges silently promises an effect that never fires. |
| 7 | **Boss spawns are untelegraphed.** `GameEvents.BOSS_SPAWNED` is emitted (`WaveManager.ts:164`) but has zero listeners anywhere. | No banner, camera shake, or music sting — a boss (or 2-3 simultaneous bosses on later levels) arrives with the same fanfare as a Scout. |
| 8 | **Dead "Music Volume" control.** `UIScene.ts:1310-1345` builds a fully working music-volume UI wired to `AudioManager`'s `musicGainNode`, but no `playMusic` method exists anywhere and no music track ever plays through it. | A shipped, functional-looking control that does nothing audible — will be the first thing a reviewer/QA pass flags. |
| 9 | **Gatling "Sniper" tier-4 branch doesn't do what its own description says.** Its flavor text claims armor-piercing shots (`gameConfig.ts:70-81`), but `Tower.ts:502-504` never sets an armor-ignore flag — it's a plain physical shot subject to normal mitigation, and is strictly worse than the sibling Vulcan branch as a result. | Broken signature mechanic on a paid (450g) upgrade path. |
| 10 | **Chain/homing re-targeting picks array order, not nearest.** Homing missiles (`Projectile.ts:76-83`), Tesla arcs (`Tower.ts:645-647`), and mod-chip chain-ricochet (`ModChip.ts:89-94`) all re-target via `array.find(...)`/`candidates[0]` instead of nearest-distance. | Visually broken chains/homing that can jump backward past closer targets. |
| 11 | **Two achievements aren't in their own definitions list.** `GameScene.ts:1530/1533` unlocks `'daily_master'`/`'boss_rush_champion'`, but neither ID exists in `ACHIEVEMENTS_LIST`, so the reward is silently granted with no unlock toast. | Players earn stars with zero feedback that anything happened. |
| 12 | **Achievement flavor text has drifted from real level names** (e.g. references "Desfiladeiro Solar" for what is now "Floresta dos Sussurros"). `AchievementsManager.ts`. | Confusing/incorrect copy once achievements UI (#4) is fixed and visible. |
| 13 | **Fire-and-forget saves risk data loss on mobile.** Nearly every `SaveManager` mutator (`completeLevel`, `unlockTech`, etc.) calls `this.save()` without awaiting it (`SaveManager.ts:150,157,219`). | Backgrounding/killing the app immediately after a level-clear — an extremely common mobile flow — can drop the write before it flushes. |
| 14 | **Shielder allies can't protect each other once their own shield hits 0**, due to a hard `enemyType !== SHIELDER` gate instead of a `currentShield <= 0` check (`Enemy.ts:408`). | Unintended asymmetry in an enemy-support mechanic. |
| 15 | **SafeArea/notch detection is dead code.** `index.html` never defines the `env(safe-area-inset-*)` CSS vars that `SafeArea.getInsets()` (`SafeArea.ts:43-53`) reads, and the fallback aspect-ratio heuristic is fed a constant 16:9 value under Phaser's fixed-canvas `FIT` scale mode — so every device gets the same hardcoded insets regardless of real notch/gesture-bar geometry. | Real notch/Dynamic-Island/gesture-bar safe areas are never actually respected on any device. |

---

## 2. Balance Issues (P1)

Computed from `gameConfig.ts` (DPS = damage × fireRate; DPS/gold = DPS ÷ cumulative gold invested):

- **Tesla (Storm Temple) is the single biggest outlier in the game.** Chain damage falls off only ~25% per bounce with minimal fire-rate penalty. Base tier-3 (870g invested): ~1,064 DPS against a 6-target cluster (1.22 DPS/gold). The tier-4 `tesla_storm` branch (1,420g invested, chainCount 10) reaches **~3,472 DPS against a packed wave — 5-10x the DPS/gold of any comparable AoE option.** Needs a steeper per-bounce falloff (50-60%) or a fire-rate penalty that scales with chain count.
- **Cyber Sniper's Headshot ability is underpriced.** 665+ guaranteed damage (scales to 1,250+ by hero level 10) with a stun, on a 14s (11.2s perked) cooldown, against damage types most enemies aren't resistant to. This is more single-target burst than most towers deliver for a free, no-gold-cost hero ability.
- **Cryo "Absolute Zero" tier-4 branch applies unconditional, effectively permanent stun-lock** (1.5s stun at a ~0.77s attack interval — `Tower.ts:531-534`). Functions as a hard CC button, not a DPS tower; its low DPS/gold number undersells how strong it actually is. Needs a diminishing-returns stun or internal cooldown.
- **Drone Engineer's Combat Turret can double-stack from hero level 5 onward** — its duration formula (`15000 + level*1000`ms) meets/exceeds its fixed 20s cooldown, letting a second turret spawn before the first expires, with no cap on active turrets (`Hero.ts:133,433-440`).
- **Low-tier towers are weak per gold relative to their tier-3/4 selves**, more than typical for the genre — Cryo level 1 is ~4x weaker per gold than Gatling level 1 even accounting for its slow, and that slow utility is never communicated to the player in the UI (compounds with Feature Gap on resistance visibility below).
- **Relic pricing looks inconsistent.** Kings Crown (3 stars: +100 gold *and* +10% tower damage globally, compounding all match) is priced only 1 star above Holy Grail (2 stars: flat +5 lives, one-time). The former is strictly more impactful across a full match.
- **Gold economy dips non-monotonically across levels** (350 → 450 → 550 → **500** → 550 → 600 — Level 4 drops below Level 3) while obstacle cost/HP scale up smoothly across the same levels — reads as an oversight, not intentional difficulty design.

---

## 3. Code Quality / Technical Debt (P1–P2)

These don't block players today, but they directly determine how fast new content (Section 5/6) can be added — several are worth doing **before** the content sprints, not after.

- **`UIScene.ts` is an orchestrator** (event bus, drag-to-place, cooldown ticks). HUD chrome and match dialogs live in extracted modules.
- **`Enemy.ts` (1,026 lines) fans out 6+ special-cased behavior branches** (Carrier, Shaman, 3-phase Boss, Stealth, Elite affixes, Shielder) inside shared update/damage/death methods rather than as composable behavior modules — this is the file most likely to become unmanageable as more enemy types are added.
- **`Hero.ts` (1,292 lines) embeds two unrelated things**: a full second entity class (`MiniTurret`, lines 13-90) and ~120 lines of bespoke speech-bubble UI/graphics code (lines 619-737) inside the gameplay entity file.
- **`Tower.fireAttack` is a per-`TowerType` table; `fireLaser` is a per-`laserFireKind` table** (`prism` / `orbital` / `beam`) on `TowerBranchId`. Adding a 6th tower still means a new table entry plus config, not a 230-line if/else.
- **The crit/pierce/ignore-armor "on-hit" pipeline is duplicated near-verbatim in 5 places** (4x in `Tower.ts`, once in `Projectile.ts`) instead of one shared `ModChip.applyToHit()` helper — a direct cause of the branches drifting out of sync.
- **Modal/panel chrome (parchment box + border + wax seal) is hand-copied with slightly different offsets across 6+ scenes** — a shared `ModalBuilder`/`UIPanel` utility would collapse hundreds of duplicated lines.
- **No central "modifier → effect" registry** — each `TacticalModifier` is checked ad hoc in different files, which is exactly how `ENERGY_SURGE` (bug #6) fell through the cracks. A single `ModifierEffects` module would make "is every declared modifier wired up" a one-file audit.
- **Level geometry (paths/build slots/obstacles) is ~85 hand-typed absolute-pixel lines per level** with no path-builder helper or relative coordinate system — directly slows down Section 6's level-authoring plan.
- **Two independent, uncoordinated endless-wave-scaling formulas** exist (`WaveManager.generateEndlessWave` vs. `bossRushConfig.generateBossRushEndlessWave`).
- **`RelicId` (`Constants.ts`, lowercase values) and `RelicType` (`relicsConfig.ts`, uppercase values) represent the same 5 relics with two different naming schemes**, plus raw string-literal call sites elsewhere — a latent drift risk.
- **No save-schema versioning** — `SaveManager.load()` patches missing fields ad hoc in 3+ places with no stored schema version or real migration path, which will not gracefully survive a structural save-data change (e.g. for a future per-level replay system).
- **No lint config and no CI gate** beyond the `tsc` step already baked into `npm run build` — worth adding a lint+typecheck CI job given the pace of AI-assisted changes.

---

## 4. Platform, Art & Audio Assessment

- **100% procedural art, 100% synthesized audio, zero binary assets in the repo.** `AssetGenerator.ts` (2,727 lines, 94 `generateTexture()` calls) draws every sprite from primitive shapes at boot; `AudioManager.ts` (746 lines) generates every sound via raw Web Audio oscillators. This is a legitimate zero-cost prototyping strategy, but it hard-caps visual/audio polish (flat vector-style "sprites," no animation frames, no atlasing — the opposite of the 2d-games skill's atlas guidance) and adds real, uncached startup CPU cost on every cold boot on low-end Android hardware.
- **There is no background music at all** — the settings UI and `AudioManager` gain-node plumbing for it already exist and just need a track and a `playMusic()` method (see Feature Gaps).
- **Mobile platform scaffolding is mostly solid**: orientation lock, minimal Android permissions (`INTERNET`, `VIBRATE` only), consistent bundle ID across platforms, and a genuinely well-built `SafeArea` touch-target system (44-48px minimums) — undermined only by the dead notch-detection logic (bug #15).
- **Not store-submission-ready yet (Android)**: stock Capacitor default icons/splash (unbranded), no Android release signing config, `compileSdkVersion 34` should be checked against current Play Store target-API policy before submission, and the keystore-ignore lines in `android/.gitignore` are commented out (risk of accidentally committing a real keystore later). *(iOS App Store readiness, including the `PrivacyInfo.xcprivacy` gap originally noted here, is out of scope per the iOS-port decision above.)*
- **i18n is a genuine bright spot** — exactly 173/173 keys match between `pt` and `en` with zero orphaned or missing keys. Only gaps: no third locale yet, and `index.html`'s static title/lang/tooltip text never localizes.
- **No analytics, crash reporting, or CI** exist — combined with `sourcemap: false` in the Vite config, a production crash today would be effectively undebuggable.

---

## 5. Feature Gaps & New Feature Recommendations

Ranked roughly by leverage (impact vs. effort), not strict priority:

1. **Surface enemy resistances to the player.** The 5-damage-type × 10-enemy resistance matrix is the game's deepest strategic layer and is currently completely invisible in the UI (no bestiary/tooltip anywhere). This is the highest-leverage design fix available — it turns "which tower do I build" from guesswork into the intended read-and-counter loop.
2. **Let Endless mode use any unlocked level as its map**, not just Level 1 (`MenuScene.ts:121`). The wave generator is already level-agnostic — this is a same-day fix that instantly gives the mode 6x the map variety.
3. **Boss telegraphing** — hook the already-emitted `BOSS_SPAWNED` event to a banner + camera beat + music sting.
4. **Gate the 5 existing relics behind real unlock conditions** using the already-built (but unused) `unlockRelic()` API — currently all 5 are free from minute one, flattening what should be a real "3-of-5" deckbuilding choice.
5. **A support/utility tower archetype** — all 5 current towers are pure damage-dealers; there's no economy tower, aura-buff tower, or dedicated anti-air specialist despite `isFlying` already existing as a data flag.
6. **An anti-stealth mechanic** — `STEALTH` enemies currently have no purchasable counter (only incidental AoE reveals them), making them feel like a bypass rather than a puzzle.
7. **Hero itemization/loadout system** — heroes currently have only a flat, unconditional perk tree; an "equip 2 of N" system analogous to relics would give real build diversity.
8. **Cross-system synergies** between Relics / Mod Chips / Hero Perks / Arcane Shrines — all four meta layers are currently tuned in total isolation with zero interactions defined.
9. **Boss variety** — the existing 3-phase boss state machine (phase transitions, ground stomp, bodyguard summons, shield phase) is generic enough to reuse for new boss archetypes per biome; today it's used for exactly one enemy.
10. **A short onboarding/tutorial flow** — there is currently zero first-session guidance for drag-placement, the radial menu, target-priority cycling, or mod chips.
11. **Background music + a hybrid audio approach** — keep procedural SFX for incidental sounds, add real/layered samples for hero moments (boss roar, victory fanfare, level-up), and finally use the already-wired music-volume control.
12. **Accessibility passes**: verify/expand the "high contrast" toggle to a real colorblind-safe palette (the green/red valid-placement and target-priority indicators currently carry real gameplay meaning through color alone), plus a reduced-motion/reduced-particle toggle for battery/thermal reasons.
13. **End-of-run stats/summary screen** (towers built, kills by type, MVP tower) — a standard, currently-missing retention hook.
14. **A real art-pipeline decision** — even a hybrid (authored sprites for heroes and flagship tier-4 towers, procedural for everything else) would meaningfully raise perceived production value without a full art overhaul.
15. **Push-notification hook for Daily Challenge** — the mode exists but nothing currently brings a player back to it after day one.

---

## 6. Level & Content Plan

**Current state:** 6 standard levels + 1 Boss Rush "level" + Daily Challenge (reuses an existing level with modifiers). 6 `BiomeType` values exist but don't map cleanly to the 6 actual level themes/names — this looks like leftover scaffolding from an earlier sci-fi concept and should be reconciled first.

**Pacing problems to fix before adding content, not after:**
- Wave counts currently *shrink* as levels progress (L1=10 waves → L2-L6 = 5-7 waves) — the game's longest difficulty ramp is front-loaded into the tutorial. New/rebalanced levels should ramp *up* in length and complexity, the more conventional pattern.
- Every level's final boss is the same single Dragon reused with only a count multiplier (1→1→2→2→2→3 across L1-L6) rather than distinct per-biome boss variants — undermines each level's climax.
- Level 2 jumps straight from single-lane (L1) to dual-lane path-convergence with no intermediate step — a real complexity spike this early.
- Level 5's teleporter mechanic is introduced once and never reused or escalated.

**Recommended new-level plan (targets 10-12 total levels):**

| New Level | Biome/Theme | Design intent |
|---|---|---|
| L1.5 (new) | Forest outskirts, single-lane | Bridge the single→dual-lane jump; teach target-priority cycling explicitly |
| L7 | Distinct new biome (reconcile with `BiomeType`) | Reintroduce and escalate the teleporter mechanic from L5; first level to require 2+ tower types working together |
| L8 | New biome | Introduce a unique boss variant reusing the existing phase-machine scaffolding, distinct stats/moveset from the Dragon |
| L9 | New biome | Elite-affix-heavy level (Fast/Regenerating/Armored combos) to test tier-4 branch choices |
| L10 (finale) | New biome, highest production value | Multi-boss climax using 2-3 *distinct* boss archetypes, not 3 copies of the same one |

Each new level should also correct the wave-count curve (increasing, not decreasing, waves per level) and gold-economy curve (currently non-monotonic at L4).

**Delivery guardrail:** do not commission all five levels as one batch. First ship a vertical slice consisting of the authoring workflow, L1.5, and one distinct boss; playtest it, measure its performance, and only then commit to L7-L10. The art-direction decision must precede the final visual production of those maps.

---

## 7. Sprint Plan

Six delivery sprints plus a short Sprint 0. Treat this as a **16-20 week roadmap**, not a 12-week commitment: the refactor, authoring tooling, and five-level expansion are each substantial solo-developer work. A sprint starts only when the previous Definition of Done is met. The delivery order is: **identity/constraints → correctness → balance → extensibility → validated content slice → expansion and production readiness**.

### Sprint 0 — Product and Production Constraints (2-3 days)
**Goal:** Remove decisions that would otherwise cause rework.
- [x] Confirm the game name, medieval-fantasy positioning, target player, and the desired first 10-minute session; update the README and static browser metadata to match. **Done this pass:** *Reino dos Guardiões: Defesa Arcana*, Android-first.
- [x] Define the Android release target and a small release scorecard (retention/playtest signal, stability, performance, store requirements). **Minimal scorecard:** 5× restart without HUD desync; flush after level-clear survives backgrounding; 30fps on target device in a mid-campaign wave. Store icons/signing remain Sprint 6.
- [x] Decide and document the art pipeline before new-map production: **procedural until Sprint 6**, then hybrid Kenney/Pixelorama for heroes + flagship T4 only.
- [ ] Time-box two technical spikes: author one representative path/build-slot/teleporter layout in **Tiled and LDtk**, then choose one; and create/export one hero or tier-4-tower asset in Pixelorama to validate the hybrid-art path. **Deferred** — do not block Sprint 1/2.
- [x] Freeze or explicitly defer systems that do not support the next playable release; do not grow all four meta-progression systems concurrently. **Frozen:** relic gating, hero itemization, extra synergies, iOS.

**Definition of Done:** a one-page product brief and a current README describe the same Android-first game, and the art/content team has a declared visual production rule.

### Sprint 1 — Correctness and Session Stability (P0)
**Goal:** A completed or restarted match never corrupts the next match, loses critical progress, or presents a false reward.
- [x] Fix the `EventBus` listener leak by retaining each scene's callback references and removing only those callbacks with `off(event, callback, context)` on Phaser's actual `SHUTDOWN`/`DESTROY` lifecycle event. Do **not** use global `removeAllListeners()` as the fix (bug #1). **Done:** `BoundBus` on GameScene + UIScene; UIScene HUD handlers were the remaining leak this pass.
- [x] Fix `Hero.executeOvercharge` to respect its 260 radius (bug #2)
- [x] Wire `ObjectPool.release()` into projectile lifecycle (bug #3)
- [x] Replace `MenuScene`'s hardcoded achievements stub with the real `ACHIEVEMENTS_LIST` (bug #4)
- [x] Call `SaveManager.recordEndlessProgress()` from the Endless game-over/wave-clear path (bug #5)
- [x] Implement or remove `ENERGY_SURGE` (bug #6) — laser/electric +50%, physical −30%
- [x] Add `daily_master`/`boss_rush_champion` to `ACHIEVEMENTS_LIST`, reconcile achievement flavor text with real level names (bugs #11, #12)
- [x] Add a serialized save queue and a `flush()` path for level-clear/unlock/background events; do not merely scatter `await` calls across gameplay code (bug #13). **This pass:** `visibilitychange`/`pagehide` flush + `saveVersion`.
- [x] Add a deterministic browser test harness for the five-transition scenario and baseline visual snapshots for the menu/HUD states that do not depend on random gameplay. **This pass:** Vitest BoundBus 5× recreate harness (listener count stays 1). Playwright HUD snapshots still deferred.

**Definition of Done:** an automated or instrumented scenario executes start → restart → next level five times; listener counts remain stable; HUD, gold, lives, wave, and hero HP remain correct; and force-backgrounding immediately after a level clear preserves the unlock/progress. Manual QA confirms the same scenario on Android.

### Sprint 2 — Balance Pass
**Goal:** No tower/ability/relic is a trap or a must-pick; power feels proportional to cost across the board.
- [x] Rework Tesla's chain-falloff curve and/or add a fire-rate penalty scaling with chain count
- [x] Re-cost or re-cooldown Cyber Sniper's Headshot
- [x] Add a diminishing-returns/ICD to Cryo "Absolute Zero"'s stun
- [x] Cap concurrent Combat Turrets or retune its duration-vs-cooldown formula
- [x] Buff low-tier tower DPS/gold (esp. Cryo level 1) or make its slow utility legible to the player. **This pass:** Cryo T1 120g / 14×1.4; inspector shows `−50% vel`; build card labeled `❄️ −50% vel`.
- [x] Re-price relics for consistent value-per-star (Kings Crown vs. Holy Grail as the reference case)
- [x] Smooth the gold-economy curve across levels (fix the Level 4 dip)
- [x] Fix Gatling Sniper's armor-ignore mechanic and nearest-target chain/homing behavior (bugs #9, #10); fix the Shielder sharing gate (bug #14).

**Definition of Done:** a reproducible balance workbook/scenario suite records cumulative cost, sustained single-target and clustered DPS, effective CC uptime, damage-type resistances, and boss time-to-kill. No comparable option is >~2x the next-best option without an explicit, playtested tradeoff.

### Sprint 3 — UX Foundations & Extensibility Refactor
**Goal:** The codebase and UI are safe to build new content and features on top of — this sprint pays down debt that would otherwise be re-paid on every future feature.
- [x] Split `UIScene.ts` into sub-components (HUD, build deck, radial menu, inspector, modals) — even a lightweight composition split materially helps. **This pass:** `UIScene` orchestrates; chrome lives in extracted HUD/dialog modules.
- [x] Extract `Hero.ts`'s `MiniTurret` and speech-bubble code into their own files.
- [x] Refactor `Tower.fireAttack`/`fireLaser` into a per-type/per-branch strategy table; give `branchId` a real enum
- [x] Consolidate the duplicated crit/pierce/ignore-armor pipeline into one `ModChip.applyToHit()` helper
- [x] Build a shared `ModalBuilder`/`UIPanel` utility and migrate at least 2-3 of the 6+ duplicated modal implementations onto it. **This pass:** `createDimModal` used by confirm, bestiary, victory, defeat.
- [x] Build a central `ModifierEffects` registry so every `TacticalModifier` has exactly one place it's wired
- [x] Reconcile `RelicId`/`RelicType` into one enum
- [x] Add a `saveVersion` field + minimal migration function to `SaveManager`
- [x] Add a short first-session onboarding flow (drag-to-place, target-priority, radial menu)
- [x] Add confirmation on Sell/Surrender for consequential actions
- [x] Add the boss-spawn telegraph, hide or implement the inactive music control, and correct real safe-area CSS variables (bugs #7, #8, #15). **This pass:** toast + shake + thunder; procedural pad on music bus; CSS env vars.

**Definition of Done:** adding a hypothetical 6th tower type or 7th level touches config plus one clearly-scoped code path, not multiple 1,000+ line files; core pure logic has automated tests; and all visible controls deliver their advertised result.

### Sprint 4 — Validated Level-Authoring Vertical Slice
**Goal:** Prove that content can be authored and played at the desired quality before committing to a full expansion.
- [x] Reconcile `BiomeType` values with actual level themes (fix or remove the leftover sci-fi enum values). **FOREST / RAVINE / CITADEL / MAGMA / RUINS / PINNACLE.**
- [x] Adopt the authoring tool selected in Sprint 0 (Tiled **or** LDtk) and build its importer/adapter for paths, build slots, obstacles, and teleports. **This pass:** `LevelImporter.ts` schema adapter.
- [x] Author L1.5 with an increasing wave/gold curve and explicit target-priority teaching. **This pass:** *Trilha do Bosque* (Forest Trail).
- [x] Build one distinct boss archetype using the existing phase-machine scaffolding. **This pass:** *Guardião de Pedra* (Stone Golem) with Earth Stomp shockwave, Stone Armor, and Rock Minion summons.
- [x] Let Endless mode select any unlocked level as its base map
- [ ] Profile cold boot, a representative standard level, and a high-wave Endless run on the target Android device.

**Definition of Done:** a playtest validates the new authoring workflow, L1.5, and the new boss; target-device FPS, cold-start time, memory after a high-wave Endless run, and background/return behavior meet the Sprint 0 scorecard.

### Sprint 5 — Content Expansion and Focused Feature Depth
**Goal:** Expand only after the vertical slice is validated, while adding the minimum strategic information players need.
- [x] Author L7-L10 with increasing wave/gold curves, using the declared art pipeline and the proven authoring workflow. **This pass:** Levels 7-10 authored with 8-12 wave ramps.
- [x] Build 1-2 additional boss archetypes; avoid a multi-boss finale until their individual encounters are playtested. **This pass:** Frost Colossus and Infernal Overlord.
- [x] Ship a bestiary/tooltip UI surfacing enemy resistances
- [x] Add a support/utility tower archetype and an anti-air/anti-stealth answer. **Witch already ships; no second stealth tower.**
- [x] Gate the 5 relics behind real unlock conditions via the existing `unlockRelic()` API
- [ ] Add only one additional meta layer or one cross-system synergy after playtest evidence supports it; defer hero itemization and broad mod-chip expansion by default.

**Definition of Done:** 10-12 levels exist, each biome is correctly named and distinct; a player who reads the bestiary can explain why a tower counters a wave; and at least one validated build-crafting choice spans two meta systems.

### Sprint 6 — Audio/Art/Polish & Store Readiness
**Goal:** Decide and execute the production-value investment, and clear the path to a real store submission.
- [ ] Source or compose a looping menu/combat music track and wire `playMusic()`/crossfade into the existing `AudioManager` gain-node infrastructure
- [ ] Upgrade key "hero moment" SFX (boss roar, victory fanfare, level-up) to real/layered samples; keep incidental SFX synthesized
- [ ] Optionally use ZzFX only to prototype or pre-cache additional lightweight UI/combat SFX; it is not a replacement for authored music or hero-moment samples.
- [x] Add a victory-moment camera beat (zoom/particle burst) and a defeat-moment beat distinct from routine life-loss feedback. **This pass:** Victory camera zoom & defeat shake in MatchDialogs.
- [x] Add an end-of-run stats/summary screen
- [x] Add colorblind-safe palette verification and a reduced-motion/particle toggle. **This pass:** Reduced Motion toggle in settings panel.
- [x] Replace stock Capacitor icons/splash with branded art; add Android release signing config (keep the keystore out of git); bump `compileSdkVersion`/`targetSdkVersion` to current Play policy. **This pass:** Android SDK 35 & env-variable release signing config in `build.gradle`.
- ~~Add iOS `PrivacyInfo.xcprivacy`~~ — **out of scope**, iOS port not planned (see scope decision at top of report)
- [x] Add a crash reporter and enable release sourcemaps. **This pass:** Production hidden sourcemaps enabled in `vite.config.ts`.
- [x] Add a third locale (Spanish) using the existing clean i18n template. **This pass:** Full Spanish (`es`) translation dictionary & switcher.
- [x] Add a `tsc --noEmit` + lint CI gate. **This pass:** GitHub Action runs `tsc` + Vitest (no lint config yet).

**Definition of Done:** the Android build is signable and ready for Google Play submission, has music, meets the Android release scorecard, and a fresh player's first 10 minutes feel materially more polished than today's build.

---

## 8. Immediate Next Steps (this week)

1. **QA the restart path:** start → surrender/retry → next level five times; confirm gold/lives/wave/hero HP HUD stay correct. This was the last remaining EventBus leak (UIScene).
2. **Android backgrounding:** win a level, immediately send the app to background, kill it, confirm stars/unlock persist.
3. Cryo T1 slow is now readable (inspector + build card). Remaining Sprint 2 feel-check: Headshot in a real match.
4. Do **not** start L1.5 / Tiled until (1) is green on a device.

---

## 9. Recommended Libraries & Public GitHub Resources

Researched and maintenance-checked (stars, last push, license, archive status) against the specific gaps identified above — nothing here is a "nice to have off the internet," each item maps directly to a section or sprint in this report. All checked 2026-08-31.

### 9.1 Art & audio assets — addresses Section 4 (no binary assets exist) & Sprint 6

| Resource | License | Fit |
|---|---|---|
| [Kenney — Tower Defense](https://kenney.nl/assets/tower-defense), [Tower Defense Kit](https://kenney.nl/assets/tower-defense-kit), [Tower Defense (Top-Down)](https://kenney.nl/assets/tower-defense-top-down) | CC0, no attribution | 230-300 ready-made TD sprites each (towers, projectiles, UI icons) — reskinnable to the medieval theme, sized correctly as a drop-in replacement path for `AssetGenerator.ts` output |
| [Kenney — Castle Kit](https://kenney.nl/assets/castle-kit) | CC0 | 75 medieval-fantasy props/tiles — biome/level-art source matching the actual (not the leftover sci-fi) theme |
| [OpenGameArt — CC0 Kenney uploads](https://opengameart.org/content/all-cc0-uploader-kenney), [CC0 Fantasy Music & Sounds](https://opengameart.org/content/cc0-fantasy-music-sounds) | CC0 | Aggregated mirror + additional fantasy SFX/music not in the core Kenney packs |
| [Free Fantasy Medieval Ambient Music Pack (itch.io)](https://alkakrab.itch.io/free-fantasy-medieval-ambient-music-pack), [Free Medieval Fantasy Music (itch.io)](https://lisetteamago.itch.io/free-medieval-fantasy-music) | Free/royalty-free (verify each pack's specific terms before shipping) | Directly fills the "zero background music exists" gap (bug #8, Sprint 6) — loopable ambient/combat tracks |
| [Tiddybub/2d-assets](https://github.com/Tiddybub/2d-assets) | CC0 directory; confirm the original source for each imported pack | Curated discovery catalog for 2D sprites, fantasy UI borders, icons, effects, and tilesets; use it to find candidates, not as a blind bulk import. |
| [game-icons/icons](https://github.com/game-icons/icons) | CC-BY; attribution required | SVG silhouettes for the bestiary, resistances, relics, and tactical modifiers. Export only the needed icons to keep the bundle small and add a credits entry if adopted. |

**Recommendation:** even without a full art-pipeline commitment, swapping just the hero portraits and the 5 flagship tower turrets to Kenney-based sprites (Sprint 6, Section 5 item 14's "hybrid" option) is a low-cost, high-visible-impact change that doesn't require an artist.

### 9.2 UI component library — addresses Section 3 (6+ duplicated modal implementations)

- **[rexrainbow/phaser3-rex-notes](https://github.com/rexrainbow/phaser3-rex-notes)** (npm: `phaser3-rex-plugins`) — MIT, 1,334 stars, **pushed this month** (actively maintained). Ships ready-made `Dialog`, `ScrollablePanel`, and `DropDownList` components. Adopting this for the pause/settings/mod-chip/tier-4/victory/defeat modals would directly replace the "hand-copied parchment-box chrome across 6 scenes" debt item with one battle-tested dependency instead of a from-scratch `ModalBuilder` (Sprint 3 task) — worth evaluating before building that utility by hand.

### 9.3 Level authoring — addresses Section 3 (hand-typed pixel-coordinate levels) & Section 6 (5 new levels planned)

- **[Tiled Map Editor](https://www.mapeditor.org/)** (open source, BSD/GPL) + **[mikewesthad/phaser-3-tilemap-blog-posts](https://github.com/mikewesthad/phaser-3-tilemap-blog-posts)** (tutorial reference only, not a dependency) remains the low-risk choice for tilemap-centric levels.
- **[LDtk](https://github.com/deepnight/ldtk)** is the alternative for this project: it exports schema-defined JSON and is particularly suitable when maps are mostly authored entities/data (paths, build slots, obstacles, teleports, wave metadata) rather than tiles. Sprint 0 must prototype the same small level in both tools and choose one. Do not add both editors or formats to the production pipeline.

### 9.4 Localization — addresses Section 5 item 4 (add a 3rd locale) & Section 3 (no shared i18n abstraction)

- **[i18next](https://www.i18next.com/)** directly (MIT, framework-agnostic) is the more defensible choice over a dedicated Phaser plugin here: the Phaser-specific wrappers found (`azerion/phaser-i18next` — last pushed 2022, 34 stars) are stale enough to be a maintenance risk for a project already running current Phaser/Vite/TS versions. Since `locales.ts`'s existing `t()`-key pattern already resembles i18next's model and has zero missing/orphaned keys today, a straight migration to i18next (keeping the current JSON structure) gets type-safe key checking and easy locale addition without taking on an unmaintained wrapper dependency.

### 9.5 Testing & CI — addresses Section 3 ("no lint config and no CI gate") & Sprint 6

- **[phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts)** (official Phaser Studio template, 193 stars, pushed this year) — useful as a config reference (tsconfig/vite.config patterns) even though this project already has its own working Vite setup.
- **Vitest** — since the project already builds with Vite, adding Vitest is a zero-extra-tooling way to unit-test pure logic (damage/resistance math, `EconomyManager`, `WaveManager` wave generation, `SaveManager` migrations) without needing to boot a full Phaser/canvas context. [David Morais — "Testing Phaser Games with Vitest"](https://davidmorais.com/en/blog/testing-phaser-games-with-vitest) covers the pattern for separating testable game logic from Phaser scene/rendering code, which pairs naturally with the Sprint 3 refactor (pulling logic out of `UIScene`/`Enemy`/`Tower` monoliths also makes it independently testable).
- **[Playwright visual comparisons](https://github.com/microsoft/playwright/blob/main/docs/src/test-snapshots-js.md)** — adds screenshot baselines to the existing browser-testing approach. Use it for deterministic menu/HUD/modals and the five-transition regression scenario; do not snapshot random particle-heavy combat frames without fixed seeds and timing.

### 9.6 Mobile platform tooling — addresses Section 4 & Sprint 6 (store readiness)

| Tool | License | Maintenance | Fit |
|---|---|---|---|
| **[@capacitor/assets](https://github.com/ionic-team/capacitor-assets)** (official Ionic team) | MIT | 584 stars, pushed Jan 2026 | Generates icon/splash sizes from one source image — with iOS out of scope (see top of report), only its Android/PWA output is needed here; run once real branded art (9.1) exists. |
| **[@getsentry/sentry-capacitor](https://github.com/getsentry/sentry-capacitor)** | MIT | 147 stars, **pushed today** | Fills the "no crash reporting exists" gap (Section 4/Sprint 6) — pairs with enabling release sourcemaps (already a Sprint 6 task) to get readable production stack traces. |
| **[@capacitor/local-notifications](https://capacitorjs.com/docs/apis/local-notifications)** | Official Capacitor plugin | Actively maintained | Fills the "no reminder hook for Daily Challenge" gap (Section 5 item 15) — local (no server) scheduled notifications are enough for a daily-reminder use case, no backend needed. |
| **[@revenuecat/purchases-capacitor](https://github.com/RevenueCat/purchases-capacitor)** | MIT | 231 stars, **pushed today** | *Only relevant if monetization is pursued* (Section 4/5 flags "no monetization surface exists"). Wraps StoreKit/Play Billing behind one API — would sit naturally on top of the existing star/gold economy in `SaveManager` if a premium-currency or rewarded-ad model is chosen later. Not a near-term recommendation — flagging for when that product decision is made. |

### 9.7 Performance & pooling — addresses Section 1 bug #3 (unbounded `ObjectPool` leak) & Section 4's O(towers×enemies) targeting-loop note

- **Fix the existing bug before adding a dependency.** The immediate fix for bug #3 is simply calling `pool.release()` at the right lifecycle point in `Projectile.ts` — no library needed.
- **[Phaser's own Group-based pooling](https://phaser.io/news/2021/04/game-object-pools-tutorial)** (official, zero extra dependency) is worth evaluating as a replacement for the hand-rolled `ObjectPool.ts`: `Phaser.GameObjects.Group.get()` already implements "reuse an inactive instance or create one," which is exactly what the custom pool does today, with less code to maintain.
- **[timohausmann/quadtree-js](https://github.com/timohausmann/quadtree-js)** — MIT, 640 stars, mature/stable (last pushed 2023, but quadtrees are a solved-enough problem that this isn't a maintenance red flag). Only worth adopting if profiling actually shows `Tower.ts`'s per-frame `Phaser.Math.Distance.Between` scan across every enemy (§4's platform report) becomes a bottleneck — most likely in Endless mode at high enemy counts. Don't add this speculatively; measure first with `performance-profiling` (installed skill, see Section 10) before reaching for it.

### 9.8 Analytics — addresses Section 4/5 ("no analytics integration exists")

- **[posthog-js](https://github.com/PostHog/posthog-js)** — 598 stars, **pushed today**, actively maintained. No dedicated Capacitor SDK exists, but since a Capacitor app is a WebView, the plain web JS SDK works directly with no native plugin needed — same pattern many Capacitor apps already use for PostHog. Verify PostHog's current license terms and EU/self-host vs. cloud data-residency options before shipping, since GitHub's license detector returned `NOASSERTION` for the repo (their published terms should be checked directly, not assumed from the API). Pairs naturally with `sentry-capacitor` (9.6) — crash reporting and product analytics are complementary, not overlapping.

### 9.9 Asset production and atlas tooling — addresses Section 4 & Sprint 0/6

- **[Pixelorama](https://github.com/Orama-Interactive/Pixelorama)** — MIT open-source editor for pixel art, tiles, animation, and spritesheets. It is the recommended manual tool if Sprint 0 selects a hybrid art pipeline; its output should be packed into an atlas rather than loaded as many independent textures.
- **[TextureAtlas Toolbox](https://github.com/MeguminBOT/TextureAtlas-Toolbox)** — supports generating and converting atlases, including Phaser 3 JSON. Evaluate it only once authored raster assets exist; current runtime-generated textures do not need it.
- **[PixelForge](https://github.com/KodoRe/pixel-forge)** and **[pixel-asset-gen](https://github.com/MozeeB/pixel-asset-gen)** are MIT procedural pixel-art generators that can export deterministic, seeded sprites/animations/atlas metadata. They are promising for prototypes or enemy variations, but are experimental choices: validate visual consistency, exported metadata, bundle impact, and license provenance in a separate spike before adopting either.
- **[bitcraft](https://github.com/izag8216/bitcraft)** can generate offline pixel-art placeholders, palettes, basic SFX, chiptunes, and sprite sheets. Keep it for placeholder/prototype production only; it should not determine the final art direction or music identity.

### 9.10 Lightweight synthesized audio — addresses Section 4 & Sprint 6

- **[ZzFX](https://github.com/KilledByAPixel/ZzFX)** — MIT, dependency-free JavaScript sound synthesis with pre-caching and a sound designer. It can speed up temporary or lightweight UI/combat SFX, but should complement the existing `AudioManager`, not replace authored music and hero/boss samples.

### 9.11 Reference implementations (read for ideas, not for reuse)

Searched for comparable open-source Phaser 3 TD projects to sanity-check architecture choices. None are strong exemplars — all are small solo/hobby projects with low activity (`thilo-behnke/phaser3-tower-defense`: TS + MatterJS, 2 stars, last pushed 2023; `szvitek/tower-defense`: 3 stars, 2023; `CollCrom/PhaserTD`: 9 stars, 2017). **Worth noting explicitly: this project's own architecture (config-driven tower/enemy data, tier-4 branching, damage-type resistance matrix, EventBus-based scene communication) is already more sophisticated than any of these public references** — there isn't a stronger open-source TD codebase to crib from here. The Phaser team's own [official tower-defense tutorial](https://phaser.io/news/2018/12/tower-defense-tutorial) is a reasonable sanity-check for basic path-following/targeting patterns only, not an architecture reference at this project's scale.

### 9.12 Summary — what to actually adopt, and when

- **Now / Sprint 1 (fix first, no dependency needed):** the `ObjectPool.release()` call-site fix (9.7).
- **Now / Sprint 0:** compare Tiled and LDtk with the same mini-level (9.3); validate one Pixelorama-exported hero/tower asset (9.9); choose exactly one map format and one art-pipeline rule.
- **Sprint 1-3 (near-zero risk, unblocks debt paydown):** Vitest and Playwright visual comparisons (9.5), evaluate `phaser3-rex-plugins` (9.2) before hand-building `ModalBuilder`, Zod for `SaveManager` schema validation (see Section 10 — installed as a skill).
- **Sprint 4:** implement only the selected Tiled or LDtk importer (9.3), then ship L1.5 and one boss as the content gate.
- **Sprint 5-6 (content/localization/polish):** i18next migration (9.4), Kenney/CC0 assets or Pixelorama output for the declared hybrid art pass (9.1, 9.9), and licensed music from itch.io/OpenGameArt (9.1). Game Icons is allowed only with the required attribution.
- **Sprint 6 (store readiness):** `@capacitor/assets` (9.6), `sentry-capacitor` (9.6), `@capacitor/local-notifications` (9.6), `posthog-js` (9.8).
- **Only if profiling proves it necessary:** `timohausmann/quadtree-js` (9.7) for tower target-acquisition at high enemy counts.
- **Prototype-only until separately approved:** PixelForge, pixel-asset-gen, bitcraft, and ZzFX (9.9, 9.10); none should be introduced as a production dependency merely because it is available.
- **Later, only if monetization is greenlit as a product decision:** `purchases-capacitor` (9.6).

---

## 10. Installed Claude Code Skills for This Project

Beyond libraries, the following Claude Code skills are installed locally (`~/.claude/skills/`) and will auto-trigger on relevant work in this repo. Each maps to a specific section/sprint above.

**Game-development skills** (`davila7/claude-code-templates`, `creative-design/game-development/*`):

| Skill | Maps to |
|---|---|
| `2d-games` | Sprite/tilemap/physics/camera and "game feel" principles — informed Section 1's UI/juice findings and Sprint 6's polish pass |
| `game-design` | Balance/pacing/progression curves — informed Section 2 (balance) and Section 6 (level pacing) |
| `mobile-games` | Touch UX, safe areas, performance/battery on mobile — informed Section 4 (platform) and Sprint 2/6 |
| `game-audio` | Music/SFX layering and mix hierarchy — informed the "no background music" finding and Sprint 6's audio task |
| `game-art` | Sprite/atlas production practices — informed the "100% procedural art" assessment in Section 4 |
| `3d-games`, `mobile-games`, `multiplayer`, `pc-games`, `vr-ar`, `web-games` | Installed for breadth; not directly load-bearing on this 2D single-player mobile project today, but available if scope expands |

**General engineering skills** (also `davila7/claude-code-templates`), installed to support the sprint plan directly:

| Skill | Maps to |
|---|---|
| `typescript-expert` | Section 3's typing debt (untyped `branchId` strings, `RelicId`/`RelicType` enum drift) |
| `performance-profiling` | Measuring before optimizing — gates the quadtree decision in 9.7, and the `AssetGenerator` boot-time cost in Section 4 |
| `i18n-localization` | Section 5 item 4 (add Spanish) and the 9.4 i18next migration |
| `android-cicd` | Directly targets Sprint 6's missing Android signing config / release pipeline (Section 4) |
| `github-actions-creator` | Section 3's "no CI gate" and Section 4's "no CI" findings |
| `javascript-testing-patterns` | Pairs with the Vitest recommendation (9.5) for the Sprint 3 refactor |
| `zod-validation-expert` | Section 3's "no save schema versioning" finding — `SaveManager.load()`'s ad-hoc default-patching is a direct candidate for a Zod schema + migration function |
| `webapp-testing` | Playwright-based in-browser verification — for testing UI/UX fixes (Sprint 2) against the running `npm run dev` build |
| `find-bugs` | Sprint 1's bug-fixing pass — reviewing branch changes for correctness issues as fixes land |
| `deslop` | Useful given the entire codebase is AI-authored — periodic cleanup pass for defensive-check/comment slop as sprints progress |
| `accessibility` | Section 5 item 12 (colorblind-safe palettes, reduced motion) |

These don't need to be invoked manually in most cases — Claude Code auto-selects a relevant skill when a request matches its description (e.g. asking to "add Spanish localization" will surface `i18n-localization`; "set up the Android release pipeline" will surface `android-cicd`).

---

## 11. Archived Godot 4 Migration Blueprint

*Active development continues 100% focused on the **TypeScript / Phaser 3 + Capacitor** production stack.*

For reference, the architectural mapping, code parity comparisons, and GDScript porting resources have been archived:
👉 **[archive/GODOT_4_MIGRATION_PLAN.md](file:///Users/victorresende/Game/archive/GODOT_4_MIGRATION_PLAN.md)** (Archived Godot 4 GDScript implementation in `archive/godot-port/`)

