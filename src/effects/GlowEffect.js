/**
 * src/effects/GlowEffect.js
 * Golden screen vignette on match events.
 */

import { EventBus }     from '../core/EventBus.js';
import { EVENTS, MATCH_FX } from '../utils/Constants.js';

export class GlowEffect {
  constructor() {
    this._el = document.createElement('div');
    Object.assign(this._el.style, {
      position:'fixed', inset:'0',
      background:`radial-gradient(ellipse at center,${MATCH_FX.MATCH_FLASH} 0%,transparent 70%)`,
      opacity:'0', pointerEvents:'none', zIndex:'25', transition:'opacity 0.15s ease',
    });
    document.body.appendChild(this._el);
    EventBus.on(EVENTS.MATCH_FOUND, () => this._flash(), { owner:'GlowEffect' });
  }

  _flash() {
    this._el.style.opacity = '1';
    setTimeout(() => { this._el.style.transition='opacity 0.5s ease'; this._el.style.opacity='0'; }, 300);
  }

  destroy() { EventBus.clearOwner('GlowEffect'); this._el.remove(); }
}
