/**
 * src/effects/CameraShake.js
 * Camera shake triggered on match events.
 */

import gsap        from 'gsap';
import { EventBus } from '../core/EventBus.js';
import { EVENTS, CAMERA } from '../utils/Constants.js';

export class CameraShake {
  constructor(camera) {
    this._camera  = camera;
    this._shaking = false;
    EventBus.on(EVENTS.MATCH_FOUND, () => this.shake(), { owner:'CameraShake' });
  }

  shake(intensity = CAMERA.SHAKE_INTENSITY, duration = CAMERA.SHAKE_DURATION) {
    if (this._shaking) return;
    this._shaking = true;
    const cam    = this._camera;
    const origin = { x:cam.position.x, y:cam.position.y, z:cam.position.z };
    const steps  = Math.floor(duration * CAMERA.SHAKE_FREQUENCY);
    const tl     = gsap.timeline({ onComplete: () => { cam.position.set(origin.x,origin.y,origin.z); this._shaking=false; } });
    for (let i=0;i<steps;i++) {
      const decay = 1 - i/steps;
      tl.to(cam.position, {
        x: origin.x+(Math.random()-0.5)*intensity*2*decay,
        y: origin.y+(Math.random()-0.5)*intensity*decay,
        z: origin.z+(Math.random()-0.5)*intensity*decay,
        duration: duration/steps, ease:'none',
      });
    }
  }

  destroy() { EventBus.clearOwner('CameraShake'); }
}
