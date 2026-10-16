/**
 * src/ui/screens/DefeatScreen.js
 */

import { EventBus }       from '../../core/EventBus.js';
import { EVENTS, COLORS } from '../../utils/Constants.js';

export class DefeatScreen {
  constructor(ui, audio) {
    this._ui = ui; this._audio = audio;
    this._el = this._build();
    this._ui.register('defeat-screen', this._el);
  }

  _build() {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;background:radial-gradient(ellipse at center,rgba(40,10,10,0.92) 0%,rgba(0,0,0,0.97) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;pointer-events:auto;`;

    const title = document.createElement('div');
    title.style.cssText = `font-family:'Baloo 2',cursive;font-weight:800;font-size:clamp(42px,13vw,72px);color:${COLORS.SECONDARY};text-shadow:0 0 40px rgba(220,38,38,0.5),0 4px 20px rgba(0,0,0,0.8);text-align:center;`;
    title.textContent = '💔 Defeated';

    const sub = document.createElement('div');
    sub.style.cssText = `color:${COLORS.TEXT_SECONDARY};font-family:'Baloo 2',cursive;font-size:clamp(14px,4vw,18px);`;
    sub.textContent = 'Better luck next time!';

    const row = document.createElement('div');
    row.style.cssText = `display:flex;gap:14px;flex-wrap:wrap;justify-content:center;`;

    const retry = this._btn('Try Again','mu-btn mu-btn-primary', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.hide('defeat-screen'); EventBus.emit(EVENTS.BTN_PLAY_AGAIN); });
    const menu  = this._btn('Main Menu','mu-btn mu-btn-secondary', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.hide('defeat-screen'); this._ui.show('main-menu'); EventBus.emit(EVENTS.BTN_MAIN_MENU); });

    row.appendChild(retry); row.appendChild(menu);
    el.appendChild(title); el.appendChild(sub); el.appendChild(row);
    return el;
  }

  _btn(text, cls, fn) {
    const b = document.createElement('button');
    b.className = cls; b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  }
}
