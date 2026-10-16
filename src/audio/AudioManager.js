/**
 * src/audio/AudioManager.js
 * Master audio controller — Howler.js based, lazy-loading, silent-fail.
 */

import { Howl, Howler } from 'howler';
import { SaveSystem }   from '../core/SaveSystem.js';
import { AUDIO, DEBUG } from '../utils/Constants.js';

const AUDIO_FILES = import.meta.glob('/assets/audio/**/*.{mp3,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const SFX_REGISTRY = Object.freeze({
  sfx_matchstick:   { src:['/assets/audio/sfx/matchstick.mp3'],   volume: AUDIO.SFX_MATCHSTICK   },
  sfx_card_lift:    { src:['/assets/audio/sfx/card_lift.mp3'],    volume: AUDIO.SFX_CARD_LIFT     },
  sfx_card_flip:    { src:['/assets/audio/sfx/card_flip.mp3'],    volume: AUDIO.SFX_CARD_FLIP     },
  sfx_card_place:   { src:['/assets/audio/sfx/card_place.mp3'],   volume: AUDIO.SFX_CARD_PLACE    },
  sfx_match_freeze: { src:['/assets/audio/sfx/match_freeze.mp3'], volume: AUDIO.SFX_MATCH_FREEZE  },
  sfx_match_win:    { src:['/assets/audio/sfx/match_win.mp3'],    volume: AUDIO.SFX_MATCH_WIN     },
  sfx_pile_collect: { src:['/assets/audio/sfx/pile_collect.mp3'], volume: AUDIO.SFX_PILE_COLLECT  },
  sfx_deal:         { src:['/assets/audio/sfx/deal.mp3'],         volume: AUDIO.SFX_DEAL          },
  sfx_game_over:    { src:['/assets/audio/sfx/game_over.mp3'],    volume: AUDIO.SFX_GAME_OVER     },
  sfx_btn_tap:      { src:['/assets/audio/sfx/btn_tap.mp3'],      volume: AUDIO.SFX_BTN_TAP       },
  sfx_victory:      { src:['/assets/audio/sfx/victory.mp3'],      volume: AUDIO.SFX_VICTORY       },
});

const MUSIC_REGISTRY = Object.freeze({
  mus_village: { src:['/assets/audio/music/bg_village.mp3'], loop:true  },
  mus_menu:    { src:['/assets/audio/music/bg_menu.mp3'],    loop:true  },
  amb_birds:   { src:['/assets/audio/sfx/birds.mp3'],        loop:true  },
  amb_wind:    { src:['/assets/audio/sfx/wind.mp3'],         loop:true  },
});

class AudioManagerClass {
  constructor() {
    this._initialized  = false;
    this._muted        = false;
    this._masterVol    = AUDIO.MASTER;
    this._sfxVol       = AUDIO.SFX;
    this._musicVol     = AUDIO.MUSIC;
    this._ambienceVol  = AUDIO.AMBIENCE;
    this._sfxCache     = new Map();
    this._musicCache   = new Map();
    this._currentMusic = null;
  }

  init() {
    if (this._initialized) return;
    try {
      const saved = SaveSystem.get('audio');
      if (saved) {
        this._masterVol   = saved.masterVolume   ?? AUDIO.MASTER;
        this._sfxVol      = saved.sfxVolume      ?? AUDIO.SFX;
        this._musicVol    = saved.musicVolume     ?? AUDIO.MUSIC;
        this._ambienceVol = saved.ambienceVolume  ?? AUDIO.AMBIENCE;
        this._muted       = saved.muted           ?? false;
      }
    } catch(e) { /* SaveSystem may not be init yet */ }
    Howler.volume(this._muted ? 0 : this._masterVol);
    this._initialized = true;
  }

  playSFX(key, vol) {
    if (this._muted) return;
    const config = SFX_REGISTRY[key];
    if (!config) return;
    const available = this._availableAudio(config);
    if (!available) return;
    try {
      const howl = this._getSFXHowl(key, available);
      const id   = howl.play();
      if (vol !== undefined) howl.volume(vol * this._sfxVol, id);
    } catch(e) {
      if (DEBUG.ENABLED) console.warn(`[AudioManager] SFX "${key}" not found`);
    }
  }

  playMusic(key, fadeIn = AUDIO.MUSIC_FADE_IN * 1000) {
    if (this._currentMusic === key) return;
    if (this._currentMusic) this.stopMusic(this._currentMusic);
    const config = MUSIC_REGISTRY[key];
    if (!config) return;
    const available = this._availableAudio(config);
    if (!available) return;
    try {
      const howl = this._getMusicHowl(key, available);
      const id   = howl.play();
      howl.fade(0, this._musicVol, fadeIn, id);
      this._currentMusic = key;
    } catch(e) {
      if (DEBUG.ENABLED) console.warn(`[AudioManager] Music "${key}" not found`);
    }
  }

  stopMusic(key, fadeOut = AUDIO.MUSIC_FADE_OUT * 1000) {
    const howl = this._musicCache.get(key);
    if (!howl) return;
    howl.fade(howl.volume(), 0, fadeOut);
    setTimeout(() => howl.stop(), fadeOut + 50);
    if (this._currentMusic === key) this._currentMusic = null;
  }

  playAmbience(key) {
    const config = MUSIC_REGISTRY[key];
    if (!config) return;
    const available = this._availableAudio(config);
    if (!available) return;
    try {
      const howl = this._getMusicHowl(key, available);
      if (!howl.playing()) {
        const id = howl.play();
        howl.fade(0, this._ambienceVol, AUDIO.AMBIENCE_FADE_IN * 1000, id);
      }
    } catch(e) {}
  }

  setMasterVolume(vol) { this._masterVol = vol; Howler.volume(this._muted ? 0 : vol); this._save(); }
  setMusicVolume(vol)  {
    this._musicVol = vol;
    for (const [key, howl] of this._musicCache) {
      if (key.startsWith('mus_')) howl.volume(vol);
    }
    this._save();
  }
  setSFXVolume(vol) {
    this._sfxVol = vol;
    for (const [key, howl] of this._sfxCache) {
      howl.volume((SFX_REGISTRY[key]?.volume ?? 1) * vol);
    }
    this._save();
  }
  setMuted(muted)      { this._muted = muted; Howler.volume(muted ? 0 : this._masterVol); this._save(); }

  get isMuted()      { return this._muted; }
  get masterVolume() { return this._masterVol; }
  get musicVolume()  { return this._musicVol; }
  get sfxVolume()    { return this._sfxVol; }

  _getSFXHowl(key, config) {
    if (!this._sfxCache.has(key)) {
      this._sfxCache.set(key, new Howl({ src: config.src, volume: config.volume * this._sfxVol, preload: false }));
    }
    return this._sfxCache.get(key);
  }

  _getMusicHowl(key, config) {
    if (!this._musicCache.has(key)) {
      this._musicCache.set(key, new Howl({ src: config.src, loop: config.loop ?? false, volume: 0, preload: false }));
    }
    return this._musicCache.get(key);
  }

  _availableAudio(config) {
    const src = config.src.map(path => AUDIO_FILES[path]).filter(Boolean);
    return src.length ? { ...config, src } : null;
  }

  _save() {
    try {
      SaveSystem.set('audio', {
        masterVolume: this._masterVol, musicVolume: this._musicVol,
        sfxVolume: this._sfxVol, ambienceVolume: this._ambienceVol, muted: this._muted,
      });
    } catch(e) {}
  }
}

const AudioManager = new AudioManagerClass();
export { AudioManager };
