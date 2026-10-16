/**
 * src/ui/UIManager.js
 * HTML UI controller — mounts/unmounts all screens over the canvas.
 */

import { EventBus }   from '../core/EventBus.js';
import { EVENTS, UI,
         COLORS }     from '../utils/Constants.js';
import { GAME }       from '../utils/Constants.js';

export class UIManager {
  constructor() {
    this._root    = document.getElementById('ui-root');
    this._screens = new Map();
    this._current = null;
    this._injectStyles();
    this._registerEvents();
  }

  register(name, el) {
    el.style.display = 'none'; el.style.opacity = '0';
    this._root.appendChild(el);
    this._screens.set(name, el);
  }

  show(name, instant = false) {
    const el = this._screens.get(name);
    if (!el) return;
    el.style.display = 'block';
    requestAnimationFrame(() => {
      el.style.transition    = instant ? 'none' : `opacity ${UI.PANEL_FADE}s ease`;
      el.style.opacity       = '1';
      el.style.pointerEvents = 'auto';
    });
    this._current = name;
  }

  hide(name, instant = false) {
    const el = this._screens.get(name);
    if (!el) return;
    el.style.transition    = instant ? 'none' : `opacity ${UI.PANEL_FADE}s ease`;
    el.style.opacity       = '0';
    el.style.pointerEvents = 'none';
    setTimeout(() => { el.style.display = 'none'; }, instant ? 0 : UI.PANEL_FADE*1000+50);
  }

  hideAll() { for (const [name] of this._screens) this.hide(name, true); }

  _registerEvents() {
    EventBus.on(EVENTS.GAME_READY, () => { this.show('main-menu'); }, { owner:'UIManager' });

    EventBus.on(EVENTS.GAME_OVER, ({ winnerID, isTie }) => {
      this.hide('hud');
      setTimeout(() => {
        if (isTie || winnerID !== GAME.PLAYER_1_ID) this.show('defeat-screen');
        else this.show('victory-screen');
      }, 800);
    }, { owner:'UIManager' });

    EventBus.on(EVENTS.MATCH_FOUND, () => { this._showMatchPopup(); }, { owner:'UIManager' });

    EventBus.on(EVENTS.TURN_START, ({ player }) => {
      const el = document.getElementById('turn-indicator');
      if (!el) return;
      el.textContent = player.type === 'cpu' ? 'CPU Thinking...' : 'YOUR TURN';
      el.style.color = player.id === 1 ? COLORS.PLAYER_1 : COLORS.PLAYER_2;
    }, { owner:'UIManager' });
  }

  _showMatchPopup() {
    const popup = this._screens.get('match-popup');
    if (!popup) return;
    popup.style.display   = 'flex';
    popup.style.opacity   = '0';
    popup.style.transform = 'scale(0.5)';
    popup.style.transition = 'none';
    requestAnimationFrame(() => {
      popup.style.transition = 'opacity 0.2s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
      popup.style.opacity    = '1';
      popup.style.transform  = 'scale(1)';
    });
    setTimeout(() => {
      popup.style.opacity = '0'; popup.style.transform = 'scale(1.1)';
      setTimeout(() => { popup.style.display = 'none'; }, 300);
    }, 1200);
  }

  _injectStyles() {
    if (document.getElementById('mu-styles')) return;
    const s = document.createElement('style');
    s.id = 'mu-styles';
    s.textContent = `
      #ui-root * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; user-select:none; }
      .mu-btn { font-family:'Baloo 2',cursive; font-weight:700; font-size:clamp(14px,4vw,18px); padding:14px 32px; border:none; border-radius:50px; cursor:pointer; letter-spacing:0.04em; transition:transform 0.08s ease; pointer-events:auto; }
      .mu-btn:active { transform:scale(0.93); }
      .mu-btn-primary { background:linear-gradient(135deg,${COLORS.PRIMARY},${COLORS.PRIMARY_DARK}); color:#fff; box-shadow:0 4px 20px rgba(245,158,11,0.4); }
      .mu-btn-secondary { background:rgba(255,255,255,0.08); color:${COLORS.TEXT_PRIMARY}; border:1px solid rgba(255,255,255,0.15); }
      .mu-panel { background:${COLORS.BG_PANEL}; border-radius:20px; border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
      .mu-title { font-family:'Baloo 2',cursive; font-weight:800; color:${COLORS.TEXT_PRIMARY}; text-shadow:0 2px 12px rgba(0,0,0,0.5); }
    `;
    document.head.appendChild(s);
  }
}
