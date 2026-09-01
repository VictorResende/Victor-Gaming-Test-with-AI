# Reino dos Guardiões: Defesa Arcana

Medieval-fantasy tower defense. Defend the realm with towers, a hero, and arcane magic.

**Ship target:** Android (Capacitor) plus the existing web/dev build. The iOS project in the repo is not a current release target.

**Art/audio:** Procedural sprites and synthesized SFX for now. Hybrid authored art and real music tracks are deferred until after the current maps are stable.

## Play loop

Place towers on build slots, upgrade them through three tiers (and a tier-4 branch), command a hero, and hold the path against waves. Gold, lives, and wave pressure are the 30-second loop; stars, relics, and the grimoire are the meta loop.

## Stack

Phaser 3 · TypeScript · Vite · Capacitor (Android)

## Run (web)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use landscape / mobile emulation for the intended layout.

## Android

```bash
npm run build
npx cap sync android
npx cap open android
```

## Product notes

See `docs/GAME_DIRECTOR_REPORT.md` for the living director plan, sprint status, and what is frozen.
