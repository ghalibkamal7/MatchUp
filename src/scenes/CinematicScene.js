/**
 * src/scenes/CinematicScene.js
 * Phase 2 — 3D village + camera dolly from wide shot to table angle.
 */

import * as THREE                from 'three';
import gsap                      from 'gsap';
import { EventBus }              from '../core/EventBus.js';
import { Village }               from '../world/Village.js';
import { Atmosphere }            from '../world/Atmosphere.js';
import { EnvironmentLighting }   from '../world/village/EnvironmentLighting.js';
import { cubicBezier3D,
         smootherStep }          from '../utils/MathUtils.js';
import { CAMERA, EVENTS,
         ANIM, DEBUG }           from '../utils/Constants.js';
import { DeviceUtils }           from '../utils/DeviceUtils.js';

const CAM_PATH = Object.freeze({
  P0: { x:0,  y:55, z:100 },
  P1: { x:-8, y:40, z:70  },
  P2: { x:4,  y:22, z:35  },
  P3: { x:0,  y:14, z:18  },
});
const LOOK_START = Object.freeze({ x:0, y:2, z:0  });
const LOOK_END   = Object.freeze({ x:0, y:0, z:0  });

export class CinematicScene {
  constructor(renderer) {
    this._renderer   = renderer;
    this._scene      = null;
    this._camera     = null;
    this._village    = null;
    this._atmosphere = null;
    this._lighting   = null;
    this._clock      = new THREE.Clock();
    this._active     = false;
    this._overlay    = null;
    this._buildError = false;
  }

  async start() {
    try {
      this._buildScene();
      this._buildWorld();
      this._buildFadeOverlay();
      this._active = true;
      this._playSequence();
      if (DEBUG.ENABLED) console.log('[CinematicScene] started');
    } catch(err) {
      console.error('[CinematicScene] Build error:', err);
      this._buildError = true;
      // Even on error, emit complete so game can still load
      setTimeout(() => {
        EventBus.emit(EVENTS.CINEMATIC_COMPLETE, { scene:this, camera:this._camera });
      }, 500);
    }
  }

  update(delta, elapsed) {
    if (!this._active || this._buildError) return;
    try {
      this._atmosphere?.update(delta, elapsed, this._lighting?.timeOfDay);
      this._lighting?.update(delta);
      this._village?.update(delta, elapsed);
    } catch(e) {}
  }

  render() {
    if (!this._active || !this._scene || !this._camera) return;
    try {
      this._renderer.render(this._scene, this._camera);
    } catch(e) {}
  }

  onResize(w, h) {
    if (!this._camera) return;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
  }

  transitionToMenu() {
    this._setCameraToEnd();
    if (DEBUG.ENABLED) console.log('[CinematicScene] → menu background');
  }

  destroy() {
    this._active = false;
    try {
      this._atmosphere?.destroy();
      this._village?.destroy();
      this._lighting?.destroy();
    } catch(e) {}
    this._overlay?.remove();
  }

  get scene()  { return this._scene;  }
  get camera() { return this._camera; }

  _buildScene() {
    this._scene = new THREE.Scene();
    this._scene.fog = new THREE.FogExp2(0xff9a3c, 0.008);
    this._camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA.NEAR,
      CAMERA.FAR
    );
    this._camera.position.set(CAM_PATH.P0.x, CAM_PATH.P0.y, CAM_PATH.P0.z);
    this._camera.lookAt(LOOK_START.x, LOOK_START.y, LOOK_START.z);
  }

  _buildWorld() {
    const isLowEnd = DeviceUtils.isLowEnd;

    this._lighting = new EnvironmentLighting(this._scene, { isLowEnd });
    this._lighting.build();

    this._village = new Village(this._scene, { isLowEnd });
    this._village.build();

    this._atmosphere = new Atmosphere(this._scene, {
      isLowEnd,
      treePosition: this._village.banyanPosition,
    });
    this._atmosphere.build();
  }

  _buildFadeOverlay() {
    // Remove any existing overlay first
    const existing = document.getElementById('cinematic-overlay');
    if (existing) existing.remove();

    this._overlay = document.createElement('div');
    this._overlay.id = 'cinematic-overlay';
    Object.assign(this._overlay.style, {
      position:'fixed', inset:'0', background:'#000',
      opacity:'1', zIndex:'50', pointerEvents:'none',
      transition:'none',
    });
    document.body.appendChild(this._overlay);
  }

  _playSequence() {
    const tl = gsap.timeline();

    // Fade in village from black
    tl.to(this._overlay.style, {
      opacity:  0,
      duration: ANIM.VILLAGE_FADE_IN,
      ease:     'power1.out',
    }, 0.3);

    // Camera dolly
    const progress = { t: 0 };
    tl.to(progress, {
      t:        1,
      duration: ANIM.CAMERA_DOLLY,
      ease:     'power2.inOut',
      onUpdate: () => {
        this._camT = progress.t;
        this._updateCamera(progress.t);
      },
      onComplete: () => {
        this._onCinematicComplete();
      },
    }, ANIM.VILLAGE_FADE_IN * 0.3);
  }

  _updateCamera(t) {
    if (!this._camera) return;
    const st  = smootherStep(t);
    const pos = cubicBezier3D(st, CAM_PATH.P0, CAM_PATH.P1, CAM_PATH.P2, CAM_PATH.P3);
    this._camera.position.set(pos.x, pos.y, pos.z);
    this._camera.lookAt(
      LOOK_START.x + (LOOK_END.x - LOOK_START.x) * st,
      LOOK_START.y + (LOOK_END.y - LOOK_START.y) * st,
      LOOK_START.z + (LOOK_END.z - LOOK_START.z) * st,
    );
  }

  _setCameraToEnd() {
    if (!this._camera) return;
    this._camera.position.set(CAM_PATH.P3.x, CAM_PATH.P3.y, CAM_PATH.P3.z);
    this._camera.lookAt(LOOK_END.x, LOOK_END.y, LOOK_END.z);
  }

  _onCinematicComplete() {
    if (DEBUG.ENABLED) console.log('[CinematicScene] dolly complete');
    setTimeout(() => {
      EventBus.emit(EVENTS.CINEMATIC_COMPLETE, { scene:this, camera:this._camera });
    }, 400);
  }
}
