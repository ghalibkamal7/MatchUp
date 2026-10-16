/**
 * src/effects/ScreenFade.js
 * Full-screen fade in/out.
 */

export class ScreenFade {
  constructor() {
    this._el = document.createElement('div');
    Object.assign(this._el.style, {
      position:'fixed', inset:'0', background:'#000',
      opacity:'0', pointerEvents:'none', zIndex:'90', transition:'opacity 0.5s ease',
    });
    document.body.appendChild(this._el);
  }

  fadeOut(duration = 0.5) {
    return new Promise(r => {
      this._el.style.transition    = `opacity ${duration}s ease`;
      this._el.style.opacity       = '1';
      this._el.style.pointerEvents = 'auto';
      setTimeout(r, duration*1000+50);
    });
  }

  fadeIn(duration = 0.5) {
    return new Promise(r => {
      this._el.style.transition = `opacity ${duration}s ease`;
      this._el.style.opacity    = '0';
      setTimeout(() => { this._el.style.pointerEvents='none'; r(); }, duration*1000+50);
    });
  }
}
