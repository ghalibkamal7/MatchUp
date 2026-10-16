/**
 * src/ui/screens/VictoryScreen.js
 */

import { EventBus }       from '../../core/EventBus.js';
import { EVENTS, COLORS } from '../../utils/Constants.js';

export class VictoryScreen {
  constructor(ui, audio) {
    this._ui = ui; this._audio = audio;
    this._scoreEl = null;
    this._el = this._build();
    this._ui.register('victory-screen', this._el);
    EventBus.on(EVENTS.GAME_OVER, ({ winnerID, scores }) => { this._update(winnerID, scores); }, { owner:'VictoryScreen' });
  }

  _build() {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;background:radial-gradient(ellipse at center,rgba(20,40,10,0.92) 0%,rgba(0,0,0,0.97) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;pointer-events:auto;`;

    const title = document.createElement('div');
    title.style.cssText = `font-family:'Baloo 2',cursive;font-weight:800;font-size:clamp(48px,15vw,80px);color:${COLORS.PRIMARY};text-shadow:0 0 40px rgba(245,158,11,0.6),0 4px 20px rgba(0,0,0,0.8);text-align:center;`;
    title.textContent = '🏆 Victory!';

    this._scoreEl = document.createElement('div');
    this._scoreEl.style.cssText = `color:${COLORS.TEXT_SECONDARY};font-family:'Baloo 2',cursive;font-size:clamp(14px,4vw,18px);text-align:center;`;

    const row = document.createElement('div');
    row.style.cssText = `display:flex;gap:14px;flex-wrap:wrap;justify-content:center;`;

    const playAgain = this._btn('Play Again','mu-btn mu-btn-primary', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.hide('victory-screen'); EventBus.emit(EVENTS.BTN_PLAY_AGAIN); });
    const menu      = this._btn('Main Menu', 'mu-btn mu-btn-secondary', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.hide('victory-screen'); this._ui.show('main-menu'); EventBus.emit(EVENTS.BTN_MAIN_MENU); });

    row.appendChild(playAgain); row.appendChild(menu);
    el.appendChild(title); el.appendChild(this._scoreEl); el.appendChild(row);
    return el;
  }

  _update(winnerID, scores) {
    if (this._scoreEl) this._scoreEl.textContent = `Player ${winnerID} wins with ${scores?.[winnerID] ?? '?'} cards!`;
  }

  _btn(text, cls, fn) {
    const b = document.createElement('button');
    b.className = cls; b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  }
}
