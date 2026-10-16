/**
 * src/ui/screens/HowToPlay.js
 * Interactive step-by-step tutorial with progress dots.
 */

import { COLORS } from '../../utils/Constants.js';

const STEPS = [
  { emoji:'🃏', title:'Cards Are Dealt',  body:'Both players receive equal cards face-down in their hand.' },
  { emoji:'🔄', title:'Take Turns',       body:'Players take turns placing one card face-up in the center pile.' },
  { emoji:'✨', title:'Find The Match',   body:'If your card shows the SAME picture as the card below it — MATCH!' },
  { emoji:'🏆', title:'Win The Pile',     body:'The player who made the match wins ALL cards in the pile!' },
  { emoji:'🥇', title:'Win The Game',     body:'When all cards are played, the player with the most cards wins!' },
];

export class HowToPlay {
  constructor(ui, audio) {
    this._ui = ui; this._audio = audio;
    this._step = 0;
    this._el   = this._build();
    this._ui.register('how-to-play', this._el);
  }

  _build() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;pointer-events:auto;backdrop-filter:blur(6px);`;

    const panel = document.createElement('div');
    panel.className = 'mu-panel';
    panel.style.cssText = `width:min(360px,92vw);padding:32px 24px 24px;display:flex;flex-direction:column;align-items:center;gap:20px;position:relative;`;

    const close = document.createElement('button');
    close.style.cssText = `position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.08);color:#fff;font-size:16px;cursor:pointer;pointer-events:auto;`;
    close.textContent = '✕';
    close.addEventListener('click', () => { this._audio?.playSFX('sfx_btn_tap'); this._ui.hide('how-to-play'); });

    const header = document.createElement('h2');
    header.className = 'mu-title'; header.style.fontSize='22px'; header.textContent='How to Play';

    this._stepEl = document.createElement('div');
    this._stepEl.style.cssText = `text-align:center;min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;transition:opacity 0.2s ease;`;

    this._dotsEl = document.createElement('div');
    this._dotsEl.style.cssText = `display:flex;gap:8px;`;

    const navRow = document.createElement('div');
    navRow.style.cssText = `display:flex;gap:12px;width:100%;`;

    this._prevBtn = this._btn('← Back','mu-btn mu-btn-secondary', () => { this._audio?.playSFX('sfx_btn_tap'); this._go(this._step-1); });
    this._nextBtn = this._btn('Next →','mu-btn mu-btn-primary',   () => { this._audio?.playSFX('sfx_btn_tap'); this._step<STEPS.length-1 ? this._go(this._step+1) : this._ui.hide('how-to-play'); });
    this._prevBtn.style.flex='1'; this._nextBtn.style.flex='1';

    navRow.appendChild(this._prevBtn); navRow.appendChild(this._nextBtn);
    panel.appendChild(close); panel.appendChild(header);
    panel.appendChild(this._stepEl); panel.appendChild(this._dotsEl); panel.appendChild(navRow);
    overlay.appendChild(panel);
    this._render();
    return overlay;
  }

  _go(idx) {
    if (idx < 0 || idx >= STEPS.length) return;
    this._stepEl.style.opacity='0';
    setTimeout(() => { this._step=idx; this._render(); this._stepEl.style.opacity='1'; }, 150);
  }

  _render() {
    const s = STEPS[this._step];
    this._stepEl.innerHTML = `<div style="font-size:clamp(48px,14vw,64px);line-height:1;">${s.emoji}</div><div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:clamp(17px,5vw,20px);color:${COLORS.TEXT_PRIMARY};">${s.title}</div><div style="font-family:'Baloo 2',cursive;font-size:clamp(13px,3.5vw,15px);color:${COLORS.TEXT_SECONDARY};line-height:1.5;max-width:280px;">${s.body}</div>`;
    this._dotsEl.innerHTML = '';
    for (let i=0;i<STEPS.length;i++) {
      const d=document.createElement('div');
      d.style.cssText=`width:${i===this._step?20:8}px;height:8px;border-radius:4px;background:${i===this._step?COLORS.PRIMARY:'rgba(255,255,255,0.2)'};transition:all 0.25s ease;`;
      this._dotsEl.appendChild(d);
    }
    this._prevBtn.style.opacity       = this._step===0 ? '0.4' : '1';
    this._prevBtn.style.pointerEvents = this._step===0 ? 'none' : 'auto';
    this._nextBtn.textContent          = this._step===STEPS.length-1 ? '✓ Got it!' : 'Next →';
  }

  _btn(text, cls, fn) {
    const b=document.createElement('button');
    b.className=cls; b.textContent=text;
    b.addEventListener('click',fn);
    return b;
  }
}
