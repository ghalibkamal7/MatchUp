/**
 * src/ui/screens/MatchPopup.js
 * MATCH! flash overlay.
 */

import { COLORS, MATCH_FX } from '../../utils/Constants.js';

export class MatchPopup {
  constructor(ui) {
    this._ui = ui;
    this._el = this._build();
    this._ui.register('match-popup', this._el);
  }

  _build() {
    if (!document.getElementById('match-popup-kf')) {
      const s = document.createElement('style'); s.id='match-popup-kf';
      s.textContent = `@keyframes matchPunch{0%{transform:scale(0.4);opacity:0}70%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}`;
      document.head.appendChild(s);
    }
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;pointer-events:none;z-index:30;`;

    const vignette = document.createElement('div');
    vignette.style.cssText = `position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 30%,${MATCH_FX.VIGNETTE_COLOR} 100%);pointer-events:none;`;

    const text = document.createElement('div');
    text.style.cssText = `font-family:'Baloo 2',cursive;font-weight:800;font-size:${MATCH_FX.TEXT_SIZE};color:${MATCH_FX.TEXT_COLOR};text-shadow:0 0 30px ${MATCH_FX.TEXT_SHADOW},0 0 60px ${MATCH_FX.TEXT_SHADOW},0 4px 20px rgba(0,0,0,0.8);letter-spacing:0.08em;line-height:1;animation:matchPunch 0.3s ease-out;`;
    text.textContent = 'MATCH!';

    const stars = document.createElement('div');
    stars.style.cssText = `font-size:clamp(24px,7vw,40px);margin-top:8px;letter-spacing:8px;`;
    stars.textContent = '★ ★ ★';

    el.appendChild(vignette); el.appendChild(text); el.appendChild(stars);
    return el;
  }
}
