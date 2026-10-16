/**
 * src/gameplay/ScoreManager.js
 * Tracks card counts, emits updates for HUD.
 */

import { EventBus } from '../core/EventBus.js';
import { EVENTS }   from '../utils/Constants.js';

export class ScoreManager {
  constructor(players) {
    this._players = [...players];
    this._scores  = new Map();
    for (const p of players) this._scores.set(p.id, 0);
  }

  update() {
    for (const p of this._players) this._scores.set(p.id, p.totalCards);
    EventBus.emit(EVENTS.GAME_START, { scores: Object.fromEntries(this._scores) });
  }

  get scores()          { return new Map(this._scores); }
  getScore(playerID)    { return this._scores.get(playerID) ?? 0; }
}
