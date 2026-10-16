/**
 * src/ui/screens/HUD.js
 * In-game overlay — card counts, turn indicator, tap area, pause.
 */

import { EventBus }      from '../../core/EventBus.js';
import { EVENTS, COLORS, GAME } from '../../utils/Constants.js';

export class HUD {
  constructor(ui, audio) {
    this._ui = ui; this._audio = audio;
    this._p1CountEl = null; this._p2CountEl = null;
    this._el = this._build();
    this._ui.register('hud', this._el);
    this._registerEvents();
  }

  _build() {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;pointer-events:none;font-family:'Baloo 2',cursive;`;

    this._p2Badge = this._badge(2);
    this._p2Badge.style.cssText += `position:absolute;top:max(16px,calc(env(safe-area-inset-top,0px) + 8px));left:50%;transform:translateX(-50%);`;

    this._p1Badge = this._badge(1);
    this._p1Badge.style.cssText += `position:absolute;bottom:max(80px,calc(env(safe-area-inset-bottom,0px) + 70px));left:50%;transform:translateX(-50%);`;

    const turnEl = document.createElement('div');
    turnEl.id = 'turn-indicator';
    turnEl.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(12px,3vw,15px);font-weight:700;color:${COLORS.TEXT_PRIMARY};letter-spacing:0.06em;text-shadow:0 2px 8px rgba(0,0,0,0.8);background:rgba(0,0,0,0.35);padding:6px 16px;border-radius:20px;pointer-events:none;`;
    turnEl.textContent = 'YOUR TURN';

    const pauseBtn = document.createElement('button');
    pauseBtn.style.cssText = `position:absolute;top:max(16px,calc(env(safe-area-inset-top,0px) + 8px));right:20px;width:44px;height:44px;border-radius:50%;border:none;background:rgba(0,0,0,0.4);color:#fff;font-size:20px;cursor:pointer;pointer-events:auto;display:flex;align-items:center;justify-content:center;`;
    pauseBtn.textContent = '⏸';
    pauseBtn.addEventListener('click', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.show('pause-menu'); });

    this._tapArea = document.createElement('div');
    this._tapArea.style.cssText = `position:absolute;bottom:0;left:0;right:0;height:45%;pointer-events:auto;cursor:pointer;`;
    this._tapArea.addEventListener('click', () => { EventBus.emit('hud:tap_to_play'); });

    el.appendChild(this._p2Badge);
    el.appendChild(this._p1Badge);
    el.appendChild(turnEl);
    el.appendChild(pauseBtn);
    el.appendChild(this._tapArea);
    return el;
  }

  _badge(playerID) {
    const el = document.createElement('div');
    el.style.cssText = `display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.45);border-radius:50px;padding:8px 18px;border:1px solid rgba(255,255,255,0.12);backdrop-filter:blur(6px);`;
    const dot = document.createElement('div');
    dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${playerID===1?COLORS.PLAYER_1:COLORS.PLAYER_2};`;
    const label = document.createElement('span');
    label.style.cssText = `color:${COLORS.TEXT_PRIMARY};font-size:clamp(13px,3.5vw,16px);font-weight:700;`;
    label.textContent = playerID===1 ? 'P1' : 'P2';
    const count = document.createElement('span');
    count.style.cssText = `color:${COLORS.PRIMARY};font-size:clamp(15px,4vw,18px);font-weight:800;min-width:28px;text-align:center;`;
    count.textContent = '30';
    if (playerID===1) this._p1CountEl = count;
    else              this._p2CountEl = count;
    el.appendChild(dot); el.appendChild(label); el.appendChild(count);
    return el;
  }

  _registerEvents() {
    EventBus.on(EVENTS.GAME_START, ({ scores }) => {
      if (!scores) return;
      if (this._p1CountEl) this._p1CountEl.textContent = scores[GAME.PLAYER_1_ID] ?? 0;
      if (this._p2CountEl) this._p2CountEl.textContent = scores[GAME.PLAYER_2_ID] ?? 0;
    }, { owner:'HUD' });

    EventBus.on(EVENTS.PILE_AWARDED, ({ player }) => {
      const el = player.id===1 ? this._p1CountEl : this._p2CountEl;
      if (!el) return;
      el.style.transition = 'color 0.1s';
      el.style.color = '#fff';
      setTimeout(() => { el.style.color = COLORS.PRIMARY; }, 300);
    }, { owner:'HUD' });
  }

  setTapEnabled(enabled) {
    this._tapArea.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}
