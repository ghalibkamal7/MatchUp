/**
 * src/core/SaveSystem.js
 * Complete persistence layer — swappable backend, versioning, checksum, backup.
 */

import { EventBus }      from './EventBus.js';
import { SaveMigration } from './SaveMigration.js';
import { DEBUG }         from '../utils/Constants.js';

const SCHEMA_VERSIONS = Object.freeze({
  settings:1, profile:1, statistics:1, coins:1, xp:1,
  achievements:1, collection:1, environments:1, audio:1,
  tutorial:1, daily:1, history:1,
});

const DEFAULTS = Object.freeze({
  settings:     { language:'en', vibration:true, notifications:true, theme:'default', cpuDifficulty:'medium', gameMode:'vs_cpu' },
  profile:      { name:'Player', avatarId:'default', createdAt:null, lastSeenAt:null, totalSessions:0 },
  statistics:   { matchesPlayed:0, matchesWon:0, matchesLost:0, totalMatches:0, totalPilesWon:0, longestWinStreak:0, currentWinStreak:0, fastestWin:null },
  coins:        { balance:100, totalEarned:0, totalSpent:0 },
  xp:           { total:0, level:1, currentLevelXP:0, nextLevelXP:100 },
  achievements: { unlocked:[], progress:{}, lastUnlockedAt:null },
  collection:   { unlockedBacks:['default'], activeBacks:'default', unlockedDecks:['classic'], activeDeck:'classic' },
  environments: { unlocked:['village_sunset'], active:'village_sunset', unlockedMusic:['default'], activeMusic:'default' },
  audio:        { masterVolume:0.9, musicVolume:0.35, sfxVolume:0.85, ambienceVolume:0.5, muted:false },
  tutorial:     { completed:false, currentStep:0, skipped:false, completedAt:null },
  daily:        { lastClaimDate:null, streak:0, totalClaimed:0, nextReward:null },
  history:      { recentMatches:[], bestScore:0 },
});

const KEY_PREFIX      = 'matchup_';
const AUTOSAVE_DELAY  = 2000;

class LocalStorageBackend {
  set(key, value)  { try { localStorage.setItem(key, value); } catch(e) { throw new Error(`Storage quota exceeded. Key: "${key}"`); } }
  get(key)         { return localStorage.getItem(key); }
  delete(key)      { localStorage.removeItem(key); }
  clear()          { Object.keys(localStorage).filter(k=>k.startsWith(KEY_PREFIX)).forEach(k=>localStorage.removeItem(k)); }
}

class SaveSystemClass {
  constructor() {
    this._backend       = new LocalStorageBackend();
    this._cache         = {};
    this._dirty         = new Set();
    this._autosaveTimer = null;
    this._initialized   = false;
  }

  init() {
    if (this._initialized) return;
    for (const category of Object.keys(DEFAULTS)) this._loadCategory(category);
    this._initialized = true;
    EventBus.emit('save:loaded', { categories: Object.keys(DEFAULTS) });
  }

  setBackend(backend) {
    ['get','set','delete','clear'].forEach(m => {
      if (typeof backend[m] !== 'function') throw new TypeError(`Backend missing method: "${m}"`);
    });
    this._backend = backend;
  }

  get(category, key) {
    this._assertInit(); this._assertCategory(category);
    const data = this._cache[category];
    return key !== undefined ? data[key] : { ...data };
  }

  set(category, updates) {
    this._assertInit(); this._assertCategory(category);
    if (typeof updates !== 'object' || updates === null) throw new TypeError('set() updates must be an object.');
    this._cache[category] = { ...this._cache[category], ...updates };
    this._dirty.add(category);
    this._scheduleAutosave();
  }

  save(category) {
    EventBus.emit('save:before', { category: category ?? 'all' });
    try {
      const toSave = category ? [category] : [...this._dirty];
      if (toSave.length === 0) return;
      for (const cat of toSave) { this._writeCategory(cat); this._writeBackup(cat); this._dirty.delete(cat); }
      EventBus.emit('save:success', { saved: toSave });
    } catch(err) {
      console.error('[SaveSystem] Save failed:', err);
      EventBus.emit('save:error', { error: err.message });
    }
  }

  reset(category) {
    if (category) {
      this._assertCategory(category);
      this._cache[category] = this._deepClone(DEFAULTS[category]);
      this._writeCategory(category);
    } else {
      for (const cat of Object.keys(DEFAULTS)) { this._cache[cat] = this._deepClone(DEFAULTS[cat]); this._writeCategory(cat); }
    }
    this._dirty.clear();
    EventBus.emit('save:reset', { category: category ?? 'all' });
  }

  exportSave() {
    const out = { version:1, exportedAt: new Date().toISOString(), game:'matchup', data:{} };
    for (const cat of Object.keys(DEFAULTS)) out.data[cat] = this._cache[cat];
    return JSON.stringify(out, null, 2);
  }

  importSave(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.game !== 'matchup') throw new Error('Not a MatchUp save file.');
      for (const cat of Object.keys(parsed.data)) { if (!DEFAULTS[cat]) throw new Error(`Unknown category: "${cat}"`); }
      for (const [cat, data] of Object.entries(parsed.data)) { this._cache[cat] = { ...DEFAULTS[cat], ...data }; this._writeCategory(cat); }
      EventBus.emit('save:loaded', { source:'import' });
      return true;
    } catch(err) {
      EventBus.emit('save:error', { error: err.message });
      return false;
    }
  }

  restoreBackup(category) {
    this._assertCategory(category);
    const raw = this._backend.get(`${KEY_PREFIX}backup_${category}`);
    if (!raw) { this.reset(category); return false; }
    try {
      const { data } = JSON.parse(raw);
      this._cache[category] = data;
      this._writeCategory(category);
      return true;
    } catch { this.reset(category); return false; }
  }

  _loadCategory(category) {
    const raw = this._backend.get(`${KEY_PREFIX}${category}`);
    if (!raw) { this._cache[category] = this._deepClone(DEFAULTS[category]); return; }
    try {
      const envelope = JSON.parse(raw);
      if (!this._verifyChecksum(envelope)) { this.restoreBackup(category); return; }
      const current = SCHEMA_VERSIONS[category], saved = envelope.version ?? 1;
      const data = saved < current ? SaveMigration.migrate(category, envelope.data, saved, current) : envelope.data;
      this._cache[category] = { ...DEFAULTS[category], ...data };
    } catch { this._cache[category] = this._deepClone(DEFAULTS[category]); }
  }

  _writeCategory(category) {
    const data = this._cache[category];
    this._backend.set(`${KEY_PREFIX}${category}`, JSON.stringify({
      version: SCHEMA_VERSIONS[category], savedAt: Date.now(), data, checksum: this._buildChecksum(data),
    }));
  }

  _writeBackup(category) {
    const data = this._cache[category];
    this._backend.set(`${KEY_PREFIX}backup_${category}`, JSON.stringify({
      version: SCHEMA_VERSIONS[category], savedAt: Date.now(), data, checksum: this._buildChecksum(data),
    }));
  }

  _scheduleAutosave() {
    if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
    this._autosaveTimer = setTimeout(() => { this.save(); this._autosaveTimer = null; }, AUTOSAVE_DELAY);
  }

  _buildChecksum(data) {
    const str = JSON.stringify(data); let sum = 0;
    for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
    return sum;
  }

  _verifyChecksum(envelope) {
    if (envelope.checksum === undefined) return true;
    return this._buildChecksum(envelope.data) === envelope.checksum;
  }

  _deepClone(obj)        { return JSON.parse(JSON.stringify(obj)); }
  _assertInit()          { if (!this._initialized) throw new Error('[SaveSystem] Call init() first.'); }
  _assertCategory(cat)   { if (!DEFAULTS[cat]) throw new Error(`[SaveSystem] Unknown category: "${cat}"`); }
}

const SaveSystem = new SaveSystemClass();
export { SaveSystem, DEFAULTS, SCHEMA_VERSIONS };
