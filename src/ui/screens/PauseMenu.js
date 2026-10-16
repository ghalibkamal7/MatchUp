/**
 * src/ui/screens/PauseMenu.js
 */

import { EventBus }       from '../../core/EventBus.js';
import { EVENTS, COLORS } from '../../utils/Constants.js';

export class PauseMenu {
  constructor(ui, audio) {
    this._ui = ui; this._audio = audio;
    this._el = this._build();
    this._ui.register('pause-menu', this._el);
  }

  _build() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;pointer-events:auto;backdrop-filter:blur(4px);`;

    const panel = document.createElement('div');
    panel.className = 'mu-panel';
    panel.style.cssText = `width:min(300px,86vw);padding:32px 24px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;`;

    const title = document.createElement('h2');
    title.className = 'mu-title'; title.style.fontSize = '28px'; title.textContent = 'Paused';

    const resumeBtn = this._btn('▶  Resume', 'mu-btn mu-btn-primary', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.hide('pause-menu'); });
    const rulesBtn  = this._btn('📖  Rules', 'mu-btn mu-btn-secondary', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.show('how-to-play'); });
    const quitBtn   = this._btn('🏠  Quit',  'mu-btn mu-btn-secondary', () => {
      this._audio.playSFX('sfx_btn_tap');
      this._ui.hide('pause-menu'); this._ui.hide('hud'); this._ui.show('main-menu');
      EventBus.emit(EVENTS.GAME_RESET);
    });

    for (const b of [resumeBtn, rulesBtn, quitBtn]) { b.style.width='100%'; panel.appendChild(b); }
    panel.prepend(title);
    overlay.appendChild(panel);
    return overlay;
  }

  _btn(text, cls, fn) {
    const b = document.createElement('button');
    b.className = cls; b.innerHTML = text;
    b.addEventListener('click', fn);
    return b;
  }
}
