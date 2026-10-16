/**
 * src/ui/screens/MainMenu.js
 */

import { EventBus }   from '../../core/EventBus.js';
import { SaveSystem } from '../../core/SaveSystem.js';
import { EVENTS, COLORS, APP } from '../../utils/Constants.js';

export class MainMenu {
  constructor(ui, audio) {
    this._ui = ui; this._audio = audio;
    this._el = this._build();
    this._ui.register('main-menu', this._el);
  }

  _build() {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:max(48px,env(safe-area-inset-bottom,0px) + 32px);pointer-events:none;`;

    const logo = document.createElement('div');
    logo.style.cssText = `position:absolute;top:max(60px,env(safe-area-inset-top,0px) + 40px);left:0;right:0;text-align:center;`;
    logo.innerHTML = `<h1 style="font-family:'Baloo 2',cursive;font-weight:800;font-size:clamp(42px,13vw,68px);letter-spacing:0.03em;color:#fff;text-shadow:0 0 40px rgba(255,150,50,0.6),0 4px 16px rgba(0,0,0,0.6);margin:0;">MATCH<span style="color:${COLORS.PRIMARY}">UP</span></h1><p style="font-family:'Baloo 2',cursive;font-size:clamp(11px,3vw,14px);letter-spacing:0.22em;color:rgba(255,220,140,0.7);margin:4px 0 0;">${APP.SUBTITLE}</p>`;

    const panel = document.createElement('div');
    panel.className = 'mu-panel';
    panel.style.cssText = `width:min(340px,90vw);padding:28px 24px;display:flex;flex-direction:column;gap:12px;pointer-events:auto;`;

    let profile, stats;
    try { profile = SaveSystem.get('profile'); stats = SaveSystem.get('statistics'); } catch(e) { profile = {}; stats = {}; }

    const badge = document.createElement('div');
    badge.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:4px;`;
    badge.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${COLORS.PRIMARY},${COLORS.SECONDARY});display:flex;align-items:center;justify-content:center;font-size:18px;">🎴</div><div><div style="color:${COLORS.TEXT_PRIMARY};font-family:'Baloo 2',cursive;font-weight:700;font-size:14px;">${profile?.name ?? 'Player'}</div><div style="color:${COLORS.TEXT_SECONDARY};font-size:11px;">${stats?.matchesPlayed ?? 0} matches played</div></div>`;

    const playBtn = this._btn('🃏  Play', 'mu-btn mu-btn-primary', () => {
      this._audio.playSFX('sfx_btn_tap');
      this._ui.hide('main-menu');
      EventBus.emit(EVENTS.BTN_QUICK_PLAY);
    });
    playBtn.style.fontSize = 'clamp(16px,4.5vw,20px)';

    const howBtn = this._btn('📖  How to Play', 'mu-btn mu-btn-secondary', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.show('how-to-play'); });
    const setBtn = this._btn('⚙️  Settings',    'mu-btn mu-btn-secondary', () => { this._audio.playSFX('sfx_btn_tap'); this._ui.show('settings'); });

    panel.appendChild(badge); panel.appendChild(playBtn); panel.appendChild(howBtn); panel.appendChild(setBtn);
    el.appendChild(logo); el.appendChild(panel);
    return el;
  }

  _btn(text, cls, fn) {
    const b = document.createElement('button');
    b.className = cls; b.innerHTML = text;
    b.addEventListener('click', fn);
    return b;
  }
}
