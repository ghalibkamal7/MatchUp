/**
 * src/ui/screens/SettingsScreen.js
 */

import { SaveSystem } from '../../core/SaveSystem.js';
import { COLORS }     from '../../utils/Constants.js';

export class SettingsScreen {
  constructor(ui, audio) {
    this._ui = ui; this._audio = audio;
    this._el = this._build();
    this._ui.register('settings', this._el);
  }

  _build() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;pointer-events:auto;backdrop-filter:blur(6px);`;

    const panel = document.createElement('div');
    panel.className = 'mu-panel';
    panel.style.cssText = `width:min(340px,92vw);padding:32px 24px;display:flex;flex-direction:column;gap:20px;position:relative;`;

    const title = document.createElement('h2');
    title.className = 'mu-title'; title.style.cssText='font-size:22px;text-align:center;'; title.textContent='Settings';

    const close = document.createElement('button');
    close.style.cssText=`position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.08);color:#fff;font-size:16px;cursor:pointer;pointer-events:auto;`;
    close.textContent='✕';
    close.addEventListener('click', () => { this._audio?.playSFX('sfx_btn_tap'); this._ui.hide('settings'); });

    let audio;
    try { audio = SaveSystem.get('audio'); } catch(e) { audio = {}; }
    let settings;
    try { settings = SaveSystem.get('settings'); } catch(e) { settings = {}; }

    panel.appendChild(close); panel.appendChild(title);
    panel.appendChild(this._slider('Master Volume', 'masterVolume', audio?.masterVolume ?? 0.9));
    panel.appendChild(this._slider('Music',         'musicVolume',  audio?.musicVolume  ?? 0.35));
    panel.appendChild(this._slider('Sound Effects', 'sfxVolume',    audio?.sfxVolume    ?? 0.85));
    panel.appendChild(this._toggle('Vibration',     'vibration',    settings?.vibration ?? true));

    const save = document.createElement('button');
    save.className='mu-btn mu-btn-primary'; save.style.width='100%'; save.textContent='Save';
    save.addEventListener('click', () => { try { SaveSystem.save(); } catch(e){} this._audio?.playSFX('sfx_btn_tap'); this._ui.hide('settings'); });

    panel.appendChild(save);
    overlay.appendChild(panel);
    return overlay;
  }

  _slider(label, key, value) {
    const row = document.createElement('div');
    row.style.cssText = `display:flex;flex-direction:column;gap:6px;`;
    const lbl = document.createElement('label');
    lbl.style.cssText = `font-family:'Baloo 2',cursive;font-size:13px;color:${COLORS.TEXT_SECONDARY};display:flex;justify-content:space-between;`;
    const valEl = document.createElement('span');
    valEl.style.color = COLORS.PRIMARY; valEl.textContent = Math.round(value*100)+'%';
    lbl.textContent = label; lbl.appendChild(valEl);
    const input = document.createElement('input');
    input.type='range'; input.min='0'; input.max='100'; input.value=Math.round(value*100);
    input.style.cssText=`width:100%;accent-color:${COLORS.PRIMARY};`;
    input.addEventListener('input', () => {
      const v=input.value/100; valEl.textContent=input.value+'%';
      if (key==='masterVolume') this._audio?.setMasterVolume(v);
      if (key==='musicVolume')  this._audio?.setMusicVolume(v);
      if (key==='sfxVolume')    this._audio?.setSFXVolume(v);
    });
    row.appendChild(lbl); row.appendChild(input);
    return row;
  }

  _toggle(label, key, value) {
    const row = document.createElement('div');
    row.style.cssText = `display:flex;justify-content:space-between;align-items:center;`;
    const lbl = document.createElement('span');
    lbl.style.cssText = `font-family:'Baloo 2',cursive;font-size:14px;color:${COLORS.TEXT_PRIMARY};`;
    lbl.textContent = label;
    const cb = document.createElement('input');
    cb.type='checkbox'; cb.checked=value;
    cb.style.cssText=`width:20px;height:20px;accent-color:${COLORS.PRIMARY};cursor:pointer;`;
    cb.addEventListener('change', () => { try { SaveSystem.set('settings',{[key]:cb.checked}); } catch(e){} });
    row.appendChild(lbl); row.appendChild(cb);
    return row;
  }
}
