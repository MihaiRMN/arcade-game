# 🎮 Arcade Portal

A collection of 6 browser-based arcade games connected through a unified portal with shared progression, achievements, a shop, weekly cross-game events, and a procedural sound engine.

**🌐 Live:** [https://mihairMN.github.io/arcade-game/game-portal/index.html](https://mihairMN.github.io/arcade-game/game-portal/index.html)

---

## 🕹️ Games

| Game | Description |
|------|-------------|
| 🐍 **Snake** | Classic Snake with skins, power-ups, Classic / Time Attack / Maze modes, and revives |
| ⚡ **Ultra 2048** | Sliding tile puzzle with prestige, gacha shop, daily tasks, and tile milestones |
| 🧬 **Blob Evolution** | Multiplayer-style blob arena — choose an elemental form, evolve, and eat enemies |
| 🎰 **Arcade Bingo** | Solo & Jackpot Battle bingo with power cards, speed modes, and prize pools |
| ⚡ **Void Shift** | Grid-based strategy — merge same-type cells and push enemies with force lines |
| 🏰 **Tower Rush** | Tower defense with 6 elemental tower types, gacha pulls, merge system, 10 levels × 10 waves |

---

## ✨ Portal Features

### 👤 Player Profile
- Persistent nickname across all games
- XP & level system — earn XP from every game
- Level-up rewards with coin bonuses
- Prestige system in Blob Evolution and Ultra 2048

### 🪙 Coins & Shop
- Earn coins through gameplay, daily login, and achievements
- **Shop items:** Extra lives, Snake skins, Power-ups, Double XP Weekend, Prestige Boost, Event Token, Starter Pack, and more

### 🏆 Achievements
- 40+ achievements across all games and global categories
- Rarities: Common → Uncommon → Rare → Epic → Legendary
- Achievement unlock notifications with XP rewards
- Filterable by game (Snake, Ultra, Blob, Bingo, Void, Tower, Global)

### 📊 Statistics
- Per-game stats with CSS bar charts
- Fun facts: "You ate X apples in Snake!", "You spent X hours in Blob!" etc.
- Records tracking across all games

### 🔥 Weekly Cross-Game Events
Five rotating weekly events that boost specific mechanics across all games:

| Week | Event | Bonus |
|------|-------|-------|
| 0 | 🔥 Saptamana Focului | Fire effects boosted everywhere |
| 1 | 🌑 Noaptea Void | Void/Shadow mechanics buffed |
| 2 | ⚡ Furtuna Electrica | Speed & chain effects boosted |
| 3 | ❄️ Era Ghetii | Ice & slow mechanics enhanced |
| 4 | ✨ Lumina Divina | 2× XP everywhere, light buffs |

Events reset every Monday. Participating in 5 different events unlocks the **Event Chaser** achievement.

### 🔊 Sound Engine
Procedural Web Audio API sounds for every interaction — no audio files required:
- 40+ distinct sounds (UI clicks, game actions, achievements, game-specific effects)
- Master volume slider + mute toggle in portal header
- Settings persist in `localStorage` across all games

---

## 🛠️ Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript** — no frameworks, no build step
- **Canvas API** — Snake, Blob Evolution, Void Shift, Tower Rush rendering
- **Web Audio API** — procedural sound engine (`game-portal/sound-engine.js`)
- **localStorage** — all progress, settings, and stats saved client-side
- **GitHub Pages** — auto-deployed on push to `main`

---

## 📁 Structure

```
arcade-game/
├── game-portal/          # Portal hub (profile, shop, achievements, stats, events)
│   ├── index.html
│   ├── portal.js
│   ├── style.css
│   ├── sound-engine.js   # Shared Web Audio procedural sounds
│   └── background.js     # Animated portal background
├── Snake-Game/           # 🐍 Snake
├── 2048-game/            # ⚡ Ultra 2048
├── blob-game/            # 🧬 Blob Evolution
├── bingo-game/           # 🎰 Arcade Bingo
├── void-shift/           # ⚡ Void Shift
└── tower-rush/           # 🏰 Tower Rush
```

---

## 🚀 Running Locally

Just open `game-portal/index.html` in any modern browser — no server or build step needed.

```bash
git clone https://github.com/mihairMN/arcade-game.git
cd arcade-game
# Open game-portal/index.html in your browser
```

---

*Built with love using pure HTML/CSS/JS.*
