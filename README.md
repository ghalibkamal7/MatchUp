# MatchUp 🃏

**The Classic Indian Matchbox Card Game — Reimagined**

A premium mobile web game built with Three.js, GSAP, and Howler.js.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Project Structure

```
src/
├── main.js                    ← App entry point
├── core/                      ← EventBus, StateManager, SaveSystem
├── utils/                     ← Constants, MathUtils, DeviceUtils
├── audio/                     ← AudioManager (Howler.js)
├── scenes/                    ← IntroScene, CinematicScene, SceneManager
├── world/                     ← Village environment (Three.js)
│   └── village/               ← BanyanTree, Terrain, Structures, Props
├── cards/                     ← Card, CardAnimator, CardTextureGenerator
├── players/                   ← Player, CPUPlayer, PlayerHand
├── gameplay/                  ← GameManager, TurnManager, MatchManager
├── ui/                        ← UIManager + all screens
└── effects/                   ← GlowEffect, CameraShake, ScreenFade
```

---

## Adding Real Audio

Drop MP3 files into `assets/audio/`:

```
assets/audio/
├── music/
│   ├── bg_village.mp3     ← Main background music (flute + tabla)
│   └── bg_menu.mp3        ← Menu music
└── sfx/
    ├── matchstick.mp3
    ├── card_lift.mp3
    ├── card_flip.mp3
    ├── card_place.mp3
    ├── match_freeze.mp3
    ├── match_win.mp3
    ├── pile_collect.mp3
    ├── deal.mp3
    ├── game_over.mp3
    ├── btn_tap.mp3
    ├── victory.mp3
    ├── birds.mp3
    └── wind.mp3
```

Audio system will automatically pick them up — no code changes needed.

---

## Adding Real Card Art

Replace Canvas-generated textures with PNG files:

1. Add PNGs to `assets/cards/final/` named: `ship.png`, `lion.png`, etc.
2. In `CardTextureGenerator.js`, update `_drawIll()` to use `ctx.drawImage()`
3. Register in `AssetLoader.js` registry (already listed)

Card dimensions: **256 × 380px**, vintage matchbox label style.

---

## Build for Android (APK)

```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Requires Android Studio installed.

---

## Game Rules

1. Both players receive equal cards (30 each from 60-card deck)
2. Players take turns placing one card face-up on the center pile
3. If the new card matches the picture of the previous card → **MATCH!**
4. The matching player wins the entire pile
5. The player with the most cards when all cards are played **wins**

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| Three.js | 3D village environment + card rendering |
| GSAP | All animations (card fly, fan, collect) |
| Howler.js | Audio management |
| Vite | Build tool |
| Capacitor | Android APK conversion |

---

## Debug Mode

In `src/utils/Constants.js`, set:

```js
DEBUG: {
  ENABLED:     true,   // Enable all logging
  SKIP_INTRO:  true,   // Skip matchstick intro
  SKIP_DEAL:   true,   // Skip deal animation
  FORCE_MATCH: true,   // Force every card to match (test match effects)
}
```

---

## License

MIT — Build anything you want with this.
