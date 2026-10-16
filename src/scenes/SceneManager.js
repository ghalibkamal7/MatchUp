/**
 * src/scenes/SceneManager.js
 * Scene lifecycle manager — single render loop, clean transitions.
 */

import { EventBus }       from '../core/EventBus.js';
import { IntroScene }     from './IntroScene.js';
import { CinematicScene } from './CinematicScene.js';
import { SaveSystem }     from '../core/SaveSystem.js';
import { DeviceUtils }    from '../utils/DeviceUtils.js';
import { EVENTS, SCENES, DEBUG } from '../utils/Constants.js';

export class SceneManager {
  constructor(renderer, audioManager) {
    this._renderer       = renderer;
    this._audio          = audioManager;
    this._activeScene    = null;
    this._currentName    = '';
    this._cinematicScene = null;
    this._initialized    = false;
  }

  async init() {
    DeviceUtils.init();
    try { SaveSystem.init(); } catch(e) { console.warn('[SceneManager] SaveSystem init failed:', e); }
    this._registerEvents();
    if (DEBUG.SKIP_INTRO) {
      await this._startCinematic();
    } else {
      await this._startIntro();
    }
    this._initialized = true;
  }

  // Called every frame by main.js tick()
  update(delta, elapsed) {
    if (!this._activeScene) return;
    try {
      this._activeScene.update?.(delta, elapsed);
    } catch(e) {
      if (DEBUG.ENABLED) console.error('[SceneManager] update error:', e);
    }
  }

  // Called every frame by main.js tick()
  render() {
    if (!this._activeScene) return;
    try {
      this._activeScene.render?.();
    } catch(e) {
      if (DEBUG.ENABLED) console.error('[SceneManager] render error:', e);
    }
  }

  onResize(w, h) {
    try {
      this._activeScene?.onResize?.(w, h);
    } catch(e) {}
  }

  // ── Scene starters ───────────────────────────────────────────────────────

  async _startIntro() {
    this._currentName = SCENES.INTRO;
    const intro       = new IntroScene();
    this._activeScene = intro;
    // Don't await — intro runs on its own, emits event when done
    intro.play().catch(e => console.error('[IntroScene] play error:', e));
  }

  async _startCinematic() {
    this._currentName    = SCENES.CINEMATIC;
    const cinematic      = new CinematicScene(this._renderer);
    this._cinematicScene = cinematic;
    this._activeScene    = cinematic;
    // Don't await — cinematic runs GSAP timeline, emits event when done
    cinematic.start().catch(e => console.error('[CinematicScene] start error:', e));
  }

  _switchToMenuBackground() {
    // Village scene persists as menu background
    if (this._cinematicScene) {
      this._cinematicScene.transitionToMenu();
    }
    this._currentName = SCENES.MENU;
    // Remove cinematic fade overlay if still present
    const overlay = document.getElementById('cinematic-overlay');
    if (overlay) {
      overlay.style.transition = 'opacity 0.5s ease';
      overlay.style.opacity    = '0';
      setTimeout(() => overlay.remove(), 600);
    }
    EventBus.emit(EVENTS.GAME_READY);
    if (DEBUG.ENABLED) console.log('[SceneManager] → menu background');
  }

  // ── Event listeners ──────────────────────────────────────────────────────

  _registerEvents() {
    EventBus.on(EVENTS.INTRO_COMPLETE, async () => {
      if (DEBUG.ENABLED) console.log('[SceneManager] intro complete → cinematic');
      await this._startCinematic();
    }, { owner:'SceneManager' });

    EventBus.on(EVENTS.CINEMATIC_COMPLETE, () => {
      if (DEBUG.ENABLED) console.log('[SceneManager] cinematic complete → menu');
      this._switchToMenuBackground();
    }, { owner:'SceneManager' });
  }

  get currentScene()   { return this._currentName;    }
  get cinematicScene() { return this._cinematicScene; }
}
