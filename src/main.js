/**
 * src/main.js
 * MatchUp — Application Entry Point
 */

import * as THREE          from 'three';
import { SceneManager }    from './scenes/SceneManager.js';
import { AudioManager }    from './audio/AudioManager.js';
import { UIManager }       from './ui/UIManager.js';
import { MainMenu }        from './ui/screens/MainMenu.js';
import { HUD }             from './ui/screens/HUD.js';
import { PauseMenu }       from './ui/screens/PauseMenu.js';
import { VictoryScreen }   from './ui/screens/VictoryScreen.js';
import { DefeatScreen }    from './ui/screens/DefeatScreen.js';
import { HowToPlay }       from './ui/screens/HowToPlay.js';
import { SettingsScreen }  from './ui/screens/SettingsScreen.js';
import { MatchPopup }      from './ui/screens/MatchPopup.js';
import { GameManager }     from './gameplay/GameManager.js';
import { GlowEffect }      from './effects/GlowEffect.js';
import { CameraShake }     from './effects/CameraShake.js';
import { ScreenFade }      from './effects/ScreenFade.js';
import { DeviceUtils }     from './utils/DeviceUtils.js';
import { EventBus }        from './core/EventBus.js';
import { SaveSystem }      from './core/SaveSystem.js';
import { EVENTS, DEBUG }   from './utils/Constants.js';

// ── WebGL Support Check ───────────────────────────────────────────────────────
// Try multiple context types — hardware WebGL, then software fallback (SwiftShader)

function getWebGLContext() {
  const canvas = document.createElement('canvas');
  const types  = ['webgl2', 'webgl', 'experimental-webgl'];
  for (const type of types) {
    try {
      const ctx = canvas.getContext(type, {
        failIfMajorPerformanceCaveat: false,  // KEY: allow software rendering
      });
      if (ctx) return { ctx, type };
    } catch(e) {}
  }
  return null;
}

function showWebGLError() {
  document.body.style.cssText = 'background:#0a0500;margin:0;padding:0;';
  document.body.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Baloo 2',Georgia,cursive;color:#fff8f0;text-align:center;padding:24px;background:#0a0500;">
      <div style="font-size:56px;margin-bottom:16px;">🃏</div>
      <h1 style="font-size:28px;color:#f59e0b;margin:0 0 16px;">MatchUp</h1>
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;max-width:360px;">
        <p style="color:#ef4444;font-size:15px;margin:0 0 16px;">⚠️ WebGL is not available</p>
        <p style="color:#d4a96a;font-size:13px;line-height:1.7;margin:0 0 16px;">
          <strong style="color:#fbbf24;">Fix for Chrome:</strong><br>
          Open a new tab, go to:<br>
          <code style="background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:4px;font-size:12px;">chrome://flags/#override-software-rendering-list</code><br>
          Set to <strong>Enabled</strong> → Relaunch
        </p>
        <p style="color:#d4a96a;font-size:13px;line-height:1.7;margin:0;">
          <strong style="color:#fbbf24;">Alternative:</strong><br>
          Start Chrome from terminal:<br>
          <code style="background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:4px;font-size:11px;display:block;margin-top:6px;">open -a "Google Chrome" --args --use-angle=swiftshader</code>
        </p>
      </div>
      <p style="font-size:12px;color:#6b5c4a;margin-top:20px;">Works perfectly in: Firefox · Safari · Brave</p>
    </div>
  `;
}

// ── Renderer ──────────────────────────────────────────────────────────────────

const glResult = getWebGLContext();
if (!glResult) {
  showWebGLError();
  throw new Error('[MatchUp] WebGL not available — see error screen for fix');
}

if (DEBUG.ENABLED) console.log(`[MatchUp] WebGL context: ${glResult.type}`);

const container = document.getElementById('canvas-container');

let renderer;

// Try renderer creation with progressively relaxed settings
const rendererConfigs = [
  { antialias: !DeviceUtils.isLowEndDevice, powerPreference: 'high-performance', alpha: false, failIfMajorPerformanceCaveat: false },
  { antialias: false, powerPreference: 'default', alpha: false, failIfMajorPerformanceCaveat: false },
  { antialias: false, alpha: false, failIfMajorPerformanceCaveat: false },
];

for (const config of rendererConfigs) {
  try {
    renderer = new THREE.WebGLRenderer(config);
    if (DEBUG.ENABLED) console.log('[MatchUp] Renderer created with config:', config);
    break;
  } catch(e) {
    if (DEBUG.ENABLED) console.warn('[MatchUp] Renderer config failed, trying next...', e.message);
  }
}

if (!renderer) {
  showWebGLError();
  throw new Error('[MatchUp] Could not create WebGL renderer');
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled   = true;
renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
renderer.outputColorSpace    = THREE.SRGBColorSpace;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// ── Core systems ──────────────────────────────────────────────────────────────

const audioManager = AudioManager;
try {
  SaveSystem.init();
} catch(err) {
  console.error('[MatchUp] SaveSystem initialization failed:', err);
}
const uiManager    = new UIManager();
const screenFade   = new ScreenFade();
const glowEffect   = new GlowEffect();

// ── UI screens ────────────────────────────────────────────────────────────────

new MainMenu(uiManager, audioManager);
const hud = new HUD(uiManager, audioManager);
new PauseMenu(uiManager, audioManager);
new VictoryScreen(uiManager, audioManager);
new DefeatScreen(uiManager, audioManager);
new HowToPlay(uiManager, audioManager);
new SettingsScreen(uiManager, audioManager);
new MatchPopup(uiManager);

// ── Scene Manager ─────────────────────────────────────────────────────────────

const sceneManager = new SceneManager(renderer, audioManager);

// ── Game flow ─────────────────────────────────────────────────────────────────

let gameManager = null;
let cameraShake = null;

EventBus.on(EVENTS.BTN_QUICK_PLAY, async () => {
  uiManager.show('hud');
  const cs = sceneManager.cinematicScene;
  if (!cs) return;
  const scene  = cs.scene;
  const camera = cs.camera;
  if (camera) cameraShake = new CameraShake(camera);
  gameManager = new GameManager({
    scene, audioManager, gameMode:'vs_cpu', difficulty:'medium',
  });
  await gameManager.init();
  audioManager.playMusic('mus_village');
  audioManager.playAmbience('amb_birds');
  audioManager.playAmbience('amb_wind');
});

EventBus.on('hud:tap_to_play', () => {
  gameManager?.humanPlayCard();
});

EventBus.on(EVENTS.BTN_PLAY_AGAIN, async () => {
  gameManager?.reset();
  await gameManager?.init();
  uiManager.show('hud');
});

EventBus.on(EVENTS.BTN_MAIN_MENU, () => {
  gameManager?.reset();
  gameManager = null;
  cameraShake?.destroy();
  cameraShake = null;
  uiManager.show('main-menu');
});

EventBus.on(EVENTS.GAME_RESET, () => {
  gameManager?.reset();
  gameManager = null;
});

// ── Resize ────────────────────────────────────────────────────────────────────

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  sceneManager.onResize(w, h);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 200));

// ── Render loop ───────────────────────────────────────────────────────────────

const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  const delta   = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  sceneManager.update(delta, elapsed);
  sceneManager.render();
}

// ── Boot ─────────────────────────────────────────────────────────────────────

async function boot() {
  try {
    DeviceUtils.init();
    audioManager.init();
    await sceneManager.init();
    tick();
    const bar = document.getElementById('loading-bar-container');
    if (bar) bar.classList.add('hidden');
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('hidden');
      splash.style.pointerEvents = 'none';
      splash.style.opacity = '0';
    }
    if (DEBUG.ENABLED) console.log('[MatchUp] Boot complete ✓');
  } catch(err) {
    console.error('[MatchUp] Boot failed:', err);
  }
}

boot();
