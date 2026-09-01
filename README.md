# 🏰 Kingdom Defenders: Arcane Siege (Reino dos Guardiões: Defesa Arcana)

**Kingdom Defenders: Arcane Siege** is a 2D medieval-fantasy Tower Defense game created as a hands-on project to study **AI Gaming & Autonomous AI Coding (Google DeepMind Antigravity / Gemini)**.

---

## 🎯 Purpose of the Project

This codebase was developed to study, benchmark, and demonstrate modern **AI-assisted game development workflows**. It showcases how complex game systems — such as wave pathfinding, boss phase state machines, event buses, zero-GC object pooling, accessibility systems, and multi-language i18n — can be designed, implemented, and tested in pair programming with AI agents.

---

## 🎮 Game Overview & Key Features

- **Full 10-Stage Campaign**: Escalating wave pressure across 4 distinct biomes (*Forest, Citadel, Ravine, Magma Caldera, Pinnacle*).
- **Game Modes**:
  - **Campaign Mode**: 10 progressive maps with 3-star rating rewards.
  - **Boss Rush Arena**: Survival mode fighting continuous boss encounters.
  - **Daily Challenge**: Procedural daily matches with random tactical modifiers (*Double Cost, Fast Monsters, No Spells*).
- **Tower Defenses & Tier 4 Evolution**:
  - **4 Base Towers**: Archer Ballista, Bombard Cannon, Cryo Sanctuary, Arcane Laser.
  - **Level 1–3 Upgrades**: Range, damage, attack speed, and mod-chip slots.
  - **Tier 4 Legendary Branches**: Vulcan Ballista, Shadow Sniper, Greek Fire, Magma Mortar, Ancestral Blizzard, Cosmic Zero, Orbital Beam, Mana Prism, Storm Thunder.
- **Hero & Active Spells**:
  - Movable hero unit with active skills, XP progression, and level-up stat gains.
  - Arcane player spells: *Meteor Rain*, *Reinforcements*, and *Arcane Shield*.
- **Colossal Boss Encounters**:
  - **Stone Golem Boss**: Earthquake Stomp, Stone Armor, and Rock Minion summons.
  - **Frost Colossus Boss**: Glacial Storm stun waves and Ice Shielding.
  - **Infernal Overlord Boss**: Infernal Eruption speed frenzy and Magma Warriors.
- **Meta-Progression & Accessibility**:
  - **Ancestral Relics**: Star-unlocked relics (*King's Crown, Holy Grail, Dragon Heart, Shadow Blade, Time Hourglass*).
  - **Bestiary UI**: Tactical inspector showing enemy armor, magic resistance, and speed.
  - **Accessibility**: High Contrast UI mode and Reduced Motion toggle.
  - **Localization**: Full multi-language support (**Portuguese**, **English**, **Spanish**).

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Game Engine** | [Phaser 3.80](https://phaser.io/) (2D WebGL / Canvas) |
| **Language** | TypeScript (Strict mode) |
| **Build System** | [Vite 6](https://vitejs.dev/) |
| **Test Runner** | [Vitest](https://vitest.dev/) (16 test suites, 38 automated tests) |
| **Mobile Runtime** | [Capacitor 6](https://capacitorjs.com/) (Android SDK 35 target) |
| **Continuous Integration** | GitHub Actions Workflow (`tsc --noEmit` + Vitest) |

---

## 🚀 How to Run

### Web Development Mode

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied). Use landscape or mobile emulation mode for the intended mobile layout.

### Run Unit Test Suite

```bash
npm run test
```

### Build Production Bundle

```bash
npm run build
```

---

## 📱 Mobile Export (Android)

```bash
# 1. Build web distribution assets
npm run build

# 2. Sync web assets with Capacitor native shell
npx cap sync android

# 3. Open in Android Studio or compile APK/AAB
npx cap open android
# OR build signed release package via CLI:
cd android && ./gradlew assembleRelease
```

---

## 📚 Project Documentation

- **`docs/GAME_DIRECTOR_REPORT.md`**: Architectural director report, system evaluation, and sprint history.
- **`archive/GODOT_4_MIGRATION_PLAN.md`**: Archived Godot 4 GDScript reference plan.
